// @ts-check
// src/usePush.js
// Håndterer push-notifikation tilladelse, service worker og token-opbevaring

import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { makeHeaders } from "./helpers.js";
import { isNativeApp } from "./nativeShell.js";
import {
  nativePushAvailable, nativeTokenJson, cachedNativePermission, nativePermission, nativeRegister,
  storedNativeToken, forgetStoredNativeToken, nativeUnregister,
} from "./nativePush.js";

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
  return saveRawToken(JSON.stringify(token), accessToken);
}

// Samme som ovenfor, men tager den færdige tekst (web: JSON af abonnementet; iPhone-rammen: JSON med Apples token).
async function saveRawToken(tokenText, accessToken) {
  try {
    // Foretrukket: databasen flytter enhedens abonnement til denne konto og fjerner det fra andre konti
    // (delt telefon). Findes funktionen ikke endnu, falder vi tilbage til den gamle indsættelse.
    const claim = await fetch(`${SUPABASE_URL}/rest/v1/rpc/claim_push_token`, {
      method: "POST",
      headers: makeHeaders(accessToken),
      body: JSON.stringify({ p_token: tokenText }),
    });
    if (claim.ok) return true;
    if (claim.status !== 404) console.warn("[usePush] claim afvist:", claim.status);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/push_tokens`, {
      method: "POST",
      headers: {
        ...makeHeaders(accessToken),
        "Prefer": "resolution=ignore-duplicates",
      },
      body: JSON.stringify({ token: tokenText }),
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
 * Gemmer KUN et abonnement, der allerede findes på enheden (17. okt. 2026): har brugeren slået push fra, er abonnementet
 * fjernet, men tilladelsen står stadig som givet, og et nyt abonnement må aldrig oprettes af sig selv ved login.
 * Det slår brugeren til i Indstillinger (usePush().subscribe).
 */
export async function syncPushToken(accessToken) {
  // iPhone-rammen: Apples push i stedet for service worker (kun hvis tilladelsen allerede er givet).
  if (accessToken && nativePushAvailable()) {
    if ((await nativePermission()) !== "granted") return { ok: false, reason: "Ingen tilladelse" };
    // Intet gemt token = push er slået fra på denne telefon (afmelding rydder det): registrér ikke hos Apple af sig selv.
    if (!storedNativeToken()) return { ok: false, reason: "Ikke slået til" };
    const reg = await nativeRegister(false);
    if (!reg.ok) return { ok: false, reason: "reason" in reg ? reg.reason : "Ukendt fejl" };
    return (await saveRawToken(nativeTokenJson(reg.token), accessToken)) ? { ok: true } : { ok: false, reason: SAVE_FAILED_REASON };
  }
  if (!accessToken || !pushSupported() || Notification.permission !== "granted") return { ok: false, reason: "Ingen tilladelse" };
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return { ok: false, reason: "Ikke slået til" };
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
  if (accessToken && nativePushAvailable()) {
    const t = storedNativeToken();
    if (t) await deleteRawToken(nativeTokenJson(t), accessToken);
    return;
  }
  if (!accessToken || !pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) await deleteTokenFromSupabase(sub.toJSON(), accessToken);
  } catch { /* logout må aldrig fejle her */ }
}

// Slet push token fra Supabase (ved afmelding)
async function deleteTokenFromSupabase(token, accessToken) {
  return deleteRawToken(JSON.stringify(token), accessToken);
}

async function deleteRawToken(tokenText, accessToken) {
  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/push_tokens?token=eq.${encodeURIComponent(tokenText)}`,
      { method: "DELETE", headers: makeHeaders(accessToken) }
    );
  } catch (e) {
    console.warn("[usePush] Kunne ikke slette token:", e);
  }
}

// Returnerer { supported, permission, subscribe, unsubscribe }
export function usePush() {
  const native = isNativeApp() && nativePushAvailable();
  const supported = native || (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window);

  const permission = native ? cachedNativePermission() : supported ? Notification.permission : "denied";

  // Registrér SW og abonnér på push
  async function subscribe(accessToken) {
    if (!supported) return { ok: false, reason: "Ikke understøttet" };
    if (native) {
      const reg = await nativeRegister(true);
      if (!reg.ok) return { ok: false, reason: "reason" in reg ? reg.reason : "Ukendt fejl" };
      const saved = await saveRawToken(nativeTokenJson(reg.token), accessToken);
      return saved ? { ok: true } : { ok: false, reason: SAVE_FAILED_REASON };
    }
    if (/** @type {string} */ (VAPID_PUBLIC_KEY) === "DIN_VAPID_PUBLIC_KEY_HER") {
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
    if (native) {
      const t = storedNativeToken();
      if (t) await deleteRawToken(nativeTokenJson(t), accessToken);
      forgetStoredNativeToken();
      await nativeUnregister();
      return;
    }
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
