// @ts-nocheck
import React, { useState } from "react";
import { SCREENS, PAGE_IDS, SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { BUILD_TIME, COMMIT_SHA, formatBuildTime, buildScreenLabel } from "./utils.jsx";

// ─────────────────────────────────────────────────────────────────────────────
// FeedbackModal.jsx
//
// Selvstændig feedback-modal. Al state og submitFeedback-logik bor her.
// App.jsx sender kun kontekst-props ind og styrer open/close.
// ─────────────────────────────────────────────────────────────────────────────

export default function FeedbackModal({
  // Open/close
  open, onClose,

  // Skærmkontekst — bruges til diagnostik
  screen,
  authTab,
  onboardStep,
  scanResult,
  madpasWaiterView,
  madpasLang,
  selectedRecipe,
  editMode,
  showManualEan,
  profilePopup,

  // Brugerkontekst
  user,
  userId,
  accessToken,
  loginEmail,
  allergens,
  family,
  history,
  activeProfiles,
}) {
  const [type, setType]         = useState("bug");
  const [text, setText]         = useState("");
  const [image, setImage]       = useState(null);
  const [imageB64, setImageB64] = useState(null);
  const [sending, setSending]   = useState(false);
  const [done, setDone]         = useState(false);

  if (!open) return null;

  const reset = () => {
    setType("bug"); setText(""); setImage(null);
    setImageB64(null); setSending(false); setDone(false);
  };

  const close = () => { reset(); onClose(); };

  const submit = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const screenDescription = buildScreenLabel({
        screen, authTab, onboardStep, scanResult,
        madpasWaiterView, madpasLang, selectedRecipe,
        editMode, showManualEan, profilePopup,
      });

      const ctx = {
        screen_id:        screen,
        screen_label:     screenDescription,
        page_id:          PAGE_IDS[screen] || "–",
        url:              window.location.href,
        user_agent:       navigator.userAgent,
        platform:         navigator.platform,
        language:         navigator.language,
        screen_size:      `${window.screen.width}x${window.screen.height}`,
        viewport:         `${window.innerWidth}x${window.innerHeight}`,
        online:           navigator.onLine,
        timestamp:        new Date().toISOString(),
        build_time:       BUILD_TIME,
        commit_sha:       COMMIT_SHA,
        user_id:          userId || null,
        user_name:        user?.name || null,
        user_email:       user?.email || loginEmail || null,
        user_role:        user?.role || null,
        allergens:        allergens,
        allergens_count:  allergens?.length || 0,
        family_count:     family?.length || 0,
        history_count:    history?.length || 0,
        active_profiles:  activeProfiles,
        scan_result_ean:  scanResult?.ean || scanResult?.code || null,
        scan_result_name: scanResult?.name || null,
        madpas_lang:      madpasLang || null,
        selected_recipe:  selectedRecipe?.name || null,
        onboard_step:     screen === SCREENS.ONBOARD ? onboardStep : null,
        app_version:      "beta-1.0",
      };

      const headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
      };

      await fetch(`${SUPABASE_URL}/rest/v1/feedback_tickets`, {
        method: "POST",
        headers: { ...headers, "Prefer": "return=minimal" },
        body: JSON.stringify({
          type,
          description: text,
          context: ctx,
          image_base64: imageB64 || null,
          status: "open",
          submitted_by: userId || null,
        }),
      });

      setDone(true);
      setTimeout(() => { close(); }, 2200);
    } catch(e) { alert("Fejl: " + e.message); }
    setSending(false);
  };

  const TYPES = [
    { id:"bug",        emoji:"🐛", label:"Fejl / bug" },
    { id:"ui",         emoji:"🎨", label:"Design / UI" },
    { id:"missing",    emoji:"💡", label:"Mangler noget" },
    { id:"content",    emoji:"📦", label:"Forkert indhold" },
    { id:"crash",      emoji:"💥", label:"App crasher" },
    { id:"suggestion", emoji:"✨", label:"Forslag" },
  ];

  const device = /iPhone|iPad/.test(navigator.userAgent) ? "iOS"
    : /Android/.test(navigator.userAgent) ? "Android" : "Desktop";

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,.5)",
      display:"flex", alignItems:"flex-end" }}
      onClick={e => e.target === e.currentTarget && close()}>
      <div style={{ background:"var(--paper)", borderRadius:"20px 20px 0 0",
        padding:"20px 16px 32px", width:"100%", maxHeight:"85vh", overflowY:"auto" }}
        onClick={e => e.stopPropagation()}>

        {done ? (
          <div style={{ textAlign:"center", padding:"32px 0" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🙏</div>
            <div style={{ fontSize:18, fontWeight:900, color:"var(--ink)" }}>Tak for din feedback!</div>
            <div style={{ fontSize:13, color:"var(--muted)", marginTop:6 }}>Vi kigger på det hurtigst muligt.</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <div>
                <div style={{ fontSize:17, fontWeight:900, color:"var(--ink)" }}>Send feedback</div>
                <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>
                  {PAGE_IDS[screen] || "—"} · Beta v1.0
                </div>
              </div>
              <button onClick={close}
                style={{ background:"var(--paper2)", border:"none", borderRadius:"50%",
                  width:32, height:32, cursor:"pointer", fontSize:18, color:"var(--muted)" }}>×</button>
            </div>

            {/* Type */}
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, fontWeight:700, color:"var(--ink)", display:"block", marginBottom:6 }}>Type</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {TYPES.map(t => (
                  <div key={t.id} onClick={() => setType(t.id)}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px",
                      borderRadius:10, cursor:"pointer",
                      border:`1.5px solid ${type===t.id?"var(--ink)":"var(--border)"}`,
                      background: type===t.id ? "var(--ink)" : "#fff" }}>
                    <span style={{ fontSize:16 }}>{t.emoji}</span>
                    <span style={{ fontSize:12, fontWeight:700,
                      color: type===t.id ? "#fff" : "var(--ink2)" }}>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Beskrivelse */}
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, fontWeight:700, color:"var(--ink)", display:"block", marginBottom:6 }}>Beskriv problemet</label>
              <textarea value={text} onChange={e => setText(e.target.value)} rows={4}
                placeholder="Fx. 'Når jeg trykker på X sker der Y…' — jo mere detail, jo bedre"
                style={{ width:"100%", padding:"12px 14px", border:"1.5px solid var(--border2)",
                  borderRadius:12, background:"var(--paper2)", fontFamily:"var(--f)",
                  fontSize:14, color:"var(--ink)", resize:"none", outline:"none",
                  lineHeight:1.6, boxSizing:"border-box" }} />
            </div>

            {/* Billede */}
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:700, color:"var(--ink)", display:"block", marginBottom:6 }}>Skærmbillede (valgfrit)</label>
              {image ? (
                <div style={{ position:"relative", display:"inline-block" }}>
                  <img src={image} alt="Screenshot"
                    style={{ maxWidth:"100%", maxHeight:160, borderRadius:10,
                      objectFit:"contain", border:"1px solid var(--border)" }} />
                  <button onClick={() => { setImage(null); setImageB64(null); }}
                    style={{ position:"absolute", top:4, right:4, background:"rgba(0,0,0,.6)",
                      border:"none", borderRadius:"50%", width:24, height:24,
                      color:"#fff", cursor:"pointer", fontSize:14 }}>×</button>
                </div>
              ) : (
                <label style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 14px",
                  border:"1.5px dashed var(--border2)", borderRadius:12,
                  cursor:"pointer", background:"var(--paper2)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
                    <path strokeLinecap="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <span style={{ fontSize:13, color:"var(--muted)" }}>Tag skærmbillede eller vælg fra galleri</span>
                  <input type="file" accept="image/*" style={{ display:"none" }}
                    onChange={async e => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setImage(URL.createObjectURL(f));
                      const b64 = await new Promise((res,rej) => {
                        const r = new FileReader();
                        r.onload = () => res(r.result.split(",")[1]);
                        r.onerror = rej;
                        r.readAsDataURL(f);
                      });
                      setImageB64(b64);
                    }} />
                </label>
              )}
            </div>

            {/* Diagnostik */}
            <div style={{ background:"var(--paper2)", borderRadius:10,
              padding:"10px 12px", marginBottom:14 }}>
              <div style={{ fontSize:10, color:"var(--muted)", fontWeight:700, marginBottom:6 }}>📊 Automatisk inkluderet diagnostik</div>
              <div style={{ fontSize:10, color:"var(--muted2)", lineHeight:1.85 }}>
                <b style={{ color:"var(--ink)" }}>Skærm:</b> {buildScreenLabel({ screen, authTab, onboardStep, scanResult, madpasWaiterView, madpasLang, selectedRecipe, editMode, showManualEan, profilePopup })} ({PAGE_IDS[screen] || "—"})
                <br/><b style={{ color:"var(--ink)" }}>Bruger:</b> {user?.name || "anonym"} · <b style={{ color:"var(--ink)" }}>Rolle:</b> {user?.role || "—"}
                <br/><b style={{ color:"var(--ink)" }}>Enhed:</b> {device} · <b style={{ color:"var(--ink)" }}>Viewport:</b> {window.innerWidth}×{window.innerHeight}
                <br/><b style={{ color:"var(--ink)" }}>Build:</b> {formatBuildTime()} ({COMMIT_SHA})
                {scanResult && <><br/><b style={{ color:"var(--ink)" }}>Produkt:</b> {scanResult.name} [EAN: {scanResult.ean || scanResult.code || "—"}]</>}
              </div>
            </div>

            {/* Send */}
            <button onClick={submit} disabled={sending || !text.trim()}
              style={{ width:"100%", background: text.trim() ? "var(--ink)" : "var(--border2)",
                border:"none", borderRadius:12, padding:"15px", fontFamily:"var(--f)",
                fontSize:15, fontWeight:800, color:"#fff",
                cursor: text.trim() ? "pointer" : "not-allowed" }}>
              {sending ? "Sender…" : "Send feedback →"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
