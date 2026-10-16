// @ts-nocheck
// Familie: familier (grupperet efter ejer) og invitationer med afledt status. Rækkerne er kompakte og åbner en detaljevisning; tilbagekaldelse af en
// invitation og fjernelse af et medlem kræver en begrundelse og logges af databasen. Ingen allergier eller andre helbredsoplysninger vises.
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Icon, showToast } from "../../SharedComponents.jsx";
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
const familyName = (r) => r.name || r.email || "Ejer ikke fundet";

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

function FamilyDetail({ row, canAct, getFamily, revokeInvite, removeMember, onClose, onChanged }) {
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
              {!canAct && <div className="np-note" style={{ marginTop: 0 }}>Handlinger er slået fra, til den seneste databaseopdatering er udgivet.</div>}
              <div className="fam-sub">Medlemmer ({d.members.length})</div>
              {d.members.length === 0 ? <div className="admin-table-empty">Ingen medlemmer</div> : d.members.map((m) => (
                <div key={m.id} className="fam-line">
                  <div style={{ minWidth: 0 }}>
                    <div className="fam-line-title">{m.name}{m.birth_year ? ` (${new Date().getFullYear() - m.birth_year} år)` : ""}</div>
                    <div className="fam-line-meta">{m.is_child ? "Børneprofil" : "Voksen med egen konto"} · tilføjet {date(m.created_at)}</div>
                  </div>
                  <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" disabled={busy || !canAct} onClick={() => setAction({ kind: "member", id: m.id })}>Fjern medlem</button>
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
                      <div className="fam-line-meta">Oprettet {date(i.created_at)} · {i.accepted_at ? `accepteret ${date(i.accepted_at)}` : `udløb ${date(i.expires_at)}`}{i.status === "accepted" && !i.accepted_by ? " · modtager ikke registreret" : ""}</div>
                    </div>
                    {i.status === "pending" && !i.is_request && (
                      <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" disabled={busy || !canAct} onClick={() => setAction({ kind: "invite", id: i.id })}>Tilbagekald</button>
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

export default function FamilySection({ rows, total, invites, famPhase, invPhase, famError, invError, canAct, loadingMore, load, loadMore, getFamily, revokeInvite, removeMember }) {
  const [tab, setTab] = useState("families");
  const [inviteTab, setInviteTab] = useState("all");
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [openId, setOpenId] = useState(null);
  const first = useRef(true);
  const searchRef = useRef(null);

  useEffect(() => {
    if (first.current) { first.current = false; load({ q: "" }); return undefined; }
    const t = setTimeout(() => load({ q: q.trim() }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bevidst: load genskabes hver gang
  }, [q]);
  useEffect(() => { if (searchOpen) searchRef.current?.focus(); }, [searchOpen]);

  const openRow = openId ? rows.find((r) => r.owner_id === openId) : null;
  const famOk = famPhase === "ok";
  const invOk = invPhase === "ok";
  const famStale = famPhase === "error" && rows.length > 0; // opdatering mislykkedes: gamle oplysninger vises med tydelig markering, uden antal
  const invStale = invPhase === "error" && invites.length > 0;
  const shownInvites = invites.filter((i) => inviteTab === "all" || i.status === inviteTab);
  const inviteCount = (k) => (invOk ? (k === "all" ? invites.length : invites.filter((i) => i.status === k).length) : null);
  const countText = (n) => (n === null || n === undefined ? "" : ` (${n.toLocaleString("da-DK")})`);
  const retry = <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => load({ q: q.trim() })}>Prøv igen</button>;

  const errorBox = (err) => (err.denied
    ? <StateBox role="alert" icon="shield" title="Ingen adgang" text="Du har ikke adgang til disse oplysninger." />
    : err.unavailable
      ? <StateBox role="alert" icon="warning" title="Familieadministrationen er ikke tilgængelig endnu" text="Den nødvendige databaseopdatering mangler." />
      : <StateBox role="alert" icon="warning" title="Kunne ikke hente oplysninger" text="Der opstod en fejl. Prøv at opdatere siden." action={retry} />);
  const loadingBox = <div className="admin-loading-row"><div className="admin-spinner" /> Henter…</div>;

  let body;
  if (tab === "families") {
    if (!famOk && !famStale) body = famPhase === "error" ? errorBox(famError) : loadingBox;
    else if (rows.length === 0) body = <StateBox icon="users" title={q.trim() ? "Ingen resultater" : "Ingen familier endnu."} text={q.trim() ? "Ingen resultater matcher din søgning." : "Når nogen opretter familieprofiler, vises de her."} />;
    else body = (
      <div className="admin-card-list">
        {rows.map((r) => (
          <button key={r.owner_id} type="button" className="admin-item-card usr-row" onClick={() => setOpenId(r.owner_id)}>
            <div className="usr-row-name">{familyName(r)}</div>
            <div className="usr-row-mail">{r.email || "Ingen e-mail registreret"}</div>
            <div className="usr-row-meta">{r.profiles} {r.profiles === 1 ? "medlem" : "medlemmer"}{r.child_profiles > 0 ? ` · ${r.child_profiles} ${r.child_profiles === 1 ? "barn" : "børn"}` : ""}{r.pending_invites > 0 ? ` · ${r.pending_invites} afventer` : ""}</div>
            <span className="audit-card-chev" aria-hidden="true"><Icon name="chevronRight" size={16} color="var(--muted2)" /></span>
          </button>
        ))}
      </div>
    );
  } else if (!invOk && !invStale) body = invPhase === "error" ? errorBox(invError) : loadingBox;
  else if (invites.length === 0) body = <StateBox icon="mail" title="Ingen invitationer endnu." text="Når nogen inviterer et familiemedlem, vises invitationen her." />;
  else if (shownInvites.length === 0) body = <StateBox icon="mail" title="Ingen invitationer" text="Der er ingen invitationer med den valgte status." />;
  else body = (
    <div className="admin-card-list">
      {shownInvites.map((i) => {
        const [label, pill] = INVITE_STATUS[i.status] || [i.status, "admin-pill-neutral"];
        return (
          <div key={i.id} className="admin-item-card usr-row">
            <div className="usr-row-name"><span className={`admin-pill ${pill}`}>{label}</span> {i.is_request ? "Forespørgsel" : "Invitation"}</div>
            <div className="usr-row-mail">Fra {i.inviter_name || "ukendt bruger"}{i.status === "accepted" ? (i.accepted_by ? ` · accepteret af ${i.accepted_name || "konto ikke fundet"}` : " · modtager ikke registreret") : ""}</div>
            <div className="usr-row-meta">Oprettet {date(i.created_at)} · {i.accepted_at ? `accepteret ${date(i.accepted_at)}` : i.status === "revoked" ? "tilbagekaldt" : `${i.status === "expired" ? "udløb" : "udløber"} ${date(i.expires_at)}`}</div>
          </div>
        );
      })}
    </div>
  );

  const stale = tab === "families" ? famStale : invStale;
  return (
    <>
      <div className="audit-head"><div className="audit-intro">Administrer familier, medlemmer og invitationer.</div></div>
      <div className="admin-tabs usr-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "families"} className={`admin-tab-btn${tab === "families" ? " active" : ""}`} onClick={() => setTab("families")}>Familier{famOk && !q.trim() ? countText(total) : ""}</button>
        <button type="button" role="tab" aria-selected={tab === "invites"} className={`admin-tab-btn${tab === "invites" ? " active" : ""}`} onClick={() => setTab("invites")}>Invitationer{countText(inviteCount("all"))}</button>
      </div>
      {tab === "families" ? (
        <>
          <div className="audit-results">
            <span aria-live="polite">{famOk ? `${(total ?? rows.length).toLocaleString("da-DK")} ${(total ?? rows.length) === 1 ? "familie" : "familier"}` : ""}</span>
            <button type="button" className="todo-link-btn usr-export" aria-expanded={searchOpen} onClick={() => setSearchOpen((v) => !v)}>Søg</button>
          </div>
          {searchOpen && (
            <div className="fam-search">
              <label htmlFor="fam-q" className="np-vars-label">Søg i ejer (navn eller e-mail)</label>
              <div className="fam-search-row">
                <input id="fam-q" ref={searchRef} type="search" enterKeyHint="search" value={q} onChange={(e) => setQ(e.target.value)} />
                {q && <button type="button" className="admin-iconbtn" aria-label="Ryd søgning" onClick={() => { setQ(""); searchRef.current?.focus(); }}><Icon name="x" size={18} color="var(--ink2)" /></button>}
              </div>
            </div>
          )}
          {!searchOpen && q.trim() && (
            <button type="button" className="audit-search-chip" aria-label={`Søgning: ${q}. Fjern søgningen`} onClick={() => setQ("")}>
              <Icon name="search" size={13} color="var(--green)" /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>“{q.trim()}”</span><Icon name="x" size={13} color="var(--green)" />
            </button>
          )}
        </>
      ) : (
        <div className="admin-tabs usr-tabs fam-filters" role="tablist" aria-label="Status">
          {INVITE_TABS.map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={inviteTab === k} className={`admin-tab-btn${inviteTab === k ? " active" : ""}`} onClick={() => setInviteTab(k)}>{label}{countText(inviteCount(k))}</button>
          ))}
        </div>
      )}
      {!canAct && (famOk || invOk) && <div className="np-note">Handlinger er slået fra, til den seneste databaseopdatering er udgivet.</div>}
      {stale && <div className="todo-confirm" role="alert" style={{ marginBottom: 10 }}>Kunne ikke opdatere. Viser seneste hentede oplysninger. {retry}</div>}
      {body}
      {tab === "families" && famOk && rows.length > 0 && canAct && total !== null && rows.length < total && (
        <div style={{ textAlign: "center", margin: "14px 0" }}>
          <button type="button" className="admin-btn admin-btn-ghost admin-touch" disabled={loadingMore} onClick={loadMore}>{loadingMore ? "Henter…" : `Vis flere (${rows.length} af ${total})`}</button>
        </div>
      )}
      {openRow && <FamilyDetail row={openRow} canAct={canAct} getFamily={getFamily} revokeInvite={revokeInvite} removeMember={removeMember} onClose={() => setOpenId(null)} onChanged={() => load({ q: q.trim() })} />}
    </>
  );
}
