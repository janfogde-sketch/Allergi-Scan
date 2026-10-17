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
//   3. { "mode": "dry_run_down", "after": "<product_id>", "limit": 500 } (G1, 6. okt. 2026)
//      Kun læsning: finder produkter hvor den nuværende motor giver et LAVERE svar end det gemte (ja/spor -> nej)
//      og skriver dem med ingrediensliste i allergen_reanalysis_down_20261006 til gennemgang. Skriver aldrig til products.
//   4. (fjernet 17. okt. 2026) "apply_down" sænkede godkendte felter. Den sænkede 7. okt. flag forkert på varer med allergener
//      (gennemgang 16. okt. 2026, B1/B13), så vejen er fjernet: motoren må kun hæve. Rollback-tabellen products_allergen_down_backup_20261006 beholdes.
//   5. { "mode": "claude_long", "limit": 10 } (8. okt. 2026, opfølgning på #621) kaldes af jobbet allergen-claude-long (service-role).
//      Lader Claude læse lange lister (mindst 200 tegn) uden fund, via allergens (force_ai), så døgnloftet for interne kald gælder.
//      Kun opadgående; gammelt svar gemmes først i allergen_claude_long_20261008. Stopper ved første kald uden Claude (loft/fejl).
// Genanalysen er kun opadgående (Jan, 6. okt. 2026): pr. allergen vinder den mest forsigtige
// værdi af gammel og ny for ALLE produkter, så en genkørsel aldrig sænker et ja/spor. Motoren
// kender ikke fremmedsprog (tarwebloem, mjölk) eller fiskenavne (skrubbe), så nedgange
// (ja→nej, spor→nej, ukendt→nej) afventer en egen gennemgang. Rollback: products_allergen_backup_20261006.
//
// Auth (kategori 2 og 4 i .claude/rules/edge-function-auth.md): kun admin-JWT eller service-role.
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from "jsr:@supabase/supabase-js@2.117.2";
import { logAdminEvent, logAccessDenied, fejlkode } from "../_shared/adminAudit.ts";
import { analyzeIngredients, liftGlutenFromWheat, ALL_ALLERGENS, mergeFlagsUpward } from "../_shared/allergenEngine.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// "unknown" rangerer som "no": et nyt "no" sænker aldrig et gammelt "unknown".
const RANK: Record<string, number> = { unknown: 0, no: 0, traces: 1, yes: 2 };
const DIFF_TABLE = "allergen_reanalysis_diff_20261006";
// Nedgang: "unknown" (ukendt) → "no" tæller også, fordi motoren så svarer "ingen allergen" i stedet for "ukendt".
const DOWN_RANK: Record<string, number> = { no: 0, unknown: 1, traces: 2, yes: 3 };
const DOWN_TABLE = "allergen_reanalysis_down_20261006";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const isInternalCall = !!serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`;
  let actorId = ""; // admin bag et manuelt kald (adminloggen); tom ved systemkald
  if (!isInternalCall) {
    if (!authHeader) return json({ error: "Ikke autoriseret" }, 401);
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await userClient.auth.getUser();
    const { data: callerRow } = caller
      ? await supabase.from("users").select("role").eq("id", caller.id).single()
      : { data: null };
    if (caller && callerRow?.role !== "admin") await logAccessDenied(supabase, caller.id, "allergen-reanalyze");
    if (!caller || callerRow?.role !== "admin") return json({ error: "Ikke autoriseret" }, 401);
    actorId = caller.id;
  }
  const logRun = (mode: string, applied: number, errors: number) => actorId
    ? logAdminEvent(supabase, actorId, "genanalyse_koert", "edge_function", "allergen-reanalyze",
        { funktion: "allergen-reanalyze", tilstand: mode, antal: applied, fejl_antal: errors })
    : Promise.resolve();

  try {
    const { mode, after = null, limit = 500 } = await req.json().catch(() => ({}));
    const batch = Math.min(Number(limit) || 500, 1000);
    if (mode !== "dry_run" && mode !== "dry_run_down" && mode !== "apply" && mode !== "claude_long") return json({ error: "mode skal være dry_run, dry_run_down, apply eller claude_long" }, 400);

    if (mode === "claude_long") {
      if (!isInternalCall) return json({ error: "Kun systemkald" }, 401);
      const size = Math.min(Number(limit) || 10, 20);
      const { data: cands, error: cErr } = await supabase.rpc("allergen_claude_long_candidates", { p_limit: size });
      if (cErr) throw cErr;
      let processed = 0, changed = 0, stopped = false;
      for (const p of cands ?? []) {
        const res = await fetch(`${supabaseUrl}/functions/v1/allergens`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": serviceRoleKey },
          body: JSON.stringify({ text: p.ingredients_text, force_ai: true }),
        });
        const data = res.ok ? await res.json().catch(() => null) : null;
        // Uden Claude (døgnloft ramt, API-fejl) røres intet; produktet prøves igen senere.
        if (!data?.allergen_flags || !String(data.method ?? "").includes("claude")) { stopped = true; break; }
        const old = p.allergen_flags ?? {};
        const next: Record<string, string> = { ...old };
        for (const a of ALL_ALLERGENS) {
          const o = old[a] ?? "no";
          const n = data.allergen_flags[a] ?? "no";
          if ((RANK[n] ?? 0) > (RANK[o] ?? 0)) next[a] = n;
        }
        const didChange = ALL_ALLERGENS.some((a) => (old[a] ?? "no") !== next[a]);
        const { error: bErr } = await supabase.from("allergen_claude_long_20261008").upsert({
          product_id: p.id, old_flags: old, new_flags: next, old_quality: p.allergen_quality,
          old_method: p.allergen_source_method, changed: didChange,
        }, { onConflict: "product_id" });
        if (bErr) throw bErr;
        const { error: uErr } = await supabase.from("products").update({
          allergen_flags: next, allergen_quality: "high", allergen_source_method: "keyword+claude",
          reparsed_at: new Date().toISOString(),
        }).eq("id", p.id);
        if (uErr) throw uErr;
        processed++;
        if (didChange) changed++;
      }
      return json({ mode, processed, changed, stopped });
    }

    if (mode === "dry_run" || mode === "dry_run_down") {
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

      if (mode === "dry_run_down") {
        const downRows = [];
        for (const p of products ?? []) {
          const old = p.allergen_flags ?? {};
          const fresh = liftGlutenFromWheat(analyzeIngredients(p.ingredients_text));
          const down = ALL_ALLERGENS.filter((a) => (DOWN_RANK[fresh[a] ?? "no"] ?? 0) < (DOWN_RANK[old[a] ?? "no"] ?? 0));
          if (!down.length) continue;
          downRows.push({
            product_id: p.id, ean: p.ean, ingredients_text: p.ingredients_text,
            old_flags: old, new_flags: fresh, down_allergens: down, old_method: p.allergen_source_method,
          });
        }
        if (downRows.length) {
          const { error: dErr } = await supabase.from(DOWN_TABLE).upsert(downRows, { onConflict: "product_id" });
          if (dErr) throw dErr;
        }
        return json({
          mode, processed: (products ?? []).length, down: downRows.length,
          next: (products ?? []).length === batch ? products[products.length - 1].id : null,
        });
      }

      const rows = (products ?? []).map((p) => {
        const old = p.allergen_flags ?? {};
        const fresh = liftGlutenFromWheat(analyzeIngredients(p.ingredients_text));
        const next: Record<string, string> = { ...old };
        for (const a of ALL_ALLERGENS) {
          const o = old[a] ?? "no";
          const n = fresh[a] ?? "no";
          // Kun opadgående: den nye værdi bruges kun, hvis den er mere forsigtig end den gamle.
          next[a] = (RANK[n] ?? 0) > (RANK[o] ?? 0) ? n : o;
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
      // Flaget kan være hævet siden tørkørslen (natjob, admin, indsendelse). new_flags er beregnet ud fra den gamle værdi, så det flettes
      // opad mod den aktuelle værdi; ellers kunne "apply" sænke et nyere ja/spor (16. okt. 2026, falsk-negativ-gennemgang).
      const { data: cur, error: cErr } = await supabase.from("products").select("allergen_flags").eq("id", r.product_id).single();
      if (cErr || !cur) { errors++; continue; }
      const { error: uErr } = await supabase
        .from("products")
        .update({
          allergen_flags: mergeFlagsUpward(cur.allergen_flags, r.new_flags),
          allergen_quality: String(r.old_method ?? "").includes("claude") ? "high" : "medium",
          allergen_source_method: r.old_method ?? "keyword",
          reparsed_at: new Date().toISOString(),
        })
        .eq("id", r.product_id);
      if (uErr) { errors++; continue; }
      await supabase.from(DIFF_TABLE).update({ applied_at: new Date().toISOString() }).eq("product_id", r.product_id);
      applied++;
    }
    await logRun(mode, applied, errors);
    return json({
      mode, applied, errors,
      next: (rows ?? []).length === batch ? rows[rows.length - 1].product_id : null,
    });
  } catch (e) {
    console.error("allergen-reanalyze fejl:", e);
    if (actorId) {
      await logAdminEvent(supabase, actorId, "genanalyse_koert", "edge_function", "allergen-reanalyze",
        { funktion: "allergen-reanalyze", fejl: fejlkode(e) }, "mislykket");
    }
    return json({ error: String(e) }, 500);
  }
});
