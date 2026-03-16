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

import { ActionFeedback, ContactChannel, ContactLog, Friend, CHANNEL_WEIGHTS } from '../types';
import { calculateInteractionScore, calculateIndividualFriendScore, calculateTimeStatus, generateId } from './helpers';
import { isWitheredForResurrection, hasTextingDiminishingReturns } from './scoring';

export interface ContactActionResult {
  friend: Friend;
  cadenceShortened: boolean;
  feedback: ActionFeedback;
}

/**
 * Process a contact action. The channel determines how much timer is restored
 * and the base score bonus. Timing (sweet-spot vs early vs overdue) still
 * matters for the final score delta.
 */
export const processContactAction = (
  friend: Friend,
  channel: ContactChannel,
  now: Date = new Date()
): ContactActionResult => {
  const { percentageLeft, daysLeft } = calculateTimeStatus(friend.lastContacted, friend.frequencyDays);
  const weight = CHANNEL_WEIGHTS[channel];

  // --- Cadence shortening: 2 consecutive contacts with >80% remaining ---
  let updatedFrequencyDays = friend.frequencyDays;
  let cadenceShortened = false;
  if (percentageLeft > 80) {
    const lastLog = friend.logs[0];
    if (lastLog && lastLog.percentageRemaining > 80) {
      updatedFrequencyDays = Math.max(1, Math.floor(friend.frequencyDays / 2));
      cadenceShortened = updatedFrequencyDays !== friend.frequencyDays;
    }
  }

  // --- Score ---
  const daysOverdue = daysLeft < 0 ? Math.abs(daysLeft) : 0;
  let scoreChange = calculateInteractionScore(channel, percentageLeft, daysOverdue);

  // Resurrection Penalty: if plant is "Withered" (score < 10), first interaction
  // provides 50% fewer points
  if (isWitheredForResurrection(friend.individualScore) && scoreChange > 0) {
    scoreChange = Math.round(scoreChange * 0.5);
  }

  // Texting Diminishing Returns: if last 5 interactions were all text and this
  // is also a text, grant 50% fewer points
  if (channel === 'text' && hasTextingDiminishingReturns(friend.logs) && scoreChange > 0) {
    scoreChange = Math.round(scoreChange * 0.5);
  }

  const newLogs: ContactLog[] = [{
    id: generateId(),
    date: now.toISOString(),
    channel,
    daysWaitGoal: updatedFrequencyDays,
    percentageRemaining: percentageLeft,
    scoreDelta: scoreChange
  }, ...friend.logs];

  const newScore = calculateIndividualFriendScore(newLogs);

  // --- Timer reset: weight * frequency ---
  const resetMs = weight * updatedFrequencyDays * 24 * 60 * 60 * 1000;
  const newLastContacted = new Date(now.getTime() - (updatedFrequencyDays * 24 * 60 * 60 * 1000 * 1.2 - resetMs)).toISOString();
  // Simplified: just set lastContacted so that the *effective* timer left = weight * frequency
  // calculateTimeStatus uses (lastContacted + freq*1.2) as the goal.
  // We want timeRemaining = weight * freq * 24h
  // goalDate = lastContacted + freq*1.2*24h
  // timeRemaining = goalDate - now = lastContacted + freq*1.2*24h - now = weight*freq*24h
  // => lastContacted = now - freq*1.2*24h + weight*freq*24h = now - freq*24h*(1.2 - weight)
  const effectiveLastContacted = new Date(now.getTime() - updatedFrequencyDays * 24 * 60 * 60 * 1000 * (1.2 - weight)).toISOString();

  // Timer effect description
  const timerPercent = Math.round(weight * 100 / 1.2); // percentage of the buffered timer
  const effectiveDays = Math.round(weight * updatedFrequencyDays * 10) / 10;
  const timerEffect = `${effectiveDays}d timer (${Math.min(100, Math.round(weight * 100))}% of ${updatedFrequencyDays}d)`;

  return {
    cadenceShortened,
    feedback: {
      channel,
      scoreDelta: scoreChange,
      newScore,
      cadenceShortened,
      oldFrequencyDays: cadenceShortened ? friend.frequencyDays : undefined,
      newFrequencyDays: cadenceShortened ? updatedFrequencyDays : undefined,
      timerEffect,
      timestamp: now.getTime()
    },
    friend: {
      ...friend,
      frequencyDays: updatedFrequencyDays,
      lastContacted: effectiveLastContacted,
      logs: newLogs,
      individualScore: newScore,
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

/**
 * Process a group contact by applying the specified channel to all members
 */
export const processGroupContact = (
  friends: Friend[],
  memberIds: string[],
  channel: ContactChannel,
  now: Date = new Date()
): Friend[] => {
  return friends.map(friend => {
    if (memberIds.includes(friend.id)) {
      const result = processContactAction(friend, channel, now);
      return result.friend;
    }
    return friend;
  });
};
