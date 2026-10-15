// @ts-check
// Pris, perioder og opsummering for Claude-forbruget (tabellen ai_usage_daily: dag, funktion, model, kald, input- og outputtokens).
// Dage er i dansk tid (Europe/Copenhagen); det sørger log_ai_usage() for ved registreringen.
// ALLE TAL ER ESTIMATER: tokens × prisliste × kurs. Der findes ingen fakturadata, så en faktisk faktureret udgift kan ikke vises.

/** Priser pr. model (dollar pr. million tokens), med den dato prisen gælder fra. Historiske kald prissættes efter modellen på rækken. */
export const PRICE_TABLE = [
  { prefix: "claude-haiku-4-5", from: "2025-10-01", inUsd: 1, outUsd: 5, label: "Claude Haiku 4.5" },
];
export const PRICE_CHECKED = "7. okt. 2026"; // da priserne senest blev læst fra Anthropics prisliste; ikke verificeret automatisk
export const USD_TO_DKK = 6.9; // fast antagelse; ikke hentet fra en valutakilde
export const HAIKU_USD_PER_M_INPUT = PRICE_TABLE[0].inUsd;
export const HAIKU_USD_PER_M_OUTPUT = PRICE_TABLE[0].outUsd;

export const FUNCTION_LABELS = {
  ocr: "Læsning af fotos",
  allergens: "Allergen-tjek",
  "classify-categories": "Kategorisering",
};
/** Funktioner, koden viser kun kan kaldes internt (service-nøglen: baggrundsjob og godkendelse af indsendelser). Øvrige kan ikke adskilles. */
export const INTERNAL_FUNCTIONS = ["classify-categories"];

// ── Forbrugstype (oprindelse) ─────────────────────────────────────────────────────────────────────────────────────────────
export const ORIGINS = { all: "Alle", user: "Brugerfunktioner", internal: "Interne processer", unknown: "Ukendt / ikke klassificeret" };
/**
 * Rækkens forbrugstype. Kun registreret eller dokumenterbar oprindelse bruges: origin fra databasen (user/internal), ellers funktionen, hvis den
 * kun kan kaldes internt (INTERNAL_FUNCTIONS, bekræftet i koden: classify-categories afviser alt andet end service-nøglen). Alt andet er "unknown".
 * @param {{ function_name: string, origin?: string|null }} r
 */
export function effectiveOrigin(r) {
  if (r.origin === "user" || r.origin === "internal") return r.origin;
  return INTERNAL_FUNCTIONS.includes(r.function_name) ? "internal" : "unknown";
}
/** @param {UsageRow[]} rows @param {string} kind all | user | internal | unknown */
export const filterOrigin = (rows, kind) => (kind === "all" || !kind ? rows : rows.filter((r) => effectiveOrigin(r) === kind));
/** Omkostning pr. forbrugstype; kun typer med kald. @param {UsageRow[]} rows */
export function originSplit(rows) {
  const out = [];
  for (const k of /** @type {const} */ (["user", "internal", "unknown"])) {
    const rs = rows.filter((r) => effectiveOrigin(r) === k);
    const t = totals(rs);
    if (t.calls > 0) out.push({ key: k, label: ORIGINS[k], ...t });
  }
  return out;
}
export const functionLabel = (/** @type {string} */ k) => /** @type {Record<string,string>} */ (FUNCTION_LABELS)[k] || k;

/**
 * Prisen for en model på en dato. En række uden model (ældre data) prissættes som standardmodellen; en kendt-ukendt model giver null (pris ukendt, aldrig et gæt).
 * @param {string|null|undefined} model @param {string} [day]
 */
export function priceFor(model, day) {
  if (!model) return PRICE_TABLE[0];
  const hits = PRICE_TABLE.filter((p) => model.startsWith(p.prefix) && (!day || day >= p.from)).sort((a, b) => (a.from < b.from ? 1 : -1));
  return hits[0] || null;
}

/** Omkostning i kroner for tokens; null, hvis modellens pris er ukendt. */
export function costDkk(inputTokens, outputTokens, model, day) {
  const p = priceFor(model, day);
  if (!p) return null;
  return ((inputTokens / 1e6) * p.inUsd + (outputTokens / 1e6) * p.outUsd) * USD_TO_DKK;
}

/** @typedef {{ day: string, function_name: string, model?: string|null, origin?: string|null, calls: number|string, input_tokens: number|string, output_tokens: number|string }} UsageRow */
/** @typedef {{ calls: number, input: number, output: number, dkk: number, unpricedCalls: number }} Totals */

/** @param {UsageRow[]} rows @returns {Totals} */
export function totals(rows) {
  /** @type {Totals} */
  const t = { calls: 0, input: 0, output: 0, dkk: 0, unpricedCalls: 0 };
  for (const r of rows) {
    const calls = Number(r.calls || 0), input = Number(r.input_tokens || 0), output = Number(r.output_tokens || 0);
    t.calls += calls; t.input += input; t.output += output;
    const c = costDkk(input, output, r.model, r.day);
    if (c === null) t.unpricedCalls += calls; else t.dkk += c;
  }
  return t;
}

function groupBy(rows, keyFn) {
  const map = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(r);
  }
  return [...map.entries()].map(([key, rs]) => ({ key, ...totals(rs), rows: rs }));
}

export const byDay = (rows) => groupBy(rows, (r) => r.day).sort((a, b) => (a.key < b.key ? 1 : -1));
export const byMonth = (rows) => groupBy(rows, (r) => String(r.day).slice(0, 7)).sort((a, b) => (a.key < b.key ? 1 : -1));
export const byFunction = (rows) => groupBy(rows, (r) => r.function_name).sort((a, b) => b.dkk - a.dkk);

/** Funktioner med andel af totalen og gennemsnitspris pr. kald; kun funktioner med kald. */
export function functionShares(rows) {
  const list = byFunction(rows).filter((f) => f.calls > 0);
  const total = list.reduce((s, f) => s + f.dkk, 0);
  return list.map((f) => ({ ...f, share: total > 0 ? f.dkk / total : null, perCall: f.calls > 0 ? f.dkk / f.calls : null }));
}

export function currentMonthRows(rows, todayIso) {
  return rows.filter((r) => String(r.day).startsWith(todayIso.slice(0, 7)));
}

// ── Datoer (dansk tid) ──────────────────────────────────────────────────────────────────────────────────────────────────
/** Dagens dato som YYYY-MM-DD i dansk tid. @param {Date} [now] */
export const todayKey = (now = new Date()) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Copenhagen" }).format(now);
const isKey = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
/** @param {string} key @param {number} n */
export function addDays(key, n) {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const daysBetween = (a, b) => Math.round((new Date(`${b}T12:00:00Z`).getTime() - new Date(`${a}T12:00:00Z`).getTime()) / 86400_000);
/** Alle datoer fra og med from til og med to. */
export function daysInRange(from, to) {
  const out = [];
  for (let d = from; d <= to && out.length < 800; d = addDays(d, 1)) out.push(d);
  return out;
}
const monthStart = (key) => `${key.slice(0, 7)}-01`;
const monthEnd = (key) => addDays(`${addDays(monthStart(key), 32).slice(0, 7)}-01`, -1);

export const PERIODS = { month: "Denne måned", today: "I dag", week: "Seneste 7 dage", days30: "Seneste 30 dage", lastMonth: "Sidste måned", custom: "Brugerdefineret periode" };

/**
 * Datointerval (begge inklusive) for en periode.
 * @param {string} kind @param {string} today YYYY-MM-DD @param {{ from?: string, to?: string }} [custom]
 * @returns {{ from: string, to: string } | null} null, når en brugerdefineret periode er ufuldstændig eller omvendt
 */
export function periodRange(kind, today, custom = {}) {
  switch (kind) {
    case "today": return { from: today, to: today };
    case "week": return { from: addDays(today, -6), to: today };
    case "days30": return { from: addDays(today, -29), to: today };
    case "lastMonth": { const prev = addDays(monthStart(today), -1); return { from: monthStart(prev), to: prev }; }
    case "custom": return isKey(custom.from) && isKey(custom.to) && custom.from <= custom.to ? { from: custom.from, to: custom.to } : null;
    default: return { from: monthStart(today), to: today };
  }
}

/** @param {UsageRow[]} rows @param {{ from: string, to: string }} range */
export const rowsIn = (rows, range) => rows.filter((r) => r.day >= range.from && r.day <= range.to);

/** Første dag, der findes en registrering for (før den er forbruget ikke registreret). */
export const trackingStart = (rows) => rows.reduce((m, r) => (m === null || r.day < m ? r.day : m), /** @type {string|null} */ (null));

/**
 * Sammenligningsperioden: kun afsluttede døgn og lige mange dage, og kun hvis der findes registreringer for hele perioden.
 * En igangværende dag eller måned sammenlignes aldrig med en afsluttet periode.
 * @returns {{ current: { from: string, to: string }, previous: { from: string, to: string }, days: number } | null}
 */
export function comparisonRanges(kind, range, today, rows) {
  if (!range || kind === "today") return null; // et delvist døgn kan ikke sammenlignes
  const effTo = range.to >= today ? addDays(today, -1) : range.to;
  if (effTo < range.from) return null;
  const days = daysBetween(range.from, effTo) + 1;
  let prevFrom;
  if (kind === "month") prevFrom = monthStart(addDays(range.from, -1));
  else if (kind === "lastMonth") prevFrom = monthStart(addDays(range.from, -1));
  else prevFrom = addDays(range.from, -days);
  const prevMax = kind === "month" || kind === "lastMonth" ? monthEnd(prevFrom) : addDays(range.from, -1);
  const prevTo = addDays(prevFrom, days - 1) > prevMax ? prevMax : addDays(prevFrom, days - 1);
  const start = trackingStart(rows);
  if (!start || prevFrom < start) return null; // forrige periode er ikke (helt) registreret
  return { current: { from: range.from, to: effTo }, previous: { from: prevFrom, to: prevTo }, days };
}

/** Procentændring; null ved nul (eller manglende) sammenligningsgrundlag. */
export const pctChange = (current, previous) => (previous > 0 ? (current - previous) / previous : null);

/**
 * Dag for dag i perioden, også dage uden forbrug. state: "none" = før registreringen begyndte (ukendt), "zero" = registreret, men intet forbrug, "data".
 * @param {UsageRow[]} rows @param {{ from: string, to: string }} range
 */
export function dailySeries(rows, range) {
  const start = trackingStart(rows);
  const map = new Map(byDay(rowsIn(rows, range)).map((d) => [d.key, d]));
  return daysInRange(range.from, range.to).map((day) => {
    const d = map.get(day);
    if (d) return { day, calls: d.calls, input: d.input, output: d.output, dkk: d.dkk, tokens: d.input + d.output, state: "data" };
    return { day, calls: 0, input: 0, output: 0, dkk: 0, tokens: 0, state: start && day >= start ? "zero" : "none" };
  });
}

/** Valgt måling pr. dag: "dkk", "calls" eller "tokens". */
export const metricOf = (d, metric) => (metric === "calls" ? d.calls : metric === "tokens" ? d.tokens : d.dkk);

// ── Usædvanlige dage ────────────────────────────────────────────────────────────────────────────────────────────────────
export const ANOMALY_MIN_DAYS = 7; // mindst så mange dage med data, før noget mærkes
export const ANOMALY_FACTOR = 3; // mindst så mange gange medianen
export const ANOMALY_MIN_EXTRA_DKK = 1; // og mindst så mange kroner over medianen

const median = (xs) => { if (!xs.length) return 0; const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/**
 * Dage, hvor forbruget er markant højere end normalt (mindst 3 × medianen af øvrige dage og 1 kr. over). Kræver mindst 7 dage med data.
 * Årsagen er kun mange kald, dyre kald eller begge, når tallene viser det; ellers "ukendt" (aldrig et gæt). Funktionen, der bidrog mest, medtages.
 * @param {UsageRow[]} rows
 */
export function findAnomalies(rows) {
  const days = byDay(rows);
  if (days.length < ANOMALY_MIN_DAYS) return { enough: false, daysWithData: days.length, flagged: /** @type {any[]} */ ([]) };
  const flagged = [];
  for (const d of days) {
    const others = days.filter((o) => o.key !== d.key);
    const mDkk = median(others.map((o) => o.dkk));
    if (!(d.dkk >= ANOMALY_FACTOR * mDkk && d.dkk - mDkk >= ANOMALY_MIN_EXTRA_DKK)) continue;
    const mCalls = median(others.map((o) => o.calls));
    const mPer = median(others.filter((o) => o.calls > 0).map((o) => o.dkk / o.calls));
    const callsRatio = mCalls > 0 ? d.calls / mCalls : null;
    const perRatio = mPer > 0 && d.calls > 0 ? d.dkk / d.calls / mPer : null;
    const many = callsRatio !== null && callsRatio >= 2, dear = perRatio !== null && perRatio >= 2;
    const cause = many && dear ? "begge" : many ? "mange" : dear ? "dyre" : "ukendt";
    const fns = byFunction(d.rows).filter((f) => f.dkk > 0).slice(0, 3).map((f) => ({ key: f.key, dkk: f.dkk, calls: f.calls }));
    const top = fns[0];
    flagged.push({ day: d.key, dkk: d.dkk, median: mDkk, cause, topFunction: top ? top.key : null, functions: fns, internalTop: top ? INTERNAL_FUNCTIONS.includes(top.key) : false });
  }
  return { enough: true, daysWithData: days.length, flagged };
}

// ── Budget ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
/**
 * Status for månedsbudgettet. budget: { monthly_dkk, warn_1, warn_2 } eller null.
 * @param {{ monthly_dkk?: number|string, warn_1?: number, warn_2?: number } | null | undefined} budget @param {number} spent
 */
export function budgetStatus(budget, spent) {
  const total = budget ? Number(budget.monthly_dkk) : 0;
  if (!budget || !(total > 0)) return null;
  const w1 = Number(budget.warn_1 || 80), w2 = Number(budget.warn_2 || 100);
  const used = spent / total;
  const level = used * 100 >= w2 ? "over" : used * 100 >= w1 ? "warn" : "ok";
  return { total, spent, left: total - spent, used, level, warn1: w1, warn2: w2 };
}

// ── Formattering ────────────────────────────────────────────────────────────────────────────────────────────────────────
export function formatKr(v) {
  return v.toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " kr.";
}
/** Pris pr. kald: under 1 kr. i øre (0,97 øre), ellers i kroner. Flere decimaler kun, hvor de skelner (under 10 øre: to; ellers én). @param {number|null|undefined} dkk */
export function formatPerCall(dkk) {
  if (dkk === null || dkk === undefined || !Number.isFinite(dkk)) return "–";
  if (dkk >= 1) return formatKr(dkk);
  const ore = dkk * 100;
  const digits = ore < 10 ? 2 : 1;
  return `${ore.toLocaleString("da-DK", { minimumFractionDigits: digits, maximumFractionDigits: digits })} øre`;
}
export const formatNum = (n) => Number(n).toLocaleString("da-DK");
/** Tokens kort: 1.234 → "1.234", 1.514.471 → "1,51 mio.". */
export const formatTokens = (n) => (n >= 1e6 ? `${(n / 1e6).toLocaleString("da-DK", { maximumFractionDigits: 2 })} mio.` : formatNum(n));
export const formatPct = (p, digits = 1) => (p === null || p === undefined ? "–" : `${(p * 100).toLocaleString("da-DK", { minimumFractionDigits: 0, maximumFractionDigits: digits })} %`);
const MONTHS = ["januar", "februar", "marts", "april", "maj", "juni", "juli", "august", "september", "oktober", "november", "december"];
export const monthLabel = (k) => `${MONTHS[Number(k.slice(5, 7)) - 1]} ${k.slice(0, 4)}`;
const SHORT = ["jan.", "feb.", "mar.", "apr.", "maj", "jun.", "jul.", "aug.", "sep.", "okt.", "nov.", "dec."];
export const dayLabelShort = (k) => `${Number(k.slice(8, 10))}. ${SHORT[Number(k.slice(5, 7)) - 1]}`;
export const dayLabelLong = (k) => `${Number(k.slice(8, 10))}. ${MONTHS[Number(k.slice(5, 7)) - 1]} ${k.slice(0, 4)}`;

// ── Diagramskala ────────────────────────────────────────────────────────────────────────────────────────────────────────
export const FOCUS_FACTOR = 4; // en dag er "meget højere", når den er mindst så mange gange medianen af dage med forbrug
export const FOCUS_MIN_DAYS = 3; // mindst så mange dage med forbrug, før en fokuseret skala giver mening

/**
 * Mulighed for at fokusere på almindelige forbrugsdage. Dage mindst 4 × medianen (af dage med forbrug) regnes som udsving; skalaen sættes til
 * 120 % af den højeste almindelige dag. Udsvingsdagene tegnes i fuld højde og markeres som afkortet; deres rigtige værdi vises altid i detaljerne.
 * @param {number[]} values værdier pr. dag (kun dage med forbrug > 0 tæller)
 * @returns {{ possible: boolean, cap: number, outliers: number[] }} outliers = indeks i values
 */
export function focusScale(values) {
  const pos = values.filter((v) => v > 0);
  if (pos.length < FOCUS_MIN_DAYS) return { possible: false, cap: 0, outliers: [] };
  const m = median(pos);
  const limit = FOCUS_FACTOR * m;
  const normal = pos.filter((v) => v < limit);
  const outliers = values.map((v, i) => (v >= limit ? i : -1)).filter((i) => i >= 0);
  if (!outliers.length || !normal.length) return { possible: false, cap: 0, outliers: [] };
  return { possible: true, cap: Math.max(...normal) * 1.2, outliers };
}
