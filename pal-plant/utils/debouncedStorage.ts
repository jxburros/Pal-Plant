/**
 * Debounced Storage Writer
 * 
 * Batches writes within a time window to reduce storage operations
 * and improve performance for frequent updates
 */

import { Friend, MeetingRequest, AppSettings } from '../types';
import { saveFriends, saveMeetings, saveCategories, saveSettings } from './storage';

const DEBOUNCE_DELAY = 1000; // 1 second

type StorageType = 'friends' | 'meetings' | 'categories' | 'settings';

interface PendingWrite {
  type: StorageType;
  data: any;
  timeout: NodeJS.Timeout;
}

const pendingWrites = new Map<StorageType, PendingWrite>();

/**
 * Flush a pending write immediately
 */
async function flushWrite(type: StorageType): Promise<void> {
  const pending = pendingWrites.get(type);
  if (!pending) return;

  clearTimeout(pending.timeout);
  pendingWrites.delete(type);

  try {
    switch (type) {
      case 'friends':
        await saveFriends(pending.data);
        break;
      case 'meetings':
        await saveMeetings(pending.data);
        break;
      case 'categories':
        await saveCategories(pending.data);
        break;
      case 'settings':
        await saveSettings(pending.data);
        break;
    }
  } catch (error) {
    console.error(`Error flushing ${type} write:`, error);
  }
}

/**
 * Schedule a debounced write
 */
function scheduleWrite(type: StorageType, data: any): void {
  // Cancel existing timeout
  const existing = pendingWrites.get(type);
  if (existing) {
    clearTimeout(existing.timeout);
  }

  // Schedule new write
  const timeout = setTimeout(() => {
    flushWrite(type);
  }, DEBOUNCE_DELAY);

  pendingWrites.set(type, { type, data, timeout });
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
    const types = Array.from(pendingWrites.keys());
    for (const type of types) {
      const pending = pendingWrites.get(type);
      if (pending) {
        clearTimeout(pending.timeout);
        // Force synchronous localStorage write as fallback during unload
        try {
          switch (type) {
            case 'friends':
              localStorage.setItem('friendkeep_data', JSON.stringify(pending.data));
              break;
            case 'meetings':
              localStorage.setItem('friendkeep_meetings', JSON.stringify(pending.data));
              break;
            case 'categories':
              localStorage.setItem('friendkeep_categories', JSON.stringify(pending.data));
              break;
            case 'settings':
              localStorage.setItem('friendkeep_settings', JSON.stringify(pending.data));
              break;
          }
        } catch (error) {
          console.error(`Error during unload write for ${type}:`, error);
        }
      }
    }
    pendingWrites.clear();
  });
}
