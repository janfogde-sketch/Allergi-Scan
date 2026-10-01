// @ts-nocheck
import React from "react";
import { Icon } from "./SharedComponents.jsx";

// "Vigtig sikkerhedsinformation" — ét kort modal (2. okt. 2026, onboarding-polering). Erstatter den tidligere 2-trins Beta-intro:
// "Velkommen til EatSafe Beta"-sliden er fjernet (BETA vises kun som diskret badge i headeren), så efter sidste onboarding-trin
// kommer kun denne ene modal, før appen åbner. Vises enten som sidste trin i onboarding (CTA gennemfører onboarding) eller manuelt
// fra menuen/Indstillinger (CTA lukker bare). Ingen "Spring over": brugeren skal bekræfte, at de har set den.
export const SAFETY_INFO_PARAGRAPHS = [
  "EatSafe er vejledende. Kontrollér altid produktets aktuelle ingrediens- og allergenoplysninger på emballagen.",
  "Produktinformation kan ændre sig, og EatSafe kan derfor ikke erstatte oplysningerne på den fysiske emballage.",
];

export default function SafetyInfoModal({ onAcknowledge, busy = false }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:10000, background:"rgba(21,32,26,.6)", display:"flex", alignItems:"center", justifyContent:"center",
      padding:"max(20px, env(safe-area-inset-top)) 20px max(20px, env(safe-area-inset-bottom))", overflowY:"auto" }}>
      <div role="dialog" aria-modal="true" aria-labelledby="safety-info-title" aria-describedby="safety-info-text"
        style={{ background:"var(--sheet)", borderRadius:20, padding:"28px 22px 22px", width:"100%", maxWidth:400, boxSizing:"border-box", margin:"auto" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ marginBottom:16, display:"flex", justifyContent:"center" }}>
            <Icon name="warning" size={44} color="var(--red)" />
          </div>
          <div id="safety-info-title" style={{ fontSize:20, fontWeight:800, color:"var(--ink)", marginBottom:12, letterSpacing:"-.3px" }}>
            Vigtig sikkerhedsinformation
          </div>
          <div id="safety-info-text" style={{ fontSize:14, color:"var(--ink2)", lineHeight:1.65, display:"flex", flexDirection:"column", gap:12 }}>
            {SAFETY_INFO_PARAGRAPHS.map(p => <p key={p} style={{ margin:0 }}>{p}</p>)}
          </div>
        </div>
        <button className="btn btn-primary btn-full" onClick={onAcknowledge} disabled={busy} autoFocus>
          Jeg forstår – kom i gang
        </button>
      </div>
    </div>
  );
}
