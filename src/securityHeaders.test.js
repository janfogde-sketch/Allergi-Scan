// Indholdsspærre (Content-Security-Policy) og sikkerhedshoveder i vercel.json.
// Spærren tillader kun egne scripts, så ingen side må have indlejret script (det ville blive blokeret
// og siden holde op med at virke) eller hente scripts/forbindelser fra nye adresser uden at spærren rettes.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";

const vercel = JSON.parse(readFileSync("vercel.json", "utf8"));
const all = vercel.headers.find((h) => h.source === "/(.*)").headers;
const header = (k) => all.find((h) => h.key === k)?.value;
const csp = Object.fromEntries(
  header("Content-Security-Policy").split(";").map((d) => d.trim().split(/\s+/)).map(([k, ...v]) => [k, v]),
);

describe("sikkerhedshoveder", () => {
  it("indholdsspærren tillader kun egne scripts og ingen indlejrede", () => {
    expect(csp["script-src"]).toEqual(["'self'"]);
    expect(csp["object-src"]).toEqual(["'none'"]);
    expect(csp["frame-ancestors"]).toEqual(["'none'"]);
    expect(csp["base-uri"]).toEqual(["'self'"]);
  });
  it("forbindelser kun til appen og Supabase (inkl. realtime)", () => {
    expect(csp["connect-src"]).toEqual([
      "'self'",
      "https://jegrpcflyguadyxialkm.supabase.co",
      "wss://jegrpcflyguadyxialkm.supabase.co",
    ]);
  });
  it("billeder fra Open Food Facts og Supabase er tilladt", () => {
    expect(csp["img-src"]).toContain("https://images.openfoodfacts.org");
    expect(csp["img-src"]).toContain("https://jegrpcflyguadyxialkm.supabase.co");
  });
  it("øvrige hoveder er sat, og kameraet er tilladt for appen selv", () => {
    expect(header("X-Content-Type-Options")).toBe("nosniff");
    expect(header("X-Frame-Options")).toBe("DENY");
    expect(header("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(header("Permissions-Policy")).toContain("camera=(self)");
  });
  it("ingen HTML-side har indlejret script eller hændelses-attributter", () => {
    const pages = ["index.html", "admin.html", ...readdirSync("public").filter((f) => f.endsWith(".html")).map((f) => `public/${f}`)];
    for (const p of pages) {
      const html = readFileSync(p, "utf8");
      for (const m of html.matchAll(/<script\b([^>]*)>/gi)) expect(m[1], `${p}: indlejret script`).toMatch(/\bsrc=/);
      expect(html, `${p}: onclick m.fl.`).not.toMatch(/\son[a-z]+\s*=/i);
      expect(html, `${p}: javascript:-link`).not.toMatch(/javascript:/i);
    }
  });
});
