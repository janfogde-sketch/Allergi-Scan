// public/sw.js — EatSafe Service Worker (push-notifikationer)

// Uden disse to bliver en OPDATERET service worker hængende i "waiting"-tilstand
// og aldrig aktiv for allerede-åbne faner — browseren venter som standard til
// alle faner med den GAMLE service worker er lukket, før den nye overtager.
// Det betyder at en bruger, der har haft appen åben tidligere (fx under test),
// stadig kører den gamle service worker (uden fetch-handleren nedenfor) ved
// næste besøg, og "beforeinstallprompt" udebliver — selvom koden ser korrekt ud.
// skipWaiting + clients.claim() tvinger den nye version til at overtage med det
// samme, uden at kræve at brugeren lukker og genåbner browseren.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// En kontrolleret fetch-handler er et af Chromes kriterier for at appen regnes
// som "installerbar" (og dermed sender "beforeinstallprompt") — uden denne
// kunne browseren i praksis aldrig tilbyde installation, uanset hvor korrekt
// manifestet ellers er sat op. Ren gennemstrømning, ingen caching-strategi.
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

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
