// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// BootScreen.jsx — SCREENS.BOOT (G6, 14. okt. 2026; ny opførsel 17. okt. 2026)
// Vises ved appstart, mens login gendannes og onboarding-status hentes (useAuth.js).
//  - Straks: et diskret indlæsningsikon (aldrig en tom skærm).
//  - Efter ca. 6 s uden svar: kun en rolig statusbesked. "Prøv igen" vises ikke, mens det oprindelige forsøg stadig kører; knappen kommer først
//    sammen med en konstateret fejl eller timeout (failure). OBS: uden timeout i useAuth.js (kræver Jans godkendelse) kan et hængende forsøg
//    derfor ikke afbrydes af brugeren.
//  - Først når en fejl er konstateret (failure), vises den passende fejlboks. Fejlbeskeden følger årsagen:
//      offline  → "Ingen forbindelse"
//      server   → "EatSafe kunne ikke starte" (tjenesten svarer ikke eller fejler; ukendte fejl hører også hertil, aldrig "ingen forbindelse")
//      expired  → "Du skal logge ind igen" (sessionen er konstateret ugyldig og kan ikke fornyes)
//    Ved offline og server er "Prøv igen" den eneste handling (ingen login, intet ryddes). Kun ved expired tilbydes "Log ind".
// Hvilken årsag der er konstateret, bestemmes af useAuth.js (kræver Jans godkendelse); uden failure vises kun indlæsning.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from "react";
import { StateBox } from "./SharedComponents.jsx";

export const BOOT_HELP_DELAY_MS = 6000;

const FAILURES = {
  offline: { icon: "wifiOff", title: "Ingen forbindelse", text: "Tjek din internetforbindelse, og prøv igen." },
  server: { icon: "warning", title: "EatSafe kunne ikke starte", text: "Vi kunne ikke få kontakt til tjenesten. Prøv igen om lidt." },
  expired: { icon: "info", title: "Du skal logge ind igen", text: "Din session er udløbet. Log ind for at fortsætte.", actionLabel: "Log ind" },
};

export default function BootScreen({ failure = null, onRetry, onLogin }) {
  const [slow, setSlow] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const retryingRef = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), BOOT_HELP_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Gentagne tryk, mens et forsøg behandles, starter ikke flere forsøg (onRetry må returnere et løfte, der afsluttes, når forsøget er slut).
  const retry = async () => {
    if (retryingRef.current) return;
    retryingRef.current = true; setRetrying(true);
    try { await onRetry?.(); } finally { retryingRef.current = false; setRetrying(false); }
  };

  const f = failure ? (FAILURES[failure] || FAILURES.server) : null;
  if (f) {
    const isExpired = failure === "expired";
    return (
      <div className="screen fade-in" style={{ paddingTop: 24 }}>
        <StateBox icon={f.icon} title={f.title} text={f.text}
          actionLabel={isExpired ? f.actionLabel : (retrying ? "Prøver igen …" : "Prøv igen")}
          onAction={isExpired ? onLogin : retry} actionDisabled={!isExpired && retrying} />
      </div>
    );
  }
  return (
    <div className="screen fade-in" style={{ paddingTop: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 24 }} role="status" aria-live="polite">
        <div className="spinner" style={{ width: 24, height: 24 }} aria-hidden="true" />
        <span style={{ fontSize: 13, color: "var(--muted)", minHeight: 20, textAlign: "center" }}>
          {slow ? "Det tager lidt længere end normalt …" : <span className="sr-only">Åbner EatSafe …</span>}
        </span>
      </div>
    </div>
  );
}
