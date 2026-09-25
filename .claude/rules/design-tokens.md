---
description: EatSafe designsystem-tokens (CSS-variabler, spacing-skala) og antimønstre-tjekliste — kun relevant ved UI/CSS-arbejde
paths:
  - "src/*.jsx"
  - "src/theme.jsx"
---

# Designsystem-tokens (`src/theme.jsx`, `:root` CSS-variabler)

```
--ink:#15201A            tekst
--paper:#F6F8F3          baggrund (hvid/lys — IKKE grøn baggrund)
--green:#0E8F5A          EatSafe-designsystemets ENE grønne værdi — låst
                         25. sept. 2026 (se CLAUDE.md afsnit 5/7). Var
                         tidligere #178A50, adskilt fra en Scan-CTA-only
                         palet (#0E8F5A/#08734A) — de to er nu slået sammen
                         til denne ene værdi, brugt overalt (Scan, Profil,
                         Indkøbsliste, onboarding osv.), ingen undtagelser.
--green-dark:#08734A     mørk variant — knap-gradienter/hover, IKKE en
                         separat semantisk farve
--green-logo/-glow/-text  afledt af --green, se theme.jsx for præcise værdier
--green-lt / --green-mid  translucent grøn (rgba(14,143,90,.10 / .18)) — til
                         bløde baggrunde/skygger, IKKE til valgt-tilstand
                         (se --green-selected-bg nedenfor)
--green-selected-bg:#EFF9F4  SOLID lys baggrund til "valgt"/aktiv chip-,
                         filter- og tab-tilstande (fx .chip.on, .tab.active,
                         .filter-chip.active) — brug denne, ikke --green-lt,
                         for valgt-state, så baggrunden ikke skinner
                         gennem/blander sig med et evt. baggrundsbillede bag
                         kortet (gentaget rod-årsag til flere runders
                         "ser forkert ud i preview"-fejlfinding denne sæson)
--green-halo:#DDF4E8     lys grøn glød/halo bag store CTA'er (fx Scan-
                         knappens radial-gradient-halo)
--on-green:#FFFFFF
--red:#C8402E (+lt/md)   fare
--amber:#B5791A (+lt/md) advarsel
--blue:#3A6EA5 (+lt/md)  reel, distinkt slate-blå sekundærfarve (IKKE aliaset
                         til grøn) — brugt semantisk til "sekundær info/accent"
                         (.greeting-eyebrow, .home-tip, .info-box, .share-bar)
--muted / --muted2
--surface / -2 / -3
--border / -2
--r:12px (default radius), --sh / --sh2 (skygge-tokens)
--f:'DM Sans',system-ui,sans-serif
```

**Valgt-tilstand ("selected"), fast mønster:** brug ALTID `border-color:
var(--green)` (solid, ikke translucent) + `background:var(--green-
selected-bg)` på den delte klasse selv (`.chip.on`, `.tab.active`,
`.filter-chip.active`, `.ap-chip.on`, `.mp-aa.on`,
`.recipe-filter-chip.active`, `.home-chip.active` er allerede rettet
sådan). Tilføj IKKE en per-instance inline `style`-override for
border-farve/-bredde oven på disse klasser — det var nødvendigt før 25.
sept. 2026, fordi den delte CSS-klasse selv brugte en anden, ikke-relateret
translucent grøn (`rgba(74,222,128,...)`), men er nu redundant og skal ikke
genindføres i nye komponenter.

**Planlagt komponentbibliotek (låst retning, ikke fuldt bygget endnu — 25.
sept. 2026):** `PrimaryButton`, `SecondaryButton`, `TextLink`, `InputField`,
`ChoiceCard`, `ChoiceChip`, `FormCard`, `SectionHeading`,
`ProgressIndicator`, `Accordion`, `InfoRow`, `ErrorMessage`. Formålet er at
nye skærme SAMMENSÆTTER disse i stedet for at style'e hver knap/kort
individuelt igen. Indtil de er udtrukket som rigtige komponenter: brug de
eksisterende delte CSS-klasser (`.btn.btn-primary.btn-full`, `.btn.btn-
outline`, `.chip`/`.chip.on`, `.link-green`) konsekvent — ikke ad hoc
inline-styles der genopfinder dem.

**Anbefalet spacing-skala** (tilføjet 14. sept. 2026 efter en grep-bekræftet
gennemgang af antimønster #15 nedenfor). Eksisterende inline-styles bruger
ikke denne skala 100% konsekvent (retrofittet 14. sept., se `CLAUDE.md`
afsnit 5's log for metode), men den er den anbefalede retning for nyt
arbejde, så vi ikke tilføjer endnu flere ad hoc-værdier:

```
4 / 6 / 8 / 10 / 12 / 14 / 16 / 20 / 24 / 32 (px)
```

Foretræk disse værdier (og kombinationer af dem, fx `10px 14px`) frem for
"næsten runde" tal som 9px/11px/13px/15px, medmindre der er en konkret
visuel grund til den præcise værdi.

Kendt mønster for "levende" interaktion: `.recipe-card:active{transform:scale(.99)}`
— genbrug dette mønster (tryk-feedback) på andre trykbare kort/rækker.

---

# Design-antimønstre — ting vi bevidst IKKE vil have i appen

> Tilføjet 14. sept. 2026 efter brugeren delte en liste over "20 reasons why
> your app looks vibecoded" (et velkendt tjekliste-format der cirkulerer om
> at genkende generisk AI-genereret UI). Brug denne liste som et
> **checkpoint**, ikke kun en engangs-oprydning — tjek nye skærme/
> komponenter mod den, før du markerer design-arbejde som færdigt.

| # | Mønster | Status i EatSafe |
|---|---|---|
| 1 | Lilla-til-blå gradient | ✅ Ikke brugt — appens paletter er grøn (primær) + en bevidst valgt slate-blå (`#3A6EA5`, sekundær) |
| 2 | Gradient-tekst i overskrifter | ✅ Ikke brugt — ingen `background-clip:text` i kodebasen |
| 3 | Emoji i overskrifter/UI-chrome | ✅ Saneret på tværs af alle skærme og delte komponenter — kun ægte indholds-emoji (allergen-glyffer, sprogflag, kategori-ikoner) står tilbage, bevidst, ikke chrome |
| 4 | Inter-font overalt | ✅ Ikke brugt — DM Sans + DM Mono, bevidst valgt tidligt i projektet |
| 5 | Farvede kant-kort ("colored border cards") som ren pynt | ✅ Ikke fundet — farvede kanter i appen er funktionelle signaler (fx `product-hero`'s grøn/gul/rød kant = sikkerhedsverdikt), ikke dekorative |
| 6 | Glassmorphism-kort (`backdrop-filter:blur`) | 🔴 **Fundet og rettet 14. sept.** — alle uigennemsigtige/virkningsløse forekomster fjernet. De to resterende i `ScannerScreen.jsx` (kamera-kontrolknapper + zoom-pille) er bevidst bevaret — reel gennemsigtig baggrund oven på levende kamerabillede, så blur'en har en ægte funktionel grund |
| 7 | Lavkontrast dark mode | N/A — appen er lys-tema-only |
| 8 | 3 ikon-bokse på række (generisk feature-grid) | ✅ Ikke fundet — `.stat3` viser rigtige tal (scanninger/farer/sikre), ikke generiske feature-claims |
| 9 | Badge over overskrift (hero-mønster) | ✅ Ikke fundet — BETA-badgen i topbaren er et permanent status-chip |
| 10 | "Lucide-ikoner overalt" (upersonligt standardbibliotek) | ✅ Ikke brugt — `Icon`-komponenten er selv-tegnet, specifikt til EatSafe |
| 11 | Urørt shadcn UI | N/A — bruger ikke shadcn |
| 12 | Fade-in ved scroll | ✅ Ikke fundet — `.fade-in` er en mount-animation, ikke scroll-baseret |
| 13 | Cursor-følgende lysstråle | ✅ Ikke fundet |
| 14 | Knapper der toner ved hover (ren opacity-fade) | ✅ Ikke fundet — `.btn-primary:hover` skifter farve + løfter sig (`translateY`) |
| 15 | Inkonsistent spacing | ✅ **Retrofittet 14. sept.** — "næsten runde" værdier (5/7/9/11/13/15px) rundet op til skalaen ovenfor på tværs af 20 filer |
| 16 | Em-dashes ("—") alle vegne | 🟢 Vurderet ikke et reelt problem — enkeltstående, funktionelle forbindelses-streger i naturligt dansk, ikke AI-agtig ophobning |
| 17 | Generisk buzzword-copy | ✅ **Formelt gennemgået 14. sept.** — ingen reelle træf ved grep for typiske klichéer |
| 18 | Serif-kursiv-accenter | ✅ Ikke brugt — ingen serif-skrifttype i appen |
| 19 | Space Grotesk + Instrument Serif (typisk AI-font-parring) | ✅ Ikke brugt — DM Sans/DM Mono |
| 20 | *(ikke synlig i det oprindeligt delte screenshot — spørg brugeren hvis relevant)* | — |

**Konklusion:** Appen var reelt kun ramt af ét konkret punkt (glassmorphism —
rettet) plus det i forvejen kendte emoji-punkt (gennemført). Resten var
enten allerede undgået fra projektets start, eller ikke reelle problemer
ved nærmere eftersyn.
