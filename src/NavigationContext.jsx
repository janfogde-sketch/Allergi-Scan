// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// NavigationContext.jsx
//
// Deler screen/setScreen (den grundlæggende sidenavigation) med alle skærme
// uden at skulle sendes som props gennem hvert lag.
//
// Brug: const { screen, setScreen } = useNavigationContext();
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext } from "react";

const NavigationContext = createContext(null);

export function NavigationProvider({ value, children }) {
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigationContext() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigationContext skal bruges inden i <NavigationProvider>");
  return ctx;
}
