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
}

const isNative = () => Capacitor.isNativePlatform();

/**
 * Request contacts permission on native platforms.
 * Returns true if permission was granted.
 */
export const requestContactsPermission = async (): Promise<boolean> => {
  if (!isNative()) return true; // Web handles via browser API
  try {
    const result = await Contacts.requestPermissions();
    return result.contacts === 'granted';
  } catch {
    return false;
  }
};

/**
 * Check if contacts permission is currently granted.
 */
export const checkContactsPermission = async (): Promise<boolean> => {
  if (!isNative()) return true;
  try {
    const result = await Contacts.checkPermissions();
    return result.contacts === 'granted';
  } catch {
    return false;
  }
};

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

async function getAllContactsNative(): Promise<DeviceContact[]> {
  const hasPermission = await requestContactsPermission();
  if (!hasPermission) {
    throw new Error('PERMISSION_DENIED');
  }

  const result = await Contacts.getContacts({
    projection: {
      name: true,
      phones: true,
      emails: true,
    },
  });

  if (!result.contacts || result.contacts.length === 0) {
    return [];
  }

  return result.contacts
    .map((contact) => ({
      name: contact.name?.display || contact.name?.given || '',
      phone: contact.phones?.[0]?.number || undefined,
      email: contact.emails?.[0]?.address || undefined,
    }))
    .filter((c) => c.name.trim() !== '');
}

async function pickSingleContactNative(): Promise<DeviceContact | null> {
  const hasPermission = await requestContactsPermission();
  if (!hasPermission) {
    throw new Error('PERMISSION_DENIED');
  }

  const result = await Contacts.pickContact({
    projection: {
      name: true,
      phones: true,
      emails: true,
    },
  });

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
