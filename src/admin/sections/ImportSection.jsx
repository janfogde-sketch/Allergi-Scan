// @ts-nocheck
// Dataimport: overblik, produktimport fra Open Food Facts, genanalyse af allergener og seneste kørsler. Alle tal kommer fra kørselsloggen og databasen; manglende tal vises som "–".
// Begge kørselstyper bruger samme kort (titel og status øverst, tal, fuldbredde handling nederst). Tekniske oplysninger er foldet væk.
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { Icon } from "../../SharedComponents.jsx";
import Disclosure from "../Disclosure.jsx";
import CloseX from "../CloseX.jsx";
import {
  JOBS, MANUAL_REANALYZE_LIMIT, IMPORT_LIMIT, RUN_STATUS_LABEL, RUN_STATUS_PILL, TRIGGER_LABEL,
  jobStatus, countTiles, nextRun, fmtLocal, fmtLocalFull, durationSec, errorText, runSummary,
} from "../importLogic.js";

const Pill = ({ status }) => <span className={`admin-pill ${RUN_STATUS_PILL[status] || "admin-pill-neutral"}`}>{RUN_STATUS_LABEL[status] || status}</span>;
const num = (v) => (v === null || v === undefined ? "–" : Number(v).toLocaleString("da-DK"));

function Tiles({ tiles }) {
  return (
    <div className="di-tiles">
      {tiles.map(([label, v]) => (
        <div key={label} className="di-tile"><div className="di-tile-num">{num(v)}</div><div className="di-tile-label">{label}</div></div>
      ))}
    </div>
  );
}

function RunSheet({ run, onClose }) {
  useEffect(() => { const k = (e) => { if (e.key === "Escape") onClose(); }; document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [onClose]);
  const dur = durationSec(run);
  return ReactDOM.createPortal(
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal todo-panel pe-panel" role="dialog" aria-modal="true" aria-label="Kørsel" onClick={(e) => e.stopPropagation()}>
        <div className="todo-panel-head">
          <div style={{ minWidth: 0 }}>
            <div className="audit-sheet-title">{JOBS[run.job]?.label || run.job}</div>
            <div className="audit-sheet-time">{fmtLocalFull(run.started_at)}</div>
          </div>
          <CloseX onClick={onClose} />
        </div>
        <div className="todo-panel-body">
          <dl className="audit-detail">
            <div className="audit-detail-row"><dt>Resultat</dt><dd><Pill status={run.status} /></dd></div>
            <div className="audit-detail-row"><dt>Metode</dt><dd>{TRIGGER_LABEL[run.trigger] || run.trigger}</dd></div>
            {dur !== null && <div className="audit-detail-row"><dt>Varighed</dt><dd>{dur} sek.</dd></div>}
          </dl>
          {run.error_code && <div className="pe-notice pe-red" role="alert">{errorText(run.error_code)}</div>}
          {run.status === "partial" && <div className="pe-notice pe-amber">Kørslen blev kun delvist gennemført. Fejlede produkter tages igen ved næste kørsel.</div>}
          <Tiles tiles={countTiles(run.job, run.counts)} />
          {Array.isArray(run.log) && run.log.length > 0 && (
            <Disclosure title={`Kørselslinjer (${run.log.length})`}>
              <ul className="di-log">{run.log.map((l, i) => <li key={i}>{l}</li>)}</ul>
            </Disclosure>
          )}
          <Disclosure title="Tekniske oplysninger">
            <dl className="audit-detail">
              <div className="audit-detail-row"><dt>Kørsels-id</dt><dd className="np-mono">{run.id}</dd></div>
              <div className="audit-detail-row"><dt>Fejlkode</dt><dd className="np-mono">{run.error_code || "–"}</dd></div>
              <div className="audit-detail-row"><dt>Funktion</dt><dd className="np-mono">{JOBS[run.job]?.fn}</dd></div>
            </dl>
          </Disclosure>
        </div>
      </div>
    </div>,
    document.body
  );
}

function JobCard({ job, runs, imp, children, buttonText, runningText, onRun, hint }) {
  const { last, status } = jobStatus(runs, job);
  const running = imp.starting[job] || status === "running";
  const shown = imp.starting[job] ? "running" : status;
  const next = nextRun(JOBS[job].hourUtc);
  const note = imp.notice[job];
  return (
    <section className="admin-card di-card" aria-label={JOBS[job].label}>
      <div className="di-head">
        <h2 className="di-title">{JOBS[job].label}</h2>
        <Pill status={shown} />
      </div>
      <div className="di-sub">
        {last ? <>Seneste kørsel {fmtLocal(last.started_at)} · {TRIGGER_LABEL[last.trigger]} · {runSummary(last)}</> : "Ingen kørsler registreret endnu."}
        <br />Næste automatiske kørsel: {fmtLocal(next)}
      </div>
      {children}
      {last && <Tiles tiles={countTiles(job, last.counts)} />}
      {note && <div className={`pe-notice ${note.tone === "ok" ? "" : note.tone === "warn" ? "pe-amber" : "pe-red"}`} role={note.tone === "error" ? "alert" : "status"}>{note.text}</div>}
      <button type="button" className="admin-btn admin-btn-primary admin-touch di-run" disabled={running} onClick={onRun}>{running ? runningText : buttonText}</button>
      {hint && <div className="usr-hint">{hint}</div>}
    </section>
  );
}

export default function ImportSection({ imp }) {
  const [open, setOpen] = useState(null);
  const o = imp.overview;
  const openRun = open ? imp.runs.find((r) => r.id === open) : null;
  const lastImport = jobStatus(imp.runs, "off_import").last;
  const lastRe = jobStatus(imp.runs, "reanalyze").last;
  const failedRecent = imp.runs.filter((r) => r.status === "failed" || r.status === "partial").slice(0, 3).length;

  if (imp.error && imp.runs.length === 0) {
    return (
      <div className="admin-table-empty audit-state" role="alert">
        <div className="audit-state-icon" aria-hidden="true"><Icon name="warning" size={22} color="var(--muted)" /></div>
        <div className="audit-state-title">{imp.error.unavailable ? "Kørselsloggen er endnu ikke tilgængelig" : "Kunne ikke hente kørsler"}</div>
        <div>{imp.error.unavailable ? "Den kræver den seneste databaseopdatering. Importen og genanalysen kører stadig som normalt." : "Tjek forbindelsen, og prøv igen. Det betyder ikke, at der ingen kørsler har været."}</div>
        <div style={{ marginTop: 12 }}><button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={imp.load}>Prøv igen</button></div>
      </div>
    );
  }

  return (
    <>
      <section className="admin-card di-card" aria-label="Overblik">
        <h2 className="di-title">Overblik</h2>
        <Tiles tiles={[
          ["Afventer import", o ? Number(o.pending_eans) : null],
          ["Afventer genanalyse", o ? Number(o.pending_reanalyze) : null],
          ["Importeret ved seneste kørsel", lastImport && lastImport.status !== "running" ? lastImport.counts?.imported ?? null : null],
          ["Genanalyseret ved seneste kørsel", lastRe && lastRe.status !== "running" ? lastRe.counts?.reparsed ?? null : null],
          ["Kørsler med fejl (seneste)", imp.runs.length ? failedRecent : null],
          ["Til manuel gennemgang", null],
        ]} />
        <div className="usr-hint">"–" betyder, at tallet ikke registreres. Der findes endnu ingen kø til manuel gennemgang af allergenændringer; ændringer sker kun opad (nej → spor → ja) og aldrig for håndrettede produkter.</div>
      </section>

      <JobCard job="off_import" runs={imp.runs} imp={imp} buttonText="Kør import" runningText="Importerer…" onRun={() => imp.run("off_import")}
        hint={`Slår op til ${IMPORT_LIMIT} manglende stregkoder pr. kørsel op hos Open Food Facts. Fundet og importeret er to forskellige tal. Importerede produkter står som ikke verificeret med kilden Open Food Facts.`}>
        {o && Number(o.pending_eans) === 0 && <div className="pe-notice">Der er ingen kvalificerede manglende stregkoder lige nu (koder, der ikke findes hos Open Food Facts, slås først op igen efter 30 dage).</div>}
      </JobCard>

      <JobCard job="reanalyze" runs={imp.runs} imp={imp} buttonText="Kør genanalyse" runningText="Genanalyserer…" onRun={() => imp.run("reanalyze")}
        hint={`Gennemgår ingredienslister med allergenmotoren (og AI ved behov), hvor kvaliteten er lav. Højst ${MANUAL_REANALYZE_LIMIT} produkter pr. manuel kørsel. Manglende dokumentation er altid ukendt, og allergener kan kun hæves, aldrig sænkes.`}>
        {o && <div className="di-sub" style={{ marginTop: 0 }}>Afventer: {num(Number(o.pending_reanalyze))} produkter (lav kvalitet) · {num(Number(o.pending_reanalyze_manual))} inkl. middel ved manuel kørsel</div>}
      </JobCard>

      <section className="admin-card di-card" aria-label="Seneste kørsler">
        <h2 className="di-title">Seneste kørsler</h2>
        {imp.runs.length === 0 ? <div className="di-sub">Ingen kørsler registreret endnu. Natkørsler vises her fra næste kørsel efter udgivelsen.</div> : (
          <div className="admin-card-list">
            {imp.runs.slice(0, 15).map((r) => (
              <button key={r.id} type="button" className="admin-item-card usr-row" onClick={() => setOpen(r.id)}>
                <div className="usr-row-name">{JOBS[r.job]?.label || r.job}</div>
                <div className="usr-row-mail">{fmtLocal(r.started_at)} · {TRIGGER_LABEL[r.trigger] || r.trigger} · {runSummary(r)}</div>
                <div className="usr-row-meta"><Pill status={r.status} /></div>
                <span className="audit-card-chev" aria-hidden="true"><Icon name="chevronRight" size={16} color="var(--muted2)" /></span>
              </button>
            ))}
          </div>
        )}
      </section>

      <Disclosure title="Tekniske oplysninger">
        <dl className="audit-detail">
          <div className="audit-detail-row"><dt>Import</dt><dd>Hver nat kl. 02:00 UTC (dansk tid: {fmtLocal(nextRun(2)).split(",").pop()}) via funktionen auto-import-off</dd></div>
          <div className="audit-detail-row"><dt>Genanalyse</dt><dd>Hver nat kl. 03:00 UTC via auto-reparse; lange ingredienslister tages løbende i små dele</dd></div>
          <div className="audit-detail-row"><dt>Analysemetode</dt><dd>Nøgleordsmotor og AI-modellen Claude Haiku (ved behov)</dd></div>
          <div className="audit-detail-row"><dt>Datakilde</dt><dd>Open Food Facts (ODbL; kilden angives ved produkter og billeder)</dd></div>
        </dl>
      </Disclosure>

      {openRun && <RunSheet run={openRun} onClose={() => setOpen(null)} />}
    </>
  );
}
