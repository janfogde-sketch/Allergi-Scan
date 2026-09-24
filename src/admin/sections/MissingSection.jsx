// @ts-nocheck
import React, { useEffect } from "react";

export default function MissingSection({ missingEans, missingEansLoading, loadMissingEans, deleteMissingEan }) {
  useEffect(() => { if (missingEans.length === 0) loadMissingEans(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalScans = missingEans.reduce((s, r) => s + (r.count || 1), 0);
  const topPrefixes = (() => {
    const map = {};
    missingEans.forEach(row => {
      const prefix = row.ean?.slice(0, 4) || "????";
      if (!map[prefix]) map[prefix] = { count: 0, scans: 0, eans: [] };
      map[prefix].count++; map[prefix].scans += (row.count || 1); map[prefix].eans.push(row.ean);
    });
    return Object.entries(map).sort(([, a], [, b]) => b.scans - a.scans).slice(0, 5);
  })();

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>Produkter brugere har forsøgt at scanne, men ikke fundet — sorteret efter antal opslag.</div>
        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={loadMissingEans}>Opdater</button>
      </div>

      {topPrefixes.length > 0 && (
        <div className="admin-card">
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 10 }}>Top EAN-præfikser <span style={{ fontWeight: 400, color: "var(--muted)" }}>(proxy for producent)</span></div>
          {topPrefixes.map(([prefix, data]) => (
            <div key={prefix} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, width: 52 }}>{prefix}…</div>
              <div style={{ flex: 1, height: 6, background: "var(--border2)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", background: "var(--green)", width: `${Math.round((data.scans / totalScans) * 100)}%` }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>{data.count} produkt{data.count !== 1 ? "er" : ""} · {data.scans} opslag</div>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => navigator.clipboard?.writeText(data.eans.join("\n"))}>Kopiér</button>
            </div>
          ))}
        </div>
      )}

      <div className="admin-table-wrap">
        {missingEansLoading ? (
          <div className="admin-loading-row"><div className="admin-spinner" /> Henter…</div>
        ) : missingEans.length === 0 ? (
          <div className="admin-table-empty">Ingen manglende EAN'er endnu</div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>#</th><th>EAN</th><th>Antal opslag</th><th>Først set</th><th>Sidst set</th><th></th></tr></thead>
            <tbody>
              {missingEans.map((row, i) => (
                <tr key={row.ean}>
                  <td>{i + 1}</td>
                  <td style={{ fontFamily: "var(--mono)" }}>{row.ean}</td>
                  <td><span className="admin-pill admin-pill-red">{row.count}×</span></td>
                  <td>{new Date(row.first_seen).toLocaleDateString("da-DK")}</td>
                  <td>{new Date(row.last_seen).toLocaleDateString("da-DK")}</td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => window.open(`https://world.openfoodfacts.org/product/${row.ean}`, "_blank")}>OFF</button>
                    <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => deleteMissingEan(row.ean)}>Slet</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
