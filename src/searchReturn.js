// @ts-check
// "Tilbage til søgning" (10. okt. 2026): når et produkt åbnes fra søgningen på indkøbslisten, gemmes søgeordet her, så produktsiden kan
// føre brugeren tilbage til samme søgning. Kun i hukommelsen (forsvinder ved genindlæsning) og knyttet til det åbnede produkts EAN.
/** @type {{ query: string, ean: string } | null} */
let current = null;
const norm = (/** @type {unknown} */ v) => String(v ?? "").trim();

export function setSearchReturn(/** @type {string} */ query, /** @type {unknown} */ ean) {
  const q = norm(query);
  current = q && norm(ean) ? { query: q, ean: norm(ean) } : null;
}
/** Søgningen, der hører til dette produkt (ellers null). */
export function getSearchReturnFor(/** @type {unknown} */ ean) {
  return current && current.ean === norm(ean) ? current : null;
}
export function clearSearchReturn() { current = null; }
