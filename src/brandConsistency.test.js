// Brandfarver ens alle steder (7. okt. 2026, Bjørn: "så det altid er ens alle steder").
// Kilden er BRAND.md og :root i src/theme.jsx. Testen fanger to ting:
// (1) udfasede grønne/gule/grå nuancer, der er dukket op igen, og
// (2) selvstændige sider og admin-panelet, der har kopieret en anden --green end appen.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const BRAND = { green: "#0F7D4F", brandInk: "#232528", ink: "#15201A", amber: "#9A6514" };

// Nuancer, der er udfaset. Brug tokens fra BRAND.md i stedet.
const RETIRED = [
  "#0E8F5A", "#08734A", // gammel Scan-palet
  "#178A50", "#039A55", // ældre grønne (installationsside, admin-digest, admin theme-color)
  "#16a34a", "#2563eb", "#6B7280", // Tailwind-farver i datakilde-badgen
  "#B5791A", // gammel amber (for lav kontrast med hvid tekst)
  "#6B7A70", // gammel neutral
];

const walk = (dir, exts) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name);
  if (statSync(p).isDirectory()) return name === "node_modules" ? [] : walk(p, exts);
  return exts.some((e) => p.endsWith(e)) ? [p] : [];
});

const files = [
  ...walk("src", [".js", ".jsx"]).filter((p) => !p.endsWith(".test.js")),
  ...walk("public", [".html", ".svg", ".json"]),
  ...walk("supabase/functions", [".ts", ".js"]),
  ...walk("supabase/templates", [".html"]),
  "index.html", "admin.html",
];

describe("brandfarver", () => {
  it("bruger ingen udfasede farver", () => {
    const hits = [];
    for (const f of files) {
      const s = readFileSync(f, "utf8");
      for (const hex of RETIRED) {
        if (new RegExp(`${hex}(?![0-9a-f])`, "i").test(s)) hits.push(`${f}: ${hex}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it("appen, admin og de selvstændige sider har samme --green", () => {
    const pages = ["src/theme.jsx", "src/admin/adminTheme.js",
      ...walk("public", [".html"])];
    for (const f of pages) {
      const m = readFileSync(f, "utf8").match(/--green:\s*(#[0-9a-f]{6})/i);
      if (m) expect(m[1].toUpperCase(), f).toBe(BRAND.green);
    }
  });

  it("logoets master-SVG'er bruger kun brandfarverne og ingen gradient", () => {
    for (const f of walk("src/assets/logo", [".svg"])) {
      const s = readFileSync(f, "utf8");
      expect(s, f).not.toMatch(/Gradient/);
      const colors = new Set((s.match(/#[0-9a-f]{6}/gi) || []).map((c) => c.toUpperCase()));
      for (const c of colors) {
        expect(["#232528", "#0F7D4F", "#FBFAF7", "#FFFFFF", "#000000"], `${f}: ${c}`).toContain(c);
      }
    }
  });

  it("wordmark-farverne følger logoet", () => {
    const css = readFileSync("src/theme.jsx", "utf8");
    expect(css).toMatch(new RegExp(`--brand-ink:${BRAND.brandInk}`, "i"));
    expect(css).toMatch(/\.topbar-wordmark\{[^}]*color:var\(--brand-ink\)/);
    expect(css).toMatch(/\.topbar-wordmark-safe\{color:var\(--green\);\}/);
  });
});
