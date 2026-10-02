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
  getTraceLog, householdToProfiles, syncLinkedActiveProfiles, isLinkedProfileId, visibleDiets, mergeAllergenLevels
} from "./helpers.js";

import {
  Icon, IngredientsList, ProfileBadges,
  getProductIcon, ProductImage, LazyFallback, ToastHost, showToast,
  ScanLoadingOverlay
} from "./SharedComponents.jsx";

import AppHeader from "./AppHeader.jsx";
import { ENumberPicker } from "./AllergenPicker.jsx";
import { MemberForm, CategorySelect } from "./MemberForm.jsx";
import { ProgressIndicator } from "./DesignSystem.jsx";
const AdminScreen = React.lazy(() => import('./AdminScreen.jsx'));
const OnboardingScreen = React.lazy(() => import('./OnboardingScreen.jsx'));
const MadpasScreen = React.lazy(() => import('./MadpasScreen.jsx'));
const ProfileScreen = React.lazy(() => import('./ProfileScreen.jsx'));
const SettingsScreen = React.lazy(() => import('./SettingsScreen.jsx'));
const NotificationsScreen = React.lazy(() => import('./NotificationsScreen.jsx'));
const NotificationScreen = React.lazy(() => import('./NotificationScreen.jsx'));
const TicketScreen = React.lazy(() => import('./TicketScreen.jsx'));
import ScannerScreen from './ScannerScreen.jsx';
const RecipesScreen = React.lazy(() => import('./RecipesScreen.jsx'));
const KnowledgeScreen = React.lazy(() => import('./KnowledgeScreen.jsx'));
const TermsScreen = React.lazy(() => import('./TermsScreen.jsx'));
const PrivacyScreen = React.lazy(() => import('./PrivacyScreen.jsx'));
const FeedbackModal = React.lazy(() => import('./FeedbackModal.jsx'));
const ProfileMenu = React.lazy(() => import('./ProfileMenu.jsx'));
import ErrorBoundary from './ErrorBoundary.jsx';
import { useOffline } from './useOffline.js';

import { appCss } from './theme.jsx';
import { BUILD_TIME, COMMIT_SHA, formatBuildTime, buildScreenLabel } from './utils.jsx';
import { useShoppingList } from './useShoppingList.js';
import { useFamily } from './useFamily.js';
import { useHousehold } from './useHousehold.js';
import { syncPushToken } from './usePush.js';
import { useHistory } from './useHistory.js';
import { useAuth, markOnboardedLocally, ONBOARDED_KEY, PENDING_VERIFY_KEY } from './useAuth.js';
const VerifyEmailScreen = React.lazy(() => import('./VerifyEmailScreen.jsx'));
const ResetPasswordScreen = React.lazy(() => import('./ResetPasswordScreen.jsx'));
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
import SafetyInfoModal from "./SafetyInfoModal.jsx";
import DeleteAccountModal from "./DeleteAccountModal.jsx";
import { useAdminTools } from "./useAdminTools.js";
import { useIncomingLinks } from "./useIncomingLinks.js";
import { useNotifications } from "./useNotifications.js";
import { useLoadUserData } from "./useLoadUserData.js";

// Skærme en bruger med ufuldført onboarding ALTID må kunne se/blive på (29.
// sept. 2026, "Onboarding-persistens") — se setScreen-wrapperen i
// EatSafe()-komponenten nedenfor, som håndhæver dette for enhver anden skærm.
// TERMS/PRIVACY tilføjet 29. sept. 2026 ("Opdater siderne Brugsvilkår og
// Privatlivspolitik") — juridiske sider skal altid kunne ses, uanset
// onboarding-status, præcis samme begrundelse som WELCOME/LOGIN/ONBOARD.
const ONBOARDING_EXEMPT_SCREENS = [SCREENS.WELCOME, SCREENS.LOGIN, SCREENS.ONBOARD, SCREENS.VERIFYEMAIL, SCREENS.RESETPASSWORD, SCREENS.BOOT, SCREENS.TERMS, SCREENS.PRIVACY];
// Skærme uden AppHeader/bundnavigation (login, bekræftelse, onboarding).
const AUTH_FLOW_SCREENS = [SCREENS.WELCOME, SCREENS.LOGIN, SCREENS.ONBOARD, SCREENS.VERIFYEMAIL, SCREENS.RESETPASSWORD, SCREENS.BOOT];

// Startskærm (30. sept. 2026): kun en enhed, der har set onboarding færdig
// (ONBOARDED_KEY), starter direkte på forsiden. Andre med en session venter
// på den rigtige status (BOOT → useAuth.resolveOnboardingRoute), og en
// oprettet, ubekræftet konto åbner bekræftelsesskærmen igen.
function initialScreen() {
  try {
    const token = localStorage.getItem("as_token") || sessionStorage.getItem("as_token");
    if (token) return localStorage.getItem(ONBOARDED_KEY) ? SCREENS.HOME : SCREENS.BOOT;
    if (localStorage.getItem(PENDING_VERIFY_KEY)) return SCREENS.VERIFYEMAIL;
  } catch { /* privat tilstand */ }
  return SCREENS.WELCOME;
}

// ─── HOVED KOMPONENT ─────────────────────────────────────────────────────────

export default function EatSafe() {
  // Auth state → useAuth hook

  // UI state
  const [screen, setScreenRaw] = useState(initialScreen);

  // User data
  const [user, setUser] = useState({ name:"", age:"", email:"", phone:"", password:"", role:"", onboarding_completed: undefined, onboarding_step: 1 });
  const [allergens, setAllergens] = useState([]);
  const [customAllerg, setCustomAllerg] = useState([]);

  // Route guard (29. sept. 2026, "Onboarding-persistens") — en bruger med
  // onboarding_completed===false må ALDRIG kunne lande på scanner/historik/
  // indkøbsliste/øvrige hovedfunktioner, uanset hvor i appen setScreen(...)
  // kaldes fra (WELCOME/LOGIN/ONBOARD er de eneste undtagelser). Wrappet HER
  // — ikke ved hvert enkelt setScreen-kald i hele appen — så ALLE ~30+
  // eksisterende kaldesteder (direkte i denne fil og via NavigationContext
  // til andre skærme) automatisk får beskyttelsen uden selv at ændres.
  // user.onboarding_completed===undefined ("endnu ukendt", før første
  // profilhentning er landet) blokerer bevidst IKKE — ellers ville hver
  // eneste appstart vise et kort, forkert glimt af ONBOARD for en allerede
  // færdig bruger, mens den rigtige status stadig hentes. Kun en BEKRÆFTET
  // false blokerer.
  // Reel bug rettet 29. sept. 2026, bruger-rapporteret: "Ikke nu" i trin 5
  // gik korrekt videre til beta-informationen, men efter den var lukket, var
  // man tilbage på trin 5 — screen var reelt ALDRIG blevet HOME, kun skjult
  // bag beta-modalens uigennemsigtige fuldskærms-overlay imens. Rodårsag:
  // finishOnboard (useOnboarding.js) kalder setUser(...onboarding_completed:
  // true) og setScreen(SCREENS.HOME) synkront, lige efter hinanden — men
  // guarden nedenfor læste ORDINÆR React-state (user.onboarding_completed)
  // via en useCallback-closure, som IKKE opdateres synkront af en
  // forudgående setUser-kald i samme funktion (React batcher/committer
  // state-opdateringer asynkront, effekter kører først EFTER commit). Guarden
  // så derfor stadig den GAMLE false-værdi i selve setScreen(HOME)-kaldet,
  // og omdirigerede tilbage til ONBOARD — den tidligere kommentar om at
  // "opdatere lokal state FØR setScreen" løste derfor ikke racet, den
  // beskrev kun rækkefølgen i kildekoden, ikke hvornår React reelt
  // committer den. onboardingCompletedRef + markOnboardingCompleted
  // (nedenfor) opdaterer en almindelig ref-værdi SYNKRONT, uden om Reacts
  // batching, så guarden altid ser den friske værdi med det samme.
  const onboardingCompletedRef = useRef(user.onboarding_completed);
  useEffect(() => { onboardingCompletedRef.current = user.onboarding_completed; }, [user.onboarding_completed]);
  const markOnboardingCompleted = useCallback(() => {
    onboardingCompletedRef.current = true;
    markOnboardedLocally();
    setUser(u => ({ ...u, onboarding_completed: true }));
  }, []);

  const setScreen = useCallback((next) => {
    // Funktionsform (som useState): bruges af app-startens routing, så den kan lade en allerede åbnet besked stå.
    if (typeof next === "function") {
      setScreenRaw((cur) => {
        const target = next(cur);
        return onboardingCompletedRef.current === false && !ONBOARDING_EXEMPT_SCREENS.includes(target) ? SCREENS.ONBOARD : target;
      });
      return;
    }
    if (onboardingCompletedRef.current === false && !ONBOARDING_EXEMPT_SCREENS.includes(next)) {
      setScreenRaw(SCREENS.ONBOARD);
      return;
    }
    setScreenRaw(next);
  }, []);

  // Brugsvilkår/Privatlivspolitik som almindelige undersider, ikke modaler
  // (29. sept. 2026) — legalReturnScreen husker PRÆCIS hvilken skærm der
  // åbnede siden (Velkommen/Ny bruger/Log ind/Indstillinger/Profil m.fl.),
  // så tilbagepilen i TermsScreen.jsx/PrivacyScreen.jsx kan føre brugeren
  // tilbage did — IKKE et fast "hjem"-mål. Selve formularfelterne (e-mail/
  // adgangskode/onboarding-trin) går ALDRIG tabt ved denne navigation, da de
  // allerede lever i App.jsx's egne hooks (useAuth/useOnboarding), ikke i de
  // enkelte skærmkomponenters lokale state — se CLAUDE.md's note om dette.
  const [legalReturnScreen, setLegalReturnScreen] = useState(SCREENS.WELCOME);
  const openLegal = useCallback((target) => {
    setLegalReturnScreen(screen);
    setScreen(target);
  }, [screen, setScreen]);

  // Onboarding-trin — deklareret HER (før useAuth-kaldet nedenfor), ikke
  // inde i useOnboarding.js som tidligere (29. sept. 2026, "Onboarding-
  // persistens") — useAuth() skal kunne sætte det aktuelle trin direkte
  // ved login/OAuth/app-boot-genoptagelse, og useAuth() kaldes FØR
  // useOnboarding() længere nede i denne fil.
  const [onboardStep, setOnboardStep] = useState(1);
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
  // Krydskontaminerings-advarsel i Madpas (27. sept. 2026, Madpas-finpolish,
  // krav 7) — bevidst opt-IN, default FRA: EatSafe må ikke selv antage
  // alvorlighedsgraden af brugerens allergi, så beskeden vises/oplæses
  // KUN hvis brugeren selv har slået den til her.
  const [madpasCrossContact, setMadpasCrossContact] = useState(() => localStorage.getItem("as_madpas_cross_contact") === "1");
  // Scanning-indstillinger (28. sept. 2026, Indstillinger-forbedring) —
  // vibration/lyd ved et allergi-match ("advarsel" = danger ELLER warn)
  // ved siden af den allerede eksisterende, ubetingede "scan registreret"-
  // feedback i useScanner.js (kamera-detektion, uafhængig af resultatet).
  // Default TIL, i modsætning til madpasCrossContact — dette er ikke en
  // antagelse om brugerens allergi-alvorlighed, kun en tilgængeligheds-
  // feedback de fleste forventer er slået til.
  const [vibrateOnWarning, setVibrateOnWarning] = useState(() => localStorage.getItem("as_vibrate_on_warning") !== "0");
  const [soundOnWarning, setSoundOnWarning] = useState(() => localStorage.getItem("as_sound_on_warning") !== "0");
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
  // "Vigtig sikkerhedsinformation" (SafetyInfoModal). Skjult som standard; åbnes enten som sidste skridt i onboarding (så
  // gennemføres onboarding først, når brugeren har trykket "Jeg forstår", og et genstart før da genoptager trin 5) eller manuelt
  // fra menuen/Indstillinger.
  const [showSafetyInfo, setShowSafetyInfo] = useState(false);
  const [safetyEndsOnboarding, setSafetyEndsOnboarding] = useState(false);
  const [safetyBusy, setSafetyBusy] = useState(false);

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
    authError, setAuthError, authInfo, emailTakenError, setEmailTakenError,
    emailError, setEmailError, passwordError, setPasswordError, authLoading, setAuthLoading,
    authTab, setAuthTab, isOAuth, setIsOAuth,
    rememberMe, setRememberMe,
    saveTokens, clearAuth, handleLogin, handleSignup, handleOAuth, handleForgotPassword,
    verifyEmail, verifyStatus, verifyError, verifyNotice, verifyLoading, resendCooldown,
    checkEmailVerified, resendVerification, changeVerifyEmail, continueAfterVerify,
    resetError, resetLoading, resetDone, setResetError, submitNewPassword, continueAfterReset,
  } = useAuth({ setScreen, setUser, setAllergens, setCustomAllerg, setOnboardStep });

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
    newMemberLevels, setNewMemberLevels,
    newMemberENumbers, setNewMemberENumbers,
    newMemberSubtypes, setNewMemberSubtypes,
    newMemberCustomInput, setNewMemberCustomInput,
    editingMemberId,
    loadFamily, addMember, updateMember, removeMember, startEditMember, cancelEditMember,
  } = useFamily({ accessToken, userId, setActiveProfiles });

  // Husstandens rigtige konti (1. okt. 2026): skrivebeskyttede profiler, der kan vælges ved scanning,
  // søgning, lister, historik og Madpas. `family` er stadig kun de profiler, man selv har oprettet
  // (de eneste, der kan redigeres/slettes); `scanFamily` er begge dele.
  const { household, setHousehold, householdLoading, householdLoaded, loadHousehold } = useHousehold({ accessToken });
  const linkedProfiles = useMemo(() => householdToProfiles(household), [household]);
  const scanFamily = useMemo(() => [...family, ...linkedProfiles], [family, linkedProfiles]);
  // Madpas: peger "Vis madpas for" på en konto, der ikke længere findes, falder det tilbage til én selv.
  useEffect(() => {
    if (householdLoaded && madpasProfileId !== "self" && !scanFamily.some(m => m.id === madpasProfileId)) setMadpasProfileId("self");
  }, [householdLoaded, scanFamily, madpasProfileId]);
  // Nye husstandskonti vælges som standard; konti, der er forladt husstanden, fjernes fra valget.
  useEffect(() => {
    if (!householdLoaded || !userId) return;
    const ids = linkedProfiles.map(p => p.id);
    const key = `as_known_household_${userId}`;
    let known = [];
    try { known = JSON.parse(localStorage.getItem(key) || "[]"); } catch { /* ignoreres */ }
    setActiveProfiles(a => syncLinkedActiveProfiles(a, ids, known));
    try { localStorage.setItem(key, JSON.stringify(ids)); } catch { /* ignoreres */ }
  }, [householdLoaded, linkedProfiles, userId]);

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
    setActiveProfiles(a => ["me", ...family.map(m => m.id), ...(a || []).filter(isLinkedProfileId)]);
  }, [family]);

  // ── MADPAS SPEAK → useMadpas hook (placeret efter useFamily pga. family-dependency) ──
  const { madpasSpeaking, setMadpasSpeaking,
          madpasWaiterView, setMadpasWaiterView, langOpen, setLangOpen,
          madpasSpeak } = useMadpas({
    allergens, customAllerg, user, madpasLang, family: scanFamily, madpasProfileId, madpasCrossContact
  });

  const {
    history, setHistory,
    historyLoading, historyScope,
    favorites, setFavorites, favoritesScope,
    loadHistory, saveHistoryEntry, loadFavorites, toggleFavorite, setFavoriteCategory, isFavorite,
  } = useHistory({ accessToken, userId });

  const {
    editMode, setEditMode,
    tourIdx, setTourIdx,
    customInput, setCustomInput,
    saveProfileStep1, saveAllergensStep2, saveDietStep3, finishOnboard: finishOnboardRaw,
  } = useOnboarding({ accessToken, userId, user, loginEmail, screen,
                      onboardStep, setOnboardStep,
                      allergens, customAllerg, selectedENumbers,
                      setUser, markOnboardingCompleted, setScreen, setEditMode: () => {}, setIsOAuth });

  // Sidste onboarding-trin (notifikationer) kalder finishOnboard(): det åbner kun sikkerhedsinformationen. Onboarding markeres først
  // som gennemført (og appen åbnes), når brugeren trykker "Jeg forstår" (acknowledgeSafety) — ingen skjulte trin efter 5/5, og
  // appen kan ikke nås uden at have set den.
  const finishOnboard = () => { setSafetyEndsOnboarding(true); setShowSafetyInfo(true); };
  const openSafetyInfo = () => { setSafetyEndsOnboarding(false); setShowSafetyInfo(true); };
  const acknowledgeSafety = async () => {
    if (safetyBusy) return;
    setSafetyBusy(true);
    try { if (safetyEndsOnboarding) await finishOnboardRaw(); }
    finally { setSafetyEndsOnboarding(false); setShowSafetyInfo(false); setSafetyBusy(false); }
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

  // ── Manglende EAN'er + OFF-import (admin) → useAdminTools ──
  const {
    missingEans, missingEansLoading, loadMissingEans, deleteMissingEan,
    importLog, importLoading, runImport,
  } = useAdminTools(accessToken);

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

  // ── Familie-invitation og delt indkøbsliste via link → useIncomingLinks ──
  const { pendingJoinList } = useIncomingLinks({
    accessToken, userId, user, loadFamily,
    joinByCode, loadShoppingList, setAuthTab, setScreen,
  });

  // ── Beskeder (liste, ulæst-tæller og ?notification=-ruten fra push) ──────
  const notifications = useNotifications({ accessToken, userId, user, screen, setScreen, setAuthTab });

  // Push er per enhed, ikke per konto: har enheden allerede givet tilladelse, får den konto, der er logget ind,
  // sit abonnement gemt her (ellers viser appen push som "til", men der kommer intet). Spørger aldrig om tilladelse.
  React.useEffect(() => {
    if (accessToken && userId) syncPushToken(accessToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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

  // Ryd familie/historik/indkøb + luk hamburgermenuen når auth cleares
  // (accessToken → null) — sikkerhedsnet for AL logout, ikke kun det
  // eksplicitte "Log ud"-tryk i ProfileMenu.jsx (som lukker menuen synkront
  // selv, se dens handleItemClick): dækker også session-udløb/tvungen
  // logout (useAuth.js) og admin-401-logout (useAdmin.js), hvor menuen
  // teoretisk kan stå åben når auth-state ændres i baggrunden. Uden dette
  // blev showProfileMenu aldrig nulstillet af selve auth-state-ændringen —
  // kun af et eksplicit onClose-kald — så hamburgermenuen kunne blive
  // stående åben oven på velkomstskærmen efter logout (bruger-rapporteret
  // fund, 28. sept. 2026).
  React.useEffect(() => {
    if (!accessToken) {
      setFamily([]);
      setHistory([]);
      setShoppingList([]);
      setShowProfileMenu(false);
    }
  }, [accessToken]);

  // ── Load brugerdata ved login → useLoadUserData ──
  useLoadUserData({
    accessToken, userId, setUser, setSelectedENumbers, setAllergens, setCustomAllerg,
    loadFamily, loadShoppingList, loadFavorites,
  });

  const isOnboard = AUTH_FLOW_SCREENS.includes(screen) || editMode;
  // Brugsvilkår/Privatlivspolitik (29. sept. 2026) — egen, selvstændig sticky
  // header (.legal-topbar, se TermsScreen.jsx/PrivacyScreen.jsx), ALDRIG
  // sammen med AppHeader eller bundnavigationen, uanset om siden blev åbnet
  // fra en kontekst der normalt viser dem (Indstillinger/Profil) eller ikke
  // (Velkommen/Log ind) — så navigationen er identisk uanset indgang.
  const isLegalPage = screen === SCREENS.TERMS || screen === SCREENS.PRIVACY;
  // Bidragsflowet (foto/indtastning) skjuler bundnavigationen, så brugeren holder fokus og ikke navigerer væk ved et uheld. Valgmenuen (start) og kvitteringen (done) viser den.
  const hideNavForContribution = screen === SCREENS.SUGGEST_EDIT && ["guide", "scanning", "review", "sending"].includes(editStep);

  const FamilyChips = () => {
    const allIds = ["me", ...scanFamily.map(m => m.id)];
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
        {scanFamily.map(m => (
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
    scanFamily.filter(m => activeProfiles.includes(m.id)).forEach(m => {
      (m.allergens || []).forEach(a => ids.add(a));
      (m.eNumbers || []).forEach(e => eNums.add(e));
      (m.custom || []).forEach(c => custom.add(c));
    });
    // Følsomhed pr. allergen på tværs af de aktive profiler (strengeste profil vinder)
    const levels = mergeAllergenLevels([
      ...(activeProfiles.includes("me") ? [{ allergens, levels: user?.allergenLevels }] : []),
      ...scanFamily.filter(m => activeProfiles.includes(m.id)).map(m => ({ allergens: m.allergens, levels: m.levels })),
    ]);
    return { ids: [...ids], custom: [...custom], eNumbers: [...eNums], levels };
  }, [allergens, customAllerg, selectedENumbers, scanFamily, activeProfiles, user?.allergenLevels]);

  // allActive() rebygger Sets og looper family — kaldes kun én gang og
  // destructures i stedet for to separate kald der hver genberegner det samme
  const { ids: activeIds, custom: activeCustom, eNumbers: activeENumbers, levels: activeLevels } = allActive();

  
  // ── SCANNER ───────────────────────────────────────────────────────────────
  const {
    cameraActive, setCameraActive,
    scanReady,
    torchOn, setTorchOn,
    scanZoom,
    showPhotoHint, setShowPhotoHint,
    photoScanLoading,
    cameraPermissionDenied,
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
  //
  // `closeCameraFully` (28. sept. 2026, BUGFIX – scanner state) — samme
  // fund som ScannerScreen.jsx's `handleCloseCamera`: `stopCamera()` alene
  // ved intet om det manuelle EAN-panel (`showManualEan`, App.jsx-state),
  // så et kamera-luk via navigation væk fra scanner-skærmene, appen i
  // baggrunden, eller Android-tilbageknappen kunne alle efterlade panelet
  // stående åbent. Bruges her ved siden af (ikke i stedet for)
  // ScannerScreen.jsx's egen `handleCloseCamera`, som dækker det
  // eksplicitte luk-kamera-tryk og samtidig nulstiller sin egen lokale
  // EAN-værdi/-fejltekst.
  const closeCameraFully = useCallback(() => { stopCamera(); setShowManualEan(false); }, [stopCamera]);

  const SCANNER_SCREENS = [SCREENS.HOME, SCREENS.RESULT, SCREENS.NOTFOUND, SCREENS.SUBMITTED, SCREENS.SEARCH, SCREENS.LIST, SCREENS.SUGGEST_EDIT];
  useEffect(() => {
    if (!cameraActive) return;
    if (!SCANNER_SCREENS.includes(screen)) closeCameraFully();
  }, [screen, cameraActive, closeCameraFully]);

  useEffect(() => {
    const onVisibilityChange = () => { if (document.hidden) closeCameraFully(); };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [closeCameraFully]);

  // Ref der altid peger på den seneste lookupProduct (undgår TDZ-cirkulær afhænighed)
  const lookupProductRef = useRef(null);

// ── SØGNING → useSearch hook ────────────────────────────────────────────────
  const { searchQuery, setSearchQuery, searchCategory, setSearchCategory,
          searchResults, setSearchResults, searchLoading,
          searchHasMore, searchTotal, searchLoadingMore, loadMoreSearchResults } = useSearch({ accessToken });

  const { alternatives, altLoading, loadAlternatives, clearAlternatives } = useAlternatives({ accessToken, activeIds, activeLevels });

  // Selve scan-resultat-pipelinen (opslag/allergen-match/familie-impact/
  // cache/historik/alternativer) er flyttet til useProduct.js' runLookupProduct
  // — denne wrapper sender blot alt afhængigt state med som ctx ved hvert kald,
  // så der (i modsætning til før) ALDRIG kan opstå en stale-closure-bug fra en
  // ufuldstændig deps-liste.
  const lookupProduct = useCallback((ean) => runLookupProduct(ean, {
    accessToken, activeIds, activeLevels, activeCustom, activeENumbers, family: scanFamily, activeProfiles,
    productCacheRef, scanTokenRef, saveHistoryEntry, loadAlternatives, clearAlternatives,
    setScanResult, setScreen, setLoading, setScanError, setShowIng, setHistory,
    setNotFoundEan, setNotFoundStep, setOcrText, setProposedName, setProposedFlags,
    setProductImagePreview, setProductImageBase64,
    vibrateOnWarning, soundOnWarning,
  }), [accessToken, activeIds, activeLevels, activeCustom, activeENumbers, scanFamily, activeProfiles,
       productCacheRef, scanTokenRef, saveHistoryEntry, loadAlternatives, clearAlternatives,
       setScanResult, setScreen, setLoading, setScanError, setShowIng, setHistory,
       setNotFoundEan, setNotFoundStep, setOcrText, setProposedName, setProposedFlags,
       setProductImagePreview, setProductImageBase64,
       vibrateOnWarning, soundOnWarning]);
  lookupProductRef.current = lookupProduct;

  // Primær handling fra en besked. Produktet slås op på ny (aktuel status),
  // så en gammel besked aldrig fungerer som en aktuel sikkerhedsvurdering.
  const [openTicketId, setOpenTicketId] = useState(null);
  React.useEffect(() => { if (!accessToken) setOpenTicketId(null); }, [accessToken]);
  const handleNotificationAction = useCallback((action) => {
    if (action?.type === "open_product" && action.params?.ean) lookupProduct(action.params.ean);
    else if (action?.type === "open_family") setScreen(SCREENS.FAMILY);
    else if (action?.type === "open_list") setScreen(SCREENS.LIST);
    else if (action?.type === "open_ticket" && action.params?.ticketId) { setOpenTicketId(action.params.ticketId); setScreen(SCREENS.TICKET); }
    else if (action?.type === "scan") setScreen(SCREENS.HOME);
  }, [lookupProduct, setScreen]);

  // ── COMPUTED (afhænger af hooks) ─────────────────────────────────────────
  const madpasActiveProfile = madpasProfileId === "self" ? null : scanFamily.find(m => m.id === madpasProfileId);
  const mpAllergens = madpasActiveProfile ? (madpasActiveProfile.allergens || []) : allergens;
  const mpCustom = madpasActiveProfile ? (madpasActiveProfile.custom || []) : customAllerg;
  // Kostpræferencer fulgte tidligere ALTID den loggede bruger selv
  // (user.diets), også når "Vis madpas for" pegede på et familiemedlem —
  // reel bug, rettet 26. sept. 2026 (Madpas-redesign, krav 2: "Madpasset
  // skal altid genereres ud fra den valgte profils aktuelle ...
  // kostpræferencer"). Familiemedlemmer har eget diets-felt (se
  // useFamily.js), samme som allergens/custom. E-numre er fjernet helt fra
  // Madpas (opfølgende polish-runde, samme dag) sammen med link/QR-deling.
  const mpDiets = visibleDiets(madpasActiveProfile ? madpasActiveProfile.diets : user.diets);

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
      if (showProfileMenu) { setShowProfileMenu(false); return; }
      if (cameraActive) { closeCameraFully(); return; }
      // Bundmenu-skærmene og selve login/onboarding — gør ingenting
      // (forhindrer at tilbage forlader appen eller afbryder onboarding).
      const STAY = [SCREENS.HOME, SCREENS.LIST, SCREENS.HISTORY, ...AUTH_FLOW_SCREENS];
      if (STAY.includes(screen)) return;
      // Redigering åbnes fra Profil og går tilbage dertil; alt andet (menu-
      // skærme, resultat, indsendelse, Madpas m.fl.) går til forsiden.
      if (screen === SCREENS.EDITPROFILE || screen === SCREENS.EDITPREFERENCES) { setScreen(SCREENS.PROFILE); return; }
      setScreen(SCREENS.HOME);
    };
    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, [screen, helpOpen, feedbackOpen, profilePopup, cameraActive, showProfileMenu]);

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
      { id:"preview-fam-2", name:"Sofie Nielsen", color:AVATAR_COLORS[1], birth_year:2019, gender:"Kvinde", allergens:[], custom:["Kiwi"], diets:["vegetarian"], eNumbers:[] },
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
    authError, setAuthError, authInfo, emailTakenError, setEmailTakenError,
    emailError, setEmailError, passwordError, setPasswordError,
    authLoading, authTab, setAuthTab,
    isOAuth, rememberMe, setRememberMe,
    handleLogin, handleSignup, handleOAuth, handleForgotPassword, clearAuth,
    verifyEmail, verifyStatus, verifyError, verifyNotice, verifyLoading, resendCooldown,
    checkEmailVerified, resendVerification, changeVerifyEmail, continueAfterVerify,
    resetError, resetLoading, resetDone, setResetError, submitNewPassword, continueAfterReset,
  }), [user, userId, setUserId, accessToken, loginEmail, loginPassword, authError, authInfo, emailTakenError, emailError, passwordError, authLoading, authTab, isOAuth, rememberMe, handleLogin, handleSignup, handleOAuth, handleForgotPassword, clearAuth,
       verifyEmail, verifyStatus, verifyError, verifyNotice, verifyLoading, resendCooldown, checkEmailVerified, resendVerification, changeVerifyEmail, continueAfterVerify, resetError, resetLoading, resetDone, setResetError, submitNewPassword, continueAfterReset]);

  const profileContextValue = useMemo(() => ({
    allergens, setAllergens, customAllerg, setCustomAllerg,
    family, setFamily, activeProfiles, setActiveProfiles,
    scanFamily, household, setHousehold, householdLoading, loadHousehold,
  }), [allergens, customAllerg, family, activeProfiles, scanFamily, household, householdLoading, loadHousehold]);

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

  const navigationContextValue = useMemo(() => ({ screen, setScreen, openLegal, legalReturnScreen }), [screen, openLegal, legalReturnScreen]);

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
    newMemberLevels, setNewMemberLevels,
    newMemberENumbers, setNewMemberENumbers,
    newMemberSubtypes, setNewMemberSubtypes,
    newMemberCustomInput, setNewMemberCustomInput,
    editingMemberId,
    addMember, updateMember, removeMember, startEditMember, cancelEditMember,
  }), [
    newMemberName, newMemberBirthYear, newMemberGender, newMemberAllerg,
    newMemberCustomAllerg, newMemberDiets, newMemberLevels, newMemberENumbers, newMemberSubtypes,
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
        {(screen === SCREENS.LOGIN || screen === SCREENS.VERIFYEMAIL || screen === SCREENS.RESETPASSWORD) && <div className="app-bg-dim" aria-hidden="true" />}
        {/* Indkøbsliste-polish (25. sept. 2026, brugerfeedback): "fjern
            ingrediens-/fødevarebaggrunden fra Indkøbslisten — den skal kun
            bruges på den primære Scan-forside". Samme mønster som
            .app-bg-dim ovenfor (et selvstændigt lag OVEN PÅ det universelle
            .app-bg, i stedet for at ændre selve .app-bg eller gøre den
            betinget) — men helt opak (var(--paper)) i stedet for en let
            hvid dæmpning, så Indkøbslisten får appens rene hvid/off-white
            arbejdsflade uden ingrediensbilledet, mens resten af appen
            (herunder Scan-forsiden) beholder det uændret. Historik,
            Favoritter og Allergileksikon fik samme behandling (26. sept.
            2026, brugerfeedback: "match den rene, funktionelle stil fra
            Indkøbslisten") — genbruger samme .app-bg-hide-lag i stedet for
            en ny klasse. Familie-siden fik samme behandling (26. sept.
            2026, Familie-redesign: siden skal føles som en enkel
            husstands-oversigt, ikke en fødevarebaggrund-tung skærm), og
            Madpas fik den samme (26. sept. 2026, Madpas-redesign: skal
            fremstå som en administrationsside, ikke Scan-forsiden). Beskeder fik den
            samme (1. okt. 2026, samme rolige udtryk som Favoritter), også en åbnet
            besked og "Se din feedback" (Jans feedback: brødteksten lå direkte oven
            på baggrundsbilledet og var svær at læse). */}
        {(screen === SCREENS.LIST || screen === SCREENS.HISTORY || screen === SCREENS.FAVORITES || screen === SCREENS.KNOWLEDGE || screen === SCREENS.FAMILY || screen === SCREENS.MADPAS || screen === SCREENS.NOTIFICATIONS || screen === SCREENS.NOTIFICATION || screen === SCREENS.TICKET || isLegalPage) && <div className="app-bg-hide" aria-hidden="true" />}

        {/* Skip-link for tastatur/screen reader brugere */}
        <a href="#main-content" className="skip-link">Spring til indhold</a>

        {/* Installations-prompt — kun aktiv når man er landet via beta-QR'en */}
        <InstallPrompt />

        {/* Scan-loading — vist mens et scannet/søgt produkt slås op (fra
            runLookupProduct's setLoading(true) til resultatet er klart) */}
        <ScanLoadingOverlay show={loading} />

        {/* ══ BEKRÆFT E-MAIL ══ */}
        {screen === SCREENS.VERIFYEMAIL && (
          <Suspense fallback={LazyFallback}>
            <VerifyEmailScreen />
          </Suspense>
        )}

        {/* ══ VÆLG NY ADGANGSKODE ══ */}
        {screen === SCREENS.RESETPASSWORD && (
          <Suspense fallback={LazyFallback}>
            <ResetPasswordScreen />
          </Suspense>
        )}

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
            saveDietStep3={saveDietStep3}
            saveProfileStep1={saveProfileStep1} finishOnboard={finishOnboard}
            StepBar={StepBar}
            buildLabel={formatBuildTime()}
            hasPendingJoinList={!!pendingJoinList}
            onActivatePreview={activatePreviewMode}
          />
          </Suspense>
        )}
        {/* TOPBAR — fælles, genbrugelig header (AppHeader.jsx, 27. sept.
            2026), skjult under Madpas' tjener-visning (26. sept. 2026,
            Madpas-redesign, krav 11: "skjul ... hamburger-menu"/"Feedback"
            når 'Vis til tjener' er åbnet, ikke kun visuelt dækket af
            overlayet), og under Brugsvilkår/Privatlivspolitik (29. sept.
            2026) — de viser deres egen selvstændige header i stedet, se
            isLegalPage ovenfor. */}
        {!isOnboard && !madpasWaiterView && !isLegalPage && (
          <AppHeader
            unread={notifications.unread}
            onFeedback={() => { setFeedbackOpen(true); setFeedbackDone(false); }}
            onMenu={() => setShowProfileMenu(true)}
          />
        )}

        {/* Feedback-knap under onboarding — safe-area-korrekt top-afstand.
            `top:12` alene ville sidde for tæt på/under statuslinjen eller
            Dynamic Island på notch-enheder — nu `calc(12px +
            env(safe-area-inset-top))`.
            27. sept. 2026, "FINAL MICRO-POLISH": skygge/kant gjort en
            anelse mere diskret end appens standard var(--sh)-token — knappen
            skal stadig være nem at finde i beta, men ikke konkurrere
            visuelt med logo/slogan eller den primære CTA lige under. Lysere
            kant (var(--border) i stedet for var(--border2)) + en lettere,
            tættere skygge (lavere opacity/spredning end var(--sh)).
            Dæmpet endnu en anelse samme dag ("FINAL 10/10 MICRO-POLISH") —
            kant-alpha .10→.07, skygge-alpha .08→.05 — knappen skal føles
            tydeligt sekundær i forhold til hero/CTA, stadig fuldt synlig/
            klikbar. */}
        {isOnboard && (
          <div style={{ position:"fixed", top:"calc(12px + env(safe-area-inset-top))", right:12, zIndex:1000 }}>
            <button onClick={() => { setFeedbackOpen(true); setFeedbackDone(false); }}
              style={{ background:"var(--paper2)", border:"1px solid rgba(21,32,26,.07)", borderRadius:100, padding:"6px 12px", fontFamily:"var(--f)", fontSize:11, fontWeight:700, color:"var(--ink2)", cursor:"pointer", display:"flex", alignItems:"center", gap:6, boxShadow:"0 1px 3px -1px rgba(21,32,26,.05)" }}>
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

        {/* ══ SIKKERHEDSINFORMATION ══ */}
        {showSafetyInfo && <SafetyInfoModal onAcknowledge={acknowledgeSafety} busy={safetyBusy} />}

        {/* ══ TOAST (delt succes-/fejl-besked, erstatter native alert()) ══ */}
        <ToastHost top={screen === SCREENS.ONBOARD} />

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
            unreadNotifications={notifications.unread}
            onOpenSafetyInfo={() => { openSafetyInfo(); setShowProfileMenu(false); }}
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
            cameraPermissionDenied={cameraPermissionDenied}
            photoFallbackRef={photoFallbackRef}
            scanPhotoForEan={scanPhotoForEan}
            setKnowledgeSlug={setKnowledgeSlug}
            lookupProduct={lookupProduct}
            selectedENumbers={selectedENumbers}
            activeIds={activeIds}
            activeLevels={activeLevels}
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
            madpasWaiterView={madpasWaiterView} setMadpasWaiterView={setMadpasWaiterView}
            madpasCrossContact={madpasCrossContact} setMadpasCrossContact={setMadpasCrossContact}
            mpAllergens={mpAllergens} mpCustom={mpCustom}
            mpDiets={mpDiets}
            langOpen={langOpen} setLangOpen={setLangOpen}
            madpasSpeak={madpasSpeak}
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

        {/* ══ BRUGSVILKÅR / PRIVATLIVSPOLITIK ══ (29. sept. 2026) — almindelige
            undersider, ikke modaler; egen sticky header, se isLegalPage
            ovenfor. onBack fører tilbage til legalReturnScreen (den skærm
            der åbnede siden via openLegal), ikke et fast mål. */}
        {screen === SCREENS.TERMS && (
          <Suspense fallback={LazyFallback}>
          <ErrorBoundary screen="Brugsvilkår">
          <TermsScreen onBack={() => setScreen(legalReturnScreen)} />
          </ErrorBoundary>
          </Suspense>
        )}
        {screen === SCREENS.PRIVACY && (
          <Suspense fallback={LazyFallback}>
          <ErrorBoundary screen="Privatlivspolitik">
          <PrivacyScreen onBack={() => setScreen(legalReturnScreen)} />
          </ErrorBoundary>
          </Suspense>
        )}

        {/* ══ PROFILE SCREENS ══ */}
        {(screen === SCREENS.HISTORY || screen === SCREENS.PROFILE ||
          screen === SCREENS.FAVORITES || screen === SCREENS.EDITPROFILE ||
          screen === SCREENS.EDITPREFERENCES ||
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

        {/* ══ BESKEDER ══ (30. sept. 2026) — oversigt + den fulde besked, som push åbner */}
        {screen === SCREENS.NOTIFICATIONS && (
          <Suspense fallback={LazyFallback}>
          <ErrorBoundary screen="Beskeder">
          <NotificationsScreen
            items={notifications.items} loading={notifications.loading} listError={notifications.listError}
            loadList={notifications.loadList} onOpen={notifications.openNotification}
            onDelete={notifications.removeNotification}
          />
          </ErrorBoundary>
          </Suspense>
        )}
        {screen === SCREENS.NOTIFICATION && notifications.openId && (
          <Suspense fallback={LazyFallback}>
          <ErrorBoundary screen="Besked">
          <NotificationScreen
            key={notifications.openId}
            notificationId={notifications.openId} markRead={notifications.markRead}
            onDelete={notifications.removeNotification}
            onAction={handleNotificationAction}
            onBack={() => setScreen(SCREENS.NOTIFICATIONS)}
          />
          </ErrorBoundary>
          </Suspense>
        )}

        {screen === SCREENS.TICKET && openTicketId && (
          <Suspense fallback={LazyFallback}>
          <ErrorBoundary screen="Feedback">
          <TicketScreen key={openTicketId} ticketId={openTicketId} onBack={() => setScreen(SCREENS.NOTIFICATIONS)} />
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
            madpasLang={madpasLang} setMadpasLang={setMadpasLang}
            vibrateOnWarning={vibrateOnWarning} setVibrateOnWarning={setVibrateOnWarning}
            soundOnWarning={soundOnWarning} setSoundOnWarning={setSoundOnWarning}
            onOpenFeedback={() => { setFeedbackOpen(true); setFeedbackDone(false); }}
            onOpenSafetyInfo={openSafetyInfo}
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
            activeLevels={activeLevels}
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

        {/* BUNDNAVIGATION — skjult på Brugsvilkår/Privatlivspolitik (29.
            sept. 2026), samme begrundelse som TOPBAR ovenfor: siderne kan
            åbnes fra kontekster uden bundnav (Velkommen/Log ind), så den
            skal være konsekvent fraværende uanset hvor siden blev åbnet
            fra, i stedet for at dukke op/forsvinde afhængigt af indgang. */}
        {!isOnboard && !madpasWaiterView && !isLegalPage && !hideNavForContribution && (
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