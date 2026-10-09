// @ts-check
// ─────────────────────────────────────────────────────────────────────────────
// useProduct.js
// Produkt-relateret state: OCR, indsend nyt produkt, suggest-edit flow.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from "react";
import { SUPABASE_URL, ALLERGENS, PRODUCT_ALLERGENS, SCREENS } from "./constants.jsx";
import { makeHeaders, apiCall, compareAllergens, compareENumbers, extractENumbers, traceId, traceLog, compressImageToBase64, matchCustomAllergens, normalizeProductFlags, STATUS_TEXT } from "./helpers.js";
import { saveToOfflineCache, getFromOfflineCache } from "./useOffline.js";

// Lægger et fritekst-match af brugerens EGNE, selv-tilføjede allergier
// (`activeCustom` — fx "Fructose") oven på et allerede-bygget scan-resultat.
// Holdes UDENFOR selve `result`-objektet der caches (productCacheRef/
// saveToOfflineCache) — custom-allergier kan ændre sig mellem to opslag af
// samme (cachede) produkt, så matchet skal genberegnes hver gang ud fra det
// cachede produkts rå ingrediensliste, ikke bages ind i den cachede kopi.
// Ikke lige så pålideligt som de faste allergener (ingen synonymer/negations-
// kontekst udover selve ordgrænse-/negations-tjekket i matchCustomAllergens)
// — derfor altid en tydelig disclaimer i teksten der vises.
// Bygger et scan-resultat-objekt (status, allergen-match, E-numre,
// familie-impact) ud fra rå produkt-data og brugerens aktive profiler.
// Udtrukket til en selvstændig, ren funktion så både det rigtige
// netværks-opslag (runLookupProduct) og demo-scanningen (buildDemoScanResult)
// deler PRÆCIS samme beregningslogik — to uafhængige implementationer af
// samme sikkerhedsrelevante beregning har allerede givet mindst én bug før
// (se aktiveIds-kommentaren i App.jsx).
export function buildScanResultFromProductData({ product, data, ean, activeIds, activeLevels, activeENumbers, family, activeProfiles }) {
  const ingredientsText = product.ingredients || data?.ingredients?.raw_text || product.ingredients_text || "";
  const flags = normalizeProductFlags(product.allergen_flags || data?.allergen_flags || {}, {
    ingredientsText, productName: product.name || "", verifiedStatus: product.verified_status, source: product.source,
    sourceMethod: product.allergen_source_method, quality: product.allergen_quality,
  });
  const base = {
    id: product.id || null,
    code: ean.trim(), name: product.name || "Ukendt produkt", brand: product.brand || "",
    variant_label: product.variant_label || null,
    image_url: product.image_url || null, category: product.category || null,
    subcategory: product.subcategory || null, category_original: product.category_original || null,
    ingredients: ingredientsText,
    nutrition: product.nutrition || data?.nutrition || null,
    verified_status: product.verified_status || "unverified", source: product.source || data?.source,
  };
  return scoreScanResult({ base, flags, activeIds, activeLevels, activeENumbers, family, activeProfiles });
}

// Genberegner vurderingen af et cachet resultat ud fra de profiler, der er valgt NU (F2-7, 6. okt. 2026).
// Cachen gemmer de allerede normaliserede flag, så de bruges direkte; kun status, fund, advarsel og
// alternativer følger de aktuelle profiler, ikke dem, der var valgt ved første scanning.
function rescoreCachedResult(cached, { activeIds, activeLevels, activeENumbers, family, activeProfiles }) {
  const base = {
    id: cached.id || null, code: cached.code, name: cached.name, brand: cached.brand || "",
    variant_label: cached.variant_label || null, image_url: cached.image_url || null,
    category: cached.category || null, subcategory: cached.subcategory || null, category_original: cached.category_original || null,
    ingredients: cached.ingredients || "", nutrition: cached.nutrition || null,
    verified_status: cached.verified_status || "unverified", source: cached.source,
  };
  return scoreScanResult({ base, flags: cached.allergen_flags || {}, activeIds, activeLevels, activeENumbers, family: family || [], activeProfiles: activeProfiles || [] });
}

function scoreScanResult({ base, flags, activeIds, activeLevels, activeENumbers, family, activeProfiles }) {
  const ingredientsText = base.ingredients;
  const { status: rawStatus, matchedDanger, matchedWarning, ignoredTraces, hasUnknown } = compareAllergens(flags, activeIds, activeLevels);
  // Data mangler for ét eller flere af dine allergener ("unknown"-felter) — vis
  // det IKKE som et trygt grønt "sikkert produkt". Uden dette nedgraderes en
  // reel datamangel aldrig til noget brugeren faktisk ser (fundet ved en
  // sikkerhedsgennemgang: samme UI blev vist for "bekræftet sikkert" og
  // "vi ved det faktisk ikke").
  const isUnsafeUnknown = rawStatus === "safe" && hasUnknown;
  // Udtræk E-numre fra ingredienstekst
  const productENumbers = extractENumbers(ingredientsText);
  const { matched: matchedENumbers } = compareENumbers(productENumbers, activeENumbers);
  // Overvågede E-numre er en konflikt med profilen (rød), ikke blot en advarsel (9. okt. 2026).
  const status = (rawStatus !== "danger" && matchedENumbers.length > 0) ? "danger" : isUnsafeUnknown ? "warn" : rawStatus;

  const flagList = [
    ...matchedDanger.map(id => ({ type:"bad", text:`Indeholder ${ALLERGENS.find(a=>a.id===id)?.label||id}` })),
    ...matchedWarning.map(id => ({ type:"maybe", text:`Kan indeholde spor af ${ALLERGENS.find(a=>a.id===id)?.label||id}` })),
    ...(hasUnknown ? [{ type:"maybe", text:"Visse allergener er ukendte — tjek altid pakken" }] : []),
    ...(ignoredTraces || []).map(id => ({ type:"info", text:`Kan indeholde spor af ${ALLERGENS.find(a=>a.id===id)?.label||id} — du har valgt ikke at få advarsel om spor` })),
    ...(matchedDanger.length===0 && matchedWarning.length===0 && !hasUnknown ? [{ type:"good", text:"Ingen af dine allergener fundet" }] : []),
    ...(matchedENumbers.length > 0 ? [{ type:"maybe", text:`Indeholder overvågede E-numre: ${matchedENumbers.join(", ")}` }] : []),
  ];
  const headlines = { safe:STATUS_TEXT.safe, danger:STATUS_TEXT.danger, warn: (isUnsafeUnknown && matchedWarning.length === 0) ? STATUS_TEXT.unknown : STATUS_TEXT.warn };
  const summaries = {
    safe:"Ingen af dine registrerede allergener er fundet i dette produkt.",
    danger:`Produktet indeholder ${[...matchedDanger.map(id=>ALLERGENS.find(a=>a.id===id)?.label||id), ...matchedENumbers].join(", ")}.`,
    warn: isUnsafeUnknown
      ? "Vi mangler data for ét eller flere af dine allergener i dette produkt — tjek selv emballagen før du spiser det."
      : `Produktet kan indeholde spor af ${matchedWarning.map(id=>ALLERGENS.find(a=>a.id===id)?.label||id).join(", ")}.`,
  };
  const familyImpact = [];
  if (family.length > 0) {
    for (const member of family.filter(m => activeProfiles.includes(m.id))) {
      const memberResult = compareAllergens(flags, member.allergens || [], member.levels);
      if (memberResult.matchedDanger.length > 0 || memberResult.matchedWarning.length > 0) {
        familyImpact.push({ name:member.name, color:member.color, danger:memberResult.matchedDanger, warning:memberResult.matchedWarning });
      }
    }
  }
  return {
    ...base,
    productENumbers,
    status, headline: headlines[status], summary: summaries[status],
    flags: flagList, allergen_flags: flags, matchedDanger, matchedWarning, ignoredTraces: ignoredTraces || [], matchedENumbers, familyImpact, hasUnknown,
    timestamp: Date.now(),
  };
}

function withCustomAllergenMatch(result, customTerms) {
  const customMatches = matchCustomAllergens(result.ingredients, customTerms);
  if (customMatches.length === 0) return result;
  const alreadyDanger = result.status === "danger";
  const quotedTerms = customMatches.map(t => `"${t}"`).join(", ");
  const customFlags = customMatches.map(term => ({
    type: "bad",
    text: `Ingredienslisten nævner muligvis "${term}" — din egen tilføjede allergi`,
    custom: true,
  }));
  return {
    ...result,
    status: "danger",
    headline: alreadyDanger ? result.headline : "Mulig egen allergi fundet",
    summary: alreadyDanger ? result.summary : `Ingredienslisten nævner muligvis ${quotedTerms} — en allergi du selv har tilføjet. Vores fritekstsøgning for selvtilføjede allergier er ikke lige så grundig som for vores faste allergener, så dobbelttjek altid selv emballagen. Vi arbejder løbende på at udvide vores faste allergen-liste.`,
    flags: [...customFlags, ...result.flags],
    customAllergenMatches: customMatches,
  };
}

// ── Simuleret scan (Fase 7b.2) ────────────────────────────────────────────
// Statisk demo-produkt til "Prøv en demo-scanning"-knappen på HOME. Kører
// gennem PRÆCIS samme beregningslogik som et rigtigt scan
// (buildScanResultFromProductData + withCustomAllergenMatch) — kun selve
// produkt-opslaget (netværk, cache, historik-gemning) er sprunget over.
// Det gør demoen personlig (matcher brugerens faktiske aktive allergener)
// og øjeblikkelig (ingen netværksventetid).
const DEMO_PRODUCT = {
  variant_label: null,
  name: "Nøddechokolade-creme", brand: "Demo-produkt",
  category: "Chokolade", image_url: null,
  ingredients: "Sukker, palmeolie, HASSELNØDDER 13%, skummetmælkspulver, VALLE, æggeblomme, emulgator: lecithiner (SOJA), vanillin.",
  allergen_flags: {
    gluten:"no", laktose:"yes", aeg:"yes",
    noedder:"yes", jordnoedder:"no", soja:"traces",
    fisk:"no", skaldyr:"no", selleri:"no",
    sennep:"no", sesam:"no", svovl:"no",
    lupin:"no", bloeddyr:"no",
  },
  nutrition: { energy_kcal:539, fat:30.9, saturated_fat:10.6, carbohydrates:57.5, sugars:56.3, fiber:3.4, protein:6.3, salt:0.11 },
  verified_status: "verified", source: "demo",
};

export function buildDemoScanResult({ activeIds, activeLevels, activeCustom, activeENumbers, family, activeProfiles }) {
  const result = buildScanResultFromProductData({
    product: DEMO_PRODUCT, data: {}, ean: "demo-0000000000",
    activeIds, activeLevels, activeENumbers: activeENumbers || [], family: family || [], activeProfiles: activeProfiles || [],
  });
  return { ...withCustomAllergenMatch(result, activeCustom || []), isDemo: true };
}

// ── Scan-opslag: hele scan-resultat-pipelinen (EAN-opslag, allergen-
// sammenligning, E-nummer-match, familie-impact, cache, historik,
// alternativer) i én samlet, testbar funktion i stedet for at ligge inlinet
// i App.jsx. Tager alt afhængigt state som eksplicit `ctx`-argument ved
// hvert kald i stedet for at fange det i en useCallback-closure — det
// garanterer altid friske værdier (ingen stale-closure-risiko fra en
// ufuldstændig deps-liste).
// ── Advarsels-alarm (Indstillinger → Scanning, 28. sept. 2026) ───────────────
// Vibration/lyd specifikt når et scan-resultat udløser en advarsel
// (status danger/warn — kan komme fra allergier, men også fra andre
// brugerpræferencer som diæter/E-numre, se buildScanResultFromProductData)
// — uafhængig af
// den allerede eksisterende, ubetingede "stregkode registreret"-feedback i
// useScanner.js (samme vibrate+Web Audio-mønster genbrugt derfra, men egen
// lavere/længere tone her, så de to kan skelnes). Begge kanaler er default
// TIL (ctx-værdien er kun `false` når brugeren selv har slået den fra i
// Indstillinger — `undefined`, fx fra eksisterende tests, tæller som TIL).
function fireWarningAlert(vibrateOn, soundOn) {
  if (vibrateOn !== false && navigator.vibrate) navigator.vibrate([50, 60, 50, 60, 90]);
  if (soundOn !== false) {
    try {
      const AudioCtx = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 320; gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.22);
    } catch { /* Web Audio ikke tilgængelig — ingen fallback nødvendig */ }
  }
}

// opts.via: "scan" (kamera/indtastet kode, standard), "search" (åbnet fra søgning, favoritter, alternativer, beskeder) eller "none"
// (åbnet fra Historik selv: produktet står der allerede, så der oprettes ingen ny række).
export async function runLookupProduct(ean, ctx, opts = {}) {
  const via = opts.via === "search" || opts.via === "none" ? opts.via : "scan";
  const logHistory = (...a) => (via === "none" ? Promise.resolve() : ctx.saveHistoryEntry(...a, via));
  const pushLocalHistory = (h, item) => (via === "none" ? h : [{ ...item, found_via: via }, ...h].slice(0, 50));
  const {
    accessToken, activeIds, activeLevels, activeCustom, activeENumbers, family, activeProfiles,
    productCacheRef, saveHistoryEntry, loadAlternatives, clearAlternatives,
    setScanResult, setScreen, setLoading, setScanError, setShowIng, setHistory,
    setNotFoundEan, setNotFoundStep, setOcrText, setProposedName, setProposedFlags,
    setProductImagePreview, setProductImageBase64, setOcrImageBase64, setNutritionImageBase64,
    vibrateOnWarning, soundOnWarning,
  } = ctx;

  if (!ean?.trim()) return;
  if (navigator.vibrate) navigator.vibrate(40);
  const tid = traceId("scan");
  traceLog(tid, "scan:start", { ean: ean.trim() });

  // Værn mod overlappende kald (fx et utålmodigt gen-scan mens forrige
  // opslag stadig venter på netværket) — uden dette kan et ældre, langsomt
  // kald nå at overskrive resultatet fra et nyere, hurtigere kald.
  ctx.scanTokenRef.current = (ctx.scanTokenRef.current || 0) + 1;
  const myToken = ctx.scanTokenRef.current;
  const isStale = () => ctx.scanTokenRef.current !== myToken;

  // Mindste synlige varighed for scan-loading-animationen (ScanLoadingOverlay).
  // Gælder KUN de grene der reelt venter på netværket — et cache-hit har intet
  // at vente på og skal forblive øjeblikkeligt, som det altid har gjort.
  const MIN_LOADING_MS = 450;
  const loadStartedAt = Date.now();
  const waitForMinLoading = async () => {
    const elapsed = Date.now() - loadStartedAt;
    if (elapsed < MIN_LOADING_MS) await new Promise(r => setTimeout(r, MIN_LOADING_MS - elapsed));
  };

  // Viser et cache-resultat og henter de tilhørende alternativer — delt af
  // både sessions-cachen (samme app-session) og den vedvarende offline-cache
  // (kun brugt når reelt offline, se nedenfor).
  const showCachedResult = (cachedProduct, offlineSavedAt = null) => {
    traceLog(tid, "scan:cache-hit");
    // Vurderingen beregnes forfra med de profiler, der er valgt nu (F2-7): ellers styrede den første
    // scannings profiler advarsel, lyd og alternativer, også efter skift af "Tjekker for".
    const rescored = rescoreCachedResult(cachedProduct, { activeIds, activeLevels, activeENumbers, family, activeProfiles });
    const matched = withCustomAllergenMatch(rescored, activeCustom);
    // F2-6: uden net vises et resultat gemt på telefonen; resultatsiden viser hvornår.
    const cachedResult = offlineSavedAt ? { ...matched, offlineSavedAt } : matched;
    setScanResult(cachedResult); setScreen(SCREENS.RESULT); setLoading(false);
    // Genscanningen gemmes i historikken som en almindelig scanning, så tilbagekaldelses- og
    // ændringsbeskeder også rammer den (useHistory fanger selv fejl, fx offline).
    setHistory(h => pushLocalHistory(h, cachedResult));
    logHistory(ean.trim(), cachedResult.id, cachedResult.status, cachedResult.allergen_flags, activeProfiles);
    if (navigator.vibrate) navigator.vibrate(25);
    // Alternativer er IKKE en del af det cachede result-objekt — uden dette
    // genbruger et cache-hit bare hvad end alternatives-state tilfældigvis
    // stod på fra en tidligere scanning i samme session (eller intet, hvis
    // det er appens første scanning), i stedet for at vise de rigtige
    // alternativer til DETTE produkt.
    if (cachedResult.status === "danger" || cachedResult.status === "warn") {
      fireWarningAlert(vibrateOnWarning, soundOnWarning);
      loadAlternatives(cachedResult, ean.trim());
    } else {
      clearAlternatives();
    }
  };

  // Kun sessions-cachen (in-memory, ryddes ved reload) bruges når vi er
  // online — den vedvarende offline-cache (localStorage, ingen udløbsdato)
  // må IKKE springe netværkskaldet over når vi reelt er online, for så
  // fryser den allergendata på scanningstidspunktet permanent, selv efter
  // en admin-godkendt rettelse retter dem server-side. Bruger-rapporteret
  // 27. sept. 2026: en godkendt ingrediens-rettelse til "Risted Løg" nåede
  // aldrig brugeren, fordi et tidligere, ingrediensløst scan af samme EAN
  // allerede lå uændret i den vedvarende cache — nøjagtig samme klasse fejl
  // som cache-nøglens v2-bump herover engang måtte rette med en global,
  // engangs-invalidering, ikke en rigtig løsning på selve mekanismen.
  const sessionCached = productCacheRef.current[ean.trim()];
  if (sessionCached) { showCachedResult(sessionCached); return; }

  if (!navigator.onLine) {
    const offlineCached = getFromOfflineCache(ean.trim());
    if (offlineCached) { showCachedResult(offlineCached, offlineCached._cached_at || null); return; }
    setScanError("Du er offline, og produktet er ikke gemt på telefonen. Prøv igen, når du har forbindelse.");
    setLoading(false); return;
  }
  setLoading(true); setScanResult(null); setScanError(""); setShowIng(false);
  try {
    const data = await apiCall(`${SUPABASE_URL}/functions/v1/products/${ean.trim()}`, {
      headers: makeHeaders(accessToken),
    });
    traceLog(tid, "scan:product-response", { found: data.found, name: data.product?.name });
    if (isStale()) return;
    if (!data.found) {
      traceLog(tid, "scan:not-found");
      setNotFoundEan(ean.trim());
      await logHistory(ean.trim(), null, "not_found", {}, activeProfiles);
      await waitForMinLoading();
      if (isStale()) return;
      setLoading(false); setScreen(SCREENS.NOTFOUND); setNotFoundStep(1);
      setOcrText(""); setProposedName("");
      setProposedFlags(Object.fromEntries(PRODUCT_ALLERGENS.map(a => [a.id, false])));
      setProductImagePreview(null); setProductImageBase64(null);
      setOcrImageBase64(null); setNutritionImageBase64(null);
      return;
    }
    let product = data.product;
    const variantLabel = product.variant_label || null;

    // ── Canonical opslag: hent allergen-data fra master-produkt ──────────
    if (product.canonical_ean) {
      try {
        const canonicalData = await apiCall(
          `${SUPABASE_URL}/rest/v1/products?ean=eq.${product.canonical_ean}&select=allergen_flags,ingredients_text,nutrition,verified_status,source,allergen_source_method,allergen_quality&limit=1`,
          { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
        );
        if (Array.isArray(canonicalData) && canonicalData[0]) {
          const c = canonicalData[0];
          // Behold variant-navn men brug canonical allergen-data
          product = {
            ...product,
            allergen_flags: c.allergen_flags || product.allergen_flags,
            ingredients: c.ingredients_text || product.ingredients,
            ingredients_text: c.ingredients_text || product.ingredients_text,
            nutrition: c.nutrition || product.nutrition,
            verified_status: c.verified_status || product.verified_status,
            source: c.source || product.source,
            allergen_source_method: c.allergen_source_method || product.allergen_source_method,
            allergen_quality: c.allergen_quality || product.allergen_quality,
          };
        }
      } catch { /* Brug variant-data som fallback */ }
    }

    const result = buildScanResultFromProductData({ product, data, ean, activeIds, activeLevels, activeENumbers, family, activeProfiles });
    productCacheRef.current[ean.trim()] = result;
    saveToOfflineCache(ean.trim(), result);
    const cacheKeys = Object.keys(productCacheRef.current);
    if (cacheKeys.length > 50) delete productCacheRef.current[cacheKeys[0]];
    traceLog(tid, "scan:result", { ean: ean.trim(), name: result.name, status: result.status, matchedDanger: result.matchedDanger, matchedWarning: result.matchedWarning });
    const finalResult = withCustomAllergenMatch(result, activeCustom);
    setScanResult(finalResult);
    setHistory(h => pushLocalHistory(h, finalResult));
    await logHistory(ean.trim(), product.id, finalResult.status, result.allergen_flags, activeProfiles);
    // Hent alternativer hvis produktet er farligt eller har spor
    if (finalResult.status === "danger" || finalResult.status === "warn") {
      fireWarningAlert(vibrateOnWarning, soundOnWarning);
      loadAlternatives(finalResult, ean.trim());
    } else {
      clearAlternatives();
    }
    await waitForMinLoading();
    if (isStale()) return;
    setScreen(SCREENS.RESULT);
    if (navigator.vibrate) navigator.vibrate(25);
  } catch (e) { traceLog(tid, "scan:error", { error: e.message }); setScanError("Kunne ikke hente produktet. Kontrollér forbindelsen og prøv igen."); }
  if (!isStale()) setLoading(false);
}

export function useProduct({ accessToken, userId, activeProfiles,
                              notFoundEan, setNotFoundEan,
                              setScreen }) {

  // Scan-resultat state
  const productCacheRef = useRef({}); // Cache af seneste 50 scannede produkter
  const scanTokenRef = useRef(0); // Værn mod overlappende runLookupProduct-kald
  const [scanResult, setScanResult]           = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [scanError_, setScanError_]           = useState("");
  const [notFoundStep, setNotFoundStep]       = useState(1);
  const [submitting, setSubmitting]           = useState(false);

  // OCR state
  const [ocrText, setOcrText]                 = useState("");
  const [ocrLoading, setOcrLoading]           = useState(false);
  const [ocrImageBase64, setOcrImageBase64]   = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [productImageBase64, setProductImageBase64]   = useState(null);

  // Ny produkt form
  const [proposedName, setProposedName]       = useState("");
  const [proposedNutrition, setProposedNutrition] = useState({ energy:"", fat:"", saturated:"", carbs:"", sugars:"", protein:"", salt:"" });
  const [proposedNotes, setProposedNotes]     = useState("");
  const [proposedFlags, setProposedFlags]     = useState(null);

  // Næringsindhold OCR
  const [nutritionOcrLoading, setNutritionOcrLoading] = useState(false);
  const [nutritionImageBase64, setNutritionImageBase64] = useState(null);

  // Suggest-edit state
  const [editStep, setEditStep]               = useState("start");
  const [editIngText, setEditIngText]         = useState("");
  const [editNote, setEditNote]               = useState("");
  const [editType, setEditType]               = useState(null);
  const [editProductImage, setEditProductImage]     = useState(null);
  const [editProductImageB64, setEditProductImageB64] = useState(null);
  const [editOcrLoading, setEditOcrLoading]   = useState(false);
  const [editOcrText, setEditOcrText]         = useState("");

  const extractProductName = (text) => {
    if (!text) return "";
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 2 && l.length < 50);
    return lines.filter(l =>
      !/^[0-9\s.,gkJ%]+$/.test(l) &&
      !/^(ingredienser|næringsindhold|opbevaring|bedst|energi|fedt|protein|salt|kulhydrat)/i.test(l) &&
      l.length > 3
    )[0] || "";
  };

  const handleProductImageCapture = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const tid = traceId("photo-product");
    traceLog(tid, "photo:start", { size: file.size, type: file.type });
    setOcrLoading(true);
    try {
      const base64 = await compressImageToBase64(file);
      setProductImageBase64(base64);
      setProductImagePreview(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
      try {
        const ocrData = await apiCall(`${SUPABASE_URL}/functions/v1/ocr`, { method:"POST", headers: makeHeaders(accessToken), body: JSON.stringify({ image_base64: base64, mode:"product_name" }) });
        if (ocrData.success && ocrData.text) {
          const text = ocrData.text;
          // Parse BRAND: og NAME: fra OCR-svar
          const brandMatch = text.match(/BRAND:\s*(.+)/i);
          const nameMatch = text.match(/NAME:\s*(.+)/i);
          if (nameMatch && nameMatch[1] && nameMatch[1].toLowerCase() !== "ukendt") {
            const brand = brandMatch?.[1]?.trim();
            const name = nameMatch[1].trim();
            const fullName = (brand && brand.toLowerCase() !== "ukendt") ? `${brand} ${name}` : name;
            setProposedName(fullName);
          } else {
            // Fallback til gammel metode
            const name = extractProductName(text);
            if (name) setProposedName(name);
          }
        }
      } catch {}
    } catch { setScanError_("Billedet kunne ikke læses. Prøv igen."); }
    setOcrLoading(false);
    setNotFoundStep(2);
  };

  const handleImageCapture = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const tid = traceId("ocr");
    traceLog(tid, "ocr:start", { size: file.size, type: file.type });
    setOcrLoading(true);
    try {
      const base64 = await compressImageToBase64(file);
      traceLog(tid, "ocr:base64-ready", { length: base64.length });
      setOcrImageBase64(base64);
      traceLog(tid, "ocr:image_ready", { size: Math.round(base64.length * 0.75 / 1024) + "kb" });
      const ocrData = await apiCall(`${SUPABASE_URL}/functions/v1/ocr`, { method:"POST", headers: makeHeaders(accessToken), body: JSON.stringify({ image_base64: base64 }) });
      traceLog(tid, "ocr:response", { success: ocrData.success, textLength: ocrData.text?.length || 0, text: (ocrData.text || "").substring(0, 80) });
      if (ocrData.success && ocrData.text) {
        setOcrText(ocrData.text);
        if (!proposedName) setProposedName(extractProductName(ocrData.text));
        traceLog(tid, "ocr:allergen-call", { textLength: ocrData.text.length });
        // force_ai:true — OCR-tekst er mindre pålidelig end maskinlæst data (fed/
        // versal-formatering fra det fotograferede mærkat kan tabes/fejllæses),
        // og resultatet bliver PERMANENT data for alle fremtidige scanninger af
        // produktet. Volumen er lav (kun nye produkt-indsendelser, ikke
        // almindelige scanninger), så den ekstra Claude-omkostning er ubetydelig
        // sammenlignet med at spare over den samme, billigere heuristik som
        // bruges til den høj-volumen natlige reparse-cron (se
        // shouldUseClaudeFallback i allergens/index.ts).
        const allergenData = await apiCall(`${SUPABASE_URL}/functions/v1/allergens`, { method:"POST", headers: makeHeaders(accessToken), body: JSON.stringify({ text: ocrData.text, force_ai: true }) });
        traceLog(tid, "ocr:allergen-response", { success: allergenData.success, method: allergenData.method, flags: allergenData.allergen_flags });
        if (allergenData.success) setProposedFlags(allergenData.allergen_flags);
        setNotFoundStep(3); // → Næringsindhold
      } else {
        traceLog(tid, "ocr:empty", { error: "OCR returnerede tom tekst eller fejl", raw: JSON.stringify(ocrData).substring(0, 200) });
        setScanError_("Billedet kunne ikke læses. Prøv et klarere billede.");
      }
    } catch (e) {
      traceLog(tid, "ocr:error", { error: e?.message || String(e) });
      setScanError_(e?.status === 429
        ? "Du har brugt dagens grænse for billedlæsning. Prøv igen i morgen, eller indtast ingredienserne selv."
        : "Billedet kunne ikke analyseres. Prøv igen.");
    }
    setOcrLoading(false);
  };

  // Parse næringsindhold fra OCR tekst
  const parseNutritionFromText = (text) => {
    const find = (patterns) => {
      for (const p of patterns) {
        const m = text.match(p);
        if (m) return m[1]?.replace(",", ".").trim();
      }
      return "";
    };
    return {
      energy:    find([/energi[^0-9]*([0-9][0-9,./ kJ]+)/i, /energy[^0-9]*([0-9][0-9,./ kJ]+)/i]),
      fat:       find([/fedt[^0-9]*([0-9][0-9,.]*)\s*g/i, /fat[^0-9]*([0-9][0-9,.]*)\s*g/i]),
      saturated: find([/mættet[^0-9]*([0-9][0-9,.]*)\s*g/i, /saturated[^0-9]*([0-9][0-9,.]*)\s*g/i]),
      carbs:     find([/kulhydrat[^0-9]*([0-9][0-9,.]*)\s*g/i, /carbohydrate[^0-9]*([0-9][0-9,.]*)\s*g/i]),
      sugars:    find([/sukker[^0-9]*([0-9][0-9,.]*)\s*g/i, /sugar[^0-9]*([0-9][0-9,.]*)\s*g/i]),
      protein:   find([/protein[^0-9]*([0-9][0-9,.]*)\s*g/i]),
      salt:      find([/salt[^0-9]*([0-9][0-9,.]*)\s*g/i]),
    };
  };

  const handleNutritionCapture = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const tid = traceId("ocr-nutrition");
    traceLog(tid, "nutrition-ocr:start", { size: file.size });
    setNutritionOcrLoading(true);
    setScanError_("");
    try {
      const base64 = await compressImageToBase64(file);
      setNutritionImageBase64(base64);
      const ocrData = await apiCall(`${SUPABASE_URL}/functions/v1/ocr`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({ image_base64: base64, mode: "nutrition" }),
      });
      traceLog(tid, "nutrition-ocr:response", { success: ocrData.success, textLength: ocrData.text?.length || 0 });
      if (ocrData.success && ocrData.text) {
        const parsed = parseNutritionFromText(ocrData.text);
        traceLog(tid, "nutrition-ocr:parsed", parsed);
        // OCR-teksten kom igennem, men ingen af felterne kunne genkendes af
        // regex'en — uden dette tjek ville brugeren se helt tomme felter og
        // ingen antydning af at billedet reelt blev læst og bare ikke gav
        // noget brugbart (samme "stille fejl"-mønster som selve mode-bug'en).
        const foundAny = Object.values(parsed).some(v => v);
        if (foundAny) {
          setProposedNutrition(parsed);
        } else {
          setScanError_("Kunne ikke genkende næringsværdierne i billedet. Prøv et klarere billede, eller udfyld felterne manuelt.");
        }
      } else {
        traceLog(tid, "nutrition-ocr:empty", { raw: JSON.stringify(ocrData).substring(0, 100) });
        setScanError_("Næringsindholdet kunne ikke læses. Prøv et klarere billede, eller udfyld felterne manuelt.");
      }
    } catch (err) {
      traceLog(tid, "nutrition-ocr:error", { error: err?.message });
      setScanError_("Billedet kunne ikke analyseres. Prøv igen, eller udfyld felterne manuelt.");
    }
    setNutritionOcrLoading(false);
  };

  const handleEditProductCapture = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const b64 = await compressImageToBase64(file);
      setEditProductImage(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
      setEditProductImageB64(b64);
    } catch {
      setScanError_("Billedet kunne ikke læses. Prøv igen.");
    }
  };

  // ocrTextOverride: NotFoundScreen kalder setOcrText() og submitProduct() i samme
  // klik-handler — en almindelig setOcrText()-opdatering slår først igennem ved
  // næste render, så submitProduct ville ellers sende den GAMLE ocrText, og
  // brugerens manuelt rettede ingrediensliste ville aldrig nå frem til serveren
  const submitProduct = async (ocrTextOverride) => {
    const finalOcrText = ocrTextOverride ?? ocrText;
    const tid = traceId("submit");
    traceLog(tid, "submit:start", { ean: notFoundEan, name: proposedName, hasOcr: !!finalOcrText, hasImage: !!productImageBase64 });
    setSubmitting(true);
    try {
      await apiCall(`${SUPABASE_URL}/functions/v1/submissions`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({
          ean: notFoundEan, submitted_by: userId,
          ocr_raw_text: finalOcrText, raw_label_image: ocrImageBase64 || null,
          ai_parsed_data: { ...proposedFlags, name: proposedName, product_image_base64: productImageBase64, nutrition: proposedNutrition, notes: proposedNotes },
          images: nutritionImageBase64 ? [{ kind: "nutrition", base64: nutritionImageBase64 }] : [],
          user_confirmed: true,
        }),
      });
      traceLog(tid, "submit:success", { ean: notFoundEan });
      setScreen(SCREENS.SUBMITTED);
    } catch (e) {
      traceLog(tid, "submit:error", { error: e.message });
      setScanError_("Indsendelse fejlede. Prøv igen.");
    }
    setSubmitting(false);
  };

  return {
    productCacheRef,
    scanTokenRef,
    scanResult, setScanResult,
    loading, setLoading,
    scanError: scanError_, setScanError: setScanError_,
    notFoundStep, setNotFoundStep,
    submitting,
    ocrText, setOcrText,
    ocrLoading, setOcrLoading,
    ocrImageBase64, setOcrImageBase64,
    setNutritionImageBase64,
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
    nutritionOcrLoading,
    handleNutritionCapture,
    editOcrLoading, setEditOcrLoading,
    editOcrText, setEditOcrText,
    handleProductImageCapture,
    handleImageCapture,
    handleEditProductCapture,
    submitProduct,
  };
}
