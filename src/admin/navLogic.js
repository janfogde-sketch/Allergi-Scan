// @ts-check
// Navigationen i admin-menuen: grupper, punkter (navn, ikon, rute) og antalsmarkeringer. Ren logik, så den kan testes.
// Rute-id'erne (`id`) er uændrede; kun de viste navne ("label") kan ændres uden at røre ruter eller funktioner.

/**
 * @typedef {{ id: string, icon: string, label: string, badgeKey?: string }} NavItem
 * @typedef {{ id: string, label: string, items: NavItem[] }} NavGroup
 */

/** @type {NavGroup[]} */
export const NAV_GROUPS = [
  { id: "overview", label: "Overblik", items: [
    { id: "dashboard",   icon: "chart",    label: "Dashboard" },
    { id: "todo",        icon: "list",     label: "Opgaver", badgeKey: "todoAttention" },
  ] },
  { id: "review", label: "Til behandling", items: [
    { id: "submissions", icon: "package",  label: "Indsendelser", badgeKey: "pendingSubmissions" },
    { id: "recalls",     icon: "shield",   label: "Tilbagekald", badgeKey: "pendingRecalls" },
    { id: "tickets",     icon: "bug",      label: "Tickets", badgeKey: "openTickets" },
  ] },
  { id: "content", label: "Indhold & data", items: [
    { id: "products",    icon: "tag",      label: "Produkter" },
    { id: "knowledge",   icon: "book",     label: "Leksikon" },
    // Siden viser stregkoder, brugerne har scannet uden at finde produktet (ikke produkter uden EAN).
    { id: "missing",     icon: "barcode",  label: "Ukendte stregkoder" },
    { id: "import",      icon: "download", label: "Import" },
    { id: "history",     icon: "edit",     label: "Ændringshistorik" },
  ] },
  { id: "people", label: "Brugere & kommunikation", items: [
    { id: "users",         icon: "family",  label: "Brugere" },
    { id: "family",        icon: "heart",   label: "Familie" },
    { id: "notifications", icon: "bell",    label: "Notifikationer" },
    { id: "onboarding",    icon: "profile", label: "Onboardingfrafald" },
  ] },
  { id: "system", label: "Drift", items: [
    { id: "errors",      icon: "warning",  label: "Fejl" },
    { id: "ai-usage",    icon: "zap",      label: "AI-forbrug" },
    { id: "audit",       icon: "clock",    label: "Aktivitetslog" },
  ] },
];
export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

/** Hvad hver tæller betyder (bruges til skærmlæsertekst): `noun` følger tallet, `tone` er markeringens farve. */
export const BADGE_INFO = {
  todoAttention: { noun: "kræver opmærksomhed", tone: "warn" },       // høj prioritet eller overskredet frist (ikke Venter)
  pendingSubmissions: { noun: "afventende", tone: "neutral" },
  pendingRecalls: { noun: "afventer gennemgang", tone: "warn" },
  openTickets: { noun: "åbne", tone: "neutral" },
};

/** Gruppen, der rummer en side (undefined, hvis siden ikke findes i menuen). */
export const groupOfSection = (/** @type {string} */ section) => NAV_GROUPS.find((g) => g.items.some((i) => i.id === section))?.id;

/** Tællerens tekst: ingen markering ved 0, ugyldigt eller ikke indlæst; ellers tallet, og "99+" over 99. */
export function formatBadge(/** @type {unknown} */ n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return "";
  const whole = Math.floor(v);
  return whole > 99 ? "99+" : String(whole);
}

const RANK = { neutral: 0, warn: 1, crit: 2 };
/** Den strengeste tone blandt flere (rød > gul > neutral). */
export const worstTone = (/** @type {Array<"neutral"|"warn"|"crit">} */ tones) => tones.reduce((a, t) => (RANK[t] > RANK[a] ? t : a), /** @type {"neutral"|"warn"|"crit"} */ ("neutral"));
