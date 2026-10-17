// @ts-check
// Fælles opførsel for alle administrationens modalvinduer (.admin-modal-overlay), ét sted i stedet for i hver side:
// - Baggrunden scroller ikke, mens et vindue er åbent (klassen admin-modal-open på html, så den ikke støder på andre låse).
// - Et valgt tekstfelt scrolles frem i vinduet, så iPhones tastatur ikke dækker det.
// - Et tryk uden for felterne skjuler tastaturet (knapper og felter røres ikke, så Gem ikke mister sit tryk).
// - Mens tastaturet er åbent, følger overlayet det synlige område (--admin-vvh/--admin-vvt), så bundbjælker ikke ligger bag det.
const OVERLAY = ".admin-modal-overlay";
const FIELD = "input,textarea,select,[contenteditable='true']";
const KEEP = `${FIELD},button,a,label,[role='button'],[role='tab'],[role='menuitem'],summary`;
const KEYBOARD_MIN_PX = 120;

/** @param {Document} [doc] @param {Window} [win] */
export function installModalGuard(doc = document, win = window) {
  const root = doc.documentElement;
  const hasOverlay = () => !!doc.querySelector(OVERLAY);
  const sync = () => root.classList.toggle("admin-modal-open", hasOverlay());
  sync();
  const observer = new win.MutationObserver(sync);
  observer.observe(doc.body, { childList: true });

  /** @param {Event} e */
  const onFocusIn = (e) => {
    const t = /** @type {HTMLElement|null} */ (e.target instanceof win.HTMLElement ? e.target : null);
    if (!t || !t.matches(FIELD) || !t.closest(OVERLAY)) return;
    win.setTimeout(() => { if (doc.activeElement === t && typeof t.scrollIntoView === "function") t.scrollIntoView({ block: "center" }); }, 300);
  };
  /** @param {Event} e */
  const onTouchStart = (e) => {
    const a = /** @type {HTMLElement|null} */ (doc.activeElement instanceof win.HTMLElement ? doc.activeElement : null);
    if (!a || !a.matches(FIELD) || !a.closest(OVERLAY)) return;
    const t = e.target instanceof win.Element ? e.target : null;
    if (t && !t.closest(KEEP)) a.blur();
  };
  doc.addEventListener("focusin", onFocusIn);
  doc.addEventListener("touchstart", onTouchStart, { passive: true });

  const vv = win.visualViewport;
  const onViewport = () => {
    if (!vv) return;
    const open = hasOverlay() && win.innerHeight - vv.height > KEYBOARD_MIN_PX;
    if (open) {
      root.style.setProperty("--admin-vvh", `${Math.round(vv.height)}px`);
      root.style.setProperty("--admin-vvt", `${Math.round(vv.offsetTop)}px`);
    } else {
      root.style.removeProperty("--admin-vvh");
      root.style.removeProperty("--admin-vvt");
    }
  };
  vv?.addEventListener("resize", onViewport);
  vv?.addEventListener("scroll", onViewport);

  return () => {
    observer.disconnect();
    doc.removeEventListener("focusin", onFocusIn);
    doc.removeEventListener("touchstart", onTouchStart);
    vv?.removeEventListener("resize", onViewport);
    vv?.removeEventListener("scroll", onViewport);
    root.classList.remove("admin-modal-open");
    root.style.removeProperty("--admin-vvh");
    root.style.removeProperty("--admin-vvt");
  };
}
