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
- **Calendar Export** – Download `.ics` files for calendar apps
- **Verification** – Confirm attendance to boost your score

### 📥 Bulk Import
- **CSV Import** – Import contacts from spreadsheets or other apps
- **Duplicate Detection** – Automatically identifies potential duplicates

### 🎨 Themes & Accessibility
- **6 Color Themes** – Plant, Midnight, Forest, Ocean, Sunset, Berry
- **Text Size Options** – Normal, Large, Extra Large
- **High Contrast Mode** – Improved visibility
- **Reduced Motion** – Disable animations

### ⌨️ Keyboard Shortcuts
- Navigate quickly with keyboard shortcuts for power users

## 🛠️ Tech Stack

- **React 19** – UI framework
- **TypeScript** – Type-safe JavaScript
- **Vite** – Fast build tool and dev server
- **Tailwind CSS** – Utility-first styling
- **Lucide React** – Beautiful icons
- **Recharts** – Data visualization
- **Local Storage** – Persistent data storage

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

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

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

### Interaction Scoring

| Action | Points | Notes |
|--------|--------|-------|
| Regular contact (sweet spot) | +10 | When 0-50% time remaining |
| Regular contact (normal) | +5 | When 50-80% time remaining |
| Regular contact (too early) | −2 | When >80% time remaining |
| Deep connection | +15 | Also grants +12 hours to timer |
| Quick touch | +2 | Limited to 1 per 2 cycles |
| Overdue contact | −5/day | Up to −30 maximum |

## 📁 Project Structure

```
pal-plant/
├── components/           # React components
│   ├── AddFriendModal.tsx
│   ├── BulkImportModal.tsx
│   ├── FriendCard.tsx
│   ├── HomeView.tsx
│   ├── KeyboardShortcuts.tsx
│   ├── MeetingRequestsView.tsx
│   ├── OnboardingTooltips.tsx
│   ├── SettingsModal.tsx
│   └── StatsView.tsx
├── utils/
│   └── helpers.ts        # Utility functions
├── App.tsx               # Main application component
├── types.ts              # TypeScript type definitions
├── index.tsx             # Application entry point
├── index.html            # HTML template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite configuration
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
