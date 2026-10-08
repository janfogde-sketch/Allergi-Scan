// Delt-status for en indkøbsliste. Listenavnet er brugerdefineret og indgår aldrig her: kun type/ejer/adgang afgør status.
// Serveren (shopping) beriger lister med owner_name (fornavn, for andres lister) og shared_with (fornavne, for egne lister).

// "Anna", "Anna og Ben", "Anna, Ben og Cecilie", "Anna, Ben og 2 andre"
export function joinNames(names) {
  const n = (names || []).filter(Boolean);
  if (n.length <= 1) return n[0] || "";
  if (n.length === 2) return `${n[0]} og ${n[1]}`;
  if (n.length === 3) return `${n[0]}, ${n[1]} og ${n[2]}`;
  return `${n[0]}, ${n[1]} og ${n.length - 2} andre`;
}

export function isSharedList(list, userId) {
  if (!list) return false;
  if (list.type === "family") return true;
  if (list.owner_id && userId && list.owner_id !== userId) return true;
  return Boolean(list.shared_with && list.shared_with.length > 0);
}

// Sekundær statuslinje under listenavnet ("Delt af Anna", "Delt med hele familien", "Delt med Anna og Ben", "Kun dig").
export function listShareStatus(list, userId) {
  if (!list) return "";
  if (list.owner_id && userId && list.owner_id !== userId) return list.owner_name ? `Delt af ${list.owner_name}` : "Delt med dig";
  if (list.type === "family") return "Delt med hele familien";
  if (list.shared_with && list.shared_with.length > 0) return `Delt med ${joinNames(list.shared_with)}`;
  return "Kun dig";
}

// ── Link til en indkøbsliste ────────────────────────────────────────────────
export const LIST_LINK_BASE = "https://www.eatsafe.dk/list/";
export const listLinkUrl = code => `${LIST_LINK_BASE}${code}`;

// Teksten, der følger med linket, så modtageren forstår, hvad de får (messenger-apps viser kun teksten og linkets forhåndsvisning).
export function listShareText(listName) {
  return `Jeg vil gerne dele min indkøbsliste "${listName}" med dig i EatSafe. Åbn linket for at se, hvad der deles. Du bestemmer selv, om du vil tilslutte.`;
}

// Kode ud af et indsat link (nyt /list/KODE, gammelt ?join-list=KODE) eller en rå kode.
export function parseListCode(input) {
  const raw = (input || "").trim();
  try {
    const u = new URL(raw);
    const fromQuery = u.searchParams.get("join-list");
    if (fromQuery) return fromQuery.trim().toUpperCase();
    const m = u.pathname.match(/^\/list\/([A-Za-z0-9]+)/);
    if (m) return m[1].toUpperCase();
  } catch { /* ikke et link, brug som kode */ }
  return raw.toUpperCase();
}

// Ser det indsatte ud som et link eller en kode til en delt liste? (Serveren afgør endeligt, om den findes.)
export function looksLikeListLink(input) {
  return /^[A-Z0-9]{4,}$/.test(parseListCode(input));
}
