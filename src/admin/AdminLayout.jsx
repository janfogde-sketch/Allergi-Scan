// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useIsMobile } from "./useIsMobile.js";
import { watchTableCells } from "./tableCards.js";
import { Icon, EatSafeLogo } from "../SharedComponents.jsx";
import FeedbackButton from "./FeedbackButton.jsx";
import { NAV_GROUPS, NAV_ITEMS, BADGE_INFO, groupOfSection, formatBadge, worstTone } from "./navLogic.js";

const SWIPE_MIN = 60; // px mod venstre for at lukke menuen på mobil

// Antalsmarkering: samme størrelse og placering overalt. Neutral som standard, gul = bør prioriteres, rød kun ved kritisk (overskredne frister).
function NavBadge({ count, tone }) {
  const text = formatBadge(count);
  if (!text) return null;
  return <span className={`badge ${tone}`} aria-hidden="true">{text}</span>;
}

export default function AdminLayout({ section, setSection, userEmail, userId, accessToken, logout, pendingSubmissions, openTickets, todoAttention, todoOverdue, pendingRecalls, topbarExtra, children }) {
  const counts = { pendingSubmissions, openTickets, todoAttention, pendingRecalls };
  const toneOf = (key) => (key === "todoAttention" && Number(todoOverdue) > 0 ? "crit" : BADGE_INFO[key].tone);
  const [navOpen, setNavOpen] = useState(false);
  // Harmonika: kun én kategori er udfoldet (eller ingen); åbning udfolder den aktive sides kategori.
  const [expanded, setExpanded] = useState(() => groupOfSection(section) || null); // harmonika: højst én kategori ad gangen
  const isMobile = useIsMobile();
  const contentRef = useRef(null);
  const menuBtnRef = useRef(null);
  const closeBtnRef = useRef(null);
  const touchRef = useRef(null);
  const selfBack = useRef(0); // antal popstate-hændelser, vi selv udløser ved at rydde vores historikpost, og som ikke må lukke en ny åbning

  // Ny side: dens kategori udfoldes
  useEffect(() => {
    const g = groupOfSection(section);
    if (g) setExpanded(g);
  }, [section]);

  const closeNav = useCallback(() => setNavOpen(false), []);
  const openNav = () => {
    // Hver åbning starter med kun den aktive gruppe udfoldet
    setExpanded(groupOfSection(section) || null);
    setNavOpen(true);
  };

  // Mobil: tabeller vises som kort, så hver celle skal kende sin kolonneoverskrift (se tableCards.js).
  useEffect(() => {
    if (!isMobile || !contentRef.current) return undefined;
    return watchTableCells(contentRef.current);
  }, [isMobile]);

  const drawerOpen = navOpen && isMobile;
  // Den aktive side scrolles ind i det synlige område, når menuen åbnes eller en kategori foldes ud
  useEffect(() => {
    const el = document.querySelector(".admin-nav [aria-current='page']");
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "nearest" });
  }, [drawerOpen, expanded]);
  // Åben menu på mobil: baggrunden kan ikke scrolles, Escape og Android-tilbage lukker, og fokus flyttes ind i menuen og tilbage ved lukning
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") closeNav(); };
    document.addEventListener("keydown", onKey);
    let pushed = false;
    try { window.history.pushState({ adminNav: true }, ""); pushed = true; } catch { /* ingen historik */ }
    const onPop = () => { if (selfBack.current > 0) { selfBack.current -= 1; return; } closeNav(); };
    window.addEventListener("popstate", onPop);
    closeBtnRef.current?.focus();
    const btn = menuBtnRef.current;
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
      if (pushed) { try { if (window.history.state && window.history.state.adminNav) { selfBack.current += 1; window.history.back(); } } catch { /* ignorer */ } }
      btn?.focus();
    };
  }, [drawerOpen, closeNav]);
  // Desktop: Escape gør ingenting, fordi sidebaren altid er synlig
  useEffect(() => { if (!isMobile) setNavOpen(false); }, [isMobile]);

  const pick = (id) => { setSection(id); setNavOpen(false); };
  const toggleGroup = (id) => setExpanded((prev) => (prev === id ? null : id));

  // Swipe mod venstre lukker (kun et overvejende vandret træk, så lodret rulning i menuen ikke rammes)
  const onTouchStart = (e) => { const t = e.touches[0]; touchRef.current = { x: t.clientX, y: t.clientY }; };
  const onTouchEnd = (e) => {
    const s = touchRef.current; touchRef.current = null;
    if (!s || !drawerOpen) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (dx <= -SWIPE_MIN && Math.abs(dy) < Math.abs(dx) * 0.6) closeNav();
  };

  return (
    <div className="admin-shell">
      {drawerOpen && <div className="admin-nav-backdrop" aria-hidden="true" onClick={closeNav} />}
      <aside id="admin-sidebar" className={`admin-sidebar${navOpen ? " open" : ""}`} aria-label="Adminmenu"
        {...(drawerOpen ? { role: "dialog", "aria-modal": "true" } : {})}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="admin-sidebar-head">
          <div className="admin-sidebar-logo"><EatSafeLogo variant="horizontal" size={20} /> Admin</div>
          <button type="button" ref={closeBtnRef} className="admin-nav-close" aria-label="Luk menu" onClick={closeNav}>
            <Icon name="x" size={18} color="var(--ink2)" />
          </button>
        </div>
        <nav className="admin-nav" aria-label="Administration">
          {NAV_GROUPS.map((group) => {
            const isOpen = expanded === group.id;
            const groupBadges = group.items.filter((i) => i.badgeKey).map((i) => ({ n: Number(counts[i.badgeKey]) || 0, tone: toneOf(i.badgeKey) }));
            const groupTotal = groupBadges.reduce((s, b) => s + b.n, 0);
            return (
              <div key={group.id} className="admin-nav-group">
                <button type="button" className="admin-nav-group-head" aria-expanded={isOpen} aria-controls={`nav-group-${group.id}`}
                  onClick={() => toggleGroup(group.id)}>
                  <span className={`admin-nav-chev${isOpen ? "" : " closed"}`} aria-hidden="true"><Icon name="chevronDown" size={12} color="var(--muted)" /></span>
                  <span className="admin-nav-group-label">{group.label}</span>
                  {!isOpen && <NavBadge count={groupTotal} tone={worstTone(groupBadges.filter((b) => b.n > 0).map((b) => b.tone))} />}
                </button>
                {isOpen && (
                  <div id={`nav-group-${group.id}`} className="admin-nav-items">
                    {group.items.map((item) => {
                      const info = item.badgeKey ? BADGE_INFO[item.badgeKey] : null;
                      const n = item.badgeKey ? counts[item.badgeKey] : null;
                      const text = formatBadge(n);
                      const active = section === item.id;
                      return (
                        <button key={item.id} type="button" className={`admin-nav-item${active ? " active" : ""}`} aria-current={active ? "page" : undefined}
                          aria-label={text && info ? `${item.label}, ${Number(n)} ${info.noun}` : item.label}
                          onClick={() => pick(item.id)}>
                          <Icon name={item.icon} size={16} color={active ? "var(--green)" : "var(--ink2)"} />
                          <span className="admin-nav-label">{item.label}</span>
                          <NavBadge count={n} tone={item.badgeKey ? toneOf(item.badgeKey) : "neutral"} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user" title={userEmail}><Icon name="profile" size={14} color="var(--muted)" /><span>{userEmail}</span></div>
          <FeedbackButton accessToken={accessToken} userId={userId} userEmail={userEmail} section={section} />
          <button className="admin-btn admin-btn-ghost admin-btn-full admin-btn-sm admin-btn-quiet" onClick={logout}><Icon name="logout" size={14} color="var(--muted)" />Log ud</button>
        </div>
      </aside>
      <div className="admin-main" {...(drawerOpen ? { inert: "" } : {})}>
        <div className="admin-topbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button type="button" ref={menuBtnRef} className="admin-menu-btn" aria-label="Åbn menu" aria-expanded={navOpen} aria-controls="admin-sidebar" onClick={() => (navOpen ? closeNav() : openNav())}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2.2"><path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>
          </button>
          <h1>{NAV_ITEMS.find((i) => i.id === section)?.label || "Admin"}</h1>
          {topbarExtra}
        </div>
        <div className="admin-content" ref={contentRef}>{children}</div>
      </div>
    </div>
  );
}
