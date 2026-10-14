// @ts-check
// Apples push i iPhone-rammen (14. okt. 2026, trin 3). Alt her er uden virkning uden for rammen (browser, Android).
// Telefonens push-adresse (APNs-token) gemmes i push_tokens som JSON {"platform":"ios","apns":"<hex>"}; serveren
// (`supabase/functions/_shared/apns.ts`) genkender den og sender til Apple.
import { isNativeApp, nativePlugin } from "./nativeShell.js";

const TOKEN_KEY = "es_apns_token";
const PERM_KEY = "es_native_push_perm";
const APP_ORIGIN = "https://www.eatsafe.dk";

/** @returns {any} */
const plugin = () => nativePlugin("PushNotifications");

/** @returns {boolean} */
export function nativePushAvailable() {
  return isNativeApp() && !!plugin();
}

/** @param {string} [apns] @returns {string} Teksten, der gemmes i push_tokens.token */
export function nativeTokenJson(apns) {
  return JSON.stringify({ platform: "ios", apns });
}

/** Sidst kendte tilladelse ("granted" | "denied" | "default"), så skærmene kan vise den uden at vente på telefonen. */
export function cachedNativePermission() {
  try { const v = localStorage.getItem(PERM_KEY); return v === "granted" || v === "denied" ? v : "default"; } catch { return "default"; }
}

/** @param {string} v */
function remember(v) { try { localStorage.setItem(PERM_KEY, v); } catch { /* privat tilstand */ } }

/** @param {string | undefined} receive @returns {"granted"|"denied"|"default"} */
function mapPermission(receive) {
  return receive === "granted" ? "granted" : receive === "denied" ? "denied" : "default";
}

/** Spørger telefonen, uden at vise nogen dialog. */
export async function nativePermission() {
  try {
    const p = mapPermission((await plugin().checkPermissions())?.receive);
    remember(p);
    return p;
  } catch { return cachedNativePermission(); }
}

/**
 * Henter telefonens push-adresse hos Apple. Beder kun om tilladelse, hvis `ask` er sand.
 * @param {boolean} ask
 * @param {number} [timeoutMs]
 * @returns {Promise<{ ok: true, token: string } | { ok: false, reason: string }>}
 */
export async function nativeRegister(ask, timeoutMs = 10000) {
  const push = plugin();
  if (!push) return { ok: false, reason: "Ikke understøttet" };
  try {
    let perm = mapPermission((await push.checkPermissions())?.receive);
    if (perm === "default" && ask) perm = mapPermission((await push.requestPermissions())?.receive);
    remember(perm);
    if (perm !== "granted") return { ok: false, reason: perm === "denied" ? "Tilladelse afvist" : "Ingen tilladelse" };
    /** @type {any[]} */
    const handles = [];
    const token = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Apple svarede ikke")), timeoutMs);
      const done = (/** @type {any} */ fn, /** @type {any} */ v) => { clearTimeout(timer); fn(v); };
      Promise.all([
        push.addListener("registration", (/** @type {{value:string}} */ t) => done(resolve, t?.value)),
        push.addListener("registrationError", (/** @type {{error?:string}} */ e) => done(reject, new Error(e?.error || "Registrering fejlede"))),
      ]).then((hs) => { handles.push(...hs); return push.register(); }).catch((e) => done(reject, e));
    }).finally(() => { handles.forEach((h) => h?.remove?.()); });
    if (typeof token !== "string" || !token) return { ok: false, reason: "Ingen push-adresse" };
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* privat tilstand */ }
    return { ok: true, token };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}

/** @returns {string | null} Den sidst hentede push-adresse på denne telefon. */
export function storedNativeToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function forgetStoredNativeToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* privat tilstand */ }
  remember("default");
}

/** Beder telefonen holde op med at modtage push (bruges ved afmelding). */
export async function nativeUnregister() {
  try { await plugin()?.unregister?.(); } catch { /* ignoreres */ }
}

/**
 * Adressen i en push-besked må kun åbne appens egen adresse.
 * @param {unknown} url
 * @returns {string | null}
 */
export function pushTapTarget(url) {
  if (typeof url !== "string") return null;
  try {
    const u = new URL(url, APP_ORIGIN);
    return u.origin === APP_ORIGIN ? `${APP_ORIGIN}${u.pathname}${u.search}${u.hash}` : null;
  } catch { return null; }
}

/**
 * Lytter efter tryk på en push-besked (også når appen var lukket) og giver den adresse, appen skal åbne.
 * @param {(target: string) => void} onTap
 * @returns {() => void}
 */
export function listenForPushTap(onTap) {
  const push = plugin();
  if (!isNativeApp() || !push?.addListener) return () => {};
  let handle = /** @type {any} */ (null);
  let cancelled = false;
  Promise.resolve(push.addListener("pushNotificationActionPerformed", (/** @type {any} */ a) => {
    const target = pushTapTarget(a?.notification?.data?.url);
    if (target) onTap(target);
  })).then((h) => { if (cancelled) h?.remove?.(); else handle = h; }).catch(() => {});
  return () => { cancelled = true; handle?.remove?.(); };
}
