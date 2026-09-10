// supabase/functions/classify-categories/index.ts
// Klassificerer produkter i underkategorier via Claude Haiku, og retter
// samtidig regulære fejlkategoriseringer på topniveau (fx "Bacon" fundet
// under "Drikkevarer"). Kald: POST { limit?: number }
//
// Bruges to steder:
// 1. Engangs-oprydning af hele det eksisterende katalog (kaldes gentagne
//    gange med en limit, indtil ingen produkter har subcategory = null).
// 2. Fremadrettet klassificering af ét nyt produkt ved godkendelse af en
//    indsendelse (submissions Edge Function kalder denne med product_id).
//
// Interne kald (Authorization: Bearer <service-role-nøgle>) er ikke krævet
// at logge ind som en almindelig bruger — dette er et
// vedligeholdelsesværktøj, ikke noget klientappen kalder direkte.

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TAXONOMY: Record<string, string[]> = {
  "Drikkevarer": [
    "Mælk & mælkealternativer", "Juice & saft", "Sodavand & læskedrikke", "Vand",
    "Kaffe", "Te", "Øl", "Vin", "Spiritus & cocktails",
    "Sportsdrikke & energidrikke", "Andre drikkevarer",
  ],
  "Kolonial": [
    "Pasta & ris", "Konserves", "Krydderier & smagsgivere", "Olier & eddike",
    "Sovs & dressing", "Bagetilbehør", "Morgenmad & müsli",
    "Nødder & tørret frugt", "Færdiglavede saucer", "Andet kolonial",
  ],
  "Snacks & slik": [
    "Chips & snacks", "Slik & bolsjer", "Chokolade", "Kiks & kager",
    "Nødder (snack)", "Popcorn", "Andet snacks",
  ],
  "Mejeri & æg": [
    "Mælk", "Yoghurt & skyr", "Ost", "Smør & margarine", "Fløde", "Æg",
    "Plantebaserede mejerialternativer", "Andet mejeri",
  ],
  "Frugt & grønt": [
    "Frisk frugt", "Frisk grønt", "Krydderurter", "Salater", "Andet frugt & grønt",
  ],
  "Frost": [
    "Frostgrønt", "Frostfrugt", "Is", "Frosne færdigretter", "Frosne bagværk", "Andet frost",
  ],
  "Brød & bagværk": [
    "Brød", "Rugbrød", "Boller & bagværk", "Kager & wienerbrød", "Knækbrød & kiks", "Andet brød",
  ],
  "Kød & fisk": [
    "Oksekød", "Svinekød", "Fjerkræ", "Fisk", "Skaldyr", "Pålæg & charcuteri",
    "Plantebaseret kød-alternativ", "Andet kød & fisk",
  ],
  "Færdigretter": [
    "Kølede færdigretter", "Salater & tilbehør", "Supper", "Sandwich & snackmåltider", "Andet færdigretter",
  ],
  "Andet": ["Andet"],
};

const VALID_CATEGORIES = Object.keys(TAXONOMY);

function buildSystemPrompt(): string {
  const lines = Object.entries(TAXONOMY)
    .map(([cat, subs]) => `${cat}: ${subs.join(", ")}`)
    .join("\n");
  return `Du klassificerer danske dagligvarer i kategori og underkategori for en allergiapp.

Gyldige kategorier og deres tilladte underkategorier:
${lines}

For hvert produkt (id, navn, brand) skal du returnere:
- "category": vælg den mest korrekte kategori fra listen ovenfor. Hvis den nuværende kategori tydeligt er forkert (fx en kødvare fejlagtigt kategoriseret som "Drikkevarer"), ret den til den korrekte.
- "subcategory": vælg PRÆCIS én underkategori fra listen for den valgte kategori.

Returner KUN et JSON-array, ingen forklaring, ingen markdown:
[{"id":"...","category":"...","subcategory":"..."}]`;
}

async function classifyBatch(products: { id: string; name: string; brand: string | null }[], apiKey: string) {
  const userContent = products
    .map(p => `${p.id} | ${p.name}${p.brand ? " (" + p.brand + ")" : ""}`)
    .join("\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      system: buildSystemPrompt(),
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API fejl: ${res.status}`);
  const data = await res.json();
  let raw = data.content?.[0]?.text || "[]";
  raw = raw.replace(/```json\s*|\s*```/g, "").trim();
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Uventet Claude-svar (ikke et array)");
  return parsed as { id: string; category: string; subcategory: string }[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  const isInternalCall = !!serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`;
  if (!isInternalCall) {
    return new Response(JSON.stringify({ error: "Kun til internt brug" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY mangler");

    const { limit = 500, batch_size = 20, product_id } = await req.json().catch(() => ({}));
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let products;
    if (product_id) {
      const { data, error } = await supabase.from("products").select("id, name, brand").eq("id", product_id).limit(1);
      if (error) throw error;
      products = data;
    } else {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, brand")
        .is("subcategory", null)
        .not("name", "is", null)
        .limit(Math.min(Number(limit) || 500, 2000));
      if (error) throw error;
      products = data;
    }

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ classified: 0, remaining: 0, reason: "Intet at klassificere" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let classified = 0;
    let errors = 0;
    const chunkSize = Math.min(Number(batch_size) || 20, 30);

    for (let i = 0; i < products.length; i += chunkSize) {
      const chunk = products.slice(i, i + chunkSize);
      try {
        const results = await classifyBatch(chunk, apiKey);
        for (const r of results) {
          const category = VALID_CATEGORIES.includes(r.category) ? r.category : null;
          const subcategory = category && TAXONOMY[category].includes(r.subcategory) ? r.subcategory : null;
          if (!category || !subcategory) { errors++; continue; }
          const { error: updateError } = await supabase
            .from("products")
            .update({ category, subcategory, subcategory_classified_at: new Date().toISOString() })
            .eq("id", r.id);
          if (updateError) errors++;
          else classified++;
        }
      } catch (e) {
        console.error("Batch-klassificering fejlede:", e);
        errors += chunk.length;
      }
    }

    const { count: remaining } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .is("subcategory", null)
      .not("name", "is", null);

    return new Response(JSON.stringify({ classified, errors, remaining: remaining ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
