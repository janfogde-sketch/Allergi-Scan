// @ts-check
// ─── EATSAFE KONSTANTER ─────────────────────────────────────────────────────

export const SUPABASE_URL = "https://jegrpcflyguadyxialkm.supabase.co";
// Version af privatlivspolitikkens samtykketekst (gemmes sammen med samtykket, 2. okt. 2026). Ændres teksten væsentligt, hæves versionen.
export const HEALTH_CONSENT_VERSION = "2026-10-02";

export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplZ3JwY2ZseWd1YWR5eGlhbGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjY5NjQsImV4cCI6MjA5NDc0Mjk2NH0.QErfbw2xmsdYjTZCS1WUOUwQHv6G2PKQRldyj8rdGq8";

// ─── KONSTANTER ──────────────────────────────────────────────────────────────

// ─── EATSAFE LOGO KOMPONENT ──────────────────────────────────────────────────

export { E_CATEGORIES, E_NUMBERS } from "./data/eNumbers.js";


// "type" bruges til at dele allergener op i to tydeligt adskilte sektioner
// i onboarding trin 2 (25. sept. 2026, brugerfeedback: "Hvedeallergi,
// mælkeallergi og laktoseintolerance er ikke det samme") — "allergi" for
// klassiske IgE-medierede fødevareallergier, "intolerance" for laktose-
// intolerance, sulfit-følsomhed og gluten (cøliaki/glutenfølsomhed, som
// ikke er det samme som hvedeallergi — deraf også "note"-feltet på gluten).
export const ALLERGENS = [
  // Note udvidet (28. sept. 2026, Profil-oprydning, krav 6) til også at
  // forklare forholdet til kostpræferencen "Glutenfri" — de to er koblet
  // (se useGlutenFreeSync i AllergenPicker.jsx: vælges Gluten her, tilføjes
  // Glutenfri automatisk under Kostpræferencer), så brugeren ikke behøver
  // vælge begge selv for at opnå samme filtrering.
  // Glutenfølsomhed (ikke-cøliakisk) er et eget valg: ikke det samme som hvedeallergi og ikke cøliaki (som er et eget valg, `coeliaki`).
  // `pickerLabel` bruges i valg-skærmene; `label` bruges i resultater ("Indeholder gluten"). Id'et er uændret.
  { id:"gluten",        label:"Gluten",           pickerLabel:"Glutenfølsomhed", emoji:"🥖", type:"intolerance", note:"Glutenfølsomhed og glutenfri kost er koblet sammen. Vælger du glutenfølsomhed, kan glutenfri kost anvendes automatisk, så du ikke skal vælge begge. Det er ikke det samme som hvedeallergi eller cøliaki." },
  { id:"hvede",         label:"Hvede",             emoji:"🌾", type:"allergi", note:"Hvedeallergi gælder hvede. Det er ikke det samme som glutenfølsomhed, og de vælges hver for sig." },
  // Cøliaki (2. okt. 2026, Bjørn): et eget, eksplicit valg, aldrig udledt af Gluten eller Hvede. `profileOnly`: det er en tilstand hos brugeren,
  // ikke en egenskab ved et produkt, så det findes ikke som produktflag (se PRODUCT_ALLERGENS). Matches mod produktets gluten-/hvedeflag
  // (`effectiveAllergenFlag` i helpers.js). Cøliaki-vejledningen om spor vises kun for dette id (`AllergenSensitivity`).
  { id:"coeliaki",      label:"Cøliaki",           emoji:"🌾", type:"intolerance", profileOnly:true, note:"Cøliaki er en autoimmun sygdom udløst af gluten. Det er ikke det samme som hvedeallergi eller glutenfølsomhed." },
  { id:"maelkeallergi", label:"Mælk",              emoji:"🥛", type:"allergi" },
  // emoji er kun et fallback-tegn for evt. rene tekst-kontekster uden JSX
  // (se AllergenGlyph i SharedComponents.jsx, som al UI reelt bruger) — det
  // oprindelige "🍬" (slik) havde ingen sammenhæng med laktose overhovedet.
  // Laktoseintolerance er ikke mælkeallergi og har ingen "kan indeholde spor af"-logik (traceOk:false): sporvalg vises ikke for den.
  { id:"laktose",       label:"Laktose",           emoji:"💧", type:"intolerance", traceOk:false },
  { id:"aeg",           label:"Æg",               emoji:"🥚", type:"allergi" },
  { id:"noedder",       label:"Nødder",            emoji:"🌰", type:"allergi" },
  { id:"jordnoedder",   label:"Jordnødder",        emoji:"🥜", type:"allergi" },
  { id:"soja",          label:"Soja",              emoji:"🫛", type:"allergi" },
  { id:"fisk",          label:"Fisk",              emoji:"🐟", type:"allergi" },
  { id:"skaldyr",       label:"Skaldyr",           emoji:"🦐", type:"allergi" },
  { id:"selleri",       label:"Selleri",           emoji:"🥬", type:"allergi" },
  { id:"sennep",        label:"Sennep",            emoji:"🟡", type:"allergi" },
  { id:"sesam",         label:"Sesam",             emoji:"🌿", type:"allergi" },
  // Sulfitter: mærkningspligtigt EU-allergen (svovldioxid/sulfitter) over 10 mg/kg eller 10 mg/l samlet SO₂. Klassificeres fortsat som
  // "intolerance" i resultatlogikken (sikker filtrering), men har sin egen mærkningsgrænse som data (labelThresholdMgPerKg).
  { id:"svovl",         label:"Sulfitter",         emoji:"🍷", type:"intolerance", labelThresholdMgPerKg:10, note:"Sulfitter er et mærkningspligtigt allergen i EU, når der er over 10 mg/kg eller 10 mg/l (målt som samlet SO₂). Under grænsen står de ikke nødvendigvis på emballagen." },
  { id:"lupin",         label:"Lupin",             emoji:"🌸", type:"allergi" },
  { id:"bloeddyr",      label:"Bløddyr",           emoji:"🦑", type:"allergi" },
];

// Allergener, der findes som produktflag (allergen_flags). Cøliaki er kun et profilvalg og hører ikke hjemme i produktredigering, indberetning mv.
export const PRODUCT_ALLERGENS = ALLERGENS.filter(a => !a.profileOnly);

export { DEMO_CODES, DUMMY_PRODUCT, MOCK_PRODUCTS } from "./data/demoProducts.js";

export const SCREENS = {
  WELCOME:"welcome", LOGIN:"login", ONBOARD:"onboard",
  // VERIFYEMAIL: "Bekræft din e-mail" efter oprettelse. BOOT: tom skærm mens
  // onboarding-status hentes ved appstart (se useAuth.js, ONBOARDED_KEY).
  VERIFYEMAIL:"verifyemail", BOOT:"boot",
  // RESETPASSWORD: "Vælg ny adgangskode" efter linket i "Glemt adgangskode"-mailen.
  RESETPASSWORD:"resetpassword",
  HOME:"home",
  LIST:"list", PROFILE:"profile", FAMILY:"family",
  RESULT:"result", HISTORY:"history",
  NOTFOUND:"notfound", SUBMITTED:"submitted",
  ADMIN:"admin", FAVORITES:"favorites",
  MADPAS:"madpas", RECIPES:"recipes", EDITPROFILE:"editprofile", EDITPREFERENCES:"editpreferences", SUGGEST_EDIT:"suggest_edit",
  KNOWLEDGE:"knowledge",
  SETTINGS:"settings",
  // Beskeder (30. sept. 2026): liste over egne notifikationer + den fulde besked,
  // som push åbner via ?notification={id}.
  NOTIFICATIONS:"notifications", NOTIFICATION:"notification", TICKET:"ticket",
  // Brugsvilkår/Privatlivspolitik (29. sept. 2026, "Opdater siderne...med
  // tydelig navigation tilbage") — almindelige undersider, ikke modaler, se
  // TermsScreen.jsx/PrivacyScreen.jsx + App.jsx's openLegal/legalReturnScreen.
  TERMS:"terms", PRIVACY:"privacy",
};

export const PAGE_IDS = {
  welcome:"SCR-01", login:"SCR-02", onboard:"SCR-03",
  home:"SCR-04", search:"SCR-06",
  list:"SCR-07", profile:"SCR-08", family:"SCR-09",
  result:"SCR-10", history:"SCR-11", notfound:"SCR-12",
  submitted:"SCR-13", admin:"SCR-14", favorites:"SCR-15",
  madpas:"SCR-16", recipes:"SCR-17", editprofile:"SCR-18",
  knowledge:"SCR-19", settings:"SCR-21",
  terms:"SCR-22", privacy:"SCR-23",
  notifications:"SCR-24", notification:"SCR-25", ticket:"SCR-26",
};


// Kostpræferencer (diæter) er sat på pause (2. okt. 2026, Jans beslutning): de vises ikke i appen og indgår
// ikke i vurderinger, Madpas eller indstillinger, men al kode, alle data og al logik er bevaret. Sæt til true
// for at tage funktionen i brug igen (se "Kostpræferencer sat på pause" i CLAUDE.md).
export const DIETS_ENABLED = false;

export const DIETS = [
  { id:"vegan",       label:"Vegansk",       desc:"Ingen animalske produkter" },
  { id:"vegetarian",  label:"Vegetarisk",    desc:"Ingen kød eller fisk" },
  { id:"pescetarian", label:"Pescetarisk",   desc:"Ingen kød, men fisk ok" },
  { id:"gluten-free", label:"Glutenfri",     desc:"Ingen gluten" },
  { id:"keto",        label:"Keto",          desc:"Lavt kulhydratindhold" },
];

export const AVATAR_COLORS = ["#52b788","#74c69d","#40916c","#b7e4c7","#2d6a4f","#95d5b2","#f4a261","#e76f51"];

// ─── HJÆLPEFUNKTIONER ────────────────────────────────────────────────────────

export const uid = () => Math.random().toString(36).slice(2,9);

// Pæn ingrediensliste — fremhæver allergener med STORE BOGSTAVER

export const MADPAS_LANGUAGES = [
  { code:"da", flag:"🇩🇰", name:"Dansk",      bcp:"da-DK" },
  { code:"en", flag:"🇬🇧", name:"English",    bcp:"en-GB" },
  { code:"de", flag:"🇩🇪", name:"Deutsch",    bcp:"de-DE" },
  { code:"fr", flag:"🇫🇷", name:"Français",   bcp:"fr-FR" },
  { code:"es", flag:"🇪🇸", name:"Español",    bcp:"es-ES" },
  { code:"it", flag:"🇮🇹", name:"Italiano",   bcp:"it-IT" },
  { code:"nl", flag:"🇳🇱", name:"Nederlands", bcp:"nl-NL" },
  { code:"pt", flag:"🇵🇹", name:"Português",  bcp:"pt-PT" },
  { code:"pl", flag:"🇵🇱", name:"Polski",     bcp:"pl-PL" },
  { code:"sv", flag:"🇸🇪", name:"Svenska",    bcp:"sv-SE" },
  { code:"no", flag:"🇳🇴", name:"Norsk",      bcp:"nb-NO" },
  { code:"ja", flag:"🇯🇵", name:"日本語",      bcp:"ja-JP" },
  { code:"zh", flag:"🇨🇳", name:"中文",        bcp:"zh-CN" },
  { code:"ar", flag:"🇸🇦", name:"العربية",    bcp:"ar-SA", rtl:true },
  { code:"tr", flag:"🇹🇷", name:"Türkçe",     bcp:"tr-TR" },
  { code:"th", flag:"🇹🇭", name:"ภาษาไทย",    bcp:"th-TH" },
  { code:"el", flag:"🇬🇷", name:"Ελληνικά",   bcp:"el-GR" },
];
