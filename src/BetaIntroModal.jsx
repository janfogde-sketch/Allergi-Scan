// @ts-nocheck
import React from "react";
import { Icon } from "./SharedComponents.jsx";

// Reduceret fra 4 til 2 slides (25. sept. 2026, brugerfeedback) — "Brug
// hjælp-knappen"-sliden er fjernet, da det globale "?" ikke længere findes
// (kontekstuel hjælp i stedet, se CLAUDE.md afsnit 3), og den separate
// feedback-slide er slået sammen med velkomst-sliden i stedet for at være
// et selvstændigt trin. Ingen emoji (var tidligere 🧪) — samme SVG-ikon-
// mønster som resten af appen.
const BETA_INTRO_STEPS = [
  {
    icon: "bug",
    iconColor: "var(--green)",
    title: "Velkommen til EatSafe Beta",
    body: "Du er blandt de første til at prøve EatSafe. Appen er stadig under udvikling, og din feedback hjælper os med at gøre den bedre.\n\nFinder du en fejl eller har en idé, kan du altid sende feedback fra menuen.",
    cta: "Næste →",
  },
  {
    icon: "warning",
    iconColor: "var(--red)",
    title: "Vigtig sikkerhedsinformation",
    body: "EatSafe er et hjælpemiddel. Produkt- og allergendata kan være mangelfulde, forældede eller forkerte.\n\nKontrollér altid ingredienslisten og allergenoplysningerne på den fysiske emballage, før du spiser produktet.",
    cta: "Jeg forstår – kom i gang →",
  },
];

// ── Beta-intro — 2-trins velkomstoverlay. Vist automatisk (kun første
// gang, lige efter onboarding trin 5, se finishOnboard-wrapperen i
// App.jsx) eller manuelt via "Om EatSafe Beta" i ProfileMenu.jsx. Ingen
// "Spring over" — sikkerhedssliden (trin 2) SKAL ses, og med kun to korte
// trin i alt er en separat spring-over-vej ikke nødvendig for trin 1
// heller. ──────────────────────────────────────────────────────────────
export default function BetaIntroModal({ betaIntroStep, setBetaIntroStep, setBetaIntroSeen }) {
  const steps = BETA_INTRO_STEPS;
  const step = steps[betaIntroStep];
  const isLast = betaIntroStep === steps.length - 1;
  const dismiss = () => setBetaIntroSeen(true);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:10000, background:"rgba(0,0,0,.92)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <div style={{ background:"var(--sheet)", borderRadius:20, padding:"28px 22px 24px",
        width:"100%", maxWidth:400, boxSizing:"border-box" }}>

        {/* Progress dots */}
        <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:24 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ width: i === betaIntroStep ? 20 : 6, height:6, borderRadius:3,
              background: i === betaIntroStep ? "var(--green)" : "var(--border2)",
              transition:"all .3s" }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ marginBottom:16, display:"flex", justifyContent:"center" }}>
            <Icon name={step.icon} size={44} color={step.iconColor} />
          </div>
          <div style={{ fontSize:20, fontWeight:800, color:"var(--ink)", marginBottom:14,
            letterSpacing:"-.3px" }}>{step.title}</div>
          <div style={{ fontSize:14, color:"var(--ink2)", lineHeight:1.7,
            whiteSpace:"pre-line" }}>{step.body}</div>
        </div>

        {/* Knap — ingen "Spring over" (se komponent-kommentaren ovenfor) */}
        <button onClick={() => isLast ? dismiss() : setBetaIntroStep(s => s + 1)}
          style={{ width:"100%", padding:"14px", background:"var(--green)",
            border:"none", borderRadius:12, fontFamily:"var(--f)", fontSize:15,
            fontWeight:800, color:"var(--on-green)", cursor:"pointer" }}>
          {step.cta}
        </button>
      </div>
    </div>
  );
}
