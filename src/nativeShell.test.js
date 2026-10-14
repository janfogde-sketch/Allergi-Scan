import { describe, it, expect, afterEach, vi } from "vitest";
import { isNativeApp, authReturnTarget, openInSystemBrowser, listenForAuthReturn, NATIVE_AUTH_RETURN } from "./nativeShell.js";

afterEach(() => { vi.unstubAllGlobals(); });
const stubWindow = (w) => vi.stubGlobal("window", w);

describe("nativeShell", () => {
  it("er ikke native uden Capacitor (browser og Android)", async () => {
    stubWindow({});
    expect(isNativeApp()).toBe(false);
    expect(await openInSystemBrowser("https://x")).toBe(false);
  });
  it("er ikke native, når Capacitor siger nej", () => {
    stubWindow({ Capacitor: { isNativePlatform: () => false } });
    expect(isNativeApp()).toBe(false);
  });
  it("åbner systembrowseren i iPhone-rammen", async () => {
    const open = vi.fn().mockResolvedValue();
    stubWindow({ Capacitor: { isNativePlatform: () => true, Plugins: { Browser: { open } } } });
    expect(await openInSystemBrowser("https://x/y")).toBe(true);
    expect(open).toHaveBeenCalledWith({ url: "https://x/y" });
  });
  it("oversætter retur-adressen og bevarer hashen", () => {
    expect(authReturnTarget(`${NATIVE_AUTH_RETURN}#access_token=a&refresh_token=b`))
      .toBe("https://www.eatsafe.dk/?src=store#access_token=a&refresh_token=b");
    expect(authReturnTarget(NATIVE_AUTH_RETURN)).toBe("https://www.eatsafe.dk/?src=store");
  });
  it("afviser fremmede adresser", () => {
    expect(authReturnTarget("https://evil.example/#access_token=a")).toBeNull();
    expect(authReturnTarget("dk.eatsafe.app://authx#access_token=a")).toBeNull();
    expect(authReturnTarget("dk.eatsafe.app://other")).toBeNull();
    expect(authReturnTarget(undefined)).toBeNull();
  });
  it("sender kun login-retur videre og lukker browseren", async () => {
    let cb;
    const close = vi.fn();
    const remove = vi.fn();
    stubWindow({ Capacitor: { isNativePlatform: () => true, Plugins: {
      App: { addListener: (_n, f) => { cb = f; return Promise.resolve({ remove }); } }, Browser: { close } } } });
    const got = [];
    const stop = listenForAuthReturn((t) => got.push(t));
    await Promise.resolve();
    cb({ url: "dk.eatsafe.app://other" });
    expect(got).toEqual([]);
    cb({ url: `${NATIVE_AUTH_RETURN}#access_token=a` });
    expect(got).toEqual(["https://www.eatsafe.dk/?src=store#access_token=a"]);
    expect(close).toHaveBeenCalled();
    stop();
    expect(remove).toHaveBeenCalled();
  });
  it("gør intet uden for iPhone-rammen", () => {
    stubWindow({});
    expect(() => listenForAuthReturn(() => {})()).not.toThrow();
  });
});
