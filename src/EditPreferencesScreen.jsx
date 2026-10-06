// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { SCREENS, SUPABASE_URL, DIETS_ENABLED } from "./constants.jsx";
import { makeHeaders, apiCall, addUniqueCustom, pruneAllergenLevels } from "./helpers.js";
import { showToast } from "./SharedComponents.jsx";
import { Accordion } from "./DesignSystem.jsx";
import { ENumberPicker, AllergenChipPicker, AllergenSensitivity, DietChipPicker, CustomAllergenField } from "./AllergenPicker.jsx";
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
const prefsSnapshot = ({ allergens, customAllerg, levels, diets, eNumbers }) => JSON.stringify({
  a: [...(allergens || [])].sort(), c: [...(customAllerg || [])].sort(), l: Object.entries(levels || {}).sort(),
  d: [...(diets || [])].sort(), e: [...(eNumbers || [])].sort(),
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
export default function EditPreferencesScreen({ customInput, setCustomInput, glutenFreeAutoApplied, setGlutenFreeAutoApplied }) {
  const { user, setUser, userId, accessToken } = useAuthContext();
  const { allergens, setAllergens, customAllerg, setCustomAllerg } = useProfileContext();
  const { setScreen, openLegal } = useNavigationContext();
  const { selectedENumbers, setSelectedENumbers } = useAllergenPrefsContext();
  const [savingProfile, setSavingProfile] = useState(false);
  // Samtykke til helbredsoplysninger (2. okt. 2026): kræves, før allergier gemmes.
  const consent = useHealthConsent();
  const [consentChecked, setConsentChecked] = useState(false);
  const hasHealthData = (allergens.length + customAllerg.length + (customInput.trim() ? 1 : 0)) > 0;
  const consentOk = canSaveHealthData({ hasHealthData, given: consent.given, checked: consentChecked });
  // Samme lukket-som-standard Accordion-mønster for E-numre som MemberForm.
  const [showENumre, setShowENumre] = useState(false);

  // Ugemte ændringer (2. okt. 2026): "Gem ændringer" vises kun, når brugeren har ændret noget. Grundlinjen følger med, indtil brugeren
  // selv rører ved noget (data kan nå at blive indlæst efter skærmen er åbnet), og fryses derefter. Skrives der i "Skriv selv"-feltet,
  // tæller det også som en ændring, fordi teksten tilføjes ved gem.
  const snapshot = prefsSnapshot({ allergens, customAllerg, levels: user.allergenLevels, diets: user.diets, eNumbers: selectedENumbers });
  const [touched, setTouched] = useState(false);
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
      if (hasHealthData && !consent.given) await consent.give();
      // Flush en evt. ikke-tilføjet tekst i "Skriv selv"-feltet, så den ikke går tabt
      const pendingCustom = customInput.trim();
      const allCustom = pendingCustom ? addUniqueCustom(customAllerg, pendingCustom) : customAllerg;
      if (pendingCustom) { setCustomAllerg(allCustom); setCustomInput(""); }

      await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
        method:"PATCH",
        headers:{ ...makeHeaders(accessToken), "Prefer":"return=minimal" },
        // Mens kostpræferencer er på pause, røres de gemte valg ikke (sendes ikke med)
        body:JSON.stringify({ ...(DIETS_ENABLED ? { diets:user.diets||[] } : {}), e_numbers:selectedENumbers||[], allergen_levels:pruneAllergenLevels(user.allergenLevels, allergens) }),
      });

      // Én transaktion (RPC save_my_allergens, F2-2): fejler gemningen, er profilen uændret
      await saveMyAllergens({ accessToken, userId, allergens, custom: allCustom });
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
          setAllergens(arr);
          // Fjernes et allergen, fjernes dets sporvalg også (ingen skjulte værdier)
          setUser(u => ({ ...u, allergenLevels: pruneAllergenLevels(u.allergenLevels, arr) }));
        })} />
        <AllergenSensitivity selected={allergens} levels={user.allergenLevels}
          onChange={touch(lv => setUser(u => ({ ...u, allergenLevels: lv })))} />

        <CustomAllergenField customAllerg={customAllerg} setCustomAllerg={setCustomAllerg} customInput={customInput} setCustomInput={setCustomInput}
          onChange={() => setTouched(true)} />
      </div>

      {DIETS_ENABLED && (
        <div className="card" style={UI.mb10}>
          <div className="card-lbl" style={UI.mb8}>Kostpræferencer</div>
          <DietChipPicker selected={user.diets || []}
            autoNote={glutenFreeAutoApplied ? { id:"gluten-free", text:"Valgt ud fra gluten" } : undefined}
            onChange={arr => {
              if (arr.includes("gluten-free") !== (user.diets||[]).includes("gluten-free")) setGlutenFreeAutoApplied(false);
              setTouched(true);
              setUser(u => ({ ...u, diets: arr }));
            }} />
        </div>
      )}

      <div className="card" style={UI.mb10}>
        <Accordion label="Overvåg specifikke E-numre" count={selectedENumbers.length}
          open={showENumre} onToggle={() => setShowENumre(s => !s)}>
          <div style={UI.mt8}>
            <ENumberPicker selected={selectedENumbers} onChange={touch(setSelectedENumbers)} />
          </div>
        </Accordion>
      </div>

      {hasHealthData && !consent.given && (
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
