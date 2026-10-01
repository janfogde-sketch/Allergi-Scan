// @ts-nocheck
import { describe, it, expect } from "vitest";
import { SCREENS } from "./constants.jsx";
import { buildFeedbackContext, diagnosticGroups, detectDevice } from "./feedbackDiagnostics.js";
import { FEEDBACK_TYPES } from "./feedbackTypes.js";

const base = (type, extra = {}) => buildFeedbackContext({
  type,
  env: { url: "https://eatsafe.dk/", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17)", platform: "iPhone", language: "da-DK", screenSize: "390x844", viewport: "390x700", online: true, timestamp: "2026-10-02T10:00:00.000Z" },
  app: { buildTime: "2026-10-02T09:00:00Z", commitSha: "abc1234", screenLabel: "Scanner" },
  state: { screen: SCREENS.HOME, userId: "u1", user: { name: "Mia", email: "mia@example.dk", role: "user" }, allergens: ["maelkeallergi"], family: [{}, {}], history: [{}], activeProfiles: ["me"] },
  traces: Array.from({ length: 60 }, (_, i) => ({ id: "t", step: `s${i}` })),
  recentErrors: [{ ts: "2026-10-02T09:59:30.000Z", message: "Boom", screen: "Scanner" }],
  ...extra,
});

describe("feedbackTypes", () => {
  it("har de seks typer med line-ikoner og uændrede id'er", () => {
    expect(FEEDBACK_TYPES.map(t => t.id)).toEqual(["bug", "ui", "missing", "content", "crash", "suggestion"]);
    expect(FEEDBACK_TYPES.find(t => t.id === "crash").label).toBe("Appen lukker ned");
    expect(FEEDBACK_TYPES.every(t => /^[a-zA-Z]+$/.test(t.icon))).toBe(true);
  });
});

describe("buildFeedbackContext", () => {
  it("sender de relevante felter, og kun de seneste 50 spor", () => {
    const c = base("bug");
    expect(c).toMatchObject({ viewport: "390x700", online: true, commit_sha: "abc1234", user_role: "user", allergens_count: 1, family_count: 2 });
    expect(c.debug_trace).toHaveLength(50);
    expect(c.recent_errors).toBeUndefined();
  });
  it("tager kun de seneste fejl med ved 'Appen lukker ned'", () => {
    expect(base("crash").recent_errors).toEqual([{ ts: "2026-10-02T09:59:30.000Z", message: "Boom", screen: "Scanner" }]);
  });
});

describe("diagnosticGroups", () => {
  it("samler persondata i en egen, mærket gruppe", () => {
    const g = diagnosticGroups(base("bug"));
    const personal = g.find(x => x.personal);
    expect(personal.title).toMatch(/Personoplysninger/);
    expect(personal.rows.map(r => r[0])).toEqual(["Navn", "E-mail", "Allergener", "Familie"]);
    expect(g.find(x => x.id === "tech").rows.some(r => r[0] === "E-mail")).toBe(false);
    expect(g.find(x => x.id === "errors")).toBeUndefined();
  });
  it("viser seneste fejl ved crash, og en besked når der ingen er", () => {
    const withErr = diagnosticGroups(base("crash"), { type: "crash" }).find(x => x.id === "errors");
    expect(withErr.rows[0][1]).toContain("Boom");
    const none = diagnosticGroups(base("crash", { recentErrors: [] }), { type: "crash" }).find(x => x.id === "errors");
    expect(none.rows[0][1]).toMatch(/Ingen fejl/);
  });
  it("kender enheden", () => {
    expect(detectDevice("Mozilla/5.0 (iPhone)")).toBe("iOS");
    expect(detectDevice("Linux; Android 14")).toBe("Android");
    expect(detectDevice("X11; Linux")).toBe("Desktop");
  });
});
