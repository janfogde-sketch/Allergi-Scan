// @ts-nocheck
// @vitest-environment jsdom
// Aktivitetsloggen henter 50 ad gangen med nøgle-paginering, uden dubletter, og en fejl er aldrig en tom liste.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("../helpers.js", () => ({ apiCall: vi.fn(), makeHeaders: () => ({}) }));
import { apiCall } from "../helpers.js";
import { useAuditLog } from "./useAuditLog.js";

const row = (id) => ({ id, created_at: `2026-10-14T08:00:${String(60 - id).padStart(2, "0")}Z`, admin_id: null, action: "csv_eksport", target_table: "products", target_id: null, details: null });
const page = (from, n) => Array.from({ length: n }, (_, i) => row(from - i));

beforeEach(() => { apiCall.mockReset(); });

describe("useAuditLog", () => {
  it("henter 50 og ved der er flere; næste side starter efter den sidste række og tilføjer ingen dubletter", async () => {
    apiCall.mockImplementation(async (url) => {
      if (url.includes("admin_audit_log") && !url.includes("and=")) return page(100, 51); // 51 = der findes flere
      if (url.includes("admin_audit_log")) return [row(51), ...page(50, 3)]; // række 51 vises allerede
      return [];
    });
    const { result } = renderHook(() => useAuditLog("tok"));
    await act(async () => { await result.current.load({}); });
    expect(result.current.rows).toHaveLength(50);
    expect(result.current.hasMore).toBe(true);
    const first = apiCall.mock.calls.find((c) => c[0].includes("admin_audit_log"))[0];
    expect(first).toContain("limit=51");
    await act(async () => { await result.current.loadMore(); });
    const next = apiCall.mock.calls.filter((c) => c[0].includes("admin_audit_log")).pop()[0];
    expect(next).toContain("id.lt.51"); // sidste viste række er id 51
    const ids = result.current.rows.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(result.current.hasMore).toBe(false);
  });
  it("en fejl giver en fejltilstand, ikke en tom liste, og 403 er 'ingen adgang'", async () => {
    apiCall.mockRejectedValue(Object.assign(new Error("HTTP 500"), { status: 500 }));
    const { result } = renderHook(() => useAuditLog("tok"));
    await act(async () => { await result.current.load({}); });
    expect(result.current.error).toEqual({ denied: false, message: "HTTP 500" });
    expect(result.current.rows).toEqual([]);
    apiCall.mockRejectedValue(Object.assign(new Error("HTTP 403"), { status: 403 }));
    await act(async () => { await result.current.load({}); });
    expect(result.current.error.denied).toBe(true);
  });
  it("filtre, der udelukker alt, henter ikke noget", async () => {
    const { result } = renderHook(() => useAuditLog("tok"));
    await act(async () => { await result.current.load({ type: "exported", category: "Sikkerhed" }); });
    expect(apiCall).not.toHaveBeenCalled();
    expect(result.current.rows).toEqual([]);
    expect(result.current.loaded).toBe(true);
  });
  it("antallet kommer fra Content-Range (hele loggen), ikke fra de hentede rækker; opdateres ved nyt hent", async () => {
    let total = "0-50/137";
    apiCall.mockImplementation(async (url, opts) => {
      if (url.includes("admin_audit_log")) {
        expect(opts.headers.Prefer).toBe("count=exact");
        opts.onResponse({ headers: { get: () => total } });
        return page(100, 51);
      }
      return [];
    });
    const { result } = renderHook(() => useAuditLog("tok"));
    await act(async () => { await result.current.load({}); });
    expect(result.current.rows).toHaveLength(50);
    expect(result.current.total).toBe(137);
    total = "0-1/2";
    await act(async () => { await result.current.load({ q: "x" }); });
    expect(result.current.total).toBe(2);
  });
  it("mangler Content-Range, er antallet ukendt (ikke gættet)", async () => {
    apiCall.mockImplementation(async (url, opts) => { if (url.includes("admin_audit_log")) { opts.onResponse({ headers: { get: () => null } }); return page(100, 51); } return []; });
    const { result } = renderHook(() => useAuditLog("tok"));
    await act(async () => { await result.current.load({}); });
    expect(result.current.total).toBeNull();
  });
});
