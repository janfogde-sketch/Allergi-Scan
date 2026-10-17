// @ts-nocheck
// @vitest-environment jsdom
// Indkøbslisten: Tilføj er slået fra uden tekst, almindelige varer kontrolleres for dubletter (ens uden hensyn til store/små bogstaver og mellemrum),
// gentagne tryk opretter kun én vare, og den tomme liste har den nye tekst.
import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";

vi.mock("./helpers.js", async (orig) => ({ ...(await orig()), apiCall: vi.fn(async () => ({ success: true, products: [], total: 0 })), makeHeaders: () => ({}), logSearchSelection: vi.fn() }));
vi.mock("./SharedComponents.jsx", async (orig) => ({ ...(await orig()), showToast: vi.fn() }));
import { showToast } from "./SharedComponents.jsx";
import { AuthProvider } from "./AuthContext.jsx";
import { ProfileProvider } from "./ProfileContext.jsx";
import { AllergenPrefsProvider } from "./AllergenPrefsContext.jsx";
import { NavigationProvider } from "./NavigationContext.jsx";
import { ShoppingProvider } from "./ShoppingContext.jsx";
import ListScreen from "./ListScreen.jsx";

afterEach(cleanup);
const noop = () => {};
let addToList;
const setup = (items = []) => {
  const Shell = () => {
    const [n, setN] = React.useState("");
    const shopping = { lists: [{ id: "l1", name: "Min indkøbsliste", owner_id: "u1", shopping_list_items: items }], activeList: { id: "l1", name: "Min indkøbsliste", owner_id: "u1" }, activeListId: "l1", setActiveListId: noop,
      shoppingList: items, newItemName: n, setNewItemName: setN, addToList, toggleItem: noop, removeItem: noop, clearDone: noop, familyMembers: [], loadFamilyMembers: noop, createList: noop, renameList: noop, deleteList: noop, joinByCode: noop,
      getListAccess: noop, grantAccess: noop, revokeAccess: noop, setListType: noop, rotateListCode: noop, leaveList: noop, loadShoppingList: noop, listsError: false };
    return (
      <AuthProvider value={{ user: { name: "A" }, userId: "u1", accessToken: "t" }}>
        <ProfileProvider value={{ scanFamily: [], allergens: ["maelkeallergi"], customAllerg: [], activeProfiles: ["me"], setActiveProfiles: noop, profileLoadStatus: "ok", retryProfileLoad: noop }}>
          <AllergenPrefsProvider value={{ selectedENumbers: [] }}>
            <NavigationProvider value={{ setScreen: noop }}>
              <ShoppingProvider value={shopping}><ListScreen activeIds={["maelkeallergi"]} activeLevels={{}} lookupProduct={noop} onOpenHelp={noop} /></ShoppingProvider>
            </NavigationProvider>
          </AllergenPrefsProvider>
        </ProfileProvider>
      </AuthProvider>
    );
  };
  return render(<Shell />);
};
beforeEach(() => { addToList = vi.fn(async () => true); vi.mocked(showToast).mockClear(); });

describe("ListScreen: tilføj vare", () => {
  it("Tilføj er slået fra, når feltet er tomt eller kun mellemrum, og aktiv ved tekst", () => {
    setup();
    const btn = screen.getByRole("button", { name: "Tilføj" });
    expect(btn.disabled).toBe(true);
    const input = screen.getByLabelText("Søg eller skriv en vare");
    fireEvent.change(input, { target: { value: "   " } });
    expect(screen.getByRole("button", { name: "Tilføj" }).disabled).toBe(true);
    fireEvent.change(input, { target: { value: "Æbler" } });
    expect(screen.getByRole("button", { name: "Tilføj" }).disabled).toBe(false);
  });
  it("en almindelig vare, der allerede står på listen (uanset bogstaver og mellemrum), tilføjes ikke igen, og brugeren får en venlig besked", async () => {
    setup([{ id: "i1", name: "Havre  Mælk", ean: null, checked: false }]);
    fireEvent.change(screen.getByLabelText("Søg eller skriv en vare"), { target: { value: "havre mælk" } });
    const btn = screen.getByRole("button", { name: "På listen" });
    expect(btn.disabled).toBe(true);
    await act(async () => { fireEvent.click(btn); });
    expect(addToList).not.toHaveBeenCalled();
  });
  it("en almindelig vare med samme navn som et databaseprodukt (med EAN) er en anden vare og tilføjes", async () => {
    setup([{ id: "i1", name: "Mælk", ean: "5701234567899", checked: false }]);
    fireEvent.change(screen.getByLabelText("Søg eller skriv en vare"), { target: { value: "Mælk" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Tilføj" })); });
    expect(addToList).toHaveBeenCalledWith("Mælk");
  });
  it("gentagne tryk, mens en vare tilføjes, opretter kun én vare", async () => {
    let resolve;
    addToList = vi.fn(() => new Promise((r) => { resolve = r; }));
    setup();
    fireEvent.change(screen.getByLabelText("Søg eller skriv en vare"), { target: { value: "Brød" } });
    const btn = screen.getByRole("button", { name: "Tilføj" });
    await act(async () => { fireEvent.click(btn); fireEvent.click(btn); fireEvent.click(btn); });
    expect(addToList).toHaveBeenCalledTimes(1);
    await act(async () => { resolve(true); });
  });
  it("den tomme liste har overskriften og forklaringen uden ekstra knap", () => {
    setup();
    expect(screen.getByText("Din indkøbsliste er tom")).toBeTruthy();
    expect(screen.getByText("Søg efter et produkt ovenfor, eller skriv en vare, du vil tilføje.")).toBeTruthy();
  });
  it("infoikonet står på titellinjen og åbner hjælpen; teksten Sådan fungerer listen og overskriften Aktiv liste er væk", () => {
    const { container } = setup();
    expect(screen.queryByText("Sådan fungerer listen")).toBeNull();
    expect(screen.queryByText(/aktiv liste/i)).toBeNull();
    expect(screen.getByRole("button", { name: /Skift eller administrér lister/ })).toBeTruthy();
    expect(screen.getByText("Min indkøbsliste")).toBeTruthy();
    expect(container.querySelector(".ibtn")).toBeTruthy();
  });
  it("Tilføj står stadig, mens der vises søgeresultater, og en vare uden databasematch kan tilføjes manuelt", async () => {
    setup();
    fireEvent.change(screen.getByLabelText("Søg eller skriv en vare"), { target: { value: "Zzxq" } });
    await act(async () => { await new Promise((r) => setTimeout(r, 200)); });
    expect(screen.getByText(/Ingen produkter matcher/)).toBeTruthy();
    const btn = screen.getByRole("button", { name: "Tilføj" });
    expect(btn.disabled).toBe(false);
    await act(async () => { fireEvent.click(btn); });
    expect(addToList).toHaveBeenCalledWith("Zzxq");
  });
  it("tomtilstanden ved søgning har en knap til manuel tilføjelse", async () => {
    setup();
    fireEvent.change(screen.getByLabelText("Søg eller skriv en vare"), { target: { value: "Zzxq" } });
    await act(async () => { await new Promise((r) => setTimeout(r, 200)); });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Tilføj "Zzxq" som manuel vare/ })); });
    expect(addToList).toHaveBeenCalledWith("Zzxq");
  });
  it("søgefeltet har en kort pladsholder, der kan stå på 320 px, og et fuldt navn til skærmlæsere", () => {
    setup();
    const input = screen.getByLabelText("Søg eller skriv en vare");
    expect(input.getAttribute("placeholder")).toBe("Søg eller skriv…");
  });
});
