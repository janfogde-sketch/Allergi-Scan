import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Appen bruger env(safe-area-inset-*) mange steder (header, bundmenu, ark). Uden viewport-fit=cover er de værdier 0 på iPhone med Dynamic Island,
// og headeren/bundmenuen sidder forkert i forhold til statuslinjen og hjemmeindikatoren (set på hjemmeskærmsappen).
describe("viewport", () => {
  it("brugerappen bruger viewport-fit=cover, så safe-area-værdierne virker", () => {
    const html = readFileSync(join(process.cwd(), "index.html"), "utf8");
    expect(html).toMatch(/<meta name="viewport"[^>]*viewport-fit=cover/);
  });
  it("TEST-mærket på dev lægges under statuslinjen", () => {
    expect(readFileSync(join(process.cwd(), "src/devBadge.js"), "utf8")).toContain("top:env(safe-area-inset-top,0px)");
  });
});
