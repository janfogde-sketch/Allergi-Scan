// @ts-nocheck
// Ticketdetaljer: fast overskrift og fast handlingsbjælke, oplysninger, prioritet og lanceringsblokering, beskrivelse med bevaret formatering, tjekliste, verificering,
// aktivitet og tekniske oplysninger. Et lukket ticket eller en afsluttet tjekliste er aldrig en faglig eller juridisk godkendelse.
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Icon, showToast } from "../../SharedComponents.jsx";
import Disclosure from "../Disclosure.jsx";
import { ticketReporter } from "../../ticketReporter.js";
import { statusPill } from "../statusTone.js";
import { fmtLocalFull } from "../importLogic.js";
import {
  TYPE_LABELS, STATUS_LABELS, PRIORITIES, PRIORITY_PILL, PRIORITY_LABEL, TASK_STATUS, ticketTitleParts, effectivePriority, originLabel, isLegalCandidate, progress, buildActivity,
} from "../ticketsLogic.js";

/** Beskrivelsen vises med bevarede linjeskift; linjer der starter med # bliver overskrifter. */
export function Description({ text }) {
  const lines = String(text || "").replace(/\r/g, "").split("\n");
  const blocks = []; let buf = [];
  const flush = () => { if (buf.length) { blocks.push({ t: "p", text: buf.join("\n") }); buf = []; } };
  for (const l of lines) { const m = l.match(/^#{1,3}\s+(.*)$/); if (m) { flush(); blocks.push({ t: "h", text: m[1] }); } else buf.push(l); }
  flush();
  return <div className="tk-desc">{blocks.map((b, i) => (b.t === "h" ? <h3 key={i} className="tk-desc-h">{b.text}</h3> : <p key={i} className="tk-desc-p">{b.text}</p>))}</div>;
}

function Screenshot({ path, getUrl }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);
  const ref = useRef(getUrl); ref.current = getUrl;
  useEffect(() => {
    let off = false; setUrl(null); setFailed(false);
    ref.current(path).then((u) => { if (!off) setUrl(u); }).catch(() => { if (!off) setFailed(true); });
    return () => { off = true; };
  }, [path]);
  if (failed) return <div className="pe-muted">Skærmbilledet kunne ikke hentes.</div>;
  if (!url) return <div className="admin-loading-row"><div className="admin-spinner" /> Henter skærmbillede…</div>;
  return <a href={url} target="_blank" rel="noreferrer"><img src={url} alt="Skærmbillede fra brugeren" className="tk-shot" /></a>;
}

export default function TicketDetail({ ticket: t, work, onClose, onStatus, onCopy, getTicketScreenshotUrl }) {
  const meta = work.meta[t.id];
  const todo = work.todos[t.id];
  const pr = effectivePriority(t, meta);
  const { title } = ticketTitleParts(t.description);
  const [closing, setClosing] = useState(false);
  const [note, setNote] = useState("");
  const [testNote, setTestNote] = useState(meta?.test_note || "");
  const [newTask, setNewTask] = useState("");
  const [comment, setComment] = useState("");
  const [detail, setDetail] = useState({ loading: true, ok: true, tasks: [], metaLog: [], todoActivity: [], comments: [] });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const tasks = work.tasks[t.id] || [];

  const refresh = async () => { const d = await work.loadDetail(t.id); setDetail({ loading: false, ...d }); };
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps -- hentes når ticketten åbnes */ }, [t.id, todo?.id]);
  useEffect(() => { const k = (e) => { if (e.key === "Escape") onClose(); }; document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [onClose]);

  const run = async (fn, okMsg) => { setBusy(true); setErr(""); const r = await fn(); setBusy(false); if (!r.ok) setErr("Ændringen kunne ikke gemmes. Prøv igen."); else { if (okMsg) showToast(okMsg); refresh(); } return r; };
  const setStage = (k, on) => run(() => work.saveMeta(t.id, { [`${k}_at`]: on ? new Date().toISOString() : null }));
  const activity = buildActivity(detail, work.nameOf);
  const prog = progress(tasks);
  const needs = work.available;

  return ReactDOM.createPortal(
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal todo-panel pe-panel" role="dialog" aria-modal="true" aria-labelledby="tk-title" onClick={(e) => e.stopPropagation()}>
        <div className="todo-panel-head">
          <div style={{ minWidth: 0 }}>
            <div id="tk-title" className="audit-sheet-title tk-title">{title}</div>
            <div className="tk-pills">
              <span className={`admin-pill ${statusPill(t.status)}`}>{STATUS_LABELS[t.status] || t.status}</span>
              <span className={`admin-pill ${PRIORITY_PILL[pr]}`}>{PRIORITY_LABEL[pr]}</span>
              {meta?.launch_blocking && <span className="admin-pill admin-pill-red">Lanceringsblokerende</span>}
              <span className="admin-pill admin-pill-neutral">{TYPE_LABELS[t.type] || t.type}</span>
            </div>
          </div>
          <button type="button" className="admin-iconbtn audit-sheet-close" onClick={onClose} aria-label="Luk"><Icon name="x" size={20} color="var(--ink2)" /></button>
        </div>

        <div className="todo-panel-body">
          {err && <div className="pe-notice pe-red" role="alert">{err}</div>}
          {closing && (
            <div className="todo-confirm" role="group" aria-label="Markér som løst">
              <div className="admin-field">
                <label htmlFor="tk-note">Afsluttende kommentar til brugeren (vises i beskeden)</label>
                <textarea id="tk-note" className="admin-textarea" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Fx: Problemet er rettet og er med i den nyeste version." />
              </div>
              <div className="admin-field">
                <label htmlFor="tk-test">Hvordan er løsningen testet? (intern)</label>
                <textarea id="tk-test" className="admin-textarea" rows={2} maxLength={1000} value={testNote} onChange={(e) => setTestNote(e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => setClosing(false)}>Annuller</button>
                <button type="button" className="admin-btn admin-btn-primary admin-btn-sm admin-touch" disabled={!note.trim() || busy}
                  onClick={async () => { if (needs && testNote.trim()) await work.saveMeta(t.id, { test_note: testNote.trim() }); onStatus(t, "resolved", note); }}>Markér som løst</button>
              </div>
            </div>
          )}

          <div className="pe-section">Oplysninger</div>
          <dl className="audit-detail">
            <div className="audit-detail-row"><dt>Kategori</dt><dd>{TYPE_LABELS[t.type] || t.type}</dd></div>
            <div className="audit-detail-row"><dt>Kilde</dt><dd>{originLabel(t)}</dd></div>
            <div className="audit-detail-row"><dt>Relevant skærm</dt><dd>{t.context?.screen_label || t.context?.screen || "–"}</dd></div>
            <div className="audit-detail-row"><dt>Oprettet</dt><dd>{fmtLocalFull(t.created_at)}</dd></div>
          </dl>
          <div className="pe-grid">
            <div className="admin-field">
              <label htmlFor="tk-as">Ansvarlig</label>
              <select id="tk-as" className="admin-select" value={todo?.assignee_id || ""} disabled={!todo || busy} onChange={(e) => run(() => work.assign(t.id, e.target.value || null), "Ansvarlig ændret")}>
                <option value="">Ikke tildelt</option>
                {work.admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              {!todo && <div className="usr-hint">Ticketten er ikke knyttet til en opgave på to do-listen endnu.</div>}
            </div>
            <div className="admin-field">
              <label htmlFor="tk-pr">Prioritet</label>
              <select id="tk-pr" className="admin-select" value={pr} disabled={!needs || busy} onChange={(e) => run(() => work.saveMeta(t.id, { priority: e.target.value }), "Prioritet ændret")}>
                {PRIORITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <label className="usr-check"><input type="checkbox" checked={!!meta?.launch_blocking} disabled={!needs || busy} onChange={(e) => run(() => work.saveMeta(t.id, { launch_blocking: e.target.checked }))} /><span>Lanceringsblokerende</span></label>
          <div className="usr-hint" style={{ marginTop: 0 }}>Adskilt fra prioritet: en ticket kan blokere lanceringen uden at være højt prioriteret.</div>
          {isLegalCandidate(t) && !meta?.launch_blocking && <div className="pe-notice pe-amber">Uafsluttet juridisk tekst: gennemgå, om denne ticket skal blokere lanceringen. Det markeres ikke automatisk.</div>}
          {!needs && <div className="usr-hint">Prioritet, lanceringsblokering, tjekliste og verificering kan sættes, når den seneste databaseopdatering er udgivet.</div>}

          <div className="pe-section">Beskrivelse</div>
          <Description text={t.description} />
          {(t.image_path) && getTicketScreenshotUrl && <Screenshot path={t.image_path} getUrl={getTicketScreenshotUrl} />}

          {needs && (
            <>
              <div className="pe-section">Tjekliste{prog.text ? ` · ${prog.text}` : ""}</div>
              {tasks.length === 0 && <div className="pe-muted">Ingen delopgaver.</div>}
              <ul className="tk-tasks">
                {tasks.map((k) => (
                  <li key={k.id}>
                    <span className={`tk-task-t${k.status === "done" ? " done" : ""}`}>{k.title}</span>
                    <select aria-label={`Status for ${k.title}`} className="admin-select tk-task-s" value={k.status} disabled={busy} onChange={(e) => run(() => work.setTaskStatus(t.id, k.id, e.target.value))}>
                      {TASK_STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <button type="button" className="admin-iconbtn" aria-label={`Fjern ${k.title}`} disabled={busy} onClick={() => run(() => work.removeTask(t.id, k.id))}><Icon name="x" size={16} color="var(--ink2)" /></button>
                  </li>
                ))}
              </ul>
              <div className="usr-add">
                <input aria-label="Ny delopgave" value={newTask} maxLength={200} placeholder="Ny delopgave" onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && newTask.trim()) { e.preventDefault(); run(() => work.addTask(t.id, newTask, tasks.length)).then(() => setNewTask("")); } }} />
                <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" disabled={!newTask.trim() || busy} onClick={() => run(() => work.addTask(t.id, newTask, tasks.length)).then(() => setNewTask(""))}>Tilføj</button>
              </div>

              <div className="pe-section">Verificering</div>
              <div className="usr-hint" style={{ marginTop: 0 }}>Implementeret og testet er to forskellige ting. En afsluttet tjekliste eller et løst ticket er ikke en faglig eller juridisk godkendelse.</div>
              {[["implemented", "Implementeret"], ["tested", "Testet"], ["reviewed", "Gennemgået fagligt/juridisk af et menneske"]].map(([k, l]) => (
                <label key={k} className="usr-check"><input type="checkbox" checked={!!meta?.[`${k}_at`]} disabled={busy} onChange={(e) => setStage(k, e.target.checked)} /><span>{l}{meta?.[`${k}_at`] ? ` · ${fmtLocalFull(meta[`${k}_at`])}` : ""}</span></label>
              ))}
              <label className="usr-check"><input type="checkbox" checked={!!meta?.requires_review} disabled={busy} onChange={(e) => run(() => work.saveMeta(t.id, { requires_review: e.target.checked }))} /><span>Kræver faglig eller juridisk gennemgang</span></label>
              {t.status === "resolved" && meta?.requires_review && !meta?.reviewed_at && <div className="pe-notice pe-amber">Løst, men den krævede gennemgang er ikke registreret som udført.</div>}
              {t.status === "resolved" && meta?.launch_blocking && !meta?.tested_at && <div className="pe-notice pe-amber">Lanceringsblokerende og løst, men ikke registreret som testet.</div>}
              <div className="admin-field">
                <label htmlFor="tk-tn">Hvordan er det testet? (intern)</label>
                <textarea id="tk-tn" className="admin-textarea" rows={2} maxLength={1000} value={testNote} onChange={(e) => setTestNote(e.target.value)}
                  onBlur={() => { if ((meta?.test_note || "") !== testNote.trim()) run(() => work.saveMeta(t.id, { test_note: testNote.trim() || null })); }} />
              </div>
            </>
          )}

          <div className="pe-section">Aktivitet</div>
          {todo && (
            <div className="usr-add">
              <input aria-label="Ny kommentar" value={comment} maxLength={2000} placeholder="Skriv en kommentar (kun for administratorer)" onChange={(e) => setComment(e.target.value)} />
              <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" disabled={!comment.trim() || busy} onClick={() => run(() => work.addComment(t.id, comment)).then(() => setComment(""))}>Send</button>
            </div>
          )}
          {detail.loading ? <div className="pe-muted">Henter aktivitet…</div> : !detail.ok ? <div className="pe-muted" role="alert">Aktiviteten kunne ikke hentes helt. <button type="button" className="todo-link-btn" onClick={refresh}>Prøv igen</button></div>
            : activity.length === 0 ? <div className="pe-muted">Ingen registreret aktivitet endnu.</div> : (
              <ul className="pe-history tk-activity">
                {activity.map((a) => (
                  <li key={a.key}><span>{fmtLocalFull(a.at)}{a.actor ? ` · ${a.actor}` : ""}</span><span>{a.body ? <><b>Kommentar:</b> {a.body}</> : a.text}</span></li>
                ))}
              </ul>
            )}

          <Disclosure title="Tekniske oplysninger">
            <dl className="audit-detail">
              <div className="audit-detail-row"><dt>Ticket-id</dt><dd className="np-mono">{t.id}</dd></div>
              <div className="audit-detail-row"><dt>Indsender</dt><dd>{ticketReporter(t)}{t.context?.user_email ? ` (${t.context.user_email})` : ""}</dd></div>
              <div className="audit-detail-row"><dt>Kilde (teknisk)</dt><dd>{t.context?.source || "–"}</dd></div>
              <div className="audit-detail-row"><dt>Enhed</dt><dd>{t.context?.browser || t.context?.user_agent || t.context?.platform || "–"}</dd></div>
              <div className="audit-detail-row"><dt>URL</dt><dd className="np-mono">{t.context?.url || "–"}</dd></div>
              <div className="audit-detail-row"><dt>Build</dt><dd>{t.context?.commit_sha || "–"}</dd></div>
            </dl>
          </Disclosure>
        </div>

        <div className="todo-panel-foot">
          <button type="button" className="admin-btn admin-btn-ghost admin-touch" onClick={() => onCopy(t)}>Kopiér prompt</button>
          {t.status === "resolved" ? (
            <button type="button" className="admin-btn admin-btn-primary admin-touch todo-spacer" onClick={() => onStatus(t, "open")}>Genåbn</button>
          ) : (
            <>
              <select aria-label="Status" className="admin-select tk-foot-status todo-spacer" value={t.status} onChange={(e) => { if (e.target.value === "resolved") setClosing(true); else onStatus(t, e.target.value); }}>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
