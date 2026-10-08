// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// VerifyEmailScreen.jsx — "Bekræft din e-mail" (30. sept. 2026)
//
// Vises lige efter "Opret konto" og igen ved appstart, så længe kontoen er
// oprettet, men e-mailen ikke er bekræftet (useAuth.js, PENDING_VERIFY_KEY).
// To tilstande:
//  - "pending": mailen er sendt — "Tjek bekræftelse" (fallback; bekræftelsen registreres ellers automatisk), "Send mail igen" og
//    "Skift e-mailadresse".
//  - "verified": "✓ Din e-mail er bekræftet" og "Fortsæt opsætning", som åbner
//    onboarding på det næste manglende trin (onboarding_step). Det er også
//    siden, bekræftelseslinket i mailen lander på (redirect_to = appen).
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

  // Bekræftelsen registreres automatisk, brugeren skal ikke selv erklære den: (1) åbnes linket i en anden fane i samme browser, gemmer
  // den fane sessionen i localStorage; (2) vender brugeren tilbage til appen fra mailen, tjekkes der stille (højst hvert 8. sekund).
  // Åbnes linket direkte i appen, går brugeren videre til onboarding uden at komme forbi denne skærm (useAuth.js).
  useEffect(() => {
    if (verified) return undefined;
    let last = 0;
    const onStorage = (e) => { if (e.key === "as_session" && e.newValue) checkEmailVerified({ silent: true }); };
    const onVisible = () => {
      if (document.visibilityState !== "visible" || Date.now() - last < 8000) return;
      last = Date.now();
      checkEmailVerified({ silent: true });
    };
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.removeEventListener("storage", onStorage); document.removeEventListener("visibilitychange", onVisible); };
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
            <div className="verify-title">Din e-mail er bekræftet</div>
            <div className="verify-text">Fortsæt opsætningen i EatSafe for at gøre din profil klar.</div>
          </div>
        ) : (
          <div>
            <div className="verify-icon" aria-hidden="true">
              <Icon name="mail" size={24} color="var(--green)" />
            </div>
            <div className="verify-title">Bekræft din e-mail</div>
            <div className="verify-text">Vi har sendt et bekræftelseslink til</div>
            <div className="verify-email">{verifyEmail}</div>
            <div className="verify-text">Klik på linket i mailen for at fortsætte opsætningen.</div>
          </div>
        )}
      </div>

      {verified ? (
        <button className="btn welcome-btn" onClick={continueAfterVerify}>
          Fortsæt →
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
          <button className="btn welcome-btn" onClick={() => checkEmailVerified()} disabled={verifyLoading}>
            {verifyLoading ? "Tjekker…" : "Tjek bekræftelse"}
          </button>
          <button className="btn welcome-btn-ghost" onClick={resendVerification} disabled={verifyLoading || resendCooldown > 0}>
            {resendCooldown > 0 ? `Send mail igen (${resendCooldown} s)` : "Send mail igen"}
          </button>
          <div className="verify-links">
            <TextLink onClick={changeVerifyEmail}>Skift e-mailadresse</TextLink>
            <div className="verify-help">Kan du ikke finde mailen? Tjek din spammappe.</div>
          </div>
        </>
      )}
    </div>
  );
}
