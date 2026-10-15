// @ts-nocheck
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import AuditLogSection from "./AuditLogSection.jsx";

afterEach(() => { cleanup(); delete window.matchMedia; });
const base = { rows: [], names: { users: { a: { name: "Jan" } }, products: {} }, loading: false, loadingMore: false, hasMore: false, loaded: true, error: null, load: vi.fn(), loadMore: vi.fn() };
const r = { id: 7, created_at: "2026-10-15T07:42:00Z", admin_id: "a", action: "produkt_rettet", target_table: "products", target_id: "p", details: { navn: "Havredrik", felter: ["name"] } };
const mobile = () => { window.matchMedia = vi.fn().mockImplementation((q) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })); };

describe("Aktivitetslog", () => {
  it("har kort introduktion og opbevaring nederst, og ingen egen opdateringsknap (den sidder i headeren)", () => {
    render(<AuditLogSection {...base} />);
    expect(screen.getByText("Se, hvem der har foretaget ændringer i systemet, og hvornår.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Opdater/ })).toBeNull();
    expect(screen.getByText(/gemmes i 12 måneder/)).toBeTruthy();
  });
  it("tom log, ingen match og fejl er tre forskellige tilstande", () => {
    const { unmount } = render(<AuditLogSection {...base} />);
    expect(screen.getByText("Ingen aktiviteter endnu")).toBeTruthy();
    expect(screen.getByText("Når der foretages ændringer i systemet, vises de her.")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
    fireEvent.change(screen.getByLabelText("Søg i aktivitetsloggen"), { target: { value: "xyz" } });
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
  it("henter forfra fra serveren, når et filter vælges, og viser antal aktive filtre", () => {
    const load = vi.fn();
    render(<AuditLogSection {...base} load={load} />);
    fireEvent.click(screen.getByRole("button", { name: /Filtre/ }));
    fireEvent.change(screen.getByLabelText("Handling"), { target: { value: "deleted" } });
    expect(load).toHaveBeenLastCalledWith({ type: "deleted", category: "", period: "all", q: "" });
    expect(screen.getByRole("button", { name: "Filtre (1)" })).toBeTruthy();
  });
  it("mobil: kort med mærke, sætning og dato uden tabel; tryk åbner detaljer med felter og uden følsomme data", () => {
    mobile();
    const { container } = render(<AuditLogSection {...base} rows={[r]} />);
    expect(container.querySelector("table")).toBeNull();
    expect(screen.getByText("Jan rettede produktet “Havredrik”")).toBeTruthy();
    expect(screen.getByText("15. oktober 2026 · 09.42")).toBeTruthy();
    fireEvent.click(container.querySelector(".audit-card"));
    const d = screen.getByRole("dialog");
    expect(d.textContent).toContain("Udført af");
    expect(d.textContent).toContain("name");
    expect(d.textContent).toContain("ikke de enkelte værdier");
    expect(d.textContent).not.toMatch(/password|adgangskode|token/i);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("Vis flere vises kun, når der er flere, og henter næste side", () => {
    const loadMore = vi.fn();
    const { rerender } = render(<AuditLogSection {...base} rows={[r]} hasMore loadMore={loadMore} />);
    fireEvent.click(screen.getByRole("button", { name: "Vis flere" }));
    expect(loadMore).toHaveBeenCalled();
    rerender(<AuditLogSection {...base} rows={[r]} hasMore={false} loadMore={loadMore} />);
    expect(screen.queryByRole("button", { name: "Vis flere" })).toBeNull();
  });
  it("detaljen viser før/efter-tabel for indhold og udfald for et afvist forsøg", () => {
    mobile();
    const rows = [
      { ...r, id: 8, details: { navn: "Havredrik", felter: ["allergens"], aendringer: [{ felt: "allergens", fra: [], til: ["gluten"] }] } },
      { id: 9, created_at: "2026-10-15T07:43:00Z", admin_id: "a", action: "adgang_naegtet", outcome: "afvist", target_table: "edge_function", target_id: "products", details: { funktion: "products" } },
    ];
    render(<AuditLogSection {...base} rows={rows} />);
    expect(screen.getAllByText("Mislykket/afvist").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText(/rettede produktet/));
    let d = screen.getByRole("dialog");
    expect(d.textContent).toContain("Før");
    expect(d.textContent).toContain("gluten");
    expect(d.textContent).not.toContain("ikke de enkelte værdier");
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByText(/blev nægtet adgang/));
    d = screen.getByRole("dialog");
    expect(d.textContent).toContain("Afvist");
  });
});
