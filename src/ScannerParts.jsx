// @ts-nocheck
import React, { useRef } from "react";
import { createPortal } from "react-dom";

import { initials, scanTargetCopy } from "./helpers.js";
import { Icon, CloseButton } from "./SharedComponents.jsx";


import { DEMO_SLIDES } from "./demoSlides.jsx";








import { UI } from "./styleUtils.js";
import { useDialogA11y } from "./useDialogA11y.js";

// ── Performance: Styles som konstanter (undgår nye objekter per render) ──────
export const S = {
  none: { display:"none" },
  flex1: { flex:1 },
  flexMin: { flex:1, minWidth:0 },
  rel: { position:"relative" },
  mb8: { marginBottom:8 },
  mb10: { marginBottom:10 },
  mb12: { marginBottom:12 },
  mb16: { marginBottom:16 },
  center60: { textAlign:"center", padding:"60px 20px" },
  row: { display:"flex", alignItems:"center" },
  rowBetween: { display:"flex", alignItems:"center", justifyContent:"space-between" },
  rowBetweenMb10: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 },
  rowGap8: { display:"flex", gap:8 },
  rowGap6: { display:"flex", gap:6 },
  colCenter: { display:"flex", flexDirection:"column", alignItems:"center" },
  card: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", marginBottom:12 },
  cardMb10: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", marginBottom:10 },
  h17: { fontSize:17, fontWeight:800, color:"var(--ink)" },
  h17mb: { fontSize:17, fontWeight:800, color:"var(--ink)", marginBottom:8 },
  h13: { fontSize:13, fontWeight:800, color:"var(--ink)" },
  h13b: { fontSize:13, fontWeight:700, color:"var(--ink)" },
  h13bMb: { fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:8 },
  sub11: { fontSize:11, color:"var(--muted)" },
  sub11mt: { fontSize:11, color:"var(--muted)", marginTop:1 },
  sub11lh: { fontSize:11, color:"var(--muted)", lineHeight:1.5 },
  body12: { fontSize:12, color:"var(--muted)", lineHeight:1.5 },
  body13: { fontSize:13, color:"var(--muted)", lineHeight:1.5 },
  label: { fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 },
  dot: { width:28, height:28, borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  opacity6: { opacity:.6 },
  linkBtn: { width:"100%", background:"none", border:"none", cursor:"pointer", fontSize:12, fontWeight:700, color:"var(--muted)", fontFamily:"var(--f)" },
};


// ── App-guide: samme feature-demo som velkomstskærmen, men i en luk-bar modal ──
// Bruges kun her via mode="modal" (se knappen "App-guide" på hjemskærmen) —
// velkomstskærmens egen udgave af sliideren bor i OnboardingScreen.jsx.
export function DemoSlider({ onClose }) {
  const [idx, setIdx] = React.useState(0);
  const slide = DEMO_SLIDES[idx];

  return (
    <div style={{ borderRadius:0, overflow:"hidden", border:"none" }}>

      {/* Modal-header med overskrift + luk */}
      <div style={{ background:"var(--surface2)", borderBottom:"1px solid var(--border)", padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:13, fontWeight:800, color:"var(--green)", textTransform:"uppercase", letterSpacing:"1.5px" }}>Det kan EatSafe</div>
        <button onClick={onClose} aria-label="Luk"
          style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"50%",
            width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", fontSize:15, color:"var(--ink)", lineHeight:1 }}>
          ×
        </button>
      </div>

      <div style={{ background:slide.bg, padding:"20px 20px 18px", minHeight:260, transition:"background .4s", position:"relative" }}>

        {/* Dots */}
        <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:16 }}>
          {DEMO_SLIDES.map((_,i) => (
            <div key={i} onClick={() => setIdx(i)}
              style={{ width: i===idx ? 22 : 7, height:7, borderRadius:4, background: i===idx ? slide.accent : "var(--border2)", cursor:"pointer", transition:"all .25s" }} />
          ))}
        </div>

        {/* Indhold */}
        <div style={{ fontSize:19, fontWeight:900, color:"var(--ink)", marginBottom:6, letterSpacing:"-.3px" }}>{slide.title}</div>
        <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6 }}>{slide.sub}</div>
        {slide.mockup}

        {/* Sidste slide: luk guiden */}
        {slide.cta && (
          <div style={{ marginTop:20, display:"flex", flexDirection:"column", gap:10 }}>
            <button className="btn btn-primary btn-full" onClick={onClose}
              style={{ fontSize:14, fontWeight:800 }}>
              Luk guide ✓
            </button>
          </div>
        )}
      </div>

      {/* Frem/tilbage */}
      <div style={{ display:"flex", gap:8, padding:"12px 14px", background:"var(--surface2)", borderTop:"1px solid var(--border)" }}>
        <button disabled={idx===0} onClick={() => setIdx(i => i-1)}
          style={{ flex:1, padding:"10px", background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:10,
            fontFamily:"var(--f)", fontSize:13, fontWeight:700, color: idx===0 ? "var(--muted)" : "var(--ink2)",
            cursor: idx===0 ? "default" : "pointer", opacity: idx===0 ? 0.4 : 1 }}>
          ← Forrige
        </button>
        {idx < DEMO_SLIDES.length - 1 ? (
          <button onClick={() => setIdx(i => i+1)}
            style={UI.uflex1_p10px_bggreen_bdnone_br10_fff_fs13_fw800_congreen_cur}>
            Næste →
          </button>
        ) : (
          <button onClick={onClose}
            style={UI.uflex1_p10px_bggreen_bdnone_br10_fff_fs13_fw800_congreen_cur}>
            Luk guide ✓
          </button>
        )}
      </div>
    </div>
  );
}

// ── Scanner-profilvælger ("Scanner for: ...") ──────────────────────────────
// Bund-ark (samme mønster som ListScreens ShareSheet/ListPickerSheet) der lader
// brugeren vælge hvilke(n) profil(er) fremtidige scanninger vurderes imod —
// Alle, kun brugeren selv, eller en vilkårlig delmængde af familien (25. sept.
// 2026, brugerfeedback). Genbruger PRÆCIS samme toggle-semantik som den
// eksisterende (men skjulte, kun brugt i ProfileScreens "Aktive profiler ved
// scanning"-chip-række) FamilyChips-logik: klik på "Alle" vælger alle, klik på
// én specifik person mens "Alle" er aktivt indsnævrer til kun den ene, og
// almindelige klik derefter til-/fravælger enkeltvis. Portal-baseret — se
// CLAUDE.md afsnit 3 for hvorfor (samme fade-in-containing-block-fælde).
export function ScanProfilePickerSheet({ activeProfiles, setActiveProfiles, family, user, onClose }) {
  const sheetRef = useRef(null);
  useDialogA11y(sheetRef, onClose);
  const allIds = ["me", ...family.map(m => m.id)];
  const isAll = allIds.every(id => activeProfiles.includes(id));
  const toggleAll = () => setActiveProfiles(isAll ? ["me"] : allIds);
  const toggleOne = (id) => {
    if (isAll) { setActiveProfiles([id]); return; }
    const next = activeProfiles.includes(id) ? activeProfiles.filter(x => x !== id) : [...activeProfiles, id];
    setActiveProfiles(next.length === 0 ? [id] : next);
  };

  const Row = ({ id, label, avatarColor, avatarInitials, checked, onClick }) => (
    <div onClick={onClick} role="checkbox" aria-checked={checked} tabIndex={0}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      style={{
        display:"flex", alignItems:"center", gap:10, padding:"12px 10px", borderRadius:10, cursor:"pointer",
        background: checked ? "var(--green-selected-bg)" : "transparent",
      }}>
      {avatarColor !== undefined ? (
        <div style={{ width:28, height:28, borderRadius:"50%", background:avatarColor, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"var(--ink)", flexShrink:0 }}>
          {avatarInitials}
        </div>
      ) : (
        <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--green-selected-bg)", border:"1.5px solid var(--green)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Icon name="family" size={13} color="var(--green)" />
        </div>
      )}
      <div style={{ flex:1, fontSize:13.5, fontWeight:700, color: checked ? "var(--green)" : "var(--ink)" }}>{label}</div>
      <div style={{ width:20, height:20, borderRadius:6, border:`1.5px solid ${checked ? "var(--green)" : "var(--border2)"}`, background: checked ? "var(--green-selected-bg)" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        {checked && <Icon name="check" size={12} color="var(--green)" />}
      </div>
    </div>
  );

  return createPortal(
    <div style={{ position:"fixed", inset:0, zIndex:9996, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"flex-end" }}
      onClick={onClose}>
      <div ref={sheetRef} role="dialog" aria-modal="true" aria-labelledby="scan-profile-title" tabIndex={-1}
        style={{ background:"var(--sheet)", borderRadius:"20px 20px 0 0", padding:"20px 16px 32px", width:"100%", maxHeight:"80vh", overflowY:"auto", outline:"none" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div id="scan-profile-title" style={{ fontSize:16, fontWeight:900, color:"var(--ink)" }}>Tjekker for</div>
          <CloseButton onClick={onClose} />
        </div>
        <div style={{ fontSize:12, color:"var(--muted)", marginBottom:12, lineHeight:1.4 }}>
          Vælg, hvem dine scanninger skal tjekkes for. Du kan vælge én eller flere.
        </div>
        {/* Aktuelt valg, opdateres med det samme ved hvert tryk (4. okt. 2026). */}
        <div aria-live="polite" style={{ fontSize:12.5, fontWeight:600, color:"var(--ink)", marginBottom:8 }}>
          Valgt nu: <span style={{ color:"var(--green)", fontWeight:800 }}>{isAll ? `Alle (${allIds.length} personer)` : scanTargetCopy(activeProfiles, family).chip}</span>
        </div>
        <Row id="all" label="Alle" checked={isAll} onClick={toggleAll} />
        <Row id="me" label={user.name ? `Dig (${user.name.trim().split(/\s+/)[0]})` : "Dig"} avatarColor="var(--green)" avatarInitials={initials(user.name || "Mig")}
          checked={!isAll && activeProfiles.includes("me")} onClick={() => toggleOne("me")} />
        {family.map(m => (
          <Row key={m.id} id={m.id} label={m.name} avatarColor={m.color} avatarInitials={initials(m.name)}
            checked={!isAll && activeProfiles.includes(m.id)} onClick={() => toggleOne(m.id)} />
        ))}
        <button type="button" className="btn btn-primary btn-full" onClick={onClose} style={{ marginTop:16 }}>Færdig</button>
      </div>
    </div>,
    document.body
  );
}

// ── Kamera-kontrolknap med label (28. sept. 2026, FINAL POLISH – SCANNER,
// krav 1) ─────────────────────────────────────────────────────────────────
// De tre handlinger (Billede/Indtast/Lygte) var tidligere rene ikon-cirkler
// uden tekst — "for kryptiske alene" ifølge brugerens egen formulering.
// Ikon + kort label stablet lodret, samme diskrete mørke/blurrede pille-
// baggrund som før, men nu med en tekst under. `minWidth`/`minHeight:44`
// sikrer et reelt touch-target på mindst ca. 44×44pt (krav 14), selvom den
// synlige cirkel stadig er 34px — touch-fladen er større end det viste ikon.
// F3-8/F4-7 (6. okt. 2026): app-guiden og kamera-primeren som portal (position:fixed fanges ellers af
// .screen.fade-in's transform, CLAUDE.md §3 regel 4) med dialog-rolle, Esc og fokus.
export function GuideSheet({ onClose }) {
  const sheetRef = useRef(null);
  useDialogA11y(sheetRef, onClose);
  return createPortal(
    <div style={{ position:"fixed", inset:0, zIndex:9995, background:"rgba(0,0,0,.7)", display:"flex", flexDirection:"column", justifyContent:"flex-end" }}
      onClick={onClose}>
      <div ref={sheetRef} role="dialog" aria-modal="true" aria-label="App-guide" tabIndex={-1}
        style={{ background:"var(--paper)", borderRadius:"20px 20px 0 0", overflow:"hidden", maxHeight:"90vh", overflowY:"auto", outline:"none" }}
        onClick={e => e.stopPropagation()}>
        <DemoSlider onClose={onClose} />
      </div>
    </div>,
    document.body
  );
}

export function CameraPrimer({ onDismiss }) {
  const boxRef = useRef(null);
  useDialogA11y(boxRef, onDismiss);
  return createPortal(
    <div style={{ position:"fixed", inset:0, zIndex:9995, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={onDismiss}>
      <div ref={boxRef} role="dialog" aria-modal="true" aria-labelledby="camera-primer-title" tabIndex={-1}
        style={{ background:"var(--paper)", borderRadius:20, padding:"24px 22px", maxWidth:320, textAlign:"center", boxShadow:"var(--sh2)", outline:"none" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
          <div style={{ width:48, height:48, borderRadius:"50%", background:"var(--green-selected-bg)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Icon name="camera" size={22} color="var(--green)" />
          </div>
        </div>
        <div id="camera-primer-title" style={{ fontSize:15, fontWeight:800, color:"var(--ink)", marginBottom:8 }}>
          EatSafe bruger kameraet til at læse produktets stregkode.
        </div>
        <button className="btn btn-primary btn-full" onClick={onDismiss} style={{ marginTop:6 }}>
          Fortsæt
        </button>
      </div>
    </div>,
    document.body
  );
}

export function CamCtrlBtn({ icon, label, onClick, active, ariaLabel, ariaPressed }) {
  return (
    <button onClick={onClick} aria-label={ariaLabel || label} aria-pressed={ariaPressed}
      style={{
        display:"flex", flexDirection:"column", alignItems:"center", gap:3,
        background:"none", border:"none", cursor:"pointer", padding:"4px 6px",
        minWidth:44, minHeight:44, justifyContent:"center", fontFamily:"var(--f)",
      }}>
      <div style={{
        width:38, height:38, borderRadius:"50%",
        background: active ? "#fff" : "rgba(0,0,0,.45)",
        backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)",
        border:"1px solid rgba(255,255,255,.2)",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <Icon name={icon} size={17} color={active ? "var(--ink)" : "#fff"} />
      </div>
      <span style={{ fontSize:10.5, fontWeight:600, color:"#fff", textShadow:"0 1px 2px rgba(0,0,0,.7)", whiteSpace:"nowrap" }}>{label}</span>
    </button>
  );
}

