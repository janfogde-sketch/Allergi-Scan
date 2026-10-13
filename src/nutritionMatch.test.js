import { describe, it, expect } from "vitest";
import { pickSafeMatch, fillMissing, brandMatches, isMatchable } from "../supabase/functions/_shared/nutritionMatch.js";

const prod = { brand: "Nestlé", nutrition: { energy_kcal: 384, fat: 4.8, carbohydrates: 70.1, saturated_fat: null } };
const hit = (o = {}) => ({
  code: "1", brands: ["Nestlé", "Cheerios"],
  nutriments: { "energy-kcal_100g": 385, fat_100g: 4.9, carbohydrates_100g: 70, "saturated-fat_100g": 0.9 }, ...o,
});

describe("pickSafeMatch", () => {
  it("accepterer et match med samme mærke og tal", () => {
    expect(pickSafeMatch(prod, [hit()]).values.saturated_fat).toBe(0.9);
  });
  it("afviser anden opskrift (andre tal)", () => {
    expect(pickSafeMatch(prod, [hit({ nutriments: { "energy-kcal_100g": 410, fat_100g: 9.8, "saturated-fat_100g": 1.1 } })])).toBeNull();
  });
  it("afviser forkert mærke", () => {
    expect(pickSafeMatch(prod, [hit({ brands: ["Kellogg's"] })])).toBeNull();
  });
  it("afviser varer uden mærke eller uden egne tal", () => {
    expect(pickSafeMatch({ ...prod, brand: "" }, [hit()])).toBeNull();
    expect(pickSafeMatch({ brand: "X", nutrition: { energy_kcal: 10, fat: 0 } }, [hit()])).toBeNull();
    expect(isMatchable({ brand: "X", nutrition: {} })).toBe(false);
  });
  it("afviser tvetydige kandidater", () => {
    const other = hit({ code: "2", nutriments: { "energy-kcal_100g": 384, fat_100g: 4.8, carbohydrates_100g: 70, "saturated-fat_100g": 3 } });
    expect(pickSafeMatch(prod, [hit(), other])).toBeNull();
  });
});

describe("fillMissing", () => {
  it("udfylder kun tomme felter og overskriver aldrig", () => {
    const r = fillMissing({ fat: 4.8, saturated_fat: null }, { fat: 9, saturated_fat: 0.9 });
    expect(r.merged).toEqual({ fat: 4.8, saturated_fat: 0.9 });
    expect(r.changed).toBe(true);
    expect(fillMissing({ fat: 4.8 }, { fat: 9 }).changed).toBe(false);
  });
});

describe("brandMatches", () => {
  it("er tolerant over for store/små bogstaver og accenter", () => {
    expect(brandMatches("Nestle", "Nestlé,Cheerios")).toBe(true);
    expect(brandMatches("Alpro", ["Danone"])).toBe(false);
  });
});
