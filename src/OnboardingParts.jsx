// @ts-nocheck
import React from "react";
import { SCREENS, DIETS_ENABLED } from "./constants.jsx";
import { traceEligible } from "./helpers.js";

// Delt stil for de juridiske inline-tekstlinks (brugsvilkår/privatlivs-
// politikken), 4 forekomster nedenfor — en <button> i stedet for en <a>
// (29. sept. 2026, "Opdater siderne Brugsvilkår og Privatlivspolitik"), da
// disse nu navigerer internt via openLegal i stedet for at åbne en ekstern
// side i en ny fane. Nulstiller knap-standardstile (baggrund/kant/padding/
// font), samme grønne/fede visuelle udtryk som det tidligere <a>-link.
export const LEGAL_LINK_STYLE = { background:"none", border:"none", padding:0, margin:0, font:"inherit", color:"var(--green)", fontWeight:700, textDecoration:"none", cursor:"pointer" };

export function WelcomeIntro({ setScreen, setAuthTab }) {
  const goSignup = () => { setAuthTab("signup"); setScreen(SCREENS.LOGIN); };
  const goLogin  = () => { setAuthTab("login");  setScreen(SCREENS.LOGIN); };

  // gap:8 + .welcome-btn's egen margin-bottom:12 (theme.jsx) giver et
  // samlet primær→sekundær-mellemrum på 20px (29. sept. 2026, "logo og
  // slogan skal føles som én samlet brandblok": -10px fra det tidligere
  // 30px, inden for det ønskede -8-12px) — var før gap:18, samlet 30px
  // ("Fordel indholdet mere naturligt", som overkorrigerede).
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      <button className="welcome-btn" onClick={goSignup}>Opret gratis konto</button>
      <button className="welcome-btn-ghost" onClick={goLogin}>Jeg har allerede en konto</button>
    </div>
  );
}

// 3 korte fordele med ikon (25. sept. 2026-brief) — "Tjek allergener",
// "Hurtigt svar", "Lettere indkøb". Ikonerne matcher hver sin fordel:
// shield (beskyttelse mod allergener), zap (hurtighed), cart (indkøb).
// "Undgå" → "Tjek" (samme dag, opfølgning) — "Undgå" kan lyde som en
// garanti appen ikke kan give; "Tjek" beskriver mere præcist at appen
// hjælper med VURDERINGEN, ikke selve garantien.
// "Tryggere indkøb" → "Lettere indkøb" (28. sept. 2026, "FINAL POLISH") —
// dels en kortere tekst der reelt kan stå på én linje ved siden af de to
// andre (se .welcome-benefits-kommentaren i theme.jsx), dels undgår
// "Tryggere" et kategorisk sikkerhedsløfte appen ikke kan indfri fuldt ud.
export const WELCOME_BENEFITS = [
  ["shield", "Tjek allergener"],
  ["zap",    "Hurtigt svar"],
  ["cart",   "Lettere indkøb"],
];

// Kort tekst efter allergilisten på et familiemedlems kort: "Advar ved spor" / "Kun ved ingrediens", når alle medlemmets allergener
// med sporvalg har samme valg (blandede valg vises ikke, så linjen forbliver kort). Laktose og egne valg har ingen sporvalg.
export const memberTraceNote = (m) => {
  const ids = traceEligible(m.allergens);
  if (ids.length === 0) return "";
  const direct = ids.filter(id => m.levels?.[id] === "direct_only").length;
  if (direct === 0) return " · Advar ved spor";
  if (direct === ids.length) return " · Kun ved ingrediens";
  return "";
};

// Trinnet før `step`. Trin 3 er kostpræferencer, når de er slået til (DIETS_ENABLED). Ellers er trin 3 valget "Spor"
// (hvad der skal ske, når pakken siger "kan indeholde spor af"); det springes over, hvis brugeren ingen allergier har valgt.
export const prevOnboardStep = (step, hasAllergens) => (!DIETS_ENABLED && step === 4 && !hasAllergens ? 2 : step - 1);

