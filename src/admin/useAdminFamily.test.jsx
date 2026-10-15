// @ts-nocheck
// @vitest-environment jsdom
// Familiehooken: henter gennem serverfunktioner, skelner mellem ingen adgang, ikke udgivet og fejl, og lader den gamle liste stå ved en mislykket handling.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("../helpers.js", () => ({ apiCall: vi.fn(), makeHeaders: () => ({ Authorization: "Bearer t" }) }));
import { apiCall } from "../helpers.js";
import { useAdminFamily, familyErrorText } from "./useAdminFamily.js";

beforeEach(() => { apiCall.mockReset(); });
const http = (status, body) => Object.assign(new Error("x"), { status, body: JSON.stringify(body || {}) });

describe("load", () => {
  it("henter oversigt og invitationer", async () => {
    apiCall.mockImplementation(async (url) => {  return url.includes("admin_family_overview") ? { total: 1, rows: [{ owner_id: "o1" }] } : [{ id: "i1", status: "pending" }]; });
    const { result } = renderHook(() => useAdminFamily("t"));
    await act(async () => { await result.current.load({ q: "ab" }); });
    expect(result.current.rows).toHaveLength(1);
    expect(result.current.total).toBe(1);
    expect(result.current.invites[0].id).toBe("i1");
    expect(JSON.parse(apiCall.mock.calls[0][1].body).p_q).toBe("ab");
  });
  it("404 er 'ikke udgivet', 403 er 'ingen adgang', og en fejl er aldrig en tom liste", async () => {
    const { result } = renderHook(() => useAdminFamily("t"));
    apiCall.mockRejectedValue(http(404));
    await act(async () => { await result.current.load({ q: "" }); });
    expect(result.current.error).toEqual({ denied: false, unavailable: true });
    apiCall.mockRejectedValue(http(403));
    await act(async () => { await result.current.load({ q: "" }); });
    expect(result.current.error.denied).toBe(true);
    expect(result.current.loaded).toBe(false);
  });
});

describe("handlinger", () => {
  it("tilbagekaldelse sender begrundelse og markerer invitationen", async () => {
    apiCall.mockImplementation(async (url) => (url.includes("admin_family_overview") ? { total: 0, rows: [] } : url.includes("admin_list") ? [{ id: "i1", status: "pending" }] : null));
    const { result } = renderHook(() => useAdminFamily("t"));
    await act(async () => { await result.current.load({ q: "" }); });
    let r;
    await act(async () => { r = await result.current.revokeInvite("i1", "Bad om det"); });
    expect(r.ok).toBe(true);
    expect(result.current.invites[0].status).toBe("revoked");
    expect(JSON.parse(apiCall.mock.calls.at(-1)[1].body)).toEqual({ p_id: "i1", p_reason: "Bad om det" });
  });
  it("en mislykket tilbagekaldelse lader listen stå og giver dansk tekst", async () => {
    apiCall.mockResolvedValueOnce({ total: 0, rows: [] }).mockResolvedValueOnce([{ id: "i1", status: "pending" }]);
    const { result } = renderHook(() => useAdminFamily("t"));
    await act(async () => { await result.current.load({ q: "" }); });
    apiCall.mockRejectedValueOnce(http(400, { code: "22023", message: "Forespørgsler om forbindelse kan ikke tilbagekaldes af administratorer" }));
    let r;
    await act(async () => { r = await result.current.revokeInvite("i1", "Test"); });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Forespørgsler/);
    expect(result.current.invites[0].status).toBe("pending");
  });
  it("fjern medlem sender begrundelse; fejltekster er danske", async () => {
    apiCall.mockResolvedValueOnce(null);
    const { result } = renderHook(() => useAdminFamily("t"));
    let r;
    await act(async () => { r = await result.current.removeMember("m1", "Fejl"); });
    expect(r.ok).toBe(true);
    expect(JSON.parse(apiCall.mock.calls[0][1].body)).toEqual({ p_id: "m1", p_reason: "Fejl" });
    expect(familyErrorText(http(500), "Medlemmet kunne ikke fjernes.")).toBe("Medlemmet kunne ikke fjernes.");
    expect(familyErrorText(http(400, { code: "22023", message: "Begrundelse mangler" }), "x")).toMatch(/begrundelse/i);
  });
});
