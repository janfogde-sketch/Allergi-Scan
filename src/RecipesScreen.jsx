// @ts-nocheck
import React, { useState } from "react";
import { ALLERGENS, SCREENS, DIETS, SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
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
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [localSafeProfiles, setLocalSafeProfiles] = React.useState(null);

  // Submit-form states — skal være her pga. React hooks-regler
  const [imgFile, setImgFile] = React.useState(null);
  const [imgPreview, setImgPreview] = React.useState(null);
  const [imgUploading, setImgUploading] = React.useState(false);
  const [manualAllergens, setManualAllergens] = React.useState([]);
  const [removedAuto, setRemovedAuto] = React.useState([]);

  // Hjælpefunktioner til allergen-detektion
  const detectAllergens = (name) => {
    const n = name.toLowerCase();
    const found = [];
    ALLERGENS.forEach(a => {
      if ((a.keywords||[]).some(k => n.includes(k.toLowerCase()))) found.push(a.id);
    });
    return found;
  };
  const recomputeAllergens = (ings) => {
    const all = new Set();
    ings.forEach(i => { if(i.name) detectAllergens(i.name).forEach(id => all.add(id)); });
    return [...all];
  };

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
          // Beregn aktive allergen-IDs baseret på valgte profiler
          const safeProfiles = localSafeProfiles ?? [
            "me",
            ...(family||[]).filter(m => (activeProfiles||[]).includes(m.id)).map(m => m.id),
          ];
          const safeAllergenIds = [
            ...(safeProfiles.includes("me") ? [...allergens, ...(customAllerg||[])] : []),
            ...(family||[]).filter(m => safeProfiles.includes(m.id)).flatMap(m => [...(m.allergens||[]), ...(m.customAllerg||[])]),
          ];

          const filtered = (recipeFilter === "favoritter" ? recipes.filter(r => favoriteRecipes.includes(r.id)) : recipes).filter(r => {
            if (recipeSearch && !r.title.toLowerCase().includes(recipeSearch.toLowerCase())) return false;
            if (recipeSafeOnly) {
              let rFlags = {};
              try { rFlags = typeof r.allergen_flags === "string" ? JSON.parse(r.allergen_flags) : (r.allergen_flags||{}); } catch {}
              if (compareAllergens(rFlags, safeAllergenIds).status === "danger") return false;
            }
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

              {/* Kategori dropdown + Kun sikre */}
              <div style={{ display:"flex", gap:8, marginBottom:8, alignItems:"center" }}>
                {/* Custom dropdown */}
                <div style={{ position:"relative", flex:1 }}>
                  <button
                    onClick={() => setDropdownOpen(v => !v)}
                    style={{
                      width:"100%", padding:"10px 36px 10px 14px", borderRadius:12, textAlign:"left",
                      border:"1px solid var(--border2)", background:"var(--surface)",
                      color:"var(--ink)", fontFamily:"var(--f)", fontSize:14, fontWeight:600,
                      cursor:"pointer", display:"flex", alignItems:"center", gap:8,
                    }}>
                    <span>{categories.find(c => c.id === recipeFilter)?.label || "🍽️ Alle"}</span>
                    <span style={{ marginLeft:"auto", color:"var(--muted)", fontSize:12 }}>▾</span>
                  </button>
                  {dropdownOpen && (
                    <div style={{
                      position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:50,
                      background:"var(--paper2)", border:"1px solid var(--border2)", borderRadius:12,
                      overflow:"hidden", boxShadow:"0 8px 24px rgba(0,0,0,.3)",
                    }}>
                      {categories.map(c => (
                        <div key={c.id}
                          onClick={() => { setRecipeFilter(c.id); setRecipeSearch(""); setDropdownOpen(false); }}
                          style={{
                            padding:"11px 14px", cursor:"pointer", fontSize:13, fontWeight:600,
                            color: recipeFilter === c.id ? "var(--green)" : "var(--ink)",
                            background: recipeFilter === c.id ? "var(--green-lt)" : "transparent",
                            display:"flex", alignItems:"center", gap:8,
                            borderBottom:"1px solid var(--border)",
                          }}>
                          {c.label}
                          {recipeFilter === c.id && <span style={{ marginLeft:"auto", fontSize:11 }}>✓</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Kun-sikre toggle */}
                <div onClick={() => setRecipeSafeOnly(v => !v)} style={{
                  flexShrink:0, display:"flex", alignItems:"center", gap:5, padding:"10px 12px",
                  borderRadius:12, border:`1px solid ${recipeSafeOnly ? "var(--green)" : "var(--border2)"}`,
                  background: recipeSafeOnly ? "var(--green-lt)" : "var(--surface)", cursor:"pointer",
                  fontSize:12, fontWeight:700, color: recipeSafeOnly ? "var(--green)" : "var(--muted2)",
                  whiteSpace:"nowrap",
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                  Kun sikre
                </div>
              </div>

              {/* Profil-chips når kun-sikre er aktiv */}
              {recipeSafeOnly && (() => {
                const allProfiles = [
                  { id:"me", name: user?.name || "Dig", initials:(user?.name||"D")[0].toUpperCase(), allergens: allergens },
                  ...(family||[]).map(m => ({ id:m.id, name:m.name, initials:(m.name||"?")[0].toUpperCase(), allergens: m.allergens||[] })),
                ];
                return (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                    {allProfiles.map(p => {
                      const isActive = localSafeProfiles === null ? (activeProfiles||[]).includes(p.id) || p.id === "me" : localSafeProfiles.includes(p.id);
                      return (
                        <div key={p.id}
                          onClick={() => {
                            const current = localSafeProfiles === null
                              ? allProfiles.map(x => x.id)
                              : localSafeProfiles;
                            setLocalSafeProfiles(
                              current.includes(p.id) && current.length > 1
                                ? current.filter(id => id !== p.id)
                                : [...new Set([...current, p.id])]
                            );
                          }}
                          style={{
                            display:"flex", alignItems:"center", gap:6, padding:"5px 10px",
                            borderRadius:100, cursor:"pointer", fontSize:12, fontWeight:700,
                            background: isActive ? "var(--green-lt)" : "var(--surface2)",
                            color: isActive ? "var(--green)" : "var(--muted)",
                            border:`1px solid ${isActive ? "rgba(74,222,128,.3)" : "var(--border)"}`,
                          }}>
                          <div style={{
                            width:20, height:20, borderRadius:"50%", background: isActive ? "var(--green)" : "var(--surface3)",
                            color: isActive ? "#071510" : "var(--muted)", display:"flex", alignItems:"center",
                            justifyContent:"center", fontSize:10, fontWeight:800, flexShrink:0,
                          }}>{p.initials}</div>
                          {p.name}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Resultat-tæller */}
              {recipes.length > 0 && !recipesLoading && (
                <div style={{ fontSize:12, color:"var(--muted)", marginBottom:10 }}>
                  {filtered.length} opskrift{filtered.length !== 1 ? "er" : ""}
                  {recipeFilter !== "alle" && ` · ${categories.find(c=>c.id===recipeFilter)?.label?.split(" ").slice(1).join(" ") || recipeFilter}`}
                  {recipeSafeOnly && " · kun sikre"}
                </div>
              )}



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

        {/* ── INDSEND OPSKRIFT ── */}
        {screen === SCREENS.RECIPES && showSubmitRecipe && (() => {

          const UNITS = ["g","kg","ml","l","dl","spsk","tsk","stk","fed","nip","bundt","dåse","pose","pakke"];
          const CATS  = ["aftensmad","morgenmad","frokost","dessert","tilbehør","snack"];

          // Auto-detect allergener fra ingrediensnavn
          const detectAllergens = (name) => {
            const n = name.toLowerCase();
            const found = [];
            ALLERGENS.forEach(a => {
              if ((a.keywords||[]).some(k => n.includes(k.toLowerCase()))) found.push(a.id);
            });
            return found;
          };

          // Genberegn allergener fra alle ingredienser
          const recomputeAllergens = (ings) => {
            const all = new Set();
            ings.forEach(i => { if(i.name) detectAllergens(i.name).forEach(id => all.add(id)); });
            return [...all];
          };


          const handleImg = (e) => {
            const f = e.target.files[0];
            if (!f) return;
            setImgFile(f);
            setImgPreview(URL.createObjectURL(f));
          };

          const autoAllergens = recomputeAllergens(submitIngredients);
          const finalAllergens = [
            ...autoAllergens.filter(id => !removedAuto.includes(id)),
            ...manualAllergens.filter(id => !autoAllergens.includes(id)),
          ];

          const handleSubmit = async () => {
            if (submittingRecipe) return;
            let imageUrl = null;
            if (imgFile) {
              setImgUploading(true);
              try {
                const ext = imgFile.name.split(".").pop();
                const path = `recipes/${Date.now()}.${ext}`;
                const res = await fetch(
                  `${SUPABASE_URL}/storage/v1/object/product-images/${path}`,
                  { method:"POST", headers:{ "apikey":SUPABASE_ANON_KEY, "Authorization":`Bearer ${accessToken}`, "Content-Type":imgFile.type }, body:imgFile }
                );
                if (res.ok) imageUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
              } catch {}
              setImgUploading(false);
            }
            await submitUserRecipe(imageUrl, finalAllergens);
          };

          return (
            <div className="screen fade-in">
              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 0 16px" }}>
                <button onClick={() => setShowSubmitRecipe(false)}
                  style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"8px 10px", cursor:"pointer", lineHeight:0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                </button>
                <div>
                  <div style={{ fontSize:18, fontWeight:800, color:"var(--ink)" }}>Indsend opskrift</div>
                  <div style={{ fontSize:11, color:"var(--muted)" }}>Sendes til gennemgang før publicering</div>
                </div>
              </div>

              {/* ── 1. Billede ── */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--ink3)", textTransform:"uppercase", letterSpacing:"1.2px", marginBottom:8 }}>Billede</div>
                <label style={{ display:"block", cursor:"pointer" }}>
                  <input type="file" accept="image/*" onChange={handleImg} style={{ display:"none" }} />
                  <div style={{
                    width:"100%", height:160, borderRadius:14, border:`2px dashed var(--border2)`,
                    background:"var(--surface)", display:"flex", alignItems:"center", justifyContent:"center",
                    overflow:"hidden", position:"relative",
                  }}>
                    {imgPreview
                      ? <img src={imgPreview} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : <div style={{ textAlign:"center" }}>
                          <div style={{ fontSize:32, marginBottom:6 }}>📷</div>
                          <div style={{ fontSize:13, color:"var(--muted)" }}>Tryk for at vælge billede</div>
                          <div style={{ fontSize:11, color:"var(--muted2)" }}>Valgfrit</div>
                        </div>
                    }
                  </div>
                </label>
              </div>

              {/* ── 2. Grundinfo ── */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--ink3)", textTransform:"uppercase", letterSpacing:"1.2px", marginBottom:8 }}>Grundinfo</div>
                <input placeholder="Titel *" value={submitRecipe.title} onChange={e => setSubmitRecipe(r => ({...r, title:e.target.value}))}
                  style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:"1px solid var(--border2)", background:"var(--surface2)", color:"var(--ink)", fontFamily:"var(--f)", fontSize:14, boxSizing:"border-box", marginBottom:8, outline:"none" }} />
                <textarea placeholder="Kort beskrivelse (valgfrit)" value={submitRecipe.description||""} onChange={e => setSubmitRecipe(r => ({...r, description:e.target.value}))} rows={2}
                  style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:"1px solid var(--border2)", background:"var(--surface2)", color:"var(--ink)", fontFamily:"var(--f)", fontSize:13, boxSizing:"border-box", resize:"none", marginBottom:8, outline:"none" }} />
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                  <select value={submitRecipe.category} onChange={e => setSubmitRecipe(r => ({...r, category:e.target.value}))}
                    style={{ padding:"10px 12px", borderRadius:10, border:"1px solid var(--border2)", background:"var(--surface)", color:"var(--ink)", fontFamily:"var(--f)", fontSize:13, outline:"none" }}>
                    {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  </select>
                  <div style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 12px", background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:10 }}>
                    <span style={{ fontSize:12, color:"var(--muted)", flexShrink:0 }}>👤</span>
                    <input type="number" min={1} max={20} value={submitRecipe.servings||4} onChange={e => setSubmitRecipe(r => ({...r, servings:+e.target.value}))}
                      style={{ width:"100%", background:"none", border:"none", color:"var(--ink)", fontFamily:"var(--f)", fontSize:13, outline:"none" }} />
                    <span style={{ fontSize:11, color:"var(--muted)", flexShrink:0 }}>pers.</span>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 12px", background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:10 }}>
                    <span style={{ fontSize:12, color:"var(--muted)", flexShrink:0 }}>⏱ Forb.</span>
                    <input type="number" min={0} placeholder="0" value={submitRecipe.prep_time_minutes||""} onChange={e => setSubmitRecipe(r => ({...r, prep_time_minutes:+e.target.value}))}
                      style={{ width:"100%", background:"none", border:"none", color:"var(--ink)", fontFamily:"var(--f)", fontSize:13, outline:"none" }} />
                    <span style={{ fontSize:11, color:"var(--muted)" }}>min</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 12px", background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:10 }}>
                    <span style={{ fontSize:12, color:"var(--muted)", flexShrink:0 }}>🍳 Tilb.</span>
                    <input type="number" min={0} placeholder="0" value={submitRecipe.cook_time_minutes||""} onChange={e => setSubmitRecipe(r => ({...r, cook_time_minutes:+e.target.value}))}
                      style={{ width:"100%", background:"none", border:"none", color:"var(--ink)", fontFamily:"var(--f)", fontSize:13, outline:"none" }} />
                    <span style={{ fontSize:11, color:"var(--muted)" }}>min</span>
                  </div>
                </div>
              </div>

              {/* ── 3. Ingredienser ── */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--ink3)", textTransform:"uppercase", letterSpacing:"1.2px", marginBottom:8 }}>Ingredienser</div>
                {submitIngredients.map((ing, idx) => (
                  <div key={idx} style={{ display:"grid", gridTemplateColumns:"1fr 80px 80px 32px", gap:6, marginBottom:6 }}>
                    <input placeholder="Ingrediens *" value={ing.name} onChange={e => {
                      const next = submitIngredients.map((x,i) => i===idx ? {...x, name:e.target.value} : x);
                      setSubmitIngredients(next);
                    }}
                    style={{ padding:"9px 10px", borderRadius:10, border:"1px solid var(--border2)", background:"var(--surface)", color:"var(--ink)", fontFamily:"var(--f)", fontSize:13, outline:"none" }} />
                    <input placeholder="Mængde" value={ing.amount} onChange={e => setSubmitIngredients(submitIngredients.map((x,i)=>i===idx?{...x,amount:e.target.value}:x))}
                      style={{ padding:"9px 8px", borderRadius:10, border:"1px solid var(--border2)", background:"var(--surface)", color:"var(--ink)", fontFamily:"var(--f)", fontSize:13, textAlign:"center", outline:"none" }} />
                    <select value={ing.unit||""} onChange={e => setSubmitIngredients(submitIngredients.map((x,i)=>i===idx?{...x,unit:e.target.value}:x))}
                      style={{ padding:"9px 6px", borderRadius:10, border:"1px solid var(--border2)", background:"var(--surface)", color:"var(--ink)", fontFamily:"var(--f)", fontSize:12, outline:"none" }}>
                      <option value="">enhed</option>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <button onClick={() => setSubmitIngredients(submitIngredients.filter((_,i)=>i!==idx))}
                      style={{ background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:10, cursor:"pointer", color:"var(--red)", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
                  </div>
                ))}
                {/* Auto-detekterede allergener */}
                {autoAllergens.filter(id => !removedAuto.includes(id)).length > 0 && (
                  <div style={{ padding:"10px 12px", background:"rgba(255,186,59,.08)", border:"1px solid rgba(255,186,59,.2)", borderRadius:10, marginBottom:8 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--amber)", marginBottom:6 }}>⚠️ Auto-detekterede allergener — tryk × for at fjerne fejl</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                      {autoAllergens.filter(id => !removedAuto.includes(id)).map(id => {
                        const a = ALLERGENS.find(x=>x.id===id);
                        return (
                          <div key={id} style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 8px", background:"var(--amber-lt)", border:"1px solid var(--amber-md)", borderRadius:100, fontSize:11, fontWeight:700, color:"var(--amber)" }}>
                            {a?.emoji} {a?.label||id}
                            <span style={{ cursor:"pointer", opacity:.7, marginLeft:2 }} onClick={() => setRemovedAuto(r=>[...r,id])}>×</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <button onClick={() => setSubmitIngredients([...submitIngredients, {name:"",amount:"",unit:""}])}
                  style={{ width:"100%", padding:"9px", borderRadius:10, border:"1px dashed var(--border2)", background:"none", color:"var(--muted)", fontFamily:"var(--f)", fontSize:13, cursor:"pointer" }}>
                  ＋ Tilføj ingrediens
                </button>
              </div>

              {/* ── 4. Fremgangsmåde ── */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--ink3)", textTransform:"uppercase", letterSpacing:"1.2px", marginBottom:8 }}>Fremgangsmåde</div>
                {submitSteps.map((step, idx) => (
                  <div key={idx} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"flex-start" }}>
                    <div style={{ width:26, height:26, borderRadius:"50%", background:"var(--green-lt)", border:"1px solid rgba(74,222,128,.3)", color:"var(--green)", fontWeight:800, fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:8 }}>{idx+1}</div>
                    <textarea
                      placeholder={`Trin ${idx+1}…`} value={step} rows={2}
                      onChange={e => setSubmitSteps(submitSteps.map((s,i)=>i===idx?e.target.value:s))}
                      style={{ flex:1, padding:"10px 12px", borderRadius:10, border:"1px solid var(--border2)", background:"var(--surface)", color:"var(--ink)", fontFamily:"var(--f)", fontSize:13, resize:"none", outline:"none" }} />
                    {submitSteps.length > 1 && (
                      <button onClick={() => setSubmitSteps(submitSteps.filter((_,i)=>i!==idx))}
                        style={{ marginTop:8, background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:8, cursor:"pointer", color:"var(--red)", fontSize:14, width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => setSubmitSteps([...submitSteps, ""])}
                  style={{ width:"100%", padding:"9px", borderRadius:10, border:"1px dashed var(--border2)", background:"none", color:"var(--muted)", fontFamily:"var(--f)", fontSize:13, cursor:"pointer" }}>
                  ＋ Tilføj trin {submitSteps.length + 1}
                </button>
              </div>

              {/* ── 5. Diæter & manuelle allergener ── */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--ink3)", textTransform:"uppercase", letterSpacing:"1.2px", marginBottom:8 }}>Diæt & allergener</div>

                {/* Diæter */}
                <div style={{ fontSize:12, color:"var(--ink3)", marginBottom:8 }}>Passer opskriften til:</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
                  {(DIETS||[]).map(d => {
                    const active = (submitRecipe.tags||[]).includes(d.id);
                    return (
                      <div key={d.id} onClick={() => setSubmitRecipe(r => ({ ...r, tags: active ? (r.tags||[]).filter(t=>t!==d.id) : [...(r.tags||[]),d.id] }))}
                        style={{ padding:"6px 12px", borderRadius:100, cursor:"pointer", fontSize:12, fontWeight:700,
                          background: active ? "var(--green-lt)" : "var(--surface)",
                          color: active ? "var(--green)" : "var(--muted2)",
                          border:`1px solid ${active ? "rgba(74,222,128,.3)" : "var(--border)"}`,
                        }}>
                        {d.emoji||"🥗"} {d.label}
                      </div>
                    );
                  })}
                </div>

                {/* Manuelle allergener */}
                <div style={{ fontSize:12, color:"var(--ink3)", marginBottom:8 }}>Manuelle allergener (hvis ikke auto-detekteret):</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {ALLERGENS.map(a => {
                    const isAuto = autoAllergens.includes(a.id) && !removedAuto.includes(a.id);
                    const isManual = manualAllergens.includes(a.id);
                    if (isAuto) return null;
                    return (
                      <div key={a.id} onClick={() => setManualAllergens(m => isManual ? m.filter(id=>id!==a.id) : [...m,a.id])}
                        style={{ padding:"5px 10px", borderRadius:100, cursor:"pointer", fontSize:11, fontWeight:700,
                          background: isManual ? "var(--red-lt)" : "var(--surface)",
                          color: isManual ? "var(--red)" : "var(--muted2)",
                          border:`1px solid ${isManual ? "var(--red-md)" : "var(--border)"}`,
                        }}>
                        {a.emoji} {a.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── 6. Send ── */}
              <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", marginBottom:20 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:4 }}>Opsummering</div>
                <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.6 }}>
                  <div>📌 {submitRecipe.title || "Ingen titel endnu"}</div>
                  <div>🍽️ {submitRecipe.category} · 👤 {submitRecipe.servings||4} pers.</div>
                  <div>🥕 {submitIngredients.filter(i=>i.name).length} ingredienser · 📋 {submitSteps.filter(s=>s.trim()).length} trin</div>
                  {finalAllergens.length > 0 && <div>⚠️ Allergener: {finalAllergens.map(id=>ALLERGENS.find(a=>a.id===id)?.label||id).join(", ")}</div>}
                </div>
              </div>

              <div style={{ fontSize:11, color:"var(--muted)", textAlign:"center", lineHeight:1.5, marginBottom:14 }}>
                ⚕️ Allergener er vejledende. Admins gennemgår opskriften inden publicering.
              </div>

              <button onClick={handleSubmit} disabled={!submitRecipe.title.trim() || submitIngredients.filter(i=>i.name.trim()).length===0 || submittingRecipe || imgUploading}
                style={{ width:"100%", padding:"14px", borderRadius:12, background: submitRecipe.title.trim() ? "var(--green)" : "var(--surface2)", color: submitRecipe.title.trim() ? "#071510" : "var(--muted)", border:"none", fontFamily:"var(--f)", fontSize:15, fontWeight:800, cursor: submitRecipe.title.trim() ? "pointer" : "default", marginBottom:40 }}>
                {submittingRecipe || imgUploading ? "Sender…" : "Send til godkendelse →"}
              </button>
            </div>
          );
        })()}

    </>
  );
}
