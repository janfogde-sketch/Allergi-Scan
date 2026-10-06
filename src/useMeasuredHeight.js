// @ts-nocheck
import { useState, useLayoutEffect } from "react";

// Højden på en fast placeret bjælke (bundnavigationen eller "Gem ændringer"-bjælken), målt løbende (2. okt. 2026, Bjørn). Bruges af
// EditPreferencesScreen og FamilyScreen. Bundnavigationens højde afhænger af iPhone'ens safe area (hjemmeindikator), så en fast padding på siden (110 px) kunne ende under navigationen.
// Måles på border-box, så ændringer i safe area-padding (rotation, andre iPhone-modeller) også opfanges.
export function useMeasuredHeight(getEl, deps = []) {
  const [h, setH] = useState(0);
  useLayoutEffect(() => {
    const el = getEl();
    if (!el) { setH(0); return undefined; }
    const measure = () => setH(Math.round(el.getBoundingClientRect().height));
    measure();
    let ro;
    if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(measure); ro.observe(el, { box: "border-box" }); }
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => { ro?.disconnect(); window.removeEventListener("resize", measure); window.removeEventListener("orientationchange", measure); };
  }, deps);
  return h;
}
