// Næringsindhold fra en brugerindsendelse (felter som tekst: energy, fat, saturated, carbs, sugars, protein, salt)
// til det format, resultatsiden læser (energy_kcal, fat, saturated_fat, carbohydrates, sugars, protein, salt, som tal).
// Test: src/nutrition.test.js.

const FIELDS = [
  ["fat", ["fat"]],
  ["saturated_fat", ["saturated_fat", "saturated"]],
  ["carbohydrates", ["carbohydrates", "carbs"]],
  ["sugars", ["sugars"]],
  ["fiber", ["fiber"]],
  ["protein", ["protein"]],
  ["salt", ["salt"]],
];

function toNumber(v) {
  if (typeof v === "number") return Number.isFinite(v) && v >= 0 ? v : null;
  if (typeof v !== "string") return null;
  const m = v.replace(",", ".").match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

// "1560/373", "1560 kJ / 373 kcal", "373 kcal", "1560 kJ" eller et tal (regnes som kcal)
export function parseEnergyKcal(v) {
  if (typeof v === "number") return Number.isFinite(v) && v >= 0 ? Math.round(v) : null;
  if (typeof v !== "string") return null;
  const s = v.replace(/,/g, ".");
  const kcal = s.match(/(\d+(?:\.\d+)?)\s*kcal/i);
  if (kcal) return Math.round(Number(kcal[1]));
  const nums = s.match(/\d+(?:\.\d+)?/g);
  if (!nums) return null;
  if (nums.length >= 2 && /\//.test(s)) return Math.round(Number(nums[1])); // kJ/kcal
  const kj = s.match(/(\d+(?:\.\d+)?)\s*kj/i);
  if (kj) return Math.round(Number(kj[1]) / 4.184);
  return Math.round(Number(nums[0]));
}

// Returnerer null, hvis intet felt kan aflæses. Accepterer både indsendelsens og resultatsidens nøgler.
export function normalizeNutrition(raw) {
  if (!raw || typeof raw !== "object") return null;
  const out = {};
  const kcal = parseEnergyKcal(raw.energy_kcal ?? raw.energy);
  if (kcal != null) out.energy_kcal = kcal;
  for (const [key, aliases] of FIELDS) {
    for (const a of aliases) {
      const n = toNumber(raw[a]);
      if (n != null) { out[key] = n; break; }
    }
  }
  return Object.keys(out).length ? out : null;
}
