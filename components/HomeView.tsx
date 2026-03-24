/*
 * Copyright 2026 Jeffrey Guntly (JX Holdings, LLC)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

import React, { useState } from 'react';
import { Friend, MeetingRequest, AppSettings } from '../types';
import { calculateSocialGardenScore, calculateTimeStatus, getUpcomingBirthdays, getSmartNudges, getThemeColors } from '../utils/helpers';
import { ChevronRight } from 'lucide-react';
import WeeklyPlanView from './WeeklyPlanView';

interface HomeViewProps {
  friends: Friend[];
  meetingRequests: MeetingRequest[];
  settings: AppSettings;
  onNavigateToFriend: (friendName: string) => void;
  onNavigateToMeetings: () => void;
  onApplyNudge?: (friendId: string, newFrequencyDays: number) => void;
}

const CircularGauge: React.FC<{ score: number }> = ({ score }) => {
  const clamped = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 30;
  const offset = circumference - (clamped / 100) * circumference;
  const color = clamped < 40 ? '#E2725B' : '#8A9A5B';

  return (
    <div className="relative w-20 h-20 mx-auto">
      <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="36" cy="36" r="30" stroke="#E7D8C6" strokeWidth="6" fill="none" />
        <circle
          cx="36"
          cy="36"
          r="30"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="none"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-brand-ink">{clamped}</div>
    </div>
  );
};

const HomeView: React.FC<HomeViewProps> = ({ friends, meetingRequests, settings, onNavigateToFriend, onNavigateToMeetings, onApplyNudge }) => {
  const theme = getThemeColors(settings.theme, settings.highContrast);
  const score = calculateSocialGardenScore(friends, meetingRequests);
  const birthdays = getUpcomingBirthdays(friends).slice(0, 2);
  const nudges = getSmartNudges(friends);
  const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(new Set());
  const [showWeeklyPlan, setShowWeeklyPlan] = useState(false);

  const activeNudges = nudges.filter(n => !dismissedNudges.has(n.friendId));
  const meetings = meetingRequests.filter(m => m.status === 'SCHEDULED');
  const withering = friends
    .filter(f => calculateTimeStatus(f.lastContacted, f.frequencyDays).daysLeft <= 2)
    .sort((a, b) => calculateTimeStatus(a.lastContacted, a.frequencyDays).daysLeft - calculateTimeStatus(b.lastContacted, b.frequencyDays).daysLeft)
    .slice(0, 4);

  const tasks: Array<{ id: string; title: string; detail: string; action: () => void }> = [
    ...withering.map(f => ({
      id: `attention-${f.id}`,
      title: `Check in with ${f.name}`,
      detail: `${calculateTimeStatus(f.lastContacted, f.frequencyDays).daysLeft} days left`,
      action: () => onNavigateToFriend(f.name)
    })),
    ...birthdays.map(f => ({
      id: `birthday-${f.id}`,
      title: `Birthday soon: ${f.name}`,
      detail: f.birthday || 'Upcoming birthday',
      action: () => onNavigateToFriend(f.name)
    })),
    ...(meetings.length > 0
      ? [{ id: 'meetings', title: `Review ${meetings.length} upcoming meeting${meetings.length > 1 ? 's' : ''}`, detail: 'Open meetings tab', action: onNavigateToMeetings }]
      : [])
  ].slice(0, 6);

  return (
    <div className="space-y-4 pb-24" role="main" aria-label="Dashboard">
      <section className="grid grid-cols-3 gap-2">
        <div className={`${theme.cardBg} border ${theme.border} rounded-sm p-3 text-center`}>
          <p className={`text-[11px] uppercase tracking-wide ${theme.textSub}`}>Garden Score</p>
          <CircularGauge score={score} />
        </div>
        <div className={`${theme.cardBg} border ${theme.border} rounded-sm p-3 flex flex-col justify-between`}>
          <p className={`text-[11px] uppercase tracking-wide ${theme.textSub}`}>Attention</p>
          <p className={`text-3xl font-bold leading-none ${theme.textMain}`}>{withering.length}</p>
          <p className={`text-[11px] ${theme.textSub}`}>Need outreach</p>
        </div>
        <div className={`${theme.cardBg} border ${theme.border} rounded-sm p-3 flex flex-col justify-between`}>
          <p className={`text-[11px] uppercase tracking-wide ${theme.textSub}`}>Meetings</p>
          <p className={`text-3xl font-bold leading-none ${theme.textMain}`}>{meetings.length}</p>
          <p className={`text-[11px] ${theme.textSub}`}>Scheduled</p>
        </div>
      </section>

      <section className={`${theme.cardBg} border ${theme.border} rounded-sm p-4`}>
        <p className={`text-xs uppercase tracking-wide mb-3 ${theme.textSub}`}>Curated Tasks</p>
        {tasks.length === 0 ? (
          <p className={`text-sm ${theme.textSub}`}>Nothing urgent right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tasks.map(task => (
              <button key={task.id} onClick={task.action} className={`w-full text-left border ${theme.border} rounded-sm p-3 hover:bg-brand-cream/50 transition-colors`}>
                <p className={`text-sm font-semibold ${theme.textMain}`}>{task.title}</p>
                <p className={`text-xs mt-1 ${theme.textSub}`}>{task.detail}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      {activeNudges.length > 0 && (
        <section className={`${theme.cardBg} border ${theme.border} rounded-sm p-4`}>
          <p className={`text-xs uppercase tracking-wide mb-3 ${theme.textSub}`}>Cadence</p>
          <div className="space-y-2">
            {activeNudges.slice(0, 3).map(nudge => (
              <div key={nudge.friendId} className={`border ${theme.border} rounded-sm p-3`}>
                <p className={`text-sm font-semibold ${theme.textMain}`}>{nudge.friendName}</p>
                <p className={`text-xs mt-1 ${theme.textSub}`}>{nudge.currentDays}d → {nudge.suggestedDays}d · {nudge.reason}</p>
                <div className="flex gap-2 mt-2">
                  {onApplyNudge && (
                    <button
                      onClick={() => {
                        onApplyNudge(nudge.friendId, nudge.suggestedDays);
                        setDismissedNudges(prev => new Set(prev).add(nudge.friendId));
                      }}
                      className="text-[11px] font-semibold px-3 py-1 rounded-sm bg-brand-sage text-white"
                    >
                      Apply
                    </button>
                  )}
                  <button
                    onClick={() => setDismissedNudges(prev => new Set(prev).add(nudge.friendId))}
                    className="text-[11px] font-semibold px-3 py-1 rounded-sm border border-brand-tan"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {friends.length > 0 && (
        <button
          onClick={() => setShowWeeklyPlan(prev => !prev)}
          className={`w-full flex items-center justify-between p-4 ${theme.cardBg} border ${theme.border} rounded-sm`}
          aria-expanded={showWeeklyPlan}
          aria-controls="weekly-plan-section"
        >
          <span className="font-semibold text-sm">7-day plan</span>
          <ChevronRight size={16} className={`transition-transform ${showWeeklyPlan ? 'rotate-90' : ''}`} />
        </button>
      )}

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
  );
};

export default HomeView;
