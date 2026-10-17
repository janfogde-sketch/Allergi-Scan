// @ts-nocheck
// Tilbagekaldelser: kompakte kort i tre visninger (Afventer gennemgang, Varslet, Arkiv), status for den daglige hentning, søgning (titel, produkt, EAN/GTIN, lot) og filtre.
// En fejl eller en fejlet hentning vises aldrig som en tom liste. Hele kortet åbner detaljevisningen, hvor gennemgang, match, varsling og historik ligger.
import React, { useState, useMemo } from "react";
import { Icon } from "../../SharedComponents.jsx";
import RecallDetail from "./RecallDetail.jsx";
import { fmtLocalFull } from "../importLogic.js";
import { NEW_VIEWS, STATUS_TEXT, RECALL_STATUS_PILL, RECALL_PERIODS, viewCounts, listRecalls, recallProducts, syncStatus, SYNC_ERROR_TEXT, isRecent } from "../recallLogic.js";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("da-DK", { timeZone: "Europe/Copenhagen", day: "numeric", month: "short", year: "numeric" }) : "–");
const EMPTY = {
  needs_review: ["Intet afventer gennemgang", "Tilbagekaldelser, der kræver din handling, vises her."],
  ready: ["Ingen varslinger endnu", "Når en tilbagekaldelse er knyttet til produkter og besked er lagt i kø, vises den her."],
  archive: ["Arkivet er tomt", "Arkiverede og annullerede tilbagekaldelser vises her."],
};

function SyncBanner({ runs }) {
  const s = syncStatus(runs);
  const last = s.lastOkAt ? `Seneste vellykkede hentning: ${fmtLocalFull(s.lastOkAt)}` : "Ingen vellykket hentning registreret";
  if (s.state === "ok") return <div className="rc-sync">{last}</div>;
  const tone = s.state === "unknown" ? "pe-amber" : "pe-red";
  return (
    <div className={`pe-notice ${tone}`} role={s.state === "failed" ? "alert" : "status"}>
      <b>{s.text}.</b> {s.code ? SYNC_ERROR_TEXT[s.code] || "" : ""} {last}.
      {s.state !== "ok" && <div>En tom liste betyder ikke, at der ingen tilbagekaldelser er, når hentningen ikke kan bekræftes.</div>}
    </div>
  );
}

export default function RecallsSection({ recalls: rc }) {
  const [view, setView] = useState("needs_review");
  const [q, setQ] = useState("");
  const [days, setDays] = useState("");
  const [manual, setManual] = useState(false);
  const [openId, setOpenId] = useState(null);
  const counts = viewCounts(rc.recalls);
  const list = useMemo(() => listRecalls(rc.recalls, { view, q, days, manual }), [rc.recalls, view, q, days, manual]);
  const open = openId ? rc.recalls.find((r) => r.id === openId) : null;
  const filtered = !!(q.trim() || days || manual);
  const reset = () => { setQ(""); setDays(""); setManual(false); };

  let body;
  if (rc.error && rc.recalls.length === 0) {
    const t = rc.error === "offline" ? ["Kunne ikke hente tilbagekaldelser", "Tjek forbindelsen, og prøv igen."] : rc.error === "denied" ? ["Ingen adgang", "Din konto har ikke administratorrettighed."] : ["Kunne ikke hente tilbagekaldelser", "Det betyder ikke, at der ingen tilbagekaldelser er."];
    body = (
      <div className="admin-table-empty audit-state mi-empty" role="alert">
        <div className="audit-state-icon" aria-hidden="true"><Icon name="warning" size={22} color="var(--muted)" /></div>
        <div className="audit-state-title">{t[0]}</div><div>{t[1]}</div>
        {rc.error !== "denied" && <div style={{ marginTop: 12 }}><button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => rc.load()}>Prøv igen</button></div>}
      </div>
    );
  } else if ((rc.loading || !rc.loaded) && rc.recalls.length === 0) {
    body = <div className="admin-loading-row"><div className="admin-spinner" /> Henter tilbagekaldelser…</div>;
  } else if (list.length === 0) {
    const e = filtered ? ["Ingen tilbagekaldelser matcher", "Prøv at ændre søgningen eller filtrene."] : EMPTY[view];
    body = (
      <div className="admin-table-empty audit-state mi-empty">
        <div className="audit-state-icon" aria-hidden="true"><Icon name={filtered ? "search" : "check"} size={22} color="var(--muted)" /></div>
        <div className="audit-state-title">{e[0]}</div><div>{e[1]}</div>
        {filtered && <div style={{ marginTop: 12 }}><button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={reset}>Nulstil</button></div>}
      </div>
    );
  } else {
    body = (
      <div className="admin-card-list">
        {list.map((r) => {
          const prods = recallProducts(r).length;
          const noCode = !(r.eans || []).length;
          const unverified = (r.unverified_eans || []).length > 0;
          return (
            <button key={r.id} type="button" className="admin-item-card usr-row rc-card" onClick={() => setOpenId(r.id)}>
              <div className="usr-row-name rc-title">{r.title}</div>
              <div className="usr-row-mail rc-reason">{r.reason || r.intro || "Årsag ikke oplyst"}</div>
              <div className="admin-item-pills">
                <span className={`admin-pill ${RECALL_STATUS_PILL[r.status]}`}>{STATUS_TEXT[r.status]}</span>
                {r.status === "needs_review" && isRecent(r) && <span className="admin-pill admin-pill-blue">Ny</span>}
                {noCode ? <span className="admin-pill admin-pill-red">Mangler stregkode</span> : unverified ? <span className="admin-pill admin-pill-amber">Kræver kontrol</span> : null}
                {r.status === "ready" && !noCode && !unverified && <span className="admin-pill admin-pill-neutral">{(r.eans || []).length} {(r.eans || []).length === 1 ? "stregkode" : "stregkoder"}</span>}
              </div>
              <div className="usr-row-meta">{fmtDate(r.published_at)} · {prods} {prods === 1 ? "berørt produkt" : "berørte produkter"}{unverified ? ` · ${r.unverified_eans.length} ${r.unverified_eans.length === 1 ? "stregkode kræver" : "stregkoder kræver"} kontrol` : ""}</div>
              <span className="audit-card-chev" aria-hidden="true"><Icon name="chevronRight" size={16} color="var(--muted2)" /></span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <SyncBanner runs={rc.syncRuns} />
      <div className="rc-tabs" role="tablist" aria-label="Visning">
        {NEW_VIEWS.map(([v, l]) => (
          <button key={v} type="button" role="tab" aria-selected={view === v} className={`rc-tab${view === v ? " active" : ""}`} onClick={() => setView(v)}>
            <span>{l}</span><span className="rc-count">{counts[v]}</span>
          </button>
        ))}
      </div>
      <div className="prd-search">
        <label htmlFor="rc-q" className="np-vars-label">Søg på titel, produkt, stregkode eller lotnummer</label>
        <div className="prd-search-row">
          <input id="rc-q" type="search" enterKeyHint="search" autoComplete="off" className="admin-search" placeholder="Fx ketchup eller 5702040711032" value={q} onChange={(e) => setQ(e.target.value)} />
          {q && <button type="button" className="admin-iconbtn" aria-label="Ryd søgning" onClick={() => setQ("")}><Icon name="x" size={18} color="var(--ink2)" /></button>}
        </div>
      </div>
      <div className="prd-filters" style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>
        <div className="admin-field"><label htmlFor="rc-d">Dato</label>
          <select id="rc-d" className="admin-select" value={days} onChange={(e) => setDays(e.target.value)}>{RECALL_PERIODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <label className="usr-check rc-manual"><input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)} /><span>Kun manuel kontrol</span></label>
      </div>
      <div className="audit-results">
        <span aria-live="polite">{list.length} {list.length === 1 ? "tilbagekaldelse" : "tilbagekaldelser"}{rc.error && rc.recalls.length > 0 ? " · kunne ikke opdatere, viser seneste hentede" : ""}</span>
        <span className="prd-actions">{filtered && <button type="button" className="todo-link-btn" onClick={reset}>Nulstil</button>}</span>
      </div>
      {body}
      {open && <RecallDetail key={open.id} recall={open} onClose={() => setOpenId(null)} api={rc} />}
    </>
  );
}
