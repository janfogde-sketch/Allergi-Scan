// supabase/functions/_shared/allergenEngine.js
//
// Allergenmotoren: den rene analyse af en ingrediensliste (ja/spor/nej pr.
// allergen), uden netværk, database eller Claude. Brugt af edge-functionen
// supabase/functions/allergens/index.ts og testet af Vitest i
// src/allergenEngine.test.js — derfor almindelig JavaScript og ikke
// TypeScript, samme mønster som allergenKeywords.js ved siden af.
//
// Flyttet hertil fra allergens/index.ts 30. sept. 2026 (arkitektur-audit
// A2), uændret i adfærd.

import { ALLERGEN_KEYWORDS } from "./allergenKeywords.js";

// E-NUMRE der er koblet til allergener (kan indeholde / afledt af)
// ─────────────────────────────────────────────────────────────────────────────
export const ENUMBER_ALLERGENS = {
  "e322": { allergen: "soja", certainty: "traces" },      // Lecithin — ofte soja
  "e471": { allergen: "maelkeallergi", certainty: "traces" }, // Mono/diglycerider — kan være mælk
  "e472": { allergen: "maelkeallergi", certainty: "traces" },
  "e270": { allergen: "maelkeallergi", certainty: "traces" }, // Mælkesyre — sjældent, men muligt
  "e966": { allergen: "laktose", certainty: "yes" },      // Lactitol — afledt af laktose
  "e220": { allergen: "svovl", certainty: "yes" },
  "e221": { allergen: "svovl", certainty: "yes" },
  "e222": { allergen: "svovl", certainty: "yes" },
  "e223": { allergen: "svovl", certainty: "yes" },
  "e224": { allergen: "svovl", certainty: "yes" },
  "e225": { allergen: "svovl", certainty: "yes" },
  "e226": { allergen: "svovl", certainty: "yes" },
  "e227": { allergen: "svovl", certainty: "yes" },
  "e228": { allergen: "svovl", certainty: "yes" },
};

export const ALL_ALLERGENS = [
  "gluten", "hvede", "maelkeallergi", "laktose", "aeg", "noedder",
  "jordnoedder", "soja", "fisk", "skaldyr", "selleri", "sennep",
  "sesam", "svovl", "lupin", "bloeddyr",
];

// Ord der skal substring-matches (fanger sammensatte ord: komælk, gedemælk)
// Kun korte, entydige kerne-ord hvor falsk-positiv-risiko er lav
export const SUBSTRING_KEYWORDS = new Set([
  "mælk", "milk", "kasein", "valle", "soja", "soy", "gluten",
  "laktose", "lactose", "sesam", "lupin", "selleri", "sennep",
  // Tyske kerneord (30. sept. 2026) — tysk sammensætter ord ("Vollmilch-
  // pulver", "Weizenmehl", "Haselnusskerne"), så de skal matches som
  // understreng for at blive fundet.
  "milch", "weizen", "roggen", "gerste", "hafer", "sahne", "käse",
  "haselnuss", "haselnüsse", "erdnuss", "erdnüsse", "walnuss", "walnüsse",
  "fisch", "garnelen", "sellerie", "senf",
]);

// Position for det match, keywordMatch() faktisk fandt — ikke bare første
// forekomst som understreng. Ellers blev fx "ei" (æg) i "Kann ... Ei
// enthalten" vurderet ud fra "ei" inde i "Weizenmehl" længere fremme, så
// spor-/negations-tjekket kiggede det forkerte sted (30. sept. 2026).
export function matchIndex(lower, kw) {
  if (SUBSTRING_KEYWORDS.has(kw)) return lower.indexOf(kw);
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = new RegExp(`(^|[^a-zæøåA-ZÆØÅ0-9])${escaped}([^a-zæøåA-ZÆØÅ0-9]|$)`, "i").exec(lower);
  return m ? m.index + m[1].length : -1;
}

// Negation-detektion: "laktosefri", "uden mælk", "mælkefri", "under 0,01%"
export function isNegated(text, keyword) {
  const lower = text.toLowerCase();
  const kw = keyword.toLowerCase();
  const idx = matchIndex(lower, kw);
  if (idx === -1) return false;
  const before = lower.substring(Math.max(0, idx - 18), idx);
  const after = lower.substring(idx + kw.length, idx + kw.length + 18);
  return (
    before.includes("uden") ||
    before.includes("fri for") ||
    before.includes("ingen") ||
    before.includes("ohne") ||        // tysk: "ohne Milch"
    after.startsWith("fri") ||        // laktosefri, mælkefri
    after.startsWith("frei") ||       // tysk: laktosefrei, glutenfrei
    after.startsWith("-frei") ||
    after.startsWith("-fri") ||
    after.includes("under 0") ||      // laktose under 0,01%
    after.includes("free")            // lactose free
 );
}

// Ordgrænse-match: undgår at "æg" matcher inde i "lægemiddel"
export function wordBoundaryMatch(haystack, needle) {
  // Escape regex-special-tegn i søgeordet
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // \b virker ikke pålideligt med æøå, så vi bruger custom grænse:
  // Match hvis omgivet af ikke-bogstav eller streng-start/slut
  const pattern = new RegExp(
    `(^|[^a-zæøåA-ZÆØÅ0-9])${escaped}([^a-zæøåA-ZÆØÅ0-9]|$)`,
    "i"
 );
  return pattern.test(haystack);
}

// Samlet match: ordgrænse for de fleste, substring for kerne-ord
export function keywordMatch(haystack, keyword) {
  if (SUBSTRING_KEYWORDS.has(keyword.toLowerCase())) {
    return haystack.toLowerCase().includes(keyword.toLowerCase());
  }
  return wordBoundaryMatch(haystack, keyword);
}

// Tjek om et match er i "spor"-kontekst. Sætnings-scoped (finder tilbage til
// forrige punktum/udråbstegn/spørgsmålstegn, IKKE bare et fast antal tegn) —
// en "kan indeholde spor af A, B, C, D, E"-opremsning kan sagtens være
// længere end 60 tegn, og et fast tegn-vindue overser da de sidste allergener
// i opremsningen (fundet ved en gennemgang af rigtige produkter i databasen,
// 25. sept. 2026: "Kan indeholde spor af SESAMFRØ, SENNEP, HASSELNØDDER,
// SELLERI, SULFITTER, SOJA og JORDNØDDER" — JORDNØDDER lå uden for det
// gamle 60-tegns vindue).
export function isTracesContext(text, keyword) {
  const lower = text.toLowerCase();
  const idx = matchIndex(lower, keyword.toLowerCase());
  if (idx === -1) return false;
  let sentenceStart = 0;
  for (const p of [".", "!", "?"]) {
    const pos = lower.lastIndexOf(p, idx);
    if (pos > sentenceStart) sentenceStart = pos + 1;
  }
  // Lookahead-vinduet (+20 tegn) må IKKE bløde ind i NÆSTE sætning — ellers
  // kan et direkte, fremhævet ingrediens-match (fx "CASHEWNØDDER.") fejlagtigt
  // blive slået sammen med en efterfølgende "Kan indeholde spor af..."-sætning
  // og selv blive markeret som spor. Afgrænset af det først følgende
  // punktum/udråbstegn/spørgsmålstegn efter selve nøgleordet (eller
  // tekstens slutning, hvis der ikke er ét).
  let sentenceEnd = lower.length;
  for (const p of [".", "!", "?"]) {
    const pos = lower.indexOf(p, idx);
    if (pos !== -1 && pos < sentenceEnd) sentenceEnd = pos;
  }
  const windowEnd = Math.min(idx + keyword.length + 20, sentenceEnd);
  const sentence = lower.substring(sentenceStart, windowEnd);
  return (
    sentence.includes("spor") ||
    sentence.includes("trace") ||
    sentence.includes("kan indeholde") ||
    sentence.includes("may contain") ||
    sentence.includes("spuren") ||           // tysk: "Kann Spuren von ... enthalten"
    sentence.includes("kann ") ||            // tysk: "Kann Mandeln ... enthalten"
    sentence.includes("enthalten") ||
    sentence.includes("fremstillet") ||
    sentence.includes("produced in") ||
    sentence.includes("samme fabrik") ||
    sentence.includes("same facility") ||
    sentence.includes("samme produktionsudstyr")
 );
}

export function analyzeIngredients(text) {
  const flags = {};
  const lower = text.toLowerCase();

  for (const allergen of ALL_ALLERGENS) {
    const keywords = ALLERGEN_KEYWORDS[allergen] || [];
    let status = "no";

    for (const keyword of keywords) {
      if (!keywordMatch(lower, keyword.toLowerCase())) continue;

      // Spring over hvis allergenet er negeret (laktosefri, uden mælk)
      if (isNegated(text, keyword)) continue;

      // Spor-kontekst tjekkes FØRST og er afgørende — versaler/fed alene
      // (EU-krav 1169/2011 om fremhævning) er IKKE et pålideligt signal for
      // "direkte ingrediens", fordi danske producenter/forhandlere ofte
      // fremhæver allergen-navnet på PRÆCIS samme måde inde i en "kan
      // indeholde spor af"-advarsel som i selve ingredienslisten (bekræftet
      // ved en gennemgang af rigtige produkter i databasen, 25. sept. 2026 —
      // den tidligere kode brugte fremhævning til at overtrumfe spor-tjekket
      // og markerede fx "Kan indeholde spor af FISK, SOJA, ... BLØDDYR" som
      // "yes" i stedet for "traces" for alle nævnte allergener). Match fundet
      // uden for en spor-sætning behandles som direkte ingrediens.
      if (isTracesContext(text, keyword)) {
        if (status !== "yes") status = "traces";
        continue; // stop IKKE — en senere, direkte forekomst af samme
                   // allergen andetsteds i teksten skal stadig kunne opgradere til "yes"
      }

      status = "yes";
      break; // yes er højeste sikkerhed, stop
    }

    flags[allergen] = status;
  }

  // ── E-nummer detektion ──────────────────────────────────────────────────
  for (const [enumber, mapping] of Object.entries(ENUMBER_ALLERGENS)) {
    if (wordBoundaryMatch(lower, enumber)) {
      const current = flags[mapping.allergen];
      // Opgrader kun hvis det forbedrer sikkerheden (no → traces → yes)
      if (mapping.certainty === "yes" && current !== "yes") {
        flags[mapping.allergen] = "yes";
      } else if (mapping.certainty === "traces" && current === "no") {
        flags[mapping.allergen] = "traces";
      }
    }
  }

  // ── Global override: laktosefri produkter ─────────────────────────────────
  // "Laktosefri mælk" har stadig mælkeprotein (maelkeallergi=yes) men INGEN laktose
  if (
    lower.includes("laktosefri") ||
    lower.includes("laktose fri") ||
    lower.includes("lactose free") ||
    lower.includes("lactose-free") ||
    lower.includes("laktosefrei") ||
    /laktose\s+(under|<|mindre)/.test(lower)
 ) {
    flags["laktose"] = "no";
  }

  return flags;
}

// Samme heuristik som looksNonDanishIngredients i src/helpers.js (deler ikke
// kode). Nøgleordsmotoren kender kun danske ord og ville ellers svare "no" for
// alt i en tysk/svensk/engelsk liste — et falsk "ingen allergener".
export const FOREIGN_INGREDIENT_STEMS = [
  "zucker","weizen","milch","vollmilch","magermilch","wasser","salz","hefe","eier","haselnüss","mandeln","roggen","gerste","sahne","zutaten",
  "sugar","wheat","flour","milk","water","yeast","eggs","hazelnut","almond","butter","cream","barley","rye","ingredients",
  "socker","vete","mjölk","vatten","ägg","råg","grädde","smör","jäst","nötter","ingredienser:","hvete","melk",
];
export const DANISH_INGREDIENT_STEMS = ["sukker","hvede","mælk","vand","gær","smør","fløde","olie","nødder","mandler","kerner","stivelse","krydderi","æg","rug","byg","havre"];
export function looksNonDanish(text) {
  const words = text.toLowerCase().split(/[^a-zæøåäöüß:]+/).filter(Boolean);
  if (words.length === 0) return false;
  const danishHits = words.filter(w => DANISH_INGREDIENT_STEMS.some(s => w.startsWith(s) || w.endsWith(s)) || /mel$/.test(w)).length;
  if (danishHits > 0) return false;
  return words.some(w => FOREIGN_INGREDIENT_STEMS.some(s => w.startsWith(s)));
}

// Hvede indeholder altid gluten — gluten må aldrig stå lavere end hvede.
export function liftGlutenFromWheat(flags) {
  const rank = (v) => v === "yes" ? 3 : v === "traces" ? 2 : v === "no" ? 1 : 0;
  if (rank(flags.hvede) >= 2 && rank(flags.hvede) > rank(flags.gluten)) flags.gluten = flags.hvede;
  return flags;
}

// Vurder om keyword-resultatet er "usikkert" og bør verificeres med Claude
export function shouldUseClaudeFallback(text) {
  const lower = text.toLowerCase();
  if (looksNonDanish(text)) return true;
  if (/uden|fri for|free|laktosefri|under 0/.test(lower)) return true;
  const commaCount = (text.match(/,/g) || []).length;
  if (commaCount > 15) return true;
  const eNumbers = lower.match(/e\d{3}/g) || [];
  const unknownE = eNumbers.some(e => !ENUMBER_ALLERGENS[e]);
  if (unknownE && eNumbers.length > 3) return true;
  return false;
}
