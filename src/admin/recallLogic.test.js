import { describe, it, expect } from "vitest";
import { needsReviewCount, filterRecalls, countByStatus, addProduct, removeProduct, searchTermFromRaw, confirmSendText } from "./recallLogic.js";

const R = [
  { id: "1", status: "needs_review", published_at: "2026-09-30T10:00:00Z" },
  { id: "2", status: "archived", published_at: "2026-08-01T10:00:00Z" },
  { id: "3", status: "needs_review", published_at: "2026-10-01T10:00:00Z" },
  { id: "4", status: "ready", published_at: "2026-09-01T10:00:00Z" },
];

describe("recallLogic", () => {
  it("tæller dem, der afventer gennemgang", () => {
    expect(needsReviewCount(R)).toBe(2);
    expect(countByStatus(R)).toEqual({ all: 4, needs_review: 2, ready: 1, archived: 1, cancelled: 0 });
  });
  it("filtrerer på status og sorterer nyeste først", () => {
    expect(filterRecalls(R, "needs_review").map((r) => r.id)).toEqual(["3", "1"]);
    expect(filterRecalls(R, "all").map((r) => r.id)).toEqual(["3", "1", "4", "2"]);
  });
  it("tilføjer et produkt én gang og kan fjerne det igen", () => {
    const p = { id: "p", ean: "5701234567899", name: "Dild", brand: "X", extra: 1 };
    const one = addProduct([], p);
    expect(one).toEqual([{ id: "p", ean: "5701234567899", name: "Dild", brand: "X" }]);
    expect(addProduct(one, p)).toBe(one);
    expect(addProduct(one, { id: "q", name: "uden ean" })).toBe(one);
    expect(removeProduct(one, "5701234567899")).toEqual([]);
  });
  it("laver søgeord af et råt tal", () => {
    expect(searchTermFromRaw("571 287 790 945")).toBe("571287790945");
    expect(searchTermFromRaw(" dild ")).toBe("dild");
  });
  it("bekræftelsen nævner antal brugere og produkter", () => {
    expect(confirmSendText(12, 2)).toBe("12 brugere får en besked. Send tilbagekaldelsen for 2 produkter? Det kan ikke fortrydes.");
    expect(confirmSendText(1, 1)).toMatch(/^1 bruger får en besked\. .* 1 produkt\?/);
    expect(confirmSendText(0, 1)).toMatch(/^Ingen brugere/);
  });
});
