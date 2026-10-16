// @ts-nocheck
// "Flere handlinger": sekundære handlinger (eksport, opdatér) samlet i én menu, så de ikke fylder i hovedindholdet.
// Menuen vises i et lag over siden (portal) med fast placering ud fra knappen, holdes helt inden for skærmen (vandret og lodret), kan lukkes ved tryk udenfor og klippes ikke af overliggende containere.
import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import ReactDOM from "react-dom";
import { Icon } from "../SharedComponents.jsx";

const GAP = 12; // afstand til skærmkanten
const WIDTH = 260;

/** Placering: højrejusteret til knappen, men aldrig uden for skærmen; vendes opad, hvis der ikke er plads nedenunder. */
export function menuPosition(rect, vw, vh, menuH) {
  const width = Math.min(WIDTH, vw - GAP * 2);
  const left = Math.max(GAP, Math.min(rect.right - width, vw - width - GAP));
  const below = rect.bottom + 6;
  const top = below + menuH > vh - GAP && rect.top - 6 - menuH >= GAP ? rect.top - 6 - menuH : Math.max(GAP, Math.min(below, vh - GAP - menuH));
  return { left, top, width };
}

/** items: [{ label, onClick, disabled?, hint?, icon?, danger? }]. compact: kun tre prikker (til smalle headere). */
export default function ActionsMenu({ items, label = "Flere handlinger", compact = false }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const place = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos(menuPosition(r, window.innerWidth, window.innerHeight, menuRef.current?.offsetHeight || 160));
  };
  useLayoutEffect(() => { if (open) place(); /* eslint-disable-next-line react-hooks/exhaustive-deps -- placeres, når menuen åbnes */ }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!btnRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    const onMove = () => place();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); window.removeEventListener("resize", onMove); window.removeEventListener("scroll", onMove, true); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- place læser kun refs
  }, [open]);
  const visible = (items || []).filter(Boolean);
  if (visible.length === 0) return null;
  return (
    <div className="admin-menu-wrap">
      <button ref={btnRef} type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" aria-haspopup="menu" aria-expanded={open} aria-label={compact ? label : undefined} title={compact ? label : undefined} onClick={() => setOpen(o => !o)}>
        {compact ? <Icon name="more" size={18} /> : <>{label} <span aria-hidden="true">▾</span></>}
      </button>
      {open && ReactDOM.createPortal(
        <div ref={menuRef} role="menu" className="admin-menu admin-menu-fixed" style={pos ? { left: pos.left, top: pos.top, width: pos.width } : { visibility: "hidden" }}>
          {visible.map((it) => (
            <button key={it.label} type="button" role="menuitem" className={`admin-menu-item${it.icon ? " has-icon" : ""}`} disabled={it.disabled} style={it.danger ? { color: "var(--red)" } : undefined}
              onClick={() => { setOpen(false); it.onClick(); }}>
              {it.icon && <Icon name={it.icon} size={16} color={it.danger ? "var(--red)" : "var(--ink2)"} />}{it.label}{it.hint ? <span className="admin-menu-hint">{it.hint}</span> : null}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
