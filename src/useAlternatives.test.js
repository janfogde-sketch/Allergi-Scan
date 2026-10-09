// @ts-nocheck
// Alternativer skal ligne produktet — ikke bare dele hovedkategori
// (live-test 30. sept. 2026: Coca-Cola foreslået til en drikkeyoghurt).
import { describe, it, expect } from "vitest";
import { similarityScore, sameProductType } from "./useAlternatives.js";

describe("similarityScore", () => {
  const cola = { name: "Coca Cola Zero", brand: "Coca-Cola", category: "Drikkevarer", category_original: "Drikkevarer > Sodavand > Cola" };

  it("scores products in the same store category path highly", () => {
    const pepsi = { name: "Pepsi Max", category: "Drikkevarer", category_original: "Drikkevarer > Sodavand > Cola" };
    expect(similarityScore(cola, pepsi)).toBeGreaterThanOrEqual(4);
  });

  it("does not treat a broad one-level category like 'Beverages' as similar", () => {
    const cultura = { name: "Cultura", category: "Drikkevarer", category_original: "Beverages And Beverages Preparations" };
    const juice = { name: "Appelsinjuice", category: "Drikkevarer", category_original: "Beverages And Beverages Preparations" };
    expect(similarityScore(cultura, juice)).toBeLessThan(3);
  });

  it("does not suggest a cola for a drinking yoghurt", () => {
    const cultura = { name: "Cultura Drikkeyoghurt Jordbær", category: "Drikkevarer", category_original: "Beverages" };
    expect(similarityScore(cultura, cola)).toBeLessThan(3);
  });

  it("counts shared name words and subcategory", () => {
    const a = { name: "Drikkeyoghurt Jordbær", subcategory: "Yoghurt & skyr" };
    const b = { name: "Drikkeyoghurt Blåbær", subcategory: "Yoghurt & skyr" };
    expect(similarityScore(a, b)).toBeGreaterThanOrEqual(5);
  });
});

describe("similarityScore — tærskel", () => {
  it("a single shared adjective is not enough (peanut butter is no alternative to chocolate)", () => {
    const lindt = { name: "Hello Crunchy Nougat", brand: "Lindt", category_original: "Snacks" };
    const pb = { name: "Peanut Butter Crunchy", brand: "Coop", category_original: "Kolonial > Pålæg > Peanutbutter" };
    expect(similarityScore(lindt, pb)).toBeLessThan(3);
  });
});

describe("sameProductType", () => {
  const base = { name: "Kakaomælk", category: "Drikkevarer", subcategory: "Mælkedrik", category_original: "Drikkevarer > Mælk > Kakao" };
  it("kræver samme type, ikke kun samme hovedkategori", () => {
    expect(sameProductType(base, { name: "Cola", category: "Drikkevarer", subcategory: "Sodavand" })).toBe(false);
    expect(sameProductType(base, { name: "Letmælk", subcategory: "Mælkedrik" })).toBe(true);
    expect(sameProductType(base, { name: "Økologisk kakaomælk" })).toBe(true);
  });
});

describe("rangering af alternativer", () => {
  const kiks = { name: "Safari kiks", brand: "Nordthy", category: "Snacks & slik", subcategory: "Kiks", ingredients: "Hvedemel, sukker, palmefedt, salt" };
  it("almindelige kiks slår chokoladeovertrukne kiks", () => {
    const plain = { name: "Digestive kiks", subcategory: "Kiks", ingredients_text: "Hvedemel, sukker, palmefedt, salt" };
    const choc = { name: "Digestive kiks med chokolade", subcategory: "Kiks", ingredients_text: "Chokolade, sukker, hvedemel, palmefedt" };
    expect(similarityScore(kiks, plain)).toBeGreaterThan(similarityScore(kiks, choc));
  });
  it("glutenfri/vegansk alene gør ikke produkter ens", () => {
    expect(similarityScore({ name: "Glutenfri pasta", category: "Kolonial" }, { name: "Glutenfri brød", category: "Kolonial" })).toBeLessThan(3);
  });
});
