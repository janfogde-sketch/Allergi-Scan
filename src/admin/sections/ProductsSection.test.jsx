// @ts-nocheck
// @vitest-environment jsdom
// Produktformularen: manglende allergendata er Ukendt (aldrig Nej), "Ikke påvist" kræver en ingrediensliste, konflikter og ufuldstændige produkter advares om,
// ikke-gemte ændringer er beskyttet, og sletning kræver bekræftelse.
import React, { useState } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import ProductsSection from "./ProductsSection.jsx";

afterEach(cleanup);
const P = { id: "11111111-2222-3333-4444-555555555555", ean: "5701234567899", name: "Skyr naturel", brand: "Arla", category: "Mejeri & æg", source: "katalog", verified_status: "unverified", updated_at: "2026-10-01T10:00:00Z" };
const mk = (o = {}) => {
  const fields = { name: "Skyr naturel", brand: "Arla", category: "Mejeri & æg", ingredients_text: "", allergen_flags: { gluten: "unknown" }, verified_status: "unverified", ...o };
  return { ...fields, orig: JSON.parse(JSON.stringify(fields)), meta: { source: "katalog", allergen_quality: "low", allergen_source_method: "keyword", updated_at: "2026-10-01T10:00:00Z" } };
};
function Harness({ initial, onSave = vi.fn(), onDelete = vi.fn(), onClose = vi.fn(), loadFailed = false, onRetry = vi.fn() }) {
  const [draft, setDraft] = useState(loadFailed ? { loadFailed: true } : initial);
  return (
    <ProductsSection products={[P]} productsLoading={false} productSearch="" setProductSearch={() => {}} loadProducts={() => {}}
      openProduct={P} setOpenProduct={onClose} editingProduct={draft} setEditingProduct={(f) => { setDraft(f); }}
      productActionLoading={false} openProductForEdit={onRetry} saveProductEdit={onSave} deleteProduct={onDelete}
      loadProductHistory={async () => ({ ok: true, rows: [{ created_at: "2026-10-02T10:00:00Z", details: { felter: ["allergen_flags"] } }] })} />
  );
}
const sel = (name) => screen.getByLabelText(name);

describe("Produktformular", () => {
  it("manglende og ukendte allergener vises som Ukendt, aldrig Nej/Ikke påvist", () => {
    render(<Harness initial={mk({ allergen_flags: { gluten: "unknown" } })} />);
    expect(sel("Glutenfølsomhed").value).toBe("unknown"); // gluten har en egen pickerLabel
    expect(sel("Æg").value).toBe("unknown"); // nøglen findes slet ikke
    expect(screen.queryByText("NEJ")).toBeNull();
    for (const s of document.querySelectorAll(".pe-flag select")) expect(s.value).toBe("unknown");
  });
  it("uden ingrediensliste kan 'Ikke påvist' ikke vælges, og der advares; med ingredienser kan den", () => {
    render(<Harness initial={mk()} />);
    const opt = within(sel("Æg")).getByRole("option", { name: "Ikke påvist" });
    expect(opt.disabled).toBe(true);
    expect(screen.getAllByText(/Ingredienslisten mangler/).length).toBeGreaterThan(0);
    fireEvent.change(sel("Ingrediensliste"), { target: { value: "Vand, sukker, salt" } });
    expect(within(sel("Æg")).getByRole("option", { name: "Ikke påvist" }).disabled).toBe(false);
  });
  it("Skyr uden mælk markeres til manuel kontrol, men ændrer ikke allergenerne selv", () => {
    render(<Harness initial={mk({ ingredients_text: "Pasteuriseret skummetmælk, syrningskultur", allergen_flags: { maelkeallergi: "no" } })} />);
    expect(screen.getByText(/Navnet tyder på mælk, men mælk er sat til ikke påvist/)).toBeTruthy();
    expect(sel("Mælk").value).toBe("no");
  });
  it("Gem er slået fra uden ændringer, og et tomt navn giver en tydelig fejl uden at gemme", () => {
    const onSave = vi.fn();
    render(<Harness initial={mk()} onSave={onSave} />);
    const save = screen.getByRole("button", { name: "Gem ændringer" });
    expect(save.disabled).toBe(true);
    fireEvent.change(sel("Produktnavn"), { target: { value: "  " } });
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    expect(screen.getByText("Produktnavn skal udfyldes.")).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.change(sel("Produktnavn"), { target: { value: "Skyr vanilje" } });
    fireEvent.click(save);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
  it("lukning med ændringer kræver bekræftelse; uden ændringer lukker den med det samme", () => {
    const onClose = vi.fn();
    render(<Harness initial={mk()} onClose={onClose} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Luk" })[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
    cleanup();
    onClose.mockClear();
    render(<Harness initial={mk()} onClose={onClose} />);
    fireEvent.change(sel("Brand"), { target: { value: "Ny" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Annuller" })[0]);
    expect(screen.getByRole("alertdialog", { name: "Ikke-gemte ændringer" })).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Bliv og ret" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Annuller" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Kassér ændringer" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it("verificeret kan ikke vælges, før ingredienser, kendte allergener og uden konflikter; statusnavne er danske", () => {
    render(<Harness initial={mk()} />);
    const status = sel("Verificering");
    expect(within(status).getByRole("option", { name: "Ikke verificeret" })).toBeTruthy();
    expect(within(status).getByRole("option", { name: "Delvist verificeret" })).toBeTruthy();
    expect(within(status).getByRole("option", { name: "Verificeret" }).disabled).toBe(true);
    expect(screen.getByText(/Kan ikke markeres som verificeret endnu/)).toBeTruthy();
    expect(screen.queryByText("unverified")).toBeNull();
  });
  it("UUID er skjult i Tekniske oplysninger, og historikken hentes fra aktivitetsloggen", async () => {
    render(<Harness initial={mk()} />);
    expect(screen.queryByText(P.id)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Tekniske oplysninger" }));
    expect(screen.getByText(P.id)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Rettelseshistorik" }));
    expect(await screen.findByText(/Rettede allergener/)).toBeTruthy();
  });
  it("Slet produkt er adskilt og kræver en bekræftelse før den virker", () => {
    const onDelete = vi.fn();
    render(<Harness initial={mk()} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: "Slet produkt" }));
    const dlg = screen.getByRole("alertdialog", { name: "Slet produkt" });
    const del = within(dlg).getByRole("button", { name: "Slet produkt" });
    expect(del.disabled).toBe(true);
    fireEvent.click(within(dlg).getByRole("checkbox"));
    fireEvent.click(del);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
  it("kan produktet ikke hentes, vises en fejl med Prøv igen, og der kan ikke gemmes", () => {
    const onRetry = vi.fn();
    render(<Harness initial={null} loadFailed onRetry={onRetry} />);
    expect(screen.getByRole("alert").textContent).toMatch(/Kunne ikke hente produktet/);
    expect(screen.queryByRole("button", { name: "Gem ændringer" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Prøv igen" }));
    expect(onRetry).toHaveBeenCalled();
  });
  it("lange produktnavne ombrydes i overskriften", () => {
    render(<Harness initial={mk({ name: "Ekstra".repeat(40) })} />);
    expect(document.getElementById("pe-title").textContent.length).toBeGreaterThan(200);
  });
});
