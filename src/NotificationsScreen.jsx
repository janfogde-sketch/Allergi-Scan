// @ts-nocheck
// SCREENS.NOTIFICATIONS — oversigt over egne beskeder (nyeste først) med tid og
// læst/ulæst. Åbnes fra hamburgermenuen ("Beskeder") og når en åbnet besked
// lukkes (kryds). Selve beskeden vises af NotificationScreen.jsx.
import React, { useEffect, useState } from "react";
import { Icon, ConfirmDialog, showToast, LoadErrorBox } from "./SharedComponents.jsx";
import { timeAgo } from "./helpers.js";

export default function NotificationsScreen({ items, loading, listError, loadList, onOpen, onDelete }) {
  useEffect(() => { loadList(); }, []); // eslint-disable-line react-hooks/exhaustive-deps -- bevidst: listen hentes ved hvert besøg (mount); loadList kommer fra App og skifter identitet hver render
  // Besked, der afventer "Slet besked"-bekræftelse (ConfirmDialog, samme mønster som Familie/Indkøbsliste).
  const [confirmDelete, setConfirmDelete] = useState(null);

  const doDelete = async () => {
    const n = confirmDelete;
    setConfirmDelete(null);
    const ok = await onDelete(n.id);
    showToast(ok ? "Beskeden er slettet" : "Beskeden kunne ikke slettes. Prøv igen.", ok ? "success" : "error");
  };

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
          <div className="empty-sub">Her samles svar på din feedback, godkendte produkter og andre beskeder fra EatSafe.</div>
        </div>
      )}

      {items.map((n) => {
        const unread = !n.read_at;
        return (
          // Rækken er en container med to knapper (åbn + slet) — en knap må ikke ligge i en knap.
          <div key={n.id}
            style={{ display:"flex", alignItems:"center", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r)", marginBottom:10, boxShadow:"var(--sh)" }}>
            <button onClick={() => onOpen(n.id)}
              style={{ display:"flex", alignItems:"center", gap:12, flex:1, minWidth:0, textAlign:"left", background:"none", border:"none", padding:"14px 4px 14px 16px", cursor:"pointer", fontFamily:"var(--f)" }}>
              <span aria-hidden="true" style={{ width:9, height:9, borderRadius:"50%", flexShrink:0, background: unread ? "var(--green)" : "transparent", border: unread ? "none" : "1.5px solid var(--border2)" }} />
              <span style={{ flex:1, minWidth:0 }}>
                <span style={{ display:"block", fontSize:14, fontWeight: unread ? 800 : 600, color:"var(--ink)" }}>{n.title}</span>
                <span style={{ display:"block", fontSize:12.5, color:"var(--muted)", marginTop:2, lineHeight:1.4 }}>{n.push_body}</span>
                <span style={{ display:"block", fontSize:11, color:"var(--muted)", marginTop:4 }}>
                  {timeAgo(n.event_at || n.created_at)}{unread ? " · Ulæst" : ""}
                </span>
              </span>
            </button>
            <button onClick={() => setConfirmDelete(n)} aria-label={`Slet besked: ${n.title}`}
              style={{ flexShrink:0, width:44, minHeight:44, alignSelf:"stretch", display:"flex", alignItems:"center", justifyContent:"center", background:"none", border:"none", borderLeft:"1px solid var(--border)", cursor:"pointer", borderRadius:"0 var(--r) var(--r) 0" }}>
              <Icon name="trash" size={16} color="var(--muted)" />
            </button>
          </div>
        );
      })}

      {confirmDelete && (
        <ConfirmDialog
          title="Slet besked?"
          message="Beskeden fjernes fra din oversigt og kan ikke fortrydes."
          confirmLabel="Slet besked"
          onConfirm={doDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
