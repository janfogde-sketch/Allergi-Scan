// @ts-nocheck
// Søjlediagram over forbruget pr. dag. Samme interaktion som diagrammerne på Dashboard (tryk eller træk viser en tooltip, piletaster flytter),
// men med tre dagstilstande: forbrug (grøn), registreret nulforbrug (tynd grå) og før registreringen begyndte (stiplet, "ikke registreret"). Usædvanlige dage er gule.
import React, { useState, useEffect, useRef } from "react";
import { axisScale, labelIndexes } from "../statsLogic.js";
import { dayLabelShort, dayLabelLong } from "../aiUsageLogic.js";

const PLOT_H = 64, TIP_W = 104, TIP_H = 34; // skal passe til .dash-plot og .dash-tip i adminTheme.js

export default function AiUsageChart({ data, format, axisFormat = format, narrow, label }) {
  const [picked, setPicked] = useState(null);
  const plotRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!picked) return undefined;
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setPicked(null); };
    const onKey = (e) => { if (e.key === "Escape") setPicked(null); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [picked]);

  const max = Math.max(0, ...data.map((d) => d.value));
  const { top, ticks } = axisScale(max);
  const idx = picked ? data.findIndex((d) => d.day === picked) : -1;
  const sel = idx >= 0 ? data[idx] : null;
  const labels = new Set(labelIndexes(data.length, narrow ? 3 : 5));
  const gap = data.length > 20 ? 1 : 2;
  const stateText = (d) => (d.state === "none" ? "Ikke registreret" : d.state === "zero" ? "Intet forbrug" : format(d.value));

  const pickAt = (e) => {
    const el = plotRef.current;
    if (!el || !data.length) return;
    const r = el.getBoundingClientRect();
    const i = Math.min(data.length - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * data.length)));
    setPicked(data[i].day);
  };
  let tipStyle = null;
  if (sel) {
    const h = sel.value > 0 ? Math.max(6, (sel.value / top) * 100) : 3;
    const barTop = PLOT_H * (1 - h / 100);
    const cx = ((idx + 0.5) / data.length) * 100;
    tipStyle = barTop >= TIP_H + 4
      ? { top: Math.round(barTop - TIP_H - 3), left: `clamp(0px, calc(${cx.toFixed(3)}% - ${TIP_W / 2}px), calc(100% - ${TIP_W}px))` }
      : idx < data.length / 2
        ? { top: 0, left: `calc(${(((idx + 1) / data.length) * 100).toFixed(3)}% + 6px)` }
        : { top: 0, right: `calc(${(((data.length - idx) / data.length) * 100).toFixed(3)}% + 6px)` };
  }
  const onKeyDown = (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const btns = [...plotRef.current.querySelectorAll("button")];
    const cur = btns.indexOf(document.activeElement);
    const next = Math.min(btns.length - 1, Math.max(0, (cur < 0 ? (idx >= 0 ? idx : 0) : cur) + (e.key === "ArrowRight" ? 1 : -1)));
    e.preventDefault();
    btns[next].focus();
    setPicked(data[next].day);
  };

  return (
    <figure style={{ margin: 0 }} ref={wrapRef}>
      <div style={{ display: "flex", gap: 4 }}>
        <div className="admin-axis" aria-hidden="true">
          {ticks.map((t) => <span key={t}>{axisFormat(t)}</span>)}
        </div>
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
          {sel && (
            <div className="dash-tip" role="status" style={tipStyle}>
              <b>{dayLabelShort(sel.day)}</b>
              <span>{stateText(sel)}</span>
            </div>
          )}
          <div ref={plotRef} className="dash-plot" style={{ gap }} role="group" aria-label={label}
            onPointerDown={pickAt} onPointerMove={(e) => { if (e.buttons) pickAt(e); }} onKeyDown={onKeyDown}>
            {data.map((d) => (
              <button key={d.day} type="button" className={`admin-bar${picked === d.day ? " sel" : ""}`} aria-pressed={picked === d.day}
                aria-label={`${dayLabelLong(d.day)}: ${stateText(d)}${d.flagged ? ", usædvanligt højt" : ""}`}
                onClick={(e) => { if (e.detail === 0) setPicked(d.day); }}>
                <span style={{ display: "block", width: "100%", borderRadius: "3px 3px 0 0", height: `${d.value > 0 ? Math.max(6, (d.value / top) * 100) : 3}%`,
                  background: d.state === "data" && d.value > 0 ? (d.flagged ? "var(--amber)" : "var(--green)") : "var(--border2)",
                  opacity: d.state === "none" ? 0.45 : 1 }} />
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap, height: 16, marginTop: 4 }} aria-hidden="true">
            {data.map((d, i) => (
              <div key={d.day} style={{ flex: 1, minWidth: 2, position: "relative" }}>
                {labels.has(i) && (
                  <span style={{ position: "absolute", top: 0, whiteSpace: "nowrap", fontSize: 10.5, color: "var(--muted)",
                    ...(i === 0 ? { left: 0 } : i === data.length - 1 ? { right: 0 } : { left: "50%", transform: "translateX(-50%)" }) }}>{dayLabelShort(d.day)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}
