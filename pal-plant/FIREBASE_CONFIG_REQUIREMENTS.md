# Firebase Configuration Requirements

## Overview

Pal-Plant uses Firebase **ONLY** for Cloud Messaging (FCM) to deliver push notifications. All other Firebase services are explicitly disabled to maintain the app's local-first architecture.

## Required Configuration

### 1. Environment Variables (Optional Override)

Create a `.env` file in the `pal-plant/` directory with the following variables. These are optional and have defaults built into the code:

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

### 2. VAPID Key Configuration (Required for Web Push)

**Status:** ⚠️ **REQUIRED** for web push notifications to work

**Location:** `utils/firebaseMessaging.ts` line 4

**Steps to configure:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `pal-plant`
3. Click Settings (⚙️) → Project settings → Cloud Messaging tab
4. Scroll to "Web Push certificates"
5. Click "Generate key pair" if no key exists
6. Copy the generated VAPID key
7. Update `utils/firebaseMessaging.ts`:
   ```typescript
   const VAPID_KEY = 'YOUR_ACTUAL_VAPID_KEY_HERE';
   ```

### 3. Native Platform Configuration

#### Android (Capacitor)

**Required files:**
- `android/app/google-services.json` - Downloaded from Firebase Console

**Gradle dependencies:**
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

**Steps to get google-services.json:**
1. Firebase Console → Project Settings → Your apps
2. Select or add Android app
3. Download `google-services.json`
4. Place in `android/app/` directory

#### iOS (Capacitor)

**Required files:**
- `ios/App/GoogleService-Info.plist` - Downloaded from Firebase Console

**Required certificates:**
- Apple Push Notification service (APNs) certificates configured in Firebase Console

**Steps:**
1. Firebase Console → Project Settings → Your apps
2. Select or add iOS app
3. Download `GoogleService-Info.plist`
4. Place in `ios/App/` directory
5. Configure APNs certificates in Firebase Console → Cloud Messaging → Apple app configuration

## Configuration Verification

### Check Firebase Initialization

```bash
cd pal-plant
grep -r "getAnalytics\|getAuth\|getFirestore" utils/
```
**Expected result:** No active usage (only in comments)

### Check Network Activity

Open browser DevTools → Network tab:
- **At app launch:** No Firebase network calls
- **When enabling notifications:** Only FCM registration calls
- **Normal usage:** No Firebase calls except when receiving push notifications

### Verify CDN Loading

```bash
grep -r "firebase.*\.js" --include="*.ts" --include="*.tsx"
```
**Expected result:** Only `firebase-app.js` and `firebase-messaging.js` should be loaded

## Security & Privacy

### What Firebase Can Access

✅ **Only FCM Registration Token:**
- Device-specific token for routing push notifications
- Generated only when user enables notifications
- Stored locally: `pal_plant_fcm_token` in IndexedDB
- Used exclusively for push notification delivery

### What Firebase Cannot Access

❌ **No User Data:**
- Friends list
- Contact logs
- Meeting requests
- Settings
- Categories
- Any personal information

❌ **No Analytics:**
- Events tracked locally only (in `localStorage`)
- No data sent to Firebase Analytics
- No user behavior tracking

❌ **No Authentication:**
- No user accounts
- No sign-in/sign-up
- No identity tokens

## Common Issues & Solutions

### Issue: Web Push Notifications Not Working

**Symptoms:**
- Browser asks for notification permission but no notifications appear
- Console shows FCM errors

**Solutions:**
1. Verify VAPID key is configured in `utils/firebaseMessaging.ts`
2. Check browser console for errors
3. Ensure HTTPS (or localhost) - required for service workers
4. Clear service worker cache: `chrome://serviceworker-internals`
5. Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)

### Issue: Android Push Not Working

**Symptoms:**
- Notifications work on web but not Android

**Solutions:**
1. Verify `google-services.json` exists in `android/app/`
2. Rebuild the app: `npm run cap:sync`
3. Check Firebase Console → Cloud Messaging for Android configuration
4. Verify app package name matches Firebase project

### Issue: iOS Push Not Working

**Symptoms:**
- Notifications work on web/Android but not iOS

**Solutions:**
1. Verify `GoogleService-Info.plist` exists in `ios/App/`
2. Configure APNs certificates in Firebase Console
3. Rebuild the app: `npm run cap:sync`
4. Check iOS app capabilities: Push Notifications enabled

### Issue: Storage Quota Exceeded

**Symptoms:**
- Error in console about storage quota
- Data not saving

**Solutions:**
1. The app includes automatic error handling for quota issues
2. Users will see a toast notification
3. App automatically falls back to localStorage if IndexedDB fails
4. User can export/backup data and clear old logs

## Files Reference

| File | Purpose | Required Changes |
|------|---------|------------------|
| `utils/firebase.ts` | Firebase SDK initialization | None (uses CDN) |
| `utils/firebaseMessaging.ts` | FCM token & messaging | **Update VAPID_KEY on line 4** |
| `utils/storage.ts` | Local storage with error handling | None |
| `public/firebase-messaging-sw.js` | Service worker for background notifications | None |
| `.env` | Environment variables | Optional: Override Firebase config |
| `android/app/google-services.json` | Android FCM config | **Required for Android** |
| `ios/App/GoogleService-Info.plist` | iOS FCM config | **Required for iOS** |

## Testing Checklist

- [ ] Web notifications: Enable in Settings, check browser console for FCM token
- [ ] Android notifications: Build and test on Android device/emulator
- [ ] iOS notifications: Build and test on iOS device/simulator
- [ ] Background notifications: Close app and send test notification from Firebase Console
- [ ] Foreground notifications: Keep app open and send test notification
- [ ] Storage error handling: Fill storage to test quota exceeded handling
- [ ] Offline functionality: Disable network and verify app still works

## Maintenance

### When to Update Configuration

1. **Rotating VAPID keys** (recommended every 1-2 years):
   - Generate new key in Firebase Console
   - Update `utils/firebaseMessaging.ts`
   - Rebuild and redeploy

2. **Changing Firebase project:**
   - Update `.env` file or default values in code
   - Update `google-services.json` (Android)
   - Update `GoogleService-Info.plist` (iOS)
   - Rebuild apps

3. **Adding new platform:**
   - Configure platform in Firebase Console
   - Download configuration files
   - Update Capacitor configuration
   - Test notifications on new platform

## Support & Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Capacitor Push Notifications Plugin](https://capacitorjs.com/docs/apis/push-notifications)
- [Service Workers Guide](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Local Storage Error Handling](utils/storage.ts) - See inline JSDoc comments

---

**Last Updated:** 2026-02-16  
**Configuration Version:** 1.0  
**Firebase SDK Version:** 10.7.1 (loaded from CDN)
