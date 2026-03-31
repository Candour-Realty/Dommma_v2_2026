# Test Credentials for DOMMMA Platform

## User Accounts
- **Test User (Renter)**: test@dommma.com / test123
- **Test Landlord**: testlandlord@dommma.com / test123

## Admin Access
- Admin key: `dommma-admin-2026` (passed as `admin_key` query parameter)

## Test IDs
- Test tenant ID: dcc2cce1-e8d4-43b5-8096-9db712f36720

## API Keys (configured in backend .env)
- Stripe API Key: configured
- Anthropic API Key: configured
- OpenAI API Key: configured
- Perplexity API Key: configured
- Resend API Key: configured

## Key Endpoints
- Login: POST /api/auth/login
- Listings: GET /api/listings
- User search: GET /api/users/search?q=test
- Admin stats: GET /api/admin/database-stats?admin_key=dommma-admin-2026
- AI Chat: POST /api/ai/property-chat
- Credit Check: POST /api/credit-check/request
- Earnings: GET /api/landlord/earnings?landlord_id={id}
- Valuation: POST /api/ai/property-valuation
- Smart Pricing: POST /api/ai/smart-rent-pricing
- Neighborhoods: GET /api/ai/neighborhood-comparison
