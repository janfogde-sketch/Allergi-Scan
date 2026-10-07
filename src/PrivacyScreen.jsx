// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// PrivacyScreen.jsx — Privatlivspolitik som en almindelig underside i appen.
//
// Se TermsScreen.jsx's filhoved for header-mønsteret (egen sticky
// .legal-topbar i stedet for AppHeader, tilbagepil til legalReturnScreen).
//
// Teksten bor ÉT sted: src/legalText/privacy.js. Skærmen læser den via LegalContent.jsx,
// og public/privacy.html genereres af scripts/build-legal-pages.mjs. Ret kun kilden.
//
// Åbne, interne punkter i politikken står KUN i admin-ticketen
// "[Privatlivspolitik · IKKE FÆRDIG]" i feedback_tickets — aldrig her, da
// både JS-bundlen og privacy.html er offentligt tilgængelige.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { Icon } from "./SharedComponents.jsx";
import LegalContent from "./LegalContent.jsx";
import doc from "./legalText/privacy.js";

export default function PrivacyScreen({ onBack }) {
  return (
    <>
      <header className="legal-topbar">
        <button onClick={onBack} aria-label="Tilbage" className="legal-topbar-back">
          <span className="legal-topbar-back-circle">
            <Icon name="chevronLeft" size={17} color="var(--ink)" />
          </span>
        </button>
        <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)" }}>Privatlivspolitik</div>
      </header>
      {/* paddingTop matcher .legal-topbar's egen renderede højde (header er
          position:fixed, tager ikke plads i normal flow) + lidt luft. */}
      <div className="screen fade-in" style={{ paddingTop:"calc(75px + env(safe-area-inset-top))" }}>
        <LegalContent doc={doc} />
      </div>
    </>
  );
}
