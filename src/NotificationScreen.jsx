// @ts-nocheck
// SCREENS.NOTIFICATION — den fulde besked, som en push åbner via
// ?notification={id}. Kun modtageren kan læse den (RLS); alle andre tilfælde
// (slettet, udløbet, anden konto) ser den samme neutrale besked, så indholdet
// aldrig afsløres. Læst-status sættes først, når beskeden er vist.
import React, { useEffect, useState, useCallback } from "react";
import { Icon } from "./SharedComponents.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { timeAgo } from "./helpers.js";
import NotificationBlocks from "./NotificationBlocks.jsx";
import { fetchNotification, fetchInviteStatus, PENDING_KEY } from "./notificationsApi.js";

// Handlinger, appen må udføre fra en besked. `open_ticket` vises først, når
// egne feedback-visninger findes (trin 4) — indtil da ingen virkesløs knap.
const SUPPORTED_ACTIONS = ["open_product", "scan", "open_family", "open_list"];

export default function NotificationScreen({ notificationId, markRead, onAction, onBack }) {
  const { accessToken, clearAuth } = useAuthContext();
  const [state, setState] = useState({ status: "loading", item: null });
  // P2 (invitation udløber): knappen fjernes, når invitationen ikke længere er gyldig.
  const [inviteInactive, setInviteInactive] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading", item: null });
    const res = await fetchNotification(accessToken, notificationId);
    setState(res);
    setInviteInactive(false);
    if (res.status === "ok" && !res.item.read_at) markRead(notificationId);
    if (res.status === "ok" && res.item.type === "P2" && res.item.entity_id) {
      const inv = await fetchInviteStatus(accessToken, res.item.entity_id);
      if (inv === "inactive") setInviteInactive(true);
    }
  }, [accessToken, notificationId, markRead]);

  useEffect(() => { if (notificationId) load(); }, [notificationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchAccount = () => {
    try { localStorage.setItem(PENDING_KEY, notificationId); } catch { /* ignorer */ }
    clearAuth();
  };

  const action = state.item?.primary_action;
  const canAct = action && SUPPORTED_ACTIONS.includes(action.type) && !inviteInactive;

  return (
    <div className="screen fade-in">
      <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0 14px" }}>
        <button onClick={onBack} aria-label="Tilbage til beskeder" className="legal-topbar-back" style={{ position:"static" }}>
          <span className="legal-topbar-back-circle"><Icon name="chevronLeft" size={17} color="var(--ink)" /></span>
        </button>
        <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)" }}>Besked</div>
      </div>

      {state.status === "loading" && <div style={{ color:"var(--muted)", fontSize:13.5 }} role="status">Henter besked…</div>}

      {state.status === "error" && (
        <div className="error-box" role="alert">
          Beskeden kunne ikke hentes. Tjek din forbindelse og prøv igen.
          <button className="btn btn-outline" style={{ marginLeft:8, padding:"6px 12px", fontSize:12 }} onClick={load}>Prøv igen</button>
        </div>
      )}

      {state.status === "notfound" && (
        <div className="card">
          <div className="card-title">Beskeden er ikke længere tilgængelig</div>
          <p style={{ fontSize:13.5, color:"var(--ink2)", lineHeight:1.5, margin:"6px 0 14px" }}>
            Den kan være slettet eller udløbet, eller også hører den til en anden konto end den, du er logget ind med.
          </p>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button className="btn btn-primary" onClick={onBack}>Se dine beskeder</button>
            <button className="btn btn-outline" onClick={switchAccount}>Log ind med en anden konto</button>
          </div>
        </div>
      )}

      {state.status === "ok" && (
        <>
          <div style={{ fontSize:11.5, color:"var(--muted)", marginBottom:10 }}>{timeAgo(state.item.event_at || state.item.created_at)}</div>
          <NotificationBlocks blocks={state.item.content_blocks} />
          {inviteInactive && (
            <div className="info-box" role="status" style={{ marginTop:4 }}>Invitationen er ikke længere aktiv. Du kan oprette en ny under Familie.</div>
          )}
          {canAct && (
            <button className="btn btn-primary btn-full" style={{ marginTop:8 }} onClick={() => onAction(action)}>
              {action.label}
            </button>
          )}
        </>
      )}
    </div>
  );
}
