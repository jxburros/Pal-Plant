"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.THEMES = exports.getUpcomingBirthdays = exports.calculateSocialGardenScore = exports.calculateIndividualFriendScore = exports.calculateInteractionScore = exports.getMeetingUrgency = exports.getPlantStage = exports.getProgressBarColor = exports.getStatusColor = exports.getCohortStats = exports.calculateTimeStatus = exports.fileToBase64 = exports.generateId = exports.detectDuplicates = exports.parseCSVContacts = exports.calculateStreaks = exports.getGoogleCalendarUrl = exports.downloadCalendarEvent = exports.generateICSEvent = exports.isValidEmail = exports.sanitizePhone = exports.sanitizeText = exports.getAvatarColor = exports.getInitials = void 0;
const lucide_react_1 = require("lucide-react");
// ─── Avatar Helpers ───────────────────────────────────────────────
const getInitials = (name) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0)
        return '?';
    if (parts.length === 1)
        return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};
exports.getInitials = getInitials;
const getAvatarColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 55%, 55%)`;
};
exports.getAvatarColor = getAvatarColor;
// ─── Input Validation ─────────────────────────────────────────────
const sanitizeText = (text, maxLength = 200) => {
    return text.trim().slice(0, maxLength);
};
exports.sanitizeText = sanitizeText;
const sanitizePhone = (phone) => {
    return phone.replace(/[^0-9+\-() .ext]/gi, '').trim().slice(0, 30);
};
exports.sanitizePhone = sanitizePhone;
const isValidEmail = (email) => {
    if (!email)
        return true; // empty is OK (optional)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
exports.isValidEmail = isValidEmail;
// ─── ICS Calendar ─────────────────────────────────────────────────
/**
 * Generate an ICS calendar event for a meeting
 */
const generateICSEvent = (meeting) => {
    if (!meeting.scheduledDate)
        return '';
    const startDate = new Date(meeting.scheduledDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
    const formatDate = (d) => {
        return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };
    const uid = `${meeting.id}@palplant`;
    const dtstamp = formatDate(new Date());
    const dtstart = formatDate(startDate);
    const dtend = formatDate(endDate);
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Pal Plant//Meeting//EN',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `SUMMARY:Meeting with ${meeting.name}`,
        `DESCRIPTION:${meeting.notes || 'Meeting scheduled via Pal Plant'}`,
        `LOCATION:${meeting.location || 'TBD'}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');
    return icsContent;
};
exports.generateICSEvent = generateICSEvent;
/**
 * Download an ICS file for a meeting
 */
const downloadCalendarEvent = (meeting) => {
    const icsContent = (0, exports.generateICSEvent)(meeting);
    if (!icsContent)
        return;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting_${meeting.name.replace(/\s+/g, '_')}_${new Date(meeting.scheduledDate).toISOString().split('T')[0]}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
exports.downloadCalendarEvent = downloadCalendarEvent;
const getGoogleCalendarUrl = (meeting) => {
    if (!meeting.scheduledDate)
        return '';
    const startDate = new Date(meeting.scheduledDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    const formatDate = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: `Meeting with ${meeting.name}`,
        dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
        details: meeting.notes || 'Meeting scheduled via Pal Plant',
        location: meeting.location || 'TBD'
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
exports.getGoogleCalendarUrl = getGoogleCalendarUrl;
// ─── Streaks ──────────────────────────────────────────────────────
/**
 * Calculate streak data - consecutive days with at least one interaction
 */
const calculateStreaks = (friends) => {
    // Collect all interaction dates
    const allDates = new Set();
    friends.forEach(f => {
        f.logs.forEach(log => {
            const date = new Date(log.date).toISOString().split('T')[0];
            allDates.add(date);
        });
    });
    if (allDates.size === 0) {
        return { currentStreak: 0, longestStreak: 0, streakDates: [] };
    }
    // Sort dates
    const sortedDates = Array.from(allDates).sort();
    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    const streakDates = [];
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / 86400000);
        if (diffDays === 1) {
            tempStreak++;
        }
        else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
        }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    // Check if current streak is still active (last interaction was today or yesterday)
    const lastDate = sortedDates[sortedDates.length - 1];
    if (lastDate === today || lastDate === yesterday) {
        // Count backwards from today
        let checkDate = lastDate === today ? today : yesterday;
        let streak = 0;
        for (let i = sortedDates.length - 1; i >= 0; i--) {
            if (sortedDates[i] === checkDate) {
                streak++;
                streakDates.unshift(sortedDates[i]);
                const prevDay = new Date(new Date(checkDate).getTime() - 86400000).toISOString().split('T')[0];
                checkDate = prevDay;
            }
            else if (new Date(sortedDates[i]) < new Date(checkDate)) {
                break;
            }
        }
        currentStreak = streak;
    }
    return { currentStreak, longestStreak, streakDates };
};
exports.calculateStreaks = calculateStreaks;
// ─── CSV Parsing ──────────────────────────────────────────────────
/**
 * Parse a single CSV line respecting quoted fields
 */
const parseCSVLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++; // skip escaped quote
                }
                else {
                    inQuotes = false;
                }
            }
            else {
                current += char;
            }
        }
        else {
            if (char === '"') {
                inQuotes = true;
            }
            else if (char === ',') {
                values.push(current.trim());
                current = '';
            }
            else {
                current += char;
            }
        }
    }
    values.push(current.trim());
    return values;
};
/**
 * Parse CSV contacts data
 */
const parseCSVContacts = (csvContent) => {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2)
        return [];
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/"/g, ''));
    const nameIndex = headers.findIndex(h => h === 'name' || h === 'full name' || h === 'fullname');
    const phoneIndex = headers.findIndex(h => h === 'phone' || h === 'mobile' || h === 'telephone');
    const emailIndex = headers.findIndex(h => h === 'email' || h === 'e-mail');
    const categoryIndex = headers.findIndex(h => h === 'category' || h === 'group' || h === 'type');
    if (nameIndex === -1)
        return [];
    const contacts = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim())
            continue;
        const values = parseCSVLine(lines[i]);
        const name = (0, exports.sanitizeText)(values[nameIndex] || '', 100);
        if (!name)
            continue;
        contacts.push({
            name,
            phone: phoneIndex !== -1 ? (0, exports.sanitizePhone)(values[phoneIndex] || '') : undefined,
            email: emailIndex !== -1 ? (0, exports.sanitizeText)(values[emailIndex] || '', 254) : undefined,
            category: categoryIndex !== -1 ? (0, exports.sanitizeText)(values[categoryIndex] || '', 50) : undefined
        });
    }
    return contacts;
};
exports.parseCSVContacts = parseCSVContacts;
// ─── Duplicate Detection ──────────────────────────────────────────
/**
 * Detect duplicate contacts based on name similarity
 */
const detectDuplicates = (newContacts, existingFriends) => {
    const duplicates = [];
    const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    newContacts.forEach(newContact => {
        const normalizedNew = normalize(newContact.name);
        existingFriends.forEach(existing => {
            const normalizedExisting = normalize(existing.name);
            // Check for exact match
            if (normalizedNew === normalizedExisting) {
                duplicates.push({ newContact, existingFriend: existing, similarity: 100 });
                return;
            }
            // Check for partial match (one contains the other)
            if (normalizedNew.includes(normalizedExisting) || normalizedExisting.includes(normalizedNew)) {
                duplicates.push({ newContact, existingFriend: existing, similarity: 80 });
                return;
            }
            // Check by email match
            if (newContact.email && existing.email && newContact.email.toLowerCase() === existing.email.toLowerCase()) {
                duplicates.push({ newContact, existingFriend: existing, similarity: 95 });
                return;
            }
            // Check by phone match
            if (newContact.phone && existing.phone) {
                const normalizedNewPhone = newContact.phone.replace(/\D/g, '');
                const normalizedExistingPhone = existing.phone.replace(/\D/g, '');
                if (normalizedNewPhone.length >= 7 && normalizedExistingPhone.length >= 7 &&
                    (normalizedNewPhone.includes(normalizedExistingPhone) || normalizedExistingPhone.includes(normalizedNewPhone))) {
                    duplicates.push({ newContact, existingFriend: existing, similarity: 90 });
                }
            }
        });
    });
    return duplicates;
};
exports.detectDuplicates = detectDuplicates;
// ─── Core Utilities ───────────────────────────────────────────────
const generateId = () => {
    return Math.random().toString(36).substring(2, 9);
};
exports.generateId = generateId;
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};
exports.fileToBase64 = fileToBase64;
const calculateTimeStatus = (lastContacted, frequencyDays) => {
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
exports.calculateTimeStatus = calculateTimeStatus;
// ─── Stats ────────────────────────────────────────────────────────
/**
 * Group friends by category and calculate category-specific stats
 */
const getCohortStats = (friends) => {
    const cohorts = {};
    friends.forEach(f => {
        if (!cohorts[f.category]) {
            cohorts[f.category] = { count: 0, totalScore: 0, totalInteractions: 0, overdueCount: 0 };
        }
        cohorts[f.category].count++;
        cohorts[f.category].totalScore += f.individualScore || 50;
        cohorts[f.category].totalInteractions += f.logs.length;
        const status = (0, exports.calculateTimeStatus)(f.lastContacted, f.frequencyDays);
        if (status.isOverdue) {
            cohorts[f.category].overdueCount++;
        }
    });
    const result = {};
    Object.entries(cohorts).forEach(([category, data]) => {
        result[category] = {
            count: data.count,
            avgScore: Math.round(data.totalScore / data.count),
            totalInteractions: data.totalInteractions,
            overdueCount: data.overdueCount
        };
    });
    return result;
};
exports.getCohortStats = getCohortStats;
// ─── Visual Helpers ───────────────────────────────────────────────
const getStatusColor = (percentage) => {
    if (percentage <= 0)
        return 'text-red-600 bg-red-100 border-red-200'; // Overdue
    if (percentage < 25)
        return 'text-orange-600 bg-orange-100 border-orange-200'; // Urgent
    if (percentage < 50)
        return 'text-yellow-600 bg-yellow-100 border-yellow-200'; // Warning
    return 'text-emerald-600 bg-emerald-100 border-emerald-200'; // Good
};
exports.getStatusColor = getStatusColor;
const getProgressBarColor = (percentage) => {
    if (percentage <= 0)
        return 'bg-red-500';
    if (percentage < 25)
        return 'bg-orange-500';
    if (percentage < 50)
        return 'bg-yellow-500';
    return 'bg-emerald-500';
};
exports.getProgressBarColor = getProgressBarColor;
// Returns a component and label based on percentage
const getPlantStage = (percentage) => {
    if (percentage >= 80)
        return { icon: lucide_react_1.Flower, label: 'Thriving', color: 'text-pink-500', bg: 'bg-pink-100' };
    if (percentage >= 50)
        return { icon: lucide_react_1.Trees, label: 'Growing', color: 'text-emerald-600', bg: 'bg-emerald-100' };
    if (percentage >= 25)
        return { icon: lucide_react_1.Sprout, label: 'Sprouting', color: 'text-lime-600', bg: 'bg-lime-100' };
    if (percentage > 0)
        return { icon: lucide_react_1.Leaf, label: 'Wilting', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { icon: lucide_react_1.Skull, label: 'Withered', color: 'text-stone-500', bg: 'bg-stone-100' };
};
exports.getPlantStage = getPlantStage;
// Meeting Urgency Logic: Green -> Red over 14 days
const getMeetingUrgency = (dateAdded) => {
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
exports.getMeetingUrgency = getMeetingUrgency;
// ─── Scoring ──────────────────────────────────────────────────────
/**
 * Calculates the score for a single interaction event
 */
const calculateInteractionScore = (type, percentageRemaining, daysOverdue) => {
    if (type === 'QUICK')
        return 2; // Small bonus for quick touches
    if (type === 'DEEP')
        return 15; // Big bonus for deep connections
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
exports.calculateInteractionScore = calculateInteractionScore;
/**
 * Recalculates a friend's total individual score based on history
 */
const calculateIndividualFriendScore = (logs) => {
    // Start neutral
    let score = 50;
    // We weight recent logs more heavily? For now, flat sum clamped 0-100
    logs.forEach(log => {
        score += (log.scoreDelta || 0);
    });
    return Math.max(0, Math.min(100, score));
};
exports.calculateIndividualFriendScore = calculateIndividualFriendScore;
/**
 * Global Score Algorithm
 */
const calculateSocialGardenScore = (friends, meetings) => {
    if (friends.length === 0)
        return 0;
    // 1. Average of Individual Friend Scores
    const totalFriendScore = friends.reduce((acc, f) => acc + f.individualScore, 0);
    const avgFriendScore = totalFriendScore / friends.length;
    // 2. Meeting Bonuses/Penalties
    let meetingScore = 0;
    meetings.forEach(m => {
        if (m.status === 'COMPLETE' && m.verified) {
            meetingScore += 5; // +5 for every completed, verified meeting
        }
        else if (m.status === 'REQUESTED') {
            // Penalty if sitting in requested too long (> 14 days)
            const urgency = (0, exports.getMeetingUrgency)(m.dateAdded);
            if (urgency.daysPassed > 14) {
                meetingScore -= 2;
            }
        }
    });
    // Calculate final
    return Math.round(Math.max(0, Math.min(100, avgFriendScore + (meetingScore / Math.max(1, friends.length)))));
};
exports.calculateSocialGardenScore = calculateSocialGardenScore;
const getUpcomingBirthdays = (friends) => {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);
    return friends.filter(f => {
        if (!f.birthday)
            return false;
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
        const [m1, d1] = a.birthday.split('-').map(Number);
        const [m2, d2] = b.birthday.split('-').map(Number);
        const getDaysUntil = (m, d) => {
            let bday = new Date(today.getFullYear(), m - 1, d);
            if (bday < today)
                bday = new Date(today.getFullYear() + 1, m - 1, d);
            return bday.getTime() - today.getTime();
        };
        return getDaysUntil(m1, d1) - getDaysUntil(m2, d2);
    });
};
exports.getUpcomingBirthdays = getUpcomingBirthdays;
// ─── Themes ───────────────────────────────────────────────────────
exports.THEMES = {
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
