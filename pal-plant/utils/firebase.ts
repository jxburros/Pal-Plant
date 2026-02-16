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

/**
 * Firebase configuration for Pal-Plant
 * 
 * IMPORTANT: Firebase is used ONLY for push notifications (FCM).
 * No other Firebase services (Analytics, Auth, Firestore, etc.) are permitted.
 * This is a local-first app with push notifications as the only cloud dependency.
 */

const FIREBASE_APP_CDN_URL = 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
const FIREBASE_MESSAGING_CDN_URL = 'https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging.js';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCGKDTAi4dReXOYFs92xhDfSVduy_fntZg',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'pal-plant.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'pal-plant',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'pal-plant.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '85069651501',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:85069651501:web:e6c4dcbc62458d12ff22a4',
  // Note: measurementId removed - Analytics not used
};

let initialized = false;
let messagingInstance: any = null;

/**
 * Initializes Firebase SDK from CDN at runtime for push notifications ONLY.
 * This keeps the app buildable in restricted environments where npm install is blocked.
 * 
 * Firebase is ONLY used for Cloud Messaging (FCM) for push notifications.
 * No other Firebase services are initialized or used.
 */
export const initializeFirebase = async () => {
  if (initialized || typeof window === 'undefined') {
    return;
  }

  const [{ initializeApp }, { getMessaging, isSupported: isMessagingSupported }] = await Promise.all([
    import(/* @vite-ignore */ FIREBASE_APP_CDN_URL),
    import(/* @vite-ignore */ FIREBASE_MESSAGING_CDN_URL),
  ]);

  const app = initializeApp(firebaseConfig);

  // Initialize Messaging if supported (ONLY service allowed)
  if (await isMessagingSupported()) {
    try {
      messagingInstance = getMessaging(app);
    } catch (error) {
      console.warn('Firebase Messaging not available:', error);
    }
  }

  initialized = true;
};

/**
 * Gets the Firebase Messaging instance.
 * Returns null if messaging is not supported or not initialized.
 */
export const getFirebaseMessaging = () => {
  return messagingInstance;
};
