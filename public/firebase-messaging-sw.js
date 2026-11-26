importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyA5jXVwNBkFCDReMPIpTgp7B3Q7TB9-7x0',
  authDomain: 'abss-18ce4.firebaseapp.com',
  projectId: 'abss-18ce4',
  storageBucket: 'abss-18ce4.firebasestorage.app',
  messagingSenderId: '35023273054',
  appId: '1:35023273054:web:08b8f13ac02f0a65a488cf',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const { orderId, icon, title, body } = payload?.data ?? {};

  const clickAction = orderId
    ? `${self.location.origin}/customer-orders/${orderId}`
    : self.location.origin;

  self.registration.showNotification(title, {
    body,
    icon: icon || '/AppIcon.png',
    tag: orderId ? `order-${orderId}` : `notif-${title}-${body}`.slice(0, 64),
    renotify: false,
    data: { clickAction },
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const clickAction = event.notification?.data?.clickAction;
  const urlToOpen = clickAction || self.location.origin;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      const existingWindow = windowClients.find(client => client.url.startsWith(self.location.origin));
      if (existingWindow) {
        existingWindow.focus();
        if (clickAction) existingWindow.postMessage({ type: 'SW_NAVIGATE', url: clickAction });
        return;
      }
      return clients.openWindow(urlToOpen);
    }),
  );
});
