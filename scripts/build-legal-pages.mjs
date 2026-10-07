// Genererer brødteksten i public/privacy.html og public/terms.html ud fra src/legalText/*.js
// (samme kilde som appens skærme). Kør: node scripts/build-legal-pages.mjs
import { readFileSync, writeFileSync } from "node:fs";
import privacy from "../src/legalText/privacy.js";
import terms from "../src/legalText/terms.js";
import { legalBodyHtml } from "../src/legalText/inline.js";

const START = "<!-- LEGAL-BODY-START (genereret af scripts/build-legal-pages.mjs, ret i src/legalText/) -->";
const END = "<!-- LEGAL-BODY-END -->";

export function renderPage(html, doc) {
  const block = `${START}\n${legalBodyHtml(doc)}\n    ${END}`;
  const re = /<!-- LEGAL-BODY-START[^>]*-->[\s\S]*?<!-- LEGAL-BODY-END -->/;
  if (!re.test(html)) throw new Error("Markører mangler i siden");
  return html.replace(re, () => block);
}

if (process.argv[1].endsWith("build-legal-pages.mjs")) {
  for (const [file, doc] of [["public/privacy.html", privacy], ["public/terms.html", terms]]) {
    writeFileSync(file, renderPage(readFileSync(file, "utf-8"), doc));
    console.log(file, "opdateret");
  }
}
