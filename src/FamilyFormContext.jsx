// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// FamilyFormContext.jsx
//
// Deler "tilføj familiemedlem"-formularens felter og addMember/removeMember
// med de skærme der bruger den (Onboarding, Profil), uden at skulle sendes
// som ~20 enkelt-props gennem hvert lag.
//
// Brug: const { newMemberName, addMember } = useFamilyFormContext();
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext } from "react";

const FamilyFormContext = createContext(null);

export function FamilyFormProvider({ value, children }) {
  return <FamilyFormContext.Provider value={value}>{children}</FamilyFormContext.Provider>;
}

export function useFamilyFormContext() {
  const ctx = useContext(FamilyFormContext);
  if (!ctx) throw new Error("useFamilyFormContext skal bruges inden i <FamilyFormProvider>");
  return ctx;
}
