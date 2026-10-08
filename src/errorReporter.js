// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// errorReporter.js — sender fejl til EatSafes egen fejltabel
// (public.client_errors via RPC'en log_client_error, se
// supabase/migrations/20260930093307_client_errors.sql). Ingen tredjepart.
//
// Kaldes fra ErrorBoundary (React-crash) og fra globale window-lyttere
// (installErrorReporting i main.tsx). Må aldrig selv kaste en fejl eller
// forstyrre brugeren — alt sker i baggrunden, og fejl i selve afsendelsen
// ignoreres.
// ─────────────────────────────────────────────────────────────────────────────
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { COMMIT_SHA } from "./utils.jsx";
import { getAccessToken } from "./sessionStore.js";

const MAX_REPORTS_PER_SESSION = 20;

// Støj, der ikke siger noget om EatSafes egen kode.
const IGNORED_PATTERNS = [
  /ResizeObserver loop/i,
  /^Script error\.?$/im,         // fejl fra fremmede scripts uden detaljer
  /chrome-extension:|moz-extension:|safari-extension:/i,
  /AbortError/i,                 // afbrudte fetch-kald (navigation væk)
];

// De seneste fejl gemmes også lokalt på enheden (højst 5, kun besked + kort stack), så en feedback af typen "Appen lukker ned" kan
// sende dem med, også efter appen er genstartet. Indholdet forlader kun enheden, hvis brugeren sender feedback.
const RECENT_KEY = "as_recent_errors";
const MAX_RECENT = 5;

export function getRecentErrors() {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(list) ? list.slice(-MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function rememberError({ message, stack, source, screen }) {
  try {
    const list = getRecentErrors();
    if (list.length && list[list.length - 1].message === message.slice(0, 200)) return;
    list.push({ ts: new Date().toISOString(), message: message.slice(0, 200), stack: stack ? stack.slice(0, 600) : null, source: source || "app", screen: screen || null });
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(-MAX_RECENT)));
  } catch { /* lokal lagring kan være utilgængelig */ }
}

const sent = new Set();
let sentCount = 0;

export function _resetForTests() {
  sent.clear();
  sentCount = 0;
}

export function shouldReport(message, stack = "") {
  if (!message || typeof message !== "string") return false;
  const text = `${message}\n${stack || ""}`;
  return !IGNORED_PATTERNS.some(re => re.test(text));
}

function readToken() {
  try {
    return getAccessToken();
  } catch {
    return null;
  }
}

function currentUrl() {
  try {
    // Kun sti + hash — aldrig query-strengen, som kan indeholde tokens
    // (fx bekræftelses- og invitationslinks).
    return window.location.pathname + (window.location.hash ? "#…" : "");
  } catch {
    return null;
  }
}

async function post(body, token) {
  return fetch(`${SUPABASE_URL}/rest/v1/rpc/log_client_error`, {
    method: "POST",
    keepalive: true,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Rapportér en fejl. Returnerer true hvis den blev sendt.
 * @param {unknown} error  Error-objekt eller tekst
 * @param {{ screen?: string, source?: string, context?: object }} [meta]
 */
export async function reportError(error, meta = {}) {
  try {
    const message = String(error?.message || error || "").trim();
    const stack = typeof error?.stack === "string" ? error.stack : null;
    if (!shouldReport(message, stack)) return false;
    rememberError({ message, stack, source: meta.source, screen: meta.screen });
    if (typeof navigator !== "undefined" && navigator.onLine === false) return false;

    const key = `${meta.screen || ""}|${message}`;
    if (sent.has(key) || sentCount >= MAX_REPORTS_PER_SESSION) return false;
    sent.add(key);
    sentCount++;

    const body = {
      p_message: message.slice(0, 1000),
      p_stack: stack ? stack.slice(0, 4000) : null,
      p_source: meta.source || "app",
      p_screen: meta.screen || null,
      p_url: currentUrl(),
      p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      p_app_version: COMMIT_SHA,
      p_context: meta.context || null,
    };

    const token = readToken();
    let res = await post(body, token);
    // Udløbet login-token → prøv igen anonymt, så fejlen ikke går tabt.
    if (res && res.status === 401 && token) res = await post(body, null);
    return !!res?.ok;
  } catch {
    return false;
  }
}

let installed = false;

/** Lyt efter ufangede fejl og afviste promises i hele appen. */
export function installErrorReporting(target = typeof window !== "undefined" ? window : null) {
  if (!target || installed) return;
  installed = true;
  target.addEventListener("error", (e) => {
    reportError(e?.error || e?.message, { source: "window" });
  });
  target.addEventListener("unhandledrejection", (e) => {
    reportError(e?.reason, { source: "promise" });
  });
}
