// @ts-nocheck
// Fælles luk-knap til modaler og detaljevisninger i admin: diskret kryds (mørkegråt), 44 × 44 px, øverst til højre i overskriften, tilgængelighedsnavn "Luk".
// Brug den i stedet for en tekstknap, når "Luk" blot er navigation. `inline`: uden negativ margen (fx i en søgebjælke).
import React from "react";
import { Icon } from "../SharedComponents.jsx";

export default function CloseX({ onClick, disabled = false, label = "Luk", inline = false }) {
  return (
    <button type="button" className={`admin-iconbtn${inline ? "" : " audit-sheet-close"}`} onClick={onClick} disabled={disabled} aria-label={label}>
      <Icon name="x" size={20} color="var(--ink2)" />
    </button>
  );
}
