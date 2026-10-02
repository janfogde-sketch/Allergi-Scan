// @ts-nocheck
import React, { useState } from "react";
import { Loader } from "./SharedComponents.jsx";
import { Chevron, StatusChip, AdminEmpty, ROW, LABEL } from "./adminUi.jsx";

const FIELD = { padding:"0 10px", minHeight:40, border:"1px solid var(--border2)", borderRadius:10, fontFamily:"var(--f)", fontSize:13, background:"var(--surface)", color:"var(--ink)", outline:"none" };

export default function AdminUsersSection({
  userId, adminUsers, adminUsersLoading, userSearch, setUserSearch,
  setOpenAdminUser,
}) {
  // Filtre og sortering sker i frontend på de brugere, der allerede er hentet.
  const [roleFilter, setRoleFilter] = useState("all");             // all | admin | user
  const [onboardingFilter, setOnboardingFilter] = useState("all"); // all | incomplete | done
  const [sort, setSort] = useState("newest");                      // newest | name

  const q = userSearch.trim().toLowerCase();
  const filtered = adminUsers
    .filter(u => roleFilter === "all" || (roleFilter === "admin" ? u.role === "admin" : u.role !== "admin"))
    .filter(u => onboardingFilter === "all" || (onboardingFilter === "incomplete" ? u.onboarding_completed === false : u.onboarding_completed !== false))
    .filter(u => !q || (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q))
    .sort((a, b) => sort === "name"
      ? (a.name || a.email || "").localeCompare(b.name || b.email || "", "da")
      : String(b.created_at || "").localeCompare(String(a.created_at || "")));

  return (
    <div className="fade-in">
      <div style={{ display:"flex", gap:6, marginBottom:8 }}>
        <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Søg på navn eller e-mail…" aria-label="Søg bruger"
          style={{ ...FIELD, flex:1, minWidth:0 }} />
        {userSearch && (
          <button onClick={() => setUserSearch("")} aria-label="Ryd søgning"
            style={{ ...FIELD, width:40, padding:0, background:"var(--surface2)", color:"var(--muted)", cursor:"pointer" }}>×</button>
        )}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:10 }}>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} aria-label="Filtrér på rolle" style={{ ...FIELD, width:"100%", minWidth:0 }}>
          <option value="all">Alle roller</option><option value="admin">Admins</option><option value="user">Brugere</option>
        </select>
        <select value={onboardingFilter} onChange={e => setOnboardingFilter(e.target.value)} aria-label="Filtrér på onboarding" style={{ ...FIELD, width:"100%", minWidth:0 }}>
          <option value="all">Al onboarding</option><option value="incomplete">Ufærdig</option><option value="done">Færdig</option>
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sortér" style={{ ...FIELD, width:"100%", minWidth:0 }}>
          <option value="newest">Nyeste først</option><option value="name">Navn A-Å</option>
        </select>
      </div>

      <div style={LABEL}>{filtered.length} af {adminUsers.length} brugere</div>
      {adminUsersLoading && <Loader text="Indlæser…" />}
      {!adminUsersLoading && filtered.length === 0 && (
        <AdminEmpty icon="family" title="Ingen brugere matcher" text="Prøv at ændre søgning eller filtre." />
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {filtered.map(u => (
          <div key={u.id} onClick={() => setOpenAdminUser(u)} className="admin-list-row" role="button" style={{ ...ROW, display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background: u.role==="admin" ? "var(--surface2)" : "var(--green)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color: u.role==="admin" ? "var(--ink2)" : "var(--on-green)", flexShrink:0 }}>
              {(u.name||u.email||"?").charAt(0).toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {u.name || "Intet navn"}{u.id === userId && <span style={{ fontSize:11, fontWeight:500, color:"var(--muted)" }}> · Dig</span>}
              </div>
              <div style={{ fontSize:11, color:"var(--muted2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:5 }}>
                <StatusChip tone={u.role === "admin" ? "green" : "neutral"}>{u.role === "admin" ? "Admin" : "Bruger"}</StatusChip>
                {u.onboarding_completed === false && <StatusChip tone="amber" icon="clock">Onboarding ufærdig</StatusChip>}
              </div>
            </div>
            <Chevron />
          </div>
        ))}
      </div>
    </div>
  );
}
