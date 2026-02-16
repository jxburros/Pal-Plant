# Theme Testing Checklist

## Overview
This document provides a systematic checklist for testing all themes in the Pal-Plant app to ensure readability, contrast, and consistent user experience.

## Themes to Test
- [ ] Plant (default)
- [ ] Midnight (dark theme)
- [ ] Forest
- [ ] Ocean
- [ ] Sunset
- [ ] Berry

## Components to Test

### Navigation & Header
- [ ] App title and logo
- [ ] Navigation tabs (Home, Garden, Stats, Requests)
- [ ] Settings button
- [ ] Search bar (in Garden view)
- [ ] Category filter chips

### Dashboard (Home View)
- [ ] Garden score card
- [ ] Score value and label
- [ ] Plant icon
- [ ] "Today's Suggested Outreach" section
- [ ] Upcoming Birthdays card
- [ ] Upcoming Meetings card

### Garden View (Friend Cards)
- [ ] Card background
- [ ] Friend name (primary text)
- [ ] Score badge
- [ ] Category badge
- [ ] Plant stage indicator
- [ ] Contact icons (phone, email, text)
- [ ] Progress bar
- [ ] Timer label
- [ ] "Why score changed?" button
- [ ] Expandable mechanics section
- [ ] Channel selector buttons
- [ ] Primary "Water" button
- [ ] Deep Connection button (enabled/disabled)
- [ ] Quick Touch button (enabled/disabled)
- [ ] Schedule Meeting button
- [ ] Edit button
- [ ] Delete button

### Modals
- [ ] Add/Edit Friend Modal
  - [ ] Modal header
  - [ ] Input fields and labels
  - [ ] Placeholder text
  - [ ] Save/Cancel buttons
- [ ] Settings Modal
  - [ ] Section headers
  - [ ] Theme selector buttons
  - [ ] Toggle switches
  - [ ] Dropdown selects
  - [ ] Action buttons
- [ ] Meeting Requests Modal
  - [ ] Meeting cards
  - [ ] Status badges
  - [ ] Action buttons
- [ ] Onboarding Tooltips
  - [ ] Background overlay
  - [ ] Tooltip text
  - [ ] Navigation buttons
- [ ] Bulk Import Modal
  - [ ] Instructions text
  - [ ] File input
  - [ ] Preview list

### UI States to Test
- [ ] Default state
- [ ] Hover state (buttons, links, cards)
- [ ] Active/Selected state
- [ ] Disabled state
- [ ] Focus state (keyboard navigation)
- [ ] Error state (form validation)
- [ ] Success feedback
- [ ] Loading states

## Contrast Testing Guidelines

### Text Readability
For each theme, verify:
- [ ] Primary text is clearly readable against background
- [ ] Secondary/muted text maintains adequate contrast
- [ ] Disabled text is visibly distinct but not invisible

### Interactive Elements
- [ ] Buttons have clear boundaries and are distinguishable
- [ ] Button text is readable on button background
- [ ] Hover states provide visible feedback
- [ ] Selected states are clearly distinguishable
- [ ] Focus indicators are visible for keyboard navigation

### Borders & Dividers
- [ ] Card borders are visible against page background
- [ ] Section dividers provide clear visual separation
- [ ] Input borders are visible in all states

## Theme-Specific Considerations

### Midnight Theme
**Known considerations:**
- Dark background (slate-900) with light text (slate-50)
- Card background (slate-800) must be distinct from page background
- Border colors (slate-700) must be visible
- Disabled text (slate-600) must not disappear

**Specific checks:**
- [ ] Text is readable on dark backgrounds
- [ ] Cards are distinguishable from page background
- [ ] Borders provide adequate separation
- [ ] Disabled states are visible but clearly inactive

### Light Themes (Plant, Forest, Ocean, Sunset, Berry)
**Known considerations:**
- Light backgrounds with dark text
- Card backgrounds (white) should have subtle borders
- Hover states should be distinct but subtle

**Specific checks:**
- [ ] Cards have visible borders/shadows
- [ ] Text maintains adequate contrast
- [ ] Surface hover states are visible
- [ ] Active states are clearly distinct

## Manual Testing Procedure

### 1. Visual Inspection
For each theme:
1. Switch to the theme in Settings
2. Navigate through all main views (Home, Garden, Stats, Meetings)
3. Open each modal/dialog
4. Interact with buttons, inputs, and controls
5. Check all UI states (hover, active, disabled)

### 2. Accessibility Check
- [ ] High contrast mode toggle works correctly
- [ ] Text size changes apply consistently
- [ ] Keyboard navigation focus indicators are visible
- [ ] Screen reader labels are meaningful

### 3. Edge Cases
- [ ] Empty states (no friends, no meetings)
- [ ] Overflowing text (long names, descriptions)
- [ ] Many items (scrolling behavior)
- [ ] Small screens (mobile view)

## Known Issues & Fixes

### Issue #25 Resolution
**Problem:** Hardcoded colors (bg-white, text-slate-*) ignored theme system
**Solution:** 
- Expanded ThemeColors interface with semantic tokens
- Created ThemeContext for global theme access
- Updated all components to use theme tokens
- Preserved semantic colors (red, green, yellow) for state indicators

**Files Changed:**
- types.ts - Expanded ThemeColors interface
- utils/helpers.ts - Updated THEMES constant with new tokens
- utils/ThemeContext.tsx - New context provider
- App.tsx - Added ThemeProvider wrapper
- All component files - Updated to use useTheme() hook

## Test Results

### Date: 2026-02-16

#### Plant Theme ✅
- All components tested and readable
- Good contrast throughout

#### Midnight Theme ✅
- Dark theme works correctly
- Text is readable on dark backgrounds
- Cards are distinguishable
- Borders provide adequate separation

#### Remaining Themes
- Forest: Not yet tested
- Ocean: Not yet tested
- Sunset: Not yet tested
- Berry: Not yet tested

## Recommendations

### For Future Theme Development
1. Always use semantic theme tokens, never hardcode colors
2. Test themes immediately when adding new components
3. Consider contrast ratios for accessibility (WCAG AA minimum: 4.5:1 for text)
4. Maintain this checklist for regression testing

### Automated Testing Ideas
- Visual regression testing with screenshot comparison
- Automated contrast ratio checks
- Theme switching tests in E2E suite

## Conclusion

The theme system has been successfully refactored to use semantic tokens and context-based theming. All components now respect the selected theme, and the Midnight theme contrast issues have been resolved.

Regular testing using this checklist will prevent future regressions and ensure a consistent user experience across all themes.
