// @vitest-environment jsdom
// @ts-nocheck
// Hotfix F2-1 (6. okt. 2026): er profilen ikke hentet, må resultatsiden aldrig vise
// en vurdering (en tom profil gav før et grønt "Ingen advarsler fundet").

import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

let profileCtx;
vi.mock("./AuthContext.jsx", () => ({ useAuthContext: () => ({ user: { name: "Anna" }, accessToken: "tok" }) }));
vi.mock("./ProfileContext.jsx", () => ({ useProfileContext: () => profileCtx }));
vi.mock("./NavigationContext.jsx", () => ({ useNavigationContext: () => ({ setScreen: () => {} }) }));
vi.mock("./HistoryContext.jsx", () => ({ useHistoryContext: () => ({ isFavorite: () => false, toggleFavorite: () => {} }) }));
vi.mock("./ShoppingContext.jsx", () => ({ useShoppingContext: () => ({ lists: [], activeList: null, activeListId: null, addToList: () => {}, shoppingList: [], toggleItem: () => {} }) }));

import ResultScreen from "./ResultScreen.jsx";

const scanResult = {
  code: "5701234567890", name: "Havregryn", brand: "Test", ingredients: "havregryn",
  allergen_flags: { gluten: "no", noedder: "no" }, status: "safe",
};

function renderWith(status, retry = () => {}) {
  profileCtx = { scanFamily: [], allergens: [], customAllerg: [], activeProfiles: ["me"], profileLoadStatus: status, retryProfileLoad: retry };
  return render(<ResultScreen scanResult={scanResult} activeENumbers={[]} selectedENumbers={[]} alternatives={[]} altLoading={false} />);
}

afterEach(() => cleanup());

describe("ResultScreen uden hentet profil", () => {
  it("viser ingen vurdering og tilbyder 'Prøv igen', når hentningen fejlede", () => {
    const retry = vi.fn();
    renderWith("error", retry);
    expect(screen.getByText("Din profil kunne ikke hentes")).toBeTruthy();
    expect(screen.queryByText(/Ingen advarsler fundet/)).toBeNull();
    fireEvent.click(screen.getByText("Prøv igen"));
    expect(retry).toHaveBeenCalled();
  });

  it("viser ingen vurdering, mens profilen hentes", () => {
    renderWith("loading");
    expect(screen.getByText("Henter din profil …")).toBeTruthy();
    expect(screen.queryByText(/Ingen advarsler fundet/)).toBeNull();
  });

  it("vurderer som før, når profilen er hentet", () => {
    renderWith("ok");
    expect(screen.queryByText("Din profil kunne ikke hentes")).toBeNull();
    expect(screen.queryByText("Henter din profil …")).toBeNull();
    expect(screen.getAllByText(/Ingen advarsler fundet/).length).toBeGreaterThan(0);
  });
});
