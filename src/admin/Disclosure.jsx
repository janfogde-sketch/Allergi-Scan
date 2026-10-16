// @ts-nocheck
// Lille foldesektion til admin (accordion): lukket som standard, hele overskriften er en knap, og indholdet vises først ved åbning.
import React, { useState, useId } from "react";
import { Icon } from "../SharedComponents.jsx";

export default function Disclosure({ title, meta, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="admin-disclosure">
      <button type="button" className="admin-disclosure-head" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
        <span style={{ flex: 1, minWidth: 0 }}>{title}</span>
        {meta && <span className="admin-disclosure-meta">{meta}</span>}
        <span className={`admin-disclosure-chev${open ? " open" : ""}`} aria-hidden="true"><Icon name="chevronDown" size={14} color="var(--muted)" /></span>
      </button>
      {open && <div id={id} className="admin-disclosure-body">{children}</div>}
    </div>
  );
}
