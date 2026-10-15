// @ts-nocheck
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { handleAuthReturn } from "../api/_authReturnLogic.js";

describe("api/auth-retur — retur fra login i iPhone-appen (S5)", () => {
  it("sender engangskoden videre til appens egen adresse og intet andet", () => {
    expect(handleAuthReturn({ method: "GET", url: "/auth-retur?code=abc&access_token=x&evil=1" }))
      .toEqual({ status: 302, location: "dk.eatsafe.app://auth?code=abc" });
  });
  it("sender fejl fra login videre", () => {
    expect(handleAuthReturn({ method: "GET", url: "/auth-retur?error=access_denied&error_description=nej" }).location)
      .toBe("dk.eatsafe.app://auth?error=access_denied&error_description=nej");
  });
  it("uden kode eller fejl går man til forsiden", () => {
    expect(handleAuthReturn({ method: "GET", url: "/auth-retur" })).toEqual({ status: 302, location: "/" });
    expect(handleAuthReturn({ method: "GET", url: "/auth-retur?access_token=x" }).location).toBe("/");
    expect(handleAuthReturn({ method: "POST", url: "/auth-retur?code=abc" }).location).toBe("/");
  });
  it("dropper alt for lange værdier", () => {
    expect(handleAuthReturn({ method: "GET", url: `/auth-retur?code=${"a".repeat(600)}` }).location).toBe("/");
  });
});

describe("apple-app-site-association", () => {
  it("binder kun /auth-retur til appen dk.eatsafe.app", () => {
    const aasa = JSON.parse(readFileSync(new URL("../public/.well-known/apple-app-site-association", import.meta.url), "utf8"));
    const [d] = aasa.applinks.details;
    expect(aasa.applinks.details).toHaveLength(1);
    expect(d.appIDs).toHaveLength(1);
    expect(d.appIDs[0]).toMatch(/^[A-Z0-9]+\.dk\.eatsafe\.app$/);
    expect(d.components.map((c) => c["/"])).toEqual(["/auth-retur"]);
  });
  it("vercel.json sender /auth-retur til serveren og giver filen JSON-typen", () => {
    const v = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
    const i = v.rewrites.findIndex((r) => r.source === "/auth-retur");
    expect(v.rewrites[i].destination).toBe("/api/auth-retur");
    expect(i).toBeLessThan(v.rewrites.findIndex((r) => r.source === "/(.*)"));
    const h = v.headers.find((x) => x.source === "/.well-known/apple-app-site-association");
    expect(h.headers.find((x) => x.key === "Content-Type").value).toBe("application/json");
  });
});
