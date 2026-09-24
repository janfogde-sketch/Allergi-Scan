// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useAdminAuth.js — login/session for det separate desktop-admin-panel.
// Deler localStorage-nøgler med den mobile PWA (as_token/as_refresh/
// as_user_id) — samme origin, så en bruger der allerede er logget ind i
// hovedappen i samme browser er automatisk logget ind her også. Ingen
// signup/OAuth her (kun admin-konti bruger dette panel), kun almindeligt
// email+password-login mod Supabase, samme kald som useAuth.js's handleLogin.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../constants.jsx";

export function useAdminAuth() {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("as_token") || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("as_refresh") || null);
  const [userId, setUserId] = useState(() => localStorage.getItem("as_user_id") || null);

  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const saveTokens = useCallback((access, refresh, uid) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    setUserId(uid);
    localStorage.setItem("as_token", access);
    localStorage.setItem("as_refresh", refresh);
    localStorage.setItem("as_user_id", uid);
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null); setRefreshToken(null); setUserId(null);
    setIsAdmin(false); setUserEmail("");
    localStorage.removeItem("as_token");
    localStorage.removeItem("as_refresh");
    localStorage.removeItem("as_user_id");
  }, []);

  // ── Verificér admin-rolle hver gang accessToken ændrer sig ────────────────
  // Frontend-tjekket er bekvemmelighed, ikke sikkerheden — RLS på
  // users/service-role-kald i Edge Functions håndhæver den reelle adgang.
  useEffect(() => {
    if (!accessToken || !userId) { setCheckingRole(false); setIsAdmin(false); return; }
    let cancelled = false;
    setCheckingRole(true);
    fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=role,email`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    })
      .then(r => r.ok ? r.json() : [])
      .then(rows => {
        if (cancelled) return;
        const row = Array.isArray(rows) ? rows[0] : null;
        setIsAdmin(row?.role === "admin");
        setUserEmail(row?.email || "");
      })
      .catch(() => { if (!cancelled) setIsAdmin(false); })
      .finally(() => { if (!cancelled) setCheckingRole(false); });
    return () => { cancelled = true; };
  }, [accessToken, userId]);

  const handleLogin = useCallback(async (e) => {
    e?.preventDefault?.();
    if (!loginEmail || !loginPassword) return;
    setAuthLoading(true); setAuthError("");
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.msg || data.error_description || data.message || "";
        throw new Error(msg.toLowerCase().includes("invalid") ? "Forkert email eller kodeord." : (msg || "Login fejlede."));
      }
      saveTokens(data.access_token, data.refresh_token, data.user.id);
    } catch (err) {
      setAuthError(err.message || "Login fejlede.");
    }
    setAuthLoading(false);
  }, [loginEmail, loginPassword, saveTokens]);

  return {
    accessToken, refreshToken, userId, userEmail,
    checkingRole, isAdmin,
    loginEmail, setLoginEmail, loginPassword, setLoginPassword,
    authError, authLoading, handleLogin, logout,
  };
}
