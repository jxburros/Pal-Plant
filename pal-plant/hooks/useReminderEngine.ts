/*
 * Copyright 2026 Jeffrey Guntly (JX Holdings, LLC)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Friend, MeetingRequest } from '../types';
import { calculateTimeStatus } from '../utils/helpers';
import { initializeFCM, setupForegroundMessageHandler } from '../utils/firebaseMessaging';
import { getMetadata, saveMetadata } from '../utils/storage';

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

// Stable ID ranges so we can cancel/reschedule without conflicts.
// iOS allows up to 64 scheduled local notifications total, so we budget:
//   IDs 1000–1049  → friend overdue reminders (up to 50 friends)
//   IDs 2000–2049  → meeting reminders (up to 50 meetings)
const FRIEND_NOTIFICATION_ID_BASE = 1000;
const MEETING_NOTIFICATION_ID_BASE = 2000;
const MAX_SCHEDULED_PER_TYPE = 50;

const isNative = () => Capacitor.isNativePlatform();

/**
 * Ensure the Android notification channel exists.
 * Safe to call repeatedly — Android silently ignores duplicate creates.
 */
const ensureNotificationChannel = async () => {
  if (Capacitor.getPlatform() === 'android') {
    try {
      await LocalNotifications.createChannel({
        id: 'pal-plant-reminders',
        name: 'Reminders',
        description: 'Pal Plant reminders for contacts and meetings',
        importance: 4,
        visibility: 1,
      });
    } catch {
      // Channel may already exist
    }
  }
};

/**
 * Send an immediate notification (for foreground / real-time use).
 */
const sendNotification = async (title: string, body: string) => {
  if (isNative()) {
    try {
      await ensureNotificationChannel();
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Date.now() % 100000, // Avoid collision with pre-scheduled IDs
            schedule: { at: new Date(Date.now() + 1000) },
            channelId: 'pal-plant-reminders',
          },
        ],
      });
    } catch {
      // Silently fail
    }
  } else {
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

/**
 * Pre-schedule local notifications for friend deadlines and meetings.
 * The OS delivers these even if the app is closed / killed.
 *
 * Called whenever friends or meetings data changes so schedules stay current.
 */
const scheduleUpcomingNotifications = async (
  friends: Friend[],
  meetingRequests: MeetingRequest[],
  reminderHoursBefore: number
) => {
  if (!isNative()) return; // Web uses the interval-based approach below

  try {
    await ensureNotificationChannel();

    // Cancel all previously scheduled friend/meeting notifications
    const idsToCancel: { id: number }[] = [];
    for (let i = 0; i < MAX_SCHEDULED_PER_TYPE; i++) {
      idsToCancel.push({ id: FRIEND_NOTIFICATION_ID_BASE + i });
      idsToCancel.push({ id: MEETING_NOTIFICATION_ID_BASE + i });
    }
    await LocalNotifications.cancel({ notifications: idsToCancel });

    const now = new Date();
    const notificationsToSchedule: Array<{
      title: string;
      body: string;
      id: number;
      schedule: { at: Date };
      channelId: string;
    }> = [];

    // --- Friend overdue notifications ---
    // Sort by deadline (soonest first) so the most urgent get slots
    const friendsWithDeadlines = friends
      .map(f => {
        const status = calculateTimeStatus(f.lastContacted, f.frequencyDays);
        return { friend: f, goalDate: status.goalDate, isOverdue: status.isOverdue };
      })
      .filter(entry => !entry.isOverdue) // Only future deadlines
      .sort((a, b) => a.goalDate.getTime() - b.goalDate.getTime())
      .slice(0, MAX_SCHEDULED_PER_TYPE);

    friendsWithDeadlines.forEach((entry, index) => {
      if (entry.goalDate > now) {
        notificationsToSchedule.push({
          title: `${entry.friend.name} needs a check-in`,
          body: `Your timer for ${entry.friend.name} has expired. Time to reach out!`,
          id: FRIEND_NOTIFICATION_ID_BASE + index,
          schedule: { at: entry.goalDate },
          channelId: 'pal-plant-reminders',
        });
      }
    });

    // --- Meeting reminder notifications ---
    const upcomingMeetings = meetingRequests
      .filter(m => m.status === 'SCHEDULED' && m.scheduledDate)
      .map(m => ({ meeting: m, date: new Date(m.scheduledDate!) }))
      .filter(m => m.date > now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, MAX_SCHEDULED_PER_TYPE);

    upcomingMeetings.forEach((entry, index) => {
      const reminderMs = reminderHoursBefore * 60 * 60 * 1000;
      const scheduleAt = new Date(entry.date.getTime() - reminderMs);
      if (scheduleAt > now) {
        const hours = Math.max(1, Math.round(reminderMs / (1000 * 60 * 60)));
        notificationsToSchedule.push({
          title: `Upcoming meeting with ${entry.meeting.name}`,
          body: `Starts in ${hours} hour(s).`,
          id: MEETING_NOTIFICATION_ID_BASE + index,
          schedule: { at: scheduleAt },
          channelId: 'pal-plant-reminders',
        });
      }
    });

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
    }
  } catch (error) {
    console.warn('Failed to schedule upcoming notifications:', error);
  }
};

export const useReminderEngine = ({ friends, meetingRequests, reminders, onBackupReminder, onQuickBackup }: ReminderEngineArgs) => {
  const permissionsInitialized = useRef(false);

  // Request permissions and initialize notification infrastructure on mount
  useEffect(() => {
    if (!reminders.pushEnabled) return;
    if (permissionsInitialized.current) return;
    permissionsInitialized.current = true;

    let cleanupForegroundHandler: (() => void) | undefined;

    const requestPermissions = async () => {
      if (isNative()) {
        try {
          const pushResult = await PushNotifications.checkPermissions();
          const resolvedPushPermission = pushResult.receive === 'prompt'
            ? (await PushNotifications.requestPermissions()).receive
            : pushResult.receive;

          if (resolvedPushPermission === 'granted') {
            await PushNotifications.unregister().catch(() => undefined);
            await PushNotifications.register();
          }

          const localResult = await LocalNotifications.checkPermissions();
          if (localResult.display === 'prompt') {
            await LocalNotifications.requestPermissions();
          }

          PushNotifications.removeAllListeners();
          PushNotifications.addListener('registration', async (token) => {
            await saveMetadata('friendkeep_native_push_token', token.value);
          });

          PushNotifications.addListener('registrationError', (error) => {
            console.warn('Native push registration error:', error);
          });

          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            const title = notification.title || 'Pal Plant';
            const body = notification.body || 'You have a new notification';
            sendNotification(title, body);
          });
        } catch {
          // Silently fail if permission request fails
        }
      } else {
        // Initialize Firebase Cloud Messaging for web
        try {
          await initializeFCM();

          cleanupForegroundHandler = setupForegroundMessageHandler((payload) => {
            const title = payload.notification?.title || 'Pal Plant';
            const body = payload.notification?.body || 'You have a new notification';
            sendNotification(title, body);
          }) || undefined;
        } catch (error) {
          console.warn('Failed to initialize FCM:', error);

          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
          }
        }
      }
    };

    requestPermissions();

    return () => {
      cleanupForegroundHandler?.();
      if (isNative()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [reminders.pushEnabled]);

  // ─── Native: pre-schedule notifications for future deadlines ────
  // The OS delivers these even when the app is closed or killed.
  // Re-runs whenever friends/meetings change so schedules stay current.
  useEffect(() => {
    if (!reminders.pushEnabled || !isNative()) return;

    scheduleUpcomingNotifications(friends, meetingRequests, reminders.reminderHoursBefore);
  }, [friends, meetingRequests, reminders.pushEnabled, reminders.reminderHoursBefore]);

  // ─── Web: interval-based checking (can't pre-schedule in browsers) ────
  useEffect(() => {
    if (!reminders.pushEnabled || isNative()) return;

    const REMINDER_KEY = 'friendkeep_last_reminders';
    const getReminderMap = async (): Promise<Record<string, string>> => {
      try {
        const data = await getMetadata(REMINDER_KEY);
        return data ? JSON.parse(data) : {};
      } catch {
        return {};
      }
    };

    const maybeNotify = async () => {
      const now = new Date();
      const reminderMap = await getReminderMap();

      for (const friend of friends) {
        const status = calculateTimeStatus(friend.lastContacted, friend.frequencyDays);
        if (status.daysLeft <= 0) {
          const key = `friend_${friend.id}_${now.toISOString().split('T')[0]}`;
          if (!reminderMap[key]) {
            await sendNotification(
              `${friend.name} needs a check-in`,
              `${friend.name} is overdue for a check-in.`
            );
            reminderMap[key] = now.toISOString();
          }
        }
      }

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

      await saveMetadata(REMINDER_KEY, JSON.stringify(reminderMap));
    };

    maybeNotify();
    const interval = setInterval(maybeNotify, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [friends, meetingRequests, reminders.pushEnabled, reminders.reminderHoursBefore]);

  // ─── Backup reminders ────
  useEffect(() => {
    if (!reminders.backupReminderEnabled) return;

    const checkBackup = async () => {
      const now = new Date();
      const todayKey = now.toISOString().split('T')[0];
      const lastReminderDay = await getMetadata(BACKUP_REMINDER_KEY);
      if (lastReminderDay === todayKey) return;

      const lastBackupRaw = await getMetadata(BACKUP_KEY);
      if (!lastBackupRaw) {
        onBackupReminder('Tip: Create your first backup from Settings → Data Management.');
        await saveMetadata(BACKUP_REMINDER_KEY, todayKey);
        return;
      }

      const daysSince = Math.floor((now.getTime() - new Date(lastBackupRaw).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince >= reminders.backupReminderDays) {
        onBackupReminder(`It's been ${daysSince} day(s) since your last backup. Open Settings to export a fresh backup.`);
        await saveMetadata(BACKUP_REMINDER_KEY, todayKey);
      }
    };

    checkBackup();
  }, [reminders.backupReminderEnabled, reminders.backupReminderDays, onBackupReminder]);
};

export const markBackupExportedNow = async () => {
  await saveMetadata(BACKUP_KEY, new Date().toISOString());
};
