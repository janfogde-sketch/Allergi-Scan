// @ts-nocheck
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { reportError, shouldReport, getRecentErrors, _resetForTests } from "./errorReporter.js";

describe("shouldReport", () => {
  it("afviser tom tekst og kendt støj", () => {
    expect(shouldReport("")).toBe(false);
    expect(shouldReport("ResizeObserver loop limit exceeded")).toBe(false);
    expect(shouldReport("Script error.")).toBe(false);
    expect(shouldReport("x", "at chrome-extension://abc/content.js")).toBe(false);
  });

  it("godtager rigtige fejl", () => {
    expect(shouldReport("Cannot read properties of undefined (reading 'map')")).toBe(true);
  });
});

describe("reportError", () => {
  beforeEach(() => {
    _resetForTests();
    localStorage.clear();
    sessionStorage.clear();
    globalThis.fetch = vi.fn(async () => ({ ok: true, status: 204 }));
  });

  it("sender til log_client_error med skærm og besked", async () => {
    const err = new Error("Boom");
    expect(await reportError(err, { screen: "Scanner", source: "react" })).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toMatch(/\/rest\/v1\/rpc\/log_client_error$/);
    const body = JSON.parse(opts.body);
    expect(body.p_message).toBe("Boom");
    expect(body.p_screen).toBe("Scanner");
    expect(body.p_source).toBe("react");
    expect(body.p_stack).toContain("Boom");
  });

  it("sender ikke samme fejl to gange i samme session", async () => {
    await reportError(new Error("Samme"), { screen: "A" });
    await reportError(new Error("Samme"), { screen: "A" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("stopper efter 20 fejl pr. session", async () => {
    for (let i = 0; i < 25; i++) await reportError(new Error(`Fejl ${i}`));
    expect(fetch).toHaveBeenCalledTimes(20);
  });

  it("bruger login-token og prøver anonymt ved 401", async () => {
    localStorage.setItem("as_token", "user-token");
    fetch.mockResolvedValueOnce({ ok: false, status: 401 }).mockResolvedValueOnce({ ok: true, status: 204 });
    expect(await reportError(new Error("Udløbet"))).toBe(true);
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe("Bearer user-token");
    expect(fetch.mock.calls[1][1].headers.Authorization).not.toBe("Bearer user-token");
  });

  it("sender aldrig query-strengen med (kan indeholde tokens)", async () => {
    window.history.replaceState(null, "", "/invite?token=hemmelig");
    await reportError(new Error("Med url"));
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.p_url).toBe("/invite");
    expect(JSON.stringify(body)).not.toContain("hemmelig");
  });

  it("kaster aldrig, selv hvis netværket fejler", async () => {
    fetch.mockRejectedValueOnce(new Error("offline"));
    await expect(reportError(new Error("Net"))).resolves.toBe(false);
  });
});

describe("getRecentErrors (til crash-feedback)", () => {
  beforeEach(() => {
    _resetForTests();
    localStorage.clear();
    globalThis.fetch = vi.fn(async () => ({ ok: true, status: 204 }));
  });

  it("gemmer de seneste fejl lokalt, højst 5, uden støj og uden gentagelser i træk", async () => {
    expect(getRecentErrors()).toEqual([]);
    for (let i = 1; i <= 7; i++) await reportError(new Error(`Fejl ${i}`), { screen: "Scanner" });
    await reportError(new Error("Fejl 7"), { screen: "Scanner" });
    await reportError("ResizeObserver loop limit exceeded");
    const list = getRecentErrors();
    expect(list).toHaveLength(5);
    expect(list.map(e => e.message)).toEqual(["Fejl 3", "Fejl 4", "Fejl 5", "Fejl 6", "Fejl 7"]);
    expect(list[0]).toMatchObject({ screen: "Scanner", source: "app" });
  });

  it("gemmes også, når afsendelsen er afvist (offline)", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    await reportError(new Error("Offline-fejl"));
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    expect(getRecentErrors().map(e => e.message)).toEqual(["Offline-fejl"]);
  });
});
