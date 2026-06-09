// @ts-nocheck
import React, { useState } from "react";
import { ALLERGENS, SCREENS } from "./constants.jsx";
import { compareAllergens, getAllergenLabels } from "./helpers.js";
import { Icon, IngredientsList, ProfileBadges } from "./SharedComponents.jsx";

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
  recipeFilter, setRecipeFilter,
  recipeSafeOnly, setRecipeSafeOnly,
  favoriteRecipes, setFavoriteRecipes,
  activeIds,
  completedSteps, setCompletedSteps,
  recipeServings, setRecipeServings,
  setRecipes,
  addToList,
}) {
  const [listAdded, setListAdded] = React.useState({});

  // Auto-load alle opskrifter ved mount
  React.useEffect(() => {
    if (screen === SCREENS.RECIPES) loadRecipes();
  }, [screen]);

  return (
    <>
        {/* ── OPSKRIFT DETALJESIDE ── */}
        {screen === SCREENS.RECIPES && selectedRecipe && !showSubmitRecipe && (() => {
          const r = selectedRecipe;
          const isFav = favoriteRecipes.includes(r.id);
          const totalMins = (r.prep_time_minutes||0) + (r.cook_time_minutes||0);
          let rFlags = {};
          try { rFlags = typeof r.allergen_flags === "string" ? JSON.parse(r.allergen_flags) : (r.allergen_flags || {}); } catch {}
          const { status } = compareAllergens(rFlags, activeIds);

          // Parse instruktioner
          let steps = [];
          try {
            const raw = r.instructions;
            if (typeof raw === "string") {
              const parsed = JSON.parse(raw);
              steps = Array.isArray(parsed) ? parsed : [raw];
            } else if (Array.isArray(raw)) {
              steps = raw;
            }
          } catch { if (r.instructions) steps = [r.instructions]; }

          // Skaler portioner
          const baseServings = r.servings || 4;
          const scale = recipeServings / baseServings;

          return (
            <div className="screen fade-in" style={{ paddingLeft:0, paddingRight:0, paddingBottom:110 }}>
              {/* Hero billede */}
              <div className="recipe-detail-hero">
                {r.image_url
                  ? <img src={r.image_url} alt={r.title} className="recipe-detail-img" />
                  : <div className="recipe-detail-img-placeholder">🍽️</div>
                }
                <button className="recipe-detail-back" onClick={() => setSelectedRecipe(null)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <button className="recipe-detail-fav" onClick={() => setFavoriteRecipes(f => isFav ? f.filter(x=>x!==r.id) : [...f,r.id])}>
                  {isFav ? "❤️" : "🤍"}
                </button>
              </div>

              <div style={{ padding:"18px 16px 0" }}>
                {/* ── FAMILIE SIKKERHEDSGRID (samme som produktresultat) ── */}
                {(() => {
                  const profiles = [
                    { id:"me", name: user?.name||"Dig", allergens: allergens||[] },
                    ...(family||[]).filter(m => (activeProfiles||[]).includes(m.id)),
                  ];
                  return (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:12 }}>
                      {profiles.map(p => {
                        const danger = (p.allergens||[]).filter(a => rFlags[a] === "yes" || rFlags[a] === true);
                        const warning = (p.allergens||[]).filter(a => rFlags[a] === "traces");
                        const finalColor = danger.length > 0 ? "var(--red)" : warning.length > 0 ? "var(--amber)" : "var(--green)";
                        const finalBg = danger.length > 0 ? "var(--red-lt)" : warning.length > 0 ? "var(--amber-lt)" : "var(--green-lt)";
                        const finalBorder = danger.length > 0 ? "var(--red-md)" : warning.length > 0 ? "var(--amber-md)" : "var(--green-mid)";
                        const finalIcon = danger.length > 0 ? "×" : warning.length > 0 ? "!" : "✓";
                        const statusText = danger.length > 0
                          ? danger.map(id => ALLERGENS.find(a=>a.id===id)?.label).filter(Boolean).join(", ")
                          : warning.length > 0
                          ? "Spor: " + warning.map(id => ALLERGENS.find(a=>a.id===id)?.label).filter(Boolean).join(", ")
                          : "Sikkert";
                        return (
                          <div key={p.id} style={{
                            display:"flex", alignItems:"center", justifyContent:"space-between",
                            padding:"6px 10px",
                            background: finalBg,
                            border:`1px solid ${finalBorder}`,
                            borderRadius:8, gap:6,
                          }}>
                            <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>
                              {p.id==="me" ? "Dig" : p.name}
                            </div>
                            <div style={{ fontSize:11, fontWeight:700, color:finalColor, flexShrink:0 }}>{finalIcon} {statusText}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Titel */}
                <div className="recipe-detail-title">{r.title}</div>

                {/* Meta-info */}
                <div className="recipe-meta-row">
                  {r.category && <span className="recipe-meta-pill">🍽️ {r.category}</span>}
                  {r.prep_time_minutes > 0 && <span className="recipe-meta-pill">🔪 {r.prep_time_minutes} min forberedelse</span>}
                  {r.cook_time_minutes > 0 && <span className="recipe-meta-pill">🔥 {r.cook_time_minutes} min tilberedning</span>}
                  {totalMins > 0 && <span className="recipe-meta-pill">⏱ {totalMins} min i alt</span>}
                  {r.difficulty && <span className="recipe-meta-pill">📊 {r.difficulty}</span>}
                  {(r.tags||[]).filter(t=>t==="vegetarisk"||t==="vegan").map(t => (
                    <span key={t} className="recipe-meta-pill" style={{ background:"var(--green-lt)", color:"var(--green)", borderColor:"var(--green-mid)" }}>{t==="vegan"?"🌱":"🥦"} {t}</span>
                  ))}
                </div>

                {/* Beskrivelse */}
                {r.description && (
                  <div style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.6, marginBottom:16, padding:"12px 14px", background:"var(--paper2)", borderRadius:10 }}>
                    {r.description}
                  </div>
                )}

                {/* ── PORTIONER KONTROL ── */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)" }}>Portioner</div>
                  <div className="servings-ctrl">
                    <button className="servings-btn" onClick={() => setRecipeServings(s => Math.max(1, s-1))}>−</button>
                    <div className="servings-num">{recipeServings}</div>
                    <button className="servings-btn" onClick={() => setRecipeServings(s => s+1)}>+</button>
                  </div>
                </div>

                {/* ── INGREDIENSER ── */}
                {r.ingredients_raw && (
                  <div style={{ marginBottom:20 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                      <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)" }}>Ingredienser</div>
                      {(() => {
                        let items = null;
                        try {
                          const raw = r.ingredients_raw;
                          const p = Array.isArray(raw) ? raw : JSON.parse(raw);
                          if (Array.isArray(p) && p[0]?.name) items = p;
                        } catch {}
                        if (!items || !addToList) return null;
                        const allAdded = items.every((_,i) => listAdded[i]);
                        return (
                          <button
                            onClick={() => {
                              const baseServings = r.servings || 4;
                              const scale = recipeServings / baseServings;
                              items.forEach((ing, i) => {
                                if (!listAdded[i]) {
                                  const amt = ing.amount ? Math.round(ing.amount * scale * 10) / 10 : null;
                                  const unit = ing.unit || (ing.measure ? ing.measure.replace(/^[\d.,\/\s]+/, "").trim() : "");
                                  const label = [amt, unit, ing.name].filter(Boolean).join(" ");
                                  addToList(label);
                                }
                              });
                              const map = {};
                              items.forEach((_,i) => map[i] = true);
                              setListAdded(map);
                            }}
                            style={{
                              display:"flex", alignItems:"center", gap:5,
                              padding:"5px 12px", borderRadius:100,
                              border:`1.5px solid ${allAdded ? "var(--green)" : "var(--border2)"}`,
                              background: allAdded ? "var(--green-lt)" : "var(--paper2)",
                              color: allAdded ? "var(--green)" : "var(--muted2)",
                              fontSize:11, fontWeight:700, cursor:"pointer",
                              fontFamily:"var(--f)", transition:"all .15s",
                            }}>
                            {allAdded ? "✓ Alle tilføjet" : "+ Tilføj alle"}
                          </button>
                        );
                      })()}
                    </div>
                    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, overflow:"hidden" }}>
                      {(() => {
                        let items = null;
                        try {
                          const raw = r.ingredients_raw;
                          const parsed = Array.isArray(raw) ? raw : JSON.parse(raw);
                          if (Array.isArray(parsed) && parsed[0]?.name) items = parsed;
                        } catch {}

                        if (items) {
                          const baseServings = r.servings || 4;
                          const scale = recipeServings / baseServings;
                          return items
                            .sort((a,b) => (a.sort_order||0) - (b.sort_order||0))
                            .map((ing, i) => {
                              const isAllergen = Object.entries(rFlags).some(([k,v]) =>
                                (v === "yes" || v === true) &&
                                (ing.name?.toLowerCase().includes(k) || (ing.name_en||"").toLowerCase().includes(k))
                              );
                              const isTrace = !isAllergen && Object.entries(rFlags).some(([k,v]) =>
                                v === "traces" &&
                                (ing.name?.toLowerCase().includes(k) || (ing.name_en||"").toLowerCase().includes(k))
                              );
                              const dotColor = isAllergen ? "var(--red)" : isTrace ? "var(--amber)" : "var(--border2)";
                              const nameColor = isAllergen ? "var(--red)" : isTrace ? "var(--amber)" : "var(--ink)";
                              const added = !!listAdded[i];

                              let amtDisplay = "";
                              if (ing.amount) {
                                const scaled = Math.round(ing.amount * scale * 10) / 10;
                                amtDisplay = String(scaled);
                              }
                              const unit = ing.unit || (ing.measure ? ing.measure.replace(/^[\d.,\/\s]+/, "").trim() : "");

                              return (
                                <div key={i} className="ingredient-row" style={{ padding:"9px 14px", opacity: added ? 0.5 : 1, transition:"opacity .2s" }}>
                                  <div className="ingredient-dot" style={{ background: dotColor }} />
                                  <div style={{ flex:1, fontSize:13, color: nameColor, fontWeight: isAllergen ? 700 : 500 }}>
                                    {ing.name}
                                    {isAllergen && <span style={{ fontSize:10, fontWeight:700, color:"var(--red)", marginLeft:6, textTransform:"uppercase", letterSpacing:".5px" }}>allergen</span>}
                                    {isTrace && <span style={{ fontSize:10, fontWeight:700, color:"var(--amber)", marginLeft:6, textTransform:"uppercase", letterSpacing:".5px" }}>spor</span>}
                                  </div>
                                  <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                                    {(amtDisplay || unit) && (
                                      <div style={{ fontSize:12, fontWeight:700, color:"var(--muted2)", textAlign:"right" }}>
                                        {amtDisplay}{amtDisplay && unit ? " " : ""}{unit}
                                      </div>
                                    )}
                                    {addToList && (
                                      <button
                                        onClick={() => {
                                          if (added) return;
                                          const label = [amtDisplay, unit, ing.name].filter(Boolean).join(" ");
                                          addToList(label);
                                          setListAdded(s => ({ ...s, [i]: true }));
                                        }}
                                        title={added ? "Tilføjet" : "Tilføj til indkøbsliste"}
                                        style={{
                                          width:26, height:26, borderRadius:"50%",
                                          border:`1.5px solid ${added ? "var(--green)" : "var(--border2)"}`,
                                          background: added ? "var(--green-lt)" : "var(--surface2)",
                                          color: added ? "var(--green)" : "var(--muted2)",
                                          cursor: added ? "default" : "pointer",
                                          display:"flex", alignItems:"center", justifyContent:"center",
                                          fontSize:13, fontFamily:"var(--f)", fontWeight:700,
                                          transition:"all .15s", flexShrink:0,
                                        }}>
                                        {added ? "✓" : "+"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                        } else {
                          const txt = typeof r.ingredients_raw === 'string'
                            ? r.ingredients_raw
                            : JSON.stringify(r.ingredients_raw);
                          return <IngredientsList text={txt} allergenFlags={rFlags} />;
                        }
                      })()}
                    </div>
                  </div>
                )}

                {/* ── TRIN-FOR-TRIN ── */}
                {steps.length > 0 && (
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:10 }}>Fremgangsmåde</div>
                    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, overflow:"hidden" }}>
                      {steps.map((step, i) => {
                        const done = !!completedSteps[i];
                        return (
                          <div key={i} className="step-row" style={{ opacity: done ? 0.45 : 1 }}
                            onClick={() => setCompletedSteps(s => ({ ...s, [i]: !s[i] }))}>
                            <div className="step-circle" style={{ background: done ? "var(--green)" : "var(--surface2)", border: done ? "none" : "1.5px solid var(--border2)" }}>
                              {done
                                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                                : <span style={{ fontSize:12, fontWeight:800, color:"var(--muted2)" }}>{i+1}</span>
                              }
                            </div>
                            <div style={{ flex:1, fontSize:13, color:"var(--ink)", lineHeight:1.6, paddingRight:8, textDecoration: done ? "line-through" : "none" }}>
                              {typeof step === "object" ? step.text || step.description || JSON.stringify(step) : step}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {Object.keys(completedSteps).filter(k => completedSteps[k]).length === steps.length && steps.length > 0 && (
                      <div style={{ textAlign:"center", padding:"20px 0", fontSize:18, fontWeight:800, color:"var(--green)" }}>
                        🎉 Alle trin gennemført!
                      </div>
                    )}
                  </div>
                )}

                {/* Allergen advarsel */}
                <div style={{ display:"flex", gap:8, alignItems:"center", padding:"12px 14px", background:"var(--surface2)", borderRadius:10, marginBottom:16 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2"><path strokeLinecap="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  <div style={{ fontSize:10, color:"var(--muted)", lineHeight:1.5 }}>Allergener er vejledende. Tjek altid ingrediensernes emballage.</div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── OPSKRIFT LISTE ── */}
        {screen === SCREENS.RECIPES && !selectedRecipe && !showSubmitRecipe && (() => {
          const categories = [
            { id:"alle", label:`🍽️ Alle${recipes.length > 0 ? ` (${recipes.length})` : ""}` },
            { id:"favoritter", label:"❤️ Favoritter" },
            { id:"morgenmad", label:"☕ Morgenmad" },
            { id:"frokost", label:"🥗 Frokost" },
            { id:"aftensmad", label:"🍝 Aftensmad" },
            { id:"dessert", label:"🍰 Dessert" },
            { id:"tilbehør", label:"🥦 Tilbehør" },
            { id:"snack", label:"🍿 Snack" },
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
                  style={{ background:"var(--green)", color:"#071510", border:"none", borderRadius:10, padding:"8px 14px", fontFamily:"var(--f)", fontSize:13, fontWeight:700, cursor:"pointer" }}>
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

              {/* Kategori chips — horizontal scroll */}
              <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4, marginBottom:12, scrollbarWidth:"none" }}>
                {categories.map(c => (
                  <div key={c.id}
                    onClick={() => { setRecipeFilter(c.id === recipeFilter ? "alle" : c.id); setRecipeSearch(""); }}
                    style={{
                      flexShrink:0, padding:"7px 14px", borderRadius:100, cursor:"pointer", fontSize:13, fontWeight:700,
                      fontFamily:"var(--f)", whiteSpace:"nowrap", transition:"all .15s",
                      background: recipeFilter === c.id ? "var(--green-lt)" : "var(--surface)",
                      color: recipeFilter === c.id ? "var(--green)" : "var(--muted2)",
                      border: `1px solid ${recipeFilter === c.id ? "rgba(74,222,128,.25)" : "var(--border)"}`,
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
                  background: recipeSafeOnly ? "var(--green-lt)" : "var(--surface)", cursor:"pointer",
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

              {/* Ingen opskrifter loaded + ikke loading — retry */}
              {!recipesLoading && recipes.length === 0 && (
                <div>
                  <div style={{ background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:16, padding:"22px 20px", marginBottom:16, display:"flex", alignItems:"center", gap:16 }}>
                    <div style={{ fontSize:44, flexShrink:0 }}>🍳</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:18, fontWeight:700, color:"var(--ink)", letterSpacing:"-.3px", marginBottom:4 }}>Kunne ikke indlæse</div>
                      <div style={{ fontSize:12, color:"var(--muted)", marginBottom:12 }}>Tjek din forbindelse og prøv igen</div>
                      <button onClick={() => loadRecipes()}
                        style={{ background:"var(--green)", color:"#071510", border:"none", borderRadius:10, padding:"9px 18px", fontFamily:"var(--f)", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                        Prøv igen →
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
                        style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"14px", cursor:"pointer", boxShadow:"var(--sh)" }}>
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
                  <div style={{ fontSize:13, color:"var(--muted)", marginBottom:14 }}>Tryk ❤️ på opskrifter for at gemme dem her</div>
                  <button className="btn btn-outline btn-sm" onClick={() => setRecipeFilter("alle")}>Se alle opskrifter</button>
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
                  <div style={{ textAlign:"center", padding:"40px 16px" }}><div style={{ fontSize:48, marginBottom:12 }}>🔍</div><div style={{ fontSize:17, fontWeight:800, color:"var(--ink)", marginBottom:8 }}>Ingen resultater</div><div style={{ fontSize:13, color:"var(--muted)", marginBottom:14 }}>Ingen opskrifter matcher "{recipeSearch}"</div><button className="btn btn-outline btn-sm" onClick={() => setRecipeSearch("")}>Ryd søgning</button></div>
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
                      onClick={() => { setSelectedRecipe(r); loadRecipeIngredients(r.id); setCompletedSteps({}); setRecipeServings(r.servings || 4); setListAdded({}); }}>
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
