// supabase/functions/_shared/notifyHelpers.js
// Små rene hjælpere til notify (testet i src/notifyHelpers.test.js).

const CPH = "Europe/Copenhagen";
const dayKey = (d) => new Intl.DateTimeFormat("sv-SE", { timeZone: CPH }).format(d); // YYYY-MM-DD

/** "i dag kl. 18:35" / "i morgen kl. 09:10" / "3. okt. kl. 09:10" i dansk tid. */
export function formatDanishDeadline(iso, now = new Date()) {
  const d = new Date(iso);
  const time = new Intl.DateTimeFormat("da-DK", { timeZone: CPH, hour: "2-digit", minute: "2-digit", hour12: false }).format(d).replace(".", ":");
  const tomorrow = new Date(now.getTime() + 86400_000);
  if (dayKey(d) === dayKey(now)) return `i dag kl. ${time}`;
  if (dayKey(d) === dayKey(tomorrow)) return `i morgen kl. ${time}`;
  return `${new Intl.DateTimeFormat("da-DK", { timeZone: CPH, day: "numeric", month: "short" }).format(d)} kl. ${time}`;
}

/** "Mælk, Æg og 3 flere" — højst fem navne. */
export function summarizeItems(names) {
  const clean = names.map((n) => String(n ?? "").trim()).filter(Boolean);
  if (clean.length === 0) return "";
  const shown = clean.slice(0, 5);
  const rest = clean.length - shown.length;
  if (rest > 0) return `${shown.join(", ")} og ${rest} flere`;
  return shown.length > 1 ? `${shown.slice(0, -1).join(", ")} og ${shown[shown.length - 1]}` : shown[0];
}

/** "30. september 2026 kl. 17:12" i dansk tid. */
export function formatDanishDateTime(iso) {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("da-DK", { timeZone: CPH, day: "numeric", month: "long", year: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("da-DK", { timeZone: CPH, hour: "2-digit", minute: "2-digit", hour12: false }).format(d).replace(".", ":");
  return `${date} kl. ${time}`;
}


// ── P1: ændrede allergenoplysninger ─────────────────────────────────────────
const ALLERGEN_LABELS = {
  aeg: "Æg", fisk: "Fisk", soja: "Soja", hvede: "Hvede", lupin: "Lupin", sesam: "Sesam", svovl: "Svovldioxid og sulfit",
  gluten: "Gluten", sennep: "Sennep", laktose: "Laktose", noedder: "Nødder", selleri: "Selleri", skaldyr: "Skaldyr",
  bloeddyr: "Bløddyr", jordnoedder: "Jordnødder", maelkeallergi: "Mælkeprotein",
  coeliaki: "Cøliaki",
};
const CHANGE_WORDS = { yes: "indeholder nu", traces: "kan nu indeholde spor", unknown: "er nu uoplyst" };

/** Risikotrin for et allergenflag — samme skala som allergen_risk_rank() i databasen. */
export function allergenRiskRank(v) {
  return v === "yes" ? 3 : v === "traces" ? 2 : v === "unknown" ? 1 : 0;
}

/**
 * Hvilke af de ændrede flag gælder stadig og berører denne modtagers profiler?
 * changes: { key: { old, new } } fra hændelsen; current: produktets AKTUELLE allergen_flags;
 * profileAllergens: alle allergen-id'er fra modtagerens egen og administrerede profiler.
 * tracesIgnored: allergen-id'er, hvor ALLE modtagerens profiler kun reagerer på direkte indhold (spor flagges ikke).
 * Returnerer [{ key, label, value }] — kun flag, hvor risikoen fortsat er højere end før.
 */
export function affectedAllergenChanges(changes, current, profileAllergens, tracesIgnored = new Set()) {
  const mine = new Set(profileAllergens);
  // Cøliaki er kun et profilvalg uden egne produktflag: det berøres af ændringer i gluten og hvede
  const viaCoeliac = mine.has("coeliaki");
  const out = [];
  for (const [key, ch] of Object.entries(changes ?? {})) {
    const own = mine.has(key);
    const derived = viaCoeliac && (key === "gluten" || key === "hvede");
    if (!own && !derived) continue;
    const now = current?.[key];
    if (allergenRiskRank(now) <= allergenRiskRank(ch?.old)) continue; // rullet tilbage siden
    // Modtageren reagerer kun på direkte indhold (allergen_levels): en ændring til "spor" er ikke en advarsel,
    // men kun hvis ALLE valg, der berøres af flaget, ignorerer spor
    if (now === "traces" && (!own || tracesIgnored.has(key)) && (!derived || tracesIgnored.has("coeliaki"))) continue;
    out.push({ key, label: ALLERGEN_LABELS[key] ?? key, value: now });
  }
  return out;
}

/** "Æg indeholder nu, Fisk kan nu indeholde spor" — bruges i besked og mail. */
export function summarizeAllergenChanges(list) {
  return list.map((c) => `${c.label} ${CHANGE_WORDS[c.value] ?? "er ændret"}`).join(", ");
}
