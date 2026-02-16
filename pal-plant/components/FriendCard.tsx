import React, { useState, useCallback } from 'react';
import { Phone, CheckCircle2, AlertCircle, Edit2, Trash2, Mail, MessageCircle, CalendarPlus, Cake, Droplets, Heart, Zap, ChevronDown, ChevronUp, PhoneCall, Video, Users } from 'lucide-react';
import { ActionFeedback, ContactChannel, Friend } from '../types';
import { calculateTimeStatus, getProgressBarColor, getStatusColor, getPlantStage, getInitials, getAvatarColor } from '../utils/helpers';
import InlineFeedback from './InlineFeedback';
import { useTheme } from '../utils/ThemeContext';

interface FriendCardProps {
  friend: Friend;
  onContact: (id: string, type: 'REGULAR' | 'DEEP' | 'QUICK', channel?: ContactChannel) => void;
  onDelete: (id: string) => void;
  onEdit: (friend: Friend) => void;
  onRequestMeeting: (friend: Friend) => void;
  feedback?: ActionFeedback;
  onDismissFeedback?: (friendId: string) => void;
}

const CHANNEL_OPTIONS: { value: ContactChannel; label: string; icon: typeof Phone }[] = [
  { value: 'call', label: 'Call', icon: PhoneCall },
  { value: 'text', label: 'Text', icon: MessageCircle },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'in-person', label: 'In Person', icon: Users },
];

const FriendCard: React.FC<FriendCardProps> = ({ friend, onContact, onDelete, onEdit, onRequestMeeting, feedback, onDismissFeedback }) => {
  const theme = useTheme();
  const { percentageLeft, daysLeft, isOverdue } = calculateTimeStatus(friend.lastContacted, friend.frequencyDays);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showMechanics, setShowMechanics] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ContactChannel>('call');
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

  // Deep connection cooldown: 24 hours with 20% buffer = 28.8 hours actual
  const isDeepCooldown = friend.lastDeepConnection
    ? (new Date().getTime() - new Date(friend.lastDeepConnection).getTime()) < (24 * 60 * 60 * 1000 * 1.2)
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
    <div className={`${theme.cardBg} rounded-2xl p-5 shadow-sm border ${theme.border} relative overflow-hidden transition-all duration-200 hover:shadow-md mb-4 group`} role="article" aria-label={`Friend card for ${friend.name}`}>
      
      {/* ZONE 1: Identity Section */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar with Plant Stage Badge */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden border-4 border-white shadow-sm group-hover:scale-105 transition-transform">
            {friend.photo ? (
              <img src={friend.photo} alt={`Photo of ${friend.name}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: getAvatarColor(friend.name) }}>
                {getInitials(friend.name)}
              </div>
            )}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full ${plantStage.bg} border-2 border-white shadow-sm flex items-center justify-center`} title={plantStage.label}>
            <PlantIcon size={16} className={plantStage.color} />
          </div>
        </div>

        {/* Name and Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold ${theme.textMain} text-xl leading-tight truncate`}>{friend.name}</h3>
              <p className={`text-[11px] font-bold uppercase tracking-wider mt-0.5 ${plantStage.color}`}>{plantStage.label}</p>
            </div>
            
            {/* Score Badge */}
            <span className={`text-sm font-black px-3 py-1.5 rounded-lg border flex-shrink-0 ${friend.individualScore > 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : friend.individualScore < 40 ? 'bg-red-50 text-red-500 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
              {Math.round(friend.individualScore || 50)}
            </span>
          </div>

          {/* Contact Methods and Category */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {friend.phone && (
              <a href={`tel:${friend.phone}`} className={`${theme.textSub} hover:text-green-600 transition-colors`} title="Call"><Phone size={14} /></a>
            )}
            {friend.phone && (
              <a href={`sms:${friend.phone}`} className={`${theme.textSub} hover:text-blue-500 transition-colors`} title="Text"><MessageCircle size={14} /></a>
            )}
            {friend.email && <a href={`mailto:${friend.email}`} className={`${theme.textSub} hover:text-purple-500 transition-colors`} title="Email"><Mail size={14} /></a>}
            
            <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.surfaceHover} ${theme.textSub} px-2 py-0.5 rounded-md ml-auto`}>
              {friend.category}
            </span>
            
            {friend.birthday && (
              <div className="flex items-center gap-1 text-[10px] text-pink-500 bg-pink-50 px-2 py-0.5 rounded-md font-bold">
                <Cake size={10} />
                {friend.birthday}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ZONE 2: Status Summary */}
      <div className="mb-4 space-y-2">
        {/* Timer Status Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${statusColorClass}`}>
          {isOverdue ? <AlertCircle size={12} /> : <Droplets size={12} />}
          {isOverdue ? `${Math.abs(daysLeft)} days overdue` : `Water in ${daysLeft} days`}
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-[10px] font-semibold ${theme.textSub} mb-1">
            <span>Needs Attention</span>
            <span>Thriving</span>
          </div>
          <div className={`w-full h-2.5 ${theme.surfaceHover} rounded-full overflow-hidden border ${theme.border}`} role="progressbar" aria-valuenow={Math.round(visualPercentage)} aria-valuemin={0} aria-valuemax={100} aria-label={`Contact timer: ${isOverdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days remaining`}`}>
            <div className={`h-full transition-all duration-500 ease-out ${progressColorClass}`} style={{ width: `${visualPercentage}%` }}></div>
          </div>
        </div>
      </div>
      {/* Expandable Score Details */}
      <button
        onClick={() => setShowMechanics(prev => !prev)}
        className={`w-full mt-1 mb-3 p-2.5 rounded-lg ${theme.surfaceHover} hover:${theme.surfaceActive.replace('bg-', '')} text-xs ${theme.textSub} font-semibold flex items-center justify-between transition-colors`}
      >
        <span className="font-semibold">Why score changed?</span>
        {showMechanics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showMechanics && (
        <div className={`mt-2 p-3 rounded-xl border ${theme.border} ${theme.cardBg} text-xs ${theme.textSub} space-y-2`}>
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

      {/* ZONE 3: Actions */}
      <div className="space-y-3">
        {/* Channel Selector */}
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-semibold ${theme.textSub} uppercase tracking-wider`}>Contact via:</span>
          {CHANNEL_OPTIONS.map(ch => {
            const Icon = ch.icon;
            return (
              <button
                key={ch.value}
                onClick={() => setSelectedChannel(ch.value)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                  selectedChannel === ch.value
                    ? `${theme.primary} ${theme.primaryText} ${theme.borderStrong}`
                    : `${theme.surfaceHover} ${theme.textSub} ${theme.border} hover:${theme.surfaceActive.replace('bg-', '')}`
                }`}
              >
                <Icon size={11} />
                <span className="hidden sm:inline">{ch.label}</span>
              </button>
            );
          })}
        </div>

        {/* Primary Action Row */}
        <div className="flex gap-2">
          <button 
            onClick={() => onContact(friend.id, 'REGULAR', selectedChannel)} 
            className={`flex-1 ${theme.primary} ${theme.primaryText} py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm hover:${theme.primaryHover.replace('bg-', '')}`} 
            aria-label={`Water ${friend.name} — log regular contact`}
          >
            <CheckCircle2 size={18} aria-hidden="true" />
            Water Plant
          </button>

          <button
            onClick={() => { if (!isDeepCooldown) onContact(friend.id, 'DEEP', selectedChannel); }}
            className={`px-4 py-3 rounded-xl font-bold transition-all border ${isDeepCooldown ? `${theme.surfaceHover} ${theme.textDisabled} ${theme.border} cursor-not-allowed` : `text-pink-500 bg-pink-50 hover:bg-pink-100 border-pink-200`}`}
            title={isDeepCooldown ? 'Used recently — 24hr cooldown' : 'Deep Connection (+15 points, +12hr bonus)'}
            aria-label={isDeepCooldown ? `Deep connection unavailable for ${friend.name}` : `Deep connection with ${friend.name}`}
            aria-disabled={isDeepCooldown}
          >
            <Heart size={20} fill={isDeepCooldown ? 'currentColor' : 'none'} />
          </button>

          <button
            onClick={() => { if (canQuickTouch) onContact(friend.id, 'QUICK', selectedChannel); }}
            className={`px-4 py-3 rounded-xl font-bold transition-all border ${!canQuickTouch ? `${theme.surfaceHover} ${theme.textDisabled} ${theme.border} cursor-not-allowed` : `text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border-yellow-200`}`}
            title={!canQuickTouch ? 'Not available yet (earn 1 token per 2 cycles)' : 'Quick Touch (+2 points, +30min bonus)'}
            aria-label={!canQuickTouch ? `Quick touch unavailable for ${friend.name}` : `Quick touch ${friend.name}`}
            aria-disabled={!canQuickTouch}
          >
            <Zap size={20} fill={!canQuickTouch ? 'none' : 'currentColor'} />
          </button>
        </div>

        {/* Secondary Actions Row */}
        <div className="flex gap-2">
          <button 
            onClick={() => onRequestMeeting(friend)} 
            className={`flex-1 ${theme.surfaceHover} ${theme.textSub} py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 hover:${theme.surfaceActive.replace('bg-', '')} transition-colors border ${theme.border}`}
            aria-label={`Schedule meeting with ${friend.name}`}
          >
            <CalendarPlus size={16} />
            Schedule
          </button>

          <button 
            onClick={() => onEdit(friend)} 
            className={`flex-1 ${theme.surfaceHover} ${theme.textSub} py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 hover:${theme.surfaceActive.replace('bg-', '')} transition-colors border ${theme.border}`}
            aria-label={`Edit ${friend.name}`}
          >
            <Edit2 size={16} />
            Edit
          </button>

          {confirmDelete ? (
            <>
              <button 
                onClick={() => { onDelete(friend.id); setConfirmDelete(false); }} 
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-bold text-xs transition-colors"
              >
                Confirm
              </button>
              <button 
                onClick={() => setConfirmDelete(false)} 
                className={`flex-1 ${theme.surfaceActive} ${theme.textSub} py-2 rounded-lg font-bold text-xs transition-colors`}
              >
                Cancel
              </button>
            </>
          ) : (
            <button 
              onClick={() => setConfirmDelete(true)} 
              className={`flex-1 ${theme.surfaceHover} text-red-500 py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 hover:bg-red-50 transition-colors border ${theme.border} hover:border-red-200`}
              aria-label={`Delete ${friend.name}`}
            >
              <Trash2 size={16} />
              Delete
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <InlineFeedback feedback={feedback} onDismiss={handleDismissFeedback} />
      )}
    </div>
  );
};

export default FriendCard;
