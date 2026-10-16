// @ts-nocheck
// @vitest-environment jsdom
// Ændringshistorik: kompakte rækker, faktiske før/efter-værdier (allergen for allergen), ældre poster uden opfundne værdier, slettet produkt, aktør, filtre, fejl er ikke en tom liste.
import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, within, waitFor } from "@testing-library/react";

vi.mock("../../helpers.js", async (orig) => ({ ...(await orig()), apiCall: vi.fn(), makeHeaders: () => ({}) }));
import { apiCall } from "../../helpers.js";
import HistorySection from "./HistorySection.jsx";
import { useAdminHistory } from "../useAdminHistory.js";

afterEach(cleanup);
beforeEach(() => { apiCall.mockReset(); });
const R = (o = {}) => ({ id: "1", source: "audit", at: "2026-10-16T08:00:00Z", action: "updated", product_id: "p1", product_exists: true, ean: "5701234567899", name: "Kartoffelsticks", actor_id: "a1", actor_name: "Jan", changes: [{ felt: "name", fra: "Potato sticks", til: "Kartoffelsticks" }], fields: ["name"], note: null, legacy_fields: null, total_count: 1, ...o });

function Harness({ onOpenProduct }) {
  const h = useAdminHistory("tok");
  React.useEffect(() => { h.load({}); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  return <HistorySection history={h} onOpenProduct={onOpenProduct} />;
}
const routes = (rows) => apiCall.mockImplementation(async (url) => { if (url.includes("rpc/admin_product_history")) return rows; return []; });

describe("Ændringshistorik", () => {
  it("kompakt række med produktnavn, EAN, handling, aktør og kort beskrivelse; ingen tekniske feltnavne", async () => {
    routes([R()]);
    render(<Harness />);
    const row = (await screen.findByText("Kartoffelsticks")).closest("button");
    expect(row.textContent).toContain("5701234567899");
    expect(row.textContent).toContain("Opdateret");
    expect(row.textContent).toContain("Jan");
    expect(row.textContent).toContain("Rettede Produktnavn");
    expect(row.textContent).not.toMatch(/ingredients_text|allergen_flags|type: ingredients/);
  });
  it("detalje: faktisk før og efter, fuldt tidspunkt med årstal og zone, aktør og kilde", async () => {
    routes([R()]);
    render(<Harness />);
    fireEvent.click((await screen.findByText("Kartoffelsticks")).closest("button"));
    const d = await screen.findByRole("dialog");
    expect(within(d).getByText("Potato sticks")).toBeTruthy();
    expect(within(d).getAllByText("Kartoffelsticks").length).toBeGreaterThan(0);
    expect(within(d).getByText(/2026/)).toBeTruthy();
    expect(within(d).getByText("Administratorredigering")).toBeTruthy();
  });
  it("allergenændring fremhæves med allergen, tidligere og ny status", async () => {
    routes([R({ fields: ["allergen_flags"], changes: [{ felt: "allergen_flags", fra: { maelkeallergi: "unknown" }, til: { maelkeallergi: "yes" } }] })]);
    render(<Harness />);
    const row = (await screen.findByText("Kartoffelsticks")).closest("button");
    expect(row.textContent).toContain("Allergen");
    fireEvent.click(row);
    const d = await screen.findByRole("dialog");
    expect(within(d).getByText("Mælk")).toBeTruthy();
    expect(within(d).getByText("Ukendt")).toBeTruthy();
    expect(within(d).getByText("Indeholder")).toBeTruthy();
  });
  it("ældre post uden før/efter: tydelig besked, intet opfundet, ikke tilskrevet uden dokumentation", async () => {
    routes([R({ id: "9", source: "legacy", action: "created", changes: null, fields: null, legacy_fields: "all", note: "Oprettet via brugerindsendelse", actor_id: null, actor_name: null })]);
    render(<Harness />);
    const row = (await screen.findByText("Kartoffelsticks")).closest("button");
    expect(row.textContent).toContain("Ikke registreret");
    fireEvent.click(row);
    const d = await screen.findByRole("dialog");
    expect(within(d).getByText(/Startværdierne er ikke gemt/)).toBeTruthy();
    expect(within(d).getByText(/ældre registrering/)).toBeTruthy();
  });
  it("slettet produkt: bevaret navn og EAN, markeret som slettet, ingen 'Åbn produktet'", async () => {
    routes([R({ action: "deleted", product_exists: false, changes: null, fields: null })]);
    render(<Harness />);
    fireEvent.click((await screen.findByText("Kartoffelsticks")).closest("button"));
    const d = await screen.findByRole("dialog");
    expect(within(d).getByText(/Produktet er slettet/)).toBeTruthy();
    expect(within(d).queryByRole("button", { name: "Åbn produktet" })).toBeNull();
  });
  it("eksisterende produkt kan åbnes direkte fra historikken", async () => {
    const open = vi.fn();
    routes([R()]);
    render(<Harness onOpenProduct={open} />);
    fireEvent.click((await screen.findByText("Kartoffelsticks")).closest("button"));
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Åbn produktet" }));
    expect(open).toHaveBeenCalledWith("5701234567899");
  });
  it("filtre og sortering sendes til serveren", async () => {
    routes([R()]);
    render(<Harness />);
    await screen.findByText("Kartoffelsticks");
    fireEvent.click(screen.getByRole("button", { name: "Slettet" }));
    fireEvent.change(screen.getByLabelText("Allergenændringer"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Sortér"), { target: { value: "oldest" } });
    await waitFor(() => {
      const last = JSON.parse(apiCall.mock.calls.filter(([u]) => u.includes("admin_product_history")).at(-1)[1].body);
      expect(last).toMatchObject({ p_action: "deleted", p_allergen: true, p_sort: "oldest" });
    });
  });
  it("fejl vises som fejl, tom liste som tom; før databaseopdateringen vises de ældre registreringer", async () => {
    apiCall.mockImplementation(async () => { throw Object.assign(new Error("net"), { status: 500 }); });
    render(<Harness />);
    expect(await screen.findByText("Kunne ikke hente ændringshistorikken")).toBeTruthy();
    cleanup(); apiCall.mockReset();
    routes([]);
    render(<Harness />);
    expect(await screen.findByText("Ingen ændringer endnu")).toBeTruthy();
    cleanup(); apiCall.mockReset();
    apiCall.mockImplementation(async (url) => {
      if (url.includes("rpc/admin_product_history")) throw Object.assign(new Error("x"), { status: 404, body: "PGRST202" });
      if (url.includes("revision_log")) return [{ id: "r1", product_id: "p1", changed_by: "a1", change_type: "created", field_changed: "all", new_value: "Oprettet via brugerindsendelse", created_at: "2026-09-10T10:00:00Z" }];
      if (url.includes("rest/v1/products")) return [{ id: "p1", name: "Ældre vare", ean: "5700000000000" }];
      if (url.includes("rest/v1/users")) return [{ id: "a1", name: "Bjørn" }];
      return [];
    });
    render(<Harness />);
    expect(await screen.findByText("Ældre vare")).toBeTruthy();
    expect(screen.getByText(/Viser kun de ældre registreringer/)).toBeTruthy();
  });
});
