import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    .limit(100);

  if (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  data = textData || [];

  const scored = data.map(p => {
    const name = normalize(p.name || "");
    const brand = normalize(p.brand || "");
    const combined = `${name} ${brand}`;
    let score = 0;

    if (name === qNorm) score += 200;
    else if (brand === qNorm) score += 150;
    else if (name.startsWith(qNorm)) score += 120;
    else if (brand.startsWith(qNorm)) score += 90;
    else if (name.includes(qNorm)) score += 60;
    else if (brand.includes(qNorm)) score += 40;

    let wordMatches = 0;
    for (const word of qWords) {
      if (name.includes(word)) wordMatches += 15;
      if (brand.includes(word)) wordMatches += 10;
      if (name.startsWith(word)) wordMatches += 5;
    }
    score += wordMatches;

    const allWordsMatch = qWords.every(w => combined.includes(w));
    if (allWordsMatch && qWords.length > 1) score += 50;

    const nameLength = (p.name || "").length;
    if (nameLength < 20) score += 10;
    else if (nameLength < 35) score += 5;

    if (p.verified_status === "verified") score += 20;
    else if (p.verified_status === "partial") score += 10;

    // Komplet data = bonus
    if (p.allergen_flags && Object.keys(p.allergen_flags).length > 0) score += 15;
    if (p.ingredients_text && p.ingredients_text.length > 10) score += 10;
    if (p.image_url) score += 5;

    return { ...p, _score: score };
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
