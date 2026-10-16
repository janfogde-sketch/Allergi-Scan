// @ts-nocheck
// @vitest-environment jsdom
// Tilbagekaldelser: tre visninger med tællere, kompakte klikbare kort, fejl/tom/synkroniseringsfejl adskilt, detaljesektioner med strukturerede produkter og matchniveauer,
// gennemgang uden stregkode, beskyttelse mod forkerte valg, og at arkivering ikke påstår at fjerne advarsler.
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within, waitFor, act } from "@testing-library/react";
import RecallsSection from "./RecallsSection.jsx";

afterEach(cleanup);
const base = { id: "r1", source_url: "https://foedevarestyrelsen.dk/a", title: "Tilbagekald: Test kiks", status: "needs_review", published_at: new Date(Date.now() - 2 * 86400000).toISOString(), created_at: "2026-10-12T17:00:00Z", updated_at: "2026-10-12T17:00:00Z", intro: "", reason: "Metalstykker", action: "Kassér varen.", affected: "Testkiks\nEAN: 5701234567899\nLotnr.: A1\nHoldbarhedsdato: 01.01.2027", eans: ["5701234567899"], unverified_eans: [], raw_text: null, source_checked_at: null, revision: 0 };
const mk = (o = {}) => ({ ...base, ...o });
const OKRUN = { id: "s1", status: "ok", started_at: new Date().toISOString(), finished_at: new Date().toISOString() };

function api(over = {}) {
  return {
    recalls: [mk(), mk({ id: "r2", title: "Tilbagekald: Ketchup", status: "ready", eans: ["5702040711032"], affected: "Ketchup\nEAN: 5702040711032\nL-kode: 493181" }), mk({ id: "r3", title: "Tilbagekald: Gammel", status: "archived" }), mk({ id: "r4", title: "ANNULLERET: Fejl", status: "cancelled" })],
    loading: false, loaded: true, error: null, syncRuns: [OKRUN], load: vi.fn(), loadSync: vi.fn(),
    searchProducts: vi.fn(async () => []), affectedCount: vi.fn(async () => 3), findProducts: vi.fn(async () => ({ ok: true, byEan: { "5701234567899": { id: "p1", ean: "5701234567899", name: "Testkiks", brand: "Test" } } })),
    loadDetail: vi.fn(async () => ({ events: [], matches: [], stats: null, eventsOk: true, statsOk: true, newTables: true })), setMatch: vi.fn(async () => ({ ok: true })), resolve: vi.fn(async () => true), nameOf: () => "Jan", ...over,
  };
}
const mount = (o) => { const a = api(o); render(<RecallsSection recalls={a} />); return a; };

describe("Tilbagekaldelser: oversigt", () => {
  it("tre visninger med tællere og kompakte kort; Arkiv rummer arkiveret og annulleret", () => {
    mount();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent.replace(/\d+$/, ""))).toEqual(["Afventer gennemgang", "Varslet", "Arkiv"]);
    expect(tabs.map((t) => t.textContent.match(/\d+$/)[0])).toEqual(["1", "1", "2"]);
    const card = screen.getByText("Tilbagekald: Test kiks").closest("button");
    expect(card.textContent).toContain("Afventer gennemgang");
    expect(card.textContent).toContain("1 berørt produkt");
    expect(card.textContent).toContain("Metalstykker");
    expect(card.textContent).toContain("Ny");
    expect(card.textContent).not.toMatch(/Tal på siden/);
    fireEvent.click(screen.getByRole("tab", { name: /Arkiv/ }));
    expect(screen.getByText("Tilbagekald: Gammel")).toBeTruthy();
    expect(screen.getByText("ANNULLERET: Fejl")).toBeTruthy();
  });
  it("manglende stregkode og ubekræftet kode markeres tydeligt på kortet", () => {
    mount({ recalls: [mk({ eans: [], affected: "Pølse\nLøgpølse" }), mk({ id: "r9", title: "Tilbagekald: Dild", eans: [], unverified_eans: ["571287790945"] })] });
    expect(screen.getAllByText("Mangler stregkode").length).toBe(2);
    expect(screen.getByText(/1 stregkode kræver kontrol/)).toBeTruthy();
  });
  it("søgning på titel, produktnavn, EAN uden foranstillede nuller og lotnummer; filtre og nulstil", () => {
    mount();
    fireEvent.click(screen.getByRole("tab", { name: /Varslet/ }));
    fireEvent.change(screen.getByLabelText(/Søg på titel/), { target: { value: "493181" } });
    expect(screen.getByText("Tilbagekald: Ketchup")).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Søg på titel/), { target: { value: "findes-ikke" } });
    expect(screen.getByText("Ingen tilbagekaldelser matcher")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Nulstil" })[0]);
    expect(screen.getByText("Tilbagekald: Ketchup")).toBeTruthy();
  });
  it("tomme tilstande pr. visning, indlæsning, forbindelsesfejl og serverfejl er adskilt og ingen fejl ligner en tom liste", () => {
    mount({ recalls: [] });
    expect(screen.getByText("Intet afventer gennemgang")).toBeTruthy();
    cleanup();
    render(<RecallsSection recalls={api({ recalls: [], loading: true, loaded: false })} />);
    expect(screen.getByText("Henter tilbagekaldelser…")).toBeTruthy();
    cleanup();
    const a = api({ recalls: [], error: "offline" }); render(<RecallsSection recalls={a} />);
    expect(screen.getByText("Kunne ikke hente tilbagekaldelser")).toBeTruthy();
    expect(screen.queryByText("Intet afventer gennemgang")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Prøv igen" }));
    expect(a.load).toHaveBeenCalled();
    cleanup();
    render(<RecallsSection recalls={api({ recalls: [], error: "server" })} />);
    expect(screen.getByText("Kunne ikke hente tilbagekaldelser")).toBeTruthy();
  });
  it("synkroniseringsstatus: seneste vellykkede tidspunkt vises; fejl og ukendt vises tydeligt med forbehold for tom liste", () => {
    mount();
    expect(screen.getByText(/Seneste vellykkede hentning/)).toBeTruthy();
    cleanup();
    render(<RecallsSection recalls={api({ syncRuns: [{ id: "f", status: "failed", error_code: "kilde_svarer_ikke", started_at: new Date().toISOString() }, OKRUN] })} />);
    expect(screen.getByRole("alert").textContent).toMatch(/mislykkedes.*svarede ikke.*tom liste betyder ikke/);
    cleanup();
    render(<RecallsSection recalls={api({ syncRuns: null, recalls: [] })} />);
    expect(screen.getByText(/kan ikke hentes lige nu/)).toBeTruthy();
  });
});

describe("Tilbagekaldelser: detaljer", () => {
  const open = async (o = {}, id = "Tilbagekald: Test kiks", tab) => { const a = mount(o); if (tab) fireEvent.click(screen.getByRole("tab", { name: tab })); fireEvent.click(screen.getByText(id).closest("button")); const d = await screen.findByRole("dialog"); return { a, d }; };

  it("sektioner, kildelink, strukturerede produkter med lot og dato, match og original tekst bag foldning", async () => {
    const { d } = await open();
    for (const h of ["Overblik", "Årsag", "Berørte produkter", "Forbrugerhandling", "Produktmatch", "Varsling", "Historik"]) expect(within(d).getByText(h)).toBeTruthy();
    expect(within(d).getByRole("link", { name: /Åbn Fødevarestyrelsens tilbagekaldelse/ }).href).toContain("foedevarestyrelsen.dk");
    expect((await within(d).findAllByText("Muligt match")).length).toBeGreaterThan(0); // bestemte partier: stregkode alene er ikke bekræftet
    expect(within(d).queryByText("Bekræftet match")).toBeNull();
    expect(within(d).getByText("A1")).toBeTruthy();
    expect(within(d).getByText("01.01.2027")).toBeTruthy();
    expect(d.querySelector(".todo-panel-head")).toBeTruthy();
    expect(within(d).getByText("Original kildetekst")).toBeTruthy();
  });
  it("uden partioplysninger er stregkodematch kun muligt (ingen falsk sikkerhed)", async () => {
    const { d } = await open({ recalls: [mk({ affected: "Testkiks\nEAN: 5701234567899" })] });
    expect((await within(d).findAllByText("Muligt match")).length).toBeGreaterThan(0);
    expect(within(d).getAllByText(/alle partier kan være omfattet/).length).toBeGreaterThan(0);
    expect(within(d).queryByText("Bekræftet match")).toBeNull();
  });
  it("karton (GTIN-14) og salgsenhed vises hver for sig; kartonen er højst muligt", async () => {
    const r = mk({ affected: "Makrelkræs\nEAN karton: 15705550826125\nEAN på styk / tuben: 5705550826128\nLotnummer: 270526", eans: ["15705550826125", "5705550826128"] });
    const { d } = await open({ recalls: [r], findProducts: vi.fn(async () => ({ ok: true, byEan: { "5705550826128": { id: "p", ean: "5705550826128", name: "Makrelkræs" } } })) });
    expect(await within(d).findByText("Kartonkode")).toBeTruthy();
    expect(within(d).getByText("Salgsenhed")).toBeTruthy();
    expect(within(d).getAllByText(/Muligt match/).length).toBeGreaterThan(0);
    expect(within(d).queryByText("Bekræftet match")).toBeNull();
  });
  it("tilbagekaldelse der dokumenteret omfatter alle partier kan bekræftes uden partinummer", async () => {
    const { d } = await open({ recalls: [mk({ affected: "Alle partier af Testkiks er omfattet\nTestkiks\nEAN: 5701234567899" })] });
    expect((await within(d).findAllByText("Bekræftet match")).length).toBeGreaterThan(0);
  });
  it("produktopslag der fejler vises som fejl, ikke som 'ingen match'", async () => {
    const { d } = await open({ findProducts: vi.fn(async () => ({ ok: false, byEan: {} })) });
    expect(await within(d).findByText(/Produkterne kunne ikke slås op/)).toBeTruthy();
  });
  it("matchafgørelse kræver begrundelse og gemmes med niveau og begrundelse", async () => {
    const { a, d } = await open();
    await within(d).findAllByText("Muligt match");
    fireEvent.click(within(d).getByRole("button", { name: "Registrér afgørelse" }));
    fireEvent.change(within(d).getByLabelText("Matchniveau"), { target: { value: "not_covered" } });
    expect(within(d).getByText(/Manglende oplysninger er ikke dokumentation/)).toBeTruthy();
    await act(async () => { fireEvent.click(within(d).getByRole("button", { name: "Gem afgørelse" })); });
    expect(within(d).getByText(/Skriv en kort begrundelse/)).toBeTruthy();
    expect(a.setMatch).not.toHaveBeenCalled();
    fireEvent.change(within(d).getByLabelText(/Begrundelse/), { target: { value: "Andet parti kontrolleret på emballage" } });
    await act(async () => { fireEvent.click(within(d).getByRole("button", { name: "Gem afgørelse" })); });
    expect(a.setMatch).toHaveBeenCalledWith("r1", "5701234567899", "not_covered", "Andet parti kontrolleret på emballage");
  });
  it("tilbagekaldelse uden stregkode kan gennemgås: søg, knyt, bekræft med note og send", async () => {
    const r = mk({ eans: [], affected: "Løgpølse\nOksepølse" });
    const prod = { id: "p9", ean: "5700000000011", name: "Løgpølse", brand: "Slagter" };
    const { a, d } = await open({ recalls: [r], searchProducts: vi.fn(async () => [prod]) });
    expect(within(d).getByText(/Ingen gyldig stregkode på siden/)).toBeTruthy();
    fireEvent.change(within(d).getByLabelText("Søg produkt"), { target: { value: "løg" } });
    await act(async () => { fireEvent.click(within(d).getByRole("button", { name: "Søg" })); });
    fireEvent.click(await within(d).findByRole("button", { name: "Tilføj" }));
    await waitFor(() => expect(a.affectedCount).toHaveBeenCalled());
    fireEvent.click(within(d).getByRole("button", { name: "Gem og send besked" }));
    expect(within(d).getByRole("alertdialog").textContent).toMatch(/3 brugere vil modtage en varsling/);
    fireEvent.change(within(d).getByLabelText(/Note til historikken/), { target: { value: "Navn og producent stemmer" } });
    await act(async () => { fireEvent.click(within(d).getByRole("button", { name: "Bekræft og send" })); });
    expect(a.resolve).toHaveBeenCalledWith("r1", "link", ["5700000000011"], "Navn og producent stemmer");
  });
  it("et produkt uden fælles ord med tilbagekaldelsen advares der om, og afsendelse kræver bekræftelse", async () => {
    const r = mk({ eans: [], affected: "Løgpølse" });
    const prod = { id: "p8", ean: "5700000000028", name: "Kærnemælk", brand: "Arla" };
    const { a, d } = await open({ recalls: [r], searchProducts: vi.fn(async () => [prod]) });
    fireEvent.change(within(d).getByLabelText("Søg produkt"), { target: { value: "mælk" } });
    await act(async () => { fireEvent.click(within(d).getByRole("button", { name: "Søg" })); });
    fireEvent.click(await within(d).findByRole("button", { name: "Tilføj" }));
    expect(within(d).getByText(/ligner ikke noget på tilbagekaldelsen/)).toBeTruthy();
    await waitFor(() => expect(a.affectedCount).toHaveBeenCalled());
    fireEvent.click(within(d).getByRole("button", { name: "Gem og send besked" }));
    expect(within(d).getByRole("button", { name: "Bekræft og send" }).disabled).toBe(true);
    fireEvent.click(within(d).getByLabelText(/Jeg har kontrolleret/));
    expect(within(d).getByRole("button", { name: "Bekræft og send" }).disabled).toBe(false);
  });
  it("arkivér uden besked kræver bekræftelse og oplyser at appens advarsel ikke påvirkes; arkiverede viser samme forklaring", async () => {
    const { a, d } = await open();
    fireEvent.click(within(d).getByRole("button", { name: "Ingen relevante produkter" }));
    expect(within(d).getByRole("alertdialog").textContent).toMatch(/advarslen i appen påvirkes ikke af arkivering/);
    await act(async () => { fireEvent.click(within(d).getByRole("button", { name: "Arkivér" })); });
    expect(a.resolve).toHaveBeenCalledWith("r1", "archive", [], null);
    cleanup();
    const b = mount({ recalls: [mk({ id: "z", title: "Arkiveret en", status: "archived" })] });
    fireEvent.click(screen.getByRole("tab", { name: /Arkiv/ }));
    fireEvent.click(screen.getByText("Arkiveret en").closest("button"));
    expect((await screen.findByRole("dialog")).textContent).toMatch(/Arkivering skjuler ikke advarslen i appen/);
    expect(b.resolve).not.toHaveBeenCalled();
  });
  it("varsling viser modtagere, afsendt, fejlet og at levering ikke kan opgøres; historik viser hvem og hvad", async () => {
    const stats = { recipients: 5, by_variant: { default: 5 }, deliveries: [{ channel: "push", status: "sent", count: 4 }, { channel: "push", status: "failed", count: 1 }], queued: { status: "done", attempts: 1 } };
    const events = [{ id: 1, created_at: "2026-10-12T17:00:00Z", actor_id: null, kind: "imported", details: { status: "ready" } }, { id: 2, created_at: "2026-10-13T08:00:00Z", actor_id: "a1", kind: "linked", details: { eans: ["5701234567899"], note: "Stemmer" } }];
    const { d } = await open({ recalls: [mk({ status: "ready" })], loadDetail: vi.fn(async () => ({ events, matches: [], stats, eventsOk: true, statsOk: true, newTables: true })) }, "Tilbagekald: Test kiks", /Varslet/);
    expect(await within(d).findByText("Afsendt (accepteret af tjenesten)")).toBeTruthy();
    expect(within(d).getByText(/Levering til telefonen bekræftes ikke/)).toBeTruthy();
    expect(within(d).getByText(/Importeret fra Fødevarestyrelsen/)).toBeTruthy();
    expect(within(d).getByText(/Produkter knyttet \(1\).*Stemmer/)).toBeTruthy();
    expect(within(d).queryByRole("button", { name: "Gem og send besked" })).toBeNull(); // allerede varslet: ingen ny udsendelse herfra
  });
});
