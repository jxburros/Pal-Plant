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
 * Streak calculation utilities for tracking consecutive interaction days
 * @module streaks
 */

import { Friend } from '../types';

/**
 * Calculates streak data - consecutive days with at least one interaction
 * 
 * A "streak" is a sequence of consecutive calendar days where at least one
 * contact interaction was logged. The current streak is considered active
 * if the last interaction was today or yesterday.
 * 
 * @param friends - Array of all friends with their interaction logs
 * @returns Object containing current streak, longest streak ever, and active streak dates
 * @example
 * const { currentStreak, longestStreak, streakDates } = calculateStreaks(friends);
 * // currentStreak: 5 (days in a row with interactions, if still active)
 * // longestStreak: 12 (best streak ever)
 * // streakDates: ['2024-01-01', '2024-01-02', ...] (current streak dates)
 */
export const calculateStreaks = (friends: Friend[]): { 
  currentStreak: number; 
  longestStreak: number; 
  streakDates: string[] 
} => {
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
