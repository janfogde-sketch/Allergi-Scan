// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// AuthContext.jsx
//
// Deler login/bruger-state (user, userId, accessToken, login-formular osv.)
// med alle skærme uden at skulle sendes som props gennem hvert lag.
// Værdien kommer fra useAuth() (kaldt én gang i App.jsx) plus den separate
// `user`/`setUser`-state, som App.jsx ejer selv.
//
// Brug: const { user, userId, accessToken } = useAuthContext();
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ value, children }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext skal bruges inden i <AuthProvider>");
  return ctx;
}
