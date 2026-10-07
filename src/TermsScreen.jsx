// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// TermsScreen.jsx — Brugsvilkår som en almindelig underside i appen.
//
// Egen, selvstændig sticky header (.legal-topbar, se theme.jsx) i stedet for
// AppHeader — se App.jsx's isLegalPage-kommentar for hvorfor: siden kan
// åbnes BÅDE fra kontekster med AppHeader (Indstillinger/Profil) og uden
// (Velkommen/Log ind, hvor AppHeader er skjult under onboarding), så den
// viser altid denne ene header, uanset indgang. Tilbagepilen fører til
// legalReturnScreen (den skærm der åbnede siden via openLegal i
// NavigationContext), IKKE et fast mål — se App.jsx.
//
// Teksten bor ÉT sted: src/legalText/terms.js. Skærmen læser den via LegalContent.jsx,
// og public/terms.html genereres af scripts/build-legal-pages.mjs. Ret kun kilden.
//
// Åbne, interne punkter i vilkårene står KUN i admin-ticketen
// "[Brugsvilkår · IKKE FÆRDIGE]" i feedback_tickets — aldrig her, da både
// JS-bundlen og terms.html er offentligt tilgængelige.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { Icon } from "./SharedComponents.jsx";
import LegalContent from "./LegalContent.jsx";
import doc from "./legalText/terms.js";

export default function TermsScreen({ onBack }) {
  return (
    <>
      <header className="legal-topbar">
        <button onClick={onBack} aria-label="Tilbage" className="legal-topbar-back">
          <span className="legal-topbar-back-circle">
            <Icon name="chevronLeft" size={17} color="var(--ink)" />
          </span>
        </button>
        <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)" }}>Brugsvilkår</div>
      </header>
      {/* paddingTop matcher .legal-topbar's egen renderede højde (header er
          position:fixed, tager ikke plads i normal flow) + lidt luft. */}
      <div className="screen fade-in" style={{ paddingTop:"calc(75px + env(safe-area-inset-top))" }}>
        <LegalContent doc={doc} />
      </div>
    </>
  );
}
