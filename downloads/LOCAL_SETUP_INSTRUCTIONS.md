# DOMMMA Local Setup Instructions

## Files You Need (Not in GitHub)

These files contain API keys and are gitignored for security:

1. **backend/.env** - Backend environment variables
2. **frontend/.env** - Frontend environment variables

## Setup Steps

### 1. Clone the repository
```bash
git clone https://github.com/rishgos/Dommma-v2_WIP.git
cd Dommma-v2_WIP
```

### 2. Add environment files
- Copy `backend.env` to `backend/.env`
- Copy `frontend.env` to `frontend/.env`

### 3. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install bcrypt==4.0.1

# Start backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### 4. Frontend Setup (new terminal)
```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start frontend
npm start
```

### 5. Open in Browser
Go to: http://localhost:3000

## API Keys Included

| Service | Purpose | Status |
|---------|---------|--------|
| MongoDB Atlas | Database | Working (shared cloud DB) |
| Anthropic | AI Chatbot (Claude) | Working |
| OpenAI | Voice (Whisper/TTS) | Working |
| Google Maps | Maps & Places | Working |
| Stripe | Payments | Test mode |
| DocuSign | E-Sign | Demo environment |
| Resend | Emails | Working |
| Google OAuth | Calendar | Working |

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Landlord | testlandlord@test.com | test123 |

## Troubleshooting

### bcrypt error
```bash
pip uninstall bcrypt passlib -y
pip install bcrypt==4.0.1 passlib
```

### npm peer dependency warnings
```bash
npm install --legacy-peer-deps
```

### MongoDB connection issues
The app uses MongoDB Atlas (cloud). Make sure you have internet connectivity.
