// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// allergenKeywords.js
//
// Matching-logik (word-boundary/substring, negation, custom-allergi-søgning)
// til fri ingredienstekst i frontenden — bruges til fremhævning/diæt-tjek/
// custom-allergi-matching. Selve ordlisten (ALLERGEN_KEYWORDS) importeres nu
// fra ÉN fælles kilde delt med backend (supabase/functions/allergens/
// index.ts, den autoritative kilde for selve ja/spor/nej-sikkerhedstjekket)
// — se den fælles fils header for den fulde historik. Før dette fandtes der
// 3, siden 2, uafhængige kopier af ordlisten, som drev fra hinanden over tid.
//
// Nøglerne matcher ALLERGENS-id'erne i constants.jsx.
// ─────────────────────────────────────────────────────────────────────────────

import { ALLERGEN_KEYWORDS } from "../supabase/functions/_shared/allergenKeywords.js";

export { ALLERGEN_KEYWORDS };

export const ALL_ALLERGEN_WORDS = Object.values(ALLERGEN_KEYWORDS).flat();

// Find ALLE forekomster af et nøgleord i teksten (ordgrænse-sikret for korte
// nøgleord <=4 tegn, ren understreng for længere) og returnér deres startindeks.
// Skal scanne HELE teksten, ikke stoppe ved første forekomst — ellers overser
// funktionen fx det ægte "mel" i "rismel, mel" (første "mel" fejler ordgrænse-
// tjekket inde i "rismel", men uden videre scanning bliver den ægte forekomst
// bagefter aldrig tjekket). Fundet ved en allergen-logik-gennemgang (16. sept.
// 2026) — den farligste fejltype her er en falsk negativ (overset allergen).
function findAllKeywordIndices(text, kw) {
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const wordBoundary = kw.length <= 4;
  const pattern = wordBoundary
    ? new RegExp(`(^|[^a-zæøå0-9])(${escaped})([^a-zæøå0-9]|$)`, "gi")
    : new RegExp(`(${escaped})`, "gi");
  const indices = [];
  let m;
  while ((m = pattern.exec(text))) {
    const idx = wordBoundary ? m.index + m[1].length : m.index;
    indices.push(idx);
    pattern.lastIndex = idx + kw.length; // undgå uendeligt loop ved nul-bredde-match
  }
  return indices;
}

// Negations-detektion: "mælkefri", "uden mælk", "gluten under 0,01%" — samme
// heuristik (18-tegns kontekst-vindue) som backend allergens Edge Function's
// isNegated(), porteret hertil fordi highlighting/diæt-tjek/custom-allergi-
// matching selv scanner rå ingredienstekst i stedet for at gå via de allerede
// analyserede allergen_flags. Korte nøgleord (<=4 tegn) er allerede delvist
// beskyttet af ordgrænse-tjekket ("mælkefri" fejler boundary da "e" efter
// "mælk" er et bogstav) — denne funktion lukker hullet for lange nøgleord som
// "gluten", der ellers matcher som ren understreng inde i "glutenfri".
function isNegatedAt(text, idx, kwLength) {
  const before = text.substring(Math.max(0, idx - 18), idx);
  const after = text.substring(idx + kwLength, idx + kwLength + 18);
  return (
    before.includes("uden") ||
    before.includes("fri for") ||
    before.includes("ingen") ||
    after.startsWith("fri") ||
    after.startsWith("-fri") ||
    after.includes("under 0") ||
    after.includes("free")
  );
}

export function keywordMatches(text, keyword) {
  const kw = keyword.toLowerCase();
  if (!kw) return false;
  const indices = findAllKeywordIndices(text, kw);
  // "some" i stedet for kun at tjekke første forekomst — hvis BARE ÉN
  // forekomst af ordet er en ægte (ikke-negeret) omtale, skal det flages,
  // selvom en anden forekomst af samme ord et andet sted er negeret.
  return indices.some(idx => !isNegatedAt(text, idx, kw.length));
}

// Fritekst-matching af brugerens EGNE, frit tilføjede allergier (feltet
// "customAllerg"/family members' ".custom" — fx "Fructose") mod en
// ingredienstekst. De 16 faste allergener har en kurateret nøgleordsliste med
// synonymer/danske bøjninger/engelske oversættelser (se ALLERGEN_KEYWORDS
// ovenfor) — en custom-allergi er derimod et helt vilkårligt ord brugeren
// selv har skrevet, så vi kan kun søge efter PRÆCIS det ord (samme ordgrænse-
// og negations-logik som resten af matchingen ovenfor, men ingen synonymer).
// Mindre pålideligt end de faste allergener af natur — vis derfor ALTID en
// disclaimer i UI'et ved et match, og opfordr brugeren til selv at dobbelt-
// tjekke samt til at fortælle os hvis vi overser noget.
export function matchCustomAllergens(ingredientsText, customTerms) {
  if (!ingredientsText || !customTerms?.length) return [];
  const text = ingredientsText.toLowerCase();
  const matched = [];
  const seen = new Set();
  for (const raw of customTerms) {
    const term = (raw || "").trim();
    if (!term) continue;
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    if (keywordMatches(text, term)) { matched.push(term); seen.add(key); }
  }
  return matched;
}

// Hvilke allergen-id'er nævnes i en fri ingrediens-/produkttekst.
export function detectAllergensInText(text) {
  const n = text.toLowerCase();
  return Object.entries(ALLERGEN_KEYWORDS)
    .filter(([, terms]) => terms.some(t => keywordMatches(n, t)))
    .map(([id]) => id);
}

// Bruges til at fremhæve enkeltord (allerede splittet på whitespace) i en
// ingrediensliste — fx IngredientsList. `allergenFlags` kan bruges til at
// undlade at fremhæve allergener brugeren har markeret "no" for.
export function isAllergenWord(word, allergenFlags = {}) {
  const w = word.toLowerCase().replace(/[^a-zæøå0-9]/g, "");
  if (w.length < 2) return false;
  return Object.entries(ALLERGEN_KEYWORDS).some(([key, terms]) => {
    if (allergenFlags[key] === "no" || allergenFlags[key] === false) return false;
    return terms.some(t => {
      const tc = t.toLowerCase().replace(/[^a-zæøå0-9]/g, "");
      if (tc.length <= 4) return w === tc; // ordgrænse for korte ord — undgå "mel" i "rismel"
      // KUN denne retning: matcher når selve ingrediensordet indeholder
      // nøgleordet (fx "hasselnøddepasta" indeholder "hasselnød"). Den
      // omvendte retning (nøgleordet indeholder ordet) blev fjernet 24.
      // sept. 2026 — den fangede fx det harmløse "aroma" som et
      // mælkeallergen, fordi "aroma" er en understreng af det langt mere
      // specifikke "smøraroma". Rammer kun selve VISNINGEN (fremhævning i
      // IngredientsList) — den reelle farlig/sikker-beregning bruger
      // findAllKeywordIndices/keywordMatches, ikke denne funktion.
      return w.includes(tc);
    });
  });
}
