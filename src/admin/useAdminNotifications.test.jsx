// @ts-nocheck
// @vitest-environment jsdom
// Notifikationshooken: gem med konfliktkontrol (serverfunktion, med direkte skrivning som fallback før udgivelse), og testafsendelse, der aldrig melder succes ved fejl.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("../helpers.js", () => ({ apiCall: vi.fn(), makeHeaders: () => ({ Authorization: "Bearer t" }) }));
import { apiCall } from "../helpers.js";
import { useAdminNotifications } from "./useAdminNotifications.js";

const http = (status, body) => Object.assign(new Error("x"), { status, body: JSON.stringify(body || {}) });
beforeEach(() => { apiCall.mockReset(); apiCall.mockResolvedValue([]); });
afterEach(() => { vi.unstubAllGlobals(); });
const mount = async () => { const h = renderHook(() => useAdminNotifications("t", "u1")); await act(async () => {}); apiCall.mockReset(); return h; };

describe("savePush", () => {
  it("sender nøgle, tekst og den åbnede version til serverfunktionen og opdaterer listen", async () => {
    const { result } = await mount();
    apiCall.mockResolvedValueOnce("2026-10-16T10:00:00.123456+00:00");
    let r;
    await act(async () => { r = await result.current.savePush("N2a:default", { title: " T ", body: "B" }, "2026-10-15T08:00:00+00:00"); });
    expect(r).toEqual({ ok: true, updated_at: "2026-10-16T10:00:00.123456+00:00" });
    expect(apiCall.mock.calls[0][0]).toContain("/rpc/admin_save_push_override");
    expect(JSON.parse(apiCall.mock.calls[0][1].body)).toEqual({ p_key: "N2a:default", p_title: "T", p_body: "B", p_expected: "2026-10-15T08:00:00+00:00" });
    expect(result.current.overrides["N2a:default"].title).toBe("T");
  });
  it("40001 er en konflikt og ændrer intet; andre fejl er aldrig succes", async () => {
    const { result } = await mount();
    apiCall.mockRejectedValueOnce(http(400, { code: "40001" }));
    let r;
    await act(async () => { r = await result.current.savePush("N2a:default", { title: "T", body: "" }, null); });
    expect(r.ok).toBe(false); expect(r.conflict).toBe(true);
    expect(result.current.overrides["N2a:default"]).toBeUndefined();
    apiCall.mockRejectedValueOnce(http(500));
    await act(async () => { r = await result.current.savePush("N2a:default", { title: "T", body: "" }, null); });
    expect(r.ok).toBe(false); expect(r.conflict).toBeUndefined();
    expect(r.error).toMatch(/bevaret/);
  });
  it("før funktionen er udgivet (404) skrives direkte, med versionstjek", async () => {
    const { result } = await mount();
    apiCall.mockRejectedValueOnce(http(404)).mockResolvedValueOnce([]).mockResolvedValueOnce(null);
    let r;
    await act(async () => { r = await result.current.savePush("N2a:default", { title: "T", body: "B" }, null); });
    expect(r.ok).toBe(true);
    expect(apiCall.mock.calls[2][0]).toContain("notification_push_overrides?on_conflict=key");
    apiCall.mockReset();
    apiCall.mockRejectedValueOnce(http(404)).mockResolvedValueOnce([{ updated_at: "2026-10-16T09:00:00Z" }]);
    await act(async () => { r = await result.current.savePush("N2a:default", { title: "Ny", body: "" }, "2026-10-15T08:00:00Z"); });
    expect(r.conflict).toBe(true);
    expect(apiCall).toHaveBeenCalledTimes(2); // intet skrevet
  });
  it("tom tekst gendanner standard (sletter)", async () => {
    const { result } = await mount();
    apiCall.mockResolvedValueOnce(null);
    let r;
    await act(async () => { r = await result.current.savePush("N2a:default", { title: "", body: "" }, "2026-10-15T08:00:00Z"); });
    expect(r).toEqual({ ok: true, updated_at: null });
  });
});

describe("sendTest", () => {
  it("sender ikke-gemt tekst med, og returnerer serverens svar", async () => {
    const { result } = await mount();
    const f = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ push: { devices: 1, sent: 1, failed: 0 }, usedDraft: true }) }));
    vi.stubGlobal("fetch", f);
    let r;
    await act(async () => { r = await result.current.sendTest("N2a:default", "a1", ["push"], { title: "T", body: "B" }); });
    expect(r.ok).toBe(true);
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ key: "N2a:default", userId: "a1", channels: ["push"], pushOverride: { title: "T", body: "B" } });
  });
  it("403, serverfejl og netværksfejl er fejl, aldrig succes", async () => {
    const { result } = await mount();
    let r;
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 403, json: async () => ({}) })));
    await act(async () => { r = await result.current.sendTest("k", "a1", ["push"]); });
    expect(r).toMatchObject({ ok: false, error: expect.stringMatching(/adgang/) });
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, json: async () => ({ error: "RESEND_API_KEY mangler" }) })));
    await act(async () => { r = await result.current.sendTest("k", "a1", ["mail"]); });
    expect(r.error).toBe("RESEND_API_KEY mangler");
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    await act(async () => { r = await result.current.sendTest("k", "a1", ["mail"]); });
    expect(r.ok).toBe(false);
  });
});
