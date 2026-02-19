# DOMMMA V2 - Complete Real Estate Marketplace Platform

## Original Problem Statement
Build a complete real estate marketplace called "DOMMMA" for Renters, Landlords, and Contractors with role-specific features, dark teal theme, AI chatbot (Nova), Stripe payments, and full marketplace functionality.

## Tech Stack
- **Frontend**: React.js with Tailwind CSS, Shadcn UI
- **Backend**: Python FastAPI
- **Database**: MongoDB (Motor async driver)
- **Auth**: JWT + passlib bcrypt
- **Payments**: Stripe (test key)
- **AI**: Claude Sonnet 4.5 (Emergent LLM Key)
- **Maps**: Google Maps API
- **Notifications**: Firebase Cloud Messaging
- **Analytics**: Firebase Analytics

## User Personas
1. **Renter** - Search properties, apply, message landlords, hire contractors, pay rent
2. **Landlord** - Manage properties (CRUD + photos), review applications, track maintenance
3. **Contractor** - Create profile, post services, manage bookings, get paid

## Core Architecture
```
/app/
├── backend/
│   ├── server.py        # All API routes (needs refactoring)
│   ├── fcm_utils.py     # Firebase messaging
│   └── .env             # MONGO_URL, EMERGENT_LLM_KEY, STRIPE_API_KEY
├── frontend/src/
│   ├── App.js           # Router + Auth context
│   ├── pages/
│   │   ├── Home.jsx                  # Landing page
│   │   ├── Browse.jsx                # Property search + map
│   │   ├── Login.jsx                 # Auth (register/login)
│   │   ├── Dashboard.jsx             # Role-based dashboard
│   │   ├── MyProperties.jsx          # Landlord property CRUD
│   │   ├── ContractorMarketplace.jsx # Browse/book contractors
│   │   ├── ContractorProfile.jsx     # Contractor dashboard
│   │   ├── Applications.jsx          # Rental applications
│   │   ├── Maintenance.jsx           # Maintenance requests
│   │   ├── Jobs.jsx                  # Contractor jobs
│   │   ├── Messages.jsx              # Messaging
│   │   ├── Payments.jsx              # Payment history
│   │   └── Documents.jsx             # Document management
│   └── components/
│       ├── chat/NovaChat.js          # AI chatbot
│       └── notifications/NotificationBell.js
└── memory/PRD.md
```

## What's Been Implemented (as of Feb 19, 2026)

### Phase 1 - Core Platform ✅
- [x] JWT auth with passlib bcrypt (register/login for 3 roles)
- [x] Homepage with hero, Nova AI search, property grid, contractor section
- [x] Property browsing with Google Maps integration
- [x] Dashboard with role-based navigation
- [x] Firebase Analytics + Cloud Messaging
- [x] "Made with Emergent" badge hidden

### Phase 2 - Full Renter/Landlord ✅
- [x] Browse properties → Apply Now + Message Landlord buttons in listing modal
- [x] Applications page (submit/track for renters, review for landlords)
- [x] Maintenance requests (submit/track)
- [x] Messaging system (WebSocket real-time)
- [x] Payments page with Stripe checkout
- [x] Documents management (upload, view, sign)
- [x] **Landlord My Properties** - Full CRUD with photo upload, amenities, property details

### Phase 3 - Full Contractor Marketplace ✅
- [x] **Contractor Profiles** - Business info, specialties, service areas, rates, insurance
- [x] **Service Listings** - Contractors post services with pricing/duration
- [x] **Contractor Search** - Browse by category, search by name/specialty/area
- [x] **Service Booking** - Customers book contractors with date/time/address
- [x] **Booking Management** - Contractors confirm/start/complete bookings
- [x] **Review System** - Customers review completed bookings, auto-calculated ratings
- [x] **Payment for Bookings** - Stripe integration for contractor payments
- [x] Image upload endpoint for property photos and portfolios

### Key API Endpoints
- `POST/GET /api/auth/register, /api/auth/login` - Authentication
- `GET /api/listings` - Browse properties
- `POST /api/listings/create` - Create listing (landlord)
- `GET /api/listings/landlord/{id}` - Landlord's properties
- `PUT /api/listings/{id}` - Update listing
- `DELETE /api/listings/{id}` - Delete listing
- `GET /api/contractors/search` - Search contractors
- `POST /api/contractors/profile` - Create/update contractor profile
- `POST/GET /api/contractors/services` - Contractor services
- `GET /api/services/search` - Search all services
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/{id}/status` - Update booking status
- `POST /api/bookings/{id}/pay` - Pay for booking (Stripe)
- `POST /api/bookings/{id}/review` - Leave review
- `POST /api/upload/image` - Upload image

### DB Collections
- `users` - Auth and profiles
- `listings` - Property listings
- `contractor_profiles` - Contractor business profiles
- `contractor_services` - Service offerings
- `bookings` - Service bookings
- `rental_applications` - Rental applications
- `maintenance_requests` - Maintenance tickets
- `payment_transactions` - Payment history
- `images` - Uploaded images
- `notifications` - Push notifications
- `fcm_tokens` - Firebase messaging tokens

## Prioritized Backlog

### P0 - Next Up
- [ ] Email Notifications (Resend integration) - registration confirmation, payment receipts
- [ ] Backend refactoring - split monolithic server.py into routers/models/services

### P1 - Important
- [ ] Enhanced Nova AI Chatbot Phase 2 (visual search, document analysis, commute optimizer)
- [ ] Application status tracking with email notifications
- [ ] Landlord: view applicant details and approve/reject with notifications

### P2 - Nice to Have
- [ ] Roommate Finder system
- [ ] Google Calendar integration for property viewings
- [ ] Moving company API integration
- [ ] Social features (community, reviews)
- [ ] Advanced search filters (commute-based, lifestyle matching)

## Test Reports
- `/app/test_reports/iteration_3.json` - Core features
- `/app/test_reports/iteration_4.json` - Firebase + role pages
- `/app/test_reports/iteration_5.json` - Password hashing
- `/app/test_reports/iteration_6.json` - Contractor marketplace + landlord properties + enhanced browse (ALL PASSING 100%)

## Test Credentials
- Renter: `renter@dommma.com / password123`
- Landlord: `landlord@dommma.com / password123`
- Contractor: `contractor@dommma.com / password123`

## Seed Data
- 21+ property listings in Vancouver area
- 7 contractor profiles (plumbing, electrical, painting, renovation, landscaping, cleaning, test)
- 18+ contractor services
