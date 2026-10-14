// @ts-check
// "Reducér bevægelse": læser telefonens indstilling, så rulning og andre
// bevægelser, der styres fra koden, kan slås fra. CSS-animationer dækkes af
// den globale regel i theme.jsx/adminTheme.js.
export const prefersReducedMotion = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** @returns {"auto" | "smooth"} */
export const scrollBehavior = () => (prefersReducedMotion() ? "auto" : "smooth");
