import assert from 'node:assert/strict';
import { calculateInteractionScore, calculateIndividualFriendScore, calculateSocialGardenScore, calculateTimeStatus, getPlantStage, calculateStreaks, parseCSVContacts, detectDuplicates, getUpcomingBirthdays, getSmartNudges } from '../utils/helpers';
import { Friend, MeetingRequest, ContactLog } from '../types';
import { processContactAction } from '../utils/friendEngine';

// ─── Test Helpers ────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const test = (name: string, fn: () => void) => {
  try {
    fn();
    passed++;
  } catch (e: any) {
    failed++;
    console.error(`FAIL: ${name}\n  ${e.message}`);
  }
};

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

// ─── Interaction Score Tests ─────────────────────────────────────

test('sweet spot regular should be +10', () => {
  assert.equal(calculateInteractionScore('REGULAR', 40, 0), 10);
});

test('on-time regular (50-80%) should be +5', () => {
  assert.equal(calculateInteractionScore('REGULAR', 65, 0), 5);
});

test('too early regular should be -2', () => {
  assert.equal(calculateInteractionScore('REGULAR', 90, 0), -2);
});

test('overdue regular should penalize by -5/day', () => {
  assert.equal(calculateInteractionScore('REGULAR', -10, 3), -15);
});

test('overdue penalty should clamp at -30', () => {
  assert.equal(calculateInteractionScore('REGULAR', -10, 10), -30);
});

test('DEEP always gives +15', () => {
  assert.equal(calculateInteractionScore('DEEP', 90, 0), 15);
  assert.equal(calculateInteractionScore('DEEP', 10, 5), 15);
});

test('QUICK always gives +2', () => {
  assert.equal(calculateInteractionScore('QUICK', 50, 0), 2);
  assert.equal(calculateInteractionScore('QUICK', 0, 3), 2);
});

// ─── Individual Friend Score Tests ───────────────────────────────

test('friend score starts at 50 with no logs', () => {
  assert.equal(calculateIndividualFriendScore([]), 50);
});

test('friend score accumulates deltas', () => {
  const logs: ContactLog[] = [
    { id: '1', date: '', type: 'REGULAR', daysWaitGoal: 10, percentageRemaining: 40, scoreDelta: 10 },
    { id: '2', date: '', type: 'REGULAR', daysWaitGoal: 10, percentageRemaining: 40, scoreDelta: 10 },
  ];
  assert.equal(calculateIndividualFriendScore(logs), 70);
});

test('friend score is clamped to 0-100', () => {
  const highLogs: ContactLog[] = Array.from({ length: 10 }, (_, i) => ({
    id: String(i), date: '', type: 'DEEP' as const, daysWaitGoal: 10, percentageRemaining: 50, scoreDelta: 15
  }));
  assert.equal(calculateIndividualFriendScore(highLogs), 100);

  const lowLogs: ContactLog[] = Array.from({ length: 20 }, (_, i) => ({
    id: String(i), date: '', type: 'REGULAR' as const, daysWaitGoal: 10, percentageRemaining: -10, scoreDelta: -30
  }));
  assert.equal(calculateIndividualFriendScore(lowLogs), 0);
});

// ─── Quick Touch Token Tests ─────────────────────────────────────

test('quick touch should consume token', () => {
  const result = processContactAction(baseFriend, 'QUICK', new Date());
  assert.equal(result.friend.quickTouchesAvailable, 0);
  assert.equal(result.friend.logs[0].type, 'QUICK');
});

test('quick touch with no tokens returns unchanged friend', () => {
  const noTokenFriend = { ...baseFriend, quickTouchesAvailable: 0 };
  const result = processContactAction(noTokenFriend, 'QUICK', new Date());
  assert.equal(result.friend, noTokenFriend);
});

test('quick touch feedback shows -1 token', () => {
  const result = processContactAction(baseFriend, 'QUICK', new Date());
  assert.equal(result.feedback.tokenChange, -1);
  assert.equal(result.feedback.tokensAvailable, 0);
  assert.equal(result.feedback.scoreDelta, 2);
  assert.equal(result.feedback.timerEffect, '+30 min');
});

test('tokens regenerate after 2 full cycles', () => {
  let friend: Friend = { ...baseFriend, quickTouchesAvailable: 0, cyclesSinceLastQuickTouch: 0 };

  // First regular contact: cycle count goes to 1, no token yet
  const r1 = processContactAction(friend, 'REGULAR', new Date());
  assert.equal(r1.friend.cyclesSinceLastQuickTouch, 1);
  assert.equal(r1.friend.quickTouchesAvailable, 0);

  // Second regular contact: cycle count goes to 2, token granted
  friend = { ...r1.friend, lastContacted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() };
  const r2 = processContactAction(friend, 'REGULAR', new Date());
  assert.equal(r2.friend.cyclesSinceLastQuickTouch, 0);
  assert.equal(r2.friend.quickTouchesAvailable, 1);
  assert.equal(r2.feedback.tokenChange, 1);
});

// ─── Cadence Shortening Tests ────────────────────────────────────

test('repeated early regular should shorten cadence', () => {
  const earlyNow = new Date();
  const frequentFriend: Friend = {
    ...baseFriend,
    lastContacted: new Date(earlyNow.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    logs: [{
      id: 'l1',
      date: new Date(earlyNow.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'REGULAR',
      daysWaitGoal: 10,
      percentageRemaining: 90,
      scoreDelta: -2
    }]
  };
  const result = processContactAction(frequentFriend, 'REGULAR', earlyNow);
  assert.equal(result.cadenceShortened, true);
  assert.equal(result.friend.frequencyDays, 5);
  assert.equal(result.feedback.cadenceShortened, true);
  assert.equal(result.feedback.oldFrequencyDays, 10);
  assert.equal(result.feedback.newFrequencyDays, 5);
});

test('single early contact does not shorten cadence', () => {
  const earlyNow = new Date();
  const earlyFriend: Friend = {
    ...baseFriend,
    lastContacted: new Date(earlyNow.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    logs: []
  };
  const result = processContactAction(earlyFriend, 'REGULAR', earlyNow);
  assert.equal(result.cadenceShortened, false);
  assert.equal(result.friend.frequencyDays, 10);
});

// ─── Deep Connection Tests ───────────────────────────────────────

test('deep contact should set lastDeepConnection', () => {
  const result = processContactAction(baseFriend, 'DEEP', new Date('2025-01-01T00:00:00.000Z'));
  assert.ok(result.friend.lastDeepConnection);
  assert.equal(result.feedback.type, 'DEEP');
  assert.equal(result.feedback.scoreDelta, 15);
});

test('deep contact adds 12h extra to timer', () => {
  const now = new Date('2025-01-01T12:00:00.000Z');
  const result = processContactAction(baseFriend, 'DEEP', now);
  const lastContacted = new Date(result.friend.lastContacted);
  const expected = new Date(now.getTime() + 12 * 60 * 60 * 1000);
  assert.equal(lastContacted.getTime(), expected.getTime());
  assert.ok(result.feedback.timerEffect.includes('12h'));
});

// ─── Feedback Structure Tests ────────────────────────────────────

test('regular contact feedback has correct structure', () => {
  const result = processContactAction(baseFriend, 'REGULAR', new Date());
  const fb = result.feedback;
  assert.equal(fb.type, 'REGULAR');
  assert.equal(typeof fb.scoreDelta, 'number');
  assert.equal(typeof fb.newScore, 'number');
  assert.equal(typeof fb.timerEffect, 'string');
  assert.equal(typeof fb.tokenChange, 'number');
  assert.equal(typeof fb.tokensAvailable, 'number');
  assert.equal(typeof fb.timestamp, 'number');
});

// ─── Time Status Tests ───────────────────────────────────────────

test('calculateTimeStatus with recent contact shows high percentage', () => {
  const recent = new Date().toISOString();
  const status = calculateTimeStatus(recent, 10);
  assert.ok(status.percentageLeft > 90);
  assert.equal(status.isOverdue, false);
});

test('calculateTimeStatus with old contact shows overdue', () => {
  const old = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
  const status = calculateTimeStatus(old, 10);
  assert.ok(status.percentageLeft < 0);
  assert.equal(status.isOverdue, true);
});

// ─── Garden Score Tests ──────────────────────────────────────────

test('empty friends list returns 0 garden score', () => {
  assert.equal(calculateSocialGardenScore([], []), 0);
});

test('garden score averages friend scores', () => {
  const friends: Friend[] = [
    { ...baseFriend, id: '1', individualScore: 80 },
    { ...baseFriend, id: '2', individualScore: 60 },
  ];
  const score = calculateSocialGardenScore(friends, []);
  assert.equal(score, 70);
});

test('verified meetings add +5 to garden score', () => {
  const friends: Friend[] = [{ ...baseFriend, individualScore: 50 }];
  const meetings: MeetingRequest[] = [{
    id: 'm1', name: 'Test', status: 'COMPLETE', dateAdded: '', verified: true
  }];
  const score = calculateSocialGardenScore(friends, meetings);
  assert.equal(score, 55);
});

test('stale requests penalize garden score', () => {
  const friends: Friend[] = [{ ...baseFriend, individualScore: 50 }];
  const meetings: MeetingRequest[] = [{
    id: 'm1', name: 'Test', status: 'REQUESTED',
    dateAdded: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  }];
  const score = calculateSocialGardenScore(friends, meetings);
  assert.equal(score, 48);
});

// ─── Plant Stage Tests ───────────────────────────────────────────

test('plant stages map correctly', () => {
  assert.equal(getPlantStage(85).label, 'Thriving');
  assert.equal(getPlantStage(60).label, 'Growing');
  assert.equal(getPlantStage(30).label, 'Sprouting');
  assert.equal(getPlantStage(10).label, 'Wilting');
  assert.equal(getPlantStage(-5).label, 'Withered');
});

// ─── CSV Parsing Tests ───────────────────────────────────────────

test('parseCSVContacts parses basic CSV', () => {
  const csv = 'Name,Phone,Email\nJohn Doe,555-1234,john@test.com\nJane Doe,555-5678,jane@test.com';
  const contacts = parseCSVContacts(csv);
  assert.equal(contacts.length, 2);
  assert.equal(contacts[0].name, 'John Doe');
  assert.equal(contacts[0].phone, '555-1234');
  assert.equal(contacts[1].email, 'jane@test.com');
});

test('parseCSVContacts handles quoted fields', () => {
  const csv = 'Name,Phone\n"Doe, John",555-1234';
  const contacts = parseCSVContacts(csv);
  assert.equal(contacts.length, 1);
  assert.equal(contacts[0].name, 'Doe, John');
});

test('parseCSVContacts returns empty for missing name column', () => {
  const csv = 'Phone,Email\n555-1234,test@test.com';
  const contacts = parseCSVContacts(csv);
  assert.equal(contacts.length, 0);
});

// ─── Duplicate Detection Tests ───────────────────────────────────

test('detectDuplicates finds exact name matches', () => {
  const newContacts = [{ name: 'John Doe' }];
  const existing = [{ ...baseFriend, name: 'John Doe' }];
  const dupes = detectDuplicates(newContacts, existing);
  assert.equal(dupes.length, 1);
  assert.equal(dupes[0].similarity, 100);
});

test('detectDuplicates finds email matches', () => {
  const newContacts = [{ name: 'Different Name', email: 'same@email.com' }];
  const existing = [{ ...baseFriend, name: 'Original Name', email: 'same@email.com' }];
  const dupes = detectDuplicates(newContacts, existing);
  assert.equal(dupes.length, 1);
  assert.equal(dupes[0].similarity, 95);
});

// ─── Smart Nudge Tests ───────────────────────────────────────────

test('smart nudges recommends shorter cadence for consistently early contacts', () => {
  const earlyFriend: Friend = {
    ...baseFriend,
    frequencyDays: 10,
    logs: [
      { id: '1', date: '', type: 'REGULAR', daysWaitGoal: 10, percentageRemaining: 90, scoreDelta: -2 },
      { id: '2', date: '', type: 'REGULAR', daysWaitGoal: 10, percentageRemaining: 85, scoreDelta: -2 },
      { id: '3', date: '', type: 'REGULAR', daysWaitGoal: 10, percentageRemaining: 92, scoreDelta: -2 },
    ]
  };
  const nudges = getSmartNudges([earlyFriend]);
  assert.equal(nudges.length, 1);
  assert.equal(nudges[0].type, 'shorten');
  assert.ok(nudges[0].suggestedDays < 10);
});

test('smart nudges recommends longer cadence for consistently overdue contacts', () => {
  const overdueFriend: Friend = {
    ...baseFriend,
    frequencyDays: 5,
    logs: [
      { id: '1', date: '', type: 'REGULAR', daysWaitGoal: 5, percentageRemaining: -20, scoreDelta: -10 },
      { id: '2', date: '', type: 'REGULAR', daysWaitGoal: 5, percentageRemaining: -10, scoreDelta: -5 },
      { id: '3', date: '', type: 'REGULAR', daysWaitGoal: 5, percentageRemaining: -30, scoreDelta: -15 },
    ]
  };
  const nudges = getSmartNudges([overdueFriend]);
  assert.equal(nudges.length, 1);
  assert.equal(nudges[0].type, 'extend');
  assert.ok(nudges[0].suggestedDays > 5);
});

test('smart nudges returns nothing for friends with too few logs', () => {
  const newFriend: Friend = {
    ...baseFriend,
    logs: [
      { id: '1', date: '', type: 'REGULAR', daysWaitGoal: 10, percentageRemaining: 90, scoreDelta: -2 },
    ]
  };
  const nudges = getSmartNudges([newFriend]);
  assert.equal(nudges.length, 0);
});

test('smart nudges returns nothing for well-timed contacts', () => {
  const goodFriend: Friend = {
    ...baseFriend,
    logs: [
      { id: '1', date: '', type: 'REGULAR', daysWaitGoal: 10, percentageRemaining: 40, scoreDelta: 10 },
      { id: '2', date: '', type: 'REGULAR', daysWaitGoal: 10, percentageRemaining: 35, scoreDelta: 10 },
      { id: '3', date: '', type: 'REGULAR', daysWaitGoal: 10, percentageRemaining: 45, scoreDelta: 10 },
    ]
  };
  const nudges = getSmartNudges([goodFriend]);
  assert.equal(nudges.length, 0);
});

// ─── Summary ─────────────────────────────────────────────────────

console.log(`\nResults: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) {
  process.exit(1);
}
console.log('All tests passed.');
