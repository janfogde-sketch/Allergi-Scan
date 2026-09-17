// @ts-nocheck
import React from "react";
import { Loader, Icon } from "./SharedComponents.jsx";
import { UI } from "./styleUtils.js";

export default function AdminTicketsSection({
  adminTickets, adminTicketFilter, setAdminTicketFilter, ticketsLoading, updateTicketStatus, setOpenTicket,
}) {
  return (
    <div className="fade-in">
      {/* Status tæller grid — klikbar filter */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:12 }}>
        {[
          { status:"all",         label:"Alle",   color:"var(--ink3)" },
          { status:"open",        label:"Åbne",   color:"var(--red)" },
          { status:"in_progress", label:"I gang", color:"var(--amber)" },
          { status:"resolved",    label:"Løst",   color:"var(--green)" },
        ].map(s => {
          const count = s.status === "all" ? adminTickets.length : adminTickets.filter(t => t.status === s.status).length;
          const isActive = adminTicketFilter === s.status;
          return (
            <div key={s.status} onClick={() => setAdminTicketFilter(s.status)}
              style={{ background: isActive ? s.color : "var(--surface)", border:`1px solid ${isActive ? s.color : "var(--border)"}`, borderRadius:10, padding:"10px 6px", textAlign:"center", cursor:"pointer", transition:"all .15s",
                gridColumn: s.status === "all" ? "1 / -1" : "auto" }}>
              <div style={{ fontSize:18, fontWeight:900, color: isActive ? "var(--on-green)" : s.color }}>{count}</div>
              <div style={{ fontSize:9, color: isActive ? "rgba(255,255,255,.8)" : "var(--muted)", fontWeight:700, textTransform:"uppercase" }}>{s.label}</div>
            </div>
          );
        })}
      </div>
      {/* Download åbne tickets */}
      {!ticketsLoading && adminTickets.filter(t => t.status === "open").length > 0 && (
        <button onClick={() => {
          const filtered = adminTickets.filter(t => t.status === "open");
          const typeLabels = { bug:"Fejl", ui:"Design", missing:"Mangler", content:"Indhold", crash:"Crash", suggestion:"Forslag" };
          const statusLabels = { open:"Åben", in_progress:"I gang", resolved:"Løst" };
          const lines = filtered.map((t, i) => {
            const dato = new Date(t.created_at).toLocaleString("da-DK", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
            return [
              `── Ticket ${i + 1} ──────────────────────────────`,
              `Type:    ${typeLabels[t.type] || t.type}`,
              `Status:  ${statusLabels[t.status] || t.status}`,
              `Bruger:  ${t.context?.user_name || "Anonym"} (${t.context?.user_email || "—"})`,
              `Skærm:   ${t.context?.screen_label || t.context?.screen || "—"}`,
              `Enhed:   ${/iPhone|iPad/.test(t.context?.user_agent||"")?"iOS":/Android/.test(t.context?.user_agent||"")?"Android":"Desktop"}`,
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
        }} style={{
          width:"100%", padding:"10px", marginBottom:12, borderRadius:10,
          background:"var(--surface2)", border:"1px solid var(--border)",
          fontFamily:"var(--f)", fontSize:12, fontWeight:700,
          color:"var(--ink2)", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:6,
        }}>
          <Icon name="download" size={13} color="var(--ink2)" /> Download åbne tickets ({adminTickets.filter(t => t.status === "open").length})
        </button>
      )}

      {ticketsLoading && <Loader text="Indlæser…" />}
      {!ticketsLoading && adminTickets.length === 0 && <div style={UI.utacenter_p48px0}><div style={UI.emoji48mb12}>🎉</div><div style={UI.ufs16_fw800_cink}>Ingen tickets</div></div>}
      <div style={UI.colGap8}>
        {adminTickets.filter(t => adminTicketFilter === "all" || t.status === adminTicketFilter).map(t => {
          const typeConfig = { bug:{icon:"bug",color:"var(--red)",bg:"var(--red-lt)",label:"Fejl"}, ui:{emoji:"🎨",color:"var(--amber)",bg:"var(--amber-lt)",label:"Design"}, missing:{icon:"bulb",color:"var(--amber)",bg:"var(--amber-lt)",label:"Mangler"}, content:{icon:"package",color:"var(--ink3)",bg:"var(--surface2)",label:"Indhold"}, crash:{emoji:"💥",color:"var(--red)",bg:"var(--red-lt)",label:"Crash"}, suggestion:{emoji:"✨",color:"var(--green)",bg:"var(--green-lt)",label:"Forslag"} };
          const cfg = typeConfig[t.type] || typeConfig.bug;
          const statusColor = t.status==="open"?"var(--red)":t.status==="in_progress"?"var(--amber)":t.status==="resolved"?"var(--green)":"var(--muted)";
          const statusLabel = t.status==="open"?"Åben":t.status==="in_progress"?"I gang":t.status==="resolved"?"Løst":"Lukket";
          return (
            <div key={t.id} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", boxShadow:"var(--sh)" }}>
              <div className="admin-list-row" style={{ display:"flex", alignItems:"flex-start", gap:10 }} onClick={() => setOpenTicket(t)}>
                <div style={{ width:38, height:38, borderRadius:10, background:cfg.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{cfg.icon ? <Icon name={cfg.icon} size={18} color={cfg.color} /> : cfg.emoji}</div>
                <div style={UI.flexMin}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:cfg.color, background:cfg.bg, padding:"2px 8px", borderRadius:100 }}>{cfg.label}</span>
                  </div>
                  <div style={{ fontSize:13, color:"var(--ink)", lineHeight:1.4, marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.description}</div>
                  <div style={UI.muted10}>{t.context?.user_name || "Anonym"} · {t.context?.screen_label || t.context?.screen || "—"} · {new Date(t.created_at).toLocaleDateString("da-DK", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ flexShrink:0, marginTop:4 }}><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>
              </div>
              {/* Status toggle direkte på kortet */}
              <div style={{ display:"flex", gap:6, marginTop:10, paddingTop:10, borderTop:"1px solid var(--border)" }}>
                {[
                  { val:"open",        label:"Åben",   color:"var(--red)" },
                  { val:"in_progress", label:"I gang", color:"var(--amber)" },
                  { val:"resolved",    label:"Løst",   color:"var(--green)" },
                ].map(s => (
                  <button key={s.val} onClick={() => updateTicketStatus(t.id, s.val)}
                    style={{ flex:1, padding:"6px 2px", borderRadius:8, border:`1px solid ${t.status===s.val ? s.color : "var(--border)"}`,
                      background: t.status===s.val ? s.color : "var(--surface2)",
                      fontFamily:"var(--f)", fontSize:9, fontWeight:700,
                      color: t.status===s.val ? "var(--on-green)" : "var(--muted)", cursor:"pointer" }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
