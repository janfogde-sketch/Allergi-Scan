import { describe, it, expect } from "vitest";
import { flagState, hasIngredients, canMarkNotDetected, findConflicts, eanCheck, gtinChecksumOk, validateProduct, verifyBlockers, productDirty, changedFields, labelOr, VERIFIED_LABELS } from "./productsLogic.js";

const AL = [{ id: "maelkeallergi", label: "Mælk" }, { id: "laktose", label: "Laktose" }, { id: "gluten", label: "Gluten" }, { id: "hvede", label: "Hvede" }, { id: "noedder", label: "Nødder" }];

describe("allergenstatus: manglende data er ukendt, aldrig nej", () => {
  it("manglende, tomme og ukendte værdier er 'unknown'", () => {
    for (const flags of [undefined, null, {}, { maelkeallergi: "unknown" }, { maelkeallergi: null }, { maelkeallergi: "" }, { maelkeallergi: "banan" }]) expect(flagState(flags, "maelkeallergi")).toBe("unknown");
  });
  it("kendte værdier og ældre sandt/falsk læses uden at ændre det gemte", () => {
    expect(flagState({ a: "yes" }, "a")).toBe("yes");
    expect(flagState({ a: "traces" }, "a")).toBe("traces");
    expect(flagState({ a: "no" }, "a")).toBe("no");
    expect(flagState({ a: true }, "a")).toBe("yes");
    expect(flagState({ a: false }, "a")).toBe("no");
  });
  it("'ikke påvist' kræver en registreret ingrediensliste", () => {
    expect(canMarkNotDetected("")).toBe(false);
    expect(canMarkNotDetected("   ")).toBe(false);
    expect(canMarkNotDetected("12")).toBe(false);
    expect(canMarkNotDetected("Vand, sukker")).toBe(true);
    expect(hasIngredients(null)).toBe(false);
  });
});

describe("konflikter (kun advarsler)", () => {
  it("Skyr uden mælk markeres til manuel kontrol, men kun når mælk står som ikke påvist; ukendt er ikke en konflikt", () => {
    expect(findConflicts({ name: "Skyr naturel", allergen_flags: { maelkeallergi: "no" } }, AL).map((c) => `${c.id}:${c.kind}`)).toEqual(["maelkeallergi:name"]);
    expect(findConflicts({ name: "Skyr naturel", allergen_flags: { maelkeallergi: "unknown" } }, AL)).toEqual([]);
    expect(findConflicts({ name: "Skyr naturel", allergen_flags: {} }, AL)).toEqual([]);
    expect(findConflicts({ name: "Skyr naturel", allergen_flags: { maelkeallergi: "yes" } }, AL)).toEqual([]);
  });
  it("ingredienser mod flag: mælk i listen men mælk ikke påvist; negationer tæller ikke", () => {
    expect(findConflicts({ name: "Kage", ingredients_text: "Mel, sukker, mælk", allergen_flags: { maelkeallergi: "no" } }, AL).some((c) => c.kind === "ingredients")).toBe(true);
    expect(findConflicts({ name: "Drik", ingredients_text: "Vand, laktosefri mælkeprotein", allergen_flags: { laktose: "no" } }, AL).some((c) => c.id === "laktose")).toBe(false);
    expect(findConflicts({ name: "Kage", ingredients_text: "Mel, sukker, uden mælk", allergen_flags: { maelkeallergi: "no" } }, AL)).toEqual([]);
  });
  it("laktose og mælk er adskilte: laktose-konflikt rammer ikke mælk og omvendt", () => {
    const c = findConflicts({ name: "X", ingredients_text: "Vand, laktose", allergen_flags: { maelkeallergi: "no", laktose: "yes" } }, AL);
    expect(c.every((x) => x.id !== "laktose")).toBe(true);
  });
  it("navnet alene ændrer aldrig flagene", () => {
    const p = { name: "Skyr", allergen_flags: { maelkeallergi: "unknown" } };
    findConflicts(p, AL);
    expect(p.allergen_flags.maelkeallergi).toBe("unknown");
  });
});

describe("EAN", () => {
  it("kontrolciffer og format", () => {
    expect(gtinChecksumOk("5701234567899")).toBe(true);
    expect(eanCheck("5701234567899").ok).toBe(true);
    expect(eanCheck("5701234567890").text).toMatch(/kontrolcifre/);
    expect(eanCheck("12345").text).toMatch(/standardformat/);
    expect(eanCheck("57a").text).toMatch(/andet end cifre/);
    expect(eanCheck("").text).toMatch(/mangler/);
  });
});

describe("validering og verificering", () => {
  it("navn er påkrævet; manglende ingredienser er en advarsel, ikke en fejl", () => {
    const v = validateProduct({ name: " ", ingredients_text: "", allergen_flags: {} }, AL);
    expect(v.errors).toEqual(["Produktnavn skal udfyldes."]);
    expect(v.warnings.join(" ")).toMatch(/Ingredienslisten mangler/);
  });
  it("ikke påvist uden ingredienser giver en advarsel", () => {
    const v = validateProduct({ name: "X", ingredients_text: "", allergen_flags: { gluten: "no" } }, AL);
    expect(v.warnings.join(" ")).toMatch(/ikke påvist uden en ingrediensliste/);
  });
  it("et ufuldstændigt produkt kan ikke verificeres: ingredienser mangler, ukendte allergener, konflikter", () => {
    const flags = { maelkeallergi: "no", laktose: "no", gluten: "no", hvede: "no", noedder: "no" };
    expect(verifyBlockers({ name: "X", ingredients_text: "", allergen_flags: flags }, AL).join(" ")).toMatch(/mangler/);
    expect(verifyBlockers({ name: "X", ingredients_text: "Vand, sukker, salt", allergen_flags: { ...flags, gluten: "unknown" } }, AL).join(" ")).toMatch(/ukendt/);
    expect(verifyBlockers({ name: "Skyr", ingredients_text: "Vand, sukker, salt", allergen_flags: flags }, AL).join(" ")).toMatch(/konflikter/);
    expect(verifyBlockers({ name: "Havredrik", ingredients_text: "Vand, havre, salt", allergen_flags: { ...flags, gluten: "yes" } }, AL)).toEqual([]);
  });
});

describe("ændringer og betegnelser", () => {
  const orig = { name: "A", brand: "", category: "Mejeri & æg", ingredients_text: "Vand", verified_status: "unverified", allergen_flags: { gluten: "unknown" } };
  it("uændret formular er ikke ændret, og kun ændrede felter sendes", () => {
    expect(productDirty(orig, { ...orig, name: " A " })).toBe(false);
    expect(productDirty(orig, { ...orig, name: "B" })).toBe(true);
    expect(changedFields(orig, { ...orig })).toEqual({});
    expect(changedFields(orig, { ...orig, name: "B", allergen_flags: { gluten: "no" } })).toEqual({ name: "B", allergen_flags: { gluten: "no" } });
  });
  it("danske statusnavne uden at ændre værdierne", () => {
    expect(labelOr(VERIFIED_LABELS, "unverified")).toBe("Ikke verificeret");
    expect(labelOr(VERIFIED_LABELS, "partial")).toBe("Delvist verificeret");
    expect(labelOr(VERIFIED_LABELS, "mærkelig")).toBe("mærkelig");
    expect(labelOr(VERIFIED_LABELS, null)).toBe("Ikke angivet");
  });
});

import { buildProductsQuery, cleanProductSearch, PRODUCT_PAGE } from "./productsLogic.js";
describe("produktlistens forespørgsel", () => {
  it("uden søgning og filtre: de senest opdaterede, 51 rækker (én ekstra viser, at der er flere)", () => {
    const q = buildProductsQuery({});
    expect(q).toContain("order=updated_at.desc.nullslast,id.desc");
    expect(q).toContain(`limit=${PRODUCT_PAGE + 1}`);
    expect(q).not.toContain("or=");
  });
  it("tekst søger i navn og brand; cifre søger også i begyndelsen af EAN; specialtegn fjernes", () => {
    const t = decodeURIComponent(buildProductsQuery({ q: "skyr" }));
    expect(t).toContain("or=(name.ilike.*skyr*,brand.ilike.*skyr*)");
    expect(decodeURIComponent(buildProductsQuery({ q: "5701234" }))).toContain("ean.like.5701234*");
    expect(cleanProductSearch('a,b(c)*"d%')).toBe("a b c d");
    expect(buildProductsQuery({ q: "a,b" })).not.toMatch(/ilike\.\*a,b/);
  });
  it("filtre og sortering sendes til serveren; Open Food Facts omfatter begge kildeværdier", () => {
    const q = decodeURIComponent(buildProductsQuery({ category: "Mejeri & æg", source: "open_food_facts", status: "partial", sort: "name_asc", offset: 50 }));
    expect(q).toContain("category=eq.Mejeri & æg");
    expect(q).toContain("source=in.(open_food_facts,off_import)");
    expect(q).toContain("verified_status=eq.partial");
    expect(q).toContain("order=name.asc,id.asc");
    expect(q).toContain("offset=50");
  });
  it("ukendt kilde eller sortering giver aldrig ugyldige filtre", () => {
    const q = buildProductsQuery({ source: "x", sort: "y" });
    expect(q).not.toContain("source=");
    expect(q).toContain("order=updated_at.desc");
  });
});
