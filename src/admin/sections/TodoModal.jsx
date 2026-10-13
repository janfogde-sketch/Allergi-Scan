// @ts-nocheck
// Redigering af én opgave (eller oprettelse af en ny). På mobil et fuldskærmspanel med fast header og fast bundbjælke (Gem/Slet
// ligger over safe area), på desktop den eksisterende dialog. Indholdet scroller inde i panelet, og baggrunden er låst, mens det er åbent.
import React, { useState, useEffect, useRef } from "react";
import { showToast, Icon } from "../../SharedComponents.jsx";
import ActionsMenu from "../ActionsMenu.jsx";
import { useIsMobile } from "../useIsMobile.js";
import {
  STATUS_LABELS, PRIORITY_LABELS, TRACK_LABELS, personName, authorName, fmtDanishDateTime, fmtDanishDate, isLongComment, buildTodoPrompt,
} from "../todoLogic.js";

export const isHttpUrl = (s) => /^https?:\/\/\S+$/i.test(s);

function Select({ id, value, onChange, children }) {
  return <select id={id} className="admin-select" value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>;
}

// Titlen er et tekstområde, der vokser med indholdet, så lange titler kan ses i sin helhed uden vandret rulning.
function GrowingTitle({ id, value, onChange, invalid, autoFocus }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea id={id} ref={ref} className="admin-textarea todo-title-input" rows={1} value={value} maxLength={200} aria-invalid={invalid} autoFocus={autoFocus}
      onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
      onChange={(e) => onChange(e.target.value.replace(/\s*\n+\s*/g, " "))} />
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

export default function TodoModal({ todo, isNew = false, admins, userId, comments = [], commentsLoading = false, onSave, onDelete, onClose, onAddComment, onDeleteComment, onOpenTicket }) {
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
      commentEnd.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
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
    if (ok) setCommentText(""); else justSent.current = false;
  };

  const copyPrompt = () => navigator.clipboard?.writeText(buildTodoPrompt({ ...todo, ...draft, assignee_id: draft.assignee_id || null }, admins, comments))
    .then(() => showToast("Prompt kopieret")).catch((e) => showToast("Kunne ikke kopiere: " + e.message, "error"));

  const menuItems = isNew ? [] : [
    { label: "Kopiér som prompt", onClick: copyPrompt },
    todo.ticket_id && onOpenTicket ? { label: "Åbn ticket", onClick: () => { onOpenTicket(todo.ticket_id); onClose(); } } : null,
    { label: "Slet opgave", onClick: () => setConfirm("delete") },
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
            <ActionsMenu items={menuItems} />
            <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={requestClose} aria-label="Luk">Luk</button>
          </div>
        </div>

        {confirm === "discard" && (
          <div className="todo-confirm" style={{ margin: "12px 16px 0" }} role="alertdialog" aria-label="Ikke-gemte ændringer">
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Du har ændringer, der ikke er gemt.</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="admin-btn admin-btn-primary admin-btn-sm admin-touch" onClick={() => setConfirm(null)}>Bliv og ret</button>
              <button type="button" className="admin-btn admin-btn-danger admin-btn-sm admin-touch" onClick={onClose}>Kassér ændringer</button>
            </div>
          </div>
        )}
        {confirm === "delete" && (
          <div className="todo-confirm" style={{ margin: "12px 16px 0" }} role="alertdialog" aria-label="Slet opgaven">
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Slet opgaven og dens kommentarer? Det kan ikke fortrydes.</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => setConfirm(null)}>Annullér</button>
              <button type="button" className="admin-btn admin-btn-danger admin-btn-sm admin-touch" onClick={() => onDelete().then((ok) => ok && onClose())}>Ja, slet opgaven</button>
            </div>
          </div>
        )}

        <div className="todo-panel-body">
          <div className="admin-field">
            <label htmlFor="todo-title">Titel</label>
            <GrowingTitle id="todo-title" autoFocus={isNew} value={draft.title} invalid={!titleOk} onChange={set("title")} />
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
            <input id="todo-link" value={draft.link} maxLength={500} placeholder="https://…" inputMode="url" autoCapitalize="none" aria-invalid={!linkOk}
              onChange={(e) => set("link")(e.target.value)} />
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
            <form onSubmit={submitComment} style={{ display: "flex", gap: 8 }}>
              <input className="admin-search" style={{ maxWidth: "none", flex: 1 }} value={commentText} maxLength={2000} placeholder="Skriv en kommentar…"
                aria-label="Ny kommentar" enterKeyHint="send"
                onFocus={(e) => { const el = e.target; setTimeout(() => el.scrollIntoView?.({ block: "center", behavior: "smooth" }), 300); }}
                onChange={(e) => setCommentText(e.target.value)} />
              <button type="submit" className="admin-btn admin-btn-ghost admin-touch" disabled={sending || !commentText.trim()}>{sending ? "Sender…" : "Send"}</button>
            </form>
            <div ref={commentEnd} />
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
