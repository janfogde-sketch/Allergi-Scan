import { describe, it, expect } from "vitest";
import { allergenDiff, changeKind, describe as describeRow, actorOf, sourceOf, valueText, historyParams, fieldLabel, touchesAllergens, hasDetails } from "./historyLogic.js";

describe("Ændringshistorik: logik", () => {
  it("tekniske feltnavne oversættes til dansk, ukendte vises uændret", () => {
    expect(fieldLabel("name")).toBe("Produktnavn");
    expect(fieldLabel("ingredients_text")).toBe("Ingrediensliste");
    expect(fieldLabel("allergen_flags")).toBe("Allergenoplysninger");
    expect(fieldLabel("all")).toBe("Alle relevante felter");
    expect(fieldLabel("noget_nyt")).toBe("noget_nyt");
  });
  it("allergen for allergen: kun ændrede, manglende nøgle er Ukendt, tilføjet/ændret/fjernet", () => {
    const d = allergenDiff({ maelkeallergi: "unknown", gluten: "yes", aeg: "no" }, { maelkeallergi: "yes", gluten: "yes", aeg: "unknown", fisk: "traces" });
    expect(d.map((x) => [x.id, x.before, x.after, x.kind])).toEqual([
      ["maelkeallergi", "Ukendt", "Indeholder", "added"], ["aeg", "Ikke påvist", "Ukendt", "removed"], ["fisk", "Ukendt", "Kan indeholde spor", "added"],
    ]);
    expect(allergenDiff({ a: "no" }, { a: "no" })).toEqual([]);
    expect(allergenDiff("afkortet…", "afkortet…")).toBeNull(); // afkortet værdi: vises som tekst, aldrig gættet
  });
  it("ældre sandt/falsk læses som ja/nej uden at blive omskrevet", () => {
    expect(allergenDiff({ gluten: false }, { gluten: true })[0]).toMatchObject({ before: "Ikke påvist", after: "Indeholder", kind: "changed" });
  });
  it("tilføjet, ændret, fjernet og tomme værdier", () => {
    expect(changeKind(null, "Kartoffelsticks")).toBe("added");
    expect(changeKind("Potato sticks", "Kartoffelsticks")).toBe("changed");
    expect(changeKind("Potato sticks", "")).toBe("removed");
    expect(valueText(null)).toBe("Ingen værdi");
    expect(valueText({ a: 1 })).toBe('{"a":1}');
  });
  it("aktør og kilde: kun det dokumenterede; ukendt aktør tilskrives ingen", () => {
    expect(actorOf({ actor_name: "Jan" })).toEqual({ kind: "admin", label: "Jan" });
    expect(actorOf({ actor_id: "x" }).label).toMatch(/konto slettet/);
    expect(actorOf({})).toEqual({ kind: "unknown", label: "Ikke registreret" });
    expect(sourceOf({ source: "legacy" })).toMatch(/ældre registrering/);
    expect(sourceOf({ source: "audit" })).toBe("Administratorredigering");
  });
  it("beskrivelse og detaljer: ældre poster uden før/efter opfindes ikke", () => {
    expect(describeRow({ action: "updated", fields: ["name", "allergen_flags"] })).toBe("Rettede Produktnavn, Allergenoplysninger");
    expect(describeRow({ action: "updated", legacy_fields: "name, brand" })).toBe("Rettede Produktnavn, Mærke");
    expect(describeRow({ action: "updated" })).toMatch(/ikke registreret/);
    expect(describeRow({ action: "created", note: "Oprettet via brugerindsendelse" })).toBe("Oprettet via brugerindsendelse");
    expect(hasDetails({ changes: null })).toBe(false);
    expect(touchesAllergens({ fields: ["allergen_flags"] })).toBe(true);
    expect(touchesAllergens({ source: "legacy", legacy_fields: "name, allergen_flags" })).toBe(true);
    expect(touchesAllergens({ source: "legacy", legacy_fields: "all" })).toBe(false);
  });
  it("forespørgsel: standard nyeste først, filtre videregives", () => {
    expect(historyParams({})).toMatchObject({ p_sort: "newest", p_action: null, p_days: null, p_allergen: false, p_search: null });
    expect(historyParams({ q: " skyr ", action: "updated", days: "7", allergen: true, sort: "oldest" }, 50)).toMatchObject({ p_search: "skyr", p_action: "updated", p_days: 7, p_allergen: true, p_sort: "oldest", p_offset: 50 });
  });
});
