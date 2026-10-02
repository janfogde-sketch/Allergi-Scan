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

  it("finder smørfedt og friske oste (fundet i live-produkter 30. sept.)", () => {
    expect(analyzeIngredients("Rapsolie (95 %), SMØRFEDT (5 %)").maelkeallergi).toBe("yes");
    expect(analyzeIngredients("Hytteost naturel").maelkeallergi).toBe("yes");
    expect(analyzeIngredients("Hytteost naturel").laktose).toBe("yes");
    expect(analyzeIngredients("flødeost, krydderier").maelkeallergi).toBe("yes");
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

describe("sammensatte kornsorter og sammenklistret spor-tekst (2. okt. 2026)", () => {
  it("HAVREgryn, fuldkornsSPELTmel og BYGMALTEKSTRAKT giver gluten", () => {
    expect(analyzeIngredients("HAVREgryn (24%), sukker").gluten).toBe("yes");
    expect(analyzeIngredients("fuldkornsSPELTmel, salt").gluten).toBe("yes");
    expect(analyzeIngredients("sukker, BYGMALTEKSTRAKT, salt").gluten).toBe("yes");
  });
  it('"Kan indeholde spor afæg" (manglende mellemrum) giver æg-spor, men ikke direkte æg', () => {
    expect(analyzeIngredients("sukker, salt. Kan indeholde spor afæg, mælk og soja.").aeg).toBe("traces");
  });
  it("glutenfri havregryn giver stadig ikke gluten", () => {
    expect(analyzeIngredients("glutenfri havregryn, sukker").gluten).not.toBe("yes");
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

describe("gennemgang af 100 produkter (2. okt.)", () => {
  const f = (t) => analyzeIngredients(t);
  it("sammensatte æg-ord fanges", () => {
    expect(f("HVEDEMEL, HELÆGSPULVER, salt").aeg).toBe("yes");
    expect(f("Skrabeæg").aeg).toBe("yes");
    expect(f("pasteuriserede ÆGGEBLOMMER, vand").aeg).toBe("yes");
  });
  it("sulfit som del af ord, tunekstrakt og krebsedyr", () => {
    expect(f("tomater, natriumdisulfit").svovl).toBe("yes");
    expect(f("krydderiblanding (tunekstrakt)").fisk).toBe("yes");
    expect(f("Strandkrabbe (KREBSEDYR), vand").skaldyr).toBe("yes");
  });
  it("mælkesyre og plantedrikke er ikke mælk", () => {
    const v = f("vand, mandelmel, vegansk mælkesyre, E270");
    expect(v.maelkeallergi).toBe("no");
    expect(v.laktose).toBe("no");
    expect(f("kokosmælk 60%, vand").maelkeallergi).toBe("no");
    expect(f("MÆLK, mælkesyrekultur").maelkeallergi).toBe("yes");
  });
  it("lecithin: kilde-angivet solsikke er ikke soja, uspecificeret er spor", () => {
    expect(f("emulgator (solsikke lecithin)").soja).toBe("no");
    expect(f("emulgator (lecithin)").soja).toBe("traces");
    expect(f("emulgator (sojalecithin)").soja).toBe("yes");
  });
  it("'ris mel' er ikke hvede, men mel alene er", () => {
    expect(f("ris mel, ingefær").hvede).toBe("no");
    expect(f("rismel, mel, salt").hvede).toBe("yes");
  });
  it("free from-opremsning negerer", () => {
    const v = f("Rice base, Water. Free from dairy and gluten.");
    expect(v.maelkeallergi).toBe("no");
    expect(v.gluten).toBe("no");
  });
  it("tilsat laktase giver laktose-spor, ikke direkte", () => {
    expect(f("MÆLK, laktaseenzym").laktose).toBe("traces");
    expect(f("MÆLK, laktose").laktose).toBe("yes");
  });
  it("fransk, italiensk og polsk genkendes som ikke-dansk", () => {
    expect(looksNonDanish("Lait de vache pasteurisé, sel, ferments")).toBe(true);
    expect(looksNonDanish("Brocoli. Peut contenir CELERI")).toBe(true);
    expect(looksNonDanish("Selleri, gulerod")).toBe(false);
  });
});

describe("sulfit-ammoniak-karamel (2. okt.)", () => {
  it("giver svovl-spor, ikke direkte svovl", () => {
    expect(analyzeIngredients("vand, farvestof (ammonieret sulfiteret caramel)").svovl).toBe("traces");
    expect(analyzeIngredients("vand, natriumdisulfit").svovl).toBe("yes");
  });
});

describe("sammensatte ost- og bygord (2. okt. 2026)", () => {
  it("OSTEPULVER giver mælk og BYGEKSTRAKT/BYGGRYN giver gluten", () => {
    expect(analyzeIngredients("salt, OSTEPULVER, sukker").maelkeallergi).toBe("yes");
    expect(analyzeIngredients("vand, BYGEKSTRAKT").gluten).toBe("yes");
    expect(analyzeIngredients("vand, byggryn").gluten).toBe("yes");
  });
});
