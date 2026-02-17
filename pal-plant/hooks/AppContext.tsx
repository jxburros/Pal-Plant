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
import { Friend, MeetingRequest, AppSettings, ActionFeedback } from '../types';
import { generateId } from '../utils/helpers';
import { trackEvent } from '../utils/analytics';
import { useFriendsEngine } from './useFriendsEngine';

interface AppState {
  friends: Friend[];
  meetingRequests: MeetingRequest[];
  settings: AppSettings;
  categories: string[];
  feedbackMap: Record<string, ActionFeedback>;
}

interface AppActions {
  setFriends: React.Dispatch<React.SetStateAction<Friend[]>>;
  markContacted: (id: string, type: 'REGULAR' | 'DEEP' | 'QUICK') => void;
  markContactedBatch: (ids: string[], type: 'REGULAR' | 'DEEP' | 'QUICK') => void;
  clearFeedback: (friendId: string) => void;
  deleteFriend: (id: string) => void;
  deleteLog: (friendId: string, logId: string) => void;
  saveFriend: (friend: Friend, isEditing: boolean) => void;
  bulkImportFriends: (newFriends: Friend[]) => void;
  setMeetingRequests: React.Dispatch<React.SetStateAction<MeetingRequest[]>>;
  addMeetingRequest: (req: MeetingRequest) => void;
  updateMeetingRequest: (req: MeetingRequest) => void;
  deleteMeetingRequest: (id: string) => void;
  setSettings: (s: AppSettings) => void;
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  addCategory: (cat: string) => void;
}

type AppContextType = AppState & AppActions;

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_SETTINGS: AppSettings = {
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    friends, setFriends, feedbackMap, markContacted, markContactedBatch, clearFeedback,
    deleteFriend, deleteLog, saveFriend, bulkImport
  } = useFriendsEngine([]);

  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([]);

  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS);

  const [categories, setCategories] = useState<string[]>(['Friends', 'Romantic', 'Business', 'Family']);

  // localStorage persistence removed - now handled exclusively by IndexedDB in App.tsx
  // This prevents race conditions and conflicting writes between localStorage and IndexedDB

  const setSettings = useCallback((s: AppSettings) => setSettingsState(s), []);

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

  const value: AppContextType = {
    friends, meetingRequests, settings, categories, feedbackMap,
    setFriends, markContacted, markContactedBatch, clearFeedback, deleteFriend, deleteLog,
    saveFriend, bulkImportFriends: bulkImport,
    setMeetingRequests, addMeetingRequest, updateMeetingRequest, deleteMeetingRequest,
    setSettings, setCategories, addCategory
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
