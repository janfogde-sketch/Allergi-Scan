// @ts-check
// Samlede tal for frafald i onboarding (RPC admin_onboarding_stats; kun administratorer, ingen oplysninger om enkelte brugere). Kohorten afgrænses af perioden
// (konti oprettet i perioden, dansk tid). En fejl er en egen tilstand; findes funktionen ikke endnu (migrationen er ikke udgivet), er unavailable sand.
import { useState, useRef, useCallback } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";

export function useOnboardingFunnel(/** @type {string} */ accessToken) {
  const [data, setData] = useState(/** @type {any} */ (null));
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(/** @type {null | { denied: boolean, unavailable: boolean }} */ (null));
  const paramsRef = useRef(/** @type {{ from: string, to: string, includeTest: boolean } | null} */ (null));
  const seq = useRef(0);

  const load = useCallback(async (/** @type {any} */ params) => {
    if (params && typeof params === "object" && !("nativeEvent" in params)) paramsRef.current = params;
    const p = paramsRef.current;
    if (!p) return;
    const mine = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const res = await apiCall(`${SUPABASE_URL}/rest/v1/rpc/admin_onboarding_stats`, {
        method: "POST", headers: { ...makeHeaders(accessToken), "Content-Type": "application/json" },
        body: JSON.stringify({ p_from: p.from, p_to: p.to, p_include_test: !!p.includeTest }),
      });
      if (mine !== seq.current) return;
      setData(res && typeof res === "object" ? res : null);
      setLoaded(true);
    } catch (e) {
      if (mine !== seq.current) return;
      const status = /** @type {any} */ (e).status;
      setError({ denied: status === 401 || status === 403, unavailable: status === 404 });
    }
    if (mine === seq.current) setLoading(false);
  }, [accessToken]);

  return { data, loading, loaded, error, load };
}
