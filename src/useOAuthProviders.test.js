import { describe, it, expect } from "vitest";
import { appleEnabledFromSettings } from "./useOAuthProviders.js";

describe("appleEnabledFromSettings", () => {
  it("viser kun Apple, når Supabase har slået udbyderen til", () => {
    expect(appleEnabledFromSettings({ external: { apple: true, google: true } })).toBe(true);
    expect(appleEnabledFromSettings({ external: { apple: false, google: true } })).toBe(false);
    expect(appleEnabledFromSettings(null)).toBe(false);
    expect(appleEnabledFromSettings({})).toBe(false);
  });
});
