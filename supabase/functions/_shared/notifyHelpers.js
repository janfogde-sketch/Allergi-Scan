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

