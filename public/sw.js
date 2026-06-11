// public/sw.js — EatSafe Service Worker (push-notifikationer)

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? "EatSafe", {
      body: data.body ?? "",
      icon: data.icon ?? "/icon-192.png",
      badge: data.badge ?? "/badge-72.png",
      data: { url: data.url ?? "https://eatsafe.dk" },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "https://eatsafe.dk";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
