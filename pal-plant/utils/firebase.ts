const FIREBASE_APP_CDN_URL = 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
const FIREBASE_ANALYTICS_CDN_URL = 'https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let initialized = false;

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);

/**
 * Initializes Firebase SDK from CDN at runtime.
 * This keeps the app buildable in restricted environments where npm install is blocked.
 */
export const initializeFirebase = async () => {
  if (initialized || !hasFirebaseConfig || typeof window === 'undefined') {
    return;
  }

  const [{ initializeApp }, { getAnalytics, isSupported }] = await Promise.all([
    import(/* @vite-ignore */ FIREBASE_APP_CDN_URL),
    import(/* @vite-ignore */ FIREBASE_ANALYTICS_CDN_URL),
  ]);

  const app = initializeApp(firebaseConfig);

  if (await isSupported()) {
    getAnalytics(app);
  }

  initialized = true;
};
