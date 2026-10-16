// @ts-check
// Ren logik til leksikonadministrationen (knowledge_base): kategorier og felter pr. kategori, slug, lister (chips), kilder, tilknyttede allergener, mangler-kontrol,
// redaktionel status og forespørgsel til listen. Ændrer aldrig fagligt indhold; kun visning og kontrol. Databaseformen (text[] osv.) er uændret.
import { ALLERGENS } from "../constants.jsx";

export const KB_CATEGORIES = /** @type {Array<[string, string]>} */ ([
  ["allergen", "Allergener"], ["e_number", "E-numre"], ["ingredient", "Ingredienser"], ["dish", "Retter og produkter"],
  ["cross_reaction", "Krydsreaktioner"], ["faq", "FAQ"], ["fun_fact", "Sjov viden"], ["diet", "Kost"],
]);
export const KB_CATEGORY_LABEL = /** @type {Record<string, string>} */ (Object.fromEntries(KB_CATEGORIES));
/** Ental til kort og formular. */
export const KB_CATEGORY_SINGULAR = /** @type {Record<string, string>} */ ({
  allergen: "Allergen", e_number: "E-nummer", ingredient: "Ingrediens", dish: "Ret/produkt", cross_reaction: "Krydsreaktion", faq: "FAQ", fun_fact: "Sjov viden", diet: "Kost",
});

export const EDITORIAL = /** @type {Array<[string, string]>} */ ([["draft", "Udkast"], ["pending_review", "Afventer gennemgang"], ["approved", "Godkendt"], ["needs_update", "Skal opdateres"]]);
export const EDITORIAL_LABEL = /** @type {Record<string, string>} */ ({ ...Object.fromEntries(EDITORIAL), "": "Ikke gennemgået" });

/** Felter pr. kategori (ud over titel, emoji, kategori, resumé og kilder, som alle har). Et felt med eksisterende data vises altid, også hvis kategorien ikke bruger det. */
export const KB_FIELDS = /** @type {Record<string, string[]>} */ ({
  allergen: ["description", "health_notes", "status_label", "allergen_ids", "found_in", "alternatives", "diet_tags", "aliases", "tags"],
  e_number: ["description", "health_notes", "allergen_ids", "found_in", "alternatives", "diet_tags", "aliases", "tags"],
  ingredient: ["description", "health_notes", "allergen_ids", "found_in", "alternatives", "diet_tags", "aliases", "tags"],
  dish: ["description", "health_notes", "allergen_ids", "found_in", "alternatives", "diet_tags", "aliases", "tags"],
  cross_reaction: ["description", "health_notes", "status_label", "allergen_ids", "aliases", "tags"],
  faq: ["description", "allergen_ids", "aliases", "tags"],
  fun_fact: ["tags"],
  diet: ["description", "health_notes", "allergen_ids", "diet_tags", "aliases", "tags"],
});
const ALL_FIELDS = ["description", "health_notes", "status_label", "allergen_ids", "found_in", "alternatives", "diet_tags", "aliases", "tags"];

/** Overskrifter, der passer til kategorien. @param {string} category @param {string} field */
export function fieldLabel(category, field) {
  const L = /** @type {Record<string, Record<string, string>>} */ ({
    faq: { title: "Spørgsmål", summary: "Kort svar", description: "Svar", allergen_ids: "Relevante emner" },
    e_number: { title: "E-nummer og navn", summary: "Resumé", description: "Beskrivelse", found_in: "Anvendes i", health_notes: "Anvendelsesbegrænsninger og sundhedsnoter", status_label: "Faglig klassifikation" },
    cross_reaction: { title: "Titel", summary: "Kort forklaring", description: "Beskrivelse", health_notes: "Forbehold", allergen_ids: "Involverede allergener og tilstande", status_label: "Faglig klassifikation" },
  });
  const base = /** @type {Record<string, string>} */ ({
    title: "Titel", summary: "Resumé", description: "Beskrivelse", health_notes: "Sundhedsnoter", status_label: "Faglig klassifikation",
    allergen_ids: "Tilknyttede allergener og tilstande", found_in: "Findes i", alternatives: "Alternativer", diet_tags: "Kost-tags", aliases: "Aliaser", tags: "Søgetags",
  });
  return L[category]?.[field] || base[field] || field;
}

/** Skal feltet vises? Ja hvis kategorien bruger det, eller hvis opslaget allerede har data i det (data skjules aldrig). @param {any} entry @param {string} field */
export function showField(entry, field) {
  if ((KB_FIELDS[entry.category] || ALL_FIELDS).includes(field)) return true;
  const v = entry[field];
  return Array.isArray(v) ? v.length > 0 : !!String(v ?? "").trim();
}

/** Felter med data, der ikke hører til den nye kategori (bruges til advarsel ved kategoriskift). @param {any} entry @param {string} next */
export function categoryChangeLoss(entry, next) {
  const keep = KB_FIELDS[next] || ALL_FIELDS;
  return ALL_FIELDS.filter((f) => !keep.includes(f) && (Array.isArray(entry[f]) ? entry[f].length > 0 : !!String(entry[f] ?? "").trim()));
}

// ── Slug ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** @param {string} text */
export function slugify(text) {
  return String(text || "").toLowerCase().replace(/[æ]/g, "ae").replace(/ø/g, "oe").replace(/å/g, "aa").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
/** Eksisterende slugs er links; kun nye opslag får en slug ud fra titlen. @param {string} text */
export const slugFromTitle = (text) => slugify(text).slice(0, 80);

// ── Lister (chips) ───────────────────────────────────────────────────────────────────────────────────────────────────────────
/** Renser én værdi: sammenpresset mellemrum, ingen tomme, højst 120 tegn. @param {string} v */
export const cleanItem = (v) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
/** Tilføjer uden dubletter (uden hensyn til store/små bogstaver). Returnerer den nye liste og om noget blev tilføjet. @param {string[]} list @param {string} raw */
export function addItem(list, raw) {
  const v = cleanItem(raw);
  if (!v) return { list, added: false, reason: "empty" };
  if (list.some((x) => x.toLowerCase() === v.toLowerCase())) return { list, added: false, reason: "duplicate" };
  return { list: [...list, v], added: true, reason: "" };
}

// ── Kilder (adresser; udgiver afledes af adressen, intet nyt gemmes) ────────────────────────────────────────────────────────
/** @param {string} v @returns {{ ok: boolean, host: string }} */
export function parseSource(v) {
  try {
    const u = new URL(String(v).trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return { ok: false, host: "" };
    return { ok: true, host: u.hostname.replace(/^www\./, "") };
  } catch { return { ok: false, host: "" }; }
}
/** Kilder, der ikke er adresser (ældre fritekst), bevares uændret og vises som tekst. @param {string} v */
export const sourceLabel = (v) => { const p = parseSource(v); return p.ok ? p.host : String(v); };

// ── Tilknyttede allergener og tilstande, delt efter hvad de er ──────────────────────────────────────────────────────────────
/** Id → gruppe ud fra den eksisterende allergenliste: allergier, intolerancer (inkl. cøliaki). Ukendte id'er vises som "Andre" og bevares. @param {string} id */
export function relationGroup(id) {
  const a = ALLERGENS.find((x) => x.id === id);
  if (!a) return "other";
  if (a.id === "coeliaki") return "condition";
  return a.type === "intolerance" ? "intolerance" : "allergy";
}
export const RELATION_GROUPS = /** @type {Array<[string, string, string]>} */ ([
  ["allergy", "Allergier", "Immunologisk reaktion på et fødevareallergen."],
  ["intolerance", "Intolerancer og stoffer", "Ikke-allergiske reaktioner, fx laktose, gluten og sulfitter."],
  ["condition", "Medicinske tilstande", "Fx cøliaki, som er en autoimmun sygdom og ikke det samme som hvedeallergi eller glutenfølsomhed."],
  ["other", "Andre registrerede id'er", "Findes i opslaget, men ikke i listen over valg. Bevares uændret."],
]);
/** Valgmuligheder pr. gruppe. @param {string} group */
export const relationOptions = (group) => ALLERGENS.filter((a) => relationGroup(a.id) === group);

// ── Mangler-kontrol ───────────────────────────────────────────────────────────────────────────────────────────────────────────
/** Hvad mangler et opslag? Kun oplysninger, der giver mening for kategorien. @param {any} e @returns {string[]} */
export function missingInfo(e) {
  /** @type {string[]} */ const out = [];
  if (!String(e.summary ?? "").trim()) out.push("resumé");
  const needsDesc = (KB_FIELDS[e.category] || []).includes("description") && e.category !== "fun_fact";
  if (needsDesc && !String(e.description ?? "").trim()) out.push("beskrivelse");
  if (!Array.isArray(e.sources) || e.sources.length === 0) out.push("kilde");
  if (e.category === "cross_reaction" && !String(e.health_notes ?? "").trim()) out.push("forbehold");
  return out;
}

// ── Liste: forespørgsel ───────────────────────────────────────────────────────────────────────────────────────────────────────
export const KB_PAGE = 50;
export const KB_SORTS = /** @type {Array<[string, string]>} */ ([["manual", "Fast rækkefølge"], ["title", "Titel A–Å"], ["updated", "Senest opdateret"]]);
export const KB_MISSING_FILTERS = /** @type {Array<[string, string]>} */ ([["summary", "Mangler resumé"], ["description", "Mangler beskrivelse"], ["sources", "Mangler kilde"]]);

const clean = (/** @type {string} */ q) => String(q || "").replace(/[,()*:\\"%{}]/g, " ").replace(/\s+/g, " ").trim();

/**
 * Forespørgsel til leksikonlisten. Søgning på titel, slug, resumé og (eksakt) alias/tag; filtre og sortering kører på serveren.
 * @param {{ q?: string, category?: string, missing?: string, editorial?: string, sort?: string, offset?: number, limit?: number, withEditorial?: boolean }} o
 */
export function buildKnowledgeQuery(o) {
  const { q = "", category = "", missing = "", editorial = "", sort = "manual", offset = 0, limit = KB_PAGE + 1, withEditorial = false } = o;
  const parts = [`select=id,category,title,slug,emoji,summary,status_label,sources,updated_at${withEditorial ? ",editorial_status,published" : ""}`];
  const s = clean(q);
  if (s) {
    const enc = encodeURIComponent(s);
    parts.push(`or=(title.ilike.*${enc}*,slug.ilike.*${enc}*,summary.ilike.*${enc}*,aliases.cs.{"${enc}"},tags.cs.{"${enc}"})`);
  }
  if (category) parts.push(`category=eq.${encodeURIComponent(category)}`);
  if (missing === "summary") parts.push("or=(summary.is.null,summary.eq.)");
  if (missing === "description") parts.push("or=(description.is.null,description.eq.)", "category=not.in.(fun_fact,faq)");
  if (missing === "sources") parts.push("sources=eq.{}");
  if (withEditorial && editorial) parts.push(editorial === "none" ? "editorial_status=is.null" : `editorial_status=eq.${encodeURIComponent(editorial)}`);
  const order = { manual: "sort_order.asc,title.asc", title: "title.asc,id.asc", updated: "updated_at.desc.nullslast,id.desc" }[sort] || "sort_order.asc,title.asc";
  parts.push(`order=${order}`, `limit=${limit}`);
  if (offset) parts.push(`offset=${offset}`);
  return parts.join("&");
}

// ── Formular: ændringer ─────────────────────────────────────────────────────────────────────────────────────────────────────────
export const KB_TEXT_FIELDS = ["category", "title", "slug", "emoji", "summary", "description", "health_notes", "status_label"];
export const KB_LIST_FIELDS = ["found_in", "alternatives", "diet_tags", "allergen_ids", "aliases", "tags", "sources"];

/** @param {any} a @param {any} b */
export function entryDirty(a, b) {
  if (!a || !b) return false;
  const n = (/** @type {any} */ e) => JSON.stringify([...KB_TEXT_FIELDS.map((k) => String(e[k] ?? "").trim()), ...KB_LIST_FIELDS.map((k) => e[k] || []), e.sort_order ?? 0, e.editorial_status ?? "", e.published ?? true]);
  return n(a) !== n(b);
}

/** Valideringsfejl pr. felt (tom = ok). @param {any} e @param {boolean} isNew */
export function validateEntry(e, isNew) {
  /** @type {Record<string, string>} */ const err = {};
  if (!String(e.title ?? "").trim()) err.title = "Titel skal udfyldes.";
  if (!String(e.slug ?? "").trim()) err.slug = "Slug mangler. Den dannes ud fra titlen.";
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.slug)) err.slug = "Slug må kun indeholde små bogstaver, tal og bindestreger.";
  const badSrc = (e.sources || []).filter((/** @type {string} */ s) => /^[a-z]+:\/\//i.test(s) && !parseSource(s).ok);
  if (badSrc.length) err.sources = "En kilde har en ugyldig adresse.";
  if (e.editorial_status === "approved") {
    const m = missingInfo(e).filter((x) => x === "resumé" || x === "kilde");
    if (m.length) err.editorial_status = `Kan ikke godkendes uden ${m.join(" og ")}.`;
  }
  return err;
}
