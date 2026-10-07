// @ts-nocheck
// Fælles visning af Privatlivspolitik og Brugsvilkår ud fra teksten i src/legalText/.
// Udseendet er uændret ift. de tidligere håndskrevne skærme.
import React from "react";
import { parseInline, LEGAL_MAIL } from "./legalText/inline.js";

const S = {
  updated: { fontSize:12.5, color:"var(--muted)", marginBottom:16 },
  draftNotice: { background:"var(--amber-lt)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", marginBottom:24, fontSize:13, color:"var(--ink2)", fontWeight:500, lineHeight:1.5 },
  h2: { fontSize:15, fontWeight:800, color:"var(--green)", margin:"24px 0 8px" },
  p: { fontSize:13.5, color:"var(--ink2)", lineHeight:1.55, marginBottom:10 },
  ul: { fontSize:13.5, color:"var(--ink2)", lineHeight:1.55, paddingLeft:18, marginBottom:10 },
  li: { marginBottom:5 },
  a: { color:"var(--green)", fontWeight:700, textDecoration:"none" },
  contactBox: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 18px", marginTop:28, boxShadow:"var(--sh)" },
};

function Inline({ text }) {
  return parseInline(text).map((p, i) => {
    if (p.type === "text") return <React.Fragment key={i}>{p.text}</React.Fragment>;
    if (p.type === "strong") return <strong key={i}>{p.text}</strong>;
    if (p.type === "br") return <br key={i} />;
    if (p.type === "mail") return <a key={i} href={`mailto:${LEGAL_MAIL}`} style={S.a}>{LEGAL_MAIL}</a>;
    const ext = /^https?:/.test(p.href);
    return <a key={i} href={p.href} {...(ext ? { target:"_blank", rel:"noopener noreferrer" } : {})} style={S.a}>{p.text}</a>;
  });
}

export default function LegalContent({ doc }) {
  return (
    <>
      <div style={S.updated}>Sidst opdateret: {doc.updated}</div>
      <div style={S.draftNotice}><Inline text={doc.draftNotice} /></div>
      {doc.blocks.map(([kind, v], i) => {
        if (kind === "h2") return <h2 key={i} style={S.h2}><Inline text={v} /></h2>;
        if (kind === "ul") return <ul key={i} style={S.ul}>{v.map((li, j) => <li key={j} style={S.li}><Inline text={li} /></li>)}</ul>;
        return <p key={i} style={S.p}><Inline text={v} /></p>;
      })}
      <div style={S.contactBox}>
        <p style={{ margin:0, fontSize:13.5, color:"var(--ink2)", lineHeight:1.55 }}><Inline text={doc.contactBox} /></p>
      </div>
    </>
  );
}
