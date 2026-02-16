export type ContactChannel = 'call' | 'text' | 'video' | 'in-person' | 'other';

export interface ContactLog {
  id: string;
  date: string; // ISO string
  type: 'REGULAR' | 'DEEP' | 'QUICK';
  channel?: ContactChannel; // Communication method used
  daysWaitGoal: number;
  percentageRemaining: number;
  scoreDelta?: number; // How much this interaction changed the score
}

export interface Friend {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  category: string;
  photo?: string;
  notes?: string;
  birthday?: string;
  frequencyDays: number;
  lastContacted: string; // ISO string

  // Scoring & Mechanics
  individualScore: number; // 0 to 100
  lastDeepConnection?: string; // ISO
  quickTouchesAvailable: number; // 1 available per 2 full cycles
  cyclesSinceLastQuickTouch: number;

  logs: ContactLog[];
  avatarSeed?: number;
}

export type MeetingStatus = 'REQUESTED' | 'SCHEDULED' | 'COMPLETE';

export interface MeetingRequest {
  id: string;
  name: string;
  organization?: string;
  phone?: string;
  email?: string;
  photo?: string;
  notes?: string;
  status: MeetingStatus;
  dateAdded: string; // ISO
  category?: 'Friend' | 'Family' | 'Business' | 'Other';

  // For Scheduled status
  scheduledDate?: string; // ISO
  location?: string;

  // Verification
  verified?: boolean; // Has the user confirmed attendance?

  linkedFriendId?: string;
}

export enum Tab {
  HOME = 'HOME',
  LIST = 'LIST',
  STATS = 'STATS',
  MEETINGS = 'MEETINGS'
}

export type ThemeId = 'plant' | 'midnight' | 'forest' | 'ocean' | 'sunset' | 'berry';

export interface ReminderSettings {
  pushEnabled: boolean;
  reminderHoursBefore: number;
  backupReminderEnabled: boolean;
  backupReminderDays: number;
}

export interface AppSettings {
  theme: ThemeId;
  textSize: 'normal' | 'large' | 'xl';
  highContrast: boolean;
  reducedMotion: boolean;
  reminders: ReminderSettings;
  hasSeenOnboarding: boolean;
}

export interface ActionFeedback {
  type: 'REGULAR' | 'DEEP' | 'QUICK';
  scoreDelta: number;
  newScore: number;
  cadenceShortened: boolean;
  oldFrequencyDays?: number;
  newFrequencyDays?: number;
  timerEffect: string; // e.g. "reset to 14 days", "extended by 12 hours", "+30 min"
  tokenChange: number; // -1 if consumed, 0 if unchanged, +1 if earned
  tokensAvailable: number;
  timestamp: number;
}

export interface ThemeColors {
  // Background colors
  bg: string;                    // Main background
  cardBg: string;                // Card/surface background
  surfaceHover: string;          // Hover state for surfaces
  surfaceActive: string;         // Active/pressed state
  
  // Text colors
  textMain: string;              // Primary text
  textSub: string;               // Secondary/muted text
  textDisabled: string;          // Disabled text
  
  // Interactive colors
  primary: string;               // Primary button/action
  primaryText: string;           // Text on primary buttons
  primaryHover: string;          // Primary hover state
  
  // Accent colors
  accent: string;                // Accent color
  accentHover: string;           // Accent hover
  
  // Borders & dividers
  border: string;                // Border color
  borderStrong: string;          // Stronger border for emphasis
  
  // Semantic colors (maintain existing state indicators)
  // Success, warning, error colors remain as inline for consistency
}
