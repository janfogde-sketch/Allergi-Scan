// @ts-nocheck
// Apples push (iPhone-appen): token-genkendelse, adgangs-token, besked og klassificering af Apples svar.
import { describe, it, expect, vi } from "vitest";
import { parseApnsToken, apnsConfigFromEnv, buildApnsJwt, buildApnsBody, sendApns } from "../supabase/functions/_shared/apns.ts";

const HEX = "ab".repeat(32);

async function makeConfig(extra = {}) {
  const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const der = new Uint8Array(await crypto.subtle.exportKey("pkcs8", kp.privateKey));
  const b64 = btoa(String.fromCharCode(...der)).replace(/(.{64})/g, "$1\n");
  return { kp, cfg: { keyP8: `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----`, keyId: `K${Math.random().toString(36).slice(2, 8)}`, teamId: "TEAM123456", bundleId: "dk.eatsafe.app", ...extra } };
}
const b64urlToBytes = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(s.length + ((4 - (s.length % 4)) % 4), "=")), (c) => c.charCodeAt(0));

describe("parseApnsToken", () => {
  it("genkender iPhone-token og afviser web-abonnementer og skrald", () => {
    expect(parseApnsToken(JSON.stringify({ platform: "ios", apns: HEX.toUpperCase() }))).toEqual({ platform: "ios", apns: HEX });
    expect(parseApnsToken(JSON.stringify({ endpoint: "https://x", keys: {} }))).toBeNull();
    expect(parseApnsToken(JSON.stringify({ platform: "ios", apns: "xyz" }))).toBeNull();
    expect(parseApnsToken("ikke json")).toBeNull();
  });
});

describe("apnsConfigFromEnv", () => {
  it("er null, hvis en nøgle mangler, og ellers komplet", () => {
    const env = { APNS_KEY_P8: "p", APNS_KEY_ID: "k", APNS_TEAM_ID: "t", APNS_BUNDLE_ID: "dk.eatsafe.app" };
    expect(apnsConfigFromEnv((k) => env[k])).toMatchObject({ keyId: "k", sandbox: false });
    expect(apnsConfigFromEnv((k) => (k === "APNS_KEY_ID" ? undefined : env[k]))).toBeNull();
    expect(apnsConfigFromEnv((k) => ({ ...env, APNS_SANDBOX: "true" })[k]).sandbox).toBe(true);
  });
});

describe("buildApnsJwt", () => {
  it("laver et ES256-token med korrekt hoved, udsagn og gyldig signatur", async () => {
    const { kp, cfg } = await makeConfig();
    const jwt = await buildApnsJwt(cfg, 1_800_000_000_000);
    const [h, c, sig] = jwt.split(".");
    expect(JSON.parse(atob(h))).toEqual({ alg: "ES256", kid: cfg.keyId });
    expect(JSON.parse(atob(c))).toEqual({ iss: "TEAM123456", iat: 1_800_000_000 });
    const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, kp.publicKey, b64urlToBytes(sig), new TextEncoder().encode(`${h}.${c}`));
    expect(ok).toBe(true);
  });
  it("genbruger tokenet i 30 minutter og fornyer derefter", async () => {
    const { cfg } = await makeConfig();
    const a = await buildApnsJwt(cfg, 1_000_000_000_000);
    expect(await buildApnsJwt(cfg, 1_000_000_000_000 + 10 * 60_000)).toBe(a);
    expect(await buildApnsJwt(cfg, 1_000_000_000_000 + 31 * 60_000)).not.toBe(a);
  });
});

describe("buildApnsBody", () => {
  it("samler aps og egne felter og udelader web-felter", () => {
    expect(buildApnsBody({ title: "T", body: "B", url: "https://www.eatsafe.dk/?notification=1", tag: "x", icon: "/i.png", lang: "da", notificationId: "n" }))
      .toEqual({ aps: { alert: { title: "T", body: "B" }, sound: "default" }, url: "https://www.eatsafe.dk/?notification=1", notificationId: "n" });
  });
});

describe("sendApns", () => {
  const reply = (status, reason) => vi.fn().mockResolvedValue({ status, json: async () => (reason ? { reason } : {}) });
  it("sender til Apple med rigtige overskrifter", async () => {
    const { cfg } = await makeConfig();
    const fetchImpl = reply(200);
    const res = await sendApns({ platform: "ios", apns: HEX }, { title: "T", body: "B", tag: "t:1" }, cfg, { fetchImpl, ttlSeconds: 60, nowMs: 1_000_000_000_000 });
    expect(res).toMatchObject({ ok: true, gone: false, retryable: false });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(`https://api.push.apple.com/3/device/${HEX}`);
    expect(init.headers["apns-topic"]).toBe("dk.eatsafe.app");
    expect(init.headers["apns-push-type"]).toBe("alert");
    expect(init.headers["apns-expiration"]).toBe(String(1_000_000_000 + 60));
    expect(init.headers["apns-collapse-id"]).toBe("t:1");
    expect(init.headers.authorization).toMatch(/^bearer /);
  });
  it("bruger sandkassen kun når den er slået til", async () => {
    const { cfg } = await makeConfig({ sandbox: true });
    const fetchImpl = reply(200);
    await sendApns({ platform: "ios", apns: HEX }, { title: "T", body: "B" }, cfg, { fetchImpl });
    expect(fetchImpl.mock.calls[0][0]).toContain("api.sandbox.push.apple.com");
  });
  it("markerer ugyldige tokens som væk og 5xx/429 som genforsøg", async () => {
    const { cfg } = await makeConfig();
    const t = { platform: "ios", apns: HEX };
    const p = { title: "T", body: "B" };
    expect(await sendApns(t, p, cfg, { fetchImpl: reply(410, "Unregistered") })).toMatchObject({ ok: false, gone: true, retryable: false });
    expect(await sendApns(t, p, cfg, { fetchImpl: reply(400, "BadDeviceToken") })).toMatchObject({ gone: true });
    expect(await sendApns(t, p, cfg, { fetchImpl: reply(503, "ServiceUnavailable") })).toMatchObject({ gone: false, retryable: true });
    expect(await sendApns(t, p, cfg, { fetchImpl: reply(429, "TooManyRequests") })).toMatchObject({ retryable: true });
    expect(await sendApns(t, p, cfg, { fetchImpl: reply(403, "InvalidProviderToken") })).toMatchObject({ gone: false, retryable: false, error: "HTTP 403 InvalidProviderToken" });
  });
  it("giver genforsøg ved netværksfejl", async () => {
    const { cfg } = await makeConfig();
    const res = await sendApns({ platform: "ios", apns: HEX }, { title: "T", body: "B" }, cfg, { fetchImpl: vi.fn().mockRejectedValue(new Error("net")) });
    expect(res).toMatchObject({ ok: false, retryable: true });
  });
});
