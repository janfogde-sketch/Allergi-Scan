// @ts-nocheck
import React from "react";

export default function ImportSection({ importLog, importLoading, runImport, reparseLog, reparseLoading, runReparse }) {
  return (
    <>
      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>OFF auto-import</div>
          <button className="admin-btn admin-btn-primary" disabled={importLoading} onClick={runImport}>
            {importLoading ? "Importerer…" : "Kør import nu"}
          </button>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14 }}>
          Henter top-50 manglende EAN'er fra <code>missing_ean_log</code>, slår op på Open Food Facts og importerer automatisk. Kører også hver nat kl. 02:00 UTC.
        </div>

        {importLoading && <div className="admin-loading-row"><div className="admin-spinner" /> Importerer fra Open Food Facts…</div>}

        {importLog?.stats && !importLoading && (
          <div className="admin-stat-grid" style={{ marginBottom: 14 }}>
            {[
              { label: "Importeret", value: importLog.stats.imported },
              { label: "Fundet på OFF", value: importLog.stats.found ?? (importLog.stats.imported + importLog.stats.not_on_off) },
              { label: "Ikke på OFF", value: importLog.stats.not_on_off },
              { label: "Fejl", value: importLog.stats.error },
            ].map(s => (
              <div key={s.label} className="admin-stat-card">
                <div className="admin-stat-num">{s.value ?? 0}</div>
                <div className="admin-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {importLog?.log?.length > 0 && !importLoading && (
          <div className="admin-table-wrap">
            <div style={{ padding: "8px 14px", fontSize: 12, fontWeight: 800, borderBottom: "1px solid var(--border)" }}>Importeret ({importLog.log.length})</div>
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              {importLog.log.map((line, i) => (
                <div key={i} style={{ padding: "6px 14px", fontSize: 12, fontFamily: "var(--mono)", borderBottom: "1px solid var(--border)" }}>{line}</div>
              ))}
            </div>
          </div>
        )}

        {!importLog && !importLoading && <div style={{ color: "var(--muted)", fontSize: 13 }}>Klar til import.</div>}
      </div>

      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>Allergen reparsing</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>Kører allergen-engine (keyword + Claude Haiku) på produkter med lav kvalitet. Kører automatisk hver nat kl. 03:00 UTC.</div>
          </div>
          <button className="admin-btn admin-btn-primary" disabled={reparseLoading} onClick={() => runReparse(true)}>
            {reparseLoading ? "Reparserer…" : "Kør nu"}
          </button>
        </div>

        {reparseLoading && <div className="admin-loading-row"><div className="admin-spinner" /> Reparserer allergen-flags…</div>}

        {reparseLog && !reparseLoading && !reparseLog.error && (
          <div className="admin-stat-grid">
            {[
              { label: "Reparseret", value: reparseLog.reparsed },
              { label: "Sprunget over", value: reparseLog.skipped },
              { label: "Fejl", value: reparseLog.errors },
            ].map(s => (
              <div key={s.label} className="admin-stat-card">
                <div className="admin-stat-num">{s.value ?? 0}</div>
                <div className="admin-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        )}
        {reparseLog?.error && <div className="admin-error">{reparseLog.error}</div>}
      </div>
    </>
  );
}
