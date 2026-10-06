// @ts-nocheck
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const apiCall = vi.fn();
vi.mock("./helpers.js", () => ({ apiCall: (...a) => apiCall(...a), makeHeaders: () => ({}) }));
import { useHistory } from "./useHistory.js";

beforeEach(() => apiCall.mockReset());

describe("useHistory: clearHistory", () => {
  it("kalder kun history-DELETE for brugeren og tømmer listen; favoritter røres ikke", async () => {
    apiCall.mockResolvedValueOnce({ success: true, scans: [{ id: "1", user_id: "u1" }] }); // loadHistory
    apiCall.mockResolvedValueOnce({ success: true, message: "Historik slettet" });         // DELETE
    const { result } = renderHook(() => useHistory({ accessToken: "t", userId: "u1" }));
    await act(async () => { await result.current.loadHistory("own"); });
    expect(result.current.history).toHaveLength(1);
    let ok;
    await act(async () => { ok = await result.current.clearHistory(); });
    expect(ok).toBe(true);
    expect(result.current.history).toEqual([]);
    const [url, opts] = apiCall.mock.calls[1];
    expect(url).toContain("/functions/v1/history?user_id=u1");
    expect(url).not.toContain("favorites");
    expect(opts.method).toBe("DELETE");
    expect(apiCall).toHaveBeenCalledTimes(2);
  });
  it("ved fejl returneres false og historikken beholdes", async () => {
    apiCall.mockResolvedValueOnce({ success: true, scans: [{ id: "1", user_id: "u1" }] });
    apiCall.mockRejectedValueOnce(new Error("netværk"));
    const { result } = renderHook(() => useHistory({ accessToken: "t", userId: "u1" }));
    await act(async () => { await result.current.loadHistory("own"); });
    let ok;
    await act(async () => { ok = await result.current.clearHistory(); });
    expect(ok).toBe(false);
    expect(result.current.history).toHaveLength(1);
  });
});
