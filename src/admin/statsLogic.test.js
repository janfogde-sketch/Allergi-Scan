// @ts-nocheck
import { describe, it, expect } from "vitest";
import { dkDayKey, dkDayStartISO, shiftDayKey, bucketByDkDay, lastDays, fmtNum, niceMax, axisTicks, labelIndexes } from "./statsLogic.js";

describe("dagsregning i dansk tid", () => {
  it("dkDayKey følger dansk dato, også lige efter midnat (sommer- og vintertid)", () => {
    expect(dkDayKey("2026-10-12T22:30:00Z")).toBe("2026-10-13"); // 00:30 CEST
    expect(dkDayKey("2026-10-12T21:59:00Z")).toBe("2026-10-12");
    expect(dkDayKey("2026-12-10T23:30:00Z")).toBe("2026-12-11"); // 00:30 CET
  });
  it("dkDayStartISO er danske midnat i UTC", () => {
    expect(dkDayStartISO("2026-10-13")).toBe("2026-10-12T22:00:00.000Z");
    expect(dkDayStartISO("2026-12-11")).toBe("2026-12-10T23:00:00.000Z");
    expect(dkDayStartISO("2026-10-25")).toBe("2026-10-24T22:00:00.000Z"); // skiftedagen
  });
  it("shiftDayKey tæller kalenderdage", () => {
    expect(shiftDayKey("2026-10-13", -13)).toBe("2026-09-30");
    expect(shiftDayKey("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("bucketByDkDay", () => {
  const now = new Date("2026-10-13T10:00:00Z");
  it("giver præcis N punkter, den sidste er i dag, og dage uden aktivitet er 0", () => {
    const rows = [{ t: "2026-10-13T08:00:00Z" }, { t: "2026-10-12T22:30:00Z" }, { t: "2026-10-10T12:00:00Z" }];
    const b = bucketByDkDay(rows, "t", 14, now);
    expect(b).toHaveLength(14);
    expect(b[13]).toEqual({ date: "2026-10-13", count: 2 }); // 00:30 dansk tid hører til i dag
    expect(b[10]).toEqual({ date: "2026-10-10", count: 1 });
    expect(b[12].count).toBe(0);
    expect(b[0].date).toBe("2026-09-30");
  });
  it("ignorerer rækker uden tid og uden for perioden", () => {
    const b = bucketByDkDay([{ t: null }, { t: "2026-01-01T00:00:00Z" }], "t", 7, now);
    expect(b.reduce((s, d) => s + d.count, 0)).toBe(0);
  });
  it("lastDays og tal", () => {
    expect(lastDays(bucketByDkDay([], "t", 30, now), 7)).toHaveLength(7);
    expect(fmtNum(20182)).toBe("20.182");
    expect(fmtNum(undefined)).toBe("–");
  });
});

describe("diagramskala", () => {
  it("niceMax runder op til 1, 2, 5, 10 …", () => {
    expect([0, 1, 2, 3, 7, 12, 48, 130, 999].map(niceMax)).toEqual([1, 1, 2, 5, 10, 20, 50, 200, 1000]);
  });
  it("axisTicks giver øvre grænse, midte og 0", () => {
    expect(axisTicks(10)).toEqual([10, 5, 0]);
    expect(axisTicks(1)).toEqual([1, 0]);
  });
  it("labelIndexes viser højst n etiketter, altid første og sidste", () => {
    expect(labelIndexes(7, 7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    const l = labelIndexes(30, 4);
    expect(l.length).toBeLessThanOrEqual(4);
    expect(l[0]).toBe(0);
    expect(l[l.length - 1]).toBe(29);
    expect(labelIndexes(0, 4)).toEqual([]);
  });
});
