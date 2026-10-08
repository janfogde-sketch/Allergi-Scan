// @ts-nocheck
import { describe, it, expect } from "vitest";
import { SCREENS } from "./constants.jsx";
import { buildFeedbackContext, diagnosticGroups, detectDevice, detectDeviceType, detectOs, detectBrowser, safeUrl, sanitizeTraces, NO_CRASH_TEXT } from "./feedbackDiagnostics.js";
import { FEEDBACK_TYPES } from "./feedbackTypes.js";
import { ticketReporter, ticketDevice } from "./ticketReporter.js";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";

const base = (type, { screen = SCREENS.HOME, ...extra } = {}) => buildFeedbackContext({
  type,
  env: { url: "https://www.eatsafe.dk/?token=hemmelig#access_token=abc", userAgent: IPHONE, platform: "iPhone", language: "da-DK", screenSize: "390x844", viewport: "390x700", online: true, timestamp: "2026-10-02T10:00:00.000Z", standalone: true },
  app: { buildTime: "2026-10-02T09:00:00Z", commitSha: "abc1234", screenLabel: "Scanner" },
  state: {
    screen, userId: "u1", onboardStep: 4, user: { name: "Mia", email: "mia@example.dk", role: "user", allergenLevels: { maelkeallergi: "direct_only" } },
    allergens: ["maelkeallergi"], family: [{}, {}], activeProfiles: ["me"], history: [{}],
  },
  traces: [
    { id: "t1", step: "scan:result", ts: "2026-10-02T09:59:00Z", ean: "5701234567890", name: "Havregryn", status: "danger", matchedDanger: ["maelkeallergi"], flags: { maelk: "yes" } },
    ...Array.from({ length: 60 }, (_, i) => ({ id: "t", step: `s${i}` })),
  ],
  recentErrors: [{ ts: "2026-10-02T09:58:00.000Z", message: "Gammel", screen: "Liste", stack: "a" }, { ts: "2026-10-02T09:59:30.000Z", message: "Boom", screen: "Scanner", source: "react", stack: "at x (y.js:1)" }],
  ...extra,
});

describe("feedbackTypes", () => {
  it("har de seks typer med line-ikoner og uændrede id'er", () => {
    expect(FEEDBACK_TYPES.map(t => t.id)).toEqual(["bug", "ui", "missing", "content", "crash", "suggestion"]);
    expect(FEEDBACK_TYPES.find(t => t.id === "crash").label).toBe("Appen lukker ned");
    expect(FEEDBACK_TYPES.every(t => /^[a-zA-Z]+$/.test(t.icon))).toBe(true);
  });
});

describe("dataminimering i buildFeedbackContext", () => {
  const c = base("bug");
  const json = JSON.stringify(c);

  it("indeholder hverken navn, e-mail, allergier, familie eller andre brugerdata", () => {
    for (const key of ["user_name", "user_email", "allergens", "allergens_count", "family_count", "active_profiles", "history_count", "user_agent"]) {
      expect(c).not.toHaveProperty(key);
    }
    expect(json).not.toContain("Mia");
    expect(json).not.toContain("mia@example.dk");
    expect(json).not.toContain("maelkeallergi");
  });

  it("kobles til kontoen via det interne bruger-ID og har tekniske runtime-felter", () => {
    expect(c).toMatchObject({ user_id: "u1", user_role: "user", os: "iOS", os_version: "17.4", device_type: "Mobil", browser: "Safari 17",
      language: "da-DK", viewport: "390x700", screen_size: "390x844", online: true, commit_sha: "abc1234", app_version: "beta-1.0", display_mode: "standalone" });
    expect(c.onboard_step).toBeNull();
  });

  it("afspejler onboarding-trinnet, kun på onboarding-skærmen", () => {
    expect(base("bug", { screen: SCREENS.ONBOARD }).onboard_step).toBe(4);
  });

  it("fjerner query og hash fra URL'en", () => {
    expect(c.url).toBe("/#…");
    expect(safeUrl("https://www.eatsafe.dk/?a=1")).toBe("/");
    expect(safeUrl("ikke en url")).toBe("");
  });

  it("sender kun hvidlistede trace-felter og højst 50", () => {
    expect(c.debug_trace).toHaveLength(50);
    const t = sanitizeTraces([{ id: "x", step: "scan:result", ean: "1", name: "N", status: "danger", matchedDanger: ["a"], matchedWarning: ["b"], flags: { a: 1 } }])[0];
    expect(t).toEqual({ id: "x", step: "scan:result", ean: "1", name: "N", status: "danger" });
  });
});

describe("crash-data", () => {
  it("sender kun den seneste fejl, uden stack, og kun ved 'Appen lukker ned'", () => {
    expect(base("bug").recent_errors).toBeUndefined();
    expect(base("crash").recent_errors).toEqual([{ ts: "2026-10-02T09:59:30.000Z", message: "Boom", screen: "Scanner", source: "react" }]);
  });
  it("uden registrerede fejl er listen tom, og oversigten siger det", () => {
    const c = base("crash", { recentErrors: [] });
    expect(c.recent_errors).toEqual([]);
    const err = diagnosticGroups(c, { type: "crash" }).find(g => g.id === "errors");
    expect(err.rows[0]).toEqual(["Seneste fejl", NO_CRASH_TEXT]);
  });
  it("med en fejl viser oversigten den", () => {
    const err = diagnosticGroups(base("crash"), { type: "crash" }).find(g => g.id === "errors");
    expect(err.rows[0][1]).toContain("Boom");
  });
});

describe("diagnosticGroups", () => {
  it("indeholder kun en teknisk gruppe, uden persondata, men med de relevante felter", () => {
    const g = diagnosticGroups(base("bug"));
    expect(g).toHaveLength(1);
    const labels = g[0].rows.map(r => r[0]);
    for (const l of ["Enhed", "OS-version", "Enhedstype", "Viewport", "Skærmstørrelse", "Sprog", "Build", "Version", "Rolle", "Konto-ID (internt)"]) expect(labels).toContain(l);
    for (const l of ["Navn", "E-mail", "Allergener", "Familie"]) expect(labels).not.toContain(l);
    const flat = Object.fromEntries(g[0].rows);
    expect(flat.Enhed).toBe("iOS");
    expect(flat.Sprog).toBe("da-DK");
  });
  it("viser onboarding-trinnet fra den faktiske progression", () => {
    const rows = Object.fromEntries(diagnosticGroups(base("bug", { screen: SCREENS.ONBOARD }))[0].rows);
    expect(rows["Onboarding-trin"]).toBe("4 af 5");
  });
});

describe("enhedsdetektion", () => {
  it("kender enhed, type, styresystem og browser", () => {
    expect(detectDevice(IPHONE)).toBe("iOS");
    expect(detectDevice("Linux; Android 14")).toBe("Android");
    expect(detectDevice("X11; Linux")).toBe("Desktop");
    expect(detectDeviceType(IPHONE)).toBe("Mobil");
    expect(detectDeviceType("Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X)")).toBe("Tablet");
    expect(detectDeviceType("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("Computer");
    expect(detectOs("Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120.0 Mobile Safari/537.36")).toEqual({ os: "Android", version: "14" });
    expect(detectOs("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toEqual({ os: "Windows", version: "10.0" });
    expect(detectBrowser("Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0 Safari/537.36 Edg/120.0")).toBe("Edge 120");
    expect(detectBrowser("Mozilla/5.0 (Linux; Android 14) Chrome/120.0.0.0 Mobile Safari/537.36")).toBe("Chrome 120");
  });
});

describe("ticketReporter (admin)", () => {
  it("viser konto-ID for nye tickets og navn for ældre", () => {
    expect(ticketReporter({ submitted_by: "1234567890abcdef", context: {} })).toBe("Konto 12345678");
    expect(ticketReporter({ context: { user_name: "Mia" } })).toBe("Mia");
    expect(ticketReporter({ context: {} })).toBe("Anonym");
  });
  it("viser enheden ud fra de nye felter, med fald tilbage til user-agent", () => {
    expect(ticketDevice({ os: "iOS", os_version: "17.4", device_type: "Mobil" })).toBe("iOS 17.4 · Mobil");
    expect(ticketDevice({ user_agent: "Android 14" })).toBe("Android");
  });
});
