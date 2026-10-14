// @ts-nocheck
// G6 (14. okt. 2026): apiCall fornyer et udløbet login én gang ved 401 og gentager kaldet; tidsgrænse ved hængende kald.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiCall, configureApiCall } from "./helpers.js";
import { SUPABASE_ANON_KEY } from "./constants.jsx";

const resp = (status, body = {}) => ({ ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) });

beforeEach(() => { vi.stubGlobal("fetch", vi.fn()); });
afterEach(() => { vi.unstubAllGlobals(); configureApiCall({ refreshToken: null, timeoutMs: 0 }); });

describe("apiCall ved 401", () => {
  it("fornyer login og gentager kaldet med den nye nøgle", async () => {
    const refresh = vi.fn(async () => "ny");
    configureApiCall({ refreshToken: refresh });
    fetch.mockResolvedValueOnce(resp(401, { message: "JWT expired" })).mockResolvedValueOnce(resp(200, { ok: 1 }));
    const data = await apiCall("https://x/rest/v1/users", { headers: { Authorization: "Bearer gammel", apikey: "a" } });
    expect(data).toEqual({ ok: 1 });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[1][1].headers.Authorization).toBe("Bearer ny");
  });
  it("prøver kun én gang og kaster fejlen videre", async () => {
    configureApiCall({ refreshToken: async () => "ny" });
    fetch.mockResolvedValue(resp(401, { message: "nej" }));
    await expect(apiCall("https://x", { headers: { Authorization: "Bearer gammel" } })).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("kan fornyelsen ikke lade sig gøre, kastes 401 uden gentagelse", async () => {
    configureApiCall({ refreshToken: async () => null });
    fetch.mockResolvedValue(resp(401));
    await expect(apiCall("https://x", { headers: { Authorization: "Bearer gammel" } })).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("forsøger ikke fornyelse for kald med den offentlige nøgle", async () => {
    const refresh = vi.fn(async () => "ny");
    configureApiCall({ refreshToken: refresh });
    fetch.mockResolvedValue(resp(401));
    await expect(apiCall("https://x", { headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` } })).rejects.toMatchObject({ status: 401 });
    expect(refresh).not.toHaveBeenCalled();
  });
  it("samtidige 401-svar deler én fornyelse", async () => {
    let release;
    const refresh = vi.fn(() => new Promise(r => { release = () => r("ny"); }));
    configureApiCall({ refreshToken: refresh });
    fetch.mockImplementation(async (_u, o) => (o.headers.Authorization === "Bearer ny" ? resp(200, { ok: 1 }) : resp(401)));
    const a = apiCall("https://x/a", { headers: { Authorization: "Bearer gammel" } });
    const b = apiCall("https://x/b", { headers: { Authorization: "Bearer gammel" } });
    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
    release();
    expect(await Promise.all([a, b])).toEqual([{ ok: 1 }, { ok: 1 }]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});

describe("apiCall tidsgrænse", () => {
  it("afbryder et hængende kald", async () => {
    configureApiCall({ timeoutMs: 20 });
    fetch.mockImplementation((_u, o) => new Promise((_res, rej) => o.signal.addEventListener("abort", () => rej(new Error("aborted")))));
    await expect(apiCall("https://x")).rejects.toMatchObject({ timeout: true });
  });
  it("uden tidsgrænse (admin) sendes intet signal med", async () => {
    fetch.mockResolvedValue(resp(200, {}));
    await apiCall("https://x", {});
    expect(fetch.mock.calls[0][1].signal).toBeUndefined();
  });
});
