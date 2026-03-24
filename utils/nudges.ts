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
 * Dynamic Frequency Calibration: monitors the last 5 interactions to
 * ensure social goals are realistic.
 *
 * - "Slow Down" Nudge: If 3/5 interactions are "Too Early" (>80% timer left),
 *   suggest shortening the timer.
 * - "Grace" Nudge: If 3/5 interactions are "Overdue", suggest extending the timer.
 * - Soft Limits: Never suggests shorter than 2 days or longer than 365 days.
 *
 * @param friends - Array of friends with interaction history
 * @returns Array of smart nudge suggestions
 */
export const getSmartNudges = (friends: Friend[]): SmartNudge[] => {
  const nudges: SmartNudge[] = [];

  friends.forEach(f => {
    const recentLogs = f.logs.slice(0, 5);
    if (recentLogs.length < 3) return;

    const earlyCount = recentLogs.filter(l => l.percentageRemaining > 80).length;
    const overdueCount = recentLogs.filter(l => l.percentageRemaining < 0).length;

    // "Slow Down" Nudge: 3/5 too early → suggest shorter cadence
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

    // "Grace" Nudge: 3/5 overdue → suggest longer cadence
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
