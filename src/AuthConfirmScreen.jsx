// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// AuthConfirmScreen.jsx — "Fortsæt som x@y.dk" (15. okt. 2026, sikkerhedsfund S4)
//
// Et link fra en mail (bekræft e-mail, glemt adgangskode, invitation) logger
// først ind, når brugeren har set, hvilken konto det er, og trykket Fortsæt.
// Så kan et fremmed link ikke i det skjulte logge brugeren ind på en anden
// konto. Logikken bor i useAuth.js (confirmAuthLink/cancelAuthLink).
// Samme logo, baggrund og knapper som Bekræft din e-mail.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import { EatSafeLogo, Icon } from "./SharedComponents.jsx";
import { ErrorMessage, TextLink } from "./DesignSystem.jsx";
import { useAuthContext } from "./AuthContext.jsx";

const TITLES = {
  recovery: "Nulstil adgangskode",
  signup: "Bekræft din e-mail",
  email: "Bekræft din e-mail",
  invite: "Accepter invitationen",
  email_change: "Bekræft ny e-mail",
};

export default function AuthConfirmScreen() {
  const { pendingAuthLink, authConfirmLoading, authConfirmError, authConfirmDone, confirmAuthLink, cancelAuthLink } = useAuthContext();
  const link = pendingAuthLink;
  const email = link?.email || "";
  const title = TITLES[link?.type] || "Log ind";

  return (
    <div className="login-wrap verify-wrap fade-in">
      <div className="welcome-logo-wrap">
        <EatSafeLogo variant="horizontal" size={56} />
      </div>

      {/* Uden link (kort øjeblik, mens appen skifter skærm efter Fortsæt) vises kun logoet. */}
      {!authConfirmDone && !link ? null : authConfirmDone ? (
        <>
          <div className="login-card verify-card" role="status">
            <div className="verify-icon verify-icon-ok" aria-hidden="true">
              <Icon name="check" size={24} color="var(--green)" />
            </div>
            <div className="verify-title">Tak, linket er bekræftet</div>
            <div className="verify-text">Bekræft også linket i mailen til din anden e-mailadresse, hvis du har fået to mails.</div>
          </div>
          <button className="btn welcome-btn" onClick={cancelAuthLink}>Fortsæt</button>
        </>
      ) : (
        <>
          <div className="login-card verify-card">
            <div className="verify-icon" aria-hidden="true">
              <Icon name={link.type === "recovery" ? "key" : "mail"} size={24} color="var(--green)" />
            </div>
            <div className="verify-title">{title}</div>
            {email ? (
              <div className="verify-text">Du er ved at logge ind som <strong style={{ overflowWrap: "anywhere" }}>{email}</strong>.</div>
            ) : (
              <div className="verify-text">Tryk på Fortsæt for at bruge linket fra din mail.</div>
            )}
          </div>
          <ErrorMessage>{authConfirmError}</ErrorMessage>
          <button className="btn welcome-btn" onClick={confirmAuthLink} disabled={authConfirmLoading}>
            {authConfirmLoading ? "Et øjeblik…" : "Fortsæt"}
          </button>
          <div className="verify-links">
            <TextLink onClick={cancelAuthLink}>{email ? "Det er ikke mig" : "Annullér"}</TextLink>
          </div>
        </>
      )}
    </div>
  );
}
