import { describe, it, expect } from "vitest";
import { isSharedList, listShareStatus, joinNames } from "./listShare.js";

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
