// @vitest-environment jsdom
// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useNotificationPrefs.test.js
// Låser den centrale kontrakt fast: manglende rækker fra serveren betyder
// "slået til" (default-true), en eksplicit false-række overstyrer default,
// og en fejlet gem-handling ruller den optimistiske ændring tilbage.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useNotificationPrefs, NOTIFICATION_CATEGORIES } from "./useNotificationPrefs.js";
import { showToast } from "./SharedComponents.jsx";

vi.mock("./SharedComponents.jsx", () => ({ showToast: vi.fn() }));

function jsonResponse(body, ok = true) {
  return { ok, status: ok ? 200 : 400, text: async () => JSON.stringify(body) };
}

beforeEach(() => {
  global.fetch = vi.fn();
  showToast.mockClear();
});

describe("useNotificationPrefs", () => {
  it("bruger kategoriens standard, når serveren ikke har nogen rækker (til, undtagen delte lister og oprettelsespåmindelse)", async () => {
    global.fetch.mockResolvedValue(jsonResponse([]));
    const { result } = renderHook(() => useNotificationPrefs({ accessToken: "t", userId: "u1" }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    const OFF_BY_DEFAULT = ["shared_lists", "onboarding_reminder"]; // skal matche notification_enabled() i databasen
    for (const cat of NOTIFICATION_CATEGORIES) {
      const expected = !OFF_BY_DEFAULT.includes(cat.id);
      expect(result.current.prefs[`${cat.id}:push`], cat.id).toBe(expected);
      expect(result.current.prefs[`${cat.id}:email`], cat.id).toBe(expected);
    }
  });

  it("viser kun kategorier, hvor der faktisk sendes noget", async () => {
    global.fetch.mockResolvedValue(jsonResponse([]));
    const { result } = renderHook(() => useNotificationPrefs({ accessToken: "t", userId: "u1" }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const ids = result.current.categories.map(c => c.id);
    expect(ids).toContain("shared_lists");
    expect(ids).not.toContain("recalls");
    expect(ids).toContain("product_changes");
    expect(ids).not.toContain("onboarding_reminder");
  });

  it("overstyrer default med eksplicitte rækker fra serveren", async () => {
    global.fetch.mockResolvedValue(jsonResponse([
      { category: "weekly_digest", channel: "push", enabled: false },
    ]));
    const { result } = renderHook(() => useNotificationPrefs({ accessToken: "t", userId: "u1" }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.prefs["weekly_digest:push"]).toBe(false);
    expect(result.current.prefs["weekly_digest:email"]).toBe(true);
    expect(result.current.prefs["family:push"]).toBe(true);
  });

  it("opdaterer optimistisk og beholder værdien når gem lykkes", async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse([]));
    const { result } = renderHook(() => useNotificationPrefs({ accessToken: "t", userId: "u1" }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    global.fetch.mockResolvedValueOnce(jsonResponse({}));
    await act(async () => { await result.current.setPref("feedback", "email", false); });

    expect(result.current.prefs["feedback:email"]).toBe(false);
    const [, options] = global.fetch.mock.calls.at(-1);
    expect(JSON.parse(options.body)).toEqual({ user_id: "u1", category: "feedback", channel: "email", enabled: false });
  });

  it("ruller den optimistiske ændring tilbage hvis gem fejler", async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse([]));
    const { result } = renderHook(() => useNotificationPrefs({ accessToken: "t", userId: "u1" }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    global.fetch.mockResolvedValueOnce(jsonResponse({ message: "fejl" }, false));
    await act(async () => { await result.current.setPref("family", "push", false); });

    expect(result.current.prefs["family:push"]).toBe(true);
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining("kunne ikke gemmes"), "error");
  });
});
