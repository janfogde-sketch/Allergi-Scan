// @ts-nocheck
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import AuditLogSection from "./AuditLogSection.jsx";

afterEach(() => { cleanup(); delete window.matchMedia; });
const base = { rows: [], names: { users: { a: { name: "Jan" } }, products: {} }, loading: false, loadingMore: false, hasMore: false, loaded: true, error: null, load: vi.fn(), loadMore: vi.fn() };
const r = { id: 7, created_at: "2026-10-15T07:42:00Z", admin_id: "a", action: "produkt_rettet", target_table: "products", target_id: "p", details: { navn: "Havredrik", felter: ["name"] } };
const rejected = { id: 10, created_at: "2026-10-15T14:36:05Z", admin_id: "a", action: "indsendelse_afvist", target_table: "submissions", target_id: "s1", details: { ean: "5705830014337" } };
const mobile = () => { window.matchMedia = vi.fn().mockImplementation((q) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })); };
const openFilters = () => fireEvent.click(screen.getByRole("button", { name: /Filtre/ }));

describe("Aktivitetslog: side", () => {
  it("har kort introduktion, intet permanent søgefelt og ingen egen opdateringsknap (den sidder i headeren)", () => {
    render(<AuditLogSection {...base} />);
    expect(screen.getByText("Se, hvem der har foretaget ændringer i systemet, og hvornår.")).toBeTruthy();
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.queryByRole("button", { name: /Opdater/ })).toBeNull();
  });
  it("'Om aktivitetsloggen' er lukket som standard og viser verificerede oplysninger, når den åbnes", () => {
    render(<AuditLogSection {...base} />);
    expect(screen.queryByText(/90 dage/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Om aktivitetsloggen" }));
    expect(screen.getByText(/12 måneder/)).toBeTruthy();
    expect(screen.getByText(/slettes efter 90 dage/)).toBeTruthy();
    expect(screen.getByText(/adgangskoder/)).toBeTruthy();
  });
  it("tom log, ingen match og fejl er forskellige tilstande", () => {
    const { unmount } = render(<AuditLogSection {...base} />);
    expect(screen.getByText("Ingen aktiviteter endnu")).toBeTruthy();
    expect(screen.getByText("Når der foretages ændringer i systemet, vises de her.")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
    openFilters();
    fireEvent.change(screen.getByLabelText("Søg"), { target: { value: "xyz" } });
    expect(screen.getByText("Ingen matchende aktiviteter")).toBeTruthy();
    expect(screen.getByText("Prøv at ændre din søgning eller dine filtre.")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Nulstil" })[0]);
    expect(screen.getByText("Ingen aktiviteter endnu")).toBeTruthy();
    unmount();
    const load = vi.fn();
    render(<AuditLogSection {...base} error={{ denied: false, message: "x" }} load={load} />);
    expect(screen.queryByText("Ingen aktiviteter endnu")).toBeNull();
    expect(screen.getByText("Aktivitetsloggen kunne ikke hentes")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Prøv igen" }));
    expect(load).toHaveBeenCalled();
  });
  it("manglende adgang vises uden data", () => {
    render(<AuditLogSection {...base} rows={[r]} error={{ denied: true, message: "x" }} />);
    expect(screen.queryByText("Havredrik")).toBeNull();
    expect(screen.getByText("Ingen adgang")).toBeTruthy();
  });
  it("Vis flere vises kun, når der er flere, og henter næste side", () => {
    const loadMore = vi.fn();
    const { rerender } = render(<AuditLogSection {...base} rows={[r]} hasMore loadMore={loadMore} />);
    fireEvent.click(screen.getByRole("button", { name: "Vis flere" }));
    expect(loadMore).toHaveBeenCalled();
    rerender(<AuditLogSection {...base} rows={[r]} hasMore={false} loadMore={loadMore} />);
    expect(screen.queryByRole("button", { name: "Vis flere" })).toBeNull();
  });
});

describe("Aktivitetslog: søgning og filtre", () => {
  it("søgefeltet ligger i filterpanelet, får fokus ved åbning, og en aktiv søgning tæller med og vises som mærke", () => {
    render(<AuditLogSection {...base} />);
    openFilters();
    const input = screen.getByLabelText("Søg");
    expect(document.activeElement).toBe(input);
    fireEvent.change(input, { target: { value: "jan" } });
    expect(screen.getByRole("button", { name: "Filtre (1)" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Filtre (1)" })); // lukker panelet
    expect(screen.getByRole("button", { name: /Søgning: jan/ })).toBeTruthy();
  });
  it("henter forfra fra serveren, når et filter vælges, og viser antal aktive filtre", () => {
    const load = vi.fn();
    render(<AuditLogSection {...base} load={load} />);
    openFilters();
    fireEvent.change(screen.getByLabelText("Handling"), { target: { value: "deleted" } });
    expect(load).toHaveBeenLastCalledWith({ type: "deleted", category: "", period: "all", from: "", to: "", q: "" });
    expect(screen.getByRole("button", { name: "Filtre (1)" })).toBeTruthy();
  });
  it("handlingerne er Oprettet, Ændret, Slettet, Godkendt, Afvist, Eksporteret, Kørsel, Sikkerhedshændelse og Mislykket / nægtet", () => {
    render(<AuditLogSection {...base} />);
    openFilters();
    const labels = [...screen.getByLabelText("Handling").options].map((o) => o.textContent);
    expect(labels).toEqual(["Alle", "Oprettet", "Ændret", "Slettet", "Godkendt", "Afvist", "Eksporteret", "Kørsel", "Sikkerhedshændelse", "Mislykket / nægtet"]);
    expect(labels).not.toContain("Behandlet");
  });
  it("perioden har I dag og Brugerdefineret med to datovælgere, som sendes til serveren", () => {
    const load = vi.fn();
    render(<AuditLogSection {...base} load={load} />);
    openFilters();
    expect([...screen.getByLabelText("Periode").options].map((o) => o.textContent)).toEqual(["Hele perioden", "I dag", "Seneste 7 dage", "Seneste 30 dage", "Brugerdefineret periode"]);
    expect(screen.queryByLabelText("Fra dato")).toBeNull();
    fireEvent.change(screen.getByLabelText("Periode"), { target: { value: "custom" } });
    fireEvent.change(screen.getByLabelText("Fra dato"), { target: { value: "2026-10-01" } });
    fireEvent.change(screen.getByLabelText("Til dato"), { target: { value: "2026-10-10" } });
    expect(load).toHaveBeenLastCalledWith(expect.objectContaining({ period: "custom", from: "2026-10-01", to: "2026-10-10" }));
  });
});

describe("Aktivitetslog: kort og detaljer", () => {
  it("mobil: kortet viser kategori, handling, hvem, element og dato, med pil og uden generisk statusmærke", () => {
    mobile();
    const { container } = render(<AuditLogSection {...base} rows={[rejected]} />);
    expect(container.querySelector("table")).toBeNull();
    const card = container.querySelector(".audit-card");
    expect(within(card).getByText("Indsendelser")).toBeTruthy();
    expect(within(card).getByText("Indsendelse afvist")).toBeTruthy();
    expect(within(card).getByText("Afvist af Jan")).toBeTruthy();
    expect(within(card).getByText("Indsendelse: EAN 5705830014337")).toBeTruthy();
    expect(within(card).getByText("15. oktober 2026 · 16.36")).toBeTruthy();
    expect(card.querySelector(".audit-card-chev")).toBeTruthy();
    expect(card.textContent).not.toContain("Behandlet");
    expect(container.querySelector(".admin-pill")).toBeNull();
  });
  it("detaljen har X i stedet for Luk, ingen standardtekst og lukkede tekniske oplysninger med kopiknapper", () => {
    mobile();
    const { container } = render(<AuditLogSection {...base} rows={[rejected]} />);
    fireEvent.click(container.querySelector(".audit-card"));
    const d = screen.getByRole("dialog");
    expect(within(d).getByText("Indsendelse afvist")).toBeTruthy();
    expect(within(d).getByText("15. oktober 2026 · 16.36.05")).toBeTruthy();
    const close = within(d).getByRole("button", { name: "Luk" });
    expect(close.textContent).toBe("");
    expect(d.textContent).toContain("Udført af");
    expect(d.textContent).toContain("EAN 5705830014337");
    expect(d.textContent).not.toContain("Der er ikke logget flere oplysninger");
    expect(d.textContent).not.toContain("Begrundelse");
    expect(within(d).queryByText("Log-ID")).toBeNull(); // lukket som standard
    fireEvent.click(within(d).getByRole("button", { name: "Tekniske oplysninger" }));
    expect(within(d).getByText("Log-ID")).toBeTruthy();
    expect(within(d).getByRole("button", { name: "Kopiér Log-ID" })).toBeTruthy();
    fireEvent.click(close);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("begrundelsen vises kun, når loggen har en", () => {
    mobile();
    const withReason = { ...rejected, id: 11, details: { ean: "5705830014337", begrundelse: "Produktet findes allerede i databasen." } };
    const { container } = render(<AuditLogSection {...base} rows={[withReason]} />);
    fireEvent.click(container.querySelector(".audit-card"));
    const d = screen.getByRole("dialog");
    expect(d.textContent).toContain("Begrundelse");
    expect(d.textContent).toContain("Produktet findes allerede i databasen.");
  });
  it("før/efter-tabel for indhold og udfald for et afvist forsøg; ingen følsomme data", () => {
    mobile();
    const rows = [
      { ...r, id: 8, details: { navn: "Havredrik", felter: ["allergens"], aendringer: [{ felt: "allergens", fra: [], til: ["gluten"] }] } },
      { id: 9, created_at: "2026-10-15T07:43:00Z", admin_id: "a", action: "adgang_naegtet", outcome: "afvist", target_table: "edge_function", target_id: "products", details: { funktion: "products" } },
    ];
    const { container } = render(<AuditLogSection {...base} rows={rows} />);
    expect(screen.getAllByText("Afvist").length).toBeGreaterThan(0);
    fireEvent.click(container.querySelectorAll(".audit-card")[0]);
    let d = screen.getByRole("dialog");
    expect(d.textContent).toContain("Før");
    expect(d.textContent).toContain("gluten");
    expect(d.textContent).not.toMatch(/password|adgangskode|token/i);
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(container.querySelectorAll(".audit-card")[1]);
    d = screen.getByRole("dialog");
    expect(d.textContent).toContain("Udfald");
    expect(d.textContent).toContain("Afvist");
  });
});

describe("Aktivitetslog: antal og tastatur", () => {
  it("viser antal fra serveren med korrekt ental/flertal og 'Nyeste først' som ren tekst", () => {
    const { unmount } = render(<AuditLogSection {...base} rows={[r]} total={1} />);
    expect(screen.getByText("1 aktivitet")).toBeTruthy();
    expect(screen.getByText("Nyeste først").tagName).toBe("SPAN");
    unmount();
    render(<AuditLogSection {...base} rows={[r]} total={1234} hasMore />);
    expect(screen.getByText("1.234 aktiviteter")).toBeTruthy();
  });
  it("tæller ikke kun de hentede rækker, når der er flere; ukendt antal vises ikke", () => {
    render(<AuditLogSection {...base} rows={[r]} total={null} hasMore />);
    expect(screen.queryByText(/^[\d.]+ aktivitet/)).toBeNull();
  });
  it("ved søgning eller filter står der 'filtreret' ved antallet", () => {
    render(<AuditLogSection {...base} rows={[r]} total={2} />);
    openFilters();
    fireEvent.change(screen.getByLabelText("Søg"), { target: { value: "havre" } });
    expect(screen.getByText("2 aktiviteter · filtreret")).toBeTruthy();
  });
  it("tryk uden for søgefeltet og træk i siden lukker tastaturet; søgeordet bevares og sendes straks", () => {
    const load = vi.fn();
    render(<AuditLogSection {...base} rows={[r]} total={1} load={load} />);
    openFilters();
    const input = screen.getByLabelText("Søg");
    expect(input.getAttribute("enterkeyhint")).toBe("search");
    input.focus();
    fireEvent.change(input, { target: { value: "havre" } });
    expect(document.activeElement).toBe(input);
    fireEvent.pointerDown(document.body);
    expect(document.activeElement).not.toBe(input);
    expect(input.value).toBe("havre");
    expect(load).toHaveBeenLastCalledWith(expect.objectContaining({ q: "havre" }));
    input.focus();
    fireEvent.touchMove(document.body);
    expect(document.activeElement).not.toBe(input);
    expect(input.value).toBe("havre");
  });
  it("tryk i selve søgefeltet lukker ikke tastaturet", () => {
    render(<AuditLogSection {...base} rows={[r]} total={1} />);
    openFilters();
    const input = screen.getByLabelText("Søg");
    input.focus();
    fireEvent.pointerDown(input);
    expect(document.activeElement).toBe(input);
  });
});

