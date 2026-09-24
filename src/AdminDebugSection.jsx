// @ts-nocheck
import React from "react";
import { getTraceLog } from "./helpers.js";
import { UI } from "./styleUtils.js";

export default function AdminDebugSection() {
  return (
    <div style={UI.pb120}>
      <div style={UI.udflex_jcspacebet_aicenter_mb12}>
        <div style={UI.ufs14_fw800_cink}>Debug Trace Log</div>
        <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(getTraceLog(), null, 2)); }}
          style={{ padding:"6px 12px", borderRadius:8, background:"var(--surface2)", border:"1px solid var(--border)",
            fontFamily:"var(--f)", fontSize:11, fontWeight:700, color:"var(--ink2)", cursor:"pointer" }}>
          Kopier JSON
        </button>
      </div>
      <div style={UI.ufs11_cmuted_mb10}>
        Seneste {getTraceLog().length} operationer (scan, sog, OCR, submit). Nyeste forst.
      </div>
      {getTraceLog().slice().reverse().map((entry, i) => {
        const isError = !!entry.error || entry.ok === false;
        return (
          <div key={i} style={{
            padding:"8px 10px", marginBottom:4, borderRadius:8,
            background: isError ? "rgba(239,68,68,.08)" : "var(--surface)",
            border: `1px solid ${isError ? "var(--red-md)" : "var(--border)"}`,
            fontSize:11, fontFamily:"monospace",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
              <span style={{ fontWeight:700, color: isError ? "var(--red)" : "var(--green)" }}>{entry.id}</span>
              <span style={{ color:"var(--muted)", fontSize:10 }}>{new Date(entry.ts).toLocaleTimeString("da-DK")}</span>
            </div>
            <div style={{ color:"var(--ink2)" }}>
              {entry.step}
              {entry.error && <span style={UI.red}> — {entry.error}</span>}
              {entry.detail && <span style={UI.muted}> — {String(entry.detail)}</span>}
              {entry.textLength !== undefined && <span style={UI.muted}> ({entry.textLength} tegn)</span>}
              {entry.found !== undefined && <span style={UI.muted}> (found: {String(entry.found)})</span>}
              {entry.text && <span style={UI.muted}> "{entry.text}"</span>}
            </div>
          </div>
        );
      })}
      {getTraceLog().length === 0 && (
        <div style={{ textAlign:"center", padding:"32px 0", color:"var(--muted)" }}>
          Ingen operationer logget endnu. Scan, sog eller tag billede for at se trace.
        </div>
      )}
    </div>
  );
}
