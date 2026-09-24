// @ts-nocheck
import React from "react";
import { ALLERGENS } from "../../constants.jsx";

const FILTERS = [["pending", "Afventer"], ["approved", "Godkendte"], ["rejected", "Afviste"]];
const CATEGORIES = ["aftensmad", "morgenmad", "frokost", "dessert", "tilbehør", "snack"];

function parseFlags(v) {
  try { return typeof v === "string" ? JSON.parse(v) : (v || {}); } catch { return {}; }
}

export default function RecipesSection({
  adminRecipes, adminRecipesLoading, adminRecipeFilter, setAdminRecipeFilter, loadAdminRecipes,
  editingRecipe, setEditingRecipe, recipeActionLoading, saveRecipeEdit, updateRecipeStatus,
}) {
  const close = () => setEditingRecipe(null);

  return (
    <>
      <div className="admin-tabs">
        {FILTERS.map(([val, label]) => (
          <button key={val} className={`admin-tab-btn${adminRecipeFilter === val ? " active" : ""}`}
            onClick={() => { setAdminRecipeFilter(val); loadAdminRecipes(val); }}>{label}</button>
        ))}
      </div>

      <div className="admin-table-wrap">
        {adminRecipesLoading ? (
          <div className="admin-loading-row"><div className="admin-spinner" /> Henter opskrifter…</div>
        ) : adminRecipes.length === 0 ? (
          <div className="admin-table-empty">Ingen opskrifter her</div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Titel</th><th>Kategori</th><th>Portioner</th><th>Allergener</th><th>Oprettet</th><th></th></tr></thead>
            <tbody>
              {adminRecipes.map(r => {
                const flags = parseFlags(r.allergen_flags);
                const flagged = ALLERGENS.filter(a => flags[a.id] === true || flags[a.id] === "yes");
                return (
                  <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => setEditingRecipe(r)}>
                    <td>{r.title}</td>
                    <td>{r.category}</td>
                    <td>{r.servings || "?"}</td>
                    <td>{flagged.length === 0 ? <span style={{ color: "var(--muted)" }}>Ingen</span> : flagged.map(a => a.label).join(", ")}</td>
                    <td>{new Date(r.created_at).toLocaleDateString("da-DK")}</td>
                    <td><button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={(e) => { e.stopPropagation(); setEditingRecipe(r); }}>Redigér</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editingRecipe && (
        <div className="admin-modal-overlay" onClick={close}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ fontSize: 16, fontWeight: 800 }}>Redigér opskrift</div>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={close}>Luk</button>
            </div>

            <div className="admin-field">
              <label className="admin-label">Titel</label>
              <input value={editingRecipe.title || ""} onChange={e => setEditingRecipe(r => ({ ...r, title: e.target.value }))} />
            </div>
            <div className="admin-field">
              <label className="admin-label">Beskrivelse</label>
              <textarea className="admin-textarea" value={editingRecipe.description || ""} onChange={e => setEditingRecipe(r => ({ ...r, description: e.target.value }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div>
                <label className="admin-label">Kategori</label>
                <select value={editingRecipe.category || "aftensmad"} onChange={e => setEditingRecipe(r => ({ ...r, category: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border2)", fontFamily: "var(--f)", fontSize: 13 }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="admin-label">Portioner</label>
                <input type="number" value={editingRecipe.servings || 4} onChange={e => setEditingRecipe(r => ({ ...r, servings: +e.target.value }))} />
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">Allergener</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ALLERGENS.map(a => {
                  const flags = parseFlags(editingRecipe.allergen_flags);
                  const isOn = flags[a.id] === true || flags[a.id] === "yes";
                  return (
                    <button key={a.id} className="admin-pill" style={{ cursor: "pointer", border: `1px solid ${isOn ? "var(--red-md)" : "var(--border)"}`, background: isOn ? "var(--red-lt)" : "var(--surface3)", color: isOn ? "var(--red)" : "var(--muted2)" }}
                      onClick={() => {
                        const f = parseFlags(editingRecipe.allergen_flags);
                        setEditingRecipe(r => ({ ...r, allergen_flags: JSON.stringify({ ...f, [a.id]: !isOn }) }));
                      }}>
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button className="admin-btn admin-btn-ghost" disabled={recipeActionLoading} onClick={saveRecipeEdit}>Gem ændringer</button>
              <button className="admin-btn admin-btn-primary" disabled={recipeActionLoading} onClick={() => updateRecipeStatus(editingRecipe.id, "approved")}>Godkend &amp; publicér</button>
              <button className="admin-btn admin-btn-danger" disabled={recipeActionLoading} onClick={() => updateRecipeStatus(editingRecipe.id, "rejected")}>Afvis</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
