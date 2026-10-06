// @vitest-environment jsdom
// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useLoadUserData.test.js
// Hotfix F2-1 (6. okt. 2026): fejler hentningen af profil, allergener eller
// familie, må status ikke blive "ok", for så ville ResultScreen vurdere mod en
// tom profil og vise et grønt resultat. Et nyt forsøg skal kunne hente igen.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useLoadUserData } from "./useLoadUserData.js";

function jsonResponse(body, ok = true) {
  return { ok, status: ok ? 200 : 500, text: async () => JSON.stringify(body) };
}

function setup({ familyOk = true } = {}) {
  const setters = {
    setUser: vi.fn(), setSelectedENumbers: vi.fn(), setAllergens: vi.fn(), setCustomAllerg: vi.fn(),
    loadFamily: vi.fn(async () => familyOk), loadShoppingList: vi.fn(), loadFavorites: vi.fn(),
  };
  const hook = renderHook(() => useLoadUserData({ accessToken: "tok", userId: "u1", ...setters }));
  return { ...hook, setters };
}

afterEach(() => cleanup());

beforeEach(() => {
  global.fetch = vi.fn();
});

describe("useLoadUserData profileLoadStatus", () => {
  it("bliver 'ok', når profil, allergener og familie er hentet", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse([{ name: "Anna" }]))
      .mockResolvedValueOnce(jsonResponse([{ allergen: "aeg", type: "allergen" }]));
    const { result, setters } = setup();
    await waitFor(() => expect(result.current.profileLoadStatus).toBe("ok"));
    expect(setters.setAllergens).toHaveBeenCalledWith(["aeg"]);
  });

  it("bliver 'error' og aldrig 'ok', når allergierne ikke kan hentes", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse([{ name: "Anna" }]))
      .mockResolvedValueOnce(jsonResponse({ message: "boom" }, false));
    const { result, setters } = setup();
    await waitFor(() => expect(result.current.profileLoadStatus).toBe("error"));
    expect(setters.setAllergens).not.toHaveBeenCalled();
  });

  it("bliver 'error', når familien ikke kan hentes", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse([{ name: "Anna" }]))
      .mockResolvedValueOnce(jsonResponse([]));
    const { result } = setup({ familyOk: false });
    await waitFor(() => expect(result.current.profileLoadStatus).toBe("error"));
  });

  it("henter igen ved 'Prøv igen' og bliver 'ok'", async () => {
    global.fetch
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(jsonResponse([{ name: "Anna" }]))
      .mockResolvedValueOnce(jsonResponse([]));
    const { result } = setup();
    await waitFor(() => expect(result.current.profileLoadStatus).toBe("error"));
    act(() => { result.current.retryProfileLoad(); });
    await waitFor(() => expect(result.current.profileLoadStatus).toBe("ok"));
  });

  it("henter igen af sig selv, når nettet kommer tilbage", async () => {
    global.fetch
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(jsonResponse([{ name: "Anna" }]))
      .mockResolvedValueOnce(jsonResponse([]));
    const { result } = setup();
    await waitFor(() => expect(result.current.profileLoadStatus).toBe("error"));
    act(() => { window.dispatchEvent(new Event("online")); });
    await waitFor(() => expect(result.current.profileLoadStatus).toBe("ok"));
  });

  it("er 'idle' uden login", () => {
    const { result } = renderHook(() => useLoadUserData({
      accessToken: null, userId: null, setUser: vi.fn(), setSelectedENumbers: vi.fn(), setAllergens: vi.fn(),
      setCustomAllerg: vi.fn(), loadFamily: vi.fn(), loadShoppingList: vi.fn(), loadFavorites: vi.fn(),
    }));
    expect(result.current.profileLoadStatus).toBe("idle");
  });
});
