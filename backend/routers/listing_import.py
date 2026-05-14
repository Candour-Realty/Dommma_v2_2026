"""
Import Listing from URL router.

Pulls a public listing page (Facebook Marketplace, Craigslist, Kijiji)
the user owns, extracts structured listing data via Claude, returns a
pre-filled draft for the user to review and publish.

User-initiated only. No scraping at scale.
See: docs/PRD-import-from-url.md
"""
import os
import re
import json
import html
import logging
from urllib.parse import urlparse
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/listings", tags=["listings-import"])


# ========== CONFIG ==========

SUPPORTED_DOMAINS = {
    "facebook.com": "facebook",
    "www.facebook.com": "facebook",
    "m.facebook.com": "facebook",
    "craigslist.org": "craigslist",
    "vancouver.craigslist.org": "craigslist",
    "kijiji.ca": "kijiji",
    "www.kijiji.ca": "kijiji",
}

# Browser-like headers — most public listing pages serve content to a UA
# that looks like a real Chrome. We do NOT bypass auth walls.
DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-CA,en;q=0.9,en-US;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
}

FETCH_TIMEOUT = 25.0
MAX_HTML_CHARS_FOR_LLM = 12000  # cap to control token cost


# ========== MODELS ==========

class ImportRequest(BaseModel):
    url: str
    pasted_text: Optional[str] = None  # fallback when fetch is blocked


class ImportDraft(BaseModel):
    title: str = ""
    address: str = ""
    city: str = ""
    province: str = "BC"
    postal_code: str = ""
    price: int = 0
    bedrooms: int = 0
    bathrooms: float = 0
    sqft: int = 0
    property_type: str = "apartment"
    description: str = ""
    pet_friendly: bool = False
    parking: bool = False
    available_date: str = ""
    listing_type: str = "rent"
    amenities: List[str] = []


class ImportResponse(BaseModel):
    ok: bool
    source: str
    confidence: str
    draft: ImportDraft
    images: List[str] = []
    warnings: List[str] = []
    source_url: str


# ========== UTILS ==========

def _resolve_source(url: str) -> str:
    """Return the canonical source key or raise 400 if unsupported."""
    try:
        host = (urlparse(url).hostname or "").lower()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid URL")

    # Try exact + suffix match
    if host in SUPPORTED_DOMAINS:
        return SUPPORTED_DOMAINS[host]
    # Allow regional craigslist subdomains: *.craigslist.org
    if host.endswith(".craigslist.org"):
        return "craigslist"
    if host.endswith(".kijiji.ca"):
        return "kijiji"
    if host.endswith(".facebook.com"):
        return "facebook"

    raise HTTPException(
        status_code=400,
        detail=(
            f"Unsupported domain: {host}. "
            "Supported: Facebook Marketplace, Craigslist, Kijiji."
        ),
    )


async def _fetch_html(url: str) -> str:
    """Fetch the raw HTML, raising HTTPException on failure."""
    try:
        async with httpx.AsyncClient(
            timeout=FETCH_TIMEOUT,
            follow_redirects=True,
            headers=DEFAULT_HEADERS,
        ) as client:
            r = await client.get(url)
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Source page took too long to load. Try the paste-text fallback.",
        )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Fetch failed: {e!s}")

    if r.status_code in (401, 403):
        raise HTTPException(
            status_code=403,
            detail=(
                "The source listing is private or login-walled. "
                "Use the paste-text fallback: copy the listing details "
                "and try again."
            ),
        )
    if r.status_code == 429:
        raise HTTPException(
            status_code=429,
            detail="Source rate-limited the fetch. Wait a minute and retry.",
        )
    if r.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"Source returned {r.status_code}. Try the paste-text fallback.",
        )
    return r.text


# ---------- Structured-data extraction (fast path) ----------

_META_RE = re.compile(
    r'<meta\s+[^>]*?(?:property|name)\s*=\s*["\']([^"\']+)["\'][^>]*?content\s*=\s*["\']([^"\']*)["\']',
    re.IGNORECASE,
)
_META_RE_REVERSED = re.compile(
    r'<meta\s+[^>]*?content\s*=\s*["\']([^"\']*)["\'][^>]*?(?:property|name)\s*=\s*["\']([^"\']+)["\']',
    re.IGNORECASE,
)
_JSON_LD_RE = re.compile(
    r'<script[^>]+type\s*=\s*["\']application/ld\+json["\'][^>]*>(.*?)</script>',
    re.IGNORECASE | re.DOTALL,
)
_TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)


def _extract_meta_tags(html_text: str) -> Dict[str, str]:
    out: Dict[str, str] = {}
    for m in _META_RE.finditer(html_text):
        out[m.group(1).lower()] = html.unescape(m.group(2))
    for m in _META_RE_REVERSED.finditer(html_text):
        key = m.group(2).lower()
        if key not in out:
            out[key] = html.unescape(m.group(1))
    return out


def _extract_json_ld(html_text: str) -> List[Dict[str, Any]]:
    blocks: List[Dict[str, Any]] = []
    for m in _JSON_LD_RE.finditer(html_text):
        raw = m.group(1).strip()
        try:
            data = json.loads(raw)
        except Exception:
            continue
        if isinstance(data, list):
            blocks.extend(d for d in data if isinstance(d, dict))
        elif isinstance(data, dict):
            blocks.append(data)
            if isinstance(data.get("@graph"), list):
                blocks.extend(d for d in data["@graph"] if isinstance(d, dict))
    return blocks


def _strip_html_to_text(html_text: str, max_chars: int = MAX_HTML_CHARS_FOR_LLM) -> str:
    """Crude but effective: strip script/style, then tags, collapse whitespace."""
    text = re.sub(r"<script[^>]*>.*?</script>", " ", html_text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<style[^>]*>.*?</style>", " ", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<!--.*?-->", " ", text, flags=re.DOTALL)
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:max_chars]


def _extract_image_urls(html_text: str, meta: Dict[str, str]) -> List[str]:
    """Find image URLs from OG tags, JSON-LD, and <img> srcs. Dedup, keep large."""
    urls: List[str] = []

    # OG images
    for k in ("og:image", "og:image:secure_url", "twitter:image"):
        if meta.get(k):
            urls.append(meta[k])

    # JSON-LD images
    for block in _extract_json_ld(html_text):
        imgs = block.get("image")
        if isinstance(imgs, str):
            urls.append(imgs)
        elif isinstance(imgs, list):
            for i in imgs:
                if isinstance(i, str):
                    urls.append(i)
                elif isinstance(i, dict) and isinstance(i.get("url"), str):
                    urls.append(i["url"])

    # <img> tags as a last resort (cap at 12 to avoid icon noise)
    for m in re.finditer(r'<img[^>]+src\s*=\s*["\']([^"\']+)["\']', html_text, re.IGNORECASE):
        u = m.group(1)
        if u.startswith("data:"):
            continue
        if any(skip in u.lower() for skip in ("logo", "icon", "avatar", "sprite", "favicon")):
            continue
        urls.append(u)
        if len(urls) > 30:
            break

    # Dedup, keep order, prefer https
    seen = set()
    deduped: List[str] = []
    for u in urls:
        if u.startswith("//"):
            u = "https:" + u
        if not u.startswith("http"):
            continue
        if u in seen:
            continue
        seen.add(u)
        deduped.append(u)
    return deduped[:15]


# ---------- LLM extraction (reliable path) ----------

EXTRACT_PROMPT = """You are extracting structured rental/sale listing data from text scraped from a real-estate listing page (Facebook Marketplace, Craigslist, or Kijiji).

Read the text below and return a SINGLE JSON object with these exact keys. Use sensible defaults if a field is missing — but DO NOT invent specifics like exact addresses or prices that aren't supported by the text.

Required keys:
- title (string): a short headline, 5-12 words
- address (string): street address as written, or "" if only neighborhood
- city (string): city name, default "Vancouver" if Vancouver-area neighborhood
- province (string): two-letter code, default "BC"
- postal_code (string): "" if unknown
- price (integer): monthly rent (rentals) or sale price (sale). 0 if unknown.
- bedrooms (integer): 0 for studio, 1, 2, etc.
- bathrooms (number): can be decimal (1.5)
- sqft (integer): 0 if unknown
- property_type (string): one of: apartment, condo, house, townhouse, studio, basement, room
- description (string): the cleaned-up listing description, 100-600 chars
- pet_friendly (boolean): true if pets mentioned as allowed
- parking (boolean): true if parking mentioned as included
- available_date (string): ISO date YYYY-MM-DD if a move-in date is mentioned, else ""
- listing_type (string): "rent" or "sale"
- amenities (array of strings): e.g. ["laundry", "balcony", "dishwasher"]

Return ONLY the JSON object. No markdown, no commentary. Use double quotes.

TEXT:
{text}
"""


async def _extract_with_claude(text: str) -> Dict[str, Any]:
    """Send cleaned page text to Claude, get back a structured dict."""
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="LLM extraction unavailable: ANTHROPIC_API_KEY not configured.",
        )

    # Import locally to avoid hard dep at module load
    from anthropic import AsyncAnthropic

    client = AsyncAnthropic(api_key=api_key)
    prompt = EXTRACT_PROMPT.format(text=text)

    try:
        msg = await client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as e:
        logger.exception("Claude extraction failed")
        raise HTTPException(status_code=502, detail=f"LLM extraction failed: {e!s}")

    raw = ""
    for block in msg.content:
        if getattr(block, "type", None) == "text":
            raw += block.text

    # Strip code fences if any
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

    try:
        return json.loads(raw)
    except Exception as e:
        logger.warning("LLM returned non-JSON: %s", raw[:300])
        raise HTTPException(
            status_code=502,
            detail=f"Could not parse LLM extraction. Try the paste-text fallback. ({e!s})",
        )


# ---------- Normalization ----------

def _coerce_draft(parsed: Dict[str, Any]) -> ImportDraft:
    """Coerce LLM output into our ImportDraft schema, defensively."""

    def s(v, default=""):
        return str(v).strip() if v is not None else default

    def i(v, default=0):
        try:
            return int(float(str(v).replace(",", "").replace("$", "").strip()))
        except Exception:
            return default

    def f(v, default=0.0):
        try:
            return float(str(v).replace(",", "").replace("$", "").strip())
        except Exception:
            return default

    def b(v):
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes", "y")
        return False

    amenities = parsed.get("amenities") or []
    if isinstance(amenities, str):
        amenities = [a.strip() for a in amenities.split(",") if a.strip()]
    if not isinstance(amenities, list):
        amenities = []

    return ImportDraft(
        title=s(parsed.get("title"))[:200],
        address=s(parsed.get("address"))[:200],
        city=s(parsed.get("city")) or "Vancouver",
        province=s(parsed.get("province")) or "BC",
        postal_code=s(parsed.get("postal_code")),
        price=max(0, i(parsed.get("price"))),
        bedrooms=max(0, i(parsed.get("bedrooms"))),
        bathrooms=max(0.0, f(parsed.get("bathrooms"))),
        sqft=max(0, i(parsed.get("sqft"))),
        property_type=s(parsed.get("property_type")) or "apartment",
        description=s(parsed.get("description"))[:5000],
        pet_friendly=b(parsed.get("pet_friendly")),
        parking=b(parsed.get("parking")),
        available_date=s(parsed.get("available_date")),
        listing_type=s(parsed.get("listing_type")) or "rent",
        amenities=[str(a)[:50] for a in amenities][:20],
    )


def _confidence_for(draft: ImportDraft) -> str:
    score = 0
    if draft.title:
        score += 1
    if draft.price > 0:
        score += 1
    if draft.bedrooms >= 0 and (draft.bedrooms > 0 or "studio" in draft.title.lower()):
        score += 1
    if draft.address:
        score += 1
    if draft.description and len(draft.description) > 80:
        score += 1
    if score >= 4:
        return "high"
    if score >= 2:
        return "medium"
    return "low"


# ========== ROUTES ==========

@router.post("/import-from-url", response_model=ImportResponse)
async def import_from_url(req: ImportRequest) -> ImportResponse:
    """Pull a public listing page, extract structured data, return a draft."""
    warnings: List[str] = []

    # If user pasted text directly, skip the fetch step entirely.
    if req.pasted_text and req.pasted_text.strip():
        source = "pasted"
        text_for_llm = req.pasted_text[:MAX_HTML_CHARS_FOR_LLM]
        images: List[str] = []
    else:
        source = _resolve_source(req.url)
        html_text = await _fetch_html(req.url)
        meta = _extract_meta_tags(html_text)
        text_for_llm = _strip_html_to_text(html_text)
        images = _extract_image_urls(html_text, meta)

        # Pre-seed text_for_llm with OG tags — saves tokens, gives Claude
        # a clean structured starting point
        seed_lines = []
        for k in ("og:title", "og:description", "og:site_name", "og:price:amount", "og:price:currency"):
            if meta.get(k):
                seed_lines.append(f"{k}: {meta[k]}")
        if seed_lines:
            text_for_llm = "\n".join(seed_lines) + "\n\n" + text_for_llm
            text_for_llm = text_for_llm[:MAX_HTML_CHARS_FOR_LLM]

        if not text_for_llm or len(text_for_llm) < 100:
            warnings.append(
                "Page returned very little text — the source may be JS-rendered or auth-walled."
            )

    parsed = await _extract_with_claude(text_for_llm)
    draft = _coerce_draft(parsed)

    if not draft.title:
        warnings.append("Could not extract a title.")
    if draft.price == 0:
        warnings.append("Could not extract a price — fill it in manually.")
    if not draft.address:
        warnings.append("Could not extract an exact address — fill it in manually.")
    if not draft.postal_code:
        warnings.append("Could not extract a postal code.")

    return ImportResponse(
        ok=True,
        source=source,
        confidence=_confidence_for(draft),
        draft=draft,
        images=images,
        warnings=warnings,
        source_url=req.url,
    )


@router.get("/import-from-url/supported")
async def supported_sources() -> Dict[str, Any]:
    """Tiny helper for the UI to render the 'supported sites' list."""
    return {
        "supported": [
            {"name": "Facebook Marketplace", "key": "facebook", "domains": ["facebook.com"]},
            {"name": "Craigslist", "key": "craigslist", "domains": ["craigslist.org"]},
            {"name": "Kijiji", "key": "kijiji", "domains": ["kijiji.ca"]},
        ],
        "fallback": "paste-text",
        "notes": (
            "If a URL is private or login-walled, copy the listing text and "
            "paste it directly — same result."
        ),
    }
