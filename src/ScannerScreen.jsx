// @ts-nocheck
import React, { useState, useRef, Suspense } from "react";
import { createPortal } from "react-dom";
import { SCREENS, DEMO_CODES, DUMMY_PRODUCT, MOCK_PRODUCTS,
         ALLERGEN_EXAMPLES, E_NUMBERS, SUPABASE_URL, SUPABASE_ANON_KEY, uid } from "./constants.jsx";
import { compareAllergens, extractENumbers, compareENumbers, checkDietCompatibility, getAllergenLabels, verifiedBadge, makeHeaders, apiCall, timeAgo, isValidEanChecksum, initials, scanTargetCopy } from "./helpers.js";
import { Icon, IngredientsList, ProfileBadges, getProductIcon, ProductImage, LazyFallback, CloseButton } from "./SharedComponents.jsx";
import { DEMO_SLIDES } from "./demoSlides.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useDailyTip } from "./useDailyTip.js";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useHistoryContext } from "./HistoryContext.jsx";

import { CategorySelect } from "./MemberForm.jsx";
import ResultScreen from "./ResultScreen.jsx";
import { UI } from "./styleUtils.js";
import { useDialogA11y } from "./useDialogA11y.js";
import { getGreeting } from "./utils.jsx";
// Lazy: skærme brugeren ikke nødvendigvis besøger hver session, holdes ude af hoved-bundlet.
// ResultScreen er IKKE med her — den vises efter stort set hvert scan (hoved-flowet),
// så at lazy-loade den ville tilføje en indlæsnings-forsinkelse lige der hvor brugeren
// forventer et øjeblikkeligt svar. NotFoundScreen/SubmittedScreen rammes langt sjældnere.
const NotFoundScreen = React.lazy(() => import("./NotFoundScreen.jsx"));
const SubmittedScreen = React.lazy(() => import("./SubmittedScreen.jsx"));
const ListScreen = React.lazy(() => import("./ListScreen.jsx"));
const SuggestEditScreen = React.lazy(() => import("./SuggestEditScreen.jsx"));

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
  body12: { fontSize:12, color:"var(--muted)", lineHeight:1.5 },
  body13: { fontSize:13, color:"var(--muted)", lineHeight:1.5 },
  label: { fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 },
  dot: { width:28, height:28, borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  opacity6: { opacity:.6 },
  linkBtn: { width:"100%", background:"none", border:"none", cursor:"pointer", fontSize:12, fontWeight:700, color:"var(--muted)", fontFamily:"var(--f)" },
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
  const sheetRef = useRef(null);
  useDialogA11y(sheetRef, onClose);
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
      <div ref={sheetRef} role="dialog" aria-modal="true" aria-labelledby="scan-profile-title" tabIndex={-1}
        style={{ background:"var(--sheet)", borderRadius:"20px 20px 0 0", padding:"20px 16px 32px", width:"100%", maxHeight:"80vh", overflowY:"auto", outline:"none" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div id="scan-profile-title" style={{ fontSize:16, fontWeight:900, color:"var(--ink)" }}>Tjekker for</div>
          <CloseButton onClick={onClose} />
        </div>
        <div style={{ fontSize:12, color:"var(--muted)", marginBottom:12, lineHeight:1.4 }}>
          Vælg, hvem dine scanninger skal tjekkes for. Du kan vælge én eller flere.
        </div>
        {/* Aktuelt valg, opdateres med det samme ved hvert tryk (4. okt. 2026). */}
        <div aria-live="polite" style={{ fontSize:12.5, fontWeight:600, color:"var(--ink)", marginBottom:8 }}>
          Valgt nu: <span style={{ color:"var(--green)", fontWeight:800 }}>{isAll ? `Alle (${allIds.length} personer)` : scanTargetCopy(activeProfiles, family).chip}</span>
        </div>
        <Row id="all" label="Alle" checked={isAll} onClick={toggleAll} />
        <Row id="me" label={user.name ? `Dig (${user.name.trim().split(/\s+/)[0]})` : "Dig"} avatarColor="var(--green)" avatarInitials={initials(user.name || "Mig")}
          checked={!isAll && activeProfiles.includes("me")} onClick={() => toggleOne("me")} />
        {family.map(m => (
          <Row key={m.id} id={m.id} label={m.name} avatarColor={m.color} avatarInitials={initials(m.name)}
            checked={!isAll && activeProfiles.includes(m.id)} onClick={() => toggleOne(m.id)} />
        ))}
        <button type="button" className="btn btn-primary btn-full" onClick={onClose} style={{ marginTop:16 }}>Færdig</button>
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
// F3-8/F4-7 (6. okt. 2026): app-guiden og kamera-primeren som portal (position:fixed fanges ellers af
// .screen.fade-in's transform, CLAUDE.md §3 regel 4) med dialog-rolle, Esc og fokus.
function GuideSheet({ onClose }) {
  const sheetRef = useRef(null);
  useDialogA11y(sheetRef, onClose);
  return createPortal(
    <div style={{ position:"fixed", inset:0, zIndex:9995, background:"rgba(0,0,0,.7)", display:"flex", flexDirection:"column", justifyContent:"flex-end" }}
      onClick={onClose}>
      <div ref={sheetRef} role="dialog" aria-modal="true" aria-label="App-guide" tabIndex={-1}
        style={{ background:"var(--paper)", borderRadius:"20px 20px 0 0", overflow:"hidden", maxHeight:"90vh", overflowY:"auto", outline:"none" }}
        onClick={e => e.stopPropagation()}>
        <DemoSlider onClose={onClose} />
      </div>
    </div>,
    document.body
  );
}

function CameraPrimer({ onDismiss }) {
  const boxRef = useRef(null);
  useDialogA11y(boxRef, onDismiss);
  return createPortal(
    <div style={{ position:"fixed", inset:0, zIndex:9995, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={onDismiss}>
      <div ref={boxRef} role="dialog" aria-modal="true" aria-labelledby="camera-primer-title" tabIndex={-1}
        style={{ background:"var(--paper)", borderRadius:20, padding:"24px 22px", maxWidth:320, textAlign:"center", boxShadow:"var(--sh2)", outline:"none" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
          <div style={{ width:48, height:48, borderRadius:"50%", background:"var(--green-selected-bg)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Icon name="camera" size={22} color="var(--green)" />
          </div>
        </div>
        <div id="camera-primer-title" style={{ fontSize:15, fontWeight:800, color:"var(--ink)", marginBottom:8 }}>
          EatSafe bruger kameraet til at læse produktets stregkode.
        </div>
        <button className="btn btn-primary btn-full" onClick={onDismiss} style={{ marginTop:6 }}>
          Fortsæt
        </button>
      </div>
    </div>,
    document.body
  );
}

function CamCtrlBtn({ icon, label, onClick, active, ariaLabel, ariaPressed }) {
  return (
    <button onClick={onClick} aria-label={ariaLabel || label} aria-pressed={ariaPressed}
      style={{
        display:"flex", flexDirection:"column", alignItems:"center", gap:3,
        background:"none", border:"none", cursor:"pointer", padding:"4px 6px",
        minWidth:44, minHeight:44, justifyContent:"center", fontFamily:"var(--f)",
      }}>
      <div style={{
        width:38, height:38, borderRadius:"50%",
        background: active ? "#fff" : "rgba(0,0,0,.45)",
        backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)",
        border:"1px solid rgba(255,255,255,.2)",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <Icon name={icon} size={17} color={active ? "var(--ink)" : "#fff"} />
      </div>
      <span style={{ fontSize:10.5, fontWeight:600, color:"#fff", textShadow:"0 1px 2px rgba(0,0,0,.7)", whiteSpace:"nowrap" }}>{label}</span>
    </button>
  );
}

export default function ScannerScreen({
  scanResult, notFoundEan,
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
  activeIds, activeLevels,
  activeENumbers,
  handleEditProductCapture,
  handleImageCapture, handleProductImageCapture,
  editProductImage,
  editProductImageB64,
  scanFromGallery,
  startCamera,
  stopCamera,
  toggleTorch,
  torchOn,
  scanZoom,
  zoomSupported,
  toggleZoom,
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
  autoStartScan, onAutoStartHandled,
}) {
  const { user, userId, accessToken } = useAuthContext();
  // Scan-profiler = egne profiler + husstandens skrivebeskyttede konti (App.jsx, 1. okt. 2026).
  const { activeProfiles, setActiveProfiles, scanFamily: family, allergens: myAllergens } = useProfileContext();
  const { screen, setScreen } = useNavigationContext();
  const { favorites, toggleFavorite, isFavorite } = useHistoryContext();

  // Parser OCR-tekst til liste af ingredienser


  // ── Guide modal state ─────────────────────────────────────────────────────
  const [showGuide, setShowGuide] = React.useState(false);
  const [manualEanError, setManualEanError] = React.useState("");
  const [manualEanValue, setManualEanValue] = React.useState("");
  const [showScanProfilePicker, setShowScanProfilePicker] = React.useState(false);

  // ── Kamera-permission-primer, første gang (28. sept. 2026, FINAL POLISH –
  // SCANNER, krav 10) ────────────────────────────────────────────────────
  // Kort, engangs-forklaring lige FØR browserens egen tilladelses-dialog
  // vises første gang appen har brug for kameraet — ikke en lang privacy-
  // forklaring, kun én sætning. `localStorage`-flag, samme mønster som
  // andre "vis kun første gang"-tilstande i appen (fx dismissede hints).
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

  // "Scan nu" fra tom historik: åbn kameraet (med primer første gang) når scanneren monteres
  React.useEffect(() => {
    if (!autoStartScan) return;
    onAutoStartHandled?.();
    handleScanButtonClick();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bevidst: kører kun når autostart-flaget skifter; handleren læser friske værdier ved kaldet
  }, [autoStartScan]);

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
      setManualEanError("Stregkodenummeret skal have 8 eller 13 cifre.");
      return;
    }
    if (!isValidEanChecksum(digits)) {
      setManualEanError("Nummeret er ikke et gyldigt EAN. Tjek at alle cifre er tastet rigtigt.");
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

  // Dynamiske tekster til forklaringen og "Tjekker for: …"-chippen (4. okt.
  // 2026): "Dig" / fornavn / "N personer", og en forklaring der passer til
  // samme situation. Uden familie er det altid brugeren selv.
  const scanTarget = scanTargetCopy(scanProfilePickerAvailable ? activeProfiles : ["me"], family);

  // "Vidste du, at …" (4. okt. 2026): dagens tip fra Allergileksikonet, helst om et allergen, der tjekkes for.
  const tipProfileIds = scanProfilePickerAvailable ? activeProfiles : ["me"];
  const tipAllergenIds = [
    ...(tipProfileIds.includes("me") ? (myAllergens || []) : []),
    ...family.filter(m => tipProfileIds.includes(m.id)).flatMap(m => m.allergens || []),
  ];
  const dailyTip = useDailyTip(tipAllergenIds);

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
            {showGuide && <GuideSheet onClose={() => setShowGuide(false)} />}

            {/* Kamera-permission-primer — vises KUN første gang, lige før
                browserens egen kamera-tilladelses-dialog (28. sept. 2026,
                FINAL POLISH – SCANNER, krav 10). Kort, ét sætning — ingen
                lang privacy-forklaring. */}
            {showCameraPrimer && <CameraPrimer onDismiss={dismissCameraPrimer} />}

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
                {/* Scanner overlay (Bjørn, 8. okt. 2026): fast layout, der ikke
                    flytter sig under scanningen. Luk øverst til venstre, lygte
                    øverst til højre, rammen i midten med tynde hjørner og en rolig
                    linje i EatSafe-grøn, instruktion under rammen og 2×-zoom lige
                    over rammen. "Vælg billede"/"Indtast kode" står under
                    kamerabilledet, og hjælpeteksten efter 5 s har en fast plads. */}
                <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
                  <div style={{
                    position:"absolute", top:72, bottom:66, left:"6%", right:"6%",
                    boxShadow:"0 0 0 9999px rgba(0,0,0,.32)", borderRadius:12,
                  }}>
                    {["tl","tr","bl","br"].map(key => (
                      <div key={key} style={{
                        position:"absolute",
                        top: key.startsWith("t") ? 0 : "auto",
                        bottom: key.startsWith("b") ? 0 : "auto",
                        left: key.endsWith("l") ? 0 : "auto",
                        right: key.endsWith("r") ? 0 : "auto",
                        width:26, height:26,
                        borderColor:"var(--green)", borderStyle:"solid", borderWidth:0,
                        borderTopWidth: key.startsWith("t") ? 2 : 0,
                        borderBottomWidth: key.startsWith("b") ? 2 : 0,
                        borderLeftWidth: key.endsWith("l") ? 2 : 0,
                        borderRightWidth: key.endsWith("r") ? 2 : 0,
                        borderTopLeftRadius: key==="tl" ? 12 : 0,
                        borderTopRightRadius: key==="tr" ? 12 : 0,
                        borderBottomLeftRadius: key==="bl" ? 12 : 0,
                        borderBottomRightRadius: key==="br" ? 12 : 0,
                      }} />
                    ))}
                    {/* Linjen vises først, når kameraet reelt afkoder (scanReady).
                        Den flyttes med transform (ikke top), så den ikke belaster
                        kameraet eller afkodningen. */}
                    {scanReady && (
                      <div className="scan-sweep">
                        <div className="scan-sweep-line" />
                      </div>
                    )}
                  </div>
                  <div style={{ position:"absolute", bottom:42, left:16, right:16, textAlign:"center", fontSize:13, fontWeight:600, color:"#fff", textShadow:"0 1px 3px rgba(0,0,0,.7)" }}>
                    Placér stregkoden inden for rammen
                  </div>
                  {/* Hjælpeteksten har en fast plads under instruktionen og toner
                      kun ind (opacity), så intet flytter sig. */}
                  <div aria-live="polite" className={"scan-hint" + (showPhotoHint ? " on" : "")}>
                    Kan stregkoden ikke scannes? Prøv at justere afstanden.
                  </div>
                </div>

                <div style={{ position:"absolute", top:10, left:10, right:10, display:"flex", alignItems:"flex-start", justifyContent:"space-between", zIndex:2 }}>
                  <CamCtrlBtn icon="x" label="Luk" ariaLabel="Luk kamera" onClick={handleCloseCamera} />
                  <CamCtrlBtn icon="flashlight" label={torchOn ? "Lygte til" : "Lygte"} ariaLabel={torchOn ? "Sluk lygte" : "Tænd lygte"} ariaPressed={torchOn} onClick={toggleTorch} active={torchOn} />
                </div>
                {zoomSupported && (
                  <button onClick={toggleZoom} aria-label={scanZoom >= 2 ? "Slå zoom fra" : "Zoom 2 gange ind"} aria-pressed={scanZoom >= 2}
                    style={{
                      position:"absolute", top:38, left:"50%", transform:"translateX(-50%)", zIndex:2,
                      width:44, height:28, padding:0, borderRadius:999,
                      fontFamily:"var(--f)", fontSize:12, fontWeight:700, cursor:"pointer",
                      background: scanZoom >= 2 ? "#fff" : "rgba(0,0,0,.45)",
                      color: scanZoom >= 2 ? "var(--ink)" : "#fff",
                      border:"1px solid rgba(255,255,255,.3)",
                    }}>
                    2×
                  </button>
                )}
              </div>
              {cameraActive && (
                <div className="scan-actions">
                  <button className="btn btn-outline scan-action" onClick={() => galleryInputRef.current?.click()}>
                    <Icon name="image" size={18} /> Vælg billede
                  </button>
                  <button className="btn btn-outline scan-action" onClick={() => openManualEan()}>
                    <Icon name="edit" size={18} /> Indtast kode
                  </button>
                </div>
              )}
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
                {/* Forankret i BUNDEN (4. okt. 2026, Bjørn): sidste tekstlinje står altid
                    præcis 28 px over den grønne cirkel på alle telefoner (cirklen starter calc(44% - 45px) + insettet
                    clamp(5px,1.1cqh,7px), se scan-knappen nedenfor), og en forklaring på tre
                    linjer vokser OPAD i stedet for ned mod knappen. Tidligere top:calc(27% - 62px)
                    gav kun 3-5 px luft, når teksten fik tre linjer. Knappen er ikke flyttet. */}
                <div style={{ position:"absolute", bottom:"calc(56% + 45px - clamp(5px, 1.1cqh, 7px) + 28px)", left:0, right:0, zIndex:1, textAlign:"center", padding:"0 12px" }}>
                  {/* Tykkere/større tekst + en blød hvid text-shadow-glød "løfter"
                      teksten af det app-brede baggrundsbillede bagved (.app-bg,
                      theme.jsx — samme billede på tværs af hele appen, se dens
                      kommentar), samme mønster som appens øvrige skærme bruger.
                      Flyttet 25px op (25. sept. 2026, opfølgning), igen 25px op
                      (29. sept. 2026, "en mere balanceret og rolig forside"),
                      og igen 12px op (29. sept. 2026, opfølgning — samlet 62px
                      op fra den oprindelige %-position) sammen med
                      scan-knappen herunder — ren fast pixel-forskydning (calc)
                      oven på den eksisterende %-position, ikke en ny %-værdi —
                      brugeren bad specifikt om px, ikke en proportional
                      flytning. Selve blokkens interne spacing (hilsen→navn→
                      hjælpetekst) er urørt, kun den fælles ydre position. */}
                  <div style={{ fontSize:"clamp(14px, 2.9cqh, 19px)", fontWeight:600, color:"var(--ink)", letterSpacing:"-.2px", textShadow:"0 1px 2px rgba(255,255,255,.85), 0 2px 14px rgba(255,255,255,.65)" }}>{getGreeting()},</div>
                  {/* Ingen fallback-tekst her (var tidligere "der", fejlrapporteret
                      25. sept. 2026: "der" blev vist kortvarigt, før navnet nåede
                      at blive hentet) — user.name er tomt indtil App.jsx's loadAll-
                      fetch resolver, og et gættet ord er værre end intet, mens vi
                      venter. Linjen popper ind med navnet, i stedet for at skifte
                      fra et forkert ord til det rigtige. Et hårdt mellemrum holder
                      linjens højde, så layoutet ikke hopper, når navnet kommer. */}
                  <div style={{ fontSize:"clamp(22px, 4.7cqh, 32px)", fontWeight:800, color:"var(--ink)", letterSpacing:"-.5px", marginTop:"clamp(2px, .4cqh, 4px)", textShadow:"0 1px 2px rgba(255,255,255,.85), 0 2px 14px rgba(255,255,255,.65)" }}>{(user.name || "").trim().split(/\s+/)[0] || "\u00A0"}</div>
                  {/* fontWeight 600→500 (29. sept. 2026, "en mere balanceret
                      og rolig forside") — lettere visuelt, så den ikke
                      konkurrerer med navnet (800) eller scan-knappen;
                      størrelse/placering urørt. */}
                  <div style={{ fontSize:"clamp(11.5px, 2.1cqh, 15px)", fontWeight:500, color:"var(--ink2)", marginTop:"clamp(5px, 1.1cqh, 9px)", lineHeight:1.5, maxWidth:250, marginLeft:"auto", marginRight:"auto", textShadow:"0 1px 2px rgba(255,255,255,.85), 0 2px 12px rgba(255,255,255,.6)" }}>
                    {cameraPermissionDenied
                      ? "Kameraadgang er slået fra — brug Billede eller Indtast EAN i stedet."
                      : scanTarget.intro}
                  </div>
                </div>

                {/* Stor cirkulær scan-knap — grøn fyld (var(--green) → var(--green-dark)). Knappen
                    selv står nu STILLE (scanCtaBreathe-åndedrættet er fjernet
                    herfra 25. sept. 2026 — brugeren bad specifikt om puls "kun i"
                    halo-gløden, ikke selve knappen); al levende bevægelse ligger
                    nu udelukkende i .scan-cta-wave (bølgeringe, 7. okt. 2026; før halo, skala+
                    opacity-puls, se theme.jsx). Størrelsen er reduceret ~10%
                    denne runde (29. sept. 2026, "en mere balanceret og rolig
                    forside" — knappen må stadig være hovedfokus, men ikke
                    dominere hele skærmen; ned fra clamp(132px, 34cqh, 219px)
                    til clamp(119px, 30cqh, 197px)), efter tidligere runders
                    forøgelser (senest ~12,5% op til 132/34/219). Ikonet er
                    "scanframe" (fire scanner-hjørner om stregkode-barer,
                    samme visuelle sprog som kameraets eget scan-overlay) —
                    bevaret uændret i størrelse. Positionen er flyttet
                    yderligere 25px op sammen med hilsen-blokken ovenfor
                    (29. sept. 2026, "en mere balanceret og rolig forside"),
                    og igen 2px op (29. sept. 2026, opfølgning — hilsen-
                    blokken flyttede 12px, men knappen kun 2px af dem, så de
                    resterende 10px i stedet blev til MERE luft mellem
                    hjælpeteksten og knappen, som bedt om). Samlet
                    calc(44% - 45px), 17px mindre end hilsen-blokkens egen
                    forskydning (62px) — den luft-justering mellem
                    hjælpeteksten og knappen som allerede fandtes (7px), plus
                    de nye 10px. Selve
                    knappen er en rigtig <button> (ikke en div med role=
                    "button") for native tastatur-aktivering + pålidelig
                    :active-tryk-feedback på touch-enheder
                    (.scan-cta-btn:active, theme.jsx). En parallel session
                    forsøgte samme dag et hvidt ghost/outline-design med en
                    roterende ring-lys (mockup "C") — bevidst ikke genindført
                    ved sammenlægningen med main, se theme.jsx's kommentar
                    ved .scan-cta-wave for begrundelsen. */}
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
                    som Indstillinger → Notifikationer, se SettingsScreen.jsx).
                    "Scanner for: ..."-chippen (25. sept. 2026, brugerfeedback
                    — diskret profilvælger) er 29. sept. 2026 flyttet fra sin
                    egen position øverst i .home-hero-frame til HERINDE, som
                    normal flow-barn (marginTop, ikke egen absolut position)
                    lige under knappen/kortet, i samme fælles absolut
                    positionerede flex-kolonne — brugerens eksplicitte ønske
                    om at knap + chip "næsten opleves som én funktionel
                    gruppe", 16-20px mellemrum, i stedet for langt fra
                    hinanden øverst/midt på skærmen. Størrelsen er UÆNDRET
                    (samme kompakte mål som forrige runde). Vises kun når
                    husstanden har mere end én profil, se
                    scanProfilePickerAvailable ovenfor. */}
                <div style={{ position:"absolute", top:"calc(44% - 45px)", left:0, right:0, zIndex:1, display:"flex", flexDirection:"column", alignItems:"center" }}>
                  {cameraPermissionDenied ? (
                    <div style={{ display:"flex", justifyContent:"center", padding:"0 20px", width:"100%" }}>
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
                    <div style={{ position:"relative", width:"clamp(119px, 30cqh, 197px)", height:"clamp(119px, 30cqh, 197px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {/* Bølgeringe (Bjørn, 7. okt. 2026, forslag A i roligt tempo): tre tynde grønne ringe glider
                          ud fra knappen og forsvinder, forskudt i tid. Erstatter den tidligere halo-glød. Slås fra ved "Reducer bevægelse" (theme.jsx). */}
                      <div className="scan-cta-wave" aria-hidden="true" />
                      <div className="scan-cta-wave w2" aria-hidden="true" />
                      <div className="scan-cta-wave w3" aria-hidden="true" />
                      <button
                        className="scan-cta-btn"
                        onClick={handleScanButtonClick}
                        aria-label="Start kamera for at scanne stregkode"
                        style={{ position:"absolute", inset:"clamp(5px, 1.1cqh, 7px)", borderRadius:"50%", cursor:"pointer",
                          border:"none", fontFamily:"var(--f)",
                          // Gradient og lyst skær bevidst bevaret (Bjørn, 7. okt. 2026): knappen skal ligne den gamle;
                          // en bevidst undtagelse fra "ingen gradienter" i BRAND.md. Kun bølgeringene er nye.
                          background:"linear-gradient(160deg,var(--green) 0%,var(--green-dark) 100%)",
                          boxShadow:"0 14px 28px -12px rgba(8,115,74,.4), inset 0 2px 3px rgba(255,255,255,.3)",
                          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"clamp(5px, 1.4cqh, 9px)" }}>
                        {/* Ikon/tekst/gap skaleret ~10% ned sammen med selve
                            knappen (samme runde) — bevarer de oprindelige
                            proportioner mellem indhold og knap, i stedet for
                            at ikon/tekst pludselig fylder relativt mere i en
                            mindre cirkel. */}
                        <Icon name="scanframe" size="clamp(26px, 5.7cqh, 39px)" color="#fff" />
                        <div style={{ fontSize:"clamp(12px, 2.2cqh, 14px)", fontWeight:800, color:"#fff", letterSpacing:"-.2px" }}>Scan produkt</div>
                      </button>
                    </div>
                  )}
                  {scanProfilePickerAvailable && (
                    // marginTop:11, ikke 16-20 direkte — knappen selv sidder
                    // inset:clamp(5px,1.1cqh,7px) inde i sin egen kant-til-
                    // kant container ovenfor, så det FAKTISKE mellemrum
                    // mellem den synlige grønne cirkel og chippen (målt med
                    // Playwright) bliver marginTop + det inset, samlet
                    // ~16-20px som bedt om.
                    <div style={{ marginTop:11 }}>
                      {/* maxWidth ændret fra "78%" til en fast 260px — chippen
                          sidder nu i en shrink-to-fit flex-kolonne (ikke
                          længere en fuld-bredde række), hvor en %-bredde ikke
                          har noget defineret grundlag at regne ud fra og
                          trak teksten forkert sammen ("Scanner ..." i stedet
                          for "Scanner for: Alle"). En fast px-værdi løser det
                          og er rigeligt inden for appens 480px-loft. */}
                      {/* Hele pillen er én knap (4. okt. 2026): lidt højere
                          kontrast, kraftigere kant og chevron, hover/tryk/åben-
                          tilstand i .scan-profile-chip (theme.jsx). Stadig
                          hvid og lille, så den aldrig konkurrerer med Scan. */}
                      <button type="button" className="scan-profile-chip" onClick={() => setShowScanProfilePicker(true)}
                        aria-haspopup="dialog" aria-expanded={showScanProfilePicker}
                        aria-label={`Tjekker for: ${scanTarget.chip}. Skift hvem der tjekkes for`}>
                        <Icon name="family" size={12} color="var(--green)" />
                        <span style={{ fontSize:"clamp(10.5px, 1.8cqh, 12px)", fontWeight:600, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          Tjekker for: <span style={{ color:"var(--green)", fontWeight:800 }}>{scanTarget.chip}</span>
                        </span>
                        <Icon name="chevronDown" size={12} color="var(--ink2)" />
                      </button>
                    </div>
                  )}
                </div>

                {/* "Vidste du, at …" (4. okt. 2026, Bjørn): lille, rolig info-kort nederst over bundnavigationen,
                    under profilvælgeren. Kun godkendte tips fra Allergileksikonet (knowledge_base.tips), ét pr. dag,
                    ingen animation. Skjules på meget lave skærme (.scan-tip, container-query i theme.jsx), og når
                    kameraadgang er nægtet (det kort fylder selv). Linket åbner den præcise artikel. */}
                {dailyTip && !cameraPermissionDenied && (
                  // Kompakt (4. okt. 2026, Bjørn): hele kortet er én knap til artiklen. En diskret chevron til højre i
                  // første linje viser, at man kan trykke; "Læs mere i Allergileksikonet" står kun i aria-label.
                  <button type="button" className="scan-tip"
                    aria-label={`Vidste du, at … ${dailyTip.text} Læs mere i Allergileksikonet`}
                    onClick={() => { setKnowledgeSlug(dailyTip.slug); setScreen(SCREENS.KNOWLEDGE); }}>
                    <span className="scan-tip-head">
                      <Icon name="bulb" size={12} color="var(--green)" />
                      <span className="scan-tip-title">Vidste du, at …</span>
                      <span aria-hidden="true" style={{ display:"flex", flexShrink:0 }}><Icon name="chevronRight" size={14} color="var(--muted)" /></span>
                    </span>
                    <span className="scan-tip-text">{dailyTip.text}</span>
                  </button>
                )}

                {/* Sikkerhedsinformationen kan genåbnes fra menuen/Indstillinger (SafetyInfoModal), ikke fra en fast knap her. */}
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
                  <span style={{ margin:-10 }}><CloseButton onClick={() => setShowManualEan(false)} plain /></span>
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
                      boxShadow: manualEanReadyLength ? "var(--sh-green)" : "none" }}
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
        {screen === SCREENS.LIST && (
          <Suspense fallback={LazyFallback}>
          <ListScreen
            activeIds={activeIds}
            activeLevels={activeLevels}
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

    </>
  );
}
