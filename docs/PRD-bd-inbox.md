# PRD — BD Inbox

**Owner**: Rishabh
**Status**: v0 building
**Last updated**: May 15, 2026

---

## Problem

The URL-import tool (shipped May 13) cuts landlord onboarding from 10 min to 30 sec — *if* the landlord lands on Dommma. They won't, so we need outbound: the founder DMs/emails 50-75 landlords/day across Craigslist, Kijiji, and FB Marketplace until product-led growth kicks in.

The bottleneck isn't legal, isn't technical, isn't even response rate. It's **context-switching cost per outreach**: open the listing tab, read the description, decide if it's a fit, find the contact method (DM? phone in body? relay email?), switch tabs to Dommma admin, log the lead, switch to WhatsApp/Messages/FB DM, draft a message, copy-paste, send, note the response somewhere, set a followup reminder.

That's 5-8 minutes per outreach. At 75/day that's **6+ hours** — unsustainable for a founder. The math only works if it's <90 sec per outreach.

## Solution

**BD Inbox** — single Dommma admin page where you paste any number of listing URLs (unlimited; the user explicitly does not want a cap), the system fetches + extracts each in the background, and presents a sortable table where every outreach is one click away from drafted to sent.

## Scope

### In v0
- ✅ Bulk URL paste (no upper limit)
- ✅ Background extraction (queue → fetching → extracted → ready)
- ✅ Lead table with status, contact method, price, location, source
- ✅ Per-lead actions: Draft message (Claude), Open source (link out), Convert to listing
- ✅ Manual status updates: queued → extracted → drafted → sent → replied → won / lost
- ✅ Contact-method best-guess: phone if found in body, email if CL relay, DM if FB, in-platform if Kijiji
- ✅ Send-via dropdown: opens `tel:`, `sms:`, `mailto:`, or copies FB DM link to clipboard
- ✅ Persisted in DB — close the tab, come back, leads are still there

### Out of v0 (deferred to v0.5)
- ❌ Auto-followup logic (3-day stale reminder)
- ❌ Real-time SSE updates (we poll every 3 sec instead)
- ❌ Built-in SMS/email sending (we open the user's native app)
- ❌ Reply tracking (user marks status manually)
- ❌ Bulk message-drafting ("draft for all 47 selected")
- ❌ A/B template testing

## Architecture

### Backend

**New collection**: `bd_leads`
```
{
  id: uuid,
  owner_id: <user_id of the BD person>,
  source_url: string,
  source: "facebook" | "craigslist" | "kijiji" | "pasted",
  status: "queued" | "extracting" | "extracted" | "drafted" | "sent" | "replied" | "won" | "lost" | "failed",
  draft: { ImportDraft fields ... },  // populated after extraction
  images: [url, url, ...],
  contact_method: "phone" | "email" | "fb_dm" | "kijiji_message" | "unknown",
  contact_value: string,               // phone number, email, or "" if just channel
  drafted_message: string,             // empty until "Draft message" clicked
  notes: string,                       // free-form, BD person's own
  error: string,                       // populated only on failure
  created_at, updated_at, sent_at, replied_at
}
```

**Endpoints**:
- `POST /api/bd-inbox/import` — body `{ urls: string[] }`. Creates one queued lead per URL, kicks off background extraction. Returns `{ created: N, lead_ids: [...] }` immediately.
- `GET /api/bd-inbox/leads` — list (filter by status, owner_id, source). Cursor pagination.
- `GET /api/bd-inbox/stats` — aggregate counts per status for the header.
- `PATCH /api/bd-inbox/leads/{id}` — update status / notes / contact / drafted_message
- `POST /api/bd-inbox/leads/{id}/draft-message` — Claude generates outreach text, stores on lead, returns it
- `POST /api/bd-inbox/leads/{id}/convert` — converts lead to live Dommma listing (uses existing `/listings` POST internally)
- `DELETE /api/bd-inbox/leads/{id}` — drop a lead

**Background worker**:
- v0: FastAPI `BackgroundTasks` per lead (simple, no Celery overhead)
- Concurrency throttle: `asyncio.Semaphore(5)` so we never have more than 5 fetches running at once (avoids upstream rate limits and Claude API throttling)
- Each task: fetch HTML → extract structured data → extract contact method → save to DB with status update

### Frontend: `/bd-inbox`

**Layout**:
1. **Header bar** — page title + stats pills (queued / extracted / drafted / sent / replied / won)
2. **Action bar** — "+ Paste URLs" button (opens modal with big textarea), "Filter" dropdown, "Refresh" button
3. **Table** — virtualized for 1000+ rows. Columns: checkbox · source icon · title · price · location · contact method · status pill · last update · actions menu
4. **Per-row expand** — click a row to reveal: full description preview, image thumbnails, drafted message field (editable), notes field, action buttons inline
5. **Status pills are clickable** — click "drafted" → moves to "sent" with one click (state machine: queued → extracted → drafted → sent → replied → won/lost)

**Polling**: `GET /leads?status=extracting,queued` every 3 sec while there are in-flight items, stops polling when none.

## Claude prompt for outreach drafting

```
You are drafting a short, personal Facebook DM / email / SMS from Rishabh, co-founder of Dommma — a Vancouver-only rental marketplace launching Q3 2026. The goal: get a landlord to mirror their existing rental listing onto Dommma. Free, no fees, can take down anytime.

LISTING DETAILS:
- Title: {title}
- Price: ${price}/mo
- Beds/Baths: {bedrooms} / {bathrooms}
- Neighborhood: {city}
- Source: {source}

STYLE RULES:
- 3-4 sentences max
- Lead with a specific detail from THEIR listing (price + location + bed count) so they know it's not a bot
- Mention Dommma is Vancouver-only and founder-led (not VC-funded marketing spam)
- One concrete ask: "Reply YES and I'll mirror it for you" — no Calendly links, no forms
- No emojis, no exclamation marks
- Sound like a real person, not a marketer

Return ONLY the message text, no commentary, no greeting like "Hi [Name]" because we don't know their name.
```

## Legal posture

Identical to URL-import: user-initiated outreach to the landlord who posted publicly. We're sending a message asking for permission to mirror. The listing only goes on Dommma after the landlord replies "YES" — at which point you click "Convert to listing" in the inbox, the ownership checkbox is logged with timestamp, and the listing publishes.

The source URL is logged on the lead AND on the final listing for full audit trail.

## Success metrics

| Metric | v0 target |
|---|---|
| Time per outreach (paste URL → message drafted → sent) | < 90 sec |
| Bulk-paste capacity (URLs we can process without error) | 500+ |
| Extraction success rate (lead reaches "extracted" status) | > 80% |
| Convert-to-listing rate (extracted → won) | 8-15% over 30 days |

## Build plan

| Step | ETA |
|---|---|
| Refactor `listing_import.py` to expose reusable extractor | 15 min |
| Backend: lead model + endpoints + background worker | 75 min |
| Frontend: BD Inbox page + modal + table | 90 min |
| Wire route, add nav link from MyProperties / admin | 15 min |
| Manual QA with 20 real URLs (FB, CL, Kijiji) | 45 min |
| Deploy + smoke test | 15 min |

**Total to v0**: ~4.5 hours.

## Decisions made

- **No upper limit on URL count** — user explicit. Throttle is on backend concurrency (5 simultaneous fetches), not request size.
- **Background extraction is BackgroundTasks** for v0 — keep deploy simple. Upgrade to Celery/RQ only if we hit scale issues.
- **Polling, not WebSockets** — 3-sec poll is fine for batches of 50-500. WebSockets for v0.5 if it becomes annoying.
- **No built-in sending** — opening native apps (mailto:/sms:/tel:) is more reliable than wiring SMTP/Twilio for v0.
- **Status machine is manual** — user clicks "Mark sent / replied / won / lost". No auto-detection.
