// @ts-nocheck
// Henter samlede tal for frafald i onboarding (RPC admin_onboarding_funnel; kun admins, ingen data pr. bruger).
import { useState } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";
import { showToast } from "../SharedComponents.jsx";

export function useOnboardingFunnel(accessToken) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiCall(`${SUPABASE_URL}/rest/v1/rpc/admin_onboarding_funnel`, {
        method: "POST", headers: { ...makeHeaders(accessToken), "Content-Type": "application/json" }, body: "{}",
      });
      setData(res || null);
    } catch (e) {
      showToast("Kunne ikke hente frafald: " + e.message, "error");
    }
    setLoading(false);
  };

  return { data, loading, load };
}
