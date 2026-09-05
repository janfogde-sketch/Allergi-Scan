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
    "mælk","fløde","smør","ost","mælkefedt","creme fraiche","yoghurt","kefir",
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
    // Alle nøddetyper
    "nødder","mandler","hasselnødder","valnødder","cashew","pekannødder","pistacienødder","macadamia",
    "paranødder","kokosnød","pinjenødder","chestnuts","kastanjer",
    "almond","hazelnut","walnut","cashew","pecan","pistachio","macadamia","brazil nut","pine nut",
    // Afledte
    "marcipan","marzipan","nougat","pesto","praline","gianduja","mandelmel","nøddemel",
    "mandelsmør","nøddeolie","mandelekstrakt","hasselnøddepasta",
  ],
  jordnoedder: [
    "jordnødder","peanut","peanuts","groundnut","arachis","arachide",
    "jordnøddeolie","jordnøddesmør","peanut butter","peanut oil","arachis oil",
    // Skjult i asiatiske retter
    "satay","kacang","nut sauce",
  ],
  soja: [
    "soja","sojabønner","soy","soybeans","tofu","tempeh","miso","edamame","natto",
    "sojamel","sojaprotein","sojalecithin","sojamælk","sojasauce","tamari","shoyu",
    "textured vegetable protein","tvp","hydrolyseret sojaprotein","isoleret sojaprotein",
    "lecithin","lecitin","e322", // sojalecithin skjult som e-nummer
  ],
  fisk: [
    "fisk","ansjos","sardiner","laks","tun","makrel","sild","torsk","rødspætte","helleflynder",
    "fish","salmon","tuna","anchovy","sardine","mackerel","herring","cod","halibut","tilapia",
    // Skjulte fiskekilder
    "worcestershire sauce","worcestershiresauce","fiskesauce","fish sauce","nam pla",
    "caesar dressing","bouillabaisse","surimi","fiskeboller","fiskemel","omega-3",
    "anchovies","anchois","nuoc mam",
  ],
  skaldyr: [
    "skaldyr","rejer","krabbe","hummer","muslinger","østers","blæksprutte","kammusling",
    "shrimp","prawn","crab","lobster","mussel","oyster","squid","scallop","langoustine",
    "krebs","languster","tigerrejer","pilgrimsmusling","snegle","escargot",
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
    "sulfitter","svovldioxid","svovl","sulphite","sulfite","sulphur dioxide","so2",
    "e220","e221","e222","e223","e224","e225","e226","e227","e228",
  ],
  lupin: [
    "lupin","lupinmel","lupinfrø","lupinprotein","lupinfiber",
    "lupin flour","lupin seed","lupin bean",
  ],
  bloeddyr: [
    "blæksprutte","østers","muslinger","snegle","kammusling",
    "squid","oyster","mussel","snail","scallop","clam","abalone",
  ],
};

export const ALL_ALLERGEN_WORDS = Object.values(ALLERGEN_KEYWORDS).flat();

// Ordgrænse-sikret match for korte nøgleord (<=4 tegn) — ellers matcher fx
// "mel" (hvede) som understreng i "rismel"/"majsmel" (glutenfrit), eller
// "ost" (mælk) i "kost". Længere ord matches som understreng, som hidtil.
export function keywordMatches(text, keyword) {
  const kw = keyword.toLowerCase();
  if (kw.length > 4) return text.includes(kw);
  const idx = text.indexOf(kw);
  if (idx === -1) return false;
  const before = idx > 0 ? text[idx - 1] : " ";
  const after = idx + kw.length < text.length ? text[idx + kw.length] : " ";
  const isWordChar = c => /[a-zæøå0-9]/i.test(c);
  return !isWordChar(before) && !isWordChar(after);
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
      return w.includes(tc) || tc.includes(w);
    });
  });
}
