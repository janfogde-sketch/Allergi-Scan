// @ts-nocheck
import { useState, useCallback } from "react";
import { SUPABASE_URL } from "./constants.jsx";
import { makeHeaders, compareAllergens, normalizeProductFlagsFor } from "./helpers.js";

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

// Alternativer skal ligne produktet, ikke bare dele hovedkategori — ellers
// blev Coca-Cola foreslået som alternativ til en drikkeyoghurt, fordi begge
// ligger i "Drikkevarer" (live-test 30. sept. 2026). Kandidater i samme
// hovedkategori scores på underkategori, butikkens egen kategori-sti og
// fælles ord i navnet; under MIN_SIMILARITY vises de ikke. Hellere ingen
// forslag end et irrelevant forslag.
const MIN_SIMILARITY = 3;
const GENERIC_NAME_WORDS = new Set(["med", "uden", "og", "til", "the", "with", "fra", "stk", "pakke", "light", "zero", "classic", "original", "mini", "maxi"]);

function nameTokens(product) {
  const brandWords = new Set((product.brand || "").toLowerCase().split(/[^a-zæøåäöü]+/).filter(Boolean));
  return (product.name || "").toLowerCase().split(/[^a-zæøåäöü]+/)
    .filter(w => w.length >= 4 && !GENERIC_NAME_WORDS.has(w) && !brandWords.has(w));
}

function categoryPath(value) {
  return (value || "").toLowerCase().split(">").map(s => s.trim()).filter(Boolean);
}

export function similarityScore(base, candidate) {
  let score = 0;
  if (base.subcategory && candidate.subcategory && base.subcategory === candidate.subcategory) score += 3;
  // Kun en egentlig sti ("Drikkevarer > Sodavand > Cola") tæller — et
  // enkelt, bredt led som OFF's "Beverages" siger intet om ligheden.
  const a = categoryPath(base.category_original), b = categoryPath(candidate.category_original);
  if (a.length >= 2 && b.length >= 2) {
    let shared = 0;
    while (shared < a.length && shared < b.length && a[shared] === b[shared]) shared++;
    if (shared >= 2) score += 2 * (shared - 1);
  }
  const baseWords = nameTokens(base), candWords = nameTokens(candidate);
  for (const w of baseWords) {
    if (candWords.includes(w)) score += 2;
    else if (candWords.some(c => c.includes(w) || w.includes(c))) score += 1;
  }
  return score;
}

// Samme produkttype/anvendelse: samme underkategori, mindst tre fælles led i butikkens kategori-sti eller et fælles navneord.
// Samme hovedkategori alene er ikke nok (en drik er ikke et alternativ til en anden slags drik).
export function sameProductType(base, candidate) {
  if (base.subcategory && candidate.subcategory && base.subcategory === candidate.subcategory) return true;
  const a = categoryPath(base.category_original), b = categoryPath(candidate.category_original);
  let shared = 0;
  while (shared < a.length && shared < b.length && a[shared] === b[shared]) shared++;
  if (shared >= 3) return true;
  const cw = nameTokens(candidate);
  return nameTokens(base).some(w => cw.includes(w));
}

// Kandidaten skal have en reel ingrediensliste, ellers er "ingen konflikter" ikke dokumenteret.
const hasUsableIngredients = p => typeof p.ingredients_text === "string" && p.ingredients_text.trim().length >= 8;

export function useAlternatives({ accessToken, activeIds, activeLevels }) {
  const [alternatives, setAlternatives]   = useState([]);
  const [altLoading, setAltLoading]       = useState(false);

  // `product` er scan-resultatet (category, subcategory, category_original,
  // name, brand). En ren kategori-streng accepteres stadig.
  const loadAlternatives = useCallback(async (product, excludeEan) => {
    const base = typeof product === "string" ? { category: product } : (product || {});
    const category = base.category;
    if (!category || !activeIds?.length) {
      setAlternatives([]);
      return;
    }

    setAltLoading(true);
    setAlternatives([]);

    try {
      // Forsøg 1: præcis kategori
      let results = await fetchByCategory(category, excludeEan, accessToken, activeIds, base, activeLevels);

      // Forsøg 2: overkategori hvis ingen resultater
      if (results.length === 0 && CATEGORY_PARENTS[category]) {
        results = await fetchByCategory(CATEGORY_PARENTS[category], excludeEan, accessToken, activeIds, base, activeLevels);
      }

      const ranked = results
        .map(p => ({ p, score: similarityScore(base, p) }))
        .filter(x => x.score >= MIN_SIMILARITY && sameProductType(base, x.p) && hasUsableIngredients(x.p))
        .sort((x, y) => y.score - x.score);
      setAlternatives(ranked.slice(0, 8).map(x => x.p));
    } catch {
      setAlternatives([]);
    }

    setAltLoading(false);
  }, [accessToken, activeIds, activeLevels]);

  const clearAlternatives = () => setAlternatives([]);

  return { alternatives, altLoading, loadAlternatives, clearAlternatives };
}

// PostgREST-værdi i or=(...): citeret, så komma/parentes/punktum i
// kategorinavne ikke bryder filteret.
const pgQuote = v => `"${String(v).replace(/["\\]/g, "")}"`;

// Kun kandidater der kan ligne produktet: samme underkategori, samme
// kategori-sti (to første led) eller et fælles navneord.
function similarityFilter(base) {
  const parts = [];
  if (base.subcategory) parts.push(`subcategory.eq.${pgQuote(base.subcategory)}`);
  const path = (base.category_original || "").split(">").map(x => x.trim()).filter(Boolean);
  if (path.length >= 2) parts.push(`category_original.ilike.${pgQuote(`${path[0]} > ${path[1]}*`)}`);
  for (const w of nameTokens(base).slice(0, 3)) parts.push(`name.ilike.${pgQuote(`*${w}*`)}`);
  return parts.length ? `&or=(${encodeURIComponent(parts.join(","))})` : null;
}

async function fetchByCategory(category, excludeEan, accessToken, activeIds, base = {}, activeLevels) {
  const filter = similarityFilter(base);
  if (!filter) return [];
  const url = `${SUPABASE_URL}/rest/v1/products`
    + `?category=eq.${encodeURIComponent(category)}`
    + filter
    + `&ean=neq.${encodeURIComponent(excludeEan)}`
    // Tidligere kun verified/auto_verified — men det matchede ét eneste
    // produkt i hele databasen (derfor blev den samme Coca-Cola foreslået
    // til alt). Allergendatakvaliteten er det relevante kriterie her.
    + `&allergen_quality=in.(high,medium)`
    + `&ingredients_text=not.is.null`
    + `&select=id,ean,name,brand,image_url,allergen_flags,category,subcategory,category_original,verified_status,source,ingredients_text,allergen_source_method,allergen_quality`
    + `&limit=300`
    + `&order=allergen_quality.asc`; // "high" før "medium"

  const res = await fetch(url, {
    headers: { ...makeHeaders(accessToken), "Accept": "application/json" },
  });
  if (!res.ok) return [];

  const products = await res.json();
  if (!Array.isArray(products)) return [];

  // Filtrér: kun produkter der er sikre for alle aktive allergen-IDs
  return products.filter(p => {
    const { status, hasUnknown } = compareAllergens(normalizeProductFlagsFor(p), activeIds, activeLevels);
    return status === "safe" && !hasUnknown;
  });
}
