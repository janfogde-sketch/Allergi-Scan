// @vitest-environment jsdom
// @ts-nocheck
// Push er per enhed, ikke per konto: den konto, der er logget ind, skal have enhedens abonnement gemt,
// også når tilladelsen blev givet af en anden konto. Og logout må ikke efterlade den forrige kontos række.
import { describe, it, expect, beforeEach, vi } from "vitest";
import { syncPushToken, forgetPushTokenForDevice, usePush, SAVE_FAILED_REASON } from "./usePush.js";

// usePush() er en hook uden React-tilstand; kaldes direkte for at nå subscribe/unsubscribe.
const usePushHook = () => usePush();

const SUB = { endpoint: "https://push.example/abc", keys: { p256dh: "k", auth: "a" } };

function setupBrowser({ permission = "granted", existing = true } = {}) {
  const sub = { toJSON: () => SUB };
  const pushManager = {
    getSubscription: vi.fn().mockResolvedValue(existing ? sub : null),
    subscribe: vi.fn().mockResolvedValue(sub),
  };
  const reg = { pushManager };
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { register: vi.fn().mockResolvedValue(reg), ready: Promise.resolve(reg), getRegistration: vi.fn().mockResolvedValue(reg) },
  });
  window.PushManager = function PushManager() {};
  window.Notification = { permission, requestPermission: vi.fn() };
  return { pushManager };
}

beforeEach(() => { global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 201 }); });

describe("syncPushToken", () => {
  it("gemmer enhedens abonnement for den indloggede konto, når tilladelsen allerede er givet", async () => {
    setupBrowser();
    const res = await syncPushToken("tok-jafo");
    expect(res.ok).toBe(true);
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/rest\/v1\/rpc\/claim_push_token$/);
    expect(init.headers.Authorization).toBe("Bearer tok-jafo");
    expect(JSON.parse(init.body)).toEqual({ p_token: JSON.stringify(SUB) });
  });

  it("falder tilbage til almindelig indsættelse, hvis databasefunktionen ikke findes endnu", async () => {
    setupBrowser();
    global.fetch.mockResolvedValueOnce({ ok: false, status: 404 }).mockResolvedValueOnce({ ok: true, status: 201 });
    const res = await syncPushToken("tok-jafo");
    expect(res.ok).toBe(true);
    expect(global.fetch.mock.calls[1][0]).toMatch(/\/rest\/v1\/push_tokens$/);
  });

  it("opretter IKKE et nyt abonnement, hvis tilladelsen findes, men abonnementet mangler (push er slået fra)", async () => {
    const { pushManager } = setupBrowser({ existing: false });
    const res = await syncPushToken("tok");
    expect(pushManager.subscribe).not.toHaveBeenCalled();
    expect(res).toEqual({ ok: false, reason: "Ikke slået til" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("push slået fra, log ud og ind igen: push bliver ved med at være fra", async () => {
    const { pushManager } = setupBrowser();
    // (Indstillinger) fra: abonnementet fjernes, tilladelsen står stadig som givet
    const unsub = vi.fn().mockResolvedValue(true);
    pushManager.getSubscription.mockResolvedValue({ toJSON: () => SUB, unsubscribe: unsub });
    await usePushHook().unsubscribe("tok");
    pushManager.getSubscription.mockResolvedValue(null);
    pushManager.subscribe.mockClear(); global.fetch.mockClear();
    // log ud og ind: kontoen skifter, enheden synkes
    await forgetPushTokenForDevice("tok");
    const res = await syncPushToken("tok-ny-login");
    expect(res.ok).toBe(false);
    expect(pushManager.subscribe).not.toHaveBeenCalled();
    expect(global.fetch.mock.calls.some(([u, i]) => /claim_push_token/.test(u) || i?.method === "POST")).toBe(false);
  });

  it("push slået til, log ud og ind igen: abonnementet gemmes igen på kontoen", async () => {
    setupBrowser();
    await forgetPushTokenForDevice("tok");
    const res = await syncPushToken("tok-ny-login");
    expect(res.ok).toBe(true);
    expect(global.fetch.mock.calls.some(([u]) => /claim_push_token/.test(u))).toBe(true);
  });

  it("spørger aldrig om tilladelse og gør intet uden den", async () => {
    setupBrowser({ permission: "default" });
    const res = await syncPushToken("tok");
    expect(res.ok).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(window.Notification.requestPermission).not.toHaveBeenCalled();
  });

  it("melder, når serveren afviser abonnementet (tidligere helt usynligt)", async () => {
    setupBrowser();
    global.fetch.mockResolvedValue({ ok: false, status: 403 });
    const res = await syncPushToken("tok");
    expect(res).toEqual({ ok: false, reason: SAVE_FAILED_REASON });
  });
});

describe("forgetPushTokenForDevice", () => {
  it("sletter kun den udloggede kontos række og afmelder ikke browserens abonnement", async () => {
    const { pushManager } = setupBrowser();
    await forgetPushTokenForDevice("tok-gammel");
    const [url, init] = global.fetch.mock.calls[0];
    expect(init.method).toBe("DELETE");
    expect(url).toContain(encodeURIComponent(JSON.stringify(SUB)));
    expect(init.headers.Authorization).toBe("Bearer tok-gammel");
    expect(pushManager.subscribe).not.toHaveBeenCalled();
  });

  it("gør intet uden token", async () => {
    setupBrowser();
    await forgetPushTokenForDevice(null);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
