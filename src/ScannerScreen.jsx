// @ts-nocheck
import React, { useState, useRef, Suspense } from "react";
import { SCREENS, DEMO_CODES, DUMMY_PRODUCT, MOCK_PRODUCTS,
         ALLERGEN_EXAMPLES, E_NUMBERS, SUPABASE_URL, SUPABASE_ANON_KEY, uid } from "./constants.jsx";
import { compareAllergens, extractENumbers, compareENumbers, checkDietCompatibility, getAllergenLabels, verifiedBadge, makeHeaders, apiCall, timeAgo, isValidEanChecksum } from "./helpers.js";
import { Icon, IngredientsList, ProfileBadges, getProductIcon, ProductImage, LazyFallback } from "./SharedComponents.jsx";
import { DEMO_SLIDES } from "./demoSlides.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useHistoryContext } from "./HistoryContext.jsx";

import { CategorySelect } from "./MemberForm.jsx";
import ResultScreen from "./ResultScreen.jsx";
import { UI } from "./styleUtils.js";
import { getGreeting } from "./utils.jsx";
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
        <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:16 }}>
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
  searchHasMore, searchTotal, searchLoadingMore, loadMoreSearchResults,
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
  cameraActive, setCameraActive,
  galleryInputRef,
  lastScannedRef,
  selectedENumbers,
  activeIds,
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
  runDemoScan,
  alternatives,
  altLoading,
}) {
  const { user, userId, accessToken } = useAuthContext();
  const { activeProfiles, setActiveProfiles } = useProfileContext();
  const { screen, setScreen } = useNavigationContext();
  const { favorites, toggleFavorite, isFavorite } = useHistoryContext();

  // Parser OCR-tekst til liste af ingredienser


  // ── Guide modal state ─────────────────────────────────────────────────────
  const [showGuide, setShowGuide] = React.useState(false);
  const [manualEanError, setManualEanError] = React.useState("");

  // "Prøv en demo-scanning" er kun til nye brugere — forsvinder efter 1 døgn
  // (målt fra kontoens created_at), så den ikke fylder unødigt for alle
  // fremover. Fejler lukket (skjult) indtil created_at er hentet, for at
  // undgå et kort glimt af knappen for etablerede brugere før data er inde.
  const showDemoScan = !!(user.created_at && (Date.now() - new Date(user.created_at).getTime()) < 24 * 60 * 60 * 1000);

  // activeIds (kombinerede allergen-id'er for alle aktive profiler) kommer nu
  // som prop fra App.jsx' allActive() i stedet for at blive genberegnet her
  // — to uafhængige implementationer af samme sikkerhedsrelevante beregning
  // havde allerede forårsaget mindst én bug (se App.jsx' egen kommentar ved
  // allActive()).

  return (
    <>
        {screen === SCREENS.HOME && (
          <div className="screen fade-in" id="main-content" style={{ display:"flex", flexDirection:"column", minHeight:"calc(100vh - 130px)", paddingBottom:0 }}>

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

            {/* Scan-boks — kun til loggede. Forsiden viser en hilsen + stor
                scan-CTA oven på appens fælles baggrundsbillede — se CLAUDE.md
                afsnit 5 for baggrunden. Hero-boksens egen højde styres af
                .home-hero-frame (calc(100dvh - Npx), se theme.jsx)
                — IKKE flex:1/height:100% her, som viste sig upålideligt i
                produktion (afhænger af at hele forældrekæden har en
                definitiv, ikke bare minimum-, højde — se theme.jsx's
                kommentar + HISTORY.md for fejlfindingen). */}
            {!!userId && <div style={{
              background: cameraActive ? "var(--surface)" : "transparent",
              borderRadius: cameraActive ? 20 : 0, marginBottom: cameraActive ? 10 : 0,
              overflow: cameraActive ? "hidden" : "visible", position:"relative", border: cameraActive ? "1px solid var(--border2)" : "none",
              boxShadow: cameraActive ? "var(--sh2)" : "none",
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

              {/* Forside-hero når kamera ikke er aktivt: hilsen + stor scan-knap +
                  version/beta-fod, siddende oven på appens fælles
                  baggrundsbillede (theme.jsx's .app — ikke længere et
                  separat billede kun på denne skærm, se CLAUDE.md afsnit 5).
                  .home-hero-frame (theme.jsx) giver boksen en DEFINITIV
                  calc(100dvh - Npx)-højde, så hilsen/knap altid er synlige
                  uden scroll. Alle mål er clamp(min, Ncqh, max) i stedet for
                  faste px, så indholdet skalerer NED sammen med boksen på
                  korte telefoner (og OP på store — hævet 24. sept. 2026 efter
                  feedback om at hele hero'en virkede for lille). "Prøv en
                  demo"-knappen er fjernet samme dag efter brugerens ønske —
                  bemærk at det var DENNE knaps eneste kald til setShowGuide
                  der åbnede DemoSlider-guiden ("App-guide"-knappen der
                  gjorde det samme var allerede fjernet som redundant) —
                  showGuide/DemoSlider herunder er nu urørt, men uden nogen
                  synlig indgang i UI'et. */}
              {!cameraActive && (
              <div className="home-hero-frame">
                <div style={{ position:"absolute", top:"27%", left:0, right:0, zIndex:1, textAlign:"center", padding:"0 12px" }}>
                  <div style={{ fontSize:"clamp(13px, 2.7cqh, 18px)", fontWeight:500, color:"var(--ink)", letterSpacing:"-.2px" }}>{getGreeting()},</div>
                  <div style={{ fontSize:"clamp(20px, 4.4cqh, 30px)", fontWeight:800, color:"var(--ink)", letterSpacing:"-.5px", marginTop:"clamp(2px, .4cqh, 4px)" }}>{user.name?.split(" ")[0] || "der"}</div>
                  <div style={{ fontSize:"clamp(11px, 2cqh, 14.5px)", color:"var(--muted)", marginTop:"clamp(5px, 1.1cqh, 9px)", lineHeight:1.5, maxWidth:250, marginLeft:"auto", marginRight:"auto" }}>
                    Scan en vare og få hurtigt svar om den passer til dine allergier.
                  </div>
                </div>

                {/* Stor cirkulær scan-knap — gentænkt fra bunden (24. sept.
                    2026) efter brugerens feedback om at tidligere glossy-
                    udgaver lignede en gummibold. Ny retning (brugeren
                    valgte "ghost/outline"-konceptet blandt tre forslag, +
                    et lyspunkt der bevæger sig rundt i kanten): en let,
                    hvid cirkel med grønt ikon/tekst i stedet for en tung
                    grøn fyld. "Liv"-elementet er nu et roterende lyspunkt
                    i selve ringen (scanCtaRingSpin i theme.jsx) i stedet
                    for en pulserende glød/gradient i fladen — ringen har
                    to lag: en svag, konstant grøn bundfarve (så ringen
                    altid er synlig) + et lysere "komethoved" der roterer
                    ovenpå. Knap-fladen ligger ovenpå og dækker det meste
                    af ringen, så kun en tynd bræmme forbliver synlig. */}
                <div style={{ position:"absolute", top:"46%", left:0, right:0, zIndex:1, display:"flex", justifyContent:"center" }}>
                  <div style={{ position:"relative", width:"clamp(168px, 42cqh, 267px)", height:"clamp(168px, 42cqh, 267px)", display:"flex", alignItems:"center", justifyContent:"center",
                    animation:"scanCtaBreathe 4.5s ease-in-out infinite" }}>
                    <div aria-hidden="true" style={{ position:"absolute", inset:0, borderRadius:"50%",
                      background:"conic-gradient(from 0deg, transparent 0deg, transparent 250deg, rgba(23,138,80,.22) 295deg, #28B871 335deg, #1FA466 350deg, transparent 360deg), rgba(23,138,80,.16)",
                      animation:"scanCtaRingSpin 5s linear infinite" }} />
                    <div
                      onClick={() => startCamera()}
                      role="button"
                      aria-label="Start kamera for at scanne stregkode"
                      tabIndex={0}
                      onKeyDown={e => e.key === "Enter" && startCamera()}
                      style={{ position:"absolute", inset:"clamp(6px, 1cqh, 9px)", borderRadius:"50%", cursor:"pointer",
                        background:"rgba(255,255,255,.94)",
                        boxShadow:"0 12px 26px -14px rgba(21,32,26,.22)",
                        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"clamp(8px, 1.8cqh, 14px)" }}>
                      <Icon name="barcode" size="clamp(38px, 8cqh, 53px)" color="var(--green)" />
                      <div style={{ fontSize:"clamp(18px, 3.2cqh, 23px)", fontWeight:800, color:"var(--green)", letterSpacing:"-.2px" }}>Scan produkt</div>
                    </div>
                  </div>
                </div>

                {/* Version/Beta-info — bund-forankret. */}
                <div style={{ position:"absolute", top:"71.5%", left:0, right:0, bottom:"clamp(6px, 1.4cqh, 10px)", zIndex:2,
                  display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", padding:"0 12px", overflow:"hidden" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                    <div style={{ fontSize:"clamp(10px, 1.7cqh, 12.5px)", fontWeight:600, color:"var(--ink2)", background:"rgba(255,255,255,.7)", padding:"3px 10px", borderRadius:100 }}>v1.0.6 · beta</div>
                    <button onClick={onBetaClick}
                      style={{ display:"inline-flex", alignItems:"center", gap:5,
                        padding:"clamp(4px, 1cqh, 6px) clamp(9px, 2cqh, 13px)", borderRadius:100,
                        background:"rgba(255,255,255,.82)", border:"1px solid var(--border)", boxShadow:"0 4px 12px -6px rgba(21,32,26,.3)",
                        fontFamily:"var(--f)", fontSize:"clamp(10px, 1.7cqh, 12.5px)", fontWeight:700, color:"var(--green)", cursor:"pointer", letterSpacing:".2px" }}>
                      Beta-information
                    </button>
                  </div>
                </div>
              </div>
              )}
            </div>}

            {/* Simuleret scan, fejlbesked og manuel EAN-input — sjældne/betingede
                tilstande, kun vist ved behov. Pakket i en bund-sikret wrapper
                (padding matchende den gennemsigtige bundnav) så de ikke kan
                havne skjult/utrykbare bag den, nu hvor HOME-skærmens normale
                110px bund-reserve er fjernet til fordel for hero-boksens
                kant-til-kant-udfyldning ovenfor. */}
            <div style={{ paddingBottom: (showDemoScan || scanError || showManualEan) ? "calc(77px + env(safe-area-inset-bottom) + 12px)" : 0 }}>
            {/* Simuleret scan — prøv appen uden en rigtig stregkode ("Fase 7b.2").
                Kun til nye brugere, forsvinder efter 1 døgn (se showDemoScan ovenfor). */}
            {!!userId && !cameraActive && showDemoScan && (
              <button onClick={runDemoScan}
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  width:"100%", padding:"12px 14px", marginBottom:14,
                  background:"var(--surface)", border:"1px dashed var(--border2)", borderRadius:14,
                  fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"var(--ink2)", cursor:"pointer" }}>
                <Icon name="zap" size={15} color="var(--blue)" /> Prøv en demo-scanning
              </button>
            )}

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
                      color:"var(--on-green)", fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"var(--f)", flexShrink:0,
                      boxShadow:"0 2px 12px rgba(74,222,128,.25)" }}
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
            searchHasMore={searchHasMore} searchTotal={searchTotal}
            searchLoadingMore={searchLoadingMore} loadMoreSearchResults={loadMoreSearchResults}
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
