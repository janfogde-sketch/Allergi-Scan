// @ts-nocheck
// Tests for allergenmotoren i supabase/functions/_shared/allergenEngine.js —
// samme kode som edge-functionen "allergens" kører i produktion.
// Hver test svarer til en adfærd, der er vigtig for sikkerheden, eller en
// fejl, der tidligere er fundet i rigtige produkter.
import { describe, it, expect } from "vitest";
import {
  analyzeIngredients,
  isTracesContext,
  isNegated,
  keywordMatch,
  looksNonDanish,
  liftGlutenFromWheat,
  shouldUseClaudeFallback,
  ALL_ALLERGENS,
} from "../supabase/functions/_shared/allergenEngine.js";

describe("analyzeIngredients — grundlæggende", () => {
  it("returnerer en værdi for alle 16 allergener", () => {
    const flags = analyzeIngredients("vand, salt");
    expect(Object.keys(flags).sort()).toEqual([...ALL_ALLERGENS].sort());
    for (const a of ALL_ALLERGENS) expect(flags[a]).toBe("no");
  });

  it("finder direkte ingredienser", () => {
    const flags = analyzeIngredients("Hvedemel, sukker, SKUMMETMÆLKSPULVER, æg, sesamfrø");
    expect(flags.hvede).toBe("yes");
    expect(flags.gluten).toBe("yes");
    expect(flags.maelkeallergi).toBe("yes");
    expect(flags.aeg).toBe("yes");
    expect(flags.sesam).toBe("yes");
    expect(flags.fisk).toBe("no");
  });

  it("matcher flertalsformer (hasselnødder, ticket fra bruger)", () => {
    expect(analyzeIngredients("sukker, hasselnødder, kakao").noedder).toBe("yes");
  });

  it("matcher ikke 'æg' inde i et andet ord", () => {
    expect(keywordMatch("lægemiddel", "æg")).toBe(false);
    expect(analyzeIngredients("sukker, lægemiddelgodkendt farve").aeg).toBe("no");
  });

  it("matcher sammensatte mælkeord som understreng", () => {
    expect(analyzeIngredients("gedemælk, salt").maelkeallergi).toBe("yes");
  });
});

describe("spor (kan indeholde)", () => {
  it("markerer 'kan indeholde spor af' som traces, ikke yes", () => {
    const flags = analyzeIngredients("Sukker, kakaosmør. Kan indeholde spor af hasselnødder og mandler.");
    expect(flags.noedder).toBe("traces");
  });

  it("fanger det sidste allergen i en lang opremsning (25. sept.)", () => {
    const text = "Hvedemel, sukker. Kan indeholde spor af SESAMFRØ, SENNEP, HASSELNØDDER, SELLERI, SULFITTER, SOJA og JORDNØDDER.";
    const flags = analyzeIngredients(text);
    expect(flags.jordnoedder).toBe("traces");
    expect(flags.sesam).toBe("traces");
    expect(flags.soja).toBe("traces");
    expect(flags.hvede).toBe("yes");
  });

  it("lader ikke en spor-sætning smitte en direkte ingrediens i sætningen før", () => {
    const text = "Chokolade, CASHEWNØDDER. Kan indeholde spor af jordnødder.";
    const flags = analyzeIngredients(text);
    expect(flags.noedder).toBe("yes");
    expect(flags.jordnoedder).toBe("traces");
  });

  it("fremhævning med versaler gør ikke et spor til yes", () => {
    const flags = analyzeIngredients("Sukker. Kan indeholde spor af FISK, SOJA og BLØDDYR.");
    expect(flags.fisk).toBe("traces");
    expect(flags.bloeddyr).toBe("traces");
  });

  it("en direkte forekomst opgraderer et tidligere spor til yes", () => {
    const flags = analyzeIngredients("Kan indeholde spor af mælk. Ingredienser: sukker, mælkepulver");
    expect(flags.maelkeallergi).toBe("yes");
  });

  it("isTracesContext ser kun på sætningen med nøgleordet", () => {
    expect(isTracesContext("Mælk. Kan indeholde spor af nødder.", "mælk")).toBe(false);
    expect(isTracesContext("Mælk. Kan indeholde spor af nødder.", "nødder")).toBe(true);
  });
});

describe("negation og laktosefri", () => {
  it("laktosefri mælk: mælkeprotein ja, laktose nej", () => {
    const flags = analyzeIngredients("Laktosefri mælk, enzym (laktase)");
    expect(flags.maelkeallergi).toBe("yes");
    expect(flags.laktose).toBe("no");
  });

  it("'uden mælk' tæller ikke som mælk", () => {
    expect(isNegated("Chokolade uden mælk", "mælk")).toBe(true);
    expect(analyzeIngredients("Chokolade uden mælk").maelkeallergi).toBe("no");
  });

  it("glutenfri tæller ikke som gluten", () => {
    expect(analyzeIngredients("glutenfri havregryn").gluten).not.toBe("yes");
  });
});

describe("E-numre", () => {
  it("E322 giver soja-spor, E220 giver svovl ja", () => {
    const flags = analyzeIngredients("sukker, emulgator (E322), konserveringsmiddel E220");
    expect(flags.soja).toBe("traces");
    expect(flags.svovl).toBe("yes");
  });

  it("E-nummer nedgraderer aldrig et direkte fund", () => {
    const flags = analyzeIngredients("sojalecithin, E322");
    expect(flags.soja).toBe("yes");
  });
});

describe("tyske ingredienslister (30. sept.)", () => {
  it("finder allergener i sammensatte tyske ord", () => {
    const flags = analyzeIngredients("Zutaten: Weizenmehl, Zucker, Vollmilchpulver, Haselnusskerne");
    expect(flags.hvede).toBe("yes");
    expect(flags.maelkeallergi).toBe("yes");
    expect(flags.noedder).toBe("yes");
  });

  it("'Kann Spuren von ... enthalten' er spor", () => {
    const flags = analyzeIngredients("Weizenmehl, Zucker. Kann Spuren von Ei und Erdnüssen enthalten.");
    expect(flags.aeg).toBe("traces");
    expect(flags.jordnoedder).toBe("traces");
    expect(flags.hvede).toBe("yes");
  });

  it("firmanavnet 'Privatmolkerei' er ikke mælk", () => {
    expect(analyzeIngredients("Hergestellt von Privatmolkerei Bauer. Zutaten: Wasser, Salz").maelkeallergi).toBe("no");
  });

  it("laktosefrei nulstiller laktose", () => {
    expect(analyzeIngredients("laktosefreie Milch").laktose).toBe("no");
  });
});

describe("hjælpefunktioner", () => {
  it("liftGlutenFromWheat hæver gluten til hvedes niveau", () => {
    expect(liftGlutenFromWheat({ hvede: "yes", gluten: "no" }).gluten).toBe("yes");
    expect(liftGlutenFromWheat({ hvede: "traces", gluten: "no" }).gluten).toBe("traces");
    expect(liftGlutenFromWheat({ hvede: "no", gluten: "yes" }).gluten).toBe("yes");
  });

  it("looksNonDanish kender tysk og engelsk fra dansk", () => {
    expect(looksNonDanish("Zutaten: Zucker, Weizenmehl")).toBe(true);
    expect(looksNonDanish("Ingredients: sugar, wheat flour")).toBe(true);
    expect(looksNonDanish("Sukker, hvedemel, vand")).toBe(false);
  });

  it("shouldUseClaudeFallback kun ved usikre lister", () => {
    expect(shouldUseClaudeFallback("Sukker, hvedemel, vand")).toBe(false);
    expect(shouldUseClaudeFallback("Zutaten: Zucker, Weizenmehl")).toBe(true);
    expect(shouldUseClaudeFallback("Chokolade uden mælk")).toBe(true);
  });
});
