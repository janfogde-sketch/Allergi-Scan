// @ts-nocheck
import React from "react";
import { Loader, Icon } from "./SharedComponents.jsx";
import { UI } from "./styleUtils.js";

export default function AdminUsersSection({
  userId, adminUsers, adminUsersLoading, userSearch, setUserSearch, userSearchParam, setUserSearchParam,
  setOpenAdminUser,
}) {
  const filteredAdminUsers = adminUsers.filter(u => {
    if (userSearchParam === "admin") return u.role === "admin";
    if (userSearchParam === "incomplete") return u.onboarding_completed === false;
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    if (userSearchParam === "name") return (u.name||"").toLowerCase().includes(q);
    if (userSearchParam === "email") return (u.email||"").toLowerCase().includes(q);
    if (userSearchParam === "role") return (u.role||"").toLowerCase().includes(q);
    if (userSearchParam === "onboarding") return String(u.onboarding_completed).includes(q);
    return (u.name||"").toLowerCase().includes(q) || (u.email||"").toLowerCase().includes(q);
  });

  return (
    <div className="fade-in">

      {/* Søgebar */}
      <div style={{ display:"flex", gap:6, marginBottom:8 }}>
        <input
          value={userSearch}
          onChange={e => setUserSearch(e.target.value)}
          placeholder="Søg bruger…"
          style={{ flex:1, padding:"10px 14px", border:"1px solid var(--border2)", borderRadius:10, fontFamily:"var(--f)", fontSize:14, background:"var(--surface)", outline:"none", color:"var(--ink)" }}
        />
        {userSearch && (
          <button onClick={() => setUserSearch("")} aria-label="Ryd søgning"
            style={{ padding:"0 12px", border:"1px solid var(--border)", borderRadius:10, background:"var(--surface2)", fontFamily:"var(--f)", fontSize:12, color:"var(--muted)", cursor:"pointer" }}>
            ×
          </button>
        )}
      </div>

      {/* Søge-parameter — dropdown */}
      <div style={UI.mb12}>
        <select value={userSearchParam} onChange={e => setUserSearchParam(e.target.value)}
          style={{ width:"100%", padding:"10px 14px", border:"1px solid var(--border2)", borderRadius:10, fontFamily:"var(--f)", fontSize:14, background:"var(--surface)", color:"var(--ink)", outline:"none", cursor:"pointer" }}>
          <option value="all">🔍 Alle felter</option>
          <option value="name">👤 Søg på navn</option>
          <option value="email">📧 Søg på email</option>
          <option value="role">🛡️ Søg på rolle</option>
          <option value="admin">🛡️ Kun admins</option>
          <option value="incomplete">⏳ Ufærdig onboarding</option>
        </select>
      </div>

      {/* Tæller */}
      <div style={UI.sectionLbl8}>
        {filteredAdminUsers.length} af {adminUsers.length} brugere
      </div>
      {adminUsersLoading && <Loader text="Indlæser…" />}
      <div style={UI.udflex_fdcolumn_g6}>
        {filteredAdminUsers.map(u => (
          <div key={u.id} onClick={() => setOpenAdminUser(u)} className="admin-list-row"
            style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", boxShadow:"var(--sh)" }}>
            <div style={UI.udflex_aicenter_g10}>
              <div style={{ width:38, height:38, borderRadius:"50%", background: u.role==="admin" ? "var(--surface2)" : "var(--green)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"var(--ink)", flexShrink:0 }}>
                {(u.name||u.email||"?").charAt(0).toUpperCase()}
              </div>
              <div style={UI.flexMin}>
                <div style={UI.ufs13_fw700_cink_ovhidden_toellipsis_wsnowrap}>{u.name || "Ingen navn"}</div>
                <div style={{ fontSize:11, color:"var(--muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
                <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:100, background: u.role==="admin" ? "rgba(74,222,128,.2)" : "var(--surface2)", color: u.role==="admin" ? "var(--green)" : "var(--muted)", border: `1px solid ${u.role==="admin" ? "var(--green-mid)" : "var(--border)"}` }}>
                  {u.role==="admin" ? "Admin" : "Bruger"}
                </span>
                {u.onboarding_completed === false && <span style={{ fontSize:9, color:"var(--amber)", fontWeight:700 }}>Onboarding ufærdig</span>}
                {u.id === userId && <span style={{ fontSize:9, color:"var(--green)", fontWeight:700 }}>← Dig</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
