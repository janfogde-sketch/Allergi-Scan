// @ts-nocheck
// Delte profil-feltkomponenter — udtrukket fra OnboardingScreen.jsx's trin 1
// (25. sept. 2026, brugerfeedback: familie-formularen på trin 4 skal genbruge
// PRÆCIS de samme komponenter som trin 1-3, ikke sit eget parallelle
// design). Bruges af både OnboardingScreen.jsx (trin 1) og MemberForm.jsx.
import React from "react";
import { ChoiceCard } from "./DesignSystem.jsx";

export function AgeStepper({ value, onChange, min = 1, max = 120, placeholder = "32" }) {
  const numValue = Number(value) || 0;
  const step = delta => {
    const base = Number(value) || 25;
    const next = numValue === 0 && delta > 0 ? base : Math.min(max, Math.max(min, base + delta));
    onChange(String(next));
  };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <button type="button" onClick={() => step(-1)} aria-label="Én år yngre"
        style={{ width:40, height:40, flexShrink:0, borderRadius:10, border:"1.5px solid var(--border2)", background:"var(--surface2)", fontSize:19, fontWeight:700, color:"var(--ink)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
        −
      </button>
      <input className="field field-no-spinner" type="number" inputMode="numeric" placeholder={placeholder} min={min} max={max}
        value={value || ""} onChange={e => onChange(e.target.value)}
        style={{ width:64, flexShrink:0, textAlign:"center", padding:"10px 4px" }} />
      <button type="button" onClick={() => step(1)} aria-label="Ét år ældre"
        style={{ width:40, height:40, flexShrink:0, borderRadius:10, border:"1.5px solid var(--border2)", background:"var(--surface2)", fontSize:19, fontWeight:700, color:"var(--ink)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
        +
      </button>
    </div>
  );
}

export function GenderPicker({ value, onChange, options = ["Mand", "Kvinde", "Andet", "Vil ikke oplyse"] }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
      {options.map(g => (
        <ChoiceCard key={g} label={g} selected={value === g} onClick={() => onChange(g)} />
      ))}
    </div>
  );
}
