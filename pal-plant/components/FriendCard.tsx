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

import React, { useState, useCallback } from 'react';
import { Phone, AlertCircle, Edit2, Trash2, Mail, MessageCircle, CalendarPlus, Cake, Droplets, ChevronDown, ChevronUp, PhoneCall, Video, Users, Gamepad2, Sparkles } from 'lucide-react';
import { ActionFeedback, ContactChannel, Friend, CHANNEL_WEIGHTS, CHANNEL_SCORE_BONUS } from '../types';
import { calculateTimeStatus, getProgressBarColor, getStatusColor, getPlantStage, getInitials, getAvatarColor } from '../utils/helpers';
import InlineFeedback from './InlineFeedback';

interface FriendCardProps {
  friend: Friend;
  onContact: (id: string, channel: ContactChannel) => void;
  onDelete: (id: string) => void;
  onEdit: (friend: Friend) => void;
  onRequestMeeting: (friend: Friend) => void;
  feedback?: ActionFeedback;
  onDismissFeedback?: (friendId: string) => void;
}

const CHANNEL_OPTIONS: { value: ContactChannel; label: string; icon: typeof Phone; color: string; activeColor: string }[] = [
  { value: 'text', label: 'Text', icon: MessageCircle, color: 'text-blue-500 border-blue-200 hover:bg-blue-50', activeColor: 'bg-blue-500 text-white border-blue-500' },
  { value: 'call', label: 'Call', icon: PhoneCall, color: 'text-emerald-600 border-emerald-200 hover:bg-emerald-50', activeColor: 'bg-emerald-600 text-white border-emerald-600' },
  { value: 'gaming', label: 'Gaming', icon: Gamepad2, color: 'text-indigo-500 border-indigo-200 hover:bg-indigo-50', activeColor: 'bg-indigo-500 text-white border-indigo-500' },
  { value: 'video', label: 'Video', icon: Video, color: 'text-purple-500 border-purple-200 hover:bg-purple-50', activeColor: 'bg-purple-500 text-white border-purple-500' },
  { value: 'in-person', label: 'In Person', icon: Users, color: 'text-orange-500 border-orange-200 hover:bg-orange-50', activeColor: 'bg-orange-500 text-white border-orange-500' },
];

const CHANNEL_LABELS: Record<ContactChannel, string> = {
  'text': 'Text',
  'call': 'Phone Call',
  'gaming': 'Gaming',
  'video': 'Video Call',
  'in-person': 'In Person',
};

const FriendCard: React.FC<FriendCardProps> = ({ friend, onContact, onDelete, onEdit, onRequestMeeting, feedback, onDismissFeedback }) => {
  const { percentageLeft, daysLeft, isOverdue } = calculateTimeStatus(friend.lastContacted, friend.frequencyDays);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showMechanics, setShowMechanics] = useState(false);
  const handleDismissFeedback = useCallback(() => {
    onDismissFeedback?.(friend.id);
  }, [onDismissFeedback, friend.id]);

  const visualPercentage = Math.min(Math.max(percentageLeft, 0), 100);
  const statusColorClass = getStatusColor(percentageLeft);
  const progressColorClass = getProgressBarColor(percentageLeft);

  const plantStage = getPlantStage(percentageLeft);
  const PlantIcon = plantStage.icon;

  const lastLog = friend.logs[0];
  const previousLog = friend.logs[1];
  const cadenceChanged = !!(lastLog && previousLog && lastLog.daysWaitGoal !== previousLog.daysWaitGoal);

  const scoreReason = !lastLog
    ? 'No interactions logged yet. Score starts at 50 and shifts with your contact timing.'
    : (() => {
        const ch = lastLog.channel;
        const label = CHANNEL_LABELS[ch] || ch;
        if (lastLog.percentageRemaining > 80) {
          return `${label} logged very early (${lastLog.scoreDelta ?? 0} points). Contacting in the sweet spot (0-50% timer) earns more.`;
        }
        if (lastLog.percentageRemaining <= 50) {
          return `${label} landed in the sweet spot (${lastLog.scoreDelta ?? 0} points). Great timing!`;
        }
        return `${label} logged on time (${lastLog.scoreDelta ?? 0} points).`;
      })();

  return (
    <div className="friend-card-shell bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative overflow-hidden transition-all duration-300 hover:shadow-md mb-4 group space-y-3" role="article" aria-label={`Friend card for ${friend.name}`}>
      <div className="friend-card-glow" aria-hidden="true" />
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Identity</p>
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
        <div className="flex items-center gap-1">
          <span className={`text-[10px] font-black px-2 py-1 rounded-md border ${friend.individualScore > 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : friend.individualScore < 40 ? 'bg-red-50 text-red-500 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
            {Math.round(friend.individualScore || 50)}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
            {friend.category}
          </span>
        </div>

        <div className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 w-fit ${statusColorClass}`}>
          {isOverdue ? <AlertCircle size={10} /> : <Droplets size={10} />}
          {isOverdue ? `${Math.abs(daysLeft)}d late` : `${daysLeft}d water`}
        </div>
      </div>

      <div className="flex justify-between items-start mb-3 mt-1 mr-24">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 border-4 border-white shadow-sm relative group-hover:scale-105 transition-transform z-0">
              {friend.photo ? (
                <img src={friend.photo} alt={`Photo of ${friend.name}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: getAvatarColor(friend.name) }}>
                  {getInitials(friend.name)}
                </div>
              )}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-gradient-to-br ${plantStage.gradient} border-2 border-white shadow-md ring-2 ${plantStage.ring} flex items-center justify-center z-10`} title={plantStage.label}>
              <PlantIcon size={17} className={plantStage.color} />
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 text-lg leading-tight truncate max-w-[150px] flex items-center gap-1">
              {friend.name}
              {friend.individualScore >= 80 && <Sparkles size={14} className="text-amber-500" aria-hidden="true" />}
            </h3>
            <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${plantStage.color}`}>{plantStage.label}</p>

            <div className="flex items-center gap-3 mt-2">
              {friend.phone && (
                <>
                  <a href={`tel:${friend.phone}`} className="text-slate-400 hover:text-green-600 transition-colors" title="Call"><Phone size={14} /></a>
                  <a href={`sms:${friend.phone}`} className="text-slate-400 hover:text-blue-500 transition-colors" title="Text"><MessageCircle size={14} /></a>
                </>
              )}
              {friend.email && <a href={`mailto:${friend.email}`} className="text-slate-400 hover:text-purple-500 transition-colors" title="Email"><Mail size={14} /></a>}
              {friend.birthday && (
                <div className="flex items-center gap-1 text-[10px] text-pink-400 bg-pink-50 px-1.5 py-0.5 rounded-full" title={`Birthday: ${friend.birthday}`}>
                  <Cake size={10} />
                  <span>{friend.birthday}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Status</p>
      <div className="mt-3 relative">
        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 px-1">
          <span>Needs Water</span>
          <span>Thriving</span>
        </div>
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50 shadow-inner" role="progressbar" aria-valuenow={Math.round(visualPercentage)} aria-valuemin={0} aria-valuemax={100} aria-label={`Contact timer: ${isOverdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days remaining`}`}>
          <div className={`h-full transition-all duration-700 ease-out relative rounded-full ${progressColorClass}`} style={{ width: `${visualPercentage}%` }}>
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/25 rounded-full"></div>
            <div className="absolute top-0 right-0 w-2 h-full bg-white/30 rounded-full"></div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowMechanics(prev => !prev)}
        className="w-full mt-3 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs text-slate-600 flex items-center justify-between border border-slate-100 card-subtle-button"
      >
        <span className="font-semibold">Why score changed?</span>
        {showMechanics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showMechanics && (
        <div className="mt-2 p-3 rounded-xl border border-slate-100 bg-white text-xs text-slate-600 space-y-2">
          <p>{scoreReason}</p>
          <p>
            Last score delta: <span className="font-semibold">{lastLog?.scoreDelta ?? 0}</span>
            {lastLog ? ` (${new Date(lastLog.date).toLocaleString()})` : ''}
          </p>
          <div className="mt-2 space-y-1">
            <p className="font-semibold text-slate-700">Channel impact on timer:</p>
            {CHANNEL_OPTIONS.map(ch => (
              <p key={ch.value} className="text-[10px]">
                {ch.label}: <span className="font-semibold">{Math.round(CHANNEL_WEIGHTS[ch.value] * 100)}%</span> timer reset, up to <span className="font-semibold">+{CHANNEL_SCORE_BONUS[ch.value]}</span> pts
              </p>
            ))}
          </div>
          {cadenceChanged && (
            <p>
              Cadence update: <span className="font-semibold">{previousLog?.daysWaitGoal}d → {lastLog?.daysWaitGoal}d</span> from recent timing behavior.
            </p>
          )}
        </div>
      )}

      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Log Interaction</p>
      {/* Channel-based interaction buttons */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        {CHANNEL_OPTIONS.map(ch => {
          const Icon = ch.icon;
          return (
            <button
              key={ch.value}
              onClick={() => onContact(friend.id, ch.value)}
              className={`card-action-button flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border active:scale-95 ${ch.color}`}
              aria-label={`Log ${ch.label} interaction with ${friend.name}`}
            >
              <Icon size={16} />
              {ch.label}
            </button>
          );
        })}
      </div>

      {/* Utility actions */}
      <div className="flex gap-2 mt-2">
        <button onClick={() => onRequestMeeting(friend)} className="card-subtle-button flex-1 px-3 py-2 rounded-xl text-slate-400 hover:bg-orange-50 hover:text-orange-600 transition-colors border border-slate-100 hover:border-orange-100 text-sm flex items-center justify-center gap-1" title="Create meeting request" aria-label={`Schedule meeting with ${friend.name}`}>
          <CalendarPlus size={16} />
          Meet
        </button>

        <button onClick={() => onEdit(friend)} className="card-subtle-button px-3 py-2 rounded-xl text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-100 hover:border-blue-100" title="Edit" aria-label={`Edit ${friend.name}`}>
          <Edit2 size={18} />
        </button>

        {confirmDelete ? (
          <div className="flex gap-1">
            <button onClick={() => { onDelete(friend.id); setConfirmDelete(false); }} className="px-2 py-2 rounded-xl bg-red-500 text-white text-[10px] font-bold transition-colors" title="Confirm Delete">Yes</button>
            <button onClick={() => setConfirmDelete(false)} className="px-2 py-2 rounded-xl bg-slate-200 text-slate-600 text-[10px] font-bold transition-colors" title="Cancel">No</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="card-subtle-button px-3 py-2 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors border border-slate-100 hover:border-red-100" title="Delete">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {feedback && (
        <InlineFeedback feedback={feedback} onDismiss={handleDismissFeedback} />
      )}
    </div>
  );
};

export default FriendCard;
