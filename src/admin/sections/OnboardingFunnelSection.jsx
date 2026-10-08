// @ts-nocheck
import React from "react";
import { summarizeFunnel } from "../onboardingFunnelLogic.js";

export default function OnboardingFunnelSection({ data, loading, load }) {
  const f = summarizeFunnel(data);
  const stuckTotal = f.steps.reduce((a, s) => a + s.stuck, 0);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 12 }}>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          Hvor langt nye brugere når i første start. Kun samlede tal, ingen data pr. bruger.
        </div>
        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={load}>Opdater</button>
      </div>

      {loading ? (
        <div className="admin-loading-row"><div className="admin-spinner" /> Henter…</div>
      ) : !data || f.total === 0 ? (
        <div className="admin-table-empty">Ingen brugere endnu.</div>
      ) : (
        <>
          <div className="admin-stat-grid">
            <div className="admin-stat-card"><div className="admin-stat-num">{f.total}</div><div className="admin-stat-label">Konti i alt</div></div>
            <div className="admin-stat-card"><div className="admin-stat-num">{f.completed} ({f.completedPct} %)</div><div className="admin-stat-label">Færdige med første start</div></div>
            <div className="admin-stat-card"><div className="admin-stat-num">{stuckTotal}</div><div className="admin-stat-label">Ikke færdige</div></div>
          </div>
          <div className="admin-table-wrap" style={{ marginBottom: 20 }}>
            <div style={{ padding: "12px 14px", fontWeight: 800 }}>Hvor de ikke færdige holdt op</div>
            <table className="admin-table">
              <thead><tr><th>Trin</th><th>Stoppet her</th><th>Andel af alle</th><th>Heraf ældre end 24 t.</th></tr></thead>
              <tbody>
                {f.steps.map(s => (
                  <tr key={s.step}><td>{s.step}. {s.label}</td><td>{s.stuck}</td><td>{s.pct} %</td><td>{s.stuckOld}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
        Et trin er det sidste, brugeren nåede. Konti yngre end 24 timer er måske stadig i gang; "ældre end 24 t." er de reelle frafald. Bekræftelse af e-mail kommer før trin 1.
      </div>
    </>
  );
}
