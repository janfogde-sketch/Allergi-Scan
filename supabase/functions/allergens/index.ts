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
    "mælketørstof", "milk solids", "laktoprotein", "ost", "oste",
  ],
  // Laktose = mælkeSUKKER. Kun laktose-specifikke termer
  laktose: [
    "laktose", "lactose", "mælkesukker", "milk sugar",
    "mælk", "milk", "fløde", "cream", "ost", "oste", "cheese",
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
    "mandel", "almond", "mandler", "hasselnød", "hasselnødder", "hazelnut", "corylus",
    "valnød", "valnødder", "walnut", "juglans", "cashew", "cashewnød", "cashewnødder", "anacardium",
    "pistacie", "pistachio", "pistacienød", "pistacienødder", "pekannød", "pekannødder", "pecan",
    "macadamia", "macadamianød", "macadamianødder", "paranød", "paranødder", "brazil nut", "pinjekerne", "pinjekerner",
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
    "fisk", "fish", "ansjos", "ansjoser", "anchovy", "torsk", "cod", "gadus",
    "laks", "salmon", "salmo", "tun", "tuna", "thunnus", "sild",
    "herring", "clupea", "makrel", "makreller", "mackerel", "rødspætte", "rødspætter", "plaice",
    "fiskesauce", "fish sauce", "fiskeolie", "fish oil", "surimi",
    "fiskegelatine", "fiskeekstrakt", "rogn", "roe", "kaviar", "caviar",
  ],
  skaldyr: [
    "skaldyr", "crustacean", "rejer", "reje", "shrimp", "prawn",
    "hummer", "lobster", "krabbe", "krabber", "crab", "languster", "langustere", "krebs",
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
    "snegl", "snail", "kammusling", "kammuslinger", "scallop", "abalone", "vongole",
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

// Tjek om et match er i "spor"-kontekst. Sætnings-scoped (finder tilbage til
// forrige punktum/udråbstegn/spørgsmålstegn, IKKE bare et fast antal tegn) —
// en "kan indeholde spor af A, B, C, D, E"-opremsning kan sagtens være
// længere end 60 tegn, og et fast tegn-vindue overser da de sidste allergener
// i opremsningen (fundet ved en gennemgang af rigtige produkter i databasen,
// 25. sept. 2026: "Kan indeholde spor af SESAMFRØ, SENNEP, HASSELNØDDER,
// SELLERI, SULFITTER, SOJA og JORDNØDDER" — JORDNØDDER lå uden for det
// gamle 60-tegns vindue).
function isTracesContext(text: string, keyword: string): boolean {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(keyword.toLowerCase());
  if (idx === -1) return false;
  let sentenceStart = 0;
  for (const p of [".", "!", "?"]) {
    const pos = lower.lastIndexOf(p, idx);
    if (pos > sentenceStart) sentenceStart = pos + 1;
  }
  // Lookahead-vinduet (+20 tegn) må IKKE bløde ind i NÆSTE sætning — ellers
  // kan et direkte, fremhævet ingrediens-match (fx "CASHEWNØDDER.") fejlagtigt
  // blive slået sammen med en efterfølgende "Kan indeholde spor af..."-sætning
  // og selv blive markeret som spor. Afgrænset af det først følgende
  // punktum/udråbstegn/spørgsmålstegn efter selve nøgleordet (eller
  // tekstens slutning, hvis der ikke er ét).
  let sentenceEnd = lower.length;
  for (const p of [".", "!", "?"]) {
    const pos = lower.indexOf(p, idx);
    if (pos !== -1 && pos < sentenceEnd) sentenceEnd = pos;
  }
  const windowEnd = Math.min(idx + keyword.length + 20, sentenceEnd);
  const sentence = lower.substring(sentenceStart, windowEnd);
  return (
    sentence.includes("spor") ||
    sentence.includes("trace") ||
    sentence.includes("kan indeholde") ||
    sentence.includes("may contain") ||
    sentence.includes("fremstillet") ||
    sentence.includes("produced in") ||
    sentence.includes("samme fabrik") ||
    sentence.includes("same facility") ||
    sentence.includes("samme produktionsudstyr")
  );
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

      // Spor-kontekst tjekkes FØRST og er afgørende — versaler/fed alene
      // (EU-krav 1169/2011 om fremhævning) er IKKE et pålideligt signal for
      // "direkte ingrediens", fordi danske producenter/forhandlere ofte
      // fremhæver allergen-navnet på PRÆCIS samme måde inde i en "kan
      // indeholde spor af"-advarsel som i selve ingredienslisten (bekræftet
      // ved en gennemgang af rigtige produkter i databasen, 25. sept. 2026 —
      // den tidligere kode brugte fremhævning til at overtrumfe spor-tjekket
      // og markerede fx "Kan indeholde spor af FISK, SOJA, ... BLØDDYR" som
      // "yes" i stedet for "traces" for alle nævnte allergener). Match fundet
      // uden for en spor-sætning behandles som direkte ingrediens.
      if (isTracesContext(text, keyword)) {
        if (status !== "yes") status = "traces";
        continue; // stop IKKE — en senere, direkte forekomst af samme
                   // allergen andetsteds i teksten skal stadig kunne opgradere til "yes"
      }

      status = "yes";
      break; // yes er højeste sikkerhed, stop
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
