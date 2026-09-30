// @ts-nocheck
// Tests for den delte Web Push-afsender i supabase/functions/_shared/webpush.ts
// (samme kode som edge-funktionerne send-push og notify kører).
import { describe, it, expect } from "vitest";
import {
  base64urlEncode,
  base64urlDecode,
  pushAudience,
  endpointHash,
  buildVapidJwt,
  encryptPayload,
  sendWebPush,
} from "../supabase/functions/_shared/webpush.ts";

const dec = (b) => new TextDecoder().decode(b);

async function makeVapid() {
  const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const priv = base64urlEncode(new Uint8Array(await crypto.subtle.exportKey("pkcs8", kp.privateKey)));
  const pub = base64urlEncode(new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey)));
  return { kp, priv, pub };
}

async function makeSubscription(endpoint = "https://fcm.googleapis.com/fcm/send/abc") {
  const kp = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const p256dh = base64urlEncode(new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey)));
  const auth = base64urlEncode(crypto.getRandomValues(new Uint8Array(16)));
  return { sub: { endpoint, keys: { p256dh, auth } }, privateKey: kp.privateKey, publicRaw: base64urlDecode(p256dh), authBytes: base64urlDecode(auth) };
}

// Modtagersiden af RFC 8291 — bruges kun til at bevise, at kryptering kan åbnes.
async function decryptAes128gcm(body, { privateKey, publicRaw, authBytes }) {
  const salt = body.slice(0, 16);
  const idLen = body[20];
  const serverPub = body.slice(21, 21 + idLen);
  const cipher = body.slice(21 + idLen);
  const serverKey = await crypto.subtle.importKey("raw", serverPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: serverKey }, privateKey, 256));
  const hkdf = async (s, ikm, info, len) => {
    const k = await crypto.subtle.importKey("raw", ikm, { name: "HKDF" }, false, ["deriveBits"]);
    return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: s, info }, k, len * 8));
  };
  const enc = (s) => new TextEncoder().encode(s);
  const join = (...a) => Uint8Array.from(a.flatMap((x) => [...x]));
  const prk = await hkdf(authBytes, shared, join(enc("WebPush: info\0"), publicRaw, serverPub), 32);
  const cek = await hkdf(salt, prk, enc("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, prk, enc("Content-Encoding: nonce\0"), 12);
  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["decrypt"]);
  const plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, key, cipher));
  // Fjern padding-afgrænseren (0x02) til sidst
  return plain.slice(0, plain.lastIndexOf(2));
}

describe("base64url", () => {
  it("runder rundt uden padding og med url-sikre tegn", () => {
    const bytes = Uint8Array.from([251, 255, 254, 1, 2, 3, 250]);
    const s = base64urlEncode(bytes);
    expect(s).not.toMatch(/[+/=]/);
    expect([...base64urlDecode(s)]).toEqual([...bytes]);
  });
});

describe("pushAudience", () => {
  it("udleder oprindelsen for hver push-tjeneste (ikke altid FCM)", () => {
    expect(pushAudience("https://fcm.googleapis.com/fcm/send/xyz")).toBe("https://fcm.googleapis.com");
    expect(pushAudience("https://web.push.apple.com/QGxyz")).toBe("https://web.push.apple.com");
    expect(pushAudience("https://updates.push.services.mozilla.com/wpush/v2/abc")).toBe("https://updates.push.services.mozilla.com");
  });
});

describe("endpointHash", () => {
  it("er stabil, 32 hex-tegn og forskellig pr. endpoint", async () => {
    const a = await endpointHash("https://a.example/1");
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(await endpointHash("https://a.example/1")).toBe(a);
    expect(await endpointHash("https://a.example/2")).not.toBe(a);
  });
});

describe("buildVapidJwt", () => {
  it("har korrekte claims og en gyldig ES256-signatur", async () => {
    const { kp, priv } = await makeVapid();
    const jwt = await buildVapidJwt("https://web.push.apple.com", priv, "mailto:test@example.com");
    const [h, p, s] = jwt.split(".");
    expect(JSON.parse(dec(base64urlDecode(h)))).toEqual({ typ: "JWT", alg: "ES256" });
    const claims = JSON.parse(dec(base64urlDecode(p)));
    expect(claims.aud).toBe("https://web.push.apple.com");
    expect(claims.sub).toBe("mailto:test@example.com");
    const now = Math.floor(Date.now() / 1000);
    expect(claims.exp).toBeGreaterThan(now);
    expect(claims.exp).toBeLessThanOrEqual(now + 24 * 3600);
    const ok = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      kp.publicKey,
      base64urlDecode(s),
      new TextEncoder().encode(`${h}.${p}`),
    );
    expect(ok).toBe(true);
  });
});

describe("encryptPayload", () => {
  it("kan dekrypteres af modtageren (RFC 8291 rundtur), også med æøå", async () => {
    const s = await makeSubscription();
    const text = JSON.stringify({ title: "Nøddefri kage", body: "Æbler, øl og ål" });
    const body = await encryptPayload(text, s.sub);
    expect(dec(await decryptAes128gcm(body, s))).toBe(text);
  });

  it("bruger nyt salt og ny nøgle for hver besked", async () => {
    const s = await makeSubscription();
    const a = await encryptPayload("x", s.sub);
    const b = await encryptPayload("x", s.sub);
    expect([...a]).not.toEqual([...b]);
  });
});

describe("sendWebPush", () => {
  const send = async (fetchImpl, endpoint) => {
    const v = await makeVapid();
    const s = await makeSubscription(endpoint);
    const result = await sendWebPush(s.sub, { title: "t" }, {
      vapidPublicKey: v.pub, vapidPrivateKey: v.priv, vapidSubject: "mailto:x@example.com", fetchImpl,
    });
    return { result, v, s };
  };

  it("sender til subscriptionens eget endpoint med vapid-audience for dét endpoint", async () => {
    let seen;
    const { result, v } = await send(async (url, init) => { seen = { url, init }; return { status: 201 }; }, "https://web.push.apple.com/abc");
    expect(result).toEqual({ ok: true, status: 201, gone: false, retryable: false });
    expect(seen.url).toBe("https://web.push.apple.com/abc");
    expect(seen.init.headers["Content-Encoding"]).toBe("aes128gcm");
    expect(seen.init.headers.TTL).toBe("86400");
    const auth = seen.init.headers.Authorization;
    expect(auth).toContain(`k=${v.pub}`);
    const jwt = auth.match(/t=([^,]+)/)[1];
    expect(JSON.parse(dec(base64urlDecode(jwt.split(".")[1]))).aud).toBe("https://web.push.apple.com");
  });

  it("sender TTL og Urgency videre", async () => {
    let headers;
    const v = await makeVapid();
    const s = await makeSubscription();
    await sendWebPush(s.sub, {}, {
      vapidPublicKey: v.pub, vapidPrivateKey: v.priv, vapidSubject: "mailto:x@example.com",
      ttlSeconds: 3600, urgency: "high",
      fetchImpl: async (_u, init) => { headers = init.headers; return { status: 201 }; },
    });
    expect(headers.TTL).toBe("3600");
    expect(headers.Urgency).toBe("high");
  });

  it("klassificerer 404/410 som gone (fjern subscription)", async () => {
    for (const status of [404, 410]) {
      const { result } = await send(async () => ({ status }));
      expect(result).toMatchObject({ ok: false, gone: true, retryable: false, status });
    }
  });

  it("klassificerer 429 og 5xx som retryable", async () => {
    for (const status of [429, 500, 503]) {
      const { result } = await send(async () => ({ status }));
      expect(result).toMatchObject({ ok: false, gone: false, retryable: true, status });
    }
  });

  it("klassificerer andre 4xx (fx 401/403) som permanent fejl uden retry", async () => {
    for (const status of [400, 401, 403]) {
      const { result } = await send(async () => ({ status }));
      expect(result).toMatchObject({ ok: false, gone: false, retryable: false, status });
    }
  });

  it("behandler netværksfejl som retryable", async () => {
    const { result } = await send(async () => { throw new Error("boom"); });
    expect(result).toMatchObject({ ok: false, status: 0, gone: false, retryable: true, error: "boom" });
  });
});

describe("buildVapidJwt med rå VAPID-nøgle (web-push generate-vapid-keys)", () => {
  it("accepterer rå 32-bytes privatnøgle + offentlig nøgle og signerer gyldigt", async () => {
    const { kp, pub } = await makeVapid();
    const jwk = await crypto.subtle.exportKey("jwk", kp.privateKey);
    const rawPriv = jwk.d; // 32 bytes base64url, som web-push udskriver
    const jwt = await buildVapidJwt("https://fcm.googleapis.com", rawPriv, "mailto:test@example.com", undefined, pub);
    const [h, p, s] = jwt.split(".");
    const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, kp.publicKey, base64urlDecode(s), new TextEncoder().encode(`${h}.${p}`));
    expect(ok).toBe(true);
  });
  it("afviser rå privatnøgle uden offentlig nøgle med en tydelig fejl", async () => {
    const { kp } = await makeVapid();
    const jwk = await crypto.subtle.exportKey("jwk", kp.privateKey);
    await expect(buildVapidJwt("https://fcm.googleapis.com", jwk.d, "mailto:t@example.com")).rejects.toThrow(/offentlige nøgle/);
  });
  it("sendWebPush med rå nøgle når frem til push-tjenesten", async () => {
    const { kp, pub } = await makeVapid();
    const jwk = await crypto.subtle.exportKey("jwk", kp.privateKey);
    const { sub } = await makeSubscription();
    let seen;
    const res = await sendWebPush(sub, { title: "t" }, {
      vapidPublicKey: pub, vapidPrivateKey: jwk.d, vapidSubject: "mailto:t@example.com",
      fetchImpl: async (url, init) => { seen = init.headers.Authorization; return { status: 201 }; },
    });
    expect(res.ok).toBe(true);
    expect(seen).toMatch(/^vapid t=.+,k=/);
  });
});

