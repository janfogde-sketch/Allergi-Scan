// @vitest-environment jsdom
// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useAuth.test.js
// Session/token handling had zero test coverage before this file (flagged in
// the rescue-audit, 16. sept. 2026) despite being where a real "logged in but
// not really" bug was found and fixed once already (see SECURITY_TODO.md).
// These tests focus on the synchronous validation guards (weak passwords,
// malformed email) and the login/signup happy paths — not the background
// token-refresh effects, which need real timers and are lower-risk.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useAuth } from "./useAuth.js";

function textResponse(body, ok = true) {
  return { ok, status: ok ? 200 : 400, text: async () => JSON.stringify(body) };
}

function setup(overrides = {}) {
  const setScreen = vi.fn();
  const setUser = vi.fn();
  const setAllergens = vi.fn();
  const setCustomAllerg = vi.fn();
  const { result } = renderHook(() => useAuth({ setScreen, setUser, setAllergens, setCustomAllerg, ...overrides }));
  return { result, setScreen, setUser };
}

beforeEach(() => {
  localStorage.clear();
  global.fetch = vi.fn();
});

describe("useAuth handleLogin — validation guards", () => {
  it("sets a field-specific error under email when submitted empty, without calling the network", async () => {
    const { result } = setup();
    await act(async () => { await result.current.handleLogin(); });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.emailError).toBe("Indtast din e-mail først.");
  });

  it("sets a field-specific error under password when email is valid but password is empty", async () => {
    const { result } = setup();
    act(() => { result.current.setLoginEmail("a@b.dk"); });
    await act(async () => { await result.current.handleLogin(); });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.passwordError).toBe("Indtast din adgangskode.");
  });

  it("rejects an email without '@' before ever calling the network", async () => {
    const { result } = setup();
    act(() => { result.current.setLoginEmail("not-an-email"); result.current.setLoginPassword("secret123"); });
    await act(async () => { await result.current.handleLogin(); });
    expect(global.fetch).not.toHaveBeenCalled();
    // 27. sept. 2026, "FINAL 10/10 POLISH": felt-specifikke valideringsfejl
    // vises nu i emailError/passwordError, ikke i den globale authError —
    // se OnboardingScreen.jsx, som viser dem inline under det relevante felt.
    expect(result.current.emailError).toMatch(/gyldig e-mailadresse/i);
    expect(result.current.authError).toBe("");
  });

  it("shows a generic error instead of leaking the server's raw message for bad credentials", async () => {
    global.fetch.mockResolvedValue(textResponse({ msg: "Invalid login credentials" }, false));
    const { result } = setup();
    act(() => { result.current.setLoginEmail("a@b.dk"); result.current.setLoginPassword("wrongpass"); });
    await act(async () => { await result.current.handleLogin(); });
    expect(result.current.authError).toBe("E-mail eller adgangskode er forkert.");
  });

  it("saves tokens and navigates home on a successful login", async () => {
    global.fetch.mockResolvedValue(textResponse({ access_token: "at", refresh_token: "rt", user: { id: "u1" } }));
    const { result, setScreen } = setup();
    act(() => { result.current.setLoginEmail("a@b.dk"); result.current.setLoginPassword("correctpass"); });
    await act(async () => { await result.current.handleLogin(); });
    expect(result.current.accessToken).toBe("at");
    expect(localStorage.getItem("as_token")).toBe("at");
    // Routingen bruger nu funktionsformen, så en åbnet push-besked ikke overskrives.
    const updaters = setScreen.mock.calls.map(([x]) => x).filter((x) => typeof x === "function");
    expect(updaters.some((fn) => fn("login") === "home")).toBe(true);
  });
});

describe("useAuth handleSignup — validation guards", () => {
  it("rejects a password under 10 characters before calling the network", async () => {
    const { result } = setup();
    act(() => { result.current.setLoginEmail("a@b.dk"); result.current.setLoginPassword("123456789"); });
    await act(async () => { await result.current.handleSignup(); });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.passwordError).toMatch(/kun 9 tegn \(mindst 10\)/i);
    expect(result.current.authError).toBe("");
  });

  it("rejects a malformed email before calling the network", async () => {
    const { result } = setup();
    act(() => { result.current.setLoginEmail("nope"); result.current.setLoginPassword("longenough"); });
    await act(async () => { await result.current.handleSignup(); });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.emailError).toMatch(/gyldig e-mailadresse/i);
    expect(result.current.authError).toBe("");
  });

  it("'Opret konto' creates the account right away and opens the confirmation screen", async () => {
    global.fetch.mockResolvedValue(textResponse({ id: "u1", identities: [{ id: "i1" }] })); // ingen access_token = kræver email-bekræftelse
    const { result, setScreen } = setup();
    act(() => { result.current.setLoginEmail(" A@B.dk "); result.current.setLoginPassword("LongEnough2026"); });
    await act(async () => { await result.current.handleSignup(); });
    expect(global.fetch.mock.calls[0][0]).toContain("/auth/v1/signup?redirect_to=");
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    // Kun e-mail og adgangskode — ingen telefon eller profil-metadata
    expect(body).toEqual({ email: "a@b.dk", password: "LongEnough2026" });
    expect(result.current.verifyEmail).toBe("a@b.dk");
    expect(result.current.verifyStatus).toBe("pending");
    expect(result.current.authInfo).toBe("");
    expect(result.current.accessToken).toBeNull();
    expect(localStorage.getItem("as_pending_verify")).toBe("a@b.dk");
    expect(setScreen).toHaveBeenLastCalledWith("verifyemail");
  });

  it("shows no confirmation message when the account could not be created", async () => {
    global.fetch.mockResolvedValue(textResponse({ msg: "boom" }, false));
    const { result, setScreen } = setup();
    act(() => { result.current.setLoginEmail("a@b.dk"); result.current.setLoginPassword("LongEnough2026"); });
    await act(async () => { await result.current.handleSignup(); });
    expect(result.current.authError).toBe("Der opstod en fejl. Prøv igen.");
    expect(result.current.authInfo).toBe("");
    expect(localStorage.getItem("as_pending_verify")).toBeNull();
    expect(setScreen).not.toHaveBeenCalledWith("verifyemail");
  });

  it("goes straight to onboarding step 1 when Supabase returns a session right away", async () => {
    global.fetch.mockResolvedValue(textResponse({ access_token: "a", refresh_token: "r", user: { id: "u1" } }));
    const setOnboardStep = vi.fn();
    const { result, setScreen } = setup({ setOnboardStep });
    act(() => { result.current.setLoginEmail("a@b.dk"); result.current.setLoginPassword("LongEnough2026"); });
    await act(async () => { await result.current.handleSignup(); });
    expect(result.current.accessToken).toBe("a");
    expect(setOnboardStep).toHaveBeenLastCalledWith(1);
    expect(setScreen).toHaveBeenLastCalledWith("onboard");
  });

  it("says exactly what is missing before calling the network", async () => {
    const { result } = setup();
    act(() => { result.current.setLoginEmail("a@b.dk"); result.current.setLoginPassword("minhemmeligekode"); });
    await act(async () => { await result.current.handleSignup(); });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.passwordError).toBe("Adgangskoden kan ikke bruges: den mangler et stort bogstav og et tal.");
  });

  it("explains a leaked password rejected by Supabase on the signup form", async () => {
    global.fetch.mockResolvedValue(textResponse({ code: 422, error_code: "weak_password", msg: "Password is known to be weak", weak_password: { reasons: ["pwned"] } }, false));
    const { result, setScreen } = setup();
    act(() => { result.current.setLoginEmail("a@b.dk"); result.current.setLoginPassword("LongEnough2026"); });
    await act(async () => { await result.current.handleSignup(); });
    expect(result.current.passwordError).toMatch(/kendt datalæk/);
    expect(setScreen).not.toHaveBeenCalledWith("verifyemail");
  });

  it("shows 'already registered' when confirmation is on and Supabase hides an existing account", async () => {
    // Med e-mailbekræftelse slået til svarer Supabase 200 med en bruger uden identities
    global.fetch.mockResolvedValue(textResponse({ id: "u1", identities: [] }));
    const { result } = setup();
    act(() => { result.current.setLoginEmail("a@b.dk"); result.current.setLoginPassword("LongEnough2026"); });
    await act(async () => { await result.current.handleSignup(); });
    expect(result.current.emailTakenError).toMatch(/allerede registreret/i);
    expect(result.current.authInfo).toBe("");
  });
});

function jsonResponse(body, ok = true, status) {
  return { ok, status: status || (ok ? 200 : 400), json: async () => body, text: async () => JSON.stringify(body) };
}

describe("useAuth email confirmation screen", () => {
  it("login with an unconfirmed email opens the confirmation screen instead of an error", async () => {
    global.fetch.mockResolvedValue(textResponse({ error_code: "email_not_confirmed", msg: "Email not confirmed" }, false));
    const { result, setScreen } = setup();
    act(() => { result.current.setLoginEmail("a@b.dk"); result.current.setLoginPassword("LongEnough2026"); });
    await act(async () => { await result.current.handleLogin(); });
    expect(result.current.authError).toBe("");
    expect(result.current.verifyEmail).toBe("a@b.dk");
    expect(setScreen).toHaveBeenLastCalledWith("verifyemail");
  });

  it("'Jeg har bekræftet' shows a clear message while the email is still unconfirmed", async () => {
    localStorage.setItem("as_pending_verify", "a@b.dk");
    global.fetch.mockResolvedValue(jsonResponse({ error_code: "email_not_confirmed", msg: "Email not confirmed" }, false));
    const { result, setScreen } = setup({ setOnboardStep: vi.fn() });
    act(() => { result.current.setLoginPassword("LongEnough2026"); });
    await act(async () => { await result.current.checkEmailVerified(); });
    expect(result.current.verifyError).toMatch(/ikke se, at e-mailen er bekræftet/);
    expect(result.current.verifyStatus).toBe("pending");
    expect(setScreen).not.toHaveBeenCalledWith("home");
  });

  it("'Jeg har bekræftet' logs in and shows 'E-mail bekræftet' — never the scanner", async () => {
    localStorage.setItem("as_pending_verify", "a@b.dk");
    global.fetch
      .mockResolvedValueOnce(jsonResponse({ access_token: "a", refresh_token: "r", user: { id: "u1" } }))
      .mockResolvedValueOnce(jsonResponse([{ onboarding_completed: false, onboarding_step: 3 }]));
    const setOnboardStep = vi.fn();
    const { result, setScreen } = setup({ setOnboardStep });
    act(() => { result.current.setLoginPassword("LongEnough2026"); });
    await act(async () => { await result.current.checkEmailVerified(); });
    expect(result.current.accessToken).toBe("a");
    expect(result.current.verifyStatus).toBe("verified");
    expect(setOnboardStep).toHaveBeenLastCalledWith(3);
    expect(setScreen).not.toHaveBeenCalledWith("home");
    expect(localStorage.getItem("as_pending_verify")).toBeNull();
    act(() => { result.current.continueAfterVerify(); });
    expect(setScreen).toHaveBeenLastCalledWith("onboard");
  });

  it("after an app restart (password unknown) 'Jeg har bekræftet' goes to Log ind with the email filled in", async () => {
    localStorage.setItem("as_pending_verify", "a@b.dk");
    const { result, setScreen } = setup();
    await act(async () => { await result.current.checkEmailVerified(); });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.loginEmail).toBe("a@b.dk");
    expect(result.current.authTab).toBe("login");
    expect(setScreen).toHaveBeenLastCalledWith("login");
  });

  it("'Send mail igen' calls Supabase resend for the signup email and starts a cooldown", async () => {
    localStorage.setItem("as_pending_verify", "a@b.dk");
    global.fetch.mockResolvedValue(jsonResponse({}));
    const { result } = setup();
    await act(async () => { await result.current.resendVerification(); });
    expect(global.fetch.mock.calls[0][0]).toContain("/auth/v1/resend");
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({ type: "signup", email: "a@b.dk" });
    expect(result.current.verifyNotice).toMatch(/ny mail/);
    expect(result.current.resendCooldown).toBe(60);
  });

  it("'Skift e-mailadresse' returns to the signup form with the email filled in", () => {
    localStorage.setItem("as_pending_verify", "a@b.dk");
    const { result, setScreen } = setup();
    act(() => { result.current.changeVerifyEmail(); });
    expect(result.current.loginEmail).toBe("a@b.dk");
    expect(result.current.authTab).toBe("signup");
    expect(localStorage.getItem("as_pending_verify")).toBeNull();
    expect(setScreen).toHaveBeenLastCalledWith("login");
  });
});

describe("useAuth — ny adgangskode efter nulstillingslink", () => {
  it("afviser en for svag adgangskode uden at kalde netværket", async () => {
    const { result } = setup();
    await act(async () => { await result.current.submitNewPassword("kort"); });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.resetError).toMatch(/kun 4 tegn/);
  });

  it("gemmer den nye adgangskode med recovery-sessionen og viser færdig-tilstand", async () => {
    localStorage.setItem("as_token", "tok");
    global.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    const { result } = setup();
    let ok;
    await act(async () => { ok = await result.current.submitNewPassword("Stærk12345"); });
    expect(ok).toBe(true);
    // App-boot kan have lavet egne opslag med samme token — find selve PUT-kaldet.
    const [url, init] = global.fetch.mock.calls.find(([, i]) => i?.method === "PUT");
    expect(url).toMatch(/\/auth\/v1\/user$/);
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(JSON.parse(init.body)).toEqual({ password: "Stærk12345" });
    expect(result.current.resetDone).toBe(true);
  });

  it("viser en fast, venlig tekst, når linket er udløbet (401), uden Supabases rå fejl", async () => {
    localStorage.setItem("as_token", "tok");
    global.fetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({ msg: "JWT expired" }) });
    const { result } = setup();
    await act(async () => { await result.current.submitNewPassword("Stærk12345"); });
    expect(result.current.resetDone).toBe(false);
    expect(result.current.resetError).toMatch(/udløbet/);
    expect(result.current.resetError).not.toMatch(/JWT/);
  });

  it("fortæller, at den nye kode skal være forskellig fra den gamle (same_password)", async () => {
    localStorage.setItem("as_token", "tok");
    global.fetch.mockResolvedValue({ ok: false, status: 422, json: async () => ({ error_code: "same_password" }) });
    const { result } = setup();
    await act(async () => { await result.current.submitNewPassword("Stærk12345"); });
    expect(result.current.resetError).toMatch(/forskellig/);
  });
});

describe("useAuth — app-start overskriver ikke en besked åbnet fra push", () => {
  it("sender ikke videre til forsiden, hvis beskeden allerede er åbnet", async () => {
    localStorage.setItem("as_token", "a.eyJzdWIiOiJ1MSJ9.s");
    localStorage.setItem("as_user_id", "u1");
    global.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => [{ onboarding_completed: true, onboarding_step: 5 }], text: async () => "[]" });
    const { setScreen } = setup();
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    const withUpdater = setScreen.mock.calls.map(([a]) => a).filter((a) => typeof a === "function");
    expect(withUpdater.length).toBeGreaterThan(0);
    expect(withUpdater[0]("notification")).toBe("notification");
    expect(withUpdater[0]("ticket")).toBe("ticket");
    expect(withUpdater[0]("boot")).toBe("home");
    expect(withUpdater[0]("home")).toBe("home");
  });
});
