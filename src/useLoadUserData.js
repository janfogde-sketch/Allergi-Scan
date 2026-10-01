// @ts-nocheck
// Henter brugerens profil, allergener, familie, indkøbsliste og favoritter
// ved login. Flyttet uændret fra App.jsx 30. sept. 2026 (arkitektur-audit A8).
import React from "react";
import { SUPABASE_URL } from "./constants.jsx";
import { apiCall, makeHeaders } from "./helpers.js";

export function useLoadUserData({
  accessToken, userId, setUser, setSelectedENumbers, setAllergens, setCustomAllerg,
  loadFamily, loadShoppingList, loadFavorites,
}) {
  // ── Load brugerdata ved login ─────────────────────────────────────────────
  React.useEffect(() => {
    if (!accessToken || !userId) return;
    // Skifter login midt i indlæsningen (fx en ny bruger fra
    // bekræftelsesmailen i en browser, hvor en anden konto var logget ind),
    // må den gamle kontos svar ikke overskrive den nye kontos data.
    let cancelled = false;

    const loadAll = async () => {
      try {
        // Brugerprofil
        const profile = await apiCall(
          `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=name,email,phone,birth_year,gender,role,onboarding_completed,onboarding_step,diets,e_numbers,allergen_levels,created_at&limit=1`,
          { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
        );
        if (cancelled) return;
        if (Array.isArray(profile) && profile[0]) {
          const p = profile[0];
          setUser(u => ({
            ...u,
            name: p.name || u.name || "",
            email: p.email || u.email || "",
            phone: p.phone || "",
            age: p.birth_year ? String(new Date().getFullYear() - p.birth_year) : "",
            birth_year: p.birth_year || "",
            gender: p.gender || "",
            role: p.role || "user",
            // onboarding_completed/-_step blev tidligere hentet her men aldrig
            // gemt i state — routing kunne derfor ikke reagere på reel status
            // (29. sept. 2026, "Onboarding-persistens"). Se setScreen-guarden
            // og useAuth.js's app-boot-/login-/OAuth-korrektion, som alle
            // afhænger af disse to felter.
            onboarding_completed: p.onboarding_completed !== false,
            onboarding_step: p.onboarding_step || 1,
            diets: p.diets || [],
            allergenLevels: p.allergen_levels || {},
            created_at: p.created_at || u.created_at || "",
          }));
          setSelectedENumbers(p.e_numbers || []);
        }

        // Allergener
        const allergenData = await apiCall(
          `${SUPABASE_URL}/rest/v1/user_allergens?user_id=eq.${userId}&select=allergen,type`,
          { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
        );
        if (cancelled) return;
        if (Array.isArray(allergenData)) {
          setAllergens(allergenData.filter(a => a.type === "allergen").map(a => a.allergen));
          setCustomAllerg(allergenData.filter(a => a.type === "custom").map(a => a.allergen));
        }

        // Familie + indkøb + favoritter
        loadFamily();
        loadShoppingList();
        loadFavorites();
      } catch (e) {
        console.error("loadAll fejl:", e);
      }
    };

    loadAll();
    return () => { cancelled = true; };
  }, [accessToken, userId]);
}
