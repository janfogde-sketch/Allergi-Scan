// @vitest-environment jsdom
// @ts-nocheck
// To do 0255840a: listen over seneste tilbagekaldelser (også uden stregkode); en fejl logges og vises som fejl.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";

vi.mock("./errorReporter.js", () => ({ reportError: vi.fn() }));
import { reportError } from "./errorReporter.js";
import { useRecentRecalls } from "./useRecentRecalls.js";

const ok = (body) => ({ ok: true, status: 200, text: async () => JSON.stringify(body) });

beforeEach(() => { global.fetch = vi.fn(); });
afterEach(() => cleanup());

describe("useRecentRecalls", () => {
  it("henter listen via recent_recalls", async () => {
    global.fetch.mockResolvedValueOnce(ok([{ title: "T", source_url: "https://x" }]));
    const { result } = renderHook(() => useRecentRecalls("tok"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([{ title: "T", source_url: "https://x" }]);
    expect(result.current.error).toBe(false);
    expect(global.fetch.mock.calls[0][0]).toContain("/rest/v1/rpc/recent_recalls");
  });

  it("giver tom liste ved tomt svar", async () => {
    global.fetch.mockResolvedValueOnce(ok([]));
    const { result } = renderHook(() => useRecentRecalls("tok"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([]);
  });

  it("logger en fejl og markerer error", async () => {
    global.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const { result } = renderHook(() => useRecentRecalls("tok"));
    await waitFor(() => expect(result.current.error).toBe(true));
    expect(reportError).toHaveBeenCalled();
    expect(result.current.items).toEqual([]);
  });
});
