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
  // E270 (mælkesyre) er fjernet 2. okt. 2026: syren er ikke et mælkeallergen og gav falske mælke-advarsler.
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
  // Sulfit-karamel (E150b, E150d) er en farve med sulfitrester: svovl-spor, ikke direkte svovl (F2, 6. okt. 2026).
  "e150b": { allergen: "svovl", certainty: "traces" },
  "e150d": { allergen: "svovl", certainty: "traces" },
  "e1105": { allergen: "aeg", certainty: "yes" },      // Lysozym — udvundet af æggehvide
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
  // "natriumdisulfit", "kaliumbisulfit" m.fl. (2. okt. 2026)
  "sulfit",
  // Kornsorter med gluten i sammensatte ord: "HAVREgryn", "fuldkornsSPELTmel", "BYGMALTEKSTRAKT" (2. okt. 2026). Frontenden matcher
  // ord over 4 tegn som understreng; her skal de stå eksplicit.
  "havre", "spelt", "maltekstrakt", "bygmalt", "bygmel", "bygflager", "perlebyg",
  // Tyske kerneord (30. sept. 2026) — tysk sammensætter ord ("Vollmilch-
  // pulver", "Weizenmehl", "Haselnusskerne"), så de skal matches som
  // understreng for at blive fundet.
  "milch", "weizen", "roggen", "gerste", "hafer", "sahne", "käse",
  "haselnuss", "haselnüsse", "erdnuss", "erdnüsse", "walnuss", "walnüsse",
  "fisch", "garnelen", "sellerie", "senf",
]);

// Bogstavklasse til ordgrænser (æøå og tyske tegn; teksten er altid små bogstaver her).
const L = "a-zæøåäöüß";

// Nøgleord på 5 tegn eller mere matches som understreng (6. okt. 2026, K1):
// danske sammensætninger har allergenet både først og sidst ("FuldkornsHVEDE",
// "Mandelflager", "Torskefilet"). Undtagelser er ord, der er egne ord og ikke
// skal matche inde i andre. Korte nøgleord (4 tegn eller færre) matcher som hele ord,
// med de eksplicitte sammensætningsregler i SHORT_PATTERNS nedenfor.
const NO_SUBSTRING = new Set(["emmer", "snegle", "snegl", "molke", "ising", "ørred", "silli", "kerma", "kalaa", "kalan", "pesto"]);

export function isSubstringKeyword(kw) {
  return SUBSTRING_KEYWORDS.has(kw) || (kw.length >= 5 && !NO_SUBSTRING.has(kw));
}

// Korte nøgleord, der også må stå som led i sammensatte ord (regex-udtryk for
// selve ordet, uden ordgrænser). "æg" som slutled ("SkalÆG", "TØRÆG", "Frilandsæg")
// og som start ("æggepulver"); korn med kendte forled ("Fuldkornsbyg"); fisk/skaldyr
// som første led ("Laksefilet", "Rejesalat").
const SHORT_PATTERNS = {
  "æg": `[${L}]*æg|ægge[${L}]*`,
  "rug": `(?:fuldkorns?|hel)?rug`,
  "byg": `(?:fuldkorns?|hel|vinter|vår)?byg`,
  "laks": `[${L}]*laks(?:e[${L}]*)?`,
  "sild": `sild(?:e[${L}]*)?`,
  "reje": `reje[${L}]*`,
  // "tomatpesto", "basilikumpesto", men ikke "tablethjælpestof" (7. okt. 2026, E2)
  "pesto": `[${L}]*pesto(?:er)?`,
  "sej": `[${L}]*sej`,
  // Svensk/norsk hvede som led i sammensætninger ("fullkornsvete", "vetemjöl"), men ikke "bovete"/"vetenskap" (6. okt. 2026, G1)
  "vete": `(?:fullkorns?|hel|durum)?vete(?:mjöl|stärkelse|gluten|kli|fiber|kim|korn|protein|flingor)?`,
};

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Alle forekomster af et nøgleord som [start, slut]-par. Erstatter "første
// forekomst": en negeret/spor-forekomst må ikke skjule en direkte forekomst længere henne.
export function findOccurrences(lower, keyword) {
  const kw = keyword.toLowerCase();
  const out = [];
  if (isSubstringKeyword(kw)) {
    let i = lower.indexOf(kw);
    while (i !== -1) { out.push([i, i + kw.length]); i = lower.indexOf(kw, i + kw.length); }
    return out;
  }
  const pat = SHORT_PATTERNS[kw] || escapeRe(kw);
  const re = new RegExp(`(^|[^${L}0-9])(${pat})(?=[^${L}0-9]|$)`, "g");
  let m;
  while ((m = re.exec(lower))) {
    const start = m.index + m[1].length;
    out.push([start, start + m[2].length]);
    re.lastIndex = Math.max(start + m[2].length, re.lastIndex);
  }
  return out;
}

// Position for første match (bevaret for tests og eksterne kaldere).
export function matchIndex(lower, kw) {
  const occ = findOccurrences(lower, kw);
  return occ.length ? occ[0][0] : -1;
}

// Negation (6. okt. 2026, K2): kun inden for ét kommasegment. Intet fast tegnvindue,
// så "Chokolade uden sukker, hvedemel" ikke fjerner hvede. "Free from"-klausulen
// slutter også ved komma. Efter nøgleordet tæller "-fri"/"free" kun som del af
// samme ord eller som næste ord ("mælkefri", "lactose free"), aldrig "freeze".
// Kolon afslutter også et led: "Uden mørkt skind og ben Panering (33%): HVEDEMEL" er ikke "uden hvede" (6. okt. 2026, G1).
const SEGMENT_BREAKS = ",;.!?:\n";
const NEGATION_WORDS = new RegExp(`(^|[^${L}])(uden|ingen|ohne|sans|without|fri for|free from|free of|frei von|utan|uten|zonder|ilman)(?=[^${L}]|$)`);
const NEGATION_CUT = new RegExp(`(^|[^${L}])(med|men|but|with)(?=[^${L}]|$)`, "g");
const NEGATION_AFTER = new RegExp(`^(?:e|s)?[\\s-]?(?:fri|frei|free|ton|tonta|vrij)(?![${L}])`);
const UNDER_ZERO_AFTER = /^[\s(]*(?:under|<|mindre end|less than)\s*0/;

function segmentStart(lower, idx) {
  for (let i = idx - 1; i >= 0; i--) if (SEGMENT_BREAKS.includes(lower[i])) return i + 1;
  return 0;
}

export function isNegatedAt(lower, start, end) {
  let before = lower.slice(segmentStart(lower, start), start);
  let m, cutAt = 0;
  NEGATION_CUT.lastIndex = 0;
  while ((m = NEGATION_CUT.exec(before))) cutAt = m.index + m[0].length;
  before = before.slice(cutAt);
  if (NEGATION_WORDS.test(before)) return true;
  const rest = lower.slice(end, end + 24);
  return NEGATION_AFTER.test(rest) || UNDER_ZERO_AFTER.test(rest);
}

// Negation-detektion for første forekomst: "laktosefri", "uden mælk", "mælkefri", "under 0,01%"
export function isNegated(text, keyword) {
  const lower = text.toLowerCase();
  const occ = findOccurrences(lower, keyword);
  if (!occ.length) return false;
  return isNegatedAt(lower, occ[0][0], occ[0][1]);
}

// Ordgrænse-match: undgår at "æg" matcher inde i "lægemiddel"
export function wordBoundaryMatch(haystack, needle) {
  const pattern = new RegExp(`(^|[^a-zæøåA-ZÆØÅ0-9])${escapeRe(needle)}([^a-zæøåA-ZÆØÅ0-9]|$)`, "i");
  return pattern.test(haystack);
}

// Samlet match: understreng for lange nøgleord, ordgrænse (med sammensætningsregler) for korte
export function keywordMatch(haystack, keyword) {
  return findOccurrences(haystack.toLowerCase(), keyword).length > 0;
}

// Spor-kontekst (6. okt. 2026, K3): signalet skal stå i SAMME sætning FØR nøgleordet
// ("Kan indeholde spor af A, B, C" dækker hele opremsningen). Sætningsgrænser er
// punktum, udråbs-/spørgsmålstegn og linjeskift. "spor" gælder kun som helt ord
// ("sporstoffer" er ikke spor), og "fremstillet/produceret" kun i en egentlig
// advarselsfrase om fælles anlæg ("fremstillet på et anlæg, der også ...").
const SENTENCE_BREAKS = ".!?\n";
const TRACE_WORDS = new RegExp(
  `(^|[^${L}])(spor|spår|sporen|spuren|traces?(?!\\s+(?:elements?|minerals?|metals?))|may contain|can contain|kan indeholde|kann|samme fabrik|same facility|samme produktionsudstyr|samme anlæg|same equipment|samme linje|same line|kan innehålla|kan inneholde|kan bevatten|kan sisältää|saattaa sisältää|pieniä määriä|peut contenir|peuvent contenir)(?=[^${L}]|$)`
);
const TRACE_PRODUCED = new RegExp(`(fremstillet|produceret|produced|manufactured)[^.!?\\n]*(også|also|samme|same|shared|delt)`);

export function isTracesAt(lower, start) {
  let from = 0;
  for (let i = start - 1; i >= 0; i--) if (SENTENCE_BREAKS.includes(lower[i])) { from = i + 1; break; }
  const before = lower.slice(from, start);
  return TRACE_WORDS.test(before) || TRACE_PRODUCED.test(before);
}

export function isTracesContext(text, keyword) {
  const lower = text.toLowerCase();
  const occ = findOccurrences(lower, keyword);
  if (!occ.length) return false;
  return isTracesAt(lower, occ[0][0]);
}

// Ord der indeholder et allergenord uden at være det allergen (2. okt. 2026):
// plantedrikke ("kokosmælk" → "kokos"), mælkesyre/mælkesyrekultur (ingen mælk),
// kilde-angivet lecithin ("solsikke lecithin" er ikke soja) og "ris mel" som to
// ord (ellers matcher "mel" under hvede).
// Sulfit-ammoniak-karamel (E150d, "ammonieret sulfiteret caramel") er en farve, ikke et sulfit-tilsætningsstof:
// den giver svovl-SPOR, ikke direkte svovl (se analyzeIngredients).
const CARAMEL_SULFITE = /(ammonieret\s+)?sulfiteret(\s+(caramel|karamel)\w*)?|sulfit-?ammoniak-?(caramel|karamel)\w*|ammonium-?sulfit-?(caramel|karamel)\w*|sulphite ammonia caramel/gi;

// HTML-rester fra importerede lister ("salt,<BR>kartoffelstivelse", "&nbsp;"): tags bliver
// skilletegn, entiteter bliver almindelig tekst, så de ikke ændrer ordgrænser (6. okt. 2026, D2).
export function stripHtml(text) {
  return text
    .replace(/<\s*br\s*\/?\s*>/gi, ", ")
    .replace(/<\/?[a-z][^>]*>/gi, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&[a-z]+;|&#\d+;/gi, " ");
}

export function normalizeIngredientText(text) {
  return stripHtml(text)
    // "Kan indeholde spor afæg" (manglende mellemrum, set i butiksdata): ellers matcher "æg" aldrig som eget ord
    .replace(/\bspor\s+af(?=[a-zæøå])/gi, "spor af ")
    // "glutenfri havregryn" er certificeret glutenfri havre: ingen glutenmatch (kun havre; hvede/spelt røres ikke, de er hvedeallergi)
    .replace(/gluten[\s-]?fri\w*\s+havre\w*/gi, " ")
    // Ord der indeholder et allergenord som understreng uden at være det (understrengs-matchning, 6. okt. 2026):
    // boghvede/buckwheat er ikke hvede, kanelsnegl er ikke et bløddyr, fløde/yoghurt af kokos er ikke mælk,
    // "cream of tartar" og kakao-/sheasmør er ikke mejeri.
    .replace(/bog[\s-]?hvede\w*/gi, " ")
    .replace(/buck[\s-]?wheat\w*/gi, " ")
    .replace(/kanel[\s-]?snegl\w*/gi, " ")
    .replace(/cream of tartar/gi, " ")
    .replace(/(cocoa|cacao|shea|kakao)[\s-]+butter/gi, " ")
    .replace(/(kokos|mandel|havre|soja|ris|cashew|ærte|hamp|hasselnød)(mælk|drik|fløde|yoghurt|grädde|fløte)/gi, "$1")
    .replace(/\b(coconut|almond|oat|soy|rice|cashew|hazelnut|pea) milk\b/gi, "$1")
    .replace(/(vegansk\s+)?mælkesyre\w*/gi, " ")
    // Fremmedsprog (6. okt. 2026, G1): mælkesyre og plantedrikke på svensk/norsk, hollandsk, finsk og fransk, kakaosmør, sort/boghvede
    .replace(/mjölk-?syra\w*|mjølk-?syre\w*|melke-?syre\w*|melkzuur\w*|maitohappo\w*|(acides?|ferments?)\s+lactiques?/gi, " ")
    .replace(/(kokos|mandel|havre|haver|soja|ris|rijst|cashew|ärt|hamp|hassel|kookos|kaura|riisi)[\s-]*(mjölk|mjølk|melk|maito|drink|dryck|drank)/gi, "$1")
    .replace(/\blait\s+(?:de|d['’])\s*(coco|soja|riz|amande|avoine|noisette|cajou)/gi, "$1")
    .replace(/(kakao|cacao|kaakao)[\s-]*(smör|smør|boter|voi|beurre)|beurre\s+de\s+(cacao|karité)/gi, " ")
    .replace(/(?:bo|bok)-?h?vete\w*|boekweit\w*|blé\s+noir|sarrasin|tattari\w*/gi, " ")
    .replace(/(tournesol|colza|zonnebloem|solros|auringonkukka)[\s-]*(le[ck]ithin|lecitin|lesitiini)\w*|l[ée]cithines?\s+de\s+(tournesol|colza)/gi, "$1")
    .replace(/\b(solsikke|raps|sunflower|rapeseed)[\s-]*(le[ck]ithin|le[ck]itin)\w*/gi, "$1")
    .replace(CARAMEL_SULFITE, " ")
    .replace(/\b(ris|majs|kokos|mandel|kikærte|tapioka|boghvede|kartoffel|havre|linse|ærte|quinoa|hirse)\s+mel\b/gi, "$1mel");
}

// Ord der aldrig må tælle med i ét bestemt allergen: jordnødder, muskatnød og kokosnød er ikke "nødder" (træ-nødder),
// og de ender på "nødder" (6. okt. 2026, understrengs-matchning; kokosnød er ikke et EU-allergen).
const ALLERGEN_MASKS = {
  noedder: /jord-?nød\w*|peanut\w*|groundnut\w*|arachis\w*|muskat\w*|kokos-?nød\w*|jord-?nöt\w*|muskot-?nöt\w*|kokos-?nöt\w*|maa-?pähkin\w*|kookos-?pähkin\w*|arachide\w*|cacahu[eè]te\w*|pinda\w*|kokosnoot\w*|noix de (?:coco|muscade)/g,
};

// Lecithin uden kilde kan være soja, men er ikke bekræftet → spor, ikke direkte.
const WEAK_SOY_WORDS = new Set(["lecithin", "lecitin", "lécithine", "lécithines", "lesitiini"]);

// Margarine/minarine er ikke i sig selv mælk (7. okt. 2026, E2): plantemargarine er veganske, og
// indeholder en margarine mælk, står mælkeproteinet i dens egen ingrediensliste. Står der
// ingen liste efter ordet ("margarine, salt"), og teksten ikke selv siger plantebaseret/vegansk,
// kan vi ikke vide det og beholder det forsigtige svar (mælk).
const MARGARINE_RE = /(?:margarine|minarine)[a-zæøå]*/g;
const PLANT_BASED_RE = /plantebaseret|vegansk|vegan\b|plantemargarine|vegetabilsk margarine/;
function applyMargarineRule(lower, flags) {
  if (flags.maelkeallergi === "yes") return;
  if (PLANT_BASED_RE.test(lower)) return;
  MARGARINE_RE.lastIndex = 0;
  let m;
  while ((m = MARGARINE_RE.exec(lower))) {
    const start = m.index, end = start + m[0].length;
    if (isNegatedAt(lower, start, end)) continue;
    if (/^\s*(?:\d+[.,]?\d*\s*%\s*[.:(*\[]|[(*\[:])/.test(lower.slice(end, end + 14))) continue; // har egen liste
    if (isTracesAt(lower, start)) { if (flags.maelkeallergi === "no") flags.maelkeallergi = "traces"; continue; }
    flags.maelkeallergi = "yes";
    return;
  }
}

export function analyzeIngredients(rawText) {
  const text = normalizeIngredientText(rawText);
  CARAMEL_SULFITE.lastIndex = 0;
  const hasSulfiteCaramel = CARAMEL_SULFITE.test(rawText);
  const flags = {};
  const lower = text.toLowerCase();

  for (const allergen of ALL_ALLERGENS) {
    const keywords = ALLERGEN_KEYWORDS[allergen] || [];
    const mask = ALLERGEN_MASKS[allergen];
    const hay = mask ? lower.replace(mask, (m) => " ".repeat(m.length)) : lower;
    let status = "no";

    outer:
    for (const keyword of keywords) {
      const kw = keyword.toLowerCase();
      for (const [start, end] of findOccurrences(hay, kw)) {
        // Spring over hvis allergenet er negeret (laktosefri, uden mælk)
        if (isNegatedAt(hay, start, end)) continue;

        // Spor-kontekst tjekkes FØRST og er afgørende — versaler/fed alene
        // (EU-krav 1169/2011 om fremhævning) er IKKE et pålideligt signal for
        // "direkte ingrediens": producenter fremhæver allergen-navnet på
        // PRÆCIS samme måde inde i en "kan indeholde spor af"-advarsel
        // (set i rigtige produkter, 25. sept. 2026). Match fundet uden for en
        // spor-sætning behandles som direkte ingrediens.
        if (isTracesAt(hay, start)) {
          if (status !== "yes") status = "traces";
          continue; // en senere, direkte forekomst skal stadig kunne opgradere til "yes"
        }

        if (allergen === "soja" && WEAK_SOY_WORDS.has(kw)) {
          if (status === "no") status = "traces";
          continue;
        }

        status = "yes";
        break outer; // yes er højeste sikkerhed, stop
      }
    }

    flags[allergen] = status;
  }

  applyMargarineRule(lower, flags);

  if (hasSulfiteCaramel && flags.svovl === "no") flags.svovl = "traces";

  // ── E-nummer detektion ──────────────────────────────────────────────────
  // "E220", "E 220", "E-471", "E472e", "E322(i)": mellemrum, bindestreg og suffiks tillades (6. okt. 2026, F2).
  const eRe = new RegExp(`(?<![${L}0-9])e[\\s-]?(\\d{3,4})([a-z]|\\([ivx]+\\))?(?![0-9])`, "g");
  for (const m of lower.matchAll(eRe)) {
    const base = "e" + m[1];
    const suffixed = m[2] && /^[a-z]$/.test(m[2]) ? base + m[2] : null;
    const mapping = (suffixed && ENUMBER_ALLERGENS[suffixed]) || ENUMBER_ALLERGENS[base];
    if (!mapping) continue;
    const current = flags[mapping.allergen];
    // Opgrader kun hvis det forbedrer sikkerheden (no → traces → yes)
    if (mapping.certainty === "yes" && current !== "yes") {
      flags[mapping.allergen] = "yes";
    } else if (mapping.certainty === "traces" && current === "no") {
      flags[mapping.allergen] = "traces";
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
  } else if (flags.laktose === "yes" && /\blaktase\b|laktaseenzym|lactase/.test(lower) && !/laktose|lactose|mælkesukker/.test(lower)) {
    // Tilsat laktase = laktosereduceret produkt. Ikke garanteret laktosefrit → gult, ikke rødt.
    flags["laktose"] = "traces";
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
// Korte fremmedord, der kun må matche som HELE ord (en stamme som "sel" ville ramme "selleri").
export const FOREIGN_EXACT_WORDS = new Set([
  "lait","sucre","sel","eau","beurre","farine","huile","amidon","ferments","contient","peut","contenir","ingrédients","sirop","œufs","oeufs","œuf","oeuf","blé","fromage","noisettes","arachides",
  "zucchero","latte","farina","sale","burro","uova","olio","acqua","ingredienti","contenere","può",
  "leche","azúcar","harina","sal","huevo","huevos","aceite","agua","trigo","ingredientes",
  "zout","suiker","tarwe","melk","eieren","ingrediënten",
  "mleko","cukier","mąka","sól","woda","jaja","składniki",
]);
export const DANISH_INGREDIENT_STEMS = ["sukker","hvede","mælk","vand","gær","smør","fløde","olie","nødder","mandler","kerner","stivelse","krydderi","æg","rug","byg","havre"];
export function looksNonDanish(text) {
  const words = text.toLowerCase().split(/[^a-zæøåäöüß\u00C0-\u024F:]+/).filter(Boolean);
  if (words.length === 0) return false;
  const danishHits = words.filter(w => DANISH_INGREDIENT_STEMS.some(s => w.startsWith(s) || w.endsWith(s)) || /mel$/.test(w)).length;
  if (danishHits > 0) return false;
  return words.some(w => FOREIGN_EXACT_WORDS.has(w) || FOREIGN_INGREDIENT_STEMS.some(s => w.startsWith(s)));
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
  if (/uden|ingen|ohne|fri for|free|laktosefri|under 0/.test(lower)) return true;
  const commaCount = (text.match(/,/g) || []).length;
  if (commaCount > 15) return true;
  const eNumbers = lower.match(/e\d{3}/g) || [];
  const unknownE = eNumbers.some(e => !ENUMBER_ALLERGENS[e]);
  if (unknownE && eNumbers.length > 3) return true;
  return false;
}
