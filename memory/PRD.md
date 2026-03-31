# DOMMMA - Product Requirements Document

## Original Problem Statement
Build a complete real estate marketplace platform called "DOMMMA" featuring an AI concierge, property listings, e-signing, contractor services, rent payment collection, AI document intelligence, property valuation, neighborhood comparison tools, landlord earnings dashboards, AI property search chatbot, and tenant credit checks.

## Tech Stack
- **Frontend**: React (CRA), Tailwind CSS, Shadcn UI, Stripe Elements, PWA, i18next (EN/FR/ZH)
- **Backend**: FastAPI (Python), Motor (async MongoDB), APScheduler, ReportLab
- **Database**: MongoDB Atlas
- **Storage**: Cloudflare R2
- **CI/CD**: GitHub Actions
- **Deployment**: AWS EC2
- **3rd Party**: Stripe (Payments + Connect), DocuSign, Anthropic Claude, OpenAI, Perplexity, Resend, Google Maps/OAuth

## All Features (Implemented & Tested)

### Phase 1 - Foundation
- Property browsing with Rent/Buy/Lease Takeover tabs, advanced filters, Google Maps
- 16-category contractor marketplace, AI concierge (Nova), E-sign document builder
- User auth (register/login/Google OAuth), messaging, renter resume, analytics

### Phase 2 - Rent Payment System
- Rent Agreements (create/accept/counter/decline), Stripe Elements, Stripe Connect (2.5% fee)
- AI Document Builder assistant, Lease Takeover tab on Browse

### Phase 3 - AI Document Intelligence
- Tenant Document Review (risk scoring, BC RTA compliance), Lease Comparison, Deposit Analysis

### Phase 4 - Recurring Payments & Automation
- APScheduler (4 cron jobs: invoices, reminders with Resend email, late fees, lease renewals)
- Notifications system, Payment Receipt PDF (ReportLab), Payment History with filters

### Phase 5 - AI Property Intelligence
- AI Property Valuation, Neighborhood Comparison, Smart Rent Pricing, Virtual Tours support

### Phase 6 - Advanced Features
- **Landlord Earnings Dashboard** - Monthly income charts, vacancy rates, ROI projections, collection rates
- **AI Property Search Chatbot** - Natural language property search with session history & listing cards
- **Tenant Credit Check** - Simulated credit reports with scores, risk levels, rental history (demo)
- **Multi-language** - English, French (Français), Mandarin Chinese (中文) with dropdown selector
- **PWA** - Service worker for offline caching, push notifications, app install

### Admin Panel
- Database stats, clear test data, contact messages, rent payment admin views

## Architecture
- `/app/frontend/src/pages/` - 35+ React page components
- `/app/frontend/src/components/` - Shared UI components (Shadcn), LanguageToggle
- `/app/frontend/src/locales/` - en.json, fr.json, zh.json
- `/app/frontend/public/sw.js` - PWA service worker
- `/app/backend/server.py` - Main FastAPI application
- `/app/backend/routers/` - 12 modular routers (admin, stripe_connect, ai_intelligence, ai_valuation, scheduler, receipts, landlord_earnings, ai_chatbot, calendar, moving, compatibility, portfolio, nova)

## Key API Endpoints
- Auth: POST /api/auth/login, /register
- Listings: GET /api/listings, /api/lease-assignments
- Rent: POST /api/rent/agreements, GET /api/rent/agreements, POST /api/rent/payments/{id}/pay
- Connect: POST /api/stripe-connect/create-account, GET /api/stripe-connect/status
- AI: POST /api/ai/tenant-document-review, /api/ai/property-valuation, /api/ai/smart-rent-pricing, /api/ai/property-chat
- Tools: GET /api/ai/neighborhood-comparison, /api/ai/virtual-tours, /api/ai/chat-history
- Payments: GET /api/payments/history, GET /api/payments/{id}/receipt
- Landlord: GET /api/landlord/earnings, /api/landlord/property-performance
- Credit: POST /api/credit-check/request, GET /api/credit-check/reports
- Scheduler: POST /api/scheduler/run-invoices, /api/scheduler/run-reminders
- Notifications: GET /api/notifications, POST /api/notifications/{id}/read

## Test Credentials
- Renter: test@dommma.com / test123
- Admin key: dommma-admin-2026
- Test tenant ID: dcc2cce1-e8d4-43b5-8096-9db712f36720

## Notes
- Credit check scoring is SIMULATED for demo purposes
- Stripe production key update deferred by user
- All AI features use live Anthropic Claude API
