// @vitest-environment jsdom
// @ts-nocheck
// F1-1: opslaget sker kun for gyldige stregkoder, og en fejl blokerer ikke resultatet.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";

vi.mock("./errorReporter.js", () => ({ reportError: vi.fn() }));
import { reportError } from "./errorReporter.js";
import { useRecalls } from "./useRecalls.js";

const ok = (body) => ({ ok: true, status: 200, text: async () => JSON.stringify(body) });

beforeEach(() => { global.fetch = vi.fn(); });
afterEach(() => cleanup());

describe("useRecalls", () => {
  it("returnerer tilbagekaldelser for et EAN", async () => {
    global.fetch.mockResolvedValueOnce(ok([{ title: "T" }]));
    const { result } = renderHook(() => useRecalls("5701234567890", "tok"));
    await waitFor(() => expect(result.current).toEqual([{ title: "T" }]));
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain("/rest/v1/rpc/active_recalls_for_ean");
    expect(JSON.parse(opts.body)).toEqual({ p_ean: "5701234567890" });
  });

  it("slår ikke op uden gyldig stregkode", () => {
    renderHook(() => useRecalls("abc", "tok"));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("logger en fejl og returnerer en tom liste", async () => {
    global.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const { result } = renderHook(() => useRecalls("5701234567890", "tok"));
    await waitFor(() => expect(reportError).toHaveBeenCalled());
    expect(result.current).toEqual([]);
  });
});
