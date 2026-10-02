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

  // Grønt to-farve-system (låst 27. sept. 2026, se :root i denne fil for
  // fuld begrundelse) — green er primær handlingsfarve, greenAccent er en
  // separat, lysere highlight-farve kun til små positive mikro-elementer.
  green:        "#0F7D4F",
  greenDark:    "#0C643F",
  greenGlow:    "#15945F",
  greenLt:      "rgba(15,125,79,.10)",
  greenMid:     "rgba(15,125,79,.18)",
  greenText:    "#0F7D4F",
  greenAccent:  "#34D06A",
  greenAccentLt:"rgba(52,208,106,.14)",
  onGreen:      "#FFFFFF", // Tekstfarve på grøn baggrund (knapper, badges)

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
  /* Grønt to-farve-system — låst 27. sept. 2026 (MASTER PROMPT-brief, se
     CLAUDE.md afsnit 5/7), superseding den tidligere ENE-grønne lås fra
     25. sept. --green er igen appens primære handlingsfarve: knapper,
     aktive toggles/tabs/faner, primære CTA'er, aktive trin-markører,
     centrale handlingspunkter (bl.a. Scan-knappen). --green-accent er en
     lysere, adskilt highlight-farve KUN til små positive mikro-elementer
     (checkmarks, "safe"-badges/dots, kamera-reticle-accenter) - den må
     IKKE bruges til knapper/aktive tilstande, så den ikke overtager som
     primær handlingsfarve (brugerens eksplicitte krav). */
  --green:#0F7D4F;
  --green-dark:#0C643F;
  --green-logo:#34D06A;
  --green-glow:#15945F;
  --green-lt:rgba(15,125,79,.10);
  --green-mid:rgba(15,125,79,.18);
  --green-text:#0F7D4F;
  --green-selected-bg:#EFF9F4;
  --green-halo:#DDF4E8;
  --on-green:#FFFFFF;
  /* Låste logo-/brandfarver (29. sept. 2026, "Opdater EatSafe-brandingen i
     headers", rettet 29. sept. 2026 efter et reelt farve-fund — se nedenfor)
     — hentet direkte fra de FASTE SVG-master-filerne (src/assets/logo/
     eatsafe-logo-horizontal.svg), IKKE de samme som appens almindelige
     --ink/--green-UI-tokens ovenfor. Bruges KUN til at gengive selve
     EatSafe-ordmærket som tekst (headerens/onboardingens wordmark) — ikke
     til almindelig UI (knapper, ikoner osv.), som fortsat bruger --ink/
     --green. Navngivet forskelligt fra den eksisterende --green-logo (som
     reelt er aliaset til --green-accent og driver kamera-reticle/laser-
     linjen — et andet, ikke-relateret formål) for at undgå forveksling.
     --brand-ink:#232528 er "Eat"-teksten i SVG'en, fill="#232528" (flad
     farve, ingen gradient) — korrekt uændret.
     --brand-green-gradient: "Safe"-teksten i SVG'en er IKKE en flad farve
     — dens <path> har fill="url(#greenGrad)", en venstre-til-højre-gradient
     (stops #70DC59→#17BF55→#039A55, samme gradient som logoets lille
     tjekmærke-cirkel). Et tidligere forsøg (samme dag) brugte fejlagtigt
     #039A55 alene som en FLAD farve for hele "Safe" — det er reelt kun
     farven på tjekmærke-CIRKLEN i symbolet, ikke selve wordmark-teksten;
     fundet ved at gen-optælle fill-værdier i selve SVG-kildefilen
     (fill="url(#greenGrad)" optræder præcis dér hvor "Safe"-bogstaverne
     tegnes) i stedet for at antage den ene grønne hex-værdi i filen var
     "facit". Brugt via background-clip:text på selve wordmark-spannet
     (se .topbar-wordmark-safe nedenfor), IKKE som en simpel text-color. */
  --brand-ink:#232528;
  --brand-green-gradient:linear-gradient(90deg, #70DC59 0%, #17BF55 52%, #039A55 100%);
  /* Accent-grønt — kun små highlights (checkmarks, safe-badges/dots,
     reticle), se kommentaren ovenfor. */
  --green-accent:#34D06A;
  --green-accent-lt:rgba(52,208,106,.14);
  --green-accent-mid:rgba(52,208,106,.26);
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
  --neutral:#6B7A70;--neutral-lt:rgba(107,122,112,.12);--unknown:#6F6B63;
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
   inkl. Scan-forsiden, fortsat bruger uændret). Genbrugt for Historik,
   Favoritter, Allergileksikon, Familie og Madpas (26. sept. 2026, se
   App.jsx) — samme lag, ingen ny klasse. */
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
  /* Topafstand inkluderer nu env(safe-area-inset-top) (27. sept. 2026,
     "Opdater EatSafe-headeren"-brief, punkt 4) — manglede helt før, så
     headeren i praksis kunne sidde tættere på statuslinjen/Dynamic Island
     end de 12px selv tilsigtede på notch-enheder. */
  padding:calc(12px + env(safe-area-inset-top)) 20px 10px;
  display:flex;align-items:center;justify-content:space-between;
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
/* Header-tekstlogo (27. sept. 2026, "Opdater EatSafe-headeren"-brief) —
   erstatter det fulde EatSafeLogo-billedeaktiv (symbol+ordmærke) KUN i
   denne kompakte header-kontekst; scanner-/stregkode-ikonet skal fremover
   udelukkende signalere selve scan-funktionen (Scan-knappen, bundnav),
   ikke bruges som del af brandingen her.
   29. sept. 2026, "Opdater EatSafe-brandingen i headers": farverne skiftet
   fra appens almindelige --ink/--green-UI-tokens til de FASTE, låste logo-
   brandfarver --brand-ink/--brand-green-gradient (samme farver som selve
   master-SVG'en på velkomstsiden bruger, se :root-kommentaren ovenfor) —
   headeren skal nu farvemæssigt matche velkomstsidens rigtige logo, ikke
   blot appens generelle UI-palet. Størrelse øget yderligere ~10%
   (24px→26px, oven i den tidligere 20-25%-forøgelse fra 27. sept.) for
   bedre visuel balance mod Feedback-/hamburger-knapperne, vægt hævet til
   800 (fra 700) for et tungere, mere "logotype"-agtigt udtryk — selve
   ordmærket i SVG'en er tegnet som faste vektorformer (ikke rigtig tekst),
   så en pixel-identisk skrifttype-gengivelse via CSS er ikke muligt; dette
   er den tætteste praktisk opnåelige match inden for appens ene faste
   skrifttype (DM Sans).
   Rettet SAMME dag: "Safe" er en gradient i SVG'en (fill="url(#greenGrad)"),
   ikke en flad farve — background-clip:text erstatter den tidligere,
   forkerte flade color:var(--brand-green). */
.topbar-wordmark{font-size:26px;font-weight:800;color:var(--brand-ink);letter-spacing:-.4px;line-height:1;white-space:nowrap;}
.topbar-wordmark-safe{background:var(--brand-green-gradient);background-clip:text;-webkit-background-clip:text;color:transparent;-webkit-text-fill-color:transparent;}
/* BETA-badge — samme varme/guldbrune farve som før, nu i en delt klasse i
   stedet for inline styles, med line-height:1 + inline-flex-centrering så
   den altid centrerer sig lodret mod tekstlogoet uanset dets nøjagtige
   linjehøjde (den tidligere marginTop:2-hack kompenserede specifikt for
   billedlogoets egen indre luft, og er ikke længere nødvendig). */
.topbar-beta{background:var(--amber);color:var(--ink);font-size:9px;font-weight:800;padding:3px 8px;border-radius:100px;letter-spacing:.5px;line-height:1;display:inline-flex;align-items:center;flex-shrink:0;}
.topbar-avatar{width:32px;height:32px;background:var(--green-lt);border:1.5px solid var(--green-mid);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--green);cursor:pointer;transition:all .15s;letter-spacing:.3px;}
.topbar-avatar:hover{background:var(--green-mid);}

/* ── JURIDISKE UNDERSIDER (Brugsvilkår/Privatlivspolitik, 29. sept. 2026) ──
   Selvstændig header, samme højde-/padding-formel som .topbar ovenfor (så
   den føles identisk, uanset at disse to sider kan åbnes BÅDE fra
   kontekster med AppHeader (Indstillinger/Profil) OG uden (Velkommen/Log
   ind, hvor AppHeader er skjult) — for at undgå at navigationen ser
   forskellig ud afhængigt af hvor siden blev åbnet fra, viser Brugsvilkår/
   Privatlivspolitik ALTID denne ene, selvstændige header i stedet for selve
   AppHeader, aldrig begge på samme tid. Solid baggrund (ikke frostet glas
   som .topbar) — disse sider har ikke det app-brede baggrundsbillede bag
   sig (se app-bg-hide i App.jsx), så der er intet at tone/sløre igennem.
   position:fixed, IKKE sticky (bevidst afvigelse fra .topbar) — .app har
   kun overflow-x:hidden sat, hvilket CSS-specifikationen selv "låner ud"
   til at gøre overflow-y:auto (den implicitte regel: sættes den ene akse
   til andet end visible, bliver den anden akse auto, ikke visible) — .app
   bliver dermed teknisk set sin egen "scroll-beholder" for position:sticky,
   MEN har samtidig kun min-height (ikke en loftsat height), så den ALDRIG
   selv får noget at scrolle internt — resultatet er at et sticky-element
   herinde reelt aldrig "sætter sig fast", det scroller væk sammen med
   resten af siden (bekræftet empirisk med Playwright, scroll-test). Fast
   positionering er upåvirket af dette (samme mønster som den eksisterende,
   velfungerende Feedback-knap/offline-banner), og opnår det brugeren
   faktisk bad om: "navigationen altid er tilgængelig ved scroll". */
/* 29. sept. 2026, "Polér designet... Brugsvilkår/Privatlivspolitik": ren hvid
   baggrund (--surface, IKKE --paper — --paper er en let off-white/cremet
   tone, ikke "ren hvid", se design-tokens.md) + lidt strammere lodret
   padding (12/10→10/8px) for en mere kompakt header-højde. Kun HEADEREN er
   ændret til --surface her — selve indholdsområdet nedenfor (.screen,
   dækket af app-bg-hide) beholder --paper uændret, jf. opgavens "ændr intet
   andet". */
.legal-topbar{
  background:var(--surface);
  border-bottom:1px solid var(--border);
  padding:calc(10px + env(safe-area-inset-top)) 20px 8px;
  /* gap 12→16px (29. sept. 2026, "Polér designet... så de ser ens og mere
     gennemførte ud"): lidt mere luft mellem tilbageknap og titel. */
  display:flex;align-items:center;gap:16px;
  /* left/right:0 + max-width/margin matcher .app's egen 480px-loft +
     center-på-desktop (samme opskrift som .app selv) — ellers ville en
     position:fixed-header med left/right:0 alene strække sig ud over hele
     browservinduet i stedet for kun appens 480px-"telefon"-kolonne på en
     bred desktop-skærm. */
  position:fixed;top:0;left:0;right:0;max-width:480px;margin:0 auto;z-index:60;
}
/* 44×44px touch-target BEVARET (eksplicit krav), men det SYNLIGE, farvede
   spor er nu en mindre, lettere cirkel centreret indeni — samme "usynlig
   trykflade rundt om et mindre synligt element"-mønster som Settings-
   skærmens Toggle-komponent bruger andre steder i appen. Selve knappen
   (.legal-topbar-back) er nu uden baggrund/kant/skygge — kun den indre
   .legal-topbar-back-circle bærer det visuelle udtryk, mindre og lettere
   end før (44px farvet cirkel + skygge → 32px, ingen skygge). */
.legal-topbar-back{
  background:none;border:none;padding:0;
  width:44px;height:44px;flex-shrink:0;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
}
/* 32→36px (29. sept. 2026, "Polér designet... så de ser ens og mere
   gennemførte ud" — "tilbageknappen en anelse større visuelt, men stadig
   diskret") — stadig ingen skygge/mørk kant, kun en let baggrund + tynd,
   neutral kant, så den forbliver diskret trods den lidt større flade. */
.legal-topbar-back-circle{
  width:36px;height:36px;border-radius:50%;
  background:var(--paper2);border:1px solid var(--border);
  display:flex;align-items:center;justify-content:center;
}

/* ── LAYOUT ── */
.screen{flex:1;padding:0 16px calc(110px + env(safe-area-inset-bottom));position:relative;z-index:1;}
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
/* Opaciteten er dæmpet ~25% (29. sept. 2026, "en mere balanceret og rolig
   forside" — .7/.5 skaleret til .53/.38), samme skala/timing i øvrigt. */
@keyframes scan-halo-pulse{
  0%,100%{transform:scale(1);opacity:.53;}
  50%{transform:scale(1.06);opacity:.38;}
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
/* Browserens native autofill-baggrund (kraftig gul i Chrome/Safari) er
   overstyret her, så et autofillet felt (fx e-mail på Log ind-fanen) ser ud
   som et almindeligt EatSafe-felt (29. sept. 2026, "FINAL POLISH – NY
   BRUGER/LOG IND", punkt 2). Selve autofill-funktionaliteten er uændret —
   kun det visuelle udtryk. Et stort inset-box-shadow-spread i feltets egen
   baggrundsfarve er den eneste pålidelige måde at overstyre Chromiums
   indbyggede autofill-styling på, da almindelig background-styling alene
   ignoreres af browseren her. Den lange transition-delay forhindrer et
   kort gult glimt, før autofill-stylingen selv når at anvendes. */
.field:-webkit-autofill,
.field:-webkit-autofill:hover,
.field:-webkit-autofill:focus{
  -webkit-text-fill-color:var(--ink);
  caret-color:var(--ink);
  -webkit-box-shadow:0 0 0 1000px var(--surface2) inset;
  box-shadow:0 0 0 1000px var(--surface2) inset;
  border-color:var(--border2);
  transition:background-color 600000s ease-in-out 0s;
}
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
/* Alder-steppens minus/plus-knapper (FormFields.jsx) — tydelig tryk-
   feedback (27. sept. 2026, "FINAL 10/10 POLISH – ONBOARDING TRIN 1"),
   samme lette scale-mønster som andre trykbare elementer i appen (fx
   .recipe-card:active ovenfor), plus en mørkere baggrund så trykket også
   er synligt på enheder uden animation (prefers-reduced-motion). */
.age-step-btn{transition:transform .1s,background .1s;}
.age-step-btn:active{transform:scale(.9);background:var(--border2);}
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
.btn-primary svg,.btn-green svg{stroke:var(--on-green);}
.btn-primary:disabled,.btn-green:disabled{background:var(--border);color:var(--muted);box-shadow:none;opacity:1;}
.btn-primary:disabled svg,.btn-green:disabled svg{stroke:var(--muted);}

/* ── CHIPS & TAGS ── */
.chip-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;}
.chip{display:flex;align-items:center;gap:8px;min-height:44px;padding:10px 12px;border-radius:10px;border:1.5px solid var(--border2);background:var(--surface);cursor:pointer;transition:all .15s;font-size:12.5px;font-weight:600;color:var(--ink2);user-select:none;}
.chip:hover{border-color:var(--border2);color:var(--ink);}
.chip.on{border-color:var(--green);background:var(--green-selected-bg);color:var(--green);font-weight:700;}
.chip-check{margin-left:auto;width:16px;height:16px;background:var(--green-accent);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;color:var(--ink);flex-shrink:0;}
.tags{display:flex;flex-wrap:wrap;gap:6px;}
.tag{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:var(--green-lt);border:1px solid var(--green-mid);border-radius:100px;font-size:12px;color:var(--green);font-weight:600;}
.tag-x{cursor:pointer;opacity:.4;font-size:13px;padding:4px 6px;margin:-4px -6px -4px 0;border-radius:50%;}.tag-x:hover{opacity:.8;background:rgba(21,32,26,.06);}

/* ── BADGES ── */
.badge{font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:6px;white-space:nowrap;letter-spacing:.2px;}
.badge.safe{background:var(--green-accent-lt);color:var(--green-dark);border:1px solid var(--green-accent-mid);}
.badge.danger{background:var(--red-lt);color:var(--red);border:1px solid var(--red-md);}
.badge.warn{background:var(--amber-lt);color:var(--amber);border:1px solid var(--amber-md);}

.divider{display:flex;align-items:center;gap:10px;margin:12px 0;color:var(--muted);font-size:11.5px;font-weight:600;letter-spacing:.3px;}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--border);}

/* ── WELCOME ── */
/* 28. sept. 2026, "FINAL POLISH" — justify-content:center fjernet til fordel
   for to usynlige spacer-elementer (.welcome-vspace-top/-bottom, se JSX)
   med ULIGE flex-grow-vægt (0.62:1). En almindelig justify-content:center
   deler altid al ledig plads 50/50 over/under indholdet — brugerfeedback var
   at det gav "en anelse for meget tom plads over hero-indholdet". De to
   spacers fordeler i stedet den ledige plads ca. 38/62 (top/bund), så
   kompositionen rykker en anelse op uden at ændre selve layoutet eller
   miste whitespace — og skalerer proportionalt på tværs af enhver
   skærmhøjde (krymper begge til 0 på de mindste skærme, hvor der slet ikke
   er ledig plads at fordele) — på den mindste iPhone (SE-klasse, 320×568)
   var indholdet i forvejen en anelse højere end skærmen FØR denne
   omgang (uændret, kendt vilkår); begge spacers krymper her til ~0, og
   den lodrette padding/margin er strammet en anelse ekstra (se nedenfor)
   så den nye, længere juridiske tekst (krav 6) ikke øger det eksisterende
   overløb yderligere. Padding sat ned fra 48px til 20px lodret (spacers
   giver den resterende luft på større skærme) og fra 28px til 22px
   vandret (frigiver de sidste par pixel til benefit-rækken, se
   .welcome-benefits nedenfor). */
.welcome-screen{min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:20px 22px;text-align:center;}
/* 0.62→0.42 (29. sept. 2026, "Polér velkomst-/login-siden", punkt 2: flyt
   hovedindholdet yderligere op — for meget tom luft mellem Feedback-knappen
   og logoet). Samme mekanisme som før (se kommentaren ovenfor), kun en
   mindre justering af vægtforholdet. */
.welcome-vspace-top{flex:0.35 1 0%;min-height:0;}
.welcome-vspace-bottom{flex:1 1 0%;min-height:8px;}
.welcome-logo-wrap{display:flex;flex-direction:column;align-items:center;margin-bottom:0;}
/* Delt brand-slogan-klasse "Mere tryghed i hverdagen" (27. sept. 2026,
   MASTER PROMPT-brief) — en diskret brand statement, IKKE en funktionel
   undertekst (den rolle har .welcome-tagline nedenfor uændret, og
   SettingsScreen.jsx's egne rækketekster). Bevidst dæmpet/lille, muted
   farve, bred letter-spacing, så den læses som en rolig signatur, ikke
   endnu en overskrift der konkurrerer med sidens hovedbudskab. Brugt KUN
   to steder: under logoet på velkomstsiden (OnboardingScreen.jsx), og i
   "Om EatSafe"-kortet i Indstillinger (SettingsScreen.jsx) — IKKE gentaget
   på andre skærme eller i topbaren, jf. brief'ens eksplicitte "aldrig fast
   gentagelse". */
.brand-slogan{font-size:12px;color:var(--muted);letter-spacing:.6px;text-transform:uppercase;font-weight:600;}
/* 29. sept. 2026, "Polér velkomst-/login-siden": scoped til KUN
   velkomstsidens instans (ikke SettingsScreen.jsx's "Om EatSafe"-brug af
   samme delte klasse) — mørkere (var udvasket) + lidt mindre letter-spacing,
   stadig klart sekundær ift. selve logoet. margin-top 8→14 (punkt 9:
   logo→tagline, mål 12-16px).
   29. sept. 2026, "Ryk sloganet op til logoet": margin-top 14→6px —
   brugerfeedback (skærmbillede) om at sloganet sad for langt fra logoet.
   29. sept. 2026, "Fordel indholdet mere naturligt": margin-top 6→16px
   (+10px, inden for det ønskede +8-12px) — samlet redistribuering af hele
   sidens lodrette spacing (se .welcome-benefits/.welcome-btn-kommentarer
   nedenfor for resten), efter feedback om at siden virkede for kompakt
   foroven/midtfor med for meget ubrugt plads forneden.
   29. sept. 2026, "logo og slogan skal føles som én samlet brandblok":
   margin-top 16→4px (-12px, inden for det ønskede -12-16px) — 16px havde
   overkorrigeret, så logo og slogan igen virkede som to adskilte
   elementer i stedet for én visuel enhed. */
.welcome-logo-wrap .brand-slogan{margin-top:4px;color:var(--ink2);letter-spacing:.4px;}
/* Tydelig value proposition (25. sept. 2026-brief: "kort og tydelig value
   proposition") — hævet fra en dæmpet, muted tagline til en tydeligere,
   mørkere sætning, så den reelt fungerer som skærmens hovedbudskab, ikke en
   sekundær undertekst. Hævet endnu en anelse samme dag (opfølgning) — var
   stadig for diskret: 15.5px→16.5px, --ink2→--ink (fuld tekstfarve).
   max-width øget 280px→300px (28. sept. 2026, "FINAL POLISH") — den
   opdaterede, længere hovedbudskab-tekst ("...allergier og kosthensyn")
   fik en akavet 3. linje med kun ét ord ved den gamle bredde.
   27. sept. 2026, "FINAL MICRO-POLISH": margin-top 12px→16px (mere
   lodret rytme ned til sloganet ovenfor), line-height 1.5→1.6 +
   font-weight 600→500 (de tre linjer skal føles "lettere og mere
   elegante" — stadig fuld --ink-farve + samme størrelse, så det ikke går
   ud over læsbarheden). */
/* margin-top 16→26 (29. sept. 2026, "Polér velkomst-/login-siden", punkt 9:
   tagline→intro, mål 24-28px). max-width 300→340px (punkt 4: maks. 2 linjer
   ved standard skærmbredde — 300px brækkede teksten i 3 linjer).
   29. sept. 2026, "sidste spacing-polering": margin-top 26→16 (8-12px
   mindre luft til sloganet ovenfor) + max-width 340→324 (8px ekstra luft i
   hver side — det opgivne mål var 12-16px, men 324px er grænsen for at
   teksten stadig kan stå på 2 linjer på standard/Pro Max-bredde, som en
   tidligere runde eksplicit krævede; en smallere bredde brækker den i 3
   linjer, afprøvet empirisk).
   29. sept. 2026, "Fordel indholdet mere naturligt": margin-top 16→24px
   (+8px, som ønsket) — se .welcome-logo-wrap .brand-slogan-kommentaren
   ovenfor for hele redistribueringens baggrund. */
.welcome-tagline{font-size:16.5px;color:var(--ink);margin-top:24px;letter-spacing:.1px;font-weight:500;line-height:1.6;max-width:324px;}
.welcome-divider{width:40px;height:2px;background:var(--border2);border-radius:2px;margin:32px auto;}
/* 3 fordele-række (25. sept. 2026-brief) — kort, ikon-båret opsummering,
   IKKE tunge fuld-bredde feature-kort (erstatter tidligere .welcome-features/
   .welcome-feat, som aldrig blev taget i brug). Bevidst let/luftig, ingen
   kant/skygge på selve rækken — kun ikon-cirklerne er "kort" (afrundede,
   meget lys grøn baggrund #EFF9F4, brugerens egen definerede farvepalet).
   gap 22px→14px + .welcome-benefit max-width 100px→130px (28. sept. 2026,
   "FINAL POLISH") — reelt fund: "Tjek allergener" og "Tryggere indkøb"
   brød begge over to linjer ved den gamle, snævrere kolonnebredde, mens
   "Hurtigt svar" stod på én — en synligt ujævn række. Ved standard
   iPhone-bredde giver den nye gap+max-width+font-size (se
   .welcome-benefit-label) alle tre nok plads til én linje hver. */
/* margin 28px 0 32px → 34px 0 40px (29. sept. 2026, "Polér velkomst-/
   login-siden", punkt 9: intro→fordele mål 32-36px, fordele→primær-CTA
   mål 38-44px — .welcome-logo-wrap's tidligere inline marginBottom:16 er
   samtidig fjernet i JSX, så dette top-mål er den ENESTE kilde til det
   mellemrum).
   29. sept. 2026, "sidste designpolering": margin-top 34→24px (10px
   mindre luft til intro-teksten, mål 8-12px) og margin-bottom 40→32px
   (8px mindre luft til "Opret gratis konto"). Vandret padding 0→4px
   tilføjet (mål: yderste labels sad for tæt på skærmkanterne) — på
   selve raden, ikke på de enkelte .welcome-benefit-kolonner, så de tre
   kolonner i princippet forbliver lige brede og ikon/tekst-alignment er
   uændret. Bevidst kun 4px, ikke 8px: hver .welcome-benefit-label har
   white-space:nowrap (låst i en tidligere runde, så label'en aldrig
   brækker over 2 linjer) — en flex-række med flex:1 fordeler kun
   PRÆCIST ligeligt så længe alle tre kolonners tilgængelige bredde er
   over hver labels naturlige (nowrap) bredde; ved 320px-skærmbredden
   (mindste testede) var 8px/side nok til at skubbe layoutet under den
   grænse, hvilket gjorde kolonnerne synligt ulige (102/82/99px, målt
   med Playwright) — 4px/side holder sig under grænsen på alle tre
   testede bredder (320/390/430px), verificeret at kolonnerne forbliver
   pixel-lige efter ændringen.
   29. sept. 2026, "Fordel indholdet mere naturligt": margin-top 24→40px
   (+16px) og margin-bottom 32→48px (+16px), begge inden for det ønskede
   +16-20px — den ekstra højde optager naturligt den plads
   .welcome-vspace-bottom (se JSX) ellers ville reservere som ubrugt luft
   nederst, i stedet for at gøre selve elementerne mindre.
   29. sept. 2026, "logo og slogan skal føles som én samlet brandblok":
   margin-top 40→24px (-16px, mål -16-20px) og margin-bottom 48→28px
   (-20px, mål -20-24px) — forrige runde overkorrigerede, siden virkede
   for "mast fra hinanden" i stedet for rolig. */
.welcome-benefits{display:flex;justify-content:center;gap:14px;margin:24px 0 28px;padding:0 4px;width:100%;box-sizing:border-box;}
/* gap 8→4px (29. sept. 2026, "sidste spacing-polering": labels 3-5px
   tættere på deres ikoner). */
.welcome-benefit{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;max-width:130px;}
/* 44px→40px (~9% mindre, punkt 5) — stadig præcist ens for alle tre, samme
   centrering/skygge/baggrund. border-radius skaleret tilsvarende 14→13px. */
.welcome-benefit-icon{width:40px;height:40px;border-radius:13px;background:var(--green-selected-bg);display:flex;align-items:center;justify-content:center;box-shadow:var(--sh);flex-shrink:0;}
/* 13px→12px (28. sept. 2026, "FINAL POLISH", se .welcome-benefits-kommentar
   ovenfor) — den mindste af de to justeringer der var nødvendige for at få
   alle tre labels til at stå på én linje ved standard iPhone-bredde, jf.
   kravet om at justere kolonnebredde/font-size minimalt frem for at gøre
   hele rækken mindre. Tidligere hævet fra 11.5px, se historik i git. */
.welcome-benefit-label{font-size:12px;font-weight:700;color:var(--ink);line-height:1.35;white-space:nowrap;}
/* Primær CTA — EatSafes låste --green/--green-dark-token (25. sept.
   2026-designsystem, se CLAUDE.md afsnit 5/7). Var tidligere hardkodet til
   den daværende Scan-CTA-only-palet (#0E8F5A→#08734A) adskilt fra
   --green — nu samme farve, så ingen adskillelse længere nødvendig.
   (Ryddet op i en duplikeret, tavst-vindende .welcome-btn-regel
   længere nede i filen, som pga. CSS-cascade reelt overskrev denne.)
   border-radius 14px→16px + skygge dæmpet (28. sept. 2026, "FINAL POLISH":
   "shadow/glow skal være subtil og premium, ikke kraftig") — samme
   grøn-toning, men opacity/blur skåret ned, så den løfter knappen uden at
   dominere kompositionen. text-align:center tilføjet eksplicit (var
   allerede visuelt centreret via browserens standard <button>-opførsel,
   men gjort eksplicit så det ikke afhænger af det). */
.welcome-btn{background:linear-gradient(160deg,var(--green) 0%,var(--green-dark) 100%);color:var(--on-green);border:none;border-radius:16px;padding:16px 32px;font-family:var(--f);font-size:15px;font-weight:700;text-align:center;cursor:pointer;width:100%;transition:all .18s;margin-bottom:12px;letter-spacing:-.1px;box-shadow:0 8px 18px -10px rgba(8,115,74,.32);}
.welcome-btn:hover{transform:translateY(-1px);box-shadow:0 10px 22px -10px rgba(8,115,74,.4);}
.welcome-btn:active{transform:scale(.98);}
.welcome-btn-ghost{background:var(--surface);color:var(--ink2);border:1.5px solid var(--border2);border-radius:16px;padding:14px 32px;font-family:var(--f);font-size:14px;font-weight:600;text-align:center;cursor:pointer;width:100%;transition:all .18s;}
.welcome-btn-ghost:hover{background:var(--surface2);}
/* min-height + flex-centrering, SCOPED til kun velkomstsidens egen brug af
   .welcome-btn/.welcome-btn-ghost (29. sept. 2026, "Polér velkomst-/
   login-siden", punkt 6/7: højde ca. 60-64px / 54-58px) — de samme to
   klasser genbruges også af Opret konto/Log ind-formularens submit-knapper
   (.login-wrap), som er UDEN for denne opgaves scope og derfor ikke må
   ændre højde. Mere præcist/robust end at ramme en højde via padding alene
   (afhænger af font-metrics på tværs af browsere) — teksten centreres
   eksplicit i stedet. */
.welcome-screen .welcome-btn{min-height:62px;display:flex;align-items:center;justify-content:center;}
.welcome-screen .welcome-btn-ghost{min-height:56px;display:flex;align-items:center;justify-content:center;}
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
/* Bekræft din e-mail (VerifyEmailScreen.jsx, 30. sept. 2026): samme kort og knapper som Opret konto, centreret og roligt. */
.verify-wrap .welcome-logo-wrap{margin-bottom:24px;}
.verify-card{text-align:center;padding:26px 20px 24px;margin-bottom:16px;}
.verify-icon{width:52px;height:52px;border-radius:16px;background:var(--green-lt);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;}
.verify-title{font-size:19px;font-weight:800;color:var(--ink);margin-bottom:10px;letter-spacing:-.2px;}
.verify-text{font-size:13.5px;color:var(--ink2);line-height:1.55;}
.verify-email{font-size:14px;font-weight:700;color:var(--ink);margin:2px 0 10px;word-break:break-all;}
.verify-wrap .welcome-btn,.verify-wrap .welcome-btn-ghost{min-height:52px;display:flex;align-items:center;justify-content:center;}
.verify-wrap .welcome-btn-ghost{margin-bottom:6px;}
.verify-wrap .welcome-btn-ghost:disabled{opacity:.6;cursor:default;}
.verify-links{display:flex;flex-direction:column;align-items:center;gap:4px;margin-top:6px;text-align:center;}
.verify-links .link-green{min-height:44px;display:inline-flex;align-items:center;}
.verify-help{font-size:12px;color:var(--muted);line-height:1.5;}
/* Segmenteret kontrol — "Ny bruger | Log ind" aktiv-tilstand hævet fra en
   næsten usynlig markering (samme --surface2-farve som rækkens egen
   baggrund, kun adskilt af en skygge) til en tydelig, men rolig markering
   (25. sept. 2026-brief) — hvid pille i EatSafes scan-CTA-grøn tekstfarve
   (#0E8F5A) på en meget lys grøn baggrund (#EFF9F4), samme palet som resten
   af onboarding-flowet. */
.tab-row{display:flex;gap:3px;background:var(--green-selected-bg);border-radius:10px;padding:3px;margin-bottom:14px;border:1px solid var(--green-mid);}
.tab{flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;color:var(--ink2);transition:all .15s;}
/* Enkelt, diskret skygge i stedet for den delte to-lags .sh-token (29. sept.
   2026, "FINAL POLISH – NY BRUGER/LOG IND", punkt 4) — .sh's inset hvide
   linje + drop-skygge kunne sammen med .tab-row's egen grønne kant virke som
   en dobbelt kant omkring den aktive fane; én blød drop-skygge er nok til at
   løfte pillen fra baggrunden. */
.tab.active{background:var(--surface);color:var(--green);box-shadow:0 1px 3px rgba(21,32,26,.10);}
/* Sociale login-knapper — hvide/neutrale med platformens eget ikon (25.
   sept. 2026-brief: "undgå en stor blå Facebook-knap, fordi den stjæler
   fokus fra EatSafe"). Én delt klasse for Google/Facebook (Apple fjernet
   igen samme dag), så begge reelt er visuelt lige stærke — og altid
   svagere end .welcome-btn (den primære CTA), som briefen kræver. */
.social-btn{display:flex;align-items:center;justify-content:flex-start;gap:10px;width:100%;padding:14px 16px 14px max(16px,calc(50% - 106px));background:var(--surface);border:1px solid var(--border2);border-radius:12px;cursor:pointer;font-family:var(--f);font-size:14px;font-weight:600;color:var(--ink);transition:all .15s;}
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
.recent-dot.safe{background:var(--green-accent);box-shadow:0 0 7px rgba(52,208,106,.6);}
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

/* ── LIST ──
   Alle fem klasser herunder bruges KUN af ListScreen.jsx (29. sept. 2026,
   "Polér designet på Indkøbsliste") — trygt at justere direkte uden at
   røre andre skærme. */
/* Top/bund-padding 12→8px, ~15% lavere kort, samme vandrette padding. */
.list-item{display:flex;align-items:center;gap:12px;padding:8px 14px;background:var(--surface);border:1px solid var(--border);border-radius:11px;margin-bottom:8px;}
.list-item.done{opacity:.4;}
/* Størrelse 20→17px (en smule mindre, mere fokus til varenavnet) —
   ::before-tap-området er udvidet tilsvarende (13→14.5px) for stadig at
   give en tydelig ~46×46px touch-target uændret fra før. */
.list-check{position:relative;width:17px;height:17px;border-radius:5px;border:2px solid var(--border2);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .18s;font-size:11px;color:var(--on-green);}
.list-check::before{content:'';position:absolute;inset:-14.5px;}
.list-check.checked{background:var(--green);border-color:var(--green);}
.list-name{font-size:14px;font-weight:600;flex:1;letter-spacing:-.1px;color:var(--ink);overflow-wrap:anywhere;}
.list-name.done{text-decoration:line-through;color:var(--muted);}
/* Opacity .2→.35 — en anelse mørkere/lettere at se, stadig tydeligt
   sekundær/diskret ift. hover-tilstandens .6. */
.list-del{position:relative;flex-shrink:0;font-size:15px;cursor:pointer;opacity:.35;padding:10px;margin:-6px -10px -6px 0;transition:opacity .15s;}.list-del:hover{opacity:.6;}
/* Usynlig tap-area-udvidelse til ~44×44px (25. sept. 2026, brugerfeedback:
   "sørg for minimum ca. 44×44 px tap-area") — samme ::before-mønster som
   .list-check ovenfor. Det synlige ikon (16px + 10px padding = 36×36px)
   forbliver visuelt uændret; kun det klikbare område udvides. */
.list-del::before{content:'';position:absolute;inset:-4px;}
/* font-size/letter-spacing rettet til at matche appens almindelige små
   sektionsoverskrift-mønster (fx UI.sectionLbl6/8 i styleUtils.js: 11px/
   700/1px tracking) — var 10.5px/1.4px, en lille, ikke-tilsigtet
   afvigelse. Vægt/farve matchede allerede. */
.list-section{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin:14px 0 8px;}

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

/* ── HISTORY ──
   Var tidligere en flad, kantløs divider-række (border-bottom, ingen
   baggrund/kant/skygge) — reelt et andet visuelt sprog end Indkøbslistens
   .list-item-kort, selvom begge viser samme slags indhold (produktnavn +
   metadata + status). Ensrettet 27. sept. 2026 (MASTER PROMPT-brief,
   navngivet eksempel: "Historik skal føles som søster til Indkøbsliste")
   til samme bordered-card-behandling som .list-item — samme padding/
   baggrund/kant/radius/margin, plus samme tryk-feedback-mønster
   (:active{scale(.99)}) som andre trykbare kort i appen (fx .recipe-card). */
.hist-row{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--surface);border:1px solid var(--border);border-radius:11px;margin-bottom:8px;cursor:pointer;transition:opacity .1s,transform .1s;}
.hist-row:hover{opacity:.85;}
.hist-row:active{transform:scale(.99);}
.menu-item{display:flex;align-items:center;gap:12px;padding:14px 4px;border-bottom:1px solid var(--border);cursor:pointer;transition:opacity .1s;}
.menu-item:hover{opacity:.75;}
.menu-item:last-child{border-bottom:none;}
.menu-profile-card{cursor:pointer;transition:opacity .1s;}
.menu-profile-card:hover{opacity:.85;}
.hist-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.hist-dot.safe{background:var(--green-accent);}.hist-dot.danger{background:var(--red);}.hist-dot.warn,.hist-dot.warning{background:var(--amber);}.hist-dot.not_found{background:var(--muted);}
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
.save-bar{position:fixed;left:50%;transform:translateX(-50%);width:100%;max-width:480px;z-index:99;padding:10px 16px;background:rgba(255,255,255,.96);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-top:1px solid var(--border);box-shadow:0 -8px 16px -12px rgba(21,32,26,.14);animation:saveBarIn .18s ease-out;}
@keyframes saveBarIn{from{opacity:0;transform:translateX(-50%) translateY(8px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
@media (prefers-reduced-motion: reduce){.save-bar{animation:none;}}
.trace-seg{display:flex;gap:3px;background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:3px;}
.trace-seg button{flex:1;min-height:44px;padding:8px 6px;border:1px solid transparent;border-radius:9px;background:transparent;color:var(--ink2);font-family:var(--f);font-size:13px;font-weight:600;line-height:1.25;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;text-align:center;}
.trace-seg button[aria-pressed="true"]{border-color:var(--green);background:var(--green-selected-bg);color:var(--green);font-weight:700;}
.trace-seg button:active{transform:scale(.97);}
@media(max-width:359px){.trace-seg button{font-size:12px;padding:8px 4px;}}
.trace-seg button:focus-visible{outline:2px solid var(--green);outline-offset:1px;}
.consent-box{display:flex;gap:12px;align-items:flex-start;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px;margin:4px 0 14px;cursor:pointer;transition:border-color .15s,background .15s;}
.consent-box.on{border-color:var(--green);background:var(--green-selected-bg);}
.consent-box input{margin:1px 0 0;width:22px;height:22px;accent-color:var(--green);flex-shrink:0;cursor:pointer;}
.consent-main{display:block;font-size:13.5px;font-weight:600;line-height:1.5;color:var(--ink);}
.consent-sub{display:block;font-size:12px;line-height:1.5;color:var(--muted);margin-top:6px;}
.consent-link{display:inline-block;margin-top:8px;padding:6px 0;background:none;border:none;font-family:var(--f);font-size:12.5px;font-weight:700;color:var(--green);text-decoration:underline;cursor:pointer;}
.enum-row{display:grid;grid-template-columns:28px 60px minmax(0,1fr) 40px;column-gap:8px;min-height:48px;padding:6px 8px 6px 12px;background:var(--surface);align-items:start;transition:background .15s;}
.enum-row.on{background:var(--green-selected-bg);}
.enum-check{margin-top:6px;width:24px;height:24px;border-radius:7px;border:1.5px solid var(--border2);background:var(--surface);display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer;transition:background .15s,border-color .15s;}
.enum-row.on .enum-check{background:var(--green);border-color:var(--green);}
.enum-code{font-size:12px;font-weight:800;color:var(--ink);line-height:36px;}
.enum-row.on .enum-code,.enum-row.on .enum-name{color:var(--green);}
.enum-name{font-size:12.5px;line-height:1.4;color:var(--ink2);padding-top:9px;}
.enum-detail{font-size:11px;line-height:1.4;color:var(--muted);margin-top:2px;padding-bottom:6px;}
.enum-info{width:40px;height:36px;display:flex;align-items:center;justify-content:center;background:none;border:none;padding:0;cursor:pointer;}
.enum-check:focus-visible,.enum-info:focus-visible,.consent-link:focus-visible{outline:2px solid var(--green);outline-offset:1px;}
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
#qr-reader-home video{width:100%!important;height:380px!important;object-fit:cover!important;display:block!important;}
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
@keyframes acc-open{from{grid-template-rows:0fr;opacity:0;}to{grid-template-rows:1fr;opacity:1;}}
.acc-body{display:grid;grid-template-rows:1fr;animation:acc-open .2s ease-out;}
.acc-body>div{min-height:0;overflow:hidden;}
@media (prefers-reduced-motion:reduce){.acc-body{animation:none;}}
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
@keyframes laserMove{0%{top:0;}50%{top:calc(100% - 2px);}100%{top:0;}}
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
.mp-scroll{flex:1;overflow-y:auto;padding:0 16px 120px;}
/* Venstre/højre padding fjernet herfra (28. sept. 2026, alignment-fix) —
   .mp-scroll (forælder) giver allerede 16px padding på begge sider til
   ALT sit indhold, samme mål som den delte .screen-klasse. .mp-head
   havde sin EGEN ekstra padding oveni, så titel/undertekst/sektions-
   overskrifter/krydskontaminering endte forskudt fra "Dit madpas"/chips/
   CTA'en (renderMainContent, en søskende-div UDEN for .mp-head) som kun
   fik .mp-scroll's padding. .mp-head bruges kun i MadpasScreen.jsx, så
   denne rettelse påvirker ikke andre skærme. */
.mp-head{padding:10px 0 0;}
/* Fælles designsystem-opgave (29. sept. 2026) — mp-title/mp-subtitle/
   mp-section-lbl matcher nu numerisk .screen-title/.screen-sub/den
   delte sectionLbl-typografi (se .claude/rules/design-tokens.md), så
   Madpas ikke længere skiller sig ud med sin egen titel-størrelse. */
.mp-title{font-size:16px;font-weight:800;color:var(--ink);letter-spacing:-.2px;margin-bottom:3px;}
.mp-subtitle{font-size:11px;color:var(--ink2);font-weight:400;line-height:1.4;margin-bottom:10px;}
.mp-section-lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin:0 0 8px;}
/* mp-lang-dropdown/-list radius (13→12) matcher nu appens andre dropdown-
   komponenter (fx Opskrifters kategori-vælger), og selve dropdownens
   padding er strammet (14px→12px lodret, ~15%) så den ikke længere føles
   som et stort, tomt formularfelt (29. sept. 2026, design-polish). */
.mp-lang-dropdown{width:100%;background:var(--surface);border:1.5px solid var(--border2);border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all .15s;margin-bottom:14px;box-sizing:border-box;}
.mp-lang-dropdown:hover{border-color:var(--green);}
.mp-lang-flag{font-size:20px;flex-shrink:0;}
.mp-lang-name{flex:1;font-size:14px;font-weight:700;color:var(--ink);}
.mp-lang-arrow{font-size:14px;color:var(--muted);}
.mp-lang-list{background:var(--surface);border:1.5px solid var(--border2);border-radius:12px;overflow:hidden;margin-bottom:14px;max-height:320px;overflow-y:auto;}
.mp-lang-opt{display:flex;align-items:center;gap:10px;padding:12px 16px;cursor:pointer;transition:background .1s;border-bottom:1px solid var(--border);}
.mp-lang-opt:last-child{border-bottom:none;}
.mp-lang-opt:hover{background:var(--surface2);}
.mp-lang-opt.on{background:var(--green-lt);}
/* Fremvisningsskærmens knapper (27. sept. 2026, Madpas-finpolish) —
   udtrukket fra tidligere rene inline-styles til klasser, udelukkende for
   at kunne give dem samme tryk-feedback som resten af appens knapper (se
   den delte :active-liste nedenfor) — ingen visuel ændring i sig selv. */
.mp-close-btn{background:var(--surface2);border:none;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}
.mp-speak-btn{width:100%;border:none;border-radius:14px;padding:13px 20px;font-family:var(--f);font-size:17px;font-weight:800;color:var(--on-green);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;}
.mp-cc-toggle{width:48px;height:28px;border-radius:14px;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0;}
.mp-cc-toggle-knob{width:22px;height:22px;border-radius:50%;background:var(--ink);position:absolute;top:3px;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.3);}

/* ── OPSKRIFTER ── */
.recipe-grid{display:flex;flex-direction:column;gap:12px;}
.recipe-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;cursor:pointer;transition:transform .15s,border-color .15s;position:relative;}
.recipe-card:active{transform:scale(.99);}
.recipe-card:hover{border-color:var(--border2);}
.recipe-card-img{width:100%;height:150px;object-fit:cover;display:block;background:var(--surface2);}
.recipe-card-img-placeholder{width:100%;height:120px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:52px;}
.recipe-card-body{padding:12px 14px 14px;}
.recipe-card-title{font-size:16px;font-weight:700;color:var(--ink);line-height:1.25;margin-bottom:4px;letter-spacing:-.2px;}
.recipe-card-desc{font-size:12px;color:var(--ink2);line-height:1.5;margin-bottom:10px;}
.recipe-card-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.recipe-pill{display:inline-flex;align-items:center;gap:4px;height:24px;box-sizing:border-box;padding:0 10px;font-size:11px;font-weight:600;line-height:1;border-radius:100px;border:1px solid var(--border);background:var(--surface2);color:var(--ink2);white-space:nowrap;}
.recipe-safe-bar{display:flex;gap:6px;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--border);margin-top:10px;}
/* Opskrifter (30. sept. 2026): sidste kort skal kunne scrolles helt fri af
   bundnavigationen, også med home-indicator (safe-area) på iPhone. */
.recipes-screen{padding-bottom:calc(120px + env(safe-area-inset-bottom));}
/* Indkøbslistens listevælger (30. sept. 2026): sekundære handlinger, der
   tydeligt er klikbare (hvid flade, synlig kant, mørk tekst) — ikke den
   grå .btn-ghost, som kunne ligne en deaktiveret knap. */
.list-picker-action{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:36px;padding:0 12px;background:var(--surface);border:1px solid var(--border2);border-radius:10px;font-family:var(--f);font-size:13px;font-weight:600;color:var(--ink);cursor:pointer;white-space:nowrap;transition:transform .15s,border-color .15s;}
.list-picker-action:hover{border-color:var(--ink2);}
.list-picker-action:active{transform:scale(.97);}
/* Allergileksikon (30. sept. 2026): samme safe-area-bundafstand som Opskrifter,
   så sidste kort altid kan scrolles helt fri af bundnavigationen. */
.knowledge-screen{padding-bottom:calc(120px + env(safe-area-inset-bottom));}
.kb-card{transition:transform .15s;}
.kb-card:active{transform:scale(.99);}
.recipe-submit-btn{display:inline-flex;align-items:center;gap:4px;flex-shrink:0;height:32px;padding:0 12px 0 10px;border-radius:100px;border:1px solid var(--border2);background:var(--surface);color:var(--green);font-family:var(--f);font-size:13px;font-weight:700;cursor:pointer;}
.recipe-submit-btn:active{transform:scale(.97);}
.recipe-safe-toggle{flex-shrink:0;display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:12px;border:1px solid var(--border2);background:var(--surface);color:var(--ink);font-family:var(--f);font-size:13px;font-weight:600;white-space:nowrap;cursor:pointer;}
.recipe-safe-toggle:active{transform:scale(.97);}
.recipe-safe-toggle-box{width:16px;height:16px;box-sizing:border-box;border-radius:5px;border:1.5px solid var(--border2);background:var(--surface);display:flex;align-items:center;justify-content:center;color:var(--on-green);}
.recipe-safe-toggle.on{border-color:var(--green);background:var(--green-selected-bg);color:var(--green);font-weight:700;}
.recipe-safe-toggle.on .recipe-safe-toggle-box{border-color:var(--green);background:var(--green);}
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
.mp-close-btn:active,.mp-speak-btn:active,.mp-cc-toggle:active,
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
.welcome-tagline,.brand-slogan,
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
