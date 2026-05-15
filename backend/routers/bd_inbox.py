"""
BD Inbox — bulk outreach pipeline.

Founder/BD pastes any number of public listing URLs (FB Marketplace,
Craigslist, Kijiji). Each becomes a lead in the bd_leads collection.
A background worker extracts listing details via the same pipeline as
import-from-url. Once extracted, the BD can:
  - Draft a personalized outreach message (Claude)
  - Send via mailto/sms/fb DM (handled in frontend)
  - Convert to a live listing once the landlord says yes

User-initiated only. No scraping at scale; each lead requires explicit
landlord consent before it becomes a published listing.

See: docs/PRD-bd-inbox.md
"""
import os
import re
import uuid
import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from pydantic import BaseModel

from db import db

# Reuse the extraction pipeline shipped with import-from-url
from routers.listing_import import (
    _resolve_source,
    _fetch_html,
    _extract_meta_tags,
    _strip_html_to_text,
    _extract_image_urls,
    _extract_with_claude,
    _coerce_draft,
    _confidence_for,
    MAX_HTML_CHARS_FOR_LLM,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/bd-inbox", tags=["bd-inbox"])


# ========== CONCURRENCY ==========
# Cap simultaneous in-flight extractions so we don't trip upstream rate
# limits (target sites) or our own Anthropic quota.
EXTRACT_CONCURRENCY = 5
_extract_semaphore = asyncio.Semaphore(EXTRACT_CONCURRENCY)


# ========== MODELS ==========

class BulkImportRequest(BaseModel):
    urls: List[str]
    owner_id: Optional[str] = None


class LeadUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    contact_method: Optional[str] = None
    contact_value: Optional[str] = None
    drafted_message: Optional[str] = None


VALID_STATUSES = {
    "queued", "extracting", "extracted", "drafted",
    "sent", "replied", "won", "lost", "failed",
}


# ========== HELPERS ==========

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _guess_contact(source: str, raw_text: str) -> Dict[str, str]:
    """Best-effort: pull a phone/email from the listing body, otherwise
    default the channel based on source."""
    # Strip URLs first so we don't pick phone numbers from query strings
    text = re.sub(r"https?://\S+", " ", raw_text)

    # NA phone formats: (604) 555-1212, 604-555-1212, 604.555.1212, 6045551212
    phone_match = re.search(
        r"(?:(?:\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4}))",
        text,
    )
    if phone_match:
        digits = "".join(phone_match.groups())
        if len(digits) == 10 and digits[0] in "2345678":
            return {"contact_method": "phone", "contact_value": digits}

    email_match = re.search(
        r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
        text,
    )
    if email_match:
        return {"contact_method": "email", "contact_value": email_match.group(0)}

    if source == "facebook":
        return {"contact_method": "fb_dm", "contact_value": ""}
    if source == "craigslist":
        return {"contact_method": "email", "contact_value": ""}
    if source == "kijiji":
        return {"contact_method": "kijiji_message", "contact_value": ""}
    return {"contact_method": "unknown", "contact_value": ""}


async def _extract_one(lead_id: str) -> None:
    """Background task: fetch + extract + update a single lead.

    Uses the shared semaphore so we never have more than EXTRACT_CONCURRENCY
    extractions running simultaneously.
    """
    async with _extract_semaphore:
        lead = await db.bd_leads.find_one({"id": lead_id}, {"_id": 0})
        if not lead:
            logger.warning("Lead %s vanished before extraction", lead_id)
            return

        url = lead["source_url"]
        try:
            await db.bd_leads.update_one(
                {"id": lead_id},
                {"$set": {"status": "extracting", "updated_at": _now()}},
            )

            source = _resolve_source(url)
            html_text = await _fetch_html(url)
            meta = _extract_meta_tags(html_text)
            text_for_llm = _strip_html_to_text(html_text)

            # Seed with OG tags for token efficiency
            seed_lines = []
            for k in ("og:title", "og:description", "og:price:amount"):
                if meta.get(k):
                    seed_lines.append(f"{k}: {meta[k]}")
            if seed_lines:
                text_for_llm = "\n".join(seed_lines) + "\n\n" + text_for_llm
            text_for_llm = text_for_llm[:MAX_HTML_CHARS_FOR_LLM]

            parsed = await _extract_with_claude(text_for_llm)
            draft = _coerce_draft(parsed)
            images = _extract_image_urls(html_text, meta)
            contact = _guess_contact(source, text_for_llm)

            await db.bd_leads.update_one(
                {"id": lead_id},
                {"$set": {
                    "status": "extracted",
                    "source": source,
                    "draft": draft.model_dump(),
                    "images": images,
                    "confidence": _confidence_for(draft),
                    "contact_method": contact["contact_method"],
                    "contact_value": contact["contact_value"],
                    "updated_at": _now(),
                }},
            )
            logger.info("Lead %s extracted from %s", lead_id, source)

        except HTTPException as e:
            await db.bd_leads.update_one(
                {"id": lead_id},
                {"$set": {
                    "status": "failed",
                    "error": f"{e.status_code}: {e.detail}",
                    "updated_at": _now(),
                }},
            )
        except Exception as e:
            logger.exception("Extraction crashed for %s", lead_id)
            await db.bd_leads.update_one(
                {"id": lead_id},
                {"$set": {
                    "status": "failed",
                    "error": str(e)[:500],
                    "updated_at": _now(),
                }},
            )


def _dedupe_urls(urls: List[str]) -> List[str]:
    """Normalize + dedupe — strip whitespace, drop empties, drop obvious dupes."""
    seen = set()
    out = []
    for u in urls:
        u = (u or "").strip()
        if not u:
            continue
        # Strip query string fragments for dedupe key, keep original for fetch
        key = u.split("?")[0].rstrip("/")
        if key in seen:
            continue
        seen.add(key)
        out.append(u)
    return out


# ========== ROUTES ==========

@router.post("/import")
async def bulk_import(req: BulkImportRequest, background: BackgroundTasks):
    """Create leads for any number of URLs. Returns immediately;
    extraction runs in the background.

    No upper limit on URLs. Concurrency is throttled server-side.
    """
    urls = _dedupe_urls(req.urls)
    if not urls:
        raise HTTPException(status_code=400, detail="No URLs provided.")

    created = []
    skipped_existing = 0
    now = _now()

    for url in urls:
        # Skip if we already have a non-failed lead for this URL by this owner
        existing = await db.bd_leads.find_one(
            {
                "source_url": url,
                "owner_id": req.owner_id,
                "status": {"$nin": ["failed"]},
            },
            {"_id": 0, "id": 1},
        )
        if existing:
            skipped_existing += 1
            continue

        lead = {
            "id": str(uuid.uuid4()),
            "owner_id": req.owner_id,
            "source_url": url,
            "source": "pending",
            "status": "queued",
            "draft": None,
            "images": [],
            "confidence": None,
            "contact_method": "unknown",
            "contact_value": "",
            "drafted_message": "",
            "notes": "",
            "error": "",
            "created_at": now,
            "updated_at": now,
            "sent_at": None,
            "replied_at": None,
        }
        await db.bd_leads.insert_one(lead)
        created.append(lead["id"])
        background.add_task(_extract_one, lead["id"])

    return {
        "ok": True,
        "created": len(created),
        "skipped_existing": skipped_existing,
        "total_submitted": len(urls),
        "lead_ids": created,
    }


@router.get("/leads")
async def list_leads(
    owner_id: Optional[str] = None,
    status: Optional[str] = Query(None, description="Comma-separated statuses to filter"),
    source: Optional[str] = None,
    limit: int = 200,
    skip: int = 0,
):
    """List leads with optional filtering."""
    query: Dict[str, Any] = {}
    if owner_id:
        query["owner_id"] = owner_id
    if source:
        query["source"] = source
    if status:
        statuses = [s.strip() for s in status.split(",") if s.strip()]
        query["status"] = {"$in": statuses}

    cursor = db.bd_leads.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(min(limit, 500))
    leads = await cursor.to_list(min(limit, 500))
    total = await db.bd_leads.count_documents(query)
    return {"leads": leads, "total": total}


@router.get("/stats")
async def lead_stats(owner_id: Optional[str] = None):
    """Status counts for the header pills."""
    match: Dict[str, Any] = {}
    if owner_id:
        match["owner_id"] = owner_id

    pipeline = []
    if match:
        pipeline.append({"$match": match})
    pipeline.append({"$group": {"_id": "$status", "count": {"$sum": 1}}})
    rows = await db.bd_leads.aggregate(pipeline).to_list(50)
    counts = {row["_id"]: row["count"] for row in rows}
    total = sum(counts.values())
    return {"counts": counts, "total": total}


@router.patch("/leads/{lead_id}")
async def update_lead(lead_id: str, body: LeadUpdate):
    """Patch a lead's status / notes / contact / drafted_message."""
    updates: Dict[str, Any] = {"updated_at": _now()}

    if body.status is not None:
        if body.status not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status: {body.status}")
        updates["status"] = body.status
        if body.status == "sent":
            updates["sent_at"] = _now()
        if body.status == "replied":
            updates["replied_at"] = _now()

    if body.notes is not None:
        updates["notes"] = body.notes[:5000]
    if body.contact_method is not None:
        updates["contact_method"] = body.contact_method
    if body.contact_value is not None:
        updates["contact_value"] = body.contact_value[:200]
    if body.drafted_message is not None:
        updates["drafted_message"] = body.drafted_message[:5000]

    result = await db.bd_leads.update_one({"id": lead_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead = await db.bd_leads.find_one({"id": lead_id}, {"_id": 0})
    return {"ok": True, "lead": lead}


@router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str):
    result = await db.bd_leads.delete_one({"id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"ok": True}


# ---- Outreach drafting ----

DRAFT_PROMPT = """You are drafting a short, personal Facebook DM / email / SMS from Rishabh, co-founder of Dommma — a Vancouver-only rental marketplace launching Q3 2026. The goal: get a landlord to mirror their existing rental listing onto Dommma. Free, no fees, they can take it down anytime.

LISTING DETAILS:
- Title: {title}
- Price: ${price}/mo
- Beds/Baths: {bedrooms} / {bathrooms}
- Neighborhood: {city}, {province}
- Source: {source}

STYLE RULES:
- 3-4 sentences max, under 280 characters total
- Lead with one specific detail from THEIR listing (price + location + bed count) so they know it's not a bot
- Mention Dommma is Vancouver-only and founder-led (not VC marketing spam)
- One concrete ask: "Reply YES and I'll mirror it for you" — no Calendly links, no forms, no "let me know if you have questions"
- No emojis, no exclamation marks, no excessive enthusiasm
- Sound like a real founder, not a marketer

Return ONLY the message text. No greeting like "Hi [Name]" because we don't know their name. No sign-off other than "— Rishabh, Dommma".
"""


@router.post("/leads/{lead_id}/draft-message")
async def draft_outreach(lead_id: str):
    """Use Claude to draft a personalized outreach message for this lead."""
    lead = await db.bd_leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if lead.get("status") not in {"extracted", "drafted", "sent", "replied"}:
        raise HTTPException(
            status_code=400,
            detail=f"Lead not ready for drafting (status={lead.get('status')}). Wait for extraction.",
        )

    draft = lead.get("draft") or {}
    prompt = DRAFT_PROMPT.format(
        title=draft.get("title", "your listing"),
        price=draft.get("price", "n/a"),
        bedrooms=draft.get("bedrooms", "?"),
        bathrooms=draft.get("bathrooms", "?"),
        city=draft.get("city", "Vancouver"),
        province=draft.get("province", "BC"),
        source=lead.get("source", "their post"),
    )

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")

    from anthropic import AsyncAnthropic
    client = AsyncAnthropic(api_key=api_key)

    try:
        msg = await client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as e:
        logger.exception("Draft generation failed")
        raise HTTPException(status_code=502, detail=f"Claude error: {e!s}")

    text = ""
    for block in msg.content:
        if getattr(block, "type", None) == "text":
            text += block.text
    text = text.strip()

    await db.bd_leads.update_one(
        {"id": lead_id},
        {"$set": {
            "drafted_message": text,
            "status": "drafted",
            "updated_at": _now(),
        }},
    )

    return {"ok": True, "message": text}


# ---- Convert lead → live listing ----

class ConvertRequest(BaseModel):
    owns_content: bool = False
    overrides: Optional[Dict[str, Any]] = None  # let frontend tweak fields before publishing


@router.post("/leads/{lead_id}/convert")
async def convert_to_listing(lead_id: str, body: ConvertRequest):
    """Convert an extracted lead into a published Dommma listing.
    Requires explicit ownership confirmation."""
    if not body.owns_content:
        raise HTTPException(
            status_code=400,
            detail="Landlord ownership must be confirmed before publishing.",
        )

    lead = await db.bd_leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    draft = lead.get("draft") or {}
    if not draft.get("title") or draft.get("price", 0) <= 0:
        raise HTTPException(
            status_code=400,
            detail="Lead draft missing title or price — can't publish.",
        )

    # Apply user-side overrides (corrections made in the inbox)
    if body.overrides:
        draft = {**draft, **body.overrides}

    listing = {
        "id": str(uuid.uuid4()),
        "title": draft.get("title", ""),
        "address": draft.get("address", ""),
        "city": draft.get("city", "Vancouver"),
        "province": draft.get("province", "BC"),
        "postal_code": draft.get("postal_code", ""),
        "lat": 49.2827,
        "lng": -123.1207,
        "price": int(draft.get("price", 0)),
        "bedrooms": int(draft.get("bedrooms", 0)),
        "bathrooms": float(draft.get("bathrooms", 0)),
        "sqft": int(draft.get("sqft", 0)),
        "property_type": draft.get("property_type", "apartment"),
        "description": (
            (draft.get("description") or "")
            + f"\n\n[Imported via BD inbox — source: {lead.get('source_url', 'pasted')}]"
        ),
        "amenities": draft.get("amenities", []),
        "images": lead.get("images", []),
        "available_date": draft.get("available_date", ""),
        "pet_friendly": bool(draft.get("pet_friendly", False)),
        "parking": bool(draft.get("parking", False)),
        "listing_type": draft.get("listing_type", "rent"),
        "owner_id": lead.get("owner_id"),
        "user_id": lead.get("owner_id"),
        "landlord_id": lead.get("owner_id"),
        "status": "active",
        "featured": False,
        "source_lead_id": lead_id,
        "source_url": lead.get("source_url"),
        "created_at": _now(),
    }
    await db.listings.insert_one(listing)

    await db.bd_leads.update_one(
        {"id": lead_id},
        {"$set": {
            "status": "won",
            "listing_id": listing["id"],
            "updated_at": _now(),
        }},
    )

    return {"ok": True, "listing_id": listing["id"]}
