// @ts-nocheck
// Aktivitetslog: hvem har ændret noget følsomt, og hvornår. Kort på mobil, tabel på desktop; søgning og filtre (bag "Filtre") kører på serveren,
// og loggen hentes 50 ad gangen ("Vis flere"). Opdatering sker fra headerens ikon. Se useAuditLog.js og auditLogic.js.
import React, { useState, useEffect, useRef } from "react";
import { Icon, showToast } from "../../SharedComponents.jsx";
import { useIsMobile } from "../useIsMobile.js";
import Disclosure from "../Disclosure.jsx";
import {
  AUDIT_TYPES, AUDIT_CATEGORIES, AUDIT_PERIODS, auditActionLabel, auditActionType, auditChangeText, auditActorText, auditTargetText, auditTargetParts,
  auditCardParts, auditCategory, auditChanges, auditFilterCount, auditOutcome, auditReason, auditTechRows, fmtAuditDateTime,
} from "../auditLogic.js";

const EMPTY = { type: "", category: "", period: "all", from: "", to: "", q: "" };
const OUTCOME_LABELS = { ok: "Gennemført", mislykket: "Mislykkedes", afvist: "Afvist" };
const isRed = (t) => t === "deleted" || t === "failed";

/** Ikon (kun ved sletning og mislykkede handlinger) ved handlingens navn; farven er aldrig den eneste information, teksten bærer den. */
function ActionTitle({ row }) {
  const type = auditActionType(row.action, row.outcome);
  const t = AUDIT_TYPES[type];
  return <>{isRed(type) && <Icon name={t.icon} size={13} color="var(--red)" />}<span>{auditActionLabel(row.action)}</span></>;
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

const copy = (value) => {
  const done = () => showToast("Kopieret", "success");
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value).then(done).catch(() => showToast("Kunne ikke kopiere", "error"));
  else showToast("Kunne ikke kopiere", "error");
};

function Detail({ row, names, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const change = auditChangeText(row);
  const changes = auditChanges(row);
  const fields = changes.length === 0 && row.details && Array.isArray(row.details.felter) && row.details.felter.length > 0;
  const parts = auditTargetParts(row, names);
  const reason = auditReason(row);
  const tech = auditTechRows(row);
  const item = (label, value) => value ? <div className="audit-detail-row"><dt>{label}</dt><dd>{value}</dd></div> : null;
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal audit-sheet-safe" role="dialog" aria-modal="true" aria-labelledby="audit-sheet-title" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="audit-sheet-head">
          <div style={{ minWidth: 0 }}>
            <div id="audit-sheet-title" className="audit-sheet-title">{auditActionLabel(row.action)}</div>
            <div className="audit-sheet-time">{fmtAuditDateTime(row.created_at, true)}</div>
          </div>
          <button type="button" className="admin-iconbtn audit-sheet-close" onClick={onClose} aria-label="Luk"><Icon name="x" size={20} color="var(--ink2)" /></button>
        </div>
        <dl className="audit-detail">
          {item("Udført af", auditActorText(row, names.users))}
          {item("Kategori", auditCategory(row.action))}
          {auditOutcome(row) !== "ok" && item("Udfald", OUTCOME_LABELS[auditOutcome(row)] || row.outcome)}
          {item("Berørt element", parts.what || auditTargetText(row, names))}
          {changes.length === 0 && item(fields ? "Berørte felter" : "Ændring", change.replace(/^Felter: /, ""))}
          {item("Begrundelse", reason && `“${reason}”`)}
        </dl>
        {changes.length > 0 && (
          <table className="admin-table audit-changes" style={{ marginTop: 4, fontSize: 12.5 }}>
            <thead><tr><th>Felt</th><th>Før</th><th>Efter</th></tr></thead>
            <tbody>
              {changes.map((c) => (
                <tr key={c.felt}><td>{c.felt}</td><td style={{ wordBreak: "break-word" }}>{c.fra}</td><td style={{ wordBreak: "break-word" }}>{c.til}</td></tr>
              ))}
            </tbody>
          </table>
        )}
        {tech.length > 0 && (
          <Disclosure title="Tekniske oplysninger">
            <dl className="audit-tech">
              {tech.map(([label, value]) => (
                <div key={label} className="audit-tech-row">
                  <dt>{label}</dt><dd>{value}</dd>
                  <button type="button" className="audit-copy" aria-label={`Kopiér ${label}`} onClick={() => copy(value)}><Icon name="copy" size={16} color="var(--muted)" /></button>
                </div>
              ))}
            </dl>
          </Disclosure>
        )}
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
  const opened = useRef(false);

  // Søgeordet sendes først, når der er holdt en kort pause i skrivningen
  useEffect(() => {
    const t = setTimeout(() => setQ(f.q), first.current ? 0 : 350);
    return () => clearTimeout(t);
  }, [f.q]);
  // Første indlæsning og hver ændring af filtre eller søgning henter forfra fra serveren
  useEffect(() => {
    first.current = false;
    load({ type: f.type, category: f.category, period: f.period, from: f.from, to: f.to, q });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bevidst: load genskabes hver gang og må ikke udløse nye hent
  }, [f.type, f.category, f.period, f.from, f.to, q]);
  // Åbnes filtrene, flyttes markøren til søgefeltet
  useEffect(() => {
    if (showFilters && opened.current) searchRef.current?.focus();
    opened.current = false;
  }, [showFilters]);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const filterCount = auditFilterCount(f) + (f.q.trim() ? 1 : 0);
  const filtered = filterCount > 0;
  const reset = () => setF(EMPTY);
  const toggleFilters = () => { if (!showFilters) opened.current = true; setShowFilters((v) => !v); };
  const openRow = open ? rows.find((r) => r.id === open) : null;
  const retry = () => load({ type: f.type, category: f.category, period: f.period, from: f.from, to: f.to, q });

  let body;
  if (error && (rows.length === 0 || error.denied)) {
    body = error.denied
      ? <StateBox role="alert" icon="shield" title="Ingen adgang" text="Du har ikke adgang til aktivitetsloggen. Log ind med en administratorkonto." />
      : <StateBox role="alert" icon="warning" title="Aktivitetsloggen kunne ikke hentes" text="Tjek forbindelsen, og prøv igen."
          action={<button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={retry}>Prøv igen</button>} />;
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
        {rows.map((r) => {
          const c = auditCardParts(r, names);
          const change = auditChangeText(r);
          return (
            <button key={r.id} type="button" className="admin-item-card audit-card" onClick={() => setOpen(r.id)}>
              <div className="audit-card-cat">{c.category}</div>
              <div className="audit-card-title"><ActionTitle row={r} /></div>
              <div className="audit-card-text">{c.by}</div>
              <div className="audit-card-text">{c.target}</div>
              {change && <div className="audit-card-change">{change}</div>}
              {auditOutcome(r) !== "ok" && <div className="audit-card-outcome">{OUTCOME_LABELS[auditOutcome(r)]}</div>}
              <div className="audit-card-date">{c.date}</div>
              <span className="audit-card-chev" aria-hidden="true"><Icon name="chevronRight" size={16} color="var(--muted2)" /></span>
            </button>
          );
        })}
      </div>
    );
  } else {
    body = (
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Tidspunkt</th><th>Kategori</th><th>Handling</th><th>Udført af</th><th>Berørt</th><th>Ændring</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ cursor: "pointer" }} tabIndex={0} onClick={() => setOpen(r.id)} onKeyDown={(e) => { if (e.key === "Enter") setOpen(r.id); }}>
                <td style={{ whiteSpace: "nowrap" }}>{fmtAuditDateTime(r.created_at)}</td>
                <td>{auditCategory(r.action)}</td>
                <td><span className="audit-card-title"><ActionTitle row={r} /></span></td>
                <td>{auditActorText(r, names.users)}</td>
                <td>{auditTargetText(r, names)}</td>
                <td>{auditChangeText(r)}{auditOutcome(r) !== "ok" && <span className="audit-card-outcome"> {OUTCOME_LABELS[auditOutcome(r)]}</span>}</td>
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
      </div>

      <div className="admin-toolbar todo-toolbar">
        <button type="button" className={`admin-btn admin-btn-sm admin-touch ${filterCount ? "admin-btn-primary" : "admin-btn-ghost"}`} aria-expanded={showFilters} onClick={toggleFilters}>
          Filtre{filterCount ? ` (${filterCount})` : ""}
        </button>
        {filtered && <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={reset}>Nulstil</button>}
      </div>

      {!showFilters && f.q.trim() && (
        <button type="button" className="audit-search-chip" aria-label={`Søgning: ${f.q}. Tryk for at ændre`} onClick={toggleFilters}>
          <Icon name="search" size={13} color="var(--green)" /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>“{f.q}”</span>
        </button>
      )}

      {showFilters && (
        <div className="admin-filter-panel audit-filter-panel">
          <div className="audit-filter-search"><label htmlFor="a-q">Søg</label>
            <div className="todo-search">
              <span className="todo-search-icon" aria-hidden="true"><Icon name="search" size={16} color="var(--muted)" /></span>
              <input id="a-q" ref={searchRef} type="search" className="admin-search" value={f.q} placeholder="Bruger, handling eller element…" enterKeyHint="search"
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} onChange={set("q")} />
              {f.q && (
                <button type="button" className="todo-search-clear" aria-label="Ryd søgning" onClick={() => { setF((x) => ({ ...x, q: "" })); searchRef.current?.focus(); }}>
                  <Icon name="x" size={16} />
                </button>
              )}
            </div></div>
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
          <div className="audit-filter-wide"><label htmlFor="a-period">Periode</label>
            <select id="a-period" className="admin-select" value={f.period} onChange={set("period")}>
              {Object.entries(AUDIT_PERIODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></div>
          {f.period === "custom" && (
            <>
              <div><label htmlFor="a-from">Fra dato</label><input id="a-from" type="date" value={f.from} max={f.to || undefined} onChange={set("from")} /></div>
              <div><label htmlFor="a-to">Til dato</label><input id="a-to" type="date" value={f.to} min={f.from || undefined} onChange={set("to")} /></div>
            </>
          )}
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

      <Disclosure title="Om aktivitetsloggen">
        <p style={{ margin: "0 0 6px" }}><strong>Registreres:</strong> når en administrator opretter, ændrer, sletter, godkender eller afviser noget følsomt (produkter, leksikon, indsendelser, tickets, roller, profiler, allergier, familie og push-tekster), kører import eller genanalyse, eksporterer data, samt afviste og mislykkede forsøg.</p>
        <p style={{ margin: "0 0 6px" }}><strong>Opbevaring:</strong> 12 måneder. Afviste og mislykkede forsøg slettes efter 90 dage.</p>
        <p style={{ margin: "0 0 6px" }}><strong>Gemmes ikke:</strong> adgangskoder, adgangsnøgler, e-mailadresser eller helbredsoplysninger. For produkter, leksikon og push-tekster gemmes før og efter (afkortet til 500 tegn); for profiler, allergier og familie kun feltnavne.</p>
        <p style={{ margin: 0 }}><strong>Begrænsning:</strong> ændringer, der foretages direkte i databasen uden en administratorlogin, registreres ikke.</p>
      </Disclosure>

      {openRow && <Detail row={openRow} names={names} onClose={() => setOpen(null)} />}
    </>
  );
}
