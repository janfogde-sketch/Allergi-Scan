// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useFoodWaste.js — PROTOTYPE (17. sept. 2026)
// Tjekker om det aktuelt viste produkt (via EAN) er nedsat pga. snarlig
// udløbsdato i en nærliggende Netto/Føtex/Bilka-butik, via Edge Function
// `food-waste` (Salling Group's officielle "Anti Food Waste"-API).
// Kræver browserens geolocation — beder først om lokation når brugeren selv
// trykker "Tjek for tilbud", ikke automatisk ved sideindlæsning.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import { SUPABASE_URL } from "./constants.jsx";
import { makeHeaders } from "./helpers.js";

export function useFoodWaste({ accessToken }) {
  const [matches, setMatches]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [checked, setChecked]   = useState(false);
  const [error, setError]       = useState(null);

  const checkFoodWaste = useCallback((ean) => {
    if (!ean) return;
    setLoading(true);
    setError(null);
    setMatches([]);

    if (!navigator.geolocation) {
      setError("Din browser understøtter ikke lokation");
      setLoading(false);
      setChecked(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const url = `${SUPABASE_URL}/functions/v1/food-waste`
            + `?ean=${encodeURIComponent(ean)}`
            + `&lat=${latitude}&lon=${longitude}`;
          const res = await fetch(url, { headers: makeHeaders(accessToken) });
          const data = await res.json();

          if (data.available === false) {
            setError("not_configured");
          } else {
            setMatches(data.matches || []);
          }
        } catch {
          setError("Kunne ikke hente tilbud lige nu");
        }
        setLoading(false);
        setChecked(true);
      },
      () => {
        setError("Kunne ikke få adgang til din lokation");
        setLoading(false);
        setChecked(true);
      },
      { timeout: 8000 }
    );
  }, [accessToken]);

  const resetFoodWaste = useCallback(() => {
    setMatches([]);
    setLoading(false);
    setChecked(false);
    setError(null);
  }, []);

  return { matches, loading, checked, error, checkFoodWaste, resetFoodWaste };
}
