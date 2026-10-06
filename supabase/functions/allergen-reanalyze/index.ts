// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// allergen-reanalyze — engangsværktøj til genanalyse af alle produkter efter en
// rettelse af allergenmotoren (kodegennemgang fase 2, K4, 6. okt. 2026).
//
// To trin, så Jan ser præcis det, der skrives, før noget røres:
//   1. { "mode": "dry_run", "after": "<product_id>", "limit": 500 }
//      Kører den nuværende motor (kun nøgleord, ingen Claude) på produkter med
//      ingrediensliste og skriver forskellen i allergen_reanalysis_diff_20261006.
//      Rører IKKE products. Svaret indeholder "next" (næste "after"), til det er null.
//   2. { "mode": "apply", "after": "<product_id>", "limit": 500 }
//      Skriver de godkendte ændringer fra diff-tabellen til products (kun rækker
//      med changed=true og applied_at is null) og markerer dem som anvendt.
// Produkter, hvor Claude har verificeret listen (kilde med "claude"), får pr. allergen
// den mest forsigtige værdi af gammel og ny, så en genkørsel aldrig sænker en
// Claude-verificeret "ja". Rollback: products_allergen_backup_20261006.
//
// Auth (kategori 2 og 4 i .claude/rules/edge-function-auth.md): kun admin-JWT eller service-role.
// ─────────────────────────────────────────────────────────────────────────────
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { analyzeIngredients, liftGlutenFromWheat, ALL_ALLERGENS } from "../_shared/allergenEngine.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const RANK: Record<string, number> = { no: 0, traces: 1, yes: 2 };
const DIFF_TABLE = "allergen_reanalysis_diff_20261006";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const isInternalCall = !!serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`;
  if (!isInternalCall) {
    if (!authHeader) return json({ error: "Ikke autoriseret" }, 401);
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await userClient.auth.getUser();
    const { data: callerRow } = caller
      ? await supabase.from("users").select("role").eq("id", caller.id).single()
      : { data: null };
    if (!caller || callerRow?.role !== "admin") return json({ error: "Ikke autoriseret" }, 401);
  }

  try {
    const { mode, after = null, limit = 500 } = await req.json().catch(() => ({}));
    const batch = Math.min(Number(limit) || 500, 1000);
    if (mode !== "dry_run" && mode !== "apply") return json({ error: "mode skal være dry_run eller apply" }, 400);

    if (mode === "dry_run") {
      let q = supabase
        .from("products")
        .select("id, ean, ingredients_text, allergen_flags, allergen_quality, allergen_source_method")
        .not("ingredients_text", "is", null)
        .neq("ingredients_text", "")
        .order("id", { ascending: true })
        .limit(batch);
      if (after) q = q.gt("id", after);
      const { data: products, error } = await q;
      if (error) throw error;

      const rows = (products ?? []).map((p) => {
        const old = p.allergen_flags ?? {};
        const fresh = liftGlutenFromWheat(analyzeIngredients(p.ingredients_text));
        const verifiedByClaude = String(p.allergen_source_method ?? "").includes("claude");
        const next: Record<string, string> = { ...old };
        for (const a of ALL_ALLERGENS) {
          const o = old[a] ?? "no";
          const n = fresh[a] ?? "no";
          // Claude-verificerede produkter: mest forsigtige værdi vinder.
          next[a] = verifiedByClaude && (RANK[o] ?? 0) > (RANK[n] ?? 0) ? o : n;
        }
        const changed = ALL_ALLERGENS.some((a) => (old[a] ?? "no") !== next[a]);
        return {
          product_id: p.id, ean: p.ean, old_flags: old, new_flags: next,
          old_quality: p.allergen_quality, old_method: p.allergen_source_method,
          changed, applied_at: null,
        };
      });
      if (rows.length) {
        const { error: upErr } = await supabase.from(DIFF_TABLE).upsert(rows, { onConflict: "product_id" });
        if (upErr) throw upErr;
      }
      return json({
        mode, processed: rows.length, changed: rows.filter((r) => r.changed).length,
        next: rows.length === batch ? rows[rows.length - 1].product_id : null,
      });
    }

    // apply: skriv godkendte ændringer
    let q = supabase
      .from(DIFF_TABLE)
      .select("product_id, new_flags, old_method")
      .eq("changed", true)
      .is("applied_at", null)
      .order("product_id", { ascending: true })
      .limit(batch);
    if (after) q = q.gt("product_id", after);
    const { data: rows, error } = await q;
    if (error) throw error;

    let applied = 0, errors = 0;
    for (const r of rows ?? []) {
      const { error: uErr } = await supabase
        .from("products")
        .update({
          allergen_flags: r.new_flags,
          allergen_quality: String(r.old_method ?? "").includes("claude") ? "high" : "medium",
          allergen_source_method: r.old_method ?? "keyword",
          reparsed_at: new Date().toISOString(),
        })
        .eq("id", r.product_id);
      if (uErr) { errors++; continue; }
      await supabase.from(DIFF_TABLE).update({ applied_at: new Date().toISOString() }).eq("product_id", r.product_id);
      applied++;
    }
    return json({
      mode, applied, errors,
      next: (rows ?? []).length === batch ? rows[rows.length - 1].product_id : null,
    });
  } catch (e) {
    console.error("allergen-reanalyze fejl:", e);
    return json({ error: String(e) }, 500);
  }
});
