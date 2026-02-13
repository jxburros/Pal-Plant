import { useEffect } from 'react';
import { Friend, MeetingRequest } from '../types';
import { calculateTimeStatus } from '../utils/helpers';

interface ReminderConfig {
  pushEnabled: boolean;
  reminderHoursBefore: number;
  backupReminderEnabled: boolean;
  backupReminderDays: number;
}

interface ReminderEngineArgs {
  friends: Friend[];
  meetingRequests: MeetingRequest[];
  reminders: ReminderConfig;
  onBackupReminder: (message: string) => void;
}

const BACKUP_KEY = 'friendkeep_last_backup_at';
const BACKUP_REMINDER_KEY = 'friendkeep_last_backup_reminder_day';

export const useReminderEngine = ({ friends, meetingRequests, reminders, onBackupReminder }: ReminderEngineArgs) => {
  useEffect(() => {
    if (!reminders.pushEnabled || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [reminders.pushEnabled]);

  useEffect(() => {
    if (!reminders.pushEnabled || !('Notification' in window) || Notification.permission !== 'granted') return;

    const REMINDER_KEY = 'friendkeep_last_reminders';
    const getReminderMap = (): Record<string, string> => {
      try {
        return JSON.parse(localStorage.getItem(REMINDER_KEY) || '{}');
      } catch {
        return {};
      }
    };

    const maybeNotify = () => {
      const now = new Date();
      const reminderMap = getReminderMap();

      friends.forEach(friend => {
        const status = calculateTimeStatus(friend.lastContacted, friend.frequencyDays);
        if (status.daysLeft <= 0) {
          const key = `friend_${friend.id}_${now.toISOString().split('T')[0]}`;
          if (!reminderMap[key]) {
            new Notification(`Pal Plant reminder: ${friend.name}`, {
              body: `${friend.name} is overdue for a check-in.`,
            });
            reminderMap[key] = now.toISOString();
          }
        }
      });

      meetingRequests.forEach(req => {
        if (req.status !== 'SCHEDULED' || !req.scheduledDate) return;
        const diffHours = (new Date(req.scheduledDate).getTime() - now.getTime()) / (1000 * 60 * 60);
        if (diffHours > 0 && diffHours <= reminders.reminderHoursBefore) {
          const key = `meeting_${req.id}_${new Date(req.scheduledDate).toISOString()}`;
          if (!reminderMap[key]) {
            new Notification(`Upcoming meeting with ${req.name}`, {
              body: `Starts in ${Math.max(1, Math.round(diffHours))} hour(s).`,
            });
            reminderMap[key] = now.toISOString();
          }
        }
      });

      localStorage.setItem(REMINDER_KEY, JSON.stringify(reminderMap));
    };

    maybeNotify();
    const interval = setInterval(maybeNotify, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [friends, meetingRequests, reminders.pushEnabled, reminders.reminderHoursBefore]);

  useEffect(() => {
    if (!reminders.backupReminderEnabled) return;

    const now = new Date();
    const todayKey = now.toISOString().split('T')[0];
    const lastReminderDay = localStorage.getItem(BACKUP_REMINDER_KEY);
    if (lastReminderDay === todayKey) return;

    const lastBackupRaw = localStorage.getItem(BACKUP_KEY);
    if (!lastBackupRaw) {
      onBackupReminder('Tip: Create your first backup from Settings → Data Management.');
      localStorage.setItem(BACKUP_REMINDER_KEY, todayKey);
      return;
    }

    const daysSince = Math.floor((now.getTime() - new Date(lastBackupRaw).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince >= reminders.backupReminderDays) {
      onBackupReminder(`It’s been ${daysSince} day(s) since your last backup. Open Settings to export a fresh backup.`);
      localStorage.setItem(BACKUP_REMINDER_KEY, todayKey);
    }
  }, [reminders.backupReminderEnabled, reminders.backupReminderDays, onBackupReminder]);
};

export const markBackupExportedNow = () => {
  localStorage.setItem(BACKUP_KEY, new Date().toISOString());
};
