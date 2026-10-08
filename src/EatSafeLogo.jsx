// @ts-nocheck
import eatsafeLogoHorizontal from "./assets/logo/eatsafe-logo-horizontal.svg";
import eatsafeLogoHorizontalMono from "./assets/logo/eatsafe-logo-horizontal-mono.svg";
import eatsafeSymbol from "./assets/logo/eatsafe-symbol.svg";
import eatsafeSymbolMono from "./assets/logo/eatsafe-symbol-mono.svg";

// ─── EATSAFE-LOGO (nu låst brandasset, 28. sept. 2026) ──────────────────────
// Ét fast sæt vektor-assets (src/assets/logo/, eksporteret fra den godkendte
// master-pakke) — erstatter BÅDE den tidligere live-tekst-rekonstruktion
// ("Eat"+grøn "Safe" i DM Sans) OG den tidligere håndtegnede inline-SVG her
// (9 tynde bars, anden farvepalet) — begge var reelt egne fortolkninger af
// logoet, netop det brugeren bad om at undgå ("ingen nye variationer eller
// AI-fortolkninger"). `variant`:
// "horizontal" (stregkode-mærke + ordmærke, farve) — standard, brug hvor der
// er plads til et bredt logo (velkommen/login/topbar) — `size` er højden,
// bredden følger automatisk (billedforhold ~3.33:1).
// "symbol" (kun stregkode-mærket, farve) — kompakte steder uden plads til
// ordmærket — `size` er både bredde og højde (kvadratisk).
// "-mono"-udgaver af begge til ren sort/hvid-kontekst (fx print/PDF).
const EATSAFE_LOGO_SRC = {
  horizontal: eatsafeLogoHorizontal,
  "horizontal-mono": eatsafeLogoHorizontalMono,
  symbol: eatsafeSymbol,
  "symbol-mono": eatsafeSymbolMono,
};
export const EatSafeLogo = ({ variant = "horizontal", size = 28, style, className }) => {
  const isSymbol = variant === "symbol" || variant === "symbol-mono";
  return (
    <img src={EATSAFE_LOGO_SRC[variant]} alt="EatSafe" draggable={false} className={className}
      style={{ height: size, width: isSymbol ? size : "auto", display: "block", ...style }} />
  );
};

// ─── EATSAFE-WORDMARK (tekst-only, 29. sept. 2026, "Master-specifikation for
// logo og branding i headers") ────────────────────────────────────────────
// Kun teksten "EatSafe", ingen scanner-/stregkode-symbol og ingen BETA-badge
// — badge'n er bevidst IKKE en del af denne komponent, da den kun skal vises
// visse steder (appens headers), ikke andre (onboarding), se AppHeader.jsx/
// OnboardingScreen.jsx for hvordan de hver især komponerer den. Farver/
// vægt/kerning styres af --brand-ink/--green +
// .topbar-wordmark(-safe) i theme.jsx — PRÆCIS samme værdier som selve
// billedlogoets (EatSafeLogo ovenfor) indlejrede SVG-farver, hentet direkte
// fra master-vektorfilerne (src/assets/logo/*.svg — "Safe" er ensfarvet
// #0F7D4F siden 7. okt. 2026), ikke gættet ud fra et screenshot og ikke appens
// almindelige --ink/--green-UI-tokens. Dette er den ENE wordmark-komponent
// for hele appen — brug den overalt tekst-logoet skal vises (aldrig en ny,
// lignende variant), så "Eat"/"Safe"-farve, font, vægt, kerning og
// proportioner er identiske alle steder.
export const EatSafeWordmark = () => (
  <span className="topbar-wordmark">Eat<span className="topbar-wordmark-safe">Safe</span></span>
);
