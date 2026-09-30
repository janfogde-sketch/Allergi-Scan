// @ts-nocheck
// SCREENS.TICKET — brugerens egen feedback-ticket (åbnes fra "Se din feedback" på en besked).
// Kun ejeren kan læse den (RLS). Viser den oprindelige tilbagemelding, status og teamets seneste svar.
import React, { useEffect, useState, useCallback } from "react";
import { Icon } from "./SharedComponents.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { timeAgo } from "./helpers.js";
import { fetchTicket, TICKET_STATUS_LABELS } from "./notificationsApi.js";

const LABEL = { fontSize:10.5, fontWeight:700, textTransform:"uppercase", letterSpacing:1.4, color:"var(--muted)", marginBottom:6 };

export default function TicketScreen({ ticketId, onBack }) {
  const { accessToken } = useAuthContext();
  const [state, setState] = useState({ status: "loading", item: null });

  const load = useCallback(async () => {
    setState({ status: "loading", item: null });
    setState(await fetchTicket(accessToken, ticketId));
  }, [accessToken, ticketId]);

  useEffect(() => { if (ticketId) load(); }, [ticketId]); // eslint-disable-line react-hooks/exhaustive-deps

  const t = state.item;
  return (
    <div className="screen fade-in">
      <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0 14px" }}>
        <button onClick={onBack} aria-label="Tilbage" className="legal-topbar-back" style={{ position:"static" }}>
          <span className="legal-topbar-back-circle"><Icon name="chevronLeft" size={17} color="var(--ink)" /></span>
        </button>
        <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)" }}>Din feedback</div>
      </div>

      {state.status === "loading" && <div style={{ color:"var(--muted)", fontSize:13.5 }} role="status">Henter din feedback…</div>}

      {state.status === "error" && (
        <div className="error-box" role="alert">
          Din feedback kunne ikke hentes. Tjek din forbindelse og prøv igen.
          <button className="btn btn-outline" style={{ marginLeft:8, padding:"6px 12px", fontSize:12 }} onClick={load}>Prøv igen</button>
        </div>
      )}

      {state.status === "notfound" && (
        <div className="card">
          <div className="card-title">Feedbacken er ikke længere tilgængelig</div>
          <p style={{ fontSize:13.5, color:"var(--ink2)", lineHeight:1.5, margin:"6px 0 14px" }}>
            Den kan være slettet, eller den hører til en anden konto end den, du er logget ind med.
          </p>
          <button className="btn btn-primary" onClick={onBack}>Tilbage</button>
        </div>
      )}

      {state.status === "ok" && (
        <>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <span className="badge" style={{ background:"var(--surface2)", color:"var(--ink2)", border:"1px solid var(--border)" }}>
              Status: {TICKET_STATUS_LABELS[t.status] || t.status}
            </span>
            <span style={{ fontSize:11.5, color:"var(--muted)" }}>Sendt {timeAgo(t.created_at)}</span>
          </div>

          <div className="card">
            <div style={LABEL}>Din tilbagemelding</div>
            <div style={{ fontSize:14, color:"var(--ink2)", lineHeight:1.55, whiteSpace:"pre-wrap", overflowWrap:"anywhere" }}>{t.description}</div>
          </div>

          <div className="card">
            <div style={LABEL}>Svar fra vores team</div>
            {t.admin_note
              ? <div style={{ fontSize:14, color:"var(--ink)", lineHeight:1.55, whiteSpace:"pre-wrap", overflowWrap:"anywhere" }}>{t.admin_note}</div>
              : <div style={{ fontSize:13.5, color:"var(--muted)", lineHeight:1.5 }}>Der er endnu ikke skrevet et svar. Du får besked, når vi har kigget på den.</div>}
          </div>

          <p style={{ fontSize:12.5, color:"var(--muted)", lineHeight:1.5 }}>
            Har du flere oplysninger, kan du sende dem via feedbackknappen i appen. Henvis gerne til din tidligere tilbagemelding.
          </p>
        </>
      )}
    </div>
  );
}
