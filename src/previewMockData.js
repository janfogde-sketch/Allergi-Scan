// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// previewMockData.js
//
// Mock-produkter til den delte Artifact-preview (--mode artifact-preview,
// se CLAUDE.md afsnit 4). Bruges KUN når appen bygges i preview-mode — aldrig
// i den rigtige produktions-build. Giver Søg, Indkøbsliste og Produkt-view
// noget at vise uden en rigtig Supabase-session, så design kan gennemgås i
// preview'en. Ingen image_url — sandboxen kan ikke hente eksterne billeder,
// og ProductImage falder allerede pænt tilbage til et kategori-ikon uden.
//
// Dækker bevidst alle tre sikkerheds-verdikter (rød/gul/grøn), så design på
// tværs af verdikt-farver kan ses: valgt ud fra preview-brugerens mock-
// allergener (gluten, nødder — se OnboardingScreen.jsx's preview-knap).
// ─────────────────────────────────────────────────────────────────────────────

export const PREVIEW_MOCK_PRODUCTS = [
  {
    id: "preview-p1",
    name: "Nøddebar med chokolade", brand: "Go Ahead!",
    ean: "5701234500011", category: "Snacks", image_url: null,
    ingredients: "Havregryn, sukker, MANDLER 14%, HASSELNØDDER 9%, chokolade (kakaomasse, sukker, kakaosmør), honning, vegetabilsk olie.",
    allergen_flags: {
      gluten:"no", laktose:"no", aeg:"no",
      noedder:"yes", jordnoedder:"no", soja:"no",
      fisk:"no", skaldyr:"no", selleri:"no",
      sennep:"no", sesam:"no", svovl:"no",
      lupin:"no", bloeddyr:"no",
    },
    nutrition: { energy_kcal:456, fat:18.2, saturated_fat:5.1, carbohydrates:62.0, sugars:38.0, fiber:5.5, protein:8.0, salt:0.15 },
    verified_status:"verified", source:"preview",
  },
  {
    id: "preview-p2",
    name: "Skæret Rugbrød", brand: "Kohberg",
    ean: "5701234500028", category: "Brød", image_url: null,
    ingredients: "Vand, RUGKERNER, HVEDEMEL, rugmel, solsikkekerner, surdej, salt, gær.",
    allergen_flags: {
      gluten:"traces", laktose:"no", aeg:"no",
      noedder:"no", jordnoedder:"no", soja:"no",
      fisk:"no", skaldyr:"no", selleri:"no",
      sennep:"no", sesam:"no", svovl:"no",
      lupin:"no", bloeddyr:"no",
    },
    nutrition: { energy_kcal:225, fat:2.8, saturated_fat:0.4, carbohydrates:38.0, sugars:2.1, fiber:8.5, protein:7.9, salt:1.1 },
    verified_status:"verified", source:"preview",
  },
  {
    id: "preview-p3",
    name: "Letmælk", brand: "Arla",
    ean: "5701234500035", category: "Mejeri", image_url: null,
    ingredients: "Skummetmælk, fløde.",
    allergen_flags: {
      gluten:"no", laktose:"yes", aeg:"no",
      noedder:"no", jordnoedder:"no", soja:"no",
      fisk:"no", skaldyr:"no", selleri:"no",
      sennep:"no", sesam:"no", svovl:"no",
      lupin:"no", bloeddyr:"no",
    },
    nutrition: { energy_kcal:47, fat:1.5, saturated_fat:1.0, carbohydrates:4.6, sugars:4.6, fiber:0, protein:3.4, salt:0.1 },
    verified_status:"verified", source:"preview",
  },
  {
    id: "preview-p4",
    name: "Mørk Chokolade 70%", brand: "Anthon Berg",
    ean: "5701234500042", category: "Chokolade", image_url: null,
    ingredients: "Kakaomasse, sukker, kakaosmør, emulgator: solsikkelecithin, vaniljearoma.",
    allergen_flags: {
      gluten:"no", laktose:"no", aeg:"no",
      noedder:"no", jordnoedder:"no", soja:"no",
      fisk:"no", skaldyr:"no", selleri:"no",
      sennep:"no", sesam:"no", svovl:"no",
      lupin:"no", bloeddyr:"no",
    },
    nutrition: { energy_kcal:598, fat:42.0, saturated_fat:25.9, carbohydrates:38.0, sugars:32.0, fiber:11.0, protein:7.8, salt:0.02 },
    verified_status:"verified", source:"preview",
  },
];
