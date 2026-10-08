// @ts-check
// Demo- og testprodukter. Flyttet ud af constants.jsx; genudgives derfra.

export const DEMO_CODES = [
  { code:"3017620422003", label:"Nutella" },
  { code:"5449000054227", label:"Coca-Cola" },
  { code:"7394376616566", label:"Oatly" },
  { code:"5701029015306", label:"Lurpak" },
];

export const DUMMY_PRODUCT = {
  code: "3017620422003",
  ean: "3017620422003",
  name: "Nutella",
  brand: "Ferrero",
  image_url: "https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.820.400.jpg",
  category: "Chokolade",
  status: "danger",
  headline: "Indeholder allergen",
  summary: "Produktet indeholder Laktose, Nødder.",
  source: "open_food_facts",
  verified_status: "unverified",
  hasUnknown: false,
  matchedDanger: ["laktose", "noedder"],
  matchedWarning: ["soja"],
  familyImpact: [],
  allergen_flags: {
    gluten: "no", laktose: "yes", aeg: "no",
    noedder: "yes", jordnoedder: "no", soja: "traces",
    fisk: "no", skaldyr: "no", selleri: "no",
    sennep: "no", sesam: "no", svovl: "no",
    lupin: "no", bloeddyr: "no",
  },
  ingredients: "Sucre, huile de palme, NOISETTES 13%, cacao maigre 7,4%, LAIT écrémé en poudre 6,6%, LACTOSERUM en poudre, émulsifiants: lécithines (SOJA), vanilline.",
  tags: ["vegetarian"],
  nutrition: {
    energy_kcal: 539,
    fat: 30.9,
    saturated_fat: 10.6,
    carbohydrates: 57.5,
    sugars: 56.3,
    fiber: 3.4,
    protein: 6.3,
    salt: 0.11,
  },
  flags: [
    { type:"bad", text:"Indeholder Laktose" },
    { type:"bad", text:"Indeholder Nødder" },
    { type:"maybe", text:"Kan indeholde spor af Soja" },
  ],
  timestamp: Date.now(),
};

// Mock produkter med fuld data til test

export const MOCK_PRODUCTS = [
  {
    id: "mock-1", ean: "5701029015306", name: "Lurpak Smør", brand: "Lurpak",
    category: "Mejeri", verified_status: "verified", source: "verified",
    image_url: null,
    allergen_flags: { gluten:"no", laktose:"yes", aeg:"no", noedder:"no", jordnoedder:"no", soja:"no", fisk:"no", skaldyr:"no", selleri:"no", sennep:"no", sesam:"no", svovl:"no", lupin:"no", bloeddyr:"no" },
    ingredients: "Pasteuriseret fløde (mælk), salt.",
    nutrition: { energy_kcal:717, fat:80, saturated_fat:52, carbohydrates:0.6, sugars:0.6, fiber:0, protein:0.6, salt:1.5 },
    tags: ["vegetarian"],
  },
  {
    id: "mock-2", ean: "5000112546415", name: "Coca-Cola Original", brand: "Coca-Cola",
    category: "Drikkevarer", verified_status: "verified", source: "verified",
    image_url: null,
    allergen_flags: { gluten:"no", laktose:"no", aeg:"no", noedder:"no", jordnoedder:"no", soja:"no", fisk:"no", skaldyr:"no", selleri:"no", sennep:"no", sesam:"no", svovl:"no", lupin:"no", bloeddyr:"no" },
    ingredients: "Vand, sukker, kuldioxid, farve (E150d), surheds regulerende middel (E338), naturlige aromaer inkl. koffein.",
    nutrition: { energy_kcal:42, fat:0, saturated_fat:0, carbohydrates:10.6, sugars:10.6, fiber:0, protein:0, salt:0 },
    tags: ["vegan", "vegetarian"],
  },
  {
    id: "mock-3", ean: "7394376616566", name: "Oatly Havredrik", brand: "Oatly",
    category: "Plantebaseret", verified_status: "verified", source: "verified",
    image_url: null,
    allergen_flags: { gluten:"traces", laktose:"no", aeg:"no", noedder:"no", jordnoedder:"no", soja:"no", fisk:"no", skaldyr:"no", selleri:"no", sennep:"no", sesam:"no", svovl:"no", lupin:"no", bloeddyr:"no" },
    ingredients: "Vand, havre 10%, rapsolie, calcium, vitaminer (D2, riboflavin, B12), salt.",
    nutrition: { energy_kcal:46, fat:1.5, saturated_fat:0.2, carbohydrates:6.7, sugars:4, fiber:0.8, protein:1, salt:0.07 },
    tags: ["vegan", "vegetarian"],
  },
];
