// @ts-nocheck
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { signReportToken, verifyReportToken, buildReportUrl, REPORT_TTL_SECONDS, REPORT_PAGE } from "../supabase/functions/_shared/reportLink.ts";

const SECRET = "v1,whsec_dGVzdC1oZW1tZWxpZ2hlZA==";
const UID = "7b9d1c0e-3f2a-4c55-9a47-0d3f6b8e1a22";
const NOW = Date.UTC(2026, 9, 1, 12, 0, 0);

describe("signeret rapport-token", () => {
  it("rundtur: gyldig token giver bruger-id", async () => {
    const t = await signReportToken(SECRET, UID, NOW);
    expect(await verifyReportToken(SECRET, t, NOW + 1000)).toEqual({ ok: true, userId: UID });
  });
  it("udløber efter 7 dage", async () => {
    const t = await signReportToken(SECRET, UID, NOW);
    expect((await verifyReportToken(SECRET, t, NOW + (REPORT_TTL_SECONDS - 5) * 1000)).ok).toBe(true);
    expect(await verifyReportToken(SECRET, t, NOW + (REPORT_TTL_SECONDS + 5) * 1000)).toEqual({ ok: false, reason: "expired" });
  });
  it("afviser ændret nyttelast, forkert hemmelighed og skrald", async () => {
    const t = await signReportToken(SECRET, UID, NOW);
    const [p, s] = t.split(".");
    const other = btoa(`${"00000000-0000-4000-8000-000000000000"}.${Math.floor(NOW / 1000) + 99999}`).replace(/=+$/, "");
    expect((await verifyReportToken(SECRET, `${other}.${s}`, NOW)).ok).toBe(false);
    expect((await verifyReportToken("v1,whsec_andenhemmelighed", t, NOW)).ok).toBe(false);
    for (const bad of ["", "abc", "a.b.c", `${p}.`, `.${s}`, "x".repeat(700), null, undefined, 42]) {
      expect((await verifyReportToken(SECRET, bad, NOW)).ok, String(bad)).toBe(false);
    }
  });
  it("kan ikke genbruges som en anden slags signatur (domæneadskilt)", async () => {
    // samme nyttelast signeret uden præfikset "report-reset:" skal afvises
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const payload = `${UID}.${Math.floor(NOW / 1000) + 1000}`;
    const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
    const b64 = (u8) => btoa(String.fromCharCode(...u8)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect((await verifyReportToken(SECRET, `${b64(new TextEncoder().encode(payload))}.${b64(sig)}`, NOW)).ok).toBe(false);
  });
  it("nægter at signere uden hemmelighed eller med ugyldigt bruger-id", async () => {
    await expect(signReportToken("", UID)).rejects.toThrow();
    await expect(signReportToken(SECRET, "ikke-et-uuid")).rejects.toThrow();
  });
  it("linket peger på den statiske side og kan læses tilbage", async () => {
    const t = await signReportToken(SECRET, UID, NOW);
    const url = new URL(buildReportUrl(t));
    expect(`${url.origin}${url.pathname}`).toBe(REPORT_PAGE);
    expect(url.searchParams.get("t")).toBe(t);
  });
});

describe("siden og funktionen hænger sammen", () => {
  const page = readFileSync("public/uventet-nulstilling.html", "utf-8") + readFileSync("public/js/uventet-nulstilling.js", "utf-8");
  const fn = readFileSync("supabase/functions/report-unrequested-reset/index.ts", "utf-8");
  it("siden sender først ved et klik på knappen (ikke ved indlæsning) og kalder funktionen", () => {
    expect(page).toContain("/functions/v1/report-unrequested-reset");
    expect(page).toContain("addEventListener('click'");
    expect(page).toContain('content="noindex, nofollow"');
    expect(page).toContain('name="referrer" content="no-referrer"');
  });
  it("funktionen er signeret token-link: verificerer før noget læses, og config har verify_jwt=false", () => {
    expect(fn.indexOf("verifyReportToken(")).toBeLessThan(fn.indexOf('.from("users")'));
    expect(readFileSync("supabase/config.toml", "utf-8")).toMatch(/\[functions\.report-unrequested-reset\]\s*\nverify_jwt = false/);
  });
  it("migrationen giver kun admins læseadgang", () => {
    const sql = readFileSync("supabase/migrations/20261001120838_security_reports.sql", "utf-8");
    expect(sql).toContain("revoke all on public.security_reports from anon, authenticated");
    expect(sql).toContain("public.is_admin((select auth.uid()))");
    expect(sql).not.toMatch(/grant (insert|update|delete)[^;]*authenticated/i);
  });
});
