// @ts-nocheck
// Familie-invitationer bundet til e-mail (3. okt. 2026): normalisering, validering og udløbstekst i mailen.
import { describe, it, expect } from "vitest";
import { normalizeInviteEmail, isValidInviteEmail, formatInviteExpiry, MAX_INVITE_MAILS_PER_DAY } from "../supabase/functions/_shared/familyInvite.ts";

describe("normalizeInviteEmail", () => {
  it("fjerner mellemrum og bruger små bogstaver", () => {
    expect(normalizeInviteEmail("  Frederikke@Gmail.COM ")).toBe("frederikke@gmail.com");
    expect(normalizeInviteEmail(null)).toBe("");
    expect(normalizeInviteEmail(undefined)).toBe("");
  });
});

describe("isValidInviteEmail", () => {
  it("accepterer almindelige adresser", () => {
    for (const e of ["a@b.dk", "frederikke@gmail.com", "fornavn.efternavn+eatsafe@sub.eksempel.co.uk"]) expect(isValidInviteEmail(e)).toBe(true);
  });
  it("afviser ugyldige adresser, specialtegn som æøå og for lange", () => {
    for (const e of ["", "abc", "a@b", "@b.dk", "a@.dk", "a b@c.dk", "a@b..dk", "søren@gmail.com", "a@bøf.dk", "a@b.dk,c@d.dk", `${"a".repeat(250)}@b.dk`]) {
      expect(isValidInviteEmail(e), e).toBe(false);
    }
  });
});

describe("formatInviteExpiry (dansk tid)", () => {
  const now = new Date("2026-10-03T16:30:00Z"); // 18.30 dansk tid (CEST)
  it("i dag / i morgen med klokkeslæt", () => {
    expect(formatInviteExpiry(new Date("2026-10-03T19:05:00Z"), now)).toBe("i dag kl. 21.05");
    expect(formatInviteExpiry(new Date("2026-10-04T16:29:00Z"), now)).toBe("i morgen kl. 18.29");
  });
  it("senere dage får ugedag og dato", () => {
    expect(formatInviteExpiry(new Date("2026-10-07T10:00:00Z"), now)).toMatch(/kl\. 12\.00$/);
  });
});

describe("misbrugsværn", () => {
  it("grænsen pr. døgn er sat til et lille tal", () => {
    expect(MAX_INVITE_MAILS_PER_DAY).toBeGreaterThan(0);
    expect(MAX_INVITE_MAILS_PER_DAY).toBeLessThanOrEqual(20);
  });
});
