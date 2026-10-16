// @vitest-environment jsdom
// @ts-nocheck
// Brugeren får besked, når billedlæsningen ikke fik navn eller allergentjek med (Jan, 16. okt. 2026).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const apiCall = vi.fn();
vi.mock("./helpers.js", async (orig) => ({
  ...(await orig()),
  apiCall: (...a) => apiCall(...a),
  compressImageToBase64: async () => "aGVq",
}));
const { useProduct } = await import("./useProduct.js");

const fileEvent = () => ({ target: { files: [new Blob(["x"], { type: "image/jpeg" })] } });
const hook = () => renderHook(() => useProduct({ accessToken: "t", userId: "u", activeProfiles: ["me"], notFoundEan: "123", setNotFoundEan: vi.fn(), setScreen: vi.fn() }));

beforeEach(() => {
  apiCall.mockReset();
  globalThis.URL.createObjectURL = () => "blob:x";
  globalThis.URL.revokeObjectURL = () => {};
});

describe("indsendelse: besked, når noget ikke blev registreret", () => {
  it("produktnavnet kunne ikke læses (forklaring fra AI'en): navnet sættes ikke, og nameUnread er sand", async () => {
    apiCall.mockResolvedValueOnce({ success: true, text: "Jeg kan desværre ikke se produktnavnet på billedet." });
    const { result } = hook();
    await act(() => result.current.handleProductImageCapture(fileEvent()));
    expect(result.current.proposedName).toBe("");
    expect(result.current.captureIssues.nameUnread).toBe(true);
    expect(result.current.notFoundStep).toBe(2);
  });

  it("produktnavnet blev læst: nameUnread er falsk", async () => {
    apiCall.mockResolvedValueOnce({ success: true, text: "BRAND: Mark\nNAME: Havregryn" });
    const { result } = hook();
    await act(() => result.current.handleProductImageCapture(fileEvent()));
    expect(result.current.proposedName).toBe("Mark Havregryn");
    expect(result.current.captureIssues.nameUnread).toBe(false);
  });

  it("ingredienser læst, men allergentjekket fejler: ingen stille 'nej', allergenCheckFailed er sand", async () => {
    apiCall
      .mockResolvedValueOnce({ success: true, text: "Havregryn, mælkepulver, salt" })
      .mockRejectedValueOnce(Object.assign(new Error("fejl"), { status: 500 }));
    const { result } = hook();
    await act(() => result.current.handleImageCapture(fileEvent()));
    expect(result.current.captureIssues.allergenCheckFailed).toBe(true);
    expect(result.current.proposedFlags).toEqual({});
    expect(result.current.ocrText).toBe("Havregryn, mælkepulver, salt");
    expect(result.current.scanError).toBe("");
    expect(result.current.notFoundStep).toBe(3);
  });

  it("allergentjekket lykkes: allergenCheckFailed er falsk", async () => {
    apiCall
      .mockResolvedValueOnce({ success: true, text: "Havregryn, mælkepulver" })
      .mockResolvedValueOnce({ success: true, allergen_flags: { maelkeallergi: "yes" } });
    const { result } = hook();
    await act(() => result.current.handleImageCapture(fileEvent()));
    expect(result.current.captureIssues.allergenCheckFailed).toBe(false);
    expect(result.current.proposedFlags).toEqual({ maelkeallergi: "yes" });
  });
});
