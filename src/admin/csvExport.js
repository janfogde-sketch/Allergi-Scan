// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// csvExport.js — delt CSV-eksport-helper for desktop admin-panelet. Ligger
// under src/admin/ (ikke i det delte helpers.js) så den ikke bloater den
// mobile PWA's bundle — kun admin.html importerer den.
// ─────────────────────────────────────────────────────────────────────────────

// Escaper én CSV-celle efter RFC 4180: omslut i citationstegn hvis feltet
// indeholder komma, citationstegn eller linjeskift, og fordoble interne
// citationstegn. Semikolon bruges IKKE som separator — Excel/Numre håndterer
// komma-separerede filer med UTF-8 BOM korrekt i både dansk og engelsk locale
// når filen selv erklærer sin encoding via BOM'en herunder.
function escapeCsvCell(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

// columns: [{ key, label }] — key kan være en dot-path ("product.name") for
// nemheds skyld, da flere admin-lister allerede har nested felter (fx
// HistorySection's r.product.name).
function getValue(row, key) {
  return key.split(".").reduce((v, k) => (v == null ? v : v[k]), row);
}

export function downloadCsv(filename, rows, columns) {
  const header = columns.map(c => escapeCsvCell(c.label)).join(",");
  const body = rows.map(row => columns.map(c => escapeCsvCell(getValue(row, c.key))).join(",")).join("\n");
  // UTF-8 BOM foran — uden den gætter Excel ofte forkert encoding og viser
  // danske tegn (æ/ø/å) som mojibake ved åbning af filen.
  const csv = "﻿" + header + "\n" + body;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
