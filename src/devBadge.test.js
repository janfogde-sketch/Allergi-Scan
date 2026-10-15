import { describe, it, expect } from "vitest";
import { isDevHost, installDevBadge } from "./devBadge.js";

describe("devBadge", () => {
  it("kender kun testadressen", () => {
    expect(isDevHost("dev.eatsafe.dk")).toBe(true);
    expect(isDevHost("www.eatsafe.dk")).toBe(false);
    expect(isDevHost("eatsafe.dk")).toBe(false);
    expect(isDevHost("dev.eatsafe.dk.evil.com")).toBe(false);
    expect(isDevHost(undefined)).toBe(false);
  });
  it("tilføjer ikke mærket på den rigtige app", () => {
    const win = { location: { hostname: "www.eatsafe.dk" }, document: {} };
    expect(installDevBadge(win)).toBe(null);
  });
  it("tilføjer mærket én gang på testadressen", () => {
    const added = [];
    const doc = {
      getElementById: () => (added.length ? added[0] : null),
      createElement: () => ({ style: {}, setAttribute() {} }),
      body: { appendChild: (e) => added.push(e) },
    };
    const win = { location: { hostname: "dev.eatsafe.dk" }, document: doc };
    expect(installDevBadge(win)).not.toBe(null);
    expect(installDevBadge(win)).toBe(null);
    expect(added[0].textContent).toBe("TEST");
  });
});
