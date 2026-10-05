// @ts-nocheck
import { describe, it, expect } from "vitest";
import { normalizeNutrition, parseEnergyKcal } from "../supabase/functions/_shared/nutrition.js";

describe("normalizeNutrition", () => {
  it("omsætter indsendelsens nøgler til resultatsidens format", () => {
    expect(normalizeNutrition({ energy: "1560/373", fat: "20,3", saturated: "12.1", carbs: "44,2", sugars: "38,5", protein: "5,4", salt: "0,12" }))
      .toEqual({ energy_kcal: 373, fat: 20.3, saturated_fat: 12.1, carbohydrates: 44.2, sugars: 38.5, protein: 5.4, salt: 0.12 });
  });
  it("udelader tomme og ugyldige felter", () => {
    expect(normalizeNutrition({ energy: "", fat: "abc", protein: "5,4" })).toEqual({ protein: 5.4 });
  });
  it("giver null, når intet kan læses", () => {
    expect(normalizeNutrition({ energy: "", fat: "" })).toBeNull();
    expect(normalizeNutrition(null)).toBeNull();
  });
  it("accepterer allerede normaliserede nøgler", () => {
    expect(normalizeNutrition({ energy_kcal: 456, saturated_fat: 5.1, carbohydrates: 62 })).toEqual({ energy_kcal: 456, saturated_fat: 5.1, carbohydrates: 62 });
  });
});

describe("parseEnergyKcal", () => {
  it.each([["1560/373", 373], ["1560 kJ / 373 kcal", 373], ["373 kcal", 373], ["1560 kJ", 373], ["373", 373], ["", null]])("%s", (i, o) => {
    expect(parseEnergyKcal(i)).toBe(o);
  });
});
