// @ts-nocheck
// Familie: familier (grupperet efter ejer) og invitationer med afledt status. Rækkerne er kompakte og åbner en detaljevisning; tilbagekaldelse af en
// invitation og fjernelse af et medlem kræver en begrundelse og logges af databasen. Ingen allergier eller andre helbredsoplysninger vises.
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Icon, showToast } from "../../SharedComponents.jsx";
import { useShowSpinner } from "../RefreshContext.js";
import { fmtAuditDateTime } from "../auditLogic.js";

export const INVITE_STATUS = { pending: ["Afventer", "admin-pill-amber"], accepted: ["Accepteret", "admin-pill-green"], expired: ["Udløbet", "admin-pill-neutral"], revoked: ["Tilbagekaldt", "admin-pill-red"] };
const INVITE_TABS = [["all", "Alle"], ["pending", "Afventer"], ["accepted", "Accepteret"], ["expired", "Udløbet"], ["revoked", "Tilbagekaldt"]];

function StateBox({ icon, title, text, action, role }) {
  return (
    <div className="admin-table-empty audit-state" role={role}>
      <div className="audit-state-icon" aria-hidden="true"><Icon name={icon} size={22} color="var(--muted)" /></div>
      <div className="audit-state-title">{title}</div>
      <div>{text}</div>
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}

const date = (v) => (v ? fmtAuditDateTime(v).split(" · ")[0] : "–");
const familyName = (r) => r.name || r.email || "Ukendt ejer";

/** Begrundelsesformular, der bruges til både tilbagekaldelse og fjernelse. */
function ReasonForm({ title, confirmLabel, busy, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="todo-confirm fam-reason" role="group" aria-label={title}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <div className="admin-field">
        <label htmlFor="fam-reason">Begrundelse (gemmes i aktivitetsloggen)</label>
        <textarea id="fam-reason" ref={ref} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
      </div>
      <div className="err-actions">
        <button type="button" className="admin-btn admin-btn-ghost admin-touch" disabled={busy} onClick={onCancel}>Annuller</button>
        <button type="button" className="admin-btn admin-btn-danger admin-touch" disabled={busy || reason.trim().length < 3} onClick={() => onConfirm(reason.trim())}>{busy ? "Arbejder…" : confirmLabel}</button>
      </div>
    </div>
  );
}

function FamilyDetail({ row, getFamily, revokeInvite, removeMember, onClose, onChanged }) {
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const [action, setAction] = useState(null); // { kind: "member" | "invite", id }
  const [busy, setBusy] = useState(false);
  const fetchIt = async () => {
    const res = await getFamily(row.owner_id);
    setState(res.ok ? { loading: false, error: "", data: res.data } : { loading: false, error: res.error, data: null });
  };
  useEffect(() => { fetchIt(); /* eslint-disable-next-line react-hooks/exhaustive-deps -- hentes kun ved åbning */ }, [row.owner_id]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !busy) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  const confirm = async (reason) => {
    setBusy(true);
    const res = action.kind === "member" ? await removeMember(action.id, reason) : await revokeInvite(action.id, reason);
    setBusy(false);
    if (!res.ok) { showToast(res.error, "error"); return; }
    showToast(action.kind === "member" ? "Medlemmet er fjernet" : "Invitationen er tilbagekaldt", "success");
    setAction(null);
    await fetchIt();
    onChanged();
  };

  const d = state.data;
  return ReactDOM.createPortal(
    <div className="admin-modal-overlay" onClick={() => !busy && onClose()}>
      <div className="admin-modal todo-panel" role="dialog" aria-modal="true" aria-labelledby="fam-title" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="todo-panel-head">
          <div style={{ minWidth: 0 }}>
            <div id="fam-title" className="audit-sheet-title">{familyName(row)}</div>
            <div className="audit-sheet-time">{row.email || "Ingen e-mail"}</div>
          </div>
          <button type="button" className="admin-iconbtn audit-sheet-close" onClick={onClose} disabled={busy} aria-label="Luk"><Icon name="x" size={20} color="var(--ink2)" /></button>
        </div>
        <div className="todo-panel-body">
          {state.loading && <div className="admin-loading-row"><div className="admin-spinner" /> Henter familie…</div>}
          {state.error && <StateBox role="alert" icon="warning" title="Familien kunne ikke hentes" text={state.error} action={<button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={fetchIt}>Prøv igen</button>} />}
          {d && (
            <>
              <div className="fam-sub">Medlemmer ({d.members.length})</div>
              {d.members.length === 0 ? <div className="admin-table-empty">Ingen medlemmer</div> : d.members.map((m) => (
                <div key={m.id} className="fam-line">
                  <div style={{ minWidth: 0 }}>
                    <div className="fam-line-title">{m.name}{m.birth_year ? ` (${new Date().getFullYear() - m.birth_year} år)` : ""}</div>
                    <div className="fam-line-meta">{m.is_child ? "Børneprofil" : "Voksen med egen konto"} · tilføjet {date(m.created_at)}</div>
                  </div>
                  <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" disabled={busy} onClick={() => setAction({ kind: "member", id: m.id })}>Fjern</button>
                </div>
              ))}
              {action?.kind === "member" && <ReasonForm title="Fjern medlem" confirmLabel="Fjern medlem" busy={busy} onCancel={() => setAction(null)} onConfirm={confirm} />}

              <div className="fam-sub">Invitationer ({d.invites.length})</div>
              {d.invites.length === 0 ? <div className="admin-table-empty">Ingen invitationer</div> : d.invites.map((i) => {
                const [label, pill] = INVITE_STATUS[i.status] || [i.status, "admin-pill-neutral"];
                return (
                  <div key={i.id} className="fam-line">
                    <div style={{ minWidth: 0 }}>
                      <div className="fam-line-title"><span className={`admin-pill ${pill}`}>{label}</span> {i.is_request ? "Forespørgsel om forbindelse" : "Invitation"}</div>
                      <div className="fam-line-meta">Oprettet {date(i.created_at)} · {i.accepted_at ? `accepteret ${date(i.accepted_at)}` : `udløb ${date(i.expires_at)}`}</div>
                    </div>
                    {i.status === "pending" && !i.is_request && (
                      <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" disabled={busy} onClick={() => setAction({ kind: "invite", id: i.id })}>Tilbagekald</button>
                    )}
                  </div>
                );
              })}
              {action?.kind === "invite" && <ReasonForm title="Tilbagekald invitation" confirmLabel="Tilbagekald" busy={busy} onCancel={() => setAction(null)} onConfirm={confirm} />}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function FamilySection({ rows, total, invites, loading, loadingMore, loaded, error, load, loadMore, getFamily, revokeInvite, removeMember }) {
  const showSpinner = useShowSpinner(loading, rows.length > 0 || invites.length > 0);
  const [tab, setTab] = useState("families");
  const [inviteTab, setInviteTab] = useState("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; load({ q: "" }); return; }
    const t = setTimeout(() => load({ q: q.trim() }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bevidst: load genskabes hver gang
  }, [q]);

  const openRow = openId ? rows.find((r) => r.owner_id === openId) : null;
  const shownInvites = invites.filter((i) => inviteTab === "all" || i.status === inviteTab);
  const inviteCount = (k) => (k === "all" ? invites.length : invites.filter((i) => i.status === k).length);

  let body;
  if (error && !loaded) {
    body = error.denied
      ? <StateBox role="alert" icon="shield" title="Ingen adgang" text="Du har ikke adgang til familierne. Log ind med en administratorkonto." />
      : error.unavailable
        ? <StateBox role="alert" icon="warning" title="Familieoversigten er ikke udgivet endnu" text="Den nye familieadministration virker, når den seneste databaseopdatering er udgivet." />
        : <StateBox role="alert" icon="warning" title="Familierne kunne ikke hentes" text="Det betyder ikke, at der ingen familier er. Tjek forbindelsen, og prøv igen."
            action={<button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => load({ q: q.trim() })}>Prøv igen</button>} />;
  } else if (showSpinner || (loading && !loaded)) {
    body = <div className="admin-loading-row"><div className="admin-spinner" /> Henter familie-overblik…</div>;
  } else if (!loaded) {
    body = null;
  } else if (tab === "families") {
    body = rows.length === 0
      ? <StateBox icon="users" title={q ? "Ingen matchende familier" : "Ingen familier endnu"} text={q ? "Prøv at ændre søgningen." : "Når nogen opretter familieprofiler, vises de her."} />
      : (
        <div className="admin-card-list">
          {rows.map((r) => (
            <button key={r.owner_id} type="button" className="admin-item-card usr-row" onClick={() => setOpenId(r.owner_id)}>
              <div className="usr-row-name">{familyName(r)}</div>
              <div className="usr-row-mail">{r.email || "Ingen e-mail"}</div>
              <div className="usr-row-meta">{r.profiles} {r.profiles === 1 ? "medlem" : "medlemmer"}{r.child_profiles > 0 ? ` · ${r.child_profiles} ${r.child_profiles === 1 ? "barn" : "børn"}` : ""}{r.pending_invites > 0 ? ` · ${r.pending_invites} afventer` : ""}</div>
              <span className="audit-card-chev" aria-hidden="true"><Icon name="chevronRight" size={16} color="var(--muted2)" /></span>
            </button>
          ))}
        </div>
      );
  } else {
    body = shownInvites.length === 0
      ? <StateBox icon="mail" title="Ingen invitationer" text="Der er ingen invitationer med den valgte status." />
      : (
        <div className="admin-card-list">
          {shownInvites.map((i) => {
            const [label, pill] = INVITE_STATUS[i.status] || [i.status, "admin-pill-neutral"];
            return (
              <div key={i.id} className="admin-item-card usr-row">
                <div className="usr-row-name"><span className={`admin-pill ${pill}`}>{label}</span> {i.is_request ? "Forespørgsel" : "Invitation"}</div>
                <div className="usr-row-mail">Fra {i.inviter_name || "ukendt bruger"}{i.accepted_by ? ` · accepteret af ${i.accepted_name || "slettet konto"}` : ""}</div>
                <div className="usr-row-meta">Oprettet {date(i.created_at)} · {i.accepted_at ? `accepteret ${date(i.accepted_at)}` : `udløb ${date(i.expires_at)}`}</div>
              </div>
            );
          })}
        </div>
      );
  }

  return (
    <>
      <div className="audit-head"><div className="audit-intro">Se familier og invitationer, og ret fejl med begrundelse.</div></div>
      <div className="admin-tabs usr-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "families"} className={`admin-tab-btn${tab === "families" ? " active" : ""}`} onClick={() => setTab("families")}>Familier{total !== null ? ` (${total.toLocaleString("da-DK")})` : ""}</button>
        <button type="button" role="tab" aria-selected={tab === "invites"} className={`admin-tab-btn${tab === "invites" ? " active" : ""}`} onClick={() => setTab("invites")}>Invitationer ({invites.length})</button>
      </div>
      {tab === "families" ? (
        <div className="admin-field"><label htmlFor="fam-q">Søg i ejer (navn eller e-mail)</label><input id="fam-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      ) : (
        <div className="admin-tabs usr-tabs" role="tablist" aria-label="Status">
          {INVITE_TABS.map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={inviteTab === k} className={`admin-tab-btn${inviteTab === k ? " active" : ""}`} onClick={() => setInviteTab(k)}>{label} ({inviteCount(k)})</button>
          ))}
        </div>
      )}
      {error && loaded && <div className="todo-confirm" role="alert" style={{ marginBottom: 10 }}>Flere familier kunne ikke hentes.</div>}
      {body}
      {tab === "families" && loaded && rows.length > 0 && total !== null && rows.length < total && (
        <div style={{ textAlign: "center", margin: "14px 0" }}>
          <button type="button" className="admin-btn admin-btn-ghost admin-touch" disabled={loadingMore} onClick={loadMore}>{loadingMore ? "Henter…" : `Vis flere (${rows.length} af ${total})`}</button>
        </div>
      )}
      {openRow && <FamilyDetail row={openRow} getFamily={getFamily} revokeInvite={revokeInvite} removeMember={removeMember} onClose={() => setOpenId(null)} onChanged={() => load({ q: q.trim() })} />}
    </>
  );
}
