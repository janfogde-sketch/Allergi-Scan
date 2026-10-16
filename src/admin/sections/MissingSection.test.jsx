// @ts-nocheck
// @vitest-environment jsdom
// Ukendte stregkoder: kompakte kort, tom tilstand uden spild, separat fejltilstand, oprettelse med kontrol af eksisterende produkt, og at status først ændres, når administratoren selv vælger det.
import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, within, waitFor, act } from "@testing-library/react";

vi.mock("../../helpers.js", async (orig) => ({ ...(await orig()), apiCall: vi.fn(), makeHeaders: () => ({}) }));
vi.mock("../../SharedComponents.jsx", async (orig) => ({ ...(await orig()), showToast: vi.fn() }));
import { apiCall } from "../../helpers.js";
import MissingSection from "./MissingSection.jsx";
import { useAdminMissing } from "../useAdminMissing.js";

afterEach(cleanup);
beforeEach(() => { apiCall.mockReset(); });
const ROW = (o = {}) => ({ ean: "0012345678905", attempts: 7, first_seen: "2026-10-01T10:00:00Z", last_seen: "2026-10-15T10:00:00Z", status: "new", product_id: null, product_name: null, total_count: 1, ...o });

function Harness({ onOpenProduct }) {
  const m = useAdminMissing("tok");
  React.useEffect(() => { m.load({}); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  return <MissingSection missing={m} onOpenProduct={onOpenProduct} />;
}
const routes = ({ list = [ROW()], summary = { total: 1, new_count: 1, in_progress: 0, created: 0, rejected: 0 }, ...over } = {}) => {
  apiCall.mockImplementation(async (url, opts = {}) => {
    for (const [k, fn] of Object.entries(over)) if (url.includes(k)) return fn(url, opts);
    if (url.includes("rpc/admin_missing_eans")) return typeof list === "function" ? list(opts) : list;
    if (url.includes("rpc/admin_missing_ean_summary")) return [summary];
    if (url.includes("rest/v1/products?ean=")) return [];
    return [];
  });
};

describe("Ukendte stregkoder", () => {
  it("viser kompakte kort med stregkode (foranstillede nuller bevaret), antal forsøg, status og tæller for ubehandlede", async () => {
    routes();
    render(<Harness />);
    expect(await screen.findByText("0012345678905")).toBeTruthy();
    expect(screen.getByText(/7 forsøg/)).toBeTruthy();
    expect(document.querySelector(".usr-row-meta").textContent).toContain("Ny");
    await waitFor(() => expect(document.querySelector(".mi-count").textContent).toMatch(/1\s*ubehandlede/));
  });
  it("sender standardsortering efter flest opslag, og 'seneste forsøg' + periode som parametre", async () => {
    routes();
    render(<Harness />);
    await screen.findByText("0012345678905");
    expect(JSON.parse(apiCall.mock.calls[0][1].body)).toMatchObject({ p_sort: "count", p_status: null });
    fireEvent.change(screen.getByLabelText("Sortér"), { target: { value: "last_seen" } });
    fireEvent.change(screen.getByLabelText("Periode (seneste forsøg)"), { target: { value: "7" } });
    await waitFor(() => {
      const last = JSON.parse(apiCall.mock.calls.filter(([u]) => u.includes("admin_missing_eans")).at(-1)[1].body);
      expect(last).toMatchObject({ p_sort: "last_seen", p_days: 7 });
    });
  });
  it("tom liste: den aftalte tekst, ingen fejl", async () => {
    routes({ list: [], summary: { total: 0, new_count: 0, in_progress: 0, created: 0, rejected: 0 } });
    render(<Harness />);
    expect(await screen.findByText("Ingen ukendte stregkoder")).toBeTruthy();
    expect(screen.getByText("Når en bruger scanner en stregkode, som EatSafe ikke kan finde, vises den her.")).toBeTruthy();
  });
  it("fejl vises som fejl med Prøv igen, aldrig som en tom liste", async () => {
    apiCall.mockImplementation(async () => { throw Object.assign(new Error("net"), { status: 500 }); });
    render(<Harness />);
    expect(await screen.findByText("Kunne ikke hente ukendte stregkoder")).toBeTruthy();
    expect(screen.queryByText("Ingen ukendte stregkoder")).toBeNull();
  });
  it("manglende databasefunktion (før udgivelse) vises som ikke tilgængelig, ikke som tom", async () => {
    apiCall.mockImplementation(async () => { throw Object.assign(new Error("x"), { status: 404, body: "PGRST202" }); });
    render(<Harness />);
    expect(await screen.findByText("Visningen er endnu ikke tilgængelig")).toBeTruthy();
  });
  it("at åbne en registrering ændrer ikke status", async () => {
    routes();
    render(<Harness />);
    fireEvent.click(await screen.findByText("0012345678905"));
    await screen.findByRole("dialog");
    expect(apiCall.mock.calls.some(([u]) => u.includes("admin_set_missing_ean_status"))).toBe(false);
    expect(screen.getByLabelText("Behandlingsstatus").value).toBe("new");
  });
  it("statusændring sendes til databasen og opdaterer kortet", async () => {
    const set = vi.fn(async () => null);
    routes({ "rpc/admin_set_missing_ean_status": set });
    render(<Harness />);
    fireEvent.click(await screen.findByText("0012345678905"));
    const d = await screen.findByRole("dialog");
    await act(async () => { fireEvent.change(within(d).getByLabelText("Behandlingsstatus"), { target: { value: "in_progress" } }); });
    await waitFor(() => expect(set).toHaveBeenCalled());
    expect(JSON.parse(set.mock.calls[0][1].body)).toEqual({ p_ean: "0012345678905", p_status: "in_progress" });
  });
  it("opret produkt: kontrollerer først, overfører stregkoden, kræver navn, og sender kun ikke-verificerede grunddata", async () => {
    const post = vi.fn(async () => ({ success: true, product: { id: "p1" } }));
    routes({ "functions/v1/products": post });
    render(<Harness />);
    fireEvent.click(await screen.findByText("0012345678905"));
    const d = await screen.findByRole("dialog");
    await act(async () => { fireEvent.click(within(d).getByRole("button", { name: "Opret produkt" })); });
    expect(await within(d).findByLabelText("Stregkode")).toBeTruthy();
    expect(within(d).getByLabelText("Stregkode").value).toBe("0012345678905");
    fireEvent.click(within(d).getAllByRole("button", { name: "Opret produkt" }).at(-1));
    expect(within(d).getByText("Produktnavn skal udfyldes.")).toBeTruthy();
    expect(post).not.toHaveBeenCalled();
    fireEvent.change(within(d).getByLabelText("Produktnavn"), { target: { value: "Skyr naturel" } });
    await act(async () => { fireEvent.click(within(d).getAllByRole("button", { name: "Opret produkt" }).at(-1)); });
    await waitFor(() => expect(post).toHaveBeenCalled());
    const body = JSON.parse(post.mock.calls[0][1].body);
    expect(body).toMatchObject({ ean: "0012345678905", name: "Skyr naturel" });
    for (const k of ["verified_status", "allergen_flags", "ingredients_text"]) expect(body).not.toHaveProperty(k);
    expect(await within(d).findByText(/ikke verificeret og uden vurderede allergener/)).toBeTruthy();
  });
  it("findes produktet allerede, oprettes det ikke igen, men kan åbnes", async () => {
    const post = vi.fn();
    const open = vi.fn();
    routes({ "functions/v1/products": post, "rest/v1/products?ean=": () => [{ id: "p9", name: "Eksisterende", brand: "Arla" }] });
    render(<Harness onOpenProduct={open} />);
    fireEvent.click(await screen.findByText("0012345678905"));
    const d = await screen.findByRole("dialog");
    await act(async () => { fireEvent.click(within(d).getByRole("button", { name: "Opret produkt" })); });
    expect(await within(d).findByText("Produktet findes allerede")).toBeTruthy();
    fireEvent.click(within(d).getByRole("button", { name: "Åbn produktet" }));
    expect(open).toHaveBeenCalledWith("0012345678905");
    expect(post).not.toHaveBeenCalled();
  });
  it("en registrering hvor produktet nu findes vises som Oprettet og tilbyder Åbn produktet", async () => {
    routes({ list: [ROW({ status: "created", product_id: "p1", product_name: "Skyr" })] });
    render(<Harness />);
    expect(await screen.findByText("Oprettet")).toBeTruthy();
    fireEvent.click(screen.getByText("0012345678905"));
    const d = await screen.findByRole("dialog");
    expect(within(d).getByRole("button", { name: /Åbn produktet/ })).toBeTruthy();
    expect(within(d).queryByLabelText("Behandlingsstatus")).toBeNull();
  });
});
