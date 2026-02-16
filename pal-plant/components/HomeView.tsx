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
import { Friend, MeetingRequest, AppSettings } from '../types';
import { calculateSocialGardenScore, calculateTimeStatus, getUpcomingBirthdays, getSmartNudges, getInitials, getAvatarColor, THEMES } from '../utils/helpers';
import { Trophy, Calendar, AlertTriangle, Gift, Sprout, Leaf, TrendingDown, TrendingUp, Lightbulb, CalendarDays, ChevronRight } from 'lucide-react';
import WeeklyPlanView from './WeeklyPlanView';

interface HomeViewProps {
  friends: Friend[];
  meetingRequests: MeetingRequest[];
  settings: AppSettings;
  onNavigateToFriend: (friendName: string) => void;
  onNavigateToMeetings: () => void;
  onApplyNudge?: (friendId: string, newFrequencyDays: number) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ friends, meetingRequests, settings, onNavigateToFriend, onNavigateToMeetings, onApplyNudge }) => {
  const theme = THEMES[settings.theme];
  const score = calculateSocialGardenScore(friends, meetingRequests);
  const birthdays = getUpcomingBirthdays(friends);
  const nudges = getSmartNudges(friends);
  const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(new Set());
  const [showWeeklyPlan, setShowWeeklyPlan] = useState(false);
  const activeNudges = nudges.filter(n => !dismissedNudges.has(n.friendId));
  const meetings = meetingRequests.filter(m => m.status === 'SCHEDULED').sort((a,b) => new Date(a.scheduledDate || '').getTime() - new Date(b.scheduledDate || '').getTime());

  // Find expiring timers (Less than 2 days)
  const withering = friends.filter(f => {
    const status = calculateTimeStatus(f.lastContacted, f.frequencyDays);
    return status.daysLeft <= 2;
  }).sort((a, b) => {
    return calculateTimeStatus(a.lastContacted, a.frequencyDays).daysLeft - calculateTimeStatus(b.lastContacted, b.frequencyDays).daysLeft;
  });


  const staleRequests = meetingRequests.filter(m => m.status === 'REQUESTED').sort((a, b) =>
    new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
  );

  const suggestedOutreach = [
    ...withering.slice(0, 2).map(f => ({
      id: `friend_${f.id}`,
      label: `Check in with ${f.name}`,
      detail: `${Math.max(0, Math.abs(calculateTimeStatus(f.lastContacted, f.frequencyDays).daysLeft))} day urgency`,
      action: () => onNavigateToFriend(f.name)
    })),
    ...birthdays.slice(0, 1).map(f => ({
      id: `birthday_${f.id}`,
      label: `Birthday coming up: ${f.name}`,
      detail: `Prep a message this week`,
      action: () => onNavigateToFriend(f.name)
    })),
    ...staleRequests.slice(0, 1).map(m => ({
      id: `meeting_${m.id}`,
      label: `Follow up meeting request for ${m.name}`,
      detail: `${Math.floor((Date.now() - new Date(m.dateAdded).getTime()) / (1000 * 60 * 60 * 24))} days waiting`,
      action: onNavigateToMeetings
    }))
  ].slice(0, 4);

  // Featured friend (pick one with a photo, or first friend)
  const friendsWithPhotos = friends.filter(f => f.photo);
  const randomFriend = friendsWithPhotos.length > 0
    ? friendsWithPhotos[Math.floor(Math.random() * friendsWithPhotos.length)]
    : null;

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500" role="main" aria-label="Dashboard">

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 to-emerald-100 p-6 border border-emerald-100 shadow-sm" role="region" aria-label="Garden score summary">
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
               <h2 className={`text-3xl font-black ${theme.textMain} tracking-tight`}>Hello!</h2>
               <p className={`${theme.textSub} font-medium mt-1`}>Your social garden score:</p>
            </div>
            <div className={`p-4 rounded-2xl bg-white shadow-sm flex flex-col items-center border ${theme.border}`}>
               <span className={`text-4xl font-black ${score > 75 ? 'text-emerald-600' : score > 40 ? 'text-yellow-600' : 'text-orange-600'}`} aria-label={`Garden score: ${score} out of 100`}>{score}</span>
               <Trophy size={14} className="text-slate-400 mt-1" aria-hidden="true" />
            </div>
          </div>
        </div>
        <Leaf className="absolute -bottom-8 -right-8 text-emerald-200 opacity-50 rotate-12" size={140} />
      </div>


      {/* Suggested Outreach Queue */}
      <div className={`${theme.cardBg} border ${theme.border} p-4 rounded-2xl shadow-sm`} role="region" aria-label="Today's suggested outreach">
        <div className={`flex items-center gap-2 mb-3 ${theme.textSub} font-bold uppercase tracking-wider text-xs`}>
          <Sprout size={16} /> Today's Suggested Outreach
        </div>
        {suggestedOutreach.length === 0 ? (
          <p className="text-sm opacity-50 italic">You're all caught up for now.</p>
        ) : (
          <div className="space-y-2">
            {suggestedOutreach.map(item => (
              <button key={item.id} onClick={item.action} className="w-full text-left p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                <p className="text-sm font-bold text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-500 mt-1">{item.detail}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Smart Nudges */}
      {activeNudges.length > 0 && (
        <div className={`${theme.cardBg} border ${theme.border} p-4 rounded-2xl shadow-sm`} role="region" aria-label="Smart cadence suggestions">
          <div className={`flex items-center gap-2 mb-3 ${theme.textSub} font-bold uppercase tracking-wider text-xs`}>
            <Lightbulb size={16} /> Cadence Suggestions
          </div>
          <div className="space-y-2">
            {activeNudges.map(nudge => (
              <div key={nudge.friendId} className={`p-3 rounded-xl border ${nudge.type === 'shorten' ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {nudge.type === 'shorten' ? (
                    <TrendingDown size={14} className="text-blue-500" />
                  ) : (
                    <TrendingUp size={14} className="text-amber-500" />
                  )}
                  <span className="font-bold text-sm text-slate-800">{nudge.friendName}</span>
                  <span className="text-[10px] text-slate-400 ml-auto">{nudge.currentDays}d → {nudge.suggestedDays}d</span>
                </div>
                <p className="text-xs text-slate-600 mb-2">{nudge.reason}</p>
                <div className="flex gap-2">
                  {onApplyNudge && (
                    <button
                      onClick={() => { onApplyNudge(nudge.friendId, nudge.suggestedDays); setDismissedNudges(prev => new Set(prev).add(nudge.friendId)); }}
                      className={`text-[10px] font-bold px-3 py-1 rounded-lg ${nudge.type === 'shorten' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'}`}
                      aria-label={`Apply ${nudge.suggestedDays}-day cadence for ${nudge.friendName}`}
                    >
                      Apply {nudge.suggestedDays}d
                    </button>
                  )}
                  <button
                    onClick={() => setDismissedNudges(prev => new Set(prev).add(nudge.friendId))}
                    className="text-[10px] font-bold px-3 py-1 rounded-lg bg-slate-100 text-slate-500"
                    aria-label={`Dismiss suggestion for ${nudge.friendName}`}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Plan Toggle */}
      {friends.length > 0 && (
        <div>
          <button
            onClick={() => setShowWeeklyPlan(prev => !prev)}
            className={`w-full flex items-center justify-between p-4 ${theme.cardBg} border ${theme.border} rounded-2xl shadow-sm hover:shadow-md transition-shadow`}
            aria-expanded={showWeeklyPlan}
            aria-controls="weekly-plan-section"
          >
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-indigo-500" />
              <span className="font-bold text-sm">7-Day Outreach Plan</span>
            </div>
            <ChevronRight size={16} className={`text-slate-400 transition-transform ${showWeeklyPlan ? 'rotate-90' : ''}`} />
          </button>
          {showWeeklyPlan && (
            <div id="weekly-plan-section" className="mt-3" role="region" aria-label="Weekly outreach plan">
              <WeeklyPlanView
                friends={friends}
                meetingRequests={meetingRequests}
                onNavigateToFriend={onNavigateToFriend}
                onNavigateToMeetings={onNavigateToMeetings}
              />
            </div>
          )}
        </div>
      )}

      {/* Featured Photo (only if user has uploaded photos) */}
      {randomFriend && randomFriend.photo && (
         <div className="relative group rounded-3xl overflow-hidden aspect-[16/9] shadow-md border border-slate-100">
            <img
               src={randomFriend.photo}
               alt={`Photo of ${randomFriend.name}`}
               className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
               <p className="text-white font-bold text-lg flex items-center gap-2">
                 <Sprout size={18} className="text-green-300" />
                 {randomFriend.name}
               </p>
            </div>
         </div>
      )}

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 gap-4">

         {/* Withering Plants */}
         {withering.length > 0 && (
           <div className="bg-red-50 border border-red-100 p-4 rounded-2xl" role="region" aria-label="Plants needing attention">
              <div className="flex items-center gap-2 mb-3 text-red-800 font-bold uppercase tracking-wider text-xs">
                 <AlertTriangle size={16} /> Withering Plants
              </div>
              <div className="space-y-2">
                 {withering.slice(0, 3).map(f => (
                   <button
                     key={f.id}
                     onClick={() => onNavigateToFriend(f.name)}
                     className="w-full flex justify-between items-center bg-white/60 p-2 rounded-xl hover:bg-white transition-colors"
                   >
                      <span className="font-bold text-slate-700">{f.name}</span>
                      <span className="text-xs font-bold text-red-500">
                        {calculateTimeStatus(f.lastContacted, f.frequencyDays).daysLeft} days
                      </span>
                   </button>
                 ))}
              </div>
           </div>
         )}

         {/* Birthdays */}
         <div className={`${theme.cardBg} border ${theme.border} p-4 rounded-2xl shadow-sm`}>
            <div className={`flex items-center gap-2 mb-3 ${theme.textSub} font-bold uppercase tracking-wider text-xs`}>
               <Gift size={16} /> Upcoming Birthdays
            </div>
            {birthdays.length === 0 ? (
               <p className="text-sm opacity-50 italic">No birthdays coming up.</p>
            ) : (
               <div className="space-y-2">
                 {birthdays.map(f => (
                    <button key={f.id} onClick={() => onNavigateToFriend(f.name)} className="w-full text-left flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                       <div
                         className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                         style={{ backgroundColor: getAvatarColor(f.name) }}
                       >
                         {f.photo ? (
                           <img src={f.photo} className="w-full h-full object-cover rounded-full" alt={f.name} />
                         ) : (
                           getInitials(f.name)
                         )}
                       </div>
                       <div>
                          <p className={`font-bold text-sm ${theme.textMain}`}>{f.name}</p>
                          <p className="text-xs opacity-60">Born {f.birthday}</p>
                       </div>
                    </button>
                 ))}
               </div>
            )}
         </div>

         {/* Meetings */}
         <div className={`${theme.cardBg} border ${theme.border} p-4 rounded-2xl shadow-sm`}>
            <div className={`flex items-center gap-2 mb-3 ${theme.textSub} font-bold uppercase tracking-wider text-xs`}>
               <Calendar size={16} /> Upcoming Meetings
            </div>
            {meetings.length === 0 ? (
               <p className="text-sm opacity-50 italic">No meetings scheduled.</p>
            ) : (
               <div className="space-y-2">
                 {meetings.slice(0, 3).map(m => (
                    <button key={m.id} onClick={onNavigateToMeetings} className="w-full text-left p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                       <p className="font-bold text-sm text-slate-800">{m.name}</p>
                       <div className="flex justify-between mt-1 text-xs text-slate-500">
                          <span>{new Date(m.scheduledDate!).toLocaleDateString()}</span>
                          <span>{m.location}</span>
                       </div>
                    </button>
                 ))}
               </div>
            )}
         </div>

      </div>

    </div>
  );
};

export default HomeView;
