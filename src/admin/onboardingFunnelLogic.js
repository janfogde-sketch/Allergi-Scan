// @ts-check
// Frafald i onboarding: gør tallene fra admin_onboarding_stats() klar til visning. Kohorten er konti oprettet i perioden (dansk tid). Statusserne overlapper aldrig:
// gennemført, e-mail ikke bekræftet, ikke startet (ingen registreret fremgang), igangværende (fremgang inden for 24 timer) og muligt frafald (ingen fremgang i over 24 timer).
export const STEP_LABELS = {
  1: "Profil (navn, alder, køn)",
  2: "Allergier og samtykke",
  3: "Spor",
  4: "Familie (valgfrit)",
  5: "Notifikationer (valgfrit)",
};
export const OPTIONAL_STEPS = [4, 5];
export const SMALL_SAMPLE = 30; // under så mange konti vises en forbeholdsbesked
export const TREND_MIN_ACCOUNTS = 20; // udviklingen vises først, når der både er nok konti og nok dage
export const TREND_MIN_DAYS = 14;

/** Andel som tal mellem 0 og 1; null ved 0 i nævneren (aldrig 0 % for "ingen data"). @param {number} n @param {number} d */
export const ratio = (n, d) => (d > 0 ? n / d : null);

/**
 * @param {any} data svaret fra admin_onboarding_stats
 * @returns {null | { total: number, completed: number, completedPct: number | null, inProgress: number, dropout: number, notStarted: number, unconfirmed: number,
 *   reconciled: boolean, small: boolean, testAccounts: number, includeTest: boolean, firstAccount: string | null, steps: Array<{ step: number, label: string, latest: number, inactive: number, pct: number | null, optional: boolean }>,
 *   funnel: Array<{ step: number, label: string, reached: number, continued: number, continuedPct: number | null, optional: boolean }>, funnelUsers: number,
 *   daily: Array<{ date: string, created: number, completed: number }> }}
 */
export function summarizeStats(data) {
  if (!data || typeof data !== "object") return null;
  const n = (/** @type {any} */ v) => Number(v || 0);
  const total = n(data.total), completed = n(data.completed), inProgress = n(data.in_progress), dropout = n(data.possible_dropout);
  const notStarted = n(data.not_started), unconfirmed = n(data.unconfirmed);
  const byStep = new Map((data.steps || []).map((/** @type {any} */ s) => [n(s.step), s]));
  const byFunnel = new Map((data.funnel || []).map((/** @type {any} */ s) => [n(s.step), s]));
  const steps = [1, 2, 3, 4, 5].map((step) => {
    const s = byStep.get(step) || {};
    const latest = n(s.latest);
    return { step, label: STEP_LABELS[/** @type {1} */ (step)], latest, inactive: n(s.inactive), pct: ratio(latest, total), optional: OPTIONAL_STEPS.includes(step) };
  });
  const funnel = [1, 2, 3, 4, 5].map((step) => {
    const f = byFunnel.get(step) || {};
    const reached = n(f.reached), continued = n(f.continued);
    return { step, label: STEP_LABELS[/** @type {1} */ (step)], reached, continued, continuedPct: ratio(continued, reached), optional: OPTIONAL_STEPS.includes(step) };
  });
  return {
    total, completed, completedPct: ratio(completed, total), inProgress, dropout, notStarted, unconfirmed,
    reconciled: completed + inProgress + dropout + notStarted + unconfirmed === total,
    small: total < SMALL_SAMPLE, testAccounts: n(data.test_accounts), includeTest: !!data.include_test, firstAccount: data.first_account || null,
    steps, funnel, funnelUsers: n(data.funnel_users),
    daily: (data.daily || []).map((/** @type {any} */ d) => ({ date: String(d.date), created: n(d.created), completed: n(d.completed) })),
  };
}

/** Er der nok data til en udviklingsvisning? @param {{ total: number, daily: Array<{ date: string }> }} s */
export const trendEnough = (s) => s.total >= TREND_MIN_ACCOUNTS && s.daily.length >= TREND_MIN_DAYS;

/** "91,7 %" med én decimal (kun når den ikke er hel); "–" ved manglende nævner. @param {number|null} p */
export function pctText(p) {
  if (p === null || p === undefined) return "–";
  const v = Math.round(p * 1000) / 10;
  return `${v.toLocaleString("da-DK", { minimumFractionDigits: Number.isInteger(v) ? 0 : 1, maximumFractionDigits: 1 })} %`;
}
