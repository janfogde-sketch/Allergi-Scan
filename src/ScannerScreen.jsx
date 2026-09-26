// @ts-nocheck
import React, { useState, useRef, Suspense } from "react";
import { createPortal } from "react-dom";
import { SCREENS, DEMO_CODES, DUMMY_PRODUCT, MOCK_PRODUCTS,
         ALLERGEN_EXAMPLES, E_NUMBERS, SUPABASE_URL, SUPABASE_ANON_KEY, uid } from "./constants.jsx";
import { compareAllergens, extractENumbers, compareENumbers, checkDietCompatibility, getAllergenLabels, verifiedBadge, makeHeaders, apiCall, timeAgo, isValidEanChecksum, initials } from "./helpers.js";
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

// ── Scanner-profilvælger ("Scanner for: ...") ──────────────────────────────
// Bund-ark (samme mønster som ListScreens ShareSheet/ListPickerSheet) der lader
// brugeren vælge hvilke(n) profil(er) fremtidige scanninger vurderes imod —
// Alle, kun brugeren selv, eller en vilkårlig delmængde af familien (25. sept.
// 2026, brugerfeedback). Genbruger PRÆCIS samme toggle-semantik som den
// eksisterende (men skjulte, kun brugt i ProfileScreens "Aktive profiler ved
// scanning"-chip-række) FamilyChips-logik: klik på "Alle" vælger alle, klik på
// én specifik person mens "Alle" er aktivt indsnævrer til kun den ene, og
// almindelige klik derefter til-/fravælger enkeltvis. Portal-baseret — se
// CLAUDE.md afsnit 3 for hvorfor (samme fade-in-containing-block-fælde).
function ScanProfilePickerSheet({ activeProfiles, setActiveProfiles, family, user, onClose }) {
  const allIds = ["me", ...family.map(m => m.id)];
  const isAll = allIds.every(id => activeProfiles.includes(id));
  const toggleAll = () => setActiveProfiles(isAll ? ["me"] : allIds);
  const toggleOne = (id) => {
    if (isAll) { setActiveProfiles([id]); return; }
    const next = activeProfiles.includes(id) ? activeProfiles.filter(x => x !== id) : [...activeProfiles, id];
    setActiveProfiles(next.length === 0 ? [id] : next);
  };

  const Row = ({ id, label, avatarColor, avatarInitials, checked, onClick }) => (
    <div onClick={onClick} role="checkbox" aria-checked={checked} tabIndex={0}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      style={{
        display:"flex", alignItems:"center", gap:10, padding:"12px 10px", borderRadius:10, cursor:"pointer",
        background: checked ? "var(--green-selected-bg)" : "transparent",
      }}>
      {avatarColor !== undefined ? (
        <div style={{ width:28, height:28, borderRadius:"50%", background:avatarColor, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"var(--ink)", flexShrink:0 }}>
          {avatarInitials}
        </div>
      ) : (
        <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--green-selected-bg)", border:"1.5px solid var(--green)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Icon name="family" size={13} color="var(--green)" />
        </div>
      )}
      <div style={{ flex:1, fontSize:13.5, fontWeight:700, color: checked ? "var(--green)" : "var(--ink)" }}>{label}</div>
      <div style={{ width:20, height:20, borderRadius:6, border:`1.5px solid ${checked ? "var(--green)" : "var(--border2)"}`, background: checked ? "var(--green-selected-bg)" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        {checked && <Icon name="check" size={12} color="var(--green)" />}
      </div>
    </div>
  );

  return createPortal(
    <div style={{ position:"fixed", inset:0, zIndex:9996, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"flex-end" }}
      onClick={onClose}>
      <div style={{ background:"var(--sheet)", borderRadius:"20px 20px 0 0", padding:"20px 16px 32px", width:"100%", maxHeight:"80vh", overflowY:"auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div style={{ fontSize:16, fontWeight:900, color:"var(--ink)" }}>Scanner for</div>
          <button onClick={onClose} aria-label="Luk"
            style={{ background:"var(--surface)", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:18, color:"var(--ink)" }}>×</button>
        </div>
        <div style={{ fontSize:12, color:"var(--muted)", marginBottom:12, lineHeight:1.4 }}>
          Vælg hvilke profiler fremtidige scanninger skal tjekkes imod.
        </div>
        <Row id="all" label="Alle" checked={isAll} onClick={toggleAll} />
        <Row id="me" label={user.name || "Dig"} avatarColor="var(--green)" avatarInitials={initials(user.name || "Mig")}
          checked={!isAll && activeProfiles.includes("me")} onClick={() => toggleOne("me")} />
        {family.map(m => (
          <Row key={m.id} id={m.id} label={m.name} avatarColor={m.color} avatarInitials={initials(m.name)}
            checked={!isAll && activeProfiles.includes(m.id)} onClick={() => toggleOne(m.id)} />
        ))}
      </div>
    </div>,
    document.body
  );
}

// ── Kamera-kontrolknap med label (28. sept. 2026, FINAL POLISH – SCANNER,
// krav 1) ─────────────────────────────────────────────────────────────────
// De tre handlinger (Billede/Indtast/Lygte) var tidligere rene ikon-cirkler
// uden tekst — "for kryptiske alene" ifølge brugerens egen formulering.
// Ikon + kort label stablet lodret, samme diskrete mørke/blurrede pille-
// baggrund som før, men nu med en tekst under. `minWidth`/`minHeight:44`
// sikrer et reelt touch-target på mindst ca. 44×44pt (krav 14), selvom den
// synlige cirkel stadig er 34px — touch-fladen er større end det viste ikon.
function CamCtrlBtn({ icon, label, onClick, active, ariaLabel, ariaPressed }) {
  return (
    <button onClick={onClick} aria-label={ariaLabel || label} aria-pressed={ariaPressed}
      style={{
        display:"flex", flexDirection:"column", alignItems:"center", gap:3,
        background:"none", border:"none", cursor:"pointer", padding:"4px 6px",
        minWidth:44, minHeight:44, justifyContent:"center", fontFamily:"var(--f)",
      }}>
      <div style={{
        width:34, height:34, borderRadius:"50%",
        background: active ? "rgba(251,191,36,.4)" : "rgba(0,0,0,.45)",
        backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)",
        border: `1px solid ${active ? "rgba(251,191,36,.6)" : "rgba(255,255,255,.2)"}`,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <Icon name={icon} size={14} color={active ? "#fbbf24" : "#fff"} />
      </div>
      <span style={{ fontSize:9, fontWeight:700, color: active ? "#fbbf24" : "rgba(255,255,255,.92)", textShadow:"0 1px 2px rgba(0,0,0,.7)", whiteSpace:"nowrap" }}>{label}</span>
    </button>
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
  scanReady,
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
  cameraPermissionDenied,
  photoFallbackRef,
  scanPhotoForEan,
  setKnowledgeSlug,
  lookupProduct,
  alternatives,
  altLoading,
  onOpenHelp,
}) {
  const { user, userId, accessToken } = useAuthContext();
  const { activeProfiles, setActiveProfiles, family } = useProfileContext();
  const { screen, setScreen } = useNavigationContext();
  const { favorites, toggleFavorite, isFavorite } = useHistoryContext();

  // Parser OCR-tekst til liste af ingredienser


  // ── Guide modal state ─────────────────────────────────────────────────────
  const [showGuide, setShowGuide] = React.useState(false);
  const [manualEanError, setManualEanError] = React.useState("");
  const [manualEanValue, setManualEanValue] = React.useState("");
  const [showScanProfilePicker, setShowScanProfilePicker] = React.useState(false);

  // ── Dynamisk scanner-hjælpetekst (28. sept. 2026, FINAL POLISH – SCANNER,
  // krav 2) ───────────────────────────────────────────────────────────────
  // Én kort besked ad gangen, som ændrer sig med tiden siden kameraet blev
  // klar — IKKE en pixel-baseret lys-/genskin-detektion (findes ikke i
  // kodebasen og ville være en reel ny funktion at bygge, ikke "polish").
  // "Kan den ikke scannes?"-faldbacken (krav 3) styres separat af
  // `showPhotoHint`, som allerede findes i useScanner.js (sat efter 5s uden
  // et scan) men aldrig blev vist nogen steder i UI'et før denne runde.
  const [scanHint, setScanHint] = React.useState("Placér hele stregkoden i rammen");
  React.useEffect(() => {
    if (!scanReady) { setScanHint("Placér hele stregkoden i rammen"); return; }
    const t = setTimeout(() => setScanHint("Hold telefonen stille"), 3000);
    return () => clearTimeout(t);
  }, [scanReady]);

  // ── Kamera-permission-primer, første gang (28. sept. 2026, FINAL POLISH –
  // SCANNER, krav 10) ────────────────────────────────────────────────────
  // Kort, engangs-forklaring lige FØR browserens egen tilladelses-dialog
  // vises første gang appen har brug for kameraet — ikke en lang privacy-
  // forklaring, kun én sætning. `localStorage`-flag, samme mønster som
  // andre "vis kun første gang"-tilstande i appen (fx betaIntroSeen).
  const [showCameraPrimer, setShowCameraPrimer] = React.useState(false);
  const handleScanButtonClick = () => {
    let primerSeen = true;
    try { primerSeen = localStorage.getItem("as_camera_primer_seen") === "1"; } catch { /* ignoreres */ }
    if (primerSeen) { startCamera(); return; }
    setShowCameraPrimer(true);
  };
  const dismissCameraPrimer = () => {
    try { localStorage.setItem("as_camera_primer_seen", "1"); } catch { /* ignoreres */ }
    setShowCameraPrimer(false);
    startCamera();
  };

  // Åbner manuel EAN-indtastning frisk hver gang — rydder en evt. tidligere
  // værdi/fejl fra sidste åbning, i stedet for at genbruge et forladt
  // udkast (28. sept. 2026, FINAL POLISH – SCANNER, krav 7).
  const openManualEan = () => { setManualEanValue(""); setManualEanError(""); setShowManualEan(true); };

  // Luk kamera-visningen helt (28. sept. 2026, BUGFIX – scanner state) —
  // `stopCamera()` (useScanner.js) nulstiller selve kamera-/zoom-/fejl-
  // state, men ved intet om det manuelle EAN-panel, som er lokal state
  // her i ScannerScreen.jsx. Uden denne wrapper kunne panelet blive
  // stående åbent på Scan-forsiden efter et kamera-luk, hvis brugeren
  // havde åbnet det ("Indtast") mens kameraet stadig var aktivt. Panelet
  // skal kun kunne åbnes igen ved et aktivt tryk på "Indtast".
  const handleCloseCamera = () => {
    stopCamera();
    setShowManualEan(false);
    setManualEanValue("");
    setManualEanError("");
  };

  // Delt EAN-validering (krav 7/12) — to adskilte, specifikke fejltekster:
  // forkert LÆNGDE (kan slet ikke være en EAN) vs. korrekt længde men
  // ugyldig CHECKSUM (en formentlig tastefejl). `digits` er allerede
  // renset for alt andet end tal via input'ets onChange, men trimmes her
  // igen for en sikkerheds skyld ved direkte kald.
  const submitManualEan = (rawValue) => {
    const digits = rawValue.replace(/\D/g, "");
    if (![8, 12, 13, 14].includes(digits.length)) {
      setManualEanError("EAN-nummeret skal være 8 eller 13 cifre.");
      return;
    }
    if (!isValidEanChecksum(digits)) {
      setManualEanError("Stregkoden kunne ikke læses. Prøv igen.");
      return;
    }
    setShowManualEan(false); setManualEanError(""); setManualEanValue("");
    lookupProduct(digits);
  };
  const manualEanReadyLength = [8, 12, 13, 14].includes(manualEanValue.length);

  // Vælgeren vises kun når husstanden reelt har mere end én profil (mig +
  // mindst ét familiemedlem) — med kun én profil er der intet at vælge
  // imellem, og alle scanninger vurderes automatisk mod den ene profil
  // (25. sept. 2026, opfølgning). Dukker automatisk op igen når et første
  // familiemedlem tilføjes, og skjules igen hvis antallet falder til én.
  const scanProfilePickerAvailable = family.length > 0;

  // Kompakt label til "Scanner for: ..."-chippen (25. sept. 2026,
  // brugerfeedback) — "Alle" når alle profiler er aktive, personens navn ved
  // præcis én, ellers "N profiler".
  const scanProfileAllIds = ["me", ...family.map(m => m.id)];
  const scanProfileIsAll = scanProfilePickerAvailable && scanProfileAllIds.every(id => activeProfiles.includes(id));
  const scanProfileLabel = scanProfileIsAll
    ? "Alle"
    : activeProfiles.length === 1
      ? (activeProfiles[0] === "me" ? (user.name?.split(" ")[0] || "Dig") : (family.find(m => m.id === activeProfiles[0])?.name?.split(" ")[0] || "1 profil"))
      : `${activeProfiles.length} profiler`;

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

            {/* Kamera-permission-primer — vises KUN første gang, lige før
                browserens egen kamera-tilladelses-dialog (28. sept. 2026,
                FINAL POLISH – SCANNER, krav 10). Kort, ét sætning — ingen
                lang privacy-forklaring. */}
            {showCameraPrimer && (
              <div style={{ position:"fixed", inset:0, zIndex:9995, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
                onClick={dismissCameraPrimer}>
                <div style={{ background:"var(--paper)", borderRadius:20, padding:"24px 22px", maxWidth:320, textAlign:"center", boxShadow:"var(--sh2)" }}
                  onClick={e => e.stopPropagation()}>
                  <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
                    <div style={{ width:48, height:48, borderRadius:"50%", background:"var(--green-selected-bg)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Icon name="camera" size={22} color="var(--green)" />
                    </div>
                  </div>
                  <div style={{ fontSize:15, fontWeight:800, color:"var(--ink)", marginBottom:8 }}>
                    EatSafe bruger kameraet til at læse produktets stregkode.
                  </div>
                  <button className="btn btn-primary btn-full" onClick={dismissCameraPrimer} style={{ marginTop:6 }}>
                    Fortsæt
                  </button>
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
                    {/* Laser-linje — vises FØRST når kameraet reelt er i gang med at
                        afkode (scanReady), ikke bare når cameraActive er sat. cameraActive
                        bliver sat tidligere i useScanner.js's startCamera, mens html5-qrcode
                        stadig er ved at åbne kamera-streamen — uden dette gate ville linjen
                        kunne vises et øjeblik over et endnu ikke-levende kamerabillede. */}
                    {scanReady && (
                      <div style={{
                        position:"absolute", left:4, right:4, height:2,
                        background:"linear-gradient(90deg, transparent, var(--green), rgba(134,239,172,.8), var(--green), transparent)",
                        boxShadow:"0 0 8px var(--green), 0 0 16px var(--green)",
                        animation:"laserMove 1.8s ease-in-out infinite",
                        top:0,
                      }} />
                    )}
                  </div>
                </div>

                {/* Svævende kontroller oven på kameraet — luk separat til
                    venstre (uændret, ikon-kun), Billede/Indtast/Lygte til
                    højre med korte labels (28. sept. 2026, FINAL POLISH –
                    SCANNER, krav 1: "de nuværende ikoner er dog for
                    kryptiske alene"). Lygtens label skifter til "Lygte til"
                    når aktiv (krav 6/14 — statussen må ikke kun fremgå af
                    farven). */}
                <div style={{ position:"absolute", top:8, left:10, right:6, display:"flex", alignItems:"flex-start", justifyContent:"space-between", zIndex:2 }}>
                  <button onClick={handleCloseCamera} aria-label="Luk kamera"
                    style={{ ...S.camCtrlBtn, marginTop:5 }}>
                    <Icon name="x" size={15} color="#fff" />
                  </button>
                  <div style={{ display:"flex", gap:2 }}>
                    <CamCtrlBtn icon="image" label="Billede" ariaLabel="Vælg billede fra galleri" onClick={() => galleryInputRef.current?.click()} />
                    <CamCtrlBtn icon="edit" label="Indtast" ariaLabel="Indtast stregkode manuelt" onClick={() => openManualEan()} />
                    <CamCtrlBtn icon="flashlight" label={torchOn ? "Lygte til" : "Lygte"} ariaLabel={torchOn ? "Sluk lygte" : "Tænd lygte"} ariaPressed={torchOn} onClick={toggleTorch} active={torchOn} />
                  </div>
                </div>

                {/* Svævende hjælpetekst + zoom nederst over kameraet (28.
                    sept. 2026, FINAL POLISH – SCANNER, krav 2/3/5) — zoom-
                    indikatoren er REN INFORMATION (ingen tap-til-zoom findes,
                    kun den eksisterende auto-zoom), derfor holdt lille/let og
                    adskilt fra selve hjælpeteksten, i stedet for at erstatte
                    den helt som tidligere. Efter ca. 5s uden et scan
                    (`showPhotoHint`, sat i useScanner.js) erstattes den
                    almindelige, tidsstyrede hjælpetekst af en faldback med
                    direkte klikbare "Billede"/"Indtast EAN"-handlinger, så
                    brugeren aldrig står fast uden en vej videre. */}
                <div style={{ position:"absolute", bottom:14, left:"50%", transform:"translateX(-50%)", zIndex:2, display:"flex", flexDirection:"column", alignItems:"center", gap:6, maxWidth:"88%" }}>
                  {scanZoom > 1.0 && (
                    <div style={{ fontSize:10, fontWeight:600, color:"rgba(134,239,172,.85)", textShadow:"0 1px 2px rgba(0,0,0,.6)" }}>
                      {scanZoom}× zoom
                    </div>
                  )}
                  <div style={{ background:"rgba(0,0,0,.5)", backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)", borderRadius:14, padding:"7px 14px", fontSize:11.5, fontWeight:600, color:"rgba(255,255,255,.9)", textAlign:"center", lineHeight:1.4 }}>
                    {showPhotoHint ? (
                      <>
                        Kan den ikke scannes?{" "}
                        <span style={{ textDecoration:"underline", cursor:"pointer", color:"#fff", fontWeight:800 }}
                          onClick={() => openManualEan()}>Indtast EAN</span>
                        {" "}eller{" "}
                        <span style={{ textDecoration:"underline", cursor:"pointer", color:"#fff", fontWeight:800 }}
                          onClick={() => galleryInputRef.current?.click()}>vælg et billede</span>.
                      </>
                    ) : scanHint}
                  </div>
                </div>
              </div>
              <div id="qr-reader-gallery" style={S.none} />
              <input ref={galleryInputRef} type="file" accept="image/*" style={S.none}
                onChange={e => { if (e.target.files[0]) scanFromGallery(e.target.files[0]); e.target.value=""; }} />
              {/* Foto-fallback: åbner kamera direkte */}
              <input ref={photoFallbackRef} type="file" accept="image/*" capture="environment" style={S.none}
                onChange={e => { if (e.target.files[0]) scanPhotoForEan(e.target.files[0]); e.target.value=""; }} />

              {/* Forside-hero når kamera ikke er aktivt: hilsen + stor scan-
                  knap + Beta-info-fod, siddende oven på det app-brede
                  baggrundsbillede (.app-bg, theme.jsx — 25. sept. 2026:
                  Scan-forsidens eget foto blev gjort til det universelle
                  billede for hele appen, ikke længere Scan-specifikt),
                  ikke en <img> herinde. Det var oprindeligt en <img> direkte
                  i .home-hero-frame, men den udgave var begrænset til rummet
                  MELLEM topbar og bundnav (kunne aldrig dække kant-til-kant
                  uden en risikabel tilbagevenden til flex-fill-højde, se
                  HISTORY.md) — flyttet til app-bg-laget, som allerede dækker
                  hele skærmen pålideligt. .home-hero-frame giver stadig
                  boksen en
                  DEFINITIV calc(100dvh - Npx)-højde, så hilsen/knap altid er
                  synlige uden scroll — ren layout-container nu, intet visuelt
                  eget indhold. Alle mål er clamp(min, Ncqh, max) i stedet for
                  faste px, så indholdet skalerer NED sammen med boksen på
                  korte telefoner (og OP på store — hævet 24. sept. 2026 efter
                  feedback om at hele hero'en virkede for lille). "Prøv en
                  demo"-knappen er fjernet efter brugerens tidligere ønske —
                  bemærk at det var DENNE knaps eneste kald til setShowGuide
                  der åbnede DemoSlider-guiden ("App-guide"-knappen der
                  gjorde det samme var allerede fjernet som redundant) —
                  showGuide/DemoSlider herunder er nu urørt, men uden nogen
                  synlig indgang i UI'et. */}
              {!cameraActive && (
              <div className="home-hero-frame">
                <div style={{ position:"absolute", top:"calc(27% - 25px)", left:0, right:0, zIndex:1, textAlign:"center", padding:"0 12px" }}>
                  {/* Tykkere/større tekst + en blød hvid text-shadow-glød "løfter"
                      teksten af det app-brede baggrundsbillede bagved (.app-bg,
                      theme.jsx — samme billede på tværs af hele appen, se dens
                      kommentar), samme mønster som appens øvrige skærme bruger.
                      Flyttet 25px op (25. sept. 2026, opfølgning) sammen med
                      scan-knappen herunder — brugerens ønske om at rykke
                      hilsen/hjælpetekst/scanner-område ca. 20-30px op, ren fast
                      pixel-forskydning (calc) oven på den eksisterende
                      %-position, ikke en ny %-værdi — brugeren bad specifikt
                      om px, ikke en proportional flytning. */}
                  <div style={{ fontSize:"clamp(14px, 2.9cqh, 19px)", fontWeight:600, color:"var(--ink)", letterSpacing:"-.2px", textShadow:"0 1px 2px rgba(255,255,255,.85), 0 2px 14px rgba(255,255,255,.65)" }}>{getGreeting()},</div>
                  <div style={{ fontSize:"clamp(22px, 4.7cqh, 32px)", fontWeight:800, color:"var(--ink)", letterSpacing:"-.5px", marginTop:"clamp(2px, .4cqh, 4px)", textShadow:"0 1px 2px rgba(255,255,255,.85), 0 2px 14px rgba(255,255,255,.65)" }}>{user.name?.split(" ")[0] || "der"}</div>
                  <div style={{ fontSize:"clamp(11.5px, 2.1cqh, 15px)", fontWeight:600, color:"var(--ink2)", marginTop:"clamp(5px, 1.1cqh, 9px)", lineHeight:1.5, maxWidth:250, marginLeft:"auto", marginRight:"auto", textShadow:"0 1px 2px rgba(255,255,255,.85), 0 2px 12px rgba(255,255,255,.6)" }}>
                    {cameraPermissionDenied
                      ? "Kameraadgang er slået fra — brug Billede eller Indtast EAN i stedet."
                      : "Scan et produkt og se straks, om det matcher dine allergier."}
                  </div>
                </div>

                {/* Stor cirkulær scan-knap — grøn fyld (var(--green) → var(--green-dark)). Knappen
                    selv står nu STILLE (scanCtaBreathe-åndedrættet er fjernet
                    herfra 25. sept. 2026 — brugeren bad specifikt om puls "kun i"
                    halo-gløden, ikke selve knappen); al levende bevægelse ligger
                    nu udelukkende i .scan-cta-halo (langsom, subtil skala+
                    opacity-puls, se theme.jsx). Størrelsen er øget yderligere
                    ~12,5% denne runde (op fra clamp(117px, 30cqh, 195px) til
                    clamp(132px, 34cqh, 219px)) — en mindre, mere præcis
                    finjustering end forrige rundes ~30%. Ikonet er "scanframe"
                    (fire scanner-hjørner om stregkode-barer, samme visuelle
                    sprog som kameraets eget scan-overlay) — bevaret uændret.
                    Positionen er flyttet 25px op sammen med hilsen-blokken
                    ovenfor, men 7px mindre end teksten (calc(44% - 18px) i
                    stedet for calc(44% - 25px)) — en lille ekstra luft-
                    justering (25. sept. 2026, opfølgning) mellem hjælpe-
                    teksten og knappen, uden at ændre teksten selv. Selve
                    knappen er en rigtig <button> (ikke en div med role=
                    "button") for native tastatur-aktivering + pålidelig
                    :active-tryk-feedback på touch-enheder
                    (.scan-cta-btn:active, theme.jsx). En parallel session
                    forsøgte samme dag et hvidt ghost/outline-design med en
                    roterende ring-lys (mockup "C") — bevidst ikke genindført
                    ved sammenlægningen med main, se theme.jsx's kommentar
                    ved .scan-cta-halo for begrundelsen. */}
                {/* "Scanner for: ..."-chip (25. sept. 2026, brugerfeedback) —
                    diskret profilvælger, så brugeren altid kan se hvilke(n)
                    profil(er) scanninger vurderes imod. Placeret øverst i
                    .home-hero-frame (lige under topbaren), IKKE i mellemrummet
                    mellem hilsen og selve scan-knappen som først forsøgt —
                    målt empirisk med Playwright på tværs af iPhone SE/13/14
                    Pro Max at det mellemrum reelt er 0px allerede FØR chippen
                    (hilsenblokkens undertekst slutter bogstaveligt talt
                    præcis der hvor knappens egen top-anker starter, uden
                    indbygget slack) — der er ingen chip-højde, uanset hvor
                    kompakt, der kan indsættes der uden enten at overlappe
                    hilse-teksten eller knappen, som begge skal forblive
                    uændrede. Denne placering er den eneste der reelt har
                    ledig plads uden at røre nogen eksisterende positioner.
                    Vises kun når husstanden har mere end én profil (25.
                    sept. 2026, opfølgning) — med kun brugerens egen profil
                    er der intet at vælge imellem, se
                    scanProfilePickerAvailable ovenfor. */}
                {scanProfilePickerAvailable && (
                  <div style={{ position:"absolute", top:"clamp(8px, 2cqh, 16px)", left:0, right:0, zIndex:2, display:"flex", justifyContent:"center" }}>
                    <button type="button" onClick={() => setShowScanProfilePicker(true)}
                      style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(255,255,255,.82)", border:"1px solid var(--border)",
                        borderRadius:100, padding:"clamp(5px, 1.1cqh, 7px) clamp(11px, 2.2cqh, 14px)", cursor:"pointer",
                        boxShadow:"0 4px 12px -6px rgba(21,32,26,.3)", fontFamily:"var(--f)", maxWidth:"78%" }}>
                      <Icon name="family" size={12} color="var(--green)" />
                      <span style={{ fontSize:"clamp(10.5px, 1.9cqh, 12.5px)", fontWeight:700, color:"var(--ink2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        Scanner for: <span style={{ color:"var(--green)" }}>{scanProfileLabel}</span>
                      </span>
                      <Icon name="chevronDown" size={11} color="var(--muted)" />
                    </button>
                  </div>
                )}

                {showScanProfilePicker && scanProfilePickerAvailable && (
                  <ScanProfilePickerSheet
                    activeProfiles={activeProfiles} setActiveProfiles={setActiveProfiles}
                    family={family} user={user}
                    onClose={() => setShowScanProfilePicker(false)}
                  />
                )}

                {/* Kameraadgang nægtet: erstat den store scan-knap med en
                    tydelig, dedikeret besked + de to reelle alternativer
                    (28. sept. 2026, FINAL POLISH – SCANNER, krav 9) — IKKE
                    bare et lille rødt banner under en fortsat klikbar
                    scan-knap, der ellers ville slå fejl igen og igen. Ingen
                    "Åbn Indstillinger"-knap: der findes ingen cross-
                    browser/cross-platform JS-API til at åbne kamera-
                    tilladelser fra en PWA (samme genundersøgte konklusion
                    som Indstillinger → Notifikationer, se SettingsScreen.jsx). */}
                {cameraPermissionDenied ? (
                  <div style={{ position:"absolute", top:"calc(44% - 18px)", left:0, right:0, zIndex:1, display:"flex", justifyContent:"center", padding:"0 20px" }}>
                    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:20, padding:"20px 18px", maxWidth:300, width:"100%", textAlign:"center", boxShadow:"var(--sh2)" }}>
                      <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
                        <div style={{ width:44, height:44, borderRadius:"50%", background:"var(--red-lt)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <Icon name="block" size={20} color="var(--red)" />
                        </div>
                      </div>
                      <div style={{ fontSize:15, fontWeight:800, color:"var(--ink)", marginBottom:4 }}>Kameraadgang er slået fra</div>
                      <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5, marginBottom:16 }}>
                        Tillad kameraadgang for at scanne stregkoder — eller brug en af mulighederne nedenfor.
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={() => galleryInputRef.current?.click()}
                          style={{ flex:1, minHeight:44, padding:"10px", borderRadius:10, background:"var(--surface2)", border:"1px solid var(--border2)", fontFamily:"var(--f)", fontSize:12.5, fontWeight:700, color:"var(--ink)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                          <Icon name="image" size={13} color="var(--ink)" /> Billede
                        </button>
                        <button onClick={() => openManualEan()}
                          style={{ flex:1, minHeight:44, padding:"10px", borderRadius:10, background:"var(--green)", border:"none", fontFamily:"var(--f)", fontSize:12.5, fontWeight:800, color:"var(--on-green)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                          <Icon name="edit" size={13} color="var(--on-green)" /> Indtast EAN
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                <div style={{ position:"absolute", top:"calc(44% - 18px)", left:0, right:0, zIndex:1, display:"flex", justifyContent:"center" }}>
                  <div style={{ position:"relative", width:"clamp(132px, 34cqh, 219px)", height:"clamp(132px, 34cqh, 219px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <div className="scan-cta-halo" style={{ position:"absolute", inset:"clamp(-20px, -3.3cqh, -9px)", borderRadius:"50%",
                      background:"radial-gradient(circle, var(--green-halo) 0%, rgba(221,244,232,0) 70%)" }} aria-hidden="true" />
                    <button
                      className="scan-cta-btn"
                      onClick={handleScanButtonClick}
                      aria-label="Start kamera for at scanne stregkode"
                      style={{ position:"absolute", inset:"clamp(5px, 1.1cqh, 7px)", borderRadius:"50%", cursor:"pointer",
                        border:"none", fontFamily:"var(--f)",
                        background:"linear-gradient(160deg,var(--green) 0%,var(--green-dark) 100%)",
                        boxShadow:"0 14px 28px -12px rgba(8,115,74,.55), inset 0 2px 3px rgba(255,255,255,.3)",
                        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"clamp(6px, 1.5cqh, 10px)" }}>
                      <Icon name="scanframe" size="clamp(29px, 6.3cqh, 43px)" color="#fff" />
                      <div style={{ fontSize:"clamp(13px, 2.4cqh, 16px)", fontWeight:800, color:"#fff", letterSpacing:"-.2px" }}>Scan produkt</div>
                    </button>
                  </div>
                </div>
                )}

                {/* Den permanente "Beta-information"-knap er fjernet herfra
                    (25. sept. 2026, brugerfeedback) — Beta-introen vises nu
                    automatisk som en kort, engangs-overlay lige efter
                    onboarding trin 5 (se App.jsx's finishOnboard-wrapper),
                    og kan genåbnes manuelt via "Om EatSafe Beta" i
                    ProfileMenu.jsx i stedet for en fast knap på forsiden. */}
              </div>
              )}
            </div>}

            {/* Fejlbesked og manuel EAN-input — sjældne/betingede tilstande,
                kun vist ved behov. Pakket i en bund-sikret wrapper (padding
                matchende den gennemsigtige bundnav) så de ikke kan havne
                skjult/utrykbare bag den, nu hvor HOME-skærmens normale 110px
                bund-reserve er fjernet til fordel for hero-boksens
                kant-til-kant-udfyldning ovenfor. */}
            <div style={{ paddingBottom: (scanError || showManualEan) ? "calc(77px + env(safe-area-inset-bottom) + 12px)" : 0 }}>
            {/* Fejlbesked + Manuel EAN — kun til loggede */}
            {!!userId && <>
            {/* Fejlbesked fra kamera */}
            {scanError && (
              <div style={{ fontSize:12, color:"var(--red)", background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:8, padding:"8px 12px", marginBottom:8 }}>
                {scanError} — <span style={{ textDecoration:"underline", cursor:"pointer" }} onClick={() => openManualEan()}>Indtast manuelt</span>
              </div>
            )}

            {/* Manuel EAN-input — åbnes via "Indtast"-kontrollen i kameraet,
                eller herunder ved fejl. Kontrolleret input (28. sept. 2026,
                FINAL POLISH – SCANNER, krav 7) — `type="text"` +
                `inputMode="numeric"` i stedet for `type="number"` giver
                stadig et numerisk tastatur på mobil, men undgår number-
                inputtets egne kvirks (kan skrive "e"/"+"/"-", mister
                foranstillede nuller) og lader os selv trimme/filtrere
                ethvert ikke-ciffer-tegn (mellemrum, bindestreger fra en
                indsat stregkode) fortløbende i onChange. */}
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
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    enterKeyHint="search"
                    placeholder="fx 5712873099443"
                    autoFocus
                    className="field"
                    value={manualEanValue}
                    aria-label="EAN-nummer"
                    aria-invalid={!!manualEanError}
                    style={{ flex:1, fontSize:16, letterSpacing:1, borderColor: manualEanError ? "var(--red)" : undefined }}
                    onChange={e => { setManualEanValue(e.target.value.replace(/\D/g, "").slice(0, 14)); if (manualEanError) setManualEanError(""); }}
                    onKeyDown={e => { if (e.key === "Enter") submitManualEan(manualEanValue); }}
                  />
                  <button
                    disabled={!manualEanReadyLength}
                    style={{ padding:"0 16px", borderRadius:10, border:"none",
                      background: manualEanReadyLength ? "var(--green)" : "var(--border2)",
                      color: manualEanReadyLength ? "var(--on-green)" : "var(--muted)",
                      fontWeight:800, fontSize:14, cursor: manualEanReadyLength ? "pointer" : "default", fontFamily:"var(--f)", flexShrink:0, minHeight:44,
                      boxShadow: manualEanReadyLength ? "0 2px 12px rgba(14,143,90,.25)" : "none" }}
                    onClick={() => submitManualEan(manualEanValue)}>
                    Søg
                  </button>
                </div>
                {manualEanError ? (
                  <div style={{ fontSize:11, color:"var(--red)", marginTop:8, fontWeight:600 }} role="alert">{manualEanError}</div>
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
            onOpenHelp={onOpenHelp}
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
