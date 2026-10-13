// @ts-check
// Tekster til adminloggen: handling og skift på dansk. Ukendte handlinger vises som de er gemt.

const ACTION_LABELS = {
  rolle_aendret: "Rolle ændret",
  bruger_slettet: "Bruger slettet",
  ticketstatus_aendret: "Ticketstatus ændret",
  indsendelse_behandlet: "Indsendelse behandlet",
  produkt_slettet: "Produkt slettet",
  vidensindgang_slettet: "Leksikonpost slettet",
};

/** @param {string} action */
export function auditActionLabel(action) {
  return ACTION_LABELS[action] || action;
}

/** @param {{ details?: { fra?: string|null, til?: string|null } | null }} row */
export function auditChangeText(row) {
  const d = row && row.details;
  if (!d || (d.fra == null && d.til == null)) return "";
  return `${d.fra ?? "tom"} → ${d.til ?? "tom"}`;
}

/** Kort id til visning (de første 8 tegn); loggen gemmer aldrig navn eller e-mail. */
/** @param {string|null|undefined} id */
export function shortId(id) {
  return id ? String(id).slice(0, 8) : "—";
}
