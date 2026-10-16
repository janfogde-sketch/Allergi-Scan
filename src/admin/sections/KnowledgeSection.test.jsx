// @ts-nocheck
// @vitest-environment jsdom
// Leksikonadministrationen: kompakte kort, kategori med antal, filtre, fejl er aldrig en tom liste, formularen (felter efter kategori, chips, låst slug, ikke-gemte ændringer,
// bekræftet sletning, godkendelse kræver resumé og kilde) og at hooken kun sender det, formularen ejer.
import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, within, waitFor, act } from "@testing-library/react";

vi.mock("../../helpers.js", async (orig) => ({ ...(await orig()), apiCall: vi.fn(), makeHeaders: () => ({}) }));
vi.mock("../../SharedComponents.jsx", async (orig) => ({ ...(await orig()), showToast: vi.fn() }));
import { apiCall } from "../../helpers.js";
import KnowledgeSection from "./KnowledgeSection.jsx";
import { useAdminKnowledge } from "../useAdminKnowledge.js";

afterEach(cleanup);
const ROW = { id: "k1", category: "ingredient", title: "Mælk", slug: "maelk", emoji: "🥛", summary: "Mejeriprodukt", status_label: null, sources: [], updated_at: "2026-10-01T10:00:00Z", editorial_status: "draft", published: true };
const FULL = { ...ROW, description: "Beskrivelse", health_notes: null, found_in: ["Ost"], alternatives: [], diet_tags: [], allergen_ids: ["maelkeallergi", "coeliaki"], aliases: [], tags: [], tips: [{ t: "a" }], sort_order: 0, reviewed_at: null, reviewed_by: null };

function Harness(props) {
  const kb = useAdminKnowledge("tok");
  React.useEffect(() => { kb.load({}); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  return <KnowledgeSection knowledge={kb} {...props} />;
}
const routes = (over = {}) => {
  apiCall.mockImplementation(async (url, opts = {}) => {
    for (const [k, v] of Object.entries(over)) if (url.includes(k) && (opts.method || "GET") === (v.method || "GET")) return v.fn(url, opts);
    if (url.includes("select=editorial_status,published")) return [];
    if (url.includes("select=category&")) return [{ category: "ingredient" }, { category: "ingredient" }, { category: "diet" }];
    if (url.includes("id=eq.k1&select=*")) return [FULL];
    if (url.includes("admin_audit_log")) return [];
    if (url.includes("knowledge_base?select=id")) { opts.onResponse?.({ headers: { get: () => "0-0/1" } }); return [ROW]; }
    return [];
  });
};
beforeEach(() => { apiCall.mockReset(); });

describe("Leksikon: liste", () => {
  it("viser kompakte kort og kategorivalg med antal inkl. Kost", async () => {
    routes();
    render(<Harness />);
    expect(await screen.findByText("🥛 Mælk")).toBeTruthy();
    expect(screen.getByText("Mejeriprodukt")).toBeTruthy();
    expect(document.querySelector(".kb-miss").textContent).toMatch(/Mangler kilde/);
    await waitFor(() => expect(screen.getByRole("option", { name: "Ingredienser (2)" })).toBeTruthy());
    expect(screen.getByRole("option", { name: "Kost (1)" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Nyt opslag" })).toBeTruthy();
  });
  it("en fejl vises som fejl med Prøv igen, aldrig som en tom liste", async () => {
    apiCall.mockImplementation(async (url) => { if (url.includes("select=editorial_status")) return []; const e = new Error("net"); throw e; });
    render(<Harness />);
    expect(await screen.findByText("Kunne ikke hente opslag")).toBeTruthy();
    expect(screen.queryByText("Ingen opslag")).toBeNull();
    expect(screen.getByRole("button", { name: "Prøv igen" })).toBeTruthy();
  });
  it("kategorivalg henter igen med filteret", async () => {
    routes();
    render(<Harness />);
    await screen.findByText("🥛 Mælk");
    fireEvent.change(screen.getByLabelText("Kategori"), { target: { value: "diet" } });
    await waitFor(() => expect(apiCall.mock.calls.some(([u]) => u.includes("category=eq.diet"))).toBe(true));
  });
});

describe("Leksikon: formular", () => {
  const openIt = async (over) => { routes(over); render(<Harness />); fireEvent.click(await screen.findByText("🥛 Mælk")); return screen.findByRole("dialog"); };

  it("rediger: slug er låst, tips nævnes, allergener grupperet, Gem slået fra uden ændringer", async () => {
    const d = await openIt();
    expect(within(d).getByText("Rediger opslag")).toBeTruthy();
    fireEvent.click(within(d).getByText("Avancerede indstillinger"));
    expect(within(d).getByLabelText("Slug").readOnly).toBe(true);
    expect(within(d).getByText(/godkendt tip/)).toBeTruthy();
    expect(within(d).getByText("Allergier")).toBeTruthy();
    expect(within(d).getByText("Medicinske tilstande")).toBeTruthy();
    expect(within(d).getByRole("button", { name: "Gem ændringer" }).disabled).toBe(true);
  });
  it("ændres et felt, gemmes kun formularens felter (ingen tips eller risikoniveau), og slug røres ikke", async () => {
    const patch = vi.fn(async () => [{ id: "k1" }]);
    const d = await openIt({ "knowledge_base?id=eq.k1": { method: "PATCH", fn: patch } });
    fireEvent.change(within(d).getByLabelText("Resumé"), { target: { value: "Nyt resumé" } });
    await act(async () => { fireEvent.click(within(d).getByRole("button", { name: "Gem ændringer" })); });
    await waitFor(() => expect(patch).toHaveBeenCalled());
    const [url, opts] = patch.mock.calls[0];
    expect(url).toContain("updated_at=eq.");
    const body = JSON.parse(opts.body);
    expect(body.summary).toBe("Nyt resumé");
    expect(body.slug).toBe("maelk");
    expect(body).not.toHaveProperty("tips");
    expect(body).not.toHaveProperty("risk_level");
    expect(body.allergen_ids).toEqual(["maelkeallergi", "coeliaki"]);
  });
  it("godkendelse uden kilde afvises, og ikke-gemte ændringer kræver bekræftelse ved luk", async () => {
    const d = await openIt();
    fireEvent.change(d.querySelector("#kb-ed"), { target: { value: "approved" } });
    fireEvent.click(within(d).getByRole("button", { name: "Gem ændringer" }));
    expect(within(d).getByText(/Kan ikke godkendes uden kilde/)).toBeTruthy();
    expect(apiCall.mock.calls.some(([, o]) => o?.method === "PATCH")).toBe(false);
    fireEvent.click(within(d).getByRole("button", { name: "Annuller" }));
    expect(screen.getByText("Du har ændringer, der ikke er gemt.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Bliv og ret" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
  it("kilder er chips: dubletter afvises og ugyldige adresser afvises", async () => {
    const d = await openIt();
    const input = within(d).getByLabelText("Kilder");
    fireEvent.change(input, { target: { value: "https://www.sst.dk/a" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(within(d).getByText("sst.dk")).toBeTruthy();
    fireEvent.change(input, { target: { value: "https://www.sst.dk/a" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.change(input, { target: { value: "http://" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(within(d).getAllByText("sst.dk").length).toBe(1);
  });
  it("sletning kræver bekræftelse og markering", async () => {
    const del = vi.fn(async () => null);
    const d = await openIt({ "knowledge_base?id=eq.k1": { method: "DELETE", fn: del } });
    fireEvent.click(within(d).getByRole("button", { name: "Slet opslag" }));
    const confirm = within(d).getByRole("alertdialog", { name: "Slet opslag" });
    const btn = within(confirm).getByRole("button", { name: "Slet opslag" });
    expect(btn.disabled).toBe(true);
    fireEvent.click(within(confirm).getByRole("checkbox"));
    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => expect(del).toHaveBeenCalled());
  });
  it("nyt opslag: slug dannes ud fra titlen, og feltnavnene er danske", async () => {
    routes();
    render(<Harness />);
    fireEvent.click(await screen.findByRole("button", { name: "Nyt opslag" }));
    const d = await screen.findByRole("dialog");
    expect(within(d).getByText("Nyt opslag")).toBeTruthy();
    fireEvent.change(within(d).getByLabelText("Titel"), { target: { value: "Fløde æg" } });
    fireEvent.click(within(d).getByText("Avancerede indstillinger"));
    expect(within(d).getByLabelText("Slug").value).toBe("floede-aeg");
    expect(screen.queryByText(/entry/i)).toBeNull();
  });
});
