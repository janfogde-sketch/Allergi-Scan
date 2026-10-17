// supabase/functions/_shared/apns.ts
//
// Apples push (APNs) til iPhone-appen (14. okt. 2026). Kun WebCrypto, så koden kan køre i Deno og i Node (Vitest,
// src/apns.test.js). Bruges af `notify` og `notify-test` ved siden af den almindelige Web Push.
//
// En iPhone-rammes token gemmes i push_tokens.token som JSON {"platform":"ios","apns":"<hex>"} (web-abonnementer har
// "endpoint" og "keys"). Uden nøglerne nedenfor sendes der ingenting til iPhone-tokens, og web-push er uberørt.
//
// Hemmeligheder (Supabase secrets, kommer med Apple-kontoen; se docs/ios-tjekliste.md):
//   APNS_KEY_P8 (indholdet af .p8-filen), APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID (dk.eatsafe.app)
//   APNS_SANDBOX=true kun til bygninger direkte fra Xcode; TestFlight og App Store bruger produktion.

import type { SendResult } from "./webpush.ts";

export type ApnsToken = { platform: "ios"; apns: string };

export type ApnsConfig = { keyP8: string; keyId: string; teamId: string; bundleId: string; sandbox?: boolean };

const utf8 = (s: string) => new TextEncoder().encode(s);

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/** Genkender en iPhone-token i push_tokens.token (JSON-tekst). Andet giver null. */
export function parseApnsToken(token: string): ApnsToken | null {
  try {
    const t = JSON.parse(token);
    if (t?.platform === "ios" && typeof t.apns === "string" && /^[0-9a-fA-F]{32,200}$/.test(t.apns)) return { platform: "ios", apns: t.apns.toLowerCase() };
  } catch { /* ikke JSON */ }
  return null;
}

/** Læser nøglerne fra miljøet. Mangler en af dem, er APNs ikke sat op (null). */
export function apnsConfigFromEnv(get: (k: string) => string | undefined): ApnsConfig | null {
  const keyP8 = get("APNS_KEY_P8"), keyId = get("APNS_KEY_ID"), teamId = get("APNS_TEAM_ID"), bundleId = get("APNS_BUNDLE_ID");
  if (!keyP8 || !keyId || !teamId || !bundleId) return null;
  return { keyP8, keyId, teamId, bundleId, sandbox: get("APNS_SANDBOX") === "true" };
}

async function importP8(p8: string): Promise<CryptoKey> {
  const b64 = p8.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "").replace(/\\n/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
}

let cached: { jwt: string; at: number; key: string } | null = null;

/** Apples adgangs-token (ES256). Apple vil have det fornyet højst hver 20. minut og senest hver time. */
export async function buildApnsJwt(cfg: ApnsConfig, nowMs = Date.now()): Promise<string> {
  const id = `${cfg.keyId}:${cfg.teamId}`;
  if (cached && cached.key === id && nowMs - cached.at < 30 * 60_000) return cached.jwt;
  const header = b64url(utf8(JSON.stringify({ alg: "ES256", kid: cfg.keyId })));
  const claims = b64url(utf8(JSON.stringify({ iss: cfg.teamId, iat: Math.floor(nowMs / 1000) })));
  const input = `${header}.${claims}`;
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, await importP8(cfg.keyP8), utf8(input)));
  const jwt = `${input}.${b64url(sig)}`;
  cached = { jwt, at: nowMs, key: id };
  return jwt;
}

export type ApnsPayload = { title: string; body: string; url?: string; tag?: string; [k: string]: unknown };

/** Selve beskeden, som Apple modtager (aps + egne felter, som appen læser ved tryk). */
export function buildApnsBody(p: ApnsPayload): Record<string, unknown> {
  const { title, body, tag: _tag, icon: _icon, lang: _lang, ...rest } = p;
  return { aps: { alert: { title, body }, sound: "default" }, ...rest };
}

export type ApnsSendOptions = { ttlSeconds?: number; fetchImpl?: typeof fetch; nowMs?: number };

/** Sender én besked til én iPhone og klassificerer svaret på samme måde som sendWebPush. */
export async function sendApns(token: ApnsToken, payload: ApnsPayload, cfg: ApnsConfig, opts: ApnsSendOptions = {}): Promise<SendResult> {
  try {
    const jwt = await buildApnsJwt(cfg, opts.nowMs);
    const host = cfg.sandbox ? "api.sandbox.push.apple.com" : "api.push.apple.com";
    const now = opts.nowMs ?? Date.now();
    const headers: Record<string, string> = {
      authorization: `bearer ${jwt}`,
      "apns-topic": cfg.bundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "apns-expiration": String(Math.floor(now / 1000) + Math.max(0, Math.floor(opts.ttlSeconds ?? 86400))),
      "content-type": "application/json",
    };
    if (payload.tag) headers["apns-collapse-id"] = String(payload.tag).slice(0, 64);
    const res = await (opts.fetchImpl ?? fetch)(`https://${host}/3/device/${token.apns}`, {
      method: "POST", headers, body: JSON.stringify(buildApnsBody(payload)),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 200) return { ok: true, status: 200, gone: false, retryable: false };
    let reason = "";
    try { reason = String((await res.json())?.reason ?? ""); } catch { /* tom krop */ }
    const gone = res.status === 410 || (res.status === 400 && (reason === "BadDeviceToken" || reason === "DeviceTokenNotForTopic")) || reason === "Unregistered";
    // Forkert nøgle/udløbet token er et opsætningsproblem, ikke en enhed, der skal fjernes eller prøves igen.
    return { ok: false, status: res.status, gone, retryable: !gone && (res.status === 429 || res.status >= 500 || reason === "ExpiredProviderToken"),
      error: `HTTP ${res.status}${reason ? ` ${reason}` : ""}` };
  } catch (e) {
    return { ok: false, status: 0, gone: false, retryable: true, error: String((e as Error)?.message ?? e) };
  }
}
