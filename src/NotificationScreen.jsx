// @ts-nocheck
// SCREENS.NOTIFICATION — den fulde besked, som en push åbner via
// ?notification={id}. Kun modtageren kan læse den (RLS); alle andre tilfælde
// (slettet, udløbet, anden konto) ser den samme neutrale besked, så indholdet
// aldrig afsløres. Læst-status sættes først, når beskeden er vist.
import React, { useEffect, useState, useCallback, useRef } from "react";
import { BackButton } from "./IconButton.jsx";
import { Icon, ConfirmDialog, showToast } from "./SharedComponents.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { formatDateTimeDa } from "./helpers.js";
import NotificationBlocks from "./NotificationBlocks.jsx";
import { fetchNotification, fetchInviteStatus, PENDING_KEY } from "./notificationsApi.js";

// Handlinger, appen må udføre fra en besked.
const SUPPORTED_ACTIONS = ["open_product", "scan", "open_family", "open_list", "open_ticket"];

export default function NotificationScreen({ notificationId, markRead, onDelete, onAction, onBack }) {
  const { accessToken, clearAuth } = useAuthContext();
  const [state, setState] = useState({ status: "loading", item: null });
  // P2 (invitation udløber): knappen fjernes, når invitationen ikke længere er gyldig.
  const [inviteInactive, setInviteInactive] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading", item: null });
    const res = await fetchNotification(accessToken, notificationId);
    setState(res);
    // Beskeden er hentet (eller findes ikke): det ventende link fra push er brugt.
    try { if (localStorage.getItem(PENDING_KEY) === notificationId) localStorage.removeItem(PENDING_KEY); } catch { /* ignorer */ }
    setInviteInactive(false);
    if (res.status === "ok" && !res.item.read_at) markRead(notificationId);
    if (res.status === "ok" && res.item.type === "P2" && res.item.entity_id) {
      const inv = await fetchInviteStatus(accessToken, res.item.entity_id);
      if (inv === "inactive") setInviteInactive(true);
    }
  }, [accessToken, notificationId, markRead]);

  useEffect(() => { if (notificationId) load(); }, [notificationId]); // eslint-disable-line react-hooks/exhaustive-deps -- bevidst: load afhænger af accessToken; et token-skifte må ikke genindlæse og blinke den åbne besked

  // "Slet besked": bekræftes først, og sender derefter brugeren tilbage til oversigten.
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false); // gentagne tryk på "Slet besked" sletter kun én gang
  const doDelete = async () => {
    if (deletingRef.current) return;
    deletingRef.current = true;
    setConfirmDelete(false);
    setDeleting(true);
    const ok = await onDelete(notificationId);
    setDeleting(false);
    deletingRef.current = false;
    if (ok) { showToast("Beskeden er slettet"); onBack(); }
    else showToast("Beskeden kunne ikke slettes. Prøv igen.", "error");
  };

  const switchAccount = () => {
    try { localStorage.setItem(PENDING_KEY, notificationId); } catch { /* ignorer */ }
    clearAuth();
  };

  const blocks = state.item?.content_blocks || [];
  const headBlocks = blocks[0]?.type === "heading" ? [blocks[0]] : [];
  const restBlocks = headBlocks.length ? blocks.slice(1) : blocks;
  const action = state.item?.primary_action;
  const canAct = action && SUPPORTED_ACTIONS.includes(action.type) && !inviteInactive;

  return (
    <div className="screen fade-in">
      <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0 14px" }}>
        {/* Tilbagepil (som på øvrige undersider); kryds bruges kun i modaler. */}
        <BackButton onClick={onBack} />
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
          <div className="card">
            {/* Overskrift, så dato og tidspunkt, så den fulde tekst (og en evt. begrundelse i en diskret boks). */}
            <NotificationBlocks blocks={headBlocks} />
            <div style={{ fontSize:12, color:"var(--muted)", margin:"-6px 0 14px" }}>{formatDateTimeDa(state.item.event_at || state.item.created_at)}</div>
            <NotificationBlocks blocks={restBlocks} />
          </div>
          {inviteInactive && (
            <div className="info-box" role="status" style={{ marginTop:12 }}>Invitationen er ikke længere aktiv. Du kan oprette en ny under Familie.</div>
          )}
          {canAct && (
            <button className="btn btn-primary btn-full" style={{ marginTop:12 }} onClick={() => onAction(action)}>
              {action.label}
            </button>
          )}
          {/* Diskret sletning nederst: rød tekst uden fyld, 44 px høj. */}
          <button type="button" disabled={deleting} onClick={() => setConfirmDelete(true)}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, width:"100%", minHeight:44, marginTop:20, background:"none", border:"none", cursor:"pointer", fontFamily:"var(--f)", fontSize:13.5, fontWeight:700, color:"var(--red)" }}>
            <Icon name="trash" size={14} color="var(--red)" /> Slet besked
          </button>
          {confirmDelete && (
            <ConfirmDialog
              title="Slet besked?"
              message="Vil du slette denne besked? Handlingen kan ikke fortrydes."
              confirmLabel="Slet besked"
              onConfirm={doDelete}
              onCancel={() => setConfirmDelete(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
