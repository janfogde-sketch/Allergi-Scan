// @ts-nocheck
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { buildAuthMails, renderAuthTemplate, confirmationUrl, AuthMailError } from "../supabase/functions/_shared/authMail.ts";
import { AUTH_MAIL_TEMPLATES } from "../supabase/functions/_shared/authMailTemplates.ts";

const URL_BASE = "https://jegrpcflyguadyxialkm.supabase.co";
const user = { id: "u1", email: "anna@example.dk" };
const payload = (email_data, u = user) => ({ user: u, email_data: { token: "123456", token_hash: "hash1", redirect_to: "https://www.eatsafe.dk/", site_url: URL_BASE, token_new: "", token_hash_new: "", ...email_data } });

describe("genererede skabeloner", () => {
  it("er identiske med filerne i supabase/templates/auth (kør node scripts/build-auth-mails.mjs efter ændringer)", () => {
    const templates = JSON.parse(readFileSync("supabase/templates/auth/templates.json", "utf-8"));
    expect(Object.keys(AUTH_MAIL_TEMPLATES).sort()).toEqual(Object.keys(templates).sort());
    for (const [name, { subject, file }] of Object.entries(templates)) {
      expect(AUTH_MAIL_TEMPLATES[name].subject).toBe(subject);
      expect(AUTH_MAIL_TEMPLATES[name].html).toBe(readFileSync(`supabase/templates/auth/${file}`, "utf-8"));
    }
  });
  it("dækker alle seks typer, og emnerne er danske og højst 55 tegn", () => {
    expect(Object.keys(AUTH_MAIL_TEMPLATES).sort()).toEqual(["confirmation", "email_change", "invite", "magic_link", "recovery", "reauthentication"].sort());
    for (const t of Object.values(AUTH_MAIL_TEMPLATES)) {
      expect(t.subject.length).toBeLessThanOrEqual(55);
      expect(t.subject).not.toMatch(/Confirm|Reset|Magic|Invite/);
    }
  });
  it("bruger kun de pladsholdere, hook'en kender", () => {
    for (const [name, t] of Object.entries(AUTH_MAIL_TEMPLATES)) {
      for (const m of t.html.matchAll(/\{\{\s*\.(\w+)\s*\}\}/g)) expect(["ConfirmationURL", "Token", "Email", "NewEmail"], `${name}: ${m[0]}`).toContain(m[1]);
    }
  });
});

describe("confirmationUrl / renderAuthTemplate", () => {
  it("bygger verify-linket med kodet redirect", () => {
    expect(confirmationUrl(`${URL_BASE}/`, "h h", "signup", "https://www.eatsafe.dk/?a=1&b=2"))
      .toBe(`${URL_BASE}/auth/v1/verify?token=h%20h&type=signup&redirect_to=https%3A%2F%2Fwww.eatsafe.dk%2F%3Fa%3D1%26b%3D2`);
    expect(confirmationUrl(URL_BASE, "h", "recovery", "")).toBe(`${URL_BASE}/auth/v1/verify?token=h&type=recovery`);
  });
  it("escaper værdier og tømmer ukendte pladsholdere", () => {
    expect(renderAuthTemplate("<a href=\"{{ .ConfirmationURL }}\">{{.Email}} {{ .Ukendt }}</a>", { ConfirmationURL: "https://x.dk/?a=1&b=2", Email: "<b>@x.dk" }))
      .toBe('<a href="https://x.dk/?a=1&amp;b=2">&lt;b&gt;@x.dk </a>');
  });
});

describe("buildAuthMails", () => {
  it("signup: én dansk bekræftelsesmail med verify-link", () => {
    const [m, ...rest] = buildAuthMails(payload({ email_action_type: "signup" }), URL_BASE);
    expect(rest).toHaveLength(0);
    expect(m.to).toBe("anna@example.dk");
    expect(m.template).toBe("confirmation");
    expect(m.subject).toBe("Bekræft din e-mail – EatSafe");
    expect(m.html).toContain(`href="${URL_BASE}/auth/v1/verify?token=hash1&amp;type=signup&amp;redirect_to=https%3A%2F%2Fwww.eatsafe.dk%2F"`);
    expect(m.html).not.toMatch(/\{\{/);
  });
  it("recovery, invite, magiclink og email bruger hver deres skabelon", () => {
    const names = { recovery: "recovery", invite: "invite", magiclink: "magic_link", email: "magic_link" };
    for (const [type, template] of Object.entries(names)) {
      const [m] = buildAuthMails(payload({ email_action_type: type }), URL_BASE);
      expect(m.template).toBe(template);
      expect(m.html).toContain(`type=${type}`);
      expect(m.html).not.toMatch(/\{\{/);
    }
  });
  it("magic link viser også koden", () => {
    const [m] = buildAuthMails(payload({ email_action_type: "magiclink", token: "654321" }), URL_BASE);
    expect(m.html).toContain("654321");
  });
  it("reauthentication sender kun en kode, uden link", () => {
    const [m] = buildAuthMails(payload({ email_action_type: "reauthentication", token: "246810", token_hash: "" }), URL_BASE);
    expect(m.template).toBe("reauthentication");
    expect(m.html).toContain("246810");
    expect(m.html).not.toContain("/auth/v1/verify");
  });
  it("e-mailskift med Secure email change: to mails med byttede token-felter", () => {
    const mails = buildAuthMails(payload({ email_action_type: "email_change", token: "111111", token_hash: "hashNy", token_new: "222222", token_hash_new: "hashNuvaerende" }, { ...user, new_email: "ny@example.dk" }), URL_BASE);
    expect(mails.map((m) => m.to)).toEqual(["anna@example.dk", "ny@example.dk"]);
    expect(mails[0].html).toContain("token=hashNuvaerende"); // nuværende adresse: token_hash_new
    expect(mails[1].html).toContain("token=hashNy"); // ny adresse: token_hash
    for (const m of mails) { expect(m.html).toContain("anna@example.dk"); expect(m.html).toContain("ny@example.dk"); }
  });
  it("e-mailskift uden Secure email change: én mail til den nye adresse", () => {
    const mails = buildAuthMails(payload({ email_action_type: "email_change", token_hash: "hashNy" }, { ...user, new_email: "ny@example.dk" }), URL_BASE);
    expect(mails).toHaveLength(1);
    expect(mails[0].to).toBe("ny@example.dk");
    expect(mails[0].html).toContain("token=hashNy");
  });
  it("notifikationer og ukendte typer giver ingen mail (og ingen fejl)", () => {
    for (const type of ["password_changed_notification", "email_changed_notification", "mfa_factor_enrolled_notification", "ukendt"]) {
      expect(buildAuthMails(payload({ email_action_type: type }), URL_BASE)).toEqual([]);
    }
  });
  it("ugyldige nyttelaster kaster AuthMailError", () => {
    expect(() => buildAuthMails({}, URL_BASE)).toThrow(AuthMailError);
    expect(() => buildAuthMails(payload({ email_action_type: "signup" }, { id: "u" }), URL_BASE)).toThrow(/modtager/);
    expect(() => buildAuthMails(payload({ email_action_type: "signup", token_hash: "" }), URL_BASE)).toThrow(/token_hash/);
    expect(() => buildAuthMails(payload({ email_action_type: "email_change" }, user), URL_BASE)).toThrow(/ny e-mailadresse/);
    expect(() => buildAuthMails(payload({ email_action_type: "reauthentication", token: "" }), URL_BASE)).toThrow(/kode/);
  });
  it("HTML-escaper adresser, så en mærkelig adresse ikke kan bryde mailen", () => {
    const [m] = buildAuthMails(payload({ email_action_type: "email_change", token_hash: "h" }, { ...user, new_email: "a\"<b>@x.dk" }), URL_BASE);
    expect(m.html).not.toContain("<b>@x.dk");
    expect(m.html).toContain("&lt;b&gt;@x.dk");
  });
});
