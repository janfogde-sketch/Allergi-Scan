// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// nutrition-backfill-nemlig — Supabase Edge Function
// Nemlig-varer har kun interne numre (NEMLIG-...), så EAN-jobbet nutrition-backfill kan ikke slå dem op.
// Her søges på navn + mærke hos Open Food Facts, og en kandidat accepteres KUN, hvis mærket passer, og
// varens egne tal (kcal, fedt, evt. kulhydrat) stemmer med kandidatens (se _shared/nutritionMatch.js).
// Udfylder kun felter, der mangler. Aldrig overskrivning, aldrig gæt. Billeder røres ikke.
// Kører via cron (hvert 2. minut, kun mens der er varer tilbage). Hver vare slås op én gang.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "jsr:@supabase/supabase-js@2.117.2";
import { pickSafeMatch, fillMissing } from "../_shared/nutritionMatch.js";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OFF_SEARCH           = "https://search.openfoodfacts.org/search";
const BATCH                = 40;
const DELAY_MS             = 800;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

  const stats = { checked: 0, filled: 0, no_match: 0, error: 0 };
  try {
    const { data: rows, error } = await supabase.rpc("nutrition_nemlig_candidates", { p_limit: BATCH });
    if (error) throw new Error(error.message);

    for (const row of rows ?? []) {
      await sleep(DELAY_MS);
      let hits: any[] = [];
      try {
        const q = encodeURIComponent(`${row.name} ${row.brand}`);
        const res = await fetch(`${OFF_SEARCH}?q=${q}&page_size=10&fields=code,product_name,brands,nutriments`, {
          headers: { "User-Agent": "EatSafe/1.0 (hej@eatsafe.dk)" },
        });
        if (res.status === 429 || res.status >= 500) { stats.error++; continue; } // prøves igen næste gang
        hits = (await res.json()).hits ?? [];
      } catch {
        stats.error++;
        continue;
      }
      stats.checked++;

      const match = pickSafeMatch(row, hits);
      const patch: any = { nutrition_name_checked_at: new Date().toISOString() };
      if (match) {
        const { merged, changed } = fillMissing(row.nutrition, match.values);
        if (changed) { patch.nutrition = merged; stats.filled++; } else stats.no_match++;
      } else stats.no_match++;
      const { error: upErr } = await supabase.from("products").update(patch).eq("id", row.id);
      if (upErr) stats.error++;
    }
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message, stats }, { status: 500 });
  }
  return Response.json({ ok: true, stats });
});
