# Firebase Usage Documentation

## Policy

Pal-Plant is a **local-first** application. All user data is stored locally on the device with no cloud sync or external storage.

**Exception:** Firebase Cloud Messaging (FCM) is used exclusively for push notification delivery.

## Allowed Firebase Usage

### ✅ Firebase Cloud Messaging (FCM) - ONLY
- **Purpose:** Push notification delivery for reminders and alerts
- **What's used:**
  - FCM registration tokens (device-specific tokens for push routing)
  - Push notification delivery infrastructure
- **Justification:** Push notifications require a cloud service for reliable delivery when the app is not active

## Prohibited Firebase Services

### ❌ Firebase Analytics
- **Status:** REMOVED
- **Reason:** Not needed. All analytics are tracked locally only.
- **Alternative:** Local event tracking in `utils/analytics.ts` stores events in local storage only

### ❌ Firebase Authentication
- **Status:** Never used
- **Reason:** No user accounts. App is fully local.

### ❌ Firestore / Realtime Database
- **Status:** Never used
- **Reason:** All data stored locally via IndexedDB/localStorage

### ❌ Firebase Storage
- **Status:** Never used
- **Reason:** No cloud file storage needed

### ❌ Crashlytics
- **Status:** Never used
- **Reason:** Not needed for this local app

### ❌ Performance Monitoring
- **Status:** Never used
- **Reason:** Not needed for this local app

### ❌ Remote Config
- **Status:** Never used
- **Reason:** All configuration is local

### ❌ App Check
- **Status:** Never used
- **Reason:** No backend API to protect

### ❌ Dynamic Links
- **Status:** Never used
- **Reason:** Not needed

### ❌ Installations / Instance ID
- **Status:** Not used beyond what FCM requires
- **Reason:** Only FCM registration tokens are generated

## Token Policy

### Allowed Tokens
- **FCM Registration Token:** Device-specific token used by Firebase to route push notifications to the correct device
  - Generated when user enables notifications
  - Stored locally at: `pal_plant_fcm_token` in metadata storage
  - Used only for push notification delivery

### Prohibited Tokens
- ❌ Firebase Auth tokens
- ❌ Custom tokens
- ❌ Installation IDs used for tracking/identity (beyond what FCM requires for routing)
- ❌ Any backend-issued identity tokens stored via Firebase

## Code Locations

### Firebase Initialization
- **File:** `utils/firebase.ts`
- **What it does:** Initializes ONLY Firebase Messaging
- **What it doesn't do:** Does NOT initialize Analytics, Auth, or any other service

### Messaging Integration
- **File:** `utils/firebaseMessaging.ts`
- **What it does:** Handles FCM token generation, permission requests, and message handling
- **Service Worker:** `public/firebase-messaging-sw.js` handles background notifications

### Local Analytics (No Firebase)
- **File:** `utils/analytics.ts`
- **What it does:** Tracks events locally for user insights
- **What it doesn't do:** Does NOT send any data to Firebase Analytics or any external service
- **Storage:** Events stored in local storage only

## Verification

To verify Firebase is only used for push notifications:

1. **Check Firebase initialization:**
   ```bash
   grep -r "getAnalytics\|getAuth\|getFirestore\|getStorage" utils/
   ```
   Should return no active usage (only in comments or removed code)

2. **Check CDN imports:**
   ```bash
   grep -r "firebase.*\.js" --include="*.ts" --include="*.tsx" --include="*.js"
   ```
   Should only show `firebase-app.js` and `firebase-messaging.js`

3. **Check Analytics calls:**
   ```bash
   grep -r "logEvent\|setUserId\|setUserProperties" utils/
   ```
   Should return no results or only commented/removed code

## Network Activity

When Firebase is properly configured for push-only usage:
- **At app launch:** No Firebase network calls
- **When enabling notifications:** FCM registration occurs to get device token
- **When receiving push:** FCM delivers notification
- **At all other times:** No Firebase network activity

## Build Configuration

### Web (Vite)
- Firebase loaded via CDN at runtime (not bundled)
- Only messaging CDN URL is loaded
- No Analytics SDK loaded

### Android (Capacitor)
- `google-services.json` required for FCM
- `com.google.gms:google-services` plugin applied
- Only FCM dependencies included
- No Firebase Analytics, Crashlytics, or other service dependencies

### iOS (Capacitor)
- `GoogleService-Info.plist` required for FCM (if iOS build exists)
- Only FCM configured
- APNs certificates required for iOS push

## Compliance Verification Date
Last verified: 2026-02-16
