// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// ShoppingContext.jsx
//
// Deler indkøbslisten (shoppingList, addToList, toggleItem m.fl.) med alle
// skærme uden at skulle sendes som props gennem hvert lag.
//
// Brug: const { shoppingList, addToList } = useShoppingContext();
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext } from "react";

const ShoppingContext = createContext(null);

export function ShoppingProvider({ value, children }) {
  return <ShoppingContext.Provider value={value}>{children}</ShoppingContext.Provider>;
}

export function useShoppingContext() {
  const ctx = useContext(ShoppingContext);
  if (!ctx) throw new Error("useShoppingContext skal bruges inden i <ShoppingProvider>");
  return ctx;
}
