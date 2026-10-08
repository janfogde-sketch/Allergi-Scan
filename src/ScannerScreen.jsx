// @ts-nocheck
import React, { Suspense } from "react";

import { SCREENS } from "./constants.jsx";
import { scanTargetCopy } from "./helpers.js";
import { LazyFallback } from "./SharedComponents.jsx";

import { primeBarcodeKeyboard } from "./barcodeKeyboard.js";

import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useDailyTip } from "./useDailyTip.js";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useHistoryContext } from "./HistoryContext.jsx";


import ResultScreen from "./ResultScreen.jsx";
import { renderScannerHome } from "./ScannerHome.jsx";



// Lazy: skærme brugeren ikke nødvendigvis besøger hver session, holdes ude af hoved-bundlet.
// ResultScreen er IKKE med her — den vises efter stort set hvert scan (hoved-flowet),
// så at lazy-loade den ville tilføje en indlæsnings-forsinkelse lige der hvor brugeren
// forventer et øjeblikkeligt svar. NotFoundScreen/SubmittedScreen rammes langt sjældnere.
const NotFoundScreen = React.lazy(() => import("./NotFoundScreen.jsx"));
const SubmittedScreen = React.lazy(() => import("./SubmittedScreen.jsx"));
const ListScreen = React.lazy(() => import("./ListScreen.jsx"));
const SuggestEditScreen = React.lazy(() => import("./SuggestEditScreen.jsx"));

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
  pauseCamera, resumeCamera,
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
  const [manualSubmitting, setManualSubmitting] = React.useState(false);
  const [manualTried, setManualTried] = React.useState(false);
  // Aktuel skærm i en ref, så et afsluttet opslag kan se, om appen er gået videre til resultatet.
  const screenRef = React.useRef(screen);
  React.useEffect(() => { screenRef.current = screen; }, [screen]);
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

  // Manuel indtastning i et bottom sheet (Bjørn, 8. okt. 2026). Arket åbner tomt hver gang, tastaturet åbnes i selve trykket
  // (iOS), og kameraet står stille, mens arket er åbent; det genoptages ved lukning.
  const openManualEan = () => {
    primeBarcodeKeyboard();
    setManualTried(false); setManualSubmitting(false);
    pauseCamera?.();
    setShowManualEan(true);
  };
  const closeManualEan = () => { setShowManualEan(false); resumeCamera?.(); };

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
  };

  // Søgning fra arket: koden er allerede valideret i arket. Lykkes opslaget, viser appen resultatet (eller "ikke fundet") via det
  // eksisterende flow, og kameraet lukkes som ved en scanning. Fejler det (fx offline), bliver arket stående med koden og fejlen.
  const submitManualEan = async (code) => {
    if (manualSubmitting) return;
    setManualSubmitting(true); setManualTried(true);
    try { await lookupProduct(code); } finally { setManualSubmitting(false); }
    if (screenRef.current !== SCREENS.HOME) { setShowManualEan(false); stopCamera(); }
  };

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
        {screen === SCREENS.HOME && renderScannerHome({
    activeProfiles, cameraActive, cameraPermissionDenied, closeManualEan, dailyTip, dismissCameraPrimer,
    family, galleryInputRef, handleCloseCamera, handleScanButtonClick, manualSubmitting, manualTried,
    openManualEan, photoFallbackRef, scanError, scanFromGallery, scanPhotoForEan, scanProfilePickerAvailable,
    scanReady, scanTarget, scanZoom, setActiveProfiles, setKnowledgeSlug, setScreen,
    setShowGuide, setShowScanProfilePicker, showCameraPrimer, showGuide, showManualEan, showPhotoHint,
    showScanProfilePicker, startCamera, submitManualEan, toggleTorch, toggleZoom, torchOn,
    user, userId, zoomSupported,
        })}
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
