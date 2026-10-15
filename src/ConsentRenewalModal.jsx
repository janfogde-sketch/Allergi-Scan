// @ts-nocheck
// Fornyet samtykke ved appstart (13. okt. 2026). Er brugerens sidste ja givet på en ældre version af samtykketeksten/politikken
// (`consent.stale`), vises denne ene modal, før appen kan bruges. Genbruger den eksisterende samtykketekst (HealthConsentBox).
// Svarer brugeren ikke, ændres intet: det gamle samtykke og dataene bevares, og modalen kommer igen ved næste åbning.
import React, { useState } from "react";
import { useHealthConsent } from "./useHealthConsent.js";
import HealthConsentBox from "./HealthConsentBox.jsx";
import { ConfirmDialog, showToast } from "./SharedComponents.jsx";
import { SCREENS } from "./constants.jsx";

// Skærme, hvor modalen aldrig vises: login/onboarding (samtykket gives dér) og selve politik-siderne (så brugeren kan læse dem først).
const HIDDEN_ON = new Set([
  SCREENS.WELCOME, SCREENS.LOGIN, SCREENS.ONBOARD, SCREENS.BOOT, SCREENS.VERIFYEMAIL, SCREENS.RESETPASSWORD, SCREENS.AUTHCONFIRM, SCREENS.TERMS, SCREENS.PRIVACY,
]);

export default function ConsentRenewalModal({ screen, onboarded, openLegal }) {
  const consent = useHealthConsent();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  if (!onboarded || HIDDEN_ON.has(screen) || !consent.loaded || !consent.stale) return null;

  const accept = async () => {
    setBusy(true);
    try {
      await consent.give();
    } catch {
      showToast("Dit samtykke kunne ikke gemmes. Prøv igen.", "error");
    }
    setBusy(false);
  };
  const withdraw = async () => {
    setConfirmWithdraw(false);
    setBusy(true);
    try {
      await consent.withdraw();
      showToast("Samtykket er trukket tilbage, og dine helbredsoplysninger er slettet.");
      setTimeout(() => window.location.reload(), 900);
    } catch {
      showToast("Samtykket kunne ikke trækkes tilbage. Prøv igen.", "error");
      setBusy(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:10000, background:"rgba(21,32,26,.6)", display:"flex", alignItems:"center", justifyContent:"center",
      padding:"max(20px, env(safe-area-inset-top)) 20px max(20px, env(safe-area-inset-bottom))", overflowY:"auto" }}>
      <div role="dialog" aria-modal="true" aria-labelledby="consent-renew-title"
        style={{ background:"var(--sheet)", borderRadius:20, padding:"28px 22px 22px", width:"100%", maxWidth:400, boxSizing:"border-box", margin:"auto" }}>
        <div id="consent-renew-title" style={{ fontSize:20, fontWeight:800, color:"var(--ink)", marginBottom:10, letterSpacing:"-.3px" }}>
          Vi har opdateret vores vilkår for dine oplysninger
        </div>
        <p style={{ fontSize:14, color:"var(--ink2)", lineHeight:1.65, margin:"0 0 16px" }}>
          Teksten om, hvordan EatSafe behandler dine allergioplysninger, er ændret. Læs den, og bekræft, at du stadig er med.
        </p>
        <div style={{ marginBottom:16 }}>
          <HealthConsentBox id="renew-consent" checked={checked} onChange={setChecked} openPrivacy={() => openLegal(SCREENS.PRIVACY)} />
        </div>
        <button className="btn btn-primary btn-full" onClick={accept} disabled={!checked || busy}>Jeg accepterer</button>
        <button type="button" className="link-green" style={{ display:"block", margin:"14px auto 0", background:"none", border:"none", fontSize:13 }}
          disabled={busy} onClick={() => setConfirmWithdraw(true)}>Jeg vil ikke give samtykke</button>
        {confirmWithdraw && (
          <ConfirmDialog title="Træk samtykket tilbage?"
            message="Dine allergi- og helbredsoplysninger og din scanningshistorik slettes permanent."
            confirmLabel="Træk tilbage og slet"
            onCancel={() => setConfirmWithdraw(false)} onConfirm={withdraw} />
        )}
      </div>
    </div>
  );
}
