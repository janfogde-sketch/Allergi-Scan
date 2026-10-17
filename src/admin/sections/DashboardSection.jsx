// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { Icon } from "../../SharedComponents.jsx";
import { fmtNum, lastDays, axisScale, labelIndexes } from "../statsLogic.js";
import { useIsMobile } from "../useIsMobile.js";
import { betaOverview } from "../todoLogic.js";
import CloseX from "../CloseX.jsx";

// Overblik: nøgletal. `to` er den naturlige administrationsside, hvis der findes en; `hint` er en kort, diskret sekundær oplysning.
const STATS = [
  { key: "total_users", label: "Brugere i alt", to: "users", hint: (s) => (s.admin_users ? `heraf ${fmtNum(s.admin_users)} admin` : "") },
  { key: "new_users_today", label: "Nye brugere i dag", to: "users" },
  { key: "total_products", label: "Produkter", to: "products" },
  { key: "total_families", label: "Familiemedlemmer", to: "family", hint: () => "profiler uden egen konto" },
  { key: "total_scans", label: "Scanninger i alt" },
  { key: "scans_today", label: "Scanninger i dag" },
  { key: "search_opens", label: "Søgninger i alt" },
  { key: "pending_submissions", label: "Afventende indsendelser", to: "submissions" },
];
// Åbne tickets vises kun under "Kræver opmærksomhed" (ikke også som nøgletal), så samme oplysning ikke står to steder.

// Opgaveoverblik: fire primære målinger, to mere i det udvidelige område. `preset` er det filter, To do åbner med.
const OVERVIEW = [
  { key: "open", label: "Åbne opgaver", preset: {} },
  { key: "high", label: "Høj prioritet", preset: { priority: "high" } },
  { key: "blocked", label: "Venter", preset: { status: "blocked" } },
  { key: "overdue", label: "Frist overskredet", preset: { due: "overdue" }, late: true },
];
const OVERVIEW_MORE = [
  { key: "unassigned", label: "Uden ansvarlig", preset: { assigneeId: "none" } },
  { key: "noDue", label: "Uden frist", preset: { due: "none" } },
];

const PERIODS = [7, 14, 30];
// Periodevalget huskes i denne fane (sessionStorage), så det består, når man navigerer væk fra Dashboard og tilbage.
const PERIOD_KEY = "admin_dash_period";
const readPeriod = () => { try { const v = Number(sessionStorage.getItem(PERIOD_KEY)); return PERIODS.includes(v) ? v : 14; } catch { return 14; } };
const savePeriod = (p) => { try { sessionStorage.setItem(PERIOD_KEY, String(p)); } catch { /* valget er en bekvemmelighed */ } };

const longDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" });
const shortDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("da-DK", { day: "numeric", month: "short" });
const tipDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("da-DK", { weekday: "short", day: "numeric", month: "short" });
const PLOT_H = 64, TIP_W = 104, TIP_H = 34; // skal passe til .dash-plot og .dash-tip i adminTheme.js
const unitFor = (unit, n) => (n === 1 ? unit[0] : unit[1]);

// Søjlediagram for én tidsserie. Tryk eller træk over søjlerne viser dato og antal i en lille tooltip, som holdes inden for diagrammet; tryk udenfor (eller Escape) fjerner den.
// `data` er null, når tallene ikke kunne hentes (adskilt fra 0 registreringer).
function TrendChart({ title, unit, data, color, narrow }) {
  const [picked, setPicked] = useState(null);
  const plotRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!picked) return undefined;
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setPicked(null); };
    const onKey = (e) => { if (e.key === "Escape") setPicked(null); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [picked]);

  if (!data) {
    return (
      <figure className="admin-card dash-chart" style={{ margin: 0 }}>
        <div className="dash-chart-title">{title}</div>
        <div className="admin-info-note" role="status" style={{ marginBottom: 0 }}>Tallene kunne ikke hentes. Prøv at genindlæse siden.</div>
      </figure>
    );
  }
  const { top, ticks } = axisScale(Math.max(0, ...data.map((d) => d.count)));
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const idx = picked ? data.findIndex((d) => d.date === picked) : -1;
  const sel = idx >= 0 ? data[idx] : null;
  const labels = new Set(labelIndexes(data.length, narrow ? 3 : 5));
  const gap = data.length > 20 ? 1 : 2;

  // Vælg søjlen under fingeren/musen; virker også ved træk hen over diagrammet
  const pickAt = (e) => {
    const el = plotRef.current;
    if (!el || !data.length) return;
    const r = el.getBoundingClientRect();
    const i = Math.min(data.length - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * data.length)));
    setPicked(data[i].date);
  };
  // Tooltippen er en lille lys boks (104 px) inde i selve diagrammet, så den aldrig dækker overskriften eller falder uden for kortet:
  // over søjlen, hvis der er plads, ellers ved siden af den (på den side, der har mest plads).
  let tipStyle = null;
  if (sel) {
    const h = sel.count > 0 ? Math.max(6, (sel.count / top) * 100) : 3;
    const barTop = PLOT_H * (1 - h / 100);
    const cx = ((idx + 0.5) / data.length) * 100;
    tipStyle = barTop >= TIP_H + 4
      ? { top: Math.round(barTop - TIP_H - 3), left: `clamp(0px, calc(${cx.toFixed(3)}% - ${TIP_W / 2}px), calc(100% - ${TIP_W}px))` }
      : idx < data.length / 2
        ? { top: 0, left: `calc(${(((idx + 1) / data.length) * 100).toFixed(3)}% + 6px)` }
        : { top: 0, right: `calc(${(((data.length - idx) / data.length) * 100).toFixed(3)}% + 6px)` };
  }
  // Piletaster flytter valget mellem søjlerne
  const onKeyDown = (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const btns = [...plotRef.current.querySelectorAll("button")];
    const cur = btns.indexOf(document.activeElement);
    const next = Math.min(btns.length - 1, Math.max(0, (cur < 0 ? (idx >= 0 ? idx : 0) : cur) + (e.key === "ArrowRight" ? 1 : -1)));
    e.preventDefault();
    btns[next].focus();
    setPicked(data[next].date);
  };

  return (
    <figure className="admin-card dash-chart" style={{ margin: 0 }} ref={wrapRef}>
      <div className="dash-chart-head">
        <div className="dash-chart-title">{title}</div>
        <div className="dash-chart-total">{fmtNum(total)} i alt, seneste {data.length} dage</div>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <div className="admin-axis" aria-hidden="true">
          {ticks.map((t) => <span key={t}>{fmtNum(t)}</span>)}
        </div>
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
          {sel && (
            <div className="dash-tip" role="status" style={tipStyle}>
              <b>{tipDate(sel.date)}</b>
              <span>{fmtNum(sel.count)} {unitFor(unit, sel.count)}</span>
            </div>
          )}
          <div ref={plotRef} className="dash-plot" style={{ gap }} role="group" aria-label={`${title}, seneste ${data.length} dage`}
            onPointerDown={pickAt} onPointerMove={(e) => { if (e.buttons) pickAt(e); }} onKeyDown={onKeyDown}>
            {data.map((d) => (
              <button key={d.date} type="button" className={`admin-bar${picked === d.date ? " sel" : ""}`} aria-pressed={picked === d.date}
                aria-label={`${longDate(d.date)}: ${fmtNum(d.count)} ${unitFor(unit, d.count)}`}
                onClick={(e) => { if (e.detail === 0) setPicked(d.date); }}>
                <span style={{ display: "block", width: "100%", borderRadius: "3px 3px 0 0", height: `${d.count > 0 ? Math.max(6, (d.count / top) * 100) : 3}%`,
                  background: d.count > 0 ? color : "var(--border2)" }} />
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap, height: 16, marginTop: 4 }} aria-hidden="true">
            {data.map((d, i) => (
              <div key={d.date} style={{ flex: 1, minWidth: 2, position: "relative" }}>
                {labels.has(i) && (
                  <span style={{ position: "absolute", top: 0, whiteSpace: "nowrap", fontSize: 10.5, color: "var(--muted)",
                    ...(i === 0 ? { left: 0 } : i === data.length - 1 ? { right: 0 } : { left: "50%", transform: "translateX(-50%)" }) }}>{shortDate(d.date)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}

// Forklaring af tallene: konkret og i overensstemmelse med, hvordan de beregnes (useAdmin.loadAdminStats og todoLogic.betaOverview).
function StatsInfo({ onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const Row = ({ t, children }) => <li style={{ marginBottom: 8 }}><strong>{t}</strong>: {children}</li>;
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" role="dialog" aria-modal="true" aria-label="Hvad tæller tallene" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div style={{ fontSize: 15, fontWeight: 800 }}>Hvad tæller tallene?</div>
          <CloseX onClick={onClose} />
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.55 }}>
          <Row t="Brugere i alt">alle oprettede konti, også admin- og testkonti. "Nye brugere i dag" er konti oprettet siden midnat.</Row>
          <Row t="Produkter">alle produkter i produktdatabasen.</Row>
          <Row t="Familiemedlemmer">profiler uden selvstændig konto (børneprofiler). Voksne med egen konto tælles som brugere.</Row>
          <Row t="Scanninger">opslag med kamera eller indtastet kode. Hvert opslag tæller, også gentagelser af samme produkt. "Scanninger i dag" er siden midnat.</Row>
          <Row t="Søgninger">produkter, der er valgt i søgning eller åbnet fra Favoritter, alternativer eller beskeder. De tælles separat og indgår ikke i scanninger.</Row>
          <Row t="Afventende indsendelser">produktindsendelser og rettelser, der endnu ikke er godkendt eller afvist.</Row>
          <Row t="Åbne tickets">tickets med status Åben. Tickets i gang og løste tælles ikke med.</Row>
          <Row t="Aktivitet">dagene regnes i dansk tid. Periodevælgeren (7, 14 eller 30 dage) styrer kun graferne, ikke nøgletallene øverst. Totalen er summen af søjlerne i perioden.</Row>
          <Row t="Opgaveoverblik">kun åbne opgaver (ikke Færdige). "Venter" er status Venter, "Frist overskredet" er en gyldig frist før i dag, og "Uden frist" er åbne opgaver uden en gyldig dato.</Row>
        </ul>
      </div>
    </div>
  );
}

function InfoButton({ onClick, label = "Hvad tæller tallene?" }) {
  return (
    <button type="button" className="dash-info-btn" aria-label={label} title={label} onClick={onClick}>
      <Icon name="info" size={16} />
    </button>
  );
}

export default function DashboardSection({ adminStats, setSection, todos = [], todosLoaded = true, admins = [], openTodos, openTickets, openSubmissions }) {
  const [period, setPeriodState] = useState(readPeriod);
  const [showInfo, setShowInfo] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const narrow = useIsMobile();
  const setPeriod = (p) => { savePeriod(p); setPeriodState(p); };
  const beta = betaOverview(todos, admins);

  if (!adminStats) {
    return (
      <div aria-busy="true" aria-label="Henter statistik">
        <div className="dash-stat-grid">
          {STATS.map((s) => <div key={s.key} className="admin-stat-card admin-skeleton"><div className="admin-stat-num">&nbsp;</div><div className="admin-stat-label">{s.label}</div></div>)}
        </div>
        <div className="admin-loading-row"><div className="admin-spinner" /> Henter statistik…</div>
      </div>
    );
  }

  const goStat = (s) => (s.key === "pending_submissions" && openSubmissions ? openSubmissions() : setSection(s.to));

  // Kræver opmærksomhed: kun forhold, hvor handling er relevant (tal over nul). Ikon og farve har betydning: ur + rød = frist overskredet, flag + gul = høj prioritet, neutral = afventer behandling. Opgaver uden frist tæller aldrig som forsinkede og fremhæves ikke her.
  const attention = [];
  if (adminStats.open_tickets > 0) attention.push({ key: "t", tone: "info", icon: "info", text: `${fmtNum(adminStats.open_tickets)} ${adminStats.open_tickets === 1 ? "åben ticket" : "åbne tickets"}`, go: () => (openTickets ? openTickets() : setSection("tickets")) });
  if (adminStats.pending_submissions > 0) attention.push({ key: "s", tone: "info", icon: "file", text: `${fmtNum(adminStats.pending_submissions)} ${adminStats.pending_submissions === 1 ? "afventende indsendelse" : "afventende indsendelser"}`, go: () => (openSubmissions ? openSubmissions() : setSection("submissions")) });
  if (openTodos && todosLoaded) {
    if (beta.overdue > 0) attention.push({ key: "o", tone: "late", icon: "clock", text: `${fmtNum(beta.overdue)} ${beta.overdue === 1 ? "opgave" : "opgaver"} med overskredet frist`, go: () => openTodos({ due: "overdue" }) });
    if (beta.highUnassigned > 0) attention.push({ key: "hu", tone: "warn", icon: "flag", text: `${fmtNum(beta.highUnassigned)} ${beta.highUnassigned === 1 ? "opgave" : "opgaver"} med høj prioritet uden ansvarlig`, go: () => openTodos({ priority: "high", assigneeId: "none" }) });
    if (beta.high > 0) attention.push({ key: "h", tone: "warn", icon: "flag", text: `${fmtNum(beta.high)} ${beta.high === 1 ? "opgave" : "opgaver"} med høj prioritet`, go: () => openTodos({ priority: "high" }) });
  }

  return (
    <div className="dash">
      <div className="dash-top">
        <section aria-labelledby="dash-h-overview">
          <div className="dash-head">
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <h2 id="dash-h-overview" className="dash-h">Overblik</h2>
              <InfoButton onClick={() => setShowInfo(true)} />
            </div>
          </div>
          <div className="dash-stat-grid">
            {STATS.map((s) => {
              const hint = s.hint ? s.hint(adminStats) : "";
              const inner = (
                <>
                  <div className="admin-stat-num">{fmtNum(adminStats[s.key])}</div>
                  <div className="admin-stat-label">{s.label}</div>
                  {hint && <div className="admin-stat-hint">{hint}</div>}
                </>
              );
              return s.to
                ? <button key={s.key} type="button" className="admin-stat-card admin-stat-link" onClick={() => goStat(s)} aria-label={`${s.label}: ${fmtNum(adminStats[s.key])}. Åbn ${s.label.toLowerCase()}`}>{inner}</button>
                : <div key={s.key} className="admin-stat-card">{inner}</div>;
            })}
          </div>
        </section>

        <section aria-labelledby="dash-h-attn">
          <div className="dash-head"><h2 id="dash-h-attn" className="dash-h">Kræver opmærksomhed</h2></div>
          <div className="admin-card dash-attn">
            {attention.length === 0 ? (
              <div className="dash-empty">{openTodos && !todosLoaded ? "Henter…" : "Intet kræver opmærksomhed lige nu."}</div>
            ) : attention.map((a) => (
              <button key={a.key} type="button" className="dash-attn-row" onClick={a.go}>
                <span className={`dash-attn-icon ${a.tone}`} aria-hidden="true"><Icon name={a.icon} size={16} /></span>
                <span className="dash-attn-text">{a.text}</span>
                <Icon name="chevronRight" size={14} color="var(--muted)" />
              </button>
            ))}
          </div>
        </section>
      </div>

      <section aria-labelledby="dash-h-activity">
        <div className="dash-head stack">
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <h2 id="dash-h-activity" className="dash-h">Aktivitet</h2>
            <InfoButton onClick={() => setShowInfo(true)} label="Hvordan aktiviteten opgøres" />
          </div>
          <div className="admin-segment dash-period" role="group" aria-label="Periode for graferne">
            {PERIODS.map((p) => (
              <button key={p} type="button" className={period === p ? "active" : ""} aria-pressed={period === p} onClick={() => setPeriod(p)}>{p} dage</button>
            ))}
          </div>
        </div>
        <div className="admin-chart-grid">
          <TrendChart title="Scanninger pr. dag" unit={["scanning", "scanninger"]} data={adminStats.scan_trend ? lastDays(adminStats.scan_trend, period) : null} color="var(--green)" narrow={narrow} />
          <TrendChart title="Nye brugere pr. dag" unit={["ny bruger", "nye brugere"]} data={adminStats.user_trend ? lastDays(adminStats.user_trend, period) : null} color="var(--blue)" narrow={narrow} />
        </div>
      </section>

      {openTodos && (
        <section aria-labelledby="dash-h-tasks">
          <div className="dash-head"><h2 id="dash-h-tasks" className="dash-h">Opgaveoverblik</h2></div>
          <div className="admin-card" style={{ marginBottom: 0 }}>
            {!todosLoaded ? (
              <div className="dash-empty">Henter opgaver…</div>
            ) : (
              <>
                <div className="beta-grid">
                  {OVERVIEW.map((c) => (
                    <button key={c.key} type="button" className="beta-cell" onClick={() => openTodos(c.preset)}>
                      <b style={{ color: c.late && beta[c.key] > 0 ? "var(--red)" : undefined }}>{fmtNum(beta[c.key])}</b><span>{c.label}</span>
                    </button>
                  ))}
                </div>
                <button type="button" className="dash-more" aria-expanded={showMore} aria-controls="dash-more-grid" onClick={() => setShowMore((v) => !v)}>
                  {showMore ? "Vis færre oplysninger" : "Vis flere oplysninger"} <span className={`dash-chev${showMore ? " open" : ""}`} aria-hidden="true"><Icon name="chevronDown" size={14} /></span>
                </button>
                {showMore && (
                  <div id="dash-more-grid" className="beta-grid" style={{ marginTop: 8 }}>
                    {OVERVIEW_MORE.map((c) => (
                      <button key={c.key} type="button" className="beta-cell" onClick={() => openTodos(c.preset)}>
                        <b>{fmtNum(beta[c.key])}</b><span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                )}
                {beta.open > 0 && (
                  <div className="dash-dist">
                    <div className="dash-dist-label">Opgaver pr. ansvarlig</div>
                    {[...beta.byAssignee.map((a) => ({ key: a.id, name: a.name, count: a.count, preset: { assigneeId: a.id } })),
                      ...(beta.unassigned > 0 ? [{ key: "none", name: "Uden ansvarlig", count: beta.unassigned, preset: { assigneeId: "none" }, muted: true }] : [])].map((r) => (
                      <button key={r.key} type="button" className="dash-dist-row" onClick={() => openTodos(r.preset)} aria-label={`${r.name}: ${r.count} åbne opgaver`}>
                        <span className="dash-dist-name" style={{ color: r.muted ? "var(--muted)" : undefined }}>{r.name}</span>
                        <span className="dash-dist-bar" aria-hidden="true"><span style={{ width: `${Math.max(3, (r.count / beta.open) * 100)}%`, background: r.muted ? "var(--border2)" : "var(--green)" }} /></span>
                        <span className="dash-dist-count">{fmtNum(r.count)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {showInfo && <StatsInfo onClose={() => setShowInfo(false)} />}
    </div>
  );
}
