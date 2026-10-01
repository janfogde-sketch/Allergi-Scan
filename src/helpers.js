// @ts-nocheck
import { ALLERGENS, DIETS, DIETS_ENABLED, AVATAR_COLORS, SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { ALLERGEN_KEYWORDS, keywordMatches, matchCustomAllergens } from "./allergenKeywords.js";

// Re-eksporteret så scan-/opskrift-/resultat-koden kan importere den sammen
// med de øvrige allergen-hjælpefunktioner fra denne fil, fremfor at skulle
// kende til at den reelt bor i allergenKeywords.js.
export { matchCustomAllergens };

export const initials = n => (n||"").split(" ").filter(Boolean).map(w=>w[0]).join("").toUpperCase().slice(0,2)||"?";

export const timeAgo = ts => { const d=Date.now()-new Date(ts).getTime(); if(d<60000)return"Lige nu"; if(d<3600000)return`${Math.floor(d/60000)} min siden`; if(d<86400000)return`${Math.floor(d/3600000)} t siden`; return`${Math.floor(d/86400000)} d siden`; };

// Returnerer objekter, ikke færdig-sammensatte tekststrenge (ændret 29.
// sept. 2026, "Laktose"-ikon-opgaven) — de fleste allergener vises stadig
// med deres rigtige emoji direkte, men "Laktose" skal vises med et
// specialtegnet ikon (AllergenGlyph i SharedComponents.jsx) i stedet for
// sit emoji. Denne fil er ren .js (ingen JSX-understøttelse i byggeriet),
// så selve ikon-renderingen sker hos kaldestedet (ProfileScreen.jsx), der
// får `id`/`emoji`/`label` og kan bruge <AllergenGlyph a={item} />.
export const getAllergenLabels = (ids,custom=[]) => [...ids.map(id=>ALLERGENS.find(a=>a.id===id)).filter(Boolean).map(a=>({ id:a.id, emoji:a.emoji, label:a.label })),...custom.map(c=>({ id:null, emoji:"✏️", label:c }))];

// En del importerede produkter har et generisk navn der reelt er en kategori/
// produkttype (fx "Energidrik", "Ice", "Original") frem for et navn der kan
// skelnes fra andre produkter fra samme mærke. Foran sådan et navn med
// mærket, så listevisninger viser noget genkendeligt (fx "Faxe Kondi
// Energidrik") i stedet for bare "Energidrik".
export function productDisplayName(product) {
  const name = (product?.name || "").trim();
  const brand = (product?.brand || "").trim();
  if (!brand) return name;
  if (!name) return brand;
  return name.toLowerCase().includes(brand.toLowerCase()) ? name : `${brand} ${name}`;
}

// Skaler et kamera-/galleri-billede ned og genkod som JPEG FØR det sendes til
// en OCR/allergen-Edge Function som base64. Uden dette sendes et fuldt
// opløst telefonfoto (ofte 5-15MB) rå som base64 (~33% større igen) — det
// er langsommere at uploade, langsommere for OCR at behandle, og risikerer
// at ramme Supabase Edge Functions' payload-grænse. maxDim/quality er valgt
// så tekst i ingredienslisten/stregkoder stadig er let læselige for OCR.
export function compressImageToBase64(file, maxDim = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality).split(",")[1]);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Kunne ikke indlæse billedet")); };
    img.src = url;
  });
}

// Tjek GTIN/EAN-kontrolcifferet (standard mod-10, skiftevis vægt 3/1 fra højre).
// Bruges til at afvise en åbenlyst forkert manuelt indtastet stregkode (typo)
// FØR den sendes til serveren — ellers spilder vi en tur til backend på noget
// der aldrig kan matche et rigtigt produkt.
export function isValidEanChecksum(code) {
  if (!/^\d+$/.test(code)) return false;
  if (![8, 12, 13, 14].includes(code.length)) return false;
  const digits = code.split("").map(Number);
  const check = digits.pop();
  let sum = 0;
  digits.reverse().forEach((d, i) => { sum += d * (i % 2 === 0 ? 3 : 1); });
  return (10 - (sum % 10)) % 10 === check;
}

// Tilføjer en egen (fritekst-)allergi uden dubletter (uanset store/små bogstaver).
export function addUniqueCustom(list, value) {
  const v = (value || "").trim();
  if (!v || (list || []).some(c => c.toLowerCase() === v.toLowerCase())) return list || [];
  return [...(list || []), v];
}

export const STORE_SOURCES = ["bilka", "nemlig"];

export const verifiedBadge = (verified_status, source) => {
  // Producent-data — højeste troværdighed
  if (verified_status === "verified" || source === "producer")
    return { label:"Fra producent", bg:"rgba(34,197,94,.1)", color:"#16a34a", dot:"#16a34a" };
  // Open Food Facts — crowd-sourced
  if (source === "off" || source === "open_food_facts")
    return { label:"Open Food Facts", bg:"rgba(37,99,235,.06)", color:"#2563eb", dot:"#2563eb" };
  // Importeret fra butikkernes varekataloger — ikke indsendt af en bruger
  if (STORE_SOURCES.includes(source))
    return { label:"Butiksdata", bg:"rgba(138,144,153,.08)", color:"#6B7280", dot:"#6B7280" };
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

// Logger (fire-and-forget) at en bruger valgte/tilføjede et produkt fra et
// søgeresultat for en given søgning — bruges af søgefunktionen til at lære
// sammenhængen mellem søgeord og hvad folk rent faktisk vælger, både til
// global rangering (mest valgte på tværs af alle) og personlig rangering
// (hvad denne bruger selv plejer at vælge). Må aldrig blokere eller fejle
// synligt for brugeren — søgningen/tilføjelsen skal virke uanset.
export function logSearchSelection(query, product, accessToken) {
  const ean = product?.ean || product?.code;
  if (!query?.trim() || !ean) return;
  fetch(`${SUPABASE_URL}/functions/v1/search`, {
    method: "POST",
    headers: makeHeaders(accessToken),
    body: JSON.stringify({ query: query.trim(), ean, product_id: product.id || null }),
  }).catch(() => {});
}

export async function apiCall(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    const parsed = (() => { try { return JSON.parse(bodyText); } catch { return {}; } })();
    const err = new Error(parsed.message || parsed.error_description || parsed.error || `HTTP ${res.status}`);
    // Rå status + response-body bevares på fejlen, så kaldere der reelt har
    // brug for det (fx et 401 der skal give en anden besked end en 500) kan
    // tjekke e.status/e.body i stedet for at falde tilbage til rå fetch —
    // det var apiCall's manglende status-info, der i praksis drev denne
    // divergens tidligere, ikke en reel forskel i behov.
    err.status = res.status;
    err.body = bodyText;
    throw err;
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

// JWT-payloads er base64url (bruger -/_ i stedet for +// og har ingen padding).
// Almindelig atob() fejler tilfældigt afhængig af token-indhold — konverter først.
export function decodeJwtPayload(token) {
  const b64 = token.split(".")[1];
  const padded = b64.replace(/-/g, "+").replace(/_/g, "/").padEnd(b64.length + (4 - (b64.length % 4)) % 4, "=");
  return JSON.parse(atob(padded));
}

// ─── ALLERGEN SAMMENLIGNING ──────────────────────────────────────────────────

const FLAG_RANK = { yes: 3, traces: 2, no: 1, unknown: 0 };
const flagRank = (v) => (v === true ? 3 : FLAG_RANK[v] ?? 0);

// Hvede indeholder altid gluten — et hvede-fund skal derfor også advare en
// gluten-bruger, selv hvis produktets gluten-flag (fejlagtigt) siger "no".
export function effectiveAllergenFlag(flags, id) {
  const val = flags?.[id];
  if (id === "gluten" && flagRank(flags?.hvede) >= 2 && flagRank(flags.hvede) > flagRank(val)) return flags.hvede;
  return val;
}

// Ord der næsten kun optræder i tyske/engelske/svenske/norske ingredienslister.
const FOREIGN_INGREDIENT_STEMS = [
  "zucker","weizen","milch","vollmilch","magermilch","wasser","salz","hefe","eier","haselnüss","mandeln","roggen","gerste","sahne","zutaten",
  "sugar","wheat","flour","milk","water","yeast","eggs","hazelnut","almond","butter","cream","barley","rye","ingredients",
  "socker","vete","mjölk","vatten","ägg","råg","grädde","smör","jäst","nötter","ingredienser:","hvete","melk",
];
const DANISH_INGREDIENT_STEMS = ["sukker","hvede","mælk","vand","gær","smør","fløde","olie","nødder","mandler","kerner","stivelse","krydderi","æg","rug","byg","havre"];

// Ingredienslister på et andet sprog end dansk kan vores danske nøgleords-
// motor ikke læse — den svarer "no" for alt, hvilket ellers vises som grønt.
export function looksNonDanishIngredients(text) {
  const words = (text || "").toLowerCase().split(/[^a-zæøåäöüß:]+/).filter(Boolean);
  if (words.length === 0) return false;
  const danishHits = words.filter(w => DANISH_INGREDIENT_STEMS.some(s => w.startsWith(s) || w.endsWith(s)) || /mel$/.test(w)).length;
  if (danishHits > 0) return false;
  return words.some(w => FOREIGN_INGREDIENT_STEMS.some(s => w.startsWith(s)));
}

export function hasRealIngredients(text) {
  const t = (text || "").trim();
  return t.length > 0 && !/^ingen ingrediensliste/i.test(t);
}

// Produktets allergen-flag som de reelt kan bruges til en vurdering: "no"
// uden grundlag (ingen ingrediensliste, eller en liste nøgleordsmotoren ikke
// kan læse) gøres til "unknown", så appen aldrig viser "ingen advarsler" for
// noget den ikke har kontrolleret. Producent-verificerede eller AI-læste
// (Claude) flag stoles der på uændret.
export function normalizeProductFlags(flags, { ingredientsText = "", verifiedStatus, source, sourceMethod, quality } = {}) {
  const out = { ...(flags || {}) };
  // Uden ingrediensliste har hverken nøgleord eller Claude læst noget — da
  // stoles der kun på producent-verificerede data.
  const verified = verifiedStatus === "verified" || source === "producer";
  const aiRead = /claude/.test(sourceMethod || "") || quality === "high";
  const noIngredients = !hasRealIngredients(ingredientsText);
  if (!verified && (noIngredients || (!aiRead && looksNonDanishIngredients(ingredientsText)))) {
    for (const k of Object.keys(out)) if (out[k] === "no" || out[k] === false) out[k] = "unknown";
  }
  const g = effectiveAllergenFlag(out, "gluten");
  if (g !== out.gluten && g !== undefined) out.gluten = g;
  return out;
}

export function normalizeProductFlagsFor(product) {
  if (!product) return {};
  return normalizeProductFlags(product.allergen_flags, {
    ingredientsText: product.ingredients || product.ingredients_text || "",
    verifiedStatus: product.verified_status, source: product.source,
    sourceMethod: product.allergen_source_method, quality: product.allergen_quality,
  });
}

export function compareAllergens(flags, activeAllergenIds) {
  if (!flags || activeAllergenIds.length === 0) return { status:"safe", matchedDanger:[], matchedWarning:[], hasUnknown:false, confidence:"high", explanation:[] };
  const matchedDanger = [];
  const matchedWarning = [];
  let hasUnknown = false;
  const explanation = []; // Forklaring på HVORFOR et produkt er usikkert

  for (const id of activeAllergenIds) {
    const val = effectiveAllergenFlag(flags, id);
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

// Fjern specifikke, admin-fravalgte E-numre fra en ingrediensteksts rå
// forekomster (fx "E 270" eller "E270") — bruges når admin under gennemsyn
// af en indsendelse fravælger et automatisk fundet E-nummer som en
// fejlaflæsning. E-numre er IKKE et selvstændigt gemt felt på produktet
// (de udledes altid live fra ingredients_text, se useProduct.js), så et
// fravalg skal ske i selve teksten for at slå igennem på det færdige
// produkt. Rydder efterfølgende dobbelt-komma/mellemrum som fjernelsen kan
// efterlade.
export function stripExcludedENumbers(text, excluded) {
  if (!text || !excluded?.length) return text;
  let result = text;
  for (const eNum of excluded) {
    const digits = eNum.replace(/^E/i, "");
    const re = new RegExp(`\\bE[\\s-]?${digits}\\b`, "gi");
    result = result.replace(re, "");
  }
  return result
    .replace(/,\s*,/g, ",")
    .replace(/^[,\s]+|[,\s]+$/g, "")
    .replace(/\s{2,}/g, " ");
}

// Normaliserer fritekst-input til "E###" (eller "E###a") — bruges når admin
// selv tilføjer et E-nummer OCR'en er gået glip af. EU-konventionen er stort
// E + tal + evt. LILLE bogstav-suffiks (fx "E150a", ikke "E150A").
export function normalizeENumber(input) {
  if (!input) return null;
  const m = String(input).trim().match(/^E?[\s-]?(\d{3,4})([a-zA-Z]?)$/i);
  if (!m) return null;
  return "E" + m[1] + (m[2] ? m[2].toLowerCase() : "");
}

// Tilføjer et normaliseret E-nummer til en ingredienstekst, hvis det ikke
// allerede er nævnt (undgår dubletter når admin tilføjer et E-nummer
// OCR'en er gået glip af — se normalizeENumber ovenfor).
export function addENumberToText(text, eNum) {
  if (!eNum) return text;
  const existing = extractENumbers(text || "");
  if (existing.some(e => e.toUpperCase() === eNum.toUpperCase())) return text;
  const trimmed = (text || "").trim();
  return trimmed ? `${trimmed}, ${eNum}` : eNum;
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

// "hvede" er en egen ALLERGENS-kategori (specifik hvedeallergi), men hvede
// indeholder selvfølgelig gluten — så et glutenfri-tjek skal fange begge lister,
// ikke kun "gluten"-nøgleordene, ellers overses fx "hvedemel" i ingredienslisten
const GLUTEN_KEYWORDS = [...ALLERGEN_KEYWORDS.gluten, ...ALLERGEN_KEYWORDS.hvede];

// Tjek om et produkt er kompatibelt med en diæt
// Returnerer: { ok: true/false/null, reasons: string[], confidence: "high"/"medium"/"low" }
export function checkDietCompatibility(dietId, allergenFlags, ingredientsText, nutrition) {
  const flags = allergenFlags || {};
  const lower = (ingredientsText || "").toLowerCase();
  const reasons = [];

  // Genbruger allergenKeywords.js' keywordMatches i stedet for en egen kopi
  // af ordgrænse-logikken — den udgave scanner ALLE forekomster af ordet
  // (ikke kun den første) og er negations-bevidst ("glutenfri" matcher IKKE
  // "gluten"), begge dele fundet manglende her ved en allergen-logik-
  // gennemgang (16. sept. 2026). Uden negations-tjekket ville et produkt der
  // eksplicit skriver "glutenfri havre" fejlagtigt blive vist som "Indeholder
  // gluten" — det modsatte af hvad emballagen rent faktisk siger.
  const hasIngredient = (keyword) => keywordMatches(lower, keyword);

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
      // Strukturerede allergen-flags mangler tit (bruger-indsendte/delvist
      // verificerede produkter) — uden dette tjek ville et sådant produkt
      // fremstå "glutenfri, høj sikkerhed" selvom ingredienslisten fx siger
      // "hvedemel". Samme mønster som vegansk/vegetarisk herover.
      if (reasons.length === 0) {
        for (const kw of GLUTEN_KEYWORDS) {
          if (hasIngredient(kw)) { reasons.push("Indeholder " + kw); break; }
        }
      }
      const flagsKnown = ["yes","no","traces"].includes(flags.gluten) || ["yes","no","traces"].includes(flags.hvede);
      const confidence = flagsKnown ? "high" : (lower.length > 10 ? "medium" : "low");
      return { ok: reasons.length === 0, reasons, confidence };
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

// ─── PER-PROFIL SIKKERHEDSVURDERING ──────────────────────────────────────────
// Delt mellem ResultScreen (efter et scan) og ListScreen (for varer på
// indkøbslisten med kendt produktdata) — begge skal vurdere et produkt
// SEPARAT mod hver aktiv profils allergier/kostpræferencer/overvågede
// E-numre, ikke kun det sammenlagte allergisæt. Udtrukket til én fælles
// implementation (25. sept. 2026, opfølgning på PR #325) — to uafhængige
// kopier af samme sikkerhedsrelevante beregning har allerede forårsaget
// mindst én bug tidligere i dette projekt (se App.jsx' allActive()-kommentar).
// ─── HUSSTANDSKONTI SOM SKRIVEBESKYTTEDE PROFILER (1. okt. 2026) ─────────────
// Rigtige EatSafe-konti i husstanden (edge-funktionen family/group) kan vælges
// som profil ved scanning, i søgning, lister, historik og Madpas — på lige fod
// med de profiler, man selv har oprettet (`family`). Forskellen: de er
// skrivebeskyttede. Personen styrer selv sin konto, så de findes KUN i
// `scanFamily` (ProfileContext), aldrig i `family`, som redigér-/slet-
// skærmene bruger. Id'et har et fast præfiks, så det aldrig kan støde ind i
// en oprettet profils uuid og kan genkendes, når gemte valg ryddes op.
export const LINKED_PROFILE_PREFIX = "acct:";
export const isLinkedProfileId = (id) => typeof id === "string" && id.startsWith(LINKED_PROFILE_PREFIX);

export function householdToProfiles(household) {
  return (household || []).map((m, i) => ({
    id: `${LINKED_PROFILE_PREFIX}${m.id}`,
    name: m.name || (m.email || "").split("@")[0] || "Husstandsmedlem",
    color: AVATAR_COLORS[(i + 3) % AVATAR_COLORS.length],
    allergens: m.allergens || [],
    custom: m.custom || [],
    diets: visibleDiets(m.diets),
    eNumbers: m.eNumbers || [],
    linked: true,
    readOnly: true,
  }));
}

// Holder valget af profiler i takt med husstanden: nye husstandskonti vælges
// som standard (de, der ikke var kendt før), og valg af konti, der ikke længere
// er i husstanden, fjernes. Returnerer samme array, hvis intet ændres.
export function syncLinkedActiveProfiles(activeProfiles, linkedIds, knownIds) {
  const current = activeProfiles || [];
  const kept = current.filter(id => !isLinkedProfileId(id) || linkedIds.includes(id));
  const fresh = linkedIds.filter(id => !(knownIds || []).includes(id) && !kept.includes(id));
  const next = [...kept, ...fresh];
  return next.length === current.length && next.every((id, i) => id === current[i]) ? current : next;
}

/** Profilens valgte kostpræferencer, som appen må bruge: tom liste, mens kostpræferencer er sat på pause (DIETS_ENABLED). */
export const visibleDiets = (diets) => (DIETS_ENABLED ? (diets || []) : []);

export function buildActiveProfileList({ user, family, allergens, customAllerg, selectedENumbers, activeProfiles }) {
  return [
    { id:"me", name: user?.name || "Dig", allergens: allergens || [], custom: customAllerg || [], diets: visibleDiets(user?.diets), eNumbers: selectedENumbers || [], color: null },
    ...(family || []).map(m => ({ id:m.id, name:m.name, allergens: m.allergens || [], custom: m.custom || [], diets: visibleDiets(m.diets), eNumbers: m.eNumbers || [], color: m.color })),
  ].filter(p => (activeProfiles || []).includes(p.id));
}

export function computeProfileResults(profiles, { allergen_flags, ingredients, nutrition, productENumbers }) {
  const resultFlags = allergen_flags || {};
  const ingredientsText = ingredients || "";
  return (profiles || []).map(p => {
    const flagOf = (a) => effectiveAllergenFlag(resultFlags, a);
    const danger = (p.allergens || []).filter(a => flagOf(a) === "yes" || flagOf(a) === true);
    const warning = (p.allergens || []).filter(a => flagOf(a) === "traces");
    const unknown = (p.allergens || []).filter(a => !["yes", "traces", "no", true, false].includes(flagOf(a)));
    // Fritekst-match af profilens egne tilføjede allergier — se
    // matchCustomAllergens' egen kommentar for hvorfor dette er mindre
    // pålideligt end de faste allergener (ingen synonymer).
    const customMatches = p.custom?.length ? matchCustomAllergens(ingredientsText, p.custom) : [];
    const dietResults = (p.diets || []).map(d => ({
      id: d, label: DIETS.find(x => x.id === d)?.label || d,
      ...checkDietCompatibility(d, resultFlags, ingredientsText, nutrition),
    }));
    const dietFails = dietResults.filter(r => r.ok === false);
    const eNumberMatches = (productENumbers?.length > 0 && p.eNumbers?.length > 0)
      ? compareENumbers(productENumbers, p.eNumbers).matched
      : [];

    const reasons = [
      ...danger.map(id => ALLERGENS.find(a => a.id === id)?.label || id),
      ...customMatches.map(t => `Muligvis "${t}"`),
      ...warning.map(id => `Spor af ${ALLERGENS.find(a => a.id === id)?.label || id}`),
      ...dietFails.map(r => `${r.label}: ${r.reasons[0] || "passer ikke"}`),
      ...eNumberMatches.map(e => `Overvåget E-nummer ${e}`),
      ...unknown.map(id => `${ALLERGENS.find(a => a.id === id)?.label || id}: kan ikke afgøres`),
    ];
    const status = (danger.length > 0 || customMatches.length > 0) ? "danger"
      : (warning.length > 0 || dietFails.length > 0 || eNumberMatches.length > 0 || unknown.length > 0) ? "warn"
      : "safe";
    return { ...p, status, reasons, danger, warning, unknown, customMatches };
  });
}

// Statuslinje-tekst for en konflikt i lister (indkøbsliste, historik,
// favoritter, søgning). Nævner også profiler med en advarsel (fx spor), når
// en anden profil har en egentlig konflikt — ellers skjulte "Konflikt for
// Mia" at produktet også kunne indeholde spor af noget, brugeren selv skal
// undgå (live-test 30. sept. 2026). Returnerer null, når ingen har konflikt.
export function profileConflictLabel(results, { maxNames = Infinity, manyText = "Passer ikke til valgte profiler" } = {}) {
  const first = r => (r.name || "").split(" ")[0];
  const danger = results.filter(r => r.status === "danger").map(first);
  if (danger.length === 0) return null;
  const warn = results.filter(r => r.status === "warn").map(first);
  const main = danger.length <= maxNames ? `Konflikt for ${danger.join(", ")}` : manyText;
  return warn.length ? `${main} · advarsel for ${warn.join(", ")}` : main;
}

// Statuslinje-tekst når INGEN profil har konflikt eller advarsel (indkøbsliste,
// historik, favoritter, søgning) — tilpasset antallet af valgte profiler, så
// en bruger uden familie ikke læser "alle profiler" (brugerrapport 25. sept.
// 2026; erstatter den faste "Matcher alle profiler"). "Passer til" fremfor
// "Matcher", som i en allergi-app kan misforstås som et fund af allergenet.
// Tager både profillisten og resultater fra computeProfileResults (begge har
// id/name).
export function profileMatchLabel(profiles) {
  const list = profiles || [];
  if (list.length === 0) return "Passer til valgte profiler";
  if (list.length > 1) return "Passer til alle valgte profiler";
  const only = list[0];
  if (only.id === "me") return "Passer til din profil";
  const first = (only.name || "").trim().split(" ")[0];
  return first ? `Passer til ${first}` : "Passer til den valgte profil";
}

// ─── PRODUKTRESULTAT: KATEGORISEREDE FUND (28. sept. 2026) ──────────────────
// FINAL PRODUCT RESULT PAGE — ét genbrugeligt, data-drevet lag der grupperer
// et allerede-beregnet scan-resultats matches (matchedDanger/matchedWarning
// fra compareAllergens, matchede E-numre fra compareENumbers, diæt-resultater
// fra checkDietCompatibility) i allergi/intolerance/E-nummer/diæt ud fra
// ALLERGENS' eget `type`-felt ("allergi" vs "intolerance") — ingen ny
// allergen-logik, kun en omstrukturering af data der allerede findes.
// Rører IKKE ved compareAllergens/compareENumbers/checkDietCompatibility
// selv, og ændrer intet ved scanResult.status/headline/summary, som History/
// ListScreen/SearchScreen fortsat bruger uændret — kun ResultScreen.jsx
// bruger disse to funktioner, til sin egen, dynamiske statusvisning.
export function categorizeProductFindings({ matchedDanger, matchedWarning, customAllergenMatches, matchedENumbers, dietResults }) {
  const lookup = (ids, severity) => (ids || [])
    .map(id => {
      const a = ALLERGENS.find(x => x.id === id);
      return a ? { id, label: a.label, type: a.type, severity } : null;
    })
    .filter(Boolean);
  const byType = [...lookup(matchedDanger, "yes"), ...lookup(matchedWarning, "traces")];
  return {
    allergyMatches: byType.filter(x => x.type === "allergi"),
    intoleranceMatches: byType.filter(x => x.type === "intolerance"),
    customMatches: (customAllergenMatches || []).map(term => ({ id: term, label: term, severity: "custom" })),
    eNumberMatches: matchedENumbers || [],
    dietFails: (dietResults || []).filter(r => r.ok === false),
    dietUnknowns: (dietResults || []).filter(r => r.ok === null),
    dietPasses: (dietResults || []).filter(r => r.ok === true),
  };
}

// Beregner ÉN, tydelig topstatus ud fra de kategoriserede fund + om EatSafe
// reelt har nok data til at have foretaget kontrollen (`hasSufficientData`).
// FORBEDR PRODUKTSIDEN (28. sept. 2026) — kun TO farvede advarselstilstande
// nu, ikke fire: RØD er forbeholdt egentlige allergi-/intoleranceadvarsler
// (sundhedsrelevante, ikke et bevidst valg brugeren har taget), mens
// kostpræferencer og fravalgte E-numre samles under én neutral GUL/ORANGE
// "passer ikke til dine valg" — en kostpræference som vegansk skal ikke
// have samme alvorlige behandling som en allergiadvarsel. "safe" bruges KUN
// når der er nok data OG intet fund — aldrig som gæt. Returnerer aldrig ord
// som "sikkert"/"100% sikkert"/"allergifrit"/"garanteret".
export function computeTopStatus({ hasSufficientData, allergyMatches, intoleranceMatches, customMatches, eNumberMatches, dietFails }) {
  const healthNames = [...(customMatches || []), ...(allergyMatches || []), ...(intoleranceMatches || [])].map(m => m.label);
  if (healthNames.length > 0) {
    return { level: "danger", icon: "warning", headline: "Allergi-advarsel", names: healthNames };
  }
  const preferenceNames = [...(eNumberMatches || []), ...(dietFails || []).map(d => d.label)];
  if (preferenceNames.length > 0) {
    return { level: "warn", icon: "warning", headline: "Passer ikke til dine valg", names: preferenceNames };
  }
  if (!hasSufficientData) {
    return { level: "unknown", icon: "info", headline: "Ikke nok oplysninger til fuld kontrol", names: [] };
  }
  return { level: "safe", icon: "check", headline: "Ingen advarsler fundet", names: [] };
}

// ─── SCAN → INDKØBSLISTE-MATCH ───────────────────────────────────────────────
// Finder en umarkeret vare på den aktive indkøbsliste der sandsynligvis er
// den samme som det lige scannede produkt — bruges KUN til at foreslå
// "markér som købt" (ResultScreen), aldrig til automatisk at markere noget.
// Præcist EAN-/produkt-id-match først; fritekst-varer (intet EAN, fx en
// brugerskrevet "Mælk") matches i stedet på navnetekst begge veje, men kun
// ved en rimeligt specifik tekst (≥3 tegn) for at undgå støj-match.
export function findActiveListMatch(shoppingListItems, scanResult) {
  const unchecked = (shoppingListItems || []).filter(i => !i.checked);
  if (unchecked.length === 0 || !scanResult) return null;
  const scannedName = (scanResult.name || "").toLowerCase().trim();
  let hit = unchecked.find(i => i.ean && scanResult.code && i.ean === scanResult.code);
  if (!hit) hit = unchecked.find(i => i.product_id && scanResult.id && i.product_id === scanResult.id);
  if (!hit) {
    hit = unchecked.find(i => {
      if (i.ean) return false;
      const itemName = (i.name || "").toLowerCase().trim();
      return itemName.length >= 3 && (scannedName.includes(itemName) || itemName.includes(scannedName));
    });
  }
  return hit || null;
}

// ─── DEBUG TRACE SYSTEM ──────────────────────────────────────────────────────
// traceId(prefix) → unikt ID per operation (scan/search/ocr/submit)
// traceLog(id, step, data) → logger til console + in-memory array (max 200)
// getTraceLog() → henter alle traces som array
// clearTraceLog() → rydder alle traces

const _traceLog = [];

export function traceId(prefix = "op") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
}

export function traceLog(id, step, data = {}) {
  const entry = {
    id,
    step,
    ts: new Date().toISOString(),
    ms: Date.now(),
    ...data,
  };
  _traceLog.push(entry);
  if (_traceLog.length > 200) _traceLog.shift();
  // Log kun til konsollen i dev — i produktion ville dette lække scannede
  // EAN'er, produktnavne og rå OCR-tekst til enhver der åbner devtools.
  // getTraceLog()/Admin-debug-fanen har stadig fuld adgang til historikken
  // uanset miljø, kun selve console.log-outputtet er gated.
  if (import.meta.env.DEV) console.log(`[trace:${id}] ${step}`, data);
  return entry;
}

export function getTraceLog(id = null) {
  if (id) return _traceLog.filter(e => e.id === id);
  return [..._traceLog];
}

export function clearTraceLog() {
  _traceLog.length = 0;
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

// ─── MADPAS — BUNDLED OVERSÆTTELSER ─────────────────────────────────────────

// Adgangskode-krav (30. sept. 2026). Skal matche Supabases egne krav
// (Authentication → Sign In / Providers → Email): mindst ét lille bogstav,
// ét stort bogstav og ét tal. Længden (10) er appens eget, strengere krav.
// Supabase afviste ellers koder, som appen havde godkendt, med en tekst der
// ikke forklarede hvorfor. Retter man kravene i Supabase, skal de også
// rettes her.
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_REQUIREMENTS_TEXT = "Mindst 10 tegn med små og store bogstaver og mindst ét tal.";

export function passwordProblems(pw) {
  const p = pw || "";
  const missing = [];
  if (!/[a-zæøå]/.test(p)) missing.push("et lille bogstav");
  if (!/[A-ZÆØÅ]/.test(p)) missing.push("et stort bogstav");
  if (!/[0-9]/.test(p)) missing.push("et tal");
  return { tooShort: p.length < PASSWORD_MIN_LENGTH, length: p.length, missing };
}

const joinDa = (xs) => xs.length <= 1 ? (xs[0] || "") : `${xs.slice(0, -1).join(", ")} og ${xs[xs.length - 1]}`;

// Én konkret sætning om hvad der er galt, eller "" når koden er i orden.
export function passwordErrorText(pw) {
  const { tooShort, length, missing } = passwordProblems(pw);
  if (!pw) return `Indtast en adgangskode. ${PASSWORD_REQUIREMENTS_TEXT}`;
  const parts = [];
  if (tooShort) parts.push(`den er kun ${length} tegn (mindst ${PASSWORD_MIN_LENGTH})`);
  if (missing.length) parts.push(`den mangler ${joinDa(missing)}`);
  if (!parts.length) return "";
  const s = parts.join(", og ");
  return `Adgangskoden kan ikke bruges: ${s}.`;
}
