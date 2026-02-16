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
