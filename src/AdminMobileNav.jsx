// @ts-nocheck
import React from "react";
import { Icon } from "./SharedComponents.jsx";

// Mobil-adminens navigation: fire hovedfaner, og under dem den valgte gruppes sider som en let sekundær fane-række.
// "Oversigt" under Indhold og Drift er en samlet side med gruppens værktøjer og korte beskrivelser.
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
    { id: "content",     icon: "list",     label: "Oversigt" },
    { id: "missing",     icon: "info",     label: "Manglende EAN'er" },
    { id: "import",      icon: "download", label: "Import" },
    { id: "recipes",     icon: "book",     label: "Opskrifter" },
  ] },
  { id: "system", label: "Drift", items: [
    { id: "system",      icon: "settings", label: "Oversigt" },
    { id: "debug",       icon: "search",   label: "Debug" },
  ] },
];

export default function AdminMobileNav({ adminSection, adminStats, onSelect }) {
  const activeGroup = ADMIN_NAV_GROUPS.find(g => g.items.some(i => i.id === adminSection)) || ADMIN_NAV_GROUPS[0];
  const badgeFor = (item) => (item.badgeKey && Number(adminStats?.[item.badgeKey])) || 0;
  const groupBadge = (g) => g.items.reduce((sum, i) => sum + badgeFor(i), 0);
  // Diskret badge: lille og gul (afventer), dominerer ikke fanen.
  const badge = (n) => (
    <span style={{ background:"var(--amber-lt)", color:"var(--amber)", fontSize:10, fontWeight:800, borderRadius:8, padding:"1px 5px", minWidth:14, textAlign:"center", lineHeight:1.3 }}>{n}</span>
  );
  return (
    <div style={{ marginBottom:14 }}>
      <div role="tablist" aria-label="Admin" style={{ display:"grid", gridTemplateColumns:`repeat(${ADMIN_NAV_GROUPS.length}, 1fr)`, gap:2, padding:3,
        background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, marginBottom:8 }}>
        {ADMIN_NAV_GROUPS.map(g => {
          const active = g.id === activeGroup.id;
          const n = groupBadge(g);
          return (
            <button key={g.id} role="tab" aria-selected={active} className="admin-tab"
              onClick={() => { if (!active) onSelect(g.items[0].id); }}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:4, minHeight:36, padding:"0 2px",
                background: active ? "var(--surface)" : "transparent", border:"none", borderRadius:8,
                boxShadow: active ? "var(--sh2)" : "none", fontFamily:"var(--f)", fontSize:12.5, fontWeight:700,
                color: active ? "var(--green)" : "var(--ink2)", cursor:"pointer" }}>
              {g.label}
              {!active && !!n && badge(n)}
            </button>
          );
        })}
      </div>
      {activeGroup.items.length > 1 && (
        <div role="tablist" aria-label={activeGroup.label} style={{ display:"flex", gap:12, overflowX:"auto", borderBottom:"1px solid var(--border)" }}>
          {activeGroup.items.map(item => {
            const active = item.id === adminSection;
            const n = badgeFor(item);
            return (
              <button key={item.id} role="tab" aria-selected={active} className="admin-tab" onClick={() => onSelect(item.id)}
                style={{ display:"flex", alignItems:"center", gap:5, minHeight:40, padding:"0 2px", flexShrink:0,
                  background:"none", border:"none", borderBottom:`2px solid ${active ? "var(--green)" : "transparent"}`, marginBottom:-1,
                  fontFamily:"var(--f)", fontSize:12, fontWeight: active ? 800 : 600, color: active ? "var(--green)" : "var(--ink2)", cursor:"pointer", whiteSpace:"nowrap" }}>
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
