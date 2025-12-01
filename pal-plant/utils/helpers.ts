import { Friend, ThemeId, ThemeColors, MeetingRequest, ContactLog } from '../types';
import { Sprout, Flower, Trees, Leaf, Skull } from 'lucide-react';
import React from 'react';

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const calculateTimeStatus = (lastContacted: string, frequencyDays: number) => {
  const lastDate = new Date(lastContacted);
  const now = new Date();
  const goalDate = new Date(lastDate.getTime() + frequencyDays * 24 * 60 * 60 * 1000);
  
  const totalDurationMs = goalDate.getTime() - lastDate.getTime();
  const timeRemainingMs = goalDate.getTime() - now.getTime();
  
  // Percentage of the "battery" left
  let percentageLeft = (timeRemainingMs / totalDurationMs) * 100;
  
  // Cap for UI purposes, but keep raw for logic
  const daysLeft = Math.ceil(timeRemainingMs / (1000 * 60 * 60 * 24));
  
  return {
    percentageLeft,
    daysLeft,
    isOverdue: timeRemainingMs < 0,
    goalDate
  };
};

export const getStatusColor = (percentage: number): string => {
  if (percentage <= 0) return 'text-red-600 bg-red-100 border-red-200'; // Overdue
  if (percentage < 25) return 'text-orange-600 bg-orange-100 border-orange-200'; // Urgent
  if (percentage < 50) return 'text-yellow-600 bg-yellow-100 border-yellow-200'; // Warning
  return 'text-emerald-600 bg-emerald-100 border-emerald-200'; // Good
};

export const getProgressBarColor = (percentage: number): string => {
  if (percentage <= 0) return 'bg-red-500';
  if (percentage < 25) return 'bg-orange-500';
  if (percentage < 50) return 'bg-yellow-500';
  return 'bg-emerald-500';
};

// Returns a component and label based on percentage
export const getPlantStage = (percentage: number) => {
  if (percentage >= 80) return { icon: Flower, label: 'Thriving', color: 'text-pink-500', bg: 'bg-pink-100' };
  if (percentage >= 50) return { icon: Trees, label: 'Growing', color: 'text-emerald-600', bg: 'bg-emerald-100' };
  if (percentage >= 25) return { icon: Sprout, label: 'Sprouting', color: 'text-lime-600', bg: 'bg-lime-100' };
  if (percentage > 0) return { icon: Leaf, label: 'Wilting', color: 'text-yellow-600', bg: 'bg-yellow-100' };
  return { icon: Skull, label: 'Withered', color: 'text-stone-500', bg: 'bg-stone-100' };
};

// Meeting Urgency Logic: Green -> Red over 14 days
export const getMeetingUrgency = (dateAdded: string) => {
  const start = new Date(dateAdded).getTime();
  const now = new Date().getTime();
  const daysPassed = (now - start) / (1000 * 60 * 60 * 24);
  const maxDays = 14;

  const ratio = Math.min(daysPassed / maxDays, 1);
  
  const hue = 150 - (ratio * 150); 
  const color = `hsl(${hue}, 70%, 50%)`;
  
  return {
    daysPassed: Math.floor(daysPassed),
    ratio,
    color
  };
};

/**
 * Calculates the score for a single interaction event
 */
export const calculateInteractionScore = (
  type: 'REGULAR' | 'DEEP' | 'QUICK',
  percentageRemaining: number, 
  daysOverdue: number
): number => {
  if (type === 'QUICK') return 2; // Small bonus for quick touches
  if (type === 'DEEP') return 15; // Big bonus for deep connections

  // Regular Logic
  if (daysOverdue > 0) {
    // Penalty: -5 points per day overdue, max -30
    return Math.max(-30, -5 * daysOverdue);
  }

  // Too Early Penalty (>80% left)
  if (percentageRemaining > 80) {
    return -2;
  }

  // Sweet Spot (0% to 50% left) -> High points
  if (percentageRemaining <= 50) {
    return 10;
  }

  // Normal (50% to 80% left)
  return 5;
};

/**
 * Recalculates a friend's total individual score based on history
 */
export const calculateIndividualFriendScore = (logs: ContactLog[]): number => {
  // Start neutral
  let score = 50;

  // We weight recent logs more heavily? For now, flat sum clamped 0-100
  logs.forEach(log => {
    score += (log.scoreDelta || 0);
  });

  return Math.max(0, Math.min(100, score));
};

/**
 * Global Score Algorithm
 */
export const calculateSocialGardenScore = (friends: Friend[], meetings: MeetingRequest[]): number => {
  if (friends.length === 0) return 0;
  
  // 1. Average of Individual Friend Scores
  const totalFriendScore = friends.reduce((acc, f) => acc + f.individualScore, 0);
  const avgFriendScore = totalFriendScore / friends.length;

  // 2. Meeting Bonuses/Penalties
  let meetingScore = 0;
  
  meetings.forEach(m => {
    if (m.status === 'COMPLETE' && m.verified) {
      meetingScore += 5; // +5 for every completed, verified meeting
    } else if (m.status === 'REQUESTED') {
       // Penalty if sitting in requested too long (> 14 days)
       const urgency = getMeetingUrgency(m.dateAdded);
       if (urgency.daysPassed > 14) {
         meetingScore -= 2;
       }
    }
  });

  // Calculate final
  return Math.round(Math.max(0, Math.min(100, avgFriendScore + (meetingScore / Math.max(1, friends.length)))));
};

export const getUpcomingBirthdays = (friends: Friend[]) => {
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(today.getDate() + 30);

  return friends.filter(f => {
    if (!f.birthday) return false;
    const [m, d] = f.birthday.split('-').map(Number);
    
    // Create date object for this year
    const bdayThisYear = new Date(today.getFullYear(), m - 1, d);
    
    // Check if it's in the next 30 days
    // Handle year wrapping (e.g. Dec to Jan)
    let bdayNext = bdayThisYear;
    if (bdayThisYear < today) {
       bdayNext = new Date(today.getFullYear() + 1, m - 1, d);
    }
    
    const diffTime = bdayNext.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays <= 30;
  }).sort((a, b) => {
     // Sort by closest
     const [m1, d1] = a.birthday!.split('-').map(Number);
     const [m2, d2] = b.birthday!.split('-').map(Number);
     // Simplified sort, ideally needs year awareness logic above repeated
     return (m1 * 31 + d1) - (today.getMonth() * 31 + today.getDate()); 
  });
};

export const THEMES: Record<ThemeId, ThemeColors> = {
  plant: {
    bg: 'bg-[#f4f7f4]', cardBg: 'bg-white', textMain: 'text-[#2c3e2e]', textSub: 'text-[#6b7c6d]', 
    primary: 'bg-[#4a674e]', primaryText: 'text-white', accent: 'bg-[#8fb394]', border: 'border-[#e0e8e0]'
  },
  midnight: {
    bg: 'bg-slate-900', cardBg: 'bg-slate-800', textMain: 'text-white', textSub: 'text-slate-400',
    primary: 'bg-blue-600', primaryText: 'text-white', accent: 'bg-pink-500', border: 'border-slate-700'
  },
  forest: {
    bg: 'bg-stone-100', cardBg: 'bg-white', textMain: 'text-stone-800', textSub: 'text-stone-500',
    primary: 'bg-emerald-800', primaryText: 'text-emerald-50', accent: 'bg-lime-600', border: 'border-stone-200'
  },
  ocean: {
    bg: 'bg-sky-50', cardBg: 'bg-white', textMain: 'text-sky-950', textSub: 'text-sky-500',
    primary: 'bg-sky-600', primaryText: 'text-white', accent: 'bg-cyan-400', border: 'border-sky-100'
  },
  sunset: {
    bg: 'bg-orange-50', cardBg: 'bg-white', textMain: 'text-orange-950', textSub: 'text-orange-600',
    primary: 'bg-orange-600', primaryText: 'text-white', accent: 'bg-yellow-400', border: 'border-orange-200'
  },
  berry: {
    bg: 'bg-fuchsia-50', cardBg: 'bg-white', textMain: 'text-fuchsia-950', textSub: 'text-fuchsia-600',
    primary: 'bg-fuchsia-700', primaryText: 'text-white', accent: 'bg-pink-500', border: 'border-fuchsia-200'
  }
};