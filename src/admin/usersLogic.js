// @ts-check
// Logik til brugeradministrationen (public.users): forespørgsler (søgning, faner og antal på serveren), onboardingstatus, præferencer og ændringsoversigt,
// samt CSV uden formelinjektion. Se useAdminUsers.js og docs/admin-statusser.md (Brugere).
import { fmtAuditDateTime } from "./auditLogic.js";

export const USER_TABS = [["all", "Alle"], ["admin", "Admins"], ["incomplete", "Ufærdig onboarding"]];
export const ROLE_LABELS = { user: "Bruger", admin: "Administrator" };
export const USERS_PAGE = 50;
export const LIST_SELECT = "id,name,email,role,created_at,onboarding_completed";

/** Fjerner tegn med betydning i PostgREST-filtre. @param {string} q */
export const cleanSearch = (q) => String(q || "").replace(/[,()*:\\"%]/g, " ").replace(/\s+/g, " ").trim();

/**
 * Forespørgsel til brugerlisten (PostgREST). Nøgle-paginering på (created_at, id): ingen huller eller dubletter. Søgning på navn og e-mail og fanerne
 * kører på serveren, så resultater og antal gælder hele datasættet.
 * @param {{ filter?: string, q?: string, cursor?: { created_at: string, id: string } | null, limit?: number, select?: string }} o
 */
export function buildUsersQuery(o) {
  const { filter = "all", q = "", cursor = null, limit = USERS_PAGE + 1, select = LIST_SELECT } = o;
  const parts = [`select=${select}`, "order=created_at.desc,id.desc", `limit=${limit}`];
  if (filter === "admin") parts.push("role=eq.admin");
  if (filter === "incomplete") parts.push("onboarding_completed=eq.false");
  const ors = [];
  const s = cleanSearch(q);
  if (s) { const enc = encodeURIComponent(s); ors.push(`or(name.ilike.*${enc}*,email.ilike.*${enc}*)`); }
  if (cursor) {
    const t = encodeURIComponent(cursor.created_at);
    ors.push(`or(created_at.lt.${t},and(created_at.eq.${t},id.lt.${cursor.id}))`);
  }
  if (ors.length) parts.push(`and=(${ors.join(",")})`);
  return parts.join("&");
}

/**
 * Onboardingstatus ud fra den faktiske kolonne (ikke ud fra hvilken side brugeren har åbnet). Mangler værdien, er status ukendt og vises aldrig som færdig.
 * @param {{ onboarding_completed?: boolean | null }} u
 */
export function onboardingStatus(u) {
  if (u.onboarding_completed === true) return { key: "done", label: "Onboarding gennemført" };
  if (u.onboarding_completed === false) return { key: "incomplete", label: "Onboarding ufærdig" };
  return { key: "unknown", label: "Onboarding ukendt" };
}

/** Overskriften over listen: "12 brugere" eller "2 af 12 brugere". @param {number|null} shown @param {number|null} total */
export function usersCountText(shown, total) {
  if (shown === null) return "";
  const n = (/** @type {number} */ v) => v.toLocaleString("da-DK");
  const word = (/** @type {number} */ v) => (v === 1 ? "bruger" : "brugere");
  return total !== null && total !== shown ? `${n(shown)} af ${n(total)} ${word(total)}` : `${n(shown)} ${word(shown)}`;
}

// ── Præferencer ─────────────────────────────────────────────────────────────────────────────────────────────────────────
/** E-nummer i ens form (E220); null, hvis det ikke ligner et. @param {string} v */
export function normalizeENumber(v) {
  const m = String(v || "").trim().toUpperCase().match(/^E\s?(\d{3,4})([A-Z]{0,2})$/);
  return m ? `E${m[1]}${m[2]}` : null;
}
/** Egen allergi: kort tekst uden komma og tegn med betydning; null, hvis den er tom eller for lang. @param {string} v */
export function normalizeCustom(v) {
  const s = String(v || "").replace(/\s+/g, " ").trim();
  return s && s.length <= 60 && !/[<>]/.test(s) ? s : null;
}

/** @typedef {{ allergens: string[], custom: string[], eNumbers: string[], levels: Record<string, string> }} Prefs */
/** @param {any} v @returns {Prefs} */
export function prefsOf(v) {
  return {
    allergens: [...(Array.isArray(v?.allergens) ? v.allergens : [])].sort(),
    custom: [...(Array.isArray(v?.custom) ? v.custom : [])].sort(),
    eNumbers: [...(Array.isArray(v?.e_numbers) ? v.e_numbers : [])].sort(),
    levels: { ...(v?.allergen_levels && typeof v.allergen_levels === "object" ? v.allergen_levels : {}) },
  };
}

/**
 * Hvad ændringen betyder for brugerens vurderinger, som en liste til bekræftelsen før gemning.
 * @param {Prefs} before @param {Prefs} after @param {(id: string) => string} [label]
 */
export function diffPrefs(before, after, label = (id) => id) {
  const added = after.allergens.filter((a) => !before.allergens.includes(a));
  const removed = before.allergens.filter((a) => !after.allergens.includes(a));
  const cAdded = after.custom.filter((a) => !before.custom.includes(a));
  const cRemoved = before.custom.filter((a) => !after.custom.includes(a));
  const eAdded = after.eNumbers.filter((a) => !before.eNumbers.includes(a));
  const eRemoved = before.eNumbers.filter((a) => !after.eNumbers.includes(a));
  const levelKeys = [...new Set([...Object.keys(before.levels), ...Object.keys(after.levels)])].filter((k) => before.levels[k] !== after.levels[k]);
  /** @type {string[]} */
  const lines = [];
  if (added.length) lines.push(`Tilføjer allergi/intolerance: ${added.map(label).join(", ")}`);
  if (removed.length) lines.push(`Fjerner allergi/intolerance: ${removed.map(label).join(", ")}`);
  if (cAdded.length) lines.push(`Tilføjer eget valg: ${cAdded.join(", ")}`);
  if (cRemoved.length) lines.push(`Fjerner eget valg: ${cRemoved.join(", ")}`);
  if (eAdded.length) lines.push(`Tilføjer E-nummer: ${eAdded.join(", ")}`);
  if (eRemoved.length) lines.push(`Fjerner E-nummer: ${eRemoved.join(", ")}`);
  for (const k of levelKeys) lines.push(`Sporadvarsel for ${label(k)}: ${after.levels[k] === "direct_only" ? "slået fra (kun direkte indhold)" : "slået til"}`);
  return { changed: lines.length > 0, lines };
}

/** Navn, fødselsår og køn: er noget ændret? @param {{ name?: string, birth_year?: number|string|null, gender?: string|null }} a @param {{ name?: string, birth_year?: number|string|null, gender?: string|null }} b */
export function profileChanged(a, b) {
  const norm = (/** @type {typeof a} */ x) => [String(x.name || "").trim(), x.birth_year ? String(x.birth_year) : "", x.gender || ""].join("|");
  return norm(a) !== norm(b);
}
/** Gyldigt fødselsår: tomt eller et helt år mellem 1900 og i år. @param {string|number|null|undefined} v @param {number} [year] */
export function validBirthYear(v, year = new Date().getFullYear()) {
  if (v === "" || v === null || v === undefined) return true;
  const n = Number(v);
  return Number.isInteger(n) && n >= 1900 && n <= year;
}

// ── CSV ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** Standardeksporten: kun det administrative minimum. Ingen allergier, helbredsoplysninger, fødselsår eller bruger-id. */
export const CSV_COLUMNS = [
  { key: "name", label: "Navn" },
  { key: "email", label: "E-mail" },
  { key: "role", label: "Rolle" },
  { key: "created_at", label: "Oprettet" },
  { key: "onboarding", label: "Onboarding" },
];

/** En CSV-celle, der aldrig kan blive en formel i et regneark: værdier der starter med = + - @ tab eller linjeskift får et apostrof foran. @param {unknown} value */
export function csvCell(value) {
  if (value === null || value === undefined) return "";
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}
/** @param {any} u */
export function csvRow(u) {
  return {
    name: u.name || "", email: u.email || "", role: ROLE_LABELS[/** @type {"user"} */ (u.role || "user")] || u.role || "",
    created_at: u.created_at ? fmtAuditDateTime(u.created_at).split(" · ")[0] : "", onboarding: onboardingStatus(u).label,
  };
}
const BOM = String.fromCharCode(0xfeff);
/** Hele CSV-teksten (med BOM, så æ/ø/å åbner korrekt). @param {any[]} users */
export function buildCsv(users) {
  const header = CSV_COLUMNS.map((c) => csvCell(c.label)).join(",");
  const body = users.map((u) => { const r = /** @type {Record<string, string>} */ (csvRow(u)); return CSV_COLUMNS.map((c) => csvCell(r[c.key])).join(","); }).join("\n");
  return `${BOM}${header}\n${body}`;
}
