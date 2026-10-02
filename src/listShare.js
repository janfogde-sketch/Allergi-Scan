// Delt-status for en indkøbsliste. Listenavnet er brugerdefineret og indgår aldrig her: kun type/ejer afgør status.
export function isSharedList(list, userId) {
  if (!list) return false;
  return list.type === "family" || Boolean(list.owner_id && userId && list.owner_id !== userId);
}

// Sekundær statuslinje under listenavnet ("Delt med familien", "Delt med dig", "Din liste").
export function listShareStatus(list, userId) {
  if (!list) return "";
  if (list.owner_id && userId && list.owner_id !== userId) return "Delt med dig";
  if (list.type === "family") return "Delt med familien";
  return "Din liste";
}
