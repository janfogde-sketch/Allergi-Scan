// @ts-nocheck
// Stor visning af et eller flere billeder (indsendelsens fotos, ticketens skærmbilleder): fylder skærmen, kan zoomes med knapper og med to fingre,
// panoreres ved at trække, og lukkes med krydset. Flere billeder: forrige/næste uden at lukke visningen. Samme modalramme som de andre vinduer,
// så baggrunden låses af modalGuard.
import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import CloseX from "./CloseX.jsx";

const STEPS = [1, 1.5, 2, 3, 4];

/** `images`: [{ src, title }] (flere billeder) eller `src`/`title` (ét billede). `start`: billedet der vises først. */
export default function ImageViewer({ src, title, images, start = 0, onClose }) {
  const list = images && images.length ? images : [{ src, title }];
  const [n, setN] = useState(Math.min(Math.max(0, start), list.length - 1));
  const [i, setI] = useState(0);
  const stage = useRef(null);
  const drag = useRef(null);
  const zoom = STEPS[i];
  const cur = list[n];
  const go = (d) => { setN((v) => Math.min(list.length - 1, Math.max(0, v + d))); setI(0); };
  useEffect(() => { if (stage.current) { stage.current.scrollLeft = 0; stage.current.scrollTop = 0; } }, [n]);
  // Panorering med mus/pen; fingre panorerer selv via native scroll i scene-området.
  const down = (e) => { if (e.pointerType === "touch" || !stage.current) return; drag.current = { x: e.clientX, y: e.clientY, l: stage.current.scrollLeft, t: stage.current.scrollTop }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ingen */ } };
  const move = (e) => { const d = drag.current; if (!d) return; stage.current.scrollLeft = d.l - (e.clientX - d.x); stage.current.scrollTop = d.t - (e.clientY - d.y); };
  const up = () => { drag.current = null; };
  return ReactDOM.createPortal(
    <div className="admin-modal-overlay" style={{ zIndex: 120 }} onClick={onClose}>
      <div className="admin-modal todo-panel iv-panel" role="dialog" aria-modal="true" aria-label={cur.title} onClick={(e) => e.stopPropagation()}>
        <div className="todo-panel-head">
          <div style={{ minWidth: 0 }}><div className="audit-sheet-title">{cur.title}{list.length > 1 ? ` (${n + 1} af ${list.length})` : ""}</div></div>
          <CloseX onClick={onClose} />
        </div>
        <div className="iv-stage" ref={stage} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} style={{ cursor: zoom > 1 ? "grab" : "default" }}>
          <img src={cur.src} alt={cur.title} draggable={false} style={{ width: `${zoom * 100}%`, maxWidth: "none", height: "auto", display: "block", touchAction: "pan-x pan-y pinch-zoom" }} />
        </div>
        <div className="iv-bar">
          {list.length > 1 && <button type="button" className="admin-btn admin-btn-ghost admin-touch" aria-label="Forrige billede" disabled={n === 0} onClick={() => go(-1)}>‹</button>}
          <button type="button" className="admin-btn admin-btn-ghost admin-touch" aria-label="Zoom ud" disabled={i === 0} onClick={() => setI((v) => Math.max(0, v - 1))}>−</button>
          <span className="iv-level" aria-live="polite">{Math.round(zoom * 100)} %</span>
          <button type="button" className="admin-btn admin-btn-ghost admin-touch" aria-label="Zoom ind" disabled={i === STEPS.length - 1} onClick={() => setI((v) => Math.min(STEPS.length - 1, v + 1))}>+</button>
          {list.length > 1 && <button type="button" className="admin-btn admin-btn-ghost admin-touch" aria-label="Næste billede" disabled={n === list.length - 1} onClick={() => go(1)}>›</button>}
        </div>
      </div>
    </div>,
    document.body
  );
}
