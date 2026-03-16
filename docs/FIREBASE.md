# Firebase Configuration Guide

## Overview

Pal-Plant uses Firebase **exclusively** for Cloud Messaging (FCM) to deliver push notifications. All other Firebase services are disabled to maintain the app's local-first architecture where all user data is stored locally on the device.

## Table of Contents

- [Quick Start](#quick-start)
- [Usage Policy](#usage-policy)
- [Configuration](#configuration)
  - [Web (VAPID Key)](#web-vapid-key)
  - [Android](#android)
  - [iOS](#ios)
- [How It Works](#how-it-works)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Security & Privacy](#security--privacy)

---

## Quick Start

### Web Push Notifications

1. **Get VAPID Key** from [Firebase Console](https://console.firebase.google.com)
   - Settings → Project settings → Cloud Messaging → Web Push certificates
   - Generate key pair if needed

2. **Update Code** in `pal-plant/utils/firebaseMessaging.ts` line 4:
   ```typescript
   const VAPID_KEY = 'YOUR_ACTUAL_VAPID_KEY_HERE';
   ```

3. **Test**: Open app in browser, enable notifications in Settings, check console for FCM token

### Android

1. **Download** `google-services.json` from Firebase Console
2. **Place** in `pal-plant/android/app/` directory
3. **Build**: `npm run cap:sync`

### iOS

1. **Download** `GoogleService-Info.plist` from Firebase Console
2. **Place** in `pal-plant/ios/App/` directory
3. **Configure** APNs certificates in Firebase Console
4. **Build**: `npm run cap:sync`

---

## Usage Policy

### ✅ Allowed: Firebase Cloud Messaging (FCM) ONLY

**Purpose:** Push notification delivery for reminders and alerts

**What's used:**
- FCM registration tokens (device-specific routing tokens)
- Push notification delivery infrastructure

**Justification:** Push notifications require a cloud service for reliable delivery when the app is closed or in the background.

### ❌ Prohibited: All Other Firebase Services

The following services are **never used** to maintain local-first architecture:

- **Firebase Analytics** - All analytics stored locally only
- **Firebase Authentication** - No user accounts
- **Firestore / Realtime Database** - All data in IndexedDB/localStorage
- **Firebase Storage** - No cloud file storage
- **Crashlytics** - Not needed
- **Performance Monitoring** - Not needed
- **Remote Config** - All configuration is local
- **App Check** - No backend API
- **Dynamic Links** - Not needed

### Token Policy

**Allowed:**
- **FCM Registration Token** - Device-specific token for push notification routing
  - Generated when user enables notifications
  - Stored locally at: `pal_plant_fcm_token` in metadata storage
  - Used only for push notification delivery

**Prohibited:**
- Firebase Auth tokens
- Custom tokens
- Installation IDs used for tracking (beyond FCM requirements)
- Any backend-issued identity tokens

---

## Configuration

### Web (VAPID Key)

**Required for web push notifications**

#### Steps to Configure:

1. **Navigate to Firebase Console:**
   - Visit [https://console.firebase.google.com](https://console.firebase.google.com)
   - Select your project: `pal-plant`

2. **Access Cloud Messaging:**
   - Click Settings (⚙️) → Project settings
   - Select "Cloud Messaging" tab

3. **Generate VAPID Key:**
   - Scroll to "Web Push certificates"
   - Click "Generate key pair" if no key exists
   - Copy the generated key

4. **Update Code:**
   - Open `pal-plant/utils/firebaseMessaging.ts`
   - Replace line 4:
   ```typescript
   const VAPID_KEY = 'YOUR_ACTUAL_VAPID_KEY_FROM_FIREBASE_CONSOLE';
   ```

#### Optional Environment Variables

Create a `.env` file in `pal-plant/` directory (optional, defaults exist in code):

```env
# Firebase Web SDK Configuration
VITE_FIREBASE_API_KEY=AIzaSyCGKDTAi4dReXOYFs92xhDfSVduy_fntZg
VITE_FIREBASE_AUTH_DOMAIN=pal-plant.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pal-plant
VITE_FIREBASE_STORAGE_BUCKET=pal-plant.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=85069651501
VITE_FIREBASE_APP_ID=1:85069651501:web:e6c4dcbc62458d12ff22a4
VITE_FIREBASE_MEASUREMENT_ID=G-DPRV8B32KV

# Optional: Backend API endpoint for FCM token registration
# VITE_FCM_TOKEN_ENDPOINT=https://your-api.example.com/api/fcm-token
```

### Android

**Required Files:**
- `android/app/google-services.json` - Downloaded from Firebase Console

**Gradle Dependencies** (already configured):
```gradle
// In android/app/build.gradle
dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}

// In android/build.gradle
plugins {
    id 'com.google.gms.google-services' version '4.4.0' apply false
}

// In android/app/build.gradle
apply plugin: 'com.google.gms.google-services'
```

**Steps:**

1. **Firebase Console** → Project Settings → Your apps
2. **Select or add** Android app
3. **Download** `google-services.json`
4. **Place** in `pal-plant/android/app/` directory
5. **Build**: `npm run cap:sync`

### iOS

**Required Files:**
- `ios/App/GoogleService-Info.plist` - Downloaded from Firebase Console

**Required Setup:**
- APNs certificates configured in Firebase Console

**Steps:**

1. **Firebase Console** → Project Settings → Your apps
2. **Select or add** iOS app
3. **Download** `GoogleService-Info.plist`
4. **Place** in `pal-plant/ios/App/` directory
5. **Configure** APNs certificates:
   - Firebase Console → Cloud Messaging → Apple app configuration
   - Upload APNs authentication key or certificate
6. **Build**: `npm run cap:sync`

**Note:** iOS builds are supported but have not been extensively tested. Please report any issues.

---

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────┐
│  Platform Detection                             │
├─────────────────────────────────────────────────┤
│  ✓ Native (Android/iOS): Capacitor              │
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

**File Structure:**
```
pal-plant/
├── utils/
│   ├── firebase.ts              # Firebase SDK initialization (Messaging only)
│   ├── firebaseMessaging.ts     # FCM token & message handling
│   └── analytics.ts             # Local-only analytics (no Firebase)
├── hooks/
│   └── useReminderEngine.ts     # Notification logic with FCM integration
├── public/
│   └── firebase-messaging-sw.js # Service worker for background notifications
└── index.html                   # Includes manifest link
```

**Component Responsibilities:**

1. **`utils/firebase.ts`**
   - Initializes Firebase SDK (Messaging ONLY)
   - Loads from CDN to support restricted environments
   - No Analytics, Auth, or other services

2. **`utils/firebaseMessaging.ts`**
   - FCM token registration
   - Permission management
   - Message handlers (foreground/background)

3. **`hooks/useReminderEngine.ts`**
   - Notification scheduling logic
   - Platform detection (Web FCM vs Native Capacitor)
   - Checks for overdue friends and upcoming meetings

4. **`public/firebase-messaging-sw.js`**
   - Service worker for background notifications
   - Handles push messages when app is closed

5. **`utils/analytics.ts`**
   - **Local-only** event tracking
   - No external API calls
   - Data stored in localStorage

### Notification Flow

**Local Notifications** (Work immediately, no Firebase required):
1. User enables notifications in Settings
2. App checks for overdue contacts/meetings
3. Browser Notification API (web) or Capacitor (native) displays notification
4. No network required

**Push Notifications** (Require Firebase configuration):
1. User enables notifications in Settings
2. App requests FCM token from Firebase
3. Token stored locally
4. Backend can send push notifications via Firebase Admin SDK
5. FCM delivers to device even when app is closed

---

## Testing

### 1. Local Notifications (No Setup Required)

**Works immediately on all platforms:**

1. Open the app
2. Enable push notifications in Settings
3. Add a friend with a short contact frequency (e.g., 1 day)
4. Wait for the contact to become overdue
5. Notification should appear

**Platforms:**
- **Web:** Browser Notification API
- **Android/iOS:** Capacitor Local Notifications plugin

### 2. Web Push Notifications (Requires VAPID Key)

**Prerequisites:**
- VAPID key configured in `utils/firebaseMessaging.ts`
- HTTPS or localhost (required for service workers)

**Steps:**

1. Open app in web browser (Chrome/Firefox/Edge)
2. Enable push notifications in Settings
3. Check browser console for FCM token (logged on success)
4. Copy the FCM token

**Send Test Notification:**

1. Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Enter title and body
4. Click "Send test message"
5. Paste your FCM token
6. Click "Test"

### 3. Android Push Notifications

**Prerequisites:**
- `google-services.json` in `android/app/`
- Android device or emulator

**Steps:**

1. Build app: `npm run cap:sync`
2. Open in Android Studio: `npm run cap:open:android`
3. Run on device/emulator
4. Enable notifications in Settings
5. Send test notification via Firebase Console

### 4. iOS Push Notifications

**Prerequisites:**
- `GoogleService-Info.plist` in `ios/App/`
- APNs certificates configured
- iOS device or simulator (push may not work on simulator)

**Steps:**

1. Build app: `npm run cap:sync`
2. Open in Xcode: `npm run cap:open:ios`
3. Run on device
4. Enable notifications in Settings
5. Send test notification via Firebase Console

---

## Troubleshooting

### Web Push Not Working

**Symptoms:**
- Browser asks for permission but no notifications appear
- Console shows FCM errors

**Solutions:**

1. ✅ **Verify VAPID key** is configured in `utils/firebaseMessaging.ts`
2. ✅ **Check browser console** for error messages
3. ✅ **Ensure HTTPS** (or localhost) - required for service workers
4. ✅ **Clear service worker cache**: `chrome://serviceworker-internals` → Unregister
5. ✅ **Hard refresh**: Ctrl+Shift+R (Cmd+Shift+R on Mac)
6. ✅ **Check permissions**: Browser settings → Site settings → Notifications

### Android Push Not Working

**Symptoms:**
- Notifications work on web but not Android
- Console shows "not available on device"

**Solutions:**

1. ✅ **Verify** `google-services.json` exists in `android/app/`
2. ✅ **Rebuild**: `npm run cap:sync`
3. ✅ **Check Firebase Console** → Cloud Messaging for Android configuration
4. ✅ **Verify package name** matches Firebase project
5. ✅ **Check permissions** in AndroidManifest.xml
6. ✅ **Test on real device** (emulators may have issues)

### iOS Push Not Working

**Symptoms:**
- Notifications work on web/Android but not iOS

**Solutions:**

1. ✅ **Verify** `GoogleService-Info.plist` exists in `ios/App/`
2. ✅ **Configure APNs** certificates in Firebase Console
3. ✅ **Rebuild**: `npm run cap:sync`
4. ✅ **Check iOS capabilities**: Push Notifications enabled in Xcode
5. ✅ **Test on real device** (simulator may not support push)
6. ✅ **Check provisioning profile** includes push notifications

### Service Worker Issues

**Symptoms:**
- Background notifications don't work
- Service worker not registered

**Solutions:**

1. ✅ **Check HTTPS**: Service workers require HTTPS (or localhost)
2. ✅ **Inspect service worker**: `chrome://serviceworker-internals`
3. ✅ **Unregister and re-register**: Clear cache and reload
4. ✅ **Check console**: Look for service worker errors
5. ✅ **Verify file path**: `firebase-messaging-sw.js` must be in `public/`

### Storage Quota Exceeded

**Symptoms:**
- Error about storage quota
- Data not saving

**Solutions:**

1. ✅ **Automatic handling**: App includes error handling for quota issues
2. ✅ **Fallback**: App automatically falls back to localStorage if IndexedDB fails
3. ✅ **User action**: Export/backup data and clear old logs via Settings
4. ✅ **Browser settings**: Clear old data for other sites to free up space

---

## Security & Privacy

### What Firebase Can Access

✅ **Only FCM Registration Token:**
- Device-specific token for routing push notifications
- Generated only when user enables notifications
- Stored locally: `pal_plant_fcm_token` in IndexedDB
- Used exclusively for push notification delivery
- No personal information contained in token

### What Firebase Cannot Access

❌ **No User Data:**
- Friends list
- Contact logs
- Meeting requests
- Settings
- Categories
- Groups
- Any personal information

❌ **No Analytics:**
- Events tracked locally only (in localStorage)
- No data sent to Firebase Analytics
- No user behavior tracking
- No telemetry

❌ **No Authentication:**
- No user accounts
- No sign-in/sign-up
- No identity tokens
- No authentication state

### Network Activity

**When Firebase is properly configured:**

- **At app launch:** No Firebase network calls
- **When enabling notifications:** FCM registration occurs to get device token
- **When receiving push:** FCM delivers notification
- **Normal usage:** No Firebase network activity

**Verify with browser DevTools:**
1. Open Network tab
2. Filter by "firebase" or "googleapis"
3. Should only see calls when enabling notifications

### Verification Commands

**Check Firebase initialization:**
```bash
cd pal-plant
grep -r "getAnalytics\|getAuth\|getFirestore" utils/
```
**Expected:** No active usage (only in comments)

**Check CDN imports:**
```bash
grep -r "firebase.*\.js" --include="*.ts" --include="*.tsx"
```
**Expected:** Only `firebase-app.js` and `firebase-messaging.js`

**Check Analytics calls:**
```bash
grep -r "logEvent\|setUserId\|setUserProperties" utils/
```
**Expected:** No results or only commented code

---

## Backend Integration (Optional)

The app works fully without a backend. However, you can optionally send push notifications from a server.

### Setup Backend Token Collection

1. **Set environment variable** `VITE_FCM_TOKEN_ENDPOINT` in `.env`:
   ```env
   VITE_FCM_TOKEN_ENDPOINT=https://your-api.example.com/api/fcm-token
   ```

2. **Implement endpoint** to receive tokens:
   ```typescript
   // POST /api/fcm-token
   // Body: { token: "fcm-token-here" }
   
   // Store token in your database associated with user/device
   ```

### Send Notifications from Backend

Use Firebase Admin SDK:

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

---

## Maintenance

### Rotating VAPID Keys (Recommended every 1-2 years)

1. Generate new key in Firebase Console
2. Update `utils/firebaseMessaging.ts`
3. Rebuild and redeploy
4. Users will automatically get new tokens on next app launch

### Changing Firebase Project

1. Update `.env` file or default values in code
2. Download new `google-services.json` (Android)
3. Download new `GoogleService-Info.plist` (iOS)
4. Update VAPID key
5. Rebuild apps: `npm run cap:sync`

### Adding New Platform

1. Configure platform in Firebase Console
2. Download platform-specific configuration files
3. Update Capacitor configuration
4. Test notifications on new platform

---

## Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Capacitor Push Notifications Plugin](https://capacitorjs.com/docs/apis/push-notifications)
- [Service Workers Guide](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [PWA Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

---

**Last Updated:** 2026-02-17  
**Configuration Version:** 1.0  
**Firebase SDK Version:** 10.7.1 (loaded from CDN)
