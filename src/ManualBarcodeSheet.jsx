// @ts-nocheck
// Manuel stregkodeindtastning som bottom sheet (Bjørn, 8. okt. 2026). Åbnes fra "Indtast kode" i kameraet, fra kortet ved afvist
// kameraadgang og fra kamerafejlen. Tastaturet åbnes i selve trykket med primeBarcodeKeyboard() (barcodeKeyboard.js). Portal til body (CLAUDE.md §3 regel 4); rammen følger visualViewport, så tastaturet aldrig dækker
// felt eller knap, og arket dækker bundnavigationen, mens det er åbent. Arket ligger lige under appens scan-loadingskærm (z-index
// 9994), så en søgning ser ud som en scanning; fejler den, står arket der igen med koden og fejlen. Kameraet pauses af ScannerScreen, mens arket er åbent.
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./SharedComponents.jsx";
import { useDialogA11y } from "./useDialogA11y.js";
import { normalizeScannedBarcode } from "./helpers.js";

const VALID_LENGTHS = [8, 12, 13, 14];
const LENGTH_ERROR = "Stregkoden skal have 8, 12, 13 eller 14 cifre.";
const CHECK_ERROR = "Koden er ikke gyldig. Tjek, at alle tal er tastet rigtigt.";

export default function ManualBarcodeSheet({ onClose, onSubmit, submitting, submitError }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  useDialogA11y(panelRef, () => { if (!submitting) onClose(); });

  const [vv, setVv] = useState(() => (typeof window !== "undefined" && window.visualViewport ? { top: window.visualViewport.offsetTop, h: window.visualViewport.height } : null));
  useEffect(() => {
    const v = window.visualViewport;
    const sync = () => v && setVv({ top: v.offsetTop, h: v.height });
    v?.addEventListener("resize", sync);
    v?.addEventListener("scroll", sync);
    // Siden bag arket må ikke scrolle eller hoppe, når tastaturet åbner; positionen gendannes ved lukning.
    const scrollY = window.scrollY;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus({ preventScroll: true });
    document.querySelectorAll("[data-barcode-proxy]").forEach(el => el.remove());
    return () => {
      v?.removeEventListener("resize", sync);
      v?.removeEventListener("scroll", sync);
      document.body.style.overflow = prevOverflow;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const code = VALID_LENGTHS.includes(value.length) ? normalizeScannedBarcode(value) : null;
  const shownError = error || (!submitting && submitError) || "";

  const change = (raw) => {
    const digits = raw.replace(/\D/g, "").slice(0, 14);
    setValue(digits);
    // Fejlen vises først, når længden kunne være en stregkode, men tallene ikke går op.
    setError(VALID_LENGTHS.includes(digits.length) && !normalizeScannedBarcode(digits) ? CHECK_ERROR : "");
  };
  const submit = () => {
    if (submitting) return;
    if (!code) { setError(VALID_LENGTHS.includes(value.length) ? CHECK_ERROR : LENGTH_ERROR); return; }
    inputRef.current?.blur(); // lukker tastaturet, når søgningen starter
    onSubmit(code);
  };

  const frame = vv ? { top: vv.top, height: vv.h } : { top: 0, bottom: 0 };
  return createPortal(
    <div className="mb-backdrop" style={{ position:"fixed", left:0, right:0, ...frame, zIndex:9993, display:"flex", alignItems:"flex-end" }}
      onClick={() => { if (!submitting) onClose(); }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="mb-title" tabIndex={-1} className="mb-sheet"
        onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
          <div style={{ flex:1, minWidth:0, paddingTop:6 }}>
            <div id="mb-title" style={{ fontSize:18, fontWeight:800, color:"var(--ink)", lineHeight:1.25 }}>Indtast stregkode</div>
            <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.5, marginTop:4 }}>Indtast tallene under produktets stregkode.</div>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} aria-label="Luk"
            style={{ width:44, height:44, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"50%", cursor:"pointer" }}>
            <Icon name="x" size={16} color="var(--ink)" />
          </button>
        </div>
        <form onSubmit={e => { e.preventDefault(); submit(); }} style={{ marginTop:16 }}>
          <input
            ref={inputRef}
            id="manual-ean-input"
            className="mb-field"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            enterKeyHint="search"
            placeholder="F.eks. 5712873099443"
            value={value}
            aria-label="Stregkodens tal"
            aria-invalid={!!shownError}
            aria-describedby={shownError ? "mb-error" : undefined}
            onChange={e => change(e.target.value)}
          />
          <div id="mb-error" role="alert" style={{ minHeight:20, fontSize:12.5, fontWeight:600, color:"var(--red)", marginTop:6 }}>{shownError}</div>
          <button type="submit" className="btn btn-primary btn-full" disabled={!code} aria-disabled={submitting} aria-busy={submitting}
            style={{ marginTop:6, minHeight:48, gap:10 }}>
            {submitting && <span className="mb-spinner" aria-hidden="true" />}
            {submitting ? "Søger …" : "Søg efter produkt"}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
