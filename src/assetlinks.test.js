import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));

describe("Android TWA: assetlinks.json", () => {
  const links = read("../public/.well-known/assetlinks.json");
  const target = links[0].target;

  it("er en gyldig Digital Asset Links-fil for en Android-app", () => {
    expect(links[0].relation).toContain("delegate_permission/common.handle_all_urls");
    expect(target.namespace).toBe("android_app");
    expect(target.package_name).toMatch(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/);
  });

  it("indeholder kun gyldige SHA-256-fingeraftryk (tom liste, til Play-nøglen er indsat)", () => {
    for (const fp of target.sha256_cert_fingerprints) {
      expect(fp).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
    }
  });

  it("serveres som JSON og rammes ikke af SPA-rewrite", () => {
    const vercel = read("../vercel.json");
    const h = vercel.headers.find((x) => x.source === "/.well-known/assetlinks.json");
    expect(h.headers).toContainEqual({ key: "Content-Type", value: "application/json" });
  });
});
