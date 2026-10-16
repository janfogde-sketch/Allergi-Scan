// @ts-nocheck
// Tilbagekaldelse: overskuelig detaljevisning i sektioner (Overblik, Årsag, Berørte produkter, Forbrugerhandling, Produktmatch, Varsling, Historik, Original kildetekst) med fast overskrift.
// Produktmatch bygger på stregkode og partioplysninger (aldrig på navn alene), kartonkoder er aldrig et bekræftet match, og "ikke omfattet" kræver en dokumenteret begrundelse.
import React, { useState, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
import { Icon } from "../../SharedComponents.jsx";
import Disclosure from "../Disclosure.jsx";
import { fmtLocalFull } from "../importLogic.js";
import { isOfficialRecallUrl } from "../../../supabase/functions/_shared/recallParser.js";
import CloseX from "../CloseX.jsx";
import {
  STATUS_TEXT, MATCH_LABEL, MATCH_PILL, FLAG_TEXT, recallProducts, lookupCodes, matchEntry, summarizeMatch, missingInfoText, nameMismatch, recallHistory, notificationSummary,
  addProduct, removeProduct, searchTermFromRaw, confirmSendText, RECALL_STATUS_PILL,
} from "../recallLogic.js";

const KIND = { carton: "Kartonkode", unit: "Salgsenhed", unknown: "Stregkode" };
const fmtDay = (d) => (d ? new Date(d).toLocaleDateString("da-DK", { timeZone: "Europe/Copenhagen", day: "numeric", month: "long", year: "numeric" }) : "–");

function Text({ text }) {
  if (!text) return <div className="pe-muted">Ikke oplyst på siden.</div>;
  return <div className="rc-text">{text}</div>;
}

function ProductCard({ entry, matches }) {
  return (
    <div className={`rc-product${entry.uncertain ? " uncertain" : ""}`}>
      <div className="rc-product-name">{entry.name || "Produkt uden navn på siden"}{entry.brand ? ` · ${entry.brand}` : ""}</div>
      <dl className="rc-kv">
        {entry.eans.map((x) => <React.Fragment key={x.code}><dt>{KIND[x.kind] || "Stregkode"}</dt><dd className="np-mono">{x.code}{x.valid ? "" : " (ugyldig)"}</dd></React.Fragment>)}
        {entry.article_no && <><dt>Varenummer</dt><dd className="np-mono">{entry.article_no}</dd></>}
        {entry.lots.length > 0 && <><dt>Parti / lot</dt><dd className="np-mono">{entry.lots.join(", ")}</dd></>}
        {entry.production_dates.length > 0 && <><dt>Produktion</dt><dd>{entry.production_dates.join(", ")}</dd></>}
        {entry.best_before.length > 0 && <><dt>Holdbarhed</dt><dd>{entry.best_before.join(", ")}</dd></>}
        {entry.net && <><dt>Indhold</dt><dd>{entry.net}</dd></>}
      </dl>
      {matches.length > 0 && <div className="rc-pills">{matches.map((m) => <span key={m.code} className={`admin-pill ${MATCH_PILL[m.level]}`}>{MATCH_LABEL[m.level]}</span>)}</div>}
      {entry.flags.length > 0 && <ul className="rc-flags">{entry.flags.map((f) => <li key={f}>{FLAG_TEXT[f] || f}</li>)}</ul>}
    </div>
  );
}

function MatchRow({ recall, m, decide, canDecide }) {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState(m.level === "not_found" || m.level === "unverified" ? "possible" : m.level);
  const [basis, setBasis] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const save = async () => {
    if (basis.trim().length < 5) { setErr("Skriv en kort begrundelse (mindst 5 tegn)."); return; }
    setBusy(true); setErr("");
    const r = await decide(m.code, level, basis.trim());
    setBusy(false);
    if (r.ok) { setOpen(false); setBasis(""); } else setErr(r.error);
  };
  return (
    <li className="rc-match">
      <div className="rc-match-head"><span className="np-mono">{m.code}</span><span className={`admin-pill ${MATCH_PILL[m.level]}`}>{MATCH_LABEL[m.level]}</span></div>
      {m.product && <div className="rc-match-prod">{m.product.name}{m.product.brand ? ` · ${m.product.brand}` : ""}</div>}
      <div className="pe-muted">{m.basis}</div>
      {m.manual && <div className="pe-muted">Afgjort af {m.by}{m.decidedAt ? ` · ${fmtLocalFull(m.decidedAt)}` : ""}</div>}
      {canDecide && !open && <button type="button" className="todo-link-btn" onClick={() => setOpen(true)}>Registrér afgørelse</button>}
      {open && (
        <div className="todo-confirm" role="group" aria-label={`Afgørelse for ${m.code}`}>
          <div className="admin-field"><label htmlFor={`lv-${m.code}`}>Matchniveau</label>
            <select id={`lv-${m.code}`} className="admin-select" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="confirmed">Bekræftet match</option><option value="possible">Muligt match</option><option value="not_covered">Ikke omfattet</option>
            </select></div>
          <div className="admin-field"><label htmlFor={`bs-${m.code}`}>Begrundelse (hvad bygger afgørelsen på?)</label>
            <textarea id={`bs-${m.code}`} className="admin-textarea" rows={2} maxLength={1000} value={basis} onChange={(e) => setBasis(e.target.value)} /></div>
          {level === "not_covered" && <div className="pe-notice pe-amber">"Ikke omfattet" må kun bruges, når oplysninger dokumenterer det (fx at partiet er et andet end det tilbagekaldte). Manglende oplysninger er ikke dokumentation.</div>}
          {err && <div className="usr-err" role="alert">{err}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => setOpen(false)}>Annuller</button>
            <button type="button" className="admin-btn admin-btn-primary admin-btn-sm admin-touch" disabled={busy} onClick={save}>{busy ? "Gemmer…" : "Gem afgørelse"}</button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function RecallDetail({ recall, onClose, api }) {
  const reviewable = recall.status === "needs_review";
  const entries = useMemo(() => recallProducts(recall), [recall]);
  const [state, setState] = useState({ loading: true, products: { ok: true, byEan: {} }, detail: null });
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [affected, setAffected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null); // "send" | "archive" | "cancel"
  const [note, setNote] = useState("");
  const [ack, setAck] = useState(false);

  const reload = async () => {
    const [products, detail] = await Promise.all([api.findProducts(lookupCodes(entries)), api.loadDetail(recall.id)]);
    setState({ loading: false, products, detail });
  };
  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps -- hentes når tilbagekaldelsen åbnes */ }, [recall.id]);
  useEffect(() => { const k = (e) => { if (e.key === "Escape") onClose(); }; document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [onClose]);

  const overrides = useMemo(() => Object.fromEntries((state.detail?.matches || []).map((m) => [m.ean, m])), [state.detail]);
  const summary = useMemo(() => summarizeMatch(recall, entries, state.products.byEan, overrides), [recall, entries, state.products, overrides]);
  const matchesFor = (entry) => matchEntry(entry, state.products.byEan, overrides).map((m) => ({ ...m, by: m.decidedBy ? api.nameOf(m.decidedBy) : null }));
  const history = recallHistory(state.detail?.events, api.nameOf);
  const notif = notificationSummary(state.detail?.stats);
  const missing = missingInfoText(recall, entries);
  const official = isOfficialRecallUrl(recall.source_url);

  useEffect(() => {
    if (!reviewable || selected.length === 0) { setAffected(null); return undefined; }
    let off = false; setAffected(null);
    api.affectedCount(selected.map((p) => p.ean)).then((n) => { if (!off) setAffected(n); });
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tæller kun ved ændret udvalg
  }, [selected, reviewable]);

  const search = async (q = query) => { if (!q.trim()) { setResults([]); return; } setSearching(true); setResults(await api.searchProducts(q)); setSearching(false); };
  const finish = async (action) => { setBusy(true); const ok = await api.resolve(recall.id, action, selected.map((p) => p.ean), note.trim() || null); setBusy(false); if (ok) onClose(); };
  const mismatched = selected.filter((p) => nameMismatch(p, recall));
  const foundFromPage = entries.flatMap((e) => matchEntry(e, state.products.byEan, overrides)).filter((m) => m.product && m.kind !== "carton" && m.level !== "unverified").map((m) => m.product);
  const decide = async (ean, level, basis) => { const r = await api.setMatch(recall.id, ean, level, basis); if (r.ok) await reload(); return r; };

  return ReactDOM.createPortal(
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal todo-panel pe-panel" role="dialog" aria-modal="true" aria-labelledby="rc-title" onClick={(e) => e.stopPropagation()}>
        <div className="todo-panel-head">
          <div style={{ minWidth: 0 }}>
            <div id="rc-title" className="audit-sheet-title rc-title">{recall.title}</div>
            <div className="audit-sheet-time">{fmtDay(recall.published_at)} · <span className={`admin-pill ${RECALL_STATUS_PILL[recall.status]}`}>{STATUS_TEXT[recall.status]}</span></div>
          </div>
          <CloseX onClick={onClose} />
        </div>

        <div className="todo-panel-body">
          <div className="pe-section">Overblik</div>
          <dl className="audit-detail">
            <div className="audit-detail-row"><dt>Offentliggjort</dt><dd>{fmtDay(recall.published_at)}</dd></div>
            <div className="audit-detail-row"><dt>Importeret</dt><dd>{fmtLocalFull(recall.created_at)}</dd></div>
            <div className="audit-detail-row"><dt>Kilde senest læst</dt><dd>{recall.source_checked_at ? fmtLocalFull(recall.source_checked_at) : "Ikke registreret"}</dd></div>
            {recall.updated_at && recall.revision > 0 && <div className="audit-detail-row"><dt>Kilde ændret</dt><dd>{fmtLocalFull(recall.updated_at)} (version {recall.revision + 1})</dd></div>}
          </dl>
          {official && <a className="admin-btn admin-btn-ghost admin-touch rc-source" href={recall.source_url} target="_blank" rel="noopener noreferrer">Åbn Fødevarestyrelsens tilbagekaldelse <Icon name="link" size={14} color="var(--green)" /></a>}
          {summary.needsManual && (
            <div className="pe-notice pe-amber" role="status">
              <b>Kræver manuel kontrol.</b>
              <ul className="rc-flags">{summary.reasons.map((r) => <li key={r}>{r}</li>)}{summary.reasons.length === 0 && <li>Afventer administratorens gennemgang</li>}</ul>
              {missing.length > 0 && <div>Mangler: {missing.join(", ")}.</div>}
            </div>
          )}
          {recall.status === "archived" || recall.status === "cancelled" ? (
            <div className="usr-hint">{recall.status === "cancelled" ? "Annulleret: brugerne advares ikke længere ved scanning." : "Arkivering skjuler ikke advarslen i appen: tilbagekaldelsen vises stadig ved scanning af de knyttede stregkoder i 60 dage fra offentliggørelsen."}</div>
          ) : null}

          <div className="pe-section">Årsag</div>
          <Text text={recall.reason || recall.intro} />

          <div className="pe-section">Berørte produkter</div>
          {entries.length === 0 ? <div className="pe-muted">Siden angiver ingen enkelte produkter. Se original kildetekst.</div> : entries.map((e, i) => <ProductCard key={i} entry={e} matches={matchesFor(e)} />)}

          <div className="pe-section">Forbrugerhandling</div>
          <Text text={recall.action} />

          <div className="pe-section">Produktmatch</div>
          {state.loading ? <div className="pe-muted">Slår produkter op…</div> : !state.products.ok ? (
            <div className="pe-notice pe-red" role="alert">Produkterne kunne ikke slås op. Det betyder ikke, at der ingen match er. <button type="button" className="todo-link-btn" onClick={reload}>Prøv igen</button></div>
          ) : (
            <>
              <div className="rc-summary">
                <span className="admin-pill admin-pill-green">{summary.confirmed} bekræftet</span> <span className="admin-pill admin-pill-amber">{summary.possible} muligt</span> <span className="admin-pill admin-pill-neutral">{summary.notCovered} ikke omfattet</span> <span className="admin-pill admin-pill-neutral">{summary.notFound} ikke i EatSafe</span>
              </div>
              {summary.all.length === 0 ? <div className="pe-muted">Ingen stregkoder at matche.</div> : (
                <ul className="rc-matches">{entries.flatMap((e) => matchesFor(e)).map((m) => <MatchRow key={m.code} recall={recall} m={m} decide={decide} canDecide={state.detail?.newTables} />)}</ul>
              )}
              <div className="usr-hint">Matchet bygger på stregkode og partioplysninger, aldrig på navnet alene. Uden partioplysninger er et match kun muligt. En kartonkode er ikke et bekræftet match for salgsenheden.</div>
            </>
          )}

          {reviewable && (
            <>
              <div className="pe-section">Knyt produkter og send</div>
              {foundFromPage.length > 0 && (
                <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => setSelected((s) => foundFromPage.reduce((acc, p) => addProduct(acc, p), s))}>Tilføj de {foundFromPage.length} produkter, siden peger på</button>
              )}
              {recall.unverified_eans?.length > 0 && (
                <div className="admin-field"><label>Tal fra siden uden gyldig stregkode</label>
                  <div className="rc-pills">{recall.unverified_eans.map((raw) => <button key={raw} type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => { const q = searchTermFromRaw(raw); setQuery(q); search(q); }}>{raw}</button>)}</div></div>
              )}
              <form onSubmit={(e) => { e.preventDefault(); search(); }} className="usr-add">
                <input aria-label="Søg produkt" value={query} placeholder="Søg navn, mærke eller EAN…" onChange={(e) => setQuery(e.target.value)} />
                <button type="submit" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" disabled={searching || !query.trim()}>{searching ? "Søger…" : "Søg"}</button>
              </form>
              {results.map((p) => (
                <div key={p.id} className="rc-result">
                  <div style={{ minWidth: 0 }}><div className="rc-match-prod">{p.name}{p.brand ? ` · ${p.brand}` : ""}</div><div className="pe-muted np-mono">{p.ean}</div></div>
                  <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" disabled={selected.some((s) => s.ean === p.ean)} onClick={() => setSelected((s) => addProduct(s, p))}>{selected.some((s) => s.ean === p.ean) ? "Tilføjet" : "Tilføj"}</button>
                </div>
              ))}
              <div className="admin-label">Valgte produkter ({selected.length})</div>
              {selected.length === 0 ? <div className="pe-muted">Ingen valgt endnu. Uden stregkode på siden kan tilbagekaldelsen stadig gennemgås: søg og knyt produkter manuelt, eller arkivér uden besked.</div> : selected.map((p) => (
                <div key={p.ean} className="rc-result"><div style={{ minWidth: 0 }}><b>{p.name}</b>{p.brand ? ` · ${p.brand}` : ""} <span className="np-mono pe-muted">{p.ean}</span>{nameMismatch(p, recall) && <div className="usr-err">Navnet ligner ikke noget på tilbagekaldelsen. Kontrollér, at det er det rigtige produkt.</div>}</div>
                  <button type="button" className="todo-link-btn" onClick={() => setSelected((s) => removeProduct(s, p.ean))} aria-label={`Fjern ${p.name}`}>Fjern</button></div>
              ))}
              {selected.length > 0 && <div className="info-box" role="status">{affected === null ? "Tæller berørte brugere…" : affected === 0 ? "Ingen brugere har produkterne som favorit, scannet dem de seneste 90 dage eller på en indkøbsliste." : `${affected} ${affected === 1 ? "bruger" : "brugere"} får en besked (favorit, scannet de seneste 90 dage eller på en indkøbsliste). Beskeden siger, at produktet kan være berørt, og beder om at kontrollere parti og dato; den påstår ikke, at brugeren ejer et berørt parti.`}</div>}

              {confirm ? (
                <div className="todo-confirm" role="alertdialog" aria-label="Bekræft">
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{confirm === "send" ? confirmSendText(affected ?? 0, selected.length) : confirm === "archive" ? "Arkivér uden at sende besked? Ingen får en besked, men advarslen i appen påvirkes ikke af arkivering." : "Annullér tilbagekaldelsen? Der sendes ingen besked, og advarslen fjernes fra appen."}</div>
                  <div className="admin-field"><label htmlFor="rc-note">Note til historikken (valgfri; ved afsendelse bruges den som begrundelse for matchet)</label><textarea id="rc-note" className="admin-textarea" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} /></div>
                  {confirm === "send" && mismatched.length > 0 && <label className="usr-check"><input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} /><span>Jeg har kontrolleret, at de markerede produkter hører til tilbagekaldelsen.</span></label>}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" disabled={busy} onClick={() => setConfirm(null)}>Annuller</button>
                    <button type="button" className={`admin-btn admin-btn-sm admin-touch ${confirm === "cancel" ? "admin-btn-danger" : "admin-btn-primary"}`} disabled={busy || (confirm === "send" && mismatched.length > 0 && !ack)} onClick={() => finish(confirm === "send" ? "link" : confirm)}>{busy ? "Gemmer…" : confirm === "send" ? "Bekræft og send" : confirm === "archive" ? "Arkivér" : "Annullér tilbagekaldelsen"}</button>
                  </div>
                </div>
              ) : (
                <div className="mi-actions">
                  <button type="button" className="admin-btn admin-btn-primary admin-touch" onClick={() => { setAck(false); setConfirm("send"); }} disabled={busy || selected.length === 0 || affected === null}>Gem og send besked</button>
                  <button type="button" className="admin-btn admin-btn-ghost admin-touch" onClick={() => setConfirm("archive")} disabled={busy}>Ingen relevante produkter</button>
                  <button type="button" className="admin-btn admin-btn-danger admin-touch" onClick={() => setConfirm("cancel")} disabled={busy}>Annullér</button>
                </div>
              )}
            </>
          )}

          <div className="pe-section">Varsling</div>
          {!state.detail ? <div className="pe-muted">Henter…</div> : !state.detail.statsOk ? <div className="pe-muted">Varslingstal er ikke tilgængelige endnu (kræver den seneste databaseopdatering).</div> : !notif || (notif.recipients === 0 && !notif.queued) ? (
            <div className="pe-muted">{reviewable ? "Ingen besked er sendt. Brugere varsles først, når produkter er knyttet." : "Ingen besked er registreret for denne tilbagekaldelse."}</div>
          ) : (
            <dl className="audit-detail">
              <div className="audit-detail-row"><dt>Kriterium</dt><dd>Favorit, scannet de seneste 90 dage eller på indkøbsliste, på de knyttede stregkoder</dd></div>
              <div className="audit-detail-row"><dt>Modtagere</dt><dd>{notif.recipients}</dd></div>
              <div className="audit-detail-row"><dt>Afsendt (accepteret af tjenesten)</dt><dd>{notif.sent}</dd></div>
              <div className="audit-detail-row"><dt>Fejlet</dt><dd>{notif.failed}</dd></div>
              <div className="audit-detail-row"><dt>Afventer / sprunget over</dt><dd>{notif.pending} / {notif.skipped}</dd></div>
              <div className="audit-detail-row"><dt>Udsendelse i kø</dt><dd>{notif.queued ? `${notif.queued.status === "done" ? "Behandlet" : notif.queued.status} (forsøg: ${notif.queued.attempts ?? 0})` : "–"}</dd></div>
            </dl>
          )}
          {notif && <div className="usr-hint">Levering til telefonen bekræftes ikke af push- og mailtjenesterne og kan derfor ikke opgøres. Samme besked sendes højst én gang pr. bruger og version.</div>}

          <div className="pe-section">Historik</div>
          {!state.detail ? <div className="pe-muted">Henter…</div> : !state.detail.eventsOk ? <div className="pe-muted">Historikken er ikke tilgængelig endnu (kræver den seneste databaseopdatering). Tidligere hændelser er bevaret.</div> : history.length === 0 ? <div className="pe-muted">Ingen registrerede hændelser.</div> : (
            <ul className="pe-history">{history.map((h) => <li key={h.key}><span>{fmtLocalFull(h.at)} · {h.by}</span><span>{h.text}</span></li>)}</ul>
          )}

          <Disclosure title="Original kildetekst">
            <div className="rc-text">{recall.raw_text || [recall.intro, recall.affected, recall.reason, recall.action].filter(Boolean).join("\n\n") || "Ingen tekst gemt."}</div>
            {!recall.raw_text && <div className="usr-hint">Den fulde originaltekst gemmes for nye og opdaterede tilbagekaldelser; her vises de gemte uddrag.</div>}
          </Disclosure>
          <Disclosure title="Tekniske oplysninger">
            <dl className="audit-detail">
              <div className="audit-detail-row"><dt>Id</dt><dd className="np-mono">{recall.id}</dd></div>
              <div className="audit-detail-row"><dt>Kilde-URL</dt><dd className="np-mono">{recall.source_url}</dd></div>
              <div className="audit-detail-row"><dt>Gyldige stregkoder</dt><dd className="np-mono">{(recall.eans || []).join(", ") || "–"}</dd></div>
              <div className="audit-detail-row"><dt>Ugyldige tal på siden</dt><dd className="np-mono">{(recall.unverified_eans || []).join(", ") || "–"}</dd></div>
            </dl>
          </Disclosure>
        </div>
      </div>
    </div>,
    document.body
  );
}
