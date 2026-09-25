// supabase/functions/_shared/allergenKeywords.js
//
// ÉN fælles nøgleordsordbog for allergen-detektion, brugt af BÅDE backend
// (supabase/functions/allergens/index.ts, den autoritative kilde for det
// faktiske ja/spor/nej-sikkerhedstjek) OG frontend (src/allergenKeywords.js,
// bruges til fremhævning/diæt-tjek/custom-allergi-søgning).
//
// Historik (25. sept. 2026 — forslag E fra allergen-detektions-gennemgangen):
// Før denne fil fandtes der TO uafhængige kopier af denne ordliste, som over
// tid var drevet fra hinanden — samme allergen kunne give forskelligt svar
// afhængigt af om man scannede (backend) eller kiggede på en fremhævet
// ingrediensliste (frontend). Denne fil er en sammenlægning (union) af begge
// de tidligere lister pr. allergen-kategori, dedupliceret.
//
// To bevidste udeladelser ved sammenlægningen (ikke en ren union):
// 1. "til" er UDELADT fra sesam-listen — det var kun i den gamle frontend-
//    liste (formentlig ment som det indiske navn for sesamfrø), men er også
//    et af de mest almindelige danske forholdsord ("til aftensmad", "egnet
//    til..."). Havde det ikke være udeladt, ville stort set ALT dansk
//    ingrediens-/produkttekst blive flagget som sesam efter sammenlægningen
//    ind i backends sikkerhedsberegning.
// 2. "e322" er UDELADT fra soja-listen — det var kun i den gamle frontend-
//    liste. Backend har allerede sin egen, mere nuancerede ENUMBER_ALLERGENS-
//    mekanisme (i allergens/index.ts) der korrekt sætter E322 (sojalecitin)
//    til "traces", ikke "yes" — at have "e322" som almindeligt nøgleord her
//    ville overtrumfe den mekanik og fejlagtigt gøre det til "yes".
//
// Alt andet er bevaret fra begge de oprindelige lister, SELV steder hvor det
// kan diskuteres om et ord er for bredt (fx "globulin", "omega-3",
// "margarine", kokosnød/kastanje under nødder, bløddyr-ord under skaldyr) —
// disse var allerede i den ene liste (typisk frontend), og flere af dem er
// direkte låst fast af eksisterende tests (se allergenKeywords.test.js,
// fx "musling" under skaldyr). At ændre den slags er en produkt-/taksonomi-
// beslutning, ikke en oprydning af duplikeret data, og hører til en separat,
// eksplicit beslutning — ikke en stiltiende bivirkning af denne sammenlægning.
//
// Ren ESM-data — ingen imports, ingen Deno-/Node-specifik syntaks — så filen
// kan importeres uændret fra både Deno (Edge Functions, via ../_shared/) og
// Vite/frontend (via en relativ sti ind i denne mappe).

export const ALLERGEN_KEYWORDS = {
  // Gluten = kornprotein
  gluten: [
    "gluten", "rug", "rye", "secale", "byg", "barley", "hordeum",
    "havre", "oats", "oat", "avena", "spelt", "kamut", "dinkel", "dinkelhvede",
    "emmer", "einkorn", "khorasanhvede", "hvedemel", "wheat flour",
    "rugmel", "bygmel", "havremel", "malt", "maltekstrakt", "malt extract",
    "malteddike", "maltsirup", "øleddike", "bryggersgær",
    "hvedestivelse", "wheat starch", "stivelse af hvede",
    "semulje", "semolina", "couscous", "bulgur", "farro", "freekeh",
    "seitan", "breadcrumbs", "rasp", "panko", "croutons",
  ],
  // Hvede = specifikt hvedeprotein (separat fra cøliaki/gluten)
  hvede: [
    "hvede", "wheat", "triticum", "hvedemel", "wheat flour", "mel",
    "hvedeprotein", "wheat protein", "hvedestivelse", "wheat starch",
    "hvedegluten", "hvedeklid", "wheat bran", "hvedekerne", "wheat germ",
    "durum", "spelt", "seitan", "hvedekimolie", "hvedegryn",
  ],
  // Mælkeallergi = mælkePROTEIN (kasein, valle) — separat fra laktose
  maelkeallergi: [
    "mælk", "milk", "mælkeprotein", "milk protein", "mælkebestanddele",
    "kasein", "casein", "kaseinat", "caseinate", "natriumkaseinat",
    "kalciumkaseinat", "kaliumkaseinat", "sodium caseinate",
    "potassium caseinate", "calcium caseinate",
    "valle", "whey", "valleprotein", "whey protein", "vallepulver",
    "lactalbumin", "laktalbumin", "lactoglobulin", "laktoglobulin",
    "ost", "cheese", "fromage", "fløde", "cream", "creme fraiche",
    "smør", "butter", "smørolie", "butteroil", "smøraroma",
    "yoghurt", "yogurt", "kefir", "skyr", "kvark", "quark",
    "mascarpone", "ricotta", "ghee", "mælkefedt", "milk fat", "dairy",
    "tørmælk", "mælkepulver", "milk powder", "non-fat dry milk",
    "skummetmælkspulver", "skimmed milk powder",
    "sødmælkspulver", "kærnemælk", "buttermilk",
    "flødepulver", "mælketørstof", "milk solids", "laktoprotein",
    "inddampet mælk", "condensed milk", "evaporated milk",
    "animalsk fedtstof", "animalsk olie", "margarine", "minarine",
  ],
  // Laktose = mælkeSUKKER. Backend behandler laktose bredt (enhver mælke-
  // ingrediens kan indebære laktose) med en global "laktosefri"-override
  // (se isNegated/laktosefri-håndteringen i allergens/index.ts) — samme
  // brede tilgang bruges her fremfor frontendens tidligere snævrere liste.
  laktose: [
    "laktose", "lactose", "mælkesukker", "milk sugar",
    "mælk", "milk", "fløde", "cream", "ost", "oste", "cheese",
    "yoghurt", "yogurt", "kærnemælk", "buttermilk",
    "valle", "whey", "tørmælk", "mælkepulver", "milk powder",
  ],
  aeg: [
    "æg", "egg", "eggs", "ovum", "hønseæg", "æggehvide", "egg white",
    "æggeblomme", "egg yolk", "albumin", "ovalbumin", "ovomucoid", "ovomucin",
    "lysozym", "lysozyme", "globulin", "mayonnaise", "majonæse", "remoulade",
    "meringue", "marengs", "æggepulver", "egg powder",
    "dried egg", "whole egg", "pasteuriseret æg",
  ],
  noedder: [
    "nødder", "mandel", "mandler", "almond", "hasselnød", "hasselnødder",
    "hazelnut", "corylus", "valnød", "valnødder", "walnut", "juglans",
    "cashew", "cashewnød", "cashewnødder", "anacardium",
    "pistacie", "pistachio", "pistacienød", "pistacienødder",
    "pekannød", "pekannødder", "pecan",
    "macadamia", "macadamianød", "macadamianødder",
    "paranød", "paranødder", "brazil nut",
    "pinjekerne", "pinjekerner", "pinjenød", "pinjenødder", "pine nut",
    "kokosnød", "kokosnødder", "chestnuts", "kastanje", "kastanjer",
    "nøddepasta", "nut paste", "marcipan", "marzipan", "nougat",
    "pesto", "praline", "gianduja",
    "mandelmel", "nøddemel", "mandelsmør", "nøddeolie",
    "mandelekstrakt", "hasselnøddepasta",
  ],
  jordnoedder: [
    "jordnød", "jordnødder", "peanut", "peanuts", "groundnut",
    "arachis", "arachide", "jordnøddeolie", "peanut oil", "arachideolie",
    "arachis oil", "jordnøddesmør", "peanut butter",
    "satay", "kacang", "nut sauce",
  ],
  soja: [
    "soja", "soy", "soya", "glycine max", "sojabønne", "sojabønner",
    "soybean", "soybeans", "tofu", "miso", "edamame", "tempeh", "natto",
    "sojalecithin", "soy lecithin", "sojamel", "soy flour",
    "sojaprotein", "soy protein", "sojaolie",
    "sojasauce", "soy sauce", "tamari", "shoyu",
    "sojadrik", "sojamælk",
    "textured vegetable protein", "tvp",
    "hydrolyseret sojaprotein", "isoleret sojaprotein",
    "lecithin", "lecitin",
  ],
  fisk: [
    "fisk", "fish", "ansjos", "ansjoser", "anchovy", "anchovies", "anchois",
    "torsk", "cod", "gadus", "laks", "salmon", "salmo",
    "tun", "tuna", "thunnus", "sild", "herring", "clupea",
    "makrel", "makreller", "mackerel",
    "rødspætte", "rødspætter", "plaice",
    "sardin", "sardiner", "sardine",
    "helleflynder", "halibut", "tilapia",
    "fiskesauce", "fish sauce", "nam pla", "nuoc mam",
    "worcestershire sauce", "worcestershiresauce",
    "caesar dressing", "bouillabaisse",
    "fiskeolie", "fish oil", "surimi",
    "fiskegelatine", "fiskeekstrakt", "fiskeboller", "fiskemel", "omega-3",
    "rogn", "roe", "kaviar", "caviar",
  ],
  skaldyr: [
    "skaldyr", "crustacean", "rejer", "reje", "tigerrejer", "shrimp", "prawn",
    "hummer", "lobster", "krabbe", "krabber", "crab",
    "languster", "langustere", "langoustine", "krebs", "crayfish",
    "krebsdyr", "krabbestang", "krill",
    "musling", "muslinger", "østers", "blæksprutte", "blæksprutter",
    "kammusling", "kammuslinger", "mussel", "oyster", "squid", "scallop",
    "snegle", "pilgrimsmusling", "escargot",
  ],
  selleri: [
    "selleri", "celery", "apium", "knoldselleri", "celeriac",
    "bladselleri", "selleriolie", "sellerisalt", "celery salt",
    "sellerifnug", "selleripulver", "celery seed", "celery extract",
  ],
  sennep: [
    "sennep", "mustard", "sinapis", "sennepsfrø", "mustard seed",
    "sennepsolie", "mustard oil", "sennepspulver", "mustard powder",
    "sennepsmel", "mustard flour", "dijon", "dijonsennep",
    "engelsk sennep", "grovkornet sennep",
  ],
  sesam: [
    "sesam", "sesame", "sesamum", "tahini", "tahin",
    "sesamolie", "sesame oil", "sesamfrø", "sesame seed",
    "sesampasta", "sesammel", "halva", "halvah", "gomashio", "gingelly",
  ],
  svovl: [
    "svovldioxid", "svovl", "sulphur dioxide", "sulfur dioxide",
    "sulfit", "sulfitter", "sulphite", "sulfite", "so2",
    "e220", "e221", "e222", "e223", "e224", "e225", "e226", "e227", "e228",
    "natriumsulfit", "kaliumsulfit", "natriummetabisulfit",
  ],
  lupin: [
    "lupin", "lupine", "lupinus", "lupinfrø", "lupinmel",
    "lupin flour", "lupin seed", "lupin bean",
    "lupinprotein", "lupin protein", "lupinfiber",
  ],
  bloeddyr: [
    "bløddyr", "mollusc", "mollusk", "musling", "muslinger", "mussel",
    "østers", "oyster", "blæksprutte", "blæksprutter", "squid", "octopus",
    "snegl", "snegle", "snail", "kammusling", "kammuslinger", "scallop",
    "clam", "abalone", "vongole",
  ],
};
