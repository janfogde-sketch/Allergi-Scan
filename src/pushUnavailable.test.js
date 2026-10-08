// F1-6: forklaring, når push ikke kan bruges (iPhone i Safari uden installeret app).
import { describe, it, expect } from "vitest";
import { isIosBrowserTab, pushUnavailableText } from "./usePwaInstall.js";

const win = standalone => ({ matchMedia: () => ({ matches: standalone }) });
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";

describe("isIosBrowserTab (F1-6)", () => {
  it("er sand for iPhone i Safari", () => {
    expect(isIosBrowserTab({ userAgent: IPHONE }, win(false))).toBe(true);
  });
  it("er falsk, når appen er installeret på hjemmeskærmen", () => {
    expect(isIosBrowserTab({ userAgent: IPHONE, standalone: true }, win(false))).toBe(false);
    expect(isIosBrowserTab({ userAgent: IPHONE }, win(true))).toBe(false);
  });
  it("genkender iPad, der udgiver sig for at være en Mac", () => {
    expect(isIosBrowserTab({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", platform: "MacIntel", maxTouchPoints: 5 }, win(false))).toBe(true);
  });
  it("er falsk for Android og almindelig Mac", () => {
    expect(isIosBrowserTab({ userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8)" }, win(false))).toBe(false);
    expect(isIosBrowserTab({ userAgent: "Mozilla/5.0 (Macintosh)", platform: "MacIntel", maxTouchPoints: 0 }, win(false))).toBe(false);
  });
});

describe("pushUnavailableText (F1-6)", () => {
  it("beder iPhone-brugere installere appen", () => {
    expect(pushUnavailableText(true)).toMatch(/hjemmeskærmen/);
  });
  it("lover beskeder i appen og på mail andre steder", () => {
    expect(pushUnavailableText(false)).toMatch(/i appen og på mail/);
  });
});
