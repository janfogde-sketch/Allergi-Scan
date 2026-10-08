// @ts-nocheck
import React from "react";
import { SCREENS, DIETS_ENABLED } from "./constants.jsx";
import { addUniqueCustom, pruneAllergenLevels, traceEligible } from "./helpers.js";
import { showToast, ConfirmDialog } from "./SharedComponents.jsx";
import { ENumberPicker, AllergenChipPicker, AllergenSensitivity, CustomAllergenField } from "./AllergenPicker.jsx";
import { PrimaryButton, SecondaryButton, FormCard, SectionHeading, Accordion } from "./DesignSystem.jsx";
import { UI } from "./styleUtils.js";
import HealthConsentBox from "./HealthConsentBox.jsx";
import { canSaveHealthData } from "./healthConsent.js";

export function makeRenderStep2(c) {
  const { allergens, confirmNoAllergies, consent, consentChecked, customAllerg, customInput, noAllergiesConfirmed, openLegal, saveAllergensStep2, selectedENumbers, setAllergens, setConfirmNoAllergies, setConsentChecked, setCustomAllerg, setCustomInput, setNoAllergiesConfirmed, setOnboardStep, setSelectedENumbers, setShowENumbersInOnboard, setUser, showENumbersInOnboard, user } = c;

  // Trin 2 er ligesom trin 1 flyttet ud i en render-funktion (ikke en
  // separat komponent — ingen hooks herinde, kun let closures over
  // top-niveau-state), da den kun kaldes betinget (onboardStep===2).
  const renderStep2 = () => {
    const selectedCount = allergens.length + customAllerg.length;
    // Tekst i "Skriv selv"-feltet, som ikke er tilføjet med "+", tæller med ved Fortsæt (ellers forsvinder den stille)
    const pendingCustom = customInput.trim() !== "";
    const effectiveCount = selectedCount + (pendingCustom ? 1 : 0);
    // Neutral, let sekundærknap-stil (29. sept. 2026, "Ret designet på
    // onboarding-trin 2/5") — kun for DENNE knap: "Jeg har ingen allergier
    // eller intolerancer" er et gyldigt, men bevidst LAVERE-vægtet fravalg
    // ved siden af den primære, grønne "Fortsæt →". Den delte
    // SecondaryButton-stil (grøn kant/tekst) bruges stadig uændret andre
    // steder i onboardingen (fx trin 3's "Ingen særlig diæt", som ikke er
    // en del af denne opgave) — kun overstyret her, ikke i selve
    // komponenten. Gælder kun i det ubekræftede default-state; forbliver
    // SecondaryButtons normale grønne "bekræftet"-stil (kant + flueben), når
    // noAllergiesConfirmed er sat, i det sjældne tilfælde gemningen fejler
    // og knappen ikke når at navigere videre.
    const neutralSecondaryStyle = noAllergiesConfirmed
      ? UI.mt8
      : { ...UI.mt8, minHeight:40, padding:"9px 16px", fontWeight:500, color:"var(--ink2)", background:"transparent", border:"1px solid var(--border)" };

    // Rydder ALLE allergi-, intolerance- og sporvalg (inkl. egne), gemmer den tomme profil og går videre. Eksplicit [] til
    // saveAllergensStep2, da state-opdateringerne ellers endnu ikke er slået igennem i dens closure.
    const confirmNoAllergiesNow = async () => {
      setConfirmNoAllergies(false);
      setAllergens([]); setCustomAllerg([]); setCustomInput("");
      setUser(u => ({ ...u, allergenLevels: {} }));
      setNoAllergiesConfirmed(true);
      try { await saveAllergensStep2([], []); setOnboardStep(DIETS_ENABLED ? 3 : 4); }
      catch { showToast("Dine allergier kunne ikke gemmes. Tjek din forbindelse og prøv igen.", "error"); }
    };

    return (
      <div className="fade-in">
        {confirmNoAllergies && (
          <ConfirmDialog title="Fjern dine valgte allergier?"
            message="Du har allerede valgt allergier eller intolerancer. Hvis du fortsætter, bliver disse valg fjernet."
            confirmLabel="Ja, fjern mine valg"
            onCancel={() => setConfirmNoAllergies(false)} onConfirm={confirmNoAllergiesNow} />
        )}
        <FormCard>
          <SectionHeading title="Allergier / intolerancer" sub="Vælg alle, der gælder for dig" count={selectedCount} />

          <AllergenChipPicker selected={allergens} onChange={arr => {
            setAllergens(arr);
            // Fjernes et allergen, fjernes dets sporvalg også (ingen skjulte værdier i profilen)
            setUser(u => ({ ...u, allergenLevels: pruneAllergenLevels(u.allergenLevels, arr) }));
            if (noAllergiesConfirmed) setNoAllergiesConfirmed(false);
          }} />
          {/* Spor-valget har sit eget trin 3, når kostpræferencer er på pause; ellers vises det her */}
          {DIETS_ENABLED && (
            <AllergenSensitivity selected={allergens} levels={user.allergenLevels}
              onChange={lv => setUser(u => ({ ...u, allergenLevels: lv }))} />
          )}

          {/* Skriv selv — samme delte felt som Rediger præferencer og familieformularen (2. okt. 2026) */}
          <CustomAllergenField customAllerg={customAllerg} setCustomAllerg={setCustomAllerg} customInput={customInput} setCustomInput={setCustomInput}
            onChange={() => setNoAllergiesConfirmed(false)} />
        </FormCard>

        {/* ── E-numre: kompakt, tydeligt sekundær accordion (29. sept. 2026,
            "Ret designet på onboarding-trin 2/5") — hele sektionen
            (overskrift + indhold) er nu ÉT samlet kort (samme mønster som
            ProfileScreen.jsx's "Rediger præferencer"), i stedet for at
            overskriften lå løst mellem allergi-kortet og et separat,
            indlejret kort. Fjernet: den redundante "X valgt"-linje (stod
            allerede i Accordion-headeren) og det ekstra indlejrede
            FormCard-lag om selve ENumberPicker — begge bidrog til at
            sektionen føltes tungere/mere dominerende end allergi-delen. */}
        <div className="card" style={{ marginBottom:20 }}>
          <Accordion label="Overvåg specifikke E-numre" count={selectedENumbers.length}
            open={showENumbersInOnboard} onToggle={() => setShowENumbersInOnboard(s => !s)}>
            <div style={UI.mt8}>
              <ENumberPicker selected={selectedENumbers} onChange={setSelectedENumbers} />
            </div>
          </Accordion>
        </div>

        {/* At vælge specifikke E-numre at overvåge er også et bevidst,
            gyldigt valg på dette trin — Fortsæt må ikke forblive låst, hvis
            det er det eneste brugeren har valgt (fundet som en reel bug,
            25. sept. 2026: "vælger et E-nummer og ikke en allergi... kan
            jeg ikke trykke fortsæt"). */}
        {effectiveCount > 0 && !consent.current && (
          <HealthConsentBox checked={consentChecked} onChange={setConsentChecked} openPrivacy={() => openLegal(SCREENS.PRIVACY)} />
        )}
        <PrimaryButton
          disabled={!(effectiveCount > 0 || selectedENumbers.length > 0 || noAllergiesConfirmed)
            || !canSaveHealthData({ hasHealthData: effectiveCount > 0, given: consent.current, checked: consentChecked })}
          onClick={async () => {
            try {
              const nextCustom = pendingCustom ? addUniqueCustom(customAllerg, customInput) : customAllerg;
              if (pendingCustom) { setCustomAllerg(nextCustom); setCustomInput(""); }
              if (effectiveCount > 0 && !consent.current) await consent.give();
              await saveAllergensStep2(allergens, nextCustom);
              // Egne valg har ingen sporvalg, så trin 3 (spor) springes over, hvis der kun er egne valg
              setOnboardStep(DIETS_ENABLED || traceEligible(allergens).length > 0 ? 3 : 4); }
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
        <SecondaryButton style={neutralSecondaryStyle} active={noAllergiesConfirmed}
          onClick={() => { if (effectiveCount > 0) setConfirmNoAllergies(true); else confirmNoAllergiesNow(); }}>
          Jeg har ingen allergier eller intolerancer
        </SecondaryButton>
      </div>
    );
  };

  return renderStep2;
}
