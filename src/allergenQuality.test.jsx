// @ts-nocheck
// @vitest-environment jsdom
// Kvalitetssikring af allergenlogik (10. okt. 2026): Lotte Pepero Kiksestænger (fem samtidige konflikter), sulfitter, spor, E-numre,
// mangelfulde data og ens vurdering på tværs af appen. Kører den faktiske databehandling, ikke kun visning.
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { analyzeIngredients } from "../supabase/functions/_shared/allergenEngine.js";
import { setSearchReturn, setProductReturn, clearSearchReturn } from "./searchReturn.js";
import { SCREENS } from "./constants.jsx";
import { evaluateProductForProfiles, normalizeProductFlags, sulfiteAssessment, STATUS_TEXT } from "./helpers.js";
import ResultScreen from "./ResultScreen.jsx";
import { AuthProvider } from "./AuthContext.jsx";
import { ProfileProvider } from "./ProfileContext.jsx";
import { NavigationProvider } from "./NavigationContext.jsx";
import { HistoryProvider } from "./HistoryContext.jsx";
import { ShoppingProvider } from "./ShoppingContext.jsx";

afterEach(cleanup);

const PEPERO = "Glasur (59%): 17% sukker, vegetabilsk olie (palme, solsikke, emulgator (E322 (SOJA)), antioxidant (E306)), 12% kakaotilberedning (85% sødmælkspulver, kakaomasse), kakaomasse, 4,3% laktose (MÆLK), MANDELpulver, emulgatorer (E322 (SOJA), E473), aroma, JORDNØDDEpulver. Kiksestænger (31%): 24% HVEDEMEL, 4,0% sukker, 0,75% sødmælkspulver, 0,62% smør (97% FLØDE, kokosolie), 0,29% fuldkornshvedemel, 0,42% BYGMALTEKSTRAKT, surhedsregulerende midler (E339, E500, E503), enzympræparat (fugtighedsbevarende middel (E422), vand, papayaekstrakt, konserveringsmiddel (E223 (SULFIT))), gær (gær, emulgator (E491)).";
const profile = (allergens, extra = {}) => ({ id: "me", name: "Dig", allergens, custom: [], diets: [], levels: {}, eNumbers: [], ...extra });
const product = (ingredients, over = {}) => ({ name: "Testprodukt", ingredients, allergen_flags: analyzeIngredients(ingredients), allergen_quality: "high", source: "bilka", ...over });

describe("allergenmotor: Lotte Pepero", () => {
  const f = analyzeIngredients(PEPERO);
  it("finder alle fem direkte allergener", () => {
    for (const id of ["hvede", "maelkeallergi", "noedder", "soja", "jordnoedder"]) expect(f[id]).toBe("yes");
  });
  it("jordnødder tæller ikke som trænødder, men mandler gør", () => {
    expect(analyzeIngredients("JORDNØDDEpulver").noedder).toBe("no");
    expect(analyzeIngredients("MANDELpulver").noedder).toBe("yes");
  });
  it("mælk, hvede og jordnødder i alle betegnelser", () => {
    for (const t of ["mælkepulver", "kasein", "valleprotein", "smør", "fløde"]) expect(analyzeIngredients(t).maelkeallergi, t).toBe("yes");
    for (const t of ["hvedemel", "fuldkornshvede", "hvedemalt"]) expect(analyzeIngredients(t).hvede, t).toBe("yes");
    for (const t of ["jordnøddepulver", "jordnøddemel", "jordnøddeprotein"]) expect(analyzeIngredients(t).jordnoedder, t).toBe("yes");
  });
  it("E322 uden kilde er kun et sojaspor, aldrig direkte soja; solsikkelecithin er ikke soja", () => {
    expect(analyzeIngredients("sukker, E322").soja).toBe("traces");
    expect(analyzeIngredients("sukker, solsikkelecithin (E322)").soja).toBe("no");
    expect(analyzeIngredients("sukker, emulgator (E322 (SOJA))").soja).toBe("yes");
  });
  it("spor skelnes fra direkte indhold", () => {
    expect(analyzeIngredients("Sukker. Kan indeholde spor af mandler og hasselnødder.").noedder).toBe("traces");
  });
});

describe("vurdering af Lotte Pepero (fælles logik)", () => {
  it("fem konflikter giver rød med alle fem årsager", () => {
    const r = evaluateProductForProfiles([profile(["hvede", "maelkeallergi", "noedder", "soja", "jordnoedder"])], product(PEPERO));
    expect(r.level).toBe("danger");
    expect(r.reasons).toHaveLength(5);
  });
  it("samme produkt og profil giver samme vurdering, uanset hvor den beregnes", () => {
    const p = product(PEPERO);
    const a = evaluateProductForProfiles([profile(["soja"])], p);
    const b = evaluateProductForProfiles([profile(["soja"])], { ...p, ingredients_text: p.ingredients, ingredients: undefined });
    expect(a.level).toBe(b.level);
    expect(a.reasons).toEqual(b.reasons);
  });
});

describe("sulfitter", () => {
  it("E223 alene er ikke en deklareret allergen: kan ikke vurderes for en bruger med sulfitvalg", () => {
    const p = product("Sukker, konserveringsmiddel (E223)");
    expect(analyzeIngredients(p.ingredients).svovl).toBe("yes");
    expect(sulfiteAssessment(p.ingredients)).toBe("unknown");
    expect(evaluateProductForProfiles([profile(["svovl"])], p).level).toBe("unknown");
  });
  it("ordet SULFIT i deklarationen gælder som deklareret", () => {
    expect(sulfiteAssessment("konserveringsmiddel (E223 (SULFIT))")).toBeNull();
    expect(evaluateProductForProfiles([profile(["svovl"])], product("konserveringsmiddel (E223 (SULFIT))")).level).toBe("danger");
  });
  it("angivet mængde: over 10 mg/kg gælder, højst 10 mg/kg er under mærkningsgrænsen", () => {
    expect(sulfiteAssessment("Abrikoser (svovldioxid 15 mg/kg), E220")).toBeNull();
    expect(sulfiteAssessment("Abrikoser (svovldioxid 8 mg/kg)")).toBe("traces");
  });
  it("et selvvalgt E-nummer (E223) er altid et selvstændigt fravalg", () => {
    const r = evaluateProductForProfiles([profile([], { eNumbers: ["E223"] })], product("Sukker, konserveringsmiddel (E223)"));
    expect(r.level).toBe("danger");
    expect(r.reasons).toContain("Indeholder E223");
  });
  it("normalizeProductFlags gør sulfitflag fra et E-nummer alene til unknown", () => {
    expect(normalizeProductFlags({ svovl: "yes" }, { ingredientsText: "Sukker, E223", quality: "high" }).svovl).toBe("unknown");
  });
});

describe("ingen falske grønne", () => {
  it("manglende ingrediensliste, blanding og ikke-dansk liste kan ikke give grøn", () => {
    const sel = [profile(["aeg"])];
    expect(evaluateProductForProfiles(sel, { name: "X", ingredients: "", allergen_flags: {} }).level).toBe("unknown");
    expect(evaluateProductForProfiles(sel, product("HVEDEMEL, brun farin, sukker", { name: "Krydderkage" })).level).toBe("unknown");
    expect(evaluateProductForProfiles(sel, { name: "Candy", ingredients: "zutaten: glukosesirup, zucker, säuerungsmittel: e330", allergen_flags: analyzeIngredients("zutaten: glukosesirup, zucker"), allergen_quality: "medium" }).level).not.toBe("safe");
  });
  it("spor giver orange, ikke rød", () => {
    expect(evaluateProductForProfiles([profile(["noedder"])], product("Sukker. Kan indeholde spor af mandler.")).level).toBe("warn");
  });
  it("kun spor-niveauet 'kun ved ingrediens' ignorerer sporet uden at blive rød", () => {
    const r = evaluateProductForProfiles([profile(["noedder"], { levels: { noedder: "direct_only" } })], product("Sukker. Kan indeholde spor af mandler."));
    expect(r.level).not.toBe("danger");
  });
});

// ── Produktsiden ─────────────────────────────────────────────────────────────────────────────
function setup({ scan, allergens, shoppingList = [], toggleItem = vi.fn(), setNewItemName = vi.fn(), setScreen = vi.fn() }) {
  return render(
    <AuthProvider value={{ user: { name: "Jan", diets: [], allergenLevels: {} }, accessToken: "t" }}>
      <ProfileProvider value={{ scanFamily: [], allergens, customAllerg: [], activeProfiles: ["me"] }}>
        <NavigationProvider value={{ setScreen }}>
          <HistoryProvider value={{ isFavorite: () => false, toggleFavorite: vi.fn() }}>
            <ShoppingProvider value={{ lists: [{ id: "l1", name: "Min liste" }], activeList: { id: "l1", name: "Min liste" }, activeListId: "l1", addToList: vi.fn(), shoppingList, toggleItem, setNewItemName }}>
              <ResultScreen scanResult={scan} activeENumbers={[]} selectedENumbers={[]} setKnowledgeSlug={vi.fn()} setEditStep={vi.fn()}
                setEditIngText={vi.fn()} setEditNote={vi.fn()} setEditType={vi.fn()} alternatives={[]} altLoading={false} lookupProduct={vi.fn()} />
            </ShoppingProvider>
          </HistoryProvider>
        </NavigationProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}
const pepero = () => ({ code: "8718053593111", name: "Kiksestænger m. crunchy chokolade", brand: "Lotte pepero", ingredients: PEPERO, allergen_flags: analyzeIngredients(PEPERO), status: "danger", source: "bilka", allergen_quality: "high" });
const FIVE = ["hvede", "maelkeallergi", "noedder", "soja", "jordnoedder"];

describe("produktsiden ved fem konflikter", () => {
  it("viser højst tre konfliktmærker og '+2 flere', som kan foldes ud", () => {
    setup({ scan: pepero(), allergens: FIVE });
    const more = screen.getByRole("button", { name: "+2 flere" });
    expect(screen.queryAllByText(/^Indeholder /).length).toBe(3);
    fireEvent.click(more);
    expect(screen.queryAllByText(/^Indeholder /).length).toBe(5);
    expect(screen.getByRole("button", { name: "Vis færre" })).toBeTruthy();
  });
  it("'Markér som købt' er ikke grøn ved direkte konflikt og ændrer ikke status", () => {
    const toggleItem = vi.fn();
    setup({ scan: pepero(), allergens: FIVE, shoppingList: [{ id: "i1", ean: "8718053593111", name: "Kiksestænger", checked: false }], toggleItem });
    const btn = screen.getByText("Markér som købt").closest("button");
    expect(btn.className).not.toContain("btn-green");
    fireEvent.click(btn);
    expect(toggleItem).toHaveBeenCalledWith("i1");
    expect(screen.getByText(STATUS_TEXT.danger)).toBeTruthy();
  });
  it("sulfitter vises under deklarerede allergener, når de ikke er et valg", () => {
    setup({ scan: pepero(), allergens: ["hvede"] });
    expect(screen.getByLabelText(/Deklareret: sulfitter/i)).toBeTruthy();
    expect(screen.getByText("Deklareret på produktet")).toBeTruthy();
  });
  it("tom alternativ-tilstand har den nye tekst", () => {
    setup({ scan: pepero(), allergens: FIVE });
    expect(screen.getByText("Vi kunne ikke finde relevante alternativer med tilstrækkelige produktoplysninger.")).toBeTruthy();
  });
});

// ── Dokumentationsgrundlag, "Dine valg" og konsistens ──────────────────────────────────────────
describe("deklareret og udledt", () => {
  it("byg udledes (ikke deklareret) og vises som 'Byg (glutenholdigt korn)' under 'Udledt af ingredienser'", () => {
    setup({ scan: pepero(), allergens: ["soja"] });
    expect(screen.getByText("Udledt af ingredienser")).toBeTruthy();
    const chip = screen.getByLabelText(/Udledt: byg/i);
    expect(chip.textContent).toMatch(/Byg \(glutenholdigt korn\)/);
    // ikke også under deklareret, og ingen "Gluten (byg)"
    expect(screen.queryByText(/Gluten \(byg\)/)).toBeNull();
    expect(screen.getAllByLabelText(/gluten|byg/i).length).toBe(1);
  });
  it("gluten ud fra hvede alene er også udledt: 'Gluten (fra hvede) · udledt', ikke deklareret", () => {
    const text = "HVEDEMEL, sukker, VALLEPULVER (MÆLK), TØRÆG";
    setup({ scan: { code: "9", name: "Boller", ingredients: text, allergen_flags: analyzeIngredients(text), status: "danger", source: "open_food_facts", allergen_quality: "high" }, allergens: ["aeg"] });
    const chip = screen.getByLabelText(/Udledt: gluten \(fra hvede\)/i);
    expect(chip.textContent).toMatch(/udledt/);
    expect(screen.getByLabelText(/Deklareret: hvede/i)).toBeTruthy();
    expect(screen.queryByLabelText(/Deklareret: gluten/i)).toBeNull();
  });
  it("sulfit uden deklareret ord og mængde vises som udledt 'mulige sulfitter', ikke som deklareret", () => {
    const scan = { code: "1", name: "Slik", ingredients: "Sukker, konserveringsmiddel (E223)", allergen_flags: { ...analyzeIngredients("Sukker, konserveringsmiddel (E223)"), svovl: "unknown" }, status: "unknown", source: "bilka", allergen_quality: "high" };
    setup({ scan, allergens: ["soja"] });
    expect(screen.getByLabelText(/Udledt: mulige sulfitter \(e223\)/i)).toBeTruthy();
    expect(screen.queryByLabelText(/Deklareret: sulfitter/i)).toBeNull();
  });
  it("viser ingen tom undersektion", () => {
    const text = "Sukker, kakaosmør, SKUMMETMÆLKSPULVER";
    setup({ scan: { code: "2", name: "Chokolade", ingredients: text, allergen_flags: analyzeIngredients(text), status: "safe", source: "bilka", allergen_quality: "high" }, allergens: ["soja"] });
    expect(screen.queryByText("Udledt af ingredienser")).toBeNull();
    expect(screen.queryByText("Sporoplysninger")).toBeNull();
  });
});

describe("Dine valg: rækkefølge og sammenfoldning", () => {
  it("røde konflikter er altid synlige, flere grønne samles og kan foldes ud", () => {
    setup({ scan: pepero(), allergens: ["hvede", "aeg", "fisk"] });
    expect(screen.getByText(/Fundet i produktet/)).toBeTruthy();
    expect(screen.queryByText("Fisk")).toBeNull();
    const fold = screen.getByRole("button", { name: /2 øvrige fravalg ikke fundet/ });
    expect(fold.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(fold);
    expect(screen.getByText("Fisk")).toBeTruthy();
    expect(screen.getByText("Æg")).toBeTruthy();
    expect(screen.getAllByText(/Grøn betyder/).length).toBe(1);
    fireEvent.click(fold);
    expect(screen.queryByText("Fisk")).toBeNull();
  });
  it("et enkelt grønt valg vises direkte, og sporadvarsler skjules ikke sammen med grønne", () => {
    const text = "Sukker, kakaosmør. Kan indeholde spor af mandler.";
    setup({ scan: { code: "3", name: "Chokolade", ingredients: text, allergen_flags: analyzeIngredients(text), status: "warn", source: "bilka", allergen_quality: "high" }, allergens: ["noedder", "fisk"] });
    expect(screen.getByText(/Kan indeholde spor/, { selector: "span" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /øvrige fravalg/ })).toBeNull();
    expect(screen.getByText("Fisk")).toBeTruthy();
  });
  it("valg der ikke kan vurderes (blanding) bliver aldrig grønne", () => {
    const text = "HVEDEMEL, brun farin, sukker";
    setup({ scan: { code: "4", name: "Krydderkage", ingredients: text, allergen_flags: analyzeIngredients(text), status: "safe", source: "bilka", allergen_quality: "high" }, allergens: ["aeg", "fisk"] });
    expect(screen.queryByRole("button", { name: /øvrige fravalg/ })).toBeNull();
    expect(screen.getByRole("button", { name: /2 valg kan ikke kontrolleres/ })).toBeTruthy();
  });
});

describe("+N flere ved mange konflikter", () => {
  const ORDER = ["hvede", "maelkeallergi", "noedder", "soja", "jordnoedder", "laktose", "svovl", "gluten"];
  for (const n of [4, 5, 6, 7]) {
    it(`${n} konflikter: tre mærker, '+${n - 3} flere', alle kan vises og skjules igen`, () => {
      setup({ scan: pepero(), allergens: ORDER.slice(0, n) });
      expect(screen.queryAllByText(/^Indeholder /).length).toBe(3);
      fireEvent.click(screen.getByRole("button", { name: `+${n - 3} flere` }));
      const labels = screen.queryAllByText(/^Indeholder /).map(e => e.textContent);
      expect(labels.length).toBe(n);
      expect(new Set(labels).size).toBe(n);
      fireEvent.click(screen.getByRole("button", { name: "Vis færre" }));
      expect(screen.queryAllByText(/^Indeholder /).length).toBe(3);
    });
  }
  it("tre eller færre konflikter har ingen '+N flere'", () => {
    setup({ scan: pepero(), allergens: ["hvede", "soja", "noedder"] });
    expect(screen.queryByRole("button", { name: /flere/ })).toBeNull();
  });
});

describe("ens vurdering på tværs og genberegning ved profilændring", () => {
  const cases = [
    ["konflikt", pepero(), ["soja"], STATUS_TEXT.danger],
    ["spor", { code: "5", name: "Chokolade", ingredients: "Sukker. Kan indeholde spor af mandler.", allergen_flags: analyzeIngredients("Sukker. Kan indeholde spor af mandler."), source: "bilka", allergen_quality: "high" }, ["noedder"], STATUS_TEXT.warn],
    ["blanding", { code: "6", name: "Krydderkage", ingredients: "HVEDEMEL, brun farin, sukker", allergen_flags: analyzeIngredients("HVEDEMEL, brun farin, sukker"), source: "bilka", allergen_quality: "high" }, ["aeg"], STATUS_TEXT.unknown],
    ["ingen fund", { code: "7", name: "Chokolade", ingredients: "Sukker, kakaosmør", allergen_flags: analyzeIngredients("Sukker, kakaosmør"), source: "bilka", allergen_quality: "high" }, ["soja"], STATUS_TEXT.safe],
  ];
  for (const [name, scan, allergens, label] of cases) {
    it(`${name}: produktsiden og den fælles vurdering er enige`, () => {
      expect(evaluateProductForProfiles([profile(allergens)], scan).label).toBe(label);
      setup({ scan, allergens });
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    });
  }
  it("skift af profil genberegner vurderingen", () => {
    const scan = pepero();
    const { rerender, container } = setup({ scan, allergens: ["fisk"] });
    expect(container.textContent).toContain(STATUS_TEXT.safe);
    cleanup();
    setup({ scan, allergens: ["soja"] });
    expect(screen.getAllByText(STATUS_TEXT.danger).length).toBeGreaterThan(0);
  });
});

describe("tilbage-knap fra andre steder", () => {
  it("favoritter og historik fører tilbage til deres skærm, alternativer til forrige produkt", () => {
    const setScreen = vi.fn();
    setProductReturn({ ean: "8718053593111", label: "Tilbage til favoritter", screen: SCREENS.FAVORITES });
    setup({ scan: pepero(), allergens: ["soja"], setScreen });
    fireEvent.click(screen.getByRole("button", { name: /Tilbage til favoritter/ }));
    expect(setScreen).toHaveBeenCalledWith(SCREENS.FAVORITES);
  });
});

describe("tilbage til søgning", () => {
  it("vises kun for et produkt, der blev åbnet fra søgningen, og fører tilbage med søgeordet", () => {
    const setScreen = vi.fn(), setNewItemName = vi.fn();
    setSearchReturn("boller", "8718053593111");
    setup({ scan: pepero(), allergens: ["soja"], setScreen, setNewItemName });
    fireEvent.click(screen.getByRole("button", { name: /Tilbage til søgning/ }));
    expect(setNewItemName).toHaveBeenCalledWith("boller");
    expect(setScreen).toHaveBeenCalledWith(SCREENS.LIST);
  });
  it("vises ikke for et produkt fra scanning eller et andet produkt", () => {
    setSearchReturn("boller", "999");
    setup({ scan: pepero(), allergens: ["soja"] });
    expect(screen.queryByRole("button", { name: /Tilbage til søgning/ })).toBeNull();
    clearSearchReturn();
  });
});
