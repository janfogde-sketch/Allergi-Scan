// @ts-nocheck
import React from "react";

const TYPE_LABELS = { created: "Oprettet", updated: "Opdateret" };
const TYPE_PILL = { created: "admin-pill-green", updated: "admin-pill-amber" };

function truncate(text, max = 60) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export default function HistorySection({ revisionLog, revisionLogLoading, revisionLogFilter, setRevisionLogFilter, loadRevisionLog }) {
  return (
    <>
      <div className="admin-tabs">
        {[["all", "Alle"], ["created", "Oprettet"], ["updated", "Opdateret"]].map(([id, label]) => (
          <button key={id} className={`admin-tab-btn${revisionLogFilter === id ? " active" : ""}`}
            onClick={() => { setRevisionLogFilter(id); loadRevisionLog(id); }}>{label}</button>
        ))}
      </div>

      <div className="admin-table-wrap">
        {revisionLogLoading ? (
          <div className="admin-loading-row"><div className="admin-spinner" /> Henter ændringshistorik…</div>
        ) : revisionLog.length === 0 ? (
          <div className="admin-table-empty">Ingen ændringer endnu</div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Tidspunkt</th><th>Type</th><th>Produkt</th><th>Felt(er) ændret</th><th>Ny værdi</th><th>Ændret af</th></tr></thead>
            <tbody>
              {revisionLog.map(r => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{new Date(r.created_at).toLocaleString("da-DK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                  <td><span className={`admin-pill ${TYPE_PILL[r.change_type] || "admin-pill-neutral"}`}>{TYPE_LABELS[r.change_type] || r.change_type}</span></td>
                  <td>
                    {r.product ? `${r.product.name || "Ukendt"} (${r.product.ean})` : r.product_id ? <span style={{ color: "var(--muted)", fontFamily: "var(--mono)" }}>{r.product_id.slice(0, 8)}</span> : <span style={{ color: "var(--muted)" }}>–</span>}
                  </td>
                  <td style={{ fontSize: 12 }}>{r.field_changed || "–"}</td>
                  <td style={{ fontSize: 12, color: "var(--ink2)" }} title={r.new_value || ""}>{truncate(r.new_value)}</td>
                  <td>{r.user ? (r.user.name || r.user.email) : r.changed_by ? <span style={{ color: "var(--muted)", fontFamily: "var(--mono)" }}>{r.changed_by.slice(0, 8)}</span> : <span style={{ color: "var(--muted)" }}>Ukendt</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
