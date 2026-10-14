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
