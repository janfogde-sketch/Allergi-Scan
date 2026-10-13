// @ts-check
// Dashboardets tal og grafer (13. okt. 2026): alle døgn regnes i dansk tid (Europe/Copenhagen), så "i dag", dagsgrafer og perioder bygger på samme dag.
// Tidligere blev dagene nøglet på UTC-datoen af en lokal midnat, så den seneste søjle var i går og dagens scanninger manglede i grafen.
//
// Definitioner:
//   Scanning        = en række i scan_history med found_via = 'scan' (kamera eller indtastet kode). Hvert opslag tæller, også gentagelser af samme produkt.
//   Søgeåbning      = en række i scan_history med found_via = 'search' (valgt i søgning, åbnet fra Favoritter, alternativer eller beskeder).
//   Ny bruger       = en række i users efter created_at (kontoen er oprettet; inkluderer admin- og testkonti, der ikke kan skelnes i data).
//   Familiemedlem   = en række i family_members (profil uden egen konto, i praksis børneprofiler). Voksne med egen konto tælles som brugere.
const TZ = "Europe/Copenhagen";
const fmt = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ });

/** YYYY-MM-DD i dansk tid for et tidspunkt (Date eller ISO-tekst). */
export function dkDayKey(/** @type {Date | string | number} */ when) {
  return fmt.format(new Date(when));
}

/** Dagsnøgle `days` dage før en given nøgle. */
export function shiftDayKey(/** @type {string} */ key, /** @type {number} */ days) {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Det UTC-tidspunkt (ISO), hvor en dansk dag begynder (midnat dansk tid). */
export function dkDayStartISO(/** @type {string} */ key) {
  const t0 = Date.parse(`${key}T00:00:00Z`);
  for (const offsetH of [2, 1, 3, 0]) {
    const cand = t0 - offsetH * 3600_000;
    if (dkDayKey(cand) === key && dkDayKey(cand - 1) !== key) return new Date(cand).toISOString();
  }
  return new Date(t0).toISOString();
}

/** Dags-buckets for de seneste `days` danske dage (inkl. i dag); tomme dage er 0, så grafen altid har præcis `days` punkter. */
export function bucketByDkDay(/** @type {any[]} */ rows, /** @type {string} */ field, /** @type {number} */ days, /** @type {Date} */ now = new Date()) {
  const todayKey = dkDayKey(now);
  /** @type {Record<string, number>} */
  const buckets = {};
  for (let i = days - 1; i >= 0; i--) buckets[shiftDayKey(todayKey, -i)] = 0;
  for (const row of rows || []) {
    const v = row?.[field];
    if (!v) continue;
    const key = dkDayKey(v);
    if (key in buckets) buckets[key]++;
  }
  return Object.entries(buckets).map(([date, count]) => ({ date, count }));
}

/** Sidste N punkter af en dagsserie (til periodevalg 7/14/30). */
export const lastDays = (/** @type {{date:string,count:number}[]} */ series, /** @type {number} */ n) => (series || []).slice(-n);

/** Dansk talformat: 20182 -> "20.182". */
export const fmtNum = (/** @type {unknown} */ v) => (typeof v === "number" && Number.isFinite(v) ? v.toLocaleString("da-DK") : "–");

/**
 * Y-akse tilpasset de faktiske værdier: et naturligt trin (1, 2, 4, 5, 10 × 10^n), så skalaen højst runder lidt op over maksimum,
 * og mærkerne er hele tal (ca. tre intervaller). Mærkerne står oppefra og ned, sidst 0. Uden data: 1 og 0.
 */
export function axisScale(/** @type {number} */ max) {
  if (!(max > 0)) return { top: 1, ticks: [1, 0] };
  const raw = Math.max(1, max / 3);
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 4, 5, 10].map((m) => m * pow).find((st) => st >= raw) || 10 * pow;
  const top = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = top; v >= 0; v -= step) ticks.push(v);
  return { top, ticks };
}

/** Hvilke søjler får en datoetiket: højst `maxLabels`, altid første og sidste, så etiketterne ikke overlapper på små skærme. */
export function labelIndexes(/** @type {number} */ n, /** @type {number} */ maxLabels) {
  if (n <= 0) return [];
  if (n <= maxLabels) return Array.from({ length: n }, (_, i) => i);
  const out = [];
  for (let k = 0; k < maxLabels; k++) out.push(Math.round((k * (n - 1)) / (maxLabels - 1)));
  return [...new Set(out)];
}
