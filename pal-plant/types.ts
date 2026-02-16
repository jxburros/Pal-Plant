/*
 * Copyright 2026 Jeffrey Guntly (JX Holdings, LLC)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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

export type MeetingTimeframe = 'ASAP' | 'DAYS' | 'WEEK' | 'MONTH' | 'FLEXIBLE';

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
  
  // Desired timeframe (optional)
  desiredTimeframe?: MeetingTimeframe;

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
  bg: string;
  cardBg: string;
  textMain: string;
  textSub: string;
  primary: string;
  primaryText: string;
  accent: string;
  border: string;
}

export interface Group {
  id: string;
  name: string;
  memberIds: string[]; // Array of Friend.id values
}
