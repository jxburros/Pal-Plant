# Pal-Plant Implementation Plan

## 📇 Device Contact Integration
*Background: The app already has `@capacitor-community/contacts` in `package.json`. You must use the `Contacts` plugin to request permissions and fetch data.*
- [x] **Contact Picker for New Plants**: In `AddFriendModal.tsx`, add a "Pick from Contacts" button that invokes `Contacts.getContact()`.
- [x] **Contact Info Mapping**: Map the resulting contact's `name`, `phoneNumbers`, and `emails` to the `Friend` interface.
- [x] **Import on Edit**: Add an "Update from Contacts" button in the edit mode of `AddFriendModal.tsx` to refresh existing data fields.

## 🔔 Notification System & Settings
*Background: Settings currently default `pushEnabled` to `false`. The app uses `@capacitor/push-notifications` and `@capacitor/local-notifications`.*
- [x] **Availability Check**: In `SettingsModal.tsx`, use `PushNotifications.checkPermissions()` to determine if the platform supports notifications.
- [x] **Settings UI Update**: Remove the "Not Available" hardcoded string; replace with a toggle that triggers the permission request flow.
- [x] **Engine Connection**: Ensure `useReminderEngine.ts` is properly initializing the notification listeners upon app mount.

## 👥 Social Groups Mechanic
*Background: This requires a new data entity. Add a `Group` interface to `types.ts`.*
- [x] **Group Data Model**: Define `Group` with `id`, `name`, and `memberIds` (linking to `Friend.id`).
- [x] **Mass Interaction Logic**: Update `friendEngine.ts` to include a `processGroupContact` function that iterates through `memberIds` and applies a `REGULAR` or `QUICK` touch to each.
- [x] **Group UI**: Add a "Groups" sub-tab in the Garden view to manage these collections.

## 📅 Meeting Requests Tab Refactor
*Background: The `MeetingRequestsView.tsx` currently displays a single list. It should be split based on the `status` field.*
- [x] **Sectioned Layout**: Use `useMemo` to filter `meetingRequests` into `requested` (`status === 'REQUESTED'`) and `scheduled` (`status === 'SCHEDULED'`).
- [x] **Group/Multi-Person Meetings**: Update `MeetingRequest` interface in `types.ts` to replace `linkedFriendId` with `linkedIds: string[]`.
- [x] **UI Support for Multi-person**: Update the meeting card to display multiple avatars or a group name.

## 🔄 Post-Meeting Follow-up
*Background: The app already re-renders every minute to check time status. You can leverage this to check for passed meetings.*
- [x] **Detection Logic**: In `App.tsx`, compare `new Date()` against `scheduledDate` for all `SCHEDULED` meetings.
- [x] **Prompt Overlay**: If a meeting has passed since the last `lastOpened` timestamp, trigger a modal asking: "Did you meet with [Names]?"
- [x] **Batch Processing**: If 'Yes', loop through `linkedIds` and call `markContacted` for each associated friend. (Core function available via processGroupContact)

## 📖 Onboarding & Help Section
*Background: Onboarding is currently managed by `OnboardingTooltips.tsx`.*
- [x] **Context-Aware Shortcuts**: In `KeyboardShortcuts.tsx`, add a check for `Capacitor.getPlatform() !== 'web'` to hide shortcuts on mobile.
- [x] **Detailed Help Section**: Create a `HelpView` or expand `RuleGuide.tsx` to explain: Quick Touches, Deep Connection, Tokens, as well as anything else on the app that may be of interest, like the 20% buffer

## 📝 Documentation Alignment
*Background: Use `scoring.ts` and `friendEngine.ts` as the technical source of truth.*
- [x] **Update README.md**: Ensure the "Scoring System" table matches the values in `calculateInteractionScore` (e.g., -5/day overdue penalty, +10 sweet spot).
- [x] **Update APP_ANALYSIS.md**: Reflect the transition from local-only to device-integrated (contacts/notifications).
