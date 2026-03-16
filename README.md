# 🌱 Pal-Plant

**A relationship management app that helps you nurture and maintain meaningful connections with friends and family.**

Pal-Plant uses a garden metaphor to visualize your relationships. Each contact is a "plant" that needs regular care—if you don't stay in touch, your plant will wilt!

## ✨ Features

### 🏠 Dashboard
- **Social Garden Score** – An overall health score (0-100) for your relationship network
- **Withering Plants** – Alerts for contacts who are overdue for attention
- **Upcoming Birthdays** – Never miss an important date
- **Scheduled Meetings** – Quick view of upcoming meetups

### 🌿 Contact Management
- **Timer-Based Tracking** – Set custom contact frequency for each person
- **Categories** – Organize contacts into groups (Friends, Romantic, Business, Family, or custom)
- **Plant Health Visualization** – See at a glance which relationships need nurturing
- **Contact History** – Full log of all interactions

### 💬 Interaction Types
- **Regular Contact** – Standard check-ins that reset the timer
- **Deep Connection** – Meaningful conversations that earn bonus time
- **Quick Touch** – Brief interactions that extend the timer slightly (limited availability)

### 📅 Meeting Requests
- **Track Pending Requests** – Monitor outreach attempts
- **Schedule Meetings** – Set dates and locations
- **Calendar Support** – Add scheduled meetings to Google Calendar or download `.ics` files
- **Verification** – Confirm attendance to boost your score

### 📥 Bulk Import
- **CSV Import** – Import contacts from spreadsheets or other apps
- **Duplicate Detection** – Automatically identifies potential duplicates

### 💾 Data Management
- **Backup Data** – Export a full JSON backup of friends, meetings, categories, and settings
- **Restore Data** – Restore from a previously exported JSON backup

### 🎨 Themes & Accessibility
- **6 Color Themes** – Plant, Midnight, Forest, Ocean, Sunset, Berry
- **Text Size Options** – Normal, Large, Extra Large
- **High Contrast Mode** – Improved visibility
- **Reduced Motion** – Disable animations

### 🔔 Reminders
- **Push Notifications** – Native push notifications for Android/iOS apps (via Capacitor) for overdue contacts and upcoming scheduled meetings
- **Note:** Web push notifications are not available in this build; push reminders require an Android or iOS device

### ⌨️ Keyboard Shortcuts
- `H` Home, `G` Garden, `M` Meetings, `N` New Friend, `S` Settings, `?` Shortcuts, `Esc` Close dialog

## 🛠️ Tech Stack

- **React 19** – UI framework
- **TypeScript** – Type-safe JavaScript
- **Vite** – Fast build tool and dev server
- **Capacitor** – Native Android/iOS app packaging with push notifications and contacts access
- **Local Analytics** – Event tracking stored locally (no external services)
- **Tailwind CSS** – Utility-first styling
- **Lucide React** – Beautiful icons
- **Recharts** – Data visualization
- **IndexedDB Storage** – Persistent data storage with automatic localStorage fallback (local-first, no cloud sync)
- **PWA** – Progressive Web App support via Vite plugin

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jxburros/Pal-Plant.git
   cd Pal-Plant/pal-plant
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Build for Android

This project uses [Capacitor](https://capacitorjs.com/) to package the web app as a native Android application with support for native push notifications.

**Prerequisites:**
- [Android Studio](https://developer.android.com/studio) installed

**Steps:**

1. Build the web app and sync with Android:
   ```bash
   npm run cap:sync
   ```

2. Open the Android project in Android Studio:
   ```bash
   npm run cap:open:android
   ```

3. In Android Studio, click **Run** to launch on an emulator or connected device, or use **Build > Build APK(s)** to generate an APK.

### Build for iOS

**Prerequisites:**
- macOS with [Xcode](https://developer.apple.com/xcode/) installed

**Steps:**

1. Build the web app and sync with iOS:
   ```bash
   npm run cap:sync
   ```

2. Open the iOS project in Xcode:
   ```bash
   npm run cap:open:ios
   ```

3. In Xcode, select a target device or simulator and click **Run** to launch the app.

**Note:** iOS builds are supported but have not been extensively tested. Please report any issues you encounter.

## 📖 How It Works

### The Plant Metaphor

Each contact in Pal-Plant is represented as a plant:

| Plant Stage | Percentage | Description |
|-------------|------------|-------------|
| 🌸 Thriving | 80-100% | Recently contacted, relationship is flourishing |
| 🌳 Growing | 50-79% | Healthy, but check in soon |
| 🌱 Sprouting | 25-49% | Getting close to contact time |
| 🍂 Wilting | 1-24% | Needs attention soon! |
| 💀 Withered | 0% or less | Overdue – reach out now! |

### Scoring System

Your **Social Garden Score** is calculated based on:
- Individual friend scores (based on interaction timing and consistency)
- Verified completed meetings (+5 points each)
- Stale meeting requests (−2 points if pending > 14 days)
- Clamped to a final score between 0 and 100

### Interaction Scoring

| Action | Points | Notes |
|--------|--------|-------|
| Regular contact (sweet spot) | +10 | When 0-50% time remaining |
| Regular contact (normal) | +5 | When 50-80% time remaining |
| Regular contact (too early) | −2 | When >80% time remaining |
| Deep connection | +15 | Also grants +12 hours to timer |
| Quick touch | +2 | Adds a small timer extension and is limited to 1 per 2 cycles |
| Overdue contact | −5/day | Up to −30 maximum |

## 📁 Project Structure

```
pal-plant/
├── components/           # React components
│   ├── AddFriendModal.tsx
│   ├── BulkImportModal.tsx
│   ├── FriendCard.tsx
│   ├── GroupManagementModal.tsx
│   ├── HomeView.tsx
│   ├── InlineFeedback.tsx
│   ├── KeyboardShortcuts.tsx
│   ├── MeetingFollowUpModal.tsx
│   ├── MeetingRequestsView.tsx
│   ├── OnboardingTooltips.tsx
│   ├── RuleGuide.tsx
│   ├── SettingsModal.tsx
│   ├── StatsView.tsx
│   └── WeeklyPlanView.tsx
├── hooks/
│   ├── AppContext.tsx           # Application context and state management
│   ├── useFriendsEngine.ts     # Contact scoring and management
│   └── useReminderEngine.ts    # Notification system
├── utils/
│   ├── analytics.ts            # Local-only event tracking
│   ├── avatar.ts               # Avatar generation
│   ├── calendar.ts             # ICS and Google Calendar integration
│   ├── contacts.ts             # Device contact access via Capacitor
│   ├── core.ts                 # Core utility functions
│   ├── csv.ts                  # CSV parsing
│   ├── debouncedStorage.ts     # Debounced storage operations
│   ├── duplicates.ts           # Duplicate contact detection
│   ├── friendEngine.ts         # Contact scoring logic
│   ├── helpers.ts              # Utility functions (re-exports)
│   ├── imageCompression.ts     # Image compression for storage
│   ├── nudges.ts               # Smart nudge recommendations
│   ├── scoring.ts              # Scoring system
│   ├── stats.ts                # Statistics calculations
│   ├── storage.ts              # IndexedDB with localStorage fallback
│   ├── streaks.ts              # Streak calculations
│   ├── themes.ts               # Theme definitions
│   └── validation.ts           # Input validation
├── public/
│   ├── icon.svg
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   ├── badge.svg
│   └── badge-72x72.png
├── tests/
│   ├── rule-invariants.ts   # Scoring system tests
│   └── module-tests.ts      # Module unit tests
├── App.tsx               # Main application component
├── types.ts              # TypeScript type definitions
├── index.tsx             # Application entry point
├── index.html            # HTML template
├── android/              # Native Android project (Capacitor)
├── ios/                  # Native iOS project (Capacitor)
├── capacitor.config.ts   # Capacitor configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite configuration
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
