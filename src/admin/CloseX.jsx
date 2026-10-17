// @ts-nocheck
// Fælles luk-knap til modaler og detaljevisninger i admin: appens egen CloseButton (rund, neutral kant, X), 44 × 44 px, øverst til højre i overskriften, tilgængelighedsnavn "Luk".
// Brug den i stedet for en tekstknap, når "Luk" blot er navigation. `inline`: uden negativ margen (fx i en søgebjælke).
import React from "react";
import { CloseButton } from "../Sheets.jsx";

export default function CloseX({ onClick, disabled = false, label = "Luk", inline = false }) {
  return <CloseButton onClick={onClick} disabled={disabled} label={label} className={inline ? "" : "audit-sheet-close"} />;
}
