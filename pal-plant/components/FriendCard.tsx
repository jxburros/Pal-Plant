import React, { useState, useCallback } from 'react';
import { Phone, CheckCircle2, AlertCircle, Edit2, Trash2, Mail, MessageCircle, CalendarPlus, Cake, Droplets, Heart, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { ActionFeedback, Friend } from '../types';
import { calculateTimeStatus, getProgressBarColor, getStatusColor, getPlantStage, getInitials, getAvatarColor } from '../utils/helpers';
import InlineFeedback from './InlineFeedback';

interface FriendCardProps {
  friend: Friend;
  onContact: (id: string, type: 'REGULAR' | 'DEEP' | 'QUICK') => void;
  onDelete: (id: string) => void;
  onEdit: (friend: Friend) => void;
  onRequestMeeting: (friend: Friend) => void;
  feedback?: ActionFeedback;
  onDismissFeedback?: (friendId: string) => void;
}

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

  const canQuickTouch = (friend.quickTouchesAvailable || 0) > 0;
  const lastLog = friend.logs[0];

  const previousLog = friend.logs[1];
  const cadenceChanged = !!(lastLog && previousLog && lastLog.daysWaitGoal !== previousLog.daysWaitGoal);
  const cyclesToNextToken = Math.max(0, 2 - (friend.cyclesSinceLastQuickTouch || 0));

  const isDeepCooldown = friend.lastDeepConnection
    ? (new Date().getTime() - new Date(friend.lastDeepConnection).getTime()) < (24 * 60 * 60 * 1000)
    : false;

  const scoreReason = !lastLog
    ? 'No interactions logged yet. Score starts at 50 and shifts with your contact timing.'
    : lastLog.type === 'DEEP'
      ? `Deep connection logged (${lastLog.scoreDelta ?? 15} points). Deep interactions add a strong score boost.`
      : lastLog.type === 'QUICK'
        ? `Quick touch logged (+2 points). Quick touches are limited to 1 every 2 full contact cycles.`
        : (lastLog.percentageRemaining > 80
          ? `Regular contact happened very early (${lastLog.scoreDelta ?? -2} points). Repeating early check-ins can shorten this timer.`
          : lastLog.percentageRemaining <= 50
            ? `Regular contact landed in the sweet spot (${lastLog.scoreDelta ?? 10} points).`
            : `Regular contact logged on time (${lastLog.scoreDelta ?? 5} points).`);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative overflow-hidden transition-all duration-200 hover:shadow-md mb-4 group">
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
                <img src={friend.photo} alt={friend.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: getAvatarColor(friend.name) }}>
                  {getInitials(friend.name)}
                </div>
              )}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full ${plantStage.bg} border-2 border-white shadow-sm flex items-center justify-center z-10`} title={plantStage.label}>
              <PlantIcon size={16} className={plantStage.color} />
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 text-lg leading-tight truncate max-w-[150px]">{friend.name}</h3>
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

      <div className="mt-3 relative">
        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 px-1">
          <span>Needs Water</span>
          <span>Thriving</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
          <div className={`h-full transition-all duration-500 ease-out relative ${progressColorClass}`} style={{ width: `${visualPercentage}%` }}>
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20"></div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowMechanics(prev => !prev)}
        className="w-full mt-3 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs text-slate-600 flex items-center justify-between"
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
          <p>
            Quick touch tokens: <span className="font-semibold">{friend.quickTouchesAvailable || 0}</span>
            {friend.quickTouchesAvailable > 0 ? ' available now.' : ` (next token in ${cyclesToNextToken} regular/deep cycle(s)).`}
          </p>
          {cadenceChanged && (
            <p>
              Cadence update: <span className="font-semibold">{previousLog?.daysWaitGoal}d → {lastLog?.daysWaitGoal}d</span> from recent timing behavior.
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button onClick={() => onContact(friend.id, 'REGULAR')} className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-slate-900/10 hover:bg-slate-800">
          <CheckCircle2 size={16} />
          Water
        </button>

        <button
          onClick={() => { if (!isDeepCooldown) onContact(friend.id, 'DEEP'); }}
          className={`px-3 py-2 rounded-xl transition-colors border ${isDeepCooldown ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'text-pink-400 hover:bg-pink-50 hover:text-pink-600 border-slate-100 hover:border-pink-200'}`}
          title={isDeepCooldown ? 'Used recently' : 'Deep Connection (+15 points, extends timer by 12 hours)'}
        >
          <Heart size={20} fill={isDeepCooldown ? 'currentColor' : 'none'} />
        </button>

        <button
          onClick={() => { if (canQuickTouch) onContact(friend.id, 'QUICK'); }}
          className={`px-3 py-2 rounded-xl transition-colors border ${!canQuickTouch ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'text-yellow-500 hover:bg-yellow-50 hover:text-yellow-600 border-slate-100 hover:border-yellow-200'}`}
          title={!canQuickTouch ? 'Not available yet (1 token every 2 cycles)' : 'Quick Touch (+2 points, +30 min timer shift)'}
        >
          <Zap size={20} fill={!canQuickTouch ? 'none' : 'currentColor'} />
        </button>

        <button onClick={() => onRequestMeeting(friend)} className="px-3 py-2 rounded-xl text-slate-400 hover:bg-orange-50 hover:text-orange-600 transition-colors border border-slate-100 hover:border-orange-100" title="Create meeting request">
          <CalendarPlus size={20} />
        </button>

        <button onClick={() => onEdit(friend)} className="px-3 py-2 rounded-xl text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-100 hover:border-blue-100" title="Edit">
          <Edit2 size={20} />
        </button>

        {confirmDelete ? (
          <div className="flex gap-1">
            <button onClick={() => { onDelete(friend.id); setConfirmDelete(false); }} className="px-2 py-2 rounded-xl bg-red-500 text-white text-[10px] font-bold transition-colors" title="Confirm Delete">Yes</button>
            <button onClick={() => setConfirmDelete(false)} className="px-2 py-2 rounded-xl bg-slate-200 text-slate-600 text-[10px] font-bold transition-colors" title="Cancel">No</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="px-3 py-2 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors border border-slate-100 hover:border-red-100" title="Delete">
            <Trash2 size={20} />
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
