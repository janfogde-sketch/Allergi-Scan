// @ts-nocheck
import React, { useState } from "react";
import { Icon, EatSafeLogo } from "../SharedComponents.jsx";
import FeedbackButton from "./FeedbackButton.jsx";

const NAV_GROUPS = [
  { id: "overview", label: "Overblik", items: [
    { id: "dashboard",   icon: "chart",    label: "Dashboard" },
    { id: "todo",        icon: "check",    label: "To do", badgeKey: "todoAttention" },
  ] },
  { id: "review", label: "Til behandling", items: [
    { id: "submissions", icon: "package",  label: "Indsendelser", badgeKey: "pendingSubmissions" },
    { id: "recalls",     icon: "shield",   label: "Tilbagekald", badgeKey: "pendingRecalls" },
    { id: "tickets",     icon: "bug",      label: "Tickets", badgeKey: "openTickets" },
  ] },
  { id: "content", label: "Indhold & data", items: [
    { id: "products",    icon: "tag",      label: "Produkter" },
    { id: "knowledge",   icon: "file",     label: "Leksikon" },
    { id: "recipes",     icon: "book",     label: "Opskrifter" },
    { id: "missing",     icon: "info",     label: "Manglende EAN'er" },
    { id: "import",      icon: "download", label: "Import" },
    { id: "history",     icon: "clock",    label: "Historik" },
  ] },
  { id: "people", label: "Brugere & kommunikation", items: [
    { id: "users",         icon: "family", label: "Brugere" },
    { id: "family",        icon: "heart",  label: "Familie" },
    { id: "notifications", icon: "bell",   label: "Notifikationer" },
  ] },
  { id: "system", label: "Drift", items: [
    { id: "errors",      icon: "warning",  label: "Fejl" },
    { id: "ai-usage",    icon: "chart",    label: "AI-forbrug" },
  ] },
];
const NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items);
const COLLAPSE_KEY = "admin_nav_collapsed";

function loadCollapsed() {
  try { return JSON.parse(localStorage.getItem(COLLAPSE_KEY)) || {}; } catch { return {}; }
}

export default function AdminLayout({ section, setSection, userEmail, userId, accessToken, logout, pendingSubmissions, openTickets, todoAttention, pendingRecalls, topbarExtra, children }) {
  const badges = { pendingSubmissions, openTickets, todoAttention, pendingRecalls };
  const [collapsed, setCollapsed] = useState(loadCollapsed);
  const toggleGroup = (id) => {
    const next = { ...collapsed, [id]: !collapsed[id] };
    setCollapsed(next);
    try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo"><EatSafeLogo variant="horizontal" size={20} /> Admin</div>
        <nav className="admin-nav">
          {NAV_GROUPS.map(group => {
            const hasActive = group.items.some(i => i.id === section);
            const isCollapsed = !!collapsed[group.id] && !hasActive;
            const groupBadge = group.items.reduce((sum, i) => sum + (Number(i.badgeKey ? badges[i.badgeKey] : 0) || 0), 0);
            return (
              <div key={group.id} className="admin-nav-group">
                <button className="admin-nav-group-head" aria-expanded={!isCollapsed}
                  onClick={() => toggleGroup(group.id)}>
                  <Icon name={isCollapsed ? "chevronRight" : "chevronDown"} size={12} color="var(--muted)" />
                  {group.label}
                  {isCollapsed && !!groupBadge && <span className="badge">{groupBadge}</span>}
                </button>
                {!isCollapsed && group.items.map(item => {
                  const badgeVal = item.badgeKey ? badges[item.badgeKey] : null;
                  return (
                    <button key={item.id} className={`admin-nav-item admin-nav-sub${section === item.id ? " active" : ""}`}
                      onClick={() => setSection(item.id)}>
                      <Icon name={item.icon} size={16} color={section === item.id ? "var(--green)" : "var(--ink2)"} />
                      {item.label}
                      {!!badgeVal && <span className="badge">{badgeVal}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user" title={userEmail}>{userEmail}</div>
          <FeedbackButton accessToken={accessToken} userId={userId} userEmail={userEmail} section={section} />
          <button className="admin-btn admin-btn-ghost admin-btn-full admin-btn-sm" onClick={logout}>Log ud</button>
        </div>
      </aside>
      <div className="admin-main">
        <div className="admin-topbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1>{NAV_ITEMS.find(i => i.id === section)?.label || "Admin"}</h1>
          {topbarExtra}
        </div>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
