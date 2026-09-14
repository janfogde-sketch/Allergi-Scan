// @ts-nocheck
import { useState, useEffect } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { traceId, traceLog } from "./helpers.js";

export function useSearch({ accessToken }) {
  const [searchQuery, setSearchQuery]       = useState("");
  const [searchCategory, setSearchCategory] = useState("alle");
  const [searchResults, setSearchResults]   = useState([]);
  const [searchLoading, setSearchLoading]   = useState(false);
  // Sideinddeling — "Indlæs flere"-knappen i SearchScreen henter næste side
  // af de samme (allerede scorede) resultater, i stedet for at API'et altid
  // kappede hårdt ved 25 uanset hvor mange der reelt matchede.
  const [searchHasMore, setSearchHasMore]       = useState(false);
  const [searchTotal, setSearchTotal]           = useState(0);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchHasMore(false);
      setSearchTotal(0);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchResults([]);
      setSearchHasMore(false);
      setSearchTotal(0);
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
          setSearchHasMore(!!data.hasMore);
          setSearchTotal(data.total || results.length);
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

  // Henter næste side (offset = antal allerede hentede) og APPENDER til de
  // eksisterende resultater, i stedet for at erstatte dem — kaldes af
  // "Indlæs flere"-knappen. Tjekker at søgeordet stadig er det samme når
  // svaret kommer tilbage, så et svar fra en forladt søgning ikke kan nå at
  // blive hængt på en helt ny søgnings resultater.
  const loadMoreSearchResults = async () => {
    const q = searchQuery.trim();
    if (!q || searchLoadingMore || !searchHasMore) return;
    setSearchLoadingMore(true);
    const tid = traceId("search");
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/search?q=${encodeURIComponent(q)}&offset=${searchResults.length}`,
        { headers: { "apikey": SUPABASE_ANON_KEY, ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}) } }
      );
      const data = await res.json();
      if (data.success && searchQuery.trim() === q) {
        const more = (data.products || []).map(p => ({ ...p, source:"local", verified:p.verified_status, conflicts:[] }));
        traceLog(tid, "search:load-more", { q, added: more.length });
        setSearchResults(prev => [...prev, ...more]);
        setSearchHasMore(!!data.hasMore);
        setSearchTotal(data.total || 0);
      }
    } catch (e) {
      traceLog(tid, "search:load-more-error", { error: e?.message || String(e) });
    } finally {
      setSearchLoadingMore(false);
    }
  };

  return {
    searchQuery, setSearchQuery, searchCategory, setSearchCategory,
    searchResults, setSearchResults, searchLoading,
    searchHasMore, searchTotal, searchLoadingMore, loadMoreSearchResults,
  };
}
