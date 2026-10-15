// @ts-check
// Tekster til adminloggen: handling, mål og skift på dansk. Ukendte handlinger vises som de er gemt.
// Loggen gemmer aldrig navn eller e-mail; navne slås op ved visning (auditNameIds) og findes kun, så længe kontoen findes.

const ACTION_LABELS = {
  rolle_aendret: "Rolle ændret",
  bruger_slettet: "Bruger slettet",
  ticketstatus_aendret: "Ticketstatus ændret",
  indsendelse_behandlet: "Indsendelse behandlet",
  indsendelse_godkendt: "Indsendelse godkendt",
  indsendelse_afvist: "Indsendelse afvist",
  produkt_slettet: "Produkt slettet",
  produkt_rettet: "Produkt rettet",
  vidensindgang_slettet: "Leksikonpost slettet",
  brugerprofil_aendret: "Brugers profil ændret",
  brugerallergier_aendret: "Brugers allergier ændret",
  familiemedlem_slettet: "Familiemedlem slettet",
  invitation_annulleret: "Invitation annulleret",
  pushtekst_aendret: "Push-tekst ændret",
  csv_eksport: "CSV-eksport",
};

const TABLE_LABELS = {
  users: "Bruger",
  products: "Produkt",
  submissions: "Indsendelse",
  feedback_tickets: "Ticket",
  knowledge_base: "Leksikonpost",
  family_members: "Familiemedlem",
  family_invites: "Invitation",
  notification_push_overrides: "Push-tekst",
};

/** @param {string} action */
export function auditActionLabel(action) {
  return ACTION_LABELS[action] || action;
}

/**
 * @param {{ action?: string, details?: { fra?: string|null, til?: string|null, felter?: string[], antal?: number,
 *   handling?: string, titel?: string|null, tekst?: string|null } | null }} row
 */
export function auditChangeText(row) {
  const d = row && row.details;
  if (!d) return "";
  if (d.fra != null || d.til != null) return `${d.fra ?? "tom"} → ${d.til ?? "tom"}`;
  const parts = [];
  if (Array.isArray(d.felter) && d.felter.length) parts.push(`Felter: ${d.felter.join(", ")}`);
  if (d.handling && d.antal != null) parts.push(`${d.antal} ${d.handling}`);
  else if (d.antal != null) parts.push(`${d.antal} rækker`);
  if (d.titel || d.tekst) parts.push(`"${[d.titel, d.tekst].filter(Boolean).join(": ")}"`);
  return parts.join(" · ");
}

/** Kort id til visning (de første 8 tegn). */
/** @param {string|null|undefined} id */
export function shortId(id) {
  return id ? String(id).slice(0, 8) : "—";
}

/**
 * Id'er, hvis navne skal slås op: admins og berørte brugere (users) samt produkter uden navn i loggen.
 * @param {Array<{ admin_id?: string|null, target_table?: string, target_id?: string|null, details?: any }>} rows
 */
export function auditNameIds(rows) {
  const users = new Set(), products = new Set();
  for (const r of rows || []) {
    if (r.admin_id) users.add(r.admin_id);
    if (r.target_table === "users" && r.target_id) users.add(r.target_id);
    if (r.target_table === "products" && r.target_id && !(r.details && r.details.navn)) products.add(r.target_id);
  }
  return { users: [...users], products: [...products] };
}

/** @param {{ name?: string|null, email?: string|null } | undefined} u */
const personLabel = (u) => (u && (u.name || u.email)) || "";

/**
 * Hvem der handlede: navn, hvis kontoen findes, ellers kort id.
 * @param {{ admin_id?: string|null }} row @param {Record<string, any>} users
 */
export function auditActorText(row, users) {
  return personLabel(users && row.admin_id ? users[row.admin_id] : undefined) || shortId(row.admin_id);
}

/**
 * Målet for handlingen i klartekst: type plus navn (bruger, produkt) eller stregkode (indsendelse).
 * @param {{ action?: string, target_table?: string, target_id?: string|null, details?: any }} row
 * @param {{ users?: Record<string, any>, products?: Record<string, any> }} names
 */
export function auditTargetText(row, names) {
  const table = row.target_table || "";
  const label = TABLE_LABELS[table] || table;
  if (row.action === "csv_eksport") return `${label}liste`;
  const d = row.details || {};
  let what = "";
  if (table === "users") what = personLabel(names && names.users ? names.users[row.target_id || ""] : undefined);
  else if (table === "products") what = d.navn || (names && names.products && names.products[row.target_id || ""] && names.products[row.target_id || ""].name) || "";
  if (table === "products" && d.ean) what = what ? `${what} (${d.ean})` : d.ean;
  if (table === "submissions" && d.ean) what = `EAN ${d.ean}`;
  if (table === "notification_push_overrides") what = row.target_id || "";
  if (!what && row.target_id) what = shortId(row.target_id);
  return what ? `${label}: ${what}` : label;
}

// ── Filtre, typer og forespørgsel til den sideinddelte log (15. okt. 2026) ──────────────────────────────────────────────
// Typer og kategorier udledes af handlingen (der logges ikke "oprettet" i dag, så den type findes ikke i filteret).

/** @type {Record<string, { label: string, pill: string, icon: string }>} */
export const AUDIT_TYPES = {
  changed: { label: "Ændret", pill: "admin-pill-neutral", icon: "edit" },
  processed: { label: "Behandlet", pill: "admin-pill-neutral", icon: "check" },
  deleted: { label: "Slettet", pill: "admin-pill-red", icon: "trash" },
  exported: { label: "Eksporteret", pill: "admin-pill-neutral", icon: "download" },
};

/** @type {Record<string, { type: string, category: string, verb: string }>} */
const ACTION_META = {
  rolle_aendret: { type: "changed", category: "Roller", verb: "ændrede rollen for" },
  bruger_slettet: { type: "deleted", category: "Brugere", verb: "slettede" },
  ticketstatus_aendret: { type: "changed", category: "Tickets", verb: "ændrede status på" },
  indsendelse_behandlet: { type: "processed", category: "Indsendelser", verb: "behandlede" },
  indsendelse_godkendt: { type: "processed", category: "Indsendelser", verb: "godkendte" },
  indsendelse_afvist: { type: "processed", category: "Indsendelser", verb: "afviste" },
  produkt_slettet: { type: "deleted", category: "Produkter", verb: "slettede" },
  produkt_rettet: { type: "changed", category: "Produkter", verb: "rettede" },
  vidensindgang_slettet: { type: "deleted", category: "Leksikon", verb: "slettede" },
  brugerprofil_aendret: { type: "changed", category: "Allergier og profiler", verb: "ændrede profilen for" },
  brugerallergier_aendret: { type: "changed", category: "Allergier og profiler", verb: "ændrede allergierne for" },
  familiemedlem_slettet: { type: "deleted", category: "Familie", verb: "slettede" },
  invitation_annulleret: { type: "deleted", category: "Familie", verb: "annullerede" },
  pushtekst_aendret: { type: "changed", category: "Push-tekster", verb: "ændrede" },
  csv_eksport: { type: "exported", category: "Eksport", verb: "eksporterede" },
};

const ARTICLES = {
  users: "brugeren", products: "produktet", submissions: "indsendelsen", feedback_tickets: "ticketten", knowledge_base: "leksikonposten",
  family_members: "familiemedlemmet", family_invites: "invitationen", notification_push_overrides: "push-teksten",
};

export const AUDIT_CATEGORIES = [...new Set(Object.values(ACTION_META).map((m) => m.category))];
export const AUDIT_PERIODS = { all: "Hele perioden", day: "Seneste 24 timer", week: "Seneste 7 dage", month: "Seneste 30 dage" };

/** @param {string} action */
export const auditActionType = (action) => (ACTION_META[action] || { type: "changed" }).type;
/** @param {string} action */
export const auditCategory = (action) => (ACTION_META[action] || { category: "Andet" }).category;

/**
 * Handlinger, der matcher en type og/eller kategori. null = intet filter; en tom liste = ingen handling passer.
 * @param {{ type?: string, category?: string }} f
 * @returns {string[] | null}
 */
export function auditActionsFor({ type = "", category = "" } = {}) {
  if (!type && !category) return null;
  return Object.keys(ACTION_META).filter((a) => (!type || ACTION_META[a].type === type) && (!category || ACTION_META[a].category === category));
}

/** Handlinger, hvis danske navn indeholder søgeordet. */
export const auditActionsMatching = (/** @type {string} */ q) => {
  const s = q.toLowerCase();
  return Object.keys(ACTION_META).filter((a) => auditActionLabel(a).toLowerCase().includes(s));
};

/** Fjerner tegn, der har betydning i PostgREST-filtre. */
export const cleanSearch = (/** @type {string} */ q) => String(q || "").replace(/[,()*:\\"%]/g, " ").replace(/\s+/g, " ").trim();

/**
 * Forespørgslen til adminloggen (PostgREST). Nøgle-paginering på (created_at, id): ingen huller eller dubletter, selv om nye rækker kommer til.
 * @param {{ type?: string, category?: string, period?: string, q?: string, cursor?: { created_at: string, id: number } | null, limit?: number,
 *   matchIds?: string[] }} o
 * @param {Date} [now]
 * @returns {string | null} null, når filtrene udelukker alt (fx type og kategori uden fælles handling)
 */
export function buildAuditQuery(o, now = new Date()) {
  const { type = "", category = "", period = "all", q = "", cursor = null, limit = 50, matchIds = [] } = o;
  const parts = ["select=id,created_at,admin_id,action,target_table,target_id,details", "order=created_at.desc,id.desc", `limit=${limit}`];
  const actions = auditActionsFor({ type, category });
  if (actions && actions.length === 0) return null;
  const search = cleanSearch(q);
  const ors = [];
  if (search) {
    const enc = encodeURIComponent(search);
    const clauses = [`details->>navn.ilike.*${enc}*`, `details->>ean.ilike.*${enc}*`];
    if (matchIds.length) clauses.push(`admin_id.in.(${matchIds.join(",")})`, `target_id.in.(${matchIds.join(",")})`);
    const byLabel = auditActionsMatching(search);
    if (byLabel.length) clauses.push(`action.in.(${byLabel.join(",")})`);
    ors.push(`or(${clauses.join(",")})`);
  }
  if (cursor) {
    const t = encodeURIComponent(cursor.created_at);
    ors.push(`or(created_at.lt.${t},and(created_at.eq.${t},id.lt.${Number(cursor.id)}))`);
  }
  if (ors.length) parts.push(`and=(${ors.join(",")})`);
  if (actions) parts.push(`action=in.(${actions.join(",")})`);
  const since = { day: 1, week: 7, month: 30 }[/** @type {"day"|"week"|"month"} */ (period)];
  if (since) parts.push(`created_at=gte.${encodeURIComponent(new Date(now.getTime() - since * 86400_000).toISOString())}`);
  return parts.join("&");
}

/** Antal aktive filtre (ud over søgeordet). */
export const auditFilterCount = (/** @type {{ type?: string, category?: string, period?: string }} */ f) =>
  [f.type, f.category, f.period && f.period !== "all" ? f.period : ""].filter(Boolean).length;

/** Målet delt i type og navn: { label: "Produkt", what: "Havredrik (570)" }. */
export function auditTargetParts(row, names) {
  const text = auditTargetText(row, names);
  const label = TABLE_LABELS[row.target_table || ""] || row.target_table || "";
  const rest = text.startsWith(`${label}: `) ? text.slice(label.length + 2) : "";
  return { label, what: rest };
}

/** Kort sætning til listen: "Jan ændrede produktet “Havredrik”". */
export function auditSummary(row, names) {
  const actor = auditActorText(row, names && names.users);
  const meta = ACTION_META[row.action || ""];
  const { label, what } = auditTargetParts(row, names || {});
  if (!meta) return `${actor}: ${row.action}`;
  if (row.action === "csv_eksport") return `${actor} eksporterede ${label.toLowerCase()}listen`;
  const art = ARTICLES[row.target_table || ""] || label.toLowerCase();
  return `${actor} ${meta.verb} ${art}${what ? ` “${what}”` : ""}`;
}

/** Dato og tid til kort og detalje: "15. oktober 2026 · 09.42". */
export function fmtAuditDateTime(value, seconds = false) {
  if (!value) return "";
  const d = new Date(value);
  const date = new Intl.DateTimeFormat("da-DK", { timeZone: "Europe/Copenhagen", day: "numeric", month: "long", year: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("da-DK", { timeZone: "Europe/Copenhagen", hour: "2-digit", minute: "2-digit", ...(seconds ? { second: "2-digit" } : {}) }).format(d);
  return `${date} · ${time}`;
}
