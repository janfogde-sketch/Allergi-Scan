// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from "react";

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
import AdminScreen from './AdminScreen.jsx';
import OnboardingScreen from './OnboardingScreen.jsx';
import MadpasScreen from './MadpasScreen.jsx';
import ProfileScreen from './ProfileScreen.jsx';
import ScannerScreen from './ScannerScreen.jsx';
import RecipesScreen from './RecipesScreen.jsx';

import { appCss } from './theme.jsx';
import { BUILD_TIME, COMMIT_SHA, formatBuildTime, getGreeting, buildScreenLabel } from './utils.jsx';
import { useShoppingList } from './useShoppingList.js';
import { useFamily } from './useFamily.js';
import { useHistory } from './useHistory.js';
import { useAuth } from './useAuth.js';
import { useOnboarding } from './useOnboarding.js';
import { useProduct } from './useProduct.js';
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
  const [cameraActive, setCameraActive] = useState(false);
  const productCacheRef = useRef({}); // Cache af seneste 50 scannede produkter
  const lastScannedRef = useRef(null); // Forhindrer dobbelt-scan
  const [torchOn, setTorchOn] = useState(false);
  const [profilePopup, setProfilePopup] = useState(null); // id af profil der vises popup for
  const galleryInputRef = useRef(null);
  const torchTrackRef = useRef(null);
  const qrRef = useRef(null);
  const html5QrRef = useRef(null);

  // History → useHistory hook

  // Admin
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [adminSection, setAdminSection] = useState("dashboard");
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminTicketFilter, setAdminTicketFilter] = useState("all");
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [openAdminUser, setOpenAdminUser] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [userSearchParam, setUserSearchParam] = useState("all"); // all | name | email | role | onboarding
  const [openSubmission, setOpenSubmission] = useState(null);
  const [submissionFilter, setSubmissionFilter] = useState("pending");
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [cleaningOcr, setCleaningOcr] = useState(false);
  const [cleanedOcrText, setCleanedOcrText] = useState(null);

  // Shopping list
  // → useShoppingList hook

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("alle");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
    // Favorites → useHistory hook
  const [madpasLang, setMadpasLang] = useState(() => localStorage.getItem("as_madpas_lang") || "en");
  const [madpasProfileId, setMadpasProfileId] = useState("self");
  // madpasActiveProfile → computed after hooks (uses family)
  const [recipes, setRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [recipeFilter, setRecipeFilter] = useState("alle");
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [showSubmitRecipe, setShowSubmitRecipe] = useState(false);
  const [submitRecipe, setSubmitRecipe] = useState({ title:"", description:"", category:"aftensmad", tags:[] });
  const [submitSteps, setSubmitSteps] = useState([""]);
  const [submitIngredients, setSubmitIngredients] = useState([{ name:"", amount:"", unit:"" }]);
  const [submittingRecipe, setSubmittingRecipe] = useState(false);
  const [recipeTermsOpen, setRecipeTermsOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState({});
  const [showManualEan, setShowManualEan] = useState(false);
  const [selectedENumbers, setSelectedENumbers] = useState([]);
  const [allergenSubtypes, setAllergenSubtypes] = useState({}); // { "laktose": "laktose_protein", ... }
  const [activeSubtypeModal, setActiveSubtypeModal] = useState(null); // allergen id der vises modal for
  const [eSearch, setESearch] = useState("");
  const [eCategory, setECategory] = useState("alle");
  const [recipeTermsAccepted, setRecipeTermsAccepted] = useState(false);
  const [madpasSpeaking, setMadpasSpeaking] = useState(false);
  const [madpasBig, setMadpasBig] = useState(false);
  const [madpasWaiterView, setMadpasWaiterView] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [showSafeOnly, setShowSafeOnly] = useState(false);
  const [recipeServings, setRecipeServings] = useState(4);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeSafeOnly, setRecipeSafeOnly] = useState(false);

  // Family form → useFamily hook

  // Auth form

  // NOT FOUND flow
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [betaIntroSeen, setBetaIntroSeen] = useState(true); // Beta-info er nu i onboarding, overlay kun via knap
  const [betaIntroStep, setBetaIntroStep] = useState(0);

  const [adminTickets, setAdminTickets] = useState([]);
  const [openTicket, setOpenTicket] = useState(null);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ocrImagePreview, setOcrImagePreview] = useState(null);

  // ── TOKEN HELPERS ──────────────────────────────────────────────────────────




  // ── ADMIN ─────────────────────────────────────────────────────────────────
  const loadSubmissions = async (filter) => {
    const f = filter || submissionFilter;
    if (f === "tickets") return;
    setSubmissionsLoading(true);
    try {
      const headers = { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" };
      const url = `${SUPABASE_URL}/rest/v1/product_submissions?status=eq.${f}&order=created_at.desc&limit=100`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch { setSubmissions([]); }
    setSubmissionsLoading(false);
  };

  const deleteOwnAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== "slet") return;
    setDeletingAccount(true);
    try {
      const h = { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}` };
      await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/shopping_lists?owner_id=eq.${userId}`, { method:"DELETE", headers:h }),
        fetch(`${SUPABASE_URL}/rest/v1/user_allergens?user_id=eq.${userId}`, { method:"DELETE", headers:h }),
        fetch(`${SUPABASE_URL}/rest/v1/family_members?user_id=eq.${userId}`, { method:"DELETE", headers:h }),
        fetch(`${SUPABASE_URL}/rest/v1/scan_history?user_id=eq.${userId}`, { method:"DELETE", headers:h }),
        fetch(`${SUPABASE_URL}/rest/v1/feedback_tickets?submitted_by=eq.${userId}`, { method:"DELETE", headers:h }),
      ]);
      await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, { method:"DELETE", headers:h });
      clearAuth();
      setShowDeleteAccount(false);
    } catch (e) { alert("Fejl: " + e.message + "\nKontakt support@eatsafe.dk"); }
    setDeletingAccount(false);
  };

  const loadAdminStats = async () => {
    try {
      const h = { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Accept": "application/json", "Prefer": "count=exact" };
      const hNoCount = { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" };
      const today = new Date(); today.setHours(0,0,0,0);
      const todayISO = today.toISOString();
      const [users, products, scans, submissions, families, tickets, scansToday, newUsersToday] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/users?select=id`, { headers: h }).then(async r => { const ct = r.headers.get("content-range"); return ct ? parseInt(ct.split("/")[1]) : (await r.json()).length; }),
        fetch(`${SUPABASE_URL}/rest/v1/products?select=id`, { headers: h }).then(async r => { const ct = r.headers.get("content-range"); return ct ? parseInt(ct.split("/")[1]) : (await r.json()).length; }),
        fetch(`${SUPABASE_URL}/rest/v1/scan_history?select=id`, { headers: h }).then(async r => { const ct = r.headers.get("content-range"); return ct ? parseInt(ct.split("/")[1]) : (await r.json()).length; }),
        fetch(`${SUPABASE_URL}/rest/v1/product_submissions?status=eq.pending&select=id`, { headers: hNoCount }).then(r => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/family_members?select=id`, { headers: hNoCount }).then(r => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/feedback_tickets?status=eq.open&select=id`, { headers: hNoCount }).then(r => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/scan_history?select=id&scanned_at=gte.${todayISO}`, { headers: hNoCount }).then(r => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/users?select=id&created_at=gte.${todayISO}`, { headers: hNoCount }).then(r => r.json()),
      ]);
      setAdminStats({
        total_users: typeof users === "number" ? users : (Array.isArray(users) ? users.length : 0),
        total_products: typeof products === "number" ? products : (Array.isArray(products) ? products.length : 0),
        total_scans: typeof scans === "number" ? scans : (Array.isArray(scans) ? scans.length : 0),
        pending_submissions: Array.isArray(submissions) ? submissions.length : 0,
        total_families: Array.isArray(families) ? families.length : 0,
        open_tickets: Array.isArray(tickets) ? tickets.length : 0,
        scans_today: Array.isArray(scansToday) ? scansToday.length : 0,
        new_users_today: Array.isArray(newUsersToday) ? newUsersToday.length : 0,
      });
    } catch (e) { console.error("loadAdminStats fejl:", e.message); }
  };

  const loadTickets = async () => {
    setTicketsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/feedback_tickets?order=created_at.desc&limit=100`, {
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" },
      });
      const data = await res.json();
      setAdminTickets(Array.isArray(data) ? data : []);
    } catch { setAdminTickets([]); }
    setTicketsLoading(false);
  };

  // ── KAMERA + SCANNING ──────────────────────────────────────────────────────
  const startCamera = async () => {
    if (cameraActive) return;
    setScanError(""); setTorchOn(false);
    torchTrackRef.current = null; lastScannedRef.current = null;
    if (!navigator.mediaDevices?.getUserMedia) { setScanError("Kamera ikke understøttet. Prøv Chrome eller Safari."); return; }
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const constraints = isIOS
      ? { video: { facingMode: { exact: "environment" } } }
      : { video: { facingMode: "environment", width: { min: 1280, ideal: 1920 }, height: { min: 720, ideal: 1080 },
          advanced: [{ focusMode: "continuous" }, { exposureMode: "continuous" }] } };
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const track = stream.getVideoTracks()[0];
      if (track) torchTrackRef.current = track;
      stream.getTracks().forEach(t => t.stop());
    } catch (e) {
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setScanError("Kamera-adgang nægtet. Gå til telefonens indstillinger og tillad kamera for denne app.");
      } else if (e.name === "NotFoundError") {
        setScanError("Intet kamera fundet på denne enhed.");
      } else if (e.name === "OverconstrainedError" && isIOS) {
        try { const s2 = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); s2.getTracks().forEach(t => t.stop()); }
        catch { setScanError("Kunne ikke starte kamera. Prøv at genindlæse siden."); return; }
      } else { setScanError("Kamera fejl: " + e.message); return; }
    }
    setCameraActive(true);
    await new Promise(r => setTimeout(r, isIOS ? 300 : 150));
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const readerId = "qr-reader-home";
      if (html5QrRef.current) { try { await html5QrRef.current.stop(); } catch {} html5QrRef.current = null; }
      const readerEl = document.getElementById(readerId);
      if (!readerEl) { setScanError("Kamera-element ikke fundet. Genindlæs siden."); setCameraActive(false); return; }
      html5QrRef.current = new Html5Qrcode(readerId, { verbose: false });
      // Kun stregkode-formater (ikke QR, Aztec osv.) — markant hurtigere decode
      // 0=QR_CODE, 1=AZTEC, 2=CODABAR, 3=CODE_39, 4=CODE_93, 5=CODE_128,
      // 6=DATA_MATRIX, 7=MAXICODE, 8=ITF, 9=EAN_13, 10=EAN_8, 11=PDF_417, 12=RSS_14, 13=RSS_EXPANDED, 14=UPC_A, 15=UPC_E, 16=UPC_EAN_EXTENSION
      const barcodeFormats = [3, 5, 8, 9, 10, 14, 15]; // CODE_39, CODE_128, ITF, EAN_13, EAN_8, UPC_A, UPC_E
      // Stort scan-område: dækker næsten hele kameraet — markant højere succesrate
      // Performance er ikke et problem længere takket være BarcodeDetector API
      const qrConfig = {
        fps: isIOS ? 25 : 24,
        qrbox: (w, h) => ({
          width:  Math.round(w * 0.92),
          height: Math.round(h * 0.55),
        }),
        // Lad kameraet bruge sit native aspect ratio i stedet for at tvinge 16:9
        // Det giver ofte højere reel opløsning på Android
        aspectRatio: undefined,
        disableFlip: false, // Tillad flip — fanger flere koder, ringe ydelses-cost
        formatsToSupport: barcodeFormats,
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        videoConstraints: isIOS
          ? {
              facingMode: { exact: "environment" },
              width:  { ideal: 1920 },
              height: { ideal: 1080 },
            }
          : {
              facingMode: { ideal: "environment" },
              // Højere opløsning = bedre decode af små/utydelige koder
              width:  { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 },
            },
      };
      await html5QrRef.current.start(
        { facingMode: isIOS ? { exact: "environment" } : "environment" }, qrConfig,
        (code) => {
          const now = Date.now();
          if (lastScannedRef.current?.code === code && now - lastScannedRef.current.time < 1500) return;
          lastScannedRef.current = { code, time: now };
          if (navigator.vibrate) navigator.vibrate([40, 20, 40]);
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = 1800; gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.12);
          } catch {}
          stopCamera(); lookupProduct(code);
        }, () => {}
      );
      await new Promise(r => setTimeout(r, 500));
      const videoEl = document.querySelector("#qr-reader-home video");
      if (videoEl?.srcObject) {
        const track = videoEl.srcObject.getVideoTracks()[0];
        if (track) {
          torchTrackRef.current = track;
          try {
            const caps = track.getCapabilities?.() || {};
            const adv = [];
            // Continuous autofokus — KRITISK for stregkode-scanning
            if (caps.focusMode?.includes("continuous")) adv.push({ focusMode: "continuous" });
            if (caps.exposureMode?.includes("continuous")) adv.push({ exposureMode: "continuous" });
            if (caps.whiteBalanceMode?.includes("continuous")) adv.push({ whiteBalanceMode: "continuous" });
            // Macro focus distance hvis tilgængelig — hjælper close-up scanning
            if (caps.focusDistance) {
              adv.push({ focusDistance: caps.focusDistance.min });
            }
            // Hardware zoom 1.5x — gør stregkoden større = bedre decode
            // Kun hvis brugeren ikke selv har zoomet
            if (caps.zoom && caps.zoom.max >= 1.5) {
              // Lille zoom hjælper ofte med små stregkoder, men ikke for meget
              // (vi gør det optionelt — brugeren kan tappe for at fokusere i stedet)
            }
            if (adv.length) await track.applyConstraints({ advanced: adv });
          } catch (e) { console.warn("Camera constraints fejlede:", e); }
          // Tap-to-focus: når brugeren tapper video-feltet
          videoEl.onclick = async (ev) => {
            try {
              const caps = track.getCapabilities?.() || {};
              if (caps.focusMode?.includes("manual") && caps.pointsOfInterest !== undefined) {
                const rect = videoEl.getBoundingClientRect();
                const x = (ev.clientX - rect.left) / rect.width;
                const y = (ev.clientY - rect.top) / rect.height;
                await track.applyConstraints({ advanced: [{ pointsOfInterest: [{ x, y }], focusMode: "single-shot" }] });
                // Skift tilbage til continuous efter 1.5s
                setTimeout(() => track.applyConstraints({ advanced: [{ focusMode: "continuous" }] }).catch(() => {}), 1500);
              }
            } catch {}
          };
        }
      }
    } catch (e) {
      setCameraActive(false);
      if (e.message?.includes("constraint") || e.message?.includes("Constraint")) setTimeout(() => startCamera(), 500);
      else setScanError("Kamera kunne ikke starte. Prøv at lukke andre apps og prøv igen.");
    }
  };

  const scanFromGallery = async (file) => {
    if (!file) return;
    setScanError(""); setLoading(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader-gallery");
      const result = await scanner.scanFile(file, true);
      scanner.clear(); lookupProduct(result);
    } catch { setLoading(false); setScanError("Ingen stregkode fundet i billedet. Prøv et klarere billede."); }
  };

  const toggleTorch = async () => {
    try {
      const videoEl = document.querySelector("#qr-reader-home video");
      const track = videoEl?.srcObject?.getVideoTracks?.()?.[0] || torchTrackRef.current;
      if (!track) return;
      const capabilities = track.getCapabilities?.();
      if (!capabilities?.torch) { setScanError("Lygte ikke understøttet på denne enhed."); return; }
      const newState = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: newState }] });
      setTorchOn(newState);
    } catch (e) { setScanError("Kunne ikke tænde lygte: " + e.message); }
  };

  const stopCamera = () => {
    if (html5QrRef.current) { html5QrRef.current.stop().catch(() => {}); html5QrRef.current = null; }
    if (torchTrackRef.current) { try { torchTrackRef.current.applyConstraints({ advanced: [{ torch: false }] }); } catch {} torchTrackRef.current = null; }
    setCameraActive(false); setTorchOn(false);
  };

  // ── OCR + INDSEND PRODUKT ─────────────────────────────────────────────────










  // ── ADMIN FUNKTIONER ─────────────────────────────────────────────────────
  const loadAdminUsers = async () => {
    try {
      const data = await apiCall(
        `${SUPABASE_URL}/rest/v1/users?select=id,name,email,role,created_at,onboarding_completed&order=created_at.desc&limit=200`,
        { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
      );
      if (Array.isArray(data)) setAdminUsers(data);
    } catch (e) { console.error("loadAdminUsers:", e); }
  };

  const updateUserRole = async (uid, role) => {
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${uid}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
        body: JSON.stringify({ role }),
      });
      setAdminUsers(u => u.map(x => x.id === uid ? { ...x, role } : x));
    } catch (e) { console.error("updateUserRole:", e); }
  };

  const deleteUser = async (uid) => {
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${uid}`, {
        method: "DELETE", headers: makeHeaders(accessToken),
      });
      setAdminUsers(u => u.filter(x => x.id !== uid));
    } catch (e) { console.error("deleteUser:", e); }
  };

  const updateSubmissionAndApprove = async (submission, edited) => {
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/product_submissions?id=eq.${submission.id}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
        body: JSON.stringify({ status: "approved", ai_parsed_data: edited }),
      });
      loadSubmissions(submissionFilter);
      setOpenSubmission(null); setEditingSubmission(null);
    } catch (e) { console.error("updateSubmissionAndApprove:", e); }
  };

  const rejectSubmission = async (id) => {
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/product_submissions?id=eq.${id}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
        body: JSON.stringify({ status: "rejected" }),
      });
      loadSubmissions(submissionFilter);
    } catch (e) { console.error("rejectSubmission:", e); }
  };

  const updateTicketStatus = async (id, status) => {
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/feedback_tickets?id=eq.${id}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
        body: JSON.stringify({ status }),
      });
      loadTickets();
      setOpenTicket(null);
    } catch (e) { console.error("updateTicketStatus:", e); }
  };

  const cleanOcrWithAI = async (text) => {
    if (!text) return;
    setCleaningOcr(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: `Rens denne OCR-tekst fra en produktetikette til en kommasepareret ingrediensliste på originalsproget. Fjern labels, næringsindhold og unødvendig tekst. Returner KUN ingredienslisten:

${text}` }],
        }),
      });
      const data = await res.json();
      const cleaned = data.content?.[0]?.text || text;
      setCleanedOcrText(cleaned);
      setEditingSubmission(s => ({ ...s, ocr_raw_text: cleaned }));
    } catch (e) { console.error("cleanOcrWithAI:", e); }
    setCleaningOcr(false);
  };

  const loadRecipes = async (filter = "alle") => {
    setRecipesLoading(true);
    try {
      let url = `${SUPABASE_URL}/rest/v1/recipes?select=id,title,category,image_url,tags,allergen_flags,servings,prep_time_minutes,cook_time_minutes,description&limit=50`;
      // Prøv med status filter først
      url += `&status=eq.approved`;
      if (filter !== "alle") {
        url += `&category=eq.${filter}`;
      }
      const headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Accept": "application/json",
        ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
      };
      const res = await fetch(url, { headers });
      const text = await res.text();
      if (!res.ok) {
        console.error("loadRecipes fejl:", res.status, text.slice(0, 200));
        // Fallback: prøv uden status filter
        const url2 = `${SUPABASE_URL}/rest/v1/recipes?select=id,title,category,image_url,tags,allergen_flags,servings,description&limit=50${filter !== "alle" ? `&category=eq.${filter}` : ""}`;
        const res2 = await fetch(url2, { headers });
        const data2 = await res2.json();
        setRecipes(Array.isArray(data2) ? data2 : []);
        return;
      }
      const data = JSON.parse(text);
      setRecipes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("loadRecipes fejl:", e.message);
      setRecipes([]);
    }
    setRecipesLoading(false);
  };

  const loadRecipeIngredients = async (recipeId) => {
    try {
      const headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Accept": "application/json",
        ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
      };
      // Hent fuld opskrift inkl. ingredients_raw og instructions
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/recipes?id=eq.${recipeId}&select=id,ingredients_raw,instructions`,
        { headers }
      );
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        setSelectedRecipe(prev => prev ? { ...prev, ...data[0] } : prev);
      }
    } catch {}
    setRecipeIngredients([]);
  };

  const submitUserRecipe = async () => {
    if (!submitRecipe.title.trim() || submitIngredients.filter(i => i.name.trim()).length === 0) return;
    setSubmittingRecipe(true);
    try {
      const [recipe] = await apiCall(`${SUPABASE_URL}/rest/v1/recipes`, {
        method: "POST",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=representation" },
        body: JSON.stringify({
          ...submitRecipe,
          instructions: JSON.stringify(submitSteps.filter(s => s.trim())),
          submitted_by: userId,
          source: "user",
          language: "da",
          status: "pending",
          disclaimer: "Allergener er vejledende. Tjek altid ingrediensernes emballage ved alvorlige allergier.",
        }),
      });
      for (let i = 0; i < submitIngredients.length; i++) {
        const ing = submitIngredients[i];
        if (!ing.name.trim()) continue;
        await apiCall(`${SUPABASE_URL}/rest/v1/recipe_ingredients`, {
          method: "POST",
          headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
          body: JSON.stringify({ recipe_id: recipe.id, name: ing.name, amount: ing.amount, unit: ing.unit, sort_order: i }),
        });
      }
      setShowSubmitRecipe(false);
      setSubmitRecipe({ title:"", description:"", category:"aftensmad", tags:[] });
      setSubmitSteps([""]);
      setSubmitIngredients([{ name:"", amount:"", unit:"" }]);
      alert("Tak! Din opskrift er sendt til godkendelse.");
    } catch (e) { alert("Fejl: " + e.message); }
    setSubmittingRecipe(false);
  };

  // loadShoppingList → useShoppingList
  // addToList → useShoppingList
  // toggleItem → useShoppingList
  // removeItem → useShoppingList
  // ── FAMILIE ────────────────────────────────────────────────────────────────
  // addMember → useFamily
  // removeMember → useFamily


    // ── HJÆLPEKOMPONENTER ──────────────────────────────────────────────────────

  // ── MADPAS SPEAK ────────────────────────────────────────────────────────────
  const madpasSpeak = () => {
    if (!window.speechSynthesis) return;
    if (madpasSpeaking) { window.speechSynthesis.cancel(); setMadpasSpeaking(false); return; }
    const lang = madpasLang;
    const bcp = MADPAS_LANGUAGES.find(l => l.code === lang)?.bcp || "en-US";

    // Byg præcis den tekst der vises på skærmen
    const introText = {
      da:"Hej! Jeg har nogle fødevareallergier og ønsker gerne din hjælp til at finde noget, jeg kan spise trygt.",
      en:"Hi! I have some food allergies and would love your help finding something safe for me to eat.",
      de:"Hallo! Ich habe einige Lebensmittelallergien und würde mich über Ihre Hilfe freuen.",
      fr:"Bonjour ! J'ai des allergies alimentaires et j'aurais besoin de votre aide.",
      es:"¡Hola! Tengo algunas alergias alimentarias y agradecería su ayuda.",
      it:"Ciao! Ho alcune allergie alimentari e apprezzerei il suo aiuto.",
      nl:"Hallo! Ik heb wat voedselallergieën en zou graag uw hulp willen.",
      pt:"Olá! Tenho algumas alergias alimentares e gostaria da sua ajuda.",
      pl:"Cześć! Mam kilka alergii pokarmowych i chciałbym prosić o pomoc.",
      sv:"Hej! Jag har några matallergier och skulle uppskatta din hjälp.",
      no:"Hei! Jeg har noen matallergier og ønsker gjerne din hjelp.",
      ja:"こんにちは！食物アレルギーがあります。安全な食事を見つけるお手伝いをお願いできますか。",
      zh:"您好！我有食物过敏，希望您能帮助我找到安全的食物。",
      ar:"مرحباً! لدي بعض الحساسية الغذائية وأود مساعدتك في إيجاد شيء آمن لي.",
      tr:"Merhaba! Gıda alerjilerim var ve güvenli bir şey bulmam için yardımınıza ihtiyacım var.",
      el:"Γεια σας! Έχω κάποιες αλλεργίες τροφίμων και θα εκτιμούσα τη βοήθειά σας.",
    };
    const cannotText = {
      da:"Jeg kan ikke spise", en:"I cannot eat", de:"Ich kann nicht essen",
      fr:"Je ne peux pas manger", es:"No puedo comer", it:"Non posso mangiare",
      nl:"Ik kan niet eten", pt:"Não posso comer", pl:"Nie mogę jeść",
      sv:"Jag kan inte äta", no:"Jeg kan ikke spise", ja:"食べられません",
      zh:"我不能吃", ar:"لا أستطيع تناول", tr:"Yiyemiyorum", el:"Δεν μπορώ να φάω",
    };
    const outroText = {
      da:"Tak for din hjælp — det betyder rigtig meget for mig.",
      en:"Thank you so much for your help — it means a lot to me.",
      de:"Vielen Dank für Ihre Hilfe — das bedeutet mir sehr viel.",
      fr:"Merci beaucoup pour votre aide — cela compte beaucoup pour moi.",
      es:"Muchas gracias por su ayuda — significa mucho para mí.",
      it:"Grazie mille per il suo aiuto — significa molto per me.",
      nl:"Heel erg bedankt voor uw hulp — dat betekent veel voor mij.",
      pt:"Muito obrigado pela sua ajuda — significa muito para mim.",
      pl:"Bardzo dziękuję za pomoc — wiele dla mnie znaczy.",
      sv:"Tack så mycket för din hjälp — det betyder mycket för mig.",
      no:"Tusen takk for hjelpen — det betyr mye for meg.",
      ja:"ご協力ありがとうございます。本当に助かります。",
      zh:"非常感谢您的帮助，对我来说意义重大。",
      ar:"شكراً جزيلاً على مساعدتك — هذا يعني لي الكثير.",
      tr:"Yardımınız için çok teşekkür ederim — bu benim için çok şey ifade ediyor.",
      el:"Σας ευχαριστώ πολύ για τη βοήθειά σας — σημαίνει πολλά για μένα.",
    };

    const parts = [];
    parts.push(introText[lang] || introText.en);

    // Allergener — samme rækkefølge og tekst som på skærmen
    const allItems = [...allergens, ...customAllerg.filter(c => !allergens.includes(c))];
    allItems.forEach((item, i) => {
      if (typeof item !== "string") return;
      const a = ALLERGENS.find(x => x.id === item);
      const label = a ? (ALLERGEN_T[item]?.[lang]?.n || ALLERGEN_T[item]?.en?.n || a.label) : item;
      const ex = a ? ALLERGEN_EXAMPLES[item] : null;
      const exProducts = ex?.products?.[lang] || ex?.products?.en || [];
      const exIngredients = ex?.ingredients?.[lang] || ex?.ingredients?.en || [];
      const exText = [...exProducts.slice(0,3), ...exIngredients.slice(0,4)].join(", ");
      const prefix = i === 0 ? (cannotText[lang] || cannotText.en) + ": " : "";
      parts.push(prefix + label + (exText ? ". " + exText : ""));
    });

    // Diæt
    if (user.diets && user.diets.length > 0) {
      const dietNames = user.diets.map(d => DIETS.find(x=>x.id===d)?.label).filter(Boolean).join(", ");
      parts.push(dietNames);
    }

    // E-numre
    if (selectedENumbers && selectedENumbers.length > 0) {
      parts.push(selectedENumbers.join(", "));
    }

    parts.push(outroText[lang] || outroText.en);

    const utter = new SpeechSynthesisUtterance(parts.join(". "));
    utter.lang = bcp;
    utter.rate = 0.85;
    utter.onstart = () => setMadpasSpeaking(true);
    utter.onend = () => setMadpasSpeaking(false);
    utter.onerror = () => setMadpasSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

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

  const lookupProduct = useCallback(async (ean) => {
    if (!ean?.trim()) return;
    if (navigator.vibrate) navigator.vibrate(40);
    const tid = traceId("scan");
    traceLog(tid, "scan:start", { ean: ean.trim() });
    const cached = productCacheRef.current[ean.trim()];
    if (cached) { traceLog(tid, "scan:cache-hit"); setScanResult(cached); setScreen(SCREENS.RESULT); return; }
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
      const cacheKeys = Object.keys(productCacheRef.current);
      if (cacheKeys.length > 50) delete productCacheRef.current[cacheKeys[0]];
      traceLog(tid, "scan:result", { ean: ean.trim(), name: result.name, status, matchedDanger, matchedWarning });
      setScanResult(result);
      setHistory(h => [result, ...h].slice(0, 50));
      await saveHistoryEntry(ean.trim(), product.id, status, flags, activeProfiles);
      setScreen(SCREENS.RESULT);
    } catch (e) { traceLog(tid, "scan:error", { error: e.message }); setScanError("Der opstod en fejl. Tjek din forbindelse og prøv igen."); }
    setLoading(false);
  }, [accessToken, activeIds]);

// ── SØGNING via Edge Function ───────────────────────────────────────────────

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchResults([]);
      const q = searchQuery.trim();
      const tid = traceId("search");
      traceLog(tid, "search:start", { q });

      const stid = traceId("search");
      traceLog(stid, "search:start", { query: q });
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/search?q=${encodeURIComponent(q)}`,
          { headers: { "apikey": SUPABASE_ANON_KEY, ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}) } }
        );
        const data = await res.json();
        traceLog(stid, "search:response", { found: data.products?.length || 0 });
        if (data.success) {
          const results = (data.products || []).map(p => ({ ...p, source:"local", verified:p.verified_status, conflicts:[] }));
          traceLog(tid, "search:results", { q, count: results.length });
          setSearchResults(results);
        }
      } catch (e) {
        traceLog(stid, "search:error", { error: e?.message || String(e) });
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, accessToken]);

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
              style={{ background:"rgba(255,255,255,.85)", backdropFilter:"blur(8px)", border:"1px solid var(--border2)", borderRadius:100, padding:"5px 12px", fontFamily:"var(--f)", fontSize:11, fontWeight:700, color:"var(--muted2)", cursor:"pointer", display:"flex", alignItems:"center", gap:5, boxShadow:"0 2px 8px rgba(0,0,0,.08)" }}>
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
                  style={{ width:"100%", padding:"13px 14px", border:`1.5px solid ${deleteConfirmText.toLowerCase()==="slet" ? "var(--red)" : "var(--border2)"}`, borderRadius:12, fontFamily:"var(--f)", fontSize:16, outline:"none", boxSizing:"border-box", background:"#fff", color:"var(--ink)" }}
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

        {/* ══ HJEM ══ */}        {/* ══ HJEM ══ */}
        {/* ══ SCANNER SCREENS ══ */}
        {(screen === SCREENS.HOME || screen === SCREENS.RESULT || screen === SCREENS.NOTFOUND || screen === SCREENS.SUBMITTED || screen === SCREENS.SEARCH || screen === SCREENS.LIST || screen === SCREENS.SUGGEST_EDIT) && (
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
            buildLabel={formatBuildTime()}
            lookupProduct={lookupProduct}
            selectedENumbers={selectedENumbers}
            activeENumbers={activeENumbers}
            onBetaClick={() => { setBetaIntroSeen(false); setBetaIntroStep(0); }}
          />
        )}

        {/* ══ MADPAS SCREEN ══ */}
        {(screen === SCREENS.MADPAS || madpasWaiterView) && (
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
        )}

        {/* ══ PROFILE SCREENS ══ */}
        {(screen === SCREENS.HISTORY || screen === SCREENS.PROFILE ||
          screen === SCREENS.FAVORITES || screen === SCREENS.EDITPROFILE ||
          screen === SCREENS.FAMILY) && (
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
        )}

        {/* ══ RECIPES SCREEN ══ */}
        {screen === SCREENS.RECIPES && (
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
            loadRecipes={loadRecipes} loadRecipeIngredients={loadRecipeIngredients}
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
        )}



        {/* ADMIN PANEL */}
        {screen === SCREENS.ADMIN && user?.role === "admin" && (
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
          />
        )}

        {/* BUNDNAVIGATION */}
        {!isOnboard && !madpasWaiterView && (
          <nav className="bottom-nav" role="navigation" aria-label="Hovednavigation">
            {[
              [SCREENS.RECIPES, "recipes",  "Opskrifter"],
              [SCREENS.LIST,    "cart",     "Indkøbsliste"],
              [SCREENS.HOME,    "home",     "Hjem"],
              [SCREENS.MADPAS,  "globe",    "Madpas"],
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
                (screen===SCREENS.ADMIN && s===SCREENS.PROFILE)
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