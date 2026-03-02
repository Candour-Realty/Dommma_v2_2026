# DOMMMA Backend

FastAPI backend for the DOMMMA real estate marketplace platform.

## Quick Start

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (see Environment Variables below)

# Start server
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

API docs available at `http://localhost:8001/docs`

## Requirements

- Python 3.10+ (recommended, avoid 3.14+)
- MongoDB (local or Atlas)
- Virtual environment recommended

## Environment Variables

Create `.env` file in this folder:

```env
# Required - Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=dommma

# Required - AI Features
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here

# Optional - Google Calendar Integration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Optional - Payments
STRIPE_API_KEY=your_stripe_key

# Optional - DocuSign E-Sign Integration
DOCUSIGN_INTEGRATION_KEY=your_integration_key
DOCUSIGN_CLIENT_SECRET=your_client_secret
DOCUSIGN_AUTH_SERVER=account-d.docusign.com
DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi

# Optional - Email
RESEND_API_KEY=your_resend_key
```

## Project Structure

```
backend/
├── server.py              # Main FastAPI application (~4200 lines)
├── db.py                  # MongoDB connection
├── models/                # Pydantic data models
│   ├── listing_models.py  # Property listing models
│   └── assignment_models.py # Lease assignment models
├── routers/               # Modular API route handlers
│   ├── calendar.py        # Calendar & Google OAuth
│   ├── moving.py          # Moving quotes
│   ├── compatibility.py   # Roommate matching
│   ├── portfolio.py       # Contractor portfolio
│   └── nova.py            # Nova AI (TTS, Insights)
├── services/              # Business logic & integrations
│   ├── ai_tools.py        # AI tool definitions for Claude
│   ├── docusign_service.py # DocuSign OAuth integration
│   ├── nova_memory.py     # Long-term AI memory
│   ├── nova_insights.py   # User analytics
│   ├── voice.py           # Whisper STT
│   ├── tts.py             # OpenAI TTS
│   ├── image_analysis.py  # Property image AI
│   └── email.py           # Resend email
├── tests/                 # pytest test files
├── seed_database.py       # Database seeding script
└── setup_local.py         # Local setup automation
```

## API Endpoints

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | User registration |
| `/api/auth/login` | POST | JWT authentication |

### AI / Nova Chat
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Main Nova AI chat endpoint |
| `/api/ai/concierge` | POST | AI concierge with tool calling |
| `/api/nova/transcribe` | POST | Whisper STT (voice to text) |
| `/api/nova/tts` | POST | OpenAI TTS (text to voice) |
| `/api/nova/analyze-image` | POST | Property image analysis |
| `/api/nova/memory/{user_id}` | GET | Get user's saved preferences |
| `/api/nova/insights/{user_id}` | GET | User analytics & insights |

### Properties
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/listings` | GET | List all properties |
| `/api/listings` | POST | Create new listing |
| `/api/listings/{id}` | GET | Get single listing |

### Lease Assignments
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/lease-assignments` | GET | List all assignments |
| `/api/lease-assignments` | POST | Create assignment |
| `/api/lease-assignments/{id}/payment` | POST | Create Stripe checkout |

### DocuSign Integration
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/docusign/status` | GET | Check connection status |
| `/api/docusign/auth-url` | GET | Generate OAuth URL |
| `/api/docusign/callback` | POST | OAuth token exchange |
| `/api/docusign/disconnect` | POST | Disconnect account |
| `/api/docusign/send-envelope` | POST | Send document for signature |

### Analytics
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/overview` | GET | Platform overview stats |
| `/api/analytics/activity` | GET | Recent activity feed |
| `/api/analytics/revenue` | GET | Revenue by period |
| `/api/analytics/listings-performance` | GET | Listing metrics |

### Other Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/contractors/search` | GET | Search contractors |
| `/api/bookings/*` | - | Contractor bookings |
| `/api/roommates/*` | - | Roommate finder |
| `/api/moving/*` | - | Moving quotes |
| `/api/calendar/*` | - | Calendar & Google OAuth |
| `/api/notifications/*` | - | Push notifications |
| `/api/esign/*` | - | E-sign documents |

Full API docs: `http://localhost:8001/docs`

## AI Tools (Claude Tool Calling)

The AI concierge endpoint (`/api/ai/concierge`) supports these tools:

| Tool | Description |
|------|-------------|
| `create_listing` | Create property listings via conversation |
| `search_listings` | Search properties with natural language |
| `find_contractors` | Find service professionals |
| `triage_maintenance` | Analyze maintenance requests |
| `calculate_budget` | Budget calculations (30% rule) |
| `schedule_viewing` | Book property viewings |
| `price_lease_assignment` | Calculate lease assignment fees |
| `build_renter_resume` | Create/update tenant profiles |
| `get_renter_resume` | Retrieve tenant profiles |

## Testing

```bash
# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_analytics_docusign_lease.py -v
```

## Database Collections

| Collection | Description |
|------------|-------------|
| `users` | User accounts |
| `listings` | Property listings |
| `lease_assignments` | Lease transfer marketplace |
| `contractor_profiles` | Contractor info |
| `bookings` | Contractor bookings |
| `esign_documents` | E-sign documents |
| `docusign_connections` | DocuSign OAuth tokens |
| `payment_transactions` | Stripe transactions |
| `chat_sessions` | AI chat history |
| `renter_resumes` | Tenant profiles |

## Development Notes

- Hot reload is enabled (`--reload` flag)
- MongoDB Atlas is used (connection string in .env)
- All AI calls use direct API (Anthropic, OpenAI)
- Stripe uses test mode in development
- DocuSign uses demo environment (account-d.docusign.com)
