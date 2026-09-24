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

// Enkelt søjlediagram for én tidsserie (magnitude over tid — én sekventiel
// farve, ingen legend nødvendig for én serie). Ingen graf-bibliotek — kun
// CSS/HTML, konsistent med resten af appens lette tilgang. Native
// title-attribut som hover-tooltip holder det simpelt uden ekstra state.
function TrendChart({ title, data, color, colorLt }) {
  const max = Math.max(1, ...data.map(d => d.count));
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const formatDate = (iso) => new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short" });
  return (
    <figure className="admin-card" style={{ margin: 0, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800 }}>{title}</div>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>{total} i alt, seneste {data.length} dage</div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 64 }}>
        {data.map(d => (
          <div key={d.date} title={`${formatDate(d.date)}: ${d.count}`}
            style={{
              flex: 1, minWidth: 2, borderRadius: "3px 3px 0 0",
              height: `${Math.max(4, (d.count / max) * 100)}%`,
              background: d.count > 0 ? color : colorLt,
              transition: "opacity .1s",
            }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: "var(--muted)" }}>
        <span>{formatDate(data[0]?.date)}</span>
        <span>{formatDate(data[data.length - 1]?.date)}</span>
      </div>
      <figcaption style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {title} pr. dag, seneste {data.length} dage, i alt {total}
      </figcaption>
    </figure>
  );
}

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

      {(adminStats.scan_trend || adminStats.user_trend) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {adminStats.scan_trend && <TrendChart title="Scanninger pr. dag" data={adminStats.scan_trend} color="var(--green)" colorLt="var(--green-lt)" />}
          {adminStats.user_trend && <TrendChart title="Nye brugere pr. dag" data={adminStats.user_trend} color="var(--blue)" colorLt="var(--blue-lt)" />}
        </div>
      )}

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
