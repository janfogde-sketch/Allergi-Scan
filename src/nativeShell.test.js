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
  it("oversætter retur-adressen og sender kun engangskoden og fejl videre", () => {
    expect(authReturnTarget(`${NATIVE_AUTH_RETURN}?code=abc&evil=1`)).toBe("https://www.eatsafe.dk/?src=store&code=abc");
    expect(authReturnTarget(`${NATIVE_AUTH_RETURN}?error=access_denied&error_code=x`))
      .toBe("https://www.eatsafe.dk/?src=store&error=access_denied&error_code=x");
    expect(authReturnTarget(`${NATIVE_AUTH_RETURN}#error=x`)).toBe("https://www.eatsafe.dk/?src=store#error=x");
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

describe("haptic", () => {
  it("bruger navigator.vibrate uden for iPhone-rammen (uændret opførsel)", async () => {
    const { haptic } = await import("./nativeShell.js");
    const vibrate = vi.fn();
    stubWindow({});
    vi.stubGlobal("navigator", { vibrate });
    haptic("warning", [1, 2]);
    expect(vibrate).toHaveBeenCalledWith([1, 2]);
  });
  it("bruger telefonens haptik i iPhone-rammen", async () => {
    const { haptic } = await import("./nativeShell.js");
    const impact = vi.fn(), notification = vi.fn(), vibrate = vi.fn();
    stubWindow({ Capacitor: { isNativePlatform: () => true, Plugins: { Haptics: { impact, notification } } } });
    vi.stubGlobal("navigator", { vibrate });
    haptic("medium", 40); haptic("light", 40); haptic("warning", 40);
    expect(impact.mock.calls).toEqual([[{ style: "MEDIUM" }], [{ style: "LIGHT" }]]);
    expect(notification).toHaveBeenCalledWith({ type: "WARNING" });
    expect(vibrate).not.toHaveBeenCalled();
  });
  it("kaster aldrig", async () => {
    const { haptic } = await import("./nativeShell.js");
    stubWindow({ Capacitor: { isNativePlatform: () => true, Plugins: { Haptics: { impact: () => { throw new Error("x"); } } } } });
    expect(() => haptic("light", 1)).not.toThrow();
  });
});
