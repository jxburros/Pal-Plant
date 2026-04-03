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

/**
 * Debounced Storage Writer
 * 
 * Batches writes within a time window to reduce storage operations
 * and improve performance for frequent updates
 */

import { Friend, MeetingRequest, AppSettings, Group } from '../types';
import { saveFriends, saveMeetings, saveCategories, saveSettings, saveGroups } from './storage';

const DEBOUNCE_DELAY = 1000; // 1 second

type StorageType = 'friends' | 'meetings' | 'categories' | 'settings' | 'groups';

interface PendingWrite {
  data: unknown;
  timeout: ReturnType<typeof setTimeout>;
}

const pendingWrites = new Map<StorageType, PendingWrite>();
const writeChains = new Map<StorageType, Promise<void>>();

const saveHandlers: Record<StorageType, (data: unknown) => Promise<void>> = {
  friends: (data) => saveFriends(data as Friend[]),
  meetings: (data) => saveMeetings(data as MeetingRequest[]),
  categories: (data) => saveCategories(data as string[]),
  settings: (data) => saveSettings(data as AppSettings),
  groups: (data) => saveGroups(data as Group[]),
};

const localStorageKeys: Record<StorageType, string> = {
  friends: 'friendkeep_data',
  meetings: 'friendkeep_meetings',
  categories: 'friendkeep_categories',
  settings: 'friendkeep_settings',
  groups: 'friendkeep_groups',
};

/**
 * Flush a pending write immediately
 */
async function flushWrite(type: StorageType): Promise<void> {
  const pending = pendingWrites.get(type);
  if (!pending) return;

  clearTimeout(pending.timeout);
  pendingWrites.delete(type);

  const previousWrite = writeChains.get(type) ?? Promise.resolve();
  const writeOperation = previousWrite
    .catch(() => {
      // Previous write failure should not block subsequent writes.
    })
    .then(() => saveHandlers[type](pending.data))
    .catch((error) => {
      console.error(`Error flushing ${type} write:`, error);
    });

  writeChains.set(type, writeOperation);
  await writeOperation;
}

/**
 * Schedule a debounced write
 */
function scheduleWrite(type: StorageType, data: unknown): void {
  // Cancel existing timeout
  const existing = pendingWrites.get(type);
  if (existing) {
    clearTimeout(existing.timeout);
  }

  // Schedule new write
  const timeout = setTimeout(() => {
    flushWrite(type);
  }, DEBOUNCE_DELAY);

  pendingWrites.set(type, { data, timeout });
}

/**
 * Debounced write operations
 */
export function debouncedSaveFriends(friends: Friend[]): void {
  scheduleWrite('friends', friends);
}

export function debouncedSaveMeetings(meetings: MeetingRequest[]): void {
  scheduleWrite('meetings', meetings);
}

export function debouncedSaveCategories(categories: string[]): void {
  scheduleWrite('categories', categories);
}

export function debouncedSaveSettings(settings: AppSettings): void {
  scheduleWrite('settings', settings);
}

export function debouncedSaveGroups(groups: Group[]): void {
  scheduleWrite('groups', groups);
}

/**
 * Flush all pending writes immediately
 * Call this before page unload or when immediate persistence is required
 */
export async function flushAllWrites(): Promise<void> {
  const promises: Promise<void>[] = [];
  for (const type of pendingWrites.keys()) {
    promises.push(flushWrite(type));
  }
  await Promise.all(promises);
  await Promise.all(writeChains.values());
}

/**
 * Cancel all pending writes
 */
export function cancelAllWrites(): void {
  for (const pending of pendingWrites.values()) {
    clearTimeout(pending.timeout);
  }
  pendingWrites.clear();
}

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // Use synchronous method for beforeunload to ensure writes complete
    for (const type of pendingWrites.keys()) {
      const pending = pendingWrites.get(type);
      if (pending) {
        clearTimeout(pending.timeout);
        // Force synchronous localStorage write as fallback during unload
        try {
          localStorage.setItem(localStorageKeys[type], JSON.stringify(pending.data));
        } catch (error) {
          console.error(`Error during unload write for ${type}:`, error);
        }
      }
    }
    pendingWrites.clear();
  });
}
