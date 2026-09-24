// @ts-nocheck
import React, { useState } from "react";
import { DIETS, ALLERGENS } from "../../constants.jsx";

export default function UsersSection({
  adminUsers, adminUsersLoading, userSearch, setUserSearch, currentUserId, updateUserRole, deleteUser,
  openAdminUser, setOpenAdminUser, editingAdminUser, setEditingAdminUser, adminUserActionLoading,
  openAdminUserForEdit, saveAdminUserEdit,
}) {
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = adminUsers.filter(u => {
    if (roleFilter === "admin" && u.role !== "admin") return false;
    if (roleFilter === "incomplete" && u.onboarding_completed !== false) return false;
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
  });

  const handleDelete = (u) => {
    if (!window.confirm(`Slet ${u.name || u.email} permanent? Dette kan ikke fortrydes.`)) return;
    deleteUser(u.id);
  };

  const close = () => { setOpenAdminUser(null); setEditingAdminUser(null); };
  const toggleDiet = (id) => setEditingAdminUser(s => ({
    ...s, diets: s.diets.includes(id) ? s.diets.filter(x => x !== id) : [...s.diets, id],
  }));
  const toggleAllergen = (id) => setEditingAdminUser(s => ({
    ...s, allergen_ids: s.allergen_ids.includes(id) ? s.allergen_ids.filter(x => x !== id) : [...s.allergen_ids, id],
  }));

  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <input className="admin-search" placeholder="Søg navn eller email…" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
        <div className="admin-tabs" style={{ marginBottom: 0, border: "none" }}>
          {[["all", "Alle"], ["admin", "Admins"], ["incomplete", "Ufærdig onboarding"]].map(([id, label]) => (
            <button key={id} className={`admin-tab-btn${roleFilter === id ? " active" : ""}`} onClick={() => setRoleFilter(id)}>{label}</button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>{filtered.length} af {adminUsers.length}</div>
      </div>

      <div className="admin-table-wrap">
        {adminUsersLoading ? (
          <div className="admin-loading-row"><div className="admin-spinner" /> Henter brugere…</div>
        ) : filtered.length === 0 ? (
          <div className="admin-table-empty">Ingen brugere matcher</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Navn</th><th>Email</th><th>Rolle</th><th>Oprettet</th><th>Onboarding</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ cursor: "pointer" }} onClick={() => openAdminUserForEdit(u)}>
                  <td>{u.name || <span style={{ color: "var(--muted)" }}>Ingen navn</span>}{u.id === currentUserId && <span className="admin-pill admin-pill-green" style={{ marginLeft: 6 }}>Dig</span>}</td>
                  <td>{u.email}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <select value={u.role || "user"} onChange={e => updateUserRole(u.id, e.target.value)}
                      style={{ fontFamily: "var(--f)", fontSize: 12, padding: "3px 6px", borderRadius: 6, border: "1px solid var(--border2)" }}>
                      <option value="user">Bruger</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>{u.created_at ? new Date(u.created_at).toLocaleDateString("da-DK") : "–"}</td>
                  <td>{u.onboarding_completed === false ? <span className="admin-pill admin-pill-amber">Ufærdig</span> : <span className="admin-pill admin-pill-neutral">Færdig</span>}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => openAdminUserForEdit(u)} style={{ marginRight: 6 }}>Redigér</button>
                    <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(u)} disabled={u.id === currentUserId}>Slet</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {openAdminUser && !editingAdminUser && (
        <div className="admin-modal-overlay" onClick={close}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-loading-row"><div className="admin-spinner" /> Henter bruger…</div>
          </div>
        </div>
      )}

      {openAdminUser && editingAdminUser && (
        <div className="admin-modal-overlay" onClick={close}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>Redigér bruger</div>
                <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)" }}>ID: {openAdminUser.id}</div>
              </div>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={close}>Luk</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div className="admin-field" style={{ marginBottom: 0 }}>
                <label className="admin-label">Navn</label>
                <input value={editingAdminUser.name} onChange={e => setEditingAdminUser(s => ({ ...s, name: e.target.value }))} />
              </div>
              <div className="admin-field" style={{ marginBottom: 0 }}>
                <label className="admin-label">Telefon</label>
                <input value={editingAdminUser.phone} onChange={e => setEditingAdminUser(s => ({ ...s, phone: e.target.value }))} />
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">Email</label>
              <input value={editingAdminUser.email} onChange={e => setEditingAdminUser(s => ({ ...s, email: e.target.value }))} />
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                Ændrer kun profil-emailen i databasen — ændrer IKKE login-emailen i Supabase Auth. Brug Supabase Dashboard for at ændre login.
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div className="admin-field" style={{ marginBottom: 0 }}>
                <label className="admin-label">Fødselsår</label>
                <input type="number" value={editingAdminUser.birth_year} onChange={e => setEditingAdminUser(s => ({ ...s, birth_year: e.target.value }))} />
              </div>
              <div className="admin-field" style={{ marginBottom: 0 }}>
                <label className="admin-label">Køn</label>
                <select value={editingAdminUser.gender} onChange={e => setEditingAdminUser(s => ({ ...s, gender: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border2)", fontFamily: "var(--f)", fontSize: 13 }}>
                  <option value="">–</option>
                  <option value="Mand">Mand</option>
                  <option value="Kvinde">Kvinde</option>
                  <option value="Andet">Andet</option>
                </select>
              </div>
              <div className="admin-field" style={{ marginBottom: 0 }}>
                <label className="admin-label">Rolle</label>
                <select value={editingAdminUser.role} onChange={e => setEditingAdminUser(s => ({ ...s, role: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border2)", fontFamily: "var(--f)", fontSize: 13 }}
                  disabled={openAdminUser.id === currentUserId}>
                  <option value="user">Bruger</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">Diæter</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {DIETS.map(d => {
                  const isOn = editingAdminUser.diets.includes(d.id);
                  return (
                    <button key={d.id} type="button" onClick={() => toggleDiet(d.id)}
                      style={{
                        fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 20, cursor: "pointer", fontFamily: "var(--f)",
                        background: isOn ? "var(--green-lt)" : "var(--surface3)",
                        color: isOn ? "var(--green)" : "var(--muted2)",
                        border: `1px solid ${isOn ? "var(--green-mid)" : "var(--border)"}`,
                      }}>
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">Allergener</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ALLERGENS.map(a => {
                  const isOn = editingAdminUser.allergen_ids.includes(a.id);
                  return (
                    <button key={a.id} type="button" onClick={() => toggleAllergen(a.id)}
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

            <div className="admin-field">
              <label className="admin-label">Egne tilføjede allergier <span style={{ fontWeight: 400, color: "var(--muted)" }}>(kommasepareret)</span></label>
              <input value={editingAdminUser.custom_allergens} onChange={e => setEditingAdminUser(s => ({ ...s, custom_allergens: e.target.value }))} placeholder="Fructose, kanel…" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Overvågede E-numre <span style={{ fontWeight: 400, color: "var(--muted)" }}>(kommasepareret)</span></label>
              <input value={editingAdminUser.e_numbers} onChange={e => setEditingAdminUser(s => ({ ...s, e_numbers: e.target.value }))} placeholder="E220, E250…" />
            </div>

            <div className="admin-field">
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--ink2)" }}>
                <input type="checkbox" checked={editingAdminUser.onboarding_completed}
                  onChange={e => setEditingAdminUser(s => ({ ...s, onboarding_completed: e.target.checked }))} />
                Onboarding færdiggjort
              </label>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="admin-btn admin-btn-primary" disabled={adminUserActionLoading} onClick={saveAdminUserEdit}>Gem ændringer</button>
              <button className="admin-btn admin-btn-danger" disabled={adminUserActionLoading || openAdminUser.id === currentUserId}
                onClick={() => { if (window.confirm(`Slet ${editingAdminUser.name || editingAdminUser.email} permanent? Dette kan ikke fortrydes.`)) { deleteUser(openAdminUser.id); close(); } }}
                style={{ marginLeft: "auto" }}>
                Slet bruger
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
