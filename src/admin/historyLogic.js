// @ts-check
// Ren logik til Ændringshistorik: danske feltnavne, handlinger, aktør og kilde, før/efter-sammenligning (herunder pr. allergen) og forespørgsel. Opfinder aldrig værdier:
// hvad der ikke er gemt, returneres som tomt og vises som "ikke gemt".
import { ALLERGENS } from "../constants.jsx";
import { flagState, FLAG_META } from "./productsLogic.js";

export const HISTORY_PAGE = 50;
export const ACTIONS = /** @type {Array<[string, string]>} */ ([["", "Alle"], ["created", "Oprettet"], ["updated", "Opdateret"], ["deleted", "Slettet"]]);
export const ACTION_LABEL = /** @type {Record<string, string>} */ ({ created: "Oprettet", updated: "Opdateret", deleted: "Slettet" });
export const ACTION_PILL = /** @type {Record<string, string>} */ ({ created: "admin-pill-green", updated: "admin-pill-amber", deleted: "admin-pill-red" });
export const PERIODS = /** @type {Array<[string, string]>} */ ([["", "Hele perioden"], ["1", "Seneste døgn"], ["7", "Seneste 7 dage"], ["30", "Seneste 30 dage"]]);
export const SORTS = /** @type {Array<[string, string]>} */ ([["newest", "Nyeste først"], ["oldest", "Ældste først"]]);

export const FIELD_LABELS = /** @type {Record<string, string>} */ ({
  name: "Produktnavn", brand: "Mærke", ingredients_text: "Ingrediensliste", allergen_flags: "Allergenoplysninger", all: "Alle relevante felter",
  category: "Kategori", subcategory: "Underkategori", verified_status: "Verificering", allergen_quality: "Allergenkvalitet", allergen_source_method: "Analysemetode",
  image_url: "Produktbillede", label_image_url: "Etiketbillede", source: "Datakilde", ean: "EAN", nutrition: "Næringsindhold", country: "Land", verified: "Verificeret",
  canonical_ean: "Hovedprodukt", variant_label: "Variantnavn", ingredients_verified_at: "Ingredienser verificeret", barcode_scan_count: "Antal scanninger",
});
/** @param {string} f */
export const fieldLabel = (f) => FIELD_LABELS[f] || f;

/** Hvem lavede ændringen. Kun det, kilden dokumenterer: en registreret administrator, ellers "ikke registreret". @param {any} row */
export function actorOf(row) {
  if (row.actor_name) return { kind: "admin", label: row.actor_name };
  if (row.actor_id) return { kind: "admin", label: "Administrator (konto slettet)" };
  return { kind: "unknown", label: "Ikke registreret" };
}
/** Ændringskilde ud fra hvilken log posten kommer fra. @param {any} row */
export const sourceOf = (row) => (row.source === "legacy" ? "Godkendelse af brugerindsendelse (ældre registrering)" : "Administratorredigering");

/** Er værdien et allergenobjekt (id → status)? @param {any} v */
const isFlags = (v) => !!v && typeof v === "object" && !Array.isArray(v);

/**
 * Allergen for allergen: kun dem, der er ændret. Manglende nøgle læses som Ukendt (samme regel som produktformularen).
 * @param {any} fra @param {any} til @returns {Array<{ id: string, label: string, before: string, after: string, kind: "added"|"changed"|"removed" }> | null} null hvis værdierne ikke er allergenobjekter
 */
export function allergenDiff(fra, til) {
  if (!isFlags(fra) && !isFlags(til)) return null;
  const a = isFlags(fra) ? fra : {}; const b = isFlags(til) ? til : {};
  const ids = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  /** @type {Array<{ id: string, label: string, before: string, after: string, kind: "added"|"changed"|"removed" }>} */ const out = [];
  for (const id of ids) {
    const s0 = flagState(a, id); const s1 = flagState(b, id);
    if (s0 === s1) continue;
    out.push({ id, label: ALLERGENS.find((x) => x.id === id)?.label || id, before: FLAG_META[s0].label, after: FLAG_META[s1].label, kind: s0 === "unknown" ? "added" : s1 === "unknown" ? "removed" : "changed" });
  }
  return out;
}

/** Tilføjet, ændret eller fjernet for et almindeligt felt. @param {any} fra @param {any} til */
export function changeKind(fra, til) {
  const empty = (/** @type {any} */ v) => v === null || v === undefined || v === "";
  if (empty(fra) && !empty(til)) return "added";
  if (!empty(fra) && empty(til)) return "removed";
  return "changed";
}
export const KIND_LABEL = /** @type {Record<string, string>} */ ({ added: "Tilføjet", changed: "Ændret", removed: "Fjernet" });

/** Visningstekst for en gemt værdi. @param {any} v */
export function valueText(v) {
  if (v === null || v === undefined || v === "") return "Ingen værdi";
  if (typeof v === "string") return v;
  if (typeof v === "boolean") return v ? "Ja" : "Nej";
  try { return JSON.stringify(v); } catch { return String(v); }
}

/** Indeholder ændringen allergenoplysninger? @param {any} row */
export function touchesAllergens(row) {
  if (Array.isArray(row.fields) && row.fields.includes("allergen_flags")) return true;
  return row.source === "legacy" && /allergen/i.test(String(row.legacy_fields || ""));
}

/** Kort beskrivelse til oversigten. @param {any} row */
export function describe(row) {
  if (row.action === "created") return row.note || "Produktet blev oprettet";
  if (row.action === "deleted") return "Produktet blev slettet";
  const names = Array.isArray(row.fields) ? row.fields : String(row.legacy_fields || "").split(",").map((s) => s.trim()).filter((s) => s && s !== "none");
  if (names.length === 0) return "Rettet (felter ikke registreret)";
  return `Rettede ${names.map(fieldLabel).join(", ")}`;
}
/** Er der gemt før/efter-værdier? @param {any} row */
export const hasDetails = (row) => Array.isArray(row.changes) && row.changes.length > 0;

/** Parametre til databasefunktionen. @param {{ q?: string, action?: string, days?: string, allergen?: boolean, sort?: string }} f @param {number} offset */
export function historyParams(f, offset = 0) {
  return {
    p_search: String(f.q || "").trim() || null, p_action: f.action || null, p_days: f.days ? Number(f.days) : null, p_allergen: !!f.allergen,
    p_sort: f.sort === "oldest" ? "oldest" : "newest", p_limit: HISTORY_PAGE + 1, p_offset: offset,
  };
}
