// @ts-nocheck
// Produkter: kompakte kort (navn som overskrift, derefter brand/EAN, kategori, kilde, verificering og dato), søgning på navn og EAN, filtre for kategori, kilde og
// verificering og tydelig sortering. Alt kører på serveren (hele tabellen). CSV ligger i en sekundær menu. Redigering sker i ProductEditor.
import React, { useState, useEffect, useRef } from "react";
import { useShowSpinner } from "../RefreshContext.js";
import { Icon } from "../../SharedComponents.jsx";
import { downloadCsv } from "../csvExport.js";
import ProductEditor from "./ProductEditor.jsx";
import {
  PRODUCT_SORTS, PRODUCT_CATEGORIES, SOURCE_FILTERS, STATUS_FILTERS, VERIFIED_LABELS, VERIFIED_TONE, SOURCE_LABELS, labelOr,
} from "../productsLogic.js";

const CSV_COLUMNS = [
  { key: "name", label: "Navn" },
  { key: "brand", label: "Brand" },
  { key: "ean", label: "EAN" },
  { key: "category", label: "Kategori" },
  { key: "sourceLabel", label: "Kilde" },
  { key: "statusLabel", label: "Verificering" },
  { key: "updated_at", label: "Opdateret" },
  { key: "id", label: "Produkt-id" },
];
const date = (v) => (v ? new Date(v).toLocaleDateString("da-DK") : "–");
const PILL = { green: "admin-pill-green", amber: "admin-pill-amber", neutral: "admin-pill-neutral" };

export default function ProductsSection({
  products, productsLoading, productSearch, setProductSearch, loadProducts,
  productFilters = { category: "", source: "", status: "", sort: "updated_desc" }, setProductFilters = () => {}, productTotal = null, productHasMore = false, productsError = false, productsLoadingMore = false,
  openProduct, setOpenProduct, editingProduct, setEditingProduct,
  productActionLoading, openProductForEdit, saveProductEdit, deleteProduct, loadProductHistory,
}) {
  const showSpinner = useShowSpinner(productsLoading, products.length > 0);
  const [menu, setMenu] = useState(false);
  const first = useRef(true);
  const close = () => { setOpenProduct(null); setEditingProduct(null); };
  const filtered = !!(productFilters.category || productFilters.source || productFilters.status);
  const q = productSearch.trim();

  // Søgningen kører, mens der skrives (efter en kort pause); første visning hentes af siden selv
  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    const t = setTimeout(() => loadProducts(productSearch), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bevidst: loadProducts genskabes hver gang
  }, [productSearch]);

  const exportCsv = () => {
    setMenu(false);
    const rows = products.map((p) => ({ ...p, sourceLabel: labelOr(SOURCE_LABELS, p.source, ""), statusLabel: labelOr(VERIFIED_LABELS, p.verified_status || "unverified") }));
    downloadCsv(`eatsafe-produkter-${new Date().toISOString().slice(0, 10)}.csv`, rows, CSV_COLUMNS);
  };
  const reset = () => { setProductSearch(""); setProductFilters({ category: "", source: "", status: "" }); };

  const countText = productTotal === null ? "" : `${productTotal.toLocaleString("da-DK")} ${productTotal === 1 ? "produkt" : "produkter"}`;

  let body;
  if (productsError && products.length === 0) {
    body = (
      <div className="admin-table-empty audit-state" role="alert">
        <div className="audit-state-icon" aria-hidden="true"><Icon name="warning" size={22} color="var(--muted)" /></div>
        <div className="audit-state-title">Kunne ikke hente produkter</div>
        <div>Det betyder ikke, at der ingen produkter er. Tjek forbindelsen, og prøv igen.</div>
        <div style={{ marginTop: 12 }}><button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => loadProducts(productSearch)}>Prøv igen</button></div>
      </div>
    );
  } else if (showSpinner && products.length === 0) {
    body = <div className="admin-loading-row"><div className="admin-spinner" /> Henter produkter…</div>;
  } else if (products.length === 0) {
    body = (
      <div className="admin-table-empty audit-state">
        <div className="audit-state-icon" aria-hidden="true"><Icon name="search" size={22} color="var(--muted)" /></div>
        <div className="audit-state-title">{q || filtered ? "Ingen produkter matcher" : "Ingen produkter"}</div>
        <div>{q || filtered ? "Prøv at ændre søgningen eller filtrene." : "Der er ingen produkter at vise."}</div>
        {(q || filtered) && <div style={{ marginTop: 12 }}><button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={reset}>Nulstil</button></div>}
      </div>
    );
  } else {
    body = (
      <div className="admin-card-list">
        {products.map((p) => {
          const st = p.verified_status || "unverified";
          return (
            <button key={p.id} type="button" className="admin-item-card usr-row prd-row" onClick={() => openProductForEdit(p)}>
              <div className="usr-row-name prd-name">{p.name || <span style={{ color: "var(--muted)" }}>Uden navn</span>}</div>
              <div className="usr-row-mail">{p.brand ? `${p.brand} · ` : ""}<span className="np-mono">{p.ean}</span></div>
              <div className="usr-row-meta">
                <span className={`admin-pill ${PILL[VERIFIED_TONE[st] || "neutral"]}`}>{labelOr(VERIFIED_LABELS, st)}</span>{" "}
                {p.category || "Uden kategori"} · {labelOr(SOURCE_LABELS, p.source, "Ukendt kilde")} · {date(p.updated_at)}
              </div>
              <span className="audit-card-chev" aria-hidden="true"><Icon name="chevronRight" size={16} color="var(--muted2)" /></span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <div className="prd-search">
        <label htmlFor="prd-q" className="np-vars-label">Søg på produktnavn, brand eller EAN</label>
        <div className="prd-search-row">
          <input id="prd-q" type="search" enterKeyHint="search" autoComplete="off" className="admin-search" placeholder="Fx skyr eller 5701234567899" value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.currentTarget.blur(); loadProducts(productSearch); } }} />
          {productSearch && <button type="button" className="admin-iconbtn" aria-label="Ryd søgning" onClick={() => setProductSearch("")}><Icon name="x" size={18} color="var(--ink2)" /></button>}
        </div>
      </div>

      <div className="prd-filters">
        <div className="admin-field"><label htmlFor="prd-cat">Kategori</label>
          <select id="prd-cat" className="admin-select" value={productFilters.category} onChange={(e) => setProductFilters({ category: e.target.value })}>
            <option value="">Alle</option>{PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select></div>
        <div className="admin-field"><label htmlFor="prd-src">Kilde</label>
          <select id="prd-src" className="admin-select" value={productFilters.source} onChange={(e) => setProductFilters({ source: e.target.value })}>
            <option value="">Alle</option>{SOURCE_FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select></div>
        <div className="admin-field"><label htmlFor="prd-st">Verificering</label>
          <select id="prd-st" className="admin-select" value={productFilters.status} onChange={(e) => setProductFilters({ status: e.target.value })}>
            <option value="">Alle</option>{STATUS_FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select></div>
        <div className="admin-field"><label htmlFor="prd-sort">Sortér</label>
          <select id="prd-sort" className="admin-select" value={productFilters.sort} onChange={(e) => setProductFilters({ sort: e.target.value })}>
            {PRODUCT_SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select></div>
      </div>

      <div className="audit-results">
        <span aria-live="polite">{productsError && products.length > 0 ? "Kunne ikke opdatere – viser seneste hentede" : countText || (q || filtered ? "" : "Seneste opdaterede")}</span>
        <span className="prd-actions">
          {(q || filtered) && <button type="button" className="todo-link-btn" onClick={reset}>Nulstil</button>}
          <span className="prd-menu">
            <button type="button" className="admin-iconbtn" aria-label="Flere handlinger" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}><Icon name="more" size={18} color="var(--ink2)" /></button>
            {menu && (
              <div className="prd-menu-list" role="menu">
                <button type="button" role="menuitem" className="prd-menu-item" disabled={products.length === 0} onClick={exportCsv}><Icon name="download" size={14} color="var(--ink2)" /> Eksportér viste som CSV ({products.length})</button>
              </div>
            )}
          </span>
        </span>
      </div>

      {body}

      {productHasMore && products.length > 0 && (
        <div style={{ textAlign: "center", margin: "14px 0" }}>
          <button type="button" className="admin-btn admin-btn-ghost admin-touch" disabled={productsLoadingMore} onClick={() => loadProducts(productSearch, undefined, true)}>
            {productsLoadingMore ? "Henter…" : `Vis flere${productTotal !== null ? ` (${products.length} af ${productTotal.toLocaleString("da-DK")})` : ""}`}
          </button>
        </div>
      )}

      {openProduct && (
        <ProductEditor product={openProduct} draft={editingProduct} setDraft={setEditingProduct} busy={productActionLoading}
          onSave={saveProductEdit} onDelete={() => deleteProduct(openProduct.id)} onClose={close} onRetry={() => openProductForEdit(openProduct)} loadHistory={loadProductHistory} />
      )}
    </>
  );
}
