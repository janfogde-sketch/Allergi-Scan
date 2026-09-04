// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useOnboarding.js
// Onboarding-flow state og gem-funktioner.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SCREENS } from "./constants.jsx";
import { makeHeaders, apiCall } from "./helpers.js";

export function useOnboarding({ accessToken, userId, user, loginEmail,
                                allergens, customAllerg,
                                setUser, setScreen, setEditMode, setIsOAuth }) {

  const [onboardStep, setOnboardStep] = useState(0);
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
          age: user.age ? parseInt(user.age) : null,
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

  const finishOnboard = async () => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${accessToken}`, "Prefer": "return=minimal" },
        body: JSON.stringify({ onboarding_completed: true }),
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
    finishOnboard,
  };
}
