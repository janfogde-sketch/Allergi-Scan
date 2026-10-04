// @ts-nocheck
// "Vidste du, at …"-kortet på scanner-forsiden (4. okt. 2026, Bjørn).
// Henter de godkendte tips fra Allergileksikonet (knowledge_base.tips, offentlig læsning med anon-nøglen
// som KnowledgeScreen) én gang pr. app-session og vælger dagens tip ud fra de allergener, der tjekkes for.
// Fejler hentningen, vises intet kort (ingen fejlbesked: kortet er ekstra værdi, ikke en funktion).
import { useEffect, useMemo, useState } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { pickDailyTip, localDayNumber } from "./helpers.js";

let cachedEntries = null; // pr. app-session
let pending = null;

function loadTipEntries() {
  if (cachedEntries) return Promise.resolve(cachedEntries);
  if (!pending) {
    pending = fetch(`${SUPABASE_URL}/rest/v1/knowledge_base?tips=not.is.null&select=slug,allergen_ids,tips`, {
      headers: { "apikey": SUPABASE_ANON_KEY, "Accept": "application/json" },
    })
      .then(res => (res.ok ? res.json() : []))
      .then(data => { cachedEntries = Array.isArray(data) ? data : []; return cachedEntries; })
      .catch(() => { pending = null; return []; });
  }
  return pending;
}

// allergenIds: samlede allergener for de profiler, der aktuelt tjekkes for.
export function useDailyTip(allergenIds) {
  const [entries, setEntries] = useState(cachedEntries);
  useEffect(() => {
    let alive = true;
    if (!cachedEntries) loadTipEntries().then(data => { if (alive) setEntries(data); });
    return () => { alive = false; };
  }, []);
  const key = [...new Set(allergenIds || [])].sort().join(",");
  return useMemo(
    () => (entries ? pickDailyTip(entries, key ? key.split(",") : [], localDayNumber()) : null),
    [entries, key],
  );
}
