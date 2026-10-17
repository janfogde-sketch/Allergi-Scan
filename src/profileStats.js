// @ts-nocheck
// Tallene i "Din aktivitet" på Profil. Hver scanning tælles én gang, uanset hvor mange advarsler den gav, og vurderes som i Historik (historyEval.js):
// - Scanninger i alt: scanninger (ikke opslag via søgning), også dem uden fundet produkt.
// - Scanninger med advarsel: mindst én konflikt eller ét spor-signal for de valgte personer.
// - Scanninger uden registrerede konflikter: kun når vurderingen er grøn mod produktets NUVÆRENDE allergendata. Ukendte, ikke-vurderbare, historiske
//   (produktet har ikke længere flag) og scanninger uden valgte fødevarehensyn tæller aldrig som konfliktfri.
// Historikken hentes 50 ad gangen, så ved 50 poster er tallene opgjort for de seneste (truncated), og siden viser det.
import { historyVia } from "./helpers.js";
import { evaluateHistoryEntry } from "./historyEval.js";

export const HISTORY_PAGE_SIZE = 50;

/** @param {any[]} history @param {any} ctx */
export function computeScanStats(history, ctx) {
  let total = 0, withWarning = 0, withoutConflict = 0;
  for (const h of history || []) {
    if (historyVia(h) !== "scan") continue;
    total += 1;
    const e = evaluateHistoryEntry(h, ctx);
    if (e.kind !== "evaluated") continue;
    const level = e.ev.level;
    if (level === "danger" || level === "warn") withWarning += 1;
    else if (level === "safe" && e.hasLive) withoutConflict += 1;
  }
  return { total, withWarning, withoutConflict, truncated: (history || []).length >= HISTORY_PAGE_SIZE };
}
