// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// helpers.test.js
// Tests for the safety-critical pure logic in helpers.js: allergen matching,
// diet compatibility, and E-number matching. These functions decide whether
// EatSafe tells a user a product is safe to eat — a bug here is the highest-
// impact kind of bug the app can have.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { DIETS_ENABLED, ALLERGENS, PRODUCT_ALLERGENS } from "./constants.jsx";
import {
  compareAllergens,
  checkDietCompatibility,
  extractENumbers,
  compareENumbers,
  verifiedBadge,
  isValidEanChecksum,
  glutenCerealsIn,
  expandUpcE,
  normalizeScannedBarcode,
} from "./helpers.js";
import { computeTopStatus, evaluateProductForProfiles, verifiedImageUrl, profileConflictLabel, profileWarnLabel, profileMatchLabel, scanTargetCopy, pickDailyTip, localDayNumber, groupHistoryDuplicates, householdToProfiles, isLinkedProfileId, syncLinkedActiveProfiles, buildActiveProfileList, computeProfileResults, LINKED_PROFILE_PREFIX } from "./helpers.js";

describe("isValidEanChecksum", () => {
  it("accepts a real EAN-13 with a correct check digit", () => {
    expect(isValidEanChecksum("4006381333931")).toBe(true);
  });
  it("rejects the same code with the check digit changed", () => {
    expect(isValidEanChecksum("4006381333930")).toBe(false);
  });
  it("rejects a code with the wrong length", () => {
    expect(isValidEanChecksum("123456")).toBe(false);
  });
  it("rejects non-numeric input", () => {
    expect(isValidEanChecksum("400638133393a")).toBe(false);
  });
});

describe("normalizeScannedBarcode", () => {
  it("expands UPC-E to UPC-A for every last-digit rule", () => {
    expect(expandUpcE("01234565")).toBe("012345000065");
    expect(expandUpcE("04252614")).toBe("042100005264");
    expect(expandUpcE("01234133")).toBe("012300000413");
    expect(expandUpcE("01234144")).toBe("012340000014");
    expect(expandUpcE("21234565")).toBe(null);
  });
  it("returns UPC-A for a UPC-E scan, also when EAN-8 checksum fails", () => {
    expect(normalizeScannedBarcode("04252614", "UPC_E")).toBe("042100005264");
    expect(normalizeScannedBarcode("04252614")).toBe("042100005264");
  });
  it("keeps valid EAN-8, EAN-13 and UPC-A as they are", () => {
    expect(normalizeScannedBarcode("96385074", "EAN_8")).toBe("96385074");
    expect(normalizeScannedBarcode("4006381333931", "EAN_13")).toBe("4006381333931");
    expect(normalizeScannedBarcode("036000291452", "UPC_A")).toBe("036000291452");
  });
  it("rejects invalid or unknown codes without throwing", () => {
    expect(normalizeScannedBarcode("4006381333930")).toBe(null);
    expect(normalizeScannedBarcode("hello", "QR_CODE")).toBe(null);
    expect(normalizeScannedBarcode(undefined)).toBe(null);
  });
});

describe("compareAllergens", () => {
  it("is safe when the user has no active allergens", () => {
    const result = compareAllergens({ gluten: "yes" }, []);
    expect(result.status).toBe("safe");
  });

  it("is safe when none of the user's allergens are present", () => {
    const result = compareAllergens({ gluten: "no" }, ["gluten"]);
    expect(result.status).toBe("safe");
    expect(result.matchedDanger).toEqual([]);
  });

  it("flags danger when an active allergen is present (string 'yes', products)", () => {
    const result = compareAllergens({ gluten: "yes" }, ["gluten"]);
    expect(result.status).toBe("danger");
    expect(result.matchedDanger).toEqual(["gluten"]);
  });

  it("flags danger for boolean true (recipes use booleans, not strings)", () => {
    const result = compareAllergens({ gluten: true }, ["gluten"]);
    expect(result.status).toBe("danger");
    expect(result.matchedDanger).toEqual(["gluten"]);
  });

  it("flags warn (traces) when no danger allergen is present", () => {
    const result = compareAllergens({ noedder: "traces" }, ["noedder"]);
    expect(result.status).toBe("warn");
    expect(result.matchedWarning).toEqual(["noedder"]);
  });

  it("danger takes priority over warn when both are present", () => {
    const result = compareAllergens({ gluten: "yes", noedder: "traces" }, ["gluten", "noedder"]);
    expect(result.status).toBe("danger");
    expect(result.matchedDanger).toEqual(["gluten"]);
    expect(result.matchedWarning).toEqual(["noedder"]);
  });

  it("marks hasUnknown and lowers confidence when a flag is unknown/missing", () => {
    const result = compareAllergens({ gluten: "unknown" }, ["gluten"]);
    expect(result.hasUnknown).toBe(true);
    expect(result.confidence).toBe("medium");
  });

  it("has low confidence when there is no allergen data at all", () => {
    const result = compareAllergens({}, ["gluten"]);
    expect(result.confidence).toBe("low");
  });
});

describe("checkDietCompatibility", () => {
  it("vegan: fails on direct milk-protein allergen flag", () => {
    const result = checkDietCompatibility("vegan", { maelkeallergi: "yes" }, "", null);
    expect(result.ok).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/mælkeprotein/i);
  });

  it("vegan: fails on an animal-derived ingredient not covered by allergen flags", () => {
    const result = checkDietCompatibility("vegan", {}, "sukker, honning, salt", null);
    expect(result.ok).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/honning/i);
  });

  it("vegan: passes on a plant-only ingredient list", () => {
    const result = checkDietCompatibility("vegan", {}, "hvedemel, vand, salt, gær", null);
    expect(result.ok).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("gluten-free: fails when the gluten flag is set", () => {
    const result = checkDietCompatibility("gluten-free", { gluten: "yes" }, "", null);
    expect(result.ok).toBe(false);
  });

  it("gluten-free: passes when neither gluten nor hvede flags are set", () => {
    const result = checkDietCompatibility("gluten-free", { gluten: "no" }, "", null);
    expect(result.ok).toBe(true);
    expect(result.confidence).toBe("high");
  });

  it("gluten-free: falls back to ingredient text when the gluten/hvede flags are missing (bekymring fra sikkerhedsgennemgang)", () => {
    const result = checkDietCompatibility("gluten-free", {}, "Hvedemel, vand, salt, gær", null);
    expect(result.ok).toBe(false);
  });

  it("gluten-free: does NOT false-positive on a product explicitly labelled gluten-free (allergen-logik-gennemgang, 16. sept. 2026)", () => {
    // "gluten" er et langt nøgleord (>4 tegn, ren understreng) uden ordgrænse-
    // beskyttelse — uden negations-tjek matchede det tidligere "glutenfri"
    // selv, og fortalte en cøliaki-bruger at et EKSPLICIT glutenfrit produkt
    // "indeholder gluten". Det stik modsatte af hvad emballagen rent faktisk sagde.
    const result = checkDietCompatibility("gluten-free", {}, "Produktet er 100% glutenfrit. Ingredienser: majsstivelse, vand, salt", null);
    expect(result.ok).toBe(true);
  });

  it("gluten-free: does NOT claim high confidence when the flags are unknown and there's no ingredient text to fall back on", () => {
    const result = checkDietCompatibility("gluten-free", { gluten: "unknown" }, "", null);
    expect(result.ok).toBe(true);
    expect(result.confidence).not.toBe("high");
  });

  it("keto: uses nutrition data when available instead of guessing from text", () => {
    const result = checkDietCompatibility("keto", {}, "", { carbohydrates: 25 });
    expect(result.ok).toBe(false);
    expect(result.confidence).toBe("medium");
  });

  it("keto: returns null (unknown) rather than a guess when no data exists at all", () => {
    const result = checkDietCompatibility("keto", {}, "", null);
    expect(result.ok).toBe(null);
  });

  it("keto: does NOT false-positive on 'rismel' just because it contains 'mel'", () => {
    // Regression guard: "mel" is a short (<=4 char) keyword and must only match
    // as a whole word, not as a substring of an unrelated word like "rismel".
    const result = checkDietCompatibility("keto", {}, "rismel, vand, salt", null);
    expect(result.reasons.some(r => r.includes("mel"))).toBe(false);
  });

  it("keto: DOES flag plain 'mel' as a keto-breaker when it appears as its own word", () => {
    const result = checkDietCompatibility("keto", {}, "mel, vand, salt", null);
    expect(result.ok).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/mel/);
  });

  it("returns null/low-confidence for an unrecognized diet id", () => {
    const result = checkDietCompatibility("not-a-real-diet", {}, "", null);
    expect(result.ok).toBe(null);
    expect(result.confidence).toBe("low");
  });
});

describe("extractENumbers", () => {
  it("extracts and normalizes E-numbers from free text", () => {
    expect(extractENumbers("Indeholder E220 og E-330 samt e 621")).toEqual(["E220", "E330", "E621"]);
  });

  it("returns an empty array for text with no E-numbers", () => {
    expect(extractENumbers("Mel, vand, salt")).toEqual([]);
  });

  it("returns an empty array for empty/missing text", () => {
    expect(extractENumbers("")).toEqual([]);
    expect(extractENumbers(null)).toEqual([]);
  });
});

describe("compareENumbers", () => {
  it("flags a match between product and watched E-numbers", () => {
    const result = compareENumbers(["E220", "E330"], ["e220"]);
    expect(result.status).toBe("warn");
    expect(result.matched).toEqual(["e220"]);
  });

  it("is safe when there is no overlap", () => {
    const result = compareENumbers(["E330"], ["E220"]);
    expect(result.status).toBe("safe");
    expect(result.matched).toEqual([]);
  });

  it("is safe when the user isn't watching any E-numbers", () => {
    const result = compareENumbers(["E220"], []);
    expect(result.status).toBe("safe");
  });
});

describe("verifiedBadge", () => {
  it("labels producer-verified data as the highest trust tier", () => {
    expect(verifiedBadge("verified", null).label).toBe("Fra producent");
    expect(verifiedBadge(null, "producer").label).toBe("Fra producent");
  });

  it("labels Open Food Facts data distinctly", () => {
    expect(verifiedBadge(null, "off").label).toBe("Open Food Facts");
  });

  it("marks Bilka/nemlig imports as store data, not user-submitted", () => {
    expect(verifiedBadge(null, "bilka").label).toBe("Produktdata");
    expect(verifiedBadge("unverified", "nemlig").label).toBe("Produktdata");
  });

  it("falls back to user-submitted for anything else", () => {
    expect(verifiedBadge(null, null).label).toBe("Bruger-indsendt");
  });
});

// ─── QA 28. sept. 2026: falske "ingen advarsler" (Q1/Q2/Q3) ─────────────────
import { effectiveAllergenFlag, looksNonDanishIngredients, normalizeProductFlags, computeProfileResults as cpr } from "./helpers.js";

const ALL_NO = { gluten:"no", hvede:"no", maelkeallergi:"no", laktose:"no", noedder:"no", jordnoedder:"no", soja:"no", sesam:"no" };

describe("hvede tæller som gluten (Q3)", () => {
  it("effectiveAllergenFlag løfter gluten til hvedes værdi", () => {
    expect(effectiveAllergenFlag({ gluten:"no", hvede:"yes" }, "gluten")).toBe("yes");
    expect(effectiveAllergenFlag({ gluten:"no", hvede:"traces" }, "gluten")).toBe("traces");
    expect(effectiveAllergenFlag({ gluten:"yes", hvede:"traces" }, "gluten")).toBe("yes");
    expect(effectiveAllergenFlag({ gluten:"yes", hvede:"no" }, "hvede")).toBe("no");
  });
  it("gluten-bruger advares om Nestlé-bar med hvede=yes, gluten=no", () => {
    expect(compareAllergens({ ...ALL_NO, hvede:"yes" }, ["gluten"]).status).toBe("danger");
    expect(compareAllergens({ ...ALL_NO, hvede:"traces" }, ["gluten"]).status).toBe("warn");
  });
});

describe("looksNonDanishIngredients (Q1)", () => {
  it("genkender tysk, svensk og engelsk", () => {
    expect(looksNonDanishIngredients("Zucker, Vollmilchpulver, Kakaobutter, Haselnüsse (10%), Weizenmehl")).toBe(true);
    expect(looksNonDanishIngredients("Mjölk, mjölksyrakultur, laktasenzym")).toBe(true);
    expect(looksNonDanishIngredients("sugar, wheat flour, salt")).toBe(true);
    expect(looksNonDanishIngredients("wheat 95%,")).toBe(true);
  });
  it("lader danske og blandede danske lister være", () => {
    expect(looksNonDanishIngredients("Sukker, kakaosmør, SKUMMETMÆLKSPULVER, emulgator (SOJALECITHINER)")).toBe(false);
    expect(looksNonDanishIngredients("socker/sukker, VETEmjöl/HVEDE-/HVETEMEL, skumMJÖLKS-/SKUMMETMÆLKS")).toBe(false);
    expect(looksNonDanishIngredients("220 g løg, 44 g palmeolie, 31 g hvedemel, salt.")).toBe(false);
    expect(looksNonDanishIngredients("")).toBe(false);
  });
});

describe("normalizeProductFlags (Q1/Q2)", () => {
  it("uden ingrediensliste bliver 'no' til 'unknown' (Kartoffel Sandwichbrød)", () => {
    const f = normalizeProductFlags(ALL_NO, { ingredientsText: null });
    expect(f.gluten).toBe("unknown");
    expect(compareAllergens(f, ["gluten"]).hasUnknown).toBe(true);
  });
  it("pladsholderen 'Ingen ingrediensliste' tæller ikke som data", () => {
    expect(normalizeProductFlags(ALL_NO, { ingredientsText: "Ingen ingrediensliste" }).noedder).toBe("unknown");
  });
  it("tysk liste uden AI-læsning bliver 'unknown' (Lindt), men 'yes' bevares", () => {
    const f = normalizeProductFlags({ ...ALL_NO, soja:"yes" }, { ingredientsText: "Zucker, Haselnüsse, Weizenmehl" });
    expect(f.noedder).toBe("unknown");
    expect(f.soja).toBe("yes");
  });
  it("stoler på verificerede og Claude-læste flag", () => {
    expect(normalizeProductFlags(ALL_NO, { ingredientsText: "", verifiedStatus: "verified" }).gluten).toBe("no");
    expect(normalizeProductFlags(ALL_NO, { ingredientsText: "Zucker, Weizenmehl", sourceMethod: "keyword+claude" }).gluten).toBe("no");
  });
  it("kvalitet 'high' redder ikke et produkt uden ingrediensliste", () => {
    expect(normalizeProductFlags(ALL_NO, { ingredientsText: "Ingen ingrediensliste", quality: "high" }).gluten).toBe("unknown");
  });
  it("dansk liste er uændret", () => {
    expect(normalizeProductFlags(ALL_NO, { ingredientsText: "Sukker, rismel, salt" }).gluten).toBe("no");
  });
  it("retter gluten ud fra hvede i selve flag-objektet", () => {
    expect(normalizeProductFlags({ ...ALL_NO, hvede:"yes" }, { ingredientsText: "hvedemel, sukker" }).gluten).toBe("yes");
  });
});

describe("computeProfileResults: ukendt er ikke sikkert", () => {
  it("giver 'warn' når en valgt allergi er ukendt", () => {
    const [r] = cpr([{ id:"me", name:"Åse", allergens:["gluten"] }], { allergen_flags: { gluten:"unknown" }, ingredients:"" });
    expect(r.status).toBe("warn");
  });
  it("giver 'danger' for hvede når profilen har gluten", () => {
    const [r] = cpr([{ id:"me", name:"Åse", allergens:["gluten"] }], { allergen_flags: { gluten:"no", hvede:"yes" }, ingredients:"hvedemel" });
    expect(r.status).toBe("danger");
  });
});

import { passwordErrorText } from "./helpers.js";

describe("passwordErrorText", () => {
  it("godkender en kode der opfylder alle krav", () => {
    expect(passwordErrorText("MinKode2026abc")).toBe("");
  });
  it("giver én kort, situationsbestemt tekst: tom kode, eller kravene, når noget mangler", () => {
    expect(passwordErrorText("")).toBe("Indtast en adgangskode.");
    const krav = "Brug mindst 10 tegn med store og små bogstaver og mindst ét tal.";
    expect(passwordErrorText("minhemmeligekode")).toBe(krav);
    expect(passwordErrorText("Kort1")).toBe(krav);
    expect(passwordErrorText("abc")).toBe(krav);
  });
  it("tæller æ, ø og å som bogstaver", () => {
    expect(passwordErrorText("Rødgrødmedfløde1")).toBe("");
  });
  it("beder om en kode når feltet er tomt", () => {
    expect(passwordErrorText("")).toBe("Indtast en adgangskode.");
  });
});

describe("profileConflictLabel", () => {
  const r = (name, status, id = name) => ({ id, name, status });
  it("returns null when nobody has a conflict", () => {
    expect(profileConflictLabel([r("Jan Fogde", "warn", "me"), r("Mia", "safe")])).toBeNull();
  });
  it("siger 'Konflikt med din profil', når kun brugeren selv har konflikt", () => {
    expect(profileConflictLabel([r("Jan Fogde", "danger", "me")])).toBe("Konflikt med din profil");
    expect(profileConflictLabel([r("Jan Fogde", "danger", "me"), r("Mia", "safe")])).toBe("Konflikt med din profil");
  });
  it("navngiver andre profiler med konflikt", () => {
    expect(profileConflictLabel([r("Jan Fogde", "warn", "me"), r("Mia Hansen", "danger")])).toBe("Konflikt for Mia");
    expect(profileConflictLabel([r("Jan", "danger", "me"), r("Mia", "danger")])).toBe("Konflikt for dig, Mia");
  });
  it("falder tilbage til den generelle tekst over maxNames", () => {
    expect(profileConflictLabel([r("A", "danger"), r("B", "danger"), r("C", "danger")], { maxNames: 2 })).toBe("Konflikt med din profil");
  });
});

describe("profileWarnLabel", () => {
  const r = (extra) => ({ name: "A", status: "warn", warning: [], unknown: [], insufficient: [], ...extra });
  it("returnerer null uden advarsler", () => {
    expect(profileWarnLabel([{ name: "A", status: "safe" }])).toBeNull();
  });
  it("siger 'Kan indeholde spor' ved spor, også når en anden profil mangler data", () => {
    expect(profileWarnLabel([r({ unknown: ["sesam"] }), r({ warning: ["noedder"] })])).toBe("Kan indeholde spor");
  });
  it("siger 'Kan ikke vurderes' ved manglende data og aldrig 'sikkert'", () => {
    const label = profileWarnLabel([r({ unknown: ["sesam"] })]);
    expect(label).toBe("Kan ikke vurderes");
    expect(label).not.toMatch(/sikker/i);
    expect(profileWarnLabel([r({ insufficient: ["Ingrediensliste mangler"] })])).toBe("Kan ikke vurderes");
  });
});

describe("profileMatchLabel", () => {
  it("er altid den samme grønne tekst", () => {
    expect(profileMatchLabel([{ id: "me", name: "Lars" }])).toBe("Ingen registrerede konflikter");
    expect(profileMatchLabel([])).toBe("Ingen registrerede konflikter");
  });
});

describe("evaluateProductForProfiles (fælles statussystem)", () => {
  const prof = (extra = {}) => ({ id: "me", name: "Mia", allergens: ["aeg"], custom: [], diets: [], eNumbers: [], levels: {}, ...extra });
  const flags = (o = {}) => ({ aeg: "no", ...o });
  it("rød ved direkte indhold med konkret årsag", () => {
    const ev = evaluateProductForProfiles([prof()], { allergen_flags: flags({ aeg: "yes" }), ingredients_text: "Æg, mel" });
    expect(ev.level).toBe("danger");
    expect(ev.label).toBe("Konflikt med din profil");
    expect(ev.reasons).toContain("Indeholder æg");
  });
  it("orange ved spor med konkret årsag", () => {
    const ev = evaluateProductForProfiles([prof()], { allergen_flags: flags({ aeg: "traces" }), ingredients_text: "Mel" });
    expect(ev.level).toBe("warn");
    expect(ev.label).toBe("Kan indeholde spor");
    expect(ev.reasons).toEqual(["Spor af æg"]);
  });
  it("direkte konflikt vinder over spor, men sporene vises stadig", () => {
    const ev = evaluateProductForProfiles([prof({ allergens: ["aeg", "noedder"] })], { allergen_flags: flags({ aeg: "yes", noedder: "traces" }), ingredients_text: "Æg" });
    expect(ev.level).toBe("danger");
    expect(ev.reasons).toEqual(expect.arrayContaining(["Indeholder æg", "Spor af nødder"]));
  });
  it("overvåget E-nummer er en konflikt (rød)", () => {
    const ev = evaluateProductForProfiles([prof({ allergens: [], eNumbers: ["E120"] })], { ingredients_text: "Farve (E120), sukker" });
    expect(ev.level).toBe("danger");
    expect(ev.reasons).toContain("Indeholder E120");
  });
  it("grøn kun med tilstrækkelige data", () => {
    expect(evaluateProductForProfiles([prof()], { allergen_flags: flags(), ingredients_text: "Mel" }).level).toBe("safe");
  });
  it("aldrig grøn uden data: grå 'Kan ikke vurderes'", () => {
    const ev = evaluateProductForProfiles([prof()], { name: "X" });
    expect(ev.level).toBe("unknown");
    expect(ev.label).toBe("Kan ikke vurderes");
    expect(ev.missing.length).toBeGreaterThan(0);
  });
  it("E-nummer-valg uden ingrediensliste kan ikke vurderes, selv om allergenflag findes", () => {
    const ev = evaluateProductForProfiles([prof({ eNumbers: ["E120"] })], { allergen_flags: flags() });
    expect(ev.level).toBe("unknown");
    expect(ev.missing).toContain("Ingrediensliste mangler");
  });
  it("tom profil uden valg har intet at kontrollere", () => {
    expect(evaluateProductForProfiles([prof({ allergens: [] })], { name: "X" }).level).toBe("safe");
  });
});

describe("verifiedImageUrl", () => {
  const off = "https://images.openfoodfacts.org/images/products/571/101/803/7944/front_da.4.400.jpg";
  it("viser OFF-billede kun ved EAN-match", () => {
    expect(verifiedImageUrl({ ean: "5711018037944", image_url: off })).toBe(off);
    expect(verifiedImageUrl({ ean: "5711018037951", image_url: off })).toBeNull();
  });
  it("kan ikke verificere produkter uden rigtig stregkode", () => {
    expect(verifiedImageUrl({ ean: "NEMLIG-5063887", image_url: off })).toBeNull();
  });
  it("lader billeder fra andre kilder passere og håndterer tomme", () => {
    expect(verifiedImageUrl({ ean: "NEMLIG-1", image_url: "https://example.com/a.jpg" })).toBe("https://example.com/a.jpg");
    expect(verifiedImageUrl({ ean: "1", image_url: "" })).toBeNull();
  });
});

describe("husstandskonti som skrivebeskyttede profiler", () => {
  const jan = { id: "u-jan", name: "Jan Fogde", email: "jan@x.dk", allergens: ["maelkeallergi"], custom: ["kiwi"], diets: ["vegetarian"], eNumbers: ["E150"], canRemove: false };
  it("mapper en konto til en profil med præfikset id, læse-flag og alle felter", () => {
    const [p] = householdToProfiles([jan]);
    expect(p.id).toBe(`${LINKED_PROFILE_PREFIX}u-jan`);
    expect(p).toMatchObject({ name: "Jan Fogde", allergens: ["maelkeallergi"], custom: ["kiwi"], diets: DIETS_ENABLED ? ["vegetarian"] : [], eNumbers: ["E150"], linked: true, readOnly: true });
    expect(typeof p.color).toBe("string");
  });
  it("falder tilbage til e-mailens lokale del, når kontoen ingen navn har", () => {
    expect(householdToProfiles([{ id: "u2", email: "mia@x.dk" }])[0].name).toBe("mia");
    expect(householdToProfiles([{ id: "u3" }])[0].name).toBe("Familiemedlem");
    expect(householdToProfiles(undefined)).toEqual([]);
  });
  it("genkender husstandsid'er og aldrig oprettede profilers uuid eller 'me'", () => {
    expect(isLinkedProfileId("acct:u-jan")).toBe(true);
    expect(isLinkedProfileId("me")).toBe(false);
    expect(isLinkedProfileId("3f2c1c1e-0000-4000-8000-000000000000")).toBe(false);
    expect(isLinkedProfileId(undefined)).toBe(false);
  });
  it("indgår i scanningsresultatet som en profil, når den er valgt", () => {
    const linked = householdToProfiles([jan]);
    const profiles = buildActiveProfileList({ user: { name: "Bjørn" }, family: linked, allergens: [], customAllerg: [], selectedENumbers: [], activeProfiles: ["me", "acct:u-jan"] });
    expect(profiles.map(p => p.name)).toEqual(["Bjørn", "Jan Fogde"]);
    const results = computeProfileResults(profiles, { allergen_flags: { maelkeallergi: "yes" }, ingredients: "", nutrition: null, productENumbers: [] });
    expect(results.find(r => r.name === "Jan Fogde").status).toBe("danger");
    expect(results.find(r => r.name === "Bjørn").status).not.toBe("danger");
  });
  describe("syncLinkedActiveProfiles", () => {
    it("vælger nye husstandskonti som standard og beholder øvrige valg", () => {
      expect(syncLinkedActiveProfiles(["me", "fam-1"], ["acct:a"], [])).toEqual(["me", "fam-1", "acct:a"]);
    });
    it("tilføjer ikke igen en konto, som brugeren selv har fravalgt (kendt fra før)", () => {
      expect(syncLinkedActiveProfiles(["me"], ["acct:a"], ["acct:a"])).toEqual(["me"]);
    });
    it("fjerner valg af konti, der ikke længere er i husstanden", () => {
      expect(syncLinkedActiveProfiles(["me", "acct:gone", "acct:a"], ["acct:a"], ["acct:gone", "acct:a"])).toEqual(["me", "acct:a"]);
    });
    it("giver samme array tilbage, når intet ændres (ingen unødig gen-rendering)", () => {
      const a = ["me", "acct:a"];
      expect(syncLinkedActiveProfiles(a, ["acct:a"], ["acct:a"])).toBe(a);
    });
  });
});

describe("kostpræferencer på pause (DIETS_ENABLED)", () => {
  it("er slået fra, og profilernes diæter er tomme, selvom de er gemt", async () => {
    const { visibleDiets } = await import("./helpers.js");
    expect(DIETS_ENABLED).toBe(false);
    expect(visibleDiets(["vegan", "gluten-free"])).toEqual([]);
    expect(visibleDiets(undefined)).toEqual([]);
    const list = buildActiveProfileList({
      user: { name: "Jan", diets: ["vegan"] }, family: [{ id: "f1", name: "Oskar", diets: ["keto"] }],
      allergens: [], customAllerg: [], selectedENumbers: [], activeProfiles: ["me", "f1"],
    });
    expect(list.map(p => p.diets)).toEqual([[], []]);
  });
});

describe("følsomhed pr. allergen (spor)", () => {
  const flags = { maelkeallergi: "traces", aeg: "yes", soja: "traces" };

  it("strict (standard): spor er en advarsel", async () => {
    const { compareAllergens } = await import("./helpers.js");
    const r = compareAllergens({ maelkeallergi: "traces" }, ["maelkeallergi"]);
    expect(r.status).toBe("warn");
    expect(r.matchedWarning).toEqual(["maelkeallergi"]);
    expect(r.ignoredTraces).toEqual([]);
  });

  it("direct_only: spor flagges ikke, men returneres som ignoredTraces; direkte indhold flagges stadig", async () => {
    const { compareAllergens } = await import("./helpers.js");
    const lv = { maelkeallergi: "direct_only" };
    const only = compareAllergens({ maelkeallergi: "traces" }, ["maelkeallergi"], lv);
    expect(only.status).toBe("safe");
    expect(only.matchedWarning).toEqual([]);
    expect(only.ignoredTraces).toEqual(["maelkeallergi"]);
    const direct = compareAllergens({ maelkeallergi: "yes" }, ["maelkeallergi"], lv);
    expect(direct.status).toBe("danger");
    const mixed = compareAllergens(flags, ["maelkeallergi", "soja"], lv);
    expect(mixed.matchedWarning).toEqual(["soja"]);
    expect(mixed.status).toBe("warn");
  });

  it("mergeAllergenLevels: strengeste profil vinder", async () => {
    const { mergeAllergenLevels } = await import("./helpers.js");
    const a = { allergens: ["maelkeallergi", "aeg"], levels: { maelkeallergi: "direct_only", aeg: "direct_only" } };
    const b = { allergens: ["aeg"], levels: {} };
    expect(mergeAllergenLevels([a, b])).toEqual({ maelkeallergi: "direct_only" });
    expect(mergeAllergenLevels([a])).toEqual({ maelkeallergi: "direct_only", aeg: "direct_only" });
    expect(mergeAllergenLevels([])).toEqual({});
  });

  it("computeProfileResults: ignorerede spor giver ingen advarsel og ingen årsag, men ignoredTraces", () => {
    const [strict, tolerant] = computeProfileResults(
      [
        { id: "a", allergens: ["maelkeallergi"], levels: {}, custom: [], diets: [], eNumbers: [] },
        { id: "b", allergens: ["maelkeallergi"], levels: { maelkeallergi: "direct_only" }, custom: [], diets: [], eNumbers: [] },
      ],
      { allergen_flags: { maelkeallergi: "traces" }, ingredients: "sukker", nutrition: {}, productENumbers: [] },
    );
    expect(strict.status).toBe("warn");
    expect(strict.warning).toEqual(["maelkeallergi"]);
    expect(tolerant.status).toBe("safe");
    expect(tolerant.reasons).toEqual([]);
    expect(tolerant.ignoredTraces).toEqual(["maelkeallergi"]);
  });

  it("spor er gult (ikke rødt) på produktsiden; kun direkte indhold giver allergi-advarsel", async () => {
    const { categorizeProductFindings, computeTopStatus } = await import("./helpers.js");
    const f = categorizeProductFindings({ matchedDanger: [], matchedWarning: ["maelkeallergi"], ignoredTraces: ["soja"], customAllergenMatches: [], matchedENumbers: [], dietResults: [] });
    expect(f.allergyMatches).toEqual([]);
    expect(f.traceMatches.map(m => m.id)).toEqual(["maelkeallergi"]);
    expect(f.ignoredTraceMatches.map(m => m.id)).toEqual(["soja"]);
    const top = computeTopStatus({ hasSufficientData: true, ...f });
    expect(top.level).toBe("warn");
    expect(top.headline).toBe("Kan indeholde spor");
    const direct = categorizeProductFindings({ matchedDanger: ["maelkeallergi"], matchedWarning: ["soja"], ignoredTraces: [], customAllergenMatches: [], matchedENumbers: [], dietResults: [] });
    expect(computeTopStatus({ hasSufficientData: true, ...direct }).level).toBe("danger");
    const onlyIgnored = categorizeProductFindings({ matchedDanger: [], matchedWarning: [], ignoredTraces: ["soja"], customAllergenMatches: [], matchedENumbers: [], dietResults: [] });
    expect(computeTopStatus({ hasSufficientData: true, ...onlyIgnored }).level).toBe("safe");
  });

  it("for lidt data giver 'Kan ikke vurderes' (aldrig et positivt resultat), men et fund vinder stadig", async () => {
    const { categorizeProductFindings, computeTopStatus } = await import("./helpers.js");
    const none = categorizeProductFindings({ matchedDanger: [], matchedWarning: [], ignoredTraces: [], customAllergenMatches: [], matchedENumbers: [], dietResults: [] });
    const top = computeTopStatus({ hasSufficientData: false, ...none });
    expect(top.level).toBe("unknown");
    expect(top.headline).toBe("Kan ikke vurderes");
    const found = categorizeProductFindings({ matchedDanger: ["maelkeallergi"], matchedWarning: [], ignoredTraces: [], customAllergenMatches: [], matchedENumbers: [], dietResults: [] });
    expect(computeTopStatus({ hasSufficientData: false, ...found }).level).toBe("danger");
  });
});

describe("Cøliaki som eget valg", () => {
  it("vurderes mod produktets gluten- og hvedeflag, aldrig udledt af dem i profilen", () => {
    expect(effectiveAllergenFlag({ gluten:"yes" }, "coeliaki")).toBe("yes");
    expect(effectiveAllergenFlag({ gluten:"no", hvede:"traces" }, "coeliaki")).toBe("traces");
    expect(effectiveAllergenFlag({ gluten:"no", hvede:"no" }, "coeliaki")).toBe("no");
    expect(effectiveAllergenFlag({}, "coeliaki")).toBeUndefined();
  });
  it("compareAllergens: gluten giver fare, spor advarer som standard, og ukendt kan ikke afgøres", () => {
    expect(compareAllergens({ ...ALL_NO, gluten:"yes" }, ["coeliaki"]).status).toBe("danger");
    expect(compareAllergens({ ...ALL_NO, gluten:"traces" }, ["coeliaki"]).status).toBe("warn");
    expect(compareAllergens({ ...ALL_NO, hvede:"yes" }, ["coeliaki"]).matchedDanger).toEqual(["coeliaki"]);
    expect(compareAllergens({ gluten:"unknown" }, ["coeliaki"]).hasUnknown).toBe(true);
  });
  it("Kun ved ingrediens ignorerer spor for Cøliaki", () => {
    const r = compareAllergens({ ...ALL_NO, gluten:"traces" }, ["coeliaki"], { coeliaki: "direct_only" });
    expect(r.status).toBe("safe");
    expect(r.ignoredTraces).toEqual(["coeliaki"]);
  });
  it("Gluten eller Hvede alene giver ikke Cøliaki i profilens resultat", () => {
    const [r] = cpr([{ id:"me", name:"Åse", allergens:["gluten"] }], { allergen_flags: { ...ALL_NO, gluten:"yes" }, ingredients:"hvedemel" });
    expect(r.danger).toEqual(["gluten"]);
  });
  it("er kun et profilvalg: findes ikke som produktflag", () => {
    expect(ALLERGENS.find(a => a.id === "coeliaki")?.profileOnly).toBe(true);
    expect(PRODUCT_ALLERGENS.some(a => a.id === "coeliaki")).toBe(false);
  });
});

describe("pladsholder-ingredienser og laktosefri-navn (2. okt.)", () => {
  it("ingrediensfelt = produktnavn er ingen liste, så 'no' bliver 'unknown'", () => {
    const f = normalizeProductFlags(ALL_NO, { ingredientsText: "Skrabeæg 8 M/L", productName: "Skrabeæg 8 M/L" });
    expect(f.soja).toBe("unknown");
  });
  it("en rigtig, kort liste bevares", () => {
    expect(normalizeProductFlags(ALL_NO, { ingredientsText: "Grisekød.", productName: "Hakket grisekød 12-17% øko." }).soja).toBe("no");
  });
  it("laktosefri i navnet fjerner laktose-flaget, men ikke mælkeprotein", () => {
    const f = normalizeProductFlags({ ...ALL_NO, laktose: "yes", maelkeallergi: "yes" }, { ingredientsText: "LETMÆLK, laktaseenzym", productName: "Yoghurt laktosefri" });
    expect(f.laktose).toBe("no");
    expect(f.maelkeallergi).toBe("yes");
  });
});

describe("glutenCerealsIn", () => {
  it("finder havre, byg og spelt i sammensatte ord, men ikke i spor-sætningen", () => {
    expect(glutenCerealsIn("HAVREgryn (24%), sukker, BYGMALTEKSTRAKT, fuldkornsSPELTmel. Kan indeholde spor af rug")).toEqual(["byg", "havre", "spelt"]);
    expect(glutenCerealsIn("sukker, salt")).toEqual([]);
    expect(glutenCerealsIn("")).toEqual([]);
  });
});

describe("findProductOnList", () => {
  const items = [
    { id: "1", name: "Harboe Cola", ean: "5701234567890", product_id: null, checked: false },
    { id: "2", name: "Havregryn", ean: null, product_id: "p-2", checked: true },
  ];
  it("matcher på EAN uanset navn", async () => {
    const { findProductOnList } = await import("./helpers.js");
    expect(findProductOnList(items, { code: "5701234567890", name: "Cola" })?.id).toBe("1");
  });
  it("matcher på produkt-id og finder også købte varer", async () => {
    const { findProductOnList } = await import("./helpers.js");
    expect(findProductOnList(items, { code: "999", id: "p-2", name: "Andet" })?.checked).toBe(true);
  });
  it("matcher ikke kun på navn, når produktet har EAN", async () => {
    const { findProductOnList } = await import("./helpers.js");
    expect(findProductOnList(items, { code: "111", name: "Harboe Cola" })).toBeNull();
    expect(findProductOnList([], { code: "111" })).toBeNull();
  });
});

describe("scanTargetCopy", () => {
  const family = [{ id: "f1", name: "Valdemar Jensen" }, { id: "f2", name: "Bjørn" }, { id: "acct:9", name: "Jan" }];
  it("kun brugeren selv", () => {
    expect(scanTargetCopy(["me"], family)).toEqual({ chip: "Dig", intro: "Scan et produkt og se straks, om det passer til dine allergier og præferencer." });
    expect(scanTargetCopy(["me"], []).chip).toBe("Dig");
    expect(scanTargetCopy([], family).chip).toBe("Dig");
  });
  it("én anden person, med fornavn", () => {
    expect(scanTargetCopy(["f1"], family)).toEqual({ chip: "Valdemar", intro: "Scan et produkt og se straks, om det passer til Valdemar." });
  });
  it("flere personer tælles, også brugeren selv", () => {
    expect(scanTargetCopy(["me", "f1", "acct:9"], family)).toEqual({ chip: "3 personer", intro: "Scan et produkt og se straks, om det passer til de valgte personer." });
    expect(scanTargetCopy(["f1", "f2"], family).chip).toBe("2 personer");
  });
  it("ignorerer ukendte id'er og dubletter", () => {
    expect(scanTargetCopy(["f1", "gone", "f1"], family).chip).toBe("Valdemar");
    expect(scanTargetCopy(["me", "gone"], family).chip).toBe("Dig");
  });
});

describe("pickDailyTip", () => {
  const entries = [
    { slug: "maelkeallergi", allergen_ids: ["maelkeallergi"], tips: ["M1", "M2"] },
    { slug: "sesam", allergen_ids: ["sesam"], tips: ["S1"] },
    { slug: "faq-oko", allergen_ids: [], tips: ["G1"] },
    { slug: "fun-parmesan", allergen_ids: null, tips: ["G2"] },
    { slug: "tom", allergen_ids: [], tips: null },
  ];
  it("viser kun generelle tips uden valgte allergener", () => {
    for (let d = 0; d < 6; d++) expect(["G1", "G2"]).toContain(pickDailyTip(entries, [], d).text);
  });
  it("viser aldrig tips for allergener, ingen har valgt", () => {
    for (let d = 0; d < 9; d++) expect(pickDailyTip(entries, ["maelkeallergi"], d).text).not.toBe("S1");
  });
  it("relevante to ud af tre dage og rotation gennem alle relevante", () => {
    const seen = [0, 1, 2, 3, 4, 5].map(d => pickDailyTip(entries, ["maelkeallergi", "sesam"], d).text);
    expect(seen[2]).toMatch(/^G/);
    expect(seen[5]).toMatch(/^G/);
    expect(new Set([seen[0], seen[1], seen[3], seen[4]])).toEqual(new Set(["M1", "M2", "S1"]));
  });
  it("samme dag giver samme tip, og link-slug følger med", () => {
    const a = pickDailyTip(entries, ["sesam"], 7), b = pickDailyTip(entries, ["sesam"], 7);
    expect(a).toEqual(b);
    expect(pickDailyTip(entries, ["sesam"], 0)).toEqual({ slug: "sesam", text: "S1", allergenIds: ["sesam"] });
  });
  it("ingen tips giver null", () => {
    expect(pickDailyTip([], ["sesam"], 1)).toBeNull();
  });
  it("dagsnummer skifter ved lokal midnat", () => {
    expect(localDayNumber(new Date(2026, 9, 4, 23, 59))).toBe(localDayNumber(new Date(2026, 9, 4, 0, 1)));
    expect(localDayNumber(new Date(2026, 9, 5, 0, 1))).toBe(localDayNumber(new Date(2026, 9, 4, 12)) + 1);
  });
});

describe("groupHistoryDuplicates", () => {
  const at = min => new Date(Date.UTC(2026, 9, 5, 8, 0) - min * 60000).toISOString();
  const cola = (min, extra = {}) => ({ id: `c${min}`, ean_scanned: "5740", product_id: "p1", user_id: "u1", active_profiles: ["f1"], result: "safe", flags_triggered: { milk: false }, scanned_at: at(min), ...extra });
  it("samler ens scanninger og beholder den nyeste", () => {
    const out = groupHistoryDuplicates([cola(0), cola(2), cola(10, { active_profiles: ["f1"] })]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("c0");
    expect(out[0].__count).toBe(3);
  });
  it("samler også ens scanninger med mange timer imellem", () => {
    const out = groupHistoryDuplicates([cola(0), cola(60 * 21), cola(60 * 30)]);
    expect(out).toHaveLength(1);
    expect(out[0].__count).toBe(3);
  });
  it("profilrækkefølge og flag-nøglers rækkefølge er ligegyldig", () => {
    const a = cola(0, { active_profiles: ["me", "f1"], flags_triggered: { a: true, b: false } });
    const b = cola(1, { active_profiles: ["f1", "me"], flags_triggered: { b: false, a: true } });
    expect(groupHistoryDuplicates([a, b])).toHaveLength(1);
  });
  it("holder poster adskilt ved andre personer, andet resultat eller ændrede data", () => {
    expect(groupHistoryDuplicates([cola(0), cola(1, { active_profiles: ["me"] })])).toHaveLength(2);
    expect(groupHistoryDuplicates([cola(0), cola(1, { result: "danger" })])).toHaveLength(2);
    expect(groupHistoryDuplicates([cola(0), cola(1, { flags_triggered: { milk: true } })])).toHaveLength(2);
  });
  it("matcher på EAN eller produkt-ID, aldrig kun navn", () => {
    const n1 = { id: "n1", name: "Cola", user_id: "u1", result: "safe", scanned_at: at(0) };
    const n2 = { id: "n2", name: "Cola", user_id: "u1", result: "safe", scanned_at: at(1) };
    expect(groupHistoryDuplicates([n1, n2])).toHaveLength(2);
    const p1 = { ...n1, product_id: "p9" }, p2 = { ...n2, product_id: "p9" };
    expect(groupHistoryDuplicates([p1, p2])).toHaveLength(1);
  });
  it("en anden scanning imellem hindrer ikke samling; posten står, hvor den nyeste står", () => {
    const other = cola(1, { ean_scanned: "999", id: "o" });
    const out = groupHistoryDuplicates([cola(0), other, cola(2)]);
    expect(out.map(h => [h.id, h.__count])).toEqual([["c0", 2], ["o", 1]]);
  });
  it("forskellige brugere i familievisningen samles ikke", () => {
    expect(groupHistoryDuplicates([cola(0), cola(1, { user_id: "u2" })])).toHaveLength(2);
  });
  it("ikke fundne samles pr. stregkode uanset tid", () => {
    const nf = (min, ean = "111") => ({ id: `n${min}`, ean_scanned: ean, user_id: "u1", result: "not_found", scanned_at: at(min) });
    const out = groupHistoryDuplicates([nf(0), cola(5), nf(600), nf(700, "222")]);
    expect(out.map(h => [h.id, h.__count])).toEqual([["n0", 2], ["c5", 1], ["n700", 1]]);
  });
});

describe("computeTopStatus: konkrete årsager", () => {
  const base = { hasSufficientData: true, allergyMatches: [], intoleranceMatches: [], traceMatches: [], customMatches: [], eNumberMatches: [], dietFails: [] };
  it("rød med årsager, og sporene vises stadig", () => {
    const t = computeTopStatus({ ...base, allergyMatches: [{ label: "Æg" }], eNumberMatches: ["E120"], traceMatches: [{ label: "Soja" }] });
    expect(t.level).toBe("danger");
    expect(t.headline).toBe("Konflikt med din profil");
    expect(t.reasons).toEqual(["Indeholder æg", "Indeholder E120", "Spor af soja"]);
  });
  it("orange kun med spor", () => {
    const t = computeTopStatus({ ...base, traceMatches: [{ label: "Æg" }] });
    expect(t.level).toBe("warn");
    expect(t.reasons).toEqual(["Spor af æg"]);
  });
  it("grøn kun med tilstrækkelige data, ellers grå", () => {
    expect(computeTopStatus(base).level).toBe("safe");
    expect(computeTopStatus({ ...base, hasSufficientData: false }).level).toBe("unknown");
  });
});

import { buildNutritionRows } from "./helpers.js";
describe("buildNutritionRows", () => {
  it("viser kJ og kcal, heraf-rækker og dansk talformat", () => {
    const rows = buildNutritionRows({ energy_kj: 1560, energy_kcal: 373, fat: 3.5, saturated_fat: 1.2, carbohydrates: 70, sugars: 5, protein: 9, salt: 1.1 });
    expect(rows[0]).toEqual({ label: "Energi", value: "1.560 kJ / 373 kcal" });
    expect(rows.find(r => r.label === "Fedt").value).toBe("3,5 g");
    expect(rows.find(r => r.label === "Heraf mættede fedtsyrer").sub).toBe(true);
    expect(rows.find(r => r.label === "Heraf sukkerarter").value).toBe("5 g");
  });
  it("gætter ikke manglende værdier og skjuler pladsholder-nuller", () => {
    expect(buildNutritionRows({ energy_kcal: 100, fat: 2 }).map(r => r.label)).toEqual(["Energi", "Fedt"]);
    expect(buildNutritionRows({ energy_kj: 0, energy_kcal: 0, fat: 0, carbohydrates: 0, protein: 0, salt: 0 })).toEqual([]);
    expect(buildNutritionRows({ energy_kj: 400, energy_kcal: 0, fat: 1 })[0].value).toBe("400 kJ");
  });
});
