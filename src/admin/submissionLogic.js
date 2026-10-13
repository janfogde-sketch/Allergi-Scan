// @ts-nocheck
// Ren logik til Indsendelser: hvor allergenoplysningerne ligger, og hvordan de må omtales. Manglende data er aldrig "Ingen".
import { PRODUCT_ALLERGENS } from "../constants.jsx";

const norm = (v) => {
  if (v === true || v === "yes" || v === "ja") return "yes";
  if (v === false || v === "no" || v === "nej") return "no";
  if (v === "traces" || v === "trace" || v === "spor") return "traces";
  if (v === "unknown") return "unknown";
  return undefined;
};

/**
 * Allergenflag fra en indsendelse som { id: "yes"|"no"|"traces" }. To former findes i databasen: flagene ligger direkte i ai_parsed_data
 * (nuværende app) eller indlejret i ai_parsed_data.allergen_flags (ældre indsendelser). Begge læses; kun gyldige allergen-id'er medtages,
 * og værdier, der ikke er ja/nej/spor, tæller som ikke angivet.
 */
export function submissionAllergenFlags(s) {
  const parsed = (s && s.ai_parsed_data) || {};
  const nested = parsed.allergen_flags && typeof parsed.allergen_flags === "object" ? parsed.allergen_flags : {};
  const out = {};
  for (const a of PRODUCT_ALLERGENS) {
    const v = norm(parsed[a.id] !== undefined ? parsed[a.id] : nested[a.id]);
    if (v === "yes" || v === "no" || v === "traces") out[a.id] = v;
  }
  return out;
}

/** Rettelser af billede/næring rører ikke allergener; en rettelse af ingredienslisten beregner dem på ny ved godkendelse. */
export function allergenRelevance(s) {
  if (s && s.type === "edit") {
    const t = s.ai_parsed_data && s.ai_parsed_data.edit_type;
    return t === "ingredients" ? "recalculated" : "not_applicable";
  }
  return "submitted";
}

const ID_ORDER = PRODUCT_ALLERGENS.map((a) => a.id);

/**
 * Hvordan en indsendelses allergenoplysninger vises.
 * state: found | traces | none | unverified | partial | missing | recalculated | not_applicable
 *   found/traces: mindst ét allergen er angivet med ja/spor; none: alle er angivet som nej og indsendelsen er behandlet;
 *   unverified: alle angivet som nej, men indsendelsen afventer (kun indsenderens oplysning); partial: nogle allergener er ikke vurderet;
 *   missing: ingen allergenoplysninger overhovedet.
 * allergens/intolerances holdes adskilt (laktose er en intolerance, ikke en allergi).
 */
export function allergenSummary(s) {
  const rel = allergenRelevance(s);
  if (rel === "not_applicable") return { state: "not_applicable", text: "Ikke relevant for denne rettelse", allergens: [], intolerances: [], traces: [] };
  if (rel === "recalculated" && Object.keys(submissionAllergenFlags(s)).length === 0) {
    return { state: "recalculated", text: s.status === "pending" ? "Beregnes ud fra den nye ingrediensliste ved godkendelse" : "Rettelse af ingrediensliste", allergens: [], intolerances: [], traces: [] };
  }
  const flags = submissionAllergenFlags(s);
  const labelOf = (id) => PRODUCT_ALLERGENS.find((a) => a.id === id);
  const yes = ID_ORDER.filter((id) => flags[id] === "yes").map(labelOf);
  const traces = ID_ORDER.filter((id) => flags[id] === "traces").map(labelOf);
  const allergens = yes.filter((a) => a.type !== "intolerance").map((a) => a.label);
  const intolerances = yes.filter((a) => a.type === "intolerance").map((a) => a.label);
  const traceLabels = traces.map((a) => a.label);
  const known = Object.keys(flags).length;
  if (known === 0) return { state: "missing", text: "Allergenoplysninger mangler", allergens, intolerances, traces: traceLabels };
  if (yes.length > 0) return { state: "found", text: "", allergens, intolerances, traces: traceLabels };
  if (traceLabels.length > 0) return { state: "traces", text: "", allergens, intolerances, traces: traceLabels };
  if (known < ID_ORDER.length) return { state: "partial", text: "Ikke verificeret: nogle allergener er ikke vurderet", allergens, intolerances, traces: traceLabels };
  if (s && s.status === "pending") return { state: "unverified", text: "Ingen angivet af indsender, ikke verificeret", allergens, intolerances, traces: traceLabels };
  return { state: "none", text: "Ingen registrerede allergener", allergens, intolerances, traces: traceLabels };
}

/** Én linje til kort og tabel. */
export function allergenLine(summary) {
  const parts = [];
  if (summary.allergens.length) parts.push(`Allergener: ${summary.allergens.join(", ")}`);
  if (summary.intolerances.length) parts.push(`Intolerance: ${summary.intolerances.join(", ")}`);
  if (summary.traces.length) parts.push(`Spor: ${summary.traces.join(", ")}`);
  return parts.length ? parts.join(" · ") : summary.text;
}

// Ord i produktnavnet, der antyder et allergen. Kun en påmindelse til admin: navnet er aldrig dokumentation for indhold eller fravær.
const NAME_HINTS = {
  maelkeallergi: ["ost", "oste", "cheese", "mælk", "milk", "fløde", "cream", "smør", "butter", "yoghurt", "yogurt", "flødeis"],
  aeg: ["æg", "egg", "eggs", "mayonnaise", "remoulade"],
  jordnoedder: ["jordnød", "jordnødder", "peanut", "peanuts"],
  noedder: ["nød", "nødder", "nut", "nuts", "mandel", "mandler", "almond", "hasselnød", "hazelnut", "cashew", "valnød", "pistacie"],
  soja: ["soja", "soy", "soya", "tofu"],
  fisk: ["fisk", "fish", "tun", "tuna", "laks", "salmon", "torsk"],
  skaldyr: ["rejer", "shrimp", "prawn", "krebs", "hummer", "skaldyr"],
  sesam: ["sesam", "sesame", "tahini"],
  sennep: ["sennep", "mustard"],
  selleri: ["selleri", "celery"],
  hvede: ["hvede", "wheat"],
};

/** Allergener, som produktnavnet nævner, men som indsendelsen ikke angiver som ja/spor. Tom liste = ingen uoverensstemmelse. */
export function nameAllergenMismatch(s) {
  const name = String((s && s.ai_parsed_data && s.ai_parsed_data.name) || (s && s.product_name) || "").toLowerCase();
  if (!name) return [];
  const tokens = name.split(/[^a-zæøåäöü]+/).filter(Boolean);
  const flags = submissionAllergenFlags(s);
  const out = [];
  for (const [id, words] of Object.entries(NAME_HINTS)) {
    const hit = tokens.find((t) => words.includes(t));
    if (hit && flags[id] !== "yes" && flags[id] !== "traces") {
      const a = PRODUCT_ALLERGENS.find((x) => x.id === id);
      if (a) out.push({ id, label: a.label, word: hit });
    }
  }
  return out;
}

export const SUBMISSION_STATUS_LABELS = { pending: "Afventer", approved: "Godkendt", rejected: "Afvist" };
export const SUBMISSION_ACTION_LABELS = { pending: "Gennemgå", approved: "Se detaljer", rejected: "Se detaljer" };
export const submissionTypeLabel = (s) => (s && s.type === "edit" ? "Rettelse" : "Nyt produkt");
