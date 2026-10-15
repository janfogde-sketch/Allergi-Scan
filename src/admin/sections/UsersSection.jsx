// @ts-nocheck
// Brugere: kompakte, klikbare rækker (navn, e-mail, rolle og onboarding). Søgning, faner og antal kører på serveren (hele datasættet). Søgning sker fra headerens
// søgeikon (den globale søgning); en aktiv søgning vises som et mærke, der kan fjernes. Rolle, redigering og sletning ligger i detaljevisningen, aldrig i listen.
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Icon, showToast } from "../../SharedComponents.jsx";
import { useShowSpinner } from "../RefreshContext.js";
import UserDetail from "./UserDetail.jsx";
import { USER_TABS, ROLE_LABELS, onboardingStatus, usersCountText, CSV_COLUMNS } from "../usersLogic.js";

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

/** Forklarer, hvad eksporten indeholder, før den hentes: omfang, antal, felter og hvad der er udeladt. */
function ExportDialog({ count, filtered, busy, onClose, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !busy) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, busy]);
  return ReactDOM.createPortal(
    <div className="admin-modal-overlay" onClick={() => !busy && onClose()}>
      <div className="admin-modal audit-sheet-safe" role="dialog" aria-modal="true" aria-labelledby="usr-export-title" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="audit-sheet-head">
          <div style={{ minWidth: 0 }}>
            <div id="usr-export-title" className="audit-sheet-title">Eksportér brugere til CSV</div>
            <div className="audit-sheet-time">Eksporten registreres i aktivitetsloggen.</div>
          </div>
          <button type="button" className="admin-iconbtn audit-sheet-close" onClick={onClose} disabled={busy} aria-label="Luk"><Icon name="x" size={20} color="var(--ink2)" /></button>
        </div>
        <dl className="audit-detail">
          <div className="audit-detail-row"><dt>Brugere</dt><dd>{count === null ? "Antal ukendt" : count.toLocaleString("da-DK")} {filtered ? "(kun dem, der matcher fane og søgning)" : "(alle brugere)"}</dd></div>
          <div className="audit-detail-row"><dt>Felter</dt><dd>{CSV_COLUMNS.map((c) => c.label).join(", ")}</dd></div>
          <div className="audit-detail-row"><dt>Udeladt</dt><dd>Allergier og andre helbredsoplysninger, fødselsår og bruger-id</dd></div>
        </dl>
        <div className="err-actions">
          <button type="button" className="admin-btn admin-btn-ghost admin-touch" disabled={busy} onClick={onClose}>Annuller</button>
          <button type="button" className="admin-btn admin-btn-primary admin-touch" disabled={busy} onClick={onConfirm}>{busy ? "Eksporterer…" : "Eksportér CSV"}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function UsersSection({ rows, total, counts, loading, loadingMore, hasMore, loaded, error, load, loadMore, getUser, saveProfile, setRole, deleteSummary, deleteUser, exportUsers, userSearch, setUserSearch, currentUserId }) {
  const showSpinner = useShowSpinner(loading, rows.length > 0);
  const [tab, setTab] = useState("all");
  const [openId, setOpenId] = useState(null);
  const [exporting, setExporting] = useState(null); // null | "confirm" | "busy"
  const q = userSearch.trim();
  const first = useRef(true);

  useEffect(() => {
    first.current = false;
    load({ filter: tab, q });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bevidst: load genskabes hver gang og må ikke udløse nye hent
  }, [tab, q]);

  const reset = () => { setUserSearch(""); setTab("all"); };
  const openRow = openId ? rows.find((r) => r.id === openId) || { id: openId } : null;
  const countText = usersCountText(loaded ? rows.length === 0 ? 0 : total : null, counts.all);
  const filtered = tab !== "all" || !!q;
  const doExport = async () => {
    setExporting("busy");
    const res = await exportUsers();
    setExporting(null);
    if (res.ok) showToast(`${res.count.toLocaleString("da-DK")} brugere eksporteret`, "success");
    else showToast("Eksporten mislykkedes. Prøv igen.", "error");
  };

  let body;
  if (error && (rows.length === 0 || error.denied)) {
    body = error.denied
      ? <StateBox role="alert" icon="shield" title="Ingen adgang" text="Du har ikke adgang til brugerne. Log ind med en administratorkonto." />
      : <StateBox role="alert" icon="warning" title="Brugerne kunne ikke hentes" text="Det betyder ikke, at der ingen brugere er. Tjek forbindelsen, og prøv igen."
          action={<button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => load({ filter: tab, q })}>Prøv igen</button>} />;
  } else if (showSpinner || (loading && rows.length === 0)) {
    body = <div className="admin-loading-row"><div className="admin-spinner" /> Henter brugere…</div>;
  } else if (!loaded) {
    body = null;
  } else if (rows.length === 0) {
    body = filtered
      ? <StateBox icon="search" title="Ingen matchende brugere" text="Prøv at ændre søgningen eller fanen." action={<button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={reset}>Nulstil</button>} />
      : <StateBox icon="users" title="Ingen brugere endnu" text="Når nogen opretter en konto, vises den her." />;
  } else {
    body = (
      <div className="admin-card-list">
        {rows.map((u) => {
          const st = onboardingStatus(u);
          return (
            <button key={u.id} type="button" className="admin-item-card usr-row" onClick={() => setOpenId(u.id)}>
              <div className="usr-row-name">{u.name || "Uden navn"}{u.id === currentUserId && <span className="admin-pill admin-pill-green">Dig</span>}</div>
              <div className="usr-row-mail">{u.email || "Ingen e-mail"}</div>
              <div className="usr-row-meta">{ROLE_LABELS[u.role || "user"]} · <span className={st.key === "done" ? "" : "usr-warn"}>{st.label}</span></div>
              <span className="audit-card-chev" aria-hidden="true"><Icon name="chevronRight" size={16} color="var(--muted2)" /></span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <div className="audit-head"><div className="audit-intro">Find brugere, se kontooplysninger og administrér adgang.</div></div>
      <div className="admin-tabs usr-tabs" role="tablist">
        {USER_TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={`admin-tab-btn${tab === k ? " active" : ""}`} onClick={() => setTab(k)}>
            {label}{counts[k] !== null && counts[k] !== undefined ? ` (${counts[k].toLocaleString("da-DK")})` : ""}
          </button>
        ))}
      </div>

      {q && (
        <button type="button" className="audit-search-chip" aria-label={`Søgning: ${q}. Fjern søgningen`} onClick={() => setUserSearch("")}>
          <Icon name="search" size={13} color="var(--green)" /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>“{q}”</span><Icon name="x" size={13} color="var(--green)" />
        </button>
      )}

      {loaded && !error?.denied && (
        <div className="audit-results">
          <span aria-live="polite">{countText}</span>
          <button type="button" className="todo-link-btn usr-export" disabled={!rows.length} onClick={() => setExporting("confirm")}>Eksportér CSV</button>
        </div>
      )}

      {error && !error.denied && rows.length > 0 && (
        <div className="todo-confirm" role="alert" style={{ marginBottom: 10 }}>Flere brugere kunne ikke hentes. <button type="button" className="todo-link-btn" style={{ minHeight: 32, textDecoration: "underline" }} onClick={loadMore}>Prøv igen</button></div>
      )}

      {body}

      {hasMore && rows.length > 0 && !error?.denied && (
        <div style={{ textAlign: "center", margin: "4px 0 12px" }}>
          <button type="button" className="admin-btn admin-btn-ghost admin-touch" disabled={loadingMore} aria-busy={loadingMore} onClick={loadMore}>
            {loadingMore ? <><div className="admin-spinner" /> Henter…</> : "Vis flere"}
          </button>
        </div>
      )}

      {openRow && (
        <UserDetail row={openRow} currentUserId={currentUserId} getUser={getUser} saveProfile={saveProfile} setRole={setRole} deleteSummary={deleteSummary} deleteUser={deleteUser}
          onClose={() => setOpenId(null)} onDeleted={() => setOpenId(null)} />
      )}
      {exporting && <ExportDialog count={total} filtered={filtered} busy={exporting === "busy"} onClose={() => setExporting(null)} onConfirm={doExport} />}
    </>
  );
}
