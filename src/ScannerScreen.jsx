// @ts-nocheck
import React, { useState, useRef, Suspense } from "react";
import { SCREENS, DEMO_CODES, DUMMY_PRODUCT, MOCK_PRODUCTS,
         ALLERGEN_EXAMPLES, E_NUMBERS, HOME_TIPS, SUPABASE_URL, SUPABASE_ANON_KEY, uid } from "./constants.jsx";
import { compareAllergens, extractENumbers, compareENumbers, checkDietCompatibility, getAllergenLabels, verifiedBadge, makeHeaders, apiCall, timeAgo, isValidEanChecksum } from "./helpers.js";
import { Icon, IngredientsList, ProfileBadges, getProductIcon, ProductImage, LazyFallback } from "./SharedComponents.jsx";
import { DEMO_SLIDES } from "./demoSlides.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useHistoryContext } from "./HistoryContext.jsx";
import { useShoppingContext } from "./ShoppingContext.jsx";

import { CategorySelect } from "./MemberForm.jsx";
import ResultScreen from "./ResultScreen.jsx";
import { UI } from "./styleUtils.js";
// Lazy: skærme brugeren ikke nødvendigvis besøger hver session, holdes ude af hoved-bundlet.
// ResultScreen er IKKE med her — den vises efter stort set hvert scan (hoved-flowet),
// så at lazy-loade den ville tilføje en indlæsnings-forsinkelse lige der hvor brugeren
// forventer et øjeblikkeligt svar. NotFoundScreen/SubmittedScreen rammes langt sjældnere.
const NotFoundScreen = React.lazy(() => import("./NotFoundScreen.jsx"));
const SubmittedScreen = React.lazy(() => import("./SubmittedScreen.jsx"));
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
  camCtrlBtn: { width:34, height:34, borderRadius:"50%", background:"rgba(0,0,0,.45)", backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)", border:"1px solid rgba(255,255,255,.2)", color:"#fff", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", lineHeight:1 },
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
      <div style={{ background:"var(--surface2)", borderBottom:"1px solid var(--border)", padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:13, fontWeight:800, color:"var(--green)", textTransform:"uppercase", letterSpacing:"1.5px" }}>Det kan EatSafe</div>
        <button onClick={onClose} aria-label="Luk"
          style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"50%",
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
              style={{ width: i===idx ? 22 : 7, height:7, borderRadius:4, background: i===idx ? slide.accent : "var(--border2)", cursor:"pointer", transition:"all .25s" }} />
          ))}
        </div>

        {/* Indhold */}
        <div style={{ fontSize:19, fontWeight:900, color:"var(--ink)", marginBottom:6, letterSpacing:"-.3px" }}>{slide.title}</div>
        <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6 }}>{slide.sub}</div>
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
      <div style={{ display:"flex", gap:8, padding:"12px 14px", background:"var(--surface2)", borderTop:"1px solid var(--border)" }}>
        <button disabled={idx===0} onClick={() => setIdx(i => i-1)}
          style={{ flex:1, padding:"10px", background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:10,
            fontFamily:"var(--f)", fontSize:13, fontWeight:700, color: idx===0 ? "var(--muted)" : "var(--ink2)",
            cursor: idx===0 ? "default" : "pointer", opacity: idx===0 ? 0.4 : 1 }}>
          ← Forrige
        </button>
        {idx < DEMO_SLIDES.length - 1 ? (
          <button onClick={() => setIdx(i => i+1)}
            style={UI.uflex1_p10px_bggreen_bdnone_br10_fff_fs13_fw800_congreen_cur}>
            Næste →
          </button>
        ) : (
          <button onClick={onClose}
            style={UI.uflex1_p10px_bggreen_bdnone_br10_fff_fs13_fw800_congreen_cur}>
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
  greeting,
  cameraActive, setCameraActive,
  galleryInputRef,
  lastScannedRef,
  selectedENumbers,
  activeENumbers,
  handleEditProductCapture,
  handleImageCapture, handleProductImageCapture,
  editProductImage,
  editProductImageB64,
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
  const { family, activeProfiles, setActiveProfiles, allergens } = useProfileContext();
  const { screen, setScreen } = useNavigationContext();
  const { history, favorites, toggleFavorite, isFavorite } = useHistoryContext();
  const { shoppingList, newItemName, setNewItemName, addToList, toggleItem, removeItem, clearDone } = useShoppingContext();

  // Parser OCR-tekst til liste af ingredienser


  // ── Guide modal state ─────────────────────────────────────────────────────
  const [showGuide, setShowGuide] = React.useState(false);
  const [manualEanError, setManualEanError] = React.useState("");

  // ── Kombinerede allergen-IDs for alle aktive profiler ──────────────────────
  const activeIds = [
    ...(activeProfiles.includes("me") ? allergens : []),
    ...family
      .filter(m => activeProfiles.includes(m.id))
      .flatMap(m => Array.isArray(m.allergens) ? m.allergens : Object.keys(m.allergens||{}).filter(k => m.allergens[k])),
  ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

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
        <Icon name="flame" size={13} color="#f97316" /> {streak}
      </div>
    );
  };

  const renderDailyTip = () => {
    const tip = HOME_TIPS[new Date().getDay() % HOME_TIPS.length];
    return (
      <div className="home-tip">
        <div style={UI.shrink0}><Icon name="bulb" size={18} color="var(--blue)" /></div>
        <div style={S.flex1}>
          <div className="home-tip-tag">Vidste du at</div>
          <div className="home-tip-title">{tip.title}</div>
          <div className="home-tip-body">{tip.text}</div>
        </div>
      </div>
    );
  };

  return (
    <>
        {screen === SCREENS.HOME && (
          <div className="screen fade-in" id="main-content" style={{ display:"flex", flexDirection:"column", minHeight:"calc(100vh - 130px)" }}>

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

            {/* Hilsen — kun til loggede */}
            {!!userId && <div style={{ padding:"20px 2px 18px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ fontSize:22, fontWeight:900, color:"var(--ink)", letterSpacing:"-.3px" }}>
                  {greeting} {user.name?.split(" ")[0] || "der"}
                </div>
                {renderStreakBadge()}
              </div>
            </div>}

            {/* Scan-boks — kun til loggede */}
            {!!userId && <div style={{
              background: cameraActive ? "var(--surface)" : "linear-gradient(150deg,#22A868 0%,#178A50 60%,#0E6B3B 100%)",
              borderRadius:20, marginBottom:10,
              overflow:"hidden", position:"relative", border: cameraActive ? "1px solid var(--border2)" : "none",
              boxShadow: cameraActive ? "var(--sh2)" : "0 16px 32px -14px rgba(23,138,80,.45)",
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

                {/* Svævende kontroller oven på kameraet — luk, galleri, manuelt, lygte */}
                <div style={{ position:"absolute", top:10, left:10, right:10, display:"flex", alignItems:"center", justifyContent:"space-between", zIndex:2 }}>
                  <button onClick={stopCamera} aria-label="Luk kamera" style={S.camCtrlBtn}>
                    <Icon name="x" size={15} color="#fff" />
                  </button>
                  <div style={S.rowGap6}>
                    <button onClick={() => galleryInputRef.current?.click()} aria-label="Vælg billede fra galleri" style={S.camCtrlBtn}>
                      <Icon name="image" size={14} color="#fff" />
                    </button>
                    <button onClick={() => setShowManualEan(true)} aria-label="Indtast stregkode manuelt" style={S.camCtrlBtn}>
                      <Icon name="edit" size={14} color="#fff" />
                    </button>
                    <button onClick={toggleTorch} aria-label={torchOn ? "Sluk lygte" : "Tænd lygte"}
                      style={{ ...S.camCtrlBtn, background: torchOn ? "rgba(251,191,36,.4)" : S.camCtrlBtn.background, borderColor: torchOn ? "rgba(251,191,36,.6)" : S.camCtrlBtn.borderColor }}>
                      <Icon name="flashlight" size={14} color={torchOn ? "#fbbf24" : "#fff"} />
                    </button>
                  </div>
                </div>

                {/* Svævende hint/zoom nederst over kameraet */}
                <div style={{ position:"absolute", bottom:14, left:"50%", transform:"translateX(-50%)", zIndex:2 }}>
                  <div style={{ background:"rgba(0,0,0,.5)", backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)", borderRadius:100, padding:"6px 14px", fontSize:11.5, fontWeight:600, whiteSpace:"nowrap", color: scanZoom > 1.0 ? "#86EFAC" : "rgba(255,255,255,.85)" }}>
                    {scanZoom > 1.0 ? `🔍 ${scanZoom}× zoom` : "Hold stregkoden ind i rammen"}
                  </div>
                </div>
              </div>
              <div id="qr-reader-gallery" style={S.none} />
              <input ref={galleryInputRef} type="file" accept="image/*" style={S.none}
                onChange={e => { if (e.target.files[0]) scanFromGallery(e.target.files[0]); e.target.value=""; }} />
              {/* Foto-fallback: åbner kamera direkte */}
              <input ref={photoFallbackRef} type="file" accept="image/*" capture="environment" style={S.none}
                onChange={e => { if (e.target.files[0]) scanPhotoForEan(e.target.files[0]); e.target.value=""; }} />

              {/* Animation når kamera ikke er aktivt */}
              {!cameraActive && (
              <div style={{ cursor:"pointer", padding:"38px 24px 42px", display:"flex", flexDirection:"column", alignItems:"center", gap:22, position:"relative" }}
                onClick={() => startCamera()}
                role="button"
                aria-label="Start kamera for at scanne stregkode"
                tabIndex={0}
                onKeyDown={e => e.key === "Enter" && startCamera()}>
                {/* Stregkode-animation */}
                <div style={{ position:"relative", width:180, height:90 }}>
                  {/* Stregkode streger */}
                  <svg viewBox="0 0 180 90" width="180" height="90">
                    <g fill="rgba(255,255,255,.35)">
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
                    background:"linear-gradient(90deg, transparent, #fff, #fff, transparent)",
                    boxShadow:"0 0 8px rgba(255,255,255,.8), 0 0 16px rgba(255,255,255,.4)",
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
                      {borderTop:"2px solid rgba(255,255,255,.7)",borderLeft:"2px solid rgba(255,255,255,.7)"},
                      {borderTop:"2px solid rgba(255,255,255,.7)",borderRight:"2px solid rgba(255,255,255,.7)"},
                      {borderBottom:"2px solid rgba(255,255,255,.7)",borderLeft:"2px solid rgba(255,255,255,.7)"},
                      {borderBottom:"2px solid rgba(255,255,255,.7)",borderRight:"2px solid rgba(255,255,255,.7)"},
                    ][i];
                    return <div key={i} style={{ position:"absolute", width:16, height:16, ...pos, ...borders, borderRadius:2 }}/>;
                  })}
                </div>
                {/* Tekst */}
                <div style={UI.utacenter}>
                  <div style={{ fontSize:22, fontWeight:800, color:"#fff", letterSpacing:"-.4px" }}>Skan produkt</div>
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

            {/* Manuel EAN-input — åbnes via blyant-ikonet i kamera-kontrollerne, eller herunder ved fejl */}
            {showManualEan && (
              <div style={UI.ubgsurface_bd1pxsolid_br14_p14px16px_mb12}>
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
                    style={{ flex:1, fontSize:16, letterSpacing:1, borderColor: manualEanError ? "var(--red)" : undefined }}
                    onChange={() => manualEanError && setManualEanError("")}
                    onKeyDown={e => {
                      if (e.key !== "Enter") return;
                      const val = e.target.value.trim();
                      if (val.length < 8) return;
                      if (!isValidEanChecksum(val)) { setManualEanError("Det ligner ikke en gyldig stregkode — tjek cifrene."); return; }
                      setShowManualEan(false); setManualEanError("");
                      lookupProduct(val);
                    }}
                  />
                  <button
                    style={{ padding:"0 16px", borderRadius:10, background:"var(--green)", border:"none",
                      color:"var(--on-green)", fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"var(--f)", flexShrink:0 }}
                    onClick={() => {
                      const val = document.getElementById("manual-ean-input")?.value?.trim();
                      if (!val || val.length < 8) return;
                      if (!isValidEanChecksum(val)) { setManualEanError("Det ligner ikke en gyldig stregkode — tjek cifrene."); return; }
                      setShowManualEan(false); setManualEanError("");
                      lookupProduct(val);
                    }}>
                    Søg
                  </button>
                </div>
                {manualEanError ? (
                  <div style={{ fontSize:11, color:"var(--red)", marginTop:8, fontWeight:600 }}>{manualEanError}</div>
                ) : (
                  <div style={UI.ufs10_cmuted_mt8}>
                    EAN-nummeret er stregkodens tal — typisk 8 eller 13 cifre.
                  </div>
                )}
              </div>
            )}

            </>}

            {/* Genvej til indkøbslisten — kun hvis der er varer */}
            {/* Sekundær vægt (lettere skygge end scan-boksen ovenfor) — genvejen er
                nyttig, men skal ikke konkurrere visuelt med hoved-handlingen */}
            {shoppingList.filter(i => !i.checked).length > 0 && (
            <div className="home-shortcut-card" style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, boxShadow:"var(--sh)", marginBottom:14, overflow:"hidden" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 14px", cursor:"pointer" }}
                onClick={() => setScreen(SCREENS.LIST)}>
                <div style={UI.uw34_h34_bgsurface2_br9_dflex_aicenter_jccenter_shr0}><Icon name="cart" size={17} color="var(--ink2)" /></div>
                  <div style={S.flex1}>
                    <div style={UI.ufs13_fw700}>Indkøbsliste</div>
                    <div style={S.sub11mt}>
                      {shoppingList.filter(i => !i.checked).length} vare{shoppingList.filter(i => !i.checked).length !== 1 ? "r" : ""} mangler
                    </div>
                  </div>
                  <div style={UI.ufs16_cmuted2}>›</div>
                </div>
            </div>
            )}

            <div style={{ flex:1, minHeight:20 }} />

            {/* Vidste du at */}
            {renderDailyTip()}

            {/* Version + Beta knap */}
            <div style={{ textAlign:"center", paddingTop:8, paddingBottom:12, display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
              <div style={{ fontSize:10, color:"var(--muted)", opacity:0.4 }}>v1.0.6 · beta</div>
              <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
                <button onClick={onBetaClick}
                  style={{ display:"inline-flex", alignItems:"center", gap:6,
                    padding:"5px 14px", borderRadius:100,
                    background:"var(--green-lt)",
                    border:"1px solid var(--green-mid)",
                    fontFamily:"var(--f)", fontSize:11, fontWeight:700,
                    color:"var(--green)", cursor:"pointer",
                    letterSpacing:".3px" }}>
                  🧪 Beta-information
                </button>
                <button onClick={() => setShowGuide(true)}
                  style={{ display:"inline-flex", alignItems:"center", gap:6,
                    padding:"5px 14px", borderRadius:100,
                    background:"var(--surface2)",
                    border:"1px solid var(--border2)",
                    fontFamily:"var(--f)", fontSize:11, fontWeight:700,
                    color:"var(--ink2)", cursor:"pointer",
                    letterSpacing:".3px" }}>
                  📖 App-guide
                </button>
              </div>
            </div>

          </div>
        )}
        {screen === SCREENS.NOTFOUND && (
          <Suspense fallback={LazyFallback}>
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
          </Suspense>
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
          <Suspense fallback={LazyFallback}>
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
          </Suspense>
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
            editProductImageB64={editProductImageB64}
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
