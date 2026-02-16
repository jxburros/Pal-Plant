# Pal-Plant: Future Improvements Roadmap

**Last Updated:** 2026-02-16
**Status:** Planning Phase

---

## Purpose

This document outlines planned future enhancements for Pal-Plant. These features are deferred to maintain focus on core functionality and ensure proper user research before implementation.

---

## P2: Nice-to-Have Enhancements (Next Version)

### 1. Channel-Aware Analytics 📊

**Status:** Designed, not yet implemented
**Priority:** Medium
**Estimated Effort:** 3-4 days

**Description:**
Capture and visualize which communication channels (call, text, video, in-person) are most effective for maintaining relationships.

**Current State:**
- ✅ `ContactChannel` type exists in `types.ts`
- ✅ `channel` field added to `ContactLog` interface
- ⏳ UI for channel selection not yet implemented
- ⏳ Analytics visualization not yet built

**Implementation Plan:**
1. Add channel selector to FriendCard interaction buttons
2. Build analytics view showing:
   - Channel usage distribution per friend
   - Channel effectiveness (score changes by channel)
   - Preferred channel recommendations
3. Add channel filter to Stats view

**Benefits:**
- Users understand which channels work best for each friend
- Data-driven relationship maintenance strategy
- Personalized communication recommendations

**Technical Notes:**
- All backend support already exists
- Only UI/UX work required
- No breaking changes to data model

**Files to Modify:**
- `pal-plant/components/FriendCard.tsx` - Add channel selector
- `pal-plant/components/StatsView.tsx` - Add channel analytics section
- `pal-plant/utils/analytics.ts` - Add channel-based queries

---

### 2. Optional Cloud Backup ☁️

**Status:** Research phase
**Priority:** Medium-High
**Estimated Effort:** 2-3 weeks

**Description:**
Provide optional encrypted cloud backup/sync while maintaining local-first as the default.

**Current State:**
- ✅ Local storage works perfectly
- ✅ JSON export/restore exists
- ⏳ No automated backup solution
- ⏳ No cross-device sync

**Implementation Options:**

#### Option A: Firebase Realtime Database (Easiest)
- **Pros:** Already using Firebase for FCM; familiar
- **Cons:** User must configure Firebase project
- **Privacy:** Data encrypted client-side before upload
- **Cost:** Free tier covers most users

#### Option B: Supabase (Best UX)
- **Pros:** Built-in auth, PostgreSQL, generous free tier
- **Cons:** New dependency
- **Privacy:** Row-level security + client-side encryption
- **Cost:** Free for most users

#### Option C: Self-Hosted Backend
- **Pros:** Full control, no third-party dependency
- **Cons:** Requires hosting, more complex
- **Privacy:** Best option for privacy-conscious users
- **Cost:** User-hosted (free if self-managed)

**Recommended Approach:** Start with Option B (Supabase)

**Key Requirements:**
- ✅ Local-first remains default
- ✅ Opt-in only (explicit user consent)
- ✅ Client-side encryption (user controls keys)
- ✅ Automatic conflict resolution
- ✅ Clear data deletion policy
- ✅ Easy opt-out (delete all cloud data)

**Implementation Plan:**
1. **Phase 1:** Automated export to device storage
   - Schedule daily/weekly JSON exports
   - Save to device filesystem (Capacitor File API)
   - No cloud dependency

2. **Phase 2:** Cloud backup (optional)
   - Add Supabase integration
   - Client-side encryption with user password
   - One-way backup (no sync yet)

3. **Phase 3:** Cross-device sync
   - Two-way sync with conflict resolution
   - Last-write-wins or manual merge
   - Real-time updates via Supabase subscriptions

**Privacy Considerations:**
- ⚠️ Must update privacy policy
- ⚠️ Explicit user consent required
- ⚠️ Data encrypted before transmission
- ⚠️ User controls encryption keys
- ⚠️ Clear data retention policy

**Files to Create:**
- `pal-plant/utils/cloudBackup.ts` - Cloud backup logic
- `pal-plant/utils/encryption.ts` - Client-side encryption
- `pal-plant/components/BackupSettings.tsx` - Cloud backup UI

**Files to Modify:**
- `pal-plant/types.ts` - Add cloud backup settings
- `pal-plant/components/SettingsModal.tsx` - Add cloud backup section
- `pal-plant/utils/storage.ts` - Integrate cloud backup hooks

---

### 3. Contact-Level Smart Nudges 🔔

**Status:** Experimental
**Priority:** Low
**Estimated Effort:** 1-2 weeks

**Description:**
Personalize timing suggestions based on historical response and meeting follow-through patterns.

**Current State:**
- ✅ Basic smart nudges exist (`getSmartNudges` in utils/nudges.ts)
- ⏳ No per-contact learning

**Proposed Enhancement:**
- Track "response rate" per friend (did they meet when requested?)
- Track "optimal contact days" (which days get best response?)
- Suggest personalized timing: "Contact Sarah on Thursdays"
- Learn from declined meetings

**Machine Learning Approach:**
- Simple heuristics (no ML framework needed)
- Time-of-week analysis
- Response pattern detection
- Gradual learning over time

**Files to Modify:**
- `pal-plant/utils/nudges.ts` - Add per-contact learning
- `pal-plant/types.ts` - Add learning data to Friend interface
- `pal-plant/components/FriendCard.tsx` - Show personalized suggestions

---

### 4. Further App.tsx Refactoring 🏗️

**Status:** Planned
**Priority:** Low-Medium
**Estimated Effort:** 2-3 days

**Description:**
Continue refactoring App.tsx to achieve the original 300-350 line target by extracting more business logic into custom hooks.

**Current State:**
- ✅ Modal state extracted to useModalState hook (P0.2)
- ✅ Friends engine logic in useFriendsEngine hook
- ✅ Reminder engine in useReminderEngine hook
- ⏳ App.tsx still at 577 lines (target: 300-350)

**Proposed Refactoring:**
1. Extract meeting request management into `useMeetingsEngine` hook
2. Extract settings management into `useSettings` hook
3. Extract navigation/tab state into `useNavigation` hook
4. Extract toast notifications into `useToast` hook
5. Consider creating a higher-level `useAppState` orchestrator hook

**Benefits:**
- Improved testability (hooks can be tested in isolation)
- Better code organization and maintainability
- Easier to reason about app state flow
- Aligns with React best practices

**Technical Considerations:**
- Ensure proper dependency management between hooks
- Maintain performance (avoid unnecessary re-renders)
- Keep backward compatibility with existing components
- Update tests to cover new hooks

**Files to Create:**
- `pal-plant/hooks/useMeetingsEngine.ts`
- `pal-plant/hooks/useSettings.ts`
- `pal-plant/hooks/useNavigation.ts`
- `pal-plant/hooks/useToast.ts`

**Files to Modify:**
- `pal-plant/App.tsx` - Refactor to use new hooks

---

## Future Considerations (P3+)

### Social Features (Requires Backend)

**Note:** These conflict with local-first philosophy; requires careful consideration

- Shared gardens (families, teams)
- Gift/event coordination among friends
- Social accountability (buddy system)

**Decision:** Likely out of scope; conflicts with privacy goals

---

### Gamification & Rewards

**Potential Features:**
- Achievement badges (30-day streak, etc.)
- Relationship milestones (1-year anniversary)
- Weekly challenges ("Contact 5 friends this week")

**Concerns:**
- May feel manipulative
- Could create unhealthy pressure
- Must align with app's caring philosophy

**Decision:** User research needed before implementing

---

### Advanced Analytics & Insights

**Potential Features:**
- Relationship health trends over time
- Cohort analysis (work vs. family engagement)
- Predictive alerts ("You might lose touch with John soon")
- Network visualization (friend groups)

**Implementation:**
- Build on existing stats infrastructure
- Add more sophisticated queries
- Consider privacy implications of predictive features

---

### Integrations

**Potential Integrations:**
- Calendar apps (Google Calendar, Apple Calendar)
- Contact apps (sync names, photos, birthdays)
- Messaging apps (WhatsApp, Signal - read-only for logging)
- Social media (LinkedIn, Facebook - import birthdays)

**Challenges:**
- API access limitations
- Privacy concerns
- Platform-specific implementations

**Decision:** Start with iCalendar export (already done), defer others

---

## Implementation Principles

All future improvements must adhere to:

1. **Privacy First**
   - Local-first by default
   - No data collection without explicit consent
   - User controls all data

2. **Progressive Enhancement**
   - Core app works without advanced features
   - Features are opt-in, not forced

3. **Maintainability**
   - Clean, documented code
   - Comprehensive tests
   - No technical debt

4. **User-Centric**
   - Solve real problems
   - User research before building
   - Avoid feature bloat

---

## User Research Questions

Before implementing P2 features, gather feedback on:

1. **Cloud Backup:**
   - Would you trust cloud backup if data is encrypted?
   - Would you pay for cloud sync?
   - How important is cross-device sync?

2. **Channel Analytics:**
   - Do you care which channel you use to contact friends?
   - Would channel recommendations be helpful?
   - Is this too much complexity?

3. **Smart Nudges:**
   - Do you want personalized timing suggestions?
   - Would "optimal contact days" feel creepy or helpful?
   - How much automation is too much?

---

## Next Steps

1. Complete P0 and P1 implementations (current sprint)
2. Gather user feedback on current features
3. Conduct user research for P2 items
4. Prioritize based on user demand and effort
5. Build prototypes for top-requested features

---

## Changelog

- **2026-02-16:** Initial version created during P0/P1 implementation
