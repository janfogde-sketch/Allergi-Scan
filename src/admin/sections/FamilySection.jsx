// @ts-nocheck
// Familie: familier (grupperet efter ejer) og invitationer med afledt status. Rækkerne er kompakte og åbner en detaljevisning; tilbagekaldelse af en
// invitation og fjernelse af en profil kræver en begrundelse og logges af databasen. Ingen allergier eller andre helbredsoplysninger vises.
// Søgningen sker fra headerens søgeikon (AdminApp giver den videre som q); den kan ryddes her via mærket.
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Icon, showToast } from "../../SharedComponents.jsx";
import { fmtAuditDateTime } from "../auditLogic.js";
import Disclosure from "../Disclosure.jsx";
import { memberLabel, memberCount } from "../familyLogic.js";

// Samme betegnelser og farver overalt: grøn = accepteret, afdæmpet orange = afventer, grå = udløbet, afdæmpet rød = tilbagekaldt
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
const dateTime = (v) => (v ? fmtAuditDateTime(v, true) : "–");
const familyName = (r) => r.name || r.email || "Ejer ikke fundet";
const inviteType = (i) => (i.is_request ? "Forespørgsel om forbindelse (delt link)" : i.kind === "link" ? "Delt link" : i.kind === "email" ? "Mail" : "Invitation");
/** Den dato, der hører til statussen. */
const statusDate = (i) => (i.status === "accepted" ? `accepteret ${date(i.accepted_at)}` : i.status === "revoked" ? "tilbagekaldt" : `${i.status === "expired" ? "udløb" : "udløber"} ${date(i.expires_at)}`);
const recipientText = (i) => (i.status !== "accepted" ? null : i.accepted_by ? i.accepted_name || "Konto ikke fundet" : "Modtager ikke registreret");

/** Begrundelsesformular, der bruges til både tilbagekaldelse og fjernelse. */
function ReasonForm({ title, text, confirmLabel, busy, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="todo-confirm fam-reason" role="group" aria-label={title}>
      <div style={{ fontWeight: 800, marginBottom: 4 }}>{title}</div>
      {text && <div style={{ fontSize: 12.5, marginBottom: 8 }}>{text}</div>}
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

/** Fælles ramme til detaljevisninger (samme panel som resten af administrationen): X øverst, indholdet ruller. */
function Panel({ title, sub, onClose, busy, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !busy) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, busy]);
  return ReactDOM.createPortal(
    <div className="admin-modal-overlay" onClick={() => !busy && onClose()}>
      <div className="admin-modal todo-panel" role="dialog" aria-modal="true" aria-labelledby="fam-title" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="todo-panel-head">
          <div style={{ minWidth: 0 }}>
            <div id="fam-title" className="audit-sheet-title">{title}</div>
            {sub && <div className="audit-sheet-time">{sub}</div>}
          </div>
          <button type="button" className="admin-iconbtn audit-sheet-close" onClick={onClose} disabled={busy} aria-label="Luk"><Icon name="x" size={20} color="var(--ink2)" /></button>
        </div>
        <div className="todo-panel-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

const StatusPill = ({ status }) => { const [label, pill] = INVITE_STATUS[status] || [status, "admin-pill-neutral"]; return <span className={`admin-pill ${pill}`}>{label}</span>; };

function InviteDetail({ invite, canAct, revokeInvite, onClose, onChanged }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const i = invite;
  const confirm = async (reason) => {
    setBusy(true);
    const res = await revokeInvite(i.id, reason);
    setBusy(false);
    if (!res.ok) { showToast(res.error, "error"); return; }
    showToast("Invitationen er tilbagekaldt", "success");
    onChanged();
    onClose();
  };
  const rec = recipientText(i);
  return (
    <Panel title={inviteType(i)} sub={`Oprettet ${date(i.created_at)}`} onClose={onClose} busy={busy}>
      <dl className="audit-detail">
        <div className="audit-detail-row"><dt>Status</dt><dd><StatusPill status={i.status} /></dd></div>
        <div className="audit-detail-row"><dt>Afsender</dt><dd>{i.inviter_name || "Ukendt bruger"}</dd></div>
        {rec && <div className="audit-detail-row"><dt>Modtager</dt><dd>{rec}</dd></div>}
        <div className="audit-detail-row"><dt>Oprettet</dt><dd>{dateTime(i.created_at)}</dd></div>
        <div className="audit-detail-row"><dt>Udløb</dt><dd>{dateTime(i.expires_at)}</dd></div>
        {i.accepted_at && <div className="audit-detail-row"><dt>Accepteret</dt><dd>{dateTime(i.accepted_at)}</dd></div>}
      </dl>
      {i.status === "accepted" && !i.accepted_by && <div className="np-note">Modtageren blev ikke gemt ved accepten, eller kontoen er siden slettet. Det kan ikke afgøres bagefter.</div>}
      {i.status === "pending" && !i.is_request && (
        asking
          ? <ReasonForm title="Tilbagekald invitation" text="Invitationen kan ikke længere accepteres. Rækken bevares som tilbagekaldt." confirmLabel="Tilbagekald" busy={busy} onCancel={() => setAsking(false)} onConfirm={confirm} />
          : <button type="button" className="admin-btn admin-btn-ghost admin-touch usr-edit-btn" disabled={!canAct} title={canAct ? undefined : "Administrative ændringer er midlertidigt utilgængelige."} onClick={() => setAsking(true)}>Tilbagekald invitation</button>
      )}
      {i.is_request && i.status === "pending" && <div className="np-note">Forespørgsler om forbindelse behandles af afsenderen og kan ikke tilbagekaldes her.</div>}
      <Disclosure title="Tekniske oplysninger">
        <dl className="audit-detail">
          <div className="audit-detail-row"><dt>Invitations-id</dt><dd className="np-mono">{i.id}</dd></div>
          {i.invited_by && <div className="audit-detail-row"><dt>Afsender-id</dt><dd className="np-mono">{i.invited_by}</dd></div>}
          {i.accepted_by && <div className="audit-detail-row"><dt>Modtager-id</dt><dd className="np-mono">{i.accepted_by}</dd></div>}
        </dl>
      </Disclosure>
    </Panel>
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

  const confirm = async (reason) => {
    setBusy(true);
    const res = action.kind === "member" ? await removeMember(action.id, reason) : await revokeInvite(action.id, reason);
    setBusy(false);
    if (!res.ok) { showToast(res.error, "error"); return; }
    showToast(action.kind === "member" ? "Profilen er fjernet" : "Invitationen er tilbagekaldt", "success");
    setAction(null);
    await fetchIt();
    onChanged();
  };

  const d = state.data;
  const off = canAct ? undefined : "Administrative ændringer er midlertidigt utilgængelige.";
  return (
    <Panel title={familyName(row)} sub={row.email || "Ingen e-mail registreret"} onClose={onClose} busy={busy}>
      {state.loading && <div className="admin-loading-row"><div className="admin-spinner" /> Henter familie…</div>}
      {state.error && <StateBox role="alert" icon="warning" title="Kunne ikke hente oplysninger" text="Der opstod en fejl. Prøv at opdatere siden." action={<button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={fetchIt}>Prøv igen</button>} />}
      {d && (
        <>
          <dl className="audit-detail">
            <div className="audit-detail-row"><dt>Familieejer</dt><dd>{d.owner ? (d.owner.name || d.owner.email) : "Ejer ikke fundet"}</dd></div>
          </dl>
          <div className="fam-sub">Familiemedlemmer ({d.members.length})</div>
          {d.members.length === 0 ? <div className="fam-empty">Ingen familiemedlemmer knyttet til familien.</div> : d.members.map((m) => (
            <div key={m.id} className="fam-line">
              <div style={{ minWidth: 0 }}>
                <div className="fam-line-title">{m.name || "Uden navn"}{m.type === "child" && m.birth_year ? ` (${new Date().getFullYear() - m.birth_year} år)` : ""}</div>
                <div className="fam-line-meta">{memberLabel(m)} · tilføjet {date(m.created_at)}</div>
              </div>
              {m.type !== "adult" && (
                <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" disabled={busy || !canAct} title={off} onClick={() => setAction({ kind: "member", id: m.id })}>Fjern profil</button>
              )}
            </div>
          ))}
          {action?.kind === "member" && <ReasonForm title="Fjern profil" text="Profilen og dens oplysninger slettes og kan ikke gendannes. Familieejeren og andre medlemmer påvirkes ikke." confirmLabel="Fjern profil" busy={busy} onCancel={() => setAction(null)} onConfirm={confirm} />}

          <div className="fam-sub">Invitationer ({d.invites.length})</div>
          {d.invites.length === 0 ? <div className="fam-empty">Ingen invitationer knyttet til familien.</div> : d.invites.map((i) => (
            <div key={i.id} className="fam-line">
              <div style={{ minWidth: 0 }}>
                <div className="fam-line-title"><StatusPill status={i.status} /> {inviteType(i)}</div>
                <div className="fam-line-meta">Oprettet {date(i.created_at)} · {statusDate(i)}{i.status === "accepted" ? ` · ${recipientText(i)}` : ""}</div>
              </div>
              {i.status === "pending" && !i.is_request && (
                <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" disabled={busy || !canAct} title={off} onClick={() => setAction({ kind: "invite", id: i.id })}>Tilbagekald</button>
              )}
            </div>
          ))}
          {action?.kind === "invite" && <ReasonForm title="Tilbagekald invitation" text="Invitationen kan ikke længere accepteres. Rækken bevares som tilbagekaldt." confirmLabel="Tilbagekald" busy={busy} onCancel={() => setAction(null)} onConfirm={confirm} />}
        </>
      )}
    </Panel>
  );
}

export default function FamilySection({ rows, total, invites, famPhase, invPhase, famError, invError, canAct, loadingMore, load, loadMore, getFamily, revokeInvite, removeMember, q = "", setQ = () => {} }) {
  const [tab, setTab] = useState("families");
  const [inviteTab, setInviteTab] = useState("all");
  const [openId, setOpenId] = useState(null);
  const [openInvite, setOpenInvite] = useState(null);
  const first = useRef(true);
  const filtersRef = useRef(null);
  const [moreRight, setMoreRight] = useState(false);

  useEffect(() => {
    if (first.current) { first.current = false; load({ q: q.trim() }); return undefined; }
    const t = setTimeout(() => load({ q: q.trim() }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bevidst: load genskabes hver gang
  }, [q]);

  // Statusrækken: den valgte fane rulles ind i billedet, og en tone i højre kant viser, at der er flere
  useEffect(() => {
    const el = filtersRef.current;
    if (!el) return undefined;
    el.querySelector("[aria-selected='true']")?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    const update = () => setMoreRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { el.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [tab, inviteTab, invPhase]);

  const openRow = openId ? rows.find((r) => r.owner_id === openId) : null;
  const famOk = famPhase === "ok";
  const invOk = invPhase === "ok";
  const famStale = famPhase === "error" && rows.length > 0; // opdatering mislykkedes: gamle oplysninger vises med tydelig markering, uden antal
  const invStale = invPhase === "error" && invites.length > 0;
  const needle = q.trim().toLowerCase();
  const visibleInvites = needle ? invites.filter((i) => `${i.inviter_name || ""} ${i.accepted_name || ""}`.toLowerCase().includes(needle)) : invites;
  const shownInvites = visibleInvites.filter((i) => inviteTab === "all" || i.status === inviteTab);
  const inviteCount = (k) => (invOk ? (k === "all" ? visibleInvites.length : visibleInvites.filter((i) => i.status === k).length) : null);
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
    else if (rows.length === 0) body = <StateBox icon="users" title={needle ? "Ingen resultater" : "Ingen familier endnu."} text={needle ? "Ingen resultater matcher din søgning." : "Når nogen opretter familieprofiler, vises de her."} />;
    else body = (
      <div className="admin-card-list">
        {rows.map((r) => {
          const n = memberCount(r);
          return (
            <button key={r.owner_id} type="button" className="admin-item-card usr-row" onClick={() => setOpenId(r.owner_id)}>
              <div className="usr-row-name">{familyName(r)}</div>
              <div className="usr-row-mail">{r.email || "Ingen e-mail registreret"}</div>
              <div className="usr-row-meta">{n} {n === 1 ? "familiemedlem" : "familiemedlemmer"}{r.pending_invites > 0 ? ` · ${r.pending_invites} ${r.pending_invites === 1 ? "invitation afventer" : "invitationer afventer"}` : ""}</div>
              <span className="audit-card-chev" aria-hidden="true"><Icon name="chevronRight" size={16} color="var(--muted2)" /></span>
            </button>
          );
        })}
      </div>
    );
  } else if (!invOk && !invStale) body = invPhase === "error" ? errorBox(invError) : loadingBox;
  else if (invites.length === 0) body = <StateBox icon="mail" title="Ingen invitationer endnu." text="Når nogen inviterer et familiemedlem, vises invitationen her." />;
  else if (shownInvites.length === 0) body = <StateBox icon="mail" title={needle ? "Ingen resultater" : "Ingen invitationer"} text={needle ? "Ingen resultater matcher din søgning." : "Der er ingen invitationer med den valgte status."} />;
  else body = (
    <div className="admin-card-list">
      {shownInvites.map((i) => {
        const rec = recipientText(i);
        return (
          <button key={i.id} type="button" className="admin-item-card usr-row" onClick={() => setOpenInvite(i)}>
            <div className="usr-row-name"><StatusPill status={i.status} /> {inviteType(i)}</div>
            <div className="usr-row-mail">Fra {i.inviter_name || "ukendt bruger"}{rec ? ` · ${rec}` : ""}</div>
            <div className="usr-row-meta">Oprettet {date(i.created_at)} · {statusDate(i)}</div>
            <span className="audit-card-chev" aria-hidden="true"><Icon name="chevronRight" size={16} color="var(--muted2)" /></span>
          </button>
        );
      })}
    </div>
  );

  const stale = tab === "families" ? famStale : invStale;
  return (
    <>
      <div className="audit-head"><div className="audit-intro">Administrer familier, medlemmer og invitationer.</div></div>
      <div className="admin-tabs usr-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "families"} className={`admin-tab-btn${tab === "families" ? " active" : ""}`} onClick={() => setTab("families")}>Familier{famOk && !needle ? countText(total) : ""}</button>
        <button type="button" role="tab" aria-selected={tab === "invites"} className={`admin-tab-btn${tab === "invites" ? " active" : ""}`} onClick={() => setTab("invites")}>Invitationer{countText(inviteCount("all"))}</button>
      </div>
      {tab === "invites" && (
        <div className={`fam-filters-wrap${moreRight ? " more" : ""}`}>
          <div ref={filtersRef} className="admin-tabs usr-tabs fam-filters" role="tablist" aria-label="Status">
            {INVITE_TABS.map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={inviteTab === k} className={`admin-tab-btn${inviteTab === k ? " active" : ""}`} onClick={() => setInviteTab(k)}>{label}{countText(inviteCount(k))}</button>
            ))}
          </div>
        </div>
      )}
      {tab === "families" && famOk && (
        <div className="audit-results"><span aria-live="polite">{(total ?? rows.length).toLocaleString("da-DK")} {(total ?? rows.length) === 1 ? "familie" : "familier"}</span></div>
      )}
      {needle && (
        <button type="button" className="audit-search-chip" aria-label={`Søgning: ${q}. Fjern søgningen`} onClick={() => setQ("")}>
          <Icon name="search" size={13} color="var(--green)" /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>“{q.trim()}”</span><Icon name="x" size={13} color="var(--green)" />
        </button>
      )}
      {!canAct && (famOk || invOk) && (
        <div className="np-note fam-off">Administrative ændringer er midlertidigt utilgængelige.
          <Disclosure title="Hvorfor?">Tilbagekald og fjernelse af profiler kræver den seneste databaseopdatering, som endnu ikke er udgivet. Oplysningerne vises skrivebeskyttet, og intet kan ændres ved en fejl.</Disclosure>
        </div>
      )}
      {stale && <div className="todo-confirm" role="alert" style={{ marginBottom: 10 }}>Kunne ikke opdatere. Viser seneste hentede oplysninger. {retry}</div>}
      {body}
      {tab === "families" && famOk && rows.length > 0 && canAct && total !== null && rows.length < total && (
        <div style={{ textAlign: "center", margin: "14px 0" }}>
          <button type="button" className="admin-btn admin-btn-ghost admin-touch" disabled={loadingMore} onClick={loadMore}>{loadingMore ? "Henter…" : `Vis flere (${rows.length} af ${total})`}</button>
        </div>
      )}
      {openRow && <FamilyDetail row={openRow} canAct={canAct} getFamily={getFamily} revokeInvite={revokeInvite} removeMember={removeMember} onClose={() => setOpenId(null)} onChanged={() => load({ q: q.trim() })} />}
      {openInvite && <InviteDetail invite={invites.find((i) => i.id === openInvite.id) || openInvite} canAct={canAct} revokeInvite={revokeInvite} onClose={() => setOpenInvite(null)} onChanged={() => load({ q: q.trim() })} />}
    </>
  );
}
