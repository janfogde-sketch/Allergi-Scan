// @ts-nocheck
import React from "react";
import { createPortal } from "react-dom";
import { UI } from "./styleUtils.js";
import { useDialogA11y } from "./useDialogA11y.js";
import { Icon } from "./Icons.jsx";

// ─── SCAN-LOADING OVERLAY ─────────────────────────────────────────────────────
// Logo-baseret loading-animation, vist mens et scannet/søgt produkt slås op
// (fra scan:start til resultatet er klart, se runLookupProduct i useProduct.js).
// Genbruger EatSafeLogo's præcise stregkode-bar-koordinater for brand-troskab —
// kun forskellen er en "scan-laser" der sveje op/ned over barsne i stedet for
// den statiske grønne tjek-streg (som ville signalere "godkendt" for tidligt).
// Portal-baseret (samme mønster som ToastHost/ListPickerSheet), monteret i
// App.jsx, styret af et rent boolean show-flag.
export function ScanLoadingOverlay({ show, label = "Scanner produkt og tjekker dine allergener" }) {
  if (!show) return null;
  return createPortal(
    <div className="scan-loading-overlay" role="status" aria-live="polite" aria-label={label}>
      <svg className="scan-loading-mark" width="92" height="92" viewBox="0 0 1000 1000" aria-hidden="true">
        {/* Logoet (7 streger) med fluebenet, der tegnes ind og glider ud igen og igen (forslag D); stregen har runde ender og ingen cirkel. Ingen synlig tekst, kun animationen; skærmlæsere får label (Bjørn, 7. okt. 2026). */}
        <g transform="translate(16.8,0)">
          <g fill="var(--ink)">
            <rect x="104.8" y="158" width="102.396" height="684.495" rx="15.582" />
            <rect x="247.264" y="221.441" width="53.424" height="557.613" rx="15.582" />
            <rect x="340.756" y="158" width="80.136" height="684.495" rx="15.582" />
            <rect x="460.96" y="221.441" width="66.78" height="557.613" rx="15.582" />
            <rect x="567.808" y="158" width="62.328" height="684.495" rx="15.582" />
            <rect x="670.204" y="221.441" width="80.136" height="557.613" rx="15.582" />
            <rect x="790.408" y="158" width="71.232" height="684.495" rx="15.582" />
          </g>
          <polyline className="scan-loading-check" points="176.03,539.759 543.322,539.759 639.04,635.477 790.408,466.301" fill="none" stroke="var(--paper)" strokeWidth="146.916" strokeLinejoin="round" strokeLinecap="round" />
          <polyline className="scan-loading-check" points="176.03,539.759 543.322,539.759 639.04,635.477 790.408,466.301" fill="none" stroke="var(--green)" strokeWidth="89.04" strokeLinejoin="round" strokeLinecap="round" />
        </g>
      </svg>
    </div>,
    document.body
  );
}




export function CloseButton({ onClick, label = "Luk", plain = false }) {
  return (
    <button type="button" className={`icon-btn${plain ? " is-plain" : ""}`} aria-label={label} onClick={onClick}>
      <Icon name="x" size={18} color={plain ? "var(--muted)" : "var(--ink)"} />
    </button>
  );
}

// ── Fælles "vælg liste"-ark ──────────────────────────────────────────────────
// Vises når en bruger med mere end én indkøbsliste tilføjer et produkt, så de
// kan vælge hvilken liste det skal på. Portalet direkte til <body>: skærmen
// bag har en fade-in-animation på transform, som (selv efter animationen er
// slut, pga. fill-mode "both") gør den til et "containing block" for
// position:fixed-børn — et almindeligt fixed-ark ville ellers rulle med
// resten af siden i stedet for at blive stående over bundmenuen.
export function ListPickerSheet({ lists, onChoose, onCancel }) {
  const sheetRef = React.useRef(null);
  const titleId = React.useId();
  useDialogA11y(sheetRef, onCancel);
  return createPortal(
    <div style={{ position:"fixed", inset:0, zIndex:9995, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"flex-end" }}
      onClick={onCancel}>
      <div ref={sheetRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        style={{ background:"var(--sheet)", borderRadius:"20px 20px 0 0", padding:"20px 16px 32px", width:"100%", maxHeight:"70vh", overflowY:"auto", outline:"none" }}
        onClick={e => e.stopPropagation()}>
        <div style={UI.rowBetweenMb16}>
          <div id={titleId} style={UI.ufs18_fw900_cink}>Tilføj til hvilken liste?</div>
          <CloseButton onClick={onCancel} />
        </div>
        {lists.map(l => (
          <button type="button" key={l.id} onClick={() => onChoose(l.id)}
            style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", minHeight:44, padding:"12px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, marginBottom:8, cursor:"pointer", fontFamily:"var(--f)", textAlign:"left" }}>
            <span style={{ fontSize:14, fontWeight:700, color:"var(--ink)" }}>{l.name}</span>
            {l.type === "family" && <Icon name="family" size={13} color="var(--muted)" />}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}

// ─── BEKRÆFT-DIALOG (destruktive handlinger) ─────────────────────────────────
// Erstatter native window.confirm() for destruktive handlinger (25. sept.
// 2026, brugerfeedback) — confirm()'s knapper er styret af browseren og kan
// IKKE få handlingsspecifik tekst ("Ryd købte"/"Slet liste" i stedet for et
// generisk "OK"), kun det browseren selv viser. Samme bund-ark-mønster som
// ShareSheet/ListPickerSheet/DeleteAccountModal (portal-baseret — se
// CLAUDE.md afsnit 3 for hvorfor), men lettere: ingen tekst-bekræftelse
// krævet, kun to tydelige knapper. `danger` (default true) styrer om
// bekræft-knappen er rød med et skraldespand-ikon (sletning/rydning) eller
// grøn uden ikon (for evt. fremtidig ikke-destruktiv brug af samme
// komponent). Begge knapper er mindst 44px høje (tap-area-krav).
export function ConfirmDialog({ title, message, confirmLabel, cancelLabel = "Annuller", onConfirm, onCancel, danger = true }) {
  const sheetRef = React.useRef(null);
  const titleId = React.useId();
  const msgId = React.useId();
  useDialogA11y(sheetRef, onCancel);
  return createPortal(
    <div style={{ position:"fixed", inset:0, zIndex:9998, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"flex-end" }}
      onClick={onCancel}>
      <div ref={sheetRef} role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={message ? msgId : undefined} tabIndex={-1}
        style={{ background:"var(--sheet)", borderRadius:"20px 20px 0 0", padding:"22px 16px 28px", width:"100%", outline:"none" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:18 }}>
          {danger && <Icon name="warning" size={20} color="var(--red)" />}
          <div>
            <div id={titleId} style={{ fontSize:15.5, fontWeight:800, color:"var(--ink)", marginBottom: message ? 4 : 0 }}>{title}</div>
            {message && <div id={msgId} style={{ fontSize:12.5, color:"var(--muted)", lineHeight:1.5 }}>{message}</div>}
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button type="button" onClick={onCancel}
            style={{ flex:1, minHeight:44, padding:"12px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:12, fontFamily:"var(--f)", fontSize:14, fontWeight:700, color:"var(--ink2)", cursor:"pointer" }}>
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm}
            style={{ flex:1, minHeight:44, padding:"12px", background: danger ? "var(--red)" : "var(--green)", border:"none", borderRadius:12, fontFamily:"var(--f)", fontSize:14, fontWeight:800, color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            {danger && <Icon name="trash" size={14} color="#fff" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Fejl- og informationstilstande (F2-4, finpudset af Bjørn 6. okt. 2026) ────
// StateBox er den fælles inline-boks: tone "error" (rød, egentlig fejl) eller "info"
// (neutral, fx offline med gemt resultat). Genopretning er en grøn, sekundær knap.
export function StateBox({ tone = "info", icon, title, text, actionLabel, onAction }) {
  const isError = tone === "error";
  return (
    <div className={`state-box${isError ? " is-error" : ""}`} role={isError ? "alert" : "status"}>
      <span className="state-icon"><Icon name={icon || (isError ? "warning" : "info")} size={20} color={isError ? "var(--red)" : "var(--ink2)"} /></span>
      <div className="state-body">
        <div className="state-title">{title}</div>
        {text && <div className="state-text">{text}</div>}
        {onAction && <div className="state-action"><button className="btn btn-recover" onClick={onAction}>{actionLabel || "Prøv igen"}</button></div>}
      </div>
    </div>
  );
}

// Vises, når en liste ikke kunne hentes, så en fejl ikke ligner en tom side.
export function LoadErrorBox({ what, onRetry }) {
  return <StateBox tone="error" title={`${what} kunne ikke hentes.`} text="Tjek din forbindelse, og prøv igen." onAction={onRetry} />;
}

// ─── INFO SHEET ───────────────────────────────────────────────────────────────
// Lille bottom-sheet med en forklaring bag et info-ikon (1. okt. 2026, første
// brug: "Hvad er krydskontaminering?" i Madpas). Samme portal-mønster som
// ConfirmDialog (position:fixed fanges ellers af .screen.fade-in's transform).
// Én "Forstået"-knap (44px) og tryk udenfor lukker.
export function InfoSheet({ title, children, onClose, closeLabel = "Forstået" }) {
  const sheetRef = React.useRef(null);
  useDialogA11y(sheetRef, onClose);
  return createPortal(
    <div style={{ position:"fixed", inset:0, zIndex:9998, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"flex-end" }}
      onClick={onClose}>
      <div ref={sheetRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
        style={{ background:"var(--sheet)", borderRadius:"20px 20px 0 0", padding:"22px 16px 28px", width:"100%", outline:"none" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:18 }}>
          <span style={{ flexShrink:0, marginTop:1, display:"flex" }}><Icon name="info" size={20} color="var(--blue)" /></span>
          <div>
            <div style={{ fontSize:15.5, fontWeight:800, color:"var(--ink)", marginBottom:6 }}>{title}</div>
            <div style={{ fontSize:13, color:"var(--ink2)", lineHeight:1.5 }}>{children}</div>
          </div>
        </div>
        <button type="button" onClick={onClose}
          style={{ width:"100%", minHeight:44, padding:12, background:"var(--green)", border:"none", borderRadius:12, fontFamily:"var(--f)", fontSize:14, fontWeight:800, color:"#fff", cursor:"pointer" }}>
          {closeLabel}
        </button>
      </div>
    </div>,
    document.body
  );
}
