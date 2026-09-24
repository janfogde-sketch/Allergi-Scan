// @ts-nocheck
import React from "react";
import { Icon } from "./SharedComponents.jsx";
import { UI } from "./styleUtils.js";

const BETA_INTRO_STEPS = [
  {
    emoji: "🧪",
    title: "Velkommen til EatSafe Beta",
    body: "Du er en af de første til at prøve EatSafe. Vi er glade for at have dig med — og vi er ærlige: appen er ikke færdig endnu.\n\nSom beta-bruger hjælper du os med at finde fejl, forbedre brugeroplevelsen og sikre at appen virker for rigtige allergiramte.",
  },
  {
    emoji: "message",
    title: "Giv os din mening",
    body: "Tryk på Feedback-knappen øverst i appen når du støder på noget — en fejl, noget der ser mærkeligt ud, eller en idé til forbedring.\n\nVi læser alt. Din feedback er det vigtigste redskab vi har i denne fase.",
  },
  {
    emoji: "info",
    title: "Brug hjælp-knappen",
    body: "Er du i tvivl om hvordan noget virker? Tryk på ? øverst — der finder du en kort guide til den skærm du står på.\n\nHvis du stadig er i tvivl, brug Feedback og skriv til os.",
  },
  {
    emoji: "warning",
    title: "En vigtig bemærkning",
    body: "EatSafe er under udvikling. Allergendata kan mangle eller være ukorrekte.\n\nTjek ALTID den fysiske emballage — appen er et hjælpeværktøj, ikke en garanti. Vi arbejder på at gøre dataene så præcise som muligt.",
  },
];

// ── Beta-intro — 4-trins velkomstoverlay vist første gang (eller via topbar) ──
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
            {step.emoji === "🧪" ? <span style={{ fontSize:52 }}>{step.emoji}</span> : <Icon name={step.emoji} size={44} color="var(--green)" />}
          </div>
          <div style={{ fontSize:20, fontWeight:800, color:"var(--ink)", marginBottom:14,
            letterSpacing:"-.3px" }}>{step.title}</div>
          <div style={{ fontSize:14, color:"var(--ink2)", lineHeight:1.7,
            whiteSpace:"pre-line" }}>{step.body}</div>
        </div>

        {/* Buttons */}
        <div style={UI.udflex_fdcolumn_g10}>
          <button onClick={() => isLast ? dismiss() : setBetaIntroStep(s => s + 1)}
            style={{ width:"100%", padding:"14px", background:"var(--green)",
              border:"none", borderRadius:12, fontFamily:"var(--f)", fontSize:15,
              fontWeight:800, color:"var(--on-green)", cursor:"pointer" }}>
            {isLast ? "Kom i gang →" : "Næste →"}
          </button>
          {!isLast && (
            <button onClick={dismiss}
              style={{ width:"100%", padding:"10px", background:"transparent",
                border:"none", fontFamily:"var(--f)", fontSize:12,
                color:"var(--muted)", cursor:"pointer" }}>
              Spring over
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
