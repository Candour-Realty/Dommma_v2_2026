# DOMMMA Platform - Product Requirements Document

## Project Overview
DOMMMA is a real estate rental platform with AI-powered property search (Nova AI chatbot), featuring modern landing pages and a functional property management system.

## Tech Stack
- **Frontend**: React.js with Tailwind CSS (Port 3000)
- **Backend**: FastAPI/Python (Port 8001)
- **Database**: MongoDB
- **AI Integration**: Claude Sonnet 4.5 via Emergent LLM Key

## User Personas
1. **Renters** - Looking for rental properties (FREE tier)
2. **Landlords** - Managing rental properties ($49-99+/mo)
3. **Contractors** - Service providers ($49/mo)

## Core Requirements
### Landing Pages (7 total)
- Home - Hero, stats, Nova intro, AI features, audience sections
- About - Company story, values, mission
- For Renters - 15 AI features list
- For Landlords - Property management features
- Contractors - Service network
- Pricing - Tiered plans with billing toggle

### Browse/Search
- Property listings with filters (bedrooms, bathrooms, price, pet-friendly)
- Map placeholder with property pins
- Listing detail modal
- Search by city/neighborhood

### Nova AI Chatbot
- Claude Sonnet 4.5 integration
- Natural language property search
- Multi-turn conversations with context
- Property recommendations with match scores

## What's Been Implemented (Jan 2026)
- [x] 7 landing pages with premium design
- [x] Browse page with 20 Vancouver listings
- [x] Property filters and search
- [x] Nova AI chatbot (Claude Sonnet 4.5)
- [x] Responsive navigation
- [x] Animated UI elements
- [x] MongoDB data persistence
- [x] API endpoints for listings, chat, seed data

## Design System
- Primary: #667eea (Purple)
- Secondary: #764ba2 (Purple)
- Accent: #4fd1c5 (Teal)
- Fonts: Playfair Display (headings), Inter (body)
- Gradients: Purple to Teal brand gradient

## API Endpoints
- GET /api/listings - Property listings with filters
- GET /api/listings/map - Map boundary search
- POST /api/chat - Nova AI conversations
- POST /api/seed - Seed sample data

## Backlog (P0/P1/P2)

### P0 - Critical
- [ ] User authentication (Firebase Auth)
- [ ] Real Google Maps integration
- [ ] Listing creation flow

### P1 - Important
- [ ] User favorites/saved listings
- [ ] Application submission
- [ ] Landlord dashboard
- [ ] Payment integration (Stripe)

### P2 - Nice to Have
- [ ] Voice search
- [ ] Multi-language support
- [ ] Contractor marketplace
- [ ] Mobile app

## Next Tasks
1. Implement Firebase authentication
2. Add real Google Maps with markers
3. Build user profile/dashboard
4. Add favorite listings feature
