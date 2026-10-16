// @ts-check
// Ren logik til produktadministrationen: allergenstatus, validering og verificeringsregler. Ændrer aldrig databasens værdier (yes/traces/no/unknown); kun visning og kontrol.
// Princip: manglende allergendata er UKENDT, aldrig "nej". "Ikke påvist" kræver en registreret ingrediensliste og er ikke en garanti. Navnet alene afgør aldrig allergenindhold.
import { ALLERGEN_KEYWORDS } from "../../supabase/functions/_shared/allergenKeywords.js";

/** @typedef {"unknown"|"yes"|"traces"|"no"} FlagState */
export const FLAG_STATES = /** @type {FlagState[]} */ (["unknown", "yes", "traces", "no"]);

export const FLAG_META = /** @type {Record<FlagState, { label: string, tone: "neutral"|"red"|"amber"|"green", help: string }>} */ ({
  unknown: { label: "Ukendt", tone: "neutral", help: "Der er ingen eller for få oplysninger. EatSafe viser \"kan ikke vurderes\". Dette er standard, når data mangler." },
  yes: { label: "Indeholder", tone: "red", help: "Allergenet står i ingredienslisten eller er dokumenteret på anden måde." },
  traces: { label: "Kan indeholde spor", tone: "amber", help: "Producenten angiver spor eller krydskontaminering (\"kan indeholde\")." },
  no: { label: "Ikke påvist", tone: "green", help: "Ingredienslisten er registreret, og allergenet er ikke nævnt i den. Det er ikke en garanti for, at produktet er sikkert." },
});

/** Visningstilstand for ét allergen. Manglende, tomme og ukendte værdier er "unknown"; ældre sandt/falsk læses som ja/nej uden at ændre det gemte. @param {any} flags @param {string} id @returns {FlagState} */
export function flagState(flags, id) {
  const v = flags ? flags[id] : undefined;
  if (v === "yes" || v === true || v === "true") return "yes";
  if (v === "traces") return "traces";
  if (v === "no" || v === false || v === "false") return "no";
  return "unknown";
}

/** Er der en registreret ingrediensliste, der kan danne grundlag for "Ikke påvist"? @param {string|null|undefined} text */
export function hasIngredients(text) {
  const t = String(text ?? "").trim();
  return t.length >= 3 && /\p{L}/u.test(t);
}
/** Meget kort liste (sandsynligvis ufuldstændig). @param {string|null|undefined} text */
export const ingredientsLookShort = (text) => hasIngredients(text) && String(text).trim().length < 15;

/** Må "Ikke påvist" vælges for dette produkt? @param {string|null|undefined} ingredients */
export const canMarkNotDetected = (ingredients) => hasIngredients(ingredients);

// ── Navn og ingredienser mod registrerede allergener (kun advarsler, aldrig automatik) ───────────────────────────────────────
/** Ord i produktnavnet, der tyder på et allergen. Bruges KUN til at markere til manuel kontrol. */
const NAME_HINTS = /** @type {Array<[RegExp, string, string]>} */ ([
  [/\b(skyr|yoghurt|yogurt|kefir|kvark|fløde|flødeost|mælk|smør|ost)\b/i, "maelkeallergi", "mælk"],
  [/\b(mayonnaise|remoulade|æg)\b/i, "aeg", "æg"],
  [/\b(jordnød\w*|peanut\w*)\b/i, "jordnoedder", "jordnødder"],
  [/\b(mandel\w*|hasselnød\w*|valnød\w*|cashew\w*|pistacie\w*)\b/i, "noedder", "nødder"],
  [/\b(soja\w*|tofu)\b/i, "soja", "soja"],
  [/\b(sesam\w*|tahin\w*)\b/i, "sesam", "sesam"],
  [/\b(laks|torsk|tun|sild|makrel|fisk\w*)\b/i, "fisk", "fisk"],
  [/\b(rejer|reje|krabbe\w*|hummer)\b/i, "skaldyr", "skaldyr"],
  [/\b(hvede\w*)\b/i, "hvede", "hvede"],
]);

/** Ordgrænse-regel som motoren: ord på højst 4 tegn skal stå alene; længere ord må indgå i et andet ord. @param {string} text @param {string} kw */
function mentions(text, kw) {
  const k = kw.toLowerCase();
  if (!k) return false;
  const esc = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = k.length >= 5 ? new RegExp(esc, "u") : new RegExp(`(^|[^\\p{L}])${esc}($|[^\\p{L}])`, "u");
  if (!re.test(text)) return false;
  // "laktosefri", "uden laktose": nævnelsen er en negation og tæller ikke
  if (new RegExp(`${esc}\\s*-?\\s*fri|uden\\s+${esc}|free\\s+from\\s+${esc}|${esc}[- ]free`, "u").test(text)) return false;
  return true;
}

/** @typedef {{ id: string, label: string, kind: "name"|"ingredients", hint: string }} Conflict */

/** Allergener sat til "Ikke påvist", hvor navnet eller ingredienslisten tyder på noget andet. Kun til manuel kontrol. @param {{ name?: string, ingredients_text?: string, allergen_flags?: any }} p @param {Array<{ id: string, label: string }>} allergens @returns {Conflict[]} */
export function findConflicts(p, allergens) {
  /** @type {Conflict[]} */
  const out = [];
  const name = String(p.name || "").toLowerCase();
  const ing = String(p.ingredients_text || "").toLowerCase();
  for (const a of allergens) {
    if (flagState(p.allergen_flags, a.id) !== "no") continue;
    const fromName = NAME_HINTS.find(([re, id]) => id === a.id && re.test(name));
    if (fromName) out.push({ id: a.id, label: a.label, kind: "name", hint: fromName[2] });
    const kws = /** @type {Record<string, string[]>} */ (ALLERGEN_KEYWORDS)[a.id] || [];
    const hit = hasIngredients(ing) ? kws.find((k) => mentions(ing, k)) : undefined;
    if (hit) out.push({ id: a.id, label: a.label, kind: "ingredients", hint: hit });
  }
  return out;
}

// ── EAN ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** Kontrolciffer for GTIN-8/12/13/14. @param {string} ean */
export function gtinChecksumOk(ean) {
  const d = ean.split("").map(Number);
  const check = d.pop();
  let sum = 0;
  d.reverse().forEach((n, i) => { sum += n * (i % 2 === 0 ? 3 : 1); });
  return (10 - (sum % 10)) % 10 === check;
}
/** @param {string|null|undefined} ean @returns {{ ok: boolean, text: string }} */
export function eanCheck(ean) {
  const e = String(ean ?? "").trim();
  if (!e) return { ok: false, text: "EAN mangler." };
  if (!/^\d+$/.test(e)) return { ok: false, text: "EAN indeholder andet end cifre." };
  if (![8, 12, 13, 14].includes(e.length)) return { ok: false, text: "EAN har ikke et standardformat (8, 12, 13 eller 14 cifre). Det kan være en intern kode." };
  if (!gtinChecksumOk(e)) return { ok: false, text: "EAN's kontrolcifre passer ikke." };
  return { ok: true, text: "" };
}

// ── Validering og verificering ───────────────────────────────────────────────────────────────────────────────────────────────
/**
 * Fejl blokerer gemning; advarsler gør det ikke, men skal ses.
 * @param {{ name?: string, ean?: string, ingredients_text?: string, allergen_flags?: any, verified_status?: string }} p @param {Array<{ id: string, label: string }>} allergens
 */
export function validateProduct(p, allergens) {
  /** @type {string[]} */ const errors = [];
  /** @type {string[]} */ const warnings = [];
  if (!String(p.name || "").trim()) errors.push("Produktnavn skal udfyldes.");
  if (String(p.name || "").length > 200) errors.push("Produktnavnet er for langt (højst 200 tegn).");
  const ing = p.ingredients_text;
  if (!hasIngredients(ing)) warnings.push("Ingredienslisten mangler. Allergener kan ikke dokumenteres som ikke påvist, og produktet vurderes som \"kan ikke vurderes\".");
  else if (ingredientsLookShort(ing)) warnings.push("Ingredienslisten er meget kort. Tjek, at den er komplet.");
  const noWithoutIng = allergens.filter((a) => flagState(p.allergen_flags, a.id) === "no");
  if (!hasIngredients(ing) && noWithoutIng.length) warnings.push(`${noWithoutIng.length} allergen${noWithoutIng.length === 1 ? "" : "er"} står som ikke påvist uden en ingrediensliste.`);
  const conflicts = findConflicts(p, allergens);
  for (const c of conflicts) warnings.push(c.kind === "name"
    ? `Navnet tyder på ${c.hint}, men ${c.label.toLowerCase()} er sat til ikke påvist. Kontrollér manuelt.`
    : `Ingredienslisten nævner "${c.hint}", men ${c.label.toLowerCase()} er sat til ikke påvist. Kontrollér manuelt.`);
  return { errors, warnings, conflicts };
}

/** Hvad forhindrer, at produktet markeres som verificeret? Tom liste = må verificeres. @param {Parameters<typeof validateProduct>[0]} p @param {Array<{ id: string, label: string }>} allergens */
export function verifyBlockers(p, allergens) {
  /** @type {string[]} */ const out = [];
  if (!hasIngredients(p.ingredients_text)) out.push("Ingredienslisten mangler.");
  else if (ingredientsLookShort(p.ingredients_text)) out.push("Ingredienslisten er for kort til at kunne verificeres.");
  const unknown = allergens.filter((a) => flagState(p.allergen_flags, a.id) === "unknown");
  if (unknown.length) out.push(`${unknown.length} allergen${unknown.length === 1 ? " er" : "er er"} stadig ukendt.`);
  if (findConflicts(p, allergens).length) out.push("Der er uafklarede konflikter mellem navn, ingredienser og allergener.");
  return out;
}

// ── Danske betegnelser (databaseværdierne er uændrede) ──────────────────────────────────────────────────────────────────────
export const VERIFIED_LABELS = /** @type {Record<string, string>} */ ({ unverified: "Ikke verificeret", partial: "Delvist verificeret", verified: "Verificeret", auto_verified: "Automatisk verificeret" });
export const VERIFIED_TONE = /** @type {Record<string, "green"|"amber"|"neutral">} */ ({ verified: "green", auto_verified: "green", partial: "amber", unverified: "neutral" });
export const QUALITY_LABELS = /** @type {Record<string, string>} */ ({ high: "Høj", medium: "Middel", low: "Lav", pending: "Afventer", verified: "Håndrettet" });
export const SOURCE_LABELS = /** @type {Record<string, string>} */ ({ katalog: "Katalog", open_food_facts: "Open Food Facts", off_import: "Open Food Facts", user: "Indsendt af bruger", producer: "Producent" });
export const METHOD_LABELS = /** @type {Record<string, string>} */ ({ keyword: "Nøgleord", "keyword+claude": "Nøgleord og AI", off_tags: "Open Food Facts-mærker", "off_tags+keyword": "Open Food Facts og nøgleord" });
export const labelOr = (/** @type {Record<string,string>} */ map, /** @type {string|null|undefined} */ v, fallback = "Ikke angivet") => (v ? map[v] ?? v : fallback);

/** Er formularen ændret i forhold til det indlæste? @param {any} orig @param {any} cur */
export function productDirty(orig, cur) {
  if (!orig || !cur) return false;
  const norm = (/** @type {any} */ p) => JSON.stringify([String(p.name || "").trim(), String(p.brand || "").trim(), String(p.category || "").trim(), String(p.ingredients_text || "").trim(), p.verified_status || "unverified", p.allergen_flags || {}]);
  return norm(orig) !== norm(cur);
}

/** Kun de felter, der er ændret (så en samtidig rettelse af andre felter ikke overskrives). @param {any} orig @param {any} cur */
export function changedFields(orig, cur) {
  /** @type {Record<string, any>} */ const out = {};
  for (const k of ["name", "brand", "category", "ingredients_text", "verified_status"]) {
    if (String(orig[k] ?? "").trim() !== String(cur[k] ?? "").trim()) out[k] = typeof cur[k] === "string" ? cur[k].trim() : cur[k];
  }
  if (JSON.stringify(orig.allergen_flags || {}) !== JSON.stringify(cur.allergen_flags || {})) out.allergen_flags = cur.allergen_flags || {};
  return out;
}

// ── Produktoversigten: søgning, filtre og sortering (kører på serveren) ─────────────────────────────────────────────────────
export const PRODUCT_PAGE = 50;
export const PRODUCT_SORTS = /** @type {Array<[string, string]>} */ ([["updated_desc", "Senest opdateret"], ["updated_asc", "Ældst opdateret"], ["name_asc", "Navn A–Å"], ["name_desc", "Navn Å–A"]]);
export const PRODUCT_CATEGORIES = ["Kolonial", "Drikkevarer", "Snacks & slik", "Kød & fisk", "Mejeri & æg", "Brød & bagværk", "Frost", "Frugt & grønt", "Færdigretter", "Andet"];
/** Kildefiltre: værdi, visningsnavn og de databaseværdier, der hører til. */
export const SOURCE_FILTERS = /** @type {Array<[string, string, string[]]>} */ ([
  ["katalog", "Katalog", ["katalog"]], ["open_food_facts", "Open Food Facts", ["open_food_facts", "off_import"]], ["user", "Indsendt af bruger", ["user"]], ["producer", "Producent", ["producer"]],
]);
export const STATUS_FILTERS = /** @type {Array<[string, string]>} */ ([["unverified", "Ikke verificeret"], ["partial", "Delvist verificeret"], ["verified", "Verificeret"], ["auto_verified", "Automatisk verificeret"]]);

/** Fjerner tegn med betydning i PostgREST-filtre. @param {string} q */
export const cleanProductSearch = (q) => String(q || "").replace(/[,()*:\\"%]/g, " ").replace(/\s+/g, " ").trim();

/**
 * Forespørgsel til produktlisten. Søgning på navn, brand og EAN (cifre søger i begyndelsen af EAN), filtre og sortering kører på serveren, så resultaterne gælder hele tabellen.
 * @param {{ q?: string, category?: string, source?: string, status?: string, sort?: string, offset?: number, limit?: number }} o
 */
export function buildProductsQuery(o) {
  const { q = "", category = "", source = "", status = "", sort = "updated_desc", offset = 0, limit = PRODUCT_PAGE + 1 } = o;
  const parts = ["select=id,ean,name,brand,category,source,verified_status,updated_at"];
  const s = cleanProductSearch(q);
  if (s) {
    const enc = encodeURIComponent(s);
    const ors = [`name.ilike.*${enc}*`, `brand.ilike.*${enc}*`];
    if (/^\d+$/.test(s)) ors.push(`ean.like.${enc}*`);
    parts.push(`or=(${ors.join(",")})`);
  }
  if (category) parts.push(`category=eq.${encodeURIComponent(category)}`);
  const src = SOURCE_FILTERS.find((x) => x[0] === source);
  if (src) parts.push(`source=in.(${src[2].join(",")})`);
  if (status) parts.push(`verified_status=eq.${encodeURIComponent(status)}`);
  const order = { updated_desc: "updated_at.desc.nullslast,id.desc", updated_asc: "updated_at.asc.nullsfirst,id.asc", name_asc: "name.asc,id.asc", name_desc: "name.desc,id.desc" }[sort] || "updated_at.desc.nullslast,id.desc";
  parts.push(`order=${order}`, `limit=${limit}`);
  if (offset) parts.push(`offset=${offset}`);
  return parts.join("&");
}
