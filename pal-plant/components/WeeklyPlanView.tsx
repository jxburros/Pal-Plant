import React from 'react';
import { Friend, MeetingRequest } from '../types';
import { calculateTimeStatus, getUpcomingBirthdays, getPlantStage, getInitials, getAvatarColor } from '../utils/helpers';
import { Calendar, Gift, AlertTriangle, Sprout, Clock } from 'lucide-react';

interface WeeklyPlanViewProps {
  friends: Friend[];
  meetingRequests: MeetingRequest[];
  onNavigateToFriend: (name: string) => void;
  onNavigateToMeetings: () => void;
}

interface DayPlan {
  date: Date;
  label: string;
  items: PlanItem[];
}

interface PlanItem {
  id: string;
  type: 'friend' | 'meeting' | 'birthday';
  name: string;
  detail: string;
  urgency: number; // 0-1, higher = more urgent
  photo?: string;
  action: () => void;
}

const WeeklyPlanView: React.FC<WeeklyPlanViewProps> = ({ friends, meetingRequests, onNavigateToFriend, onNavigateToMeetings }) => {
  const today = new Date();
  const days: DayPlan[] = [];

  // Build 7-day plan
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayStr = date.toISOString().split('T')[0];

    const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'long' });
    const items: PlanItem[] = [];

    // Find friends whose timer expires on this day or before
    friends.forEach(f => {
      const status = calculateTimeStatus(f.lastContacted, f.frequencyDays);
      const goalDate = new Date(new Date(f.lastContacted).getTime() + f.frequencyDays * 24 * 60 * 60 * 1000);
      const goalDay = goalDate.toISOString().split('T')[0];

      // Already overdue: show on today
      if (i === 0 && status.isOverdue) {
        items.push({
          id: `friend_${f.id}`,
          type: 'friend',
          name: f.name,
          detail: `${Math.abs(status.daysLeft)}d overdue`,
          urgency: 1,
          photo: f.photo,
          action: () => onNavigateToFriend(f.name)
        });
      } else if (goalDay === dayStr && !status.isOverdue) {
        items.push({
          id: `friend_${f.id}`,
          type: 'friend',
          name: f.name,
          detail: `Timer expires`,
          urgency: 0.8,
          photo: f.photo,
          action: () => onNavigateToFriend(f.name)
        });
      } else if (i === 0 && status.daysLeft <= 2 && status.daysLeft > 0) {
        // Wilting: show on today as proactive
        items.push({
          id: `friend_${f.id}`,
          type: 'friend',
          name: f.name,
          detail: `${status.daysLeft}d left — reach out soon`,
          urgency: 0.6,
          photo: f.photo,
          action: () => onNavigateToFriend(f.name)
        });
      }
    });

    // Find meetings scheduled on this day
    meetingRequests.forEach(m => {
      if (m.status === 'SCHEDULED' && m.scheduledDate) {
        const meetingDay = new Date(m.scheduledDate).toISOString().split('T')[0];
        if (meetingDay === dayStr) {
          items.push({
            id: `meeting_${m.id}`,
            type: 'meeting',
            name: m.name,
            detail: `Meeting at ${m.location || 'TBD'}`,
            urgency: 0.5,
            photo: m.photo,
            action: onNavigateToMeetings
          });
        }
      }
    });

    // Find birthdays this week
    const birthdays = getUpcomingBirthdays(friends);
    birthdays.forEach(f => {
      if (!f.birthday) return;
      const [m, d] = f.birthday.split('-').map(Number);
      const bdayThisYear = new Date(today.getFullYear(), m - 1, d);
      if (bdayThisYear < today) bdayThisYear.setFullYear(today.getFullYear() + 1);
      const bdayStr = bdayThisYear.toISOString().split('T')[0];
      if (bdayStr === dayStr) {
        items.push({
          id: `birthday_${f.id}`,
          type: 'birthday',
          name: f.name,
          detail: 'Birthday!',
          urgency: 0.7,
          photo: f.photo,
          action: () => onNavigateToFriend(f.name)
        });
      }
    });

    // Sort by urgency
    items.sort((a, b) => b.urgency - a.urgency);

    days.push({ date, label: dayLabel, items });
  }

  const totalItems = days.reduce((acc, d) => acc + d.items.length, 0);

  return (
    <div className="space-y-4" role="region" aria-label="Weekly outreach plan">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-3xl shadow-lg text-white">
        <div className="flex items-center gap-3 mb-2">
          <Calendar size={22} />
          <h2 className="text-lg font-bold">Weekly Outreach Plan</h2>
        </div>
        <p className="text-indigo-100 text-sm">
          {totalItems === 0
            ? 'Nothing planned this week — your garden is well-maintained!'
            : `${totalItems} outreach item${totalItems > 1 ? 's' : ''} across the next 7 days.`}
        </p>
      </div>

      {days.map((day, i) => (
        <div key={i}>
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{day.label}</span>
            <span className="text-[10px] text-slate-400">
              {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            {day.items.length === 0 && (
              <span className="text-[10px] text-slate-300 italic ml-auto">No outreach needed</span>
            )}
          </div>

          {day.items.length > 0 && (
            <div className="space-y-2 mb-4">
              {day.items.map(item => (
                <button
                  key={item.id}
                  onClick={item.action}
                  aria-label={`${item.name}: ${item.detail}`}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    item.type === 'birthday'
                      ? 'bg-pink-50 border-pink-100 hover:bg-pink-100'
                      : item.urgency >= 0.8
                        ? 'bg-red-50 border-red-100 hover:bg-red-100'
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: getAvatarColor(item.name) }}
                  >
                    {item.photo ? (
                      <img src={item.photo} className="w-full h-full object-cover" alt={`Photo of ${item.name}`} />
                    ) : (
                      getInitials(item.name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      {item.type === 'birthday' && <Gift size={10} className="text-pink-500" aria-hidden="true" />}
                      {item.type === 'friend' && (item.urgency >= 0.8 ? <AlertTriangle size={10} className="text-red-500" aria-hidden="true" /> : <Clock size={10} className="text-slate-400" aria-hidden="true" />)}
                      {item.type === 'meeting' && <Calendar size={10} className="text-blue-500" aria-hidden="true" />}
                      {item.detail}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default WeeklyPlanView;
