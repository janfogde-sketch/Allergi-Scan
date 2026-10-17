// @ts-nocheck
import { describe, it, expect } from "vitest";
import { submissionAllergenFlags, allergenSummary, allergenLine, nameAllergenMismatch, SUBMISSION_ACTION_LABELS, cleanIngredientText, isNutritionLine, submissionMissingFields } from "./submissionLogic.js";

const base = { status: "pending", type: "new_product", ai_parsed_data: {} };

describe("allergener i indsendelser", () => {
  it("læser både direkte og indlejrede flag (ældre indsendelser)", () => {
    expect(submissionAllergenFlags({ ai_parsed_data: { maelkeallergi: "yes", aeg: "no" } })).toEqual({ maelkeallergi: "yes", aeg: "no" });
    expect(submissionAllergenFlags({ ai_parsed_data: { allergen_flags: { maelkeallergi: "yes" } } })).toEqual({ maelkeallergi: "yes" });
    expect(submissionAllergenFlags({ ai_parsed_data: { name: "x", notes: "y", maelkeallergi: "unknown" } })).toEqual({});
  });
  it("manglende data vises aldrig som 'Ingen'", () => {
    const s = allergenSummary({ ...base });
    expect(s.state).toBe("missing");
    expect(allergenLine(s)).toBe("Allergenoplysninger mangler");
    expect(allergenLine(s)).not.toMatch(/^Ingen/);
  });
  it("ældre indsendelse med indlejret mælk vises som fundet, ikke som 'Ingen' (Elephant Sriracha Pretzel Pieces Cheese)", () => {
    const s = allergenSummary({ status: "approved", type: "new_product", ai_parsed_data: { name: "Elephant Sriracha Pretzel Pieces Cheese", allergen_flags: { maelkeallergi: "yes" } } });
    expect(s.state).toBe("found");
    expect(allergenLine(s)).toBe("Allergener: Mælk");
  });
  it("laktose (intolerance) holdes adskilt fra allergener", () => {
    const s = allergenSummary({ status: "approved", type: "new_product", ai_parsed_data: { maelkeallergi: "yes", laktose: "yes" } });
    expect(allergenLine(s)).toBe("Allergener: Mælk · Intolerance: Laktose");
  });
  it("kun alle 'nej' er 'ingen registrerede' (og kun efter behandling); delvist udfyldt er ikke verificeret", async () => {
    const { PRODUCT_ALLERGENS } = await import("../constants.jsx");
    const all = Object.fromEntries(PRODUCT_ALLERGENS.map((a) => [a.id, "no"]));
    expect(allergenSummary({ status: "approved", type: "new_product", ai_parsed_data: all }).text).toBe("Ingen registrerede allergener");
    expect(allergenSummary({ status: "pending", type: "new_product", ai_parsed_data: all }).state).toBe("unverified");
    expect(allergenSummary({ status: "approved", type: "new_product", ai_parsed_data: { aeg: "no" } }).state).toBe("partial");
  });
  it("rettelser af billede/næring rører ikke allergener, og ingrediensrettelser beregnes ved godkendelse", () => {
    expect(allergenSummary({ status: "rejected", type: "edit", ai_parsed_data: { edit_type: "image" } }).state).toBe("not_applicable");
    expect(allergenSummary({ status: "pending", type: "edit", ai_parsed_data: { edit_type: "ingredients" } }).state).toBe("recalculated");
  });
  it("produktnavn nævner et allergen, som ikke er angivet: kun en påmindelse", () => {
    expect(nameAllergenMismatch({ ai_parsed_data: { name: "Pretzel Pieces Cheese" } }).map((m) => m.id)).toEqual(["maelkeallergi"]);
    expect(nameAllergenMismatch({ ai_parsed_data: { name: "Pretzel Cheese", maelkeallergi: "yes" } })).toEqual([]);
    expect(nameAllergenMismatch({ ai_parsed_data: { name: "Post og kost" } })).toEqual([]); // "ost" matcher kun som helt ord
  });
  it("knapteksterne følger status", () => {
    expect(SUBMISSION_ACTION_LABELS).toEqual({ pending: "Gennemgå", approved: "Se detaljer", rejected: "Se detaljer" });
  });
});

describe("rens af OCR-tekst (G12)", () => {
  it("bevarer ingredienslinjer, der starter med næringsord", () => {
    expect(cleanIngredientText("Salt, selleri, sennep\nFedt 12 g")).toBe("Salt, selleri, sennep");
    expect(cleanIngredientText("Protein fra soja (20%), hvedemel")).toBe("Protein fra soja (20%), hvedemel");
  });
  it("bevarer opbevaring og sporadvarsler", () => {
    expect(cleanIngredientText("Mel, sukker\nOpbevaring: kan indeholde spor af nødder")).toBe("Mel, sukker, Opbevaring: kan indeholde spor af nødder");
  });
  it("fjerner næringstabellen", () => {
    const text = "Ingredienser: hvedemel, æg\nNæringsindhold pr. 100 g\nEnergi 1500 kJ / 360 kcal\nFedt 12 g\nheraf mættede fedtsyrer 3,5 g\nSalt 0,8 g\n100 g";
    expect(cleanIngredientText(text)).toBe("Ingredienser: hvedemel, æg");
  });
  it("bevarer korte linjer som Æg", () => {
    expect(cleanIngredientText("Mel\nÆg")).toBe("Mel, Æg");
    expect(isNutritionLine("Æg")).toBe(false);
  });
});

describe("komplette indsendelser til massegodkendelse (G16)", () => {
  it("nyt produkt kræver stregkode, navn og ingrediensliste", () => {
    expect(submissionMissingFields({ type: "new_product", ean: "1", ai_parsed_data: { name: "x" }, ocr_raw_text: "mel" })).toEqual([]);
    expect(submissionMissingFields({ type: "new_product", ean: "1", ai_parsed_data: {}, ocr_raw_text: "" })).toEqual(["navn", "ingrediensliste"]);
  });
  it("rettelse kræver et produkt", () => {
    expect(submissionMissingFields({ type: "edit", ean: "1", product_id: "p" })).toEqual([]);
    expect(submissionMissingFields({ type: "edit", ean: "1" })).toEqual(["produkt"]);
  });
});

import { splitEnergy, joinEnergy, allergenGroups } from "./submissionLogic.js";
import { parseEnergyKcal } from "../../supabase/functions/_shared/nutrition.js";

describe("energi i to felter", () => {
  it("deler de formater, serveren læser", () => {
    expect(splitEnergy("1560/373")).toEqual({ kj: "1560", kcal: "373" });
    expect(splitEnergy("1560 kJ / 373 kcal")).toEqual({ kj: "1560", kcal: "373" });
    expect(splitEnergy("373 kcal")).toEqual({ kj: "", kcal: "373" });
    expect(splitEnergy("1560 kJ")).toEqual({ kj: "1560", kcal: "" });
    expect(splitEnergy("373")).toEqual({ kj: "", kcal: "373" });
    expect(splitEnergy("")).toEqual({ kj: "", kcal: "" });
    expect(splitEnergy(undefined)).toEqual({ kj: "", kcal: "" });
  });
  it("samler til tekst, serveren læser som før", () => {
    expect(joinEnergy("1560", "373")).toBe("1560/373");
    expect(joinEnergy("", "373")).toBe("373 kcal");
    expect(joinEnergy("1560", "")).toBe("1560 kJ");
    expect(joinEnergy("", "")).toBe("");
    for (const [kj, kcal] of [["1560", "373"], ["", "373"], ["1560", ""]]) {
      const parsed = parseEnergyKcal(joinEnergy(kj, kcal));
      expect(parsed).toBe(kcal ? Number(kcal) : Math.round(Number(kj) / 4.184));
    }
  });
});

describe("allergenGroups", () => {
  it("deler efter tilstand, og manglende er ikke angivet", () => {
    const list = [{ id: "a", label: "A" }, { id: "b", label: "B" }, { id: "c", label: "C" }, { id: "d", label: "D" }];
    expect(allergenGroups({ a: "yes", b: "traces", c: "no" }, list)).toEqual({ yes: ["A"], traces: ["B"], no: ["C"], unset: ["D"] });
    expect(allergenGroups(undefined, list).unset).toEqual(["A", "B", "C", "D"]);
  });
});
