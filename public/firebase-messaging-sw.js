importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCxvEQB6O-eJw2r6eyvZ4e8_mPW7WeE8Ts",
  projectId: "melon-lions-hub",
  messagingSenderId: "616255265177",
  appId: "1:616255265177:web:dbf567be8213fb3313db08"
});

const messaging = firebase.messaging();

// バックグラウンドで通知を受け取った時の処理
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png', 
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});