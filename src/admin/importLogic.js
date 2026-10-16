// @ts-check
// Ren logik til siden "Dataimport": kørselsstatus, tællere pr. kørselstype, næste planlagte kørsel i dansk tid og forståelige fejltekster. Intet her ændrer data.
export const JOBS = /** @type {Record<string, { label: string, hourUtc: number, fn: string }>} */ ({
  off_import: { label: "Produktimport fra Open Food Facts", hourUtc: 2, fn: "auto-import-off" },
  reanalyze: { label: "Genanalysér allergener", hourUtc: 3, fn: "auto-reparse" },
});
export const MANUAL_REANALYZE_LIMIT = 25;
export const IMPORT_LIMIT = 50;

export const RUN_STATUS_LABEL = /** @type {Record<string, string>} */ ({ idle: "Klar", running: "I gang", ok: "Gennemført", partial: "Delvist gennemført", failed: "Fejlet" });
export const RUN_STATUS_PILL = /** @type {Record<string, string>} */ ({ idle: "admin-pill-neutral", running: "admin-pill-blue", ok: "admin-pill-green", partial: "admin-pill-amber", failed: "admin-pill-red" });
export const TRIGGER_LABEL = /** @type {Record<string, string>} */ ({ cron: "Automatisk", manual: "Manuel" });

/** Status for en kørselstype: i gang hvis en kørsel er i gang, ellers resultatet af den seneste, ellers Klar. @param {any[]} runs nyeste først @param {string} job */
export function jobStatus(runs, job) {
  const last = (runs || []).find((r) => r.job === job);
  return { last: last || null, status: last ? (last.status === "running" ? "running" : last.status) : "idle" };
}

/** Tællere der vises for en kørsel. Manglende tal vises som "–", aldrig som 0. @param {string} job @param {Record<string, number>|null|undefined} c */
export function countTiles(job, c) {
  const n = (/** @type {string} */ k) => (c && typeof c[k] === "number" ? c[k] : null);
  if (job === "off_import") return /** @type {Array<[string, number|null]>} */ ([
    ["Forsøgte opslag", n("attempted")], ["Fundet", n("found")], ["Importeret", n("imported")], ["Fandtes allerede", n("already_exists")], ["Ikke fundet", n("not_on_off")], ["Fejl", n("error")],
  ]);
  return /** @type {Array<[string, number|null]>} */ ([
    ["Behandlet", n("processed")], ["Genanalyseret", n("reparsed")], ["Allergen hævet", n("changed")], ["AI-kald", n("ai_calls")], ["Sprunget over", n("skipped")], ["Fejl", n("errors")],
  ]);
}

/** Næste planlagte kørsel (hver dag kl. hourUtc UTC) som tidspunkt. Visning i dansk tid sker med Intl, så sommer-/vintertid håndteres. @param {number} hourUtc @param {Date} now */
export function nextRun(hourUtc, now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hourUtc, 0, 0));
  if (d.getTime() <= now.getTime()) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}
/** @param {Date|string|null|undefined} v */
export function fmtLocal(v) {
  if (!v) return "–";
  return new Intl.DateTimeFormat("da-DK", { timeZone: "Europe/Copenhagen", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(v));
}
/** @param {Date|string|null|undefined} v */
export function fmtLocalFull(v) {
  if (!v) return "–";
  return new Intl.DateTimeFormat("da-DK", { timeZone: "Europe/Copenhagen", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short" }).format(new Date(v));
}

/** Varighed i sekunder. @param {any} run */
export function durationSec(run) {
  if (!run?.finished_at || !run?.started_at) return null;
  return Math.max(0, Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000));
}

/** Forståelig fejltekst; den tekniske kode ligger i detaljerne. @param {string|null|undefined} code */
export function errorText(code) {
  if (!code) return "";
  if (code === "afbrudt") return "Kørslen blev afbrudt, før den nåede at blive færdig.";
  return "Kørslen fejlede. Se tekniske oplysninger.";
}

/** Samlet beskrivelse af en kørsel til listen. @param {any} run */
export function runSummary(run) {
  const c = run.counts || {};
  if (run.status === "running") return "Kørslen er i gang";
  if (c.nothing_to_do) return run.job === "off_import" ? "Ingen kvalificerede manglende stregkoder" : "Ingen produkter at genanalysere";
  if (run.job === "off_import") return `${c.imported ?? 0} importeret af ${c.attempted ?? 0} forsøgte${c.error ? `, ${c.error} fejl` : ""}`;
  return `${c.reparsed ?? 0} genanalyseret af ${c.processed ?? 0}${c.error || c.errors ? `, ${c.errors ?? c.error} fejl` : ""}`;
}
