// @ts-nocheck
import { ALLERGENS, SUPABASE_ANON_KEY } from "./constants.jsx";

export const initials = n => (n||"").split(" ").filter(Boolean).map(w=>w[0]).join("").toUpperCase().slice(0,2)||"?";

export const timeAgo = ts => { const d=Date.now()-new Date(ts).getTime(); if(d<60000)return"Lige nu"; if(d<3600000)return`${Math.floor(d/60000)} min siden`; if(d<86400000)return`${Math.floor(d/3600000)} t siden`; return`${Math.floor(d/86400000)} d siden`; };

export const getAllergenLabels = (ids,custom=[]) => [...ids.map(id=>ALLERGENS.find(a=>a.id===id)).filter(Boolean).map(a=>`${a.emoji} ${a.label}`),...custom.map(c=>`✏️ ${c}`)];

export const verifiedBadge = (verified_status, source) => {
  // Producent-data — højeste troværdighed
  if (verified_status === "verified" || source === "producer")
    return { label:"Fra producent", bg:"rgba(34,197,94,.1)", color:"#16a34a", dot:"#16a34a" };
  // Open Food Facts — crowd-sourced
  if (source === "off" || source === "open_food_facts")
    return { label:"Open Food Facts", bg:"rgba(37,99,235,.06)", color:"#2563eb", dot:"#2563eb" };
  // Bruger-indsendt
  return { label:"Bruger-indsendt", bg:"rgba(138,144,153,.08)", color:"#6B7280", dot:"#6B7280" };
};

// ─── SUPABASE API-HJÆLPER ────────────────────────────────────────────────────

export function makeHeaders(token) {
  return {
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON_KEY,
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
}

export async function apiCall(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error_description || `HTTP ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

// ─── ALLERGEN SAMMENLIGNING ──────────────────────────────────────────────────

export function compareAllergens(flags, activeAllergenIds) {
  if (!flags || activeAllergenIds.length === 0) return { status:"safe", matchedDanger:[], matchedWarning:[], hasUnknown:false, confidence:"high", explanation:[] };
  const matchedDanger = [];
  const matchedWarning = [];
  let hasUnknown = false;
  const explanation = []; // Forklaring på HVORFOR et produkt er usikkert

  for (const id of activeAllergenIds) {
    const val = flags[id];
    // Håndter boolean (recipes) og string (produkter)
    if (val === true || val === "yes") {
      matchedDanger.push(id);
      explanation.push({ allergen: id, reason: "direkte", severity: "high" });
    } else if (val === "traces") {
      matchedWarning.push(id);
      explanation.push({ allergen: id, reason: "spor", severity: "medium" });
    } else if (val === "unknown" || val === null || val === undefined) {
      hasUnknown = true;
    }
  }

  let status = "safe";
  if (matchedDanger.length > 0) status = "danger";
  else if (matchedWarning.length > 0) status = "warn";

  // Confidence score baseret på datakvalitet
  let confidence = "high";
  if (hasUnknown) confidence = "medium";
  if (Object.keys(flags).length === 0) confidence = "low";
  if (Object.values(flags).every(v => v === null || v === undefined)) confidence = "low";

  return { status, matchedDanger, matchedWarning, hasUnknown, confidence, explanation };
}

// ─── E-NUMMER MATCHING ─────────────────────────────────────────────────────

// Udtræk alle E-numre fra en ingredienstekst
export function extractENumbers(text) {
  if (!text) return [];
  // Matcher E100-E1599, med eller uden mellemrum efter E
  const matches = text.match(/\bE[\s-]?(\d{3,4}[a-z]?)\b/gi) || [];
  // Normaliser til "E###" format (stort E, ingen mellemrum)
  return [...new Set(matches.map(m => "E" + m.replace(/^E[\s-]?/i, "").trim()))];
}

// Sammenlign produktets E-numre mod brugerens overvågede E-numre
export function compareENumbers(productENumbers, userENumbers) {
  if (!productENumbers || !userENumbers || userENumbers.length === 0) {
    return { matched: [], status: "safe" };
  }
  const productSet = new Set(productENumbers.map(e => e.toUpperCase()));
  const matched = userENumbers.filter(e => productSet.has(e.toUpperCase()));
  return {
    matched,
    status: matched.length > 0 ? "warn" : "safe",
  };
}

// ─── DIÆT-MATCHING ────────────────────────────────────────────────────────────

// Non-allergen animalske ingredienser der ikke fanges af allergen_flags
const ANIMAL_KEYWORDS = [
  "gelatine", "gelatin", "svinegelatine", "oksegalatine",
  "honning", "honey", "bivoks", "beeswax",
  "karmin", "carmine", "cochenille", "e120",
  "skellak", "shellac", "e904",
  "lanolin", "animalsk fedt", "svinefedt", "talg", "tallow",
  "kødekstrakt", "kødboullion", "okseekstrakt", "kyllingeekstrakt",
  "svinekød", "oksekød", "kylling", "lam", "kalv", "and", "gås",
  "kød", "bacon", "skinke", "pølse", "salami",
  "anchovy", "ansjos", "isinglass",
];

const MEAT_KEYWORDS = [
  "svinekød", "oksekød", "kylling", "lam", "kalv", "and", "gås",
  "kød", "bacon", "skinke", "pølse", "salami", "spegepølse",
  "kødekstrakt", "kødboullion", "okseekstrakt", "kyllingeekstrakt",
  "vildtkød", "hjortekød", "kaninkød", "lever",
];

const DAIRY_EGG_KEYWORDS = [
  "gelatine", "gelatin", "honning", "honey", "bivoks", "beeswax",
  "karmin", "carmine", "e120", "skellak", "shellac", "e904",
  "lanolin", "animalsk fedt", "svinefedt", "talg", "tallow",
];

// Tjek om et produkt er kompatibelt med en diæt
// Returnerer: { ok: true/false/null, reasons: string[], confidence: "high"/"medium"/"low" }
export function checkDietCompatibility(dietId, allergenFlags, ingredientsText, nutrition) {
  const flags = allergenFlags || {};
  const lower = (ingredientsText || "").toLowerCase();
  const reasons = [];

  // Hjælpefunktion: tjek om ingredienstekst indeholder et keyword (med ordgrænse for korte ord)
  const hasIngredient = (keyword) => {
    if (keyword.length <= 4) {
      // Kort ord: brug ordgrænse for at undgå falske positiver
      const idx = lower.indexOf(keyword);
      if (idx === -1) return false;
      const before = idx > 0 ? lower[idx - 1] : " ";
      const after = idx + keyword.length < lower.length ? lower[idx + keyword.length] : " ";
      const isWordChar = (c) => /[a-zæøå0-9]/i.test(c);
      return !isWordChar(before) && !isWordChar(after);
    }
    return lower.includes(keyword);
  };

  switch (dietId) {
    case "vegan": {
      // Allergen-flags tjek
      if (flags.maelkeallergi === "yes") reasons.push("Indeholder mælkeprotein");
      else if (flags.maelkeallergi === "traces") reasons.push("Kan indeholde spor af mælk");
      if (flags.laktose === "yes") reasons.push("Indeholder laktose");
      if (flags.aeg === "yes") reasons.push("Indeholder æg");
      else if (flags.aeg === "traces") reasons.push("Kan indeholde spor af æg");
      if (flags.fisk === "yes") reasons.push("Indeholder fisk");
      if (flags.skaldyr === "yes") reasons.push("Indeholder skaldyr");
      if (flags.bloeddyr === "yes") reasons.push("Indeholder bløddyr");
      // Ingrediens-tjek for ting allergen-flags ikke fanger
      for (const kw of ANIMAL_KEYWORDS) {
        if (hasIngredient(kw)) { reasons.push("Indeholder " + kw); break; }
      }
      const confidence = lower.length > 10 ? "high" : "low";
      return { ok: reasons.length === 0, reasons, confidence };
    }

    case "vegetarian": {
      // Tillader mælk og æg, men ikke kød/fisk
      if (flags.fisk === "yes") reasons.push("Indeholder fisk");
      if (flags.skaldyr === "yes") reasons.push("Indeholder skaldyr");
      if (flags.bloeddyr === "yes") reasons.push("Indeholder bløddyr");
      for (const kw of MEAT_KEYWORDS) {
        if (hasIngredient(kw)) { reasons.push("Indeholder " + kw); break; }
      }
      for (const kw of DAIRY_EGG_KEYWORDS) {
        if (hasIngredient(kw)) { reasons.push("Indeholder " + kw); break; }
      }
      const confidence = lower.length > 10 ? "high" : "low";
      return { ok: reasons.length === 0, reasons, confidence };
    }

    case "pescetarian": {
      // Tillader fisk, skaldyr, bløddyr, mælk, æg — men ikke kød
      for (const kw of MEAT_KEYWORDS) {
        if (hasIngredient(kw)) { reasons.push("Indeholder " + kw); break; }
      }
      const confidence = lower.length > 10 ? "high" : "low";
      return { ok: reasons.length === 0, reasons, confidence };
    }

    case "gluten-free": {
      if (flags.gluten === "yes") reasons.push("Indeholder gluten");
      else if (flags.gluten === "traces") reasons.push("Kan indeholde spor af gluten");
      if (flags.hvede === "yes") reasons.push("Indeholder hvede");
      else if (flags.hvede === "traces") reasons.push("Kan indeholde spor af hvede");
      return { ok: reasons.length === 0, reasons, confidence: "high" };
    }

    case "keto": {
      // Keto kræver næringsdata — tjek kulhydrater per 100g
      if (nutrition && nutrition.carbohydrates != null) {
        const carbs = parseFloat(nutrition.carbohydrates);
        if (carbs > 10) reasons.push("Højt kulhydratindhold (" + carbs + "g/100g)");
        else if (carbs > 5) reasons.push("Moderat kulhydrat (" + carbs + "g/100g)");
        return { ok: reasons.length === 0, reasons, confidence: "medium" };
      }
      // Uden næringsdata: tjek for oplagte keto-brud
      const ketoBreakers = ["sukker", "glucose", "fructose", "sirup", "mel", "stivelse", "kartoffel", "ris", "pasta", "brød"];
      for (const kw of ketoBreakers) {
        if (hasIngredient(kw)) { reasons.push("Indeholder " + kw); break; }
      }
      if (reasons.length > 0) return { ok: false, reasons, confidence: "low" };
      return { ok: null, reasons: ["Næringsdata mangler — kan ikke vurdere keto"], confidence: "low" };
    }

    default:
      return { ok: null, reasons: ["Ukendt diæt"], confidence: "low" };
  }
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

// ─── MADPAS — BUNDLED OVERSÆTTELSER ─────────────────────────────────────────
