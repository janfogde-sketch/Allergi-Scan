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
    expect(setScreen).toHaveBeenCalledWith("home");
  });
});

describe("useAuth handleSignup — validation guards", () => {
  it("rejects a password under 10 characters before calling the network", async () => {
    const { result } = setup();
    act(() => { result.current.setLoginEmail("a@b.dk"); result.current.setLoginPassword("123456789"); });
    await act(async () => { await result.current.handleSignup(); });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.passwordError).toMatch(/mindst 10 tegn/i);
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

  it("tells the user to confirm their email when signup succeeds without an access_token", async () => {
    global.fetch.mockResolvedValue(textResponse({ id: "u1" })); // ingen access_token = kræver email-bekræftelse
    const { result } = setup();
    act(() => { result.current.setLoginEmail("a@b.dk"); result.current.setLoginPassword("longenough"); });
    await act(async () => { await result.current.handleSignup(); });
    expect(result.current.authError).toMatch(/bekræftelseslinket/i);
    expect(result.current.accessToken).toBeNull();
  });
});
