// @vitest-environment jsdom
// @ts-nocheck
// F1-1 (6. okt. 2026): en tilbagekaldt vare vises som rød "Tilbagekaldt" med Fødevarestyrelsens
// oplysninger, også når produktet ellers ikke giver advarsler for profilen.

import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

let recalls = [];
vi.mock("./useRecalls.js", () => ({ useRecalls: () => recalls }));
vi.mock("./AuthContext.jsx", () => ({ useAuthContext: () => ({ user: { name: "Anna" }, accessToken: "tok" }) }));
vi.mock("./ProfileContext.jsx", () => ({ useProfileContext: () => ({ scanFamily: [], allergens: [], customAllerg: [], activeProfiles: ["me"], profileLoadStatus: "ok", retryProfileLoad: () => {} }) }));
vi.mock("./NavigationContext.jsx", () => ({ useNavigationContext: () => ({ setScreen: () => {} }) }));
vi.mock("./HistoryContext.jsx", () => ({ useHistoryContext: () => ({ isFavorite: () => false, toggleFavorite: () => {} }) }));
vi.mock("./ShoppingContext.jsx", () => ({ useShoppingContext: () => ({ lists: [], activeList: null, activeListId: null, addToList: () => {}, shoppingList: [], toggleItem: () => {} }) }));

import ResultScreen from "./ResultScreen.jsx";

const scanResult = {
  code: "5701234567890", name: "Havregryn", brand: "Test", ingredients: "havregryn",
  allergen_flags: { gluten: "no", noedder: "no" }, status: "safe",
};
const renderIt = () => render(<ResultScreen scanResult={scanResult} activeENumbers={[]} selectedENumbers={[]} alternatives={[]} altLoading={false} />);

afterEach(() => { cleanup(); recalls = []; });

describe("ResultScreen og tilbagekaldelser", () => {
  it("viser 'Tilbagekaldt' og Fødevarestyrelsens oplysninger", () => {
    recalls = [{ title: "Tilbagekaldelse af havregryn", published_at: "2026-10-01T10:00:00Z", reason: "Glasstumper", action: "Lever varen tilbage", affected: "Bedst før 01.12.2026", source_url: "https://foedevarestyrelsen.dk/nyheder/x" }];
    renderIt();
    expect(screen.getAllByText("Tilbagekaldt").length).toBeGreaterThan(0);
    expect(screen.getByText("Tilbagekaldt af Fødevarestyrelsen")).toBeTruthy();
    expect(screen.getByText(/Glasstumper/)).toBeTruthy();
    expect(screen.getByText("Læs hos Fødevarestyrelsen").closest("a").getAttribute("href")).toBe("https://foedevarestyrelsen.dk/nyheder/x");
  });

  it("viser ikke et link til andre domæner end Fødevarestyrelsens", () => {
    recalls = [{ title: "X", reason: "Y", source_url: "https://evil.example/x" }];
    renderIt();
    expect(screen.queryByText("Læs hos Fødevarestyrelsen")).toBeNull();
  });

  it("viser intet kort uden tilbagekaldelse", () => {
    renderIt();
    expect(screen.queryByText("Tilbagekaldt af Fødevarestyrelsen")).toBeNull();
    expect(screen.getAllByText(/Ingen registrerede konflikter/).length).toBeGreaterThan(0);
  });
});
