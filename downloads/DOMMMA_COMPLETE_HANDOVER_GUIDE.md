# DOMMMA - Complete Technical Handover Guide

## Document Information
- **Version:** 2.0
- **Last Updated:** March 31, 2026
- **Purpose:** Complete handover documentation for non-technical users
- **Website:** https://dommma.com

---

# TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Account Access & Credentials](#3-account-access--credentials)
4. [GitHub Repository](#4-github-repository)
5. [Domain Management (GoDaddy)](#5-domain-management-godaddy)
6. [AWS Hosting (EC2)](#6-aws-hosting-ec2)
7. [Database (MongoDB Atlas)](#7-database-mongodb-atlas)
8. [File Storage (Cloudflare R2)](#8-file-storage-cloudflare-r2)
9. [Third-Party Services](#9-third-party-services)
10. [How to Update the Website](#10-how-to-update-the-website)
11. [How to Add New Features](#11-how-to-add-new-features)
12. [Troubleshooting Guide](#12-troubleshooting-guide)
13. [Security Best Practices](#13-security-best-practices)
14. [Costs & Billing](#14-costs--billing)
15. [Emergency Contacts & Support](#15-emergency-contacts--support)

---

# 1. PROJECT OVERVIEW

## What is DOMMMA?

DOMMMA is a **comprehensive real estate marketplace platform** for Metro Vancouver. It combines Zillow/Realtor.ca-style property browsing with an AI assistant (named "Nova"), contractor marketplace, full rent payment system, AI document intelligence, and landlord management tools.

### User Types

- **Renters:** Find apartments, apply for rentals, find roommates, pay rent, get lease reviews
- **Landlords:** List properties, find tenants, manage maintenance, collect rent, track earnings
- **Buyers/Sellers:** Browse homes for sale, make offers, schedule viewings
- **Contractors:** Get hired for home services (16 categories), submit bids, manage portfolio

## Key Features

| Feature | Description |
|---------|-------------|
| Nova AI Chatbot | AI assistant (Anthropic Claude) for guided property search |
| Property Listings | Browse, search, and filter rentals & homes for sale with Google Maps |
| Contractor Marketplace | Find/hire home service professionals with bidding system |
| E-Sign Documents | Sign leases and contracts digitally (DocuSign integration) |
| Rent Payment System | Stripe Elements for payments, Stripe Connect for landlord payouts |
| Rent Agreements | Create, accept, counter, or decline rental agreements |
| AI Document Intelligence | Tenant document review, lease comparison, deposit analysis |
| AI Property Valuation | Market value estimates with neighborhood comparison |
| Landlord Earnings Dashboard | Monthly income charts, vacancy rates, ROI projections |
| AI Property Search Chatbot | Natural language property search with session history |
| Credit Check Simulator | Simulated credit reports with risk levels (demo) |
| Multi-Language Support | English, French (Francais), Mandarin Chinese |
| PWA Support | Offline caching, push notifications, app install prompt |
| Web Push Notifications | Real-time browser push notifications via VAPID/Web Push API |
| 3D Virtual Tours | Matterport embed viewer for immersive property tours |
| Payment Automation | APScheduler for invoices, reminders, late fees, lease renewals |
| Analytics Dashboard | Performance metrics for all user types |

## Technology Summary

| Component | Technology | Purpose |
|-----------|------------|---------|
| Website (Frontend) | React.js, Tailwind CSS, Shadcn UI | User interface |
| Server (Backend) | Python FastAPI | Business logic & API |
| Database | MongoDB Atlas | Data storage |
| Hosting | AWS EC2 (Ubuntu) | Production server |
| Domain | GoDaddy | dommma.com domain |
| File Storage | Cloudflare R2 | Images & documents |
| AI | Anthropic Claude, Perplexity | Nova chatbot, property analysis |
| Payments | Stripe (Elements + Connect) | Card processing & landlord payouts |
| Emails | Resend | Transactional & reminder emails |
| E-Signatures | DocuSign | Digital document signing |
| Maps | Google Maps Platform | Address autocomplete, map display |
| Internationalization | i18next | EN/FR/ZH translations |
| Background Jobs | APScheduler | Recurring payment tasks |
| Push Notifications | Web Push API (VAPID) | Browser notifications |
| CI/CD | GitHub Actions | Automated deployment |

---

# 2. ARCHITECTURE DIAGRAM

```
+-------------------------------------------------------------------------+
|                           USER'S BROWSER                                 |
|                        (https://dommma.com)                              |
|                  React PWA + Service Worker + Push API                   |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                        AWS EC2 SERVER (Ubuntu)                           |
|                        IP: 35.182.109.198                                |
|  +-------------------------------------------------------------------+  |
|  |                         NGINX (Web Server)                        |  |
|  |         - HTTPS/SSL (Let's Encrypt)                               |  |
|  |         - Routes /api/* -> Backend (port 8001)                    |  |
|  |         - Routes /* -> Frontend (React build)                     |  |
|  +-------------------------------------------------------------------+  |
|                    |                              |                      |
|                    v                              v                      |
|  +-----------------------------+   +---------------------------------+  |
|  |   FRONTEND (React App)      |   |   BACKEND (FastAPI Server)      |  |
|  |   - 35+ pages              |   |   - Modular Router Architecture |  |
|  |   - Shadcn UI + Tailwind   |   |   - 16 Router Modules           |  |
|  |   - i18n (EN/FR/ZH)        |   |   - APScheduler (4 cron jobs)   |  |
|  |   - PWA Service Worker      |   |   - WebSocket support           |  |
|  |   Port: 3000 (internal)     |   |   Port: 8001 (internal)         |  |
|  |   Managed by: Nginx/PM2     |   |   Managed by: PM2               |  |
|  +-----------------------------+   +---------------------------------+  |
+-------------------------------------------------------------------------+
                                                    |
          +---------------------+-------------------+--------------------+
          |                     |                    |                    |
          v                     v                    v                    v
  +---------------+   +------------------+   +------------------+   +----------+
  | MongoDB Atlas |   | Cloudflare R2   |   | Third-Party APIs |   | Push     |
  | (Database)    |   | (File Storage)  |   | - Anthropic AI   |   | Service  |
  | - Users       |   | - Property imgs |   | - Stripe         |   | (VAPID)  |
  | - Listings    |   | - Documents     |   | - Resend Emails  |   |          |
  | - Agreements  |   | - Avatars       |   | - Google Maps    |   |          |
  | - Payments    |   | - Portfolios    |   | - DocuSign       |   |          |
  +---------------+   +------------------+   | - Perplexity     |   +----------+
                                             +------------------+
```

---

# 3. ACCOUNT ACCESS & CREDENTIALS

## CRITICAL: Keep These Safe!

### Master Account List

| Service | Login URL | Email/Username | Notes |
|---------|-----------|----------------|-------|
| GitHub | github.com | [Your GitHub email] | Code repository |
| AWS Console | aws.amazon.com | [Your AWS email] | Hosting |
| GoDaddy | godaddy.com | [Your GoDaddy email] | Domain |
| MongoDB Atlas | cloud.mongodb.com | [Your MongoDB email] | Database |
| Cloudflare | dash.cloudflare.com | [Your Cloudflare email] | File storage |
| Stripe | dashboard.stripe.com | [Your Stripe email] | Payments |
| Resend | resend.com | [Your Resend email] | Emails |
| Anthropic | console.anthropic.com | [Your Anthropic email] | AI |
| DocuSign | developers.docusign.com | [Your DocuSign email] | E-signatures |

### Admin Credentials

| Item | Value |
|------|-------|
| Admin Email | rgoswami@dommma.com |
| Contact Form Email | support@dommma.com |
| Admin Secret Key | dommma-admin-2026 |

### Test Accounts

| Account | Email | Password |
|---------|-------|----------|
| Test Renter | test@dommma.com | test123 |
| Test Landlord | testlandlord@dommma.com | test123 |

## 3.5 ADMIN TOOLS

### Admin API Endpoints

```
# Database Statistics
https://dommma.com/api/admin/database-stats?admin_key=dommma-admin-2026

# Contact Messages
https://dommma.com/api/admin/contact-messages?admin_key=dommma-admin-2026

# Clear Test Data (USE WITH CAUTION)
https://dommma.com/api/admin/clear-test-data?admin_key=dommma-admin-2026&collection=<name>
```

---

# 4. GITHUB REPOSITORY

## Repository Information

| Item | Value |
|------|-------|
| URL | https://github.com/Candour-Realty/Dommma_v2_2026 |
| Main Branch | `main` |
| Visibility | Private |
| CI/CD | `.github/workflows/deploy.yml` |

## Repository Structure (Modular Architecture v2.0)

```
Dommma_v2_2026/
+-- backend/                      # Python FastAPI server
|   +-- server.py                 # Main app (~7,400 lines, core routing)
|   +-- db.py                     # MongoDB connection
|   +-- requirements.txt          # Python dependencies
|   +-- routers/                  # 16 Modular Router Modules
|   |   +-- admin.py             # Admin dashboard, clear data
|   |   +-- auth.py              # Registration, login, email verify
|   |   +-- listings.py          # Property CRUD, map, claim, featured
|   |   +-- contractors.py       # Profiles, services, bookings, jobs, bids
|   |   +-- stripe_connect.py    # Landlord Stripe Connect onboarding
|   |   +-- ai_intelligence.py   # AI document review
|   |   +-- ai_valuation.py      # AI property valuation, neighborhood
|   |   +-- ai_chatbot.py        # AI property search chatbot
|   |   +-- scheduler.py         # Cron jobs (invoices, reminders)
|   |   +-- receipts.py          # Payment receipt PDF generation
|   |   +-- landlord_earnings.py # Earnings dashboard API
|   |   +-- web_push.py          # Web Push notifications (VAPID)
|   |   +-- calendar.py          # Calendar events
|   |   +-- moving.py            # Moving quotes
|   |   +-- compatibility.py     # Roommate compatibility
|   |   +-- portfolio.py         # Contractor portfolio
|   |   +-- nova.py              # Nova AI insights
|   +-- services/                 # Shared service modules
|   |   +-- email.py             # Email templates (Resend)
|   |   +-- r2_storage.py        # Cloudflare R2 file uploads
|   |   +-- auth_utils.py        # Password hashing (bcrypt)
|   |   +-- docusign_service.py  # DocuSign OAuth
|   +-- models/                   # Pydantic data models
|   +-- tests/                    # Backend tests
|
+-- frontend/                     # React website
|   +-- src/
|   |   +-- App.js               # Main routing
|   |   +-- pages/               # 40+ page components
|   |   +-- components/          # Shared UI components
|   |   |   +-- ui/              # Shadcn UI components
|   |   |   +-- MatterportViewer.jsx  # 3D tour embed
|   |   |   +-- LanguageToggle.jsx    # i18n dropdown
|   |   |   +-- chat/            # Nova AI chat
|   |   |   +-- notifications/   # Notification components
|   |   +-- lib/
|   |   |   +-- pushNotifications.js  # Web Push subscription
|   |   |   +-- utils.js
|   |   +-- locales/             # Translations
|   |   |   +-- en.json          # English
|   |   |   +-- fr.json          # French
|   |   |   +-- zh.json          # Mandarin Chinese
|   |   +-- hooks/               # Custom React hooks
|   +-- public/
|   |   +-- sw.js                # PWA Service Worker + Push handler
|   |   +-- manifest.json        # PWA manifest
|   +-- package.json
|
+-- .github/workflows/deploy.yml  # CI/CD pipeline
+-- README.md                     # Project documentation
+-- downloads/                    # Downloadable docs
+-- memory/                       # Development tracking docs
```

---

# 5. DOMAIN MANAGEMENT (GODADDY)

| Item | Value |
|------|-------|
| Domain | dommma.com |
| Registrar | GoDaddy |
| DNS Management | AWS Route 53 |

### DNS Records

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| A | dommma.com | 35.182.109.198 | Points domain to server |
| A | www.dommma.com | 35.182.109.198 | www subdomain |

---

# 6. AWS HOSTING (EC2)

| Item | Value |
|------|-------|
| Cloud Provider | AWS |
| Region | Canada (Central) - ca-central-1 |
| Instance Type | t3.small |
| OS | Ubuntu 24.04 LTS |
| Public IP | 35.182.109.198 (Elastic IP) |

### SSH Connection

```bash
# Mac/Linux
chmod 400 dommma-key.pem
ssh -i dommma-key.pem ubuntu@35.182.109.198

# Windows (PowerShell)
ssh -i C:\path\to\dommma-key.pem ubuntu@35.182.109.198
```

### Key Commands

```bash
# Check services
sudo systemctl status nginx
pm2 status
pm2 logs dommma-backend --lines 50

# Restart
sudo systemctl restart nginx
pm2 restart dommma-backend

# Full deploy
cd /home/ubuntu/dommma && \
git pull origin main && \
source backend/venv/bin/activate && \
pip install -r backend/requirements.txt && \
pm2 restart dommma-backend && \
cd frontend && yarn install && yarn build && \
sudo chown -R www-data:www-data build/ && \
sudo chmod -R 755 build/ && \
sudo systemctl restart nginx
```

---

# 7. DATABASE (MONGODB ATLAS)

| Item | Value |
|------|-------|
| Provider | MongoDB Atlas (Cloud) |
| Database Name | dommma |
| Region | AWS Canada |

### Collections

| Collection | Purpose |
|------------|---------|
| users | User accounts (renters, landlords, contractors) |
| listings | Property listings (rent, sale) |
| applications | Rental applications |
| messages | Direct messages between users |
| payment_transactions | Stripe payment records |
| rent_invoices | Rent invoice records |
| rent_agreements | Landlord-tenant agreements |
| rent_payments | Rent payment records |
| job_posts | Contractor job listings |
| job_bids | Contractor bid submissions |
| bookings | Service bookings |
| contractor_profiles | Contractor business profiles |
| contractor_services | Services offered by contractors |
| esign_documents | E-sign document records |
| documents | Uploaded documents |
| notifications | In-app notifications |
| push_subscriptions | Web Push subscription data |
| lease_assignments | Lease takeover listings |
| contact_messages | Contact form submissions |
| financing_applications | Financing applications |
| chat_sessions | Nova AI chat sessions |
| ai_chat_sessions | AI property search sessions |
| credit_reports | Credit check reports |

---

# 8. FILE STORAGE (CLOUDFLARE R2)

| Item | Value |
|------|-------|
| Provider | Cloudflare R2 |
| Bucket | dommma-files |

Stores: property images, avatars, documents, contractor portfolios.

---

# 9. THIRD-PARTY SERVICES

### Anthropic (AI)
- **Model:** Claude Sonnet 4.5
- **Purpose:** Powers Nova, document review, property valuation, contractor verification
- **Cost:** ~$0.003/message

### Perplexity AI
- **Purpose:** Real-time property market data, competitor analysis
- **Cost:** Pay per API call

### Stripe
- **Purpose:** Card payments (Elements), landlord payouts (Connect, 2.5% fee)
- **Cost:** 2.9% + $0.30/transaction

### Resend
- **Purpose:** Transactional emails, payment reminders
- **Cost:** Free tier: 3,000 emails/month

### DocuSign
- **Purpose:** Digital document signing (OAuth 2.0)

### Google Maps
- **APIs:** Maps JavaScript, Places (autocomplete)
- **Cost:** $200 free credit/month

### Web Push (VAPID)
- **Purpose:** Browser push notifications
- **Cost:** Free (self-hosted)

---

# 10. HOW TO UPDATE THE WEBSITE

### Quick Deploy

```bash
# SSH to server
ssh -i dommma-key.pem ubuntu@35.182.109.198

# Pull and deploy
cd /home/ubuntu/dommma && git pull origin main

# Backend changes
source backend/venv/bin/activate
pip install -r backend/requirements.txt
pm2 restart dommma-backend

# Frontend changes
cd frontend && yarn install && yarn build
sudo chown -R www-data:www-data build/
sudo systemctl restart nginx
```

---

# 11. HOW TO ADD NEW FEATURES

## Backend (Modular Router Architecture)

New features should be added as **router modules** in `/backend/routers/`:

```python
# /backend/routers/my_feature.py
from fastapi import APIRouter
from db import db

router = APIRouter(prefix="/my-feature", tags=["my-feature"])

@router.get("/")
async def get_data():
    data = await db.my_collection.find({}, {"_id": 0}).to_list(100)
    return data
```

Then include in `server.py`:
```python
from routers.my_feature import router as my_feature_router
app.include_router(my_feature_router, prefix="/api")
```

## Frontend

1. Create page: `frontend/src/pages/MyPage.jsx`
2. Add route in `frontend/src/App.js`
3. Add navigation link if needed

---

# 12. TROUBLESHOOTING GUIDE

### Website Shows Blank Page
- Check browser console (F12)
- Verify `frontend/.env` has `REACT_APP_BACKEND_URL`
- Rebuild: `cd frontend && yarn build`

### 502 Bad Gateway
- Backend crashed: `pm2 status` then `pm2 restart dommma-backend`
- Check logs: `pm2 logs dommma-backend --lines 50`

### Push Notifications Not Working
- Verify VAPID keys in `backend/.env`
- Check browser supports Push API
- User must grant notification permission

### Emails Not Sending
- Check Resend dashboard for errors
- Verify `RESEND_API_KEY` in backend `.env`

### Database Connection Failed
- MongoDB Atlas > Network Access > Add server IP: 35.182.109.198

---

# 13. SECURITY BEST PRACTICES

- Keep `.pem` file secure, never commit to Git
- Rotate API keys periodically
- Enable 2FA on all service accounts
- Keep server updated: `sudo apt update && sudo apt upgrade`
- Monitor AWS billing for anomalies

---

# 14. COSTS & BILLING

| Service | Estimated Cost | Cycle |
|---------|---------------|-------|
| AWS EC2 (t3.small) | ~$15-20/month | Monthly |
| MongoDB Atlas | Free tier or ~$10/month | Monthly |
| Cloudflare R2 | ~$5-15/month | Monthly |
| Domain (GoDaddy) | ~$15-20/year | Annual |
| Anthropic AI | ~$20-50/month | Monthly |
| Stripe | 2.9% + $0.30/txn | Per use |
| Resend | Free (3K emails) | Monthly |
| Google Maps | Free ($200 credit) | Monthly |

**Total: ~$50-100/month** (varies with usage)

---

# 15. EMERGENCY CONTACTS & SUPPORT

| Service | Support URL |
|---------|-------------|
| AWS | aws.amazon.com/support |
| MongoDB | mongodb.com/support |
| Stripe | support.stripe.com |
| GoDaddy | godaddy.com/help |

---

# APPENDIX A: COMPLETE API ENDPOINT REFERENCE

## Auth (routers/auth.py)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/verify-email?token=` - Verify email
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/change-password` - Change password

## Listings (routers/listings.py)
- `GET /api/listings` - Browse listings with filters/sort
- `GET /api/listings/map` - Get listings for map bounds
- `GET /api/listings/{id}` - Get listing details
- `POST /api/listings` - Create listing
- `GET/POST /api/listings/claim` - Claim listing workflow
- `POST /api/listings/{id}/featured` - Enable featured
- `DELETE /api/listings/{id}/featured` - Disable featured
- `POST /api/listings/{id}/mark-rented` - Mark as rented

## Contractors (routers/contractors.py)
- `POST /api/contractors/profile` - Create/update profile
- `GET /api/contractors/profile/{id}` - Get profile
- `GET /api/contractors/search` - Search contractors
- `POST /api/contractors/verify-document` - AI document verify
- `POST /api/contractors/services` - Add service
- `GET /api/contractors/{id}/services` - Get services
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/{id}/status` - Update booking status
- `POST /api/bookings/{id}/pay` - Pay for booking
- `POST /api/jobs` - Create job post
- `GET /api/jobs` - Browse jobs
- `POST /api/jobs/{id}/bids` - Submit bid
- `PUT /api/jobs/{id}/bids/{bid_id}/accept` - Accept bid
- `GET /api/contractors/leaderboard` - Top rated

## Rent System (server.py)
- `POST /api/rent/agreements` - Create agreement
- `GET /api/rent/agreements` - Get agreements
- `POST /api/rent/agreements/{id}/accept` - Accept agreement
- `POST /api/rent/agreements/{id}/counter` - Counter terms
- `POST /api/rent/payments/{id}/pay` - Pay rent
- `GET /api/rent/payments` - Payment history

## AI Features
- `POST /api/ai-intelligence/review-document` - AI doc review
- `POST /api/ai-valuation/property-valuation` - Property valuation
- `GET /api/ai-valuation/neighborhood-comparison` - Area comparison
- `POST /api/ai-chatbot/chat` - AI property search
- `GET /api/credit-check/reports` - Credit check

## Payments
- `POST /api/payments/create-checkout` - Stripe checkout
- `GET /api/payments/status/{session_id}` - Payment status
- `POST /api/stripe-connect/create-account` - Connect account
- `GET /api/landlord-earnings/{user_id}` - Earnings data

## Push Notifications (routers/web_push.py)
- `GET /api/push/vapid-public-key` - Get VAPID public key
- `POST /api/push/subscribe` - Subscribe to push
- `DELETE /api/push/unsubscribe/{user_id}` - Unsubscribe
- `POST /api/push/send` - Send push notification
- `POST /api/push/send-bulk` - Bulk push

## Scheduler (routers/scheduler.py)
- `POST /api/scheduler/run-invoices` - Generate invoices
- `POST /api/scheduler/run-reminders` - Send reminders
- `POST /api/scheduler/run-late-fees` - Check late payments
- `POST /api/scheduler/run-renewals` - Check lease renewals

---

# APPENDIX B: ENVIRONMENT VARIABLES

## Backend (.env)
```
MONGO_URL=mongodb+srv://...
DB_NAME=dommma
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_API_KEY=sk_live_...
RESEND_API_KEY=re_...
SENDER_EMAIL=noreply@dommma.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DOCUSIGN_INTEGRATION_KEY=...
PERPLEXITY_API_KEY=pplx-...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
R2_ENDPOINT=https://...r2.cloudflarestorage.com
R2_BUCKET=dommma-files
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_CLAIMS_EMAIL=mailto:support@dommma.com
```

## Frontend (.env)
```
REACT_APP_BACKEND_URL=https://dommma.com
REACT_APP_GOOGLE_MAPS_KEY=...
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...
REACT_APP_VAPID_PUBLIC_KEY=...
```

---

# APPENDIX C: NGINX CONFIGURATION

Location: `/etc/nginx/sites-available/dommma`

```nginx
server {
    listen 80;
    server_name dommma.com www.dommma.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name dommma.com www.dommma.com;

    ssl_certificate /etc/letsencrypt/live/dommma.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dommma.com/privkey.pem;

    root /home/ubuntu/dommma/frontend/build;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

# APPENDIX D: SSL CERTIFICATE RENEWAL

```bash
sudo certbot certificates       # Check expiry
sudo certbot renew              # Manual renewal
sudo certbot renew --dry-run    # Test auto-renewal
```

---

**END OF DOCUMENT**

*Last Updated: March 31, 2026*
*Document Version: 2.0*
