import { getFirebaseMessaging } from './firebase';
import { getMetadata, saveMetadata } from './storage';

const FCM_TOKEN_KEY = 'pal_plant_fcm_token';
const VAPID_KEY = 'BJYgoCs1JF5LsEYA9OqllAkseQxZDOv-JpvyvrdWR41YWB3wyH2-NXa1x28MhFAiSQhqggGyq_TicN_HD2GOu4o';

/**
 * Registers the service worker for Firebase Cloud Messaging.
 * Service workers enable background notifications.
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers are not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered successfully:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

/**
 * Requests notification permission from the user.
 * Required before we can register for push notifications.
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('Notifications are not supported in this browser');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

/**
 * Gets the current FCM token from Firebase Messaging.
 * This token is used to send notifications to this specific device.
 */
export const getFCMToken = async (): Promise<string | null> => {
  const messaging = getFirebaseMessaging();

  if (!messaging) {
    console.warn('Firebase Messaging is not initialized');
    return null;
  }

  // Check if we have permission
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  // Register service worker first
  const registration = await registerServiceWorker();
  if (!registration) {
    console.warn('Service Worker registration failed');
    return null;
  }

  try {
    // Import getToken dynamically since messaging module was loaded via CDN
    const { getToken } = await import('https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging.js');

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('FCM Token obtained:', token);
      await saveMetadata(FCM_TOKEN_KEY, token);
      return token;
    } else {
      console.warn('No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Gets the cached FCM token from storage.
 */
export const getCachedFCMToken = async (): Promise<string | null> => {
  return await getMetadata(FCM_TOKEN_KEY);
};

/**
 * Clears the cached FCM token.
 * Call this when the user logs out or disables notifications.
 */
export const clearFCMToken = async (): Promise<void> => {
  await saveMetadata(FCM_TOKEN_KEY, '');
};

/**
 * Sets up a handler for foreground messages (when the app is active).
 * Background messages are handled by the service worker.
 */
export const setupForegroundMessageHandler = (onMessage: (payload: any) => void): (() => void) | null => {
  const messaging = getFirebaseMessaging();

  if (!messaging) {
    console.warn('Firebase Messaging is not initialized');
    return null;
  }

  try {
    let unsubscribe: (() => void) | null = null;
    let isActive = true;

    // Import onMessage dynamically since messaging module was loaded via CDN
    import('https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging.js').then(({ onMessage: onMessageFn }) => {
      if (!isActive) return;

      unsubscribe = onMessageFn(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        onMessage(payload);
      });
    });

    // Return a cleanup function
    return () => {
      isActive = false;
      unsubscribe?.();
      console.log('Foreground message handler cleaned up');
    };
  } catch (error) {
    console.error('Error setting up foreground message handler:', error);
    return null;
  }
};

/**
 * Sends the FCM token to your backend server when an endpoint is configured.
 */
export const sendTokenToServer = async (token: string): Promise<boolean> => {
  const endpoint = import.meta.env.VITE_FCM_TOKEN_ENDPOINT;

  if (!endpoint) {
    console.info('Skipping token sync: VITE_FCM_TOKEN_ENDPOINT is not configured.');
    return false;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      console.error('Failed to send token to server:', response.status, response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending token to server:', error);
    return false;
  }
};

/**
 * Initializes Firebase Cloud Messaging for the app.
 * Call this once when the app starts.
 */
export const initializeFCM = async (): Promise<void> => {
  try {
    // Get or request FCM token
    const token = await getFCMToken();

    if (token) {
      // Send token to server
      await sendTokenToServer(token);
    }
  } catch (error) {
    console.error('Error initializing FCM:', error);
  }
};
