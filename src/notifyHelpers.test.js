// @ts-nocheck
import { describe, it, expect } from "vitest";
import { formatDanishDeadline, formatDanishDateTime, summarizeItems, affectedAllergenChanges, summarizeAllergenChanges, allergenRiskRank } from "../supabase/functions/_shared/notifyHelpers.js";

describe("formatDanishDeadline", () => {
  const now = new Date("2026-09-30T12:00:00Z"); // 14:00 dansk sommertid
  it("i dag / i morgen / dato — i dansk tid", () => {
    expect(formatDanishDeadline("2026-09-30T16:35:00Z", now)).toBe("i dag kl. 18:35");
    expect(formatDanishDeadline("2026-10-01T07:10:00Z", now)).toBe("i morgen kl. 09:10");
    expect(formatDanishDeadline("2026-10-03T07:10:00Z", now)).toMatch(/^3\. okt\.? kl\. 09:10$/);
  });
  it("bruger dansk dato omkring midnat (22:30 UTC = næste dag kl. 00:30)", () => {
    expect(formatDanishDeadline("2026-09-30T22:30:00Z", now)).toBe("i morgen kl. 00:30");
  });
});

describe("summarizeItems", () => {
  it("formulerer 1, 2, 3 og mange varer", () => {
    expect(summarizeItems(["Mælk"])).toBe("Mælk");
    expect(summarizeItems(["Mælk", "Æg"])).toBe("Mælk og Æg");
    expect(summarizeItems(["Mælk", "Æg", "Brød"])).toBe("Mælk, Æg og Brød");
    expect(summarizeItems(["a", "b", "c", "d", "e", "f", "g"])).toBe("a, b, c, d, e og 2 flere");
  });
  it("ignorerer tomme navne", () => {
    expect(summarizeItems(["", null, " Smør "])).toBe("Smør");
    expect(summarizeItems([])).toBe("");
  });
});

describe("formatDanishDateTime", () => {
  it("dansk dato og klokkeslæt (sommer- og vintertid)", () => {
    expect(formatDanishDateTime("2026-09-30T15:12:00Z")).toBe("30. september 2026 kl. 17:12");
    expect(formatDanishDateTime("2026-12-24T22:30:00Z")).toBe("24. december 2026 kl. 23:30");
  });
});


describe("P1: ændrede allergenoplysninger", () => {
  const changes = { aeg: { old: "no", new: "yes" }, fisk: { old: "no", new: "traces" }, soja: { old: "unknown", new: "yes" } };
  const current = { aeg: "yes", fisk: "traces", soja: "no" };
  it("risikoskalaen følger databasen", () => {
    expect(["no", "false", undefined, "unknown", "traces", "yes"].map(allergenRiskRank)).toEqual([0, 0, 0, 1, 2, 3]);
  });
  it("viser kun ændringer, der berører modtagerens profil", () => {
    const hits = affectedAllergenChanges(changes, current, ["aeg", "gluten"]);
    expect(hits).toEqual([{ key: "aeg", label: "Æg", value: "yes" }]);
    expect(affectedAllergenChanges(changes, current, ["gluten"])).toEqual([]);
  });
  it("Cøliaki berøres af ændringer i gluten og hvede", () => {
    const ch = { gluten: { old: "no", new: "yes" }, hvede: { old: "no", new: "traces" } };
    const now = { gluten: "yes", hvede: "traces" };
    expect(affectedAllergenChanges(ch, now, ["coeliaki"]).map(h => h.key)).toEqual(["gluten", "hvede"]);
    expect(affectedAllergenChanges(ch, now, ["coeliaki"], new Set(["coeliaki"])).map(h => h.key)).toEqual(["gluten"]);
    expect(affectedAllergenChanges(ch, now, ["coeliaki", "hvede"], new Set(["coeliaki"])).map(h => h.key)).toEqual(["gluten", "hvede"]);
    expect(affectedAllergenChanges(ch, now, ["fisk"])).toEqual([]);
  });
  it("sender ikke en ændring til spor, når modtageren kun reagerer på direkte indhold", () => {
    expect(affectedAllergenChanges(changes, current, ["fisk"], new Set(["fisk"]))).toEqual([]);
    // direkte indhold (yes) sendes stadig, selv om spor ignoreres
    expect(affectedAllergenChanges(changes, current, ["aeg"], new Set(["aeg"]))).toEqual([{ key: "aeg", label: "Æg", value: "yes" }]);
    // uden undtagelse (strict) sendes sporændringen
    expect(affectedAllergenChanges(changes, current, ["fisk"])).toHaveLength(1);
  });
  it("dropper flag, der er rullet tilbage siden hændelsen", () => {
    expect(affectedAllergenChanges(changes, current, ["soja"])).toEqual([]); // soja er nu "no"
  });
  it("formulerer resumeet", () => {
    const hits = affectedAllergenChanges(changes, current, ["aeg", "fisk"]);
    expect(summarizeAllergenChanges(hits)).toBe("Æg indeholder nu, Fisk kan nu indeholde spor");
  });
});
