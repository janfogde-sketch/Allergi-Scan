// @ts-nocheck
import { describe, it, expect } from "vitest";
import { MADPAS_LANGUAGES, MADPAS_COELIAC_T, ALLERGEN_T } from "./constants.jsx";
import { madpasSafetyNote, madpasCrossContactNote, madpasAllergyStatement, madpasAllergenExamples } from "./useMadpas.js";

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
    expect(madpasSafetyNote("Milk", "en", "maelkeallergi")).toBe("Please make sure my food does not contain milk or any milk\u2011derived ingredients.");
    expect(madpasSafetyNote("Tree Nuts", "en", "noedder")).toBe("Please make sure my food does not contain tree nuts or any nut\u2011derived ingredients.");
  });

  it("falder tilbage til 'made from' for fritekst og andre sprog", () => {
    expect(madpasSafetyNote("Kiwi", "en")).toBe("Please make sure my food does not contain kiwi or any ingredients made from kiwi.");
    expect(madpasSafetyNote("Mælk", "da", "maelkeallergi")).toContain("ikke indeholder mælk");
    expect(madpasAllergyStatement("Mælk", "da")).toBe("Jeg har fødevareallergi over for mælk.");
  });

  it("viser mælkens eksempler uden 'Milk' selv", () => {
    expect(madpasAllergenExamples("maelkeallergi", "en")).toEqual(["Cream","Butter","Cheese","Whey","Milk powder"]);
    expect(madpasAllergenExamples("maelkeallergi", "da")).toContain("Mælkepulver");
  });

  it("har cøliaki-budskab (navn, sætning, strengt glutenfrit) på alle 17 sprog", () => {
    expect(MADPAS_LANGUAGES).toHaveLength(17);
    MADPAS_LANGUAGES.forEach(({ code }) => {
      const t = MADPAS_COELIAC_T[code];
      expect(t?.n, code).toBeTruthy();
      expect(t?.statement, code).toBeTruthy();
      expect(t?.safety, code).toBeTruthy();
      expect(ALLERGEN_T.coeliaki[code]?.n, code).toBe(t.n);
    });
  });

  it("bruger egne cøliaki-tekster og ikke allergi-skabelonerne", () => {
    expect(madpasAllergyStatement("Coeliac disease", "en", "coeliaki")).toBe("I have coeliac disease.");
    expect(madpasSafetyNote("Coeliac disease", "en", "coeliaki")).toContain("strictly gluten-free");
    expect(madpasSafetyNote("Cøliaki", "da", "coeliaki")).toContain("strengt glutenfri");
    expect(madpasSafetyNote("Cøliaki", "da", "coeliaki")).not.toContain("ikke indeholder");
  });
});
