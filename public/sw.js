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
// Kun egne adresser sendes igennem: indholdsspærren (vercel.json) lader service workeren kun hente fra
// eatsafe.dk og Supabase, så billeder fra Open Food Facts m.fl. hentes direkte af siden i stedet.
self.addEventListener("fetch", (event) => {
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request));
});

// Push er kun den korte tekst; den fulde besked ligger i appen og åbnes via
// url'en (https://www.eatsafe.dk/?notification={id}). Se _shared/webpush.ts og
// notify-funktionen. Ingen standard-badge (filen fandtes aldrig) og ingen
// tvungen vibration — enheden bestemmer selv.
const APP_ORIGINS = ["https://www.eatsafe.dk", "https://www.eatsafe.dk"];
const APP_HOME = "https://www.eatsafe.dk/";

function safeAppUrl(raw) {
  try {
    const u = new URL(raw, APP_HOME);
    return APP_ORIGINS.includes(u.origin) ? u.href : APP_HOME;
  } catch {
    return APP_HOME;
  }
}

// En push skal ALTID vise en notifikation (F1-8, 6. okt. 2026). En stille push giver i Chrome
// "Webstedet er opdateret i baggrunden", og Safari kan trække abonnementet tilbage efter
// gentagne stille push. Tom/ulæselig eller udløbet push viser derfor en neutral besked.
const FALLBACK_PUSH = { title: "EatSafe", body: "Du har en ny besked i EatSafe." };

self.addEventListener("push", (event) => {
  let data;
  try { data = event.data ? event.data.json() : null; } catch { data = null; }
  if (!data || typeof data !== "object") {
    event.waitUntil(self.registration.showNotification(FALLBACK_PUSH.title, {
      body: FALLBACK_PUSH.body, icon: "/icon-192.png", lang: "da", data: { url: APP_HOME, notificationId: null },
    }));
    return;
  }
  // Udløbet besked (fx enheden var offline længe): vis ikke det forældede indhold, kun en neutral linje.
  if (data.expiresAt && Date.parse(data.expiresAt) < Date.now()) {
    const expired = { body: "En besked er ikke længere aktuel. Åbn EatSafe for at se dine beskeder.", icon: "/icon-192.png", lang: "da", data: { url: APP_HOME, notificationId: null } };
    if (data.tag) expired.tag = data.tag;
    event.waitUntil(self.registration.showNotification("EatSafe", expired));
    return;
  }
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
          // navigate() kan give null (uden at navigere) for et vindue, som service workeren ikke styrer —
          // så falder vi videre til openWindow, i stedet for kun at fokusere appen uden at åbne beskeden.
          if ("navigate" in client) { try { const nav = await client.navigate(url); if (nav) return nav; } catch { /* åbn nyt vindue */ } }
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
