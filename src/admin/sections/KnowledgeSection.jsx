// @ts-nocheck
import React from "react";
import { ALLERGENS } from "../../constants.jsx";

const CATEGORIES = ["allergen", "e_number", "ingredient", "diet", "cross_reaction", "faq", "fun_fact"];
const CATEGORY_LABELS = {
  allergen: "Allergen", e_number: "E-nummer", ingredient: "Ingrediens", diet: "Kost",
  cross_reaction: "Krydsreaktion", faq: "FAQ", fun_fact: "Sjov viden",
};
const RISK_LEVELS = ["", "none", "low", "medium", "high"];
const RISK_LABELS = { "": "(ikke sat)", none: "Ingen", low: "Lav", medium: "Middel", high: "Høj" };

function slugify(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[æå]/g, "a").replace(/ø/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Array-felter (found_in, alternatives, diet_tags, allergen_ids, aliases, tags,
// sources) gemmes i formularen som kommasepareret tekst og splittes/joines
// ved hentning/gemning (se kbArraysToText/kbTextToArrays i useAdmin.js) — et
// simpelt tekstfelt er den mest robuste UI for 7 forskellige frie lister,
// fremfor 7 separate chip-widgets.
function ArrayField({ label, value, onChange, placeholder }) {
  return (
    <div className="admin-field">
      <label className="admin-label">{label} <span style={{ fontWeight: 400, color: "var(--muted)" }}>(kommasepareret)</span></label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export default function KnowledgeSection({
  knowledgeEntries, knowledgeLoading, knowledgeSearch, setKnowledgeSearch,
  knowledgeCategoryFilter, setKnowledgeCategoryFilter, loadKnowledgeEntries,
  openKnowledgeEntry, setOpenKnowledgeEntry, editingKnowledgeEntry, setEditingKnowledgeEntry,
  knowledgeActionLoading, openKnowledgeEntryForEdit, openNewKnowledgeEntry,
  saveKnowledgeEntry, deleteKnowledgeEntry,
}) {
  const close = () => { setOpenKnowledgeEntry(null); setEditingKnowledgeEntry(null); };

  const handleDelete = () => {
    if (!openKnowledgeEntry || openKnowledgeEntry.isNew) return;
    if (!window.confirm(`Slet "${openKnowledgeEntry.title}" permanent? Dette kan ikke fortrydes.`)) return;
    deleteKnowledgeEntry(openKnowledgeEntry.id);
  };

  const selectedAllergenIds = (editingKnowledgeEntry?.allergen_ids || "").split(",").map(s => s.trim()).filter(Boolean);
  const toggleAllergenId = (id) => {
    const set = new Set(selectedAllergenIds);
    if (set.has(id)) set.delete(id); else set.add(id);
    setEditingKnowledgeEntry(s => ({ ...s, allergen_ids: [...set].join(", ") }));
  };

  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <form onSubmit={e => { e.preventDefault(); loadKnowledgeEntries(); }} style={{ display: "flex", gap: 8, flex: 1 }}>
          <input className="admin-search" placeholder="Søg titel, slug eller resumé…"
            value={knowledgeSearch} onChange={e => setKnowledgeSearch(e.target.value)} style={{ flex: 1 }} />
          <button type="submit" className="admin-btn admin-btn-ghost admin-btn-sm">Søg</button>
        </form>
        <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={openNewKnowledgeEntry}>Ny entry</button>
      </div>

      <div className="admin-tabs">
        {["all", ...CATEGORIES].map(c => (
          <button key={c} className={`admin-tab-btn${knowledgeCategoryFilter === c ? " active" : ""}`}
            onClick={() => { setKnowledgeCategoryFilter(c); loadKnowledgeEntries(undefined, c); }}>
            {c === "all" ? "Alle" : CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      <div className="admin-table-wrap">
        {knowledgeLoading ? (
          <div className="admin-loading-row"><div className="admin-spinner" /> Henter leksikon-entries…</div>
        ) : knowledgeEntries.length === 0 ? (
          <div className="admin-table-empty">Ingen entries matcher</div>
        ) : (
          <table className="admin-table">
            <thead><tr><th></th><th>Titel</th><th>Kategori</th><th>Slug</th><th>Risiko</th><th>Opdateret</th><th></th></tr></thead>
            <tbody>
              {knowledgeEntries.map(k => (
                <tr key={k.id} style={{ cursor: "pointer" }} onClick={() => openKnowledgeEntryForEdit(k)}>
                  <td style={{ fontSize: 16 }}>{k.emoji || ""}</td>
                  <td>{k.title}</td>
                  <td><span className="admin-pill admin-pill-neutral">{CATEGORY_LABELS[k.category] || k.category}</span></td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{k.slug}</td>
                  <td>{k.risk_level ? <span className={`admin-pill ${k.risk_level === "high" ? "admin-pill-red" : k.risk_level === "medium" ? "admin-pill-amber" : "admin-pill-neutral"}`}>{RISK_LABELS[k.risk_level]}</span> : <span style={{ color: "var(--muted)" }}>–</span>}</td>
                  <td>{k.updated_at ? new Date(k.updated_at).toLocaleDateString("da-DK") : "–"}</td>
                  <td><button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={e => { e.stopPropagation(); openKnowledgeEntryForEdit(k); }}>Redigér</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {openKnowledgeEntry && !editingKnowledgeEntry && (
        <div className="admin-modal-overlay" onClick={close}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-loading-row"><div className="admin-spinner" /> Henter entry…</div>
          </div>
        </div>
      )}

      {openKnowledgeEntry && editingKnowledgeEntry && (
        <div className="admin-modal-overlay" onClick={close}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ fontSize: 16, fontWeight: 800 }}>{openKnowledgeEntry.isNew ? "Ny leksikon-entry" : "Redigér leksikon-entry"}</div>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={close}>Luk</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 14 }}>
              <div className="admin-field" style={{ marginBottom: 0 }}>
                <label className="admin-label">Titel</label>
                <input value={editingKnowledgeEntry.title}
                  onChange={e => {
                    const title = e.target.value;
                    setEditingKnowledgeEntry(s => ({ ...s, title, slug: s.slug && !openKnowledgeEntry.isNew ? s.slug : slugify(title) }));
                  }} />
              </div>
              <div className="admin-field" style={{ marginBottom: 0 }}>
                <label className="admin-label">Emoji</label>
                <input value={editingKnowledgeEntry.emoji} onChange={e => setEditingKnowledgeEntry(s => ({ ...s, emoji: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div className="admin-field" style={{ marginBottom: 0 }}>
                <label className="admin-label">Slug</label>
                <input value={editingKnowledgeEntry.slug} onChange={e => setEditingKnowledgeEntry(s => ({ ...s, slug: slugify(e.target.value) }))} />
              </div>
              <div className="admin-field" style={{ marginBottom: 0 }}>
                <label className="admin-label">Kategori</label>
                <select value={editingKnowledgeEntry.category} onChange={e => setEditingKnowledgeEntry(s => ({ ...s, category: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border2)", fontFamily: "var(--f)", fontSize: 13 }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">Resumé</label>
              <input value={editingKnowledgeEntry.summary} onChange={e => setEditingKnowledgeEntry(s => ({ ...s, summary: e.target.value }))} placeholder="Kort én-linje-opsummering…" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Beskrivelse</label>
              <textarea className="admin-textarea" rows={4} value={editingKnowledgeEntry.description}
                onChange={e => setEditingKnowledgeEntry(s => ({ ...s, description: e.target.value }))} placeholder="Fuld forklaring…" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Sundhedsnoter</label>
              <textarea className="admin-textarea" rows={2} value={editingKnowledgeEntry.health_notes}
                onChange={e => setEditingKnowledgeEntry(s => ({ ...s, health_notes: e.target.value }))} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div className="admin-field" style={{ marginBottom: 0 }}>
                <label className="admin-label">Risikoniveau</label>
                <select value={editingKnowledgeEntry.risk_level} onChange={e => setEditingKnowledgeEntry(s => ({ ...s, risk_level: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border2)", fontFamily: "var(--f)", fontSize: 13 }}>
                  {RISK_LEVELS.map(r => <option key={r} value={r}>{RISK_LABELS[r]}</option>)}
                </select>
              </div>
              <div className="admin-field" style={{ marginBottom: 0 }}>
                <label className="admin-label">Sortering</label>
                <input type="number" value={editingKnowledgeEntry.sort_order}
                  onChange={e => setEditingKnowledgeEntry(s => ({ ...s, sort_order: +e.target.value }))} />
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">Tilknyttede allergener</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ALLERGENS.map(a => {
                  const isOn = selectedAllergenIds.includes(a.id);
                  return (
                    <button key={a.id} type="button" onClick={() => toggleAllergenId(a.id)}
                      style={{
                        fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, cursor: "pointer", fontFamily: "var(--f)",
                        background: isOn ? "var(--red-lt)" : "var(--surface3)",
                        color: isOn ? "var(--red)" : "var(--muted2)",
                        border: `1px solid ${isOn ? "var(--red-md)" : "var(--border)"}`,
                      }}>
                      {a.emoji} {a.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <ArrayField label="Findes i" value={editingKnowledgeEntry.found_in} onChange={v => setEditingKnowledgeEntry(s => ({ ...s, found_in: v }))} placeholder="Gelatine, Animalsk løbe…" />
            <ArrayField label="Alternativer" value={editingKnowledgeEntry.alternatives} onChange={v => setEditingKnowledgeEntry(s => ({ ...s, alternatives: v }))} placeholder="Agar-agar, Plantebaseret…" />
            <ArrayField label="Kost-tags" value={editingKnowledgeEntry.diet_tags} onChange={v => setEditingKnowledgeEntry(s => ({ ...s, diet_tags: v }))} placeholder="vegansk, halal…" />
            <ArrayField label="Aliaser" value={editingKnowledgeEntry.aliases} onChange={v => setEditingKnowledgeEntry(s => ({ ...s, aliases: v }))} placeholder="Andre navne/stavemåder…" />
            <ArrayField label="Tags" value={editingKnowledgeEntry.tags} onChange={v => setEditingKnowledgeEntry(s => ({ ...s, tags: v }))} placeholder="søgeord…" />
            <ArrayField label="Kilder" value={editingKnowledgeEntry.sources} onChange={v => setEditingKnowledgeEntry(s => ({ ...s, sources: v }))} placeholder="https://…" />

            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button className="admin-btn admin-btn-primary" disabled={knowledgeActionLoading} onClick={saveKnowledgeEntry}>
                {openKnowledgeEntry.isNew ? "Opret entry" : "Gem ændringer"}
              </button>
              {!openKnowledgeEntry.isNew && (
                <button className="admin-btn admin-btn-danger" disabled={knowledgeActionLoading} onClick={handleDelete} style={{ marginLeft: "auto" }}>Slet entry</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
