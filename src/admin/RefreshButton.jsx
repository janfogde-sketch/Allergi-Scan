// @ts-nocheck
// Fælles opdateringsknap til admin: kun ikonet (refresh), med skærmlæsertekst og hjælpetekst. Under indlæsning roterer ikonet, og knappen er slået fra.
// variant "header": samme udseende som de øvrige ikoner i topbaren (hamburger, søg), uden ramme.
import React from "react";
import { Icon } from "../SharedComponents.jsx";

export default function RefreshButton({ onClick, loading = false, label = "Opdater siden", variant = "bordered", style }) {
  const cls = variant === "header" ? "admin-iconbtn" : "admin-icon-btn";
  return (
    <button type="button" className={`${cls}${loading ? " spinning" : ""}`} aria-label={label} title={label} aria-busy={loading} disabled={loading} style={style} onClick={onClick}>
      <Icon name="refresh" size={variant === "header" ? 20 : 18} color={variant === "header" ? "var(--ink2)" : "currentColor"} />
    </button>
  );
}
