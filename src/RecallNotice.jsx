// @ts-nocheck
// F1-1 (6. okt. 2026): kort på resultatsiden, når varen er kaldt tilbage af Fødevarestyrelsen.
// Teksten kommer fra Fødevarestyrelsens side (recalls-tabellen); linket vises kun til deres
// eget domæne. Kun bestemte partier kan være berørt, så kortet beder brugeren tjekke emballagen.
import React from "react";
import { Icon } from "./SharedComponents.jsx";
import { isOfficialRecallUrl } from "../supabase/functions/_shared/recallParser.js";

export default function RecallNotice({ recalls }) {
  if (!recalls?.length) return null;
  const r = recalls[0];
  const date = r.published_at ? new Date(r.published_at).toLocaleDateString("da-DK", { day:"numeric", month:"long", year:"numeric" }) : null;
  const line = { fontSize:13, color:"var(--ink)", lineHeight:1.5, marginTop:6 };
  return (
    <div className="card" role="alert" style={{ border:"2px solid var(--red)", background:"linear-gradient(var(--red-lt), var(--red-lt)), var(--surface)", marginBottom:10 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <Icon name="warning" size={18} color="var(--red)" />
        <div style={{ fontSize:15, fontWeight:800, color:"var(--red)" }}>Tilbagekaldt af Fødevarestyrelsen</div>
      </div>
      {r.title && <div style={{ ...line, fontWeight:700 }}>{r.title}</div>}
      {date && <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>Offentliggjort {date}</div>}
      {r.affected && <div style={line}><b>Berørte varer:</b> {r.affected}</div>}
      {r.reason && <div style={line}><b>Årsag:</b> {r.reason}</div>}
      {r.action && <div style={line}><b>Hvad skal du gøre:</b> {r.action}</div>}
      <div style={{ ...line, color:"var(--ink2)" }}>
        Ofte gælder det kun bestemte partier eller datoer. Sammenlign med emballagen, før du spiser varen.
      </div>
      {isOfficialRecallUrl(r.source_url) && (
        <a href={r.source_url} target="_blank" rel="noopener noreferrer"
          style={{ display:"inline-flex", alignItems:"center", gap:6, marginTop:10, fontSize:13, fontWeight:700, color:"var(--red)" }}>
          Læs hos Fødevarestyrelsen <Icon name="link" size={13} color="var(--red)" />
        </a>
      )}
      {recalls.length > 1 && (
        <div style={{ fontSize:12, color:"var(--muted)", marginTop:8 }}>Der er {recalls.length} tilbagekaldelser for denne stregkode.</div>
      )}
    </div>
  );
}
