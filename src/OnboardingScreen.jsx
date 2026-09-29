// @ts-nocheck
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ALLERGENS, SCREENS } from "./constants.jsx";
import { initials, addUniqueCustom } from "./helpers.js";
import { EatSafeLogo, EatSafeWordmark, Icon, showToast } from "./SharedComponents.jsx";
import { ENumberPicker, AllergenChipPicker, DietChipPicker, useGlutenFreeSync } from "./AllergenPicker.jsx";
import { AgeStepper, GenderPicker } from "./FormFields.jsx";
import { MemberForm } from "./MemberForm.jsx";
import {
  PrimaryButton, SecondaryButton, TextLink, FormCard, SectionHeading,
  Accordion, InfoRow, ErrorMessage, InputField,
} from "./DesignSystem.jsx";
import { usePush } from "./usePush.js";
import { isValidEmail } from "./useAuth.js";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useFamilyFormContext } from "./FamilyFormContext.jsx";
import { useAllergenPrefsContext } from "./AllergenPrefsContext.jsx";
import { UI } from "./styleUtils.js";

// Delt stil for de juridiske inline-tekstlinks (brugsvilkår/privatlivs-
// politikken), 4 forekomster nedenfor — en <button> i stedet for en <a>
// (29. sept. 2026, "Opdater siderne Brugsvilkår og Privatlivspolitik"), da
// disse nu navigerer internt via openLegal i stedet for at åbne en ekstern
// side i en ny fane. Nulstiller knap-standardstile (baggrund/kant/padding/
// font), samme grønne/fede visuelle udtryk som det tidligere <a>-link.
const LEGAL_LINK_STYLE = { background:"none", border:"none", padding:0, margin:0, font:"inherit", color:"var(--green)", fontWeight:700, textDecoration:"none", cursor:"pointer" };

function WelcomeIntro({ setScreen, setAuthTab }) {
  const goSignup = () => { setAuthTab("signup"); setScreen(SCREENS.LOGIN); };
  const goLogin  = () => { setAuthTab("login");  setScreen(SCREENS.LOGIN); };

  // gap:6 + .welcome-btn's egen margin-bottom:12 (theme.jsx) giver et samlet
  // primær→sekundær-mellemrum på 18px (29. sept. 2026, "Polér velkomst-/
  // login-siden"-spec, punkt 9: mål 16-20px) — var før 10+12=22px.
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <button className="welcome-btn" onClick={goSignup}>Opret gratis konto</button>
      <button className="welcome-btn-ghost" onClick={goLogin}>Jeg har allerede en konto</button>
    </div>
  );
}

// 3 korte fordele med ikon (25. sept. 2026-brief) — "Tjek allergener",
// "Hurtigt svar", "Lettere indkøb". Ikonerne matcher hver sin fordel:
// shield (beskyttelse mod allergener), zap (hurtighed), cart (indkøb).
// "Undgå" → "Tjek" (samme dag, opfølgning) — "Undgå" kan lyde som en
// garanti appen ikke kan give; "Tjek" beskriver mere præcist at appen
// hjælper med VURDERINGEN, ikke selve garantien.
// "Tryggere indkøb" → "Lettere indkøb" (28. sept. 2026, "FINAL POLISH") —
// dels en kortere tekst der reelt kan stå på én linje ved siden af de to
// andre (se .welcome-benefits-kommentaren i theme.jsx), dels undgår
// "Tryggere" et kategorisk sikkerhedsløfte appen ikke kan indfri fuldt ud.
const WELCOME_BENEFITS = [
  ["shield", "Tjek allergener"],
  ["zap",    "Hurtigt svar"],
  ["cart",   "Lettere indkøb"],
];

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
    rememberMe, setRememberMe,
    handleLogin, handleSignup, handleOAuth, handleForgotPassword,
  } = useAuthContext();
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
    // Alder skal være et realistisk tal (1-120) — AgeStepper begrænser kun
    // +/-, ikke et tal der tastes direkte ind (fx "999").
    const ageNum = Number(user.age);
    const ageEntered = (user.age||"").toString().trim().length > 0;
    const ageOk = ageEntered && Number.isFinite(ageNum) && ageNum >= 1 && ageNum <= 120;
    const genderOk = !!(user.gender);
    // Telefon er valgfri (29. sept. 2026, QA-beslutning D2 — alder og køn
    // er fortsat obligatoriske, telefon bruges ikke). Valideres kun, hvis
    // brugeren selv har skrevet noget: præcis 8 cifre efter +45.
    const phoneDigits = (user.phone||"").replace(/^\+45\s*/, "").replace(/\D/g, "");
    const phoneOk = phoneDigits.length === 0 || phoneDigits.length === 8;
    const allOk = nameOk && emailOk && ageOk && genderOk && phoneOk;
    const emailIsSaved = !!(loginEmail || isOAuth);
    return (
      <div className="fade-in">
        <div style={UI.mb14}>
          <div style={{ fontSize:19, fontWeight:900, color:"var(--ink)", marginBottom:4 }}>Hvem er du?</div>
          {/* Begge undertekster gjort en anelse mørkere (25. sept. 2026,
              opfølgning) — var hhv. --muted2 og --muted, lidt for lyse til
              at læse uden anstrengelse ved siden af de mørkere overskrifter.
              27. sept. 2026, "FINAL 10/10 POLISH": teksten omformuleret —
              "bruges til din personlige allergiprofil" antydede fejlagtigt
              at ALLE felter her (navn/telefon/alder/køn) er nødvendige for
              selve allergi-logikken, hvilket kun allergier/diæter reelt er
              (indsamlet på senere trin) — disse felter er kontooplysninger. */}
          <div style={{ ...UI.ufs13_cmuted2_lh15, color:"var(--ink2)" }}>Oplysningerne bruges til at opsætte din profil og kan ændres senere.</div>
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
              (samme gate som de felt-specifikke fejltekster nedenfor) —
              rød betyder nu kun "du prøvede at fortsætte, og dette felt
              mangler stadig". 27. sept. 2026: hver fejltekst er nu inline
              direkte under sit eget felt (i stedet for én samlet
              "Mangler: ..."-sætning nederst), samme mønster som Opret
              konto/Log ind-skærmens felt-fejl. */}
          <div style={{ marginBottom:17 }}>
            <InputField label="Fulde navn" required
              type="text" placeholder="Fx. Anna Hansen"
              value={user.name||""} onChange={e => setUser(u => ({...u, name:e.target.value}))}
              error={step1Attempted && !nameOk} />
            {step1Attempted && !nameOk && (
              <div style={{ fontSize:11.5, color:"var(--red)", fontWeight:600, marginTop:5 }}>Indtast dit fulde navn.</div>
            )}
          </div>

          {/* E-mail — "Email" uden bindestreg blev tidligere brugt her,
              mens login/signup-skærmene konsekvent bruger "E-mail" (25.
              sept. 2026, opfølgning: terminologi-ensretning).
              27. sept. 2026, "FINAL 10/10 POLISH": den prefillede/read-only
              tilstand brugte tidligere kun `opacity:.6` — samme visuelle
              "dæmpet"-signal som et disabled/fejlramt felt ville have,
              præcis det brugeren bad om at undgå ("brugeren skal forstå at
              e-mailen er gemt, ikke at feltet er slået fra/i fejl").
              Erstattet med en let, positiv grøn baggrundstone (samme
              --green-lt/--green-mid-par som appens øvrige "gemt/aktiv"-
              tilstande) + fuld tekstkontrast (ingen opacity-dæmpning) + en
              tydelig undertekst. isOAuth-checkmarket er samtidig flyttet
              fra en rå inline-SVG til den delte Icon-komponent, og vises nu
              for BEGGE tilfælde (ikke kun OAuth), med hver sin præcise
              forklaringstekst. */}
          <div style={{ marginBottom:17 }}>
            <InputField label="E-mail" required
              type="email" placeholder="din@email.dk"
              value={user.email||loginEmail||""}
              onChange={e => setUser(u => ({...u, email:e.target.value}))}
              readOnly={emailIsSaved}
              inputStyle={emailIsSaved ? { background:"var(--green-lt)", borderColor:"var(--green-mid)", color:"var(--ink)", cursor:"default" } : undefined} />
            {emailIsSaved && (
              <div style={{ fontSize:10, color:"var(--green)", marginTop:3, display:"flex", alignItems:"center", gap:4 }}>
                <Icon name="check" size={10} color="var(--green)" />
                {isOAuth === "google" ? "Bekræftet via Google" : isOAuth ? "E-mail bekræftet" : "Allerede gemt fra din konto"}
              </div>
            )}
          </div>

          {/* Telefon — +45 er låst, brugeren skriver kun selve nummeret.
              27. sept. 2026, "FINAL 10/10 POLISH": tallene grupperes nu
              automatisk parvis while typing (dansk mobilnummer-konvention,
              "12 34 56 78") i stedet for at gemme cifrene råt/ugrupperet —
              samme mønster som placeholderen allerede viste, men som det
              indtastede tal ikke fulgte. Kapper ved 8 cifre (reelt dansk
              mobilnummer-længde). Rød kant + inline fejl ved forsøgt
              "Fortsæt →" med et forkert antal cifre. */}
          <div style={{ marginBottom:17 }}>
            <label className="field-lbl" htmlFor="onboard-phone">Telefonnummer <span style={{ fontWeight:500, color:"var(--muted)" }}>(valgfrit)</span></label>
            <div className="field phone-field" style={{ borderColor: (step1Attempted && !phoneOk) ? "var(--red-md)" : undefined }}>
              <span className="phone-prefix">+45</span>
              <input id="onboard-phone" className="phone-rest" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="12 34 56 78"
                value={(user.phone||"").replace(/^\+45\s*/, "")}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
                  const grouped = digits.replace(/(\d{2})(?=\d)/g, "$1 ");
                  setUser(u => ({...u, phone: digits ? `+45 ${grouped}` : ""}));
                }} />
            </div>
            {step1Attempted && !phoneOk && (
              <div style={{ fontSize:11.5, color:"var(--red)", fontWeight:600, marginTop:5 }}>
                Indtast et gyldigt dansk telefonnummer (8 cifre), eller lad feltet stå tomt.
              </div>
            )}
          </div>

          {/* Alder — delt AgeStepper-komponent (FormFields.jsx), også brugt
              af MemberForm.jsx (25. sept. 2026: familie-trinnet skal
              genbruge præcis samme komponent, ikke sit eget parallelle
              design). */}
          <div style={{ marginBottom:19 }}>
            <label className="field-lbl">Alder <span style={UI.red}>*</span></label>
            <AgeStepper value={user.age} onChange={age => setUser(u => ({...u, age}))} />
            {step1Attempted && !ageOk && (
              <div style={{ fontSize:11.5, color:"var(--red)", fontWeight:600, marginTop:6 }}>{ageEntered ? "Angiv en alder mellem 1 og 120." : "Angiv din alder."}</div>
            )}
          </div>

          {/* Køn — delt GenderPicker-komponent (FormFields.jsx), samme
              begrundelse som Alder ovenfor. */}
          <div>
            <label className="field-lbl">Køn <span style={UI.red}>*</span></label>
            <GenderPicker value={user.gender} onChange={gender => setUser(u => ({...u, gender}))} />
            {step1Attempted && !genderOk && (
              <div style={{ fontSize:11.5, color:"var(--red)", fontWeight:600, marginTop:8 }}>Vælg en mulighed.</div>
            )}
          </div>
        </FormCard>

        {/* Disabled-tilstanden bruger PrimaryButtons låste softDisabled-
            udseende (lys grøn baggrund + fuld-styrke grøn tekst, samme
            "lys baggrund, mørk tekst"-mønster som Køn-valgene ovenfor) i
            stedet for en gennemgående opacity-dæmpning, der gjorde hvid
            knap-tekst svær at læse. softDisabled (ikke disabled) holder
            knappen klikbar, så første forsøg stadig kan fanges og vise de
            felt-specifikke fejltekster ovenfor. */}
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
    const addCustomAllergy = () => {
      if (!customInput.trim()) return;
      setCustomAllerg(c => addUniqueCustom(c, customInput));
      setCustomInput("");
      setNoAllergiesConfirmed(false);
    };

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
                aria-label="Egen allergi eller intolerance"
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => { if (e.key==="Enter") addCustomAllergy(); }} />
              <button className="btn btn-outline btn-sm" aria-label="Tilføj egen allergi" onClick={addCustomAllergy}>+</button>
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

        {/* Går automatisk videre til trin 3 ved klik (29. sept. 2026, bruger-
            rapporteret: "den bliver blot markeret med et flueben, og så skal
            man derefter trykke fortsæt") — samme mønster som trin 3's "Ingen
            særlig diæt" ovenfor, som allerede gjorde dette korrekt. Eksplicit
            [] til saveAllergensStep2 (se dens egen kommentar i
            useOnboarding.js) i stedet for at stole på allergens/customAllerg
            i closure, som stadig ville indeholde de GAMLE, ikke-ryddede
            værdier på dette tidspunkt (setAllergens/setCustomAllerg er
            asynkrone). */}
        <SecondaryButton style={UI.mt8} active={noAllergiesConfirmed}
          onClick={async () => {
            if (selectedCount > 0 && !window.confirm("Du har allerede valgt allergier/intolerancer. Vil du fjerne dem og markere, at du ingen har?")) return;
            setAllergens([]); setCustomAllerg([]);
            setNoAllergiesConfirmed(true);
            try { await saveAllergensStep2([], []); setOnboardStep(3); }
            catch { showToast("Dine allergier kunne ikke gemmes. Tjek din forbindelse og prøv igen.", "error"); }
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
            samme princip som trin 2's noAllergiesConfirmed-gate).
            saveDietStep3 tilføjet 29. sept. 2026 ("Onboarding-persistens")
            — kostpræferencer blev tidligere KUN gemt lokalt under selve
            onboardingen, aldrig til backend, og gik derfor tabt hvis
            brugeren lukkede appen før trin 5. Samme mønster som trin 2:
            avancér ikke ved fejl, vis i stedet en fejl-toast, så intet
            valg går stille tabt. */}
        <PrimaryButton disabled={!canContinueDiet}
          onClick={async () => {
            try { await saveDietStep3(diets); setOnboardStep(4); }
            catch { showToast("Dine kostpræferencer kunne ikke gemmes. Tjek din forbindelse og prøv igen.", "error"); }
          }}>Fortsæt →</PrimaryButton>
        {/* "Ingen særlig diæt" — samme låste SecondaryButton-stil som trin 2's
            "Jeg har ingen allergier..." (solid hvid baggrund + grøn kant/
            tekst), tydeligt klikbart uden at konkurrere med den fyldte
            grønne Fortsæt-knap. */}
        <SecondaryButton style={UI.mt8}
          onClick={async () => {
            if (diets.length > 0 && !window.confirm("Fjern dine valgte kostpræferencer?")) return;
            setUser(u => ({...u, diets:[]}));
            setNoDietConfirmed(true);
            try { await saveDietStep3([]); setOnboardStep(4); }
            catch { showToast("Dine kostpræferencer kunne ikke gemmes. Tjek din forbindelse og prøv igen.", "error"); }
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
            {/* Usynlig spacer med ulige flex-grow-vægt (28. sept. 2026,
                "FINAL POLISH") — se .welcome-vspace-top/-bottom i theme.jsx
                for hvorfor: flytter kompositionens lodrette tyngdepunkt en
                anelse op uden at ændre selve layoutet. */}
            <div className="welcome-vspace-top" aria-hidden="true" />

            {/* Logo + værdiforslag (25. sept. 2026-brief: kort, tydelig
                value proposition i stedet for den tidligere slogan-agtige
                "Scan. Tjek. Spis trygt."). Teksten udvidet 28. sept. 2026
                ("FINAL POLISH") til også at nævne kosthensyn, ikke kun
                allergier — matcher at appen også dækker diæter/E-numre. */}
            <div className="welcome-logo-wrap">
              <EatSafeLogo variant="horizontal" size={56} />
              <div className="brand-slogan">Mere tryghed i hverdagen</div>
              <div className="welcome-tagline">Scan produkter og se straks, om de passer til dine allergier og kosthensyn.</div>
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

            {/* Juridisk tekst — diskret, men læsbar, småprint nederst (28.
                sept. 2026, "FINAL POLISH"). Både linket og
                "privatlivspolitikken" er rigtige links (se public/
                terms.html, nyoprettet i samme runde — der fandtes tidligere
                ingen selvstændig vilkårs-side, kun privacy.html). Teksten
                er omformuleret til at skelne "accepterer brugsvilkår" fra
                "bekræfter at have læst privatlivspolitikken" — denne
                tekst er IKKE samtykke til behandling af allergi-/
                helbredsoplysninger (det håndteres separat, eksplicit,
                længere inde i selve onboardingen, se privacy.html afsnit 4).
                max-width for pænere linjebrud, og en anelse større
                line-height. Egen text-shadow-løft (ikke en del af det
                globale sæt i theme.jsx) — denne tekst sidder tættest på
                skærmens nederste kant, hvor vignet-effekten (theme.jsx's
                .app-bg) er svagest og billedet mest tydeligt, så den har
                mest brug for et løft.
                27. sept. 2026, "FINAL MICRO-POLISH": "handelsbetingelser"
                omdøbt til "brugsvilkår" — terms.html's indhold (tjenesten,
                ingen medicinsk erstatning, konto, brugerindsendt indhold,
                ansvarsbegrænsning) er almindelige brugsvilkår, ikke
                købs-/handelsbetingelser (EatSafe sælger ikke noget
                transaktionelt); terms.html's egen overskrift rettet
                tilsvarende. Farve skærpet fra --ink2 (.78 alpha) til en
                lokal, lidt mørkere rgba(.85 alpha) for optimal kontrast mod
                det aktive baggrundsbillede — stadig tydeligt "småprint",
                ikke fuld --ink-vægt.
                Samme dag, "FINAL 10/10 MICRO-POLISH": max-width 290px→250px
                — ved 290px endte "privatlivspolitikken." alene på sin egen
                3. linje (kun linket + punktum), hvilket så skævt/ubalanceret
                ud. Den smallere bredde gav en mere naturlig ombrydning uden
                at røre font-size/line-height/tekst.
                27. sept. 2026, "FINAL MICRO-FIX": selve sætningen omskrevet
                ("Du accepterer vores brugsvilkår og bekræfter, at du har
                læst privatlivspolitikken, når du opretter en konto.") —
                "privatlivspolitikken" har nu et halevedhæng (", når du
                opretter en konto.") i stedet for et punktum lige efter
                linket, så LINKET aldrig kan ende alene på sin egen linje.
                Den nye, længere sætning gav dog et nyt problem ved den
                daværende 250px/11.5px-kombination: sidste ORD ("konto.")
                endte alene på en 4. linje i stedet. Løst empirisk (afprøvet
                flere bredde/font-size-kombinationer direkte i den byggede
                app, ikke gættet) med max-width 250px→270px + font-size
                11.5px→11px — giver præcis 3 jævnt fyldte linjer på alle tre
                testede bredder (SE/iPhone 13/Pro Max), ingen linje med kun
                ét ord eller ét link. line-height/farve/kontrast/centrering
                uændret. */}
            {/* 29. sept. 2026, "Polér velkomst-/login-siden": marginTop
                22→28 (punkt 9: sekundær CTA→juridisk tekst, mål 26-32px).
                fontSize/farve dæmpet (11px→10.5px, rgba(...,.85)→(...,.6))
                — punkt 8: skal fremstå mindre og mere sekundær, neutral
                mørkegrå, uden at konkurrere med CTA-knapperne. Selve
                teksten/linkene (grønne, fed) er uændrede.
                29. sept. 2026, "sidste spacing-polering": marginTop 28→18
                (8-12px tættere på "Jeg har allerede en konto" ovenfor). */}
            <div style={{ marginTop:18, maxWidth:270, fontSize:10.5, color:"rgba(21,32,26,.6)", lineHeight:1.65, textAlign:"center", textShadow:"0 1px 0 rgba(255,255,255,.85)" }}>
              Du accepterer vores{" "}
              <button type="button" style={LEGAL_LINK_STYLE} onClick={() => openLegal(SCREENS.TERMS)}>brugsvilkår</button>
              {" "}og bekræfter, at du har læst{" "}
              <button type="button" style={LEGAL_LINK_STYLE} onClick={() => openLegal(SCREENS.PRIVACY)}>privatlivspolitikken</button>,
              {" "}når du opretter en konto.
            </div>

            {/* Samme spacer-mekanisme som toppen, se kommentar ovenfor —
                giver resten af den ledige plads (0.62:1-vægten, se
                theme.jsx). */}
            <div className="welcome-vspace-bottom" aria-hidden="true" />
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
                    <Icon name="cart" size={13} color="var(--green)" /> En indkøbsliste venter på dig — den bliver tilføjet, når du er oprettet
                  </div>
                )}
                <div style={UI.utacenter_mb16}>
                  <div style={UI.ufs15_fw700_cink}>Opret din konto</div>
                  <div style={UI.ufs12_cmuted_mt4}>Du opsætter dine allergier i næste trin.</div>
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
                    <input id="signup-password" name="password" className="field" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Minimum 10 tegn" value={loginPassword}
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
                    {passwordError || "Adgangskoden skal være mindst 10 tegn."}
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
                    <button type="button" style={LEGAL_LINK_STYLE} onClick={() => openLegal(SCREENS.TERMS)}>brugsvilkår</button>
                    {" "}og bekræfter, at du har læst{" "}
                    <button type="button" style={LEGAL_LINK_STYLE} onClick={() => openLegal(SCREENS.PRIVACY)}>privatlivspolitikken</button>.
                  </div>
                </div>
                {authInfo && (
                  <div className="info-box" role="status" style={{ alignItems:"flex-start", lineHeight:1.5 }}>
                    <Icon name="mail" size={14} color="var(--blue)" />
                    <span>{authInfo}</span>
                  </div>
                )}
                <ErrorMessage>{authError}</ErrorMessage>
                <button className="btn welcome-btn" onClick={handleSignup} disabled={authLoading || !!emailTakenError}>
                  {authLoading ? "Opretter konto…" : "Opret konto og fortsæt →"}
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
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:12, minHeight:44 }}>
                    <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12.5, fontWeight:600, color:"var(--ink2)", cursor:"pointer", minHeight:44 }}>
                      <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                        style={{ width:16, height:16, accentColor:"var(--green)", cursor:"pointer" }} />
                      Husk mig
                    </label>
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
            {/* Brand-header (29. sept. 2026, "Master-specifikation for logo
                og branding i headers") — viser KUN "EatSafe" (samme delte
                <EatSafeWordmark/> som AppHeader.jsx, se SharedComponents.jsx
                — samme --brand-ink/--brand-green-gradient-farver, skrifttype/
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
            {!editMode && (
              <div style={{ textAlign:"center", padding:"44px 0 20px" }}>
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
