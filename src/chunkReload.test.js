// @ts-nocheck
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { isChunkLoadError, reloadOnceForChunkError } from "./chunkReload.js";

describe("chunkReload", () => {
  beforeEach(() => sessionStorage.clear());

  it("kender modulfejl", () => {
    expect(isChunkLoadError(new TypeError("Failed to fetch dynamically imported module: https://x/a.js"))).toBe(true);
    expect(isChunkLoadError(new Error("Importing a module script failed."))).toBe(true);
    expect(isChunkLoadError(new Error("Noget andet"))).toBe(false);
  });

  it("genindlæser kun én gang", () => {
    const reload = vi.fn();
    const err = new Error("Failed to fetch dynamically imported module");
    expect(reloadOnceForChunkError(err, reload)).toBe(true);
    expect(reloadOnceForChunkError(err, reload)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("ignorerer andre fejl", () => {
    const reload = vi.fn();
    expect(reloadOnceForChunkError(new Error("x"), reload)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
