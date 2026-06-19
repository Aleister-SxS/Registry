// firebase-messaging-sw.js
// Place this file in the ROOT of your GitHub Pages repo (same level as index.html)
// Version: 2026061902

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAZ_kiSp1apPNv_nNRVYJClPEjYat9cnoU",
  authDomain: "berserk-guild-13995.firebaseapp.com",
  projectId: "berserk-guild-13995",
  storageBucket: "berserk-guild-13995.firebasestorage.app",
  messagingSenderId: "997019575170",
  appId: "1:997019575170:web:d03514993128ef69b4a59b"
});

const messaging = firebase.messaging();

// Handle background messages (when tab is not in focus or browser is minimised)
messaging.onBackgroundMessage(function(payload) {
  const title = payload.notification?.title || "Berserk Guild";
  const body  = payload.notification?.body  || "You have a new notification.";
  self.registration.showNotification(title, {
    body,
    icon: "/Registry/icon-192.png",  // update path if you add an icon
    badge: "/Registry/icon-72.png",
    tag: payload.data?.tag || "berserk-guild",
    data: payload.data || {},
  });
});

// Handle notification click — open the relevant page
self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  const url = event.notification.data?.url || "https://aleister-sxs.github.io/Registry/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
