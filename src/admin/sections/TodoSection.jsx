// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { Icon } from "../../SharedComponents.jsx";
import { useIsMobile } from "../useIsMobile.js";
import TodoModal, { isHttpUrl } from "./TodoModal.jsx";
import CloseX from "../CloseX.jsx";
import {
  STATUS_LABELS, STATUS_PILL, PRIORITY_LABELS, PRIORITY_PILL, TRACK_LABELS, SORT_MODES,
  todayKey, dueInfo, sortTodos, filterTodos, activeFilterCount, countByView, viewNeedsDone, personName,
} from "../todoLogic.js";

const VIEWS = [
  { id: "open", label: "Åbne" },
  { id: "done", label: "Færdige" },
];
const UNDO_MS = 6000;

function Select({ id, value, onChange, children, label }) {
  return (
    <select id={id} className="admin-select" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      {children}
    </select>
  );
}

function TodoCard({ t, admins, today, onOpen, onToggle, onOpenTicket, showStatus = true }) {
  const due = dueInfo(t, today);
  const done = t.status === "done";
  const assignee = personName(admins, t.assignee_id);
  return (
    <div className="admin-item-card" role="button" tabIndex={0} onClick={onOpen}
      onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onOpen(); } }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <button type="button" className={`todo-check${done ? " done" : ""}`} style={{ marginTop: 1 }}
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          aria-label={done ? `Genåbn: ${t.title}` : `Markér som færdig: ${t.title}`}>{done ? "✓" : ""}</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={`admin-item-title todo-card-title${done ? " done" : ""}`} title={t.title}>{t.title}</div>
          <div className="todo-meta">
            {(showStatus || done) && <span className={`admin-pill ${STATUS_PILL[t.status]}`}>{STATUS_LABELS[t.status]}</span>}
            {!done && <span className={`admin-pill ${PRIORITY_PILL[t.priority]}`}>{PRIORITY_LABELS[t.priority]} prioritet</span>}
            <span className="admin-pill admin-pill-neutral">{TRACK_LABELS[t.track]}</span>
            {t.ticket_id && (onOpenTicket
              ? <button type="button" className="admin-pill admin-pill-neutral" style={{ cursor: "pointer", border: "none", font: "inherit", minHeight: 28 }}
                  aria-label={`Åbn ticketten bag: ${t.title}`} onClick={(e) => { e.stopPropagation(); onOpenTicket(t.ticket_id); }}>Åbn ticket</button>
              : <span className="admin-pill admin-pill-neutral">Ticket</span>)}
          </div>
          <div className="todo-meta-line">
            <strong>{assignee || "Ingen ansvarlig"}</strong>
            {due && <> · <span className={due.overdue ? "late" : undefined}>{due.overdue ? "Frist overskredet: " : "Frist: "}{due.label}</span></>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TodoSection({ onOpenTicket, preset, todos, admins, loading, loadError, load, doneLoaded, doneCount, loadDone, create, update, remove, userId, comments, commentsLoading, activity, loadComments, closeComments, addComment, deleteComment }) {
  const isMobile = useIsMobile();
  const [view, setView] = useState("open");
  const [track, setTrack] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [due, setDue] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("smart");
  const [showFilters, setShowFilters] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [undo, setUndo] = useState(null);
  const undoTimer = useRef(null);
  const chipsRef = useRef(null);
  const [chipsMore, setChipsMore] = useState(false);

  const today = todayKey();
  const counts = countByView(todos, userId, { doneCount, doneLoaded });
  const filters = { view, track, assigneeId, query, priority, status, due, admins };
  const visible = sortTodos(filterTodos(todos, filters, userId), sort, today);
  const activeFilters = activeFilterCount(filters);
  // Statusbadget udelades kun, når alle viste opgaver har standardstatussen "Skal laves"; findes flere statusser, vises den på alle
  const showStatus = visible.some((t) => t.status !== "todo");
  const openTodo = openId ? todos.find((t) => t.id === openId) : null;
  const resetFilters = () => { setTrack(""); setAssigneeId(""); setPriority(""); setStatus(""); setDue(""); };
  const resetAll = () => { resetFilters(); setQuery(""); }; // rører hverken fane eller sortering
  const searchRef = useRef(null);

  // Genvej fra Dashboard: åbner listen med et bestemt filter
  useEffect(() => {
    if (!preset) return;
    setView("open"); resetFilters(); setQuery("");
    if (preset.priority) setPriority(preset.priority);
    if (preset.due) setDue(preset.due);
    if (preset.status) setStatus(preset.status);
    if (preset.assigneeId) setAssigneeId(preset.assigneeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bevidst: kun når genvejen skifter
  }, [preset?.id]);

  // Færdige opgaver hentes først, når Færdige åbnes
  useEffect(() => {
    if (viewNeedsDone(view) && !doneLoaded) loadDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bevidst: loadDone genskabes hver gang; henter kun når visningen kræver færdige
  }, [view, doneLoaded]);

  useEffect(() => {
    if (openId) loadComments(openId); else closeComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bevidst: kommentarer hentes kun ved skift af åben opgave; loadComments/closeComments genskabes hver gang
  }, [openId]);

  // Diskret udtoning i højre side, så længe der er flere hurtigfiltre at rulle til
  const updateChipsMore = () => {
    const el = chipsRef.current;
    if (el) setChipsMore(el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
  };
  useEffect(() => {
    updateChipsMore();
    window.addEventListener("resize", updateChipsMore);
    return () => window.removeEventListener("resize", updateChipsMore);
  }, [view, todos.length]);

  // Tastaturet lukkes, når listen rulles, så det ikke dækker resultaterne
  useEffect(() => {
    const onScroll = () => { if (document.activeElement === searchRef.current) searchRef.current.blur(); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => () => clearTimeout(undoTimer.current), []);
  useEffect(() => {
    if (!showInfo) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setShowInfo(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showInfo]);

  // Markér færdig kan fortrydes i et par sekunder, så et fejltryk ikke gør skade
  const toggleDone = async (t) => {
    if (t.status === "done") { update(t.id, { status: "todo" }); return; }
    const ok = await update(t.id, { status: "done" });
    if (!ok) return;
    clearTimeout(undoTimer.current);
    setUndo({ id: t.id, title: t.title, prev: t.status });
    undoTimer.current = setTimeout(() => setUndo(null), UNDO_MS);
  };
  const undoDone = () => {
    if (!undo) return;
    update(undo.id, { status: undo.prev });
    clearTimeout(undoTimer.current);
    setUndo(null);
  };

  const chip = (label, active, onClick, count) => (
    <button type="button" className={`todo-chip${active ? " active" : ""}`} aria-pressed={active} onClick={onClick}>
      {label}{count !== undefined ? ` (${count})` : ""}
    </button>
  );
  // Tællerne på chipsene viser opgaverne i den aktive fane, før chippen (og søgning og øvrige filtre) anvendes
  const chipCount = (f) => filterTodos(todos, { view, ...f }, userId).length;
  const emptyMessage = todos.length === 0 && !viewNeedsDone(view) ? "Ingen åbne opgaver. Tryk + Ny opgave for at oprette en."
    : query.trim() && !activeFilters ? "Ingen opgaver matcher din søgning." : (activeFilters || query.trim()) ? "Ingen opgaver matcher søgningen og filtrene." : (view === "done" ? "Ingen færdige opgaver endnu." : "Ingen åbne opgaver.");

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <button type="button" className="admin-btn admin-btn-primary admin-touch" onClick={() => setCreating(true)}>+ Ny opgave</button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="button" className="admin-icon-btn" aria-label="Sådan fungerer opgaver" title="Sådan fungerer opgaver" onClick={() => setShowInfo(true)}>
            <Icon name="info" size={18} />
          </button>
        </div>
      </div>

      <div className="admin-tabs" style={{ marginBottom: 10 }}>
        {VIEWS.map((v) => (
          <button key={v.id} className={`admin-tab-btn${view === v.id ? " active" : ""}`} aria-pressed={view === v.id} onClick={() => setView(v.id)}>
            {v.label} ({counts[v.id]})
          </button>
        ))}
      </div>

      <div className="admin-toolbar todo-toolbar">
        <div className="todo-search">
          <span className="todo-search-icon" aria-hidden="true"><Icon name="search" size={16} color="var(--muted)" /></span>
          <input ref={searchRef} type="search" className="admin-search" value={query} placeholder="Søg i opgaver…" aria-label="Søg i opgaver" enterKeyHint="search"
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} onChange={(e) => setQuery(e.target.value)} />
          {query && (
            <button type="button" className="todo-search-clear" aria-label="Ryd søgning" onClick={() => { setQuery(""); searchRef.current?.focus(); }}>
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
        <Select id="todo-sort" value={sort} onChange={setSort} label="Sortering">
          {Object.entries(SORT_MODES).map(([k, v]) => <option key={k} value={k}>Sortér: {v}</option>)}
        </Select>
        <button type="button" className={`admin-btn admin-btn-sm admin-touch ${activeFilters ? "admin-btn-primary" : "admin-btn-ghost"}`} aria-expanded={showFilters} onClick={() => setShowFilters((v) => !v)}>
          Filtre{activeFilters ? ` (${activeFilters})` : ""}
        </button>
        {(activeFilters > 0 || query.trim()) && <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={resetAll}>Nulstil</button>}
      </div>

      <div ref={chipsRef} className={`todo-chips${chipsMore ? " more" : ""}`} role="group" aria-label="Hurtige filtre" onScroll={updateChipsMore}>
        {chip("Mine", !!userId && assigneeId === userId, () => setAssigneeId(assigneeId === userId ? "" : userId), chipCount({ assigneeId: userId }))}
        {chip("Uden ansvarlig", assigneeId === "none", () => setAssigneeId(assigneeId === "none" ? "" : "none"), chipCount({ assigneeId: "none" }))}
        {chip("Høj prioritet", priority === "high", () => setPriority(priority === "high" ? "" : "high"), chipCount({ priority: "high" }))}
        {chip("Overskredet frist", due === "overdue", () => setDue(due === "overdue" ? "" : "overdue"), chipCount({ due: "overdue" }))}
      </div>

      {showFilters && (
        <div className="admin-filter-panel">
          <div><label htmlFor="f-track">Spor</label>
            <Select id="f-track" value={track} onChange={setTrack} label="Filtrér på spor">
              <option value="">Alle spor</option>
              {Object.entries(TRACK_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select></div>
          <div><label htmlFor="f-assignee">Ansvarlig</label>
            <Select id="f-assignee" value={assigneeId} onChange={setAssigneeId} label="Filtrér på ansvarlig">
              <option value="">Alle ansvarlige</option>
              <option value="none">Uden ansvarlig</option>
              {admins.map((a) => <option key={a.id} value={a.id}>{a.id === userId ? "Mig" : (a.name || a.email)}</option>)}
            </Select></div>
          <div><label htmlFor="f-status">Status</label>
            <Select id="f-status" value={status} onChange={setStatus} label="Filtrér på status">
              <option value="">Alle</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select></div>
          <div><label htmlFor="f-due">Frist</label>
            <Select id="f-due" value={due} onChange={setDue} label="Filtrér på frist">
              <option value="">Alle</option>
              <option value="overdue">Overskredet</option>
              <option value="week">Inden for 7 dage</option>
              <option value="none">Uden frist</option>
            </Select></div>
        </div>
      )}

      {loading && todos.length === 0 ? (
        <div className="admin-loading-row"><div className="admin-spinner" /> Henter…</div>
      ) : loadError && todos.length === 0 ? (
        <div className="admin-table-empty" role="alert">
          Opgaverne kunne ikke hentes. Tjek forbindelsen, og prøv igen.
          <div style={{ marginTop: 10 }}><button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => load()}>Prøv igen</button></div>
        </div>
      ) : visible.length === 0 ? (
        <div className="admin-table-empty">
          {emptyMessage}
          {(activeFilters > 0 || query.trim()) && todos.length > 0 && (
            <div style={{ marginTop: 10 }}><button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={resetAll}>Ryd filtre</button></div>
          )}
        </div>
      ) : isMobile ? (
        <div className="admin-card-list">
          {visible.map((t) => (
            <TodoCard key={t.id} t={t} admins={admins} today={today} onOpen={() => setOpenId(t.id)} onToggle={() => toggleDone(t)} onOpenTicket={onOpenTicket} showStatus={showStatus} />
          ))}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th style={{ width: 34 }}></th><th>Opgave</th><th>Spor</th><th>Prioritet</th><th>Ansvarlig</th><th>Frist</th><th>Status</th></tr></thead>
            <tbody>
              {visible.map((t) => {
                const dueI = dueInfo(t, today);
                const done = t.status === "done";
                return (
                  <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => setOpenId(t.id)}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button className={`todo-check${done ? " done" : ""}`} onClick={() => toggleDone(t)}
                        aria-label={done ? `Genåbn: ${t.title}` : `Markér som færdig: ${t.title}`} title={done ? "Genåbn" : "Markér som færdig"}>
                        {done ? "✓" : ""}
                      </button>
                    </td>
                    <td style={{ maxWidth: 520, minWidth: 240 }}>
                      <div className={`todo-title${done ? " done" : ""}`}>
                        {t.title}{t.ticket_id && (onOpenTicket
                          ? <button type="button" className="admin-pill admin-pill-neutral" style={{ marginLeft: 8, verticalAlign: "middle", cursor: "pointer", border: "none", font: "inherit" }}
                              title="Åbn ticketten, opgaven kommer fra" aria-label={`Åbn ticketten bag: ${t.title}`}
                              onClick={(e) => { e.stopPropagation(); onOpenTicket(t.ticket_id); }}>Åbn ticket</button>
                          : <span className="admin-pill admin-pill-neutral" style={{ marginLeft: 8, verticalAlign: "middle" }} title="Kommer fra en ticket; status følger med begge veje">Ticket</span>)}
                      </div>
                      {t.description && <div className="todo-desc">{t.description}</div>}
                      {t.link && isHttpUrl(t.link) && (
                        <a href={t.link} target="_blank" rel="noopener noreferrer" className="todo-ext" onClick={(e) => e.stopPropagation()}>Åbn link</a>
                      )}
                    </td>
                    <td><span className="admin-pill admin-pill-neutral">{TRACK_LABELS[t.track]}</span></td>
                    <td>{!done && <span className={`admin-pill ${PRIORITY_PILL[t.priority]}`}>{PRIORITY_LABELS[t.priority]}</span>}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{personName(admins, t.assignee_id) || <span style={{ color: "var(--muted2)" }}>—</span>}</td>
                    <td style={{ whiteSpace: "nowrap", color: dueI?.overdue ? "var(--amber)" : undefined, fontWeight: dueI?.overdue ? 800 : undefined }}>
                      {dueI ? dueI.label : <span style={{ color: "var(--muted2)" }}>—</span>}
                    </td>
                    <td><span className={`admin-pill ${STATUS_PILL[t.status]}`}>{STATUS_LABELS[t.status]}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <TodoModal
          isNew admins={admins} userId={userId}
          todo={{ title: "", status: "todo", priority: "normal", track: "backend", assignee_id: userId || "" }}
          onSave={(fields) => create(fields)}
          onClose={() => setCreating(false)}
        />
      )}

      {openTodo && (
        <TodoModal
          key={openTodo.id} todo={openTodo} admins={admins} userId={userId}
          comments={comments} commentsLoading={commentsLoading} activity={activity}
          onSave={(patch) => update(openTodo.id, patch)}
          onDelete={() => remove(openTodo.id)}
          onClose={() => setOpenId(null)}
          onOpenTicket={onOpenTicket}
          onAddComment={(text) => addComment(openTodo.id, text)}
          onDeleteComment={deleteComment}
        />
      )}

      {showInfo && (
        <div className="admin-modal-overlay" onClick={() => setShowInfo(false)}>
          <div className="admin-modal" role="dialog" aria-modal="true" aria-label="Sådan fungerer opgaver" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ fontSize: 15, fontWeight: 800 }}>Sådan fungerer opgaver</div>
              <CloseX onClick={() => setShowInfo(false)} />
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6 }}>
              <li>Fælles liste for admin-brugerne.</li>
              <li>Tickets lægges automatisk her med ansvarlig og prioritet ud fra indholdet, og status følger med begge veje.</li>
              <li>Færdige opgaver hentes først, når du åbner Færdige.</li>
              <li>Opgaver med høj prioritet, eller hvis frist er overskredet, tæller i menuen.</li>
              <li>Anbefalet sortering: høj prioritet, der er overskredet eller venter, øverst, derefter overskredne frister, høj prioritet og kommende frister. Ved ens placering bruges oprettelsesdato og til sidst id, så rækkefølgen er stabil.</li>
            </ul>
          </div>
        </div>
      )}

      {undo && (
        <div className="todo-undo" role="status">
          <span style={{ overflowWrap: "anywhere" }}>Markeret som færdig</span>
          <button type="button" onClick={undoDone}>Fortryd</button>
        </div>
      )}
    </>
  );
}
