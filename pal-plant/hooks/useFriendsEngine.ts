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

import { useState, useCallback } from 'react';
import { ActionFeedback, ContactChannel, Friend } from '../types';
import { processContactAction, removeFriendLog } from '../utils/friendEngine';
import { trackEvent } from '../utils/analytics';

interface UseFriendsEngineReturn {
  friends: Friend[];
  setFriends: React.Dispatch<React.SetStateAction<Friend[]>>;
  feedbackMap: Record<string, ActionFeedback>;
  markContacted: (id: string, type: 'REGULAR' | 'DEEP' | 'QUICK', channel?: ContactChannel) => void;
  clearFeedback: (friendId: string) => void;
  deleteFriend: (id: string) => void;
  deleteLog: (friendId: string, logId: string) => void;
  saveFriend: (friend: Friend, isEditing: boolean) => void;
  bulkImport: (newFriends: Friend[]) => void;
}

export const useFriendsEngine = (initialFriends: Friend[] | (() => Friend[])): UseFriendsEngineReturn => {
  const [friends, setFriends] = useState<Friend[]>(initialFriends);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, ActionFeedback>>({});

  const clearFeedback = useCallback((friendId: string) => {
    setFeedbackMap(prev => {
      const next = { ...prev };
      delete next[friendId];
      return next;
    });
  }, []);

  const markContacted = useCallback((id: string, type: 'REGULAR' | 'DEEP' | 'QUICK', channel?: ContactChannel) => {
    setFriends(prev => prev.map(f => {
      if (f.id !== id) return f;

      const result = processContactAction(f, type, new Date(), channel);
      if (result.friend === f) return f;

      // Show inline feedback
      setFeedbackMap(prevMap => ({ ...prevMap, [id]: result.feedback }));
      setTimeout(() => clearFeedback(id), 5500);

      const metadata: Record<string, string | number | boolean | undefined> = { friendId: f.id, type };
      const latestLog = result.friend.logs[0];
      if (latestLog?.scoreDelta !== undefined) metadata.scoreChange = latestLog.scoreDelta;
      trackEvent('CONTACT_LOGGED', metadata);

      return result.friend;
    }));
  }, [clearFeedback]);

  const deleteFriend = useCallback((id: string) => {
    setFriends(prev => prev.filter(f => f.id !== id));
    trackEvent('FRIEND_DELETED', { friendId: id });
  }, []);

  const deleteLog = useCallback((friendId: string, logId: string) => {
    setFriends(prev => prev.map(f => {
      if (f.id !== friendId) return f;
      return removeFriendLog(f, logId);
    }));
  }, []);

  const saveFriend = useCallback((friend: Friend, isEditing: boolean) => {
    if (isEditing) {
      setFriends(prev => prev.map(f => f.id === friend.id ? friend : f));
      trackEvent('FRIEND_EDITED', { friendId: friend.id });
    } else {
      setFriends(prev => [friend, ...prev]);
      trackEvent('FRIEND_ADDED', { friendId: friend.id, category: friend.category });
    }
  }, []);

  const bulkImport = useCallback((newFriends: Friend[]) => {
    setFriends(prev => [...newFriends, ...prev]);
    trackEvent('BULK_IMPORT', { count: newFriends.length });
  }, []);

  return {
    friends,
    setFriends,
    feedbackMap,
    markContacted,
    clearFeedback,
    deleteFriend,
    deleteLog,
    saveFriend,
    bulkImport
  };
};
