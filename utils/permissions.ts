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

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export type PermissionKind = 'notifications';
export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'blocked';

const isNative = () => Capacitor.isNativePlatform();

/**
 * Check the current status of a permission without prompting the user.
 */
export const checkPermission = async (kind: PermissionKind): Promise<PermissionStatus> => {
  if (!isNative()) {
    if (kind === 'notifications') {
      if (typeof Notification === 'undefined') return 'denied';
      return mapWebNotificationPermission(Notification.permission);
    }
    return 'granted';
  }

  try {
    if (kind === 'notifications') {
      const result = await LocalNotifications.checkPermissions();
      return mapCapacitorPermission(result.display);
    }
  } catch {
    return 'denied';
  }

  return 'denied';
};

/**
 * Request a permission. Returns the resulting status.
 * If the permission was previously denied on Android, the system will not
 * show a dialog — the status will be 'blocked' and the user must go to
 * device Settings to re-enable it.
 */
export const requestPermission = async (kind: PermissionKind): Promise<PermissionStatus> => {
  if (!isNative()) {
    if (kind === 'notifications') {
      if (typeof Notification === 'undefined') return 'denied';
      const result = await Notification.requestPermission();
      return mapWebNotificationPermission(result);
    }
    return 'granted';
  }

  try {
    if (kind === 'notifications') {
      const result = await LocalNotifications.requestPermissions();
      return mapCapacitorPermission(result.display);
    }
  } catch {
    return 'denied';
  }

  return 'denied';
};

// ─── Helpers ──────────────────────────────────────────────────────

function mapCapacitorPermission(state: string | undefined): PermissionStatus {
  switch (state) {
    case 'granted':
      return 'granted';
    case 'denied':
      return 'blocked';
    case 'prompt':
    case 'prompt-with-rationale':
      return 'prompt';
    default:
      return 'denied';
  }
}

function mapWebNotificationPermission(state: NotificationPermission): PermissionStatus {
  switch (state) {
    case 'granted':
      return 'granted';
    case 'denied':
      return 'blocked';
    case 'default':
      return 'prompt';
    default:
      return 'denied';
  }
}
