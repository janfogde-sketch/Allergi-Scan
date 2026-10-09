// @ts-nocheck
import React from "react";
import { ALLERGENS, SCREENS, E_NUMBERS, DIETS, SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { allergenChoiceLabel, compareENumbers, checkDietCompatibility, productDisplayName, buildActiveProfileList, computeProfileResults, profileWarnLabel, categorizeProductFindings, computeTopStatus, ignoresTraces, effectiveAllergenFlag, evaluateProductForProfiles, ingredientsLookIncomplete, sulfiteAssessment, STATUS_TEXT } from "./helpers.js";
import { ALLERGEN_KEYWORDS } from "./allergenKeywords.js";
import { Icon, IngredientsList, ProductImage, ListPickerSheet, ConfirmDialog, showToast, StateBox } from "./SharedComponents.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useHistoryContext } from "./HistoryContext.jsx";
import { useShoppingContext } from "./ShoppingContext.jsx";
import { UI } from "./styleUtils.js";
import { useRecalls } from "./useRecalls.js";
import RecallNotice from "./RecallNotice.jsx";
import { getSearchReturnFor, clearSearchReturn } from "./searchReturn.js";
import { useMeasuredHeight } from "./useMeasuredHeight.js";

import { makeResultSections } from "./ResultSections.jsx";


// Antal alternativer, der vises som standard; resten bag "Se flere alternativer".
const ALT_VISIBLE = 3;

export default function ResultScreen({
  scanResult,
  activeENumbers,
  selectedENumbers,
  setKnowledgeSlug,
  setEditStep,
  setEditIngText,
  setEditNote,
  setEditType,
  alternatives,
  altLoading,
  lookupProduct,
}) {
  const { user, accessToken } = useAuthContext();
  // Scan-profiler = egne profiler + husstandens skrivebeskyttede konti (App.jsx, 1. okt. 2026).
  const { scanFamily: family, allergens, customAllerg, activeProfiles, profileLoadStatus, retryProfileLoad } = useProfileContext();
  const { setScreen } = useNavigationContext();
  const { isFavorite, toggleFavorite } = useHistoryContext();
  const { lists, activeList, activeListId, addToList, shoppingList, toggleItem, setNewItemName } = useShoppingContext();
  const searchBack = scanResult ? getSearchReturnFor(scanResult.code || scanResult.ean) : null;
  const [addedToList, setAddedToList] = React.useState(false);
  const [showListPicker, setShowListPicker] = React.useState(false);
  const [unknownOpen, setUnknownOpen] = React.useState(false);
  const [altExpanded, setAltExpanded] = React.useState(false);
  const [confirmAddOpen, setConfirmAddOpen] = React.useState(false);
  const [reasonsOpen, setReasonsOpen] = React.useState(false);
  const [greenOpen, setGreenOpen] = React.useState(false);
  // Nulstil "tilføjet"-kvitteringen når man ser et nyt produkt — ResultScreen
  // forbliver monteret på tværs af scanninger, kun scanResult skifter.
  React.useEffect(() => { setAddedToList(false); setShowListPicker(false); setUnknownOpen(false); }, [scanResult?.code]);
  // F4-6: resultatets overskrift får fokus ved hvert nyt resultat, så skærmlæseren straks læser vurderingen op.
  const verdictHeadingRef = React.useRef(null);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => verdictHeadingRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, [scanResult?.code]);
  // F1-1: tilbagekaldt af Fødevarestyrelsen (opslag på EAN); gør status rød uanset allergier.
  const recalls = useRecalls(scanResult?.isDemo && import.meta.env.MODE !== "artifact-preview" ? null : scanResult?.code, accessToken);
  // Bundnavigationen er ca. 113 px på iPhones med hjemmeindikator, men .screen har kun 110 px: mål den, så sidste kort aldrig skjules.
  const navH = useMeasuredHeight(() => document.querySelector(".bottom-nav"));
  if (!scanResult) return null;

  // Hotfix F2-1 (6. okt. 2026): uden hentet profil (allergener og familie) er der intet at
  // vurdere imod, og en tom profil ville give et grønt "Ingen match med dine valg". Vis i
  // stedet, at profilen mangler, og vurdér først, når den er hentet (siden regner selv om).
  if (profileLoadStatus === "loading" || profileLoadStatus === "error") {
    const failed = profileLoadStatus === "error";
    return (
      <div className="screen fade-in">
        <div className="card" role="status" style={{ marginTop:8 }}>
          <div style={{ fontSize:15, fontWeight:800, color:"var(--ink)", marginBottom:4 }}>
            {productDisplayName({ name: scanResult.name, brand: scanResult.brand }) || "Produktet"}
          </div>
          <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginTop:12 }}>
            <span style={{ flexShrink:0, marginTop:2 }}><Icon name="info" size={18} color="var(--neutral)" /></span>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"var(--ink)", marginBottom:4 }}>
                {failed ? "Din profil kunne ikke hentes" : "Henter din profil …"}
              </div>
              <div style={{ fontSize:13, color:"var(--ink2)", lineHeight:1.5 }}>
                {failed
                  ? "Vi kan ikke vurdere produktet, før dine allergier er hentet. Tjek din forbindelse, og prøv igen."
                  : "Vurderingen vises, så snart dine allergier er hentet."}
              </div>
            </div>
          </div>
          {failed && (
            <button className="btn btn-primary btn-full" style={{ marginTop:16 }} onClick={retryProfileLoad}>Prøv igen</button>
          )}
        </div>
      </div>
    );
  }

  // ── Per-profil sikkerhedsvurdering (25. sept. 2026, brugerfeedback) ──────
  // Hver aktiv profil evalueres SEPARAT mod produktets allergener,
  // kostpræferencer og overvågede E-numre — profiler slås ikke sammen til
  // ét anonymt allergisæt. Beregnet her ved render-tid (ikke i selve
  // scanResult, som useProduct.js bygger ud fra det sammenlagte activeIds-
  // sæt til appens øvrige, eksisterende brug af det) — et skift af aktive
  // profiler mens et resultat vises opdaterer dermed visningen øjeblikkeligt
  // uden et nyt scan. Selve beregningen (buildActiveProfileList/
  // computeProfileResults) er delt med ListScreen.jsx's per-vare-status —
  // se helpers.js for hvorfor.
  const resultProfilesRaw = buildActiveProfileList({ user, family, allergens, customAllerg, selectedENumbers, activeProfiles });
  const incompleteReason = ingredientsLookIncomplete({ name: scanResult.name, ingredients: scanResult.ingredients });
  const profileResults = computeProfileResults(resultProfilesRaw, {
    allergen_flags: scanResult.allergen_flags,
    ingredients: scanResult.ingredients,
    nutrition: scanResult.nutrition,
    productENumbers: scanResult.productENumbers,
    incomplete: incompleteReason,
  });

  // Alternativer (9. okt. 2026): kun produkter, der efter det fælles statussystem har GRØN status for ALLE aktive profilers valg (inkl. E-numre,
  // egne allergier og kostpræferencer, med tilstrækkelige data). Spor, konflikt og mangelfulde data udelades. Det er ikke en garanti.
  const safeAlternatives = (alternatives || []).filter(p => evaluateProductForProfiles(resultProfilesRaw, p).level === "safe");

  const isMultiProfile = profileResults.length > 1;
  const overallStatus = !isMultiProfile ? scanResult.status
    : profileResults.some(r => r.status === "danger") ? "danger"
    : profileResults.some(r => r.status === "warn") ? "warn"
    : "safe";
  // "Kan ikke afgøres sikkert for alle" indeholdt ordet "sikkert" — undgået
  // konsekvent på tværs af hele denne skærm (FINAL PRODUCT RESULT PAGE,
  // krav 1: brug aldrig "sikkert"/"100% sikkert"/"allergifrit"/"garanteret").
  const overallHeadline = !isMultiProfile ? scanResult.headline
    : overallStatus === "safe" ? STATUS_TEXT.safe
    : overallStatus === "danger" ? STATUS_TEXT.danger
    : profileWarnLabel(profileResults);

  // ── FINAL PRODUCT RESULT PAGE — dynamisk, kategoriseret statuslogik (28.
  // sept. 2026) ──────────────────────────────────────────────────────────
  // Bygget udelukkende af data der allerede findes på scanResult + brugerens
  // egne aktive valg (allergener/E-numre/diæter) — ingen specialcases pr.
  // produkt. Ændrer IKKE scanResult.status/headline/summary selv (History/
  // ListScreen/SearchScreen bruger fortsat dem uændret) — kun denne skærms
  // egen, rigere visning bygger på `topStatus`/`findings` herfra. Diæt-
  // resultaterne er en UNION på tværs af alle aktive profilers valgte
  // diæter (samme som den tidligere ad hoc-beregning i renderSafetyDiet),
  // ikke kun den loggede brugers egne — bevarer multi-profil-understøttelsen.
  const allActiveDiets = new Set();
  profileResults.forEach(p => (p.diets || []).forEach(d => allActiveDiets.add(d)));
  const dietResults = [...allActiveDiets].map(d => ({
    id: d,
    label: DIETS.find(x => x.id === d)?.label || d,
    ...checkDietCompatibility(d, scanResult.allergen_flags, scanResult.ingredients, scanResult.nutrition),
  }));
  const matchedENumbersForUser = (scanResult.productENumbers?.length > 0 && activeENumbers?.length > 0)
    ? compareENumbers(scanResult.productENumbers, activeENumbers).matched
    : [];
  // Fundene bygges af de profiler, der er aktive NU (profileResults), ikke
  // af scanResult.matchedDanger/-Warning, som blev beregnet med de profiler,
  // der var aktive, da produktet blev scannet. Ellers kunne fx en
  // familieprofils æg-allergi blive fremhævet i ingredienslisten, selvom
  // kun brugerens egen profil (uden æg) var aktiv (rapporteret 30. sept.
  // 2026) — og "Dine valg" og fremhævningen kunne modsige hinanden.
  const uniqueIds = (arr) => [...new Set(arr)];
  const liveDanger = uniqueIds(profileResults.flatMap(p => p.danger || []));
  const liveWarning = uniqueIds(profileResults.flatMap(p => p.warning || [])).filter(id => !liveDanger.includes(id));
  const liveCustom = uniqueIds(profileResults.flatMap(p => p.customMatches || []));
  // Spor for allergener, brugeren kun reagerer direkte på (allergen_levels): ingen advarsel, kun en rolig info-linje.
  // Har en anden aktiv profil allergenet uden den undtagelse, flagges det i stedet (liveWarning).
  const liveIgnoredTraces = uniqueIds(profileResults.flatMap(p => p.ignoredTraces || []))
    .filter(id => !liveDanger.includes(id) && !liveWarning.includes(id));
  const findings = categorizeProductFindings({
    matchedDanger: liveDanger,
    matchedWarning: liveWarning,
    ignoredTraces: liveIgnoredTraces,
    customAllergenMatches: liveCustom,
    matchedENumbers: matchedENumbersForUser,
    dietResults,
  });
  // "Utilstrækkelige data" (krav 2F) — enten mangler brugerens EGNE aktive
  // allergener klassifikation (profilernes "unknown", beregnet ovenfor for
  // de profiler, der er aktive nu), eller produktet har hverken allergen-flags eller en
  // ingrediensliste overhovedet at kontrollere noget som helst imod.
  const hasAnyAllergenData = scanResult.allergen_flags && Object.values(scanResult.allergen_flags).some(v => v === "yes" || v === "no" || v === "traces");
  const hasIngredientsText = !!(scanResult.ingredients && scanResult.ingredients.trim());
  const hasSufficientData = !profileResults.some(p => (p.unknown || []).length > 0 || (p.insufficient || []).length > 0) && (hasAnyAllergenData || hasIngredientsText);
  const topStatus = computeTopStatus({ hasSufficientData, ...findings });
  // "Kan ikke vurderes": ingen fund, men for lidt data til at kontrollere alle valg (også ved flere profiler, hvor "ukendt" ellers giver et gult "kan ikke bekræftes").
  const cannotAssess = topStatus.level === "unknown";

  // ── Ingrediensliste-fremhævning (krav 8/9) ──────────────────────────────
  // KUN ingredienser der reelt matcher et fund relevant for DENNE bruger —
  // ikke alle allergener produktet måtte indeholde (se IngredientsList's
  // egen kommentar i SharedComponents.jsx for hvorfor det er en bevidst
  // forskel fra standard-opførslen). Hver regel bærer sin egen korte
  // forklaring til tap-forklaringen (krav 9).
  //
  // Diæt-fund er det eneste sted hvor et rent tekst-nøgleord skal udledes
  // bagefter, i stedet for at være kendt på forhånd — checkDietCompatibility
  // (helpers.js) returnerer kun en færdig sætning ("Indeholder gelatine"
  // eller "Indeholder mælkeprotein"). For allergen-flag-baserede diæt-brud
  // (mælk/laktose/æg/fisk/skaldyr/bløddyr/gluten/hvede) er selve ordet i
  // sætningen ikke nødvendigvis det ord der reelt står i ingredienslisten
  // (fx "mælkeprotein" vs. den faktiske ingrediens "skummetmælkspulver") —
  // mappet til det rigtige allergens egen ordliste herunder. For de
  // resterende (ingrediens-nøgleords-baserede, fx "Indeholder gelatine")
  // ER selve ordet i sætningen garanteret det ord der udløste matchet, så
  // en simpel præfiks-afstrejning er nok.
  const DIET_REASON_TO_ALLERGEN_ID = { "mælkeprotein":"maelkeallergi", "laktose":"laktose", "æg":"aeg", "fisk":"fisk", "skaldyr":"skaldyr", "bløddyr":"bloeddyr", "gluten":"gluten", "hvede":"hvede" };
  const dietFailKeywords = (reasonText) => {
    const stripped = (reasonText || "").replace(/^(Indeholder|Kan indeholde spor af)\s+/i, "").trim().toLowerCase();
    const mappedId = DIET_REASON_TO_ALLERGEN_ID[stripped];
    if (mappedId && ALLERGEN_KEYWORDS[mappedId]) return ALLERGEN_KEYWORDS[mappedId];
    return stripped ? [stripped] : [];
  };
  const ingredientHighlightRules = [
    ...findings.allergyMatches.map(m => ({
      keywords: ALLERGEN_KEYWORDS[m.id] || [m.label],
      category: "allergy", label: m.label,
      reason: m.severity === "traces" ? `Kan indeholde spor af ${m.label} — du er allergisk.` : `Matcher dit valg: ${m.label}.`,
    })),
    ...findings.intoleranceMatches.map(m => ({
      keywords: ALLERGEN_KEYWORDS[m.id] || [m.label],
      // "allergy"-kategori (rød), ikke en separat "intolerance"-farve —
      // FORBEDR PRODUKTSIDEN (28. sept. 2026) samler allergi+intolerance i
      // én rød sundhedsadvarsel-behandling overalt på siden, se topStatus.
      category: "allergy", label: m.label,
      reason: m.severity === "traces" ? `Kan indeholde spor af ${m.label}.` : `Matcher dit valg: ${m.label}.`,
    })),
    // Spor er gule (ikke røde): kun direkte indhold er en allergi-advarsel
    ...findings.traceMatches.map(m => ({
      keywords: ALLERGEN_KEYWORDS[m.id] || [m.label],
      category: "trace", label: m.label,
      reason: `Kan indeholde spor af ${m.label}.`,
    })),
    ...findings.customMatches.map(m => ({
      keywords: [m.label],
      category: "allergy", label: m.label,
      reason: "Din egen tilføjede allergi.",
    })),
    ...findings.eNumberMatches.map(code => ({
      codes: [code],
      category: "enumber", label: code,
      reason: "Du har valgt at undgå dette E-nummer.",
    })),
    ...findings.dietFails.map(d => ({
      keywords: dietFailKeywords(d.reasons?.[0]),
      category: "diet", label: d.label,
      reason: d.reasons?.[0] ? `${d.reasons[0]} — passer derfor ikke til ${d.label.toLowerCase()}.` : `Passer ikke til ${d.label.toLowerCase()}.`,
    })).filter(r => r.keywords.length > 0),
  ];
  const onIngredientHighlightTap = (rule) => showToast(`${rule.label} — ${rule.reason}`, "info");

  // ── "DINE VALG" (FORBEDR PRODUKTSIDEN, 28. sept. 2026) ──────────────────
  // Én samlet, neutral forklaringssektion for ÉN aktiv profil — erstatter
  // "Relevant for dig" + "Passer til dine kostpræferencer", som begge viste
  // en delvist overlappende konklusion. Viser ALLE brugerens EGNE valgte
  // allergier/intolerancer, kostpræferencer og overvågede E-numre — hver
  // med ✓ (matcher ikke)/✕ (matcher, med konkret grund)/? (kan ikke
  // afgøres ud fra produktdata) — aldrig kun de der matcher, og aldrig en
  // overskrift der lover et bestemt udfald (krav 3: "brug ALDRIG 'PASSER
  // TIL DINE KOSTPRÆFERENCER' hvis resultatet kan være negativt"). Kun ved
  // ÉN aktiv profil — ved flere profiler dækker renderPersonOverview()
  // allerede hver persons egne fund separat.
  const soloProfile = (!isMultiProfile && resultProfilesRaw.length === 1) ? resultProfilesRaw[0] : null;
  const CHOICE_STATUS_ORDER = { cross: 0, trace: 1, unknown: 2, check: 3 };

  const buildAllergyChoiceRows = () => {
    if (!soloProfile) return [];
    const flags = scanResult.allergen_flags || {};
    const rows = (soloProfile.allergens || []).map(id => {
      const a = ALLERGENS.find(x => x.id === id);
      if (!a) return null;
      const val = effectiveAllergenFlag(flags, id);
      if (val === "yes") return { status: "cross", label: allergenChoiceLabel(a), reason: "Fundet i produktet" };
      if (val === "traces") {
        // Brugeren reagerer kun på direkte indhold: spor er ikke en advarsel, men skjules ikke
        if (ignoresTraces(soloProfile.levels, id)) return { status: "check", label: allergenChoiceLabel(a), reason: "Spor nævnt på pakken (du har valgt ikke at få advarsel om spor)" };
        return { status: "trace", label: allergenChoiceLabel(a), reason: "Kan indeholde spor" };
      }
      // Et "nej" på en blanding eller delliste er ikke dokumenteret: grøn kræver en fuldstændig ingrediensliste.
      if (val === "no" && incompleteReason) return { status: "unknown", label: allergenChoiceLabel(a), reason: `${incompleteReason}, så "ikke fundet" er ikke dokumenteret.` };
      if (val === "no") return { status: "check", label: allergenChoiceLabel(a), reason: "Ikke fundet" };
      // Sulfitter: et E-nummer alene er ikke en deklareret allergen, og mængden er ukendt (hverken "ikke fundet" eller "fundet").
      if (id === "svovl" && sulfiteAssessment(scanResult.ingredients) === "unknown") return { status: "unknown", label: allergenChoiceLabel(a), reason: "Et sulfit-E-nummer er nævnt, men sulfit er ikke deklareret, og mængden er ukendt" };
      return { status: "unknown", label: allergenChoiceLabel(a), reason: "Kan ikke afgøres ud fra de tilgængelige produktdata." };
    }).filter(Boolean);
    // Egne, fritekst-tilføjede allergier er en ren ordsøgning (matchCustomAllergens). Fundet = ✕. Ikke fundet er IKKE et ✓
    // (6. okt. 2026, Bjørn: ingen falsk tryghed): andre navne for det samme og spor fanges ikke, så den vises som "?".
    const customRows = (soloProfile.custom || []).map(term => {
      const found = liveCustom.some(m => m.toLowerCase() === term.toLowerCase());
      return found
        ? { status: "cross", label: term, reason: "Fundet i ingredienslisten (fritekst)" }
        : { status: "unknown", label: term, reason: "Ordet står ikke i ingredienslisten. Andre navne og spor fanges ikke, så tjek selv pakken." };
    });
    return [...rows, ...customRows].sort((a, b) => CHOICE_STATUS_ORDER[a.status] - CHOICE_STATUS_ORDER[b.status]);
  };

  const buildDietChoiceRows = () => {
    if (!soloProfile) return [];
    return dietResults.map(r => {
      if (r.ok === false) return { status: "cross", label: r.label, reason: r.reasons?.[0] || "Passer ikke til dit valg." };
      // Lav datasikkerhed (fx tom ingrediensliste) kan give et falsk "ok:true"
      // for vegan/vegetarisk/pescetarian (de returnerer aldrig ok:null, kun en
      // lav confidence, se checkDietCompatibility) — vis "?" i stedet for en
      // falsk grøn ✓, så denne sektion aldrig modsiger et gråt "utilstrækkelige
      // data"-resultatkort ovenfor.
      if (r.ok === null || (r.ok === true && r.confidence === "low")) {
        return { status: "unknown", label: r.label, reason: r.reasons?.[0] ? `${r.reasons[0]} — kan ikke afgøres med sikkerhed.` : "Kan ikke afgøres ud fra de tilgængelige produktdata." };
      }
      return { status: "check", label: r.label, reason: "Ikke fundet" };
    }).sort((a, b) => CHOICE_STATUS_ORDER[a.status] - CHOICE_STATUS_ORDER[b.status]);
  };

  const eNumberChoiceLabel = (id) => E_NUMBERS[id] ? `${id} — ${E_NUMBERS[id].split("—")[0].trim()}` : id;
  const buildENumberChoiceRows = () => {
    if (!soloProfile) return [];
    const ids = soloProfile.eNumbers || [];
    if (ids.length === 0) return [];
    if (!hasIngredientsText) {
      return ids.map(id => ({ status: "unknown", label: eNumberChoiceLabel(id), reason: "Ingrediensliste mangler — kan ikke afgøres." }));
    }
    const present = new Set((scanResult.productENumbers || []).map(e => e.toUpperCase()));
    return ids.map(id => present.has(id.toUpperCase())
      ? { status: "cross", label: eNumberChoiceLabel(id), reason: "Fundet i produktet" }
      : incompleteReason
        ? { status: "unknown", label: eNumberChoiceLabel(id), reason: `${incompleteReason}, så "ikke fundet" er ikke dokumenteret.` }
        : { status: "check", label: eNumberChoiceLabel(id), reason: "Ikke fundet" }
    ).sort((a, b) => CHOICE_STATUS_ORDER[a.status] - CHOICE_STATUS_ORDER[b.status]);
  };

  // Standardforklaringer på "kan ikke afgøres" gentages ikke pr. valg: den samlede linje i "Dine valg" siger det én gang.
  const GENERIC_UNKNOWN_REASONS = ["Kan ikke afgøres ud fra de tilgængelige produktdata.", "Ingrediensliste mangler — kan ikke afgøres."];
  const ChoiceRow = ({ status, label, reason }) => {
    if (status === "unknown" && GENERIC_UNKNOWN_REASONS.includes(reason)) reason = null;
    // Ens ikoner og farver (9. okt. 2026): rød = fundet, orange = spor, grøn = ikke fundet i de registrerede oplysninger, grå = kan ikke afgøres.
    const icon = status === "cross" ? "x" : status === "trace" ? "warning" : status === "unknown" ? "info" : "check";
    const color = status === "cross" ? "var(--red)" : status === "trace" ? "var(--amber)" : status === "unknown" ? "var(--neutral)" : "var(--green)";
    return (
      <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"3px 0" }}>
        <span style={{ flexShrink:0, marginTop:2, display:"inline-flex" }}><Icon name={icon} size={13} color={color} /></span>
        <div style={{ fontSize:12.5, lineHeight:1.45, minWidth:0 }}>
          <span style={{ fontWeight:700, color:"var(--ink)" }}>{label}</span>
          {reason && <span style={{ color: status === "check" ? "var(--muted)" : color, fontWeight: status === "check" ? 400 : 600 }}> – {reason}</span>}
        </div>
      </div>
    );
  };

  const ChoiceCategory = ({ title, rows }) => {
    if (rows.length === 0) return null;
    return (
      <div>
        <div style={UI.ufs9_cmuted_fw700_ttuppercas_ls4px_mb4}>{title}</div>
        <div style={{ display:"flex", flexDirection:"column" }}>
          {rows.map((r, i) => <ChoiceRow key={i} {...r} />)}
        </div>
      </div>
    );
  };

  // ── Småbørn-advarsler (under 3 år) ──────────────────────────────────────────
  const currentYear = new Date().getFullYear();

  const INFANT_WARNINGS = [
    {
      id: "honey",
      label: "Honning",
      // "mel" fjernet: "mel" er dansk for mel/flour og optræder som understreng i
      // hvedemel/rismel/majsmel osv. — udløste en falsk honning-advarsel på næsten
      // ethvert produkt med mel i ingredienslisten
      keywords: ["honning", "honey", "miel"],
      reason: "Honning frarådes til børn under 1 år pga. risiko for botulisme. Vær forsigtig under 3 år.",
    },
    {
      id: "salt",
      label: "Højt saltindhold",
      check: (n) => n?.salt != null && parseFloat(n.salt) > 1.5,
      reason: "Produktet indeholder over 1,5 g salt pr. 100 g. Højt saltindhold frarådes til småbørn.",
    },
    {
      id: "additives",
      label: "E-numre der frarådes til småbørn",
      eNumbers: ["E102","E104","E110","E122","E123","E124","E129","E131","E132","E133","E142","E151","E154","E155","E211","E621"],
      reason: "Produktet indeholder farvestoffer eller tilsætningsstoffer der frarådes til børn under 3 år.",
    },
  ];

  const getInfantWarnings = (product) => {
    const warnings = [];
    const ingredients = (product.ingredients_text || product.ingredients || "").toLowerCase();
    const nutrition = product.nutrition;
    const eNums = product.productENumbers || [];

    for (const w of INFANT_WARNINGS) {
      if (w.keywords && w.keywords.some(k => ingredients.includes(k))) {
        warnings.push(w);
      } else if (w.check && w.check(nutrition)) {
        warnings.push(w);
      } else if (w.eNumbers && w.eNumbers.some(e => eNums.includes(e))) {
        warnings.push(w);
      }
    }
    return warnings;
  };

  // Find aktive profiler der er børn under 3
  const infantProfiles = [
    ...(family || []).filter(m =>
      activeProfiles.includes(m.id) &&
      m.birth_year &&
      (currentYear - m.birth_year) < 3
    )
  ];
  const infantWarnings = infantProfiles.length > 0 ? getInfantWarnings(scanResult) : [];

  // Tryk på ingrediens → søg i knowledge_base → åbn leksikon
  const handleIngredientTap = async (ingredientText) => {
    if (!ingredientText?.trim()) return;
    const q = ingredientText.trim().toLowerCase().slice(0, 50);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/knowledge_base?or=(title.ilike.*${encodeURIComponent(q)}*,aliases.cs.{${encodeURIComponent(q)}})`
        + `&select=slug&limit=1`,
        { headers: { apikey: SUPABASE_ANON_KEY } }
      );
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.slug) {
        setKnowledgeSlug(data[0].slug);
        setScreen(SCREENS.KNOWLEDGE);
        return;
      }
    } catch {}
    // Ingen direkte match — åbn leksikon med søgeterm
    setKnowledgeSlug(q);
    setScreen(SCREENS.KNOWLEDGE);
  };

  // Sektionerne bor i ResultSections.jsx og får den beregnede tilstand som ctx.
  const ctx = {
    ChoiceCategory, ChoiceRow, activeENumbers, activeList, activeListId, addToList,
    addedToList, buildAllergyChoiceRows, buildDietChoiceRows, buildENumberChoiceRows, cannotAssess, findings,
    hasIngredientsText, infantProfiles, infantWarnings, isFavorite, isMultiProfile, lists,
    liveDanger, liveWarning, overallHeadline, overallStatus, profileResults, recalls,
    scanResult, setAddedToList, setEditIngText, setEditNote, setEditStep, setEditType,
    setKnowledgeSlug, setScreen, setShowListPicker, setUnknownOpen, shoppingList, soloProfile,
    toggleFavorite, toggleItem, topStatus, unknownOpen, verdictHeadingRef, confirmAddOpen, setConfirmAddOpen, reasonsOpen, setReasonsOpen, greenOpen, setGreenOpen,
  };
  const { handleAddToList, chooseListForAdd, openContribution, renderDineValg, renderAddToList, renderMissingData, renderProductHero, renderPersonOverview, renderOtherAllergens, renderENumbers, renderNutrition } = makeResultSections(ctx);

  return (
    <div className="screen fade-in result-page" style={navH ? { paddingBottom: navH + 20 } : undefined}>

      {/* Tilbage til søgningen på indkøbslisten, når produktet blev åbnet derfra */}
      {searchBack && (
        <button type="button" onClick={() => { setNewItemName?.(searchBack.query); clearSearchReturn(); setScreen(SCREENS.LIST); }}
          style={{ display:"inline-flex", alignItems:"center", gap:4, background:"none", border:"none", padding:"6px 4px 10px 0", margin:0, cursor:"pointer", fontFamily:"var(--f)", fontSize:14, fontWeight:700, color:"var(--green)", minHeight:44 }}>
          <Icon name="chevronLeft" size={16} color="var(--green)" /> Tilbage til søgning
        </button>
      )}

      {/* Demo-banner — kun for "Prøv en demo-scanning" på HOME, aldrig et rigtigt scan */}
      {scanResult.isDemo && (
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"var(--blue-lt)", border:"1px solid var(--blue-md)", borderRadius:10, padding:"8px 12px", marginBottom:10 }}>
          <Icon name="zap" size={13} color="var(--blue)" />
          <span style={{ fontSize:11, fontWeight:700, color:"var(--blue)" }}>Demo — dette er ikke et rigtigt scan, men viser hvordan resultatet ser ud for dig</span>
        </div>
      )}

      {/* F2-6: uden net vises et resultat gemt på telefonen; neutral information, ikke en fejl */}
      {scanResult.offlineSavedAt && (
        <StateBox icon="wifiOff" title="Gemte produktdata"
          text={`Dette resultat er gemt på din telefon fra ${new Date(scanResult.offlineSavedAt).toLocaleDateString("da-DK", { day:"numeric", month:"long" })} og kan være ændret siden.`} />
      )}

      {/* ── 1. PRODUKT — verdikten sidder nu som en ramme + strimmel på selve kortet ── */}
      {renderProductHero()}

      {/* F1-1: tilbagekaldelse fra Fødevarestyrelsen, lige under produktet */}
      {recalls.length > 0 && <RecallNotice recalls={recalls} />}

      {/* Kan ikke vurderes: hjælp med de manglende oplysninger er den vigtigste handling, og indkøbslisten bliver sekundær nederst */}
      {cannotAssess && renderMissingData()}
      {!cannotAssess && renderAddToList()}
      {confirmAddOpen && (
        <ConfirmDialog
          title="Produktet indeholder noget, du har valgt at undgå. Vil du stadig tilføje det?"
          confirmLabel="Tilføj alligevel"
          danger={false}
          onConfirm={() => { setConfirmAddOpen(false); handleAddToList(true); }}
          onCancel={() => setConfirmAddOpen(false)}
        />
      )}
      {showListPicker && (
        <ListPickerSheet lists={lists} onChoose={chooseListForAdd} onCancel={() => setShowListPicker(false)} />
      )}

      {/* ── 2. PER-PERSON-OVERBLIK, SMÅBØRN, PRODUKTETS EGNE TAGS ── */}
      {renderPersonOverview()}

      {/* ── 3. DINE VALG — én samlet, neutral forklaring på konklusionen
          ovenfor (FORBEDR PRODUKTSIDEN, 28. sept. 2026). Erstatter de
          tidligere separate "Relevant for dig"- og "Passer til dine
          kostpræferencer"-sektioner, som gentog samme konklusion to/tre
          steder på siden. ── */}
      {renderDineValg()}

      {/* ── 1b. SIKRE ALTERNATIVER ── */}
      {!cannotAssess && (scanResult.status === "danger" || scanResult.status === "warn") && (
        <div style={UI.mb10}>
          {altLoading && (
            <div style={UI.udflex_aicenter_g10_p12px14px_bgsurface_bd1pxsolid_br12}>
              <div style={UI.uw16_h16_bd2pxsolid_borgreen_br50_anspin7sli_shr0} />
              <div style={UI.muted13}>Finder alternativer…</div>
            </div>
          )}
          {!altLoading && safeAlternatives.length > 0 && (
            <div className="card" style={{ marginBottom:0 }}>
              <div style={{ marginBottom:10 }}>
                <div className="card-lbl" style={{ marginBottom:2 }}>Prøv disse i stedet</div>
                <div style={UI.muted11mt1}>Ingen registrerede konflikter for din profil · lignende produkt. Tjek altid emballagen.</div>
              </div>
              <div style={UI.colGap8}>
                {(altExpanded ? safeAlternatives : safeAlternatives.slice(0, ALT_VISIBLE)).map(p => (
                  <button type="button" key={p.ean} onClick={() => lookupProduct?.(p.ean, { via: "search" })}
                    aria-label={`Åbn ${productDisplayName(p)}`}
                    style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"6px 10px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, cursor:"pointer", textAlign:"left", fontFamily:"var(--f)", minHeight:52 }}>
                    <ProductImage product={p} size={36} height={44} />
                    <div style={UI.flexMin}>
                      <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", lineHeight:1.3, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden", overflowWrap:"anywhere" }}>{p.name}</div>
                      {p.brand && <div style={{ fontSize:11, color:"var(--muted)", marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.brand}</div>}
                      <div style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, fontWeight:700, color:"var(--green)", marginTop:2 }}><Icon name="check" size={11} color="var(--green)" /> {STATUS_TEXT.safe}</div>
                    </div>
                    <Icon name="chevronRight" size={14} color="var(--muted)" />
                  </button>
                ))}
              </div>
              {safeAlternatives.length > ALT_VISIBLE && (
                <button type="button" onClick={() => setAltExpanded(o => !o)} aria-expanded={altExpanded}
                  style={{ display:"block", margin:"8px auto 0", background:"none", border:"none", padding:"6px 8px", cursor:"pointer", fontFamily:"var(--f)", fontSize:12.5, fontWeight:700, color:"var(--muted)" }}>
                  {altExpanded ? "Vis færre" : "Se flere alternativer"}
                </button>
              )}
            </div>
          )}
          {!altLoading && safeAlternatives.length === 0 && (scanResult.status === "danger" || scanResult.status === "warn") && (
            <div style={UI.udflex_aicenter_g10_p12px14px_bgsurface_bd1pxsolid_br12}>
              <Icon name="search" size={16} color="var(--muted)" />
              <div style={UI.ufs12_cmuted_lh15}>
                Vi kunne ikke finde relevante alternativer med tilstrækkelige produktoplysninger.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 4. ANDRE DEKLAREREDE ALLERGENER — ikke relevante for brugeren
          selv, rent informativt. ── */}
      {scanResult.allergen_flags && renderOtherAllergens()}

      {/* ── 5. INGREDIENSLISTE ── (skjult uden data, når kortet "Ingrediensliste mangler" allerede står øverst) */}
      {!(cannotAssess && !hasIngredientsText) && (
      <div className="card">
        <div className="card-lbl">Ingrediensliste</div>
        {scanResult.ingredients ? (
          <div>
            <div style={{ padding:"12px", background:"var(--paper2)", borderRadius:8, marginBottom:8 }}>
              <IngredientsList text={scanResult.ingredients}
                highlightRules={ingredientHighlightRules}
                onHighlightTap={onIngredientHighlightTap}
                onIngredientTap={handleIngredientTap} />
            </div>
            {(ingredientHighlightRules.length > 0 || /\bE[\s-]?\d{3,4}[a-z]?\b/i.test(scanResult.ingredients)) && (
              <div style={{ fontSize:10, color:"var(--muted)", padding:"6px 8px", background:"var(--paper2)", borderRadius:6, lineHeight:1.4 }}>
                Tryk på markerede ingredienser og E-numre for at læse mere.
              </div>
            )}
            {customAllerg?.length > 0 && (
              <div style={{ fontSize:10, color:"var(--muted)", padding:"6px 8px", marginTop:6, background:"var(--paper2)", borderRadius:6, lineHeight:1.4 }}>
                Dine egne tilføjede allergier tjekkes via fritekstsøgning her i ingredienslisten — det kan være sværere for os at fange end vores faste allergener. Sig endelig til hvis vi overser noget — vi udvider løbende vores allergen-liste.
              </div>
            )}
          </div>
        ) : (
          <div style={{ paddingTop:4 }}>
            <div style={UI.ufs13_cmuted2_mb8}>Vi mangler ingredienslisten for dette produkt.</div>
            <button className="btn btn-outline btn-sm"
              onClick={() => openContribution("ingredients")}>
              Indsend ingrediensliste
            </button>
          </div>
        )}
      </div>
      )}

      {/* ── 5b. E-NUMRE I PRODUKTET (fuld liste, uændret) ── */}
      {scanResult.productENumbers?.length > 0 && renderENumbers()}

      {/* ── 6. NÆRINGSINDHOLD — skjules helt hvis der ikke er brugbare data
          (krav 10/13), ikke længere en "hjælp os"-prompt. ── */}
      {renderNutrition()}

      {cannotAssess && renderAddToList(true)}

      {/* ── 7. ÉN SAMLET SIKKERHEDSDISCLAIMER (krav 11) — den eneste faste
          disclaimer på siden. Placeret her, umiddelbart før "Ret forkerte
          data", som krævet. ── */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"12px 14px", marginBottom:10, background:"var(--paper2)", borderRadius:10 }}>
        <span style={{ flexShrink:0, marginTop:1, display:"inline-flex" }}><Icon name="info" size={13} color="var(--muted)" /></span>
        <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5 }}>
          EatSafe er vejledende. Kontrollér altid produktets aktuelle ingrediens- og allergenoplysninger.
        </div>
      </div>

      {/* ── 8. RET DATA — mindre vigtig handling, holdt nederst. Ikke relevant
          for demo-scanningen, som ikke er et rigtigt produkt i databasen. ── */}
      {!scanResult.isDemo && (
        <div style={UI.mb10}>
          <button className="btn btn-outline btn-sm btn-full"
            onClick={() => openContribution("correct", "start")}>
            Ret forkerte data
          </button>
        </div>
      )}

    </div>
  );
}
