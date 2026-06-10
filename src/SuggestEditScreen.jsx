// @ts-nocheck
import React, { useState, useEffect } from "react";
import { SCREENS, SUPABASE_URL } from "./constants.jsx";
import { makeHeaders, apiCall } from "./helpers.js";
import { ProductImage } from "./SharedComponents.jsx";

const S = {
  none:           { display:"none" },
  flex1:          { flex:1 },
  flexMin:        { flex:1, minWidth:0 },
  mb12:           { marginBottom:12 },
  rowBetweenMb10: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 },
  rowGap8:        { display:"flex", gap:8 },
  h13:            { fontSize:13, fontWeight:800, color:"var(--ink)" },
  h13b:           { fontSize:13, fontWeight:700, color:"var(--ink)" },
  h13bMb:         { fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:8 },
  h17:            { fontSize:17, fontWeight:800, color:"var(--ink)" },
  h17mb:          { fontSize:17, fontWeight:800, color:"var(--ink)", marginBottom:8 },
  sub11:          { fontSize:11, color:"var(--muted)" },
  sub11lh:        { fontSize:11, color:"var(--muted)", lineHeight:1.5 },
  sub11mt:        { fontSize:11, color:"var(--muted)", marginTop:1 },
  spinner:        { width:64, height:64, border:"4px solid var(--border2)", borderTopColor:"var(--green)", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 20px" },
  center60:       { textAlign:"center", padding:"60px 20px" },
};

export default function SuggestEditScreen({
  scanResult,
  accessToken,
  userId,
  editStep, setEditStep,
  editType, setEditType,
  editIngText, setEditIngText,
  editNote, setEditNote,
  editProductImage,
  handleEditProductCapture,
  setScreen,
}) {
  const [ingItems, setIngItems] = useState([]);
  const [ingInput, setIngInput] = useState("");

  // Nulstil ingrediensliste ved nyt redigeringsforslag
  useEffect(() => {
    if (editStep === "start") { setIngItems([]); setIngInput(""); }
  }, [editStep]);

  // Sync ingItems → editIngText automatisk
  useEffect(() => {
    if (ingItems.length > 0) setEditIngText(ingItems.join(", "));
  }, [ingItems]);

  const addIngItem = () => {
    const v = ingInput.trim();
    if (v) { setIngItems(p => [...p, v]); setIngInput(""); }
  };

  const ingToText = (items) => items.join(", ");

  // ── OCR via Edge Function ─────────────────────────────────────────────────
  const runOcr = async (file) => {
    setEditStep("scanning");
    try {
      const b64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/ocr`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({ image_base64: b64 }),
      });
      const data = await resp.json();
      setEditIngText(data.success && data.text ? data.text : "");
      setEditStep("review");
    } catch {
      setEditStep("review");
    }
  };

  // ── Send forslag ──────────────────────────────────────────────────────────
  const submit = async () => {
    setEditStep("sending");
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/product_submissions`, {
        method: "POST",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
        body: JSON.stringify({
          product_id:   scanResult.id || null,
          ean:          scanResult.code || scanResult.ean,
          product_name: scanResult.name,
          brand:        scanResult.brand,
          ingredients:  editType === "ingredients" ? editIngText : null,
          notes:        `Type: ${editType}. ${editNote}`.trim(),
          submitted_by: userId,
          status:       "pending",
          type:         "edit",
        }),
      });
      setEditStep("done");
    } catch (e) {
      alert("Fejl: " + e.message);
      setEditStep("review");
    }
  };

  if (!scanResult) return null;

  return (
    <div className="screen fade-in">

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 0 14px" }}>
        <button onClick={() => setScreen(SCREENS.RESULT)}
          style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2">
            <path strokeLinecap="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div style={S.flexMin}>
          <div style={S.h17}>Hjælp os med at forbedre</div>
          <div style={{ fontSize:12, color:"var(--muted)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {scanResult.name}
          </div>
        </div>
      </div>

      {/* Produkt-chip */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, marginBottom:16 }}>
        <ProductImage product={scanResult} size={40} />
        <div style={S.flexMin}>
          <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{scanResult.name}</div>
          {scanResult.brand && <div style={S.sub11mt}>{scanResult.brand}</div>}
          <div style={{ fontSize:10, color:"var(--muted)", marginTop:1, fontFamily:"monospace" }}>EAN: {scanResult.code}</div>
        </div>
      </div>

      {/* ── TRIN 1: Vælg hvad der mangler ── */}
      {editStep === "start" && (
        <div className="fade-in">
          <div style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.6, marginBottom:16 }}>
            Hvad mangler eller er forkert på dette produkt?
          </div>
          {[
            { id:"ingredients", emoji:"🥦", title:"Ingrediensliste mangler",     desc:"Fotografér bagsiden af pakken med ingredienserne" },
            { id:"nutrition",   emoji:"📊", title:"Næringsindhold mangler",      desc:"Fotografér næringstabellen på pakken" },
            { id:"image",       emoji:"📸", title:"Produktbilledet er forkert",  desc:"Tag et nyt billede af produktets forside" },
            { id:"other",       emoji:"✏️", title:"Andet er forkert",            desc:"Skriv hvad der skal rettes" },
          ].map(opt => (
            <div key={opt.id}
              onClick={() => { setEditType(opt.id); setEditStep(opt.id === "other" ? "review" : "guide"); }}
              style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, marginBottom:8, cursor:"pointer" }}>
              <div style={{ fontSize:28, flexShrink:0 }}>{opt.emoji}</div>
              <div style={S.flex1}>
                <div style={{ fontSize:14, fontWeight:700, color:"var(--ink)" }}>{opt.title}</div>
                <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>{opt.desc}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
                <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* ── TRIN 2: Guide til foto ── */}
      {editStep === "guide" && (
        <div className="fade-in">
          <div style={{ background:"var(--surface2)", borderRadius:16, padding:"20px", marginBottom:16, textAlign:"center", border:"1px solid var(--border)" }}>
            <div style={{ fontSize:48, marginBottom:10 }}>
              {editType === "ingredients" ? "🥫" : editType === "nutrition" ? "📋" : "📦"}
            </div>
            <div style={{ fontSize:16, fontWeight:800, color:"var(--ink)", marginBottom:8 }}>
              {editType === "ingredients" ? "Fotografér ingredienslisten"
               : editType === "nutrition" ? "Fotografér næringstabellen"
               : "Fotografér produktets forside"}
            </div>
            <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.7 }}>
              {editType === "ingredients"
                ? "Vend pakken om og find listen der starter med 'Ingredienser:'. Hold telefonen stille og sørg for god belysning."
                : editType === "nutrition"
                ? "Find tabellen med energi, fedt, protein osv. Hold telefonen parallelt med pakken for skarpest billede."
                : "Hold produktet mod en lys baggrund. Sørg for at stregkoden og produktnavnet er synlige."}
            </div>
          </div>

          <div style={{ background:"var(--paper2)", borderRadius:12, padding:"14px 16px", marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:8 }}>💡 Tips til et godt billede</div>
            {["Hold telefonen vandret og i armslængde", "Sørg for god belysning — undgå skygger", "Hold billedet skarpt — vent til kameraet fokuserer"].map((tip, i) => (
              <div key={i} style={{ display:"flex", gap:8, alignItems:"center", marginBottom: i < 2 ? 6 : 0 }}>
                <div style={{ width:18, height:18, borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                </div>
                <div style={{ fontSize:12, color:"var(--muted2)" }}>{tip}</div>
              </div>
            ))}
          </div>

          <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, width:"100%", padding:"16px", borderRadius:14, cursor:"pointer", background:"var(--green)", border:"none", color:"#fff", fontSize:16, fontWeight:800, boxShadow:"0 4px 16px rgba(34,197,94,.3)", marginBottom:10 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Tag billede med kamera
            <input type="file" accept="image/*" capture="environment" style={S.none} onChange={e => e.target.files[0] && runOcr(e.target.files[0])} />
          </label>
          <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"13px", borderRadius:12, cursor:"pointer", background:"var(--surface)", border:"1px solid var(--border2)", color:"var(--ink2)", fontSize:14, fontWeight:600, marginBottom:10 }}>
            📁 Vælg billede fra galleri
            <input type="file" accept="image/*" style={S.none} onChange={e => e.target.files[0] && runOcr(e.target.files[0])} />
          </label>
          <button className="btn btn-ghost btn-full btn-sm" onClick={() => setEditStep("review")}>
            Skriv manuelt i stedet
          </button>
        </div>
      )}

      {/* ── TRIN 3: Scanner ── */}
      {editStep === "scanning" && (
        <div className="fade-in" style={S.center60}>
          <div style={S.spinner} />
          <div style={S.h17mb}>Analyserer billede…</div>
          <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6 }}>
            Vores AI læser teksten fra dit billede.<br/>Det tager et par sekunder.
          </div>
        </div>
      )}

      {/* ── TRIN 4: Gennemse og send ── */}
      {editStep === "review" && (
        <div className="fade-in">

          {/* Ingrediensliste editor */}
          {editType === "ingredients" && (
            <div className="card" style={S.mb12}>
              <div style={S.rowBetweenMb10}>
                <div style={S.h13}>Ingredienser</div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  {ingItems.length > 0 && <div style={{ fontSize:11, color:"var(--green)", fontWeight:700 }}>✓ {ingItems.length} ingredienser</div>}
                  <label style={{ fontSize:11, color:"var(--muted)", cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    {editIngText ? "Nyt billede" : "Tag billede"}
                    <input type="file" accept="image/*" capture="environment" style={S.none} onChange={e => e.target.files[0] && runOcr(e.target.files[0])} />
                  </label>
                </div>
              </div>

              {!editIngText && ingItems.length === 0 && (
                <div style={{ fontSize:12, color:"var(--amber)", fontWeight:600, padding:"8px 10px", background:"var(--amber-lt)", borderRadius:8, marginBottom:10 }}>
                  ⚠ Fotografér ingredienslisten eller skriv dem herunder
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
                <button className="btn btn-outline btn-sm" onClick={addIngItem}>+</button>
              </div>
            </div>
          )}

          {/* Næringsindhold */}
          {editType === "nutrition" && (
            <div className="card" style={S.mb12}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <div style={S.h13b}>Næringsindhold</div>
                <label style={{ fontSize:11, color:"var(--muted)", cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  Nyt billede
                  <input type="file" accept="image/*" capture="environment" style={S.none} onChange={e => e.target.files[0] && runOcr(e.target.files[0])} />
                </label>
              </div>
              <textarea value={editIngText} onChange={e => setEditIngText(e.target.value)}
                rows={5} placeholder="Fx. Energi: 250 kcal, Fedt: 5g, Kulhydrater: 30g..."
                className="field" style={{ resize:"vertical", fontFamily:"var(--f)", fontSize:13, lineHeight:1.6 }} />
            </div>
          )}

          {/* Produktbillede */}
          {editType === "image" && (
            <div className="card" style={S.mb12}>
              <div style={S.h13bMb}>Nyt produktbillede</div>
              {editProductImage && (
                <img loading="lazy" src={editProductImage} alt="Produkt"
                  style={{ width:"100%", maxHeight:180, objectFit:"contain", borderRadius:10, marginBottom:10 }} />
              )}
              <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", background:"var(--paper2)", border:"1.5px dashed var(--border2)", borderRadius:10, cursor:"pointer", fontSize:13, color:"var(--muted2)" }}>
                {editProductImage ? "📸 Tag nyt billede" : "📸 Tag billede af produktet"}
                <input type="file" accept="image/*" capture="environment" style={S.none} onChange={handleEditProductCapture} />
              </label>
            </div>
          )}

          {/* Andet / bemærkning */}
          <div className="card" style={S.mb12}>
            <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:6 }}>Bemærkning (valgfrit)</div>
            <textarea value={editNote} onChange={e => setEditNote(e.target.value)}
              rows={2} placeholder="Fx. Ny udgave af produktet, fejl i allergen-info..."
              className="field" style={{ resize:"none", fontFamily:"var(--f)", fontSize:13 }} />
          </div>

          {/* Info */}
          <div style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"10px 12px", background:"var(--paper2)", borderRadius:10, marginBottom:14 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}>
              <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 16v-4M12 8h.01"/>
            </svg>
            <div style={S.sub11lh}>Dit forslag gennemgås af vores team inden det publiceres. Tak for din hjælp!</div>
          </div>

          <button
            onClick={() => {
              if (editType === "ingredients" && ingItems.length > 0) setEditIngText(ingToText(ingItems));
              submit();
            }}
            disabled={editType === "ingredients" && !editIngText.trim() && ingItems.length === 0}
            style={{ width:"100%", background:"var(--green)", color:"#071510", border:"none", borderRadius:12, padding:"15px", fontFamily:"var(--f)", fontSize:15, fontWeight:800, cursor:"pointer", marginBottom:8, opacity: (editType === "ingredients" && !editIngText.trim()) ? 0.4 : 1 }}>
            Send forslag ✓
          </button>
          <button className="btn btn-ghost btn-full" onClick={() => setScreen(SCREENS.RESULT)}>Annuller</button>
        </div>
      )}

      {/* ── TRIN 5: Sender ── */}
      {editStep === "sending" && (
        <div className="fade-in" style={S.center60}>
          <div style={S.spinner} />
          <div style={S.h17}>Sender…</div>
        </div>
      )}

      {/* ── TRIN 6: Tak! ── */}
      {editStep === "done" && (
        <div className="fade-in" style={{ textAlign:"center", padding:"48px 20px" }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:"var(--green-lt)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5">
              <path strokeLinecap="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <div style={{ fontSize:22, fontWeight:900, color:"var(--ink)", marginBottom:8 }}>Tak for din hjælp! 🙏</div>
          <div style={{ fontSize:14, color:"var(--muted2)", lineHeight:1.7, marginBottom:28 }}>
            Dit forslag er modtaget og vil blive gennemgået af vores team snarest.
            Du hjælper andre med allergi med at spise trygt.
          </div>
          <button className="btn btn-primary btn-full" onClick={() => setScreen(SCREENS.RESULT)}>
            Tilbage til produktet
          </button>
        </div>
      )}

    </div>
  );
}
