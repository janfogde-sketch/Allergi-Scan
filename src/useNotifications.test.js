// @vitest-environment jsdom
// @ts-nocheck
// Push-link: id'et må ikke gå tabt, hvis siden genindlæses, mens beskeden åbnes
// (fx når en ny service worker overtager og index.html genindlæser én gang).
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNotifications } from "./useNotifications.js";
import { PENDING_KEY } from "./notificationsApi.js";

const ID = "11111111-2222-4333-8444-555555555555";
const base = { accessToken: "t", userId: "u1", user: { onboarding_completed: true }, screen: "home" };

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
});

describe("useNotifications — link fra push", () => {
  it("åbner beskeden, men beholder id'et, til skærmen har hentet beskeden", async () => {
    window.history.replaceState({}, "", `/?notification=${ID}`);
    const setScreen = vi.fn();
    const { result } = renderHook(() => useNotifications({ ...base, setScreen }));
    await act(async () => { await Promise.resolve(); });
    expect(result.current.openId).toBe(ID);
    expect(setScreen).toHaveBeenCalledWith("notification");
    expect(localStorage.getItem(PENDING_KEY)).toBe(ID); // en genindlæsning nu åbner den igen
    expect(window.location.search).toBe(""); // adressen er ryddet
  });

  it("åbner en ventende besked igen efter en genindlæsning (id'et lå stadig gemt)", async () => {
    localStorage.setItem(PENDING_KEY, ID);
    const setScreen = vi.fn();
    const { result } = renderHook(() => useNotifications({ ...base, setScreen }));
    await act(async () => { await Promise.resolve(); });
    expect(result.current.openId).toBe(ID);
  });
});
