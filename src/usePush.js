// @ts-check
// src/usePush.js
// Håndterer push-notifikation tilladelse, service worker og token-opbevaring

import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { makeHeaders, decodeJwtPayload } from "./helpers.js";
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

// ── Brugerens eget fravalg af push (16. okt. 2026, frontend-gennemgang) ──────────────────────────────────────
// Tilladelsen i browseren består, selv om brugeren slår push fra i Indstillinger. Uden et mærke ville syncPushToken
// oprette og gemme et nyt abonnement ved næste appstart, og beskederne ville komme igen uden brugerens valg.
// Mærket gælder pr. konto på denne enhed (nøglen er kontoens id fra login-nøglen), overlever log ud (så et nyt login
// med samme konto ikke tænder push igen) og fjernes først, når brugeren selv slår push til. Kan kontoens id ikke
// læses, huskes fravalget ikke (så er der heller ikke noget at tænde igen for den konto).
const OPTOUT_PREFIX = "as_push_optout_";
function optOutKey(accessToken) {
  try { const sub = accessToken ? decodeJwtPayload(accessToken)?.sub : null; return sub ? OPTOUT_PREFIX + sub : null; } catch { return null; }
}
export function pushOptedOut(accessToken) {
  try { const k = optOutKey(accessToken); return !!k && localStorage.getItem(k) === "1"; } catch { return false; }
}
function setPushOptOut(accessToken, value) {
  try {
    const k = optOutKey(accessToken);
    if (!k) return;
    if (value) localStorage.setItem(k, "1"); else localStorage.removeItem(k);
  } catch { /* privat tilstand: fravalget huskes ikke */ }
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

// ── Abonnementet skal passe til appens VAPID-nøgle ──────────────────────────────────────────────────────────
// Et abonnement er bundet til den nøgle, det blev oprettet med. Skiftes nøglen (den ligger både her og i sw.js),
// afviser push-tjenesten alle afsendelser til det gamle abonnement, uden at appen opdager det: Indstillinger viser
// "til", men der kommer intet. Derfor sammenlignes nøglen, og abonnementet oprettes på ny ved afvigelse. Kan nøglen
// ikke aflæses (ældre browsere), beholdes abonnementet, så intet går tabt på en formodning.
function sameVapidKey(sub) {
  try {
    const k = sub?.options?.applicationServerKey;
    if (!k) return true;
    const cur = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    const a = new Uint8Array(/** @type {ArrayBuffer} */ (k));
    return a.length === cur.length && a.every((v, i) => v === cur[i]);
  } catch { return true; }
}
// Henter enhedens abonnement, eller opretter det. Et abonnement med en forældet nøgle afmeldes først (og dets række
// slettes på kontoen, så serveren ikke bliver ved med at sende til en død adresse); fejler oprettelsen af det nye,
// kaster vi videre, og kalderen melder det. Det gamle var alligevel ubrugeligt.
async function ensureSubscription(reg, accessToken) {
  let sub = await reg.pushManager.getSubscription();
  if (sub && !sameVapidKey(sub)) {
    await deleteTokenFromSupabase(sub.toJSON(), accessToken);
    try { await sub.unsubscribe(); } catch { /* oprettes på ny herunder */ }
    sub = null;
  }
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) });
  return sub;
}

const pushSupported = () =>
  typeof navigator !== "undefined" && "serviceWorker" in navigator &&
  typeof window !== "undefined" && "PushManager" in window && "Notification" in window;

/**
 * Sørger for, at den KONTO, der er logget ind, har enhedens push-abonnement gemt. Telefonens tilladelse
 * gælder for enheden, ikke for kontoen: logger man ind med en anden konto på en enhed, der allerede har
 * givet tilladelse, bliver abonnementet ellers aldrig gemt for den nye konto (appen viser push som
 * "slået til", men der kommer intet). Spørger aldrig om tilladelse; gør intet uden den, og intet, hvis
 * brugeren selv har slået push fra på denne enhed (pushOptedOut).
 */
export async function syncPushToken(accessToken) {
  if (!accessToken) return { ok: false, reason: "Ingen tilladelse" };
  if (pushOptedOut(accessToken)) return { ok: false, reason: "Slået fra af brugeren" };
  // iPhone-rammen: Apples push i stedet for service worker (kun hvis tilladelsen allerede er givet).
  if (nativePushAvailable()) {
    if ((await nativePermission()) !== "granted") return { ok: false, reason: "Ingen tilladelse" };
    const reg = await nativeRegister(false);
    if (!reg.ok) return { ok: false, reason: "reason" in reg ? reg.reason : "Ukendt fejl" };
    return (await saveRawToken(nativeTokenJson(reg.token), accessToken)) ? { ok: true } : { ok: false, reason: SAVE_FAILED_REASON };
  }
  if (!pushSupported() || Notification.permission !== "granted") return { ok: false, reason: "Ingen tilladelse" };
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const sub = await ensureSubscription(reg, accessToken);
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

  // Registrér SW og abonnér på push. Kaldes fra et tryk i Indstillinger (brugerhandling).
  async function subscribe(accessToken) {
    if (!supported) return { ok: false, reason: "Ikke understøttet" };
    setPushOptOut(accessToken, false); // brugeren slår selv push til
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
      // Tilladelsen bedes om FØRST, mens brugerens tryk stadig tæller som en brugerhandling: Safari (iPhone) afviser
      // requestPermission, hvis den kommer efter længere ventetid (fx registrering af service workeren).
      if (Notification.permission !== "granted") {
        const result = await Notification.requestPermission();
        if (result !== "granted") return { ok: false, reason: "Tilladelse afvist" };
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await ensureSubscription(reg, accessToken);
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
    setPushOptOut(accessToken, true); // huskes, så syncPushToken ikke tænder push igen ved næste start
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
