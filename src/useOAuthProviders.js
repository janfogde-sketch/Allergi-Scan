// @ts-nocheck
// Hvilke sociale logins er slået til i Supabase (8. okt. 2026). "Fortsæt med Apple" vises først, når Apple-udbyderen
// er aktiveret i Supabase (Authentication → Providers), så knappen kan kobles på uden en ny app-version.
// Google og Facebook er altid slået til og vises uanset svaret.
import { useEffect, useState } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";

export function appleEnabledFromSettings(settings) {
  return settings?.external?.apple === true;
}

export function useOAuthProviders() {
  const [apple, setApple] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_ANON_KEY } })
      .then(r => (r.ok ? r.json() : null))
      .then(s => { if (!cancelled) setApple(appleEnabledFromSettings(s)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return { apple };
}
