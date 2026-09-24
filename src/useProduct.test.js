// @vitest-environment jsdom
// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useProduct.test.js
// runLookupProduct is the entire scan/allergen-match pipeline — the most
// safety-critical code path in the app — and had zero test coverage before
// this file (flagged in the rescue-audit, 16. sept. 2026). These tests lock
// down the three behaviors most likely to silently regress: cache-hits
// staying instant, the custom-allergen escalation added this session, and
// the overlapping-scan race guard.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from "vitest";
import { runLookupProduct, buildDemoScanResult } from "./useProduct.js";
import { SCREENS } from "./constants.jsx";

function jsonResponse(body, ok = true) {
  return { ok, status: ok ? 200 : 500, text: async () => JSON.stringify(body) };
}

function makeCtx(overrides = {}) {
  return {
    accessToken: "tok", activeIds: [], activeCustom: [], activeENumbers: [],
    family: [], activeProfiles: ["me"],
    productCacheRef: { current: {} },
    scanTokenRef: { current: 0 },
    saveHistoryEntry: vi.fn().mockResolvedValue(undefined),
    loadAlternatives: vi.fn(),
    clearAlternatives: vi.fn(),
    setScanResult: vi.fn(),
    setScreen: vi.fn(),
    setLoading: vi.fn(),
    setScanError: vi.fn(),
    setShowIng: vi.fn(),
    setHistory: vi.fn(),
    setNotFoundEan: vi.fn(),
    setNotFoundStep: vi.fn(),
    setOcrText: vi.fn(),
    setProposedName: vi.fn(),
    setProposedFlags: vi.fn(),
    setProductImagePreview: vi.fn(),
    setProductImageBase64: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  global.fetch = vi.fn();
});

describe("runLookupProduct — cache-hit path", () => {
  it("returns the cached result instantly (no artificial wait)", async () => {
    const cached = { code: "123", name: "Test", ingredients: "vand, salt", status: "safe", flags: [], category: "snack" };
    const ctx = makeCtx({ productCacheRef: { current: { "123": cached } } });

    const started = Date.now();
    await runLookupProduct("123", ctx);
    const elapsed = Date.now() - started;

    expect(elapsed).toBeLessThan(200); // ikke de 450ms der gælder for netværks-stier
    expect(ctx.setScanResult).toHaveBeenCalledWith(expect.objectContaining({ code: "123", status: "safe" }));
    expect(ctx.setScreen).toHaveBeenCalledWith(SCREENS.RESULT);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("escalates to danger when a custom allergen is found in the cached ingredients", async () => {
    const cached = { code: "123", name: "Test", ingredients: "vand, fructose, salt", status: "safe", flags: [], category: "snack" };
    const ctx = makeCtx({
      productCacheRef: { current: { "123": cached } },
      activeCustom: ["Fructose"],
    });

    await runLookupProduct("123", ctx);

    const result = ctx.setScanResult.mock.calls[0][0];
    expect(result.status).toBe("danger");
    expect(result.customAllergenMatches).toEqual(["Fructose"]);
    expect(result.flags[0]).toMatchObject({ custom: true });
  });

  it("does not escalate when the custom allergen is not present in the ingredients", async () => {
    const cached = { code: "123", name: "Test", ingredients: "vand, salt", status: "safe", flags: [], category: "snack" };
    const ctx = makeCtx({
      productCacheRef: { current: { "123": cached } },
      activeCustom: ["Fructose"],
    });

    await runLookupProduct("123", ctx);

    const result = ctx.setScanResult.mock.calls[0][0];
    expect(result.status).toBe("safe");
    expect(result.customAllergenMatches).toBeUndefined();
  });
});

describe("runLookupProduct — network not-found path", () => {
  it("routes to the NOTFOUND screen and resets the submission form", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ found: false }));
    const ctx = makeCtx();

    await runLookupProduct("999", ctx);

    expect(ctx.setNotFoundEan).toHaveBeenCalledWith("999");
    expect(ctx.setScreen).toHaveBeenCalledWith(SCREENS.NOTFOUND);
    expect(ctx.setNotFoundStep).toHaveBeenCalledWith(1);
    expect(ctx.setLoading).toHaveBeenLastCalledWith(false);
  }, 10000);
});

describe("runLookupProduct — network found path", () => {
  // Regressionstest for et fund 24. sept. 2026 (bruger-rapport): scan:result-
  // og saveHistoryEntry-kaldene refererede status/matchedDanger/matchedWarning/
  // flags som løse variabler der kun eksisterer INDE i
  // buildScanResultFromProductData, ikke i runLookupProduct selv — kastede en
  // ReferenceError på ALLE ikke-cachede, fundne scanninger (kun "status"
  // undslap stille via window.status), så resultatet aldrig blev vist —
  // kun et cache-hit ved et efterfølgende gen-scan af samme EAN reddede det.
  // Denne sti havde ingen coverage overhovedet før dette fund.
  it("shows the result screen for a freshly fetched (non-cached) product", async () => {
    global.fetch.mockResolvedValue(jsonResponse({
      found: true,
      product: { id: "p1", name: "Chips", brand: "Kims", allergen_flags: { laktose: "yes" }, ingredients_text: "mælk, salt" },
    }));
    const ctx = makeCtx({ activeIds: ["laktose"] });

    await runLookupProduct("123456", ctx);

    expect(ctx.setScreen).toHaveBeenCalledWith(SCREENS.RESULT);
    expect(ctx.setScanError).not.toHaveBeenCalledWith(expect.stringContaining("Der opstod en fejl"));
    const result = ctx.setScanResult.mock.calls.at(-1)[0];
    expect(result.status).toBe("danger");
    expect(result.matchedDanger).toContain("laktose");
    expect(ctx.saveHistoryEntry).toHaveBeenCalledWith("123456", "p1", "danger", { laktose: "yes" }, ["me"]);
  }, 10000);
});

describe("buildDemoScanResult — 'Prøv en demo-scanning' (Fase 7b.2)", () => {
  // Demo-produktet indeholder laktose+nødder (yes) og soja (traces) — bruges
  // til at bekræfte at demoen kører gennem den RIGTIGE beregningslogik
  // (samme funktion som et ægte scan), i stedet for en separat, potentielt
  // afvigende kopi.
  it("marks the result as isDemo and matches the user's own active allergens (danger)", () => {
    const result = buildDemoScanResult({ activeIds: ["laktose"], activeCustom: [], activeENumbers: [], family: [], activeProfiles: ["me"] });

    expect(result.isDemo).toBe(true);
    expect(result.status).toBe("danger");
    expect(result.matchedDanger).toContain("laktose");
  });

  it("returns safe when none of the user's active allergens match", () => {
    const result = buildDemoScanResult({ activeIds: ["fisk"], activeCustom: [], activeENumbers: [], family: [], activeProfiles: ["me"] });

    expect(result.status).toBe("safe");
    expect(result.matchedDanger).toEqual([]);
  });

  it("still escalates on a custom allergen match, same as a real scan", () => {
    const result = buildDemoScanResult({ activeIds: [], activeCustom: ["Vanillin"], activeENumbers: [], family: [], activeProfiles: ["me"] });

    expect(result.status).toBe("danger");
    expect(result.customAllergenMatches).toEqual(["Vanillin"]);
  });
});

describe("runLookupProduct — overlapping-scan race guard", () => {
  it("does not let a stale, slower call overwrite a newer, faster call's result", async () => {
    const ctx = makeCtx();

    // Første kald: hænger til vi selv løser det op, EFTER det andet kald er færdigt.
    let resolveSlow;
    const slow = new Promise(r => { resolveSlow = r; });
    global.fetch.mockImplementationOnce(() => slow);

    const firstCall = runLookupProduct("111", ctx);
    // Andet kald starter mens det første stadig venter — gør det første forældet.
    global.fetch.mockResolvedValueOnce(jsonResponse({ found: false }));
    await runLookupProduct("222", ctx);

    const callsBeforeSlowResolves = ctx.setScreen.mock.calls.length;
    expect(ctx.setScreen).toHaveBeenLastCalledWith(SCREENS.NOTFOUND);

    // Nu løses det første (forældede) kald op — det må IKKE nå at kalde setScreen igen.
    resolveSlow(jsonResponse({ found: false }));
    await firstCall;

    expect(ctx.setScreen.mock.calls.length).toBe(callsBeforeSlowResolves);
  }, 10000);
});
