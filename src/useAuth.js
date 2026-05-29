// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useAuth.js
// Håndterer al auth-logik: tokens, login, signup, OAuth, clearAuth.
// Returnerer tokens og brugerstyring til App.jsx.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SCREENS } from "./constants.jsx";
import { apiCall } from "./helpers.js";

export function useAuth({ setScreen, setUser, setAllergens, setCustomAllerg,
                          onSignupSuccess }) {

  // ── Token state — persisteret i localStorage ──────────────────────────────
  const [accessToken, setAccessToken]   = useState(() => localStorage.getItem("as_token") || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("as_refresh") || null);
  const [userId, setUserId]             = useState(() => localStorage.getItem("as_user_id") || null);

  // ── Login-formular state ───────────────────────────────────────────────────
  const [loginEmail, setLoginEmail]     = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError]       = useState("");
  const [authLoading, setAuthLoading]   = useState(false);
  const [authTab, setAuthTab]           = useState("signup"); // "signup" | "login"
  const [isOAuth, setIsOAuth]           = useState(false);

  // ── Gem tokens i localStorage ─────────────────────────────────────────────
  const saveTokens = useCallback((access, refresh, uid) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    setUserId(uid);
    localStorage.setItem("as_token", access);
    localStorage.setItem("as_refresh", refresh);
    localStorage.setItem("as_user_id", uid);
  }, []);

  // ── Ryd auth ved logout / slet konto ─────────────────────────────────────
  const clearAuth = useCallback(() => {
    setAccessToken(null); setRefreshToken(null); setUserId(null);
    localStorage.removeItem("as_token");
    localStorage.removeItem("as_refresh");
    localStorage.removeItem("as_user_id");
    setUser({ name:"", age:"", email:"", phone:"", password:"", role:"" });
    setAllergens([]); setCustomAllerg([]);
    // App.jsx rydder family/history/shopping via useEffect på accessToken
    setScreen(SCREENS.WELCOME);
  }, [setScreen, setUser, setAllergens, setCustomAllerg]);

  // ── OAuth callback — fang access_token fra URL hash ──────────────────────
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const params = new URLSearchParams(hash.replace("#", "?").replace("#", "&"));
    const access = params.get("access_token");
    const refresh = params.get("refresh_token");
    if (access && refresh) {
      try {
        const payload = JSON.parse(atob(access.split(".")[1]));
        const uid = payload.sub;
        saveTokens(access, refresh, uid);
        // Sæt rolle og brugerinfo fra JWT øjeblikkeligt
        const meta = payload.user_metadata || {};
        const jwtRole = payload.app_metadata?.role || "user";
        setUser(u => ({
          ...u,
          email: payload.email || meta.email || "",
          name:  meta.full_name || meta.name || "",
          role:  jwtRole,
        }));

        // Hent profil for at tjekke onboarding — men gå aldrig til onboarding hvis admin
        fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${uid}&select=name,email,role,diets,onboarding_completed`, {
          headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${access}`, "Accept": "application/json" },
        })
          .then(r => r.json())
          .then(data => {
            const profile = Array.isArray(data) ? data[0] : null;
            // Admin går ALTID til HOME
            if (jwtRole === "admin") {
              if (profile) {
                setUser(u => ({
                  ...u,
                  name:  profile.name  || u.name,
                  email: profile.email || u.email,
                  role:  jwtRole,
                  diets: Array.isArray(profile.diets) ? profile.diets : [],
                }));
              }
              setScreen(SCREENS.HOME);
              return;
            }
            // Ny bruger = ingen profil ELLER onboarding eksplicit sat til false
            const isNew = !profile || profile.onboarding_completed === false;
            if (isNew) {
              if (onSignupSuccess) onSignupSuccess();
              setIsOAuth(true);
              setScreen(SCREENS.ONBOARD);
            } else {
              if (profile) {
                setUser(u => ({
                  ...u,
                  name:  profile.name  || u.name,
                  email: profile.email || u.email,
                  role:  jwtRole,
                  diets: Array.isArray(profile.diets) ? profile.diets : [],
                }));
              }
              setScreen(SCREENS.HOME);
            }
          })
          .catch(() => setScreen(SCREENS.HOME));
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error("OAuth callback fejl:", e);
        setScreen(SCREENS.HOME);
      }
    }
  }, [saveTokens]);

  // ── Auto-refresh token hvert 45 min ──────────────────────────────────────
  useEffect(() => {
    if (!refreshToken) return;
    const refresh = async () => {
      try {
        const data = await apiCall(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (data.access_token) saveTokens(data.access_token, data.refresh_token, data.user?.id);
      } catch { /* silent */ }
    };
    const interval = setInterval(refresh, 45 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshToken, saveTokens]);

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) return;
    if (!loginEmail.includes("@")) { setAuthError("Indtast en gyldig email-adresse."); return; }
    setAuthLoading(true); setAuthError("");
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const text = await res.text();
      if (text === "Host not in allowlist") {
        setAuthError("⚙️ Supabase er ikke konfigureret til dette domæne."); setAuthLoading(false); return;
      }
      const data = JSON.parse(text);
      if (!res.ok) {
        const msg = data.msg || data.error_description || data.message || "";
        if (msg.toLowerCase().includes("invalid login") || msg.toLowerCase().includes("invalid credentials"))
          throw new Error("Forkert email eller kodeord.");
        throw new Error(msg || "Login fejlede.");
      }
      saveTokens(data.access_token, data.refresh_token, data.user.id);
      setScreen(SCREENS.HOME);
    } catch (e) {
      setAuthError(e.message || "Forkert email eller kodeord. Prøv igen.");
    }
    setAuthLoading(false);
  };

  // ── Signup ────────────────────────────────────────────────────────────────
  const handleSignup = async () => {
    if (!loginEmail || !loginEmail.includes("@")) { setAuthError("Indtast en gyldig email-adresse."); return; }
    if (!loginPassword || loginPassword.length < 6) { setAuthError("Kodeordet skal være mindst 6 tegn."); return; }
    setAuthLoading(true); setAuthError("");
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const text = await res.text();
      if (text === "Host not in allowlist") {
        setAuthError("⚙️ Supabase er ikke konfigureret til dette domæne."); setAuthLoading(false); return;
      }
      const data = JSON.parse(text);
      if (!res.ok) {
        const msg = data.msg || data.error_description || data.message || "";
        if (msg.toLowerCase().includes("already registered") || data.error_code === "email_exists")
          throw new Error("Denne email er allerede registreret. Prøv at logge ind i stedet.");
        if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("weak"))
          throw new Error("Kodeordet er for svagt. Brug mindst 6 tegn.");
        throw new Error(msg || "Oprettelse fejlede. Prøv igen.");
      }
      if (data.access_token) {
        saveTokens(data.access_token, data.refresh_token, data.user.id);
        setUser(u => ({ ...u, email: loginEmail }));
        setScreen(SCREENS.ONBOARD);
        if (onSignupSuccess) onSignupSuccess();
      } else {
        setAuthError("✉️ Tjek din email og klik på bekræftelseslinket — log derefter ind her.");
      }
    } catch (e) {
      setAuthError(e.message || "Oprettelse fejlede. Prøv igen.");
    }
    setAuthLoading(false);
  };

  // ── OAuth redirect ────────────────────────────────────────────────────────
  const handleOAuth = async (provider) => {
    setAuthLoading(true); setAuthError("");
    try {
      const params = new URLSearchParams({
        provider, redirect_to: "https://eatsafe.dk/",
        ...(provider === "google" ? { prompt: "select_account" } : {}),
      });
      window.location.href = `${SUPABASE_URL}/auth/v1/authorize?${params.toString()}`;
    } catch (e) {
      setAuthError(`${provider} login fejlede: ${e.message}`);
      setAuthLoading(false);
    }
  };

  return {
    accessToken, setAccessToken,
    refreshToken, setRefreshToken,
    userId, setUserId,
    loginEmail, setLoginEmail,
    loginPassword, setLoginPassword,
    authError, setAuthError,
    authLoading, setAuthLoading,
    authTab, setAuthTab,
    isOAuth, setIsOAuth,
    saveTokens,
    clearAuth,
    handleLogin,
    handleSignup,
    handleOAuth,
  };
}
