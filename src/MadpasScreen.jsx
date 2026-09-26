// @ts-nocheck
import React from "react";
import { ALLERGENS, SCREENS, MADPAS_LANGUAGES, MADPAS_SECTIONS_T, MADPAS_ALLERGY_HEADLINE_T, MADPAS_INTOLERANCE_HEADLINE_T, MADPAS_EXAMPLES_LABEL_T, MADPAS_SPEAK_LABEL_T, MADPAS_STOP_LABEL_T } from "./constants.jsx";
import { initials } from "./helpers.js";
import { Icon } from "./SharedComponents.jsx";
import { madpasAllergenLabel, madpasDietLabel, madpasAllergenExamples, madpasSafetyNote, madpasCrossContactNote } from "./useMadpas.js";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { UI } from "./styleUtils.js";

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
  const { family } = useProfileContext();
  const { screen } = useNavigationContext();

  // ── Grupperede oplysninger efter type — fælles for preview og fremvis-
  // ningsskærmen, så begge altid viser præcis det samme. ALLERGENS.type
  // ("allergi"/"intolerance") styrer grupperingen — fritekst-tilføjelser
  // ("Skriv selv") kan ikke kategoriseres og lægges i allergi-sektionen
  // som den mest forsigtige antagelse.
  const buildGroups = (lang) => {
    const allergenItems = mpAllergens.map(id => ALLERGENS.find(a => a.id === id)).filter(Boolean);
    return {
      allergyItems: allergenItems.filter(a => a.type === "allergi"),
      intoleranceItems: allergenItems.filter(a => a.type === "intolerance"),
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
    const crossContactNames = [...allergyItems.map(a => madpasAllergenLabel(a, lang)), ...customItems];

    const sectionLbl = { fontSize:15, fontWeight:800, textTransform:"uppercase", letterSpacing:"1px", color:"var(--muted)", marginBottom:10 };
    const headline = { fontSize:19, fontWeight:700, color:"var(--ink)", marginBottom:18 };
    // Hvert hensyn er sin EGEN informationsblok med luft mellem — ikke
    // en delt liste med skillelinjer (krav 6: "må ikke blot blive vist
    // som små chips ... vis hver allergi som sin egen tydelige
    // informationsblok"). Navnet er bevidst det mest fremtrædende
    // element på hele skærmen (krav 3).
    const itemBlock = { marginBottom:26 };
    const itemHeadRow = { display:"flex", alignItems:"center", gap:14 };
    const itemIcon = { fontSize:36, lineHeight:1, flexShrink:0, width:36, textAlign:"center" };
    const itemName = { fontSize:32, fontWeight:800, color:"var(--ink)", lineHeight:1.15 };
    // Korte, tydeligt mærkede fødevare-eksempler under selve allergenet —
    // bevidst LILLE og MUTED sammenlignet med itemName, så allergenet selv
    // altid forbliver det mest fremtrædende element på skærmen.
    const exampleLine = { fontSize:14.5, color:"var(--muted)", marginTop:8, lineHeight:1.45, paddingLeft:50 };
    // Den konkrete besked til personalet — genereres pr. emne (krav 4:
    // "genereres dynamisk for den konkrete allergi"), ikke som én
    // kombineret sætning for hele sektionen.
    const safetyLine = { fontSize:15.5, fontWeight:700, color:"var(--ink2)", marginTop:10, lineHeight:1.5, paddingLeft:50 };
    const renderExamples = (allergenId) => {
      const examples = madpasAllergenExamples(allergenId, lang);
      if (examples.length === 0) return null;
      return (
        <div style={exampleLine}>
          <span style={{ fontWeight:700 }}>{MADPAS_EXAMPLES_LABEL_T[lang] || MADPAS_EXAMPLES_LABEL_T.en}</span> {examples.join(" · ")}
        </div>
      );
    };

    return (
      <div style={{ position:"fixed", inset:0, zIndex:9999, background:"var(--paper)", display:"flex", flexDirection:"column" }} dir={rtl ? "rtl" : "ltr"}>

        {/* Stort flag/sprog øverst + tydelig-men-diskret luk-knap. */}
        <div style={{ padding:"22px 24px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:44, lineHeight:1 }}>{langInfo?.flag}</span>
            <span style={{ fontSize:17, color:"var(--ink2)", fontWeight:700 }}>{langInfo?.name}</span>
          </div>
          <button onClick={() => { setMadpasWaiterView(false); if(madpasSpeaking){ window.speechSynthesis?.cancel(); setMadpasSpeaking(false); } }} aria-label="Luk"
            style={{ background:"var(--surface2)", border:"none", borderRadius:"50%", width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <Icon name="x" size={20} color="var(--ink2)" />
          </button>
        </div>

        {/* Ren fremvisningsskærm — ingen hovedmenu/feedback/bundnav, kun
            ægte indhold. Ingen lang høflighedstekst der skubber
            budskabet ned. */}
        <div style={{ flex:1, overflowY:"auto", padding:"4px 24px 32px" }}>
          {(allergyItems.length > 0 || customItems.length > 0) && (
            <div style={{ marginBottom:32 }}>
              <div style={sectionLbl}>{MADPAS_SECTIONS_T.allergies[lang] || MADPAS_SECTIONS_T.allergies.en}</div>
              <div style={headline}>{MADPAS_ALLERGY_HEADLINE_T[lang] || MADPAS_ALLERGY_HEADLINE_T.en}</div>
              <div>
                {allergyItems.map(a => (
                  <div key={a.id} style={itemBlock}>
                    <div style={itemHeadRow}>
                      <span style={itemIcon}>{a.emoji}</span>
                      <span style={itemName}>{madpasAllergenLabel(a, lang)}</span>
                    </div>
                    {renderExamples(a.id)}
                    <div style={safetyLine}>{madpasSafetyNote(madpasAllergenLabel(a, lang), lang)}</div>
                  </div>
                ))}
                {customItems.map((c,i) => (
                  <div key={`c${i}`} style={itemBlock}>
                    <div style={itemHeadRow}>
                      <span style={itemIcon}><Icon name="warning" size={28} color="var(--amber)" /></span>
                      <span style={itemName}>{c}</span>
                    </div>
                    <div style={safetyLine}>{madpasSafetyNote(c, lang)}</div>
                  </div>
                ))}
              </div>
              {/* Krydskontaminering — KUN vist hvis brugeren selv har
                  aktiveret den i Madpas-indstillingerne (krav 7). Én
                  kombineret sætning for hele sektionen, ikke pr. emne. */}
              {madpasCrossContact && crossContactNames.length > 0 && (
                <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginTop:18, paddingTop:16, borderTop:"1px solid var(--border)" }}>
                  <span style={{ flexShrink:0, marginTop:1 }}><Icon name="warning" size={18} color="var(--amber)" /></span>
                  <span style={{ fontSize:15, fontWeight:700, color:"var(--amber)", lineHeight:1.5 }}>
                    {madpasCrossContactNote(crossContactNames, lang)}
                  </span>
                </div>
              )}
            </div>
          )}

          {intoleranceItems.length > 0 && (
            <div style={{ marginBottom:32 }}>
              <div style={sectionLbl}>{MADPAS_SECTIONS_T.intolerances[lang] || MADPAS_SECTIONS_T.intolerances.en}</div>
              <div style={headline}>{MADPAS_INTOLERANCE_HEADLINE_T[lang] || MADPAS_INTOLERANCE_HEADLINE_T.en}</div>
              <div>
                {intoleranceItems.map(a => (
                  <div key={a.id} style={itemBlock}>
                    <div style={itemHeadRow}>
                      <span style={itemIcon}>{a.emoji}</span>
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
              <div style={UI.udflex_flewrap_g8}>
                {dietItems.map(d => (
                  <div key={d.id} style={{ padding:"10px 18px", borderRadius:100, background:"var(--green-selected-bg)", border:"1px solid var(--border)", fontSize:17, fontWeight:700, color:"var(--ink)" }}>
                    {d.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer — kun den store oplæs-knap (reel funktion). Ingen
            branding/dato her (krav 2: "Fjern teksten EatSafe nederst til
            venstre. Den har ingen funktion på denne skærm."). */}
        {window.speechSynthesis && (
          <div style={{ padding:"16px 24px 28px", borderTop:"1px solid var(--border)", flexShrink:0 }}>
            <button onClick={madpasSpeak} style={{
              width:"100%",
              background: madpasSpeaking ? "var(--amber)" : "var(--green)",
              border:"none", borderRadius:14, padding:"16px 20px", fontSize:17, fontWeight:800,
              color:"var(--on-green)", cursor:"pointer", fontFamily:"var(--f)",
              display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            }}>
              <Icon name={madpasSpeaking ? "speakerOff" : "speaker"} size={19} color="var(--on-green)" />
              {madpasSpeaking ? (MADPAS_STOP_LABEL_T[lang] || MADPAS_STOP_LABEL_T.en) : (MADPAS_SPEAK_LABEL_T[lang] || MADPAS_SPEAK_LABEL_T.en)}
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
    const chips = [
      ...allergyItems.map(a => ({ key:`a-${a.id}`, text:`${a.emoji} ${madpasAllergenLabel(a, lang)}` })),
      ...intoleranceItems.map(a => ({ key:`i-${a.id}`, text:`${a.emoji} ${madpasAllergenLabel(a, lang)}` })),
      ...customItems.map((c,i) => ({ key:`c-${i}`, text:c })),
      ...dietItems.map(d => ({ key:`d-${d.id}`, text:d.label, style:dietStyle })),
    ];
    const visible = chips.slice(0, PREVIEW_LIMIT);
    const overflow = chips.length - visible.length;
    return (
      <div style={UI.mb14}>
        <div className="mp-section-lbl">Dit madpas</div>
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

      {/* ÅBN MADPAS */}
      <button className="mp-big-btn" onClick={() => setMadpasWaiterView(true)}>
        <span style={UI.fs18}>⤢</span>
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
                <div className="mp-subtitle">Vis dine allergier og kosthensyn på det lokale sprog.</div>

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
                    <span className="mp-lang-arrow">▾</span>
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
                    og brugeren skal aktivt slå den til her. */}
                {hasAnyData && (
                  <div style={{ marginTop:14, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="mp-section-lbl" style={{ marginBottom:2 }}>KRYDSKONTAMINERING</div>
                      <div style={{ fontSize:11.5, color:"var(--muted)", lineHeight:1.4 }}>
                        Tilføj en advarsel om krydskontaminering til madpasset. Vurdér selv om det er relevant for din allergi.
                      </div>
                    </div>
                    <button onClick={toggleCrossContact} aria-label="Krydskontamineringsadvarsel"
                      style={{
                        width:48, height:28, borderRadius:14, border:"none", cursor:"pointer",
                        background: madpasCrossContact ? "var(--green)" : "var(--border2)",
                        position:"relative", transition:"background .2s", flexShrink:0,
                      }}>
                      <div style={{
                        width:22, height:22, borderRadius:"50%", background:"var(--ink)",
                        position:"absolute", top:3,
                        left: madpasCrossContact ? 23 : 3,
                        transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,.3)"
                      }} />
                    </button>
                  </div>
                )}
              </div>

              {/* Tom state */}
              {!hasAnyData && (
                <div className="empty-state" style={{ paddingTop:32 }}>
                  <span className="empty-icon"><Icon name="shield" size={26} color="var(--muted)" /></span>
                  <div className="empty-txt">Ingen allergier registreret</div>
                  <div className="empty-sub">Tilføj dine allergier, intoleranser og diæter under Profil → Mine præferencer</div>
                </div>
              )}

              {hasAnyData && renderMainContent()}

            </div>
          </div>
        )}
    </>
  );
}
