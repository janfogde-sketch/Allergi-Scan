// @ts-nocheck
// @vitest-environment jsdom
// Scan→resultat (Fase 7, T5): skærmen skal vise det, statuslogikken beslutter,
// og aldrig "sikker" uden data. Faste produkter og profiler, ingen netværk.
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import ResultScreen from "./ResultScreen.jsx";
import { useScanner } from "./useScanner.js";
import { AuthProvider } from "./AuthContext.jsx";
import { ProfileProvider } from "./ProfileContext.jsx";
import { NavigationProvider } from "./NavigationContext.jsx";
import { HistoryProvider } from "./HistoryContext.jsx";
import { ShoppingProvider } from "./ShoppingContext.jsx";

afterEach(cleanup);

const product = (over = {}) => ({
  code: "5700000000017", name: "Testprodukt", brand: "Testmærke",
  ingredients: "Vand, sukker, salt", allergen_flags: { jordnoedder: "no", maelkeallergi: "no", hvede: "no", gluten: "no" },
  status: "safe", headline: "", source: "off", ...over,
});

function setup({ scan, profile = {}, user = {}, family = [], activeProfiles = ["me"], alternatives = [], addToList = vi.fn() } = {}) {
  const setScreen = vi.fn();
  const profileValue = {
    scanFamily: family, allergens: [], customAllerg: [], activeProfiles, ...profile,
  };
  const ui = (
    <AuthProvider value={{ user: { name: "Jan", diets: [], allergenLevels: {}, ...user }, accessToken: "t" }}>
      <ProfileProvider value={profileValue}>
        <NavigationProvider value={{ setScreen }}>
          <HistoryProvider value={{ isFavorite: () => false, toggleFavorite: vi.fn() }}>
            <ShoppingProvider value={{ lists: [], activeList: null, activeListId: null, addToList, shoppingList: [], toggleItem: vi.fn() }}>
              <ResultScreen scanResult={scan} activeENumbers={[]} selectedENumbers={[]} setKnowledgeSlug={vi.fn()} setEditStep={vi.fn()}
                setEditIngText={vi.fn()} setEditNote={vi.fn()} setEditType={vi.fn()} alternatives={alternatives} altLoading={false} lookupProduct={vi.fn()} />
            </ShoppingProvider>
          </HistoryProvider>
        </NavigationProvider>
      </ProfileProvider>
    </AuthProvider>
  );
  return { ...render(ui), setScreen };
}

describe("ResultScreen: alternativer og tilføj til liste", () => {
  const alt = n => ({ ean: `57000000000${n}`, name: `Alternativ ${n}`, brand: "Mærke", ingredients_text: "Vand, sukker, salt", allergen_flags: { hvede: "no" }, allergen_quality: "high" });
  const conflict = () => product({ ingredients: "Hvedemel, vand", allergen_flags: { hvede: "yes" }, status: "danger" });

  it("viser højst tre alternativer og kan folde ud og ind", () => {
    setup({ scan: conflict(), profile: { allergens: ["hvede"] }, alternatives: [1, 2, 3, 4, 5].map(alt) });
    expect(screen.queryByText("Alternativ 4")).toBeNull();
    fireEvent.click(screen.getByText("Se flere alternativer"));
    expect(screen.getByText("Alternativ 5")).toBeTruthy();
    fireEvent.click(screen.getByText("Vis færre"));
    expect(screen.queryByText("Alternativ 4")).toBeNull();
  });

  it("konflikt: kræver bekræftelse før tilføjelse, Annuller tilføjer intet", () => {
    const addToList = vi.fn(() => Promise.resolve(true));
    setup({ scan: conflict(), profile: { allergens: ["hvede"] }, addToList });
    fireEvent.click(screen.getByText("Tilføj til indkøbsliste"));
    expect(addToList).not.toHaveBeenCalled();
    expect(screen.getByText(/Produktet indeholder noget, du har valgt at undgå/)).toBeTruthy();
    fireEvent.click(screen.getByText("Annuller"));
    expect(addToList).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Tilføj til indkøbsliste"));
    fireEvent.click(screen.getByText("Tilføj alligevel"));
    expect(addToList).toHaveBeenCalledTimes(1);
  });

  it("ingen konflikt: tilføjes direkte uden bekræftelse", () => {
    const addToList = vi.fn(() => Promise.resolve(true));
    setup({ scan: product(), profile: { allergens: ["hvede"] }, addToList });
    fireEvent.click(screen.getByText("Tilføj til indkøbsliste"));
    expect(addToList).toHaveBeenCalledTimes(1);
  });
});

describe("ResultScreen: status", () => {
  it("viser ingenting uden scanResult", () => {
    const { container } = setup({ scan: null });
    expect(container.innerHTML).toBe("");
  });

  it("direkte allergen giver Konflikt med din profil", () => {
    setup({ scan: product({ ingredients: "Hvedemel, vand", allergen_flags: { hvede: "yes" } }), profile: { allergens: ["hvede"] } });
    expect(screen.getByText("Konflikt med din profil")).toBeTruthy();
    expect(screen.queryByText("Ingen registrerede konflikter")).toBeNull();
  });

  it("spor giver gul Kan indeholde spor, ikke Konflikt med din profil", () => {
    setup({ scan: product({ allergen_flags: { hvede: "traces" } }), profile: { allergens: ["hvede"] } });
    expect(screen.getByText("Kan indeholde spor")).toBeTruthy();
    expect(screen.queryByText("Konflikt med din profil")).toBeNull();
  });

  it("spor ignoreres, når brugeren kun vil advares ved ingrediens: ingen advarsel, men spor skjules ikke", () => {
    setup({ scan: product({ allergen_flags: { hvede: "traces" } }), profile: { allergens: ["hvede"] }, user: { allergenLevels: { hvede: "direct_only" } } });
    expect(screen.queryByText("Kan indeholde spor")).toBeNull();
    expect(screen.queryByText("Konflikt med din profil")).toBeNull();
    expect(screen.getAllByText(/Du har valgt ikke at få advarsel om spor/).length).toBeGreaterThan(0);
  });

  it("alt kontrolleret og ingen fund: Ingen registrerede konflikter (aldrig ordet sikker)", () => {
    const { container } = setup({ scan: product(), profile: { allergens: ["hvede"] } });
    expect(screen.getByText("Ingen registrerede konflikter")).toBeTruthy();
    expect(container.textContent.replace(/ikke at produktet er garanteret sikkert/gi, "")).not.toMatch(/100% sikker|allergifri|garanteret/i);
  });

  it("ingen ingrediensliste og ingen flag: Kan ikke vurderes, aldrig grønt", () => {
    setup({ scan: product({ ingredients: "", allergen_flags: {} }), profile: { allergens: ["hvede"] } });
    expect(screen.getByText("Kan ikke vurderes")).toBeTruthy();
    expect(screen.getByText("Ingrediensliste mangler")).toBeTruthy();
    expect(screen.getByText("Indsend ingrediensliste")).toBeTruthy();
    expect(screen.queryByText("Ingen registrerede konflikter")).toBeNull();
  });

  it("valgt allergen uden flag (men med ingrediensliste): Kan ikke vurderes og valget samles som ikke kontrolleret", () => {
    setup({ scan: product({ allergen_flags: { hvede: "no" } }), profile: { allergens: ["hvede", "jordnoedder"] } });
    expect(screen.getByText("Kan ikke vurderes")).toBeTruthy();
    expect(screen.getByText("1 valg kan ikke kontrolleres")).toBeTruthy();
    expect(screen.queryByText("Ingen registrerede konflikter")).toBeNull();
  });

  it("et fund vinder over manglende data (rød trods ukendte valg)", () => {
    setup({ scan: product({ allergen_flags: { hvede: "yes" } }), profile: { allergens: ["hvede", "jordnoedder"] } });
    expect(screen.getByText("Konflikt med din profil")).toBeTruthy();
  });
});

describe("ResultScreen: flere personer og familie", () => {
  const child = { id: "k1", name: "Maja", allergens: ["hvede"], custom: [], diets: [], levels: {}, eNumbers: [] };

  it("én persons allergi gør samlet resultat til Konflikt med din profil", () => {
    setup({
      scan: product({ ingredients: "Hvedemel", allergen_flags: { hvede: "yes" } }),
      profile: { allergens: [] }, family: [child], activeProfiles: ["me", "k1"],
    });
    expect(screen.getByText("Konflikt med din profil")).toBeTruthy();
    expect(screen.getByText("Maja")).toBeTruthy();
    expect(screen.getByText("Dig")).toBeTruthy();
  });

  it("kun den valgte person tæller (ikke den fravalgte)", () => {
    setup({
      scan: product({ ingredients: "Hvedemel", allergen_flags: { hvede: "yes" } }),
      profile: { allergens: [] }, family: [child], activeProfiles: ["me"],
    });
    expect(screen.queryByText("Konflikt med din profil")).toBeNull();
    expect(screen.queryByText("Maja")).toBeNull();
  });

  it("skrivebeskyttet familiekonto (fra scanFamily) kan vælges og tjekkes", () => {
    const account = { ...child, id: "u9", name: "Anna", readOnly: true };
    setup({
      scan: product({ ingredients: "Hvedemel", allergen_flags: { hvede: "yes" } }),
      profile: { allergens: [] }, family: [account], activeProfiles: ["u9"],
    });
    expect(screen.getByText("Konflikt med din profil")).toBeTruthy();
  });

  it("flere personer og alt uden fund: Ingen registrerede konflikter; manglende data: aldrig Ingen registrerede konflikter", () => {
    const { unmount } = setup({ scan: product(), profile: { allergens: ["hvede"] }, family: [child], activeProfiles: ["me", "k1"] });
    expect(screen.getByText("Ingen registrerede konflikter")).toBeTruthy();
    unmount();
    setup({ scan: product({ ingredients: "", allergen_flags: {} }), profile: { allergens: ["hvede"] }, family: [child], activeProfiles: ["me", "k1"] });
    expect(screen.queryByText("Ingen registrerede konflikter")).toBeNull();
    expect(screen.getByText("Kan ikke vurderes")).toBeTruthy();
  });
});

describe("useScanner: stopCamera nulstiller al midlertidig state", () => {
  it("zoom, lygte, hint, kamera og fejl nulstilles", () => {
    const setScanError = vi.fn();
    const { result } = renderHook(() => useScanner({ setScanError, setLoading: vi.fn(), onScanSuccess: vi.fn(), accessToken: "t" }));
    act(() => {
      result.current.setCameraActive(true); result.current.setTorchOn(true);
      result.current.setScanZoom(2.5); result.current.setShowPhotoHint(true);
    });
    expect(result.current.cameraActive).toBe(true);
    expect(result.current.scanZoom).toBe(2.5);
    setScanError.mockClear();
    act(() => { result.current.stopCamera(); });
    expect(result.current.cameraActive).toBe(false);
    expect(result.current.torchOn).toBe(false);
    expect(result.current.scanReady).toBe(false);
    expect(result.current.scanZoom).toBe(1.0);
    expect(result.current.showPhotoHint).toBe(false);
    expect(setScanError).toHaveBeenCalledWith("");
  });
});
