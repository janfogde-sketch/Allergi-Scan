// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useHistory.js
// Håndterer scanningshistorik og favoritter.
// Favoritter gemmes lokalt i localStorage — ingen Supabase.
// Historik hentes via Supabase Edge Function.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { SUPABASE_URL } from "./constants.jsx";
import { makeHeaders, apiCall } from "./helpers.js";

export function useHistory({ accessToken, userId }) {
  const [history, setHistory]               = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [favorites, setFavorites]           = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("as_favorites") || "[]");
    } catch { return []; }
  });

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await apiCall(
        `${SUPABASE_URL}/functions/v1/history?user_id=${userId}&limit=50&offset=0`,
        { headers: makeHeaders(accessToken) }
      );
      if (data?.success && data.scans) setHistory(data.scans);
    } catch { /* silent */ }
    finally { setHistoryLoading(false); }
  };

  const saveHistoryEntry = async (ean, productId, result, flags, activeProfiles) => {
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
  };

  const toggleFavorite = (product) => {
    setFavorites(prev => {
      const exists = prev.find(f => f.ean === product.ean || f.code === product.code);
      const updated = exists
        ? prev.filter(f => f.ean !== product.ean && f.code !== product.code)
        : [...prev, { ...product, savedAt: Date.now() }];
      localStorage.setItem("as_favorites", JSON.stringify(updated));
      return updated;
    });
  };

  const isFavorite = (ean) => favorites.some(f => f.ean === ean || f.code === ean);

  return {
    history, setHistory,
    historyLoading,
    favorites, setFavorites,
    loadHistory,
    saveHistoryEntry,
    toggleFavorite,
    isFavorite,
  };
}
