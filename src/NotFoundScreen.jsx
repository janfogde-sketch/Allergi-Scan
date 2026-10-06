// @ts-nocheck
import React from "react";
import { ALLERGENS, PRODUCT_ALLERGENS, SCREENS } from "./constants.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { Icon, Loader, AllergenGlyph } from "./SharedComponents.jsx";
import { UI } from "./styleUtils.js";

const S = {
  none:             { display:"none" },
  flex1:            { flex:1 },
  mb8:              { marginBottom:8 },
  mb10:             { marginBottom:10 },
  mb16:             { marginBottom:16 },
  rowBetweenMb10:   { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 },
  rowGap8:          { display:"flex", gap:8 },
  card:             { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", marginBottom:12, boxShadow:"var(--sh)" },
  h13:              { fontSize:13, fontWeight:800, color:"var(--ink)" },
  h13b:             { fontSize:13, fontWeight:700, color:"var(--ink)" },
  h13bMb:           { fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:8 },
  h17:              { fontSize:17, fontWeight:800, color:"var(--ink)" },
  sub11:            { fontSize:11, color:"var(--muted)" },
  sub11lh:          { fontSize:11, color:"var(--muted)", lineHeight:1.5 },
  body12:           { fontSize:12, color:"var(--muted)", lineHeight:1.5 },
  dot:              { width:28, height:28, borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
};

// Fælles stilarter for flowet: diskret "Spring over", trinoverskrift og kompakt stepper.
const SKIP = { width:"100%", minHeight:44, background:"none", border:"none", cursor:"pointer", fontSize:13, fontWeight:600, color:"var(--muted)", fontFamily:"var(--f)" };
const STEPS = [
  { num:1, label:"Forside" },
  { num:2, label:"Ingredienser" },
  { num:3, label:"Næring", optional:true },
  { num:4, label:"Andet", optional:true },
  { num:5, label:"Send" },
];

// Kompakt fremgangsindikator: færdige trin med flueben, aktivt trin fremhævet, kommende trin dæmpede; Næring og Andet er mærket "valgfri".
function Stepper({ step }) {
  return (
    <ol aria-label="Trin" style={{ listStyle:"none", display:"flex", alignItems:"flex-start", margin:"0 0 18px", padding:0 }}>
      {STEPS.map((st, i) => {
        const done = st.num < step, active = st.num === step;
        return (
          <li key={st.num} aria-current={active ? "step" : undefined} style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", alignItems:"center", position:"relative" }}>
            {i > 0 && <span aria-hidden="true" style={{ position:"absolute", top:11, right:"50%", width:"100%", height:2, background: st.num <= step ? "var(--green)" : "var(--border2)" }} />}
            <span style={{ position:"relative", zIndex:1, width:24, height:24, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800,
              background: done || active ? "var(--green)" : "var(--surface)", color: done || active ? "var(--on-green)" : "var(--muted)",
              border: `2px solid ${done || active ? "var(--green)" : "var(--border2)"}`, boxShadow: active ? "0 0 0 3px var(--green-lt)" : "none" }}>
              {done ? <Icon name="check" size={12} color="var(--on-green)" /> : st.num}
            </span>
            <span style={{ marginTop:6, fontSize:"clamp(10px, 3.1vw, 11px)", lineHeight:1.2, fontWeight: active ? 800 : 600, color: active ? "var(--ink)" : done ? "var(--ink2)" : "var(--muted)", textAlign:"center", whiteSpace:"nowrap" }}>{st.label}</span>
            {st.optional && <span style={{ marginTop:1, fontSize:10, color:"var(--muted)" }}>valgfri</span>}
          </li>
        );
      })}
    </ol>
  );
}

const NUTRITION_KEYS = ["energy", "fat", "saturated", "carbs", "sugars", "protein", "salt"];

// Trinoverskrift: lille "Trin X af 5" over en tydelig titel og en kort hjælpetekst.
function StepHead({ step, title, help, optional }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".8px" }}>Trin {step} af 5{optional ? " · Valgfrit" : ""}</div>
      <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)", marginTop:2, lineHeight:1.3 }}>{title}</div>
      {help && <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.5, marginTop:4 }}>{help}</div>}
    </div>
  );
}

export default function NotFoundScreen({
  notFoundEan,
  notFoundStep, setNotFoundStep,
  proposedName, setProposedName,
  proposedFlags, setProposedFlags,
  proposedNutrition, setProposedNutrition,
  proposedNotes, setProposedNotes,
  ocrLoading, ocrText, setOcrText,
  nutritionOcrLoading, handleNutritionCapture,
  productImagePreview,
  submitting, submitProduct,
  handleImageCapture, handleProductImageCapture,
  scanError,
}) {
  const { setScreen } = useNavigationContext();
  const [ingItems, setIngItems] = React.useState([]);
  const [ingInput, setIngInput] = React.useState("");
  const nutritionFilledCount = NUTRITION_KEYS.filter(k => proposedNutrition?.[k]).length;
  const nutritionFilled = nutritionFilledCount > 0;

  const parseIngredients = (text) => {
    if (!text) return [];
    let cleaned = text.replace(/^(ingredienser|indeholder|ingredients)[\s:：]*/i, "").trim();
    const items = [];
    let depth = 0, current = "";
    for (const ch of cleaned) {
      if (ch === "(" || ch === "[") { depth++; current += ch; }
      else if (ch === ")" || ch === "]") { depth--; current += ch; }
      else if ((ch === "," || ch === ";" || ch === "·") && depth === 0) {
        const t = current.trim();
        if (t) items.push(t);
        current = "";
      } else { current += ch; }
    }
    if (current.trim()) items.push(current.trim());
    return items.filter(i => i.length > 0);
  };

  const addIngItem = () => {
    const v = ingInput.trim();
    if (v) { setIngItems(p => [...p, v]); setIngInput(""); }
  };

  const ingToText = (items) => items.join(", ");

  React.useEffect(() => {
    if (ocrText && ocrText.trim()) {
      const parsed = parseIngredients(ocrText);
      if (parsed.length > 0) setIngItems(parsed);
    }
  }, [ocrText]);

  // Ryd kun ingredienslisten ved FREMAD-navigation ind i trin 2 (fra trin 1 —
  // "spring forside over" eller efter et foto), ikke ved tilbage-navigation
  // fra et senere trin ("← Ret ingredienser" fra trin 5, "← Tilbage" fra
  // trin 3) — ellers mistede en bruger der gik tilbage for at RETTE en
  // allerede indtastet ingrediens i stedet alt hvad de lige havde skrevet.
  const prevNotFoundStepRef = React.useRef(notFoundStep);
  React.useEffect(() => {
    const prevStep = prevNotFoundStepRef.current;
    prevNotFoundStepRef.current = notFoundStep;
    if (notFoundStep === 2 && prevStep < 2) { setIngItems([]); setIngInput(""); }
  }, [notFoundStep]);

  return (
    <>
      <div className="screen fade-in">
        {/* Header: tilbage, titel og EAN som sekundær information */}
        <div style={{ ...UI.avatarRow, padding:"12px 0 12px" }}>
          <button type="button" onClick={() => setScreen(SCREENS.HOME)} aria-label="Tilbage"
            style={{ width:44, height:44, flexShrink:0, marginLeft:-8, display:"flex", alignItems:"center", justifyContent:"center", background:"none", border:"none", cursor:"pointer" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2.25">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div style={S.flex1}>
            <div style={S.h17}>Nyt produkt</div>
            <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>EAN {notFoundEan}</div>
          </div>
        </div>

        <Stepper step={notFoundStep} />

        {/* ── TRIN 1: Fotografér forsiden ── */}
        {notFoundStep === 1 && !ocrLoading && (
          <div className="fade-in">
            <div style={{ display:"flex", alignItems:"center", gap:12, background:"var(--surface)", borderRadius:12, padding:"12px 14px", marginBottom:18, border:"1px solid var(--border)" }}>
              <Icon name="package" size={28} color="var(--muted2)" />
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:"var(--ink)" }}>Vi kender ikke dette produkt endnu</div>
                <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5, marginTop:2 }}>Fotografér forsiden og ingredienslisten, så hjælper vi med at oprette det.</div>
              </div>
            </div>

            <StepHead step={1} title="Fotografér produktets forside" help="Vi bruger billedet til at finde produktnavnet automatisk." />

            <label className="btn btn-primary btn-full" style={{ marginBottom:10 }}>
              <Icon name="camera" size={18} color="var(--on-green)" />
              Fotografér forsiden
              <input type="file" accept="image/*" capture="environment" style={S.none} onChange={handleProductImageCapture} />
            </label>
            <label className="btn btn-outline btn-full" style={{ marginBottom:4 }}>
              <Icon name="image" size={15} color="var(--ink)" /> Vælg fra galleri
              <input type="file" accept="image/*" style={S.none} onChange={handleProductImageCapture} />
            </label>
            <button type="button" style={SKIP} onClick={() => setNotFoundStep(2)}>Spring over</button>
            <div style={{ fontSize:11, color:"var(--muted)", textAlign:"center", lineHeight:1.5 }}>Springer du over, skriver du produktnavnet selv til sidst.</div>
          </div>
        )}

        {/* ── SCANNING-LOADER ── */}
        {(ocrLoading || nutritionOcrLoading) && (
          <Loader size="lg"
            text={notFoundStep === 1 ? "Henter produktnavn…"
              : notFoundStep === 3 ? "Læser næringsindhold…"
              : "Analyserer ingredienser…"}
            sub={notFoundStep === 1
              ? "Vores AI læser produktnavnet fra billedet"
              : notFoundStep === 3
              ? "Vi udtrækker energi, fedt, kulhydrat og protein automatisk"
              : "Vi finder allergener og ingredienser automatisk"}
            hint="Det tager typisk 5-10 sekunder" />
        )}

        {/* ── TRIN 2: Fotografér ingredienslisten ── */}
        {notFoundStep === 2 && !ocrLoading && (
          <div className="fade-in">
            {productImagePreview && (
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, marginBottom:14, boxShadow:"var(--sh)" }}>
                <img loading="lazy" src={productImagePreview} alt="Produkt"
                  style={{ width:52, height:52, objectFit:"contain", borderRadius:8, border:"1px solid var(--border)", flexShrink:0 }} />
                <div style={S.flex1}>
                  <input value={proposedName} onChange={e => setProposedName(e.target.value)}
                    aria-label="Produktnavn" placeholder="Produktnavn…"
                    style={{ width:"100%", border:"none", outline:"none", fontFamily:"var(--f)", fontSize:14, fontWeight:700, color:"var(--ink)", background:"transparent", padding:0 }} />
                  <div style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:"var(--green)", marginTop:2 }}><Icon name="check" size={10} color="var(--green)" /> Forside fotograferet</div>
                </div>
              </div>
            )}

            <StepHead step={2} title="Fotografér ingredienslisten" help="Vi bruger billedet til at finde allergener og ingredienser." />

            <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"14px", marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:10 }}>Sådan finder du ingredienslisten:</div>
              {[
                "Vend pakken om — ingredienslisten starter typisk med \"Ingredienser:\" eller \"Indeholder:\"",
                "Hold telefonen stille og vent til teksten er skarp",
                "God belysning giver bedre resultat — undgå skygger",
              ].map((txt, i) => (
                <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom: i < 2 ? 8 : 0 }}>
                  <div style={S.dot}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2.5"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <div style={S.body12}>{txt}</div>
                </div>
              ))}
            </div>

            <label className="btn btn-primary btn-full" style={{ marginBottom:10 }}>
              <Icon name="camera" size={18} color="var(--on-green)" />
              Fotografér ingredienslisten
              <input type="file" accept="image/*" capture="environment" style={S.none} onChange={handleImageCapture} />
            </label>
            <label className="btn btn-outline btn-full" style={{ marginBottom:4 }}>
              <Icon name="image" size={15} color="var(--ink)" /> Vælg fra galleri
              <input type="file" accept="image/*" style={S.none} onChange={handleImageCapture} />
            </label>
            {scanError && <div className="error-box" style={S.mb10}><Icon name="warning" size={13} color="var(--red)" /> {scanError}</div>}
            {ocrText ? (
              <button className="btn btn-primary btn-full" style={{ marginTop:6 }} onClick={() => setNotFoundStep(3)}>Fortsæt</button>
            ) : (
              <button type="button" style={SKIP} onClick={() => { setProposedFlags({}); setNotFoundStep(3); }}>Spring over</button>
            )}
          </div>
        )}

        {/* ── TRIN 3: Næringsindhold ── */}
        {notFoundStep === 3 && !ocrLoading && !nutritionOcrLoading && (
          <div className="fade-in">
            <StepHead step={3} optional title="Næringsindhold" help="Fotografér eller skriv næringsdeklarationen. Du kan gå videre uden at udfylde noget." />

            {/* Når felterne allerede er aflæst, er billedknapperne sekundære ("igen"), så det ikke ligner, at man skal fotografere forfra. */}
            <label className={`btn ${nutritionFilled ? "btn-outline" : "btn-primary"} btn-full`} style={{ marginBottom:10 }}>
              <Icon name="camera" size={18} color={nutritionFilled ? "var(--ink)" : "var(--on-green)"} />
              {nutritionFilled ? "Fotografér igen" : "Fotografér næringsdeklarationen"}
              <input type="file" accept="image/*" capture="environment" style={S.none} onChange={handleNutritionCapture} />
            </label>
            {!nutritionFilled && (
              <label className="btn btn-outline btn-full" style={{ marginBottom:14 }}>
                <Icon name="image" size={15} color="var(--ink)" /> Vælg fra galleri
                <input type="file" accept="image/*" style={S.none} onChange={handleNutritionCapture} />
              </label>
            )}

            {scanError && <div className="error-box" style={S.mb10}><Icon name="warning" size={13} color="var(--red)" /> {scanError}</div>}

            {nutritionFilled && (
              <div style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 12px", background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:10, marginBottom:10, fontSize:12, color:"var(--green)", fontWeight:700 }}>
                <Icon name="check" size={12} color="var(--green)" /> {nutritionFilledCount} af {NUTRITION_KEYS.length} felter er læst fra billedet. Tjek tallene, og udfyld resten selv, hvis du vil.
              </div>
            )}

            <div style={UI.ubgsurface_bd1pxsolid_br12_p14px_mb14}>
              <div style={{ fontSize:12, fontWeight:800, color:"var(--ink)", marginBottom:12 }}>Per 100g/ml</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 14px" }}>
                {[
                  { key:"energy",    label:"Energi (kJ/kcal)", placeholder:"fx 1560/373" },
                  { key:"fat",       label:"Fedt (g)",         placeholder:"fx 20,3" },
                  { key:"saturated", label:"- heraf mættet (g)", placeholder:"fx 12,1" },
                  { key:"carbs",     label:"Kulhydrat (g)",    placeholder:"fx 44,2" },
                  { key:"sugars",    label:"- heraf sukker (g)", placeholder:"fx 38,5" },
                  { key:"protein",   label:"Protein (g)",      placeholder:"fx 5,4" },
                  { key:"salt",      label:"Salt (g)",         placeholder:"fx 0,12" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <div style={UI.ufs10_cmuted_fw700_mb4}>{label}</div>
                    <input className="field" aria-label={label} placeholder={placeholder}
                      value={proposedNutrition?.[key] || ""}
                      onChange={e => setProposedNutrition(prev => ({ ...prev, [key]: e.target.value }))}
                      style={{ padding:"8px 10px", fontSize:12 }} />
                  </div>
                ))}
              </div>
            </div>

            {proposedNutrition && Object.values(proposedNutrition).some(v => v) ? (
              <button className="btn btn-primary btn-full" onClick={() => setNotFoundStep(4)}>Fortsæt</button>
            ) : (
              <button type="button" style={SKIP} onClick={() => setNotFoundStep(4)}>Spring over</button>
            )}
          </div>
        )}

        {/* ── TRIN 4: Andet / noter ── */}
        {notFoundStep === 4 && !ocrLoading && (
          <div className="fade-in">
            <StepHead step={4} optional title="Yderligere oplysninger" help="Fx mærkninger og certifikater. Du kan gå videre uden at udfylde noget." />

            <div style={UI.ubgsurface_bd1pxsolid_br12_p14px_mb14}>
              <div style={{ fontSize:12, fontWeight:800, color:"var(--ink)", marginBottom:8 }}>Mærkninger / certifikater</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
                {["Ø Økologisk","Vegansk","Vegetarisk","Glutenfri","Laktosefri","Halal","Kosher","Fairtrade"].map(tag => {
                  const active = (proposedNotes || "").includes(tag);
                  return (
                    <div key={tag}
                      onClick={() => {
                        setProposedNotes(prev => {
                          const tags = (prev||"").split(",").map(t=>t.trim()).filter(Boolean);
                          if (active) return tags.filter(t=>t!==tag).join(", ");
                          return [...tags, tag].join(", ");
                        });
                      }}
                      style={{ padding:"6px 12px", borderRadius:100, cursor:"pointer", fontSize:12, fontWeight:700, border:`1px solid ${active ? "var(--green)" : "var(--border2)"}`, background: active ? "var(--green-lt)" : "var(--surface)", color: active ? "var(--green)" : "var(--muted2)" }}>
                      {tag}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--ink)", marginBottom:6 }}>Fri tekst</div>
              <textarea className="field" rows={3} aria-label="Mærkninger, fri tekst"
                placeholder="Fx: 'Opbevares køligt', 'Vegansk certificeret', 'Sæsonvare'…"
                value={proposedNotes || ""}
                onChange={e => setProposedNotes(e.target.value)}
                style={{ resize:"none", fontSize:12 }} />
            </div>

            {proposedNotes ? (
              <button className="btn btn-primary btn-full" onClick={() => setNotFoundStep(5)}>Fortsæt</button>
            ) : (
              <button type="button" style={SKIP} onClick={() => setNotFoundStep(5)}>Spring over</button>
            )}
          </div>
        )}

        {/* ── TRIN 5: Gennemse og send ── */}
        {notFoundStep === 5 && !ocrLoading && (
          <div className="fade-in">
            <StepHead step={5} title="Gennemse og send" />

            {/* Produktkort */}
            <div style={UI.ubgsurface_bd1pxsolid_br14_p14px16px_mb12}>
              <div style={S.rowBetweenMb10}>
                <div style={{ ...UI.ufs12_fw800_cink, display:"flex", alignItems:"center", gap:6 }}><Icon name="camera" size={12} color="var(--ink)" /> Forside og navn</div>
                <button className="link-back" onClick={() => setNotFoundStep(1)} style={{ margin:"-12px 0" }}><Icon name="chevronLeft" size={12} color="var(--muted)" /> Ret</button>
              </div>
              <div style={UI.udflex_aicenter_g12_mb12}>
                {productImagePreview
                  ? <img loading="lazy" src={productImagePreview} alt="Produkt" style={{ width:60, height:60, objectFit:"contain", borderRadius:10, border:"1px solid var(--border)", flexShrink:0 }} />
                  : <div style={{ width:60, height:60, borderRadius:10, background:"var(--paper2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon name="package" size={26} color="var(--muted2)" /></div>
                }
                <div style={S.flex1}>
                  <div style={UI.ufs11_cmuted_fw600_mb4}>Produktnavn</div>
                  <input value={proposedName} onChange={e => setProposedName(e.target.value)}
                    aria-label="Produktnavn" placeholder="Skriv produktnavn…" className="field"
                    style={{ padding:"8px 12px", fontSize:14 }} />
                </div>
              </div>
              <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"var(--muted)", cursor:"pointer" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                Skift forsidebillede
                <input type="file" accept="image/*" capture="environment" style={S.none} onChange={handleProductImageCapture} />
              </label>
            </div>

            {/* Ingrediensliste editor */}
            <div style={S.card}>
              <div style={S.rowBetweenMb10}>
                <div style={{ ...S.h13, display:"flex", alignItems:"center", gap:6 }}><Icon name="search" size={13} color="var(--ink)" /> Ingredienser</div>
                <div style={UI.udflex_g8_aicenter}>
                  {ocrText && <div style={{ ...UI.ufs11_cgreen_fw700, display:"flex", alignItems:"center", gap:3 }}><Icon name="check" size={10} color="var(--green)" /> {ingItems.length} fundet</div>}
                  <label style={UI.ufs11_cmuted_curpointer_fw600_dflex_aicenter_g4}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    {ocrText ? "Nyt billede" : "Tag billede"}
                    <input type="file" accept="image/*" capture="environment" style={S.none} onChange={handleImageCapture} />
                  </label>
                </div>
              </div>

              {!ocrText && ingItems.length === 0 && (
                <div style={{ ...UI.ufs12_camber_fw600_p8px10px_bgamberlt_br8_mb10, display:"flex", alignItems:"center", gap:6 }}>
                  <Icon name="warning" size={12} color="var(--amber)" /> Ingen ingredienser endnu — tag et billede eller skriv dem herunder
                </div>
              )}

              {ingItems.length > 0 && (
                <div style={UI.udflex_flewrap_g6_mb10}>
                  {ingItems.map((item, i) => (
                    <div key={i} style={UI.udflex_aicenter_g5_p5px10px_bgpaper2_bd1pxsolid_br20}>
                      <span style={UI.ufs12_cink}>{item}</span>
                      <button type="button" className="tag-x" aria-label={`Fjern "${item}"`}
                        onClick={() => setIngItems(p => p.filter((_,j)=>j!==i))}><Icon name="x" size={12} color="var(--muted)" /></button>
                    </div>
                  ))}
                </div>
              )}

              <div style={S.rowGap8}>
                <input className="field" aria-label="Tilføj ingrediens" placeholder="Tilføj ingrediens…" value={ingInput}
                  onChange={e => setIngInput(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && addIngItem()}
                  style={UI.uflex1_fs12} />
                <button className="btn btn-outline btn-sm" onClick={addIngItem} style={UI.shrink0} aria-label="Tilføj ingrediens"><Icon name="plus" size={16} /></button>
              </div>
              {ingItems.length > 0 && (
                <div style={{ fontSize:10, color:"var(--muted)", marginTop:8, lineHeight:1.5 }}>
                  Tryk × for at fjerne. Rå tekst: <span style={UI.uffmonospac}>{ingToText(ingItems).slice(0,80)}{ingToText(ingItems).length>80?"…":""}</span>
                </div>
              )}
              <button style={{ marginTop:8, fontSize:11, color:"var(--muted)", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--f)", padding:0 }}
                onClick={() => setNotFoundStep(2)}>
                ← Ret ingredienser
              </button>
            </div>

            {/* Allergener */}
            <div style={S.card}>
              <div style={S.rowBetweenMb10}>
                <div style={{ ...S.h13, display:"flex", alignItems:"center", gap:6 }}><Icon name="warning" size={13} color="var(--ink)" /> Allergener</div>
                <div style={S.sub11}>Tryk for at slå til eller fra</div>
              </div>
              <div style={UI.wrapGap7}>
                {PRODUCT_ALLERGENS.filter(a => !["svovl","lupin","bloeddyr"].includes(a.id)).map(a => {
                  const val = proposedFlags?.[a.id];
                  const isOn = val === "yes" || val === true;
                  const isTrace = val === "traces";
                  return (
                    <div key={a.id}
                      onClick={() => {
                        setProposedFlags(prev => {
                          const cur = prev?.[a.id];
                          const next = !cur || cur === false ? "yes" : cur === "yes" ? "traces" : false;
                          return { ...prev, [a.id]: next };
                        });
                      }}
                      style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:100, cursor:"pointer", border:`1px solid ${isOn ? "var(--red-md)" : isTrace ? "var(--amber-md)" : "var(--border2)"}`, background: isOn ? "var(--red-lt)" : isTrace ? "var(--amber-lt)" : "var(--paper2)", transition:"all .15s" }}>
                      <span style={{ fontSize:14 }}><AllergenGlyph a={a} size={13} /></span>
                      <span style={{ fontSize:11, fontWeight:700, color: isOn ? "var(--red)" : isTrace ? "var(--amber)" : "var(--muted)" }}>{a.label}</span>
                      {isOn    && <span style={{ fontSize:9, fontWeight:800, color:"var(--red)",   background:"var(--red-lt)",   padding:"1px 6px", borderRadius:4 }}>JA</span>}
                      {isTrace && <span style={{ fontSize:9, fontWeight:800, color:"var(--amber)", background:"var(--amber-lt)", padding:"1px 6px", borderRadius:4 }}>SPOR</span>}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize:10, color:"var(--muted)", marginTop:10, lineHeight:1.5 }}>
                Ét tryk = indeholder · To tryk = spor · Tre tryk = fjern
              </div>
            </div>

            {/* Næringsindhold */}
            {proposedNutrition && Object.values(proposedNutrition).some(v => v) && (
              <div style={S.card}>
                <div style={UI.ufs13_fw800_cink_mb10}>
                  Næringsindhold <span style={{ fontSize:10, color:"var(--muted)", fontWeight:400 }}>per 100g/ml</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 14px" }}>
                  {[
                    { key:"energy", label:"Energi" }, { key:"fat", label:"Fedt" },
                    { key:"saturated", label:"Mættet fedt" }, { key:"carbs", label:"Kulhydrat" },
                    { key:"sugars", label:"Sukker" }, { key:"protein", label:"Protein" },
                    { key:"salt", label:"Salt" },
                  ].filter(({ key }) => proposedNutrition[key]).map(({ key, label }) => (
                    <div key={key} style={{ display:"flex", justifyContent:"space-between", fontSize:11 }}>
                      <span style={UI.muted}>{label}</span>
                      <span style={{ color:"var(--ink)", fontWeight:700 }}>{proposedNutrition[key]}</span>
                    </div>
                  ))}
                </div>
                <button className="link-back" style={{ marginTop:2, paddingLeft:0 }}
                  onClick={() => setNotFoundStep(3)}><Icon name="chevronLeft" size={12} color="var(--muted)" /> Ret næringsindhold</button>
              </div>
            )}

            {/* Mærkninger */}
            {proposedNotes && (
              <div style={S.card}>
                <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:6 }}>Mærkninger</div>
                <div style={{ fontSize:12, color:"var(--ink2)", lineHeight:1.6 }}>{proposedNotes}</div>
                <button className="link-back" style={{ paddingLeft:0 }}
                  onClick={() => setNotFoundStep(4)}><Icon name="chevronLeft" size={12} color="var(--muted)" /> Ret mærkninger</button>
              </div>
            )}

            <div style={UI.udflex_g8_aiflexstar_p10px12px_bgpaper2_br10_mb14}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={UI.ushr0_mt1}>
                <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 16v-4M12 8h.01"/>
              </svg>
              <div style={S.sub11lh}>
                Dit bidrag gennemgås af EatSafe-teamet inden publicering. Tak fordi du hjælper!
              </div>
            </div>

            {scanError && <div className="error-box" style={S.mb10}><Icon name="warning" size={13} color="var(--red)" /> {scanError}</div>}

            {/* Minimumskrav før indsendelse: kun produktnavn er påkrævet; ingredienser anbefales (uden dem kan produktet ikke vurderes). */}
            <div style={{ ...S.card, marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:800, color:"var(--ink)", marginBottom:8 }}>Før du sender</div>
              <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color: proposedName.trim() ? "var(--ink)" : "var(--red)", fontWeight:600, marginBottom:6 }}>
                <Icon name={proposedName.trim() ? "check" : "warning"} size={14} color={proposedName.trim() ? "var(--green)" : "var(--red)"} /> Produktnavn <span style={{ fontWeight:500, color:"var(--muted)" }}>(påkrævet)</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"var(--ink)", fontWeight:600 }}>
                <Icon name={(ingItems.length > 0 || ocrText) ? "check" : "warning"} size={14} color={(ingItems.length > 0 || ocrText) ? "var(--green)" : "var(--amber)"} /> Ingredienser <span style={{ fontWeight:500, color:"var(--muted)" }}>(anbefalet)</span>
              </div>
            </div>

            <button type="button" className="btn btn-primary btn-full" style={{ marginBottom:8, minHeight:48 }}
              onClick={() => {
                const finalText = ingItems.length > 0 ? ingToText(ingItems) : ocrText;
                if (ingItems.length > 0) setOcrText(finalText);
                submitProduct(finalText);
              }}
              disabled={submitting || !proposedName.trim()}>
              {submitting
                ? <><span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,.4)", borderTopColor:"var(--on-green)", borderRadius:"50%", animation:"spin .7s linear infinite", display:"inline-block" }} /> Sender…</>
                : <>Send produkt ind <Icon name="check" size={15} color={proposedName.trim() ? "var(--on-green)" : "var(--muted)"} /></>}
            </button>
            <button className="btn btn-ghost btn-full" onClick={() => setNotFoundStep(2)}><Icon name="chevronLeft" size={14} /> Tilbage</button>
          </div>
        )}
      </div>

      {/* Fuld-skærm loading ved submit */}
      {submitting && (
        <div style={{ position:"fixed", inset:0, zIndex:9998, background:"rgba(0,0,0,.7)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
          {/* Teksten ligger i et kort: mørk tekst direkte på det mørke overlay kunne ikke læses (F3-2). */}
          <div className="card" role="status" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, padding:"24px 32px", margin:0 }}>
            <div style={{ width:48, height:48, border:"3px solid var(--border2)", borderTopColor:"var(--green)", borderRadius:"50%", animation:"spin .8s linear infinite" }} />
            <div style={UI.boldInk14}>Sender produkt…</div>
            <div style={UI.ufs12_cmuted}>Vent venligst</div>
          </div>
        </div>
      )}
    </>
  );
}
