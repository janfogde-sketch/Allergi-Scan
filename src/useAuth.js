// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useAuth.js
// Håndterer al auth-logik: tokens, login, signup, OAuth, clearAuth.
// Returnerer tokens og brugerstyring til App.jsx.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SCREENS } from "./constants.jsx";
import { apiCall, decodeJwtPayload } from "./helpers.js";
import { showToast } from "./SharedComponents.jsx";

export function useAuth({ setScreen, setUser, setAllergens, setCustomAllerg,
                          onSignupSuccess }) {

  // ── Token state — persisteret i localStorage (eller sessionStorage, se
  // rememberMe nedenfor) — falder tilbage til sessionStorage ved opstart,
  // så et token gemt dér (rememberMe=false) også findes igen efter en
  // genindlæsning inden for samme faneblad. ────────────────────────────────
  const [accessToken, setAccessToken]   = useState(() => localStorage.getItem("as_token") || sessionStorage.getItem("as_token") || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("as_refresh") || sessionStorage.getItem("as_refresh") || null);
  const [userId, setUserId]             = useState(() => localStorage.getItem("as_user_id") || sessionStorage.getItem("as_user_id") || null);

  // ── Login-formular state ───────────────────────────────────────────────────
  const [loginEmail, setLoginEmail]     = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError]       = useState("");
  // Adskilt fra authError (25. sept. 2026, opfølgning): "denne email er
  // allerede registreret" skal vises som en felt-specifik inline-fejl ved
  // selve E-mail-feltet, ikke i den store, globale error-boks — globale
  // error-alerts er nu forbeholdt fejl der ikke kan knyttes til ét felt.
  const [emailTakenError, setEmailTakenError] = useState("");
  const [authLoading, setAuthLoading]   = useState(false);
  const [authTab, setAuthTab]           = useState("signup"); // "signup" | "login"
  const [isOAuth, setIsOAuth]           = useState(false);
  // "Husk mig" (25. sept. 2026-brief) — sand som standard (uændret adfærd:
  // token i localStorage, overlever browseren lukkes). Slået fra gemmes
  // tokenet i sessionStorage i stedet, så det forsvinder når fanebladet
  // lukkes. saveTokens rydder altid den ANDEN storage for de samme nøgler,
  // så der aldrig ligger to modstridende kopier af det samme token.
  const [rememberMe, setRememberMe]     = useState(true);

  // ── Gem tokens i localStorage/sessionStorage ──────────────────────────────
  const saveTokens = useCallback((access, refresh, uid) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    setUserId(uid);
    const store = rememberMe ? localStorage : sessionStorage;
    const other = rememberMe ? sessionStorage : localStorage;
    store.setItem("as_token", access);
    store.setItem("as_refresh", refresh);
    store.setItem("as_user_id", uid);
    other.removeItem("as_token");
    other.removeItem("as_refresh");
    other.removeItem("as_user_id");
  }, [rememberMe]);

  // ── Ryd auth ved logout / slet konto ─────────────────────────────────────
  const clearAuth = useCallback(() => {
    setAccessToken(null); setRefreshToken(null); setUserId(null);
    localStorage.removeItem("as_token"); sessionStorage.removeItem("as_token");
    localStorage.removeItem("as_refresh"); sessionStorage.removeItem("as_refresh");
    localStorage.removeItem("as_user_id"); sessionStorage.removeItem("as_user_id");
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
        const payload = decodeJwtPayload(access);
        const uid = payload.sub;
        saveTokens(access, refresh, uid);
        fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${uid}&select=name,created_at,onboarding_completed`, {
          headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${access}`, "Accept": "application/json" },
        })
          .then(r => r.json())
          .then(data => {
            const profile = data?.[0];
            const createdAt = profile?.created_at ? new Date(profile.created_at) : null;
            const isNew = !profile || profile.onboarding_completed === false || !createdAt || (Date.now() - createdAt.getTime() < 120000);
            if (isNew) {
              const meta = payload.user_metadata || {};
              setUser(u => ({ ...u, email: payload.email || meta.email || "", name: meta.full_name || meta.name || "" }));
              if (onSignupSuccess) onSignupSuccess();
              setIsOAuth(true);
              setScreen(SCREENS.ONBOARD);
            } else {
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

  // ── Verificér gemt session ved opstart ────────────────────────────────────
  // App.jsx viser "Hjem" allerede ved opstart blot fordi der ligger et token
  // i localStorage — uden nogensinde at tjekke om det stadig er gyldigt hos
  // Supabase. Et udløbet token (fx efter en JWT-nøglerotation, eller bare
  // naturligt udløb + fejlet baggrunds-fornyelse) efterlod brugeren på
  // Hjem-skærmen som om de var logget ind, indtil et API-kald fejlede.
  useEffect(() => {
    const tokenFromStorage = localStorage.getItem("as_token") || sessionStorage.getItem("as_token");
    if (!tokenFromStorage) return;
    let cancelled = false;

    (async () => {
      let checkRes;
      try {
        checkRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${tokenFromStorage}` },
        });
      } catch {
        return; // Netværksfejl — rør ikke ved en session vi ikke kunne verificere
      }
      if (cancelled || checkRes.ok) return; // Tokenet er gyldigt

      // Tokenet blev afvist af Supabase — prøv at forny det med det samme
      const storedRefresh = localStorage.getItem("as_refresh") || sessionStorage.getItem("as_refresh");
      if (!storedRefresh) { if (!cancelled) clearAuth(); return; }

      let refreshRes;
      try {
        refreshRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
          body: JSON.stringify({ refresh_token: storedRefresh }),
        });
      } catch {
        return; // Netværksfejl under fornyelsesforsøg — log ikke ud pga. det alene
      }
      if (cancelled) return;
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        if (data.access_token) saveTokens(data.access_token, data.refresh_token, data.user?.id);
        else clearAuth();
      } else {
        clearAuth(); // Refresh-tokenet er også ugyldigt — sessionen er reelt udløbet
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // ── Auto-refresh token — planlagt efter tokenets faktiske udløbstid ──────
  // (ikke en blind fast timer: en genindlæsning midt i en session, eller et
  // enkelt fejlet forsøg, må ikke kunne efterlade et udløbet token i op til
  // 45 min før næste forsøg)
  useEffect(() => {
    if (!refreshToken || !accessToken) return;
    let cancelled = false;
    let timeoutId;

    const refresh = async (retry = 0) => {
      try {
        const data = await apiCall(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!cancelled && data.access_token) saveTokens(data.access_token, data.refresh_token, data.user?.id);
      } catch {
        // Prøv igen efter kort stigende ventetid, i stedet for at vente til næste planlagte refresh
        if (!cancelled && retry < 3) {
          timeoutId = setTimeout(() => refresh(retry + 1), Math.min(30000 * (retry + 1), 120000));
        }
      }
    };

    let delay;
    try {
      const { exp } = decodeJwtPayload(accessToken);
      // Forny 2 min før udløb (aldrig under 5 sek, aldrig over 45 min)
      delay = Math.min(Math.max(exp * 1000 - Date.now() - 120000, 5000), 45 * 60 * 1000);
    } catch {
      delay = 45 * 60 * 1000; // Kunne ikke afkode udløbstid — fald tilbage til gammel adfærd
    }
    timeoutId = setTimeout(() => refresh(), delay);
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [refreshToken, accessToken, saveTokens]);

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = useCallback(async () => {
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
          throw new Error("Forkert email eller adgangskode.");
        throw new Error(msg || "Login fejlede.");
      }
      saveTokens(data.access_token, data.refresh_token, data.user.id);
      setScreen(SCREENS.HOME);
    } catch (e) {
      setAuthError(e.message || "Forkert email eller adgangskode. Prøv igen.");
    }
    setAuthLoading(false);
  }, [loginEmail, loginPassword, saveTokens, setScreen]);

  // ── Signup ────────────────────────────────────────────────────────────────
  const handleSignup = useCallback(async () => {
    if (!loginEmail || !loginEmail.includes("@")) { setAuthError("Indtast en gyldig email-adresse."); return; }
    // Kun længdekrav (min. 10 tegn), ingen tvungen tegn-kompleksitet — matcher
    // moderne sikkerhedsanbefalinger (NIST 800-63B), som fraråder påtvungne
    // store bogstaver/tal/specialtegn-krav: de får ofte brugere til at vælge
    // forudsigelige mønstre (fx "Password1!") og øger frafald ved signup uden
    // reel sikkerhedsgevinst — længde er den langt vigtigste faktor.
    if (!loginPassword || loginPassword.length < 10) { setAuthError("Adgangskoden skal være mindst 10 tegn."); return; }
    setAuthLoading(true); setAuthError(""); setEmailTakenError("");
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
        // Felt-specifik fejl (25. sept. 2026) — vises inline ved E-mail-
        // feltet, ikke i den globale error-boks, se emailTakenError ovenfor.
        if (msg.toLowerCase().includes("already registered") || data.error_code === "email_exists") {
          setEmailTakenError("Denne e-mail er allerede registreret.");
          setAuthLoading(false);
          return;
        }
        if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("weak"))
          throw new Error("Adgangskoden er for svag. Brug mindst 10 tegn.");
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
  }, [loginEmail, loginPassword, saveTokens, setUser, setScreen, onSignupSuccess]);

  // ── OAuth redirect ────────────────────────────────────────────────────────
  const handleOAuth = useCallback(async (provider) => {
    setAuthLoading(true); setAuthError("");
    try {
      const params = new URLSearchParams({
        provider, redirect_to: window.location.origin + "/",
        ...(provider === "google" ? { prompt: "select_account" } : {}),
      });
      window.location.href = `${SUPABASE_URL}/auth/v1/authorize?${params.toString()}`;
    } catch (e) {
      setAuthError(`${provider} login fejlede: ${e.message}`);
      setAuthLoading(false);
    }
  }, []);

  // ── Glemt adgangskode (25. sept. 2026-brief) — samme REST-mønster som
  // handleLogin/handleSignup, mod Supabases indbyggede recover-endpoint.
  // Supabase sender selv en email med nulstillingslink; vi viser blot en
  // bekræftelse via den delte Toast, ikke via error-box (det er ikke en fejl).
  const handleForgotPassword = useCallback(async () => {
    if (!loginEmail || !loginEmail.includes("@")) {
      setAuthError("Indtast din email for at nulstille adgangskoden.");
      return;
    }
    setAuthLoading(true); setAuthError("");
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: loginEmail }),
      });
      if (!res.ok) throw new Error("Kunne ikke sende nulstillingslink. Prøv igen.");
      showToast("Tjek din email for at nulstille adgangskoden.", "success");
    } catch (e) {
      setAuthError(e.message || "Kunne ikke sende nulstillingslink. Prøv igen.");
    }
    setAuthLoading(false);
  }, [loginEmail]);

  return {
    accessToken, setAccessToken,
    refreshToken, setRefreshToken,
    userId, setUserId,
    loginEmail, setLoginEmail,
    loginPassword, setLoginPassword,
    authError, setAuthError,
    emailTakenError, setEmailTakenError,
    authLoading, setAuthLoading,
    authTab, setAuthTab,
    isOAuth, setIsOAuth,
    rememberMe, setRememberMe,
    saveTokens,
    clearAuth,
    handleLogin,
    handleSignup,
    handleOAuth,
    handleForgotPassword,
  };
}
