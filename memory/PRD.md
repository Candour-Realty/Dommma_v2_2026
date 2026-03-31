# DOMMMA - Product Requirements Document

## Original Problem Statement
Build a complete real estate marketplace platform called "DOMMMA" featuring an AI concierge, property listings, e-signing, contractor services, rent payment collection, AI document intelligence, property valuation, and neighborhood comparison tools.

## Tech Stack
- **Frontend**: React (CRA), Tailwind CSS, Shadcn UI, Stripe Elements, PWA
- **Backend**: FastAPI (Python), Motor (async MongoDB), APScheduler
- **Database**: MongoDB Atlas
- **Storage**: Cloudflare R2
- **CI/CD**: GitHub Actions
- **Deployment**: AWS EC2
- **3rd Party**: Stripe (Payments + Connect), DocuSign, Anthropic Claude, OpenAI, Perplexity, Resend, Google Maps/OAuth

## Core Features (All Implemented)

### Phase 1 - Foundation
- Property browsing with Rent/Buy/Lease Takeover tabs
- Advanced filters (bedrooms, bathrooms, price, property type, storage, lease term)
- Google Maps integration
- 16-category contractor marketplace
- AI concierge (Nova) with multi-model LLM
- E-signature document builder with AI assistance
- User auth (register/login/Google OAuth)
- Messaging system, Renter resume builder, Property analytics dashboard

### Phase 2 - Rent Payment System
- Rent Agreements - Landlords create, tenants accept/counter/decline
- Stripe Elements - Payment method setup
- Stripe Connect - Landlord onboarding for automatic payouts (2.5% platform fee)
- AI Document Builder - AI assistant panel with BC RTA guidance
- Lease Takeover Tab - Consolidated into Browse page

### Phase 3 - AI Document Intelligence
- Tenant Document Review - AI-powered lease analysis (risk scoring, BC RTA compliance)
- Lease Comparison - Compare against BC standard terms & market averages
- Deposit Analysis - BC RTA compliance checking

### Phase 4 - Recurring Payments & Automation
- **Background Scheduler** (APScheduler) - 4 cron jobs:
  - Daily invoice generation at 8am UTC
  - Payment reminders 3 days before due (9am UTC)
  - Late fee application check (10am UTC)
  - Lease renewal reminders weekly (Mondays 8am UTC)
- **Notifications System** - In-app notifications for payment reminders, late fees, lease renewals
- **Payment Receipt PDF** - Professional PDF receipts generated via ReportLab
- **Payment History** - Filterable payment history with receipt download

### Phase 5 - AI Property Intelligence
- **AI Property Valuation** - Comparable-based with AI analysis (Anthropic Claude)
- **Neighborhood Comparison** - Side-by-side area comparison (rent, sale, amenities)
- **Smart Rent Pricing** - Market-based price suggestions (competitive/suggested/premium)
- **Virtual Tours** - Support for Matterport/video tour URLs

### Infrastructure
- **PWA** - Service worker for offline support, push notifications, app install
- **Admin Panel** - Database stats, clear test data, contact messages
- **Modular Routers** - Extracted into /backend/routers/ (admin, stripe_connect, ai_intelligence, ai_valuation, scheduler, receipts)

## Architecture
- `/app/frontend/src/pages/` - 30+ React page components
- `/app/frontend/src/components/` - Shared UI components (Shadcn)
- `/app/frontend/public/sw.js` - PWA service worker
- `/app/backend/server.py` - Main FastAPI application
- `/app/backend/routers/` - 10+ modular routers

## Key API Endpoints
- Auth: POST /api/auth/login, POST /api/auth/register
- Listings: GET /api/listings, GET /api/lease-assignments
- Rent: POST /api/rent/agreements, GET /api/rent/agreements, POST /api/rent/payments/{id}/pay
- Connect: POST /api/stripe-connect/create-account, GET /api/stripe-connect/status
- AI: POST /api/ai/tenant-document-review, POST /api/ai/property-valuation, POST /api/ai/smart-rent-pricing
- Tools: GET /api/ai/neighborhood-comparison, GET /api/ai/virtual-tours
- Payments: GET /api/payments/history, GET /api/payments/{id}/receipt
- Scheduler: POST /api/scheduler/run-invoices, POST /api/scheduler/run-reminders
- Notifications: GET /api/notifications, POST /api/notifications/{id}/read

## Test Credentials
- Renter: test@dommma.com / test123
- Admin key: dommma-admin-2026
