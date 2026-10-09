// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";

// iOS-opstartsbillederne (scripts/build-splash.py) skal findes for hvert <link> i index.html.
describe("iOS-opstartsbilleder", () => {
  const html = readFileSync("index.html", "utf8");
  const hrefs = [...html.matchAll(/rel="apple-touch-startup-image"[^>]*href="([^"]+)"/g)].map(m => m[1]);
  it("har et billede pr. enhedsstørrelse", () => {
    expect(hrefs.length).toBeGreaterThanOrEqual(10);
  });
  it("alle henviste filer findes", () => {
    for (const h of hrefs) expect(existsSync(`public${h}`), h).toBe(true);
  });
  it("filnavnet matcher enhedens pixelstørrelse (css-størrelse × pixelratio)", () => {
    for (const m of html.matchAll(/device-width: (\d+)px\) and \(device-height: (\d+)px\) and \(-webkit-device-pixel-ratio: (\d)\)[^>]*href="\/splash\/splash-(\d+)x(\d+)\.png"/g)) {
      expect([m[4], m[5]]).toEqual([String(+m[1] * +m[3]), String(+m[2] * +m[3])]);
    }
  });
});
