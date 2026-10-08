// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useAdminAuth.js — login/session for det separate desktop-admin-panel.
// Deler session med den mobile PWA (cookie + mærke, se sessionStore.js) — samme
// origin, så en bruger der allerede er logget ind i hovedappen i samme browser
// er automatisk logget ind her også. Ingen
// signup/OAuth her (kun admin-konti bruger dette panel), kun almindeligt
// email+password-login mod Supabase, samme kald som useAuth.js's handleLogin.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../constants.jsx";
import { setMemoryToken, hasStoredSession, persistRefreshToken, restoreSession, endSession } from "../sessionStore.js";

// Udløbstidspunktet (ms) fra access-tokenets payload; null hvis det ikke kan læses.
export function jwtExpiryMs(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch { return null; }
}

const REFRESH_MARGIN_MS = 60_000;

export function useAdminAuth() {
  const [accessToken, setAccessToken] = useState(/** @type {string | null} */ (null));
  const [userId, setUserId] = useState(() => localStorage.getItem("as_user_id") || null);
  // Sand, mens en gemt session hentes via cookien, så login-formularen ikke blinker forbi.
  const [restoring, setRestoring] = useState(() => hasStoredSession());

  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [roleCheckError, setRoleCheckError] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const saveTokens = useCallback((access, refresh, uid) => {
    setMemoryToken(access);
    setAccessToken(access);
    if (uid) { setUserId(uid); localStorage.setItem("as_user_id", uid); }
    if (refresh) persistRefreshToken(refresh, true);
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null); setUserId(null);
    setIsAdmin(false); setUserEmail("");
    localStorage.removeItem("as_user_id");
    endSession();
  }, []);

  // ── Gendan sessionen ved indlæsning ───────────────────────────────────────
  useEffect(() => {
    if (!hasStoredSession()) { setRestoring(false); return; }
    let cancelled = false;
    (async () => {
      const r = await restoreSession();
      if (cancelled) return;
      if (r.status === "ok") saveTokens(r.accessToken, null, r.userId || userId);
      else if (r.status === "expired") logout();
      setRestoring(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Hold access-tokenet frisk ─────────────────────────────────────────────
  // Supabase-tokens udløber efter ca. en time, og panelet står ofte åbent
  // længere. Vi fornyer et minut før udløb (eller med det samme, hvis det
  // allerede er udløbet ved indlæsning). Afvises sessionen, logges der ud.
  useEffect(() => {
    if (!accessToken) return;
    const exp = jwtExpiryMs(accessToken);
    if (exp === null) return;
    let cancelled = false;
    let timer;
    const refresh = async () => {
      const r = await restoreSession();
      if (cancelled) return;
      if (r.status === "ok") saveTokens(r.accessToken, null, r.userId || userId);
      else if (r.status === "expired" || r.status === "none") logout();
      else timer = setTimeout(refresh, 30_000);
    };
    timer = setTimeout(refresh, Math.max(0, exp - Date.now() - REFRESH_MARGIN_MS));
    return () => { cancelled = true; clearTimeout(timer); };
  }, [accessToken, userId, saveTokens, logout]);

  // ── Verificér admin-rolle hver gang accessToken ændrer sig ────────────────
  // Frontend-tjekket er bekvemmelighed, ikke sikkerheden — RLS på
  // users/service-role-kald i Edge Functions håndhæver den reelle adgang.
  useEffect(() => {
    if (!accessToken || !userId) { setCheckingRole(false); setIsAdmin(false); return; }
    // Et allerede udløbet token afvises af RLS; vent på, at fornyelsen ovenfor leverer et nyt.
    const exp = jwtExpiryMs(accessToken);
    if (exp !== null && exp <= Date.now()) { setCheckingRole(true); return; }
    let cancelled = false;
    setCheckingRole(true);
    setRoleCheckError("");
    fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=role,email`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    })
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(rows => {
        if (cancelled) return;
        const row = Array.isArray(rows) ? rows[0] : null;
        setIsAdmin(row?.role === "admin");
        setUserEmail(row?.email || "");
      })
      .catch((e) => {
        // Adskil "kunne ikke tjekke" fra "bekræftet ikke-admin" — ellers ville
        // en netværksfejl eller udløbet token vise "ingen admin-adgang" til en
        // reel admin, uden nogen antydning af hvorfor.
        if (cancelled) return;
        setIsAdmin(false);
        setRoleCheckError(e.message || "Ukendt fejl");
      })
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
    accessToken, userId, userEmail,
    checkingRole: checkingRole || restoring, isAdmin, roleCheckError,
    loginEmail, setLoginEmail, loginPassword, setLoginPassword,
    authError, authLoading, handleLogin, logout,
  };
}
