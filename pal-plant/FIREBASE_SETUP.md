# Firebase Cloud Messaging Setup Guide

This guide explains how to complete the Firebase Cloud Messaging (FCM) setup for Pal Plant.

## Current Status

✅ **Fully Implemented:**
- Firebase SDK initialization (loaded dynamically from CDN)
- Firebase Analytics integration with event tracking
- Service worker for background notifications (`public/firebase-messaging-sw.js`)
- FCM token registration and management
- Foreground and background message handlers
- Web app manifest for PWA support
- Integration with Capacitor for native Android/iOS notifications

⚠️ **Configuration Required for Web Push:**
- Generate and configure VAPID key (see below)
- Update VAPID key in code

🔧 **Optional (Advanced):**
- Set up backend API to send notifications programmatically

## Getting Your VAPID Key

Firebase Cloud Messaging requires a VAPID key (Voluntary Application Server Identification) for web push notifications.

### Steps to Generate VAPID Key:

1. **Go to Firebase Console:**
   - Visit [https://console.firebase.google.com](https://console.firebase.google.com)
   - Select your project: `pal-plant`

2. **Navigate to Cloud Messaging:**
   - Click on the gear icon (⚙️) next to "Project Overview"
   - Select "Project settings"
   - Click on the "Cloud Messaging" tab

3. **Generate Web Push Certificates:**
   - Scroll down to the "Web Push certificates" section
   - If you don't have a key pair, click "Generate key pair"
   - Copy the generated key

4. **Update the Code:**
   - Open `pal-plant/utils/firebaseMessaging.ts`
   - Replace `YOUR_VAPID_KEY_HERE` on line 4 with your actual VAPID key

   ```typescript
   const VAPID_KEY = 'YOUR_ACTUAL_VAPID_KEY_FROM_FIREBASE_CONSOLE';
   ```

## How It Works

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  Platform Detection                             │
├─────────────────────────────────────────────────┤
│  ✓ Native (Android/iOS): Capacitor Notifications│
│  ✓ Web: Firebase Cloud Messaging                │
└─────────────────────────────────────────────────┘

For Web Platform:
┌─────────────────────────────────────────────────┐
│  Foreground (App Active)                        │
│  - Firebase Messaging onMessage handler         │
│  - Browser Notification API                     │
├─────────────────────────────────────────────────┤
│  Background (App Closed/Minimized)              │
│  - Service Worker (firebase-messaging-sw.js)    │
│  - Firebase Cloud Messaging                     │
└─────────────────────────────────────────────────┘
```

### Key Components

1. **`utils/firebase.ts`**
   - Initializes Firebase SDK (App, Analytics, Messaging)
   - Loads Firebase from CDN to support restricted build environments

2. **`utils/firebaseMessaging.ts`**
   - Handles FCM token registration
   - Manages notification permissions
   - Sets up message handlers

3. **`hooks/useReminderEngine.ts`**
   - Integrates FCM for web notifications
   - Falls back to Capacitor for native platforms
   - Checks for overdue friends and upcoming meetings

4. **`public/firebase-messaging-sw.js`**
   - Service worker for background notifications
   - Handles messages when app is closed

5. **`utils/analytics.ts`**
   - Sends events to both local storage AND Firebase Analytics
   - Provides unified analytics interface

## Testing Notifications

### 1. Test Local Notifications (✅ Working Out of the Box)

The app sends local notifications when:
- A friend is overdue for contact
- A meeting is coming up soon

**These work immediately on all platforms:**
- **Web:** Browser Notification API
- **Android/iOS:** Capacitor Local Notifications plugin

No FCM setup is required for local notifications.

### 2. Test FCM Notifications (⚠️ Requires VAPID Key Configuration)

Once you've configured the VAPID key in `utils/firebaseMessaging.ts`:

1. Open the app in a web browser (Chrome/Firefox/Edge)
2. Enable push notifications in Settings
3. Check the browser console - you should see your FCM token logged
4. The token can be used to send test notifications via Firebase Console

**Note:** This only applies to the web version. Native Android/iOS apps use Capacitor's notification system.

### 3. Send Test Notification from Firebase Console

1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Enter notification title and body
4. Click "Send test message"
5. Paste your FCM token (from browser console)
6. Click "Test"

## Environment Variables (Optional)

You can override Firebase configuration via environment variables in `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Backend API Integration (Optional - For Remote Push Notifications)

The app can send local notifications without a backend. However, if you want to send notifications from a server (e.g., reminder emails or push notifications when the app is not running), you can implement the `sendTokenToServer` function in `utils/firebaseMessaging.ts`.

### Example Backend Endpoint

```typescript
// POST /api/fcm-token
// Body: { token: "fcm-token-here" }

// Your backend should store this token and use it to send notifications via Firebase Admin SDK
```

### Example: Sending Notification from Backend

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

// Send notification
admin.messaging().send({
  token: 'user-fcm-token',
  notification: {
    title: 'Pal Plant Reminder',
    body: 'Time to check in with John!',
  },
  webpush: {
    fcmOptions: {
      link: 'https://your-app-url.com',
    },
  },
});
```

## Troubleshooting

### Notifications Not Appearing

1. **Check browser permissions:** Ensure notifications are enabled in browser settings
2. **Check VAPID key:** Make sure it's correctly configured in `firebaseMessaging.ts`
3. **Check console:** Look for error messages in browser console
4. **Service worker:** Verify service worker is registered at `chrome://serviceworker-internals`

### Service Worker Issues

1. Service workers require HTTPS (or localhost)
2. Clear service worker cache: `chrome://serviceworker-internals` → Unregister
3. Hard refresh the page: Ctrl+Shift+R (Cmd+Shift+R on Mac)

### Firebase Console Shows No Data

1. Wait a few hours - Firebase Analytics has a delay
2. Check that `getFirebaseAnalytics()` returns a valid instance
3. Verify events are being sent in browser console

## File Structure

```
pal-plant/
├── public/
│   ├── firebase-messaging-sw.js      # Service worker for FCM
│   ├── manifest.json                 # PWA manifest
│   ├── icon-192x192.png              # App icon (placeholder)
│   ├── icon-512x512.png              # App icon (placeholder)
│   └── badge-72x72.png               # Notification badge (placeholder)
├── utils/
│   ├── firebase.ts                   # Firebase initialization
│   ├── firebaseMessaging.ts          # FCM token & message handling
│   └── analytics.ts                  # Analytics with Firebase integration
├── hooks/
│   └── useReminderEngine.ts          # Notification logic with FCM
└── index.html                        # Includes manifest link
```

## Next Steps

1. ✅ **Already Working:** Firebase Analytics tracks events automatically
2. ✅ **Already Working:** Local notifications work on all platforms (web, Android, iOS)
3. ⚠️ **Optional:** Generate VAPID key from Firebase Console for web push notifications
4. ⚠️ **Optional:** Update `firebaseMessaging.ts` with the VAPID key
5. ⚠️ **Optional:** Test web push notifications in a browser
6. 🔧 **Optional:** Replace placeholder icons with actual app icons
7. 🔧 **Optional:** Implement backend API to send remote notifications
8. 🚀 **Optional:** Deploy and test on production domain with HTTPS

## Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
