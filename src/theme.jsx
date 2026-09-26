// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// theme.jsx — EatSafe designsystem (Mørkt tema)
//
// Ét sted til at styre hele appens visuelle udtryk.
// Skift tema ved at ændre THEME-objektet herunder — resten følger automatisk.
// ─────────────────────────────────────────────────────────────────────────────

import scanHeroBg from "./assets/home/scan-hero-bg.webp";

export const THEME = {
  // Baggrunde — ren hvid, ingen farvet undertone (24. sept. 2026-redesign)
  paper:   "#FFFFFF",
  paper2:  "#F3F3F1",

  // Primær tekst — mørk grøn-sort (ikke ren sort)
  ink:     "#15201A",
  ink2:    "rgba(21,32,26,.72)",
  ink3:    "rgba(21,32,26,.52)",

  // Grøn — appens ene accentfarve: sikker/success/primær CTA (låst 25. sept. 2026)
  green:      "#0E8F5A",
  greenDark:  "#08734A",
  greenGlow:  "#16A363",
  greenLt:    "rgba(14,143,90,.10)",
  greenMid:   "rgba(14,143,90,.18)",
  greenText:  "#0E8F5A",
  onGreen:    "#FFFFFF", // Tekstfarve på grøn baggrund (knapper, badges)

  // Fare — rød
  red:    "#C8402E",
  redLt:  "rgba(200,64,46,.08)",
  redMd:  "rgba(200,64,46,.18)",

  // Advarsel — amber (bruges kun til reelle advarsler, ikke dekoration)
  amber:   "#B5791A",
  amberLt: "rgba(181,121,26,.08)",
  amberMd: "rgba(181,121,26,.18)",

  // Blå — sekundær accentfarve, adskilt fra grøn: bruges til "info/tip"-indhold
  // (dagens tip, oplysningsbokse) så det visuelt skiller sig fra sikkerheds-signalet
  blue:   "#3A6EA5",
  blueLt: "rgba(58,110,165,.10)",
  blueMd: "rgba(58,110,165,.20)",

  // Neutral — grå til labels og metadata
  neutral:   "#6B7A70",
  neutralLt: "rgba(107,122,112,.12)",

  // Tekst-muted — neutral grå (ikke grønstemt)
  muted:  "rgba(21,32,26,.58)",
  muted2: "rgba(21,32,26,.40)",

  // Borders — bløde, lyse
  border:  "rgba(21,32,26,.10)",
  border2: "rgba(21,32,26,.16)",

  // Surfaces — hvide, ophøjede kort på den lyse baggrund
  surface:  "#FFFFFF",
  surface2: "#F4F4F2",
  surface3: "#FAFAF9",

  // Typografi
  font: "'DM Sans',system-ui,sans-serif",

  // Border radius
  radius: "12px",

  // Skygger — bløde og lyse, ikke sorte
  shadow:  "0 1px 0 rgba(255,255,255,.7) inset, 0 2px 8px -2px rgba(21,32,26,.10)",
  shadow2: "0 1px 0 rgba(255,255,255,.7) inset, 0 10px 22px -14px rgba(21,32,26,.18)",
  shadow3: "0 1px 0 rgba(255,255,255,.7) inset, 0 20px 44px -20px rgba(21,32,26,.24)",
};

export const appCss = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  /* Tekst — mørk grøn-sort, ikke ren sort */
  --ink:#15201A;
  --ink2:rgba(21,32,26,.78);
  --ink3:rgba(21,32,26,.62);
  /* Baggrunde — ren hvid, ingen farvet undertone (24. sept. 2026-redesign,
     se CLAUDE.md afsnit 5 — erstatter den tidligere cremet/grønlige --paper) */
  --paper:#FFFFFF;
  --paper2:#F3F3F1;
  /* Bundark/modal-overflader — hvid, til overlejringer der "svæver" over resten af skærmen */
  --sheet:#FFFFFF;
  /* Grøn — appens ene accentfarve: sikker/success/primær CTA.
     Låst som EatSafe-designsystem 25. sept. 2026 (samme palet som
     tidligere kun Scan-CTA'en brugte — se CLAUDE.md afsnit 5/7) — al
     tidligere rgba(74,222,128,...)-legacy-grøn og den gamle
     #178A50-base er udfaset til fordel for denne. */
  --green:#0E8F5A;
  --green-dark:#08734A;
  --green-logo:#0E8F5A;
  --green-glow:#16A363;
  --green-lt:rgba(14,143,90,.10);
  --green-mid:rgba(14,143,90,.18);
  --green-text:#0E8F5A;
  --green-selected-bg:#EFF9F4;
  --green-halo:#DDF4E8;
  --on-green:#FFFFFF;
  /* Borders — bløde, lyse */
  --border:rgba(21,32,26,.10);
  --border2:rgba(21,32,26,.16);
  /* Surfaces — hvide, ophøjede kort på den lyse baggrund */
  --surface:#FFFFFF;
  --surface2:#F4F4F2;
  --surface3:#FAFAF9;
  /* Semantiske farver */
  --red:#C8402E;--red-lt:rgba(200,64,46,.08);--red-md:rgba(200,64,46,.18);
  --amber:#B5791A;--amber-lt:rgba(181,121,26,.08);--amber-md:rgba(181,121,26,.18);
  /* Varm — alias til amber, så app'en ikke bærer endnu en dekorativ farve */
  --warm:#B5791A;--warm-lt:rgba(181,121,26,.08);--warm-md:rgba(181,121,26,.18);
  /* Blå — sekundær accentfarve, adskilt fra grøn: info/tip-indhold */
  --blue:#3A6EA5;--blue-lt:rgba(58,110,165,.10);--blue-md:rgba(58,110,165,.20);
  /* Neutral grå — labels, metadata */
  --neutral:#6B7A70;--neutral-lt:rgba(107,122,112,.12);
  /* Muted — neutral grå tekst */
  --muted:rgba(21,32,26,.58);
  --muted2:rgba(21,32,26,.40);
  --r:12px;
  --f:'DM Sans',system-ui,sans-serif;
  --mono:'DM Mono',monospace;
  /* Typografi-skala */
  --fs-xs:10px;
  --fs-sm:12px;
  --fs-md:14px;
  --fs-lg:17px;
  --fs-xl:22px;
  --fs-2xl:28px;
  /* Skygger — bløde og lyse: et tyndt lys-glimt foroven, en svag grå skygge forneden */
  --sh:0 1px 0 rgba(255,255,255,.7) inset, 0 2px 8px -2px rgba(21,32,26,.10);
  --sh2:0 1px 0 rgba(255,255,255,.7) inset, 0 10px 22px -14px rgba(21,32,26,.18);
  --sh3:0 1px 0 rgba(255,255,255,.7) inset, 0 20px 44px -20px rgba(21,32,26,.24);
}
/* Skjul den grå, browseragtige scrollbar-indikator app-bredt (25. sept.
   2026-brief: "får designet til at ligne en prototype") — scroll virker
   stadig fint, kun det visuelle scrollbar-spor/håndtag er skjult.
   scrollbar-width (Firefox) + -ms-overflow-style (gammel Edge) dækker de
   browsere ::-webkit-scrollbar ikke rammer. */
html{scrollbar-width:none;-ms-overflow-style:none;}
html::-webkit-scrollbar{display:none;}
body{
  background:#FFFFFF;
  color:var(--ink);font-family:var(--f);-webkit-font-smoothing:antialiased;
  min-height:100vh;
  scrollbar-width:none;-ms-overflow-style:none;
}
body::-webkit-scrollbar{display:none;}
.app{
  /* 480px — ikke 390px — dækker moderne store telefoner (iPhone Air: 402px,
     Pro Max-modeller: op til 430px), så appen ikke centreres med synlige
     tomme kanter på rigtige telefoner. Fungerer stadig som et "telefon-
     mockup"-loft på en reel desktop-browser (bredere vinduer). */
  max-width:480px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;
  width:100%;position:relative;overflow-x:hidden;
  background:#FFFFFF;
}
/* App-bred baggrund: ét fast billede bag alt andet indhold. 25. sept. 2026:
   Scan-forsidens eget baggrundsfoto (allergen-fødevarer i to kolonner på
   ren hvid baggrund, direkte uploadet af brugeren — tidligere kun vist på
   SCREENS.HOME) er gjort til det ENE, universelle billede for hele appen,
   ikke kun Scan-forsiden — samme billede, ingen skærm-specifik modifier-
   klasse længere (se App.jsx). Egen ægte position:fixed-boks (ikke
   background-attachment:fixed på .app) — background-attachment:fixed
   understøttes ikke pålideligt i mobil Safari/iOS-hjemmeskærm-PWA'er
   (velkendt, langvarig WebKit-begrænsning), mens en almindelig fixed-
   positioneret boks virker konsekvent alle steder. Ligger som første barn
   i .app, bag alt andet indhold via z-index:0 + .screen's z-index:1
   nedenfor — IKKE negativ z-index, som i visse browsere kan ende bag
   body's egen baggrund i stedet for bag skærmens indhold.
   Hvid slør-wash — tekst ligger flere steder direkte oven på dette lag
   uden kort/boks (Scan-forsidens hilsen, screen-title øverst på flere
   skærme), og billedet er markant tættere/mere farverigt end det
   oprindelige app-bg-billede, hvilket gjorde teksten svær at læse.
   Ændret fra et FLADT, ensartet slør (main's oprindelige .5-opacity-wash,
   se git-historik) til en RADIAL vignet (25. sept. 2026, brugerens
   design-brief: "Skandinavisk, ren og moderne UI... baggrunden skal være
   tydelig ude i kanterne, men have en rolig, lys og let tom midterzone")
   — dæmp der hvor tekst/knapper ligger, lad billedet ånde der hvor der
   ikke er indhold, med en ellipse centreret på midten i stedet for ét
   fladt tal for hele billedet: op til 92% hvid nær midten (hvor
   overskrifter/knapper typisk sidder), glidende ned til kun 10% hvid ude
   i hjørnerne, så ingredienserne (mælk/æg/havre/fisk/skaldyr/nødder) står
   tydeligt frem i kanterne uden at det bliver en tung/mørk overlay — kun
   hvid, aldrig sort/farvet. Læsbarheden bæres desuden af tekstens egen
   vægt/størrelse + en blød hvid text-shadow-glød ("løft" væk fra
   baggrunden). Se .screen-title nedenfor og Scan-forsidens hilsen
   (ScannerScreen.jsx) for samme mønster.
   Billedet selv (Scan-forsidens eget foto, allergen-fødevarer i to
   kolonner på ren hvid baggrund) er allerede det ENE, universelle billede
   for hele appen (main, 25. sept. 2026) — ingen skærm-specifik modifier-
   klasse længere (se App.jsx). */
.app-bg{
  position:fixed;inset:0;z-index:0;pointer-events:none;
  background-image:
    radial-gradient(ellipse 75% 60% at 50% 40%, rgba(255,255,255,.92) 0%, rgba(255,255,255,.72) 40%, rgba(255,255,255,.32) 72%, rgba(255,255,255,.1) 100%),
    url(${scanHeroBg});
  background-size:cover,cover;
  background-position:top center,top center;
  background-repeat:no-repeat,no-repeat;
}
/* Ekstra, let dæmpning specifikt på Log ind/Opret konto-skærmen (25. sept.
   2026-brief: "Dæmp baggrunden ca. 20-30% på denne side, så formularen
   bliver vigtigst"). Et selvstændigt, fast lag OVEN PÅ .app-bg (samme
   z-index:0, men senere i DOM'en — se App.jsx — så det maler ovenpå
   vignetten uden at ændre den for resten af appen). Ren hvid, ingen
   mørk/tung overlay, som briefen eksplicit bad om at undgå. */
.app-bg-dim{
  position:fixed;inset:0;z-index:0;pointer-events:none;
  background:rgba(255,255,255,.28);
}
/* Indkøbsliste-polish (25. sept. 2026, brugerfeedback): "ingrediens-
   baggrunden skal kun bruges på den primære Scan-forside" — dækker det
   universelle .app-bg helt opakt på Indkøbsliste-skærmen (se App.jsx),
   så skærmen igen får EatSafes rene hvid/off-white arbejdsflade i stedet
   for madvarebilledet, uden at ændre .app-bg selv (som resten af appen,
   inkl. Scan-forsiden, fortsat bruger uændret). Genbrugt for Historik
   (26. sept. 2026, se App.jsx) — samme lag, ingen ny klasse. */
.app-bg-hide{
  position:fixed;inset:0;z-index:0;pointer-events:none;
  background:var(--paper);
}

/* ── TOPBAR ── */
.topbar{
  /* Let "frosted glass" i stedet for helt gennemsigtig (24. sept. 2026) — så
     det app-brede baggrundsbillede altid skinner blødt igennem, konsekvent
     på tværs af alle skærme. Selve sløringen/tonen ligger nu i ::before
     (næste regel), IKKE direkte her — se dens kommentar for hvorfor. */
  border-bottom:none;
  padding:12px 20px 10px;display:flex;align-items:center;justify-content:space-between;
  position:sticky;top:0;z-index:60;
}
/* Baggrundslag for topbaren, adskilt fra selve topbaren (24. sept. 2026,
   efter feedback om en for hård/tydelig kant hvor sløringen stoppede brat).
   En ::before ovenpå en maskeret gradient kan tone SELVE tonen+blur'en
   gradvist ud i bunden i stedet for at klippe den af — ville også maskere
   topbarens egne synlige knapper/tekst, hvis det lå direkte på .topbar selv.
   Ligger BAG topbarens indhold (z-index:-1) inden for topbarens egen
   stakke-kontekst (position:sticky + z-index:60 opretter én), så den aldrig
   kan synke ned bag resten af sidens indhold. Blur reduceret fra 16px til
   8px samme dag — mindre udtalt/"vasket ud". */
.topbar::before{
  content:"";
  position:absolute;inset:0;z-index:-1;pointer-events:none;
  background:rgba(255,255,255,.55);
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  -webkit-mask-image:linear-gradient(to bottom, black 0%, black 65%, transparent 100%);
  mask-image:linear-gradient(to bottom, black 0%, black 65%, transparent 100%);
}
.topbar-logo{display:flex;align-items:center;gap:8px;}
.topbar-name{font-size:20px;font-weight:800;color:var(--ink);letter-spacing:-.4px;font-family:var(--f);}
.topbar-name span{color:var(--green);font-style:normal;}
.topbar-avatar{width:32px;height:32px;background:var(--green-lt);border:1.5px solid var(--green-mid);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--green);cursor:pointer;transition:all .15s;letter-spacing:.3px;}
.topbar-avatar:hover{background:var(--green-mid);}

/* ── LAYOUT ── */
.screen{flex:1;padding:0 16px 110px;position:relative;z-index:1;}
/* Scan-forsidens hero-boks (idle-tilstand, kamera ikke aktivt) — skal ALTID
   passe præcis mellem topbar og bundnav, uden scroll, på enhver telefon,
   så hilsen/scan-knap altid er synlige uden at skulle scrolle. Bevidst
   calc(100vh/100dvh - Npx) i stedet for en flex:1/height:100%-kæde: den
   slags afhænger af at HELE forældrekæden (body/.app/.screen) har en
   DEFINITIV højde, men de har kun min-height:100vh (en flad "mindst så høj"-
   grænse, ikke en fast højde) — hvilket viste sig upålideligt i praksis
   (fungerede i en isoleret test med en kunstig fast-højde-wrapper, men
   fejlede reelt i produktion, se HISTORY.md for den fulde fejlfinding).
   calc(vh) er derimod ALTID definitivt uanset forældrenes egen højde-model.
   143px = topbar (54px) + bundnav (77px) + lille margin (12px); bundnavs
   egen env(safe-area-inset-bottom) lægges oveni separat, så notch-/
   dynamic-island-telefoner får den ekstra plads de faktisk bruger. */
.home-hero-frame{
  position:relative;
  height:calc(100vh - 143px - env(safe-area-inset-bottom));
  height:calc(100dvh - 143px - env(safe-area-inset-bottom));
  max-height:820px;
  /* container-type:size gør 1cqh = 1% af DENNE boks' egen (variable) højde
     tilgængelig for alt indhold herinde — hilsen/knap/pille/fod bruger
     clamp(min, Ncqh, max) i stedet for faste px, så de skalerer NED sammen
     med boksen på korte telefoner (fx iPhone SE, hvor boksen bliver langt
     kortere end på en Pro Max) i stedet for at flyde ind over hinanden.
     Fundet nødvendigt efter test med rigtige enheds-profiler (Playwright
     devices['iPhone SE']/['iPhone 13']) viste tydeligt overlap mellem
     "Prøv en demo"-pillen og fod-linjen selv på en helt almindelig iPhone
     13 — faste px-størrelser skalerede slet ikke med boksens egen højde. */
  container-type:size;
}
/* Hjem-forsidens store scan-CTA: egen farvepalet (primær #0E8F5A, mørk
   #08734A, halo #DDF4E8) adskilt fra appens generelle --green-token,
   bevidst — kun selve CTA'en skal bruge denne specifikke nuance, resten af
   appens grønne elementer (bundnav, andre knapper) rører vi ikke her.
   Puls-adfærden er justeret to gange: 24. sept. 2026 startede med en
   tydelig, hurtig puls PÅ BÅDE halo og knap (efter ønsket "må gerne
   pulsere så man får lyst til at trykke"); 25. sept. 2026 præciseret til
   "en langsom, subtil puls KUN i ... halo" — knappens eget åndedræt
   (scanCtaBreathe, stadig defineret længere nede, men ikke længere brugt
   her) er fjernet, og selve halo-pulsen er dæmpet ned (skala 1→1.06 i
   stedet for 1.12, opacity .7→.5 i stedet for .8→.35) og sat langsommere
   (4s i stedet for 2.4s). Tryk-feedback (:active nedenfor) er et separat,
   uafhængigt lag oven i denne løbende animation.
   (En parallel session forsøgte samme dag at føre knappen tilbage til en
   hvid ghost/outline-stil med en roterende ring-lys — den grønne fyld
   herover er bevidst bevaret ved genforeningen med main, da DENNE session
   gennem flere eksplicitte brugerrunder har bekræftet grøn fyld + puls,
   senest ved en fuld velkomst-/login-brandkonsistens-runde bygget netop på
   denne palet. .scan-cta-ring-light/scanCtaRingSpin fra ghost-forsøget er
   fjernet igen, samme afgørelse som sidste gang samme konflikt opstod.) */
@keyframes scan-halo-pulse{
  0%,100%{transform:scale(1);opacity:.7;}
  50%{transform:scale(1.06);opacity:.5;}
}
.scan-cta-halo{animation:scan-halo-pulse 4s ease-in-out infinite;}
.scan-cta-btn{transition:transform .12s cubic-bezier(.34,1.56,.64,1);}
.scan-cta-btn:active{transform:scale(.95);}
@media (prefers-reduced-motion: reduce){
  .scan-cta-halo{animation:none;}
}
.bottom-nav{
  position:fixed;bottom:0;left:50%;transform:translateX(-50%);
  width:100%;max-width:480px;
  /* Var før helt uigennemsigtig (en tidligere gradient med en gennemsigtig
     top-del lod scrollende indhold skinne skarpt igennem, så baren så
     "flimrende" ud). Løsning (24. sept. 2026): backdrop-filter:blur i
     stedet for ren gennemsigtighed — sløringen visker scrollende indhold
     ud til en blød, rolig farve-vask i stedet for skarpe, flimrende former,
     samtidig med at det faste app-brede baggrundsbillede stadig skinner
     igennem. Samme "reel funktionel grund til blur"-princip som kamera-
     kontrolknapperne i ScannerScreen.jsx (se design-tokens.md antimønster #6).
     Selve tonen/sløringen ligger i ::before (næste regel), ikke direkte her
     — samme begrundelse som .topbar::before. */
  box-shadow:0 -8px 16px -12px rgba(21,32,26,.14);
  border-top:1px solid var(--border);
  display:flex;padding:10px 4px calc(24px + env(safe-area-inset-bottom));z-index:100;
}
/* Samme dag, samme begrundelse som .topbar::before: reduceret blur (20px→
   10px) + en gradvis udtoning i TOPPEN af baren (i stedet for .bottom-nav
   selv) i stedet for en hård kant, hvor sløringen tidligere stoppede brat
   mod scrollende indhold. */
.bottom-nav::before{
  content:"";
  position:absolute;inset:0;z-index:-1;pointer-events:none;
  background:rgba(255,255,255,.72);
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  -webkit-mask-image:linear-gradient(to top, black 0%, black 55%, transparent 100%);
  mask-image:linear-gradient(to top, black 0%, black 55%, transparent 100%);
}
/* Inaktive nav-punkter var tidligere dæmpet med opacity:.45 — kombineret
   med barens gennemsigtige/slørede baggrund (se .bottom-nav::before) blev
   ikonerne for svage til at læses ("knapperne forsvinder lidt i bund-
   menuen", 24. sept. 2026). Erstattet med en solid, mørkere farve
   (--ink2, 72% alpha) i stedet for opacity-dæmpning — giver ikon+label
   fuld kontrast uanset hvad der skinner igennem bagved, mens aktiv-
   tilstanden stadig skiller sig tydeligt ud via den grønne pille+label. */
.nav-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;color:var(--ink2);transition:color .15s;}
.nav-item.active{color:var(--ink);}
.nav-icon{width:42px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:8px;transition:background .15s;}
.nav-item.active .nav-icon{background:var(--green-lt);}
.nav-lbl{font-size:9px;font-weight:600;color:inherit;letter-spacing:.3px;}
.nav-item.active .nav-lbl{color:var(--green);}

/* ── CARDS & COMPONENTS ── */
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:16px;margin-bottom:10px;box-shadow:var(--sh);}
.card-lbl{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:var(--neutral);margin-bottom:10px;}
.card-title{font-size:15px;font-weight:700;color:var(--ink);margin-bottom:4px;letter-spacing:-.2px;}
.field{width:100%;background:var(--surface2);border:1.5px solid var(--border2);border-radius:10px;padding:12px 14px;color:var(--ink);font-family:var(--f);font-size:16px;outline:none;transition:border-color .15s,background .15s;}
.field:focus{border-color:var(--green);background:var(--surface2);box-shadow:0 0 0 3px var(--green-lt);}
/* Skjuler browserens native op/ned-spinner-pile på type="number"-felter
   (25. sept. 2026, opfølgning: Alder-feltet har allerede egne −/+-knapper
   udenom, så de indbyggede pile er dobbelt funktion og "ser tekniske ud").
   Scoped til .field-no-spinner, ikke alle .field-inputs — kun de steder
   der reelt har en ekstern stepper-erstatning. */
.field-no-spinner::-webkit-inner-spin-button,
.field-no-spinner::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}
.field-no-spinner{-moz-appearance:textfield;}
.field-lbl{font-size:11.5px;font-weight:700;color:var(--ink2);margin-bottom:6px;display:block;letter-spacing:.1px;}
.phone-field{display:flex;align-items:stretch;padding:0;overflow:hidden;}
.phone-field:focus-within{border-color:var(--green);background:var(--surface2);box-shadow:0 0 0 3px var(--green-lt);}
.phone-prefix{flex:0 0 auto;display:flex;align-items:center;padding:12px 10px 12px 14px;color:var(--ink2);font-weight:700;font-size:16px;font-family:var(--f);user-select:none;border-right:1.5px solid var(--border2);background:var(--surface3);}
.phone-rest{flex:1;min-width:0;border:none;outline:none;background:transparent;padding:12px 14px 12px 10px;font-size:16px;font-family:var(--f);color:var(--ink);}
.input-row{display:flex;gap:8px;}

/* ── BUTTONS ── */
.btn{padding:12px 20px;border-radius:10px;border:none;font-family:var(--f);font-size:14px;font-weight:700;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;justify-content:center;gap:6px;letter-spacing:-.1px;}
.btn-full{width:100%;}
.btn-primary{background:var(--green);color:var(--on-green);box-shadow:0 2px 12px rgba(14,143,90,.25);}
.btn-primary:hover{background:var(--green-glow);transform:translateY(-1px);}
.btn-green{background:var(--green);color:var(--on-green);box-shadow:0 2px 12px rgba(14,143,90,.25);}
.btn-green:hover{background:var(--green-glow);transform:translateY(-1px);}
.btn-outline{background:transparent;color:var(--ink);border:1.5px solid var(--border2);}
.btn-outline:hover{border-color:var(--ink2);background:var(--surface);}
.btn-danger{background:transparent;color:var(--red);border:1.5px solid rgba(255,82,82,.3);}
.btn-danger:hover{background:var(--red-lt);}
.btn-sm{padding:8px 14px;font-size:12.5px;border-radius:8px;}
.btn-ghost{background:var(--surface2);color:var(--ink2);border:1px solid var(--border);}
.btn-ghost:hover{background:var(--surface2);color:var(--ink);}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none!important;}

/* ── CHIPS & TAGS ── */
.chip-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
.chip{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;border:1.5px solid var(--border2);background:var(--surface);cursor:pointer;transition:all .15s;font-size:12.5px;font-weight:600;color:var(--ink2);user-select:none;}
.chip:hover{border-color:var(--border2);color:var(--ink);}
.chip.on{border-color:var(--green);background:var(--green-selected-bg);color:var(--green);font-weight:700;}
.chip-check{margin-left:auto;width:16px;height:16px;background:var(--green);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;color:var(--on-green);flex-shrink:0;}
.tags{display:flex;flex-wrap:wrap;gap:6px;}
.tag{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:var(--green-lt);border:1px solid var(--green-mid);border-radius:100px;font-size:12px;color:var(--green);font-weight:600;}
.tag-x{cursor:pointer;opacity:.4;font-size:13px;padding:4px 6px;margin:-4px -6px -4px 0;border-radius:50%;}.tag-x:hover{opacity:.8;background:rgba(21,32,26,.06);}

/* ── BADGES ── */
.badge{font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:6px;white-space:nowrap;letter-spacing:.2px;}
.badge.safe{background:var(--green-lt);color:var(--green);border:1px solid var(--green-mid);}
.badge.danger{background:var(--red-lt);color:var(--red);border:1px solid var(--red-md);}
.badge.warn{background:var(--amber-lt);color:var(--amber);border:1px solid var(--amber-md);}

.divider{display:flex;align-items:center;gap:10px;margin:12px 0;color:var(--muted);font-size:11.5px;font-weight:600;letter-spacing:.3px;}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--border);}

/* ── WELCOME ── */
.welcome-screen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 28px;text-align:center;}
.welcome-logo-wrap{display:flex;flex-direction:column;align-items:center;margin-bottom:32px;}
.welcome-wordmark{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:20px;}
.welcome-wordmark-text{font-family:var(--f);font-size:32px;font-weight:700;color:var(--ink);letter-spacing:-.8px;line-height:1;}
.welcome-wordmark-text span{color:var(--green);}
/* Tydelig value proposition (25. sept. 2026-brief: "kort og tydelig value
   proposition") — hævet fra en dæmpet, muted tagline til en tydeligere,
   mørkere sætning, så den reelt fungerer som skærmens hovedbudskab, ikke en
   sekundær undertekst. Hævet endnu en anelse samme dag (opfølgning) — var
   stadig for diskret: 15.5px→16.5px, --ink2→--ink (fuld tekstfarve). */
.welcome-tagline{font-size:16.5px;color:var(--ink);margin-top:12px;letter-spacing:.1px;font-weight:600;line-height:1.5;max-width:280px;}
.welcome-divider{width:40px;height:2px;background:var(--border2);border-radius:2px;margin:32px auto;}
/* 3 fordele-række (25. sept. 2026-brief) — kort, ikon-båret opsummering,
   IKKE tunge fuld-bredde feature-kort (erstatter tidligere .welcome-features/
   .welcome-feat, som aldrig blev taget i brug). Bevidst let/luftig, ingen
   kant/skygge på selve rækken — kun ikon-cirklerne er "kort" (afrundede,
   meget lys grøn baggrund #EFF9F4, brugerens egen definerede farvepalet). */
.welcome-benefits{display:flex;justify-content:center;gap:22px;margin:28px 0 32px;width:100%;}
.welcome-benefit{display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;max-width:100px;}
.welcome-benefit-icon{width:44px;height:44px;border-radius:14px;background:var(--green-selected-bg);display:flex;align-items:center;justify-content:center;box-shadow:var(--sh);flex-shrink:0;}
/* Hævet fra 11.5px/--ink2 til 13px/--ink (samme dag, opfølgning) — var på
   grænsen til for diskret; nu på linje med resten af skærmens tekstvægt. */
.welcome-benefit-label{font-size:13px;font-weight:700;color:var(--ink);line-height:1.35;}
/* Primær CTA — EatSafes låste --green/--green-dark-token (25. sept.
   2026-designsystem, se CLAUDE.md afsnit 5/7). Var tidligere hardkodet til
   den daværende Scan-CTA-only-palet (#0E8F5A→#08734A) adskilt fra
   --green — nu samme farve, så ingen adskillelse længere nødvendig.
   (Ryddet op i en duplikeret, tavst-vindende .welcome-btn-regel
   længere nede i filen, som pga. CSS-cascade reelt overskrev denne.) */
.welcome-btn{background:linear-gradient(160deg,var(--green) 0%,var(--green-dark) 100%);color:var(--on-green);border:none;border-radius:14px;padding:16px 32px;font-family:var(--f);font-size:15px;font-weight:700;cursor:pointer;width:100%;transition:all .18s;margin-bottom:10px;letter-spacing:-.1px;box-shadow:0 10px 24px -10px rgba(8,115,74,.45);}
.welcome-btn:hover{transform:translateY(-1px);box-shadow:0 14px 30px -10px rgba(8,115,74,.55);}
.welcome-btn:active{transform:scale(.98);}
.welcome-btn-ghost{background:var(--surface);color:var(--ink2);border:1.5px solid var(--border2);border-radius:14px;padding:14px 32px;font-family:var(--f);font-size:14px;font-weight:600;cursor:pointer;width:100%;transition:all .18s;}
.welcome-btn-ghost:hover{background:var(--surface2);}
/* Tertiær tekstlink (25. sept. 2026-brief: "skal være et tekstlink, ikke en
   stor tredje knap") — erstatter den tidligere .welcome-btn-ghost-brug til
   "Se app uden login (preview)"-genvejen, som visuelt konkurrerede med den
   rigtige sekundærknap ovenfor. Ingen baggrund/kant/padding-boks, kun
   understreget tekst. */
.welcome-link{background:none;border:none;cursor:pointer;font-family:var(--f);font-size:12.5px;font-weight:600;color:var(--ink2);text-decoration:underline;text-underline-offset:2px;padding:8px 0;text-shadow:0 1px 0 rgba(255,255,255,.7);}
.welcome-link:hover{color:var(--green);}
/* Grønt tekstlink, brugt af "Glemt adgangskode?" (25. sept. 2026,
   opfølgning) — almindelig, læsbar grøn tekst, understreget, ingen
   knap-kant/baggrund. outline:none fjerner browserens standard fokus-ring
   (som ellers viser en firkantet "indrammet" tilstand efter et museklik i
   Chrome/Firefox) — :focus-visible gengiver en rigtig, synlig ring, men
   KUN ved reelt tastaturfokus (Tab), som brugeren bad om. */
.link-green{background:none;border:none;cursor:pointer;font-family:var(--f);font-size:12.5px;font-weight:600;color:var(--green);text-decoration:underline;text-underline-offset:2px;padding:0;outline:none;}
.link-green:hover{color:var(--green-dark);}
.link-green:focus-visible{outline:2px solid var(--green);outline-offset:3px;border-radius:4px;}
.link-green:disabled{opacity:.5;cursor:not-allowed;}

/* ── LOGIN ── */
/* Bund-padding øget fra 32px til 40px + telefonens egen safe-area (25.
   sept. 2026, opfølgning) — den sidste sociale login-knap (Facebook)
   kolliderede med teksten under den, for lidt luft til at være tydeligt
   adskilt. Yderligere øget specifikt på lave skærme (samme dag, endnu en
   opfølgning) — 40px var stadig knapt på fx iPhone SE (568px høj), hvor
   det samlede indhold fylder relativt mere af viewporten. */
.login-wrap{min-height:100vh;display:flex;flex-direction:column;padding:48px 20px calc(40px + env(safe-area-inset-bottom));}
@media (max-height:700px){
  .login-wrap{padding-bottom:calc(64px + env(safe-area-inset-bottom));}
}
/* Formular-kort (25. sept. 2026-brief): "tydeligt hvidt formular-kort med
   16-20px radius, diskret skygge, god indvendig padding" — erstatter den
   generiske .card (12px radius, 16px padding, brugt overalt ellers i appen)
   specifikt på Opret konto/Log ind, så kortet får mere "luft" og fremstår
   som skærmens klare fokuspunkt, uden at ændre .card noget andet sted. */
.login-card{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:22px 20px;box-shadow:var(--sh2);margin-bottom:10px;}
/* Segmenteret kontrol — "Ny bruger | Log ind" aktiv-tilstand hævet fra en
   næsten usynlig markering (samme --surface2-farve som rækkens egen
   baggrund, kun adskilt af en skygge) til en tydelig, men rolig markering
   (25. sept. 2026-brief) — hvid pille i EatSafes scan-CTA-grøn tekstfarve
   (#0E8F5A) på en meget lys grøn baggrund (#EFF9F4), samme palet som resten
   af onboarding-flowet. */
.tab-row{display:flex;gap:3px;background:var(--green-selected-bg);border-radius:10px;padding:3px;margin-bottom:14px;border:1px solid var(--green-mid);}
.tab{flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;color:var(--ink2);transition:all .15s;}
.tab.active{background:var(--surface);color:var(--green);box-shadow:var(--sh);}
/* Sociale login-knapper — hvide/neutrale med platformens eget ikon (25.
   sept. 2026-brief: "undgå en stor blå Facebook-knap, fordi den stjæler
   fokus fra EatSafe"). Én delt klasse for Google/Facebook (Apple fjernet
   igen samme dag), så begge reelt er visuelt lige stærke — og altid
   svagere end .welcome-btn (den primære CTA), som briefen kræver. */
.social-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px 16px;background:var(--surface);border:1px solid var(--border2);border-radius:12px;cursor:pointer;font-family:var(--f);font-size:14px;font-weight:600;color:var(--ink);transition:all .15s;}
.social-btn:hover{background:var(--surface2);border-color:var(--ink2);}
.social-btn:active{transform:scale(.98);}
.social-btn:disabled{opacity:.5;cursor:not-allowed;}

/* ── ONBOARDING ── */
.onboard-wrap{padding:20px 16px 100px;}
/* flex:1 (= flex-grow:1 flex-shrink:1 flex-basis:0%) på hvert segment
   sikrer allerede matematisk lige bred fordeling af den tilgængelige
   plads, og det faste gap:6 på selve rækken (App.jsx's StepBar) giver
   ensartet afstand mellem alle segmenter — bevidst IKKE ændret her (25.
   sept. 2026, opfølgning), kun bekræftet/verificeret. */
.step-seg{height:3px;flex:1;border-radius:2px;background:var(--border2);transition:background .3s;}
.step-seg.done{background:var(--green);}
/* Hævet fra --muted til --ink2 + en anelse større (25. sept. 2026,
   opfølgning: "gør 1/5 lidt tydeligere"). */
.step-num{font-size:12px;font-weight:700;color:var(--ink2);white-space:nowrap;}
.step-title{font-size:17px;font-weight:700;margin-bottom:6px;color:var(--ink);letter-spacing:-.3px;}
.step-sub{font-size:13px;color:var(--ink2);margin-bottom:16px;line-height:1.55;}
.onboard-skip{font-size:12px;color:var(--muted);text-align:center;margin-top:8px;}


/* Scan card */
.scan-card{
  width:100%;background:var(--surface);border:1px solid var(--border2);
  border-radius:22px;padding:26px 20px 22px;margin-bottom:12px;cursor:pointer;
  position:relative;overflow:hidden;display:flex;flex-direction:column;
  align-items:center;gap:16px;
}
.scan-card::before{content:'';position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);width:180px;height:80px;background:radial-gradient(ellipse,rgba(61,204,110,.22) 0%,transparent 70%);pointer-events:none;}
.scan-card::after{content:'';position:absolute;top:0;left:20%;right:20%;height:1px;background:linear-gradient(90deg,transparent,rgba(61,204,110,.28),transparent);}
.scan-card-text{text-align:center;}
.scan-card-title{font-size:17px;font-weight:600;color:var(--ink);letter-spacing:-.4px;margin-bottom:4px;}
.scan-card-sub{font-size:11px;color:var(--muted2);font-weight:400;line-height:1.5;}

/* Reticle */
.reticle{width:80px;height:80px;position:relative;flex-shrink:0;}
.scan-barcode-wrap{
  width:85%;height:64px;position:relative;flex-shrink:0;margin:0 auto;
}
.scan-barcode-svg{
  position:absolute;left:10px;right:10px;top:50%;transform:translateY(-50%);
  height:38px;width:calc(100% - 20px);
}
.reticle-corner{position:absolute;width:18px;height:18px;border-color:var(--green-logo);border-style:solid;opacity:1;}
.reticle-corner.tl{top:0;left:0;border-width:2px 0 0 2px;border-radius:4px 0 0 0;}
.reticle-corner.tr{top:0;right:0;border-width:2px 2px 0 0;border-radius:0 4px 0 0;}
.reticle-corner.bl{bottom:0;left:0;border-width:0 0 2px 2px;border-radius:0 0 0 4px;}
.reticle-corner.br{bottom:0;right:0;border-width:0 2px 2px 0;border-radius:0 0 4px 0;}
.reticle-line{position:absolute;left:0;right:0;height:1.5px;background:linear-gradient(90deg,transparent 0%,var(--green-logo) 15%,var(--green-logo) 85%,transparent 100%);animation:scanline 2.2s ease-in-out infinite;box-shadow:0 0 10px var(--green-logo),0 0 3px var(--green-logo);}
@keyframes scanline{0%{top:13px;opacity:0;}15%{opacity:1;}85%{opacity:1;}100%{top:51px;opacity:0;}}

/* scanCtaBreathe: et let åndedræt (skala 1 → 1.015) på hele scan-CTA-
   wrapperen — stammer fra en mellemliggende hvid ghost/outline-udgave af
   knappen, og blev kortvarigt genbrugt på den grønne knap (24. sept. 2026).
   IKKE længere anvendt (25. sept. 2026) — brugeren præciserede at pulsen
   skal ligge KUN i halo-gløden (.scan-cta-halo ovenfor), ikke på selve
   knappen. Keyframen er bevaret, ikke slettet, i tilfælde af senere
   genbrug samme sted i koden. */
@keyframes scanCtaBreathe{0%,100%{transform:scale(1);}50%{transform:scale(1.015);}}

/* Mini cards */
.home-cards-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;}
.home-mini-card{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:16px 14px;cursor:pointer;display:flex;flex-direction:column;gap:10px;position:relative;overflow:hidden;transition:border-color .15s;}
.home-mini-card::after{content:'';position:absolute;top:0;left:25%;right:25%;height:1px;background:linear-gradient(90deg,transparent,var(--border2),transparent);}
.home-mini-card:hover{border-color:var(--border2);}
.home-mini-icon{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:var(--green-lt);}
.home-mini-label{font-size:12px;font-weight:600;color:var(--ink);letter-spacing:-.2px;margin-bottom:2px;}
.home-mini-sub{font-size:10px;color:var(--muted2);font-weight:400;}
.home-mini-badge{width:18px;height:18px;border-radius:50%;background:var(--green);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:var(--on-green);flex-shrink:0;}

/* Section label */
.section-lbl{font-size:9.5px;font-weight:600;color:var(--neutral);text-transform:uppercase;letter-spacing:1.8px;margin-bottom:10px;}

/* Recent list */
.recent-list{background:var(--surface3);border:1px solid var(--border);border-radius:18px;padding:2px 14px;margin-bottom:20px;}
.recent-item{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);}
.recent-item:last-child{border-bottom:none;}
.recent-thumb{width:38px;height:38px;border-radius:10px;background:var(--surface2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0;}
.recent-name{font-size:13px;font-weight:500;color:var(--ink);letter-spacing:-.2px;margin-bottom:2px;}
.recent-meta{font-size:10px;color:var(--muted2);font-weight:400;}
.recent-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-left:auto;}
.recent-dot.safe{background:var(--green);box-shadow:0 0 7px rgba(14,143,90,.6);}
.recent-dot.warn{background:var(--amber);}
.recent-dot.danger{background:var(--red);box-shadow:0 0 7px rgba(255,82,82,.5);}
.recent-dot.not_found{background:var(--muted);}


/* Profile chips (home) */
.home-profile-chips{display:flex;gap:6px;margin-bottom:22px;flex-wrap:wrap;}
.home-chip{display:flex;align-items:center;gap:6px;padding:6px 12px 6px 6px;background:var(--surface);border:1px solid var(--border);border-radius:100px;font-size:11px;font-weight:500;color:var(--ink2);cursor:pointer;transition:all .15s;min-height:30px;}
.home-chip.active{background:var(--green-selected-bg);border-color:var(--green);color:var(--green);}
.home-chip-avatar{width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:7.5px;font-weight:700;color:var(--ink);flex-shrink:0;}

/* Version */
.version-str{font-family:var(--mono);font-size:9px;color:var(--neutral);text-align:center;padding:4px 0 16px;letter-spacing:.5px;opacity:.5;}

/* Stat grid (legacy) */
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px;}
.stat-num{font-size:26px;font-weight:700;color:var(--ink);line-height:1;letter-spacing:-.5px;}
.stat-lbl{font-size:11px;color:var(--muted);margin-top:4px;font-weight:600;letter-spacing:.2px;}
.scan-hero{background:var(--surface);border:1px solid var(--border2);border-radius:16px;padding:20px 18px;margin-bottom:10px;display:flex;align-items:center;gap:16px;cursor:pointer;transition:all .18s;position:relative;overflow:hidden;}
.scan-hero:hover{background:var(--surface2);}
.scan-hero-icon{width:52px;height:52px;background:var(--green-lt);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.scan-hero-title{font-size:16px;font-weight:700;color:var(--ink);letter-spacing:-.3px;}
.scan-hero-sub{font-size:12px;color:var(--muted);margin-top:2px;font-weight:400;}

/* ── SEARCH ── */
.filter-chip{padding:6px 12px;border-radius:100px;border:1.5px solid var(--border2);background:var(--surface);font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;color:var(--muted);}
.filter-chip:hover{border-color:var(--border2);color:var(--ink);}
.filter-chip.active{border-color:var(--green);background:var(--green-selected-bg);color:var(--green);}
.product-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;}
.product-card:hover{border-color:var(--border2);}
.product-emoji{width:44px;height:44px;background:var(--surface2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;border:1px solid var(--border);}
.product-name{font-size:13.5px;font-weight:700;letter-spacing:-.1px;color:var(--ink);}
.product-brand{font-size:11.5px;color:var(--muted);margin-top:2px;}
.verified-pill{display:inline-flex;align-items:center;padding:2px 8px;border-radius:5px;font-size:10px;font-weight:700;margin-top:4px;letter-spacing:.2px;}

/* ── LIST ── */
.list-item{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--surface);border:1px solid var(--border);border-radius:11px;margin-bottom:8px;}
.list-item.done{opacity:.4;}
.list-check{position:relative;width:20px;height:20px;border-radius:6px;border:2px solid var(--border2);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .18s;font-size:11px;color:var(--on-green);}
.list-check::before{content:'';position:absolute;inset:-13px;}
.list-check.checked{background:var(--green);border-color:var(--green);}
.list-name{font-size:14px;font-weight:600;flex:1;letter-spacing:-.1px;color:var(--ink);}
.list-name.done{text-decoration:line-through;color:var(--muted);}
.list-del{position:relative;font-size:15px;cursor:pointer;opacity:.2;padding:10px;margin:-6px -10px -6px 0;transition:opacity .15s;}.list-del:hover{opacity:.6;}
/* Usynlig tap-area-udvidelse til ~44×44px (25. sept. 2026, brugerfeedback:
   "sørg for minimum ca. 44×44 px tap-area") — samme ::before-mønster som
   .list-check ovenfor. Det synlige ikon (16px + 10px padding = 36×36px)
   forbliver visuelt uændret; kun det klikbare område udvides. */
.list-del::before{content:'';position:absolute;inset:-4px;}
.list-section{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:var(--muted);margin:14px 0 8px;}

/* ── PROFILE ── */
.profile-hero{background:var(--surface2);border:1px solid var(--border2);border-radius:16px;padding:20px 18px;margin:16px 0 12px;display:flex;align-items:center;gap:14px;}
.pa-lg{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:var(--on-green);background:var(--green);flex-shrink:0;}
.profile-hero-name{font-size:18px;font-weight:700;color:var(--ink);letter-spacing:-.4px;}
.profile-hero-sub{font-size:11.5px;color:var(--muted);margin-top:3px;font-weight:400;}
.profile-edit-btn{margin-left:auto;background:var(--surface2);border:1px solid var(--border2);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;color:var(--ink);cursor:pointer;font-family:var(--f);transition:all .15s;}
.profile-edit-btn:hover{background:var(--surface2);border-color:var(--green);}
.stat3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;}
.stat3-item{background:var(--surface);border-radius:10px;padding:12px 8px;border:1px solid var(--border);}
.stat3-num{font-size:20px;font-weight:700;letter-spacing:-.3px;color:var(--ink);}
.stat3-lbl{font-size:10.5px;color:var(--muted);font-weight:600;margin-top:3px;letter-spacing:.2px;}

/* ── FAMILY ── */
.family-member{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:10px;}
.fm-avatar{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;}
.ap-chip{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:100px;border:1.5px solid var(--border2);background:var(--surface);font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;color:var(--muted);}
.ap-chip:hover{border-color:var(--border2);color:var(--ink);}
.ap-chip.on{border-color:var(--green);background:var(--green-selected-bg);color:var(--green);}

/* ── HISTORY ── */
.hist-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;transition:opacity .1s;}
.hist-row:hover{opacity:.75;}
.hist-row:last-child{border-bottom:none;}
.menu-item{display:flex;align-items:center;gap:12px;padding:14px 4px;border-bottom:1px solid var(--border);cursor:pointer;transition:opacity .1s;}
.menu-item:hover{opacity:.75;}
.menu-item:last-child{border-bottom:none;}
.menu-profile-card{cursor:pointer;transition:opacity .1s;}
.menu-profile-card:hover{opacity:.85;}
.hist-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.hist-dot.safe{background:var(--green);}.hist-dot.danger{background:var(--red);}.hist-dot.warn,.hist-dot.warning{background:var(--amber);}.hist-dot.not_found{background:var(--muted);}
.hist-info{flex:1;min-width:0;}
.hist-name{font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.1px;color:var(--ink);}
.hist-time{font-size:11px;color:var(--muted);margin-top:1px;font-weight:400;}

/* ── UTILS ── */
.loader{display:flex;flex-direction:column;align-items:center;gap:10px;padding:28px;background:var(--surface);border:1px solid var(--border);border-radius:12px;margin-bottom:10px;box-shadow:var(--sh);}
.spinner{width:32px;height:32px;border:2.5px solid var(--border2);border-top-color:var(--green);border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.loader-txt{font-size:13.5px;font-weight:700;color:var(--ink);letter-spacing:-.1px;}
.loader-sub{font-size:11.5px;color:var(--muted);}
.error-box{background:var(--red-lt);border:1px solid var(--red-md);border-radius:10px;padding:12px 14px;font-size:12.5px;color:var(--red);font-weight:600;margin-bottom:10px;display:flex;align-items:flex-start;gap:8px;}
.info-box{background:var(--blue-lt);border:1px solid var(--blue-md);border-radius:10px;padding:12px 14px;font-size:12.5px;color:var(--blue);font-weight:600;margin-bottom:10px;display:flex;align-items:center;gap:8px;}
.warn-box{background:var(--amber-lt);border:1px solid var(--amber-md);border-radius:10px;padding:12px 14px;font-size:12.5px;color:var(--amber);font-weight:600;margin-bottom:10px;display:flex;align-items:center;gap:8px;}
.share-bar{display:flex;gap:8px;padding:12px 14px;background:var(--blue-lt);border-radius:10px;margin-bottom:10px;align-items:center;border:1px solid var(--blue-md);}
.share-txt{flex:1;font-size:12.5px;color:var(--blue);font-weight:600;}
.empty-state{text-align:center;padding:56px 24px;color:var(--muted);animation:fadeUp .25s ease both;}
.empty-icon{width:68px;height:68px;margin:0 auto 16px;border-radius:50%;background:linear-gradient(150deg,var(--surface2),var(--surface3));border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:30px;box-shadow:var(--sh);animation:emptyFloat 3s ease-in-out infinite;}
@keyframes emptyFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);}}
.empty-txt{font-size:15.5px;font-weight:700;color:var(--ink);letter-spacing:-.2px;}
.empty-sub{font-size:13px;margin-top:6px;color:var(--muted);font-weight:400;line-height:1.55;max-width:260px;margin-left:auto;margin-right:auto;}
.demo-code{padding:4px 10px;background:var(--surface2);border:1px solid var(--border2);border-radius:7px;font-size:12px;font-weight:700;color:var(--ink2);cursor:pointer;transition:all .15s;display:inline-block;margin:3px;font-family:monospace;}
.demo-code:hover{border-color:var(--green);color:var(--green);background:var(--green-lt);}
.screen-title{font-size:16px;font-weight:800;color:var(--ink);margin:10px 0 3px;letter-spacing:-.2px;text-align:center;width:100%;text-shadow:0 1px 2px rgba(255,255,255,.85),0 2px 12px rgba(255,255,255,.6);}
.screen-sub{font-size:11px;color:var(--ink2);margin-bottom:10px;line-height:1.4;font-weight:400;}
#qr-reader{width:100%!important;border:none!important;min-height:200px;}
#qr-reader video{width:100%!important;height:auto!important;border-radius:8px!important;display:block!important;}
#qr-reader__dashboard{display:none!important;}
#qr-reader__scan_region{width:100%!important;}
#qr-reader-home{width:100%!important;overflow:hidden;}
#qr-reader-home>div{padding:0!important;border:none!important;background:transparent!important;}
#qr-reader-home img{display:none!important;}
#qr-reader-home video{width:100%!important;height:260px!important;object-fit:cover!important;display:block!important;}
#qr-reader__dashboard{display:none!important;}
#qr-reader__status_span{display:none!important;}
#qr-reader img{display:none!important;}

/* ── PRODUKT HERO ── */
.product-hero{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;margin-bottom:10px;box-shadow:var(--sh2);}
/* En smal/kvadratisk vare (fx en flaske) på "contain" ville ellers efterlade
   fladt grå tomrum i siderne — en sløret, opskaleret kopi af samme billede
   som baggrund udfylder boksen elegant uanset billedets facon. */
.product-hero-imgwrap{position:relative;width:100%;height:180px;overflow:hidden;background:var(--surface2);}
.product-hero-img-backdrop{position:absolute;inset:-12px;width:calc(100% + 24px);height:calc(100% + 24px);object-fit:cover;filter:blur(22px) saturate(1.3);opacity:.55;transform:scale(1.05);}
.product-hero-img{position:relative;width:100%;height:100%;object-fit:contain;display:block;}
.product-hero-img-placeholder{width:100%;height:180px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:72px;}
.product-hero-body{padding:14px 16px;}
.product-hero-name{font-size:19px;font-weight:700;color:var(--ink);letter-spacing:-.4px;line-height:1.2;margin-bottom:3px;}
.product-hero-brand{font-size:13px;color:var(--muted);font-weight:400;margin-bottom:10px;}
.product-hero-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.product-hero-source{font-size:10px;font-weight:700;padding:2px 8px;border-radius:5px;letterSpacing:.3px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
.fade-in{animation:fadeUp .18s ease both;}
@keyframes toast-in{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}

/* ── SCAN-LOADING (logo-baseret loading-animation, vist mens et scannet/
   søgt produkt slås op — fra scan:start til resultatet er klart) ── */
.scan-loading-overlay{
  position:fixed;inset:0;z-index:9994;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;
  background:var(--paper);opacity:.97;
  animation:fadeUp .18s ease both;
}
.scan-loading-mark{animation:scan-mark-pulse 1.8s ease-in-out infinite;}
@keyframes scan-mark-pulse{0%,100%{transform:scale(1);}50%{transform:scale(1.035);}}
.scan-loading-beam{animation:scan-beam-sweep 1.6s cubic-bezier(.45,0,.55,1) infinite;}
@keyframes scan-beam-sweep{
  0%{transform:translateY(0);opacity:0;}
  10%{opacity:1;}
  50%{transform:translateY(68px);opacity:1;}
  90%{opacity:1;}
  100%{transform:translateY(0);opacity:0;}
}
@keyframes laserMove{0%{top:0;}50%{top:96px;}100%{top:0;}}
.scan-loading-txt{font-size:15px;font-weight:800;color:var(--ink);letter-spacing:-.1px;text-align:center;}
.scan-loading-sub{font-size:12.5px;color:var(--muted);text-align:center;margin-top:2px;}
.scroll-top-btn{
  position:fixed;right:16px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:9990;
  width:44px;height:44px;border-radius:50%;
  background:var(--surface);border:1px solid var(--border);box-shadow:var(--sh2);
  display:flex;align-items:center;justify-content:center;cursor:pointer;
  animation:toast-in .15s ease-out;
}
.scroll-top-btn:hover{background:var(--surface2);}

/* ── MADPAS ── */
.mp-page{display:flex;flex-direction:column;flex:1;}
.mp-scroll{flex:1;overflow-y:auto;padding:0 20px 120px;}
.mp-head{padding:20px 20px 0;}
.mp-title{font-size:26px;font-weight:700;color:var(--ink);letter-spacing:-.5px;margin-bottom:6px;}
.mp-subtitle{font-size:13px;color:var(--ink2);font-weight:400;line-height:1.5;margin-bottom:20px;}
.mp-section-lbl{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:var(--muted);margin:0 0 8px;}
.mp-lang-dropdown{width:100%;background:var(--surface);border:1.5px solid var(--border2);border-radius:13px;padding:14px 16px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all .15s;margin-bottom:16px;box-sizing:border-box;}
.mp-lang-dropdown:hover{border-color:var(--green);}
.mp-lang-flag{font-size:22px;flex-shrink:0;}
.mp-lang-name{flex:1;font-size:15px;font-weight:700;color:var(--ink);}
.mp-lang-arrow{font-size:14px;color:var(--muted);}
.mp-lang-list{background:var(--surface);border:1.5px solid var(--border2);border-radius:13px;overflow:hidden;margin-bottom:16px;max-height:320px;overflow-y:auto;}
.mp-lang-opt{display:flex;align-items:center;gap:10px;padding:12px 16px;cursor:pointer;transition:background .1s;border-bottom:1px solid var(--border);}
.mp-lang-opt:last-child{border-bottom:none;}
.mp-lang-opt:hover{background:var(--surface2);}
.mp-lang-opt.on{background:var(--green-lt);}
.mp-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px 20px;margin-bottom:14px;}
.mp-allergen-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:var(--red-lt);border:1px solid var(--red-md);border-radius:100px;font-weight:700;color:var(--red);margin:3px;}
.mp-allergen-pill.custom{background:var(--surface2);border-color:var(--border2);color:var(--ink2);}
.mp-big-btn{width:100%;background:var(--green);color:var(--on-green);border:none;border-radius:14px;padding:16px;font-family:var(--f);font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:10px;box-shadow:0 3px 12px rgba(14,143,90,.25);}
.mp-big-btn:hover{background:var(--green-glow);}
.mp-speak-btn{background:var(--green);color:var(--on-green);border:none;border-radius:10px;padding:8px 14px;font-family:var(--f);font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;flex:1;}
.mp-speak-btn.speaking{background:var(--amber);color:var(--on-green);}
.mp-aa{background:var(--surface2);color:var(--muted);border:1.5px solid var(--border2);border-radius:9px;padding:8px 12px;font-family:var(--f);font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0;}
.mp-aa.on{background:var(--green-selected-bg);border-color:var(--green);color:var(--green);}
.mp-family-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 0;border-bottom:1px solid var(--border);}
.mp-family-row:last-child{border-bottom:none;}

/* ── OPSKRIFTER ── */
.recipe-grid{display:flex;flex-direction:column;gap:12px;}
.recipe-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;cursor:pointer;transition:transform .15s,border-color .15s;position:relative;}
.recipe-card:active{transform:scale(.99);}
.recipe-card:hover{border-color:var(--border2);}
.recipe-card-img{width:100%;height:180px;object-fit:cover;display:block;background:var(--surface2);}
.recipe-card-img-placeholder{width:100%;height:140px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:52px;}
.recipe-card-body{padding:14px 16px 16px;}
.recipe-card-title{font-size:16px;font-weight:700;color:var(--ink);line-height:1.25;margin-bottom:6px;letter-spacing:-.2px;}
.recipe-card-desc{font-size:12px;color:var(--ink2);line-height:1.55;margin-bottom:10px;}
.recipe-card-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.recipe-pill{font-size:10px;font-weight:700;border-radius:100px;padding:3px 10px;border:1px solid;white-space:nowrap;}
.recipe-safe-bar{display:flex;gap:6px;flex-wrap:wrap;padding:10px 14px 0;border-top:1px solid var(--border);margin-top:10px;}
.recipe-profile-badge{display:flex;align-items:center;gap:4px;font-size:10px;font-weight:700;padding:3px 8px;border-radius:100px;border:1px solid;}
.recipe-fav-btn{position:absolute;top:10px;right:10px;z-index:2;width:34px;height:34px;border-radius:50%;background:rgba(0,0,0,.45);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:background .15s;}
.recipe-filter-row{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;margin-bottom:12px;scrollbar-width:none;}
.recipe-filter-row::-webkit-scrollbar{display:none;}
.recipe-filter-chip{flex-shrink:0;padding:8px 14px;border-radius:100px;border:1.5px solid var(--border2);background:var(--surface);font-size:12px;font-weight:700;cursor:pointer;color:var(--muted);transition:all .15s;white-space:nowrap;}
.recipe-filter-chip.active{border-color:var(--green);background:var(--green-selected-bg);color:var(--green);}
.recipe-search-wrap{position:relative;margin-bottom:12px;}
.recipe-search-input{width:100%;padding:12px 14px 12px 42px;border:1.5px solid var(--border2);border-radius:12px;background:var(--surface);font-family:var(--f);font-size:14px;color:var(--ink);outline:none;box-sizing:border-box;transition:border-color .15s;}
.recipe-search-input:focus{border-color:var(--green);box-shadow:0 0 0 3px var(--green-lt);}
.recipe-search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);pointer-events:none;}
.recipe-detail-hero{position:relative;margin:-1px -16px 0;}
.recipe-detail-img{width:100%;height:240px;object-fit:cover;display:block;}
.recipe-detail-img-placeholder{width:100%;height:200px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:80px;}
.recipe-detail-back{position:absolute;top:14px;left:14px;z-index:3;width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,.5);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--ink);}
.recipe-detail-fav{position:absolute;top:14px;right:14px;z-index:3;width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,.5);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;}
.recipe-detail-title{font-size:24px;font-weight:700;color:var(--ink);letter-spacing:-.5px;line-height:1.2;margin-bottom:8px;}
.recipe-meta-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;}
.recipe-meta-pill{display:flex;align-items:center;gap:4px;padding:4px 10px;background:var(--surface);border:1px solid var(--border);border-radius:100px;font-size:11px;font-weight:700;color:var(--muted);}
.ingredient-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);}
.ingredient-row:last-child{border-bottom:none;}
.ingredient-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:2px;}
.step-row{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid var(--border);cursor:pointer;transition:opacity .2s;}
.step-row:last-child{border-bottom:none;}
.step-circle{width:32px;height:32px;border-radius:50%;flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;transition:all .2s;}
.servings-ctrl{display:flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:6px 12px;}
.servings-btn{width:26px;height:26px;border-radius:50%;border:1.5px solid var(--border2);background:var(--surface2);cursor:pointer;font-size:16px;font-weight:700;color:var(--ink);display:flex;align-items:center;justify-content:center;line-height:1;transition:all .15s;font-family:var(--f);}
.servings-btn:hover{border-color:var(--green);color:var(--green);}
.servings-num{font-size:15px;font-weight:700;color:var(--ink);min-width:22px;text-align:center;}
.recipe-skeleton{background:var(--surface);border-radius:16px;overflow:hidden;border:1px solid var(--border);margin-bottom:12px;}
.skeleton-img{width:100%;height:140px;background:linear-gradient(90deg,var(--surface) 25%,var(--surface2) 50%,var(--surface) 75%);background-size:400% 100%;animation:shimmer 1.4s ease-in-out infinite;}
.skeleton-line{height:12px;border-radius:6px;background:linear-gradient(90deg,var(--surface) 25%,var(--surface2) 50%,var(--surface) 75%);background-size:400% 100%;animation:shimmer 1.4s ease-in-out infinite;margin-bottom:8px;}
@keyframes shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
.youtube-btn{display:flex;align-items:center;gap:8px;padding:10px 16px;background:#FF0000;border:none;border-radius:10px;cursor:pointer;font-family:var(--f);font-size:13px;font-weight:700;color:var(--ink);width:100%;justify-content:center;transition:background .15s;margin-bottom:10px;}
.youtube-btn:hover{background:#CC0000;}

/* ── DESIGNSPROG FRA HJEM, RULLET UD TIL HELE APPEN ──
   Tryk-feedback på trykbare kort/rækker/chips — samme mønster som
   .recipe-card/.home-shortcut-card. Afgrænset til klasser der allerede
   erklærer cursor:pointer (kodebasens egen konvention for "dette kan trykkes"),
   så statisk/ikke-trykbart indhold ikke får en vildledende presse-animation.
   .btn tilføjet 25. sept. 2026 (opfølgning: "sikr at disabled-state og
   active-state har tydelig nok forskel" på Onboardings "Fortsæt →") — den
   delte .btn-klasse manglede hidtil helt visuel tryk-feedback (kun
   :hover, ikke touch-relevant), i modsætning til stort set alle andre
   trykbare elementer i appen. .btn:disabled{transform:none!important}
   (theme.jsx) sikrer at en deaktiveret knap aldrig "presser" ved et
   forsøgt tryk. */
.home-mini-card:active,.scan-hero:active,.hist-row:active,.step-row:active,
.mp-lang-dropdown:active,.mp-lang-opt:active,.chip:active,.home-chip:active,
.filter-chip:active,.ap-chip:active,.recipe-filter-chip:active,.tab:active,
.demo-code:active,.topbar-avatar:active,.menu-item:active,.menu-profile-card:active,
.scroll-top-btn:active,.admin-tab:active,.admin-action-card:active,
.admin-list-row:active,.destructive-confirm-btn:active,.plain-cancel-btn:active,
.enum-chip:active,.enum-row:active,.enum-remove:active,.member-pick:active,
.btn:active{
  transform:scale(.97);
}
.enum-chip,.enum-row,.enum-remove,.member-pick{cursor:pointer;}

/* AdminScreen.jsx bruger udelukkende inline styles (aldrig CSS-klasser), så
   ovenstående globale :active-udrulning (14. sept.) aldrig ramte den —
   disse tre dækker filens tre mest gentagne trykbare mønstre (sektions-
   faneblade, hurtig-handling-kort, liste-rækker). cursor:pointer sættes
   her (ikke inline) for at kvalificere til :active-reglen ovenfor. */
.admin-tab,.admin-action-card,.admin-list-row{cursor:pointer;}

/* Løs tekst — ikke inde i et kort/surface — ligger nu direkte oven på
   baggrundens punkt-gitter. Et fint, lyst "løft" (ikke en blur/glød) holder
   den læsbar uden at det ligner en fejl. */
.screen-title,.screen-sub,.section-lbl,.mp-title,.mp-subtitle,.mp-section-lbl,
.welcome-wordmark-text,.welcome-tagline,
.step-title,.step-sub,.onboard-skip{
  text-shadow:0 1px 0 rgba(255,255,255,.7);
}

/* ── ACCESSIBILITY ── */
.btn{min-height:44px;}
.nav-item{min-height:44px;min-width:44px;}
*:focus-visible{outline:2.5px solid var(--green);outline-offset:2px;border-radius:4px;}
.skip-link{position:absolute;top:-100px;left:16px;background:var(--green);color:var(--on-green);padding:8px 16px;border-radius:8px;font-size:14px;font-weight:700;z-index:9999;text-decoration:none;}
.skip-link:focus{top:8px;}
@media (prefers-reduced-motion: reduce) {
  *{animation-duration:0.01ms !important;animation-iteration-count:1 !important;transition-duration:0.01ms !important;}
  .spinner{animation:none;border-color:var(--green);}
}
@media (prefers-contrast: more) {
  :root{--muted:rgba(240,240,238,.75);--muted2:rgba(240,240,238,.60);--border:rgba(255,255,255,.22);--border2:rgba(255,255,255,.32);}
}
@media (min-resolution: 2dppx) {
  .field{font-size:16px;}
}
`;

export const color = (key) => THEME[key] ?? `var(--${key})`;
