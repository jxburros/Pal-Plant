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

import { ActionFeedback, ContactChannel, ContactLog, Friend } from '../types';
import { calculateInteractionScore, calculateIndividualFriendScore, calculateTimeStatus, generateId } from './helpers';

export interface ContactActionResult {
  friend: Friend;
  cadenceShortened: boolean;
  feedback: ActionFeedback;
}

export const processContactAction = (
  friend: Friend,
  type: 'REGULAR' | 'DEEP' | 'QUICK',
  now: Date = new Date(),
  channel?: ContactChannel
): ContactActionResult => {
  const { percentageLeft, daysLeft } = calculateTimeStatus(friend.lastContacted, friend.frequencyDays);

  if (type === 'QUICK') {
    if ((friend.quickTouchesAvailable || 0) <= 0) {
      return {
        friend,
        cadenceShortened: false,
        feedback: {
          type: 'QUICK',
          scoreDelta: 0,
          newScore: friend.individualScore,
          cadenceShortened: false,
          timerEffect: 'No tokens available',
          tokenChange: 0,
          tokensAvailable: 0,
          timestamp: now.getTime()
        }
      };
    }

    // Calculate 8% of the timer's full length
    const extensionMs = friend.frequencyDays * 0.08 * 24 * 60 * 60 * 1000;
    const newLastContacted = new Date(new Date(friend.lastContacted).getTime() + extensionMs).toISOString();
    const newTokens = friend.quickTouchesAvailable - 1;
    const newScore = Math.min(100, (friend.individualScore || 50) + 2);
    const updated: Friend = {
      ...friend,
      lastContacted: newLastContacted,
      quickTouchesAvailable: newTokens,
      logs: [{
        id: generateId(),
        date: now.toISOString(),
        type: 'QUICK',
        channel,
        daysWaitGoal: friend.frequencyDays,
        percentageRemaining: percentageLeft,
        scoreDelta: 2
      }, ...friend.logs],
      individualScore: newScore
    };

    // Format the extension time for display
    const extensionHours = Math.round((extensionMs / (60 * 60 * 1000)) * 10) / 10;
    const timerEffectText = extensionHours >= 24 
      ? `+${Math.round(extensionHours / 24 * 10) / 10}d`
      : extensionHours >= 1
        ? `+${extensionHours}h`
        : `+${Math.round(extensionMs / (60 * 1000))}min`;

    return {
      friend: updated,
      cadenceShortened: false,
      feedback: {
        type: 'QUICK',
        scoreDelta: 2,
        newScore,
        cadenceShortened: false,
        timerEffect: timerEffectText,
        tokenChange: -1,
        tokensAvailable: newTokens,
        timestamp: now.getTime()
      }
    };
  }

  let updatedFrequencyDays = friend.frequencyDays;
  let cadenceShortened = false;
  if (type === 'REGULAR' && percentageLeft > 80) {
    const lastLog = friend.logs[0];
    if (lastLog && lastLog.percentageRemaining > 80) {
      updatedFrequencyDays = Math.max(1, Math.floor(friend.frequencyDays / 2));
      cadenceShortened = updatedFrequencyDays !== friend.frequencyDays;
    }
  }

  const daysOverdue = daysLeft < 0 ? Math.abs(daysLeft) : 0;
  const scoreChange = calculateInteractionScore(type, percentageLeft, daysOverdue);

  const newLogs: ContactLog[] = [{
    id: generateId(),
    date: now.toISOString(),
    type,
    channel,
    daysWaitGoal: updatedFrequencyDays,
    percentageRemaining: percentageLeft,
    scoreDelta: scoreChange
  }, ...friend.logs];

  const newScore = calculateIndividualFriendScore(newLogs);

  let newLastDeep = friend.lastDeepConnection;
  let extraWaitTime = 0;

  if (type === 'DEEP') {
    newLastDeep = now.toISOString();
    extraWaitTime = 12 * 60 * 60 * 1000;
  }

  let newCycles = (friend.cyclesSinceLastQuickTouch || 0) + 1;
  let newTokens = (friend.quickTouchesAvailable || 0);
  const oldTokens = newTokens;
  if (newCycles >= 2) {
    newTokens = 1;
    newCycles = 0;
  }
  const tokenChange = newTokens - oldTokens;

  // Build timer effect description
  let timerEffect: string;
  if (type === 'DEEP') {
    timerEffect = `reset to ${updatedFrequencyDays}d + 12h`;
  } else {
    timerEffect = `reset to ${updatedFrequencyDays}d`;
  }

  return {
    cadenceShortened,
    feedback: {
      type,
      scoreDelta: scoreChange,
      newScore,
      cadenceShortened,
      oldFrequencyDays: cadenceShortened ? friend.frequencyDays : undefined,
      newFrequencyDays: cadenceShortened ? updatedFrequencyDays : undefined,
      timerEffect,
      tokenChange,
      tokensAvailable: newTokens,
      timestamp: now.getTime()
    },
    friend: {
      ...friend,
      frequencyDays: updatedFrequencyDays,
      lastContacted: new Date(now.getTime() + extraWaitTime).toISOString(),
      logs: newLogs,
      individualScore: newScore,
      lastDeepConnection: newLastDeep,
      cyclesSinceLastQuickTouch: newCycles,
      quickTouchesAvailable: newTokens
    }
  };
};

export const removeFriendLog = (friend: Friend, logId: string): Friend => {
  const updatedLogs = friend.logs.filter(l => l.id !== logId);
  const newScore = calculateIndividualFriendScore(updatedLogs);
  const sortedLogs = [...updatedLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    ...friend,
    logs: updatedLogs,
    lastContacted: sortedLogs.length > 0 ? sortedLogs[0].date : friend.lastContacted,
    individualScore: newScore
  };
};
