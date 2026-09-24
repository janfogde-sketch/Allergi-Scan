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
--green:#178A50 (+lt/mid/glow/text/logo)   succes / primær CTA / navigation
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
