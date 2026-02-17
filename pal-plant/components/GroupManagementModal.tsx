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

import React, { useState } from 'react';
import { X, Users, Plus, Trash2, MessageCircle, Zap, Edit2, Check } from 'lucide-react';
import { Group, Friend } from '../types';
import { generateId, getInitials, getAvatarColor } from '../utils/helpers';

interface GroupManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  friends: Friend[];
  onSaveGroups: (groups: Group[]) => void;
  onContactGroup: (memberIds: string[], type: 'REGULAR' | 'QUICK') => void;
}

const GroupManagementModal: React.FC<GroupManagementModalProps> = ({
  isOpen,
  onClose,
  groups,
  friends,
  onSaveGroups,
  onContactGroup
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setGroupName('');
    setSelectedFriendIds([]);
    setEditingId(null);
    setIsAdding(false);
  };

  const startEdit = (group: Group) => {
    setGroupName(group.name);
    setSelectedFriendIds(group.memberIds);
    setEditingId(group.id);
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!groupName.trim() || selectedFriendIds.length === 0) return;

    if (editingId) {
      // Update existing group
      const updated = groups.map(g =>
        g.id === editingId
          ? { ...g, name: groupName.trim(), memberIds: selectedFriendIds }
          : g
      );
      onSaveGroups(updated);
    } else {
      // Create new group
      const newGroup: Group = {
        id: generateId(),
        name: groupName.trim(),
        memberIds: selectedFriendIds
      };
      onSaveGroups([...groups, newGroup]);
    }
    resetForm();
  };

  const handleDelete = (groupId: string) => {
    if (confirm('Are you sure you want to delete this group?')) {
      onSaveGroups(groups.filter(g => g.id !== groupId));
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriendIds(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-3">
            <Users className="text-purple-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Manage Groups</h2>
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
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Add/Edit Form */}
          {isAdding ? (
            <div className="bg-gray-50 rounded-xl p-4 border-2 border-purple-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">
                  {editingId ? 'Edit Group' : 'New Group'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>

              <input
                type="text"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                maxLength={50}
              />

              {/* Friend Selection */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">
                  Select Members ({selectedFriendIds.length} selected)
                </label>
                <div className="max-h-60 overflow-y-auto bg-white rounded-lg border border-gray-200 p-2 space-y-1">
                  {friends.map(friend => {
                    const isSelected = selectedFriendIds.includes(friend.id);
                    return (
                      <label
                        key={friend.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-purple-100 border border-purple-300' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleFriendSelection(friend.id)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                        />
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                          style={{ backgroundColor: getAvatarColor(friend.avatarSeed || 0) }}
                        >
                          {getInitials(friend.name)}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{friend.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={!groupName.trim() || selectedFriendIds.length === 0}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check size={18} />
                {editingId ? 'Update Group' : 'Create Group'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Create New Group
            </button>
          )}

          {/* Groups List */}
          {groups.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-medium">No groups yet</p>
              <p className="text-sm mt-1">Create a group to contact multiple friends at once</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map(group => {
                const groupFriends = friends.filter(f => group.memberIds.includes(f.id));
                return (
                  <div
                    key={group.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">{group.name}</h3>
                        <p className="text-sm text-gray-600">
                          {groupFriends.length} member{groupFriends.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(group)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit group"
                        >
                          <Edit2 size={16} className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(group.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete group"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    </div>

                    {/* Members */}
                    {groupFriends.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {groupFriends.slice(0, 5).map(friend => (
                          <div
                            key={friend.id}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg text-xs"
                          >
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
                              style={{ backgroundColor: getAvatarColor(friend.avatarSeed || 0) }}
                            >
                              {getInitials(friend.name)}
                            </div>
                            <span className="font-medium text-gray-700">{friend.name}</span>
                          </div>
                        ))}
                        {groupFriends.length > 5 && (
                          <div className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
                            +{groupFriends.length - 5} more
                          </div>
                        )}
                      </div>
                    )}

                    {/* Contact Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => onContactGroup(group.memberIds, 'REGULAR')}
                        className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <MessageCircle size={14} />
                        Regular Contact
                      </button>
                      <button
                        onClick={() => onContactGroup(group.memberIds, 'QUICK')}
                        className="flex-1 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <Zap size={14} />
                        Quick Touch
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupManagementModal;
