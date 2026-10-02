// @ts-nocheck
// Delte profil-feltkomponenter — udtrukket fra OnboardingScreen.jsx's trin 1
// (25. sept. 2026, brugerfeedback: familie-formularen på trin 4 skal genbruge
// PRÆCIS de samme komponenter som trin 1-3, ikke sit eget parallelle
// design). Bruges af både OnboardingScreen.jsx (trin 1) og MemberForm.jsx.
import React from "react";
import { ChoiceCard } from "./DesignSystem.jsx";

// 27. sept. 2026, "FINAL 10/10 POLISH – ONBOARDING TRIN 1": alle tre bokse
// (minus/værdi/plus) har nu samme 44px højde (var 40px på knapperne, en
// implicit, ikke-eksakt højde på inputtet via padding) — matcher desuden
// det almindelige 44×44pt-tap-mål-minimum, som knapperne tidligere var
// under. Værdien i midten fik større/federe skrift (matcher knappernes
// egen 19px/700-vægt) i stedet for almindelig felt-tekst, så den læses som
// en aktiv, fremhævet værdi frem for almindelig, "død" input-tekst. Ny
// .age-step-btn-klasse (theme.jsx) giver en tydelig tryk-feedback
// (:active{scale+mørkere baggrund}), som de rå inline-stylede knapper
// ikke havde nogen af før.
// onOverMax (valgfri): hvis sat, kan alderen aldrig komme over `max` (typet eller med +); i stedet sættes den til max, og onOverMax kaldes,
// så skærmen kan forklare hvorfor. Uden onOverMax er adfærden uændret.
export function AgeStepper({ value, onChange, min = 1, max = 120, placeholder = "Vælg alder", onOverMax, startAt = 25 }) {
  const numValue = Number(value) || 0;
  const step = delta => {
    // Tom alder: første tryk (+ eller −) viser 25 som synligt udgangspunkt; der er ingen forudfyldt alder.
    // Alder 0 er en gyldig værdi (spædbarn) og må ikke behandles som "tom".
    const hasValue = value !== "" && value != null;
    const base = hasValue ? Number(value) : startAt;
    const wanted = base + delta;
    if (hasValue && onOverMax && wanted > max) { onChange(String(max)); onOverMax(); return; }
    const next = !hasValue ? base : Math.min(max, Math.max(min, wanted));
    onChange(String(next));
  };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <button type="button" className="age-step-btn" onClick={() => step(-1)} aria-label="Ét år yngre"
        style={{ width:44, height:44, flexShrink:0, borderRadius:10, border:"1.5px solid var(--border2)", background:"var(--surface2)", fontSize:19, fontWeight:700, color:"var(--ink)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
        −
      </button>
      <input className="field field-no-spinner" type="number" inputMode="numeric" placeholder={placeholder} min={min} max={max} aria-label="Alder i år"
        value={value || ""}
        onChange={e => {
          const v = e.target.value;
          if (onOverMax && v !== "" && Number(v) > max) { onChange(String(max)); onOverMax(); return; }
          if (onOverMax && v !== "" && Number(v) < min) { onChange(String(min)); return; }
          onChange(v);
        }}
        style={{ width: value ? 64 : 112, height:44, flexShrink:0, textAlign:"center", padding:"0 4px", fontSize: value ? 17 : 14, fontWeight: value ? 700 : 500, boxSizing:"border-box" }} />
      <button type="button" className="age-step-btn" onClick={() => step(1)} aria-label="Ét år ældre"
        style={{ width:44, height:44, flexShrink:0, borderRadius:10, border:"1.5px solid var(--border2)", background:"var(--surface2)", fontSize:19, fontWeight:700, color:"var(--ink)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
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
