// @ts-nocheck
import React, { useEffect, useState } from "react";
import { showToast } from "../../SharedComponents.jsx";
import { ticketReporter, ticketDevice } from "../../ticketReporter.js";

const TYPE_LABELS = { bug: "Fejl", ui: "Design", missing: "Mangler", content: "Indhold", crash: "Crash", suggestion: "Forslag" };
const STATUS_LABELS = { open: "Åben", in_progress: "I gang", resolved: "Løst" };
const STATUS_PILL = { open: "admin-pill-red", in_progress: "admin-pill-amber", resolved: "admin-pill-green" };

// Bygger en færdig, indsætbar prompt til Claude Code pr. ticket — så admin
// kan tage indholdet af en downloadet/kopieret ticket og smide det direkte
// ind i en session uden selv at skulle formulere opgaven. Inkluderer al
// kontekst appen faktisk logger (FeedbackModal.jsx/FeedbackButton.jsx),
// så Claude ikke skal gætte sig til skærm/bruger/enhed.
function buildTicketPrompt(t) {
  const ctx = t.context || {};
  const dato = new Date(t.created_at).toLocaleString("da-DK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const lines = [
    `Undersøg og analysér følgende bruger-rapporterede ${(TYPE_LABELS[t.type] || t.type).toLowerCase()} i EatSafe-kodebasen (Allergi-Scan).`,
    ``,
    `## Rapport`,
    `Type: ${TYPE_LABELS[t.type] || t.type}`,
    `Beskrivelse: ${t.description || "(ingen beskrivelse angivet)"}`,
    `Indsendt: ${dato}`,
    `Bruger: ${ticketReporter(t)}${ctx.user_email ? ` (${ctx.user_email})` : ""}, rolle: ${ctx.user_role || "—"}`,
    ``,
    `## Kontekst fra appen på indsendelsestidspunktet`,
    `Skærm/sektion: ${ctx.screen_label || ctx.admin_section || ctx.screen || "—"}${ctx.page_id ? ` (${ctx.page_id})` : ""}`,
    `Kilde: ${ctx.source === "desktop-admin" ? "Desktop admin-panel" : "Mobil-app (PWA)"}`,
    `URL: ${ctx.url || "—"}`,
    `Enhed/browser: ${ticketDevice(ctx)} · ${ctx.browser || ctx.user_agent || ctx.platform || "—"}`,
    `Viewport: ${ctx.viewport || "—"} (skærm: ${ctx.screen_size || "—"})`,
    `Online: ${ctx.online === false ? "Nej" : "Ja"}`,
    ...(ctx.build_time || ctx.commit_sha ? [`Build: ${ctx.build_time || "—"} (${ctx.commit_sha || "—"})`] : []),
    ...(ctx.scan_result_ean ? [`Relateret produkt: ${ctx.scan_result_name || "—"} [EAN ${ctx.scan_result_ean}]`] : []),
    ...(ctx.allergens?.length ? [`Brugerens allergener: ${ctx.allergens.join(", ")}`] : []),
    ...(ctx.debug_trace?.length ? [``, `## Seneste debug-trace (${ctx.debug_trace.length} entries)`, JSON.stringify(ctx.debug_trace.slice(-15), null, 2)] : []),
    (t.image_path || t.image_base64) ? `\n(Der er vedhæftet et skærmbillede til denne ticket i EatSafe-admin — se ticket-id ${t.id} i Supabase feedback_tickets-tabellen hvis det er relevant for fejlsøgningen.)` : ``,
    ``,
    `## Opgave`,
    `1. Undersøg selv koden i repoet for at finde den sandsynlige rodårsag — gæt ikke, grep/læs de relevante filer først.`,
    `2. Forklar kort hvad der sker, og hvorfor (den reelle mekanisme, ikke bare symptomet).`,
    `3. Foreslå en konkret løsning.`,
    `4. Beskriv hvad løsningen vil betyde — omfang, risiko, og om den bør shippes isoleret eller kan batches.`,
    `Vent på min bekræftelse før du retter, medmindre det er en klart isoleret, lav-risiko rettelse.`,
  ];
  return lines.join("\n");
}

function copyTicketPrompt(t) {
  navigator.clipboard?.writeText(buildTicketPrompt(t))
    .then(() => showToast("Prompt kopieret"))
    .catch((e) => showToast("Kunne ikke kopiere: " + e.message, "error"));
}

function exportOpenTickets(tickets) {
  const filtered = tickets.filter(t => t.status === "open");
  const sections = filtered.map((t, i) => `═══ Ticket ${i + 1} af ${filtered.length} (id: ${t.id}) ═══\n\n${buildTicketPrompt(t)}`);
  const text = `EatSafe Tickets — Åbne (${filtered.length} stk)\nEksporteret: ${new Date().toLocaleString("da-DK")}\n\nHver ticket nedenfor er en færdig, indsætbar prompt — kopiér én sektion ad gangen ind i en Claude Code-session.\n\n` + sections.join("\n\n\n");
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `eatsafe-tickets-open-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click(); URL.revokeObjectURL(url);
}

// "Aktive" (standard) er åbne + i gang. Løst og Alle henter først de færdige tickets, når de åbnes.
const TABS = ["active", "open", "in_progress", "resolved", "all"];
const TAB_LABEL = { active: "Aktive", all: "Alle", ...STATUS_LABELS };
const needsDone = (tab) => tab === "resolved" || tab === "all";
const matchesTab = (t, tab) => tab === "all" || (tab === "active" ? t.status === "open" || t.status === "in_progress" : t.status === tab);

export default function TicketsSection({ adminTickets, ticketsLoading, adminTicketFilter, setAdminTicketFilter, ticketsIncludeDone, loadTickets, openTicket, setOpenTicket, updateTicketStatus }) {
  // "Løst" kræver en kort afsluttende kommentar, som vises i beskeden til brugeren.
  const [closing, setClosing] = useState(false);
  const [note, setNote] = useState("");
  const openModal = (t) => { setClosing(false); setNote(""); setOpenTicket(t); };
  const closeModal = () => { setClosing(false); setNote(""); setOpenTicket(null); };
  const pickStatus = (t, status) => {
    if (status === t.status) return;
    if (status === "resolved") { setNote(""); setClosing(true); setOpenTicket(t); return; }
    updateTicketStatus(t.id, status);
  };
  const filtered = adminTickets.filter(t => matchesTab(t, adminTicketFilter));
  const openCount = adminTickets.filter(t => t.status === "open").length;

  useEffect(() => {
    if (needsDone(adminTicketFilter) && !ticketsIncludeDone) loadTickets({ includeDone: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminTicketFilter, ticketsIncludeDone]);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div className="admin-tabs" style={{ marginBottom: 0, border: "none" }}>
          {TABS.map(s => (
            <button key={s} className={`admin-tab-btn${adminTicketFilter === s ? " active" : ""}`} onClick={() => setAdminTicketFilter(s)}>
              {TAB_LABEL[s]}{needsDone(s) && !ticketsIncludeDone ? "" : ` (${adminTickets.filter(t => matchesTab(t, s)).length})`}
            </button>
          ))}
        </div>
        {openCount > 0 && <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => exportOpenTickets(adminTickets)}>Download åbne + prompts ({openCount})</button>}
      </div>

      <div className="admin-table-wrap">
        {ticketsLoading ? (
          <div className="admin-loading-row"><div className="admin-spinner" /> Henter tickets…</div>
        ) : filtered.length === 0 ? (
          <div className="admin-table-empty">Ingen tickets her</div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Type</th><th>Beskrivelse</th><th>Bruger</th><th>Skærm</th><th>Dato</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => openModal(t)}>
                  <td><span className="admin-pill admin-pill-neutral">{TYPE_LABELS[t.type] || t.type}</span></td>
                  <td style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</td>
                  <td>{ticketReporter(t)}</td>
                  <td>{t.context?.screen_label || t.context?.screen || "–"}</td>
                  <td>{new Date(t.created_at).toLocaleDateString("da-DK")}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <select value={t.status} onChange={e => pickStatus(t, e.target.value)}
                      className={`admin-pill ${STATUS_PILL[t.status] || "admin-pill-neutral"}`}
                      style={{ fontFamily: "var(--f)", border: "none", cursor: "pointer" }}>
                      {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => copyTicketPrompt(t)}>Kopiér prompt</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {openTicket && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <span className="admin-pill admin-pill-neutral">{TYPE_LABELS[openTicket.type] || openTicket.type}</span>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                  {ticketReporter(openTicket)}{openTicket.context?.user_email ? ` (${openTicket.context.user_email})` : ""} · {new Date(openTicket.created_at).toLocaleString("da-DK")}
                </div>
              </div>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={closeModal}>Luk</button>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16, whiteSpace: "pre-wrap" }}>{openTicket.description}</div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 16 }}>
              Skærm: {openTicket.context?.screen_label || openTicket.context?.screen || "–"}
            </div>
            {closing && (
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="ticket-closing-note" style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>Afsluttende kommentar til brugeren (vises i beskeden)</label>
                <textarea id="ticket-closing-note" value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={500}
                  placeholder="Fx: Problemet med den grønne prik i menuen er rettet. Ændringen er med i den nyeste version."
                  style={{ width: "100%", boxSizing: "border-box", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--f)", fontSize: 13, resize: "vertical" }} />
                <button className="admin-btn admin-btn-primary admin-btn-sm" style={{ marginTop: 8 }} disabled={!note.trim()}
                  onClick={() => updateTicketStatus(openTicket.id, "resolved", note)}>Markér som løst</button>
              </div>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              {["open", "in_progress", "resolved"].map(s => (
                <button key={s} className={`admin-btn admin-btn-sm ${openTicket.status === s ? "admin-btn-primary" : "admin-btn-ghost"}`}
                  onClick={() => pickStatus(openTicket, s)}>{STATUS_LABELS[s]}</button>
              ))}
              <button className="admin-btn admin-btn-ghost admin-btn-sm" style={{ marginLeft: "auto" }}
                onClick={() => copyTicketPrompt(openTicket)}>
                Kopiér prompt
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
