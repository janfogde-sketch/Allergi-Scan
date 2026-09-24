// @ts-nocheck
import React from "react";
import { Icon } from "../SharedComponents.jsx";
import FeedbackButton from "./FeedbackButton.jsx";

const NAV_ITEMS = [
  { id: "dashboard",   icon: "chart",    label: "Dashboard" },
  { id: "users",       icon: "family",   label: "Brugere" },
  { id: "products",    icon: "tag",      label: "Produkter" },
  { id: "submissions", icon: "package",  label: "Indsendelser", badgeKey: "pendingSubmissions" },
  { id: "tickets",     icon: "bug",      label: "Tickets", badgeKey: "openTickets" },
  { id: "missing",     icon: "info",     label: "Manglende EAN'er" },
  { id: "import",      icon: "download", label: "Import" },
  { id: "recipes",     icon: "book",     label: "Opskrifter" },
];

export default function AdminLayout({ section, setSection, userEmail, userId, accessToken, logout, pendingSubmissions, openTickets, children }) {
  const badges = { pendingSubmissions, openTickets };
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">Eat<span>Safe</span> Admin</div>
        <nav className="admin-nav">
          {NAV_ITEMS.map(item => {
            const badgeVal = item.badgeKey ? badges[item.badgeKey] : null;
            return (
              <button key={item.id} className={`admin-nav-item${section === item.id ? " active" : ""}`}
                onClick={() => setSection(item.id)}>
                <Icon name={item.icon} size={16} color={section === item.id ? "var(--green)" : "var(--ink2)"} />
                {item.label}
                {!!badgeVal && <span className="badge">{badgeVal}</span>}
              </button>
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
        <div className="admin-topbar">
          <h1>{NAV_ITEMS.find(i => i.id === section)?.label || "Admin"}</h1>
        </div>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
