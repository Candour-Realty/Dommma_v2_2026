# DOMMMA Changelog

## [v6.0] - 2026-04-07
### Bug Fixes
- **Fixed sidebar duplication** — Removed double DashboardLayout wrapping from 8 pages (CreditCheck, SmartRentPricing, PropertyValuation, NeighborhoodComparison, PaymentHistory, LandlordEarnings, VirtualStaging, TenantDocReview)

### Rename: "Pros" → "Services"
- Updated en.json, fr.json navigation labels
- Updated Services page feature text

### AI Listing Description Generator
- Backend: `/routers/listing_tools.py` with Claude-powered description generation
- 4 tones: Professional, Friendly, Luxury, Concise
- Frontend: `AIDescriptionGenerator.jsx` integrated into MyProperties listing form

### Role-Based Landing Content
- Homepage dynamically shows quick-action cards based on logged-in user type
- Landlord: Manage Properties, Promote Listings, Earnings, Virtual Staging
- Renter: Find Home, Applications, Pay Rent, AI Lease Review
- Contractor: Browse Jobs, Profile, Portfolio, Analytics

### Flexible Lease-Duration Pricing
- Backend: POST /listings/flexible-pricing, GET /listings/{id}/pricing
- Frontend: Duration pricing inputs (month-to-month, 3mo, 6mo, 12mo) in listing form
- Browse page shows pricing tiers in listing detail

### Short-Term Rental Support
- Added 3-month and 9-month lease duration filters to Browse page

### Social Sharing
- Backend: GET /listings/{id}/share-links returns platform-specific URLs
- Frontend: `ShareListingModal.jsx` with 7 platforms (Facebook, FB Marketplace, Twitter, LinkedIn, WhatsApp, Craigslist, Email)
- Share button added to MyProperties cards and Browse listing detail modal

### Campaign-Based Promotion
- Backend: campaigns CRUD with 3 tiers (Boost $2.99/day, Featured $4.99/day, Premium $9.99/day)
- Frontend: `CampaignDashboard.jsx` with stats, create campaign flow
- Added "Promote Listings" to landlord sidebar

### Contractor Credits Monetization
- Backend: `/routers/contractor_credits.py` with balance, purchase, use, history
- 5 free credits for new contractors, then $4.99/credit or bundle discounts
- Quality guarantee: refund credits for spam/unresponsive leads

### Test Data Cleanup
- Enhanced admin clear-test-data endpoint to preserve test accounts
- Cleaned demo data, re-seeded production-quality listings

## [v5.0] - 2026-03-31
- Google Maps AdvancedMarkerElement, WebSocket notifications, Virtual Staging AI, Analytics export, Enhanced Credit Check

## [v4.0] - 2026-03-31
- Backend modularization (auth, listings, contractors routers), Web Push, Matterport, Documentation v2.0

## [v3.0] - 2026-03
- Rent Agreements, Stripe Connect, AI Intelligence, i18n, PWA, Background Jobs

## [v2.0] - 2026-02
- Contractor marketplace, Document builder, Payments, Featured listings, Analytics

## [v1.0] - 2026-01
- Core platform: Auth, Listings, Nova AI, Maps, Messaging

---
*Maintained by DOMMMA Development Team*
