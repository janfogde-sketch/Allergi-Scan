// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// ProfileContext.jsx
//
// Deler kerne-allergiprofilen (allergener, custom-allergier, familie,
// aktive profiler) med alle skærme uden at skulle sendes som props gennem
// hvert lag. Værdien samles i App.jsx fra allergens/customAllerg (egen
// useState) og family (fra useFamily()).
//
// Brug: const { allergens, family, activeProfiles } = useProfileContext();
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext } from "react";

const ProfileContext = createContext(null);

export function ProfileProvider({ value, children }) {
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfileContext() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfileContext skal bruges inden i <ProfileProvider>");
  return ctx;
}
