import { createClient } from "jsr:@supabase/supabase-js@2";
import { logAiUsage } from "../_shared/aiCost.ts";
import { withinGlobalLimit, withinUserLimit } from "../_shared/apiUsage.ts";
import {
  ALL_ALLERGENS,
  analyzeIngredients,
  looksNonDanish,
  liftGlutenFromWheat,
  shouldUseClaudeFallback,
} from "../_shared/allergenEngine.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─────────────────────────────────────────────────────────────────────────────
// CLAUDE FALLBACK — bruges når keyword-engine er usikker
// Kræver ANTHROPIC_API_KEY som Supabase secret
// ─────────────────────────────────────────────────────────────────────────────
async function analyzeWithClaude(text: string): Promise<Record<string, string> | null> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return null; // Ingen nøgle = spring fallback over

  const systemPrompt = `Du er en allergen-detektor for fødevarer solgt i Danmark. Ingredienslisten kan være på dansk, svensk, norsk, tysk, engelsk eller et andet sprog — læs den på dens eget sprog. Analysér ingredienslisten og returner KUN et JSON-objekt med disse 16 allergener som nøgler og "yes"/"traces"/"no" som værdier:

gluten, hvede, maelkeallergi, laktose, aeg, noedder, jordnoedder, soja, fisk, skaldyr, selleri, sennep, sesam, svovl, lupin, bloeddyr

REGLER:
- maelkeallergi = mælkePROTEIN (kasein, valle, ost, smør). "Laktosefri mælk" -> maelkeallergi=yes
- laktose = mælkeSUKKER. "Laktosefri" -> laktose=no, men maelkeallergi kan stadig være yes
- hvede = hvedeprotein, separat fra gluten
- gluten = hvede/rug/byg/havre-protein (fx Weizen/wheat/vete/Roggen/råg/rye). Rismel/majsmel = IKKE gluten. Indeholder produktet hvede, er gluten mindst lige så højt som hvede
- "yes" = indeholder direkte. "traces" = kan indeholde spor af / samme fabrik. "no" = ikke til stede
- E-numre: E322=soja(traces), E471/E472=maelkeallergi(traces), E220-228=svovl(yes)
- Vær konservativ: ved tvivl om spor, brug "traces" ikke "no"

Returner KUN JSON, ingen forklaring, ingen markdown.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: "user", content: `Ingredienser: ${text}` }],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    await logAiUsage("allergens", "claude-haiku-4-5", data.usage);
    let raw = data.content?.[0]?.text || "";
    raw = raw.replace(/```json\s*|\s*```/g, "").trim();
    const parsed = JSON.parse(raw);

    const result: Record<string, string> = {};
    for (const a of ALL_ALLERGENS) {
      const v = parsed[a];
      result[a] = (v === "yes" || v === "traces" || v === "no") ? v : "no";
    }
    return result;
  } catch {
    return null;
  }
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Verificér at den kaldende bruger faktisk er logget ind — ellers er dette
  // et helt åbent, ubegrænset kald ind til en betalt Vision/LLM-baseret
  // funktion, som hvem som helst kan spamme uden login.
  //
  // Undtagelsen er vores eget auto-reparse cron-job, som kalder denne
  // funktion server-til-server uden en bruger-session. Det identificerer
  // sig med service-role-nøglen (kun kendt af vores egen infrastruktur,
  // aldrig eksponeret til klienter) i stedet for en bruger-Authorization.
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const isInternalCall = !!serviceRoleKey && req.headers.get("apikey") === serviceRoleKey;
  let caller: { id: string } | null = null;

  if (!isInternalCall) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(
      JSON.stringify({ error: "Ikke autoriseret" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(
      JSON.stringify({ error: "Ikke autoriseret" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    caller = user;
  }

  try {
    const body = await req.json();
    const { text, product_id, save, force_ai } = body;

    if (!text) {
      return new Response(
        JSON.stringify({ error: "text er påkrævet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // En ægte ingrediensliste er aldrig i nærheden af dette lange — uden et
    // loft kunne en indlogget bruger gentagne gange sende meget lang tekst
    // med force_ai:true og drive prisen på det betalte Claude-kald op.
    const MAX_TEXT_LENGTH = 20_000;
    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: "text er for lang" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Keyword-engine kører altid (gratis, hurtig)
    let allergenFlags = analyzeIngredients(text);
    let method = "keyword";

    // 2. Claude-fallback hvis usikker ELLER eksplicit anmodet (force_ai)
    // Dagligt loft mod misbrug: pr. bruger for loggede kald, globalt for interne/anonyme kald.
    // Over loftet springes kun Claude over; nøgleordsmotoren kører som normalt.
    let claudeAllowed = false;
    if (force_ai || shouldUseClaudeFallback(text)) {
      const usageClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      claudeAllowed = isInternalCall
        ? await withinGlobalLimit(usageClient, "claude_internal")
        : await withinUserLimit(usageClient, caller!.id, "claude_analysis");
    }
    if (claudeAllowed) {
      const claudeFlags = await analyzeWithClaude(text);
      if (claudeFlags) {
        // Claude vinder ved konflikt — men behold "yes" fra keyword (konservativt)
        const merged: Record<string, string> = {};
        for (const a of ALL_ALLERGENS) {
          const kw = allergenFlags[a];
          const cl = claudeFlags[a];
          // Tag den mest forsigtige værdi: yes > traces > no
          const rank = (v: string) => v === "yes" ? 2 : v === "traces" ? 1 : 0;
          merged[a] = rank(kw) >= rank(cl) ? kw : cl;
        }
        allergenFlags = merged;
        method = "keyword+claude";
      }
    }

    // Ikke-dansk tekst som Claude ikke kunne læse (ingen nøgle/API-fejl):
    // nøgleordsmotorens "no" betyder her kun "fandt ingen danske ord" —
    // returnér "unknown" i stedet for et falsk negativt resultat.
    if (method === "keyword" && looksNonDanish(text)) {
      for (const a of ALL_ALLERGENS) if (allergenFlags[a] === "no") allergenFlags[a] = "unknown";
    }
    allergenFlags = liftGlutenFromWheat(allergenFlags);

    if (save && product_id) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // save:true skriver direkte til et produkts allergen_flags i
      // PRODUKTION uden nogen godkendelses-workflow bagved (i modsætning til
      // submissions-flowet) — det kræver derfor admin, ikke bare login.
      // Uden dette kunne enhver indlogget bruger overskrive allergendata for
      // et VILKÅRLIGT produkt, direkte, på en app der findes for at fortælle
      // allergikere om et produkt er sikkert.
      if (!isInternalCall) {
        const { data: callerRow } = await supabase.from("users").select("role").eq("id", caller!.id).single();
        if (callerRow?.role !== "admin") {
          return new Response(
            JSON.stringify({ error: "Kun admins kan gemme allergen-data direkte på et produkt" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const { error } = await supabase
        .from("products")
        .update({
          allergen_flags: allergenFlags,
          // Herkomst — se products.allergen_source_method's kolonnekommentar
          // (forslag F fra allergen-detektions-gennemgangen, 25. sept. 2026).
          allergen_source_method: method,
        })
        .eq("id", product_id);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        allergen_flags: allergenFlags,
        method,
        saved: !!(save && product_id),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
