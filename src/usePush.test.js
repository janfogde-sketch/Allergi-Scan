// @vitest-environment jsdom
// @ts-nocheck
// Push er per enhed, ikke per konto: den konto, der er logget ind, skal have enhedens abonnement gemt,
// også når tilladelsen blev givet af en anden konto. Og logout må ikke efterlade den forrige kontos række.
import { describe, it, expect, beforeEach, vi } from "vitest";
import { syncPushToken, forgetPushTokenForDevice, pushOptedOut, usePush, SAVE_FAILED_REASON } from "./usePush.js";

// Login-nøgle med kontoens id (kun payload bruges; signaturen tjekkes ikke i appen).
const b64url = (o) => Buffer.from(JSON.stringify(o)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const tokenFor = (sub) => `x.${b64url({ sub })}.y`;
// Appens VAPID-nøgle som bytes (samme omregning som i usePush.js), og en anden nøgle af samme længde.
const VAPID = "BJYPtJFzv1T3iPhd4V9EvRfsvn5mvreXeaTjL8BviWt1nMi7TlyXP83vsplYPFsWaC8byu3-KnCABVW1XMWdVgM";
function keyBytes(b64) { const p = "=".repeat((4 - (b64.length % 4)) % 4); const s = (b64 + p).replace(/-/g, "+").replace(/_/g, "/"); return Uint8Array.from([...atob(s)].map(c => c.charCodeAt(0))).buffer; }
const OTHER_KEY = (() => { const a = new Uint8Array(keyBytes(VAPID)); a[5] ^= 0xff; return a.buffer; })();

const SUB = { endpoint: "https://push.example/abc", keys: { p256dh: "k", auth: "a" } };

function setupBrowser({ permission = "granted", existing = true, appKey = null } = {}) {
  const sub = { toJSON: () => SUB, unsubscribe: vi.fn().mockResolvedValue(true), options: appKey ? { applicationServerKey: appKey } : {} };
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

beforeEach(() => { global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 201 }); localStorage.clear(); });

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

  it("opretter et nyt abonnement, hvis tilladelsen findes, men abonnementet mangler", async () => {
    const { pushManager } = setupBrowser({ existing: false });
    const res = await syncPushToken("tok");
    expect(pushManager.subscribe).toHaveBeenCalled();
    expect(res.ok).toBe(true);
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

// 16. okt. 2026 (frontend-gennemgang): brugerens fravalg i Indstillinger skal holde, og et abonnement med en forældet nøgle skal fornys.
describe("syncPushToken og brugerens fravalg", () => {
  it("tænder ikke push igen for en konto, der selv har slået den fra på enheden", async () => {
    const { pushManager } = setupBrowser();
    const tok = tokenFor("konto-a");
    await usePush().unsubscribe(tok);
    expect(pushOptedOut(tok)).toBe(true);
    expect(pushManager.getSubscription).toHaveBeenCalled();
    global.fetch.mockClear();
    const res = await syncPushToken(tok);
    expect(res.ok).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(pushManager.subscribe).not.toHaveBeenCalled();
  });

  it("gælder kun den konto, der slog fra: en anden konto på samme enhed får stadig sit abonnement gemt", async () => {
    setupBrowser();
    await usePush().unsubscribe(tokenFor("konto-a"));
    global.fetch.mockClear();
    const res = await syncPushToken(tokenFor("konto-b"));
    expect(res.ok).toBe(true);
    expect(pushOptedOut(tokenFor("konto-b"))).toBe(false);
  });

  it("glemmer fravalget, når brugeren selv slår push til igen", async () => {
    setupBrowser();
    const tok = tokenFor("konto-a");
    await usePush().unsubscribe(tok);
    const res = await usePush().subscribe(tok);
    expect(res.ok).toBe(true);
    expect(pushOptedOut(tok)).toBe(false);
  });

  it("beder om tilladelse, før service workeren registreres (brugerhandling på iPhone)", async () => {
    setupBrowser({ permission: "default" });
    const order = [];
    window.Notification.requestPermission = vi.fn(async () => { order.push("permission"); return "granted"; });
    navigator.serviceWorker.register = vi.fn(async () => { order.push("register"); return { pushManager: { getSubscription: vi.fn().mockResolvedValue(null), subscribe: vi.fn().mockResolvedValue({ toJSON: () => SUB }) } }; });
    const res = await usePush().subscribe(tokenFor("konto-a"));
    expect(res.ok).toBe(true);
    expect(order).toEqual(["permission", "register"]);
  });
});

describe("abonnementets VAPID-nøgle", () => {
  it("beholder et abonnement, der er oprettet med appens nøgle", async () => {
    const { pushManager } = setupBrowser({ appKey: keyBytes(VAPID) });
    const res = await syncPushToken(tokenFor("konto-a"));
    expect(res.ok).toBe(true);
    expect(pushManager.subscribe).not.toHaveBeenCalled();
  });

  it("beholder abonnementet, når nøglen ikke kan aflæses (ældre browser)", async () => {
    const { pushManager } = setupBrowser();
    await syncPushToken(tokenFor("konto-a"));
    expect(pushManager.subscribe).not.toHaveBeenCalled();
  });

  it("sletter rækken, afmelder og opretter på ny, når abonnementet hører til en anden nøgle", async () => {
    const { pushManager } = setupBrowser({ appKey: OTHER_KEY });
    const old = await pushManager.getSubscription();
    const res = await syncPushToken(tokenFor("konto-a"));
    expect(res.ok).toBe(true);
    expect(old.unsubscribe).toHaveBeenCalled();
    expect(pushManager.subscribe).toHaveBeenCalled();
    const deleteCall = global.fetch.mock.calls.find(([, init]) => init?.method === "DELETE");
    expect(deleteCall?.[0]).toContain("/rest/v1/push_tokens?token=eq.");
  });
});
