// @ts-nocheck
// Henter og ændrer brugerens samtykke til helbredsoplysninger (2. okt. 2026).
// Uden session (artifact-preview) behandles samtykke som givet, da intet gemmes.
import { useState, useEffect, useCallback } from "react";
import { SUPABASE_URL, HEALTH_CONSENT_VERSION } from "./constants.jsx";
import { apiCall, makeHeaders } from "./helpers.js";
import { useAuthContext } from "./AuthContext.jsx";
import { consentFromRows, isConsentStale } from "./healthConsent.js";
import { clearOfflineCache } from "./useOffline.js";

export function useHealthConsent() {
  const { userId, accessToken } = useAuthContext();
  const noSession = !accessToken || !userId;
  const [state, setState] = useState({ loaded: noSession, given: noSession, at: null, version: null });
  // `given` = der findes et samtykke; `current` = det er givet på den nuværende tekstversion. Gem-flows bruger `current`.
  const stale = !noSession && isConsentStale(state, HEALTH_CONSENT_VERSION);
  const current = state.given && !stale;

  const load = useCallback(async () => {
    if (noSession) return;
    try {
      const rows = await apiCall(
        `${SUPABASE_URL}/rest/v1/consent_log?user_id=eq.${userId}&kind=eq.health&select=action,version,created_at&order=created_at.desc&limit=1`,
        { headers: makeHeaders(accessToken) });
      setState({ loaded: true, ...consentFromRows(rows) });
    } catch {
      setState(s => ({ ...s, loaded: true }));
    }
  }, [noSession, userId, accessToken]);

  useEffect(() => { load(); }, [load]);

  const give = useCallback(async () => {
    if (noSession) return;
    await apiCall(`${SUPABASE_URL}/rest/v1/rpc/give_health_consent`, {
      method: "POST", headers: makeHeaders(accessToken), body: JSON.stringify({ p_version: HEALTH_CONSENT_VERSION }),
    });
    await load();
  }, [noSession, accessToken, load]);

  const withdraw = useCallback(async () => {
    if (noSession) return;
    await apiCall(`${SUPABASE_URL}/rest/v1/rpc/withdraw_health_consent`, {
      method: "POST", headers: makeHeaders(accessToken), body: "{}",
    });
    // Helbredsdata er slettet på serveren; resultaterne gemt på telefonen (matchedDanger m.m.) skal følge med (F2-6).
    clearOfflineCache();
    await load();
  }, [noSession, accessToken, load]);

  return { ...state, stale, current, give, withdraw, reload: load };
}
