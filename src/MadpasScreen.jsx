// @ts-nocheck
import React from "react";
import { ALLERGENS, SCREENS, MADPAS_LANGUAGES, MADPAS_SECTIONS_T, MADPAS_ALLERGY_HEADLINE_T, MADPAS_INTOLERANCE_HEADLINE_T, MADPAS_EXAMPLES_LABEL_T, MADPAS_SPEAK_LABEL_T, MADPAS_STOP_LABEL_T } from "./constants.jsx";
import { initials } from "./helpers.js";
import { Icon } from "./SharedComponents.jsx";
import { madpasAllergenLabel, madpasDietLabel, madpasAllergenExamples, madpasSafetyNote } from "./useMadpas.js";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { UI } from "./styleUtils.js";

// ── Madpas ───────────────────────────────────────────────────────────────────
// Formål: en tjener/ekspedient skal kunne forstå de vigtigste kost-/
// allergioplysninger på FÅ SEKUNDER. Strukturerede sektioner efter type
// (FOOD ALLERGIES/INTOLERANCES/DIET, se ALLERGENS[].type) i stedet for én
// generisk "kan ikke spise"-liste, og et madpas der ALTID afspejler den
// valgte profils AKTUELLE data (allergener/custom/diæter — se mpDiets i
// App.jsx for hvorfor profil-scoping betyder noget).
//
// 26. sept. 2026, polish-runde: link-/QR-deling, PDF/print og E-numre er
// fjernet helt fra Madpas efter eksplicit brugerønske ("Link- og QR-
// funktionalitet skal være helt fjernet") — Madpas er nu udelukkende en
// skærm-baseret vis-til-tjener-funktion (+ oplæsning), ingen deling. Den
// tidligere madpas_links-tabel/RPC, public/madpas-view.html og
// vercel.json-rewriten er fjernet fra kodebasen, se CLAUDE.md/CONTEXT.md.
export default function MadpasScreen({
  madpasLang, setMadpasLang,
  madpasProfileId, setMadpasProfileId,
  madpasSpeaking, setMadpasSpeaking,
  madpasWaiterView, setMadpasWaiterView,
  mpAllergens, mpCustom, mpDiets,
  langOpen, setLangOpen,
  madpasSpeak,
}) {
  const { user } = useAuthContext();
  const { family } = useProfileContext();
  const { screen } = useNavigationContext();

  // ── Grupperede oplysninger efter type — fælles for preview og tjener-
  // visning, så begge altid viser præcis det samme. ALLERGENS.type
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

  const renderWaiterView = () => {
    const lang = madpasLang;
    const rtl = MADPAS_LANGUAGES.find(l => l.code === lang)?.rtl;
    const langInfo = MADPAS_LANGUAGES.find(l => l.code === lang);
    const { allergyItems, intoleranceItems, customItems, dietItems } = buildGroups(lang);
    const allergySafetyNames = [...allergyItems.map(a => madpasAllergenLabel(a, lang)), ...customItems];

    const sectionLbl = { fontSize:15, fontWeight:800, textTransform:"uppercase", letterSpacing:"1px", color:"var(--muted)", marginBottom:10 };
    const headline = { fontSize:19, fontWeight:700, color:"var(--ink)", marginBottom:14 };
    const itemRow = { display:"flex", alignItems:"flex-start", gap:14, padding:"14px 0", borderBottom:"1px solid var(--border)" };
    const itemName = { fontSize:26, fontWeight:800, color:"var(--ink)", lineHeight:1.25 };
    // Korte, tydeligt mærkede fødevare-eksempler under selve allergenet —
    // bevidst LILLE og MUTED sammenlignet med itemName, så allergenet selv
    // altid forbliver det mest fremtrædende element på skærmen.
    const exampleLine = { fontSize:14, color:"var(--muted)", marginTop:4, lineHeight:1.4 };
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

        {/* Stort flag/sprog øverst + diskret luk. */}
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

        {/* Strukturerede sektioner — kun ægte indhold, ingen lang
            høflighedstekst der skubber budskabet ned. */}
        <div style={{ flex:1, overflowY:"auto", padding:"4px 24px 32px" }}>
          {(allergyItems.length > 0 || customItems.length > 0) && (
            <div style={{ marginBottom:32 }}>
              <div style={sectionLbl}>{MADPAS_SECTIONS_T.allergies[lang] || MADPAS_SECTIONS_T.allergies.en}</div>
              <div style={headline}>{MADPAS_ALLERGY_HEADLINE_T[lang] || MADPAS_ALLERGY_HEADLINE_T.en}</div>
              <div>
                {allergyItems.map((a,i) => (
                  <div key={a.id} style={{ ...itemRow, borderBottom: (i===allergyItems.length-1 && customItems.length===0) ? "none" : itemRow.borderBottom }}>
                    <span style={{ ...UI.fs20, marginTop:2 }}>{a.emoji}</span>
                    <div>
                      <span style={itemName}>{madpasAllergenLabel(a, lang)}</span>
                      {renderExamples(a.id)}
                    </div>
                  </div>
                ))}
                {customItems.map((c,i) => (
                  <div key={`c${i}`} style={{ ...itemRow, borderBottom: i===customItems.length-1 ? "none" : itemRow.borderBottom }}>
                    <span style={{ marginTop:2, flexShrink:0 }}><Icon name="warning" size={20} color="var(--amber)" /></span>
                    <span style={itemName}>{c}</span>
                  </div>
                ))}
              </div>
              {/* Singular/plural sikkerheds-sætning: "does not contain
                  wheat" ved ét hensyn, "any of these ingredients" ved
                  flere — aldrig "any of these" ved kun ét. */}
              <div style={{ fontSize:15, fontWeight:600, color:"var(--ink2)", marginTop:14, lineHeight:1.5 }}>
                {madpasSafetyNote(allergySafetyNames, lang)}
              </div>
            </div>
          )}

          {intoleranceItems.length > 0 && (
            <div style={{ marginBottom:32 }}>
              <div style={sectionLbl}>{MADPAS_SECTIONS_T.intolerances[lang] || MADPAS_SECTIONS_T.intolerances.en}</div>
              <div style={headline}>{MADPAS_INTOLERANCE_HEADLINE_T[lang] || MADPAS_INTOLERANCE_HEADLINE_T.en}</div>
              <div>
                {intoleranceItems.map((a,i) => (
                  <div key={a.id} style={{ ...itemRow, borderBottom: i===intoleranceItems.length-1 ? "none" : itemRow.borderBottom }}>
                    <span style={{ ...UI.fs20, marginTop:2 }}>{a.emoji}</span>
                    <div>
                      <span style={itemName}>{madpasAllergenLabel(a, lang)}</span>
                      {renderExamples(a.id)}
                    </div>
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

        {/* Footer — kun oplæs-knappen (reel funktion) + diskret branding.
            Datoen er fjernet (ikke vigtig for restaurantpersonalet). */}
        <div style={{ padding:"12px 24px 28px", borderTop:"1px solid var(--border)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:11, color:"var(--muted)", fontWeight:700 }}>EatSafe</span>
          {window.speechSynthesis && (
            <button onClick={madpasSpeak} style={{
              background: madpasSpeaking ? "var(--amber)" : "var(--green)",
              border:"none", borderRadius:8, padding:"8px 16px", fontSize:13, fontWeight:700,
              color:"var(--on-green)", cursor:"pointer", fontFamily:"var(--f)",
              display:"flex", alignItems:"center", gap:8,
            }}>
              <Icon name={madpasSpeaking ? "speakerOff" : "speaker"} size={15} color="var(--on-green)" />
              {madpasSpeaking ? (MADPAS_STOP_LABEL_T[lang] || MADPAS_STOP_LABEL_T.en) : (MADPAS_SPEAK_LABEL_T[lang] || MADPAS_SPEAK_LABEL_T.en)}
            </button>
          )}
        </div>
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

      {/* VIS TIL TJENER */}
      <button className="mp-big-btn" onClick={() => setMadpasWaiterView(true)}>
        <span style={UI.fs18}>⤢</span>
        Vis til tjener
      </button>
    </div>
  );

  const hasAnyData = mpAllergens.length > 0 || mpCustom.length > 0 || mpDiets.length > 0;

  return (
    <>
        {screen === SCREENS.MADPAS && (
          <div className="mp-page fade-in">

            {/* TJENER-VISNING — fullscreen overlay */}
            {madpasWaiterView && renderWaiterView()}

            <div className="mp-scroll">

              {/* HEADER */}
              <div className="mp-head">
                <div className="mp-title">Madpas</div>
                <div className="mp-subtitle">Vis dit madpas til restaurant- eller butikspersonale, så de hurtigt kan forstå dine allergier og kosthensyn.</div>

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
