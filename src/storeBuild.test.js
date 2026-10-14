import { describe, it, expect, afterEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { isStoreBuild } from "./storeBuild.js";
import AppHeader from "./AppHeader.jsx";

const mem = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
const setWindow = ({ search = "", referrer = "", Capacitor, storage = mem() } = {}) => {
  globalThis.window = { location: { search }, document: { referrer }, localStorage: storage, Capacitor };
};
const header = () => renderToStaticMarkup(React.createElement(AppHeader, { onFeedback() {}, onMenu() {} }));

afterEach(() => { delete globalThis.window; });

describe("isStoreBuild", () => {
  it("er falsk i browser/PWA, og BETA vises", () => {
    setWindow();
    expect(isStoreBuild()).toBe(false);
    expect(header()).toContain("BETA");
  });
  it("genkender Android-appen via referrer og skjuler BETA", () => {
    setWindow({ referrer: "android-app://dk.eatsafe.app/" });
    expect(isStoreBuild()).toBe(true);
    expect(header()).not.toContain("BETA");
  });
  it("genkender startadressen ?src=store og Capacitor", () => {
    setWindow({ search: "?src=store" });
    expect(isStoreBuild()).toBe(true);
    setWindow({ Capacitor: { isNativePlatform: () => true } });
    expect(isStoreBuild()).toBe(true);
  });
  it("husker valget efter navigation (uden referrer og query)", () => {
    const storage = mem();
    setWindow({ search: "?src=store", storage });
    isStoreBuild();
    setWindow({ storage });
    expect(isStoreBuild()).toBe(true);
  });
  it("en anden app som referrer gør ikke udgaven til butiksudgave", () => {
    setWindow({ referrer: "android-app://com.andet.app" });
    expect(isStoreBuild()).toBe(false);
  });
});
