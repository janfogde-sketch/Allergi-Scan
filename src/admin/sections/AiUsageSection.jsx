// @ts-nocheck
// AI-forbrug: kompakt analysedashboard over estimeret forbrug på Claude. Periodevælger, nøgletal, budget, diagram, forbrug pr. funktion samt foldbare
// måneds- og dagsoversigter. Alle tal er estimater (tokens × prisliste × kurs); se aiUsageLogic.js. Opdatering sker fra headerens ikon.
import React, { useState } from "react";
import { Icon } from "../../SharedComponents.jsx";
import { useShowSpinner } from "../RefreshContext.js";
import { useIsMobile } from "../useIsMobile.js";
import Disclosure from "../Disclosure.jsx";
import AiUsageChart from "./AiUsageChart.jsx";
import {
  PERIODS, PRICE_TABLE, PRICE_CHECKED, USD_TO_DKK, INTERNAL_FUNCTIONS, functionLabel, todayKey, periodRange, rowsIn, totals, functionShares, byMonth, byDay, byFunction,
  comparisonRanges, pctChange, dailySeries, metricOf, findAnomalies, budgetStatus, currentMonthRows, formatKr, formatNum, formatTokens, formatPct, monthLabel,
  dayLabelShort, dayLabelLong, ANOMALY_MIN_DAYS, ANOMALY_FACTOR, ANOMALY_MIN_EXTRA_DKK,
} from "../aiUsageLogic.js";

const METRICS = { dkk: "Kr.", calls: "Kald", tokens: "Tokens" };
const CAUSES = { mange: "mange kald", dyre: "dyre kald", begge: "både flere og dyrere kald", ukendt: "årsagen kan ikke fastslås ud fra tallene" };

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

function Kpi({ value, label, sub, up }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-num">{value}</div>
      <div className="admin-stat-label">{label}</div>
      {sub && <div className={`ai-kpi-sub${up ? " up" : ""}`}>{sub}</div>}
    </div>
  );
}

/** Forbrug pr. funktion i en foldet detalje: tokens og pris. */
function FunctionDetail({ rows }) {
  const list = byFunction(rows).filter((f) => f.calls > 0);
  return (
    <dl className="ai-detail">
      <dt>Tokens ind</dt><dd>{formatNum(totals(rows).input)}</dd>
      <dt>Tokens ud</dt><dd>{formatNum(totals(rows).output)}</dd>
      {list.map((f) => <React.Fragment key={f.key}><dt>{functionLabel(f.key)}</dt><dd>{formatKr(f.dkk)} · {formatNum(f.calls)} kald</dd></React.Fragment>)}
      {totals(rows).calls > 0 && <><dt>Gennemsnit pr. kald</dt><dd>{formatKr(totals(rows).dkk / totals(rows).calls)}</dd></>}
    </dl>
  );
}

function BudgetCard({ budget, spent, saveBudget }) {
  const [editing, setEditing] = useState(false);
  const [monthly, setMonthly] = useState("");
  const [w1, setW1] = useState("80");
  const [w2, setW2] = useState("100");
  const [saving, setSaving] = useState(false);
  const st = budgetStatus(budget, spent);
  const startEdit = () => { setMonthly(budget ? String(budget.monthly_dkk) : ""); setW1(String(budget ? budget.warn_1 : 80)); setW2(String(budget ? budget.warn_2 : 100)); setEditing(true); };
  const m = Number(String(monthly).replace(",", "."));
  const valid = m > 0 && m <= 1000000 && Number(w1) >= 1 && Number(w2) <= 500 && Number(w1) <= Number(w2);
  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const ok = await saveBudget({ monthly: m, warn1: Number(w1), warn2: Number(w2) });
    setSaving(false);
    if (ok) setEditing(false);
  };
  if (editing) {
    return (
      <div className="ai-card">
        <div className="ai-card-title">Månedligt AI-budget</div>
        <div className="ai-controls" style={{ marginBottom: 6 }}>
          <div><label htmlFor="b-m">Budget (kr.)</label><input id="b-m" className="admin-search" style={{ width: 120 }} inputMode="decimal" value={monthly} onChange={(e) => setMonthly(e.target.value)} /></div>
          <div><label htmlFor="b-w1">Første advarsel (%)</label><input id="b-w1" className="admin-search" style={{ width: 90 }} inputMode="numeric" value={w1} onChange={(e) => setW1(e.target.value)} /></div>
          <div><label htmlFor="b-w2">Anden advarsel (%)</label><input id="b-w2" className="admin-search" style={{ width: 90 }} inputMode="numeric" value={w2} onChange={(e) => setW2(e.target.value)} /></div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="admin-btn admin-btn-primary admin-btn-sm admin-touch" disabled={!valid || saving} onClick={save}>{saving ? "Gemmer…" : "Gem"}</button>
          <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => setEditing(false)}>Annullér</button>
          {budget && <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={async () => { if (await saveBudget(null)) setEditing(false); }}>Fjern budget</button>}
        </div>
        {!valid && monthly !== "" && <div className="ai-note" role="alert">Budgettet skal være over 0, og første advarsel må ikke være større end anden.</div>}
        <div className="ai-note">Advarsler vises kun her og stopper aldrig AI-funktionerne.</div>
      </div>
    );
  }
  if (!st) {
    return (
      <div className="ai-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div className="ai-card-title" style={{ margin: 0 }}>Månedligt AI-budget</div>
        <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={startEdit}>Opret budget</button>
      </div>
    );
  }
  return (
    <div className="ai-card">
      <div className="ai-card-head">
        <div className="ai-card-title">Månedligt AI-budget</div>
        <button type="button" className="admin-iconbtn" style={{ width: 44, height: 44, margin: "-8px -8px -8px 0" }} aria-label="Ret budget" onClick={startEdit}><Icon name="edit" size={16} color="var(--ink2)" /></button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, marginBottom: 6, flexWrap: "wrap" }}>
        <span>Forbrug denne måned: <b>{formatKr(st.spent)}</b> af {formatKr(st.total)}</span>
        <span>{st.left >= 0 ? `Tilbage: ${formatKr(st.left)}` : `Over budget med ${formatKr(-st.left)}`}</span>
      </div>
      <div className={`ai-progress ${st.level === "ok" ? "" : st.level}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(st.used * 100))} aria-label="Andel af månedsbudgettet brugt">
        <span style={{ width: `${Math.min(100, st.used * 100)}%` }} />
      </div>
      <div className="ai-note" role={st.level === "ok" ? undefined : "status"}>
        {formatPct(st.used, 0)} brugt
        {st.level === "warn" && ` · over ${st.warn1} % af budgettet`}
        {st.level === "over" && ` · budgettet er nået (${st.warn2} %)`}
      </div>
    </div>
  );
}

export default function AiUsageSection({ rows, loading, loaded, error, load, budget, budgetAvailable, saveBudget }) {
  const showSpinner = useShowSpinner(loading, rows.length > 0);
  const narrow = useIsMobile();
  const [kind, setKind] = useState("month");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [metric, setMetric] = useState("dkk");

  const today = todayKey();
  const range = periodRange(kind, today, custom);
  const inRange = range ? rowsIn(rows, range) : [];
  const t = totals(inRange);
  const cmpR = range ? comparisonRanges(kind, range, today, rows) : null;
  const cur = cmpR ? totals(rowsIn(rows, cmpR.current)) : null;
  const prev = cmpR ? totals(rowsIn(rows, cmpR.previous)) : null;
  const cmpText = (a, b) => {
    const p = pctChange(a, b);
    return p === null ? null : `${p >= 0 ? "+" : "−"}${formatPct(Math.abs(p), 0)} mod forrige periode`;
  };
  const series = range ? dailySeries(rows, range) : [];
  const anomalies = findAnomalies(rows);
  const flaggedDays = new Map(anomalies.flagged.map((a) => [a.day, a]));
  const chartData = series.map((d) => ({ day: d.day, value: metricOf(d, metric), state: d.state, flagged: flaggedDays.has(d.day) }));
  const shares = functionShares(inRange);
  const monthSpent = totals(currentMonthRows(rows, today)).dkk;
  const flaggedInRange = range ? anomalies.flagged.filter((a) => a.day >= range.from && a.day <= range.to).sort((a, b) => (a.day < b.day ? 1 : -1)) : [];
  const dayList = byDay(inRange);
  const fmtMetric = metric === "dkk" ? formatKr : metric === "calls" ? formatNum : formatTokens;
  const axisFmt = metric === "dkk" ? (v) => formatNum(Math.round(v * 100) / 100) : metric === "calls" ? formatNum : formatTokens;

  let body;
  if (error && (rows.length === 0 || error.denied)) {
    body = error.denied
      ? <StateBox role="alert" icon="shield" title="Ingen adgang" text="Du har ikke adgang til forbrugstallene. Log ind med en administratorkonto." />
      : <StateBox role="alert" icon="warning" title="Forbruget kunne ikke hentes" text="Tjek forbindelsen, og prøv igen." action={<button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={() => load()}>Prøv igen</button>} />;
  } else if (showSpinner) {
    body = <div className="admin-loading-row"><div className="admin-spinner" /> Henter…</div>;
  } else if (!loaded) {
    body = null;
  } else if (rows.length === 0) {
    body = <StateBox icon="zap" title="Ingen AI-aktivitet registreret endnu" text="Optællingen begynder med det første AI-kald." />;
  } else if (!range) {
    body = <div className="admin-info-note" role="status">Vælg både fra- og til-dato for at se en brugerdefineret periode.</div>;
  } else {
    body = (
      <>
        {error && <div className="todo-confirm" role="alert" style={{ marginBottom: 10 }}>Opdateringen mislykkedes; de viste tal kan være forældede. <button type="button" className="todo-link-btn" style={{ minHeight: 32, textDecoration: "underline" }} onClick={() => load()}>Prøv igen</button></div>}
        {inRange.length === 0 ? (
          <StateBox icon="clock" title="Intet forbrug i den valgte periode" text="Der er registreret AI-forbrug i andre perioder. Vælg en anden periode for at se det." />
        ) : (
          <>
            <div className="dash-stat-grid" style={{ marginBottom: 12 }}>
              <Kpi value={formatKr(t.dkk)} label="Estimeret forbrug" sub={cur && prev ? cmpText(cur.dkk, prev.dkk) : null} up={cur && prev && cur.dkk > prev.dkk} />
              <Kpi value={formatNum(t.calls)} label="AI-kald" sub={cur && prev ? cmpText(cur.calls, prev.calls) : null} up={cur && prev && cur.calls > prev.calls} />
              <Kpi value={t.calls > 0 ? formatKr(t.dkk / t.calls) : "–"} label="Gennemsnit pr. kald" />
              <Kpi value={formatTokens(t.input + t.output)} label="Tokens" sub={`${formatTokens(t.input)} ind · ${formatTokens(t.output)} ud`} />
            </div>
            {t.unpricedCalls > 0 && <div className="admin-info-note" role="status">{formatNum(t.unpricedCalls)} kald har en model, hvis pris ikke er kendt, og er ikke med i omkostningen.</div>}
          </>
        )}

        {budgetAvailable && <BudgetCard budget={budget} spent={monthSpent} saveBudget={saveBudget} />}

        {inRange.length > 0 && (
          <>
            <div className="ai-card">
              <div className="ai-card-head">
                <h3 className="ai-card-title">Forbrug over tid</h3>
                <div className="admin-segment" role="group" aria-label="Vis">
                  {Object.entries(METRICS).map(([k, v]) => <button key={k} type="button" className={metric === k ? "active" : ""} aria-pressed={metric === k} onClick={() => setMetric(k)}>{v}</button>)}
                </div>
              </div>
              <AiUsageChart data={chartData} format={fmtMetric} axisFormat={axisFmt} narrow={narrow} label={`Forbrug pr. dag, ${METRICS[metric].toLowerCase()}`} />
              <div className="ai-note">Gule søjler er usædvanligt høje dage. Blege søjler er dage før registreringen begyndte.</div>
              {flaggedInRange.length > 0 && (
                <ul className="ai-note" style={{ paddingLeft: 18, margin: "6px 0 0" }}>
                  {flaggedInRange.map((a) => (
                    <li key={a.day}><b>{dayLabelShort(a.day)}</b>: {formatKr(a.dkk)} (typisk {formatKr(a.median)}) – {CAUSES[a.cause]}{a.topFunction ? `; mest fra ${functionLabel(a.topFunction)}${a.internalTop ? " (intern)" : ""}` : ""}.</li>
                  ))}
                </ul>
              )}
              {!anomalies.enough && <div className="ai-note">Usædvanlige dage markeres, når der er mindst {ANOMALY_MIN_DAYS} dage med data (nu {anomalies.daysWithData}).</div>}
            </div>

            <div className="ai-card">
              <h3 className="ai-card-title">Forbrug pr. funktion</h3>
              {shares.map((f) => (
                <div key={f.key} className="ai-fn">
                  <div className="ai-fn-top"><span>{functionLabel(f.key)}{INTERNAL_FUNCTIONS.includes(f.key) ? " (intern)" : ""}</span><span>{formatKr(f.dkk)} · {formatPct(f.share)}</span></div>
                  <div className="ai-progress" role="img" aria-label={`${functionLabel(f.key)}: ${formatPct(f.share)} af forbruget`}><span style={{ width: `${(f.share || 0) * 100}%` }} /></div>
                  <div className="ai-fn-sub">{formatNum(f.calls)} kald · {formatKr(f.perCall)} pr. kald</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="ai-card">
          <h3 className="ai-card-title">Måneder</h3>
          {byMonth(rows).map((m) => (
            <Disclosure key={m.key} title={monthLabel(m.key)} meta={`${formatKr(m.dkk)} · ${formatNum(m.calls)} kald`}><FunctionDetail rows={m.rows} /></Disclosure>
          ))}
        </div>

        {dayList.length > 0 && (
          <div className="ai-card">
            <h3 className="ai-card-title">Dage i perioden</h3>
            {dayList.map((d) => (
              <Disclosure key={d.key} title={<>{dayLabelShort(d.key)}{flaggedDays.has(d.key) && <span className="ai-flag">Usædvanlig</span>}</>} meta={`${formatNum(d.calls)} kald · ${formatKr(d.dkk)}`}>
                <FunctionDetail rows={d.rows} />
              </Disclosure>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="audit-head"><div className="audit-intro">Overblik over AI-kald, tokenforbrug og estimerede omkostninger.</div></div>
      <div className="ai-controls">
        <div><label htmlFor="ai-period">Periode</label>
          <select id="ai-period" value={kind} onChange={(e) => setKind(e.target.value)}>
            {Object.entries(PERIODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select></div>
        {kind === "custom" && (
          <>
            <div><label htmlFor="ai-from">Fra dato</label><input id="ai-from" type="date" value={custom.from} max={custom.to || today} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} /></div>
            <div><label htmlFor="ai-to">Til dato</label><input id="ai-to" type="date" value={custom.to} min={custom.from || undefined} max={today} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} /></div>
          </>
        )}
        {range && <div className="ai-note" style={{ margin: "0 0 10px" }}>{dayLabelLong(range.from)}{range.to !== range.from ? ` – ${dayLabelLong(range.to)}` : ""}</div>}
      </div>

      {body}

      <Disclosure title="Om AI-forbruget">
        <p style={{ margin: "0 0 6px" }}><strong>Model:</strong> {PRICE_TABLE.map((p) => p.label).join(", ")} bruges til læsning af fotos, allergen-tjek og kategorisering.</p>
        <p style={{ margin: "0 0 6px" }}><strong>Estimat:</strong> Alle beløb er estimerede, regnet ud fra registrerede tokens og Anthropics prisliste ({PRICE_TABLE.map((p) => `${p.label}: ${p.inUsd} dollar pr. million tokens ind og ${p.outUsd} ud`).join("; ")}; priserne er læst {PRICE_CHECKED} og ikke verificeret automatisk), omregnet med en fast kurs på {String(USD_TO_DKK).replace(".", ",")} kr. pr. dollar. De er ikke faktureret beløb; fakturaen fra Anthropic kan afvige. Cache-tokens tælles som almindeligt input, så estimatet kan være en smule for højt. Hver række bruger prisen for sin model.</p>
        <p style={{ margin: "0 0 6px" }}><strong>Datoer:</strong> Dage er i dansk tid. Før den første registrering vises forbruget som "ikke registreret", ikke som nul. Sammenligninger bruges kun for afsluttede døgn og perioder, der er helt registreret.</p>
        <p style={{ margin: "0 0 6px" }}><strong>Registreres:</strong> pr. dag, funktion og model: antal kald og tokens ind og ud. Der gemmes ingen bruger-id eller tekst her. Selve AI-kaldene sendes til Anthropic, som beskrevet i privatlivspolitikken.</p>
        <p style={{ margin: 0 }}><strong>Usædvanlige dage:</strong> en dag markeres, når den er mindst {ANOMALY_FACTOR} gange medianen og mindst {ANOMALY_MIN_EXTRA_DKK} kr. højere, og kun med mindst {ANOMALY_MIN_DAYS} dage med data. Der skelnes ikke mellem brugeraktivitet og baggrundsjob; kun kategorisering er kendt som intern.</p>
      </Disclosure>
    </>
  );
}
