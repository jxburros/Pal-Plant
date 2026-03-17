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

import { Capacitor } from '@capacitor/core';
import { Contacts } from '@capacitor-community/contacts';

export interface DeviceContact {
  name: string;
  phone?: string;
  email?: string;
  birthday?: string; // "MM-DD" format, matches Friend.birthday
}

const isNative = () => Capacitor.isNativePlatform();

/** Shared projection — every call site uses the same fields. */
const CONTACT_PROJECTION = {
  name: true,
  phones: true,
  emails: true,
  birthday: true,
} as const;

/**
 * Module-level lock to prevent concurrent native contact calls.
 * The plugin creates a new ExecutorService per call and resolves on the
 * UI thread — overlapping calls can crash if the bridge Activity is
 * mid-transition (e.g. permission dialog dismissing).
 */
let nativeCallInProgress = false;

/**
 * Pick multiple contacts from the device for bulk import.
 * On native: gets all contacts (user selects in-app via BulkImportModal).
 * On web: falls back to the Contact Picker API (Chrome only).
 */
export const pickContacts = async (): Promise<DeviceContact[]> => {
  if (isNative()) {
    return getAllContactsNative();
  }
  return pickContactsWeb();
};

/**
 * Pick a single contact from the device (for pre-filling a form).
 * On native: opens the native contact picker UI.
 * On web: falls back to the Contact Picker API.
 */
export const pickSingleContact = async (): Promise<DeviceContact | null> => {
  if (isNative()) {
    return pickSingleContactNative();
  }
  const contacts = await pickContactsWebSingle();
  return contacts.length > 0 ? contacts[0] : null;
};

/**
 * Check if device contact picking is available.
 */
export const isContactPickerAvailable = (): boolean => {
  if (isNative()) return true;
  // Check for web Contact Picker API
  const nav = navigator as Navigator & { contacts?: { select?: unknown } };
  return !!nav.contacts?.select;
};

// ─── Native Implementation ──────────────────────────────────────

/**
 * Ensure contacts permission is granted BEFORE calling any plugin data
 * method.  This is critical because the plugin's internal permission
 * flow launches a system Activity; if the host Activity is recreated
 * during that flow the plugin's stale Activity reference can crash the
 * app.  By handling permission entirely through the Capacitor bridge
 * (which survives Activity recreation), then waiting a tick for the
 * native permission cache to settle, we keep the plugin on its safe
 * "permission already granted" code path.
 */
async function ensureContactsPermission(): Promise<void> {
  const check = await Contacts.checkPermissions();
  if (check.contacts === 'granted') return;

  const req = await Contacts.requestPermissions();
  if (req.contacts === 'granted') {
    // Brief pause — lets the native plugin's getPermissionState() cache
    // and the Android ContentProvider sync with the freshly-granted perm.
    await delay(150);
    return;
  }

  // Re-check: on some Android/plugin combos the request result is stale.
  await delay(150);
  const recheck = await Contacts.checkPermissions();
  if (recheck.contacts === 'granted') return;

  throw new Error('PERMISSION_DENIED');
}

/**
 * Get all contacts from the device.
 */
async function getAllContactsNative(): Promise<DeviceContact[]> {
  if (nativeCallInProgress) {
    throw new Error('A contact operation is already in progress.');
  }
  nativeCallInProgress = true;

  try {
    await ensureContactsPermission();

    const result = await Contacts.getContacts({ projection: CONTACT_PROJECTION });

    if (!result.contacts || result.contacts.length === 0) {
      return [];
    }

    return result.contacts
      .map((contact) => ({
        name: contact.name?.display || contact.name?.given || '',
        phone: contact.phones?.[0]?.number || undefined,
        email: contact.emails?.[0]?.address || undefined,
        birthday: formatBirthday(contact.birthday),
      }))
      .filter((c) => c.name.trim() !== '');
  } catch (err: any) {
    if (err?.message === 'PERMISSION_DENIED') throw err;
    if (typeof err?.message === 'string' && err.message.toLowerCase().includes('permission')) {
      throw new Error('PERMISSION_DENIED');
    }
    throw err;
  } finally {
    nativeCallInProgress = false;
  }
}

/**
 * Pick a single contact via the native contact picker intent.
 *
 * Known plugin limitation: if the user taps Back / cancels the picker,
 * the underlying native callback never resolves or rejects the promise.
 * We work around this with a timeout so the UI doesn't hang forever.
 */
async function pickSingleContactNative(): Promise<DeviceContact | null> {
  if (nativeCallInProgress) {
    throw new Error('A contact operation is already in progress.');
  }
  nativeCallInProgress = true;

  const PICKER_TIMEOUT_MS = 120_000; // 2 minutes — generous for slow devices

  try {
    await ensureContactsPermission();

    const result = await withTimeout(
      Contacts.pickContact({ projection: CONTACT_PROJECTION }),
      PICKER_TIMEOUT_MS,
    );

    if (!result.contact) return null;

    const contact = result.contact;
    const name = contact.name?.display || contact.name?.given || '';
    if (!name.trim()) return null;

    return {
      name,
      phone: contact.phones?.[0]?.number || undefined,
      email: contact.emails?.[0]?.address || undefined,
      birthday: formatBirthday(contact.birthday),
    };
  } catch (err: any) {
    if (err?.message === 'TIMEOUT') return null;
    if (err?.message === 'PERMISSION_DENIED') throw err;
    if (typeof err?.message === 'string' && err.message.toLowerCase().includes('permission')) {
      throw new Error('PERMISSION_DENIED');
    }
    throw err;
  } finally {
    nativeCallInProgress = false;
  }
}

// ─── Web Implementation ──────────────────────────────────────────

async function pickContactsWeb(): Promise<DeviceContact[]> {
  const contactPicker = (navigator as Navigator & {
    contacts?: {
      select?: (properties: string[], options?: { multiple?: boolean }) => Promise<Array<Record<string, any>>>;
    };
  }).contacts;

  if (!contactPicker?.select) {
    throw new Error('UNSUPPORTED');
  }

  const selected = await contactPicker.select(['name', 'tel', 'email'], { multiple: true });
  return selected
    .map((entry) => ({
      name: Array.isArray(entry.name) ? String(entry.name[0] || '').trim() : '',
      phone: Array.isArray(entry.tel) ? String(entry.tel[0] || '') : undefined,
      email: Array.isArray(entry.email) ? String(entry.email[0] || '') : undefined,
    }))
    .filter((entry) => entry.name !== '');
}

async function pickContactsWebSingle(): Promise<DeviceContact[]> {
  const contactPicker = (navigator as Navigator & {
    contacts?: {
      select?: (properties: string[], options?: { multiple?: boolean }) => Promise<Array<Record<string, any>>>;
    };
  }).contacts;

  if (!contactPicker?.select) {
    throw new Error('UNSUPPORTED');
  }

  const selected = await contactPicker.select(['name', 'tel', 'email'], { multiple: false });
  return selected
    .map((entry) => ({
      name: Array.isArray(entry.name) ? String(entry.name[0] || '').trim() : '',
      phone: Array.isArray(entry.tel) ? String(entry.tel[0] || '') : undefined,
      email: Array.isArray(entry.email) ? String(entry.email[0] || '') : undefined,
    }))
    .filter((entry) => entry.name !== '');
}

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * Convert the plugin's BirthdayPayload ({ month, day, year? }) to the
 * "MM-DD" string format used by the Friend type.
 */
function formatBirthday(
  bday: { month?: number | null; day?: number | null; year?: number | null } | null | undefined,
): string | undefined {
  if (!bday || bday.month == null || bday.day == null) return undefined;
  const mm = String(bday.month).padStart(2, '0');
  const dd = String(bday.day).padStart(2, '0');
  return `${mm}-${dd}`;
}

/**
 * Race a promise against a timeout.  Rejects with Error('TIMEOUT') if
 * the timeout fires first.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('TIMEOUT')), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
