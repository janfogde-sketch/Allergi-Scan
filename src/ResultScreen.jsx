// @ts-nocheck
import React from "react";
import { ALLERGENS, SCREENS, E_NUMBERS, DIETS, SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { compareENumbers, checkDietCompatibility, verifiedBadge, makeHeaders, productDisplayName, buildActiveProfileList, computeProfileResults, findActiveListMatch, categorizeProductFindings, computeTopStatus } from "./helpers.js";
import { ALLERGEN_KEYWORDS } from "./allergenKeywords.js";
import { Icon, IngredientsList, ProductImage, SafetyRow, ListPickerSheet, showToast } from "./SharedComponents.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useHistoryContext } from "./HistoryContext.jsx";
import { useShoppingContext } from "./ShoppingContext.jsx";
import { UI } from "./styleUtils.js";

const S = {
  flex1:    { flex:1 },
  mb10:     { marginBottom:10 },
  h13b:     { fontSize:13, fontWeight:700, color:"var(--ink)" },
  sub11:    { fontSize:11, color:"var(--muted)" },
  opacity6: { opacity:.6 },
};

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
  const { family, allergens, customAllerg, activeProfiles } = useProfileContext();
  const { setScreen } = useNavigationContext();
  const { isFavorite, toggleFavorite } = useHistoryContext();
  const { lists, activeList, activeListId, addToList, shoppingList, toggleItem } = useShoppingContext();
  const [addedToList, setAddedToList] = React.useState(false);
  const [showListPicker, setShowListPicker] = React.useState(false);
  const [listMatchDismissed, setListMatchDismissed] = React.useState(false);
  const [listMatchConfirmed, setListMatchConfirmed] = React.useState(false);
  // Nulstil "tilføjet"-kvitteringen når man ser et nyt produkt — ResultScreen
  // forbliver monteret på tværs af scanninger, kun scanResult skifter.
  React.useEffect(() => { setAddedToList(false); setShowListPicker(false); setListMatchDismissed(false); setListMatchConfirmed(false); }, [scanResult?.code]);
  if (!scanResult) return null;

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
  const profileResults = computeProfileResults(resultProfilesRaw, {
    allergen_flags: scanResult.allergen_flags,
    ingredients: scanResult.ingredients,
    nutrition: scanResult.nutrition,
    productENumbers: scanResult.productENumbers,
  });

  const isMultiProfile = profileResults.length > 1;
  const overallStatus = !isMultiProfile ? scanResult.status
    : profileResults.some(r => r.status === "danger") ? "danger"
    : profileResults.some(r => r.status === "warn") ? "warn"
    : "safe";
  // "Kan ikke afgøres sikkert for alle" indeholdt ordet "sikkert" — undgået
  // konsekvent på tværs af hele denne skærm (FINAL PRODUCT RESULT PAGE,
  // krav 1: brug aldrig "sikkert"/"100% sikkert"/"allergifrit"/"garanteret").
  const overallHeadline = !isMultiProfile ? scanResult.headline
    : overallStatus === "safe" ? "Passer til alle"
    : overallStatus === "danger" ? "Passer ikke til alle"
    : "Kan ikke bekræftes for alle";

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
  const findings = categorizeProductFindings({
    matchedDanger: scanResult.matchedDanger,
    matchedWarning: scanResult.matchedWarning,
    customAllergenMatches: scanResult.customAllergenMatches,
    matchedENumbers: matchedENumbersForUser,
    dietResults,
  });
  // "Utilstrækkelige data" (krav 2F) — enten mangler brugerens EGNE aktive
  // allergener klassifikation (scanResult.hasUnknown, allerede beregnet i
  // useProduct.js), eller produktet har hverken allergen-flags eller en
  // ingrediensliste overhovedet at kontrollere noget som helst imod.
  const hasAnyAllergenData = scanResult.allergen_flags && Object.values(scanResult.allergen_flags).some(v => v === "yes" || v === "no" || v === "traces");
  const hasIngredientsText = !!(scanResult.ingredients && scanResult.ingredients.trim());
  const hasSufficientData = !scanResult.hasUnknown && (hasAnyAllergenData || hasIngredientsText);
  const topStatus = computeTopStatus({ hasSufficientData, ...findings });

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
      reason: m.severity === "traces" ? `Kan indeholde spor af ${m.label} — du er allergisk.` : `Matcher din valgte ${m.label}-allergi.`,
    })),
    ...findings.intoleranceMatches.map(m => ({
      keywords: ALLERGEN_KEYWORDS[m.id] || [m.label],
      category: "intolerance", label: m.label,
      reason: m.severity === "traces" ? `Kan indeholde spor af ${m.label}.` : `Matcher din valgte ${m.label}.`,
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
  // Undtagelsen fra "fremhævet = kun relevant for dig": hvis SLET INGEN af
  // fundene ovenfor findes, men der er ukendte/ikke-relevante allergener i
  // produktet (den eksisterende, adskilte "Andre allergener i produktet"-
  // sektion nedenfor dækker det tilfælde separat) — ingrediens-listen
  // fremhæver da simpelthen intet, hvilket er korrekt (intet ER relevant).
  const allHighlightsAreAllergyOnly = ingredientHighlightRules.length > 0 && ingredientHighlightRules.every(r => r.category === "allergy");
  const onIngredientHighlightTap = (rule) => showToast(`${rule.label} — ${rule.reason}`, "info");

  const handleAddToList = () => {
    if (lists.length > 1) { setShowListPicker(true); return; }
    addToList({ name: productDisplayName({ name: scanResult.name, brand: scanResult.brand }), ean: scanResult.code, id: scanResult.id, image_url: scanResult.image_url }, activeListId)
      .then(ok => { if (ok) setAddedToList(true); });
  };
  const chooseListForAdd = (listId) => {
    setShowListPicker(false);
    addToList({ name: productDisplayName({ name: scanResult.name, brand: scanResult.brand }), ean: scanResult.code, id: scanResult.id, image_url: scanResult.image_url }, listId)
      .then(ok => { if (ok) setAddedToList(true); });
  };

  // ── Scan-integration: matcher det scannede produkt en umarkeret vare på
  // den aktive indkøbsliste? (25. sept. 2026, brugerfeedback) — kun et
  // diskret forslag, ALDRIG en automatisk markering; kræver et eksplicit
  // klik fra brugeren (se knappen nedenfor). Skjules resten af visningen
  // af dette scan-resultat, hvis brugeren enten bekræfter eller afviser.
  const listMatch = (!listMatchDismissed && !listMatchConfirmed) ? findActiveListMatch(shoppingList, scanResult) : null;
  const confirmListMatch = () => {
    if (!listMatch) return;
    toggleItem(listMatch.id);
    setListMatchConfirmed(true);
    showToast(`"${listMatch.name}" markeret som købt`, "success");
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
      reason: "Produktet indeholder over 1,5g salt per 100g. Høj saltindhold er ikke anbefalet til småbørn.",
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

  const renderProductHero = () => {
    const vb = verifiedBadge(scanResult.verified_status, scanResult.source);
    const fav = isFavorite(scanResult.code);
    // Verdikt smeltet ind i selve produktkortet — en farvet ramme om hele kortet plus
    // en strimmel øverst med ikon + status, i stedet for en selvstændig boks under
    // kortet der bare gentog det samme. Se SECURITY/DESIGN-diskussion i PR'en for baggrund.
    //
    // FINAL PRODUCT RESULT PAGE (28. sept. 2026) — ved ÉN aktiv profil
    // bruges nu den dynamiske, kategoriserede `topStatus` (allergi →
    // intolerance → E-nummer → diæt → utilstrækkelige data → ingen fund) i
    // stedet for scanResult.status/headline, som kun kendte tre tilstande
    // og kunne kalde et produkt "Sikkert produkt" alene fordi der ikke var
    // et match — uden at skelne fra reelt manglende data. Ved FLERE aktive
    // profiler bruges fortsat den eksisterende, samlede tre-tilstands-status
    // (overallStatus/overallHeadline) — per-profil-detaljer vises separat
    // nedenfor (renderSafetyDiet).
    const verdictColor = isMultiProfile
      ? ({ danger:"var(--red)", warn:"var(--amber)", safe:"var(--green)" }[overallStatus] || "var(--green)")
      : ({ danger:"var(--red)", warn:"var(--amber)", safe:"var(--green)", unknown:"var(--neutral)" }[topStatus.level] || "var(--green)");
    const verdictIcon = isMultiProfile ? (overallStatus === "safe" ? "check" : "warning") : topStatus.icon;
    const headlineText = isMultiProfile ? overallHeadline : topStatus.headline;
    // Konkrete navne under headline (krav B/C/D — "Mælk · Æg · Soja") — kun
    // ved én aktiv profil, hvor topStatus.names allerede er de præcise fund.
    const namesLine = !isMultiProfile && topStatus.names?.length > 0 ? topStatus.names.join(" · ") : null;
    const sourceInfoText = scanResult.source === "producer" || scanResult.verified_status === "verified"
      ? "Produktdata kommer direkte fra producenten eller en verificeret kilde."
      : scanResult.source === "off" || scanResult.source === "open_food_facts"
      ? "Produktdata kommer fra Open Food Facts, en åben, community-drevet database — kan være ufuldstændig."
      : "Produktdata er indsendt af en bruger og kan være ufuldstændige eller ændret siden indsendelsen.";
    return (
      <div className="product-hero" style={{ position:"relative", border:`2px solid ${verdictColor}` }}>
        {/* Favorit/del — nu rigtige flex-børn af banneret (eller af en tilsvarende
            strimmel når der undtagelsesvist ingen headline er), i stedet for
            absolut positioneret hen over en højde vi gættede på. Banneret er
            gjort lidt højere, så de større knapper har plads til at sidde pænt. */}
        <div style={{ padding:"12px 14px", background: headlineText ? verdictColor : "var(--surface2)", color: headlineText ? "#fff" : "var(--ink)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
              {headlineText && <><Icon name={verdictIcon} size={13} color="#fff" />
              <span style={UI.ufs12_fw800_ls01em_ttuppercas}>{headlineText}</span></>}
            </div>
            <div style={{ display:"flex", gap:8, flexShrink:0 }}>
              <button aria-label={fav ? "Fjern favorit" : "Tilføj favorit"} onClick={() => toggleFavorite(scanResult)}
                style={{ ...UI.uw32_h32_br50_bgrgba2552_bdnone_curpointer_dflex_aicenter_jc, width:36, height:36 }}>
                <Icon name="heart" size={16} color={fav ? "var(--red)" : "var(--ink2)"} />
              </button>
              <button aria-label="Del produkt" onClick={() => { if(navigator.share) navigator.share({ title:scanResult.name, text:headlineText }); }}
                style={{ ...UI.uw32_h32_br50_bgrgba2552_bdnone_curpointer_dflex_aicenter_jc, width:36, height:36 }}>
                <Icon name="share" size={16} color="var(--ink2)" />
              </button>
            </div>
          </div>
          {namesLine && (
            <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginTop:6 }}>{namesLine}</div>
          )}
          {!isMultiProfile && topStatus.level === "safe" && (
            <div style={{ fontSize:11.5, color:"rgba(255,255,255,.9)", marginTop:4, lineHeight:1.4, fontWeight:500 }}>
              Vi fandt ingen match med dine valgte allergier, intolerancer eller øvrige ting, du undgår.
            </div>
          )}
          {!isMultiProfile && topStatus.level === "unknown" && (
            <div style={{ fontSize:11.5, color:"var(--ink2)", marginTop:4, lineHeight:1.4, fontWeight:500 }}>
              Vi mangler produktdata og kan derfor ikke kontrollere alle dine præferencer.
            </div>
          )}
        </div>
        <div>
          {scanResult.image_url
            ? <div className="product-hero-imgwrap">
                <img aria-hidden="true" alt="" loading="lazy" src={scanResult.image_url} className="product-hero-img-backdrop" />
                <img loading="lazy" src={scanResult.image_url} alt={scanResult.name} className="product-hero-img"
                  onError={e => { const wrap = e.target.closest(".product-hero-imgwrap"); wrap.style.display="none"; wrap.nextSibling.style.display="flex"; }} />
              </div>
            : null}
          <div className="product-hero-img-placeholder"
            style={{ display: scanResult.image_url ? "none" : "flex", flexDirection:"column", gap:8, background:"var(--paper2)", borderRadius:12, padding:20, margin:"0 0 10px" }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--border2)" strokeWidth="1.5">
              <rect x="4" y="10" width="40" height="30" rx="3"/>
              <circle cx="16" cy="20" r="4"/>
              <path strokeLinecap="round" d="M4 34l10-8 8 6 6-4 16 12"/>
            </svg>
            <div style={UI.ufs11_cmuted_fw500}>Ingen produktbillede</div>
          </div>
        </div>

        <div className="product-hero-body">
          <div className="product-hero-name">{scanResult.name}</div>
          {scanResult.brand && <div className="product-hero-brand">{scanResult.brand}</div>}
          <div className="product-hero-meta">
            <span style={{ fontSize:10, color:"var(--muted)", fontWeight:500 }}>EAN: {scanResult.code}</span>
            {/* Datakilde — samme genbrugelige verifiedBadge()-komponent for
                alle tre kilder (bruger-indsendt/Open Food Facts/producent),
                nu med et tappeligt info-ikon der forklarer hvad kilden
                betyder (krav 5) — samme komponent kan senere vise en fjerde
                kilde uden at selve produktsiden skal ændres. */}
            <span
              onClick={() => showToast(sourceInfoText, "info")}
              style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:10, fontWeight:700, padding:"2px 10px", borderRadius:20, background:vb.bg, color:vb.color, border:`1px solid ${vb.dot}22`, cursor:"pointer" }}>
              <span style={{ width:5, height:5, borderRadius:"50%", background:vb.dot, flexShrink:0, display:"inline-block" }} />
              {vb.label}
              <Icon name="info" size={10} color={vb.color} />
            </span>
            {scanResult.verified_status === "pending" && (
              <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 10px", borderRadius:20, background:"var(--amber-lt)", border:"1px solid rgba(251,191,36,.3)", fontSize:10, fontWeight:700, color:"var(--amber)" }}>
                ⏳ Afventer godkendelse
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Per-person-oversigt (multi-profil) + småbørn-advarsler + produktets
  // egne selv-deklarerede tags (fx "vegansk" sat af producenten selv — IKKE
  // en beregning mod brugerens præferencer, se renderDietPreferences for
  // den). Findings/E-numre/diæt-matches mod BRUGERENS præferencer er
  // flyttet til de nye, dedikerede renderRelevantForYou()/
  // renderDietPreferences() nedenfor (FINAL PRODUCT RESULT PAGE, krav 3/7).
  const renderPersonOverview = () => {
    const tagLabels = { vegan:"Vegansk", vegetarian:"Vegetarisk", "palm-oil-free":"Uden palmeolie", "gluten-free":"Glutenfri", organic:"Økologisk" };
    const hasTags = scanResult.tags && scanResult.tags.length > 0;
    if (!isMultiProfile && infantWarnings.length === 0 && !hasTags) return null;

    return (
      <div style={S.mb10}>
        {/* Per-person-oversigt — kun relevant når der er nogen at sammenligne
            på tværs af. Med kun "Dig" aktiv gentager den bare verdikt-
            banneret ovenfor. Enkelt-kolonne-liste (25. sept. 2026,
            brugerfeedback), ikke det tidligere 2-kolonne-grid — hver linje
            viser navn + status + ALLE fundne årsager (allergener,
            kostpræferencer, overvågede E-numre), ikke kun den første. */}
        {isMultiProfile && (
        <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom: hasTags ? 8 : 0 }}>
          {profileResults.map((p) => (
            <SafetyRow key={p.id}
              name={p.id==="me" ? "Dig" : p.name}
              status={p.status}
              statusText={p.reasons.length > 0 ? p.reasons.join(" · ") : "Matcher profilen"}
              onClick={(p.danger.length > 0 || p.warning.length > 0) ? () => {
                const first = [...p.danger, ...p.warning][0];
                setKnowledgeSlug(first); setScreen(SCREENS.KNOWLEDGE);
              } : undefined}
            />
          ))}
        </div>
        )}

        {/* ── Småbørn-advarsler ── */}
        {infantWarnings.length > 0 && (
          <div style={{ padding:"10px 12px", marginBottom:6, background:"var(--amber-lt)", border:"1px solid var(--amber-md)", borderRadius:10 }}>
            <div style={{ fontSize:11, fontWeight:800, color:"var(--amber)", marginBottom:6, display:"flex", alignItems:"center", gap:6 }}>
              <span>🍼</span>
              Advarsel for småbørn — {infantProfiles.map(m => m.name?.split(" ")[0]).join(", ")} (under 3 år)
            </div>
            <div style={UI.udflex_fdcolumn_g4}>
              {infantWarnings.map(w => (
                <div key={w.id} style={{ fontSize:11, color:"var(--amber)", lineHeight:1.5 }}>
                  <strong>{w.label}:</strong> {w.reason}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Produktets EGNE selv-deklarerede tags (fx sat af producenten) */}
        {hasTags && (
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", padding:"8px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12 }}>
            {scanResult.tags.map((tag, i) => (
              <span key={i} style={{ fontSize:11, fontWeight:700, color:"var(--green)", background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:100, padding:"2px 10px" }}>
                {tagLabels[tag] || tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── "Relevant for dig" (krav 3) ─────────────────────────────────────────
  // Samlet oversigt over ALLE fund på tværs af kategorier, opdelt og
  // prioriteret allergi → intolerance/følsomhed → E-nummer → kostpræference
  // — ikke reduceret til én uklar status. Kun ved ÉN aktiv profil (ved
  // flere profiler dækker per-person-listen ovenfor allerede hver persons
  // egne fund separat, med samme prioritering internt).
  const renderRelevantForYou = () => {
    if (isMultiProfile) return null;
    const { allergyMatches, intoleranceMatches, customMatches, eNumberMatches, dietFails } = findings;
    const hasAny = allergyMatches.length > 0 || customMatches.length > 0 || intoleranceMatches.length > 0 || eNumberMatches.length > 0 || dietFails.length > 0;
    if (!hasAny) return null;

    const Group = ({ color, bg, title, children }) => (
      <div style={{ padding:"8px 12px", marginBottom:6, background:bg, border:`1px solid ${color==="var(--red)"?"var(--red-md)":"var(--amber-md)"}`, borderRadius:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, fontWeight:800, color, marginBottom:4 }}>
          <Icon name="warning" size={12} color={color} /> {title}
        </div>
        <div style={UI.wrapGap4}>{children}</div>
      </div>
    );
    const Chip = ({ color, bg, onClick, children }) => (
      <span onClick={onClick}
        style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:6, background:bg, color, border:`1px solid ${color==="var(--red)"?"var(--red-md)":"var(--amber-md)"}`, cursor: onClick ? "pointer" : "default", display:"inline-flex", alignItems:"center", gap:4 }}>
        {children}{onClick && <span style={UI.ufs9_op06}>›</span>}
      </span>
    );

    return (
      <div style={S.mb10}>
        <div className="card-lbl" style={{ marginLeft:2 }}>Relevant for dig</div>
        {(allergyMatches.length > 0 || customMatches.length > 0) && (
          <Group color="var(--red)" bg="var(--red-lt)" title="Allergier">
            {customMatches.map(m => (
              <Chip key={m.id} color="var(--red)" bg="var(--red-lt)">✏️ {m.label}</Chip>
            ))}
            {allergyMatches.map(m => (
              <Chip key={m.id} color="var(--red)" bg="var(--red-lt)" onClick={() => { setKnowledgeSlug(m.id); setScreen(SCREENS.KNOWLEDGE); }}>
                {m.severity === "traces" ? `spor: ${m.label}` : m.label}
              </Chip>
            ))}
          </Group>
        )}
        {intoleranceMatches.length > 0 && (
          <Group color="var(--amber)" bg="var(--amber-lt)" title="Intolerancer / følsomheder">
            {intoleranceMatches.map(m => (
              <Chip key={m.id} color="var(--amber)" bg="var(--amber-lt)" onClick={() => { setKnowledgeSlug(m.id); setScreen(SCREENS.KNOWLEDGE); }}>
                {m.severity === "traces" ? `spor: ${m.label}` : m.label}
              </Chip>
            ))}
          </Group>
        )}
        {eNumberMatches.length > 0 && (
          <Group color="var(--amber)" bg="var(--amber-lt)" title="E-numre du undgår">
            {eNumberMatches.map(e => (
              <Chip key={e} color="var(--amber)" bg="var(--amber-lt)" onClick={() => { const slug = "e-" + e.toLowerCase().replace("e",""); setKnowledgeSlug(slug); setScreen(SCREENS.KNOWLEDGE); }}>
                {e}{E_NUMBERS[e] ? " — " + E_NUMBERS[e].split("—")[0].trim() : ""}
              </Chip>
            ))}
          </Group>
        )}
        {dietFails.length > 0 && (
          <Group color="var(--amber)" bg="var(--amber-lt)" title="Kostpræferencer">
            {dietFails.map(d => (
              <Chip key={d.id} color="var(--amber)" bg="var(--amber-lt)">
                {d.label}{d.reasons?.[0] ? ` — ${d.reasons[0]}` : ""}
              </Chip>
            ))}
          </Group>
        )}
      </div>
    );
  };

  // ── Kostpræferencer (krav 7) ─────────────────────────────────────────────
  // Omdøbt fra "Kompatibel med dine diæter" — viser ALLE brugerens/familiens
  // aktive diæter (ikke kun de der fejler, i modsætning til "Relevant for
  // dig" ovenfor), hver med ✓ (passer) / ✕ (passer ikke, + kort årsag hvis
  // data tillader det) / ? (kan ikke afgøres). Vist kun hvis der reelt er
  // aktive kostpræferencer at vise noget for. Gætter aldrig — ✕ og ? er
  // adskilte tilstande, aldrig slået sammen.
  const renderDietPreferences = () => {
    if (dietResults.length === 0) return null;
    return (
      <div className="card">
        <div className="card-lbl">Passer til dine kostpræferencer</div>
        <div style={UI.udflex_fdcolumn_g4}>
          {dietResults.map(r => (
            <div key={r.id} style={{ display:"flex", alignItems:"flex-start", gap:6, fontSize:12.5 }}>
              <Icon name={r.ok === true ? "check" : r.ok === false ? "x" : "info"} size={13}
                color={r.ok === true ? "var(--green)" : r.ok === false ? "var(--amber)" : "var(--muted)"} />
              <span style={{ color: r.ok === true ? "var(--ink)" : r.ok === false ? "var(--ink)" : "var(--muted)" }}>
                <strong>{r.label}</strong>
                {r.ok === false && r.reasons?.[0] && <span style={{ color:"var(--muted2)" }}> — {r.reasons[0]}</span>}
                {r.ok === null && <span> – kan ikke afgøres ud fra de tilgængelige oplysninger</span>}
                {r.confidence === "low" && r.ok !== null && <span style={S.opacity6}> (usikker)</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderOtherAllergens = () => {
    const flags = scanResult.allergen_flags;
    const present = Object.entries(flags).filter(([k,v]) => v==="yes"    && ALLERGENS.find(a=>a.id===k));
    const traces  = Object.entries(flags).filter(([k,v]) => v==="traces" && ALLERGENS.find(a=>a.id===k));
    const myAllergens  = new Set([...scanResult.matchedDanger||[], ...scanResult.matchedWarning||[]]);
    const otherPresent = present.filter(([k]) => !myAllergens.has(k));
    const otherTraces  = traces.filter(([k])  => !myAllergens.has(k));
    if (!otherPresent.length && !otherTraces.length) return null;
    return (
      <div className="card">
        <div className="card-lbl">Andre allergener i produktet</div>
        <div style={UI.ufs11_cmuted_mb8}>Ikke registreret på dine profiler</div>
        {otherPresent.length > 0 && (
          <div className="tags" style={UI.mb6}>
            {otherPresent.map(([k]) => {
              const a = ALLERGENS.find(x=>x.id===k);
              return a ? (
                <div key={k} className="tag"
                  onClick={() => { setScreen(SCREENS.KNOWLEDGE); setKnowledgeSlug(k); }}
                  style={{ background:"var(--surface2)", color:"var(--ink)", borderColor:"var(--border2)", cursor:"pointer" }}>
                  {a.emoji} {a.label} <span style={UI.ufs9_op06}>›</span>
                </div>
              ) : null;
            })}
          </div>
        )}
        {otherTraces.length > 0 && (
          <div className="tags">
            {otherTraces.map(([k]) => {
              const a = ALLERGENS.find(x=>x.id===k);
              return a ? (
                <div key={k} className="tag"
                  onClick={() => { setScreen(SCREENS.KNOWLEDGE); setKnowledgeSlug(k); }}
                  style={{ background:"var(--surface)", color:"var(--muted)", borderColor:"var(--border2)", cursor:"pointer" }}>
                  spor: {a.emoji} {a.label} <span style={UI.ufs9_op06}>›</span>
                </div>
              ) : null;
            })}
          </div>
        )}
      </div>
    );
  };

  const renderENumbers = () => {
    const eNums = scanResult.productENumbers;
    return (
      <div className="card">
        <div style={UI.udflex_aicenter_jcspacebet_mb8}>
          <div className="card-lbl" style={{ marginBottom:0 }}>E-numre i produktet</div>
          <div style={UI.muted10}>{eNums.length} fundet</div>
        </div>
        <div style={UI.wrapGap5}>
          {eNums.map(e => {
            const info = E_NUMBERS[e];
            const name = info ? info.split("—")[0].trim() : null;
            const isWatched = activeENumbers?.includes(e);
            return (
              <span key={e}
                onClick={() => {
                  const slug = "e-" + e.toLowerCase().replace(/^e/, "");
                  setKnowledgeSlug(slug);
                  setScreen(SCREENS.KNOWLEDGE);
                }}
                style={{
                  display:"inline-flex", alignItems:"center", gap:4,
                  fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:8,
                  cursor:"pointer", transition:"all .1s",
                  background: isWatched ? "var(--amber-lt)" : "var(--paper2)",
                  color: isWatched ? "var(--amber)" : "var(--ink2)",
                  border: `1px solid ${isWatched ? "var(--amber-md)" : "var(--border2)"}`,
                }}>
                <span style={UI.uffmonospac}>{e}</span>
                {name && <span style={{ fontWeight:400, color: isWatched ? "var(--amber)" : "var(--muted)" }}>— {name.slice(0,20)}{name.length>20?"…":""}</span>}
                {isWatched && <Icon name="warning" size={10} color="var(--amber)" />}
                <span style={{ fontSize:9, opacity:.5 }}>›</span>
              </span>
            );
          })}
        </div>
        <div style={UI.ufs10_cmuted_mt8}>
          Tryk på et E-nummer for at læse mere i leksikonet
        </div>
      </div>
    );
  };

  // FINAL PRODUCT RESULT PAGE, krav 10 — dynamisk enhed i stedet for et
  // hardkodet "pr. 100g" for alle produkter. Der findes intet eksplicit
  // enheds-felt i produktdataen endnu, så enheden udledes forsigtigt af
  // produktets EGEN kategori-tekst (data-drevet, ikke en fast konstant) —
  // rammer ikke perfekt hver gang, men er langt mere korrekt end at antage
  // "g" for en sodavand. Kan udskiftes med et rigtigt portions-/enheds-felt
  // senere uden at ændre selve kort-layoutet (samme krav nævner dette
  // eksplicit: "kan understøttes senere uden at ændre hovedlayoutet").
  const LIQUID_CATEGORY_HINTS = ["drik","juice","vand","øl","sodavand","mælk","saft","cider","spiritus","vin","kaffe","te","smoothie","shot","nektar"];
  const nutritionUnit = LIQUID_CATEGORY_HINTS.some(h => (scanResult.category || "").toLowerCase().includes(h)) ? "100 ml" : "100 g";

  const renderNutrition = () => {
    const n = scanResult.nutrition;
    if (!n) return null;
    const rows = [
      ["Energi",          n.energy_kcal    ? `${n.energy_kcal} kcal`    : null],
      ["Fedt",            n.fat     != null ? `${n.fat} g`               : null],
      ["— heraf mættet",  n.saturated_fat != null ? `${n.saturated_fat} g` : null],
      ["Kulhydrat",       n.carbohydrates != null ? `${n.carbohydrates} g` : null],
      ["— heraf sukker",  n.sugars  != null ? `${n.sugars} g`            : null],
      ["Kostfibre",       n.fiber   != null ? `${n.fiber} g`             : null],
      ["Protein",         n.protein != null ? `${n.protein} g`           : null],
      ["Salt",            n.salt    != null ? `${n.salt} g`              : null],
    ].filter(([,v]) => v !== null);
    // Ingen brugbare næringsdata — skjul HELE sektionen (krav 10/13),
    // ikke en "hjælp os"-prompt som ved manglende ingredienser. Den
    // asymmetri er bevidst: krav 13 nævner "ingen næringsdata → skjul",
    // men "ingen ingrediensdata → vis manglende-data-status" separat.
    if (!rows.length) return null;
    return (
      <div className="card">
        <div className="card-lbl">Næringsindhold pr. {nutritionUnit}</div>
        <div style={UI.udflex_fdcolumn}>
          {rows.map(([label, value], i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom: i < rows.length-1 ? "1px solid var(--border)" : "none" }}>
              <span style={{ fontSize:13, color: label.startsWith("—") ? "var(--muted)" : "var(--ink2)", paddingLeft: label.startsWith("—") ? 12 : 0 }}>{label}</span>
              <span style={S.h13b}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="screen fade-in">

      {/* Demo-banner — kun for "Prøv en demo-scanning" på HOME, aldrig et rigtigt scan */}
      {scanResult.isDemo && (
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"var(--blue-lt)", border:"1px solid var(--blue-md)", borderRadius:10, padding:"8px 12px", marginBottom:10 }}>
          <Icon name="zap" size={13} color="var(--blue)" />
          <span style={{ fontSize:11, fontWeight:700, color:"var(--blue)" }}>Demo — dette er ikke et rigtigt scan, men viser hvordan resultatet ser ud for dig</span>
        </div>
      )}

      {/* ── 1. PRODUKT — verdikten sidder nu som en ramme + strimmel på selve kortet ── */}
      {renderProductHero()}

      <button className="btn btn-green btn-sm btn-full" onClick={handleAddToList}
        style={{ marginBottom:10, display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity: addedToList ? .7 : 1 }}>
        {addedToList ? <><Icon name="check" size={15} color="var(--on-green)" /> Tilføjet til indkøbsliste</> : <><Icon name="cart" size={15} color="var(--on-green)" /> Tilføj til indkøbsliste</>}
      </button>
      {showListPicker && (
        <ListPickerSheet lists={lists} onChoose={chooseListForAdd} onCancel={() => setShowListPicker(false)} />
      )}

      {/* ── Scan-integration: forslag om at markere en matchende vare på
          indkøbslisten som købt — diskret, kræver et eksplicit klik. ── */}
      {listMatch && (
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:10, padding:"9px 10px", marginBottom:10 }}>
          <Icon name="cart" size={14} color="var(--green)" />
          <button type="button" onClick={confirmListMatch}
            style={{ flex:1, minWidth:0, textAlign:"left", background:"none", border:"none", padding:0, cursor:"pointer", fontFamily:"var(--f)", fontSize:11.5, fontWeight:700, color:"var(--green)", lineHeight:1.4 }}>
            Matcher "{listMatch.name}" på din liste – markér som købt
          </button>
          <button type="button" aria-label="Afvis forslag" onClick={() => setListMatchDismissed(true)}
            style={{ background:"none", border:"none", cursor:"pointer", padding:4, flexShrink:0, display:"flex" }}>
            <Icon name="x" size={13} color="var(--muted)" />
          </button>
        </div>
      )}

      {/* ── 1b. SIKRE ALTERNATIVER ── */}
      {(scanResult.status === "danger" || scanResult.status === "warn") && (
        <div style={UI.mb10}>
          {altLoading && (
            <div style={UI.udflex_aicenter_g10_p12px14px_bgsurface_bd1pxsolid_br12}>
              <div style={UI.uw16_h16_bd2pxsolid_borgreen_br50_anspin7sli_shr0} />
              <div style={UI.muted13}>Finder sikre alternativer…</div>
            </div>
          )}
          {!altLoading && alternatives.length > 0 && (
            <div style={{ background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:14, padding:"14px 16px" }}>
              <div style={UI.udflex_aicenter_g8_mb12}>
                <Icon name="check" size={18} color="var(--green)" />
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:"var(--green)" }}>Prøv disse i stedet</div>
                  <div style={UI.muted11mt1}>Sikre for din profil · samme kategori</div>
                </div>
              </div>
              <div style={UI.colGap8}>
                {alternatives.map(p => (
                  <div key={p.ean} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, cursor:"pointer" }}
                    onClick={() => lookupProduct?.(p.ean)}>
                    <ProductImage product={p} size={40} />
                    <div style={UI.flexMin}>
                      <div style={UI.ufs13_fw700_cink_ovhidden_toellipsis_wsnowrap}>{p.name}</div>
                      <div style={UI.muted11mt1}>{p.brand}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, fontWeight:700, color:"var(--green)", flexShrink:0 }}><Icon name="check" size={11} color="var(--green)" /> Sikkert</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!altLoading && alternatives.length === 0 && (scanResult.status === "danger" || scanResult.status === "warn") && (
            <div style={UI.udflex_aicenter_g10_p12px14px_bgsurface_bd1pxsolid_br12}>
              <Icon name="search" size={16} color="var(--muted)" />
              <div style={UI.ufs12_cmuted_lh15}>
                Ingen kendte alternativer i samme kategori endnu.{" "}
                <span style={UI.ucgreen_fw700_curpointer}
                  onClick={() => {}}>
                  Hjælp os ved at scanne alternativer.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 2. PER-PERSON-OVERBLIK, SMÅBØRN, PRODUKTETS EGNE TAGS ── */}
      {renderPersonOverview()}

      {/* ── 3. RELEVANT FOR DIG — samlet, kategoriseret fund (krav 3) ── */}
      {renderRelevantForYou()}

      {/* ── 4. KOSTPRÆFERENCER — dedikeret, viser ALLE aktive diæter (krav 7) ── */}
      {renderDietPreferences()}

      {/* ── ANDRE ALLERGENER I PRODUKTET — ikke relevante for brugeren selv,
          rent informativt, uændret. ── */}
      {scanResult.allergen_flags && renderOtherAllergens()}

      {/* ── 5. INGREDIENSLISTE ── */}
      <div className="card">
        <div className="card-lbl">Ingrediensliste</div>
        {scanResult.ingredients ? (
          <div>
            <div style={{ padding:"10px", background:"var(--paper2)", borderRadius:8, marginBottom:8 }}>
              <IngredientsList text={scanResult.ingredients}
                highlightRules={ingredientHighlightRules}
                onHighlightTap={onIngredientHighlightTap}
                onIngredientTap={handleIngredientTap} />
            </div>
            {/* Kun ÉN, korrekt billedtekst for hvad fremhævningen betyder —
                aldrig den generiske "Fremhævet = allergen", medmindre ALT
                fremhævet reelt er en allergi (krav 8). Ved en blanding af
                kategorier, eller ingen fund overhovedet, nævnes fremhævning
                slet ikke her. */}
            {ingredientHighlightRules.length > 0 && (
              <div style={{ fontSize:10, color:"var(--muted)", padding:"6px 8px", background:"var(--paper2)", borderRadius:6, lineHeight:1.4 }}>
                {allHighlightsAreAllergyOnly ? "Fremhævet = allergen. " : "Fremhævet = relevant for dig. "}
                Tryk for en kort forklaring. Listen kan være på originalsprog.
              </div>
            )}
            {customAllerg?.length > 0 && (
              <div style={{ fontSize:10, color:"var(--muted)", padding:"6px 8px", marginTop:6, background:"var(--paper2)", borderRadius:6, lineHeight:1.4 }}>
                Dine egne tilføjede allergier tjekkes via fritekst-søgning her i ingredienslisten — det kan være sværere for os at fange end vores faste allergener. Sig endelig til hvis vi overser noget — vi udvider løbende vores allergen-liste.
              </div>
            )}
          </div>
        ) : (
          <div style={{ paddingTop:4 }}>
            <div style={UI.ufs13_cmuted2_mb8}>Vi mangler ingredienslisten for dette produkt.</div>
            <button className="btn btn-outline btn-sm"
              onClick={() => { setEditStep("start"); setEditIngText(scanResult?.ingredients||""); setEditNote(""); setEditType(null); setScreen(SCREENS.SUGGEST_EDIT); }}>
              Hjælp os — indsend ingrediensliste
            </button>
          </div>
        )}
      </div>

      {/* ── 5b. E-NUMRE I PRODUKTET (fuld liste, uændret) ── */}
      {scanResult.productENumbers?.length > 0 && renderENumbers()}

      {/* ── 6. NÆRINGSINDHOLD — skjules helt hvis der ikke er brugbare data
          (krav 10/13), ikke længere en "hjælp os"-prompt. ── */}
      {renderNutrition()}

      {/* ── 7. ÉN SAMLET SIKKERHEDSDISCLAIMER (krav 11) — den eneste faste
          disclaimer på siden. Placeret her, umiddelbart før "Ret forkerte
          data", som krævet. ── */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"10px 12px", marginBottom:10, background:"var(--paper2)", borderRadius:10 }}>
        <Icon name="info" size={13} color="var(--muted)" />
        <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.5 }}>
          EatSafe er vejledende. Kontrollér altid produktets aktuelle ingrediens- og allergenoplysninger.
        </div>
      </div>

      {/* ── 8. RET DATA — mindre vigtig handling, holdt nederst. Ikke relevant
          for demo-scanningen, som ikke er et rigtigt produkt i databasen. ── */}
      {!scanResult.isDemo && (
        <div style={UI.mb10}>
          <button className="btn btn-outline btn-sm btn-full"
            onClick={() => { setEditStep("start"); setEditIngText(scanResult?.ingredients||""); setEditNote(""); setEditType(null); setScreen(SCREENS.SUGGEST_EDIT); }}>
            Ret forkerte data
          </button>
        </div>
      )}

    </div>
  );
}
