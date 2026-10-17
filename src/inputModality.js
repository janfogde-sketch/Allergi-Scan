// @ts-check
// Fokusringen på ikonknapper vises kun, når der bruges tastatur. Efter et tryk eller klik (mus, touch) sætter koden nogle steder fokus tilbage på en knap (fx når en menu lukkes),
// og så ville :focus-visible ellers tegne en grøn ring uden grund. html får data-modality="keyboard" eller "pointer", og stilarket skjuler ringen i "pointer".
/** @param {Document} [doc] */
export function installInputModality(doc = document) {
  const root = doc.documentElement;
  const set = (/** @type {string} */ m) => { if (root.getAttribute("data-modality") !== m) root.setAttribute("data-modality", m); };
  const onKey = (/** @type {KeyboardEvent} */ e) => { if (e.key === "Tab" || e.key.startsWith("Arrow") || e.key === "Enter" || e.key === " ") set("keyboard"); };
  const onPointer = () => set("pointer");
  doc.addEventListener("keydown", onKey, true);
  doc.addEventListener("pointerdown", onPointer, true);
  doc.addEventListener("touchstart", onPointer, { capture: true, passive: true });
  return () => {
    doc.removeEventListener("keydown", onKey, true);
    doc.removeEventListener("pointerdown", onPointer, true);
    doc.removeEventListener("touchstart", onPointer, true);
    root.removeAttribute("data-modality");
  };
}
