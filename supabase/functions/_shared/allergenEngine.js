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
  // ASCII-skrivemåde uden æ ("skummetMAELKspulver", set i butiksdata) (runde 2, 16. okt. 2026)
  "maelk",
]);

// Bogstavklasse til ordgrænser (æøå og tyske tegn; teksten er altid små bogstaver her).
export const L = "a-zæøåäöüß";

// Nøgleord på 5 tegn eller mere matches som understreng (6. okt. 2026, K1):
// danske sammensætninger har allergenet både først og sidst ("FuldkornsHVEDE",
// "Mandelflager", "Torskefilet"). Undtagelser er ord, der er egne ord og ikke
// skal matche inde i andre. Korte nøgleord (4 tegn eller færre) matcher som hele ord,
// med de eksplicitte sammensætningsregler i SHORT_PATTERNS nedenfor.
// "latte" (ikke "lattergas") og "sigtemel" (ikke "rugsigtemel", som er ren rug) skal stå som hele ord (16. okt. 2026).
const NO_SUBSTRING = new Set(["emmer", "snegle", "snegl", "molke", "ising", "ørred", "silli", "kerma", "kalaa", "kalan", "pesto", "latte", "sigtemel"]);

export function isSubstringKeyword(kw) {
  return SUBSTRING_KEYWORDS.has(kw) || (kw.length >= 5 && !NO_SUBSTRING.has(kw));
}

// Korte nøgleord, der også må stå som led i sammensatte ord (regex-udtryk for
// selve ordet, uden ordgrænser). "æg" som slutled ("SkalÆG", "TØRÆG", "Frilandsæg")
// og som start ("æggepulver"); korn med kendte forled ("Fuldkornsbyg"); fisk/skaldyr
// som første led ("Laksefilet", "Rejesalat").
export const SHORT_PATTERNS = {
  // … men ikke ord på "-læg" ("pålæg", "anlæg", "tillæg"): "Produceret på et anlæg, der også …" gav æg = ja (runde 2, 16. okt. 2026)
  "æg": `(?!(?:på|an|til|ind|op|ud|be|af|for|ved|om|ned|over|sammen|hen|fore|frem|under)læg(?:get|gene|s)?(?![${L}]))[${L}]*æg|ægge[${L}]*`,
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
  // "…fisk" som sidste led (rødfisk, hvidfisk, fladfisk, tunfisk); ikke "fiskefri" (16. okt. 2026, falsk-negativ-gennemgang)
  // … og som første led ("FISKEROGN", "fiskefrikadeller", "fiskesovs"); ikke "fiskeri" (runde 2, 16. okt. 2026: 7 rogn-produkter stod med fisk = nej)
  "fisk": `[${L}]*fisk|fiske(?!(?:fri|ri)(?![${L}]))[${L}]*`,
  // Tofu og miso som første led ("Tofuskiver", "Misopasta") (16. okt. 2026)
  "tofu": `tofu[${L}]*`,
  "miso": `miso[${L}]*`,
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
// En parentes starter en ny delliste ("uden gluten (hvedestivelse)", "uden tilsat sukker (sødmælk, …)"), og en tankestreg med mellemrum
// adskiller led ("Ingen tilsat sukker - sødmælk"). Gælder kun negationen, ikke spor-sætningen (16. okt. 2026, falsk-negativ-gennemgang).
const NEGATION_ONLY_BREAKS = "()[]–—";
// "Indeholder ikke gluten" er en negation; "ikke" alene er det IKKE ("Ikke egnet til personer med mælkeallergi" nævner mælk med rette) (runde 2).
const NEGATION_WORDS = new RegExp(`(^|[^${L}])(uden|ingen|ohne|sans|without|fri for|free from|free of|frei von|utan|uten|zonder|ilman|indeholder ikke|inneholder ikke|innehåller inte|contains no|does not contain|enthält keine?|bevat geen|ne contient pas)(?=[^${L}]|$)`);
// "Fri for: gluten, mælk, æg" / "Uden: …": en negationsliste med kolon gælder hele sætningen, ikke kun leddet før kolonet (runde 2, 16. okt. 2026).
const NEGATION_LIST_HEAD = new RegExp(`^\\s*(?:allergener\\s*[:\\-]?\\s*)?(?:fri for|uden|ingen|free from|without|frei von|ohne|utan|uten|sans|zonder)\\s*:`);
const NEGATION_CUT = new RegExp(`(^|[^${L}])(med|men|but|with)(?=[^${L}]|$)`, "g");
const NEGATION_AFTER = new RegExp(`^(?:e|s)?[\\s-]?(?:fri(?:t|e)?|frei|free|ton|tonta|vrij)(?![${L}])`);
// "LAKTOSE OG GLUTENFRI", "mælke- og glutenfri.": fri-ordet efter "og" gælder også ordet før, men kun når det afslutter leddet
// ("sennep og laktosefri mælk" negerer IKKE sennep) (16. okt. 2026).
const NEGATION_AFTER_AND = new RegExp(`^(?:e|s)?-?\\s+(?:og|and|und|och|&)\\s+[${L}]+-?(?:fri(?:t|e)?|free|frei)\\s*(?:[.,;:!?)\\]\\n]|$)`);
const UNDER_ZERO_AFTER = /^[\s(]*(?:under|<|mindre end|less than)\s*0/;

function segmentStart(lower, idx) {
  for (let i = idx - 1; i >= 0; i--) {
    const c = lower[i];
    if (SEGMENT_BREAKS.includes(c) || NEGATION_ONLY_BREAKS.includes(c)) return i + 1;
    if (c === "-" && lower[i - 1] === " " && lower[i + 1] === " ") return i + 1;
  }
  return 0;
}

// "Kan ikke garantere fri for nødder" / "cannot guarantee free from nuts" er en sporadvarsel, ikke en negation (16. okt. 2026,
// falsk-negativ-gennemgang). Står en garanti-forbeholdsfrase i samme sætning før ordet, ophæves negationen, og ordet bliver spor (TRACE_WORDS).
const NO_GUARANTEE = /ikke\s+(?:kan\s+)?garanter|garanterer\s+ikke|ingen\s+garanti|kan\s+ikke\s+udelukke|cannot\s+guarantee|can\s*not\s+guarantee|can'?t\s+guarantee|not\s+guaranteed|no\s+guarantee|kann\s+nicht\s+garantier|keine\s+garantie|kan\s+inte\s+garanter|kan\s+ikke\s+garanter/;
function sentenceBefore(lower, idx) {
  for (let i = idx - 1; i >= 0; i--) if (".!?\n".includes(lower[i])) return lower.slice(i + 1, idx);
  return lower.slice(0, idx);
}

export function isNegatedAt(lower, start, end) {
  const sentence = sentenceBefore(lower, start);
  if (NO_GUARANTEE.test(sentence)) return false;
  if (NEGATION_LIST_HEAD.test(sentence)) return true;
  let before = lower.slice(segmentStart(lower, start), start);
  let m, cutAt = 0;
  NEGATION_CUT.lastIndex = 0;
  while ((m = NEGATION_CUT.exec(before))) cutAt = m.index + m[0].length;
  before = before.slice(cutAt);
  if (NEGATION_WORDS.test(before)) return true;
  const rest = lower.slice(end, end + 24);
  return NEGATION_AFTER.test(rest) || NEGATION_AFTER_AND.test(lower.slice(end)) || UNDER_ZERO_AFTER.test(rest);
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
  `(^|[^${L}])(spor|spår|sporen|spuren|traces?(?!\\s+(?:elements?|minerals?|metals?))|may contain|can contain|kan indeholde|kann|samme fabrik|same facility|samme produktionsudstyr|samme anlæg|same equipment|samme linje|same line|kan innehålla|kan inneholde|kan bevatten|kan sisältää|saattaa sisältää|pieniä määriä|peut contenir|peuvent contenir|puede contener|pueden contener|può contenere|puo contenere|pode conter|trazas|tracce|ikke garantere|ikke garanteres|ikke garanteret|garanterer ikke|ingen garanti|ikke udelukke|cannot guarantee|can't guarantee|not guaranteed|kan inte garantera)(?=[^${L}]|$)`
);
const TRACE_PRODUCED = new RegExp(`(fremstillet|produceret|produced|manufactured)[^.!?\\n]*(også|also|samme|same|shared|delt)`);

// En ny ingrediensoverskrift afslutter en sporsætning, også uden punktum: "Kan indeholde spor af nødder Ingredienser: hvedemel" (16. okt. 2026,
// falsk-negativ-gennemgang; ellers blev direkte hvede til spor og skjult for brugere med "kun ved ingrediens").
const INGREDIENT_HEADER = /(?:ingredienser|ingrediens|ingredients|ingrediënten|zutaten|ingrédients|ingredientes|ingredienti|ainesosat|ingredienser|innehåll)\s*:|@ingredienser/g;
export function isTracesAt(lower, start) {
  let from = 0;
  for (let i = start - 1; i >= 0; i--) if (SENTENCE_BREAKS.includes(lower[i])) { from = i + 1; break; }
  let before = lower.slice(from, start);
  INGREDIENT_HEADER.lastIndex = 0;
  let h, cut = -1;
  while ((h = INGREDIENT_HEADER.exec(before))) cut = h.index + h[0].length;
  if (cut >= 0) before = before.slice(cut);
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
    // Bløde bindestreger og orddeling ved linjeskift ("Jord\u00adnødder", "Hvede-\nmel"), og "jord nødder"/"jord-nødder" som to led
    // (16. okt. 2026, falsk-negativ-gennemgang: jordnødder blev kun til "nødder", ikke jordnødder).
    .replace(/\u00ad/g, "")
    .replace(/([a-zæøåäöü])-[ \t]*\r?\n[ \t]*([a-zæøåäöü])/gi, "$1$2")
    .replace(/(^|[^a-zæøåäöü])jord[\s-]+(n[øö][dt])/gi, "$1jord$2")
    // Semulje/couscous af ris, majs eller hirse er ikke hvede (hvede-listen har "semulje", "couscous")
    .replace(/(ris|majs|hirse|boghvede|quinoa)[\s-]*(semulje|semolina|couscous)\w*/gi, "$1")
    // "Kan indeholde spor afæg" (manglende mellemrum, set i butiksdata): ellers matcher "æg" aldrig som eget ord
    .replace(/\bspor\s+af(?=[a-zæøå])/gi, "spor af ")
    // Forkortelser med punktum må ikke afslutte en sporsætning ("Kan indeholde spor af mælk (inkl. laktose)") (16. okt. 2026)
    .replace(/(^|[^a-zæøå])(inkl|ekskl|bl\.\s?a|f\.\s?eks|evt|incl|z\.\s?b|bzw|ggf)\./gi, "$1$2")
    // "glutenfri havregryn" er certificeret glutenfri havre: ingen glutenmatch (kun havre; hvede/spelt røres ikke, de er hvedeallergi)
    .replace(/gluten[\s-]?fri\w*\s+havre\w*/gi, " ")
    // "glutenfri øl" (bygmalt med fjernet gluten) er ikke gluten; "øl" som ingrediens er det (runde 2, 16. okt. 2026)
    .replace(/gluten[\s-]?fri\w*\s+(øl|beer|bier)\b/gi, " ")
    // "Laktoseindhold under 0,01 %" skal læses som "laktose under 0,01 %" (runde 2)
    .replace(/laktose-?indhold(?:\s+på)?/gi, "laktose")
    // Ord der indeholder et allergenord som understreng uden at være det (understrengs-matchning, 6. okt. 2026):
    // boghvede/buckwheat er ikke hvede, kanelsnegl er ikke et bløddyr, fløde/yoghurt af kokos er ikke mælk,
    // "cream of tartar" og kakao-/sheasmør er ikke mejeri.
    .replace(/bog[\s-]?hvede\w*/gi, " ")
    .replace(/buck[\s-]?wheat\w*/gi, " ")
    .replace(/kanel[\s-]?snegl\w*/gi, " ")
    .replace(/cream of tartar/gi, " ")
    .replace(/(cocoa|cacao|shea|kakao)[\s-]*butter\w*/gi, " ")
    // Nøddesmør og græskar: "peanutbutter", "Erdnussbutter", "almond butter", "butternut" er ikke mælk ("butter" matcher som understreng) (runde 2)
    .replace(/(peanut|erdnuss|erdnuß|almond|cashew|hazelnut|pistachio|nut|pinda)[\s-]*butter\w*/gi, "$1")
    .replace(/butternut\w*/gi, " ")
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
  noedder: /jord-?nød\w*|jord-?noed\w*|jord-?nøt\w*|pean[øo]t\w*|cacahuet\w*|arachid\w*|erdn[uü]ss\w*|peanut\w*|groundnut\w*|arachis\w*|muskat\w*|kokos-?nød\w*|jord-?nöt\w*|muskot-?nöt\w*|kokos-?nöt\w*|maa-?pähkin\w*|kookos-?pähkin\w*|arachide\w*|cacahu[eè]te\w*|pinda\w*|kokosnoot\w*|noix de (?:coco|muscade)/g,
  // Solsikke-/rapslecithin er ikke soja (kilden er dokumenteret), også som sammensat ord "solsikkelecithin" (10. okt. 2026).
  soja: /(?:solsikke|raps|sunflower|rapeseed)\s*-?\s*le[ck]i?th?i?n\w*/g,
};

// Lecithin uden kilde kan være soja, men er ikke bekræftet → spor, ikke direkte.
const SOY_FREE_LECITHIN = /(solsikke|raps|sunflower|rapeseed)\s*-?\s*le[ck]i?th?i?n/;
const WEAK_SOY_WORDS = new Set(["lecithin", "lecitin", "lécithine", "lécithines", "lesitiini"]);
// Ord, der KAN rumme allergenet uden at det er sikkert: giver spor, ikke direkte (runde 2, 16. okt. 2026). Worcestersauce er
// klassisk lavet på ansjoser, men findes også uden fisk (og indeholder sammensætningen fisk, skal det stå i dens egen liste).
// Caesar-dressing ligeså. Et direkte fiskeord i teksten vinder stadig.
const WEAK_WORDS = {
  soja: WEAK_SOY_WORDS,
  fisk: new Set(["worcester", "worcestershire sauce", "worcestershiresauce", "caesar dressing"]),
};

// Laktosefri (runde 2, 16. okt. 2026): "laktosefri" som selvstændig påstand ("LAKTOSEFRI.", "Mælk, laktase. Laktosefri") gælder hele
// produktet. Som tillægsord ("laktosefri fløde") gælder det kun det ord: "Kiks (skummetmælkspulver). Fyld: laktosefri fløde" har laktose.
const LACTOSE_FREE_RE = /laktose[\s-]?fri\w*|laktos[\s-]?fri\w*|lactose[\s-]?free|laktosefrei|laktoositon/g;
const DAIRY_NEXT_WORD = new RegExp(`^\\s+[${L}]*(?:mælk|maelk|milk|fløde|flode|cream|yoghurt|yogurt|skyr|kvark|quark|ost|oste|smør|butter|kefir|mjölk|melk|milch|sahne|grädde|fløte|kaas|lait|crème|mascarpone|ricotta|valle|whey|kasein|casein)`);
// "Lavt laktoseindhold", "laktosereduceret": ikke laktosefri, men reduceret → spor (orange), ikke nej (runde 2).
const LOW_LACTOSE_RE = /lavt laktose|laktosereduceret|laktosereduseret|low[\s-]?lactose|lactose[\s-]?reduced|låglaktos|laktosfattig|laktosearm/;
// Står ordet i en parentes efter "laktosefri X (" (dellisten for den laktosefri ingrediens), dækker tillægsordet også dellisten.
function lactoseFreeBeforeParen(lower, start) {
  let depth = 0;
  for (let i = start - 1; i >= 0; i--) {
    const c = lower[i];
    if (c === ")" || c === "]") depth++;
    else if (c === "(" || c === "[") {
      if (depth > 0) { depth--; continue; }
      const seg = lower.slice(segmentStart(lower, i), i);
      LACTOSE_FREE_RE.lastIndex = 0;
      const hit = LACTOSE_FREE_RE.test(seg);
      LACTOSE_FREE_RE.lastIndex = 0;
      return hit;
    }
    else if (".!?\n".includes(c)) return false;
  }
  return false;
}
function lactoseFreeScope(lower) {
  LACTOSE_FREE_RE.lastIndex = 0;
  let m, found = false, adjectiveOnly = true;
  while ((m = LACTOSE_FREE_RE.exec(lower))) {
    found = true;
    if (!DAIRY_NEXT_WORD.test(lower.slice(m.index + m[0].length, m.index + m[0].length + 40))) adjectiveOnly = false;
  }
  return found ? (adjectiveOnly ? "local" : "global") : null;
}

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

        if (WEAK_WORDS[allergen]?.has(kw)) {
          if (status === "no") status = "traces";
          continue;
        }
        // Tillægsordet "laktosefri" foran ordet negerer kun laktose for netop det led (se lactoseFreeScope).
        if (allergen === "laktose") {
          LACTOSE_FREE_RE.lastIndex = 0;
          const local = LACTOSE_FREE_RE.test(lower.slice(segmentStart(lower, start), start)) || lactoseFreeBeforeParen(lower, start);
          LACTOSE_FREE_RE.lastIndex = 0;
          if (local) continue;
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
    // E322 (lecithin) er kun et sojaspor, når kilden er ukendt: står der solsikke- eller rapslecithin, er kilden dokumenteret (10. okt. 2026).
    if (base === "e322" && SOY_FREE_LECITHIN.test(String(rawText || "").toLowerCase())) continue;
    const current = flags[mapping.allergen];
    // Opgrader kun hvis det forbedrer sikkerheden (no → traces → yes)
    if (mapping.certainty === "yes" && current !== "yes") {
      flags[mapping.allergen] = "yes";
    } else if (mapping.certainty === "traces" && current === "no") {
      flags[mapping.allergen] = "traces";
    }
  }

  // ── Override: laktosefri produkter ─────────────────────────────────
  // "Laktosefri mælk" har stadig mælkeprotein (maelkeallergi=yes) men INGEN laktose. En selvstændig påstand ("Laktosefri.",
  // "laktose under 0,01 %") gælder hele produktet. Står "laktosefri" kun som tillægsord ("laktosefri fløde"), er det allerede
  // negeret for det led i løkken ovenfor, og andre mælkeingredienser beholder laktose; er der tilsat laktase, bliver det spor.
  const scope = lactoseFreeScope(lower);
  const hasLactase = /\blaktase\b|laktaseenzym|lactase/.test(lower);
  if (scope === "global" || (/laktose\s*(?::\s*)?(under|<|mindre|max)/.test(lower) && !LOW_LACTOSE_RE.test(lower))) {
    flags["laktose"] = "no";
  } else if (flags.laktose === "yes" && (LOW_LACTOSE_RE.test(lower) || (hasLactase && (scope === "local" || !/laktose|lactose|mælkesukker/.test(lower))))) {
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
// Bredt reserve-tjek (8. okt. 2026, E4): en lang ingrediensliste uden ét eneste fund (hverken ja eller spor) læses også af Claude,
// fordi "ingen fund" på en lang liste oftest er et ord motoren ikke kender. Claude kan kun HÆVE et flag (den forsigtigste værdi
// vinder), så det kan ikke gøre et resultat mindre sikkert. Få produkter rammer reglen (nye produkter og natlig reparse), så
// døgnloftene i apiUsage.ts holder. `flags` er nøgleordsmotorens resultat; uden flags gælder kun de gamle regler.
export const LONG_LIST_MIN_CHARS = 200;
export function hasNoFindings(flags) {
  return !!flags && Object.values(flags).every((v) => v === "no");
}
export function shouldUseClaudeFallback(text, flags) {
  const lower = text.toLowerCase();
  if (flags && text.length >= LONG_LIST_MIN_CHARS && hasNoFindings(flags)) return true;
  if (looksNonDanish(text)) return true;
  if (/uden|ingen|ohne|fri for|free|laktosefri|under 0/.test(lower)) return true;
  const commaCount = (text.match(/,/g) || []).length;
  if (commaCount > 15) return true;
  const eNumbers = lower.match(/e\d{3}/g) || [];
  const unknownE = eNumbers.some(e => !ENUMBER_ALLERGENS[e]);
  if (unknownE && eNumbers.length > 3) return true;
  return false;
}

// Samler gamle og nye allergenflag, så resultatet aldrig bliver mindre forsigtigt end det gamle (G4, 14. okt. 2026):
// nej → spor → ja. "unknown" rangerer som "no" (et nyt "no" sænker aldrig et gammelt "unknown"). Bruges af auto-reparse og
// af godkendelse af indsendelser, så håndrettede og deklarerede værdier ikke kan blive overskrevet nedad.
const MERGE_RANK = { unknown: 0, no: 0, traces: 1, yes: 2 };
export function mergeFlagsUpward(oldFlags, freshFlags) {
  const old = oldFlags || {};
  const fresh = freshFlags || {};
  const next = { ...old };
  for (const key of Object.keys(fresh)) {
    const o = old[key];
    const n = fresh[key];
    if (o === undefined || (MERGE_RANK[n] ?? 0) > (MERGE_RANK[o] ?? 0)) next[key] = n;
  }
  return next;
}
