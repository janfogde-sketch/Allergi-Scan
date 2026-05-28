// @ts-nocheck
import React, { useState } from "react";
import { ALLERGENS, SCREENS, MADPAS_LANGUAGES, ALLERGEN_T, MADPAS_INTRO, ALLERGEN_EXAMPLES, DIETS } from "./constants.jsx";
import { initials, getAllergenLabels } from "./helpers.js";

export default function MadpasScreen({
  screen,
  madpasLang, setMadpasLang,
  madpasProfileId, setMadpasProfileId,
  madpasSpeaking, setMadpasSpeaking,
  madpasBig,
  madpasWaiterView, setMadpasWaiterView,
  mpAllergens, mpCustom,
  family, user,
  langOpen, setLangOpen,
  madpasSpeak,
}) {
  return (
    <>
        {screen === SCREENS.MADPAS && (
          <div className="mp-page fade-in">

            {/* TJENER-VISNING — fullscreen overlay */}
            {madpasWaiterView && (() => {
              const lang = madpasLang;
              const rtl = MADPAS_LANGUAGES.find(l => l.code === lang)?.rtl;
              const helloText = { en:"I have food allergies.", de:"Ich habe Lebensmittelallergien.", fr:"J'ai des allergies alimentaires.", es:"Tengo alergias alimentarias.", it:"Ho allergie alimentari.", nl:"Ik heb voedselallergieën.", pt:"Tenho alergias alimentares.", pl:"Mam alergie pokarmowe.", ja:"食物アレルギーがあります。", zh:"我有食物过敏。", ar:"لدي حساسية غذائية.", tr:"Gıda alerjilerim var.", sv:"Jag har matallergier.", no:"Jeg har matallergier.", th:"ฉันมีอาการแพ้อาหาร", el:"Έχω αλλεργίες τροφίμων.", da:"Jeg har fødevareallergier." };
              const cannotLabel = { en:"I cannot eat:", de:"Ich kann nicht essen:", fr:"Je ne peux pas manger :", es:"No puedo comer:", it:"Non posso mangiare:", nl:"Ik kan niet eten:", pt:"Não posso comer:", pl:"Nie mogę jeść:", ja:"食べられません：", zh:"我不能吃：", ar:"لا أستطيع تناول:", tr:"Yiyemiyorum:", sv:"Jag kan inte äta:", no:"Jeg kan ikke spise:", th:"ฉันไม่สามารถกิน:", el:"Δεν μπορώ να φάω:", da:"Jeg kan ikke spise:" };
              const helpText = { en:"Can you help me find something safe?", de:"Können Sie mir helfen?", fr:"Pouvez-vous m'aider ?", es:"¿Puede ayudarme?", it:"Può aiutarmi?", nl:"Kunt u mij helpen?", pt:"Pode ajudar-me?", pl:"Czy może mi pomóc?", ja:"手伝っていただけますか？", zh:"您能帮助我吗？", ar:"هل يمكنك مساعدتي؟", tr:"Yardım edebilir misiniz?", sv:"Kan du hjälpa mig?", no:"Kan du hjelpe meg?", th:"คุณช่วยฉันได้ไหม?", el:"Μπορείτε να με βοηθήσετε;", da:"Kan du hjælpe mig?" };
              const productLabel = { da:"Fx i", en:"E.g. in", de:"Z.B. in", fr:"Ex. dans", es:"Ej. en", it:"Es. in", nl:"Bijv. in", pt:"Ex. em", pl:"Np. w", sv:"T.ex. i", no:"F.eks. i", ja:"例えば", zh:"例如", ar:"مثلاً في", tr:"Örn.", th:"เช่นใน", el:"Π.χ." };
              const ingredientLabel = { da:"Se efter", en:"Look for", de:"Achten auf", fr:"Chercher", es:"Buscar", it:"Cercare", nl:"Let op", pt:"Procurar", pl:"Szukaj", sv:"Se efter", no:"Se etter", ja:"確認を", zh:"注意", ar:"ابحث عن", tr:"Ara", th:"ดูหา", el:"Ψάξτε" };
              const langInfo = MADPAS_LANGUAGES.find(l => l.code === lang);
              return (
                <div style={{ position:"fixed", inset:0, zIndex:9999, background:"#fff", display:"flex", flexDirection:"column" }} dir={rtl ? "rtl" : "ltr"}>

                  {/* Header — sprog + kryds */}
                  <div style={{ padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:20 }}>{langInfo?.flag}</span>
                      <span style={{ fontSize:13, color:"var(--muted)", fontWeight:600 }}>{langInfo?.name}</span>
                    </div>
                    <button onClick={() => { setMadpasWaiterView(false); if(madpasSpeaking){ window.speechSynthesis?.cancel(); setMadpasSpeaking(false); } }}
                      style={{ background:"none", border:"none", padding:4, cursor:"pointer" }}>
                      <Icon name="x" size={22} color="var(--ink2)" />
                    </button>
                  </div>

                  {/* Indhold — fuldstændig ensartet tekst */}
                  <div style={{ flex:1, overflowY:"auto", padding:"32px 28px" }}>

                    {/* Alle linjer samme font, størrelse og vægt */}
                    {(() => {
                      const s = { fontSize:17, fontWeight:400, color:"var(--ink)", margin:"0 0 16px", lineHeight:1.7, display:"block" };
                      const sIntro = { ...s, margin:"0 0 32px" };
                      const lines = [];

                      // Intro
                      const introText = {
                        da: "Hej! Jeg har nogle fødevareallergier og ønsker gerne din hjælp til at finde noget, jeg kan spise trygt.",
                        en: "Hi! I have some food allergies and would love your help finding something safe for me to eat.",
                        de: "Hallo! Ich habe einige Lebensmittelallergien und würde mich über Ihre Hilfe freuen.",
                        fr: "Bonjour ! J'ai des allergies alimentaires et j'aurais besoin de votre aide.",
                        es: "¡Hola! Tengo algunas alergias alimentarias y agradecería su ayuda.",
                        it: "Ciao! Ho alcune allergie alimentari e apprezzerei il suo aiuto.",
                        nl: "Hallo! Ik heb wat voedselallergieën en zou graag uw hulp willen.",
                        pt: "Olá! Tenho algumas alergias alimentares e gostaria da sua ajuda.",
                        pl: "Cześć! Mam kilka alergii pokarmowych i chciałbym prosić o pomoc.",
                        sv: "Hej! Jag har några matallergier och skulle uppskatta din hjälp.",
                        no: "Hei! Jeg har noen matallergier og ønsker gjerne din hjelp.",
                        ja: "こんにちは！食物アレルギーがあります。安全な食事を見つけるお手伝いをお願いできますか。",
                        zh: "您好！我有食物过敏，希望您能帮助我找到安全的食物。",
                        ar: "مرحباً! لدي بعض الحساسية الغذائية وأود مساعدتك في إيجاد شيء آمن لي.",
                        tr: "Merhaba! Gıda alerjilerim var ve güvenli bir şey bulmam için yardımınıza ihtiyacım var.",
                        el: "Γεια σας! Έχω κάποιες αλλεργίες τροφίμων και θα εκτιμούσα τη βοήθειά σας.",
                      };
                      lines.push(<span key="hello" style={sIntro}>{introText[lang] || introText.en}</span>);

                      // Allergener
                      [...mpAllergens, ...mpCustom.filter(c => !c.endsWith("_intolerance") && !mpAllergens.includes(c))].forEach((item, i) => {
                        if (typeof item !== "string") return;
                        const a = ALLERGENS.find(x => x.id === item);
                        const label = a ? (ALLERGEN_T[item]?.[lang]?.n || ALLERGEN_T[item]?.en?.n || a.label) : item;
                        const ex = a ? ALLERGEN_EXAMPLES[item] : null;
                        const exProducts = ex?.products?.[lang] || ex?.products?.en || [];
                        const exIngredients = ex?.ingredients?.[lang] || ex?.ingredients?.en || [];
                        const exText = [
                          exProducts.slice(0,3).join(", "),
                          exIngredients.slice(0,4).join(", ")
                        ].filter(Boolean).join(" · ");

                        const cannotText = {
                          da:"Jeg kan ikke spise", en:"I cannot eat", de:"Ich kann nicht essen",
                          fr:"Je ne peux pas manger", es:"No puedo comer", it:"Non posso mangiare",
                          nl:"Ik kan niet eten", pt:"Não posso comer", pl:"Nie mogę jeść",
                          sv:"Jag kan inte äta", no:"Jeg kan ikke spise", ja:"食べられません",
                          zh:"我不能吃", ar:"لا أستطيع تناول", tr:"Yiyemiyorum", el:"Δεν μπορώ να φάω",
                        };
                        lines.push(
                          <span key={`a${i}`} style={s}>
                            {i === 0 ? (cannotText[lang] || cannotText.en) + ": " : ""}{label}{exText ? ` (${exText})` : ""}
                          </span>
                        );
                      });

                      // Diæt
                      if (user.diets && user.diets.length > 0) {
                        const dietNames = user.diets.map(d => DIETS.find(x=>x.id===d)?.label).filter(Boolean).join(", ");
                        lines.push(<span key="diet" style={s}>{dietNames}</span>);
                      }

                      // E-numre
                      if (selectedENumbers && selectedENumbers.length > 0) {
                        lines.push(<span key="enum" style={s}>{selectedENumbers.join(", ")}</span>);
                      }

                      // Hjælp
                      const outroText = {
                        da: "Tak for din hjælp — det betyder rigtig meget for mig.",
                        en: "Thank you so much for your help — it means a lot to me.",
                        de: "Vielen Dank für Ihre Hilfe — das bedeutet mir sehr viel.",
                        fr: "Merci beaucoup pour votre aide — cela compte beaucoup pour moi.",
                        es: "Muchas gracias por su ayuda — significa mucho para mí.",
                        it: "Grazie mille per il suo aiuto — significa molto per me.",
                        nl: "Heel erg bedankt voor uw hulp — dat betekent veel voor mij.",
                        pt: "Muito obrigado pela sua ajuda — significa muito para mim.",
                        pl: "Bardzo dziękuję za pomoc — wiele dla mnie znaczy.",
                        sv: "Tack så mycket för din hjälp — det betyder mycket för mig.",
                        no: "Tusen takk for hjelpen — det betyr mye for meg.",
                        ja: "ご協力ありがとうございます。本当に助かります。",
                        zh: "非常感谢您的帮助，对我来说意义重大。",
                        ar: "شكراً جزيلاً على مساعدتك — هذا يعني لي الكثير.",
                        tr: "Yardımınız için çok teşekkür ederim — bu benim için çok şey ifade ediyor.",
                        el: "Σας ευχαριστώ πολύ για τη βοήθειά σας — σημαίνει πολλά για μένα.",
                      };
                      lines.push(<span key="help" style={{ ...s, marginTop:8 }}>{outroText[lang] || outroText.en}</span>);

                      return lines;
                    })()}
                  </div>

                  {/* Footer */}
                  <div style={{ padding:"12px 24px 28px", borderTop:"1px solid var(--border)", flexShrink:0, display:"flex", justifyContent:"flex-end" }}>
                    {window.speechSynthesis && (
                      <button onClick={madpasSpeak} style={{
                        background: madpasSpeaking ? "var(--amber)" : "var(--green)",
                        border:"none", borderRadius:8, padding:"8px 16px", fontSize:13, fontWeight:700,
                        color:"#fff", cursor:"pointer", fontFamily:"var(--f)",
                        display:"flex", alignItems:"center", gap:7,
                      }}>
                        <Icon name={madpasSpeaking ? "speakerOff" : "speaker"} size={15} color="#fff" />
                        {madpasSpeaking ? "Stop" : "Oplæs"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="mp-scroll">

              {/* HEADER */}
              <div className="mp-head">
                <div className="mp-title">Madpas</div>
                <div className="mp-subtitle">Vis dit madpas til din tjener/ekspedient for at forklare dine ønsker.</div>

                {/* Profilvælger — samme stil som hjemskærmen */}
                <div style={{ marginBottom:14 }}>
                  <div className="mp-section-lbl">VIS MADPAS FOR</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                    <div className={`ap-chip${madpasProfileId==="self" ? " on" : ""}`} onClick={() => setMadpasProfileId("self")}>
                      <div style={{width:20,height:20,borderRadius:"50%",background:"var(--green)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff"}}>{initials(user.name||"Mig")}</div>
                      {(user.name||"Mig").split(" ")[0]}
                    </div>
                    {family.map(m => (
                      <div key={m.id} className={`ap-chip${madpasProfileId===m.id ? " on" : ""}`} onClick={() => setMadpasProfileId(m.id)}>
                        <div style={{width:20,height:20,borderRadius:"50%",background:m.color||"var(--green)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff"}}>{initials(m.name)}</div>
                        {m.name.split(" ")[0]}
                      </div>
                    ))}
                  </div>
                </div>

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
                        <span style={{ fontSize:20 }}>{l.flag}</span>
                        <span style={{ fontSize:14, fontWeight:madpasLang===l.code?800:600, color:madpasLang===l.code?"var(--green)":"var(--ink)" }}>{l.name}</span>
                        {madpasLang===l.code && <span style={{ marginLeft:"auto", color:"var(--green)" }}>✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tom state */}
              {mpAllergens.length === 0 && mpCustom.length === 0 && (
                <div className="empty-state" style={{ paddingTop:32 }}>
                  <span className="empty-icon">🌾</span>
                  <div className="empty-txt">Ingen allergier registreret</div>
                  <div className="empty-sub">Tilføj dine allergier, intoleranser og diæter under Profil → Mine præferencer</div>
                </div>
              )}

              {/* ALLERGEN LISTE */}
              {(mpAllergens.length > 0 || mpCustom.length > 0) && (() => {
                const lang = madpasLang;
                const rtl = MADPAS_LANGUAGES.find(l => l.code === lang)?.rtl;
                const helloText = { en:"I have food allergies.", de:"Ich habe Lebensmittelallergien.", fr:"J'ai des allergies alimentaires.", es:"Tengo alergias alimentarias.", it:"Ho allergie alimentari.", nl:"Ik heb voedselallergieën.", pt:"Tenho alergias alimentares.", pl:"Mam alergie pokarmowe.", ja:"食物アレルギーがあります。", zh:"我有食物过敏。", ar:"لدي حساسية غذائية.", tr:"Gıda alerjilerim var.", sv:"Jag har matallergier.", no:"Jeg har matallergier.", th:"ฉันมีอาการแพ้อาหาร", el:"Έχω αλλεργίες τροφίμων.", da:"Jeg har fødevareallergier." };
                const cannotLabel = { en:"I cannot eat:", de:"Ich kann nicht essen:", fr:"Je ne peux pas manger :", es:"No puedo comer:", it:"Non posso mangiare:", nl:"Ik kan niet eten:", pt:"Não posso comer:", pl:"Nie mogę jeść:", ja:"食べられません：", zh:"我不能吃：", ar:"لا أستطيع تناول:", tr:"Yiyemiyorum:", sv:"Jag kan inte äta:", no:"Jeg kan ikke spise:", th:"ฉันไม่สามารถกิน:", el:"Δεν μπορώ να φάω:", da:"Jeg kan ikke spise:" };
                const helpText = { en:"Can you help me find something safe?", de:"Können Sie mir helfen?", fr:"Pouvez-vous m'aider ?", es:"¿Puede ayudarme?", it:"Può aiutarmi?", nl:"Kunt u mij helpen?", pt:"Pode ajudar-me?", pl:"Czy może mi pomóc?", ja:"手伝っていただけますか？", zh:"您能帮助我吗？", ar:"هل يمكنك مساعدتي؟", tr:"Yardım edebilir misiniz?", sv:"Kan du hjälpa mig?", no:"Kan du hjelpe meg?", th:"คุณช่วยฉันได้ไหม?", el:"Μπορείτε να με βοηθήσετε;", da:"Kan du hjælpe mig?" };
                return (
                  <div style={{ paddingBottom:8 }} dir={rtl ? "rtl" : "ltr"}>

                    {/* Allergen liste — ren, ingen labels */}
                    <div style={{ display:"flex", flexDirection:"column" }}>
                      {[...mpAllergens, ...mpCustom.filter(c => !c.endsWith("_intolerance") && !mpAllergens.includes(c))].map((item, i, arr) => {
                        const isLast = i === arr.length - 1;
                        if (typeof item !== "string") return null;
                        const a = ALLERGENS.find(x => x.id === item);
                        if (!a) return null;
                        const t = ALLERGEN_T[item]?.[lang] || ALLERGEN_T[item]?.en;
                        const ex = ALLERGEN_EXAMPLES[item];
                        const exProducts = ex?.products?.[lang] || ex?.products?.en || [];
                        const exIngredients = ex?.ingredients?.[lang] || ex?.ingredients?.en || [];
                        return (
                          <div key={i} style={{ padding:"14px 0", borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                            <div style={{ fontSize:18, fontWeight:700, color:"var(--ink)", marginBottom: (exProducts.length||exIngredients.length) ? 4 : 0 }}>
                              {t?.n || a.label}
                            </div>
                            {(exProducts.length > 0 || exIngredients.length > 0) && (
                              <div style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.5 }}>
                                {[...exProducts.slice(0,3), ...exIngredients.slice(0,4)].join(", ")}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {mpCustom.filter(c => !c.endsWith("_intolerance") && !mpAllergens.includes(c)).map((c, i) => (
                        <div key={`custom${i}`} style={{ padding:"14px 0", borderBottom:"1px solid var(--border)" }}>
                          <div style={{ fontSize:18, fontWeight:700, color:"var(--ink)" }}>{c}</div>
                        </div>
                      ))}
                    </div>

                    {/* VIS TIL TJENER */}
                    <button className="mp-big-btn" onClick={() => setMadpasWaiterView(true)}>
                      <span style={{ fontSize:18 }}>⤢</span>
                      Vis til tjener
                    </button>

                    <div style={{ textAlign:"center", fontSize:11, color:"var(--muted)", marginTop:10 }}>
                      🇩🇰 EatSafe · {new Date().toLocaleDateString("da-DK")}
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        )}  {/* ← lukker IIFE og screen === MADPAS */}
    </>
  );
}
