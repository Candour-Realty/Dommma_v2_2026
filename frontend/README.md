# DOMMMA Frontend

React.js frontend for the DOMMMA real estate marketplace.

## Quick Start

```bash
# Install dependencies
yarn install

# Create .env file
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env

# Start development server
yarn start
```

Opens at `http://localhost:3000`

## Requirements

- Node.js 18+
- Yarn package manager
- Backend server running on port 8001

## Scripts

| Command | Description |
|---------|-------------|
| `yarn start` | Start development server |
| `yarn build` | Build for production |
| `yarn test` | Run tests |

## Key Folders

- `src/pages/` - Page components (Dashboard, Browse, etc.)
- `src/components/` - Reusable UI components
- `src/components/ui/` - Shadcn UI components
- `public/` - Static files, PWA manifest

## Environment Variables

Create `.env` file:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

For production, this should point to your deployed backend URL.
