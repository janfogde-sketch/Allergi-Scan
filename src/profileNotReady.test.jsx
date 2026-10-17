// @vitest-environment jsdom
// @ts-nocheck
// Frontend-gennemgang 16. okt. 2026 (frontend-4): fejler hentningen af familien, mangler barnets allergener i profilerne.
// Historik, favoritter og indkøbsliste må da aldrig vise grøn ("Ingen registrerede konflikter"), kun "Kan ikke vurderes".

import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { evaluateProductForProfiles, profilesReady, STATUS_TEXT } from "./helpers.js";

let profileCtx;
vi.mock("./AuthContext.jsx", () => ({ useAuthContext: () => ({ user: { name: "Anna" }, userId: "u1", accessToken: "tok" }) }));
vi.mock("./ProfileContext.jsx", () => ({ useProfileContext: () => profileCtx }));
vi.mock("./NavigationContext.jsx", () => ({ useNavigationContext: () => ({ setScreen: () => {} }) }));
vi.mock("./AllergenPrefsContext.jsx", () => ({ useAllergenPrefsContext: () => ({ selectedENumbers: [] }) }));
const histEntry = {
  id: "h1", ean_scanned: "5701234567890", result: "safe", active_profiles: ["me", "child1"], flags_triggered: {},
  scanned_at: new Date().toISOString(), products: { verified_status: "verified", allergen_quality: "high", name: "Havregryn", allergen_flags: { aeg: "no", noedder: "yes" }, ingredients_text: "havregryn, nødder" },
};
vi.mock("./HistoryContext.jsx", () => ({
  useHistoryContext: () => ({ history: [histEntry], historyLoading: false, historyScope: "own", historyError: false, loadHistory: () => {}, clearHistory: () => {} }),
}));

import HistoryScreen from "./HistoryScreen.jsx";

const product = { verified_status: "verified", allergen_quality: "high", name: "Havregryn", allergen_flags: { aeg: "no", noedder: "yes" }, ingredients_text: "havregryn, nødder" };
const me = [{ id: "me", name: "Anna", allergens: ["aeg"], custom: [], levels: {}, eNumbers: [] }];
const cleanProduct = { verified_status: "verified", allergen_quality: "high", name: "Havregryn", allergen_flags: { aeg: "no", noedder: "no" }, ingredients_text: "havregryn" };

afterEach(() => cleanup());

describe("profilesReady", () => {
  it("er kun sand ved status ok", () => {
    expect(profilesReady("ok")).toBe(true);
    for (const s of ["idle", "loading", "error", undefined]) expect(profilesReady(s)).toBe(false);
  });
});

describe("evaluateProductForProfiles med profiler, der ikke er hentet", () => {
  it("giver grøn, når profilerne er hentet (uændret adfærd)", () => {
    expect(evaluateProductForProfiles(me, cleanProduct).level).toBe("safe");
    expect(evaluateProductForProfiles(me, cleanProduct, { profilesReady: true }).level).toBe("safe");
  });
  it("gør grøn til Kan ikke vurderes, når profilen ikke er hentet", () => {
    const ev = evaluateProductForProfiles(me, cleanProduct, { profilesReady: false });
    expect(ev.level).toBe("unknown");
    expect(ev.label).toBe(STATUS_TEXT.unknown);
    expect(ev.missing[0]).toBe("Dine præferencer kunne ikke hentes.");
  });
  it("skjuler aldrig et fund: rød bliver rød", () => {
    const withNuts = [{ ...me[0], allergens: ["noedder"] }];
    expect(evaluateProductForProfiles(withNuts, product, { profilesReady: false }).level).toBe("danger");
  });
});

describe("HistoryScreen, når familien ikke kunne hentes", () => {
  const base = { allergens: ["aeg"], customAllerg: [], activeProfiles: ["me", "child1"], scanFamily: [] };
  it("viser aldrig grøn", () => {
    profileCtx = { ...base, profileLoadStatus: "error" };
    render(<HistoryScreen household={[]} lookupProduct={() => {}} onScanNow={() => {}} />);
    expect(screen.queryByText(/Ingen registrerede konflikter/)).toBeNull();
    expect(screen.getAllByText(/Kan ikke vurderes/).length).toBeGreaterThan(0);
  });
  it("viser grøn, når alt er hentet (kontrol af testen)", () => {
    profileCtx = { ...base, profileLoadStatus: "ok" };
    render(<HistoryScreen household={[]} lookupProduct={() => {}} onScanNow={() => {}} />);
    expect(screen.getAllByText(/Ingen registrerede konflikter|Kan indeholde|Konflikt/).length).toBeGreaterThan(0);
  });
});
