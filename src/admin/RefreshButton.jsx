// @ts-nocheck
// Fælles opdateringsknap til admin: kun ikonet (refresh) i appens runde ikonknap, med skærmlæsertekst og hjælpetekst. Under indlæsning roterer ikonet, og knappen er slået fra.
import React from "react";
import { RefreshIconButton } from "../IconButton.jsx";

export default function RefreshButton({ onClick, loading = false, label = "Opdater siden", style }) {
  return <RefreshIconButton onClick={onClick} loading={loading} label={label} style={style} />;
}
