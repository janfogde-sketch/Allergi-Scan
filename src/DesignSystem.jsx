// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// DesignSystem.jsx — EatSafes låste sæt af fælles UI-byggeklodser (25. sept.
// 2026, brugerens eksplicitte "vigtigste beslutning nu": "Byg resten af
// appen ud fra faste komponenter... Stop med at designe hver ny side
// individuelt"). De 12 navngivne komponenter herunder er tænkt som det
// eneste sted der definerer knap-/kort-/felt-udseende — nye skærme skal
// SAMMENSÆTTE disse i stedet for at style'e en ny knap/kort fra bunden.
//
// Bygget oven på de eksisterende, delte CSS-klasser i theme.jsx (.btn,
// .card, .chip, .field osv.) — ikke en ny, parallel styling-mekanisme.
// Farverne er EatSafe-designsystemets låste palet (--green:#0E8F5A,
// --green-dark:#08734A, --green-selected-bg:#EFF9F4, --green-halo:#DDF4E8,
// se .claude/rules/design-tokens.md).
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { Icon } from "./SharedComponents.jsx";

// ── PrimaryButton ── grøn, fuld-bredde CTA. `disabled` er "hårdt" (native
// disabled-attribut, ikke klikbar) — bruges når der findes en separat,
// eksplicit handling der skal til for at komme videre (fx en bekræftelses-
// knap). `softDisabled` dæmper visuelt PRÆCIS samme farver, men holder
// knappen klikbar — bruges når et første klik selv skal afsløre
// valideringsfejl (fx "Mangler: ..."-teksten på trin 1). Begge bruger den
// samme lys grøn baggrund + grøn tekst i stedet for CSS'ens generelle
// `.btn:disabled{opacity:.4}`, som gør hvid knap-tekst svær at læse.
export function PrimaryButton({
  children, onClick, disabled = false, softDisabled = false, loading = false,
  loadingText, type = "button", fullWidth = true, style, className = "",
}) {
  const dimmed = disabled || softDisabled;
  return (
    <button
      type={type}
      className={`btn btn-primary${fullWidth ? " btn-full" : ""}${className ? " " + className : ""}`}
      disabled={disabled}
      onClick={onClick}
      style={{
        background: dimmed ? "var(--green-mid)" : undefined,
        color: dimmed ? "var(--green)" : undefined,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: 1,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        ...style,
      }}>
      {loading ? (loadingText || "…") : children}
    </button>
  );
}

// ── SecondaryButton ── let, grøn-kantet alternativ til PrimaryButton —
// EatSafes låste sekundær-stil (solid hvid baggrund + grøn kant/tekst, IKKE
// den generiske grå `.btn-outline`). `active` viser en tydelig, men rolig
// "valgt/bekræftet"-tilstand (fx "Jeg har ingen allergier" efter tryk).
export function SecondaryButton({
  children, onClick, disabled = false, active = false, fullWidth = true, style, className = "",
}) {
  return (
    <button
      type="button"
      className={`btn${fullWidth ? " btn-full" : ""}${className ? " " + className : ""}`}
      disabled={disabled}
      onClick={onClick}
      style={{
        background: active ? "var(--green-selected-bg)" : "var(--surface)",
        color: "var(--green)",
        border: `1.5px solid ${active ? "var(--green)" : "var(--green-mid)"}`,
        fontWeight: active ? 700 : undefined,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        opacity: disabled ? .5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}>
      {active && <Icon name="check" size={13} color="var(--green)" />}
      {children}
    </button>
  );
}

// ── TextLink ── tertiær, tekst-kun handling — ingen knap-kant/baggrund.
// `variant="green"` (default) til reelle handlinger ("Glemt adgangskode?"),
// `variant="muted"` til bevidst nedtonede alternativer ("Ikke nu") der ikke
// må konkurrere visuelt med en PrimaryButton ovenover.
export function TextLink({ children, onClick, disabled = false, variant = "green", block = false, style, className = "" }) {
  const isMuted = variant === "muted";
  return (
    <button
      type="button"
      className={isMuted ? className : `link-green${className ? " " + className : ""}`}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...(isMuted ? {
          background: "none", border: "none", cursor: "pointer",
          fontFamily: "var(--f)", fontSize: 13, fontWeight: 600, color: "var(--muted2)",
          textDecoration: "underline", textUnderlineOffset: 2, padding: "6px",
        } : {}),
        ...(block ? { display: "block", width: "100%", textAlign: "center", marginTop: 12 } : {}),
        ...style,
      }}>
      {children}
    </button>
  );
}

// ── FormCard ── standardformular-kortet (`.card`). `glow` tilføjer den
// bløde, hvide glød lige bag kortet, brugt hvor kortet ligger direkte oven
// på appens baggrundsfoto (fx onboarding trin 1) — IKKE en ændring af selve
// `.card`-klassen, som bruges bredt andre steder uden dette behov.
export function FormCard({ children, glow = false, style, className = "" }) {
  return (
    <div className={`card${className ? " " + className : ""}`}
      style={{ ...(glow ? { boxShadow: "var(--sh), 0 0 46px 26px rgba(255,255,255,.55)" } : {}), ...style }}>
      {children}
    </div>
  );
}

// ── SectionHeading ── titel + valgfri undertekst + "N valgt"-tæller, det
// mønster trin 2/3 og MemberForm allerede deler ordret for konsistente
// valg-skærme.
export function SectionHeading({ title, sub, count, countLabel = "valgt" }) {
  return (
    <div>
      <div className="step-title">{title}</div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, lineHeight: 1.4 }}>{sub}</div>
      )}
      {count !== undefined && (
        <div style={{ fontSize: 12, fontWeight: 700, color: count > 0 ? "var(--green)" : "var(--muted)", marginBottom: 14 }}>
          {count} {countLabel}
        </div>
      )}
    </div>
  );
}

// ── ProgressIndicator ── onboardingens trin-bar (segmenter + "X/N"). Flyttet
// hertil fra App.jsx's lokale `StepBar`, så den er én delt, navngivet
// komponent i stedet for en closure defineret inde i App-komponenten.
export function ProgressIndicator({ total, current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 22, paddingRight: 3 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`step-seg${i <= current - 1 ? " done" : ""}`} />
      ))}
      <span className="step-num">{current}/{total}</span>
    </div>
  );
}

// ── Accordion ── kollapsibel valgfri-sektion-række ("Overvåg specifikke
// E-numre · N valgt / Valgfrit" + chevron) — udtrukket identisk fra
// OnboardingScreen.jsx trin 2 og MemberForm.jsx, som tidligere havde hver
// sin kopi af nøjagtig samme markup.
export function Accordion({ label, count, countLabel, open, onToggle, children, style }) {
  return (
    <div style={style}>
      <button
        type="button"
        onClick={onToggle}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: "12px 2px", fontFamily: "var(--f)" }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink2)" }}>
          {label}
          {count > 0
            ? <span style={{ color: "var(--green)", fontWeight: 700 }}> · {count} {countLabel || "valgt"}</span>
            : <span style={{ color: "var(--muted)", fontWeight: 500 }}> · Valgfrit</span>}
        </span>
        <span style={{ display: "flex", transform: open ? "rotate(90deg)" : "none", transition: ".2s" }}>
          <Icon name="chevronRight" size={16} color="var(--muted)" />
        </span>
      </button>
      {open && children}
    </div>
  );
}

// ── InfoRow ── ikon + tekst-række. To former: `children` alene giver en
// kort, neutral enkeltlinje-note (fx trin 3's diæt-disclaimer); `title`+`sub`
// giver en to-linjers række med bundkant (fx push-notifikations-listen).
export function InfoRow({ icon, color = "var(--ink)", children, title, sub, border = false, style }) {
  if (title !== undefined) {
    return (
      <div style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: border ? "1px solid var(--border)" : undefined, ...style }}>
        <div style={{ display: "flex", alignItems: "center" }}><Icon name={icon} size={19} color={color} /></div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{title}</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{sub}</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11, color, lineHeight: 1.5, ...style }}>
      <Icon name={icon} size={13} color={color} />
      <span>{children}</span>
    </div>
  );
}

// ── ErrorMessage ── delt fejl-boks (`.error-box`) — samme markup som blev
// brugt to steder (signup/login) i OnboardingScreen.jsx, nu ét sted.
export function ErrorMessage({ children, label = "Fejl" }) {
  if (!children) return null;
  return (
    <div className="error-box" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
      <span style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="warning" size={12} color="var(--red)" /> {label}
      </span>
      <span style={{ fontWeight: 500, fontSize: 12, lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

// ── ChoiceChip ── den delte "chip"-chrome (border/baggrund/✓-badge) bag
// AllergenChipPicker/DietChipPicker/ENumberPicker — selve chip-indholdet
// (label, evt. info-ikon/note) sendes som children, så domænespecifikke
// vælgere kan beholde deres eget indhold uden at duplikere kant/valgt-state.
export function ChoiceChip({ children, selected, onClick, showCheck = true, style, className = "", ariaLabel }) {
  return (
    <div
      className={`chip${selected ? " on" : ""}${className ? " " + className : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-pressed={onClick ? selected : undefined}
      aria-label={ariaLabel}
      onKeyDown={onClick ? (e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }) : undefined}
      style={style}>
      {children}
      {selected && showCheck && <div className="chip-check"><Icon name="check" size={9} color="var(--on-green)" /></div>}
    </div>
  );
}

// ── ChoiceCard ── større, midterjusteret valgmulighed (fx Køn-vælgeren) —
// samme grøn valgt-state som ChoiceChip, men til grid-baserede kort med kun
// ét label, ikke rækker af smalle chips. Min. 44px høj for et ordentligt
// tap-mål.
export function ChoiceCard({ label, selected, onClick, style }) {
  return (
    <div
      onClick={onClick}
      role="button" tabIndex={0}
      aria-pressed={selected}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      style={{
        padding: "12px 8px", minHeight: 44, borderRadius: 8, cursor: "pointer", textAlign: "center",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: `1px solid ${selected ? "var(--green)" : "var(--border)"}`,
        background: selected ? "var(--green-selected-bg)" : "var(--surface)",
        fontSize: 13, fontWeight: 700,
        color: selected ? "var(--green)" : "var(--muted)",
        transition: "all .15s",
        ...style,
      }}>
      {label}
    </div>
  );
}

// ── InputField ── label + `.field`-input, med valgfri obligatorisk-stjerne
// og fejl-kant. Forwarder alle øvrige input-attributter direkte (value,
// onChange, placeholder, type osv.) — dækker ikke de par felter der har
// ekstra chrome ud over selve inputtet (telefon-præfiks, adgangskode-
// vis/skjul-ikon), som forbliver deres egen bespoke markup.
export function InputField({ label, required = false, error = false, style, inputStyle, ...inputProps }) {
  return (
    <div style={style}>
      {label && (
        <label className="field-lbl">{label} {required && <span style={{ color: "var(--red)" }}>*</span>}</label>
      )}
      <input className="field" {...inputProps}
        style={{ borderColor: error ? "var(--red-md)" : undefined, ...inputStyle }} />
    </div>
  );
}
