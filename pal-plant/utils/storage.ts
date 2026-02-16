/**
 * IndexedDB Storage Layer
 * 
 * Provides a robust storage solution with:
 * - Better storage capacity (50MB+ vs localStorage's 5-10MB)
 * - Transaction safety
 * - Structured data with indexing
 * - Graceful fallback to localStorage
 */

import { Friend, MeetingRequest, AppSettings } from '../types';

const DB_NAME = 'PalPlantDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  FRIENDS: 'friends',
  MEETINGS: 'meetings',
  CATEGORIES: 'categories',
  SETTINGS: 'settings',
  METADATA: 'metadata'
} as const;

// localStorage keys (for migration and fallback)
const LEGACY_KEYS = {
  FRIENDS: 'friendkeep_data',
  MEETINGS: 'friendkeep_meetings',
  CATEGORIES: 'friendkeep_categories',
  SETTINGS: 'friendkeep_settings',
  LAST_BACKUP: 'friendkeep_last_backup_at',
  REMINDERS: 'friendkeep_reminders',
  BACKUP_REMINDER: 'friendkeep_backup_reminder',
  FCM_TOKEN: 'friendkeep_fcm_token',
  ANALYTICS: 'friendkeep_analytics'
} as const;

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;
let useLocalStorageFallback = false;

/**
 * Initialize IndexedDB with schema
 */
function initDB(): Promise<IDBDatabase> {
  if (dbInitPromise) return dbInitPromise;
  
  dbInitPromise = new Promise((resolve, reject) => {
    // Check if IndexedDB is available
    if (!window.indexedDB) {
      console.warn('IndexedDB not available, falling back to localStorage');
      useLocalStorageFallback = true;
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      useLocalStorageFallback = true;
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      
      // Handle unexpected db closure
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
        dbInitPromise = null;
      };
      
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.FRIENDS)) {
        const friendStore = db.createObjectStore(STORES.FRIENDS, { keyPath: 'id' });
        friendStore.createIndex('category', 'category', { unique: false });
        friendStore.createIndex('lastContacted', 'lastContacted', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.MEETINGS)) {
        const meetingStore = db.createObjectStore(STORES.MEETINGS, { keyPath: 'id' });
        meetingStore.createIndex('status', 'status', { unique: false });
        meetingStore.createIndex('linkedFriendId', 'linkedFriendId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
      }
    };
  });

  return dbInitPromise;
}

/**
 * Get database instance
 */
async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;
  return initDB();
}

/**
 * Generic get operation
 */
async function get<T>(storeName: string, key: string): Promise<T | null> {
  if (useLocalStorageFallback) {
    return getFromLocalStorage<T>(storeName, key);
  }

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error getting ${key} from ${storeName}:`, error);
    return getFromLocalStorage<T>(storeName, key);
  }
}

/**
 * Generic put operation
 */
async function put<T>(storeName: string, value: T): Promise<void> {
  if (useLocalStorageFallback) {
    return putToLocalStorage(storeName, value);
  }

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error putting to ${storeName}:`, error);
    return putToLocalStorage(storeName, value);
  }
}

/**
 * Generic getAll operation
 */
async function getAll<T>(storeName: string): Promise<T[]> {
  if (useLocalStorageFallback) {
    return getAllFromLocalStorage<T>(storeName);
  }

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error getting all from ${storeName}:`, error);
    return getAllFromLocalStorage<T>(storeName);
  }
}

/**
 * Generic delete operation
 */
async function remove(storeName: string, key: string): Promise<void> {
  if (useLocalStorageFallback) {
    return removeFromLocalStorage(storeName, key);
  }

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error deleting ${key} from ${storeName}:`, error);
    return removeFromLocalStorage(storeName, key);
  }
}

/**
 * Clear all data from a store
 */
async function clear(storeName: string): Promise<void> {
  if (useLocalStorageFallback) {
    return clearLocalStorage(storeName);
  }

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error clearing ${storeName}:`, error);
    return clearLocalStorage(storeName);
  }
}

// =============================================================================
// LocalStorage Fallback Functions
// =============================================================================

function getFromLocalStorage<T>(storeName: string, key: string): T | null {
  const legacyKey = getLegacyKey(storeName);
  const data = localStorage.getItem(legacyKey);
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function putToLocalStorage<T>(storeName: string, value: T): void {
  const legacyKey = getLegacyKey(storeName);
  localStorage.setItem(legacyKey, JSON.stringify(value));
}

function getAllFromLocalStorage<T>(storeName: string): T[] {
  const legacyKey = getLegacyKey(storeName);
  const data = localStorage.getItem(legacyKey);
  if (!data) return [];
  
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function removeFromLocalStorage(storeName: string, key: string): void {
  const legacyKey = getLegacyKey(storeName);
  localStorage.removeItem(legacyKey);
}

function clearLocalStorage(storeName: string): void {
  const legacyKey = getLegacyKey(storeName);
  localStorage.removeItem(legacyKey);
}

function getLegacyKey(storeName: string): string {
  switch (storeName) {
    case STORES.FRIENDS: return LEGACY_KEYS.FRIENDS;
    case STORES.MEETINGS: return LEGACY_KEYS.MEETINGS;
    case STORES.CATEGORIES: return LEGACY_KEYS.CATEGORIES;
    case STORES.SETTINGS: return LEGACY_KEYS.SETTINGS;
    default: return `friendkeep_${storeName}`;
  }
}

// =============================================================================
// High-Level API Functions
// =============================================================================

/**
 * Friends operations
 */
export async function getFriends(): Promise<Friend[]> {
  return getAll<Friend>(STORES.FRIENDS);
}

export async function saveFriends(friends: Friend[]): Promise<void> {
  if (useLocalStorageFallback) {
    localStorage.setItem(LEGACY_KEYS.FRIENDS, JSON.stringify(friends));
    return;
  }

  try {
    const db = await getDB();
    const transaction = db.transaction(STORES.FRIENDS, 'readwrite');
    const store = transaction.objectStore(STORES.FRIENDS);
    
    // Clear all existing records
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Batch all put operations without awaiting each one
    const putPromises = friends.map(friend => 
      new Promise<void>((resolve, reject) => {
        const putRequest = store.put(friend);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      })
    );

    await Promise.all(putPromises);
  } catch (error) {
    console.error('Error saving friends:', error);
    localStorage.setItem(LEGACY_KEYS.FRIENDS, JSON.stringify(friends));
  }
}

/**
 * Meetings operations
 */
export async function getMeetings(): Promise<MeetingRequest[]> {
  return getAll<MeetingRequest>(STORES.MEETINGS);
}

export async function saveMeetings(meetings: MeetingRequest[]): Promise<void> {
  if (useLocalStorageFallback) {
    localStorage.setItem(LEGACY_KEYS.MEETINGS, JSON.stringify(meetings));
    return;
  }

  try {
    const db = await getDB();
    const transaction = db.transaction(STORES.MEETINGS, 'readwrite');
    const store = transaction.objectStore(STORES.MEETINGS);
    
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Batch all put operations
    const putPromises = meetings.map(meeting => 
      new Promise<void>((resolve, reject) => {
        const putRequest = store.put(meeting);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      })
    );

    await Promise.all(putPromises);
  } catch (error) {
    console.error('Error saving meetings:', error);
    localStorage.setItem(LEGACY_KEYS.MEETINGS, JSON.stringify(meetings));
  }
}

/**
 * Categories operations
 */
export async function getCategories(): Promise<string[]> {
  if (useLocalStorageFallback) {
    const data = localStorage.getItem(LEGACY_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : ['Friends', 'Romantic', 'Business', 'Family'];
  }

  try {
    const items = await getAll<{ id: number; value: string }>(STORES.CATEGORIES);
    if (items.length === 0) {
      return ['Friends', 'Romantic', 'Business', 'Family'];
    }
    return items.map(item => item.value);
  } catch (error) {
    console.error('Error getting categories:', error);
    const data = localStorage.getItem(LEGACY_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : ['Friends', 'Romantic', 'Business', 'Family'];
  }
}

export async function saveCategories(categories: string[]): Promise<void> {
  if (useLocalStorageFallback) {
    localStorage.setItem(LEGACY_KEYS.CATEGORIES, JSON.stringify(categories));
    return;
  }

  try {
    const db = await getDB();
    const transaction = db.transaction(STORES.CATEGORIES, 'readwrite');
    const store = transaction.objectStore(STORES.CATEGORIES);
    
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Batch all put operations
    const putPromises = categories.map((category, i) => 
      new Promise<void>((resolve, reject) => {
        const putRequest = store.put({ id: i + 1, value: category });
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      })
    );

    await Promise.all(putPromises);
  } catch (error) {
    console.error('Error saving categories:', error);
    localStorage.setItem(LEGACY_KEYS.CATEGORIES, JSON.stringify(categories));
  }
}

/**
 * Settings operations
 */
export async function getSettings(): Promise<AppSettings | null> {
  if (useLocalStorageFallback) {
    const data = localStorage.getItem(LEGACY_KEYS.SETTINGS);
    return data ? JSON.parse(data) : null;
  }

  try {
    return await get<AppSettings>(STORES.SETTINGS, 'app_settings');
  } catch (error) {
    console.error('Error getting settings:', error);
    const data = localStorage.getItem(LEGACY_KEYS.SETTINGS);
    return data ? JSON.parse(data) : null;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  if (useLocalStorageFallback) {
    localStorage.setItem(LEGACY_KEYS.SETTINGS, JSON.stringify(settings));
    return;
  }

  try {
    await put(STORES.SETTINGS, { key: 'app_settings', ...settings });
  } catch (error) {
    console.error('Error saving settings:', error);
    localStorage.setItem(LEGACY_KEYS.SETTINGS, JSON.stringify(settings));
  }
}

/**
 * Metadata operations (for reminders, backups, etc.)
 */
export async function getMetadata(key: string): Promise<string | null> {
  if (useLocalStorageFallback) {
    return localStorage.getItem(key);
  }

  try {
    const result = await get<{ key: string; value: string }>(STORES.METADATA, key);
    return result?.value || null;
  } catch (error) {
    return localStorage.getItem(key);
  }
}

export async function saveMetadata(key: string, value: string): Promise<void> {
  if (useLocalStorageFallback) {
    localStorage.setItem(key, value);
    return;
  }

  try {
    await put(STORES.METADATA, { key, value });
  } catch (error) {
    console.error(`Error saving metadata ${key}:`, error);
    localStorage.setItem(key, value);
  }
}

export async function removeMetadata(key: string): Promise<void> {
  if (useLocalStorageFallback) {
    localStorage.removeItem(key);
    return;
  }

  try {
    await remove(STORES.METADATA, key);
  } catch (error) {
    console.error(`Error removing metadata ${key}:`, error);
    localStorage.removeItem(key);
  }
}

/**
 * Migration from localStorage to IndexedDB
 */
export async function migrateFromLocalStorage(): Promise<boolean> {
  // Check if migration is needed
  const migrated = localStorage.getItem('friendkeep_migrated_to_indexeddb');
  if (migrated === 'true') {
    return true;
  }

  // Check if there's data to migrate
  const hasFriends = localStorage.getItem(LEGACY_KEYS.FRIENDS);
  const hasMeetings = localStorage.getItem(LEGACY_KEYS.MEETINGS);
  const hasCategories = localStorage.getItem(LEGACY_KEYS.CATEGORIES);
  const hasSettings = localStorage.getItem(LEGACY_KEYS.SETTINGS);

  if (!hasFriends && !hasMeetings && !hasCategories && !hasSettings) {
    // No data to migrate
    localStorage.setItem('friendkeep_migrated_to_indexeddb', 'true');
    return true;
  }

  try {
    // Initialize DB first
    await initDB();

    // Migrate friends
    if (hasFriends) {
      const friends = JSON.parse(hasFriends);
      await saveFriends(friends);
    }

    // Migrate meetings
    if (hasMeetings) {
      const meetings = JSON.parse(hasMeetings);
      await saveMeetings(meetings);
    }

    // Migrate categories
    if (hasCategories) {
      const categories = JSON.parse(hasCategories);
      await saveCategories(categories);
    }

    // Migrate settings
    if (hasSettings) {
      const settings = JSON.parse(hasSettings);
      await saveSettings(settings);
    }

    // Migrate metadata
    const metadataKeys = [
      LEGACY_KEYS.LAST_BACKUP,
      LEGACY_KEYS.REMINDERS,
      LEGACY_KEYS.BACKUP_REMINDER,
      LEGACY_KEYS.FCM_TOKEN,
      LEGACY_KEYS.ANALYTICS
    ];

    for (const key of metadataKeys) {
      const value = localStorage.getItem(key);
      if (value) {
        await saveMetadata(key, value);
      }
    }

    // Mark migration as complete
    localStorage.setItem('friendkeep_migrated_to_indexeddb', 'true');
    console.log('Successfully migrated data from localStorage to IndexedDB');
    
    return true;
  } catch (error) {
    console.error('Error during migration:', error);
    useLocalStorageFallback = true;
    return false;
  }
}

/**
 * Initialize storage (run migration if needed)
 */
export async function initStorage(): Promise<void> {
  try {
    await migrateFromLocalStorage();
  } catch (error) {
    console.error('Storage initialization error:', error);
    useLocalStorageFallback = true;
  }
}

/**
 * Export all data for backup
 */
export async function exportAllData() {
  const friends = await getFriends();
  const meetings = await getMeetings();
  const categories = await getCategories();
  const settings = await getSettings();

  return {
    friends,
    meetings,
    categories,
    settings: settings || {},
    exportDate: new Date().toISOString(),
    version: 2
  };
}

/**
 * Import data from backup
 */
export async function importAllData(data: any): Promise<void> {
  if (data.friends) await saveFriends(data.friends);
  if (data.meetings) await saveMeetings(data.meetings);
  if (data.categories) await saveCategories(data.categories);
  if (data.settings) await saveSettings(data.settings);
}
