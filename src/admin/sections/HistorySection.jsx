// @ts-nocheck
// Ændringshistorik: kompakt aktivitetsliste (produkt, handling, tidspunkt, aktør, kort beskrivelse) med søgning, filtre og sortering på serveren. Et tryk åbner en detaljevisning med
// de faktisk gemte før/efter-værdier (allergen for allergen), aktør, kilde og tekniske oplysninger. Hvad der ikke er gemt, vises som "ikke gemt" og rekonstrueres aldrig.
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useShowSpinner } from "../RefreshContext.js";
import { Icon } from "../../SharedComponents.jsx";
import Disclosure from "../Disclosure.jsx";
import { fmtLocalFull } from "../importLogic.js";
import CloseX from "../CloseX.jsx";
import {
  ACTIONS, ACTION_LABEL, ACTION_PILL, PERIODS, SORTS, KIND_LABEL, fieldLabel, actorOf, sourceOf, allergenDiff, changeKind, valueText, touchesAllergens, describe, hasDetails,
} from "../historyLogic.js";

const when = (v) => new Intl.DateTimeFormat("da-DK", { timeZone: "Europe/Copenhagen", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(v));

function Change({ c }) {
  const diff = c.felt === "allergen_flags" ? allergenDiff(c.fra, c.til) : null;
  if (diff) {
    return (
      <div className="hi-change hi-allergen">
        <div className="hi-field">{fieldLabel(c.felt)} <span className="admin-pill admin-pill-red">Allergen</span></div>
        {diff.length === 0 ? <div className="pe-muted">Ingen ændring i selve allergenstatusserne.</div> : (
          <ul className="hi-flags">
            {diff.map((d) => (
              <li key={d.id}><b>{d.label}</b> <span className="hi-kind">{KIND_LABEL[d.kind]}</span><div className="hi-ba"><span className="hi-before">{d.before}</span><span aria-hidden="true">→</span><span className="hi-after">{d.after}</span></div></li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  return (
    <div className="hi-change">
      <div className="hi-field">{fieldLabel(c.felt)} <span className="hi-kind">{KIND_LABEL[changeKind(c.fra, c.til)]}</span></div>
      <div className="hi-cmp">
        <div className="hi-before"><span className="hi-tag">Før</span>{valueText(c.fra)}</div>
        <div className="hi-after"><span className="hi-tag">Efter</span>{valueText(c.til)}</div>
      </div>
    </div>
  );
}

function Detail({ row, onClose, onOpenProduct }) {
  useEffect(() => { const k = (e) => { if (e.key === "Escape") onClose(); }; document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [onClose]);
  const actor = actorOf(row);
  return ReactDOM.createPortal(
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal todo-panel pe-panel" role="dialog" aria-modal="true" aria-label="Ændring" onClick={(e) => e.stopPropagation()}>
        <div className="todo-panel-head">
          <div style={{ minWidth: 0 }}>
            <div className="audit-sheet-title hi-name">{row.name || "Produkt uden registreret navn"}</div>
            <div className="audit-sheet-time">{row.ean ? <span className="np-mono">{row.ean}</span> : "EAN ikke registreret"}</div>
          </div>
          <CloseX onClick={onClose} />
        </div>
        <div className="todo-panel-body">
          <dl className="audit-detail">
            <div className="audit-detail-row"><dt>Handling</dt><dd><span className={`admin-pill ${ACTION_PILL[row.action]}`}>{ACTION_LABEL[row.action]}</span></dd></div>
            <div className="audit-detail-row"><dt>Tidspunkt</dt><dd>{fmtLocalFull(row.at)}</dd></div>
            <div className="audit-detail-row"><dt>Ansvarlig</dt><dd>{actor.label}</dd></div>
            <div className="audit-detail-row"><dt>Ændringskilde</dt><dd>{sourceOf(row)}</dd></div>
          </dl>
          {row.action === "deleted" && <div className="pe-notice pe-amber">Produktet er slettet. Historikken er bevaret.</div>}
          {row.action !== "deleted" && !row.product_exists && <div className="pe-notice pe-amber">Produktet findes ikke længere.</div>}

          <div className="pe-section">Ændringer</div>
          {hasDetails(row) ? row.changes.map((c, i) => <Change key={i} c={c} />) : (
            <div className="pe-notice" role="status">
              {row.action === "created" ? "Produktet blev oprettet. Startværdierne er ikke gemt i historikken." : row.action === "deleted" ? "Værdierne før sletningen er ikke gemt i historikken." : "Før- og efterværdier er ikke gemt for denne registrering."}
              {row.legacy_fields && row.legacy_fields !== "all" && <div style={{ marginTop: 6 }}>Berørte felter: {row.legacy_fields.split(",").map((s) => fieldLabel(s.trim())).join(", ")}</div>}
              {row.note && <div style={{ marginTop: 6 }}>Note: {row.note}</div>}
            </div>
          )}
          {touchesAllergens(row) && <div className="usr-hint">Ændringer af allergenoplysninger påvirker, hvad appens brugere får vist for produktet.</div>}

          {row.product_exists && row.ean && <div className="mi-actions"><button type="button" className="admin-btn admin-btn-primary admin-touch" onClick={() => onOpenProduct(row.ean)}>Åbn produktet</button></div>}

          <Disclosure title="Tekniske oplysninger">
            <dl className="audit-detail">
              <div className="audit-detail-row"><dt>Registrerings-id</dt><dd className="np-mono">{row.id}</dd></div>
              <div className="audit-detail-row"><dt>Produkt-id</dt><dd className="np-mono">{row.product_id || "–"}</dd></div>
              <div className="audit-detail-row"><dt>Logtype</dt><dd>{row.source === "legacy" ? "Ældre ændringslog (revision_log)" : "Aktivitetslog (admin_audit_log)"}</dd></div>
              <div className="audit-detail-row"><dt>Felter (teknisk)</dt><dd className="np-mono">{Array.isArray(row.fields) ? row.fields.join(", ") : row.legacy_fields || "–"}</dd></div>
            </dl>
          </Disclosure>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function HistorySection({ history: h, onOpenProduct = () => {} }) {
  const showSpinner = useShowSpinner(h.loading, h.rows.length > 0);
  const [q, setQ] = useState("");
  const [f, setF] = useState({ action: "", days: "", allergen: false, sort: "newest" });
  const [open, setOpen] = useState(null);
  const first = useRef(true);
  const filtered = !!(q.trim() || f.action || f.days || f.allergen);
  const openRow = open ? h.rows.find((r) => `${r.source}:${r.id}` === open) : null;

  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    const t = setTimeout(() => h.load({ q }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bevidst: load genskabes hver gang
  }, [q]);
  const setFilter = (p) => { const n = { ...f, ...p }; setF(n); h.load({ q, ...n }); };
  const reset = () => { setQ(""); const n = { action: "", days: "", allergen: false, sort: f.sort }; setF(n); h.load({ q: "", ...n }); };

  let body;
  if (h.error && h.rows.length === 0) {
    body = (
      <div className="admin-table-empty audit-state" role="alert">
        <div className="audit-state-icon" aria-hidden="true"><Icon name="warning" size={22} color="var(--muted)" /></div>
        <div className="audit-state-title">Kunne ikke hente ændringshistorikken</div>
        <div>Det betyder ikke, at der ingen ændringer er. Tjek forbindelsen, og prøv igen.</div>
        <div style={{ marginTop: 12 }}><button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => h.load({})}>Prøv igen</button></div>
      </div>
    );
  } else if (showSpinner && h.rows.length === 0) {
    body = <div className="admin-loading-row"><div className="admin-spinner" /> Henter ændringshistorik…</div>;
  } else if (h.rows.length === 0) {
    body = (
      <div className="admin-table-empty audit-state mi-empty">
        <div className="audit-state-icon" aria-hidden="true"><Icon name="search" size={22} color="var(--muted)" /></div>
        <div className="audit-state-title">{filtered ? "Ingen ændringer matcher" : "Ingen ændringer endnu"}</div>
        <div>{filtered ? "Prøv at ændre søgningen eller filtrene." : "Ændringer af produkter vises her."}</div>
        {filtered && <div style={{ marginTop: 12 }}><button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={reset}>Nulstil</button></div>}
      </div>
    );
  } else {
    body = (
      <div className="admin-card-list">
        {h.rows.map((r) => {
          const actor = actorOf(r);
          return (
            <button key={`${r.source}:${r.id}`} type="button" className="admin-item-card usr-row hi-row" onClick={() => setOpen(`${r.source}:${r.id}`)}>
              <div className="usr-row-name hi-name">{r.name || <span style={{ color: "var(--muted)" }}>Produkt uden registreret navn</span>}</div>
              <div className="usr-row-mail">{r.ean ? <span className="np-mono">{r.ean}</span> : "EAN ikke registreret"} · {describe(r)}</div>
              <div className="usr-row-meta">
                <span className={`admin-pill ${ACTION_PILL[r.action]}`}>{ACTION_LABEL[r.action]}</span>{" "}
                {touchesAllergens(r) && <><span className="admin-pill admin-pill-red">Allergen</span>{" "}</>}
                {when(r.at)} · {actor.label}
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
      <div className="admin-tabs">
        {ACTIONS.map(([id, label]) => (
          <button key={id || "all"} type="button" className={`admin-tab-btn${f.action === id ? " active" : ""}`} onClick={() => setFilter({ action: id })}>{label}</button>
        ))}
      </div>
      <div className="prd-search" style={{ marginTop: 10 }}>
        <label htmlFor="hi-q" className="np-vars-label">Søg på produktnavn, EAN eller administrator</label>
        <div className="prd-search-row">
          <input id="hi-q" type="search" enterKeyHint="search" autoComplete="off" className="admin-search" placeholder="Fx skyr eller 5701234567899" value={q} onChange={(e) => setQ(e.target.value)} />
          {q && <button type="button" className="admin-iconbtn" aria-label="Ryd søgning" onClick={() => setQ("")}><Icon name="x" size={18} color="var(--ink2)" /></button>}
        </div>
      </div>
      <div className="prd-filters" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
        <div className="admin-field"><label htmlFor="hi-p">Periode</label>
          <select id="hi-p" className="admin-select" value={f.days} onChange={(e) => setFilter({ days: e.target.value })}>{PERIODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="admin-field"><label htmlFor="hi-s">Sortér</label>
          <select id="hi-s" className="admin-select" value={f.sort} onChange={(e) => setFilter({ sort: e.target.value })}>{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="admin-field"><label htmlFor="hi-a">Allergenændringer</label>
          <select id="hi-a" className="admin-select" value={f.allergen ? "1" : ""} onChange={(e) => setFilter({ allergen: e.target.value === "1" })}><option value="">Alle ændringer</option><option value="1">Kun allergenændringer</option></select></div>
      </div>
      {h.legacyMode && <div className="pe-notice pe-amber" style={{ marginTop: 10 }}>Viser kun de ældre registreringer, til den seneste databaseopdatering er udgivet. Periode, sortering og allergenfilter virker først da.</div>}
      <div className="audit-results">
        <span aria-live="polite">{h.error && h.rows.length > 0 ? "Kunne ikke opdatere – viser seneste hentede" : h.total === null ? "" : `${h.total.toLocaleString("da-DK")} ${h.total === 1 ? "ændring" : "ændringer"}`}</span>
        <span className="prd-actions">{filtered && <button type="button" className="todo-link-btn" onClick={reset}>Nulstil</button>}</span>
      </div>
      {body}
      {h.hasMore && h.rows.length > 0 && (
        <div style={{ textAlign: "center", margin: "14px 0" }}>
          <button type="button" className="admin-btn admin-btn-ghost admin-touch" disabled={h.loadingMore} onClick={() => h.load(null, true)}>{h.loadingMore ? "Henter…" : `Vis flere (${h.rows.length} af ${h.total?.toLocaleString("da-DK")})`}</button>
        </div>
      )}
      {openRow && <Detail row={openRow} onClose={() => setOpen(null)} onOpenProduct={(ean) => { setOpen(null); onOpenProduct(ean); }} />}
    </>
  );
}
