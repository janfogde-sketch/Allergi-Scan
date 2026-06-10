// @ts-nocheck
import React from "react";
import { ALLERGENS, SCREENS } from "./constants.jsx";

const S = {
  none:             { display:"none" },
  flex1:            { flex:1 },
  mb8:              { marginBottom:8 },
  mb10:             { marginBottom:10 },
  mb16:             { marginBottom:16 },
  center60:         { textAlign:"center", padding:"60px 20px" },
  rowBetweenMb10:   { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 },
  rowGap8:          { display:"flex", gap:8 },
  card:             { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", marginBottom:12 },
  h13:              { fontSize:13, fontWeight:800, color:"var(--ink)" },
  h13b:             { fontSize:13, fontWeight:700, color:"var(--ink)" },
  h13bMb:           { fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:8 },
  h17:              { fontSize:17, fontWeight:800, color:"var(--ink)" },
  h17mb:            { fontSize:17, fontWeight:800, color:"var(--ink)", marginBottom:8 },
  sub11:            { fontSize:11, color:"var(--muted)" },
  sub11lh:          { fontSize:11, color:"var(--muted)", lineHeight:1.5 },
  body12:           { fontSize:12, color:"var(--muted2)", lineHeight:1.5 },
  spinner:          { width:64, height:64, border:"4px solid var(--border2)", borderTopColor:"var(--green)", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 20px" },
  dot:              { width:28, height:28, borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
};

export default function NotFoundScreen({
  setScreen,
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
  const [ingItems, setIngItems] = React.useState([]);
  const [ingInput, setIngInput] = React.useState("");

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

  React.useEffect(() => {
    if (notFoundStep === 2) { setIngItems([]); setIngInput(""); }
  }, [notFoundStep]);

  return (
    <>
      <div className="screen fade-in">
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 0 14px" }}>
          <button onClick={() => setScreen(SCREENS.HOME)}
            style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2">
              <path strokeLinecap="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div style={S.flex1}>
            <div style={S.h17}>Nyt produkt</div>
            <div style={{ fontSize:12, color:"var(--muted)", marginTop:1, fontFamily:"monospace" }}>EAN: {notFoundEan}</div>
          </div>
          {/* Fremgangsindikator */}
          <div style={{ display:"flex", gap:5, alignItems:"center" }}>
            {[1,2,3,4,5].map(s => (
              <div key={s} style={{
                width: notFoundStep === s ? 20 : 8,
                height:8, borderRadius:4, transition:"all .3s",
                background: s < notFoundStep ? "var(--green)" : s === notFoundStep ? "var(--green)" : "var(--border2)"
              }} />
            ))}
          </div>
        </div>

        {/* ── TRIN 1: Fotografér forsiden ── */}
        {notFoundStep === 1 && !ocrLoading && (
          <div className="fade-in">
            <div style={{ background:"var(--surface2)", borderRadius:16, padding:"24px 20px", marginBottom:16, textAlign:"center", border:"1px solid var(--border)" }}>
              <div style={{ fontSize:52, marginBottom:10 }}>📦</div>
              <div style={{ fontSize:18, fontWeight:900, color:"var(--ink)", marginBottom:8 }}>
                Vi kender ikke dette produkt
              </div>
              <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.7 }}>
                Tag 2 hurtige billeder — vi finder automatisk navn og allergener
              </div>
            </div>

            <div style={{ display:"flex", gap:8, marginBottom:20 }}>
              {[
                { num:1, emoji:"📸", label:"Forside",      desc:"Navn" },
                { num:2, emoji:"🔍", label:"Ingredienser", desc:"Allergener" },
                { num:3, emoji:"🥗", label:"Næring",       desc:"Indhold" },
                { num:4, emoji:"📝", label:"Andet",        desc:"Noter" },
                { num:5, emoji:"✓",  label:"Send",         desc:"Bekræft" },
              ].map(s => (
                <div key={s.num} style={{ flex:1, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 8px", textAlign:"center" }}>
                  <div style={{ fontSize:22, marginBottom:4 }}>{s.emoji}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)" }}>{s.label}</div>
                  <div style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>{s.desc}</div>
                </div>
              ))}
            </div>

            <div style={S.h13bMb}>Trin 1 — Fotografér produktets forside</div>
            <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.6, marginBottom:16 }}>
              Hold telefonen foran produktets forside. Vi bruger billedet til at hente produktnavnet automatisk.
            </div>

            <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, width:"100%", padding:"16px", borderRadius:14, cursor:"pointer", background:"var(--green)", border:"none", color:"#071510", fontSize:15, fontWeight:800, boxShadow:"0 4px 16px rgba(31,39,51,.25)", marginBottom:10 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#071510" strokeWidth="2">
                <path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Fotografér forsiden
              <input type="file" accept="image/*" capture="environment" style={S.none} onChange={handleProductImageCapture} />
            </label>
            <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"13px", borderRadius:12, cursor:"pointer", background:"var(--surface)", border:"1px solid var(--border2)", color:"var(--ink2)", fontSize:13, fontWeight:600, marginBottom:10 }}>
              📁 Vælg fra galleri
              <input type="file" accept="image/*" style={S.none} onChange={handleProductImageCapture} />
            </label>
            <button style={{ width:"100%", background:"none", border:"none", cursor:"pointer", fontSize:12, color:"var(--muted)", padding:"8px 0", fontFamily:"var(--f)" }}
              onClick={() => setNotFoundStep(2)}>
              Spring forside over →
            </button>
          </div>
        )}

        {/* ── SCANNING-LOADER ── */}
        {(ocrLoading || nutritionOcrLoading) && (
          <div className="fade-in" style={S.center60}>
            <div style={S.spinner} />
            <div style={S.h17mb}>
              {notFoundStep === 1 ? "Henter produktnavn…"
                : notFoundStep === 3 ? "Læser næringsindhold…"
                : "Analyserer ingredienser…"}
            </div>
            <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6, marginBottom:20 }}>
              {notFoundStep === 1
                ? "Vores AI læser produktnavnet fra billedet"
                : notFoundStep === 3
                ? "Vi udtrækker energi, fedt, kulhydrat og protein automatisk"
                : "Vi finder allergener og ingredienser automatisk"}
            </div>
            <div style={{ fontSize:11, color:"var(--muted)", opacity:0.7 }}>Det tager typisk 5-10 sekunder ☕</div>
          </div>
        )}

        {/* ── TRIN 2: Fotografér ingredienslisten ── */}
        {notFoundStep === 2 && !ocrLoading && (
          <div className="fade-in">
            {productImagePreview && (
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, marginBottom:14 }}>
                <img loading="lazy" src={productImagePreview} alt="Produkt"
                  style={{ width:52, height:52, objectFit:"contain", borderRadius:8, border:"1px solid var(--border)", flexShrink:0 }} />
                <div style={S.flex1}>
                  <input value={proposedName} onChange={e => setProposedName(e.target.value)}
                    placeholder="Produktnavn…"
                    style={{ width:"100%", border:"none", outline:"none", fontFamily:"var(--f)", fontSize:14, fontWeight:700, color:"var(--ink)", background:"transparent", padding:0 }} />
                  <div style={{ fontSize:11, color:"var(--green)", marginTop:2 }}>✓ Forside fotograferet</div>
                </div>
              </div>
            )}

            <div style={S.h13bMb}>Trin 2 — Fotografér ingredienslisten</div>

            <div style={{ background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:12, padding:"14px", marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:10 }}>Sådan finder du ingredienslisten:</div>
              {[
                "Vend pakken om — ingredienslisten starter typisk med \"Ingredienser:\" eller \"Indeholder:\"",
                "Hold telefonen stille og vent til teksten er skarp",
                "God belysning giver bedre resultat — undgå skygger",
              ].map((txt, i) => (
                <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom: i < 2 ? 8 : 0 }}>
                  <div style={S.dot}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <div style={S.body12}>{txt}</div>
                </div>
              ))}
            </div>

            <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, width:"100%", padding:"16px", borderRadius:14, cursor:"pointer", background:"var(--green)", border:"none", color:"#fff", fontSize:15, fontWeight:800, boxShadow:"0 4px 16px rgba(34,197,94,.3)", marginBottom:10 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Fotografér ingredienslisten
              <input type="file" accept="image/*" capture="environment" style={S.none} onChange={handleImageCapture} />
            </label>
            <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"13px", borderRadius:12, cursor:"pointer", background:"var(--surface)", border:"1px solid var(--border2)", color:"var(--ink2)", fontSize:13, fontWeight:600, marginBottom:10 }}>
              📁 Vælg fra galleri
              <input type="file" accept="image/*" style={S.none} onChange={handleImageCapture} />
            </label>
            {scanError && <div className="error-box" style={S.mb10}>⚠️ {scanError}</div>}
            {ocrText && (
              <button className="btn btn-primary btn-full" onClick={() => setNotFoundStep(3)}>
                Fortsæt → Næringsindhold
              </button>
            )}
            <button style={{ width:"100%", background:"none", border:"none", cursor:"pointer", fontSize:12, color:"var(--muted)", padding:"8px 0", fontFamily:"var(--f)" }}
              onClick={() => { if (!ocrText) setProposedFlags({}); setNotFoundStep(3); }}>
              {ocrText ? "Spring næring over →" : "Spring ingredienser over →"}
            </button>
          </div>
        )}

        {/* ── TRIN 3: Næringsindhold ── */}
        {notFoundStep === 3 && !ocrLoading && !nutritionOcrLoading && (
          <div className="fade-in">
            <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:4 }}>
              Trin 3 — Næringsindhold (valgfrit)
            </div>
            <div style={{ fontSize:12, color:"var(--muted)", marginBottom:16, lineHeight:1.5 }}>
              Fotografér eller skriv næringsdeklarationen. Alle felter er valgfri.
            </div>

            <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, width:"100%", padding:"16px", borderRadius:14, cursor:"pointer", background:"var(--green)", border:"none", color:"#071510", fontSize:15, fontWeight:800, marginBottom:8, boxShadow:"0 4px 16px rgba(74,222,128,.25)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#071510" strokeWidth="2">
                <path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Fotografér næringsdeklarationen
              <input type="file" accept="image/*" capture="environment" style={S.none} onChange={handleNutritionCapture} />
            </label>
            <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"11px", borderRadius:12, cursor:"pointer", background:"var(--surface)", border:"1px solid var(--border2)", color:"var(--ink2)", fontSize:12, fontWeight:600, marginBottom:14 }}>
              📁 Vælg fra galleri
              <input type="file" accept="image/*" style={S.none} onChange={handleNutritionCapture} />
            </label>

            {proposedNutrition && Object.values(proposedNutrition).some(v => v) && (
              <div style={{ padding:"8px 12px", background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:10, marginBottom:10, fontSize:12, color:"var(--green)", fontWeight:700 }}>
                ✓ Næringsindhold delvist udfyldt — tjek og ret felterne herunder
              </div>
            )}

            <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"14px", marginBottom:14 }}>
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
                    <div style={{ fontSize:10, color:"var(--muted)", fontWeight:700, marginBottom:4 }}>{label}</div>
                    <input className="field" placeholder={placeholder}
                      value={proposedNutrition?.[key] || ""}
                      onChange={e => setProposedNutrition(prev => ({ ...prev, [key]: e.target.value }))}
                      style={{ padding:"8px 10px", fontSize:12 }} />
                  </div>
                ))}
              </div>
            </div>

            <button className="btn btn-primary btn-full" onClick={() => setNotFoundStep(4)}>
              Fortsæt → Andet
            </button>
            <button style={{ width:"100%", background:"none", border:"none", cursor:"pointer", fontSize:12, color:"var(--muted)", padding:"10px 0", fontFamily:"var(--f)" }}
              onClick={() => setNotFoundStep(4)}>
              Spring næring over →
            </button>
          </div>
        )}

        {/* ── TRIN 4: Andet / noter ── */}
        {notFoundStep === 4 && !ocrLoading && (
          <div className="fade-in">
            <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:4 }}>
              Trin 4 — Yderligere oplysninger (valgfrit)
            </div>
            <div style={{ fontSize:12, color:"var(--muted)", marginBottom:16, lineHeight:1.5 }}>
              Tilføj ekstra information — fx opbevaringsinstruktioner, certifikater (Ø, Halal, Vegan) eller andet.
            </div>

            <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"14px", marginBottom:14 }}>
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
              <textarea className="field" rows={3}
                placeholder="Fx: 'Opbevares køligt', 'Vegansk certificeret', 'Sæsonvare'…"
                value={proposedNotes || ""}
                onChange={e => setProposedNotes(e.target.value)}
                style={{ resize:"none", fontSize:12 }} />
            </div>

            <button className="btn btn-primary btn-full" onClick={() => setNotFoundStep(5)}>
              Fortsæt → Gennemse og send
            </button>
            <button style={{ width:"100%", background:"none", border:"none", cursor:"pointer", fontSize:12, color:"var(--muted)", padding:"10px 0", fontFamily:"var(--f)" }}
              onClick={() => setNotFoundStep(5)}>
              Spring over →
            </button>
          </div>
        )}

        {/* ── TRIN 5: Gennemse og send ── */}
        {notFoundStep === 5 && !ocrLoading && (
          <div className="fade-in">
            <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:12 }}>
              Trin 5 — Gennemse og send
            </div>

            {/* Produktkort */}
            <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", marginBottom:12 }}>
              <div style={S.rowBetweenMb10}>
                <div style={{ fontSize:12, fontWeight:800, color:"var(--ink)" }}>📸 Forside og navn</div>
                <button onClick={() => setNotFoundStep(1)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:"var(--muted)", fontFamily:"var(--f)", padding:"2px 8px" }}>← Ret</button>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                {productImagePreview
                  ? <img loading="lazy" src={productImagePreview} alt="Produkt" style={{ width:60, height:60, objectFit:"contain", borderRadius:10, border:"1px solid var(--border)", flexShrink:0 }} />
                  : <div style={{ width:60, height:60, borderRadius:10, background:"var(--paper2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>📦</div>
                }
                <div style={S.flex1}>
                  <div style={{ fontSize:11, color:"var(--muted)", fontWeight:600, marginBottom:4 }}>Produktnavn</div>
                  <input value={proposedName} onChange={e => setProposedName(e.target.value)}
                    placeholder="Skriv produktnavn…" className="field"
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
                <div style={S.h13}>🔍 Ingredienser</div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  {ocrText && <div style={{ fontSize:11, color:"var(--green)", fontWeight:700 }}>✓ {ingItems.length} fundet</div>}
                  <label style={{ fontSize:11, color:"var(--muted)", cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    {ocrText ? "Nyt billede" : "Tag billede"}
                    <input type="file" accept="image/*" capture="environment" style={S.none} onChange={handleImageCapture} />
                  </label>
                </div>
              </div>

              {!ocrText && ingItems.length === 0 && (
                <div style={{ fontSize:12, color:"var(--amber)", fontWeight:600, padding:"8px 10px", background:"var(--amber-lt)", borderRadius:8, marginBottom:10 }}>
                  ⚠ Ingen ingredienser endnu — tag et billede eller skriv dem herunder
                </div>
              )}

              {ingItems.length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                  {ingItems.map((item, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:20 }}>
                      <span style={{ fontSize:12, color:"var(--ink)" }}>{item}</span>
                      <div onClick={() => setIngItems(p => p.filter((_,j)=>j!==i))}
                        style={{ cursor:"pointer", color:"var(--muted)", fontSize:14, lineHeight:1, marginLeft:2 }}>×</div>
                    </div>
                  ))}
                </div>
              )}

              <div style={S.rowGap8}>
                <input className="field" placeholder="Tilføj ingrediens…" value={ingInput}
                  onChange={e => setIngInput(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && addIngItem()}
                  style={{ flex:1, fontSize:12 }} />
                <button className="btn btn-outline btn-sm" onClick={addIngItem} style={{ flexShrink:0 }}>+</button>
              </div>
              {ingItems.length > 0 && (
                <div style={{ fontSize:10, color:"var(--muted)", marginTop:8, lineHeight:1.5 }}>
                  Tryk × for at fjerne. Rå tekst: <span style={{ fontFamily:"monospace" }}>{ingToText(ingItems).slice(0,80)}{ingToText(ingItems).length>80?"…":""}</span>
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
                <div style={S.h13}>⚠️ Allergener</div>
                <div style={S.sub11}>Tryk for at til/fra</div>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {ALLERGENS.filter(a => !["svovl","lupin","bloeddyr"].includes(a.id)).map(a => {
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
                      style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 11px", borderRadius:100, cursor:"pointer", border:`1px solid ${isOn ? "var(--red-md)" : isTrace ? "var(--amber-md)" : "var(--border2)"}`, background: isOn ? "var(--red-lt)" : isTrace ? "var(--amber-lt)" : "var(--paper2)", transition:"all .15s" }}>
                      <span style={{ fontSize:14 }}>{a.emoji}</span>
                      <span style={{ fontSize:11, fontWeight:700, color: isOn ? "var(--red)" : isTrace ? "var(--amber)" : "var(--muted2)" }}>{a.label}</span>
                      {isOn    && <span style={{ fontSize:9, fontWeight:800, color:"var(--red)",   background:"var(--red-lt)",   padding:"1px 5px", borderRadius:4 }}>JA</span>}
                      {isTrace && <span style={{ fontSize:9, fontWeight:800, color:"var(--amber)", background:"var(--amber-lt)", padding:"1px 5px", borderRadius:4 }}>SPOR</span>}
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
                <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:10 }}>
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
                      <span style={{ color:"var(--muted)" }}>{label}</span>
                      <span style={{ color:"var(--ink)", fontWeight:700 }}>{proposedNutrition[key]}</span>
                    </div>
                  ))}
                </div>
                <button style={{ marginTop:10, fontSize:11, color:"var(--muted)", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--f)", padding:0 }}
                  onClick={() => setNotFoundStep(3)}>← Ret næringsindhold</button>
              </div>
            )}

            {/* Mærkninger */}
            {proposedNotes && (
              <div style={S.card}>
                <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:6 }}>Mærkninger</div>
                <div style={{ fontSize:12, color:"var(--ink2)", lineHeight:1.6 }}>{proposedNotes}</div>
                <button style={{ marginTop:6, fontSize:11, color:"var(--muted)", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--f)", padding:0 }}
                  onClick={() => setNotFoundStep(4)}>← Ret mærkninger</button>
              </div>
            )}

            <div style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"10px 12px", background:"var(--paper2)", borderRadius:10, marginBottom:14 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}>
                <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 16v-4M12 8h.01"/>
              </svg>
              <div style={S.sub11lh}>
                Dit bidrag gennemgås af EatSafe-teamet inden publicering. Tak fordi du hjælper!
              </div>
            </div>

            {scanError && <div className="error-box" style={S.mb10}>⚠️ {scanError}</div>}

            <button
              onClick={() => {
                if (ingItems.length > 0) setOcrText(ingToText(ingItems));
                submitProduct();
              }}
              disabled={submitting || !proposedName.trim()}
              style={{ width:"100%", background: proposedName.trim() ? "var(--green)" : "var(--border2)", color: proposedName.trim() ? "#071510" : "var(--muted)", border:"none", borderRadius:12, padding:"15px", fontFamily:"var(--f)", fontSize:15, fontWeight:800, cursor: proposedName.trim() ? "pointer" : "not-allowed", marginBottom:8, opacity: submitting ? 0.6 : 1 }}>
              {submitting
                ? <><div style={{ width:16, height:16, border:"2px solid rgba(0,0,0,.2)", borderTopColor:"#071510", borderRadius:"50%", animation:"spin .7s linear infinite", display:"inline-block", marginRight:8 }} />Sender…</>
                : "Send produkt ind ✓"}
            </button>
            <button className="btn btn-ghost btn-full" onClick={() => setNotFoundStep(2)}>← Tilbage</button>
          </div>
        )}
      </div>

      {/* Fuld-skærm loading ved submit */}
      {submitting && (
        <div style={{ position:"fixed", inset:0, zIndex:9998, background:"rgba(0,0,0,.7)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
          <div style={{ width:48, height:48, border:"3px solid var(--border2)", borderTopColor:"var(--green)", borderRadius:"50%", animation:"spin .8s linear infinite" }} />
          <div style={{ fontSize:14, fontWeight:700, color:"var(--ink)" }}>Sender produkt…</div>
          <div style={{ fontSize:12, color:"var(--muted)" }}>Vent venligst</div>
        </div>
      )}
    </>
  );
}
