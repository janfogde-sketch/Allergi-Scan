// @ts-check
import { ALLERGENS, DIETS, DIETS_ENABLED, AVATAR_COLORS, SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { ALLERGEN_KEYWORDS, keywordMatches, matchCustomAllergens } from "./allergenKeywords.js";
import { looksNonDanish } from "../supabase/functions/_shared/allergenEngine.js";

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
// Brugerens valg hedder det samme overalt (profil, onboarding, Dine valg, familie): pickerLabel, hvis den findes (fx Glutenfølsomhed). `label` bruges kun i sætninger om produktets indhold ("Indeholder gluten").
export const allergenChoiceLabel = (a) => (a && (a.pickerLabel || a.label)) || "";
export const getAllergenLabels = (ids,custom=[]) => [...ids.map(id=>ALLERGENS.find(a=>a.id===id)).filter(Boolean).map(a=>({ id:a.id, emoji:a.emoji, label:allergenChoiceLabel(a) })),...custom.map(c=>({ id:null, emoji:"✏️", label:c }))];

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

export const OFF_IMAGE_LICENSE_URL = "https://creativecommons.org/licenses/by-sa/3.0/deed.da";

// Kildeangivelse til Open Food Facts-billeder (CC BY-SA). Kilden aflæses af
// billedets adresse, så ingen kolonne er nødvendig. Andre kilder giver null.
export function imageAttribution(url) {
  if (typeof url !== "string") return null;
  return /^https:\/\/images\.openfoodfacts\.org\//i.test(url) ? "Billede: Open Food Facts, CC BY-SA" : null;
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

// UPC-E (8 cifre, talsystem 0/1) udvides til UPC-A (12 cifre). UPC-E's
// kontrolciffer regnes på UPC-A-formen, så EAN-8-checksummen afviser ellers
// mange gyldige UPC-E-koder. Returnerer null, hvis koden ikke er UPC-E-formet.
export function expandUpcE(code) {
  if (!/^[01]\d{7}$/.test(code || "")) return null;
  const [ns, d1, d2, d3, d4, d5, d6, check] = code.split("");
  let body;
  if (d6 <= "2") body = d1 + d2 + d6 + "0000" + d3 + d4 + d5;
  else if (d6 === "3") body = d1 + d2 + d3 + "00000" + d4 + d5;
  else if (d6 === "4") body = d1 + d2 + d3 + d4 + "00000" + d5;
  else body = d1 + d2 + d3 + d4 + d5 + "0000" + d6;
  return ns + body + check;
}

// Gyldig stregkode fra kameraet eller indtastning, ellers null. Er formatet
// kendt som UPC-E (eller passer 8 cifre kun som UPC-E), slås koden op som UPC-A.
export function normalizeScannedBarcode(code, formatName) {
  const c = String(code || "").trim();
  const upcA = expandUpcE(c);
  if (formatName === "UPC_E") return upcA && isValidEanChecksum(upcA) ? upcA : null;
  if (isValidEanChecksum(c)) return c;
  return upcA && isValidEanChecksum(upcA) ? upcA : null;
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
    return { label:"Fra producent", bg:"rgba(15,125,79,.10)", color:"#0F7D4F", dot:"#0F7D4F" };
  // Open Food Facts — crowd-sourced
  if (source === "off" || source === "open_food_facts")
    return { label:"Open Food Facts", bg:"rgba(58,110,165,.10)", color:"#3A6EA5", dot:"#3A6EA5" };
  // Importeret fra butikkernes varekataloger — ikke indsendt af en bruger
  if (STORE_SOURCES.includes(source))
    return { label:"Butiksdata", bg:"rgba(107,122,112,.12)", color:"#5C6A61", dot:"#5C6A61" };
  // Bruger-indsendt
  return { label:"Bruger-indsendt", bg:"rgba(107,122,112,.12)", color:"#5C6A61", dot:"#5C6A61" };
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
    const err = /** @type {Error & { status?: number, body?: string }} */ (new Error(parsed.message || parsed.error_description || parsed.error || `HTTP ${res.status}`));
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

export const COELIAC_ID = "coeliaki";
const FLAG_RANK = { yes: 3, traces: 2, no: 1, unknown: 0 };
const flagRank = (v) => (v === true ? 3 : FLAG_RANK[v] ?? 0);

// Hvede indeholder altid gluten — et hvede-fund skal derfor også advare en
// gluten-bruger, selv hvis produktets gluten-flag (fejlagtigt) siger "no".
// Cøliaki er kun et profilvalg (ingen egne produktflag): det vurderes mod produktets gluten- og hvedeflag, den højeste risiko vinder.
export function effectiveAllergenFlag(flags, id) {
  if (id === COELIAC_ID) {
    const g = effectiveAllergenFlag(flags, "gluten");
    return flagRank(flags?.hvede) > flagRank(g) ? flags.hvede : g;
  }
  const val = flags?.[id];
  if (id === "gluten" && flagRank(flags?.hvede) >= 2 && flagRank(flags.hvede) > flagRank(val)) return flags.hvede;
  return val;
}

// Ingredienslister på et andet sprog end dansk kan vores danske nøgleordsmotor
// ikke læse — den svarer "no" for alt, hvilket ellers vises som grønt. Samme
// heuristik som backend (delt kode siden 2. okt. 2026, så de to ikke driver fra hinanden).
export const looksNonDanishIngredients = looksNonDanish;

const normName = (t) => (t || "").toLowerCase().replace(/[^a-zæøåäöü0-9]+/g, " ").trim();

// Importerede produkter har ofte produktnavnet som "ingrediensliste" (fx "Skrabeæg 8 M/L",
// "Hvidløgssmør"). Det er ingen liste, og nøgleordsmotoren svarede "ingen allergener".
function hasRealIngredients(text, productName) {
  const t = (text || "").trim();
  if (t.length === 0 || /^ingen ingrediensliste/i.test(t)) return false;
  return !(productName && normName(t) === normName(productName));
}

// Produktets allergen-flag som de reelt kan bruges til en vurdering: "no"
// uden grundlag (ingen ingrediensliste, eller en liste nøgleordsmotoren ikke
// kan læse) gøres til "unknown", så appen aldrig viser "ingen advarsler" for
// noget den ikke har kontrolleret. Producent-verificerede eller AI-læste
// (Claude) flag stoles der på uændret.
/** @param {{ ingredientsText?: string, productName?: string, verifiedStatus?: string, source?: string, sourceMethod?: string, quality?: string }} [info] */
export function normalizeProductFlags(flags, info = {}) {
  const { ingredientsText = "", productName = "", verifiedStatus, source, sourceMethod, quality } = info;
  const out = { ...(flags || {}) };
  // Uden ingrediensliste har hverken nøgleord eller Claude læst noget — da
  // stoles der kun på producent-verificerede data.
  const verified = verifiedStatus === "verified" || source === "producer";
  const aiRead = /claude/.test(sourceMethod || "") || quality === "high";
  const noIngredients = !hasRealIngredients(ingredientsText, productName);
  if (!verified && (noIngredients || (!aiRead && looksNonDanishIngredients(ingredientsText)))) {
    for (const k of Object.keys(out)) if (out[k] === "no" || out[k] === false) out[k] = "unknown";
  }
  // Producentens eget "laktosefri" i navnet (samme tillid som "laktosefri" i selve teksten, se motoren).
  if (!noIngredients && /laktose\s*-?fri|lactose[\s-]?free/i.test(productName) && (out.laktose === "yes" || out.laktose === "traces")) out.laktose = "no";
  const g = effectiveAllergenFlag(out, "gluten");
  if (g !== out.gluten && g !== undefined) out.gluten = g;
  return out;
}

export function normalizeProductFlagsFor(product) {
  if (!product) return {};
  return normalizeProductFlags(product.allergen_flags, {
    ingredientsText: product.ingredients || product.ingredients_text || "",
    productName: product.name || "",
    verifiedStatus: product.verified_status, source: product.source,
    sourceMethod: product.allergen_source_method, quality: product.allergen_quality,
  });
}

// Følsomhed pr. allergen (allergen_levels, 1. okt. 2026): "direct_only" = brugeren reagerer kun på direkte indhold,
// så spor flagges ikke som advarsel, men returneres som ignoredTraces (vises som en rolig info-linje). Alt andet,
// også manglende niveau, er "strict" (spor giver en advarsel, som hidtil).
const LEVEL_DIRECT_ONLY = "direct_only";
export const ignoresTraces = (levels, id) => levels?.[id] === LEVEL_DIRECT_ONLY;

// Fjerner sporvalg for allergener, der ikke (længere) er valgt, så der aldrig ligger skjulte værdier i state eller profil
// (fx Mælks "Kun ved ingrediens", efter Mælk er fjernet). Returnerer det samme objekt, hvis intet skal fjernes.
// Allergener, hvor "kan indeholde spor af" giver mening som valg (ikke fx laktoseintolerance, ALLERGENS[].traceOk === false; egne valg
// har aldrig sporvalg).
export const traceEligible = (allergenIds) => (allergenIds || []).filter(id => {
  const a = ALLERGENS.find(x => x.id === id);
  return !!a && a.traceOk !== false;
});

export function pruneAllergenLevels(levels, allergenIds) {
  const src = levels || {};
  const keep = new Set(traceEligible(allergenIds));
  const keys = Object.keys(src);
  if (keys.every(k => keep.has(k))) return src;
  return Object.fromEntries(keys.filter(k => keep.has(k)).map(k => [k, src[k]]));
}

/**
 * Sammenlagt niveau for flere profiler: et allergen ignorerer kun spor, hvis ALLE aktive profiler, der har det
 * allergen, ignorerer spor (strengeste profil vinder). profiles: [{ allergens, levels }].
 */
export function mergeAllergenLevels(profiles) {
  const strict = new Set();
  const seen = new Set();
  for (const p of profiles || []) {
    for (const id of p.allergens || []) {
      seen.add(id);
      if (!ignoresTraces(p.levels, id)) strict.add(id);
    }
  }
  const out = {};
  for (const id of seen) if (!strict.has(id)) out[id] = LEVEL_DIRECT_ONLY;
  return out;
}

export function compareAllergens(flags, activeAllergenIds, levels) {
  if (!flags || activeAllergenIds.length === 0) return { status:"safe", matchedDanger:[], matchedWarning:[], ignoredTraces:[], hasUnknown:false, confidence:"high", explanation:[] };
  const matchedDanger = [];
  const matchedWarning = [];
  const ignoredTraces = [];
  let hasUnknown = false;
  const explanation = []; // Forklaring på HVORFOR et produkt er usikkert

  for (const id of activeAllergenIds) {
    const val = effectiveAllergenFlag(flags, id);
    // Håndter boolean (recipes) og string (produkter)
    if (val === true || val === "yes") {
      matchedDanger.push(id);
      explanation.push({ allergen: id, reason: "direkte", severity: "high" });
    } else if (val === "traces") {
      if (ignoresTraces(levels, id)) { ignoredTraces.push(id); continue; }
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

  return { status, matchedDanger, matchedWarning, ignoredTraces, hasUnknown, confidence, explanation };
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
    name: m.name || (m.email || "").split("@")[0] || "Familiemedlem",
    color: AVATAR_COLORS[(i + 3) % AVATAR_COLORS.length],
    allergens: m.allergens || [],
    custom: m.custom || [],
    diets: visibleDiets(m.diets),
    levels: m.allergenLevels || {},
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
    { id:"me", name: user?.name || "Dig", allergens: allergens || [], custom: customAllerg || [], diets: visibleDiets(user?.diets), levels: user?.allergenLevels || {}, eNumbers: selectedENumbers || [], color: null },
    ...(family || []).map(m => ({ id:m.id, name:m.name, allergens: m.allergens || [], custom: m.custom || [], diets: visibleDiets(m.diets), levels: m.levels || {}, eNumbers: m.eNumbers || [], color: m.color })),
  ].filter(p => (activeProfiles || []).includes(p.id));
}

export function computeProfileResults(profiles, { allergen_flags, ingredients, nutrition, productENumbers }) {
  const resultFlags = allergen_flags || {};
  const ingredientsText = ingredients || "";
  return (profiles || []).map(p => {
    const flagOf = (a) => effectiveAllergenFlag(resultFlags, a);
    const danger = (p.allergens || []).filter(a => flagOf(a) === "yes" || flagOf(a) === true);
    const tracesAll = (p.allergens || []).filter(a => flagOf(a) === "traces");
    // Spor for allergener, brugeren kun reagerer direkte på (allergen_levels), flagges ikke, men vises som info
    const ignoredTraces = tracesAll.filter(a => ignoresTraces(p.levels, a));
    const warning = tracesAll.filter(a => !ignoresTraces(p.levels, a));
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
      ...unknown.map(id => `${allergenChoiceLabel(ALLERGENS.find(a => a.id === id)) || id}: kan ikke afgøres`),
    ];
    const status = (danger.length > 0 || customMatches.length > 0) ? "danger"
      : (warning.length > 0 || dietFails.length > 0 || eNumberMatches.length > 0 || unknown.length > 0) ? "warn"
      : "safe";
    return { ...p, status, reasons, danger, warning, ignoredTraces, unknown, customMatches, dietFails, eNumberMatches };
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
  const main = danger.length <= maxNames ? `Allergi-advarsel for ${danger.join(", ")}` : manyText;
  return warn.length ? `${main} · advarsel for ${warn.join(", ")}` : main;
}

// Statuslinje-tekst, når ingen har en allergi-advarsel, men mindst én profil har en
// advarsel (F5-7, 6. okt. 2026): samme ord som resultatsidens computeTopStatus, så et
// produkt med spor også hedder "Kan indeholde spor" i listerne og aldrig "sikkert".
export function profileWarnLabel(results) {
  const warn = (results || []).filter(r => r.status === "warn");
  if (warn.length === 0) return null;
  if (warn.some(r => (r.warning || []).length > 0)) return "Kan indeholde spor";
  if (warn.some(r => (r.dietFails || []).length > 0 || (r.eNumberMatches || []).length > 0)) return "Passer ikke til dine valg";
  return "Kan ikke vurderes";
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

// Scanner-forsidens dynamiske tekster (4. okt. 2026, Bjørn): forklaringen og
// profilvælgeren taler til den aktuelle situation — brugeren selv, én anden
// person eller flere. Ukendte id'er (fx en fjernet profil) tælles ikke med.
// Returnerer { chip, intro }: chip til "Tjekker for: …", intro til teksten
// under hilsenen. "Passer til" konsekvent, som profileMatchLabel.
export function scanTargetCopy(activeProfiles, family) {
  const known = new Set(["me", ...(family || []).map(m => m.id)]);
  const ids = [...new Set((activeProfiles || []).filter(id => known.has(id)))];
  const self = { chip: "Dig", intro: "Scan et produkt og se straks, om det passer til dine allergier og præferencer." };
  if (ids.length === 0 || (ids.length === 1 && ids[0] === "me")) return self;
  if (ids.length === 1) {
    const first = ((family || []).find(m => m.id === ids[0])?.name || "").trim().split(/\s+/)[0];
    if (!first) return { chip: "1 person", intro: "Scan et produkt og se straks, om det passer til den valgte person." };
    return { chip: first, intro: `Scan et produkt og se straks, om det passer til ${first}.` };
  }
  return { chip: `${ids.length} personer`, intro: "Scan et produkt og se straks, om det passer til de valgte personer." };
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
export function categorizeProductFindings({ matchedDanger, matchedWarning, ignoredTraces, customAllergenMatches, matchedENumbers, dietResults }) {
  const lookup = (ids, severity) => (ids || [])
    .map(id => {
      const a = ALLERGENS.find(x => x.id === id);
      return a ? { id, label: a.label, type: a.type, severity } : null;
    })
    .filter(Boolean);
  const direct = lookup(matchedDanger, "yes");
  const traces = lookup(matchedWarning, "traces");
  return {
    // Rødt (allergi-advarsel) er kun for direkte indhold; spor er gult (traceMatches), og ignorerede spor er kun info
    allergyMatches: direct.filter(x => x.type === "allergi"),
    intoleranceMatches: direct.filter(x => x.type === "intolerance"),
    traceMatches: traces,
    ignoredTraceMatches: lookup(ignoredTraces, "traces_ignored"),
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
export function computeTopStatus({ hasSufficientData, allergyMatches, intoleranceMatches, traceMatches, customMatches, eNumberMatches, dietFails }) {
  const healthNames = [...(customMatches || []), ...(allergyMatches || []), ...(intoleranceMatches || [])].map(m => m.label);
  if (healthNames.length > 0) {
    return { level: "danger", icon: "warning", headline: "Allergi-advarsel", names: healthNames };
  }
  if ((traceMatches || []).length > 0) {
    return { level: "warn", icon: "warning", headline: "Kan indeholde spor", names: traceMatches.map(m => m.label) };
  }
  const preferenceNames = [...(eNumberMatches || []), ...(dietFails || []).map(d => d.label)];
  if (preferenceNames.length > 0) {
    return { level: "warn", icon: "warning", headline: "Passer ikke til dine valg", names: preferenceNames };
  }
  if (!hasSufficientData) {
    return { level: "unknown", icon: "info", headline: "Kan ikke vurderes", names: [] };
  }
  return { level: "safe", icon: "check", headline: "Ingen advarsler fundet", names: [] };
}

// ─── PRODUKT → INDKØBSLISTE-MATCH ────────────────────────────────────────────
// Finder varen på en liste, der er det samme som produktet (købt eller ej).
// Match sker på EAN og produkt-id, aldrig kun på navn, så "Harboe Cola" på listen
// genkendes som "Cola" på produktsiden. Kun fritekst-varer uden EAN/produkt-id
// (fx en brugerskrevet "Mælk") matches på navnetekst (≥3 tegn, begge veje).
// Bruges af ResultScreen til at vælge mellem "Tilføj", "Markér som købt" og "Købt",
// og af addToList til at undgå dubletter.
export function findProductOnList(listItems, product) {
  const items = listItems || [];
  if (items.length === 0 || !product) return null;
  const code = product.code || product.ean || null;
  const pid = product.id || product.product_id || null;
  let hit = code ? items.find(i => i.ean && i.ean === code) : null;
  if (!hit && pid) hit = items.find(i => i.product_id && i.product_id === pid);
  if (!hit && !code && !pid) {
    const name = (product.name || "").toLowerCase().trim();
    if (name.length >= 3) {
      hit = items.find(i => {
        if (i.ean || i.product_id) return false;
        const itemName = (i.name || "").toLowerCase().trim();
        return itemName.length >= 3 && (name.includes(itemName) || itemName.includes(name));
      });
    }
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

function clearTraceLog() {
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
const PASSWORD_MIN_LENGTH = 10;
// Hjælpetekst under feltet (vises kun, mens der ikke er en fejl) og den korte fejltekst, når kravene ikke er opfyldt
export const PASSWORD_REQUIREMENTS_TEXT = "Mindst 10 tegn med store og små bogstaver og mindst ét tal.";
export const PASSWORD_REQUIREMENTS_ERROR = "Brug mindst 10 tegn med store og små bogstaver og mindst ét tal.";

function passwordProblems(pw) {
  const p = pw || "";
  const missing = [];
  if (!/[a-zæøå]/.test(p)) missing.push("et lille bogstav");
  if (!/[A-ZÆØÅ]/.test(p)) missing.push("et stort bogstav");
  if (!/[0-9]/.test(p)) missing.push("et tal");
  return { tooShort: p.length < PASSWORD_MIN_LENGTH, length: p.length, missing };
}

// Kort, situationsbestemt fejltekst: tom adgangskode, eller (når der er skrevet noget) ét krav-sætning. Tom streng = i orden.
export function passwordErrorText(pw) {
  if (!pw) return "Indtast en adgangskode.";
  const { tooShort, missing } = passwordProblems(pw);
  return tooShort || missing.length ? PASSWORD_REQUIREMENTS_ERROR : "";
}

// Produktnavn i normal formatering: et navn skrevet udelukkende med STORE BOGSTAVER (fx aflæst fra emballagen) vises som "Chokobær".
// Navne med blandet case røres ikke.
export function normalizeProductName(name) {
  const n = (name || "").trim();
  if (!n) return "";
  const letters = n.replace(/[^A-Za-zÆØÅæøåÉéÜü]/g, "");
  if (letters.length < 2 || letters !== letters.toUpperCase()) return n;
  const lower = n.toLocaleLowerCase("da-DK");
  return lower.charAt(0).toLocaleUpperCase("da-DK") + lower.slice(1);
}

// Kornsorter med gluten, der står direkte i ingredienslisten (ikke i en "kan indeholde spor af"-sætning), til tagget "Gluten (havre, byg)"
// under "Andre deklarerede allergener". Hvede er ikke med (det er et eget allergen med eget tag).
export function glutenCerealsIn(text) {
  const direct = (text || "").toLowerCase().split(/kan indeholde|may contain/)[0];
  /** @type {[string, RegExp][]} */
  const cereals = [
    ["rug", /\brug|rugmel|\brye\b|secale/],
    ["byg", /\bbyg|perlebyg|barley|hordeum/],
    ["havre", /havre|\boats?\b|avena/],
    ["spelt", /spelt|dinkel/],
  ];
  return cereals.filter(([, re]) => re.test(direct)).map(([name]) => name);
}

// ─── "VIDSTE DU, AT …" (scanner-forsiden, 4. okt. 2026) ─────────────────────
// Vælger dagens tip blandt godkendte tips fra Allergileksikonet (knowledge_base.tips) — aldrig frit genereret tekst.
// entries: [{ slug, allergen_ids, tips: [..] }]. allergenIds: allergener for dem, der tjekkes for.
// Relevante tips (opslagets allergen_ids rammer et valgt allergen) vises to ud af tre dage og roterer dag for dag;
// den tredje dag (og når intet er relevant) vises et generelt tip (opslag uden allergen_ids). Tips for allergener,
// ingen har valgt, vises ikke. Samme dag = samme tip, så kortet ikke skifter, mens man bruger appen.
export function pickDailyTip(entries, allergenIds, dayNumber) {
  const chosen = new Set(allergenIds || []);
  const all = [];
  for (const e of entries || []) {
    const ids = (e.allergen_ids || []).filter(Boolean);
    for (const text of e.tips || []) {
      const t = (text || "").trim();
      if (t) all.push({ slug: e.slug, text: t, allergenIds: ids });
    }
  }
  all.sort((a, b) => (a.slug + a.text).localeCompare(b.slug + b.text));
  const relevant = all.filter(t => t.allergenIds.some(id => chosen.has(id)));
  const general = all.filter(t => t.allergenIds.length === 0);
  const day = Math.max(0, Math.floor(dayNumber || 0));
  let pool = relevant.length > 0 && (day % 3 !== 2 || general.length === 0) ? relevant : general;
  if (pool.length === 0) pool = relevant;
  if (pool.length === 0) return null;
  // Relevante tips tælles kun på deres egne dage, så rotationen går gennem alle emner i rækkefølge.
  const step = pool === relevant && general.length > 0 ? day - Math.floor((day + 1) / 3) : day;
  return pool[step % pool.length];
}

// Lokalt dagsnummer (skifter ved lokal midnat, ikke UTC).
export function localDayNumber(date = new Date()) {
  return Math.floor((date.getTime() - date.getTimezoneOffset() * 60000) / 86400000);
}

// ─── HISTORIK: SAML GENTAGNE SCANNINGER (5. okt. 2026, Bjørn) ───────────────
// Samler identiske scanninger til én historikpost med et antal (`__count`), så Historik ikke fyldes med
// ens poster. Kun visningen ændres; databasen beholder hver scanning. `list` er nyest først (som API'et).
// Fundne produkter samles kun, når de står lige efter hinanden og har SAMME: produkt (EAN, ellers
// produkt-ID; aldrig kun navnet), bruger, valgte personer (rækkefølge ligegyldig), resultat og allergen-
// flag (ændrede produktdata giver en ny post), og når der højst er `windowMs` mellem to scanninger i
// gruppen. "Ikke fundet" samles som før pr. stregkode og bruger uanset tid (ingen data at skelne på).
// Søgning kan senere lægges ovenpå uden at ændre dette.
const HISTORY_GROUP_WINDOW_MS = 30 * 60 * 1000;

const historyTime = h => new Date(h.scanned_at || h.timestamp || 0).getTime();
const historyProductKey = h => {
  const ean = (h.ean_scanned || h.code || "").toString().trim();
  if (ean) return `ean:${ean}`;
  const pid = h.product_id || h.products?.id;
  return pid ? `id:${pid}` : null;
};
const stableJson = v => {
  if (Array.isArray(v)) return `[${v.map(stableJson).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${stableJson(v[k])}`).join(",")}}`;
  return JSON.stringify(v ?? null);
};
const historySignature = h => [
  historyProductKey(h),
  h.user_id || "",
  [...new Set(h.active_profiles || [])].sort().join(","),
  h.result || h.status || "",
  stableJson(h.flags_triggered || {}),
].join("|");

export function groupHistoryDuplicates(list, { windowMs = HISTORY_GROUP_WINDOW_MS } = {}) {
  const result = [];
  const notFoundByKey = new Map();
  let open = null; // senest åbne gruppe af fundne produkter
  for (const h of list || []) {
    const isNF = (h.result || h.status) === "not_found";
    const key = historyProductKey(h);
    if (isNF && key) {
      open = null; // en anden scanning imellem bryder rækken af ens fundne produkter
      const nfKey = `${key}|${h.user_id || ""}`;
      const existing = notFoundByKey.get(nfKey);
      if (existing) { existing.__count++; continue; }
      const group = { ...h, __count: 1 };
      notFoundByKey.set(nfKey, group);
      result.push(group);
      continue;
    }
    if (!key) { open = null; result.push({ ...h, __count: 1 }); continue; }
    const sig = historySignature(h);
    const t = historyTime(h);
    if (open && open.sig === sig && open.oldest - t <= windowMs && t <= open.oldest) {
      open.group.__count++;
      open.oldest = t;
      continue;
    }
    const group = { ...h, __count: 1 };
    open = { sig, oldest: t, group };
    result.push(group);
  }
  return result;
}
