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
import { keywordMatches, isAllergenWord, detectAllergensInText } from "./allergenKeywords.js";

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
});
