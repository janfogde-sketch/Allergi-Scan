// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { SCREENS } from "./constants.jsx";
import { addUniqueCustom, pruneAllergenLevels } from "./helpers.js";
import { showToast } from "./SharedComponents.jsx";
import { Accordion } from "./DesignSystem.jsx";
import { ENumberPicker, AllergenChipPicker, AllergenSensitivity, CustomAllergenField } from "./AllergenPicker.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useAllergenPrefsContext } from "./AllergenPrefsContext.jsx";
import { UI } from "./styleUtils.js";
import { useHealthConsent } from "./useHealthConsent.js";
import { useMeasuredHeight } from "./useMeasuredHeight.js";
import HealthConsentBox from "./HealthConsentBox.jsx";
import { canSaveHealthData } from "./healthConsent.js";
import { reportError } from "./errorReporter.js";
import { saveMyAllergens } from "./saveMyAllergens.js";

// Sorteret, sammenlignelig udgave af alt, siden kan ændre — bruges til at afgøre, om der er ugemte ændringer.
const prefsSnapshot = ({ allergens, customAllerg, levels, eNumbers }) => JSON.stringify({
  a: [...(allergens || [])].sort(), c: [...(customAllerg || [])].sort(), l: Object.entries(levels || {}).sort(),
  e: [...(eNumbers || [])].sort(),
});

// "Rediger præferencer" — KUN allergier/intolerancer/diæter/
// E-numre (28. sept. 2026, Profil-restrukturering, krav 2-3).
// Genbruger PRÆCIS de samme delte komponenter som onboarding og
// MemberForm.jsx (AllergenChipPicker/DietChipPicker/ENumberPicker,
// samme grønne valgt-state/ikoner/labels — ikke en tredje,
// selvstændig kopi af samme data/UI), og redigeres direkte på én
// side i stedet for et trin-for-trin-flow. Eksisterende valg er
// allerede forudmarkeret, da komponenterne får den samme, delte
// state (allergens/customAllerg/user.diets/selectedENumbers) som
// profilens egen oversigt viser.
// Udskilt fra ProfileScreen.jsx 30. sept. 2026 (arkitektur-audit A8).
// glutenFreeAutoApplied kommer fra ProfileScreen, fordi gluten↔glutenfri-
// synkroniseringen (useGlutenFreeSync) hele tiden har kørt, mens profil-
// skærmene er åbne — ikke kun på denne skærm.
export default function EditPreferencesScreen({ customInput, setCustomInput }) {
  const { user, setUser, userId, accessToken } = useAuthContext();
  const { allergens: savedAllergens, setAllergens, customAllerg: savedCustom, setCustomAllerg } = useProfileContext();
  const { setScreen, openLegal } = useNavigationContext();
  const { selectedENumbers: savedENumbers, setSelectedENumbers } = useAllergenPrefsContext();
  // Kladde (14. okt. 2026, G3): redigeringen rører aldrig appens delte profil, før Gem er lykkedes. Ellers ville en fortrudt
  // eller fejlet ændring (fx fjernet "Nødder") stadig styre scanning, liste og historik, indtil appen genstartes (falsk grønt).
  // Kladden følger den gemte profil, indtil brugeren selv rører ved noget (data kan nå at blive hentet efter skærmen er åbnet).
  const [draftAllergens, setAllergensDraft] = useState(savedAllergens);
  const [draftCustom, setCustomDraft] = useState(savedCustom);
  const [draftENumbers, setENumbersDraft] = useState(savedENumbers);
  const [draftLevels, setLevelsDraft] = useState(user.allergenLevels || {});
  const allergens = draftAllergens, customAllerg = draftCustom, selectedENumbers = draftENumbers;
  const [savingProfile, setSavingProfile] = useState(false);
  // Samtykke til helbredsoplysninger (2. okt. 2026): kræves, før allergier gemmes.
  const consent = useHealthConsent();
  const [consentChecked, setConsentChecked] = useState(false);
  const hasHealthData = (allergens.length + customAllerg.length + (customInput.trim() ? 1 : 0)) > 0;
  const consentOk = canSaveHealthData({ hasHealthData, given: consent.current, checked: consentChecked });
  // Samme lukket-som-standard Accordion-mønster for E-numre som MemberForm.
  const [showENumre, setShowENumre] = useState(false);

  // Ugemte ændringer (2. okt. 2026): "Gem ændringer" vises kun, når brugeren har ændret noget. Grundlinjen følger med, indtil brugeren
  // selv rører ved noget (data kan nå at blive indlæst efter skærmen er åbnet), og fryses derefter. Skrives der i "Skriv selv"-feltet,
  // tæller det også som en ændring, fordi teksten tilføjes ved gem.
  const snapshot = prefsSnapshot({ allergens, customAllerg, levels: draftLevels, eNumbers: selectedENumbers });
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (touched) return;
    setAllergensDraft(savedAllergens); setCustomDraft(savedCustom); setENumbersDraft(savedENumbers); setLevelsDraft(user.allergenLevels || {});
  }, [touched, savedAllergens, savedCustom, savedENumbers, user.allergenLevels]);
  const [baseline, setBaseline] = useState(snapshot);
  useEffect(() => { if (!touched) setBaseline(snapshot); }, [snapshot, touched]);
  const touch = (fn) => (...args) => { setTouched(true); return fn(...args); };
  const dirty = (touched && snapshot !== baseline) || customInput.trim() !== "";

  // Plads til bundnavigationen og "Gem ændringer"-bjælken, så intet indhold kan ligge bag dem ved nogen scrolposition.
  const navH = useMeasuredHeight(() => document.querySelector(".bottom-nav"));
  const barRef = useRef(null);
  const barH = useMeasuredHeight(() => barRef.current, [dirty]);
  const bottomPad = navH + (dirty ? barH : 0) + 24;

  const save = async () => {
    setSavingProfile(true);
    try {
      if (hasHealthData && !consent.current) await consent.give();
      // Flush en evt. ikke-tilføjet tekst i "Skriv selv"-feltet, så den ikke går tabt
      const pendingCustom = customInput.trim();
      const allCustom = pendingCustom ? addUniqueCustom(customAllerg, pendingCustom) : customAllerg;
      if (pendingCustom) { setCustomDraft(allCustom); setCustomInput(""); }

      // Én transaktion (RPC save_my_allergens, F2-2): fejler gemningen, er profilen uændret
      await saveMyAllergens({
        accessToken, userId, allergens, custom: allCustom,
        eNumbers: selectedENumbers || [],
        allergenLevels: pruneAllergenLevels(draftLevels, allergens),
      });
      // Først nu, hvor gemningen er lykkedes, gælder ændringen i resten af appen.
      setAllergens(allergens); setCustomAllerg(allCustom); setSelectedENumbers(selectedENumbers || []);
      setUser(u => ({ ...u, allergenLevels: pruneAllergenLevels(draftLevels, allergens) }));
      setScreen(SCREENS.PROFILE);
    } catch (e) {
      reportError(e, { source: "edit-preferences" });
      showToast("Dine ændringer kunne ikke gemmes. Prøv igen.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="screen fade-in" style={{ paddingBottom: bottomPad }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"16px 0 20px" }}>
        <div className="screen-title" style={{ textAlign:"left", width:"auto" }}>Rediger præferencer</div>
      </div>

      <div className="card" style={UI.mb10}>
        <div className="card-lbl" style={UI.mb8}>Allergier / intolerancer</div>
        <AllergenChipPicker selected={allergens} onChange={touch(arr => {
          setAllergensDraft(arr);
          // Fjernes et allergen, fjernes dets sporvalg også (ingen skjulte værdier)
          setLevelsDraft(lv => pruneAllergenLevels(lv, arr));
        })} />
        <AllergenSensitivity selected={allergens} levels={draftLevels}
          onChange={touch(lv => setLevelsDraft(lv))} />

        <CustomAllergenField customAllerg={customAllerg} setCustomAllerg={setCustomDraft} customInput={customInput} setCustomInput={setCustomInput}
          onChange={() => setTouched(true)} />
      </div>

      <div className="card" style={UI.mb10}>
        <Accordion label="Overvåg specifikke E-numre" count={selectedENumbers.length}
          open={showENumre} onToggle={() => setShowENumre(s => !s)}>
          <div style={UI.mt8}>
            <ENumberPicker selected={selectedENumbers} onChange={touch(setENumbersDraft)} />
          </div>
        </Accordion>
      </div>

      {hasHealthData && !consent.current && (
        <HealthConsentBox checked={consentChecked} onChange={setConsentChecked} openPrivacy={() => openLegal(SCREENS.PRIVACY)} />
      )}
      {/* Fast "Gem ændringer"-bjælke lige over bundnavigationen, kun ved ugemte ændringer. Portal til body, fordi .screen.fade-in efterlader en
          transform, der ville fange position:fixed (se CLAUDE.md). Bundnavigationens højde (inkl. iOS safe area) måles, se useMeasuredHeight. */}
      {dirty && createPortal(
        <div ref={barRef} className="save-bar" style={{ bottom: navH }}>
          <button className="btn btn-primary btn-full" disabled={savingProfile || !consentOk} onClick={save}>{savingProfile ? "Gemmer…" : "Gem ændringer"}</button>
        </div>,
        document.body
      )}
    </div>
  );
}
