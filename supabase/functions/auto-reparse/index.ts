// supabase/functions/auto-reparse/index.ts
// Reparserer allergen-flags på produkter med allergen_quality = 'pending' eller 'low'
// Kald: POST { manual?: boolean, limit?: number }
//
// pg_cron setup (jobid 3, "auto-reparse"):
//   select cron.alter_job(3, command := $cmd$
//     select net.http_post(
//       url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/auto-reparse',
//       headers := jsonb_build_object(
//         'Content-Type', 'application/json',
//         'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY')
//       ),
//       body := '{"manual":false,"limit":50}'::jsonb,
//       timeout_milliseconds := 30000
//     );
//   $cmd$);
//
// OBS (2026-09-09): den oprindelige opsætning brugte
// current_setting('app.service_role_key', true), som ALDRIG var sat noget
// sted i databasen — jobbet fejlede derfor hver eneste nat i (formentlig)
// lang tid med 401 "Missing authorization header" fra Supabases egen
// gateway, mens cron.job_run_details stadig viste "succeeded" (det
// afspejler kun at selve net.http_post-kaldet ikke fejlede, ikke at det
// underliggende HTTP-svar var en succes). Rettet ved at hente
// service-role-nøglen fra en Vault-secret i stedet. Samtidig blev
// timeout_milliseconds sat til 30000 — standardværdien på 5000 ms er
// kortere end funktionen typisk selv tager om at gøre sit arbejde
// færdigt, hvilket gav en misvisende timeout-fejl i net._http_response
// selvom arbejdet faktisk blev udført server-side.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // Kaldes enten af vores eget pg_cron-job (service-role-bearer, se header-
  // kommentaren) eller manuelt fra AdminScreen (en indlogget admins egen
  // JWT via useAdmin.js' runReparse) — men af INTET andet. Uden dette tjek
  // kunne enhver, uden login, POST'e {manual:true, limit:200} og tvinge op
  // til 200 betalte Claude-kald igennem samt bulk-overskrive
  // allergen_flags/allergen_quality for vilkårlige produkter, gentagne
  // gange. auto-reparse var den eneste interne cron-funktion uden dette
  // tjek — weekly-digest og send-email har det begge allerede.
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  const isInternalCall = !!serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`;

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  if (!isInternalCall) {
    const userClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: caller } } = await userClient.auth.getUser();
    const { data: callerRow } = caller
      ? await supabase.from("users").select("role").eq("id", caller.id).single()
      : { data: null };
    if (!caller || callerRow?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Ikke autoriseret" }), {
        status: 401, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const { manual = false, limit = 50 } = await req.json().catch(() => ({}));
    const batchLimit = Math.min(Number(limit) || 50, 200);

    // Hent produkter der skal reparseres
    // Prioritér: pending > low > medium (kun ved manuel kørsel)
    const qualities = manual ? ["pending", "low", "medium"] : ["pending", "low"];

    const { data: products, error } = await supabase
      .from("products")
      .select("id, ean, name, ingredients_text, allergen_flags, allergen_quality")
      .in("allergen_quality", qualities)
      .not("ingredients_text", "is", null)
      .not("ingredients_text", "eq", "")
      .order("allergen_quality", { ascending: true }) // pending først
      .order("reparsed_at", { ascending: true, nullsFirst: true })
      .limit(batchLimit);

    if (error) throw error;
    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ reparsed: 0, skipped: 0, errors: 0, reason: "Ingen produkter at reparsere" }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    let reparsed = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of products) {
      if (!product.ingredients_text?.trim()) { skipped++; continue; }

      try {
        // Kald allergens Edge Function
        const allergenRes = await fetch(`${supabaseUrl}/functions/v1/allergens`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Identificerer dette som et internt system-kald over for
            // allergens-funktionens auth-tjek — se dens kommentar.
            "apikey": serviceRoleKey,
          },
          body: JSON.stringify({
            text: product.ingredients_text,
            // Brug kun keyword-engine ved automatisk kørsel for at spare penge
            // force_ai: false → Haiku bruges kun ved behov (negationer, lange lister)
            force_ai: manual,
          }),
        });

        if (!allergenRes.ok) { errors++; continue; }

        const allergenData = await allergenRes.json();
        if (!allergenData?.allergen_flags) { errors++; continue; }

        // Beregn kvalitetsscore baseret på metode
        const method = allergenData.method || "keyword";
        const quality = method.includes("claude") ? "high" : "medium";

        // Opdater produkt
        const { error: updateError } = await supabase
          .from("products")
          .update({
            allergen_flags: allergenData.allergen_flags,
            allergen_quality: quality,
            // Herkomst — se kolonnekommentaren for den fulde betydning af
            // hver værdi (forslag F fra allergen-detektions-gennemgangen,
            // 25. sept. 2026).
            allergen_source_method: method,
            reparsed_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        if (updateError) { errors++; }
        else { reparsed++; }

      } catch (e) {
        console.error(`Reparse fejl for ${product.ean}:`, e);
        errors++;
      }

      // Lille pause for at undgå at overbelaste allergens Edge Function
      await new Promise(r => setTimeout(r, 100));
    }

    console.log(`auto-reparse: reparsed=${reparsed}, skipped=${skipped}, errors=${errors}, manual=${manual}`);

    return new Response(JSON.stringify({ reparsed, skipped, errors, total: products.length, manual }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("auto-reparse fejl:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});