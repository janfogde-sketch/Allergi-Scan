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
    expect(totals([])).toEqual({ calls: 0, input: 0, output: 0, dkk: 0 });
  });
});
