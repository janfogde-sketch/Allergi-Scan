import { describe, it, expect } from "vitest";
import { summarizeStats, trendEnough, pctText, ratio } from "./onboardingFunnelLogic.js";

const stats = (o = {}) => ({ total: 12, completed: 11, in_progress: 0, possible_dropout: 1, not_started: 0, unconfirmed: 0, test_accounts: 0, include_test: false, first_account: "2026-09-01T00:00:00Z",
  steps: [{ step: 3, latest: 1, inactive: 1 }], funnel_users: 4, funnel: [{ step: 1, reached: 4, continued: 3 }, { step: 4, reached: 2, continued: 2 }], daily: [], ...o });

describe("summarizeStats", () => {
  it("fylder alle fem trin og regner andele af kohorten; statusserne stemmer med totalen", () => {
    const r = summarizeStats(stats());
    expect(r.steps.map((s) => s.step)).toEqual([1, 2, 3, 4, 5]);
    expect(r.steps[2]).toMatchObject({ latest: 1, inactive: 1 });
    expect(r.steps[2].pct).toBeCloseTo(1 / 12);
    expect(r.steps[0].latest).toBe(0);
    expect(r.completedPct).toBeCloseTo(11 / 12);
    expect(r.reconciled).toBe(true);
    expect(r.small).toBe(true);
    expect(r.steps[3].optional).toBe(true);
    expect(r.steps[2].optional).toBe(false);
  });
  it("opdager, når statusserne ikke stemmer med totalen", () => {
    expect(summarizeStats(stats({ possible_dropout: 0 })).reconciled).toBe(false);
  });
  it("tragten bruger kun registrerede overgange og skelner 0 fra ingen data", () => {
    const r = summarizeStats(stats());
    expect(r.funnel[0]).toMatchObject({ reached: 4, continued: 3 });
    expect(r.funnel[0].continuedPct).toBeCloseTo(0.75);
    expect(r.funnel[1]).toMatchObject({ reached: 0, continued: 0, continuedPct: null }); // ingen nåede trinnet: aldrig 0 %
    expect(r.funnel[3].optional).toBe(true);
    expect(summarizeStats(stats({ funnel_users: 0 })).funnelUsers).toBe(0);
  });
  it("tåler manglende data og division med nul", () => {
    expect(summarizeStats(null)).toBeNull();
    const r = summarizeStats({ total: 0 });
    expect(r.total).toBe(0);
    expect(r.completedPct).toBeNull();
    expect(ratio(0, 0)).toBeNull();
    expect(pctText(null)).toBe("–");
  });
  it("procent med én decimal kun når den ikke er hel", () => {
    expect(pctText(11 / 12)).toBe("91,7 %");
    expect(pctText(1)).toBe("100 %");
    expect(pctText(0)).toBe("0 %");
    expect(pctText(0.5)).toBe("50 %");
  });
  it("udviklingen vises kun med nok konti og dage", () => {
    const days = (n) => Array.from({ length: n }, (_, i) => ({ date: `2026-10-${String(i + 1).padStart(2, "0")}` }));
    expect(trendEnough({ total: 12, daily: days(20) })).toBe(false);
    expect(trendEnough({ total: 40, daily: days(5) })).toBe(false);
    expect(trendEnough({ total: 40, daily: days(14) })).toBe(true);
  });
});
