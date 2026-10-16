import { describe, it, expect } from "vitest";
import { slugify, slugFromTitle, addItem, cleanItem, parseSource, sourceLabel, relationGroup, relationOptions, missingInfo, showField, categoryChangeLoss, buildKnowledgeQuery, entryDirty, validateEntry, fieldLabel, KB_CATEGORIES } from "./knowledgeLogic.js";

describe("kategorier og felter", () => {
  it("alle otte kategorier (inkl. Kost) findes med danske navne", () => {
    expect(KB_CATEGORIES.map(([, l]) => l)).toEqual(["Allergener", "E-numre", "Ingredienser", "Retter og produkter", "Krydsreaktioner", "FAQ", "Sjov viden", "Kost"]);
  });
  it("felter afhænger af kategorien, men data skjules aldrig", () => {
    expect(showField({ category: "faq", found_in: [] }, "found_in")).toBe(false);
    expect(showField({ category: "faq", found_in: ["Brød"] }, "found_in")).toBe(true);
    expect(showField({ category: "ingredient", found_in: [] }, "found_in")).toBe(true);
    expect(showField({ category: "fun_fact", description: "", health_notes: "" }, "health_notes")).toBe(false);
  });
  it("kategoriskift advarer om felter, der ikke hører til den nye kategori og har data", () => {
    expect(categoryChangeLoss({ found_in: ["Brød"], alternatives: [], health_notes: "Noter" }, "faq").sort()).toEqual(["found_in", "health_notes"]);
    expect(categoryChangeLoss({ found_in: [] }, "faq")).toEqual([]);
  });
  it("overskrifter passer til kategorien", () => {
    expect(fieldLabel("faq", "title")).toBe("Spørgsmål");
    expect(fieldLabel("faq", "description")).toBe("Svar");
    expect(fieldLabel("e_number", "found_in")).toBe("Anvendes i");
    expect(fieldLabel("cross_reaction", "health_notes")).toBe("Forbehold");
    expect(fieldLabel("ingredient", "tags")).toBe("Søgetags");
  });
});

describe("slug og lister", () => {
  it("slug dannes af titlen med danske bogstaver", () => {
    expect(slugify("Mælk og æg på frø")).toBe("maelk-og-aeg-paa-froe");
    expect(slugify("  E 100 – Kurkumin! ")).toBe("e-100-kurkumin");
    expect(slugFromTitle("a".repeat(200)).length).toBe(80);
  });
  it("chips: ingen dubletter eller tomme, og værdier med komma bevares som én værdi", () => {
    expect(addItem(["Brød"], " brød ").added).toBe(false);
    expect(addItem(["Brød"], "  ").reason).toBe("empty");
    expect(addItem(["Brød"], "Kage, tør").list).toEqual(["Brød", "Kage, tør"]);
    expect(cleanItem("a   b")).toBe("a b");
  });
  it("kilder: adresse giver udgiver, ældre fritekst bevares", () => {
    expect(parseSource("https://www.sundhed.dk/borger/x")).toEqual({ ok: true, host: "sundhed.dk" });
    expect(parseSource("javascript:alert(1)").ok).toBe(false);
    expect(sourceLabel("Dansk Allergibog 2020")).toBe("Dansk Allergibog 2020");
    expect(sourceLabel("https://www.astma-allergi.dk/a")).toBe("astma-allergi.dk");
  });
});

describe("tilknyttede allergener og tilstande", () => {
  it("allergier, intolerancer og cøliaki er forskellige grupper; ukendt id er 'other'", () => {
    expect(relationGroup("maelkeallergi")).toBe("allergy");
    expect(relationGroup("hvede")).toBe("allergy");
    expect(relationGroup("laktose")).toBe("intolerance");
    expect(relationGroup("gluten")).toBe("intolerance");
    expect(relationGroup("coeliaki")).toBe("condition");
    expect(relationGroup("noget-andet")).toBe("other");
    expect(relationOptions("condition").map((a) => a.id)).toEqual(["coeliaki"]);
    expect(relationOptions("allergy").some((a) => a.id === "laktose")).toBe(false);
  });
});

describe("mangler og validering", () => {
  it("mangler-kontrol følger kategorien", () => {
    expect(missingInfo({ category: "ingredient", summary: "", description: "", sources: [] })).toEqual(["resumé", "beskrivelse", "kilde"]);
    expect(missingInfo({ category: "fun_fact", summary: "x", description: "", sources: ["https://a.dk"] })).toEqual([]);
    expect(missingInfo({ category: "cross_reaction", summary: "x", description: "y", health_notes: "", sources: ["https://a.dk"] })).toEqual(["forbehold"]);
  });
  it("titel og slug er påkrævet, ugyldig slug/kilde afvises, og godkendt kræver resumé og kilde", () => {
    expect(validateEntry({ title: "", slug: "" }, true)).toMatchObject({ title: expect.any(String), slug: expect.any(String) });
    expect(validateEntry({ title: "A", slug: "Æ ø" }, true).slug).toMatch(/små bogstaver/);
    expect(validateEntry({ title: "A", slug: "a", sources: ["https://"] }, false).sources).toBeTruthy();
    expect(validateEntry({ title: "A", slug: "a", sources: ["Bog"] }, false).sources).toBeUndefined();
    expect(validateEntry({ title: "A", slug: "a", editorial_status: "approved", summary: "", sources: [] }, false).editorial_status).toMatch(/resumé og kilde/);
    expect(validateEntry({ title: "A", slug: "a", editorial_status: "approved", summary: "x", sources: ["https://a.dk"] }, false)).toEqual({});
  });
  it("ændringer opdages uden hensyn til mellemrum", () => {
    const a = { title: "A", slug: "a", sources: ["x"], sort_order: 0 };
    expect(entryDirty(a, { ...a, title: " A " })).toBe(false);
    expect(entryDirty(a, { ...a, sources: ["x", "y"] })).toBe(true);
    expect(entryDirty(a, { ...a, editorial_status: "draft" })).toBe(true);
  });
});

describe("listens forespørgsel", () => {
  it("søgning, kategori, mangler og sortering sendes til serveren", () => {
    const q = decodeURIComponent(buildKnowledgeQuery({ q: "mælk", category: "ingredient", missing: "sources", sort: "title" }));
    expect(q).toContain("title.ilike.*mælk*");
    expect(q).toContain('aliases.cs.{"mælk"}');
    expect(q).toContain("category=eq.ingredient");
    expect(q).toContain("sources=eq.{}");
    expect(q).toContain("order=title.asc,id.asc");
  });
  it("specialtegn fjernes, og redaktionelle filtre kræver kolonnerne", () => {
    expect(buildKnowledgeQuery({ q: 'a,b)"' })).not.toMatch(/ilike\.\*a,b/);
    expect(buildKnowledgeQuery({ editorial: "draft" })).not.toContain("editorial_status");
    expect(buildKnowledgeQuery({ editorial: "draft", withEditorial: true })).toContain("editorial_status=eq.draft");
    expect(buildKnowledgeQuery({ editorial: "none", withEditorial: true })).toContain("editorial_status=is.null");
  });
});
