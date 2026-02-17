# 🌱 Pal Plant — AI Implementation Plan
Purpose: Structured refactor + optimization tasks formatted for AI coding agents.
Scope: Performance, data integrity, feature refinement, and code debt cleanup.

---

# 1. Performance & State Management

## 1.1 Implement Batch Interaction Logging

### Problem
`markContacted` in `useFriendsEngine.ts` processes updates individually.
This causes multiple state updates and unnecessary re-renders when handling group interactions.

### Required Refactor
- Modify `markContacted` to accept an array of IDs:
  `markContacted(ids: string[])`
- Perform a single functional state update:
  `setFriends(prev => prev.map(friend => ...))`
- Ensure:
  - Only one render cycle per batch
  - Immutable updates
  - No mutation of previous state
  - Compatibility with existing cadence + score logic

### Acceptance Criteria
- Group interactions trigger only one state update.
- No regression in scoring or cadence calculations.
- Performance improvement measurable in React DevTools.

---

## 1.2 Optimize HomeView Sorting

### Problem
`App.tsx` uses a 60-second `currentTime` interval.
This forces a full garden re-sort every minute, causing:
- Scroll jumps
- UI instability
- Unnecessary recomputation

### Required Refactor
- Wrap sorted list logic in:
  `useMemo(...)`
- Dependency array should include only:
  - friends data
  - explicit refresh trigger
- Remove automatic time-based resorting OR:
  - Add "Manual Refresh" button
  - OR re-sort only when user navigates back to Garden tab

### Acceptance Criteria
- Garden scroll position remains stable.
- No automatic UI jump while interacting.
- Sorting remains correct when explicitly refreshed.

---

# 2. Data Integrity & Storage

## 2.1 Add Photo Compression Utility

### Problem
High-resolution photos stored directly in IndexedDB will exceed storage quota.

### Required Implementation
Create utility:
`utils/imageCompression.ts`

Using:
- HTML5 Canvas API
- Resize max dimensions: 500x500px
- Compress before Base64 encoding

### Workflow
1. Load image file
2. Draw onto canvas
3. Resize maintaining aspect ratio
4. Export compressed Base64
5. Save to `Friend.photo`

### Acceptance Criteria
- All saved photos ≤ 500x500px
- No noticeable UI quality degradation
- Reduced IndexedDB storage footprint

---

## 2.2 Implement Conflict Resolution for Imports

### Problem
`BulkImportModal` blindly appends entries.
This creates duplicate friends.

### Required Refactor
Update `bulkImport` logic to:
- Check duplicates using:
  `utils/duplicates.ts`
- Compare:
  - Name
  - Phone number (if present)

### Required UI Flow
When conflict detected, prompt:
- Skip
- Overwrite
- Merge

### Acceptance Criteria
- No silent duplicates.
- User-controlled conflict resolution.
- Merge preserves existing metadata safely.

---

## 2.3 Cleanup Redundant Persistence

### Problem
Data persistence occurs in:
- `AppContext.tsx` (localStorage)
- `App.tsx` (IndexedDB debounced storage)

This creates:
- Race conditions
- Conflicting writes
- Redundant persistence logic

### Required Refactor
- Remove all `localStorage` persistence hooks from:
  `AppContext.tsx`
- Rely exclusively on:
  `utils/storage.ts`

### Acceptance Criteria
- Single source of truth: IndexedDB layer
- No data loss
- No race conditions

---

# 3. Feature Refinement & Bug Fixes

## 3.1 Migrate Legacy Meeting Fields

### Problem
`MeetingRequest` still uses:
`linkedFriendId`

Plural:
`linkedIds: string[]`
is underutilized.

### Required Refactor
- Update `handleRequestMeeting` in `App.tsx`
- Populate `linkedIds`
- Remove reliance on `linkedFriendId`
- Update `MeetingRequestsView`:
  - Map over `linkedIds`
  - Render group visuals

### Acceptance Criteria
- Group meetings fully supported.
- No regression for single-friend meetings.
- Legacy field safely deprecated.

---

## 3.2 Explicit Notification Permission Flow

### Problem
App uses `useReminderEngine` but lacks explicit permission request UI.

### Required Implementation
Add toggle in:
`SettingsModal`

Trigger:
- Web:
  `Notification.requestPermission()`
- Native (Capacitor):
  `PushNotifications.requestPermissions()`

### Acceptance Criteria
- User clearly prompted before reminders activate.
- No silent permission failures.
- Permissions state stored and reflected in UI.

---

## 3.3 Expand Garden Filters

### Problem
As garden grows, search-only filtering becomes insufficient.

### Required Implementation
Add filter pill UI to header:
- Wilting
- Withering
- Healthy
- All

Leverage:
`calculateTimeStatus`

### Acceptance Criteria
- Instant filtering without navigation.
- Works with existing search bar.
- No performance degradation.

---

# 4. Code Debt & Housekeeping

## 4.1 Remove Unused Legacy Code

### Task
- Delete:
  `localStorage.removeItem('friendkeep_accounts')`
  in `App.tsx`
- Remove all references to abandoned "Accounts" feature.

### Acceptance Criteria
- No references remain.
- Bundle size reduced.
- No runtime errors.

---

## 4.2 Standardize Copyright Headers

### Task
Ensure all new files include:
Apache License 2.0 header

Reference:
`App.tsx`

### Acceptance Criteria
- All new/modified files compliant.
- No missing license headers.
