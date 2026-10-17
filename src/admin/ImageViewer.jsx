// @ts-nocheck
// Stor visning af et billede (indsendelsens fotos): fylder skærmen, kan zoomes med knapper og med to fingre, og lukkes med krydset.
// Samme modalramme som de andre vinduer, så baggrunden låses af modalGuard.
import React, { useState } from "react";
import ReactDOM from "react-dom";
import CloseX from "./CloseX.jsx";

const STEPS = [1, 1.5, 2, 3, 4];

export default function ImageViewer({ src, title, onClose }) {
  const [i, setI] = useState(0);
  const zoom = STEPS[i];
  return ReactDOM.createPortal(
    <div className="admin-modal-overlay" style={{ zIndex: 120 }} onClick={onClose}>
      <div className="admin-modal todo-panel iv-panel" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="todo-panel-head">
          <div style={{ minWidth: 0 }}><div className="audit-sheet-title">{title}</div></div>
          <CloseX onClick={onClose} />
        </div>
        <div className="iv-stage">
          <img src={src} alt={title} style={{ width: `${zoom * 100}%`, maxWidth: "none", height: "auto", display: "block", touchAction: "pan-x pan-y pinch-zoom" }} />
        </div>
        <div className="iv-bar">
          <button type="button" className="admin-btn admin-btn-ghost admin-touch" aria-label="Zoom ud" disabled={i === 0} onClick={() => setI((v) => Math.max(0, v - 1))}>−</button>
          <span className="iv-level" aria-live="polite">{Math.round(zoom * 100)} %</span>
          <button type="button" className="admin-btn admin-btn-ghost admin-touch" aria-label="Zoom ind" disabled={i === STEPS.length - 1} onClick={() => setI((v) => Math.min(STEPS.length - 1, v + 1))}>+</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
