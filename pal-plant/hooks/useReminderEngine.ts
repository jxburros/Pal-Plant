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
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Friend, MeetingRequest } from '../types';
import { calculateTimeStatus } from '../utils/helpers';
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
const NOTIFICATION_DELAY_MS = 1000; // Delay before showing notification (1 second)
const NOTIFICATION_CHANNEL_ID = 'pal-plant-reminders';

let notificationChannelCreated = false;

const isNative = () => Capacitor.isNativePlatform();

// Create notification channel for Android (called once)
const createNotificationChannel = async () => {
  if (notificationChannelCreated || Capacitor.getPlatform() !== 'android') {
    return;
  }

  try {
    await LocalNotifications.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: 'Reminders',
      description: 'Pal Plant reminders for contacts and meetings',
      importance: 4,
      visibility: 1,
    });
    notificationChannelCreated = true;
  } catch (error) {
    console.warn('Failed to create notification channel:', error);
  }
};

// Helper to send notifications using Capacitor (native only)
const sendNotification = async (title: string, body: string) => {
  if (!isNative()) {
    // Web notifications not supported - notifications are Capacitor-only
    return;
  }

  try {
    // Ensure channel is created on Android
    await createNotificationChannel();

    // Check if local notification permissions are granted
    const permissions = await LocalNotifications.checkPermissions();
    if (permissions.display !== 'granted') {
      console.warn('Local notification permission not granted');
      return;
    }

    // Schedule a local notification
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + NOTIFICATION_DELAY_MS) },
          channelId: NOTIFICATION_CHANNEL_ID,
        },
      ],
    });
  } catch (error) {
    console.warn('Failed to send notification:', error);
  }
};

export const useReminderEngine = ({ friends, meetingRequests, reminders, onBackupReminder, onQuickBackup }: ReminderEngineArgs) => {
  // Request permissions for native push notifications on mount
  useEffect(() => {
    if (!reminders.pushEnabled || !isNative()) return;

    const requestPermissions = async () => {
      try {
        // Request native push notification permissions
        const pushResult = await PushNotifications.checkPermissions();
        const resolvedPushPermission = pushResult.receive === 'prompt'
          ? (await PushNotifications.requestPermissions()).receive
          : pushResult.receive;

        if (resolvedPushPermission === 'granted') {
          await PushNotifications.unregister().catch(() => undefined);
          await PushNotifications.register();
        }

        // Request local notification permissions
        const localResult = await LocalNotifications.checkPermissions();
        if (localResult.display === 'prompt') {
          await LocalNotifications.requestPermissions();
        }

        // Set up listeners
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
    };

    requestPermissions();

    return () => {
      if (isNative()) {
        PushNotifications.removeAllListeners();
      }
    };
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
