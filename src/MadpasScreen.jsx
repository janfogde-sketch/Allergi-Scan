// @ts-nocheck
import React from "react";
import { ALLERGENS, SCREENS, DIETS_ENABLED, MADPAS_LANGUAGES } from "./constants.jsx";
import { initials } from "./helpers.js";
import { Icon, AllergenGlyph, InfoSheet } from "./SharedComponents.jsx";
import { madpasAllergenLabel, madpasDietLabel, madpasAllergenExamples, madpasSafetyNote, madpasAllergyStatement, madpasCrossContactNote, madpasDietMessage, MADPAS_SECTIONS_T, MADPAS_INTOLERANCE_HEADLINE_T, MADPAS_EXAMPLES_LABEL_T } from "./madpasText.js";
import { preloadMadpasText } from "./useMadpas.js";

// Gør oplæsningen klar, så "Læs højt" kan starte direkte fra knaptrykket.
preloadMadpasText();
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { UI } from "./styleUtils.js";

// Stregikon pr. allergen-id på Madpas-kortet (Icon i SharedComponents.jsx).
// Ukendte id'er falder tilbage til "warning".
const MADPAS_ALLERGEN_ICON = {
  maelkeallergi: "milk",
  hvede: "wheat",
  gluten: "bread",
  coeliaki: "bread",
  laktose: "glass",
  aeg: "egg",
  noedder: "acorn",
  jordnoedder: "peanut",
  soja: "soy",
  fisk: "fish",
  skaldyr: "shrimp",
  bloeddyr: "shell",
  selleri: "celery",
  sennep: "mustard",
  sesam: "sesame",
  lupin: "lupin",
  svovl: "wine",
};

// ── Madpas ───────────────────────────────────────────────────────────────────
// Formål: en tjener, butiksansat, hotel- eller cafémedarbejder skal kunne
// forstå de vigtigste kost-/allergioplysninger på FÅ SEKUNDER — Madpas er
// IKKE kun til restauranter. Strukturerede sektioner efter type (FOOD
// ALLERGIES/INTOLERANCES/DIET, se ALLERGENS[].type) i stedet for én generisk
// "kan ikke spise"-liste, og et madpas der ALTID afspejler den valgte
// profils AKTUELLE data (allergener/custom/diæter — se mpDiets i App.jsx for
// hvorfor profil-scoping betyder noget).
//
// 26. sept. 2026, polish-runde: link-/QR-deling, PDF/print og E-numre er
// fjernet helt fra Madpas — Madpas er udelukkende en skærm-baseret
// fremvisningsfunktion (+ oplæsning), ingen deling.
//
// 27. sept. 2026, finpolish-runde: hvert allergen/fritekst-hensyn vises nu
// som sin EGEN tydelige informationsblok (ikon+navn som det mest fremtræ-
// dende element, jf. "kan forstås på 2-3 sekunder") i stedet for en delt
// liste med én kombineret sikkerheds-sætning for hele sektionen — se
// renderStaffView() nedenfor. Sikkerhedsteksten er samtidig gjort mere
// præcis ("... eller ingredienser fremstillet af X"), og en ny, bevidst
// OPT-IN krydskontaminerings-advarsel er tilføjet (default fra — EatSafe må
// ikke selv antage alvorlighedsgraden af brugerens allergi).
export default function MadpasScreen({
  madpasLang, setMadpasLang,
  madpasProfileId, setMadpasProfileId,
  madpasSpeaking, setMadpasSpeaking,
  madpasWaiterView, setMadpasWaiterView,
  madpasCrossContact, setMadpasCrossContact,
  mpAllergens, mpCustom, mpDiets,
  langOpen, setLangOpen,
  madpasSpeak,
}) {
  const { user } = useAuthContext();
  // Scan-profiler = egne profiler + husstandens skrivebeskyttede konti (App.jsx, 1. okt. 2026).
  const { scanFamily: family } = useProfileContext();
  const { screen } = useNavigationContext();
  const [showCrossContactInfo, setShowCrossContactInfo] = React.useState(false);

  // ── Grupperede oplysninger efter type — fælles for preview og fremvis-
  // ningsskærmen, så begge altid viser præcis det samme. ALLERGENS.type
  // ("allergi"/"intolerance") styrer grupperingen — fritekst-tilføjelser
  // ("Skriv selv") kan ikke kategoriseres og lægges i allergi-sektionen
  // som den mest forsigtige antagelse.
  const buildGroups = (lang) => {
    const allergenItems = mpAllergens.map(id => ALLERGENS.find(a => a.id === id)).filter(Boolean);
    return {
      // Cøliaki er en intolerance-type, men får sit eget budskab og vises derfor i
      // samme sektion som allergierne (2. okt. 2026).
      allergyItems: allergenItems.filter(a => a.type === "allergi" || a.id === "coeliaki"),
      intoleranceItems: allergenItems.filter(a => a.type === "intolerance" && a.id !== "coeliaki"),
      customItems: (mpCustom || []).filter(c => typeof c === "string" && !mpAllergens.includes(c)),
      dietItems: (mpDiets || []).map(id => ({ id, label: madpasDietLabel(id, lang) })).filter(x => x.label),
    };
  };

  const toggleCrossContact = () => {
    const next = !madpasCrossContact;
    setMadpasCrossContact(next);
    localStorage.setItem("as_madpas_cross_contact", next ? "1" : "0");
  };

  const renderStaffView = () => {
    const lang = madpasLang;
    const rtl = MADPAS_LANGUAGES.find(l => l.code === lang)?.rtl;
    const langInfo = MADPAS_LANGUAGES.find(l => l.code === lang);
    const { allergyItems, intoleranceItems, customItems, dietItems } = buildGroups(lang);
    // Bruges til den kombinerede krydskontaminerings-sætning nedenfor —
    // IKKE til den enkelte sikkerhedstekst, som nu genereres pr. emne.
    const crossContactNames = [...allergyItems.filter(a => a.id !== "coeliaki").map(a => madpasAllergenLabel(a, lang)), ...customItems];

    // Typografisk hierarki (27. sept. 2026, Madpas-finpolish nr. 2), i
    // prioriteret rækkefølge: 1) allergenets/diætens navn (itemName) —
    // det klart mest fremtrædende element, 2) den konkrete besked til
    // personalet (safetyLine/dietMsg) — læsbar og tydelig, men må ikke
    // konkurrere med navnet, 3) kategorioverskrift+headline (sectionLbl/
    // headline) — bevidst SMÅ/DÆMPEDE, kun kontekst, 4) "May be found in"
    // (exampleLine) — klart sekundær, mindst fremtrædende tekst-element.
    const sectionLbl = { fontSize:14, fontWeight:800, textTransform:"uppercase", letterSpacing:"1px", color:"var(--muted)", marginBottom:12 };
    const headline = { fontSize:14, fontWeight:600, color:"var(--ink2)", marginBottom:12 };
    // Hvert hensyn er sin EGEN informationsblok med luft mellem — ikke
    // en delt liste med skillelinjer (krav 6: "må ikke blot blive vist
    // som små chips ... vis hver allergi som sin egen tydelige
    // informationsblok"). Navnet er bevidst det mest fremtrædende
    // element på hele skærmen (krav 3). marginBottom rundet til appens
    // faste spacing-skala (4/6/8/10/12/14/16/20/24/32, se
    // .claude/rules/design-tokens.md) i stedet for "næsten runde" 26px.
    // Fast afstandssystem (1. okt. 2026, final polish): 28 mellem blokke i en liste, 32 mellem
    // sektioner, 12 under sektionsoverskrift — via flex-gap, så den sidste blok aldrig efterlader
    // ekstra tom plads mod Læs højt-knappen.
    const itemBlock = {};
    const itemList = { display:"flex", flexDirection:"column", gap:28 };
    const itemHeadRow = { display:"flex", alignItems:"center", gap:12 };
    const itemIcon = { fontSize:40, lineHeight:1, flexShrink:0, width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center" };
    // Alle allergener og intolerancer vises med appens egne stregikoner i
    // samme rolige grønne flise som mælk (1. okt. 2026), i stedet for de
    // illustrerede ikoner, som lignede emoji. Egne tilføjelser får advarsels-
    // ikonet i samme flise.
    const iconTile = { ...itemIcon, borderRadius:14, background:"var(--green-lt)" };
    const renderIconTile = (name) => <span style={iconTile}><Icon name={name} size={28} color="var(--green)" /></span>;
    const renderAllergenIcon = (a) => renderIconTile(MADPAS_ALLERGEN_ICON[a.id] || "warning");
    const itemName = { fontSize:32, fontWeight:800, color:"var(--ink)", lineHeight:1.15, minWidth:0, overflowWrap:"anywhere" };
    // Korte, tydeligt mærkede fødevare-eksempler under selve allergenet —
    // bevidst LILLE og MUTED sammenlignet med itemName, så allergenet selv
    // altid forbliver det mest fremtrædende element på skærmen.
    const exampleLine = { fontSize:14, color:"var(--muted)", marginTop:4, lineHeight:1.5, paddingInlineStart:56 };
    // Direkte to-sætnings-budskab pr. fødevareallergi (1. okt. 2026):
    // "I have a food allergy to milk." (stærkest) + sikkerhedssætningen.
    const statementLine = { fontSize:17, fontWeight:800, color:"var(--ink)", lineHeight:1.5 };
    // paddingInlineStart (ikke paddingLeft), så indrykningen også flugter på arabisk (RTL).
    const messageBlock = { marginTop:10, paddingInlineStart:56 };
    const messageSafety = { fontSize:15.5, fontWeight:600, color:"var(--ink2)", marginTop:4, lineHeight:1.5 };
    const renderExamples = (allergenId) => {
      const examples = madpasAllergenExamples(allergenId, lang);
      if (examples.length === 0) return null;
      return (
        <div style={exampleLine}>
          <span style={{ fontWeight:600 }}>{MADPAS_EXAMPLES_LABEL_T[lang] || MADPAS_EXAMPLES_LABEL_T.en}</span> {examples.join(" · ")}
        </div>
      );
    };

    return (
      <div style={{ position:"fixed", inset:0, zIndex:9999, background:"var(--paper)", display:"flex", flexDirection:"column" }} dir={rtl ? "rtl" : "ltr"} lang={langInfo?.bcp || lang}>

        {/* Stort flag/sprog øverst + tydelig-men-diskret luk-knap. */}
        <div style={{ padding:"20px 24px 8px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {/* Neutralt globusikon i stedet for landeflag (1. okt. 2026) — et
                sprog er ikke ét land; samme ikon på alle sprog. */}
            <Icon name="globe" size={24} color="var(--ink2)" />
            <span style={{ fontSize:17, color:"var(--ink2)", fontWeight:700, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{langInfo?.name}</span>
          </div>
          <button className="mp-close-btn" lang="da" onClick={() => { setMadpasWaiterView(false); if(madpasSpeaking){ window.speechSynthesis?.cancel(); setMadpasSpeaking(false); } }} aria-label="Luk">
            <Icon name="x" size={20} color="var(--ink2)" />
          </button>
        </div>

        {/* Ren fremvisningsskærm — ingen hovedmenu/feedback/bundnav, kun
            ægte indhold. Ingen lang høflighedstekst der skubber
            budskabet ned. Bund-padding er bevidst rummelig (40px, ikke
            kun 24-32px) — footeren nedenfor er et flex-søskende-element
            (flexShrink:0), så scrollområdet aldrig kan blive dækket af
            den, men den ekstra luft sikrer at sidste linje altid har
            synlig afstand til Read aloud-knappen i stedet for at ende
            lige der (27. sept., finpolish nr. 2, punkt 5). */}
        {/* Indholdet starter lige under sproglinjen (1. okt. 2026: den
            lodrette centrering gav en stor tom flade øverst). */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 24px 20px", display:"flex", flexDirection:"column" }}>
          {/* Ved kort indhold fordeles den ledige plads lidt oppefra (maks. 24px), så indholdet
              ikke klumper sig helt øverst, og der ikke står en stor tom flade over Læs højt. */}
          <div aria-hidden="true" style={{ flex:"1 1 0", minHeight:0, maxHeight:24 }} />
          <div style={{ flexShrink:0, display:"flex", flexDirection:"column", gap:32 }}>
          {(allergyItems.length > 0 || customItems.length > 0) && (
            <div>
              {/* "I am allergic to:" er fjernet (1. okt. 2026) — hver allergi
                  har nu sin egen direkte sætning nedenfor. */}
              <div style={sectionLbl}>{MADPAS_SECTIONS_T.allergies[lang] || MADPAS_SECTIONS_T.allergies.en}</div>
              <div style={itemList}>
                {allergyItems.map(a => (
                  <div key={a.id} style={itemBlock}>
                    <div style={itemHeadRow}>
                      {renderAllergenIcon(a)}
                      <span style={itemName}>{madpasAllergenLabel(a, lang)}</span>
                    </div>
                    {renderExamples(a.id)}
                    <div style={messageBlock}>
                      <div style={statementLine}>{madpasAllergyStatement(madpasAllergenLabel(a, lang), lang, a.id)}</div>
                      <div style={messageSafety}>{madpasSafetyNote(madpasAllergenLabel(a, lang), lang, a.id)}</div>
                    </div>
                  </div>
                ))}
                {customItems.map((c,i) => (
                  <div key={`c${i}`} style={itemBlock}>
                    <div style={itemHeadRow}>
                      {renderIconTile("warning")}
                      <span style={itemName}>{c}</span>
                    </div>
                    <div style={messageBlock}>
                      <div style={statementLine}>{madpasAllergyStatement(c, lang)}</div>
                      <div style={messageSafety}>{madpasSafetyNote(c, lang)}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Krydskontaminering — KUN vist hvis brugeren selv har
                  aktiveret den i Madpas-indstillingerne (krav 7). Én
                  kombineret sætning for hele sektionen, ikke pr. emne.
                  Bevidst en anelse mindre/lettere end de individuelle
                  sikkerhedstekster (fontWeight 600 fremfor 700, 14.5px
                  fremfor 15.5px) — tydelig, men sekundær i forhold til
                  selve allergierne (27. sept., finpolish nr. 2, punkt 3). */}
              {madpasCrossContact && crossContactNames.length > 0 && (
                <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginTop:24, padding:"12px 14px", background:"var(--amber-lt)", border:"1px solid rgba(181,121,26,.22)", borderRadius:12 }}>
                  <span style={{ flexShrink:0, marginTop:2 }}><Icon name="warning" size={17} color="var(--amber)" /></span>
                  <span style={{ fontSize:14.5, fontWeight:600, color:"var(--ink)", lineHeight:1.5 }}>
                    {madpasCrossContactNote(crossContactNames, lang)}
                  </span>
                </div>
              )}
            </div>
          )}

          {intoleranceItems.length > 0 && (
            <div>
              <div style={sectionLbl}>{MADPAS_SECTIONS_T.intolerances[lang] || MADPAS_SECTIONS_T.intolerances.en}</div>
              <div style={headline}>{MADPAS_INTOLERANCE_HEADLINE_T[lang] || MADPAS_INTOLERANCE_HEADLINE_T.en}</div>
              <div style={itemList}>
                {intoleranceItems.map(a => (
                  <div key={a.id} style={itemBlock}>
                    <div style={itemHeadRow}>
                      {renderAllergenIcon(a)}
                      <span style={itemName}>{madpasAllergenLabel(a, lang)}</span>
                    </div>
                    {renderExamples(a.id)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {dietItems.length > 0 && (
            <div>
              <div style={sectionLbl}>{MADPAS_SECTIONS_T.diet[lang] || MADPAS_SECTIONS_T.diet.en}</div>
              <div style={itemList}>
                {/* Diæter må ikke kun vises som badges — de skal have en
                    kort, tydelig besked til personalet på samme måde som
                    allergier (27. sept. 2026, Madpas-finpolish, krav 1-2). */}
                {dietItems.map(d => (
                  <div key={d.id} style={itemBlock}>
                    <div style={itemName}>{d.label}</div>
                    <div style={{ fontSize:15.5, fontWeight:700, color:"var(--ink)", marginTop:10, lineHeight:1.5 }}>
                      {madpasDietMessage(d.id, lang)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Footer — kun den store oplæs-knap (reel funktion). Ingen
            branding/dato her (krav 2: "Fjern teksten EatSafe nederst til
            venstre. Den har ingen funktion på denne skærm."). Bund-
            padding inkluderer env(safe-area-inset-bottom) (samme etablerede
            mønster som fx ProfileScreen.jsx/theme.jsx's bundnav — se
            27. sept., finpolish nr. 2, punkt 6) så knappen aldrig ligger
            for tæt på home indicator-området på en notch-telefon. */}
        {window.speechSynthesis && (
          <div style={{ padding:"12px 24px calc(16px + env(safe-area-inset-bottom))", borderTop:"1px solid var(--border)", flexShrink:0 }}>
            <button className="mp-speak-btn" lang="da" onClick={madpasSpeak} style={{ background: madpasSpeaking ? "var(--amber)" : "var(--green)" }}>
              <Icon name={madpasSpeaking ? "speakerOff" : "speaker"} size={19} color="var(--on-green)" />
              {/* Knappen er til brugeren, ikke personalet: altid appens sprog (dansk). */}
              {madpasSpeaking ? "Stop" : "Læs højt"}
            </button>
          </div>
        )}
      </div>
    );
  };

  // Kompakt preview — capped ved 6 synlige chips + en "+N"-indikator, så
  // en profil med mange hensyn ikke gør forsiden lang og tung at aflæse.
  const PREVIEW_LIMIT = 6;
  const renderCompactPreview = () => {
    const lang = madpasLang;
    const { allergyItems, intoleranceItems, customItems, dietItems } = buildGroups(lang);
    const dietStyle = { background:"var(--green-selected-bg)", borderColor:"var(--border)", color:"var(--ink2)" };
    // `text` er et React-node, ikke en ren streng (29. sept. 2026, Laktose-
    // ikon-opgaven) — de fleste allergener stringificerer stadig deres eget
    // emoji direkte via <AllergenGlyph>, som viser et specialtegnet ikon for
    // "Laktose" i stedet for dens emoji.
    const chips = [
      ...allergyItems.map(a => ({ key:`a-${a.id}`, text:<><AllergenGlyph a={a} size={12} /> {madpasAllergenLabel(a, lang)}</> })),
      ...intoleranceItems.map(a => ({ key:`i-${a.id}`, text:<><AllergenGlyph a={a} size={12} /> {madpasAllergenLabel(a, lang)}</> })),
      ...customItems.map((c,i) => ({ key:`c-${i}`, text:c })),
      ...dietItems.map(d => ({ key:`d-${d.id}`, text:d.label, style:dietStyle })),
    ];
    const visible = chips.slice(0, PREVIEW_LIMIT);
    const overflow = chips.length - visible.length;
    // Egne spacing-værdier i stedet for den delte UI.mb14/.mp-section-lbl
    // (28. sept. 2026, spacing-opfølgning, strammet 29. sept. som del af
    // Madpas' egen design-polish-runde) — "Dit madpas"-labellen har brug
    // for lidt mere luft NED til chipsene end sektions-labels ellers har,
    // og selve sektionen skal have luft NED til CTA-knappen — begge ville
    // påvirke andre sektioner/skærme hvis ændret i den delte klasse.
    return (
      <div style={{ marginBottom:24 }}>
        <div className="mp-section-lbl" style={{ marginBottom:12 }}>Dit madpas</div>
        <div className="tags">
          {visible.map(c => <div key={c.key} className="tag" style={c.style}>{c.text}</div>)}
          {overflow > 0 && <div className="tag" style={{ background:"var(--surface2)", borderColor:"var(--border)", color:"var(--muted)" }}>+{overflow}</div>}
        </div>
      </div>
    );
  };

  const renderMainContent = () => (
    <div style={{ paddingBottom:8 }}>
      {renderCompactPreview()}

      {/* ÅBN MADPAS — matcher nu appens delte primære CTA-klasse (samme
          radius/font-weight/tryk-feedback som andre primære knapper) i
          stedet for sin egen, højere mp-big-btn-styling. Ikonet var et
          resize/expand-symbol (⤢), der ikke tydeligt signalerede "åbn et
          dokument" — skiftet til det delte "file"-ikon (29. sept. 2026). */}
      <button className="btn btn-primary btn-full" onClick={() => setMadpasWaiterView(true)}>
        <Icon name="file" size={17} color="var(--on-green)" />
        Åbn madpas
      </button>
    </div>
  );

  const hasAnyData = mpAllergens.length > 0 || mpCustom.length > 0 || mpDiets.length > 0;

  return (
    <>
        {screen === SCREENS.MADPAS && (
          <div className="mp-page fade-in">

            {/* FREMVISNINGSSKÆRM — fullscreen overlay */}
            {madpasWaiterView && renderStaffView()}

            <div className="mp-scroll">

              {/* HEADER */}
              <div className="mp-head">
                <div className="mp-title">Madpas</div>
                <div className="mp-subtitle">{DIETS_ENABLED ? "Vis dine allergier og kosthensyn på det lokale sprog." : "Vis dine allergier og intolerancer på det lokale sprog."}</div>

                {/* Profilvælger — kun vist når der reelt er noget at vælge
                    mellem. Én relevant profil (kun brugeren selv) vises
                    direkte uden vælger. */}
                {family.length > 0 && (
                  <div style={UI.mb14}>
                    <div className="mp-section-lbl">VIS MADPAS FOR</div>
                    <div style={UI.wrapGap7}>
                      <div className={`ap-chip${madpasProfileId==="self" ? " on" : ""}`} onClick={() => setMadpasProfileId("self")}>
                        <div style={UI.uw20_h20_br50_bggreen_dflex_aicenter_jccenter_fs10_fw800_cin}>{initials(user.name||"Mig")}</div>
                        {(user.name||"Mig").split(" ")[0]}
                      </div>
                      {family.map(m => (
                        <div key={m.id} className={`ap-chip${madpasProfileId===m.id ? " on" : ""}`} onClick={() => setMadpasProfileId(m.id)}>
                          <div style={{width:20,height:20,borderRadius:"50%",background:m.color||"var(--green)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"var(--ink)"}}>{initials(m.name)}</div>
                          {m.name.split(" ")[0]}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sprog-dropdown */}
                <div className="mp-section-lbl">VÆLG SPROG</div>
                {!langOpen ? (
                  <div className="mp-lang-dropdown" onClick={() => setLangOpen(true)}>
                    <span className="mp-lang-flag">{MADPAS_LANGUAGES.find(l=>l.code===madpasLang)?.flag||"🌍"}</span>
                    <span className="mp-lang-name">{MADPAS_LANGUAGES.find(l=>l.code===madpasLang)?.name||"English"}</span>
                    <span className="mp-lang-arrow"><Icon name="chevronDown" size={14} color="var(--muted)" /></span>
                  </div>
                ) : (
                  <div className="mp-lang-list">
                    {MADPAS_LANGUAGES.map(l => (
                      <div key={l.code} className={`mp-lang-opt${madpasLang===l.code?" on":""}`}
                        onClick={() => { setMadpasLang(l.code); localStorage.setItem("as_madpas_lang", l.code); setLangOpen(false); if (madpasSpeaking) { window.speechSynthesis.cancel(); setMadpasSpeaking(false); }}}>
                        <span style={UI.fs20}>{l.flag}</span>
                        <span style={{ fontSize:14, fontWeight:madpasLang===l.code?800:600, color:madpasLang===l.code?"var(--green)":"var(--ink)" }}>{l.name}</span>
                        {madpasLang===l.code && <span style={{ marginLeft:"auto", display:"flex" }}><Icon name="check" size={13} color="var(--green)" /></span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Krydskontaminerings-advarsel — bevidst opt-IN (krav 7):
                    EatSafe må ikke selv antage alvorlighedsgraden af
                    brugerens allergi, så indstillingen er default FRA,
                    og brugeren skal aktivt slå den til her.
                    Designsystem-opfølgning (29. sept. 2026): rækken er nu
                    en selvstændig "card" med border/baggrund/skygge (samme
                    delte .card-klasse som Indstillinger bruger til sine
                    toggle-rækker), så den opleves som ÉN samlet indstilling
                    i stedet for løs tekst med en switch langt til højre. */}
                {hasAnyData && (
                  <div className="card" style={{ marginTop:24, marginBottom:20, padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      {/* Info-ikonet (1. okt. 2026): synligt ikon 16px, men trykfladen er
                          44x44 via negativ margin, så rækken ikke vokser. */}
                      <div className="mp-section-lbl" style={{ marginBottom:4, display:"flex", alignItems:"center" }}>
                        KRYDSKONTAMINERING
                        <button type="button" onClick={() => setShowCrossContactInfo(true)} aria-label="Hvad er krydskontaminering?"
                          style={{ width:44, height:44, margin:"-14px -10px -14px -6px", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <Icon name="info" size={16} color="var(--muted)" />
                        </button>
                      </div>
                      <div style={{ fontSize:11.5, color:"var(--muted)", lineHeight:1.5 }}>
                        Tilføj en advarsel om krydskontaminering til dit madpas.
                      </div>
                    </div>
                    <button className="mp-cc-toggle" onClick={toggleCrossContact} aria-label="Krydskontamineringsadvarsel"
                      style={{ background: madpasCrossContact ? "var(--green)" : "var(--border2)" }}>
                      <div className="mp-cc-toggle-knob" style={{ left: madpasCrossContact ? 23 : 3 }} />
                    </button>
                  </div>
                )}
              </div>

              {/* Tom state */}
              {!hasAnyData && (
                <div className="empty-state" style={{ paddingTop:32 }}>
                  <span className="empty-icon" style={{ width:60, height:60 }}><Icon name="shield" size={23} color="var(--muted)" /></span>
                  <div className="empty-txt">Ingen allergier registreret</div>
                  <div className="empty-sub">{DIETS_ENABLED ? "Tilføj dine allergier, intolerancer og diæter under Profil → Mine præferencer" : "Tilføj dine allergier og intoleranser under Profil → Mine præferencer"}</div>
                </div>
              )}

              {hasAnyData && renderMainContent()}

              {showCrossContactInfo && (
                <InfoSheet title="Hvad er krydskontaminering?" onClose={() => setShowCrossContactInfo(false)}>
                  Krydskontaminering sker, når spor af et allergen utilsigtet overføres til anden mad, fx via køkkenudstyr, skærebrætter, olie eller hænder. Selv små mængder kan give en reaktion. Slår du advarslen til, beder Madpas personalet om at undgå krydskontaminering.
                </InfoSheet>
              )}

            </div>
          </div>
        )}
    </>
  );
}
