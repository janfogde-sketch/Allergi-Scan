// @ts-nocheck
// Frafald i onboarding: kompakt analysedashboard. Periodevælger (som AI-forbrug), fire nøgletal, gennemførelsesindikator, ÉN samlet oversigt over senest registrerede trin,
// en tragt fra faktisk registrerede trin (kun hvor data findes) og udvikling over tid, når der er nok konti. Kun samlede tal. Se onboardingFunnelLogic.js.
import React, { useState, useEffect } from "react";
import { Icon } from "../../SharedComponents.jsx";
import { useShowSpinner } from "../RefreshContext.js";
import Disclosure from "../Disclosure.jsx";
import AiUsageChart from "./AiUsageChart.jsx";
import { useIsMobile } from "../useIsMobile.js";
import { PERIODS, periodRange, todayKey, dailySeries, dayLabelLong, dayLabelShort, formatNum } from "../aiUsageLogic.js";
import { summarizeStats, trendEnough, pctText, STEP_LABELS, SMALL_SAMPLE, TREND_MIN_ACCOUNTS, TREND_MIN_DAYS } from "../onboardingFunnelLogic.js";

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

const Kpi = ({ value, label, sub }) => (
  <div className="admin-stat-card"><div className="admin-stat-num">{value}</div><div className="admin-stat-label">{label}</div>{sub && <div className="ai-kpi-sub">{sub}</div>}</div>
);

/** Én række i oversigten: navn, antal og en kompakt vandret søjle. Nuller vises diskret. */
function BarRow({ label, count, inactive, pct, max, tone }) {
  const zero = count === 0;
  return (
    <div className={`ai-fn onb-row${zero ? " zero" : ""}`}>
      <div className="ai-fn-top"><span>{label}</span><span>{formatNum(count)}{pct !== null && !zero ? ` · ${pctText(pct)}` : ""}</span></div>
      <div className={`ai-progress${tone ? ` ${tone}` : ""}`} role="img" aria-label={`${label}: ${count}`}><span style={{ width: `${max > 0 ? (count / max) * 100 : 0}%` }} /></div>
      {inactive > 0 && <div className="ai-fn-sub">heraf {formatNum(inactive)} uden fremgang i over 24 timer</div>}
    </div>
  );
}

export default function OnboardingFunnelSection({ data, loading, loaded, error, load }) {
  const narrow = useIsMobile();
  const [kind, setKind] = useState("month");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [includeTest, setIncludeTest] = useState(false);
  const today = todayKey();
  const range = periodRange(kind, today, custom);
  const s = summarizeStats(data);
  const showSpinner = useShowSpinner(loading, !!s);

  useEffect(() => {
    if (range) load({ from: range.from, to: range.to, includeTest });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bevidst: load genskabes hver gang og må ikke udløse nye hent
  }, [range && range.from, range && range.to, includeTest]);

  const retry = () => range && load({ from: range.from, to: range.to, includeTest });
  const maxStep = s ? Math.max(1, s.unconfirmed, s.notStarted, ...s.steps.map((x) => x.latest)) : 1;
  const series = s && range ? dailySeries(s.daily.map((d) => ({ day: d.date, function_name: "x", calls: d.created, input_tokens: 0, output_tokens: 0 })), range) : [];
  const chartData = series.map((d) => ({ day: d.day, value: d.calls, state: d.calls > 0 ? "data" : "zero", flagged: false }));

  let body;
  if (error && !s) {
    body = error.denied
      ? <StateBox role="alert" icon="shield" title="Ingen adgang" text="Du har ikke adgang til statistikken. Log ind med en administratorkonto." />
      : error.unavailable
        ? <StateBox role="status" icon="clock" title="Statistikken er ikke aktiveret endnu" text="Den nye onboardingstatistik virker, når databaseændringen er udgivet." />
        : <StateBox role="alert" icon="warning" title="Statistikken kunne ikke hentes" text="Tjek forbindelsen, og prøv igen." action={<button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={retry}>Prøv igen</button>} />;
  } else if (!range) {
    body = <div className="admin-info-note" role="status">Vælg både fra- og til-dato for at se en brugerdefineret periode.</div>;
  } else if (showSpinner || (loading && !s)) {
    body = <div className="admin-loading-row"><div className="admin-spinner" /> Henter…</div>;
  } else if (!loaded || !s) {
    body = null;
  } else if (s.total === 0) {
    body = <StateBox icon="clock" title={s.firstAccount ? "Ingen konti oprettet i perioden" : "Ingen konti oprettet endnu"} text={s.firstAccount ? "Der findes konti fra andre perioder. Vælg en anden periode for at se dem." : "Statistikken begynder med den første konto."} />;
  } else {
    const funnelActive = s.funnelUsers > 0;
    body = (
      <>
        {error && <div className="todo-confirm" role="alert" style={{ marginBottom: 10 }}>Opdateringen mislykkedes; tallene kan være forældede. <button type="button" className="todo-link-btn" style={{ minHeight: 32, textDecoration: "underline" }} onClick={retry}>Prøv igen</button></div>}
        <div className="dash-stat-grid" style={{ marginBottom: 12 }}>
          <Kpi value={formatNum(s.total)} label="Oprettede konti" />
          <Kpi value={`${formatNum(s.completed)}`} label="Gennemført" sub={pctText(s.completedPct)} />
          <Kpi value={formatNum(s.inProgress)} label="Igangværende" sub="fremgang inden for 24 timer" />
          <Kpi value={formatNum(s.dropout)} label="Muligt frafald" sub="ingen fremgang i over 24 timer" />
        </div>

        <div className="ai-card">
          <div className="ai-card-head"><h3 className="ai-card-title">Onboarding gennemført</h3></div>
          <div style={{ fontSize: 13, marginBottom: 6 }}><b>{formatNum(s.completed)} af {formatNum(s.total)} konti</b> – {pctText(s.completedPct)}</div>
          <div className="ai-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((s.completedPct || 0) * 100)} aria-label="Andel af kontiene, der har gennemført onboarding">
            <span style={{ width: `${(s.completedPct || 0) * 100}%` }} />
          </div>
          {(s.notStarted > 0 || s.unconfirmed > 0) && (
            <div className="ai-note">Heraf før selve onboarding: {formatNum(s.unconfirmed)} med ubekræftet e-mail og {formatNum(s.notStarted)} uden registreret fremgang. De tælles ikke som gennemført.</div>
          )}
          <div className="ai-note">{formatNum(s.completed)} gennemført + {formatNum(s.inProgress)} igangværende + {formatNum(s.dropout)} muligt frafald + {formatNum(s.notStarted)} ikke startet + {formatNum(s.unconfirmed)} ubekræftet = {formatNum(s.total)}{s.reconciled ? "" : " (stemmer ikke)"}</div>
          {s.small && <div className="admin-info-note" role="status" style={{ marginTop: 8 }}>Datagrundlaget er endnu begrænset ({formatNum(s.total)} konti). Frafaldsmønstre kan ændre sig, når flere brugere gennemfører onboarding.</div>}
        </div>

        <div className="ai-card">
          <h3 className="ai-card-title">Hvor brugerne senest nåede til</h3>
          <BarRow label="E-mail ikke bekræftet" count={s.unconfirmed} inactive={0} pct={null} max={maxStep} tone="muted" />
          <BarRow label="Ikke startet (ingen registreret fremgang)" count={s.notStarted} inactive={0} pct={null} max={maxStep} tone="muted" />
          {s.steps.map((x) => <BarRow key={x.step} label={`${x.step}. ${x.label}`} count={x.latest} inactive={x.inactive} pct={x.pct} max={maxStep} />)}
          <div className="ai-note">Uafsluttede forløb og deres senest registrerede trin. Det er ikke en tragt; trin 4 og 5 er valgfrie, og et sprunget valgfrit trin tæller ikke som frafald.</div>
        </div>

        {funnelActive && (
          <div className="ai-card">
            <h3 className="ai-card-title">Tragt: observerede overgange</h3>
            {s.funnel.map((f) => (
              <div key={f.step} className="ai-fn onb-row">
                <div className="ai-fn-top"><span>{f.step}. {STEP_LABELS[f.step]}</span><span>{formatNum(f.reached)} nåede</span></div>
                <div className="ai-progress" role="img" aria-label={`Trin ${f.step}: ${f.continued} af ${f.reached} fortsatte`}><span style={{ width: `${f.reached > 0 ? (f.continued / f.reached) * 100 : 0}%` }} /></div>
                <div className="ai-fn-sub">{f.reached > 0 ? `${formatNum(f.continued)} fortsatte (${pctText(f.continuedPct)})${f.optional ? " – gennemført eller sprunget over" : ""}` : "Ingen nåede trinnet"}</div>
              </div>
            ))}
            <div className="ai-note">Bygger på {formatNum(s.funnelUsers)} konti med registreret trin (nye konti og konti, der var uafsluttede, da registreringen begyndte). Om et valgfrit trin er gennemført eller sprunget over, registreres ikke.</div>
          </div>
        )}

        {trendEnough(s) ? (
          <div className="ai-card">
            <h3 className="ai-card-title">Oprettede konti pr. dag</h3>
            <AiUsageChart data={chartData} format={formatNum} narrow={narrow} label="Oprettede konti pr. dag" />
            <div className="ai-note">Gennemførelsen for de nyeste dage er endnu ikke endelig; nye konti får tid til at gennemføre (mindst 24 timer), før de sammenlignes.</div>
          </div>
        ) : (
          <div className="ai-note" style={{ marginBottom: 12 }}>Udviklingen over tid vises, når der er mindst {TREND_MIN_ACCOUNTS} konti fordelt på mindst {TREND_MIN_DAYS} dage.</div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="audit-head"><div className="audit-intro">Se, hvor mange der gennemfører onboarding, og hvor andre forlader forløbet.</div></div>
      <div className="ai-controls">
        <div><label htmlFor="onb-period">Periode</label>
          <select id="onb-period" value={kind} onChange={(e) => setKind(e.target.value)}>
            {Object.entries(PERIODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select></div>
        {kind === "custom" && (
          <>
            <div><label htmlFor="onb-from">Fra dato</label><input id="onb-from" type="date" value={custom.from} max={custom.to || today} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} /></div>
            <div><label htmlFor="onb-to">Til dato</label><input id="onb-to" type="date" value={custom.to} min={custom.from || undefined} max={today} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} /></div>
          </>
        )}
        {range && <div className="ai-note" style={{ margin: "0 0 10px" }}>Konti oprettet {dayLabelLong(range.from)}{range.to !== range.from ? ` – ${dayLabelLong(range.to)}` : ""}</div>}
      </div>
      {s && s.testAccounts > 0 && (
        <label className="usr-check" style={{ margin: "-4px 0 8px" }}>
          <input type="checkbox" checked={includeTest} onChange={(e) => setIncludeTest(e.target.checked)} />
          <span>Medtag testkonti ({formatNum(s.testAccounts)})</span>
        </label>
      )}

      {body}

      <Disclosure title="Om onboardingstatistikken">
        <p style={{ margin: "0 0 6px" }}><strong>Oprettet konto:</strong> en konto oprettet i den valgte periode (dansk tid). Perioden afgrænser altid kohorten efter oprettelsestidspunktet; alle tal bruger samme kohorte.</p>
        <p style={{ margin: "0 0 6px" }}><strong>Gennemført:</strong> serveren har registreret, at onboarding er afsluttet. Det kan kun ske, når navn, alder og køn er udfyldt (og samtykke til helbredsoplysninger er givet, hvis der er gemt allergier eller E-numre). Trin 4 og 5 er valgfrie.</p>
        <p style={{ margin: "0 0 6px" }}><strong>Igangværende:</strong> bekræftet e-mail, ikke gennemført, og fremgang (et nyt trin) registreret inden for de seneste 24 timer. <strong>Muligt frafald:</strong> ikke gennemført og ingen fremgang i over 24 timer. 24 timer er en foreløbig grænse og ikke bevis for permanent frafald; brugeren genoptager forløbet, hvor vedkommende slap.</p>
        <p style={{ margin: "0 0 6px" }}><strong>Ikke startet:</strong> bekræftet e-mail, men ingen registreret fremgang (kontoen står stadig på sit første trin). <strong>E-mail ikke bekræftet:</strong> kontoen er oprettet, men mailen er ikke bekræftet; det er frafald før selve onboarding.</p>
        <p style={{ margin: "0 0 6px" }}><strong>Senest registrerede trin</strong> er det trin, en uafsluttet konto står på nu, og er ikke en tragt. <strong>Tragten</strong> bygger kun på registrerede trinskift (højeste nåede trin) og viser, hvor mange der nåede og fortsatte forbi et trin; historiske forløb opfindes ikke.</p>
        <p style={{ margin: "0 0 6px" }}><strong>Testkonti:</strong> konti på testlisten for notifikationer og konti med en e-mailadresse på example.com eller example.invalid er udeladt som standard og kan tages med. Andre interne konti (fx på firmaets domæne) kan ikke kendes og tælles med.</p>
        <p style={{ margin: 0 }}><strong>Historik:</strong> trin og fremgang registreres fra udgivelsen af den nye registrering; ældre gennemførte konti tæller som gennemført, men har intet trinforløb. Kun samlede tal vises, ingen oplysninger om enkelte brugere.</p>
      </Disclosure>
    </>
  );
}
