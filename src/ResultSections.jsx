// @ts-nocheck
import React from "react";
import { ALLERGENS, SCREENS, E_NUMBERS } from "./constants.jsx";
import { buildNutritionRows, traceNutNames, sulfiteAssessment, glutenCerealsIn, verifiedBadge, STORE_SOURCES, STORE_CATALOG_NAMES, productDisplayName, findProductOnList, imageAttribution, OFF_IMAGE_LICENSE_URL, verifiedImageUrl } from "./helpers.js";

import { Icon, SafetyRow, showToast, AllergenGlyph } from "./SharedComponents.jsx";





import { UI } from "./styleUtils.js";


import { S } from "./resultStyles.js";

const MAX_REASON_CHIPS = 3;

// Resultatsidens sektioner (flyttet ud af ResultScreen.jsx, ren omflytning). Får den beregnede tilstand som ctx.
export function makeResultSections(c) {
  const { ChoiceCategory, ChoiceRow, activeENumbers, activeList, activeListId, addToList, addedToList, buildAllergyChoiceRows, buildDietChoiceRows, buildENumberChoiceRows, cannotAssess, findings, hasIngredientsText, infantProfiles, infantWarnings, isFavorite, isMultiProfile, lists, liveDanger, liveWarning, overallHeadline, overallStatus, profileResults, recalls, scanResult, setAddedToList, setEditIngText, setEditNote, setEditStep, setEditType, setKnowledgeSlug, setScreen, setShowListPicker, setUnknownOpen, shoppingList, soloProfile, toggleFavorite, toggleItem, topStatus, unknownOpen, verdictHeadingRef, confirmAddOpen, setConfirmAddOpen, reasonsOpen, setReasonsOpen, greenOpen, setGreenOpen } = c;

  const renderDineValg = () => {
    if (!soloProfile) return null;
    const allergyRows = buildAllergyChoiceRows();
    const dietRows = buildDietChoiceRows();
    const eNumberRows = buildENumberChoiceRows();
    if (allergyRows.length === 0 && dietRows.length === 0 && eNumberRows.length === 0) return null;
    // Rækkefølge (10. okt. 2026): røde konflikter, orange spor, valg der ikke kan vurderes, til sidst grønne ("ikke fundet"). Røde og orange står
    // altid synlige; ukontrollerede valg samles i én foldbar linje; flere grønne samles i "N øvrige fravalg ikke fundet".
    const isUnknown = r => r.status === "unknown";
    const isGreen = r => r.status === "check";
    const allRows = [...allergyRows, ...dietRows, ...eNumberRows];
    const unknownRows = allRows.filter(isUnknown);
    const greenRows = allRows.filter(isGreen);
    const shown = rows => rows.filter(r => !isUnknown(r) && !isGreen(r));
    const COLLAPSE_GREEN_FROM = 2;
    const collapseGreen = greenRows.length >= COLLAPSE_GREEN_FROM;
    const foldHead = (open, toggle, icon, text) => (
      <button type="button" onClick={toggle} aria-expanded={open}
        style={{ display:"flex", alignItems:"center", gap:8, width:"100%", background:"none", border:"none", padding:"2px 0", cursor:"pointer", fontFamily:"var(--f)", textAlign:"left" }}>
        <Icon name={icon} size={14} color={icon === "check" ? "var(--green)" : "var(--muted)"} />
        <span style={{ flex:1, fontSize:13, fontWeight:700, color:"var(--ink)" }}>{text}</span>
        <span style={{ display:"flex", transform: open ? "rotate(180deg)" : "none", transition:"transform .2s" }}>
          <Icon name="chevronDown" size={14} color="var(--muted)" />
        </span>
      </button>
    );
    return (
      <div className="card">
        <div className="card-lbl">Dine valg</div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <ChoiceCategory title="Allergier og intolerancer" rows={shown(allergyRows)} />
          <ChoiceCategory title="Kostpræferencer" rows={shown(dietRows)} />
          <ChoiceCategory title="E-numre og øvrige fravalg" rows={shown(eNumberRows)} />
          {unknownRows.length > 0 && (
            <div>
              {foldHead(unknownOpen, () => setUnknownOpen(o => !o), "info", unknownRows.length === 1 ? "1 valg kan ikke kontrolleres" : `${unknownRows.length} valg kan ikke kontrolleres`)}
              {unknownOpen && (
                <div className="acc-body"><div style={{ paddingTop:6, paddingLeft:22 }}>
                  {unknownRows.map((r, i) => <ChoiceRow key={i} {...r} />)}
                </div></div>
              )}
            </div>
          )}
          {greenRows.length > 0 && (
            <div>
              {collapseGreen
                ? foldHead(greenOpen, () => setGreenOpen(o => !o), "check", `${greenRows.length} øvrige fravalg ikke fundet`)
                : null}
              {(!collapseGreen || greenOpen) && (
                <div className={collapseGreen ? "acc-body" : undefined}><div style={{ paddingTop: collapseGreen ? 6 : 0, paddingLeft: collapseGreen ? 22 : 0 }}>
                  {greenRows.map((r, i) => <ChoiceRow key={i} {...r} />)}
                </div></div>
              )}
              <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.45, marginTop:6 }}>
                Grøn betyder, at stoffet ikke er fundet i de registrerede oplysninger – ikke at produktet er garanteret sikkert.
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // type: "ingredients" går direkte til fotoguiden; "missing"/"correct" åbner valgmenuen med hver sin overskrift (manglende vs. forkerte oplysninger).
  const openContribution = (type, step = "guide") => {
    setEditIngText(scanResult?.ingredients || ""); setEditNote(""); setEditType(type);
    setEditStep(step);
    setScreen(SCREENS.SUGGEST_EDIT);
  };

  // Produktets række på den AKTIVE liste (samme EAN/produkt-id), udledt direkte af listen,
  // så knappen opdateres med det samme, når varen tilføjes, købes eller fjernes andetsteds.
  const listItem = findProductOnList(shoppingList, { code: scanResult.code, id: scanResult.id, name: scanResult.name });

  // Knappens tone følger statussen: grøn kun ved grøn status; spor og "kan ikke vurderes" er neutrale; konflikt er neutral mørk
  // og kræver en kort bekræftelse. Fundet i profilen (rød) afgøres af samme status som bannerets.
  const addLevel = recalls.length > 0 ? "danger" : cannotAssess ? "unknown" : isMultiProfile ? overallStatus : topStatus.level;
  const needsConflictConfirm = addLevel === "danger";
  const addBtnClass = addLevel === "safe" ? "btn-green btn-calm" : addLevel === "danger" ? "btn-dark" : "btn-outline";
  const addIconColor = addLevel === "safe" || addLevel === "danger" ? "var(--on-green)" : "var(--ink2)";

  const renderAddToList = (secondary = false) => {
    if (listItem && !listItem.checked) {
      return (
        <div style={{ marginBottom:10 }}>
          <button className={`btn btn-sm btn-full ${addBtnClass === "btn-green btn-calm" ? "btn-green btn-calm" : addBtnClass === "btn-dark" ? "btn-dark" : "btn-outline"}`} onClick={() => { toggleItem(listItem.id); showToast(`"${listItem.name}" markeret som købt`, "success"); }}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <Icon name="check" size={15} color={addIconColor} /> Markér som købt
          </button>
          {activeList?.name && <div style={{ fontSize:12, color:"var(--muted)", textAlign:"center", marginTop:6 }}>På listen "{activeList.name}"</div>}
        </div>
      );
    }
    if (listItem && listItem.checked) {
      return (
        <div style={{ marginBottom:10 }}>
          <button className="btn btn-outline btn-sm btn-full" disabled aria-live="polite"
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:"var(--green-lt)", borderColor:"var(--green-mid)", color:"var(--green)", opacity:1 }}>
            <Icon name="check" size={15} color="var(--green)" /> Købt
          </button>
          <div style={{ fontSize:12, color:"var(--muted)", textAlign:"center", marginTop:6 }}>
            {activeList?.name ? `På listen "${activeList.name}" · ` : ""}
            <button type="button" onClick={() => toggleItem(listItem.id)}
              style={{ background:"none", border:"none", padding:0, cursor:"pointer", fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--green)", textDecoration:"underline" }}>Markér som manglende</button>
          </div>
        </div>
      );
    }
    return (
      <button className={`btn ${secondary || addedToList ? "btn-outline" : addBtnClass} btn-sm btn-full`} onClick={() => handleAddToList()} aria-live="polite"
        style={{ marginBottom:10, display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          ...(addedToList ? { background:"var(--green-lt)", borderColor:"var(--green-mid)", color:"var(--green)" } : {}) }}>
        {addedToList
          ? <><Icon name="check" size={15} color="var(--green)" /> Tilføjet til indkøbsliste</>
          : <><Icon name="cart" size={15} color={secondary ? "var(--ink2)" : addIconColor} /> Tilføj til indkøbsliste</>}
      </button>
    );
  };

  // Kort lige under status, når produktet ikke kan vurderes: hvorfor, og hvad brugeren kan gøre ved det.
  const renderMissingData = () => (
    <div className="card" style={{ marginBottom:10 }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
        <Icon name={hasIngredientsText ? "info" : "list"} size={20} color="var(--ink2)" />
        <div style={S.flex1}>
          <div style={{ fontSize:14, fontWeight:800, color:"var(--ink)" }}>{hasIngredientsText ? "Oplysninger mangler" : "Ingrediensliste mangler"}</div>
          <div style={{ fontSize:12.5, color:"var(--muted)", lineHeight:1.5, marginTop:3 }}>
            {hasIngredientsText
              ? "Vi mangler allergenoplysninger og kan ikke kontrollere alle dine valg."
              : "Vi kan ikke kontrollere dine allergier og intolerancer uden ingredienslisten."}
          </div>
        </div>
      </div>
      {!scanResult.isDemo && (
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:12 }}>
          {hasIngredientsText ? (
            <button className="btn btn-primary btn-full" onClick={() => openContribution("missing", "start")}>Hjælp med produktoplysninger</button>
          ) : (
            <>
              <button className="btn btn-primary btn-full" onClick={() => openContribution("ingredients")}
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <Icon name="camera" size={16} color="var(--on-green)" /> Indsend ingrediensliste
              </button>
              <button className="btn btn-outline btn-full" onClick={() => openContribution("missing", "start")}>Hjælp med andre produktoplysninger</button>
            </>
          )}
        </div>
      )}
    </div>
  );

  const handleAddToList = (confirmed = false) => {
    if (needsConflictConfirm && confirmed !== true) { setConfirmAddOpen(true); return; }
    if (lists.length > 1) { setShowListPicker(true); return; }
    addToList({ name: productDisplayName({ name: scanResult.name, brand: scanResult.brand }), ean: scanResult.code, id: scanResult.id, image_url: scanResult.image_url }, activeListId)
      .then(ok => { if (ok) setAddedToList(true); });
  };
  const chooseListForAdd = (listId) => {
    setShowListPicker(false);
    addToList({ name: productDisplayName({ name: scanResult.name, brand: scanResult.brand }), ean: scanResult.code, id: scanResult.id, image_url: scanResult.image_url }, listId)
      .then(ok => { if (ok) setAddedToList(true); });
  };

  const renderProductHero = () => {
    const vb = verifiedBadge(scanResult.verified_status, scanResult.source);
    // Kun et billede, der med rimelig sikkerhed tilhører produktet (EAN-match), ellers neutral placeholder.
    const heroImg = verifiedImageUrl(scanResult);
    const rawName = (scanResult.name || "").trim();
    // Navn og producent vises som i listerne (producenten foran, aldrig dobbelt); kun registrerede data, intet gættes.
    const heroTitle = productDisplayName({ name: rawName, brand: scanResult.brand }) || "Produkt uden navn";
    const heroBrandInTitle = heroTitle !== rawName;
    const fav = isFavorite(scanResult.code);
    const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
    // Verdikt smeltet ind i selve produktkortet — en farvet ramme om hele kortet plus
    // en strimmel øverst med ikon + status, i stedet for en selvstændig boks under
    // kortet der bare gentog det samme. Se SECURITY/DESIGN-diskussion i PR'en for baggrund.
    //
    // FORBEDR PRODUKTSIDEN (28. sept. 2026) — ved ÉN aktiv profil bruges nu
    // den dynamiske `topStatus` med kun TO advarselsfarver: RØD forbeholdt
    // egentlige allergi-/intoleranceadvarsler, GUL/ORANGE for kostpræference-
    // /E-nummer-fravalg (et bevidst valg, ikke en sundhedsadvarsel) — i
    // stedet for scanResult.status/headline, som kun kendte tre tilstande og
    // kunne kalde et produkt "Sikkert produkt" alene fordi der ikke var et
    // match, uden at skelne fra reelt manglende data. Ved FLERE aktive
    // profiler bruges fortsat den eksisterende, samlede tre-tilstands-status
    // (overallStatus/overallHeadline) — per-profil-detaljer vises separat
    // nedenfor (renderPersonOverview).
    const isRecalled = recalls.length > 0;
    const verdictColor = isRecalled ? "var(--red)" : cannotAssess ? "var(--neutral)" : isMultiProfile
      ? ({ danger:"var(--red)", warn:"var(--amber)", safe:"var(--green)" }[overallStatus] || "var(--green)")
      : ({ danger:"var(--red)", warn:"var(--amber)", safe:"var(--green)", unknown:"var(--neutral)" }[topStatus.level] || "var(--green)");
    const verdictIcon = isRecalled ? "warning" : cannotAssess ? "info" : isMultiProfile ? (overallStatus === "safe" ? "check" : "warning") : topStatus.icon;
    const headlineText = isRecalled ? "Tilbagekaldt" : cannotAssess ? "Kan ikke vurderes" : isMultiProfile ? overallHeadline : topStatus.headline;
    // Konkrete navne under headline, vist som chips/tags (krav 1: "hvis flere
    // ting udløser resultatet, må de gerne vises som korte chips/tags") — kun
    // ved én aktiv profil, hvor topStatus.names allerede er de præcise fund.
    const topNames = !isMultiProfile && topStatus.reasons?.length > 0 ? [...new Set(topStatus.reasons)] : null;
    // Kort, konkret forklaring direkte i resultatkortet (krav 14: "Forklaring:
    // 'Produktet indeholder mælkeprotein.'") — udledt af det første reelle
    // fund, ikke en generisk sætning. Kun for de to advarselstilstande; grøn/
    // grå har allerede deres egen forklarende sætning nedenfor.
    // Årsagerne står som chips ("Indeholder æg", "Spor af soja"), så ingen ekstra forklaringssætning gentager dem.
    const topExplanation = null;
    const sourceInfoText = scanResult.source === "producer" || scanResult.verified_status === "verified"
      ? "Produktdata kommer direkte fra producenten eller en verificeret kilde."
      : scanResult.source === "off" || scanResult.source === "open_food_facts"
      ? "Produktdata kommer fra Open Food Facts og kan være brugeroprettede. Kontrollér altid produktets aktuelle emballage."
      : STORE_SOURCES.includes(scanResult.source)
      ? `Produktoplysningerne stammer fra ${STORE_CATALOG_NAMES[scanResult.source] || "butikkens"} varekatalog. Produktbilledet kan komme fra en anden kilde. Oplysningerne kan være ufuldstændige eller forældede, så kontrollér altid produktets aktuelle emballage.`
      : "Produktdata er indsendt af en EatSafe-bruger og kan indeholde fejl eller være forældede.";
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
              <h1 ref={verdictHeadingRef} tabIndex={-1} style={{ ...UI.ufs12_fw800_ls01em_ttuppercas, margin:0 }}>
                {headlineText}<span className="sr-only">: {productDisplayName({ name: scanResult.name, brand: scanResult.brand }) || "Produktet"}</span>
              </h1></>}
            </div>
            <div style={{ display:"flex", gap:8, flexShrink:0 }}>
              <button aria-label={fav ? "Fjern favorit" : "Tilføj favorit"} aria-pressed={fav} onClick={() => toggleFavorite(scanResult)}
                style={{ ...UI.uw32_h32_br50_bgrgba2552_bdnone_curpointer_dflex_aicenter_jc, width:44, height:44 }}>
                <Icon name="heart" size={18} color={fav ? "var(--red)" : "var(--ink2)"} />
              </button>
              {/* F4-9: Del vises kun, når telefonen faktisk kan dele — ellers gjorde knappen intet. */}
              {canShare && (
                <button aria-label="Del produkt" onClick={() => navigator.share({ title:scanResult.name, text:headlineText })}
                  style={{ ...UI.uw32_h32_br50_bgrgba2552_bdnone_curpointer_dflex_aicenter_jc, width:44, height:44 }}>
                  <Icon name="share" size={18} color="var(--ink2)" />
                </button>
              )}
            </div>
          </div>
          {topNames && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:6 }}>
              {(reasonsOpen ? topNames : topNames.slice(0, MAX_REASON_CHIPS)).map((n, i) => (
                <span key={i} style={{ fontSize:12, fontWeight:700, color:"#fff", background:"rgba(255,255,255,.22)", borderRadius:20, padding:"3px 10px" }}>{n}</span>
              ))}
              {/* Ved mange konflikter vises højst tre mærker; resten ligger bag "+N flere" (alle står stadig i "Dine valg"). */}
              {topNames.length > MAX_REASON_CHIPS && (
                <button type="button" onClick={() => setReasonsOpen(o => !o)} aria-expanded={reasonsOpen}
                  style={{ fontSize:12, fontWeight:700, color:"#fff", background:"transparent", border:"1px solid rgba(255,255,255,.55)", borderRadius:20, padding:"2px 10px", cursor:"pointer", fontFamily:"var(--f)" }}>
                  {reasonsOpen ? "Vis færre" : `+${topNames.length - MAX_REASON_CHIPS} flere`}
                </button>
              )}
            </div>
          )}
          {topExplanation && (
            <div style={{ fontSize:11.5, color:"rgba(255,255,255,.9)", marginTop:4, lineHeight:1.4, fontWeight:500 }}>{topExplanation}</div>
          )}
          {!isMultiProfile && topStatus.level === "safe" && (
            <div style={{ fontSize:11.5, color:"rgba(255,255,255,.9)", marginTop:4, lineHeight:1.4, fontWeight:500 }}>
              Vi fandt ingen registrerede konflikter med din profil i de tilgængelige produktoplysninger.
            </div>
          )}
          {cannotAssess && (
            <div style={{ fontSize:12, color:"rgba(255,255,255,.95)", marginTop:4, lineHeight:1.45, fontWeight:500 }}>
              Vi mangler ingrediens- eller allergenoplysninger og kan derfor ikke kontrollere alle dine valg.
            </div>
          )}
        </div>
        {/* Spor, brugeren har valgt ikke at få advarsel om (2. okt. 2026, Bjørn): synlig, men neutral og uden for det farvede banner,
            så et grønt banner ikke står med hvid tekst om spor. */}
        {!isMultiProfile && findings.ignoredTraceMatches.length > 0 && (
          <div role="note" style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"10px 14px", background:"var(--surface2)", borderBottom:"1px solid var(--border)", fontSize:12.5, lineHeight:1.45, color:"var(--ink2)" }}>
            <span style={{ flexShrink:0, marginTop:2, display:"inline-flex" }}><Icon name="info" size={14} color="var(--muted)" /></span>
            <span>Pakken nævner spor af {findings.ignoredTraceMatches.map(m => m.label.toLowerCase()).join(", ")}. Du har valgt ikke at få advarsel om spor.</span>
          </div>
        )}
        <div>
          {heroImg
            ? <div className="product-hero-imgwrap">
                <img loading="lazy" src={heroImg} alt={scanResult.name} className="product-hero-img"
                  onError={e => { const wrap = e.target.closest(".product-hero-imgwrap"); wrap.style.display="none"; wrap.nextSibling.style.display="flex"; }} />
              </div>
            : null}
          {imageAttribution(heroImg) && (
            <div style={{ fontSize:11, lineHeight:1.4, color:"var(--muted)", textAlign:"right", padding:"8px 14px 6px" }}>
              Billede:{" "}
              {scanResult.code
                ? <a href={`https://world.openfoodfacts.org/product/${encodeURIComponent(scanResult.code)}`} target="_blank" rel="noopener noreferrer" style={{ color:"var(--muted)", textDecoration:"underline" }}>Open Food Facts</a>
                : "Open Food Facts"}
              {", "}
              <a href={OFF_IMAGE_LICENSE_URL} target="_blank" rel="noopener noreferrer" style={{ color:"var(--muted)", textDecoration:"underline" }}>CC BY-SA</a>
            </div>
          )}
          <div className="product-hero-img-placeholder"
            style={{ display: heroImg ? "none" : "flex", flexDirection:"row", gap:10, height:"auto", background:"var(--paper2)", borderRadius:12, padding:"12px 16px", margin:"0 0 10px" }}>
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none" stroke="var(--border2)" strokeWidth="2">
              <rect x="4" y="10" width="40" height="30" rx="3"/>
              <circle cx="16" cy="20" r="4"/>
              <path strokeLinecap="round" d="M4 34l10-8 8 6 6-4 16 12"/>
            </svg>
            <div style={UI.ufs11_cmuted_fw500}>Ingen produktbillede</div>
          </div>
        </div>

        <div className="product-hero-body">
          {/* Dokumenteret navn: et enkeltords-navn ("Kiks") uden producent er upræcist, så mærket sættes foran; ellers navn og producent hver for sig. */}
          <div className="product-hero-name">{heroTitle}</div>
          {scanResult.brand && !heroBrandInTitle && <div className="product-hero-brand">{scanResult.brand}</div>}
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
                <Icon name="clock" size={10} color="var(--amber)" /> Afventer godkendelse
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Per-person-oversigt (multi-profil) + småbørn-advarsler + produktets
  // egne selv-deklarerede tags (fx "vegansk" sat af producenten selv — IKKE
  // en beregning mod brugerens præferencer, se renderDineValg for den).
  // Findings/E-numre/diæt-matches mod BRUGERENS præferencer vises i den
  // dedikerede renderDineValg() nedenfor.
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
              statusText={cannotAssess && (p.unknown || []).length > 0 ? ((p.unknown.length === 1) ? "1 valg kan ikke kontrolleres" : `${p.unknown.length} valg kan ikke kontrolleres`) : [...p.reasons, ...(p.ignoredTraces || []).map(id => `Spor af ${ALLERGENS.find(a => a.id === id)?.label || id} (du har valgt ikke at få advarsel)`)].join(" · ") || "Ingen registrerede konflikter"}
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
              <Icon name="warning" size={13} color="var(--amber)" />
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

  // Kun EGENTLIGE allergener (ALLERGENS' eget type==="allergi") må stå i
  // "Andre deklarerede allergener" — en intolerance som laktoseintolerance/
  // gluten er IKKE et allergen og hørte tidligere fejlagtigt med i denne
  // liste (FORBEDR PRODUKTSIDEN, 28. sept. 2026, bruger-rapporteret fund).
  const isRealAllergen = (id) => ALLERGENS.find(a => a.id === id)?.type === "allergi";

  const renderOtherAllergens = () => {
    const flags = scanResult.allergen_flags;
    // Gluten er en intolerance i appen, men kornsorter med gluten (hvede, rug, byg, havre) er også EU-allergener, så produktets gluten vises
    // her som eget tag, hvis ingen aktiv profil har valgt gluten/cøliaki. Havre/byg/rug/spelt vises i parentes, når de står i ingredienslisten.
    const cereals = glutenCerealsIn(scanResult.ingredients);
    const glutenState = flags.gluten === "yes" || cereals.length > 0 ? "yes" : flags.gluten === "traces" ? "traces" : null;
    // Sulfitter (svovl) er et mærkningspligtigt EU-allergen, selv om de i appen er en intolerance, og vises derfor her, når de er deklareret.
    const isRealOrGluten = (id) => isRealAllergen(id) || id === "gluten" || id === "svovl";
    const present = Object.entries({ ...flags, ...(glutenState ? { gluten: glutenState } : {}) }).filter(([k,v]) => v==="yes"    && isRealOrGluten(k));
    const traces  = Object.entries({ ...flags, ...(glutenState ? { gluten: glutenState } : {}) }).filter(([k,v]) => v==="traces" && isRealOrGluten(k));
    const myAllergens  = new Set([...liveDanger, ...liveWarning]);
    if (myAllergens.has("coeliaki")) myAllergens.add("gluten");
    const glutenLabel = (a) => (a.id === "gluten" && cereals.length > 0 ? `Gluten (${cereals.join(", ")})` : a.label);
    // Samme oplysning vises kun én gang: et allergen, der både er deklareret og står som spor, vises som indhold; og "Gluten (hvede)" udelades,
    // når "Hvede" allerede står (samme kilde).
    const wheatOnly = cereals.length > 0 && cereals.every(c => c.toLowerCase() === "hvede");
    const dupGluten = (k) => k === "gluten" && wheatOnly && flags.hvede === "yes";
    const otherPresentAll = present.filter(([k]) => !myAllergens.has(k));
    const presentIds = new Set(otherPresentAll.map(([k]) => k));
    const otherTraces  = traces.filter(([k])  => !myAllergens.has(k) && !presentIds.has(k) && !dupGluten(k));
    const nutNames = traceNutNames(scanResult.ingredients);
    // Dokumentationsgrundlag (10. okt. 2026): "Deklareret" = står i produktets egne oplysninger. "Udledt" = EatSafe har sluttet det af ingredienserne,
    // fx gluten ud fra byg uden at ordet gluten står der, eller mulige sulfitter ud fra et E-nummer uden deklareret sulfit eller mængde.
    // Gluten er udledt, når ordet "gluten" ikke står i produktets egne oplysninger: EatSafe har sluttet det af kornsorten (hvede, byg, rug, havre ...).
    const derivedGluten = !/gluten/i.test(scanResult.ingredients || "");
    const glutenSources = cereals.length > 0 ? cereals.map(c => c.toLowerCase()) : (flags.hvede === "yes" ? ["hvede"] : []);
    const sulfiteInferred = sulfiteAssessment(scanResult.ingredients) === "unknown" && flags.svovl === "unknown" && !myAllergens.has("svovl");
    const otherPresent = otherPresentAll.filter(([k]) => !(k === "gluten" && derivedGluten));
    const derivedList = [
      ...(otherPresentAll.some(([k]) => k === "gluten") && derivedGluten ? ["gluten"] : []),
      ...(sulfiteInferred ? ["svovl"] : []),
    ];
    if (!otherPresent.length && !otherTraces.length && !derivedList.length) return null;
    const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
    const sulfiteCodes = [...new Set((String(scanResult.ingredients || "").match(/\bE[\s-]?22[0-8]\b/gi) || []).map(c => c.replace(/[\s-]/g, "").toUpperCase()))].join(", ");
    const chip = (k, traceOnly, derived = false) => {
      const a = ALLERGENS.find(x => x.id === k);
      if (!a) return null;
      // Udledt gluten: selve kornet nævnes, ikke et ord, der ikke står på pakken ("Byg (glutenholdigt korn)").
      const nonWheat = glutenSources.filter(c => c !== "hvede");
      const baseLabel = derived && k === "gluten"
        ? (nonWheat.length > 0 ? `${cap(glutenSources.join(", "))} (${glutenSources.length > 1 ? "glutenholdige korn" : "glutenholdigt korn"})` : "Gluten (fra hvede)")
        : derived && k === "svovl" ? `Mulige sulfitter${sulfiteCodes ? ` (${sulfiteCodes})` : ""}`
        : glutenLabel(a);
      const label = traceOnly ? `Spor af ${baseLabel.toLowerCase()}${a.id === "noedder" && nutNames.length ? ` (${nutNames.join(", ")})` : ""}` : baseLabel;
      return (
        <button type="button" key={(traceOnly ? "t-" : derived ? "d-" : "p-") + k} className="tag"
          onClick={() => { setScreen(SCREENS.KNOWLEDGE); setKnowledgeSlug(k); }}
          aria-label={`${derived ? "Udledt: " : traceOnly ? "Spor af " : "Deklareret: "}${baseLabel.toLowerCase()} – læs mere`}
          style={{ background:"var(--surface2)", color:"var(--ink2)", borderColor:"var(--border2)", cursor:"pointer", fontFamily:"var(--f)" }}>
          <AllergenGlyph a={a} size={13} /> {label}{derived && <span style={{ fontWeight:500, color:"var(--muted)" }}> · udledt</span>} <Icon name="chevronRight" size={11} color="var(--muted)" />
        </button>
      );
    };
    const subHead = { fontSize:10, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".6px", marginBottom:4 };
    return (
      <div className="card">
        <div className="card-lbl">Andre allergener i produktet</div>
        <div style={UI.ufs11_cmuted_mb8}>Ikke blandt dine valg</div>
        {otherPresent.length > 0 && (
          <div style={UI.mb6}>
            <div style={subHead}>Deklareret på produktet</div>
            <div className="tags">{otherPresent.map(([k]) => chip(k, false))}</div>
          </div>
        )}
        {derivedList.length > 0 && (
          <div style={UI.mb6}>
            <div style={subHead}>Udledt af ingredienser</div>
            <div className="tags">{derivedList.map(k => chip(k, false, true))}</div>
            <div style={{ fontSize:11, color:"var(--muted)", marginTop:4, lineHeight:1.4 }}>Udledt af EatSafe ud fra ingredienslisten. Det er ikke deklareret som allergen på produktet{sulfiteInferred ? ", og mængden af sulfit er ukendt" : ""}.</div>
          </div>
        )}
        {otherTraces.length > 0 && (
          <div>
            <div style={subHead}>Sporoplysninger</div>
            <div className="tags">{otherTraces.map(([k]) => chip(k, true))}</div>
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
          <div style={{ fontSize:11, color:"var(--muted)" }}>{eNums.length === 1 ? "1 registreret" : `${eNums.length} registrerede`}</div>
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {eNums.map(e => {
            const info = E_NUMBERS[e];
            const name = info ? info.split("—")[0].trim() : null;
            const isWatched = activeENumbers?.includes(e);
            return (
              <button type="button" key={e}
                aria-label={`${e}${name ? ", " + name : ""}${isWatched ? ", konflikt med din profil" : ""} – læs mere`}
                onClick={() => {
                  const slug = "e-" + e.toLowerCase().replace(/^e/, "");
                  setKnowledgeSlug(slug);
                  setScreen(SCREENS.KNOWLEDGE);
                }}
                style={{
                  display:"inline-flex", alignItems:"center", gap:4, maxWidth:"100%", boxSizing:"border-box", lineHeight:1.35,
                  fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:8,
                  cursor:"pointer", transition:"all .1s", fontFamily:"var(--f)", textAlign:"left",
                  background: isWatched ? "var(--red-lt)" : "var(--paper2)",
                  color: isWatched ? "var(--red)" : "var(--ink2)",
                  border: `1px solid ${isWatched ? "var(--red-md)" : "var(--border2)"}`,
                }}>
                <span style={UI.uffmonospac}>{e}</span>
                {name && <span style={{ fontWeight:400, color: isWatched ? "var(--red)" : "var(--muted)" }}>— {name}</span>}
                {isWatched && <Icon name="warning" size={10} color="var(--red)" />}
                <Icon name="chevronRight" size={10} color="var(--muted)" />
              </button>
            );
          })}
        </div>
        <div style={{ fontSize:11, lineHeight:1.4, color:"var(--muted)", marginTop:10 }}>
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
    const rows = buildNutritionRows(scanResult.nutrition);
    // Ingen brugbare næringsdata — skjul HELE sektionen (krav 10/13),
    // ikke en "hjælp os"-prompt som ved manglende ingredienser. Den
    // asymmetri er bevidst: krav 13 nævner "ingen næringsdata → skjul",
    // men "ingen ingrediensdata → vis manglende-data-status" separat.
    if (!rows.length) return null;
    return (
      <div className="card">
        <div className="card-lbl" style={cannotAssess ? { marginBottom:4 } : undefined}>Næringsindhold pr. {nutritionUnit}</div>
        {cannotAssess && <div style={{ fontSize:11.5, color:"var(--muted)", marginBottom:8, lineHeight:1.4 }}>Næringsdata findes, men siger ikke noget om dine allergier.</div>}
        <div style={UI.udflex_fdcolumn}>
          {rows.map(({ label, value, sub }, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:12, minHeight:36, boxSizing:"border-box", padding:"8px 0", borderBottom: i < rows.length-1 ? "1px solid var(--border)" : "none" }}>
              <span style={{ fontSize:13, lineHeight:1.4, color: sub ? "var(--muted)" : "var(--ink2)", paddingLeft: sub ? 12 : 0 }}>{label}</span>
              <span style={{ ...S.h13b, lineHeight:1.4, textAlign:"right", whiteSpace:"nowrap", fontVariantNumeric:"tabular-nums" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return { handleAddToList, chooseListForAdd, openContribution, renderDineValg, renderAddToList, renderMissingData, renderProductHero, renderPersonOverview, renderOtherAllergens, renderENumbers, renderNutrition };
}
