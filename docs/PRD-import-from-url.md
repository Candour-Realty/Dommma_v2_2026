# PRD — Import Listing from URL

**Owner**: Rishabh
**Status**: v0 building
**Last updated**: May 13, 2026

---

## Problem

Dommma needs ~3,000 Vancouver units visible by Q3 to feel like a real marketplace. The hardest cold-start problem: landlords already post on Facebook Marketplace, Craigslist, and Kijiji and have **zero incentive to retype** their listing on a fifth site they've never heard of.

Concurrent constraints:
- We cannot **scrape** those sites at scale — legal exposure is severe (Craigslist v 3Taps, Meta v Bright Data) and Dommma's brand (Geoff, Monika, the trust positioning) cannot eat a TOS-violation news story.
- We cannot wait for organic growth — chicken-and-egg means no traffic, no posts.

## Solution

**"Paste your existing listing URL — we'll import it in 30 seconds."**

The landlord owns their listing content. *They* authorize the import of *their own* content. No CFAA/TOS issue because the user is doing the action against content they own.

Compare: Zillow's "claim your home," Apartments.com's "claim listing," Stripe's "import customers from Shopify." This is a well-established legal pattern.

## Scope

### In v0
- ✅ Paste URL → server fetches and extracts listing data → returns pre-filled draft
- ✅ Supported sources: Facebook Marketplace, Craigslist, Kijiji (Vancouver-area URLs)
- ✅ Extract: title, address, price, bedrooms, bathrooms, sqft, property type, description, pet-friendly, parking, images (URLs)
- ✅ Preview screen where user can edit any field before publishing
- ✅ Clear error states when fetch is blocked or content is private

### Out of v0
- ❌ Bulk URL import (paste 50 URLs at once) — v0.5
- ❌ Re-hosting photos to Cloudflare R2 (we'll keep external URLs for now, migrate in v0.5)
- ❌ Realtor.ca / MLS URLs (separate DDF track)
- ❌ Auto-sync on price changes from source — never (legally fragile)
- ❌ Background re-fetch / monitoring of source listing

## Architecture

### Backend: `POST /api/listings/import-from-url`

**Request**: `{ "url": "https://www.facebook.com/marketplace/item/12345/" }`

**Pipeline**:
1. **Validate** URL is on a supported domain
2. **Fetch** the page with `httpx` using realistic browser headers
3. **Extract structured data first** (fast path): OG meta tags + JSON-LD blocks (works for ~70% of pages)
4. **Fallback to LLM extraction** (reliable path): pass cleaned page text to Claude Sonnet 4.5 with a strict JSON schema
5. **Return draft** as a partial `ListingCreate` object + raw extracted image URLs

**Response**:
```json
{
  "ok": true,
  "source": "facebook",
  "confidence": "high",
  "draft": {
    "title": "Bright 2BR · Kitsilano",
    "address": "1234 W 4th Ave",
    "city": "Vancouver",
    "province": "BC",
    "postal_code": "",
    "price": 2800,
    "bedrooms": 2,
    "bathrooms": 1,
    "sqft": 850,
    "property_type": "apartment",
    "description": "...",
    "pet_friendly": true,
    "parking": false,
    "available_date": "2026-06-01",
    "listing_type": "rent"
  },
  "images": ["https://...jpg", "https://...jpg"],
  "warnings": ["Could not extract postal code"]
}
```

**Error responses**:
- `400` — unsupported domain or malformed URL
- `403` — source page is private / login-walled
- `429` — source rate-limited us (back off, suggest paste-text fallback)
- `502` — fetch succeeded but extraction failed completely

### Frontend: `/import-from-url`

Single page, 3 states:
1. **Input**: URL field + "Import" button. Below: supported domains, what we'll extract, "Why this is safe."
2. **Loading**: spinner + "Pulling your listing from Facebook…"
3. **Review**: editable form pre-filled with extracted data + image carousel showing what we found + "Publish" button → POSTs to existing `/api/listings`

**Fallback path** when extraction fails: "We couldn't read this URL automatically. Paste the listing text below and we'll parse it." → textarea → same Claude extraction → same review screen.

## Legal posture

The user must:
- Own the source listing (acknowledged via a checkbox on the import screen)
- Confirm they have rights to all photos being imported

We log:
- The source URL
- Timestamp of import
- User ID

This audit trail matters if a takedown ever comes in.

## Success metrics

| Metric | v0 target |
|---|---|
| Time from paste to published draft | <30 sec |
| Extraction success rate (correct title + price + bedrooms) | >85% on Craigslist, >70% on FB Marketplace, >80% on Kijiji |
| Listings imported in first 30 days | 200+ |
| Drop-off between paste → publish | <40% |

## Build plan

| Step | ETA |
|---|---|
| Backend endpoint + Claude extraction | 90 min |
| Frontend page + review flow | 60 min |
| Wire to existing listing creation | 15 min |
| Manual QA with 5 real URLs (FB, CL, Kijiji) | 30 min |
| Deploy + smoke test | 15 min |

**Total to v0 ship**: ~3.5 hours.

## Open questions

1. **Address geocoding** — source listings often have partial addresses or just neighborhoods. v0: extract whatever address text exists; v0.5: integrate Geoapify (already in deps?) to fill lat/lng and normalize.
2. **Photo re-hosting** — keeping external URLs is fragile (source can delete). v0.5 should download photos and re-upload to R2.
3. **Duplicate detection** — if landlord imports the same URL twice, do we update or block? v0: block (return existing listing).

## Decisions made

- **Not scraping at scale** — user-initiated only, one URL at a time
- **Not auto-importing** background sync — explicit user action each time
- **Not Realtor.ca for v0** — DDF is a separate 6-month track via Geoff's brokerage outreach
- **Claude as extraction primary** — cheaper than building per-site parsers, more robust to layout changes
- **Keep external image URLs in v0** — accept the staleness risk to ship faster
