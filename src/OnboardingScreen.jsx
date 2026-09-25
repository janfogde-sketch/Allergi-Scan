// @ts-nocheck
import React, { useState } from "react";
import { ALLERGENS, SCREENS, DIETS, AVATAR_COLORS, E_NUMBERS, E_CATEGORIES } from "./constants.jsx";
import { initials } from "./helpers.js";
import { EatSafeLogo, Icon, showToast } from "./SharedComponents.jsx";
import { ENumberPicker } from "./AllergenPicker.jsx";
import { MemberForm } from "./MemberForm.jsx";
import { usePush } from "./usePush.js";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useFamilyFormContext } from "./FamilyFormContext.jsx";
import { useAllergenPrefsContext } from "./AllergenPrefsContext.jsx";
import { UI } from "./styleUtils.js";

function WelcomeIntro({ setScreen, setAuthTab }) {
  const goSignup = () => { setAuthTab("signup"); setScreen(SCREENS.LOGIN); };
  const goLogin  = () => { setAuthTab("login");  setScreen(SCREENS.LOGIN); };

  return (
    <div style={UI.udflex_fdcolumn_g10}>
      <button className="welcome-btn" onClick={goSignup}>Opret gratis konto</button>
      <button className="welcome-btn-ghost" onClick={goLogin}>Jeg har allerede en konto</button>
    </div>
  );
}

// 3 korte fordele med ikon (25. sept. 2026-brief) — "Tjek allergener",
// "Hurtigt svar", "Tryggere indkøb". Ikonerne matcher hver sin fordel:
// shield (beskyttelse mod allergener), zap (hurtighed), cart (indkøb).
// "Undgå" → "Tjek" (samme dag, opfølgning) — "Undgå" kan lyde som en
// garanti appen ikke kan give; "Tjek" beskriver mere præcist at appen
// hjælper med VURDERINGEN, ikke selve garantien.
const WELCOME_BENEFITS = [
  ["shield", "Tjek allergener"],
  ["zap",    "Hurtigt svar"],
  ["cart",   "Tryggere indkøb"],
];

export default function OnboardingScreen({
  onboardStep, setOnboardStep,
  tourIdx, setTourIdx,
  editMode, setEditMode,
  customInput, setCustomInput,
  saveAllergensStep2,
  saveProfileStep1, finishOnboard,
  StepBar,
  hasPendingJoinList,
  onActivatePreview,
}) {
  const {
    authTab, setAuthTab, authError, setAuthError, authLoading,
    loginEmail, setLoginEmail, loginPassword, setLoginPassword,
    user, setUser, isOAuth, accessToken,
    rememberMe, setRememberMe,
    handleLogin, handleSignup, handleOAuth, handleForgotPassword,
  } = useAuthContext();
  const {
    allergens, setAllergens, customAllerg, setCustomAllerg,
    family, setFamily, activeProfiles, setActiveProfiles,
  } = useProfileContext();
  const { screen, setScreen } = useNavigationContext();
  const {
    newMemberName, setNewMemberName,
    newMemberBirthYear, setNewMemberBirthYear,
    newMemberGender, setNewMemberGender,
    newMemberAllerg, setNewMemberAllerg,
    newMemberCustomAllerg, setNewMemberCustomAllerg,
    newMemberDiets, setNewMemberDiets,
    newMemberENumbers, setNewMemberENumbers,
    newMemberSubtypes, setNewMemberSubtypes,
    newMemberCustomInput, setNewMemberCustomInput,
    addMember, removeMember,
  } = useFamilyFormContext();
  const {
    selectedENumbers = [], setSelectedENumbers,
  } = useAllergenPrefsContext();

  // FIX: denne state manglede — brugtes i trin 2 (E-numre kollapsibel), men
  // var aldrig defineret, hvilket crashede hele onboarding-skærmen med
  // "showENumbersInOnboard is not defined" så snart man nåede dertil.
  const [showENumbersInOnboard, setShowENumbersInOnboard] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // FIX: disse hooks lå tidligere INDE i en betinget IIFE, som kun blev kaldt
  // når onboardStep === 5. Det bryder Reacts "Rules of Hooks" (hooks skal
  // altid kaldes i samme rækkefølge, uanset betingelser) og gav en
  // "Minified React error #310"-crash så snart man nåede til trin 5.
  // Løsningen er at flytte dem op på komponentens top-niveau, så de altid
  // kaldes, uanset hvilket trin man er på.
  const { supported: pushSupported, permission: pushPermission, subscribe: pushSubscribe } = usePush();
  const [pushDone, setPushDone] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushDeclined, setPushDeclined] = useState(false);

  const handleEnablePush = async () => {
    setPushLoading(true);
    const result = await pushSubscribe(accessToken);
    setPushLoading(false);
    if (result.ok || result.reason === "Tilladelse afvist") {
      setPushDone(true);
      setTimeout(() => setOnboardStep(6), 800);
    }
  };

  const renderStep1 = () => {
    const nameOk = (user.name||"").trim().length > 0;
    const emailOk = (user.email||loginEmail||"").trim().length > 0;
    const ageOk = (user.age||"").toString().trim().length > 0 && Number(user.age) > 0;
    const genderOk = !!(user.gender);
    const phoneOk = (user.phone||"").trim().length > 0;
    const allOk = nameOk && emailOk && ageOk && genderOk && phoneOk;
    const missingFields = [
      !nameOk && "navn",
      !emailOk && "email",
      !ageOk && "alder",
      !genderOk && "køn",
      !phoneOk && "telefon",
    ].filter(Boolean);
    return (
      <div className="fade-in">
        <div style={UI.mb14}>
          <div style={{ fontSize:19, fontWeight:900, color:"var(--ink)", marginBottom:4 }}>Hvem er du?</div>
          <div style={UI.ufs13_cmuted2_lh15}>Oplysningerne bruges til din personlige allergiprofil og kan redigeres senere.</div>
        </div>

        <div className="card" style={UI.mb12}>
          {/* Navn */}
          <div style={UI.mb12}>
            <label className="field-lbl">Fulde navn <span style={UI.red}>*</span></label>
            <input className="field" type="text" placeholder="Fx. Anna Hansen"
              value={user.name||""} onChange={e => setUser(u => ({...u, name:e.target.value}))}
              style={{ borderColor: !nameOk && (user.name !== undefined) ? "var(--red-md)" : undefined }} />
          </div>

          {/* Email */}
          <div style={UI.mb12}>
            <label className="field-lbl">Email <span style={UI.red}>*</span></label>
            <input className="field" type="email" placeholder="din@email.dk"
              value={user.email||loginEmail||""}
              onChange={e => setUser(u => ({...u, email:e.target.value}))}
              readOnly={!!(loginEmail || isOAuth)}
              style={{ opacity: (loginEmail || isOAuth) ? 0.6 : 1 }} />
            {isOAuth && (
              <div style={{ fontSize:10, color:"var(--green)", marginTop:3, display:"flex", alignItems:"center", gap:4 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                Bekræftet via Google
              </div>
            )}
          </div>

          {/* Telefon */}
          <div style={UI.mb12}>
            <label className="field-lbl">Telefonnummer <span style={UI.red}>*</span></label>
            <input className="field" type="tel" placeholder="+45 12 34 56 78"
              value={user.phone||""} onChange={e => setUser(u => ({...u, phone:e.target.value}))} />
          </div>

          {/* Alder */}
          <div style={UI.mb14}>
            <label className="field-lbl">Alder <span style={UI.red}>*</span></label>
            <input className="field" type="number" inputMode="numeric" placeholder="Fx. 32" min="1" max="120"
              value={user.age||""} onChange={e => setUser(u => ({...u, age:e.target.value}))}
              style={{ maxWidth:120 }} />
          </div>

          {/* Køn */}
          <div>
            <label className="field-lbl">Køn <span style={UI.red}>*</span></label>
            <div style={UI.udflex_g6_flewrap}>
              {["Mand","Kvinde","Andet","Vil ikke oplyse"].map(g => (
                <div key={g} onClick={() => setUser(u => ({...u, gender:g}))}
                  style={{
                    padding:"10px 14px", borderRadius:8, cursor:"pointer",
                    border:`1px solid ${user.gender===g ? "var(--green)" : "var(--border)"}`,
                    background: user.gender===g ? "var(--green-lt)" : "var(--surface)",
                    fontSize:13, fontWeight:700,
                    color: user.gender===g ? "var(--green)" : "var(--muted)",
                    transition:"all .15s",
                  }}>
                  {g}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Validering */}
        {!allOk && missingFields.length > 0 && (
          <div style={{ fontSize:12, color:"var(--muted)", textAlign:"center", marginBottom:10 }}>
            Mangler: {missingFields.join(", ")}
          </div>
        )}

        <button className="btn btn-primary btn-full"
          disabled={!allOk}
          style={{ opacity: allOk ? 1 : 0.45 }}
          onClick={() => allOk && saveProfileStep1().then(() => setOnboardStep(2))}>
          Fortsæt →
        </button>
      </div>
    );
  };

  return (
    <>
        {screen === SCREENS.WELCOME && (
          <div className="welcome-screen fade-in">
            {/* Logo + værdiforslag (25. sept. 2026-brief: kort, tydelig
                value proposition i stedet for den tidligere slogan-agtige
                "Scan. Tjek. Spis trygt.") */}
            <div className="welcome-logo-wrap" style={UI.mb16}>
              <EatSafeLogo size={72} variant="light" />
              <div className="welcome-wordmark">
                <span className="welcome-wordmark-text">Eat<span>Safe</span></span>
              </div>
              <div className="welcome-tagline">Scan produkter og se straks, om de matcher dine allergier.</div>
            </div>

            {/* 3 fordele */}
            <div className="welcome-benefits">
              {WELCOME_BENEFITS.map(([icon, label]) => (
                <div key={label} className="welcome-benefit">
                  <div className="welcome-benefit-icon"><Icon name={icon} size={20} color="#0E8F5A" /></div>
                  <div className="welcome-benefit-label">{label}</div>
                </div>
              ))}
            </div>

            {/* Delt indkøbsliste venter */}
            {hasPendingJoinList && (
              <div style={{ background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:12, padding:"12px 14px", marginBottom:16, textAlign:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, fontWeight:800, color:"var(--green)" }}><Icon name="cart" size={13} color="var(--green)" /> Du er blevet inviteret til en indkøbsliste</div>
                <div style={{ fontSize:12, color:"var(--green)", marginTop:2 }}>Opret en gratis konto for at få adgang til den</div>
              </div>
            )}

            {/* CTA — primær (grøn, mest fremtrædende) + sekundær */}
            <WelcomeIntro setScreen={setScreen} setAuthTab={setAuthTab} />

            {/* Tertiær tekstlink, ikke en knap (25. sept. 2026-brief). Kun i
                den delte Artifact-preview-build (se CLAUDE.md), aldrig i den
                rigtige app — login mod Supabase er upålideligt fra denne
                kontekst (andet domæne end produktion), så en preview-only
                genvej springer login over. Selve mock-opsætningen (bruger,
                allergener, produkt-cache, indkøbsliste) sker i App.jsx's
                activatePreviewMode — se dens kommentar for hvorfor logikken
                bor der og ikke her. */}
            {import.meta.env.MODE === "artifact-preview" && (
              <button className="welcome-link" style={{ marginTop:12 }}
                onClick={onActivatePreview}>
                Se app uden login (preview)
              </button>
            )}

            {/* Privacy — diskret småprint nederst. "Handelsbetingelser" er
                bevidst ikke et link (25. sept. 2026) — der findes endnu ikke
                en selvstændig vilkårs-side i public/ (kun privacy.html), så
                et link ville pege på en ikke-eksisterende side. Egen
                text-shadow-løft (ikke en del af det globale sæt i theme.jsx)
                — denne tekst sidder tættest på skærmens nederste kant, hvor
                vignet-effekten (theme.jsx's .app-bg) er svagest og billedet
                mest tydeligt, så den har mest brug for et løft. */}
            <div style={{ marginTop:16, fontSize:11, color:"var(--muted)", lineHeight:1.6, textAlign:"center", textShadow:"0 1px 0 rgba(255,255,255,.7)" }}>
              Ved at oprette en konto accepterer du vores{" "}
              <a href="/privacy.html" target="_blank" style={{ color:"var(--green)", fontWeight:600 }}>privatlivspolitik</a>
              {" "}og handelsbetingelser.
            </div>
          </div>
        )}

        {/* ══ LOGIN / REGISTRERING ══ */}
        {/* 25. sept. 2026-brief ("Opret konto" + "Log ind — final version"):
            hvidt formular-kort (.login-card), baggrunden dæmpet yderligere
            på denne skærm (.app-bg-dim i App.jsx), "Adgangskode" i stedet
            for "Kodeord" overalt, ét enkelt "Eller fortsæt med"-separator i
            stedet for to "eller"-linjer, og tre neutrale/hvide sociale
            login-knapper (Google/Apple/Facebook) — ingen af dem må være
            visuelt stærkere end den grønne primær-CTA (.welcome-btn,
            genbrugt her for samme farvepalet/vægt som velkomstskærmen). */}
        {screen === SCREENS.LOGIN && (
          <div className="login-wrap fade-in">

            {/* Logo — genbruger PRÆCIS samme markup/klasser som velkomst-
                skærmen (welcome-logo-wrap/-wordmark/-wordmark-text), i
                stedet for de tidligere separate login-shield/login-title-
                klasser (mindre logo, kursiv "Safe") — 25. sept. 2026-brief:
                "1:1 i brandudtryk", "Safe må ikke være kursiv". */}
            <div className="welcome-logo-wrap">
              <EatSafeLogo size={72} variant="light" />
              <div className="welcome-wordmark">
                <span className="welcome-wordmark-text">Eat<span>Safe</span></span>
              </div>
            </div>

            {/* Tab vælger — se .tab-row/.tab.active i theme.jsx for den
                tydeligere-men-rolige aktiv-markering (25. sept. 2026). */}
            <div className="tab-row">
              <div className={`tab${authTab==="signup"?" active":""}`} onClick={() => { setAuthTab("signup"); setAuthError(""); }}>Ny bruger</div>
              <div className={`tab${authTab==="login"?" active":""}`} onClick={() => { setAuthTab("login"); setAuthError(""); }}>Log ind</div>
            </div>

            {/* SIGNUP flow */}
            {authTab === "signup" && (
              <div className="fade-in">
                {hasPendingJoinList && (
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:10, padding:"10px 12px", marginBottom:14, textAlign:"center", fontSize:12, fontWeight:700, color:"var(--green)" }}>
                    <Icon name="cart" size={13} color="var(--green)" /> En indkøbsliste venter på dig — den bliver tilføjet, når du er oprettet
                  </div>
                )}
                <div style={UI.utacenter_mb16}>
                  <div style={UI.ufs15_fw700_cink}>Opret din konto</div>
                  <div style={UI.ufs12_cmuted_mt4}>Du opsætter dine allergier i næste trin.</div>
                </div>
                <div className="login-card">
                  <label className="field-lbl">E-mail</label>
                  <input className="field" type="email" placeholder="din@email.dk" value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)} style={UI.mb12}
                    onKeyDown={e => e.key==="Enter" && handleSignup()} />
                  <label className="field-lbl">Adgangskode</label>
                  <div style={{ position:"relative" }}>
                    <input className="field" type={showPassword ? "text" : "password"} placeholder="Minimum 10 tegn" value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)} style={{ paddingRight:40 }}
                      onKeyDown={e => e.key==="Enter" && handleSignup()} />
                    <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Skjul adgangskode" : "Vis adgangskode"}
                      style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
                      <Icon name={showPassword ? "eyeOff" : "eye"} size={16} color="var(--muted)" />
                    </button>
                  </div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:8, lineHeight:1.5 }}>
                    Ved at oprette en konto accepterer du vores vilkår og bekræfter, at du er over 13 år.
                  </div>
                </div>
                {authError && (
                  <div className="error-box" style={UI.ufdcolumn_aiflexstar_g4}>
                    <span style={{ ...UI.ufw800, display:"flex", alignItems:"center", gap:6 }}><Icon name="warning" size={12} color="var(--red)" /> Fejl</span>
                    <span style={UI.ufw500_fs12_lh15}>{authError}</span>
                  </div>
                )}
                <button className="btn welcome-btn" onClick={handleSignup} disabled={authLoading}>
                  {authLoading ? "Opretter konto…" : "Opret konto og fortsæt →"}
                </button>
                <div style={UI.utacenter_mt12_fs12_cmuted}>
                  Har du allerede en konto?{" "}
                  <span style={UI.ucgreen_fw700_curpointer} onClick={() => { setAuthTab("login"); setAuthError(""); }}>
                    Log ind
                  </span>
                </div>
              </div>
            )}

            {/* LOGIN flow */}
            {authTab === "login" && (
              <div className="fade-in">
                <div style={UI.utacenter_mb16}>
                  <div style={UI.ufs15_fw700_cink}>Velkommen tilbage</div>
                  <div style={UI.ufs12_cmuted_mt4}>Log ind med din e-mail og adgangskode.</div>
                </div>
                <div className="login-card">
                  <label className="field-lbl">E-mail</label>
                  <input className="field" type="email" placeholder="din@email.dk" value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)} style={UI.mb12}
                    onKeyDown={e => e.key==="Enter" && handleLogin()} />
                  <label className="field-lbl">Adgangskode</label>
                  <div style={{ position:"relative" }}>
                    <input className="field" type={showPassword ? "text" : "password"} placeholder="Din adgangskode" value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)} style={{ paddingRight:40 }}
                      onKeyDown={e => e.key==="Enter" && handleLogin()} />
                    <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Skjul adgangskode" : "Vis adgangskode"}
                      style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
                      <Icon name={showPassword ? "eyeOff" : "eye"} size={16} color="var(--muted)" />
                    </button>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:12 }}>
                    <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12.5, fontWeight:600, color:"var(--ink2)", cursor:"pointer" }}>
                      <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                        style={{ width:16, height:16, accentColor:"#0E8F5A", cursor:"pointer" }} />
                      Husk mig
                    </label>
                    <button type="button" onClick={handleForgotPassword} disabled={authLoading}
                      style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"var(--f)", fontSize:12.5, fontWeight:600, color:"#0E8F5A", textDecoration:"underline", textUnderlineOffset:"2px", padding:0 }}>
                      Glemt adgangskode?
                    </button>
                  </div>
                </div>
                {authError && (
                  <div className="error-box" style={UI.ufdcolumn_aiflexstar_g4}>
                    <span style={{ ...UI.ufw800, display:"flex", alignItems:"center", gap:6 }}><Icon name="warning" size={12} color="var(--red)" /> Fejl</span>
                    <span style={UI.ufw500_fs12_lh15}>{authError}</span>
                  </div>
                )}
                <button className="btn welcome-btn" onClick={handleLogin} disabled={authLoading}>
                  {authLoading ? "Logger ind…" : "Log ind →"}
                </button>
                <div style={UI.utacenter_mt12_fs12_cmuted}>
                  Har du ikke en konto?{" "}
                  <span style={UI.ucgreen_fw700_curpointer} onClick={() => { setAuthTab("signup"); setAuthError(""); }}>
                    Opret konto
                  </span>
                </div>
              </div>
            )}

            {/* Ét enkelt separator (25. sept. 2026 — var tidligere to
                "eller"-linjer, én før og én efter de sociale knapper). */}
            <div style={{ display:"flex", alignItems:"center", gap:10, margin:"16px 0 10px" }}>
              <div style={UI.hr} />
              <span style={{ fontSize:12, color:"var(--muted)", fontWeight:600 }}>Eller fortsæt med</span>
              <div style={UI.hr} />
            </div>

            {/* Sociale login-knapper — hvide/neutrale (.social-btn, theme.jsx),
                aldrig visuelt stærkere end den grønne primær-CTA ovenfor. */}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {/* Google */}
              <button className="social-btn" onClick={() => handleOAuth("google")} disabled={authLoading}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Fortsæt med Google
              </button>

              {/* Apple */}
              <button className="social-btn" onClick={() => handleOAuth("apple")} disabled={authLoading}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#000">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zm3.415-3.132c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.817-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.7z"/>
                </svg>
                Fortsæt med Apple
              </button>

              {/* Facebook — kun det blå "f"-mærke, ikke en fyldt blå knap
                  (25. sept. 2026-brief: "undgå en stor blå Facebook-knap,
                  fordi den stjæler fokus fra EatSafe"). */}
              <button className="social-btn" onClick={() => handleOAuth("facebook")} disabled={authLoading}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Fortsæt med Facebook
              </button>
            </div>
          </div>
        )}

        {/* ══ ONBOARDING ══ */}
        {(screen === SCREENS.ONBOARD || editMode) && (
          <div className="onboard-wrap fade-in">
            {!editMode && (
              <div style={{ textAlign:"center", padding:"4px 0 20px" }}>
                <div style={UI.mb6}><EatSafeLogo size={40} variant="light" /></div>
                <div style={{ fontSize:20, fontWeight:800, color:"var(--ink)" }}>Opsæt din profil</div>
                <div style={{ fontSize:13, color:"var(--muted)", marginTop:4 }}>Tager under 2 minutter</div>
              </div>
            )}
            {editMode && <div style={{ height:4 }} />}
            {/* Step header med tilbage og fremgang */}
            <div style={UI.udflex_aicenter_g10_mb8}>
              {onboardStep > 1 && (
                <button onClick={() => setOnboardStep(onboardStep - 1)}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:"4px 0", flexShrink:0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2">
                    <path strokeLinecap="round" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
              )}
              <div style={UI.flex1}>
                {onboardStep > 0 && <StepBar total={5} current={onboardStep} />}
              </div>
            </div>

            {/* ── TRIN 1: Din profil (obligatorisk) ── */}
            {onboardStep === 1 && renderStep1()}

            {/* ── TRIN 2: Dine allergier / intolerancer ── */}
            {onboardStep === 2 && (
              <div className="fade-in">
                <div className="card">
                  <div className="step-title">Allergier / intolerancer</div>

                  <div style={{ fontSize:11, color:"var(--muted)", marginBottom:12, lineHeight:1.4 }}>
                    Tryk for at markere en allergi eller intolerance
                  </div>

                  <div className="chip-grid">
                    {ALLERGENS.map(a => {
                      const on = allergens.includes(a.id);
                      return (
                        <div key={a.id} className="chip" style={{
                          background: on ? "var(--red-lt)" : "var(--paper2)",
                          border: `1px solid ${on ? "var(--red)" : "var(--border)"}`,
                          color: on ? "var(--red)" : "var(--ink)",
                        }}
                          onClick={() => setAllergens(p => on ? p.filter(x => x !== a.id) : [...p, a.id])}>
                          <span style={UI.flex1}>{a.emoji} {a.label}</span>
                          {on && <div style={UI.redBadge9}><Icon name="check" size={9} color="#fff" /></div>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Skriv selv */}
                  <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid var(--border)" }}>
                    <div style={UI.sectionLbl6}>Kan ikke finde din allergi eller din intolerance?</div>
                    <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8, lineHeight:1.6 }}>
                      Tilføj selv — enten en hel allergikategori (fx. "Fructose") eller en specifik ingrediens du reagerer på (fx. "Kasein", "Sorbitol", "Hvede-kimolie"). Vi fremhæver det i ingredienslister.
                    </div>
                    <div className="input-row" style={{ marginBottom: customAllerg.length ? 8 : 0 }}>
                      <input className="field" placeholder="Fx. Fructose…" value={customInput}
                        onChange={e => setCustomInput(e.target.value)}
                        onKeyDown={e => { if (e.key==="Enter"&&customInput.trim()) { setCustomAllerg(c=>[...c,customInput.trim()]); setCustomInput(""); }}} />
                      <button className="btn btn-outline btn-sm" onClick={() => { if(customInput.trim()){ setCustomAllerg(c=>[...c,customInput.trim()]); setCustomInput(""); }}}>+</button>
                    </div>
                    {customAllerg.length > 0 && (
                      <div className="tags">
                        {customAllerg.map((a,i) => (
                          <div key={i} className="tag">{a}<span className="tag-x" role="button" aria-label={`Fjern "${a}"`} tabIndex={0}
                            onClick={() => setCustomAllerg(c=>c.filter(x=>x!==a))} onKeyDown={e => e.key === "Enter" && setCustomAllerg(c=>c.filter(x=>x!==a))}>×</span></div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── E-numre: kollapsibel ── */}
                <div style={{ marginTop:12, borderTop:"1px solid var(--border)", paddingTop:12 }}>
                  <button
                    onClick={() => setShowENumbersInOnboard(s => !s)}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", background:"none", border:"none", cursor:"pointer", padding:"4px 0", fontFamily:"var(--f)" }}>
                    <div style={UI.udflex_aicenter_g8}>
                      <span style={UI.fs16}>🔢</span>
                      <div style={{ textAlign:"left" }}>
                        <div style={UI.ufs13_fw700_cink}>
                          Overvåg specifikke E-numre
                          {selectedENumbers.length > 0 && <span style={{ fontSize:11, color:"var(--amber)", marginLeft:6 }}>{selectedENumbers.length} valgt</span>}
                        </div>
                        <div style={UI.muted11}>Valgfrit — kan altid tilføjes senere</div>
                      </div>
                    </div>
                    <span style={{ fontSize:18, color:"var(--muted)", transform: showENumbersInOnboard ? "rotate(180deg)" : "none", transition:".2s" }}>⌄</span>
                  </button>
                  {showENumbersInOnboard && (
                    <div style={UI.mt12}>
                      <ENumberPicker selected={selectedENumbers} onChange={setSelectedENumbers} />
                    </div>
                  )}
                </div>

                <button className="btn btn-primary btn-full" style={UI.mt12} onClick={async () => {
                  try { await saveAllergensStep2(); setOnboardStep(3); }
                  catch { showToast("Dine allergier kunne ikke gemmes. Tjek din forbindelse og prøv igen.", "error"); }
                }}>Fortsæt →</button>
                {allergens.length === 0 && customAllerg.length === 0 ? (
                  <button style={{ width:"100%", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--f)", fontSize:12, color:"var(--muted)", padding:"10px 0", marginTop:2 }}
                    onClick={() => {
                      if (window.confirm("Er du sikker på, at du ingen allergier eller intolerancer har? Du kan altid tilføje dem senere under Profil.")) {
                        saveAllergensStep2().then(() => setOnboardStep(3))
                          .catch(() => showToast("Kunne ikke gemme. Tjek din forbindelse og prøv igen.", "error"));
                      }
                    }}>
                    Spring over — jeg har ingen allergier
                  </button>
                ) : (
                  <div style={{ textAlign:"center", fontSize:12, color:"var(--muted)", marginTop:6 }}>
                    {allergens.length + customAllerg.length} allergi{allergens.length + customAllerg.length !== 1 ? "er" : ""} valgt
                  </div>
                )}
              </div>
            )}

            {/* ── TRIN 7: Familie ── */}
            {onboardStep === 4 && (
              <div className="fade-in">
                <div className="step-title" style={UI.utacenter}>Familiemedlemmer</div>
                <div style={{ fontSize:13, color:"var(--muted2)", textAlign:"center", marginBottom:16 }}>Tilføj familiemedlemmer med egne allergier. Valgfrit.</div>

                {/* Allerede tilføjede */}
                {family.length > 0 && (
                  <div className="card" style={UI.mb12}>
                    {family.map(m => (
                      <div key={m.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
                        <div className="fm-avatar" style={{ background:m.color, color:"var(--ink)" }}>{initials(m.name)}</div>
                        <div style={UI.flex1}>
                          <div style={{ fontWeight:800, fontSize:14 }}>{m.name}</div>
                          <div style={UI.muted11mt2}>
                            {m.allergens.length ? m.allergens.map(id => ALLERGENS.find(a=>a.id===id)?.label).join(", ") : "Ingen allergier"}
                          </div>
                        </div>
                        <div onClick={() => removeMember(m.id)} style={{ cursor:"pointer", opacity:.4 }}>
                          <Icon name="trash" size={18} color="var(--muted)" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tilføj nyt medlem */}
                <div className="card" style={UI.mb12}>
                  <div className="card-lbl" style={UI.mb12}>Tilføj nyt familiemedlem</div>
                  <MemberForm
                    name={newMemberName} setName={setNewMemberName}
                    birthYear={newMemberBirthYear} setBirthYear={setNewMemberBirthYear}
                    gender={newMemberGender} setGender={setNewMemberGender}
                    allergens={newMemberAllerg} setAllergens={setNewMemberAllerg}
                    customAllerg={newMemberCustomAllerg} setCustomAllerg={setNewMemberCustomAllerg}
                    subtypes={newMemberSubtypes} setSubtypes={setNewMemberSubtypes}
                    diets={newMemberDiets} setDiets={setNewMemberDiets}
                    eNumbers={newMemberENumbers} setENumbers={setNewMemberENumbers}
                    customInput={newMemberCustomInput} setCustomInput={setNewMemberCustomInput}
                    onAdd={addMember}
                    addLabel={`+ Tilføj ${newMemberName||"familiemedlem"}`}
                  />
                </div>

                <button className="btn btn-primary btn-full" onClick={() => setOnboardStep(5)}>Fortsæt →</button>
                <div className="onboard-skip">Kan springes over</div>
              </div>
            )}

            {/* ── TRIN 5: Push-notifikationer ── */}
            {onboardStep === 5 && (
                <div className="fade-in">
                  <div style={{ textAlign:"center", padding:"16px 0 20px" }}>
                    <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}><Icon name="bell" size={42} color="var(--green)" /></div>
                    <div style={{ fontSize:20, fontWeight:900, color:"var(--ink)", marginBottom:8 }}>Bliv opdateret</div>
                    <div style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.65 }}>
                      Få en notifikation når dine produktindsendelser godkendes, og når familiemedlemmer tilslutter sig.
                    </div>
                  </div>

                  <div className="card" style={UI.mb16}>
                    {[
                      ["check","Produktet er godkendt","Når admin godkender dit indsendte produkt"],
                      ["family","Familie tilslutter sig","Når nogen accepterer dit invitationslink"],
                      ["search","Nyt i databasen","Når et produkt du søgte efter nu er tilgængeligt"],
                    ].map(([icon, title, sub]) => (
                      <div key={title} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
                        <div style={{ display:"flex", alignItems:"center" }}><Icon name={icon} size={19} color="var(--green)" /></div>
                        <div>
                          <div style={UI.ufs13_fw700_cink}>{title}</div>
                          <div style={UI.muted11mt2}>{sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {!pushSupported ? (
                    <button className="btn btn-primary btn-full" onClick={() => setOnboardStep(6)}>
                      Fortsæt →
                    </button>
                  ) : pushDone ? (
                    <button className="btn btn-primary btn-full" disabled style={{ opacity:.7, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                      <Icon name="check" size={14} color="var(--on-green)" /> Notifikationer aktiveret
                    </button>
                  ) : (
                    <>
                      <button className="btn btn-primary btn-full" onClick={handleEnablePush} disabled={pushLoading}
                        style={{ opacity: pushLoading ? .6 : 1, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                        {pushLoading ? "Aktiverer…" : <><Icon name="bell" size={14} color="var(--on-green)" /> Slå notifikationer til</>}
                      </button>
                      <button className="btn btn-ghost btn-full" style={UI.mt8}
                        onClick={() => setOnboardStep(6)}>
                        Ikke nu
                      </button>
                    </>
                  )}
                </div>
            )}

            {/* ── TRIN 6: Diæt ── */}
            {onboardStep === 3 && (
              <div className="step fade-in">
                <div className="step-title">Din diæt</div>
                <div style={{ fontSize:13, color:"var(--muted2)", marginBottom:16, lineHeight:1.5 }}>
                  Vælg din diæt så vi kan filtrere produkter og opskrifter til dig.
                </div>
                <div className="chip-grid" style={UI.mb12}>
                  {DIETS.map(d => { const on = (user.diets||[]).includes(d.id); return (
                    <div key={d.id} className={`chip${on?" on":""}`}
                      onClick={() => setUser(u => ({ ...u, diets: on ? (u.diets||[]).filter(x=>x!==d.id) : [...(u.diets||[]), d.id] }))}>
                      <div style={UI.flex1}>
                        <div style={UI.ufw700}>{d.label}</div>
                        <div style={UI.muted11mt2}>{d.desc}</div>
                      </div>
                      {on && <div className="chip-check"><Icon name="check" size={9} color="var(--on-green)" /></div>}
                    </div>
                  );})}
                </div>
                <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.5, marginBottom:20 }}>
                  Diæt-tjek er vejledende og baseret på produkttags. Tjek altid ingredienserne selv.
                </div>
                <button className="btn btn-primary btn-full" onClick={() => setOnboardStep(4)}>Fortsæt →</button>
                <button className="btn btn-ghost btn-full btn-sm" style={UI.mt8} onClick={() => { setUser(u => ({...u, diets:[]})); setOnboardStep(4); }}>Ingen særlig diæt</button>
              </div>
            )}

            {/* ── TRIN 9: Oversigt & Klar! ── */}
            {onboardStep === 6 && (
              <div className="fade-in">

                {/* Header */}
                <div style={{ textAlign:"center", padding:"8px 0 20px" }}>
                  <div style={{ width:64, height:64, borderRadius:"50%", background:"var(--green-lt)",
                    display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
                    <Icon name="check" size={32} color="var(--green)" />
                  </div>
                  <div style={{ fontSize:24, fontWeight:900, color:"var(--ink)", marginBottom:6 }}>Alt er klar!</div>
                  <div style={{ fontSize:14, color:"var(--muted2)", lineHeight:1.6 }}>
                    Her er et overblik over din profil. Du kan altid redigere senere.
                  </div>
                </div>

                {/* Din profil */}
                <div className="card" style={UI.mb12}>
                  <div style={UI.udflex_aicenter_jcspacebet_mb12}>
                    <div style={{ fontWeight:800, fontSize:15, color:"var(--ink)" }}>
                      {user.name || "Din profil"}
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize:12, padding:"4px 10px" }}
                      onClick={() => setOnboardStep(1)}>
                      Rediger
                    </button>
                  </div>

                  {/* Allergier */}
                  {allergens.length > 0 ? (
                    <div style={UI.mb10}>
                      <div style={UI.sectionLbl6}>
                        Allergier / intolerancer
                      </div>
                      <div style={UI.wrapGap5}>
                        {allergens.map(id => {
                          const a = ALLERGENS.find(x=>x.id===id);
                          return (
                            <div key={id} style={{ padding:"6px 10px", borderRadius:20, fontSize:12, fontWeight:700,
                              background:"var(--red-lt)", color:"var(--red)",
                              border:"1px solid var(--red-md)" }}>
                              {a?.emoji} {a?.label}
                            </div>
                          );
                        })}
                        {customAllerg.map((c,i) => (
                          <div key={i} style={{ padding:"6px 10px", borderRadius:20, fontSize:12, fontWeight:700,
                            background:"var(--paper2)", color:"var(--muted)", border:"1px solid var(--border)" }}>
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize:12, color:"var(--muted)", marginBottom:8 }}>Ingen allergier registreret</div>
                  )}

                  {/* Diæt */}
                  {user.diets && user.diets.length > 0 && (
                    <div style={UI.mb10}>
                      <div style={UI.sectionLbl6}>Diæt</div>
                      <div style={UI.wrapGap5}>
                        {user.diets.map(d => (
                          <div key={d} style={{ padding:"6px 10px", borderRadius:20, fontSize:12, fontWeight:700,
                            background:"var(--green-lt)", color:"var(--green)", border:"1px solid var(--green-mid)" }}>
                            {DIETS.find(x=>x.id===d)?.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* E-numre */}
                  {selectedENumbers.length > 0 && (
                    <div>
                      <div style={UI.sectionLbl6}>E-numre der undgås</div>
                      <div style={UI.ufs12_cmuted2}>{selectedENumbers.length} E-numre valgt</div>
                    </div>
                  )}
                </div>

                {/* Familiemedlemmer */}
                {family.length > 0 && (
                  <div style={UI.mb12}>
                    <div style={UI.ufs13_fw700_cink_mb8}>Familiemedlemmer</div>
                    {family.map(m => (
                      <div key={m.id} className="card" style={{ marginBottom:8, padding:"12px 14px" }}>
                        <div style={UI.udflex_aicenter_g10}>
                          <div className="fm-avatar" style={{ background:m.color, color:"var(--ink)", flexShrink:0 }}>
                            {initials(m.name)}
                          </div>
                          <div style={UI.flex1}>
                            <div style={{ fontWeight:800, fontSize:14, color:"var(--ink)" }}>{m.name}</div>
                            <div style={UI.muted11mt2}>
                              {m.allergens.length
                                ? m.allergens.map(id=>ALLERGENS.find(a=>a.id===id)?.label).join(", ")
                                : "Ingen allergier"}
                            </div>
                          </div>
                          <button className="btn btn-ghost btn-sm" style={{ fontSize:12, padding:"4px 10px", flexShrink:0 }}
                            onClick={() => { setScreen(SCREENS.FAMILY); }}>
                            Rediger
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {family.length === 0 && (
                  <div className="card" style={{ marginBottom:12, textAlign:"center", padding:"14px" }}>
                    <div style={UI.ufs13_cmuted2_mb8}>Ingen familiemedlemmer tilføjet</div>
                    <button className="btn btn-outline btn-sm" onClick={() => setOnboardStep(4)}>
                      + Tilføj familiemedlem
                    </button>
                  </div>
                )}

                {/* Fællesskab-card */}
                <div style={{ background:"var(--warm-lt)", border:"1px solid var(--warm-md)", borderRadius:14, padding:"16px 18px", marginBottom:12, display:"flex", gap:12, alignItems:"flex-start" }}>
                  <div style={UI.ufs28_shr0}>🤝</div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:"var(--ink)", marginBottom:4 }}>Du er nu en del af fællesskabet</div>
                    <div style={UI.muted2_12lh}>Når du scanner ukendte produkter og indsender data, hjælper du alle andre med de samme allergier. Tak!</div>
                  </div>
                </div>

                {/* Disclaimer */}
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"center", gap:6, fontSize:11, color:"var(--muted)", lineHeight:1.5, marginBottom:16, textAlign:"center", padding:"0 8px" }}>
                  <Icon name="info" size={12} color="var(--muted)" /> EatSafe er vejledende og erstatter ikke medicinsk rådgivning. Tjek altid produktets emballage.
                </div>

                {/* Afslut */}
                <button className="btn btn-primary btn-full" style={{ marginTop:4, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }} onClick={finishOnboard}>
                  {editMode ? <><Icon name="check" size={14} color="var(--on-green)" /> Gem ændringer</> : "Gå til appen →"}
                </button>
                {editMode && (
                  <button className="btn btn-outline btn-full" style={UI.mt8}
                    onClick={() => { setEditMode(false); setScreen(SCREENS.PROFILE); }}>
                    Annuller
                  </button>
                )}
              </div>
            )}

                    </div>
        )}

    </>
  );
}
