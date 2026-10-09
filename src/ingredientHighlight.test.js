// @ts-nocheck
// Præcis ingrediensfremhævning (10. okt. 2026): kun det konkrete ingrediensord/udtryk markeres.
import { describe, it, expect } from "vitest";
import { analyzeIngredientTokens } from "./IngredientsList.jsx";
import { ALLERGEN_KEYWORDS } from "./allergenKeywords.js";

const PEPERO = "Glasur (59%): 17% sukker, vegetabilsk olie (palme, solsikke, emulgator (E322 (SOJA)), antioxidant (E306)), 12% kakaotilberedning (85% sødmælkspulver, kakaomasse), kakaomasse, 4,3% laktose (MÆLK), MANDELpulver, emulgatorer (E322 (SOJA), E473), aroma, JORDNØDDEpulver. Kiksestænger (31%): 24% HVEDEMEL, 4,0% sukker, 0,75% sødmælkspulver, 0,62% smør (97% FLØDE, kokosolie), 0,29% fuldkornshvedemel, surhedsregulerende midler (E339, E500, E503), enzympræparat (fugtighedsbevarende middel (E422), vand, konserveringsmiddel (E223 (SULFIT))). Kan indeholde spor af æg og mandler.";
const rule = (id, label, category = "allergy") => ({ keywords: ALLERGEN_KEYWORDS[id], category, label });
const marked = (text, rules) => analyzeIngredientTokens(text, rules).filter(m => m.rule).map(m => text.slice(m.start, m.end));

describe("analyzeIngredientTokens", () => {
  const rules = [rule("hvede", "Hvede"), rule("maelkeallergi", "Mælk"), rule("noedder", "Nødder"), rule("soja", "Soja"), rule("jordnoedder", "Jordnødder"), rule("aeg", "Æg", "trace")];
  const hits = marked(PEPERO, rules);
  it("markerer hele ingrediensordet", () => {
    for (const w of ["MANDELpulver", "JORDNØDDEpulver", "HVEDEMEL", "sødmælkspulver", "fuldkornshvedemel"]) expect(hits).toContain(w);
  });
  it("markerer E322 (SOJA) som ét udtryk", () => {
    expect(hits.filter(h => h === "E322 (SOJA)").length).toBe(2);
  });
  it("markerer aldrig procenter, kommaer eller nabo-ord", () => {
    for (const h of hits) { expect(h).not.toMatch(/%|,/); }
    expect(hits).not.toContain("0,75% sødmælkspulver");
  });
  it("udvider 'laktose (MÆLK)' og kun det", () => {
    expect(hits).toContain("laktose (MÆLK)");
  });
  it("sporsætningen matches kun mod spor-regler", () => {
    expect(hits[hits.length - 1]).toBe("æg");
    expect(hits.includes("mandler")).toBe(false); // nødder er ikke en spor-regel her
  });
  it("uden aktive valg er E-numre neutrale og ingen allergenord markeres", () => {
    const t = analyzeIngredientTokens(PEPERO, []);
    expect(t.every(m => !m.rule)).toBe(true);
    expect(t.some(m => m.kind === "e")).toBe(true);
  });
  it("danske specialtegn og store/små bogstaver", () => {
    expect(marked("Mælkepulver, MÆLKEPROTEIN, Hasselnødder", [rule("maelkeallergi", "Mælk"), rule("noedder", "Nødder")])).toEqual(["Mælkepulver", "MÆLKEPROTEIN", "Hasselnødder"]);
  });
});
