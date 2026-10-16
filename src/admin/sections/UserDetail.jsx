// @ts-nocheck
// Detaljer for én bruger: Oversigt | Præferencer | Administration. Alt er skrivebeskyttet, til administratoren bevidst trykker "Rediger". Navn, fødselsår og køn
// kan rettes uden begrundelse; allergipræferencer kræver en oversigt over ændringerne og en begrundelse; rolle og sletning ligger kun under Administration.
// E-mail (login-adressen i Supabase Auth) og onboardingstatus kan ikke ændres her. Rettigheder og versionstjek håndhæves af serveren (migration 20261016110000).
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { ALLERGENS } from "../../constants.jsx";
import { traceEligible } from "../../helpers.js";
import { AllergenGlyph, Icon, showToast } from "../../SharedComponents.jsx";
import Disclosure from "../Disclosure.jsx";
import { ROLE_LABELS, onboardingStatus, prefsOf, diffPrefs, profileChanged, validBirthYear, normalizeENumber, normalizeCustom } from "../usersLogic.js";
import { fmtAuditDateTime } from "../auditLogic.js";

const labelOf = (id) => (ALLERGENS.find((a) => a.id === id) || {}).label || id;
const copy = (value) => {
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value).then(() => showToast("Kopieret", "success")).catch(() => showToast("Kunne ikke kopiere", "error"));
  else showToast("Kunne ikke kopiere", "error");
};

/** Valgte og ikke valgte allergener. Valgt er markeret med et flueben og grøn kant (ikke kun farve) og ligner aldrig en fejlmelding. */
function AllergenChips({ selected, onToggle, readOnly }) {
  const list = readOnly ? ALLERGENS.filter((a) => selected.includes(a.id)) : ALLERGENS;
  if (readOnly && list.length === 0) return <div className="usr-none">Ingen valgte allergier eller intolerancer</div>;
  return (
    <div className="usr-chips" role={readOnly ? "list" : "group"} aria-label="Allergier og intolerancer">
      {list.map((a) => {
        const on = selected.includes(a.id);
        return readOnly ? (
          <span key={a.id} role="listitem" className="usr-chip on"><Icon name="check" size={12} color="var(--green)" /><AllergenGlyph a={a} size={13} /><span>{a.label}</span></span>
        ) : (
          <button key={a.id} type="button" className={`usr-chip${on ? " on" : ""}`} aria-pressed={on} onClick={() => onToggle(a.id)}>
            {on && <Icon name="check" size={12} color="var(--green)" />}<AllergenGlyph a={a} size={13} /><span>{a.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Egne allergier og E-numre som chips: skriv, tryk Tilføj, fjern med krydset. Ingen kommasepareret fritekst. */
function ChipInput({ id, label, values, onChange, normalize, placeholder, errorText, readOnly }) {
  const [text, setText] = useState("");
  const [bad, setBad] = useState(false);
  const add = () => {
    const v = normalize(text);
    if (!v) { setBad(true); return; }
    setBad(false);
    if (!values.includes(v)) onChange([...values, v].sort());
    setText("");
  };
  return (
    <div className="admin-field">
      <label htmlFor={id}>{label}</label>
      {values.length === 0 && readOnly && <div className="usr-none">Ingen</div>}
      {values.length > 0 && (
        <div className="usr-chips" role="list">
          {values.map((v) => (
            <span key={v} role="listitem" className="usr-chip on"><span>{v}</span>
              {!readOnly && <button type="button" className="usr-chip-x" aria-label={`Fjern ${v}`} onClick={() => onChange(values.filter((x) => x !== v))}><Icon name="x" size={12} color="var(--ink2)" /></button>}
            </span>
          ))}
        </div>
      )}
      {!readOnly && (
        <div className="usr-add">
          <input id={id} value={text} placeholder={placeholder} aria-invalid={bad} autoCapitalize="off" autoCorrect="off" spellCheck={false}
            onChange={(e) => { setText(e.target.value); setBad(false); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
          <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={add} disabled={!text.trim()}>Tilføj</button>
        </div>
      )}
      {bad && <div className="usr-err" role="alert">{errorText}</div>}
    </div>
  );
}

/** Fejltilstand for en sektion: særskilt tekst for adgang, session, slettet bruger og serverfejl, med "Prøv igen". Viser aldrig tekniske detaljer. */
function LoadError({ kind, what, onRetry }) {
  const t = kind === "denied" ? ["Ingen adgang", "Du har ikke adgang til disse oplysninger."]
    : kind === "session" ? ["Din session er udløbet", "Log ind igen for at fortsætte."]
    : kind === "notfound" ? ["Brugeren findes ikke længere", "Kontoen kan være slettet. Luk visningen, og opdatér listen."]
    : kind === "network" ? [`Kunne ikke hente ${what}`, "Tjek forbindelsen, og prøv igen."]
    : [`Kunne ikke hente ${what}`, "Der opstod en fejl under indlæsningen."];
  return (
    <div className="admin-table-empty audit-state" role="alert">
      <div className="audit-state-icon" aria-hidden="true"><Icon name="warning" size={22} color="var(--muted)" /></div>
      <div className="audit-state-title">{t[0]}</div>
      <div>{t[1]}</div>
      {kind !== "denied" && kind !== "notfound" && <div style={{ marginTop: 12 }}><button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={onRetry}>Prøv igen</button></div>}
    </div>
  );
}

/** De sporadvarsler, der faktisk er slået til: valgte allergier med sporlogik, som ikke er sat til kun direkte indhold. Laktose o.l. har ingen sporadvarsel. */
const activeTraces = (data) => traceEligible(data.allergens).filter((a) => data.levels[a] !== "direct_only");

const Row = ({ label, children }) => (children ? <div className="audit-detail-row"><dt>{label}</dt><dd>{children}</dd></div> : null);

export default function UserDetail({ row, currentUserId, getUser, saveProfile, setRole, deleteSummary, deleteUser, onClose, onDeleted }) {
  const id = row.id;
  const isMe = id === currentUserId;
  const [tab, setTab] = useState("overview");
  const [ov, setOv] = useState({ status: "loading" });
  const [pf, setPf] = useState({ status: "idle" });
  const versionRef = useRef(null);
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState({ name: "", birth_year: "", gender: "" });
  const [pEdit, setPEdit] = useState(false);
  const [pDraft, setPDraft] = useState(null);
  const [review, setReview] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(null); // { text, conflict }
  const [confirm, setConfirm] = useState(null); // "discard" | { tab }
  const [roleOpen, setRoleOpen] = useState(false);
  const [del, setDel] = useState(null); // { status: "loading" | "ok" | "error", summary?, ack }
  const closeRef = useRef(null);

  const loadOverview = async () => {
    setOv((s) => (s.status === "ok" ? s : { status: "loading" }));
    const res = await getUser(id, false);
    if (!res.ok) { setOv({ status: "error", kind: res.kind }); return; }
    versionRef.current = res.user.version;
    setOv({ status: "ok", user: res.user });
  };
  const loadPrefs = async () => {
    setPf({ status: "loading" });
    const res = await getUser(id, true);
    if (!res.ok) { setPf({ status: "error", kind: res.kind }); return; }
    versionRef.current = res.user.version;
    setPf({ status: "ok", data: prefsOf(res.user) });
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- bevidst: hent ved åbning af brugeren
  useEffect(() => { loadOverview(); }, [id]);
  useEffect(() => { if (tab === "prefs" && pf.status === "idle") loadPrefs(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tab]);

  const u = ov.status === "ok" ? ov.user : null;
  const legacy = !!u?.legacy; // databasefunktionerne er ikke udgivet endnu: kun læsning
  const overviewDirty = edit && u && profileChanged({ name: u.name, birth_year: u.birth_year, gender: u.gender }, draft);
  const prefsDiff = pEdit && pf.status === "ok" && pDraft ? diffPrefs(pf.data, pDraft, labelOf) : { changed: false, lines: [] };
  const dirty = !!(overviewDirty || prefsDiff.changed);

  const requestClose = () => { if (dirty) setConfirm("discard"); else onClose(); };
  closeRef.current = requestClose;
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") closeRef.current(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  const switchTab = (t) => { if (t === tab) return; if (dirty) setConfirm({ tab: t }); else setTab(t); };
  const discardAll = () => { setEdit(false); setPEdit(false); setReview(false); setReason(""); setFailed(null); };

  // ── Oversigt: navn, fødselsår og køn ──────────────────────────────────────────────────────────────────────────────────
  const startEdit = () => { setDraft({ name: u.name || "", birth_year: u.birth_year ? String(u.birth_year) : "", gender: u.gender || "" }); setFailed(null); setEdit(true); };
  const yearOk = validBirthYear(draft.birth_year);
  const canSaveProfile = edit && overviewDirty && yearOk && !busy && versionRef.current !== null;
  const saveOverview = async () => {
    setBusy(true); setFailed(null);
    const res = await saveProfile(id, { profile: { name: draft.name.trim(), birth_year: draft.birth_year === "" ? null : Number(draft.birth_year), gender: draft.gender || null }, version: versionRef.current });
    setBusy(false);
    if (!res.ok) { setFailed({ text: res.error, conflict: res.conflict }); return; }
    versionRef.current = res.version;
    setEdit(false);
    showToast("Oplysningerne er gemt", "success");
    loadOverview();
  };

  // ── Præferencer ───────────────────────────────────────────────────────────────────────────────────────────────────────
  const startPrefEdit = () => { setPDraft({ allergens: [...pf.data.allergens], custom: [...pf.data.custom], eNumbers: [...pf.data.eNumbers], levels: { ...pf.data.levels } }); setReview(false); setReason(""); setFailed(null); setPEdit(true); };
  const toggleAllergen = (aid) => setPDraft((d) => ({ ...d, allergens: d.allergens.includes(aid) ? d.allergens.filter((x) => x !== aid) : [...d.allergens, aid].sort() }));
  const toggleTrace = (aid) => setPDraft((d) => { const levels = { ...d.levels }; if (levels[aid] === "direct_only") delete levels[aid]; else levels[aid] = "direct_only"; return { ...d, levels }; });
  const savePrefs = async () => {
    setBusy(true); setFailed(null);
    const levels = Object.fromEntries(Object.entries(pDraft.levels).filter(([k]) => pDraft.allergens.includes(k)));
    const res = await saveProfile(id, { profile: { allergen_levels: levels, e_numbers: pDraft.eNumbers }, allergens: pDraft.allergens, custom: pDraft.custom, reason: reason.trim(), version: versionRef.current });
    setBusy(false);
    if (!res.ok) { setFailed({ text: res.error, conflict: res.conflict }); return; }
    versionRef.current = res.version;
    setPEdit(false); setReview(false); setReason("");
    showToast("Præferencerne er gemt", "success");
    loadPrefs();
  };
  const reload = () => { discardAll(); loadOverview(); if (pf.status !== "idle") loadPrefs(); };

  // ── Administration ──────────────────────────────────────────────────────────────────────────────────────────────────────
  const newRole = u && u.role === "admin" ? "user" : "admin";
  const changeRole = async () => {
    setBusy(true); setFailed(null);
    const res = await setRole(id, newRole);
    setBusy(false);
    if (!res.ok) { setFailed({ text: res.error }); return; }
    setRoleOpen(false);
    showToast(`Rollen er ændret til ${ROLE_LABELS[newRole].toLowerCase()}`, "success");
    loadOverview();
  };
  const startDelete = async () => {
    setDel({ status: "loading", ack: false }); setFailed(null);
    const res = await deleteSummary(id);
    setDel(res.ok ? { status: "ok", summary: res.summary, ack: false } : { status: "error", text: res.error, ack: false });
  };
  const doDelete = async () => {
    setBusy(true); setFailed(null);
    const res = await deleteUser(id);
    setBusy(false);
    if (!res.ok) { setFailed({ text: res.error }); return; }
    showToast("Kontoen er slettet", "success");
    onDeleted();
  };

  const status = u ? onboardingStatus(u) : null;
  const canSaveFoot = (tab === "overview" && edit) || (tab === "prefs" && pEdit);
  const prefsInvalid = pEdit && prefsDiff.changed && review && !reason.trim();

  return ReactDOM.createPortal(
    <div className="admin-modal-overlay" onClick={requestClose}>
      <div className="admin-modal todo-panel usr-panel" role="dialog" aria-modal="true" aria-labelledby="usr-title" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="todo-panel-head">
          <div style={{ minWidth: 0 }}>
            <div id="usr-title" className="audit-sheet-title">{(u && u.name) || row.name || "Uden navn"}</div>
            <div className="audit-sheet-time">{ROLE_LABELS[(u && u.role) || row.role || "user"]}{isMe ? " · Dig" : ""}</div>
          </div>
          <button type="button" className="admin-iconbtn audit-sheet-close" onClick={requestClose} aria-label="Luk"><Icon name="x" size={20} color="var(--ink2)" /></button>
        </div>
        <div className="usr-tabs admin-tabs" role="tablist">
          {[["overview", "Oversigt"], ["prefs", "Præferencer"], ["admin", "Administration"]].map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className={`admin-tab-btn${tab === k ? " active" : ""}`} onClick={() => switchTab(k)}>{label}</button>
          ))}
        </div>

        {confirm && (
          <div className="todo-confirm" style={{ margin: "12px 16px 0" }} role="alertdialog" aria-label="Ikke-gemte ændringer">
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Du har ændringer, der ikke er gemt.</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => setConfirm(null)}>Bliv og ret</button>
              <button type="button" className="admin-btn admin-btn-danger admin-btn-sm admin-touch" onClick={() => { const next = confirm; setConfirm(null); discardAll(); if (next === "discard") onClose(); else setTab(next.tab); }}>Kassér ændringer</button>
            </div>
          </div>
        )}
        {failed && (
          <div className="todo-confirm" style={{ margin: "12px 16px 0" }} role="alert">
            {failed.text}{failed.conflict && <> <button type="button" className="todo-link-btn" style={{ minHeight: 32, textDecoration: "underline" }} onClick={reload}>Hent igen</button></>}
          </div>
        )}

        <div className="todo-panel-body">
          {ov.status === "loading" && <div className="admin-loading-row"><div className="admin-spinner" /> Henter bruger…</div>}
          {ov.status === "error" && <LoadError kind={ov.kind} what="brugeroplysninger" onRetry={loadOverview} />}

          {u && tab === "overview" && (
            <>
              {!edit ? (
                <dl className="audit-detail">
                  <Row label="Navn">{u.name || "Ikke angivet"}</Row>
                  <Row label="E-mail (login)">{u.email || "Ikke angivet"}</Row>
                  {typeof u.email_confirmed === "boolean" && <Row label="E-mail bekræftet">{u.email_confirmed ? "Ja" : "Nej"}</Row>}
                  <Row label="Rolle">{ROLE_LABELS[u.role || "user"]}</Row>
                  <Row label="Oprettet">{u.created_at ? fmtAuditDateTime(u.created_at, true) : ""}</Row>
                  <Row label="Onboarding"><span className={status.key === "done" ? "" : "usr-warn"}>{status.label}</span></Row>
                  <Row label="Fødselsår">{u.birth_year ? String(u.birth_year) : "Ikke angivet"}</Row>
                  <Row label="Køn">{u.gender || "Ikke angivet"}</Row>
                </dl>
              ) : (
                <div>
                  <div className="admin-field"><label htmlFor="u-name">Navn</label><input id="u-name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} /></div>
                  <div className="admin-field"><label htmlFor="u-mail">E-mail (login)</label><input id="u-mail" value={u.email || ""} readOnly aria-readonly="true" className="usr-readonly" />
                    <div className="usr-hint">Loginadressen kan ikke ændres her.</div></div>
                  <div className="usr-grid">
                    <div className="admin-field"><label htmlFor="u-year">Fødselsår</label>
                      <input id="u-year" inputMode="numeric" value={draft.birth_year} aria-invalid={!yearOk} onChange={(e) => setDraft((d) => ({ ...d, birth_year: e.target.value.replace(/\D/g, "").slice(0, 4) }))} />
                      {!yearOk && <div className="usr-err" role="alert">Fødselsåret skal være mellem 1900 og i år.</div>}</div>
                    <div className="admin-field"><label htmlFor="u-gender">Køn</label>
                      <select id="u-gender" className="admin-select" value={draft.gender} onChange={(e) => setDraft((d) => ({ ...d, gender: e.target.value }))}>
                        <option value="">Ikke angivet</option><option value="Mand">Mand</option><option value="Kvinde">Kvinde</option><option value="Andet">Andet</option>
                      </select></div>
                  </div>
                </div>
              )}
              {!edit && !legacy && <button type="button" className="admin-btn admin-btn-ghost admin-touch usr-edit-btn" onClick={startEdit}>Rediger oplysninger</button>}
            </>
          )}

          {u && tab === "prefs" && (
            <>
              {pf.status === "loading" && <div className="admin-loading-row"><div className="admin-spinner" /> Henter præferencer…</div>}
              {pf.status === "error" && <LoadError kind={pf.kind} what="præferencer" onRetry={loadPrefs} />}
              {pf.status === "ok" && !pEdit && (
                <>
                  <div className="admin-field"><label>Allergier og intolerancer</label><AllergenChips selected={pf.data.allergens} readOnly /></div>
                  <div className="admin-field"><label>Sporadvarsler</label>
                    {activeTraces(pf.data).length === 0 ? <div className="usr-none">Ingen sporadvarsler</div> : (
                      <ul className="usr-traces">{activeTraces(pf.data).map((a) => <li key={a}><span>{labelOf(a)}</span><span>Aktiveret</span></li>)}</ul>
                    )}</div>
                  <ChipInput id="p-custom" label="Egne valg" values={pf.data.custom} readOnly />
                  <ChipInput id="p-enum" label="Overvågede E-numre" values={pf.data.eNumbers} readOnly />
                  {!legacy && <button type="button" className="admin-btn admin-btn-ghost admin-touch usr-edit-btn" onClick={startPrefEdit}>Rediger præferencer</button>}
                  {!legacy && <div className="usr-hint">Ændringer kan påvirke brugerens produktvurderinger og kræver en begrundelse.</div>}
                </>
              )}
              {pf.status === "ok" && pEdit && pDraft && !review && (
                <>
                  <div className="admin-field"><label>Allergier og intolerancer</label><AllergenChips selected={pDraft.allergens} onToggle={toggleAllergen} /></div>
                  <div className="admin-field"><label>Sporadvarsler</label>
                    <div className="usr-hint" style={{ marginTop: 0, marginBottom: 6 }}>Slået til: produktet advares også, hvis det kan indeholde spor. Slået fra: kun direkte indhold. Intolerancer uden sporlogik (fx laktose) har ingen sporadvarsel.</div>
                    {traceEligible(pDraft.allergens).length === 0 ? <div className="usr-none">Vælg en allergi først</div> : traceEligible(pDraft.allergens).map((a) => (
                      <label key={a} className="usr-check"><input type="checkbox" checked={pDraft.levels[a] !== "direct_only"} onChange={() => toggleTrace(a)} /><span>{labelOf(a)}: sporadvarsel</span></label>
                    ))}</div>
                  <ChipInput id="p-custom" label="Egne valg" values={pDraft.custom} onChange={(v) => setPDraft((d) => ({ ...d, custom: v }))} normalize={normalizeCustom} placeholder="Fx kanel" errorText="Skriv en kort tekst uden < eller >." />
                  <ChipInput id="p-enum" label="Overvågede E-numre" values={pDraft.eNumbers} onChange={(v) => setPDraft((d) => ({ ...d, eNumbers: v }))} normalize={normalizeENumber} placeholder="Fx E220" errorText="Skriv et E-nummer, fx E220." />
                </>
              )}
              {pf.status === "ok" && pEdit && pDraft && review && (
                <div role="group" aria-label="Bekræft ændringer">
                  <div className="admin-label">Disse ændringer påvirker brugerens vurderinger</div>
                  <ul className="usr-diff">{prefsDiff.lines.map((l) => <li key={l}>{l}</li>)}</ul>
                  <div className="admin-field" style={{ marginTop: 12 }}><label htmlFor="p-reason">Begrundelse (påkrævet)</label>
                    <textarea id="p-reason" className="admin-textarea" rows={3} maxLength={300} value={reason} placeholder="Fx: Brugeren bad os rette allergien via support" onChange={(e) => setReason(e.target.value)} />
                    <div className="usr-hint">Begrundelsen og antal ændringer gemmes i aktivitetsloggen, ikke hvilke allergier.</div></div>
                </div>
              )}
            </>
          )}

          {u && tab === "admin" && (
            <>
              <div className="admin-field">
                <label>Rolle</label>
                <div className="usr-line"><span>{ROLE_LABELS[u.role || "user"]}</span>
                  {!roleOpen && !legacy && <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" disabled={isMe} onClick={() => { setRoleOpen(true); setFailed(null); }}>Ændr brugerrolle</button>}
                </div>
                {isMe && <div className="usr-hint">Du kan ikke ændre din egen rolle.</div>}
                {roleOpen && (
                  <div className="todo-confirm" role="alertdialog" aria-label="Ændr brugerrolle">
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Ændr rolle til {ROLE_LABELS[newRole].toLowerCase()}?</div>
                    <div style={{ fontSize: 12.5, marginBottom: 6 }}>Nuværende rolle: <b>{ROLE_LABELS[u.role || "user"]}</b> · Ny rolle: <b>{ROLE_LABELS[newRole]}</b></div>
                    <div style={{ fontSize: 12.5, marginBottom: 8 }}>{newRole === "admin" ? "En administrator kan se og ændre alle brugeres data og rolle." : "Brugeren mister adgangen til administrationen."}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" disabled={busy} onClick={() => setRoleOpen(false)}>Annuller</button>
                      <button type="button" className="admin-btn admin-btn-primary admin-btn-sm admin-touch" disabled={busy} onClick={changeRole}>Skift rolle</button>
                    </div>
                  </div>
                )}
              </div>
              {legacy && (
                <div className="np-note fam-off">Administrative ændringer er midlertidigt utilgængelige.
                  <Disclosure title="Hvorfor?">Rolleændring og sletning kræver den seneste databaseopdatering, som endnu ikke er udgivet. Oplysningerne vises skrivebeskyttet.</Disclosure>
                </div>
              )}
              {!legacy && <div className="admin-field">
                <label>Slet bruger</label>
                {isMe ? <div className="usr-hint" style={{ marginTop: 0 }}>Du kan ikke slette din egen konto herfra.</div> : !del ? (
                  <button type="button" className="admin-btn admin-btn-danger admin-btn-sm admin-touch" onClick={startDelete}>Slet bruger</button>
                ) : (
                  <div className="todo-confirm" role="alertdialog" aria-label="Slet bruger">
                    {del.status === "loading" && <div className="admin-loading-row"><div className="admin-spinner" /> Tjekker, hvad sletningen rammer…</div>}
                    {del.status === "error" && <div role="alert">{del.text} <button type="button" className="todo-link-btn" style={{ minHeight: 32, textDecoration: "underline" }} onClick={startDelete}>Prøv igen</button></div>}
                    {del.status === "ok" && (
                      <>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Slet {u.name || "denne bruger"} permanent?</div>
                        <ul className="usr-diff" style={{ marginBottom: 8 }}>
                          <li>Kontoen, profilen og allergipræferencerne slettes og kan ikke gendannes.</li>
                          {del.summary.family_profiles_owned > 0 && <li><b>{del.summary.family_profiles_owned}</b> familieprofil{del.summary.family_profiles_owned === 1 ? "" : "er"} (fx børneprofiler) ejet af brugeren slettes også.</li>}
                          {del.summary.family_links > 0 && <li>Brugeren fjernes fra {del.summary.family_links} andres {del.summary.family_links === 1 ? "familie" : "familier"}.</li>}
                          {del.summary.invites_sent > 0 && <li>{del.summary.invites_sent} invitation{del.summary.invites_sent === 1 ? "" : "er"} sendt af brugeren slettes.</li>}
                          {del.summary.shopping_lists_owned > 0 && <li>{del.summary.shopping_lists_owned} indkøbsliste{del.summary.shopping_lists_owned === 1 ? "" : "r"} ejet af brugeren slettes.</li>}
                          {del.summary.scan_history > 0 && <li>{del.summary.scan_history} scanning{del.summary.scan_history === 1 ? "" : "er"} i historikken slettes.</li>}
                          {del.summary.is_admin && <li>Brugeren er administrator. Den sidste administrator kan ikke slettes.</li>}
                        </ul>
                        <label className="usr-check"><input type="checkbox" checked={del.ack} onChange={(e) => setDel((d) => ({ ...d, ack: e.target.checked }))} /><span>Jeg forstår, at kontoen og dens data slettes permanent.</span></label>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                          <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" disabled={busy} onClick={() => { setDel(null); setFailed(null); }}>Annuller</button>
                          <button type="button" className="admin-btn admin-btn-danger admin-btn-sm admin-touch" disabled={busy || !del.ack} onClick={doDelete}>Slet bruger</button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>}
              <Disclosure title="Tekniske oplysninger">
                <dl className="audit-tech">
                  <div className="audit-tech-row"><dt>Bruger-id</dt><dd>{id}</dd>
                    <button type="button" className="audit-copy" aria-label="Kopiér Bruger-id" onClick={() => copy(id)}><Icon name="copy" size={16} color="var(--muted)" /></button></div>
                </dl>
              </Disclosure>
            </>
          )}
        </div>

        {canSaveFoot && (
          <div className="todo-panel-foot">
            <button type="button" className="admin-btn admin-btn-ghost admin-touch" disabled={busy} onClick={() => { if (dirty) setConfirm({ tab }); else discardAll(); }}>Annuller</button>
            {tab === "overview" && <button type="button" className="admin-btn admin-btn-primary admin-touch todo-spacer" disabled={!canSaveProfile} onClick={saveOverview}>{busy ? "Gemmer…" : "Gem ændringer"}</button>}
            {tab === "prefs" && !review && <button type="button" className="admin-btn admin-btn-primary admin-touch todo-spacer" disabled={!prefsDiff.changed} onClick={() => { setReview(true); setFailed(null); }}>Se ændringer</button>}
            {tab === "prefs" && review && (
              <>
                <button type="button" className="admin-btn admin-btn-ghost admin-touch" disabled={busy} onClick={() => setReview(false)}>Tilbage</button>
                <button type="button" className="admin-btn admin-btn-primary admin-touch todo-spacer" disabled={busy || prefsInvalid || !reason.trim()} onClick={savePrefs}>{busy ? "Gemmer…" : "Gem ændringer"}</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
