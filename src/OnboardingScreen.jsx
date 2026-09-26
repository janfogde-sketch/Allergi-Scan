// @ts-nocheck
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ALLERGENS, SCREENS } from "./constants.jsx";
import { initials } from "./helpers.js";
import { EatSafeLogo, Icon, showToast } from "./SharedComponents.jsx";
import { ENumberPicker, AllergenChipPicker, DietChipPicker, useGlutenFreeSync } from "./AllergenPicker.jsx";
import { AgeStepper, GenderPicker } from "./FormFields.jsx";
import { MemberForm } from "./MemberForm.jsx";
import {
  PrimaryButton, SecondaryButton, TextLink, FormCard, SectionHeading,
  Accordion, InfoRow, ErrorMessage, InputField,
} from "./DesignSystem.jsx";
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
    authTab, setAuthTab, authError, setAuthError, emailTakenError, setEmailTakenError, authLoading,
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
  // "Glemt adgangskode?"-valideringen skal vises som en lille inline-fejl
  // direkte under E-mail-feltet (25. sept. 2026, opfølgning), IKKE i den
  // store, fælles error-box (authError) — det gør en simpel "husk at
  // udfylde feltet"-påmindelse unødigt alarmerende. Lokal, adskilt state,
  // ryddes igen når brugeren retter e-mail-feltet eller skifter fane.
  const [forgotPwError, setForgotPwError] = useState("");
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

  // Trin 3: samme mønster som noAllergiesConfirmed ovenfor — "Fortsæt" må
  // ikke være aktiv ved "0 valgt", for ellers kan appen ikke skelne mellem
  // "brugeren har bevidst ingen kostpræferencer" og "brugeren glemte bare at
  // vælge noget" (25. sept. 2026, brugerfeedback).
  const [noDietConfirmed, setNoDietConfirmed] = useState(false);

  // Trin 4 (Familie): "Tilføj nyt familiemedlem"-formularen skal kun være
  // foldet ud, når der endnu ikke er gemt noget (første besøg på trinnet),
  // under en aktiv redigering, eller efter et eksplicit tryk på "+ Tilføj
  // endnu et familiemedlem" (25. sept. 2026, brugerfeedback) — ikke
  // automatisk hver gang trinnet vises, når familien allerede har medlemmer.
  const [showAddMemberForm, setShowAddMemberForm] = useState(family.length === 0);
  // Slettes det sidste tilbageværende familiemedlem, skal formularen folde
  // sig ud igen — ellers står brugeren tilbage med kun "+ Tilføj endnu et
  // familiemedlem", som læser mærkeligt når der reelt ikke er nogen "endnu
  // et" at tilføje til.
  useEffect(() => {
    if (family.length === 0) setShowAddMemberForm(true);
  }, [family.length]);

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

  const handleEnablePush = async () => {
    setPushLoading(true);
    const result = await pushSubscribe(accessToken);
    setPushLoading(false);
    if (result.ok || result.reason === "Tilladelse afvist") {
      setPushDone(true);
      // Onboarding afsluttes direkte herfra uanset svar — ingen ekstra
      // "Du er færdig"-oversigtsskærm (25. sept. 2026, brugerfeedback).
      setTimeout(() => finishOnboard(), 800);
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
          {/* Begge undertekster gjort en anelse mørkere (25. sept. 2026,
              opfølgning) — var hhv. --muted2 og --muted, lidt for lyse til
              at læse uden anstrengelse ved siden af de mørkere overskrifter. */}
          <div style={{ ...UI.ufs13_cmuted2_lh15, color:"var(--ink2)" }}>Oplysningerne bruges til din personlige allergiprofil og kan redigeres senere.</div>
        </div>

        {/* Ekstra, blød hvid glød lige bag kortet (25. sept. 2026,
            opfølgning: "dæmp ingredienserne 5-10% lige bag formularen...
            kun så kortet står lidt renere") — lagt oven på .card's
            eksisterende var(--sh)-skygge, ikke en erstatning af den, og
            KUN på dette kort, ikke en ændring af den delte .card-klasse
            (brugt bredt andre steder i appen uden dette behov). */}
        <FormCard glow style={UI.mb12}>
          {/* Navn — kanten var rød fra allerførste render (25. sept. 2026,
              opfølgning: "rødlig kant selv om brugeren endnu ikke har gjort
              noget forkert"). Bug: user.name initialiseres til "" i
              App.jsx, ikke undefined, så `user.name !== undefined` var
              sandt med det samme — rød kant IKKE betinget af noget
              brugeren faktisk havde gjort. Erstattet med step1Attempted
              (samme gate som "Mangler: ..."-teksten) — rød betyder nu kun
              "du prøvede at fortsætte, og dette felt mangler stadig". */}
          <InputField label="Fulde navn" required style={{ marginBottom:17 }}
            type="text" placeholder="Fx. Anna Hansen"
            value={user.name||""} onChange={e => setUser(u => ({...u, name:e.target.value}))}
            error={step1Attempted && !nameOk} />

          {/* E-mail — "Email" uden bindestreg blev tidligere brugt her,
              mens login/signup-skærmene konsekvent bruger "E-mail" (25.
              sept. 2026, opfølgning: terminologi-ensretning). */}
          <div style={{ marginBottom:17 }}>
            <InputField label="E-mail" required
              type="email" placeholder="din@email.dk"
              value={user.email||loginEmail||""}
              onChange={e => setUser(u => ({...u, email:e.target.value}))}
              readOnly={!!(loginEmail || isOAuth)}
              inputStyle={{ opacity: (loginEmail || isOAuth) ? 0.6 : 1 }} />
            {isOAuth && (
              <div style={{ fontSize:10, color:"var(--green)", marginTop:3, display:"flex", alignItems:"center", gap:4 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                Bekræftet via Google
              </div>
            )}
          </div>

          {/* Telefon — +45 er låst, brugeren skriver kun selve nummeret */}
          <div style={{ marginBottom:17 }}>
            <label className="field-lbl">Telefonnummer <span style={UI.red}>*</span></label>
            <div className="field phone-field">
              <span className="phone-prefix">+45</span>
              <input className="phone-rest" type="tel" inputMode="numeric" placeholder="12 34 56 78"
                value={(user.phone||"").replace(/^\+45\s*/, "")}
                onChange={e => {
                  const rest = e.target.value.replace(/[^\d\s]/g, "");
                  setUser(u => ({...u, phone: rest ? `+45 ${rest}` : ""}));
                }} />
            </div>
          </div>

          {/* Alder — delt AgeStepper-komponent (FormFields.jsx), også brugt
              af MemberForm.jsx (25. sept. 2026: familie-trinnet skal
              genbruge præcis samme komponent, ikke sit eget parallelle
              design). */}
          <div style={{ marginBottom:19 }}>
            <label className="field-lbl">Alder <span style={UI.red}>*</span></label>
            <AgeStepper value={user.age} onChange={age => setUser(u => ({...u, age}))} />
          </div>

          {/* Køn — delt GenderPicker-komponent (FormFields.jsx), samme
              begrundelse som Alder ovenfor. */}
          <div>
            <label className="field-lbl">Køn <span style={UI.red}>*</span></label>
            <GenderPicker value={user.gender} onChange={gender => setUser(u => ({...u, gender}))} />
          </div>
        </FormCard>

        {/* Validering — vises KUN efter et forsøgt tryk på "Fortsæt →"
            mens formularen er ufuldstændig (se step1Attempted), ikke
            proaktivt fra starten. Knappen har derfor bevidst IKKE det
            native disabled-attribut (som ville blokere selve klikket og
            dermed forsøget) — den ser stadig dæmpet/"disabled" ud via
            opacity, men klik registreres altid, så det første forsøg kan
            fanges. */}
        {step1Attempted && !allOk && missingFields.length > 0 && (
          <div style={{ fontSize:12, color:"var(--muted)", textAlign:"center", marginBottom:10 }}>
            Mangler: {missingFields.join(", ")}
          </div>
        )}

        {/* Disabled-tilstanden bruger PrimaryButtons låste softDisabled-
            udseende (lys grøn baggrund + fuld-styrke grøn tekst, samme
            "lys baggrund, mørk tekst"-mønster som Køn-valgene ovenfor) i
            stedet for en gennemgående opacity-dæmpning, der gjorde hvid
            knap-tekst svær at læse. softDisabled (ikke disabled) holder
            knappen klikbar, så første forsøg stadig kan fanges og vise
            "Mangler: ..."-teksten. */}
        <PrimaryButton
          softDisabled={!allOk}
          onClick={() => {
            if (!allOk) { setStep1Attempted(true); return; }
            saveProfileStep1().then(() => setOnboardStep(2));
          }}>
          Fortsæt →
        </PrimaryButton>
      </div>
    );
  };

  // Trin 2 er ligesom trin 1 flyttet ud i en render-funktion (ikke en
  // separat komponent — ingen hooks herinde, kun let closures over
  // top-niveau-state), da den kun kaldes betinget (onboardStep===2).
  const renderStep2 = () => {
    const selectedCount = allergens.length + customAllerg.length;

    return (
      <div className="fade-in">
        <FormCard>
          <SectionHeading title="Allergier / intolerancer" sub="Vælg alt der gælder for dig" count={selectedCount} />

          <AllergenChipPicker selected={allergens} onChange={arr => {
            setAllergens(arr);
            if (noAllergiesConfirmed) setNoAllergiesConfirmed(false);
          }} />

          {/* Skriv selv — kortet markant ned (25. sept. 2026) */}
          <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid var(--border)" }}>
            <div style={UI.sectionLbl6}>Mangler din allergi eller intolerance?</div>
            <div className="input-row" style={{ marginTop:6, marginBottom: customAllerg.length ? 8 : 0 }}>
              <input className="field" placeholder='Skriv fx "Fruktose"…' value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => { if (e.key==="Enter"&&customInput.trim()) { setCustomAllerg(c=>[...c,customInput.trim()]); setCustomInput(""); setNoAllergiesConfirmed(false); }}} />
              <button className="btn btn-outline btn-sm" onClick={() => { if(customInput.trim()){ setCustomAllerg(c=>[...c,customInput.trim()]); setCustomInput(""); setNoAllergiesConfirmed(false); }}}>+</button>
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
        </FormCard>

        {/* ── E-numre: kompakt valgfri række (var en fremtrædende boks —
            brugerfeedback: "for dominerende her") ── */}
        <Accordion label="Overvåg specifikke E-numre" count={selectedENumbers.length}
          open={showENumbersInOnboard} onToggle={() => setShowENumbersInOnboard(s => !s)}>
          {/* Solidt kort (ligesom allergi-kortet ovenfor) i stedet for at
              ligge direkte på baggrundsfotoet — ellers slår fotoet igennem
              de gennemsigtige grønne valgt-farver og får dem til at se
              rødlige/orange ud på trods af den korrekte grønne farvekode
              (25. sept. 2026, opfølgning på grøn-vs-rød-feedback). */}
          <FormCard style={UI.mb12}>
            <div style={{ fontSize:12, fontWeight:700, color: selectedENumbers.length > 0 ? "var(--green)" : "var(--muted)", marginBottom:8 }}>
              {selectedENumbers.length} valgt
            </div>
            <ENumberPicker selected={selectedENumbers} onChange={setSelectedENumbers} />
          </FormCard>
        </Accordion>

        {/* At vælge specifikke E-numre at overvåge er også et bevidst,
            gyldigt valg på dette trin — Fortsæt må ikke forblive låst, hvis
            det er det eneste brugeren har valgt (fundet som en reel bug,
            25. sept. 2026: "vælger et E-nummer og ikke en allergi... kan
            jeg ikke trykke fortsæt"). */}
        <PrimaryButton style={UI.mt12}
          disabled={!(selectedCount > 0 || selectedENumbers.length > 0 || noAllergiesConfirmed)}
          onClick={async () => {
            try { await saveAllergensStep2(); setOnboardStep(3); }
            catch { showToast("Dine allergier kunne ikke gemmes. Tjek din forbindelse og prøv igen.", "error"); }
          }}>Fortsæt →</PrimaryButton>

        <SecondaryButton style={UI.mt8} active={noAllergiesConfirmed}
          onClick={() => {
            if (noAllergiesConfirmed) { setNoAllergiesConfirmed(false); return; }
            if (selectedCount > 0 && !window.confirm("Du har allerede valgt allergier/intolerancer. Vil du fjerne dem og markere, at du ingen har?")) return;
            setAllergens([]); setCustomAllerg([]);
            setNoAllergiesConfirmed(true);
          }}>
          Jeg har ingen allergier eller intolerancer
        </SecondaryButton>
      </div>
    );
  };

  // Trin 3 (Kostpræferencer, tidl. "Din diæt") — redesignet 25. sept. 2026
  // til at genbruge nøjagtig samme valgt-state/tæller-mønster som trin 2
  // ("selected-state skal være 100% identisk med trin 2" — brugerens
  // eksplicitte, vigtigste krav i denne runde). Flere valg er tilladt (fx
  // Vegetarisk + Glutenfri er en gyldig kombination).
  const renderStep3 = () => {
    const diets = user.diets || [];
    const selectedCount = diets.length;
    const canContinueDiet = selectedCount > 0 || noDietConfirmed;
    return (
      <div className="fade-in">
        <div className="card">
          <SectionHeading title="Kostpræferencer" sub="Vælg alle der gælder for dig" count={selectedCount} />

          <DietChipPicker selected={diets} showCount={false}
            autoNote={glutenFreeAutoApplied ? { id:"gluten-free", text:"Valgt ud fra gluten" } : undefined}
            onChange={arr => {
              // Rører brugeren selv ved Glutenfri-kortet (tilføjer ELLER
              // fjerner det manuelt), er det ikke længere det auto-tilføjede
              // valg — lås det som brugerens eget, se effekten ovenfor.
              if (arr.includes("gluten-free") !== diets.includes("gluten-free")) setGlutenFreeAutoApplied(false);
              setUser(u => ({ ...u, diets: arr }));
              if (arr.length > diets.length && noDietConfirmed) setNoDietConfirmed(false);
            }} />
        </div>

        {/* Neutral, ikke-alarmerende disclaimer — rød/orange er reserveret
            til allergener/fejl, ikke en generel vejledende note (25. sept.
            2026, brugerfeedback). Mørknet igen, et niveau mere end forrige
            runde (--muted → --ink2 → --ink) — stadig samme neutrale grå
            farvefamilie, bare fuld styrke i stedet for --ink2's 78%. */}
        <InfoRow icon="info" color="var(--ink)" style={{ marginBottom:16 }}>
          Diæt-tjek er vejledende og baseret på produkttags. Tjek altid ingredienserne selv.
        </InfoRow>

        {/* "Fortsæt" må ikke være aktiv ved "0 valgt" — ellers kan appen
            ikke skelne "brugeren har bevidst ingen kostpræferencer" fra
            "brugeren glemte at vælge noget" (25. sept. 2026, brugerfeedback,
            samme princip som trin 2's noAllergiesConfirmed-gate). */}
        <PrimaryButton disabled={!canContinueDiet} onClick={() => setOnboardStep(4)}>Fortsæt →</PrimaryButton>
        {/* "Ingen særlig diæt" — samme låste SecondaryButton-stil som trin 2's
            "Jeg har ingen allergier..." (solid hvid baggrund + grøn kant/
            tekst), tydeligt klikbart uden at konkurrere med den fyldte
            grønne Fortsæt-knap. */}
        <SecondaryButton style={UI.mt8}
          onClick={() => {
            if (diets.length > 0 && !window.confirm("Fjern dine valgte kostpræferencer?")) return;
            setUser(u => ({...u, diets:[]}));
            setNoDietConfirmed(true);
            setOnboardStep(4);
          }}>
          Ingen særlig diæt
        </SecondaryButton>
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
                  <div className="welcome-benefit-icon"><Icon name={icon} size={20} color="var(--green)" /></div>
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
            stedet for to "eller"-linjer, og neutrale/hvide sociale
            login-knapper (Google/Facebook — Apple fjernet igen 25. sept.
            2026, samme dag) — ingen af dem må være visuelt stærkere end
            den grønne primær-CTA (.welcome-btn, genbrugt her for samme
            farvepalet/vægt som velkomstskærmen). */}
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
              <div className={`tab${authTab==="signup"?" active":""}`} onClick={() => { setAuthTab("signup"); setAuthError(""); setEmailTakenError(""); setForgotPwError(""); }}>Ny bruger</div>
              <div className={`tab${authTab==="login"?" active":""}`} onClick={() => { setAuthTab("login"); setAuthError(""); setEmailTakenError(""); setForgotPwError(""); }}>Log ind</div>
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
                    <Icon name="cart" size={13} color="var(--green)" /> En indkøbsliste venter på dig — den bliver tilføjet, når du er oprettet
                  </div>
                )}
                <div style={UI.utacenter_mb16}>
                  <div style={UI.ufs15_fw700_cink}>Opret din konto</div>
                  <div style={UI.ufs12_cmuted_mt4}>Du opsætter dine allergier i næste trin.</div>
                </div>
                <div className="login-card">
                  {/* E-mail — "allerede registreret" vises som en felt-
                      specifik inline-fejl direkte her (25. sept. 2026,
                      brugerfeedback), IKKE i den store, globale error-boks
                      nedenfor, som nu er forbeholdt fejl der ikke kan
                      knyttes til ét felt. */}
                  <label className="field-lbl">E-mail</label>
                  <input className="field" type="email" placeholder="din@email.dk" value={loginEmail}
                    onChange={e => { setLoginEmail(e.target.value); if (emailTakenError) setEmailTakenError(""); }}
                    style={{ ...UI.mb12, borderColor: emailTakenError ? "var(--red-md)" : undefined }}
                    onKeyDown={e => e.key==="Enter" && handleSignup()} />
                  {emailTakenError && (
                    <div style={{ marginTop:-8, marginBottom:12, fontSize:11.5, lineHeight:1.5 }}>
                      <div style={{ color:"var(--red)", fontWeight:600 }}>{emailTakenError}</div>
                      <TextLink onClick={() => { setAuthTab("login"); setEmailTakenError(""); }} style={{ marginTop:2 }}>
                        Log ind i stedet
                      </TextLink>
                    </div>
                  )}
                  <label className="field-lbl">Adgangskode</label>
                  <div style={{ position:"relative" }}>
                    <input className="field" type={showPassword ? "text" : "password"} placeholder="Minimum 10 tegn" value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)} style={{ paddingRight:46 }}
                      onKeyDown={e => e.key==="Enter" && handleSignup()} />
                    <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Skjul adgangskode" : "Vis adgangskode"}
                      style={{ position:"absolute", right:0, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Icon name={showPassword ? "eyeOff" : "eye"} size={16} color="var(--muted)" />
                    </button>
                  </div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:8, lineHeight:1.5 }}>
                    Ved at oprette en konto accepterer du vores vilkår og bekræfter, at du er over 13 år.
                  </div>
                </div>
                <ErrorMessage>{authError}</ErrorMessage>
                <button className="btn welcome-btn" onClick={handleSignup} disabled={authLoading || !!emailTakenError}>
                  {authLoading ? "Opretter konto…" : "Opret konto og fortsæt →"}
                </button>
                <div style={UI.utacenter_mt12_fs12_cmuted}>
                  Har du allerede en konto?{" "}
                  <span style={UI.ucgreen_fw700_curpointer} onClick={() => { setAuthTab("login"); setAuthError(""); setEmailTakenError(""); }}>
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
                    onChange={e => { setLoginEmail(e.target.value); if (forgotPwError) setForgotPwError(""); }}
                    style={forgotPwError ? undefined : UI.mb12}
                    onKeyDown={e => e.key==="Enter" && handleLogin()} />
                  {/* Inline felt-fejl for "Glemt adgangskode?" uden udfyldt
                      e-mail (25. sept. 2026, opfølgning) — sidder direkte
                      under feltet den vedrører, IKKE i den store, fælles
                      error-box nedenfor, som er forbeholdt reelle login-
                      fejl efter et forsøgt kald. */}
                  {forgotPwError && (
                    <div style={{ fontSize:11.5, color:"var(--red)", fontWeight:600, marginTop:5, marginBottom:12 }}>
                      {forgotPwError}
                    </div>
                  )}
                  <label className="field-lbl">Adgangskode</label>
                  <div style={{ position:"relative" }}>
                    <input className="field" type={showPassword ? "text" : "password"} placeholder="Din adgangskode" value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)} style={{ paddingRight:46 }}
                      onKeyDown={e => e.key==="Enter" && handleLogin()} />
                    <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Skjul adgangskode" : "Vis adgangskode"}
                      style={{ position:"absolute", right:0, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Icon name={showPassword ? "eyeOff" : "eye"} size={16} color="var(--muted)" />
                    </button>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:12 }}>
                    <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12.5, fontWeight:600, color:"var(--ink2)", cursor:"pointer" }}>
                      <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                        style={{ width:16, height:16, accentColor:"var(--green)", cursor:"pointer" }} />
                      Husk mig
                    </label>
                    {/* Valideres lokalt FØR handleForgotPassword kaldes, så en
                        manglende e-mail vises som en let inline-note under
                        feltet i stedet for hookens egen authError-fald-
                        tilbage (den store error-box) — se .link-green i
                        theme.jsx for fokus-tilstanden ("skal kun markeres
                        ved rigtigt tastaturfokus, ikke ved museklik"). */}
                    <TextLink onClick={() => {
                      if (!loginEmail || !loginEmail.includes("@")) { setForgotPwError("Indtast din e-mail først."); return; }
                      setForgotPwError("");
                      handleForgotPassword();
                    }} disabled={authLoading}>
                      Glemt adgangskode?
                    </TextLink>
                  </div>
                </div>
                <ErrorMessage>{authError}</ErrorMessage>
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
                "eller"-linjer, én før og én efter de sociale knapper).
                Gjort en anelse mere diskret (opfølgning samme dag) —
                --muted2 i stedet for --muted, mindre skrifttykkelse. */}
            <div style={{ display:"flex", alignItems:"center", gap:10, margin:"16px 0 10px" }}>
              <div style={UI.hr} />
              <span style={{ fontSize:11.5, color:"var(--muted2)", fontWeight:500 }}>Eller fortsæt med</span>
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
            {!editMode && (
              <div style={{ textAlign:"center", padding:"4px 0 20px" }}>
                <div style={UI.mb6}><EatSafeLogo size={40} variant="light" /></div>
                <div style={{ fontSize:20, fontWeight:800, color:"var(--ink)" }}>Opsæt din profil</div>
                <div style={{ fontSize:13, color:"var(--ink2)", marginTop:4 }}>Tager under 2 minutter</div>
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
            {onboardStep === 2 && renderStep2()}

            {/* ── TRIN 4: Familie ── */}
            {onboardStep === 4 && (
              <div className="fade-in">
                <div className="step-title" style={UI.utacenter}>Familiemedlemmer</div>
                <div style={{ fontSize:13, color:"var(--muted2)", textAlign:"center", marginBottom:16 }}>Tilføj familiemedlemmer med egne allergier. Valgfrit.</div>

                {/* Allerede tilføjede — viser navn + alder som primær linje
                    (25. sept. 2026, brugerfeedback: "Mia, 24 år"), ikke kun
                    allergiliste, så det er umiddelbart tydeligt at
                    familiemedlemmet reelt blev gemt. Allergioversigten er
                    begrænset til 3 værdier + "+N" (samme dag, opfølgning) —
                    en lang allergiliste skubbede ellers Rediger/slet ud af
                    synsfeltet på smalle skærme. "Rediger" (25. sept. 2026,
                    opfølgning) genbruger samme MemberForm nedenfor i stedet
                    for en separat redigerings-dialog — se startEditMember/
                    updateMember i useFamily.js. Det medlem der redigeres,
                    får en tydelig grøn kant, så det er utvetydigt hvilken
                    række formularen nedenfor gælder. Sletteikonet er
                    neutralt/gråt i normal state — rød/destruktiv styling
                    vises kun i den native bekræftelsesdialog, ikke på selve
                    ikonet, så listen ikke ser "farlig" ud i hvile. */}
                {family.length > 0 && (
                  <div className="card" style={UI.mb12}>
                    <div style={UI.sectionLbl6}>Tilføjet</div>
                    {family.map(m => {
                      const allergenLabels = m.allergens.map(id => ALLERGENS.find(a=>a.id===id)?.label).filter(Boolean);
                      const shownAllergens = allergenLabels.slice(0, 3);
                      const extraCount = allergenLabels.length - shownAllergens.length;
                      return (
                      <div key={m.id} style={{
                          display:"flex", alignItems:"center", gap:10, padding:"10px 6px",
                          margin:"0 -6px", borderRadius:10, borderBottom:"1px solid var(--border)",
                          ...(editingMemberId === m.id ? { background:"var(--green-selected-bg)", border:"1.5px solid var(--green)" } : {}),
                        }}>
                        <div className="fm-avatar" style={{ background:m.color, color:"var(--ink)" }}>{initials(m.name)}</div>
                        <div style={UI.flex1}>
                          <div style={{ fontWeight:800, fontSize:14 }}>
                            {m.name}{m.birth_year ? ` · ${new Date().getFullYear() - m.birth_year} år` : ""}
                          </div>
                          <div style={UI.muted11mt2}>
                            {allergenLabels.length ? shownAllergens.join(", ") + (extraCount > 0 ? ` +${extraCount}` : "") : "Ingen allergier"}
                          </div>
                        </div>
                        <button type="button" onClick={() => { startEditMember(m); setShowAddMemberForm(true); }} aria-label={`Rediger ${m.name}`}
                          style={{ background:"none", border:"none", cursor:"pointer", padding:"10px 6px", minHeight:44, fontFamily:"var(--f)", fontSize:12.5, fontWeight:700, color:"var(--green)" }}>
                          Rediger
                        </button>
                        <button type="button" onClick={() => { if (window.confirm(`Fjern ${m.name} fra familien?`)) removeMember(m.id); }} aria-label={`Fjern ${m.name}`}
                          style={{ background:"none", border:"none", cursor:"pointer", width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", opacity:.5, flexShrink:0 }}>
                          <Icon name="trash" size={18} color="var(--muted)" />
                        </button>
                      </div>
                      );
                    })}
                  </div>
                )}

                {/* Tilføj nyt medlem / rediger et eksisterende — foldet
                    sammen som standard så snart mindst ét medlem er gemt
                    (25. sept. 2026, brugerfeedback: den tomme formular
                    dominerede trin 4 unødigt efter det første medlem var
                    tilføjet). Kun ved 0 medlemmer, en aktiv redigering, eller
                    et eksplicit tryk på "+ Tilføj endnu et familiemedlem"
                    nedenfor er formularen foldet ud. */}
                {showAddMemberForm ? (
                  <div className="card" style={UI.mb12}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                      <div className="card-lbl">{editingMemberId ? "Rediger familiemedlem" : "Tilføj nyt familiemedlem"}</div>
                      {family.length > 0 && (
                        <TextLink onClick={() => { cancelEditMember(); setShowAddMemberForm(false); }}>Annuller</TextLink>
                      )}
                    </div>
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
                      onAdd={() => { (editingMemberId ? updateMember : addMember)(); setShowAddMemberForm(false); }}
                      addLabel={editingMemberId ? "Gem ændringer" : "+ Tilføj familiemedlem"}
                    />
                  </div>
                ) : (
                  <SecondaryButton style={UI.mb12} onClick={() => setShowAddMemberForm(true)}>
                    + Tilføj endnu et familiemedlem
                  </SecondaryButton>
                )}

                {/* Fortsæt og "spring over" var tidligere altid vist samtidig
                    — redundant, da de betyder næsten det samme, hvis intet
                    familiemedlem endnu er tilføjet (25. sept. 2026,
                    brugerfeedback). Nu kun ÉN kontekstafhængig knap: så
                    snart mindst ét familiemedlem er gemt, er "Fortsæt →"
                    utvetydig og erstatter skip-knappen; er der ikke gemt
                    noget, er "spring over" den eneste vej videre. */}
                {family.length > 0 ? (
                  <PrimaryButton onClick={() => setOnboardStep(5)}>Fortsæt →</PrimaryButton>
                ) : (
                  <SecondaryButton onClick={() => setOnboardStep(5)}>
                    Jeg vil ikke tilføje familiemedlemmer nu
                  </SecondaryButton>
                )}
              </div>
            )}

            {/* ── TRIN 5: Push-notifikationer ── */}
            {onboardStep === 5 && (
                <div className="fade-in">
                  <div style={{ textAlign:"center", padding:"16px 0 20px" }}>
                    <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}><Icon name="bell" size={42} color="var(--green)" /></div>
                    <div style={{ fontSize:20, fontWeight:900, color:"var(--ink)", marginBottom:8 }}>Bliv opdateret</div>
                    <div style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.65 }}>
                      Få besked, når der sker noget vigtigt i EatSafe.
                    </div>
                  </div>

                  <FormCard style={UI.mb16}>
                    {[
                      ["check","Produktet er godkendt","Når admin godkender dit indsendte produkt"],
                      ["family","Familie tilslutter sig","Når nogen accepterer dit invitationslink"],
                      ["search","Produkt tilgængeligt","Når et produkt, du har ledt efter, kommer i databasen"],
                    ].map(([icon, title, sub], i, arr) => (
                      <InfoRow key={title} icon={icon} color="var(--green)" title={title} sub={sub} border={i < arr.length - 1} />
                    ))}
                  </FormCard>

                  {!pushSupported ? (
                    <PrimaryButton onClick={finishOnboard}>
                      Fortsæt →
                    </PrimaryButton>
                  ) : pushDone ? (
                    <PrimaryButton disabled style={{ opacity:.7, background:"var(--green)", color:"var(--on-green)" }}>
                      <Icon name="check" size={14} color="var(--on-green)" /> Notifikationer aktiveret
                    </PrimaryButton>
                  ) : (
                    <>
                      <PrimaryButton onClick={handleEnablePush} disabled={pushLoading}
                        style={{ opacity: pushLoading ? .6 : 1, background:"var(--green)", color:"var(--on-green)" }}>
                        {pushLoading ? "Aktiverer…" : <><Icon name="bell" size={14} color="var(--on-green)" /> Slå notifikationer til</>}
                      </PrimaryButton>
                      {/* Ikke nu — var en fuld-bredde .btn-ghost der næsten
                          matchede hovedknappens vægt (25. sept. 2026,
                          brugerfeedback: "lidt for fremtrædende"). Nu en
                          simpel tekstknap under CTA'en i stedet for endnu en
                          knap, så hierarkiet er utvetydigt: notifikationer
                          er den anbefalede handling, "Ikke nu" er der bare
                          uden at presse. Afslutter onboarding direkte, ingen
                          ekstra "Du er færdig"-skærm. */}
                      <TextLink variant="muted" block onClick={finishOnboard}>
                        Ikke nu
                      </TextLink>
                    </>
                  )}
                </div>
            )}

            {/* ── TRIN 3: Kostpræferencer ── */}
            {onboardStep === 3 && renderStep3()}

                    </div>
        )}

    </>
  );
}
