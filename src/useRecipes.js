// @ts-nocheck
import { useState } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { makeHeaders, apiCall } from "./helpers.js";

export function useRecipes(accessToken, userId) {
  const [recipes, setRecipes] = useState([]);
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

  const loadRecipes = async () => {
    if (recipes.length > 0) return; // allerede indlæst
    setRecipesLoading(true);
    try {
      // Indlæs ALLE godkendte opskrifter én gang — filtrer client-side (627 poster er hurtigt)
      // Opskrifter er public — brug kun anon key (JWT kan være udløbet)
      const headers = { "apikey": SUPABASE_ANON_KEY, "Accept": "application/json" };
      const url = `${SUPABASE_URL}/rest/v1/recipes?select=id,title,category,image_url,tags,allergen_flags,servings,prep_time_minutes,cook_time_minutes,description&order=title.asc&limit=1000`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        console.error("loadRecipes fejl:", res.status);
        setRecipes([]);
      } else {
        const data = await res.json();
        setRecipes(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("loadRecipes fejl:", e.message);
      setRecipes([]);
    }
    setRecipesLoading(false);
  };

  const loadRecipeIngredients = async (recipeId) => {
    try {
      const headers = { "apikey": SUPABASE_ANON_KEY, "Accept": "application/json" };
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/recipes?id=eq.${recipeId}&select=id,ingredients_raw,instructions`,
        { headers }
      );
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        setSelectedRecipe(prev => prev ? { ...prev, ...data[0] } : prev);
      }
    } catch {}
    setRecipeIngredients([]);
  };

  const submitUserRecipe = async (imageUrl = null, allergenFlags = []) => {
    if (!submitRecipe.title.trim() || submitIngredients.filter(i => i.name.trim()).length === 0) return;
    setSubmittingRecipe(true);
    try {
      const [recipe] = await apiCall(`${SUPABASE_URL}/rest/v1/recipes`, {
        method: "POST",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=representation" },
        body: JSON.stringify({
          ...submitRecipe,
          instructions: JSON.stringify(submitSteps.filter(s => s.trim())),
          submitted_by: userId,
          source: "user",
          language: "da",
          status: "pending",
          image_url: imageUrl || null,
          allergen_flags: allergenFlags.length > 0 ? JSON.stringify(Object.fromEntries(allergenFlags.map(id=>[id,true]))) : null,
          disclaimer: "Allergener er vejledende. Tjek altid ingrediensernes emballage ved alvorlige allergier.",
        }),
      });
      for (let i = 0; i < submitIngredients.length; i++) {
        const ing = submitIngredients[i];
        if (!ing.name.trim()) continue;
        await apiCall(`${SUPABASE_URL}/rest/v1/recipe_ingredients`, {
          method: "POST",
          headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
          body: JSON.stringify({ recipe_id: recipe.id, name: ing.name, amount: ing.amount, unit: ing.unit, sort_order: i }),
        });
      }
      setShowSubmitRecipe(false);
      setSubmitRecipe({ title:"", description:"", category:"aftensmad", tags:[] });
      setSubmitSteps([""]);
      setSubmitIngredients([{ name:"", amount:"", unit:"" }]);
      alert("Tak! Din opskrift er sendt til godkendelse.");
    } catch (e) { alert("Fejl: " + e.message); }
    setSubmittingRecipe(false);
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
