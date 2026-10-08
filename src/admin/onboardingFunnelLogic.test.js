import { describe, it, expect } from "vitest";
import { summarizeFunnel } from "./onboardingFunnelLogic.js";

describe("summarizeFunnel", () => {
  it("fylder alle fem trin ud og regner procent", () => {
    const r = summarizeFunnel({ total: 10, completed: 8, steps: [{ step: 3, stuck: 2, stuck_over_24h: 1 }] });
    expect(r.steps).toHaveLength(5);
    expect(r.steps[2]).toMatchObject({ step: 3, stuck: 2, stuckOld: 1, pct: 20 });
    expect(r.steps[0].stuck).toBe(0);
    expect(r.completedPct).toBe(80);
  });
  it("tåler tomme data", () => {
    const r = summarizeFunnel(null);
    expect(r.total).toBe(0);
    expect(r.completedPct).toBe(0);
  });
});
