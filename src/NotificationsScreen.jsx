// @ts-nocheck
// SCREENS.NOTIFICATIONS — oversigt over egne beskeder (nyeste først) med tid og
// læst/ulæst. Åbnes fra hamburgermenuen ("Beskeder") og når en åbnet besked
// lukkes (tilbagepil). Hele kortet åbner beskeden (NotificationScreen.jsx); sletning findes kun inde i den enkelte besked.
import React, { useEffect, useLayoutEffect } from "react";
import { Icon, LoadErrorBox } from "./SharedComponents.jsx";
import { timeAgo } from "./helpers.js";

// Scrollpositionen, da en besked blev åbnet: gendannes, når brugeren kommer tilbage til oversigten (kun i denne fane, ryddes ved gendannelsen).
const SCROLL_KEY = "as_notifications_scroll";
const readScroll = () => { try { return Number(sessionStorage.getItem(SCROLL_KEY)) || 0; } catch { return 0; } };
const writeScroll = (y) => { try { if (y > 0) sessionStorage.setItem(SCROLL_KEY, String(Math.round(y))); else sessionStorage.removeItem(SCROLL_KEY); } catch { /* privat tilstand */ } };

const CLAMP2 = { display:"-webkit-box", WebkitBoxOrient:"vertical", WebkitLineClamp:2, overflow:"hidden", overflowWrap:"anywhere" };

export default function NotificationsScreen({ items, loading, listError, loadList, onOpen }) {
  useEffect(() => { loadList(); }, []); // eslint-disable-line react-hooks/exhaustive-deps -- bevidst: listen hentes ved hvert besøg (mount); loadList kommer fra App og skifter identitet hver render
  // Tilbage fra en besked: samme sted i listen som før (listen ligger allerede i hukommelsen, så der er noget at rulle til).
  useLayoutEffect(() => {
    const y = readScroll();
    if (y > 0) { window.scrollTo(0, y); writeScroll(0); }
  }, []);

  const open = (id) => { writeScroll(window.scrollY || 0); onOpen(id); };

  return (
    <div className="screen fade-in">
      {/* Ingen tilbageknap (1. okt. 2026): Beskeder nås fra menuen og forlades via menuen/bundnavigationen. */}
      <div style={{ margin:"4px 0 14px" }}>
        <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)" }}>Beskeder</div>
      </div>

      {listError && (
        <LoadErrorBox what="Beskederne" onRetry={loadList} />
      )}

      {!listError && !loading && items.length === 0 && (
        // Samme tomme tilstand som Favoritter (1. okt. 2026): rundt ikon, overskrift, kort hjælpetekst.
        <div className="empty-state">
          <span className="empty-icon" style={{ width:60, height:60 }}><Icon name="message" size={23} color="var(--muted)" /></span>
          <div className="empty-txt">Ingen beskeder endnu</div>
          <div className="empty-sub">Her kan du se svar og opdateringer fra EatSafe.</div>
        </div>
      )}

      {items.map((n) => {
        const unread = !n.read_at;
        return (
          // Hele kortet er én knap. Ulæst = udfyldt grøn prik + fed overskrift; læst = ingen prik og en neutral overskrift (ingen ring, der ligner en radioknap).
          <button key={n.id} type="button" onClick={() => open(n.id)}
            style={{ display:"flex", alignItems:"center", gap:12, width:"100%", minHeight:44, textAlign:"left", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r)", marginBottom:10, boxShadow:"var(--sh)", padding:"12px 14px", cursor:"pointer", fontFamily:"var(--f)" }}>
            <span aria-hidden="true" style={{ width:9, height:9, borderRadius:"50%", flexShrink:0, alignSelf:"flex-start", marginTop:7, background: unread ? "var(--green)" : "transparent" }} />
            <span style={{ flex:1, minWidth:0 }}>
              <span style={{ display:"block", fontSize:14.5, fontWeight: unread ? 800 : 600, color: unread ? "var(--ink)" : "var(--ink2)", lineHeight:1.3, overflowWrap:"anywhere" }}>
                {unread && <span className="sr-only">Ulæst: </span>}{n.title}
              </span>
              <span style={{ ...CLAMP2, fontSize:12.5, color:"var(--muted)", marginTop:2, lineHeight:1.4 }}>{n.push_body}</span>
              <span style={{ display:"block", fontSize:11, color:"var(--muted)", marginTop:4 }}>{timeAgo(n.event_at || n.created_at)}</span>
            </span>
            <span aria-hidden="true" style={{ flexShrink:0, display:"flex" }}><Icon name="chevronRight" size={16} color="var(--muted)" /></span>
          </button>
        );
      })}
    </div>
  );
}
