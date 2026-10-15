// Sikker navnematch af næringsværdier (katalogvarer uden rigtig stregkode).
// En Open Food Facts-kandidat accepteres kun, hvis mærket passer, og de tal varen allerede har
// (kcal, fedt, evt. kulhydrat) stemmer med kandidatens. Så udfyldes kun tomme felter, aldrig gæt.

const FIELDS = {
  "energy-kj": "energy_kj", "energy-kcal": "energy_kcal", "fat": "fat", "saturated-fat": "saturated_fat",
  "carbohydrates": "carbohydrates", "sugars": "sugars", "fiber": "fiber", "proteins": "protein", "salt": "salt",
};

export function offValues(nutriments) {
  const out = {};
  if (!nutriments) return out;
  for (const [offKey, key] of Object.entries(FIELDS)) {
    const raw = nutriments[`${offKey}_100g`];
    if (raw == null || raw === "") continue;
    const v = Math.round(parseFloat(raw) * 100) / 100;
    if (!Number.isFinite(v) || v < 0) continue;
    if (key !== "energy_kj" && key !== "energy_kcal" && v > 100) continue;
    out[key] = v;
  }
  if (out.saturated_fat != null && out.fat != null && out.saturated_fat > out.fat + 0.05) delete out.saturated_fat;
  if (out.sugars != null && out.carbohydrates != null && out.sugars > out.carbohydrates + 0.05) delete out.sugars;
  return out;
}

const norm = (s) => String(s ?? "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9æøå ]/g, " ").trim();
const num = (v) => (v == null || v === "" ? null : Number(v));
const close = (a, b, abs, rel) => Math.abs(a - b) <= Math.max(abs, rel * Math.abs(b));

export function brandMatches(brand, hitBrands) {
  const b = norm(brand);
  if (!b) return false;
  const list = (Array.isArray(hitBrands) ? hitBrands : String(hitBrands ?? "").split(",")).map(norm).filter(Boolean);
  return list.some((h) => h === b || h.includes(b) || b.includes(h));
}

// Kan varen overhovedet matches sikkert? Kræver mærke samt kcal (mindst 20) og fedt som fingeraftryk.
export function isMatchable(product) {
  const n = product.nutrition ?? {};
  return !!norm(product.brand) && num(n.energy_kcal) != null && num(n.energy_kcal) >= 20 && num(n.fat) != null;
}

// Returnerer { code, values } for en sikker kandidat, ellers null.
export function pickSafeMatch(product, hits) {
  if (!isMatchable(product)) return null;
  const n = product.nutrition;
  const matches = [];
  for (const h of hits ?? []) {
    if (!brandMatches(product.brand, h.brands)) continue;
    const v = offValues(h.nutriments);
    if (v.energy_kcal == null || v.fat == null) continue;
    if (!close(v.energy_kcal, num(n.energy_kcal), 5, 0.05)) continue;
    if (!close(v.fat, num(n.fat), 0.5, 0.1)) continue;
    if (num(n.carbohydrates) != null && (v.carbohydrates == null || !close(v.carbohydrates, num(n.carbohydrates), 1, 0.1))) continue;
    matches.push({ code: h.code, values: v });
  }
  if (matches.length === 0) return null;
  // To passende kandidater, der er uenige om de felter vi vil udfylde, er tvetydige: spring over.
  for (const k of ["saturated_fat", "carbohydrates"]) {
    const vals = matches.map((m) => m.values[k]).filter((x) => x != null);
    if (vals.length > 1 && Math.max(...vals) - Math.min(...vals) > Math.max(0.5, 0.1 * Math.max(...vals))) return null;
  }
  return matches[0];
}

// Udfyld KUN felter, der mangler. Returnerer { merged, changed }.
export function fillMissing(current, values) {
  const merged = { ...(current ?? {}) };
  let changed = false;
  for (const [k, v] of Object.entries(values ?? {})) {
    if (merged[k] == null || merged[k] === "") { merged[k] = v; changed = true; }
  }
  return { merged, changed };
}
