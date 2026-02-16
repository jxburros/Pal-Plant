# Pal-Plant: P0/P1 Implementation Plan

**Date:** 2026-02-16
**Branch:** `claude/review-app-codebase-eJxeG`
**Scope:** P0 (3 items) + P1 (3 items) + Weekly Planning Mode + Documentation

---

## Overview

This document outlines the implementation plan for priority improvements identified in the comprehensive code review. The goal is to enhance UX clarity, improve state management scalability, extend test coverage, and implement Weekly Planning Mode.

---

## P0: Next Priorities (Critical)

### P0.1: Enhance Meeting State UX ✅

**Problem:** Meeting lifecycle has ambiguous actions in edge cases (past-due, rescheduling, cancellation)

**Solution:**
- Add explicit state-dependent action buttons to MeetingRequestsView
- Show score impact preview for each action
- Add "Reschedule" and "Cancel" options with clear outcomes
- Improve status flow: `REQUESTED → SCHEDULED → COMPLETE/CANCELLED`

**Files to Modify:**
- `pal-plant/types.ts` - Add `CANCELLED` status to `MeetingStatus`
- `pal-plant/components/MeetingRequestsView.tsx` - Add action buttons and score previews
- `pal-plant/utils/helpers.ts` - Add helper for score impact preview

**Success Criteria:**
- Users see clear action buttons based on meeting state
- Score impact is visible before taking action
- Past-due meetings have obvious "reschedule" or "cancel" paths

---

### P0.2: Refine State Management in App.tsx ✅

**Problem:** App.tsx is 565 lines handling too many responsibilities

**Solution:**
- Extract modal state management into custom hook: `useModalState`
- Enhance `useReminderEngine` to handle all reminder logic
- Consider using existing `AppContext` for global state
- Keep App.tsx focused on orchestration only

**Files to Create:**
- `pal-plant/hooks/useModalState.ts` - Modal management hook
- `pal-plant/hooks/AppContext.tsx` - Already exists, may enhance

**Files to Modify:**
- `pal-plant/App.tsx` - Refactor to use hooks
- `pal-plant/hooks/useReminderEngine.ts` - Enhance if needed

**Success Criteria:**
- App.tsx reduced to ~300-350 lines
- Modal logic cleanly extracted
- Reminder logic isolated in dedicated hook

---

### P0.3: Add Cross-Device Data Safety Warning ✅

**Problem:** Users may lose data if browser cache is cleared or device is lost

**Solution:**
- Add prominent warning on first login (check `hasSeenDataWarning` flag)
- Display in Settings modal with backup/restore instructions
- Link to export/restore functionality
- Add scheduled backup reminders (use existing `backupReminderDays` setting)

**Files to Modify:**
- `pal-plant/types.ts` - Add `hasSeenDataWarning: boolean` to AppSettings
- `pal-plant/components/SettingsModal.tsx` - Add warning section
- `pal-plant/App.tsx` - Show warning modal on first login
- `pal-plant/components/OnboardingTooltips.tsx` - Add data safety slide

**Success Criteria:**
- Warning shown on first login
- Clear explanation of local-first architecture
- Backup/restore guidance prominent in Settings

---

## P1: Important Improvements

### P1.4: Extend Test Coverage ✅

**Problem:** Limited component/integration testing; mostly unit tests on utils

**Solution:**
- Add component tests for critical views: HomeView, FriendCard, MeetingRequestsView
- Add integration tests for meeting flow (create → schedule → complete)
- Add snapshot tests for scoring edge cases

**Files to Create:**
- `pal-plant/tests/component-tests.ts` - Component test suite
- `pal-plant/tests/integration-tests.ts` - Integration test suite

**Files to Modify:**
- `pal-plant/package.json` - Add test scripts
- `pal-plant/tsconfig.rules.json` - Ensure test config supports component tests

**Success Criteria:**
- 20+ new component tests
- 10+ integration tests
- All tests passing
- Coverage for critical user flows

---

### P1.5: Improve Meeting Request Urgency Visualization ✅

**Problem:** Meeting urgency is calculated but not visually obvious

**Solution:**
- Add visual indicator (icon, color, badge) for urgency level
- Show reason for urgency (e.g., "5 days overdue", "ASAP timeframe")
- Use existing Lucide icons for consistency

**Files to Modify:**
- `pal-plant/components/MeetingRequestsView.tsx` - Add urgency badges
- `pal-plant/utils/helpers.ts` - Add urgency level calculator

**Success Criteria:**
- Clear visual indicators on meeting cards
- Urgency level obvious at a glance
- Consistent with overall design system

---

### P1.6: Clarify Browser Notification Status in Settings ✅

**Problem:** Users don't know if notifications are working or permission status

**Solution:**
- Show permission status in Settings (granted/denied/not-determined)
- Add "Request Permission" button if not granted
- Document fallback reminder system
- Show FCM token status (optional, for debugging)

**Files to Modify:**
- `pal-plant/components/SettingsModal.tsx` - Add notification status section
- `pal-plant/utils/firebaseMessaging.ts` - Add permission status check

**Success Criteria:**
- Permission status visible in Settings
- One-click permission request
- Clear explanation of fallback reminders

---

## Additional Features

### Weekly Planning Mode ✅

**Status:** Already sketched as WeeklyPlanView.tsx (200 lines)

**Implementation:**
- Review existing WeeklyPlanView.tsx
- Integrate with HomeView navigation
- Generate 7-day plan with top-N contacts
- Show streak preservation opportunities
- Add calendar export for planned contacts

**Files to Modify:**
- `pal-plant/components/WeeklyPlanView.tsx` - Enhance existing implementation
- `pal-plant/App.tsx` - Add "WEEKLY_PLAN" tab or integrate into HOME
- `pal-plant/types.ts` - Add Tab.WEEKLY_PLAN if needed

**Success Criteria:**
- 7-day plan generated from friend urgency
- Clear action items for each day
- Calendar export available

---

## Documentation Updates

### Future Improvements Documentation ✅

**Purpose:** Document future enhancements so they're not forgotten

**Files to Create/Modify:**
- `pal-plant/FUTURE_IMPROVEMENTS.md` - Comprehensive future roadmap

**Content:**
- Channel-Aware Analytics (capture contact method, show analytics)
- Optional Cloud Backup (encrypted sync, opt-in only)
- Other P2 items from review

---

## Implementation Order

1. **Documentation** (FUTURE_IMPROVEMENTS.md) - 10 min
2. **P0.2: State Management** (useModalState, refactor App.tsx) - 60 min
3. **P0.1: Meeting State UX** (action buttons, score preview) - 45 min
4. **P1.5: Meeting Urgency** (visual indicators) - 30 min
5. **P0.3: Data Safety Warning** (modal, settings) - 30 min
6. **P1.6: Notification Status** (permission UI) - 30 min
7. **Weekly Planning Mode** (enhance existing) - 45 min
8. **P1.4: Test Coverage** (component/integration tests) - 60 min
9. **Testing & Verification** - 30 min
10. **Commit & Push** - 10 min

**Total Estimated Time:** ~5-6 hours

---

## Success Metrics

- ✅ All P0 items implemented
- ✅ All P1 items implemented
- ✅ Weekly Planning Mode functional
- ✅ All tests passing (35+ existing + 30+ new = 65+ total)
- ✅ No regressions
- ✅ Documentation complete
- ✅ Code committed and pushed

---

## Risk Mitigation

- **Breaking changes:** Use feature flags or backward-compatible additions
- **Test failures:** Run tests after each major change
- **State migration:** Handle missing fields gracefully with defaults
- **User impact:** Additive changes only; no removals

---

## Next Steps After Implementation

1. User testing for meeting flow improvements
2. Gather feedback on Weekly Planning Mode
3. Monitor data loss reports (should decrease with warnings)
4. Consider P2 items for next sprint
