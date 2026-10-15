// @ts-nocheck
// Fejl: overblik over fejlgrupper registreret i appen. Kompakte kort; detaljer, statushandlinger, tekniske oplysninger og historik ligger i et
// ark (bundark på mobil). Søgning og filtre (bag "Filtre") kører på serveren på tværs af hele historikken. Se useClientErrors.js og errorsLogic.js.
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Icon, showToast } from "../../SharedComponents.jsx";
import { useShowSpinner } from "../RefreshContext.js";
import Disclosure from "../Disclosure.jsx";
import {
  STATUS_LABELS, STATUS_PILL, SEVERITY_LABELS, SEVERITY_HELP, TABS, ERROR_PERIODS, areaLabel, shortMessage, occurrencesText, fmtShort, fmtLong,
  uaSummary, buildErrorPrompt, componentStackOf, errorsFilterCount, filterOptions, historyText,
} from "../errorsLogic.js";

const EMPTY = { screen: "", severity: "", period: "all", from: "", to: "", version: "", q: "" };

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

const copy = (value, okText = "Kopieret") => {
  const done = () => showToast(okText, "success");
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value).then(done).catch(() => showToast("Kunne ikke kopiere", "error"));
  else showToast("Kunne ikke kopiere", "error");
};

const StatusPill = ({ status }) => <span className={`admin-pill ${STATUS_PILL[status] || "admin-pill-neutral"}`}>{STATUS_LABELS[status] || status}</span>;
const SeverityChip = ({ severity }) => (severity ? <span className={`err-sev err-sev-${severity}`}>{SEVERITY_LABELS[severity] || severity}</span> : null);

/** Kode, stacktrace og lange adresser: monospace, ombrydes ikke, og ruller vandret inde i blokken (aldrig siden). */
const Code = ({ label, value }) => (value ? (
  <div className="err-code-wrap">
    <div className="err-code-head"><span>{label}</span>
      <button type="button" className="audit-copy" aria-label={`Kopiér ${label}`} onClick={() => copy(value)}><Icon name="copy" size={16} color="var(--muted)" /></button>
    </div>
    <pre className="err-code" tabIndex={0}>{value}</pre>
  </div>
) : null);

function History({ id, loadHistory }) {
  const [state, setState] = useState({ status: "loading" });
  const load = async () => {
    setState({ status: "loading" });
    const res = await loadHistory(id);
    setState(res ? { status: "ok", ...res } : { status: "error" });
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);
  if (state.status === "loading") return <div className="admin-loading-row"><div className="admin-spinner" /> Henter…</div>;
  if (state.status === "error") return <div role="alert">Historikken kunne ikke hentes. <button type="button" className="todo-link-btn" style={{ minHeight: 32, textDecoration: "underline" }} onClick={load}>Prøv igen</button></div>;
  if (state.items.length === 0) return <div>Ingen statusændringer endnu.</div>;
  return (
    <ul className="err-history">
      {state.items.map((h) => {
        const t = historyText(h, state.users);
        return (
          <li key={h.id}>
            <div className="err-history-title">{t.title}{t.change ? `: ${t.change}` : ""}</div>
            <div className="err-history-meta">{t.who} · {t.when}</div>
            {t.reason && <div className="err-history-reason">“{t.reason}”</div>}
          </li>
        );
      })}
    </ul>
  );
}

function Detail({ row, extended, onClose, setStatus, setSeverity, loadHistory }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState("");
  const [ignoring, setIgnoring] = useState(false);
  const [reason, setReason] = useState("");
  const cur = row; // sektionen giver altid den nyeste udgave (listen eller den holdte gruppe)
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const change = async (status, why = "") => {
    setBusy(true);
    setFailed("");
    const res = await setStatus(cur.id, status, why);
    setBusy(false);
    if (!res.ok) { setFailed(`Statussen blev ikke ændret: ${res.error}`); showToast("Statussen blev ikke ændret", "error"); return; }
    setIgnoring(false);
    setReason("");
    showToast(`Markeret som ${STATUS_LABELS[status].toLowerCase()}`, "success");
    if (res.reasonDropped) showToast("Begrundelsen kunne ikke gemmes endnu (databasen opdateres ved næste udgivelse)", "error");
  };
  const changeSeverity = async (e) => {
    const res = await setSeverity(cur.id, e.target.value);
    if (!res.ok) showToast("Alvorligheden blev ikke ændret", "error");
  };

  const platform = uaSummary(cur.user_agent);
  const versions = Array.isArray(cur.app_versions) && cur.app_versions.length ? cur.app_versions.join(", ") : cur.app_version || "";
  const item = (label, value) => (value ? <div className="audit-detail-row"><dt>{label}</dt><dd>{value}</dd></div> : null);
  const stack = [cur.stack, componentStackOf(cur.context) && `Komponent-stak:\n${componentStackOf(cur.context)}`].filter(Boolean).join("\n\n");

  return ReactDOM.createPortal(
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal audit-sheet-safe err-sheet" role="dialog" aria-modal="true" aria-labelledby="err-sheet-title" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="audit-sheet-head">
          <div style={{ minWidth: 0 }}>
            <div id="err-sheet-title" className="audit-sheet-title">{areaLabel(cur)}</div>
            <div className="err-pills"><StatusPill status={cur.status} /><SeverityChip severity={cur.severity} /></div>
          </div>
          <button type="button" className="admin-iconbtn audit-sheet-close" onClick={onClose} aria-label="Luk"><Icon name="x" size={20} color="var(--ink2)" /></button>
        </div>

        <p className="err-message">{cur.message}</p>
        <dl className="audit-detail">
          {item("Første forekomst", fmtLong(cur.first_seen, true))}
          {item("Seneste forekomst", fmtLong(cur.last_seen, true))}
          {item("Antal forekomster", Number(cur.occurrences).toLocaleString("da-DK"))}
          {cur.reopen_count > 0 && item("Vendt tilbage", `${cur.reopen_count} ${cur.reopen_count === 1 ? "gang" : "gange"} efter at være markeret løst`)}
          {item("Appversion", versions)}
          {item("Platform", platform)}
          {cur.status === "ignored" && item("Begrundelse for at ignorere", cur.status_reason && `“${cur.status_reason}”`)}
        </dl>

        {failed && <div className="todo-confirm" role="alert">{failed}</div>}

        {ignoring ? (
          <div className="err-ignore" role="group" aria-label="Ignorér fejl">
            <label htmlFor="err-reason">Hvorfor ignoreres fejlen? (påkrævet)</label>
            <textarea id="err-reason" rows={3} maxLength={500} value={reason} autoFocus placeholder="Fx: Kommer fra et gammelt udgivelsestidspunkt og kan ikke ske mere"
              onChange={(e) => setReason(e.target.value)} />
            <div className="err-actions">
              <button type="button" className="admin-btn admin-btn-primary admin-touch" disabled={busy || !reason.trim()} onClick={() => change("ignored", reason.trim())}>Ignorér fejlen</button>
              <button type="button" className="admin-btn admin-btn-ghost admin-touch" disabled={busy} onClick={() => { setIgnoring(false); setReason(""); }}>Annullér</button>
            </div>
          </div>
        ) : (
          <div className="err-actions">
            {cur.status === "open" && <>
              <button type="button" className="admin-btn admin-btn-primary admin-touch" disabled={busy} onClick={() => change("resolved")}>Markér som løst</button>
              <button type="button" className="admin-btn admin-btn-ghost admin-touch" disabled={busy} onClick={() => setIgnoring(true)}>Ignorér</button>
            </>}
            {cur.status === "resolved" && <button type="button" className="admin-btn admin-btn-ghost admin-touch" disabled={busy} onClick={() => change("open")}>Genåbn</button>}
            {cur.status === "ignored" && <>
              <button type="button" className="admin-btn admin-btn-ghost admin-touch" disabled={busy} onClick={() => change("open")}>Genåbn</button>
              <button type="button" className="admin-btn admin-btn-primary admin-touch" disabled={busy} onClick={() => change("resolved")}>Markér som løst</button>
            </>}
          </div>
        )}

        <button type="button" className="admin-btn admin-btn-ghost admin-touch err-prompt-btn" onClick={() => copy(buildErrorPrompt(cur), "Prompt kopieret")}>
          <Icon name="copy" size={16} color="var(--ink2)" /> Kopiér som prompt
        </button>

        {extended && (
          <div className="err-sevrow">
            <label htmlFor="err-sev">Alvorlighed</label>
            <select id="err-sev" className="admin-select" value={cur.severity || ""} onChange={changeSeverity}>
              <option value="">Ikke vurderet</option>
              {Object.entries(SEVERITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <div className="err-sevhelp">{cur.severity ? SEVERITY_HELP[cur.severity] : "Vurderes manuelt ud fra konsekvensen for brugeren."}</div>
          </div>
        )}

        <Disclosure title="Tekniske oplysninger">
          <div className="err-tech">
            <Code label="Fejlbesked" value={cur.message} />
            <Code label="Stacktrace" value={stack} />
            <Code label="Side" value={cur.url} />
            <Code label="Enhed" value={cur.user_agent} />
            <Code label="Kilde" value={cur.source} />
            <Code label="Fejl-id" value={cur.id} />
          </div>
        </Disclosure>
        <Disclosure title="Historik"><History id={cur.id} loadHistory={loadHistory} /></Disclosure>
      </div>
    </div>,
    document.body
  );
}

export default function ErrorsSection({ rows, loading, loadingMore, hasMore, loaded, error, stats, options, extended, load, loadMore, setStatus, setSeverity, loadHistory }) {
  const [tab, setTab] = useState("open");
  const [f, setF] = useState(EMPTY);
  const [q, setQ] = useState(""); // søgeordet, der er sendt til serveren (udskudt, mens man skriver)
  const [showFilters, setShowFilters] = useState(false);
  const [openId, setOpenId] = useState(null);
  const searchRef = useRef(null);
  const first = useRef(true);
  const opened = useRef(false);
  const showSpinner = useShowSpinner(loading, rows.length > 0);

  useEffect(() => {
    const t = setTimeout(() => setQ(f.q), first.current ? 0 : 350);
    return () => clearTimeout(t);
  }, [f.q]);
  const params = { status: tab, screen: f.screen, severity: f.severity, period: f.period, from: f.from, to: f.to, version: f.version, q };
  useEffect(() => {
    first.current = false;
    load(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bevidst: load genskabes hver gang og må ikke udløse nye hent
  }, [tab, f.screen, f.severity, f.period, f.from, f.to, f.version, q]);
  useEffect(() => {
    if (showFilters && opened.current) searchRef.current?.focus();
    opened.current = false;
  }, [showFilters]);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const filterCount = errorsFilterCount(f) + (f.q.trim() ? 1 : 0);
  const reset = () => setF(EMPTY);
  const toggleFilters = () => { if (!showFilters) opened.current = true; setShowFilters((v) => !v); };
  const opts = filterOptions(options);
  const openRow = openId ? rows.find((r) => r.id === openId) || null : null;
  const [kept, setKept] = useState(null); // åben gruppe, der forlod den viste fane ved en statusændring
  const shown = openRow || (kept && kept.id === openId ? kept : null);
  const changeStatus = async (id, status, why) => {
    const res = await setStatus(id, status, why);
    if (res.ok) setKept(res.row);
    return res;
  };
  const changeSev = async (id, sev) => {
    const res = await setSeverity(id, sev);
    if (res.ok) setKept(res.row);
    return res;
  };
  const num = (k) => (stats && stats[k] != null ? Number(stats[k]).toLocaleString("da-DK") : "–");

  let body;
  if (error && (rows.length === 0 || error.denied)) {
    body = error.denied
      ? <StateBox role="alert" icon="shield" title="Ingen adgang" text="Du har ikke adgang til fejlene. Log ind med en administratorkonto." />
      : <StateBox role="alert" icon="warning" title="Fejlene kunne ikke hentes" text="Det betyder ikke, at der ingen fejl er. Tjek forbindelsen, og prøv igen."
          action={<button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => load(params)}>Prøv igen</button>} />;
  } else if (showSpinner || (loading && rows.length === 0)) {
    body = <div className="admin-loading-row"><div className="admin-spinner" /> Henter…</div>;
  } else if (!loaded) {
    body = null;
  } else if (rows.length === 0) {
    body = filterCount > 0
      ? <StateBox icon="search" title="Ingen matchende fejl" text="Prøv at ændre din søgning eller dine filtre."
          action={<button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={reset}>Nulstil</button>} />
      : <StateBox icon="check" title={{ open: "Ingen åbne fejl", resolved: "Ingen løste fejl", ignored: "Ingen ignorerede fejl" }[tab] || "Ingen fejl registreret"}
          text={tab === "open" ? "Appen har ikke registreret nogen åbne fejl." : "Der er ingen fejl i denne visning."} />;
  } else {
    body = (
      <div className="admin-card-list">
        {rows.map((r) => (
          <button key={r.id} type="button" className="admin-item-card err-card" onClick={() => setOpenId(r.id)}>
            <div className="err-card-top">
              <span className="err-card-area">{areaLabel(r)}</span>
              <StatusPill status={r.status} /><SeverityChip severity={r.severity} />
            </div>
            <div className="err-card-msg">{shortMessage(r.message)}</div>
            <div className="err-card-meta">Seneste {fmtShort(r.last_seen)} · {occurrencesText(r.occurrences)}</div>
            <span className="audit-card-chev" aria-hidden="true"><Icon name="chevronRight" size={16} color="var(--muted2)" /></span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="audit-head"><div className="audit-intro">Overblik over registrerede fejl i EatSafe.</div></div>

      <div className="admin-tabs err-tabs" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={`admin-tab-btn${tab === k ? " active" : ""}`} onClick={() => setTab(k)}>
            {label} ({num(k === "all" ? "total" : k === "open" ? "open" : k === "resolved" ? "resolved" : "ignored")})
          </button>
        ))}
      </div>

      {stats && !stats.fallback && (
        <div className="err-stats" aria-label="Statistik">
          <div><b>{num("new_groups_7d")}</b><span>Nye fejlgrupper, 7 dage</span></div>
          <div><b>{num("occurrences")}</b><span>Forekomster i alt</span></div>
          <div><b>{num("reopened")}</b><span>Genopståede grupper</span></div>
        </div>
      )}

      <div className="admin-toolbar todo-toolbar">
        <button type="button" className={`admin-btn admin-btn-sm admin-touch ${filterCount ? "admin-btn-primary" : "admin-btn-ghost"}`} aria-expanded={showFilters} onClick={toggleFilters}>
          Filtre{filterCount ? ` (${filterCount})` : ""}
        </button>
        {filterCount > 0 && <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={reset}>Nulstil</button>}
      </div>

      {!showFilters && f.q.trim() && (
        <button type="button" className="audit-search-chip" aria-label={`Søgning: ${f.q}. Tryk for at ændre`} onClick={toggleFilters}>
          <Icon name="search" size={13} color="var(--green)" /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>“{f.q}”</span>
        </button>
      )}

      {showFilters && (
        <div className="admin-filter-panel audit-filter-panel">
          <div className="audit-filter-search"><label htmlFor="e-q">Søg</label>
            <div className="todo-search">
              <span className="todo-search-icon" aria-hidden="true"><Icon name="search" size={16} color="var(--muted)" /></span>
              <input id="e-q" ref={searchRef} type="search" className="admin-search" value={f.q} placeholder="Fejlbesked, skærm, stacktrace eller id…" enterKeyHint="search"
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} onChange={set("q")} />
              {f.q && (
                <button type="button" className="todo-search-clear" aria-label="Ryd søgning" onClick={() => { setF((x) => ({ ...x, q: "" })); searchRef.current?.focus(); }}>
                  <Icon name="x" size={16} />
                </button>
              )}
            </div></div>
          <div><label htmlFor="e-screen">Skærm</label>
            <select id="e-screen" className="admin-select" value={f.screen} onChange={set("screen")}>
              <option value="">Alle</option>
              {opts.hasNoScreen && <option value="__none">Uden skærm</option>}
              {opts.screens.map((s) => <option key={s} value={s}>{s}</option>)}
            </select></div>
          {extended && (
            <div><label htmlFor="e-sev">Alvorlighed</label>
              <select id="e-sev" className="admin-select" value={f.severity} onChange={set("severity")}>
                <option value="">Alle</option>
                {Object.entries(SEVERITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
          )}
          {extended && (
            <div><label htmlFor="e-ver">Appversion</label>
              <select id="e-ver" className="admin-select" value={f.version} onChange={set("version")}>
                <option value="">Alle</option>
                {opts.versions.map((v) => <option key={v} value={v}>{v}</option>)}
              </select></div>
          )}
          <div className="audit-filter-wide"><label htmlFor="e-period">Seneste forekomst</label>
            <select id="e-period" className="admin-select" value={f.period} onChange={set("period")}>
              {Object.entries(ERROR_PERIODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></div>
          {f.period === "custom" && (
            <>
              <div><label htmlFor="e-from">Fra dato</label><input id="e-from" type="date" value={f.from} max={f.to || undefined} onChange={set("from")} /></div>
              <div><label htmlFor="e-to">Til dato</label><input id="e-to" type="date" value={f.to} min={f.from || undefined} onChange={set("to")} /></div>
            </>
          )}
        </div>
      )}

      {error && !error.denied && rows.length > 0 && (
        <div className="todo-confirm" role="alert" style={{ marginBottom: 10 }}>
          Flere fejl kunne ikke hentes.{" "}
          <button type="button" className="todo-link-btn" style={{ minHeight: 32, textDecoration: "underline" }} onClick={loadMore}>Prøv igen</button>
        </div>
      )}

      {body}

      {hasMore && rows.length > 0 && !error?.denied && (
        <div style={{ textAlign: "center", margin: "4px 0 12px" }}>
          <button type="button" className="admin-btn admin-btn-ghost admin-touch" disabled={loadingMore} aria-busy={loadingMore} onClick={loadMore}>
            {loadingMore ? <><div className="admin-spinner" /> Henter…</> : "Vis flere"}
          </button>
        </div>
      )}

      <Disclosure title="Om fejlregistrering">
        <p style={{ margin: "0 0 6px" }}><strong>Fejlgrupper:</strong> samme fejl samles i én gruppe ud fra kilde, skærm og en renset fejlbesked (tal, adresser og id'er ignoreres). Hver gang den sker igen, tælles en ny forekomst på gruppen.</p>
        <p style={{ margin: "0 0 6px" }}><strong>Status:</strong> en løst fejl åbnes automatisk igen, hvis den sker igen (det står i historikken). En ignoreret fejl forbliver ignoreret, men forekomsterne tælles stadig. Alvorlighed sættes manuelt ud fra konsekvensen for brugeren.</p>
        <p style={{ margin: 0 }}><strong>Gemmes ikke:</strong> navn, e-mail, allergier eller andre helbredsoplysninger. Fejl, der skyldes en gammel version efter en udgivelse, forsøger appen at undgå at registrere.</p>
      </Disclosure>

      {shown && <Detail row={shown} extended={extended} onClose={() => { setOpenId(null); setKept(null); }} setStatus={changeStatus} setSeverity={changeSev} loadHistory={loadHistory} />}
    </>
  );
}
