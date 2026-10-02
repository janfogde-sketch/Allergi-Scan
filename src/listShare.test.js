import { describe, it, expect } from "vitest";
import { isSharedList, listShareStatus, joinNames, parseListCode, listLinkUrl, listShareText } from "./listShare.js";

describe("listShare", () => {
  const me = "u1";
  it("familieliste ejet af mig er delt med familien", () => {
    const l = { type: "family", owner_id: me, name: "Ugens indkøb" };
    expect(isSharedList(l, me)).toBe(true);
    expect(listShareStatus(l, me)).toBe("Delt med hele familien");
  });
  it("liste ejet af en anden er delt med mig, uanset navn", () => {
    const l = { type: "personal", owner_id: "u2", name: "(delt) Føtex" };
    expect(isSharedList(l, me)).toBe(true);
    expect(listShareStatus(l, me)).toBe("Delt med dig");
  });
  it("egen personlig liste er ikke delt", () => {
    const l = { type: "personal", owner_id: me, name: "Sommerhus" };
    expect(isSharedList(l, me)).toBe(false);
    expect(listShareStatus(l, me)).toBe("Kun dig");
  });
  it("andres liste viser ejerens fornavn", () => {
    expect(listShareStatus({ type: "personal", owner_id: "u2", owner_name: "Anna" }, me)).toBe("Delt af Anna");
  });
  it("egen liste delt med udvalgte viser deres fornavne", () => {
    const l = { type: "personal", owner_id: me, shared_with: ["Anna", "Ben"] };
    expect(isSharedList(l, me)).toBe(true);
    expect(listShareStatus(l, me)).toBe("Delt med Anna og Ben");
  });
  it("mange personer forkortes", () => {
    expect(joinNames(["A", "B", "C"])).toBe("A, B og C");
    expect(joinNames(["A", "B", "C", "D", "E"])).toBe("A, B og 3 andre");
    expect(joinNames([])).toBe("");
  });
  it("mangler liste", () => {
    expect(isSharedList(null, me)).toBe(false);
    expect(listShareStatus(undefined, me)).toBe("");
  });
});

describe("listelink", () => {
  it("læser kode fra nyt og gammelt link og rå kode", () => {
    expect(parseListCode("https://eatsafe.dk/list/abc234")).toBe("ABC234");
    expect(parseListCode("https://eatsafe.dk/?join-list=XYZ789")).toBe("XYZ789");
    expect(parseListCode("  k7m2pq ")).toBe("K7M2PQ");
  });
  it("bygger link og forklarende tekst", () => {
    expect(listLinkUrl("ABC234")).toBe("https://eatsafe.dk/list/ABC234");
    expect(listShareText("Weekend")).toContain('"Weekend"');
    expect(listShareText("Weekend")).toContain("Du bestemmer selv");
  });
});
