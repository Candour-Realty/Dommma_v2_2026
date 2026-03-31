# DOMMMA Changelog

## Feb 2026 (Session 3) - Phases 4 & 5

### Recurring Payments & Automation (Phase 4)
- Built APScheduler with 4 recurring cron jobs:
  - Invoice generation (daily 8am UTC)
  - Payment reminders (daily 9am UTC, 3 days before due)
  - Late fee application (daily 10am UTC)
  - Lease renewal reminders (weekly Mondays)
- Notifications system with read/unread tracking
- Payment receipt PDF generation (ReportLab - professional formatted)
- Payment history page with status filters and receipt downloads
- Manual trigger endpoints for admin: /api/scheduler/run-invoices, /api/scheduler/run-reminders

### AI Property Intelligence (Phase 5)
- Property Valuation: comparable-based analysis with Anthropic AI insights
- Neighborhood Comparison: side-by-side area stats (rent/sale averages, pet-friendly %, sqft)
- Smart Rent Pricing: competitive/suggested/premium pricing with market percentiles
- Virtual Tours: API support for Matterport/video tour URLs on listings

### PWA & Infrastructure
- Service worker (sw.js) for offline caching, push notifications
- Manifest already configured from Phase 1

### Sidebar Navigation Expanded
- Renter: +Property Valuation, +Compare Neighborhoods, +Payment History
- Landlord: +Smart Pricing, +Property Valuation, +Compare Neighborhoods, +Payment History

### Backend Routers Created
- `/backend/routers/scheduler.py` - Recurring jobs & notifications
- `/backend/routers/receipts.py` - Payment history & PDF receipts
- `/backend/routers/ai_valuation.py` - Property valuation, neighborhood comparison, smart pricing, virtual tours

---

## Feb 2026 (Session 2) - Phases 2 & 3

### Rent Payment System (Phase 2)
- RentAgreements.jsx with landlord create + tenant accept/counter/decline
- Stripe Elements for payment method setup
- Stripe Connect landlord onboarding (2.5% platform fee)
- AI Document Builder assistant panel
- Lease Takeover tab on Browse page

### AI Document Intelligence (Phase 3)
- TenantDocReview.jsx with AI-powered lease analysis
- BC RTA compliance checks, risk scoring, tenant checklists
- Lease comparison against BC standards

### Backend Routers
- `/backend/routers/stripe_connect.py`
- `/backend/routers/ai_intelligence.py`

---

## Dec 2025 (Session 1) - Phase 1

### Core Platform
- Property browsing, advanced filters, 16-category contractor marketplace
- AI concierge (Nova), E-signature document builder
- GitHub Actions CI/CD, EC2 deployment fixes
- Admin endpoints, API key migration

---

*Maintained by DOMMMA Development Team*
