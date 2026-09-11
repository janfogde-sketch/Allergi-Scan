import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return new Response(JSON.stringify({ success: true, products: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const normalize = (s: string) => s.toLowerCase()
    .replace(/[-_&]/g, " ")
    .replace(/[^a-zæøå0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

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
    // "komplet" dets data ellers er — ellers kan et fyldigt udfyldt, men
    // helt urelateret produkt overtrumfe et ægte men sparsomt match.
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

    return { ...p, _score: matchScore * 4 + qualityBonus };
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
