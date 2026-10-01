import { describe, it, expect } from "vitest";
import { consentFromRows, needsHealthConsent, canSaveHealthData, HEALTH_CONSENT_TEXT } from "./healthConsent.js";

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
    expect(HEALTH_CONSENT_TEXT).toMatch(/trække samtykket tilbage/);
  });
});
