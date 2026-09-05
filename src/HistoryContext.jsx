// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// HistoryContext.jsx
//
// Deler scanningshistorik og favoritter (history, favorites, toggleFavorite
// m.fl.) med alle skærme uden at skulle sendes som props gennem hvert lag.
//
// Brug: const { history, favorites, toggleFavorite } = useHistoryContext();
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext } from "react";

const HistoryContext = createContext(null);

export function HistoryProvider({ value, children }) {
  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistoryContext() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistoryContext skal bruges inden i <HistoryProvider>");
  return ctx;
}
