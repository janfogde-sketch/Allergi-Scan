// @ts-nocheck
import React, { useState, Suspense, useEffect, useCallback, useRef, useMemo } from "react";

// ─── BUILD INFO (injiceres af Vite ved build-tid) ─────────────────────────────
import {
  SUPABASE_URL, SUPABASE_ANON_KEY, ALLERGENS, SCREENS, DIETS,
  AVATAR_COLORS, DEMO_CODES, DUMMY_PRODUCT, MOCK_PRODUCTS,
  ALLERGEN_EXAMPLES, E_NUMBERS, E_CATEGORIES,
  MADPAS_LANGUAGES, ALLERGEN_T, MADPAS_INTRO,
  PAGE_IDS, uid
} from "./constants.jsx";

import {
  initials, timeAgo, getAllergenLabels, verifiedBadge,
  makeHeaders, apiCall,
  getTraceLog
} from "./helpers.js";

import {
  Icon, IngredientsList, ProfileBadges,
  getProductIcon, ProductImage, LazyFallback, ToastHost, showToast,
  ScanLoadingOverlay
} from "./SharedComponents.jsx";

import { ENumberPicker } from "./AllergenPicker.jsx";
import { MemberForm, CategorySelect } from "./MemberForm.jsx";
import { ProgressIndicator } from "./DesignSystem.jsx";
const AdminScreen = React.lazy(() => import('./AdminScreen.jsx'));
const OnboardingScreen = React.lazy(() => import('./OnboardingScreen.jsx'));
const MadpasScreen = React.lazy(() => import('./MadpasScreen.jsx'));
const ProfileScreen = React.lazy(() => import('./ProfileScreen.jsx'));
const SettingsScreen = React.lazy(() => import('./SettingsScreen.jsx'));
import ScannerScreen from './ScannerScreen.jsx';
const RecipesScreen = React.lazy(() => import('./RecipesScreen.jsx'));
const KnowledgeScreen = React.lazy(() => import('./KnowledgeScreen.jsx'));
const FeedbackModal = React.lazy(() => import('./FeedbackModal.jsx'));
const ProfileMenu = React.lazy(() => import('./ProfileMenu.jsx'));
import ErrorBoundary from './ErrorBoundary.jsx';
import { useOffline } from './useOffline.js';

import { appCss } from './theme.jsx';
import { BUILD_TIME, COMMIT_SHA, formatBuildTime, buildScreenLabel } from './utils.jsx';
import { useShoppingList } from './useShoppingList.js';
import { useFamily } from './useFamily.js';
import { useHistory } from './useHistory.js';
import { useAuth } from './useAuth.js';
import { useOnboarding } from './useOnboarding.js';
import { useAdmin } from './useAdmin.js';
import { useScanner } from './useScanner.js';
import { useRecipes } from './useRecipes.js';
import { useProduct, runLookupProduct, buildScanResultFromProductData } from './useProduct.js';
import { PREVIEW_MOCK_PRODUCTS } from './previewMockData.js';
import { useMadpas } from './useMadpas.js';
import { useSearch } from './useSearch.js';
import { useAlternatives } from './useAlternatives.js';
import { AuthProvider } from './AuthContext.jsx';
import { ProfileProvider } from './ProfileContext.jsx';
import { AdminProvider } from './AdminContext.jsx';
import { NavigationProvider } from './NavigationContext.jsx';
import { HistoryProvider } from './HistoryContext.jsx';
import { ShoppingProvider } from './ShoppingContext.jsx';
import { FamilyFormProvider } from './FamilyFormContext.jsx';
import { AllergenPrefsProvider } from './AllergenPrefsContext.jsx';
import { UI } from "./styleUtils.js";
import InstallPrompt from "./InstallPrompt.jsx";
import HelpModal from "./HelpModal.jsx";
import BetaIntroModal from "./BetaIntroModal.jsx";
import DeleteAccountModal from "./DeleteAccountModal.jsx";


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
  // Scanner-profilfilteret ("Scanner for: ...") huskes mellem sessioner
  // (25. sept. 2026, brugerfeedback) — læst én gang ved opstart, IKKE
  // genlæst efterfølgende. Samme activeProfiles-state driver også Søg/
  // Liste/Favoritter (allerede sådan før denne ændring — se dens egen
  // dokumentation i ProfileContext.jsx), så persistensen gælder for dem alle.
  // Adskilt fra selve activeProfiles-VÆRDIEN (persisteret uanset hvordan den
  // opstod) — dette er en selvstændig, eksplicit markør for "har standard-
  // til-Alle-logikken allerede kørt én gang", sat KUN inde i selve effekten
  // nedenfor, aldrig blot fordi der findes en gemt værdi. Uden denne
  // adskillelse ville persistens-effektens egen første skrivning af det
  // initielle ["me"] (før family overhovedet er indlæst) fejlagtigt blive
  // læst som "brugeren har allerede valgt eksplicit" ved et senere
  // gen-mount (fx Vite Fast Refresh i dev, men samme race var reelt også
  // muligt i produktion ved en meget hurtig re-mount) — fundet ved en
  // Playwright-gennemgang, ikke en antagelse.
  const hadStoredActiveProfilesRef = useRef(localStorage.getItem("as_active_profiles_default_applied") === "1");
  const [activeProfiles, setActiveProfiles] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("as_active_profiles") || "null");
      if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch { /* ignoreres — falder tilbage til default */ }
    return ["me"];
  });
  useEffect(() => {
    try { localStorage.setItem("as_active_profiles", JSON.stringify(activeProfiles)); } catch { /* ignoreres */ }
  }, [activeProfiles]);

  // Scan state
  const [showIng, setShowIng] = useState(true); // Automatisk åben
  const [showNutrition, setShowNutrition] = useState(false);
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
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  // Starter altid `true` (skjult) ved en ny side-indlæsning — sat til
  // `false` kun via finishOnboard-wrapperen ovenfor (automatisk, én gang,
  // lige efter onboarding trin 5) eller "Om EatSafe Beta" i ProfileMenu.jsx
  // (manuel genåbning). Se finishOnboard-wrapperens kommentar for hvorfor
  // dette alene er nok til at opfylde "vis ikke automatisk igen".
  const [betaIntroSeen, setBetaIntroSeen] = useState(true);
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

  // ── CUSTOM HOOKS ──────────────────────────────────────────────────────────
  const {
    accessToken, setAccessToken, refreshToken, setRefreshToken,
    userId, setUserId,
    loginEmail, setLoginEmail, loginPassword, setLoginPassword,
    authError, setAuthError, emailTakenError, setEmailTakenError, authLoading, setAuthLoading,
    authTab, setAuthTab, isOAuth, setIsOAuth,
    rememberMe, setRememberMe,
    saveTokens, clearAuth, handleLogin, handleSignup, handleOAuth, handleForgotPassword,
  } = useAuth({ setScreen, setUser, setAllergens, setCustomAllerg,
                onSignupSuccess: () => setOnboardStep(1) });

  const {
    lists, activeList, activeListId, setActiveListId,
    shoppingList, setShoppingList,
    shoppingListId, setShoppingListId,
    newItemName, setNewItemName,
    familyMembers, loadFamilyMembers,
    createList, renameList, setListType, deleteList, joinByCode,
    getListAccess, grantAccess, revokeAccess,
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
    editingMemberId,
    loadFamily, addMember, updateMember, removeMember, startEditMember, cancelEditMember,
  } = useFamily({ accessToken, userId, setActiveProfiles });

  // Ingen gemt scanner-profilfilter fra en tidligere session, og husstanden
  // har (nu) familiemedlemmer — standardvælg "Alle", som brugeren bad om
  // (25. sept. 2026). Kun relevant ÉN gang, første gang family reelt
  // indeholder noget efter opstart — aldrig hvis brugeren allerede havde et
  // gemt, eksplicit valg (se hadStoredActiveProfilesRef ovenfor).
  useEffect(() => {
    if (hadStoredActiveProfilesRef.current) return;
    if (family.length === 0) return;
    hadStoredActiveProfilesRef.current = true;
    try { localStorage.setItem("as_active_profiles_default_applied", "1"); } catch { /* ignoreres */ }
    setActiveProfiles(["me", ...family.map(m => m.id)]);
  }, [family]);

  // ── MADPAS SPEAK → useMadpas hook (placeret efter useFamily pga. family-dependency) ──
  const { madpasSpeaking, setMadpasSpeaking, madpasBig, setMadpasBig,
          madpasWaiterView, setMadpasWaiterView, langOpen, setLangOpen,
          madpasSpeak } = useMadpas({
    allergens, customAllerg, selectedENumbers, user, madpasLang, family, madpasProfileId
  });

  const {
    history, setHistory,
    historyLoading, historyScope,
    favorites, setFavorites, favoritesScope,
    loadHistory, saveHistoryEntry, loadFavorites, toggleFavorite, setFavoriteCategory, isFavorite,
  } = useHistory({ accessToken, userId });

  const {
    onboardStep, setOnboardStep,
    editMode, setEditMode,
    tourIdx, setTourIdx,
    customInput, setCustomInput,
    saveProfileStep1, saveAllergensStep2, finishOnboard: finishOnboardRaw,
  } = useOnboarding({ accessToken, userId, user, loginEmail,
                      allergens, customAllerg,
                      setUser, setScreen, setEditMode: () => {}, setIsOAuth });

  // Viser Beta-introen automatisk, én gang, lige efter onboarding trin 5
  // (25. sept. 2026, brugerfeedback) — finishOnboard() kaldes KUN fra de to
  // knapper i selve trin 5 (se OnboardingScreen.jsx), så at trigge
  // visningen her er nok til at garantere at den aldrig dukker op
  // automatisk ved almindelige, senere appstarter: betaIntroSeen starter
  // altid som `true` ved en ny side-indlæsning (se useState nedenfor) og
  // bliver kun `false` via dette ene kald, eller via et manuelt "Om
  // EatSafe Beta"-tryk i ProfileMenu.jsx — ingen localStorage-flag
  // nødvendig for selve "vis ikke automatisk igen"-kravet.
  const finishOnboard = async () => {
    await finishOnboardRaw();
    setBetaIntroStep(0);
    setBetaIntroSeen(false);
  };

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
    reparseLog, reparseLoading, runReparse,
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
        // Hent invited_by inden accept så vi kan sende push — via
        // get_invite_preview()-RPC'en, ikke en direkte tabel-læsning (se
        // RPC'ens egen kommentar: en bred SELECT-policy på family_invites
        // ville lade enhver dumpe alle aktive invitations-tokens).
        let invitedBy = null;
        try {
          const inviteData = await apiCall(
            `${SUPABASE_URL}/rest/v1/rpc/get_invite_preview`,
            {
              method: "POST",
              headers: makeHeaders(accessToken),
              body: JSON.stringify({ p_token: inviteToken }),
            }
          );
          invitedBy = inviteData?.found ? inviteData.invited_by : null;
        } catch { /* silent */ }

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
          showToast("🎉 Invitation accepteret! Jeres familieoplysninger er nu delt.");

          // Send push til den der inviterede
          if (invitedBy && invitedBy !== userId) {
            const acceptorName = user?.name?.split(" ")[0] || "Et familiemedlem";
            try {
              await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
                method: "POST",
                headers: { ...makeHeaders(accessToken), "Content-Type": "application/json" },
                body: JSON.stringify({
                  user_id: invitedBy,
                  title: "👨‍👩‍👧 Familie tilsluttet!",
                  body: `${acceptorName} har accepteret din invitation og er nu en del af din familie i EatSafe.`,
                  url: "https://eatsafe.dk",
                  category: "family",
                }),
              });
            } catch { /* silent — push er ikke kritisk */ }
          }
        } else if (data?.error) {
          showToast("Invitation fejlede: " + data.error, "error");
        }
      } catch { /* ignorer */ }
    };
    acceptInvite();
  }, [accessToken, userId]);

  // ── Indkøbsliste-tilslutning via delt link ────────────────────────────────
  // Koden gemmes i localStorage (ikke kun URL'en), så den overlever hele
  // signup-flowet — en ny bruger, der åbner linket, skal først igennem
  // "Opret konto" og allergi-opsætning, før accessToken overhovedet findes.
  const [pendingJoinList, setPendingJoinList] = useState(() => localStorage.getItem("as_pending_join_list"));

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("join-list");
    if (!code) return;
    localStorage.setItem("as_pending_join_list", code);
    setPendingJoinList(code);
    // Fjern koden fra URL uden reload — den lever videre i localStorage
    const url = new URL(window.location.href);
    url.searchParams.delete("join-list");
    window.history.replaceState({}, "", url.toString());
    // Ikke logget ind endnu — opfordr direkte til at oprette en konto,
    // fremfor at brugeren lander på den almindelige velkomstskærm
    if (!localStorage.getItem("as_token")) {
      setAuthTab("signup");
      setScreen(SCREENS.LOGIN);
    }
  }, []);

  React.useEffect(() => {
    if (!pendingJoinList || !accessToken || !userId) return;
    const code = pendingJoinList;
    localStorage.removeItem("as_pending_join_list");
    setPendingJoinList(null);

    joinByCode(code).then(res => {
      if (res.success) {
        loadShoppingList();
        setScreen(SCREENS.LIST);
        showToast(`🛒 Du er nu tilsluttet listen "${res.list?.name || ""}"!`);
      } else {
        showToast("Kunne ikke tilslutte listen: " + (res.error || "Ugyldig kode"), "error");
      }
    });
  }, [accessToken, userId, pendingJoinList]);

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
  const isOffline = useOffline();

  const [notFoundEan, setNotFoundEan] = useState("");
  const {
    productCacheRef,
    scanTokenRef,
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
          `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=name,email,phone,birth_year,gender,role,onboarding_completed,diets,e_numbers,created_at&limit=1`,
          { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
        );
        if (Array.isArray(profile) && profile[0]) {
          const p = profile[0];
          setUser(u => ({
            ...u,
            name: p.name || u.name || "",
            email: p.email || u.email || "",
            phone: p.phone || "",
            age: p.birth_year ? String(new Date().getFullYear() - p.birth_year) : "",
            birth_year: p.birth_year || "",
            gender: p.gender || "",
            role: p.role || "user",
            diets: p.diets || [],
            created_at: p.created_at || u.created_at || "",
          }));
          setSelectedENumbers(p.e_numbers || []);
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

        // Familie + indkøb + favoritter
        loadFamily();
        loadShoppingList();
        loadFavorites();
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
      <div style={UI.wrapGap7}>
        <div className={`ap-chip${isAll?" on":""}`} onClick={toggleAll}>Hele familien</div>
        <div className={`ap-chip${!isAll&&activeProfiles.includes("me")?" on":""}`} onClick={() => toggleOne("me")}>
          <div style={UI.uw20_h20_br50_bggreen_dflex_aicenter_jccenter_fs10_fw800_cin}>{initials(user.name||"Mig")}</div>
          {(user.name||"Mig").split(" ")[0]}
        </div>
        {family.map(m => (
          <div key={m.id} className={`ap-chip${!isAll&&activeProfiles.includes(m.id)?" on":""}`} onClick={() => toggleOne(m.id)}>
            <div style={{width:20,height:20,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"var(--ink)"}}>{initials(m.name)}</div>
            {m.name.split(" ")[0]}
          </div>
        ))}
      </div>
    );
  };

  {/* Trin-bar — flyttet til DesignSystem.jsx som den låste, navngivne
      ProgressIndicator-komponent (25. sept. 2026-designsystem), i stedet
      for en lokal closure her. */}
  const StepBar = ProgressIndicator;

  // ── SCANNER CORE ──────────────────────────────────────────────────────────
  const allActive = useCallback(() => {
    const ids = new Set(activeProfiles.includes("me") ? allergens : []);
    const eNums = new Set(activeProfiles.includes("me") ? selectedENumbers : []);
    // custom byggedes tidligere altid ud fra customAllerg ("mig"), uanset om
    // "mig" rent faktisk var en aktiv profil — og familiemedlemmers egne
    // custom-allergier (m.custom) blev slet aldrig medtaget. Det betyder at
    // en custom-allergi tilføjet på et familiemedlem aldrig indgik i scan-
    // verdikten, og "mig"s custom-allergier lækkede ind selv når kun et
    // familiemedlem var valgt. Rettet så custom nu følger samme
    // aktiv-profil-logik som allergens/eNumbers herover.
    const custom = new Set(activeProfiles.includes("me") ? customAllerg : []);
    family.filter(m => activeProfiles.includes(m.id)).forEach(m => {
      (m.allergens || []).forEach(a => ids.add(a));
      (m.eNumbers || []).forEach(e => eNums.add(e));
      (m.custom || []).forEach(c => custom.add(c));
    });
    return { ids: [...ids], custom: [...custom], eNumbers: [...eNums] };
  }, [allergens, customAllerg, selectedENumbers, family, activeProfiles]);

  // allActive() rebygger Sets og looper family — kaldes kun én gang og
  // destructures i stedet for to separate kald der hver genberegner det samme
  const { ids: activeIds, custom: activeCustom, eNumbers: activeENumbers } = allActive();

  
  // ── SCANNER ───────────────────────────────────────────────────────────────
  const {
    cameraActive, setCameraActive,
    scanReady,
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

  // Kameraet må aldrig blive ved med at køre usynligt — det dræner batteriet.
  // useScanner's egen cleanup-effect stopper kun kameraet når HOOKEN selv
  // unmountes, men den lever i App.jsx som aldrig unmountes — så et skift til
  // fx Profil eller Opskrifter mens kameraet kører lod streamen køre videre i
  // baggrunden for evigt. Stop den eksplicit her, både ved skærmskift væk fra
  // de skærme kameraet reelt bruges på, og når appen lægges i baggrunden.
  const SCANNER_SCREENS = [SCREENS.HOME, SCREENS.RESULT, SCREENS.NOTFOUND, SCREENS.SUBMITTED, SCREENS.SEARCH, SCREENS.LIST, SCREENS.SUGGEST_EDIT];
  useEffect(() => {
    if (!cameraActive) return;
    if (!SCANNER_SCREENS.includes(screen)) stopCamera();
  }, [screen, cameraActive, stopCamera]);

  useEffect(() => {
    const onVisibilityChange = () => { if (document.hidden) stopCamera(); };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [stopCamera]);

  // Ref der altid peger på den seneste lookupProduct (undgår TDZ-cirkulær afhænighed)
  const lookupProductRef = useRef(null);

// ── SØGNING → useSearch hook ────────────────────────────────────────────────
  const { searchQuery, setSearchQuery, searchCategory, setSearchCategory,
          searchResults, setSearchResults, searchLoading,
          searchHasMore, searchTotal, searchLoadingMore, loadMoreSearchResults } = useSearch({ accessToken });

  const { alternatives, altLoading, loadAlternatives, clearAlternatives } = useAlternatives({ accessToken, activeIds });

  // Selve scan-resultat-pipelinen (opslag/allergen-match/familie-impact/
  // cache/historik/alternativer) er flyttet til useProduct.js' runLookupProduct
  // — denne wrapper sender blot alt afhængigt state med som ctx ved hvert kald,
  // så der (i modsætning til før) ALDRIG kan opstå en stale-closure-bug fra en
  // ufuldstændig deps-liste.
  const lookupProduct = useCallback((ean) => runLookupProduct(ean, {
    accessToken, activeIds, activeCustom, activeENumbers, family, activeProfiles,
    productCacheRef, scanTokenRef, saveHistoryEntry, loadAlternatives, clearAlternatives,
    setScanResult, setScreen, setLoading, setScanError, setShowIng, setHistory,
    setNotFoundEan, setNotFoundStep, setOcrText, setProposedName, setProposedFlags,
    setProductImagePreview, setProductImageBase64,
  }), [accessToken, activeIds, activeCustom, activeENumbers, family, activeProfiles,
       productCacheRef, scanTokenRef, saveHistoryEntry, loadAlternatives, clearAlternatives,
       setScanResult, setScreen, setLoading, setScanError, setShowIng, setHistory,
       setNotFoundEan, setNotFoundStep, setOcrText, setProposedName, setProposedFlags,
       setProductImagePreview, setProductImageBase64]);
  lookupProductRef.current = lookupProduct;

  // ── COMPUTED (afhænger af hooks) ─────────────────────────────────────────
  const madpasActiveProfile = madpasProfileId === "self" ? null : family.find(m => m.id === madpasProfileId);
  const mpAllergens = madpasActiveProfile ? (madpasActiveProfile.allergens || []) : allergens;
  const mpCustom = madpasActiveProfile ? (madpasActiveProfile.custom || []) : customAllerg;

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
      if (screen === SCREENS.RESULT || screen === SCREENS.NOTFOUND || screen === SCREENS.SUGGEST_EDIT
          || screen === SCREENS.SEARCH || screen === SCREENS.SUBMITTED
          || screen === SCREENS.MADPAS || screen === SCREENS.RESTAURANTGUIDE) {
        setScreen(SCREENS.HOME);
        return;
      }
      if (screen === SCREENS.ADMIN || screen === SCREENS.FAMILY || screen === SCREENS.HISTORY
          || screen === SCREENS.FAVORITES || screen === SCREENS.EDITPROFILE) {
        setScreen(SCREENS.PROFILE);
        return;
      }
      // På bundmenu-skærmene (HOME, LIST, RECIPES, KNOWLEDGE, PROFILE) — gør ingenting (forhindrer logout)
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

  // ── Artifact-preview: "Se app uden login"-knappen (se OnboardingScreen.jsx)
  // Kaldes KUN i --mode artifact-preview (login mod Supabase er upålideligt
  // fra Artifact-domænet, se CLAUDE.md afsnit 4). Sætter en mock-bruger +
  // mock-allergener, forudfylder produkt-cachen med mock-produkter (samme
  // EAN'er som Søg og Indkøbsliste bruger, se previewMockData.js — sikrer at
  // et klik på et søgeresultat eller en vare i indkøbslisten åbner korrekt i
  // Produkt-view via runLookupProduct's cache-first-gren, helt uden netværk),
  // og indlæser den samme mock-indkøbsliste som useShoppingList.js's egen
  // artifact-preview-gren i loadShoppingList. Udvidet til også at dække
  // Profil (fødselsår/køn — ellers viser "udfyld din profil"-banneret sig
  // konstant), Familie, Scanningshistorik og Favoritter — alle resterende
  // steder i appen der ellers ville stå tomme uden en rigtig session.
  const PREVIEW_MOCK_ALLERGENS = ["gluten", "noedder"];
  const activatePreviewMode = useCallback(() => {
    setUserId("preview-demo-bruger");
    setUser(u => ({ ...u, name: "Mille Nielsen", email: "preview@eatsafe.dk", birth_year: "1991", gender: "Kvinde" }));
    setAllergens(PREVIEW_MOCK_ALLERGENS);
    for (const product of PREVIEW_MOCK_PRODUCTS) {
      productCacheRef.current[product.ean] = buildScanResultFromProductData({
        product, data: {}, ean: product.ean,
        activeIds: PREVIEW_MOCK_ALLERGENS, activeENumbers: [], family: [], activeProfiles: [],
      });
    }
    loadShoppingList();

    setFamily([
      { id:"preview-fam-1", name:"Oskar Nielsen", color:AVATAR_COLORS[0], birth_year:2016, gender:"Mand", allergens:["jordnoedder"], custom:[], diets:[], eNumbers:[] },
      { id:"preview-fam-2", name:"Sofie Nielsen", color:AVATAR_COLORS[1], birth_year:2019, gender:"Kvinde", allergens:[], custom:["Kiwi"], diets:["vegetar"], eNumbers:[] },
    ]);

    const now = Date.now();
    setHistory([
      { ean_scanned:PREVIEW_MOCK_PRODUCTS[0].ean, products:{ name:PREVIEW_MOCK_PRODUCTS[0].name, brand:PREVIEW_MOCK_PRODUCTS[0].brand }, result:"danger", scanned_at:new Date(now - 1000*60*30).toISOString() },
      { ean_scanned:PREVIEW_MOCK_PRODUCTS[3].ean, products:{ name:PREVIEW_MOCK_PRODUCTS[3].name, brand:PREVIEW_MOCK_PRODUCTS[3].brand }, result:"safe", scanned_at:new Date(now - 1000*60*60*4).toISOString() },
      { ean_scanned:PREVIEW_MOCK_PRODUCTS[1].ean, products:{ name:PREVIEW_MOCK_PRODUCTS[1].name, brand:PREVIEW_MOCK_PRODUCTS[1].brand }, result:"warn", scanned_at:new Date(now - 1000*60*60*24).toISOString() },
      { ean_scanned:PREVIEW_MOCK_PRODUCTS[2].ean, products:{ name:PREVIEW_MOCK_PRODUCTS[2].name, brand:PREVIEW_MOCK_PRODUCTS[2].brand }, result:"safe", scanned_at:new Date(now - 1000*60*60*24*2).toISOString() },
    ]);

    setFavorites([
      { name:PREVIEW_MOCK_PRODUCTS[3].name, brand:PREVIEW_MOCK_PRODUCTS[3].brand, ean:PREVIEW_MOCK_PRODUCTS[3].ean, image_url:null, category:"Slik & snacks", savedAt:now - 1000*60*60*24*3, savedByMe:true },
      { name:PREVIEW_MOCK_PRODUCTS[2].name, brand:PREVIEW_MOCK_PRODUCTS[2].brand, ean:PREVIEW_MOCK_PRODUCTS[2].ean, image_url:null, category:"Mejeri", savedAt:now - 1000*60*60*24*6, savedByMe:true },
    ]);

    setScreen(SCREENS.HOME);
  }, [setUserId, setUser, setAllergens, productCacheRef, loadShoppingList, setFamily, setHistory, setFavorites, setScreen]);

  // Context-værdierne memoiseres, så et Provider ikke sender et nyt objekt
  // videre (og dermed tvinger ALLE dets consumers til at re-rendere) ved
  // hver App-render — kun når noget de faktisk indeholder ændrer sig.
  const authContextValue = useMemo(() => ({
    user, setUser, userId, setUserId, accessToken,
    loginEmail, setLoginEmail, loginPassword, setLoginPassword,
    authError, setAuthError, emailTakenError, setEmailTakenError, authLoading, authTab, setAuthTab,
    isOAuth, rememberMe, setRememberMe,
    handleLogin, handleSignup, handleOAuth, handleForgotPassword, clearAuth,
  }), [user, userId, setUserId, accessToken, loginEmail, loginPassword, authError, emailTakenError, authLoading, authTab, isOAuth, rememberMe, handleLogin, handleSignup, handleOAuth, handleForgotPassword, clearAuth]);

  const profileContextValue = useMemo(() => ({
    allergens, setAllergens, customAllerg, setCustomAllerg,
    family, setFamily, activeProfiles, setActiveProfiles,
  }), [allergens, customAllerg, family, activeProfiles]);

  const adminContextValue = useMemo(() => ({
    adminSection, setAdminSection, adminStats,
    adminUsers, adminUsersLoading,
    adminTickets, adminTicketFilter, setAdminTicketFilter,
    submissions, submissionsLoading, submissionFilter, setSubmissionFilter,
    openSubmission, setOpenSubmission,
    editingSubmission, setEditingSubmission,
    openAdminUser, setOpenAdminUser,
    openTicket, setOpenTicket,
    cleanedOcrText, cleaningOcr,
    loadAdminUsers, loadAdminStats, loadSubmissions, loadTickets,
    updateUserRole, deleteUser,
    updateSubmissionAndApprove, rejectSubmission,
    updateTicketStatus, cleanOcrWithAI,
    ticketsLoading,
    userSearch, setUserSearch, userSearchParam, setUserSearchParam,
    missingEans, missingEansLoading, loadMissingEans, deleteMissingEan,
    importLog, importLoading, runImport,
    reparseLog, reparseLoading, runReparse,
  }), [
    adminSection, adminStats, adminUsers, adminUsersLoading,
    adminTickets, adminTicketFilter, submissions, submissionsLoading, submissionFilter,
    openSubmission, editingSubmission, openAdminUser, openTicket,
    cleanedOcrText, cleaningOcr,
    loadAdminUsers, loadAdminStats, loadSubmissions, loadTickets,
    updateUserRole, deleteUser, updateSubmissionAndApprove, rejectSubmission,
    updateTicketStatus, cleanOcrWithAI, ticketsLoading,
    userSearch, userSearchParam, missingEans, missingEansLoading, loadMissingEans, deleteMissingEan,
    importLog, importLoading, runImport, reparseLog, reparseLoading, runReparse,
  ]);

  const navigationContextValue = useMemo(() => ({ screen, setScreen }), [screen]);

  const historyContextValue = useMemo(() => ({
    history, setHistory, historyLoading, historyScope,
    favorites, favoritesScope, loadHistory, loadFavorites, toggleFavorite, setFavoriteCategory, isFavorite,
  }), [history, historyLoading, historyScope, favorites, favoritesScope, loadHistory, loadFavorites, toggleFavorite, setFavoriteCategory, isFavorite]);

  const shoppingContextValue = useMemo(() => ({
    lists, activeList, activeListId, setActiveListId,
    shoppingList, setShoppingList, shoppingListId, setShoppingListId,
    newItemName, setNewItemName, loadShoppingList,
    familyMembers, loadFamilyMembers,
    createList, renameList, setListType, deleteList, joinByCode,
    getListAccess, grantAccess, revokeAccess,
    addToList, toggleItem, removeItem, clearDone,
  }), [lists, activeList, activeListId, setActiveListId, shoppingList, shoppingListId, newItemName, loadShoppingList,
       familyMembers, loadFamilyMembers, createList, renameList, setListType, deleteList, joinByCode,
       getListAccess, grantAccess, revokeAccess, addToList, toggleItem, removeItem, clearDone]);

  const familyFormContextValue = useMemo(() => ({
    newMemberName, setNewMemberName,
    newMemberBirthYear, setNewMemberBirthYear,
    newMemberGender, setNewMemberGender,
    newMemberAllerg, setNewMemberAllerg,
    newMemberCustomAllerg, setNewMemberCustomAllerg,
    newMemberDiets, setNewMemberDiets,
    newMemberENumbers, setNewMemberENumbers,
    newMemberSubtypes, setNewMemberSubtypes,
    newMemberCustomInput, setNewMemberCustomInput,
    editingMemberId,
    addMember, updateMember, removeMember, startEditMember, cancelEditMember,
  }), [
    newMemberName, newMemberBirthYear, newMemberGender, newMemberAllerg,
    newMemberCustomAllerg, newMemberDiets, newMemberENumbers, newMemberSubtypes,
    newMemberCustomInput, editingMemberId, addMember, updateMember, removeMember,
    startEditMember, cancelEditMember,
  ]);

  const allergenPrefsContextValue = useMemo(() => ({
    eSearch, setESearch, eCategory, setECategory,
    allergenSubtypes, setAllergenSubtypes,
    selectedENumbers, setSelectedENumbers,
    activeSubtypeModal, setActiveSubtypeModal,
  }), [eSearch, eCategory, allergenSubtypes, selectedENumbers, activeSubtypeModal]);

  return (
    <AuthProvider value={authContextValue}>
    <ProfileProvider value={profileContextValue}>
    <AdminProvider value={adminContextValue}>
    <NavigationProvider value={navigationContextValue}>
    <HistoryProvider value={historyContextValue}>
    <ShoppingProvider value={shoppingContextValue}>
    <FamilyFormProvider value={familyFormContextValue}>
    <AllergenPrefsProvider value={allergenPrefsContextValue}>
    <>
      <style>{appCss}</style>
      <div className="app" role="application" aria-label="EatSafe">
        {/* App-bred baggrund — ét fast billede bag alt andet indhold, se
            .app-bg i theme.jsx for hvorfor det er en ægte position:fixed-boks
            og ikke background-attachment:fixed. 25. sept. 2026: Scan-forsidens
            EGET baggrundsfoto (tidligere kun vist på SCREENS.HOME via en
            app-bg-scan-modifier-klasse) er gjort til det ENE, universelle
            billede for hele appen (main) — modifier-klassen er derfor fjernet,
            .app-bg bruger nu samme billede direkte, se theme.jsx. Matcher også
            denne sessions eget mål (brandkonsistens-brief: "match velkomstsiden
            1:1... samme type ingredienser placeret i kanterne" på tværs af
            Scan/Velkomst/Login) — billedet viser netop de allergen-kilder
            briefen bad om (mælk/æg/havre/fisk/skaldyr/nødder). */}
        <div className="app-bg" aria-hidden="true" />
        {/* Ekstra, let dæmpning af baggrunden KUN på Log ind/Opret konto
            (25. sept. 2026-brief: "formularen bliver vigtigst", "baggrunden
            må gerne være let dæmpet på formularsiderne") — se .app-bg-dim i
            theme.jsx. Selvstændigt lag OVEN PÅ det nu universelle baggrunds-
            billede, i stedet for at ændre .app-bg selv, så resten af appen
            beholder sin nuværende intensitet. */}
        {screen === SCREENS.LOGIN && <div className="app-bg-dim" aria-hidden="true" />}
        {/* Indkøbsliste-polish (25. sept. 2026, brugerfeedback): "fjern
            ingrediens-/fødevarebaggrunden fra Indkøbslisten — den skal kun
            bruges på den primære Scan-forside". Samme mønster som
            .app-bg-dim ovenfor (et selvstændigt lag OVEN PÅ det universelle
            .app-bg, i stedet for at ændre selve .app-bg eller gøre den
            betinget) — men helt opak (var(--paper)) i stedet for en let
            hvid dæmpning, så Indkøbslisten får appens rene hvid/off-white
            arbejdsflade uden ingrediensbilledet, mens resten af appen
            (herunder Scan-forsiden) beholder det uændret. Historik og
            Favoritter fik samme behandling (26. sept. 2026, brugerfeedback:
            "match den rene, funktionelle stil fra Indkøbslisten") —
            genbruger samme .app-bg-hide-lag i stedet for en ny klasse. */}
        {(screen === SCREENS.LIST || screen === SCREENS.HISTORY || screen === SCREENS.FAVORITES) && <div className="app-bg-hide" aria-hidden="true" />}

        {/* Skip-link for tastatur/screen reader brugere */}
        <a href="#main-content" className="skip-link">Spring til indhold</a>

        {/* Installations-prompt — kun aktiv når man er landet via beta-QR'en */}
        <InstallPrompt />

        {/* Scan-loading — vist mens et scannet/søgt produkt slås op (fra
            runLookupProduct's setLoading(true) til resultatet er klart) */}
        <ScanLoadingOverlay show={loading} />

        {/* ══ VELKOMST ══ */}
        {/* ══ ONBOARDING SCREENS ══ */}
        {(screen === SCREENS.WELCOME || screen === SCREENS.LOGIN || screen === SCREENS.ONBOARD || editMode) && (
          <Suspense fallback={LazyFallback}>
          <OnboardingScreen
            onboardStep={onboardStep} setOnboardStep={setOnboardStep}
            tourIdx={tourIdx} setTourIdx={setTourIdx}
            editMode={editMode} setEditMode={setEditMode}
            customInput={customInput} setCustomInput={setCustomInput}
            saveAllergensStep2={saveAllergensStep2}
            saveProfileStep1={saveProfileStep1} finishOnboard={finishOnboard}
            StepBar={StepBar}
            buildLabel={formatBuildTime()}
            hasPendingJoinList={!!pendingJoinList}
            onActivatePreview={activatePreviewMode}
          />
          </Suspense>
        )}
        {/* TOPBAR */}
        {!isOnboard && (
          <header className="topbar">
            <div className="topbar-logo">
              <div className="topbar-name">Eat<span>Safe</span></div>
              <div style={{ background:"var(--amber)", color:"var(--ink)", fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:100, letterSpacing:".5px", marginLeft:4, marginTop:2 }}>BETA</div>
            </div>
            {/* Topbar-knapperne var 32px, `var(--paper2)`-baggrund + `var(--muted2)`-
                ikonfarve — brugerfeedback (24. sept. 2026, opfølgning): "lidt for
                småt og anonymt ... ser næsten disabled ud". Forstørret til 38px
                (44px for Feedback-pillen), skiftet ikonfarven til det mørkere
                `var(--ink2)` og lagt en let skygge på for at give dem samme
                kort-vægt de har andre steder i appen, i stedet for at blende ind. */}
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {/* Feedback-knap */}
              <button onClick={() => { setFeedbackOpen(true); setFeedbackDone(false); }}
                style={{ background:"var(--paper2)", border:"1px solid var(--border2)", borderRadius:100, padding:"9px 15px", fontFamily:"var(--f)", fontSize:12.5, fontWeight:700, color:"var(--ink2)", cursor:"pointer", display:"flex", alignItems:"center", gap:6, boxShadow:"var(--sh)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                Feedback
              </button>
              {/* Menu-knap — profil, familie, favoritter, historik, opskrifter, viden m.m. */}
              <button onClick={() => setShowProfileMenu(true)} aria-label="Åbn menu"
                style={{ position:"relative", background:"var(--paper2)", border:"1px solid var(--border2)", borderRadius:"50%", width:38, height:38, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"var(--sh)" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2.2"><path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>
                {[SCREENS.PROFILE, SCREENS.EDITPROFILE, SCREENS.HISTORY, SCREENS.FAVORITES, SCREENS.FAMILY, SCREENS.ADMIN, SCREENS.MADPAS, SCREENS.RESTAURANTGUIDE, SCREENS.RECIPES, SCREENS.KNOWLEDGE].includes(screen) && (
                  <span style={{ position:"absolute", top:-1, right:-1, width:9, height:9, borderRadius:"50%", background:"var(--green)", border:"1.5px solid var(--paper)" }} />
                )}
              </button>
            </div>
          </header>
        )}

        {/* Feedback-knap under onboarding */}
        {isOnboard && (
          <div style={{ position:"fixed", top:12, right:12, zIndex:1000 }}>
            <button onClick={() => { setFeedbackOpen(true); setFeedbackDone(false); }}
              style={{ background:"var(--paper2)", border:"1px solid var(--border2)", borderRadius:100, padding:"6px 12px", fontFamily:"var(--f)", fontSize:11, fontWeight:700, color:"var(--ink2)", cursor:"pointer", display:"flex", alignItems:"center", gap:6, boxShadow:"0 2px 8px rgba(0,0,0,.15)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              Feedback
            </button>
          </div>
        )}

        {/* ══ HJÆLP MODAL ══ */}
        {helpOpen && (
          <HelpModal
            screen={screen}
            onClose={() => setHelpOpen(false)}
            onOpenFeedback={() => { setFeedbackOpen(true); setFeedbackDone(false); }}
          />
        )}

        {/* ══ SLET KONTO MODAL ══ */}
        {showDeleteAccount && (
          <DeleteAccountModal
            setShowDeleteAccount={setShowDeleteAccount}
            deleteConfirmText={deleteConfirmText} setDeleteConfirmText={setDeleteConfirmText}
            deletingAccount={deletingAccount} deleteOwnAccount={deleteOwnAccount}
          />
        )}

        {/* ══ BETA INTRO ══ */}
        {!betaIntroSeen && (
          <BetaIntroModal
            betaIntroStep={betaIntroStep} setBetaIntroStep={setBetaIntroStep} setBetaIntroSeen={setBetaIntroSeen}
          />
        )}

        {/* ══ TOAST (delt succes-/fejl-besked, erstatter native alert()) ══ */}
        <ToastHost />

        {/* ══ FEEDBACK MODAL ══ */}
        {feedbackOpen && (
          <Suspense fallback={null}>
          <FeedbackModal
            open={feedbackOpen} onClose={() => setFeedbackOpen(false)}
            authTab={authTab} onboardStep={onboardStep}
            scanResult={scanResult} madpasWaiterView={madpasWaiterView}
            madpasLang={madpasLang} selectedRecipe={selectedRecipe}
            editMode={editMode} showManualEan={showManualEan}
            profilePopup={profilePopup}
          />
          </Suspense>
        )}

        {/* ══ MENU (favoritter, familie, historik, opskrifter, viden, profil m.m.) ══ */}
        {showProfileMenu && (
          <Suspense fallback={null}>
          <ProfileMenu
            open={showProfileMenu} onClose={() => setShowProfileMenu(false)}
            onNavigate={(s) => { setScreen(s); setShowProfileMenu(false); }}
            onOpenBetaInfo={() => { setBetaIntroStep(0); setBetaIntroSeen(false); setShowProfileMenu(false); }}
          />
          </Suspense>
        )}

        {/* ── OFFLINE BANNER ── */}
        {isOffline && (
          <div style={{
            position:"sticky", top:0, zIndex:200,
            background:"var(--amber)", color:"var(--on-green)",
            fontSize:12, fontWeight:700,
            padding:"8px 16px",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            textAlign:"center",
          }}>
            <Icon name="block" size={13} color="var(--on-green)" /> Offline — viser lokalt cachede data
          </div>
        )}

        {/* ══ HJEM ══ */}
        {/* ══ SCANNER SCREENS ══ */}
        {(screen === SCREENS.HOME || screen === SCREENS.RESULT || screen === SCREENS.NOTFOUND || screen === SCREENS.SUBMITTED || screen === SCREENS.SEARCH || screen === SCREENS.LIST || screen === SCREENS.SUGGEST_EDIT) && (
          <ErrorBoundary screen="Scanner">
          <ScannerScreen
            scanResult={scanResult} notFoundEan={notFoundEan}
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            searchResults={searchResults} setSearchResults={setSearchResults}
            searchCategory={searchCategory} setSearchCategory={setSearchCategory}
            searchHasMore={searchHasMore} searchTotal={searchTotal}
            searchLoadingMore={searchLoadingMore} loadMoreSearchResults={loadMoreSearchResults}
            scanError={scanError}
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
            cameraActive={cameraActive} setCameraActive={setCameraActive}
            scanReady={scanReady}
            galleryInputRef={galleryInputRef}
            lastScannedRef={lastScannedRef}
            handleEditProductCapture={handleEditProductCapture}
            handleImageCapture={handleImageCapture}
            handleProductImageCapture={handleProductImageCapture}
            editProductImage={editProductImage}
            editProductImageB64={editProductImageB64}
            scanFromGallery={scanFromGallery}
            searchLoading={searchLoading}
            startCamera={startCamera}
            stopCamera={stopCamera}
            toggleTorch={toggleTorch}
            torchOn={torchOn}
            scanZoom={scanZoom}
            showPhotoHint={showPhotoHint}
            photoScanLoading={photoScanLoading}
            photoFallbackRef={photoFallbackRef}
            scanPhotoForEan={scanPhotoForEan}
            setKnowledgeSlug={setKnowledgeSlug}
            lookupProduct={lookupProduct}
            selectedENumbers={selectedENumbers}
            activeIds={activeIds}
            activeENumbers={activeENumbers}
            alternatives={alternatives}
            altLoading={altLoading}
            onOpenHelp={() => setHelpOpen(true)}
          />
          </ErrorBoundary>
        )}

        {/* ══ MADPAS SCREEN ══ */}
        {(screen === SCREENS.MADPAS || madpasWaiterView) && (
          <Suspense fallback={LazyFallback}>
          <ErrorBoundary screen="Madpas">
          <MadpasScreen
            madpasLang={madpasLang} setMadpasLang={setMadpasLang}
            madpasProfileId={madpasProfileId} setMadpasProfileId={setMadpasProfileId}
            madpasSpeaking={madpasSpeaking} setMadpasSpeaking={setMadpasSpeaking}
            madpasBig={madpasBig}
            madpasWaiterView={madpasWaiterView} setMadpasWaiterView={setMadpasWaiterView}
            mpAllergens={mpAllergens} mpCustom={mpCustom}
            langOpen={langOpen} setLangOpen={setLangOpen}
            madpasSpeak={madpasSpeak}
            selectedENumbers={selectedENumbers}
          />
          </ErrorBoundary>
          </Suspense>
        )}

        {/* ══ KNOWLEDGE / LEKSIKON SCREEN ══ */}
        {screen === SCREENS.KNOWLEDGE && (
          <Suspense fallback={LazyFallback}>
          <ErrorBoundary screen="Leksikon">
          <KnowledgeScreen
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
          <Suspense fallback={LazyFallback}>
          <ErrorBoundary screen="Profil">
          <ProfileScreen
            customInput={customInput} setCustomInput={setCustomInput}
            lookupProduct={lookupProduct}
          />
          </ErrorBoundary>
          </Suspense>
        )}

        {/* ══ INDSTILLINGER ══ (26. sept. 2026, brugerfeedback) — Konto/
            notifikationsindholdet flyttet hertil fra ProfileScreen.jsx, se
            SettingsScreen.jsx's egen kommentar. Nås via ProfileMenu.jsx's
            "Indstillinger", ikke fra bundnavigationen. */}
        {screen === SCREENS.SETTINGS && (
          <Suspense fallback={LazyFallback}>
          <ErrorBoundary screen="Indstillinger">
          <SettingsScreen
            setShowDeleteAccount={setShowDeleteAccount} setDeleteConfirmText={setDeleteConfirmText}
          />
          </ErrorBoundary>
          </Suspense>
        )}

        {/* ══ RECIPES SCREEN ══ */}
        {screen === SCREENS.RECIPES && (
          <Suspense fallback={LazyFallback}>
          <ErrorBoundary screen="Opskrifter">
          <RecipesScreen
            recipes={recipes} recipesLoading={recipesLoading}
            selectedRecipe={selectedRecipe} setSelectedRecipe={setSelectedRecipe}
            recipeSearch={recipeSearch} setRecipeSearch={setRecipeSearch}
            showSafeOnly={showSafeOnly} setShowSafeOnly={setShowSafeOnly}
            showSubmitRecipe={showSubmitRecipe} setShowSubmitRecipe={setShowSubmitRecipe}
            submitRecipe={submitRecipe} setSubmitRecipe={setSubmitRecipe}
            submitSteps={submitSteps} setSubmitSteps={setSubmitSteps}
            submitIngredients={submitIngredients} setSubmitIngredients={setSubmitIngredients}
            submittingRecipe={submittingRecipe}
            loadRecipes={loadRecipes} loadRecipeIngredients={loadRecipeIngredients} submitUserRecipe={submitUserRecipe}
            loading={loading}
            recipeFilter={recipeFilter} setRecipeFilter={setRecipeFilter}
            recipeSafeOnly={recipeSafeOnly} setRecipeSafeOnly={setRecipeSafeOnly}
            favoriteRecipes={favoriteRecipes} setFavoriteRecipes={setFavoriteRecipes}
            activeIds={activeIds}
            completedSteps={completedSteps} setCompletedSteps={setCompletedSteps}
            recipeServings={recipeServings} setRecipeServings={setRecipeServings}
            setRecipes={setRecipes}
          />
          </ErrorBoundary>
          </Suspense>
        )}



        {/* ADMIN PANEL */}
        {screen === SCREENS.ADMIN && user?.role === "admin" && (
          <Suspense fallback={null}>
          <ErrorBoundary screen="Admin">
          <AdminScreen />
          </ErrorBoundary>
          </Suspense>
        )}

        {/* BUNDNAVIGATION */}
        {!isOnboard && !madpasWaiterView && (
          <nav className="bottom-nav" role="navigation" aria-label="Hovednavigation">
            {[
              [SCREENS.LIST,    "cart",     "Indkøbsliste"],
              [SCREENS.HOME,    "scanframe","Scan"],
              [SCREENS.HISTORY, "clock",    "Historik"],
            ].map(([s,icon,lbl]) => (
              <div key={s} className={`nav-item${(
                screen===s ||
                (screen===SCREENS.RESULT && s===SCREENS.HOME) ||
                (screen===SCREENS.NOTFOUND && s===SCREENS.HOME) ||
                (screen===SCREENS.SUBMITTED && s===SCREENS.HOME)
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
    </AllergenPrefsProvider>
    </FamilyFormProvider>
    </ShoppingProvider>
    </HistoryProvider>
    </NavigationProvider>
    </AdminProvider>
    </ProfileProvider>
    </AuthProvider>
  );
}