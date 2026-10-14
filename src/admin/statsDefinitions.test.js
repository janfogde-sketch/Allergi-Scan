// @ts-nocheck
// Vagt: scanninger i alt, scanninger i dag og diagrammet "Scanninger pr. dag" bruger samme definition (found_via='scan'), og søgninger tælles separat
// (found_via='search'), så intet tælles dobbelt. Tallene tælles i databasefunktionen admin_dashboard_stats (G27).
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";

const dir = new URL("../../supabase/migrations/", import.meta.url);
const file = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()
  .filter((f) => readFileSync(new URL(f, dir), "utf8").includes("function public.admin_dashboard_stats")).pop();
const sql = readFileSync(new URL(file, dir), "utf8");
const adminSrc = readFileSync(new URL("../useAdmin.js", import.meta.url), "utf8");

describe("statistik: scanninger og søgninger", () => {
  it("alle tre scanningstal filtrerer på found_via = 'scan'", () => {
    const scanQueries = sql.match(/from public\.scan_history\s+where found_via = 'scan'[^)]*/g) || [];
    expect(scanQueries.length).toBe(3); // i alt, i dag, trend
    expect(scanQueries.some((q) => q.includes("scanned_at >= v_today_start"))).toBe(true); // i dag
    expect(scanQueries.some((q) => q.includes("scanned_at >= v_trend_start"))).toBe(true); // diagrammet
  });
  it("søgninger tælles separat (found_via = 'search') og er aldrig en del af scanningstallet", () => {
    expect((sql.match(/found_via = 'search'/g) || []).length).toBe(1);
    expect(sql).not.toMatch(/found_via in/i);
  });
  it("døgn regnes i dansk tid, og kun admins kan kalde funktionen", () => {
    expect(sql).toMatch(/Europe\/Copenhagen/);
    expect(sql).toMatch(/is_admin\(/);
    expect(sql).toMatch(/revoke execute on function public\.admin_dashboard_stats\(integer\) from public, anon/);
  });
  it("panelet henter tallene med ét kald i stedet for at hente rækkerne selv", () => {
    expect(adminSrc).toMatch(/rpc\/admin_dashboard_stats/);
    expect(adminSrc).not.toMatch(/scan_history\?select=scanned_at/);
  });
});
