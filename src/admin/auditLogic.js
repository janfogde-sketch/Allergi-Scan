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
  produkt_oprettet: "Produkt oprettet",
  vidensindgang_oprettet: "Leksikonpost oprettet",
  vidensindgang_rettet: "Leksikonpost rettet",
  allergener_gemt: "Allergener gemt på produkt",
  genanalyse_koert: "Genanalyse kørt",
  import_koert: "Import kørt",
  testpush_sendt: "Test-push sendt",
  adgang_naegtet: "Adgang nægtet",
  sikkerhedsmelding: "Sikkerhedsmelding",
  ai_budget_aendret: "AI-budget ændret",
  fejlstatus_aendret: "Fejlstatus ændret",
  fejl_genaabnet: "Fejl genåbnet automatisk",
  fejlalvor_aendret: "Fejls alvorlighed ændret",
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
  edge_function: "Serverfunktion",
  app_flags: "Indstilling",
  client_errors: "Fejl",
};

/** @param {string} action */
export function auditActionLabel(action) {
  return ACTION_LABELS[action] || action;
}

/** Logværdi som kort tekst: tom, tal, tekst eller liste. @param {any} v */
export function auditValueText(v) {
  if (v === null || v === undefined || v === "") return "tom";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "tom";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/**
 * Før/efter pr. felt (kun indhold som produkter og leksikon; brugerprofiler logger aldrig værdier).
 * @param {{ details?: { aendringer?: Array<{ felt: string, fra?: any, til?: any }> } | null }} row
 * @returns {Array<{ felt: string, fra: string, til: string }>}
 */
export function auditChanges(row) {
  const list = row && row.details && Array.isArray(row.details.aendringer) ? row.details.aendringer : [];
  return list.map((c) => ({ felt: c.felt, fra: auditValueText(c.fra), til: auditValueText(c.til) }));
}

/** Udfald: ok (standard), mislykket eller afvist. @param {{ outcome?: string|null }} row */
export const auditOutcome = (row) => (row && row.outcome) || "ok";

/**
 * @param {{ action?: string, outcome?: string|null, details?: { fra?: string|null, til?: string|null, felter?: string[], antal?: number,
 *   handling?: string, titel?: string|null, tekst?: string|null, funktion?: string, fejl?: string } | null }} row
 */
export function auditChangeText(row) {
  const d = row && row.details;
  if (!d) return "";
  if (d.fra != null || d.til != null) return `${d.fra ?? "tom"} → ${d.til ?? "tom"}`;
  const parts = [];
  if (d.funktion) parts.push(`Funktion: ${d.funktion}`);
  if (d.fejl) parts.push(`Fejl: ${d.fejl}`);
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
  if (table === "notification_push_overrides" || table === "edge_function") what = row.target_id || "";
  if (table === "client_errors") what = shortId(row.target_id);
  if (table === "app_flags") what = row.target_id === "ai_budget" ? "AI-budget" : row.target_id || "";
  if (!what && row.target_id) what = shortId(row.target_id);
  return what ? `${label}: ${what}` : label;
}

// ── Filtre, typer og forespørgsel til den sideinddelte log (15. okt. 2026) ──────────────────────────────────────────────
// Typer og kategorier udledes af handlingen. "Mislykket/afvist" udledes af kolonnen outcome (afviste forsøg og fejlede handlinger).

/** @type {Record<string, { label: string, pill: string, icon: string }>} */
export const AUDIT_TYPES = {
  created: { label: "Oprettet", pill: "admin-pill-neutral", icon: "plus" },
  changed: { label: "Ændret", pill: "admin-pill-neutral", icon: "edit" },
  deleted: { label: "Slettet", pill: "admin-pill-red", icon: "trash" },
  approved: { label: "Godkendt", pill: "admin-pill-neutral", icon: "check" },
  rejected: { label: "Afvist", pill: "admin-pill-neutral", icon: "block" },
  exported: { label: "Eksporteret", pill: "admin-pill-neutral", icon: "download" },
  run: { label: "Kørsel", pill: "admin-pill-neutral", icon: "refresh" },
  security: { label: "Sikkerhedshændelse", pill: "admin-pill-neutral", icon: "shield" },
  failed: { label: "Mislykket / nægtet", pill: "admin-pill-red", icon: "warning" },
};

/** @type {Record<string, { type: string, category: string, verb: string, by: string }>} */
const ACTION_META = {
  rolle_aendret: { type: "changed", category: "Sikkerhed", verb: "ændrede rollen for", by: "Ændret af" },
  bruger_slettet: { type: "deleted", category: "Brugere", verb: "slettede", by: "Slettet af" },
  ticketstatus_aendret: { type: "changed", category: "Tickets", verb: "ændrede status på", by: "Ændret af" },
  indsendelse_behandlet: { type: "approved", category: "Indsendelser", verb: "behandlede", by: "Behandlet af" },
  indsendelse_godkendt: { type: "approved", category: "Indsendelser", verb: "godkendte", by: "Godkendt af" },
  indsendelse_afvist: { type: "rejected", category: "Indsendelser", verb: "afviste", by: "Afvist af" },
  produkt_slettet: { type: "deleted", category: "Produkter", verb: "slettede", by: "Slettet af" },
  produkt_rettet: { type: "changed", category: "Produkter", verb: "rettede", by: "Rettet af" },
  vidensindgang_slettet: { type: "deleted", category: "Leksikon", verb: "slettede", by: "Slettet af" },
  brugerprofil_aendret: { type: "changed", category: "Allergier og profiler", verb: "ændrede profilen for", by: "Ændret af" },
  brugerallergier_aendret: { type: "changed", category: "Allergier og profiler", verb: "ændrede allergierne for", by: "Ændret af" },
  familiemedlem_slettet: { type: "deleted", category: "Familie", verb: "slettede", by: "Slettet af" },
  invitation_annulleret: { type: "deleted", category: "Familie", verb: "annullerede", by: "Annulleret af" },
  pushtekst_aendret: { type: "changed", category: "Push-tekster", verb: "ændrede", by: "Ændret af" },
  csv_eksport: { type: "exported", category: "Eksport", verb: "eksporterede", by: "Eksporteret af" },
  produkt_oprettet: { type: "created", category: "Produkter", verb: "oprettede", by: "Oprettet af" },
  vidensindgang_oprettet: { type: "created", category: "Leksikon", verb: "oprettede", by: "Oprettet af" },
  vidensindgang_rettet: { type: "changed", category: "Leksikon", verb: "rettede", by: "Rettet af" },
  allergener_gemt: { type: "changed", category: "Produkter", verb: "gemte allergener på", by: "Gemt af" },
  genanalyse_koert: { type: "run", category: "Kørsler", verb: "kørte genanalyse via", by: "Kørt af" },
  import_koert: { type: "run", category: "Kørsler", verb: "kørte import via", by: "Kørt af" },
  testpush_sendt: { type: "run", category: "Push-tekster", verb: "sendte en test-push via", by: "Sendt af" },
  adgang_naegtet: { type: "security", category: "Sikkerhed", verb: "blev nægtet adgang til", by: "Forsøgt af" },
  ai_budget_aendret: { type: "changed", category: "Indstillinger", verb: "ændrede", by: "Ændret af" },
  fejlstatus_aendret: { type: "changed", category: "Fejl", verb: "ændrede status på", by: "Ændret af" },
  fejl_genaabnet: { type: "changed", category: "Fejl", verb: "genåbnede automatisk", by: "Genåbnet" },
  fejlalvor_aendret: { type: "changed", category: "Fejl", verb: "ændrede alvorligheden af", by: "Ændret af" },
  sikkerhedsmelding: { type: "security", category: "Sikkerhed", verb: "meldte “Det var ikke mig” for", by: "Meldt af" },
};

const ARTICLES = {
  users: "brugeren", products: "produktet", submissions: "indsendelsen", feedback_tickets: "ticketten", knowledge_base: "leksikonposten",
  family_members: "familiemedlemmet", family_invites: "invitationen", notification_push_overrides: "push-teksten",
  edge_function: "serverfunktionen", app_flags: "indstillingen", client_errors: "fejlen",
};

export const AUDIT_CATEGORIES = [...new Set(Object.values(ACTION_META).map((m) => m.category))];
export const AUDIT_PERIODS = { all: "Hele perioden", today: "I dag", week: "Seneste 7 dage", month: "Seneste 30 dage", custom: "Brugerdefineret periode" };

/** Typen til mærket; en mislykket eller afvist række vises altid som "Mislykket/afvist". @param {string} action @param {string|null} [outcome] */
export const auditActionType = (action, outcome) => (outcome && outcome !== "ok" ? "failed" : (ACTION_META[action] || { type: "changed" }).type);
/** @param {string} action */
export const auditCategory = (action) => (ACTION_META[action] || { category: "Andet" }).category;

/**
 * Handlinger, der matcher en type og/eller kategori. null = intet filter; en tom liste = ingen handling passer.
 * @param {{ type?: string, category?: string }} f
 * @returns {string[] | null}
 */
export function auditActionsFor({ type = "", category = "" } = {}) {
  if (type === "failed") type = ""; // filtreres på outcome, ikke handling
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
 * @param {{ type?: string, category?: string, period?: string, from?: string, to?: string, q?: string, cursor?: { created_at: string, id: number } | null, limit?: number,
 *   matchIds?: string[] }} o
 * @param {Date} [now]
 * @returns {string | null} null, når filtrene udelukker alt (fx type og kategori uden fælles handling)
 */
/** @param {any} v */
const isDateKey = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
/** Dagens dato (YYYY-MM-DD) i dansk tid. @param {Date} d */
export const copenhagenDateKey = (d) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Copenhagen" }).format(d);
/** Midnat i dansk tid ved starten af en dato (plus et antal dage). @param {string} key @param {number} [plusDays] */
export function copenhagenDayStart(key, plusDays = 0) {
  const base = new Date(`${key}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + plusDays);
  const day = base.toISOString().slice(0, 10);
  for (const off of ["+02:00", "+01:00"]) {
    const t = new Date(`${day}T00:00:00${off}`);
    if (copenhagenDateKey(t) === day && new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Copenhagen", hour: "2-digit", hourCycle: "h23" }).format(t) === "00") return t;
  }
  return new Date(`${day}T00:00:00Z`);
}

export function buildAuditQuery(o, now = new Date()) {
  const { type = "", category = "", period = "all", q = "", cursor = null, limit = 50, matchIds = [] } = o;
  const parts = ["select=id,created_at,admin_id,action,target_table,target_id,details,outcome", "order=created_at.desc,id.desc", `limit=${limit}`];
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
  if (type === "failed") parts.push("outcome=neq.ok");
  const since = { week: 7, month: 30 }[/** @type {"week"|"month"} */ (period)];
  if (since) parts.push(`created_at=gte.${encodeURIComponent(new Date(now.getTime() - since * 86400_000).toISOString())}`);
  if (period === "today") parts.push(`created_at=gte.${encodeURIComponent(copenhagenDayStart(copenhagenDateKey(now)).toISOString())}`);
  if (period === "custom") {
    if (isDateKey(o.from)) parts.push(`created_at=gte.${encodeURIComponent(copenhagenDayStart(o.from).toISOString())}`);
    if (isDateKey(o.to)) parts.push(`created_at=lt.${encodeURIComponent(copenhagenDayStart(o.to, 1).toISOString())}`); // til og med den valgte dag
  }
  return parts.join("&");
}

/** Antal aktive filtre (ud over søgeordet). */
export const auditFilterCount = (/** @type {{ type?: string, category?: string, period?: string }} */ f) =>
  [f.type, f.category, f.period && f.period !== "all" ? f.period : ""].filter(Boolean).length;

/** Kategorien, den korte handlingslinje ("Afvist af jafo"), målet og datoen til et aktivitetskort. */
export function auditCardParts(row, names) {
  const meta = ACTION_META[row.action || ""];
  const parts = auditTargetParts(row, names || {});
  return {
    category: meta ? meta.category : "Andet",
    title: auditActionLabel(row.action),
    by: `${meta ? meta.by : "Udført af"} ${auditActorText(row, names && names.users)}`,
    target: parts.what ? `${parts.label}: ${parts.what}` : parts.label,
    date: fmtAuditDateTime(row.created_at),
  };
}

/** Begrundelsen, hvis loggen har en (kun hvad der faktisk er registreret). @param {{ details?: any }} row */
export const auditReason = (row) => (row && row.details && typeof row.details.begrundelse === "string" && row.details.begrundelse.trim()) || "";

/** Tekniske oplysninger til den foldbare sektion: kun felter, der findes. */
export function auditTechRows(row) {
  const d = row.details || {};
  return [
    ["Log-ID", row.id != null ? String(row.id) : ""],
    ["Bruger-ID", row.admin_id || ""],
    ["Reference-ID", row.target_id || ""],
    ["Måltabel", row.target_table || ""],
    ["Handlingskode", row.action || ""],
    ["Funktion", typeof d.funktion === "string" ? d.funktion : ""],
  ].filter(([, v]) => v);
}

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
  const failed = auditOutcome(row) === "mislykket" ? " (mislykkedes)" : "";
  return `${actor} ${meta.verb} ${art}${what ? ` “${what}”` : ""}${failed}`;
}

/** Dato og tid til kort og detalje: "15. oktober 2026 · 09.42". */
export function fmtAuditDateTime(value, seconds = false) {
  if (!value) return "";
  const d = new Date(value);
  const date = new Intl.DateTimeFormat("da-DK", { timeZone: "Europe/Copenhagen", day: "numeric", month: "long", year: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("da-DK", { timeZone: "Europe/Copenhagen", hour: "2-digit", minute: "2-digit", ...(seconds ? { second: "2-digit" } : {}) }).format(d);
  return `${date} · ${time}`;
}
