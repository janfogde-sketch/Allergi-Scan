// Pris og opsummering for Claude Haiku-forbruget (tabellen ai_usage_daily).
// Haiku 4.5: 1 dollar pr. million input-tokens og 5 dollar pr. million output-tokens (Anthropics prisliste, 7. okt. 2026).
// Skifter prisen eller kursen, rettes de to konstanter her.
export const HAIKU_USD_PER_M_INPUT = 1;
export const HAIKU_USD_PER_M_OUTPUT = 5;
export const USD_TO_DKK = 6.9;

export const FUNCTION_LABELS = {
  ocr: "Læsning af fotos",
  allergens: "Allergen-tjek",
  "classify-categories": "Kategorisering",
};

export function costDkk(inputTokens, outputTokens) {
  const usd = (inputTokens / 1e6) * HAIKU_USD_PER_M_INPUT + (outputTokens / 1e6) * HAIKU_USD_PER_M_OUTPUT;
  return usd * USD_TO_DKK;
}

const sum = (rows) => rows.reduce((a, r) => ({
  calls: a.calls + Number(r.calls || 0),
  input: a.input + Number(r.input_tokens || 0),
  output: a.output + Number(r.output_tokens || 0),
}), { calls: 0, input: 0, output: 0 });

// rows: [{day:"2026-10-07", function_name, calls, input_tokens, output_tokens}] -> {calls, input, output, dkk}
export function totals(rows) {
  const t = sum(rows);
  return { ...t, dkk: costDkk(t.input, t.output) };
}

// Grupperer på en nøgle (dag, måned eller funktion), nyeste først for dag/måned.
export function groupBy(rows, keyFn) {
  const map = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(r);
  }
  return [...map.entries()].map(([key, rs]) => ({ key, ...totals(rs) }));
}

export const byDay = (rows) => groupBy(rows, r => r.day).sort((a, b) => (a.key < b.key ? 1 : -1));
export const byMonth = (rows) => groupBy(rows, r => String(r.day).slice(0, 7)).sort((a, b) => (a.key < b.key ? 1 : -1));
export const byFunction = (rows) => groupBy(rows, r => r.function_name).sort((a, b) => b.dkk - a.dkk);

export function currentMonthRows(rows, todayIso) {
  return rows.filter(r => String(r.day).startsWith(todayIso.slice(0, 7)));
}

export function formatKr(v) {
  return v.toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " kr.";
}
export const formatNum = (n) => Number(n).toLocaleString("da-DK");
