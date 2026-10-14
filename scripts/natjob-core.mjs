// Kernen i natjob-tråden (Jan, 14. okt. 2026; docs/natjob-routine.md). Samme regler som allergens-funktionen og auto-reparse:
// nøgleordsmotoren kører altid; Claude (her tråden selv) læser kun med, hvor motoren siger det; den forsigtigste værdi vinder.
// Databasen (routine_apply) håndhæver derudover, at intet flag kan sænkes i forhold til det, varen har i forvejen.
import {
  ALL_ALLERGENS, analyzeIngredients, liftGlutenFromWheat, looksNonDanish, shouldUseClaudeFallback,
} from "../supabase/functions/_shared/allergenEngine.js";
import { TAXONOMY, isValidCategory } from "../supabase/functions/_shared/categoryTaxonomy.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RANK = { unknown: 0, no: 0, traces: 1, yes: 2 };

export function isUuid(v) {
  return typeof v === "string" && UUID.test(v);
}

// Til "Hent natjob-kø": motorens resultat pr. vare, og om tråden skal læse listen selv.
export function prepareQueue(queue) {
  const allergen = (queue?.allergen || []).map((p) => {
    const flags = analyzeIngredients(p.ingredients_text || "");
    const needsAi = shouldUseClaudeFallback(p.ingredients_text || "", flags);
    const found = Object.fromEntries(Object.entries(flags).filter(([, v]) => v !== "no"));
    return needsAi
      ? { id: p.id, name: p.name, needs_ai: true, keyword_found: found, ingredients_text: p.ingredients_text }
      : { id: p.id, name: p.name, needs_ai: false, keyword_found: found };
  });
  return { allergen, category: queue?.category || [], taxonomy: TAXONOMY };
}

// Til "Skriv natjob-resultat": bygger det endelige input til routine_apply ud fra trådens svar og varernes tekst.
// input: {note, allergen:[{id, claude?:{allergen:"traces"|"yes"}}], category:[{id,category,subcategory}|{id,skip:true}]}
// texts: {id: ingredients_text}
export function buildApplyPayload(input, texts) {
  if (!input || typeof input !== "object") throw new Error("Input skal være et JSON-objekt");
  const allergenIn = input.allergen || [];
  const categoryIn = input.category || [];
  if (!Array.isArray(allergenIn) || !Array.isArray(categoryIn)) throw new Error("allergen og category skal være lister");

  const allergen = [];
  for (const it of allergenIn) {
    if (!isUuid(it?.id)) throw new Error(`Ugyldigt id: ${it?.id}`);
    const text = texts[it.id];
    if (!text) continue; // varen findes ikke eller har ingen tekst: springes over
    let flags = analyzeIngredients(text);
    let method = "keyword";
    if (it.claude !== undefined) {
      if (!it.claude || typeof it.claude !== "object" || Array.isArray(it.claude)) throw new Error(`claude skal være et objekt for ${it.id}`);
      for (const [k, v] of Object.entries(it.claude)) {
        if (!ALL_ALLERGENS.includes(k)) throw new Error(`Ukendt allergen ${k} for ${it.id}`);
        if (!["no", "traces", "yes"].includes(v)) throw new Error(`Ukendt værdi ${k}=${v} for ${it.id}`);
        if (RANK[v] > (RANK[flags[k]] ?? 0)) flags[k] = v;
      }
      method = "keyword+claude";
    }
    // Ikke-dansk tekst uden Claude: "no" betyder kun "fandt ingen danske ord" (samme regel som allergens-funktionen).
    if (method === "keyword" && looksNonDanish(text)) {
      for (const a of ALL_ALLERGENS) if (flags[a] === "no") flags[a] = "unknown";
    }
    flags = liftGlutenFromWheat(flags);
    allergen.push({ id: it.id, flags, method });
  }

  const category = [];
  for (const it of categoryIn) {
    if (!isUuid(it?.id)) throw new Error(`Ugyldigt id: ${it?.id}`);
    if (it.skip === true) { category.push({ id: it.id, skip: true }); continue; }
    if (!isValidCategory(it.category, it.subcategory)) {
      throw new Error(`Ugyldig kategori for ${it.id}: ${it.category} / ${it.subcategory}`);
    }
    category.push({ id: it.id, category: it.category, subcategory: it.subcategory });
  }

  return { note: String(input.note || "").slice(0, 500), allergen, category };
}
