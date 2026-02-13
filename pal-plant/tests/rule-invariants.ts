import assert from 'node:assert/strict';
import { calculateInteractionScore } from '../utils/helpers';
import { Friend } from '../types';
import { processContactAction } from '../utils/friendEngine';

const baseFriend: Friend = {
  id: 'f1',
  name: 'Test Friend',
  category: 'Friends',
  frequencyDays: 10,
  lastContacted: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
  individualScore: 50,
  quickTouchesAvailable: 1,
  cyclesSinceLastQuickTouch: 0,
  logs: []
};

assert.equal(calculateInteractionScore('REGULAR', 40, 0), 10, 'sweet spot regular should be +10');
assert.equal(calculateInteractionScore('REGULAR', 90, 0), -2, 'too early regular should be -2');
assert.equal(calculateInteractionScore('REGULAR', -10, 3), -15, 'overdue regular should penalize by -5/day');
assert.equal(calculateInteractionScore('REGULAR', -10, 10), -30, 'overdue penalty should clamp at -30');

const quickResult = processContactAction(baseFriend, 'QUICK', new Date());
assert.equal(quickResult.friend.quickTouchesAvailable, 0, 'quick touch should consume token');
assert.equal(quickResult.friend.logs[0].type, 'QUICK', 'quick touch should append quick log');

const earlyNow = new Date();
const frequentFriend: Friend = {
  ...baseFriend,
  lastContacted: new Date(earlyNow.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  logs: [
    {
      id: 'l1',
      date: new Date(earlyNow.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'REGULAR',
      daysWaitGoal: 10,
      percentageRemaining: 90,
      scoreDelta: -2
    }
  ]
};
const frequentResult = processContactAction(frequentFriend, 'REGULAR', earlyNow);
assert.equal(frequentResult.cadenceShortened, true, 'repeated early regular should shorten cadence');
assert.equal(frequentResult.friend.frequencyDays, 5, 'cadence should halve from 10 to 5');

const deepResult = processContactAction(baseFriend, 'DEEP', new Date('2025-01-01T00:00:00.000Z'));
assert.ok(deepResult.friend.lastDeepConnection, 'deep contact should set lastDeepConnection timestamp');

console.log('Rule invariant tests passed.');
