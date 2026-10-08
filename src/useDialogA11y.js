// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useDialogA11y.js (F4-7, 6. okt. 2026)
// Fælles adfærd for ark og dialoger: fokus flyttes ind ved åbning, Tab bliver
// inde i arket, Esc lukker, og fokus vender tilbage til det element, der
// åbnede arket. Bruges sammen med role="dialog" aria-modal aria-labelledby.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef } from "react";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Åbne ark i rækkefølge: kun det øverste reagerer på Esc/Tab (fx en bekræftelse oven på et ark).
const stack = [];

function focusableIn(root) {
  return root ? Array.from(root.querySelectorAll(FOCUSABLE)).filter(el => !el.hasAttribute("aria-hidden")) : [];
}

export function useDialogA11y(ref, onClose, { active = true } = {}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active) return undefined;
    const opener = document.activeElement;
    const token = {};
    stack.push(token);
    const root = ref.current;
    // Fokus på selve arket (tabIndex={-1}), ikke første felt: et tekstfelt i fokus åbner tastaturet på
    // telefonen, og en knap i fokus kan aktiveres ved et uheld. Skærmlæseren læser titlen op.
    root?.focus?.({ preventScroll: true });

    const onKey = (e) => {
      if (stack[stack.length - 1] !== token) return;
      if (e.key === "Escape") { e.stopPropagation(); onCloseRef.current?.(); return; }
      if (e.key !== "Tab" || !ref.current) return;
      const items = focusableIn(ref.current);
      if (!items.length) { e.preventDefault(); return; }
      const firstEl = items[0], lastEl = items[items.length - 1];
      const atStart = document.activeElement === firstEl || document.activeElement === ref.current;
      if (e.shiftKey && atStart) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      const i = stack.indexOf(token);
      if (i >= 0) stack.splice(i, 1);
      if (opener && typeof opener.focus === "function" && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [active, ref]);
}

export default useDialogA11y;
