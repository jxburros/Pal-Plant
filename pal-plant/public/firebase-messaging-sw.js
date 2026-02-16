// Firebase Cloud Messaging Service Worker
// This service worker handles background notifications when the app is closed or minimized

importScripts('https://www.gstatic.com/firebasejs/12.2.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
const firebaseConfig = {
  apiKey: 'AIzaSyCGKDTAi4dReXOYFs92xhDfSVduy_fntZg',
  authDomain: 'pal-plant.firebaseapp.com',
  projectId: 'pal-plant',
  storageBucket: 'pal-plant.firebasestorage.app',
  messagingSenderId: '85069651501',
  appId: '1:85069651501:web:e6c4dcbc62458d12ff22a4',
  measurementId: 'G-DPRV8B32KV',
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'Pal Plant';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: payload.notification?.icon || '/icon.svg',
    badge: '/badge.svg',
    tag: payload.data?.tag || 'pal-plant-notification',
    data: payload.data,
    requireInteraction: false,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.', event);

  event.notification.close();

  // Open or focus the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
