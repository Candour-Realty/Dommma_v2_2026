# DOMMMA Frontend

React.js frontend for the DOMMMA real estate marketplace platform.

## Quick Start

```bash
# Install dependencies (legacy flag required)
npm install --legacy-peer-deps
# OR with yarn
yarn install

# Create .env file
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env

# Start development server
npm start
# OR
yarn start
```

Opens at `http://localhost:3000`

## Requirements

- Node.js 18+
- npm or Yarn package manager
- Backend server running on port 8001

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run tests |
| `npm run lint` | Run ESLint |

## Environment Variables

Create `.env` file:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_GOOGLE_MAPS_KEY=your_google_maps_key
```

For production, `REACT_APP_BACKEND_URL` should point to your deployed backend URL.

## Project Structure

```
frontend/src/
├── App.js                     # Main app with routing & auth context
├── i18n.js                    # i18next configuration (EN/FR)
├── index.js                   # Entry point
├── index.css                  # Global styles (Tailwind)
│
├── pages/                     # Page components
│   ├── Home.jsx               # Homepage with AI search bar
│   ├── Browse.jsx             # Property listings
│   ├── Dashboard.jsx          # Role-based dashboard
│   ├── AnalyticsDashboard.jsx # Platform analytics
│   ├── ESign.jsx              # E-sign with DocuSign
│   ├── LeaseAssignments.jsx   # Lease marketplace
│   ├── Contractors.jsx        # Contractor marketplace
│   ├── MyProperties.jsx       # Landlord property management
│   ├── RoommateFinder.jsx     # Roommate matching
│   ├── MovingQuote.jsx        # Moving calculator
│   ├── NovaInsights.jsx       # AI analytics
│   ├── CalendarPage.jsx       # Viewing scheduler
│   └── ...
│
├── components/
│   ├── chat/
│   │   └── NovaChat.jsx       # AI chatbot component
│   ├── ui/                    # Shadcn UI components
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   ├── dialog.jsx
│   │   └── ...
│   ├── layout/
│   │   ├── MainLayout.jsx     # Public page layout
│   │   └── DashboardLayout.jsx # Dashboard layout with sidebar
│   └── notifications/
│       └── NotificationBell.jsx
│
└── public/
    ├── locales/               # Translation files
    │   ├── en/translation.json
    │   └── fr/translation.json
    ├── manifest.json          # PWA manifest
    └── service-worker.js      # PWA service worker
```

## Key Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home.jsx | Homepage with Nova AI search |
| `/browse` | Browse.jsx | Property listings grid |
| `/dashboard` | Dashboard.jsx | Role-based user dashboard |
| `/analytics` | AnalyticsDashboard.jsx | Platform metrics (landlord) |
| `/esign` | ESign.jsx | E-sign documents with DocuSign |
| `/lease-assignments` | LeaseAssignments.jsx | Lease marketplace with payments |
| `/contractors` | Contractors.jsx | Contractor marketplace |
| `/my-properties` | MyProperties.jsx | Landlord property management |
| `/roommates` | RoommateFinder.jsx | AI roommate matching |
| `/moving-quote` | MovingQuote.jsx | Moving cost calculator |
| `/nova-insights` | NovaInsights.jsx | AI analytics dashboard |
| `/calendar` | CalendarPage.jsx | Viewing scheduler |

## UI Components

This project uses **Shadcn UI** components located in `src/components/ui/`.

To use a component:
```jsx
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
```

Available components:
- button, card, dialog, dropdown-menu
- input, label, select, textarea
- tabs, toast, sonner (notifications)
- calendar, badge, avatar
- and more...

## Styling

- **Tailwind CSS** for utility-first styling
- CSS variables for theming (defined in index.css)
- Dark teal color scheme: `#1A2F3A` (primary)

## Internationalization (i18n)

The app supports English and French using i18next.

To add translations:
1. Add keys to `public/locales/en/translation.json`
2. Add French translations to `public/locales/fr/translation.json`

Usage in components:
```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('welcome')}</h1>;
}
```

## PWA Support

The app is a Progressive Web App:
- Installable on mobile/desktop
- Works offline (cached pages)
- Service worker in `public/service-worker.js`

## Nova AI Chat

The main AI chat component (`NovaChat.jsx`) supports:
- Text chat with Claude AI
- Voice input (Web Speech API + Whisper fallback)
- Voice output (OpenAI TTS)
- Tool calling (search, create listings, etc.)
- Persistent button on all pages

Usage:
```jsx
<NovaChat 
  isOpenProp={true}           // Control open state externally
  onClose={() => {}}          // Callback when closed
  initialQuery="search query" // Auto-send query on open
/>
```

## Authentication

Auth context is provided in App.js:
```jsx
import { useAuth } from '../App';

function MyComponent() {
  const { user, login, logout } = useAuth();
  // user contains: id, email, name, user_type
}
```

## Known Issues

- **npm peer dependencies**: Use `--legacy-peer-deps` flag due to react-day-picker/date-fns version conflicts
- **Google Maps warning**: Can be ignored, doesn't affect functionality

## Development Notes

- Hot reload is enabled
- API calls use axios with `REACT_APP_BACKEND_URL`
- All forms use controlled components
- Data-testid attributes for E2E testing
