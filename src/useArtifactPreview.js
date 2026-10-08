import { useCallback } from "react";
import { SCREENS, AVATAR_COLORS } from "./constants.jsx";
import { PREVIEW_MOCK_PRODUCTS } from "./previewMockData.js";
import { buildScanResultFromProductData } from "./useProduct.js";

  // ── Artifact-preview: "Se app uden login"-knappen (se OnboardingScreen.jsx)
  // Kaldes KUN i --mode artifact-preview (login mod Supabase er upålideligt
  // fra Artifact-domænet, se CLAUDE.md afsnit 4). Sætter en mock-bruger +
  // mock-allergener, forudfylder produkt-cachen med mock-produkter (samme
  // EAN'er som Søg og Indkøbsliste bruger, se previewMockData.js — sikrer at
  // et klik på et søgeresultat eller en vare i indkøbslisten åbner korrekt i
  // Produkt-view via runLookupProduct's cache-first-gren, helt uden netværk),
  // og indlæser den samme mock-indkøbsliste som useShoppingList.js's egen
  // artifact-preview-gren i loadShoppingList. Udvidet til også at dække
  // Profil (fødselsår/køn — ellers viser "udfyld din profil"-banneret sig
  // konstant), Familie, Scanningshistorik og Favoritter — alle resterende
export function useArtifactPreview({ setUserId, setUser, setAllergens, productCacheRef, loadShoppingList, setFamily, setHistory, setFavorites, setScreen }) {
  // steder i appen der ellers ville stå tomme uden en rigtig session.
  const PREVIEW_MOCK_ALLERGENS = ["gluten", "noedder"];
  const activatePreviewMode = useCallback(() => {
    setUserId("preview-demo-bruger");
    setUser(u => ({ ...u, name: "Mille Nielsen", email: "preview@eatsafe.dk", birth_year: "1991", gender: "Kvinde" }));
    setAllergens(PREVIEW_MOCK_ALLERGENS);
    for (const product of PREVIEW_MOCK_PRODUCTS) {
      productCacheRef.current[product.ean] = buildScanResultFromProductData({
        product, data: {}, ean: product.ean,
        activeIds: PREVIEW_MOCK_ALLERGENS, activeENumbers: [], family: [], activeProfiles: [],
      });
    }
    loadShoppingList();

    setFamily([
      { id:"preview-fam-1", name:"Oskar Nielsen", color:AVATAR_COLORS[0], birth_year:2016, gender:"Mand", allergens:["jordnoedder"], custom:[], diets:[], eNumbers:[] },
      { id:"preview-fam-2", name:"Sofie Nielsen", color:AVATAR_COLORS[1], birth_year:2019, gender:"Kvinde", allergens:[], custom:["Kiwi"], diets:["vegetarian"], eNumbers:[] },
    ]);

    const now = Date.now();
    setHistory([
      { ean_scanned:PREVIEW_MOCK_PRODUCTS[0].ean, products:{ name:PREVIEW_MOCK_PRODUCTS[0].name, brand:PREVIEW_MOCK_PRODUCTS[0].brand }, result:"danger", scanned_at:new Date(now - 1000*60*30).toISOString() },
      { ean_scanned:PREVIEW_MOCK_PRODUCTS[3].ean, products:{ name:PREVIEW_MOCK_PRODUCTS[3].name, brand:PREVIEW_MOCK_PRODUCTS[3].brand }, result:"safe", scanned_at:new Date(now - 1000*60*60*4).toISOString() },
      { ean_scanned:PREVIEW_MOCK_PRODUCTS[1].ean, products:{ name:PREVIEW_MOCK_PRODUCTS[1].name, brand:PREVIEW_MOCK_PRODUCTS[1].brand }, result:"warn", scanned_at:new Date(now - 1000*60*60*24).toISOString() },
      { ean_scanned:PREVIEW_MOCK_PRODUCTS[2].ean, products:{ name:PREVIEW_MOCK_PRODUCTS[2].name, brand:PREVIEW_MOCK_PRODUCTS[2].brand }, result:"safe", scanned_at:new Date(now - 1000*60*60*24*2).toISOString() },
    ]);

    setFavorites([
      { name:PREVIEW_MOCK_PRODUCTS[3].name, brand:PREVIEW_MOCK_PRODUCTS[3].brand, ean:PREVIEW_MOCK_PRODUCTS[3].ean, image_url:null, category:"Slik & snacks", savedAt:now - 1000*60*60*24*3, savedByMe:true },
      { name:PREVIEW_MOCK_PRODUCTS[2].name, brand:PREVIEW_MOCK_PRODUCTS[2].brand, ean:PREVIEW_MOCK_PRODUCTS[2].ean, image_url:null, category:"Mejeri", savedAt:now - 1000*60*60*24*6, savedByMe:true },
    ]);

    setScreen(SCREENS.HOME);
  }, [setUserId, setUser, setAllergens, productCacheRef, loadShoppingList, setFamily, setHistory, setFavorites, setScreen]);
  return activatePreviewMode;
}
