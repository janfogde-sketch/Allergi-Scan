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

// Push er kun den korte tekst; den fulde besked ligger i appen og åbnes via
// url'en (https://www.eatsafe.dk/?notification={id}). Se _shared/webpush.ts og
// notify-funktionen. Ingen standard-badge (filen fandtes aldrig) og ingen
// tvungen vibration — enheden bestemmer selv.
const APP_ORIGINS = ["https://www.eatsafe.dk", "https://eatsafe.dk"];
const APP_HOME = "https://www.eatsafe.dk/";

function safeAppUrl(raw) {
  try {
    const u = new URL(raw, APP_HOME);
    return APP_ORIGINS.includes(u.origin) ? u.href : APP_HOME;
  } catch {
    return APP_HOME;
  }
}

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); } catch { return; }
  // Udløbet besked (fx enheden var offline): vis den ikke.
  if (data.expiresAt && Date.parse(data.expiresAt) < Date.now()) return;
  const options = {
    body: data.body ?? "",
    icon: data.icon ?? "/icon-192.png",
    lang: data.lang ?? "da",
    data: { url: safeAppUrl(data.url), notificationId: data.notificationId ?? null },
  };
  if (data.badge) options.badge = data.badge;
  if (data.tag) options.tag = data.tag; // samme tag erstatter en tidligere besked om samme sag
  event.waitUntil(self.registration.showNotification(data.title ?? "EatSafe", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = safeAppUrl(event.notification.data?.url);
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clientList) => {
      for (const client of clientList) {
        if (APP_ORIGINS.includes(new URL(client.url).origin) && "focus" in client) {
          await client.focus();
          if ("navigate" in client) { try { return await client.navigate(url); } catch { /* åbn nyt vindue */ } }
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
