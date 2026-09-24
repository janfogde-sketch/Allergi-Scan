// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// allergenKeywords.js
//
// ÉN fælles kilde til allergen-nøgleord i fri ingredienstekst. Før denne fil
// fandtes der 3 uafhængige kopier af denne ordliste (AdminScreen.jsx,
// RecipesScreen.jsx, SharedComponents.jsx) — med forskelligt indhold, så
// "farligt/ikke farligt" kunne give forskelligt svar afhængigt af hvilken
// skærm man stod på. To af kopierne slog desuden mælkeprotein (maelkeallergi)
// og mælkesukker (laktose) sammen under nøglen "laktose", selvom appens
// datamodel ellers konsekvent holder dem adskilt.
//
// Nøglerne matcher ALLERGENS-id'erne i constants.jsx.
// ─────────────────────────────────────────────────────────────────────────────

export const ALLERGEN_KEYWORDS = {
  gluten: [
    // Direkte
    "gluten","rug","byg","havre","spelt","kamut","einkorn","emmer","khorasanhvede",
    // Engelsk
    "rye","barley","oats","oat","semolina","bulgur","couscous","farro","freekeh",
    // Skjulte/forarbejdede
    "maltekstrakt","malteddike","maltsirup","øleddike","bryggersgær","dinkelhvede",
    "breadcrumbs","rasp","panko","croutons","stivelse af hvede",
  ],
  hvede: [
    // Hvedeallergi — specifikt hvede (ikke det samme som cøliaki/glutenintolerance)
    "hvede","hvedemel","hvedestivelse","hvedeklid","hvedekerne","hvedeprotein","hvedegluten",
    "wheat","wheat flour","wheat starch","wheat germ","wheat bran","wheat protein","seitan",
    "mel","mel af hvede","hvedekimolie","hvedegryn",
  ],
  maelkeallergi: [
    // Mælkeallergi = reaktion på mælkeprotein (kasein, valle)
    // Fra ekspert — ingredienser der indeholder eller KAN indeholde mælkeprotein:
    "animalsk fedtstof","mælkepulver","kaliumkaseinat","animalsk olie","skummetmælkspulver",
    "valleprotein","margarine","natriumkaseinat","tørmælk","minarine","kasein",
    "inddampet mælk","mælkebestanddele","kalciumkaseinat","valle","mælketørstof",
    "kaseinat","lactalbumin","smøraroma","mælkeprotein","smørolie","sødmælkspulver","vallepulver",
    // Standard mælkebetegnelser
    "mælk","fløde","smør","ost","oste","mælkefedt","creme fraiche","yoghurt","kefir",
    "kvark","mascarpone","ricotta","skyr","ghee","laktoglobulin",
    // Engelsk
    "milk","cream","butter","cheese","whey","casein","dairy","lactalbumin",
    "milk solids","milk powder","non-fat dry milk","buttermilk","milk fat","milk protein",
    "whey protein","sodium caseinate","potassium caseinate","calcium caseinate",
    "skimmed milk powder","condensed milk","evaporated milk",
    // OBS: mælkesyre og kakaosmør tåles - de er IKKE i listen
  ],
  laktose: [
    // Laktoseintolerance — kun laktose (mælkesukker), ikke mælkeprotein
    "laktose","lactose","laktosefri","lactose-free",
    // Laktose kan indeholde spor af mælkeprotein i særlige tilfælde
  ],
  aeg: [
    "æg","æggehvide","æggeblomme","egg","eggs","albumin","ovalbumin","ovomucin",
    "lysozym","globulin","mayonnaise","majonæse","meringue","marengs",
    "egg white","egg yolk","dried egg","whole egg","egg powder","æggepulver",
  ],
  noedder: [
    // Alle nøddetyper — BÅDE ental og flertal (se stående regel i CLAUDE.md):
    // "mandel"→"mandler" er en uregelmæssig bøjning (ikke bare +suffiks), og
    // de øvrige "-nød"/"-nødder"-par matcher kun tekst i samme retning som
    // det ord der reelt står på listen, så begge former skal med eksplicit.
    "nødder","mandel","mandler","hasselnød","hasselnødder","valnødder","cashew","pekannød","pekannødder",
    "pistacienød","pistacienødder","macadamia","paranød","paranødder","kokosnød","kokosnødder",
    "pinjenød","pinjenødder","chestnuts","kastanje","kastanjer",
    "almond","hazelnut","walnut","cashew","pecan","pistachio","macadamia","brazil nut","pine nut",
    // Afledte
    "marcipan","marzipan","nougat","pesto","praline","gianduja","mandelmel","nøddemel",
    "mandelsmør","nøddeolie","mandelekstrakt","hasselnøddepasta",
  ],
  jordnoedder: [
    "jordnød","jordnødder","peanut","peanuts","groundnut","arachis","arachide",
    "jordnøddeolie","jordnøddesmør","peanut butter","peanut oil","arachis oil",
    // Skjult i asiatiske retter
    "satay","kacang","nut sauce",
  ],
  soja: [
    "soja","sojabønne","sojabønner","soy","soybean","soybeans","tofu","tempeh","miso","edamame","natto",
    "sojamel","sojaprotein","sojalecithin","sojamælk","sojasauce","tamari","shoyu",
    "textured vegetable protein","tvp","hydrolyseret sojaprotein","isoleret sojaprotein",
    "lecithin","lecitin","e322", // sojalecithin skjult som e-nummer
  ],
  fisk: [
    "fisk","ansjos","ansjoser","sardin","sardiner","laks","tun","makrel","makreller","sild","torsk","rødspætte","rødspætter","helleflynder",
    "fish","salmon","tuna","anchovy","sardine","mackerel","herring","cod","halibut","tilapia",
    // Skjulte fiskekilder
    "worcestershire sauce","worcestershiresauce","fiskesauce","fish sauce","nam pla",
    "caesar dressing","bouillabaisse","surimi","fiskeboller","fiskemel","omega-3",
    "anchovies","anchois","nuoc mam",
  ],
  skaldyr: [
    "skaldyr","reje","rejer","krabbe","krabber","hummer","musling","muslinger","østers","blæksprutte","blæksprutter","kammusling","kammuslinger",
    "shrimp","prawn","crab","lobster","mussel","oyster","squid","scallop","langoustine",
    "krebs","languster","langustere","tigerrejer","pilgrimsmusling","snegle","escargot",
  ],
  selleri: [
    "selleri","celeriac","knoldselleri","sellerisalt","sellerifnug","selleripulver",
    "celery","celeriac","celery salt","celery seed","celery extract",
  ],
  sennep: [
    "sennep","sennepsfrø","sennepspulver","sennepsolie","sennepsmel",
    "mustard","mustard seed","mustard oil","mustard flour","mustard powder",
    "dijonsennep","engelsk sennep","grovkornet sennep",
  ],
  sesam: [
    "sesam","sesamfrø","sesamolie","tahini","sesampasta","sesammel",
    "sesame","sesame seed","sesame oil","til","gingelly",
  ],
  svovl: [
    "sulfit","sulfitter","svovldioxid","svovl","sulphite","sulfite","sulphur dioxide","so2",
    "e220","e221","e222","e223","e224","e225","e226","e227","e228",
  ],
  lupin: [
    "lupin","lupinmel","lupinfrø","lupinprotein","lupinfiber",
    "lupin flour","lupin seed","lupin bean",
  ],
  bloeddyr: [
    "blæksprutte","blæksprutter","østers","musling","muslinger","snegle","kammusling","kammuslinger",
    "squid","oyster","mussel","snail","scallop","clam","abalone",
  ],
};

export const ALL_ALLERGEN_WORDS = Object.values(ALLERGEN_KEYWORDS).flat();

// Find ALLE forekomster af et nøgleord i teksten (ordgrænse-sikret for korte
// nøgleord <=4 tegn, ren understreng for længere) og returnér deres startindeks.
// Skal scanne HELE teksten, ikke stoppe ved første forekomst — ellers overser
// funktionen fx det ægte "mel" i "rismel, mel" (første "mel" fejler ordgrænse-
// tjekket inde i "rismel", men uden videre scanning bliver den ægte forekomst
// bagefter aldrig tjekket). Fundet ved en allergen-logik-gennemgang (16. sept.
// 2026) — den farligste fejltype her er en falsk negativ (overset allergen).
function findAllKeywordIndices(text, kw) {
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const wordBoundary = kw.length <= 4;
  const pattern = wordBoundary
    ? new RegExp(`(^|[^a-zæøå0-9])(${escaped})([^a-zæøå0-9]|$)`, "gi")
    : new RegExp(`(${escaped})`, "gi");
  const indices = [];
  let m;
  while ((m = pattern.exec(text))) {
    const idx = wordBoundary ? m.index + m[1].length : m.index;
    indices.push(idx);
    pattern.lastIndex = idx + kw.length; // undgå uendeligt loop ved nul-bredde-match
  }
  return indices;
}

// Negations-detektion: "mælkefri", "uden mælk", "gluten under 0,01%" — samme
// heuristik (18-tegns kontekst-vindue) som backend allergens Edge Function's
// isNegated(), porteret hertil fordi highlighting/diæt-tjek/custom-allergi-
// matching selv scanner rå ingredienstekst i stedet for at gå via de allerede
// analyserede allergen_flags. Korte nøgleord (<=4 tegn) er allerede delvist
// beskyttet af ordgrænse-tjekket ("mælkefri" fejler boundary da "e" efter
// "mælk" er et bogstav) — denne funktion lukker hullet for lange nøgleord som
// "gluten", der ellers matcher som ren understreng inde i "glutenfri".
function isNegatedAt(text, idx, kwLength) {
  const before = text.substring(Math.max(0, idx - 18), idx);
  const after = text.substring(idx + kwLength, idx + kwLength + 18);
  return (
    before.includes("uden") ||
    before.includes("fri for") ||
    before.includes("ingen") ||
    after.startsWith("fri") ||
    after.startsWith("-fri") ||
    after.includes("under 0") ||
    after.includes("free")
  );
}

export function keywordMatches(text, keyword) {
  const kw = keyword.toLowerCase();
  if (!kw) return false;
  const indices = findAllKeywordIndices(text, kw);
  // "some" i stedet for kun at tjekke første forekomst — hvis BARE ÉN
  // forekomst af ordet er en ægte (ikke-negeret) omtale, skal det flages,
  // selvom en anden forekomst af samme ord et andet sted er negeret.
  return indices.some(idx => !isNegatedAt(text, idx, kw.length));
}

// Fritekst-matching af brugerens EGNE, frit tilføjede allergier (feltet
// "customAllerg"/family members' ".custom" — fx "Fructose") mod en
// ingredienstekst. De 16 faste allergener har en kurateret nøgleordsliste med
// synonymer/danske bøjninger/engelske oversættelser (se ALLERGEN_KEYWORDS
// ovenfor) — en custom-allergi er derimod et helt vilkårligt ord brugeren
// selv har skrevet, så vi kan kun søge efter PRÆCIS det ord (samme ordgrænse-
// og negations-logik som resten af matchingen ovenfor, men ingen synonymer).
// Mindre pålideligt end de faste allergener af natur — vis derfor ALTID en
// disclaimer i UI'et ved et match, og opfordr brugeren til selv at dobbelt-
// tjekke samt til at fortælle os hvis vi overser noget.
export function matchCustomAllergens(ingredientsText, customTerms) {
  if (!ingredientsText || !customTerms?.length) return [];
  const text = ingredientsText.toLowerCase();
  const matched = [];
  const seen = new Set();
  for (const raw of customTerms) {
    const term = (raw || "").trim();
    if (!term) continue;
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    if (keywordMatches(text, term)) { matched.push(term); seen.add(key); }
  }
  return matched;
}

// Hvilke allergen-id'er nævnes i en fri ingrediens-/produkttekst.
export function detectAllergensInText(text) {
  const n = text.toLowerCase();
  return Object.entries(ALLERGEN_KEYWORDS)
    .filter(([, terms]) => terms.some(t => keywordMatches(n, t)))
    .map(([id]) => id);
}

// Bruges til at fremhæve enkeltord (allerede splittet på whitespace) i en
// ingrediensliste — fx IngredientsList. `allergenFlags` kan bruges til at
// undlade at fremhæve allergener brugeren har markeret "no" for.
export function isAllergenWord(word, allergenFlags = {}) {
  const w = word.toLowerCase().replace(/[^a-zæøå0-9]/g, "");
  if (w.length < 2) return false;
  return Object.entries(ALLERGEN_KEYWORDS).some(([key, terms]) => {
    if (allergenFlags[key] === "no" || allergenFlags[key] === false) return false;
    return terms.some(t => {
      const tc = t.toLowerCase().replace(/[^a-zæøå0-9]/g, "");
      if (tc.length <= 4) return w === tc; // ordgrænse for korte ord — undgå "mel" i "rismel"
      // KUN denne retning: matcher når selve ingrediensordet indeholder
      // nøgleordet (fx "hasselnøddepasta" indeholder "hasselnød"). Den
      // omvendte retning (nøgleordet indeholder ordet) blev fjernet 24.
      // sept. 2026 — den fangede fx det harmløse "aroma" som et
      // mælkeallergen, fordi "aroma" er en understreng af det langt mere
      // specifikke "smøraroma". Rammer kun selve VISNINGEN (fremhævning i
      // IngredientsList) — den reelle farlig/sikker-beregning bruger
      // findAllKeywordIndices/keywordMatches, ikke denne funktion.
      return w.includes(tc);
    });
  });
}
