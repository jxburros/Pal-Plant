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

/**
 * Scoring system for interactions, individual friends, and global garden score
 * @module scoring
 */

import { Friend, MeetingRequest, ContactLog } from '../types';
import { Sprout, Flower, Trees, Leaf, Skull } from 'lucide-react';
import React from 'react';

/**
 * Timer buffer multiplier: All timers run 20% longer than advertised.
 * This creates a user-friendly grace period without explicitly advertising it.
 * 
 * Example: A 10-day timer actually expires at 12 days (10 * 1.2)
 */
export const TIMER_BUFFER_MULTIPLIER = 1.2;

/**
 * Calculate the time status for a friend's contact timer
 * Applies a 20% buffer so timers actually last longer than the displayed duration
 * 
 * Example: A 10-day timer displays "10 days" to the user, but the system
 * uses 12 days (10 * 1.2) for calculations. The percentageLeft and daysLeft
 * are based on the buffered duration, not the advertised duration.
 * 
 * @param lastContacted - ISO timestamp of last contact
 * @param frequencyDays - Target contact frequency in days
 * @returns Status object with percentage left, days left, overdue flag, and goal date
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

/**
 * Calculates the score for a single interaction event
 * 
 * Scoring rules:
 * - QUICK touch: +2 points (small bonus)
 * - DEEP connection: +15 points (big bonus)
 * - REGULAR interaction:
 *   - Overdue: -5 points per day (max -30)
 *   - Too early (>80% remaining): -2 points
 *   - Sweet spot (0-50% remaining): +10 points
 *   - Normal (50-80% remaining): +5 points
 * 
 * @param type - Type of interaction (REGULAR, DEEP, or QUICK)
 * @param percentageRemaining - Percentage of time remaining before deadline
 * @param daysOverdue - Number of days past the deadline (0 if not overdue)
 * @returns Score delta for this interaction
 */
export const calculateInteractionScore = (
  type: 'REGULAR' | 'DEEP' | 'QUICK',
  percentageRemaining: number,
  daysOverdue: number
): number => {
  if (type === 'QUICK') return 2; // Small bonus for quick touches
  if (type === 'DEEP') return 15; // Big bonus for deep connections

  // Regular Logic
  if (daysOverdue > 0) {
    // Penalty: -5 points per day overdue, max -30
    return Math.max(-30, -5 * daysOverdue);
  }

  // Too Early Penalty (>80% left)
  if (percentageRemaining > 80) {
    return -2;
  }

  // Sweet Spot (0% to 50% left) -> High points
  if (percentageRemaining <= 50) {
    return 10;
  }

  // Normal (50% to 80% left)
  return 5;
};

/**
 * Recalculates a friend's total individual score based on history
 * Starts at 50 (neutral) and applies all score deltas from logs
 * Result is clamped between 0 and 100
 * 
 * @param logs - Array of contact logs with score deltas
 * @returns Final individual score (0-100)
 */
export const calculateIndividualFriendScore = (logs: ContactLog[]): number => {
  // Start neutral
  let score = 50;

  // We weight recent logs more heavily? For now, flat sum clamped 0-100
  logs.forEach(log => {
    score += (log.scoreDelta || 0);
  });

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculates the global Social Garden Score
 * 
 * Algorithm:
 * 1. Average all individual friend scores
 * 2. Add meeting bonuses/penalties:
 *    - Completed & verified meeting: +5 points
 *    - Requested meeting sitting >14 days (with buffer): -2 points
 * 3. Normalize meeting score by number of friends
 * 4. Clamp final result to 0-100
 * 
 * @param friends - Array of all friends
 * @param meetings - Array of all meeting requests
 * @returns Global score (0-100)
 */
export const calculateSocialGardenScore = (friends: Friend[], meetings: MeetingRequest[]): number => {
  if (friends.length === 0) return 0;

  // 1. Average of Individual Friend Scores
  const totalFriendScore = friends.reduce((acc, f) => acc + f.individualScore, 0);
  const avgFriendScore = totalFriendScore / friends.length;

  // 2. Meeting Bonuses/Penalties
  let meetingScore = 0;

  meetings.forEach(m => {
    if (m.status === 'COMPLETE' && m.verified) {
      meetingScore += 5; // +5 for every completed, verified meeting
    } else if (m.status === 'REQUESTED') {
       // Penalty if sitting in requested too long (> 14 days with 20% buffer = 16.8 days)
       const urgency = getMeetingUrgency(m.dateAdded);
       if (urgency.daysPassed > (14 * TIMER_BUFFER_MULTIPLIER)) {
         meetingScore -= 2;
       }
    }
  });

  // Calculate final
  return Math.round(Math.max(0, Math.min(100, avgFriendScore + (meetingScore / Math.max(1, friends.length)))));
};

/**
 * Get upcoming birthdays within the next 30 days
 * Handles year wrapping (e.g., December to January)
 * 
 * @param friends - Array of friends with optional birthday field (MM-DD format)
 * @returns Sorted array of friends with upcoming birthdays
 */
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

/**
 * Get visual status color classes based on percentage remaining
 * @param percentage - Percentage of time remaining
 * @returns Tailwind CSS classes for text, background, and border
 */
export const getStatusColor = (percentage: number): string => {
  if (percentage <= 0) return 'text-red-600 bg-red-100 border-red-200'; // Overdue
  if (percentage < 25) return 'text-orange-600 bg-orange-100 border-orange-200'; // Urgent
  if (percentage < 50) return 'text-yellow-600 bg-yellow-100 border-yellow-200'; // Warning
  return 'text-emerald-600 bg-emerald-100 border-emerald-200'; // Good
};

/**
 * Get progress bar color based on percentage remaining
 * @param percentage - Percentage of time remaining
 * @returns Tailwind CSS background color class
 */
export const getProgressBarColor = (percentage: number): string => {
  if (percentage <= 0) return 'bg-red-500';
  if (percentage < 25) return 'bg-orange-500';
  if (percentage < 50) return 'bg-yellow-500';
  return 'bg-emerald-500';
};

/**
 * Get plant stage visualization based on relationship health percentage
 * Returns icon component, label, and color classes
 * 
 * @param percentage - Health percentage (0-100)
 * @returns Object with icon, label, color, and background classes
 */
export const getPlantStage = (percentage: number) => {
  if (percentage >= 80) return { icon: Flower, label: 'Thriving', color: 'text-pink-500', bg: 'bg-pink-100' };
  if (percentage >= 50) return { icon: Trees, label: 'Growing', color: 'text-emerald-600', bg: 'bg-emerald-100' };
  if (percentage >= 25) return { icon: Sprout, label: 'Sprouting', color: 'text-lime-600', bg: 'bg-lime-100' };
  if (percentage > 0) return { icon: Leaf, label: 'Wilting', color: 'text-yellow-600', bg: 'bg-yellow-100' };
  return { icon: Skull, label: 'Withered', color: 'text-stone-500', bg: 'bg-stone-100' };
};

/**
 * Calculate meeting request urgency based on how long it's been sitting
 * Meeting requests become "stale" after 14 days (with 20% buffer = 16.8 days)
 * 
 * @param dateAdded - ISO timestamp when meeting was requested
 * @returns Object with days passed, urgency ratio (0-1), and color gradient (green to red)
 */
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
