// @ts-nocheck
import React, { useState, useEffect } from "react";
import { showToast } from "../../SharedComponents.jsx";
import {
  STATUS_LABELS, STATUS_PILL, PRIORITY_LABELS, PRIORITY_PILL, TRACK_LABELS,
  todayKey, dueInfo, sortTodos, filterTodos, countByView, personName, buildTodoPrompt,
} from "../todoLogic.js";

const VIEWS = [
  { id: "open", label: "Åbne" },
  { id: "mine", label: "Mine" },
  { id: "unassigned", label: "Uden ansvarlig" },
  { id: "done", label: "Færdige" },
  { id: "all", label: "Alle" },
];

const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("da-DK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "");
const isHttpUrl = (s) => /^https?:\/\/\S+$/i.test(s);

function Select({ id, value, onChange, children, label, style }) {
  return (
    <select id={id} className="admin-select" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} style={style}>
      {children}
    </select>
  );
}

function TodoModal({ todo, isNew = false, admins, userId, comments = [], commentsLoading = false, onSave, onDelete, onClose, onAddComment, onDeleteComment }) {
  const [draft, setDraft] = useState({
    title: todo.title, description: todo.description ?? "", status: todo.status, priority: todo.priority, track: todo.track,
    assignee_id: todo.assignee_id ?? "", due_date: todo.due_date ?? "", link: todo.link ?? "",
  });
  const [commentText, setCommentText] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setDraft((d) => ({ ...d, [k]: v }));

  const changed = isNew ? Object.keys(draft) : Object.keys(draft).filter((k) => String(draft[k] ?? "") !== String(todo[k] ?? ""));

  const save = async () => {
    if (!draft.title.trim()) { showToast("Giv opgaven en titel", "error"); return; }
    if (draft.link && !isHttpUrl(draft.link.trim())) { showToast("Linket skal starte med http:// eller https://", "error"); return; }
    setSaving(true);
    const ok = await onSave(Object.fromEntries(changed.map((k) => [k, typeof draft[k] === "string" ? draft[k].trim() : draft[k]])));
    setSaving(false);
    if (ok) onClose();
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (await onAddComment(commentText)) setCommentText("");
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" role="dialog" aria-modal="true" aria-label={isNew ? "Ny opgave" : "Rediger opgave"} style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            {isNew ? (
              <div style={{ fontSize: 15, fontWeight: 800 }}>Ny opgave</div>
            ) : (
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                Oprettet {fmtDateTime(todo.created_at)}{todo.created_by ? ` af ${personName(admins, todo.created_by)}` : ""}
                {todo.completed_at ? ` · Færdig ${fmtDateTime(todo.completed_at)}${todo.completed_by ? ` af ${personName(admins, todo.completed_by)}` : ""}` : ""}
              </div>
            )}
          </div>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={onClose} aria-label="Luk">Luk</button>
        </div>

        <div className="admin-field">
          <label htmlFor="todo-title">Titel</label>
          <input id="todo-title" autoFocus={isNew} value={draft.title} maxLength={200} onChange={(e) => set("title")(e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="todo-desc">Beskrivelse</label>
          <textarea id="todo-desc" className="admin-textarea" value={draft.description} maxLength={4000} onChange={(e) => set("description")(e.target.value)} />
        </div>

        <div className="todo-grid">
          <div className="admin-field">
            <label htmlFor="todo-status">Status</label>
            <Select id="todo-status" value={draft.status} onChange={set("status")}>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </div>
          <div className="admin-field">
            <label htmlFor="todo-priority">Prioritet</label>
            <Select id="todo-priority" value={draft.priority} onChange={set("priority")}>
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </div>
          <div className="admin-field">
            <label htmlFor="todo-track">Spor</label>
            <Select id="todo-track" value={draft.track} onChange={set("track")}>
              {Object.entries(TRACK_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </div>
          <div className="admin-field">
            <label htmlFor="todo-assignee">Ansvarlig</label>
            <Select id="todo-assignee" value={draft.assignee_id} onChange={set("assignee_id")}>
              <option value="">Ingen</option>
              {userId && admins.some((a) => a.id === userId) && <option value={userId}>Mig ({personName(admins, userId)})</option>}
              {admins.filter((a) => a.id !== userId).map((a) => <option key={a.id} value={a.id}>{a.name || a.email}</option>)}
            </Select>
          </div>
          <div className="admin-field">
            <label htmlFor="todo-due">Frist</label>
            <input id="todo-due" type="date" value={draft.due_date} onChange={(e) => set("due_date")(e.target.value)} />
          </div>
          <div className="admin-field">
            <label htmlFor="todo-link">Link (PR, ticket, side)</label>
            <input id="todo-link" value={draft.link} maxLength={500} placeholder="https://…" onChange={(e) => set("link")(e.target.value)} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          <button className="admin-btn admin-btn-primary" onClick={save} disabled={saving || changed.length === 0}>
            {saving ? (isNew ? "Opretter…" : "Gemmer…") : (isNew ? "Opret opgave" : "Gem")}
          </button>
          {isNew && <button className="admin-btn admin-btn-ghost" onClick={onClose}>Annullér</button>}
          {!isNew && <button className="admin-btn admin-btn-ghost"
            onClick={() => navigator.clipboard?.writeText(buildTodoPrompt({ ...todo, ...draft, assignee_id: draft.assignee_id || null }, admins, comments))
              .then(() => showToast("Prompt kopieret")).catch((e) => showToast("Kunne ikke kopiere: " + e.message, "error"))}>
            Kopiér som prompt
          </button>}
          {!isNew && <button className="admin-btn admin-btn-danger" style={{ marginLeft: "auto" }}
            onClick={() => { if (window.confirm("Slet opgaven og dens kommentarer? Det kan ikke fortrydes.")) onDelete().then((ok) => ok && onClose()); }}>
            Slet
          </button>}
        </div>

        {!isNew && <>
        <div className="admin-label">Kommentarer</div>
        {commentsLoading ? (
          <div className="admin-loading-row" style={{ padding: 8 }}><div className="admin-spinner" /> Henter…</div>
        ) : comments.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>Ingen kommentarer endnu.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
            {comments.map((c) => (
              <div key={c.id} className="todo-comment">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11.5, color: "var(--muted)" }}>
                  <span><strong style={{ color: "var(--ink2)" }}>{personName(admins, c.author_id) || "Ukendt"}</strong> · {fmtDateTime(c.created_at)}</span>
                  {c.author_id === userId && (
                    <button className="todo-link-btn" onClick={() => onDeleteComment(c.id)} aria-label="Slet kommentar">Slet</button>
                  )}
                </div>
                <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 13 }}>{c.body}</div>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={submitComment} style={{ display: "flex", gap: 8 }}>
          <input className="admin-search" style={{ maxWidth: "none", flex: 1 }} value={commentText} maxLength={2000} placeholder="Skriv en kommentar…"
            aria-label="Ny kommentar" onChange={(e) => setCommentText(e.target.value)} />
          <button type="submit" className="admin-btn admin-btn-ghost" disabled={!commentText.trim()}>Send</button>
        </form>
        </>}
      </div>
    </div>
  );
}

export default function TodoSection({ todos, admins, loading, load, create, update, remove, userId, comments, commentsLoading, loadComments, closeComments, addComment, deleteComment }) {
  const [view, setView] = useState("open");
  const [track, setTrack] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);

  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const today = todayKey();
  const counts = countByView(todos, userId);
  const visible = sortTodos(filterTodos(todos, { view, track, assigneeId, query }, userId));
  const openTodo = openId ? todos.find((t) => t.id === openId) : null;

  useEffect(() => {
    if (openId) loadComments(openId); else closeComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  // "Tilføj" åbner den udvidede opgavemenu med titlen udfyldt; først "Opret opgave" gemmer.
  const startNew = (e) => {
    e.preventDefault();
    if (newTitle.trim()) setCreating(true);
  };

  const toggleDone = (t) => update(t.id, { status: t.status === "done" ? "todo" : "done" });

  return (
    <>
      <form className="admin-card todo-add" onSubmit={startNew}>
        <input className="admin-search" style={{ maxWidth: "none", flex: "1 1 280px" }} value={newTitle} maxLength={200}
          placeholder="Ny opgave — skriv en titel og tryk Enter" aria-label="Titel på ny opgave" onChange={(e) => setNewTitle(e.target.value)} />
        <button type="submit" className="admin-btn admin-btn-primary" disabled={!newTitle.trim()}>Tilføj</button>
      </form>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
        <div className="admin-tabs" style={{ marginBottom: 0, border: "none", flexWrap: "wrap" }}>
          {VIEWS.map((v) => (
            <button key={v.id} className={`admin-tab-btn${view === v.id ? " active" : ""}`} onClick={() => setView(v.id)}>
              {v.label} ({counts[v.id]})
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Select value={track} onChange={setTrack} label="Filtrér på spor">
            <option value="">Alle spor</option>
            {Object.entries(TRACK_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select value={assigneeId} onChange={setAssigneeId} label="Filtrér på ansvarlig">
            <option value="">Alle ansvarlige</option>
            <option value="none">Uden ansvarlig</option>
            {admins.map((a) => <option key={a.id} value={a.id}>{a.id === userId ? "Mig" : (a.name || a.email)}</option>)}
          </Select>
          <input className="admin-search" style={{ maxWidth: 200 }} value={query} placeholder="Søg…" aria-label="Søg i opgaver" onChange={(e) => setQuery(e.target.value)} />
          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => load()}>Opdater</button>
        </div>
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
        Fælles liste for admin-brugerne. Opgaver med høj prioritet, eller hvis frist er overskredet, tæller i menuen.
      </div>

      <div className="admin-table-wrap">
        {loading && todos.length === 0 ? (
          <div className="admin-loading-row"><div className="admin-spinner" /> Henter…</div>
        ) : visible.length === 0 ? (
          <div className="admin-table-empty">{todos.length === 0 ? "Ingen opgaver endnu. Skriv den første ovenfor." : "Ingen opgaver matcher filtrene"}</div>
        ) : (
          <table className="admin-table">
            <thead><tr><th style={{ width: 34 }}></th><th>Opgave</th><th>Spor</th><th>Prioritet</th><th>Ansvarlig</th><th>Frist</th><th>Status</th></tr></thead>
            <tbody>
              {visible.map((t) => {
                const due = dueInfo(t, today);
                const done = t.status === "done";
                return (
                  <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => setOpenId(t.id)}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button className={`todo-check${done ? " done" : ""}`} onClick={() => toggleDone(t)}
                        aria-label={done ? `Genåbn: ${t.title}` : `Markér som færdig: ${t.title}`} title={done ? "Genåbn" : "Markér som færdig"}>
                        {done ? "✓" : ""}
                      </button>
                    </td>
                    <td style={{ maxWidth: 520 }}>
                      <div className={`todo-title${done ? " done" : ""}`}>{t.title}</div>
                      {t.description && <div className="todo-desc">{t.description}</div>}
                      {t.link && isHttpUrl(t.link) && (
                        <a href={t.link} target="_blank" rel="noopener noreferrer" className="todo-ext" onClick={(e) => e.stopPropagation()}>Åbn link</a>
                      )}
                    </td>
                    <td><span className="admin-pill admin-pill-neutral">{TRACK_LABELS[t.track]}</span></td>
                    <td>{!done && <span className={`admin-pill ${PRIORITY_PILL[t.priority]}`}>{PRIORITY_LABELS[t.priority]}</span>}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{personName(admins, t.assignee_id) || <span style={{ color: "var(--muted2)" }}>—</span>}</td>
                    <td style={{ whiteSpace: "nowrap", color: due?.overdue ? "var(--red)" : undefined, fontWeight: due?.overdue ? 800 : undefined }}>
                      {due ? due.label : <span style={{ color: "var(--muted2)" }}>—</span>}
                    </td>
                    <td><span className={`admin-pill ${STATUS_PILL[t.status]}`}>{STATUS_LABELS[t.status]}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {creating && (
        <TodoModal
          isNew admins={admins} userId={userId}
          todo={{ title: newTitle.trim(), status: "todo", priority: "normal", track: "backend", assignee_id: userId || "" }}
          onSave={async (fields) => {
            const ok = await create(fields);
            if (ok) setNewTitle("");
            return ok;
          }}
          onClose={() => setCreating(false)}
        />
      )}

      {openTodo && (
        <TodoModal
          key={openTodo.id} todo={openTodo} admins={admins} userId={userId}
          comments={comments} commentsLoading={commentsLoading}
          onSave={(patch) => update(openTodo.id, patch)}
          onDelete={() => remove(openTodo.id)}
          onClose={() => setOpenId(null)}
          onAddComment={(text) => addComment(openTodo.id, text)}
          onDeleteComment={deleteComment}
        />
      )}
    </>
  );
}
