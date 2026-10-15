// @ts-check
// Login via links (15. okt. 2026, sikkerhedsfund S4/S5): hjælpere til at tage imod et login sikkert.
//  - Google/Facebook/Apple bruger PKCE: appen laver en hemmelig engangsnøgle (code_verifier) og sender kun dens fingeraftryk
//    (code_challenge) med til Supabase. Retur-adressen bærer en ?code=..., som kun kan veksles sammen med nøglen, der ligger her
//    på enheden. En fremmed eller snuppet kode er derfor værdiløs.
//  - Mail-links (bekræft e-mail, glemt adgangskode, skift e-mail, invitation) bærer ?token_hash=...&type=...; de veksles først,
//    når brugeren har trykket "Fortsæt" på bekræftelsessiden (AuthConfirmScreen.jsx).
//  - Den gamle form med nøglerne i adressen (#access_token=...) logger aldrig ind (del C, 15. okt.); den vises som et udløbet link.

const VERIFIER_KEY = "as_pkce_verifier";
const VERIFIER_MAX_AGE_MS = 10 * 60 * 1000;
/** Mail-linktyper, som appen tager imod. */
export const EMAIL_LINK_TYPES = ["signup", "email", "recovery", "invite", "magiclink", "email_change"];

/** @param {Uint8Array} bytes */
function base64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** @param {string} verifier @returns {Promise<string>} SHA-256-fingeraftrykket (base64url), som Supabase forventer ved s256. */
export async function codeChallengeFor(verifier) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

/**
 * Laver en ny engangsnøgle, gemmer den på enheden og returnerer fingeraftrykket til /authorize.
 * localStorage (ikke sessionStorage), så nøglen overlever turen til systembrowseren og tilbage i iPhone-appen.
 * @returns {Promise<string>}
 */
export async function startPkce() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(48)));
  try { localStorage.setItem(VERIFIER_KEY, JSON.stringify({ v: verifier, t: Date.now() })); } catch { /* privat tilstand */ }
  return codeChallengeFor(verifier);
}

/** Henter og sletter engangsnøglen (kan kun bruges én gang). @returns {string | null} */
export function takePkceVerifier(now = Date.now()) {
  try {
    const raw = localStorage.getItem(VERIFIER_KEY);
    localStorage.removeItem(VERIFIER_KEY);
    if (!raw) return null;
    const { v, t } = JSON.parse(raw);
    if (typeof v !== "string" || typeof t !== "number" || now - t > VERIFIER_MAX_AGE_MS) return null;
    return v;
  } catch { return null; }
}

/**
 * @typedef {{ kind: "error", errorCode: string }
 *   | { kind: "code", code: string }
 *   | { kind: "token_hash", tokenHash: string, type: string, email: string }
 *   | { kind: "tokens", access: string, refresh: string, type: string, email?: string }} AuthLink
 * "tokens" kommer aldrig fra adressen; det er kun en session, som appen selv har fået fra Supabase og viser til bekræftelse.
 */

/**
 * Læser et login-link ud af adressen. Giver null, når adressen ikke er et login-link.
 * @param {{ search?: string, hash?: string }} loc
 * @returns {AuthLink | null}
 */
export function parseAuthLink(loc) {
  const query = new URLSearchParams((loc.search || "").replace(/^\?/, ""));
  const hash = new URLSearchParams((loc.hash || "").replace(/^#/, "").replace(/#/g, "&"));
  const get = (/** @type {string} */ k) => query.get(k) || hash.get(k) || "";
  if (get("error") || get("error_code")) return { kind: "error", errorCode: get("error_code") || get("error") };
  const code = query.get("code");
  if (code) return { kind: "code", code };
  const tokenHash = query.get("token_hash");
  const type = query.get("type") || "";
  if (tokenHash && EMAIL_LINK_TYPES.includes(type)) return { kind: "token_hash", tokenHash, type, email: query.get("email") || "" };
  // Gammel form: tages aldrig imod, men fjernes fra adressen og vises som et udløbet link.
  if (hash.get("access_token")) return { kind: "error", errorCode: "legacy_token_link" };
  return null;
}

/** Har adressen et login-link? Bruges før første render (App.jsx/useAuth.js). @param {{ search?: string, hash?: string }} loc */
export function hasAuthLink(loc) {
  return parseAuthLink(loc) !== null;
}

/**
 * Fjerner login-parametrene fra adressen (så de ikke ligger i historikken eller deles ved en fejl). Andre parametre bevares.
 * @param {{ pathname: string, search: string }} loc
 * @returns {string}
 */
export function cleanAuthUrl(loc) {
  const q = new URLSearchParams(loc.search.replace(/^\?/, ""));
  for (const k of ["code", "token_hash", "type", "email", "error", "error_code", "error_description"]) q.delete(k);
  const s = q.toString();
  return loc.pathname + (s ? `?${s}` : "");
}

/**
 * @typedef {{ ok: true, access: string, refresh: string, user: any }
 *   | { ok: true, access: null, refresh: null, user: any }
 *   | { ok: false, reason: string, status?: number, errorCode?: string }} SessionResult
 */

/** @param {Response} r @returns {Promise<SessionResult>} */
async function toSession(r) {
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, reason: `HTTP ${r.status}`, status: r.status, errorCode: j?.error_code || j?.code || "" };
  if (j?.access_token && j?.refresh_token) return { ok: true, access: j.access_token, refresh: j.refresh_token, user: j.user || null };
  // Fx første af to links ved skift af e-mail: bekræftet, men ingen session.
  return { ok: true, access: null, refresh: null, user: j?.user || null };
}

/**
 * Veksler ?code= til en session med engangsnøglen fra denne enhed.
 * @param {string} supabaseUrl @param {string} anonKey @param {string} code @param {string} verifier
 * @returns {Promise<SessionResult>}
 */
export async function exchangeAuthCode(supabaseUrl, anonKey, code, verifier, fetchImpl = fetch) {
  try {
    const r = await fetchImpl(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
    });
    return await toSession(r);
  } catch (e) {
    return { ok: false, reason: String(/** @type {any} */ (e)?.message ?? e) };
  }
}

/**
 * Bruger et mail-link (token_hash) og får en session tilbage.
 * @param {string} supabaseUrl @param {string} anonKey @param {string} tokenHash @param {string} type
 * @returns {Promise<SessionResult>}
 */
export async function verifyEmailLink(supabaseUrl, anonKey, tokenHash, type, fetchImpl = fetch) {
  try {
    const r = await fetchImpl(`${supabaseUrl}/auth/v1/verify`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ token_hash: tokenHash, type }),
    });
    return await toSession(r);
  } catch (e) {
    return { ok: false, reason: String(/** @type {any} */ (e)?.message ?? e) };
  }
}

/**
 * Afviser en session, brugeren ikke ville have (fx "Det er ikke mig"), så nøglen ikke kan bruges igen.
 * @param {string} supabaseUrl @param {string} anonKey @param {string} access
 */
export async function discardSession(supabaseUrl, anonKey, access, fetchImpl = fetch) {
  try {
    await fetchImpl(`${supabaseUrl}/auth/v1/logout?scope=local`, {
      method: "POST", headers: { apikey: anonKey, Authorization: `Bearer ${access}` },
    });
  } catch { /* bedste forsøg */ }
}
