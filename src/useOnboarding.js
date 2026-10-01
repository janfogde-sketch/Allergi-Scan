// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useOnboarding.js
// Onboarding-flow state og gem-funktioner.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SCREENS } from "./constants.jsx";
import { makeHeaders, apiCall, pruneAllergenLevels } from "./helpers.js";

// onboardStep/setOnboardStep er deklareret i App.jsx og sendes ind som
// props (29. sept. 2026, "Onboarding-persistens") — IKKE længere lokal
// state her. useAuth.js skal kunne sætte det aktuelle trin direkte ved
// login/OAuth/app-boot-genoptagelse, og useAuth() kaldes FØR useOnboarding()
// i App.jsx — en lokal useState her ville derfor ikke eksistere endnu på
// det tidspunkt useAuth() sætter sin konfiguration op.
export function useOnboarding({ accessToken, userId, user, loginEmail, screen,
                                onboardStep, setOnboardStep,
                                allergens, customAllerg, selectedENumbers = [],
                                setUser, markOnboardingCompleted, setScreen, setEditMode, setIsOAuth }) {

  const [editMode, setEditModeLocal]  = useState(false);
  const [tourIdx, setTourIdx]         = useState(0);
  const [customInput, setCustomInput] = useState("");

  // Persistér det aktuelle trin til backend, hver gang det ændrer sig (29.
  // sept. 2026, "Onboarding-persistens") — onboardStep levede tidligere KUN
  // som lokal React-state, nulstillet til 1 hver gang appen blev genstartet,
  // uanset hvor langt brugeren faktisk var kommet. Gated til KUN at køre
  // mens skærmen reelt er ONBOARD — ellers ville denne effekt også fyre
  // ved almindelig appstart for en allerede færdig bruger (onboardStep's
  // useState-default er 1) og fejlagtigt nulstille deres gemte trin i
  // backend, selvom de aldrig ser onboarding-UI'et.
  useEffect(() => {
    if (!accessToken || !userId) return;
    if (screen !== SCREENS.ONBOARD) return;
    apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
      method: "PATCH",
      headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
      body: JSON.stringify({ onboarding_step: onboardStep }),
    }).catch(() => {});
  }, [onboardStep, screen, accessToken, userId]);

  // Wrap setEditMode so both local + parent stay in sync
  const setEditMode_ = (val) => {
    setEditModeLocal(val);
    setEditMode(val);
  };

  // Artifact-preview uden login (--mode artifact-preview, knappen "Start onboarding (preview)" på velkomstsiden):
  // der er ingen session at gemme til, så trinnene går bare videre uden netværkskald. Aldrig aktiv i produktion.
  const previewNoSession = import.meta.env.MODE === "artifact-preview" && !accessToken;

  const saveProfileStep1 = async () => {
    if (previewNoSession) return;
    if (!(user.name || "").trim()) return;
    const emailToSave = user.email || loginEmail || "";
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
        body: JSON.stringify({
          name: user.name.trim(),
          email: emailToSave || null,
          // Telefon indsamles ikke længere i onboarding (30. sept. 2026) —
          // sendes ikke med, så et eventuelt gemt nummer ikke overskrives.
          // Gemmes som fødselsår (samme skema som familiemedlemmer og resten
          // af appen) i stedet for rå alder, så det ikke bliver forældet —
          // "alder" er kun UI-sproget, ikke det lagrede felt.
          birth_year: user.age ? new Date().getFullYear() - parseInt(user.age) : null,
          gender: user.gender || null,
        }),
      });
      setUser(u => ({ ...u, name: (u.name || "").trim(), ...(emailToSave ? { email: emailToSave } : {}) }));
    } catch (e) { console.error("saveProfileStep1 fejl:", e); }
  };

  // overrideAllergens/overrideCustomAllerg (29. sept. 2026, "auto-fremad ved
  // 'ingen allergier'") — samme princip som saveDietStep3(diets) nedenfor:
  // knappen der rydder+gemmer+går videre i ét klik kalder setAllergens([])/
  // setCustomAllerg([]) og skal gemme den SAMME tomme liste med det samme,
  // men React batcher state-opdateringer, så allergens/customAllerg i denne
  // funktions closure stadig ville være de GAMLE, ikke-ryddede værdier hvis
  // funktionen kaldes synkront lige efter setAllergens([]) uden et re-render
  // imellem. Eksplicitte parametre (default til closure-værdien, når de ikke
  // gives) omgår racet helt, i stedet for at gemme forkerte/forældede data.
  const saveAllergensStep2 = async (overrideAllergens, overrideCustomAllerg) => {
    if (previewNoSession) return;
    const allergensToSave = overrideAllergens !== undefined ? overrideAllergens : allergens;
    const customToSave = overrideCustomAllerg !== undefined ? overrideCustomAllerg : customAllerg;
    // Tidligere blev hvert allergen POST'et enkeltvis i et loop efter DELETE —
    // fejlede ét kald midtvejs (fx netværksudfald), endte brugeren med en
    // DELVIST gemt allergiliste uden nogen advarsel. Kritisk i en app der skal
    // advare mod farlige allergener. Nu: DELETE + én samlet POST af alle rækker,
    // så det enten lykkes helt eller slet ikke — og fejl kastes videre i stedet
    // for at blive slugt stille.
    await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens?user_id=eq.${userId}`, {
      method: "DELETE",
      headers: makeHeaders(accessToken),
    });
    const rows = [
      ...allergensToSave.map(a => ({ user_id: userId, allergen: a, type: "allergen" })),
      ...customToSave.map(c => ({ user_id: userId, allergen: c, type: "custom" })),
    ];
    if (rows.length > 0) {
      await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens`, {
        method: "POST",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
        body: JSON.stringify(rows),
      });
    }
    // E-numre gemmes på samme trin i UI'et (Accordion inde i renderStep2),
    // men blev tidligere KUN gemt fra Rediger præferencer på Profil-siden,
    // aldrig fra selve onboardingen — et reelt hul (29. sept. 2026,
    // "Onboarding-persistens"): lukkede brugeren appen efter at have valgt
    // E-numre her, men før hele onboardingen var gennemført, gik valget tabt.
    await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
      method: "PATCH",
      headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
      body: JSON.stringify({ e_numbers: selectedENumbers || [], allergen_levels: pruneAllergenLevels(user.allergenLevels, allergensToSave) }),
    });
  };

  // Samme hul som E-numre ovenfor gjaldt kostpræferencer (trin 3) — valgt i
  // UI'et (user.diets), men aldrig gemt til backend under selve onboardingen.
  const saveDietStep3 = async (diets) => {
    if (previewNoSession) return;
    await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
      method: "PATCH",
      headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
      body: JSON.stringify({ diets: diets || [] }),
    });
  };

  const finishOnboard = async () => {
    try {
      if (!previewNoSession) await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${accessToken}`, "Prefer": "return=minimal" },
        body: JSON.stringify({ onboarding_completed: true, diets: user.diets || [], e_numbers: selectedENumbers }),
      });
    } catch {}
    // markOnboardingCompleted (IKKE et almindeligt setUser-kald — se dens
    // egen kommentar i App.jsx for hele fejlfindingen) opdaterer en ref
    // SYNKRONT, så App.jsx's route guard garanteret ser "færdig" allerede i
    // dette setScreen-kald nedenfor, i stedet for at bruge en forældet
    // closure-værdi og fejlagtigt sende brugeren tilbage til ONBOARD (bug
    // rettet 29. sept. 2026: "Ikke nu" i trin 5 endte tilbage på trin 5 efter
    // beta-introen, fordi screen reelt aldrig blev HOME, kun skjult bag
    // beta-modalens fuldskærms-overlay).
    markOnboardingCompleted();
    setScreen(SCREENS.HOME);
    setEditModeLocal(false);
    setEditMode(false);
    setIsOAuth(false);
  };

  return {
    editMode, setEditMode: setEditMode_,
    tourIdx, setTourIdx,
    customInput, setCustomInput,
    saveProfileStep1,
    saveAllergensStep2,
    saveDietStep3,
    finishOnboard,
  };
}
