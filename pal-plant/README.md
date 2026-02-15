# 🌱 Pal-Plant

This is the source code directory for Pal-Plant. For full documentation, see the main [README](../README.md).

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Development

The app will be available at `http://localhost:5173` after running `npm run dev`.
Data is stored locally in the browser (`localStorage`), so backups are recommended from the in-app Settings screen.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production bundle |
| `npm run preview` | Preview production build locally |
| `npm run cap:sync` | Build web assets and sync to Capacitor Android project |
| `npm run cap:open:android` | Open the Android project in Android Studio |

## Firebase SDK Setup

Firebase is initialized at app startup when all `VITE_FIREBASE_*` values are defined.

1. Copy `.env.example` to `.env.local`.
2. Fill in your Firebase Web App config values.
3. Restart the dev server.

If any value is missing, Firebase initialization is skipped.
