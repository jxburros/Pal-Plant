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

import { Friend, MeetingRequest, ContactLog, ContactChannel, CHANNEL_SCORE_BONUS } from '../types';
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
 * Calculates the score for a single interaction event based on channel and timing.
 *
 * Each channel has a base bonus (CHANNEL_SCORE_BONUS). Timing applies a multiplier:
 *   - Sweet spot (0-50% remaining): 1.0x  (full bonus)
 *   - On time (50-80% remaining):   0.7x
 *   - Too early (>80% remaining):   -0.3x (small penalty)
 *   - Overdue: -3 per day late (max -20), independent of channel
 *
 * @param channel - Communication channel used
 * @param percentageRemaining - Percentage of time remaining before deadline
 * @param daysOverdue - Number of days past the deadline (0 if not overdue)
 * @returns Score delta for this interaction
 */
export const calculateInteractionScore = (
  channel: ContactChannel,
  percentageRemaining: number,
  daysOverdue: number
): number => {
  const baseBonus = CHANNEL_SCORE_BONUS[channel];

  if (daysOverdue > 0) {
    // Penalty: -3 per day overdue, max -20
    return Math.max(-20, -3 * daysOverdue);
  }

  // Too Early (>80% left) — small penalty regardless of channel
  if (percentageRemaining > 80) {
    return Math.round(-0.3 * baseBonus) || -1;
  }

  // Sweet Spot (0-50% left) — full bonus
  if (percentageRemaining <= 50) {
    return baseBonus;
  }

  // On time (50-80% left) — 70% of bonus
  return Math.round(0.7 * baseBonus);
};

/**
 * Three-Tier Time-Weighted scoring model for individual friends.
 *
 * Tier 1 (Momentum):    0–30 days old  → 25% weight
 * Tier 2 (Consistency): 31–89 days old → 40% weight
 * Tier 3 (Foundation):  90–730 days old → 35% weight
 *
 * Interactions older than 2 years (730 days) fall off entirely.
 * Each tier starts at a neutral baseline of 50 and accumulates deltas.
 * The final score is the weighted average of tier scores, clamped 0-100.
 *
 * @param logs - Array of contact logs with score deltas and dates
 * @returns Final individual score (0-100)
 */
export const calculateIndividualFriendScore = (logs: ContactLog[]): number => {
  const now = new Date();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  let tier1Score = 50; // Momentum: 0-30 days
  let tier2Score = 50; // Consistency: 31-89 days
  let tier3Score = 50; // Foundation: 90-730 days

  let tier1Count = 0;
  let tier2Count = 0;
  let tier3Count = 0;

  logs.forEach(log => {
    const logDate = new Date(log.date);
    const ageInDays = (now.getTime() - logDate.getTime()) / MS_PER_DAY;

    // Interactions older than 2 years fall off
    if (ageInDays > 730) return;

    const delta = log.scoreDelta || 0;

    if (ageInDays <= 30) {
      tier1Score += delta;
      tier1Count++;
    } else if (ageInDays <= 89) {
      tier2Score += delta;
      tier2Count++;
    } else {
      tier3Score += delta;
      tier3Count++;
    }
  });

  // Clamp each tier individually
  tier1Score = Math.max(0, Math.min(100, tier1Score));
  tier2Score = Math.max(0, Math.min(100, tier2Score));
  tier3Score = Math.max(0, Math.min(100, tier3Score));

  // Weighted average: Momentum 25%, Consistency 40%, Foundation 35%
  const weightedScore = (tier1Score * 0.25) + (tier2Score * 0.40) + (tier3Score * 0.35);

  return Math.max(0, Math.min(100, Math.round(weightedScore)));
};

/**
 * Daily Wilt: Once a timer passes its buffered deadline, the plant loses
 * -2 points every 24 hours until contact is made.
 *
 * @param lastContacted - ISO timestamp of last contact
 * @param frequencyDays - Target contact frequency in days
 * @returns Number of wilt points to subtract (always <= 0)
 */
export const calculateDailyWilt = (lastContacted: string, frequencyDays: number): number => {
  const { isOverdue, daysLeft } = calculateTimeStatus(lastContacted, frequencyDays);
  if (!isOverdue) return 0;
  const daysOverdue = Math.abs(daysLeft);
  return -(daysOverdue * 2);
};

/**
 * Check if a friend qualifies for the Resurrection Penalty.
 * If a plant is "Withered" (Score < 10), the first interaction logged
 * provides 50% fewer points.
 *
 * @param currentScore - The friend's current individual score
 * @returns true if resurrection penalty should apply
 */
export const isWitheredForResurrection = (currentScore: number): boolean => {
  return currentScore < 10;
};

/**
 * Check if texting diminishing returns should apply.
 * If the last 5 interactions were all 'text', the next text grants 50% fewer points.
 *
 * @param logs - The friend's contact log history
 * @returns true if diminishing returns apply
 */
export const hasTextingDiminishingReturns = (logs: ContactLog[]): boolean => {
  const recent = logs.slice(0, 5);
  if (recent.length < 5) return false;
  return recent.every(l => l.channel === 'text');
};

/**
 * Calculates the global Social Garden Score using frequency-weighted average.
 *
 * Formula: S_garden = sum(S_friend * 1/Frequency) / sum(1/Frequency)
 *
 * This prioritizes high-maintenance (frequent) relationships in the global score.
 * Meeting boosts are applied with time decay and group scaling.
 *
 * @param friends - Array of all friends
 * @param meetings - Array of all meeting requests
 * @returns Global score (0-100)
 */
export const calculateSocialGardenScore = (friends: Friend[], meetings: MeetingRequest[]): number => {
  if (friends.length === 0) return 0;

  // 1. Frequency-weighted average of Individual Friend Scores
  // S_garden = sum(S_friend * 1/freq) / sum(1/freq)
  let weightedScoreSum = 0;
  let weightSum = 0;

  friends.forEach(f => {
    // Apply daily wilt to each friend's score for the global calculation
    const wiltPenalty = calculateDailyWilt(f.lastContacted, f.frequencyDays);
    const effectiveScore = Math.max(0, Math.min(100, f.individualScore + wiltPenalty));

    const freqWeight = 1 / Math.max(1, f.frequencyDays);
    weightedScoreSum += effectiveScore * freqWeight;
    weightSum += freqWeight;
  });

  const weightedAvg = weightSum > 0 ? weightedScoreSum / weightSum : 0;

  // 2. Meeting Boosts with time decay and group scaling
  let meetingBoost = 0;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  meetings.forEach(m => {
    if (m.status === 'COMPLETE' && m.verified) {
      const completedDate = new Date(m.scheduledDate || m.dateAdded);
      const ageInDays = (Date.now() - completedDate.getTime()) / MS_PER_DAY;

      // Time decay: Full influence 0-30 days, Moderate 31-90 days, none after
      let decayMultiplier = 0;
      if (ageInDays <= 30) {
        decayMultiplier = 1.0; // Full influence
      } else if (ageInDays <= 90) {
        decayMultiplier = 0.5; // Moderate influence
      }

      if (decayMultiplier > 0) {
        const baseBoost = 5;
        // Group scaling: boost * sqrt(friends in meeting)
        const linkedCount = m.linkedIds ? m.linkedIds.length : (m.linkedFriendId ? 1 : 1);
        const groupScaling = Math.sqrt(Math.max(1, linkedCount));
        meetingBoost += baseBoost * decayMultiplier * groupScaling;
      }
    } else if (m.status === 'REQUESTED') {
      // Penalty if sitting in requested too long (> 14 days with 20% buffer = 16.8 days)
      const urgency = getMeetingUrgency(m.dateAdded);
      if (urgency.daysPassed > (14 * TIMER_BUFFER_MULTIPLIER)) {
        meetingBoost -= 2;
      }
    }
  });

  // Normalize meeting boost by friend count
  const normalizedBoost = meetingBoost / Math.max(1, friends.length);

  return Math.round(Math.max(0, Math.min(100, weightedAvg + normalizedBoost)));
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
