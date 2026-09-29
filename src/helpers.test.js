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
  isValidEanChecksum,
} from "./helpers.js";

describe("isValidEanChecksum", () => {
  it("accepts a real EAN-13 with a correct check digit", () => {
    expect(isValidEanChecksum("4006381333931")).toBe(true);
  });
  it("rejects the same code with the check digit changed", () => {
    expect(isValidEanChecksum("4006381333930")).toBe(false);
  });
  it("rejects a code with the wrong length", () => {
    expect(isValidEanChecksum("123456")).toBe(false);
  });
  it("rejects non-numeric input", () => {
    expect(isValidEanChecksum("400638133393a")).toBe(false);
  });
});

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
    expect(result.confidence).toBe("high");
  });

  it("gluten-free: falls back to ingredient text when the gluten/hvede flags are missing (bekymring fra sikkerhedsgennemgang)", () => {
    const result = checkDietCompatibility("gluten-free", {}, "Hvedemel, vand, salt, gær", null);
    expect(result.ok).toBe(false);
  });

  it("gluten-free: does NOT false-positive on a product explicitly labelled gluten-free (allergen-logik-gennemgang, 16. sept. 2026)", () => {
    // "gluten" er et langt nøgleord (>4 tegn, ren understreng) uden ordgrænse-
    // beskyttelse — uden negations-tjek matchede det tidligere "glutenfri"
    // selv, og fortalte en cøliaki-bruger at et EKSPLICIT glutenfrit produkt
    // "indeholder gluten". Det stik modsatte af hvad emballagen rent faktisk sagde.
    const result = checkDietCompatibility("gluten-free", {}, "Produktet er 100% glutenfrit. Ingredienser: majsstivelse, vand, salt", null);
    expect(result.ok).toBe(true);
  });

  it("gluten-free: does NOT claim high confidence when the flags are unknown and there's no ingredient text to fall back on", () => {
    const result = checkDietCompatibility("gluten-free", { gluten: "unknown" }, "", null);
    expect(result.ok).toBe(true);
    expect(result.confidence).not.toBe("high");
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

  it("marks Bilka/nemlig imports as store data, not user-submitted", () => {
    expect(verifiedBadge(null, "bilka").label).toBe("Butiksdata");
    expect(verifiedBadge("unverified", "nemlig").label).toBe("Butiksdata");
  });

  it("falls back to user-submitted for anything else", () => {
    expect(verifiedBadge(null, null).label).toBe("Bruger-indsendt");
  });
});

// ─── QA 28. sept. 2026: falske "ingen advarsler" (Q1/Q2/Q3) ─────────────────
import { effectiveAllergenFlag, looksNonDanishIngredients, normalizeProductFlags, computeProfileResults as cpr } from "./helpers.js";

const ALL_NO = { gluten:"no", hvede:"no", maelkeallergi:"no", laktose:"no", noedder:"no", jordnoedder:"no", soja:"no", sesam:"no" };

describe("hvede tæller som gluten (Q3)", () => {
  it("effectiveAllergenFlag løfter gluten til hvedes værdi", () => {
    expect(effectiveAllergenFlag({ gluten:"no", hvede:"yes" }, "gluten")).toBe("yes");
    expect(effectiveAllergenFlag({ gluten:"no", hvede:"traces" }, "gluten")).toBe("traces");
    expect(effectiveAllergenFlag({ gluten:"yes", hvede:"traces" }, "gluten")).toBe("yes");
    expect(effectiveAllergenFlag({ gluten:"yes", hvede:"no" }, "hvede")).toBe("no");
  });
  it("gluten-bruger advares om Nestlé-bar med hvede=yes, gluten=no", () => {
    expect(compareAllergens({ ...ALL_NO, hvede:"yes" }, ["gluten"]).status).toBe("danger");
    expect(compareAllergens({ ...ALL_NO, hvede:"traces" }, ["gluten"]).status).toBe("warn");
  });
});

describe("looksNonDanishIngredients (Q1)", () => {
  it("genkender tysk, svensk og engelsk", () => {
    expect(looksNonDanishIngredients("Zucker, Vollmilchpulver, Kakaobutter, Haselnüsse (10%), Weizenmehl")).toBe(true);
    expect(looksNonDanishIngredients("Mjölk, mjölksyrakultur, laktasenzym")).toBe(true);
    expect(looksNonDanishIngredients("sugar, wheat flour, salt")).toBe(true);
    expect(looksNonDanishIngredients("wheat 95%,")).toBe(true);
  });
  it("lader danske og blandede danske lister være", () => {
    expect(looksNonDanishIngredients("Sukker, kakaosmør, SKUMMETMÆLKSPULVER, emulgator (SOJALECITHINER)")).toBe(false);
    expect(looksNonDanishIngredients("socker/sukker, VETEmjöl/HVEDE-/HVETEMEL, skumMJÖLKS-/SKUMMETMÆLKS")).toBe(false);
    expect(looksNonDanishIngredients("220 g løg, 44 g palmeolie, 31 g hvedemel, salt.")).toBe(false);
    expect(looksNonDanishIngredients("")).toBe(false);
  });
});

describe("normalizeProductFlags (Q1/Q2)", () => {
  it("uden ingrediensliste bliver 'no' til 'unknown' (Kartoffel Sandwichbrød)", () => {
    const f = normalizeProductFlags(ALL_NO, { ingredientsText: null });
    expect(f.gluten).toBe("unknown");
    expect(compareAllergens(f, ["gluten"]).hasUnknown).toBe(true);
  });
  it("pladsholderen 'Ingen ingrediensliste' tæller ikke som data", () => {
    expect(normalizeProductFlags(ALL_NO, { ingredientsText: "Ingen ingrediensliste" }).noedder).toBe("unknown");
  });
  it("tysk liste uden AI-læsning bliver 'unknown' (Lindt), men 'yes' bevares", () => {
    const f = normalizeProductFlags({ ...ALL_NO, soja:"yes" }, { ingredientsText: "Zucker, Haselnüsse, Weizenmehl" });
    expect(f.noedder).toBe("unknown");
    expect(f.soja).toBe("yes");
  });
  it("stoler på verificerede og Claude-læste flag", () => {
    expect(normalizeProductFlags(ALL_NO, { ingredientsText: "", verifiedStatus: "verified" }).gluten).toBe("no");
    expect(normalizeProductFlags(ALL_NO, { ingredientsText: "Zucker, Weizenmehl", sourceMethod: "keyword+claude" }).gluten).toBe("no");
  });
  it("kvalitet 'high' redder ikke et produkt uden ingrediensliste", () => {
    expect(normalizeProductFlags(ALL_NO, { ingredientsText: "Ingen ingrediensliste", quality: "high" }).gluten).toBe("unknown");
  });
  it("dansk liste er uændret", () => {
    expect(normalizeProductFlags(ALL_NO, { ingredientsText: "Sukker, rismel, salt" }).gluten).toBe("no");
  });
  it("retter gluten ud fra hvede i selve flag-objektet", () => {
    expect(normalizeProductFlags({ ...ALL_NO, hvede:"yes" }, { ingredientsText: "hvedemel, sukker" }).gluten).toBe("yes");
  });
});

describe("computeProfileResults: ukendt er ikke sikkert", () => {
  it("giver 'warn' når en valgt allergi er ukendt", () => {
    const [r] = cpr([{ id:"me", name:"Åse", allergens:["gluten"] }], { allergen_flags: { gluten:"unknown" }, ingredients:"" });
    expect(r.status).toBe("warn");
  });
  it("giver 'danger' for hvede når profilen har gluten", () => {
    const [r] = cpr([{ id:"me", name:"Åse", allergens:["gluten"] }], { allergen_flags: { gluten:"no", hvede:"yes" }, ingredients:"hvedemel" });
    expect(r.status).toBe("danger");
  });
});
