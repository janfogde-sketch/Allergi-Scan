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
  PERIODS, ORIGINS, PRICE_TABLE, PRICE_CHECKED, USD_TO_DKK, functionLabel, filterOrigin, originSplit, focusScale, formatPerCall, FOCUS_FACTOR, todayKey, periodRange, rowsIn, totals, functionShares, byMonth, byDay, byFunction,
  comparisonRanges, pctChange, dailySeries, metricOf, findAnomalies, budgetStatus, currentMonthRows, formatKr, formatNum, formatTokens, formatPct, monthLabel,
  dayLabelShort, dayLabelLong, ANOMALY_MIN_DAYS, ANOMALY_FACTOR, ANOMALY_MIN_EXTRA_DKK,
} from "../aiUsageLogic.js";

const ORIGIN_SHORT = { user: "Bruger", internal: "Intern", unknown: "Ukendt" };
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
  const split = originSplit(rows);
  return (
    <dl className="ai-detail">
      <dt>Tokens ind</dt><dd>{formatNum(totals(rows).input)}</dd>
      <dt>Tokens ud</dt><dd>{formatNum(totals(rows).output)}</dd>
      {list.map((f) => <React.Fragment key={f.key}><dt>{functionLabel(f.key)}</dt><dd>{formatKr(f.dkk)} · {formatNum(f.calls)} kald</dd></React.Fragment>)}
      {totals(rows).calls > 0 && <><dt>Gennemsnit pr. kald</dt><dd>{formatPerCall(totals(rows).dkk / totals(rows).calls)}</dd></>}
      {split.length > 1 && split.map((o) => <React.Fragment key={o.key}><dt>{o.label}</dt><dd>{formatKr(o.dkk)} · {formatNum(o.calls)} kald</dd></React.Fragment>)}
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
        <span>Forbrug denne måned (alle typer): <b>{formatKr(st.spent)}</b> af {formatKr(st.total)}</span>
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
  const [origin, setOrigin] = useState("all");
  const [focus, setFocus] = useState(false);
  const [info, setInfo] = useState(false);
  const [pickedDay, setPickedDay] = useState(null);

  const today = todayKey();
  const range = periodRange(kind, today, custom);
  const scoped = filterOrigin(rows, origin); // forbrugstypen gælder alt undtagen budgettet (kalendermåneden, alle typer)
  const inRange = range ? rowsIn(scoped, range) : [];
  const t = totals(inRange);
  const cmpR = range ? comparisonRanges(kind, range, today, scoped) : null;
  const cur = cmpR ? totals(rowsIn(scoped, cmpR.current)) : null;
  const prev = cmpR ? totals(rowsIn(scoped, cmpR.previous)) : null;
  const cmpText = (a, b) => {
    const p = pctChange(a, b);
    return p === null ? null : `${p >= 0 ? "+" : "−"}${formatPct(Math.abs(p), 0)} mod forrige periode`;
  };
  const series = range ? dailySeries(scoped, range) : [];
  const anomalies = findAnomalies(scoped);
  const flaggedDays = new Map(anomalies.flagged.map((a) => [a.day, a]));
  const chartData = series.map((d) => ({ day: d.day, value: metricOf(d, metric), state: d.state, flagged: flaggedDays.has(d.day) }));
  const fs = focusScale(chartData.map((d) => d.value));
  const capOn = focus && fs.possible;
  const clipped = capOn ? fs.outliers.map((i) => chartData[i]) : [];
  const daysWithData = series.filter((d) => d.state === "data").length;
  const pickedSeries = pickedDay ? series.find((d) => d.day === pickedDay) : null;
  const pickedRows = pickedSeries ? inRange.filter((r) => r.day === pickedDay) : [];
  const months = byMonth(scoped);
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
          <StateBox icon="clock" title={scoped.length === 0 ? "Intet forbrug af den valgte forbrugstype" : "Intet forbrug i den valgte periode"} text={scoped.length === 0 ? "Der er registreret AI-forbrug af andre typer. Vælg en anden forbrugstype for at se det." : "Der er registreret AI-forbrug i andre perioder. Vælg en anden periode for at se det."} />
        ) : (
          <>
            <div className="dash-stat-grid" style={{ marginBottom: 12 }}>
              <Kpi value={formatKr(t.dkk)} label="Estimeret forbrug" sub={cur && prev ? cmpText(cur.dkk, prev.dkk) : null} up={cur && prev && cur.dkk > prev.dkk} />
              <Kpi value={formatNum(t.calls)} label="AI-kald" sub={cur && prev ? cmpText(cur.calls, prev.calls) : null} up={cur && prev && cur.calls > prev.calls} />
              <Kpi value={t.calls > 0 ? formatPerCall(t.dkk / t.calls) : "–"} label="Gennemsnit pr. kald" />
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
              <AiUsageChart data={chartData} format={fmtMetric} axisFormat={axisFmt} narrow={narrow} label={`Forbrug pr. dag, ${METRICS[metric].toLowerCase()}`} cap={capOn ? fs.cap : null} onPick={setPickedDay}>
                {pickedSeries && (
                  <div className="ai-day" role="status">
                    <div className="ai-day-title">{dayLabelLong(pickedSeries.day)}{flaggedDays.has(pickedSeries.day) && <span className="ai-flag">Usædvanlig</span>}</div>
                    {pickedSeries.state !== "data" ? (
                      <div>{pickedSeries.state === "none" ? "Ikke registreret (før registreringen begyndte)." : "Registreret, men intet forbrug."}</div>
                    ) : (
                      <dl className="ai-detail">
                        <dt>Omkostning (estimat)</dt><dd>{formatKr(pickedSeries.dkk)}</dd>
                        <dt>AI-kald</dt><dd>{formatNum(pickedSeries.calls)}</dd>
                        <dt>Tokens ind</dt><dd>{formatNum(pickedSeries.input)}</dd>
                        <dt>Tokens ud</dt><dd>{formatNum(pickedSeries.output)}</dd>
                        {byFunction(pickedRows).filter((f) => f.calls > 0).map((f) => <React.Fragment key={f.key}><dt>{functionLabel(f.key)}</dt><dd>{formatKr(f.dkk)} · {formatNum(f.calls)} kald</dd></React.Fragment>)}
                        {originSplit(pickedRows).length > 1 && originSplit(pickedRows).map((o) => <React.Fragment key={o.key}><dt>{o.label}</dt><dd>{formatKr(o.dkk)}</dd></React.Fragment>)}
                      </dl>
                    )}
                  </div>
                )}
              </AiUsageChart>
              <div className="ai-note ai-chart-note">
                <span>Data registreret på {daysWithData} {daysWithData === 1 ? "dag" : "dage"}. Tryk på en søjle for detaljer.</span>
                <button type="button" className="ai-info-btn" aria-label="Forklaring til diagrammet" aria-expanded={info} onClick={() => setInfo((v) => !v)}><Icon name="info" size={16} color="var(--muted)" /></button>
              </div>
              {info && <div className="ai-note" role="note">Grønne søjler er dage med forbrug, gule er usædvanligt høje dage, tynde grå er registrerede dage uden forbrug, og blege stiplede er dage før registreringen begyndte (ukendt, ikke nul).</div>}
              {fs.possible && (
                <div className="ai-focus">
                  <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" aria-pressed={capOn} onClick={() => setFocus((v) => !v)}>{capOn ? "Vis fuld skala" : "Fokusér på almindelige dage"}</button>
                </div>
              )}
              {capOn && (
                <div className="ai-note" role="status">Skalaen er afkortet, så almindelige dage kan aflæses: {clipped.map((d) => `${dayLabelShort(d.day)} (${fmtMetric(d.value)})`).join(", ")} går ud over diagrammet og er tegnet stribet. Tryk på søjlen for den rigtige værdi.</div>
              )}
              {flaggedInRange.length > 0 && (
                <ul className="ai-note" style={{ paddingLeft: 18, margin: "6px 0 0" }}>
                  {flaggedInRange.map((a) => (
                    <li key={a.day}><b>{dayLabelShort(a.day)}</b>: {formatKr(a.dkk)} (typisk {formatKr(a.median)}) – {CAUSES[a.cause]}{a.functions && a.functions.length ? `; bidrag: ${a.functions.map((f) => `${functionLabel(f.key)} ${formatKr(f.dkk)}`).join(", ")}` : ""}.</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="ai-card">
              <h3 className="ai-card-title">Forbrug pr. funktion</h3>
              {shares.map((f) => (
                <div key={f.key} className="ai-fn">
                  <div className="ai-fn-top"><span>{functionLabel(f.key)}</span><span>{formatKr(f.dkk)} · {formatPct(f.share)}</span></div>
                  <div className="ai-progress" role="img" aria-label={`${functionLabel(f.key)}: ${formatPct(f.share)} af forbruget`}><span style={{ width: `${(f.share || 0) * 100}%` }} /></div>
                  <div className="ai-fn-sub">{formatNum(f.calls)} kald · {formatPerCall(f.perCall)} pr. kald{origin === "all" && originSplit(f.rows).length > 1 ? ` · ${originSplit(f.rows).map((o) => `${ORIGIN_SHORT[o.key]} ${formatKr(o.dkk)}`).join(" · ")}` : ""}{origin === "all" && originSplit(f.rows).length === 1 ? ` · ${ORIGIN_SHORT[originSplit(f.rows)[0].key]}` : ""}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {months.length >= 2 && (
          <div className="ai-card">
            <h3 className="ai-card-title">Måneder</h3>
            {months.map((m) => (
              <Disclosure key={m.key} title={monthLabel(m.key)} meta={`${formatKr(m.dkk)} · ${formatNum(m.calls)} kald`}><FunctionDetail rows={m.rows} /></Disclosure>
            ))}
          </div>
        )}

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
        <div><label htmlFor="ai-origin">Forbrugstype</label>
          <select id="ai-origin" value={origin} onChange={(e) => setOrigin(e.target.value)}>
            {Object.entries(ORIGINS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
        <p style={{ margin: "0 0 6px" }}><strong>Estimat:</strong> Alle beløb er estimerede: registrerede tokens × Anthropics prisliste ({PRICE_TABLE.map((p) => `${p.label}: ${p.inUsd} dollar pr. million tokens ind og ${p.outUsd} ud`).join("; ")}; læst {PRICE_CHECKED}, ikke verificeret automatisk) × en fast kurs på {String(USD_TO_DKK).replace(".", ",")} kr. pr. dollar. Der er ingen fakturadata, så beløbene kan afvige fra Anthropics faktura. Totaler beregnes af de underliggende tal og afrundes først ved visning, så dagsbeløb kan afvige en øre fra månedens sum. Cache-tokens tælles som almindeligt input; AI-kaldene bruger ikke prompt-caching i dag.</p>
        <p style={{ margin: "0 0 6px" }}><strong>Datoer:</strong> Dage er i dansk tid. Før den første registrering vises forbruget som "ikke registreret", ikke som nul. Sammenligninger bruger kun afsluttede døgn og perioder, der er helt registreret. Budgettet gælder altid kalendermåneden og alle forbrugstyper, uanset valgt periode og filter.</p>
        <p style={{ margin: "0 0 6px" }}><strong>Forbrugstype:</strong> Brugerfunktion er et kald med en almindelig brugers login (fx læsning af fotos). Intern proces er et kald med service-nøglen (baggrundsjob som kategorisering). Ukendt er alt, der ikke kan fastslås: forbrug registreret før oprindelsen blev gemt (undtagen kategorisering, som kun kan kaldes internt) og allergen-tjek fra en administrator, hvor det ikke kan ses, om det kom fra panelet eller eget brug. Der gættes ikke.</p>
        <p style={{ margin: "0 0 6px" }}><strong>Diagrammet:</strong> grønne søjler er dage med forbrug, gule er usædvanligt høje, tynde grå er dage uden forbrug, og blege stiplede er dage før registreringen. "Fokusér på almindelige dage" afkorter skalaen, når en dag er mindst {FOCUS_FACTOR} gange medianen; de afkortede søjler er stribede og nævnes under diagrammet.</p>
        <p style={{ margin: "0 0 6px" }}><strong>Usædvanlige dage:</strong> en dag markeres, når den er mindst {ANOMALY_FACTOR} gange medianen og mindst {ANOMALY_MIN_EXTRA_DKK} kr. højere, og kun med mindst {ANOMALY_MIN_DAYS} dage med data (nu {anomalies.daysWithData}). Forklaringen skelner mellem flere kald og dyrere kald.</p>
        <p style={{ margin: 0 }}><strong>Registreres:</strong> pr. dag, funktion, model og forbrugstype: antal kald og tokens ind og ud. Der gemmes ingen bruger-id eller tekst her. Selve AI-kaldene sendes til Anthropic, som beskrevet i privatlivspolitikken.</p>
      </Disclosure>
    </>
  );
}
