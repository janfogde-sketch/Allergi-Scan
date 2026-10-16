// @ts-nocheck
// Opret/rediger et leksikonopslag (samme formular til begge). Sektioner: Grundoplysninger | Faglige oplysninger | Supplerende oplysninger | Kilder og dokumentation | Administration.
// Felterne afhænger af kategorien, men data skjules aldrig. Fast bundbjælke (Annuller / Gem), advarsel ved ikke-gemte ændringer, forhåndsvisning og Slet opslag adskilt og bekræftet.
// Eksisterende slugs er links og låses; nye opslag får slug ud fra titlen. Fagligt indhold omskrives eller oprettes aldrig automatisk.
import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactDOM from "react-dom";
import { Icon } from "../../SharedComponents.jsx";
import Disclosure from "../Disclosure.jsx";
import { fmtAuditDateTime } from "../auditLogic.js";
import {
  KB_CATEGORIES, KB_CATEGORY_SINGULAR, EDITORIAL, fieldLabel, showField, categoryChangeLoss, slugFromTitle, slugify, missingInfo, entryDirty, validateEntry, sourceLabel,
} from "../knowledgeLogic.js";
import { ChipList, RelationPicker, EmojiPicker } from "./knowledgeParts.jsx";
import CloseX from "../CloseX.jsx";

const FIELD_NAMES = { title: "titel", summary: "resumé", description: "beskrivelse", health_notes: "sundhedsnoter", status_label: "faglig klassifikation", category: "kategori", slug: "slug", sources: "kilder", allergen_ids: "tilknyttede allergener", found_in: "findes i", alternatives: "alternativer", diet_tags: "kost-tags", aliases: "aliaser", tags: "søgetags", editorial_status: "redaktionel status", published: "udgivelse", sort_order: "sortering" };

function History({ loadHistory, id }) {
  const [s, setS] = useState({ status: "loading", rows: [] });
  const load = async () => { setS({ status: "loading", rows: [] }); const r = await loadHistory(id); setS(r.ok ? { status: "ok", rows: r.rows } : { status: "error", rows: [] }); };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps -- hentes ved åbning */ }, [id]);
  if (s.status === "loading") return <div className="pe-muted">Henter historik…</div>;
  if (s.status === "error") return <div className="pe-muted" role="alert">Historikken kunne ikke hentes. <button type="button" className="todo-link-btn" onClick={load}>Prøv igen</button></div>;
  if (s.rows.length === 0) return <div className="pe-muted">Ingen registrerede rettelser i aktivitetsloggen.</div>;
  return (
    <ul className="pe-history">
      {s.rows.map((r, i) => {
        const f = Array.isArray(r.details?.felter) ? r.details.felter.map((x) => FIELD_NAMES[x] || x).join(", ") : "";
        return <li key={i}><span>{fmtAuditDateTime(r.created_at)}</span><span>{f ? `Rettede ${f}` : "Rettet"}</span></li>;
      })}
    </ul>
  );
}

function Preview({ e, onClose }) {
  useEffect(() => { const k = (ev) => { if (ev.key === "Escape") onClose(); }; document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [onClose]);
  return ReactDOM.createPortal(
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal todo-panel pe-panel" role="dialog" aria-modal="true" aria-label="Forhåndsvisning" onClick={(ev) => ev.stopPropagation()}>
        <div className="todo-panel-head">
          <div><div className="audit-sheet-title">Forhåndsvisning</div><div className="audit-sheet-time">Sådan ser opslaget cirka ud i appen</div></div>
          <CloseX onClick={onClose} />
        </div>
        <div className="todo-panel-body kb-preview">
          <div className="kb-pv-cat">{KB_CATEGORY_SINGULAR[e.category] || e.category}</div>
          <h2 className="kb-pv-title">{e.emoji ? `${e.emoji} ` : ""}{e.title || "Uden titel"}</h2>
          {e.status_label && <div className="kb-pv-status"><Icon name="info" size={11} color="var(--ink2)" /> {e.status_label}</div>}
          {e.summary && <p className="kb-pv-sum">{e.summary}</p>}
          {e.description && <p className="kb-pv-desc">{e.description}</p>}
          {e.health_notes && <div className="kb-pv-note"><b>{e.category === "cross_reaction" ? "Forbehold" : "Sundhedsnoter"}</b><div>{e.health_notes}</div></div>}
          {e.found_in?.length > 0 && <div className="kb-pv-list"><b>Findes i:</b> {e.found_in.join(", ")}</div>}
          {e.alternatives?.length > 0 && <div className="kb-pv-list"><b>Alternativer:</b> {e.alternatives.join(", ")}</div>}
          {e.sources?.length > 0 && <div className="kb-pv-list"><b>Kilder:</b> {e.sources.map(sourceLabel).join(", ")}</div>}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function KnowledgeEditor({ entryId, isNew, initial, orig, meta, hasEditorial, reviewer, loadHistory, onSave, onDelete, onClose, busy, saveError }) {
  const [e, setE] = useState(initial);
  const [touched, setTouched] = useState(false);
  const [confirm, setConfirm] = useState(null); // "discard" | "delete"
  const [ack, setAck] = useState(false);
  const [slugEdit, setSlugEdit] = useState(false);
  const [slugAck, setSlugAck] = useState(false);
  const [catWarn, setCatWarn] = useState(null);
  const [preview, setPreview] = useState(false);
  const closeRef = useRef(null);

  const dirty = entryDirty(orig, e);
  const errors = useMemo(() => validateEntry(e, isNew), [e, isNew]);
  const missing = useMemo(() => missingInfo(e), [e]);
  const err = (k) => (touched ? errors[k] : undefined) || (saveError?.field === k ? saveError.error : undefined);
  const set = (patch) => setE((s) => ({ ...s, ...patch }));

  const requestClose = () => { if (dirty && !busy) setConfirm("discard"); else if (!busy) onClose(); };
  closeRef.current = requestClose;
  useEffect(() => { const k = (ev) => { if (ev.key === "Escape" && !preview) closeRef.current(); }; document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [preview]);
  useEffect(() => {
    if (!dirty) return undefined;
    const w = (ev) => { ev.preventDefault(); ev.returnValue = ""; };
    window.addEventListener("beforeunload", w);
    return () => window.removeEventListener("beforeunload", w);
  }, [dirty]);

  const onTitle = (title) => setE((s) => ({ ...s, title, ...(isNew && !s.slugTouched ? { slug: slugFromTitle(title) } : {}) }));
  const changeCategory = (cat) => {
    if (cat === e.category) return;
    const loss = categoryChangeLoss(e, cat);
    if (loss.length) setCatWarn({ cat, fields: loss }); else set({ category: cat });
  };
  const save = () => { setTouched(true); if (Object.keys(errors).length === 0) onSave(e); };

  const sec = (title) => <div className="pe-section">{title}</div>;
  const cat = e.category;

  return ReactDOM.createPortal(
    <div className="admin-modal-overlay" onClick={requestClose}>
      <div className="admin-modal todo-panel pe-panel" role="dialog" aria-modal="true" aria-labelledby="kb-title" onClick={(ev) => ev.stopPropagation()}>
        <div className="todo-panel-head">
          <div style={{ minWidth: 0 }}>
            <div id="kb-title" className="audit-sheet-title">{isNew ? "Nyt opslag" : "Rediger opslag"}</div>
            <div className="audit-sheet-time">{e.emoji ? `${e.emoji} ` : ""}{e.title || "Uden titel"} · {KB_CATEGORY_SINGULAR[cat] || cat}</div>
          </div>
          <CloseX onClick={requestClose} />
        </div>

        <div className="todo-panel-body">
          {confirm === "discard" && (
            <div className="todo-confirm" role="alertdialog" aria-label="Ikke-gemte ændringer" style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Du har ændringer, der ikke er gemt.</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => setConfirm(null)}>Bliv og ret</button>
                <button type="button" className="admin-btn admin-btn-danger admin-btn-sm admin-touch" onClick={() => { setConfirm(null); onClose(); }}>Kassér ændringer</button>
              </div>
            </div>
          )}
          {saveError && !saveError.field && <div className="pe-notice pe-red" role="alert">{saveError.error}</div>}
          {!isNew && missing.length > 0 && <div className="pe-notice pe-amber">Mangler: {missing.join(", ")}.</div>}
          {hasEditorial && orig.editorial_status === "approved" && e.editorial_status === "approved" && dirty && <div className="pe-notice pe-amber">Ændres fagligt indhold i et godkendt opslag, sættes det tilbage til "Afventer gennemgang".</div>}

          {sec("Grundoplysninger")}
          <div className="admin-field">
            <label htmlFor="kb-t">{fieldLabel(cat, "title")}</label>
            <input id="kb-t" value={e.title} aria-invalid={!!err("title")} onChange={(ev) => onTitle(ev.target.value)} />
            {err("title") && <div className="usr-err" role="alert">{err("title")}</div>}
          </div>
          <div className="pe-grid">
            <div className="admin-field">
              <label htmlFor="kb-c">Kategori</label>
              <select id="kb-c" className="admin-select" value={cat} onChange={(ev) => changeCategory(ev.target.value)}>
                {KB_CATEGORIES.map(([v, l]) => <option key={v} value={v}>{KB_CATEGORY_SINGULAR[v]}</option>)}
              </select>
            </div>
            <EmojiPicker value={e.emoji} onChange={(emoji) => set({ emoji })} />
          </div>
          {catWarn && (
            <div className="todo-confirm" role="alertdialog" aria-label="Skift kategori">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Skift kategori til {KB_CATEGORY_SINGULAR[catWarn.cat]}?</div>
              <div style={{ fontSize: 12.5, marginBottom: 8 }}>Disse felter bruges ikke af den nye kategori, men indholdet slettes ikke og kan stadig ses og rettes: {catWarn.fields.map((f) => FIELD_NAMES[f] || f).join(", ")}.</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => setCatWarn(null)}>Annuller</button>
                <button type="button" className="admin-btn admin-btn-primary admin-btn-sm admin-touch" onClick={() => { set({ category: catWarn.cat }); setCatWarn(null); }}>Skift kategori</button>
              </div>
            </div>
          )}
          <div className="admin-field">
            <label htmlFor="kb-s">{fieldLabel(cat, "summary")}</label>
            <input id="kb-s" value={e.summary} onChange={(ev) => set({ summary: ev.target.value })} placeholder="Kort, én linje" />
          </div>
          {showField(e, "description") && (
            <div className="admin-field">
              <label htmlFor="kb-d">{fieldLabel(cat, "description")}</label>
              <textarea id="kb-d" className="admin-textarea" rows={5} value={e.description} onChange={(ev) => set({ description: ev.target.value })} />
            </div>
          )}

          {(showField(e, "health_notes") || showField(e, "status_label") || showField(e, "allergen_ids")) && sec("Faglige oplysninger")}
          {showField(e, "status_label") && (
            <div className="admin-field">
              <label htmlFor="kb-st">{fieldLabel(cat, "status_label")}</label>
              <input id="kb-st" value={e.status_label} onChange={(ev) => set({ status_label: ev.target.value })} placeholder="Fx Fødevareallergi eller Intolerance – ikke allergi" />
              <div className="usr-hint">Vises i appen som faglig status. Skriv kun, hvad der er fagligt belagt; det er ikke den redaktionelle status.</div>
            </div>
          )}
          {showField(e, "health_notes") && (
            <div className="admin-field">
              <label htmlFor="kb-h">{fieldLabel(cat, "health_notes")}</label>
              <textarea id="kb-h" className="admin-textarea" rows={3} value={e.health_notes} onChange={(ev) => set({ health_notes: ev.target.value })} />
              {cat === "cross_reaction" && <div className="usr-hint">Beskriv, om reaktionen er gensidig, hvem den er relevant for, og hvilke forbehold der gælder. En krydsreaktion gælder ikke alle personer og er ikke lige sandsynlig.</div>}
            </div>
          )}
          {showField(e, "allergen_ids") && <RelationPicker label={fieldLabel(cat, "allergen_ids")} selected={e.allergen_ids} onChange={(v) => set({ allergen_ids: v })} />}

          {["found_in", "alternatives", "diet_tags", "aliases", "tags"].some((f) => showField(e, f)) && (
            <Disclosure title="Supplerende oplysninger" defaultOpen={["found_in", "alternatives", "diet_tags", "aliases", "tags"].some((f) => e[f]?.length)}>
              {showField(e, "found_in") && <ChipList id="kb-fi" label={fieldLabel(cat, "found_in")} values={e.found_in} onChange={(v) => set({ found_in: v })} placeholder="Fx Bagværk" />}
              {showField(e, "alternatives") && <ChipList id="kb-al" label={fieldLabel(cat, "alternatives")} values={e.alternatives} onChange={(v) => set({ alternatives: v })} placeholder="Fx Agar-agar" />}
              {showField(e, "diet_tags") && <ChipList id="kb-di" label={fieldLabel(cat, "diet_tags")} values={e.diet_tags} onChange={(v) => set({ diet_tags: v })} placeholder="Fx vegansk" />}
              {showField(e, "aliases") && <ChipList id="kb-ai" label={fieldLabel(cat, "aliases")} values={e.aliases} onChange={(v) => set({ aliases: v })} placeholder="Andre navne og stavemåder" />}
              {showField(e, "tags") && <ChipList id="kb-ta" label={fieldLabel(cat, "tags")} values={e.tags} onChange={(v) => set({ tags: v })} placeholder="Søgeord" />}
            </Disclosure>
          )}

          {sec("Kilder og dokumentation")}
          <ChipList id="kb-so" label="Kilder" kind="url" values={e.sources} onChange={(v) => set({ sources: v })} placeholder="https://…" error={err("sources")}
            hint="Én adresse pr. kilde. Udgiveren vises ud fra adressen." />
          {meta?.tipsCount > 0 && <div className="usr-hint">Opslaget har {meta.tipsCount} godkendt{meta.tipsCount === 1 ? "" : "e"} tip, der bruges som dagens tip i appen. De redigeres ikke her og bevares uændret.</div>}

          {sec("Administration")}
          {hasEditorial ? (
            <>
              <div className="admin-field">
                <label htmlFor="kb-ed">Redaktionel status</label>
                <select id="kb-ed" className="admin-select" value={e.editorial_status || ""} aria-invalid={!!err("editorial_status")} onChange={(ev) => set({ editorial_status: ev.target.value })}>
                  <option value="">Ikke gennemgået</option>
                  {EDITORIAL.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                {err("editorial_status") && <div className="usr-err" role="alert">{err("editorial_status")}</div>}
                <div className="usr-hint">Intet bliver godkendt af sig selv. "Godkendt" kræver resumé og mindst én kilde.</div>
              </div>
              <label className="usr-check"><input type="checkbox" checked={e.published !== false} onChange={(ev) => set({ published: ev.target.checked })} /><span>Vist for brugerne i appen</span></label>
              {e.published === false && <div className="usr-hint">Opslaget er skjult for brugerne, men kan stadig ses her.</div>}
              {!isNew && meta?.reviewed_at && <dl className="audit-detail"><div className="audit-detail-row"><dt>Seneste gennemgang</dt><dd>{fmtAuditDateTime(meta.reviewed_at, true)}{reviewer ? ` · ${reviewer}` : ""}</dd></div></dl>}
            </>
          ) : (
            <div className="usr-hint">Redaktionel status og udgivelse kan sættes, når den seneste databaseopdatering er udgivet.</div>
          )}
          <Disclosure title="Avancerede indstillinger">
            <div className="admin-field">
              <label htmlFor="kb-sl">Slug</label>
              <input id="kb-sl" value={e.slug} readOnly={!isNew && !slugEdit} aria-invalid={!!err("slug")} onChange={(ev) => set({ slug: slugify(ev.target.value), slugTouched: true })} />
              {err("slug") && <div className="usr-err" role="alert">{err("slug")}</div>}
              <div className="usr-hint">Sluggen indgår i links til opslaget (dybe links, links fra scanresultater og dagens tip). Den dannes af titlen ved nye opslag.</div>
              {!isNew && !slugEdit && <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => setSlugEdit("ask")}>Rediger slug…</button>}
              {slugEdit === "ask" && (
                <div className="todo-confirm" role="alertdialog" aria-label="Rediger slug">
                  <div style={{ fontSize: 12.5, marginBottom: 8 }}>Ændres sluggen, holder eksisterende links til opslaget op med at virke.</div>
                  <label className="usr-check"><input type="checkbox" checked={slugAck} onChange={(ev) => setSlugAck(ev.target.checked)} /><span>Jeg forstår det.</span></label>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => { setSlugEdit(false); setSlugAck(false); }}>Annuller</button>
                    <button type="button" className="admin-btn admin-btn-primary admin-btn-sm admin-touch" disabled={!slugAck} onClick={() => setSlugEdit(true)}>Lås op</button>
                  </div>
                </div>
              )}
            </div>
            <div className="admin-field">
              <label htmlFor="kb-so2">Sortering</label>
              <input id="kb-so2" type="number" value={e.sort_order} onChange={(ev) => set({ sort_order: Number(ev.target.value) || 0 })} />
              <div className="usr-hint">Lavere tal står først i listen. Opslag med samme tal sorteres efter titel.</div>
            </div>
          </Disclosure>
          {!isNew && <Disclosure title="Rettelseshistorik"><History loadHistory={loadHistory} id={entryId} /></Disclosure>}
          {!isNew && <Disclosure title="Tekniske oplysninger"><dl className="audit-detail"><div className="audit-detail-row"><dt>Opslags-id</dt><dd className="np-mono">{entryId}</dd></div></dl></Disclosure>}

          {!isNew && (
            <div className="pe-danger">
              {confirm !== "delete" ? (
                <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch pe-del" disabled={busy} onClick={() => { setConfirm("delete"); setAck(false); }}>Slet opslag</button>
              ) : (
                <div className="todo-confirm" role="alertdialog" aria-label="Slet opslag">
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Slet “{e.title}” permanent?</div>
                  <div style={{ fontSize: 12.5, marginBottom: 8 }}>Opslaget fjernes fra leksikonet i appen, og links til det holder op med at virke. Det kan ikke fortrydes.</div>
                  <label className="usr-check"><input type="checkbox" checked={ack} onChange={(ev) => setAck(ev.target.checked)} /><span>Jeg forstår, at opslaget slettes permanent.</span></label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" disabled={busy} onClick={() => setConfirm(null)}>Annuller</button>
                    <button type="button" className="admin-btn admin-btn-danger admin-btn-sm admin-touch" disabled={busy || !ack} onClick={onDelete}>{busy ? "Sletter…" : "Slet opslag"}</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="todo-panel-foot">
          <button type="button" className="admin-btn admin-btn-ghost admin-touch" disabled={busy} onClick={requestClose}>Annuller</button>
          <button type="button" className="admin-btn admin-btn-ghost admin-touch" onClick={() => setPreview(true)}>Forhåndsvis</button>
          <button type="button" className="admin-btn admin-btn-primary admin-touch todo-spacer" disabled={busy || (!dirty && !isNew)} onClick={save}>{busy ? "Gemmer…" : isNew ? "Opret opslag" : "Gem ændringer"}</button>
        </div>
        {preview && <Preview e={e} onClose={() => setPreview(false)} />}
      </div>
    </div>,
    document.body
  );
}
