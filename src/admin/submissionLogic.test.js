// @ts-nocheck
import { describe, it, expect } from "vitest";
import { submissionAllergenFlags, allergenSummary, allergenLine, nameAllergenMismatch, SUBMISSION_ACTION_LABELS } from "./submissionLogic.js";

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
