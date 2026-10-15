// @ts-nocheck
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("../helpers.js", () => ({ apiCall: vi.fn(), makeHeaders: () => ({ Authorization: "Bearer t" }) }));
import { apiCall } from "../helpers.js";
import { useOnboardingFunnel } from "./useOnboardingFunnel.js";

beforeEach(() => apiCall.mockReset());

describe("useOnboardingFunnel", () => {
  it("sender perioden og testkonto-valget, og et opdateringskald bruger de gemte parametre", async () => {
    apiCall.mockResolvedValue({ total: 3 });
    const { result } = renderHook(() => useOnboardingFunnel("t"));
    await act(async () => { await result.current.load({ from: "2026-10-01", to: "2026-10-15", includeTest: true }); });
    expect(JSON.parse(apiCall.mock.calls[0][1].body)).toEqual({ p_from: "2026-10-01", p_to: "2026-10-15", p_include_test: true });
    expect(result.current.data).toEqual({ total: 3 });
    await act(async () => { await result.current.load(); });
    expect(apiCall).toHaveBeenCalledTimes(2);
    expect(JSON.parse(apiCall.mock.calls[1][1].body).p_from).toBe("2026-10-01");
  });
  it("uden parametre hentes intet", async () => {
    const { result } = renderHook(() => useOnboardingFunnel("t"));
    await act(async () => { await result.current.load(); });
    expect(apiCall).not.toHaveBeenCalled();
  });
  it("fejl er egne tilstande: 403 ingen adgang, 404 ikke aktiveret, øvrige hentefejl; data bevares ikke som tomt svar", async () => {
    const { result } = renderHook(() => useOnboardingFunnel("t"));
    for (const [status, expected] of [[403, { denied: true, unavailable: false }], [404, { denied: false, unavailable: true }], [500, { denied: false, unavailable: false }]]) {
      apiCall.mockRejectedValueOnce(Object.assign(new Error("x"), { status }));
      await act(async () => { await result.current.load({ from: "2026-10-01", to: "2026-10-15" }); });
      expect(result.current.error).toEqual(expected);
      expect(result.current.loaded).toBe(false);
    }
  });
});
