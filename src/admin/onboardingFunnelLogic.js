// Frafald i første start: gør tallene fra admin_onboarding_funnel() klar til visning.
export const STEP_LABELS = {
  1: "Profil (navn, alder, køn)",
  2: "Allergier og samtykke",
  3: "Spor",
  4: "Familie (valgfrit)",
  5: "Notifikationer (valgfrit)",
};

// data: { total, completed, steps: [{step, stuck, stuck_over_24h}] } -> alle 5 trin, også dem uden nogen.
export function summarizeFunnel(data) {
  const total = Number(data?.total || 0);
  const completed = Number(data?.completed || 0);
  const byStep = new Map((data?.steps || []).map(s => [Number(s.step), s]));
  const steps = [1, 2, 3, 4, 5].map(step => {
    const s = byStep.get(step) || {};
    return { step, label: STEP_LABELS[step], stuck: Number(s.stuck || 0), stuckOld: Number(s.stuck_over_24h || 0) };
  });
  const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);
  return { total, completed, completedPct: pct(completed), steps: steps.map(s => ({ ...s, pct: pct(s.stuck) })) };
}
