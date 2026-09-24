// @ts-nocheck
import React, { useState } from "react";

export default function UsersSection({ adminUsers, adminUsersLoading, userSearch, setUserSearch, currentUserId, updateUserRole, deleteUser }) {
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
                <tr key={u.id}>
                  <td>{u.name || <span style={{ color: "var(--muted)" }}>Ingen navn</span>}{u.id === currentUserId && <span className="admin-pill admin-pill-green" style={{ marginLeft: 6 }}>Dig</span>}</td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.role || "user"} onChange={e => updateUserRole(u.id, e.target.value)}
                      style={{ fontFamily: "var(--f)", fontSize: 12, padding: "3px 6px", borderRadius: 6, border: "1px solid var(--border2)" }}>
                      <option value="user">Bruger</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>{u.created_at ? new Date(u.created_at).toLocaleDateString("da-DK") : "–"}</td>
                  <td>{u.onboarding_completed === false ? <span className="admin-pill admin-pill-amber">Ufærdig</span> : <span className="admin-pill admin-pill-neutral">Færdig</span>}</td>
                  <td>
                    <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(u)} disabled={u.id === currentUserId}>Slet</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
