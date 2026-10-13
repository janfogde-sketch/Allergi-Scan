// @ts-nocheck
import React from "react";
import { traceEligible } from "./helpers.js";
import { showToast } from "./SharedComponents.jsx";
import { AllergenSensitivity } from "./AllergenPicker.jsx";
import { PrimaryButton, FormCard, SectionHeading } from "./DesignSystem.jsx";

export function makeRenderStep3(c) {
  const { allergens, saveAllergensStep2, setOnboardStep, setUser, user } = c;

  // Trin 3: "Spor" — hvad skal der ske, når pakken siger "kan indeholde spor af …"? Eget trin,
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

  return renderTraceStep;
}
