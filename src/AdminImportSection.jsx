// @ts-nocheck
import React from "react";
import { Icon } from "./SharedComponents.jsx";
import { UI } from "./styleUtils.js";
import { TechDetails } from "./adminUi.jsx";

export default function AdminImportSection({
  importLog, importLoading, runImport, reparseLog, reparseLoading, runReparse,
}) {
  return (
    <div>
      <div style={UI.rowBetweenMb16}>
        <div style={{ ...UI.ufs17_fw800_cink, display:"flex", alignItems:"center", gap:8, minWidth:0, flex:1 }}><Icon name="download" size={15} color="var(--ink)" /> Open Food Facts auto-import</div>
        <button
          onClick={() => runImport(true)}
          disabled={importLoading}
          style={{ background: importLoading ? "var(--border2)" : "var(--green)", color: importLoading ? "var(--muted)" : "var(--on-green)", border:"none", borderRadius:8, padding:"8px 16px", fontSize:12, fontWeight:800, fontFamily:"var(--f)", cursor: importLoading ? "not-allowed" : "pointer", boxShadow: importLoading ? "none" : "var(--sh)", whiteSpace:"nowrap", flexShrink:0, marginLeft:10, display:"flex", alignItems:"center", gap:6 }}>
          {importLoading
            ? <><div style={{ width:12, height:12, border:"2px solid rgba(0,0,0,.2)", borderTopColor:"var(--on-green)", borderRadius:"50%", animation:"spin .7s linear infinite" }} /> Importerer…</>
            : "Kør import nu"}
        </button>
      </div>

      <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.6 }}>
        Henter op til 50 manglende produkter og forsøger automatisk import. Kører automatisk hver nat.
      </div>
      <div style={{ marginBottom:16 }}>
        <TechDetails rows={[
          ["Datakilde", "missing_ean_log"],
          ["Opslag", "Open Food Facts"],
          ["Planlagt kørsel", "02:00 UTC (04:00 dansk sommertid)"],
          ["Antal pr. kørsel", "op til 50"],
          ...(importLog?.stats ? [["Seneste manuelle kørsel", `${importLog.stats.imported ?? 0} importeret, ${importLog.stats.not_on_off ?? 0} ikke på OFF, ${importLog.stats.error ?? 0} fejl`]] : []),
        ]} />
      </div>

      {/* Status */}
      {importLoading && (
        <div style={UI.udflex_aicenter_g10_p12px14px_bgsurface_bd1pxsolid_br12_mb12}>
          <div style={UI.uw16_h16_bd2pxsolid_borgreen_br50_anspin7sli_shr0} />
          <div style={UI.muted13}>Importerer produkter fra Open Food Facts…</div>
        </div>
      )}

      {/* Statistik */}
      {importLog?.stats && !importLoading && (
        <div style={UI.udgrid_gri1fr1fr_g8_mb14}>
          {[
            { icon:"check",   label:"Importeret",    value: importLog.stats.imported,       color:"var(--green)" },
            { icon:"search",  label:"Fundet på OFF", value: importLog.stats.found ?? (importLog.stats.imported + importLog.stats.not_on_off), color:"var(--blue)" },
            { icon:"x",       label:"Ikke på OFF",   value: importLog.stats.not_on_off,     color:"var(--muted)" },
            { icon:"warning", label:"Fejl",          value: importLog.stats.error,          color:"var(--amber)" },
          ].map(s => (
            <div key={s.label} style={{ padding:"12px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, textAlign:"center", boxShadow:"var(--sh)" }}>
              <div style={{ fontSize:22, fontWeight:900, color:s.color, marginBottom:2 }}>{s.value ?? 0}</div>
              <div style={{ ...UI.muted11, display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}><Icon name={s.icon} size={10} color="var(--muted)" /> {s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Log */}
      {importLog?.log?.length > 0 && !importLoading && (
        <div style={UI.ubgsurface_bd1pxsolid_br12_ovhidden}>
          <div style={{ padding:"10px 14px", borderBottom:"1px solid var(--border)", fontSize:12, fontWeight:800, color:"var(--ink)" }}>
            Importeret ({importLog.log.length})
          </div>
          <div style={{ maxHeight:300, overflowY:"auto" }}>
            {importLog.log.map((line, i) => (
              <div key={i} style={{ padding:"8px 14px", borderBottom: i < importLog.log.length-1 ? "1px solid var(--border)" : "none", fontSize:12, color:"var(--ink2)", fontFamily:"monospace" }}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {importLog && !importLoading && (!importLog.log || importLog.log.length === 0) && (
        <div style={{ textAlign:"center", padding:"32px 0", color:"var(--muted)", fontSize:13 }}>
          {importLog.stats?.imported === 0
            ? "Ingen nye produkter fundet. Prøv igen senere, når flere produkter er efterspurgt."
            : "Import fuldført"}
        </div>
      )}

      {!importLog && !importLoading && (
        <div style={{ textAlign:"center", padding:"40px 0" }}>
          <div style={{ marginBottom:12, display:"flex", justifyContent:"center" }}><Icon name="download" size={32} color="var(--muted)" /></div>
          <div style={{ fontSize:14, fontWeight:700, color:"var(--ink)", marginBottom:6 }}>Klar til import</div>
          <div style={UI.ufs12_cmuted}>
            Tryk "Kør import nu" for at hente manglende produkter fra Open Food Facts
          </div>
        </div>
      )}

      {/* ── Allergen Reparsing ── */}
      <div style={{ marginTop:24, paddingTop:20, borderTop:"1px solid var(--border)" }}>
        <div style={UI.rowBetweenMb10}>
          <div>
            <div style={{ ...UI.ufs15_fw800_cink, display:"flex", alignItems:"center", gap:8 }}><Icon name="refresh" size={14} color="var(--ink)" /> Allergen-genanalyse</div>
            <div style={{ fontSize:12, color:"var(--muted)", marginTop:2, lineHeight:1.6 }}>
              Genanalyserer produkter med lav datakvalitet og forsøger at forbedre allergeninformationen. Kører automatisk hver nat.
            </div>
          </div>
          <button
            onClick={() => reparseLoading ? null : runReparse(true)}
            disabled={reparseLoading}
            style={{ background: reparseLoading ? "var(--border2)" : "var(--green)", color: reparseLoading ? "var(--muted)" : "var(--on-green)",
              border:"none", borderRadius:8, padding:"8px 14px", fontSize:12, fontWeight:800,
              fontFamily:"var(--f)", cursor: reparseLoading ? "not-allowed" : "pointer", boxShadow: reparseLoading ? "none" : "var(--sh)",
              display:"flex", alignItems:"center", gap:6, flexShrink:0, marginLeft:12 }}>
            {reparseLoading
              ? <><div style={{ width:12, height:12, border:"2px solid rgba(0,0,0,.2)", borderTopColor:"var(--ink)", borderRadius:"50%", animation:"spin .7s linear infinite" }} /> Genanalyserer…</>
              : "Kør nu"}
          </button>
        </div>

        {reparseLoading && (
          <div style={UI.udflex_aicenter_g10_p12px14px_bgsurface_bd1pxsolid_br12_mb12}>
            <div style={{ width:16, height:16, border:"2px solid var(--border2)", borderTopColor:"var(--green)", borderRadius:"50%", animation:"spin .7s linear infinite", flexShrink:0 }} />
            <div style={UI.muted13}>Genanalyserer allergeninformation…</div>
          </div>
        )}

        {reparseLog && !reparseLoading && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:10 }}>
            {[
              { icon:"check",       label:"Genanalyseret", value: reparseLog.reparsed, color:"var(--green)" },
              { icon:"chevronRight", label:"Sprunget over", value: reparseLog.skipped,  color:"var(--muted)" },
              { icon:"x",           label:"Fejl",          value: reparseLog.errors,  color:"var(--amber)" },
            ].map(s => (
              <div key={s.label} style={{ padding:"10px 12px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, textAlign:"center", boxShadow:"var(--sh)" }}>
                <div style={{ fontSize:20, fontWeight:900, color:s.color, marginBottom:2 }}>{s.value ?? 0}</div>
                <div style={{ ...UI.muted10, display:"flex", alignItems:"center", justifyContent:"center", gap:3 }}><Icon name={s.icon} size={9} color="var(--muted)" /> {s.label}</div>
              </div>
            ))}
          </div>
        )}

        {reparseLog?.error && (
          <div style={{ padding:"10px 14px", background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.2)", borderRadius:10, fontSize:12, color:"var(--red)" }}>
            Fejl: {reparseLog.error}
          </div>
        )}

        <TechDetails rows={[
          ["Jobnavn", "allergen-reparse"],
          ["Motor", "nøgleordsmatch + Claude Haiku på de svære tilfælde"],
          ["Antal pr. kørsel", "100 produkter"],
          ["Planlagt kørsel", "03:00 UTC (05:00 dansk sommertid)"],
          ...(reparseLog && !reparseLog.error ? [["Seneste manuelle kørsel", `${reparseLog.reparsed ?? 0} genanalyseret, ${reparseLog.skipped ?? 0} sprunget over, ${reparseLog.errors ?? 0} fejl`]] : []),
        ]} />
      </div>
    </div>
  );
}
