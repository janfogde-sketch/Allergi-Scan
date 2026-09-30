// @ts-nocheck
import React, { useState, useEffect } from "react";
import { SCREENS } from "./constants.jsx";
import { timeAgo, buildActiveProfileList, computeProfileResults, profileConflictLabel } from "./helpers.js";
import { Icon, ProductImage } from "./SharedComponents.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { useHistoryContext } from "./HistoryContext.jsx";
import { useAllergenPrefsContext } from "./AllergenPrefsContext.jsx";
import { UI } from "./styleUtils.js";
import { STATUS_COLOR, STATUS_ICON, HISTORY_FILTERS } from "./historyStatus.js";

// SCREENS.HISTORY — udskilt fra ProfileScreen.jsx 30. sept. 2026
// (arkitektur-audit A8, én skærm = én fil). ProfileScreen ejer stadig det,
// der deles mellem skærmene (husstanden, første hent af historikken).
export default function HistoryScreen({ household, lookupProduct }) {
  const { user, userId, accessToken } = useAuthContext();
  const { allergens, customAllerg, family, activeProfiles, setActiveProfiles } = useProfileContext();
  const { setScreen } = useNavigationContext();
  const { history, historyLoading, historyScope, loadHistory } = useHistoryContext();
  const { selectedENumbers } = useAllergenPrefsContext();

  // Historikken opdaterer automatisk ved hvert besøg på Historik (26. sept.
  // 2026, brugerfeedback). Før udskillelsen var det en effekt på `screen` i
  // ProfileScreen; nu monteres skærmen ved hvert besøg, så et mount-hent
  // gør det samme.
  useEffect(() => {
    if (userId && accessToken) loadHistory(historyScope);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Historik: kompakt filter + status pr. post ──────────────────────────────
  const [historyFilter, setHistoryFilter] = useState("all");

  // Beregner samme sikkerhedsvurdering som Indkøbslisten (buildActiveProfileList
  // + computeProfileResults, helpers.js) — men ud fra den FROSNE `flags_triggered`
  // og `active_profiles`, som blev gemt PÅ SELVE SCANNINGSTIDSPUNKTET, i stedet
  // for appens nuværende aktive profiler/produktdata. Det gør statuslinjen i
  // selve historik-rækken konsistent med hvad der reelt blev vist dengang,
  // uanset om brugeren siden har skiftet aktive profiler. Ingrediens-/
  // næringsdata er IKKE gemt i historikken (kun allergen_flags via
  // flags_triggered) — diæt-/E-nummer-baserede advarsler indgår derfor ikke
  // her, kun det primære allergen-match, som er den dominerende faktor bag
  // "Konflikt"/"Kan ikke afgøres sikkert" alligevel.
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
    const flags = h.flags_triggered || {};
    const results = computeProfileResults(profiles, { allergen_flags: flags, ingredients:"", nutrition:null, productENumbers:[] });
    const conflict = profileConflictLabel(results, { maxNames: 2 });
    if (conflict) return { status:"danger", text: conflict, checkedFor };
    if (results.some(r => r.status === "warn")) return { status:"warn", text:"Kan ikke afgøres sikkert", checkedFor };
    return { status:"safe", text:"Matcher valgte profiler", checkedFor };
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

  // Samler gentagne "produkt ikke fundet"-scanninger af SAMME stregkode til
  // én række med et antal (26. sept. 2026, brugerfeedback: "historikken kan
  // hurtigt blive fyldt med identiske mislykkede scanninger") — kun for
  // ikke-fundne produkter, IKKE for fundne produkter (at scanne den samme
  // yoghurt to gange med to ugers mellemrum er reel, adskilt historik, ikke
  // støj, der skal slås sammen). `history` kommer allerede nyest-først fra
  // API'et, så den FØRSTE forekomst af et EAN i iterationsrækkefølgen er
  // automatisk den seneste — den bruges som rækkens tidspunkt/plads i
  // listen, øvrige forekomster tælles ind i samme objekt og udelades selv.
  const groupNotFoundDuplicates = (list) => {
    const seenByEan = new Map();
    const result = [];
    for (const h of list) {
      const isNF = (h.result || h.status) === "not_found";
      const ean = h.ean_scanned || h.code;
      if (!isNF || !ean) { result.push(h); continue; }
      const existing = seenByEan.get(ean);
      if (existing) { existing.__count++; continue; }
      const group = { ...h, __count: 1 };
      seenByEan.set(ean, group);
      result.push(group);
    }
    return result;
  };

  const filteredHistory = historyFilter === "all"
    ? history
    : history.filter(h => historyDetails(h).status === historyFilter);
  const groupedHistory = groupNotFoundDuplicates(filteredHistory);

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
      <div className="screen-title" style={{ textAlign:"left", width:"auto" }}>Historik</div>
      <div className="screen-sub">
        {historyScope === "family" ? "Alle scanninger i din husstand." : "Alle dine tidligere scanninger."}
      </div>
      {household.length > 0 && (
        <div style={{ display:"flex", gap:8, marginBottom:10 }}>
          <div onClick={() => loadHistory("own")}
            style={{ flex:1, textAlign:"center", padding:"8px", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:700,
              background: historyScope==="own" ? "var(--green)" : "var(--surface)", color: historyScope==="own" ? "var(--on-green)" : "var(--muted)",
              border:`1px solid ${historyScope==="own" ? "var(--green)" : "var(--border)"}` }}>
            Mine
          </div>
          <div onClick={() => loadHistory("family")}
            style={{ flex:1, textAlign:"center", padding:"8px", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:700,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              background: historyScope==="family" ? "var(--green)" : "var(--surface)", color: historyScope==="family" ? "var(--on-green)" : "var(--muted)",
              border:`1px solid ${historyScope==="family" ? "var(--green)" : "var(--border)"}` }}>
            <Icon name="family" size={12} color={historyScope==="family" ? "var(--on-green)" : "var(--muted)"} /> Husstanden
          </div>
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

      {!historyLoading && history.length===0 && (
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
          <div className="empty-sub">Scan dit første produkt for at se din historik her</div>
          {/* Ekstra horisontal padding (14→20px), samme højde/farve/
              kompakthed — knappen føles mere balanceret uden at blive
              fuld bredde. */}
          <button className="btn btn-primary btn-sm" style={{ ...UI.mt12, padding:"8px 20px" }} onClick={() => setScreen(SCREENS.HOME)}>Scan nu</button>
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
        <div style={{ ...UI.wrapGap7, marginBottom:12 }}>
          {HISTORY_FILTERS.map(f => (
            <div key={f.id} className={`filter-chip${historyFilter===f.id?" active":""}`} onClick={() => setHistoryFilter(f.id)}>
              {f.label}
            </div>
          ))}
        </div>
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
              ? <div style={{ width:40, height:40, background:"var(--paper2)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon name="barcode" size={19} color="var(--muted)" />
                </div>
              : <ProductImage product={prod} size={40} />}
            <div className="hist-info" style={{ marginLeft:2 }}>
              <div className="hist-name">{name}</div>
              <div className="hist-time">
                {isNotFound
                  ? `Stregkode ${h.ean_scanned || h.code || "?"} · ${h.__count > 1 ? `Scannet ${h.__count} gange, senest ${timeAgo(h.scanned_at||h.timestamp)}` : `${timeAgo(h.scanned_at||h.timestamp)}`}`
                  : `${timeAgo(h.scanned_at||h.timestamp)}${d.checkedFor ? ` · Tjekket for: ${d.checkedFor}` : ""}`}
                {scannedBySuffix}
              </div>
              {/* Altid ikon + tekst + farve, aldrig farve alene (26. sept.
                  2026, brugerfeedback) — samme mønster som Indkøbslistens
                  itemStatus-linje (ListScreen.jsx). Ingen linje her for
                  "produkt ikke fundet" (d.text er bevidst null, se
                  historyDetails) — overskriften siger det allerede,
                  en gentagelse nedenunder var det brugeren bad om at
                  fjerne. */}
              {d.status && d.text && (
                <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:3, fontSize:11, fontWeight:700, color: STATUS_COLOR[d.status] }}>
                  <Icon name={STATUS_ICON[d.status]} size={11} color="currentColor" />
                  {d.text}
                </div>
              )}
            </div>
            {/* Diskret chevron KUN på rækker der reelt kan genåbnes —
                "produkt ikke fundet" har intet resultat at vise (26.
                sept. 2026, brugerfeedback). Samme chevron-mønster som
                fx ProfileMenu.jsx's menupunkter. */}
            {!isNotFound && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ flexShrink:0 }}>
                <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}
