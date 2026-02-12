import React from 'react';
import { Friend, MeetingRequest, AppSettings } from '../types';
import { calculateSocialGardenScore, calculateTimeStatus, getUpcomingBirthdays, getInitials, getAvatarColor, THEMES } from '../utils/helpers';
import { Trophy, Calendar, AlertTriangle, Gift, Sprout, Leaf } from 'lucide-react';

interface HomeViewProps {
  friends: Friend[];
  meetingRequests: MeetingRequest[];
  settings: AppSettings;
  onNavigate: (tab: any) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ friends, meetingRequests, settings, onNavigate }) => {
  const theme = THEMES[settings.theme];
  const score = calculateSocialGardenScore(friends, meetingRequests);
  const birthdays = getUpcomingBirthdays(friends);
  const meetings = meetingRequests.filter(m => m.status === 'SCHEDULED').sort((a,b) => new Date(a.scheduledDate || '').getTime() - new Date(b.scheduledDate || '').getTime());

  // Find expiring timers (Less than 2 days)
  const withering = friends.filter(f => {
    const status = calculateTimeStatus(f.lastContacted, f.frequencyDays);
    return status.daysLeft <= 2;
  }).sort((a, b) => {
    return calculateTimeStatus(a.lastContacted, a.frequencyDays).daysLeft - calculateTimeStatus(b.lastContacted, b.frequencyDays).daysLeft;
  });

  // Featured friend (pick one with a photo, or first friend)
  const friendsWithPhotos = friends.filter(f => f.photo);
  const randomFriend = friendsWithPhotos.length > 0
    ? friendsWithPhotos[Math.floor(Math.random() * friendsWithPhotos.length)]
    : null;

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 to-emerald-100 p-6 border border-emerald-100 shadow-sm">
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
               <h2 className={`text-3xl font-black ${theme.textMain} tracking-tight`}>Hello!</h2>
               <p className={`${theme.textSub} font-medium mt-1`}>Your social garden score:</p>
            </div>
            <div className={`p-4 rounded-2xl bg-white shadow-sm flex flex-col items-center border ${theme.border}`}>
               <span className={`text-4xl font-black ${score > 75 ? 'text-emerald-600' : score > 40 ? 'text-yellow-600' : 'text-orange-600'}`}>{score}</span>
               <Trophy size={14} className="text-slate-400 mt-1" />
            </div>
          </div>
        </div>
        <Leaf className="absolute -bottom-8 -right-8 text-emerald-200 opacity-50 rotate-12" size={140} />
      </div>

      {/* Featured Photo (only if user has uploaded photos) */}
      {randomFriend && randomFriend.photo && (
         <div className="relative group rounded-3xl overflow-hidden aspect-[16/9] shadow-md border border-slate-100">
            <img
               src={randomFriend.photo}
               alt="Featured"
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
           <div className="bg-red-50 border border-red-100 p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-3 text-red-800 font-bold uppercase tracking-wider text-xs">
                 <AlertTriangle size={16} /> Withering Plants
              </div>
              <div className="space-y-2">
                 {withering.slice(0, 3).map(f => (
                   <div key={f.id} className="flex justify-between items-center bg-white/60 p-2 rounded-xl">
                      <span className="font-bold text-slate-700">{f.name}</span>
                      <span className="text-xs font-bold text-red-500">
                        {calculateTimeStatus(f.lastContacted, f.frequencyDays).daysLeft} days
                      </span>
                   </div>
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
                    <div key={f.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
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
                    </div>
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
                    <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                       <p className="font-bold text-sm text-slate-800">{m.name}</p>
                       <div className="flex justify-between mt-1 text-xs text-slate-500">
                          <span>{new Date(m.scheduledDate!).toLocaleDateString()}</span>
                          <span>{m.location}</span>
                       </div>
                    </div>
                 ))}
               </div>
            )}
         </div>

      </div>

    </div>
  );
};

export default HomeView;
