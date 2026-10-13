// @ts-nocheck
import React, { useState } from "react";
import { fmtNum, lastDays, axisScale, labelIndexes } from "../statsLogic.js";
import { useIsMobile } from "../useIsMobile.js";
import { betaOverview } from "../todoLogic.js";

// Nøgletal. `to` er den naturlige administrationsside, hvis der findes en; `hint` forklarer, hvad der tælles.
const STATS = [
  { key: "total_users", label: "Brugere i alt", to: "users", hint: (s) => (s.admin_users ? `heraf ${fmtNum(s.admin_users)} admin` : "") },
  { key: "new_users_today", label: "Nye brugere i dag", to: "users" },
  { key: "total_products", label: "Produkter", to: "products" },
  { key: "total_scans", label: "Scanninger i alt", hint: (s) => (Number.isFinite(s.search_opens) ? `Søgninger i alt: ${fmtNum(s.search_opens)}` : "") },
  { key: "scans_today", label: "Scanninger i dag" },
  { key: "total_families", label: "Familiemedlemmer", to: "family", hint: () => "børneprofiler uden konto" },
  { key: "pending_submissions", label: "Afventende indsendelser", to: "submissions" },
  { key: "open_tickets", label: "Åbne tickets", to: "tickets" },
];

// Felterne i opgaveoverblikket. `preset` er det filter, To do åbner med; `attn` = kræver handling, når tallet er over nul.
const OVERVIEW = [
  { key: "open", label: "Åbne opgaver", preset: {} },
  { key: "high", label: "Høj prioritet", preset: { priority: "high" }, attn: true },
  { key: "blocked", label: "Venter", preset: { status: "blocked" }, attn: true },
  { key: "overdue", label: "Frist overskredet", preset: { due: "overdue" }, attn: true, late: true },
  { key: "unassigned", label: "Uden ansvarlig", preset: { assigneeId: "none" } },
  { key: "noDue", label: "Uden frist", preset: { due: "none" } },
];

const PERIODS = [7, 14, 30];
const longDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" });
const shortDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("da-DK", { day: "numeric", month: "short" });

// Søjlediagram for én tidsserie. Hver søjle er en knap: tryk (eller tastatur) viser præcis dato og antal. Dage uden aktivitet vises som en tynd søjle og har værdien 0.
// `data` er null, når tallene ikke kunne hentes (adskilt fra 0 registreringer).
function TrendChart({ title, unit, data, color, colorLt, narrow }) {
  const [picked, setPicked] = useState(null);
  if (!data) {
    return (
      <figure className="admin-card" style={{ margin: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>{title}</div>
        <div className="admin-info-note" role="status" style={{ marginBottom: 0 }}>Tallene kunne ikke hentes. Prøv at genindlæse siden.</div>
      </figure>
    );
  }
  const { top, ticks } = axisScale(Math.max(0, ...data.map(d => d.count)));
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const sel = picked && data.find(d => d.date === picked);
  const labels = new Set(labelIndexes(data.length, narrow ? 3 : 5));
  const gap = data.length > 20 ? 1 : 2;
  return (
    <figure className="admin-card" style={{ margin: 0, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 800 }}>{title}</div>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>{fmtNum(total)} i alt, seneste {data.length} dage</div>
      </div>
      <div style={{ fontSize: 12, minHeight: 18, color: sel ? "var(--ink)" : "var(--muted)", fontWeight: sel ? 700 : 500 }} aria-live="polite">
        {sel ? `${longDate(sel.date)}: ${fmtNum(sel.count)} ${unit}` : total === 0 ? `Ingen ${unit} i perioden` : "Tryk på en søjle for dato og antal"}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
        <div className="admin-axis" aria-hidden="true">
          {ticks.map(t => <span key={t}>{fmtNum(t)}</span>)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap, height: 72, borderBottom: "1px solid var(--border)" }} role="group" aria-label={`${title}, seneste ${data.length} dage`}>
            {data.map(d => (
              <button key={d.date} type="button" className="admin-bar" aria-pressed={picked === d.date}
                aria-label={`${longDate(d.date)}: ${fmtNum(d.count)} ${unit}`} title={`${shortDate(d.date)}: ${d.count}`}
                onClick={() => setPicked(p => (p === d.date ? null : d.date))}>
                <span style={{ display: "block", width: "100%", borderRadius: "3px 3px 0 0", height: `${d.count > 0 ? Math.max(6, (d.count / top) * 100) : 4}%`,
                  background: d.count > 0 ? color : colorLt, outline: picked === d.date ? `2px solid ${color}` : "none", outlineOffset: 1 }} />
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

export default function DashboardSection({ adminStats, setSection, todos = [], admins = [], openTodos, openTickets, openSubmissions }) {
  const [period, setPeriod] = useState(14);
  const [showDefs, setShowDefs] = useState(false);
  const narrow = useIsMobile();
  const beta = betaOverview(todos, admins);
  if (!adminStats) {
    return (
      <div aria-busy="true" aria-label="Henter statistik">
        <div className="admin-stat-grid">
          {STATS.map(s => <div key={s.key} className="admin-stat-card admin-skeleton"><div className="admin-stat-num">&nbsp;</div><div className="admin-stat-label">{s.label}</div></div>)}
        </div>
        <div className="admin-loading-row"><div className="admin-spinner" /> Henter statistik…</div>
      </div>
    );
  }
  return (
    <>
      <div className="admin-stat-grid">
        {STATS.map(s => {
          const hint = s.hint ? s.hint(adminStats) : "";
          const inner = (
            <>
              <div className="admin-stat-num">{fmtNum(adminStats[s.key])}</div>
              <div className="admin-stat-label">{s.label}</div>
              <div className="admin-stat-hint">{hint || " "}</div>
            </>
          );
          return s.to
            ? <button key={s.key} type="button" className="admin-stat-card admin-stat-link" onClick={() => (s.key === "open_tickets" && openTickets ? openTickets() : s.key === "pending_submissions" && openSubmissions ? openSubmissions() : setSection(s.to))} aria-label={`${s.label}: ${fmtNum(adminStats[s.key])}. Åbn ${s.label.toLowerCase()}`}>{inner}</button>
            : <div key={s.key} className="admin-stat-card">{inner}</div>;
        })}
      </div>

      {(
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <div className="admin-segment" role="group" aria-label="Periode">
              {PERIODS.map(p => (
                <button key={p} type="button" className={period === p ? "active" : ""} aria-pressed={period === p} onClick={() => setPeriod(p)}>{p} dage</button>
              ))}
            </div>
            <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" aria-expanded={showDefs} onClick={() => setShowDefs(v => !v)}><span aria-hidden="true">ⓘ </span>Hvad tæller tallene?</button>
          </div>
          {showDefs && (
            <div className="admin-info-note" role="note">
              <strong>Scanning</strong>: et opslag med kamera eller indtastet kode (hvert opslag tæller, også gentagelser). Åbninger via søgning, Favoritter, alternativer og beskeder tælles ikke som scanninger.{" "}
              <strong>Ny bruger</strong>: en oprettet konto (inkl. admin- og testkonti). <strong>Familiemedlem</strong>: en profil uden egen konto (børneprofil); voksne med egen konto tælles som brugere.{" "}
              Dagene regnes i dansk tid.
            </div>
          )}
          <div className="admin-chart-grid">
            <TrendChart title="Scanninger pr. dag" unit="scanninger" data={adminStats.scan_trend ? lastDays(adminStats.scan_trend, period) : null} color="var(--green)" colorLt="var(--green-lt)" narrow={narrow} />
            <TrendChart title="Nye brugere pr. dag" unit="nye brugere" data={adminStats.user_trend ? lastDays(adminStats.user_trend, period) : null} color="var(--blue)" colorLt="var(--blue-lt)" narrow={narrow} />
          </div>
        </>
      )}

      {openTodos && (
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Opgaveoverblik</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>Alle åbne opgaver · tryk for at se dem</div>
          </div>
          <div className="beta-grid">
            {OVERVIEW.map(c => {
              const n = beta[c.key];
              const attn = c.attn && n > 0;
              return (
                <button key={c.key} type="button" className={`beta-cell${attn ? " attn" : ""}`} onClick={() => openTodos(c.preset)}>
                  <b style={{ color: c.late && n > 0 ? "var(--red)" : undefined }}>{fmtNum(n)}</b><span>{c.label}</span>
                </button>
              );
            })}
          </div>
          {beta.byAssignee.length > 0 && (
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>
              Fordeling: {beta.byAssignee.map(a => `${a.name} ${fmtNum(a.count)}`).join(" · ")}
            </div>
          )}
        </div>
      )}
    </>
  );
}
