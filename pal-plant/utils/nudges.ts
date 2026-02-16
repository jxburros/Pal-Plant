/**
 * Smart nudge system for suggesting cadence adjustments
 * @module nudges
 */

import { Friend } from '../types';

export interface SmartNudge {
  friendId: string;
  friendName: string;
  type: 'shorten' | 'extend';
  currentDays: number;
  suggestedDays: number;
  reason: string;
}

/**
 * Analyzes friend interaction patterns and recommends cadence adjustments
 * 
 * Uses the last 5 interactions (minimum 3) to detect patterns:
 * - Consistently early contacts (>80% remaining in 60%+ of interactions):
 *   Suggests shortening cadence by 40%
 * - Consistently overdue contacts (negative remaining in 60%+ of interactions):
 *   Suggests extending cadence by 50%
 * 
 * Constraints:
 * - Minimum cadence: 2 days
 * - Maximum cadence: 90 days
 * - Only suggests changes if they differ from current cadence
 * 
 * @param friends - Array of friends with interaction history
 * @returns Array of smart nudge suggestions
 * @example
 * const nudges = getSmartNudges(friends);
 * // Returns: [{ friendId: "f1", type: "shorten", currentDays: 10, suggestedDays: 6, ... }, ...]
 */
export const getSmartNudges = (friends: Friend[]): SmartNudge[] => {
  const nudges: SmartNudge[] = [];

  friends.forEach(f => {
    const recentLogs = f.logs.slice(0, 5);
    if (recentLogs.length < 3) return;

    const earlyCount = recentLogs.filter(l => l.percentageRemaining > 80).length;
    const overdueCount = recentLogs.filter(l => l.percentageRemaining < 0).length;

    if (earlyCount >= Math.ceil(recentLogs.length * 0.6) && f.frequencyDays > 2) {
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

    if (overdueCount >= Math.ceil(recentLogs.length * 0.6) && f.frequencyDays < 90) {
      const suggested = Math.min(90, Math.round(f.frequencyDays * 1.5));
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
