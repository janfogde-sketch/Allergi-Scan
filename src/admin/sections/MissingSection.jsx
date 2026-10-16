// @ts-nocheck
// Ukendte stregkoder: kompakt prioriteringsværktøj. Kort med stregkode, antal forgæves opslag, seneste forsøg og status; søgning på stregkode, filtre for status og periode,
// sortering efter flest opslag (standard) eller seneste forsøg. Et tryk åbner et ark med status, opslag hos Open Food Facts og "Opret produkt" (med kontrol af, om produktet findes).
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useShowSpinner } from "../RefreshContext.js";
import { Icon, showToast } from "../../SharedComponents.jsx";
import { PRODUCT_CATEGORIES } from "../productsLogic.js";
import { fmtAuditDateTime } from "../auditLogic.js";
import { MISSING_STATUS, MISSING_STATUS_LABEL, MISSING_STATUS_PILL, MISSING_SETTABLE, MISSING_PERIODS, MISSING_SORTS, validateCreate, eanWarning, attemptsText } from "../missingLogic.js";
import CloseX from "../CloseX.jsx";

const date = (v) => (v ? new Date(v).toLocaleDateString("da-DK", { timeZone: "Europe/Copenhagen" }) : "–");

function Sheet({ row, m, onClose, onOpenProduct }) {
  const [mode, setMode] = useState("view"); // view | checking | create | exists
  const [existing, setExisting] = useState(null);
  const [f, setF] = useState({ name: "", brand: "", category: "" });
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [created, setCreated] = useState(null);
  const errors = validateCreate({ ean: row.ean, name: f.name });
  const warn = eanWarning(row.ean);
  const exists = row.status === "created" || !!row.product_id;

  useEffect(() => { const k = (e) => { if (e.key === "Escape") onClose(); }; document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [onClose]);

  const startCreate = async () => {
    setMode("checking"); setErr("");
    const r = await m.findProduct(row.ean);
    if (!r.ok) { setMode("view"); setErr("Kunne ikke kontrollere, om produktet findes. Prøv igen."); return; }
    if (r.product) { setExisting(r.product); setMode("exists"); return; }
    setMode("create");
  };
  const submit = async () => {
    setTouched(true);
    if (Object.keys(errors).length) return;
    setBusy(true); setErr("");
    const r = await m.createProduct({ ean: row.ean, ...f });
    setBusy(false);
    if (r.ok) { setCreated(r.product || {}); setMode("done"); showToast("Produktet er oprettet"); }
    else if (r.duplicate) { const x = await m.findProduct(row.ean); setExisting(x.product); setMode("exists"); }
    else setErr(r.error);
  };
  const setStatus = async (status) => { const r = await m.setStatus(row.ean, status); if (!r.ok) setErr(r.error); else showToast("Status ændret"); };

  return ReactDOM.createPortal(
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal todo-panel pe-panel" role="dialog" aria-modal="true" aria-label="Ukendt stregkode" onClick={(e) => e.stopPropagation()}>
        <div className="todo-panel-head">
          <div style={{ minWidth: 0 }}>
            <div className="audit-sheet-title np-mono">{row.ean}</div>
            <div className="audit-sheet-time">{attemptsText(row.attempts)} · seneste {fmtAuditDateTime(row.last_seen)}</div>
          </div>
          <CloseX onClick={onClose} />
        </div>
        <div className="todo-panel-body">
          {err && <div className="pe-notice pe-red" role="alert">{err}</div>}
          <dl className="audit-detail">
            <div className="audit-detail-row"><dt>Status</dt><dd><span className={`admin-pill ${MISSING_STATUS_PILL[row.status] || "admin-pill-neutral"}`}>{MISSING_STATUS_LABEL[row.status] || row.status}</span></dd></div>
            <div className="audit-detail-row"><dt>Første forsøg</dt><dd>{fmtAuditDateTime(row.first_seen)}</dd></div>
            <div className="audit-detail-row"><dt>Forgæves opslag</dt><dd>{row.attempts}</dd></div>
          </dl>
          {warn && <div className="pe-notice pe-amber">{warn}</div>}

          {(mode === "view" || mode === "checking") && (
            <>
              {!exists && (
                <div className="admin-field">
                  <label htmlFor="mi-st">Behandlingsstatus</label>
                  <select id="mi-st" className="admin-select" value={row.status} onChange={(e) => setStatus(e.target.value)}>
                    {MISSING_SETTABLE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <div className="usr-hint">At åbne en stregkode ændrer ikke status. "Oprettet" sættes automatisk, når produktet findes i databasen.</div>
                </div>
              )}
              <div className="mi-actions">
                {exists ? (
                  <button type="button" className="admin-btn admin-btn-primary admin-touch" onClick={() => onOpenProduct(row.ean)}>Åbn produktet{row.product_name ? ` (${row.product_name})` : ""}</button>
                ) : (
                  <button type="button" className="admin-btn admin-btn-primary admin-touch" disabled={mode === "checking"} onClick={startCreate}>{mode === "checking" ? "Kontrollerer…" : "Opret produkt"}</button>
                )}
                <a className="admin-btn admin-btn-ghost admin-touch" style={{ textAlign: "center", textDecoration: "none" }} target="_blank" rel="noopener noreferrer" href={`https://world.openfoodfacts.org/product/${encodeURIComponent(row.ean)}`}>Se på Open Food Facts</a>
              </div>
            </>
          )}

          {mode === "exists" && (
            <div className="pe-notice pe-amber" role="status">
              <b>Produktet findes allerede</b>{existing?.name ? `: ${existing.name}${existing.brand ? ` (${existing.brand})` : ""}` : "."}
              <div className="mi-actions"><button type="button" className="admin-btn admin-btn-primary admin-touch" onClick={() => onOpenProduct(row.ean)}>Åbn produktet</button></div>
            </div>
          )}

          {mode === "create" && (
            <>
              <div className="pe-section">Opret produkt</div>
              <div className="admin-field"><label htmlFor="mi-ean">Stregkode</label><input id="mi-ean" value={row.ean} readOnly className="np-mono" /></div>
              <div className="admin-field">
                <label htmlFor="mi-name">Produktnavn</label>
                <input id="mi-name" value={f.name} aria-invalid={touched && !!errors.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
                {touched && errors.name && <div className="usr-err" role="alert">{errors.name}</div>}
              </div>
              <div className="pe-grid">
                <div className="admin-field"><label htmlFor="mi-brand">Mærke</label><input id="mi-brand" value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} /></div>
                <div className="admin-field"><label htmlFor="mi-cat">Kategori</label>
                  <select id="mi-cat" className="admin-select" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
                    <option value="">Ikke angivet</option>{PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select></div>
              </div>
              <div className="usr-hint">Produktet oprettes som ikke verificeret, og alle allergener står som Ukendt, til ingredienser og allergener er gennemgået i produktredigeringen.</div>
              {touched && errors.ean && <div className="usr-err" role="alert">{errors.ean}</div>}
              <div className="mi-actions">
                <button type="button" className="admin-btn admin-btn-primary admin-touch" disabled={busy} onClick={submit}>{busy ? "Opretter…" : "Opret produkt"}</button>
                <button type="button" className="admin-btn admin-btn-ghost admin-touch" disabled={busy} onClick={() => setMode("view")}>Annuller</button>
              </div>
            </>
          )}

          {mode === "done" && (
            <div className="pe-notice" role="status">
              <b>Produktet er oprettet</b>, ikke verificeret og uden vurderede allergener.
              <div className="mi-actions"><button type="button" className="admin-btn admin-btn-primary admin-touch" onClick={() => onOpenProduct(row.ean)}>Åbn produktet og tilføj ingredienser</button></div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function MissingSection({ missing: m, onOpenProduct = () => {} }) {
  const showSpinner = useShowSpinner(m.loading, m.rows.length > 0);
  const [q, setQ] = useState("");
  const [f, setF] = useState({ status: "", days: "", sort: "count" });
  const [open, setOpen] = useState(null);
  const first = useRef(true);
  const filtered = !!(q.trim() || f.status || f.days);
  const openRow = open ? m.rows.find((r) => r.ean === open) : null;

  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    const t = setTimeout(() => m.load({ q }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bevidst: load genskabes hver gang
  }, [q]);
  const setFilter = (p) => { const n = { ...f, ...p }; setF(n); m.load({ q, ...n }); };
  const reset = () => { setQ(""); const n = { status: "", days: "", sort: f.sort }; setF(n); m.load({ q: "", ...n }); };
  const s = m.summary;

  let body;
  if (m.error && m.rows.length === 0) {
    body = (
      <div className="admin-table-empty audit-state" role="alert">
        <div className="audit-state-icon" aria-hidden="true"><Icon name="warning" size={22} color="var(--muted)" /></div>
        <div className="audit-state-title">{m.error.unavailable ? "Visningen er endnu ikke tilgængelig" : "Kunne ikke hente ukendte stregkoder"}</div>
        <div>{m.error.unavailable ? "Den kræver den seneste databaseopdatering. Det betyder ikke, at der ingen stregkoder er." : "Det betyder ikke, at der ingen stregkoder er. Tjek forbindelsen, og prøv igen."}</div>
        <div style={{ marginTop: 12 }}><button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => m.load({})}>Prøv igen</button></div>
      </div>
    );
  } else if (showSpinner && m.rows.length === 0) {
    body = <div className="admin-loading-row"><div className="admin-spinner" /> Henter…</div>;
  } else if (m.rows.length === 0) {
    body = (
      <div className="admin-table-empty audit-state mi-empty">
        <div className="audit-state-icon" aria-hidden="true"><Icon name="barcode" size={22} color="var(--muted)" /></div>
        <div className="audit-state-title">{filtered ? "Ingen stregkoder matcher" : "Ingen ukendte stregkoder"}</div>
        <div>{filtered ? "Prøv at ændre søgningen eller filtrene." : "Når en bruger scanner en stregkode, som EatSafe ikke kan finde, vises den her."}</div>
        {filtered && <div style={{ marginTop: 12 }}><button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={reset}>Nulstil</button></div>}
      </div>
    );
  } else {
    body = (
      <div className="admin-card-list">
        {m.rows.map((r) => (
          <button key={r.ean} type="button" className="admin-item-card usr-row mi-row" onClick={() => setOpen(r.ean)}>
            <div className="usr-row-name">{r.ean}</div>
            <div className="usr-row-mail">{attemptsText(r.attempts)} · seneste {date(r.last_seen)}</div>
            <div className="usr-row-meta"><span className={`admin-pill ${MISSING_STATUS_PILL[r.status] || "admin-pill-neutral"}`}>{MISSING_STATUS_LABEL[r.status] || r.status}</span>{r.product_name ? ` · ${r.product_name}` : ""}</div>
            <span className="audit-card-chev" aria-hidden="true"><Icon name="chevronRight" size={16} color="var(--muted2)" /></span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <>
      {s && s.total > 0 && (
        <div className="mi-top">
          <span className="mi-count" aria-live="polite"><b>{Number(s.new_count).toLocaleString("da-DK")}</b> ubehandlede · {Number(s.in_progress)} under behandling · {Number(s.created)} oprettet · {Number(s.rejected)} afvist</span>
        </div>
      )}
      <div className="prd-search">
        <label htmlFor="mi-q" className="np-vars-label">Søg på stregkode</label>
        <div className="prd-search-row">
          <input id="mi-q" type="search" inputMode="numeric" enterKeyHint="search" autoComplete="off" className="admin-search" placeholder="Fx 5701234567899" value={q} onChange={(e) => setQ(e.target.value)} />
          {q && <button type="button" className="admin-iconbtn" aria-label="Ryd søgning" onClick={() => setQ("")}><Icon name="x" size={18} color="var(--ink2)" /></button>}
        </div>
      </div>
      <div className="prd-filters" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
        <div className="admin-field"><label htmlFor="mi-fs">Status</label>
          <select id="mi-fs" className="admin-select" value={f.status} onChange={(e) => setFilter({ status: e.target.value })}>
            <option value="">Alle</option>{MISSING_STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select></div>
        <div className="admin-field"><label htmlFor="mi-fp">Periode (seneste forsøg)</label>
          <select id="mi-fp" className="admin-select" value={f.days} onChange={(e) => setFilter({ days: e.target.value })}>
            {MISSING_PERIODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select></div>
        <div className="admin-field"><label htmlFor="mi-so">Sortér</label>
          <select id="mi-so" className="admin-select" value={f.sort} onChange={(e) => setFilter({ sort: e.target.value })}>
            {MISSING_SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select></div>
      </div>
      <div className="audit-results">
        <span aria-live="polite">{m.error && m.rows.length > 0 ? "Kunne ikke opdatere – viser seneste hentede" : m.total === null ? "" : `${m.total.toLocaleString("da-DK")} ${m.total === 1 ? "stregkode" : "stregkoder"}`}</span>
        <span className="prd-actions">{filtered && <button type="button" className="todo-link-btn" onClick={reset}>Nulstil</button>}</span>
      </div>
      {body}
      {m.hasMore && m.rows.length > 0 && (
        <div style={{ textAlign: "center", margin: "14px 0" }}>
          <button type="button" className="admin-btn admin-btn-ghost admin-touch" disabled={m.loadingMore} onClick={() => m.load(null, true)}>{m.loadingMore ? "Henter…" : `Vis flere (${m.rows.length} af ${m.total?.toLocaleString("da-DK")})`}</button>
        </div>
      )}
      {openRow && <Sheet key={openRow.ean} row={openRow} m={m} onClose={() => setOpen(null)} onOpenProduct={(ean) => { setOpen(null); onOpenProduct(ean); }} />}
    </>
  );
}
