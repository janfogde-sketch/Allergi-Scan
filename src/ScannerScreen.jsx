// @ts-nocheck
import React, { useState, useRef } from "react";
import { ALLERGENS, SCREENS, DEMO_CODES, DUMMY_PRODUCT, MOCK_PRODUCTS,
         ALLERGEN_EXAMPLES, E_NUMBERS, HOME_TIPS, DIETS, SUPABASE_URL, SUPABASE_ANON_KEY, uid } from "./constants.jsx";
import { compareAllergens, extractENumbers, compareENumbers, checkDietCompatibility, initials, getAllergenLabels, verifiedBadge, makeHeaders, apiCall, timeAgo } from "./helpers.js";
import { Icon, IngredientsList, ProfileBadges, getProductIcon, ProductImage } from "./SharedComponents.jsx";

import { CategorySelect } from "./MemberForm.jsx";

// ── Performance: Styles som konstanter (undgår nye objekter per render) ──────
const S = {
  none: { display:"none" },
  flex1: { flex:1 },
  flexMin: { flex:1, minWidth:0 },
  rel: { position:"relative" },
  mb8: { marginBottom:8 },
  mb10: { marginBottom:10 },
  mb12: { marginBottom:12 },
  mb16: { marginBottom:16 },
  center60: { textAlign:"center", padding:"60px 20px" },
  row: { display:"flex", alignItems:"center" },
  rowBetween: { display:"flex", alignItems:"center", justifyContent:"space-between" },
  rowBetweenMb10: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 },
  rowGap8: { display:"flex", gap:8 },
  rowGap6: { display:"flex", gap:6 },
  colCenter: { display:"flex", flexDirection:"column", alignItems:"center" },
  card: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", marginBottom:12 },
  cardMb10: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", marginBottom:10 },
  h17: { fontSize:17, fontWeight:800, color:"var(--ink)" },
  h17mb: { fontSize:17, fontWeight:800, color:"var(--ink)", marginBottom:8 },
  h13: { fontSize:13, fontWeight:800, color:"var(--ink)" },
  h13b: { fontSize:13, fontWeight:700, color:"var(--ink)" },
  h13bMb: { fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:8 },
  sub11: { fontSize:11, color:"var(--muted)" },
  sub11mt: { fontSize:11, color:"var(--muted)", marginTop:1 },
  sub11lh: { fontSize:11, color:"var(--muted)", lineHeight:1.5 },
  body12: { fontSize:12, color:"var(--muted2)", lineHeight:1.5 },
  body13: { fontSize:13, color:"var(--muted2)", lineHeight:1.5 },
  label: { fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 },
  spinner: { width:64, height:64, border:"4px solid var(--border2)", borderTopColor:"var(--green)", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 20px" },
  dot: { width:28, height:28, borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  opacity6: { opacity:.6 },
  linkBtn: { width:"100%", background:"none", border:"none", cursor:"pointer", fontSize:12, fontWeight:700, color:"var(--muted2)", fontFamily:"var(--f)" },
};


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
  proposedNutrition, setProposedNutrition,
  proposedNotes, setProposedNotes,
  ocrLoading, ocrText, setOcrText,
  nutritionOcrLoading, handleNutritionCapture,
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
  activeENumbers,
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
  scanZoom,
  buildLabel,
  lookupProduct,
  onBetaClick,
}) {
  // ── Ingrediensliste editor state (bruges i NOTFOUND trin 3 og SUGGEST_EDIT) ──
  const [ingItems, setIngItems] = React.useState([]);
  const [ingInput, setIngInput] = React.useState("");
  const [allergenFilterOpen, setAllergenFilterOpen] = React.useState(false);
  const [manualAllergens, setManualAllergens] = React.useState([]);

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
                    background:"#1a3012", borderRadius:20, padding:"20px 18px",
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
                      <div style={S.flex1}>
                        <div style={{ fontWeight:800, fontSize:16, color:"var(--ink)" }}>{pName}</div>
                        <div style={{ fontSize:12, color:"var(--muted)", marginTop:1 }}>
                          {isActive ? "✅ Aktiv i søgning" : "⬜ Ikke aktiv i søgning"}
                        </div>
                      </div>
                      <div onClick={() => setProfilePopup(null)} style={{ cursor:"pointer", padding:4, opacity:.5 }}>✕</div>
                    </div>

                    {/* Allergier */}
                    {pAllergens.length > 0 ? (
                      <div style={S.mb12}>
                        <div style={S.label}>Allergier / intolerancer</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                          {pAllergens.map(id => {
                            const a = ALLERGENS.find(x => x.id === id);
                            const isInt = false; // intolerance-suffiks fjernet
                            return (
                              <div key={id} style={{ padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:700,
                                background: isInt ? "var(--amber-lt)" : "var(--red-lt)",
                                color: isInt ? "var(--amber)" : "var(--red)",
                                border: `1px solid ${isInt ? "var(--amber)" : "var(--red)"}` }}>
                                {a?.label || id}
                              </div>
                            );
                          })}
                          {pCustom.map((c,i) => (
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
                      <div style={S.mb12}>
                        <div style={S.label}>Diæt</div>
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
                      <div style={S.mb12}>
                        <div style={S.label}>E-numre</div>
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
                        style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20, border:"1px solid var(--green)",
                          background: allActive ? "var(--green)" : "var(--green-lt)", color: allActive ? "#fff" : "var(--green)", cursor:"pointer", fontFamily:"var(--f)" }}>
                        Vælg alle
                      </button>
                      <button onClick={() => setActiveProfiles([])}
                        style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20, border:"1px solid var(--border)",
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
                      <div style={S.rel}>
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
                      <div style={S.rel}>
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
              background:"rgba(255,255,255,.04)", borderRadius:20, marginBottom:10,
              overflow:"hidden", position:"relative", border:"1px solid var(--border2)",
              boxShadow:"0 4px 20px rgba(0,0,0,.3)",
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
              <div id="qr-reader-gallery" style={S.none} />
              <input ref={galleryInputRef} type="file" accept="image/*" style={S.none}
                onChange={e => { if (e.target.files[0]) scanFromGallery(e.target.files[0]); e.target.value=""; }} />

              {/* Stop-knap når kamera er aktivt */}
              {cameraActive && (
                <div style={{ padding:"8px 14px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ fontSize:11, fontWeight:600 }}>
                    {scanZoom > 1.0
                      ? <span style={{ color:"var(--green)" }}>🔍 {scanZoom}× zoom</span>
                      : <span style={{ color:"rgba(255,255,255,.6)" }}>Hold stregkoden ind i rammen</span>}
                  </span>
                  <div style={S.rowGap6}>
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
                    <g fill="rgba(74,222,128,0.25)">
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
                    position:"absolute",
                    left:0, right:0,
                    height:3,
                    borderRadius:2,
                    background:"linear-gradient(90deg, transparent, #4ADE80, #86EFAC, #4ADE80, transparent)",
                    boxShadow:"0 0 8px #4ADE80, 0 0 16px rgba(74,222,128,.4)",
                    animation:"scanLaser 2s ease-in-out infinite",
                  }} />
                  <style>{`
                    @keyframes scanLaser {
                      0%, 100% { top: 8px; opacity: 0.5; }
                      50% { top: calc(100% - 8px); opacity: 1; }
                    }
                  `}</style>
                  {/* Hjørnemarkører */}
                  {[["0","0","top","left"],["0","0","top","right"],["0","0","bottom","left"],["0","0","bottom","right"]].map((_,i) => {
                    const pos = [{top:8,left:8},{top:8,right:8},{bottom:8,left:8},{bottom:8,right:8}][i];
                    const borders = [
                      {borderTop:"2px solid rgba(74,222,128,.7)",borderLeft:"2px solid rgba(74,222,128,.7)"},
                      {borderTop:"2px solid rgba(74,222,128,.7)",borderRight:"2px solid rgba(74,222,128,.7)"},
                      {borderBottom:"2px solid rgba(74,222,128,.7)",borderLeft:"2px solid rgba(74,222,128,.7)"},
                      {borderBottom:"2px solid rgba(74,222,128,.7)",borderRight:"2px solid rgba(74,222,128,.7)"},
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

            {/* Manuel EAN-input */}
            {!showManualEan && (
              <button onClick={() => setShowManualEan(true)}
                style={{ width:"100%", background:"none", border:"none", cursor:"pointer",
                  fontSize:12, color:"var(--muted)", fontFamily:"var(--f)", padding:"4px 0 12px",
                  textDecoration:"underline", textUnderlineOffset:3 }}>
                Indtast EAN-nummer manuelt
              </button>
            )}

            {showManualEan && (
              <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", marginBottom:12 }}>
                <div style={S.rowBetweenMb10}>
                  <div style={S.h13}>Indtast EAN-nummer</div>
                  <button onClick={() => setShowManualEan(false)}
                    style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"var(--muted)", lineHeight:1 }}>×</button>
                </div>
                <div style={S.rowGap8}>
                  <input
                    id="manual-ean-input"
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="fx 5712873099443"
                    autoFocus
                    className="field"
                    style={{ flex:1, fontSize:16, letterSpacing:1 }}
                    onKeyDown={e => {
                      if (e.key === "Enter" && e.target.value.trim().length >= 8) {
                        setShowManualEan(false);
                        lookupProduct(e.target.value.trim());
                      }
                    }}
                  />
                  <button
                    style={{ padding:"0 16px", borderRadius:10, background:"var(--green)", border:"none",
                      color:"#071510", fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"var(--f)", flexShrink:0 }}
                    onClick={() => {
                      const val = document.getElementById("manual-ean-input")?.value?.trim();
                      if (val && val.length >= 8) { setShowManualEan(false); lookupProduct(val); }
                    }}>
                    Søg
                  </button>
                </div>
                <div style={{ fontSize:10, color:"var(--muted)", marginTop:8 }}>
                  EAN-nummeret er stregkodens tal — typisk 8 eller 13 cifre.
                </div>
              </div>
            )}

            {/* Søg — fremhævet på forsiden */}
            <div className="card" style={{ padding:"12px 14px", cursor:"pointer", marginBottom:10,
              background:"rgba(255,255,255,.04)", border:"1px solid var(--border2)" }}
              onClick={() => setScreen(SCREENS.SEARCH)}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:40, height:40, background:"var(--surface2)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon name="search" size={20} color="var(--ink)" /></div>
                <div style={S.flex1}>
                  <div style={{ fontSize:13, fontWeight:700 }}>Søg produkter</div>
                  <div style={S.sub11mt}>Find varer der er sikre for dig</div>
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
                  <div style={S.flex1}>
                    <div style={{ fontSize:13, fontWeight:700 }}>Indkøbsliste</div>
                    <div style={S.sub11mt}>
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
                  <div style={S.flex1}>
                    <div style={{ fontSize:9, fontWeight:800, color:"var(--green)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:3 }}>Vidste du at</div>
                    <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:2 }}>{tip.title}</div>
                    <div style={S.sub11lh}>{tip.text}</div>
                  </div>
                  
                </div>
              );
            })()}

            {/* Version + Beta knap */}
            <div style={{ textAlign:"center", paddingTop:8, paddingBottom:12, display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
              <div style={{ fontSize:10, color:"var(--muted)", opacity:0.4 }}>v1.0.6 · beta</div>
              <button onClick={onBetaClick}
                style={{ display:"inline-flex", alignItems:"center", gap:6,
                  padding:"5px 14px", borderRadius:100,
                  background:"rgba(74,222,128,.1)",
                  border:"1px solid rgba(74,222,128,.25)",
                  fontFamily:"var(--f)", fontSize:11, fontWeight:700,
                  color:"var(--green)", cursor:"pointer",
                  letterSpacing:".3px" }}>
                🧪 Beta-information
              </button>
            </div>

          </div>
        )}

        {screen === SCREENS.RESULT && scanResult && (
          <div className="screen fade-in">

            {/* ── 1. SIKKERHED + DIÆT ── */}
            {(() => {
              const flags = scanResult.allergen_flags || {};
              const profiles = [
                { id:"me", name: user.name||"Dig", allergens, diets: user.diets || [], eNumbers: selectedENumbers || [] },
                ...family.filter(m => activeProfiles.includes(m.id)).map(m => ({
                  ...m, allergens: m.allergens || [], diets: m.diets || [], eNumbers: m.eNumbers || [],
                })),
              ];
              const tagLabels = { vegan:"Vegansk", vegetarian:"Vegetarisk", "palm-oil-free":"Uden palmeolie", "gluten-free":"Glutenfri", organic:"Økologisk" };
              const hasTags = scanResult.tags && scanResult.tags.length > 0;

              return (
                <div style={S.mb10}>
                  {/* 2 kolonner */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom: hasTags ? 8 : 0 }}>
                  {profiles.map((p, pi) => {
                    const danger = p.allergens.filter(a => flags[a] === "yes");
                    const warning = p.allergens.filter(a => flags[a] === "traces");
                    const statusColor = danger.length > 0 ? "var(--red)" : warning.length > 0 ? "var(--amber)" : "var(--green)";
                    const statusBg = danger.length > 0 ? "var(--red-lt)" : warning.length > 0 ? "var(--amber-lt)" : "var(--green-lt)";
                    const statusBorder = danger.length > 0 ? "var(--red-md)" : warning.length > 0 ? "var(--amber-md)" : "var(--green-mid)";
                    const statusIcon = danger.length > 0 ? "×" : warning.length > 0 ? "!" : "✓";
                    // Diæt-matching via allergen_flags + ingrediens-scanning
                    const dietResults = (p.diets || []).map(d => ({
                      id: d,
                      ...checkDietCompatibility(d, flags, scanResult.ingredients, scanResult.nutrition),
                    }));
                    const dietFails = dietResults.filter(r => r.ok === false);
                    const dietMatch = p.diets && p.diets.length > 0
                      ? dietFails.length === 0
                      : null; // null = ingen diæt registreret
                    const statusText = danger.length > 0
                      ? danger.map(id => ALLERGENS.find(a=>a.id===id)?.label).filter(Boolean).join(", ")
                      : warning.length > 0
                      ? "Spor: " + warning.map(id => ALLERGENS.find(a=>a.id===id)?.label).filter(Boolean).join(", ")
                      : dietMatch === false ? dietFails[0]?.reasons?.[0] || "Passer ikke til diæt"
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

                  {/* E-nummer advarsler */}
                  {scanResult.productENumbers && scanResult.productENumbers.length > 0 && activeENumbers && activeENumbers.length > 0 && (() => {
                    const { matched } = compareENumbers(scanResult.productENumbers, activeENumbers);
                    if (matched.length === 0) return null;
                    return (
                      <div style={{
                        padding:"8px 12px", marginBottom:6,
                        background:"var(--amber-lt)", border:"1px solid var(--amber-md)",
                        borderRadius:10,
                      }}>
                        <div style={{ fontSize:11, fontWeight:800, color:"var(--amber)", marginBottom:4 }}>
                          ⚠️ E-numre fundet som du overvåger
                        </div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                          {matched.map(e => (
                            <span key={e} style={{
                              fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:6,
                              background:"rgba(255,180,0,.15)", color:"var(--amber)",
                              border:"1px solid var(--amber-md)",
                            }}>
                              {e} {E_NUMBERS[e] ? "— " + E_NUMBERS[e].split("—")[0].trim() : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Diæt-detaljer */}
                  {(() => {
                    // Saml alle diæter fra aktive profiler
                    const allDiets = new Set();
                    profiles.forEach(p => (p.diets || []).forEach(d => allDiets.add(d)));
                    if (allDiets.size === 0) return null;
                    const results = [...allDiets].map(d => ({
                      id: d,
                      label: DIETS.find(x => x.id === d)?.label || d,
                      ...checkDietCompatibility(d, scanResult.allergen_flags, scanResult.ingredients, scanResult.nutrition),
                    }));
                    const fails = results.filter(r => r.ok === false);
                    const unknowns = results.filter(r => r.ok === null);
                    const passes = results.filter(r => r.ok === true);
                    if (fails.length === 0 && unknowns.length === 0 && passes.length === 0) return null;
                    return (
                      <div style={{
                        padding:"10px 12px", marginBottom:6,
                        background: fails.length > 0 ? "var(--amber-lt)" : "var(--green-lt)",
                        border: `1px solid ${fails.length > 0 ? "var(--amber-md)" : "var(--green-mid)"}`,
                        borderRadius:10,
                      }}>
                        <div style={{ fontSize:11, fontWeight:800, color: fails.length > 0 ? "var(--amber)" : "var(--green)", marginBottom:6 }}>
                          {fails.length > 0 ? "⚠️ Diæt-advarsler" : "✅ Kompatibel med dine diæter"}
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                          {fails.map(r => (
                            <div key={r.id} style={{ fontSize:11, color:"var(--amber)" }}>
                              <strong>{r.label}:</strong> {r.reasons[0]}
                              {r.confidence === "low" && <span style={S.opacity6}> (usikker)</span>}
                            </div>
                          ))}
                          {passes.map(r => (
                            <div key={r.id} style={{ fontSize:11, color:"var(--green)" }}>
                              ✓ {r.label}
                              {r.confidence === "low" && <span style={S.opacity6}> (usikker)</span>}
                            </div>
                          ))}
                          {unknowns.map(r => (
                            <div key={r.id} style={S.sub11}>
                              ? {r.label}: {r.reasons[0]}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Diæt-tags — sømløst under profilerne */}
                  {hasTags && (
                    <div style={{
                      display:"flex", gap:6, flexWrap:"wrap",
                      padding:"8px 14px",
                      background:"var(--surface)",
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
            {(() => {
              const vb = verifiedBadge(scanResult.verified_status, scanResult.source);
              return (
                <div className="product-hero">
                  {scanResult.image_url
                    ? <img loading="lazy" src={scanResult.image_url} alt={scanResult.name} className="product-hero-img" onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
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
                      <span style={{ display:"inline-flex", alignItems:"center", gap:4,
                        fontSize:10, fontWeight:700, padding:"2px 9px", borderRadius:20,
                        background:vb.bg, color:vb.color, border:`1px solid ${vb.dot}22` }}>
                        <span style={{ width:5, height:5, borderRadius:"50%", background:vb.dot, flexShrink:0, display:"inline-block" }} />
                        {vb.label}
                      </span>
                      {scanResult.verified_status === "pending" && (
                        <span style={{
                          display:"inline-flex", alignItems:"center", gap:4,
                          padding:"2px 9px", borderRadius:20,
                          background:"var(--amber-lt)", border:"1px solid rgba(251,191,36,.3)",
                          fontSize:10, fontWeight:700, color:"var(--amber)",
                        }}>
                          ⏳ Afventer godkendelse
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── 2b. HANDLINGSKNAPPER (under hero) ── */}
            <div style={{ display:"flex", gap:8, marginBottom:10 }}>
              <button className="btn btn-sm" style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                  background: isFavorite(scanResult.code) ? "var(--amber-lt)" : "var(--paper2)",
                  color: isFavorite(scanResult.code) ? "var(--amber)" : "var(--ink2)",
                  border:"1px solid var(--border)" }}
                onClick={() => toggleFavorite(scanResult)}>
                <Icon name="heart" size={15} color={isFavorite(scanResult.code) ? "var(--amber)" : "var(--muted)"} />
                {isFavorite(scanResult.code) ? "Fjern favorit" : "Favorit"}
              </button>
              <button className="btn btn-ghost btn-sm" style={S.flex1}
                onClick={() => { if(navigator.share) navigator.share({title:scanResult.name, text:scanResult.headline}); }}>
                <Icon name="share" size={15} color="var(--muted)" /> Del
              </button>
              <button className="btn btn-outline btn-sm" style={S.flex1}
                onClick={() => { setEditStep("start"); setEditIngText(scanResult?.ingredients || ""); setEditNote(""); setEditType(null); setScreen(SCREENS.SUGGEST_EDIT); }}>
                Ret data
              </button>
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
              <div className="card-lbl">Ingrediensliste</div>
              {scanResult.ingredients ? (
                <div>
                  <div style={{ padding:"10px", background:"var(--paper2)", borderRadius:8, marginBottom:8 }}>
                    <IngredientsList text={scanResult.ingredients} allergenFlags={scanResult.allergen_flags||{}} />
                  </div>
                  <div style={{ fontSize:10, color:"var(--muted)", padding:"6px 8px", background:"var(--paper2)", borderRadius:6, lineHeight:1.4 }}>
                    Fremhævet = allergen · Listen kan være på originalsprog — tjek altid selv
                  </div>
                </div>
              ) : (
                <div style={{ paddingTop:4 }}>
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
                  <div style={S.flex1}>
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
                  <div className="card-lbl">Næringsindhold pr. 100g</div>
                  <div style={{ display:"flex", flexDirection:"column" }}>
                    {rows.map(([label, value], i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom: i < rows.length-1 ? "1px solid var(--border)" : "none" }}>
                        <span style={{ fontSize:13, color: label.startsWith("—") ? "var(--muted)" : "var(--ink2)", paddingLeft: label.startsWith("—") ? 12 : 0 }}>{label}</span>
                        <span style={S.h13b}>{value}</span>
                      </div>
                    ))}
                  </div>
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
              <div style={S.flex1}>
                <div style={S.h17}>Nyt produkt</div>
                <div style={{ fontSize:12, color:"var(--muted)", marginTop:1, fontFamily:"monospace" }}>EAN: {notFoundEan}</div>
              </div>
              {/* Fremgangsindikator */}
              <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                {[1,2,3,4,5].map(s => (
                  <div key={s} style={{
                    width: notFoundStep === s ? 20 : 8,
                    height:8, borderRadius:4, transition:"all .3s",
                    background: s < notFoundStep ? "var(--green)" : s === notFoundStep ? "var(--green)" : "var(--border2)"
                  }} />
                ))}
              </div>
            </div>

            {/* ── TRIN 1: Fotografér forsiden ── */}
            {notFoundStep === 1 && !ocrLoading && (
              <div className="fade-in">
                <div style={{ background:"var(--surface2)", borderRadius:16, padding:"24px 20px", marginBottom:16, textAlign:"center", border:"1px solid var(--border)" }}>
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
                    { num:1, emoji:"📸", label:"Forside", desc:"Navn" },
                    { num:2, emoji:"🔍", label:"Ingredienser", desc:"Allergener" },
                    { num:3, emoji:"🥗", label:"Næring", desc:"Indhold" },
                    { num:4, emoji:"📝", label:"Andet", desc:"Noter" },
                    { num:5, emoji:"✓", label:"Send", desc:"Bekræft" },
                  ].map(s => (
                    <div key={s.num} style={{ flex:1, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 8px", textAlign:"center" }}>
                      <div style={{ fontSize:22, marginBottom:4 }}>{s.emoji}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)" }}>{s.label}</div>
                      <div style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>{s.desc}</div>
                    </div>
                  ))}
                </div>

                <div style={S.h13bMb}>
                  Trin 1 — Fotografér produktets forside
                </div>
                <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.6, marginBottom:16 }}>
                  Hold telefonen foran produktets forside. Vi bruger billedet til at hente produktnavnet automatisk.
                </div>

                <label style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                  width:"100%", padding:"16px", borderRadius:14, cursor:"pointer",
                  background:"var(--green)", border:"none", color:"#071510",
                  fontSize:15, fontWeight:800, boxShadow:"0 4px 16px rgba(31,39,51,.25)",
                  marginBottom:10,
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#071510" strokeWidth="2">
                    <path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Fotografér forsiden
                  <input type="file" accept="image/*" capture="environment" style={S.none} onChange={handleProductImageCapture} />
                </label>
                <label style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  width:"100%", padding:"13px", borderRadius:12, cursor:"pointer",
                  background:"var(--surface)", border:"1px solid var(--border2)", color:"var(--ink2)",
                  fontSize:13, fontWeight:600, marginBottom:10,
                }}>
                  📁 Vælg fra galleri
                  <input type="file" accept="image/*" style={S.none} onChange={handleProductImageCapture} />
                </label>
                <button style={{ width:"100%", background:"none", border:"none", cursor:"pointer", fontSize:12, color:"var(--muted)", padding:"8px 0", fontFamily:"var(--f)" }}
                  onClick={() => setNotFoundStep(2)}>
                  Spring forside over →
                </button>
              </div>
            )}

            {/* ── SCANNING-LOADER ── */}
            {(ocrLoading || nutritionOcrLoading) && (
              <div className="fade-in" style={S.center60}>
                <div style={S.spinner} />
                <div style={S.h17mb}>
                  {notFoundStep === 1 ? "Henter produktnavn…"
                    : notFoundStep === 3 ? "Læser næringsindhold…"
                    : "Analyserer ingredienser…"}
                </div>
                <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6, marginBottom:20 }}>
                  {notFoundStep === 1
                    ? "Vores AI læser produktnavnet fra billedet"
                    : notFoundStep === 3
                    ? "Vi udtrækker energi, fedt, kulhydrat og protein automatisk"
                    : "Vi finder allergener og ingredienser automatisk"
                  }
                </div>
                <div style={{ fontSize:11, color:"var(--muted)", opacity:0.7 }}>
                  Det tager typisk 5-10 sekunder ☕
                </div>
              </div>
            )}

            {/* ── TRIN 2: Fotografér ingredienslisten ── */}
            {notFoundStep === 2 && !ocrLoading && (
              <div className="fade-in">
                {/* Vis produktbillede + navn hvis hentet */}
                {productImagePreview && (
                  <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, marginBottom:14 }}>
                    <img loading="lazy" src={productImagePreview} alt="Produkt"
                      style={{ width:52, height:52, objectFit:"contain", borderRadius:8, border:"1px solid var(--border)", flexShrink:0 }} />
                    <div style={S.flex1}>
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

                <div style={S.h13bMb}>
                  Trin 2 — Fotografér ingredienslisten
                </div>

                {/* Visuel guide */}
                <div style={{ background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:12, padding:"14px", marginBottom:14 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:10 }}>Sådan finder du ingredienslisten:</div>
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:8 }}>
                    <div style={S.dot}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div style={S.body12}>Vend pakken om — ingredienslisten starter typisk med "Ingredienser:" eller "Indeholder:"</div>
                  </div>
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:8 }}>
                    <div style={S.dot}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div style={S.body12}>Hold telefonen stille og vent til teksten er skarp</div>
                  </div>
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <div style={S.dot}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div style={S.body12}>God belysning giver bedre resultat — undgå skygger</div>
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
                  <input type="file" accept="image/*" capture="environment" style={S.none} onChange={handleImageCapture} />
                </label>
                <label style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  width:"100%", padding:"13px", borderRadius:12, cursor:"pointer",
                  background:"var(--surface)", border:"1px solid var(--border2)", color:"var(--ink2)",
                  fontSize:13, fontWeight:600, marginBottom:10,
                }}>
                  📁 Vælg fra galleri
                  <input type="file" accept="image/*" style={S.none} onChange={handleImageCapture} />
                </label>
                {scanError && <div className="error-box" style={S.mb10}>⚠️ {scanError}</div>}
                {ocrText && (
                  <button className="btn btn-primary btn-full"
                    onClick={() => setNotFoundStep(3)}>
                    Fortsæt → Næringsindhold
                  </button>
                )}
                <button style={{ width:"100%", background:"none", border:"none", cursor:"pointer", fontSize:12, color:"var(--muted)", padding:"8px 0", fontFamily:"var(--f)" }}
                  onClick={() => { if (!ocrText) setProposedFlags({}); setNotFoundStep(3); }}>
                  {ocrText ? "Spring næring over →" : "Spring ingredienser over →"}
                </button>
              </div>
            )}

            {/* ── TRIN 3: Næringsindhold ── */}
            {notFoundStep === 3 && !ocrLoading && !nutritionOcrLoading && (
              <div className="fade-in">
                <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:4 }}>
                  Trin 3 — Næringsindhold (valgfrit)
                </div>
                <div style={{ fontSize:12, color:"var(--muted)", marginBottom:16, lineHeight:1.5 }}>
                  Fotografér eller skriv næringsdeklarationen. Alle felter er valgfri — udfyld det du kan se.
                </div>

                {/* Foto af næringsindhold */}
                <label style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                  width:"100%", padding:"16px", borderRadius:14, cursor:"pointer",
                  background:"var(--green)", border:"none", color:"#071510",
                  fontSize:15, fontWeight:800, marginBottom:8, boxShadow:"0 4px 16px rgba(74,222,128,.25)",
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#071510" strokeWidth="2">
                    <path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Fotografér næringsdeklarationen
                  <input type="file" accept="image/*" capture="environment" style={S.none}
                    onChange={handleNutritionCapture} />
                </label>
                <label style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  width:"100%", padding:"11px", borderRadius:12, cursor:"pointer",
                  background:"var(--surface)", border:"1px solid var(--border2)", color:"var(--ink2)",
                  fontSize:12, fontWeight:600, marginBottom:14,
                }}>
                  📁 Vælg fra galleri
                  <input type="file" accept="image/*" style={S.none}
                    onChange={handleNutritionCapture} />
                </label>
                {/* Vis hvis noget allerede er udfyldt */}
                {proposedNutrition && Object.values(proposedNutrition).some(v => v) && (
                  <div style={{ padding:"8px 12px", background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:10, marginBottom:10, fontSize:12, color:"var(--green)", fontWeight:700 }}>
                    ✓ Næringsindhold delvist udfyldt — tjek og ret felterne herunder
                  </div>
                )}

                {/* Manuel input */}
                <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"14px", marginBottom:14 }}>
                  <div style={{ fontSize:12, fontWeight:800, color:"var(--ink)", marginBottom:12 }}>Per 100g/ml</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 14px" }}>
                    {[
                      { key:"energy", label:"Energi (kJ/kcal)", placeholder:"fx 1560/373" },
                      { key:"fat", label:"Fedt (g)", placeholder:"fx 20,3" },
                      { key:"saturated", label:"- heraf mættet (g)", placeholder:"fx 12,1" },
                      { key:"carbs", label:"Kulhydrat (g)", placeholder:"fx 44,2" },
                      { key:"sugars", label:"- heraf sukker (g)", placeholder:"fx 38,5" },
                      { key:"protein", label:"Protein (g)", placeholder:"fx 5,4" },
                      { key:"salt", label:"Salt (g)", placeholder:"fx 0,12" },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <div style={{ fontSize:10, color:"var(--muted)", fontWeight:700, marginBottom:4 }}>{label}</div>
                        <input
                          className="field"
                          placeholder={placeholder}
                          value={proposedNutrition?.[key] || ""}
                          onChange={e => setProposedNutrition(prev => ({ ...prev, [key]: e.target.value }))}
                          style={{ padding:"8px 10px", fontSize:12 }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button className="btn btn-primary btn-full"
                  onClick={() => setNotFoundStep(4)}>
                  Fortsæt → Andet</button>
                <button style={{ width:"100%", background:"none", border:"none", cursor:"pointer", fontSize:12, color:"var(--muted)", padding:"10px 0", fontFamily:"var(--f)" }}
                  onClick={() => setNotFoundStep(4)}>
                  Spring næring over →</button>
              </div>
            )}

            {/* ── TRIN 4: Andet / noter ── */}
            {notFoundStep === 4 && !ocrLoading && (
              <div className="fade-in">
                <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:4 }}>
                  Trin 4 — Yderligere oplysninger (valgfrit)
                </div>
                <div style={{ fontSize:12, color:"var(--muted)", marginBottom:16, lineHeight:1.5 }}>
                  Tilføj ekstra information om produktet — fx opbevaringsinstruktioner, certifikater (Ø, Halal, Vegan) eller andet.
                </div>

                <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"14px", marginBottom:14 }}>
                  <div style={{ fontSize:12, fontWeight:800, color:"var(--ink)", marginBottom:8 }}>Mærkninger / certifikater</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
                    {["Ø Økologisk","Vegansk","Vegetarisk","Glutenfri","Laktosefri","Halal","Kosher","Fairtrade"].map(tag => {
                      const active = (proposedNotes || "").includes(tag);
                      return (
                        <div key={tag} onClick={() => {
                          setProposedNotes(prev => {
                            const tags = (prev||"").split(",").map(t=>t.trim()).filter(Boolean);
                            if (active) return tags.filter(t=>t!==tag).join(", ");
                            return [...tags, tag].join(", ");
                          });
                        }} style={{
                          padding:"6px 12px", borderRadius:100, cursor:"pointer", fontSize:12, fontWeight:700,
                          border:`1px solid ${active ? "var(--green)" : "var(--border2)"}`,
                          background: active ? "var(--green-lt)" : "var(--surface)",
                          color: active ? "var(--green)" : "var(--muted2)",
                        }}>{tag}</div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--ink)", marginBottom:6 }}>Fri tekst</div>
                  <textarea
                    className="field"
                    rows={3}
                    placeholder="Fx: 'Opbevares køligt', 'Vegansk certificeret', 'Sæsonvare'…"
                    value={proposedNotes || ""}
                    onChange={e => setProposedNotes(e.target.value)}
                    style={{ resize:"none", fontSize:12 }}
                  />
                </div>

                <button className="btn btn-primary btn-full"
                  onClick={() => setNotFoundStep(5)}>
                  Fortsæt → Gennemse og send</button>
                <button style={{ width:"100%", background:"none", border:"none", cursor:"pointer", fontSize:12, color:"var(--muted)", padding:"10px 0", fontFamily:"var(--f)" }}
                  onClick={() => setNotFoundStep(5)}>
                  Spring over →</button>
              </div>
            )}

            {notFoundStep === 5 && !ocrLoading && (
              <div className="fade-in">
                {/* Oversigt header */}
                <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:12 }}>
                  Trin 5 — Gennemse og send
                </div>

                {/* Produktkort */}
                <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", marginBottom:12 }}>
                  <div style={S.rowBetweenMb10}>
                    <div style={{ fontSize:12, fontWeight:800, color:"var(--ink)" }}>📸 Forside og navn</div>
                    <button onClick={() => setNotFoundStep(1)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:"var(--muted)", fontFamily:"var(--f)", padding:"2px 8px" }}>← Ret</button>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                    {productImagePreview
                      ? <img loading="lazy" src={productImagePreview} alt="Produkt" style={{ width:60, height:60, objectFit:"contain", borderRadius:10, border:"1px solid var(--border)", flexShrink:0 }} />
                      : <div style={{ width:60, height:60, borderRadius:10, background:"var(--paper2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>📦</div>
                    }
                    <div style={S.flex1}>
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
                    <input type="file" accept="image/*" capture="environment" style={S.none} onChange={handleProductImageCapture} />
                  </label>
                </div>

                {/* ── Ingrediensliste editor ── */}
                <div style={S.card}>
                  <div style={S.rowBetweenMb10}>
                    <div style={S.h13}>🔍 Ingredienser</div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      {ocrText && <div style={{ fontSize:11, color:"var(--green)", fontWeight:700 }}>✓ {ingItems.length} fundet</div>}
                      <label style={{ fontSize:11, color:"var(--muted)", cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        {ocrText ? "Nyt billede" : "Tag billede"}
                        <input type="file" accept="image/*" capture="environment" style={S.none} onChange={e => {
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
                  <div style={S.rowGap8}>
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
                  <button style={{ marginTop:8, fontSize:11, color:"var(--muted)", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--f)", padding:0 }}
                    onClick={() => setNotFoundStep(2)}>
                    ← Ret ingredienser
                  </button>
                </div>

                {/* Detekterede allergener — toggle */}
                <div style={S.card}>
                  <div style={S.rowBetweenMb10}>
                    <div style={S.h13}>⚠️ Allergener</div>
                    <div style={S.sub11}>Tryk for at til/fra</div>
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
                            border:`1px solid ${isOn ? "var(--red-md)" : isTrace ? "var(--amber-md)" : "var(--border2)"}`,
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

                {/* Næringsindhold opsummering */}
                {proposedNutrition && Object.values(proposedNutrition).some(v => v) && (
                  <div style={S.card}>
                    <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:10 }}>
                      Næringsindhold <span style={{ fontSize:10, color:"var(--muted)", fontWeight:400 }}>per 100g/ml</span>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 14px" }}>
                      {[
                        { key:"energy", label:"Energi" },
                        { key:"fat", label:"Fedt" },
                        { key:"saturated", label:"Mættet fedt" },
                        { key:"carbs", label:"Kulhydrat" },
                        { key:"sugars", label:"Sukker" },
                        { key:"protein", label:"Protein" },
                        { key:"salt", label:"Salt" },
                      ].filter(({ key }) => proposedNutrition[key]).map(({ key, label }) => (
                        <div key={key} style={{ display:"flex", justifyContent:"space-between", fontSize:11 }}>
                          <span style={{ color:"var(--muted)" }}>{label}</span>
                          <span style={{ color:"var(--ink)", fontWeight:700 }}>{proposedNutrition[key]}</span>
                        </div>
                      ))}
                    </div>
                    <button style={{ marginTop:10, fontSize:11, color:"var(--muted)", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--f)", padding:0 }}
                      onClick={() => setNotFoundStep(3)}>
                      ← Ret næringsindhold
                    </button>
                  </div>
                )}

                {/* Mærkninger/noter */}
                {proposedNotes && (
                  <div style={S.card}>
                    <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:6 }}>Mærkninger</div>
                    <div style={{ fontSize:12, color:"var(--ink2)", lineHeight:1.6 }}>{proposedNotes}</div>
                    <button style={{ marginTop:6, fontSize:11, color:"var(--muted)", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--f)", padding:0 }}
                      onClick={() => setNotFoundStep(4)}>
                      ← Ret mærkninger
                    </button>
                  </div>
                )}

                {/* Info */}
                <div style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"10px 12px", background:"var(--paper2)", borderRadius:10, marginBottom:14 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}>
                    <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 16v-4M12 8h.01"/>
                  </svg>
                  <div style={S.sub11lh}>
                    Dit bidrag gennemgås af EatSafe-teamet inden publicering. Tak fordi du hjælper!
                  </div>
                </div>

                {scanError && <div className="error-box" style={S.mb10}>⚠️ {scanError}</div>}

                <button
                  onClick={() => {
                    // Sync ingItems back to ocrText before submitting
                    if (ingItems.length > 0) setOcrText(ingToText(ingItems));
                    submitProduct();
                  }}
                  disabled={submitting || !proposedName.trim()}
                  style={{ width:"100%", background: proposedName.trim() ? "var(--green)" : "var(--border2)", color: proposedName.trim() ? "#071510" : "var(--muted)", border:"none",
                    borderRadius:12, padding:"15px", fontFamily:"var(--f)", fontSize:15,
                    fontWeight:800, cursor: proposedName.trim() ? "pointer" : "not-allowed", marginBottom:8,
                    opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? <><div style={{ width:16, height:16, border:"2px solid rgba(0,0,0,.2)", borderTopColor:"#071510", borderRadius:"50%", animation:"spin .7s linear infinite", display:"inline-block", marginRight:8 }} />Sender…</> : "Send produkt ind ✓"}
                </button>
                <button className="btn btn-ghost btn-full" onClick={() => setNotFoundStep(2)}>← Tilbage</button>
              </div>
            )}

          </div>
        )}

        {/* Fuld-skærm loading ved submit */}
        {submitting && (
          <div style={{ position:"fixed", inset:0, zIndex:9998, background:"rgba(0,0,0,.7)",
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
            <div style={{ width:48, height:48, border:"3px solid var(--border2)", borderTopColor:"var(--green)",
              borderRadius:"50%", animation:"spin .8s linear infinite" }} />
            <div style={{ fontSize:14, fontWeight:700, color:"var(--ink)" }}>Sender produkt…</div>
            <div style={{ fontSize:12, color:"var(--muted)" }}>Vent venligst</div>
          </div>
        )}

        {screen === SCREENS.SUBMITTED && (
          <div className="screen fade-in">
            <div className="card" style={{ textAlign:"center", padding:"40px 24px", marginTop:32 }}>
              <div style={S.mb16}><Icon name="check" size={56} color="var(--green)" /></div>
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

        {screen === SCREENS.SEARCH && (() => {
          // Aktive profiler og deres allergener
          const profiles = [
            { id:"user", name: user.name||"Mig", allergens, color:"var(--green)" },
            ...family.map(m => ({ id:m.id, name:m.name, allergens: Array.isArray(m.allergens) ? m.allergens : Object.keys(m.allergens||{}).filter(k=>m.allergens[k]), color:m.color||"var(--green)" })),
          ];
          const activeProfileObjs = profiles.filter(p => activeProfiles.includes(p.id));

          // Kombinerede aktive allergen-IDs (fra aktive profiler + manuelle)
          const effectiveIds = [...new Set([
            ...activeIds,
            ...manualAllergens,
          ])];

          // Filtrerede resultater
          const visibleResults = searchResults.filter(p => {
            if (searchCategory !== "alle" && p.category !== searchCategory) return false;
            // Når profil/allergener er aktive → vis KUN sikre (ingen farlige eller advarsler)
            // Når ingen filter → showSafeOnly bestemmer
            if (effectiveIds.length > 0) {
              const { status } = compareAllergens(p.allergen_flags||{}, effectiveIds);
              if (status !== "safe") return false;
            } else if (showSafeOnly) {
              const { status } = compareAllergens(p.allergen_flags||{}, effectiveIds);
              if (status !== "safe") return false;
            }
            return true;
          });

          return (
          <div className="screen fade-in" style={{ paddingBottom:120 }}>
            <div className="screen-title">Søg varer</div>

            {/* ── Søgefelt ── */}
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              <input
                className="field"
                placeholder="Søg på produkt eller mærke…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") setSearchResults([]); }}
                style={{ flex:1, marginBottom:0 }}
                autoFocus
              />
              <button className="btn btn-primary btn-sm"
                style={{ whiteSpace:"nowrap", padding:"0 16px" }}
                onClick={() => setSearchResults([])}
                disabled={!searchQuery.trim()}>
                Søg
              </button>
            </div>

            {/* ── Profil-filter ── */}
            <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"12px 14px", marginBottom:10 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:10 }}>
                Filtrér efter profil
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {profiles.map(p => {
                  const isActive = activeProfiles.includes(p.id);
                  const allergenLabels = p.allergens.map(id => ALLERGENS.find(a=>a.id===id)).filter(Boolean);
                  return (
                    <div key={p.id}
                      onClick={() => setActiveProfiles(prev =>
                        prev.includes(p.id) ? prev.filter(x=>x!==p.id) : [...prev, p.id]
                      )}
                      style={{ cursor:"pointer" }}>
                      {/* Avatar + navn */}
                      <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px 6px 6px",
                        borderRadius:100, border:`1.5px solid ${isActive ? "var(--green)" : "var(--border)"}`,
                        background: isActive ? "var(--green-lt)" : "var(--paper2)",
                        transition:"all .15s" }}>
                        <div style={{ width:24, height:24, borderRadius:"50%",
                          background: isActive ? "var(--green)" : "var(--muted)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:9, fontWeight:800, color:"#fff", flexShrink:0 }}>
                          {initials(p.name)}
                        </div>
                        <div>
                          <div style={{ fontSize:12, fontWeight:700, color: isActive ? "var(--green)" : "var(--ink)" }}>
                            {p.name?.split(" ")[0] || "Mig"}
                          </div>
                          {p.allergens.length > 0 ? (
                            <div style={{ fontSize:10, color: isActive ? "var(--green)" : "var(--muted)", marginTop:1 }}>
                              {allergenLabels.slice(0,3).map(a=>a.emoji).join("")}
                              {allergenLabels.length > 3 ? ` +${allergenLabels.length-3}` : ""}
                              {" "}{p.allergens.length} allergen{p.allergens.length!==1?"er":""}
                            </div>
                          ) : (
                            <div style={{ fontSize:10, color:"var(--muted)" }}>Ingen allergener</div>
                          )}
                        </div>
                        {isActive && (
                          <div style={{ width:14, height:14, borderRadius:"50%", background:"var(--green)",
                            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Aktive allergener forklaret */}
              {activeProfileObjs.length > 0 && effectiveIds.length > 0 && (
                <div style={{ marginTop:10, padding:"8px 10px", background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:10 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"var(--red)", marginBottom:4 }}>
                    Filtrerer på {effectiveIds.length} allergen{effectiveIds.length!==1?"er":""}
                    {activeProfileObjs.length > 0 && ` · ${activeProfileObjs.map(p=>p.name?.split(" ")[0]).join(", ")}`}
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                    {effectiveIds.map(id => {
                      const a = ALLERGENS.find(x=>x.id===id);
                      const fromManual = manualAllergens.includes(id);
                      return a ? (
                        <span key={id} style={{ fontSize:10, fontWeight:600, padding:"2px 7px",
                          borderRadius:100, background: fromManual ? "var(--amber-lt)" : "var(--red-lt)",
                          color: fromManual ? "var(--amber)" : "var(--red)",
                          border:`1px solid ${fromManual ? "var(--amber-md)" : "var(--red-md)"}` }}>
                          {a.emoji} {a.label}{fromManual ? " ✎" : ""}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              {activeProfiles.length === 0 && (
                <div style={{ marginTop:8, fontSize:11, color:"var(--muted)" }}>
                  Ingen profil valgt — viser alle produkter
                </div>
              )}
            </div>

            {/* ── Manuel allergen-filter ── */}
            <div style={{ marginBottom:10 }}>
              <div
                onClick={() => setAllergenFilterOpen(v=>!v)}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"10px 14px", background:"var(--surface)", border:"1px solid var(--border)",
                  borderRadius: allergenFilterOpen ? "12px 12px 0 0" : 12, cursor:"pointer" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>
                    Tilføj allergener manuelt
                  </span>
                  {manualAllergens.length > 0 && (
                    <div style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:100,
                      background:"var(--amber-lt)", color:"var(--amber)", border:"1px solid var(--amber-md)" }}>
                      {manualAllergens.length} valgt
                    </div>
                  )}
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"
                  style={{ transform: allergenFilterOpen ? "rotate(180deg)" : "none", transition:"transform .2s" }}>
                  <path strokeLinecap="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
              {allergenFilterOpen && (
                <div style={{ border:"1px solid var(--border)", borderTop:"none", borderRadius:"0 0 12px 12px",
                  background:"var(--surface)", padding:14 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                    {ALLERGENS.map(a => {
                      const on = manualAllergens.includes(a.id);
                      const inActive = activeIds.includes(a.id);
                      return (
                        <div key={a.id}
                          onClick={() => !inActive && setManualAllergens(prev =>
                            prev.includes(a.id) ? prev.filter(x=>x!==a.id) : [...prev, a.id]
                          )}
                          style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px",
                            borderRadius:10, cursor: inActive ? "default" : "pointer",
                            border:`1.5px solid ${on||inActive ? "var(--red)" : "var(--border)"}`,
                            background: inActive ? "var(--red-lt)" : on ? "var(--red-lt)" : "var(--paper2)",
                            opacity: inActive ? .6 : 1 }}>
                          <span style={{ fontSize:16 }}>{a.emoji}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:700, color: on||inActive ? "var(--red)" : "var(--ink)" }}>
                              {a.label}
                            </div>
                            {inActive && (
                              <div style={{ fontSize:9, color:"var(--muted)" }}>Fra profil</div>
                            )}
                          </div>
                          {(on || inActive) && (
                            <div style={{ width:14, height:14, borderRadius:"50%", background:"var(--red)",
                              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {manualAllergens.length > 0 && (
                    <button onClick={() => setManualAllergens([])}
                      style={{ marginTop:10, fontSize:11, fontWeight:600, color:"var(--muted)",
                        background:"none", border:"none", cursor:"pointer", fontFamily:"var(--f)" }}>
                      Ryd manuelle filter ×
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Kategori + sikker-filter ── */}
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, flexWrap:"wrap" }}>
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
              {/* Kun sikre vises kun når ingen profil-filter er aktiv */}
              {effectiveIds.length === 0 && (
                <div className={`filter-chip${showSafeOnly?" active":""}`}
                  onClick={() => setShowSafeOnly(v => !v)}
                  style={{ whiteSpace:"nowrap" }}>
                  {showSafeOnly ? "✓ Kun sikre" : "Kun sikre"}
                </div>
              )}
              <div style={{ fontSize:12, color:"var(--muted)", marginLeft:"auto" }}>
                {visibleResults.length} resultat{visibleResults.length!==1?"er":""}
              </div>
            </div>

            {/* ── Resultater ── */}
            {searchLoading && (
              <div className="loader fade-in"><div className="spinner" /><div className="loader-txt">Søger…</div></div>
            )}
            {!searchLoading && searchQuery && visibleResults.length===0 && (
              <div className="empty-state">
                <div className="empty-txt">Ingen resultater</div>
                <div className="empty-sub">
                  {showSafeOnly || effectiveIds.length > 0
                    ? "Prøv at fjerne filtre eller søg efter noget andet"
                    : "Prøv et andet søgeord"}
                </div>
              </div>
            )}
            {!searchQuery && (
              <div className="empty-state">
                <div className="empty-txt">Søg efter et produkt</div>
                <div className="empty-sub">Skriv et produktnavn eller mærke</div>
              </div>
            )}

            {visibleResults.map(p => {
              const { status, matchedDanger, matchedWarning } = compareAllergens(p.allergen_flags||{}, effectiveIds);
              const statusColor = status==="safe" ? "var(--green)" : status==="danger" ? "var(--red)" : "var(--amber)";
              const statusLabel = status==="safe" ? "✓ Sikker" : status==="danger" ? "✕ Farlig" : "⚠ Advarsel";
              const matchedLabels = [...matchedDanger, ...matchedWarning]
                .map(id => ALLERGENS.find(a=>a.id===id))
                .filter(Boolean);
              return (
                <div key={p.id}
                  onClick={() => lookupProduct(p.ean||p.id)}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px",
                    marginBottom:8, background:"var(--surface)", border:"1px solid var(--border)",
                    borderRadius:12, cursor:"pointer",
                    borderColor: status==="danger" ? "var(--red-md)" : status==="warn" ? "var(--amber-md)" : "var(--border)" }}>
                  <ProductImage product={p} size={44} />
                  <div style={S.flexMin}>
                    <div style={S.h13b}>{p.name}</div>
                    <div style={S.sub11}>{p.brand}{p.category ? ` · ${p.category}` : ""}</div>
                    {/* Viste allergener der matcher */}
                    {matchedLabels.length > 0 && (
                      <div style={{ display:"flex", gap:3, marginTop:4, flexWrap:"wrap" }}>
                        {matchedLabels.map(a => (
                          <span key={a.id} style={{ fontSize:10, fontWeight:700,
                            color: matchedDanger.includes(a.id) ? "var(--red)" : "var(--amber)",
                            background: matchedDanger.includes(a.id) ? "var(--red-lt)" : "var(--amber-lt)",
                            border:`1px solid ${matchedDanger.includes(a.id) ? "var(--red-md)" : "var(--amber-md)"}`,
                            borderRadius:100, padding:"1px 6px" }}>
                            {a.emoji} {a.label}
                          </span>
                        ))}
                      </div>
                    )}
                    {p.tags && p.tags.length > 0 && (
                      <div style={{ display:"flex", gap:3, marginTop:3, flexWrap:"wrap" }}>
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
          );
        })()}

        {screen === SCREENS.LIST && (
          <div className="screen fade-in">
            <div className="screen-title">Indkøbsliste</div>



            {/* Favoritter */}
            {favorites.length > 0 && (
              <div className="card" style={S.mb12}>
                <div className="card-lbl" style={S.mb10}>Dine favoritter</div>
                {favorites.slice(0,10).map(p => {
                  const { status } = compareAllergens(p.allergen_flags||{}, activeIds);
                  const statusColor = status==="safe" ? "var(--green)" : status==="danger" ? "var(--red)" : "var(--amber)";
                  const statusLabel = status==="safe" ? "Sikker" : status==="danger" ? "Farlig" : "Advarsel";
                  return (
                    <div key={p.ean||p.id} style={{ display:"flex", alignItems:"center", gap:10,
                      padding:"10px 0", borderBottom:"1px solid var(--border)", cursor:"pointer" }}
                      onClick={() => lookupProduct(p.ean||p.code||p.id)}>
                      <ProductImage product={p} size={44} />
                      <div style={S.flexMin}>
                        <div style={S.h13b}>{p.name}</div>
                        <div style={S.sub11}>{p.brand}</div>
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
                <div style={S.flexMin}>
                  <div style={S.h17}>Hjælp os med at forbedre</div>
                  <div style={{ fontSize:12, color:"var(--muted)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{scanResult.name}</div>
                </div>
              </div>

              {/* Produkt-chip — vises på alle trin */}
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, marginBottom:16 }}>
                <ProductImage product={scanResult} size={40} />
                <div style={S.flexMin}>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{scanResult.name}</div>
                  {scanResult.brand && <div style={S.sub11mt}>{scanResult.brand}</div>}
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
                        background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14,
                        marginBottom:8, cursor:"pointer" }}>
                      <div style={{ fontSize:28, flexShrink:0 }}>{opt.emoji}</div>
                      <div style={S.flex1}>
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
                  <div style={{ background:"var(--surface2)", borderRadius:16, padding:"20px", marginBottom:16, textAlign:"center", border:"1px solid var(--border)" }}>
                    <div style={{ fontSize:48, marginBottom:10 }}>
                      {editType === "ingredients" ? "🥫" : editType === "nutrition" ? "📋" : "📦"}
                    </div>
                    <div style={{ fontSize:16, fontWeight:800, color:"var(--ink)", marginBottom:8 }}>
                      {editType === "ingredients" ? "Fotografér ingredienslisten" :
                       editType === "nutrition" ? "Fotografér næringstabellen" :
                       "Fotografér produktets forside"}
                    </div>
                    <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.7 }}>
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
                    <input type="file" accept="image/*" capture="environment" style={S.none} onChange={e => e.target.files[0] && runOcr(e.target.files[0])} />
                  </label>

                  <label style={{
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    width:"100%", padding:"13px", borderRadius:12, cursor:"pointer",
                    background:"var(--surface)", border:"1px solid var(--border2)", color:"var(--ink2)",
                    fontSize:14, fontWeight:600, marginBottom:10,
                  }}>
                    📁 Vælg billede fra galleri
                    <input type="file" accept="image/*" style={S.none} onChange={e => e.target.files[0] && runOcr(e.target.files[0])} />
                  </label>

                  <button className="btn btn-ghost btn-full btn-sm" onClick={() => { setEditStep("review"); }}>
                    Skriv manuelt i stedet
                  </button>
                </div>
              )}

              {/* ── TRIN 3: Scanner ── */}
              {editStep === "scanning" && (
                <div className="fade-in" style={S.center60}>
                  <div style={S.spinner} />
                  <div style={S.h17mb}>Analyserer billede…</div>
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
                    <div className="card" style={S.mb12}>
                      <div style={S.rowBetweenMb10}>
                        <div style={S.h13}>Ingredienser</div>
                        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                          {ingItems.length > 0 && <div style={{ fontSize:11, color:"var(--green)", fontWeight:700 }}>✓ {ingItems.length} ingredienser</div>}
                          <label style={{ fontSize:11, color:"var(--muted)", cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                            {editIngText ? "Nyt billede" : "Tag billede"}
                            <input type="file" accept="image/*" capture="environment" style={S.none} onChange={e => e.target.files[0] && runOcr(e.target.files[0])} />
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

                      <div style={S.rowGap8}>
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
                    <div className="card" style={S.mb12}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                        <div style={S.h13b}>Næringsindhold</div>
                        <label style={{ fontSize:11, color:"var(--muted)", cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                          Nyt billede
                          <input type="file" accept="image/*" capture="environment" style={S.none} onChange={e => e.target.files[0] && runOcr(e.target.files[0])} />
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
                    <div className="card" style={S.mb12}>
                      <div style={S.h13bMb}>Nyt produktbillede</div>
                      {editProductImage && (
                        <img loading="lazy" src={editProductImage} alt="Produkt"
                          style={{ width:"100%", maxHeight:180, objectFit:"contain", borderRadius:10, marginBottom:10 }} />
                      )}
                      <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", background:"var(--paper2)", border:"1.5px dashed var(--border2)", borderRadius:10, cursor:"pointer", fontSize:13, color:"var(--muted2)" }}>
                        {editProductImage ? "📸 Tag nyt billede" : "📸 Tag billede af produktet"}
                        <input type="file" accept="image/*" capture="environment" style={S.none} onChange={handleEditProductCapture} />
                      </label>
                    </div>
                  )}

                  {/* Bemærkning */}
                  <div className="card" style={S.mb12}>
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
                    <div style={S.sub11lh}>
                      Dit forslag gennemgås af vores team inden det publiceres. Tak for din hjælp!
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (editType === "ingredients" && ingItems.length > 0) setEditIngText(ingToText(ingItems));
                      submit();
                    }}
                    disabled={editType === "ingredients" && !editIngText.trim() && ingItems.length === 0}
                    style={{ width:"100%", background:"var(--green)", color:"#071510", border:"none",
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
                <div className="fade-in" style={S.center60}>
                  <div style={S.spinner} />
                  <div style={S.h17}>Sender…</div>
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
