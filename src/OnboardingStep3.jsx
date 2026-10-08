// @ts-nocheck
import React from "react";
import { DIETS_ENABLED } from "./constants.jsx";
import { traceEligible } from "./helpers.js";
import { showToast } from "./SharedComponents.jsx";
import { AllergenSensitivity, DietChipPicker } from "./AllergenPicker.jsx";
import { PrimaryButton, SecondaryButton, FormCard, SectionHeading, InfoRow } from "./DesignSystem.jsx";
import { UI } from "./styleUtils.js";

export function makeRenderStep3(c) {
  const { allergens, glutenFreeAutoApplied, noDietConfirmed, saveAllergensStep2, saveDietStep3, setGlutenFreeAutoApplied, setNoDietConfirmed, setOnboardStep, setUser, user } = c;

  // Trin 3 (Kostpræferencer, tidl. "Din diæt") — redesignet 25. sept. 2026
  // til at genbruge nøjagtig samme valgt-state/tæller-mønster som trin 2
  // ("selected-state skal være 100% identisk med trin 2" — brugerens
  // eksplicitte, vigtigste krav i denne runde). Flere valg er tilladt (fx
  // Vegetarisk + Glutenfri er en gyldig kombination).
  const renderStep3 = () => (DIETS_ENABLED ? renderDietStep() : renderTraceStep());

  // Trin 3 uden kostpræferencer: "Spor" — hvad skal der ske, når pakken siger "kan indeholde spor af …"? Eget trin,
  // så valget ikke gemmer sig under allergilisten. Gemmes sammen med allergierne (saveAllergensStep2 → allergen_levels).
  const renderTraceStep = () => (
    <div className="fade-in">
      <FormCard>
        <SectionHeading title="Spor af allergener" sub="Vælg, hvornår du vil advares" />
        {traceEligible(allergens).length === 0 ? (
          <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.45 }}>
            {allergens.length === 0 ? "Du har ikke valgt nogen allergier, så der er intet at vælge her." : "Sporvalg gælder ikke for de følsomheder, du har valgt, så der er intet at vælge her."}
          </div>
        ) : (
          <AllergenSensitivity selected={allergens} levels={user.allergenLevels} showTitle={false} bare
            onChange={lv => setUser(u => ({ ...u, allergenLevels: lv }))} />
        )}
      </FormCard>
      <PrimaryButton onClick={async () => {
        try { await saveAllergensStep2(); setOnboardStep(4); }
        catch { showToast("Dit valg kunne ikke gemmes. Tjek din forbindelse og prøv igen.", "error"); }
      }}>Fortsæt →</PrimaryButton>
    </div>
  );

  const renderDietStep = () => {
    const diets = user.diets || [];
    const selectedCount = diets.length;
    const canContinueDiet = selectedCount > 0 || noDietConfirmed;
    return (
      <div className="fade-in">
        <div className="card">
          <SectionHeading title="Kostpræferencer" sub="Vælg alle, der gælder for dig" count={selectedCount} />

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

  return renderStep3;
}
