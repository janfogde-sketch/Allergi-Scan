// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run, findMaps, buildIdFrom } from "../scripts/upload-sourcemaps.mjs";

let dist;
beforeEach(() => {
  dist = mkdtempSync(join(tmpdir(), "dist-"));
  mkdirSync(join(dist, "assets"));
  writeFileSync(join(dist, "assets", "main-ABC.js"), "x");
  writeFileSync(join(dist, "assets", "main-ABC.js.map"), JSON.stringify({ version: 3, mappings: "AAAA", sources: ["a"] }));
  writeFileSync(join(dist, "assets", "react-XYZ.js.map"), JSON.stringify({ version: 3, mappings: "AAAA", sources: ["b"] }));
  writeFileSync(join(dist, "assets", "style.css.map"), "{}");
});
afterEach(() => rmSync(dist, { recursive: true, force: true }));
const quiet = () => {};

describe("upload af source maps efter buildet", () => {
  it("build-id er de første 7 tegn af commit'en", () => {
    expect(buildIdFrom({ VERCEL_GIT_COMMIT_SHA: "D81F4E2AAAA" })).toBe("d81f4e2");
    expect(buildIdFrom({})).toBe("");
  });
  it("uden token: intet uploades, men ALLE kort slettes fra dist (aldrig offentlige)", async () => {
    const fetchFn = vi.fn();
    const r = await run({ dist, env: { VERCEL_GIT_COMMIT_SHA: "d81f4e2aaaa" }, fetchFn, log: quiet });
    expect(fetchFn).not.toHaveBeenCalled();
    expect(r.removed).toBe(3);
    expect(findMaps(dist)).toEqual([]);
    expect(existsSync(join(dist, "assets", "main-ABC.js"))).toBe(true); // selve koden røres ikke
  });
  it("med token: sender hvert .js.map med build-id og token, og sletter derefter alle kort", async () => {
    const fetchFn = vi.fn(async () => ({ ok: true, status: 200 }));
    const r = await run({ dist, env: { VERCEL_GIT_COMMIT_SHA: "d81f4e2aaaa", SOURCEMAP_UPLOAD_TOKEN: "t".repeat(32) }, fetchFn, log: quiet });
    expect(r.uploaded).toBe(2);
    const bodies = fetchFn.mock.calls.map((c) => JSON.parse(c[1].body));
    expect(bodies.map((b) => b.name).sort()).toEqual(["main-ABC.js.map", "react-XYZ.js.map"]);
    expect(bodies.every((b) => b.build === "d81f4e2")).toBe(true);
    expect(fetchFn.mock.calls[0][1].headers["x-upload-token"]).toBe("t".repeat(32));
    expect(findMaps(dist)).toEqual([]);
  });
  it("en fejlet eller afvist upload vælter ikke buildet, og kortene slettes alligevel", async () => {
    const log = vi.fn();
    const r1 = await run({ dist, env: { VERCEL_GIT_COMMIT_SHA: "d81f4e2aaaa", SOURCEMAP_UPLOAD_TOKEN: "t".repeat(32) }, fetchFn: async () => { throw new Error("net"); }, log });
    expect(r1.failed).toBe(2);
    expect(findMaps(dist)).toEqual([]);
    writeFileSync(join(dist, "assets", "a.js.map"), "{}");
    const r2 = await run({ dist, env: { VERCEL_GIT_COMMIT_SHA: "d81f4e2aaaa", SOURCEMAP_UPLOAD_TOKEN: "t".repeat(32) }, fetchFn: async () => ({ ok: false, status: 401 }), log });
    expect(r2.failed).toBe(1);
    expect(findMaps(dist)).toEqual([]);
  });
  it("uden dist-mappe sker intet", async () => {
    await expect(run({ dist: join(dist, "findes-ikke"), env: {}, log: quiet })).resolves.toEqual({ uploaded: 0, removed: 0 });
  });
});
