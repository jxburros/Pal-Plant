import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Friend, MeetingRequest } from '../types';
import { calculateTimeStatus } from '../utils/helpers';
import { initializeFCM, setupForegroundMessageHandler, getFCMToken } from '../utils/firebaseMessaging';

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
  onQuickBackup?: () => void;
}

const BACKUP_KEY = 'friendkeep_last_backup_at';
const BACKUP_REMINDER_KEY = 'friendkeep_last_backup_reminder_day';
const NOTIFICATION_DELAY_MS = 1000; // Delay before showing notification (1 second)

const isNative = () => Capacitor.isNativePlatform();

// Helper to send notifications using the appropriate API
const sendNotification = async (title: string, body: string) => {
  if (isNative()) {
    // Use native local notifications for Android/iOS
    try {
      // Create notification channel for Android
      if (Capacitor.getPlatform() === 'android') {
        await LocalNotifications.createChannel({
          id: 'pal-plant-reminders',
          name: 'Reminders',
          description: 'Pal Plant reminders for contacts and meetings',
          importance: 4,
          visibility: 1,
        });
      }

      // Schedule a local notification
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + NOTIFICATION_DELAY_MS) },
            channelId: 'pal-plant-reminders',
          },
        ],
      });
    } catch {
      // Silently fail if notification cannot be sent
    }
  } else {
    // Use web notifications (FCM handles background, browser API for foreground)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon.svg',
        badge: '/badge.svg',
        tag: 'pal-plant-reminder',
      });
    }
  }
};

export const useReminderEngine = ({ friends, meetingRequests, reminders, onBackupReminder, onQuickBackup }: ReminderEngineArgs) => {
  // Request permissions and initialize FCM on mount
  useEffect(() => {
    if (!reminders.pushEnabled) return;

    let cleanupForegroundHandler: (() => void) | undefined;

    const requestPermissions = async () => {
      if (isNative()) {
        // Request native push and local notification permissions
        try {
          const pushResult = await PushNotifications.checkPermissions();
          if (pushResult.receive === 'prompt') {
            await PushNotifications.requestPermissions();
          }

          const localResult = await LocalNotifications.checkPermissions();
          if (localResult.display === 'prompt') {
            await LocalNotifications.requestPermissions();
          }
        } catch {
          // Silently fail if permission request fails
        }
      } else {
        // Initialize Firebase Cloud Messaging for web
        try {
          await initializeFCM();

          // Set up foreground message handler for FCM
          cleanupForegroundHandler = setupForegroundMessageHandler((payload) => {
            // Display notification when app is in foreground
            const title = payload.notification?.title || 'Pal Plant';
            const body = payload.notification?.body || 'You have a new notification';
            sendNotification(title, body);
          }) || undefined;
        } catch (error) {
          console.warn('Failed to initialize FCM:', error);

          // Fallback to requesting basic web notification permissions
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
          }
        }
      }
    };

    requestPermissions();

    return () => {
      cleanupForegroundHandler?.();
    };
  }, [reminders.pushEnabled]);

  // Check and send notifications periodically
  useEffect(() => {
    if (!reminders.pushEnabled) return;

    const REMINDER_KEY = 'friendkeep_last_reminders';
    const getReminderMap = (): Record<string, string> => {
      try {
        return JSON.parse(localStorage.getItem(REMINDER_KEY) || '{}');
      } catch {
        return {};
      }
    };

    const maybeNotify = async () => {
      const now = new Date();
      const reminderMap = getReminderMap();

      // Check for overdue friends
      for (const friend of friends) {
        const status = calculateTimeStatus(friend.lastContacted, friend.frequencyDays);
        if (status.daysLeft <= 0) {
          const key = `friend_${friend.id}_${now.toISOString().split('T')[0]}`;
          if (!reminderMap[key]) {
            await sendNotification(
              `Pal Plant reminder: ${friend.name}`,
              `${friend.name} is overdue for a check-in.`
            );
            reminderMap[key] = now.toISOString();
          }
        }
      }

      // Check for upcoming meetings
      for (const req of meetingRequests) {
        if (req.status !== 'SCHEDULED' || !req.scheduledDate) continue;
        const diffHours = (new Date(req.scheduledDate).getTime() - now.getTime()) / (1000 * 60 * 60);
        if (diffHours > 0 && diffHours <= reminders.reminderHoursBefore) {
          const key = `meeting_${req.id}_${new Date(req.scheduledDate).toISOString()}`;
          if (!reminderMap[key]) {
            await sendNotification(
              `Upcoming meeting with ${req.name}`,
              `Starts in ${Math.max(1, Math.round(diffHours))} hour(s).`
            );
            reminderMap[key] = now.toISOString();
          }
        }
      }

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
      onBackupReminder(`It's been ${daysSince} day(s) since your last backup. Open Settings to export a fresh backup.`);
      localStorage.setItem(BACKUP_REMINDER_KEY, todayKey);
    }
  }, [reminders.backupReminderEnabled, reminders.backupReminderDays, onBackupReminder]);
};

export const markBackupExportedNow = () => {
  localStorage.setItem(BACKUP_KEY, new Date().toISOString());
};
