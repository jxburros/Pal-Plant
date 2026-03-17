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

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Friend, MeetingRequest } from '../types';
import { calculateTimeStatus } from '../utils/helpers';
import { getMetadata, saveMetadata } from '../utils/storage';
import { checkPermission, requestPermission } from '../utils/permissions';

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

// Stable channel IDs — must not change across app versions
const CHANNEL_REMINDERS = 'reminders_high';
const CHANNEL_GENERAL = 'general_updates';
const CHANNEL_BACKGROUND = 'background_low';

let channelsInitialized = false;

const isNative = () => Capacitor.isNativePlatform();
const isAndroid = () => Capacitor.getPlatform() === 'android';

/**
 * Create all notification channels at app startup (Android 8+).
 * Channels must exist before any notification is sent.
 * Channel importance cannot be changed after creation, so we create them
 * once with the correct settings and never recreate them.
 */
const initNotificationChannels = async () => {
  if (channelsInitialized || !isAndroid()) return;

  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_REMINDERS,
      name: 'Reminders',
      description: 'Contact check-in and meeting reminders',
      importance: 4, // HIGH
      visibility: 1, // PUBLIC
    });

    await LocalNotifications.createChannel({
      id: CHANNEL_GENERAL,
      name: 'General Updates',
      description: 'General app notifications',
      importance: 3, // DEFAULT
      visibility: 1,
    });

    await LocalNotifications.createChannel({
      id: CHANNEL_BACKGROUND,
      name: 'Background',
      description: 'Low-priority background notifications',
      importance: 2, // LOW
      visibility: 0, // PRIVATE
    });

    channelsInitialized = true;
  } catch (error) {
    console.warn('Failed to create notification channels:', error);
  }
};

/**
 * Send a local notification. Checks permission before scheduling.
 */
const sendNotification = async (
  title: string,
  body: string,
  payload?: { type: string; route: string; entityId: string },
) => {
  if (!isNative()) return;

  try {
    await initNotificationChannels();

    const status = await checkPermission('notifications');
    if (status !== 'granted') {
      console.warn('Local notification permission not granted');
      return;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + NOTIFICATION_DELAY_MS) },
          channelId: CHANNEL_REMINDERS,
          extra: payload,
        },
      ],
    });
  } catch (error) {
    console.warn('Failed to send notification:', error);
  }
};

export const useReminderEngine = ({ friends, meetingRequests, reminders, onBackupReminder, onQuickBackup }: ReminderEngineArgs) => {
  // Initialize notification channels at app startup (Android 8+)
  // and set up notification tap handler — runs once, unconditionally.
  useEffect(() => {
    if (!isNative()) return;

    initNotificationChannels();

    // Handle notification taps — route to the relevant screen
    const setupListeners = async () => {
      await LocalNotifications.removeAllListeners();

      await LocalNotifications.addListener(
        'localNotificationActionPerformed',
        (action) => {
          const payload = action.notification.extra as
            | { type?: string; route?: string; entityId?: string }
            | undefined;

          if (payload?.route) {
            // Navigate within the SPA.  For a Capacitor web-view app the
            // simplest reliable approach is to push the route onto the
            // browser history so React picks it up.
            window.location.hash = payload.route;
          }
        },
      );
    };

    setupListeners();

    return () => {
      if (isNative()) {
        LocalNotifications.removeAllListeners();
      }
    };
  }, []);

  // Request notification permissions when the user enables reminders
  useEffect(() => {
    if (!reminders.pushEnabled || !isNative()) return;

    const ensurePermissions = async () => {
      try {
        const status = await checkPermission('notifications');
        if (status === 'prompt') {
          await requestPermission('notifications');
        }
      } catch {
        // Silently fail if permission request fails
      }
    };

    ensurePermissions();
  }, [reminders.pushEnabled]);

  // Check and send notifications periodically
  useEffect(() => {
    if (!reminders.pushEnabled) return;

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

      // Check for overdue friends
      for (const friend of friends) {
        const status = calculateTimeStatus(friend.lastContacted, friend.frequencyDays);
        if (status.daysLeft <= 0) {
          const key = `friend_${friend.id}_${now.toISOString().split('T')[0]}`;
          if (!reminderMap[key]) {
            await sendNotification(
              `Pal Plant reminder: ${friend.name}`,
              `${friend.name} is overdue for a check-in.`,
              { type: 'reminder', route: `/friend/${friend.id}`, entityId: friend.id },
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
              `Starts in ${Math.max(1, Math.round(diffHours))} hour(s).`,
              { type: 'reminder', route: `/meeting/${req.id}`, entityId: req.id },
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
