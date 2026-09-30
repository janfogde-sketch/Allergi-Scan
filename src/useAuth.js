// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useAuth.js
// Håndterer al auth-logik: tokens, login, signup, OAuth, clearAuth.
// Returnerer tokens og brugerstyring til App.jsx.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SCREENS } from "./constants.jsx";
import { apiCall, decodeJwtPayload, passwordErrorText, PASSWORD_REQUIREMENTS_TEXT } from "./helpers.js";
import { showToast } from "./SharedComponents.jsx";

// Simpel, ikke-overdrevet streng e-mail-validering (27. sept. 2026, MASTER
// PROMPT "FINAL 10/10 POLISH – OPRET KONTO & LOG IND") — erstatter den
// tidligere blotte `.includes("@")`-tjek, som lod ting som "a@b" eller "a@"
// passere som "gyldige". Kræver kun tegn@tegn.tegn, ingen fuld RFC 5322-
// validering (ville afvise reelt gyldige adresser unødigt).
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Supabase/GoTrue understøtter ikke internationale tegn (æ, ø, å m.fl.) i
// e-mailadresser (29. sept. 2026) — afvises her i stedet for at blive sendt
// til backend. Erstatter/transskriberer IKKE tegnene (fx ø→o, æ→ae), da det
// kan ændre adressen til en anden, reelt eksisterende adresse.
export const hasUnsupportedEmailChars = (email) => /[^\x00-\x7F]/.test(email);

// Tre adskilte tilstande (30. sept. 2026): konto oprettet → e-mail bekræftet
// → onboarding færdig. De to lokale markører nedenfor lader appen vælge den
// rigtige startskærm, FØR serveren har svaret:
//  - as_pending_verify: e-mailen på en oprettet, endnu ikke bekræftet konto
//    (ingen session endnu) — appen åbner bekræftelsesskærmen igen.
//  - as_onboarded: denne enhed har set onboarding_completed=true — kun da må
//    appen starte direkte på forsiden. Uden markøren venter appen på svaret
//    (SCREENS.BOOT) i stedet for at gætte på forsiden.
export const PENDING_VERIFY_KEY = "as_pending_verify";
export const ONBOARDED_KEY = "as_onboarded";
export function markOnboardedLocally() {
  try { localStorage.setItem(ONBOARDED_KEY, "1"); } catch { /* privat tilstand */ }
}
function readPendingVerify() {
  try { return localStorage.getItem(PENDING_VERIFY_KEY) || ""; } catch { return ""; }
}
function writePendingVerify(email) {
  try {
    if (email) localStorage.setItem(PENDING_VERIFY_KEY, email);
    else localStorage.removeItem(PENDING_VERIFY_KEY);
  } catch { /* privat tilstand */ }
}

export function useAuth({ setScreen, setUser, setAllergens, setCustomAllerg,
                          setOnboardStep }) {

  // Slår op om en frisk indlæst/logget ind bruger har gennemført onboarding,
  // og ruter til hhv. ONBOARD (med det gemte trin genoptaget) eller HOME
  // (29. sept. 2026, "Onboarding-persistens") — delt af handleLogin og
  // app-boot-korrektionen nedenfor, så de to steder ikke kan komme i
  // konflikt med hinanden om hvordan beslutningen tages.
  const resolveOnboardingRoute = useCallback(async (uid, token) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${uid}&select=onboarding_completed,onboarding_step`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const rows = await res.json();
      const p = Array.isArray(rows) ? rows[0] : null;
      if (p && p.onboarding_completed === false) {
        setOnboardStep(p.onboarding_step || 1);
        setScreen(SCREENS.ONBOARD);
      } else {
        markOnboardedLocally();
        setScreen(SCREENS.HOME);
      }
    } catch {
      // Kunne ikke afgøre status (netværksfejl) — fald tilbage til den
      // tidligere, simple adfærd frem for at lade brugeren hænge på et tomt
      // login-skærmbillede.
      setScreen(SCREENS.HOME);
    }
  }, [setScreen, setOnboardStep]);

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
  // Neutral besked (ikke en fejl) — fx "tjek din e-mail" efter oprettelse,
  // når Supabase kræver e-mailbekræftelse før første login (D1, 29. sept.).
  const [authInfo, setAuthInfo]         = useState("");
  // Bekræftelsesskærmen (SCREENS.VERIFYEMAIL, 30. sept. 2026): "Opret
  // konto" opretter kontoen med det samme og viser skærmen. verifyStatus er
  // "pending" (mail sendt, venter) eller "verified" (bekræftet, klar til
  // "Fortsæt opsætning"). verifyError/verifyNotice er skærmens egne
  // beskeder, adskilt fra login-formularens authError/authInfo.
  const [verifyEmail, setVerifyEmail]   = useState(readPendingVerify);
  const [verifyStatus, setVerifyStatus] = useState("pending");
  const [verifyError, setVerifyError]   = useState("");
  const [verifyNotice, setVerifyNotice] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  // Sekunder til "Send mail igen" må bruges igen (Supabase tillader én
  // mail pr. 60 s pr. adresse).
  const [resendCooldown, setResendCooldown] = useState(0);
  // Adskilt fra authError (25. sept. 2026, opfølgning): "denne email er
  // allerede registreret" skal vises som en felt-specifik inline-fejl ved
  // selve E-mail-feltet, ikke i den store, globale error-boks — globale
  // error-alerts er nu forbeholdt fejl der ikke kan knyttes til ét felt.
  const [emailTakenError, setEmailTakenError] = useState("");
  // 27. sept. 2026, "FINAL 10/10 POLISH – OPRET KONTO & LOG IND": alle
  // felt-specifikke valideringsfejl (tom/ugyldig e-mail, for kort/svag
  // adgangskode) er flyttet fra den fælles authError-boks til disse to
  // dedikerede states, som OnboardingScreen.jsx viser inline direkte under
  // det relevante felt — BÅDE på Ny bruger og Log ind. Deles på tværs af
  // begge faner (kun én er synlig ad gangen, og et fane-skift rydder dem,
  // se OnboardingScreen.jsx) — også genbrugt til "Glemt adgangskode?"s
  // e-mail-krav, som tidligere havde sin egen, adskilte lokale
  // forgotPwError-state i OnboardingScreen.jsx (nu fjernet, samme
  // fejltekst "Indtast din e-mail først." dækkede præcis samme behov).
  const [emailError, setEmailError]     = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [authLoading, setAuthLoading]   = useState(false);
  const [authTab, setAuthTab]           = useState("signup"); // "signup" | "login"
  const [isOAuth, setIsOAuth]           = useState(false);
  // Aflæst allerede under første render, FØR nogen effekt kører: landede
  // appen fra et login-/bekræftelseslink (#access_token=...)? Effekten
  // nedenfor, der tager imod linket, fjerner selve hashen fra adressen, så
  // app-boot-effekten kan ikke længere se den, når den kører lige efter.
  // Uden denne ref slog app-boot onboarding-status op for en GAMMEL konto,
  // der stadig lå i browseren, og sendte en ny bruger fra
  // bekræftelsesmailen direkte til forsiden (fundet 30. sept. 2026).
  const arrivedViaAuthLinkRef = useRef(
    typeof window !== "undefined" && window.location.hash.includes("access_token")
  );
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
    try { localStorage.removeItem(ONBOARDED_KEY); } catch { /* privat tilstand */ }
    writePendingVerify(""); setVerifyEmail(""); setVerifyStatus("pending");
    setAllergens([]); setCustomAllerg([]);
    // App.jsx rydder family/history/shopping via useEffect på accessToken
    setScreen(SCREENS.WELCOME);
  }, [setScreen, setUser, setAllergens, setCustomAllerg]);

  // ── OAuth callback — fang access_token fra URL hash ──────────────────────
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const params = new URLSearchParams(hash.replace("#", "?").replace("#", "&"));
    // Udløbet eller allerede brugt bekræftelseslink (Supabase sender
    // #error=...&error_code=otp_expired tilbage i stedet for en session).
    if (params.get("error") || params.get("error_code")) {
      window.history.replaceState({}, document.title, window.location.pathname);
      if (readPendingVerify()) {
        setVerifyError("Linket i mailen er udløbet eller allerede brugt. Tryk på “Send mail igen”, eller log ind, hvis du allerede har bekræftet.");
        setScreen(SCREENS.VERIFYEMAIL);
      } else {
        setAuthTab("login");
        setAuthError("Linket i mailen er udløbet eller allerede brugt. Log ind for at fortsætte.");
        setScreen(SCREENS.LOGIN);
      }
      return;
    }
    const access = params.get("access_token");
    const refresh = params.get("refresh_token");
    if (access && refresh) {
      try {
        const payload = decodeJwtPayload(access);
        const uid = payload.sub;
        saveTokens(access, refresh, uid);
        // Kom brugeren fra bekræftelseslinket i mailen (type=signup)? Så
        // vises bekræftelsesskærmen i "bekræftet"-tilstand først, uanset
        // hvad der ellers ligger i browseren.
        const fromSignupLink = params.get("type") === "signup";
        if (fromSignupLink) {
          writePendingVerify("");
          setVerifyEmail(payload.email || "");
          setVerifyError(""); setVerifyNotice("");
          setVerifyStatus("verified");
        }
        fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${uid}&select=name,onboarding_completed,onboarding_step`, {
          headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${access}`, "Accept": "application/json" },
        })
          .then(r => r.json())
          .then(data => {
            const profile = data?.[0];
            // Kun en færdig onboarding sender direkte ind i appen — ikke det
            // at kontoen findes eller at e-mailen netop er bekræftet.
            if (profile?.onboarding_completed === true) {
              markOnboardedLocally();
              setScreen(SCREENS.HOME);
              return;
            }
            setOnboardStep(profile?.onboarding_step || 1);
            const meta = payload.user_metadata || {};
            setUser(u => ({ ...u, email: payload.email || meta.email || u.email || "",
              name: u.name || profile?.name || meta.full_name || meta.name || "" }));
            if (fromSignupLink) {
              setIsOAuth("email");
              setScreen(SCREENS.VERIFYEMAIL);
            } else {
              // Google/Facebook: e-mailen er bekræftet af udbyderen, så
              // brugeren går direkte til (det gemte trin i) onboarding.
              // "google" styrer teksten under E-mail-feltet i trin 1.
              setIsOAuth(payload.app_metadata?.provider || true);
              setScreen(SCREENS.ONBOARD);
            }
          })
          .catch(() => setScreen(fromSignupLink ? SCREENS.VERIFYEMAIL : SCREENS.HOME));
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

  // ── App-boot: korrigér startskærmen ud fra reel onboarding-status ────────
  // (29. sept. 2026, "Onboarding-persistens") — App.jsx's `screen`-useState
  // gætter blindt HOME, blot fordi der ligger et token i localStorage/
  // sessionStorage, uden nogensinde at tjekke onboarding_completed. En
  // bruger der lukkede appen midt i onboardingen (eller aldrig gennemførte
  // den) blev derfor altid sendt direkte til scanner-forsiden ved appstart.
  // Kører KUN én gang ved mount (tomt dep-array) — ikke ved senere token-
  // fornyelser, som ikke må afbryde et onboarding-forløb der er i gang
  // inde i selve sessionen (resolveOnboardingRoute bruges dér IKKE).
  useEffect(() => {
    // En frisk OAuth-redirect (samme mount) håndterer sin egen routing i
    // effekten ovenfor, inkl. genoptagelse af gemt trin — spring den her
    // over for at undgå at de to konkurrerer om at afgøre skærmen to gange.
    if (arrivedViaAuthLinkRef.current) return;
    if (!accessToken) return;
    let uid = userId;
    try { uid = uid || decodeJwtPayload(accessToken).sub; } catch { /* ugyldigt token */ }
    if (!uid) { setScreen(SCREENS.HOME); return; }
    resolveOnboardingRoute(uid, accessToken);
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

  // ── Bekræftelsesskærmen ──────────────────────────────────────────────────
  const openVerifyScreen = useCallback((email) => {
    writePendingVerify(email);
    setVerifyEmail(email);
    setVerifyStatus("pending");
    setVerifyError(""); setVerifyNotice("");
    setAuthError(""); setAuthInfo("");
    setScreen(SCREENS.VERIFYEMAIL);
  }, [setScreen]);

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = useCallback(async () => {
    // Felt-specifik validering FØRST (27. sept. 2026, "FINAL 10/10 POLISH")
    // — tom/ugyldig e-mail og tom adgangskode er begge entydigt knyttet til
    // ét felt, så de vises der, ikke i den globale error-boks.
    // Trim + lowercase FØR validering/afsendelse (29. sept. 2026) — kun
    // normalisering, ingen transskribering af selve tegnene.
    const email = loginEmail.trim().toLowerCase();
    if (!email) { setEmailError("Indtast din e-mail først."); return; }
    if (hasUnsupportedEmailChars(email)) { setEmailError("Brug en e-mailadresse uden æ, ø, å eller andre specialtegn."); return; }
    if (!isValidEmail(email)) { setEmailError("Indtast en gyldig e-mailadresse."); return; }
    if (!loginPassword) { setPasswordError("Indtast din adgangskode."); return; }
    setEmailError(""); setPasswordError("");
    setAuthLoading(true); setAuthError(""); setAuthInfo("");
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ email, password: loginPassword }),
      });
      const text = await res.text();
      if (text === "Host not in allowlist") {
        setAuthError("Supabase er ikke konfigureret til dette domæne."); setAuthLoading(false); return;
      }
      const data = JSON.parse(text);
      if (!res.ok) {
        const msg = (data.msg || data.error_description || data.message || "").toLowerCase();
        // Global error-boks (27. sept. 2026, "FINAL 10/10 POLISH") — ALDRIG
        // Supabases rå, tekniske fejltekst direkte til brugeren, kun en af
        // disse faste, venlige beskeder. "Forkert email eller adgangskode"
        // kan desuden IKKE knyttes til ét bestemt felt (Supabase fortæller
        // bevidst ikke hvilket af de to der er forkert, af sikkerhedshensyn),
        // så den hører til her, ikke som en felt-specifik inline-fejl. En
        // "invalid email"-afvisning fra backend derimod HØRER til e-mail-
        // feltet (29. sept. 2026) — bør reelt aldrig ske her, da frontend nu
        // validerer det samme før kaldet, men mappes korrekt hvis den gør.
        if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
          setAuthError("E-mail eller adgangskode er forkert.");
        } else if (msg.includes("email not confirmed")) {
          // Konto oprettet, men e-mailen er ikke bekræftet: vis
          // bekræftelsesskærmen (adgangskoden bliver i hukommelsen, så
          // "Jeg har bekræftet min e-mail" kan logge ind bagefter).
          openVerifyScreen(email);
        } else if (msg.includes("invalid") && msg.includes("email")) {
          setEmailError("Indtast en gyldig e-mailadresse.");
        } else {
          setAuthError("Der opstod en fejl. Prøv igen.");
        }
        setAuthLoading(false);
        return;
      }
      saveTokens(data.access_token, data.refresh_token, data.user.id);
      writePendingVerify(""); setVerifyEmail("");
      // Ruter til ONBOARD (med gemt trin genoptaget) eller HOME ud fra reel
      // status i stedet for blindt at antage Hjem (29. sept. 2026,
      // "Onboarding-persistens") — en bruger der aldrig gennemførte
      // onboarding skal tilbage dertil, hver gang de logger ind igen.
      await resolveOnboardingRoute(data.user.id, data.access_token);
    } catch {
      // Ægte, uventede fejl (netværk nede, JSON-parse-fejl osv.) — vis
      // ALDRIG browserens/JS'ens rå tekniske fejltekst (fx "Failed to
      // fetch") til brugeren, kun den faste, venlige generiske besked.
      setAuthError("Der opstod en fejl. Prøv igen.");
    }
    setAuthLoading(false);
  }, [loginEmail, loginPassword, saveTokens, resolveOnboardingRoute, openVerifyScreen]);

  // ── Signup ────────────────────────────────────────────────────────────────
  // Felt-validering for "Opret konto" (handleSignup). Returnerer den normaliserede
  // e-mail, eller null hvis et felt er ugyldigt (fejlen er sat på feltet).
  const validateSignupFields = useCallback(() => {
    // Felt-specifik validering FØRST (27. sept. 2026, "FINAL 10/10 POLISH")
    // — se handleLogin ovenfor for samme mønster/begrundelse.
    // Trim + lowercase FØR validering/afsendelse (29. sept. 2026) — kun
    // normalisering, ingen transskribering af selve tegnene (fx ø→o), da det
    // kan ændre adressen til en anden, reelt eksisterende adresse.
    const email = loginEmail.trim().toLowerCase();
    if (!email) { setEmailError("Indtast din e-mail først."); return null; }
    // Supabase/GoTrue understøtter ikke internationale tegn (æ/ø/å m.fl.) i
    // e-mailadresser — afvis her, FØR den ellers gyldige formatkontrol
    // nedenfor, med en dedikeret besked (ikke den generiske "ugyldig
    // e-mailadresse", som ikke ville forklare HVORFOR den blev afvist).
    if (hasUnsupportedEmailChars(email)) { setEmailError("Brug en e-mailadresse uden æ, ø, å eller andre specialtegn."); return null; }
    if (!isValidEmail(email)) { setEmailError("Indtast en gyldig e-mailadresse."); return null; }
    // Samme krav som Supabase selv håndhæver (små og store bogstaver + tal)
    // plus appens længdekrav, så brugeren får en konkret besked med det samme
    // i stedet for en uforklaret afvisning fra serveren (30. sept. 2026).
    const pwError = passwordErrorText(loginPassword);
    if (pwError) { setPasswordError(pwError); return null; }
    setEmailError(""); setPasswordError("");
    return email;
  }, [loginEmail, loginPassword]);

  // "Opret konto": opret kontoen med det samme (kun e-mail og adgangskode;
  // navn, alder og køn udfyldes i onboarding efter bekræftelsen) og vis
  // bekræftelsesskærmen. Ingen besked om en sendt mail, før kaldet er lykkedes.
  const handleSignup = useCallback(async () => {
    const email = validateSignupFields();
    if (!email) return;
    setAuthLoading(true); setAuthError(""); setAuthInfo(""); setEmailTakenError("");
    try {
      // redirect_to: bekræftelseslinket i mailen skal føre tilbage til samme
      // domæne som appen blev åbnet fra (samme mønster som OAuth nedenfor).
      const res = await fetch(`${SUPABASE_URL}/auth/v1/signup?redirect_to=${encodeURIComponent(window.location.origin + "/")}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ email, password: loginPassword }),
      });
      const text = await res.text();
      if (text === "Host not in allowlist") {
        setAuthError("Supabase er ikke konfigureret til dette domæne."); setAuthLoading(false); return;
      }
      const data = JSON.parse(text);
      if (!res.ok) {
        const msg = data.msg || data.error_description || data.message || "";
        const msgLc = msg.toLowerCase();
        // Felt-specifikke fejl (25./27./29. sept. 2026) — vises inline ved
        // det relevante felt, ikke i den globale error-boks. "Allerede
        // registreret" hører til E-mail-feltet (emailTakenError ovenfor,
        // egen "Log ind i stedet"-handling); et for svagt password fra
        // Supabases egen validering (fx et kendt læk-tjek) hører til
        // Adgangskode-feltet, samme sted som længde-fejlen ovenfor.
        if (msgLc.includes("already registered") || data.error_code === "email_exists") {
          setEmailTakenError("Denne e-mail er allerede registreret.");
        } else if (data.error_code === "weak_password" || msgLc.includes("password") || msgLc.includes("weak")) {
          // Supabase angiver årsagen i weak_password.reasons ("length",
          // "characters", "pwned"). En lækket kode kan ikke fanges lokalt.
          const reasons = data.weak_password?.reasons || [];
          setPasswordError(reasons.includes("pwned")
            ? "Adgangskoden er fundet i et kendt datalæk og kan ikke bruges. Vælg en anden."
            : (passwordErrorText(loginPassword) || `Adgangskoden opfylder ikke kravene. ${PASSWORD_REQUIREMENTS_TEXT}`));
        } else if (msgLc.includes("invalid") && msgLc.includes("email")) {
          setEmailError("Indtast en gyldig e-mailadresse.");
        } else if (res.status === 429) {
          setAuthError("Der er sendt for mange mails lige nu. Vent et øjeblik, og prøv igen.");
        } else {
          // ALDRIG Supabases rå, tekniske fejltekst til brugeren.
          setAuthError("Der opstod en fejl. Prøv igen.");
        }
        setAuthLoading(false);
        return;
      }
      // Med e-mailbekræftelse slået til svarer Supabase IKKE med en fejl for
      // en allerede registreret e-mail, men med en bruger uden identities
      // (beskytter mod at afsløre hvem der har en konto).
      const signedUp = data.user || data;
      if (Array.isArray(signedUp?.identities) && signedUp.identities.length === 0) {
        setEmailTakenError("Denne e-mail er allerede registreret.");
        setAuthLoading(false);
        return;
      }
      setUser(u => ({ ...u, email }));
      if (data.access_token) {
        // Uden e-mailbekræftelse (slået fra i Supabase): kontoen er aktiv
        // med det samme — gå direkte til onboarding trin 1.
        saveTokens(data.access_token, data.refresh_token, data.user.id);
        writePendingVerify("");
        if (setOnboardStep) setOnboardStep(1);
        setScreen(SCREENS.ONBOARD);
      } else {
        openVerifyScreen(email);
        setResendCooldown(60);
      }
    } catch {
      // Ægte, uventede fejl (netværk nede, JSON-parse-fejl osv.) — vis
      // ALDRIG browserens/JS'ens rå tekniske fejltekst til brugeren.
      setAuthError("Der opstod en fejl. Prøv igen.");
    }
    setAuthLoading(false);
  }, [loginPassword, saveTokens, setUser, setScreen, setOnboardStep, validateSignupFields, openVerifyScreen]);

  // Henter onboarding-status for en netop bekræftet konto og viser
  // "✓ E-mail bekræftet" (eller forsiden, hvis onboarding allerede er færdig).
  const finishVerification = useCallback(async (access, uid) => {
    writePendingVerify("");
    setVerifyError(""); setVerifyNotice("");
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${uid}&select=onboarding_completed,onboarding_step`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${access}`, Accept: "application/json" },
      });
      const p = (await res.json())?.[0];
      if (p?.onboarding_completed === true) { markOnboardedLocally(); setScreen(SCREENS.HOME); return; }
      setOnboardStep(p?.onboarding_step || 1);
    } catch { setOnboardStep(1); }
    setVerifyStatus("verified");
  }, [setScreen, setOnboardStep]);

  // "Jeg har bekræftet min e-mail": er linket åbnet i en anden fane i samme
  // browser, ligger sessionen allerede i localStorage. Ellers logges der ind
  // med adgangskoden fra oprettelsen (kun i hukommelsen, aldrig gemt). Er
  // appen genstartet siden, kendes adgangskoden ikke — så går brugeren til
  // Log ind med e-mailen udfyldt.
  const checkEmailVerified = useCallback(async () => {
    setVerifyError(""); setVerifyNotice("");
    const storedToken = localStorage.getItem("as_token");
    const storedUid = localStorage.getItem("as_user_id");
    let storedEmail = "";
    try { storedEmail = storedToken ? (decodeJwtPayload(storedToken).email || "").toLowerCase() : ""; } catch { /* ugyldigt token */ }
    // Kun en session for PRÆCIS denne e-mail — aldrig en anden kontos.
    if (storedToken && storedUid && storedEmail === verifyEmail.toLowerCase()) {
      setAccessToken(storedToken);
      setRefreshToken(localStorage.getItem("as_refresh"));
      setUserId(storedUid);
      setVerifyLoading(true);
      await finishVerification(storedToken, storedUid);
      setVerifyLoading(false);
      return;
    }
    if (!loginPassword) {
      setLoginEmail(verifyEmail);
      setAuthTab("login");
      setAuthError("");
      setAuthInfo("Log ind for at fortsætte opsætningen.");
      setScreen(SCREENS.LOGIN);
      return;
    }
    setVerifyLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: verifyEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        saveTokens(data.access_token, data.refresh_token, data.user.id);
        await finishVerification(data.access_token, data.user.id);
      } else {
        const msg = (data.msg || data.error_description || data.message || "").toLowerCase();
        setVerifyError(msg.includes("email not confirmed")
          ? "Vi kan ikke se, at e-mailen er bekræftet endnu. Tryk på linket i mailen, og prøv igen."
          : "Der opstod en fejl. Prøv igen.");
      }
    } catch {
      setVerifyError("Der opstod en fejl. Prøv igen.");
    }
    setVerifyLoading(false);
  }, [verifyEmail, loginPassword, saveTokens, finishVerification, setScreen]);

  // "Send mail igen" — Supabases resend-endpoint for signup-bekræftelse.
  const resendVerification = useCallback(async () => {
    if (!verifyEmail || resendCooldown > 0) return;
    setVerifyError(""); setVerifyNotice("");
    setVerifyLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/resend?redirect_to=${encodeURIComponent(window.location.origin + "/")}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ type: "signup", email: verifyEmail }),
      });
      if (res.ok) {
        setVerifyNotice("Vi har sendt en ny mail.");
        setResendCooldown(60);
      } else if (res.status === 429) {
        setVerifyError("Vent lidt, før du beder om en ny mail.");
        setResendCooldown(60);
      } else {
        setVerifyError("Mailen kunne ikke sendes. Prøv igen om lidt.");
      }
    } catch {
      setVerifyError("Der opstod en fejl. Prøv igen.");
    }
    setVerifyLoading(false);
  }, [verifyEmail, resendCooldown]);

  // Nedtælling til "Send mail igen" kan bruges igen.
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // "Skift e-mailadresse": tilbage til oprettelsesformularen med e-mailen
  // udfyldt, så den kan rettes. Den ubekræftede konto bliver aldrig aktiv.
  const changeVerifyEmail = useCallback(() => {
    writePendingVerify("");
    setLoginEmail(verifyEmail);
    setVerifyEmail(""); setVerifyStatus("pending");
    setVerifyError(""); setVerifyNotice("");
    setAuthTab("signup"); setAuthError(""); setAuthInfo("");
    setScreen(SCREENS.LOGIN);
  }, [verifyEmail, setScreen]);

  // "Fortsæt opsætning" efter bekræftelsen — onboarding fra det gemte trin.
  const continueAfterVerify = useCallback(() => {
    setVerifyStatus("pending"); setVerifyEmail("");
    setIsOAuth("email");
    setScreen(SCREENS.ONBOARD);
  }, [setScreen]);

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
    // Felt-specifik (27. sept. 2026) — dette tjek dækkes normalt allerede af
    // OnboardingScreen.jsx's egen guard før dette kald, men er bevaret her
    // som et sikkerhedsnet, nu rettet mod samme emailError-state i stedet
    // for den globale authError-boks.
    const email = loginEmail.trim().toLowerCase();
    if (!email) { setEmailError("Indtast din e-mail først."); return; }
    if (hasUnsupportedEmailChars(email)) { setEmailError("Brug en e-mailadresse uden æ, ø, å eller andre specialtegn."); return; }
    if (!isValidEmail(email)) { setEmailError("Indtast en gyldig e-mailadresse."); return; }
    setEmailError("");
    setAuthLoading(true); setAuthError("");
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) { setAuthError("Kunne ikke sende nulstillingslink. Prøv igen."); setAuthLoading(false); return; }
      showToast("Tjek din e-mail for at nulstille adgangskoden.", "success");
    } catch {
      setAuthError("Der opstod en fejl. Prøv igen.");
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
    authInfo, setAuthInfo,
    emailTakenError, setEmailTakenError,
    emailError, setEmailError,
    passwordError, setPasswordError,
    authLoading, setAuthLoading,
    authTab, setAuthTab,
    isOAuth, setIsOAuth,
    rememberMe, setRememberMe,
    saveTokens,
    clearAuth,
    handleLogin,
    handleSignup,
    verifyEmail, verifyStatus, verifyError, verifyNotice, verifyLoading, resendCooldown,
    checkEmailVerified, resendVerification, changeVerifyEmail, continueAfterVerify,
    handleOAuth,
    handleForgotPassword,
  };
}
