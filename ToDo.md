Pal-Plant Action Items

## ✅ All Items Complete

### ✅ Implement Explicit Notification Opt-in
Add a toggle in SettingsModal.tsx to manage the reminders.pushEnabled setting.
**Status:** Already implemented in SettingsModal.tsx (handleTogglePush function)

### ✅ Trigger Notification Permissions
Ensure the toggle triggers Notification.requestPermission() for web and PushNotifications.requestPermissions() for native Capacitor builds.
**Status:** Already implemented - web notifications at line 146, native at line 135

### ✅ Update Reminder Engine Logic
Modify useReminderEngine.ts to verify that both the app setting is enabled AND the system-level permission is 'granted' before firing notifications.
**Status:** Already implemented - checks reminders.pushEnabled and Notification.permission === 'granted'

### ✅ Fix Storage Race Condition
Remove localStorage dependencies in App.tsx and ensure the UI only renders once IndexedDB data is fully loaded to prevent data overwrites.
**Status:** Fixed - removed all localStorage initial reads, UI now waits for IndexedDB via isStorageReady flag

### ✅ Stabilize Garden Sorting
Move sorting logic into a useMemo hook in App.tsx and disable the 60-second automatic re-sort to prevent scroll jumps while viewing the garden.
**Status:** Already implemented - sorting in useMemo, only re-sorts on tab switch, no auto-sort timer

### ✅ Complete Meeting Schema Migration
Fully transition logic from linkedFriendId to the linkedIds array in both App.tsx and MeetingRequestsView.tsx to support group meetings.
**Status:** Already implemented with backward compatibility - fallback from linkedFriendId to linkedIds

### ✅ Implement Photo Compression Utility
Create utils/imageCompression.ts to resize high-resolution images to 500x500px before saving to IndexedDB to prevent storage quota issues.
**Status:** Already implemented - utils/imageCompression.ts exists with 500x500px max size

### ✅ Remove Legacy Code
Delete the abandoned 'Accounts' feature references and redundant localStorage cleanup calls in App.tsx.
**Status:** Fixed - removed localStorage cleanup calls for 'friendkeep_accounts' and 'friendkeep_nudges'
