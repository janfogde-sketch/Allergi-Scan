// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useHousehold.js (1. okt. 2026)
// Husstandens rigtige EatSafe-konti (edge-funktionen family/group). Hentes her
// i App.jsx i stedet for lokalt i ProfileScreen, så de også kan vælges som
// profil ved scanning, i søgning, lister, historik og Madpas (som skrive-
// beskyttede profiler, se householdToProfiles i helpers.js). Genhentes ved
// appstart, når appen kommer tilbage i forgrunden (så en ændring af en andens
// allergier slår igennem) og når Familie åbnes (loadHousehold).
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { SUPABASE_URL } from "./constants.jsx";
import { makeHeaders, apiCall } from "./helpers.js";

export function useHousehold({ accessToken }) {
  const [household, setHousehold] = useState([]);
  const [householdLoading, setHouseholdLoading] = useState(false);
  // Først når et svar er kommet, må valget af husstandsprofiler ryddes op — en
  // fejlet hentning må aldrig se ud som "husstanden er tom".
  const [householdLoaded, setHouseholdLoaded] = useState(false);

  const loadHousehold = useCallback(() => {
    if (!accessToken) return Promise.resolve();
    setHouseholdLoading(true);
    return apiCall(`${SUPABASE_URL}/functions/v1/family/group`, { headers: makeHeaders(accessToken) })
      .then(data => { if (data?.success) { setHousehold(data.members || []); setHouseholdLoaded(true); } })
      .catch(() => {})
      .finally(() => setHouseholdLoading(false));
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) { setHousehold([]); setHouseholdLoaded(false); return; }
    loadHousehold();
  }, [accessToken, loadHousehold]);

  useEffect(() => {
    if (!accessToken) return;
    const onVisible = () => { if (document.visibilityState === "visible") loadHousehold(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [accessToken, loadHousehold]);

  return { household, setHousehold, householdLoading, householdLoaded, loadHousehold };
}
