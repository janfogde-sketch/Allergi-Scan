// @ts-nocheck
// Dele til "Produkt ikke fundet" og "Tak"-siden (16. okt. 2026, fejlrapport): den foreløbige vurdering ud fra billedet af
// ingredienslisten og gode råd, når billedet ikke kunne læses. Bruges af NotFoundScreen.jsx og SubmittedScreen.jsx.
import React from "react";
import { Icon } from "./SharedComponents.jsx";
import { evaluateProductForProfiles, profilesHaveSelections } from "./helpers.js";

export const OCR_TIPS = [
  "Fotografér kun ingredienslisten, så den fylder det meste af billedet",
  "Hold telefonen lige over teksten, ikke på skrå",
  "Sørg for godt lys uden skygger og genskin, og glat krøllet emballage ud",
  "Hold telefonen stille, til teksten er skarp, før du tager billedet",
];

// Ingredienslisten kunne ikke læses: sig det tydeligt, giv gode råd, og lad brugeren tage et nyt billede.
export function OcrUnreadableNotice({ onCapture }) {
  return (
    <div role="alert" style={{ background:"var(--amber-lt)", border:"1px solid var(--amber-md)", borderRadius:12, padding:"14px", marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
        <span style={{ flexShrink:0, marginTop:1 }}><Icon name="warning" size={18} color="var(--amber)" /></span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"var(--ink)" }}>Vi kunne ikke læse ingredienslisten</div>
          <div style={{ fontSize:12.5, color:"var(--ink2)", lineHeight:1.5, marginTop:3 }}>
            Derfor kan vi ikke tjekke allergenerne. Tag et nyt billede. Sådan bliver det bedst:
          </div>
          <ul style={{ margin:"8px 0 0", paddingLeft:18, fontSize:12.5, color:"var(--ink2)", lineHeight:1.5 }}>
            {OCR_TIPS.map(t => <li key={t}>{t}</li>)}
          </ul>
        </div>
      </div>
      {onCapture && (
        <label className="btn btn-primary btn-full" style={{ marginTop:12 }}>
          <Icon name="camera" size={18} color="var(--on-green)" /> Tag nyt billede
          <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={onCapture} />
        </label>
      )}
    </div>
  );
}

// Foreløbig vurdering for de valgte personer ud fra billedet af ingredienslisten. Samme regler som resultatsiden
// (evaluateProductForProfiles), men aldrig grøn: produktet er ikke godkendt, og teksten er læst af en maskine.
export function PhotoVerdictCard({ profiles, flags, ingredientsText }) {
  if (!flags || !String(ingredientsText || "").trim() || !profilesHaveSelections(profiles)) return null;
  const ev = evaluateProductForProfiles(profiles, { allergen_flags: flags, ingredients_text: ingredientsText });
  const tone = ev.level === "danger"
    ? { color:"var(--red)", bg:"var(--red-lt)", border:"var(--red-md)", icon:"warning", title: ev.label }
    : ev.level === "warn"
      ? { color:"var(--amber)", bg:"var(--amber-lt)", border:"var(--amber-md)", icon:"warning", title: ev.label }
      : { color:"var(--neutral)", bg:"var(--surface)", border:"var(--border)", icon:"info", title:"Vi fandt ingen af dine allergier på billedet" };
  return (
    <div role="status" style={{ background:tone.bg, border:`1px solid ${tone.border}`, borderRadius:12, padding:"14px", marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".6px", marginBottom:6 }}>Foreløbig vurdering for dig</div>
      <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
        <span style={{ flexShrink:0, marginTop:1 }}><Icon name={tone.icon} size={18} color={tone.color} /></span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:800, color:tone.color }}>{tone.title}</div>
          {ev.reasons.length > 0 && (
            <ul style={{ margin:"6px 0 0", paddingLeft:18, fontSize:13, color:"var(--ink)", lineHeight:1.5 }}>
              {ev.reasons.map(r => <li key={r}>{r}</li>)}
            </ul>
          )}
          <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5, marginTop:6 }}>
            Vurderingen bygger på dit billede. Produktet er ikke godkendt endnu, så tjek selv pakken.
          </div>
        </div>
      </div>
    </div>
  );
}
