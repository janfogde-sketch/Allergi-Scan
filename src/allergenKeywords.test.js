// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// allergenKeywords.test.js
// This module is the single source of truth for spotting allergens in free
// ingredient text. Its word-boundary logic exists specifically to fix a real
// bug (see the comments in allergenKeywords.js): short keywords like "mel"
// or "ost" used to false-positive inside unrelated words like "rismel" or
// "kost". These tests guard against that regression.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { keywordMatches, isAllergenWord, detectAllergensInText, matchCustomAllergens } from "./allergenKeywords.js";

describe("keywordMatches", () => {
  it("does not match a short keyword as a substring of an unrelated word", () => {
    expect(keywordMatches("jeg spiser rismel til aftensmad", "mel")).toBe(false);
    expect(keywordMatches("efter en lang dag med hård kost", "ost")).toBe(false);
  });

  it("matches a short keyword when it appears as its own word", () => {
    expect(keywordMatches("jeg køber mel til kagen", "mel")).toBe(true);
    expect(keywordMatches("jeg spiser ost til aften", "ost")).toBe(true);
  });

  it("matches a short keyword at the very start or end of the text", () => {
    expect(keywordMatches("mel og vand", "mel")).toBe(true);
    expect(keywordMatches("vand og mel", "mel")).toBe(true);
  });

  it("matches longer keywords (>4 chars) as a plain substring, as documented", () => {
    expect(keywordMatches("indeholder hvedeprotein", "hvede")).toBe(true);
  });

  // Regression: den gamle implementation stoppede ved den FØRSTE forekomst af
  // nøgleordet og gav helt op hvis den fejlede ordgrænse-tjekket, selvom en
  // senere, ægte forekomst fandtes i samme tekst — en falsk negativ, den
  // farligste fejltype her (fundet ved en allergen-logik-gennemgang, 16.
  // sept. 2026).
  it("finds a real match even when an earlier occurrence of the word was inside an unrelated word", () => {
    expect(keywordMatches("rismel, mel, vand", "mel")).toBe(true);
  });

  // Negations-detektion — porteret fra backend allergens Edge Function.
  it("does not match a long keyword when it is immediately followed by '-fri'/'fri'", () => {
    expect(keywordMatches("produktet er glutenfrit og velegnet til cøliaki", "gluten")).toBe(false);
    expect(keywordMatches("laves med gluten-fri havre", "gluten")).toBe(false);
  });

  it("does not match when explicitly negated with 'uden'", () => {
    expect(keywordMatches("fremstillet uden soja i denne opskrift", "soja")).toBe(false);
  });

  it("still matches a real, non-negated occurrence even if a negated one exists elsewhere in the text", () => {
    expect(keywordMatches("glutenfri havregryn, men indeholder hvedegluten", "gluten")).toBe(true);
  });
});

describe("matchCustomAllergens", () => {
  it("matches a custom free-text allergen term found in the ingredient list", () => {
    expect(matchCustomAllergens("Vand, sukker, fructose, farvestof", ["Fructose"])).toEqual(["Fructose"]);
  });

  it("does not match a custom term that is not present", () => {
    expect(matchCustomAllergens("Vand, sukker, salt", ["Fructose"])).toEqual([]);
  });

  it("respects negation for custom terms too", () => {
    expect(matchCustomAllergens("Fructosefri sirup", ["Fructose"])).toEqual([]);
  });

  it("returns an empty list for empty inputs", () => {
    expect(matchCustomAllergens("", ["Fructose"])).toEqual([]);
    expect(matchCustomAllergens("Vand, sukker", [])).toEqual([]);
    expect(matchCustomAllergens("Vand, sukker", null)).toEqual([]);
  });

  it("de-duplicates case-insensitively without changing the returned casing", () => {
    expect(matchCustomAllergens("Fructose, mere fructose", ["Fructose", "fructose"])).toEqual(["Fructose"]);
  });
});

describe("isAllergenWord", () => {
  it("does not flag 'rismel' as a milk/wheat allergen word", () => {
    expect(isAllergenWord("rismel")).toBe(false);
  });

  it("does not flag 'kost' as a milk allergen word", () => {
    expect(isAllergenWord("kost")).toBe(false);
  });

  it("flags standalone 'mel' and 'ost' as allergen words", () => {
    expect(isAllergenWord("mel")).toBe(true);
    expect(isAllergenWord("ost")).toBe(true);
  });

  it("respects an explicit 'no' flag by not flagging that allergen's words", () => {
    expect(isAllergenWord("ost")).toBe(true);
    expect(isAllergenWord("ost", { maelkeallergi: "no" })).toBe(false);
  });
});

describe("detectAllergensInText", () => {
  it("detects milk and egg in a simple ingredient list", () => {
    const detected = detectAllergensInText("Indeholder mælk og æg");
    expect(detected).toContain("maelkeallergi");
    expect(detected).toContain("aeg");
  });

  it("does not detect wheat/gluten from a gluten-free grain like rice flour", () => {
    const detected = detectAllergensInText("Ingredienser: rismel, vand, salt");
    expect(detected).not.toContain("hvede");
    expect(detected).not.toContain("gluten");
  });

  it("returns an empty list for text with no known allergens", () => {
    expect(detectAllergensInText("vand, salt, sukker")).toEqual([]);
  });

  // Regression-tests for ental/flertal-huller fundet ved en allergen-logik-
  // gennemgang (16. sept. 2026) — se den stående regel i CLAUDE.md om at
  // enhver allergen-nøgleordsliste skal have BÅDE ental- og flertalsform.
  it("detects singular nut/soy/shellfish forms, not just the plural", () => {
    expect(detectAllergensInText("Indeholder mandel")).toContain("noedder");
    expect(detectAllergensInText("Indeholder hasselnød")).toContain("noedder");
    expect(detectAllergensInText("Indeholder jordnød")).toContain("jordnoedder");
    expect(detectAllergensInText("Indeholder sojabønne")).toContain("soja");
    expect(detectAllergensInText("Indeholder reje")).toContain("skaldyr");
    expect(detectAllergensInText("Indeholder musling")).toContain("skaldyr");
    expect(detectAllergensInText("Indeholder sulfit")).toContain("svovl");
  });
});
