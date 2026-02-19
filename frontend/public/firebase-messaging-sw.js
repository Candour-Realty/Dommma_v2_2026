// Firebase Cloud Messaging Service Worker
// This handles background push notifications when the app is closed or in background

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBgVjeQ_3HoeMDWRW81W5WFpgX5oG69rUM",
  authDomain: "dommma-6ee32.firebaseapp.com",
  projectId: "dommma-6ee32",
  storageBucket: "dommma-6ee32.firebasestorage.app",
  messagingSenderId: "858858950233",
  appId: "1:858858950233:web:9fcf3cff311d136e836b48",
  measurementId: "G-DGJPK7M8R7"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'DOMMMA Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: payload.data?.tag || 'dommma-notification',
    data: payload.data,
    actions: getNotificationActions(payload.data?.type)
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Get appropriate actions based on notification type
function getNotificationActions(type) {
  switch (type) {
    case 'message':
      return [
        { action: 'reply', title: 'Reply' },
        { action: 'view', title: 'View Message' }
      ];
    case 'payment':
      return [
        { action: 'view', title: 'View Details' }
      ];
    case 'document':
      return [
        { action: 'sign', title: 'Sign Document' },
        { action: 'view', title: 'View Document' }
      ];
    case 'property':
      return [
        { action: 'view', title: 'View Property' },
        { action: 'schedule', title: 'Schedule Viewing' }
      ];
    default:
      return [
        { action: 'view', title: 'View' }
      ];
  }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  let urlToOpen = '/dashboard';
  
  // Determine URL based on notification type and action
  if (data.type === 'message') {
    urlToOpen = '/dashboard/messages';
  } else if (data.type === 'payment') {
    urlToOpen = '/dashboard/payments';
  } else if (data.type === 'document') {
    urlToOpen = '/dashboard/documents';
  } else if (data.type === 'property' && data.propertyId) {
    urlToOpen = `/browse?property=${data.propertyId}`;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle push event (for custom handling)
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received');
  
  if (event.data) {
    const data = event.data.json();
    console.log('Push data:', data);
  }
});

console.log('[firebase-messaging-sw.js] Service worker loaded');
