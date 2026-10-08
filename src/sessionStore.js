// @ts-check
// ─────────────────────────────────────────────────────────────────────────────
// sessionStore.js — hvor login-nøglerne bor (8. okt. 2026).
// Den lange nøgle (refresh-token) ligger i en HttpOnly-cookie, som sidens kode ikke kan læse (api/session.js).
// Den korte nøgle (access-token, ca. 1 time) lever kun i hukommelsen. I lokal lagring ligger kun et ikke-hemmeligt
// mærke ("der findes en session"), så appen ved, om den skal hente en ny kort nøgle ved start.
// ─────────────────────────────────────────────────────────────────────────────

const FLAG = "as_session";
const API = "/api/session";
const HEADERS = { "Content-Type": "application/json", "X-Requested-With": "eatsafe" };
// Gamle nøgler fra før flytningen; ryddes, så snart de er flyttet.
const LEGACY_KEYS = ["as_token", "as_refresh"];

/** @type {string | null} */
let memoryToken = null;

export function getAccessToken() { return memoryToken; }
export function setMemoryToken(/** @type {string | null} */ token) { memoryToken = token || null; }

function read(/** @type {Storage} */ store, key) { try { return store.getItem(key); } catch { return null; } }
function write(/** @type {Storage} */ store, key, value) { try { store.setItem(key, value); } catch { /* privat tilstand */ } }
function remove(/** @type {Storage} */ store, key) { try { store.removeItem(key); } catch { /* privat tilstand */ } }

function legacyRefresh() { return read(localStorage, "as_refresh") || read(sessionStorage, "as_refresh") || ""; }

/** Findes der en session på denne enhed (eller en gammel nøgle, der skal flyttes)? */
export function hasStoredSession() {
  return read(localStorage, FLAG) === "1" || read(sessionStorage, FLAG) === "1" || !!legacyRefresh();
}

/** Sessionen gemt uden "husk mig" følger fanebladet (sessionStorage); ellers enheden. */
function isPersistent() {
  const onDevice = read(localStorage, FLAG) === "1" || !!read(localStorage, "as_refresh");
  const inTab = read(sessionStorage, FLAG) === "1" || !!read(sessionStorage, "as_refresh");
  return onDevice || !inTab;
}

function markSession(/** @type {boolean} */ persist) {
  write(persist ? localStorage : sessionStorage, FLAG, "1");
  remove(persist ? sessionStorage : localStorage, FLAG);
}

function clearLegacy() {
  for (const k of LEGACY_KEYS) { remove(localStorage, k); remove(sessionStorage, k); }
}

async function post(/** @type {object} */ body) {
  return fetch(API, { method: "POST", headers: HEADERS, credentials: "same-origin", body: JSON.stringify(body) });
}

/** Gem den lange nøgle i cookien (kaldes efter login/tilmelding/link). Returnerer true, hvis den er gemt. */
export async function persistRefreshToken(/** @type {string} */ refresh, persist = true) {
  markSession(persist);
  clearLegacy();
  try {
    const res = await post({ action: "set", refresh_token: refresh, persist });
    return res.ok;
  } catch { return false; }
}

/**
 * Hent en ny kort nøgle ved hjælp af cookien.
 * ok = ny nøgle; none = ingen session; expired = sessionen er død (log ud); error = ingen forbindelse/midlertidig fejl (behold sessionen).
 * @returns {Promise<{ status: "ok", accessToken: string, userId: string | null } | { status: "none" | "expired" | "error" }>}
 */
export async function restoreSession() {
  if (!hasStoredSession()) return { status: "none" };
  const persist = isPersistent();
  const legacy = legacyRefresh();
  try {
    const res = await post({ action: "refresh", persist, ...(legacy ? { refresh_token: legacy } : {}) });
    if (res.status === 401) return { status: "expired" };
    if (!res.ok) return { status: "error" };
    const data = await res.json();
    if (!data.access_token) return { status: "error" };
    markSession(persist);
    clearLegacy();
    return { status: "ok", accessToken: data.access_token, userId: data.user_id || null };
  } catch {
    return { status: "error" };
  }
}

/** Afslut sessionen på enheden: mærket, de gamle nøgler, den korte nøgle og cookien. */
export async function endSession() {
  memoryToken = null;
  remove(localStorage, FLAG); remove(sessionStorage, FLAG);
  clearLegacy();
  try { await post({ action: "logout" }); } catch { /* cookien udløber af sig selv; mærket er væk, så den bruges ikke */ }
}
