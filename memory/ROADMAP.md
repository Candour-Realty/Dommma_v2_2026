# DOMMMA Product Roadmap

## Current Status: V16 (March 2026)

Platform is fully functional with AI chatbot, property listings, contractor marketplace, e-signing, payments, and analytics.

---

## Immediate Priorities (P0)

### 1. DocuSign Client Secret Configuration
- **Status:** BLOCKED - Needs user input
- **Description:** User needs to provide DocuSign Client Secret from DocuSign Developer Console
- **Impact:** DocuSign OAuth token exchange will fail without it
- **Action:** Request from user in next session

### 2. My Resume Page Implementation
- **Status:** IN PROGRESS
- **Description:** Build out the renter resume page (`/my-resume`) with full functionality
- **Files:** `/app/frontend/src/pages/MyResume.jsx`
- **Features needed:**
  - Employment information form
  - Rental history section
  - References management
  - Resume PDF export
  - Completeness score display

### 3. AI Applicant Ranking Logic
- **Status:** SCAFFOLDED
- **Description:** Implement AI-powered tenant ranking for landlords
- **Files:** `/app/frontend/src/pages/ApplicantRanking.jsx`
- **Features needed:**
  - Fetch applicants for landlord's properties
  - AI scoring based on income, employment, rental history
  - Sort and filter applicants
  - Quick approve/reject actions

---

## Short-term Goals (P1)

### 4. Video Tours with Cloudinary
- **Status:** SDK installed, needs integration
- **Description:** Allow landlords to upload video tours of properties
- **Files:** 
  - `/app/frontend/src/components/VideoTourUploader.jsx` (exists)
  - `/app/frontend/src/components/VideoTourPlayer.jsx` (exists)
- **Tasks:**
  - Backend endpoint for Cloudinary signature
  - Video upload in Add Property flow
  - Video display on listing detail page
  - Progress tracking during upload

### 5. Listing Syndication (Deep Integration)
- **Status:** SCAFFOLDED
- **Description:** Auto-post listings to external platforms
- **Files:** `/app/frontend/src/pages/ListingSyndication.jsx`
- **Platforms:**
  - Facebook Marketplace
  - Craigslist
  - Kijiji
- **Features:**
  - One-click formatted content generation
  - Deep links to post on each platform
  - Syndication tracking and stats

### 6. Renter Resume from Chat
- **Status:** AI tool exists, needs enhancement
- **Description:** Auto-build tenant profile from conversation with Nova
- **Enhancement needed:**
  - Extract more data points from chat
  - Prompt user to fill gaps
  - Save directly to renter_resumes collection

---

## Medium-term Goals (P2)

### 7. Verification System (Trust Score)
- **Description:** Build user trust through verification
- **Components:**
  - Persona integration for ID verification
  - AI document review for contractor licenses
  - Trust score calculation
  - Verified badges on profiles

### 8. AI Listing Optimizer
- **Description:** AI suggests optimal pricing and descriptions
- **Features:**
  - Analyze comparable listings
  - Suggest competitive pricing
  - Generate optimized descriptions
  - Photo quality recommendations

### 9. Enhanced Maintenance Triage
- **Description:** Improve AI maintenance analysis
- **Features:**
  - Photo upload in chat
  - Multi-image analysis
  - Auto-dispatch to contractors
  - Priority escalation rules

---

## Long-term Vision (P3)

### 10. In-House Financing
- **Description:** Line of Credit for platform users
- **Targets:**
  - Landlords (property improvements)
  - Contractors (equipment purchases)
  - Renters (security deposits)

### 11. Native Mobile Apps
- **Description:** iOS and Android apps
- **Approach:**
  - React Native or Flutter
  - Push notification support
  - Offline capability
  - Native camera access

### 12. Advanced AI Features
- **Description:** Next-gen AI capabilities
- **Features:**
  - Multi-property comparison
  - Market trend predictions
  - Automated rent adjustments
  - Chatbot personality customization

---

## Technical Debt

### Code Quality
| Task | Priority | Effort |
|------|----------|--------|
| Split server.py into routers | P3 | Medium |
| Fix npm peer dependency warnings | P2 | Low |
| Add comprehensive test coverage | P2 | High |
| Implement proper error boundaries | P3 | Low |

### Infrastructure
| Task | Priority | Effort |
|------|----------|--------|
| Set up CI/CD pipeline | P2 | Medium |
| Add monitoring/alerting | P2 | Medium |
| Implement rate limiting | P2 | Low |
| Database backup automation | P1 | Low |

---

## Feature Completion Matrix

| Feature | Backend | Frontend | Testing | Docs |
|---------|---------|----------|---------|------|
| Auth | DONE | DONE | DONE | DONE |
| Listings | DONE | DONE | DONE | DONE |
| Contractors | DONE | DONE | DONE | DONE |
| AI Chat | DONE | DONE | DONE | DONE |
| Voice | DONE | DONE | DONE | DONE |
| Payments | DONE | DONE | DONE | DONE |
| DocuSign | DONE | DONE | DONE | PARTIAL |
| Analytics | DONE | DONE | DONE | DONE |
| Lease Assignments | DONE | DONE | DONE | DONE |
| E-Sign | DONE | DONE | DONE | DONE |
| My Resume | PARTIAL | SCAFFOLDED | - | - |
| AI Ranking | - | SCAFFOLDED | - | - |
| Video Tours | PARTIAL | SCAFFOLDED | - | - |
| Syndication | - | SCAFFOLDED | - | - |

---

## Success Metrics

### User Engagement
- Daily active users
- Chat messages per session
- Listings created via AI
- Contractor bookings

### Revenue
- Stripe transaction volume
- Lease assignment fees
- Premium subscriptions (future)

### Platform Health
- API response times
- Error rates
- User satisfaction scores

---

## Timeline (Estimated)

| Quarter | Focus |
|---------|-------|
| Q1 2026 | Complete P0 items, Video Tours |
| Q2 2026 | Verification System, AI Optimizer |
| Q3 2026 | Mobile Apps MVP |
| Q4 2026 | In-House Financing, Scale |

---

*Last updated: March 2, 2026*
