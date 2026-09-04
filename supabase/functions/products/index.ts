import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function mapAllergenTags(allergenTags: string[], tracesTags: string[]) {
  const allergenMap: Record<string, string> = {
    "en:gluten": "gluten", "en:wheat": "hvede", "en:milk": "maelkeallergi", "en:eggs": "aeg",
    "en:nuts": "noedder", "en:peanuts": "jordnoedder", "en:soybeans": "soja",
    "en:fish": "fisk", "en:crustaceans": "skaldyr", "en:celery": "selleri",
    "en:mustard": "sennep", "en:sesame-seeds": "sesam",
    "en:sulphur-dioxide": "svovl", "en:lupin": "lupin", "en:molluscs": "bloeddyr",
  };
  const flags: Record<string, string> = {
    gluten:"unknown", hvede:"unknown", maelkeallergi:"unknown", laktose:"unknown", aeg:"unknown", noedder:"unknown",
    jordnoedder:"unknown", soja:"unknown", fisk:"unknown", skaldyr:"unknown",
    selleri:"unknown", sennep:"unknown", sesam:"unknown", svovl:"unknown",
    lupin:"unknown", bloeddyr:"unknown",
  };
  for (const tag of allergenTags) { const k = allergenMap[tag]; if (k) flags[k] = "yes"; }
  for (const tag of tracesTags)   { const k = allergenMap[tag]; if (k && flags[k] !== "yes") flags[k] = "traces"; }
  // en:milk dækker både mælkeprotein og mælkesukker (laktose) — OFF skelner
  // ikke mellem dem, så vi sætter konservativt begge ved mælk-indhold
  // (samme model som allergens-funktionens keyword-engine bruger)
  if (flags["maelkeallergi"] === "yes") flags["laktose"] = "yes";
  else if (flags["maelkeallergi"] === "traces" && flags["laktose"] === "unknown") flags["laktose"] = "traces";
  return flags;
}

function normalizeAllergenFlags(raw: Record<string, unknown> | null): Record<string, string> {
  if (!raw) return {
    gluten:"unknown", laktose:"unknown", aeg:"unknown", noedder:"unknown",
    jordnoedder:"unknown", soja:"unknown", fisk:"unknown", skaldyr:"unknown",
    selleri:"unknown", sennep:"unknown", sesam:"unknown", svovl:"unknown",
    lupin:"unknown", bloeddyr:"unknown",
  };
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(raw)) {
    if (val === true  || val === "yes")    result[key] = "yes";
    else if (val === "traces")             result[key] = "traces";
    else if (val === false || val === "no") result[key] = "no";
    else                                   result[key] = "unknown";
  }
  const defaults = ["gluten","laktose","aeg","noedder","jordnoedder","soja",
                    "fisk","skaldyr","selleri","sennep","sesam","svovl","lupin","bloeddyr"];
  for (const k of defaults) { if (!(k in result)) result[k] = "unknown"; }
  return result;
}

async function fetchFromOFF(ean: string) {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${ean}.json` +
      `?fields=product_name,brands,categories,image_url,ingredients_text,nutriments,allergens_tags,traces_tags`,
      { headers: { "User-Agent": "EatSafe/1.0 (kontakt@eatsafe.dk)" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 0) return null;
    const p = data.product;

    const n = p.nutriments || {};
    const nutrition = {
      energy_kcal:   n["energy-kcal_100g"] || null,
      energy_kj:     n["energy-kj_100g"]   || null,
      fat:           n["fat_100g"]          || null,
      saturated_fat: n["saturated-fat_100g"]|| null,
      carbohydrates: n["carbohydrates_100g"]|| null,
      sugars:        n["sugars_100g"]       || null,
      fiber:         n["fiber_100g"]        || null,
      protein:       n["proteins_100g"]     || null,
      salt:          n["salt_100g"]         || null,
    };
    const hasNutrition = Object.values(nutrition).some(v => v !== null);

    return {
      ean, name: p.product_name || null, brand: p.brands || null,
      category: p.categories || null, image_url: p.image_url || null,
      ingredients_text: p.ingredients_text || null,
      nutrition: hasNutrition ? nutrition : null,
      allergens_tags: p.allergens_tags || [],
      traces_tags: p.traces_tags || [],
    };
  } catch { return null; }
}

// ── Gem OFF-produkt permanent i databasen ─────────────────────────────────────
// Køres i baggrunden (ikke-blokerende) efter vi har svaret brugeren
async function saveOffProductToDB(
  supabase: ReturnType<typeof createClient>,
  offProduct: Awaited<ReturnType<typeof fetchFromOFF>>,
  allergenFlags: Record<string, string>
) {
  if (!offProduct?.ean || !offProduct?.name) return;
  try {
    // Tjek om produktet allerede er gemt (race condition guard)
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("ean", offProduct.ean)
      .maybeSingle();
    if (existing) return; // Allerede i DB — skip

    const { error } = await supabase.from("products").insert({
      ean:              offProduct.ean,
      name:             offProduct.name,
      brand:            offProduct.brand,
      category:         offProduct.category,
      image_url:        offProduct.image_url,
      ingredients_text: offProduct.ingredients_text,
      nutrition:        offProduct.nutrition,
      allergen_flags:   allergenFlags,
      source:           "open_food_facts",
      verified_status:  "unverified",
      country:          "DK",
    });

    if (error) {
      console.error("OFF → DB fejl:", error.message);
    } else {
      console.log("OFF → DB gemt:", offProduct.ean, offProduct.name);
    }
  } catch (e) {
    console.error("saveOffProductToDB undtagelse:", e);
  }
}

// ── Log manglende EAN (til prioritering) ──────────────────────────────────────
async function logMissingEan(supabase: ReturnType<typeof createClient>, ean: string) {
  try {
    // Upsert: opret eller inkrementer tæller
    await supabase.rpc("log_missing_ean", { p_ean: ean });
  } catch {
    // Silent — logging må ikke fejle en brugers opslag
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const identifier = parts[parts.length - 1];
  const method = req.method;

  try {
    if (method === "GET" && identifier) {
      const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(identifier);
      const field = looksLikeUuid ? "id" : "ean";
      const isEan = !looksLikeUuid;

      // Trin 1: Tjek egen database
      const { data: product } = await supabase
        .from("products")
        .select("*")
        .eq(field, identifier)
        .single();

      if (product) {
        let allergenFlags = product.allergen_flags
          ? normalizeAllergenFlags(product.allergen_flags)
          : null;

        if (!allergenFlags) {
          const { data: flagsRow } = await supabase
            .from("allergen_flags").select("*").eq("product_id", product.id).single();
          allergenFlags = flagsRow ? normalizeAllergenFlags(flagsRow) : normalizeAllergenFlags(null);
        }

        let ingredientsText = product.ingredients_text || null;
        if (!ingredientsText) {
          const { data: ingRow } = await supabase
            .from("ingredients").select("*").eq("product_id", product.id).single();
          ingredientsText = ingRow?.raw_text || null;
        }

        return new Response(JSON.stringify({
          found: true,
          source: "local",
          product,
          ingredients: ingredientsText ? { raw_text: ingredientsText } : null,
          allergen_flags: allergenFlags,
          nutrition: product.nutrition || null,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Trin 2: Prøv Open Food Facts (kun rene EAN-koder)
      if (isEan && /^\d+$/.test(identifier)) {
        const offProduct = await fetchFromOFF(identifier);
        if (offProduct) {
          const allergenFlags = mapAllergenTags(offProduct.allergens_tags, offProduct.traces_tags);

          // Gem permanent i baggrunden — returnér svar til brugeren med det samme
          // EdgeRuntime.waitUntil sikrer at gem-operationen fuldføres selv efter response er sendt
          const savePromise = saveOffProductToDB(supabase, offProduct, allergenFlags);
          if (typeof EdgeRuntime !== "undefined") {
            EdgeRuntime.waitUntil(savePromise);
          } else {
            savePromise.catch(console.error);
          }

          return new Response(JSON.stringify({
            found: true,
            source: "open_food_facts",
            verified: false,
            product: {
              ean: offProduct.ean, name: offProduct.name, brand: offProduct.brand,
              category: offProduct.category, image_url: offProduct.image_url,
              source: "open_food_facts",
            },
            ingredients: offProduct.ingredients_text ? { raw_text: offProduct.ingredients_text } : null,
            allergen_flags: allergenFlags,
            nutrition: offProduct.nutrition || null,
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Produkt ikke fundet nogen steder — log manglende EAN
        const logPromise = logMissingEan(supabase, identifier);
        if (typeof EdgeRuntime !== "undefined") {
          EdgeRuntime.waitUntil(logPromise);
        } else {
          logPromise.catch(console.error);
        }
      }

      return new Response(JSON.stringify({ found: false, product: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (method === "POST") {
      const body = await req.json();
      const { ean, name, brand, category, image_url, label_image_url, source } = body;
      if (!ean || !name) return new Response(JSON.stringify({ error: "ean og name er påkrævet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const { data: product, error } = await supabase.from("products")
        .insert({ ean, name, brand, category, image_url, label_image_url, source, country: "DK" })
        .select().single();
      if (error) return new Response(JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(JSON.stringify({ success: true, product }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (method === "PATCH" && identifier) {
      const body = await req.json();
      const { data: product, error } = await supabase.from("products")
        .update({ ...body, updated_at: new Date() }).eq("id", identifier).select().single();
      if (error) return new Response(JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true, product }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (method === "DELETE" && identifier) {
      const { error } = await supabase.from("products").delete().eq("id", identifier);
      if (error) return new Response(JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Ikke fundet" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
