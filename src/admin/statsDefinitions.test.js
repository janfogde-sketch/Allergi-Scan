// @ts-nocheck
// Vagt: scanninger i alt, scanninger i dag og diagrammet "Scanninger pr. dag" bruger samme definition (found_via=scan), og søgninger tælles separat (found_via=search), så intet tælles dobbelt.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../useAdmin.js", import.meta.url), "utf8");
const block = src.slice(src.indexOf("const loadAdminStats"), src.indexOf("const loadAdminStats") + 3500);

describe("statistik: scanninger og søgninger", () => {
  it("alle tre scanningstal filtrerer på found_via=eq.scan", () => {
    const scanQueries = block.match(/scan_history\?[^`"]*found_via=eq\.scan[^`"]*/g) || [];
    expect(scanQueries.length).toBe(3); // i alt, i dag, trend
    expect(scanQueries.some((q) => q.includes("scanned_at=gte") && q.includes("select=scanned_at"))).toBe(true); // diagrammet
    expect(scanQueries.some((q) => q.includes("select=id&found_via=eq.scan&scanned_at=gte"))).toBe(true); // i dag
  });
  it("søgninger tælles separat (found_via=eq.search) og er aldrig en del af scanningstallet", () => {
    expect((block.match(/found_via=eq\.search/g) || []).length).toBe(1);
    expect(block).not.toMatch(/found_via=in\./);
  });
});
