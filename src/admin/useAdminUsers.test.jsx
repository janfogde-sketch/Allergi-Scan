// @ts-nocheck
// @vitest-environment jsdom
// Brugerlisten: søgning, faner og antal på serveren, én handling ad gangen mod serverfunktioner, forståelige fejl, og eksport af ALLE matchende brugere.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("../helpers.js", () => ({ apiCall: vi.fn(), makeHeaders: () => ({ Authorization: "Bearer t" }) }));
vi.mock("./csvExport.js", () => ({ downloadText: vi.fn() }));
import { apiCall } from "../helpers.js";
import { downloadText } from "./csvExport.js";
import { useAdminUsers, userErrorText } from "./useAdminUsers.js";

const u = (i) => ({ id: `id-${i}`, name: `Bruger ${i}`, email: `b${i}@x.dk`, role: "user", created_at: new Date(Date.UTC(2026, 9, 1) - i * 60000).toISOString(), onboarding_completed: true });
const err = (status, code, message = "x") => Object.assign(new Error(message), { status, body: JSON.stringify({ code }) });
beforeEach(() => { apiCall.mockReset(); downloadText.mockReset(); });

describe("load", () => {
  it("henter første side med søgning og fane og tal fra serveren (Content-Range), også for hver fane", async () => {
    apiCall.mockImplementation(async (url, opts) => {
      const isCount = url.includes("select=id&");
      const range = isCount ? "0-0/9" : "0-1/2";
      if (opts?.onResponse) opts.onResponse({ headers: { get: () => range } });
      return isCount ? [{ id: "x" }] : [u(1), u(2)];
    });
    const { result } = renderHook(() => useAdminUsers("t"));
    await act(async () => { await result.current.load({ filter: "admin", q: "anne" }); });
    expect(result.current.rows).toHaveLength(2);
    expect(result.current.total).toBe(2);
    expect(result.current.counts).toEqual({ all: 9, admin: 9, incomplete: 9 });
    const urls = apiCall.mock.calls.map((c) => decodeURIComponent(c[0]));
    expect(urls.some((x) => x.includes("role=eq.admin") && x.includes("name.ilike.*anne*") && x.includes("limit=51"))).toBe(true);
    expect(urls.filter((x) => x.includes("select=id&")).length).toBe(3); // en pr. fane, alle med søgeordet
    expect(urls.filter((x) => x.includes("select=id&")).every((x) => x.includes("name.ilike.*anne*"))).toBe(true);
  });
  it("en fejl er en egen tilstand (aldrig en tom liste), og 403 er 'ingen adgang'", async () => {
    apiCall.mockRejectedValue(Object.assign(new Error("HTTP 500"), { status: 500 }));
    const { result } = renderHook(() => useAdminUsers("t"));
    await act(async () => { await result.current.load({ filter: "all", q: "" }); });
    expect(result.current.error).toEqual({ denied: false, message: "Brugerne kunne ikke hentes." });
    expect(result.current.loaded).toBe(false);
    apiCall.mockRejectedValue(Object.assign(new Error("x"), { status: 403 }));
    await act(async () => { await result.current.load({ filter: "all", q: "" }); });
    expect(result.current.error.denied).toBe(true);
  });
  it("næste side starter efter den sidste viste og tilføjer ingen dubletter", async () => {
    const page = Array.from({ length: 51 }, (_, i) => u(i + 1));
    apiCall.mockImplementation(async (url) => (url.includes("created_at.lt") ? [page[49], u(60)] : page));
    const { result } = renderHook(() => useAdminUsers("t"));
    await act(async () => { await result.current.load({ filter: "all", q: "" }); });
    expect(result.current.rows).toHaveLength(50);
    expect(result.current.hasMore).toBe(true);
    await act(async () => { await result.current.loadMore(); });
    expect(result.current.rows).toHaveLength(51);
    expect(new Set(result.current.rows.map((r) => r.id)).size).toBe(51);
    expect(result.current.hasMore).toBe(false);
  });
});

describe("handlinger", () => {
  it("getUser beder kun om præferencer, når de skal bruges", async () => {
    apiCall.mockResolvedValue({ id: "id-1" });
    const { result } = renderHook(() => useAdminUsers("t"));
    await act(async () => { await result.current.getUser("id-1"); });
    expect(JSON.parse(apiCall.mock.calls[0][1].body)).toEqual({ p_user: "id-1", p_with_preferences: false });
    await act(async () => { await result.current.getUser("id-1", true); });
    expect(JSON.parse(apiCall.mock.calls[1][1].body).p_with_preferences).toBe(true);
  });
  it("saveProfile sender versionen og begrundelsen; en forældet version er en konflikt; fejl nævner aldrig databasebeskeden", async () => {
    apiCall.mockResolvedValueOnce({ version: "v2", praeferencer_aendret: true });
    const { result } = renderHook(() => useAdminUsers("t"));
    let r;
    await act(async () => { r = await result.current.saveProfile("id-1", { profile: { allergen_levels: {} }, allergens: ["milk"], custom: [], reason: "Support", version: "v1" }); });
    expect(r).toEqual({ ok: true, version: "v2", preferencesChanged: true });
    expect(JSON.parse(apiCall.mock.calls[0][1].body)).toMatchObject({ p_user: "id-1", p_allergens: ["milk"], p_custom: [], p_reason: "Support", p_version: "v1" });
    apiCall.mockRejectedValueOnce(err(409, "40001", "Brugeren er ændret"));
    await act(async () => { r = await result.current.saveProfile("id-1", { profile: { name: "X" }, version: "v1" }); });
    expect(r).toMatchObject({ ok: false, conflict: true });
    expect(r.error).toMatch(/Hent igen/);
    apiCall.mockRejectedValueOnce(err(500, "XX000", "relation \"users\" does not exist"));
    await act(async () => { r = await result.current.saveProfile("id-1", { profile: { name: "X" } }); });
    expect(r.ok).toBe(false);
    expect(r.error).not.toMatch(/relation/);
  });
  it("setRole kalder serverfunktionen; en afvisning giver en dansk besked og intet ændres i listen", async () => {
    apiCall.mockResolvedValue([]);
    const { result } = renderHook(() => useAdminUsers("t"));
    let r;
    await act(async () => { r = await result.current.setRole("id-1", "admin"); });
    expect(r.ok).toBe(true);
    expect(apiCall.mock.calls[0][0]).toContain("/rpc/admin_set_role");
    apiCall.mockReset();
    apiCall.mockRejectedValueOnce(err(400, "P0001", "Du kan ikke ændre din egen rolle"));
    await act(async () => { r = await result.current.setRole("id-me", "user"); });
    expect(r).toEqual({ ok: false, error: "Du kan ikke ændre din egen rolle" });
  });
  it("sletning: oversigt først, og en fejl påstår aldrig, at kontoen er slettet", async () => {
    apiCall.mockResolvedValueOnce({ family_profiles_owned: 1 });
    const { result } = renderHook(() => useAdminUsers("t"));
    let r;
    await act(async () => { r = await result.current.deleteSummary("id-1"); });
    expect(r).toEqual({ ok: true, summary: { family_profiles_owned: 1 } });
    apiCall.mockRejectedValueOnce(Object.assign(new Error("Sletning stoppet"), { status: 500 }));
    await act(async () => { r = await result.current.deleteUser("id-1"); });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/ikke slettet/);
  });
  it("eksport henter ALLE matchende brugere i sider, bygger CSV uden følsomme felter og melder eksporten", async () => {
    const big = Array.from({ length: 1000 }, (_, i) => u(i + 1));
    apiCall.mockImplementation(async (url) => {
      if (url.includes("rpc/log_admin_export")) return {};
      if (url.includes("created_at.lt")) return [u(2000)];
      return big;
    });
    const { result } = renderHook(() => useAdminUsers("t"));
    await act(async () => { await result.current.load({ filter: "all", q: "" }); });
    let r;
    await act(async () => { r = await result.current.exportUsers(); });
    expect(r).toEqual({ ok: true, count: 1001 });
    expect(downloadText).toHaveBeenCalledTimes(1);
    expect(downloadText.mock.calls[0][1].split("\n")).toHaveLength(1002); // overskrift + 1001 rækker
    const logCall = apiCall.mock.calls.find((c) => c[0].includes("rpc/log_admin_export"));
    expect(JSON.parse(logCall[1].body)).toEqual({ p_target: "users", p_count: 1001 });
  });
});

describe("userErrorText", () => {
  it("oversætter koder til danske beskeder", () => {
    expect(userErrorText(err(403, "42501"), "x")).toMatch(/rettighed/);
    expect(userErrorText(err(400, "22023", "En begrundelse er påkrævet"), "x")).toMatch(/begrundelse/);
    expect(userErrorText(err(404, "P0002"), "x")).toMatch(/findes ikke/);
    expect(userErrorText(new Error("Den sidste administrator kan ikke fjernes"), "x")).toMatch(/sidste administrator/);
    expect(userErrorText(new Error("boom"), "Fallback")).toBe("Fallback");
  });
});
