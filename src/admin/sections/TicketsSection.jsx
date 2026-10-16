// @ts-nocheck
// Tickets: kompakte, klikbare kort (titel, kort uddrag, kategori, status, prioritet, ansvarlig, dato), kompakte filtre (status, kategori, prioritet, ansvarlig, lanceringsblokering),
// søgning i titel og beskrivelse og sortering. Alt andet (status, prioritet, tjekliste, kommentarer, kopiér prompt) sker i detaljevisningen. Filtre huskes i sessionen.
import React, { useEffect, useState, useMemo } from "react";
import { showToast, Icon } from "../../SharedComponents.jsx";
import ActionsMenu from "../ActionsMenu.jsx";
import { statusPill } from "../statusTone.js";
import TicketDetail from "./TicketDetail.jsx";
import {
  TYPE_LABELS, STATUS_LABELS, PRIORITIES, PRIORITY_PILL, PRIORITY_LABEL, TICKET_SORTS, ticketTitleParts, effectivePriority, originLabel, isLegalCandidate, progress, filterTickets, statusCounts, hasFilters,
  buildTicketPrompt, buildManyPrompts,
} from "../ticketsLogic.js";

export { ticketTitleParts };
const FILTER_KEY = "eatsafe.ticketFilters";
const DEFAULTS = { category: "", priority: "", assignee: "", blocking: false, q: "", sort: "newest" };
const readFilters = () => { try { return { ...DEFAULTS, ...JSON.parse(sessionStorage.getItem(FILTER_KEY) || "{}") }; } catch { return DEFAULTS; } };
const needsDone = (tab) => tab === "resolved" || tab === "all";
const dateShort = (v) => new Date(v).toLocaleDateString("da-DK", { timeZone: "Europe/Copenhagen" });

export default function TicketsSection({ adminTickets, ticketsHasMore, ticketsLoading, adminTicketFilter, setAdminTicketFilter, ticketsIncludeDone, loadTickets, openTicket, setOpenTicket, updateTicketStatus, getTicketScreenshotUrl, work }) {
  const [f, setF] = useState(readFilters);
  const setFilter = (p) => setF((s) => { const n = { ...s, ...p }; try { sessionStorage.setItem(FILTER_KEY, JSON.stringify(n)); } catch { /* ingen lagring: filtrene gælder kun nu */ } return n; });
  const counts = useMemo(() => statusCounts(adminTickets), [adminTickets]);
  const ctx = { meta: work.meta, todos: work.todos };
  const tab = adminTicketFilter;
  const list = useMemo(() => filterTickets(adminTickets, { ...f, tab }, ctx), [adminTickets, f, tab, work.meta, work.todos]); // eslint-disable-line react-hooks/exhaustive-deps -- ctx følger work.meta/todos
  const filtered = hasFilters({ ...f, status: ["open", "in_progress", "resolved"].includes(tab) ? tab : "" });

  useEffect(() => {
    if (needsDone(tab) && !ticketsIncludeDone) loadTickets({ includeDone: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bevidst: henter kun, når fanen kræver færdige tickets
  }, [tab, ticketsIncludeDone]);
  useEffect(() => { work.load(); /* eslint-disable-next-line react-hooks/exhaustive-deps -- ét hent ved åbning */ }, []);

  const copyOne = (t) => {
    const text = buildTicketPrompt(t, { priority: effectivePriority(t, work.meta[t.id]), launchBlocking: !!work.meta[t.id]?.launch_blocking, tasks: work.tasks[t.id] });
    (navigator.clipboard?.writeText(text) || Promise.reject(new Error("Udklipsholderen er ikke tilgængelig")))
      .then(() => showToast("Prompt kopieret", "success")).catch((e) => showToast("Kunne ikke kopiere: " + e.message, "error"));
  };
  const manyText = () => buildManyPrompts(adminTickets.filter((t) => t.status === "open").map((ticket) => ({ ticket, extra: { priority: effectivePriority(ticket, work.meta[ticket.id]), launchBlocking: !!work.meta[ticket.id]?.launch_blocking, tasks: work.tasks[ticket.id] } })));
  const copyMany = () => { (navigator.clipboard?.writeText(manyText()) || Promise.reject(new Error("Udklipsholderen er ikke tilgængelig")))
    .then(() => showToast(`${counts.open} prompts kopieret`, "success")).catch((e) => showToast("Kunne ikke kopiere: " + e.message, "error")); };
  const download = () => {
    const blob = new Blob([manyText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `eatsafe-tickets-open-${new Date().toISOString().slice(0, 10)}.txt`; a.click(); URL.revokeObjectURL(url);
    showToast("Eksport gennemført", "success");
  };
  const changeStatus = (t, status, note) => updateTicketStatus(t.id, status, note);
  const reset = () => { setFilter({ ...DEFAULTS, sort: f.sort }); setAdminTicketFilter("active"); };

  let body;
  if (ticketsLoading && adminTickets.length === 0) body = <div className="admin-loading-row"><div className="admin-spinner" /> Henter tickets…</div>;
  else if (list.length === 0) {
    body = (
      <div className="admin-table-empty audit-state mi-empty">
        <div className="audit-state-icon" aria-hidden="true"><Icon name="search" size={22} color="var(--muted)" /></div>
        <div className="audit-state-title">{filtered ? "Ingen tickets matcher" : "Ingen tickets her"}</div>
        <div>{filtered ? "Prøv at ændre søgningen eller filtrene." : "Der er ingen tickets i denne visning."}</div>
        {filtered && <div style={{ marginTop: 12 }}><button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={reset}>Nulstil</button></div>}
      </div>
    );
  } else {
    body = (
      <div className="admin-card-list">
        {list.map((t) => {
          const { title, excerpt } = ticketTitleParts(t.description);
          const meta = work.meta[t.id]; const pr = effectivePriority(t, meta); const todo = work.todos[t.id];
          const prog = progress(work.tasks[t.id] || []);
          return (
            <button key={t.id} type="button" className="admin-item-card usr-row tk-card" onClick={() => setOpenTicket(t)}>
              <div className="usr-row-name tk-title">{title}</div>
              {excerpt && <div className="admin-item-excerpt tk-excerpt">{excerpt}</div>}
              <div className="admin-item-pills">
                <span className="admin-pill admin-pill-neutral">{TYPE_LABELS[t.type] || t.type}</span>
                <span className={`admin-pill ${statusPill(t.status)}`}>{STATUS_LABELS[t.status] || t.status}</span>
                {pr !== "normal" && <span className={`admin-pill ${PRIORITY_PILL[pr]}`}>{PRIORITY_LABEL[pr]}</span>}
                {meta?.launch_blocking && <span className="admin-pill admin-pill-red">Lanceringsblokerende</span>}
                {!meta?.launch_blocking && isLegalCandidate(t) && <span className="admin-pill admin-pill-amber">Mulig lanceringsblokering</span>}
              </div>
              <div className="usr-row-meta">
                {originLabel(t)} · {todo?.assignee_id ? work.nameOf(todo.assignee_id) : "Ikke tildelt"} · {dateShort(t.created_at)}{prog.total ? ` · ${prog.done}/${prog.total}` : ""}
              </div>
              <span className="audit-card-chev" aria-hidden="true"><Icon name="chevronRight" size={16} color="var(--muted2)" /></span>
            </button>
          );
        })}
      </div>
    );
  }

  const tabBtn = (id, label, n) => <button key={id} type="button" className={`admin-tab-btn${tab === id ? " active" : ""}`} aria-pressed={tab === id} onClick={() => setAdminTicketFilter(id)}>{label} ({n})</button>;

  return (
    <>
      <div className="tk-top">
        <div className="admin-tabs" style={{ marginBottom: 0, border: "none", flex: "1 1 auto", minWidth: 0 }}>
          {tabBtn("active", "Aktive", counts.active)}
          {tabBtn("all", "Alle", ticketsIncludeDone ? counts.all : "…")}
        </div>
        <ActionsMenu items={[
          counts.open > 0 && { label: `Kopiér åbne som prompts (${counts.open})`, hint: "Alle åbne tickets, tydeligt adskilt", onClick: copyMany },
          counts.open > 0 && { label: `Download åbne + prompts (${counts.open})`, hint: "Én tekstfil med alle åbne tickets", onClick: download },
        ]} />
      </div>

      <div className="prd-search">
        <label htmlFor="tk-q" className="np-vars-label">Søg i titel og beskrivelse</label>
        <div className="prd-search-row">
          <input id="tk-q" type="search" enterKeyHint="search" autoComplete="off" className="admin-search" placeholder="Fx menu eller crash" value={f.q} onChange={(e) => setFilter({ q: e.target.value })} />
          {f.q && <button type="button" className="admin-iconbtn" aria-label="Ryd søgning" onClick={() => setFilter({ q: "" })}><Icon name="x" size={18} color="var(--ink2)" /></button>}
        </div>
      </div>
      <div className="prd-filters tk-filters">
        <div className="admin-field"><label htmlFor="tk-fs">Status</label>
          <select id="tk-fs" className="admin-select" value={["open", "in_progress", "resolved"].includes(tab) ? tab : ""} onChange={(e) => setAdminTicketFilter(e.target.value || "active")}>
            <option value="">Aktive</option><option value="open">Åben ({counts.open})</option><option value="in_progress">I gang ({counts.in_progress})</option><option value="resolved">Løst{ticketsIncludeDone ? ` (${counts.resolved})` : ""}</option>
          </select></div>
        <div className="admin-field"><label htmlFor="tk-fc">Kategori</label>
          <select id="tk-fc" className="admin-select" value={f.category} onChange={(e) => setFilter({ category: e.target.value })}><option value="">Alle</option>{Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="admin-field"><label htmlFor="tk-fp">Prioritet</label>
          <select id="tk-fp" className="admin-select" value={f.priority} onChange={(e) => setFilter({ priority: e.target.value })}><option value="">Alle</option>{PRIORITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="admin-field"><label htmlFor="tk-fa">Ansvarlig</label>
          <select id="tk-fa" className="admin-select" value={f.assignee} onChange={(e) => setFilter({ assignee: e.target.value })}><option value="">Alle</option><option value="none">Ikke tildelt</option>{work.admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
        <div className="admin-field"><label htmlFor="tk-so">Sortér</label>
          <select id="tk-so" className="admin-select" value={f.sort} onChange={(e) => setFilter({ sort: e.target.value })}>{TICKET_SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <label className="usr-check tk-block"><input type="checkbox" checked={f.blocking} onChange={(e) => setFilter({ blocking: e.target.checked })} /><span>Kun lanceringsblokerende</span></label>
      </div>

      <div className="audit-results">
        <span aria-live="polite">{list.length} {list.length === 1 ? "ticket" : "tickets"}</span>
        <span className="prd-actions">{filtered && <button type="button" className="todo-link-btn" onClick={reset}>Nulstil</button>}</span>
      </div>
      {ticketsHasMore && !ticketsLoading && <div className="admin-info-note">Der er flere tickets end de {adminTickets.length}, der vises. Luk nogle, og opdatér listen for at se resten.</div>}
      {body}

      {openTicket && <TicketDetail ticket={openTicket} work={work} onClose={() => setOpenTicket(null)} onStatus={changeStatus} onCopy={copyOne} getTicketScreenshotUrl={getTicketScreenshotUrl} />}
    </>
  );
}
