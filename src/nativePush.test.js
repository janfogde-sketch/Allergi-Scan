// @vitest-environment jsdom
// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { nativePushAvailable, nativeRegister, nativeTokenJson, pushTapTarget, listenForPushTap, cachedNativePermission, nativePermission } from "./nativePush.js";
import { syncPushToken, forgetPushTokenForDevice, SAVE_FAILED_REASON } from "./usePush.js";

function stubNative({ receive = "granted", asked = "granted", token = "abcdef0123456789abcdef0123456789" } = {}) {
  const listeners = {};
  const push = {
    checkPermissions: vi.fn().mockResolvedValue({ receive }),
    requestPermissions: vi.fn().mockResolvedValue({ receive: asked }),
    addListener: vi.fn(async (n, f) => { listeners[n] = f; return { remove: vi.fn() }; }),
    register: vi.fn(async () => { listeners.registration?.({ value: token }); }),
    unregister: vi.fn().mockResolvedValue(),
  };
  window.Capacitor = { isNativePlatform: () => true, Plugins: { PushNotifications: push } };
  return { push, listeners };
}

beforeEach(() => { localStorage.clear(); global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 }); });
afterEach(() => { delete window.Capacitor; });

describe("nativePush", () => {
  it("er ikke til stede uden for iPhone-rammen", () => {
    expect(nativePushAvailable()).toBe(false);
  });
  it("beder ikke om tilladelse, når ask er falsk, og henter token, når den er givet", async () => {
    const { push } = stubNative();
    const r = await nativeRegister(false);
    expect(r).toEqual({ ok: true, token: "abcdef0123456789abcdef0123456789" });
    expect(push.requestPermissions).not.toHaveBeenCalled();
  });
  it("beder om tilladelse ved ask og stopper ved afslag", async () => {
    const { push } = stubNative({ receive: "prompt", asked: "denied" });
    const r = await nativeRegister(true);
    expect(push.requestPermissions).toHaveBeenCalled();
    expect(r).toEqual({ ok: false, reason: "Tilladelse afvist" });
    expect(cachedNativePermission()).toBe("denied");
    expect(push.register).not.toHaveBeenCalled();
  });
  it("giver ingen tilladelse uden ask", async () => {
    stubNative({ receive: "prompt" });
    expect((await nativeRegister(false)).ok).toBe(false);
    expect(await nativePermission()).toBe("default");
  });
  it("melder fejl, hvis Apple ikke svarer", async () => {
    const { push } = stubNative();
    push.register.mockImplementation(async () => {});
    const r = await nativeRegister(false, 20);
    expect(r.ok).toBe(false);
  });
  it("åbner kun appens egne adresser ved tryk", () => {
    expect(pushTapTarget("https://www.eatsafe.dk/?notification=abc")).toBe("https://www.eatsafe.dk/?notification=abc");
    expect(pushTapTarget("/?notification=abc")).toBe("https://www.eatsafe.dk/?notification=abc");
    expect(pushTapTarget("https://evil.example/x")).toBeNull();
    expect(pushTapTarget(undefined)).toBeNull();
  });
  it("sender tryk videre", async () => {
    const { listeners } = stubNative();
    const got = [];
    const stop = listenForPushTap((t) => got.push(t));
    await Promise.resolve(); await Promise.resolve();
    listeners.pushNotificationActionPerformed({ notification: { data: { url: "https://www.eatsafe.dk/?notification=1" } } });
    listeners.pushNotificationActionPerformed({ notification: { data: { url: "https://evil.example/" } } });
    expect(got).toEqual(["https://www.eatsafe.dk/?notification=1"]);
    stop();
  });
});

describe("push i iPhone-rammen via usePush", () => {
  it("gemmer Apples token for kontoen, når tilladelsen allerede er givet", async () => {
    stubNative();
    const res = await syncPushToken("tok-1");
    expect(res.ok).toBe(true);
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toMatch(/rpc\/claim_push_token$/);
    expect(JSON.parse(init.body)).toEqual({ p_token: nativeTokenJson("abcdef0123456789abcdef0123456789") });
  });
  it("gør intet uden tilladelse", async () => {
    stubNative({ receive: "prompt" });
    expect((await syncPushToken("tok")).ok).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it("melder, hvis serveren ikke tog imod token", async () => {
    stubNative();
    global.fetch.mockResolvedValue({ ok: false, status: 500 });
    expect(await syncPushToken("tok")).toEqual({ ok: false, reason: SAVE_FAILED_REASON });
  });
  it("fjerner kontoens række ved logout", async () => {
    stubNative();
    await syncPushToken("tok");
    global.fetch.mockClear();
    await forgetPushTokenForDevice("tok");
    const [url, init] = global.fetch.mock.calls[0];
    expect(init.method).toBe("DELETE");
    expect(decodeURIComponent(url)).toContain(nativeTokenJson("abcdef0123456789abcdef0123456789"));
  });
});
