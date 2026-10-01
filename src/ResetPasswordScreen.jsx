// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// ResetPasswordScreen.jsx — "Vælg ny adgangskode" (1. okt. 2026)
//
// Linket i "Glemt adgangskode"-mailen logger brugeren ind med en
// recovery-session (useAuth.js, #type=recovery) og lander her. To tilstande:
//  - formular: ny adgangskode med vis/skjul og samme kravtekst som Opret konto
//  - færdig: "Adgangskoden er ændret" og "Fortsæt", som åbner appen (eller det
//    gemte onboarding-trin)
// Samme logo, baggrund og knapper som Bekræft din e-mail.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import { EatSafeLogo, Icon } from "./SharedComponents.jsx";
import { ErrorMessage } from "./DesignSystem.jsx";
import { useAuthContext } from "./AuthContext.jsx";
import { PASSWORD_REQUIREMENTS_TEXT } from "./helpers.js";

export default function ResetPasswordScreen() {
  const { resetError, resetLoading, resetDone, setResetError, submitNewPassword, continueAfterReset } = useAuthContext();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = (e) => {
    e?.preventDefault?.();
    if (!resetLoading) submitNewPassword(password);
  };

  return (
    <div className="login-wrap verify-wrap fade-in">
      <div className="welcome-logo-wrap">
        <EatSafeLogo variant="horizontal" size={56} />
      </div>

      {resetDone ? (
        <>
          <div className="login-card verify-card" role="status">
            <div className="verify-icon verify-icon-ok" aria-hidden="true">
              <Icon name="check" size={24} color="var(--green)" />
            </div>
            <div className="verify-title">Adgangskoden er ændret</div>
            <div className="verify-text">Du er logget ind og kan bruge EatSafe som sædvanligt.</div>
          </div>
          <button className="btn welcome-btn" onClick={continueAfterReset}>Fortsæt</button>
        </>
      ) : (
        <form onSubmit={submit} noValidate>
          <div className="login-card verify-card" style={{ textAlign: "left" }}>
            <div className="verify-icon" aria-hidden="true" style={{ margin: "0 auto 14px" }}>
              <Icon name="key" size={24} color="var(--green)" />
            </div>
            <div className="verify-title" style={{ textAlign: "center" }}>Vælg ny adgangskode</div>
            <label className="field-lbl" htmlFor="reset-password">Ny adgangskode</label>
            <div style={{ position: "relative" }}>
              <input id="reset-password" name="password" className="field" autoFocus
                type={showPassword ? "text" : "password"} autoComplete="new-password"
                placeholder="Mindst 10 tegn" value={password}
                aria-invalid={!!resetError}
                onChange={(e) => { setPassword(e.target.value); if (resetError) setResetError(""); }}
                style={{ paddingRight: 46, borderColor: resetError ? "var(--red-md)" : undefined }} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Skjul adgangskode" : "Vis adgangskode"}
                style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={showPassword ? "eyeOff" : "eye"} size={16} color="var(--muted)" />
              </button>
            </div>
            <div className="verify-text" style={{ fontSize: 12, marginTop: 8 }}>{PASSWORD_REQUIREMENTS_TEXT}</div>
          </div>
          <ErrorMessage>{resetError}</ErrorMessage>
          <button type="submit" className="btn welcome-btn" disabled={resetLoading || !password}>
            {resetLoading ? "Gemmer…" : "Gem adgangskode"}
          </button>
        </form>
      )}
    </div>
  );
}
