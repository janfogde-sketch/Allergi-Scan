// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { installInputModality } from "./inputModality.js";

let off;
afterEach(() => { off?.(); off = undefined; });

describe("installInputModality", () => {
  it("tastatur og tryk skifter html-attributten, så fokusringen kun vises ved tastatur", () => {
    off = installInputModality();
    const root = document.documentElement;
    document.dispatchEvent(new Event("pointerdown"));
    expect(root.getAttribute("data-modality")).toBe("pointer");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    expect(root.getAttribute("data-modality")).toBe("keyboard");
    document.dispatchEvent(new Event("touchstart"));
    expect(root.getAttribute("data-modality")).toBe("pointer");
  });
  it("almindelige tegn skifter ikke til tastatur, og afinstallation rydder op", () => {
    off = installInputModality();
    document.dispatchEvent(new Event("pointerdown"));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    expect(document.documentElement.getAttribute("data-modality")).toBe("pointer");
    off(); off = undefined;
    expect(document.documentElement.hasAttribute("data-modality")).toBe(false);
  });
});
