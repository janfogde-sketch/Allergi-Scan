// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { PAGE_IDS } from "./constants.jsx";
import { submitFeedback } from "./submitFeedback.js";
import { BUILD_TIME, COMMIT_SHA, formatBuildTime, buildScreenLabel } from "./utils.jsx";
import { getTraceLog, compressImageToBase64 } from "./helpers.js";
import { getRecentErrors } from "./errorReporter.js";
import { FEEDBACK_TYPES } from "./feedbackTypes.js";
import { buildFeedbackContext, diagnosticGroups } from "./feedbackDiagnostics.js";
import { useAuthContext } from "./AuthContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { UI } from "./styleUtils.js";
import { showToast, Icon } from "./SharedComponents.jsx";

// ─────────────────────────────────────────────────────────────────────────────
// FeedbackModal.jsx
//
// Selvstændig feedback-modal. Al state og submitFeedback-logik bor her.
// App.jsx sender kun kontekst-props ind og styrer open/close.
//
// Layout (2. okt. 2026, polering): modalen er en flex-kolonne med fast header (titel + luk), et scrollende midterstykke og en fast
// bund med Send-knappen. Header og knap ligger derfor aldrig oven på indholdet og kan ikke klippes væk ved scroll. Overlayet følger
// visualViewport, så tastaturet på iPhone ikke dækker knappen, og bunden respekterer safe-area.
// ─────────────────────────────────────────────────────────────────────────────

export default function FeedbackModal({
  // Open/close
  open, onClose,

  // Skærmkontekst — bruges til diagnostik
  authTab,
  onboardStep,
  scanResult,
  madpasWaiterView,
  madpasLang,
  selectedRecipe,
  editMode,
  showManualEan,
  profilePopup,
}) {
  const { user, userId, accessToken } = useAuthContext();
  const { screen } = useNavigationContext();
  const [type, setType]         = useState("bug");
  const [text, setText]         = useState("");
  const [image, setImage]       = useState(null);
  const [imageB64, setImageB64] = useState(null);
  const [sending, setSending]   = useState(false);
  const [done, setDone]         = useState(false);
  const [diagOpen, setDiagOpen] = useState(false);
  const [vv, setVv]             = useState(null);
  const fileRef = useRef(null);

  // Følg det synlige område (tastatur på iOS ændrer ikke layout-viewporten): overlayet får synlighedens top og højde
  useEffect(() => {
    if (!open) return undefined;
    const v = window.visualViewport;
    if (!v) return undefined;
    const update = () => setVv({ top: v.offsetTop, height: v.height });
    update();
    v.addEventListener("resize", update);
    v.addEventListener("scroll", update);
    return () => { v.removeEventListener("resize", update); v.removeEventListener("scroll", update); };
  }, [open]);

  if (!open) return null;

  const reset = () => {
    if (image) URL.revokeObjectURL(image);
    setType("bug"); setText(""); setImage(null);
    setImageB64(null); setSending(false); setDone(false); setDiagOpen(false);
  };

  const close = () => { reset(); onClose(); };

  const buildCtx = () => buildFeedbackContext({
    type,
    env: {
      url: window.location.href, userAgent: navigator.userAgent, platform: navigator.platform, language: navigator.language,
      screenSize: `${window.screen.width}x${window.screen.height}`, viewport: `${window.innerWidth}x${window.innerHeight}`,
      online: navigator.onLine, timestamp: new Date().toISOString(),
      standalone: window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true,
    },
    app: {
      buildTime: BUILD_TIME, commitSha: COMMIT_SHA,
      screenLabel: buildScreenLabel({ screen, authTab, onboardStep, scanResult, madpasWaiterView, madpasLang, selectedRecipe, editMode, showManualEan, profilePopup }),
    },
    state: { screen, scanResult, madpasLang, selectedRecipe, onboardStep, userId, user },
    traces: getTraceLog(),
    recentErrors: getRecentErrors(),
  });

  const canSend = !!text.trim() && !sending;

  const submit = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await submitFeedback({ type, description: text, context: buildCtx(), imageBase64: imageB64, accessToken });
      setDone(true);
      setTimeout(() => { close(); }, 2200);
    } catch(e) { showToast(e.message, "error"); }
    setSending(false);
  };

  const onPickImage = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // samme fil kan vælges igen efter "Fjern"
    if (!f) return;
    // Skaleret ned som alle andre billede-uploads i appen — et råt telefonskærmbillede kan let være 3-8MB.
    try {
      const b64 = await compressImageToBase64(f);
      if (image) URL.revokeObjectURL(image);
      setImage(URL.createObjectURL(f));
      setImageB64(b64);
    } catch {
      showToast("Billedet kunne ikke bruges. Prøv et andet.", "error");
    }
  };

  const removeImage = () => { if (image) URL.revokeObjectURL(image); setImage(null); setImageB64(null); };

  // Findes der en registreret fejl på enheden? Bestemmer hjælpeteksten ved "Appen lukker ned" (vi lover kun, hvad vi faktisk sender).
  const hasCrashData = type === "crash" && getRecentErrors().length > 0;
  const ctx = diagOpen ? buildCtx() : null;
  const groups = ctx ? diagnosticGroups(ctx, { type, formatBuild: formatBuildTime }) : [];
  const traceLog = ctx ? ctx.debug_trace : [];
  const recentTraces = traceLog.slice(-10);

  return (
    <div style={{ position:"fixed", left:0, right:0, zIndex:9999, background:"rgba(0,0,0,.7)",
      ...(vv ? { top: vv.top, height: vv.height } : { top:0, bottom:0 }),
      paddingTop:"env(safe-area-inset-top)", boxSizing:"border-box", display:"flex", alignItems:"flex-end" }}
      onClick={e => e.target === e.currentTarget && close()}>
      <div role="dialog" aria-modal="true" aria-labelledby="feedback-title"
        style={{ background:"var(--sheet)", borderRadius:"20px 20px 0 0", width:"100%", maxHeight:"100%",
          display:"flex", flexDirection:"column", overflow:"hidden", border:"1px solid var(--border)", borderBottom:"none" }}
        onClick={e => e.stopPropagation()}>

        {done ? (
          <div style={{ textAlign:"center", padding:"40px 16px calc(40px + env(safe-area-inset-bottom))" }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:"var(--green-selected-bg)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
              <Icon name="check" size={26} color="var(--green)" />
            </div>
            <div style={UI.ufs18_fw900_cink}>Tak for din feedback!</div>
            <div style={{ fontSize:13, color:"var(--muted)", marginTop:6 }}>Vi kigger på det hurtigst muligt.</div>
          </div>
        ) : (
          <>
            {/* Header — fast øverst, scroller ikke med indholdet */}
            <div style={{ flex:"none", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
              padding:"14px 12px 12px 16px", borderBottom:"1px solid var(--border)" }}>
              <div style={{ minWidth:0 }}>
                <div id="feedback-title" style={{ fontSize:19, fontWeight:900, color:"var(--ink)", letterSpacing:"-.2px" }}>Send feedback</div>
                <div style={{ fontSize:10.5, color:"var(--muted)", marginTop:2, letterSpacing:".3px" }}>
                  {PAGE_IDS[screen] || "—"} · Beta v1.0
                </div>
              </div>
              <button type="button" onClick={close} aria-label="Luk" className="member-pick"
                style={{ flex:"none", background:"var(--surface2)", border:"none", borderRadius:"50%", width:44, height:44,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Icon name="x" size={18} color="var(--ink)" />
              </button>
            </div>

            {/* Indhold — det eneste, der scroller */}
            <div style={{ flex:"1 1 auto", minHeight:0, overflowY:"auto", overscrollBehavior:"contain", WebkitOverflowScrolling:"touch", padding:"16px 16px 12px" }}>
              {/* Type */}
              <div style={UI.mb16}>
                <div id="feedback-type-label" style={UI.ufs12_fw700_cink_dblock_mb6}>Type</div>
                <div role="radiogroup" aria-labelledby="feedback-type-label" style={UI.grid2gap6}>
                  {FEEDBACK_TYPES.map(t => {
                    const on = type === t.id;
                    return (
                      <button key={t.id} type="button" role="radio" aria-checked={on} onClick={() => setType(t.id)} className="member-pick"
                        style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", minHeight:44, borderRadius:10, textAlign:"left",
                          fontFamily:"var(--f)", border:`1.5px solid ${on ? "var(--green)" : "var(--border)"}`,
                          background: on ? "var(--green-selected-bg)" : "var(--surface)" }}>
                        <Icon name={t.icon} size={16} color={on ? "var(--green)" : "var(--ink2)"} />
                        <span style={{ fontSize:12.5, fontWeight:700, color: on ? "var(--green)" : "var(--ink)" }}>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
                {type === "crash" && (
                  <div style={{ fontSize:11.5, color:"var(--muted)", lineHeight:1.45, marginTop:8 }}>
                    {hasCrashData
                      ? "Vi vedhæfter automatisk den seneste tekniske fejl, så du ikke selv behøver beskrive de tekniske detaljer."
                      : "Vi fandt ingen nylig crash-log på enheden. Beskriv gerne, hvad du gjorde lige før appen lukkede."}
                  </div>
                )}
              </div>

              {/* Beskrivelse */}
              <div style={UI.mb16}>
                <label htmlFor="feedback-text" style={UI.ufs12_fw700_cink_dblock_mb6}>Beskriv problemet</label>
                <textarea id="feedback-text" value={text} onChange={e => setText(e.target.value)} rows={5}
                  onFocus={e => { const t = e.target; setTimeout(() => t.scrollIntoView?.({ block:"center", behavior:"smooth" }), 300); }}
                  placeholder="Beskriv hvad der skete, og hvad du forventede."
                  style={{ width:"100%", padding:"12px 14px", border:"1.5px solid var(--border2)",
                    borderRadius:12, background:"var(--surface)", fontFamily:"var(--f)",
                    fontSize:16, color:"var(--ink)", resize:"none", outline:"none",
                    lineHeight:1.5, boxSizing:"border-box" }} />
                <div style={{ fontSize:11.5, color:"var(--muted)", lineHeight:1.45, marginTop:6 }}>
                  Fortæl gerne, hvad du gjorde, hvad der skete, og hvad du forventede.
                </div>
              </div>

              {/* Billede — ét skjult filfelt (kamera eller galleri vælges i telefonens egen dialog), bruges af både "Tilføj" og "Skift" */}
              <div style={UI.mb16}>
                <div style={UI.ufs12_fw700_cink_dblock_mb6}>Skærmbillede (valgfrit)</div>
                <input ref={fileRef} type="file" accept="image/*" style={UI.udnone} onChange={onPickImage} aria-label="Vælg skærmbillede" />
                {image ? (
                  <div style={{ display:"flex", alignItems:"center", gap:12, padding:8, border:"1px solid var(--border)", borderRadius:12, background:"var(--surface)" }}>
                    <img src={image} alt="Valgt skærmbillede" style={{ width:52, height:52, borderRadius:8, objectFit:"cover", flex:"none", border:"1px solid var(--border)" }} />
                    <div style={{ flex:1, minWidth:0, fontSize:13, fontWeight:600, color:"var(--ink)" }}>Skærmbillede vedhæftet</div>
                    <button type="button" onClick={() => fileRef.current?.click()}
                      style={{ background:"none", border:"none", minHeight:44, padding:"0 8px", fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"var(--green)", cursor:"pointer" }}>Skift</button>
                    <button type="button" onClick={removeImage}
                      style={{ background:"none", border:"none", minHeight:44, padding:"0 8px", fontFamily:"var(--f)", fontSize:13, fontWeight:600, color:"var(--muted)", cursor:"pointer" }}>Fjern</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()} className="member-pick"
                    style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"12px 14px", minHeight:48, textAlign:"left",
                      border:"1.5px dashed var(--border2)", borderRadius:12, background:"var(--surface)", fontFamily:"var(--f)" }}>
                    <Icon name="camera" size={16} color="var(--muted)" />
                    <span style={UI.muted13}>Tag skærmbillede eller vælg fra galleri</span>
                  </button>
                )}
              </div>

              {/* Diagnostik — sammenfoldet som standard og visuelt sekundær. Åbnet viser den alt, hvad der sendes med. */}
              <div>
                <button type="button" onClick={() => setDiagOpen(o => !o)} aria-expanded={diagOpen} aria-controls="feedback-diag"
                  style={{ display:"flex", alignItems:"center", gap:6, width:"100%", background:"none", border:"none", padding:"10px 0", minHeight:44,
                    fontFamily:"var(--f)", fontSize:12, fontWeight:600, color:"var(--muted)", cursor:"pointer", textAlign:"left" }}>
                  <span>Automatisk inkluderet diagnostik</span>
                  <span style={{ display:"flex", transform: diagOpen ? "rotate(180deg)" : "none", transition:".2s" }}>
                    <Icon name="chevronDown" size={14} color="var(--muted)" />
                  </span>
                </button>
                {diagOpen && (
                  <div id="feedback-diag" style={{ background:"var(--surface2)", borderRadius:10, padding:"10px 12px", display:"flex", flexDirection:"column", gap:10 }}>
                    <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.45 }}>
                      Disse tekniske oplysninger vedhæftes automatisk for at hjælpe os med at finde fejlen.
                    </div>
                    {groups.map(g => (
                      <div key={g.id}>
                        <div style={{ fontSize:10, fontWeight:700, letterSpacing:".6px", textTransform:"uppercase", color:"var(--muted)", marginBottom:4 }}>
                          {g.title}
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:"2px 10px" }}>
                          {g.rows.map(([label, value], i) => (
                            <React.Fragment key={`${label}-${i}`}>
                              <span style={{ fontSize:11, color:"var(--muted)", fontWeight:600, lineHeight:1.6 }}>{label}</span>
                              <span style={{ fontSize:11, color:"var(--ink)", lineHeight:1.6, minWidth:0, overflowWrap:"anywhere" }}>{value}</span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                    {recentTraces.length > 0 && (
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, letterSpacing:".6px", textTransform:"uppercase", color:"var(--muted)", marginBottom:4 }}>
                          Tekniske spor (seneste {Math.min(traceLog.length, 50)} sendes)
                        </div>
                        <div style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--muted)", lineHeight:1.7, maxHeight:80, overflowY:"auto" }}>
                          {recentTraces.map((t, i) => (
                            <div key={i}>
                              <span style={{ color:"var(--green-text)" }}>[{t.id}]</span>{" "}
                              <span style={UI.ucink}>{t.step}</span>{" "}
                              <span style={{ color:"var(--muted2)" }}>{t.ts?.slice(11,19)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Send — fast i bunden, over hjemmeindikatoren */}
            <div style={{ flex:"none", padding:"12px 16px calc(12px + env(safe-area-inset-bottom))", borderTop:"1px solid var(--border)", background:"var(--sheet)" }}>
              <button type="button" onClick={submit} disabled={!canSend}
                style={{ width:"100%", minHeight:52, background: canSend ? "var(--green)" : "var(--surface2)",
                  border: canSend ? "none" : "1px solid var(--border)", borderRadius:12, padding:"14px", fontFamily:"var(--f)",
                  fontSize:15, fontWeight:700, color: canSend ? "var(--on-green)" : "var(--muted)",
                  cursor: canSend ? "pointer" : "not-allowed", boxShadow: canSend ? "var(--sh)" : "none" }}>
                {sending ? "Sender…" : "Send feedback →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
