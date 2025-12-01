import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, YAxis } from 'recharts';
import { Friend, ContactLog } from '../types';
import { calculateTimeStatus } from '../utils/helpers';
import { Trophy, Zap, AlertTriangle } from 'lucide-react';

interface StatsViewProps {
  friends: Friend[];
}

const StatsView: React.FC<StatsViewProps> = ({ friends }) => {
  // Aggregate data
  const totalInteractions = friends.reduce((acc, f) => acc + f.logs.length, 0);
  
  // Calculate average "Battery Left" when contacted
  let totalPercentage = 0;
  let logCount = 0;
  let overdueCount = 0;
  let earlyBirdCount = 0; // Contacted with > 50% time left

  friends.forEach(f => {
    f.logs.forEach(log => {
      totalPercentage += log.percentageRemaining;
      logCount++;
      if (log.percentageRemaining < 0) overdueCount++;
      if (log.percentageRemaining > 50) earlyBirdCount++;
    });
  });

  const avgPercentage = logCount > 0 ? Math.round(totalPercentage / logCount) : 0;
  const onTimePercentage = logCount > 0 ? Math.round(((logCount - overdueCount) / logCount) * 100) : 100;

  // Data for Pie Chart (On Time vs Late)
  const pieData = [
    { name: 'On Time', value: logCount - overdueCount },
    { name: 'Late', value: overdueCount },
  ];
  const PIE_COLORS = ['#10b981', '#ef4444'];

  // Data for Top Connected (Bar Chart)
  const sortedFriends = [...friends].sort((a, b) => b.logs.length - a.logs.length).slice(0, 5);
  const barData = sortedFriends.map(f => ({
    name: f.name.split(' ')[0], // First name only for compactness
    interactions: f.logs.length
  }));

  // Calculate current urgency distribution
  const currentUrgency = {
    critical: 0,
    warning: 0,
    good: 0
  };
  
  friends.forEach(f => {
    const { percentageLeft } = calculateTimeStatus(f.lastContacted, f.frequencyDays);
    if (percentageLeft < 20) currentUrgency.critical++;
    else if (percentageLeft < 50) currentUrgency.warning++;
    else currentUrgency.good++;
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="bg-blue-50 p-2 rounded-full mb-2 text-blue-500">
            <Zap size={20} />
          </div>
          <span className="text-2xl font-bold text-slate-800">{totalInteractions}</span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Calls</span>
        </div>
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="bg-emerald-50 p-2 rounded-full mb-2 text-emerald-500">
            <Trophy size={20} />
          </div>
          <span className="text-2xl font-bold text-slate-800">{onTimePercentage}%</span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">On Time</span>
        </div>
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className={`p-2 rounded-full mb-2 ${currentUrgency.critical > 0 ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'}`}>
            <AlertTriangle size={20} />
          </div>
          <span className="text-2xl font-bold text-slate-800">{currentUrgency.critical}</span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Urgent Now</span>
        </div>
      </div>

      {/* Habit Chart */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4">Timeliness Habits</h3>
        <div className="h-48 w-full flex items-center justify-center">
          {logCount === 0 ? (
            <p className="text-slate-400 text-sm">No data yet. Make some calls!</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-slate-600">On Time</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-slate-600">Late</span>
          </div>
        </div>
      </div>

      {/* Efficiency Stat */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl shadow-lg text-white">
        <h3 className="text-indigo-100 text-sm font-medium mb-1">Average Timing</h3>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold">{Math.max(0, avgPercentage)}%</span>
          <span className="text-indigo-200 text-sm mb-1">time remaining</span>
        </div>
        <p className="mt-2 text-indigo-100 text-sm leading-relaxed opacity-80">
          {avgPercentage > 50 
            ? "You tend to contact friends well before the deadline. Very proactive!"
            : avgPercentage > 20
            ? "You usually contact friends comfortably within the timeframe."
            : "You often wait until the last minute or miss the deadline."}
        </p>
      </div>

       {/* Top Friends Chart */}
       <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4">Most Contacted</h3>
        <div className="h-48 w-full">
           {logCount === 0 ? (
             <div className="h-full flex items-center justify-center">
                <p className="text-slate-400 text-sm">No data yet.</p>
             </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="interactions" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
};

export default StatsView;
