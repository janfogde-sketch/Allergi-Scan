// @ts-nocheck
import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { SCREENS, SUPABASE_URL, DIETS_ENABLED } from "./constants.jsx";
import { makeHeaders, apiCall, addUniqueCustom } from "./helpers.js";
import { showToast } from "./SharedComponents.jsx";
import { Accordion } from "./DesignSystem.jsx";
import { ENumberPicker, AllergenChipPicker, AllergenSensitivity, DietChipPicker } from "./AllergenPicker.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useAllergenPrefsContext } from "./AllergenPrefsContext.jsx";
import { UI } from "./styleUtils.js";
import { useHealthConsent } from "./useHealthConsent.js";
import HealthConsentBox from "./HealthConsentBox.jsx";
import { canSaveHealthData } from "./healthConsent.js";

// Højden på en fast placeret bjælke (bundnavigationen eller "Gem ændringer"-bjælken), målt løbende (2. okt. 2026, Bjørn): bundnavigationens
// højde afhænger af iPhone'ens safe area (hjemmeindikator), så en fast padding på siden (110 px) kunne ende under navigationen.
// Måles på border-box, så ændringer i safe area-padding (rotation, andre iPhone-modeller) også opfanges.
function useMeasuredHeight(getEl, deps = []) {
  const [h, setH] = useState(0);
  useLayoutEffect(() => {
    const el = getEl();
    if (!el) { setH(0); return undefined; }
    const measure = () => setH(Math.round(el.getBoundingClientRect().height));
    measure();
    let ro;
    if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(measure); ro.observe(el, { box: "border-box" }); }
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => { ro?.disconnect(); window.removeEventListener("resize", measure); window.removeEventListener("orientationchange", measure); };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return h;
}

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
        body:JSON.stringify({ ...(DIETS_ENABLED ? { diets:user.diets||[] } : {}), e_numbers:selectedENumbers||[], allergen_levels:user.allergenLevels||{} }),
      });

      // Samlet DELETE + én bulk-POST i stedet for et loop af enkelt-POSTs —
      // ellers kan et fejlet kald midtvejs efterlade en delvist gemt liste
      await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens?user_id=eq.${userId}`, { method:"DELETE", headers:makeHeaders(accessToken) });
      const rows = [
        ...allergens.map(a => ({ user_id:userId, allergen:a, type:"allergen" })),
        ...allCustom.map(c => ({ user_id:userId, allergen:c, type:"custom" })),
      ];
      if (rows.length > 0) {
        await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens`, { method:"POST", headers:{ ...makeHeaders(accessToken), "Prefer":"return=minimal" }, body:JSON.stringify(rows) });
      }
      setScreen(SCREENS.PROFILE);
    } catch (e) {
      showToast("Fejl: " + e.message, "error");
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
        <AllergenChipPicker selected={allergens} onChange={touch(setAllergens)} />
        <AllergenSensitivity selected={allergens} levels={user.allergenLevels}
          onChange={touch(lv => setUser(u => ({ ...u, allergenLevels: lv })))} />

        <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid var(--border)" }}>
          <div style={UI.sectionLbl6}>Mangler din allergi eller intolerance?</div>
          <div className="input-row" style={{ marginTop:6, marginBottom: customAllerg.length ? 8 : 0 }}>
            <input className="field" placeholder='Skriv fx "Fruktose"…' value={customInput} onChange={e => setCustomInput(e.target.value)}
              aria-label="Egen allergi eller intolerance"
              onKeyDown={e => { if(e.key==="Enter"&&customInput.trim()){ setTouched(true); setCustomAllerg(c=>addUniqueCustom(c, customInput)); setCustomInput(""); }}} />
            <button className="btn btn-outline btn-sm" aria-label="Tilføj" onClick={() => { if(customInput.trim()){ setTouched(true); setCustomAllerg(c=>addUniqueCustom(c, customInput)); setCustomInput(""); }}}>+</button>
          </div>
          {customAllerg.length > 0 && (
            <div className="tags">
              {customAllerg.map((a,i) => (
                <div key={i} className="tag">{a}<span className="tag-x" role="button" aria-label={`Fjern "${a}"`} tabIndex={0}
                  onClick={() => { setTouched(true); setCustomAllerg(c=>c.filter((_,j)=>j!==i)); }} onKeyDown={e => { if (e.key === "Enter") { setTouched(true); setCustomAllerg(c=>c.filter((_,j)=>j!==i)); } }}>×</span></div>
              ))}
            </div>
          )}
        </div>
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
