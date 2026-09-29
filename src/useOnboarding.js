// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useOnboarding.js
// Onboarding-flow state og gem-funktioner.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SCREENS } from "./constants.jsx";
import { makeHeaders, apiCall } from "./helpers.js";

export function useOnboarding({ accessToken, userId, user, loginEmail,
                                allergens, customAllerg, selectedENumbers = [],
                                setUser, setScreen, setEditMode, setIsOAuth }) {

  const [onboardStep, setOnboardStep] = useState(1);
  const [editMode, setEditModeLocal]  = useState(false);
  const [tourIdx, setTourIdx]         = useState(0);
  const [customInput, setCustomInput] = useState("");

  // Wrap setEditMode so both local + parent stay in sync
  const setEditMode_ = (val) => {
    setEditModeLocal(val);
    setEditMode(val);
  };

  const saveProfileStep1 = async () => {
    if (!(user.name || "").trim()) return;
    const emailToSave = user.email || loginEmail || "";
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
        body: JSON.stringify({
          name: user.name,
          email: emailToSave || null,
          phone: user.phone || null,
          // Gemmes som fødselsår (samme skema som familiemedlemmer og resten
          // af appen) i stedet for rå alder, så det ikke bliver forældet —
          // "alder" er kun UI-sproget, ikke det lagrede felt.
          birth_year: user.age ? new Date().getFullYear() - parseInt(user.age) : null,
          gender: user.gender || null,
        }),
      });
      if (emailToSave) setUser(u => ({ ...u, email: emailToSave }));
    } catch (e) { console.error("saveProfileStep1 fejl:", e); }
    setOnboardStep(4);
  };

  const saveAllergensStep2 = async () => {
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
      ...allergens.map(a => ({ user_id: userId, allergen: a, type: "allergen" })),
      ...customAllerg.map(c => ({ user_id: userId, allergen: c, type: "custom" })),
    ];
    if (rows.length === 0) return;
    await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens`, {
      method: "POST",
      headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
      body: JSON.stringify(rows),
    });
  };

  // Kostpræferencer (trin 3) og E-numre (valgt i trin 2) — blev tidligere kun
  // holdt i lokal state og gik tabt ved næste genindlæsning. `dietsOverride`
  // bruges når knappen samtidig nulstiller diets ("Ingen særlig diæt"), fordi
  // setUser ikke er slået igennem endnu i samme klik.
  const savePreferencesStep3 = async (dietsOverride) => {
    await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
      method: "PATCH",
      headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
      body: JSON.stringify({ diets: dietsOverride ?? user.diets ?? [], e_numbers: selectedENumbers }),
    });
  };

  const finishOnboard = async () => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${accessToken}`, "Prefer": "return=minimal" },
        body: JSON.stringify({ onboarding_completed: true, diets: user.diets || [], e_numbers: selectedENumbers }),
      });
    } catch {}
    setScreen(SCREENS.HOME);
    setEditModeLocal(false);
    setEditMode(false);
    setIsOAuth(false);
  };

  return {
    onboardStep, setOnboardStep,
    editMode, setEditMode: setEditMode_,
    tourIdx, setTourIdx,
    customInput, setCustomInput,
    saveProfileStep1,
    saveAllergensStep2,
    savePreferencesStep3,
    finishOnboard,
  };
}
