// @vitest-environment jsdom
// @ts-nocheck
// Hotfix F2-1 (6. okt. 2026): er profilen ikke hentet, må resultatsiden aldrig vise
// en vurdering (en tom profil gav før et grønt "Ingen registrerede konflikter").

import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

let profileCtx;
vi.mock("./AuthContext.jsx", () => ({ useAuthContext: () => ({ user: { name: "Anna" }, accessToken: "tok" }) }));
vi.mock("./ProfileContext.jsx", () => ({ useProfileContext: () => profileCtx }));
vi.mock("./NavigationContext.jsx", () => ({ useNavigationContext: () => ({ setScreen: () => {} }) }));
vi.mock("./HistoryContext.jsx", () => ({ useHistoryContext: () => ({ isFavorite: () => false, toggleFavorite: () => {} }) }));
vi.mock("./useRecalls.js", () => ({ useRecalls: () => [] }));
vi.mock("./ShoppingContext.jsx", () => ({ useShoppingContext: () => ({ lists: [], activeList: null, activeListId: null, addToList: () => {}, shoppingList: [], toggleItem: () => {} }) }));

import ResultScreen from "./ResultScreen.jsx";

const scanResult = {
  code: "5701234567890", name: "Havregryn", brand: "Test", ingredients: "havregryn",
  allergen_flags: { gluten: "no", noedder: "no" }, status: "safe",
};

function renderWith(status, retry = () => {}) {
  profileCtx = { scanFamily: [], allergens: ["noedder"], customAllerg: [], activeProfiles: ["me"], profileLoadStatus: status, retryProfileLoad: retry };
  return render(<ResultScreen scanResult={scanResult} activeENumbers={[]} selectedENumbers={[]} alternatives={[]} altLoading={false} />);
}

afterEach(() => cleanup());

describe("ResultScreen uden hentet profil", () => {
  it("viser ingen vurdering og tilbyder 'Prøv igen', når hentningen fejlede", () => {
    const retry = vi.fn();
    renderWith("error", retry);
    expect(screen.getByText("Vi kunne ikke hente dine præferencer")).toBeTruthy();
    expect(screen.queryByText(/Ingen registrerede konflikter/)).toBeNull();
    expect(screen.getByText("Vi kan ikke vurdere produktet, fordi dine præferencer ikke kunne hentes. Prøv igen.")).toBeTruthy();
    fireEvent.click(screen.getByText("Prøv igen"));
    expect(retry).toHaveBeenCalled();
  });

  it("viser ingen vurdering, mens profilen hentes", () => {
    renderWith("loading");
    expect(screen.getByText("Henter dine præferencer …")).toBeTruthy();
    expect(screen.queryByText(/Ingen registrerede konflikter/)).toBeNull();
  });

  it("viser ingen vurdering, når hentningen endnu ikke er startet (idle)", () => {
    renderWith("idle");
    expect(screen.queryByText(/Ingen registrerede konflikter/)).toBeNull();
    expect(screen.getByText("Henter dine præferencer …")).toBeTruthy();
  });

  it("vurderer som før, når profilen er hentet", () => {
    renderWith("ok");
    expect(screen.queryByText("Vi kunne ikke hente dine præferencer")).toBeNull();
    expect(screen.queryByText("Henter dine præferencer …")).toBeNull();
    expect(screen.getAllByText(/Ingen registrerede konflikter/).length).toBeGreaterThan(0);
  });
});

describe("ResultScreen uden valgte allergier (generalprøven 15. okt. 2026)", () => {
  it("viser aldrig grønt, men beder brugeren vælge fødevarehensyn", () => {
    profileCtx = { scanFamily: [], allergens: [], customAllerg: [], activeProfiles: ["me"], profileLoadStatus: "ok", retryProfileLoad: () => {} };
    render(<ResultScreen scanResult={{ ...scanResult, name: "Peanutbar", ingredients: "jordnødder, sukker", allergen_flags: { jordnoedder: "yes" } }} activeENumbers={[]} selectedENumbers={[]} alternatives={[]} altLoading={false} />);
    expect(screen.getByText("Ingen fødevarehensyn valgt")).toBeTruthy();
    expect(screen.getByText("Vælg fødevarehensyn")).toBeTruthy();
    expect(screen.queryByText(/Ingen registrerede konflikter/)).toBeNull();
  });

  it("siger det samme for et valgt familiemedlem uden allergier", () => {
    profileCtx = { scanFamily: [{ id: "barn", name: "Oskar", allergens: [] }], allergens: ["noedder"], customAllerg: [], activeProfiles: ["barn"], profileLoadStatus: "ok", retryProfileLoad: () => {} };
    render(<ResultScreen scanResult={scanResult} activeENumbers={[]} selectedENumbers={[]} alternatives={[]} altLoading={false} />);
    expect(screen.getByText("Ingen fødevarehensyn valgt")).toBeTruthy();
    expect(screen.queryByText(/Ingen registrerede konflikter/)).toBeNull();
  });
});

describe("ResultScreen uden kendt valgt profil", () => {
  it("viser ingen vurdering, når den valgte profil er ukendt (fx slettet barn)", () => {
    profileCtx = { scanFamily: [], allergens: [], customAllerg: [], activeProfiles: ["slettet-barn"], profileLoadStatus: "ok", retryProfileLoad: () => {} };
    render(<ResultScreen scanResult={scanResult} activeENumbers={[]} selectedENumbers={[]} alternatives={[]} altLoading={false} />);
    expect(screen.getByText(/Ingen profil er valgt/)).toBeTruthy();
    expect(screen.queryByText(/Ingen registrerede konflikter/)).toBeNull();
  });
});
