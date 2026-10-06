// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useScreenFocus.js (F4-6, 6. okt. 2026)
// Ved skærmskift flyttes fokus til den nye skærms overskrift (første h1 eller
// .screen-title), ellers til selve skærmen. Så starter skærmlæseren og
// tastaturet øverst på den nye side i stedet for på knappen, der blev trykket.
// Resultatsiden styrer selv fokus (vurderingen), og første visning røres ikke.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef } from "react";

export function focusScreenHeading(doc = document) {
  const target = doc.querySelector(".screen h1, .screen .screen-title") || doc.querySelector(".screen");
  if (!target) return false;
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  return true;
}

export function useScreenFocus(screen, { skip = [] } = {}) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    if (skip.includes(screen)) return undefined;
    // To frames: lazy-loadede skærme og fade-in skal nå at blive monteret.
    let id2;
    const id1 = requestAnimationFrame(() => { id2 = requestAnimationFrame(() => focusScreenHeading()); });
    return () => { cancelAnimationFrame(id1); if (id2) cancelAnimationFrame(id2); };
  }, [screen]); // skip er en konstant liste fra kalderen
}

export default useScreenFocus;
