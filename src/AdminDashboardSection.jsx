// @ts-nocheck
import React, { useState } from "react";
import { Icon } from "./SharedComponents.jsx";
import { UI } from "./styleUtils.js";

export default function AdminDashboardSection({
  adminStats, setAdminSection, setSubmissionFilter, loadSubmissions, loadTickets, loadAdminUsers,
}) {
  // ── Installations-QR til beta-testere ───────────────────────────────────────
  // Peger på install.html i stedet for direkte på appen: den siden tjekker selv
  // enheden — iPhone/iPad får en trin-for-trin guide (Apple tillader ikke
  // automatisk installation), alt andet sendes videre til appen med det samme.
  const [showInstallQr, setShowInstallQr] = useState(false);
  const installUrl = "https://eatsafe.dk/install.html";
  const installQrImg = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(installUrl)}&bgcolor=ffffff&color=0d3320&qzone=2`;

  return (
    <div className="fade-in">
      <div style={UI.sectionLbl8}>Brugere</div>
      <div style={UI.udgrid_gri1fr1fr_g8_mb14}>
        {[
          { n:adminStats?.total_users,     icon:"profile", label:"Brugere i alt",   color:"var(--ink)" },
          { n:adminStats?.new_users_today,  icon:"plus",    label:"Nye i dag",        color:"var(--green)" },
          { n:adminStats?.total_scans,      icon:"barcode", label:"Scanninger i alt", color:"var(--ink)" },
          { n:adminStats?.scans_today,      icon:"zap", label:"Scanninger i dag", color:"var(--amber)" },
        ].map(({ n, icon, emoji, label, color }) => (
          <div key={label} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"16px 14px", boxShadow:"var(--sh)" }}>
            <div style={{ marginBottom:4 }}>{icon ? <Icon name={icon} size={22} color={color} /> : emoji}</div>
            <div style={{ fontSize:28, fontWeight:900, color, lineHeight:1 }}>{n ?? "—"}</div>
            <div style={{ fontSize:11, color:"var(--muted)", fontWeight:600, marginTop:4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={UI.sectionLbl8}>Database & opgaver</div>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, overflow:"hidden", marginBottom:14, boxShadow:"var(--sh)" }}>
        {[
          { icon:"package", label:"Produkter i databasen",   n:adminStats?.total_products,        color:"var(--ink)" },
          { icon:"family", label:"Familiemedlemmer oprettet", n:adminStats?.total_families,         color:"var(--ink)" },
          { icon:"clock", label:"Indsendelser afventer",   n:adminStats?.pending_submissions,    color:"var(--amber)", action:() => { setAdminSection("submissions"); setSubmissionFilter("pending"); loadSubmissions("pending"); } },
          { icon:"bug", label:"Åbne tickets",             n:adminStats?.open_tickets,           color:"var(--red)",   action:() => { setAdminSection("tickets"); loadTickets(); } },
        ].map(({ icon, emoji, label, n, color, action }, i, arr) => (
          <div key={label} onClick={action} className={action ? "admin-list-row" : undefined}
            style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom: i < arr.length-1 ? "1px solid var(--border)" : "none", cursor: action ? "pointer" : "default" }}>
            <span style={UI.fs20}>{icon ? <Icon name={icon} size={18} color={color} /> : emoji}</span>
            <span style={{ flex:1, fontSize:13, color:"var(--ink)", fontWeight:500 }}>{label}</span>
            <span style={{ fontSize:18, fontWeight:900, color }}>{n ?? "—"}</span>
            {action && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>}
          </div>
        ))}
      </div>

      <div style={UI.sectionLbl8}>Hurtige handlinger</div>
      <div style={UI.grid2gap8}>
        {[
          { icon:"package", label:"Godkend indsendelser", color:"var(--amber)", fn:() => { setAdminSection("submissions"); setSubmissionFilter("pending"); loadSubmissions("pending"); } },
          { icon:"bug", label:"Gennemse tickets",     color:"var(--red)",   fn:() => { setAdminSection("tickets"); loadTickets(); } },
          { icon:"check", label:"Godkendte produkter",  color:"var(--green)", fn:() => { setAdminSection("submissions"); setSubmissionFilter("approved"); loadSubmissions("approved"); } },
          { icon:"family", label:"Administrér brugere",  color:"var(--ink)",   fn:() => { setAdminSection("users"); loadAdminUsers(); } },
          { icon:"share", label:"Installations-QR til beta", color:"var(--blue)", fn:() => setShowInstallQr(true) },
        ].map(({ icon, label, color, fn }) => (
          <button key={label} onClick={fn} className="admin-action-card"
            style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:6, padding:"14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, boxShadow:"var(--sh)", fontFamily:"var(--f)", textAlign:"left" }}>
            <Icon name={icon} size={22} color={color} />
            <span style={{ fontSize:12, fontWeight:700, color }}>{label}</span>
          </button>
        ))}
      </div>

      {/* QR popup — fullscreen overlay, samme mønster som Madpas-delingen */}
      {showInstallQr && (
        <div onClick={() => setShowInstallQr(false)}
          style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:"var(--sheet)", borderRadius:24, padding:"28px 24px", maxWidth:340, width:"100%", textAlign:"center" }}>
            <div style={{ fontSize:13, fontWeight:800, color:"var(--blue)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>Installér EatSafe</div>
            <div style={{ fontSize:11, color:"var(--muted)", marginBottom:18, lineHeight:1.5 }}>
              Vis denne kode til beta-testere. Når de scanner den med telefonens kamera, åbner appen med det samme.
            </div>
            <img src={installQrImg} alt="Installations-QR til EatSafe"
              width={220} height={220}
              style={{ borderRadius:16, border:"3px solid var(--blue-md)", display:"block", margin:"0 auto 18px" }} />
            <div style={{ fontSize:11, color:"var(--muted)", marginBottom:16, wordBreak:"break-all" }}>{installUrl}</div>
            <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", textAlign:"left", marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:800, color:"var(--ink)", marginBottom:6 }}>Sådan installerer de</div>
              <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.6 }}>
                Linket tjekker selv enheden: <strong style={{ color:"var(--ink2)" }}>Android/Chrome</strong> sendes direkte ind i appen, hvor browseren selv kan vise "Installér app". <strong style={{ color:"var(--ink2)" }}>iPhone/iPad</strong> lander på en trin-for-trin guide til "Del → Føj til hjemmeskærm" — Apple tillader ikke automatisk installation, så det trin er ikke til at komme udenom.
              </div>
            </div>
            <button onClick={() => setShowInstallQr(false)}
              style={{ width:"100%", padding:"12px", background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:10, fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"var(--ink)", cursor:"pointer" }}>
              Luk
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
