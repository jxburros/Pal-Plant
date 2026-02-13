import { ContactLog, Friend } from '../types';
import { calculateInteractionScore, calculateIndividualFriendScore, calculateTimeStatus, generateId } from './helpers';

export interface ContactActionResult {
  friend: Friend;
  cadenceShortened: boolean;
}

export const processContactAction = (
  friend: Friend,
  type: 'REGULAR' | 'DEEP' | 'QUICK',
  now: Date = new Date()
): ContactActionResult => {
  const { percentageLeft, daysLeft } = calculateTimeStatus(friend.lastContacted, friend.frequencyDays);

  if (type === 'QUICK') {
    if ((friend.quickTouchesAvailable || 0) <= 0) {
      return { friend, cadenceShortened: false };
    }

    const newLastContacted = new Date(new Date(friend.lastContacted).getTime() + (30 * 60 * 1000)).toISOString();
    const updated: Friend = {
      ...friend,
      lastContacted: newLastContacted,
      quickTouchesAvailable: friend.quickTouchesAvailable - 1,
      logs: [{
        id: generateId(),
        date: now.toISOString(),
        type: 'QUICK',
        daysWaitGoal: friend.frequencyDays,
        percentageRemaining: percentageLeft,
        scoreDelta: 2
      }, ...friend.logs],
      individualScore: Math.min(100, (friend.individualScore || 50) + 2)
    };

    return { friend: updated, cadenceShortened: false };
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
  if (newCycles >= 2) {
    newTokens = 1;
    newCycles = 0;
  }

  return {
    cadenceShortened,
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
