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
import { Trophy, Calendar, AlertTriangle, Gift, TrendingDown, TrendingUp, Lightbulb, CalendarDays, ChevronRight } from 'lucide-react';
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
  const meetings = meetingRequests
    .filter(m => m.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.scheduledDate || '').getTime() - new Date(b.scheduledDate || '').getTime());

  const withering = friends
    .filter(f => calculateTimeStatus(f.lastContacted, f.frequencyDays).daysLeft <= 2)
    .sort((a, b) => calculateTimeStatus(a.lastContacted, a.frequencyDays).daysLeft - calculateTimeStatus(b.lastContacted, b.frequencyDays).daysLeft);

  const staleRequests = meetingRequests
    .filter(m => m.status === 'REQUESTED')
    .sort((a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime());

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
      detail: 'Prep a message this week',
      action: () => onNavigateToFriend(f.name)
    })),
    ...staleRequests.slice(0, 1).map(m => ({
      id: `meeting_${m.id}`,
      label: `Follow up meeting request for ${m.name}`,
      detail: `${Math.floor((Date.now() - new Date(m.dateAdded).getTime()) / (1000 * 60 * 60 * 24))} days waiting`,
      action: onNavigateToMeetings
    }))
  ].slice(0, 4);

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300" role="main" aria-label="Dashboard">
      <section className={`${theme.cardBg} border ${theme.border} rounded-2xl p-5 shadow-sm`} role="region" aria-label="Score summary">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-xs uppercase tracking-[0.16em] font-bold ${theme.textSub}`}>Relationship score</p>
            <h2 className={`text-2xl font-black mt-1 ${theme.textMain}`}>Stay consistent, stay connected.</h2>
            <p className={`text-sm mt-2 ${theme.textSub}`}>Small check-ins compound over time.</p>
          </div>
          <div className={`min-w-[86px] h-[86px] rounded-2xl border ${theme.border} ${theme.cardBg} flex flex-col items-center justify-center`}>
            <span className={`text-3xl font-black ${score > 75 ? 'text-emerald-600' : score > 40 ? 'text-amber-500' : 'text-rose-500'}`}>{score}</span>
            <Trophy size={14} className={theme.textSub} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3" aria-label="Quick stats">
        <div className={`${theme.cardBg} border ${theme.border} rounded-xl p-3`}>
          <p className={`text-xs font-semibold ${theme.textSub}`}>Needs attention</p>
          <p className={`text-2xl font-black mt-1 ${theme.textMain}`}>{withering.length}</p>
        </div>
        <div className={`${theme.cardBg} border ${theme.border} rounded-xl p-3`}>
          <p className={`text-xs font-semibold ${theme.textSub}`}>Upcoming meetings</p>
          <p className={`text-2xl font-black mt-1 ${theme.textMain}`}>{meetings.length}</p>
        </div>
      </section>

      <section className={`${theme.cardBg} border ${theme.border} p-4 rounded-2xl shadow-sm`} role="region" aria-label="Today's suggested outreach">
        <div className={`font-bold uppercase tracking-wider text-xs mb-3 ${theme.textSub}`}>Suggested outreach</div>
        {suggestedOutreach.length === 0 ? (
          <p className="text-sm opacity-60 italic">You're all caught up for now.</p>
        ) : (
          <div className="space-y-2">
            {suggestedOutreach.map(item => (
              <button key={item.id} onClick={item.action} className={`w-full text-left p-3 ${theme.cardBg} rounded-xl border ${theme.border}`}>
                <p className={`text-sm font-bold ${theme.textMain}`}>{item.label}</p>
                <p className={`text-xs mt-1 ${theme.textSub}`}>{item.detail}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      {activeNudges.length > 0 && (
        <section className={`${theme.cardBg} border ${theme.border} p-4 rounded-2xl shadow-sm`} role="region" aria-label="Smart cadence suggestions">
          <div className={`flex items-center gap-2 mb-3 ${theme.textSub} font-bold uppercase tracking-wider text-xs`}>
            <Lightbulb size={16} /> Cadence suggestions
          </div>
          <div className="space-y-2">
            {activeNudges.map(nudge => (
              <div key={nudge.friendId} className={`p-3 rounded-xl border ${theme.border}`}>
                <div className="flex items-center gap-2 mb-1">
                  {nudge.type === 'shorten' ? <TrendingDown size={14} className="text-blue-500" /> : <TrendingUp size={14} className="text-amber-500" />}
                  <span className={`font-bold text-sm ${theme.textMain}`}>{nudge.friendName}</span>
                  <span className={`text-[10px] ${theme.textSub} ml-auto`}>{nudge.currentDays}d → {nudge.suggestedDays}d</span>
                </div>
                <p className={`text-xs ${theme.textSub} mb-2`}>{nudge.reason}</p>
                <div className="flex gap-2">
                  {onApplyNudge && (
                    <button
                      onClick={() => {
                        onApplyNudge(nudge.friendId, nudge.suggestedDays);
                        setDismissedNudges(prev => new Set(prev).add(nudge.friendId));
                      }}
                      className={`text-[10px] font-bold px-3 py-1 rounded-lg ${nudge.type === 'shorten' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'}`}
                    >
                      Apply {nudge.suggestedDays}d
                    </button>
                  )}
                  <button
                    onClick={() => setDismissedNudges(prev => new Set(prev).add(nudge.friendId))}
                    className={`text-[10px] font-bold px-3 py-1 rounded-lg border ${theme.border} ${theme.textSub}`}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4">
        {withering.length > 0 && (
          <section className="bg-red-50 border border-red-100 p-4 rounded-2xl" role="region" aria-label="Contacts needing attention">
            <div className="flex items-center gap-2 mb-3 text-red-800 font-bold uppercase tracking-wider text-xs">
              <AlertTriangle size={16} /> Needs attention
            </div>
            <div className="space-y-2">
              {withering.slice(0, 3).map(f => (
                <button key={f.id} onClick={() => onNavigateToFriend(f.name)} className="w-full flex justify-between items-center bg-white/70 p-2 rounded-xl">
                  <span className={`font-bold ${theme.textMain}`}>{f.name}</span>
                  <span className="text-xs font-bold text-red-500">{calculateTimeStatus(f.lastContacted, f.frequencyDays).daysLeft} days</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className={`${theme.cardBg} border ${theme.border} p-4 rounded-2xl shadow-sm`}>
          <div className={`flex items-center gap-2 mb-3 ${theme.textSub} font-bold uppercase tracking-wider text-xs`}>
            <Gift size={16} /> Upcoming birthdays
          </div>
          {birthdays.length === 0 ? (
            <p className="text-sm opacity-60 italic">No birthdays coming up.</p>
          ) : (
            <div className="space-y-2">
              {birthdays.map(f => (
                <button key={f.id} onClick={() => onNavigateToFriend(f.name)} className="w-full text-left flex items-center gap-3 p-2 rounded-xl">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: getAvatarColor(f.name) }}>
                    {f.photo ? <img src={f.photo} className="w-full h-full object-cover rounded-full" alt={f.name} /> : getInitials(f.name)}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${theme.textMain}`}>{f.name}</p>
                    <p className={`text-xs ${theme.textSub}`}>Born {f.birthday}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={`${theme.cardBg} border ${theme.border} p-4 rounded-2xl shadow-sm`}>
          <div className={`flex items-center gap-2 mb-3 ${theme.textSub} font-bold uppercase tracking-wider text-xs`}>
            <Calendar size={16} /> Upcoming meetings
          </div>
          {meetings.length === 0 ? (
            <p className="text-sm opacity-60 italic">No meetings scheduled.</p>
          ) : (
            <div className="space-y-2">
              {meetings.slice(0, 3).map(m => (
                <button key={m.id} onClick={onNavigateToMeetings} className={`w-full text-left p-3 rounded-xl border ${theme.border}`}>
                  <p className={`font-bold text-sm ${theme.textMain}`}>{m.name}</p>
                  <div className={`flex justify-between mt-1 text-xs ${theme.textSub}`}>
                    <span>{new Date(m.scheduledDate!).toLocaleDateString()}</span>
                    <span>{m.location}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {friends.length > 0 && (
        <div>
          <button
            onClick={() => setShowWeeklyPlan(prev => !prev)}
            className={`w-full flex items-center justify-between p-4 ${theme.cardBg} border ${theme.border} rounded-2xl shadow-sm`}
            aria-expanded={showWeeklyPlan}
            aria-controls="weekly-plan-section"
          >
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-indigo-500" />
              <span className="font-bold text-sm">7-Day outreach plan</span>
            </div>
            <ChevronRight size={16} className={`${theme.textSub} transition-transform ${showWeeklyPlan ? 'rotate-90' : ''}`} />
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
    </div>
  );
};

export default HomeView;
