// @ts-nocheck
// Generalprøven 15. okt. 2026: advarsel (vibration/lyd) og alternativer skal følge resultatsidens vurdering.
import { describe, it, expect } from "vitest";
import { buildScanResultFromProductData } from "./useProduct.js";
import { scanNeedsWarning, profilesHaveSelections } from "./helpers.js";

const me = (o = {}) => ({ id: "me", name: "Dig", allergens: ["maelkeallergi"], custom: [], eNumbers: [], levels: {}, ...o });
const scan = (product, profiles) => buildScanResultFromProductData({
  product: { verified_status: "verified", source: "admin", ...product }, ean: "123",
  activeIds: [...new Set(profiles.flatMap(p => p.allergens))], activeLevels: {},
  activeENumbers: [...new Set(profiles.flatMap(p => p.eNumbers))], family: [], activeProfiles: profiles.map(p => p.id),
});

describe("scanNeedsWarning", () => {
  it("advarer ved en kageblanding, som skærmen viser som 'Kan ikke vurderes'", () => {
    const profiles = [me()];
    const r = scan({ name: "Kageblanding chokolade", ingredients: "Hvedemel, sukker, kakao", allergen_flags: { maelkeallergi: "no" } }, profiles);
    expect(r.status).toBe("safe"); // den ældre beregning alene ville ikke advare
    expect(scanNeedsWarning(profiles, r)).toBe(true);
  });

  it("advarer, når egne ord er valgt, og ingredienslisten mangler", () => {
    const profiles = [me({ allergens: [], custom: ["kanel"] })];
    const r = scan({ name: "Småkager", ingredients: "", allergen_flags: { maelkeallergi: "no" } }, profiles);
    expect(scanNeedsWarning(profiles, r)).toBe(true);
  });

  it("advarer stadig ved direkte indhold og spor", () => {
    const profiles = [me()];
    expect(scanNeedsWarning(profiles, scan({ name: "Mælk", ingredients: "Mælk", allergen_flags: { maelkeallergi: "yes" } }, profiles))).toBe(true);
    expect(scanNeedsWarning(profiles, scan({ name: "Chokolade", ingredients: "Kakao, sukker", allergen_flags: { maelkeallergi: "traces" } }, profiles))).toBe(true);
  });

  it("advarer ikke ved et grønt produkt", () => {
    const profiles = [me()];
    const r = scan({ name: "Havregryn", ingredients: "Havregryn", allergen_flags: { maelkeallergi: "no" } }, profiles);
    expect(scanNeedsWarning(profiles, r)).toBe(false);
  });

  it("advarer ikke, når intet er valgt; resultatsiden beder i stedet om at vælge", () => {
    const profiles = [me({ allergens: [] })];
    const r = scan({ name: "Peanutbar", ingredients: "Jordnødder", allergen_flags: { jordnoedder: "yes" } }, profiles);
    expect(profilesHaveSelections(profiles)).toBe(false);
    expect(scanNeedsWarning(profiles, r)).toBe(false);
    expect(scanNeedsWarning([], r)).toBe(false);
  });
});
