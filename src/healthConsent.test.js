import { describe, it, expect } from "vitest";
import { consentFromRows, needsHealthConsent, canSaveHealthData, HEALTH_CONSENT_TEXT, HEALTH_CONSENT_WITHDRAW_TEXT, memberConsentTexts } from "./healthConsent.js";

describe("consentFromRows", () => {
  it("ingen rækker = ikke givet", () => {
    expect(consentFromRows([])).toEqual({ given: false, at: null, version: null });
    expect(consentFromRows(null).given).toBe(false);
  });
  it("nyeste række afgør (given)", () => {
    expect(consentFromRows([{ action: "given", version: "2026-10-02", created_at: "2026-10-02T10:00:00Z" }]))
      .toEqual({ given: true, at: "2026-10-02T10:00:00Z", version: "2026-10-02" });
  });
  it("tilbagetrukket = ikke givet", () => {
    expect(consentFromRows([{ action: "withdrawn", version: "2026-10-02", created_at: "x" }]).given).toBe(false);
  });
});

describe("needsHealthConsent / canSaveHealthData", () => {
  it("kræver samtykke kun når der er helbredsdata og det ikke er givet", () => {
    expect(needsHealthConsent({ hasHealthData: true, given: false })).toBe(true);
    expect(needsHealthConsent({ hasHealthData: false, given: false })).toBe(false);
    expect(needsHealthConsent({ hasHealthData: true, given: true })).toBe(false);
  });
  it("kan ikke gemme uden kryds, men med kryds eller eksisterende samtykke", () => {
    expect(canSaveHealthData({ hasHealthData: true, given: false, checked: false })).toBe(false);
    expect(canSaveHealthData({ hasHealthData: true, given: false, checked: true })).toBe(true);
    expect(canSaveHealthData({ hasHealthData: true, given: true, checked: false })).toBe(true);
    expect(canSaveHealthData({ hasHealthData: false, given: false, checked: false })).toBe(true);
  });
  it("teksten nævner udtrykkeligt samtykke og tilbagetrækning", () => {
    expect(HEALTH_CONSENT_TEXT).toMatch(/udtrykkeligt samtykke/);
    expect(HEALTH_CONSENT_WITHDRAW_TEXT).toMatch(/trække samtykket tilbage/);
  });
});

describe("memberConsentTexts (samtykke til en andens profil)", () => {
  it("bruger aldrig 'mine' og nævner personen ved navn", () => {
    for (const age of ["8", "34", ""]) {
      const { text } = memberConsentTexts({ name: "Arnold", age });
      expect(text).toContain("Arnold");
      expect(text).not.toMatch(/\bmine\b/i);
    }
  });
  it("børn: forælder/værge-erklæring. Voksne: personens eget samtykke", () => {
    expect(memberConsentTexts({ name: "Trine", age: "8" })).toMatchObject({ isChild: true });
    expect(memberConsentTexts({ name: "Trine", age: "8" }).text).toMatch(/forælder eller værge/);
    expect(memberConsentTexts({ name: "Trine", age: "25" })).toMatchObject({ isChild: false });
    expect(memberConsentTexts({ name: "Trine", age: "25" }).text).toMatch(/har givet sit udtrykkelige samtykke/);
  });
  it("bøjer navnet korrekt og falder tilbage til 'personen'", () => {
    expect(memberConsentTexts({ name: "Jens", age: "30" }).text).toContain("Jens'");
    expect(memberConsentTexts({ name: "Mia", age: "30" }).text).toContain("Mias");
    expect(memberConsentTexts({ name: "", age: "30" }).text).toContain("personen");
  });
});
