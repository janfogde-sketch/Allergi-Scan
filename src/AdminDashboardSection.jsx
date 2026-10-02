// @ts-nocheck
import React from "react";
import { Icon } from "./SharedComponents.jsx";
import { Chevron, LABEL, TONE } from "./adminUi.jsx";

// KPI-kort: tallet er det tydeligste, ikonet er sekundært; ens højde og alignment.
function Kpi({ n, icon, label, tone = "neutral" }) {
  const color = TONE[tone].color;
  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"10px 12px", minHeight:68 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:24, fontWeight:900, color, lineHeight:1.1, fontVariantNumeric:"tabular-nums" }}>{n ?? "—"}</span>
        <Icon name={icon} size={14} color="var(--muted)" />
      </div>
      <div style={{ fontSize:11, color:"var(--muted2)", fontWeight:600, marginTop:4 }}>{label}</div>
    </div>
  );
}

export default function AdminDashboardSection({
  adminStats, setAdminSection, setSubmissionFilter, loadSubmissions, loadTickets, loadAdminUsers,
}) {
  const goSubmissions = (filter = "pending") => { setAdminSection("submissions"); setSubmissionFilter(filter); loadSubmissions(filter); };
  const goTickets = () => { setAdminSection("tickets"); loadTickets({ includeDone: true }); };
  const goUsers = () => { setAdminSection("users"); loadAdminUsers(); };
  const pending = Number(adminStats?.pending_submissions) || 0;
  const open = Number(adminStats?.open_tickets) || 0;

  return (
    <div className="fade-in">
      <div style={LABEL}>Brugere</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
        <Kpi n={adminStats?.total_users}    icon="profile" label="Brugere i alt" />
        <Kpi n={adminStats?.new_users_today} icon="plus"    label="Nye i dag"        tone={Number(adminStats?.new_users_today) > 0 ? "green" : "neutral"} />
        <Kpi n={adminStats?.total_scans}    icon="barcode" label="Scanninger i alt" />
        <Kpi n={adminStats?.scans_today}    icon="zap"     label="Scanninger i dag" />
      </div>

      <div style={LABEL}>Database & opgaver</div>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, overflow:"hidden", marginBottom:16 }}>
        {[
          { icon:"package", label:"Produkter i databasen",     n:adminStats?.total_products, tone:"neutral" },
          { icon:"family",  label:"Familiemedlemmer oprettet", n:adminStats?.total_families, tone:"neutral" },
          { icon:"clock",   label:"Indsendelser afventer",     n:adminStats?.pending_submissions, tone: pending > 0 ? "amber" : "neutral", action:() => goSubmissions("pending") },
          { icon:"bug",     label:"Åbne tickets",              n:adminStats?.open_tickets, tone: open > 0 ? "red" : "neutral", action:goTickets },
        ].map(({ icon, label, n, tone, action }, i, arr) => (
          <div key={label} onClick={action} className={action ? "admin-list-row" : undefined} role={action ? "button" : undefined}
            style={{ display:"flex", alignItems:"center", gap:10, minHeight:44, padding:"0 12px", borderBottom: i < arr.length-1 ? "1px solid var(--border)" : "none", cursor: action ? "pointer" : "default" }}>
            <Icon name={icon} size={16} color="var(--muted2)" />
            <span style={{ flex:1, fontSize:13, color:"var(--ink)", fontWeight:500 }}>{label}</span>
            <span style={{ minWidth:36, textAlign:"right", fontSize:15, fontWeight:800, color: TONE[tone].color, fontVariantNumeric:"tabular-nums" }}>{n ?? "—"}</span>
            {action ? <Chevron /> : <span style={{ width:14, flexShrink:0 }} />}
          </div>
        ))}
      </div>

      {/* Kun genveje, der giver værdi; sjældnere værktøjer ligger under Indhold og Drift */}
      <div style={LABEL}>Genveje</div>
      <div style={{ display:"flex", gap:8 }}>
        {[
          { icon:"package", label:"Godkend indsendelser", fn:() => goSubmissions("pending") },
          { icon:"bug",     label:"Gennemse tickets",     fn:goTickets },
          { icon:"family",  label:"Administrér brugere",  fn:goUsers },
        ].map(({ icon, label, fn }) => (
          <button key={label} type="button" onClick={fn} className="admin-action-card"
            style={{ flex:1, minHeight:56, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, padding:"6px 4px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, fontFamily:"var(--f)", fontSize:11.5, fontWeight:700, color:"var(--ink)", cursor:"pointer", lineHeight:1.2, textAlign:"center" }}>
            <Icon name={icon} size={16} color="var(--ink2)" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
