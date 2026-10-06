// @ts-nocheck
import React, { useState, useEffect } from "react";
import { SCREENS, SUPABASE_URL } from "./constants.jsx";
import { makeHeaders, apiCall, compressImageToBase64 } from "./helpers.js";
import { Icon, ProductImage, Loader, showToast } from "./SharedComponents.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { UI } from "./styleUtils.js";

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
  sub11:          { fontSize:11, color:"var(--muted)" },
  sub11lh:        { fontSize:11, color:"var(--muted)", lineHeight:1.5 },
  sub11mt:        { fontSize:11, color:"var(--muted)", marginTop:1 },
};

export default function SuggestEditScreen({
  scanResult,
  editStep, setEditStep,
  editType, setEditType,
  editIngText, setEditIngText,
  editNote, setEditNote,
  editProductImage,
  editProductImageB64,
  handleEditProductCapture,
}) {
  const { accessToken, userId } = useAuthContext();
  const { setScreen } = useNavigationContext();
  const [ingItems, setIngItems] = useState([]);
  const [ingInput, setIngInput] = useState("");
  // Det foto, OCR'en blev kørt på, sendes med indsendelsen, så teamet kan kvalitetstestes mod det.
  const [photoB64, setPhotoB64] = useState(null);
  // Tilbage = ét logisk trin tilbage til den visning, brugeren kom fra. Stakken fyldes kun af brugerens egne valg inde i flowet;
  // åbnes flowet direkte på et trin (fx "Indsend ingrediensliste" fra produktet), er stakken tom, og tilbage fører til produktet.
  const [stepStack, setStepStack] = useState([]);
  const goStep = (next) => { setStepStack(st => [...st, editStep]); setEditStep(next); };
  const goBack = () => {
    if (editStep === "scanning" || editStep === "sending") return;
    if (editStep === "start" || editStep === "done") { setScreen(SCREENS.RESULT); return; }
    // Fotoskærmene (og de øvrige undertrin) går altid tilbage til "Hjælp os med at forbedre"-oversigten, aldrig helt til produktet.
    if (stepStack.length === 0) { setEditStep("start"); return; }
    const prev = stepStack[stepStack.length - 1];
    setStepStack(st => st.slice(0, -1));
    setEditStep(prev);
  };

  // Nulstil ingrediensliste ved nyt redigeringsforslag
  useEffect(() => {
    if (editStep === "start") { setIngItems([]); setIngInput(""); setPhotoB64(null); }
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

  // Androids systemtilbage (App.jsx) følger samme trin-stak som tilbagepilen.
  useEffect(() => {
    const onBack = (e) => { e.preventDefault(); goBack(); };
    window.addEventListener("eatsafe:back", onBack);
    return () => window.removeEventListener("eatsafe:back", onBack);
  });

  // Send forslag er først aktiv, når der er noget at sende for den valgte type.
  const canSubmit = editType === "ingredients" ? (editIngText.trim().length > 0 || ingItems.length > 0)
    : editType === "nutrition" ? editIngText.trim().length > 0
    : editType === "image" ? !!editProductImage
    : editNote.trim().length > 0;

  // ── OCR via Edge Function ─────────────────────────────────────────────────
  const runOcr = async (file) => {
    if (editStep !== "review") setStepStack(st => [...st, editStep]);
    setEditStep("scanning");
    try {
      const b64 = await compressImageToBase64(file);
      setPhotoB64(b64);
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/ocr`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({ image_base64: b64, mode: editType === "nutrition" ? "nutrition" : "ingredients" }),
      });
      const data = await resp.json();
      const text = data.success && data.text ? data.text : "";
      // Split OCR-teksten op i chips, så senere manuelle tilføjelser lægges oveni
      // i stedet for at overskrive hele den OCR-læste liste (se sync-effect ovenfor).
      setIngItems(text ? text.split(",").map(s => s.trim()).filter(Boolean) : []);
      setEditIngText(text);
      if (!text) showToast("Vi kunne ikke læse billedet. Prøv igen eller skriv manuelt.", "error");
      setEditStep("review");
    } catch {
      showToast("Vi kunne ikke læse billedet. Prøv igen eller skriv manuelt.", "error");
      setEditStep("review");
    }
  };

  // ── Send forslag ──────────────────────────────────────────────────────────
  const submit = async () => {
    setEditStep("sending");
    try {
      await apiCall(`${SUPABASE_URL}/functions/v1/submissions`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({
          type:         "edit",
          product_id:   scanResult.id || null,
          ean:          scanResult.code || scanResult.ean,
          submitted_by: userId,
          ocr_raw_text: editType === "ingredients" ? editIngText : null,
          raw_label_image: editType === "ingredients" ? photoB64 : null,
          images: editType === "nutrition" && photoB64 ? [{ kind: "nutrition", base64: photoB64 }] : [],
          ai_parsed_data: {
            name:  scanResult.name,
            brand: scanResult.brand,
            edit_type: editType,
            ...(editType === "nutrition" ? { nutrition_text: editIngText } : {}),
            ...(editType === "image" && editProductImageB64 ? { product_image_base64: editProductImageB64 } : {}),
          },
          notes:        `Type: ${editType}. ${editNote}`.trim(),
          user_confirmed: true,
        }),
      });
      setEditStep("done");
    } catch (e) {
      showToast("Kunne ikke sende forslaget. Prøv igen.", "error");
      setEditStep("review");
    }
  };

  // Kan ske hvis appen har mistet produkt-konteksten, fx fordi siden er blevet
  // genindlæst af OS'et mens kameraet var åbent (almindeligt på Android med lav
  // hukommelse). Uden dette rendere skærmen ingenting — hvilket ser ud som et
  // nedbrud — i stedet for at give brugeren en vej videre.
  if (!scanResult) {
    return (
      <div className="screen fade-in" style={{ textAlign:"center", padding:"60px 20px" }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}><Icon name="warning" size={34} color="var(--muted)" /></div>
        <div style={{ fontSize:15, fontWeight:800, color:"var(--ink)", marginBottom:8 }}>Produktet blev væk</div>
        <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6, marginBottom:20 }}>
          Vi kunne ikke finde produktet længere — det kan ske hvis appen har været i baggrunden.
          Scan eller søg produktet igen for at foreslå en rettelse.
        </div>
        <button className="btn btn-primary btn-full" onClick={() => setScreen(SCREENS.HOME)}>Til forsiden</button>
      </div>
    );
  }

  return (
    <div className="screen fade-in">

      {/* Header */}
      <div style={UI.avatarRow}>
        <button onClick={goBack} aria-label="Tilbage"
          style={UI.iconBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2">
            <path strokeLinecap="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div style={S.flexMin}>
          <div style={S.h17}>Hjælp os med at forbedre</div>
          <div style={{ fontSize:12, color:"var(--muted)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {scanResult.name || "Produkt uden navn"}
          </div>
        </div>
      </div>

      {/* Produkt-chip */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, marginBottom:16, boxShadow:"var(--sh)" }}>
        <ProductImage product={scanResult} size={40} />
        <div style={S.flexMin}>
          <div style={UI.ufs13_fw700_cink_ovhidden_toellipsis_wsnowrap}>{scanResult.name || "Produkt uden navn"}</div>
          {scanResult.brand && <div style={S.sub11mt}>{scanResult.brand}</div>}
          <div style={{ fontSize:10, color:"var(--muted)", marginTop:1, fontFamily:"monospace" }}>EAN: {scanResult.code}</div>
        </div>
      </div>

      {/* ── TRIN 1: Vælg hvad der mangler ── */}
      {editStep === "start" && (
        <div className="fade-in">
          <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6, marginBottom:16 }}>
            {editType === "missing" ? "Hvilke oplysninger mangler på dette produkt?"
             : editType === "correct" ? "Hvad er forkert på dette produkt?"
             : "Hvad mangler eller er forkert på dette produkt?"}
          </div>
          {[
            { id:"ingredients", icon:"list",    title:"Ingrediensliste mangler",     desc:"Fotografér bagsiden af pakken med ingredienserne" },
            { id:"nutrition",   icon:"package", title:"Næringsindhold mangler",      desc:"Fotografér næringstabellen på pakken" },
            { id:"image",       icon:"camera",  title:"Produktbilledet er forkert",  desc:"Tag et nyt billede af produktets forside" },
            { id:"other",       icon:"edit",    title:"Andet er forkert",            desc:"Skriv hvad der skal rettes" },
          ].map(opt => (
            <div key={opt.id}
              onClick={() => { setEditType(opt.id); goStep(opt.id === "other" ? "review" : "guide"); }}
              style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, marginBottom:8, cursor:"pointer" }}>
              <div style={UI.ufs28_shr0}><Icon name={opt.icon} size={24} color="var(--ink2)" /></div>
              <div style={S.flex1}>
                <div style={UI.boldInk14}>{opt.title}</div>
                <div style={UI.muted12mt2}>{opt.desc}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
                <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* ── TRIN 2: Guide til foto ── ét samlet, næsten hvidt kort (så intet ligger løst oven på baggrundsbilledet):
          ikon + overskrift + hjælpetekst, kameraknappen øverst, galleri, evt. manuel, og tips nederst. Samme kort til ingrediens, næring og forside. */}
      {editStep === "guide" && (
        <div className="fade-in card" style={{ background:"rgba(255,255,255,.97)", padding:16, marginTop:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
            <div style={{ flexShrink:0, display:"flex" }}>
              <Icon name={editType === "ingredients" ? "list" : editType === "nutrition" ? "package" : "camera"} size={28} color="var(--ink2)" />
            </div>
            <div style={S.flexMin}>
              <div style={{ fontSize:15, fontWeight:800, color:"var(--ink)" }}>
                {editType === "ingredients" ? "Fotografér ingredienslisten"
                 : editType === "nutrition" ? "Fotografér næringstabellen"
                 : "Fotografér produktets forside"}
              </div>
              <div style={{ fontSize:12.5, color:"var(--ink2)", lineHeight:1.5, marginTop:2 }}>
                {editType === "ingredients"
                  ? "Find listen, der starter med 'Ingredienser:'."
                  : editType === "nutrition"
                  ? "Find tabellen med energi, fedt og protein."
                  : "Sørg for, at stregkoden og navnet er synlige."}
              </div>
            </div>
          </div>

          <label className="btn btn-primary btn-full" style={{ marginBottom:10 }}>
            <Icon name="camera" size={18} color="var(--on-green)" />
            Tag billede med kamera
            <input type="file" accept="image/*" capture="environment" style={S.none} onChange={e => e.target.files[0] && runOcr(e.target.files[0])} />
          </label>
          <label className="btn btn-outline btn-full" style={{ marginBottom:10 }}>
            <Icon name="image" size={16} color="var(--ink2)" /> Vælg billede fra galleri
            <input type="file" accept="image/*" style={S.none} onChange={e => e.target.files[0] && runOcr(e.target.files[0])} />
          </label>
          {editType !== "image" && (
            <button className="btn btn-ghost btn-full btn-sm" style={{ color:"var(--ink2)" }} onClick={() => goStep("review")}>
              Skriv manuelt i stedet
            </button>
          )}

          {/* Tips: samme faste layout på alle fotoskærme (ingrediens, næring, forside) — overskrift og tre punkter under hinanden, aldrig tilfældige linjeskift */}
          <div style={{ marginTop:14, paddingTop:12, borderTop:"1px solid var(--border)", fontSize:12.5, lineHeight:1.4, color:"var(--ink2)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, fontWeight:700, color:"var(--ink)", marginBottom:6 }}><Icon name="bulb" size={14} color="var(--ink)" /> Tips</div>
            {["God belysning", "Undgå skygger", "Hold kameraet stabilt"].map(tip => (
              <div key={tip} style={{ display:"flex", alignItems:"center", gap:6, padding:"2px 0" }}><Icon name="check" size={12} color="var(--green)" /> {tip}</div>
            ))}
          </div>
        </div>
      )}

      {/* ── TRIN 3: Scanner ── */}
      {editStep === "scanning" && (
        <Loader size="lg" text="Analyserer billede…"
          sub={<>Vores AI læser teksten fra dit billede.<br/>Det tager et par sekunder.</>} />
      )}

      {/* ── TRIN 4: Gennemse og send ── */}
      {editStep === "review" && (
        <div className="fade-in">

          {/* Ingrediensliste editor */}
          {editType === "ingredients" && (
            <div className="card" style={S.mb12}>
              <div style={S.rowBetweenMb10}>
                <div style={S.h13}>Ingredienser</div>
                <div style={UI.udflex_g8_aicenter}>
                  {ingItems.length > 0 && <div style={{ ...UI.ufs11_cgreen_fw700, display:"flex", alignItems:"center", gap:3 }}><Icon name="check" size={10} color="var(--green)" /> {ingItems.length} ingredienser</div>}
                  <label style={UI.ufs11_cmuted_curpointer_fw600_dflex_aicenter_g4}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    {editIngText ? "Nyt billede" : "Tag billede"}
                    <input type="file" accept="image/*" capture="environment" style={S.none} onChange={e => e.target.files[0] && runOcr(e.target.files[0])} />
                  </label>
                </div>
              </div>

              {!editIngText && ingItems.length === 0 && (
                <div style={{ fontSize:12, fontWeight:600, color:"var(--ink2)", padding:"8px 10px", background:"var(--paper2)", borderRadius:8, marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
                  <Icon name="info" size={12} color="var(--muted)" /> Fotografér ingredienslisten eller skriv dem herunder
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
                <button className="btn btn-outline btn-sm" onClick={addIngItem} aria-label="Tilføj ingrediens"><Icon name="plus" size={16} /></button>
              </div>
            </div>
          )}

          {/* Næringsindhold */}
          {editType === "nutrition" && (
            <div className="card" style={S.mb12}>
              <div style={UI.udflex_aicenter_jcspacebet_mb8}>
                <div style={S.h13b}>Næringsindhold</div>
                <label style={UI.ufs11_cmuted_curpointer_fw600_dflex_aicenter_g4}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  Nyt billede
                  <input type="file" accept="image/*" capture="environment" style={S.none} onChange={e => e.target.files[0] && runOcr(e.target.files[0])} />
                </label>
              </div>
              <textarea value={editIngText} onChange={e => setEditIngText(e.target.value)}
                aria-label="Ingrediensliste" rows={5} placeholder="Fx Energi: 250 kcal, Fedt: 5g, Kulhydrater: 30g..."
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
              <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", background:"var(--paper2)", border:"1.5px dashed var(--border2)", borderRadius:10, cursor:"pointer", fontSize:13, color:"var(--muted)" }}>
                <Icon name="camera" size={14} color="var(--muted2)" /> {editProductImage ? "Tag nyt billede" : "Tag billede af produktet"}
                <input type="file" accept="image/*" capture="environment" style={S.none} onChange={handleEditProductCapture} />
              </label>
            </div>
          )}

          {/* Bemærkning: valgfri ved de andre typer, påkrævet ved "Andet er forkert" (så knappen og feltet ikke modsiger hinanden) */}
          <div className="card" style={S.mb12}>
            <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:6 }}>
              {editType === "other" ? "Hvad skal rettes?" : "Bemærkning (valgfrit)"}
            </div>
            <textarea value={editNote} onChange={e => setEditNote(e.target.value)}
              aria-label={editType === "other" ? "Hvad skal rettes?" : "Bemærkning (valgfrit)"}
              rows={editType === "other" ? 4 : 2}
              placeholder={editType === "other" ? "Fx forkert navn, forkert mærke eller fejl i allergenoplysninger…" : "Fx ny udgave af produktet, fejl i allergen-info..."}
              className="field" style={{ resize:"none", fontFamily:"var(--f)", fontSize:13 }} />
          </div>

          {/* Info */}
          <div style={UI.udflex_g8_aiflexstar_p10px12px_bgpaper2_br10_mb14}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={UI.ushr0_mt1}>
              <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 16v-4M12 8h.01"/>
            </svg>
            <div style={S.sub11lh}>Dit forslag gennemgås af vores team inden det publiceres. Tak for din hjælp!</div>
          </div>

          <button className="btn btn-primary btn-full" style={{ marginBottom:8 }} disabled={!canSubmit}
            onClick={() => {
              if (editType === "ingredients" && ingItems.length > 0) setEditIngText(ingToText(ingItems));
              submit();
            }}>
            Send forslag <Icon name="check" size={14} color="var(--on-green)" />
          </button>
          <button className="btn btn-outline btn-full" onClick={() => setScreen(SCREENS.RESULT)}>Annuller</button>
        </div>
      )}

      {/* ── TRIN 5: Sender ── */}
      {editStep === "sending" && (
        <Loader size="lg" text="Sender…" />
      )}

      {/* ── TRIN 6: Tak! ── */}
      {editStep === "done" && (
        <div className="fade-in" style={UI.utacenter_p48px20px}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:"var(--green-lt)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5">
              <path strokeLinecap="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <div style={{ fontSize:22, fontWeight:900, color:"var(--ink)", marginBottom:8 }}>Tak for din hjælp!</div>
          <div style={{ fontSize:14, color:"var(--muted)", lineHeight:1.7, marginBottom:28 }}>
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
