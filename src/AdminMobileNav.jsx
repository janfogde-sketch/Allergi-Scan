// @ts-nocheck
import React from "react";
import { Icon } from "./SharedComponents.jsx";

// Mobil-adminens navigation: fire grupper øverst, og under dem den valgte grupes sider.
export const ADMIN_NAV_GROUPS = [
  { id: "overview", label: "Overblik", items: [
    { id: "dashboard",   icon: "chart",    label: "Dashboard" },
    { id: "users",       icon: "family",   label: "Brugere" },
  ] },
  { id: "review", label: "Behandling", items: [
    { id: "submissions", icon: "package",  label: "Indsendelser", badgeKey: "pending_submissions" },
    { id: "tickets",     icon: "bug",      label: "Tickets", badgeKey: "open_tickets" },
  ] },
  { id: "content", label: "Indhold", items: [
    { id: "missing",     icon: "info",     label: "Manglende EAN'er" },
    { id: "import",      icon: "download", label: "Import" },
    { id: "recipes",     icon: "book",     label: "Opskrifter" },
  ] },
  { id: "system", label: "Drift", items: [
    { id: "debug",       icon: "search",   label: "Debug" },
  ] },
];

export default function AdminMobileNav({ adminSection, adminStats, onSelect }) {
  const activeGroup = ADMIN_NAV_GROUPS.find(g => g.items.some(i => i.id === adminSection)) || ADMIN_NAV_GROUPS[0];
  const badgeFor = (item) => (item.badgeKey && Number(adminStats?.[item.badgeKey])) || 0;
  const groupBadge = (g) => g.items.reduce((sum, i) => sum + badgeFor(i), 0);
  const badge = (n) => (
    <span style={{ background:"var(--red)", color:"#fff", fontSize:10, fontWeight:800, borderRadius:10, padding:"1px 6px", minWidth:16, textAlign:"center" }}>{n}</span>
  );
  return (
    <div style={{ marginBottom:16 }}>
      <div role="tablist" style={{ display:"grid", gridTemplateColumns:`repeat(${ADMIN_NAV_GROUPS.length}, 1fr)`, gap:4, padding:4,
        background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:14, marginBottom:10 }}>
        {ADMIN_NAV_GROUPS.map(g => {
          const active = g.id === activeGroup.id;
          const n = groupBadge(g);
          return (
            <button key={g.id} role="tab" aria-selected={active} className="admin-tab"
              onClick={() => { if (!active) onSelect(g.items[0].id); }}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"9px 4px",
                background: active ? "var(--surface)" : "transparent", border:"none", borderRadius:10,
                boxShadow: active ? "var(--sh)" : "none", fontFamily:"var(--f)", fontSize:12.5, fontWeight:800,
                color: active ? "var(--green)" : "var(--ink2)", cursor:"pointer" }}>
              {g.label}
              {!active && !!n && badge(n)}
            </button>
          );
        })}
      </div>
      {activeGroup.items.length > 1 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {activeGroup.items.map(item => {
            const active = item.id === adminSection;
            const n = badgeFor(item);
            return (
              <button key={item.id} className="admin-tab" onClick={() => onSelect(item.id)}
                style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 14px",
                  background: active ? "var(--green-lt)" : "var(--surface)",
                  border:`1px solid ${active ? "var(--green)" : "var(--border)"}`, borderRadius:12, boxShadow:"var(--sh)",
                  fontFamily:"var(--f)", fontSize:13, fontWeight:800, color: active ? "var(--green)" : "var(--ink)", cursor:"pointer" }}>
                <Icon name={item.icon} size={16} color={active ? "var(--green)" : "var(--ink2)"} />
                {item.label}
                {!!n && badge(n)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
