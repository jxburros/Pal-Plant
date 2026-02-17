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

import React from 'react';
import { X, CheckCircle, XCircle, Users, Calendar } from 'lucide-react';
import { MeetingRequest, Friend } from '../types';
import { getInitials, getAvatarColor } from '../utils/helpers';

interface MeetingFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: MeetingRequest;
  friends: Friend[];
  onConfirm: (meetingId: string, linkedIds: string[]) => void;
  onDismiss: (meetingId: string) => void;
}

const MeetingFollowUpModal: React.FC<MeetingFollowUpModalProps> = ({
  isOpen,
  onClose,
  meeting,
  friends,
  onConfirm,
  onDismiss
}) => {
  if (!isOpen) return null;

  // Get all linked friends for display
  const linkedIds = meeting.linkedIds || (meeting.linkedFriendId ? [meeting.linkedFriendId] : []);
  const linkedFriends = friends.filter(f => linkedIds.includes(f.id));
  
  // Format the names
  const namesDisplay = linkedFriends.length > 0 
    ? linkedFriends.map(f => f.name).join(', ')
    : meeting.name || 'this person';

  const handleConfirm = () => {
    onConfirm(meeting.id, linkedIds);
    onClose();
  };

  const handleDismiss = () => {
    onDismiss(meeting.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center gap-3">
            <Calendar className="text-emerald-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Meeting Follow-up</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Meeting Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {meeting.name || 'Meeting'}
                </h3>
                {meeting.location && (
                  <p className="text-sm text-gray-600 mt-1">
                    📍 {meeting.location}
                  </p>
                )}
                {meeting.scheduledDate && (
                  <p className="text-sm text-gray-600 mt-1">
                    🗓️ {new Date(meeting.scheduledDate).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Linked Friends */}
            {linkedFriends.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Users size={16} />
                  Participants:
                </p>
                <div className="flex flex-wrap gap-2">
                  {linkedFriends.map(friend => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                        style={{ backgroundColor: getAvatarColor(friend.avatarSeed || 0) }}
                      >
                        {getInitials(friend.name)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{friend.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Question */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-center text-gray-900 font-medium">
              Did you meet with {namesDisplay}?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <CheckCircle size={20} />
              Yes, we met
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              <XCircle size={20} />
              No
            </button>
          </div>

          {/* Info text */}
          <p className="text-xs text-gray-500 text-center">
            {linkedFriends.length > 0 
              ? `Confirming will mark all ${linkedFriends.length} participant${linkedFriends.length > 1 ? 's' : ''} as contacted`
              : 'This meeting is not linked to any contacts in your garden'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default MeetingFollowUpModal;
