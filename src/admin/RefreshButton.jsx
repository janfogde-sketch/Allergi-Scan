// @ts-nocheck
// Fælles opdateringsknap til admin: kun ikonet (refresh), med skærmlæsertekst og hjælpetekst. Bruges i stedet for en "Opdater"-tekstknap.
import React from "react";
import { Icon } from "../SharedComponents.jsx";

export default function RefreshButton({ onClick, loading = false, label = "Opdatér listen", style }) {
  return (
    <button type="button" className="admin-icon-btn" aria-label={label} title={label} aria-busy={loading} disabled={loading} style={style} onClick={onClick}>
      {loading ? <div className="admin-spinner" /> : <Icon name="refresh" size={18} />}
    </button>
  );
}
