// @ts-nocheck
// SCREENS.RECALLS (to do 0255840a, 14. okt. 2026): de seneste 60 dages tilbagekaldelser fra
// Fødevarestyrelsen, også dem uden stregkode. Åbnes fra Indstillinger. Kun tekst fra Fødevarestyrelsen
// (recalls-tabellen); linket vises kun til deres eget domæne. Ingen matching på navn.
import React, { useState } from "react";
import { Icon, LoadErrorBox } from "./SharedComponents.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useRecentRecalls } from "./useRecentRecalls.js";
import { isOfficialRecallUrl } from "../supabase/functions/_shared/recallParser.js";

export default function RecallsListScreen({ onBack }) {
  const { accessToken } = useAuthContext();
  const { items, loading, error, reload } = useRecentRecalls(accessToken);
  const [open, setOpen] = useState(null);
  const line = { fontSize:13, color:"var(--ink)", lineHeight:1.5, marginTop:6 };

  return (
    <div className="screen fade-in">
      <div style={{ display:"flex", alignItems:"center", gap:8, margin:"4px 0 6px" }}>
        <button type="button" onClick={onBack} aria-label="Tilbage" className="legal-topbar-back">
          <span className="legal-topbar-back-circle"><Icon name="chevronLeft" size={17} color="var(--ink)" /></span>
        </button>
        <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)" }}>Aktuelle tilbagekaldelser</div>
      </div>
      <div style={{ fontSize:12.5, color:"var(--muted)", lineHeight:1.5, marginBottom:14 }}>
        Listen kommer fra Fødevarestyrelsen. Tjek altid emballagens parti og dato.
      </div>

      {error && <LoadErrorBox what="Tilbagekaldelserne" onRetry={reload} />}

      {!error && !loading && items.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon" style={{ width:60, height:60 }}><Icon name="warning" size={23} color="var(--muted)" /></span>
          <div className="empty-txt">Ingen tilbagekaldelser de seneste 60 dage.</div>
        </div>
      )}

      {items.map((r, i) => {
        const isOpen = open === i;
        const date = r.published_at ? new Date(r.published_at).toLocaleDateString("da-DK", { day:"numeric", month:"long", year:"numeric" }) : null;
        return (
          <div key={r.source_url || i} className="card" style={{ marginBottom:10 }}>
            <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}
              style={{ display:"flex", alignItems:"center", gap:10, width:"100%", textAlign:"left", background:"none", border:"none", padding:0, cursor:"pointer", fontFamily:"var(--f)" }}>
              <span style={{ flex:1, minWidth:0 }}>
                <span style={{ display:"block", fontSize:14, fontWeight:700, color:"var(--ink)" }}>{r.title}</span>
                {date && <span style={{ display:"block", fontSize:12, color:"var(--muted)", marginTop:2 }}>Offentliggjort {date}</span>}
              </span>
              <Icon name={isOpen ? "chevronUp" : "chevronDown"} size={14} color="var(--muted)" />
            </button>
            {isOpen && (
              <div>
                {r.reason && <div style={line}><b>Årsag:</b> {r.reason}</div>}
                {r.action && <div style={line}><b>Hvad skal du gøre:</b> {r.action}</div>}
                {isOfficialRecallUrl(r.source_url) && (
                  <a href={r.source_url} target="_blank" rel="noopener noreferrer"
                    style={{ display:"inline-flex", alignItems:"center", gap:6, marginTop:10, fontSize:13, fontWeight:700, color:"var(--red)" }}>
                    Læs hos Fødevarestyrelsen <Icon name="link" size={13} color="var(--red)" />
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
