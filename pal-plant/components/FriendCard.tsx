import React, { useState } from 'react';
import { Phone, CheckCircle2, AlertCircle, Edit2, Trash2, Mail, MessageCircle, CalendarPlus, Cake, Droplets, Heart, Zap } from 'lucide-react';
import { Friend } from '../types';
import { calculateTimeStatus, getProgressBarColor, getStatusColor, getPlantStage, getInitials, getAvatarColor } from '../utils/helpers';

interface FriendCardProps {
  friend: Friend;
  onContact: (id: string, type: 'REGULAR' | 'DEEP' | 'QUICK') => void;
  onDelete: (id: string) => void;
  onEdit: (friend: Friend) => void;
  onRequestMeeting: (friend: Friend) => void;
}

const FriendCard: React.FC<FriendCardProps> = ({ friend, onContact, onDelete, onEdit, onRequestMeeting }) => {
  const { percentageLeft, daysLeft, isOverdue } = calculateTimeStatus(friend.lastContacted, friend.frequencyDays);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Clamp percentage for the visual bar (0 to 100)
  const visualPercentage = Math.min(Math.max(percentageLeft, 0), 100);
  const statusColorClass = getStatusColor(percentageLeft);
  const progressColorClass = getProgressBarColor(percentageLeft);

  // Get Plant Metaphor
  const plantStage = getPlantStage(percentageLeft);
  const PlantIcon = plantStage.icon;

  // Logic for Special Buttons
  const canQuickTouch = (friend.quickTouchesAvailable || 0) > 0;

  const isDeepCooldown = friend.lastDeepConnection
    ? (new Date().getTime() - new Date(friend.lastDeepConnection).getTime()) < (24 * 60 * 60 * 1000)
    : false;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative overflow-hidden transition-all duration-200 hover:shadow-md mb-4 group">

      {/* Right Side Info Column */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
         <div className="flex items-center gap-1">
            {/* Score Badge */}
            <span className={`text-[10px] font-black px-2 py-1 rounded-md border ${friend.individualScore > 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : friend.individualScore < 40 ? 'bg-red-50 text-red-500 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
               {Math.round(friend.individualScore || 50)}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
                {friend.category}
            </span>
         </div>

         <div className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 w-fit ${statusColorClass}`}>
          {isOverdue ? <AlertCircle size={10} /> : <Droplets size={10} />}
          {isOverdue
            ? `${Math.abs(daysLeft)}d late`
            : `${daysLeft}d water`
          }
        </div>
      </div>

      <div className="flex justify-between items-start mb-3 mt-1 mr-24">
        <div className="flex items-center gap-4">
          {/* Avatar Container */}
          <div className="relative">
             <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 border-4 border-white shadow-sm relative group-hover:scale-105 transition-transform z-0">
               {friend.photo ? (
                 <img
                   src={friend.photo}
                   alt={friend.name}
                   className="w-full h-full object-cover"
                 />
               ) : (
                 <div
                   className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
                   style={{ backgroundColor: getAvatarColor(friend.name) }}
                 >
                   {getInitials(friend.name)}
                 </div>
               )}
             </div>
             {/* Plant Stage Badge */}
             <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full ${plantStage.bg} border-2 border-white shadow-sm flex items-center justify-center z-10`} title={plantStage.label}>
                <PlantIcon size={16} className={plantStage.color} />
             </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 text-lg leading-tight truncate max-w-[150px]">{friend.name}</h3>
            <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${plantStage.color}`}>{plantStage.label}</p>

            {/* Quick Contact Actions */}
            <div className="flex items-center gap-3 mt-2">
               {friend.phone && (
                 <>
                   <a href={`tel:${friend.phone}`} className="text-slate-400 hover:text-green-600 transition-colors" title="Call">
                      <Phone size={14} />
                   </a>
                   <a href={`sms:${friend.phone}`} className="text-slate-400 hover:text-blue-500 transition-colors" title="Text">
                      <MessageCircle size={14} />
                   </a>
                 </>
               )}
               {friend.email && (
                  <a href={`mailto:${friend.email}`} className="text-slate-400 hover:text-purple-500 transition-colors" title="Email">
                      <Mail size={14} />
                  </a>
               )}
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

      {/* Progress Bar (Water Level) */}
      <div className="mt-3 relative">
         <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 px-1">
            <span>Needs Water</span>
            <span>Thriving</span>
         </div>
         <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
           <div
             className={`h-full transition-all duration-500 ease-out relative ${progressColorClass}`}
             style={{ width: `${visualPercentage}%` }}
           >
              {/* Shine effect */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20"></div>
           </div>
         </div>
      </div>

      <div className="flex gap-2 mt-4">
        {/* Main Water Button */}
        <button
          onClick={() => onContact(friend.id, 'REGULAR')}
          className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-slate-900/10 hover:bg-slate-800"
        >
          <CheckCircle2 size={16} />
          Water
        </button>

        {/* Deep Connection Button */}
        <button
          onClick={() => { if(!isDeepCooldown) onContact(friend.id, 'DEEP'); }}
          className={`px-3 py-2 rounded-xl transition-colors border ${isDeepCooldown ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'text-pink-400 hover:bg-pink-50 hover:text-pink-600 border-slate-100 hover:border-pink-200'}`}
          title={isDeepCooldown ? "Used recently" : "Deep Connection (Extends timer & Boosts score)"}
        >
          <Heart size={20} fill={isDeepCooldown ? "currentColor" : "none"} />
        </button>

         {/* Quick Touch Button */}
        <button
          onClick={() => { if(canQuickTouch) onContact(friend.id, 'QUICK'); }}
          className={`px-3 py-2 rounded-xl transition-colors border ${!canQuickTouch ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'text-yellow-500 hover:bg-yellow-50 hover:text-yellow-600 border-slate-100 hover:border-yellow-200'}`}
          title={!canQuickTouch ? "Not available yet" : "Quick Touch (+30 mins, small boost)"}
        >
          <Zap size={20} fill={!canQuickTouch ? "none" : "currentColor"} />
        </button>

        <button
          onClick={() => onRequestMeeting(friend)}
          className="px-3 py-2 rounded-xl text-slate-400 hover:bg-orange-50 hover:text-orange-600 transition-colors border border-slate-100 hover:border-orange-100"
          title="Meeting Requested"
        >
          <CalendarPlus size={20} />
        </button>

        <button
          onClick={() => onEdit(friend)}
          className="px-3 py-2 rounded-xl text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-100 hover:border-blue-100"
          title="Edit"
        >
          <Edit2 size={20} />
        </button>

        {/* Two-step delete: first click shows confirm, second click deletes */}
        {confirmDelete ? (
          <div className="flex gap-1">
            <button
              onClick={() => { onDelete(friend.id); setConfirmDelete(false); }}
              className="px-2 py-2 rounded-xl bg-red-500 text-white text-[10px] font-bold transition-colors"
              title="Confirm Delete"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-2 rounded-xl bg-slate-200 text-slate-600 text-[10px] font-bold transition-colors"
              title="Cancel"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-3 py-2 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors border border-slate-100 hover:border-red-100"
            title="Delete"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default FriendCard;
