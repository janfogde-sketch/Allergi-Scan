// @ts-check
// Logik til fejlsiden (public.client_errors): etiketter, forespørgsel, sanering til "Kopiér som prompt", platform og historik.
// Hver række er en fejlgruppe; occurrences er antal faktiske forekomster. Se supabase/migrations/20261016090020_fejladministration.sql.
import { copenhagenDateKey, copenhagenDayStart, fmtAuditDateTime } from "./auditLogic.js";

export const STATUS_LABELS = { open: "Åben", resolved: "Løst", ignored: "Ignoreret" };
/** Statusfarver: åben rød, løst grøn, ignoreret neutral. Alvorlighed har egne farver (.err-sev), så de aldrig forveksles. */
export const STATUS_PILL = { open: "admin-pill-red", resolved: "admin-pill-green", ignored: "admin-pill-neutral" };
export const SEVERITY_LABELS = { critical: "Kritisk", high: "Høj", medium: "Middel", low: "Lav" };
export const SEVERITY_HELP = {
  critical: "Gør en central funktion utilgængelig eller har alvorlige sikkerhedsmæssige konsekvenser",
  high: "Blokerer væsentlige brugerflows",
  medium: "Påvirker funktionaliteten, men brugeren kan fortsætte",
  low: "Mindre fejl uden væsentlig påvirkning",
};
export const TABS = [["open", "Åben"], ["resolved", "Løst"], ["ignored", "Ignoreret"], ["all", "Alle"]];
export const ERROR_PERIODS = { all: "Hele perioden", today: "I dag", week: "Seneste 7 dage", month: "Seneste 30 dage", custom: "Brugerdefineret periode" };

export const SELECT_EXTENDED = "id,source,message,stack,screen,url,user_agent,app_version,app_versions,context,occurrences,first_seen,last_seen,status,severity,status_reason,reopen_count,resolution_note,verified_build";
export const SELECT_BASE = "id,source,message,stack,screen,url,user_agent,app_version,context,occurrences,first_seen,last_seen,status";

/** Området: skærmen, ellers en læsbar kilde (edge-funktion, browser). @param {{ screen?: string|null, source?: string|null }} e */
export function areaLabel(e) {
  if (e.screen) return e.screen;
  const s = e.source || "";
  if (s.startsWith("edge:")) return `Server: ${s.slice(5)}`;
  if (s === "chunk") return "Kodefil (genindlæst)";
  if (s === "window") return "Browser";
  if (s === "promise") return "Browser (løfte)";
  return s || "Ukendt";
}

/** Fejlbeskeden på én linje, afkortet til oversigten. @param {string} message @param {number} [max] */
export function shortMessage(message, max = 140) {
  const one = String(message || "").replace(/\s+/g, " ").trim();
  return one.length > max ? `${one.slice(0, max - 1)}…` : one;
}

/** @param {number} n */
export const occurrencesText = (n) => `${Number(n).toLocaleString("da-DK")} ${Number(n) === 1 ? "forekomst" : "forekomster"}`;

/** Kort dato og tid til kort: "15. okt. · 11.53". @param {string} value */
export function fmtShort(value) {
  if (!value) return "";
  const d = new Date(value);
  const date = new Intl.DateTimeFormat("da-DK", { timeZone: "Europe/Copenhagen", day: "numeric", month: "short" }).format(d);
  const time = new Intl.DateTimeFormat("da-DK", { timeZone: "Europe/Copenhagen", hour: "2-digit", minute: "2-digit" }).format(d);
  return `${date} · ${time}`;
}
export { fmtAuditDateTime as fmtLong };

/** Platform og browser i klartekst ud fra user agent: "iPhone · iOS 18.7 · Safari". @param {string|null|undefined} ua */
export function uaSummary(ua) {
  if (!ua) return "";
  let os = "";
  let m;
  if ((m = ua.match(/iPhone OS (\d+)[_.](\d+)/))) os = `iPhone · iOS ${m[1]}.${m[2]}`;
  else if ((m = ua.match(/CPU OS (\d+)[_.](\d+)/)) && /iPad/.test(ua)) os = `iPad · iPadOS ${m[1]}.${m[2]}`;
  else if ((m = ua.match(/Android (\d+(?:\.\d+)?)/))) os = `Android ${m[1]}`;
  else if (/Windows NT/.test(ua)) os = "Windows";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Linux/.test(ua)) os = "Linux";
  let browser = "";
  if ((m = ua.match(/(?:Edg|EdgA|EdgiOS)\/(\d+)/))) browser = `Edge ${m[1]}`;
  else if ((m = ua.match(/(?:Chrome|CriOS)\/(\d+)/))) browser = `Chrome ${m[1]}`;
  else if ((m = ua.match(/(?:Firefox|FxiOS)\/(\d+)/))) browser = `Firefox ${m[1]}`;
  else if ((m = ua.match(/Version\/(\d+(?:\.\d+)?).*Safari/))) browser = `Safari ${m[1]}`;
  else if (/Safari/.test(ua)) browser = "Safari";
  return [os, browser].filter(Boolean).join(" · ");
}

/**
 * Fjerner det, der aldrig må forlade administrationen: adgangsnøgler, tokens, adgangskoder, e-mailadresser og lange hemmelige strenge.
 * Query-parametre i adresser fjernes helt. @param {string|null|undefined} text
 */
export function sanitizeText(text) {
  if (!text) return "";
  return String(text)
    .replace(/https?:\/\/[^\s"'<>)]+/g, (u) => u.split(/[?#]/)[0] + (/[?#]/.test(u) ? "?[fjernet]" : ""))
    .replace(/\beyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]{8,}/g, "[token fjernet]")
    .replace(/\bBearer\s+[\w.~+/=-]{8,}/gi, "Bearer [fjernet]")
    .replace(/\b(access_token|refresh_token|id_token|token|apikey|api_key|key|password|passwd|secret|code|session)(["']?\s*[:=]\s*["']?)[^\s&"',;)]+/gi, "$1$2[fjernet]")
    .replace(/\b(?:sk|pk|sb|rk)[-_][A-Za-z0-9_-]{16,}/g, "[nøgle fjernet]")
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?![\w.-]*\.js)/g, "[e-mail fjernet]")
    .replace(/\b[0-9a-fA-F]{32,}\b/g, "[id fjernet]");
}

/** Komponent-stakken kort: de første linjer, ellers intet. @param {any} context */
export function componentStackOf(context) {
  const s = context && typeof context.componentStack === "string" ? context.componentStack.trim() : "";
  return s ? s.split("\n").slice(0, 12).join("\n") : "";
}

/** Build-id'er for en gruppe: de registrerede (første først), ellers kun det første. Kun faktiske værdier fra buildsystemet. @param {any} e @returns {string[]} */
export function buildIdsOf(e) {
  const list = Array.isArray(e.app_versions) && e.app_versions.length ? e.app_versions : e.app_version ? [e.app_version] : [];
  return list.filter((v) => typeof v === "string" && v);
}
export const isBuildId = (v) => /^[0-9a-f]{7,40}$/.test(String(v || "").trim().toLowerCase());

/**
 * Tidspunkterne til detaljevisningen uden gentagelser: én forekomst viser kun "Registreret"; flere viser første, seneste og antal.
 * @param {{ first_seen: string, last_seen: string, occurrences: number|string }} e @returns {Array<[string, string]>} [label, værdi]; tidspunkterne er rå og formateres af visningen
 */
export function occurrenceRows(e) {
  const n = Number(e.occurrences || 1);
  if (n <= 1 && e.first_seen === e.last_seen) return [["Registreret", e.first_seen]];
  return [["Første forekomst", e.first_seen], ["Seneste forekomst", e.last_seen], ["Antal forekomster", Number(e.occurrences).toLocaleString("da-DK")]];
}

/**
 * Struktureret fejlrapport til AI-assisteret fejlsøgning. Kun sikre, relevante oplysninger: ingen bruger-id, ingen rå user agent, ingen
 * tokens eller query-parametre, og alt sendes gennem sanitizeText.
 * @param {any} e en fejlgruppe
 * @param {string} [symbolicated] verificerede oprindelige placeringer (fra source map), hvis administratoren har hentet dem; ellers udelades de
 */
export function buildErrorPrompt(e, symbolicated = "") {
  const lines = [
    "Undersøg denne fejl i EatSafe (Allergi-Scan-kodebasen).",
    "",
    `Fejl: ${sanitizeText(e.message)}`,
    `Opstod i: ${areaLabel(e)}${e.source ? ` (kilde: ${e.source})` : ""}`,
    `Første forekomst: ${fmtAuditDateTime(e.first_seen)}`,
    `Seneste forekomst: ${fmtAuditDateTime(e.last_seen)}`,
    `Antal forekomster: ${e.occurrences}${e.reopen_count ? ` (vendt tilbage ${e.reopen_count} gange efter at være markeret løst)` : ""}`,
  ];
  const builds = buildIdsOf(e);
  if (builds.length) lines.push(`Build-id (git-commit, første forekomst først): ${builds.join(", ")}`);
  const platform = uaSummary(e.user_agent);
  if (platform) lines.push(`Platform: ${platform}`);
  if (e.url) lines.push(`Side: ${sanitizeText(e.url)}`);
  const chunk = e.context && typeof e.context.failedChunk === "string" && /^[\w.-]{1,120}\.js$/.test(e.context.failedChunk) ? e.context.failedChunk : "";
  if (chunk) lines.push(`Kodefil, der ikke kunne hentes: ${chunk}${e.context.online === false ? " (enheden var offline)" : ""}`);
  if (e.stack) lines.push("", "Stacktrace (minificeret):", sanitizeText(e.stack).slice(0, 3000));
  const cs = componentStackOf(e.context);
  if (cs) lines.push("", "Komponent-stak (minificeret):", sanitizeText(cs));
  if (symbolicated) lines.push("", "Oprindelige kodeplaceringer (oversat med source maps til netop dette build-id; kun verificerede rammer):", sanitizeText(symbolicated));
  else if (e.stack && builds[0]) lines.push("", `Stacken er minificeret. Oversæt den til oprindelig kode med: node scripts/symbolicate.mjs ${builds[0]} <fil med stacken> (genopbygger netop dette build med source maps). Rammer, der ikke kan verificeres, står som "ikke oversat".`);
  lines.push("", "Find årsagen i den eksisterende kode, identificér den konkrete fejl, og foreslå eller lav en målrettet rettelse. Gæt ikke ud fra fejlteksten alene; kan fejlen ikke reproduceres eller forklares ud fra koden, så sig det. Læs CLAUDE.md først, og vent på min bekræftelse, før du ændrer noget stort eller risikabelt.");
  return lines.join("\n");
}

const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
/** Fjerner tegn med betydning i PostgREST-filtre. @param {string} q */
export const cleanSearch = (q) => String(q || "").replace(/[,()*:\\"%]/g, " ").replace(/\s+/g, " ").trim();

/**
 * Forespørgslen til fejllisten (PostgREST). Nøgle-paginering på (last_seen, id): ingen huller eller dubletter. Alt kører på serveren.
 * @param {{ status?: string, q?: string, screen?: string, period?: string, from?: string, to?: string, version?: string, severity?: string,
 *   cursor?: { last_seen: string, id: string } | null, limit?: number, select?: string }} o
 * @param {Date} [now]
 */
export function buildErrorsQuery(o, now = new Date()) {
  const { status = "open", q = "", screen = "", period = "all", version = "", severity = "", cursor = null, limit = 50, select = SELECT_EXTENDED } = o;
  const parts = [`select=${select}`, "order=last_seen.desc,id.desc", `limit=${limit}`];
  if (status && status !== "all") parts.push(`status=eq.${status}`);
  if (screen) parts.push(screen === "__none" ? "screen=is.null" : `screen=eq.${encodeURIComponent(screen)}`);
  if (severity) parts.push(`severity=eq.${severity}`);
  if (version) parts.push(`app_versions=cs.${encodeURIComponent(`{${version}}`)}`);
  const ors = [];
  const s = cleanSearch(q);
  if (s) {
    const enc = encodeURIComponent(s);
    const clauses = [`message.ilike.*${enc}*`, `screen.ilike.*${enc}*`, `source.ilike.*${enc}*`, `stack.ilike.*${enc}*`, `url.ilike.*${enc}*`];
    if (isUuid(s)) clauses.push(`id.eq.${s}`);
    ors.push(`or(${clauses.join(",")})`);
  }
  if (cursor) {
    const t = encodeURIComponent(cursor.last_seen);
    ors.push(`or(last_seen.lt.${t},and(last_seen.eq.${t},id.lt.${cursor.id}))`);
  }
  if (ors.length) parts.push(`and=(${ors.join(",")})`);
  const since = { week: 7, month: 30 }[/** @type {"week"|"month"} */ (period)];
  if (since) parts.push(`last_seen=gte.${encodeURIComponent(new Date(now.getTime() - since * 86400_000).toISOString())}`);
  if (period === "today") parts.push(`last_seen=gte.${encodeURIComponent(copenhagenDayStart(copenhagenDateKey(now)).toISOString())}`);
  if (period === "custom") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(o.from || "")) parts.push(`last_seen=gte.${encodeURIComponent(copenhagenDayStart(/** @type {string} */ (o.from)).toISOString())}`);
    if (/^\d{4}-\d{2}-\d{2}$/.test(o.to || "")) parts.push(`last_seen=lt.${encodeURIComponent(copenhagenDayStart(/** @type {string} */ (o.to), 1).toISOString())}`);
  }
  return parts.join("&");
}

/** Antal aktive filtre (ud over fanen og søgeordet). @param {{ screen?: string, period?: string, version?: string, severity?: string }} f */
export const errorsFilterCount = (f) => [f.screen, f.period && f.period !== "all" ? f.period : "", f.version, f.severity].filter(Boolean).length;

/** Valgmuligheder, der faktisk findes i data: skærme, versioner og alvorligheder. @param {any[]} rows */
export function filterOptions(rows) {
  const screens = new Set(), versions = new Set(), severities = new Set();
  let none = false;
  for (const r of rows || []) {
    if (r.screen) screens.add(r.screen); else none = true;
    for (const v of Array.isArray(r.app_versions) && r.app_versions.length ? r.app_versions : r.app_version ? [r.app_version] : []) versions.add(v);
    if (r.severity) severities.add(r.severity);
  }
  return { screens: [...screens].sort((a, b) => a.localeCompare(b, "da")), hasNoScreen: none, versions: [...versions].sort(), severities: ["critical", "high", "medium", "low"].filter((s) => severities.has(s)) };
}

/**
 * Historikken i kronologisk rækkefølge (ældste først): "Fejl registreret" (første forekomst) og derefter statusændringerne fra adminloggen.
 * Manuelle ændringer viser, hvem der udførte dem; automatiske er systemhandlinger. Ingen tekniske id'er.
 * @param {any} row fejlgruppen @param {any[]} items poster fra admin_audit_log @param {Record<string, any>} users
 * @returns {Array<{ key: string, when: string, who: string, title: string, lines: string[] }>}
 */
export function historyEntries(row, items, users) {
  const out = [];
  if (row && row.first_seen) out.push({ key: "registreret", at: row.first_seen, when: fmtAuditDateTime(row.first_seen), who: "System", title: "Fejl registreret", lines: [] });
  for (const h of items || []) {
    const d = h.details || {};
    const auto = h.action === "fejl_genaabnet" || d.automatisk === true;
    const who = auto ? "System" : (users && users[h.admin_id] && (users[h.admin_id].name || users[h.admin_id].email)) || "Ukendt administrator";
    /** @type {string[]} */
    const lines = [];
    let title;
    if (h.action === "fejlalvor_aendret") {
      title = "Alvorlighed ændret";
      const lab = (v) => SEVERITY_LABELS[/** @type {"high"} */ (v)] || (v === "ingen" ? "Ikke vurderet" : v);
      lines.push(`${lab(d.fra)} → ${lab(d.til)}`);
    } else if (d.til === "resolved") {
      title = "Markeret som løst";
      if (d.rettelse) lines.push(`Rettelse: ${d.rettelse}`);
      lines.push(d.verificeret_build ? `Angivet som verificeret i build ${d.verificeret_build}` : "Verificeret build er ikke angivet");
    } else if (d.til === "ignored") {
      title = "Ignoreret";
      if (d.begrundelse) lines.push(`Begrundelse: ${d.begrundelse}`);
    } else if (d.til === "open") {
      title = auto ? "Genåbnet automatisk (fejlen skete igen)" : "Genåbnet manuelt";
    } else title = ACTION_TEXT[h.action] || "Ændring";
    out.push({ key: String(h.id), at: h.created_at, when: fmtAuditDateTime(h.created_at), who, title, lines });
  }
  return out.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0)).map(({ at: _at, ...rest }) => rest);
}

const ACTION_TEXT = { fejlstatus_aendret: "Status ændret", fejl_genaabnet: "Genåbnet automatisk", fejlalvor_aendret: "Alvorlighed ændret" };

