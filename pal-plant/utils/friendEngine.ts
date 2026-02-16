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

    const newLastContacted = new Date(new Date(friend.lastContacted).getTime() + (30 * 60 * 1000)).toISOString();
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

    return {
      friend: updated,
      cadenceShortened: false,
      feedback: {
        type: 'QUICK',
        scoreDelta: 2,
        newScore,
        cadenceShortened: false,
        timerEffect: '+30 min',
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
