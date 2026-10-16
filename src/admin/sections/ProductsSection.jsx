// @ts-nocheck
import { useShowSpinner } from "../RefreshContext.js";
import React from "react";
import ProductEditor from "./ProductEditor.jsx";
import { downloadCsv } from "../csvExport.js";
import { VERIFIED_LABELS, labelOr } from "../productsLogic.js";

const CSV_COLUMNS = [
  { key: "name", label: "Navn" },
  { key: "brand", label: "Brand" },
  { key: "ean", label: "EAN" },
  { key: "category", label: "Kategori" },
  { key: "source", label: "Kilde" },
  { key: "verified_status", label: "Status" },
  { key: "updated_at", label: "Opdateret" },
  { key: "id", label: "Produkt-id" },
];

export default function ProductsSection({
  products, productsLoading, productSearch, setProductSearch, loadProducts,
  openProduct, setOpenProduct, editingProduct, setEditingProduct,
  productActionLoading, openProductForEdit, saveProductEdit, deleteProduct, loadProductHistory,
}) {
  const showSpinner = useShowSpinner(productsLoading, products.length > 0);
  const close = () => { setOpenProduct(null); setEditingProduct(null); };

  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <form onSubmit={e => { e.preventDefault(); loadProducts(); }} style={{ display: "flex", gap: 8, flex: 1 }}>
          <input className="admin-search" placeholder="Søg navn, brand eller EAN…"
            value={productSearch} onChange={e => setProductSearch(e.target.value)} style={{ flex: 1 }} />
          <button type="submit" className="admin-btn admin-btn-ghost admin-btn-sm">Søg</button>
        </form>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            {productSearch.trim() ? `${products.length} resultater` : "Seneste opdaterede"}
          </span>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" disabled={products.length === 0}
            onClick={() => downloadCsv(`eatsafe-produkter-${new Date().toISOString().slice(0, 10)}.csv`, products, CSV_COLUMNS)}>
            Eksportér CSV
          </button>
        </div>
      </div>

      <div className="admin-table-wrap">
        {showSpinner ? (
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
                  <td data-label="EAN" style={{ fontFamily: "var(--mono)" }}>{p.ean}</td>
                  <td data-label="Kategori">{p.category || <span style={{ color: "var(--muted)" }}>–</span>}</td>
                  <td data-label="Kilde">{p.source || "–"}</td>
                  <td data-label="Status">
                    <span className={`admin-pill ${p.verified_status === "verified" ? "admin-pill-green" : p.verified_status === "partial" ? "admin-pill-amber" : "admin-pill-neutral"}`}>
                      {labelOr(VERIFIED_LABELS, p.verified_status || "unverified")}
                    </span>
                  </td>
                  <td data-label="Opdateret">{p.updated_at ? new Date(p.updated_at).toLocaleDateString("da-DK") : "–"}</td>
                  <td><button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={e => { e.stopPropagation(); openProductForEdit(p); }}>Redigér</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {openProduct && (
        <ProductEditor product={openProduct} draft={editingProduct} setDraft={setEditingProduct} busy={productActionLoading}
          onSave={saveProductEdit} onDelete={() => deleteProduct(openProduct.id)} onClose={close} onRetry={() => openProductForEdit(openProduct)} loadHistory={loadProductHistory} />
      )}
    </>
  );
}
