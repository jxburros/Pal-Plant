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
 * Statistics calculation utilities
 * @module stats
 */

import { Friend } from '../types';
import { calculateTimeStatus } from './scoring';

/**
 * Groups friends by category and calculates category-specific statistics
 * 
 * Provides aggregate metrics for each friend category including:
 * - Number of friends in the category
 * - Average individual score
 * - Total interactions across all friends
 * - Number of overdue friends
 * 
 * @param friends - Array of all friends
 * @returns Record mapping category names to their statistics
 * @example
 * const stats = getCohortStats(friends);
 * // Returns: { "Friends": { count: 10, avgScore: 75, totalInteractions: 45, overdueCount: 2 }, ... }
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
