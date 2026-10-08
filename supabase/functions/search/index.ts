import { createClient } from "jsr:@supabase/supabase-js@2.117.3";
import { withinUserLimit } from "../_shared/apiUsage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

const normalize = (s: string) => s.toLowerCase()
  .replace(/[-_&]/g, " ")
  .replace(/[^a-zæøå0-9 ]/g, "")
  .replace(/\s+/g, " ")
  .trim();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // ── POST — log at en bruger valgte/tilføjede et produkt fra et
  // søgeresultat. Bruges til at lære sammenhængen mellem søgeord og hvad
  // folk rent faktisk vælger, både til global rangering (de mest valgte på
  // tværs af alle brugere) og personlig rangering (hvad denne bruger selv
  // plejer at vælge for en given søgning). Fire-and-forget fra klienten —
  // fejl her må aldrig blokere selve søgningen eller tilføjelsen. ──────────
  if (req.method === "POST") {
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
    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) return new Response(
      JSON.stringify({ error: "Ikke autoriseret" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    const body = await req.json().catch(() => ({}));
    const query = (body.query || "").toString().trim();
    const ean = (body.ean || "").toString().trim();
    const productId = body.product_id || null;
    const queryNorm = normalize(query);

    if (query.length > 100 || ean.length > 20 || (productId && String(productId).length > 64)) return new Response(
      JSON.stringify({ error: "For lange værdier" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    // Loggen er kun et baggrundskald: over loftet svarer vi pænt, men gemmer ikke mere.
    if (!(await withinUserLimit(supabase, caller.id, "search_selection"))) return new Response(
      JSON.stringify({ success: true, skipped: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    if (!queryNorm || !ean) return new Response(
      JSON.stringify({ error: "query og ean er påkrævet" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    await supabase.from("search_selections").insert({
      user_id: caller.id, query_norm: queryNorm, ean, product_id: productId,
    });
    await supabase.rpc("increment_search_popularity", { p_query_norm: queryNorm, p_ean: ean });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── GET — selve søgningen ────────────────────────────────────────────────
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  // Sideinddeling: "offset" lader klienten hente næste side af de allerede
  // scorede/sorterede resultater via en "Indlæs flere"-knap, uden at ændre
  // selve matchningen/rangeringen — samme forespørgsel køres bare igen med
  // en anden slice til sidst.
  const PAGE_SIZE = 25;
  const offsetParam = parseInt(url.searchParams.get("offset") || "0", 10);
  const offset = Number.isFinite(offsetParam) && offsetParam > 0 ? offsetParam : 0;

  if (!q || q.length < 2) {
    return new Response(JSON.stringify({ success: true, products: [], hasMore: false, total: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const qNorm = normalize(q);
  const isEan = /^\d{6,14}$/.test(q.trim());

  if (isEan) {
    const { data: eanData } = await supabase
      .from("products")
      .select("id, ean, name, brand, category, image_url, verified_status, allergen_flags, tags, ingredients_text")
      .eq("ean", q.trim())
      .limit(5);
    if (eanData?.length) {
      return new Response(JSON.stringify({ success: true, products: eanData, hasMore: false, total: eanData.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // Matchning, scoring og sideinddeling sker i databasen (RPC search_products),
  // så kun én side sendes hertil i stedet for hundredvis af produkter.
  // Søger også i category/subcategory, ikke kun navn/brand — ellers er et
  // produkt der er korrekt kategoriseret som fx "Chips & snacks" usynligt
  // for en søgning på "chips", hvis selve produktnavnet ikke indeholder
  // ordet (fx et rent smags-/brandnavn som "KiMs Flødeost & Peberrod").
  // Hvem søger? Bruges kun til den personlige rangeringsboost — en
  // ikke-autoriseret søgning fungerer stadig fint, bare uden den boost.
  let callerId: string | null = null;
  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    callerId = user?.id ?? null;
  }

  const { data: result, error } = await supabase.rpc("search_products", {
    p_q_norm: qNorm,
    p_user_id: callerId,
    p_offset: offset,
    p_limit: PAGE_SIZE,
  });

  if (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    products: result?.products ?? [],
    hasMore: !!result?.hasMore,
    total: result?.total ?? 0,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
