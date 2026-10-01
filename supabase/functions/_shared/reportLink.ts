// supabase/functions/_shared/reportLink.ts
//
// Signeret "Det var ikke mig"-link i glemt-adgangskode-mailen (1. okt. 2026, to do 1a1e600b).
// Linket bærer en token med bruger-id og udløb, signeret med HMAC-SHA256 (nøgle = SEND_EMAIL_HOOK_SECRET,
// domæneadskilt med præfikset "report-reset:"), så ingen kan indberette på andres vegne. Kun WebCrypto (Deno + Vitest).
// Token: base64url("<bruger-id>.<udløb i sekunder>") + "." + base64url(signatur).

export const REPORT_TTL_SECONDS = 7 * 24 * 60 * 60;
export const REPORT_PAGE = "https://www.eatsafe.dk/uventet-nulstilling.html";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const enc = new TextEncoder();

const toB64Url = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64Url = (s: string): Uint8Array => {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  return Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad), (c) => c.charCodeAt(0));
};

async function sign(secret: string, payload: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(`report-reset:${payload}`)));
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function signReportToken(secret: string, userId: string, now = Date.now(), ttlSeconds = REPORT_TTL_SECONDS): Promise<string> {
  if (!secret) throw new Error("Mangler hemmelighed");
  if (!UUID.test(userId)) throw new Error("Ugyldigt bruger-id");
  const payload = `${userId}.${Math.floor(now / 1000) + ttlSeconds}`;
  return `${toB64Url(enc.encode(payload))}.${toB64Url(await sign(secret, payload))}`;
}

export type ReportTokenResult = { ok: true; userId: string } | { ok: false; reason: "invalid" | "expired" };

export async function verifyReportToken(secret: string, token: string, now = Date.now()): Promise<ReportTokenResult> {
  try {
    if (!secret || typeof token !== "string" || token.length > 600) return { ok: false, reason: "invalid" };
    const [p, s, extra] = token.split(".");
    if (!p || !s || extra !== undefined) return { ok: false, reason: "invalid" };
    const payload = new TextDecoder().decode(fromB64Url(p));
    if (!timingSafeEqual(fromB64Url(s), await sign(secret, payload))) return { ok: false, reason: "invalid" };
    const [userId, exp] = payload.split(".");
    if (!UUID.test(userId) || !/^\d+$/.test(exp ?? "")) return { ok: false, reason: "invalid" };
    if (Number(exp) * 1000 < now) return { ok: false, reason: "expired" };
    return { ok: true, userId };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

export function buildReportUrl(token: string): string {
  return `${REPORT_PAGE}?t=${encodeURIComponent(token)}`;
}
