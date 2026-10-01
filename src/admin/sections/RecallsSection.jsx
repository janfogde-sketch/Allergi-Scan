// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  RECALL_STATUS_LABELS, RECALL_STATUS_PILL, RECALL_VIEWS,
  filterRecalls, countByStatus, addProduct, removeProduct, searchTermFromRaw, confirmSendText,
} from "../recallLogic.js";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" }) : "—");
const VIEW_LABEL = { all: "Alle", ...RECALL_STATUS_LABELS };

function TextBlock({ label, text }) {
  if (!text) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="admin-label">{label}</div>
      <div style={{ fontSize: 13.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

function RecallModal({ recall, onClose, searchProducts, affectedCount, resolve }) {
  const reviewable = recall.status === "needs_review";
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [affected, setAffected] = useState(null);
  const [busy, setBusy] = useState(false);

  const search = async (q = query) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    setResults(await searchProducts(q));
    setSearching(false);
  };

  // Antal berørte brugere opdateres, når de valgte produkter ændres
  useEffect(() => {
    if (!reviewable || selected.length === 0) { setAffected(null); return; }
    let cancelled = false;
    setAffected(null);
    affectedCount(selected.map((p) => p.ean)).then((n) => { if (!cancelled) setAffected(n); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, reviewable]);

  const finish = async (action) => {
    setBusy(true);
    const ok = await resolve(recall.id, action, selected.map((p) => p.ean));
    setBusy(false);
    if (ok) onClose();
  };

  const send = () => {
    if (selected.length === 0 || affected === null) return;
    if (window.confirm(confirmSendText(affected, selected.length))) finish("link");
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" role="dialog" aria-modal="true" aria-label="Tilbagekaldelse" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, overflowWrap: "anywhere" }}>{recall.title}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              {fmtDate(recall.published_at)} · <span className={`admin-pill ${RECALL_STATUS_PILL[recall.status]}`}>{RECALL_STATUS_LABELS[recall.status]}</span>
              {" · "}<a href={recall.source_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)", fontWeight: 700 }}>Åbn Fødevarestyrelsens side</a>
            </div>
          </div>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={onClose} aria-label="Luk">Luk</button>
        </div>

        <TextBlock label="Resumé" text={recall.intro} />
        <TextBlock label="Berørt produkt og partier" text={recall.affected} />
        <TextBlock label="Årsag" text={recall.reason} />
        <TextBlock label="Hvad skal forbrugeren gøre" text={recall.action} />

        {recall.unverified_eans?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div className="admin-label">Tal fra siden uden gyldig stregkode</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {recall.unverified_eans.map((raw) => (
                <button key={raw} type="button" className="admin-btn admin-btn-ghost admin-btn-sm" style={{ fontVariantNumeric: "tabular-nums" }}
                  title="Søg efter tallet i produktkataloget" disabled={!reviewable}
                  onClick={() => { const q = searchTermFromRaw(raw); setQuery(q); search(q); }}>
                  {raw}
                </button>
              ))}
            </div>
          </div>
        )}

        {!reviewable ? (
          <div style={{ marginBottom: 12 }}>
            <div className="admin-label">Knyttede stregkoder</div>
            <div style={{ fontSize: 13.5 }}>{recall.eans?.length ? recall.eans.join(", ") : "Ingen"}</div>
          </div>
        ) : (
          <>
            <div className="admin-label">Knyt produkter</div>
            <form onSubmit={(e) => { e.preventDefault(); search(); }} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input className="admin-search" style={{ flex: 1, maxWidth: "none" }} value={query} placeholder="Søg navn, mærke eller EAN…"
                aria-label="Søg produkt" onChange={(e) => setQuery(e.target.value)} />
              <button type="submit" className="admin-btn admin-btn-ghost" disabled={searching || !query.trim()}>{searching ? "Søger…" : "Søg"}</button>
            </form>
            {results.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                {results.map((p) => (
                  <div key={p.id} className="todo-comment" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, overflowWrap: "anywhere" }}>{p.name}{p.brand ? ` · ${p.brand}` : ""}</div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{p.ean}</div>
                    </div>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" disabled={selected.some((s) => s.ean === p.ean)}
                      onClick={() => setSelected((s) => addProduct(s, p))}>
                      {selected.some((s) => s.ean === p.ean) ? "Tilføjet" : "Tilføj"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="admin-label">Valgte produkter ({selected.length})</div>
            {selected.length === 0 ? (
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>Ingen valgt endnu. Søg og tilføj de produkter, tilbagekaldelsen gælder.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                {selected.map((p) => (
                  <div key={p.ean} className="todo-comment" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                      <strong>{p.name}</strong>{p.brand ? ` · ${p.brand}` : ""} <span style={{ color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{p.ean}</span>
                    </div>
                    <button className="todo-link-btn" onClick={() => setSelected((s) => removeProduct(s, p.ean))} aria-label={`Fjern ${p.name}`}>Fjern</button>
                  </div>
                ))}
              </div>
            )}
            {selected.length > 0 && (
              <div className="info-box" role="status" style={{ marginBottom: 12, fontSize: 13 }}>
                {affected === null ? "Tæller berørte brugere…"
                  : affected === 0 ? "Ingen brugere har produkterne som favorit, scannet dem de seneste 90 dage eller på en indkøbsliste."
                  : `${affected} ${affected === 1 ? "bruger" : "brugere"} får en besked (favorit, scannet de seneste 90 dage eller på en indkøbsliste).`}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="admin-btn admin-btn-primary" onClick={send} disabled={busy || selected.length === 0 || affected === null}>
                {busy ? "Gemmer…" : "Gem og send besked"}
              </button>
              <button className="admin-btn admin-btn-ghost" disabled={busy}
                onClick={() => { if (window.confirm("Arkivér uden at sende besked? Ingen får en besked om denne tilbagekaldelse.")) finish("archive"); }}>
                Ingen relevante produkter
              </button>
              <button className="admin-btn admin-btn-danger" style={{ marginLeft: "auto" }} disabled={busy}
                onClick={() => { if (window.confirm("Annullér tilbagekaldelsen? Der sendes ingen besked.")) finish("cancel"); }}>
                Annullér
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function RecallsSection({ recalls, loading, load, searchProducts, affectedCount, resolve }) {
  const [view, setView] = useState("needs_review");
  const [openId, setOpenId] = useState(null);
  const counts = countByStatus(recalls);
  const visible = filterRecalls(recalls, view);
  const open = openId ? recalls.find((r) => r.id === openId) : null;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
        <div className="admin-tabs" style={{ marginBottom: 0, border: "none", flexWrap: "wrap" }}>
          {RECALL_VIEWS.map((v) => (
            <button key={v} className={`admin-tab-btn${view === v ? " active" : ""}`} onClick={() => setView(v)}>
              {VIEW_LABEL[v]} ({counts[v]})
            </button>
          ))}
        </div>
        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => load()}>Opdater</button>
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
        Tilbagekaldelser fra Fødevarestyrelsen hentes dagligt. Dem, hvor siden ikke har en gyldig stregkode, venter her, til du knytter produkter. Først da sendes en besked til de berørte brugere.
      </div>

      <div className="admin-table-wrap">
        {loading && recalls.length === 0 ? (
          <div className="admin-loading-row"><div className="admin-spinner" /> Henter…</div>
        ) : visible.length === 0 ? (
          <div className="admin-table-empty">{view === "needs_review" ? "Ingen tilbagekaldelser afventer gennemgang" : "Ingen tilbagekaldelser her"}</div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Tilbagekaldelse</th><th>Dato</th><th>Tal på siden</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => setOpenId(r.id)}>
                  <td style={{ maxWidth: 520 }}><div style={{ fontWeight: 700, overflowWrap: "anywhere" }}>{r.title}</div></td>
                  <td style={{ whiteSpace: "nowrap" }}>{fmtDate(r.published_at)}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{r.unverified_eans?.length || "—"}</td>
                  <td><span className={`admin-pill ${RECALL_STATUS_PILL[r.status]}`}>{RECALL_STATUS_LABELS[r.status]}</span></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setOpenId(r.id)}>
                      {r.status === "needs_review" ? "Gennemgå" : "Vis"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <RecallModal key={open.id} recall={open} onClose={() => setOpenId(null)}
          searchProducts={searchProducts} affectedCount={affectedCount} resolve={resolve} />
      )}
    </>
  );
}
