// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useOffline.js
// Offline-detektion og persistent produkt-cache til EatSafe.
//
// BRUG i App.jsx:
//   import { useOffline, saveToOfflineCache, getFromOfflineCache } from './useOffline.js';
//   const isOffline = useOffline();
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";

// v2 (24. sept. 2026): scanResult fik et nyt id-felt (se useProduct.js) —
// gamle cachede kopier uden feltet blev ved med at blive serveret fra
// localStorage FØR noget netværkskald overhovedet skete, så rettelsen aldrig
// nåede brugere der allerede havde scannet det pågældende produkt. Bump
// versionen i nøglen hver gang scanResult's form ændres på en måde en gammel
// cachet kopi ikke kan opfylde — det er den eneste måde stale entries reelt
// bliver ugyldige på, da der ikke er nogen TTL, kun en 20-entries LRU.
const CACHE_KEY  = "eatsafe_product_cache_v2";
const MAX_CACHED = 20;

// ── Hook: registrer online/offline ────────────────────────────────────────────
export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline  = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online",  goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online",  goOnline);
    };
  }, []);

  return isOffline;
}

// ── Gem produkt i localStorage ────────────────────────────────────────────────
export function saveToOfflineCache(ean, productData) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    cache[ean] = { ...productData, _cached_at: Date.now() };

    // Hold kun de 20 nyeste
    const entries = Object.entries(cache);
    if (entries.length > MAX_CACHED) {
      entries.sort((a, b) => (b[1]._cached_at || 0) - (a[1]._cached_at || 0));
      const trimmed = Object.fromEntries(entries.slice(0, MAX_CACHED));
      localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
    } else {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }
  } catch (e) {
    console.warn("Offline cache save fejl:", e.message);
  }
}

// ── Hent produkt fra localStorage ─────────────────────────────────────────────
export function getFromOfflineCache(ean) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    return cache[ean] || null;
  } catch {
    return null;
  }
}

// ── Hent alle cachede produkter ───────────────────────────────────────────────
export function getAllCachedProducts() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const cache = JSON.parse(raw);
    return Object.values(cache).sort((a, b) => (b._cached_at || 0) - (a._cached_at || 0));
  } catch {
    return [];
  }
}

export default useOffline;
