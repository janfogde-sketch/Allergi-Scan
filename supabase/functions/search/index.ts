import { createClient } from "jsr:@supabase/supabase-js@2";

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

  if (!q || q.length < 2) {
    return new Response(JSON.stringify({ success: true, products: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const qNorm = normalize(q);
  const qWords = qNorm.split(" ").filter(w => w.length > 0);
  const isEan = /^\d{6,14}$/.test(q.trim());

  let data: any[] = [];

  if (isEan) {
    const { data: eanData } = await supabase
      .from("products")
      .select("id, ean, name, brand, category, image_url, verified_status, allergen_flags, tags, ingredients_text")
      .eq("ean", q.trim())
      .limit(5);
    if (eanData?.length) {
      return new Response(JSON.stringify({ success: true, products: eanData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const orFilters = qWords.map(w => `name.ilike.%${w}%,brand.ilike.%${w}%`).join(",");

  const { data: textData, error } = await supabase
    .from("products")
    .select("id, ean, name, brand, category, image_url, verified_status, allergen_flags, tags, ingredients_text")
    .or(orFilters)
    .limit(150);

  if (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  data = textData || [];

  // Hvem søger? Bruges kun til den personlige rangeringsboost herunder —
  // en ikke-autoriseret søgning fungerer stadig fint, bare uden den boost.
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

  // Popularitet på tværs af alle brugere for præcis denne søgning, og —
  // hvis brugeren er logget ind — hvad brugeren selv plejer at vælge for
  // den samme søgning. Begge dele hentes sideløbende med selve tekst-
  // matchningen ovenfor.
  const [{ data: popRows }, { data: personalRows }] = await Promise.all([
    supabase.from("search_query_popularity").select("ean, select_count").eq("query_norm", qNorm).limit(100),
    callerId
      ? supabase.from("search_selections").select("ean").eq("user_id", callerId).eq("query_norm", qNorm).limit(200)
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const popularityMap = new Map((popRows || []).map((r: any) => [r.ean, r.select_count]));
  const personalMap = new Map<string, number>();
  for (const r of (personalRows || []) as any[]) personalMap.set(r.ean, (personalMap.get(r.ean) || 0) + 1);

  // En rigtig ordmatch: query-ordet er hele ordet, starten af ordet (fx
  // "øst" -> "østers") eller slutningen af ordet (fx "ost" -> "flødeost",
  // dækker danske sammensatte ord). En "ost" der blot optræder midt inde i
  // et helt andet ord (fx et brand som "Costeggiola") tæller IKKE som match
  // — det var årsagen til at helt urelaterede produkter (fx en vin) kunne
  // dukke op på en søgning efter "ost".
  const wordBoundaryMatch = (words: string[], q: string) =>
    words.some(w => w === q || w.startsWith(q) || w.endsWith(q));

  const scored = data.map(p => {
    const name = normalize(p.name || "");
    const brand = normalize(p.brand || "");
    const nameWords = name.split(" ").filter(Boolean);
    const brandWords = brand.split(" ").filter(Boolean);

    let matchScore = 0;
    let hasRealMatch = false;

    // Match på hele søgesætningen
    if (name === qNorm) { matchScore += 200; hasRealMatch = true; }
    else if (brand === qNorm) { matchScore += 150; hasRealMatch = true; }
    else if (name.startsWith(qNorm)) { matchScore += 120; hasRealMatch = true; }
    else if (brand.startsWith(qNorm)) { matchScore += 90; hasRealMatch = true; }

    // Match pr. ord i søgningen — kun ægte ord-match, ikke vilkårlig substring
    for (const word of qWords) {
      const nameHit = wordBoundaryMatch(nameWords, word);
      const brandHit = wordBoundaryMatch(brandWords, word);
      if (nameHit) { matchScore += 15; hasRealMatch = true; }
      if (brandHit) { matchScore += 10; hasRealMatch = true; }
      if (nameWords.some(w => w.startsWith(word))) matchScore += 5;
    }

    const allWordsMatch = qWords.every(w => wordBoundaryMatch(nameWords, w) || wordBoundaryMatch(brandWords, w));
    if (allWordsMatch && qWords.length > 1) matchScore += 50;

    // Uden en ægte ord-match skal produktet aldrig med, uanset hvor
    // "komplet" (eller populært) det ellers er — ellers kan et produkt der
    // intet har med søgningen at gøre overtrumfe et ægte men sparsomt
    // match, bare fordi det er blevet valgt meget for andre søgninger.
    if (!hasRealMatch) return { ...p, _score: 0 };

    let qualityBonus = 0;
    const nameLength = (p.name || "").length;
    if (nameLength < 20) qualityBonus += 10;
    else if (nameLength < 35) qualityBonus += 5;

    if (p.verified_status === "verified") qualityBonus += 20;
    else if (p.verified_status === "partial") qualityBonus += 10;

    if (p.allergen_flags && Object.keys(p.allergen_flags).length > 0) qualityBonus += 15;
    if (p.ingredients_text && p.ingredients_text.length > 10) qualityBonus += 10;
    if (p.image_url) qualityBonus += 5;

    // "Andre har valgt dette for samme søgning" — global boost, dæmpet med
    // et loft så et enkelt meget populært produkt ikke kan overdøve reel
    // tekst-relevans. "Jeg plejer selv at vælge dette" — personlig boost,
    // vægtet højere end den globale, da det er et stærkere signal om
    // netop denne brugers hensigt.
    const popularityBoost = Math.min(popularityMap.get(p.ean) || 0, 25) * 6;
    const personalBoost = Math.min(personalMap.get(p.ean) || 0, 10) * 20;

    return { ...p, _score: matchScore * 4 + qualityBonus + popularityBoost + personalBoost };
  });

  const filtered = scored.filter(p => p._score > 0);

  filtered.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    return (a.name || "").localeCompare(b.name || "", "da");
  });

  const products = filtered.slice(0, 25).map(({ _score, ...p }) => p);

  return new Response(JSON.stringify({ success: true, products }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
