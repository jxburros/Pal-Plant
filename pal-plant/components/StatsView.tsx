import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, YAxis } from 'recharts';
import { Friend, ContactLog } from '../types';
import { calculateTimeStatus, calculateStreaks, getCohortStats } from '../utils/helpers';
import { Trophy, Zap, AlertTriangle, Flame, Users, TrendingUp } from 'lucide-react';
import { getAnalyticsSummary } from '../utils/analytics';

interface StatsViewProps {
  friends: Friend[];
}

const StatsView: React.FC<StatsViewProps> = ({ friends }) => {
  const [viewMode, setViewMode] = useState<'overview' | 'streaks' | 'cohorts'>('overview');
  
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

  // Streaks data
  const streakData = calculateStreaks(friends);
  const analyticsSummary = getAnalyticsSummary(7);
  
  // Cohort data
  const cohortData = getCohortStats(friends);
  const cohortChartData = Object.entries(cohortData).map(([category, data]) => ({
    name: category,
    score: data.avgScore,
    count: data.count,
    interactions: data.totalInteractions
  }));

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
      {/* View Mode Selector */}
      <div className="flex bg-slate-100 rounded-xl p-1">
        <button 
          onClick={() => setViewMode('overview')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
            viewMode === 'overview' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
          }`}
        >
          Overview
        </button>
        <button 
          onClick={() => setViewMode('streaks')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
            viewMode === 'streaks' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
          }`}
        >
          <span className="flex items-center justify-center gap-1">
            <Flame size={14} className="text-orange-500" />
            Streaks
          </span>
        </button>
        <button 
          onClick={() => setViewMode('cohorts')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
            viewMode === 'cohorts' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
          }`}
        >
          <span className="flex items-center justify-center gap-1">
            <Users size={14} className="text-blue-500" />
            Cohorts
          </span>
        </button>
      </div>

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 mb-2">Last 7 Days Activity</h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-white rounded-lg p-2 border border-slate-100">
                <p className="text-slate-500">Contacts Logged</p>
                <p className="font-black text-slate-800 text-lg">{analyticsSummary.CONTACT_LOGGED}</p>
              </div>
              <div className="bg-white rounded-lg p-2 border border-slate-100">
                <p className="text-slate-500">Meetings Closed</p>
                <p className="font-black text-slate-800 text-lg">{analyticsSummary.MEETING_COMPLETED + analyticsSummary.MEETING_CLOSED}</p>
              </div>
              <div className="bg-white rounded-lg p-2 border border-slate-100">
                <p className="text-slate-500">Friends Added</p>
                <p className="font-black text-slate-800 text-lg">{analyticsSummary.FRIEND_ADDED}</p>
              </div>
            </div>
          </div>

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
        </>
      )}

      {/* Streaks Mode */}
      {viewMode === 'streaks' && (
        <>
          {/* Current Streak Card */}
          <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-3xl shadow-lg text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Flame size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-orange-100 text-sm font-medium">Current Streak</h3>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black">{streakData.currentStreak}</span>
                  <span className="text-orange-200 text-lg mb-1">days</span>
                </div>
              </div>
            </div>
            <p className="text-orange-100 text-sm">
              {streakData.currentStreak > 0 
                ? `Keep it up! You've been connecting with friends for ${streakData.currentStreak} consecutive days.`
                : "Start your streak! Connect with someone today."}
            </p>
          </div>

          {/* Streak Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={18} className="text-yellow-500" />
                <span className="text-sm font-bold text-slate-500 uppercase">Best Streak</span>
              </div>
              <span className="text-3xl font-black text-slate-800">{streakData.longestStreak}</span>
              <span className="text-sm text-slate-500 ml-1">days</span>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-emerald-500" />
                <span className="text-sm font-bold text-slate-500 uppercase">Active Days</span>
              </div>
              <span className="text-3xl font-black text-slate-800">{streakData.streakDates.length}</span>
              <span className="text-sm text-slate-500 ml-1">this streak</span>
            </div>
          </div>

          {/* Streak Calendar (Last 7 days) */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">Last 7 Days</h3>
            <div className="flex justify-between gap-2">
              {Array.from({ length: 7 }).map((_, i) => {
                const date = new Date(Date.now() - (6 - i) * 86400000);
                const dateStr = date.toISOString().split('T')[0];
                const isActive = streakData.streakDates.includes(dateStr);
                const isToday = i === 6;
                
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isActive 
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' 
                        : isToday 
                          ? 'border-2 border-dashed border-orange-300 text-orange-400'
                          : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isActive ? <Flame size={18} /> : date.getDate()}
                    </div>
                    <span className={`text-[10px] font-bold uppercase ${isToday ? 'text-orange-500' : 'text-slate-400'}`}>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Motivation */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-center text-slate-600 text-sm">
              {streakData.currentStreak === 0 && "🌱 Every journey begins with a single step. Reach out to someone today!"}
              {streakData.currentStreak > 0 && streakData.currentStreak < 7 && "🌿 You're building momentum! Keep going to reach a full week."}
              {streakData.currentStreak >= 7 && streakData.currentStreak < 30 && "🌳 Amazing progress! You're a connection champion."}
              {streakData.currentStreak >= 30 && "🏆 Incredible! You're a social superstar with over a month of daily connections!"}
            </p>
          </div>
        </>
      )}

      {/* Cohorts Mode */}
      {viewMode === 'cohorts' && (
        <>
          {/* Cohort Overview */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">Category Breakdown</h3>
            {Object.keys(cohortData).length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No categories yet. Add friends to see cohort analysis.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(cohortData).map(([category, data]) => (
                  <div key={category} className="p-4 bg-slate-50 rounded-2xl">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-slate-800">{category}</h4>
                        <p className="text-xs text-slate-500">{data.count} friend{data.count !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-2xl font-black ${
                          data.avgScore >= 70 ? 'text-emerald-500' : 
                          data.avgScore >= 40 ? 'text-yellow-500' : 'text-red-500'
                        }`}>{data.avgScore}</span>
                        <p className="text-[10px] text-slate-400 uppercase">Avg Score</p>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          data.avgScore >= 70 ? 'bg-emerald-500' : 
                          data.avgScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${data.avgScore}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between mt-3 text-xs">
                      <span className="text-slate-500">
                        <strong className="text-slate-700">{data.totalInteractions}</strong> interactions
                      </span>
                      {data.overdueCount > 0 && (
                        <span className="text-red-500 flex items-center gap-1">
                          <AlertTriangle size={12} />
                          {data.overdueCount} overdue
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cohort Comparison Chart */}
          {cohortChartData.length > 0 && (
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4">Score by Category</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cohortChartData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                    <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip 
                      cursor={{fill: '#f1f5f9'}} 
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      formatter={(value: number, name: string) => [
                        name === 'score' ? `${value} avg score` : value,
                        name === 'score' ? 'Score' : name
                      ]}
                    />
                    <Bar dataKey="score" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Insights */}
          {Object.keys(cohortData).length > 0 && (
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-3xl shadow-lg text-white">
              <h3 className="text-purple-100 text-sm font-medium mb-2">💡 Insight</h3>
              <p className="text-white text-sm leading-relaxed">
                {(() => {
                  const sortedCohorts = Object.entries(cohortData).sort((a, b) => b[1].avgScore - a[1].avgScore);
                  const best = sortedCohorts[0];
                  const worst = sortedCohorts[sortedCohorts.length - 1];
                  
                  if (sortedCohorts.length === 1) {
                    return `Your ${best[0]} connections have an average score of ${best[1].avgScore}. Keep nurturing these relationships!`;
                  }
                  
                  if (best[1].avgScore - worst[1].avgScore > 20) {
                    return `You're doing great with ${best[0]} (${best[1].avgScore} avg), but ${worst[0]} needs more attention (${worst[1].avgScore} avg).`;
                  }
                  
                  return `Your connection habits are balanced across categories. Great job maintaining all your relationships!`;
                })()}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StatsView;
