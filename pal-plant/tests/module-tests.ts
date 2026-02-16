import assert from 'node:assert/strict';
import { getInitials, getAvatarColor } from '../utils/avatar';
import { sanitizeText, sanitizePhone, isValidEmail } from '../utils/validation';
import { parseCSVContacts } from '../utils/csv';
import { detectDuplicates } from '../utils/duplicates';
import { generateICSEvent } from '../utils/calendar';
import { calculateStreaks } from '../utils/streaks';
import { getSmartNudges } from '../utils/nudges';
import { getCohortStats } from '../utils/stats';
import { generateId, fileToBase64 } from '../utils/core';
import { Friend, MeetingRequest } from '../types';

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

// ─── Avatar Tests ─────────────────────────────────────────────────

test('getInitials: single name returns first letter', () => {
  assert.equal(getInitials('Alice'), 'A');
});

test('getInitials: two names returns first and last initial', () => {
  assert.equal(getInitials('John Doe'), 'JD');
});

test('getInitials: multiple names returns first and last initial', () => {
  assert.equal(getInitials('Mary Jane Watson'), 'MW');
});

test('getInitials: empty or whitespace-only name returns question mark', () => {
  assert.equal(getInitials(''), '?');
  assert.equal(getInitials('  '), '?');
  assert.equal(getInitials('   \t  '), '?');
});

test('getInitials: handles extra whitespace', () => {
  assert.equal(getInitials('  John   Doe  '), 'JD');
});

test('getAvatarColor: returns consistent HSL color', () => {
  const color1 = getAvatarColor('John Doe');
  const color2 = getAvatarColor('John Doe');
  assert.equal(color1, color2);
  assert.ok(color1.startsWith('hsl('));
  assert.ok(color1.includes('55%'));
});

test('getAvatarColor: different names get different colors', () => {
  const color1 = getAvatarColor('Alice');
  const color2 = getAvatarColor('Bob');
  assert.notEqual(color1, color2);
});

// ─── Validation Tests ─────────────────────────────────────────────

test('sanitizeText: trims and limits length', () => {
  assert.equal(sanitizeText('  hello  ', 10), 'hello');
  assert.equal(sanitizeText('a'.repeat(300), 200), 'a'.repeat(200));
});

test('sanitizeText: uses default max length', () => {
  const longText = 'a'.repeat(250);
  const result = sanitizeText(longText);
  assert.equal(result.length, 200);
});

test('sanitizePhone: removes invalid characters', () => {
  assert.equal(sanitizePhone('(555) 123-4567'), '(555) 123-4567');
  assert.equal(sanitizePhone('555-ABC-1234'), '555--1234');
  assert.equal(sanitizePhone('123.456.7890 ext 123'), '123.456.7890 ext 123');
});

test('sanitizePhone: limits to 30 characters', () => {
  const longPhone = '1'.repeat(50);
  assert.equal(sanitizePhone(longPhone).length, 30);
});

test('isValidEmail: validates proper email format', () => {
  assert.ok(isValidEmail('test@example.com'));
  assert.ok(isValidEmail('user+tag@domain.co.uk'));
  assert.ok(isValidEmail(''));  // Empty is valid
});

test('isValidEmail: rejects invalid formats', () => {
  assert.ok(!isValidEmail('notanemail'));
  assert.ok(!isValidEmail('@example.com'));
  assert.ok(!isValidEmail('test@'));
  assert.ok(!isValidEmail('test @example.com'));
});

// ─── CSV Parsing Tests ────────────────────────────────────────────

test('parseCSVContacts: basic parsing', () => {
  const csv = 'name,phone,email\nJohn Doe,555-1234,john@example.com';
  const contacts = parseCSVContacts(csv);
  assert.equal(contacts.length, 1);
  assert.equal(contacts[0].name, 'John Doe');
  assert.equal(contacts[0].phone, '555-1234');
  assert.equal(contacts[0].email, 'john@example.com');
});

test('parseCSVContacts: handles quoted fields with commas', () => {
  const csv = 'name,phone\n"Doe, John",555-1234';
  const contacts = parseCSVContacts(csv);
  assert.equal(contacts.length, 1);
  assert.equal(contacts[0].name, 'Doe, John');
});

test('parseCSVContacts: handles empty lines', () => {
  const csv = 'name\nJohn\n\nJane\n';
  const contacts = parseCSVContacts(csv);
  assert.equal(contacts.length, 2);
});

test('parseCSVContacts: requires name column', () => {
  const csv = 'phone,email\n555-1234,test@example.com';
  const contacts = parseCSVContacts(csv);
  assert.equal(contacts.length, 0);
});

test('parseCSVContacts: handles alternative header names', () => {
  const csv = 'full name,mobile,e-mail,group\nJohn,555-1234,j@test.com,Friends';
  const contacts = parseCSVContacts(csv);
  assert.equal(contacts.length, 1);
  assert.equal(contacts[0].name, 'John');
  assert.equal(contacts[0].phone, '555-1234');
  assert.equal(contacts[0].category, 'Friends');
});

// ─── Duplicate Detection Tests ────────────────────────────────────

test('detectDuplicates: exact name match', () => {
  const newContacts = [{ name: 'John Doe', phone: '', email: '' }];
  const existingFriends: Friend[] = [{
    id: 'f1', name: 'John Doe', category: 'Friends', frequencyDays: 10,
    lastContacted: new Date().toISOString(), individualScore: 50,
    quickTouchesAvailable: 1, cyclesSinceLastQuickTouch: 0, logs: []
  }];
  const duplicates = detectDuplicates(newContacts, existingFriends);
  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0].similarity, 100);
});

test('detectDuplicates: email match', () => {
  const newContacts = [{ name: 'J. Doe', phone: '', email: 'john@example.com' }];
  const existingFriends: Friend[] = [{
    id: 'f1', name: 'John Doe', category: 'Friends', frequencyDays: 10,
    lastContacted: new Date().toISOString(), individualScore: 50,
    quickTouchesAvailable: 1, cyclesSinceLastQuickTouch: 0, logs: [],
    email: 'john@example.com'
  }];
  const duplicates = detectDuplicates(newContacts, existingFriends);
  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0].similarity, 95);
});

test('detectDuplicates: phone match', () => {
  const newContacts = [{ name: 'J. Doe', phone: '555-123-4567', email: '' }];
  const existingFriends: Friend[] = [{
    id: 'f1', name: 'John Doe', category: 'Friends', frequencyDays: 10,
    lastContacted: new Date().toISOString(), individualScore: 50,
    quickTouchesAvailable: 1, cyclesSinceLastQuickTouch: 0, logs: [],
    phone: '(555) 123-4567'
  }];
  const duplicates = detectDuplicates(newContacts, existingFriends);
  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0].similarity, 90);
});

test('detectDuplicates: partial name match', () => {
  const newContacts = [{ name: 'John', phone: '', email: '' }];
  const existingFriends: Friend[] = [{
    id: 'f1', name: 'John Doe', category: 'Friends', frequencyDays: 10,
    lastContacted: new Date().toISOString(), individualScore: 50,
    quickTouchesAvailable: 1, cyclesSinceLastQuickTouch: 0, logs: []
  }];
  const duplicates = detectDuplicates(newContacts, existingFriends);
  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0].similarity, 80);
});

// ─── Calendar Tests ───────────────────────────────────────────────

test('generateICSEvent: creates valid ICS content', () => {
  const meeting: MeetingRequest = {
    id: 'm1',
    name: 'Test Meeting',
    scheduledDate: '2024-06-15T10:00:00.000Z',
    status: 'REQUESTED',
    dateAdded: new Date().toISOString()
  };
  const ics = generateICSEvent(meeting);
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('Meeting with Test Meeting'));
  assert.ok(ics.includes('END:VCALENDAR'));
});

test('generateICSEvent: returns empty for no scheduled date', () => {
  const meeting: MeetingRequest = {
    id: 'm1',
    name: 'Test Meeting',
    status: 'REQUESTED',
    dateAdded: new Date().toISOString()
  };
  const ics = generateICSEvent(meeting);
  assert.equal(ics, '');
});

// ─── Streaks Tests ────────────────────────────────────────────────

test('calculateStreaks: no logs returns zero streaks', () => {
  const friends: Friend[] = [{
    id: 'f1', name: 'Test', category: 'Friends', frequencyDays: 10,
    lastContacted: new Date().toISOString(), individualScore: 50,
    quickTouchesAvailable: 1, cyclesSinceLastQuickTouch: 0, logs: []
  }];
  const streaks = calculateStreaks(friends);
  assert.equal(streaks.currentStreak, 0);
  assert.equal(streaks.longestStreak, 0);
});

test('calculateStreaks: consecutive days create streak', () => {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  const twoDaysAgo = new Date(today.getTime() - 2 * 86400000);
  
  const friends: Friend[] = [{
    id: 'f1', name: 'Test', category: 'Friends', frequencyDays: 10,
    lastContacted: new Date().toISOString(), individualScore: 50,
    quickTouchesAvailable: 1, cyclesSinceLastQuickTouch: 0,
    logs: [
      { id: '1', date: today.toISOString(), type: 'REGULAR', daysWaitGoal: 10, percentageRemaining: 50, scoreDelta: 10 },
      { id: '2', date: yesterday.toISOString(), type: 'REGULAR', daysWaitGoal: 10, percentageRemaining: 50, scoreDelta: 10 },
      { id: '3', date: twoDaysAgo.toISOString(), type: 'REGULAR', daysWaitGoal: 10, percentageRemaining: 50, scoreDelta: 10 }
    ]
  }];
  const streaks = calculateStreaks(friends);
  assert.ok(streaks.currentStreak >= 3);
});

// ─── Smart Nudges Tests ───────────────────────────────────────────

test('getSmartNudges: suggests shorter cadence for early contacts', () => {
  const friend: Friend = {
    id: 'f1', name: 'Early Bird', category: 'Friends', frequencyDays: 10,
    lastContacted: new Date().toISOString(), individualScore: 50,
    quickTouchesAvailable: 1, cyclesSinceLastQuickTouch: 0,
    logs: [
      { id: '1', date: '', type: 'REGULAR', daysWaitGoal: 10, percentageRemaining: 85, scoreDelta: -2 },
      { id: '2', date: '', type: 'REGULAR', daysWaitGoal: 10, percentageRemaining: 90, scoreDelta: -2 },
      { id: '3', date: '', type: 'REGULAR', daysWaitGoal: 10, percentageRemaining: 88, scoreDelta: -2 },
      { id: '4', date: '', type: 'REGULAR', daysWaitGoal: 10, percentageRemaining: 82, scoreDelta: -2 }
    ]
  };
  const nudges = getSmartNudges([friend]);
  assert.equal(nudges.length, 1);
  assert.equal(nudges[0].type, 'shorten');
  assert.ok(nudges[0].suggestedDays < friend.frequencyDays);
});

test('getSmartNudges: suggests longer cadence for overdue contacts', () => {
  const friend: Friend = {
    id: 'f1', name: 'Late Larry', category: 'Friends', frequencyDays: 10,
    lastContacted: new Date().toISOString(), individualScore: 50,
    quickTouchesAvailable: 1, cyclesSinceLastQuickTouch: 0,
    logs: [
      { id: '1', date: '', type: 'REGULAR', daysWaitGoal: 10, percentageRemaining: -5, scoreDelta: -10 },
      { id: '2', date: '', type: 'REGULAR', daysWaitGoal: 10, percentageRemaining: -10, scoreDelta: -15 },
      { id: '3', date: '', type: 'REGULAR', daysWaitGoal: 10, percentageRemaining: -8, scoreDelta: -12 },
      { id: '4', date: '', type: 'REGULAR', daysWaitGoal: 10, percentageRemaining: -3, scoreDelta: -8 }
    ]
  };
  const nudges = getSmartNudges([friend]);
  assert.equal(nudges.length, 1);
  assert.equal(nudges[0].type, 'extend');
  assert.ok(nudges[0].suggestedDays > friend.frequencyDays);
});

test('getSmartNudges: no nudges for friends with few logs', () => {
  const friend: Friend = {
    id: 'f1', name: 'New Friend', category: 'Friends', frequencyDays: 10,
    lastContacted: new Date().toISOString(), individualScore: 50,
    quickTouchesAvailable: 1, cyclesSinceLastQuickTouch: 0,
    logs: [
      { id: '1', date: '', type: 'REGULAR', daysWaitGoal: 10, percentageRemaining: 50, scoreDelta: 10 }
    ]
  };
  const nudges = getSmartNudges([friend]);
  assert.equal(nudges.length, 0);
});

// ─── Stats Tests ──────────────────────────────────────────────────

test('getCohortStats: groups friends by category', () => {
  const friends: Friend[] = [
    {
      id: 'f1', name: 'Friend 1', category: 'Friends', frequencyDays: 10,
      lastContacted: new Date().toISOString(), individualScore: 70,
      quickTouchesAvailable: 1, cyclesSinceLastQuickTouch: 0, logs: [
        { id: '1', date: '', type: 'REGULAR', daysWaitGoal: 10, percentageRemaining: 50, scoreDelta: 10 }
      ]
    },
    {
      id: 'f2', name: 'Friend 2', category: 'Friends', frequencyDays: 10,
      lastContacted: new Date().toISOString(), individualScore: 80,
      quickTouchesAvailable: 1, cyclesSinceLastQuickTouch: 0, logs: []
    },
    {
      id: 'f3', name: 'Business 1', category: 'Business', frequencyDays: 20,
      lastContacted: new Date().toISOString(), individualScore: 60,
      quickTouchesAvailable: 1, cyclesSinceLastQuickTouch: 0, logs: []
    }
  ];
  const stats = getCohortStats(friends);
  assert.equal(stats['Friends'].count, 2);
  assert.equal(stats['Business'].count, 1);
  assert.equal(stats['Friends'].avgScore, 75);
  assert.equal(stats['Friends'].totalInteractions, 1);
});

// ─── Core Utilities Tests ─────────────────────────────────────────

test('generateId: creates unique IDs', () => {
  const id1 = generateId();
  const id2 = generateId();
  assert.notEqual(id1, id2);
  assert.equal(id1.length, 7);
  assert.equal(id2.length, 7);
});

test('generateId: creates alphanumeric IDs', () => {
  const id = generateId();
  assert.ok(/^[a-z0-9]{7}$/.test(id));
});

// ─── Results ──────────────────────────────────────────────────────

console.log(`\nResults: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) {
  console.error('\nSome tests failed.');
  process.exit(1);
} else {
  console.log('All tests passed.');
}
