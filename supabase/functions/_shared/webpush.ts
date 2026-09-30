// supabase/functions/_shared/webpush.ts
//
// Web Push (RFC 8030 / 8291 / 8292) uden eksterne biblioteker — kun WebCrypto,
// så koden kan køre i Deno (edge-funktionerne) og i Node (Vitest,
// src/webpush.test.js). Delt af `send-push` og `notify`.
//
// Rettet 30. sept. 2026: VAPID-tokenets `aud` var fast "https://fcm.googleapis.com".
// Den SKAL være oprindelsen (scheme+host) for den push-tjeneste, subscriptionen
// hører til; Apple (web.push.apple.com, iPhone) og Mozilla afviser ellers
// beskeden med 403. Nu udledes den af hver subscriptions endpoint.

export type PushSubscriptionJson = { endpoint: string; keys: { p256dh: string; auth: string } };

export type SendResult = {
  ok: boolean;
  status: number;
  /** Endpointet er permanent ugyldigt (404/410) og skal fjernes. */
  gone: boolean;
  /** Midlertidig fejl, som det giver mening at forsøge igen (429/5xx/netværk). */
  retryable: boolean;
  error?: string;
};

export function base64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function base64urlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(str.length + ((4 - (str.length % 4)) % 4), "=");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

const utf8 = (s: string) => new TextEncoder().encode(s);

function concat(...arrays: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(arrays.reduce((n, a) => n + a.length, 0));
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

/** Oprindelsen (scheme + host) for en push-tjeneste, fx "https://web.push.apple.com". */
export function pushAudience(endpoint: string): string {
  return new URL(endpoint).origin;
}

/** SHA-256 (hex, 32 tegn) af endpointet — bruges i afsendelsesregistret i stedet for selve adressen. */
export async function endpointHash(endpoint: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", utf8(endpoint)));
  return Array.from(digest).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

export async function buildVapidJwt(audience: string, privKey: string, subject: string, ttlSeconds = 12 * 3600): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64urlEncode(utf8(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = base64urlEncode(utf8(JSON.stringify({ aud: audience, exp: now + ttlSeconds, sub: subject })));
  const sigInput = `${header}.${payload}`;
  const key = await crypto.subtle.importKey("pkcs8", base64urlDecode(privKey), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, utf8(sigInput)));
  return `${sigInput}.${base64urlEncode(sig)}`;
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm, { name: "HKDF" }, false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, length * 8));
}

/** aes128gcm-kryptering (RFC 8291) af én besked til én subscription. */
export async function encryptPayload(payload: string, sub: PushSubscriptionJson): Promise<Uint8Array> {
  const clientPublicKey = base64urlDecode(sub.keys.p256dh);
  const clientAuth = base64urlDecode(sub.keys.auth);

  const serverKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey", "deriveBits"]);
  const serverPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeyPair.publicKey));
  const clientKey = await crypto.subtle.importKey("raw", clientPublicKey, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: clientKey }, serverKeyPair.privateKey, 256));

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hkdf(clientAuth, sharedSecret, concat(utf8("WebPush: info\0"), clientPublicKey, serverPublicKeyRaw), 32);
  const cek = await hkdf(salt, prk, utf8("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, prk, utf8("Content-Encoding: nonce\0"), 12);

  const aesKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const padded = concat(utf8(payload), new Uint8Array([2]));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, padded));

  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096, false);
  return concat(salt, recordSize, new Uint8Array([serverPublicKeyRaw.length]), serverPublicKeyRaw, encrypted);
}

export type SendOptions = {
  vapidPublicKey: string;
  vapidPrivateKey: string;
  vapidSubject: string;
  /** Web Push TTL-header i sekunder (hvor længe tjenesten må holde beskeden, hvis enheden er offline). */
  ttlSeconds?: number;
  urgency?: "very-low" | "low" | "normal" | "high";
  fetchImpl?: typeof fetch;
};

/** Sender én krypteret besked til én subscription og klassificerer svaret. */
export async function sendWebPush(sub: PushSubscriptionJson, payload: unknown, opts: SendOptions): Promise<SendResult> {
  try {
    const jwt = await buildVapidJwt(pushAudience(sub.endpoint), opts.vapidPrivateKey, opts.vapidSubject);
    const doFetch = opts.fetchImpl ?? fetch;
    const res = await doFetch(sub.endpoint, {
      method: "POST",
      headers: {
        Authorization: `vapid t=${jwt},k=${opts.vapidPublicKey}`,
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        TTL: String(Math.max(0, Math.floor(opts.ttlSeconds ?? 86400))),
        ...(opts.urgency ? { Urgency: opts.urgency } : {}),
      },
      body: await encryptPayload(JSON.stringify(payload), sub),
    });
    const ok = res.status === 200 || res.status === 201;
    const gone = res.status === 404 || res.status === 410;
    return {
      ok,
      status: res.status,
      gone,
      retryable: !ok && !gone && (res.status === 429 || res.status >= 500),
      ...(ok ? {} : { error: `HTTP ${res.status}` }),
    };
  } catch (e) {
    return { ok: false, status: 0, gone: false, retryable: true, error: String((e as Error)?.message ?? e) };
  }
}
