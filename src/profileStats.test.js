// @ts-nocheck
import { describe, it, expect } from "vitest";
import { computeScanStats } from "./profileStats.js";

const ctx = (o = {}) => ({ user: { name: "Anna" }, family: [], allergens: ["maelkeallergi"], customAllerg: [], selectedENumbers: [], activeProfiles: ["me"], ...o });
const scan = (flags, o = {}) => ({ found_via: "scan", result: "safe", products: { allergen_flags: flags, ingredients_text: "Sukker, kakao" }, flags_triggered: flags, ...o });

describe("computeScanStats", () => {
  it("tæller hver scanning én gang, og advarsel og konfliktfri udelukker hinanden", () => {
    const h = [scan({ maelkeallergi: "yes" }), scan({ maelkeallergi: "traces" }), scan({ maelkeallergi: "no" }), scan({ maelkeallergi: "no" })];
    expect(computeScanStats(h, ctx())).toMatchObject({ total: 4, withWarning: 2, withoutConflict: 2, truncated: false });
  });
  it("opslag via søgning er ikke scanninger, og et produkt, der ikke blev fundet, tæller kun i alt", () => {
    const h = [scan({ maelkeallergi: "no" }), scan({ maelkeallergi: "no" }, { found_via: "search" }), { found_via: "scan", result: "not_found" }];
    expect(computeScanStats(h, ctx())).toMatchObject({ total: 2, withWarning: 0, withoutConflict: 1 });
  });
  it("ukendt data, historiske poster og scanninger uden valgte hensyn tæller aldrig som konfliktfri", () => {
    const unknown = scan({ maelkeallergi: "unknown" });
    const historical = { found_via: "scan", result: "safe", products: null, flags_triggered: { maelkeallergi: "no" } };
    const none = scan({ maelkeallergi: "no" });
    const s = computeScanStats([unknown, historical], ctx());
    expect(s.withoutConflict).toBe(0);
    expect(computeScanStats([none], ctx({ allergens: [] })).withoutConflict).toBe(0);
  });
  it("markerer, at tallene kun gælder de seneste 50", () => {
    const h = Array.from({ length: 50 }, () => scan({ maelkeallergi: "no" }));
    expect(computeScanStats(h, ctx())).toMatchObject({ total: 50, truncated: true });
    expect(computeScanStats([], ctx())).toEqual({ total: 0, withWarning: 0, withoutConflict: 0, truncated: false });
  });
});
