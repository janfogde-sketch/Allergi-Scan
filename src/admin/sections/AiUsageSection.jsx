// @ts-nocheck
import React, { useState } from "react";
import {
  HAIKU_USD_PER_M_INPUT, HAIKU_USD_PER_M_OUTPUT, USD_TO_DKK, FUNCTION_LABELS,
  totals, byDay, byMonth, byFunction, currentMonthRows, formatKr, formatNum,
} from "../aiUsageLogic.js";

const MONTHS = ["januar", "februar", "marts", "april", "maj", "juni", "juli", "august", "september", "oktober", "november", "december"];
const monthLabel = (k) => `${MONTHS[Number(k.slice(5, 7)) - 1]} ${k.slice(0, 4)}`;
const dayLabel = (k) => new Date(k + "T12:00:00").toLocaleDateString("da-DK", { weekday: "short", day: "numeric", month: "short" });

function UsageTable({ title, firstCol, items, labelFn }) {
  return (
    <div className="admin-table-wrap" style={{ marginBottom: 20 }}>
      <div style={{ padding: "12px 14px", fontWeight: 800 }}>{title}</div>
      <table className="admin-table">
        <thead><tr><th>{firstCol}</th><th>Kald</th><th>Tokens ind</th><th>Tokens ud</th><th>Pris</th></tr></thead>
        <tbody>
          {items.map(i => (
            <tr key={i.key}>
              <td>{labelFn(i.key)}</td><td>{formatNum(i.calls)}</td><td>{formatNum(i.input)}</td><td>{formatNum(i.output)}</td><td>{formatKr(i.dkk)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AiUsageSection({ rows, loading, load }) {
  const [now] = useState(() => Date.now());
  const today = new Date(now).toISOString().slice(0, 10);
  const month = totals(currentMonthRows(rows, today));
  const todayTotals = totals(rows.filter(r => r.day === today));
  const last30 = totals(rows.filter(r => r.day >= new Date(now - 29 * 864e5).toISOString().slice(0, 10)));

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 12 }}>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          Forbrug på Claude Haiku (læsning af fotos, allergen-tjek, kategorisering). Kun samlede tal, ingen data pr. bruger.
        </div>
        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={load}>Opdater</button>
      </div>

      {loading ? (
        <div className="admin-loading-row"><div className="admin-spinner" /> Henter…</div>
      ) : rows.length === 0 ? (
        <div className="admin-table-empty">Ingen kald registreret endnu. Optællingen begynder med det første kald efter udgivelsen.</div>
      ) : (
        <>
          <div className="admin-stat-grid">
            <div className="admin-stat-card"><div className="admin-stat-num">{formatKr(month.dkk)}</div><div className="admin-stat-label">Denne måned ({formatNum(month.calls)} kald)</div></div>
            <div className="admin-stat-card"><div className="admin-stat-num">{formatKr(last30.dkk)}</div><div className="admin-stat-label">Seneste 30 dage ({formatNum(last30.calls)} kald)</div></div>
            <div className="admin-stat-card"><div className="admin-stat-num">{formatKr(todayTotals.dkk)}</div><div className="admin-stat-label">I dag ({formatNum(todayTotals.calls)} kald)</div></div>
          </div>
          <UsageTable title="Pr. måned" firstCol="Måned" items={byMonth(rows)} labelFn={monthLabel} />
          <UsageTable title="Denne måned pr. funktion" firstCol="Funktion" items={byFunction(currentMonthRows(rows, today))} labelFn={(k) => FUNCTION_LABELS[k] || k} />
          <UsageTable title="Seneste 30 dage pr. dag" firstCol="Dag" items={byDay(rows).slice(0, 30)} labelFn={dayLabel} />
        </>
      )}
      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
        Pris regnet ud fra {HAIKU_USD_PER_M_INPUT} dollar pr. million tokens ind og {HAIKU_USD_PER_M_OUTPUT} dollar ud, kurs {USD_TO_DKK} kr. pr. dollar. Det er et skøn; Anthropics egen konsol har det endelige beløb. Dage følger dansk tid.
      </div>
    </>
  );
}
