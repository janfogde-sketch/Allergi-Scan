// src/usePush.js
// Håndterer push-notifikation tilladelse, service worker og token-opbevaring

import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { makeHeaders } from "./helpers.js";

// VAPID public key — skal matche den genererede nøgle i Supabase secrets
// Generér med: npx web-push generate-vapid-keys
// Indsæt din VAPID_PUBLIC_KEY her:
const VAPID_PUBLIC_KEY = "BJYPtJFzv1T3iPhd4V9EvRfsvn5mvreXeaTjL8BviWt1nMi7TlyXP83vsplYPFsWaC8byu3-KnCABVW1XMWdVgM";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export const SAVE_FAILED_REASON = "Kunne ikke gemme abonnementet";

// Gem push token i Supabase. Returnerer true, hvis serveren tog imod den (en allerede gemt
// token er også ok); tidligere blev svaret aldrig tjekket, så en fejl var usynlig.
async function saveTokenToSupabase(token, accessToken) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/push_tokens`, {
      method: "POST",
      headers: {
        ...makeHeaders(accessToken),
        "Prefer": "resolution=ignore-duplicates",
      },
      body: JSON.stringify({ token: JSON.stringify(token) }),
    });
    if (!res.ok) console.warn("[usePush] Serveren afviste token:", res.status);
    return res.ok;
  } catch (e) {
    console.warn("[usePush] Kunne ikke gemme token:", e);
    return false;
  }
}

const pushSupported = () =>
  typeof navigator !== "undefined" && "serviceWorker" in navigator &&
  typeof window !== "undefined" && "PushManager" in window && "Notification" in window;

/**
 * Sørger for, at den KONTO, der er logget ind, har enhedens push-abonnement gemt. Telefonens tilladelse
 * gælder for enheden, ikke for kontoen: logger man ind med en anden konto på en enhed, der allerede har
 * givet tilladelse, bliver abonnementet ellers aldrig gemt for den nye konto (appen viser push som
 * "slået til", men der kommer intet). Spørger aldrig om tilladelse; gør intet uden den.
 */
export async function syncPushToken(accessToken) {
  if (!accessToken || !pushSupported() || Notification.permission !== "granted") return { ok: false, reason: "Ingen tilladelse" };
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) });
    }
    const saved = await saveTokenToSupabase(sub.toJSON(), accessToken);
    return saved ? { ok: true, subscription: sub } : { ok: false, reason: SAVE_FAILED_REASON };
  } catch (e) {
    console.warn("[usePush] sync fejl:", e);
    return { ok: false, reason: String(e) };
  }
}

/**
 * Ved logout: fjern DENNE kontos række for enhedens abonnement (browserens abonnement beholdes, så den
 * næste konto kan bruge det). Ellers ville den forrige kontos beskeder fortsat vises på enheden.
 */
export async function forgetPushTokenForDevice(accessToken) {
  if (!accessToken || !pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) await deleteTokenFromSupabase(sub.toJSON(), accessToken);
  } catch { /* logout må aldrig fejle her */ }
}

// Slet push token fra Supabase (ved afmelding)
async function deleteTokenFromSupabase(token, accessToken) {
  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/push_tokens?token=eq.${encodeURIComponent(JSON.stringify(token))}`,
      { method: "DELETE", headers: makeHeaders(accessToken) }
    );
  } catch (e) {
    console.warn("[usePush] Kunne ikke slette token:", e);
  }
}

// Returnerer { supported, permission, subscribe, unsubscribe }
export function usePush() {
  const supported =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  const permission = supported ? Notification.permission : "denied";

  // Registrér SW og abonnér på push
  async function subscribe(accessToken) {
    if (!supported) return { ok: false, reason: "Ikke understøttet" };
    if (VAPID_PUBLIC_KEY === "DIN_VAPID_PUBLIC_KEY_HER") {
      console.warn("[usePush] VAPID_PUBLIC_KEY er ikke sat — se usePush.js");
      return { ok: false, reason: "VAPID ikke konfigureret" };
    }

    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const result = await Notification.requestPermission();
      if (result !== "granted") return { ok: false, reason: "Tilladelse afvist" };

      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        const saved = await saveTokenToSupabase(existing.toJSON(), accessToken);
        return saved ? { ok: true, subscription: existing } : { ok: false, reason: SAVE_FAILED_REASON };
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const saved = await saveTokenToSupabase(subscription.toJSON(), accessToken);
      return saved ? { ok: true, subscription } : { ok: false, reason: SAVE_FAILED_REASON };
    } catch (e) {
      console.error("[usePush] subscribe fejl:", e);
      return { ok: false, reason: String(e) };
    }
  }

  // Afmeld push
  async function unsubscribe(accessToken) {
    if (!supported) return;
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;
      await deleteTokenFromSupabase(sub.toJSON(), accessToken);
      await sub.unsubscribe();
    } catch (e) {
      console.error("[usePush] unsubscribe fejl:", e);
    }
  }

  return { supported, permission, subscribe, unsubscribe };
}

// Hjælpefunktion til at sende push fra frontend (kun til eget brug — admin bruger Edge Function)
// `category` bør altid sendes med — matcher en notification_preferences-
// kategori ('submission_status', 'missing_product_found', 'family',
// 'feedback', 'weekly_digest') så send-push kan respektere brugerens
// egne notifikationsindstillinger. Se send-push/index.ts.
export async function sendPushToUser(userId, title, body, url, accessToken, category) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
      method: "POST",
      headers: { ...makeHeaders(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, title, body, url, category }),
    });
    return await res.json();
  } catch (e) {
    console.error("[usePush] sendPushToUser fejl:", e);
    return { error: String(e) };
  }
}
