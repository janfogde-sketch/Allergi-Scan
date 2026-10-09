// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from "react";
import { SCREENS } from "./constants.jsx";
import { timeAgo, groupHistoryDuplicates, buildActiveProfileList, evaluateProductForProfiles } from "./helpers.js";
import { Icon, ProductImage, ConfirmDialog, showToast, LoadErrorBox } from "./SharedComponents.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useHistoryContext } from "./HistoryContext.jsx";
import { useAllergenPrefsContext } from "./AllergenPrefsContext.jsx";
import { UI } from "./styleUtils.js";
import { STATUS_COLOR, STATUS_ICON, HISTORY_FILTERS } from "./historyStatus.js";

// "for 51 min. siden" (Bjørn, 9. okt. 2026); "Lige nu" står uændret.
const agoText = ts => { const t = timeAgo(ts); return t === "Lige nu" ? "lige nu" : `for ${t.replace(" min siden", " min. siden")}`; };

// Vandret filterrække: diskret fade i højre side, når der er flere chips, og det aktive filter rulles altid helt ind i billedet.
function HistoryFilters({ filters, value, onChange }) {
  const ref = useRef(null);
  const [moreRight, setMoreRight] = useState(false);
  const update = useCallback(() => {
    const el = ref.current;
    if (el) setMoreRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
  }, []);
  useEffect(() => {
    update();
    const el = ref.current;
    el?.querySelector(".filter-chip.active")?.scrollIntoView({ inline:"nearest", block:"nearest", behavior:"smooth" });
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [value, update]);
  return (
    <div className="hist-filters-wrap">
      <div ref={ref} className="hist-filters" role="group" aria-label="Filtrér historik" onScroll={update}>
        {filters.map(f => (
          <button type="button" key={f.id} className={`filter-chip${value===f.id?" active":""}`} aria-pressed={value===f.id} onClick={() => onChange(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      {moreRight && <div className="hist-filters-fade" aria-hidden="true" />}
    </div>
  );
}

// SCREENS.HISTORY — udskilt fra ProfileScreen.jsx 30. sept. 2026
// (arkitektur-audit A8, én skærm = én fil). ProfileScreen ejer stadig det,
// der deles mellem skærmene (husstanden, første hent af historikken).
export default function HistoryScreen({ household, lookupProduct, onScanNow }) {
  const { user, userId, accessToken } = useAuthContext();
  // Scan-profiler = egne profiler + husstandens skrivebeskyttede konti (App.jsx, 1. okt. 2026).
  const { allergens, customAllerg, scanFamily: family, activeProfiles, setActiveProfiles } = useProfileContext();
  const { setScreen } = useNavigationContext();
  const { history, historyLoading, historyScope, historyError, loadHistory, clearHistory } = useHistoryContext();
  const { selectedENumbers } = useAllergenPrefsContext();

  // Historikken opdaterer automatisk ved hvert besøg på Historik (26. sept.
  // 2026, brugerfeedback). Før udskillelsen var det en effekt på `screen` i
  // ProfileScreen; nu monteres skærmen ved hvert besøg, så et mount-hent
  // gør det samme.
  useEffect(() => {
    if (userId && accessToken) loadHistory(historyScope);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- bevidst: historikken hentes ved hvert besøg (mount) med det aktuelle scope

  // ── Historik: kompakt filter + status pr. post ──────────────────────────────
  const [historyFilter, setHistoryFilter] = useState("all");
  // "Ryd": fjerner kun brugerens egen scanningshistorik (favoritter, produkter, profiler og lister røres ikke). Skjult, når der intet er at rydde.
  const [confirmClear, setConfirmClear] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const hasOwnHistory = history.some(h => !h.user_id || h.user_id === userId);
  const doClear = async () => {
    setConfirmClear(false);
    if (await clearHistory()) showToast("Historikken er ryddet.", "success");
    else showToast("Historikken kunne ikke ryddes. Prøv igen.", "error");
  };

  // Beregner samme sikkerhedsvurdering som Indkøbslisten (buildActiveProfileList
  // + computeProfileResults, helpers.js) — men ud fra den FROSNE `flags_triggered`
  // og `active_profiles`, som blev gemt PÅ SELVE SCANNINGSTIDSPUNKTET, i stedet
  // for appens nuværende aktive profiler/produktdata. Det gør statuslinjen i
  // selve historik-rækken konsistent med hvad der reelt blev vist dengang,
  // uanset om brugeren siden har skiftet aktive profiler. Ingrediens-/
  // næringsdata er IKKE gemt i historikken (kun allergen_flags via
  // flags_triggered) — diæt-/E-nummer-baserede advarsler indgår derfor ikke
  // her, kun det primære allergen-match, som er den dominerende faktor bag
  // "Allergi-advarsel"/"Kan indeholde spor" alligevel.
  const historyDetails = (h) => {
    const rawStatus = h.result || h.status;
    const ids = (h.active_profiles && h.active_profiles.length) ? h.active_profiles : activeProfiles;
    const profiles = buildActiveProfileList({ user, family, allergens, customAllerg, selectedENumbers, activeProfiles: ids });
    // "Tjekket for: Alle" når scanningen dækkede ALLE nuværende profiler (mig
    // + hele familien), "Carsten + Kaj" ved specifikke navne, ellers et enkelt
    // navn (26. sept. 2026, opfølgning — eksplicit ordlyd fra brugeren).
    // Sammenlignet mod den NUVÆRENDE familieliste, ikke en frosset liste fra
    // scanningstidspunktet (den findes ikke i skemaet) — en rimelig
    // forenkling, dokumenteret her fremfor at fremstå som en fejl.
    const allCurrentIds = ["me", ...family.map(m => m.id)];
    const isAllProfiles = profiles.length > 1 && allCurrentIds.every(id => ids.includes(id));
    const names = profiles.map(p => p.name.split(" ")[0]);
    const checkedFor = names.length === 0 ? null : isAllProfiles ? "Alle" : names.join(" + ");
    // "Produkt ikke fundet" står allerede som selve rækkens overskrift — en
    // ekstra statuslinje med samme tekst er ren gentagelse (26. sept. 2026,
    // brugerfeedback: "fjern den dobbelte tekst"). Ingen `text` her betyder
    // ingen tredje linje overhovedet, se render-koden.
    if (rawStatus === "not_found") return { status:"not_found", text:null, checkedFor };
    if (profiles.length === 0) return { status:null, text:null, checkedFor: null };
    // Aktuelle valg: vurderingen regnes altid mod brugerens NUVÆRENDE allergivalg (profiles ovenfor), aldrig mod en frossen status.
    // Aktuelle produktdata: har produktet stadig allergenflag, bruges de (9. okt. 2026, Bjørn). Findes de ikke (produktet er slettet,
    // eller historikken er ældre end data), bruges flagene fra scanningstidspunktet, og et "ingen match" vises da ikke som grønt:
    // det markeres som historisk og ikke verificeret. Advarsler (rød/gul) bevares, fordi de er den forsigtige side.
    const liveFlags = h.products?.allergen_flags;
    const hasLive = !!liveFlags && typeof liveFlags === "object" && Object.keys(liveFlags).length > 0;
    const flags = hasLive ? liveFlags : (h.flags_triggered || {});
    // Fælles statussystem (helpers.js): rød/orange/grå/grøn. Ingredienser kommer fra produktet (history sender ingredients_text), så E-numre og egne
    // allergier kan kontrolleres; uden dem er resultatet "Kan ikke vurderes", aldrig grønt.
    const ev = evaluateProductForProfiles(profiles, { allergen_flags: flags, ingredients_text: h.products?.ingredients_text || "" });
    const multi = profiles.length > 1;
    const detail = ev.level === "danger" || ev.level === "warn" ? ev.reasons[0] : ev.level === "unknown" ? ev.missing[0] : null;
    const text = detail ? `${ev.label} · ${detail}` : ev.label;
    if (ev.level === "safe" && !hasLive) return { status:"historical", text:"Historisk vurdering · ikke verificeret", checkedFor, multi };
    return { status: ev.level, text, checkedFor, multi };
  };

  // Genåbner et tidligere scan-resultat for SAMME profiler som ved den
  // oprindelige scanning (26. sept. 2026, brugerfeedback) — sætter appens
  // aktive profiler til den historiske liste og genbruger derefter PRÆCIS
  // samme lookupProduct-kald som resten af appen (Favoritter, "Senest
  // scannet" m.fl.), i stedet for at bygge en selvstændig visning af et
  // frosset resultat. Bevidst valg at hente FRISK produktdata i stedet for
  // at genbruge `flags_triggered` her: allergendata kan være rettet siden
  // scanningen (fx en fejlrettelse efter en indsendelse), og et frosset,
  // muligvis forældet "sikkert"-resultat ville være et reelt sikkerheds-
  // problem i en allergi-app. Ingen automatisk gendannelse af de tidligere
  // aktive profiler ved tilbage-navigation — samme model som resten af
  // appen, hvor "aktive profiler" er ét delt, globalt valg.
  const openHistoryEntry = (h) => {
    if ((h.result || h.status) === "not_found") return;
    if (h.active_profiles?.length) setActiveProfiles(h.active_profiles);
    lookupProduct(h.ean_scanned || h.code);
  };

  // Gentagne scanninger samles til én post med et antal (groupHistoryDuplicates i helpers.js, 5. okt. 2026):
  // fundne produkter kun ved samme produkt (EAN/produkt-ID), personer, resultat og data kort efter hinanden;
  // "ikke fundet" pr. stregkode som før. Kun visningen; databasen beholder hver scanning.
  const filteredHistory = historyFilter === "all"
    ? history
    : history.filter(h => historyDetails(h).status === historyFilter);
  const groupedHistory = groupHistoryDuplicates(filteredHistory);

  return (
    <div className="screen fade-in">
      {/* .screen-title er centreret som standard (theme.jsx, delt af alle
          skærme) — venstrestillet her med en lokal inline-override
          (26. sept. 2026, brugerfeedback: "centreret titel + venstre-
          stillet undertekst ser tilfældigt ud, venstrestil begge så
          siden matcher en funktionel listevisning bedre", samme
          reference som Indkøbslistens allerede venstrestillede titel).
          Ændrer IKKE den delte klasse — resten af appens skærme, som
          ikke blev nævnt, beholder deres centrerede titel uændret. */}
      <div style={{ position:"relative" }}>
        <div className="screen-title" style={{ textAlign:"left", width:"auto" }}>Historik</div>
        {hasOwnHistory && (
          <div style={{ position:"absolute", right:-8, top:"50%", transform:"translateY(-50%)" }}>
            <button type="button" aria-label="Flere valg" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}
              style={{ minWidth:44, minHeight:44, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Icon name="more" size={20} color="var(--ink2)" />
            </button>
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position:"fixed", inset:0, zIndex:40 }} />
                <div role="menu" style={{ position:"absolute", right:8, top:"100%", zIndex:41, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, boxShadow:"var(--sh)", minWidth:160, overflow:"hidden" }}>
                  <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setConfirmClear(true); }}
                    style={{ width:"100%", minHeight:44, padding:"0 14px", background:"none", border:"none", cursor:"pointer", textAlign:"left", fontFamily:"var(--f)", fontSize:13, fontWeight:600, color:"var(--ink)" }}>
                    Ryd historik
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div className="screen-sub">
        {historyScope === "family" ? "Alle scanninger i din familie." : "Alle dine tidligere scanninger."}
      </div>
      {household.length > 0 && (
        <div style={{ display:"flex", gap:8, marginBottom:10 }}>
          <button type="button" className="seg-btn" aria-pressed={historyScope==="own"} onClick={() => loadHistory("own")}
            style={{ background: historyScope==="own" ? "var(--green)" : "var(--surface)", color: historyScope==="own" ? "var(--on-green)" : "var(--muted)",
              border:`1px solid ${historyScope==="own" ? "var(--green)" : "var(--border)"}` }}>
            Mine
          </button>
          <button type="button" className="seg-btn" aria-pressed={historyScope==="family"} onClick={() => loadHistory("family")}
            style={{ background: historyScope==="family" ? "var(--green)" : "var(--surface)", color: historyScope==="family" ? "var(--on-green)" : "var(--muted)",
              border:`1px solid ${historyScope==="family" ? "var(--green)" : "var(--border)"}` }}>
            <Icon name="family" size={12} color={historyScope==="family" ? "var(--on-green)" : "var(--muted)"} /> Familien
          </button>
        </div>
      )}

      {historyLoading && (
        <div className="fade-in">
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton-row">
              <div className="skeleton-block skeleton-avatar" />
              <div style={UI.flex1}>
                <div className="skeleton-block skeleton-title" />
                <div className="skeleton-block skeleton-sub" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!historyLoading && historyError && <LoadErrorBox what="Historikken" onRetry={() => loadHistory(historyScope)} />}

      {!historyLoading && !historyError && history.length===0 && (
        <div className="empty-state">
          {/* 29. sept. 2026, brugerfeedback: lup-ikonet signalerede
              søgning, ikke historik — skiftet til "clock" (samme ikon
              som Historik-fanen i bundnavigationen). Cirklen er ~12%
              mindre (68→60px, lokal overstyring, kun denne instans —
              .empty-icon er en delt klasse brugt uændret af
              MadpasScreen.jsx og Favoritter/Familie-tomtilstandene i
              denne fil). Stavefejl "Skan" → "Scan" rettet, samme
              rettelse som HelpModal.jsx/demoSlides.jsx. */}
          <span className="empty-icon" style={{ width:60, height:60 }}><Icon name="clock" size={23} color="var(--muted)" /></span>
          <div className="empty-txt">Ingen scanninger endnu</div>
          <div className="empty-sub">Dine scannede produkter vises her.</div>
          {/* Ekstra horisontal padding (14→20px), samme højde/farve/
              kompakthed — knappen føles mere balanceret uden at blive
              fuld bredde. */}
          <button className="btn btn-primary btn-sm" style={{ ...UI.mt12, padding:"8px 20px" }} onClick={() => (onScanNow ? onScanNow() : setScreen(SCREENS.HOME))}>Scan nu</button>
        </div>
      )}

      {/* Kompakt filter — kun når historikken reelt indeholder nok til at
          et filter giver mening (26. sept. 2026, brugerfeedback: "tilføj
          ikke permanente filtre endnu ved få poster... ved ca. 10-15+
          scanninger kan der senere tilføjes"). Tærsklen er selve
          mekanismen der gør det "senere" — ingen ny kodeændring nødvendig
          når en bruger vokser forbi den. Genbruger den allerede
          eksisterende, men hidtil ubrugte .filter-chip-klasse
          (theme.jsx) i stedet for at style'e nye chips til formålet. */}
      {!historyLoading && history.length >= 10 && (
        <HistoryFilters filters={HISTORY_FILTERS} value={historyFilter} onChange={setHistoryFilter} />
      )}

      {!historyLoading && history.length > 0 && filteredHistory.length === 0 && (
        <div style={{ textAlign:"center", padding:"32px 0", fontSize:12.5, color:"var(--muted)" }}>Ingen scanninger matcher dette filter</div>
      )}

      {!historyLoading && filteredHistory.length > 0 && groupedHistory.map((h,i) => {
        const d = historyDetails(h);
        const isNotFound = d.status === "not_found";
        const name = isNotFound ? "Produkt ikke fundet" : (h.products?.name || h.name || "Ukendt produkt");
        const prod = { name: h.products?.name || h.name, brand: h.products?.brand || h.brand, image_url: h.products?.image_url || null };
        const scannedBySuffix = historyScope === "family" && h.user_id !== userId && h.users?.name ? ` · ${h.users.name.split(" ")[0]}` : "";
        return (
          <div key={h.id ?? i} className="hist-row" style={{ cursor: isNotFound ? "default" : "pointer" }}
            // Genbruger samme lookupProduct-kald som "Senest scannet" og
            // favoritter, men sætter først appens aktive profiler til den
            // historiske liste — se openHistoryEntry ovenfor for hvorfor.
            onClick={() => openHistoryEntry(h)}>
            {/* Ukendte produkter (26. sept. 2026, opfølgning) får en
                neutral stregkode-ikon-boks i stedet for ProductImages
                emoji-kategori-gæt (som for et helt ukendt produkt bare
                endte som en generisk indkøbsvogn) — samme
                charcoal/grå ikonstil som resten af appens Icon-
                bibliotek, ikke endnu en emoji-variant. */}
            {isNotFound
              ? <div style={{ width:48, height:56, background:"var(--paper2)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon name="barcode" size={19} color="var(--muted)" />
                </div>
              : <ProductImage product={prod} size={48} height={56} />}
            <div className="hist-info" style={{ marginLeft:2 }}>
              <div className="hist-name">{name}</div>
              <div className="hist-time">
                {isNotFound
                  ? `Stregkode ${h.ean_scanned || h.code || "?"} · ${h.__count > 1 ? `Scannet ${h.__count} gange · Senest ${agoText(h.scanned_at||h.timestamp)}` : timeAgo(h.scanned_at||h.timestamp)}`
                  : `${h.__count > 1 ? `Scannet ${h.__count} gange · Senest ${agoText(h.scanned_at||h.timestamp)}` : timeAgo(h.scanned_at||h.timestamp)}${d.multi && d.checkedFor ? ` · ${d.checkedFor}` : ""}`}
                {scannedBySuffix}
              </div>
              {/* Ikon + tekst + farve (aldrig farve alene), på én linje; profilnavnet står i selve statusteksten. */}
              {d.status && d.text && (
                <div className="hist-status" style={{ color: STATUS_COLOR[d.status] }}>
                  <Icon name={STATUS_ICON[d.status]} size={11} color="currentColor" />
                  <span>{d.text}</span>
                </div>
              )}
            </div>
            {/* Diskret chevron KUN på rækker der reelt kan genåbnes —
                "produkt ikke fundet" har intet resultat at vise (26.
                sept. 2026, brugerfeedback). Samme chevron-mønster som
                fx ProfileMenu.jsx's menupunkter. */}
            {isNotFound && (
              <button type="button" className="btn btn-outline btn-sm" style={{ flexShrink:0, minHeight:32, padding:"4px 10px", fontSize:11.5, fontWeight:600, borderRadius:100 }}
                onClick={(e) => { e.stopPropagation(); const ean = h.ean_scanned || h.code; if (ean) lookupProduct(ean); }}>
                Tilføj produkt
              </button>
            )}
            {!isNotFound && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ flexShrink:0 }}>
                <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
              </svg>
            )}
          </div>
        );
      })}
      {confirmClear && (
        <ConfirmDialog title="Ryd historik?" message="Alle tidligere scanninger fjernes fra din historik. Handlingen kan ikke fortrydes."
          confirmLabel="Ryd historik" onConfirm={doClear} onCancel={() => setConfirmClear(false)} />
      )}
    </div>
  );
}
