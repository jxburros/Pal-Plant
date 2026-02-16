/**
 * Legacy helpers.ts file - Re-exports from domain-specific modules
 * 
 * This file maintains backward compatibility by re-exporting all functions
 * from the new modular structure. All helper functions have been organized
 * into domain-specific modules for better maintainability.
 * 
 * @deprecated Import directly from specific modules instead:
 * - avatar.ts: Avatar generation functions
 * - validation.ts: Input validation and sanitization
 * - calendar.ts: Calendar integration (ICS, Google Calendar)
 * - streaks.ts: Streak calculations
 * - csv.ts: CSV parsing
 * - duplicates.ts: Duplicate detection
 * - scoring.ts: Scoring system and visual helpers
 * - stats.ts: Statistics calculations
 * - nudges.ts: Smart nudge recommendations
 * - themes.ts: Theme definitions
 * - core.ts: Core utility functions
 */

// Re-export all functions from domain-specific modules
export { getInitials, getAvatarColor } from './avatar';
export { sanitizeText, sanitizePhone, isValidEmail } from './validation';
export { generateICSEvent, downloadCalendarEvent, getGoogleCalendarUrl } from './calendar';
export { calculateStreaks } from './streaks';
export { parseCSVContacts } from './csv';
export { detectDuplicates } from './duplicates';
export { generateId, fileToBase64 } from './core';
export { getCohortStats } from './stats';
export { getSmartNudges, type SmartNudge } from './nudges';
export { THEMES } from './themes';
export {
  TIMER_BUFFER_MULTIPLIER,
  calculateTimeStatus,
  calculateInteractionScore,
  calculateIndividualFriendScore,
  calculateSocialGardenScore,
  getUpcomingBirthdays,
  getStatusColor,
  getProgressBarColor,
  getPlantStage,
  getMeetingUrgency
} from './scoring';
