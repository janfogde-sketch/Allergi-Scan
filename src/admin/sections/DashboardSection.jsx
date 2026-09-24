// @ts-nocheck
import React from "react";

const STATS = [
  { key: "total_users", label: "Brugere i alt" },
  { key: "new_users_today", label: "Nye brugere i dag" },
  { key: "total_products", label: "Produkter" },
  { key: "total_scans", label: "Scanninger i alt" },
  { key: "scans_today", label: "Scanninger i dag" },
  { key: "total_families", label: "Familiemedlemmer" },
  { key: "pending_submissions", label: "Afventende indsendelser" },
  { key: "open_tickets", label: "Åbne tickets" },
];

export default function DashboardSection({ adminStats, setSection }) {
  if (!adminStats) {
    return <div className="admin-loading-row"><div className="admin-spinner" /> Henter statistik…</div>;
  }
  return (
    <>
      <div className="admin-stat-grid">
        {STATS.map(s => (
          <div key={s.key} className="admin-stat-card">
            <div className="admin-stat-num">{adminStats[s.key] ?? "–"}</div>
            <div className="admin-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="admin-card">
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Genveje</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {adminStats.pending_submissions > 0 && (
            <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => setSection("submissions")}>
              Gennemgå {adminStats.pending_submissions} afventende indsendelse{adminStats.pending_submissions === 1 ? "" : "r"}
            </button>
          )}
          {adminStats.open_tickets > 0 && (
            <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setSection("tickets")}>
              Se {adminStats.open_tickets} åbne ticket{adminStats.open_tickets === 1 ? "" : "s"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
