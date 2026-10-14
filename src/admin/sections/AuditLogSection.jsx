// @ts-nocheck
import RefreshButton from "../RefreshButton.jsx";
import React from "react";
import { auditActionLabel, auditChangeText, auditActorText, auditTargetText } from "../auditLogic.js";

const fmt = (d) => new Date(d).toLocaleString("da-DK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Copenhagen" });

export default function AuditLogSection({ rows, names, loading, load }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 12 }}>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          Hvem der har ændret eller slettet noget følsomt (roller, produkter, brugeres profiler og allergier, familie, indsendelser, push-tekster, eksport), og hvornår. De seneste 200 handlinger; loggen slettes efter 12 måneder.
        </div>
        <RefreshButton onClick={load} />
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Tidspunkt</th><th>Handling</th><th>Admin</th><th>Mål</th><th>Ændring</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5} style={{ color: "var(--muted)" }}>Henter…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={5} style={{ color: "var(--muted)" }}>Ingen registrerede handlinger endnu.</td></tr>}
            {rows.map(r => (
              <tr key={r.id}>
                <td data-label="Tidspunkt">{fmt(r.created_at)}</td>
                <td data-label="Handling">{auditActionLabel(r.action)}</td>
                <td data-label="Admin">{auditActorText(r, names?.users)}</td>
                <td data-label="Mål">{auditTargetText(r, names || {})}</td>
                <td data-label="Ændring">{auditChangeText(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
