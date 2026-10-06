import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

// Sikkerhedsfund F1 (6. okt. 2026): family/link-profile overskrev en anden kontos allergier uden samtykke og er fjernet.
describe("family/link-profile er fjernet", () => {
  it("edge-funktionen har ikke endpointet", () => {
    expect(readFileSync("supabase/functions/family/index.ts", "utf8")).not.toContain("link-profile");
  });
  it("Familie-skærmen har ikke Slå sammen-knappen", () => {
    const src = readFileSync("src/FamilyScreen.jsx", "utf8");
    expect(src).not.toContain("link-profile");
    expect(src).not.toContain("Slå dem sammen");
  });
});
