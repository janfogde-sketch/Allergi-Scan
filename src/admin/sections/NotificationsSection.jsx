// @ts-nocheck
// Notifikationer: foldbare kategorier, en separat redigeringsvisning (på mobil som egen visning med tilbagepil, på bred skærm ved siden af) og tre faner:
// Push (tekst, variabler, tegntællere, forhåndsvisning, gem/gendan med konfliktkontrol), Mail (emne, skabelon, forhåndsvisning fra Resend) og Send test.
// Ikke-gemte ændringer er beskyttet, og en fejl fremstår aldrig som en vellykket gemning eller afsendelse.
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { Icon, showToast } from "../../SharedComponents.jsx";
import { useShowSpinner } from "../RefreshContext.js";
import Disclosure from "../Disclosure.jsx";
import CloseX from "../CloseX.jsx";
import {
  listNotifications, defaultPush, previewPush, overrideIsActive, validatePushOverride, pushVariablesFor, VARIABLE_LABELS,
  PUSH_TITLE_MAX, PUSH_BODY_MAX, resendTemplateUrl, insertVariableAt, sameText, summarizeTest, prepareMailPreview, MAIL_TEMPLATE_NAMES, isSentFromRepo,
} from "../notificationAdminLogic.js";

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

function PushPreview({ title, body, saved }) {
  return (
    <div className="np-push" aria-label="Forhåndsvisning af push">
      <div className="np-push-head"><span>EATSAFE · NU</span><span className="np-push-tag">{saved ? "Gemt tekst" : "Ikke gemt · eksempel"}</span></div>
      <div className="np-push-title">{title || "—"}</div>
      <div className="np-push-body">{body || "—"}</div>
    </div>
  );
}

/** Bekræftelsesdialog (X lukker, Escape annullerer, fokus på første knap). */
function Confirm({ title, text, confirmLabel, cancelLabel = "Annuller", danger, busy, onCancel, onConfirm }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !busy) onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel, busy]);
  return ReactDOM.createPortal(
    <div className="admin-modal-overlay" onClick={() => !busy && onCancel()}>
      <div className="admin-modal audit-sheet-safe" role="alertdialog" aria-modal="true" aria-labelledby="np-confirm-title" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="audit-sheet-head">
          <div id="np-confirm-title" className="audit-sheet-title">{title}</div>
          <CloseX onClick={onCancel} disabled={busy} />
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--ink2)" }}>{text}</div>
        <div className="err-actions">
          <button type="button" ref={ref} className="admin-btn admin-btn-ghost admin-touch" disabled={busy} onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={`admin-btn ${danger ? "admin-btn-danger" : "admin-btn-primary"} admin-touch`} disabled={busy} onClick={onConfirm}>{busy ? "Arbejder…" : confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Diskret informationsknap (samme mønster som AI-forbrug), der folder en kort forklaring ud. */
function InfoTip({ label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="ai-info-btn np-info-btn" aria-label={label} aria-expanded={open} onClick={() => setOpen((v) => !v)}><Icon name="info" size={16} color="var(--muted)" /></button>
      {open && <div className="ai-note" role="note">{children}</div>}
    </>
  );
}

/** Tæller: skabelonens længde mod grænsen, og længden med eksempeldata. */
function Counter({ id, value, max, rendered }) {
  const over = value > max;
  return (
    <span id={id} className={`np-count${over ? " over" : ""}`} aria-live="polite">
      {value}/{max}{rendered !== null && rendered !== value ? ` · ca. ${rendered} med eksempeldata` : ""}{over ? " · for lang" : ""}
    </span>
  );
}

function PushTab({ k, def, saved, draft, setDraft, check, dirty, isDefault, vars, onSave, onReset, saving, conflict, reload }) {
  const titleRef = useRef(null);
  const bodyRef = useRef(null);
  const lastField = useRef("body");
  const toSave = isDefault ? { title: "", body: "" } : draft;
  const preview = check.ok ? previewPush(k, toSave.title || toSave.body ? toSave : { title: "", body: "" }) : null;
  const insert = (name) => {
    const field = lastField.current;
    const el = field === "title" ? titleRef.current : bodyRef.current;
    const cur = draft[field];
    const { text, cursor } = insertVariableAt(cur, el?.selectionStart ?? cur.length, el?.selectionEnd ?? cur.length, name);
    setDraft((d) => ({ ...d, [field]: text }));
    requestAnimationFrame(() => { if (el) { el.focus(); el.setSelectionRange(cursor, cursor); } });
  };
  const titleLen = draft.title.length, bodyLen = draft.body.length;
  const rTitle = previewPush(k, { title: draft.title, body: "" }).title.length;
  const rBody = previewPush(k, { title: "", body: draft.body }).body.length;
  return (
    <div>
      {conflict && (
        <div className="error-box" role="alert" style={{ marginBottom: 10, fontSize: 13 }}>
          {conflict} <button type="button" className="todo-link-btn" style={{ textDecoration: "underline" }} onClick={reload}>Hent den nyeste tekst</button>
        </div>
      )}
      <div className="admin-field">
        <div className="np-field-head"><label htmlFor="np-title">Titel</label><Counter id="np-title-count" value={titleLen} max={PUSH_TITLE_MAX} rendered={vars.length ? rTitle : null} /></div>
        <input id="np-title" ref={titleRef} value={draft.title} aria-describedby="np-title-count" onFocus={() => { lastField.current = "title"; }} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
      </div>
      <div className="admin-field">
        <div className="np-field-head"><label htmlFor="np-body">Besked</label><Counter id="np-body-count" value={bodyLen} max={PUSH_BODY_MAX} rendered={vars.length ? rBody : null} /></div>
        <textarea id="np-body" ref={bodyRef} className="admin-textarea" style={{ minHeight: 76 }} value={draft.body} aria-describedby="np-body-count" onFocus={() => { lastField.current = "body"; }} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} />
      </div>
      {vars.length > 0 && (
        <div className="np-vars">
          <span className="np-vars-label">Indsæt variabel ved markøren:</span>
          {vars.map((v) => (
            <button key={v} type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => insert(v)} title={`{{${v}}}`}>{VARIABLE_LABELS[v] ?? v}</button>
          ))}
        </div>
      )}
      {!check.ok && <div className="error-box" role="alert" style={{ marginBottom: 10, fontSize: 13 }}>{check.error}</div>}
      <div className="admin-label" style={{ marginTop: 4 }}>Forhåndsvisning</div>
      {preview && <PushPreview title={preview.title} body={preview.body} saved={!dirty} />}
      <div className="np-actions">
        <button type="button" className="admin-btn admin-btn-primary admin-touch" onClick={onSave} disabled={saving || !dirty || !check.ok}>{saving ? "Gemmer…" : "Gem push-tekst"}</button>
        <button type="button" className="admin-btn admin-btn-ghost admin-touch" onClick={onReset} disabled={saving || (isDefault && !overrideIsActive(saved))}>Gendan standard</button>
        {dirty && <span className="np-dirty" role="status">Ikke gemt</span>}
      </div>
      <div className="np-note">Pushbeskeden fører til den fulde besked i appen. Mail og appbesked ændres ikke her.
        <InfoTip label="Om forhåndsvisningen">Forhåndsvisningen bruger opdigtede eksempeldata. Hvor meget af teksten der vises, afhænger af enhed og styresystem.</InfoTip></div>
    </div>
  );
}

function MailTab({ k, selected, recipient, loadMailPreview }) {
  const [state, setState] = useState({ state: "idle" });
  const [mode, setMode] = useState("light");
  const [big, setBig] = useState(false);
  const [bigKey, setBigKey] = useState(0); // ny ramme ved hver åbning, så mailen starter fra toppen
  const [attempt, setAttempt] = useState(0);
  const templateUrl = resendTemplateUrl(k);
  useEffect(() => {
    if (!templateUrl) { setState({ state: "none" }); return undefined; }
    let cancelled = false;
    setState({ state: "loading" });
    loadMailPreview(k, recipient)
      .then((d) => { if (!cancelled) setState({ state: "ok", html: d.html, status: d.status, templateId: d.templateId }); })
      .catch((e) => { if (!cancelled) setState({ state: "error", error: e.message }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bevidst: hentes kun ved skift af besked, modtager eller nyt forsøg; loadMailPreview genskabes hver gang
  }, [k, recipient, templateUrl, attempt]);
  useEffect(() => {
    if (!big) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setBig(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [big]);
  const srcDoc = useMemo(() => (state.state === "ok" ? prepareMailPreview(state.html, mode, window.location.origin) : ""), [state, mode]);
  const frame = (h, cls, key) => <iframe key={key} title={`Mail: ${selected.name}`} sandbox="" srcDoc={srcDoc} className={cls} style={{ height: h }} />;
  const mail = selected.def.mail;
  const fromRepo = isSentFromRepo(k);
  if (!mail) return <StateBox icon="mail" title="Ingen mail" text="Denne notifikation sendes kun som push og besked i appen." />;
  return (
    <div>
      <dl className="audit-detail">
        <div className="audit-detail-row"><dt>Emne</dt><dd>{mail.subject}</dd></div>
        <div className="audit-detail-row"><dt>Skabelon</dt><dd>{MAIL_TEMPLATE_NAMES[k] ?? selected.name}</dd></div>
        <div className="audit-detail-row"><dt>Rettes i</dt><dd>{fromRepo ? "Kildefilen i projektet (sendes direkte)" : "Resend"}{templateUrl && !fromRepo && <> · <a href={templateUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)", fontWeight: 600 }}>Åbn skabelonen</a></>}</dd></div>
      </dl>
      <div className="np-modes" role="group" aria-label="Visning">
        {[["light", "Lys"], ["dark", "Mørk"]].map(([m, label]) => (
          <button key={m} type="button" aria-pressed={mode === m} className={`admin-btn admin-btn-sm admin-touch ${mode === m ? "admin-btn-primary" : "admin-btn-ghost"}`} onClick={() => setMode(m)}>{label}</button>
        ))}
        {state.state === "ok" && <button type="button" className="todo-link-btn np-bigbtn" onClick={() => { setBigKey((n) => n + 1); setBig(true); }}>Åbn større visning</button>}
      </div>
      {state.state === "loading" && <div className="admin-loading-row"><div className="admin-spinner" /> Henter mailen…</div>}
      {state.state === "error" && <StateBox role="alert" icon="warning" title="Mailen kunne ikke vises" text={`Forhåndsvisningen kunne ikke hentes. ${state.error}`} action={<button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => setAttempt((n) => n + 1)}>Prøv igen</button>} />}
      {state.state === "ok" && (
        <>
          {frame(420, "np-frame")}
          <div className="np-note">Visningen bruger eksempeldata. Den endelige visning kan variere mellem mailklienter.</div>
        </>
      )}
      <Disclosure title="Tekniske oplysninger">
        <dl className="audit-detail">
          <div className="audit-detail-row"><dt>Notifikation</dt><dd className="np-mono">{k}</dd></div>
          <div className="audit-detail-row"><dt>Skabelon-id</dt><dd className="np-mono">{fromRepo ? "–" : state.templateId || (templateUrl || "").split("/").pop() || "–"}</dd></div>
          <div className="audit-detail-row"><dt>Kilde</dt><dd>{fromRepo ? "Visningen er bygget af kildefilen i projektet, som også bruges ved afsendelse." : "Visningen hentes fra den publicerede skabelon i Resend. Kildefilerne i projektet kan afvige, hvis Resend er rettet eller ikke opdateret."}</dd></div>
          <div className="audit-detail-row"><dt>Lys/mørk</dt><dd>Efterligner mailklienternes mørke tilstand med skabelonens egne regler. Gmail og Outlook til Windows vender selv farverne.</dd></div>
          {state.status && state.status !== "published" && <div className="audit-detail-row"><dt>Status</dt><dd>Skabelonen er {state.status}, ikke publiceret.</dd></div>}
        </dl>
      </Disclosure>
      {big && ReactDOM.createPortal(
        <div className="admin-modal-overlay" onClick={() => setBig(false)}>
          <div className="admin-modal todo-panel np-big" role="dialog" aria-modal="true" aria-label="Mail i større visning" onClick={(e) => e.stopPropagation()}>
            <div className="todo-panel-head">
              <div className="audit-sheet-title">{selected.name}</div>
              <CloseX onClick={() => setBig(false)} />
            </div>
            <div className="np-big-body">{frame("100%", "np-frame np-frame-big", bigKey)}</div>
          </div>
        </div>, document.body)}
    </div>
  );
}

function TestTab({ k, selected, admins, recipient, setRecipient, draft, dirty, check, sendTest }) {
  const [channels, setChannels] = useState({ push: true, mail: !!selected.def.mail });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const guard = useRef(false);
  useEffect(() => { setResult(null); setChannels({ push: true, mail: !!selected.def.mail }); }, [k, selected.def.mail]);
  const chosen = Object.keys(channels).filter((c) => channels[c]);
  const who = admins.find((a) => a.id === recipient);
  const run = async () => {
    if (guard.current) return; // dobbelttryk: kun ét kald ad gangen
    guard.current = true;
    setSending(true);
    const res = await sendTest(k, recipient, chosen, dirty && check.ok ? draft : null);
    setSending(false);
    setConfirmOpen(false);
    guard.current = false;
    if (!res.ok) { setResult({ error: res.error }); return; }
    setResult({ ...summarizeTest(res.data, chosen), usedDraft: res.data.usedDraft, dirty });
  };
  return (
    <div>
      <div className="np-note" style={{ marginTop: 0 }}>Sender en testversion med opdigtede eksempeldata (mærket [TEST]) til den valgte administrator. Der oprettes ingen besked i appen, og den faktiske hændelse udløses ikke.</div>
      <div className="admin-field" style={{ maxWidth: 360 }}>
        <label htmlFor="np-recipient">Modtager (administrator)</label>
        <select id="np-recipient" className="admin-select" value={recipient} onChange={(e) => setRecipient(e.target.value)}>
          {admins.map((a) => <option key={a.id} value={a.id}>{a.name ? `${a.name} (${a.email})` : a.email}</option>)}
        </select>
      </div>
      <div className="np-channels" role="group" aria-label="Kanaler">
        <label><input type="checkbox" id="np-ch-push" checked={channels.push} onChange={(e) => setChannels((c) => ({ ...c, push: e.target.checked }))} /> Push</label>
        <label><input type="checkbox" id="np-ch-mail" checked={channels.mail} disabled={!selected.def.mail} onChange={(e) => setChannels((c) => ({ ...c, mail: e.target.checked }))} /> Mail{!selected.def.mail && " (ingen mail)"}</label>
      </div>
      <dl className="audit-detail">
        <div className="audit-detail-row"><dt>Notifikation</dt><dd>{selected.name}</dd></div>
        <div className="audit-detail-row"><dt>Modtager</dt><dd>{who ? (who.name || who.email) : "Ingen valgt"}</dd></div>
        <div className="audit-detail-row"><dt>Kanaler</dt><dd>{chosen.length ? chosen.map((c) => (c === "push" ? "Push" : "Mail")).join(" og ") : "Ingen valgt"}</dd></div>
        <div className="audit-detail-row"><dt>Data</dt><dd>Opdigtede eksempeldata{dirty ? " · pushen bruger din ikke-gemte tekst" : ""}</dd></div>
      </dl>
      {!check.ok && <div className="error-box" role="alert" style={{ marginBottom: 10, fontSize: 13 }}>Ret pushteksten først: {check.error}</div>}
      <button type="button" className="admin-btn admin-btn-primary admin-touch" onClick={() => setConfirmOpen(true)} disabled={sending || !recipient || chosen.length === 0 || !check.ok}>Send test…</button>
      {result?.error && <div className="error-box" role="alert" style={{ marginTop: 12, fontSize: 13 }}>Testen mislykkedes: {result.error}</div>}
      {result?.lines && (
        <div className={`np-result ${result.overall}`} role="status">
          <div className="np-result-title">{result.overall === "ok" ? "Testen er afsendt" : result.overall === "partial" ? "Delvist afsendt – ikke alt lykkedes" : "Testen blev ikke afsendt"}</div>
          {result.lines.map((l) => <div key={l.channel} className={l.ok ? "" : "bad"}><strong>{l.status}</strong> · {l.text}</div>)}
          {result.dirty && !result.usedDraft && <div className="bad">Bemærk: serveren brugte den gemte pushtekst, ikke din ikke-gemte (den nyeste serverversion er ikke udgivet endnu).</div>}
        </div>
      )}
      {confirmOpen && (
        <Confirm title="Send test?" confirmLabel="Send test" busy={sending} onCancel={() => setConfirmOpen(false)} onConfirm={run}
          text={`Der sendes en [TEST]-version af “${selected.name}” til ${who ? (who.name || who.email) : "modtageren"} (${chosen.map((c) => (c === "push" ? "push" : "mail")).join(" og ")}).`} />
      )}
    </div>
  );
}

function Editor({ k, selected, props, dirtyRef, onBack }) {
  const { overrides, admins, savePush, sendTest, loadMailPreview, load, userId } = props;
  const saved = overrides[k];
  const def = defaultPush(k);
  const initial = { title: saved?.title ?? def.title, body: saved?.body ?? def.body };
  const [draft, setDraft] = useState(initial);
  const [tab, setTab] = useState("push");
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [recipient, setRecipient] = useState("");
  const base = useRef(saved?.updated_at ?? null); // den version, administratoren åbnede
  useEffect(() => { if (!recipient && admins.length) setRecipient(admins.find((a) => a.id === userId)?.id ?? admins[0].id); }, [admins, userId, recipient]);

  const isDefault = sameText(draft, def);
  const toSave = isDefault ? { title: "", body: "" } : draft;
  const check = validatePushOverride(k, toSave);
  const dirty = isDefault ? overrideIsActive(saved) : !sameText(draft, initial);
  dirtyRef.current = dirty;
  const vars = pushVariablesFor(k);

  const reload = useCallback(async () => { await load(); setConflict(""); setDraft({ title: overrides[k]?.title ?? def.title, body: overrides[k]?.body ?? def.body }); base.current = overrides[k]?.updated_at ?? null; }, [load, overrides, k, def.title, def.body]);

  const saveGuard = useRef(false);
  const doSave = async (payload, successText) => {
    if (saveGuard.current) return; // ét gem ad gangen
    saveGuard.current = true;
    setSaving(true);
    setConflict("");
    const res = await savePush(k, payload, base.current);
    setSaving(false);
    saveGuard.current = false;
    if (!res.ok) { if (res.conflict) setConflict(res.error); else showToast(res.error, "error"); return; }
    base.current = res.updated_at;
    if (!payload.title && !payload.body) setDraft({ title: def.title, body: def.body });
    showToast(successText, "success");
  };
  return (
    <div className="np-editor">
      <div className="np-editor-head">
        <button type="button" className="admin-iconbtn np-back" onClick={onBack} aria-label="Tilbage til notifikationer"><Icon name="chevronLeft" size={20} color="var(--ink2)" /></button>
        <div style={{ minWidth: 0 }}>
          <div className="np-editor-title">{selected.name}</div>
          <div className="np-editor-sub">{overrideIsActive(saved) ? "Pushteksten er rettet" : "Standardtekst"}</div>
        </div>
      </div>
      <div className="admin-tabs np-tabs" role="tablist">
        {[["push", "Push"], ["mail", "Mail"], ["test", "Send test"]].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={`admin-tab-btn${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>{label}{id === "push" && dirty ? " •" : ""}</button>
        ))}
      </div>
      {tab === "push" && (
        <PushTab k={k} def={def} saved={saved} draft={draft} setDraft={setDraft} check={check} dirty={dirty} isDefault={isDefault} vars={vars} saving={saving} conflict={conflict} reload={reload}
          onSave={() => doSave(toSave, isDefault ? "Pushen er sat tilbage til standard" : "Push-teksten er gemt og gælder fra nu af")}
          onReset={() => (overrideIsActive(saved) ? setConfirmReset(true) : setDraft({ title: def.title, body: def.body }))} />
      )}
      {tab === "mail" && <MailTab k={k} selected={selected} recipient={recipient} loadMailPreview={loadMailPreview} />}
      {tab === "test" && <TestTab k={k} selected={selected} admins={admins} recipient={recipient} setRecipient={setRecipient} draft={toSave} dirty={dirty} check={check} sendTest={sendTest} />}
      {confirmReset && (
        <Confirm title="Gendan standardtekst?" danger confirmLabel="Gendan standard" busy={saving} onCancel={() => setConfirmReset(false)}
          text="Din rettede pushtekst til denne notifikation overskrives af standardteksten. Andre notifikationer påvirkes ikke."
          onConfirm={async () => { await doSave({ title: "", body: "" }, "Pushen er sat tilbage til standard"); setConfirmReset(false); }} />
      )}
    </div>
  );
}

export default function NotificationsSection(props) {
  const { overrides, loading, loaded, error, load } = props;
  const groups = useMemo(() => listNotifications(), []);
  const showSpinner = useShowSpinner(loading, loaded);
  const [selectedKey, setSelectedKey] = useState(null);
  const [view, setView] = useState("list"); // mobil: list | edit
  const [openCat, setOpenCat] = useState(null);
  const [pending, setPending] = useState(null); // { next } når der er ikke-gemte ændringer
  const dirtyRef = useRef(false);
  const listRef = useRef(null);
  const scroll = useRef(0);
  const all = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const selected = all.find((i) => i.key === selectedKey) || null;

  useEffect(() => {
    const onBefore = (e) => { if (dirtyRef.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, []);

  const go = (next) => {
    if (dirtyRef.current) { setPending({ next }); return; }
    next();
  };
  const choose = (key) => go(() => {
    scroll.current = window.scrollY;
    dirtyRef.current = false;
    setSelectedKey(key);
    setView("edit");
    window.scrollTo?.(0, 0);
  });
  const back = () => go(() => {
    dirtyRef.current = false;
    setView("list");
    requestAnimationFrame(() => window.scrollTo?.(0, scroll.current));
  });

  if (error && !loaded) {
    return error.denied
      ? <StateBox role="alert" icon="shield" title="Ingen adgang" text="Du har ikke adgang til notifikationerne. Log ind med en administratorkonto." />
      : <StateBox role="alert" icon="warning" title="Notifikationerne kunne ikke hentes" text="Tjek forbindelsen, og prøv igen." action={<button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={load}>Prøv igen</button>} />;
  }
  if (!loaded && (showSpinner || loading)) return <div className="admin-loading-row"><div className="admin-spinner" /> Henter notifikationer…</div>;
  if (all.length === 0) return <StateBox icon="bell" title="Ingen notifikationer" text="Der er ikke defineret nogen notifikationer endnu." />;

  return (
    <div className={`np-layout${view === "edit" ? " editing" : ""}`}>
      <div className="np-list" ref={listRef}>
        <div className="audit-head"><div className="audit-intro">Vælg en notifikation for at rette pushteksten, se mailen eller sende en test.</div></div>
        {groups.map((g) => {
          const open = openCat === g.label || (selected && g.items.some((i) => i.key === selectedKey) && openCat === null);
          return (
            <div key={g.label} className="admin-disclosure">
              <button type="button" className="admin-disclosure-head" aria-expanded={!!open} onClick={() => setOpenCat(open ? "" : g.label)}>
                <span style={{ flex: 1, minWidth: 0 }}>{g.label}</span>
                <span className="admin-disclosure-meta">{g.items.length}</span>
                <span className={`admin-disclosure-chev${open ? " open" : ""}`} aria-hidden="true"><Icon name="chevronDown" size={14} color="var(--muted)" /></span>
              </button>
              {open && (
                <div className="admin-disclosure-body np-items">
                  {g.items.map((i) => (
                    <button key={i.key} type="button" className={`np-item${i.key === selectedKey ? " active" : ""}`} aria-current={i.key === selectedKey ? "true" : undefined} onClick={() => choose(i.key)}>
                      <span className="np-item-name">{i.name}</span>
                      {overrideIsActive(overrides[i.key]) && <span className="admin-pill admin-pill-green">Rettet</span>}
                      <Icon name="chevronRight" size={14} color="var(--muted2)" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="np-detail">
        {selected
          ? <Editor key={selectedKey} k={selectedKey} selected={selected} props={props} dirtyRef={dirtyRef} onBack={back} />
          : <StateBox icon="bell" title="Vælg en notifikation" text="Åbn en kategori til venstre, og vælg en notifikation." />}
      </div>
      {pending && (
        <Confirm title="Forlad uden at gemme?" danger confirmLabel="Kassér ændringer" cancelLabel="Bliv på siden" onCancel={() => setPending(null)}
          text="Du har ikke-gemte ændringer i pushteksten. De går tabt, hvis du forlader siden."
          onConfirm={() => { const n = pending.next; dirtyRef.current = false; setPending(null); n(); }} />
      )}
    </div>
  );
}
