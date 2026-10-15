// @vitest-environment jsdom
// @ts-nocheck
import { describe, it, expect, vi, afterEach } from "vitest";
import { nativeAppleAvailable, appleNativeAuthorize, exchangeAppleToken, isAppleCancel } from "./nativeApple.js";

afterEach(() => { delete window.Capacitor; });
const stub = (authorize) => { window.Capacitor = { isNativePlatform: () => true, Plugins: { SignInWithApple: { authorize } } }; };

describe("nativeApple", () => {
  it("er ikke til stede uden for iPhone-rammen eller uden plugin", () => {
    expect(nativeAppleAvailable()).toBe(false);
    window.Capacitor = { isNativePlatform: () => true, Plugins: {} };
    expect(nativeAppleAvailable()).toBe(false);
    stub(vi.fn());
    expect(nativeAppleAvailable()).toBe(true);
  });
  it("sender hash af nonce til Apple og giver den rå nonce til Supabase", async () => {
    const authorize = vi.fn().mockResolvedValue({ response: { identityToken: "ID.TOKEN" } });
    stub(authorize);
    const r = await appleNativeAuthorize();
    expect(r.ok).toBe(true);
    const sent = authorize.mock.calls[0][0];
    expect(sent.clientId).toBe("dk.eatsafe.app");
    expect(sent.scopes).toBe("email name");
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(r.nonce)));
    expect(sent.nonce).toBe(Array.from(digest).map((b) => b.toString(16).padStart(2, "0")).join(""));
    expect(r.idToken).toBe("ID.TOKEN");
  });
  it("skelner mellem annullering og fejl", async () => {
    stub(vi.fn().mockRejectedValue({ code: "1001", message: "The operation couldn't be completed" }));
    expect(await appleNativeAuthorize()).toMatchObject({ ok: false, cancelled: true });
    stub(vi.fn().mockRejectedValue(new Error("boom")));
    expect(await appleNativeAuthorize()).toMatchObject({ ok: false, cancelled: false });
    expect(isAppleCancel({ message: "User cancelled" })).toBe(true);
    stub(vi.fn().mockResolvedValue({ response: {} }));
    expect(await appleNativeAuthorize()).toMatchObject({ ok: false, cancelled: false });
  });
  it("veksler id-token til session hos Supabase", async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ access_token: "A", refresh_token: "R" }) });
    expect(await exchangeAppleToken("https://x.supabase.co", "anon", "ID", "N", f)).toEqual({ ok: true, access: "A", refresh: "R" });
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://x.supabase.co/auth/v1/token?grant_type=id_token");
    expect(init.headers.apikey).toBe("anon");
    expect(JSON.parse(init.body)).toEqual({ provider: "apple", id_token: "ID", nonce: "N" });
  });
  it("melder fejl fra Supabase og netværk", async () => {
    expect(await exchangeAppleToken("u", "k", "i", "n", vi.fn().mockResolvedValue({ ok: false, status: 400 }))).toEqual({ ok: false, reason: "HTTP 400" });
    expect((await exchangeAppleToken("u", "k", "i", "n", vi.fn().mockRejectedValue(new Error("net")))).ok).toBe(false);
    expect((await exchangeAppleToken("u", "k", "i", "n", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }))).ok).toBe(false);
  });
});
