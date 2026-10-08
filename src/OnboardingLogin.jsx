// @ts-nocheck
import React from "react";
import { SCREENS } from "./constants.jsx";
import { PASSWORD_REQUIREMENTS_TEXT } from "./helpers.js";
import { EatSafeLogo, Icon } from "./SharedComponents.jsx";
import { TextLink, ErrorMessage } from "./DesignSystem.jsx";
import { isValidEmail } from "./useAuth.js";
import { UI } from "./styleUtils.js";
import { LEGAL_LINK_STYLE } from "./OnboardingParts.jsx";

export function renderLogin(c) {
  const { authError, authInfo, authLoading, authTab, emailError, emailTakenError, handleForgotPassword, handleLogin, handleOAuth, handleSignup, hasPendingJoinList, loginEmail, loginPassword, oauthProviders, openLegal, passwordError, setAuthError, setAuthTab, setEmailError, setEmailTakenError, setLoginEmail, setLoginPassword, setOnboardStep, setPasswordError, setScreen, setShowPassword, showPassword } = c;
  return (
          <div className="login-wrap fade-in">

            {/* Logo — genbruger PRÆCIS samme markup/klasse som velkomst-
                skærmen (welcome-logo-wrap), og samme faste logo-asset
                (EatSafeLogo, se SharedComponents.jsx) — "1:1 i brandudtryk". */}
            <div className="welcome-logo-wrap">
              <EatSafeLogo variant="horizontal" size={56} />
            </div>

            {/* Tab vælger — se .tab-row/.tab.active i theme.jsx for den
                tydeligere-men-rolige aktiv-markering (25. sept. 2026). */}
            <div className="tab-row">
              <div className={`tab${authTab==="signup"?" active":""}`} onClick={() => { setAuthTab("signup"); setAuthError(""); setEmailTakenError(""); setEmailError(""); setPasswordError(""); }}>Ny bruger</div>
              <div className={`tab${authTab==="login"?" active":""}`} onClick={() => { setAuthTab("login"); setAuthError(""); setEmailTakenError(""); setEmailError(""); setPasswordError(""); }}>Log ind</div>
            </div>

            {/* Preview-only genvej til onboarding-flowet (25. sept. 2026,
                samme dag) — springer signup/login helt over og går direkte
                til SCREENS.ONBOARD trin 1, til at designe/gennemgå
                onboarding-trinnene uden at skulle oprette en rigtig konto
                først. Samme mønster/gate som "Se app uden login (preview)"
                på velkomstskærmen — vises ALDRIG i produktion. */}
            {import.meta.env.MODE === "artifact-preview" && (
              <button className="welcome-link" style={{ display:"block", margin:"0 auto 14px", textAlign:"center" }}
                onClick={() => { setOnboardStep(1); setScreen(SCREENS.ONBOARD); }}>
                Gå til onboarding (preview)
              </button>
            )}

            {/* SIGNUP flow */}
            {authTab === "signup" && (
              <div className="fade-in">
                {hasPendingJoinList && (
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:10, padding:"10px 12px", marginBottom:14, textAlign:"center", fontSize:12, fontWeight:700, color:"var(--green)" }}>
                    <Icon name="cart" size={13} color="var(--green)" /> En delt indkøbsliste venter på dig. Når du er oprettet, forklarer vi, hvad der deles, og du bestemmer selv, om du tilslutter
                  </div>
                )}
                <div style={UI.utacenter_mb16}>
                  <div style={UI.ufs15_fw700_cink}>Opret din konto</div>
                  <div style={UI.ufs12_cmuted_mt4}>Bagefter fortæller du lidt om dig selv og dine allergier.</div>
                </div>
                <div className="login-card">
                  {/* E-mail — 27. sept. 2026, "FINAL 10/10 POLISH": ALLE
                      felt-specifikke e-mail-fejl (tom/ugyldig e-mail,
                      allerede registreret) vises inline direkte her, med en
                      diskret rød kant på selve feltet — IKKE i den store,
                      globale error-boks (authError) nedenfor, som nu kun
                      bruges til fejl der ikke kan knyttes til ét felt (fx
                      "Der opstod en fejl. Prøv igen."). */}
                  <label className="field-lbl" htmlFor="signup-email">E-mail</label>
                  <input id="signup-email" name="email" className="field" type="email" autoComplete="email" placeholder="din@email.dk" value={loginEmail}
                    aria-invalid={!!(emailError || emailTakenError)}
                    onChange={e => { setLoginEmail(e.target.value); if (emailError) setEmailError(""); if (emailTakenError) setEmailTakenError(""); }}
                    style={{ marginBottom: (emailError || emailTakenError) ? 6 : 12, borderColor: (emailError || emailTakenError) ? "var(--red-md)" : undefined }}
                    onKeyDown={e => e.key==="Enter" && handleSignup()} />
                  {(emailError || emailTakenError) && (
                    <div style={{ marginBottom:12, fontSize:11.5, lineHeight:1.5 }}>
                      <div style={{ color:"var(--red)", fontWeight:600 }}>{emailError || emailTakenError}</div>
                      {emailTakenError && (
                        <TextLink onClick={() => { setAuthTab("login"); setEmailTakenError(""); }} style={{ marginTop:2 }}>
                          Log ind i stedet
                        </TextLink>
                      )}
                    </div>
                  )}
                  <label className="field-lbl" htmlFor="signup-password">Adgangskode</label>
                  <div style={{ position:"relative" }}>
                    <input id="signup-password" name="password" className="field" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Mindst 10 tegn" value={loginPassword}
                      aria-invalid={!!passwordError}
                      onChange={e => { setLoginPassword(e.target.value); if (passwordError) setPasswordError(""); }}
                      style={{ paddingRight:46, borderColor: passwordError ? "var(--red-md)" : undefined }}
                      onKeyDown={e => e.key==="Enter" && handleSignup()} />
                    <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Skjul adgangskode" : "Vis adgangskode"}
                      style={{ position:"absolute", right:0, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Icon name={showPassword ? "eyeOff" : "eye"} size={16} color="var(--muted)" />
                    </button>
                  </div>
                  {/* Diskret, ALTID synlig adgangskode-hjælpetekst (27. sept.
                      2026, "FINAL 10/10 POLISH", punkt 5) — kommunikerer
                      kravet uafhængigt af placeholderen, som forsvinder ved
                      indtastning. Skifter til rød/fed fejl-visning ved et
                      mislykket forsøg (samme tekst som passwordError, ingen
                      dublering) — ingen layout-jump, linjen er altid der. */}
                  <div style={{ fontSize:11, marginTop:6, lineHeight:1.5, color: passwordError ? "var(--red)" : "var(--muted)", fontWeight: passwordError ? 600 : 400 }}>
                    {passwordError || PASSWORD_REQUIREMENTS_TEXT}
                  </div>
                  {/* Juridisk tekst (27. sept. 2026, "FINAL 10/10 POLISH",
                      punkt 4) — erstatter den tidligere "...bekræfter, at du
                      er over 13 år"-formulering (intet alderskrav er
                      håndteret nogen andre steder i appen, så teksten gav et
                      løfte om en kontrol der reelt ikke fandtes). Samme
                      ordlyd/links som velkomstsidens tilsvarende tekst (se
                      "Ved at oprette en konto..."-blokken der) — denne tekst
                      er IKKE samtykke til behandling af allergi-/helbreds-
                      oplysninger, det håndteres separat i selve onboardingen. */}
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:12, lineHeight:1.5 }}>
                    Ved at oprette en konto accepterer du vores{" "}
                    <button type="button" style={LEGAL_LINK_STYLE} onClick={() => openLegal(SCREENS.TERMS)}>brugsvilkår</button>.
                    {" "}Læs i{" "}
                    <button type="button" style={LEGAL_LINK_STYLE} onClick={() => openLegal(SCREENS.PRIVACY)}>privatlivspolitikken</button>,
                    {" "}hvordan vi behandler dine oplysninger.
                  </div>
                </div>
                {/* Ingen besked om en sendt mail her — den vises først på
                    bekræftelsesskærmen, når kontoen er oprettet (30. sept. 2026). */}
                <ErrorMessage>{authError}</ErrorMessage>
                <button className="btn welcome-btn" onClick={handleSignup} disabled={authLoading || !!emailTakenError}>
                  {authLoading ? "Opretter konto…" : "Opret konto"}
                </button>
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
                  {/* Samme felt-fejl-mønster som Ny bruger ovenfor (27. sept.
                      2026, "FINAL 10/10 POLISH") — samme spacing/error-
                      design på begge faner. emailError dækker BÅDE
                      "Log ind →" trykket med tom/ugyldig e-mail OG "Glemt
                      adgangskode?" trykket uden en gyldig e-mail (samme
                      delte state, se useAuth.js). */}
                  <label className="field-lbl" htmlFor="login-email">E-mail</label>
                  <input id="login-email" name="email" className="field" type="email" autoComplete="email" placeholder="din@email.dk" value={loginEmail}
                    aria-invalid={!!emailError}
                    onChange={e => { setLoginEmail(e.target.value); if (emailError) setEmailError(""); }}
                    style={{ marginBottom: emailError ? 6 : 12, borderColor: emailError ? "var(--red-md)" : undefined }}
                    onKeyDown={e => e.key==="Enter" && handleLogin()} />
                  {emailError && (
                    <div style={{ fontSize:11.5, color:"var(--red)", fontWeight:600, marginBottom:12 }}>
                      {emailError}
                    </div>
                  )}
                  <label className="field-lbl" htmlFor="login-password">Adgangskode</label>
                  <div style={{ position:"relative" }}>
                    <input id="login-password" name="password" className="field" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Din adgangskode" value={loginPassword}
                      aria-invalid={!!passwordError}
                      onChange={e => { setLoginPassword(e.target.value); if (passwordError) setPasswordError(""); }}
                      style={{ paddingRight:46, borderColor: passwordError ? "var(--red-md)" : undefined }}
                      onKeyDown={e => e.key==="Enter" && handleLogin()} />
                    <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Skjul adgangskode" : "Vis adgangskode"}
                      style={{ position:"absolute", right:0, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Icon name={showPassword ? "eyeOff" : "eye"} size={16} color="var(--muted)" />
                    </button>
                  </div>
                  {passwordError && (
                    <div style={{ fontSize:11, color:"var(--red)", fontWeight:600, marginTop:6, lineHeight:1.5 }}>
                      {passwordError}
                    </div>
                  )}
                  {/* min-height:44 på begge interaktive elementer (29. sept.
                      2026, "FINAL POLISH – NY BRUGER/LOG IND", punkt 10:
                      44×44px minimum touch-target) — usynlig padding rundt
                      om den uændrede tekst/checkbox, ikke en visuel
                      forstørrelse. Selve rækken vokser tilsvarende, men
                      checkbox/tekst/link ser ud og er placeret præcis som
                      før. */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", marginTop:12, minHeight:44 }}>
                    {/* "Husk mig" er fjernet: appen holder brugeren logget ind som standard (til de logger ud), så en afkrydsning ville ikke ændre noget. */}
                    {/* Valideres lokalt FØR handleForgotPassword kaldes, så en
                        manglende/ugyldig e-mail vises som en felt-fejl under
                        feltet i stedet for at kalde hooken og lade DEN
                        opdage det — se .link-green i theme.jsx for fokus-
                        tilstanden ("skal kun markeres ved rigtigt
                        tastaturfokus, ikke ved museklik"). */}
                    <TextLink onClick={() => {
                      if (!loginEmail) { setEmailError("Indtast din e-mail først."); return; }
                      if (!isValidEmail(loginEmail)) { setEmailError("Indtast en gyldig e-mailadresse."); return; }
                      setEmailError("");
                      handleForgotPassword();
                    }} disabled={authLoading} style={{ display:"inline-flex", alignItems:"center", minHeight:44 }}>
                      Glemt adgangskode?
                    </TextLink>
                  </div>
                </div>
                {authInfo && (
                  <div className="info-box" role="status" style={{ alignItems:"flex-start", lineHeight:1.5 }}>
                    <Icon name="mail" size={14} color="var(--blue)" />
                    <span>{authInfo}</span>
                  </div>
                )}
                <ErrorMessage>{authError}</ErrorMessage>
                <button className="btn welcome-btn" onClick={handleLogin} disabled={authLoading}>
                  {authLoading ? "Logger ind…" : "Log ind →"}
                </button>
              </div>
            )}

            {/* Ét enkelt separator (25. sept. 2026 — var tidligere to
                "eller"-linjer, én før og én efter de sociale knapper).
                Gjort en anelse mere diskret (opfølgning samme dag) —
                --muted2 i stedet for --muted, mindre skrifttykkelse. */}
            <div style={{ display:"flex", alignItems:"center", gap:10, margin:"16px 0 10px" }}>
              <div style={UI.hr} />
              <span style={{ fontSize:11.5, color:"var(--muted)", fontWeight:500 }}>Eller fortsæt med</span>
              <div style={UI.hr} />
            </div>

            {/* Sociale login-knapper — hvide/neutrale (.social-btn, theme.jsx),
                aldrig visuelt stærkere end den grønne primær-CTA ovenfor. */}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {/* Apple (8. okt. 2026) — vises først, når Apple er slået til i Supabase (useOAuthProviders), og
                  øverst, som Apples retningslinjer anbefaler. Samme neutrale knap som de andre, Apple-mærket i tekstfarven. */}
              {oauthProviders.apple && (
                <button className="social-btn" onClick={() => handleOAuth("apple")} disabled={authLoading}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M16.365 1.43c0 1.14-.47 2.23-1.18 3.03-.76.86-2 1.53-3.03 1.45-.13-1.11.42-2.27 1.13-3.03.79-.86 2.13-1.5 3.08-1.45zM20.5 17.3c-.55 1.27-.82 1.84-1.53 2.96-.99 1.56-2.39 3.5-4.12 3.51-1.54.02-1.93-1-4.02-.99-2.09.01-2.52 1.01-4.06.99-1.73-.02-3.05-1.77-4.04-3.33C-.04 16.08-.33 11 1.42 8.3c1.24-1.92 3.2-3.04 5.04-3.04 1.88 0 3.06 1.03 4.61 1.03 1.51 0 2.43-1.03 4.6-1.03 1.64 0 3.38.89 4.62 2.43-4.06 2.22-3.4 8.02.21 9.61z"/>
                  </svg>
                  Fortsæt med Apple
                </button>
              )}

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
  );
}
