// @ts-nocheck
import React from "react";
import { createPortal } from "react-dom";
import { isIosBrowserTab, pushUnavailableText } from "./usePwaInstall.js";
import { Icon } from "./Icons.jsx";

// ─── SCROLL TO TOP ────────────────────────────────────────────────────────────
// Flydende "til toppen"-knap til lange lister (Leksikon, Opskrifter). Appen
// scroller på window (ingen per-skærm scroll-container, se .app i theme.jsx),
// så en enkelt delt komponent kan lytte på window-scroll og bruges hvor som
// helst. Portal-baseret — samme CSS-fælde-grund som ListPickerSheet/ProfileMenu
// (position:fixed fanges af .screen.fade-in's transform ellers, se CLAUDE.md).
export function ScrollToTop({ threshold = 500 }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  if (!visible) return null;

  return createPortal(
    <button
      className="scroll-top-btn"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Til toppen"
    >
      <Icon name="chevronUp" size={20} color="var(--ink2)" />
    </button>,
    document.body
  );
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
// Delt, designkonsistent erstatning for native alert() til korte succes-/fejl-
// beskeder. showToast() kan kaldes fra hvor som helst i appen; <ToastHost/>
// monteres én gang (i App.jsx) og lytter efter kald.
let toastListeners = [];
let toastIdCounter = 0;

export function showToast(message, type = "success") {
  const toast = { id: ++toastIdCounter, message, type };
  toastListeners.forEach(fn => fn(toast));
}

// `top`: vis beskederne øverst i stedet for nederst (onboarding, hvor Fortsæt-knapperne ligger nederst og ikke må dækkes).
export function ToastHost({ top = false }) {
  const [toasts, setToasts] = React.useState([]);

  React.useEffect(() => {
    const handler = (toast) => {
      setToasts(t => [...t, toast]);
      // F4-8: bekræftelser står 3 sekunder; fejl og forklarende info (fx note under et allergen) 6, så de kan nå at blive læst.
      setTimeout(() => setToasts(t => t.filter(x => x.id !== toast.id)), toast.type === "success" ? 3000 : 6000);
    };
    toastListeners.push(handler);
    return () => { toastListeners = toastListeners.filter(l => l !== handler); };
  }, []);

  // F4-8: beholderen er altid monteret med role="status", så skærmlæseren opdager nye beskeder;
  // fejl får role="alert" og læses op med det samme.
  return createPortal(
    <div role="status" aria-live="polite" style={{ position:"fixed", left:0, right:0, ...(top ? { top:"calc(64px + env(safe-area-inset-top))" } : { bottom:"calc(84px + env(safe-area-inset-bottom))" }), zIndex:9998, display:"flex", flexDirection:"column", alignItems:"center", gap:8, pointerEvents:"none", padding:"0 16px" }}>
      {toasts.map(t => (
        <div key={t.id} role={t.type === "error" ? "alert" : undefined} style={{
          display:"flex", alignItems:"center", gap:8,
          background:"var(--surface)", border:`1px solid ${t.type === "error" ? "var(--red-md)" : t.type === "info" ? "var(--blue-md)" : "var(--border)"}`,
          borderRadius:12, padding:"12px 16px", boxShadow:"var(--sh2)",
          maxWidth:420, width:"100%", pointerEvents:"auto",
          animation:"toast-in .2s ease-out",
        }}>
          <Icon name={t.type === "error" ? "warning" : t.type === "info" ? "info" : "check"} size={16} color={t.type === "error" ? "var(--red)" : t.type === "info" ? "var(--blue)" : "var(--green)"} />
          <span style={{ fontSize:13, fontWeight:600, color:"var(--ink)", lineHeight:1.4 }}>{t.message}</span>
        </div>
      ))}
    </div>,
    document.body
  );
}

// ── Push ikke tilgængelig (F1-6, 8. okt. 2026) ─────────────────────────────
// Vises i Indstillinger og onboarding trin 5, når telefonen/browseren ikke kan få push.
// På iPhone i Safari linker den til installationsguiden (public/install.html).
export function PushUnavailableNote({ style }) {
  const iosTab = isIosBrowserTab();
  return (
    <div role="note" style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"10px 12px", borderRadius:12, background:"var(--surface2)", border:"1px solid var(--border)", ...style }}>
      <Icon name="bell" size={16} color="var(--ink2)" />
      <div style={{ fontSize:12.5, color:"var(--ink)", lineHeight:1.5 }}>
        {pushUnavailableText(iosTab)}
        {iosTab && (
          <> <a href="/install.html" style={{ color:"var(--green)", fontWeight:700, textDecoration:"none" }}>Sådan gør du</a></>
        )}
      </div>
    </div>
  );
}
