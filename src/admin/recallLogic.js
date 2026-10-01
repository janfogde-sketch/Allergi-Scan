// Ren logik til admin-fanen "Tilbagekald" (tilbagekaldelser fra Fødevarestyrelsen, P6).
// Holdt adskilt fra React, så den kan testes.

export const RECALL_STATUS_LABELS = {
  needs_review: "Afventer gennemgang",
  ready: "Sendt",
  archived: "Arkiveret",
  cancelled: "Annulleret",
};
export const RECALL_STATUS_PILL = {
  needs_review: "admin-pill-amber",
  ready: "admin-pill-green",
  archived: "admin-pill-neutral",
  cancelled: "admin-pill-red",
};
export const RECALL_VIEWS = ["needs_review", "ready", "archived", "cancelled", "all"];

export const needsReviewCount = (recalls) => recalls.filter((r) => r.status === "needs_review").length;

export function filterRecalls(recalls, view) {
  const list = view === "all" ? recalls : recalls.filter((r) => r.status === view);
  return [...list].sort((a, b) => String(b.published_at || b.created_at || "").localeCompare(String(a.published_at || a.created_at || "")));
}

export function countByStatus(recalls) {
  const out = { all: recalls.length };
  for (const s of Object.keys(RECALL_STATUS_LABELS)) out[s] = recalls.filter((r) => r.status === s).length;
  return out;
}

// Tilføjer et produkt til de valgte (på EAN, uden dubletter); returnerer en ny liste.
export function addProduct(selected, product) {
  if (!product?.ean || selected.some((p) => p.ean === product.ean)) return selected;
  return [...selected, { id: product.id, ean: product.ean, name: product.name, brand: product.brand }];
}

export const removeProduct = (selected, ean) => selected.filter((p) => p.ean !== ean);

// Søgeordet til produktsøgningen: kun cifre fra et råt tal fra siden, ellers teksten som den er.
export const searchTermFromRaw = (raw) => String(raw ?? "").replace(/\D/g, "") || String(raw ?? "").trim();

// Tekst til bekræftelsen før en besked sendes.
export function confirmSendText(count, productCount) {
  const who = count === 0 ? "Ingen brugere har dem som favorit, scannet dem de seneste 90 dage eller har dem på en indkøbsliste"
    : count === 1 ? "1 bruger får en besked"
    : `${count} brugere får en besked`;
  return `${who}. Send tilbagekaldelsen for ${productCount} ${productCount === 1 ? "produkt" : "produkter"}? Det kan ikke fortrydes.`;
}
