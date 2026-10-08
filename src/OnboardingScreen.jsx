// @ts-nocheck
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { SCREENS } from "./constants.jsx";
import { traceEligible } from "./helpers.js";
import { EatSafeWordmark, Icon, showToast } from "./SharedComponents.jsx";
import { useGlutenFreeSync } from "./AllergenPicker.jsx";

import { prevOnboardStep } from "./OnboardingParts.jsx";
import { makeRenderStep1 } from "./OnboardingStep1.jsx";
import { makeRenderStep2 } from "./OnboardingStep2.jsx";
import { makeRenderStep3 } from "./OnboardingStep3.jsx";
import { renderStep4 } from "./OnboardingStep4.jsx";
import { renderStep5 } from "./OnboardingStep5.jsx";
import { renderWelcome } from "./OnboardingWelcome.jsx";
import { renderLogin } from "./OnboardingLogin.jsx";

import { usePush, SAVE_FAILED_REASON } from "./usePush.js";

import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useFamilyFormContext } from "./FamilyFormContext.jsx";
import { useAllergenPrefsContext } from "./AllergenPrefsContext.jsx";
import { UI } from "./styleUtils.js";
import { useHealthConsent } from "./useHealthConsent.js";
import { useOAuthProviders } from "./useOAuthProviders.js";

export default function OnboardingScreen({
  onboardStep, setOnboardStep,
  tourIdx, setTourIdx,
  editMode, setEditMode,
  customInput, setCustomInput,
  saveAllergensStep2, saveDietStep3,
  saveProfileStep1, finishOnboard,
  StepBar,
  hasPendingJoinList,
  onActivatePreview,
}) {
  const {
    authTab, setAuthTab, authError, setAuthError, authInfo, emailTakenError, setEmailTakenError,
    emailError, setEmailError, passwordError, setPasswordError, authLoading,
    loginEmail, setLoginEmail, loginPassword, setLoginPassword,
    user, setUser, isOAuth, accessToken,
    handleLogin, handleSignup, handleOAuth, handleForgotPassword,
  } = useAuthContext();
  const oauthProviders = useOAuthProviders();
  const {
    allergens, setAllergens, customAllerg, setCustomAllerg,
    family, setFamily, activeProfiles, setActiveProfiles,
  } = useProfileContext();
  const { screen, setScreen, openLegal } = useNavigationContext();
  const {
    newMemberName, setNewMemberName,
    newMemberBirthYear, setNewMemberBirthYear,
    newMemberGender, setNewMemberGender,
    newMemberAllerg, setNewMemberAllerg,
    newMemberCustomAllerg, setNewMemberCustomAllerg,
    newMemberDiets, setNewMemberDiets,
    newMemberLevels, setNewMemberLevels,
    newMemberENumbers, setNewMemberENumbers,
    newMemberSubtypes, setNewMemberSubtypes,
    newMemberCustomInput, setNewMemberCustomInput,
    editingMemberId,
    addMember, updateMember, removeMember, startEditMember, cancelEditMember,
  } = useFamilyFormContext();
  const {
    selectedENumbers = [], setSelectedENumbers,
  } = useAllergenPrefsContext();

  // FIX: denne state manglede — brugtes i trin 2 (E-numre kollapsibel), men
  // var aldrig defineret, hvilket crashede hele onboarding-skærmen med
  // "showENumbersInOnboard is not defined" så snart man nåede dertil.
  const [showENumbersInOnboard, setShowENumbersInOnboard] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // "Glemt adgangskode?"-valideringen genbruger nu den delte emailError-
  // state fra useAuthContext() (27. sept. 2026, "FINAL 10/10 POLISH") —
  // havde tidligere sin egen, adskilte lokale forgotPwError-state, men
  // begge viser reelt samme "Indtast din e-mail først."-besked samme sted
  // (direkte under E-mail-feltet), så en fælles state er enklere og sikrer
  // ét konsistent felt-fejl-mønster på tværs af Ny bruger og Log ind.
  // Onboarding trin 1's "Mangler: ..."-liste skal først vises EFTER et
  // forsøgt tryk på "Fortsæt →" (25. sept. 2026, opfølgning: "vil helst
  // ikke vise den før brugeren har forsøgt at fortsætte") — ellers møder
  // brugeren en fejlliste før de overhovedet er begyndt at udfylde noget.
  // Deklareret her (top-niveau), ikke inde i renderStep1, da hooks ikke må
  // kaldes betinget — renderStep1 kaldes kun når onboardStep===1.
  const [step1Attempted, setStep1Attempted] = useState(false);
  // Trin 2: "Fortsæt" skal ikke kunne trykkes ved en fejl, hvis brugeren
  // reelt ingen allergier har — de skal aktivt bekræfte det via en dedikeret
  // knap i stedet for blot at kunne fortsætte med et tomt valg (25. sept.
  // 2026, brugerfeedback). Fravælges automatisk, hvis brugeren derefter
  // vælger en allergi/intolerance eller tilføjer en custom-ingrediens.
  const [noAllergiesConfirmed, setNoAllergiesConfirmed] = useState(false);
  // Bekræftelsesdialog, når "Jeg har ingen allergier" vælges, mens der allerede er valgt noget (ingen modstridende profil).
  const [confirmNoAllergies, setConfirmNoAllergies] = useState(false);
  // Udtrykkeligt samtykke til helbredsoplysninger (2. okt. 2026, GDPR art. 9): skal gives, før allergier gemmes.
  const consent = useHealthConsent();
  const [consentChecked, setConsentChecked] = useState(false);

  // Trin 3: samme mønster som noAllergiesConfirmed ovenfor — "Fortsæt" må
  // ikke være aktiv ved "0 valgt", for ellers kan appen ikke skelne mellem
  // "brugeren har bevidst ingen kostpræferencer" og "brugeren glemte bare at
  // vælge noget" (25. sept. 2026, brugerfeedback).
  const [noDietConfirmed, setNoDietConfirmed] = useState(false);

  // Trin 4 (Familie) er valgfrit og skal føles sådan (2. okt. 2026, onboarding-polering): trinnet starter uden formular, kun med
  // "+ Tilføj familiemedlem" og "Jeg vil ikke tilføje familiemedlemmer nu". Formularen foldes først ud efter et tryk på "+ Tilføj …"
  // (eller "Rediger") og lukkes igen ved Annuller/Gem, så der aldrig står en stor tom formular uopfordret.
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState(null); // familiemedlem, der afventer "Fjern"-bekræftelse

  // Gluten ↔ Glutenfri-synkronisering — LIVE reaktion på allergen-valget,
  // ikke kun én gang ved ankomst til trin 3: vælges "Gluten", markeres
  // "Glutenfri" automatisk med samme grønne valgt-state. Fjernes "Gluten"
  // igen, fjernes "Glutenfri" automatisk KUN hvis den stadig er den
  // auto-tilføjede (glutenFreeAutoApplied) — har brugeren selv rørt ved
  // Glutenfri-kortet siden (tilføjet ELLER fjernet det manuelt), låses
  // valget som brugerens eget og røres ikke igen (nulstillet i
  // DietChipPickers onChange nedenfor). Udtrukket til ÉN delt hook (28.
  // sept. 2026, Profil-restrukturering) — samme logik bruges nu også af
  // MemberForm.jsx og ProfileScreen.jsx's "Rediger præferencer", i stedet
  // for tre kopier af samme effekt.
  const [glutenFreeAutoApplied, setGlutenFreeAutoApplied] = useGlutenFreeSync(
    allergens, user.diets || [], (arr) => setUser(u => ({ ...u, diets: arr }))
  );

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
  const [pushDenied, setPushDenied] = useState(false); // tilladelse afvist i browseren: ingen "aktiveret"-tekst (F1-7)

  const handleEnablePush = async () => {
    setPushLoading(true);
    const result = await pushSubscribe(accessToken);
    setPushLoading(false);
    // Et abonnement, der ikke kunne gemmes, må ikke spærre for onboarding; appen prøver igen ved næste start (syncPushToken).
    if (result.ok || result.reason === "Tilladelse afvist" || result.reason === SAVE_FAILED_REASON) {
      setPushDenied(result.reason === "Tilladelse afvist");
      setPushDone(true);
      // Onboarding afsluttes direkte herfra uanset svar — ingen ekstra
      // "Du er færdig"-oversigtsskærm (25. sept. 2026, brugerfeedback).
      setTimeout(() => finishOnboard(), 800);
    } else {
      showToast("Notifikationer kunne ikke slås til lige nu. Du kan prøve igen under Indstillinger.", "error");
    }
  };

  // Trinnene bor i egne filer (OnboardingStep1-5, Welcome, Login). De får det lokale state som ctx, så koden er uændret.
  const ctx = {
    authError, authInfo, authLoading, authTab, emailError, emailTakenError,
    handleForgotPassword, handleLogin, handleOAuth, handleSignup, hasPendingJoinList, loginEmail,
    loginPassword, oauthProviders, openLegal, passwordError, setAuthError, setAuthTab,
    setEmailError, setEmailTakenError, setLoginEmail, setLoginPassword, setOnboardStep, setPasswordError,
    setScreen, setShowPassword, showPassword, isOAuth, saveProfileStep1, setStep1Attempted,
    setUser, step1Attempted, user, allergens, confirmNoAllergies, consent,
    consentChecked, customAllerg, customInput, noAllergiesConfirmed, saveAllergensStep2, selectedENumbers,
    setAllergens, setConfirmNoAllergies, setConsentChecked, setCustomAllerg, setCustomInput, setNoAllergiesConfirmed,
    setSelectedENumbers, setShowENumbersInOnboard, showENumbersInOnboard, glutenFreeAutoApplied, noDietConfirmed, saveDietStep3,
    setGlutenFreeAutoApplied, setNoDietConfirmed, addMember, cancelEditMember, confirmRemoveMember, editingMemberId,
    family, newMemberAllerg, newMemberBirthYear, newMemberCustomAllerg, newMemberCustomInput, newMemberDiets,
    newMemberENumbers, newMemberGender, newMemberLevels, newMemberName, newMemberSubtypes, removeMember,
    setConfirmRemoveMember, setNewMemberAllerg, setNewMemberBirthYear, setNewMemberCustomAllerg, setNewMemberCustomInput, setNewMemberDiets,
    setNewMemberENumbers, setNewMemberGender, setNewMemberLevels, setNewMemberName, setNewMemberSubtypes, setShowAddMemberForm,
    showAddMemberForm, startEditMember, updateMember, finishOnboard, handleEnablePush, pushDenied,
    pushDone, pushLoading, pushSupported, onActivatePreview,
  };
  const renderStep1 = makeRenderStep1(ctx);
  const renderStep2 = makeRenderStep2(ctx);
  const renderStep3 = makeRenderStep3(ctx);

  return (
    <>
        {screen === SCREENS.WELCOME && renderWelcome(ctx)}

        {/* ══ LOGIN / REGISTRERING ══ */}
        {/* 25. sept. 2026-brief ("Opret konto" + "Log ind — final version"):
            hvidt formular-kort (.login-card), baggrunden dæmpet yderligere
            på denne skærm (.app-bg-dim i App.jsx), "Adgangskode" i stedet
            for "Kodeord" overalt, ét enkelt "Eller fortsæt med"-separator i
            stedet for to "eller"-linjer, og neutrale/hvide sociale
            login-knapper (Apple når slået til i Supabase, Google, Facebook) — ingen af dem må være visuelt stærkere end
            den grønne primær-CTA (.welcome-btn, genbrugt her for samme
            farvepalet/vægt som velkomstskærmen). */}
        {screen === SCREENS.LOGIN && renderLogin(ctx)}

        {/* ══ ONBOARDING ══ */}
        {(screen === SCREENS.ONBOARD || editMode) && (
          <div className="onboard-wrap fade-in"
            // Tastaturet dækker ellers et fokuseret felt på lave skærme: ryk feltet ind midt på skærmen, når tastaturet er åbnet.
            onFocus={e => {
              const t = e.target;
              if (t?.matches?.("input:not([type=checkbox]):not([type=radio]), select, textarea")) setTimeout(() => t.scrollIntoView?.({ block:"center", behavior:"smooth" }), 300);
            }}>
            {/* Preview-only dev-navigation (25. sept. 2026) — springer
                onboardStep frem/tilbage direkte, UDEN at validere trinnets
                felter (den normale "Fortsæt →"-knap kræver udfyldte
                felter for at gå videre). Kun til at gennemgå/designe
                trinnenes skærme hurtigt i Artifact-previewen — vises
                ALDRIG i produktion, samme mønster som "Se app uden login
                (preview)" på velkomstskærmen. Fast, mørk pille nederst,
                bevidst anderledes end appens eget UI, så den aldrig kan
                forveksles med rigtig produkt-UI. Renderes via en portal til
                document.body (IKKE som almindeligt barn af .onboard-wrap)
                — .onboard-wrap har klassen "fade-in", hvis animation
                (animation-fill-mode:both) efterlader en permanent
                transform på elementet og dermed gør det til et "containing
                block" for position:fixed-børn (kendt CSS-fælde, se
                CLAUDE.md afsnit 3) — uden portalen ville pillen blive
                fanget inde i .onboard-wraps egen boks og scrolle væk på
                lange trin (fx trin 6) i stedet for at blive siddende fast
                på skærmen. */}
            {import.meta.env.MODE === "artifact-preview" && createPortal(
              <div style={{ position:"fixed", bottom:"calc(12px + env(safe-area-inset-bottom))", left:"50%", transform:"translateX(-50%)", zIndex:1001,
                display:"flex", alignItems:"center", gap:4, background:"rgba(21,32,26,.88)", borderRadius:100,
                padding:4, boxShadow:"0 8px 24px -8px rgba(0,0,0,.45)" }}>
                <button onClick={() => setOnboardStep(s => Math.max(1, s - 1))} disabled={onboardStep <= 1}
                  style={{ background:"none", border:"none", color:"#fff", fontFamily:"var(--f)", fontSize:13, fontWeight:700, cursor:"pointer", opacity: onboardStep<=1 ? .35 : 1, padding:"7px 12px", borderRadius:100, whiteSpace:"nowrap" }}>
                  ← Forrige
                </button>
                <span style={{ color:"#fff", fontSize:11.5, fontWeight:600, opacity:.7, padding:"0 4px", whiteSpace:"nowrap" }}>Trin {onboardStep}/5</span>
                <button onClick={() => setOnboardStep(s => Math.min(5, s + 1))} disabled={onboardStep >= 5}
                  style={{ background:"none", border:"none", color:"#fff", fontFamily:"var(--f)", fontSize:13, fontWeight:700, cursor:"pointer", opacity: onboardStep>=5 ? .35 : 1, padding:"7px 12px", borderRadius:100, whiteSpace:"nowrap" }}>
                  Næste →
                </button>
              </div>,
              document.body
            )}
            {/* Brand-header (29. sept. 2026, "Master-specifikation for logo
                og branding i headers") — viser KUN "EatSafe" (samme delte
                <EatSafeWordmark/> som AppHeader.jsx, se SharedComponents.jsx
                — samme --brand-ink/--green-farver, skrifttype/
                -vægt/kerning som velkomstsidens billedlogo), ingen scanner-/
                stregkodeikon og INGEN BETA-badge — specen skelner bevidst
                mellem onboarding ("EatSafe") og appens øvrige headers
                ("EatSafe BETA"), se dens afsnit 3/7. Fast positioneret
                øverst til venstre (samme top-afstandsformel som Feedback-
                knappen nedenfor, som allerede er position:fixed her under
                hele onboardingen), så de to visuelt balancerer hinanden som
                en header-række — UDEN at ændre selve Feedback-knappens
                kode. Gælder alle 5 trin (samme onboard-wrap-blok), ikke
                editMode (Rediger profil/præferencer har allerede
                AppHeader, som viser "EatSafe BETA"). */}
            {!editMode && (
              <div style={{ position:"fixed", top:"calc(12px + env(safe-area-inset-top))", left:20, zIndex:1000 }}>
                <EatSafeWordmark />
              </div>
            )}
            {/* padding-top øget fra 4px (24. sept.-standarden) til 44px, så
                overskriften ikke overlapper det nye faste brand-logo
                ovenfor — direkte konsekvens af logoet, ikke en selvstændig
                layoutændring. */}
            {/* Tilbagepilen ligger nu i forlængelse af selve "Opsæt din
                profil"/"Tager under 2 minutter"-blokken (29. sept. 2026,
                brugerfeedback — tredje runde: stod først ved siden af
                fremgangsbjælken, så på sin egen linje over den, nu i stedet
                lodret centreret ud for headingen, venstrestillet i samme
                kolonne som det faste EatSafe-logo ovenfor). Kræver
                position:relative på selve heading-blokken, da knappen
                positioneres absolut i forhold til den. Samme delte
                boks-mønster (kant + Icon name="chevronLeft") som
                KnowledgeScreen.jsx/RecipesScreen.jsx. */}
            {!editMode && (
              <div style={{ position:"relative", textAlign:"center", padding:"44px 0 20px" }}>
                {onboardStep > 1 && (
                  <button onClick={() => setOnboardStep(prevOnboardStep(onboardStep, traceEligible(allergens).length > 0))} aria-label="Tilbage"
                    style={{ position:"absolute", left:20, top:"50%", transform:"translateY(-50%)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"8px 10px", cursor:"pointer", display:"flex", alignItems:"center", lineHeight:0 }}>
                    <Icon name="chevronLeft" size={18} color="var(--ink)" />
                  </button>
                )}
                <div style={{ fontSize:20, fontWeight:800, color:"var(--ink)" }}>Opsæt din profil</div>
                <div style={{ fontSize:13, color:"var(--ink2)", marginTop:4 }}>Tager under 2 minutter</div>
              </div>
            )}
            {editMode && <div style={{ height:4 }} />}
            {/* Fremgangsbjælke, altid fuld bredde. I editMode findes
                headingen ovenfor ikke (Rediger profil/præferencer har sin
                egen AppHeader/tilbageknap) — behold et simpelt fallback for
                tilbagepilen dér, samme boks-stil. */}
            <div style={UI.mb8}>
              {editMode && onboardStep > 1 && (
                <button onClick={() => setOnboardStep(prevOnboardStep(onboardStep, traceEligible(allergens).length > 0))} aria-label="Tilbage"
                  style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"8px 10px", cursor:"pointer", display:"flex", alignItems:"center", lineHeight:0, marginBottom:10 }}>
                  <Icon name="chevronLeft" size={18} color="var(--ink)" />
                </button>
              )}
              {onboardStep > 0 && <StepBar total={5} current={onboardStep} />}
            </div>

            {/* ── TRIN 1: Din profil (obligatorisk) ── */}
            {onboardStep === 1 && renderStep1()}

            {/* ── TRIN 2: Dine allergier / intolerancer ── */}
            {onboardStep === 2 && renderStep2()}

            {/* ── TRIN 4: Familie ── */}
            {onboardStep === 4 && renderStep4(ctx)}

            {/* ── TRIN 5: Push-notifikationer ── */}
            {onboardStep === 5 && renderStep5(ctx)}

            {/* ── TRIN 3: Kostpræferencer ── */}
            {onboardStep === 3 && renderStep3()}

                    </div>
        )}

    </>
  );
}
