// @ts-nocheck
import { describe, it, expect } from "vitest";
import { madpasSafetyNote, madpasCrossContactNote, madpasAllergyStatement } from "./useMadpas.js";

describe("Madpas-sætninger", () => {
  it("sænker navnet midt i sætningen på dansk/engelsk", () => {
    expect(madpasSafetyNote("Jordnødder", "da")).toContain("ikke indeholder jordnødder");
    expect(madpasCrossContactNote(["Peanuts"], "en")).toContain("with peanuts");
  });

  it("bevarer stort begyndelsesbogstav på tysk (navneord)", () => {
    expect(madpasSafetyNote("Erdnüsse", "de")).toContain(": Erdnüsse,");
    expect(madpasCrossContactNote(["Milch"], "de")).toContain("mit Milch");
  });

  it("giver det direkte engelske budskab for mælk", () => {
    expect(madpasAllergyStatement("Milk", "en")).toBe("I have a food allergy to milk.");
    expect(madpasSafetyNote("Milk", "en", "maelkeallergi")).toBe("Please make sure my food contains no milk or milk-derived ingredients.");
    expect(madpasSafetyNote("Tree Nuts", "en", "noedder")).toBe("Please make sure my food contains no tree nuts or nut-derived ingredients.");
  });

  it("falder tilbage til 'made from' for fritekst og andre sprog", () => {
    expect(madpasSafetyNote("Kiwi", "en")).toBe("Please make sure my food contains no kiwi or ingredients made from kiwi.");
    expect(madpasSafetyNote("Mælk", "da", "maelkeallergi")).toContain("ikke indeholder mælk");
    expect(madpasAllergyStatement("Mælk", "da")).toBe("Jeg har fødevareallergi over for mælk.");
  });
});
