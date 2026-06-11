// @ts-nocheck
import React, { useState, Suspense, useEffect, useCallback, useRef } from "react";

// ─── BUILD INFO (injiceres af Vite ved build-tid) ─────────────────────────────
import {
  SUPABASE_URL, SUPABASE_ANON_KEY, ALLERGENS, SCREENS, DIETS,
  AVATAR_COLORS, HOME_TIPS, DEMO_CODES, DUMMY_PRODUCT, MOCK_PRODUCTS,
  ALLERGEN_EXAMPLES, E_NUMBERS, E_CATEGORIES,
  MADPAS_LANGUAGES, ALLERGEN_T, MADPAS_INTRO,
  PAGE_IDS, uid
} from "./constants.jsx";

import {
  initials, timeAgo, getAllergenLabels, verifiedBadge,
  makeHeaders, apiCall, compareAllergens,
  extractENumbers, compareENumbers,
  traceId, traceLog, getTraceLog
} from "./helpers.js";

import {
  EatSafeLogo, Icon, IngredientsList, ProfileBadges,
  getProductIcon, ProductImage
} from "./SharedComponents.jsx";

import { ENumberPicker } from "./AllergenPicker.jsx";
import { MemberForm, CategorySelect } from "./MemberForm.jsx";
const AdminScreen = React.lazy(() => import('./AdminScreen.jsx'));
import OnboardingScreen from './OnboardingScreen.jsx';
import MadpasScreen from './MadpasScreen.jsx';
import ProfileScreen from './ProfileScreen.jsx';
import ScannerScreen from './ScannerScreen.jsx';
const RecipesScreen = React.lazy(() => import('./RecipesScreen.jsx'));
const KnowledgeScreen = React.lazy(() => import('./KnowledgeScreen.jsx'));
import ErrorBoundary from './ErrorBoundary.jsx';
import { useNavigation } from './useNavigation.js';
import { useOffline, saveToOfflineCache, getFromOfflineCache } from './useOffline.js';

import { appCss } from './theme.jsx';
import { BUILD_TIME, COMMIT_SHA, formatBuildTime, getGreeting, buildScreenLabel } from './utils.jsx';
import { useShoppingList } from './useShoppingList.js';
import { useFamily } from './useFamily.js';
import { useHistory } from './useHistory.js';
import { useAuth } from './useAuth.js';
import { useOnboarding } from './useOnboarding.js';
import { useAdmin } from './useAdmin.js';
import { useScanner } from './useScanner.js';
import { useRecipes } from './useRecipes.js';
import { useProduct } from './useProduct.js';
import { useMadpas } from './useMadpas.js';
import { useSearch } from './useSearch.js';
import { useAlternatives } from './useAlternatives.js';
import FeedbackModal from './FeedbackModal.jsx';


// ─── HOVED KOMPONENT ─────────────────────────────────────────────────────────

export default function EatSafe() {
  // Auth state → useAuth hook

  // UI state
  const [screen, setScreen] = useState(() => localStorage.getItem("as_token") ? SCREENS.HOME : SCREENS.WELCOME);

  // User data
  const [user, setUser] = useState({ name:"", age:"", email:"", phone:"", password:"", role:"" });
  const [allergens, setAllergens] = useState([]);
  const [customAllerg, setCustomAllerg] = useState([]);
  // → useFamily hook (family, setFamily)
  const [activeProfiles, setActiveProfiles] = useState(["me"]);

  // Scan state
  const [showIng, setShowIng] = useState(true); // Automatisk åben
  const [showNutrition, setShowNutrition] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const productCacheRef = useRef({}); // Cache af seneste 50 scannede produkter
  const [profilePopup, setProfilePopup] = useState(null); // id af profil der vises popup for
  const [knowledgeSlug, setKnowledgeSlug] = useState(null);

  // History → useHistory hook

  // Admin → useAdmin hook (kaldet efter useAuth nedenfor)

  // Shopping list
  // → useShoppingList hook

  // Search
    // Favorites → useHistory hook
  const [madpasLang, setMadpasLang] = useState(() => localStorage.getItem("as_madpas_lang") || "en");
  const [madpasProfileId, setMadpasProfileId] = useState("self");
  // madpasActiveProfile → computed after hooks (uses family)
  // Recipes → useRecipes hook (kaldet efter useAuth nedenfor)

  const [showManualEan, setShowManualEan] = useState(false);
  const [selectedENumbers, setSelectedENumbers] = useState([]);
  const [allergenSubtypes, setAllergenSubtypes] = useState({}); // { "laktose": "laktose_protein", ... }
  const [activeSubtypeModal, setActiveSubtypeModal] = useState(null); // allergen id der vises modal for
  const [eSearch, setESearch] = useState("");
  const [eCategory, setECategory] = useState("alle");

  const [showSafeOnly, setShowSafeOnly] = useState(false);


  // Family form → useFamily hook

  // Auth form

  // NOT FOUND flow
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [betaIntroSeen, setBetaIntroSeen] = useState(true); // Beta-info er nu i onboarding, overlay kun via knap
  const [betaIntroStep, setBetaIntroStep] = useState(0);

  // (adminTickets, openTicket, ticketsLoading, ocrImagePreview → useAdmin hook)

  // ── TOKEN HELPERS ──────────────────────────────────────────────────────────




  // ── ADMIN → useAdmin hook ──

    // ── KAMERA + SCANNING ──────────────────────────────────────────────────────

  // ── OCR + INDSEND PRODUKT ─────────────────────────────────────────────────










  // ── ADMIN FUNKTIONER → useAdmin hook ──

  // loadRecipes, loadRecipeIngredients, submitUserRecipe → useRecipes hook

    // loadShoppingList → useShoppingList
  // addToList → useShoppingList
  // toggleItem → useShoppingList
  // removeItem → useShoppingList
  // ── FAMILIE ────────────────────────────────────────────────────────────────
  // addMember → useFamily
  // removeMember → useFamily


    // ── HJÆLPEKOMPONENTER ──────────────────────────────────────────────────────

  // ── MADPAS SPEAK → useMadpas hook ──────────────────────────────────────────
  const { madpasSpeaking, setMadpasSpeaking, madpasBig, setMadpasBig,
          madpasWaiterView, setMadpasWaiterView, langOpen, setLangOpen,
          madpasSpeak } = useMadpas({
    allergens, customAllerg, selectedENumbers, user, madpasLang, family, madpasProfileId
  });

  // ── CUSTOM HOOKS ──────────────────────────────────────────────────────────
  const {
    accessToken, setAccessToken, refreshToken, setRefreshToken,
    userId, setUserId,
    loginEmail, setLoginEmail, loginPassword, setLoginPassword,
    authError, setAuthError, authLoading, setAuthLoading,
    authTab, setAuthTab, isOAuth, setIsOAuth,
    saveTokens, clearAuth, handleLogin, handleSignup, handleOAuth,
  } = useAuth({ setScreen, setUser, setAllergens, setCustomAllerg,
                onSignupSuccess: () => setOnboardStep(0) });

  const {
    shoppingList, setShoppingList,
    shoppingListId, setShoppingListId,
    newItemName, setNewItemName,
    loadShoppingList, addToList, toggleItem, removeItem, clearDone,
  } = useShoppingList({ accessToken, userId });

  const {
    family, setFamily,
    newMemberName, setNewMemberName,
    newMemberBirthYear, setNewMemberBirthYear,
    newMemberGender, setNewMemberGender,
    newMemberAllerg, setNewMemberAllerg,
    newMemberCustomAllerg, setNewMemberCustomAllerg,
    newMemberDiets, setNewMemberDiets,
    newMemberENumbers, setNewMemberENumbers,
    newMemberSubtypes, setNewMemberSubtypes,
    newMemberCustomInput, setNewMemberCustomInput,
    loadFamily, addMember, removeMember,
  } = useFamily({ accessToken, userId, setActiveProfiles });

  const {
    history, setHistory,
    historyLoading,
    favorites, setFavorites,
    loadHistory, saveHistoryEntry, toggleFavorite, isFavorite,
  } = useHistory({ accessToken, userId });

  const {
    onboardStep, setOnboardStep,
    editMode, setEditMode,
    tourIdx, setTourIdx,
    customInput, setCustomInput,
    saveProfileStep1, saveAllergensStep2, finishOnboard,
  } = useOnboarding({ accessToken, userId, user, loginEmail,
                      allergens, customAllerg,
                      setUser, setScreen, setEditMode: () => {}, setIsOAuth });

  // Admin → useAdmin hook
  const {
    submissions, setSubmissions, submissionsLoading, adminStats,
    adminSection, setAdminSection, adminUsers, setAdminUsers, adminUsersLoading,
    adminTicketFilter, setAdminTicketFilter, showDeleteAccount, setShowDeleteAccount,
    deleteConfirmText, setDeleteConfirmText, deletingAccount,
    openAdminUser, setOpenAdminUser, userSearch, setUserSearch,
    userSearchParam, setUserSearchParam, openSubmission, setOpenSubmission,
    submissionFilter, setSubmissionFilter, editingSubmission, setEditingSubmission,
    cleaningOcr, cleanedOcrText, setCleanedOcrText,
    adminTickets, openTicket, setOpenTicket, ticketsLoading,
    ocrImagePreview, setOcrImagePreview,
    loadSubmissions, deleteOwnAccount, loadAdminStats, loadTickets,
    loadAdminUsers, updateUserRole, deleteUser,
    updateSubmissionAndApprove, rejectSubmission, updateTicketStatus, cleanOcrWithAI,
  } = useAdmin(accessToken, userId, clearAuth);

  // ── Manglende EAN'er ──────────────────────────────────────────────────────
  const [missingEans, setMissingEans] = useState([]);
  const [missingEansLoading, setMissingEansLoading] = useState(false);

  const loadMissingEans = async () => {
    setMissingEansLoading(true);
    try {
      const data = await apiCall(
        `${SUPABASE_URL}/rest/v1/missing_ean_log?select=ean,count,first_seen,last_seen&order=count.desc&limit=100`,
        { headers: makeHeaders(accessToken) }
      );
      if (Array.isArray(data)) setMissingEans(data);
    } catch {}
    setMissingEansLoading(false);
  };

  const deleteMissingEan = async (ean) => {
    try {
      await apiCall(
        `${SUPABASE_URL}/rest/v1/missing_ean_log?ean=eq.${encodeURIComponent(ean)}`,
        { method: "DELETE", headers: makeHeaders(accessToken) }
      );
      setMissingEans(prev => prev.filter(r => r.ean !== ean));
    } catch {}
  };

  // Recipes → useRecipes hook
  const {
    recipes, setRecipes, recipesLoading,
    selectedRecipe, setSelectedRecipe,
    recipeIngredients, setRecipeIngredients,
    recipeFilter, setRecipeFilter,
    favoriteRecipes, setFavoriteRecipes,
    showSubmitRecipe, setShowSubmitRecipe,
    submitRecipe, setSubmitRecipe,
    submitSteps, setSubmitSteps,
    submitIngredients, setSubmitIngredients,
    submittingRecipe,
    recipeTermsOpen, setRecipeTermsOpen,
    completedSteps, setCompletedSteps,
    recipeTermsAccepted, setRecipeTermsAccepted,
    recipeServings, setRecipeServings,
    recipeSearch, setRecipeSearch,
    recipeSafeOnly, setRecipeSafeOnly,
    loadRecipes, loadRecipeIngredients, submitUserRecipe,
  } = useRecipes(accessToken, userId);

  // ── Familie-invitation accept ────────────────────────────────────────────
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get("invite");
    if (!inviteToken || !accessToken || !userId) return;

    // Fjern token fra URL uden reload
    const url = new URL(window.location.href);
    url.searchParams.delete("invite");
    url.searchParams.delete("login");
    window.history.replaceState({}, "", url.toString());

    // Accepter invitation via RPC
    const acceptInvite = async () => {
      try {
        const data = await apiCall(
          `${SUPABASE_URL}/rest/v1/rpc/accept_family_invite`,
          {
            method: "POST",
            headers: makeHeaders(accessToken),
            body: JSON.stringify({ p_token: inviteToken }),
          }
        );
        if (data?.success) {
          // Genindlæs familie-data
          loadFamily();
          alert("🎉 Invitation accepteret! Jeres familieoplysninger er nu delt.");
        } else if (data?.error) {
          alert("Invitation fejlede: " + data.error);
        }
      } catch { /* ignorer */ }
    };
    acceptInvite();
  }, [accessToken, userId]);

  // ── OFF Import ───────────────────────────────────────────────────────────────
  const [importLog, setImportLog] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  const runImport = async (execute = true) => {
    if (!execute) return; // ved tab-skift viser vi bare UI uden at køre
    setImportLoading(true);
    setImportLog(null);
    try {
      const data = await apiCall(
        `${SUPABASE_URL}/functions/v1/auto-import-off`,
        {
          method: "POST",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({}),
        }
      );
      setImportLog(data);
    } catch (e) {
      setImportLog({ ok: false, error: e.message, stats: { imported:0, not_on_off:0, error:1 }, log: [] });
    }
    setImportLoading(false);
  };

  // ── Router — browser back-knap support ──────────────────────────────────
  const { navigate, goBack, canGoBack } = useNavigation(screen, setScreen, SCREENS);
  const isOffline = useOffline();

  const [notFoundEan, setNotFoundEan] = useState("");
  const {
    scanResult, setScanResult,
    loading, setLoading,
    scanError, setScanError,
    notFoundStep, setNotFoundStep,
    submitting,
    ocrText, setOcrText,
    ocrLoading, setOcrLoading,
    ocrImageBase64, setOcrImageBase64,
    productImagePreview, setProductImagePreview,
    productImageBase64, setProductImageBase64,
    proposedName, setProposedName,
    proposedFlags, setProposedFlags,
    proposedNutrition, setProposedNutrition,
    proposedNotes, setProposedNotes,
    editStep, setEditStep,
    editIngText, setEditIngText,
    editNote, setEditNote,
    editType, setEditType,
    editProductImage, setEditProductImage,
    editProductImageB64, setEditProductImageB64,
    editOcrLoading, setEditOcrLoading,
    editOcrText, setEditOcrText,
    handleProductImageCapture,
    handleImageCapture,
    nutritionOcrLoading,
    handleNutritionCapture,
    handleEditProductCapture,
    submitProduct,
  } = useProduct({ accessToken, userId, activeProfiles,
                   notFoundEan, setNotFoundEan,
                   setScreen });

  // Ryd familie/historik/indkøb når auth cleares (accessToken → null)
  React.useEffect(() => {
    if (!accessToken) {
      setFamily([]);
      setHistory([]);
      setShoppingList([]);
    }
  }, [accessToken]);

  // ── Load brugerdata ved login ─────────────────────────────────────────────
  React.useEffect(() => {
    if (!accessToken || !userId) return;

    const loadAll = async () => {
      try {
        // Brugerprofil
        const profile = await apiCall(
          `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=name,email,phone,birth_year,gender,role,onboarding_completed&limit=1`,
          { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
        );
        if (Array.isArray(profile) && profile[0]) {
          const p = profile[0];
          setUser(u => ({
            ...u,
            name: p.name || u.name || "",
            email: p.email || u.email || "",
            phone: p.phone || "",
            age: p.birth_year ? String(p.birth_year) : "",
            gender: p.gender || "",
            role: p.role || "user",
          }));
        }

        // Allergener
        const allergenData = await apiCall(
          `${SUPABASE_URL}/rest/v1/user_allergens?user_id=eq.${userId}&select=allergen,type`,
          { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
        );
        if (Array.isArray(allergenData)) {
          setAllergens(allergenData.filter(a => a.type === "allergen").map(a => a.allergen));
          setCustomAllerg(allergenData.filter(a => a.type === "custom").map(a => a.allergen));
        }

        // Familie + indkøb
        loadFamily();
        loadShoppingList();
      } catch (e) {
        console.error("loadAll fejl:", e);
      }
    };

    loadAll();
  }, [accessToken, userId]);

  const isOnboard = screen === SCREENS.WELCOME || screen === SCREENS.LOGIN || screen === SCREENS.ONBOARD || editMode;

  const FamilyChips = () => {
    const allIds = ["me", ...family.map(m => m.id)];
    const isAll = allIds.every(id => activeProfiles.includes(id));
    const toggleAll = () => setActiveProfiles(isAll ? ["me"] : allIds);
    const toggleOne = (id) => {
      if (isAll) { setActiveProfiles([id]); return; }
      const next = activeProfiles.includes(id) ? activeProfiles.filter(x => x !== id) : [...activeProfiles, id];
      setActiveProfiles(next.length === 0 ? [id] : next);
    };
    return (
      <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
        <div className={`ap-chip${isAll?" on":""}`} onClick={toggleAll}>Hele familien</div>
        <div className={`ap-chip${!isAll&&activeProfiles.includes("me")?" on":""}`} onClick={() => toggleOne("me")}>
          <div style={{width:20,height:20,borderRadius:"50%",background:"var(--green)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff"}}>{initials(user.name||"Mig")}</div>
          {(user.name||"Mig").split(" ")[0]}
        </div>
        {family.map(m => (
          <div key={m.id} className={`ap-chip${!isAll&&activeProfiles.includes(m.id)?" on":""}`} onClick={() => toggleOne(m.id)}>
            <div style={{width:20,height:20,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff"}}>{initials(m.name)}</div>
            {m.name.split(" ")[0]}
          </div>
        ))}
      </div>
    );
  };

  const StepBar = ({ total, current }) => (
    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:22 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`step-seg${i <= current-1 ? " done" : ""}`} />
      ))}
      <span className="step-num">{current}/{total}</span>
    </div>
  );

  const greeting = getGreeting();

  // ── SCANNER CORE ──────────────────────────────────────────────────────────
  const allActive = useCallback(() => {
    const ids = new Set(activeProfiles.includes("me") ? allergens : []);
    const eNums = new Set(activeProfiles.includes("me") ? selectedENumbers : []);
    family.filter(m => activeProfiles.includes(m.id)).forEach(m => {
      (m.allergens || []).forEach(a => ids.add(a));
      (m.eNumbers || []).forEach(e => eNums.add(e));
    });
    return { ids: [...ids], custom: [...customAllerg], eNumbers: [...eNums] };
  }, [allergens, customAllerg, selectedENumbers, family, activeProfiles]);

  const activeIds = allActive().ids;
  const activeENumbers = allActive().eNumbers;

  
  // ── SCANNER ───────────────────────────────────────────────────────────────
  const {
    cameraActive, setCameraActive,
    torchOn, setTorchOn,
    scanZoom,
    showPhotoHint, setShowPhotoHint,
    photoScanLoading,
    galleryInputRef,
    photoFallbackRef,
    lastScannedRef,
    startCamera,
    stopCamera,
    scanFromGallery,
    scanPhotoForEan,
    toggleTorch,
  } = useScanner({
    setScanError,
    setLoading,
    onScanSuccess: (code) => lookupProductRef.current?.(code),
    accessToken,
  });

  // Ref der altid peger på den seneste lookupProduct (undgår TDZ-cirkulær afhænighed)
  const lookupProductRef = useRef(null);

const lookupProduct = useCallback(async (ean) => {
    if (!ean?.trim()) return;
    if (navigator.vibrate) navigator.vibrate(40);
    const tid = traceId("scan");
    traceLog(tid, "scan:start", { ean: ean.trim() });
    const cached = productCacheRef.current[ean.trim()] || getFromOfflineCache(ean.trim());
    if (cached) {
      traceLog(tid, "scan:cache-hit");
      setScanResult(cached); setScreen(SCREENS.RESULT);
      return;
    }
    // Offline uden cache — vis besked
    if (!navigator.onLine) {
      setScanError("Du er offline og dette produkt er ikke i den lokale cache.");
      setLoading(false); return;
    }
    setLoading(true); setScanResult(null); setScanError(""); setShowIng(false);
    try {
      const data = await apiCall(`${SUPABASE_URL}/functions/v1/products/${ean.trim()}`, {
        headers: makeHeaders(accessToken),
      });
      traceLog(tid, "scan:product-response", { found: data.found, name: data.product?.name });
      if (!data.found) {
        traceLog(tid, "scan:not-found");
        setNotFoundEan(ean.trim());
        await saveHistoryEntry(ean.trim(), null, "not_found", {}, activeProfiles);
        setLoading(false); setScreen(SCREENS.NOTFOUND); setNotFoundStep(1);
        setOcrText(""); setProposedName("");
        setProposedFlags(Object.fromEntries(ALLERGENS.map(a => [a.id, false])));
        setProductImagePreview(null); setProductImageBase64(null);
        return;
      }
      let product = data.product;
      const variantLabel = product.variant_label || null;

      // ── Canonical opslag: hent allergen-data fra master-produkt ──────────
      if (product.canonical_ean) {
        try {
          const canonicalData = await apiCall(
            `${SUPABASE_URL}/rest/v1/products?ean=eq.${product.canonical_ean}&select=allergen_flags,ingredients,nutrition,verified_status,source&limit=1`,
            { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
          );
          if (Array.isArray(canonicalData) && canonicalData[0]) {
            const c = canonicalData[0];
            // Behold variant-navn men brug canonical allergen-data
            product = {
              ...product,
              allergen_flags: c.allergen_flags || product.allergen_flags,
              ingredients: c.ingredients || product.ingredients,
              nutrition: c.nutrition || product.nutrition,
              verified_status: c.verified_status || product.verified_status,
              source: c.source || product.source,
            };
          }
        } catch { /* Brug variant-data som fallback */ }
      }

      const flags = product.allergen_flags || data.allergen_flags || {};
      const { status, matchedDanger, matchedWarning, hasUnknown } = compareAllergens(flags, activeIds);

      // Udtræk E-numre fra ingredienstekst
      const ingredientsText = product.ingredients || data.ingredients?.raw_text || product.ingredients_text || "";
      const productENumbers = extractENumbers(ingredientsText);
      const { matched: matchedENumbers } = compareENumbers(productENumbers, activeENumbers);

      const flagList = [
        ...matchedDanger.map(id => ({ type:"bad", text:`Indeholder ${ALLERGENS.find(a=>a.id===id)?.label||id}` })),
        ...matchedWarning.map(id => ({ type:"maybe", text:`Kan indeholde spor af ${ALLERGENS.find(a=>a.id===id)?.label||id}` })),
        ...(hasUnknown ? [{ type:"maybe", text:"Visse allergener er ukendte — tjek altid pakken" }] : []),
        ...(matchedDanger.length===0 && matchedWarning.length===0 && !hasUnknown ? [{ type:"good", text:"Ingen af dine allergener fundet" }] : []),
        ...(matchedENumbers.length > 0 ? [{ type:"maybe", text:`Indeholder overvågede E-numre: ${matchedENumbers.join(", ")}` }] : []),
      ];
      const headlines = { safe:"Sikkert produkt", danger:"Indeholder allergen", warn:"Mulige spor" };
      const summaries = {
        safe:"Ingen af dine registrerede allergener er fundet i dette produkt.",
        danger:`Produktet indeholder ${matchedDanger.map(id=>ALLERGENS.find(a=>a.id===id)?.label||id).join(", ")}.`,
        warn:`Produktet kan indeholde spor af ${matchedWarning.map(id=>ALLERGENS.find(a=>a.id===id)?.label||id).join(", ")}.`,
      };
      const familyImpact = [];
      if (family.length > 0) {
        for (const member of family.filter(m => activeProfiles.includes(m.id))) {
          const memberResult = compareAllergens(flags, member.allergens || []);
          if (memberResult.matchedDanger.length > 0 || memberResult.matchedWarning.length > 0) {
            familyImpact.push({ name:member.name, color:member.color, danger:memberResult.matchedDanger, warning:memberResult.matchedWarning });
          }
        }
      }
      const result = {
        code: ean.trim(), name: product.name || "Ukendt produkt", brand: product.brand || "",
        variant_label: variantLabel,
        image_url: product.image_url || null, category: product.category || null,
        ingredients: ingredientsText,
        productENumbers,
        nutrition: product.nutrition || data.nutrition || null,
        verified_status: product.verified_status || "unverified", source: product.source || data.source,
        status, headline: headlines[status], summary: summaries[status],
        flags: flagList, allergen_flags: flags, matchedDanger, matchedWarning, matchedENumbers, familyImpact, hasUnknown,
        timestamp: Date.now(),
      };
      productCacheRef.current[ean.trim()] = result;
      saveToOfflineCache(ean.trim(), result);
      const cacheKeys = Object.keys(productCacheRef.current);
      if (cacheKeys.length > 50) delete productCacheRef.current[cacheKeys[0]];
      traceLog(tid, "scan:result", { ean: ean.trim(), name: result.name, status, matchedDanger, matchedWarning });
      setScanResult(result);
      setHistory(h => [result, ...h].slice(0, 50));
      await saveHistoryEntry(ean.trim(), product.id, status, flags, activeProfiles);
      // Hent alternativer hvis produktet er farligt eller har spor
      if (status === "danger" || status === "warn") {
        loadAlternatives(result.category, ean.trim());
      } else {
        clearAlternatives();
      }
      setScreen(SCREENS.RESULT);
    } catch (e) { traceLog(tid, "scan:error", { error: e.message }); setScanError("Der opstod en fejl. Tjek din forbindelse og prøv igen."); }
    setLoading(false);
  }, [accessToken, activeIds]);
  lookupProductRef.current = lookupProduct;

// ── SØGNING → useSearch hook ────────────────────────────────────────────────
  const { searchQuery, setSearchQuery, searchCategory, setSearchCategory,
          searchResults, setSearchResults, searchLoading } = useSearch({ accessToken });

  const { alternatives, altLoading, loadAlternatives, clearAlternatives } = useAlternatives({ accessToken, activeIds });

  // ── COMPUTED (afhænger af hooks) ─────────────────────────────────────────
  const madpasActiveProfile = madpasProfileId === "self" ? null : family.find(m => m.id === madpasProfileId);
  const mpAllergens = madpasActiveProfile ? (madpasActiveProfile.allergens || []) : allergens;
  const mpCustom = madpasActiveProfile ? (madpasActiveProfile.customAllerg || []) : customAllerg;

  // ── Android tilbageknap ─────────────────────────────────────────────────────
  React.useEffect(() => {
    // Push en state så vi kan fange tilbageknap
    window.history.pushState({ screen: "app" }, "");
    const handleBack = (e) => {
      // Forhindre at vi navigerer væk fra appen
      e.preventDefault();
      window.history.pushState({ screen: "app" }, "");
      // Navigér inden i appen i stedet
      if (helpOpen) { setHelpOpen(false); return; }
      if (feedbackOpen) { setFeedbackOpen(false); return; }
      if (profilePopup) { setProfilePopup(null); return; }
      if (cameraActive) { stopCamera(); return; }
      if (screen === SCREENS.RESULT || screen === SCREENS.NOTFOUND || screen === SCREENS.SUGGEST_EDIT || screen === SCREENS.SEARCH) {
        setScreen(SCREENS.HOME);
        return;
      }
      if (screen === SCREENS.ADMIN) { setScreen(SCREENS.PROFILE); return; }
      // På HOME — gør ingenting (forhindrer logout)
    };
    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, [screen, helpOpen, feedbackOpen, profilePopup, cameraActive]);

  // ── RENDER ─────────────────────────────────────────────────────────────────
  // Load admin stats when entering admin screen
  React.useEffect(() => {
    if (screen === SCREENS.ADMIN && user?.role === "admin") {
      loadAdminStats();
    }
  }, [screen, user?.role]);

  return (
    <>
      <style>{appCss}</style>
      <div className="app" role="application" aria-label="EatSafe">
        {/* Skip-link for tastatur/screen reader brugere */}
        <a href="#main-content" className="skip-link">Spring til indhold</a>

        {/* ══ VELKOMST ══ */}
        {/* ══ ONBOARDING SCREENS ══ */}
        {(screen === SCREENS.WELCOME || screen === SCREENS.LOGIN || screen === SCREENS.ONBOARD || editMode) && (
          <OnboardingScreen
            screen={screen} setScreen={setScreen}
            authTab={authTab} setAuthTab={setAuthTab}
            authError={authError} setAuthError={setAuthError}
            authLoading={authLoading}
            loginEmail={loginEmail} setLoginEmail={setLoginEmail}
            loginPassword={loginPassword} setLoginPassword={setLoginPassword}
            user={user} setUser={setUser}
            onboardStep={onboardStep} setOnboardStep={setOnboardStep}
            allergens={allergens} setAllergens={setAllergens}
            customAllerg={customAllerg} setCustomAllerg={setCustomAllerg}
            selectedENumbers={selectedENumbers} setSelectedENumbers={setSelectedENumbers}
            activeSubtypeModal={activeSubtypeModal} setActiveSubtypeModal={setActiveSubtypeModal}
            family={family} setFamily={setFamily}
            activeProfiles={activeProfiles} setActiveProfiles={setActiveProfiles}
            isOAuth={isOAuth}
            tourIdx={tourIdx} setTourIdx={setTourIdx}
            editMode={editMode} setEditMode={setEditMode}
            history={history} setHistory={setHistory}
            shoppingList={shoppingList} setShoppingList={setShoppingList}
            newMemberName={newMemberName} setNewMemberName={setNewMemberName}
            newMemberBirthYear={newMemberBirthYear} setNewMemberBirthYear={setNewMemberBirthYear}
            newMemberGender={newMemberGender} setNewMemberGender={setNewMemberGender}
            newMemberAllerg={newMemberAllerg} setNewMemberAllerg={setNewMemberAllerg}
            newMemberCustomAllerg={newMemberCustomAllerg} setNewMemberCustomAllerg={setNewMemberCustomAllerg}
            newMemberDiets={newMemberDiets} setNewMemberDiets={setNewMemberDiets}
            newMemberENumbers={newMemberENumbers} setNewMemberENumbers={setNewMemberENumbers}
            newMemberSubtypes={newMemberSubtypes} setNewMemberSubtypes={setNewMemberSubtypes}
            newMemberCustomInput={newMemberCustomInput} setNewMemberCustomInput={setNewMemberCustomInput}
            customInput={customInput} setCustomInput={setCustomInput}
            handleLogin={handleLogin} handleSignup={handleSignup} handleOAuth={handleOAuth}
            saveAllergensStep2={saveAllergensStep2}
            saveProfileStep1={saveProfileStep1} finishOnboard={finishOnboard}
            StepBar={StepBar}
            buildLabel={formatBuildTime()}
          />
        )}
        {/* TOPBAR */}
        {!isOnboard && (
          <header className="topbar">
            <div className="topbar-logo">
              <div className="topbar-shield" style={{background:"none",padding:0}}><EatSafeLogo size={34} variant="light" /></div>
              <div className="topbar-name">Eat<span>Safe</span></div>
              <div style={{ background:"var(--amber)", color:"#fff", fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:100, letterSpacing:".5px", marginLeft:4, marginTop:2 }}>BETA</div>
            </div>
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              {/* Hjælp-knap */}
              <button onClick={() => setHelpOpen(true)}
                style={{ background:"var(--paper2)", border:"1px solid var(--border2)", borderRadius:"50%", width:32, height:32, fontFamily:"var(--f)", fontSize:15, fontWeight:800, color:"var(--muted2)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                ?
              </button>
              {/* Feedback-knap */}
              <button onClick={() => { setFeedbackOpen(true); setFeedbackDone(false); }}
                style={{ background:"var(--paper2)", border:"1px solid var(--border2)", borderRadius:100, padding:"5px 12px", fontFamily:"var(--f)", fontSize:11, fontWeight:700, color:"var(--muted2)", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                Feedback
              </button>
            </div>
          </header>
        )}

        {/* Feedback-knap under onboarding */}
        {isOnboard && (
          <div style={{ position:"fixed", top:12, right:12, zIndex:1000 }}>
            <button onClick={() => { setFeedbackOpen(true); setFeedbackDone(false); }}
              style={{ background:"var(--paper2)", backdropFilter:"blur(8px)", border:"1px solid var(--border2)", borderRadius:100, padding:"5px 12px", fontFamily:"var(--f)", fontSize:11, fontWeight:700, color:"var(--ink2)", cursor:"pointer", display:"flex", alignItems:"center", gap:5, boxShadow:"0 2px 8px rgba(0,0,0,.15)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              Feedback
            </button>
          </div>
        )}

        {/* ══ HJÆLP MODAL ══ */}
        {helpOpen && (() => {
          const helpContent = {
            "home": { title:"📷 Scanner", tips:[
              { icon:"📱", title:"Skan stregkode", desc:"Tryk på scan-feltet og hold kameraet roligt over stregkoden. Appen scanner automatisk." },
              { icon:"🔍", title:"Søg manuelt", desc:"Kan du ikke scanne? Brug søgefeltet til at finde produkter ved navn." },
              { icon:"⚡", title:"Hurtig scanning", desc:"God belysning og rolig hånd giver hurtigere og mere præcist resultat." },
              { icon:"📜", title:"Historik", desc:"Dine seneste scanninger gemmes automatisk — find dem under Profil." },
            ]},
            "recipes": { title:"🍝 Opskrifter", tips:[
              { icon:"🔍", title:"Søg og filtrer", desc:"Søg på navn eller vælg kategori. Slå 'Kun sikre' til for at skjule opskrifter med dine allergener." },
              { icon:"❤️", title:"Favoritter", desc:"Tryk hjerte-ikonet for at gemme en opskrift til Favoritter-fanen." },
              { icon:"👤", title:"Portionsjustering", desc:"Åbn en opskrift og tryk + / − for at skalere ingredienser automatisk." },
              { icon:"🛒", title:"Indkøbsliste", desc:"Tryk 'Tilføj til indkøbsliste' for at sende ingredienser direkte til din liste." },
            ]},
            "list": { title:"🛒 Indkøbsliste", tips:[
              { icon:"✏️", title:"Tilføj varer", desc:"Skriv en vare og tryk Tilføj — eller tilføj direkte fra en opskrift." },
              { icon:"✓", title:"Afkryds varer", desc:"Tryk på en vare for at markere den som købt." },
              { icon:"🗑️", title:"Ryd listen", desc:"Brug 'Ryd' for at fjerne alle afkrydsede varer på én gang." },
            ]},
            "profile": { title:"👤 Profil & præferencer", tips:[
              { icon:"🚨", title:"Allergi vs. intolerance", desc:"Tryk én gang = intolerance (gul advarsel). To gange = allergi (rød advarsel)." },
              { icon:"👨‍👩‍👧", title:"Familie", desc:"Opret profiler for børn og partner — se allergencheck for alle på én gang." },
              { icon:"✏️", title:"E-numre og diæter", desc:"Brug 'Tilføj eget' for intoleranser, E-numre eller diæter der ikke er på listen." },
            ]},
            "madpas": { title:"🌍 Madpas", tips:[
              { icon:"🌐", title:"Vælg sprog", desc:"Vælg sproget for landet du besøger. EatSafe oversætter dine allergier automatisk." },
              { icon:"📋", title:"Vis til tjeneren", desc:"Tryk 'Vis til tjener' for en stor, tydelig skærm du kan vise restaurantpersonalet." },
              { icon:"🔊", title:"Oplæsning", desc:"Tryk højttalerikonet for at høre udtalen på det lokale sprog." },
            ]},
          };
          const content = helpContent[screen] || { title:"ℹ️ Hjælp", tips:[
            { icon:"💬", title:"Send feedback", desc:"Brug Feedback-knappen øverst til at rapportere problemer eller forslag." },
          ]};
          return (
            <div style={{ position:"fixed", inset:0, zIndex:9998, background:"rgba(0,0,0,.85)", display:"flex", alignItems:"flex-end" }}
              onClick={e => e.target === e.currentTarget && setHelpOpen(false)}>
              <div style={{ background:"#1a3012", borderRadius:"20px 20px 0 0", padding:"20px 16px 32px", width:"100%", maxHeight:"80vh", overflowY:"auto" }}
                onClick={e => e.stopPropagation()}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                  <div style={{ fontSize:18, fontWeight:900, color:"var(--ink)" }}>{content.title}</div>
                  <button onClick={() => setHelpOpen(false)}
                    style={{ background:"var(--surface)", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:18, color:"var(--ink)" }}>×</button>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
                  {content.tips.map((tip, i) => (
                    <div key={i} style={{ display:"flex", gap:12, padding:"12px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12 }}>
                      <div style={{ fontSize:22, flexShrink:0 }}>{tip.icon}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:3 }}>{tip.title}</div>
                        <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.6 }}>{tip.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setHelpOpen(false); setFeedbackOpen(true); setFeedbackDone(false); }}
                  style={{ width:"100%", padding:"12px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"var(--muted2)", cursor:"pointer" }}>
                  💬 Send feedback eller rapportér fejl
                </button>
              </div>
            </div>
          );
        })()}

        {/* ══ SLET KONTO MODAL ══ */}
        {showDeleteAccount && (
          <div style={{ position:"fixed", inset:0, zIndex:9997, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"flex-end" }}
            onClick={e => e.target === e.currentTarget && setShowDeleteAccount(false)}>
            <div style={{ background:"var(--paper)", borderRadius:"20px 20px 0 0", padding:"24px 16px 40px", width:"100%" }}
              onClick={e => e.stopPropagation()}>

              <div style={{ textAlign:"center", marginBottom:20 }}>
                <div style={{ fontSize:48, marginBottom:10 }}>⚠️</div>
                <div style={{ fontSize:19, fontWeight:900, color:"var(--red)", marginBottom:8 }}>Slet din konto</div>
                <div style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.7 }}>
                  Dette sletter permanent alle dine data — allergier, familie, historik og præferencer. Handlingen kan ikke fortrydes.
                </div>
              </div>

              {/* Hvad slettes */}
              <div style={{ background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:12, padding:"12px 14px", marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--red)", marginBottom:8 }}>FØLGENDE DATA SLETTES:</div>
                {["Din profil og login","Allergier og præferencer","Familiemedlemmer","Scanningshistorik","Indkøbslister","Feedback og tickets"].map(item => (
                  <div key={item} style={{ fontSize:12, color:"var(--red)", padding:"3px 0", display:"flex", gap:8 }}>
                    <span>✗</span><span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Bekræftelse */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:8 }}>
                  Skriv <strong>"slet"</strong> for at bekræfte:
                </div>
                <input
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="slet"
                  autoCapitalize="none"
                  style={{ width:"100%", padding:"13px 14px", border:`1px solid ${deleteConfirmText.toLowerCase()==="slet" ? "var(--red)" : "var(--border2)"}`, borderRadius:12, fontFamily:"var(--f)", fontSize:16, outline:"none", boxSizing:"border-box", background:"#fff", color:"var(--ink)" }}
                />
              </div>

              <button onClick={deleteOwnAccount}
                disabled={deleteConfirmText.toLowerCase() !== "slet" || deletingAccount}
                style={{ width:"100%", padding:"15px", background: deleteConfirmText.toLowerCase()==="slet" ? "var(--red)" : "var(--border2)", border:"none", borderRadius:12, fontFamily:"var(--f)", fontSize:15, fontWeight:800, color:"#fff", cursor: deleteConfirmText.toLowerCase()==="slet" ? "pointer" : "not-allowed", marginBottom:10 }}>
                {deletingAccount ? "Sletter…" : "🗑️ Slet min konto permanent"}
              </button>

              <button onClick={() => setShowDeleteAccount(false)}
                style={{ width:"100%", padding:"13px", background:"none", border:"none", fontFamily:"var(--f)", fontSize:14, fontWeight:700, color:"var(--muted)", cursor:"pointer" }}>
                Annullér — behold min konto
              </button>

            </div>
          </div>
        )}

        {/* ══ BETA INTRO ══ */}
        {!betaIntroSeen && (() => {
          const steps = [
            {
              emoji: "🧪",
              title: "Velkommen til EatSafe Beta",
              body: "Du er en af de første til at prøve EatSafe. Vi er glade for at have dig med — og vi er ærlige: appen er ikke færdig endnu.\n\nSom beta-bruger hjælper du os med at finde fejl, forbedre brugeroplevelsen og sikre at appen virker for rigtige allergiramte.",
            },
            {
              emoji: "💬",
              title: "Giv os din mening",
              body: "Tryk på Feedback-knappen øverst i appen når du støder på noget — en fejl, noget der ser mærkeligt ud, eller en idé til forbedring.\n\nVi læser alt. Din feedback er det vigtigste redskab vi har i denne fase.",
            },
            {
              emoji: "❓",
              title: "Brug hjælp-knappen",
              body: "Er du i tvivl om hvordan noget virker? Tryk på ? øverst — der finder du en kort guide til den skærm du står på.\n\nHvis du stadig er i tvivl, brug Feedback og skriv til os.",
            },
            {
              emoji: "⚠️",
              title: "En vigtig bemærkning",
              body: "EatSafe er under udvikling. Allergendata kan mangle eller være ukorrekte.\n\nTjek ALTID den fysiske emballage — appen er et hjælpeværktøj, ikke en garanti. Vi arbejder på at gøre dataene så præcise som muligt.",
            },
          ];
          const step = steps[betaIntroStep];
          const isLast = betaIntroStep === steps.length - 1;
          const dismiss = () => setBetaIntroSeen(true);
          return (
            <div style={{ position:"fixed", inset:0, zIndex:10000, background:"rgba(0,0,0,.92)",
              display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
              <div style={{ background:"#1a3012", borderRadius:20, padding:"28px 22px 24px",
                width:"100%", maxWidth:400, boxSizing:"border-box" }}>

                {/* Progress dots */}
                <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:24 }}>
                  {steps.map((_, i) => (
                    <div key={i} style={{ width: i === betaIntroStep ? 20 : 6, height:6, borderRadius:3,
                      background: i === betaIntroStep ? "var(--green)" : "rgba(255,255,255,.2)",
                      transition:"all .3s" }} />
                  ))}
                </div>

                {/* Content */}
                <div style={{ textAlign:"center", marginBottom:28 }}>
                  <div style={{ fontSize:52, marginBottom:16 }}>{step.emoji}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:"var(--ink)", marginBottom:14,
                    letterSpacing:"-.3px" }}>{step.title}</div>
                  <div style={{ fontSize:14, color:"var(--ink2)", lineHeight:1.7,
                    whiteSpace:"pre-line" }}>{step.body}</div>
                </div>

                {/* Buttons */}
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <button onClick={() => isLast ? dismiss() : setBetaIntroStep(s => s + 1)}
                    style={{ width:"100%", padding:"14px", background:"var(--green)",
                      border:"none", borderRadius:12, fontFamily:"var(--f)", fontSize:15,
                      fontWeight:800, color:"#071510", cursor:"pointer" }}>
                    {isLast ? "Kom i gang →" : "Næste →"}
                  </button>
                  {!isLast && (
                    <button onClick={dismiss}
                      style={{ width:"100%", padding:"10px", background:"transparent",
                        border:"none", fontFamily:"var(--f)", fontSize:12,
                        color:"rgba(255,255,255,.3)", cursor:"pointer" }}>
                      Spring over
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ══ FEEDBACK MODAL ══ */}
        <FeedbackModal
          open={feedbackOpen} onClose={() => setFeedbackOpen(false)}
          screen={screen} authTab={authTab} onboardStep={onboardStep}
          scanResult={scanResult} madpasWaiterView={madpasWaiterView}
          madpasLang={madpasLang} selectedRecipe={selectedRecipe}
          editMode={editMode} showManualEan={showManualEan}
          profilePopup={profilePopup}
          user={user} userId={userId} accessToken={accessToken}
          loginEmail={loginEmail} allergens={allergens}
          family={family} history={history} activeProfiles={activeProfiles}
        />

        {/* ── OFFLINE BANNER ── */}
        {isOffline && (
          <div style={{
            position:"sticky", top:0, zIndex:200,
            background:"var(--amber)", color:"#000",
            fontSize:12, fontWeight:700,
            padding:"8px 16px",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            textAlign:"center",
          }}>
            📵 Offline — viser lokalt cachede data
          </div>
        )}

        {/* ══ HJEM ══ */}        {/* ── OFFLINE BANNER ── */}
        {isOffline && (
          <div style={{
            position:"sticky", top:0, zIndex:200,
            background:"var(--amber)", color:"#000",
            fontSize:12, fontWeight:700,
            padding:"8px 16px",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            textAlign:"center",
          }}>
            📵 Offline — viser lokalt cachede data
          </div>
        )}

        {/* ══ HJEM ══ */}
        {/* ══ SCANNER SCREENS ══ */}
        {(screen === SCREENS.HOME || screen === SCREENS.RESULT || screen === SCREENS.NOTFOUND || screen === SCREENS.SUBMITTED || screen === SCREENS.SEARCH || screen === SCREENS.LIST || screen === SCREENS.SUGGEST_EDIT) && (
          <ErrorBoundary screen="Scanner">
          <ScannerScreen
            screen={screen} setScreen={setScreen}
            scanResult={scanResult} notFoundEan={notFoundEan}
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            searchResults={searchResults} setSearchResults={setSearchResults}
            searchCategory={searchCategory} setSearchCategory={setSearchCategory}
            scanError={scanError}
            shoppingList={shoppingList} newItemName={newItemName} setNewItemName={setNewItemName}
            history={history} favorites={favorites}
            family={family} activeProfiles={activeProfiles} setActiveProfiles={setActiveProfiles}
            allergens={allergens} customAllerg={customAllerg}
            accessToken={accessToken} userId={userId} user={user}
            notFoundStep={notFoundStep} setNotFoundStep={setNotFoundStep}
            proposedName={proposedName} setProposedName={setProposedName}
            proposedFlags={proposedFlags} setProposedFlags={setProposedFlags}
            proposedNutrition={proposedNutrition} setProposedNutrition={setProposedNutrition}
            proposedNotes={proposedNotes} setProposedNotes={setProposedNotes}
            ocrLoading={ocrLoading} ocrText={ocrText} setOcrText={setOcrText}
            nutritionOcrLoading={nutritionOcrLoading} handleNutritionCapture={handleNutritionCapture}
            productImagePreview={productImagePreview}
            submitting={submitting} submitProduct={submitProduct}
            editStep={editStep} setEditStep={setEditStep}
            editType={editType} setEditType={setEditType}
            editNote={editNote} setEditNote={setEditNote}
            editIngText={editIngText} setEditIngText={setEditIngText}
            showIng={showIng} setShowIng={setShowIng}
            showNutrition={showNutrition} setShowNutrition={setShowNutrition}
            showManualEan={showManualEan} setShowManualEan={setShowManualEan}
            showSafeOnly={showSafeOnly} setShowSafeOnly={setShowSafeOnly}
            profilePopup={profilePopup} setProfilePopup={setProfilePopup}
            greeting={greeting}
            cameraActive={cameraActive} setCameraActive={setCameraActive}
            galleryInputRef={galleryInputRef}
            lastScannedRef={lastScannedRef}
            addToList={addToList}
            handleEditProductCapture={handleEditProductCapture}
            handleImageCapture={handleImageCapture}
            handleProductImageCapture={handleProductImageCapture}
            toggleFavorite={toggleFavorite}
            clearDone={clearDone}
            editProductImage={editProductImage}
            isFavorite={isFavorite}
            removeItem={removeItem}
            scanFromGallery={scanFromGallery}
            searchLoading={searchLoading}
            startCamera={startCamera}
            stopCamera={stopCamera}
            toggleItem={toggleItem}
            toggleTorch={toggleTorch}
            torchOn={torchOn}
            scanZoom={scanZoom}
            showPhotoHint={showPhotoHint}
            photoScanLoading={photoScanLoading}
            photoFallbackRef={photoFallbackRef}
            scanPhotoForEan={scanPhotoForEan}
            setKnowledgeSlug={setKnowledgeSlug}
            buildLabel={formatBuildTime()}
            lookupProduct={lookupProduct}
            selectedENumbers={selectedENumbers}
            activeENumbers={activeENumbers}
            onBetaClick={() => { setBetaIntroSeen(false); setBetaIntroStep(0); }}
            alternatives={alternatives}
            altLoading={altLoading}
          />
          </ErrorBoundary>
        )}

        {/* ══ MADPAS SCREEN ══ */}
        {(screen === SCREENS.MADPAS || madpasWaiterView) && (
          <ErrorBoundary screen="Madpas">
          <MadpasScreen
            screen={screen}
            madpasLang={madpasLang} setMadpasLang={setMadpasLang}
            madpasProfileId={madpasProfileId} setMadpasProfileId={setMadpasProfileId}
            madpasSpeaking={madpasSpeaking} setMadpasSpeaking={setMadpasSpeaking}
            madpasBig={madpasBig}
            madpasWaiterView={madpasWaiterView} setMadpasWaiterView={setMadpasWaiterView}
            mpAllergens={mpAllergens} mpCustom={mpCustom}
            family={family} user={user}
            langOpen={langOpen} setLangOpen={setLangOpen}
            madpasSpeak={madpasSpeak}
            selectedENumbers={selectedENumbers}
          />
          </ErrorBoundary>
        )}

        {/* ══ KNOWLEDGE / LEKSIKON SCREEN ══ */}
        {screen === SCREENS.KNOWLEDGE && (
          <Suspense fallback={<div style={{padding:"40px 16px",textAlign:"center"}}><div style={{width:28,height:28,border:"3px solid var(--border2)",borderTopColor:"var(--green)",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto"}} /></div>}>
          <ErrorBoundary screen="Leksikon">
          <KnowledgeScreen
            screen={screen} setScreen={setScreen}
            accessToken={accessToken}
            openSlug={knowledgeSlug}
            onSlugHandled={() => setKnowledgeSlug(null)}
          />
          </ErrorBoundary>
          </Suspense>
        )}

        {/* ══ PROFILE SCREENS ══ */}
        {(screen === SCREENS.HISTORY || screen === SCREENS.PROFILE ||
          screen === SCREENS.FAVORITES || screen === SCREENS.EDITPROFILE ||
          screen === SCREENS.FAMILY) && (
          <ErrorBoundary screen="Profil">
          <ProfileScreen
            screen={screen} setScreen={setScreen}
            user={user} setUser={setUser}
            allergens={allergens} setAllergens={setAllergens}
            customAllerg={customAllerg} setCustomAllerg={setCustomAllerg}
            family={family} setFamily={setFamily}
            activeProfiles={activeProfiles} setActiveProfiles={setActiveProfiles}
            history={history} favorites={favorites}
            userId={userId} accessToken={accessToken}
            showDeleteAccount={showDeleteAccount} setShowDeleteAccount={setShowDeleteAccount}
            deleteConfirmText={deleteConfirmText} setDeleteConfirmText={setDeleteConfirmText}
            deletingAccount={deletingAccount} deleteOwnAccount={deleteOwnAccount}
            clearAuth={clearAuth}
            eSearch={eSearch} setESearch={setESearch}
            eCategory={eCategory} setECategory={setECategory}
            allergenSubtypes={allergenSubtypes} setAllergenSubtypes={setAllergenSubtypes}
            loadHistory={loadHistory}
            selectedENumbers={selectedENumbers} setSelectedENumbers={setSelectedENumbers}
            activeSubtypeModal={activeSubtypeModal} setActiveSubtypeModal={setActiveSubtypeModal}
            customInput={customInput} setCustomInput={setCustomInput}
            newMemberName={newMemberName} setNewMemberName={setNewMemberName}
            newMemberBirthYear={newMemberBirthYear} setNewMemberBirthYear={setNewMemberBirthYear}
            newMemberGender={newMemberGender} setNewMemberGender={setNewMemberGender}
            newMemberAllerg={newMemberAllerg} setNewMemberAllerg={setNewMemberAllerg}
            newMemberCustomAllerg={newMemberCustomAllerg} setNewMemberCustomAllerg={setNewMemberCustomAllerg}
            newMemberDiets={newMemberDiets} setNewMemberDiets={setNewMemberDiets}
            newMemberENumbers={newMemberENumbers} setNewMemberENumbers={setNewMemberENumbers}
            newMemberSubtypes={newMemberSubtypes} setNewMemberSubtypes={setNewMemberSubtypes}
            newMemberCustomInput={newMemberCustomInput} setNewMemberCustomInput={setNewMemberCustomInput}
            addMember={addMember} removeMember={removeMember}
            ticketsLoading={ticketsLoading}
            setScanResult={setScanResult}
            historyLoading={historyLoading}
            loadAdminStats={loadAdminStats} loadSubmissions={loadSubmissions} loadTickets={loadTickets}
            setAdminSection={setAdminSection} setSubmissionFilter={setSubmissionFilter}
          />
          </ErrorBoundary>
        )}

        {/* ══ RECIPES SCREEN ══ */}
        {screen === SCREENS.RECIPES && (
          <Suspense fallback={<div style={{padding:"40px 16px",textAlign:"center"}}><div style={{width:28,height:28,border:"3px solid var(--border2)",borderTopColor:"var(--green)",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto"}} /></div>}>
          <ErrorBoundary screen="Opskrifter">
          <RecipesScreen
            screen={screen} setScreen={setScreen}
            recipes={recipes} recipesLoading={recipesLoading}
            selectedRecipe={selectedRecipe} setSelectedRecipe={setSelectedRecipe}
            recipeSearch={recipeSearch} setRecipeSearch={setRecipeSearch}
            showSafeOnly={showSafeOnly} setShowSafeOnly={setShowSafeOnly}
            allergens={allergens} customAllerg={customAllerg}
            family={family} activeProfiles={activeProfiles}
            favorites={favorites} accessToken={accessToken}
            showSubmitRecipe={showSubmitRecipe} setShowSubmitRecipe={setShowSubmitRecipe}
            submitRecipe={submitRecipe} setSubmitRecipe={setSubmitRecipe}
            submitSteps={submitSteps} setSubmitSteps={setSubmitSteps}
            submitIngredients={submitIngredients} setSubmitIngredients={setSubmitIngredients}
            submittingRecipe={submittingRecipe}
            loadRecipes={loadRecipes} loadRecipeIngredients={loadRecipeIngredients} submitUserRecipe={submitUserRecipe}
            loading={loading}
            toggleFavorite={toggleFavorite}
            user={user}
            recipeFilter={recipeFilter} setRecipeFilter={setRecipeFilter}
            recipeSafeOnly={recipeSafeOnly} setRecipeSafeOnly={setRecipeSafeOnly}
            favoriteRecipes={favoriteRecipes} setFavoriteRecipes={setFavoriteRecipes}
            activeIds={activeIds}
            completedSteps={completedSteps} setCompletedSteps={setCompletedSteps}
            recipeServings={recipeServings} setRecipeServings={setRecipeServings}
            setRecipes={setRecipes}
            addToList={addToList}
          />
          </ErrorBoundary>
          </Suspense>
        )}



        {/* ADMIN PANEL */}
        {screen === SCREENS.ADMIN && user?.role === "admin" && (
          <Suspense fallback={null}>
          <ErrorBoundary screen="Admin">
          <AdminScreen
            screen={screen} setScreen={setScreen}
            adminSection={adminSection} setAdminSection={setAdminSection}
            adminStats={adminStats}
            adminUsers={adminUsers} adminUsersLoading={adminUsersLoading}
            adminTickets={adminTickets} adminTicketFilter={adminTicketFilter} setAdminTicketFilter={setAdminTicketFilter}
            submissions={submissions} submissionsLoading={submissionsLoading}
            submissionFilter={submissionFilter} setSubmissionFilter={setSubmissionFilter}
            openSubmission={openSubmission} setOpenSubmission={setOpenSubmission}
            editingSubmission={editingSubmission} setEditingSubmission={setEditingSubmission}
            openAdminUser={openAdminUser} setOpenAdminUser={setOpenAdminUser}
            openTicket={openTicket} setOpenTicket={setOpenTicket}
            cleanedOcrText={cleanedOcrText} cleaningOcr={cleaningOcr}
            userId={userId} accessToken={accessToken} user={user}
            setAllergens={setAllergens} setCustomAllerg={setCustomAllerg}
            setCustomInput={setCustomInput}
            setNewMemberAllerg={setNewMemberAllerg} setNewMemberCustomAllerg={setNewMemberCustomAllerg}
            setNewMemberCustomInput={setNewMemberCustomInput} setNewMemberDiets={setNewMemberDiets}
            setNewMemberENumbers={setNewMemberENumbers} setNewMemberName={setNewMemberName}
            setNewMemberSubtypes={setNewMemberSubtypes}
            loadAdminUsers={loadAdminUsers} loadAdminStats={loadAdminStats}
            loadSubmissions={loadSubmissions} loadTickets={loadTickets}
            updateUserRole={updateUserRole} deleteUser={deleteUser}
            updateSubmissionAndApprove={updateSubmissionAndApprove}
            rejectSubmission={rejectSubmission}
            updateTicketStatus={updateTicketStatus}
            cleanOcrWithAI={cleanOcrWithAI}
            ticketsLoading={ticketsLoading}
            userSearch={userSearch} setUserSearch={setUserSearch}
            missingEans={missingEans} missingEansLoading={missingEansLoading}
            loadMissingEans={loadMissingEans} deleteMissingEan={deleteMissingEan}
            importLog={importLog} importLoading={importLoading} runImport={runImport}
          />
          </ErrorBoundary>
          </Suspense>
        )}

        {/* BUNDNAVIGATION */}
        {!isOnboard && !madpasWaiterView && (
          <nav className="bottom-nav" role="navigation" aria-label="Hovednavigation">
            {[
              [SCREENS.RECIPES, "recipes",  "Opskrifter"],
              [SCREENS.LIST,    "cart",     "Indkøbsliste"],
              [SCREENS.HOME,    "home",     "Hjem"],
              [SCREENS.KNOWLEDGE, "book",   "Viden"],
              [SCREENS.PROFILE, "profile",  "Profil"],
            ].map(([s,icon,lbl]) => (
              <div key={s} className={`nav-item${(
                screen===s ||
                (screen===SCREENS.RESULT && s===SCREENS.HOME) ||
                (screen===SCREENS.NOTFOUND && s===SCREENS.HOME) ||
                (screen===SCREENS.SUBMITTED && s===SCREENS.HOME) ||
                (screen===SCREENS.SEARCH && s===SCREENS.HOME) ||
                (screen===SCREENS.HISTORY && s===SCREENS.PROFILE) ||
                (screen===SCREENS.FAVORITES && s===SCREENS.PROFILE) ||
                (screen===SCREENS.FAMILY && s===SCREENS.PROFILE) ||
                (screen===SCREENS.ADMIN && s===SCREENS.PROFILE) ||
                (screen===SCREENS.MADPAS && s===SCREENS.PROFILE)
              )?" active":""}`}
                onClick={() => setScreen(s)}
                role="button"
                aria-label={lbl}
                aria-current={screen===s ? "page" : undefined}
                tabIndex={0}
                onKeyDown={e => e.key === "Enter" && setScreen(s)}>
                <div className="nav-icon"><Icon name={icon} size={22} /></div>
                <div className="nav-lbl">{lbl}</div>
              </div>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}