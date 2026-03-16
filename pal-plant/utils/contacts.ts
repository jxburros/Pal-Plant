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
 * Get all contacts. The native plugin handles the permission request
 * internally — if READ_CONTACTS hasn't been granted yet, it shows the
 * system dialog and then proceeds to fetch contacts via its own
 * @PermissionCallback.  We must NOT call requestPermissions() separately
 * because doing so creates two competing permission flows that race and
 * can crash the app or return stale results.
 */
async function getAllContactsNative(): Promise<DeviceContact[]> {
  let result;
  try {
    result = await Contacts.getContacts({ projection: CONTACT_PROJECTION });
  } catch (err: any) {
    // The native plugin rejects with this message when the user denies
    // the permission dialog that it shows internally.
    if (typeof err?.message === 'string' && err.message.toLowerCase().includes('permission')) {
      throw new Error('PERMISSION_DENIED');
    }
    throw err;
  }

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
}

/**
 * Pick a single contact via the native contact picker intent.
 *
 * Known plugin limitation: if the user taps Back / cancels the picker,
 * the underlying native callback never resolves or rejects the promise.
 * We work around this with a timeout so the UI doesn't hang forever.
 */
async function pickSingleContactNative(): Promise<DeviceContact | null> {
  const PICKER_TIMEOUT_MS = 120_000; // 2 minutes — generous for slow devices

  let result;
  try {
    result = await withTimeout(
      Contacts.pickContact({ projection: CONTACT_PROJECTION }),
      PICKER_TIMEOUT_MS,
    );
  } catch (err: any) {
    if (err?.message === 'TIMEOUT') {
      // User likely cancelled the picker
      return null;
    }
    if (typeof err?.message === 'string' && err.message.toLowerCase().includes('permission')) {
      throw new Error('PERMISSION_DENIED');
    }
    throw err;
  }

  if (!result.contact) {
    return null;
  }

  const contact = result.contact;
  const name = contact.name?.display || contact.name?.given || '';
  if (!name.trim()) return null;

  return {
    name,
    phone: contact.phones?.[0]?.number || undefined,
    email: contact.emails?.[0]?.address || undefined,
    birthday: formatBirthday(contact.birthday),
  };
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
