import { describe, it, expect } from "vitest";
import { jwtExpiryMs } from "./useAdminAuth.js";

const b64 = (o) => btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

describe("jwtExpiryMs", () => {
  it("læser exp fra payload i millisekunder", () => {
    expect(jwtExpiryMs(`h.${b64({ exp: 1700000000 })}.s`)).toBe(1700000000000);
  });
  it("giver null for ulæselige eller exp-løse tokens", () => {
    expect(jwtExpiryMs("ikke-et-token")).toBeNull();
    expect(jwtExpiryMs(`h.${b64({ sub: "x" })}.s`)).toBeNull();
  });
});
