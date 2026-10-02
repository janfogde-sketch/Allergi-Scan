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
