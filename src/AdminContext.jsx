// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// AdminContext.jsx
//
// Samler admin-panelets state og handlinger (brugere, indsendelser, tickets,
// manglende EAN'er, import/reparse) i ét sted, i stedet for at sende ~40
// enkelt-props ned til AdminScreen. AdminScreen er i dag den eneste bruger,
// men det gør listen langt lettere at holde korrekt — en glemt prop her var
// præcis den slags fejl (userSearchParam) der blev fundet under gennemgangen.
//
// Brug: const { adminUsers, loadAdminUsers } = useAdminContext();
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext } from "react";

const AdminContext = createContext(null);

export function AdminProvider({ value, children }) {
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdminContext() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdminContext skal bruges inden i <AdminProvider>");
  return ctx;
}
