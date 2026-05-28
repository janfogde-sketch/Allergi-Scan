// @ts-nocheck
import React, { useState, useRef } from "react";
import { ALLERGENS, SCREENS, DEMO_CODES, DUMMY_PRODUCT, MOCK_PRODUCTS,
         ALLERGEN_EXAMPLES, HOME_TIPS, DIETS, SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { compareAllergens, initials, getAllergenLabels } from "./helpers.js";
import { Icon, IngredientsList, ProfileBadges, getProductIcon, ProductImage } from "./SharedComponents.jsx";

import { CategorySelect } from "./MemberForm.jsx";
export default function ScannerScreen({
  screen, setScreen,
  scanResult, notFoundEan,
  searchQuery, setSearchQuery,
  searchResults, setSearchResults,
  searchCategory, setSearchCategory,
  scanError,
  shoppingList, newItemName, setNewItemName,
  history, favorites,
  family, activeProfiles, setActiveProfiles,
  allergens, customAllerg,
  accessToken, userId, user,
  notFoundStep, setNotFoundStep,
  proposedName, setProposedName,
  proposedFlags, setProposedFlags,
  ocrLoading, ocrText, setOcrText,
  productImagePreview,
  submitting, submitProduct,
  editStep, setEditStep,
  editType, setEditType,
  editNote, setEditNote,
  editIngText, setEditIngText,
  showIng, setShowIng,
  showNutrition, setShowNutrition,
  showManualEan, setShowManualEan,
  showSafeOnly, setShowSafeOnly,
  profilePopup, setProfilePopup,
  greeting,
  cameraActive, setCameraActive,
  galleryInputRef,
  lastScannedRef,
  selectedENumbers,
  addToList,
  handleEditProductCapture,
  handleImageCapture, handleProductImageCapture,
  toggleFavorite,
  clearDone,
  editProductImage,
  isFavorite,
  removeItem,
  scanFromGallery,
  searchLoading,
  startCamera,
  stopCamera,
  toggleItem,
  toggleTorch,
  torchOn,
  buildLabel,
}) {
  // ── Ingrediensliste editor state (bruges i NOTFOUND trin 3 og SUGGEST_EDIT) ──
  const [ingItems, setIngItems] = React.useState([]);
  const [ingInput, setIngInput] = React.useState("");

  // Parser OCR-tekst til liste af ingredienser
  const parseIngredients = (text) => {
    if (!text) return [];
    // Fjern "Ingredienser:", "Indeholder:" prefix
    let cleaned = text.replace(/^(ingredienser|indeholder|ingredients)[\s:：]*/i, "").trim();
    // Split på komma men respekter parenteser
    const items = [];
    let depth = 0, current = "";
    for (const ch of cleaned) {
      if (ch === "(" || ch === "[") { depth++; current += ch; }
      else if (ch === ")" || ch === "]") { depth--; current += ch; }
      else if ((ch === "," || ch === ";" || ch === "·") && depth === 0) {
        const t = current.trim();
        if (t) items.push(t);
        current = "";
      } else { current += ch; }
    }
    if (current.trim()) items.push(current.trim());
    return items.filter(i => i.length > 0);
  };

  const addIngItem = () => {
    const v = ingInput.trim();
    if (v) { setIngItems(p => [...p, v]); setIngInput(""); }
  };

  const ingToText = (items) => items.join(", ");

  // Når OCR returnerer tekst: parse til ingredienser automatisk
  React.useEffect(() => {
    if (ocrText && ocrText.trim()) {
      const parsed = parseIngredients(ocrText);
      if (parsed.length > 0) setIngItems(parsed);
    }
  }, [ocrText]);

  // Ryd ingrediensliste når man starter en ny indsendelse
  React.useEffect(() => {
    if (notFoundStep === 2) { setIngItems([]); setIngInput(""); }
  }, [notFoundStep]);

  // ── Kombinerede allergen-IDs for alle aktive profiler ──────────────────────
  const activeIds = [
    ...(activeProfiles.includes("me") ? allergens : []),
    ...family
      .filter(m => activeProfiles.includes(m.id))
      .flatMap(m => Array.isArray(m.allergens) ? m.allergens : Object.keys(m.allergens||{}).filter(k => m.allergens[k])),
  ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

  return (
    <>
        {screen === SCREENS.HOME && (
          <div className="screen fade-in" id="main-content" style={{ display:"flex", flexDirection:"column", minHeight:"calc(100vh - 130px)" }}>

            {/* Profil popup */}
            {profilePopup && (() => {
              const isUser = profilePopup === "user";
              const member = isUser ? null : family.find(m => m.id === profilePopup);
              const pName = isUser ? (user.name || "Din profil") : member?.name;
              const pAllergens = isUser ? allergens : (member?.allergens || []);
              const pCustom = isUser ? customAllerg : (member?.customAllerg || []);
              const pDiets = isUser ? (user.diets || []) : (member?.diets || []);
              const pENumbers = isUser ? selectedENumbers : (member?.eNumbers || []);
              const isActive = isUser
                ? activeProfiles.includes("user")
                : activeProfiles.includes(profilePopup);
              return (
                <div style={{ position:"fixed", inset:0, zIndex:9990, background:"rgba(0,0,0,.5)" }}
                  onClick={() => setProfilePopup(null)}>
                  <div style={{ position:"absolute", top:80, left:16, right:16,
                    background:"var(--paper)", borderRadius:20, padding:"20px 18px",
                    boxShadow:"0 8px 40px rgba(0,0,0,.2)" }}
                    onClick={e => e.stopPropagation()}>

                    {/* Header */}
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                      <div style={{ width:44, height:44, borderRadius:"50%",
                        background: isUser ? "var(--green)" : (member?.color || "var(--ink)"),
                        color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:16, fontWeight:800, flexShrink:0 }}>
                        {initials(pName)}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:800, fontSize:16, color:"var(--ink)" }}>{pName}</div>
                        <div style={{ fontSize:12, color:"var(--muted)", marginTop:1 }}>
                          {isActive ? "✅ Aktiv i søgning" : "⬜ Ikke aktiv i søgning"}
                        </div>
                      </div>
                      <div onClick={() => setProfilePopup(null)} style={{ cursor:"pointer", padding:4, opacity:.5 }}>✕</div>
                    </div>

                    {/* Allergier */}
                    {pAllergens.length > 0 ? (
                      <div style={{ marginBottom:12 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Allergier / intolerancer</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                          {pAllergens.map(id => {
                            const a = ALLERGENS.find(x => x.id === id);
                            const isInt = pCustom.includes(id + "_intolerance");
                            return (
                              <div key={id} style={{ padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:700,
                                background: isInt ? "var(--amber-lt)" : "var(--red-lt)",
                                color: isInt ? "var(--amber)" : "var(--red)",
                                border: `1px solid ${isInt ? "var(--amber)" : "var(--red)"}` }}>
                                {a?.label || id}
                              </div>
                            );
                          })}
                          {pCustom.filter(c => !c.endsWith("_intolerance")).map((c,i) => (
                            <div key={i} style={{ padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:700,
                              background:"var(--paper2)", color:"var(--muted)", border:"1px solid var(--border)" }}>
                              {c}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize:12, color:"var(--muted)", marginBottom:12 }}>Ingen allergier registreret</div>
                    )}

                    {/* Diæt */}
                    {pDiets.length > 0 && (
                      <div style={{ marginBottom:12 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Diæt</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                          {pDiets.map(d => (
                            <div key={d} style={{ padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:700,
                              background:"var(--green-lt)", color:"var(--green)", border:"1px solid var(--green-mid)" }}>
                              {DIETS.find(x=>x.id===d)?.label || d}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* E-numre */}
                    {pENumbers.length > 0 && (
                      <div style={{ marginBottom:12 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>E-numre</div>
                        <div style={{ fontSize:12, color:"var(--muted2)" }}>{pENumbers.length} E-numre overvåges</div>
                      </div>
                    )}

                    {/* Aktiver/deaktiver */}
                    <button className="btn btn-full" style={{
                      marginTop:4,
                      background: isActive ? "var(--paper2)" : "var(--green)",
                      color: isActive ? "var(--muted)" : "#fff",
                      border: `1px solid ${isActive ? "var(--border)" : "var(--green)"}`,
                    }} onClick={() => {
                      const pid = isUser ? "user" : profilePopup;
                      setActiveProfiles(p => p.includes(pid) ? p.filter(x=>x!==pid) : [...p, pid]);
                      setProfilePopup(null);
                    }}>
                      {isActive ? "Deaktiver i søgning" : "Aktivér i søgning"}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Hilsen + Profil-bar */}
            <div style={{ padding:"16px 2px 12px" }}>
              <div style={{ fontSize:20, fontWeight:900, color:"var(--ink)", letterSpacing:"-.3px", marginBottom:4 }}>
                {greeting} {user.name?.split(" ")[0] || "der"}
              </div>
              {buildLabel && (
                <div style={{ fontSize:10, color:"var(--muted)", marginBottom:10, opacity:.7, letterSpacing:".2px" }}>
                  Sidst opdateret {buildLabel}
                </div>
              )}

              {/* Vælg alle / fravælg alle */}
              <div style={{ display:"flex", gap:6, marginBottom:10 }}>
                {(() => {
                  const allIds = ["user", ...family.map(m => m.id)];
                  const allActive = allIds.every(id => activeProfiles.includes(id));
                  return (
                    <>
                      <button onClick={() => setActiveProfiles(allIds)}
                        style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20, border:"1.5px solid var(--green)",
                          background: allActive ? "var(--green)" : "var(--green-lt)", color: allActive ? "#fff" : "var(--green)", cursor:"pointer", fontFamily:"var(--f)" }}>
                        Vælg alle
                      </button>
                      <button onClick={() => setActiveProfiles([])}
                        style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20, border:"1.5px solid var(--border)",
                          background:"var(--paper2)", color:"var(--muted)", cursor:"pointer", fontFamily:"var(--f)" }}>
                        Fravælg alle
                      </button>
                    </>
                  );
                })()}
              </div>

              {/* Profil-avatars */}
              <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                {/* Brugeren selv */}
                {(() => {
                  const isActive = activeProfiles.includes("user");
                  return (
                    <div onClick={() => setProfilePopup("user")} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer" }}>
                      <div style={{ position:"relative" }}>
                        <div style={{ width:46, height:46, borderRadius:"50%",
                          background: isActive ? "var(--green)" : "var(--paper2)",
                          color: isActive ? "#fff" : "var(--muted)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:15, fontWeight:800,
                          border: `2.5px solid ${isActive ? "var(--green)" : "var(--border)"}`,
                          boxShadow: isActive ? "0 0 0 3px var(--green-lt)" : "none",
                          transition:"all .2s" }}>
                          {initials(user.name || "?")}
                        </div>
                        {allergens.length > 0 && (
                          <div style={{ position:"absolute", bottom:-1, right:-1, width:16, height:16,
                            background:"var(--red)", borderRadius:"50%", border:"2px solid var(--paper)",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:9, color:"#fff", fontWeight:800 }}>
                            {allergens.length}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize:10, fontWeight:700,
                        color: isActive ? "var(--ink)" : "var(--muted2)",
                        maxWidth:48, textAlign:"center", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {user.name?.split(" ")[0] || "Mig"}
                      </div>
                    </div>
                  );
                })()}

                {/* Familiemedlemmer */}
                {family.map(m => {
                  const isActive = activeProfiles.includes(m.id);
                  return (
                    <div key={m.id} onClick={() => setProfilePopup(m.id)}
                      style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer" }}>
                      <div style={{ position:"relative" }}>
                        <div style={{ width:46, height:46, borderRadius:"50%",
                          background: isActive ? "var(--green)" : "var(--paper2)",
                          color: isActive ? "#fff" : "var(--muted)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:15, fontWeight:800,
                          border: `2.5px solid ${isActive ? "var(--green)" : "var(--border)"}`,
                          boxShadow: isActive ? "0 0 0 3px var(--green-lt)" : "none",
                          transition:"all .2s" }}>
                          {initials(m.name)}
                        </div>
                        {(m.allergens||[]).length > 0 && (
                          <div style={{ position:"absolute", bottom:-1, right:-1, width:16, height:16,
                            background:"var(--red)", borderRadius:"50%", border:"2px solid var(--paper)",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:9, color:"#fff", fontWeight:800 }}>
                            {(m.allergens||[]).length}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize:10, fontWeight:700,
                        color: isActive ? "var(--ink)" : "var(--muted2)",
                        maxWidth:48, textAlign:"center", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {m.name?.split(" ")[0]}
                      </div>
                    </div>
                  );
                })}

                {/* Tilføj-knap */}
                <div onClick={() => setScreen(SCREENS.FAMILY)}
                  style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer" }}>
                  <div style={{ width:46, height:46, borderRadius:"50%", background:"var(--paper2)",
                    border:"2px dashed var(--border)", display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:22, color:"var(--muted)", lineHeight:1 }}>+</div>
                  <div style={{ fontSize:10, color:"var(--muted2)", fontWeight:600 }}>Tilføj</div>
                </div>
              </div>
            </div>

            {/* Scan-boks — viser kamera når aktivt, animation ellers */}
            <div style={{
              background:"var(--ink)", borderRadius:20, marginBottom:10,
              overflow:"hidden", position:"relative",
              boxShadow:"0 4px 20px rgba(31,39,51,.18)",
            }}>
              {/* Kamera container — altid i DOM men skjult når ikke aktiv */}
              <div style={{ position:"relative", display: cameraActive ? "block" : "none" }}>
                <div id="qr-reader-home" style={{ width:"100%", background:"#000" }} />
                {/* Scanner overlay — ramme og laser */}
                <div style={{
                  position:"absolute", inset:0, pointerEvents:"none",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  {/* Mørke hjørner */}
                  <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.4)" }} />
                  {/* Klar scanzone */}
                  <div style={{
                    position:"relative",
                    width:"75%", height:100,
                    boxShadow:"0 0 0 9999px rgba(0,0,0,.4)",
                    borderRadius:8,
                  }}>
                    {/* Hjørne-markører */}
                    {[["0","0","tl"],["0","auto","bl"],["auto","0","tr"],["auto","auto","br"]].map(([t,b,key]) => (
                      <div key={key} style={{
                        position:"absolute",
                        top: key.startsWith("t") ? 0 : "auto",
                        bottom: key.startsWith("b") ? 0 : "auto",
                        left: key.endsWith("l") ? 0 : "auto",
                        right: key.endsWith("r") ? 0 : "auto",
                        width:22, height:22,
                        borderColor:"var(--green)",
                        borderStyle:"solid",
                        borderWidth:0,
                        borderTopWidth: key.startsWith("t") ? 3 : 0,
                        borderBottomWidth: key.startsWith("b") ? 3 : 0,
                        borderLeftWidth: key.endsWith("l") ? 3 : 0,
                        borderRightWidth: key.endsWith("r") ? 3 : 0,
                        borderRadius: key==="tl"?"4px 0 0 0":key==="tr"?"0 4px 0 0":key==="bl"?"0 0 0 4px":"0 0 4px 0",
                      }} />
                    ))}
                    {/* Laser-linje */}
                    <div style={{
                      position:"absolute", left:4, right:4, height:2,
                      background:"linear-gradient(90deg, transparent, var(--green), rgba(134,239,172,.8), var(--green), transparent)",
                      boxShadow:"0 0 8px var(--green), 0 0 16px var(--green)",
                      animation:"laserMove 1.8s ease-in-out infinite",
                      top:0,
                    }} />
                  </div>
                </div>
              </div>
              <div id="qr-reader-gallery" style={{ display:"none" }} />
              <input ref={galleryInputRef} type="file" accept="image/*" style={{ display:"none" }}
                onChange={e => { if (e.target.files[0]) scanFromGallery(e.target.files[0]); e.target.value=""; }} />

              {/* Stop-knap når kamera er aktivt */}
              {cameraActive && (
                <div style={{ padding:"8px 14px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ color:"rgba(255,255,255,.6)", fontSize:12, fontWeight:600 }}>Hold stregkoden ind i rammen</span>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => galleryInputRef.current?.click()} style={{ background:"rgba(255,255,255,.15)", border:"none", borderRadius:6, padding:"5px 10px", color:"#fff", fontSize:16, cursor:"pointer", lineHeight:1 }}>🖼️</button>
                    <button onClick={toggleTorch} style={{
                      background: torchOn ? "rgba(251,191,36,.3)" : "rgba(255,255,255,.15)",
                      border: torchOn ? "1px solid rgba(251,191,36,.6)" : "none",
                      borderRadius:6, padding:"5px 10px", color: torchOn ? "#FBB" : "#fff",
                      fontSize:16, cursor:"pointer", lineHeight:1
                    }}>🔦</button>
                    <button onClick={stopCamera} style={{ background:"rgba(255,255,255,.15)", border:"none", borderRadius:6, padding:"5px 12px", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--f)" }}>Stop</button>
                  </div>
                </div>
              )}

              {/* Animation når kamera ikke er aktivt */}
              {!cameraActive && (
              <div style={{ cursor:"pointer", padding:"28px 24px", display:"flex", flexDirection:"column", alignItems:"center", gap:16, position:"relative" }}
                onClick={() => startCamera()}
                role="button"
                aria-label="Start kamera for at scanne stregkode"
                tabIndex={0}
                onKeyDown={e => e.key === "Enter" && startCamera()}>
                {/* Stregkode-animation */}
                <div style={{ position:"relative", width:180, height:90 }}>
                  {/* Stregkode streger */}
                  <svg viewBox="0 0 180 90" width="180" height="90">
                    <g fill="rgba(255,255,255,0.15)">
                      <rect x="10" y="0" width="7" height="90" rx="1"/>
                      <rect x="22" y="0" width="3" height="90" rx="1"/>
                      <rect x="29" y="0" width="5" height="90" rx="1"/>
                      <rect x="38" y="0" width="2" height="90" rx="1"/>
                      <rect x="44" y="0" width="8" height="90" rx="1"/>
                      <rect x="56" y="0" width="3" height="90" rx="1"/>
                      <rect x="63" y="0" width="6" height="90" rx="1"/>
                      <rect x="73" y="0" width="2" height="90" rx="1"/>
                      <rect x="79" y="0" width="4" height="90" rx="1"/>
                      <rect x="87" y="0" width="7" height="90" rx="1"/>
                      <rect x="98" y="0" width="3" height="90" rx="1"/>
                      <rect x="105" y="0" width="5" height="90" rx="1"/>
                      <rect x="114" y="0" width="2" height="90" rx="1"/>
                      <rect x="120" y="0" width="6" height="90" rx="1"/>
                      <rect x="130" y="0" width="3" height="90" rx="1"/>
                      <rect x="137" y="0" width="8" height="90" rx="1"/>
                      <rect x="149" y="0" width="4" height="90" rx="1"/>
                      <rect x="157" y="0" width="2" height="90" rx="1"/>
                      <rect x="163" y="0" width="7" height="90" rx="1"/>
                    </g>
                  </svg>
                  {/* Laser linje */}
                  <div style={{
                    position:"absolute", left:0, right:0, height:2,
                    background:"linear-gradient(90deg, transparent, #22C55E, #4ADE80, #22C55E, transparent)",
                    animation:"laserMove 2s ease-in-out infinite",
                    filter:"drop-shadow(0 0 6px #22C55E)",
                    boxShadow:"0 0 8px #22C55E",
                  }}/>
                  {/* Hjørnemarkører */}
                  {[["0","0","top","left"],["0","0","top","right"],["0","0","bottom","left"],["0","0","bottom","right"]].map((_,i) => {
                    const pos = [{top:8,left:8},{top:8,right:8},{bottom:8,left:8},{bottom:8,right:8}][i];
                    const borders = [
                      {borderTop:"2px solid rgba(255,255,255,.6)",borderLeft:"2px solid rgba(255,255,255,.6)"},
                      {borderTop:"2px solid rgba(255,255,255,.6)",borderRight:"2px solid rgba(255,255,255,.6)"},
                      {borderBottom:"2px solid rgba(255,255,255,.6)",borderLeft:"2px solid rgba(255,255,255,.6)"},
                      {borderBottom:"2px solid rgba(255,255,255,.6)",borderRight:"2px solid rgba(255,255,255,.6)"},
                    ][i];
                    return <div key={i} style={{ position:"absolute", width:16, height:16, ...pos, ...borders, borderRadius:2 }}/>;
                  })}
                </div>
                {/* Tekst */}
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:20, fontWeight:900, color:"#fff", letterSpacing:"-.4px" }}>Skan produkt</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,.5)", marginTop:4 }}>Tryk for at starte kamera</div>
                  <div onClick={e => { e.stopPropagation(); galleryInputRef.current?.click(); }}
                    style={{ fontSize:11, color:"rgba(255,255,255,.35)", marginTop:8, textDecoration:"underline", cursor:"pointer" }}>
                    eller vælg billede fra galleri
                  </div>
                </div>
              </div>
              )}
            </div>

            {/* Fejlbesked fra kamera */}
            {scanError && (
              <div style={{ fontSize:12, color:"var(--red)", background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:8, padding:"8px 12px", marginBottom:8 }}>
                {scanError} — <span style={{ textDecoration:"underline", cursor:"pointer" }} onClick={() => setShowManualEan(true)}>Indtast manuelt</span>
              </div>
            )}

            {/* Søg — fremhævet på forsiden */}
            <div className="card" style={{ padding:"12px 14px", cursor:"pointer", marginBottom:10 }}
              onClick={() => setScreen(SCREENS.SEARCH)}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:40, height:40, background:"var(--paper2)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon name="search" size={20} color="var(--ink2)" /></div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>Søg produkter</div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>Find varer der er sikre for dig</div>
                </div>
                <div style={{ fontSize:18, color:"var(--muted)" }}>›</div>
              </div>
            </div>

            {/* Indkøbsliste — kun hvis der er varer */}
            {shoppingList.filter(i => !i.checked).length > 0 && (
              <div className="card" style={{ padding:"12px 14px", cursor:"pointer", marginBottom:10 }}
                onClick={() => setScreen(SCREENS.LIST)}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:40, height:40, background:"var(--green-lt)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon name="cart" size={20} color="var(--green)" /></div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700 }}>Indkøbsliste</div>
                    <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>
                      {shoppingList.filter(i => !i.checked).length} vare{shoppingList.filter(i => !i.checked).length !== 1 ? "r" : ""} mangler
                    </div>
                  </div>
                  <div style={{ fontSize:18, color:"var(--muted)" }}>›</div>
                </div>
              </div>
            )}

            <div style={{ flex:1, minHeight:20 }} />
            {/* Vidste du at — let, i bunden */}
            {(() => {
              const tip = HOME_TIPS[new Date().getDay() % HOME_TIPS.length];
              return (
                <div style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"10px 0", borderTop:"1px solid var(--border)", marginTop:4 }}>
                  <div style={{ flexShrink:0 }}><Icon name="bulb" size={20} color="#F59E0B" /></div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:9, fontWeight:800, color:"var(--green)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:3 }}>Vidste du at</div>
                    <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:2 }}>{tip.title}</div>
                    <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.5 }}>{tip.text}</div>
                  </div>
                  
                </div>
              );
            })()}

            {/* Version */}
            <div style={{ textAlign:"center", paddingTop:8, paddingBottom:4 }}>
              <div style={{ fontSize:10, color:"var(--muted)", opacity:0.5 }}>v1.0.6</div>
            </div>

          </div>
        )}

        {screen === SCREENS.RESULT && scanResult && (
          <div className="screen fade-in">

            {/* ── 1. SIKKERHED + DIÆT ── */}
            {(() => {
              const flags = scanResult.allergen_flags || {};
              const profiles = [
                { id:"me", name: user.name||"Dig", allergens },
                ...family.filter(m => activeProfiles.includes(m.id)),
              ];
              const tagLabels = { vegan:"Vegansk", vegetarian:"Vegetarisk", "palm-oil-free":"Uden palmeolie", "gluten-free":"Glutenfri", organic:"Økologisk" };
              const hasTags = scanResult.tags && scanResult.tags.length > 0;

              return (
                <div style={{ marginBottom:10 }}>
                  {/* 2 kolonner */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom: hasTags ? 8 : 0 }}>
                  {profiles.map((p, pi) => {
                    const danger = p.allergens.filter(a => flags[a] === "yes");
                    const warning = p.allergens.filter(a => flags[a] === "traces");
                    const statusColor = danger.length > 0 ? "var(--red)" : warning.length > 0 ? "var(--amber)" : "var(--green)";
                    const statusBg = danger.length > 0 ? "var(--red-lt)" : warning.length > 0 ? "var(--amber-lt)" : "var(--green-lt)";
                    const statusBorder = danger.length > 0 ? "var(--red-md)" : warning.length > 0 ? "var(--amber-md)" : "var(--green-mid)";
                    const statusIcon = danger.length > 0 ? "×" : warning.length > 0 ? "!" : "✓";
                    const productTags = scanResult.tags || [];
                    const dietMatch = p.diets && p.diets.length > 0
                      ? p.diets.every(d => productTags.includes(d))
                      : null; // null = ingen diæt registreret
                    const statusText = danger.length > 0
                      ? danger.map(id => ALLERGENS.find(a=>a.id===id)?.label).filter(Boolean).join(", ")
                      : warning.length > 0
                      ? "Spor: " + warning.map(id => ALLERGENS.find(a=>a.id===id)?.label).filter(Boolean).join(", ")
                      : dietMatch === false ? "Passer ikke til diæt"
                      : "Sikkert";
                    const finalColor = danger.length > 0 ? "var(--red)" : warning.length > 0 ? "var(--amber)" : dietMatch === false ? "var(--amber)" : "var(--green)";
                    const finalBg = danger.length > 0 ? "var(--red-lt)" : warning.length > 0 ? "var(--amber-lt)" : dietMatch === false ? "var(--amber-lt)" : "var(--green-lt)";
                    const finalBorder = danger.length > 0 ? "var(--red-md)" : warning.length > 0 ? "var(--amber-md)" : dietMatch === false ? "var(--amber-md)" : "var(--green-mid)";
                    const finalIcon = danger.length > 0 ? "×" : warning.length > 0 ? "!" : dietMatch === false ? "!" : "✓";

                    return (
                      <div key={p.id} style={{
                        display:"flex", alignItems:"center", justifyContent:"space-between",
                        padding:"6px 10px",
                        background: finalBg,
                        border:`1px solid ${finalBorder}`,
                        borderRadius:8,
                        gap:6,
                      }}>
                        <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>
                          {p.id==="me" ? "Dig" : p.name}
                        </div>
                        <div style={{ fontSize:11, fontWeight:700, color:finalColor, flexShrink:0 }}>{finalIcon} {statusText}</div>
                      </div>
                    );
                  })}
                  </div>

                  {/* Diæt-tags — sømløst under profilerne */}
                  {hasTags && (
                    <div style={{
                      display:"flex", gap:6, flexWrap:"wrap",
                      padding:"8px 14px",
                      background:"#fff",
                      border:"1px solid var(--border)",
                      borderTop:"none",
                      borderRadius:"0 0 12px 12px",
                    }}>
                      {scanResult.tags.map((tag, i) => (
                        <span key={i} style={{ fontSize:11, fontWeight:700, color:"var(--green)", background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:100, padding:"2px 9px" }}>
                          {tagLabels[tag] || tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── 2. PRODUKT HERO ── */}
            <div className="product-hero">
              {scanResult.image_url
                ? <img src={scanResult.image_url} alt={scanResult.name} className="product-hero-img" onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
                : null}
              <div className="product-hero-img-placeholder" style={{ display: scanResult.image_url ? "none" : "flex", flexDirection:"column", gap:8, background:"var(--paper2)", borderRadius:12, padding:20, margin:"0 0 10px" }}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--border2)" strokeWidth="1.5">
                  <rect x="4" y="10" width="40" height="30" rx="3"/>
                  <circle cx="16" cy="20" r="4"/>
                  <path strokeLinecap="round" d="M4 34l10-8 8 6 6-4 16 12"/>
                </svg>
                <div style={{ fontSize:11, color:"var(--muted)", fontWeight:500 }}>Ingen produktbillede</div>
              </div>
              <div className="product-hero-body">
                <div className="product-hero-name">{scanResult.name}</div>
                {scanResult.brand && <div className="product-hero-brand">{scanResult.brand}</div>}
                <div className="product-hero-meta">
                  <span style={{ fontSize:10, color:"var(--muted)", fontWeight:500 }}>EAN: {scanResult.code}</span>
                  {scanResult.source && (() => {
                    const vb = verifiedBadge(scanResult.verified_status, scanResult.source);
                    return <span className="product-hero-source" style={{ background:vb.bg, color:vb.color, fontSize:9, opacity:0.75 }}>{vb.label}</span>;
                  })()}
                </div>
              </div>
            </div>

            {/* ── 3. ANDRE ALLERGENER I PRODUKTET ── */}
            {scanResult.allergen_flags && (() => {
              const flags = scanResult.allergen_flags;
              const present = Object.entries(flags).filter(([k,v]) => v==="yes" && ALLERGENS.find(a=>a.id===k));
              const traces = Object.entries(flags).filter(([k,v]) => v==="traces" && ALLERGENS.find(a=>a.id===k));
              const myAllergens = new Set([...scanResult.matchedDanger||[], ...scanResult.matchedWarning||[]]);
              const otherPresent = present.filter(([k]) => !myAllergens.has(k));
              const otherTraces = traces.filter(([k]) => !myAllergens.has(k));
              if (otherPresent.length === 0 && otherTraces.length === 0) return null;
              return (
                <div className="card">
                  <div className="card-lbl">Andre allergener i produktet</div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8 }}>Ikke registreret på dine profiler</div>
                  {otherPresent.length > 0 && <div className="tags" style={{ marginBottom:6 }}>{otherPresent.map(([k]) => { const a=ALLERGENS.find(x=>x.id===k); return a ? <div key={k} className="tag" style={{ background:"var(--paper2)", color:"var(--ink2)", borderColor:"var(--border2)" }}>{a.emoji} {a.label}</div> : null; })}</div>}
                  {otherTraces.length > 0 && <div className="tags">{otherTraces.map(([k]) => { const a=ALLERGENS.find(x=>x.id===k); return a ? <div key={k} className="tag" style={{ background:"var(--paper2)", color:"var(--muted)", borderColor:"var(--border2)" }}>spor: {a.emoji} {a.label}</div> : null; })}</div>}
                </div>
              );
            })()}

            {/* ── 4. INGREDIENSLISTE ── */}
            <div className="card">
              <div className="ing-toggle" onClick={() => scanResult.ingredients && setShowIng(v => !v)}
                style={{ cursor: scanResult.ingredients ? "pointer" : "default" }}>
                <span>Ingrediensliste</span>
                {scanResult.ingredients && <span>{showIng?"▲":"▼"}</span>}
              </div>
              {scanResult.ingredients ? (
                showIng && (
                  <div style={{ marginTop:10 }}>
                    <div style={{ padding:"10px", background:"var(--paper2)", borderRadius:8, marginBottom:8 }}>
                      <IngredientsList text={scanResult.ingredients} allergenFlags={scanResult.allergen_flags||{}} />
                    </div>
                    <div style={{ fontSize:10, color:"var(--muted)", padding:"6px 8px", background:"var(--paper2)", borderRadius:6, lineHeight:1.4 }}>
                      Fremhævet = allergen · Listen kan være på originalsprog — tjek altid selv
                    </div>
                  </div>
                )
              ) : (
                <div style={{ padding:"8px 0" }}>
                  <div style={{ fontSize:13, color:"var(--muted2)", marginBottom:8 }}>Vi mangler ingredienslisten for dette produkt.</div>
                  <button className="btn btn-outline btn-sm" onClick={() => { setEditStep("start"); setEditIngText(scanResult?.ingredients || ""); setEditNote(""); setEditType(null); setScreen(SCREENS.SUGGEST_EDIT); }}>
                    Hjælp os — indsend ingrediensliste
                  </button>
                </div>
              )}
            </div>

            {/* ── 5. NÆRINGSINDHOLD — kollapsibel ── */}
            {!scanResult.nutrition && (
              <div className="card">
                <div className="ing-toggle" style={{ cursor:"default" }}>
                  <span>Næringsindhold pr. 100g</span>
                </div>
                <div style={{ padding:"12px 0", display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:"var(--muted2)", marginBottom:6 }}>Vi mangler næringsdata for dette produkt.</div>
                    <button className="btn btn-outline btn-sm" onClick={() => { setEditStep("start"); setEditIngText(scanResult?.ingredients || ""); setEditNote(""); setEditType(null); setScreen(SCREENS.SUGGEST_EDIT); }}>
                      Hjælp os — indsend næringsdata
                    </button>
                  </div>
                </div>
              </div>
            )}
            {scanResult.nutrition && (() => {
              const n = scanResult.nutrition;
              const rows = [
                ["Energi", n.energy_kcal ? `${n.energy_kcal} kcal` : null],
                ["Fedt", n.fat != null ? `${n.fat} g` : null],
                ["— heraf mættet", n.saturated_fat != null ? `${n.saturated_fat} g` : null],
                ["Kulhydrat", n.carbohydrates != null ? `${n.carbohydrates} g` : null],
                ["— heraf sukker", n.sugars != null ? `${n.sugars} g` : null],
                ["Kostfibre", n.fiber != null ? `${n.fiber} g` : null],
                ["Protein", n.protein != null ? `${n.protein} g` : null],
                ["Salt", n.salt != null ? `${n.salt} g` : null],
              ].filter(([,v]) => v !== null);
              if (!rows.length) return null;
              return (
                <div className="card">
                  <div className="ing-toggle" onClick={() => setShowNutrition(v => !v)}>
                    <span>Næringsindhold pr. 100g</span>
                    <span>{showNutrition?"▲":"▼"}</span>
                  </div>
                  {showNutrition && (
                    <div style={{ display:"flex", flexDirection:"column", marginTop:10 }}>
                      {rows.map(([label, value], i) => (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom: i < rows.length-1 ? "1px solid var(--border)" : "none" }}>
                          <span style={{ fontSize:13, color: label.startsWith("—") ? "var(--muted)" : "var(--ink2)", paddingLeft: label.startsWith("—") ? 12 : 0 }}>{label}</span>
                          <span style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── 6. HANDLINGER ── */}
            <div className="card">
              <div className="card-lbl">Handlinger</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <button className="btn btn-sm" style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                    background: isFavorite(scanResult.code) ? "var(--amber-lt)" : "var(--paper2)",
                    color: isFavorite(scanResult.code) ? "var(--amber)" : "var(--ink2)",
                    border:"1px solid var(--border)" }}
                  onClick={() => toggleFavorite(scanResult)}>
                  <Icon name="heart" size={15} color={isFavorite(scanResult.code) ? "var(--amber)" : "var(--muted)"} />
                  {isFavorite(scanResult.code) ? "Fjern" : "Favorit"}
                </button>
                <button className="btn btn-ghost btn-sm" style={{ flex:1 }}
                  onClick={() => { if(navigator.share) navigator.share({title:scanResult.name, text:scanResult.headline}); }}>
                  Del
                </button>
                <button className="btn btn-outline btn-sm" style={{ flex:1 }}
                  onClick={() => { setEditStep("start"); setEditIngText(scanResult?.ingredients || ""); setEditNote(""); setEditType(null); setScreen(SCREENS.SUGGEST_EDIT); }}>
                  Foreslå ændring
                </button>
              </div>
            </div>

            {/* ── 7. TRUST-LAG — confidence score og verifikation ── */}
            {(() => {
              const { confidence } = compareAllergens(scanResult.allergen_flags||{}, activeIds);
              const verifiedAt = scanResult.verified_at || scanResult.updated_at;
              const daysSince = verifiedAt ? Math.floor((Date.now() - new Date(verifiedAt).getTime()) / 86400000) : null;

              const confidenceConfig = {
                high:   { color:"var(--green)", bg:"var(--green-lt)",  border:"var(--green-mid)", icon:"✓", label:"Høj sikkerhed",    desc:"Allergendata er verificeret og pålidelig." },
                medium: { color:"var(--amber)", bg:"var(--amber-lt)",  border:"var(--amber-md)",  icon:"⚠", label:"Middel sikkerhed", desc:"Visse allergener kunne ikke bekræftes fuldt ud." },
                low:    { color:"var(--muted)", bg:"var(--paper2)",    border:"var(--border2)",   icon:"?", label:"Lav sikkerhed",    desc:"Begrænsede allergendata — tjek altid emballagen." },
              };
              const cfg = confidenceConfig[confidence] || confidenceConfig.low;

              return (
                <div style={{ background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:12, padding:"12px 14px", marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom: daysSince !== null ? 6 : 0 }}>
                    <div style={{ fontSize:16, fontWeight:800, color:cfg.color, flexShrink:0 }}>{cfg.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:cfg.color }}>{cfg.label}</div>
                      <div style={{ fontSize:11, color:"var(--muted)", marginTop:1, lineHeight:1.4 }}>{cfg.desc}</div>
                    </div>
                    {scanResult.verified_status === "verified" && (
                      <div style={{ fontSize:10, fontWeight:700, color:"var(--green)", background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:20, padding:"2px 8px", flexShrink:0 }}>Verificeret</div>
                    )}
                  </div>
                  {daysSince !== null && (
                    <div style={{ fontSize:10, color:"var(--muted)", paddingTop:6, borderTop:`1px solid ${cfg.border}` }}>
                      Sidst opdateret: {daysSince === 0 ? "i dag" : daysSince === 1 ? "i går" : `for ${daysSince} dage siden`}
                      {daysSince > 180 && " · Data kan være forældet"}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {screen === SCREENS.NOTFOUND && (
          <div className="screen fade-in">

            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 0 14px" }}>
              <button onClick={() => setScreen(SCREENS.HOME)}
                style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2">
                  <path strokeLinecap="round" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)" }}>Nyt produkt</div>
                <div style={{ fontSize:12, color:"var(--muted)", marginTop:1, fontFamily:"monospace" }}>EAN: {notFoundEan}</div>
              </div>
              {/* Fremgangsindikator */}
              <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                {[1,2,3].map(s => (
                  <div key={s} style={{
                    width: notFoundStep === s ? 20 : 8,
                    height:8, borderRadius:4, transition:"all .3s",
                    background: s < notFoundStep ? "var(--green)" : s === notFoundStep ? "var(--ink)" : "var(--border2)"
                  }} />
                ))}
              </div>
            </div>

            {/* ── TRIN 1: Fotografér forsiden ── */}
            {notFoundStep === 1 && !ocrLoading && (
              <div className="fade-in">
                <div style={{ background:"var(--ink)", borderRadius:16, padding:"24px 20px", marginBottom:16, textAlign:"center" }}>
                  <div style={{ fontSize:52, marginBottom:10 }}>📦</div>
                  <div style={{ fontSize:18, fontWeight:900, color:"#fff", marginBottom:8 }}>
                    Vi kender ikke dette produkt
                  </div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,.6)", lineHeight:1.7 }}>
                    Tag 2 hurtige billeder — vi finder automatisk navn og allergener
                  </div>
                </div>

                {/* Trin-oversigt */}
                <div style={{ display:"flex", gap:8, marginBottom:20 }}>
                  {[
                    { num:1, emoji:"📸", label:"Forside", desc:"Produktnavn" },
                    { num:2, emoji:"🔍", label:"Ingredienser", desc:"Allergenanalyse" },
                    { num:3, emoji:"✓", label:"Bekræft", desc:"Send ind" },
                  ].map(s => (
                    <div key={s.num} style={{ flex:1, background:"#fff", border:"1px solid var(--border)", borderRadius:12, padding:"12px 8px", textAlign:"center", boxShadow:"var(--sh)" }}>
                      <div style={{ fontSize:22, marginBottom:4 }}>{s.emoji}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)" }}>{s.label}</div>
                      <div style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>{s.desc}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:8 }}>
                  Trin 1 — Fotografér produktets forside
                </div>
                <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.6, marginBottom:16 }}>
                  Hold telefonen foran produktets forside. Vi bruger billedet til at hente produktnavnet automatisk.
                </div>

                <label style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                  width:"100%", padding:"16px", borderRadius:14, cursor:"pointer",
                  background:"var(--ink)", border:"none", color:"#fff",
                  fontSize:15, fontWeight:800, boxShadow:"0 4px 16px rgba(31,39,51,.25)",
                  marginBottom:10,
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Fotografér forsiden
                  <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handleProductImageCapture} />
                </label>
                <label style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  width:"100%", padding:"13px", borderRadius:12, cursor:"pointer",
                  background:"#fff", border:"1.5px solid var(--border2)", color:"var(--ink2)",
                  fontSize:13, fontWeight:600, marginBottom:10,
                }}>
                  📁 Vælg fra galleri
                  <input type="file" accept="image/*" style={{ display:"none" }} onChange={handleProductImageCapture} />
                </label>
                <button style={{ width:"100%", background:"none", border:"none", cursor:"pointer", fontSize:12, color:"var(--muted)", padding:"8px 0", fontFamily:"var(--f)" }}
                  onClick={() => setNotFoundStep(2)}>
                  Spring forside over →
                </button>
              </div>
            )}

            {/* ── SCANNING-LOADER ── */}
            {ocrLoading && (
              <div className="fade-in" style={{ textAlign:"center", padding:"60px 20px" }}>
                <div style={{ width:64, height:64, border:"4px solid var(--border2)", borderTopColor:"var(--green)", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 20px" }} />
                <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)", marginBottom:8 }}>
                  {notFoundStep === 1 ? "Henter produktnavn…" : "Analyserer ingredienser…"}
                </div>
                <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6 }}>
                  {notFoundStep === 1
                    ? "Vores AI læser produktnavnet fra billedet"
                    : "Vi finder allergener og ingredienser automatisk"
                  }
                </div>
              </div>
            )}

            {/* ── TRIN 2: Fotografér ingredienslisten ── */}
            {notFoundStep === 2 && !ocrLoading && (
              <div className="fade-in">
                {/* Vis produktbillede + navn hvis hentet */}
                {productImagePreview && (
                  <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"#fff", border:"1px solid var(--border)", borderRadius:12, marginBottom:14, boxShadow:"var(--sh)" }}>
                    <img src={productImagePreview} alt="Produkt"
                      style={{ width:52, height:52, objectFit:"contain", borderRadius:8, border:"1px solid var(--border)", flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <input
                        value={proposedName}
                        onChange={e => setProposedName(e.target.value)}
                        placeholder="Produktnavn…"
                        style={{ width:"100%", border:"none", outline:"none", fontFamily:"var(--f)", fontSize:14, fontWeight:700, color:"var(--ink)", background:"transparent", padding:0 }}
                      />
                      <div style={{ fontSize:11, color:"var(--green)", marginTop:2 }}>✓ Forside fotograferet</div>
                    </div>
                  </div>
                )}

                <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:8 }}>
                  Trin 2 — Fotografér ingredienslisten
                </div>

                {/* Visuel guide */}
                <div style={{ background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:12, padding:"14px", marginBottom:14 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:10 }}>Sådan finder du ingredienslisten:</div>
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:8 }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.5 }}>Vend pakken om — ingredienslisten starter typisk med "Ingredienser:" eller "Indeholder:"</div>
                  </div>
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:8 }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.5 }}>Hold telefonen stille og vent til teksten er skarp</div>
                  </div>
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.5 }}>God belysning giver bedre resultat — undgå skygger</div>
                  </div>
                </div>

                <label style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                  width:"100%", padding:"16px", borderRadius:14, cursor:"pointer",
                  background:"var(--green)", border:"none", color:"#fff",
                  fontSize:15, fontWeight:800, boxShadow:"0 4px 16px rgba(34,197,94,.3)",
                  marginBottom:10,
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Fotografér ingredienslisten
                  <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handleImageCapture} />
                </label>
                <label style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  width:"100%", padding:"13px", borderRadius:12, cursor:"pointer",
                  background:"#fff", border:"1.5px solid var(--border2)", color:"var(--ink2)",
                  fontSize:13, fontWeight:600, marginBottom:10,
                }}>
                  📁 Vælg fra galleri
                  <input type="file" accept="image/*" style={{ display:"none" }} onChange={handleImageCapture} />
                </label>
                {scanError && <div className="error-box" style={{ marginBottom:10 }}>⚠️ {scanError}</div>}
                <button style={{ width:"100%", background:"none", border:"none", cursor:"pointer", fontSize:12, color:"var(--muted)", padding:"8px 0", fontFamily:"var(--f)" }}
                  onClick={() => { setProposedFlags({}); setNotFoundStep(3); }}>
                  Spring ingredienser over →
                </button>
              </div>
            )}

            {/* ── TRIN 3: Bekræft og send ── */}
            {notFoundStep === 3 && !ocrLoading && (
              <div className="fade-in">
                {/* Produktkort */}
                <div style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", marginBottom:12, boxShadow:"var(--sh)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                    {productImagePreview
                      ? <img src={productImagePreview} alt="Produkt" style={{ width:60, height:60, objectFit:"contain", borderRadius:10, border:"1px solid var(--border)", flexShrink:0 }} />
                      : <div style={{ width:60, height:60, borderRadius:10, background:"var(--paper2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>📦</div>
                    }
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:11, color:"var(--muted)", fontWeight:600, marginBottom:4 }}>Produktnavn</div>
                      <input
                        value={proposedName}
                        onChange={e => setProposedName(e.target.value)}
                        placeholder="Skriv produktnavn…"
                        className="field"
                        style={{ padding:"8px 12px", fontSize:14 }}
                      />
                    </div>
                  </div>
                  {/* Ændre billede */}
                  <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"var(--muted)", cursor:"pointer" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    Skift forsidebillede
                    <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handleProductImageCapture} />
                  </label>
                </div>

                {/* ── Ingrediensliste editor ── */}
                <div style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)" }}>Ingredienser</div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      {ocrText && <div style={{ fontSize:11, color:"var(--green)", fontWeight:700 }}>✓ {ingItems.length} fundet</div>}
                      <label style={{ fontSize:11, color:"var(--muted)", cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        {ocrText ? "Nyt billede" : "Tag billede"}
                        <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e => {
                          if (!e.target.files[0]) return;
                          handleImageCapture(e);
                          // Parse OCR result when it arrives (via ocrText update)
                        }} />
                      </label>
                    </div>
                  </div>

                  {!ocrText && ingItems.length === 0 && (
                    <div style={{ fontSize:12, color:"var(--amber)", fontWeight:600, padding:"8px 10px", background:"var(--amber-lt)", borderRadius:8, marginBottom:10 }}>
                      ⚠ Ingen ingredienser endnu — tag et billede eller skriv dem herunder
                    </div>
                  )}

                  {/* Liste af ingredienser som redigerbare chips */}
                  {ingItems.length > 0 && (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                      {ingItems.map((item, i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px",
                          background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:20 }}>
                          <span style={{ fontSize:12, color:"var(--ink)" }}>{item}</span>
                          <div onClick={() => setIngItems(p => p.filter((_,j)=>j!==i))}
                            style={{ cursor:"pointer", color:"var(--muted)", fontSize:14, lineHeight:1, marginLeft:2 }}>×</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tilføj ingrediens */}
                  <div style={{ display:"flex", gap:8 }}>
                    <input className="field" placeholder="Tilføj ingrediens…" value={ingInput}
                      onChange={e => setIngInput(e.target.value)}
                      onKeyDown={e => e.key==="Enter" && addIngItem()}
                      style={{ flex:1, fontSize:12 }} />
                    <button className="btn btn-outline btn-sm" onClick={addIngItem}
                      style={{ flexShrink:0 }}>+</button>
                  </div>
                  {ingItems.length > 0 && (
                    <div style={{ fontSize:10, color:"var(--muted)", marginTop:8, lineHeight:1.5 }}>
                      Tryk × for at fjerne en ingrediens. Rå tekst: <span style={{ fontFamily:"monospace" }}>{ingToText(ingItems).slice(0,80)}{ingToText(ingItems).length>80?"…":""}</span>
                    </div>
                  )}
                </div>

                {/* Detekterede allergener — toggle */}
                <div style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", marginBottom:12, boxShadow:"var(--sh)" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)" }}>Allergener</div>
                    <div style={{ fontSize:11, color:"var(--muted)" }}>Tryk for at til/fra</div>
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                    {ALLERGENS.filter(a => !["svovl","lupin","bloeddyr"].includes(a.id)).map(a => {
                      const val = proposedFlags?.[a.id];
                      const isOn = val === "yes" || val === true;
                      const isTrace = val === "traces";
                      return (
                        <div key={a.id}
                          onClick={() => {
                            setProposedFlags(prev => {
                              const cur = prev?.[a.id];
                              // Cycler: off → yes → traces → off
                              const next = !cur || cur === false ? "yes"
                                : cur === "yes" ? "traces"
                                : false;
                              return { ...prev, [a.id]: next };
                            });
                          }}
                          style={{
                            display:"flex", alignItems:"center", gap:5,
                            padding:"6px 11px", borderRadius:100, cursor:"pointer",
                            border:`1.5px solid ${isOn ? "var(--red-md)" : isTrace ? "var(--amber-md)" : "var(--border2)"}`,
                            background: isOn ? "var(--red-lt)" : isTrace ? "var(--amber-lt)" : "var(--paper2)",
                            transition:"all .15s",
                          }}>
                          <span style={{ fontSize:14 }}>{a.emoji}</span>
                          <span style={{ fontSize:11, fontWeight:700, color: isOn ? "var(--red)" : isTrace ? "var(--amber)" : "var(--muted2)" }}>
                            {a.label}
                          </span>
                          {isOn && <span style={{ fontSize:9, fontWeight:800, color:"var(--red)", background:"var(--red-lt)", padding:"1px 5px", borderRadius:4 }}>JA</span>}
                          {isTrace && <span style={{ fontSize:9, fontWeight:800, color:"var(--amber)", background:"var(--amber-lt)", padding:"1px 5px", borderRadius:4 }}>SPOR</span>}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize:10, color:"var(--muted)", marginTop:10, lineHeight:1.5 }}>
                    Ét tryk = indeholder · To tryk = spor · Tre tryk = fjern
                  </div>
                </div>

                {/* Info */}
                <div style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"10px 12px", background:"var(--paper2)", borderRadius:10, marginBottom:14 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}>
                    <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 16v-4M12 8h.01"/>
                  </svg>
                  <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.5 }}>
                    Dit bidrag gennemgås af EatSafe-teamet inden publicering. Tak fordi du hjælper!
                  </div>
                </div>

                {scanError && <div className="error-box" style={{ marginBottom:10 }}>⚠️ {scanError}</div>}

                <button
                  onClick={() => {
                    // Sync ingItems back to ocrText before submitting
                    if (ingItems.length > 0) setOcrText(ingToText(ingItems));
                    submitProduct();
                  }}
                  disabled={submitting || !proposedName.trim()}
                  style={{ width:"100%", background: proposedName.trim() ? "var(--ink)" : "var(--border2)", color:"#fff", border:"none",
                    borderRadius:12, padding:"15px", fontFamily:"var(--f)", fontSize:15,
                    fontWeight:800, cursor: proposedName.trim() ? "pointer" : "not-allowed", marginBottom:8,
                    opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? "Sender…" : "Send produkt ind ✓"}
                </button>
                <button className="btn btn-ghost btn-full" onClick={() => setNotFoundStep(2)}>← Tilbage</button>
              </div>
            )}

          </div>
        )}

        {screen === SCREENS.SUBMITTED && (
          <div className="screen fade-in">
            <div className="card" style={{ textAlign:"center", padding:"40px 24px", marginTop:32 }}>
              <div style={{ marginBottom:16 }}><Icon name="check" size={56} color="var(--green)" /></div>
              <div style={{ fontSize:22, fontWeight:900, color:"var(--text)", marginBottom:8 }}>Tak for dit bidrag!</div>
              <div style={{ fontSize:14, color:"var(--muted)", lineHeight:1.7, marginBottom:20 }}>
                Din indsendelse er modtaget og afventer godkendelse af vores team. Når produktet er godkendt, vil det være tilgængeligt for alle brugere.
              </div>
              <div className="info-box" style={{ textAlign:"left" }}>ℹ️ Midlertidigt allergenresultat er baseret på OCR-analysen og er ikke verificeret endnu.</div>
              {proposedFlags && (
                <div style={{ textAlign:"left", marginBottom:16 }}>
                  <div className="card-lbl">Analyserede allergener</div>
                  <div className="tags">
                    {Object.entries(proposedFlags).filter(([,v]) => v==="yes"||v==="traces").map(([k,v]) => {
                      const a = ALLERGENS.find(x=>x.id===k);
                      return a ? <div key={k} className="tag">{a.emoji} {a.label}</div> : null;
                    })}
                    {Object.entries(proposedFlags).filter(([,v]) => v==="yes"||v==="traces").length===0 && <div style={{fontSize:13,color:"var(--muted)"}}>Ingen allergener detekteret</div>}
                  </div>
                </div>
              )}
            </div>
            <button className="btn btn-primary btn-full" onClick={() => { setOcrText(""); setProposedFlags(null); setScreen(SCREENS.HOME); }}>← Tilbage til hjem</button>
          </div>
        )}

        {screen === SCREENS.SEARCH && (
          <div className="screen fade-in">
            <div className="screen-title">Søg varer</div>

            {/* Profil-bar — samme som hjem */}
            <div style={{ marginBottom:12 }}>
              <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                {(() => {
                  const allIds = ["user", ...family.map(m => m.id)];
                  const allActive = allIds.every(id => activeProfiles.includes(id));
                  return (
                    <>
                      <button onClick={() => setActiveProfiles(allIds)}
                        style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20,
                          border:"1.5px solid var(--green)",
                          background: allActive ? "var(--green)" : "var(--green-lt)",
                          color: allActive ? "#fff" : "var(--green)", cursor:"pointer", fontFamily:"var(--f)" }}>
                        Vælg alle
                      </button>
                      <button onClick={() => setActiveProfiles([])}
                        style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20,
                          border:"1.5px solid var(--border)",
                          background:"var(--paper2)", color:"var(--muted)", cursor:"pointer", fontFamily:"var(--f)" }}>
                        Fravælg alle
                      </button>
                    </>
                  );
                })()}
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                {[{id:"user", name: user.name, allergenCount: allergens.length}, ...family.map(m => ({id:m.id, name:m.name, allergenCount:(m.allergens||[]).length}))].map(p => {
                  const isActive = activeProfiles.includes(p.id);
                  return (
                    <div key={p.id} onClick={() => setProfilePopup(p.id)}
                      style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, cursor:"pointer" }}>
                      <div style={{ position:"relative" }}>
                        <div style={{ width:38, height:38, borderRadius:"50%",
                          background: isActive ? "var(--green)" : "var(--paper2)",
                          color: isActive ? "#fff" : "var(--muted)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:13, fontWeight:800,
                          border: `2px solid ${isActive ? "var(--green)" : "var(--border)"}`,
                          boxShadow: isActive ? "0 0 0 2px var(--green-lt)" : "none",
                          transition:"all .2s" }}>
                          {initials(p.name || "?")}
                        </div>
                        {p.allergenCount > 0 && (
                          <div style={{ position:"absolute", bottom:-1, right:-1, width:14, height:14,
                            background:"var(--red)", borderRadius:"50%", border:"2px solid var(--paper)",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:8, color:"#fff", fontWeight:800 }}>
                            {p.allergenCount}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize:9, fontWeight:700, color: isActive ? "var(--green)" : "var(--muted2)",
                        maxWidth:40, textAlign:"center", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {p.name?.split(" ")[0] || "Mig"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:10 }}>
              <input
                className="field"
                placeholder="Søg på produkt eller mærke…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { setSearchResults([]); }}}
                style={{ flex:1, marginBottom:0 }}
                autoFocus
              />
              <button
                className="btn btn-primary btn-sm"
                style={{ whiteSpace:"nowrap", padding:"0 16px" }}
                onClick={() => { setSearchResults([]); }}
                disabled={!searchQuery.trim()}
              >
                Søg
              </button>
            </div>
            {/* Kategori filter */}
            <div style={{ marginBottom:10 }}>
              <CategorySelect
                value={searchCategory}
                onChange={setSearchCategory}
                options={[
                  {id:"alle",          label:"Alle kategorier"},
                  {id:"Drikkevarer",   label:"Drikkevarer"},
                  {id:"Kolonial",      label:"Kolonial"},
                  {id:"Snacks & slik", label:"Snacks & slik"},
                  {id:"Mejeri & æg",   label:"Mejeri & æg"},
                  {id:"Frugt & grønt", label:"Frugt & grønt"},
                  {id:"Frost",         label:"Frost"},
                  {id:"Brød & bagværk",label:"Brød & bagværk"},
                  {id:"Kød & fisk",    label:"Kød & fisk"},
                  {id:"Færdigretter",  label:"Færdigretter"},
                ]}
              />
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <div className={`filter-chip${showSafeOnly?" active":""}`} onClick={() => setShowSafeOnly(v => !v)}>
                {showSafeOnly ? "Kun sikre" : "Vis kun sikre"}
              </div>
              <div style={{ fontSize:12, color:"var(--muted)" }}>{searchResults.length} resultat{searchResults.length!==1?"er":""}</div>
            </div>
            {searchLoading && <div className="loader fade-in"><div className="spinner" /><div className="loader-txt">Søger…</div></div>}
            {searchLoading && searchResults.length===0 && (
              <div className="loader fade-in"><div className="spinner" /><div className="loader-txt">Søger…</div></div>
            )}
            {false && (
              <div style={{ fontSize:12, color:"var(--muted)", textAlign:"center", padding:"8px", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <div className="spinner" style={{ width:14, height:14, borderWidth:2 }} />
                Søger i Open Food Facts…
              </div>
            )}
            {!searchLoading && searchQuery && searchResults.length===0 && (
              <div className="empty-state"><div className="empty-txt">Ingen resultater</div><div className="empty-sub">Prøv et andet søgeord</div></div>
            )}
            {!searchQuery && (
              <div className="empty-state"><div className="empty-txt">Søg efter et produkt</div><div className="empty-sub">Skriv et produktnavn eller mærke</div></div>
            )}
            {searchResults.filter(p => {
              if (showSafeOnly && p.conflicts?.length > 0) return false;
              if (searchCategory !== "alle" && p.category !== searchCategory) return false;
              return true;
            }).map(p => {
              const { status, matchedDanger, matchedWarning, hasUnknown } = compareAllergens(p.allergen_flags||{}, activeIds);
              const statusColor = status==="safe" ? "var(--green)" : status==="danger" ? "var(--red)" : "var(--amber)";
              const statusLabel = status==="safe" ? "Sikker" : status==="danger" ? "Farlig" : "Advarsel";
              return (
                <div key={p.id} style={{ display:"flex", alignItems:"center", gap:10,
                  padding:"10px 0", borderBottom:"1px solid var(--border)", cursor:"pointer" }}
                  onClick={() => lookupProduct(p.ean||p.id)}>
                  <ProductImage product={p} size={44} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>{p.name}</div>
                    <div style={{ fontSize:11, color:"var(--muted)" }}>{p.brand}{p.category ? ` · ${p.category}` : ""}</div>
                    {p.tags && p.tags.length > 0 && (
                      <div style={{ display:"flex", gap:4, marginTop:3, flexWrap:"wrap" }}>
                        {p.tags.map((t,i) => {
                          const tagLabels = { vegan:"🌱 Vegansk", vegetarian:"🥦 Vegetarisk" };
                          return <span key={i} style={{ fontSize:10, fontWeight:700, color:"var(--green)", background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:100, padding:"1px 7px" }}>{tagLabels[t]||t}</span>;
                        })}
                      </div>
                    )}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:statusColor }}>{statusLabel}</div>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize:11, padding:"3px 8px" }}
                      onClick={e => { e.stopPropagation(); addToList(p.name); }}>+ Liste</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {screen === SCREENS.LIST && (
          <div className="screen fade-in">
            <div className="screen-title">Indkøbsliste</div>



            {/* Favoritter */}
            {favorites.length > 0 && (
              <div className="card" style={{ marginBottom:12 }}>
                <div className="card-lbl" style={{ marginBottom:10 }}>Dine favoritter</div>
                {favorites.slice(0,10).map(p => {
                  const { status } = compareAllergens(p.allergen_flags||{}, activeIds);
                  const statusColor = status==="safe" ? "var(--green)" : status==="danger" ? "var(--red)" : "var(--amber)";
                  const statusLabel = status==="safe" ? "Sikker" : status==="danger" ? "Farlig" : "Advarsel";
                  return (
                    <div key={p.ean||p.id} style={{ display:"flex", alignItems:"center", gap:10,
                      padding:"10px 0", borderBottom:"1px solid var(--border)", cursor:"pointer" }}
                      onClick={() => lookupProduct(p.ean||p.code||p.id)}>
                      <ProductImage product={p} size={44} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>{p.name}</div>
                        <div style={{ fontSize:11, color:"var(--muted)" }}>{p.brand}</div>
                        {p.tags && p.tags.length > 0 && (
                          <div style={{ display:"flex", gap:4, marginTop:3, flexWrap:"wrap" }}>
                            {p.tags.map((t,i) => {
                              const tagLabels = { vegan:"🌱 Vegansk", vegetarian:"🥦 Vegetarisk" };
                              return <span key={i} style={{ fontSize:10, fontWeight:700, color:"var(--green)", background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:100, padding:"1px 7px" }}>{tagLabels[t]||t}</span>;
                            })}
                          </div>
                        )}
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:statusColor }}>{statusLabel}</div>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize:11, padding:"3px 8px" }}
                          onClick={e => { e.stopPropagation(); addToList(p.name); }}>
                          + Liste
                        </button>
                      </div>
                    </div>
                  );
                })}
                {favorites.length > 10 && (
                  <div style={{ fontSize:12, color:"var(--muted)", textAlign:"center", paddingTop:8, cursor:"pointer" }}
                    onClick={() => setScreen(SCREENS.FAVORITES)}>
                    Se alle {favorites.length} favoritter →
                  </div>
                )}
              </div>
            )}

            <div className="share-bar">
              <span style={{ fontSize:18 }}></span>
              <span className="share-txt">Del listen med familie via link</span>
              <button className="btn btn-ghost btn-sm" style={{ fontSize:12 }} onClick={() => { navigator.clipboard?.writeText(window.location.href); alert("Link kopieret! 📋"); }}>Kopiér</button>
            </div>
            <div className="card" style={{ padding:"13px 14px", marginBottom:14 }}>
              <div className="card-lbl">Tilføj vare</div>
              <div className="input-row">
                <input className="field" placeholder="Fx. Glutenfri pasta…" value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyDown={e => e.key==="Enter" && addToList(newItemName)} />
                <button className="btn btn-primary btn-sm" style={{ whiteSpace:"nowrap" }} onClick={() => addToList(newItemName)}>Tilføj</button>
              </div>
            </div>
            {shoppingList.length===0 && <div className="empty-state"><div className="empty-txt">Listen er tom</div><div className="empty-sub">Tilføj din første vare</div></div>}
            {shoppingList.filter(i => !i.checked).length>0 && (
              <><div className="list-section">Mangler ({shoppingList.filter(i=>!i.checked).length})</div>
              {shoppingList.filter(i => !i.checked).map(item => (
                <div key={item.id} className="list-item">
                  <div className="list-check" onClick={() => toggleItem(item.id)} />
                  <div className="list-name">{item.name}</div>
                  <div className="list-del" onClick={() => removeItem(item.id)}><Icon name="trash" size={16} color="var(--muted)" /></div>
                </div>
              ))}</>
            )}
            {shoppingList.filter(i => i.checked).length>0 && (
              <><div className="list-section" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span>Købt ({shoppingList.filter(i=>i.checked).length})</span>
                <span style={{ cursor:"pointer", color:"var(--red)", fontWeight:700, fontSize:12 }} onClick={clearDone}>Ryd</span>
              </div>
              {shoppingList.filter(i => i.checked).map(item => (
                <div key={item.id} className="list-item done">
                  <div className="list-check checked" onClick={() => toggleItem(item.id)}>✓</div>
                  <div className="list-name done">{item.name}</div>
                  <div className="list-del" onClick={() => removeItem(item.id)}><Icon name="trash" size={16} color="var(--muted)" /></div>
                </div>
              ))}</>
            )}
          </div>
        )}

        {screen === SCREENS.SUGGEST_EDIT && scanResult && (() => {

          const runOcr = async (file) => {
            setEditStep("scanning");
            try {
              const b64 = await new Promise((res, rej) => {
                const r = new FileReader();
                r.onload = () => res(r.result.split(",")[1]);
                r.onerror = rej;
                r.readAsDataURL(file);
              });
              // Brug Supabase OCR edge function
              const resp = await fetch(`${SUPABASE_URL}/functions/v1/ocr`, {
                method: "POST",
                headers: makeHeaders(accessToken),
                body: JSON.stringify({ image_base64: b64 }),
              });
              const data = await resp.json();
              if (data.success && data.text) {
                setEditIngText(data.text);
                setEditStep("review");
              } else {
                // OCR fejlede — lad brugeren skrive manuelt
                setEditStep("review");
              }
            } catch {
              setEditStep("review");
            }
          };

          const submit = async () => {
            setEditStep("sending");
            try {
              await apiCall(`${SUPABASE_URL}/rest/v1/product_submissions`, {
                method: "POST",
                headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
                body: JSON.stringify({
                  product_id: scanResult.id || null,
                  ean: scanResult.code || scanResult.ean,
                  product_name: scanResult.name,
                  brand: scanResult.brand,
                  ingredients: editType === "ingredients" ? editIngText : null,
                  notes: `Type: ${editType}. ${editNote}`.trim(),
                  submitted_by: userId,
                  status: "pending",
                  type: "edit",
                }),
              });
              setEditStep("done");
            } catch (e) {
              alert("Fejl: " + e.message);
              setEditStep("review");
            }
          };

          return (
            <div className="screen fade-in">

              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 0 14px" }}>
                <button onClick={() => setScreen(SCREENS.RESULT)}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2">
                    <path strokeLinecap="round" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)" }}>Hjælp os med at forbedre</div>
                  <div style={{ fontSize:12, color:"var(--muted)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{scanResult.name}</div>
                </div>
              </div>

              {/* Produkt-chip — vises på alle trin */}
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#fff", border:"1px solid var(--border)", borderRadius:12, marginBottom:16, boxShadow:"var(--sh)" }}>
                <ProductImage product={scanResult} size={40} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{scanResult.name}</div>
                  {scanResult.brand && <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>{scanResult.brand}</div>}
                  <div style={{ fontSize:10, color:"var(--muted)", marginTop:1, fontFamily:"monospace" }}>EAN: {scanResult.code}</div>
                </div>
              </div>

              {/* ── TRIN 1: Vælg hvad der mangler ── */}
              {editStep === "start" && (
                <div className="fade-in">
                  <div style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.6, marginBottom:16 }}>
                    Hvad mangler eller er forkert på dette produkt?
                  </div>
                  {[
                    { id:"ingredients", emoji:"🥦", title:"Ingrediensliste mangler", desc:"Fotografér bagsiden af pakken med ingredienserne" },
                    { id:"nutrition",   emoji:"📊", title:"Næringsindhold mangler",  desc:"Fotografér næringstabellen på pakken" },
                    { id:"image",       emoji:"📸", title:"Produktbilledet er forkert", desc:"Tag et nyt billede af produktets forside" },
                    { id:"other",       emoji:"✏️", title:"Andet er forkert",         desc:"Skriv hvad der skal rettes" },
                  ].map(opt => (
                    <div key={opt.id} onClick={() => { setEditType(opt.id); setEditStep(opt.id === "other" ? "review" : "guide"); }}
                      style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px",
                        background:"#fff", border:"1px solid var(--border)", borderRadius:14,
                        marginBottom:8, cursor:"pointer", boxShadow:"var(--sh)" }}>
                      <div style={{ fontSize:28, flexShrink:0 }}>{opt.emoji}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:"var(--ink)" }}>{opt.title}</div>
                        <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>{opt.desc}</div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
                        <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </div>
                  ))}
                </div>
              )}

              {/* ── TRIN 2: Guide til foto ── */}
              {editStep === "guide" && (
                <div className="fade-in">
                  {/* Visuel guide */}
                  <div style={{ background:"var(--ink)", borderRadius:16, padding:"20px", marginBottom:16, textAlign:"center" }}>
                    <div style={{ fontSize:48, marginBottom:10 }}>
                      {editType === "ingredients" ? "🥫" : editType === "nutrition" ? "📋" : "📦"}
                    </div>
                    <div style={{ fontSize:16, fontWeight:800, color:"#fff", marginBottom:8 }}>
                      {editType === "ingredients" ? "Fotografér ingredienslisten" :
                       editType === "nutrition" ? "Fotografér næringstabellen" :
                       "Fotografér produktets forside"}
                    </div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,.6)", lineHeight:1.7 }}>
                      {editType === "ingredients"
                        ? "Vend pakken om og find listen der starter med 'Ingredienser:'. Hold telefonen stille og sørg for god belysning."
                        : editType === "nutrition"
                        ? "Find tabellen med energi, fedt, protein osv. Hold telefonen parallelt med pakken for skarpest billede."
                        : "Hold produktet mod en lys baggrund. Sørg for at stregkoden og produktnavnet er synlige."}
                    </div>
                  </div>

                  {/* Tips */}
                  <div style={{ background:"var(--paper2)", borderRadius:12, padding:"14px 16px", marginBottom:16 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:8 }}>💡 Tips til et godt billede</div>
                    {["Hold telefonen vandret og i armslængde", "Sørg for god belysning — undgå skygger", "Hold billedet skarpt — vent til kameraet fokuserer"].map((tip, i) => (
                      <div key={i} style={{ display:"flex", gap:8, alignItems:"center", marginBottom: i < 2 ? 6 : 0 }}>
                        <div style={{ width:18, height:18, borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <div style={{ fontSize:12, color:"var(--muted2)" }}>{tip}</div>
                      </div>
                    ))}
                  </div>

                  {/* Foto-knap — stor og tydelig */}
                  <label style={{
                    display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                    width:"100%", padding:"16px", borderRadius:14, cursor:"pointer",
                    background:"var(--green)", border:"none", color:"#fff",
                    fontSize:16, fontWeight:800, boxShadow:"0 4px 16px rgba(34,197,94,.3)",
                    marginBottom:10,
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                      <path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    Tag billede med kamera
                    <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e => e.target.files[0] && runOcr(e.target.files[0])} />
                  </label>

                  <label style={{
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    width:"100%", padding:"13px", borderRadius:12, cursor:"pointer",
                    background:"#fff", border:"1.5px solid var(--border2)", color:"var(--ink2)",
                    fontSize:14, fontWeight:600, marginBottom:10,
                  }}>
                    📁 Vælg billede fra galleri
                    <input type="file" accept="image/*" style={{ display:"none" }} onChange={e => e.target.files[0] && runOcr(e.target.files[0])} />
                  </label>

                  <button className="btn btn-ghost btn-full btn-sm" onClick={() => { setEditStep("review"); }}>
                    Skriv manuelt i stedet
                  </button>
                </div>
              )}

              {/* ── TRIN 3: Scanner ── */}
              {editStep === "scanning" && (
                <div className="fade-in" style={{ textAlign:"center", padding:"60px 20px" }}>
                  <div style={{ width:64, height:64, border:"4px solid var(--border2)", borderTopColor:"var(--green)", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 20px" }} />
                  <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)", marginBottom:8 }}>Analyserer billede…</div>
                  <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6 }}>
                    Vores AI læser teksten fra dit billede.<br/>Det tager et par sekunder.
                  </div>
                </div>
              )}

              {/* ── TRIN 4: Gennemse og send ── */}
              {editStep === "review" && (
                <div className="fade-in">

                  {/* ── Ingrediensliste editor (samme som ny produkt) ── */}
                  {editType === "ingredients" && (
                    <div className="card" style={{ marginBottom:12 }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                        <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)" }}>Ingredienser</div>
                        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                          {ingItems.length > 0 && <div style={{ fontSize:11, color:"var(--green)", fontWeight:700 }}>✓ {ingItems.length} ingredienser</div>}
                          <label style={{ fontSize:11, color:"var(--muted)", cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                            {editIngText ? "Nyt billede" : "Tag billede"}
                            <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e => e.target.files[0] && runOcr(e.target.files[0])} />
                          </label>
                        </div>
                      </div>

                      {!editIngText && ingItems.length === 0 && (
                        <div style={{ fontSize:12, color:"var(--amber)", fontWeight:600, padding:"8px 10px", background:"var(--amber-lt)", borderRadius:8, marginBottom:10 }}>
                          ⚠ Fotografér ingredienslisten eller skriv dem herunder
                        </div>
                      )}

                      {/* Chips */}
                      {ingItems.length > 0 && (
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                          {ingItems.map((item, i) => (
                            <div key={i} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px",
                              background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:20 }}>
                              <span style={{ fontSize:12, color:"var(--ink)" }}>{item}</span>
                              <div onClick={() => setIngItems(p => p.filter((_,j)=>j!==i))}
                                style={{ cursor:"pointer", color:"var(--muted)", fontSize:14, lineHeight:1, marginLeft:2 }}>×</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ display:"flex", gap:8 }}>
                        <input className="field" placeholder="Tilføj ingrediens…" value={ingInput}
                          onChange={e => setIngInput(e.target.value)}
                          onKeyDown={e => e.key==="Enter" && addIngItem()}
                          style={{ flex:1, fontSize:12 }} />
                        <button className="btn btn-outline btn-sm" onClick={addIngItem}>+</button>
                      </div>
                    </div>
                  )}

                  {/* Næringsindhold — beholder textarea */}
                  {editType === "nutrition" && (
                    <div className="card" style={{ marginBottom:12 }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>Næringsindhold</div>
                        <label style={{ fontSize:11, color:"var(--muted)", cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                          Nyt billede
                          <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e => e.target.files[0] && runOcr(e.target.files[0])} />
                        </label>
                      </div>
                      <textarea
                        value={editIngText}
                        onChange={e => setEditIngText(e.target.value)}
                        rows={5}
                        placeholder="Fx. Energi: 250 kcal, Fedt: 5g, Kulhydrater: 30g..."
                        className="field"
                        style={{ resize:"vertical", fontFamily:"var(--f)", fontSize:13, lineHeight:1.6 }}
                      />
                    </div>
                  )}

                  {/* Produktbillede */}
                  {editType === "image" && (
                    <div className="card" style={{ marginBottom:12 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:8 }}>Nyt produktbillede</div>
                      {editProductImage && (
                        <img src={editProductImage} alt="Produkt"
                          style={{ width:"100%", maxHeight:180, objectFit:"contain", borderRadius:10, marginBottom:10 }} />
                      )}
                      <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", background:"var(--paper2)", border:"1.5px dashed var(--border2)", borderRadius:10, cursor:"pointer", fontSize:13, color:"var(--muted2)" }}>
                        {editProductImage ? "📸 Tag nyt billede" : "📸 Tag billede af produktet"}
                        <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handleEditProductCapture} />
                      </label>
                    </div>
                  )}

                  {/* Bemærkning */}
                  <div className="card" style={{ marginBottom:12 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:6 }}>Bemærkning (valgfrit)</div>
                    <textarea
                      value={editNote}
                      onChange={e => setEditNote(e.target.value)}
                      rows={2}
                      placeholder="Fx. Ny udgave af produktet, fejl i allergen-info..."
                      className="field"
                      style={{ resize:"none", fontFamily:"var(--f)", fontSize:13 }}
                    />
                  </div>

                  {/* Info */}
                  <div style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"10px 12px", background:"var(--paper2)", borderRadius:10, marginBottom:14 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}>
                      <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 16v-4M12 8h.01"/>
                    </svg>
                    <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.5 }}>
                      Dit forslag gennemgås af vores team inden det publiceres. Tak for din hjælp!
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (editType === "ingredients" && ingItems.length > 0) setEditIngText(ingToText(ingItems));
                      submit();
                    }}
                    disabled={editType === "ingredients" && !editIngText.trim() && ingItems.length === 0}
                    style={{ width:"100%", background:"var(--ink)", color:"#fff", border:"none",
                      borderRadius:12, padding:"15px", fontFamily:"var(--f)", fontSize:15,
                      fontWeight:800, cursor:"pointer", marginBottom:8,
                      opacity: (editType === "ingredients" && !editIngText.trim()) ? 0.4 : 1 }}>
                    Send forslag ✓
                  </button>
                  <button className="btn btn-ghost btn-full" onClick={() => setScreen(SCREENS.RESULT)}>Annuller</button>
                </div>
              )}

              {/* ── TRIN 5: Sender ── */}
              {editStep === "sending" && (
                <div className="fade-in" style={{ textAlign:"center", padding:"60px 20px" }}>
                  <div style={{ width:64, height:64, border:"4px solid var(--border2)", borderTopColor:"var(--green)", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 20px" }} />
                  <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)" }}>Sender…</div>
                </div>
              )}

              {/* ── TRIN 6: Tak! ── */}
              {editStep === "done" && (
                <div className="fade-in" style={{ textAlign:"center", padding:"48px 20px" }}>
                  <div style={{ width:72, height:72, borderRadius:"50%", background:"var(--green-lt)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5">
                      <path strokeLinecap="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <div style={{ fontSize:22, fontWeight:900, color:"var(--ink)", marginBottom:8 }}>Tak for din hjælp! 🙏</div>
                  <div style={{ fontSize:14, color:"var(--muted2)", lineHeight:1.7, marginBottom:28 }}>
                    Dit forslag er modtaget og vil blive gennemgået af vores team snarest.
                    Du hjælper andre med allergi med at spise trygt.
                  </div>
                  <button className="btn btn-primary btn-full" onClick={() => setScreen(SCREENS.RESULT)}>
                    Tilbage til produktet
                  </button>
                </div>
              )}

            </div>
          );
        })()}

    </>
  );
}
