// @ts-nocheck
import { useState, useEffect } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { traceId, traceLog } from "./helpers.js";

export function useSearch({ accessToken }) {
  const [searchQuery, setSearchQuery]       = useState("");
  const [searchCategory, setSearchCategory] = useState("alle");
  const [searchResults, setSearchResults]   = useState([]);
  const [searchLoading, setSearchLoading]   = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchResults([]);
      const q = searchQuery.trim();
      const tid = traceId("search");
      traceLog(tid, "search:start", { q });
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/search?q=${encodeURIComponent(q)}`,
          { headers: { "apikey": SUPABASE_ANON_KEY, ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}) }, signal: controller.signal }
        );
        const data = await res.json();
        traceLog(tid, "search:response", { found: data.products?.length || 0 });
        if (data.success) {
          const results = (data.products || []).map(p => ({ ...p, source:"local", verified:p.verified_status, conflicts:[] }));
          traceLog(tid, "search:results", { q, count: results.length });
          setSearchResults(results);
        }
      } catch (e) {
        if (e.name === "AbortError") return; // en nyere søgning overtog — ignorér stille
        traceLog(tid, "search:error", { error: e?.message || String(e) });
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 350);
    // Annullér den forrige søgning når en ny startes — ellers kan et langsommere,
    // forældet svar nå at overskrive et hurtigere, nyere resultat
    return () => { clearTimeout(timer); controller.abort(); };
  }, [searchQuery, accessToken]);

  return { searchQuery, setSearchQuery, searchCategory, setSearchCategory, searchResults, setSearchResults, searchLoading };
}
