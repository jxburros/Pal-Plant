Pal-Plant Action Items

Implement Explicit Notification Opt-in: Add a toggle in SettingsModal.tsx to manage the reminders.pushEnabled setting.

Trigger Notification Permissions: Ensure the toggle triggers Notification.requestPermission() for web and PushNotifications.requestPermissions() for native Capacitor builds.

Update Reminder Engine Logic: Modify useReminderEngine.ts to verify that both the app setting is enabled AND the system-level permission is 'granted' before firing notifications.

Fix Storage Race Condition: Remove localStorage dependencies in App.tsx and ensure the UI only renders once IndexedDB data is fully loaded to prevent data overwrites.

Stabilize Garden Sorting: Move sorting logic into a useMemo hook in App.tsx and disable the 60-second automatic re-sort to prevent scroll jumps while viewing the garden.

Complete Meeting Schema Migration: Fully transition logic from linkedFriendId to the linkedIds array in both App.tsx and MeetingRequestsView.tsx to support group meetings.

Implement Photo Compression Utility: Create utils/imageCompression.ts to resize high-resolution images to 500x500px before saving to IndexedDB to prevent storage quota issues.

Remove Legacy Code: Delete the abandoned 'Accounts' feature references and redundant localStorage cleanup calls in App.tsx.
