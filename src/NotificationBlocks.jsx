// @ts-nocheck
// Tegner en besked ud fra de semantiske blokke, som edge-funktionen `notify`
// har gemt (supabase/functions/_shared/notificationContent.js). Ingen HTML fra
// serveren: kun ren tekst i kendte blokttyper, så indholdet aldrig kan bringe
// markup eller scripts med sig. Ingen e-mailramme, afmelding eller hilsen.
import React from "react";

const S = {
  h: { fontSize:19, fontWeight:800, color:"var(--ink)", letterSpacing:"-.3px", lineHeight:1.25, margin:"0 0 12px" },
  p: { fontSize:14, color:"var(--ink2)", lineHeight:1.55, margin:"0 0 12px" },
  panel: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r)", padding:"14px 16px", margin:"0 0 12px", boxShadow:"var(--sh)" },
  panelTitle: { fontSize:10.5, fontWeight:700, textTransform:"uppercase", letterSpacing:1.4, color:"var(--muted)", marginBottom:8 },
  quote: { borderLeft:"3px solid var(--border2)", padding:"2px 0 2px 12px", margin:"0 0 12px" },
  quoteLabel: { fontSize:10.5, fontWeight:700, textTransform:"uppercase", letterSpacing:1.4, color:"var(--muted)", marginBottom:4 },
  quoteText: { fontSize:13.5, color:"var(--ink2)", lineHeight:1.5, fontStyle:"italic", overflowWrap:"anywhere" },
  fact: { display:"flex", justifyContent:"space-between", gap:12, fontSize:13.5, padding:"8px 0", borderBottom:"1px solid var(--border)" },
  disclaimer: { fontSize:12, color:"var(--muted)", lineHeight:1.5, margin:"4px 0 0" },
};

function Parts({ parts, multiline }) {
  return (
    <>
      {(parts || []).map((part, i) =>
        part.strong
          ? <strong key={i} style={{ color:"var(--ink)", fontWeight:700 }}>{part.text}</strong>
          : <React.Fragment key={i}>{part.text}</React.Fragment>
      )}
    </>
  );
}

export function NotificationBlock({ block }) {
  switch (block?.type) {
    case "heading":
      return <h2 style={S.h}>{block.text}</h2>;
    case "paragraph":
      return <p style={{ ...S.p, ...(block.multiline ? { whiteSpace:"pre-wrap", overflowWrap:"anywhere" } : {}) }}><Parts parts={block.parts} /></p>;
    case "panel":
      return (
        <div style={S.panel}>
          {block.title && <div style={S.panelTitle}>{block.title}</div>}
          {(block.blocks || []).map((b, i) => <NotificationBlock key={i} block={b} />)}
        </div>
      );
    case "quote":
      return (
        <div style={S.quote}>
          <div style={S.quoteLabel}>{block.label}</div>
          <div style={S.quoteText}>{"“"}{block.text}{"”"}</div>
        </div>
      );
    case "fact":
      return <div style={S.fact}><span style={{ color:"var(--muted)" }}>{block.label}</span><span style={{ color:"var(--ink)", fontWeight:600, textAlign:"right" }}>{block.value}</span></div>;
    case "disclaimer":
      return <p style={S.disclaimer}>{block.text}</p>;
    default:
      return null; // Ukendt blok fra en nyere skabelonversion: vis ikke noget hellere end noget forkert
  }
}

export default function NotificationBlocks({ blocks }) {
  return <>{(blocks || []).map((b, i) => <NotificationBlock key={i} block={b} />)}</>;
}
