import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import privacy from "./legalText/privacy.js";
import terms from "./legalText/terms.js";
import { parseInline, inlineToHtml } from "./legalText/inline.js";
import { renderPage } from "../scripts/build-legal-pages.mjs";

// Garanterer at de offentlige sider (public/*.html) altid er genereret ud fra
// samme tekst som appens skærme. Fejler testen: kør `node scripts/build-legal-pages.mjs`.
describe("politiktekster: én kilde", () => {
  for (const [file, doc] of [["public/privacy.html", privacy], ["public/terms.html", terms]]) {
    it(`${file} er opdateret ud fra kilden`, () => {
      const html = readFileSync(file, "utf-8");
      expect(renderPage(html, doc)).toBe(html);
    });
    it(`${file}: ingen rå mini-markup eller åbne juridiske punkter i teksten`, () => {
      const all = JSON.stringify(doc);
      expect(all).not.toMatch(/<[a-z]/i);
      expect(doc.blocks.length).toBeGreaterThan(20);
      expect(doc.updated).toMatch(/\d{4}$/);
    });
  }
  it("mini-markup oversættes korrekt", () => {
    expect(parseInline("a **b**\nc {mail} [x](https://y.dk)").map((p) => p.type))
      .toEqual(["text", "strong", "br", "text", "mail", "text", "link"]);
    expect(inlineToHtml("Privatliv & data")).toBe("Privatliv &amp; data");
  });
});
