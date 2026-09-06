// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// helpers.test.js
// Tests for the safety-critical pure logic in helpers.js: allergen matching,
// diet compatibility, and E-number matching. These functions decide whether
// EatSafe tells a user a product is safe to eat — a bug here is the highest-
// impact kind of bug the app can have.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import {
  compareAllergens,
  checkDietCompatibility,
  extractENumbers,
  compareENumbers,
  verifiedBadge,
} from "./helpers.js";

describe("compareAllergens", () => {
  it("is safe when the user has no active allergens", () => {
    const result = compareAllergens({ gluten: "yes" }, []);
    expect(result.status).toBe("safe");
  });

  it("is safe when none of the user's allergens are present", () => {
    const result = compareAllergens({ gluten: "no" }, ["gluten"]);
    expect(result.status).toBe("safe");
    expect(result.matchedDanger).toEqual([]);
  });

  it("flags danger when an active allergen is present (string 'yes', products)", () => {
    const result = compareAllergens({ gluten: "yes" }, ["gluten"]);
    expect(result.status).toBe("danger");
    expect(result.matchedDanger).toEqual(["gluten"]);
  });

  it("flags danger for boolean true (recipes use booleans, not strings)", () => {
    const result = compareAllergens({ gluten: true }, ["gluten"]);
    expect(result.status).toBe("danger");
    expect(result.matchedDanger).toEqual(["gluten"]);
  });

  it("flags warn (traces) when no danger allergen is present", () => {
    const result = compareAllergens({ noedder: "traces" }, ["noedder"]);
    expect(result.status).toBe("warn");
    expect(result.matchedWarning).toEqual(["noedder"]);
  });

  it("danger takes priority over warn when both are present", () => {
    const result = compareAllergens({ gluten: "yes", noedder: "traces" }, ["gluten", "noedder"]);
    expect(result.status).toBe("danger");
    expect(result.matchedDanger).toEqual(["gluten"]);
    expect(result.matchedWarning).toEqual(["noedder"]);
  });

  it("marks hasUnknown and lowers confidence when a flag is unknown/missing", () => {
    const result = compareAllergens({ gluten: "unknown" }, ["gluten"]);
    expect(result.hasUnknown).toBe(true);
    expect(result.confidence).toBe("medium");
  });

  it("has low confidence when there is no allergen data at all", () => {
    const result = compareAllergens({}, ["gluten"]);
    expect(result.confidence).toBe("low");
  });
});

describe("checkDietCompatibility", () => {
  it("vegan: fails on direct milk-protein allergen flag", () => {
    const result = checkDietCompatibility("vegan", { maelkeallergi: "yes" }, "", null);
    expect(result.ok).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/mælkeprotein/i);
  });

  it("vegan: fails on an animal-derived ingredient not covered by allergen flags", () => {
    const result = checkDietCompatibility("vegan", {}, "sukker, honning, salt", null);
    expect(result.ok).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/honning/i);
  });

  it("vegan: passes on a plant-only ingredient list", () => {
    const result = checkDietCompatibility("vegan", {}, "hvedemel, vand, salt, gær", null);
    expect(result.ok).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("gluten-free: fails when the gluten flag is set", () => {
    const result = checkDietCompatibility("gluten-free", { gluten: "yes" }, "", null);
    expect(result.ok).toBe(false);
  });

  it("gluten-free: passes when neither gluten nor hvede flags are set", () => {
    const result = checkDietCompatibility("gluten-free", { gluten: "no" }, "", null);
    expect(result.ok).toBe(true);
  });

  it("keto: uses nutrition data when available instead of guessing from text", () => {
    const result = checkDietCompatibility("keto", {}, "", { carbohydrates: 25 });
    expect(result.ok).toBe(false);
    expect(result.confidence).toBe("medium");
  });

  it("keto: returns null (unknown) rather than a guess when no data exists at all", () => {
    const result = checkDietCompatibility("keto", {}, "", null);
    expect(result.ok).toBe(null);
  });

  it("keto: does NOT false-positive on 'rismel' just because it contains 'mel'", () => {
    // Regression guard: "mel" is a short (<=4 char) keyword and must only match
    // as a whole word, not as a substring of an unrelated word like "rismel".
    const result = checkDietCompatibility("keto", {}, "rismel, vand, salt", null);
    expect(result.reasons.some(r => r.includes("mel"))).toBe(false);
  });

  it("keto: DOES flag plain 'mel' as a keto-breaker when it appears as its own word", () => {
    const result = checkDietCompatibility("keto", {}, "mel, vand, salt", null);
    expect(result.ok).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/mel/);
  });

  it("returns null/low-confidence for an unrecognized diet id", () => {
    const result = checkDietCompatibility("not-a-real-diet", {}, "", null);
    expect(result.ok).toBe(null);
    expect(result.confidence).toBe("low");
  });
});

describe("extractENumbers", () => {
  it("extracts and normalizes E-numbers from free text", () => {
    expect(extractENumbers("Indeholder E220 og E-330 samt e 621")).toEqual(["E220", "E330", "E621"]);
  });

  it("returns an empty array for text with no E-numbers", () => {
    expect(extractENumbers("Mel, vand, salt")).toEqual([]);
  });

  it("returns an empty array for empty/missing text", () => {
    expect(extractENumbers("")).toEqual([]);
    expect(extractENumbers(null)).toEqual([]);
  });
});

describe("compareENumbers", () => {
  it("flags a match between product and watched E-numbers", () => {
    const result = compareENumbers(["E220", "E330"], ["e220"]);
    expect(result.status).toBe("warn");
    expect(result.matched).toEqual(["e220"]);
  });

  it("is safe when there is no overlap", () => {
    const result = compareENumbers(["E330"], ["E220"]);
    expect(result.status).toBe("safe");
    expect(result.matched).toEqual([]);
  });

  it("is safe when the user isn't watching any E-numbers", () => {
    const result = compareENumbers(["E220"], []);
    expect(result.status).toBe("safe");
  });
});

describe("verifiedBadge", () => {
  it("labels producer-verified data as the highest trust tier", () => {
    expect(verifiedBadge("verified", null).label).toBe("Fra producent");
    expect(verifiedBadge(null, "producer").label).toBe("Fra producent");
  });

  it("labels Open Food Facts data distinctly", () => {
    expect(verifiedBadge(null, "off").label).toBe("Open Food Facts");
  });

  it("falls back to user-submitted for anything else", () => {
    expect(verifiedBadge(null, null).label).toBe("Bruger-indsendt");
  });
});
