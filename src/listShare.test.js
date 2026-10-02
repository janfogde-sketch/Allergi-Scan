import { describe, it, expect } from "vitest";
import { isSharedList, listShareStatus } from "./listShare.js";

describe("listShare", () => {
  const me = "u1";
  it("familieliste ejet af mig er delt med familien", () => {
    const l = { type: "family", owner_id: me, name: "Ugens indkøb" };
    expect(isSharedList(l, me)).toBe(true);
    expect(listShareStatus(l, me)).toBe("Delt med familien");
  });
  it("liste ejet af en anden er delt med mig, uanset navn", () => {
    const l = { type: "personal", owner_id: "u2", name: "(delt) Føtex" };
    expect(isSharedList(l, me)).toBe(true);
    expect(listShareStatus(l, me)).toBe("Delt med dig");
  });
  it("egen personlig liste er ikke delt", () => {
    const l = { type: "personal", owner_id: me, name: "Sommerhus" };
    expect(isSharedList(l, me)).toBe(false);
    expect(listShareStatus(l, me)).toBe("Din liste");
  });
  it("mangler liste", () => {
    expect(isSharedList(null, me)).toBe(false);
    expect(listShareStatus(undefined, me)).toBe("");
  });
});
