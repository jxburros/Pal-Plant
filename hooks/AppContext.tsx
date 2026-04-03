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

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Friend, MeetingRequest, AppSettings, ActionFeedback, ContactChannel, Group } from '../types';
import { trackEvent } from '../utils/analytics';
import { useFriendsEngine } from './useFriendsEngine';
import {
  initStorage, getFriends, getMeetings, getCategories,
  getSettings, getGroups, getMetadata, saveMetadata
} from '../utils/storage';
import {
  debouncedSaveFriends, debouncedSaveMeetings, debouncedSaveCategories,
  debouncedSaveSettings, debouncedSaveGroups
} from '../utils/debouncedStorage';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'plant',
  textSize: 'normal',
  highContrast: false,
  reducedMotion: false,
  reminders: {
    pushEnabled: false,
    reminderHoursBefore: 24,
    backupReminderEnabled: true,
    backupReminderDays: 7
  },
  hasSeenOnboarding: false
};

const DEFAULT_CATEGORIES = ['Friends', 'Romantic', 'Business', 'Family'];

// ─── Types ────────────────────────────────────────────────────────

interface AppState {
  friends: Friend[];
  meetingRequests: MeetingRequest[];
  settings: AppSettings;
  categories: string[];
  groups: Group[];
  feedbackMap: Record<string, ActionFeedback>;
  isStorageReady: boolean;
  lastOpened: Date;
}

interface AppActions {
  setFriends: React.Dispatch<React.SetStateAction<Friend[]>>;
  markContacted: (id: string, channel: ContactChannel) => void;
  markContactedBatch: (ids: string[], channel: ContactChannel) => void;
  clearFeedback: (friendId: string) => void;
  deleteFriend: (id: string) => void;
  deleteLog: (friendId: string, logId: string) => void;
  editLog: (friendId: string, logId: string, updates: { channel?: ContactChannel; date?: string }) => void;
  addPastInteraction: (friendId: string, channel: ContactChannel, date: string) => void;
  saveFriend: (friend: Friend, isEditing: boolean) => void;
  bulkImportFriends: (newFriends: Friend[]) => void;
  setMeetingRequests: React.Dispatch<React.SetStateAction<MeetingRequest[]>>;
  addMeetingRequest: (req: MeetingRequest) => void;
  updateMeetingRequest: (req: MeetingRequest) => void;
  deleteMeetingRequest: (id: string) => void;
  setSettings: (s: AppSettings) => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  addCategory: (cat: string) => void;
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
}

type AppContextType = AppState & AppActions;

// ─── Context ──────────────────────────────────────────────────────

const AppContext = createContext<AppContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    friends, setFriends, feedbackMap,
    markContacted, markContactedBatch, clearFeedback,
    deleteFriend, deleteLog, editLog, addPastInteraction, saveFriend, bulkImport
  } = useFriendsEngine([]);

  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([]);
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [lastOpened, setLastOpened] = useState<Date>(new Date());

  // ─── Storage Init ─────────────────────────────────────────────

  useEffect(() => {
    const loadData = async () => {
      try {
        await initStorage();

        const [
          loadedFriends, loadedMeetings, loadedCategories,
          loadedSettings, loadedGroups, lastOpenedStr
        ] = await Promise.all([
          getFriends(), getMeetings(), getCategories(),
          getSettings(), getGroups(), getMetadata('lastOpened')
        ]);

        setFriends(loadedFriends);
        setMeetingRequests(loadedMeetings);
        if (loadedCategories.length > 0) setCategories(loadedCategories);
        setGroups(loadedGroups);

        if (loadedSettings) {
          setSettingsState(prev => ({
            ...prev,
            ...loadedSettings,
            reminders: { ...prev.reminders, ...(loadedSettings.reminders ?? {}) }
          }));
        }

        if (lastOpenedStr) setLastOpened(new Date(lastOpenedStr));
      } catch (error) {
        console.error('Error loading data from storage:', error);
      } finally {
        setIsStorageReady(true);
      }
    };

    loadData();
  }, [setFriends]);

  // Save lastOpened timestamp on unmount
  useEffect(() => {
    return () => {
      saveMetadata('lastOpened', new Date().toISOString()).catch(console.error);
    };
  }, []);

  // ─── Debounced Persistence ────────────────────────────────────

  useEffect(() => { if (isStorageReady) debouncedSaveFriends(friends); }, [friends, isStorageReady]);
  useEffect(() => { if (isStorageReady) debouncedSaveCategories(categories); }, [categories, isStorageReady]);
  useEffect(() => { if (isStorageReady) debouncedSaveMeetings(meetingRequests); }, [meetingRequests, isStorageReady]);
  useEffect(() => { if (isStorageReady) debouncedSaveGroups(groups); }, [groups, isStorageReady]);
  useEffect(() => { if (isStorageReady) debouncedSaveSettings(settings); }, [settings, isStorageReady]);

  // ─── Actions ─────────────────────────────────────────────────

  const setSettings = useCallback((s: AppSettings) => setSettingsState(s), []);

  const updateSettings = useCallback((partial: Partial<AppSettings>) =>
    setSettingsState(prev => ({ ...prev, ...partial })), []);

  const addCategory = useCallback((cat: string) => {
    setCategories(prev => prev.includes(cat) ? prev : [...prev, cat]);
  }, []);

  const addMeetingRequest = useCallback((req: MeetingRequest) => {
    setMeetingRequests(prev => [req, ...prev]);
    trackEvent('MEETING_CREATED', { meetingId: req.id });
  }, []);

  const updateMeetingRequest = useCallback((req: MeetingRequest) => {
    setMeetingRequests(prev => prev.map(r => r.id === req.id ? req : r));
    if (req.status === 'SCHEDULED') trackEvent('MEETING_SCHEDULED', { meetingId: req.id });
    if (req.status === 'COMPLETE' && req.verified) trackEvent('MEETING_COMPLETED', { meetingId: req.id });
    if (req.status === 'COMPLETE' && req.verified === false) trackEvent('MEETING_CLOSED', { meetingId: req.id });
  }, []);

  const deleteMeetingRequest = useCallback((id: string) => {
    setMeetingRequests(prev => prev.filter(r => r.id !== id));
  }, []);

  // ─── Context Value ────────────────────────────────────────────

  const value: AppContextType = {
    // State
    friends, meetingRequests, settings, categories, groups,
    feedbackMap, isStorageReady, lastOpened,
    // Friend actions
    setFriends, markContacted, markContactedBatch, clearFeedback,
    deleteFriend, deleteLog, editLog, addPastInteraction,
    saveFriend, bulkImportFriends: bulkImport,
    // Meeting actions
    setMeetingRequests, addMeetingRequest, updateMeetingRequest, deleteMeetingRequest,
    // Settings actions
    setSettings, updateSettings,
    // Category actions
    setCategories, addCategory,
    // Group actions
    setGroups,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// ─── Hook ────────────────────────────────────────────────────────

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
