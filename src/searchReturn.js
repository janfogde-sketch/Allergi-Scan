// @ts-check
// "Tilbage"-knappen på produktsiden (10. okt. 2026): når et produkt åbnes fra søgningen, Favoritter, Historik, beskeder eller som alternativ, gemmes
// hvorfra, så produktsiden kan føre brugeren tilbage. Kun i hukommelsen (forsvinder ved genindlæsning) og knyttet til det åbnede produkts EAN, så
// knappen aldrig vises for et produkt, der blev scannet eller åbnet på anden måde.
/** @typedef {{ ean: string, label: string, screen?: string, query?: string, prevEan?: string }} ProductReturn */
/** @type {ProductReturn | null} */
let current = null;
const norm = (/** @type {unknown} */ v) => String(v ?? "").trim();

export function setProductReturn(/** @type {{ ean: unknown, label: string, screen?: string, query?: string, prevEan?: unknown }} */ r) {
  const ean = norm(r.ean);
  current = ean ? { ean, label: r.label, screen: r.screen, query: r.query ? norm(r.query) : undefined, prevEan: r.prevEan ? norm(r.prevEan) : undefined } : null;
}
/** Åbnet fra søgningen på indkøbslisten: søgeordet genskabes ved tilbagevenden. */
export function setSearchReturn(/** @type {string} */ query, /** @type {unknown} */ ean, /** @type {string} */ screen) {
  const q = norm(query);
  if (!q) { current = null; return; }
  setProductReturn({ ean, label: "Tilbage til søgning", screen, query: q });
}
export function getReturnFor(/** @type {unknown} */ ean) {
  return current && current.ean === norm(ean) ? current : null;
}
export const getSearchReturnFor = getReturnFor;
export function clearSearchReturn() { current = null; }
