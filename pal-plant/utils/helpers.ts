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

import { Friend, ThemeId, ThemeColors, MeetingRequest, ContactLog, MeetingTimeframe, ContactChannel, CHANNEL_SCORE_BONUS } from '../types';
import { calculateDailyWilt as _calculateDailyWilt } from './scoring';
import { Sprout, Flower, Trees, Leaf, Skull } from 'lucide-react';
import React from 'react';
import { TIMER_BUFFER_MULTIPLIER } from './scoring';

// ─── Avatar Helpers ───────────────────────────────────────────────

export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 55%)`;
};

// ─── Input Validation ─────────────────────────────────────────────

export const sanitizeText = (text: string, maxLength: number = 200): string => {
  return text.trim().slice(0, maxLength);
};

export const sanitizePhone = (phone: string): string => {
  return phone.replace(/[^0-9+\-() .ext]/gi, '').trim().slice(0, 30);
};

export const isValidEmail = (email: string): boolean => {
  if (!email) return true; // empty is OK (optional)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ─── ICS Calendar ─────────────────────────────────────────────────

/**
 * Generate an ICS calendar event for a meeting
 */
export const generateICSEvent = (meeting: MeetingRequest): string => {
  if (!meeting.scheduledDate) return '';

  const startDate = new Date(meeting.scheduledDate);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

  const formatDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const uid = `${meeting.id}@palplant`;
  const dtstamp = formatDate(new Date());
  const dtstart = formatDate(startDate);
  const dtend = formatDate(endDate);

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pal Plant//Meeting//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:Meeting with ${meeting.name}`,
    `DESCRIPTION:${meeting.notes || 'Meeting scheduled via Pal Plant'}`,
    `LOCATION:${meeting.location || 'TBD'}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icsContent;
};

/**
 * Download an ICS file for a meeting
 */
export const downloadCalendarEvent = (meeting: MeetingRequest): void => {
  const icsContent = generateICSEvent(meeting);
  if (!icsContent) return;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meeting_${meeting.name.replace(/\s+/g, '_')}_${new Date(meeting.scheduledDate!).toISOString().split('T')[0]}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const getGoogleCalendarUrl = (meeting: MeetingRequest): string => {
  if (!meeting.scheduledDate) return '';

  const startDate = new Date(meeting.scheduledDate);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Meeting with ${meeting.name}`,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: meeting.notes || 'Meeting scheduled via Pal Plant',
    location: meeting.location || 'TBD'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// ─── Streaks ──────────────────────────────────────────────────────

/**
 * Calculate streak data - consecutive days with at least one interaction
 */
export const calculateStreaks = (friends: Friend[]): { currentStreak: number; longestStreak: number; streakDates: string[] } => {
  // Collect all interaction dates
  const allDates = new Set<string>();

  friends.forEach(f => {
    f.logs.forEach(log => {
      const date = new Date(log.date).toISOString().split('T')[0];
      allDates.add(date);
    });
  });

  if (allDates.size === 0) {
    return { currentStreak: 0, longestStreak: 0, streakDates: [] };
  }

  // Sort dates
  const sortedDates = Array.from(allDates).sort();

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  const streakDates: string[] = [];

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / 86400000);

    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Check if current streak is still active (last interaction was today or yesterday)
  const lastDate = sortedDates[sortedDates.length - 1];
  if (lastDate === today || lastDate === yesterday) {
    // Count backwards from today
    let checkDate = lastDate === today ? today : yesterday;
    let streak = 0;

    for (let i = sortedDates.length - 1; i >= 0; i--) {
      if (sortedDates[i] === checkDate) {
        streak++;
        streakDates.unshift(sortedDates[i]);
        const prevDay = new Date(new Date(checkDate).getTime() - 86400000).toISOString().split('T')[0];
        checkDate = prevDay;
      } else if (new Date(sortedDates[i]) < new Date(checkDate)) {
        break;
      }
    }
    currentStreak = streak;
  }

  return { currentStreak, longestStreak, streakDates };
};

// ─── CSV Parsing ──────────────────────────────────────────────────

/**
 * Parse a single CSV line respecting quoted fields
 */
const parseCSVLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  values.push(current.trim());
  return values;
};

/**
 * Parse CSV contacts data
 */
export const parseCSVContacts = (csvContent: string): Array<{ name: string; phone?: string; email?: string; category?: string }> => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/"/g, ''));
  const nameIndex = headers.findIndex(h => h === 'name' || h === 'full name' || h === 'fullname');
  const phoneIndex = headers.findIndex(h => h === 'phone' || h === 'mobile' || h === 'telephone');
  const emailIndex = headers.findIndex(h => h === 'email' || h === 'e-mail');
  const categoryIndex = headers.findIndex(h => h === 'category' || h === 'group' || h === 'type');

  if (nameIndex === -1) return [];

  const contacts: Array<{ name: string; phone?: string; email?: string; category?: string }> = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const name = sanitizeText(values[nameIndex] || '', 100);
    if (!name) continue;

    contacts.push({
      name,
      phone: phoneIndex !== -1 ? sanitizePhone(values[phoneIndex] || '') : undefined,
      email: emailIndex !== -1 ? sanitizeText(values[emailIndex] || '', 254) : undefined,
      category: categoryIndex !== -1 ? sanitizeText(values[categoryIndex] || '', 50) : undefined
    });
  }

  return contacts;
};

// ─── Duplicate Detection ──────────────────────────────────────────

/**
 * Detect duplicate contacts based on name similarity
 */
export const detectDuplicates = (
  newContacts: Array<{ name: string; phone?: string; email?: string }>,
  existingFriends: Friend[]
): Array<{ newContact: { name: string; phone?: string; email?: string }; existingFriend: Friend; similarity: number }> => {
  const duplicates: Array<{ newContact: { name: string; phone?: string; email?: string }; existingFriend: Friend; similarity: number }> = [];

  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

  newContacts.forEach(newContact => {
    const normalizedNew = normalize(newContact.name);

    existingFriends.forEach(existing => {
      const normalizedExisting = normalize(existing.name);

      // Check for exact match
      if (normalizedNew === normalizedExisting) {
        duplicates.push({ newContact, existingFriend: existing, similarity: 100 });
        return;
      }

      // Check for partial match (one contains the other)
      if (normalizedNew.includes(normalizedExisting) || normalizedExisting.includes(normalizedNew)) {
        duplicates.push({ newContact, existingFriend: existing, similarity: 80 });
        return;
      }

      // Check by email match
      if (newContact.email && existing.email && newContact.email.toLowerCase() === existing.email.toLowerCase()) {
        duplicates.push({ newContact, existingFriend: existing, similarity: 95 });
        return;
      }

      // Check by phone match
      if (newContact.phone && existing.phone) {
        const normalizedNewPhone = newContact.phone.replace(/\D/g, '');
        const normalizedExistingPhone = existing.phone.replace(/\D/g, '');
        if (normalizedNewPhone.length >= 7 && normalizedExistingPhone.length >= 7 &&
            (normalizedNewPhone.includes(normalizedExistingPhone) || normalizedExistingPhone.includes(normalizedNewPhone))) {
          duplicates.push({ newContact, existingFriend: existing, similarity: 90 });
        }
      }
    });
  });

  return duplicates;
};

// ─── Core Utilities ───────────────────────────────────────────────

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const fileToBase64 = async (file: File): Promise<string> => {
  // Use compression for images to reduce storage footprint
  const { compressImage, isImageFile } = await import('./imageCompression');
  
  if (isImageFile(file)) {
    return compressImage(file);
  }
  
  // For non-image files, use standard base64 conversion
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Legacy helpers.ts file - Re-exports from domain-specific modules
 * 
 * This file maintains backward compatibility by re-exporting all functions
 * from the new modular structure. All helper functions have been organized
 * into domain-specific modules for better maintainability.
 * 
 * Example: A 10-day timer displays "10 days" to the user, but the system
 * uses 12 days (10 * 1.2) for calculations. The percentageLeft and daysLeft
 * are based on the buffered duration, not the advertised duration.
 */
export const calculateTimeStatus = (lastContacted: string, frequencyDays: number) => {
  const lastDate = new Date(lastContacted);
  const now = new Date();
  
  // Apply 20% buffer: timer runs 20% longer than advertised
  const adjustedFrequencyDays = frequencyDays * TIMER_BUFFER_MULTIPLIER;
  const goalDate = new Date(lastDate.getTime() + adjustedFrequencyDays * 24 * 60 * 60 * 1000);

  const totalDurationMs = goalDate.getTime() - lastDate.getTime();
  const timeRemainingMs = goalDate.getTime() - now.getTime();

  // Percentage of the "battery" left (based on actual buffered duration, not advertised)
  let percentageLeft = (timeRemainingMs / totalDurationMs) * 100;

  // Days left (based on actual buffered duration)
  // Note: UI may show advertised duration, but expiration uses adjusted duration
  const daysLeft = Math.ceil(timeRemainingMs / (1000 * 60 * 60 * 24));

  return {
    percentageLeft,
    daysLeft,
    isOverdue: timeRemainingMs < 0,
    goalDate
  };
};

// ─── Stats ────────────────────────────────────────────────────────

/**
 * Group friends by category and calculate category-specific stats
 */
export const getCohortStats = (friends: Friend[]): Record<string, {
  count: number;
  avgScore: number;
  totalInteractions: number;
  overdueCount: number;
}> => {
  const cohorts: Record<string, { count: number; totalScore: number; totalInteractions: number; overdueCount: number }> = {};

  friends.forEach(f => {
    if (!cohorts[f.category]) {
      cohorts[f.category] = { count: 0, totalScore: 0, totalInteractions: 0, overdueCount: 0 };
    }
    cohorts[f.category].count++;
    cohorts[f.category].totalScore += f.individualScore || 50;
    cohorts[f.category].totalInteractions += f.logs.length;

    const status = calculateTimeStatus(f.lastContacted, f.frequencyDays);
    if (status.isOverdue) {
      cohorts[f.category].overdueCount++;
    }
  });

  const result: Record<string, { count: number; avgScore: number; totalInteractions: number; overdueCount: number }> = {};

  Object.entries(cohorts).forEach(([category, data]) => {
    result[category] = {
      count: data.count,
      avgScore: Math.round(data.totalScore / data.count),
      totalInteractions: data.totalInteractions,
      overdueCount: data.overdueCount
    };
  });

  return result;
};

// ─── Visual Helpers ───────────────────────────────────────────────

export const getStatusColor = (percentage: number): string => {
  if (percentage <= 0) return 'text-red-600 bg-red-100 border-red-200'; // Overdue
  if (percentage < 25) return 'text-orange-600 bg-orange-100 border-orange-200'; // Urgent
  if (percentage < 50) return 'text-yellow-600 bg-yellow-100 border-yellow-200'; // Warning
  return 'text-emerald-600 bg-emerald-100 border-emerald-200'; // Good
};

export const getProgressBarColor = (percentage: number): string => {
  if (percentage <= 0) return 'bg-red-500';
  if (percentage < 25) return 'bg-orange-500';
  if (percentage < 50) return 'bg-yellow-500';
  return 'bg-emerald-500';
};

// Returns a component and label based on percentage
export const getPlantStage = (percentage: number) => {
  if (percentage >= 80) return { icon: Flower, label: 'Thriving', color: 'text-pink-500', bg: 'bg-pink-100' };
  if (percentage >= 50) return { icon: Trees, label: 'Growing', color: 'text-emerald-600', bg: 'bg-emerald-100' };
  if (percentage >= 25) return { icon: Sprout, label: 'Sprouting', color: 'text-lime-600', bg: 'bg-lime-100' };
  if (percentage > 0) return { icon: Leaf, label: 'Wilting', color: 'text-yellow-600', bg: 'bg-yellow-100' };
  return { icon: Skull, label: 'Withered', color: 'text-stone-500', bg: 'bg-stone-100' };
};

// Meeting Urgency Logic: Green -> Red over 14 days (with 20% buffer = 16.8 days actual)
export const getMeetingUrgency = (dateAdded: string) => {
  const start = new Date(dateAdded).getTime();
  const now = new Date().getTime();
  const daysPassed = (now - start) / (1000 * 60 * 60 * 24);
  
  // Apply 20% buffer: meeting requests are considered stale after 16.8 days, not 14
  const maxDays = 14 * TIMER_BUFFER_MULTIPLIER;

  const ratio = Math.min(daysPassed / maxDays, 1);

  const hue = 150 - (ratio * 150);
  const color = `hsl(${hue}, 70%, 50%)`;

  return {
    daysPassed: Math.floor(daysPassed),
    ratio,
    color
  };
};

// ─── Scoring ──────────────────────────────────────────────────────

/**
 * Calculates the score for a single interaction event based on channel and timing.
 */
export const calculateInteractionScore = (
  channel: ContactChannel,
  percentageRemaining: number,
  daysOverdue: number
): number => {
  const baseBonus = CHANNEL_SCORE_BONUS[channel];

  if (daysOverdue > 0) {
    return Math.max(-20, -3 * daysOverdue);
  }

  if (percentageRemaining > 80) {
    return Math.round(-0.3 * baseBonus) || -1;
  }

  if (percentageRemaining <= 50) {
    return baseBonus;
  }

  return Math.round(0.7 * baseBonus);
};

/**
 * Three-Tier Time-Weighted scoring model for individual friends.
 * Tier 1 (Momentum): 0–30 days = 25%, Tier 2 (Consistency): 31–89 days = 40%,
 * Tier 3 (Foundation): 90–730 days = 35%. Interactions > 2 years fall off.
 */
export const calculateIndividualFriendScore = (logs: ContactLog[]): number => {
  const now = new Date();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  let tier1Score = 50;
  let tier2Score = 50;
  let tier3Score = 50;

  logs.forEach(log => {
    const logDate = new Date(log.date);
    const ageInDays = (now.getTime() - logDate.getTime()) / MS_PER_DAY;
    if (ageInDays > 730) return;

    const delta = log.scoreDelta || 0;
    if (ageInDays <= 30) {
      tier1Score += delta;
    } else if (ageInDays <= 89) {
      tier2Score += delta;
    } else {
      tier3Score += delta;
    }
  });

  tier1Score = Math.max(0, Math.min(100, tier1Score));
  tier2Score = Math.max(0, Math.min(100, tier2Score));
  tier3Score = Math.max(0, Math.min(100, tier3Score));

  const weightedScore = (tier1Score * 0.25) + (tier2Score * 0.40) + (tier3Score * 0.35);
  return Math.max(0, Math.min(100, Math.round(weightedScore)));
};

/**
 * Global Score: frequency-weighted average with meeting boosts (time decay + group scaling).
 * S_garden = sum(S_friend * 1/Frequency) / sum(1/Frequency)
 */
export const calculateSocialGardenScore = (friends: Friend[], meetings: MeetingRequest[]): number => {
  if (friends.length === 0) return 0;

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  // 1. Frequency-weighted average
  let weightedScoreSum = 0;
  let weightSum = 0;

  friends.forEach(f => {
    const wiltPenalty = _calculateDailyWilt(f.lastContacted, f.frequencyDays);
    const effectiveScore = Math.max(0, Math.min(100, f.individualScore + wiltPenalty));
    const freqWeight = 1 / Math.max(1, f.frequencyDays);
    weightedScoreSum += effectiveScore * freqWeight;
    weightSum += freqWeight;
  });

  const weightedAvg = weightSum > 0 ? weightedScoreSum / weightSum : 0;

  // 2. Meeting Boosts with time decay and group scaling
  let meetingBoost = 0;

  meetings.forEach(m => {
    if (m.status === 'COMPLETE' && m.verified) {
      const completedDate = new Date(m.scheduledDate || m.dateAdded);
      const ageInDays = (Date.now() - completedDate.getTime()) / MS_PER_DAY;

      let decayMultiplier = 0;
      if (ageInDays <= 30) {
        decayMultiplier = 1.0;
      } else if (ageInDays <= 90) {
        decayMultiplier = 0.5;
      }

      if (decayMultiplier > 0) {
        const baseBoost = 5;
        const linkedCount = m.linkedIds ? m.linkedIds.length : (m.linkedFriendId ? 1 : 1);
        const groupScaling = Math.sqrt(Math.max(1, linkedCount));
        meetingBoost += baseBoost * decayMultiplier * groupScaling;
      }
    } else if (m.status === 'REQUESTED') {
      const urgency = getMeetingUrgency(m.dateAdded);
      if (urgency.daysPassed > (14 * TIMER_BUFFER_MULTIPLIER)) {
        meetingBoost -= 2;
      }
    }
  });

  const normalizedBoost = meetingBoost / Math.max(1, friends.length);
  return Math.round(Math.max(0, Math.min(100, weightedAvg + normalizedBoost)));
};

export const getUpcomingBirthdays = (friends: Friend[]) => {
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(today.getDate() + 30);

  return friends.filter(f => {
    if (!f.birthday) return false;
    const [m, d] = f.birthday.split('-').map(Number);

    // Create date object for this year
    const bdayThisYear = new Date(today.getFullYear(), m - 1, d);

    // Check if it's in the next 30 days
    // Handle year wrapping (e.g. Dec to Jan)
    let bdayNext = bdayThisYear;
    if (bdayThisYear < today) {
       bdayNext = new Date(today.getFullYear() + 1, m - 1, d);
    }

    const diffTime = bdayNext.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= 0 && diffDays <= 30;
  }).sort((a, b) => {
     const [m1, d1] = a.birthday!.split('-').map(Number);
     const [m2, d2] = b.birthday!.split('-').map(Number);
     const getDaysUntil = (m: number, d: number) => {
       let bday = new Date(today.getFullYear(), m - 1, d);
       if (bday < today) bday = new Date(today.getFullYear() + 1, m - 1, d);
       return bday.getTime() - today.getTime();
     };
     return getDaysUntil(m1, d1) - getDaysUntil(m2, d2);
  });
};

// ─── Smart Nudges ─────────────────────────────────────────────────

export interface SmartNudge {
  friendId: string;
  friendName: string;
  type: 'shorten' | 'extend';
  currentDays: number;
  suggestedDays: number;
  reason: string;
}

/**
 * Dynamic Frequency Calibration: 3/5 threshold with 2-365 day soft limits.
 * - "Slow Down": 3/5 too early (>80% timer left) → shorter cadence
 * - "Grace": 3/5 overdue → longer cadence
 */
export const getSmartNudges = (friends: Friend[]): SmartNudge[] => {
  const nudges: SmartNudge[] = [];

  friends.forEach(f => {
    const recentLogs = f.logs.slice(0, 5);
    if (recentLogs.length < 3) return;

    const earlyCount = recentLogs.filter(l => l.percentageRemaining > 80).length;
    const overdueCount = recentLogs.filter(l => l.percentageRemaining < 0).length;

    if (earlyCount >= 3 && f.frequencyDays > 2) {
      const suggested = Math.max(2, Math.round(f.frequencyDays * 0.6));
      if (suggested < f.frequencyDays) {
        nudges.push({
          friendId: f.id,
          friendName: f.name,
          type: 'shorten',
          currentDays: f.frequencyDays,
          suggestedDays: suggested,
          reason: `You consistently reach out early. A ${suggested}-day cadence may fit better.`
        });
      }
    }

    if (overdueCount >= 3 && f.frequencyDays < 365) {
      const suggested = Math.min(365, Math.round(f.frequencyDays * 1.5));
      if (suggested > f.frequencyDays) {
        nudges.push({
          friendId: f.id,
          friendName: f.name,
          type: 'extend',
          currentDays: f.frequencyDays,
          suggestedDays: suggested,
          reason: `This cadence seems hard to maintain. Try ${suggested} days for a more realistic rhythm.`
        });
      }
    }
  });

  return nudges;
};

// ─── Themes ───────────────────────────────────────────────────────

export const THEMES: Record<ThemeId, ThemeColors> = {
  plant: {
    bg: 'bg-[#f4f7f4]', cardBg: 'bg-white', textMain: 'text-[#2c3e2e]', textSub: 'text-[#6b7c6d]',
    primary: 'bg-[#4a674e]', primaryText: 'text-white', accent: 'bg-[#8fb394]', border: 'border-[#e0e8e0]'
  },
  midnight: {
    bg: 'bg-slate-900', cardBg: 'bg-slate-800', textMain: 'text-white', textSub: 'text-slate-400',
    primary: 'bg-blue-600', primaryText: 'text-white', accent: 'bg-pink-500', border: 'border-slate-700'
  },
  forest: {
    bg: 'bg-stone-100', cardBg: 'bg-white', textMain: 'text-stone-800', textSub: 'text-stone-500',
    primary: 'bg-emerald-800', primaryText: 'text-emerald-50', accent: 'bg-lime-600', border: 'border-stone-200'
  },
  ocean: {
    bg: 'bg-sky-50', cardBg: 'bg-white', textMain: 'text-sky-950', textSub: 'text-sky-500',
    primary: 'bg-sky-600', primaryText: 'text-white', accent: 'bg-cyan-400', border: 'border-sky-100'
  },
  sunset: {
    bg: 'bg-orange-50', cardBg: 'bg-white', textMain: 'text-orange-950', textSub: 'text-orange-600',
    primary: 'bg-orange-600', primaryText: 'text-white', accent: 'bg-yellow-400', border: 'border-orange-200'
  },
  berry: {
    bg: 'bg-fuchsia-50', cardBg: 'bg-white', textMain: 'text-fuchsia-950', textSub: 'text-fuchsia-600',
    primary: 'bg-fuchsia-700', primaryText: 'text-white', accent: 'bg-pink-500', border: 'border-fuchsia-200'
  }
};
