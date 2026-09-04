// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// auto-import-off — Supabase Edge Function
// Kører dagligt via cron. Henter top-50 manglende EAN'er fra missing_ean_log,
// slår dem op på Open Food Facts og importerer dem til products-tabellen.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OFF_API              = "https://world.openfoodfacts.org/api/v2/product";
const OFF_FIELDS           = "code,product_name,product_name_da,brands,categories_tags,image_url,ingredients_text,allergens_tags,nutriments";
const LIMIT                = 50;
const DELAY_MS             = 500; // rate limiting mod OFF

// ── Allergen-mapping ──────────────────────────────────────────────────────────
const ALLERGEN_MAP: Record<string, string> = {
  "en:gluten":       "gluten",
  "en:wheat":        "hvede",
  "en:milk":         "maelkeallergi",
  "en:eggs":         "aeg",
  "en:nuts":         "noedder",
  "en:peanuts":      "jordnoedder",
  "en:soybeans":     "soja",
  "en:fish":         "fisk",
  "en:crustaceans":  "skaldyr",
  "en:molluscs":     "bloeddyr",
  "en:celery":       "selleri",
  "en:mustard":      "sennep",
  "en:sesame-seeds": "sesam",
  "en:sulphur-dioxide-and-sulphites": "svovl",
  "en:lupin":        "lupin",
};

const CATEGORY_MAP: Record<string, string> = {
  "en:beverages":      "Drikkevarer",
  "en:dairy":          "Mejeri & æg",
  "en:milks":          "Mejeri & æg",
  "en:cheeses":        "Mejeri & æg",
  "en:eggs":           "Mejeri & æg",
  "en:breads":         "Brød & bagværk",
  "en:pastries":       "Brød & bagværk",
  "en:meats":          "Kød & fisk",
  "en:fish":           "Kød & fisk",
  "en:seafood":        "Kød & fisk",
  "en:frozen-foods":   "Frost",
  "en:snacks":         "Snacks & slik",
  "en:chocolates":     "Snacks & slik",
  "en:fruits":         "Frugt & grønt",
  "en:vegetables":     "Frugt & grønt",
  "en:ready-to-eat":   "Færdigretter",
  "en:prepared-meals": "Færdigretter",
  "en:pasta":          "Kolonial",
  "en:cereals":        "Kolonial",
  "en:sauces":         "Kolonial",
};

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildAllergenFlags(product: any): Record<string, string> {
  const flags: Record<string, string> = Object.fromEntries(
    Object.values(ALLERGEN_MAP).map(v => [v, "no"])
  );
  // laktose har ingen selvstændigt OFF-tag — sæt "no" som default her også,
  // så nøglen altid findes (i stedet for at mangle helt fra allergen_flags)
  flags["laktose"] = "no";
  for (const tag of (product.allergens_tags || [])) {
    const key = ALLERGEN_MAP[tag];
    if (key) flags[key] = "yes";
  }
  // en:milk dækker både mælkeprotein og mælkesukker (laktose) — OFF skelner
  // ikke mellem dem, så vi sætter konservativt begge ved mælk-indhold
  // (samme model som allergens-funktionens keyword-engine bruger)
  if (flags["maelkeallergi"] === "yes") flags["laktose"] = "yes";
  return flags;
}

function buildNutrition(nutriments: any): Record<string, number> | null {
  if (!nutriments) return null;
  const get = (k: string) => {
    const v = nutriments[`${k}_100g`];
    return v != null ? Math.round(parseFloat(v) * 100) / 100 : null;
  };
  const n: any = {
    energy_kcal:   get("energy-kcal"),
    fat:           get("fat"),
    saturated_fat: get("saturated-fat"),
    carbohydrates: get("carbohydrates"),
    sugars:        get("sugars"),
    fiber:         get("fiber"),
    protein:       get("proteins"),
    salt:          get("salt"),
  };
  const clean = Object.fromEntries(Object.entries(n).filter(([, v]) => v != null));
  return Object.keys(clean).length > 0 ? clean : null;
}

function buildCategory(tags: string[]): string {
  for (const tag of (tags || [])) {
    const cat = CATEGORY_MAP[tag];
    if (cat) return cat;
  }
  return "Kolonial";
}

Deno.serve(async (req) => {
  // Tillad både cron-kald og manuelt HTTP-kald
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const stats = { imported: 0, not_on_off: 0, already_exists: 0, error: 0 };
  const log: string[] = [];

  try {
    // 1. Hent top-50 manglende EAN'er
    const { data: missing, error: fetchErr } = await supabase
      .from("missing_ean_log")
      .select("ean, count")
      .order("count", { ascending: false })
      .limit(LIMIT);

    if (fetchErr) throw new Error(`missing_ean_log fejl: ${fetchErr.message}`);
    if (!missing || missing.length === 0) {
      return Response.json({ ok: true, message: "Ingen manglende EAN'er", stats });
    }

    log.push(`Fandt ${missing.length} EAN'er i missing_ean_log`);

    for (const row of missing) {
      const ean = row.ean;

      // 2. Tjek om den allerede eksisterer
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("ean", ean)
        .limit(1);

      if (existing && existing.length > 0) {
        stats.already_exists++;
        // Ryd op fra missing_ean_log
        await supabase.from("missing_ean_log").delete().eq("ean", ean);
        continue;
      }

      // 3. Hent fra OFF
      await sleep(DELAY_MS);
      let product: any = null;
      try {
        const res = await fetch(
          `${OFF_API}/${ean}.json?fields=${OFF_FIELDS}`,
          { headers: { "User-Agent": "EatSafe/1.0 (hej@eatsafe.dk)" } }
        );
        const data = await res.json();
        if (data.status === 1) product = data.product;
      } catch {
        stats.error++;
        continue;
      }

      if (!product) {
        stats.not_on_off++;
        continue;
      }

      // 4. Byg produkt-row
      const name = (
        product.product_name_da ||
        product.product_name ||
        ""
      ).trim();

      if (!name) {
        stats.error++;
        continue;
      }

      const brand = (product.brands || "").split(",")[0].trim();
      const row_data: any = {
        ean,
        name,
        brand:            brand || null,
        category:         buildCategory(product.categories_tags),
        image_url:        product.image_url || null,
        ingredients_text: product.ingredients_text?.trim() || null,
        allergen_flags:   buildAllergenFlags(product),
        nutrition:        buildNutrition(product.nutriments),
        verified_status:  "auto_verified",
        verified:         false,
        source:           "off_auto_import",
      };

      // Fjern null-værdier
      Object.keys(row_data).forEach(k => row_data[k] == null && delete row_data[k]);

      // 5. Indsæt i products
      const { error: insertErr } = await supabase
        .from("products")
        .insert(row_data);

      if (insertErr) {
        if (insertErr.code === "23505") {
          stats.already_exists++; // race condition — duplikat
        } else {
          stats.error++;
          log.push(`Fejl ved ${ean}: ${insertErr.message}`);
        }
      } else {
        stats.imported++;
        log.push(`✓ ${name} (${ean})`);
        // Fjern fra missing_ean_log
        await supabase.from("missing_ean_log").delete().eq("ean", ean);
      }
    }
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message, stats }, { status: 500 });
  }

  return Response.json({ ok: true, stats, log });
});
