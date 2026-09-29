// @ts-nocheck
import { describe, it, expect } from "vitest";
import { madpasSafetyNote, madpasCrossContactNote } from "./useMadpas.js";

describe("Madpas-sætninger", () => {
  it("sænker navnet midt i sætningen på dansk/engelsk", () => {
    expect(madpasSafetyNote("Jordnødder", "da")).toContain("ikke indeholder jordnødder");
    expect(madpasCrossContactNote(["Peanuts"], "en")).toContain("with peanuts");
  });

  it("bevarer stort begyndelsesbogstav på tysk (navneord)", () => {
    expect(madpasSafetyNote("Erdnüsse", "de")).toContain(": Erdnüsse,");
    expect(madpasCrossContactNote(["Milch"], "de")).toContain("mit Milch");
  });
});
