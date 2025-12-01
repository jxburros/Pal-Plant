export interface ContactLog {
  id: string;
  date: string; // ISO string
  type: 'REGULAR' | 'DEEP' | 'QUICK';
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
  MEETINGS = 'MEETINGS'
}

export type ThemeId = 'plant' | 'midnight' | 'forest' | 'ocean' | 'sunset' | 'berry';

export interface ReminderSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  reminderHoursBefore: number;
  email?: string;
}

export interface CloudSyncSettings {
  enabled: boolean;
  provider?: 'google' | 'custom';
  lastSyncDate?: string;
  syncEmail?: string;
}

export interface AppSettings {
  theme: ThemeId;
  textSize: 'normal' | 'large' | 'xl';
  highContrast: boolean;
  reducedMotion: boolean;
  reminders: ReminderSettings;
  cloudSync: CloudSyncSettings;
  hasSeenOnboarding: boolean;
}

export interface ThemeColors {
  bg: string;
  cardBg: string;
  textMain: string;
  textSub: string;
  primary: string;
  primaryText: string;
  accent: string;
  border: string;
}