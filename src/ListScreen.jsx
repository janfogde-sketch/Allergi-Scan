// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from "react";
import { SCREENS, SUPABASE_URL } from "./constants.jsx";
import { findProductOnList, productDisplayName, logSearchSelection, apiCall, makeHeaders, buildActiveProfileList, evaluateProductForProfiles, STATUS_TEXT } from "./helpers.js";
import ReactDOM from "react-dom";
import { useMeasuredHeight } from "./useMeasuredHeight.js";
import { Icon, ProductImage, SearchResultRow, ConfirmDialog, showToast, LoadErrorBox } from "./SharedComponents.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useShoppingContext } from "./ShoppingContext.jsx";
import { useAllergenPrefsContext } from "./AllergenPrefsContext.jsx";
import { UI } from "./styleUtils.js";
import { ListSwitcherSheet, ShareListSheet, ShareStatus } from "./ListSheets.jsx";

const S = {
  flexMin: { flex:1, minWidth:0 },
  mb12:    { marginBottom:12 },
  mb10:    { marginBottom:10 },
  h13b:    { fontSize:13, fontWeight:700, color:"var(--ink)" },
  sub11:   { fontSize:11, color:"var(--muted)" },
};

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
    familyMembers, loadFamilyMembers, createList, renameList, deleteList, joinByCode,
    getListAccess, grantAccess, revokeAccess, setListType, rotateListCode, leaveList, loadShoppingList, listsError,
  } = useShoppingContext();

  const [showListPicker, setShowListPicker] = useState(false);
  const [shareListId, setShareListId] = useState(null); // listen, der deles (åbnes fra Del-ikonet i liste-knappen)
  const shareList = lists.find(l => l.id === shareListId) || null;
  // Bekræft-dialoger for destruktive handlinger (25. sept. 2026,
  // brugerfeedback) — erstatter native confirm(), se ConfirmDialog i
  // SharedComponents.jsx for hvorfor. listPendingDelete holder LISTEN
  // (ikke kun dens id) så dialogens tekst kan vise det rigtige navn.
  const [listPendingDelete, setListPendingDelete] = useState(null);
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
  const [itemSearchedQuery, setItemSearchedQuery] = useState(""); // senest gennemførte søgning (til "ingen produkter matcher")
  const [itemFocused, setItemFocused]   = useState(false);
  // Tastatur (9. okt. 2026, Bjørn): resultaterne står i selve siden og består uden fokus. Tastaturet lukkes ved scroll i resultaterne,
  // tryk uden for feltet, "Søg/Færdig", valg af produkt og filterskift, og åbner aldrig igen uden at brugeren trykker i feltet.
  const inputRef = useRef(null);
  const blurInput = useCallback(() => { if (document.activeElement === inputRef.current) inputRef.current?.blur(); }, []);
  const [resultFilter, setResultFilter] = useState("all"); // all | clean | trace | conflict | unknown
  const resultsRef = useRef(null);
  const [confirmAdd, setConfirmAdd] = useState(null); // produkt med rød konflikt, der afventer et bevidst valg
  const [navH, setNavH] = useState(80);
  const topH = useMeasuredHeight(() => document.querySelector(".topbar"));
  useEffect(() => {
    if (!itemFocused) return undefined;
    const onDown = (e) => { if (e.target !== inputRef.current && !e.target.closest?.("[data-search-clear]")) blurInput(); };
    const onMove = (e) => { if (e.target !== inputRef.current) blurInput(); };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("wheel", onMove, { passive: true });
    return () => { document.removeEventListener("pointerdown", onDown, true); document.removeEventListener("touchmove", onMove); document.removeEventListener("wheel", onMove); };
  }, [itemFocused, blurInput]);
  // Sideinddeling — samme offset/hasMore/total-API som SearchScreens "Indlæs flere", så listen ikke er hårdt afskåret ved den første side.
  const [itemHasMore, setItemHasMore]         = useState(false);
  const [itemTotal, setItemTotal]             = useState(0);
  const [itemLoadingMore, setItemLoadingMore] = useState(false);
  // Antal rå resultater hentet fra serveren (før filtrering af ukomplette produkter), så "Vis flere" bruger det rigtige offset.
  const itemOffsetRef = useRef(0);
  // Produkter med for få oplysninger vises fortsat (under "Alle", med grå "Kan ikke vurderes"); kun produkter uden navn udelades.
  const completeOnly = (list) => (list || []).filter(p => (p.name || "").trim());
  useEffect(() => { setResultFilter("all"); }, [newItemName]);
  // Cache pr. søgetekst (første side), så et tilbageskridt eller en gentaget
  // søgning vises med det samme uden nyt kald. Udløber efter 5 min, fordi
  // populariteten og brugerens egne valg påvirker rangeringen, og ryddes,
  // når brugeren skifter (login/logout).
  const itemCacheRef = useRef({ token: null, map: new Map() });
  useEffect(() => {
    const q = newItemName.trim();
    if (!q) { setItemResults([]); setItemSearching(false); setItemHasMore(false); setItemTotal(0); return; }
    if (itemCacheRef.current.token !== accessToken) itemCacheRef.current = { token: accessToken, map: new Map() };
    const cache = itemCacheRef.current.map;
    const key = q.toLowerCase();
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 5 * 60 * 1000) {
      itemOffsetRef.current = hit.offset;
      setItemResults(hit.results);
      setItemHasMore(hit.hasMore);
      setItemTotal(hit.total);
      setItemSearching(false);
      setItemSearchedQuery(q);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setItemSearching(true);
      try {
        const data = await apiCall(`${SUPABASE_URL}/functions/v1/search?q=${encodeURIComponent(q)}`,
          { headers: makeHeaders(accessToken), signal: controller.signal });
        if (data.success) {
          const results = completeOnly(data.products);
          const offset = (data.products || []).length;
          const total = data.total || offset;
          itemOffsetRef.current = offset;
          setItemResults(results);
          setItemHasMore(!!data.hasMore);
          setItemTotal(total);
          setItemSearchedQuery(q);
          if (cache.size >= 30) cache.delete(cache.keys().next().value);
          cache.set(key, { at: Date.now(), results, offset, hasMore: !!data.hasMore, total });
        }
      } catch (e) { if (e.name !== "AbortError") setItemResults([]); }
      finally { if (!controller.signal.aborted) setItemSearching(false); }
    }, 70);
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
        const keyOf = (x) => x.ean || x.id;
        setItemResults(prev => { const seen = new Set(prev.map(keyOf)); return [...prev, ...completeOnly(data.products).filter(x => !seen.has(keyOf(x)))]; });
        setItemHasMore(!!data.hasMore);
        setItemTotal(data.total || 0);
      }
    } catch { /* ignoreres — brugeren kan bare prøve knappen igen */ }
    finally { setItemLoadingMore(false); }
  };

  const addProductNow = async (p) => {
    logSearchSelection(newItemName, p, accessToken);
    const ok = await addToList({ name: productDisplayName(p), ean: p.ean || p.code, id: p.id, image_url: p.image_url });
    if (ok !== false) showToast(`"${productDisplayName(p)}" tilføjet`, "success");
    return ok;
  };
  const pickItemProduct = async (p) => {
    blurInput();
    if (findProductOnList(shoppingList, { code: p.ean || p.code, id: p.id })) { showToast("Står allerede på listen", "info"); return false; }
    // Rød konflikt: kort advarsel først, men brugeren kan stadig vælge at tilføje produktet. Orange spor tilføjes uden ekstra bekræftelse.
    if (evaluateProductForProfiles(activeProfileList, p).level === "danger") { setConfirmAdd(p); return false; }
    return addProductNow(p);
  };
  // Almindelig vare uden produktvalg: aldrig to ens fritekst-varer på listen.
  const plainName = newItemName.trim();
  const plainExists = !!plainName && shoppingList.some(i => !i.ean && (i.name || "").trim().toLowerCase() === plainName.toLowerCase());
  const addPlain = async () => {
    blurInput();
    if (!plainName) return;
    if (plainExists) { showToast(`"${plainName}" står allerede på listen`, "info"); return; }
    const ok = await addToList(plainName);
    if (ok !== false) showToast(`"${plainName}" tilføjet`, "success");
  };

  // ── EatSafe-status pr. vare på listen (25. sept. 2026, brugerfeedback) ──────
  // Henter produktdata for varer med et EAN (dvs. tilføjet fra søgning/scan,
  // ikke en fritekst-vare) én gang pr. unikt EAN, så en diskret statuslinje
  // under varenavnet kan vise "Passer til …"/"Allergi-advarsel for X"/"Kan
  // indeholde spor" — samme sikkerhedsberegning som ResultScreen bruger
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
    // Manuelt oprettede varer (fritekst, intet EAN/databaseprodukt) kan ikke vurderes og får aldrig grøn status.
    if (!item.ean) return { status:"manual", text:"Manuel vare – ikke allergitjekket" };
    if (activeProfileList.length === 0) return null;
    const product = productDetails[item.ean];
    if (product === undefined || !product) return null; // stadig henter, eller ikke fundet — vis intet frem for et gæt
    // Fælles statussystem (helpers.js): grøn kun med tilstrækkelige data, ellers orange/rød/grå.
    const ev = evaluateProductForProfiles(activeProfileList, product);
    const detail = ev.level === "danger" || ev.level === "warn" ? ev.reasons[0] : ev.level === "unknown" ? ev.missing[0] : null;
    return { status: ev.level, text: detail ? `${ev.label} · ${detail}` : ev.label };
  };
  // Delt farve-/ikon-opslag for statuslinjen (Mangler- og Købt-sektionerne nedenfor).
  const STATUS_COLOR = { danger:"var(--red)", warn:"var(--amber)", safe:"var(--green)", unknown:"var(--neutral)", manual:"var(--muted)" };
  const STATUS_ICON = { danger:"warning", warn:"warning", safe:"check", unknown:"info", manual:"info" };

  // ── Søgeresultater: rækkefølgen er søgerelevans (fra serveren); status ændrer ALDRIG rækkefølgen eller skjuler et præcist match.
  // Grupper til filtrene: "Uden konflikt" = grøn (tilstrækkelige data, ingen konflikt), "Med advarsel" = orange + rød; grå kun under "Alle".
  const itemResultsWithSafety = itemResults.map(p => ({ product: p, level: evaluateProductForProfiles(activeProfileList, p).level }));
  const levelCounts = { safe:0, warn:0, danger:0, unknown:0 };
  itemResultsWithSafety.forEach(r => { levelCounts[r.level] = (levelCounts[r.level] || 0) + 1; });
  // Filtre (9. okt. 2026): Alle / Uden konflikt (grøn: fuld data, ingen konflikt eller spor) / Spor (orange) / Konflikt (rød) / Kan ikke vurderes (grå).
  // Et filter vises kun, når der er produkter i det; selve rækken kun, når mindst to slags findes (ensartet adfærd på tværs af søgninger).
  const FILTER_DEFS = [
    { id:"all", label:"Alle", count: itemResultsWithSafety.length, match: () => true },
    { id:"clean", label:"Uden konflikt", count: levelCounts.safe, match: l => l === "safe" },
    { id:"trace", label:"Spor", count: levelCounts.warn, match: l => l === "warn" },
    { id:"conflict", label:"Konflikt", count: levelCounts.danger, match: l => l === "danger" },
    { id:"unknown", label:"Kan ikke vurderes", count: levelCounts.unknown, match: l => l === "unknown" },
  ];
  const availableFilters = FILTER_DEFS.filter(f => f.id === "all" || f.count > 0);
  const showResultFilter = itemResultsWithSafety.length >= 2 && availableFilters.length >= 3;
  const activeFilter = showResultFilter && availableFilters.some(f => f.id === resultFilter) ? resultFilter : "all";
  const activeFilterDef = FILTER_DEFS.find(f => f.id === activeFilter);
  const visibleItemResults = itemResultsWithSafety.filter(r => activeFilterDef.match(r.level));
  const resultOnList = (p) => !!findProductOnList(shoppingList, { code: p.ean || p.code, id: p.id });
  const noMatches = !!newItemName.trim() && !itemSearching && itemResults.length === 0 && itemSearchedQuery === newItemName.trim();
  const hasResultPanel = !!newItemName.trim() && (itemSearching || itemResults.length > 0 || noMatches);
  useEffect(() => {
    const el = document.querySelector(".bottom-nav");
    if (el) setNavH(Math.round(el.getBoundingClientRect().height));
  }, [hasResultPanel, itemFocused]);

  const activeFamily = family.filter(m => activeProfiles.includes(m.id));
  const meActive = activeProfiles.includes("me");
  const allProfileIds = ["me", ...family.map(m => m.id)];
  const isAllActive = allProfileIds.every(id => activeProfiles.includes(id));
  const searchScopeLabel = isAllActive && family.length > 0
    ? "hele familien"
    : ([meActive && "dig", ...activeFamily.map(m => m.name.split(" ")[0])].filter(Boolean).join(", ") || "dig");

  const scopeTitle = family.length === 0 && meActive ? "din profil" : searchScopeLabel;
  // Samme "Aktive profiler"-valg som bruges til scanning og favoritter —
  // så man her kan justere hvem søgningen skal være sikker for uden at
  // skulle navigere væk fra indkøbslisten.
  const toggleAllProfiles = () => setActiveProfiles(isAllActive ? ["me"] : allProfileIds);
  const toggleOneProfile = (id) => {
    if (isAllActive) { setActiveProfiles([id]); return; }
    const next = activeProfiles.includes(id) ? activeProfiles.filter(x => x !== id) : [...activeProfiles, id];
    setActiveProfiles(next.length === 0 ? [id] : next);
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

      {/* ── Tilføj vare/søg: søgefelt (og filter) øverst; resultaterne står direkte i siden under feltet ── */}
      <div style={{ position:"sticky", top:topH, zIndex:20, margin:"0 -16px 8px", padding:"8px 16px", background: hasResultPanel ? "var(--surface)" : "transparent", borderBottom: hasResultPanel ? "1px solid var(--border)" : "1px solid transparent" }}>
        <div className="input-row" style={{ marginBottom:0 }}>
          <div style={{ position:"relative", flex:1, minWidth:0 }}>
            <input ref={inputRef} className="field search-field" aria-label="Søg eller skriv en vare" placeholder="Søg eller skriv en vare…"
              type="search" enterKeyHint="search" autoComplete="off" autoCorrect="off"
              style={{ height:40, padding:"0 36px 0 12px", width:"100%", boxSizing:"border-box" }}
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              onFocus={() => setItemFocused(true)}
              onBlur={() => setItemFocused(false)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }} />
            {newItemName && (
              <button type="button" data-search-clear aria-label="Ryd søgning"
                onMouseDown={e => e.preventDefault()}
                onClick={() => { setNewItemName(""); inputRef.current?.focus(); }}
                style={{ position:"absolute", right:2, top:0, width:36, height:40, display:"flex", alignItems:"center", justifyContent:"center", background:"none", border:"none", cursor:"pointer", padding:0 }}>
                <Icon name="x" size={14} color="var(--muted)" />
              </button>
            )}
          </div>
          {/* Den store "Tilføj"-knap skjules, mens der vises søgeresultater: der er produktkortenes "+" og rækken "Tilføj … uden produktvalg". */}
          {!hasResultPanel && (
            <button className="btn btn-primary btn-sm" style={{ ...UI.uwsnowrap, height:40, minHeight:40, padding:"0 12px", borderRadius:10 }}
              onClick={addPlain}>
              Tilføj
            </button>
          )}
        </div>
        {hasResultPanel && showResultFilter && (
          <div className="hist-filters-wrap" style={{ margin:"6px -16px 0" }}>
            <div className="hist-filters" role="group" aria-label="Filtrér søgeresultater">
              {availableFilters.map(f => (
                <button type="button" key={f.id} className={`filter-chip${activeFilter===f.id?" active":""}`} aria-pressed={activeFilter===f.id}
                  onClick={() => { blurInput(); setResultFilter(f.id); requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ block:"start" })); }}>
                  {f.label}<span style={{ fontWeight:600, opacity:.75, marginLeft:5 }}>{f.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {hasResultPanel && (
        <div ref={resultsRef} style={{ marginBottom:12, paddingBottom:72, scrollMarginTop:topH + 96 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, fontWeight:800, color:"var(--neutral)", textTransform:"uppercase", letterSpacing:".6px", margin:"4px 2px 8px" }}>
            <Icon name="search" size={11} color="var(--neutral)" /> Søgeresultater
          </div>
          {itemResults.length > 0 && family.length > 0 && (
            <div style={{ margin:"0 2px 10px" }}>
              <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", marginBottom:4 }}>Tjekkes for:</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                <span onMouseDown={e => { e.preventDefault(); toggleAllProfiles(); }}
                  style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, cursor:"pointer", background: isAllActive ? "var(--green)" : "var(--surface)", color: isAllActive ? "var(--on-green)" : "var(--muted)", border:`1px solid ${isAllActive ? "var(--green)" : "var(--border2)"}` }}>
                  Alle
                </span>
                <span onMouseDown={e => { e.preventDefault(); toggleOneProfile("me"); }}
                  style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, cursor:"pointer", background: !isAllActive && meActive ? "var(--green)" : "var(--surface)", color: !isAllActive && meActive ? "var(--on-green)" : "var(--muted)", border:`1px solid ${!isAllActive && meActive ? "var(--green)" : "var(--border2)"}` }}>
                  Mig
                </span>
                {family.map(m => {
                  const on = !isAllActive && activeProfiles.includes(m.id);
                  return (
                    <span key={m.id} onMouseDown={e => { e.preventDefault(); toggleOneProfile(m.id); }}
                      style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, cursor:"pointer", background: on ? "var(--green)" : "var(--surface)", color: on ? "var(--on-green)" : "var(--muted)", border:`1px solid ${on ? "var(--green)" : "var(--border2)"}` }}>
                      {m.name.split(" ")[0]}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {itemSearching && itemResults.length === 0 && (
            <div style={{ padding:"10px 4px", fontSize:12, color:"var(--muted)" }}>Søger…</div>
          )}
          {noMatches && (
            <div style={{ padding:"22px 8px", textAlign:"center" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"var(--ink2)" }}>Ingen produkter matcher "{newItemName.trim()}"</div>
              <div style={{ fontSize:12, color:"var(--muted)", marginTop:4, lineHeight:1.45 }}>Tjek stavningen, eller tilføj den som en almindelig vare.</div>
            </div>
          )}
          {itemResults.length > 0 && visibleItemResults.length === 0 && (
            <div style={{ padding:"18px 8px", textAlign:"center" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"var(--ink2)" }}>Ingen produkter i dette filter</div>
              <div style={{ fontSize:12, color:"var(--muted)", marginTop:4, lineHeight:1.45 }}>Søgningen har {itemResults.length.toLocaleString("da-DK")} indlæste produkter.{itemHasMore ? " Vis flere produkter for at søge videre." : ""}</div>
              <button type="button" className="btn btn-outline btn-sm" style={{ marginTop:10 }} onClick={() => setResultFilter("all")}>Vis alle</button>
            </div>
          )}
          {visibleItemResults.map(({ product: p }) => (
            <SearchResultRow key={p.ean||p.id} product={p} effectiveIds={activeIds} effectiveLevels={activeLevels} profiles={activeProfileList}
              onList={resultOnList(p)}
              onOpen={() => { blurInput(); logSearchSelection(newItemName, p, accessToken); lookupProduct(p.ean||p.code||p.id, { via: "search" }); setNewItemName(""); }}
              onAddToList={() => pickItemProduct(p)}
            />
          ))}
          {itemResults.length > 0 && (
            <div style={{ padding:"2px 2px 6px", textAlign:"center" }}>
              <div style={{ fontSize:11, color:"var(--muted)", marginBottom: itemHasMore ? 8 : 0 }}>
                {activeFilter === "all"
                  ? `Viser ${itemResults.length.toLocaleString("da-DK")}${itemTotal > itemResults.length ? ` af ${itemTotal.toLocaleString("da-DK")}` : ""} produkter`
                  : `Viser ${visibleItemResults.length.toLocaleString("da-DK")} ${visibleItemResults.length === 1 ? "produkt" : "produkter"} i dette filter (af ${itemResults.length.toLocaleString("da-DK")} indlæste)`}
              </div>
              {itemHasMore && (
                <button className="btn btn-outline btn-full btn-sm" disabled={itemLoadingMore} onClick={loadMoreItemResults}>
                  {itemLoadingMore ? "Henter flere…" : "Vis flere produkter"}
                </button>
              )}
            </div>
          )}
          {!itemSearching && plainName && ReactDOM.createPortal(
            // Sekundær, men altid tilgængelig: fast lige over bundnavigationen (portal: .screen har en transform, som ville fange position:fixed).
            <div style={{ position:"fixed", left:0, right:0, bottom:navH + 8, zIndex:40, display:"flex", justifyContent:"center", pointerEvents:"none" }}>
              <button type="button" onClick={addPlain}
                style={{ pointerEvents:"auto", display:"flex", alignItems:"center", gap:6, width:"calc(100% - 32px)", maxWidth:448, minHeight:36, padding:"6px 12px", fontSize:12, fontWeight:600, fontFamily:"var(--f)", textAlign:"left", color: plainExists ? "var(--muted)" : "var(--green)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, boxShadow:"var(--sh)", cursor:"pointer" }}>
                <Icon name={plainExists ? "check" : "plus"} size={13} color={plainExists ? "var(--muted)" : "var(--green)"} />
                <span style={{ minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{plainExists ? `"${plainName}" står allerede på listen` : `Tilføj "${plainName}" som almindelig vare`}</span>
              </button>
            </div>,
            document.body
          )}
        </div>
      )}

      {!hasResultPanel && (
      <>
      {/* ── Aktiv liste ──
          Én sektion: label, brugerdefineret listenavn (ellipsis, aldrig afhængig af navnet) og en sekundær delt-status. Tryk åbner
          listevælgeren (bottom-sheet) til at skifte, oprette, tilslutte og slette lister, så administration ikke fylder på siden. */}
      <div style={{ display:"flex", alignItems:"stretch", marginBottom:12, minHeight:56, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, boxShadow:"var(--sh2)", overflow:"hidden" }}>
        <button type="button" aria-haspopup="dialog" aria-label={`Aktiv liste: ${activeList?.name || "ingen valgt"}. Skift eller administrér lister`}
          onClick={() => setShowListPicker(true)}
          style={{ flex:1, minWidth:0, display:"flex", alignItems:"center", gap:10, padding:"8px 14px", textAlign:"left", fontFamily:"var(--f)", cursor:"pointer", background:"none", border:"none" }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".8px" }}>Aktiv liste</div>
            <div style={{ fontSize:16, fontWeight:800, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginTop:1 }}>{activeList?.name || "Vælg liste"}</div>
            {activeList && <ShareStatus list={activeList} userId={userId} />}
          </div>
          <Icon name="chevronDown" size={18} color="var(--ink2)" />
        </button>
        {/* Del vises kun for egne lister: en liste, en anden har delt med mig, kan jeg ikke dele videre (den forlades under Dine lister → Rediger). */}
        {activeList && activeList.owner_id === userId && (
          <button type="button" aria-label={`Del listen ${activeList.name}`} onClick={() => setShareListId(activeList.id)}
            style={{ flexShrink:0, minWidth:56, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, padding:"0 12px", fontFamily:"var(--f)", fontSize:11, fontWeight:700, color:"var(--ink2)", cursor:"pointer", background:"none", border:"none", borderLeft:"1px solid var(--border)" }}>
            <Icon name="share" size={18} color="var(--ink2)" />
            Del
          </button>
        )}
      </div>

      {showListPicker && (
        <ListSwitcherSheet lists={lists} activeListId={activeListId} userId={userId}
          onSelect={setActiveListId} onClose={() => setShowListPicker(false)}
          createList={createList} renameList={renameList} leaveList={leaveList} joinByCode={joinByCode} onRequestDelete={setListPendingDelete} />
      )}

      {shareList && (
        <ShareListSheet list={shareList} userId={userId} familyMembers={familyMembers} loadFamilyMembers={loadFamilyMembers}
          getListAccess={getListAccess} grantAccess={grantAccess} revokeAccess={revokeAccess} setListType={setListType}
          rotateListCode={rotateListCode} onChanged={loadShoppingList}
          onGoToFamily={() => { setShareListId(null); setScreen(SCREENS.FAMILY); }}
          onClose={() => setShareListId(null)} />
      )}

      {/* ── Tom tilstand ──
          Positionen (paddingTop) er tilbageført til den delte klasses
          normale 56px (29. sept. 2026, opfølgning — en tidligere runde
          flyttede blokken ~48px op, men det skulle rulles tilbage). Cirkel-
          størrelsen og hjælpetekstens linjeafstand er fortsat lokale
          inline-overstyringer KUN på denne instans — .empty-icon/-sub er
          delte klasser brugt uændret af MadpasScreen.jsx og tre steder i
          ProfileScreen.jsx, som ikke skal påvirkes. */}
      {listsError && <LoadErrorBox what="Indkøbslisterne" onRetry={() => loadShoppingList()} />}

      {!listsError && shoppingList.length === 0 && (
        <div className="empty-state" style={{ paddingTop:16 }}>
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
              {item.ean && <ProductImage product={item} size={48} />}
              <div style={{ flex:1, minWidth:0 }}>
                {item.ean
                  ? <div className="list-name" role="link" tabIndex={0} style={{ cursor:"pointer" }}
                      onClick={() => lookupProduct(item.ean, { via: "search" })} onKeyDown={e => e.key === "Enter" && lookupProduct(item.ean, { via: "search" })}>{item.name}</div>
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
              {item.ean && <ProductImage product={item} size={48} />}
              <div style={{ flex:1, minWidth:0 }}>
                {item.ean
                  ? <div className="list-name done" role="link" tabIndex={0} style={{ cursor:"pointer" }}
                      onClick={() => lookupProduct(item.ean, { via: "search" })} onKeyDown={e => e.key === "Enter" && lookupProduct(item.ean, { via: "search" })}>{item.name}</div>
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

      </>
      )}

      {/* Bekræft-dialoger for destruktive handlinger (25. sept. 2026,
          brugerfeedback) — se ConfirmDialog i SharedComponents.jsx og
          kommentarerne ved "Slet liste"-knappen/"Ryd købte"-knappen
          ovenfor for hvorfor native confirm() er erstattet her. */}
      {confirmAdd && (
        <ConfirmDialog
          title="Konflikt med din profil"
          message={`${productDisplayName(confirmAdd)}: ${evaluateProductForProfiles(activeProfileList, confirmAdd).reasons.join(", ") || "registreret konflikt"}. Vil du alligevel tilføje produktet til listen?`}
          confirmLabel="Tilføj alligevel"
          danger={false}
          onConfirm={() => { const p = confirmAdd; setConfirmAdd(null); addProductNow(p); }}
          onCancel={() => setConfirmAdd(null)}
        />
      )}
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
