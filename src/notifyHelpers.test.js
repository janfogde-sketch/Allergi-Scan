// @ts-nocheck
import { describe, it, expect } from "vitest";
import { formatDanishDeadline, summarizeItems } from "../supabase/functions/_shared/notifyHelpers.js";

describe("formatDanishDeadline", () => {
  const now = new Date("2026-09-30T12:00:00Z"); // 14:00 dansk sommertid
  it("i dag / i morgen / dato — i dansk tid", () => {
    expect(formatDanishDeadline("2026-09-30T16:35:00Z", now)).toBe("i dag kl. 18:35");
    expect(formatDanishDeadline("2026-10-01T07:10:00Z", now)).toBe("i morgen kl. 09:10");
    expect(formatDanishDeadline("2026-10-03T07:10:00Z", now)).toMatch(/^3\. okt\.? kl\. 09:10$/);
  });
  it("bruger dansk dato omkring midnat (22:30 UTC = næste dag kl. 00:30)", () => {
    expect(formatDanishDeadline("2026-09-30T22:30:00Z", now)).toBe("i morgen kl. 00:30");
  });
});

describe("summarizeItems", () => {
  it("formulerer 1, 2, 3 og mange varer", () => {
    expect(summarizeItems(["Mælk"])).toBe("Mælk");
    expect(summarizeItems(["Mælk", "Æg"])).toBe("Mælk og Æg");
    expect(summarizeItems(["Mælk", "Æg", "Brød"])).toBe("Mælk, Æg og Brød");
    expect(summarizeItems(["a", "b", "c", "d", "e", "f", "g"])).toBe("a, b, c, d, e og 2 flere");
  });
  it("ignorerer tomme navne", () => {
    expect(summarizeItems(["", null, " Smør "])).toBe("Smør");
    expect(summarizeItems([])).toBe("");
  });
});
