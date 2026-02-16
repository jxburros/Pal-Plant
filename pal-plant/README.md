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
| `npm run cap:sync` | Build web assets and sync to Capacitor Android/iOS projects |
| `npm run cap:open:android` | Open the Android project in Android Studio |
| `npm run cap:open:ios` | Open the iOS project in Xcode |
| `npm run test:rules` | Run scoring system invariant tests |

## Firebase Integration

Pal-Plant uses Firebase for analytics and push notification infrastructure:

### Firebase Analytics (✅ Ready to Use)

Firebase Analytics is fully configured and automatically tracks user events such as:
- Friend additions, edits, and deletions
- Contact logging
- Meeting creation, scheduling, and completion
- Bulk imports

Events are sent to both local storage and Firebase Analytics. No additional configuration is required for analytics to work.

### Firebase Cloud Messaging (⚠️ Requires Configuration)

Firebase Cloud Messaging (FCM) provides the infrastructure for web push notifications. The frontend is configured, but you need to:

1. **Generate a VAPID key** from Firebase Console (see [FIREBASE_SETUP.md](FIREBASE_SETUP.md))
2. **Update the VAPID key** in `utils/firebaseMessaging.ts`
3. **(Optional)** Implement a backend API to send notifications to users

**Note:** Native Android/iOS apps use Capacitor's native notification system and do not require FCM.

For detailed setup instructions, see [FIREBASE_SETUP.md](FIREBASE_SETUP.md).

## Data Storage

All user data is stored locally in the browser's `localStorage`. **No data is synced to the cloud.** This ensures privacy but means:
- Data is device-specific
- Regular backups are recommended (use the in-app Backup feature in Settings)
- Switching devices requires manual data export/import
