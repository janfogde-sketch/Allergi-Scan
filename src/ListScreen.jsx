// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { SCREENS, SUPABASE_URL } from "./constants.jsx";
import { normalizeProductFlagsFor, productDisplayName, logSearchSelection, apiCall, makeHeaders, extractENumbers, buildActiveProfileList, computeProfileResults, profileConflictLabel, profileMatchLabel } from "./helpers.js";
import { Icon, ProductImage, SearchResultRow, ConfirmDialog, showToast } from "./SharedComponents.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useShoppingContext } from "./ShoppingContext.jsx";
import { useAllergenPrefsContext } from "./AllergenPrefsContext.jsx";
import { UI } from "./styleUtils.js";

const S = {
  flexMin: { flex:1, minWidth:0 },
  mb12:    { marginBottom:12 },
  mb10:    { marginBottom:10 },
  h13b:    { fontSize:13, fontWeight:700, color:"var(--ink)" },
  sub11:   { fontSize:11, color:"var(--muted)" },
};

function ShareSheet({ list, familyMembers, loadFamilyMembers, getListAccess, grantAccess, revokeAccess, setListType, onClose }) {
  const [access, setAccess]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [copied, setCopied]     = useState(false);

  React.useEffect(() => {
    loadFamilyMembers();
    getListAccess(list.id).then(a => { setAccess(a); setLoading(false); });
  }, [list.id]);

  const sharedIds = new Set(access.map(a => a.user_id));
  const shareLink = `https://eatsafe.dk/?join-list=${list.share_link}`;

  const toggleMember = async (memberId) => {
    if (sharedIds.has(memberId)) {
      setAccess(a => a.filter(x => x.user_id !== memberId));
      await revokeAccess(list.id, memberId);
    } else {
      setAccess(a => [...a, { user_id: memberId, permission: "edit" }]);
      await grantAccess(list.id, memberId, "edit");
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9995, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"flex-end" }}
      onClick={onClose}>
      <div style={{ background:"var(--sheet)", borderRadius:"20px 20px 0 0", padding:"20px 16px 32px", width:"100%", maxHeight:"85vh", overflowY:"auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={UI.rowBetweenMb16}>
          <div style={UI.ufs18_fw900_cink}>Del "{list.name}"</div>
          <button onClick={onClose} aria-label="Luk"
            style={{ background:"var(--surface)", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:18, color:"var(--ink)" }}>×</button>
        </div>

        {/* Hele familien */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, marginBottom:10 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, fontWeight:700, color:"var(--ink)" }}><Icon name="family" size={14} color="var(--ink)" /> Del med hele familien</div>
            <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>Alle du har inviteret til EatSafe ser og redigerer listen</div>
          </div>
          <div role="switch" aria-checked={list.type === "family"} tabIndex={0}
            onClick={() => setListType(list.id, list.type === "family" ? "personal" : "family")}
            onKeyDown={e => e.key === "Enter" && setListType(list.id, list.type === "family" ? "personal" : "family")}
            style={{ width:42, height:24, borderRadius:20, background: list.type === "family" ? "var(--green)" : "var(--border2)", position:"relative", cursor:"pointer", flexShrink:0, transition:"background .2s" }}>
            <div style={{ position:"absolute", top:2, left: list.type === "family" ? 20 : 2, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left .2s" }} />
          </div>
        </div>

        {/* Vælg personer */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>
            Eller vælg udvalgte personer
          </div>
          {/* Tydeliggørelse (25. sept. 2026, brugerfeedback) — familieprofiler
              man selv har oprettet (fx et barn) har ikke nødvendigvis deres
              egen EatSafe-konto, og kan derfor ikke inviteres/få redigerings-
              adgang til listen her. Kun listen nedenfor (personer der reelt
              har accepteret en invitation til EatSafe) kan det. */}
          <div style={{ fontSize:10.5, color:"var(--muted)", marginBottom:8, lineHeight:1.4 }}>
            Kun personer med deres egen EatSafe-konto kan få redigeringsadgang her — familieprofiler uden konto (fx et barn) deles ikke automatisk med.
          </div>
          {loading ? (
            <div style={{ fontSize:12, color:"var(--muted)" }}>Henter…</div>
          ) : familyMembers.length === 0 ? (
            <div style={{ fontSize:12, color:"var(--muted)" }}>Du har ikke inviteret nogen endnu — brug "Inviter" under Profil, eller del listen med koden nedenfor.</div>
          ) : familyMembers.map(m => (
            // padding øget til ~44px radhøjde (25. sept. 2026, brugerfeedback:
            // minimum tap-area på checkboxes/interaktive elementer) — hele
            // rækken er klikmålet, ikke kun den lille 20×20-checkboks.
            <div key={m.id} onClick={() => toggleMember(m.id)}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, marginBottom:6, cursor:"pointer" }}>
              <div style={{ fontSize:13, fontWeight:600, color:"var(--ink)" }}>{m.name || m.email}</div>
              <div style={{ width:20, height:20, borderRadius:6, border:`1.5px solid ${sharedIds.has(m.id) ? "var(--green)" : "var(--border2)"}`, background: sharedIds.has(m.id) ? "var(--green)" : "transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {sharedIds.has(m.id) && <Icon name="check" size={12} color="#fff" />}
              </div>
            </div>
          ))}
        </div>

        {/* Del med link */}
        <div style={{ padding:"14px", background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>
            Eller del med et link
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn btn-primary btn-sm" style={{ flex:1 }}
              onClick={() => { navigator.clipboard?.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
              <Icon name={copied ? "check" : "link"} size={14} color="var(--on-green)" /> {copied ? "Link kopieret" : "Kopiér link"}
            </button>
            {navigator.share && (
              <button className="btn btn-outline btn-sm"
                onClick={() => navigator.share({ title: `Indkøbsliste: ${list.name}`, url: shareLink })}>
                <Icon name="share" size={14} color="var(--ink)" /> Del
              </button>
            )}
          </div>
          <div style={{ fontSize:11, color:"var(--muted)", marginTop:8 }}>Alle med linket kan tilslutte sig og redigere listen.</div>
        </div>
      </div>
    </div>
  );
}

export default function ListScreen({
  activeIds, activeLevels,
  lookupProduct,
  onOpenHelp,
}) {
  const { user, userId, accessToken } = useAuthContext();
  // Scan-profiler = egne profiler + husstandens skrivebeskyttede konti (App.jsx, 1. okt. 2026).
  const { scanFamily: family, allergens, customAllerg, activeProfiles, setActiveProfiles } = useProfileContext();
  const { selectedENumbers } = useAllergenPrefsContext();
  const { setScreen } = useNavigationContext();
  const {
    lists, activeList, activeListId, setActiveListId,
    shoppingList, newItemName, setNewItemName, addToList, toggleItem, removeItem, clearDone,
    familyMembers, loadFamilyMembers, createList, deleteList, joinByCode,
    getListAccess, grantAccess, revokeAccess, setListType,
  } = useShoppingContext();

  const [showListPicker, setShowListPicker] = useState(false);
  const [showNewList, setShowNewList]       = useState(false);
  const [newListName, setNewListName]       = useState("");
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showJoin, setShowJoin]             = useState(false);
  const [joinCode, setJoinCode]             = useState("");
  const [joinError, setJoinError]           = useState("");
  const [joinLoading, setJoinLoading]       = useState(false);
  // Bekræft-dialoger for destruktive handlinger (25. sept. 2026,
  // brugerfeedback) — erstatter native confirm(), se ConfirmDialog i
  // SharedComponents.jsx for hvorfor. listPendingDelete holder LISTEN
  // (ikke kun dens id) så dialogens tekst kan vise det rigtige navn.
  const [listPendingDelete, setListPendingDelete] = useState(null);
  // "Rediger"-tilstand i listevælgeren — viser Slet-knapper; nulstilles
  // når vælgeren lukkes.
  const [editLists, setEditLists] = useState(false);
  const canDeleteAny = lists.length > 1 && lists.some(l => l.owner_id === userId);
  useEffect(() => { if (!showListPicker || !canDeleteAny) setEditLists(false); }, [showListPicker, canDeleteAny]);
  const [showClearDoneConfirm, setShowClearDoneConfirm] = useState(false);

  const handleToggleItem = (id, wasChecked) => {
    toggleItem(id);
    if (wasChecked) return;
    try {
      if (localStorage.getItem("as_hint_list_first_check") === "1") return;
      localStorage.setItem("as_hint_list_first_check", "1");
    } catch { /* ignoreres */ }
    showToast("Markeret som købt – ryd købte varer senere", "success");
  };

  // ── Søg blandt produkter mens der tilføjes en vare ──────────────────────────
  const [itemResults, setItemResults]   = useState([]);
  const [itemSearching, setItemSearching] = useState(false);
  const [itemFocused, setItemFocused]   = useState(false);
  // Sideinddeling — samme offset/hasMore/total-API som SearchScreens "Indlæs
  // flere", så listen ikke længere er hårdt afskåret ved den første side.
  const [itemHasMore, setItemHasMore]         = useState(false);
  const [itemTotal, setItemTotal]             = useState(0);
  const [itemLoadingMore, setItemLoadingMore] = useState(false);
  // Antal rå resultater hentet fra serveren (før filtrering af ukomplette
  // produkter), så "Indlæs flere" bruger det rigtige offset.
  const itemOffsetRef = useRef(0);
  // Produkter uden navn eller ingrediensliste vises ikke i søgningen.
  const completeOnly = (list) => (list || []).filter(p => (p.name || "").trim() && (p.ingredients_text || p.ingredients || "").trim());
  // Skjulte konflikt-produkter foldes ud manuelt af brugeren (se
  // hiddenConflictResults nedenfor) — nulstillet ved en ny søgetekst, så
  // et tidligere udfoldet resultat ikke fejlagtigt "følger med" over i en
  // ny søgning.
  const [showHiddenConflicts, setShowHiddenConflicts] = useState(false);
  useEffect(() => { setShowHiddenConflicts(false); }, [newItemName]);
  useEffect(() => {
    if (!newItemName.trim()) { setItemResults([]); setItemSearching(false); setItemHasMore(false); setItemTotal(0); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setItemSearching(true);
      try {
        const data = await apiCall(`${SUPABASE_URL}/functions/v1/search?q=${encodeURIComponent(newItemName.trim())}`,
          { headers: makeHeaders(accessToken), signal: controller.signal });
        if (data.success) {
          itemOffsetRef.current = (data.products || []).length;
          setItemResults(completeOnly(data.products));
          setItemHasMore(!!data.hasMore);
          setItemTotal(data.total || (data.products || []).length);
        }
      } catch (e) { if (e.name !== "AbortError") setItemResults([]); }
      finally { if (!controller.signal.aborted) setItemSearching(false); }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [newItemName, accessToken]);

  // Henter næste side og APPENDER til de eksisterende resultater — samme
  // mønster som useSearch.js's loadMoreSearchResults. Tjekker at søgeteksten
  // stadig matcher når svaret kommer tilbage, så et forladt søgeords svar
  // ikke kan nå at blive hængt på en ny søgnings resultater.
  const loadMoreItemResults = async () => {
    const q = newItemName.trim();
    if (!q || itemLoadingMore || !itemHasMore) return;
    setItemLoadingMore(true);
    try {
      const data = await apiCall(`${SUPABASE_URL}/functions/v1/search?q=${encodeURIComponent(q)}&offset=${itemOffsetRef.current}`,
        { headers: makeHeaders(accessToken) });
      if (data.success && newItemName.trim() === q) {
        itemOffsetRef.current += (data.products || []).length;
        setItemResults(prev => [...prev, ...completeOnly(data.products)]);
        setItemHasMore(!!data.hasMore);
        setItemTotal(data.total || 0);
      }
    } catch { /* ignoreres — brugeren kan bare prøve knappen igen */ }
    finally { setItemLoadingMore(false); }
  };

  const pickItemProduct = (p) => {
    logSearchSelection(newItemName, p, accessToken);
    addToList({ name: productDisplayName(p), ean: p.ean || p.code, id: p.id, image_url: p.image_url });
    setItemResults([]);
    setItemFocused(false);
  };

  // ── EatSafe-status pr. vare på listen (25. sept. 2026, brugerfeedback) ──────
  // Henter produktdata for varer med et EAN (dvs. tilføjet fra søgning/scan,
  // ikke en fritekst-vare) én gang pr. unikt EAN, så en diskret statuslinje
  // under varenavnet kan vise "Passer til …"/"Konflikt for X"/"Kan
  // ikke afgøres sikkert" — samme sikkerhedsberegning som ResultScreen bruger
  // efter et scan (buildActiveProfileList/computeProfileResults, se
  // helpers.js), IKKE en selvstændig kopi af logikken.
  const [productDetails, setProductDetails] = useState({});
  const fetchingEansRef = useRef(new Set());
  useEffect(() => {
    const eans = [...new Set(shoppingList.filter(i => i.ean).map(i => i.ean))];
    const toFetch = eans.filter(ean => !(ean in productDetails) && !fetchingEansRef.current.has(ean));
    if (toFetch.length === 0) return;
    toFetch.forEach(ean => {
      fetchingEansRef.current.add(ean);
      apiCall(`${SUPABASE_URL}/functions/v1/products/${ean}`, { headers: makeHeaders(accessToken) })
        .then(data => setProductDetails(prev => ({ ...prev, [ean]: data?.found ? data.product : null })))
        .catch(() => setProductDetails(prev => ({ ...prev, [ean]: null })))
        .finally(() => fetchingEansRef.current.delete(ean));
    });
  }, [shoppingList, accessToken]);

  const activeProfileList = buildActiveProfileList({ user, family, allergens, customAllerg, selectedENumbers, activeProfiles });
  const itemStatus = (item) => {
    // Manuelt oprettede varer (fritekst, intet EAN/databaseprodukt) kan ikke
    // allergitjekkes — vis det tydeligt fremfor slet ingen status, så det
    // ikke fejlagtigt ser ud som om varen bare mangler at blive vurderet
    // (25. sept. 2026, brugerfeedback). Diskret grå, ikke rød/orange — det
    // er en oplysning, ikke en advarsel.
    if (!item.ean) return { status:"manual", text:"Manuel vare – ikke allergitjekket" };
    if (activeProfileList.length === 0) return null;
    const product = productDetails[item.ean];
    if (product === undefined || !product) return null; // stadig henter, eller ikke fundet — vis intet frem for et gæt
    const ingredientsText = product.ingredients || product.ingredients_text || "";
    const results = computeProfileResults(activeProfileList, {
      allergen_flags: normalizeProductFlagsFor(product), ingredients: ingredientsText, nutrition: product.nutrition,
      productENumbers: extractENumbers(ingredientsText),
    });
    const conflict = profileConflictLabel(results);
    if (conflict) return { status:"danger", text: conflict };
    if (results.some(r => r.status === "warn")) return { status:"warn", text: "Kan ikke afgøres sikkert" };
    // Ordlyden følger antallet af valgte profiler (1. okt. 2026, brugerrapport:
    // "Matcher alle profiler" gav ikke mening for én person uden familie).
    return { status:"safe", text: profileMatchLabel(activeProfileList) };
  };
  // Delt farve-/ikon-opslag for statuslinjen (Mangler- og Købt-sektionerne
  // nedenfor) — én kilde, så de to sektioner ikke kan drifte fra hinanden.
  const STATUS_COLOR = { danger:"var(--red)", warn:"var(--amber)", safe:"var(--green)", manual:"var(--muted)" };
  const STATUS_ICON = { danger:"warning", warn:"warning", safe:"check", manual:"info" };

  // ── Sikker søgning: skjul produkter med allergikonflikt som standard, og
  // vis den anden slags (spor/usikkert) med en tydelig advarsel i stedet for
  // helt at gemme dem (25. sept. 2026, opfølgning) — konfliktprodukter er
  // ikke længere utilgængelige, kun skjult bag en klikbar "Vis N produkter
  // med konflikt"-række (se showHiddenConflicts nedenfor), så brugeren selv
  // kan vælge at se dem. Bruger samme per-profil-beregning som resten af
  // appen (buildActiveProfileList/computeProfileResults, helpers.js) i
  // stedet for den tidligere flade compareAllergens(activeIds), så "farlig"
  // her betyder præcis det samme som "Konflikt for X" nedenfor.
  const itemResultsWithSafety = itemResults.map(p => {
    const ingredientsText = p.ingredients || p.ingredients_text || "";
    const results = computeProfileResults(activeProfileList, {
      allergen_flags: normalizeProductFlagsFor(p), ingredients: ingredientsText, nutrition: p.nutrition,
      productENumbers: extractENumbers(ingredientsText),
    });
    return { product: p, danger: results.some(r => r.status === "danger") };
  });
  const visibleItemResults = itemResultsWithSafety.filter(r => !r.danger);
  const hiddenConflictResults = itemResultsWithSafety.filter(r => r.danger).map(r => r.product);

  const activeFamily = family.filter(m => activeProfiles.includes(m.id));
  const meActive = activeProfiles.includes("me");
  const allProfileIds = ["me", ...family.map(m => m.id)];
  const isAllActive = allProfileIds.every(id => activeProfiles.includes(id));
  const searchScopeLabel = isAllActive && family.length > 0
    ? "hele familien"
    : ([meActive && "dig", ...activeFamily.map(m => m.name.split(" ")[0])].filter(Boolean).join(", ") || "dig");

  // Samme "Aktive profiler"-valg som bruges til scanning og favoritter —
  // så man her kan justere hvem søgningen skal være sikker for uden at
  // skulle navigere væk fra indkøbslisten.
  const toggleAllProfiles = () => setActiveProfiles(isAllActive ? ["me"] : allProfileIds);
  const toggleOneProfile = (id) => {
    if (isAllActive) { setActiveProfiles([id]); return; }
    const next = activeProfiles.includes(id) ? activeProfiles.filter(x => x !== id) : [...activeProfiles, id];
    setActiveProfiles(next.length === 0 ? [id] : next);
  };

  const handleJoin = async () => {
    setJoinLoading(true);
    setJoinError("");
    // Accepter både et fuldt link (?join-list=KODE) og en rå kode indsat direkte
    let code = joinCode.trim();
    try { code = new URL(code).searchParams.get("join-list") || code; } catch { /* ikke et link — brug som kode */ }
    const res = await joinByCode(code);
    setJoinLoading(false);
    if (res.success) { setShowJoin(false); setJoinCode(""); }
    else setJoinError(res.error || "Kunne ikke tilslutte listen");
  };

  return (
    <div className="screen fade-in">
      {/* Titlen fik sin egen fulde linje/zone (29. sept. 2026, bruger-
          feedback) — lå tidligere i en delt space-between-flexrække med
          "Sådan fungerer listen", hvor den delte klasses egen
          width:100%/text-align:center kolliderede med flex-rækkens layout.
          Venstrestillet + margin uændret fra den delte .screen-title-klasse
          (samme mønster som ProfileScreen.jsx's Historik/Favoritter-titler,
          "samme reference som Indkøbslistens [titel]" — den reference
          havde ikke slået igennem her endnu). Hjælpelinket er flyttet ned
          på sin egen linje og gjort tydeligt sekundært (lettere vægt,
          --muted i stedet for --ink2, mindre ikon), så det ikke længere
          konkurrerer visuelt med sidetitlen. */}
      <div className="screen-title" style={{ textAlign:"left", width:"auto" }}>Indkøbsliste</div>
      {onOpenHelp && (
        <button type="button" onClick={onOpenHelp}
          style={{ display:"flex", alignItems:"center", gap:4, background:"none", border:"none", cursor:"pointer", padding:0, marginBottom:12, fontFamily:"var(--f)", fontSize:11, fontWeight:500, color:"var(--ink2)" }}>
          <Icon name="info" size={11} color="var(--ink2)" /> Sådan fungerer listen
        </button>
      )}

      {/* ── Tilføj vare (øverst, så søgeresultater aldrig kan havne bag andet indhold) ── */}
      <div style={{ marginBottom:8, position:"relative", zIndex:5 }}>
        {/* Søgefelt og Tilføj-knap gjort lavere/mere kompakte (30. sept. 2026)
            — begge 40px høje. Skriftstørrelsen i feltet er bevidst 16px
            (under 16px zoomer iOS Safari ind ved fokus). */}
        <div className="input-row" style={{ marginBottom:0 }}>
          <input className="field" placeholder="Søg eller skriv en vare…"
            style={{ height:40, padding:"0 12px" }}
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            onFocus={() => setItemFocused(true)}
            onBlur={() => setTimeout(() => setItemFocused(false), 150)}
            onKeyDown={e => e.key==="Enter" && addToList(newItemName)} />
          {/* Knappen smallet en anelse ind (29. sept. 2026, brugerfeedback)
              — reduceret sidepadding (14px→10px) giver søgefeltet lidt mere
              plads uden at ændre knappens højde. Radius rettet til 10px
              (matcher .field's radius) — .btn-sm's delte radius er 8px,
              hvilket ikke matchede feltets, kun overstyret her. */}
          <button className="btn btn-primary btn-sm" style={{ ...UI.uwsnowrap, height:40, minHeight:40, padding:"0 12px", borderRadius:10 }}
            onClick={() => addToList(newItemName)}>
            Tilføj
          </button>
        </div>
        {itemFocused && newItemName.trim() && (itemSearching || itemResults.length > 0) && (
          // Rent, scrollbart panel direkte under søgefeltet (25. sept. 2026,
          // brugerfeedback: "søgeresultater må aldrig overlappe profilchips,
          // inputfelt eller hinanden") — headeren (profilchips) er position:
          // sticky INDE i selve scroll-containeren, med sin egen baggrund +
          // kant + skygge, så den tydeligt "flyder" over resultaterne i
          // stedet for at se ud til at overlappe dem når man scroller.
          // position:absolute relativt til input-feltets egen wrapper
          // (zIndex:5 ovenfor) holder panelet altid direkte under feltet,
          // aldrig oven i det.
          <div style={{ position:"absolute", left:0, right:0, top:"100%", marginTop:8, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, boxShadow:"var(--sh2)", zIndex:10, maxHeight:"min(60vh, 480px)", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
            {itemResults.length > 0 && (
              <div style={{ position:"sticky", top:0, padding:"8px 10px", background:"var(--green-lt)", borderBottom:"1px solid var(--border)", boxShadow:"0 4px 8px -6px rgba(21,32,26,.18)", zIndex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:9, fontWeight:800, color:"var(--green)", textTransform:"uppercase", letterSpacing:".4px", marginBottom: family.length > 0 ? 6 : 0 }}>
                  <Icon name="shield" size={11} color="var(--green)" /> Sikker søgning for {searchScopeLabel}
                </div>
                {family.length > 0 && (
                  <>
                    {/* Tydeliggørelse (25. sept. 2026, brugerfeedback) —
                        profilchipsene viser HVEM produkterne tjekkes imod,
                        ikke en egenskab ved selve produktet — uden kontekst
                        kan et navn som "Hanne" fejlagtigt læses som om
                        produktet handler om/matcher Hanne, i stedet for at
                        det er profilen søgningen sikkerhedstjekkes for. */}
                    <div style={{ fontSize:9.5, fontWeight:700, color:"var(--muted)", marginBottom:4 }}>
                      Tjekkes for:
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                      <span onMouseDown={e => { e.preventDefault(); toggleAllProfiles(); }}
                        style={{ padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700, cursor:"pointer", background: isAllActive ? "var(--green)" : "var(--surface)", color: isAllActive ? "var(--on-green)" : "var(--muted)", border:`1px solid ${isAllActive ? "var(--green)" : "var(--border2)"}` }}>
                        Alle
                      </span>
                      <span onMouseDown={e => { e.preventDefault(); toggleOneProfile("me"); }}
                        style={{ padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700, cursor:"pointer", background: !isAllActive && meActive ? "var(--green)" : "var(--surface)", color: !isAllActive && meActive ? "var(--on-green)" : "var(--muted)", border:`1px solid ${!isAllActive && meActive ? "var(--green)" : "var(--border2)"}` }}>
                        Mig
                      </span>
                      {family.map(m => {
                        const on = !isAllActive && activeProfiles.includes(m.id);
                        return (
                          <span key={m.id} onMouseDown={e => { e.preventDefault(); toggleOneProfile(m.id); }}
                            style={{ padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700, cursor:"pointer", background: on ? "var(--green)" : "var(--surface)", color: on ? "var(--on-green)" : "var(--muted)", border:`1px solid ${on ? "var(--green)" : "var(--border2)"}` }}>
                            {m.name.split(" ")[0]}
                          </span>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
            {itemSearching && itemResults.length === 0 && (
              <div style={{ padding:"10px 12px", fontSize:12, color:"var(--muted)" }}>Søger…</div>
            )}
            {visibleItemResults.length > 0 && (
              <div style={{ padding:"12px 12px 4px" }}>
                {visibleItemResults.map(({ product: p }) => (
                  <SearchResultRow key={p.ean||p.id} product={p} effectiveIds={activeIds} effectiveLevels={activeLevels} profiles={activeProfileList}
                    onOpen={() => { logSearchSelection(newItemName, p, accessToken); lookupProduct(p.ean||p.code||p.id); setItemFocused(false); setNewItemName(""); }}
                    onAddToList={() => pickItemProduct(p)}
                  />
                ))}
              </div>
            )}
            {/* Konfliktprodukter er skjult som standard, men aldrig
                utilgængelige — en klikbar række folder dem ud i stedet for
                den tidligere statiske "N produkter skjult"-tekst (25. sept.
                2026, brugerfeedback). Udfoldet vises de tydeligt røde, med
                hvilken profil konflikten gælder (samme SearchResultRow,
                bare uden det implicitte danger-filter — se profiles-prop). */}
            {hiddenConflictResults.length > 0 && (
              <>
                {/* onMouseDown+preventDefault i stedet for onClick (samme
                    mønster som "Indlæs flere"-knappen og "+"-knappen i
                    SearchResultRow ovenfor) — ellers når søgefeltets egen
                    onBlur (150ms timeout) at lukke hele panelet FØR et
                    almindeligt onClick-tryk her når at blive registreret,
                    så udfoldningen aldrig ses (fundet ved Playwright-
                    gennemgang, ikke en antagelse). */}
                <button type="button" onMouseDown={e => { e.preventDefault(); setShowHiddenConflicts(v => !v); }}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", gap:6, padding:"10px 12px", fontSize:10.5, fontWeight:700, color:"var(--red)", background:"var(--red-lt)", border:"none", borderTop:"1px solid var(--border)", cursor:"pointer", fontFamily:"var(--f)" }}>
                  <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <Icon name="warning" size={11} color="var(--red)" />
                    {showHiddenConflicts ? "Skjul" : "Vis"} {hiddenConflictResults.length} produkt{hiddenConflictResults.length!==1?"er":""} med konflikt
                  </span>
                  <Icon name={showHiddenConflicts ? "chevronUp" : "chevronDown"} size={12} color="var(--red)" />
                </button>
                {showHiddenConflicts && (
                  <div style={{ padding:"10px 12px 2px" }}>
                    {hiddenConflictResults.map(p => (
                      <SearchResultRow key={p.ean||p.id} product={p} effectiveIds={activeIds} effectiveLevels={activeLevels} profiles={activeProfileList}
                        onOpen={() => { logSearchSelection(newItemName, p, accessToken); lookupProduct(p.ean||p.code||p.id); setItemFocused(false); setNewItemName(""); }}
                        onAddToList={() => pickItemProduct(p)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
            {itemHasMore && (
              <div style={{ padding:"6px 12px 10px" }}>
                <button className="btn btn-outline btn-full btn-sm"
                  disabled={itemLoadingMore}
                  onMouseDown={e => { e.preventDefault(); loadMoreItemResults(); }}>
                  {itemLoadingMore ? "Indlæser…" : `Indlæs flere (${Math.max(itemTotal - itemOffsetRef.current, 0)} tilbage)`}
                </button>
              </div>
            )}
            {!itemSearching && (
              <div onMouseDown={() => addToList(newItemName)}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"11px 12px", fontSize:12.5, fontWeight:700, color:"var(--green)", cursor:"pointer", borderTop: (itemResults.length > 0 || itemHasMore) ? "1px solid var(--border)" : "none" }}>
                <Icon name="plus" size={13} color="var(--green)" />
                Tilføj "{newItemName.trim()}" som almindelig vare
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Listevælger (komprimeret) ──
          Samlet til ÉN kontrol (30. sept. 2026): listevælger og del-knap
          deler samme ramme, adskilt af en tynd skillelinje, i stedet for
          separate knapper. Favorit-knappen er fjernet herfra (favoritter
          nås fortsat via menuen → Favoritter). */}
      <div style={{ marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"stretch", height:36, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden" }}>
          <div onClick={() => setShowListPicker(v => !v)}
            style={{ flex:1, minWidth:0, display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, padding:"0 12px", cursor:"pointer" }}>
            <div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              <span style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>{activeList?.name || "Vælg liste"}</span>
              {activeList?.type === "family" && <span style={{ marginLeft:6, display:"inline-flex", verticalAlign:"middle" }}><Icon name="family" size={11} color="var(--green)" /></span>}
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2" style={{ flexShrink:0, transform: showListPicker ? "rotate(180deg)" : "none", transition:"transform .2s" }}>
              <path strokeLinecap="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
          <button aria-label="Del liste" onClick={() => setShowShareSheet(true)} disabled={!activeList}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", width:36, padding:0, background:"none", border:"none", borderLeft:"1px solid var(--border)", cursor: activeList ? "pointer" : "not-allowed", opacity: activeList ? 1 : .5, flexShrink:0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <path strokeLinecap="round" d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Listevælgerens dropdown (30. sept. 2026): kompakte rækker (52px),
          aktiv liste med lysegrøn baggrund + checkmark, og ingen permanente
          papirkurve. Sletning ligger bag "Rediger" øverst i panelet, så den
          ikke er en fremtrædende handling. Sletning bruger stadig den delte
          ConfirmDialog, og man kan aldrig slette sin sidste liste
          (lists.length>1) — "Min indkøbsliste" er en almindelig liste uden
          særstatus i skemaet (ingen is_default-kolonne). */}
      {showListPicker && (
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"4px 6px 8px", marginBottom:10, boxShadow:"var(--sh)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"4px 8px 2px" }}>
            <span style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".8px" }}>Dine lister</span>
            {canDeleteAny && (
              <button type="button" onClick={() => setEditLists(v => !v)}
                style={{ background:"none", border:"none", padding:"6px 0 6px 12px", cursor:"pointer", fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--green)" }}>
                {editLists ? "Færdig" : "Rediger"}
              </button>
            )}
          </div>
          {lists.map(l => {
            const isActive = l.id === activeListId;
            const deletable = l.owner_id === userId && lists.length > 1;
            return (
              <div key={l.id} onClick={() => { if (editLists) return; setActiveListId(l.id); setShowListPicker(false); }}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, minHeight:52, padding:"0 10px", borderRadius:8, cursor: editLists ? "default" : "pointer", background: isActive ? "var(--green-selected-bg)" : "transparent" }}>
                <div style={{ minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  <span style={{ fontSize:14, fontWeight: isActive ? 700 : 600, color: isActive ? "var(--green)" : "var(--ink)" }}>{l.name}</span>
                  {l.type === "family" && <span style={{ marginLeft:6, display:"inline-flex", verticalAlign:"middle" }}><Icon name="family" size={12} color="var(--muted)" /></span>}
                  {l.owner_id !== userId && <span style={{ marginLeft:6, fontSize:11, color:"var(--muted)" }}>(delt)</span>}
                </div>
                {editLists ? (
                  deletable && (
                    <button type="button" aria-label={`Slet "${l.name}"`}
                      onClick={e => { e.stopPropagation(); setListPendingDelete(l); }}
                      style={{ flexShrink:0, height:32, padding:"0 10px", background:"none", border:"1px solid var(--red-md)", borderRadius:8, cursor:"pointer", fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--red)" }}>
                      Slet
                    </button>
                  )
                ) : (
                  isActive && <Icon name="check" size={16} color="var(--green)" />
                )}
              </div>
            );
          })}
          {!showNewList ? (
            <div style={{ display:"flex", gap:8, marginTop:8, padding:"0 2px" }}>
              <button type="button" className="list-picker-action" onClick={() => setShowNewList(true)}>
                <Icon name="plus" size={13} color="var(--ink)" /> Ny liste
              </button>
              <button type="button" className="list-picker-action" onClick={() => { setShowListPicker(false); setShowJoin(true); }}>
                <Icon name="link" size={13} color="var(--ink)" /> Tilslut med link
              </button>
            </div>
          ) : (
            <div style={{ display:"flex", gap:8, marginTop:8, padding:"0 2px" }}>
              <input className="field" placeholder="Fx. Weekend, Fest…" autoFocus style={{ flex:1, marginBottom:0, height:40, padding:"0 12px" }}
                value={newListName} onChange={e => setNewListName(e.target.value)}
                onKeyDown={async e => { if (e.key === "Enter" && newListName.trim()) { await createList(newListName); setNewListName(""); setShowNewList(false); setShowListPicker(false); } }} />
              <button className="btn btn-primary btn-sm" style={{ height:40, minHeight:40, padding:"0 14px", borderRadius:10 }} onClick={async () => { if (newListName.trim()) { await createList(newListName); setNewListName(""); setShowNewList(false); setShowListPicker(false); } }}>
                Opret
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Tilslut med link ── */}
      {showJoin && (
        <div className="card" style={{ marginBottom:14 }}>
          <div className="card-lbl" style={S.mb10}>Tilslut liste med link</div>
          <div className="input-row">
            <input className="field" placeholder="Indsæt det delte link"
              value={joinCode} onChange={e => { setJoinCode(e.target.value); setJoinError(""); }}
              onKeyDown={e => e.key === "Enter" && handleJoin()} />
            <button className="btn btn-primary btn-sm" style={UI.uwsnowrap} disabled={joinLoading || !joinCode.trim()} onClick={handleJoin}>
              {joinLoading ? "…" : "Tilslut"}
            </button>
          </div>
          {joinError && <div style={{ fontSize:11, color:"var(--red)", marginTop:6 }}>{joinError}</div>}
        </div>
      )}

      {showShareSheet && activeList && (
        <ShareSheet list={activeList} familyMembers={familyMembers} loadFamilyMembers={loadFamilyMembers}
          getListAccess={getListAccess} grantAccess={grantAccess} revokeAccess={revokeAccess} setListType={setListType}
          onClose={() => setShowShareSheet(false)} />
      )}

      {/* ── Tom tilstand ──
          Positionen (paddingTop) er tilbageført til den delte klasses
          normale 56px (29. sept. 2026, opfølgning — en tidligere runde
          flyttede blokken ~48px op, men det skulle rulles tilbage). Cirkel-
          størrelsen og hjælpetekstens linjeafstand er fortsat lokale
          inline-overstyringer KUN på denne instans — .empty-icon/-sub er
          delte klasser brugt uændret af MadpasScreen.jsx og tre steder i
          ProfileScreen.jsx, som ikke skal påvirkes. */}
      {shoppingList.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon" style={{ width:60, height:60 }}><Icon name="cart" size={23} color="var(--muted)" /></span>
          <div className="empty-txt">Listen er tom</div>
          <div className="empty-sub" style={{ lineHeight:1.35, color:"var(--ink2)" }}>Søg efter produkter eller tilføj en vare manuelt</div>
        </div>
      )}

      {/* ── Mangler ── */}
      {shoppingList.filter(i => !i.checked).length > 0 && (
        <>
          <div className="list-section">
            Mangler ({shoppingList.filter(i=>!i.checked).length})
          </div>
          {shoppingList.filter(i => !i.checked).map(item => {
            const st = itemStatus(item);
            return (
            <div key={item.id} className="list-item">
              <div className="list-check" role="checkbox" aria-checked="false" aria-label={`Markér "${item.name}" som købt`} tabIndex={0}
                onClick={() => handleToggleItem(item.id, false)} onKeyDown={e => e.key === "Enter" && handleToggleItem(item.id, false)} />
              {item.ean && <ProductImage product={item} size={22} />}
              <div style={{ flex:1, minWidth:0 }}>
                {item.ean
                  ? <div className="list-name" role="link" tabIndex={0} style={{ cursor:"pointer" }}
                      onClick={() => lookupProduct(item.ean)} onKeyDown={e => e.key === "Enter" && lookupProduct(item.ean)}>{item.name}</div>
                  : <div className="list-name">{item.name}</div>}
                {/* Diskret EatSafe-status (25. sept. 2026, brugerfeedback) —
                    kun for varer med kendt produktdata (EAN), se itemStatus
                    ovenfor. Samme grøn/rød/orange-farvesprog som resultat-
                    siden, altid ikon+tekst, aldrig kun farve. */}
                {st && (
                  <div style={{ display:"flex", alignItems:"center", gap:3, marginTop:2, fontSize:10, fontWeight:600, color: STATUS_COLOR[st.status] }}>
                    <Icon name={STATUS_ICON[st.status]} size={9} color="currentColor" />
                    {st.text}
                  </div>
                )}
              </div>
              <div className="list-del" role="button" aria-label={`Slet "${item.name}"`} tabIndex={0}
                onClick={() => removeItem(item.id)} onKeyDown={e => e.key === "Enter" && removeItem(item.id)}>
                <Icon name="trash" size={16} color="var(--muted)" />
              </div>
            </div>
          );})}
        </>
      )}

      {/* ── Købt ── */}
      {shoppingList.filter(i => i.checked).length > 0 && (
        <>
          <div className="list-section" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span>Købt ({shoppingList.filter(i=>i.checked).length})</span>
            {/* "Ryd" → "Ryd købte" + en rigtig bekræft-dialog (ConfirmDialog,
                SharedComponents.jsx) i stedet for native confirm() (25.
                sept. 2026, brugerfeedback: "erstat generiske OK-knapper med
                handlingsspecifik tekst" — confirm()'s knapper styres af
                browseren og kan ikke omdøbes). Dæmpet til --muted i stedet
                for fuldt rødt/fed ("brug destruktiv styling sparsomt"), kun
                et lille skraldespand-ikon som visuel markør. */}
            <button type="button" style={{ display:"flex", alignItems:"center", gap:4, cursor:"pointer", background:"none", border:"none", color:"var(--muted)", fontWeight:700, fontSize:11.5, fontFamily:"var(--f)", padding:"8px 6px" }}
              aria-label="Ryd alle købte varer"
              onClick={() => setShowClearDoneConfirm(true)}>
              <Icon name="trash" size={11} color="var(--muted)" /> Ryd købte
            </button>
          </div>
          {shoppingList.filter(i => i.checked).map(item => {
            const st = itemStatus(item);
            return (
            <div key={item.id} className="list-item done">
              <div className="list-check checked" role="checkbox" aria-checked="true" aria-label={`Fjern "${item.name}" fra købt`} tabIndex={0}
                onClick={() => toggleItem(item.id)} onKeyDown={e => e.key === "Enter" && toggleItem(item.id)}><Icon name="check" size={12} color="#fff" /></div>
              {item.ean && <ProductImage product={item} size={22} />}
              <div style={{ flex:1, minWidth:0 }}>
                {item.ean
                  ? <div className="list-name done" role="link" tabIndex={0} style={{ cursor:"pointer" }}
                      onClick={() => lookupProduct(item.ean)} onKeyDown={e => e.key === "Enter" && lookupProduct(item.ean)}>{item.name}</div>
                  : <div className="list-name done">{item.name}</div>}
                {st && (
                  <div style={{ display:"flex", alignItems:"center", gap:3, marginTop:2, fontSize:10, fontWeight:600, color: STATUS_COLOR[st.status] }}>
                    <Icon name={STATUS_ICON[st.status]} size={9} color="currentColor" />
                    {st.text}
                  </div>
                )}
              </div>
              <div className="list-del" role="button" aria-label={`Slet "${item.name}"`} tabIndex={0}
                onClick={() => removeItem(item.id)} onKeyDown={e => e.key === "Enter" && removeItem(item.id)}>
                <Icon name="trash" size={16} color="var(--muted)" />
              </div>
            </div>
          );})}
        </>
      )}

      {/* Bekræft-dialoger for destruktive handlinger (25. sept. 2026,
          brugerfeedback) — se ConfirmDialog i SharedComponents.jsx og
          kommentarerne ved "Slet liste"-knappen/"Ryd købte"-knappen
          ovenfor for hvorfor native confirm() er erstattet her. */}
      {listPendingDelete && (
        <ConfirmDialog
          title={`Slet listen "${listPendingDelete.name}"?`}
          message="Alle varer på listen fjernes permanent."
          confirmLabel="Slet liste"
          onConfirm={() => { deleteList(listPendingDelete.id); setListPendingDelete(null); }}
          onCancel={() => setListPendingDelete(null)}
        />
      )}
      {showClearDoneConfirm && (
        <ConfirmDialog
          title="Ryd alle købte varer?"
          message="Varerne fjernes fra listen. Denne handling kan ikke fortrydes."
          confirmLabel="Ryd købte"
          onConfirm={() => { clearDone(); setShowClearDoneConfirm(false); }}
          onCancel={() => setShowClearDoneConfirm(false)}
        />
      )}
    </div>
  );
}
