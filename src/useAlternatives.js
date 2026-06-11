// @ts-nocheck
import { useState, useCallback } from "react";
import { SUPABASE_URL } from "./constants.jsx";
import { makeHeaders, compareAllergens } from "./helpers.js";

// Kategori-hierarki: hvis ingen resultater i præcis kategori, prøv overkategori
const CATEGORY_PARENTS = {
  "Mejeri & æg":    null,
  "Drikkevarer":    null,
  "Snacks & slik":  null,
  "Kolonial":       null,
  "Frost":          null,
  "Brød & bagværk": "Kolonial",
  "Kød & fisk":     null,
  "Færdigretter":   null,
  "Frugt & grønt":  null,
};

export function useAlternatives({ accessToken, activeIds }) {
  const [alternatives, setAlternatives]   = useState([]);
  const [altLoading, setAltLoading]       = useState(false);

  const loadAlternatives = useCallback(async (category, excludeEan) => {
    if (!category || !activeIds?.length) {
      setAlternatives([]);
      return;
    }

    setAltLoading(true);
    setAlternatives([]);

    try {
      // Forsøg 1: præcis kategori
      let results = await fetchByCategory(category, excludeEan, accessToken, activeIds);

      // Forsøg 2: overkategori hvis ingen resultater
      if (results.length === 0 && CATEGORY_PARENTS[category]) {
        results = await fetchByCategory(CATEGORY_PARENTS[category], excludeEan, accessToken, activeIds);
      }

      setAlternatives(results.slice(0, 5));
    } catch {
      setAlternatives([]);
    }

    setAltLoading(false);
  }, [accessToken, activeIds]);

  const clearAlternatives = () => setAlternatives([]);

  return { alternatives, altLoading, loadAlternatives, clearAlternatives };
}

async function fetchByCategory(category, excludeEan, accessToken, activeIds) {
  const url = `${SUPABASE_URL}/rest/v1/products`
    + `?category=eq.${encodeURIComponent(category)}`
    + `&ean=neq.${encodeURIComponent(excludeEan)}`
    + `&verified_status=in.(verified,auto_verified)`
    + `&select=id,ean,name,brand,image_url,allergen_flags,category,verified_status`
    + `&limit=50`
    + `&order=verified_status.asc`; // verified først

  const res = await fetch(url, {
    headers: { ...makeHeaders(accessToken), "Accept": "application/json" },
  });
  if (!res.ok) return [];

  const products = await res.json();
  if (!Array.isArray(products)) return [];

  // Filtrér: kun produkter der er sikre for alle aktive allergen-IDs
  return products.filter(p => {
    const flags = p.allergen_flags || {};
    const { status } = compareAllergens(flags, activeIds);
    return status === "safe";
  });
}
