// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// nutrition-backfill — Supabase Edge Function
// Kører via cron (hvert 2. minut, kun mens der er produkter tilbage). Tager et lille parti
// produkter med gyldig stregkode, hvor kulhydrat eller mættet fedt mangler, slår dem op på
// Open Food Facts og udfylder KUN felter, der mangler og som OFF har dokumenteret.
// Aldrig beregnede værdier, aldrig 0 som pladsholder, aldrig overskrivning af eksisterende tal.
// Hver stregkode markeres (nutrition_off_checked_at), så den kun slås op én gang.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "jsr:@supabase/supabase-js@2.117.2";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OFF_API              = "https://world.openfoodfacts.org/api/v2/product";
const BATCH                = 60;
const DELAY_MS             = 600; // OFF tillader ca. 100 produktopslag pr. minut

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// OFF-nøgle -> vores nøgle
const FIELDS: Record<string, string> = {
  "energy-kj": "energy_kj",
  "energy-kcal": "energy_kcal",
  "fat": "fat",
  "saturated-fat": "saturated_fat",
  "carbohydrates": "carbohydrates",
  "sugars": "sugars",
  "fiber": "fiber",
  "proteins": "protein",
  "salt": "salt",
};

function offValues(nutriments: any): Record<string, number> {
  const out: Record<string, number> = {};
  if (!nutriments) return out;
  for (const [offKey, key] of Object.entries(FIELDS)) {
    const raw = nutriments[`${offKey}_100g`];
    if (raw == null || raw === "") continue;
    const v = Math.round(parseFloat(raw) * 100) / 100;
    if (!Number.isFinite(v) || v < 0) continue;
    if (key !== "energy_kj" && key !== "energy_kcal" && v > 100) continue; // umuligt pr. 100 g
    out[key] = v;
  }
  // Konsistens: delmængder kan ikke overstige helheden
  if (out.saturated_fat != null && out.fat != null && out.saturated_fat > out.fat + 0.05) delete out.saturated_fat;
  if (out.sugars != null && out.carbohydrates != null && out.sugars > out.carbohydrates + 0.05) delete out.sugars;
  return out;
}

const missing = (v: any) => v == null || v === "";

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  const isCron = !!SUPABASE_SERVICE_KEY && authHeader === `Bearer ${SUPABASE_SERVICE_KEY}`;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  if (!isCron) {
    if (!authHeader) return Response.json({ error: "Ikke autoriseret" }, { status: 401 });
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) return Response.json({ error: "Ugyldig token" }, { status: 401 });
    const { data: profile } = await supabase.from("users").select("role").eq("id", caller.id).single();
    if (profile?.role !== "admin") return Response.json({ error: "Adgang nægtet — kun admin" }, { status: 403 });
  }

  const stats = { checked: 0, filled: 0, not_on_off: 0, nothing_new: 0, error: 0 };
  try {
    const { data: rows, error } = await supabase.rpc("nutrition_backfill_candidates", { p_limit: BATCH });
    if (error) throw new Error(error.message);

    for (const row of rows ?? []) {
      await sleep(DELAY_MS);
      let found: Record<string, number> | null = null;
      try {
        const res = await fetch(`${OFF_API}/${row.ean}.json?fields=code,nutriments`, {
          headers: { "User-Agent": "EatSafe/1.0 (hej@eatsafe.dk)" },
        });
        if (res.status === 429 || res.status >= 500) { stats.error++; continue; } // prøves igen næste gang
        const data = await res.json();
        found = data.status === 1 ? offValues(data.product?.nutriments) : null;
        if (data.status !== 1) stats.not_on_off++;
      } catch {
        stats.error++;
        continue;
      }
      stats.checked++;

      const current = (row.nutrition && typeof row.nutrition === "object") ? row.nutrition : {};
      const merged: Record<string, any> = { ...current };
      let changed = false;
      for (const [k, v] of Object.entries(found ?? {})) {
        if (missing(merged[k])) { merged[k] = v; changed = true; }
      }
      const patch: any = { nutrition_off_checked_at: new Date().toISOString() };
      if (changed) { patch.nutrition = merged; stats.filled++; }
      else if (found) stats.nothing_new++;
      const { error: upErr } = await supabase.from("products").update(patch).eq("id", row.id);
      if (upErr) stats.error++;
    }
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message, stats }, { status: 500 });
  }
  return Response.json({ ok: true, stats });
});
