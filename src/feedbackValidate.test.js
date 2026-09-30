// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateFeedback, withinLimit, LIMITS } from "../supabase/functions/feedback/validate.js";
import { submitFeedback } from "./submitFeedback.js";

describe("validateFeedback", () => {
  it("godtager en almindelig ticket og ignorerer submitted_by fra body", () => {
    const r = validateFeedback({ type: "bug", description: "  Knap virker ikke  ", submitted_by: "fremmed-id", context: { screen: "HOME" } });
    expect(r.ok).toBe(true);
    expect(r.ticket).toEqual({ type: "bug", description: "Knap virker ikke", context: { screen: "HOME" }, image_base64: null });
  });

  it("afviser ukendt type og tom beskrivelse", () => {
    expect(validateFeedback({ type: "spam", description: "x" }).ok).toBe(false);
    expect(validateFeedback({ type: "bug", description: "   " }).ok).toBe(false);
    expect(validateFeedback(null).ok).toBe(false);
  });

  it("afviser for lang beskrivelse og for stor kontekst", () => {
    expect(validateFeedback({ type: "bug", description: "a".repeat(LIMITS.descriptionMax + 1) }).ok).toBe(false);
    const r = validateFeedback({ type: "bug", description: "x", context: { big: "a".repeat(LIMITS.contextMaxChars) } });
    expect(r).toMatchObject({ ok: false, status: 413 });
  });

  it("godtager ren base64 og data-URL, men gemmer altid ren base64", () => {
    expect(validateFeedback({ type: "bug", description: "x", image_base64: "QUJD" }).ticket.image_base64).toBe("QUJD");
    expect(validateFeedback({ type: "bug", description: "x", image_base64: "data:image/jpeg;base64,QUJD" }).ticket.image_base64).toBe("QUJD");
  });

  it("afviser billeder, der ikke er base64, eller er for store", () => {
    expect(validateFeedback({ type: "bug", description: "x", image_base64: "<script>" }).ok).toBe(false);
    expect(validateFeedback({ type: "bug", description: "x", image_base64: "A".repeat(LIMITS.imageMaxChars + 4) })).toMatchObject({ ok: false, status: 413 });
  });
});

describe("withinLimit", () => {
  it("uden login: pr. afsender og samlet loft", () => {
    expect(withinLimit({ isUser: false, recentForClient: 4, recentTotalAnon: 10 })).toBe(true);
    expect(withinLimit({ isUser: false, recentForClient: 5, recentTotalAnon: 10 })).toBe(false);
    expect(withinLimit({ isUser: false, recentForClient: 0, recentTotalAnon: 60 })).toBe(false);
  });

  it("med login: 20 pr. time, uafhængigt af anonym trafik", () => {
    expect(withinLimit({ isUser: true, recentForClient: 19, recentTotalAnon: 999 })).toBe(true);
    expect(withinLimit({ isUser: true, recentForClient: 20, recentTotalAnon: 0 })).toBe(false);
  });
});

describe("submitFeedback", () => {
  beforeEach(() => { globalThis.fetch = vi.fn(); });

  it("kalder edge-functionen med brugerens token", async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    await submitFeedback({ type: "bug", description: "x", accessToken: "tok" });
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toMatch(/\/functions\/v1\/feedback$/);
    expect(opts.headers.Authorization).toBe("Bearer tok");
    expect(JSON.parse(opts.body)).not.toHaveProperty("submitted_by");
  });

  it("viser funktionens egen fejltekst, fx ved for mange tickets", async () => {
    fetch.mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: "Du har sendt meget feedback på kort tid. Prøv igen om en time." }) });
    await expect(submitFeedback({ type: "bug", description: "x" })).rejects.toThrow("Prøv igen om en time");
  });

  it("giver en forståelig besked uden netværk", async () => {
    fetch.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(submitFeedback({ type: "bug", description: "x" })).rejects.toThrow("Ingen forbindelse");
  });
});
