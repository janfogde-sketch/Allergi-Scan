// @ts-nocheck
import React from "react";
import { ALLERGENS } from "../../constants.jsx";

const VERIFIED_STATUSES = ["unverified", "partial", "verified"];

export default function ProductsSection({
  products, productsLoading, productSearch, setProductSearch, loadProducts,
  openProduct, setOpenProduct, editingProduct, setEditingProduct,
  productActionLoading, openProductForEdit, saveProductEdit, deleteProduct,
}) {
  const close = () => { setOpenProduct(null); setEditingProduct(null); };

  const handleDelete = () => {
    if (!openProduct) return;
    if (!window.confirm(`Slet "${openProduct.name || openProduct.ean}" permanent? Dette kan ikke fortrydes.`)) return;
    deleteProduct(openProduct.id);
  };

  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <form onSubmit={e => { e.preventDefault(); loadProducts(); }} style={{ display: "flex", gap: 8, flex: 1 }}>
          <input className="admin-search" placeholder="Søg navn, brand eller EAN…"
            value={productSearch} onChange={e => setProductSearch(e.target.value)} style={{ flex: 1 }} />
          <button type="submit" className="admin-btn admin-btn-ghost admin-btn-sm">Søg</button>
        </form>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          {productSearch.trim() ? `${products.length} resultater` : "Seneste opdaterede"}
        </div>
      </div>

      <div className="admin-table-wrap">
        {productsLoading ? (
          <div className="admin-loading-row"><div className="admin-spinner" /> Henter produkter…</div>
        ) : products.length === 0 ? (
          <div className="admin-table-empty">{productSearch.trim() ? "Ingen produkter matcher" : "Søg for at finde et produkt"}</div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Produkt</th><th>EAN</th><th>Kategori</th><th>Kilde</th><th>Status</th><th>Opdateret</th><th></th></tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => openProductForEdit(p)}>
                  <td>{p.name || <span style={{ color: "var(--muted)" }}>Ukendt</span>}{p.brand ? ` — ${p.brand}` : ""}</td>
                  <td style={{ fontFamily: "var(--mono)" }}>{p.ean}</td>
                  <td>{p.category || <span style={{ color: "var(--muted)" }}>–</span>}</td>
                  <td>{p.source || "–"}</td>
                  <td>
                    <span className={`admin-pill ${p.verified_status === "verified" ? "admin-pill-green" : p.verified_status === "partial" ? "admin-pill-amber" : "admin-pill-neutral"}`}>
                      {p.verified_status || "unverified"}
                    </span>
                  </td>
                  <td>{p.updated_at ? new Date(p.updated_at).toLocaleDateString("da-DK") : "–"}</td>
                  <td><button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={e => { e.stopPropagation(); openProductForEdit(p); }}>Redigér</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {openProduct && !editingProduct && (
        <div className="admin-modal-overlay" onClick={close}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-loading-row"><div className="admin-spinner" /> Henter produkt…</div>
          </div>
        </div>
      )}

      {openProduct && editingProduct && (
        <div className="admin-modal-overlay" onClick={close}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>Redigér produkt</div>
                <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--mono)" }}>EAN {openProduct.ean} · ID: {openProduct.id}</div>
              </div>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={close}>Luk</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div className="admin-field" style={{ marginBottom: 0 }}>
                <label className="admin-label">Produktnavn</label>
                <input value={editingProduct.name} onChange={e => setEditingProduct(s => ({ ...s, name: e.target.value }))} />
              </div>
              <div className="admin-field" style={{ marginBottom: 0 }}>
                <label className="admin-label">Brand</label>
                <input value={editingProduct.brand} onChange={e => setEditingProduct(s => ({ ...s, brand: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div className="admin-field" style={{ marginBottom: 0 }}>
                <label className="admin-label">Kategori</label>
                <input value={editingProduct.category} onChange={e => setEditingProduct(s => ({ ...s, category: e.target.value }))} />
              </div>
              <div className="admin-field" style={{ marginBottom: 0 }}>
                <label className="admin-label">Verificeringsstatus</label>
                <select value={editingProduct.verified_status} onChange={e => setEditingProduct(s => ({ ...s, verified_status: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border2)", fontFamily: "var(--f)", fontSize: 13 }}>
                  {VERIFIED_STATUSES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">Ingredienstekst</label>
              <textarea className="admin-textarea" rows={3} value={editingProduct.ingredients_text}
                onChange={e => setEditingProduct(s => ({ ...s, ingredients_text: e.target.value }))}
                placeholder="Ingrediensliste…" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Allergener (klik for at skifte: Nej → Ja → Spor)</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
                {ALLERGENS.map(a => {
                  const val = editingProduct.allergen_flags[a.id] || "no";
                  const next = val === "no" ? "yes" : val === "yes" ? "traces" : "no";
                  const isYes = val === "yes", isTrace = val === "traces";
                  return (
                    <button key={a.id}
                      onClick={() => setEditingProduct(s => ({ ...s, allergen_flags: { ...s.allergen_flags, [a.id]: next } }))}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 8, cursor: "pointer",
                        border: `1px solid ${isYes ? "var(--red-md)" : isTrace ? "var(--amber-md)" : "var(--border)"}`,
                        background: isYes ? "var(--red-lt)" : isTrace ? "var(--amber-lt)" : "var(--surface3)",
                        fontFamily: "var(--f)", fontSize: 12,
                      }}>
                      <span style={{ flex: 1, textAlign: "left", fontWeight: 600, color: isYes ? "var(--red)" : isTrace ? "var(--amber)" : "var(--muted2)" }}>{a.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: isYes ? "var(--red)" : isTrace ? "var(--amber)" : "var(--muted)" }}>
                        {isYes ? "JA" : isTrace ? "SPOR" : "NEJ"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button className="admin-btn admin-btn-primary" disabled={productActionLoading} onClick={saveProductEdit}>Gem ændringer</button>
              <button className="admin-btn admin-btn-danger" disabled={productActionLoading} onClick={handleDelete} style={{ marginLeft: "auto" }}>Slet produkt</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
