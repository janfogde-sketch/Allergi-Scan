// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// AllergenPrefsContext.jsx
//
// Deler E-nummer-søgning/valg og allergen-undertyper (laktose vs. mælkeprotein
// osv.) med de skærme der bruger dem (Onboarding, Profil).
//
// Brug: const { selectedENumbers, setSelectedENumbers } = useAllergenPrefsContext();
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext } from "react";

const AllergenPrefsContext = createContext(null);

export function AllergenPrefsProvider({ value, children }) {
  return <AllergenPrefsContext.Provider value={value}>{children}</AllergenPrefsContext.Provider>;
}

export function useAllergenPrefsContext() {
  const ctx = useContext(AllergenPrefsContext);
  if (!ctx) throw new Error("useAllergenPrefsContext skal bruges inden i <AllergenPrefsProvider>");
  return ctx;
}
