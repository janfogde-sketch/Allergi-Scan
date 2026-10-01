// @ts-nocheck
// Simpel førsteversion (2. okt. 2026): særskilt afkrydsning for udtrykkeligt samtykke til helbredsoplysninger.
// Ikke forhåndsafkrydset og adskilt fra vilkår/privatlivspolitik. Bjørn finpudser designet.
import React from "react";
import { HEALTH_CONSENT_TEXT } from "./healthConsent.js";

export default function HealthConsentBox({ checked, onChange, openPrivacy }) {
  return (
    <label style={{ display:"flex", gap:10, alignItems:"flex-start", background:"var(--surface2)", border:"1px solid var(--border)",
                    borderRadius:12, padding:"12px 14px", margin:"4px 0 14px", cursor:"pointer" }}>
      <input id="health-consent" type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)}
        style={{ marginTop:3, width:18, height:18, accentColor:"var(--green)", flexShrink:0 }} />
      <span style={{ fontSize:12.5, lineHeight:1.55, color:"var(--ink2)" }}>
        {HEALTH_CONSENT_TEXT}
        {openPrivacy && (
          <> <button type="button" onClick={e => { e.preventDefault(); openPrivacy(); }}
            style={{ background:"none", border:"none", padding:0, color:"var(--green)", fontWeight:700, fontSize:12.5, cursor:"pointer", textDecoration:"underline" }}>
            Læs privatlivspolitikken
          </button></>
        )}
      </span>
    </label>
  );
}
