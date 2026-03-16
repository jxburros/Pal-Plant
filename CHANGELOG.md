# Pal-Plant - Changelog

## [Unreleased] - 2026-03-16

### 📖 Documentation
- **Documentation Audit**: Updated all documentation to match current codebase state
  - Removed all Firebase references from README and docs (Firebase was removed from the codebase)
  - Updated README tech stack: removed Firebase Cloud Messaging, removed "(via CDN)" from Tailwind CSS, added PWA entry, updated Capacitor description
  - Updated README Reminders feature: now accurately describes Capacitor-only native push notifications
  - Updated README dev server URL from port 5173 to 3000 (matching `vite.config.ts`)
  - Updated README project structure: added `hooks/AppContext.tsx`, added `utils/contacts.ts`, removed `utils/firebase.ts` and `utils/firebaseMessaging.ts`, updated `public/` to reflect PWA icons (removed `firebase-messaging-sw.js`)
  - Rewrote `docs/FIREBASE.md` as a Push Notifications Guide reflecting Capacitor-only architecture
  - Updated `docs/README.md` to reference the Push Notifications Guide

## [Unreleased] - 2026-02-17

### 📖 Documentation
- **Documentation Reorganization**: Restructured and cleaned up all documentation
  - Created `docs/` directory for organized documentation structure
  - Consolidated 3 Firebase documents into single comprehensive guide (`docs/FIREBASE.md`)
  - Archived historical documents (`AUDIT_FINAL_REPORT.md`, `REFACTORING_SUMMARY.md`, `ISSUES_IMPLEMENTATION_SUMMARY.md`, `APP_ANALYSIS.md`) to `docs/archive/`
  - Removed obsolete `ToDo.md` (all tasks completed)
  - Removed redundant `pal-plant/README.md`
  - Updated all cross-references to reflect new structure
  - Code is now the source of truth - documentation matches actual implementation

## [Unreleased] - 2026-02-16

### 🔒 Security & Privacy
- **Firebase Compliance**: Firebase is now used ONLY for push notifications (Cloud Messaging)
  - Removed Firebase Analytics completely
  - All usage analytics are now stored locally only (never sent to external services)
  - Created comprehensive Firebase usage documentation
  - Maintained app's local-first privacy model

### ✨ Features
- **Timer Grace Period**: All timers now include a built-in 20% buffer
  - A 10-day contact timer gives you 12 days before it's truly overdue
  - Applies to all timers: contact cadence, deep connection cooldowns, meeting deadlines
  - Creates a more forgiving, less stressful experience
  - Grace period works automatically in the background

### 📚 Onboarding & Help
- **Enhanced Onboarding**: New users now receive clear explanation of scoring system
  - 3 new onboarding slides explaining how scoring works
  - Learn about interaction types and their effects
  - Understand the grace period system
  - All information matches actual app behavior
- **Updated Help Guide**: Added detailed documentation about timer buffers and grace periods

### 🐛 Bug Fixes
- Corrected deep connection cooldown calculation (28.8 hours with buffer)
- Clarified timer documentation to explain relationship between displayed and actual durations

### 📖 Documentation
- Created `FIREBASE_USAGE.md` documenting Firebase scope and policy
- Created `ISSUES_IMPLEMENTATION_SUMMARY.md` with technical implementation details
- Created `AUDIT_FINAL_REPORT.md` with complete audit findings
- Improved inline code documentation throughout

### 🧪 Testing
- ✅ All 35 rule invariant tests passing
- ✅ Zero security vulnerabilities (CodeQL scan)
- ✅ No regressions detected

---

## What's Changed

### For Users
- 🎉 **More forgiving timers**: You have extra time before contacts are marked overdue
- 🎓 **Better onboarding**: New users understand scoring from day one
- 🔒 **Enhanced privacy**: No analytics data sent to external services

### For Developers
- 📦 Firebase now properly scoped to push notifications only
- 🧹 Cleaner, more maintainable codebase
- 📝 Comprehensive documentation of architecture decisions

---

## Technical Details

### Changed Files
- `pal-plant/utils/firebase.ts` - Removed Analytics initialization
- `pal-plant/utils/analytics.ts` - Made local-only
- `pal-plant/utils/helpers.ts` - Added timer buffer logic
- `pal-plant/components/FriendCard.tsx` - Applied buffer to cooldown
- `pal-plant/components/MeetingRequestsView.tsx` - Applied buffer to stale threshold
- `pal-plant/components/OnboardingTooltips.tsx` - Added scoring slides
- `pal-plant/components/RuleGuide.tsx` - Added grace period documentation
- `pal-plant/public/firebase-messaging-sw.js` - Removed Analytics config

### New Files
- `pal-plant/FIREBASE_USAGE.md` - Firebase policy documentation
- `ISSUES_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `AUDIT_FINAL_REPORT.md` - Complete audit report

---

## Upgrade Notes

### Breaking Changes
None. All changes are backward compatible.

### Migration Notes
- Existing timers will automatically benefit from the 20% grace period
- No data migration required
- No user action needed

---

## Known Issues

The following issues require physical mobile devices for proper testing and remain open:
- #22: Permission request flows (Android/iOS)
- #21: Mobile push notification detection
- #24: Mobile feature parity with web
- #23: Contacts import/browse

Additional improvements planned:
- #25: Theme contrast fixes (especially Midnight theme)
- #26: Optional meeting timeframe selector
- #28: Garden card layout redesign

---

## Contributors
- @jxburros (Issue creation and specification)
- GitHub Copilot Coding Agent (Implementation)

---

## Links
- [Push Notifications Guide](docs/FIREBASE.md)
- [Archived Documentation](docs/archive/)
- [Implementation Summary](docs/archive/ISSUES_IMPLEMENTATION_SUMMARY.md)
- [Full Audit Report](docs/archive/AUDIT_FINAL_REPORT.md)
