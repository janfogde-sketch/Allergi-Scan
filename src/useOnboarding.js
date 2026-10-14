// @ts-check
// ─────────────────────────────────────────────────────────────────────────────
// useOnboarding.js
// Onboarding-flow state og gem-funktioner.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { SUPABASE_URL, SCREENS } from "./constants.jsx";
import { makeHeaders, apiCall, pruneAllergenLevels } from "./helpers.js";
import { saveMyAllergens } from "./saveMyAllergens.js";
import { showToast } from "./SharedComponents.jsx";

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

  // G7 (14. okt. 2026): returnerer true, kun når serveren har bekræftet, at profilen er gemt; ellers vises en fejl, og trin 1 bliver stående.
  const saveProfileStep1 = async () => {
    if (previewNoSession) return true;
    if (!(user.name || "").trim()) return false;
    const emailToSave = user.email || loginEmail || "";
    try {
      const rows = await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=representation" },
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
      if (!Array.isArray(rows) || rows.length !== 1) throw new Error("Profilen blev ikke gemt");
      setUser(u => ({ ...u, name: (u.name || "").trim(), ...(emailToSave ? { email: emailToSave } : {}) }));
      return true;
    } catch (e) {
      console.error("saveProfileStep1 fejl:", e);
      showToast("Dine oplysninger kunne ikke gemmes. Tjek din forbindelse, og prøv igen.", "error");
      return false;
    }
  };

  // overrideAllergens/overrideCustomAllerg (29. sept. 2026, "auto-fremad ved
  // 'ingen allergier'") — samme princip som E-numre:
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
    // Én transaktion (RPC save_my_allergens, F2-2): enten gemmes hele listen, eller intet
    // ændres. Før kunne en fejl mellem DELETE og POST efterlade brugeren uden allergier.
    // E-numre og spor-valg gemmes i samme transaktion (de blev tidligere KUN gemt fra Rediger
    // præferencer, aldrig fra onboardingen: lukkede brugeren appen før onboarding var færdig, gik valget tabt).
    await saveMyAllergens({
      accessToken, userId, allergens: allergensToSave, custom: customToSave,
      eNumbers: selectedENumbers || [],
      allergenLevels: pruneAllergenLevels(user.allergenLevels, allergensToSave),
    });
  };

  // G7 (14. okt. 2026): onboarding afsluttes kun, når serveren har bekræftet det (rækken er opdateret og siger færdig).
  // Fejler gemmet, bliver brugeren i onboarding med en fejlbesked og kan prøve igen; før blev brugeren sendt til forsiden
  // alligevel, uden gemte E-numre og uden velkomstmail. Returnerer true/false.
  const finishOnboard = async () => {
    if (!previewNoSession) {
      try {
        const rows = await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=onboarding_completed`, {
          method: "PATCH",
          headers: { ...makeHeaders(accessToken), "Prefer": "return=representation" },
          body: JSON.stringify({ onboarding_completed: true, e_numbers: selectedENumbers }),
        });
        if (!Array.isArray(rows) || rows[0]?.onboarding_completed !== true) throw new Error("Onboarding blev ikke gemt");
      } catch (e) {
        console.error("finishOnboard fejl:", e);
        showToast("Opsætningen kunne ikke afsluttes. Tjek din forbindelse, og prøv igen.", "error");
        return false;
      }
    }
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
    return true;
  };

  return {
    editMode, setEditMode: setEditMode_,
    tourIdx, setTourIdx,
    customInput, setCustomInput,
    saveProfileStep1,
    saveAllergensStep2,
    finishOnboard,
  };
}
