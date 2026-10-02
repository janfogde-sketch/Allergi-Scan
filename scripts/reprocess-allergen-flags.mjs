// Genberegner products.allergen_flags med den nuværende motor (supabase/functions/_shared/allergenEngine.js).
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/reprocess-allergen-flags.mjs          (tørkørsel, skriver intet)
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/reprocess-allergen-flags.mjs --apply  (skriver)
//
// Regler: producent-verificerede produkter og pladsholder-ingredienser (tekst = navn) røres ikke.
// Rækker læst af Claude (`keyword+claude`) kan kun få HØJERE risiko (aldrig lavere), så AI-fund ikke går tabt.
// Øvrige rækker får motorens nye resultat. OBS: trigger `on_products_allergen_change` lægger en P1-hændelse i
// outboxen for hvert flag, der får højere risiko (push/mail til berørte brugere). Kør derfor kun --apply efter aftale.
import { analyzeIngredients, liftGlutenFromWheat, looksNonDanish } from "../supabase/functions/_shared/allergenEngine.js";

const URL = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error("SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY skal være sat."); process.exit(1); }
const APPLY = process.argv.includes("--apply");
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const rank = (v) => v === "yes" || v === true ? 3 : v === "traces" ? 2 : v === "no" || v === false ? 1 : 0;
const norm = (t) => (t || "").toLowerCase().replace(/[^a-zæøåäöü0-9]+/g, " ").trim();

const stats = { read: 0, skipped: 0, changed: 0, raised: 0, lowered: 0, written: 0 };
const examples = [];
let after = "00000000-0000-0000-0000-000000000000";
for (;;) {
  const q = `${URL}/rest/v1/products?select=id,ean,name,ingredients_text,allergen_flags,allergen_source_method,verified_status,source&ingredients_text=not.is.null&id=gt.${after}&order=id&limit=500`;
  const rows = await (await fetch(q, { headers: H })).json();
  if (!Array.isArray(rows)) { console.error(rows); process.exit(1); }
  if (rows.length === 0) break;
  after = rows[rows.length - 1].id;
  for (const p of rows) {
    stats.read++;
    const text = (p.ingredients_text || "").trim();
    if (!text || p.verified_status === "verified" || p.source === "producer" || norm(text) === norm(p.name)) { stats.skipped++; continue; }
    const claude = /claude/.test(p.allergen_source_method || "");
    const old = p.allergen_flags || {};
    let next = analyzeIngredients(text);
    if (!claude && looksNonDanish(text)) for (const k of Object.keys(next)) if (next[k] === "no") next[k] = "unknown";
    next = liftGlutenFromWheat(next);
    if (claude) for (const k of Object.keys(next)) if (rank(old[k]) > rank(next[k])) next[k] = old[k];
    const diffs = Object.keys(next).filter((k) => (old[k] ?? "unknown") !== next[k] && !(old[k] === false && next[k] === "no"));
    if (diffs.length === 0) continue;
    stats.changed++;
    if (diffs.some((k) => rank(next[k]) > rank(old[k]))) stats.raised++;
    if (diffs.some((k) => rank(next[k]) < rank(old[k]))) stats.lowered++;
    if (examples.length < 40) examples.push(`${p.ean} ${p.name}: ${diffs.map((k) => `${k} ${old[k] ?? "-"}→${next[k]}`).join(", ")}`);
    if (APPLY) {
      const r = await fetch(`${URL}/rest/v1/products?id=eq.${p.id}`, { method: "PATCH", headers: H, body: JSON.stringify({ allergen_flags: next }) });
      if (r.ok) stats.written++; else console.error("Fejl", p.id, await r.text());
    }
  }
}
console.log(examples.join("\n"));
console.log(APPLY ? "ANVENDT" : "TØRKØRSEL", stats);
