// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// BootScreen.jsx — SCREENS.BOOT (G6, 14. okt. 2026; ny opførsel 17. okt. 2026)
// Vises ved appstart, mens login gendannes og onboarding-status hentes (useAuth.js).
//  - Straks: logoets stregkodemærke med fluebenet (LogoLoader, samme animation som scan-opslaget), i samme størrelse og midt på skærmen som iOS' opstartsbillede; aldrig en tom skærm.
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
import { createPortal } from "react-dom";
import { StateBox, LogoLoader } from "./SharedComponents.jsx";

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
  // Samme størrelse og placering som iOS' opstartsbillede (scripts/build-splash.py: mærkets bredde = 18 % af skærmbredden, midt på skærmen),
  // så overgangen fra opstartsbilledet til indlæsningen ikke hopper. Mærket (stregerne fylder ca. 75,7 % af svg'ens bredde) er derfor 23,8 vw.
  // Portal: .screen.fade-in fanger position:fixed (arkitekturregel 4), og ingen fade-in, så logoet står stille fra første billede.
  return createPortal(
    <div role="status" aria-live="polite"
      style={{ position: "fixed", inset: 0, zIndex: 20, background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <LogoLoader size="23.8vw" startDrawn />
      <span style={{ position: "absolute", left: 16, right: 16, top: "calc(50% + 14vw)", fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
        {slow ? "Det tager lidt længere end normalt …" : <span className="sr-only">Åbner EatSafe …</span>}
      </span>
    </div>,
    document.body
  );
}
