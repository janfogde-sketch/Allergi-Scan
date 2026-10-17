// @ts-nocheck
// Redigering af én opgave (eller oprettelse af en ny). På mobil et fuldskærmspanel med fast header og fast bundbjælke (Gem/Slet
// ligger over safe area), på desktop den eksisterende dialog. Indholdet scroller inde i panelet, og baggrunden er låst, mens det er åbent.
import { scrollBehavior } from "../../motion.js";
import React, { useState, useEffect, useRef } from "react";
import { showToast, Icon } from "../../SharedComponents.jsx";
import ActionsMenu from "../ActionsMenu.jsx";
import { useIsMobile } from "../useIsMobile.js";
import CloseX from "../CloseX.jsx";
import {
  STATUS_LABELS, PRIORITY_LABELS, TRACK_LABELS, ACTIVITY_FIELD_LABELS, activityValue, activityActor, personName, authorName, fmtDanishDateTime, fmtDanishDate, isLongComment, buildTodoPrompt,
} from "../todoLogic.js";

export const isHttpUrl = (s) => /^https?:\/\/\S+$/i.test(s);

function Select({ id, value, onChange, children }) {
  return <select id={id} className="admin-select" value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>;
}

// Tekstområde, der vokser med indholdet (ingen indlejret rulning). singleLine: titlen, hvor linjeskift ikke er tilladt.
// maxHeight: over grænsen holder feltet op med at vokse og kan rulles (kommentarfeltet).
function GrowingText({ id, value, onChange, invalid, autoFocus, singleLine = false, className = "", rows, maxHeight, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const h = el.scrollHeight;
    el.style.height = `${maxHeight ? Math.min(h, maxHeight) : h}px`;
    el.style.overflowY = maxHeight && h > maxHeight ? "auto" : "hidden";
  }, [value, maxHeight]);
  return (
    <textarea id={id} ref={ref} className={`admin-textarea todo-grow ${className}`} rows={rows ?? (singleLine ? 1 : 4)} value={value} aria-invalid={invalid} autoFocus={autoFocus}
      onKeyDown={singleLine ? (e) => { if (e.key === "Enter") e.preventDefault(); } : undefined}
      onChange={(e) => onChange(singleLine ? e.target.value.replace(/\s*\n+\s*/g, " ") : e.target.value)} {...rest} />
  );
}

// Lang kommentar vises med de første linjer; "Vis mere"/"Vis mindre" folder resten ud. Teksten er uændret.
function CommentBody({ body }) {
  const long = isLongComment(body);
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className={`todo-comment-body${long && !open ? " clamped" : ""}`}>{body}</div>
      {long && <button type="button" className="todo-link-btn" style={{ minHeight: 32, marginTop: 2 }} aria-expanded={open} onClick={() => setOpen((v) => !v)}>{open ? "Vis mindre" : "Vis mere"}</button>}
    </>
  );
}

// Historik: hvem ændrede status, prioritet, ansvarlig eller frist og hvornår (nyeste først). Adskilt fra kommentarerne;
// de seneste 5 vises, resten foldes ud med "Vis alle".
const ACTIVITY_SHOWN = 5;
function ActivityList({ activity, admins }) {
  const [all, setAll] = useState(false);
  const rows = [...activity].reverse();
  const shown = all ? rows : rows.slice(0, ACTIVITY_SHOWN);
  return (
    <>
      <div className="admin-label" style={{ marginTop: 14 }}>Historik</div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Ingen ændringer endnu.</div>
      ) : (
        <ul className="todo-activity" aria-label="Historik">
          {shown.map((a) => (
            <li key={a.id}>
              <span style={{ color: "var(--ink2)" }}>{ACTIVITY_FIELD_LABELS[a.field] ?? a.field}: {activityValue(admins, a.field, a.old_value)} → {activityValue(admins, a.field, a.new_value)}</span>
              <span style={{ color: "var(--muted)" }}> · {activityActor(admins, a)} · {fmtDanishDateTime(a.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
      {rows.length > ACTIVITY_SHOWN && (
        <button type="button" className="todo-link-btn" style={{ minHeight: 32, marginTop: 2 }} aria-expanded={all} onClick={() => setAll((v) => !v)}>{all ? "Vis færre" : `Vis alle (${rows.length})`}</button>
      )}
    </>
  );
}

// Højden af det synlige område (uden iPhone-tastaturet), så Gem og kommentarfeltet aldrig ligger bag tastaturet.
function useVisibleHeight(enabled) {
  const [h, setH] = useState(null);
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!enabled || !vv) return undefined;
    const on = () => setH(Math.round(vv.height));
    on();
    vv.addEventListener("resize", on);
    vv.addEventListener("scroll", on);
    return () => { vv.removeEventListener("resize", on); vv.removeEventListener("scroll", on); };
  }, [enabled]);
  return h;
}

export default function TodoModal({ todo, isNew = false, admins, userId, comments = [], commentsLoading = false, activity = [], onSave, onDelete, onClose, onAddComment, onDeleteComment, onOpenTicket }) {
  const isMobile = useIsMobile();
  const [draft, setDraft] = useState({
    title: todo.title, description: todo.description ?? "", status: todo.status, priority: todo.priority, track: todo.track,
    assignee_id: todo.assignee_id ?? "", due_date: todo.due_date ?? "", link: todo.link ?? "",
  });
  const [commentText, setCommentText] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirm, setConfirm] = useState(null); // "discard" | "delete"
  const [freshId, setFreshId] = useState(null);
  const justSent = useRef(false);
  const commentEnd = useRef(null);
  const height = useVisibleHeight(isMobile);
  const set = (k) => (v) => setDraft((d) => ({ ...d, [k]: v }));

  const changed = isNew ? Object.keys(draft) : Object.keys(draft).filter((k) => String(draft[k] ?? "") !== String(todo[k] ?? ""));
  const dirty = isNew ? (draft.title.trim() !== "" || draft.description.trim() !== "" || draft.link.trim() !== "") : changed.length > 0;
  const titleOk = draft.title.trim() !== "";
  const linkOk = !draft.link.trim() || isHttpUrl(draft.link.trim());
  const canSave = !saving && titleOk && linkOk && (isNew || changed.length > 0);

  // Baggrunden scroller ikke med, mens panelet er åbent
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const requestClose = () => {
    if (dirty && !saving) setConfirm("discard"); else onClose();
  };
  const closeRef = useRef(requestClose);
  closeRef.current = requestClose;
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") closeRef.current(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Ny kommentar markeres kort, og listen ruller ned til den
  useEffect(() => {
    if (justSent.current && comments.length > 0) {
      justSent.current = false;
      setFreshId(comments[comments.length - 1].id);
      commentEnd.current?.scrollIntoView?.({ block: "nearest", behavior: scrollBehavior() });
    }
  }, [comments]);

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    const ok = await onSave(Object.fromEntries(changed.map((k) => [k, typeof draft[k] === "string" ? draft[k].trim() : draft[k]])));
    setSaving(false);
    if (ok) onClose();
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (sending || !commentText.trim()) return;
    setSending(true);
    justSent.current = true;
    const ok = await onAddComment(commentText);
    setSending(false);
    if (ok) { setCommentText(""); showToast("Kommentar tilføjet", "success"); } else justSent.current = false;
  };

  const copyPrompt = () => navigator.clipboard?.writeText(buildTodoPrompt({ ...todo, ...draft, assignee_id: draft.assignee_id || null }, admins, comments))
    .then(() => showToast("Prompt kopieret")).catch((e) => showToast("Kunne ikke kopiere: " + e.message, "error"));

  const menuItems = isNew ? [] : [
    { label: "Kopiér som prompt", icon: "file", onClick: copyPrompt },
    todo.ticket_id && onOpenTicket ? { label: "Åbn ticket", icon: "link", onClick: () => { onOpenTicket(todo.ticket_id); onClose(); } } : null,
    { label: "Slet opgave", icon: "trash", danger: true, onClick: () => setConfirm("delete") },
  ];

  return (
    <div className="admin-modal-overlay" onClick={requestClose} style={isMobile && height ? { height } : undefined}>
      <div className="admin-modal todo-panel" role="dialog" aria-modal="true" aria-label={isNew ? "Ny opgave" : "Rediger opgave"}
        style={{ maxWidth: 720, ...(isMobile && height ? { height, maxHeight: height } : {}) }} onClick={(e) => e.stopPropagation()}>
        <div className="todo-panel-head">
          <div style={{ minWidth: 0 }}>
            {isNew ? (
              <div style={{ fontSize: 15, fontWeight: 800 }}>Ny opgave</div>
            ) : (
              <>
                <div style={{ fontSize: 15, fontWeight: 800 }}>Opgave</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", overflowWrap: "anywhere" }}>
                  Oprettet {fmtDanishDateTime(todo.created_at)}{todo.created_by ? ` af ${personName(admins, todo.created_by)}` : ""}
                  {todo.completed_at ? ` · Færdig ${fmtDanishDateTime(todo.completed_at)}${todo.completed_by ? ` af ${personName(admins, todo.completed_by)}` : ""}` : ""}
                </div>
                {todo.ticket_id && <div style={{ marginTop: 6 }}><span className="admin-pill admin-pill-neutral">Kommer fra en ticket · status følger med begge veje</span></div>}
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
            <ActionsMenu items={menuItems} compact={isMobile} />
            <CloseX onClick={requestClose} />
          </div>
        </div>

        {confirm === "discard" && (
          <div className="todo-confirm" style={{ margin: "12px 16px 0" }} role="alertdialog" aria-label="Ikke-gemte ændringer">
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Du har ændringer, der ikke er gemt.</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => setConfirm(null)}>Bliv og ret</button>
              {canSave && <button type="button" className="admin-btn admin-btn-primary admin-btn-sm admin-touch" onClick={() => { setConfirm(null); save(); }}>Gem og luk</button>}
              <button type="button" className="admin-btn admin-btn-danger admin-btn-sm admin-touch" onClick={onClose}>Kassér ændringer</button>
            </div>
          </div>
        )}
        {confirm === "delete" && (
          <div className="todo-confirm" style={{ margin: "12px 16px 0" }} role="alertdialog" aria-label="Slet opgaven">
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Slet “{todo.title}”?</div>
            <div style={{ fontSize: 12.5, marginBottom: 8 }}>Opgaven og dens kommentarer slettes permanent og kan ikke gendannes.</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => setConfirm(null)}>Annullér</button>
              <button type="button" className="admin-btn admin-btn-danger admin-btn-sm admin-touch" onClick={() => onDelete().then((ok) => ok && onClose())}>Ja, slet opgaven</button>
            </div>
          </div>
        )}

        <div className="todo-panel-body">
          <div className="admin-field">
            <label htmlFor="todo-title">Titel</label>
            <GrowingText id="todo-title" singleLine className="todo-title-input" maxLength={200} autoFocus={isNew} value={draft.title} invalid={!titleOk} onChange={set("title")} />
          </div>
          <div className="admin-field">
            <label htmlFor="todo-desc">Beskrivelse</label>
            <GrowingText id="todo-desc" className="todo-desc-input" maxLength={4000} value={draft.description} onChange={set("description")} />
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
              <label htmlFor="todo-assignee">Ansvarlig</label>
              <Select id="todo-assignee" value={draft.assignee_id} onChange={set("assignee_id")}>
                <option value="">Ingen</option>
                {userId && admins.some((a) => a.id === userId) && <option value={userId}>Mig ({personName(admins, userId)})</option>}
                {admins.filter((a) => a.id !== userId).map((a) => <option key={a.id} value={a.id}>{a.name || a.email}</option>)}
              </Select>
            </div>
            <div className="admin-field">
              <label htmlFor="todo-track">Spor</label>
              <Select id="todo-track" value={draft.track} onChange={set("track")}>
                {Object.entries(TRACK_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div className="admin-field">
              <label htmlFor="todo-due">Frist</label>
              <div className="todo-date-row">
                <label className="todo-date-field" htmlFor="todo-due">
                  <Icon name="calendar" size={16} color="var(--muted)" />
                  <span style={{ color: draft.due_date ? "var(--ink)" : "var(--muted)" }}>{draft.due_date ? fmtDanishDate(draft.due_date) : "Vælg dato"}</span>
                  <input id="todo-due" type="date" value={draft.due_date} onChange={(e) => set("due_date")(e.target.value)} />
                </label>
                {draft.due_date && <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => set("due_date")("")} aria-label="Fjern frist">Fjern</button>}
              </div>
            </div>
          </div>
          <div className="admin-field">
            <label htmlFor="todo-link">Link (PR, ticket, side)</label>
            <div className="todo-date-row">
              <input id="todo-link" value={draft.link} maxLength={500} placeholder="https://…" inputMode="url" autoCapitalize="none" aria-invalid={!linkOk}
                onChange={(e) => set("link")(e.target.value)} />
              {draft.link.trim() && linkOk && <a className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" href={draft.link.trim()} target="_blank" rel="noopener noreferrer" aria-label="Åbn linket i en ny fane">Åbn</a>}
            </div>
            {!linkOk && <div style={{ color: "var(--red)", fontSize: 12, marginTop: 4 }}>Linket skal starte med http:// eller https://</div>}
          </div>

          {!isNew && <>
            <div className="admin-label" style={{ marginTop: 6 }}>Kommentarer</div>
            {commentsLoading ? (
              <div className="admin-loading-row" style={{ padding: 8 }}><div className="admin-spinner" /> Henter…</div>
            ) : comments.length === 0 ? (
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>Ingen kommentarer endnu.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                {comments.map((c) => (
                  <div key={c.id} className={`todo-comment${c.id === freshId ? " fresh" : ""}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11.5, color: "var(--muted)" }}>
                      <span style={{ overflowWrap: "anywhere" }}><strong style={{ color: "var(--ink2)" }}>{authorName(admins, c.author_id)}</strong> · {fmtDanishDateTime(c.created_at)}</span>
                      {c.author_id && c.author_id === userId && (
                        <button type="button" className="todo-link-btn" onClick={() => onDeleteComment(c.id)} aria-label="Slet kommentar" style={{ minHeight: 32, padding: "0 4px" }}>Slet</button>
                      )}
                    </div>
                    <CommentBody body={c.body} />
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={submitComment} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <GrowingText id="todo-comment" className="todo-comment-input" rows={2} maxHeight={160} maxLength={2000} placeholder="Skriv en kommentar…" aria-label="Ny kommentar" value={commentText}
                onFocus={(e) => { const el = e.target; setTimeout(() => el.scrollIntoView?.({ block: "center", behavior: scrollBehavior() }), 300); }}
                onChange={setCommentText} />
              <button type="submit" className="admin-btn admin-btn-ghost admin-touch" disabled={sending || !commentText.trim()}>{sending ? "Sender…" : "Send"}</button>
            </form>
            <div ref={commentEnd} />
            {!commentsLoading && <ActivityList activity={activity} admins={admins} />}
          </>}
        </div>

        <div className="todo-panel-foot">
          <button type="button" className="admin-btn admin-btn-primary admin-touch" style={{ flex: 1 }} onClick={save} disabled={!canSave}>
            {saving ? (isNew ? "Opretter…" : "Gemmer…") : (isNew ? "Opret opgave" : "Gem")}
          </button>
        </div>
      </div>
    </div>
  );
}
