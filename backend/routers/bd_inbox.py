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


class TextImportRequest(BaseModel):
    """Bulk import via pasted listing text — for sources we can't fetch
    (FB Marketplace is JS-rendered, login-walled, or otherwise opaque).
    Each item is one listing's text. Separate listings in the UI with
    `---` and the frontend splits before submitting.
    """
    texts: List[str]
    owner_id: Optional[str] = None
    source_hint: Optional[str] = "facebook"  # what source this came from
    source_url_hint: Optional[str] = None    # if user has a reference URL


VALID_STATUSES = {
    "queued", "extracting", "extracted", "drafted",
    "sent", "replied", "won", "lost", "failed",
}


# ========== HELPERS ==========

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def require_admin(owner_id: Optional[str]) -> None:
    """Gate: only users with is_admin=True may use BD Inbox endpoints.

    Raises 403 for missing owner_id, unknown user, or non-admin.
    """
    if not owner_id:
        raise HTTPException(status_code=403, detail="Admin access required.")
    user = await db.users.find_one({"id": owner_id}, {"_id": 0, "is_admin": 1})
    if not user or not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required.")


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


# Phrases that indicate Claude couldn't extract real data (e.g. FB SPA shell
# fetched without JS rendering). When Claude apologizes in the title or
# description, we mark the lead as failed instead of letting a useless draft
# poison the outreach pipeline.
_GARBAGE_PHRASES = (
    "corrupt", "invalid", "cannot extract", "could not extract",
    "no readable", "no data", "unable to", "apologize", "appears to be",
    "i cannot", "i'm sorry", "encoded improperly", "encoding error",
    "no listing", "not a listing", "no information",
)


def _is_garbage_extraction(draft) -> bool:
    """Return True if the LLM output is a polite refusal / apology rather
    than a real listing extraction.

    Common cause: source page was JS-rendered (FB Marketplace) and our
    plain-HTTP fetch returned the SPA shell, so Claude got HTML scaffolding
    with no actual content.
    """
    title = (draft.title or "").lower()
    desc = (draft.description or "").lower()
    for phrase in _GARBAGE_PHRASES:
        if phrase in title or phrase in desc:
            return True
    # Empty-shell heuristic: no title, no price, no bedrooms, no address,
    # and a tiny description is almost certainly a failed extraction.
    if (
        not draft.title.strip()
        and draft.price == 0
        and draft.bedrooms == 0
        and not draft.address.strip()
        and len(desc) < 50
    ):
        return True
    return False


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

            if _is_garbage_extraction(draft):
                hint = (
                    "FB Marketplace pages are JS-rendered — our URL fetch only "
                    "sees the empty SPA shell. Use the paste-text fallback: open "
                    "the listing, copy the title + price + description, and "
                    "submit it via 'Listing text' mode."
                ) if source == "facebook" else (
                    "Could not extract real listing data from the page. Try "
                    "the paste-text fallback with the listing's text content."
                )
                await db.bd_leads.update_one(
                    {"id": lead_id},
                    {"$set": {
                        "status": "failed",
                        "source": source,
                        "draft": None,
                        "error": hint,
                        "updated_at": _now(),
                    }},
                )
                logger.info("Lead %s: garbage extraction from %s", lead_id, source)
                return

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
            # Auto-draft the outreach message so the BD user can just hit Send.
            await _auto_draft_lead(lead_id)

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


async def _extract_one_text(lead_id: str) -> None:
    """Background task for pasted-text leads.

    Skips the HTML fetch step entirely and feeds the user's pasted text
    directly to Claude. Used when the source page can't be fetched
    (FB Marketplace JS shell, login-walled pages, screenshots OCR'd by
    the user, etc.).
    """
    async with _extract_semaphore:
        lead = await db.bd_leads.find_one({"id": lead_id}, {"_id": 0})
        if not lead:
            logger.warning("Lead %s vanished before text extraction", lead_id)
            return

        pasted = (lead.get("pasted_text") or "").strip()
        if len(pasted) < 50:
            await db.bd_leads.update_one(
                {"id": lead_id},
                {"$set": {
                    "status": "failed",
                    "error": "Pasted text too short (under 50 chars).",
                    "updated_at": _now(),
                }},
            )
            return

        try:
            await db.bd_leads.update_one(
                {"id": lead_id},
                {"$set": {"status": "extracting", "updated_at": _now()}},
            )

            text_for_llm = pasted[:MAX_HTML_CHARS_FOR_LLM]

            # If the pasted text contains a URL (the user copied it from the
            # listing or pasted it explicitly), grab the first one as
            # source_url so the "Open Source" button works later.
            embedded_url = None
            url_match = re.search(r"https?://[^\s\)\]\}]+", pasted)
            if url_match:
                embedded_url = url_match.group(0).rstrip(".,;)")

            parsed = await _extract_with_claude(text_for_llm)
            draft = _coerce_draft(parsed)
            source = lead.get("source", "pasted")
            contact = _guess_contact(source, text_for_llm)

            if _is_garbage_extraction(draft):
                await db.bd_leads.update_one(
                    {"id": lead_id},
                    {"$set": {
                        "status": "failed",
                        "draft": None,
                        "error": (
                            "Pasted text didn't look like a listing. Include "
                            "the title, price, and description — at minimum."
                        ),
                        "updated_at": _now(),
                    }},
                )
                return

            extracted_updates = {
                "status": "extracted",
                "draft": draft.model_dump(),
                "confidence": _confidence_for(draft),
                "contact_method": contact["contact_method"],
                "contact_value": contact["contact_value"],
                "updated_at": _now(),
            }
            # Save the URL we sniffed out of the paste, if we have one and
            # the lead doesn't already have one set.
            if embedded_url and not lead.get("source_url"):
                extracted_updates["source_url"] = embedded_url

            await db.bd_leads.update_one({"id": lead_id}, {"$set": extracted_updates})
            logger.info("Lead %s extracted from pasted text (%s)", lead_id, source)
            await _auto_draft_lead(lead_id)

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
            logger.exception("Text extraction crashed for %s", lead_id)
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
    await require_admin(req.owner_id)
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


@router.post("/import-text")
async def bulk_import_text(req: TextImportRequest, background: BackgroundTasks):
    """Bulk import via pasted listing text. Use this for FB Marketplace
    (JS-rendered, our URL fetch only sees the empty SPA shell) or any
    source we can't fetch directly.

    No upper limit on text-blocks. Concurrency throttled server-side.
    """
    await require_admin(req.owner_id)
    texts = [t.strip() for t in (req.texts or []) if t and t.strip()]
    if not texts:
        raise HTTPException(status_code=400, detail="No text blocks provided.")

    created = []
    now = _now()
    source = req.source_hint or "pasted"

    for text in texts:
        if len(text) < 50:
            continue  # too short to be a real listing

        lead = {
            "id": str(uuid.uuid4()),
            "owner_id": req.owner_id,
            "source_url": req.source_url_hint or "",
            "source": source,
            "status": "queued",
            "pasted_text": text,  # what we'll feed to Claude
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
        background.add_task(_extract_one_text, lead["id"])

    return {
        "ok": True,
        "created": len(created),
        "skipped_short": len(texts) - len(created),
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
    await require_admin(owner_id)
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
    await require_admin(owner_id)
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
    existing = await db.bd_leads.find_one({"id": lead_id}, {"_id": 0, "owner_id": 1})
    if not existing:
        raise HTTPException(status_code=404, detail="Lead not found")
    await require_admin(existing.get("owner_id"))
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
    existing = await db.bd_leads.find_one({"id": lead_id}, {"_id": 0, "owner_id": 1})
    if not existing:
        raise HTTPException(status_code=404, detail="Lead not found")
    await require_admin(existing.get("owner_id"))
    result = await db.bd_leads.delete_one({"id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"ok": True}


# ---- Outreach drafting ----

DRAFT_PROMPT = """You're Rishabh, a Vancouver-based founder building Dommma — a local rental marketplace launching this summer. You're writing a casual outreach message to a landlord who posted a rental publicly. The goal: get permission to feature their listing on Dommma before launch.

LISTING DETAILS:
- Title: {title}
- Price: ${price}/mo
- Beds/Baths: {bedrooms}/{bathrooms}
- Neighborhood: {city}, {province}
- Description excerpt: {description}
- Source: {source}
- Channel you're using to message them: {channel}

WRITE A MESSAGE THAT:
1. Opens with "Hi —" (no name, we don't have it)
2. References ONE specific, non-obvious detail from the listing description (not just price+location, which sounds robotic — find something in the description: "the in-suite laundry", "the south-facing balcony", "June 1 move-in", "the parking", "Kits walkability", etc.)
3. Has ONE line of credibility: "I'm a Vancouver founder building Dommma (a local rental marketplace launching this summer)"
4. Explains the value to THEM in one line: pre-launch I'm featuring real local listings so renters see actual inventory instead of stock photos / dummy data
5. Soft ask, phrased as a question: "Would you mind if I included yours?" or "OK if I add yours?" — NEVER "Reply YES and I'll mirror it"
6. Reassures: free, no signup on their end, they can have it taken down anytime
7. Ends with an easy out: "totally OK to say no, just figured I'd ask" or similar
8. Signs off "— Rishabh" only (no title, no link, no signature)

HARD BANS:
- No emojis
- No exclamation marks
- No "Reply YES and I'll..."
- No "for free!" or "amazing opportunity"
- No "limited time" / fake urgency
- No quarter naming ("Q3 2026") — use natural phrasing like "this summer"
- No SaaS-speak ("leverage", "platform", "solution")
- Don't sound eager ("I'd love to", "would be amazing")
- Don't list features ("AI lease review!" / "no scammy fees!") — sounds like a pitch deck
- Don't say "founder-led" or "VC-free" — those phrases scream marketing

VOICE EXAMPLES (write in this register):

Example A — Craigslist studio at $1,950 West End with laundry + concierge:
Hi — saw the West End studio you have up for $1,950. The in-suite laundry plus concierge combo is exactly what a lot of renters I've talked to are after. I'm a Vancouver founder building Dommma (a local rental marketplace launching this summer), and ahead of launch I'm featuring real Vancouver listings so renters see actual inventory instead of stock photos. Would you mind if I added yours? No signup on your end, free, take it down whenever. Totally OK to say no — just figured I'd ask. — Rishabh

Example B — FB Marketplace 2BR Mt Pleasant $2,800, June 1 move-in, parking:
Hi — your 2BR in Mt Pleasant caught my eye, especially with the parking and June 1 move-in. I'm a Vancouver founder building Dommma (a small local rental marketplace, launching this summer). Pre-launch I'm adding real local listings so renters see actual inventory rather than dummy data. Would you be open to me adding yours? No signup, free, you can have it pulled anytime. Either way, no worries — just figured I'd ask. — Rishabh

LENGTH: 4-6 sentences. 350-500 characters total. Slightly conversational, not terse.

Return ONLY the message text. Start with "Hi —". End with "— Rishabh". No extra commentary.
"""


def _channel_label_for(source: str, contact_method: str) -> str:
    """How will the user actually send this? Tells Claude which voice fits.
    e.g. an email reads more polished than a quick FB DM."""
    if contact_method == "email":
        return "email (will be sent via mailto)"
    if contact_method == "phone":
        return "SMS"
    if source == "facebook":
        return "Facebook DM"
    if source == "kijiji":
        return "Kijiji in-platform message"
    return "direct message"


async def _generate_message_for_lead(lead: Dict[str, Any]) -> str:
    """Pure helper: takes a lead document, returns a generated outreach message.
    Used by both the manual draft endpoint and the auto-draft background step.
    Raises HTTPException(400) if the lead can't be drafted from (missing
    title/price), so callers can decide whether to surface the error.
    """
    draft = lead.get("draft") or {}
    if not draft.get("title") or int(draft.get("price", 0) or 0) <= 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Lead extraction was incomplete (no title or price). "
                "Re-import via the paste-text fallback with the listing's "
                "actual text content."
            ),
        )

    description = (draft.get("description") or "")[:600]
    prompt = DRAFT_PROMPT.format(
        title=draft.get("title", "your listing"),
        price=draft.get("price", "n/a"),
        bedrooms=draft.get("bedrooms", "?"),
        bathrooms=draft.get("bathrooms", "?"),
        city=draft.get("city", "Vancouver"),
        province=draft.get("province", "BC"),
        description=description,
        source=lead.get("source", "their post"),
        channel=_channel_label_for(lead.get("source", ""), lead.get("contact_method", "")),
    )

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")

    from anthropic import AsyncAnthropic
    client = AsyncAnthropic(api_key=api_key)

    msg = await client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}],
    )

    text = ""
    for block in msg.content:
        if getattr(block, "type", None) == "text":
            text += block.text
    return text.strip()


async def _auto_draft_lead(lead_id: str) -> None:
    """Background helper: generate + save a draft message right after
    successful extraction. Silently no-ops if extraction is incomplete."""
    lead = await db.bd_leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead or lead.get("status") != "extracted":
        return
    try:
        message = await _generate_message_for_lead(lead)
        await db.bd_leads.update_one(
            {"id": lead_id},
            {"$set": {
                "drafted_message": message,
                "status": "drafted",
                "updated_at": _now(),
            }},
        )
        logger.info("Lead %s auto-drafted", lead_id)
    except HTTPException as e:
        # 400 (incomplete draft) is expected — just leave at 'extracted'
        logger.info("Lead %s skipped auto-draft: %s", lead_id, e.detail)
    except Exception as e:
        logger.exception("Auto-draft crashed for %s", lead_id)


@router.post("/leads/{lead_id}/draft-message")
async def draft_outreach(lead_id: str):
    """Use Claude to (re-)draft a personalized outreach message for this lead.
    Most leads will already have a draft from the auto-draft pipeline; this
    endpoint lets the user redraft if they don't like the first version."""
    lead = await db.bd_leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    await require_admin(lead.get("owner_id"))
    if lead.get("status") not in {"extracted", "drafted", "sent", "replied"}:
        raise HTTPException(
            status_code=400,
            detail=f"Lead not ready for drafting (status={lead.get('status')}). Wait for extraction.",
        )

    try:
        text = await _generate_message_for_lead(lead)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Draft generation failed")
        raise HTTPException(status_code=502, detail=f"Claude error: {e!s}")

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
    await require_admin(lead.get("owner_id"))

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
