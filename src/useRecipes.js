// @ts-nocheck
import { useState, useRef } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { makeHeaders, apiCall } from "./helpers.js";

// Opskrifter ændrer sig sjældent (kræver admin-godkendelse), men kan ændre
// sig i løbet af en lang session (fx en admin godkender en ny opskrift
// mens en anden bruger allerede har appen åben) — reload derfor stille
// i baggrunden efter denne alder, i stedet for aldrig.
const STALE_MS = 10 * 60 * 1000; // 10 minutter

export function useRecipes(accessToken, userId) {
  const [recipes, setRecipes] = useState([]);
  const loadedAtRef = useRef(0);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [recipeFilter, setRecipeFilter] = useState("alle");
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [showSubmitRecipe, setShowSubmitRecipe] = useState(false);
  const [submitRecipe, setSubmitRecipe] = useState({ title:"", description:"", category:"aftensmad", tags:[] });
  const [submitSteps, setSubmitSteps] = useState([""]);
  const [submitIngredients, setSubmitIngredients] = useState([{ name:"", amount:"", unit:"" }]);
  const [submittingRecipe, setSubmittingRecipe] = useState(false);
  const [recipeTermsOpen, setRecipeTermsOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState({});
  const [recipeTermsAccepted, setRecipeTermsAccepted] = useState(false);
  const [recipeServings, setRecipeServings] = useState(4);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeSafeOnly, setRecipeSafeOnly] = useState(false);

  const loadRecipes = async (force = false) => {
    // Allerede indlæst og stadig frisk — spring over. `force` (fx et
    // eksplicit "opdatér"-tryk) eller data ældre end STALE_MS tvinger et nyt kald.
    if (!force && recipes.length > 0 && Date.now() - loadedAtRef.current < STALE_MS) return;
    setRecipesLoading(true);
    try {
      // Indlæs ALLE godkendte opskrifter — filtrer client-side (627 poster er hurtigt)
      // Opskrifter er public — brug kun anon key (JWT kan være udløbet)
      const url = `${SUPABASE_URL}/rest/v1/recipes?select=id,title,category,image_url,tags,allergen_flags,servings,prep_time_minutes,cook_time_minutes,description&status=eq.approved&order=title.asc&limit=1000`;
      const data = await apiCall(url, { headers: { "apikey": SUPABASE_ANON_KEY } });
      setRecipes(Array.isArray(data) ? data : []);
      loadedAtRef.current = Date.now();
    } catch (e) {
      console.error("loadRecipes fejl:", e.status || "", e.message);
      setRecipes([]);
    }
    setRecipesLoading(false);
  };

  const loadRecipeIngredients = async (recipeId) => {
    try {
      const data = await apiCall(
        `${SUPABASE_URL}/rest/v1/recipes?id=eq.${recipeId}&select=id,ingredients_raw,instructions`,
        { headers: { "apikey": SUPABASE_ANON_KEY } }
      );
      if (Array.isArray(data) && data[0]) {
        setSelectedRecipe(prev => prev ? { ...prev, ...data[0] } : prev);
      }
    } catch {}
    setRecipeIngredients([]);
  };

  const submitUserRecipe = async (imageUrl = null, allergenFlags = []) => {
    if (!submitRecipe.title.trim() || submitIngredients.filter(i => i.name.trim()).length === 0) {
      return { error: "Udfyld venligst titel og mindst én ingrediens." };
    }
    setSubmittingRecipe(true);
    try {
      // apiCall bevarer nu status+body på fejl (se helpers.js), så den kan
      // bruges her uden at miste den 401/JWT-særbehandling der tidligere
      // krævede rå fetch.
      const headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      };
      const body = JSON.stringify({
        ...submitRecipe,
        instructions: JSON.stringify(submitSteps.filter(s => s.trim())),
        submitted_by: userId,
        source: "user",
        language: "da",
        status: "pending",
        image_url: imageUrl || null,
        allergen_flags: allergenFlags.length > 0
          ? JSON.stringify(Object.fromEntries(allergenFlags.map(id => [id, true])))
          : null,
        disclaimer: "Allergener er vejledende. Tjek altid ingrediensernes emballage ved alvorlige allergier.",
      });
      let data;
      try {
        data = await apiCall(`${SUPABASE_URL}/rest/v1/recipes`, { method:"POST", headers, body });
      } catch (e) {
        setSubmittingRecipe(false);
        if (e.status === 401 || (e.body || "").includes("JWT")) {
          return { error: "Din session er udløbet. Log ud og ind igen for at indsende opskrifter." };
        }
        return { error: `Server fejl ${e.status || ""}: ${(e.body || e.message).slice(0,120)}` };
      }
      const recipe = Array.isArray(data) ? data[0] : data;
      if (!recipe?.id) {
        setSubmittingRecipe(false);
        return { error: "Opskrift gemt, men kunne ikke hente ID til ingredienser." };
      }
      // Gem ingredienser
      try {
        await Promise.all(
          submitIngredients
            .map((ing, i) => ({ ing, i }))
            .filter(({ ing }) => ing.name.trim())
            .map(({ ing, i }) =>
              apiCall(`${SUPABASE_URL}/rest/v1/recipe_ingredients`, {
                method: "POST",
                headers: { ...headers, "Prefer": "return=minimal" },
                body: JSON.stringify({ recipe_id: recipe.id, name: ing.name, amount: ing.amount, unit: ing.unit, sort_order: i }),
              })
            )
        );
      } catch {
        setSubmittingRecipe(false);
        return { error: "Opskriften blev gemt, men nogle ingredienser kunne ikke gemmes. Kontakt support@eatsafe.dk." };
      }
      // Nulstil form (form lukkes af RecipesScreen ved success)
      setSubmitRecipe({ title:"", description:"", category:"aftensmad", tags:[] });
      setSubmitSteps([""]);
      setSubmitIngredients([{ name:"", amount:"", unit:"" }]);
      setSubmittingRecipe(false);
      return { success: true };
    } catch (e) {
      setSubmittingRecipe(false);
      return { error: e.message || "Ukendt fejl" };
    }
  };

  return {
    recipes, setRecipes,
    recipesLoading,
    selectedRecipe, setSelectedRecipe,
    recipeIngredients, setRecipeIngredients,
    recipeFilter, setRecipeFilter,
    favoriteRecipes, setFavoriteRecipes,
    showSubmitRecipe, setShowSubmitRecipe,
    submitRecipe, setSubmitRecipe,
    submitSteps, setSubmitSteps,
    submitIngredients, setSubmitIngredients,
    submittingRecipe,
    recipeTermsOpen, setRecipeTermsOpen,
    completedSteps, setCompletedSteps,
    recipeTermsAccepted, setRecipeTermsAccepted,
    recipeServings, setRecipeServings,
    recipeSearch, setRecipeSearch,
    recipeSafeOnly, setRecipeSafeOnly,
    loadRecipes,
    loadRecipeIngredients,
    submitUserRecipe,
  };
}
