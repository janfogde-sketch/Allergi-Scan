// @ts-nocheck
// @vitest-environment jsdom
// Fejlsiden: status og rettelse skrives med ét kald og bruger databasens svar; uden den nye migration afvises "løst" (beskrivelsen kan ikke gemmes),
// oversættelsen af stacktraces er aldrig opdigtet, og en fejl er aldrig en tom liste.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("../helpers.js", () => ({ apiCall: vi.fn(), makeHeaders: () => ({ Authorization: "Bearer t" }) }));
import { apiCall } from "../helpers.js";
import { useClientErrors } from "./useClientErrors.js";

const err400 = () => Object.assign(new Error("column does not exist"), { status: 400 });
beforeEach(() => apiCall.mockReset());

describe("setStatus", () => {
  it("løst sender beskrivelse og verificeret build og returnerer den opdaterede gruppe", async () => {
    apiCall.mockResolvedValue([{ id: "e1", status: "resolved", resolution_note: "Rettet", verified_build: "d81f4e2" }]);
    const { result } = renderHook(() => useClientErrors("t"));
    let r;
    await act(async () => { r = await result.current.setStatus("e1", "resolved", "", { note: "Rettet", build: "d81f4e2" }); });
    expect(r.ok).toBe(true);
    expect(r.row.resolution_note).toBe("Rettet");
    const [url, opts] = apiCall.mock.calls[0];
    expect(url).toContain("client_errors?id=eq.e1");
    expect(JSON.parse(opts.body)).toEqual({ status: "resolved", resolution_note: "Rettet", verified_build: "d81f4e2" });
  });
  it("uden build sendes verified_build som null", async () => {
    apiCall.mockResolvedValue([{ id: "e1", status: "resolved" }]);
    const { result } = renderHook(() => useClientErrors("t"));
    await act(async () => { await result.current.setStatus("e1", "resolved", "", { note: "Rettet" }); });
    expect(JSON.parse(apiCall.mock.calls[0][1].body).verified_build).toBeNull();
  });
  it("før migrationen er live afvises 'løst' med en klar besked, og intet ændres (beskrivelsen kan ikke gemmes)", async () => {
    apiCall.mockRejectedValueOnce(err400());
    const { result } = renderHook(() => useClientErrors("t"));
    let r;
    await act(async () => { r = await result.current.setStatus("e1", "resolved", "", { note: "Rettet" }); });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/ikke opdateret endnu/);
    expect(apiCall).toHaveBeenCalledTimes(1); // ingen fallback uden beskrivelse
  });
  it("ignorering falder tilbage uden begrundelse før migrationen, og siger det", async () => {
    apiCall.mockRejectedValueOnce(err400()).mockResolvedValueOnce([{ id: "e1", status: "ignored" }]);
    const { result } = renderHook(() => useClientErrors("t"));
    let r;
    await act(async () => { r = await result.current.setStatus("e1", "ignored", "Gammel"); });
    expect(r).toMatchObject({ ok: true, reasonDropped: true });
  });
  it("et mislykket kald og et tomt svar (ingen adgang) er fejl, aldrig succes", async () => {
    apiCall.mockRejectedValueOnce(Object.assign(new Error("HTTP 500"), { status: 500 }));
    const { result } = renderHook(() => useClientErrors("t"));
    let r;
    await act(async () => { r = await result.current.setStatus("e1", "open"); });
    expect(r).toMatchObject({ ok: false, error: "HTTP 500" });
    apiCall.mockResolvedValueOnce([]);
    await act(async () => { r = await result.current.setStatus("e1", "open"); });
    expect(r.ok).toBe(false);
  });
});

describe("symbolicate", () => {
  it("sender build og stack til edge-funktionen og returnerer kun det, den svarer", async () => {
    apiCall.mockResolvedValue({ frames: [{ resolved: true }, { resolved: false }], resolved: 1, total: 2 });
    const { result } = renderHook(() => useClientErrors("t"));
    let r;
    await act(async () => { r = await result.current.symbolicate("d81f4e2", "stack", "komp"); });
    expect(r).toMatchObject({ ok: true, resolved: 1, total: 2 });
    expect(apiCall.mock.calls[0][0]).toContain("/functions/v1/symbolicate-error");
    expect(JSON.parse(apiCall.mock.calls[0][1].body)).toEqual({ build: "d81f4e2", stack: "stack", componentStack: "komp" });
  });
  it("404 er 'ikke sat op', 403 er 'ingen adgang', alt andet er fejl", async () => {
    const { result } = renderHook(() => useClientErrors("t"));
    for (const [status, reason] of [[404, "unavailable"], [403, "denied"], [500, "error"]]) {
      apiCall.mockRejectedValueOnce(Object.assign(new Error("x"), { status }));
      let r;
      await act(async () => { r = await result.current.symbolicate("d81f4e2", "s"); });
      expect(r).toEqual({ ok: false, reason });
    }
    apiCall.mockResolvedValueOnce({ noget: 1 });
    let r;
    await act(async () => { r = await result.current.symbolicate("d81f4e2", "s"); });
    expect(r.ok).toBe(false);
  });
});
