// @ts-nocheck
import React, { useState, useRef, Suspense } from "react";
import { ALLERGENS, SCREENS, DEMO_CODES, DUMMY_PRODUCT, MOCK_PRODUCTS,
         ALLERGEN_EXAMPLES, E_NUMBERS, HOME_TIPS, DIETS, SUPABASE_URL, SUPABASE_ANON_KEY, uid } from "./constants.jsx";
import { compareAllergens, extractENumbers, compareENumbers, checkDietCompatibility, initials, getAllergenLabels, verifiedBadge, makeHeaders, apiCall, timeAgo } from "./helpers.js";
import { Icon, IngredientsList, ProfileBadges, getProductIcon, ProductImage, LazyFallback } from "./SharedComponents.jsx";
import { DEMO_SLIDES } from "./demoSlides.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useHistoryContext } from "./HistoryContext.jsx";
import { useShoppingContext } from "./ShoppingContext.jsx";

import { CategorySelect } from "./MemberForm.jsx";
import NotFoundScreen from "./NotFoundScreen.jsx";
import SubmittedScreen from "./SubmittedScreen.jsx";
import ResultScreen from "./ResultScreen.jsx";
// Lazy: skærme brugeren ikke nødvendigvis besøger hver session, holdes ude af hoved-bundlet
const SearchScreen = React.lazy(() => import("./SearchScreen.jsx"));
const ListScreen = React.lazy(() => import("./ListScreen.jsx"));
const SuggestEditScreen = React.lazy(() => import("./SuggestEditScreen.jsx"));
const RestaurantGuideScreen = React.lazy(() => import("./RestaurantGuideScreen.jsx"));

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
  dot: { width:28, height:28, borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  opacity6: { opacity:.6 },
  linkBtn: { width:"100%", background:"none", border:"none", cursor:"pointer", fontSize:12, fontWeight:700, color:"var(--muted2)", fontFamily:"var(--f)" },
};


// ── App-guide: samme feature-demo som velkomstskærmen, men i en luk-bar modal ──
// Bruges kun her via mode="modal" (se knappen "App-guide" på hjemskærmen) —
// velkomstskærmens egen udgave af sliideren bor i OnboardingScreen.jsx.
function DemoSlider({ onClose }) {
  const [idx, setIdx] = React.useState(0);
  const slide = DEMO_SLIDES[idx];

  return (
    <div style={{ borderRadius:0, overflow:"hidden", border:"none" }}>

      {/* Modal-header med overskrift + luk */}
      <div style={{ background:"var(--paper)", borderBottom:"1px solid var(--border)", padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:13, fontWeight:800, color:"var(--green)", textTransform:"uppercase", letterSpacing:"1.5px" }}>Det kan EatSafe</div>
        <button onClick={onClose} aria-label="Luk"
          style={{ background:"rgba(255,255,255,.08)", border:"none", borderRadius:"50%",
            width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", fontSize:15, color:"var(--ink)", lineHeight:1 }}>
          ×
        </button>
      </div>

      <div style={{ background:slide.bg, padding:"20px 20px 18px", minHeight:260, transition:"background .4s", position:"relative" }}>

        {/* Dots */}
        <div style={{ display:"flex", gap:5, justifyContent:"center", marginBottom:16 }}>
          {DEMO_SLIDES.map((_,i) => (
            <div key={i} onClick={() => setIdx(i)}
              style={{ width: i===idx ? 22 : 7, height:7, borderRadius:4, background: i===idx ? slide.accent : "rgba(255,255,255,.2)", cursor:"pointer", transition:"all .25s" }} />
          ))}
        </div>

        {/* Indhold */}
        <div style={{ fontSize:19, fontWeight:900, color:"var(--ink)", marginBottom:6, letterSpacing:"-.3px" }}>{slide.title}</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,.6)", lineHeight:1.6 }}>{slide.sub}</div>
        {slide.mockup}

        {/* Sidste slide: luk guiden */}
        {slide.cta && (
          <div style={{ marginTop:20, display:"flex", flexDirection:"column", gap:10 }}>
            <button className="btn btn-primary btn-full" onClick={onClose}
              style={{ fontSize:14, fontWeight:800 }}>
              Luk guide ✓
            </button>
          </div>
        )}
      </div>

      {/* Frem/tilbage */}
      <div style={{ display:"flex", gap:8, padding:"12px 14px", background:"rgba(255,255,255,.03)", borderTop:"1px solid rgba(255,255,255,.08)" }}>
        <button disabled={idx===0} onClick={() => setIdx(i => i-1)}
          style={{ flex:1, padding:"10px", background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:10,
            fontFamily:"var(--f)", fontSize:13, fontWeight:700, color: idx===0 ? "var(--muted)" : "var(--ink2)",
            cursor: idx===0 ? "default" : "pointer", opacity: idx===0 ? 0.4 : 1 }}>
          ← Forrige
        </button>
        {idx < DEMO_SLIDES.length - 1 ? (
          <button onClick={() => setIdx(i => i+1)}
            style={{ flex:1, padding:"10px", background:"var(--green)", border:"none", borderRadius:10,
              fontFamily:"var(--f)", fontSize:13, fontWeight:800, color:"var(--on-green)", cursor:"pointer" }}>
            Næste →
          </button>
        ) : (
          <button onClick={onClose}
            style={{ flex:1, padding:"10px", background:"var(--green)", border:"none", borderRadius:10,
              fontFamily:"var(--f)", fontSize:13, fontWeight:800, color:"var(--on-green)", cursor:"pointer" }}>
            Luk guide ✓
          </button>
        )}
      </div>
    </div>
  );
}

export default function ScannerScreen({
  scanResult, notFoundEan,
  searchQuery, setSearchQuery,
  searchResults, setSearchResults,
  searchCategory, setSearchCategory,
  scanError,
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
  handleEditProductCapture,
  handleImageCapture, handleProductImageCapture,
  editProductImage,
  scanFromGallery,
  searchLoading,
  startCamera,
  stopCamera,
  toggleTorch,
  torchOn,
  scanZoom,
  showPhotoHint,
  photoScanLoading,
  photoFallbackRef,
  scanPhotoForEan,
  setKnowledgeSlug,
  buildLabel,
  lookupProduct,
  onBetaClick,
  alternatives,
  altLoading,
}) {
  const { user, userId, accessToken } = useAuthContext();
  const { family, activeProfiles, setActiveProfiles, allergens, customAllerg } = useProfileContext();
  const { screen, setScreen } = useNavigationContext();
  const { history, favorites, toggleFavorite, isFavorite } = useHistoryContext();
  const { shoppingList, newItemName, setNewItemName, addToList, toggleItem, removeItem, clearDone } = useShoppingContext();

  // Parser OCR-tekst til liste af ingredienser


  // ── Guide modal state ─────────────────────────────────────────────────────
  const [showGuide, setShowGuide] = React.useState(false);

  // ── Kombinerede allergen-IDs for alle aktive profiler ──────────────────────
  const activeIds = [
    ...(activeProfiles.includes("me") ? allergens : []),
    ...family
      .filter(m => activeProfiles.includes(m.id))
      .flatMap(m => Array.isArray(m.allergens) ? m.allergens : Object.keys(m.allergens||{}).filter(k => m.allergens[k])),
  ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

  const renderProfilePopup = () => {
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
          background:"var(--sheet)", borderRadius:20, padding:"20px 18px",
          boxShadow:"0 8px 40px rgba(0,0,0,.2)" }}
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <div style={{ width:44, height:44, borderRadius:"50%",
              background: isUser ? "var(--green)" : (member?.color || "var(--ink)"),
              color:"var(--ink)", display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:16, fontWeight:800, flexShrink:0 }}>
              {initials(pName)}
            </div>
            <div style={S.flex1}>
              <div style={{ fontWeight:800, fontSize:16, color:"var(--ink)" }}>{pName}</div>
              <div style={{ fontSize:12, color:"var(--muted)", marginTop:1 }}>
                {isActive ? "✅ Aktiv i søgning" : "⬜ Ikke aktiv i søgning"}
              </div>
            </div>
            <div onClick={() => setProfilePopup(null)} onKeyDown={e => e.key === "Enter" && setProfilePopup(null)}
              role="button" aria-label="Luk" tabIndex={0}
              style={{ cursor:"pointer", padding:10, margin:-6, opacity:.5 }}>×</div>
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
            color: isActive ? "var(--muted)" : "var(--ink)",
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
  };

  const renderStreakBadge = () => {
    // Mini streak-badge
    if (!history?.length) return null;
    const days = new Set(history.map(h => {
      const d = new Date(h.scanned_at || h.timestamp);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (days.has(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)) streak++;
      else if (i > 0) break;
    }
    if (streak < 2) return null;
    return (
      <div style={{
        display:"flex", alignItems:"center", gap:4,
        background:"rgba(249,115,22,.12)",
        border:"1px solid rgba(249,115,22,.3)",
        borderRadius:20, padding:"4px 10px",
        fontSize:12, fontWeight:800, color:"#f97316",
        flexShrink:0,
      }}>
        🔥 {streak}
      </div>
    );
  };

  const renderProfileToggleButtons = () => {
    const allIds = ["user", ...family.map(m => m.id)];
    const allActive = allIds.every(id => activeProfiles.includes(id));
    return (
      <>
        <button onClick={() => setActiveProfiles(allIds)}
          style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20, border:"1px solid var(--green)",
            background: allActive ? "var(--green)" : "var(--green-lt)", color: allActive ? "var(--ink)" : "var(--green)", cursor:"pointer", fontFamily:"var(--f)" }}>
          Vælg alle
        </button>
        <button onClick={() => setActiveProfiles([])}
          style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20, border:"1px solid var(--border)",
            background:"var(--paper2)", color:"var(--muted)", cursor:"pointer", fontFamily:"var(--f)" }}>
          Fravælg alle
        </button>
      </>
    );
  };

  const renderUserAvatar = () => {
    const isActive = activeProfiles.includes("user");
    return (
      <div onClick={() => setProfilePopup("user")} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer" }}>
        <div style={S.rel}>
          <div style={{ width:46, height:46, borderRadius:"50%",
            background: isActive ? "var(--green)" : "var(--paper2)",
            color: isActive ? "var(--ink)" : "var(--muted)",
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
              fontSize:9, color:"var(--ink)", fontWeight:800 }}>
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
  };

  const renderDailyTip = () => {
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
  };

  return (
    <>
        {screen === SCREENS.HOME && (
          <div className="screen fade-in" id="main-content" style={{ display:"flex", flexDirection:"column", minHeight:"calc(100vh - 130px)" }}>

            {/* Profil popup */}
            {profilePopup && renderProfilePopup()}

            {/* Guide modal — vises ved klik på "App-guide" */}
            {showGuide && (
              <div style={{ position:"fixed", inset:0, zIndex:9995, background:"rgba(0,0,0,.7)", display:"flex", flexDirection:"column", justifyContent:"flex-end" }}
                onClick={() => setShowGuide(false)}>
                <div style={{ background:"var(--paper)", borderRadius:"20px 20px 0 0", overflow:"hidden", maxHeight:"90vh", overflowY:"auto" }}
                  onClick={e => e.stopPropagation()}>
                  <DemoSlider onClose={() => setShowGuide(false)} />
                </div>
              </div>
            )}

            {/* Hilsen + Profil-bar — kun til loggede */}
            {!!userId && <div style={{ padding:"16px 2px 12px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                <div style={{ fontSize:20, fontWeight:900, color:"var(--ink)", letterSpacing:"-.3px" }}>
                  {greeting} {user.name?.split(" ")[0] || "der"}
                </div>
                {renderStreakBadge()}
              </div>

              {/* Vælg alle / fravælg alle */}
              <div style={{ display:"flex", gap:6, marginBottom:10 }}>
                {renderProfileToggleButtons()}
              </div>

              {/* Profil-avatars */}
              <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                {/* Brugeren selv */}
                {renderUserAvatar()}

                {/* Familiemedlemmer */}
                {family.map(m => {
                  const isActive = activeProfiles.includes(m.id);
                  return (
                    <div key={m.id} onClick={() => setProfilePopup(m.id)}
                      style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer" }}>
                      <div style={S.rel}>
                        <div style={{ width:46, height:46, borderRadius:"50%",
                          background: isActive ? "var(--green)" : "var(--paper2)",
                          color: isActive ? "var(--ink)" : "var(--muted)",
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
                            fontSize:9, color:"var(--ink)", fontWeight:800 }}>
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
            </div>}

            {/* Scan-boks — kun til loggede */}
            {!!userId && <div style={{
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
              {/* Foto-fallback: åbner kamera direkte */}
              <input ref={photoFallbackRef} type="file" accept="image/*" capture="environment" style={S.none}
                onChange={e => { if (e.target.files[0]) scanPhotoForEan(e.target.files[0]); e.target.value=""; }} />

              {/* Stop-knap når kamera er aktivt */}
              {cameraActive && (
                <div style={{ padding:"8px 14px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ fontSize:11, fontWeight:600 }}>
                    {scanZoom > 1.0
                      ? <span style={{ color:"var(--green)" }}>🔍 {scanZoom}× zoom</span>
                      : <span style={{ color:"rgba(255,255,255,.6)" }}>Hold stregkoden ind i rammen</span>}
                  </span>
                  <div style={S.rowGap6}>
                    <button onClick={() => galleryInputRef.current?.click()} aria-label="Vælg billede fra galleri" style={{ background:"rgba(255,255,255,.15)", border:"none", borderRadius:6, padding:"5px 10px", color:"var(--ink)", fontSize:16, cursor:"pointer", lineHeight:1 }}>🖼️</button>
                    <button onClick={toggleTorch} aria-label={torchOn ? "Sluk lygte" : "Tænd lygte"} style={{
                      background: torchOn ? "rgba(251,191,36,.3)" : "rgba(255,255,255,.15)",
                      border: torchOn ? "1px solid rgba(251,191,36,.6)" : "none",
                      borderRadius:6, padding:"5px 10px", color: torchOn ? "#FBB" : "var(--ink)",
                      fontSize:16, cursor:"pointer", lineHeight:1
                    }}>🔦</button>
                    <button onClick={stopCamera} style={{ background:"rgba(255,255,255,.15)", border:"none", borderRadius:6, padding:"5px 12px", color:"var(--ink)", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--f)" }}>Stop</button>
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
                    background:"linear-gradient(90deg, transparent, var(--green), #86EFAC, var(--green), transparent)",
                    boxShadow:"0 0 8px var(--green), 0 0 16px rgba(74,222,128,.4)",
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
                  <div style={{ fontSize:20, fontWeight:900, color:"var(--ink)", letterSpacing:"-.4px" }}>Skan produkt</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,.5)", marginTop:4 }}>Tryk for at starte kamera</div>
                  <div onClick={e => { e.stopPropagation(); galleryInputRef.current?.click(); }}
                    style={{ fontSize:11, color:"rgba(255,255,255,.35)", marginTop:8, textDecoration:"underline", cursor:"pointer" }}>
                    eller vælg billede fra galleri
                  </div>
                </div>
              </div>
              )}
            </div>}

            {/* Fejlbesked + Manuel EAN — kun til loggede */}
            {!!userId && <>
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
                  <button onClick={() => setShowManualEan(false)} aria-label="Luk"
                    style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"var(--muted)", lineHeight:1, padding:8, margin:-8 }}>×</button>
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
                      color:"var(--on-green)", fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"var(--f)", flexShrink:0 }}
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

            </>}

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
            {renderDailyTip()}

            {/* Version + Beta knap */}
            <div style={{ textAlign:"center", paddingTop:8, paddingBottom:12, display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
              <div style={{ fontSize:10, color:"var(--muted)", opacity:0.4 }}>v1.0.6 · beta</div>
              <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
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
                <button onClick={() => setShowGuide(true)}
                  style={{ display:"inline-flex", alignItems:"center", gap:6,
                    padding:"5px 14px", borderRadius:100,
                    background:"rgba(99,102,241,.1)",
                    border:"1px solid rgba(99,102,241,.25)",
                    fontFamily:"var(--f)", fontSize:11, fontWeight:700,
                    color:"#818cf8", cursor:"pointer",
                    letterSpacing:".3px" }}>
                  📖 App-guide
                </button>
              </div>
            </div>

          </div>
        )}
        {screen === SCREENS.NOTFOUND && (
          <NotFoundScreen
            notFoundEan={notFoundEan}
            notFoundStep={notFoundStep} setNotFoundStep={setNotFoundStep}
            proposedName={proposedName} setProposedName={setProposedName}
            proposedFlags={proposedFlags} setProposedFlags={setProposedFlags}
            proposedNutrition={proposedNutrition} setProposedNutrition={setProposedNutrition}
            proposedNotes={proposedNotes} setProposedNotes={setProposedNotes}
            ocrLoading={ocrLoading} ocrText={ocrText} setOcrText={setOcrText}
            nutritionOcrLoading={nutritionOcrLoading} handleNutritionCapture={handleNutritionCapture}
            productImagePreview={productImagePreview}
            submitting={submitting} submitProduct={submitProduct}
            handleImageCapture={handleImageCapture} handleProductImageCapture={handleProductImageCapture}
            scanError={scanError}
          />
        )}
        {screen === SCREENS.SEARCH && (
          <Suspense fallback={LazyFallback}>
          <SearchScreen
            activeIds={activeIds}
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            searchResults={searchResults} setSearchResults={setSearchResults}
            searchCategory={searchCategory} setSearchCategory={setSearchCategory}
            searchLoading={searchLoading}
            showSafeOnly={showSafeOnly} setShowSafeOnly={setShowSafeOnly}
            lookupProduct={lookupProduct}
          />
          </Suspense>
        )}
        {screen === SCREENS.LIST && (
          <Suspense fallback={LazyFallback}>
          <ListScreen
            activeIds={activeIds}
            lookupProduct={lookupProduct}
          />
          </Suspense>
        )}

        {screen === SCREENS.SUBMITTED && (
          <SubmittedScreen
            notFoundEan={notFoundEan}
            proposedName={proposedName}
            setNotFoundStep={setNotFoundStep}
            setProposedName={setProposedName}
            setProposedFlags={setProposedFlags}
            setProposedNutrition={setProposedNutrition}
            setProposedNotes={setProposedNotes}
            setOcrText={setOcrText}
          />
        )}

        {screen === SCREENS.RESULT && scanResult && (
          <ResultScreen
            scanResult={scanResult}
            activeENumbers={activeENumbers}
            selectedENumbers={selectedENumbers}
            setKnowledgeSlug={setKnowledgeSlug}
            setEditStep={setEditStep}
            setEditIngText={setEditIngText}
            setEditNote={setEditNote}
            setEditType={setEditType}
            alternatives={alternatives}
            altLoading={altLoading}
            lookupProduct={lookupProduct}
          />
        )}

        {screen === SCREENS.SUGGEST_EDIT && scanResult && (
          <Suspense fallback={LazyFallback}>
          <SuggestEditScreen
            scanResult={scanResult}
            editStep={editStep} setEditStep={setEditStep}
            editType={editType} setEditType={setEditType}
            editIngText={editIngText} setEditIngText={setEditIngText}
            editNote={editNote} setEditNote={setEditNote}
            editProductImage={editProductImage}
            handleEditProductCapture={handleEditProductCapture}
          />
          </Suspense>
        )}

        {screen === SCREENS.RESTAURANTGUIDE && (
          <Suspense fallback={LazyFallback}>
          <RestaurantGuideScreen />
          </Suspense>
        )}

    </>
  );
}
