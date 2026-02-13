# Firebase Cloud Messaging (FCM) Setup Guide

This guide will help you enable remote push notifications for Pal-Plant on Android.

## Prerequisites

- Google account
- Android app already built (see README.md for build instructions)
- Basic familiarity with Firebase Console

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `Pal-Plant` (or your preferred name)
4. Click **Continue**
5. (Optional) Enable Google Analytics if desired
6. Click **Create project**
7. Wait for project creation to complete
8. Click **Continue**

---

## Step 2: Add Android App to Firebase

1. In the Firebase Console, click the **Android icon** (or "Add app" → Android)
2. Fill in the registration form:
   - **Android package name:** `com.palplant.app` ⚠️ **Must match exactly**
   - **App nickname (optional):** `Pal-Plant Android`
   - **Debug signing certificate SHA-1 (optional):** Leave blank for now
3. Click **Register app**

---

## Step 3: Download google-services.json

1. Firebase will generate a `google-services.json` file
2. Click **Download google-services.json**
3. **IMPORTANT:** Save this file to:
   ```
   /home/user/Pal-Plant/pal-plant/android/app/google-services.json
   ```
4. Verify the file location:
   ```bash
   ls -la /home/user/Pal-Plant/pal-plant/android/app/google-services.json
   ```
   You should see the file listed.

---

## Step 4: Verify Build Configuration

The app is already configured to detect `google-services.json` automatically!

Check `android/app/build.gradle` (lines 47-54):
```gradle
try {
    def servicesJSON = file('google-services.json')
    if (servicesJSON.text) {
        apply plugin: 'com.google.gms.google-services'
    }
} catch(Exception e) {
    logger.info("google-services.json not found, google-services plugin not applied. Push Notifications won't work")
}
```

**What this does:**
- If `google-services.json` exists → FCM push notifications enabled ✅
- If missing → Local notifications still work, but remote push disabled ⚠️

---

## Step 5: Rebuild the App

After adding `google-services.json`, rebuild the APK:

```bash
cd /home/user/Pal-Plant/pal-plant

# Option A: Rebuild everything
npm run cap:sync
cd android
./gradlew clean assembleDebug

# Option B: Use Android Studio
npm run cap:open:android
# Then: Build → Build Bundle(s) / APK(s) → Build APK(s)
```

**New APK location:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Step 6: Test Push Notifications

### Enable Notifications in App

1. Install the rebuilt APK on your Android device
2. Open Pal-Plant
3. Go to **Settings** (gear icon)
4. Scroll to **Reminders** section
5. Toggle on:
   - **"Overdue Contact Reminders"**
   - **"Meeting Reminders"**
6. Grant notification permission when Android prompts you

### Send a Test Notification (Firebase Console)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your **Pal-Plant** project
3. Click **"Engage"** → **"Messaging"** in left sidebar
4. Click **"Create your first campaign"** (or **"New campaign"**)
5. Select **"Firebase Notification messages"**
6. Fill in the notification:
   - **Notification title:** `Test Notification`
   - **Notification text:** `Your Pal-Plant notifications are working!`
7. Click **Next**
8. **Target:** Select your app (`com.palplant.app`)
9. Click **Next**
10. **Scheduling:** Select "Now"
11. Click **Next**
12. **Conversion events:** Skip (click Next)
13. **Additional options:** Skip (click Next)
14. Click **Review** → **Publish**

**You should receive the test notification on your device within seconds!**

---

## Troubleshooting

### google-services.json Not Found

**Error:**
```
google-services.json not found, google-services plugin not applied
```

**Solution:**
- Verify file path: `android/app/google-services.json` (NOT `android/google-services.json`)
- Check file is valid JSON (open in text editor)
- Ensure package name in JSON matches `com.palplant.app`

### Notifications Not Appearing

1. **Check app permissions:**
   - Settings → Apps → Pal-Plant → Notifications → Enabled

2. **Check Android version:**
   - Android 13+ requires POST_NOTIFICATIONS permission ✅ (already added)

3. **Check Do Not Disturb:**
   - Ensure device is not in DND mode

4. **Check app is in foreground/background:**
   - FCM notifications only appear when app is in background or closed
   - When app is open, notifications are handled in-app

5. **Check Firebase Console logs:**
   - Firebase Console → Cloud Messaging → Reports
   - Look for delivery errors

### Build Fails After Adding google-services.json

**Error:**
```
Could not find com.google.gms:google-services
```

**Solution:**
The root `build.gradle` already includes Google Services plugin:
```gradle
classpath 'com.google.gms:google-services:4.4.4'
```

If error persists:
1. Run `./gradlew clean`
2. Rebuild: `./gradlew assembleDebug`

---

## Firebase Pricing

- **Spark Plan (Free):**
  - Unlimited notifications
  - 10 GB/month hosting
  - 1 GB/day Cloud Messaging
  - **Perfect for personal/prototype apps** ✅

- **Blaze Plan (Pay-as-you-go):**
  - Only needed if you exceed free tier limits
  - Unlikely for personal relationship management app

**Recommendation:** Start with Spark Plan (free forever)

---

## Security Considerations

### Keep google-services.json Private

⚠️ **IMPORTANT:**

The `google-services.json` file contains API keys and project identifiers. While not highly sensitive (these are client-side keys), you should:

1. **Add to .gitignore** (already configured):
   ```bash
   # Check .gitignore includes:
   grep google-services.json android/.gitignore
   ```
   You should see:
   ```
   google-services.json
   ```

2. **Do not commit to public repos** (especially GitHub)

3. **Regenerate if exposed:**
   - Firebase Console → Project Settings → General
   - Delete old app registration
   - Add new app → Download new JSON

### API Key Restrictions (Optional)

For production apps, restrict Firebase API keys:

1. Firebase Console → Project Settings → General
2. Click **Web API Key**
3. Opens Google Cloud Console → API Keys
4. Click your key
5. **Application restrictions:**
   - Select "Android apps"
   - Add package name: `com.palplant.app`
   - Add SHA-1 fingerprint (from your signing key)
6. **API restrictions:**
   - Restrict to: "Firebase Cloud Messaging API"
7. Click **Save**

---

## Alternative: Local Notifications Only

**Don't want to set up Firebase?**

Local notifications (meeting reminders, overdue contacts) **work without Firebase**! They're triggered by the app's reminder engine (`useReminderEngine.ts`) and don't need internet.

**Limitations without FCM:**
- ❌ Cannot send notifications when app is fully closed/force-stopped
- ❌ Cannot trigger notifications from external sources (e.g., server reminders)
- ✅ Scheduled local notifications still work when app is in background

**For a prototype/personal app, local notifications are usually sufficient.**

---

## Next Steps

After Firebase setup:

1. ✅ Push notifications enabled
2. Test with real contacts:
   - Add a contact with 1-day frequency
   - Wait for overdue reminder
   - Check notification arrives
3. Consider adding:
   - **Analytics** (Firebase Analytics - already included in google-services.json)
   - **Crash reporting** (Firebase Crashlytics)
   - **Remote config** (feature flags)

---

## Support

- [Firebase Documentation](https://firebase.google.com/docs)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [FCM Android Setup](https://firebase.google.com/docs/cloud-messaging/android/client)

---

**Last updated:** 2026-02-13
