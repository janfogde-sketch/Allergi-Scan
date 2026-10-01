// @ts-nocheck
// SCREENS.NOTIFICATIONS — oversigt over egne beskeder (nyeste først) med tid og
// læst/ulæst. Åbnes fra hamburgermenuen ("Beskeder") og fra beskedsidens
// tilbage-knap. Selve beskeden vises af NotificationScreen.jsx.
import React, { useEffect } from "react";
import { Icon } from "./SharedComponents.jsx";
import { timeAgo } from "./helpers.js";

export default function NotificationsScreen({ items, loading, listError, loadList, onOpen, onBack }) {
  useEffect(() => { loadList(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="screen fade-in">
      <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0 14px" }}>
        <button onClick={onBack} aria-label="Tilbage" className="legal-topbar-back" style={{ position:"static" }}>
          <span className="legal-topbar-back-circle"><Icon name="chevronLeft" size={17} color="var(--ink)" /></span>
        </button>
        <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)" }}>Beskeder</div>
      </div>

      {listError && (
        <div className="error-box" role="alert" style={{ marginBottom:12 }}>
          Beskederne kunne ikke hentes. <button className="btn btn-outline" style={{ marginLeft:8, padding:"6px 12px", fontSize:12 }} onClick={loadList}>Prøv igen</button>
        </div>
      )}

      {!listError && !loading && items.length === 0 && (
        // Samme tomme tilstand som Favoritter (1. okt. 2026): rundt ikon, overskrift, kort hjælpetekst.
        <div className="empty-state">
          <span className="empty-icon" style={{ width:60, height:60 }}><Icon name="message" size={23} color="var(--muted)" /></span>
          <div className="empty-txt">Ingen beskeder endnu</div>
          <div className="empty-sub">Her samles svar på din feedback, godkendte produkter og andre beskeder fra EatSafe.</div>
        </div>
      )}

      {items.map((n) => {
        const unread = !n.read_at;
        return (
          <button key={n.id} onClick={() => onOpen(n.id)}
            style={{ display:"flex", alignItems:"center", gap:12, width:"100%", textAlign:"left", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r)", padding:"14px 16px", marginBottom:10, boxShadow:"var(--sh)", cursor:"pointer", fontFamily:"var(--f)" }}>
            <span aria-hidden="true" style={{ width:9, height:9, borderRadius:"50%", flexShrink:0, background: unread ? "var(--green)" : "transparent", border: unread ? "none" : "1.5px solid var(--border2)" }} />
            <span style={{ flex:1, minWidth:0 }}>
              <span style={{ display:"block", fontSize:14, fontWeight: unread ? 800 : 600, color:"var(--ink)" }}>{n.title}</span>
              <span style={{ display:"block", fontSize:12.5, color:"var(--muted)", marginTop:2, lineHeight:1.4 }}>{n.push_body}</span>
              <span style={{ display:"block", fontSize:11, color:"var(--muted)", marginTop:4 }}>
                {timeAgo(n.event_at || n.created_at)}{unread ? " · Ulæst" : ""}
              </span>
            </span>
            <Icon name="chevronRight" size={14} color="var(--muted)" />
          </button>
        );
      })}
    </div>
  );
}
