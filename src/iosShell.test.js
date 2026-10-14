// Tjekker, at iPhone-rammen (Capacitor) peger på samme app som Android og hjemmesiden.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const cfg = JSON.parse(read("../capacitor.config.json"));
const twa = JSON.parse(read("../android/twa-manifest.json"));

describe("iPhone-ramme (Capacitor)", () => {
  it("bruger samme app-id som Android", () => {
    expect(cfg.appId).toBe(twa.packageId);
  });
  it("åbner www.eatsafe.dk som butiksudgave", () => {
    const u = new URL(cfg.server.url);
    expect(u.origin).toBe("https://www.eatsafe.dk");
    expect(u.searchParams.get("src")).toBe("store");
    expect(cfg.server.cleartext).toBe(false);
  });
  it("tillader kun egen adresse i selve appen", () => {
    expect(cfg.server.allowNavigation).toEqual(["www.eatsafe.dk"]);
  });
  it("har kameratekst på dansk i iOS-filerne", () => {
    expect(read("../ios/App/App/Info.plist")).toMatch(/NSCameraUsageDescription[\s\S]*?scanne stregkoder/);
  });
});

describe("iPhone-ramme: retur fra login", () => {
  it("har URL-skemaet dk.eatsafe.app i iOS-filerne", () => {
    expect(read("../ios/App/App/Info.plist")).toMatch(/CFBundleURLSchemes[\s\S]*?<string>dk\.eatsafe\.app<\/string>/);
  });
});

describe("iPhone-ramme: Apples push", () => {
  it("giver push-adressen videre til Capacitor", () => {
    const d = read("../ios/App/App/AppDelegate.swift");
    expect(d).toContain("capacitorDidRegisterForRemoteNotifications");
    expect(d).toContain("capacitorDidFailToRegisterForRemoteNotifications");
  });
  it("viser beskeder også med appen åben", () => {
    expect(cfg.plugins.PushNotifications.presentationOptions).toEqual(["badge", "sound", "alert"]);
  });
});

describe("iPhone-ramme: Fortsæt med Apple", () => {
  it("bruger samme bundle-id som appen", () => {
    expect(read("./nativeApple.js")).toContain(`BUNDLE_ID = "${cfg.appId}"`);
  });
});
