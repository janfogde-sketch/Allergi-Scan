// @ts-nocheck
import React from "react";
import { SCREENS, DIETS_ENABLED } from "./constants.jsx";
import { EatSafeLogo, Icon } from "./SharedComponents.jsx";
import { WelcomeIntro, WELCOME_BENEFITS } from "./OnboardingParts.jsx";

export function renderWelcome(c) {
  const { hasPendingJoinList, onActivatePreview, setAuthTab, setOnboardStep, setScreen } = c;
  return (
          <div className="welcome-screen fade-in">
            {/* Usynlig spacer med ulige flex-grow-vægt (28. sept. 2026,
                "FINAL POLISH") — se .welcome-vspace-top/-bottom i theme.jsx
                for hvorfor: flytter kompositionens lodrette tyngdepunkt en
                anelse op uden at ændre selve layoutet. */}
            <div className="welcome-vspace-top" aria-hidden="true" />

            {/* Logo + værdiforslag (25. sept. 2026-brief: kort, tydelig
                value proposition i stedet for den tidligere slogan-agtige
                "Scan. Tjek. Spis trygt."). Teksten udvidet 28. sept. 2026
                ("FINAL POLISH") til også at nævne kosthensyn, ikke kun
                allergier — matcher at appen også dækker diæter/E-numre. */}
            <div className="welcome-logo-wrap">
              <EatSafeLogo variant="horizontal" size={56} />
              <div className="brand-slogan">Mere tryghed i hverdagen</div>
              <div className="welcome-tagline">{DIETS_ENABLED ? "Scan produkter og se straks, om de passer til dine allergier og kosthensyn." : "Scan produkter og se straks, om de passer til dine allergier og intolerancer."}</div>
            </div>

            {/* 3 fordele */}
            <div className="welcome-benefits">
              {WELCOME_BENEFITS.map(([icon, label]) => (
                <div key={label} className="welcome-benefit">
                  <div className="welcome-benefit-icon"><Icon name={icon} size={20} color="var(--green)" /></div>
                  <div className="welcome-benefit-label">{label}</div>
                </div>
              ))}
            </div>

            {/* Delt indkøbsliste venter */}
            {hasPendingJoinList && (
              <div style={{ background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:12, padding:"12px 14px", marginBottom:16, textAlign:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, fontWeight:800, color:"var(--green)" }}><Icon name="cart" size={13} color="var(--green)" /> Du er blevet inviteret til en indkøbsliste</div>
                <div style={{ fontSize:12, color:"var(--green)", marginTop:2 }}>Opret en gratis konto. Bagefter forklarer vi, hvad der deles, og du bestemmer selv, om du vil tilslutte. Du ser kun den ene liste, ikke nogens allergier.</div>
              </div>
            )}

            {/* CTA — primær (grøn, mest fremtrædende) + sekundær */}
            <WelcomeIntro setScreen={setScreen} setAuthTab={setAuthTab} />

            {/* Tertiær tekstlink, ikke en knap (25. sept. 2026-brief). Kun i
                den delte Artifact-preview-build (se CLAUDE.md), aldrig i den
                rigtige app — login mod Supabase er upålideligt fra denne
                kontekst (andet domæne end produktion), så en preview-only
                genvej springer login over. Selve mock-opsætningen (bruger,
                allergener, produkt-cache, indkøbsliste) sker i App.jsx's
                activatePreviewMode — se dens kommentar for hvorfor logikken
                bor der og ikke her. */}
            {import.meta.env.MODE === "artifact-preview" && (
              <button className="welcome-link" style={{ marginTop:12 }}
                onClick={onActivatePreview}>
                Se app uden login (preview)
              </button>
            )}
            {/* Preview: start onboarding fra trin 1 uden konto og uden e-mailbekræftelse (intet gemmes, se
                previewNoSession i useOnboarding.js). Vises ALDRIG i produktion. */}
            {import.meta.env.MODE === "artifact-preview" && (
              <button className="welcome-link" style={{ marginTop:8 }}
                onClick={() => { setOnboardStep(1); setScreen(SCREENS.ONBOARD); }}>
                Start onboarding (preview)
              </button>
            )}

            {/* Ingen juridisk tekst på velkomstsiden: brugeren accepterer intet her. Vilkår og privatlivspolitik vises først ved
                konto-oprettelsen (Ny bruger-fanen). */}

            {/* Samme spacer-mekanisme som toppen, se kommentar ovenfor —
                giver resten af den ledige plads (0.62:1-vægten, se
                theme.jsx). */}
            <div className="welcome-vspace-bottom" aria-hidden="true" />
          </div>
  );
}
