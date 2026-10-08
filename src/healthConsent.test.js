import { describe, it, expect } from "vitest";
import { HEALTH_CONSENT_VERSION } from "./constants.jsx";
import { isConsentStale, consentFromRows, needsHealthConsent, canSaveHealthData, HEALTH_CONSENT_TEXT, HEALTH_CONSENT_WITHDRAW_TEXT, memberConsentTexts } from "./healthConsent.js";

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

describe("isConsentStale (samtykke forældet)", () => {
  it("forældet kun når det er givet på en anden version", () => {
    expect(isConsentStale({ given: true, version: "2026-10-02" }, "2026-10-02")).toBe(false);
    expect(isConsentStale({ given: true, version: "2026-10-02" }, "2026-11-01")).toBe(true);
    expect(isConsentStale({ given: false, version: null }, "2026-11-01")).toBe(false);
  });
  // Binder samtykketeksten til versionen: ændres teksten, skal HEALTH_CONSENT_VERSION hæves (så alle bliver bedt om at bekræfte på ny),
  // og først derefter opdateres de to felter her. Politikændringer alene kræver ikke ny version.
  it("samtykketeksten og versionen hører sammen", () => {
    const snapshot = { version: "2026-10-02", text: HEALTH_CONSENT_TEXT };
    expect(HEALTH_CONSENT_VERSION).toBe(snapshot.version);
    expect(snapshot.text).toBe("Jeg giver udtrykkeligt samtykke til, at EatSafe behandler mine allergi-, intolerance- og andre helbredsoplysninger for at give mig personlige produktkontroller og advarsler.");
  });
});
