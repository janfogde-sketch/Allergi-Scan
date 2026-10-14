// @ts-nocheck
// "Flere handlinger": sekundære handlinger (eksport, opdatér) samlet i én menu, så de ikke fylder i hovedindholdet.
import React, { useState, useRef, useEffect } from "react";
import { Icon } from "../SharedComponents.jsx";

/** items: [{ label, onClick, disabled?, hint?, icon?, danger? }]. compact: kun tre prikker (til smalle headere). */
export default function ActionsMenu({ items, label = "Flere handlinger", compact = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const visible = (items || []).filter(Boolean);
  if (visible.length === 0) return null;
  return (
    <div ref={ref} className="admin-menu-wrap">
      <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" aria-haspopup="menu" aria-expanded={open} aria-label={compact ? label : undefined} title={compact ? label : undefined} onClick={() => setOpen(o => !o)}>
        {compact ? <Icon name="more" size={18} /> : <>{label} <span aria-hidden="true">▾</span></>}
      </button>
      {open && (
        <div role="menu" className="admin-menu">
          {visible.map((it) => (
            <button key={it.label} type="button" role="menuitem" className={`admin-menu-item${it.icon ? " has-icon" : ""}`} disabled={it.disabled} style={it.danger ? { color: "var(--red)" } : undefined}
              onClick={() => { setOpen(false); it.onClick(); }}>
              {it.icon && <Icon name={it.icon} size={16} color={it.danger ? "var(--red)" : "var(--ink2)"} />}{it.label}{it.hint ? <span className="admin-menu-hint">{it.hint}</span> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
