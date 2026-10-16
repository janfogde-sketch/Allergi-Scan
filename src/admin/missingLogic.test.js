import { describe, it, expect } from "vitest";
import { missingParams, validateCreate, eanWarning, MISSING_STATUS_LABEL, MISSING_SETTABLE } from "./missingLogic.js";

describe("Ukendte stregkoder: logik", () => {
  it("standard er flest forgæves opslag; seneste forsøg og periode sendes videre; søgning kun cifre", () => {
    expect(missingParams({})).toMatchObject({ p_sort: "count", p_search: null, p_status: null, p_days: null, p_offset: 0 });
    expect(missingParams({ sort: "last_seen", days: "30", status: "new", q: " 0570-12a " }, 50)).toMatchObject({ p_sort: "last_seen", p_days: 30, p_status: "new", p_search: "057012", p_offset: 50 });
  });
  it("foranstillede nuller bevares (EAN er tekst)", () => {
    expect(missingParams({ q: "0012345" }).p_search).toBe("0012345");
    expect(validateCreate({ ean: "0012345678905", name: "X" })).toEqual({});
  });
  it("oprettelse kræver navn og en stregkode på 6-14 cifre; ugyldigt kontrolciffer advarer kun", () => {
    expect(validateCreate({ ean: "5701234567899", name: " " }).name).toBeTruthy();
    expect(validateCreate({ ean: "12ab", name: "X" }).ean).toBeTruthy();
    expect(validateCreate({ ean: "5701234567890", name: "X" })).toEqual({}); // kontrolciffer blokerer ikke
    expect(eanWarning("5701234567890")).toMatch(/kontrol/i);
    expect(eanWarning("5701234567899")).toBe("");
  });
  it("fire statusser; 'oprettet' kan ikke sættes i hånden", () => {
    expect(Object.values(MISSING_STATUS_LABEL)).toEqual(["Ny", "Under behandling", "Oprettet", "Afvist"]);
    expect(MISSING_SETTABLE.map(([v]) => v)).toEqual(["new", "in_progress", "rejected"]);
  });
});
