# Push Notifications Guide

## Overview

Pal-Plant uses **Capacitor** for push notifications on Android and iOS. All push notification delivery is handled natively via Capacitor plugins.

> **Web push notifications are not available in this build.** Push reminders require an Android or iOS device.

## Table of Contents

- [Architecture](#architecture)
- [Android Setup](#android-setup)
- [iOS Setup](#ios-setup)
- [How It Works](#how-it-works)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Privacy](#privacy)

---

## Architecture

Pal-Plant uses two Capacitor plugins for notifications:

| Plugin | Purpose |
|--------|---------|
| `@capacitor/push-notifications` | Remote/push notification registration on native platforms |
| `@capacitor/local-notifications` | Scheduling on-device reminders (overdue contacts, backup reminders) |

The `hooks/useReminderEngine.ts` hook handles all notification logic. On web, notifications are silently skipped — the hook only schedules notifications when running on a native platform. This means the web build does not deliver any push or local notifications; they are a native-only feature.

---

## Android Setup

**Prerequisites:**
- [Android Studio](https://developer.android.com/studio) installed
- Physical device or emulator that supports Google Play Services (for push)

**Steps:**

1. Build and sync the project:
   ```bash
   npm run cap:sync
   ```

2. Open in Android Studio:
   ```bash
   npm run cap:open:android
   ```

3. Run on a device or emulator.

4. Enable notifications in the app's **Settings** screen.

**Android Notification Channel:**  
The app automatically creates a notification channel (`pal-plant-reminders`) on Android for all local reminder notifications.

---

## iOS Setup

**Prerequisites:**
- macOS with [Xcode](https://developer.apple.com/xcode/) installed
- iOS device or simulator

**Steps:**

1. Build and sync the project:
   ```bash
   npm run cap:sync
   ```

2. Open in Xcode:
   ```bash
   npm run cap:open:ios
   ```

3. In Xcode, select a target device or simulator and click **Run**.

4. Enable notifications in the app's **Settings** screen.

**Note:** Push notifications via `@capacitor/push-notifications` may require a physical device; simulators have limited push support.

---

## How It Works

### Key Components

**File Structure:**
```
pal-plant/
├── hooks/
│   └── useReminderEngine.ts   # Notification scheduling logic (Capacitor-only)
├── utils/
│   └── analytics.ts           # Local-only analytics (no external services)
└── capacitor.config.ts        # Capacitor plugin configuration
```

**Component Responsibilities:**

1. **`hooks/useReminderEngine.ts`**
   - Platform detection: only runs notifications on native (Android/iOS)
   - Creates Android notification channel on first run
   - Checks for overdue friends and upcoming scheduled meetings
   - Schedules local notifications via `@capacitor/local-notifications`
   - Registers for remote push via `@capacitor/push-notifications`

2. **`utils/analytics.ts`**
   - **Local-only** event tracking
   - No external API calls
   - Data stored in localStorage

### Notification Flow

**Local Notifications** (no server required):
1. User enables notifications in **Settings**
2. App checks for overdue contacts and upcoming meetings
3. `@capacitor/local-notifications` schedules a native notification
4. Notification appears even when app is backgrounded (native only)

**Remote Push Notifications:**
- Managed by `@capacitor/push-notifications`
- Requires a push notification backend (e.g., APNs or similar)
- The app registers a device token on startup when push is enabled
- Token is stored locally and can be sent to your own backend for delivery

---

## Testing

### Local Notifications (No Setup Required)

**Works on Android and iOS:**

1. Build and install the app on a device
2. Enable push notifications in **Settings**
3. Add a friend with a short contact frequency (e.g., 1 day)
4. Wait for the contact to become overdue
5. A local notification should appear

### Remote Push Notifications

Remote push requires a backend that can send messages via APNs (iOS) or a compatible push service (Android). This is optional and not included in the app itself.

---

## Troubleshooting

### Notifications Not Appearing

1. ✅ **Check platform**: Notifications only work on Android/iOS, not web
2. ✅ **Check permissions**: Ensure notifications are enabled in the app Settings and in the device's system notification settings
3. ✅ **Rebuild**: Run `npm run cap:sync` and redeploy
4. ✅ **Android channel**: On Android 8+, ensure the `pal-plant-reminders` channel is not blocked in system settings
5. ✅ **Real device**: Some emulators have limited notification support for push; prefer a physical device

### Storage Issues

1. ✅ **Automatic fallback**: App falls back to localStorage if IndexedDB fails
2. ✅ **User action**: Export/backup data and clear old logs via Settings

---

## Privacy

- **No external notification service** is used by default — all local notifications are scheduled entirely on-device via `@capacitor/local-notifications`
- Remote push notifications (via `@capacitor/push-notifications`) are opt-in and require a backend; if configured, only a device registration token (no personal data) is transmitted to the push delivery service
- All reminder scheduling happens **on-device**
- No user data (friends list, contact logs, etc.) is ever transmitted to any notification server

---

## Resources

- [Capacitor Push Notifications Plugin](https://capacitorjs.com/docs/apis/push-notifications)
- [Capacitor Local Notifications Plugin](https://capacitorjs.com/docs/apis/local-notifications)
- [Android Notification Channels](https://developer.android.com/develop/ui/views/notifications/channels)
- [APNs Overview (iOS)](https://developer.apple.com/documentation/usernotifications)

---

**Last Updated:** 2026-03-16
**Notification Stack:** Capacitor `@capacitor/push-notifications` + `@capacitor/local-notifications`
