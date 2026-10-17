// @ts-nocheck
// Redigering af ét produkt: Produktoplysninger | Ingredienser og allergener | Administration. Fast handlingsbjælke nederst (Annuller / Gem ændringer), advarsel ved ikke-gemte
// ændringer, og Slet produkt adskilt bag en eksplicit bekræftelse. Allergener har fire tilstande (Ukendt, Indeholder, Kan indeholde spor, Ikke påvist); manglende data er altid
// Ukendt, og "Ikke påvist" kræver en ingrediensliste. Databaseværdierne (unknown/yes/traces/no) er uændrede.
import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactDOM from "react-dom";
import { PRODUCT_ALLERGENS } from "../../constants.jsx";
import { Icon } from "../../SharedComponents.jsx";
import Disclosure from "../Disclosure.jsx";
import { fmtAuditDateTime } from "../auditLogic.js";
import CloseX from "../CloseX.jsx";
import { allergenGroups } from "../submissionLogic.js";
import {
  FLAG_STATES, FLAG_META, flagState, canMarkNotDetected, validateProduct, verifyBlockers, eanCheck, productDirty,
  VERIFIED_LABELS, QUALITY_LABELS, SOURCE_LABELS, METHOD_LABELS, labelOr,
} from "../productsLogic.js";

const FIELD_LABELS = { name: "navn", brand: "brand", category: "kategori", ingredients_text: "ingredienser", allergen_flags: "allergener", verified_status: "verificeringsstatus", image_url: "billede", nutrition: "næring" };
const CATEGORIES = ["Kolonial", "Drikkevarer", "Snacks & slik", "Kød & fisk", "Mejeri & æg", "Brød & bagværk", "Frost", "Frugt & grønt", "Færdigretter", "Andet"];

function Notice({ tone = "amber", children, role }) {
  return <div className={`pe-notice pe-${tone}`} role={role}>{children}</div>;
}

function History({ loadHistory, productId }) {
  const [state, setState] = useState({ status: "loading", rows: [] });
  const load = async () => {
    setState({ status: "loading", rows: [] });
    const res = await loadHistory(productId);
    setState(res.ok ? { status: "ok", rows: res.rows } : { status: "error", rows: [] });
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps -- hentes ved åbning */ }, [productId]);
  if (state.status === "loading") return <div className="pe-muted">Henter historik…</div>;
  if (state.status === "error") return <div className="pe-muted" role="alert">Historikken kunne ikke hentes. <button type="button" className="todo-link-btn" onClick={load}>Prøv igen</button></div>;
  if (state.rows.length === 0) return <div className="pe-muted">Ingen registrerede rettelser i aktivitetsloggen.</div>;
  return (
    <ul className="pe-history">
      {state.rows.map((r, i) => {
        const fields = Array.isArray(r.details?.felter) ? r.details.felter.map((f) => FIELD_LABELS[f] || f).join(", ") : "";
        return <li key={i}><span>{fmtAuditDateTime(r.created_at)}</span><span>{fields ? `Rettede ${fields}` : "Rettet"}</span></li>;
      })}
    </ul>
  );
}

export default function ProductEditor({ product, draft, setDraft, busy, onSave, onDelete, onClose, onRetry, loadHistory }) {
  const [confirm, setConfirm] = useState(null); // "discard" | "delete"
  const [ack, setAck] = useState(false);
  const [touched, setTouched] = useState(false);
  const closeRef = useRef(null);

  const ready = !!draft && !draft.loadFailed;
  const cur = ready ? draft : null;
  const dirty = ready && productDirty(draft.orig, draft);
  const v = useMemo(() => (ready ? validateProduct({ ...draft, ean: product.ean }, PRODUCT_ALLERGENS) : { errors: [], warnings: [], conflicts: [] }), [ready, draft, product.ean]);
  const blockers = useMemo(() => (ready ? verifyBlockers(draft, PRODUCT_ALLERGENS) : []), [ready, draft]);
  const ean = eanCheck(product.ean);
  const canSave = ready && dirty && !busy; // fejl vises ved tryk på Gem

  const requestClose = () => { if (dirty && !busy) setConfirm("discard"); else if (!busy) onClose(); };
  closeRef.current = requestClose;
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") closeRef.current(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = (patch) => setDraft((s) => ({ ...s, ...patch }));
  const setFlag = (id, state) => setDraft((s) => ({ ...s, allergen_flags: { ...(s.allergen_flags || {}), [id]: state } }));
  const noIng = ready && !canMarkNotDetected(draft.ingredients_text);
  const verifiedBlocked = (value) => value === "verified" && blockers.length > 0;

  const save = () => { setTouched(true); if (v.errors.length === 0) onSave(); };

  return ReactDOM.createPortal(
    <div className="admin-modal-overlay" onClick={requestClose}>
      <div className="admin-modal todo-panel pe-panel" role="dialog" aria-modal="true" aria-labelledby="pe-title" onClick={(e) => e.stopPropagation()}>
        <div className="todo-panel-head">
          <div style={{ minWidth: 0 }}>
            <div id="pe-title" className="audit-sheet-title">{(ready && draft.name) || product.name || "Produkt uden navn"}</div>
            <div className="audit-sheet-time">EAN {product.ean}{ready && !ean.ok ? " · tjek EAN" : ""}</div>
          </div>
          <CloseX onClick={requestClose} />
        </div>

        <div className="todo-panel-body">
          {!draft && <div className="admin-loading-row"><div className="admin-spinner" /> Henter produkt…</div>}
          {draft?.loadFailed && (
            <div className="admin-table-empty audit-state" role="alert">
              <div className="audit-state-icon" aria-hidden="true"><Icon name="warning" size={22} color="var(--muted)" /></div>
              <div className="audit-state-title">Kunne ikke hente produktet</div>
              <div>Der opstod en fejl. Produktet er ikke ændret.</div>
              <div style={{ marginTop: 12 }}><button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={onRetry}>Prøv igen</button></div>
            </div>
          )}

          {confirm === "discard" && (
            <div className="todo-confirm" role="alertdialog" aria-label="Ikke-gemte ændringer" style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Du har ændringer, der ikke er gemt.</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => setConfirm(null)}>Bliv og ret</button>
                <button type="button" className="admin-btn admin-btn-danger admin-btn-sm admin-touch" onClick={() => { setConfirm(null); onClose(); }}>Kassér ændringer</button>
              </div>
            </div>
          )}

          {ready && (
            <>
              <div className="pe-section">Produktoplysninger</div>
              <div className="admin-field">
                <label htmlFor="pe-name">Produktnavn</label>
                <input id="pe-name" value={draft.name} aria-invalid={touched && !draft.name.trim()} onChange={(e) => set({ name: e.target.value })} />
                {touched && !draft.name.trim() && <div className="usr-err" role="alert">Produktnavn skal udfyldes.</div>}
              </div>
              <div className="pe-grid">
                <div className="admin-field">
                  <label htmlFor="pe-brand">Brand</label>
                  <input id="pe-brand" value={draft.brand} onChange={(e) => set({ brand: e.target.value })} />
                </div>
                <div className="admin-field">
                  <label htmlFor="pe-cat">Kategori</label>
                  <input id="pe-cat" list="pe-cats" value={draft.category} onChange={(e) => set({ category: e.target.value })} />
                  <datalist id="pe-cats">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
                </div>
              </div>
              <dl className="audit-detail">
                <div className="audit-detail-row"><dt>EAN</dt><dd className="np-mono">{product.ean}</dd></div>
                {!ean.ok && <div className="audit-detail-row"><dt>EAN-kontrol</dt><dd>{ean.text}</dd></div>}
                <div className="audit-detail-row"><dt>Datakilde</dt><dd>{labelOr(SOURCE_LABELS, draft.meta?.source)}</dd></div>
                <div className="audit-detail-row"><dt>Opdateret</dt><dd>{draft.meta?.updated_at ? fmtAuditDateTime(draft.meta.updated_at, true) : "Ikke angivet"}</dd></div>
              </dl>

              <div className="pe-section">Ingredienser og allergener</div>
              <div className="admin-field">
                <label htmlFor="pe-ing">Ingrediensliste</label>
                <textarea id="pe-ing" className="admin-textarea" rows={4} value={draft.ingredients_text} onChange={(e) => set({ ingredients_text: e.target.value })} placeholder="Ingrediensliste, som den står på pakken…" />
              </div>
              {v.warnings.map((w) => <Notice key={w} tone="amber">{w}</Notice>)}

              {(() => {
                const g = allergenGroups(draft.allergen_flags, PRODUCT_ALLERGENS);
                return (
                  <div className="admin-info-note" role="status" aria-label="Overblik over allergener" style={{ marginBottom: 8 }}>
                    {g.yes.length > 0 && <div style={{ fontSize: 12.5, lineHeight: 1.5 }}><b style={{ color: "var(--red)" }}>Indeholder:</b> {g.yes.join(", ")}</div>}
                    {g.traces.length > 0 && <div style={{ fontSize: 12.5, lineHeight: 1.5 }}><b style={{ color: "var(--amber)" }}>Kan indeholde spor:</b> {g.traces.join(", ")}</div>}
                    {g.yes.length + g.traces.length === 0 && <div style={{ fontSize: 12.5 }}>Ingen allergener er sat til Indeholder eller Spor.</div>}
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>Ukendt: {g.unset.length} · Ikke påvist: {g.no.length}</div>
                  </div>
                );
              })()}
              <div className="pe-flags" role="group" aria-label="Allergener">
                {PRODUCT_ALLERGENS.map((a) => {
                  const st = flagState(draft.allergen_flags, a.id);
                  const conflict = v.conflicts.some((c) => c.id === a.id);
                  return (
                    <div key={a.id} className={`pe-flag pe-t-${FLAG_META[st].tone}${conflict ? " pe-conflict" : ""}`}>
                      <label htmlFor={`pe-f-${a.id}`}>{a.pickerLabel || a.label}</label>
                      <select id={`pe-f-${a.id}`} className="admin-select" value={st} onChange={(e) => setFlag(a.id, e.target.value)}>
                        {FLAG_STATES.map((s) => <option key={s} value={s} disabled={s === "no" && noIng && st !== "no"}>{FLAG_META[s].label}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
              <Disclosure title="Hvad betyder statusserne?">
                <ul className="pe-legend">
                  {FLAG_STATES.map((s) => <li key={s}><b>{FLAG_META[s].label}:</b> {FLAG_META[s].help}</li>)}
                </ul>
              </Disclosure>

              <div className="pe-section">Administration</div>
              <div className="admin-field">
                <label htmlFor="pe-status">Verificering</label>
                <select id="pe-status" className="admin-select" value={draft.verified_status} onChange={(e) => set({ verified_status: e.target.value })}>
                  {["unverified", "partial", "verified", ...(draft.verified_status === "auto_verified" ? ["auto_verified"] : [])].map((s) => (
                    <option key={s} value={s} disabled={verifiedBlocked(s) && draft.verified_status !== s}>{VERIFIED_LABELS[s]}</option>
                  ))}
                </select>
                {blockers.length > 0 && (
                  <div className="usr-hint">Kan ikke markeres som verificeret endnu: {blockers.join(" ")}</div>
                )}
                {draft.verified_status === "verified" && blockers.length > 0 && <Notice tone="amber">Produktet står som verificeret, men dataene er ufuldstændige. Gennemgå det.</Notice>}
              </div>
              <dl className="audit-detail">
                <div className="audit-detail-row"><dt>Allergendata</dt><dd>{labelOr(QUALITY_LABELS, draft.meta?.allergen_quality)}{draft.meta?.allergen_source_method ? ` · ${labelOr(METHOD_LABELS, draft.meta.allergen_source_method)}` : ""}</dd></div>
                {draft.meta?.ingredients_verified_at && <div className="audit-detail-row"><dt>Ingrediensoplysninger kontrolleret</dt><dd>{fmtAuditDateTime(draft.meta.ingredients_verified_at, true)}</dd></div>}
              </dl>
              <Disclosure title="Rettelseshistorik">
                <History loadHistory={loadHistory} productId={product.id} />
              </Disclosure>
              <Disclosure title="Tekniske oplysninger">
                <dl className="audit-detail"><div className="audit-detail-row"><dt>Produkt-id</dt><dd className="np-mono">{product.id}</dd></div></dl>
              </Disclosure>

              <div className="pe-danger">
                {confirm !== "delete" ? (
                  <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch pe-del" disabled={busy} onClick={() => { setConfirm("delete"); setAck(false); }}>Slet produkt</button>
                ) : (
                  <div className="todo-confirm" role="alertdialog" aria-label="Slet produkt">
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Slet {draft.name || product.ean} permanent?</div>
                    <div style={{ fontSize: 12.5, marginBottom: 8 }}>Produktet fjernes fra EatSafe. Henvisninger fra historik, indkøbslister og ændringslog nulstilles. Det kan ikke fortrydes.</div>
                    <label className="usr-check"><input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} /><span>Jeg forstår, at produktet slettes permanent.</span></label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                      <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" disabled={busy} onClick={() => setConfirm(null)}>Annuller</button>
                      <button type="button" className="admin-btn admin-btn-danger admin-btn-sm admin-touch" disabled={busy || !ack} onClick={onDelete}>{busy ? "Sletter…" : "Slet produkt"}</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {ready && (
          <div className="todo-panel-foot">
            <button type="button" className="admin-btn admin-btn-ghost admin-touch" disabled={busy} onClick={requestClose}>Annuller</button>
            <button type="button" className="admin-btn admin-btn-primary admin-touch todo-spacer" disabled={!canSave} onClick={save}>{busy ? "Gemmer…" : "Gem ændringer"}</button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
