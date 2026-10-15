import { describe, it, expect } from "vitest";
import { costDkk, totals, byMonth, byDay, byFunction, currentMonthRows } from "./aiUsageLogic.js";

const rows = [
  { day: "2026-10-07", function_name: "ocr", calls: 10, input_tokens: 1_000_000, output_tokens: 200_000 },
  { day: "2026-10-06", function_name: "allergens", calls: 5, input_tokens: 500_000, output_tokens: 100_000 },
  { day: "2026-09-30", function_name: "ocr", calls: 2, input_tokens: 100_000, output_tokens: 0 },
];

describe("aiUsageLogic", () => {
  it("regner pris: 1 mio. ind og 1 mio. ud = 6 dollar", () => {
    expect(costDkk(1e6, 1e6)).toBeCloseTo(6 * 6.9, 5);
  });
  it("lægger sammen", () => {
    const t = totals(rows);
    expect(t.calls).toBe(17);
    expect(t.input).toBe(1_600_000);
    expect(t.output).toBe(300_000);
  });
  it("grupperer pr. måned og dag, nyeste først", () => {
    expect(byMonth(rows).map(m => m.key)).toEqual(["2026-10", "2026-09"]);
    expect(byDay(rows)[0].key).toBe("2026-10-07");
    expect(byMonth(rows)[0].calls).toBe(15);
  });
  it("pr. funktion sorteret efter pris", () => {
    expect(byFunction(rows)[0].key).toBe("ocr");
  });
  it("finder indeværende måned", () => {
    expect(currentMonthRows(rows, "2026-10-07")).toHaveLength(2);
  });
  it("tåler tom liste", () => {
    expect(totals([])).toEqual({ calls: 0, input: 0, output: 0, dkk: 0, unpricedCalls: 0 });
  });
});

import {
  priceFor, periodRange, comparisonRanges, pctChange, dailySeries, trackingStart, findAnomalies, budgetStatus, functionShares, addDays, todayKey,
  formatTokens, formatPct, dayLabelShort, rowsIn,
} from "./aiUsageLogic.js";

const row = (day, fn, calls, input, output, model = "claude-haiku-4-5") => ({ day, function_name: fn, model, calls, input_tokens: input, output_tokens: output });
// De rigtige oktobertal (15. okt. 2026), som kontrolleres mod de kendte beløb: Kategorisering 41,37 kr., Allergen-tjek 6,06 kr., i alt 47,43 kr.
const OKT = [
  row("2026-10-08", "classify-categories", 582, 1514471, 896321), row("2026-10-08", "allergens", 20, 11453, 3340),
  row("2026-10-13", "allergens", 201, 115393, 33567), row("2026-10-14", "allergens", 201, 116655, 33567), row("2026-10-15", "allergens", 200, 114747, 33400),
];

describe("priser og totaler", () => {
  it("oktobertallene giver 41,37 kr. og 6,06 kr. og 47,43 kr. i alt", () => {
    const f = functionShares(OKT);
    expect(f[0].key).toBe("classify-categories");
    expect(f[0].dkk).toBeCloseTo(41.37, 2);
    expect(f[1].dkk).toBeCloseTo(6.06, 2);
    expect(totals(OKT).dkk).toBeCloseTo(47.43, 2);
    expect(f[0].share).toBeCloseTo(0.872, 3);
    expect(f.reduce((s, x) => s + x.dkk, 0)).toBeCloseTo(totals(OKT).dkk, 8); // fordelingen stemmer med totalen
  });
  it("pris pr. model; en ukendt model gættes ikke, og kaldene tælles som uden pris", () => {
    expect(priceFor("claude-haiku-4-5-20251001", "2026-10-15").label).toBe("Claude Haiku 4.5");
    expect(priceFor("claude-ukendt-9")).toBeNull();
    const t = totals([row("2026-10-15", "x", 3, 1000, 1000, "claude-ukendt-9"), row("2026-10-15", "allergens", 1, 1e6, 0)]);
    expect(t.unpricedCalls).toBe(3);
    expect(t.dkk).toBeCloseTo(6.9, 5); // kun den kendte række er med
  });
  it("månedstotal stemmer med summen af dagene", () => {
    const sum = byDay(OKT).reduce((s, d) => s + d.dkk, 0);
    expect(sum).toBeCloseTo(totals(OKT).dkk, 8);
    expect(byMonth(OKT)[0].dkk).toBeCloseTo(sum, 8);
  });
});

describe("perioder i dansk tid", () => {
  const TODAY = "2026-10-15";
  it("beregner intervallerne", () => {
    expect(periodRange("month", TODAY)).toEqual({ from: "2026-10-01", to: TODAY });
    expect(periodRange("today", TODAY)).toEqual({ from: TODAY, to: TODAY });
    expect(periodRange("week", TODAY)).toEqual({ from: "2026-10-09", to: TODAY });
    expect(periodRange("days30", TODAY)).toEqual({ from: "2026-09-16", to: TODAY });
    expect(periodRange("lastMonth", TODAY)).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(periodRange("lastMonth", "2026-03-10")).toEqual({ from: "2026-02-01", to: "2026-02-28" });
    expect(periodRange("custom", TODAY, { from: "2026-10-05", to: "2026-10-02" })).toBeNull();
    expect(periodRange("custom", TODAY, { from: "2026-10-02", to: "2026-10-05" })).toEqual({ from: "2026-10-02", to: "2026-10-05" });
  });
  it("dagens dato følger dansk tid, ikke UTC (kl. 23:30 UTC er næste dag i Danmark)", () => {
    expect(todayKey(new Date("2026-10-15T23:30:00Z"))).toBe("2026-10-16");
    expect(todayKey(new Date("2026-10-15T21:30:00Z"))).toBe("2026-10-15");
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
  });
});

describe("sammenligning", () => {
  it("sammenligner kun afsluttede døgn og kun, hvis forrige periode er registreret", () => {
    expect(comparisonRanges("today", { from: "2026-10-15", to: "2026-10-15" }, "2026-10-15", OKT)).toBeNull();
    // Registreringen begyndte 8. okt., så forrige måned og de forrige 7 dage (2.–8.) er ikke helt registreret
    expect(comparisonRanges("month", periodRange("month", "2026-10-15"), "2026-10-15", OKT)).toBeNull();
    expect(comparisonRanges("week", periodRange("week", "2026-10-15"), "2026-10-15", OKT)).toBeNull();
    const more = [...OKT, row("2026-09-01", "allergens", 10, 1000, 1000)];
    const c = comparisonRanges("month", periodRange("month", "2026-10-15"), "2026-10-15", more);
    expect(c.current).toEqual({ from: "2026-10-01", to: "2026-10-14" }); // i dag er ikke afsluttet
    expect(c.previous).toEqual({ from: "2026-09-01", to: "2026-09-14" });
  });
  it("procentændring er null ved nul i sammenligningsperioden", () => {
    expect(pctChange(10, 0)).toBeNull();
    expect(pctChange(15, 10)).toBeCloseTo(0.5, 5);
    expect(formatPct(null)).toBe("–");
  });
});

describe("dagsserie og usædvanlige dage", () => {
  it("viser alle dage og skelner ikke registreret, intet forbrug og forbrug", () => {
    expect(trackingStart(OKT)).toBe("2026-10-08");
    const s = dailySeries(OKT, { from: "2026-10-06", to: "2026-10-10" });
    expect(s.map((d) => d.state)).toEqual(["none", "none", "data", "zero", "zero"]);
    expect(s[2].calls).toBe(602);
    expect(s[0].dkk).toBe(0);
  });
  it("kræver mindst 7 dage med data, før noget mærkes", () => {
    const a = findAnomalies(OKT);
    expect(a.enough).toBe(false);
    expect(a.flagged).toEqual([]);
  });
  it("mærker en dag på mindst 3 × medianen, med årsag og største funktion, og gætter ikke", () => {
    const base = Array.from({ length: 8 }, (_, i) => row(`2026-10-0${i + 1}`, "allergens", 200, 115000, 33500));
    const spike = [...base, row("2026-10-09", "classify-categories", 600, 1500000, 900000), row("2026-10-09", "allergens", 200, 115000, 33500)];
    const a = findAnomalies(spike);
    expect(a.enough).toBe(true);
    expect(a.flagged.map((f) => f.day)).toEqual(["2026-10-09"]);
    expect(a.flagged[0].topFunction).toBe("classify-categories");
    expect(a.flagged[0].internalTop).toBe(true);
    expect(a.flagged[0].cause).toBe("begge");
    // Samme omkostning ved samme antal kald: ingen mærkning
    expect(findAnomalies(base).flagged).toEqual([]);
  });
});

describe("budget og formattering", () => {
  it("status følger advarselsgrænserne, og uden budget er svaret null", () => {
    expect(budgetStatus(null, 10)).toBeNull();
    const b = { monthly_dkk: 500, warn_1: 80, warn_2: 100 };
    expect(budgetStatus(b, 47.43).level).toBe("ok");
    expect(budgetStatus(b, 47.43).left).toBeCloseTo(452.57, 2);
    expect(budgetStatus(b, 400).level).toBe("warn");
    expect(budgetStatus(b, 500).level).toBe("over");
    expect(budgetStatus({ monthly_dkk: "250", warn_1: 50, warn_2: 90 }, 130).level).toBe("warn");
  });
  it("kort formatering af tokens og datoer", () => {
    expect(formatTokens(1514471)).toBe("1,51 mio.");
    expect(formatTokens(820)).toBe("820");
    expect(dayLabelShort("2026-10-08")).toBe("8. okt.");
    expect(rowsIn(OKT, { from: "2026-10-13", to: "2026-10-14" })).toHaveLength(2);
  });
});
