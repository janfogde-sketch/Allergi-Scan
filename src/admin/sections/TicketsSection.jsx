// @ts-nocheck
import React from "react";

const TYPE_LABELS = { bug: "Fejl", ui: "Design", missing: "Mangler", content: "Indhold", crash: "Crash", suggestion: "Forslag" };
const STATUS_LABELS = { open: "Åben", in_progress: "I gang", resolved: "Løst" };
const STATUS_PILL = { open: "admin-pill-red", in_progress: "admin-pill-amber", resolved: "admin-pill-green" };

function exportOpenTickets(tickets) {
  const filtered = tickets.filter(t => t.status === "open");
  const lines = filtered.map((t, i) => {
    const dato = new Date(t.created_at).toLocaleString("da-DK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    return [
      `── Ticket ${i + 1} ──`,
      `Type:    ${TYPE_LABELS[t.type] || t.type}`,
      `Bruger:  ${t.context?.user_name || "Anonym"} (${t.context?.user_email || "—"})`,
      `Skærm:   ${t.context?.screen_label || t.context?.screen || "—"}`,
      `Dato:    ${dato}`,
      ``, t.description || "(ingen beskrivelse)", ``,
    ].join("\n");
  });
  const text = `EatSafe Tickets — Åbne (${filtered.length} stk)\nEksporteret: ${new Date().toLocaleString("da-DK")}\n\n` + lines.join("\n");
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `eatsafe-tickets-open-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click(); URL.revokeObjectURL(url);
}

export default function TicketsSection({ adminTickets, ticketsLoading, adminTicketFilter, setAdminTicketFilter, openTicket, setOpenTicket, updateTicketStatus }) {
  const filtered = adminTickets.filter(t => adminTicketFilter === "all" || t.status === adminTicketFilter);
  const openCount = adminTickets.filter(t => t.status === "open").length;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div className="admin-tabs" style={{ marginBottom: 0, border: "none" }}>
          {["all", "open", "in_progress", "resolved"].map(s => (
            <button key={s} className={`admin-tab-btn${adminTicketFilter === s ? " active" : ""}`} onClick={() => setAdminTicketFilter(s)}>
              {s === "all" ? "Alle" : STATUS_LABELS[s]} ({s === "all" ? adminTickets.length : adminTickets.filter(t => t.status === s).length})
            </button>
          ))}
        </div>
        {openCount > 0 && <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => exportOpenTickets(adminTickets)}>Download åbne ({openCount})</button>}
      </div>

      <div className="admin-table-wrap">
        {ticketsLoading ? (
          <div className="admin-loading-row"><div className="admin-spinner" /> Henter tickets…</div>
        ) : filtered.length === 0 ? (
          <div className="admin-table-empty">Ingen tickets her</div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Type</th><th>Beskrivelse</th><th>Bruger</th><th>Skærm</th><th>Dato</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => setOpenTicket(t)}>
                  <td><span className="admin-pill admin-pill-neutral">{TYPE_LABELS[t.type] || t.type}</span></td>
                  <td style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</td>
                  <td>{t.context?.user_name || "Anonym"}</td>
                  <td>{t.context?.screen_label || t.context?.screen || "–"}</td>
                  <td>{new Date(t.created_at).toLocaleDateString("da-DK")}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <select value={t.status} onChange={e => updateTicketStatus(t.id, e.target.value)}
                      className={`admin-pill ${STATUS_PILL[t.status] || "admin-pill-neutral"}`}
                      style={{ fontFamily: "var(--f)", border: "none", cursor: "pointer" }}>
                      {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {openTicket && (
        <div className="admin-modal-overlay" onClick={() => setOpenTicket(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <span className="admin-pill admin-pill-neutral">{TYPE_LABELS[openTicket.type] || openTicket.type}</span>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                  {openTicket.context?.user_name || "Anonym"} ({openTicket.context?.user_email || "—"}) · {new Date(openTicket.created_at).toLocaleString("da-DK")}
                </div>
              </div>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setOpenTicket(null)}>Luk</button>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16, whiteSpace: "pre-wrap" }}>{openTicket.description}</div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 16 }}>
              Skærm: {openTicket.context?.screen_label || openTicket.context?.screen || "–"}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["open", "in_progress", "resolved"].map(s => (
                <button key={s} className={`admin-btn admin-btn-sm ${openTicket.status === s ? "admin-btn-primary" : "admin-btn-ghost"}`}
                  onClick={() => updateTicketStatus(openTicket.id, s)}>{STATUS_LABELS[s]}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
