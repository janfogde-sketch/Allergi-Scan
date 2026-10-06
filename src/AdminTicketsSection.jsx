// @ts-nocheck
import React, { useEffect } from "react";
import { Loader, Icon } from "./SharedComponents.jsx";
import { ticketReporter, ticketDevice } from "./ticketReporter.js";
import { Chevron, StatusChip, AdminEmpty, Segmented, ROW } from "./adminUi.jsx";

const TYPE = {
  bug: { label:"Fejl", tone:"red" }, ui: { label:"Design", tone:"amber" }, missing: { label:"Mangler", tone:"amber" },
  content: { label:"Indhold", tone:"neutral" }, crash: { label:"Crash", tone:"red" }, suggestion: { label:"Forslag", tone:"green" },
};
const STATUS = { open: { label:"Åben", tone:"red" }, in_progress: { label:"I gang", tone:"amber" }, resolved: { label:"Løst", tone:"green" } };
const EMPTY = {
  all:         { title:"Ingen tickets", text:"Der er endnu ikke indsendt nogen tickets." },
  open:        { title:"Ingen åbne tickets", text:"Der er ingen tickets, der kræver behandling lige nu." },
  in_progress: { title:"Ingen tickets i gang", text:"Der er ingen tickets under behandling lige nu." },
  resolved:    { title:"Ingen løste tickets", text:"Der er endnu ingen løste tickets." },
};

export default function AdminTicketsSection({
  adminTickets, adminTicketFilter, setAdminTicketFilter, ticketsLoading, setOpenTicket,
}) {
  // Standardfilteret i useAdmin er "active" (åbne + i gang, bruges af den store admin); her vises de fire faner, og "active" svarer til "Åbne".
  useEffect(() => { if (adminTicketFilter === "active") setAdminTicketFilter("open"); }, [adminTicketFilter, setAdminTicketFilter]);
  const count = (st) => st === "all" ? adminTickets.length : adminTickets.filter(t => t.status === st).length;
  const openTickets = adminTickets.filter(t => t.status === "open");
  const visible = adminTickets.filter(t => adminTicketFilter === "all" || t.status === adminTicketFilter);

  const downloadOpen = () => {
    const filtered = openTickets;
    const typeLabels = { bug:"Fejl", ui:"Design", missing:"Mangler", content:"Indhold", crash:"Crash", suggestion:"Forslag" };
    const statusLabels = { open:"Åben", in_progress:"I gang", resolved:"Løst" };
    const lines = filtered.map((t, i) => {
      const dato = new Date(t.created_at).toLocaleString("da-DK", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
      return [
        `── Ticket ${i + 1} ──────────────────────────────`,
        `Type:    ${typeLabels[t.type] || t.type}`,
        `Status:  ${statusLabels[t.status] || t.status}`,
        `Bruger:  ${ticketReporter(t)}${t.context?.user_email ? ` (${t.context.user_email})` : ""}`,
        `Skærm:   ${t.context?.screen_label || t.context?.screen || "—"}`,
        `Enhed:   ${ticketDevice(t.context)}`,
        `Dato:    ${dato}`,
        ``,
        t.description || "(ingen beskrivelse)",
        ``,
      ].join("\n");
    });
    const text = `EatSafe Tickets — Åbne (${filtered.length} stk)\nEksporteret: ${new Date().toLocaleString("da-DK")}\n\n` + lines.join("\n");
    const blob = new Blob([text], { type:"text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `eatsafe-tickets-open-${new Date().toISOString().slice(0,10)}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in">
      <Segmented label="Filtrér tickets" value={adminTicketFilter} onChange={setAdminTicketFilter}
        options={[
          { value:"all",         label:"Alle",   count:count("all") },
          { value:"open",        label:"Åbne",   count:count("open") },
          { value:"in_progress", label:"I gang", count:count("in_progress") },
          { value:"resolved",    label:"Løst",   count:count("resolved") },
        ]} />

      {/* Sekundær handling ved listen, ikke ved siden af selve sagsbehandlingen */}
      {!ticketsLoading && openTickets.length > 0 && (
        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:6 }}>
          <button type="button" onClick={downloadOpen}
            style={{ minHeight:36, padding:"0 4px", background:"none", border:"none", fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--muted)", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
            <Icon name="download" size={13} color="var(--muted2)" /> Download åbne tickets ({openTickets.length})
          </button>
        </div>
      )}

      {ticketsLoading && <Loader text="Indlæser…" />}
      {!ticketsLoading && visible.length === 0 && <AdminEmpty icon="bug" {...(EMPTY[adminTicketFilter] || EMPTY.all)} />}
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {visible.map(t => {
          const type = TYPE[t.type] || TYPE.bug;
          const st = STATUS[t.status] || { label:"Lukket", tone:"neutral" };
          return (
            <div key={t.id} onClick={() => setOpenTicket(t)} className="admin-list-row" role="button" style={{ ...ROW, display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:4 }}>
                  <StatusChip tone={st.tone}>{st.label}</StatusChip>
                  <StatusChip tone={type.tone}>{type.label}</StatusChip>
                </div>
                <div style={{ fontSize:13, color:"var(--ink)", lineHeight:1.4, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.description || "(ingen beskrivelse)"}</div>
                <div style={{ fontSize:11, color:"var(--muted)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {ticketReporter(t)} · {t.context?.screen_label || t.context?.screen || "—"} · {new Date(t.created_at).toLocaleDateString("da-DK", { day:"numeric", month:"short" })}
                </div>
              </div>
              <Chevron />
            </div>
          );
        })}
      </div>
    </div>
  );
}
