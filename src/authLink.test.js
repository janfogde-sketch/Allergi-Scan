// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { parseAuthLink, hasAuthLink, cleanAuthUrl, startPkce, takePkceVerifier, codeChallengeFor,
  exchangeAuthCode, verifyEmailLink } from "./authLink.js";

beforeEach(() => { localStorage.clear(); });

describe("parseAuthLink", () => {
  it("genkender engangskode, mail-link, gammel form og fejl", () => {
    expect(parseAuthLink({ search: "?code=abc" })).toEqual({ kind: "code", code: "abc" });
    expect(parseAuthLink({ search: "?token_hash=h&type=recovery&email=a%40b.dk" }))
      .toEqual({ kind: "token_hash", tokenHash: "h", type: "recovery", email: "a@b.dk" });
    expect(parseAuthLink({ hash: "#access_token=a&refresh_token=r&type=signup" }))
      .toEqual({ kind: "tokens", access: "a", refresh: "r", type: "signup" });
    expect(parseAuthLink({ hash: "#error=access_denied&error_code=otp_expired" })).toEqual({ kind: "error", errorCode: "otp_expired" });
    expect(parseAuthLink({ search: "?error=access_denied" })).toEqual({ kind: "error", errorCode: "access_denied" });
  });
  it("ignorerer almindelige adresser og ukendte linktyper", () => {
    expect(parseAuthLink({ search: "?src=store", hash: "" })).toBeNull();
    expect(parseAuthLink({ search: "?token_hash=h&type=hack" })).toBeNull();
    expect(parseAuthLink({ hash: "#access_token=a" })).toBeNull();
    expect(hasAuthLink({ search: "?invite=x" })).toBe(false);
    expect(hasAuthLink({ search: "?src=store&code=x" })).toBe(true);
  });
});

describe("cleanAuthUrl", () => {
  it("fjerner login-parametre og hash, men bevarer andre parametre", () => {
    expect(cleanAuthUrl({ pathname: "/", search: "?src=store&code=abc" })).toBe("/?src=store");
    expect(cleanAuthUrl({ pathname: "/", search: "?token_hash=h&type=signup&email=a" })).toBe("/");
  });
});

describe("PKCE-engangsnøgle", () => {
  it("fingeraftrykket svarer til RFC 7636-eksemplet", async () => {
    expect(await codeChallengeFor("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });
  it("gemmer nøglen, udleverer den én gang og afviser en gammel", async () => {
    const challenge = await startPkce();
    const v = takePkceVerifier();
    expect(v).toMatch(/^[A-Za-z0-9_-]{43,}$/);
    expect(await codeChallengeFor(v)).toBe(challenge);
    expect(takePkceVerifier()).toBeNull();
    await startPkce();
    expect(takePkceVerifier(Date.now() + 11 * 60 * 1000)).toBeNull();
  });
});

describe("veksling", () => {
  const ok = (body) => ({ ok: true, status: 200, json: async () => body });
  it("veksler kode med nøgle", async () => {
    const f = vi.fn().mockResolvedValue(ok({ access_token: "A", refresh_token: "R", user: { id: "u" } }));
    expect(await exchangeAuthCode("https://s", "k", "c", "v", f)).toEqual({ ok: true, access: "A", refresh: "R", user: { id: "u" } });
    expect(f.mock.calls[0][0]).toBe("https://s/auth/v1/token?grant_type=pkce");
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ auth_code: "c", code_verifier: "v" });
  });
  it("bruger et mail-link og melder udløb", async () => {
    const f = vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({ error_code: "otp_expired" }) });
    expect(await verifyEmailLink("https://s", "k", "h", "recovery", f)).toEqual({ ok: false, reason: "HTTP 403", status: 403, errorCode: "otp_expired" });
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ token_hash: "h", type: "recovery" });
  });
  it("bekræftet uden session (skift af e-mail, første link)", async () => {
    const f = vi.fn().mockResolvedValue(ok({ msg: "ok" }));
    expect(await verifyEmailLink("https://s", "k", "h", "email_change", f)).toEqual({ ok: true, access: null, refresh: null, user: null });
  });
});
