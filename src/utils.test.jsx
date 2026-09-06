// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// utils.test.jsx
// getGreeting is time-of-day based (real clock), and buildScreenLabel builds
// the exact text sent to support in feedback tickets — both are easy to get
// subtly wrong (off-by-one hour boundary, wrong screen falling through to
// "undefined") without a test noticing.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getGreeting, buildScreenLabel } from "./utils.jsx";
import { SCREENS } from "./constants.jsx";

describe("getGreeting", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const at = (hour) => vi.setSystemTime(new Date(2026, 0, 1, hour, 0, 0));

  it("greets 'God nat' late at night and early morning", () => {
    at(0);
    expect(getGreeting()).toBe("God nat");
    at(23);
    expect(getGreeting()).toBe("God nat");
  });

  it("greets 'God morgen' in the morning", () => {
    at(7);
    expect(getGreeting()).toBe("God morgen");
  });

  it("greets 'God dag' in the afternoon", () => {
    at(14);
    expect(getGreeting()).toBe("God dag");
  });

  it("greets 'God aften' in the evening", () => {
    at(20);
    expect(getGreeting()).toBe("God aften");
  });
});

describe("buildScreenLabel", () => {
  it("labels the home screen plainly", () => {
    expect(buildScreenLabel({ screen: SCREENS.HOME })).toBe("Hjemskærm");
  });

  it("includes the product name and EAN on the result screen", () => {
    const label = buildScreenLabel({
      screen: SCREENS.RESULT,
      scanResult: { name: "Arla Letmælk", ean: "5710085008001" },
    });
    expect(label).toContain("Arla Letmælk");
    expect(label).toContain("5710085008001");
  });

  it("falls back to a generic label when no product is loaded yet", () => {
    expect(buildScreenLabel({ screen: SCREENS.RESULT })).toBe("Produktresultat");
  });

  it("appends context flags (e.g. an open profile popup) after the base label", () => {
    const label = buildScreenLabel({ screen: SCREENS.HOME, profilePopup: "user" });
    expect(label).toBe("Hjemskærm · Profil-popup: user");
  });

  it("falls back to the raw screen id for an unrecognized screen", () => {
    expect(buildScreenLabel({ screen: "not-a-real-screen" })).toBe("not-a-real-screen");
  });
});
