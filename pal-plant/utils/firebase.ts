const FIREBASE_APP_CDN_URL = 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
const FIREBASE_ANALYTICS_CDN_URL = 'https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js';
const FIREBASE_MESSAGING_CDN_URL = 'https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging.js';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCGKDTAi4dReXOYFs92xhDfSVduy_fntZg',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'pal-plant.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'pal-plant',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'pal-plant.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '85069651501',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:85069651501:web:e6c4dcbc62458d12ff22a4',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-DPRV8B32KV',
};

let initialized = false;
let messagingInstance: any = null;
let analyticsInstance: any = null;

/**
 * Initializes Firebase SDK from CDN at runtime.
 * This keeps the app buildable in restricted environments where npm install is blocked.
 */
export const initializeFirebase = async () => {
  if (initialized || typeof window === 'undefined') {
    return;
  }

  const [{ initializeApp }, { getAnalytics, isSupported }, { getMessaging, isSupported: isMessagingSupported }] = await Promise.all([
    import(/* @vite-ignore */ FIREBASE_APP_CDN_URL),
    import(/* @vite-ignore */ FIREBASE_ANALYTICS_CDN_URL),
    import(/* @vite-ignore */ FIREBASE_MESSAGING_CDN_URL),
  ]);

  const app = initializeApp(firebaseConfig);

  // Initialize Analytics if supported
  if (await isSupported()) {
    analyticsInstance = getAnalytics(app);
  }

  // Initialize Messaging if supported
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

/**
 * Gets the Firebase Analytics instance.
 * Returns null if analytics is not supported or not initialized.
 */
export const getFirebaseAnalytics = () => {
  return analyticsInstance;
};
