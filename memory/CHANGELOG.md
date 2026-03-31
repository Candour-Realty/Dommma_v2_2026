# DOMMMA Changelog

## Feb 2026 (Session 4) - Phase 6: Advanced Features

### Landlord Earnings Dashboard
- Monthly income charts with collected/pending/overdue breakdown
- Vacancy rate and collection rate tracking
- ROI projections based on portfolio data
- Property performance drill-down
- Backend: `/api/landlord/earnings`, `/api/landlord/property-performance`

### AI Property Search Chatbot
- Natural language property search with Anthropic Claude
- Multi-turn session history with context retention
- Property cards with prices embedded in chat responses
- Suggestion chips for guided exploration
- Backend: `/api/ai/property-chat`, `/api/ai/chat-history`
- Frontend: `/property-search` with MainLayout

### Tenant Credit Check
- Search tenants by name/email, run credit reports
- Simulated scoring (580-850) with risk levels (low/medium/high)
- Credit factors: payment history, utilization, age, inquiries
- Rental history: evictions, late payments, landlord ratings
- Consent checkbox with BC privacy regulation compliance
- Backend: `/api/credit-check/request`, `/api/credit-check/reports`

### Multi-Language Support
- Added Mandarin Chinese (中文) translations - `/locales/zh.json`
- Updated LanguageToggle to dropdown with EN/FR/中文
- All 3 languages with full coverage of nav, hero, browse, auth, footer, common

### Email Integration for Payment Reminders
- Connected Resend API to payment reminder scheduler
- Professional HTML email templates with DOMMMA branding
- Async email sending via `asyncio.create_task`

### Navigation Updates
- Main navbar: Added "AI Search" link to `/property-search`
- Landlord sidebar: Added Earnings, Credit Check
- All routes registered in App.js

---

## Feb 2026 (Session 3) - Phases 4 & 5
- Recurring payments scheduler (APScheduler, 4 cron jobs)
- Payment receipt PDF, Payment history page
- AI Property Valuation, Neighborhood Comparison, Smart Rent Pricing
- PWA service worker

## Feb 2026 (Session 2) - Phases 2 & 3
- Rent Agreements, Stripe Elements/Connect
- AI Document Intelligence, Lease Takeover tab
- Backend router extraction started

## Dec 2025 (Session 1) - Phase 1
- Core platform, 16 contractor categories, Nova AI
- GitHub Actions CI/CD, EC2 deployment

---
*Maintained by DOMMMA Development Team*
