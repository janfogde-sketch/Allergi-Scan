// Login-sessionens lange nøgle (refresh-token) bor i en HttpOnly-cookie, som sidens egen kode ikke kan læse.
// Her ligger logikken uden Vercel-detaljer, så den kan testes (src/sessionApi.test.js).
export const SUPABASE_URL = "https://jegrpcflyguadyxialkm.supabase.co";
// Den offentlige anon-nøgle (samme som i appen), ikke en hemmelighed.
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplZ3JwY2ZseWd1YWR5eGlhbGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjY5NjQsImV4cCI6MjA5NDc0Mjk2NH0.QErfbw2xmsdYjTZCS1WUOUwQHv6G2PKQRldyj8rdGq8";

const COOKIE = "as_rt";
const COOKIE_PATH = "/api/session";
const ONE_YEAR = 60 * 60 * 24 * 365;
// Supabase-refresh-tokens er korte tegnstrenge; alt andet afvises uden at nå Supabase.
const TOKEN_RE = /^[A-Za-z0-9._-]{6,512}$/;

export function readCookie(header, name = COOKIE) {
  for (const part of String(header || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return "";
}

export function sessionCookie(value, persist) {
  const base = `${COOKIE}=${encodeURIComponent(value)}; Path=${COOKIE_PATH}; HttpOnly; Secure; SameSite=Strict`;
  return persist ? `${base}; Max-Age=${ONE_YEAR}` : base; // uden Max-Age forsvinder den, når browseren lukkes
}

export function clearedCookie() {
  return `${COOKIE}=; Path=${COOKIE_PATH}; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

/**
 * @param {{ method?: string, headers?: Record<string,string|undefined>, body?: any }} req
 * @param {typeof fetch} [fetchImpl]
 * @returns {Promise<{ status: number, body: object, setCookie?: string }>}
 */
export async function handleSession(req, fetchImpl = fetch) {
  if (req.method !== "POST") return { status: 405, body: { error: "method_not_allowed" } };
  // Et eget header kan en fremmed side ikke sætte uden en CORS-forespørgsel, som vi aldrig besvarer (plus SameSite=Strict på cookien).
  if (req.headers?.["x-requested-with"] !== "eatsafe") return { status: 403, body: { error: "forbidden" } };
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const persist = body.persist !== false;

  if (body.action === "set") {
    if (typeof body.refresh_token !== "string" || !TOKEN_RE.test(body.refresh_token)) return { status: 400, body: { error: "bad_token" } };
    return { status: 200, body: { ok: true }, setCookie: sessionCookie(body.refresh_token, persist) };
  }

  if (body.action === "logout") {
    return { status: 200, body: { ok: true }, setCookie: clearedCookie() };
  }

  if (body.action === "refresh") {
    // Cookien er normalen. refresh_token i selve kaldet bruges kun til at flytte en eksisterende login-nøgle fra den gamle lokale lagring over i cookien (engangs-overgang).
    const token = readCookie(req.headers?.cookie) || (typeof body.refresh_token === "string" ? body.refresh_token : "");
    if (!TOKEN_RE.test(token)) return { status: 401, body: { error: "no_session" } };
    let res;
    try {
      res = await fetchImpl(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ refresh_token: token }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      return { status: 502, body: { error: "upstream_unreachable" } };
    }
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.access_token && data.refresh_token) {
      return {
        status: 200,
        body: { access_token: data.access_token, expires_in: data.expires_in, user_id: data.user?.id || null },
        setCookie: sessionCookie(data.refresh_token, persist),
      };
    }
    // Supabase afviste nøglen (udløbet/brugt/ugyldig): sessionen er død, ryd cookien. Alt andet (5xx, 429) er midlertidigt.
    if (res.status >= 400 && res.status < 500 && res.status !== 429) {
      return { status: 401, body: { error: "session_expired" }, setCookie: clearedCookie() };
    }
    return { status: 502, body: { error: "upstream_error" } };
  }

  return { status: 400, body: { error: "unknown_action" } };
}
