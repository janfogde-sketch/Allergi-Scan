// @ts-nocheck
import React, { useState } from "react";
import { Icon } from "./SharedComponents.jsx";
import { Chevron, LABEL, ROW } from "./adminUi.jsx";

// Oversigt over værktøjer i en gruppe (Indhold / Drift): hvert værktøj med ikon, titel og én linjes beskrivelse.
function Tool({ icon, title, text, onClick }) {
  return (
    <button type="button" onClick={onClick} className="admin-list-row"
      style={{ ...ROW, width:"100%", display:"flex", alignItems:"center", gap:12, textAlign:"left", fontFamily:"var(--f)", cursor:"pointer", marginBottom:8 }}>
      <span style={{ width:36, height:36, borderRadius:10, background:"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon name={icon} size={17} color="var(--ink2)" />
      </span>
      <span style={{ flex:1, minWidth:0 }}>
        <span style={{ display:"block", fontSize:13.5, fontWeight:800, color:"var(--ink)" }}>{title}</span>
        <span style={{ display:"block", fontSize:12, color:"var(--muted)", lineHeight:1.4, marginTop:1 }}>{text}</span>
      </span>
      <Chevron />
    </button>
  );
}

export default function AdminHubSection({ kind, onOpen }) {
  // Installations-QR til beta-testere. Peger på install.html: siden tjekker selv enheden (iPhone får en trin-for-trin guide,
  // alt andet sendes videre til appen med det samme).
  const [showInstallQr, setShowInstallQr] = useState(false);
  const installUrl = "https://eatsafe.dk/install.html";
  const installQrImg = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(installUrl)}&bgcolor=ffffff&color=0d3320&qzone=2`;

  return (
    <div className="fade-in">
      {kind === "content" ? (
        <>
          <div style={LABEL}>Indholdsværktøjer</div>
          <Tool icon="info"     title="Manglende EAN'er" text="Find og håndtér produkter uden gyldig stregkode." onClick={() => onOpen("missing")} />
          <Tool icon="download" title="Import"           text="Importér produktdata eller indhold." onClick={() => onOpen("import")} />
          <Tool icon="book"     title="Opskrifter"       text="Administrér opskrifter og tilknyttet indhold." onClick={() => onOpen("recipes")} />
          <Tool icon="check"    title="Godkendte produkter" text="Se produkter, der allerede er godkendt." onClick={() => onOpen("approved")} />
        </>
      ) : (
        <>
          <div style={LABEL}>Driftsværktøjer</div>
          <Tool icon="search" title="Debug" text="Seneste operationer (scan, søg, OCR, indsendelse) som log." onClick={() => onOpen("debug")} />
          <Tool icon="share"  title="Installations-QR til beta" text="Vis en kode, som beta-testere kan scanne for at installere appen." onClick={() => setShowInstallQr(true)} />
          <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5, textAlign:"center", padding:"14px 8px" }}>
            Systemstatus og flere interne driftsfunktioner vises her, når de bliver tilgængelige.
          </div>
        </>
      )}

      {showInstallQr && (
        <div onClick={() => setShowInstallQr(false)}
          style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:"var(--sheet)", borderRadius:20, padding:"24px 20px", maxWidth:340, width:"100%", textAlign:"center" }}>
            <div style={{ fontSize:15, fontWeight:800, color:"var(--ink)", marginBottom:4 }}>Installér EatSafe</div>
            <div style={{ fontSize:12, color:"var(--muted)", marginBottom:16, lineHeight:1.5 }}>
              Vis denne kode til beta-testere. Når de scanner den med telefonens kamera, åbner appen med det samme.
            </div>
            <img src={installQrImg} alt="Installations-QR til EatSafe" width={220} height={220}
              style={{ borderRadius:12, border:"1px solid var(--border)", display:"block", margin:"0 auto 14px" }} />
            <div style={{ fontSize:11, color:"var(--muted)", marginBottom:14, wordBreak:"break-all" }}>{installUrl}</div>
            <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:12, padding:"10px 12px", textAlign:"left", marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:800, color:"var(--ink)", marginBottom:4 }}>Sådan installerer de</div>
              <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.6 }}>
                Linket tjekker selv enheden: <strong style={{ color:"var(--ink2)" }}>Android/Chrome</strong> sendes direkte ind i appen, hvor browseren selv kan vise "Installér app". <strong style={{ color:"var(--ink2)" }}>iPhone/iPad</strong> lander på en trin-for-trin guide til "Del → Føj til hjemmeskærm" — Apple tillader ikke automatisk installation, så det trin er ikke til at komme udenom.
              </div>
            </div>
            <button type="button" className="btn btn-outline btn-full" onClick={() => setShowInstallQr(false)}>Luk</button>
          </div>
        </div>
      )}
    </div>
  );
}
