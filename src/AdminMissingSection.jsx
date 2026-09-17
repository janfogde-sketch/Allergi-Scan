// @ts-nocheck
import React from "react";
import { Loader, Icon } from "./SharedComponents.jsx";
import { UI } from "./styleUtils.js";

export default function AdminMissingSection({
  missingEans, missingEansLoading, loadMissingEans, deleteMissingEan,
}) {
  // Udtræk brand fra EAN-præfiks (GS1 landekoder er vejledende — vi bruger bare som grupperingshjælp)
  // I stedet aggregerer vi på EAN-præfiks (første 4 cifre) som proxy for brand
  const missingEanTopPrefixes = (() => {
    const prefixMap = {};
    missingEans.forEach(row => {
      const prefix = row.ean?.slice(0, 4) || "????";
      if (!prefixMap[prefix]) prefixMap[prefix] = { count: 0, scans: 0, eans: [] };
      prefixMap[prefix].count++;
      prefixMap[prefix].scans += (row.count || 1);
      prefixMap[prefix].eans.push(row.ean);
    });
    return Object.entries(prefixMap)
      .sort(([,a],[,b]) => b.scans - a.scans)
      .slice(0, 5);
  })();
  const missingEansTotalScans = missingEans.reduce((s,r) => s+(r.count||1), 0);

  return (
    <div>
      <div style={UI.rowBetweenMb16}>
        <div style={{ ...UI.ufs17_fw800_cink, display:"flex", alignItems:"center", gap:8 }}><Icon name="info" size={16} color="var(--ink)" /> Efterspurgte manglende produkter</div>
        <button onClick={loadMissingEans} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:700, color:"var(--muted)", fontFamily:"var(--f)", cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
          <Icon name="refresh" size={12} color="var(--muted)" /> Opdater
        </button>
      </div>
      <div style={UI.ufs12_cmuted_mb16_lh15}>
        Produkter som brugere har forsøgt at scanne men ikke fundet i databasen. Sorteret efter antal opslag.
      </div>

      {/* Brand-aggregering */}
      {missingEans.length > 0 && (
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"14px 16px", marginBottom:16, boxShadow:"var(--sh)" }}>
          <div style={{ fontSize:12, fontWeight:800, color:"var(--ink)", marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
            <Icon name="chart" size={12} color="var(--ink)" /> Top EAN-præfikser <span style={{ fontSize:10, fontWeight:400, color:"var(--muted)" }}>(proxy for brand/producent)</span>
          </div>
          <div style={UI.udflex_fdcolumn_g6}>
            {missingEanTopPrefixes.map(([prefix, data]) => (
              <div key={prefix} style={UI.udflex_aicenter_g10}>
                <div style={{ fontFamily:"monospace", fontSize:12, fontWeight:700, color:"var(--ink)", width:48 }}>{prefix}…</div>
                <div style={{ flex:1, height:6, background:"var(--border2)", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:3, background:"var(--green)", width:`${Math.round((data.scans / missingEansTotalScans) * 100)}%` }} />
                </div>
                <div style={{ fontSize:11, color:"var(--muted)", whiteSpace:"nowrap" }}>
                  {data.count} produkt{data.count!==1?"er":""} · {data.scans} opslag
                </div>
                <button
                  onClick={() => navigator.clipboard?.writeText(data.eans.join("\n"))}
                  style={{ fontSize:10, color:"var(--muted)", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--f)", padding:"2px 6px" }}
                  title="Kopiér alle EAN'er med dette præfiks">
                  <Icon name="link" size={12} color="var(--muted)" />
                </button>
              </div>
            ))}
          </div>
          <div style={{ fontSize:10, color:"var(--muted)", marginTop:10 }}>
            Brug præfikset til at identificere producenten på <a href="https://www.gs1.dk" target="_blank" rel="noopener noreferrer" style={UI.ucgreen}>gs1.dk</a>
          </div>
        </div>
      )}
      {missingEansLoading ? (
        <Loader text="Indlæser…" />
      ) : missingEans.length === 0 ? (
        <div style={{ textAlign:"center", padding:"40px 0", color:"var(--muted)" }}>Ingen manglende EAN'er endnu</div>
      ) : (
        <div style={UI.colGap8}>
          {missingEans.map((row, i) => (
            <div key={row.ean} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:12, boxShadow:"var(--sh)" }}>
              {/* Rang */}
              <div style={{ fontSize:13, fontWeight:800, color:"var(--muted)", width:24, textAlign:"right", flexShrink:0 }}>#{i+1}</div>
              {/* EAN + meta */}
              <div style={UI.flexMin}>
                <div style={{ fontSize:14, fontWeight:700, color:"var(--ink)", fontFamily:"monospace" }}>{row.ean}</div>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:3, flexWrap:"wrap" }}>
                  <span style={{ fontSize:11, fontWeight:700, color:"var(--red)", background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:100, padding:"1px 8px" }}>
                    {row.count}× søgt
                  </span>
                  <span style={UI.muted11}>
                    første {new Date(row.first_seen).toLocaleDateString("da-DK")} · sidst {new Date(row.last_seen).toLocaleDateString("da-DK")}
                  </span>
                </div>
              </div>
              {/* Handlinger */}
              <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                <button
                  onClick={() => window.open(`https://world.openfoodfacts.org/product/${row.ean}`, "_blank")}
                  style={{ background:"var(--blue-lt)", border:"1px solid var(--blue-md)", borderRadius:8, padding:"6px 10px", fontSize:11, fontWeight:700, color:"var(--blue)", fontFamily:"var(--f)", cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}
                  title="Søg på Open Food Facts">
                  <Icon name="search" size={11} color="var(--blue)" /> OFF
                </button>
                <button
                  onClick={() => navigator.clipboard?.writeText(row.ean)}
                  style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, padding:"6px 10px", fontSize:11, fontWeight:700, color:"var(--muted)", fontFamily:"var(--f)", cursor:"pointer", display:"flex", alignItems:"center" }}
                  title="Kopiér EAN" aria-label="Kopiér EAN">
                  <Icon name="link" size={12} color="var(--muted)" />
                </button>
                <button
                  onClick={() => deleteMissingEan(row.ean)}
                  style={{ background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:8, padding:"6px 10px", fontSize:11, fontWeight:700, color:"var(--red)", fontFamily:"var(--f)", cursor:"pointer" }}
                  title="Slet fra liste" aria-label="Slet fra liste">
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
