// @ts-nocheck
import React, { useState } from "react";
import { ALLERGENS, SCREENS } from "./constants.jsx";
import { compareAllergens, getAllergenLabels } from "./helpers.js";
import { Icon, IngredientsList } from "./SharedComponents.jsx";

export default function RecipesScreen({
  screen, setScreen,
  recipes, recipesLoading,
  selectedRecipe, setSelectedRecipe,
  recipeSearch, setRecipeSearch,
  showSafeOnly, setShowSafeOnly,
  allergens, customAllerg,
  family, activeProfiles,
  favorites,
  accessToken,
  showSubmitRecipe, setShowSubmitRecipe,
  submitRecipe, setSubmitRecipe,
  submitSteps, setSubmitSteps,
  submitIngredients, setSubmitIngredients,
  submittingRecipe,
  loadRecipes, loadRecipeIngredients,
  user,
  toggleFavorite,

  loading,
}) {
  return (
    <>
        {screen === SCREENS.RECIPES && !selectedRecipe && !showSubmitRecipe && (() => {
          const categories = [
            { id:"alle", label:"🍽️ Alle" }, { id:"favoritter", label:"❤️ Favoritter" },
            { id:"morgenmad", label:"☕ Morgenmad" }, { id:"frokost", label:"🥗 Frokost" },
            { id:"aftensmad", label:"🍝 Aftensmad" }, { id:"dessert", label:"🍰 Dessert" },
            { id:"tilbehør", label:"🥦 Tilbehør" },
          ];
          const getCatEmoji = c => ({ morgenmad:"☕",frokost:"🥗",aftensmad:"🍝",dessert:"🍰",tilbehør:"🥦",snack:"🍿" })[c] || "🍽️";
          const profiles = [
            { id:"me", name: user.name||"Dig", allergens },
            ...family.filter(m => activeProfiles.includes(m.id)),
          ];
          const filtered = (recipeFilter === "favoritter" ? recipes.filter(r => favoriteRecipes.includes(r.id)) : recipes).filter(r => {
            if (recipeSearch && !r.title.toLowerCase().includes(recipeSearch.toLowerCase())) return false;
            if (recipeSafeOnly && compareAllergens(r.allergen_flags || {}, activeIds).status === "danger") return false;
            return true;
          });
          return (
            <div className="screen fade-in">
              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 0 14px" }}>
                <div style={{ fontSize:22, fontWeight:900, color:"var(--ink)", letterSpacing:"-.4px" }}>Opskrifter</div>
                <button onClick={() => setShowSubmitRecipe(true)}
                  style={{ background:"var(--green)", color:"#fff", border:"none", borderRadius:10, padding:"8px 14px", fontFamily:"var(--f)", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                  + Indsend
                </button>
              </div>

              {/* Søgefelt */}
              <div className="recipe-search-wrap">
                <div className="recipe-search-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                </div>
                <input className="recipe-search-input" placeholder="Søg opskrifter…" value={recipeSearch} onChange={e => setRecipeSearch(e.target.value)} />
              </div>

              {/* Kategori chips — 2-kolonne grid så alle ses */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:14 }}>
                {categories.map(c => (
                  <div key={c.id} className={`recipe-filter-chip${recipeFilter === c.id ? " active" : ""}`}
                    style={{ textAlign:"center" }}
                    onClick={() => {
                      if (c.id === recipeFilter) return;
                      setRecipeFilter(c.id);
                      setRecipeSearch("");
                      if (c.id !== "favoritter") {
                        setRecipes([]); // ryd gamle resultater
                        loadRecipes(c.id);
                      }
                    }}>
                    {c.label}
                  </div>
                ))}
              </div>

              {/* Kun-sikre + tæller */}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <div onClick={() => setRecipeSafeOnly(v => !v)} style={{
                  display:"flex", alignItems:"center", gap:6, padding:"5px 12px",
                  borderRadius:100, border:`1.5px solid ${recipeSafeOnly ? "var(--green)" : "var(--border2)"}`,
                  background: recipeSafeOnly ? "var(--green-lt)" : "#fff", cursor:"pointer",
                  fontSize:12, fontWeight:700, color: recipeSafeOnly ? "var(--green)" : "var(--muted2)" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                  Kun sikre
                </div>
                {recipes.length > 0 && <div style={{ fontSize:12, color:"var(--muted)", marginLeft:"auto" }}>{filtered.length} opskrift{filtered.length !== 1 ? "er" : ""}</div>}
              </div>

              {/* Skeleton loader */}
              {recipesLoading && [1,2,3].map(i => (
                <div key={i} className="recipe-skeleton">
                  <div className="skeleton-img" />
                  <div style={{ padding:"12px 14px" }}>
                    <div className="skeleton-line" style={{ width:"70%" }} />
                    <div className="skeleton-line" style={{ width:"45%" }} />
                  </div>
                </div>
              ))}

              {/* Startside — ingen filter, ingen opskrifter endnu */}
              {!recipesLoading && recipes.length === 0 && recipeFilter === "alle" && (
                <div>
                  <div style={{ background:"var(--ink)", borderRadius:16, padding:"22px 20px", marginBottom:16, display:"flex", alignItems:"center", gap:16 }}>
                    <div style={{ fontSize:44, flexShrink:0 }}>🍳</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:18, fontWeight:900, color:"#fff", letterSpacing:"-.3px", marginBottom:4 }}>Over 600 opskrifter</div>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,.55)", marginBottom:12 }}>Filtreret til dig og din familie</div>
                      <button onClick={() => loadRecipes("alle")}
                        style={{ background:"var(--green)", color:"#fff", border:"none", borderRadius:10, padding:"9px 18px", fontFamily:"var(--f)", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                        Vis opskrifter →
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:10 }}>Hop direkte til</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
                    {[
                      { id:"aftensmad", label:"Aftensmad", emoji:"🍝", desc:"Hverdagens klassikere" },
                      { id:"morgenmad", label:"Morgenmad", emoji:"☕", desc:"Start dagen godt" },
                      { id:"dessert",   label:"Dessert",   emoji:"🍰", desc:"Søde sager" },
                      { id:"frokost",   label:"Frokost",   emoji:"🥗", desc:"Let og lækker" },
                    ].map(cat => (
                      <div key={cat.id} onClick={() => { setRecipeFilter(cat.id); setRecipes([]); loadRecipes(cat.id); }}
                        style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:12, padding:"14px", cursor:"pointer", boxShadow:"var(--sh)" }}>
                        <div style={{ fontSize:28, marginBottom:6 }}>{cat.emoji}</div>
                        <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:2 }}>{cat.label}</div>
                        <div style={{ fontSize:11, color:"var(--muted)" }}>{cat.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tom favorit-liste */}
              {!recipesLoading && recipeFilter === "favoritter" && recipes.filter(r => favoriteRecipes.includes(r.id)).length === 0 && (
                <div style={{ textAlign:"center", padding:"48px 0" }}>
                  <div style={{ fontSize:52, marginBottom:12 }}>🤍</div>
                  <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)", marginBottom:6 }}>Ingen favoritter endnu</div>
                  <div style={{ fontSize:13, color:"var(--muted)" }}>Tryk ❤️ på en opskrift for at gemme den</div>
                </div>
              )}

              {/* Label over kortene */}
              {!recipesLoading && filtered.length > 0 && (
                <div style={{ fontSize:12, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:10 }}>
                  {recipeFilter === "alle" ? "⭐ Mest populære" :
                   recipeFilter === "favoritter" ? "❤️ Dine favoritter" :
                   `🍽️ ${recipeFilter.charAt(0).toUpperCase() + recipeFilter.slice(1)}`}
                  {" "}· {filtered.length} opskrift{filtered.length !== 1 ? "er" : ""}
                </div>
              )}

              {/* Ingen søgeresultater */}
              {!recipesLoading && recipes.length > 0 && filtered.length === 0 && recipeFilter !== "favoritter" && recipeSearch && (
                <div style={{ textAlign:"center", padding:"32px 0" }}>
                  <div style={{ fontSize:13, color:"var(--muted)", marginBottom:10 }}>Ingen opskrifter matcher "{recipeSearch}"</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setRecipeSearch("")}>Ryd søgning</button>
                </div>
              )}

              {/* Opskrift-kort */}
              <div className="recipe-grid">
                {filtered.map(r => {
                  // allergen_flags kan være string eller objekt
                  let rFlags = {};
                  try { rFlags = typeof r.allergen_flags === "string" ? JSON.parse(r.allergen_flags) : (r.allergen_flags || {}); } catch {}
                  const { status } = compareAllergens(rFlags, activeIds);
                  const isFav = favoriteRecipes.includes(r.id);
                  const totalMins = (r.prep_time_minutes||0) + (r.cook_time_minutes||0);
                  return (
                    <div key={r.id} className="recipe-card"
                      onClick={() => { setSelectedRecipe(r); loadRecipeIngredients(r.id); setCompletedSteps({}); setRecipeServings(r.servings || 4); }}>
                      <button className="recipe-fav-btn"
                        onClick={e => { e.stopPropagation(); setFavoriteRecipes(f => isFav ? f.filter(x=>x!==r.id) : [...f,r.id]); }}>
                        {isFav ? "❤️" : "🤍"}
                      </button>
                      {r.image_url
                        ? <img src={r.image_url} alt={r.title} className="recipe-card-img" loading="lazy" />
                        : <div className="recipe-card-img-placeholder">{getCatEmoji(r.category)}</div>
                      }
                      <div className="recipe-card-body">
                        <div className="recipe-card-title">{r.title}</div>
                        {r.description && (
                          <div className="recipe-card-desc" style={{ display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                            {r.description}
                          </div>
                        )}
                        <div className="recipe-card-meta">
                          {r.category && <span className="recipe-pill" style={{ background:"var(--paper2)", color:"var(--muted2)", borderColor:"var(--border)" }}>{getCatEmoji(r.category)} {r.category}</span>}
                          {totalMins > 0 && <span className="recipe-pill" style={{ background:"var(--paper2)", color:"var(--muted2)", borderColor:"var(--border)" }}>⏱ {totalMins} min</span>}
                          {r.servings && <span className="recipe-pill" style={{ background:"var(--paper2)", color:"var(--muted2)", borderColor:"var(--border)" }}>👤 {r.servings} pers.</span>}
                          {(r.tags||[]).filter(t=>t==="vegetarisk"||t==="vegan").map(t => (
                            <span key={t} className="recipe-pill" style={{ background:"var(--green-lt)", color:"var(--green)", borderColor:"var(--green-mid)" }}>
                              {t==="vegan"?"🌱":"🥦"} {t}
                            </span>
                          ))}
                        </div>
                        {/* Sikkerhed per profil */}
                        <div className="recipe-safe-bar">
                          {profiles.map(p => {
                            const { status: ps } = compareAllergens(rFlags, p.allergens||[]);
                            const color = ps==="safe"?"var(--green)":ps==="danger"?"var(--red)":"var(--amber)";
                            const bg = ps==="safe"?"var(--green-lt)":ps==="danger"?"var(--red-lt)":"var(--amber-lt)";
                            return (
                              <div key={p.id} style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 8px", borderRadius:100, border:`1px solid ${color}`, background:bg, fontSize:10, fontWeight:700, color }}>
                                <span>{ps==="safe"?"✓":ps==="danger"?"✗":"!"}</span>
                                <span>{p.id==="me"?"Dig":p.name.split(" ")[0]}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filtered.length > 0 && (
                <div style={{ display:"flex", gap:8, alignItems:"center", padding:"12px", background:"var(--paper2)", borderRadius:10, marginTop:4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2"><path strokeLinecap="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  <div style={{ fontSize:10, color:"var(--muted)", lineHeight:1.5 }}>Allergener er vejledende. Tjek altid ingrediensernes emballage.</div>
                </div>
              )}
            </div>
          );
        })()}
    </>
  );
}
