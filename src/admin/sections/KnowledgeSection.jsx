// @ts-nocheck
// Leksikon: kompakte kort (emoji og titel, kategori, resumé, status og dato), kategorivalg med antal, søgning, filtre for manglende oplysninger og redaktionel status,
// sortering og "Vis flere". Alt kører på serveren (hele tabellen). Oprettelse og redigering sker i KnowledgeEditor.
import React, { useState, useEffect, useRef } from "react";
import { useShowSpinner } from "../RefreshContext.js";
import { Icon, showToast } from "../../SharedComponents.jsx";
import KnowledgeEditor from "./KnowledgeEditor.jsx";
import { KB_CATEGORIES, KB_CATEGORY_SINGULAR, KB_SORTS, KB_MISSING_FILTERS, EDITORIAL, EDITORIAL_LABEL } from "../knowledgeLogic.js";

const date = (v) => (v ? new Date(v).toLocaleDateString("da-DK") : "–");
const EMPTY = { category: "ingredient", title: "", slug: "", emoji: "", summary: "", description: "", health_notes: "", status_label: "", sort_order: 0, found_in: [], alternatives: [], diet_tags: [], allergen_ids: [], aliases: [], tags: [], sources: [], editorial_status: "draft", published: true, slugTouched: false };
const PILL = { approved: "admin-pill-green", pending_review: "admin-pill-amber", needs_update: "admin-pill-amber", draft: "admin-pill-neutral" };

/** Rækken fra databasen til formularens form (lister er altid lister, tekst aldrig null). */
export function entryToForm(row) {
  const arr = (v) => (Array.isArray(v) ? v : []);
  return {
    category: row.category, title: row.title || "", slug: row.slug || "", emoji: row.emoji || "", summary: row.summary || "", description: row.description || "",
    health_notes: row.health_notes || "", status_label: row.status_label || "", sort_order: row.sort_order ?? 0,
    found_in: arr(row.found_in), alternatives: arr(row.alternatives), diet_tags: arr(row.diet_tags), allergen_ids: arr(row.allergen_ids), aliases: arr(row.aliases), tags: arr(row.tags), sources: arr(row.sources),
    editorial_status: row.editorial_status || "", published: row.published !== false, slugTouched: true,
  };
}

export default function KnowledgeSection({ knowledge: kb }) {
  const showSpinner = useShowSpinner(kb.loading, kb.entries.length > 0);
  const [search, setSearch] = useState("");
  const [f, setF] = useState({ category: "", missing: "", editorial: "", sort: "manual" });
  const [open, setOpen] = useState(null); // { id, isNew, initial, meta, reviewer } | { id, loading } | { id, failed }
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const first = useRef(true);
  const filtered = !!(f.category || f.missing || f.editorial);
  const q = search.trim();

  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    const t = setTimeout(() => kb.load({ q: search }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bevidst: load genskabes hver gang
  }, [search]);

  const setFilter = (patch) => { const n = { ...f, ...patch }; setF(n); kb.load({ q: search, ...n }); };
  const reset = () => { const n = { category: "", missing: "", editorial: "", sort: f.sort }; setSearch(""); setF(n); kb.load({ q: "", ...n }); };

  const openEntry = async (row) => {
    setSaveError(null);
    setOpen({ id: row.id, loading: true });
    const r = await kb.getEntry(row.id);
    if (!r.ok) { setOpen({ id: row.id, failed: true, denied: r.denied }); return; }
    setOpen({ id: row.id, initial: entryToForm(r.entry), meta: { updated_at: r.entry.updated_at, reviewed_at: r.entry.reviewed_at, tipsCount: Array.isArray(r.entry.tips) ? r.entry.tips.length : 0 }, reviewer: r.reviewer });
  };
  const openNew = () => { setSaveError(null); setOpen({ id: null, isNew: true, initial: { ...EMPTY, category: f.category || EMPTY.category, editorial_status: kb.hasEditorial ? "draft" : "" }, meta: {} }); };
  const close = () => { setOpen(null); setSaveError(null); };

  const save = async (form) => {
    setBusy(true); setSaveError(null);
    const r = await kb.saveEntry(open.isNew ? null : open.id, form, open.meta?.updated_at || null);
    setBusy(false);
    if (r.ok) { showToast(open.isNew ? "Opslaget er oprettet" : "Opslaget er gemt"); close(); kb.load({}); }
    else setSaveError(r);
  };
  const del = async () => {
    setBusy(true);
    const r = await kb.deleteEntry(open.id);
    setBusy(false);
    if (r.ok) { showToast("Opslaget er slettet"); close(); } else setSaveError(r);
  };

  const total = kb.total;
  const countText = total === null ? "" : `${total.toLocaleString("da-DK")} opslag`;

  let body;
  if (kb.error && kb.entries.length === 0) {
    body = (
      <div className="admin-table-empty audit-state" role="alert">
        <div className="audit-state-icon" aria-hidden="true"><Icon name="warning" size={22} color="var(--muted)" /></div>
        <div className="audit-state-title">{kb.error.denied ? "Ingen adgang til leksikonet" : "Kunne ikke hente opslag"}</div>
        <div>{kb.error.denied ? "Din konto har ikke administratorrettighed." : "Det betyder ikke, at der ingen opslag er. Tjek forbindelsen, og prøv igen."}</div>
        {!kb.error.denied && <div style={{ marginTop: 12 }}><button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => kb.load({})}>Prøv igen</button></div>}
      </div>
    );
  } else if (showSpinner && kb.entries.length === 0) {
    body = <div className="admin-loading-row"><div className="admin-spinner" /> Henter opslag…</div>;
  } else if (kb.entries.length === 0) {
    body = (
      <div className="admin-table-empty audit-state">
        <div className="audit-state-icon" aria-hidden="true"><Icon name="search" size={22} color="var(--muted)" /></div>
        <div className="audit-state-title">{q || filtered ? "Ingen opslag matcher" : "Ingen opslag"}</div>
        <div>{q || filtered ? "Prøv at ændre søgningen eller filtrene." : "Opret det første opslag."}</div>
        {(q || filtered) && <div style={{ marginTop: 12 }}><button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={reset}>Nulstil</button></div>}
      </div>
    );
  } else {
    body = (
      <div className="admin-card-list">
        {kb.entries.map((e) => {
          const miss = [!String(e.summary ?? "").trim() && "resumé", !(e.sources || []).length && "kilde"].filter(Boolean); // listen henter ikke beskrivelsen
          const es = e.editorial_status || "";
          return (
            <button key={e.id} type="button" className="admin-item-card usr-row kb-row" onClick={() => openEntry(e)}>
              <div className="usr-row-name kb-name">{e.emoji ? `${e.emoji} ` : ""}{e.title}</div>
              {e.summary ? <div className="usr-row-mail kb-sum">{e.summary}</div> : <div className="usr-row-mail kb-sum kb-none">Intet resumé</div>}
              <div className="usr-row-meta">
                <span className="admin-pill admin-pill-neutral">{KB_CATEGORY_SINGULAR[e.category] || e.category}</span>{" "}
                {kb.hasEditorial && <><span className={`admin-pill ${PILL[es] || "admin-pill-neutral"}`}>{EDITORIAL_LABEL[es] || "Ikke gennemgået"}</span>{" "}</>}
                {kb.hasEditorial && e.published === false && <><span className="admin-pill admin-pill-amber">Skjult</span>{" "}</>}
                {miss.length > 0 && <span className="kb-miss">Mangler {miss.join(", ")} · </span>}
                {date(e.updated_at)}
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
      <div className="kb-top">
        <div className="prd-search" style={{ flex: 1, marginBottom: 0 }}>
          <label htmlFor="kb-q" className="np-vars-label">Søg på titel, slug, resumé, alias eller tag</label>
          <div className="prd-search-row">
            <input id="kb-q" type="search" enterKeyHint="search" autoComplete="off" className="admin-search" placeholder="Fx mælk eller E322" value={search}
              onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.currentTarget.blur(); kb.load({ q: search }); } }} />
            {search && <button type="button" className="admin-iconbtn" aria-label="Ryd søgning" onClick={() => setSearch("")}><Icon name="x" size={18} color="var(--ink2)" /></button>}
          </div>
        </div>
        <button type="button" className="admin-btn admin-btn-primary admin-touch kb-new" onClick={openNew}>Nyt opslag</button>
      </div>

      <div className="prd-filters" style={{ marginTop: 10 }}>
        <div className="admin-field"><label htmlFor="kb-cat">Kategori</label>
          <select id="kb-cat" className="admin-select" value={f.category} onChange={(e) => setFilter({ category: e.target.value })}>
            <option value="">Alle{kb.counts ? ` (${Object.values(kb.counts).reduce((a, b) => a + b, 0)})` : ""}</option>
            {KB_CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}{kb.counts ? ` (${kb.counts[v] || 0})` : ""}</option>)}
          </select></div>
        <div className="admin-field"><label htmlFor="kb-mis">Mangler</label>
          <select id="kb-mis" className="admin-select" value={f.missing} onChange={(e) => setFilter({ missing: e.target.value })}>
            <option value="">Alle</option>{KB_MISSING_FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select></div>
        {kb.hasEditorial && (
          <div className="admin-field"><label htmlFor="kb-ed">Redaktionel status</label>
            <select id="kb-ed" className="admin-select" value={f.editorial} onChange={(e) => setFilter({ editorial: e.target.value })}>
              <option value="">Alle</option><option value="none">Ikke gennemgået</option>{EDITORIAL.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select></div>
        )}
        <div className="admin-field"><label htmlFor="kb-sort">Sortér</label>
          <select id="kb-sort" className="admin-select" value={f.sort} onChange={(e) => setFilter({ sort: e.target.value })}>
            {KB_SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select></div>
      </div>

      <div className="audit-results">
        <span aria-live="polite">{kb.error && kb.entries.length > 0 ? "Kunne ikke opdatere – viser seneste hentede" : countText}</span>
        <span className="prd-actions">{(q || filtered) && <button type="button" className="todo-link-btn" onClick={reset}>Nulstil</button>}</span>
      </div>

      {body}

      {kb.hasMore && kb.entries.length > 0 && (
        <div style={{ textAlign: "center", margin: "14px 0" }}>
          <button type="button" className="admin-btn admin-btn-ghost admin-touch" disabled={kb.loadingMore} onClick={() => kb.load(null, true)}>
            {kb.loadingMore ? "Henter…" : `Vis flere${total !== null ? ` (${kb.entries.length} af ${total.toLocaleString("da-DK")})` : ""}`}
          </button>
        </div>
      )}

      {open?.loading && <div className="kb-loading" role="status"><div className="admin-spinner" /> Åbner opslag…</div>}
      {open?.failed && (
        <div className="kb-loading" role="alert">
          {open.denied ? "Ingen adgang til opslaget." : "Opslaget kunne ikke hentes."}{" "}
          <button type="button" className="todo-link-btn" onClick={() => openEntry({ id: open.id })}>Prøv igen</button>{" "}
          <button type="button" className="todo-link-btn" onClick={close}>Luk</button>
        </div>
      )}
      {open?.initial && (
        <KnowledgeEditor key={open.id || "new"} entryId={open.id} isNew={!!open.isNew} initial={open.initial} orig={open.initial} meta={open.meta} reviewer={open.reviewer}
          hasEditorial={kb.hasEditorial} loadHistory={kb.loadHistory} onSave={save} onDelete={del} onClose={close} busy={busy} saveError={saveError} />
      )}
    </>
  );
}
