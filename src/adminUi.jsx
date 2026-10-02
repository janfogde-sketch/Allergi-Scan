// @ts-nocheck
// Små, delte byggeklodser til mobiladminen (ens chips, tomme tilstande, værktøjsrækker og statusfarver).
import React from "react";
import { Icon } from "./SharedComponents.jsx";

// Statusfarver bruges funktionelt: grøn = aktiv/positiv, gul = afventer/opmærksomhed, rød = problem, neutral = ren information.
export const TONE = {
  green:   { color: "var(--green)", bg: "var(--green-lt)" },
  amber:   { color: "var(--amber)", bg: "var(--amber-lt)" },
  red:     { color: "var(--red)",   bg: "var(--red-lt)" },
  neutral: { color: "var(--ink2)",  bg: "var(--surface2)" },
};

export function StatusChip({ tone = "neutral", icon, children }) {
  const t = TONE[tone] || TONE.neutral;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:10.5, fontWeight:700, lineHeight:1, padding:"3px 8px", borderRadius:100, color:t.color, background:t.bg, whiteSpace:"nowrap" }}>
      {icon && <Icon name={icon} size={10} color={t.color} />}{children}
    </span>
  );
}

export function Chevron() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" aria-hidden="true" style={{ flexShrink:0 }}><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>;
}

// Rigtig tom tilstand: ikon, kort titel, én forklaring og evt. en handling.
export function AdminEmpty({ icon = "package", title, text, action }) {
  return (
    <div style={{ textAlign:"center", padding:"36px 16px" }}>
      <span style={{ width:48, height:48, borderRadius:"50%", background:"var(--surface2)", border:"1px solid var(--border)", display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>
        <Icon name={icon} size={20} color="var(--muted)" />
      </span>
      <div style={{ fontSize:14, fontWeight:800, color:"var(--ink)" }}>{title}</div>
      {text && <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.5, marginTop:4 }}>{text}</div>}
      {action}
    </div>
  );
}

// Kompakt segmenteret filter (samme udseende overalt i admin).
export function Segmented({ options, value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} style={{ display:"flex", gap:2, padding:3, background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, marginBottom:10 }}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button key={o.value} role="tab" aria-selected={active} type="button" onClick={() => onChange(o.value)}
            style={{ flex:1, minHeight:34, padding:"0 4px", display:"flex", alignItems:"center", justifyContent:"center", gap:5, border:"none", borderRadius:8, cursor:"pointer", fontFamily:"var(--f)", fontSize:12, fontWeight:700,
              background: active ? "var(--surface)" : "transparent", color: active ? "var(--ink)" : "var(--ink2)", boxShadow: active ? "var(--sh2)" : "none" }}>
            {o.label}{o.count != null && <span style={{ fontSize:11, fontWeight:600, color: active ? "var(--muted2)" : "var(--muted)" }}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

// Fælles række-stil til lister (kompakt, kant i stedet for tung skygge).
export const ROW = { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"10px 12px" };
export const LABEL = { fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".8px", marginBottom:6 };

// Sekundær handling: tekniske oplysninger (datakilde, jobnavn, UTC-tid, motor) samles her og fylder intet i hoved-UI'et.
export function TechDetails({ rows }) {
  return (
    <details style={{ marginTop:10 }}>
      <summary style={{ cursor:"pointer", fontSize:12, fontWeight:700, color:"var(--muted2)", minHeight:32, display:"flex", alignItems:"center", listStyle:"none" }}>Vis tekniske detaljer</summary>
      <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, padding:"8px 12px", marginTop:4 }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display:"flex", justifyContent:"space-between", gap:12, fontSize:11.5, padding:"3px 0" }}>
            <span style={{ color:"var(--muted2)" }}>{k}</span>
            <span style={{ color:"var(--ink2)", textAlign:"right", fontFamily:"monospace" }}>{v}</span>
          </div>
        ))}
      </div>
    </details>
  );
}
