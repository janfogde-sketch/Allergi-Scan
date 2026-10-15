// @ts-check
// Indbygget "Fortsæt med Apple" i iPhone-rammen (14. okt. 2026, trin 6). Uden for rammen, eller uden pluginet, gør denne fil intet,
// og Apple-login går den almindelige vej (systembrowseren, trin 2). Brugeren bliver i appen: Apples dialog giver et id-token, som
// Supabase veksler til en session (/auth/v1/token?grant_type=id_token), og sessionen sendes videre til den eksisterende modtagelse.
import { isNativeApp, nativePlugin } from "./nativeShell.js";

const BUNDLE_ID = "dk.eatsafe.app";
const WEB_ORIGIN = "https://www.eatsafe.dk";

/** @returns {boolean} */
export function nativeAppleAvailable() {
  return isNativeApp() && !!nativePlugin("SignInWithApple")?.authorize;
}

/** @param {string} s @returns {Promise<string>} SHA-256 som små hex-tegn (det Apple lægger i tokenet som nonce) */
async function sha256Hex(s) {
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  return Array.from(d).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** @returns {string} Tilfældig engangsværdi */
function randomNonce() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
}

/**
 * Er fejlen blot, at brugeren lukkede Apples dialog? (iOS-koden er 1001.)
 * @param {any} e
 */
export function isAppleCancel(e) {
  const s = `${e?.code ?? ""} ${e?.message ?? ""} ${e?.errorMessage ?? ""}`;
  return /\b1001\b|cancel/i.test(s);
}

/**
 * Viser Apples dialog og returnerer id-token og den rå nonce, som Supabase skal bruge.
 * @returns {Promise<{ ok: true, idToken: string, nonce: string } | { ok: false, cancelled: boolean, reason: string }>}
 */
export async function appleNativeAuthorize() {
  const plugin = nativePlugin("SignInWithApple");
  if (!plugin?.authorize) return { ok: false, cancelled: false, reason: "Ikke understøttet" };
  try {
    const nonce = randomNonce();
    const res = await plugin.authorize({
      clientId: BUNDLE_ID, redirectURI: `${WEB_ORIGIN}/`, scopes: "email name", nonce: await sha256Hex(nonce),
    });
    const idToken = res?.response?.identityToken;
    if (typeof idToken !== "string" || !idToken) return { ok: false, cancelled: false, reason: "Apple gav ikke et id-token" };
    return { ok: true, idToken, nonce };
  } catch (e) {
    return { ok: false, cancelled: isAppleCancel(e), reason: String(e?.message ?? e) };
  }
}

/**
 * Veksler Apples id-token til en EatSafe-session.
 * @param {string} supabaseUrl @param {string} anonKey @param {string} idToken @param {string} nonce
 * @param {typeof fetch} [fetchImpl]
 * @returns {Promise<{ ok: true, access: string, refresh: string } | { ok: false, reason: string }>}
 */
export async function exchangeAppleToken(supabaseUrl, anonKey, idToken, nonce, fetchImpl = fetch) {
  try {
    const r = await fetchImpl(`${supabaseUrl}/auth/v1/token?grant_type=id_token`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "apple", id_token: idToken, nonce }),
    });
    if (!r.ok) return { ok: false, reason: `HTTP ${r.status}` };
    const j = await r.json();
    if (!j?.access_token || !j?.refresh_token) return { ok: false, reason: "Ingen session i svaret" };
    return { ok: true, access: j.access_token, refresh: j.refresh_token };
  } catch (e) {
    return { ok: false, reason: String(e?.message ?? e) };
  }
}
