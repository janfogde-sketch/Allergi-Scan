// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useHistory.js
// Håndterer scanningshistorik og favoritter.
// Begge dele kan vises enten kun for dig selv, eller delt med hele din
// husstand (alle rigtige konti du har inviteret til EatSafe) — styret af
// scope-parameteren "own" | "family". Begge hentes via Supabase Edge
// Functions og gemmes i databasen (favoritter var tidligere kun lokale).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import { SUPABASE_URL } from "./constants.jsx";
import { makeHeaders, apiCall } from "./helpers.js";

export function useHistory({ accessToken, userId }) {
  const [history, setHistory]               = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyScope, setHistoryScope]     = useState("own"); // "own" | "family"
  const [favorites, setFavorites]           = useState([]);
  const [favoritesScope, setFavoritesScope] = useState("own"); // "own" | "family"

  const loadHistory = useCallback(async (scope = historyScope) => {
    try {
      setHistoryLoading(true);
      setHistoryScope(scope);
      const data = await apiCall(
        `${SUPABASE_URL}/functions/v1/history?user_id=${userId}&limit=50&offset=0${scope === "family" ? "&scope=family" : ""}`,
        { headers: makeHeaders(accessToken) }
      );
      if (data?.success && data.scans) setHistory(data.scans);
    } catch { /* silent */ }
    finally { setHistoryLoading(false); }
  }, [userId, accessToken, historyScope]);

  const saveHistoryEntry = useCallback(async (ean, productId, result, flags, activeProfiles) => {
    try {
      await apiCall(`${SUPABASE_URL}/functions/v1/history`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({
          user_id: userId,
          ean_scanned: ean,
          product_id: productId || null,
          result,
          flags_triggered: flags,
          active_profiles: activeProfiles,
        }),
      });
    } catch { /* silent */ }
  }, [userId, accessToken]);

  // ── Favoritter ────────────────────────────────────────────────────────────
  const loadFavorites = useCallback(async (scope = favoritesScope) => {
    try {
      setFavoritesScope(scope);
      const data = await apiCall(
        `${SUPABASE_URL}/functions/v1/favorites?user_id=${userId}${scope === "family" ? "&scope=family" : ""}`,
        { headers: makeHeaders(accessToken) }
      );
      if (data?.success && Array.isArray(data.favorites)) {
        setFavorites(data.favorites.map(f => ({
          ...f.product_snapshot,
          ean: f.ean,
          category: f.category || null,
          savedAt: new Date(f.added_at).getTime(),
          savedBy: f.users?.name || null,
          savedByMe: f.user_id === userId,
        })));
      }
    } catch { /* silent */ }
  }, [userId, accessToken, favoritesScope]);

  // ── Flyt en favorit til en (evt. ny) kategori ────────────────────────────
  const setFavoriteCategory = useCallback(async (ean, category) => {
    setFavorites(prev => prev.map(f => f.ean === ean ? { ...f, category: category || null } : f));
    try {
      await apiCall(`${SUPABASE_URL}/functions/v1/favorites`, {
        method: "PATCH",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({ user_id: userId, ean, category: category || null }),
      });
    } catch { await loadFavorites(); }
  }, [userId, accessToken, loadFavorites]);

  const toggleFavorite = useCallback(async (product) => {
    const ean = product.ean || product.code;
    if (!ean) return;
    const exists = favorites.some(f => (f.ean === ean || f.code === ean) && f.savedByMe !== false);
    if (exists) {
      setFavorites(prev => prev.filter(f => f.ean !== ean && f.code !== ean));
      try {
        await apiCall(`${SUPABASE_URL}/functions/v1/favorites?user_id=${userId}&ean=${encodeURIComponent(ean)}`, {
          method: "DELETE", headers: makeHeaders(accessToken),
        });
      } catch { await loadFavorites(); }
    } else {
      const optimistic = { ...product, ean, savedAt: Date.now(), savedByMe: true };
      setFavorites(prev => [optimistic, ...prev]);
      try {
        await apiCall(`${SUPABASE_URL}/functions/v1/favorites`, {
          method: "POST",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ user_id: userId, ean, product_snapshot: product }),
        });
      } catch {
        // Gemning fejlede — fjern den optimistiske favorit igen
        setFavorites(prev => prev.filter(f => f.ean !== ean));
      }
    }
  }, [favorites, userId, accessToken, loadFavorites]);

  const isFavorite = useCallback((ean) => favorites.some(f => f.ean === ean || f.code === ean), [favorites]);

  return {
    history, setHistory,
    historyLoading,
    historyScope,
    favorites, setFavorites,
    favoritesScope,
    loadHistory,
    saveHistoryEntry,
    loadFavorites,
    toggleFavorite,
    setFavoriteCategory,
    isFavorite,
  };
}
