// @ts-nocheck
// @vitest-environment jsdom
// Familiehooken: serverfunktioner som primær kilde, læsning fra tabellerne når funktionerne mangler (404), uafhængige sektioner og handlinger, der aldrig melder succes ved fejl.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("../helpers.js", () => ({ apiCall: vi.fn(), makeHeaders: () => ({ Authorization: "Bearer t" }) }));
import { apiCall } from "../helpers.js";
import { useAdminFamily, familyErrorText } from "./useAdminFamily.js";

beforeEach(() => { apiCall.mockReset(); });
const http = (status, body) => Object.assign(new Error("x"), { status, body: JSON.stringify(body || {}) });
const route = (map) => apiCall.mockImplementation(async (url) => {
  for (const [k, v] of Object.entries(map)) if (url.includes(k)) { if (v instanceof Error) throw v; return typeof v === "function" ? v(url) : v; }
  throw http(500);
});

describe("load med databasefunktioner", () => {
  it("henter oversigt og invitationer og sender søgningen til serveren", async () => {
    route({ admin_family_overview: { total: 1, rows: [{ owner_id: "o1" }] }, admin_list_family_invites: [{ id: "i1", status: "pending" }] });
    const { result } = renderHook(() => useAdminFamily("t"));
    await act(async () => { await result.current.load({ q: "ab" }); });
    expect(result.current).toMatchObject({ mode: "rpc", canAct: true, famPhase: "ok", invPhase: "ok", total: 1 });
    expect(JSON.parse(apiCall.mock.calls[0][1].body).p_q).toBe("ab");
  });
  it("en fejl i invitationerne skjuler ikke familierne (og omvendt), og fejlen er aldrig en tom liste", async () => {
    route({ admin_family_overview: { total: 1, rows: [{ owner_id: "o1" }] }, admin_list_family_invites: http(500) });
    const { result } = renderHook(() => useAdminFamily("t"));
    await act(async () => { await result.current.load({ q: "" }); });
    expect(result.current.famPhase).toBe("ok");
    expect(result.current.invPhase).toBe("error");
    expect(result.current.invError).toEqual({ denied: false, unavailable: false });
    expect(result.current.invites).toEqual([]);
  });
  it("403 er ingen adgang", async () => {
    route({ admin_family_overview: http(403), admin_list_family_invites: http(403) });
    const { result } = renderHook(() => useAdminFamily("t"));
    await act(async () => { await result.current.load({ q: "" }); });
    expect(result.current.famError.denied).toBe(true);
    expect(result.current.famPhase).toBe("error");
  });
});

describe("load uden databasefunktioner (404)", () => {
  const tables = () => route({
    admin_family_overview: http(404), admin_list_family_invites: http(404),
    "family_members?": [{ id: "m1", name: "Anna", user_id: "u1", family_owner_id: null, created_at: "2026-10-08T10:00:00Z" }],
    "family_invites?": [{ id: "i1", status: "pending", created_at: "2026-10-03T10:00:00Z", expires_at: "2026-10-04T10:00:00Z", invited_by: "u1", accepted_by: null }],
    "users?": [{ id: "u1", name: "Anna", email: "a@x.dk" }],
  });
  it("læser tabellerne, afleder status og ejer, og slår handlinger fra", async () => {
    tables();
    const { result } = renderHook(() => useAdminFamily("t"));
    await act(async () => { await result.current.load({ q: "" }); });
    expect(result.current).toMatchObject({ mode: "legacy", canAct: false, famPhase: "ok", invPhase: "ok", total: 1 });
    expect(result.current.rows[0]).toMatchObject({ owner_id: "u1", name: "Anna" });
    expect(result.current.invites[0].status).toBe("expired");
    const d = await result.current.getFamily("u1");
    expect(d.ok).toBe(true);
    expect(d.data.members).toHaveLength(1);
    // ingen skrivende kald er foretaget
    expect(apiCall.mock.calls.filter(([u]) => u.includes("/rest/v1/family_")).every(([, o]) => !o?.method)).toBe(true);
  });
  it("søgning filtrerer hele datasættet", async () => {
    tables();
    const { result } = renderHook(() => useAdminFamily("t"));
    await act(async () => { await result.current.load({ q: "findes-ikke" }); });
    expect(result.current.rows).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.famPhase).toBe("ok");
  });
  it("læsefejl i tabellerne er en fejl, ikke nul", async () => {
    route({ admin_family_overview: http(404), admin_list_family_invites: http(404), "family_members?": http(500), "family_invites?": http(500) });
    const { result } = renderHook(() => useAdminFamily("t"));
    await act(async () => { await result.current.load({ q: "" }); });
    expect(result.current.famPhase).toBe("error");
    expect(result.current.invPhase).toBe("error");
  });
});

describe("handlinger", () => {
  it("tilbagekaldelse sender begrundelse og markerer invitationen; fejl lader listen stå", async () => {
    route({ admin_family_overview: { total: 0, rows: [] }, admin_list_family_invites: [{ id: "i1", status: "pending" }], admin_revoke_family_invite: null });
    const { result } = renderHook(() => useAdminFamily("t"));
    await act(async () => { await result.current.load({ q: "" }); });
    let r;
    await act(async () => { r = await result.current.revokeInvite("i1", "Bad om det"); });
    expect(r.ok).toBe(true);
    expect(result.current.invites[0].status).toBe("revoked");
    route({ admin_revoke_family_invite: http(400, { code: "22023", message: "Forespørgsler om forbindelse kan ikke tilbagekaldes af administratorer" }) });
    await act(async () => { r = await result.current.revokeInvite("i2", "Test"); });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Forespørgsler/);
  });
  it("fjern medlem sender begrundelse; fejltekster er danske", async () => {
    route({ admin_remove_family_member: null });
    const { result } = renderHook(() => useAdminFamily("t"));
    let r;
    await act(async () => { r = await result.current.removeMember("m1", "Fejl"); });
    expect(r.ok).toBe(true);
    expect(JSON.parse(apiCall.mock.calls[0][1].body)).toEqual({ p_id: "m1", p_reason: "Fejl" });
    expect(familyErrorText(http(500), "Medlemmet kunne ikke fjernes.")).toBe("Medlemmet kunne ikke fjernes.");
  });
});
