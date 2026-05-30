import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─────────────────────────────────────────────────────────────────────────────
// ALLERGEN-ORDBOG — 16 allergener, korrekt opdelt
// VIGTIGT: maelkeallergi (protein) ≠ laktose (mælkesukker) ≠ gluten ≠ hvede
// ─────────────────────────────────────────────────────────────────────────────
const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  // Gluten = kornprotein. IKKE mel generelt (rismel/majsmel er glutenfri)
  gluten: [
    "gluten", "rug", "rye", "secale", "byg", "barley", "hordeum",
    "havre", "oats", "avena", "spelt", "kamut", "dinkel", "emmer",
    "einkorn", "hvedemel", "wheat flour", "rugmel", "bygmel", "havremel",
    "malt", "maltekstrakt", "malt extract", "hvedestivelse", "wheat starch",
    "semulje", "semolina", "couscous", "bulgur", "seitan",
  ],
  // Hvede = specifikt hvedeprotein (separat fra cøliaki/gluten)
  hvede: [
    "hvede", "wheat", "triticum", "hvedemel", "wheat flour",
    "hvedeprotein", "wheat protein", "hvedestivelse", "wheat starch",
    "hvedegluten", "hvedeklid", "wheat bran", "durum", "spelt",
  ],
  // Mælkeallergi = mælkePROTEIN (kasein, valle) — fra ekspertliste
  maelkeallergi: [
    "mælk", "milk", "mælkeprotein", "milk protein", "mælkebestanddele",
    "kasein", "casein", "kaseinat", "caseinate", "natriumkaseinat",
    "kalciumkaseinat", "kaliumkaseinat", "valle", "whey", "valleprotein",
    "whey protein", "vallepulver", "lactalbumin", "laktalbumin",
    "lactoglobulin", "laktoglobulin", "ost", "cheese", "fromage",
    "fløde", "cream", "smør", "butter", "smørolie", "butteroil",
    "yoghurt", "yogurt", "kefir", "skyr", "kvark", "quark",
    "tørmælk", "mælkepulver", "milk powder", "skummetmælkspulver",
    "sødmælkspulver", "kærnemælk", "buttermilk", "flødepulver",
    "mælketørstof", "milk solids", "laktoprotein",
  ],
  // Laktose = mælkeSUKKER. Kun laktose-specifikke termer
  laktose: [
    "laktose", "lactose", "mælkesukker", "milk sugar",
    "mælk", "milk", "fløde", "cream", "ost", "cheese",
    "yoghurt", "yogurt", "kærnemælk", "buttermilk",
    "valle", "whey", "tørmælk", "mælkepulver", "milk powder",
  ],
  aeg: [
    "æg", "egg", "ovum", "hønseæg", "æggehvide", "egg white",
    "æggeblomme", "egg yolk", "albumin", "ovalbumin", "ovomucoid",
    "lysozym", "lysozyme", "mayonnaise", "majonæse", "remoulade",
    "æggepulver", "egg powder", "pasteuriseret æg",
  ],
  noedder: [
    "mandel", "almond", "mandler", "hasselnød", "hazelnut", "corylus",
    "valnød", "walnut", "juglans", "cashew", "cashewnød", "anacardium",
    "pistacie", "pistachio", "pistacienød", "pekannød", "pecan",
    "macadamia", "macadamianød", "paranød", "brazil nut", "pinjekerne",
    "pine nut", "nøddepasta", "nut paste", "marcipan", "marzipan", "nougat",
  ],
  jordnoedder: [
    "jordnød", "jordnødder", "peanut", "peanuts", "groundnut",
    "arachis", "jordnøddeolie", "peanut oil", "arachideolie",
    "jordnøddesmør", "peanut butter",
  ],
  soja: [
    "soja", "soy", "soya", "glycine max", "sojabønne", "soybean",
    "tofu", "miso", "edamame", "tempeh", "sojalecithin", "soy lecithin",
    "sojamel", "soy flour", "sojaprotein", "soy protein", "sojaolie",
    "sojasauce", "soy sauce", "sojadrik",
  ],
  fisk: [
    "fisk", "fish", "ansjos", "anchovy", "torsk", "cod", "gadus",
    "laks", "salmon", "salmo", "tun", "tuna", "thunnus", "sild",
    "herring", "clupea", "makrel", "mackerel", "rødspætte", "plaice",
    "fiskesauce", "fish sauce", "fiskeolie", "fish oil", "surimi",
    "fiskegelatine", "fiskeekstrakt", "rogn", "roe", "kaviar", "caviar",
  ],
  skaldyr: [
    "skaldyr", "crustacean", "rejer", "reje", "shrimp", "prawn",
    "hummer", "lobster", "krabbe", "crab", "languster", "krebs",
    "crayfish", "krebsdyr", "krabbestang", "krill",
  ],
  selleri: [
    "selleri", "celery", "apium", "knoldselleri", "celeriac",
    "bladselleri", "selleriolie", "sellerisalt", "celery salt",
  ],
  sennep: [
    "sennep", "mustard", "sinapis", "sennepsfrø", "mustard seed",
    "sennepsolie", "mustard oil", "sennepspulver", "dijon",
  ],
  sesam: [
    "sesam", "sesame", "sesamum", "tahini", "tahin",
    "sesamolie", "sesame oil", "sesamfrø", "sesame seed",
    "halva", "halvah", "gomashio",
  ],
  svovl: [
    "svovldioxid", "sulphur dioxide", "sulfur dioxide", "sulfit",
    "sulfitter", "sulphite", "sulfite", "e220", "e221", "e222",
    "e223", "e224", "e225", "e226", "e227", "e228",
    "natriumsulfit", "kaliumsulfit", "natriummetabisulfit",
  ],
  lupin: [
    "lupin", "lupine", "lupinus", "lupinfrø", "lupinmel",
    "lupin flour", "lupinprotein", "lupin protein",
  ],
  bloeddyr: [
    "bløddyr", "mollusc", "mollusk", "musling", "muslinger", "mussel",
    "østers", "oyster", "blæksprutte", "squid", "octopus", "blæksprutter",
    "snegl", "snail", "kammusling", "scallop", "abalone", "vongole",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// E-NUMRE der er koblet til allergener (kan indeholde / afledt af)
// ─────────────────────────────────────────────────────────────────────────────
const ENUMBER_ALLERGENS: Record<string, { allergen: string; certainty: "yes" | "traces" }> = {
  "e322": { allergen: "soja", certainty: "traces" },      // Lecithin — ofte soja
  "e471": { allergen: "maelkeallergi", certainty: "traces" }, // Mono/diglycerider — kan være mælk
  "e472": { allergen: "maelkeallergi", certainty: "traces" },
  "e270": { allergen: "maelkeallergi", certainty: "traces" }, // Mælkesyre — sjældent, men muligt
  "e966": { allergen: "laktose", certainty: "yes" },      // Lactitol — afledt af laktose
  "e220": { allergen: "svovl", certainty: "yes" },
  "e221": { allergen: "svovl", certainty: "yes" },
  "e222": { allergen: "svovl", certainty: "yes" },
  "e223": { allergen: "svovl", certainty: "yes" },
  "e224": { allergen: "svovl", certainty: "yes" },
  "e225": { allergen: "svovl", certainty: "yes" },
  "e226": { allergen: "svovl", certainty: "yes" },
  "e227": { allergen: "svovl", certainty: "yes" },
  "e228": { allergen: "svovl", certainty: "yes" },
};

const ALL_ALLERGENS = [
  "gluten", "hvede", "maelkeallergi", "laktose", "aeg", "noedder",
  "jordnoedder", "soja", "fisk", "skaldyr", "selleri", "sennep",
  "sesam", "svovl", "lupin", "bloeddyr",
];

// Ord der skal substring-matches (fanger sammensatte ord: komælk, gedemælk)
// Kun korte, entydige kerne-ord hvor falsk-positiv-risiko er lav
const SUBSTRING_KEYWORDS = new Set([
  "mælk", "milk", "kasein", "valle", "soja", "soy", "gluten",
  "laktose", "lactose", "sesam", "lupin", "selleri", "sennep",
]);

// Negation-detektion: "laktosefri", "uden mælk", "mælkefri", "under 0,01%"
function isNegated(text: string, keyword: string): boolean {
  const lower = text.toLowerCase();
  const kw = keyword.toLowerCase();
  const idx = lower.indexOf(kw);
  if (idx === -1) return false;
  const before = lower.substring(Math.max(0, idx - 18), idx);
  const after = lower.substring(idx + kw.length, idx + kw.length + 18);
  return (
    before.includes("uden") ||
    before.includes("fri for") ||
    before.includes("ingen") ||
    after.startsWith("fri") ||        // laktosefri, mælkefri
    after.startsWith("-fri") ||
    after.includes("under 0") ||      // laktose under 0,01%
    after.includes("free")            // lactose free
  );
}

// Ordgrænse-match: undgår at "æg" matcher inde i "lægemiddel"
function wordBoundaryMatch(haystack: string, needle: string): boolean {
  // Escape regex-special-tegn i søgeordet
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // \b virker ikke pålideligt med æøå, så vi bruger custom grænse:
  // Match hvis omgivet af ikke-bogstav eller streng-start/slut
  const pattern = new RegExp(
    `(^|[^a-zæøåA-ZÆØÅ0-9])${escaped}([^a-zæøåA-ZÆØÅ0-9]|$)`,
    "i"
  );
  return pattern.test(haystack);
}

// Samlet match: ordgrænse for de fleste, substring for kerne-ord
function keywordMatch(haystack: string, keyword: string): boolean {
  if (SUBSTRING_KEYWORDS.has(keyword.toLowerCase())) {
    return haystack.toLowerCase().includes(keyword.toLowerCase());
  }
  return wordBoundaryMatch(haystack, keyword);
}

// Tjek om et match er i "spor"-kontekst
function isTracesContext(text: string, keyword: string): boolean {
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx === -1) return false;
  const surrounding = text.toLowerCase().substring(
    Math.max(0, idx - 60),
    Math.min(text.length, idx + keyword.length + 20)
  );
  return (
    surrounding.includes("spor") ||
    surrounding.includes("trace") ||
    surrounding.includes("kan indeholde") ||
    surrounding.includes("may contain") ||
    surrounding.includes("fremstillet") ||
    surrounding.includes("produced in") ||
    surrounding.includes("samme fabrik") ||
    surrounding.includes("same facility") ||
    surrounding.includes("samme produktionsudstyr")
  );
}

// Tjek om allergenet er fremhævet (EU-krav: fed/versaler)
function isEmphasized(originalText: string, keyword: string): boolean {
  // Find keyword i original-tekst (case-sensitive søgning efter versal-version)
  const upperKw = keyword.toUpperCase();
  // Kun hvis ordet optræder HELT i versaler OG er mindst 3 tegn
  if (keyword.length < 3) return false;
  return originalText.includes(upperKw) && wordBoundaryMatch(originalText, upperKw);
}

function analyzeIngredients(text: string): Record<string, string> {
  const flags: Record<string, string> = {};
  const lower = text.toLowerCase();

  for (const allergen of ALL_ALLERGENS) {
    const keywords = ALLERGEN_KEYWORDS[allergen] || [];
    let status = "no";

    for (const keyword of keywords) {
      if (!keywordMatch(lower, keyword.toLowerCase())) continue;

      // Spring over hvis allergenet er negeret (laktosefri, uden mælk)
      if (isNegated(text, keyword)) continue;

      // Match fundet — bestem om det er yes eller traces
      if (isTracesContext(text, keyword)) {
        if (status !== "yes") status = "traces";
      } else {
        status = "yes";
        break; // yes er højeste sikkerhed, stop
      }
    }

    flags[allergen] = status;
  }

  // ── E-nummer detektion ──────────────────────────────────────────────────
  for (const [enumber, mapping] of Object.entries(ENUMBER_ALLERGENS)) {
    if (wordBoundaryMatch(lower, enumber)) {
      const current = flags[mapping.allergen];
      // Opgrader kun hvis det forbedrer sikkerheden (no → traces → yes)
      if (mapping.certainty === "yes" && current !== "yes") {
        flags[mapping.allergen] = "yes";
      } else if (mapping.certainty === "traces" && current === "no") {
        flags[mapping.allergen] = "traces";
      }
    }
  }

  // ── Global override: laktosefri produkter ─────────────────────────────────
  // "Laktosefri mælk" har stadig mælkeprotein (maelkeallergi=yes) men INGEN laktose
  if (
    lower.includes("laktosefri") ||
    lower.includes("laktose fri") ||
    lower.includes("lactose free") ||
    lower.includes("lactose-free") ||
    /laktose\s+(under|<|mindre)/.test(lower)
  ) {
    flags["laktose"] = "no";
  }

  return flags;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLAUDE FALLBACK — bruges når keyword-engine er usikker
// Kræver ANTHROPIC_API_KEY som Supabase secret
// ─────────────────────────────────────────────────────────────────────────────
async function analyzeWithClaude(text: string): Promise<Record<string, string> | null> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return null; // Ingen nøgle = spring fallback over

  const systemPrompt = `Du er en allergen-detektor for danske fødevarer. Analysér ingredienslisten og returner KUN et JSON-objekt med disse 16 allergener som nøgler og "yes"/"traces"/"no" som værdier:

gluten, hvede, maelkeallergi, laktose, aeg, noedder, jordnoedder, soja, fisk, skaldyr, selleri, sennep, sesam, svovl, lupin, bloeddyr

REGLER:
- maelkeallergi = mælkePROTEIN (kasein, valle, ost, smør). "Laktosefri mælk" -> maelkeallergi=yes
- laktose = mælkeSUKKER. "Laktosefri" -> laktose=no, men maelkeallergi kan stadig være yes
- hvede = hvedeprotein, separat fra gluten
- gluten = hvede/rug/byg/havre-protein. Rismel/majsmel = IKKE gluten
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

// Vurder om keyword-resultatet er "usikkert" og bør verificeres med Claude
function shouldUseClaudeFallback(text: string): boolean {
  const lower = text.toLowerCase();
  if (/uden|fri for|free|laktosefri|under 0/.test(lower)) return true;
  const commaCount = (text.match(/,/g) || []).length;
  if (commaCount > 15) return true;
  const eNumbers = lower.match(/e\d{3}/g) || [];
  const unknownE = eNumbers.some(e => !ENUMBER_ALLERGENS[e]);
  if (unknownE && eNumbers.length > 3) return true;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    // 1. Keyword-engine kører altid (gratis, hurtig)
    let allergenFlags = analyzeIngredients(text);
    let method = "keyword";

    // 2. Claude-fallback hvis usikker ELLER eksplicit anmodet (force_ai)
    if (force_ai || shouldUseClaudeFallback(text)) {
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

    if (save && product_id) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      const { error } = await supabase
        .from("products")
        .update({ allergen_flags: allergenFlags })
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
