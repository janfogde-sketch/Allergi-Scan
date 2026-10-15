// @ts-nocheck
// Fælles opdateringsknap til admin: kun ikonet (refresh), med skærmlæsertekst og hjælpetekst. Under indlæsning roterer ikonet, og knappen er slået fra.
import React from "react";
import { Icon } from "../SharedComponents.jsx";

export default function RefreshButton({ onClick, loading = false, label = "Opdatér listen", style }) {
  return (
    <button type="button" className={`admin-icon-btn${loading ? " spinning" : ""}`} aria-label={label} title={label} aria-busy={loading} disabled={loading} style={style} onClick={onClick}>
      <Icon name="refresh" size={18} />
    </button>
  );
}
