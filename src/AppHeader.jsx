// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// AppHeader.jsx — EatSafes fælles, genbrugelige app-header (27. sept. 2026,
// brugerens eksplicitte "Opret én fælles/genbrugelig header-komponent og
// brug præcis samme [højde/margin/logo/BETA/Feedback/hamburger] på alle
// primære faner"). Udtrukket fra App.jsx, hvor den før lå som ét inlinet
// <header>-blok — samme markup/adfærd som før, nu blot navngivet og
// genbrugelig i stedet for en anonym closure inde i App-komponenten.
//
// Rendres ÉT sted i App.jsx (ikke duplikeret pr. skærm), og vises derfor
// allerede identisk på Scan/Historik/Indkøbsliste og alle øvrige
// hovedfaner — ingen skærm har sin egen kopi. Skjules under onboarding
// (isOnboard) og Madpas' tjener-visning (madpasWaiterView), hvor en anden
// header-logik gælder.
//
// Undersider med egen "tilbageknap + titel"-navigation (fx Allergileksikon,
// Restaurantguide, Rediger familiemedlem) renderer FORTSAT denne header
// øverst, uændret — kun deres eget indhold nedenfor har en ekstra,
// skærm-specifik back-button-række. Ikke ændret i denne omgang, se
// CLAUDE.md's note om punkt 6 i brief'en.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { SCREENS } from "./constants.jsx";

// Skærme hvor hamburger-knappen får en lille grøn prik — brugeren er "inde
// i" en af menuens destinationer, så prikken markerer at menuen har en
// aktiv/relevant tilstand at vende tilbage til.
const MENU_DOT_SCREENS = [
  SCREENS.PROFILE, SCREENS.EDITPROFILE, SCREENS.EDITPREFERENCES, SCREENS.HISTORY,
  SCREENS.FAVORITES, SCREENS.FAMILY, SCREENS.ADMIN, SCREENS.MADPAS,
  SCREENS.RESTAURANTGUIDE, SCREENS.RECIPES, SCREENS.KNOWLEDGE,
];

export default function AppHeader({ screen, onFeedback, onMenu }) {
  return (
    <header className="topbar">
      {/* 27. sept. 2026, "Opdater EatSafe-headeren"-brief: scanner-/
          stregkodeikonet er fjernet fra headerens branding — det er nu
          udelukkende et FUNKTIONSikon (Scan-knappen, bundnavigationen),
          ikke en del af logoet her. Headeren viser derfor kun tekstlogoet
          "EatSafe" (samme faste "Eat"=mørk/"Safe"=grøn-farvepar som før),
          IKKE det fulde, låste EatSafeLogo-billedeaktiv (symbol+ordmærke)
          som stadig bruges uændret på velkomst-/login-/onboarding-skærmene
          — kun DENNE ene, kompakte header-kontekst er undtaget fra det
          faste brandasset, som brugeren eksplicit bad om. Størrelsen er
          øget ca. 20-25% (24px, op fra logo-billedets tidligere 22px
          visuelle højde), semibold/bold vægt, så brandet står tydeligere
          uden at dominere siden. */}
      <div className="topbar-logo">
        <span className="topbar-wordmark">Eat<span className="topbar-wordmark-safe">Safe</span></span>
        <div className="topbar-beta">BETA</div>
      </div>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        {/* Feedback-knap */}
        <button onClick={onFeedback}
          style={{ background:"var(--paper2)", border:"1px solid var(--border2)", borderRadius:100, padding:"9px 15px", fontFamily:"var(--f)", fontSize:12.5, fontWeight:700, color:"var(--ink2)", cursor:"pointer", display:"flex", alignItems:"center", gap:6, boxShadow:"var(--sh)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          Feedback
        </button>
        {/* Menu-knap — profil, familie, favoritter, historik, opskrifter, viden m.m. */}
        <button onClick={onMenu} aria-label="Åbn menu"
          style={{ position:"relative", background:"var(--paper2)", border:"1px solid var(--border2)", borderRadius:"50%", width:38, height:38, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"var(--sh)" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2.2"><path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>
          {MENU_DOT_SCREENS.includes(screen) && (
            <span style={{ position:"absolute", top:-1, right:-1, width:9, height:9, borderRadius:"50%", background:"var(--green)", border:"1.5px solid var(--paper)" }} />
          )}
        </button>
      </div>
    </header>
  );
}
