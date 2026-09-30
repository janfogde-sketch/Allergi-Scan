// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// VerifyEmailScreen.jsx — "Bekræft din e-mail" (30. sept. 2026)
//
// Vises lige efter "Opret konto" og igen ved appstart, så længe kontoen er
// oprettet, men e-mailen ikke er bekræftet (useAuth.js, PENDING_VERIFY_KEY).
// To tilstande:
//  - "pending": mailen er sendt — "Jeg har bekræftet min e-mail", "Send mail
//    igen" og "Skift e-mailadresse".
//  - "verified": kort "✓ E-mail bekræftet" og "Fortsæt opsætning", som åbner
//    onboarding på det gemte trin.
// Bevidst rolig: samme logo, baggrund og knapper som Opret konto/Log ind,
// ingen ekstra elementer.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect } from "react";
import { EatSafeLogo, Icon } from "./SharedComponents.jsx";
import { TextLink, ErrorMessage } from "./DesignSystem.jsx";
import { useAuthContext } from "./AuthContext.jsx";

export default function VerifyEmailScreen() {
  const {
    verifyEmail, verifyStatus, verifyError, verifyNotice, verifyLoading, resendCooldown,
    checkEmailVerified, resendVerification, changeVerifyEmail, continueAfterVerify,
  } = useAuthContext();

  const verified = verifyStatus === "verified";

  // Åbnes linket i en anden fane i samme browser, gemmer den fane sessionen
  // i localStorage — så skifter denne fane selv til "E-mail bekræftet".
  useEffect(() => {
    if (verified) return;
    const onStorage = (e) => { if (e.key === "as_token" && e.newValue) checkEmailVerified(); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [verified, checkEmailVerified]);

  return (
    <div className="login-wrap verify-wrap fade-in">
      <div className="welcome-logo-wrap">
        <EatSafeLogo variant="horizontal" size={56} />
      </div>

      <div className="login-card verify-card">
        {verified ? (
          <div role="status">
            <div className="verify-icon verify-icon-ok" aria-hidden="true">
              <Icon name="check" size={24} color="var(--green)" />
            </div>
            <div className="verify-title">E-mail bekræftet</div>
            {verifyEmail && <div className="verify-email">{verifyEmail}</div>}
            <div className="verify-text">Nu mangler du kun at fortælle lidt om dig selv og dine allergier.</div>
          </div>
        ) : (
          <div>
            <div className="verify-icon" aria-hidden="true">
              <Icon name="mail" size={24} color="var(--green)" />
            </div>
            <div className="verify-title">Bekræft din e-mail</div>
            <div className="verify-text">Vi har sendt et bekræftelseslink til</div>
            <div className="verify-email">{verifyEmail}</div>
            <div className="verify-text">Åbn mailen og tryk på linket for at aktivere din konto.</div>
          </div>
        )}
      </div>

      {verified ? (
        <button className="btn welcome-btn" onClick={continueAfterVerify}>
          Fortsæt opsætning
        </button>
      ) : (
        <>
          {verifyNotice && (
            <div className="info-box" role="status">
              <Icon name="check" size={14} color="var(--blue)" />
              <span>{verifyNotice}</span>
            </div>
          )}
          <ErrorMessage>{verifyError}</ErrorMessage>
          <button className="btn welcome-btn" onClick={checkEmailVerified} disabled={verifyLoading}>
            {verifyLoading ? "Tjekker…" : "Jeg har bekræftet min e-mail"}
          </button>
          <button className="btn welcome-btn-ghost" onClick={resendVerification} disabled={verifyLoading || resendCooldown > 0}>
            {resendCooldown > 0 ? `Send mail igen (${resendCooldown} s)` : "Send mail igen"}
          </button>
          <div className="verify-links">
            <TextLink onClick={changeVerifyEmail}>Skift e-mailadresse</TextLink>
            <div className="verify-help">Kan du ikke finde mailen? Tjek din spam-mappe.</div>
          </div>
        </>
      )}
    </div>
  );
}
