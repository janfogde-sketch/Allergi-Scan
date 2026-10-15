// @ts-nocheck
// Aktivitetslog: hvem har ændret noget følsomt, og hvornår. Kort på mobil, tabel på desktop; søgning og filtre kører på serveren,
// og loggen hentes 50 ad gangen ("Vis flere"). Se useAuditLog.js og auditLogic.js.
import React, { useState, useEffect, useRef } from "react";
import { Icon } from "../../SharedComponents.jsx";
import RefreshButton from "../RefreshButton.jsx";
import { useIsMobile } from "../useIsMobile.js";
import {
  AUDIT_TYPES, AUDIT_CATEGORIES, AUDIT_PERIODS, auditActionLabel, auditActionType, auditChangeText, auditActorText, auditTargetText, auditSummary,
  auditCategory, auditFilterCount, fmtAuditDateTime, shortId,
} from "../auditLogic.js";

const EMPTY = { type: "", category: "", period: "all", q: "" };

function TypePill({ action }) {
  const t = AUDIT_TYPES[auditActionType(action)];
  return <span className={`admin-pill ${t.pill}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name={t.icon} size={12} />{t.label}</span>;
}

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

function Detail({ row, names, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const change = auditChangeText(row);
  const fields = row.details && Array.isArray(row.details.felter) && row.details.felter.length > 0;
  const item = (label, value) => value ? <div className="audit-detail-row"><dt>{label}</dt><dd>{value}</dd></div> : null;
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" role="dialog" aria-modal="true" aria-label="Detaljer om aktivitet" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{auditActionLabel(row.action)}</div>
            <div style={{ marginTop: 6 }}><TypePill action={row.action} /></div>
          </div>
          <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={onClose} aria-label="Luk">Luk</button>
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 13.5 }}>{auditSummary(row, names)}</p>
        <dl className="audit-detail">
          {item("Tidspunkt", fmtAuditDateTime(row.created_at, true))}
          {item("Udført af", `${auditActorText(row, names.users)}${row.admin_id ? ` (id ${shortId(row.admin_id)})` : ""}`)}
          {item("Kategori", auditCategory(row.action))}
          {item("Berørt", auditTargetText(row, names))}
          {item(fields ? "Berørte felter" : "Ændring", change.replace(/^Felter: /, "")) }
          {item("Log-id", String(row.id))}
        </dl>
        {!change && <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Der er ikke logget flere oplysninger om denne handling.</div>}
        {fields && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>Loggen gemmer kun, hvilke felter der blev ændret, ikke de enkelte værdier.</div>}
      </div>
    </div>
  );
}

export default function AuditLogSection({ rows, names, loading, loadingMore, hasMore, loaded, error, load, loadMore }) {
  const isMobile = useIsMobile();
  const [f, setF] = useState(EMPTY);
  const [q, setQ] = useState(""); // søgeordet, der er sendt til serveren (udskudt, mens man skriver)
  const [showFilters, setShowFilters] = useState(false);
  const [open, setOpen] = useState(null);
  const searchRef = useRef(null);
  const first = useRef(true);

  // Søgeordet sendes først, når der er holdt en kort pause i skrivningen
  useEffect(() => {
    const t = setTimeout(() => setQ(f.q), first.current ? 0 : 350);
    return () => clearTimeout(t);
  }, [f.q]);
  // Første indlæsning og hver ændring af filtre eller søgning henter forfra fra serveren
  useEffect(() => {
    first.current = false;
    load({ type: f.type, category: f.category, period: f.period, q });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bevidst: load genskabes hver gang og må ikke udløse nye hent
  }, [f.type, f.category, f.period, q]);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const filterCount = auditFilterCount(f);
  const filtered = filterCount > 0 || f.q.trim() !== "";
  const reset = () => setF(EMPTY);
  const refresh = () => load({ type: f.type, category: f.category, period: f.period, q });
  const openRow = open ? rows.find((r) => r.id === open) : null;

  let body;
  if (error && (rows.length === 0 || error.denied)) {
    body = error.denied
      ? <StateBox role="alert" icon="shield" title="Ingen adgang" text="Du har ikke adgang til aktivitetsloggen. Log ind med en administratorkonto." />
      : <StateBox role="alert" icon="warning" title="Aktivitetsloggen kunne ikke hentes" text="Tjek forbindelsen, og prøv igen."
          action={<button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={refresh}>Prøv igen</button>} />;
  } else if (loading && rows.length === 0) {
    body = <div className="admin-loading-row"><div className="admin-spinner" /> Henter…</div>;
  } else if (!loaded) {
    body = null;
  } else if (rows.length === 0) {
    body = filtered
      ? <StateBox icon="search" title="Ingen matchende aktiviteter" text="Prøv at ændre din søgning eller dine filtre."
          action={<button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={reset}>Nulstil</button>} />
      : <StateBox icon="clock" title="Ingen aktiviteter endnu" text="Når der foretages ændringer i systemet, vises de her." />;
  } else if (isMobile) {
    body = (
      <div className="admin-card-list">
        {rows.map((r) => (
          <button key={r.id} type="button" className="admin-item-card audit-card" onClick={() => setOpen(r.id)}>
            <div className="audit-card-head"><TypePill action={r.action} /><span className="audit-card-title">{auditActionLabel(r.action)}</span></div>
            <div className="audit-card-text">{auditSummary(r, names)}</div>
            {auditChangeText(r) && <div className="audit-card-change">{auditChangeText(r)}</div>}
            <div className="audit-card-date">{fmtAuditDateTime(r.created_at)}</div>
          </button>
        ))}
      </div>
    );
  } else {
    body = (
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Tidspunkt</th><th>Handling</th><th>Admin</th><th>Mål</th><th>Ændring</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ cursor: "pointer" }} tabIndex={0} onClick={() => setOpen(r.id)} onKeyDown={(e) => { if (e.key === "Enter") setOpen(r.id); }}>
                <td style={{ whiteSpace: "nowrap" }}>{fmtAuditDateTime(r.created_at)}</td>
                <td><TypePill action={r.action} /> <span style={{ marginLeft: 4 }}>{auditActionLabel(r.action)}</span></td>
                <td>{auditActorText(r, names.users)}</td>
                <td>{auditTargetText(r, names)}</td>
                <td>{auditChangeText(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <div className="audit-head">
        <div className="audit-intro">Se, hvem der har foretaget ændringer i systemet, og hvornår.</div>
        <RefreshButton loading={loading} label="Opdater aktivitetslog" onClick={refresh} />
      </div>

      <div className="admin-toolbar todo-toolbar">
        <div className="todo-search">
          <span className="todo-search-icon" aria-hidden="true"><Icon name="search" size={16} color="var(--muted)" /></span>
          <input ref={searchRef} type="search" className="admin-search" value={f.q} placeholder="Søg i aktivitetsloggen…" aria-label="Søg i aktivitetsloggen" enterKeyHint="search"
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} onChange={set("q")} />
          {f.q && (
            <button type="button" className="todo-search-clear" aria-label="Ryd søgning" onClick={() => { setF((x) => ({ ...x, q: "" })); searchRef.current?.focus(); }}>
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
        <button type="button" className={`admin-btn admin-btn-sm admin-touch ${filterCount ? "admin-btn-primary" : "admin-btn-ghost"}`} aria-expanded={showFilters} onClick={() => setShowFilters((v) => !v)}>
          Filtre{filterCount ? ` (${filterCount})` : ""}
        </button>
        {filtered && <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={reset}>Nulstil</button>}
      </div>

      {showFilters && (
        <div className="admin-filter-panel">
          <div><label htmlFor="a-type">Handling</label>
            <select id="a-type" className="admin-select" value={f.type} onChange={set("type")}>
              <option value="">Alle</option>
              {Object.entries(AUDIT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select></div>
          <div><label htmlFor="a-cat">Kategori</label>
            <select id="a-cat" className="admin-select" value={f.category} onChange={set("category")}>
              <option value="">Alle</option>
              {AUDIT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select></div>
          <div><label htmlFor="a-period">Periode</label>
            <select id="a-period" className="admin-select" value={f.period} onChange={set("period")}>
              {Object.entries(AUDIT_PERIODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></div>
        </div>
      )}

      {error && !error.denied && rows.length > 0 && (
        <div className="todo-confirm" role="alert" style={{ marginBottom: 10 }}>
          Flere aktiviteter kunne ikke hentes.{" "}
          <button type="button" className="todo-link-btn" style={{ minHeight: 32, textDecoration: "underline" }} onClick={loadMore}>Prøv igen</button>
        </div>
      )}

      {body}

      {hasMore && rows.length > 0 && !error?.denied && (
        <div style={{ textAlign: "center", margin: "4px 0 12px" }}>
          <button type="button" className="admin-btn admin-btn-ghost admin-touch" disabled={loadingMore} aria-busy={loadingMore} onClick={loadMore}>
            {loadingMore ? <><div className="admin-spinner" /> Henter…</> : "Vis flere"}
          </button>
        </div>
      )}

      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
        Loggen viser ændringer og sletninger af følsomme data samt eksporter og gemmes i 12 måneder. Den indeholder aldrig adgangskoder, e-mails eller helbredsdata.
      </div>

      {openRow && <Detail row={openRow} names={names} onClose={() => setOpen(null)} />}
    </>
  );
}
