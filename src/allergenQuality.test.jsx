// @ts-nocheck
// @vitest-environment jsdom
// Kvalitetssikring af allergenlogik (10. okt. 2026): Lotte Pepero Kiksestænger (fem samtidige konflikter), sulfitter, spor, E-numre,
// mangelfulde data og ens vurdering på tværs af appen. Kører den faktiske databehandling, ikke kun visning.
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { analyzeIngredients } from "../supabase/functions/_shared/allergenEngine.js";
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
function setup({ scan, allergens, shoppingList = [], toggleItem = vi.fn() }) {
  return render(
    <AuthProvider value={{ user: { name: "Jan", diets: [], allergenLevels: {} }, accessToken: "t" }}>
      <ProfileProvider value={{ scanFamily: [], allergens, customAllerg: [], activeProfiles: ["me"] }}>
        <NavigationProvider value={{ setScreen: vi.fn() }}>
          <HistoryProvider value={{ isFavorite: () => false, toggleFavorite: vi.fn() }}>
            <ShoppingProvider value={{ lists: [{ id: "l1", name: "Min liste" }], activeList: { id: "l1", name: "Min liste" }, activeListId: "l1", addToList: vi.fn(), shoppingList, toggleItem }}>
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
    expect(screen.getByLabelText(/Indeholder sulfitter/i)).toBeTruthy();
  });
  it("tom alternativ-tilstand har den nye tekst", () => {
    setup({ scan: pepero(), allergens: FIVE });
    expect(screen.getByText("Vi kunne ikke finde relevante alternativer med tilstrækkelige produktoplysninger.")).toBeTruthy();
  });
});
