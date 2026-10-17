// @vitest-environment jsdom
// @ts-nocheck
// Bruger-ticket 734769a2 (17. okt. 2026): på Historik blev "Familien" ikke grøn, da den blev trykket; "Mine" forblev grøn.
// Årsag: ProfileScreen (som også rummer Historik) hentede egen historik hver gang loadHistory skiftede identitet, dvs. hver gang visningen
// skiftede; det satte visningen tilbage til "Mine" lige efter trykket.

import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";

const apiCall = vi.fn();
vi.mock("./helpers.js", async (orig) => ({ ...(await orig()), apiCall: (...a) => apiCall(...a), makeHeaders: () => ({}) }));
let nav = { screen: "history", setScreen: vi.fn(), openLegal: vi.fn() };
vi.mock("./AuthContext.jsx", () => ({ useAuthContext: () => ({ user: { name: "Anna" }, setUser: vi.fn(), userId: "u1", accessToken: "tok", loginEmail: "a@b.dk" }) }));
vi.mock("./ProfileContext.jsx", () => ({
  useProfileContext: () => ({ allergens: [], customAllerg: [], family: [], scanFamily: [], activeProfiles: ["me"], household: [{ id: "h1", name: "Bo" }], setHousehold: vi.fn(), householdLoading: false, loadHousehold: vi.fn(), profileLoadStatus: "ok", retryProfileLoad: vi.fn() }),
}));
vi.mock("./NavigationContext.jsx", () => ({ useNavigationContext: () => nav }));
vi.mock("./AllergenPrefsContext.jsx", () => ({ useAllergenPrefsContext: () => ({ selectedENumbers: [] }) }));
import { useHistory } from "./useHistory.js";
import { HistoryProvider } from "./HistoryContext.jsx";
import ProfileScreen from "./ProfileScreen.jsx";

function Shell() {
  const h = useHistory({ accessToken: "tok", userId: "u1" });
  return <HistoryProvider value={h}><ProfileScreen customInput="" setCustomInput={vi.fn()} lookupProduct={vi.fn()} onScanNow={vi.fn()} /></HistoryProvider>;
}
const urls = () => apiCall.mock.calls.map((c) => c[0]);
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 20)); });

beforeEach(() => { apiCall.mockReset(); apiCall.mockResolvedValue({ success: true, scans: [], favorites: [] }); nav = { screen: "history", setScreen: vi.fn(), openLegal: vi.fn() }; });
afterEach(cleanup);

describe("Historik: Mine / Familien", () => {
  it("Familien bliver valgt og forbliver valgt, og historikken hentes for familien (ikke igen for Mine)", async () => {
    render(<Shell />);
    await flush();
    const family = screen.getByRole("button", { name: /Familien/ });
    const mine = screen.getByRole("button", { name: "Mine" });
    expect(mine.getAttribute("aria-pressed")).toBe("true");
    apiCall.mockClear();
    await act(async () => { fireEvent.click(family); });
    await flush();
    expect(screen.getByRole("button", { name: /Familien/ }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Mine" }).getAttribute("aria-pressed")).toBe("false");
    expect(urls().filter((u) => u.includes("/history?") && !u.includes("scope=family"))).toEqual([]); // ingen ny hentning af egen historik
    expect(urls().some((u) => u.includes("scope=family"))).toBe(true);
  });
  it("tilbage til Mine virker også", async () => {
    render(<Shell />);
    await flush();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Familien/ })); });
    await flush();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Mine" })); });
    await flush();
    expect(screen.getByRole("button", { name: "Mine" }).getAttribute("aria-pressed")).toBe("true");
  });
});
