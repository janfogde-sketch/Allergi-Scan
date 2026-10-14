// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// BootScreen.jsx — SCREENS.BOOT (G6, 14. okt. 2026)
// Vises ved appstart, mens login gendannes og onboarding-status hentes (useAuth.js). Den er tom de første sekunder, så et
// normalt opstart ikke blinker. Tager det mere end ca. 6 s (ingen forbindelse, serveren svarer ikke), vises en forklaring
// med "Prøv igen" og "Log ind igen", så skærmen aldrig står tom uden udvej.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from "react";
import { StateBox } from "./SharedComponents.jsx";
import { TextLink } from "./DesignSystem.jsx";

export const BOOT_HELP_DELAY_MS = 6000;

export default function BootScreen({ onRetry, onLogin }) {
  const [showHelp, setShowHelp] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowHelp(true), BOOT_HELP_DELAY_MS);
    return () => clearTimeout(t);
  }, []);
  if (!showHelp) return null;
  return (
    <div className="screen fade-in" style={{ paddingTop: 32 }}>
      <StateBox icon="wifiOff" title="Vi kan ikke åbne din konto lige nu."
        text="Tjek din forbindelse, og prøv igen." actionLabel="Prøv igen" onAction={onRetry} />
      <TextLink variant="muted" block style={{ minHeight: 44, marginTop: 12 }} onClick={onLogin}>Log ind igen</TextLink>
    </div>
  );
}
