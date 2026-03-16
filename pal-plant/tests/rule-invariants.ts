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

import assert from 'node:assert/strict';
import { calculateInteractionScore, calculateIndividualFriendScore, calculateSocialGardenScore, calculateTimeStatus, getPlantStage, calculateStreaks, parseCSVContacts, detectDuplicates, getUpcomingBirthdays, getSmartNudges } from '../utils/helpers';
import { Friend, MeetingRequest, ContactLog, CHANNEL_SCORE_BONUS, CHANNEL_WEIGHTS } from '../types';
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
  logs: []
};

// ─── Channel-Based Interaction Score Tests ───────────────────────

test('sweet spot call should give full bonus (+7)', () => {
  assert.equal(calculateInteractionScore('call', 40, 0), CHANNEL_SCORE_BONUS['call']);
});

test('on-time call (50-80%) should give 70% of bonus', () => {
  assert.equal(calculateInteractionScore('call', 65, 0), Math.round(0.7 * CHANNEL_SCORE_BONUS['call']));
});

test('too early call should give negative score', () => {
  const result = calculateInteractionScore('call', 90, 0);
  assert.ok(result < 0, `Expected negative, got ${result}`);
});

test('overdue interaction should penalize by -3/day', () => {
  assert.equal(calculateInteractionScore('call', -10, 3), -9);
});

test('overdue penalty should clamp at -20', () => {
  assert.equal(calculateInteractionScore('call', -10, 10), -20);
});

test('text sweet spot gives +3', () => {
  assert.equal(calculateInteractionScore('text', 40, 0), CHANNEL_SCORE_BONUS['text']);
});

test('in-person sweet spot gives +12', () => {
  assert.equal(calculateInteractionScore('in-person', 40, 0), CHANNEL_SCORE_BONUS['in-person']);
});

test('video sweet spot gives +9', () => {
  assert.equal(calculateInteractionScore('video', 40, 0), CHANNEL_SCORE_BONUS['video']);
});

test('text too early gives small penalty', () => {
  const result = calculateInteractionScore('text', 90, 0);
  assert.ok(result < 0);
});

// ─── Individual Friend Score Tests ───────────────────────────────

test('friend score starts at 50 with no logs', () => {
  assert.equal(calculateIndividualFriendScore([]), 50);
});

test('friend score accumulates deltas', () => {
  const logs: ContactLog[] = [
    { id: '1', date: '', channel: 'call', daysWaitGoal: 10, percentageRemaining: 40, scoreDelta: 7 },
    { id: '2', date: '', channel: 'call', daysWaitGoal: 10, percentageRemaining: 40, scoreDelta: 7 },
  ];
  assert.equal(calculateIndividualFriendScore(logs), 64);
});

test('friend score is clamped to 0-100', () => {
  const highLogs: ContactLog[] = Array.from({ length: 10 }, (_, i) => ({
    id: String(i), date: '', channel: 'in-person' as const, daysWaitGoal: 10, percentageRemaining: 50, scoreDelta: 12
  }));
  assert.equal(calculateIndividualFriendScore(highLogs), 100);

  const lowLogs: ContactLog[] = Array.from({ length: 20 }, (_, i) => ({
    id: String(i), date: '', channel: 'call' as const, daysWaitGoal: 10, percentageRemaining: -10, scoreDelta: -20
  }));
  assert.equal(calculateIndividualFriendScore(lowLogs), 0);
});

// ─── Channel Timer Weight Tests ─────────────────────────────────

test('text channel restores 50% of timer', () => {
  assert.equal(CHANNEL_WEIGHTS['text'], 0.5);
});

test('call channel restores 100% of timer', () => {
  assert.equal(CHANNEL_WEIGHTS['call'], 1.0);
});

test('video channel restores 115% of timer', () => {
  assert.equal(CHANNEL_WEIGHTS['video'], 1.15);
});

test('in-person channel restores 125% of timer', () => {
  assert.equal(CHANNEL_WEIGHTS['in-person'], 1.25);
});

// ─── processContactAction Tests ─────────────────────────────────

test('call contact produces valid feedback', () => {
  const result = processContactAction(baseFriend, 'call', new Date());
  const fb = result.feedback;
  assert.equal(fb.channel, 'call');
  assert.equal(typeof fb.scoreDelta, 'number');
  assert.equal(typeof fb.newScore, 'number');
  assert.equal(typeof fb.timerEffect, 'string');
  assert.equal(typeof fb.timestamp, 'number');
});

test('in-person contact gives higher score than text', () => {
  const inPersonResult = processContactAction(baseFriend, 'in-person', new Date());
  const textResult = processContactAction(baseFriend, 'text', new Date());
  assert.ok(inPersonResult.feedback.scoreDelta >= textResult.feedback.scoreDelta,
    `in-person (${inPersonResult.feedback.scoreDelta}) should be >= text (${textResult.feedback.scoreDelta})`);
});

test('contact logs channel correctly', () => {
  const result = processContactAction(baseFriend, 'video', new Date());
  assert.equal(result.friend.logs[0].channel, 'video');
});

// ─── Cadence Shortening Tests ────────────────────────────────────

test('repeated early contact should shorten cadence', () => {
  const earlyNow = new Date();
  const frequentFriend: Friend = {
    ...baseFriend,
    lastContacted: new Date(earlyNow.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    logs: [{
      id: 'l1',
      date: new Date(earlyNow.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      channel: 'call',
      daysWaitGoal: 10,
      percentageRemaining: 90,
      scoreDelta: -2
    }]
  };
  const result = processContactAction(frequentFriend, 'call', earlyNow);
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
  const result = processContactAction(earlyFriend, 'call', earlyNow);
  assert.equal(result.cadenceShortened, false);
  assert.equal(result.friend.frequencyDays, 10);
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
      { id: '1', date: '', channel: 'call', daysWaitGoal: 10, percentageRemaining: 90, scoreDelta: -2 },
      { id: '2', date: '', channel: 'call', daysWaitGoal: 10, percentageRemaining: 85, scoreDelta: -2 },
      { id: '3', date: '', channel: 'call', daysWaitGoal: 10, percentageRemaining: 92, scoreDelta: -2 },
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
      { id: '1', date: '', channel: 'call', daysWaitGoal: 5, percentageRemaining: -20, scoreDelta: -10 },
      { id: '2', date: '', channel: 'call', daysWaitGoal: 5, percentageRemaining: -10, scoreDelta: -5 },
      { id: '3', date: '', channel: 'call', daysWaitGoal: 5, percentageRemaining: -30, scoreDelta: -15 },
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
      { id: '1', date: '', channel: 'call', daysWaitGoal: 10, percentageRemaining: 90, scoreDelta: -2 },
    ]
  };
  const nudges = getSmartNudges([newFriend]);
  assert.equal(nudges.length, 0);
});

test('smart nudges returns nothing for well-timed contacts', () => {
  const goodFriend: Friend = {
    ...baseFriend,
    logs: [
      { id: '1', date: '', channel: 'call', daysWaitGoal: 10, percentageRemaining: 40, scoreDelta: 7 },
      { id: '2', date: '', channel: 'call', daysWaitGoal: 10, percentageRemaining: 35, scoreDelta: 7 },
      { id: '3', date: '', channel: 'call', daysWaitGoal: 10, percentageRemaining: 45, scoreDelta: 7 },
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
