# EatSafe — Historik (arkiv)

> **Gyldig pr. 8. okt. 2026**: arkiv over historik og begrundelser. Ældre afsnit beskriver tilstanden på det tidspunkt og kan være overhalet; `CLAUDE.md` og `src/CONTEXT.md` er den gældende nutidstilstand.

> Denne fil er IKKE automatisk loadet ved session-start — kun `CLAUDE.md`
> er det. Flyttet herud 15. sept. 2026 efter `token-audit`-skillen fandt
> at den dag-for-dag-loggede designforbedrings-historik (det gamle
> afsnit 5) alene udgjorde ~70% (6.284 af 8.953 ord) af hele `CLAUDE.md`
> — en fast overhead på hver eneste session, uanset opgave. `CLAUDE.md`
> holder nu kun nutids-arkitektur, arbejdsgang og stående regler; den
> fulde historik/"lektioner lært" er bevaret her, uændret i indhold.

---

## Designforbedring (september 2026) — fuld dag-for-dag-log

Brugeren har givet feedback: "appen virker livløs, og fremstår ikke særlig pæn og
elegant" — på trods af at være tilfreds med skiftet til hvid baggrund (væk fra grøn).
Vi er enige om en række konkrete forbedringer, og **Hjem-skærmen (ScannerScreen.jsx)
er valgt som første eksempel/preview**, før det rulles ud til resten af appen.

Aftalte forbedringer (implementeres først på Hjem, derefter — efter brugerens
godkendelse — resten af appen):

1. **Giv `--blue` en reel, distinkt værdi** i stedet for at være aliaset til grøn —
   giver automatisk et ægte sekundært accent-farve til `.home-tip`, `.greeting-eyebrow`,
   `.info-box`, `.share-bar` uden at skulle røre hvert enkelt sted.
2. **Erstat resterende emoji med SVG-ikoner** for konsistens: streak-badge (🔥),
   kamera-værktøjslinjens galleri-knap (🖼️) og lommelygte-knap (🔦). Kræver nye
   ikoner i `Icon`-komponentens map: `flame`, `image`/`gallery`, `flashlight`.
3. **Brug de allerede-definerede men ubrugte `.home-tip`-klasser** (blå venstre-kant-
   accent-kort) i `renderDailyTip()` i stedet for dens nuværende rene inline-styling.
4. **Tilføj tryk-feedback** (`:active{transform:scale(.99)}`, samme mønster som
   `.recipe-card`) på flere trykbare kort, fx indkøbsliste-genvejskortet på Hjem.
5. **Bevidst visuel hierarki:** hold "funktionelle" kort (indkøbsliste-genvej) neutrale/
   hvide, og lad "delight"-indhold (dagens tip) bære den nye accent-farve — så det ikke
   bliver ensartet fladt.

**Status:** Punkt 1-4 er implementeret og shippet på Hjem-skærmen: `--blue` har nu en
reel, distinkt værdi (`#3A6EA5`, ikke længere aliaset til grøn); streak-badge (🔥),
galleri-knap (🖼️) og lommelygte-knap (🔦) i kamera-værktøjslinjen er erstattet af SVG-
ikoner (`flame`, `image`, `flashlight` i `Icon`-komponenten); `renderDailyTip()` bruger
nu de eksisterende `.home-tip`-klasser (blå venstre-kant-accent) i stedet for inline
hvide styles; indkøbsliste-genvejskortet på Hjem har fået `.home-shortcut-card` med
`:active{transform:scale(.99)}`-tryk-feedback (samme mønster som `.recipe-card`).
Punkt 5 (bevidst hierarki: neutralt funktionskort vs. accent-farvet tip-kort) er
opnået som sideeffekt af ovenstående.

Yderligere feedback (kort-hierarki + tomme/loading-tilstande) er også implementeret:
- **Kort-vægt-hierarki på Hjem:** tre tydelige niveauer nu — scan-boksen (primær
  handling) har den kraftigste skygge/grønne glød, indkøbsliste-genvejen (sekundær)
  fik nedgraderet skygge fra `var(--sh2)` til `var(--sh)`, og dagens-tip (tertiær) er
  fortsat helt fladt med kun kant-accent. Ingen af de tre konkurrerer visuelt længere.
- **Delt `EmptyState`-komponent** (`SharedComponents.jsx` + `.empty-state`/`.empty-icon`
  m.fl. i theme.jsx) er redesignet globalt: emoji'et sidder nu i en blødt skygget,
  cirkulær "brønd" med en langsom svæve-animation i stedet for en gråtonet, flad
  linje-tekst — slår igennem på alle skærme der bruger komponenten (Søg, Opskrifter,
  Profil, Viden, Familie, m.fl.), da det er én delt komponent.
- **`.loader`** (den lille inline-loader, fx "Søger…") fik en kant + let skygge, så den
  ikke længere svæver skyggeløst oven på baggrunden.

Hilsenen øverst på Hjem er også gjort mere elegant: bruger nu de allerede-definerede
`.greeting`/`.greeting-eyebrow`/`.greeting-main`-klasser (var defineret i theme.jsx,
men ubrugt) i stedet for en tung, fed 22px-linje. Ny opbygning: en lille blå
dato-eyebrow ("onsdag · 11. september") over en stor, let (font-weight 300) hilsen
hvor kun navnet er fremhævet ("God morgen, **Jan**") — mere luftigt og "designet"
end den gamle ensfarvede fed tekstlinje.

App-baggrunden (`.app` i theme.jsx) manglede struktur — den var stort set en flad
farve. Tilføjet et fint punkt-gitter (22px raster, meget lav opacitet — matcher
scanner/stregkode-branding uden at blive støjende) + en to-vejs glød (grøn foroven,
blå forneden) for dybde, i stedet for kun den tidligere svage ensfarvede gradient.
Dette er en global CSS-token-ændring (`.app`-baggrunden er fælles for hele appen,
ikke Home-specifik kode), men følger stadig "Hjem som testskærm"-aftalen i ånden —
det er en synlig-men-diskret baggrundstekstur, ikke en re-skin af skærmenes indhold.

**14. sept. 2026 — første udrulning til hele appen** (brugeren gav udtrykkeligt go:
"Implimenter nu alle design ændringer fra forsiden til hele appen"). To ting rullet
ud som globale CSS-regler i `theme.jsx` (ingen per-skærm JSX-ændringer nødvendige,
da det er token/klasse-niveau):
- **Tryk-feedback overalt:** `:active{transform:scale(.97)}` tilføjet til alle
  klasser der allerede erklærer `cursor:pointer` (kodebasens egen konvention for
  "dette er trykbart") — `.home-mini-card`, `.scan-hero`, `.hist-row`, `.step-row`,
  `.mp-lang-dropdown`, `.mp-lang-opt`, `.chip`, `.home-chip`, `.filter-chip`,
  `.ap-chip`, `.recipe-filter-chip`, `.tab`, `.demo-code`, `.topbar-avatar`.
  Bevidst IKKE tilføjet til `.btn*` (har sit eget hover/translateY-system) eller
  til klasser uden `cursor:pointer` (ville give en vildledende presse-animation
  på ikke-trykbart indhold).
- **Løs tekst-legibilitet:** løst tekst (ikke inde i et `.card`/`.surface`) ligger
  nu direkte oven på baggrundens punkt-gitter — tilføjet
  `text-shadow:0 1px 0 rgba(255,255,255,.7)` (et fint løft, ikke en blur/glød) til
  `.screen-title`, `.screen-sub`, `.section-lbl`, `.mp-title`, `.mp-subtitle`,
  `.mp-section-lbl`, `.login-title`, `.login-sub`, `.welcome-wordmark-text`,
  `.welcome-tagline`, `.step-title`, `.step-sub`, `.onboard-skip`,
  `.greeting-eyebrow`, `.greeting-main`.

**14. sept. 2026 — emoji-sanering sat i gang, screen for screen:** brugeren gav
udtrykkeligt go ("Sæt det hele i gang"). Første bølge: `ListScreen.jsx` +
`SearchScreen.jsx` (bundmenuens to søskende-skærme til Hjem). Tilføjede tre nye
delte ikoner til `Icon`-komponenten — `shield` (bruges til "Sikker søgning"-badgen,
som optræder gentagne gange på tværs af skærme og reelt er UI-chrome, ikke
indhold), `block` (🚫, "skjulte produkter"), `link` (🔗, "kopiér link"). Erstattede
🛡️/🚫/🔗/↗️/❤️/✓/👨‍👩‍👧 med `Icon`-kald begge steder. **Metode for resten af appen:**
kun emoji der fungerer som ren UI-chrome (knapper, badges, status) erstattes —
IKKE indholds-emoji der bærer reel mening (allergen-glyffer i `constants.jsx`,
sprogflag i Madpas, opskrift-kategori-ikoner) — de er indhold, ikke pynt, og at
erstatte dem kræver et helt separat, meget større design-arbejde. Fortsættes
skærm for skærm i kommende PR'er. **Anden bølge:** `ResultScreen.jsx` (scan-
resultatet, vist efter stort set hvert scan — appens mest sete skærm efter Hjem).
Erstattede verdikt-ikonet i produktkortets topstrimmel (var plain-tekst "✓"/"!",
nu `Icon name="check"/"warning"`), samt ⚠️/✅/✓/🔍 i E-nummer-advarsler, diæt-
kompatibilitet, "tilføjet til indkøbsliste", "sikre alternativer" og "ingen
alternativer endnu". `🍼` (småbørns-advarsel) bevidst IKKE erstattet — intet
tilsvarende SVG-ikon findes, og det er et distinkt, letgenkendeligt visuelt
signal uden en oplagt streg-ikon-erstatning.

**14. sept. 2026 — brugeren gav fuld fortsæt-tilladelse** ("Forsæt arbejdet
gennem hele appen. Stop kun hvis jeg beder dig om det.") — arbejdet fortsætter
nu skærm for skærm uden yderligere opfølgnings-spørgsmål, medmindre noget
konkret kræver et valg. **Tredje bølge: `ProfileScreen.jsx`.** Tre nye delte
ikoner tilføjet: `bell` (🔔 push-notifikationer), `tag` (🏷️ favorit-kategorier),
`package` (📦 "ukategoriseret"/"fjern kategori"). Erstattede desuden
🔥/🔍/⚠️/✅/👨‍👩‍👧 (aktivitets-stat-kort, samme flame-mønster som Hjem), ✏️
(custom-allergi-tags), 🤍 (favoritter tom-tilstand), ✓ (to steder: diæt-chip-
check og allergen-badge), 🔗/📋/↗ (familie-invitationslink: opret/kopiér/del).
`⚗️` (E-nummer-tags) og `diet.emoji` (kost-typer, fx 🥗) bevidst IKKE rørt —
sidstnævnte er brugerkonfigurerbart indhold fra `DIETS`-konstanten, ikke chrome.

**Fjerde bølge: `NotFoundScreen.jsx` + `SubmittedScreen.jsx`** (5-trins produkt-
indsendelsesflowet). Erstattede 📦/📸/🔍/📝/✓ i trin-indikatoren (samme mønster
som Icon-biblioteket, 🥗 blev også skiftet til `package` her — ingen god
"næring"-ikon-erstatning fandtes), 📁→`image` (galleri-knapper, 3 steder),
⚠️/⚠→`warning` (fejlbokse + manglende ingredienser), samt trin-listen på
kvittering-siden (🔍/✅/🔔/🌍 → search/check/bell/globe). `🙏` (tak-besked) og
`☕` (ventetids-hint) bevidst bevaret — rent emotionelt/dekorativt, ikke UI-
chrome. **Fandt og rettede samme fladhed-bug som i forrige PR to steder til:**
"Send produkt ind"-knappen i NotFoundScreen og "Hvad sker der nu?"-boksen i
SubmittedScreen havde begge inline-styling uden `box-shadow` — samme mønster
som `.card`/`.product-hero` tidligere. Holder øje med dette mønster fremadrettet
i hver fil der røres.

**14. sept. 2026 — brugeren bad om fuld gennemgang af ALLE skærme mod ALLE
retningslinjer** ("Gennemgå alle skærme med alle vores retningslinjer. Stop
ikke før jeg siger det") — kombinerer emoji-sanering + antimønstre-tjeklisten
(se `.claude/rules/design-tokens.md`) + fladhed-bug-tjek, skærm for skærm, uden
ophold. Sporet via TaskCreate/TaskUpdate i denne session. **Femte bølge:
`RecipesScreen.jsx`** (stort set alle emoji-forekomster i UI-chrome erstattet):
verdikt-ikoner (kort + detalje-hero, samme check/warning-mønster som Resultat-
skærmen), favorit-hjerter, "tilføj/tilføjet"-ikoner, `flame` (tilberedningstid, 2
steder), `profile` (personer/pers.), `camera` (billede-placeholder),
`list`/`info`/`warning` i opsummerings-boksen ved indsendelse, søge-/tom-
tilstande. Kategori-emoji (☕🥗🍝🍰🥦🍿🍽️) og kost-emoji (🌱🥦) bevidst bevaret —
indhold, ikke chrome, samme begrundelse som tidligere. **Fandt og rettede 3
flere flathed-bugs** (manglende `box-shadow` på inline-grønne knapper: fejl-
gendan-knap, "opsummering"-boksen, indsend- og "tilbage"-knapperne).

**Sjette bølge: `MadpasScreen.jsx`.** Erstattede 🔍 (QR-forstørrelse-overlay),
✓/📋→check/link (kopiér-link-knap, samme mønster som List/Profil), ↗→share
(del-knap), 💡→bulb (info-note), ✓→check (valgt sprog i dropdown), 🌾→shield
(tom-tilstand "ingen allergier registreret"). 📱 (madpas-header) og 🇩🇰/🌍
(sprogflag) bevidst bevaret — sidstnævnte er ægte indhold fra
`MADPAS_LANGUAGES`. Rettede 2 flere flathed-bugs (QR-luk-knap, "Del via…"-
knappen).

**Syvende bølge: `KnowledgeScreen.jsx`.** Erstattede risiko-niveau-badge
(⚠️/⚡→`warning`, farve skifter stadig efter høj/moderat), ⚕️→`info`
(sundhedsnote-label), 🌾→`warning` (allergen-pille i entry-detaljer — var
altid samme glyf uanset allergen, dvs. reelt chrome ikke indhold), ✓→`check`
(alternativ-pille), 📚→`book` (sidetitel "Leksikon"), ⚠️→`warning` (fejlboks),
🔍→search (tom-tilstand). Kategori-vælgerens emoji (🌾🫙🔢🥗🔄❓💡) og entry-
specifikke emoji (`entry.emoji`/`cat.emoji`/`f.emoji`) bevidst bevaret —
ægte, database-drevet indhold, samme begrundelse som opskrift-kategorier.

**Ottende bølge: `RestaurantGuideScreen.jsx`.** Ny delt ikon tilføjet:
`message` (talebobbel, til "Nyttige sætninger"). Erstattede 💡→bulb
(madpas-tip) og 💬→message (sætnings-sektion). `TIPS`-emnernes ikoner
(📋🚪🍽️✈️🏢⚖️) og 🇪🇺 (EU-lovgivnings-note) bevidst bevaret — hvert emne-ikon
er en distinkt identitet (som kategori-glyffer andre steder), og flaget er
ægte indhold.

**Niende bølge: `OnboardingScreen.jsx`** (første-indtryk-flowet — høj
prioritet). Erstattede: beta-intro-listen (💬/❓/⚠️→message/info/warning),
indkøbsliste-invitations-bannere (🛒→cart, 2 steder), fejl-labels (⚠️→warning,
2 steder), push-notifikations-sektionen (🔔→bell hero-ikon + knap-ikon,
notifikations-type-listen ✅/👨‍👩‍👧/🎉→check/family/search), diæt- og allergen-
chip-checkmarks (✓→check, 2 steder), E-nummer-valg-checkmark, afsluttende
disclaimer (⚕️→info) og "Gem ændringer"-knappen (✓→check). De tre store
emne-ikoner (🚨/🔬/🌱 for allergi/E-numre/diæt-introduktionen) samt de
rent emotionelle 🧪/✨/🤝 (beta-hero, "tre områder"-hero, fællesskab-kort)
bevidst bevaret — hhv. kategori-identitet og fejring, ikke chrome. Ingen
flathed-bugs fundet i denne fil (bruger konsekvent `.btn btn-primary`, som
allerede har skygge).

**Tiende bølge: `SuggestEditScreen.jsx`** ("Ret forkerte data"-flowet).
Erstattede "produktet blev væk"-ikonet (😕→warning), de 4 rette-type-
valgmuligheder (🥦/📊/📸/✏️→list/package/camera/edit — samme mønster/
fallback-logik som NotFoundScreen's trin-ikoner), guide-skærmens store ikon
(samme mapping), 💡→bulb (foto-tips), 📁→image (galleri-knap), ✓→check
(ingredienser fundet), ⚠→warning (manglende ingredienser), 📸→camera
(produktbillede-knap, 2 varianter), ✓→check ("Send forslag"-knappen).
🙏 (tak-besked) bevidst bevaret. **Fandt og rettede 1 flere flathed-bug**
(manglende `box-shadow` på "Send forslag"-knappen).

**Ellevte bølge (KUN DELVIST): `AdminScreen.jsx`.** Denne fil er langt større
end de andre (1000+ linjer, ~100 emoji-forekomster) og kun admin-brugere ser
den, så den er bevidst prioriteret lavere/mindre udtømmende. Tre nye delte
ikoner tilføjet: `chart` (bar-chart), `bug` (fejl/tickets), `download`.
Konverteret: de 8 sektions-faneblade (Dashboard/Brugere/Indsendelser/
Tickets/Debug/Manglende/Import/Opskrifter → chart/family/package/bug/
search/info/download/book), dashboard-stat-kortene (profile/plus/barcode,
⚡ bevaret — intet lyn-ikon), "Database & opgaver"-listen (package/family/
bug, ⏳ bevaret), "Hurtige handlinger"-gitteret (package/bug/check/family/
share), feedback-ticket type-badges (bug/bulb/package konverteret, 🎨/💥/✨
bevaret — ingen gode ikon-matches). **IKKE nået endnu:** selve indholdet
inde i hvert faneblad (Indsendelser-gennemgang, Ticket-detaljer, Debug-
output, Import-log, Opskrift-godkendelse) — stadig fuld af emoji. Tag dette
op igen som en selvstændig fortsættelse, screen for screen ligesom resten,
hvis/når det prioriteres.

**14. sept. 2026 — Tolvte bølge: `AdminScreen.jsx` fuldført.** Tog den
efterladte fortsættelse op igen ("Forsæt arbejdet"). **Kritisk bug fundet
og rettet separat først:** `Icon` blev brugt 5 steder (fanebladsikoner,
dashboard-stat-kort, fra ellevte bølge) uden nogensinde at være importeret
fra `SharedComponents.jsx` — en `ReferenceError` der crashede hele admin-
dashboardet ved hver åbning. `// @ts-nocheck` + ingen render-test af
`AdminScreen.jsx` betød at hverken build eller test-suiten fangede det.
Rettet som isoleret ét-linje-hotfix, shippet for sig selv før resten af
sweepet. Derefter konverteret de resterende ~80 emoji i selve
fanebladsindholdet (Indsendelser, Tickets, brugerdetaljer, Debug,
Import, Opskrift-godkendelse) til `Icon`. Nye delte ikoner: `refresh`,
`mail`, `calendar`, `key`, `file`, `clock`, `save` (ud over `eye`/`eyeOff`
fra samme session, se nedenfor). Fandt undervejs 3 flere `alert()`-kald
(opskrift-gem/godkend/afvis) og erstattede dem med Toast. AdminScreen.jsx
er nu færdiggjort på samme niveau som resten af appen.

**Lektion:** når man "fuldfører" en tidligere delvist lavet emoji-sanering
i en stor, admin-only fil, så tjek om nyligt tilføjede `Icon`-kald rent
faktisk er importeret — build fanger det ikke, kun runtime gør, og ingen
test dækkede skærmen.

**14. sept. 2026 — Trettende bølge: `ProfileMenu.jsx`.** Brugeren spurgte
direkte ("Har vi også gennemgået i menuen?") — hamburger-menuen var ikke
nævnt i nogen tidligere bølge, på trods af at være en høj-trafik
navigations-flade (åbnes fra stort set alle skærme). **Lektion herfra:**
den forrige konklusion om at saneringen var "komplet skærm for skærm på
tværs af hele appen" var forhastet — bølge-listen dækkede kun `SCREENS`-
konstanterne, ikke delte overlay-/menu-komponenter som `ProfileMenu.jsx`
og `ProfileMenu.jsx`'s slægtninge (`FeedbackModal.jsx` er allerede tjekket
undervejs i Toast-arbejdet ovenfor, men fx `InstallPrompt.jsx` og
`ListPickerSheet` i `SharedComponents.jsx` er endnu ikke eksplicit tjekket
— tag dem med i en fremtidig runde). Fund: 8 emoji-ikoner i menulisten
(⭐👨‍👩‍👧📋🍳📚🌍🍽️🛡️ → star/family/list/recipes/book/madpas/utensils/shield,
ét nyt delt ikon `utensils`) samt manglende tryk-feedback — filen bruger
fuldt inline styles, så den tidligere globale `:active`-udrulning (kun
CSS-klasser med `cursor:pointer`) aldrig fangede den. Nye delte klasser
`.menu-item`/`.menu-profile-card` i theme.jsx, samme hover/tryk-mønster
som `.hist-row`.

**14. sept. 2026 — Fjortende bølge: `App.jsx`, `ProfileScreen.jsx`,
`SharedComponents.jsx`.** Brugeren spurgte om saneringen var færdig på
tværs af hele appen — endnu et "nej" blev afdækket ved et hurtigt tjek:
- **`ProfileScreen.jsx`:** Historik-, Favoritter- og Familie-under-
  skærmene (bor alle tre i denne fil, ikke i egne filer trods
  arkitektur-tabellen i afsnit 3 — første Claude-besked i denne omgang
  fejlagtigt antog de lå i `App.jsx`, rettet undervejs) var kun delvist
  dækket af tredje bølge. 👨‍👩‍👧/⚙️/✏️ → family/info/edit.
- **`SharedComponents.jsx`:** `ListPickerSheet` (flagget sidst som ikke
  tjekket) og debug-komponenten `PageID`s "✓ kopieret". `getProductIcon()`s
  kategori-emoji og `safetyStyle()`s ×/!/✓ bevidst IKKE rørt — hhv.
  indhold og et allerede minimalistisk, monokromt tegnsæt.
- **`App.jsx` — det største fund:** hjælpe-modalens indhold (spørgsmåls-
  tegns-knappen øverst på hver skærm) er en datastruktur med titel + 2-5
  tips for samtlige 18 skærme, ca. 50 emoji, aldrig ramt af nogen bølge
  fordi strukturen ligger i `App.jsx` og ikke i en skærm-fil. Konverteret
  alt til `Icon` (2 nye delte ikoner: `hash`, `zap`). Desuden beta-intro-
  carousellen, "Slet konto"-modalen, "hvad slettes"-listen, offline-
  banneret og slet-knappen. Bevidst bevaret (ingen gode ikon-matches,
  håndteret af en ny betinget fallback i render-koden): 👶 🚦 👆 🙏 🧪.
  `InstallPrompt.jsx` (også tidligere flagget) viste sig allerede ren.

**Lektion — teknisk uheld undervejs:** egen manuel indtastning introducerede
gentagne gange en kyrillisk fejltastning i "købt" (samme mojibake-risiko
denne fils egen arbejdsgang advarer om) — løst ved at bruge et Python-script
til tekst-tunge erstatninger i stedet for at genskrive dansk tekst i hånden.
Første script-forsøg havde en indekseringsfejl (`lines[start:end] = [x]`
efterfulgt af et nyt slice på den allerede-muterede liste) der stille
slettede en del af `renderHelpModal`/`renderBetaIntro` uden fejlmelding —
opdaget ved at sammenligne `git diff --stat`s antal linjer mod det
forventede omfang (small targeted edit burde IKKE give 150+ sletninger),
revertede filen med `git checkout HEAD -- <fil>` og lavede det om med en
sikrere metode (slice på strengen, ikke på linje-listen). **Tjek altid
`git diff --stat` efter et scriptet bulk-edit, før der committes** — et
overraskende stort antal sletninger er et rødt flag, ikke støj.

**14. sept. 2026 — session sat på pause af brugeren** ("Stop for nu. Når vi
starter igen skal du tilføje disse punkter til arbejdet"), med endnu en
delt tjekliste (screenshot, "20 things you can tell Claude to add to your
website right now Pt.3" — samme TikTok-genre som antimønstre-listen).
**Disse 20 punkter er ENDNU IKKE vurderet eller implementeret** —
de er kun noteret her som næste opgave, når arbejdet genoptages:

1. Dark mode-toggle
2. Simpel cookie-banner
3. Side-søgning (site search)
4. "Til toppen"-knap
5. Mobil-menuer
6. Loading-animationer
7. Hover-tilstande
8. Scroll-fremgangsbjælker
9. Kopiér-knap
10. Print-stylesheet
11. Sticky headers
12. "Spring til indhold"-link
13. Vis/skjul adgangskode-toggle
14. UTM-tracking
15. Formular-succes-tilstand
16. Formular-fejl-tilstand
17. Bekræftelses-besked (confirmation message)
18. "Sidst opdateret"-dato
19. Udvidelig FAQ (expandable FAQ)
20. Flydende kontakt-knap

**Vigtigt før disse sættes i gang:** dette er en generisk liste til websites/
marketingsider — mange punkter passer ikke uændret på en indbygget app-
oplevelse (fx "print-stylesheet", "cookie-banner" eller "UTM-tracking" giver
ikke nødvendigvis mening i en PWA uden en traditionel marketing-forside).
**Vurdér hvert punkt konkret op imod EatSafes faktiske struktur, før
noget implementeres** — spørg brugeren hvis relevansen er uklar for et
givent punkt (fx cookie-banner: har appen tracking der kræver samtykke?),
i stedet for at implementere listen mekanisk.

**14. sept. 2026 — de 20 punkter vurderet ("Forsæt arbejdet"), tre PR'er
merget.** Gennemgik hvert punkt konkret mod EatSafes struktur (research i
kodebasen, ikke antagelser):
- **Allerede dækket, intet arbejde nødvendigt:** #5 mobil-menuer (bundnav +
  ProfileMenu), #9 kopiér-knap (findes 5 steder), #10 print-stylesheet
  (`MadpasScreen.jsx` har allerede `@media print` + `window.print()` — det
  ene sted det giver mening, et fysisk allergikort), #11 sticky headers
  (topbaren er `position:sticky`), #12 "spring til indhold"-link (findes i
  `App.jsx`/`theme.jsx`), #7 hover-tilstande (25 `:hover`-regler i theme.jsx).
- **Vurderet irrelevant for en PWA uden marketingsider, sat i bero (ikke
  implementeret):** #2 cookie-banner (ingen analytics/tracking-kode findes
  noget sted i kodebasen — bekræftet med brugeren at intet er slået til
  udenom koden heller, fx Vercel Analytics), #3 site-søgning (appen har
  allerede en dedikeret produkt-søgeskærm), #8 scroll-fremgangsbjælke, #14
  UTM-tracking (findes allerede en let variant via `?src=beta-qr`), #19
  udvidelig FAQ (Leksikonets FAQ-kategori bruger samme liste→detalje-
  navigation som resten af appen — konsistent, ikke en mangel), #20
  flydende kontakt-knap (topbarens permanente Feedback-knap dækker samme
  formål).
- **#1 dark mode-toggle — DROPPET 14. sept. 2026, ikke bare udskudt.** Brugeren
  bad eksplicit om at droppe punktet helt ("Drop helt nr. 1"). App'en er og
  forbliver lys-tema-only — tag IKKE dette op igen medmindre brugeren selv
  rejser det på ny.
- **#13 vis/skjul kodeord — implementeret.** Login/opret konto bruger
  rigtige password-felter (ikke magic link), så det var en reel, lavrisiko
  mangel. Nye `eye`/`eyeOff`-ikoner i `Icon`-komponenten, øje-knap tilføjet
  på begge felter i `OnboardingScreen.jsx`.
- **#15/#16/#17 (formular-succes/-fejl/bekræftelse) — implementeret via et
  konkret fund, ikke en generisk løsning.** En grep for `alert(` viste at
  appen bruger native browser-`alert()` til succes- **og** fejl-beskeder 16
  steder på tværs af 8 filer — et synligt designbrud (grim system-popup) i
  en ellers gennemført design, samme kategori som tidligere fladhed-bugs.
  Byggede en delt `Toast`-komponent (`showToast()` + `<ToastHost/>` i
  `SharedComponents.jsx`, portal-baseret, monteret i `App.jsx` — samme
  mønster som `ListPickerSheet`) og erstattede alle brugervendte
  forekomster: familie-invitation, indkøbsliste-tilslutning via delt link,
  profil-gem, "Ret forkerte data" og feedback-formularen.
  **`AdminScreen.jsx`/`useAdmin.js` bevidst ikke rørt** — samme lavere
  prioritering som den delvist gennemførte emoji-sanering af Admin (se
  ovenfor), tages op i en selvstændig fortsættelse.
- **#4, #6, #18 (til toppen-knap, loading-animationer, "sidst opdateret"-
  dato):** endnu ikke vurderet/implementeret i denne runde — kandidater til
  en kommende fortsættelse, hvis det prioriteres.
- **#4 og #6 er kun delvist afklaret** (`.loader` findes allerede som
  basis-mønster) — kræver stadig en konkret gennemgang skærm for skærm
  ligesom emoji-saneringen, ikke en generisk implementering.

**14. sept. 2026 — #4 og #18 implementeret, #6 vurderet tilstrækkelig.**
("forsæt") Alle tre resterende punkter fra 20-punkts-tjeklisten taget op:
- **#4 "Til toppen"-knap — implementeret.** Ny delt `ScrollToTop`-komponent
  (`SharedComponents.jsx`, portal-baseret, lytter på `window.scroll` — appen
  har ingen per-skærm scroll-container, se `.app` i `theme.jsx`). Tilføjet
  til `KnowledgeScreen.jsx` (søge-/kategori-liste) og `RecipesScreen.jsx`
  (pagineret liste) — de to skærme med reelt lang, scrollbar liste-indhold.
- **#18 "Sidst opdateret"-dato — implementeret defensivt.** Tilføjet i
  Leksikon-detaljevisningen, betinget på at `knowledge_base`-raden rent
  faktisk har et `updated_at`-felt. Kunne ikke bekræfte databaseskemaet
  direkte — sandboxens netværkspolitik blokerer udgående kald til Supabase
  (403 fra agent-proxyen; rapporteret som organisationspolitik, ikke
  forsøgt omgået, jf. `/root/.ccr/README.md`s egen instruks om ikke at
  gentage policy-afvisninger). Løsningen er derfor lavet 100% risikofri
  uanset skema: viser intet hvis feltet mangler.
- **#6 loading-animationer — vurderet, ingen ny kode.** Stikprøvetjekkede
  ~11 asynkrone handlinger (`onClick={async`) på tværs af appen. De fleste
  brugervendte flows (login, feedback, indsendelser) har allerede ordentlig
  loading-feedback (disabled-tilstand/tekst-skift). Et par mindre, hurtige
  handlinger (opret liste, fjern familiemedlem) mangler det, men vurderet
  som for lavrisiko/hurtige til at være en reel mangel — ikke tilføjet
  mekanisk.

**Sidegevinst — endnu et "usynligt ikon"-fund** (samme kategori som
AdminScreen-Icon-importbugget i trettende bølge): `KnowledgeScreen.jsx`s
tilbage-knap brugte `<Icon name="arrow-left"/>`, som aldrig har eksisteret
i `Icon`-biblioteket — knappen har derfor manglet sit visuelle ikon (virket
funktionelt som knap, bare uden synlig pil). Tilføjet en ny delt
`chevronLeft`-ikon og rettet referencen. **Lektion:** disse "brugt-men-
aldrig-defineret"-ikonnavne giver INGEN fejl (build, runtime eller test) —
`Icon`-komponenten renderer bare en tom SVG for et ukendt navn. Overvej at
grep'e for `<Icon name="` og krydstjekke mod ikon-listen i afsnit 3, hvis
en fremtidig gennemgang har tid til det, i stedet for kun at opdage dem
tilfældigt undervejs.

**14. sept. 2026 — fundet og rettet: fladhed-bug i to bund-klasser.** Brugeren
sendte et screenshot af ResultScreen og påpegede at kort og knapper var "helt
flat". Root cause: den brede `.card`-klasse (bruges praktisk talt overalt i
appen til generiske indholdssektioner) og `.product-hero` (ResultScreens
hovedkort) havde **slet ingen `box-shadow`** — kun en 1px border. Enhver skærm
der bruger `.card` fik derfor ingen elevation, uanset hvor meget andet
design-arbejde der var lagt i den. Rettet:
- `.card` fik `box-shadow:var(--sh)` — slår automatisk igennem alle steder
  klassen bruges (samme "fix én delt klasse, ramt overalt"-mønster som
  `EmptyState`/`.loader` tidligere).
- `.product-hero` fik `box-shadow:var(--sh2)` (kraftigere, da det er skærmens
  hovedkort — samme hierarki-tanke som Hjems scan-boks).
- To knapper omgik shadow-klasserne ved at sætte `background`/`color` som
  inline style i stedet for at bruge `.btn-green`/`.btn-primary` (som allerede
  havde en skygge defineret) — "Tilføj til indkøbsliste" i `ResultScreen.jsx`
  og manuel-EAN-knappen i `ScannerScreen.jsx`. Rettet til at bruge klassen
  (Result) / fået samme `box-shadow` eksplicit (Scanner, da den knap ikke
  bruger `.btn`-familien overhovedet).

**Lektion for videre arbejde:** når en knap/kort ser "fladt" ud på en given
skærm, tjek FØRST om det er en delt klasse der mangler skygge (ramt alle
steder, ét CSS-fix) frem for at antage det er skærm-specifikt. En grep viste **flere hundrede** emoji-forekomster på
tværs af stort set alle skærme (`AdminScreen.jsx`, `App.jsx`, `RecipesScreen.jsx`,
`ProfileScreen.jsx` m.fl.) — langt de fleste er meningsbærende indhold (allergen-
glyffer i `constants.jsx`, sprogflag, opskrift-kategori-ikoner, status-ikoner i
admin), ikke blot dekorativt UI-chrome som de 3 der blev skiftet ud på Hjem
(flame/galleri/lommelygte). At erstatte dem alle er et markant større, selvstændigt
projekt (nye ikoner skal designes, hver skærm skal verificeres visuelt) — ikke noget
der kan gøres forsvarligt i samme ombæring som CSS-udrulningen. Kræver et eksplicit
tilvalg fra brugeren, før det sættes i gang.

**Statusopdatering 14. sept. 2026 — holdet er ophævet for de globale CSS-dele:**
"vi venter med at bygge i hele appen" (11. sept.) gjaldt indtil brugeren eksplicit
sagde "Implimenter nu alle design ændringer fra forsiden til hele appen" (14. sept.).
De ting der ER token/klasse-niveau (tryk-feedback, løs-tekst-legibilitet, baggrunds-
struktur, `--blue`, `EmptyState`/`.loader`) er nu rullet ud globalt, som beskrevet
ovenfor. De ting der KRÆVER per-skærm JSX-arbejde og stadig kun findes på Hjem:
kort-vægt-hierarkiet (scan-boks/genvej/tip-mønsteret er specifikt for Hjems egne tre
kort, ikke en generisk klasse) og hilsen-typografien (`.greeting-main` osv. bruges
kun på Hjem — ingen anden skærm har en "hilsen" at anvende det på). Disse to venter
ikke på yderligere tilladelse i sig selv, men er heller ikke automatisk dækket af
"implementer alle design ændringer" — de kræver konkret vurdering pr. skærm (hvilket
kort er "primært" på hver skærm?), så tag dem én skærm ad gangen fremover, ikke som
én stor mekanisk sweep. Emoji→SVG-saneringen er separat og afventer stadig
brugerens tilvalg, som beskrevet ovenfor.

**14. sept. 2026 — kort-vægt-hierarkiet rullet ud på ProfileScreen.** Brugeren
spurgte direkte om vi kom "i bund" med Hjem-redesign-opgaven — svaret var nej,
og det blev taget op med det samme. `ProfileScreen.jsx`s hoveddashboard fik
samme 3-lags-mønster som Hjem: "Mine præferencer" (primær — den sikkerheds-
kritiske allergi-/diæt-data) fik `var(--sh2)`; Hero/Min husstand/Konto
(sekundær) fik standard `var(--sh)`; aktivitets-/gamification-kortet (tertiær,
"delight") blev gjort fladt med blå kant-accent, samme mønster som dagens-
tip-kortet. Undervejs fundet og rettet flere flathed-bugs af samme kategori
som tidligere (delte kort-stilarter uden `box-shadow`): den delte
`ubgsurface_bd1pxsolid_br14_p14px16px_mb10`-util i `styleUtils.js` (3 kort
på én gang), samt enkeltstående kort i `RecipesScreen.jsx`, `MadpasScreen.jsx`,
`NotFoundScreen.jsx` (`S.card`, 4 steder + billed-preview) og
`SuggestEditScreen.jsx`. Fandt også en fjerde forekomst af "usynligt/missed
emoji" — en tredje "Vælg fra galleri"-knap i `NotFoundScreen.jsx` (📁) som
aldrig blev konverteret, selvom fjerde bølge dengang loggede "3 steder"
rettet (kun 2 var reelt rettet).

**Hilsen-typografien** (`.greeting-main` osv.) forbliver Hjem-specifik —
ingen anden skærm har en "hilsen" at anvende mønstret på, så det punkt er
reelt N/A andre steder, ikke en udestående opgave.

**Andre skærme bevidst ikke ændret** (List, Search, Result, Knowledge, Madpas'
øvrige indhold): deres kort er enten interaktive rækker (flad by design,
samme mønster som `.hist-row`/`.menu-item`) eller enkelt-formål-sektioner
uden konkurrerende kort at lave hierarki imellem — hierarki-mønstret giver
kun mening hvor flere ikke-interaktive indholdskort reelt konkurrerer om
opmærksomhed på samme skærm, som på Hjem og nu ProfileScreen.

**Den oprindelige Hjem-redesign-opgave er dermed fuldført** — både de
globalt udrullede token/klasse-ændringer og de per-skærm-vurderede mønstre
er nu implementeret hvor de giver mening.

**14. sept. 2026 — opfølgning på "nogle åbne opgaver?": #1 droppet, #2/#3
vurderet, #4/#5 gjort.** Brugeren bad om at droppe dark mode helt og tage de
resterende fire punkter fra forrige status op med det samme:

- **#1 Dark mode — droppet, ikke udskudt** (se ovenfor for eksakt ordlyd).
- **#2 Spacing-konsistens — bekræftet reelt, dokumenteret, IKKE retrofittet
  først, senere retrofittet — se afsnittet om spacing-retrofit nedenfor.**
- **#3 Copy-gennemgang — udført, ingen fund.**
- **#4 `privacy.html` + `invite.html` — reskinnet til det lyse designsprog.**
  Begge sider brugte stadig det gamle mørke tema (`#0e1812`-baggrund,
  `#4ade80`-grøn) fra før hvid-baggrund-skiftet. Omskrevet til samme
  CSS-variabel-sæt som `install.html` (`--paper`/`--green`/`--surface` m.fl.,
  DM Sans, samme kort-/knap-stil). Indhold og funktionalitet (Supabase-kald i
  `invite.html`) er uændret — kun visuelt reskin.
- **#5 Ryddet op i forældede/modstridende noter** i `CLAUDE.md` selv: en gammel
  linje der stadig sagde AdminScreen.jsx's emoji-sanering var ufuldendt
  (modsagt af tolvte bølges log), samt en helt separat forældet note om at
  `--blue` stadig var "aliaset til grøn" (blev rettet for flere bølger siden,
  men aldrig opdateret i selve token-referencen i afsnit 3).

**Sidegevinst — manglende bekræftelse i Admin fundet og rettet.** Brugeren
påpegede at "Brug denne version"-knappen i produkt-gennemgangen (AI-renskrevet
OCR-tekst, `AdminScreen.jsx`) ikke gav nogen synlig bekræftelse ved klik —
opdaterer kun stille lokal state. Tilføjet `showToast("Renskrevet tekst
brugt")`, samme mønster som resten af appens Toast-brug.

**14. sept. 2026 — alder/fødselsår-inkonsistens rettet.** Brugeren
rapporterede: "Egen bruger bedes om at opgive alder, men når man opretter
familie medlem selv, skal man opgive fødselsår. Det skal være at opgive
alder for alle." Undersøgelsen viste at det ikke kun var en tekst-
inkonsistens, men også en reel datafejl: onboardings egen-bruger-alder blev
gemt i et `age`-felt i `users`-tabellen, som intet andet sted i kodebasen
nogensinde læser — alle andre steder (familiemedlemmer, profil-redigering,
admin-visning) bruger konsekvent `birth_year`. Enten blev PATCH'et stille
afvist af et ukendt kolonnenavn, eller også blev værdien gemt et sted der
aldrig læses tilbage — under alle omstændigheder gik den indtastede alder
reelt tabt. Rettet ved at lade UI'et konsekvent spørge om **alder** overalt
(egen profil, familiemedlem, admin-visning), mens det underliggende
databasefelt forbliver `birth_year` alle steder — udregnet begge veje via
`new Date().getFullYear()`, så det ikke bliver forældet med tiden:
- `useOnboarding.js`: `saveProfileStep1` gemmer nu `birth_year` (udregnet
  fra den indtastede alder) i stedet for det virkningsløse `age`-felt.
- `App.jsx`: profil-indlæsningen udregner nu faktisk alder fra `birth_year`
  i stedet for at sætte det rå fødselsår direkte i et `age`-felt.
- `ProfileScreen.jsx`: "Fødselsår" → "Alder" i egen profil-redigering
  (samme underliggende `user.birth_year`-state, kun input/visning
  konverteret); familielistens meta-linje viser nu udregnet alder i
  stedet for `f. <år>`.
- `MemberForm.jsx` (delt af Onboarding og Profil/Familie): "Fødselsår" →
  "Alder" ved oprettelse af familiemedlem — `birthYear`/`setBirthYear`-
  prop-navnene er bevidst uændret, kun selve inputtet konverterer til/fra
  alder internt, så `useFamily.js`s `addMember()` ikke skulle røres.
- `useAdmin.js`: `loadAdminUsers`s `select=`-parameter manglede både
  `birth_year` og `phone` — begge admin-felter viste altid "—" uden fejl.
  Tilføjet begge.
- `AdminScreen.jsx`: "Alder" i brugerdetaljer refererede til det aldrig-
  udfyldte `openAdminUser.age` — udregnes nu fra `birth_year`.

**Lektion:** endnu et eksempel på et "stille forkert" felt-mismatch (samme
kategori som `<Icon name="...">`-kald til ikke-eksisterende ikonnavne,
fundet flere gange tidligere i denne session) — en kolonne der er brugt
ét sted men aldrig matcher det resten af appen faktisk læser/skriver, uden
at build, runtime eller testsuiten fanger det. Værd at grep'e for den slags
mismatch (fx `age` vs. `birth_year`) når en bruger rapporterer noget der
umiddelbart ligner "bare" en tekst-/UI-inkonsistens.

**14. sept. 2026 — spacing-retrofit (antimønster #15) gennemført.** Brugeren
bad om at tage det tidligere bevidst udskudte punkt op. Startede med en
præcis opmåling i stedet for et gæt: en grep af alle `padding`/`margin*`/
`gap`-værdier i `src/*.jsx` + `theme.jsx` viste at det store flertal af de
"mange forskellige varianter" tidligere logget (`12px 14px`, `10px 12px`,
`8px 10px` osv.) faktisk allerede var på den anbefalede skala — den reelle
inkonsistens var afgrænset til enkeltstående "næsten runde" tal: 5, 7, 9,
11, 13, 15px, som `.claude/rules/design-tokens.md` selv fremhæver som
eksempel på antimønstret. Hver af disse ligger nøjagtigt midtvejs mellem to
skala-trin (fx 9 er lige langt fra 8 og 10), så reglen blev entydig og
mekanisk: rund altid op til næste skala-trin (5→6, 7→8, 9→10, 11→12,
13→14, 15→16) — ingen skøn nødvendige pr. forekomst, i modsætning til hvad
der tidligere blev antaget.

Kørt som et Python-script, skarpt afgrænset til kun `padding*`/`margin*`/
`gap`-egenskaber (matchet på ejendomsnavn før værdien), for at undgå at
røre `fontSize`/`borderRadius`/`width`/`border`, som tilfældigvis bruger de
samme tal andre steder i de samme linjer. Kørt fil for fil (`AdminScreen.jsx`,
`App.jsx`, `FeedbackModal.jsx`, `KnowledgeScreen.jsx`, `ListScreen.jsx`,
`MadpasScreen.jsx`, `MemberForm.jsx`, `NotFoundScreen.jsx`,
`OnboardingScreen.jsx`, `ProfileScreen.jsx`, `RecipesScreen.jsx`,
`ResultScreen.jsx`, `ScannerScreen.jsx`, `SearchScreen.jsx`,
`SubmittedScreen.jsx`, `SuggestEditScreen.jsx`, `demoSlides.jsx`,
`styleUtils.js`, `AllergenPicker.jsx`, `theme.jsx`), med `git diff --stat`
som sikkerhedstjek efter hver fil (185 indsættelser / 185 sletninger totalt
— fuldstændig symmetrisk, ingen af de utilsigtede store sletninger som
tidligere scriptede bulk-edits i denne session har været ramt af). Manuel
gennemgang af de to største diffs (`AdminScreen.jsx`, `theme.jsx`) bekræftede
at kun de tilsigtede egenskaber blev ændret. Build/test/mojibake-scan grønt
på alle 20 filer.

**Vurdering af risiko/omfang:** i modsætning til den oprindelige antagelse
("kræver skærm-for-skærm-visuel-QA, samme omfang som emoji-saneringen") viste
det sig at være et lavrisiko, mekanisk ±1px-skift uden semantisk tvetydighed
— ingen visuel pixel-for-pixel-verifikation pr. skærm blev derfor udført,
kun kode-niveau-verifikation (diff-gennemgang + build/test). Bevidst IKKE
rørt: layout-niveau-paddings (20/24/32/40px m.fl.) — disse var allerede på
skalaen og er slet ikke omfattet af antimønstret.

**14. sept. 2026 — søgefunktionen ignorerede kategori/underkategori helt.**
Brugeren rapporterede: "Test af søge funktion. Når jeg søger CHIPS, får jeg
kun 9 samlede resultater. Jeg må da have LANGT flere chips i min database."
Undersøgelsen (kode-gennemgang af `supabase/functions/search/index.ts`,
da sandboxens netværkspolitik blokerer direkte Supabase-kald — bekræftet på
ny med et 403 fra agent-proxyen, ikke forsøgt omgået) viste at søgningen
udelukkende matchede på `name`/`brand` (ILIKE substring) og aldrig brugte
`category`/`subcategory` — på trods af at appen allerede har en fungerende
AI-baseret kategoriserings-pipeline (`classify-categories`-edge-functionen)
der tagger produkter med en præcis underkategori som "Chips & snacks" fra en
fast taksonomi. Et produkt med et rent smags-/brandnavn uden det bogstavelige
ord "chips" i navnet (fx et flavour-navn som "Flødeost & Peberrod") var derfor
usynligt for søgningen, uanset hvor korrekt det var kategoriseret — de 9
resultater brugeren så, var kun de produkter der tilfældigvis også havde
ordet i selve navnet/brandet.

Rettet i `search`-edge-functionen: OR-filteret i den indledende DB-
forespørgsel matcher nu også `category`/`subcategory`; `select()` henter nu
`subcategory` (blev aldrig returneret før); scorings-logikken tæller et
kategori-ord-match som et reelt match (samme ordgrænse-logik som navn/brand),
men vægtet lavere (8 point mod navnets 15 — et kategori-match er et svagere
signal end et direkte navne-match). Kandidat-loftet på den indledende
forespørgsel hævet fra 150 til 400, da kategori-baserede søgeord kan matche
langt flere kandidater end en navne-substring plejede at gøre.

**Vigtigt — kræver manuel deploy:** i modsætning til frontend-koden i
`src/` (som Vercel auto-deployer på hvert push til `main`) har repoet
**ingen automatiseret deploy-pipeline for Supabase Edge Functions** —
hverken via Vercel eller GitHub Actions (`.github/workflows/ci.yml` kører
kun lint/test/build af frontend'en). At merge en ændring i
`supabase/functions/*` til `main` er derfor IKKE nok i sig selv — den skal
også deployes til selve Supabase-projektet, separat fra git-flowet. **Dette
gælder generelt for enhver fremtidig ændring i `supabase/functions/*`** (nu
også kort dokumenteret i `.claude/skills/ship/SKILL.md`).

**Rettelse samme dag — der ER et deploy-værktøj tilgængeligt i sessionen,
bare ikke som CLI/netadgang:** ovenstående blev først logget som "kan ikke
gøres herfra" (ingen Supabase CLI, ingen netadgang til `*.supabase.co` —
org-policy, bekræftet 403). Det er stadig korrekt at CLI'en og direkte
netkald ikke virker. MEN da brugeren bad om at "tjekke igen", dukkede en
**Supabase MCP-server** op (`mcp__Supabase__*`-værktøjer) som ikke var
synlig/loadet ved første forsøg — formentlig fordi den kun blev
tilgængeliggjort efter et `ToolSearch`-opslag, ikke automatisk fra sessionens
start. Denne MCP-server har egen, separat adgang til Supabase (uden om
sandboxens blokerede netværksproxy) og kan bl.a. `list_projects`,
`get_edge_function`, `deploy_edge_function`, `execute_sql`, `query_logs`,
`get_advisors`. **Lektion: næste gang en edge function skal deployes, prøv
`ToolSearch` for Supabase-værktøjer FØRST, før det konkluderes at det
kræver brugerens manuelle indgriben** — konklusionen om manglende adgang
var forhastet første gang.

Søgefunktionens fix (afsnit ovenfor) blev deployet direkte fra denne
session via `mcp__Supabase__deploy_edge_function` — version 12 → 13,
`verify_jwt:false` bevaret (matcher den eksisterende konfiguration, kritisk
for at anonym søgning fortsat virker). Verificeret efterfølgende med
`execute_sql`: 283 produkter matcher "chips" på navn/brand alene, yderligere
85 via category/subcategory — et konkret bevis på at fixet reelt udvider
kandidat-poolen markant ud over de oprindelige 9 synlige resultater.

**Vigtig nuance opdaget undervejs — "kun 9 resultater" var IKKE kun en
søge-bug.** `SearchScreen.jsx` har et "Sikker søgning"-filter
(`resultsWithSafety` = `searchResults.filter(status !== "danger")`) der
client-side skjuler ethvert resultat der reelt matcher et aktivt allergen
for den valgte profil/familie — det er **tilsigtet sikkerhedsadfærd**, ikke
en fejl, og forklarer hvorfor det synlige antal produkter i søgeresultatet
kan være lavere end det API'et rent faktisk returnerer (UI'et viser da en
"X produkter skjult — indeholder allergener for ..."-besked). En del af det
brugeren oplevede som "kun 9" kan derfor dels skyldes søge-buggen (nu
rettet), dels være denne legitime allergi-filtrering — værd at holde
adskilt i fremtidig fejlsøgning af søgeresultater.

**14. sept. 2026 — sideinddeling af søgeresultater + hævede indkøbsliste-
grænser.** Brugeren spurgte om der var en begrænsning på antal viste
resultater (efter kategori-fixet ovenfor) og bad om at gå videre med at
hæve dem, samt tilføje en "indlæs flere"-knap. Undersøgelsen viste TRE
lag af hårde grænser, forskellige alt efter hvor man søger:
1. `search`-edge-functionen selv: hårdt afskåret ved 25 resultater
   (`filtered.slice(0, 25)`), uanset hvor mange der reelt matchede.
2. `SearchScreen.jsx` (Søg-skærmen): viste blot API'ets op til 25 direkte.
3. `ListScreen.jsx`s hurtig-tilføj-dropdown: TO ekstra grænser oven i
   API'ets 25 — hentede kun de første 12, viste kun de første 6 efter
   allergi-filtrering. Forklarede præcist brugerens iagttagelse ("en stor
   håndfuld" i indkøbslisten vs. "flere, men ikke nær så mange" i Søg).

Løst med rigtig sideinddeling frem for blot at hæve et fast tal:
- `search`-edge-functionen tager nu en `offset`-parameter og returnerer
  `hasMore`/`total` sammen med `products` — samme scorede/sorterede
  resultatliste (op til DB-kandidat-loftet på 400, se forrige fix) kan nu
  hentes side for side (`PAGE_SIZE = 25` pr. side) i stedet for at være
  hårdt afskåret. Matchning/rangering er uændret — kun slutslicen er ny.
- `useSearch.js`: ny `loadMoreSearchResults()` der APPENDER næste side til
  de eksisterende resultater. Tjekker at søgeordet stadig matcher når
  svaret kommer tilbage, så et svar fra et forladt søgeord ikke kan nå at
  blive hængt på en ny søgnings resultatliste (en race der ellers kunne
  opstå hvis brugeren skifter søgeord mens "indlæs flere" er i gang).
- `SearchScreen.jsx`: ny "Indlæs flere (N tilbage)"-knap — bevidst samme
  mønster/styling (`btn btn-outline btn-full`, `(N tilbage)`-label) som
  `RecipesScreen.jsx`s allerede eksisterende "Indlæs flere"-knap, for
  konsistens med et etableret mønster i appen.
- `ListScreen.jsx`: hurtig-tilføj-dropdownens grænser hævet fra 12
  hentede/6 synlige til 20/10.

Deployet direkte fra denne session via `mcp__Supabase__deploy_edge_function`
(samme metode som forrige fix), `verify_jwt:false` bevaret.

**Samme dag — brugeren bad eksplicit om "indlæs flere"-knappen i
indkøbslisten også** ("tilføj også knap i indkøbsliste"), hvilket
overstyrer den lige ovenfor loggede "bevidst ikke"-beslutning — droppet den
antagelse med det samme uden at diskutere den. `ListScreen.jsx`s hurtig-
tilføj-dropdown har nu samme sideinddeling som `SearchScreen.jsx`: egen
`itemHasMore`/`itemTotal`/`itemLoadingMore`-state + `loadMoreItemResults()`,
samme offset-mønster som `useSearch.js`. De kunstige 20 hentede/10 synlige-
lofter fra forrige fix er fjernet igen (overflødige nu hvor sideinddelingen
klarer det). Knappen bruger `onMouseDown` + `e.preventDefault()` (ikke
`onClick`) — samme mønster som dropdownens profil-toggle-chips — så
tekstfeltets `onBlur` (som lukker dropdownen efter 150ms) ikke når at lukke
den, før klikket er registreret.

**Lektion:** en "bevidst ikke gjort sådan"-begrundelse logget i samme PR
som den løsning den gælder for, kan stadig blive overstyret af brugeren
minutter senere — det er ikke en fejl i den oprindelige vurdering, bare et
tegn på at UX-præferencer for et konkret flow er brugerens kald, ikke noget
der kan færdiggøres ved antagelse alene.

**15. sept. 2026 — ticket-fund: nøgleord-motoren matchede kun ental, ikke den
bøjede flertalsform der reelt står i ingredienslister ("hasselnødder
spotters ikke som allergen").** En bruger-rapporteret ticket
(`feedback_tickets`) viste at et produkt med "hakkede HASSELNØDDER" i
ingredienslisten fik `allergen_flags.noedder = "no"`. Rodårsagen:
`supabase/functions/allergens/index.ts`s `wordBoundaryMatch()` kræver en
ikke-bogstav-grænse på BEGGE sider af nøgleordet — kun entalsformen
"hasselnød" stod i ordlisten, og den matcher aldrig den bøjede
flertalsform "hasselnødder" (der er bogstaver, ikke en grænse, efter
"hasselnød" i "hasselnødder"). `jordnoedder`-kategorien havde allerede
både ental og flertal ("jordnød"+"jordnødder") — det var undtagelsen, ikke
reglen. (Den stående regel der fulgte af dette fund er beskrevet i
`CLAUDE.md` §5 selv, ikke gentaget her.)

Konkret rettet 15. sept. (v13 af `allergens`-edge-functionen, deployet):
nødder (hasselnødder/valnødder/cashewnødder/pistacienødder/pekannødder/
macadamianødder/paranødder/pinjekerner), fisk (ansjoser/makreller/
rødspætter), skaldyr (krabber/langustere), bløddyr (kammuslinger),
mælkeallergi/laktose (oste). Samme flertalsformer tilføjet parallelt i
`src/allergenKeywords.js`. **280 allerede-importerede produkter** i
databasen blev rettet baseret på en nøjagtig Python-gensimulering af
`analyzeIngredients()`s fulde logik (negation/spor-kontekst/EU-
fremhævning) — IKKE en blind sætning til "yes" — for at undgå at
introducere nye fejl under oprydningen.

---

## Beta-installation (september 2026) — fuld fejlfindingslog

Admin-dashboardet (Hurtige handlinger) har en "Installations-QR til beta"-knap, der
viser en QR-kode til `public/install.html`. Den side tjekker selv enheden:
iPhone/iPad (Apple tillader ikke programmatisk installation af PWA'er) får en
3-trins visuel guide til "Del → Føj til hjemmeskærm", i samme lyse designsprog som
resten af appen. Alt andet (Android/Chrome/desktop) sendes videre til
`eatsafe.dk/?src=beta-qr`. `install.html` er en statisk fil i `public/` — samme
mønster som `privacy.html`/`invite.html`.

**Vigtigt lært 14. sept. 2026:** "browseren viser bare selv sin installations-
prompt" holdt ikke i praksis — brugeren rapporterede at intet skete på Android.
To reelle årsager, begge rettet:
1. **`public/sw.js` manglede en `fetch`-event-handler.** Det er et af Chromes
   kriterier for at en PWA regnes som "installerbar" og dermed overhovedet
   udløser `beforeinstallprompt` — uden den kan browseren aldrig tilbyde
   installation, uanset hvor korrekt manifestet ellers er. Tilføjet en ren
   gennemstrømnings-handler (ingen caching-strategi, kun for at opfylde
   kriteriet).
2. **Ingen browser tilbyder et helt automatisk, tryk-frit install** — det er en
   bevidst sikkerhedsbegrænsning i alle browsere, ikke noget kode kan omgå. Det
   tætteste man kan komme: fange `beforeinstallprompt`-eventet selv og vise en
   tydelig "Installér nu"-knap, der udløser browserens native dialog med ét tryk.
   Implementeret som `usePwaInstall.js` (hook der fanger/gemmer eventet) +
   `InstallPrompt.jsx` (overlay, monteret i `App.jsx` lige under skip-link'en).
   Vises kun når URL'en indeholder `?src=beta-qr` (sat af `install.html`'s
   redirect for ikke-iOS). Falder automatisk tilbage til tekst-instruktioner
   ("tryk ⋮-menuen → Installer app") efter 4 sek. hvis browseren af en eller
   anden grund ikke sender eventet (fx allerede installeret, eller en tidligere
   afvist prompt som Chrome husker i en periode).

**Endnu en reel årsag fundet ved live-test 14. sept.:** selv med fetch-handleren
tilføjet udeblev prompten stadig på et testet Android-device — fordi en
OPDATERET service worker som standard bliver hængende i "waiting"-tilstand og
ikke overtager allerede-åbne faner, før alle gamle faner er lukket. En bruger
der havde haft appen åben tidligere i sessionen (fx under test) blev derfor
ved med at køre den GAMLE service worker (uden fetch-handler) — selvom den nye
kode var deployet. Rettet med `self.skipWaiting()` (install-event) +
`self.clients.claim()` (activate-event) i `sw.js`, samt en `controllerchange`-
lytter i `index.html` der genindlæser siden ÉN gang, så den garanteret kører
under den nyeste service worker efter en opdatering.

---

## Claude Code Setup Audit (15. sept. 2026) — fuld log

En selv-audit af `.claude/`-konfigurationen (ikke selve app-koden) scorede
30/100 — primært fordi projektet manglede `.claude/rules/`, `.claude/skills/`,
`.claude/commands/`, hooks og en `permissions.deny`-liste. Implementeret:
- **`.claude/settings.json`** (ny, delt/committet fil — IKKE `settings.local.json`,
  som forbliver personlige tool-godkendelser) fik en `deny`-liste (`.env*`,
  `*.pem`, `**/credentials*`, `**/*service_role*`) — team-wide guardrails
  hører til her, ikke i den gitignorede lokale fil.
- `.claude/rules/design-tokens.md` oprettet.
- `.claude/skills/ship/SKILL.md` oprettet.
- `.claude/commands/resync-branch.md` + `.claude/commands/mojibake-scan.md`
  oprettet.
- **Reelt håndhævet hook** (ikke kun prosa): `.claude/settings.json`s
  `PostToolUse`-hook kører `.claude/hooks/mojibake-check.py` efter hver
  `Write`/`Edit` og advarer automatisk ved fund — kræver mindst 2
  sammenhængende kyrilliske tegn for at undgå falske positiver fra tekst
  der selv omtaler mojibake-scan-regex'en (fx denne fil). Verificeret live
  (sentinel-test bekræftede hook'et faktisk fyrer) før commit.

**15. sept. 2026 — resten af listen taget op ("Sæt alt det andet op også"),
med to bevidste fravalg:**
- **`.claude/agents/design-reviewer.md` oprettet** — encoder den manuelle
  "gennemgå skærm mod alle retningslinjer"-proces (fladhed-bug, emoji/
  indhold-skel, `<Icon name>`-krydstjek, spacing-skala, antimønstre,
  kort-hierarki) som er brugt gentagne gange gennem hele designforbedrings-
  arbejdet ovenfor.
- **`.claude/commands/qa.md` + `.claude/commands/review-pr.md` oprettet** —
  i stedet for de generiske skabelon-navne fra det oprindelige audit-script
  (`/investigate`, `/canary`, `/land-and-deploy`), som enten ikke passede
  på EatSafes faktiske deploy-model (ingen canary-koncept) eller allerede
  var dækket 1:1 af `/ship`. `/qa` er byg/test/mojibake uden commit/push;
  `/review-pr` reviewer en PR/diff specifikt mod EatSafes egne
  konventioner (arkitektur-regler, edge-function-auth-mønster,
  feltnavne-mismatch-mønsteret).
- **Fravalgt (bevidst, ikke glemt):** de dybere audit-skills fra det
  oprindelige audit-script (`token-audit`, `eval-rules`, `eval-skills`,
  `audit-agents-skills`, `security-check`) blev IKKE hentet — de blev
  vurderet at kræve at køre uvurderet kode fra et tredjeparts-GitHub-repo
  (`FlorianBruniaux/claude-code-ultimate-guide`) i et repo med produktions-
  adgang (Supabase service-role, Vercel-deploy). `design-reviewer`-
  agenten dækker samme reelle behov (rule-/skill-evaluering) med kode
  skrevet fra bunden.
- **Fravalgt (kræver adgang uden for dette repo):** en dokumentations-MCP
  (fx Context7) er ikke sat op — det er ikke en repo-fil-ændring, men enten
  en global MCP-server-konfiguration eller en connector på claude.ai-
  kontoen, begge uden for dette repos/denne sessions kontrol. Sæt den op
  via claude.ai-connector-indstillinger hvis det bliver relevant.

**15. sept. 2026 — de dybere audit-skills taget op igen, delvist.** Ved
nærmere undersøgelse (hentet og læst den faktiske metodik-beskrivelse for
`security-check`, `eval-rules`, `audit-agents-skills`, `token-audit` fra
`FlorianBruniaux/claude-code-ultimate-guide` via `WebFetch`) viste det sig
at disse er læs-only, prompt-baserede tjeklister (Claude følger instrukser
og læser filer via `cat`/`grep`/`find`/`jq`), ikke eksekverbare scripts der
køres direkte — den oprindelige risikovurdering var derfor for forsigtig.
Metoden blev alligevel IKKE kopieret direkte (nogle af repoets skill-mapper
indeholder også bash-hooks, som stadig ikke bør hentes ubeset ind i et
repo med produktionsadgang). I stedet genskrevet fra bunden, specifikt til
EatSafes egen arkitektur: `.claude/skills/security-check/SKILL.md`
(sikkerhedsgennemgang tilpasset EatSafes faktiske sårbarhedshistorik —
Edge Function auth-mønsteret fra rescue-audittets Tier 1/2, service-role-
nøgle-eksponering — plus et trin der bruger `mcp__Supabase__get_advisors`
mod det live projekt) og `.claude/skills/token-audit/SKILL.md` (måler
`CLAUDE.md`/regel-filers faste context-overhead). Kørt mod repoet med det
samme: `CLAUDE.md`s historiske logbog (det daværende afsnit 5) udgjorde
~70% (6.284 af 8.953 ord) af hele filen — hvilket direkte førte til denne
HISTORY.md-udskillelse. `eval-rules`/`audit-agents-skills` fortsat bevidst
ikke lavet — kun 1 fil i `.claude/rules/` og en håndfuld skills/agents/
commands i alt gør en dedikeret audit-skill til for meget værktøj for for
lidt indhold lige nu; tag dem op hvis `.claude/`-mappen vokser væsentligt.

**17. sept. 2026 — "Audit My Claude Code Setup"-rapportens resterende 3
forslag implementeret**, samtidig med rescue-audittets fase 1-4 (se
"Rescue-audit — opfølgende gennemgang og fase 1-4" nedenfor): `allowed-
tools` tilføjet til de tre eksisterende skills (`ship`, `security-check`,
`token-audit`), en ny PreToolUse-hook (`.claude/hooks/block-dangerous-
bash.py`) der beder om bekræftelse ved `rm -rf` mod rod eller force-push
til main uden `--force-with-lease`/`git reset --hard`, og en ny path-
scoped regel `.claude/rules/edge-function-auth.md` (kun indlæst ved
arbejde i `supabase/functions/**/*.ts`) der dokumenterer det fire-vejs
auth-mønster rescue-audittets Tier 1/2 gentagne gange fandt manglende.

---

## security-check baseline-kørsel (15. sept. 2026)

Den nyoprettede `security-check`-skill blev kørt for første gang som en
baseline. To fund, begge rettet:

**HØJ — `send-push` havde ingen reel adgangskontrol.** `verify_jwt:true`
stoppede ikke ret meget, da den offentlige `anon`-nøgle (shipper i
frontend-bundlen) selv er en gyldig JWT. Funktionen selv havde intet
caller-identitets-tjek — enhver der kendte et `user_id` kunne sende en
push-notifikation med frit valgt titel/tekst/link, et oplagt phishing-
setup. Rettet (PR #225) med samme mønster som `allergens`/`ocr`: kræver
enten service-role-nøglen (interne kald som `weekly-digest`) eller en
rigtig indlogget bruger (`auth.getUser()`). Verificeret at eksisterende
legitime kaldere (weekly-digest, og `App.jsx`s familie-invitation-
accepteret-notifikation) stadig virker. **Residual risiko, bevidst
udenfor scope:** en registreret bruger kan stadig sende push med
selvvalgt indhold til en anden bruger, hvis de kender dennes `user_id` —
at lukke det fuldt kræver at flytte push-kaldet server-side (samme
mønster som `send-email`s DB-triggers), en større ændring.

**MEDIUM — 3 `SECURITY DEFINER`-funktioner var direkte kaldbare af den
offentlige anon-nøgle.** Supabases `get_advisors` flagede at 9 funktioner
var eksekverbare af `anon`/`authenticated` via `/rest/v1/rpc/`. Gennemgik
alle 9 enkeltvis:
- `family_group(p_uid)` og `is_admin(user_id)` — reelle informationslæk:
  begge er `SECURITY DEFINER` og omgår derfor RLS internt, så enhver med
  bare anon-nøglen kunne kalde dem direkte og få familiegruppe-
  medlemskaber hhv. admin-status for en vilkårlig bruger.
- `accept_family_invite` — en anonym kalder kunne "brænde" en gyldig
  invitation af (markere den accepteret med `accepted_by = NULL`) uden
  selv at blive tilknyttet, da `auth.uid()` bare bliver `NULL` for en
  ikke-logget-ind kalder og funktionen ikke eksplicit tjekkede for det.
- `handle_new_user`, `send_submission_email`, `send_ticket_email`,
  `send_welcome_email`, `sync_user_role_to_jwt` — alle `RETURNS trigger`,
  kun ment til at fyre som database-triggers. Reelt IKKE udnyttelige via
  direkte RPC-kald (Postgres fejler øjeblikkeligt uden `NEW`/`OLD`-
  kontekst), men lukket ned alligevel for at fjerne dem fra den
  eksponerede API-flade.
- `log_missing_ean` — bevidst offentlig (skal virke for uindloggede
  scanninger), ikke rørt.

**Vigtig teknisk lektion undervejs:** første forsøg på at rette dette
(`revoke execute ... from anon, authenticated`) virkede IKKE — verificeret
efterfølgende med `has_function_privilege()`, som stadig viste `true` for
`anon`. Årsagen: Postgres giver som standard `EXECUTE` til `PUBLIC` ved
funktions-oprettelse, og alle roller (inkl. `anon`/`authenticated`) arver
fra `PUBLIC` medmindre det eksplicit fjernes. At revoke'e kun fra de
navngivne roller uden også at fjerne `PUBLIC`-grant'en gjorde derfor ingen
forskel — et klassisk Postgres-privilegie-fælde. Rettet med `revoke
execute ... from public` + eksplicit re-grant kun til `authenticated`
(og `service_role`) hvor RLS-policies på `family_members`, `submissions`,
`feedback_tickets`, `shopping_lists`, `shopping_list_items` og `favorites`
reelt kræver det (de kalder `family_group()`/`is_admin()` direkte i deres
`qual`/`with_check`-udtryk). Verificeret efterfølgende med
`has_function_privilege()` for hver rolle × funktion, ikke kun antaget.
Anvendt direkte på databasen via `mcp__Supabase__apply_migration` (ingen
kodefiler ændret — dette var en ren DB-privilegie-ændring).

**Lektion for fremtidige `REVOKE`-fixes:** `REVOKE ... FROM <rolle>` uden
også `FROM PUBLIC` er en no-op hvis PUBLIC allerede har adgangen. Verificér
altid en revoke-fix med `has_function_privilege(rolle, funktion, 'EXECUTE')`
efterfølgende — antag det ikke virkede bare fordi kommandoen ikke fejlede.

---

## Rescue-audit (15. sept. 2026) — fuld tier-log

En læse-kun arkitektur-, bug- og sikkerhedsgennemgang af hele kodebasen er
publiceret som artifact her: **https://claude.ai/artifact/NsG75NGKsGsFTugYtwxu9X**
(ingen kode blev ændret i selve audit-turen — status nedenfor er fra de
efterfølgende gennemførelses-PR'er).

**Tier 1 (PR #215, merget):**
- Kritisk sikkerhedshul lukket i `supabase/functions/products/index.ts` —
  POST/PATCH/DELETE krævede ingen auth, nu admin-only (`auth.getUser()` +
  rolle-tjek, samme mønster som `admin`/`delete-user`).
- `ocr`-funktionen krævede heller ikke login — rettet (samme mønster som
  `allergens`).
- `customAllerg`-vs-`.custom`-feltnavne-buggen rettet i `useMadpas.js`,
  `App.jsx`, `RecipesScreen.jsx` (familiemedlemmers custom-allergier blev
  stille udeladt fra Madpas og "sikkert for familien"-filteret).

**Tier 2 (PR #216, merget):**
- 3 flere fuldt ubeskyttede Edge Functions lukket: `auto-import-off` (cron
  eller admin), `weekly-digest` (kun cron — kunne ellers udløse push-spam
  til 500 brugere), `send-email` (kun interne DB-triggers — kunne ellers
  sende vilkårlige emails fra vores Resend-konto). De tre DB-triggers
  (`send_welcome_email` m.fl.) migreret til at bruge service-role-nøglen
  fra Vault i stedet for den offentlige anon-nøgle, som ikke kunne skelne
  et internt kald fra et eksternt.
- `lookupProduct` (appens centrale scan-pipeline, 135 linjer) udtrukket fra
  `App.jsx` til `runLookupProduct()` i `useProduct.js` — lukker samtidig en
  stale-closure-risiko (al afhængigt state sendes nu eksplicit som ctx).
- Fjernet 2 døde state-variabler i `App.jsx` (`barcodeInput`,
  `editSubmitting`). `traceLog()` logger nu kun til konsollen i dev.

**Tier 3:**
- `useRecipes.js`s `loadRecipes()` indlæste opskrifter præcis én gang pr.
  session, aldrig genindlæst — rettet med en 10-minutters staleness-grænse
  (selvhelende over en lang session, uden at genindlæse ved hver
  skærm-navigation).
- **Fetch-konventioner delvist unificeret.** Roden til at `apiCall()`
  (helpers.js) blev fravalgt nogle steder var at den skjulte HTTP-status og
  rå fejl-body på en fejl — rettet: `apiCall` sætter nu `err.status`/
  `err.body` på den kastede fejl. Alle konkrete steder der eksisterede
  PGA. denne mangel er migreret til `apiCall` (`useRecipes.js`s
  `submitUserRecipe`/`loadRecipes`/`loadRecipeIngredients`, `useAdmin.js`s
  `loadSubmissions`/`loadTickets`, `useScanner.js`s `scanPhotoForEan`).
  Bevidst IKKE rørt: `useAuth.js`s login/signup (skal læse rå tekst FØR
  JSON-parse for at opdage et "Host not in allowlist"-svar — en reel,
  vedvarende grund til rå fetch) og `useAdmin.js`s `loadAdminStats` (3 af 8
  kald i samme funktion læser `response.headers.get("content-range")`,
  som `apiCall` ikke eksponerer — at migrere kun de resterende 5 ville
  give MERE inkonsistens internt i én funktion, ikke mindre).
- **Hand-rullet Realtime i `useShoppingList.js` — vurderet, bevidst
  BEVARET.** Overvejede at erstatte den med `@supabase/realtime-js`, men
  konkluderede at det ville være en regression-risiko uden reel gevinst:
  frontenden har i forvejen bevidst ingen `@supabase/supabase-js`-
  afhængighed (alt går via rå fetch + denne håndskrevne WebSocket-klient)
  — at hente et Realtime-bibliotek ind ville tilføje en ny afhængighed,
  ikke fjerne én. Biblioteket ville desuden kun erstatte selve WS-
  protokol-håndteringen (join/heartbeat/reconnect); den sværeste del af
  koden — optimistisk-opdatering-vs-Realtime-konflikthåndtering via
  `pendingIdsRef`/midlertidige id'er — er appens egen forretningslogik og
  skulle stadig bygges oven på biblioteket. Ingen kendte bugs er
  rapporteret i denne kode gennem hele denne session. **Konklusion: behold
  som den er.**
- **Supabase dev/branching-miljø — IKKE sat op.** Brugeren afviste
  eksplicit ("Lav ikke Set up Supabase dev/branching environment, da det
  ikke understøttes af mit abb.") — Supabase Branching kræver en højere
  plan end den nuværende. **Genoptag dette punkt når abonnementet
  opgraderes** — indtil da går alle skema-/edge-function-ændringer
  fortsat direkte til produktion, som beskrevet i `src/CONTEXT.md`.

---

## Rescue-audit — opfølgende gennemgang og fase 1-4 (16. sept. 2026)

**Opfølgende gennemgang** (artifact:
https://claude.ai/artifact/EvHQTrmjF1XjJEbuFzWFed): en frisk, læse-kun
re-audit fandt 4 nye, aktivt udnyttelige sikkerhedshuller i produktion —
ingen af dem dækket af den oprindelige rescue-audit ovenfor eller af
`security-check`s baseline-kørsel. Artefaktet har fuld fil:linje-evidens
plus en 4-fase prioriteret rescue-roadmap.

**Fase 1 (de 4 sikkerhedshuller + RPC-eksponering) rettet og deployet**
(samme dag) — se `SECURITY_TODO.md`s "16. sept. 2026"-afsnit for fuld
detalje: `allergens`s save-path kræver nu admin, `shopping`s
item-PATCH/DELETE IDOR er lukket (`.eq("list_id", ...)` tilføjet),
`auto-reparse` kræver nu service-role-bearer eller admin-login,
`send-push` tjekker nu en reel relation mellem kalder og push-mål (selv,
admin, eller fælles familiegruppe via `family_group`-RPC'en), og
`log_missing_ean` er revoked fra `public`/`anon`.

**Fase 2-4 gennemført** (samme dag, én PR pr. fase):
- **Fase 2:** rettede NotFoundScreen's data-tab-bug ved "gå tilbage" samt
  to abuse-cost-caps (`ocr`/`allergens` tekst-/base64-længde-grænser) og
  udvidede race-guard-mønsteret til `useAdmin.js`/`AdminScreen.jsx`.
- **Fase 3:** samlede dupliceret aktiv-allergen-logik, unificerede rå-
  `fetch()`-kald til `apiCall`/`makeHeaders` i AdminScreen.jsx/
  ListScreen.jsx, rettede en reel FK-constraint-fejl i `delete-user`
  (manglende oprydning af `family_memberships`/`shopping_list_access`/
  `families.created_by`), og tilføjede tests til `useProduct.js`/
  `useAuth.js` (de to tidligere utestede sikkerhedskritiske filer).
- **Fase 4:** fjernede forældede rod-dubletter (`CONTEXT.md`/
  `ROADMAP.md`) og kørte en ikke-breaking `npm audit fix`.
- **Bevidst udskudt fra denne batch dengang** (for stort/risikabelt uden
  dedikeret gennemgang): AdminScreen.jsx-opsplitning, udtræk af
  inline-features fra App.jsx, RLS-performance-advisories, og
  `npm audit fix --force` (breaking vite/vitest major-opgradering). Alle
  fire er siden taget op og gennemført 17. sept. 2026 — AdminScreen.jsx-
  og App.jsx-opsplitningen står nu i `CLAUDE.md` afsnit 3 (arkitektur er
  nutid, ikke historik); `npm audit fix --force` og RLS-performance-
  advisories var rene vedligeholdelses-opgraderinger uden funktionel
  ændring at logge her ud over at de er kørt.

---

## Hjem-forsiden redesignet efter delt referencedesign (24. sept. 2026)

Brugeren sendte et skærmbillede af en simpel "landing"-udgave af forsiden
(stor overskrift, cirkulær grøn scan-knap med glød, frugt-/blad-billeder i
hjørnerne, "Prøv en demo"-knap) og bad om at bruge det som ny forside.
Designet kolliderede direkte med flere bevidste, tidligere trufne valg
(ingen fotografi i appen, bundmenu Indkøbsliste/Scan/Søg — ikke Hjem/Scan/
Historik som i designet), så omfanget blev afklaret eksplicit FØR noget
blev bygget (tre spørgsmål: bundmenu, fotografi, skærm-struktur). Svar:
behold nuværende bundmenu, brug rigtige fotos, erstat Hjem-indholdet helt
med den simple landing-stil.

- **Bundmenuen er UÆNDRET** — kun `ScannerScreen.jsx`s HOME-blok (idle-
  tilstanden, altså før kameraet er aktivt) er redesignet.
- **Fjernet:** hilsen (`.greeting`), streak-badge, dagens-tip
  (`renderDailyTip`), indkøbsliste-genvejskortet. Alle fire var udelukkende
  brugt i denne ene blok — fjernelsen gjorde `renderStreakBadge`/
  `renderDailyTip`/`todayLabel` samt hele `useShoppingContext()`-
  destruktureringen (`shoppingList` var sidste levende brug) fuldt ubrugte,
  så de er slettet, ikke bare efterladt som dødt kode. Samme for
  `getGreeting()`-kaldet i `App.jsx` (selve funktionen i `utils.jsx` er
  bevaret uændret — den har sin egen test-suite i `utils.test.jsx`, og at
  slette en testet, eksporteret util udelukkende fordi ét kaldested
  forsvandt er unødvendig scope creep). De nu forældreløse CSS-regler
  (`.greeting`, `.greeting-eyebrow`, `.greeting-main`, `.greeting-sub`,
  `.home-tip*`, `.home-shortcut-card`) er også fjernet fra `theme.jsx`,
  inkl. deres to mentions i de kombinerede `:active`/text-shadow-selektorer
  fra tidligere bølger.
- **Bevaret uændret:** selve kamera-scannings-mekanikken (kamera-embed,
  laser-/scan-zone-overlay, galleri/manuel-EAN/lygte-kontroller, fejlhånd-
  tering) — kun IDLE-tilstandens (kamera ikke aktivt) visuelle præsentation
  er skiftet ud, fra den gamle grønne gradient-boks med stregkode-animation
  til en stor cirkulær grøn knap med blød radial-gradient-glød bagved.
  "Prøv en demo" genbruger den eksisterende `DemoSlider`-guide
  (`setShowGuide(true)`, samme handler som den forudgående "App-guide"-
  fodnote-knap, som er bevaret som den var).

**Billedhåndtering — sandboxen har ikke netadgang til stock-foto-CDN'er**
(`images.unsplash.com`/`images.pexels.com` begge 403 via agent-proxyen,
samme org-policy-mønster som Supabase). I stedet for at bede brugeren om
separate billedfiler blev frugterne (blåbær, jordbær, mynte-/basilikumblad)
beskåret direkte ud af brugerens EGET referencebillede med Python/PIL —
en legitim genbrug af billedmateriale brugeren selv delte til præcis dette
formål. **Iterativ baggrunds-fjernelse var nødvendig, ikke kun en fast
beskæring:** første forsøg (blød elliptisk alpha-maske, fast margin) gav
synlige rektangel-kanter mod appens prikgitter-baggrund, fordi enhver
resterende delvist-opak baggrundsfarve fra kilde-billedet visuelt slører
prikmønstret under sig. Løsningen der virkede: **farve-afstand-nøgling**
(sample baggrundsfarven fra et kendt baggrunds-udsnit af beskæringen,
beregn hver pixels euklidiske afstand til den farve, map afstand → alpha
via to tærskelværdier, blur alpha-kanalen let for en blød silhuet-kant) —
efterligner en simpel grøn-skærm/baggrunds-fjernelse, og lader appens eget
prikgitter skinne helt igennem uden om selve frugten. Krævede også en
gen-beskæring af tre af de fem billeder (blåbær-par, jordbær, basilikum-
blad) med mere baggrunds-margin end første forsøg — de oprindelige
beskæringer var for tætte på selve frugten til at nøglingen havde noget at
arbejde med, hvilket i praksis gjorde dem til næsten-rektangler igen.
Gemt som WebP (kvalitet 88) i stedet for PNG — identisk visuel kvalitet,
men ~380KB → ~50KB i alt for de fem billeder.

**Visuel verifikation:** samme etablerede metode som beskrevet i `CLAUDE.md`
afsnit 4 (håndskrevet mimic-HTML med ægte klasse-navne/CSS-værdier fra
`theme.jsx` + `playwright-core` med den forudinstallerede Chromium-sti) —
men iterativt denne gang, ikke ét skud: seks screenshot-runder undervejs
for at rette rektangel-kanterne (se ovenfor), en overlap-bug (overskriften
"Scan produkt" lå delvist bag frugtbillederne ved første forsøg — rettet
ved at hæve `.hero-text`s top-padding), og et sidste layout-fix hvor
blåbær-parret delvist dækkede topbarens "Feedback"-knap.

---

## Forside-collage, opfølgningsrunde (24. sept. 2026)

Efter forrige runde (se ovenfor) gav brugeren ny feedback: "forsiden ser
ikke lavet pænt. man kan se at frugt osv. er beskåret. du må gerne lave
det om. du må også gerne finde og hente andre 'ingredienser'. ideen skal
bare være den samme og det skal fylde hele skærmen. fjern også den
nederste demoknap. fjern også de så prikker i baggrunden".

**To "demo"-knapper fandtes efter et 10-dages merge-gab** — skulle
skelnes før noget kunne fjernes: (1) min egen "Prøv en demo"-pille
(`setShowGuide(true)`, åbner `DemoSlider`) i hero-blokken, og (2) en
helt urelateret `showDemoScan`/`runDemoScan`-funktion ("Fase 7b.2"),
tilføjet af andet arbejde i mellemtiden, som viser en stiplet-kant-knap
"Prøv en demo-scanning" — men KUN til konti under 24 timer gamle. Da
brugeren (ejeren, en gammel konto) aldrig ville se knap (2), måtte
"nederste demoknap" i feedbacken være knap (1). Besluttet: fjern kun
(1), rør ikke (2) — ikke i scope, ikke bedt om.

**Billedsourcing genundersøgt, samme konklusion som sidst — nu udtømmende
bekræftet:** testede igen `images.unsplash.com`, `images.pexels.com`,
`upload.wikimedia.org`, `images.freeimages.com`, `cdn.pixabay.com`,
`picsum.photos`, `user-images.githubusercontent.com` — alle 403 via
agent-proxyen (org-policy). Testede også `raw.githubusercontent.com`
(når faktisk, 301) og `api.github.com` (nås, 200) — men et faktisk API-
kald (`GET /search/repositories`) bekræftede at `api.github.com` i denne
sandbox er hård-scopet til kun de repos der er eksplicit tilknyttet
sessionen: "sessions are bound to their configured repositories. Use
repository-scoped endpoints". Konklusion: der findes ingen vej i denne
sandbox til at hente NYE/andre ingrediens-fotos, hverken fra det
generelle web eller fra GitHub-søgning. Løsningen blev derfor at
genbruge de 5 allerede lovligt beskårne billeder RIGERE (flere
instanser, varieret størrelse/rotation/position) i stedet for bogstaveligt
at finde andre ingredienser.

**Reel bug fundet, ikke kun et billedkvalitetsproblem:** ved at
undersøge hvorfor frugten "så beskåret ud" i den RIGTIGE app (ikke kun i
mit isolerede mimic-preview), viste det sig at den ydre scan-boks-
wrapper i `ScannerScreen.jsx` havde ubetinget `overflow:"hidden"` —
oprindeligt kun nødvendigt for at klippe kameraets afrundede hjørner når
`cameraActive` er sand. I hero-tilstanden (kamera IKKE aktivt) klippede
den samme `overflow:hidden` usynligt collage-billedernes kant-bløder-
positionering (negative top/left/right/bottom-offsets), fordi mit
tidligere isolerede mimic-HTML ikke efterlignede denne specifikke
wrappers struktur/overflow-opførsel. Rettet til
`overflow: cameraActive ? "hidden" : "visible"`. Lektion til fremtidigt
visuelt arbejde: en mimic skal enten efterligne ALLE relevante
container-wrappers (inkl. deres `overflow`-værdi), eller det specifikke
sted skal tjekkes direkte i den rigtige DOM-kontekst, ikke kun isoleret.

**Collage-densitet:** de 5 eksisterende WebP-billeder (`leaf-mint`,
`blueberry-single`, `blueberries-pair`, `strawberry`, `leaf-basil`) bruges
nu i ni positioner (nogle billeder optræder to gange) med varieret
størrelse/rotation via et data-drevet array i stedet for fem hårdkodede
enkelt-`<img>`-tags — spreder collagen over hele hero-blokkens højde
(top-hjørner, midt på begge sider, bund-venstre) i stedet for kun de
fire hjørner. Jordbær-billedet (kun et delvist udsnit i selve kilde-
fotoet, bekræftet ved en bredere re-beskæring af referencebilledet) er
bevidst kun placeret som ægte kant-bløder (bund-venstre, bleeder af
skærmen), aldrig midt i kompositionen.

**Basilikum-bladets kant-artefakt, fundet og rettet:** den oprindelige
`leaf-basil.webp` (fra forrige runde) viste et synligt lyst rektangulært
hjørne-mærke mod en almindelig baggrund — en for tæt beskæring uden nok
baggrundsmargin til at farve-afstand-nøglingen havde noget at arbejde
med (samme kendte begrænsning som nævnt i forrige rundes note ovenfor,
men denne gang faktisk observeret i praksis, ikke kun undgået). Løst i to
trin: (1) genskar bladet fra kilde-referencebilledet
(`images/1.webp`, region ca. x:640-851, y:1190-1430) med mere margin på
top/venstre — fjernede rektangel-artefaktet der, men et NYT hårdt
skære-mærke dukkede op i bund/højre, fordi kildefotoets baggrund der er
opslugt af hhv. scan-knappens glød (ovenfor) og den gamle "Prøv en
demo"-pille (nedenfor) i det oprindelige referencebillede — reelt ikke
nok ren baggrund tilgængelig på den side, uanset beskæringsstørrelse.
(2) Løst med en tvungen kant-udtoning: alpha-kanalen ganges med en
lineær fade-maske der går mod 0 over de sidste ~28px på bund- og højre-
kant, ovenpå den eksisterende farve-afstand-alpha — garanterer en blød
kant der hvor kildefotoet ikke gav nok baggrund at nøgle mod, uden at
det går ud over resten af bladets silhuet. Denne ene instans af bladet
bruges to steder i collagen: naturligt (højre-kant-bløder, uændret
retning) og spejlvendt via CSS `scaleX(-1)` (venstre-kant-bløder) — så
det naturlige "afskårne" hjørne fra kildebeskæringen altid vender ud af
skærmen i begge placeringer, uanset hvilken side det bløder af på.

**Visuel verifikation:** samme mimic-HTML + `playwright-core`-metode som
tidligere, denne gang 3 iterationer: (1) første version med den tætte
collage — afslørede basilikum-kant-artefaktet ved nærmere crop-
inspektion af screenshottet; (2) efter første genbeskæring — afslørede
det NYE bund/højre-kant-mærke; (3) efter den tvungne kant-udtoning —
ingen synlige hårde kanter tilbage nogen steder i collagen, bekræftet
ved targeted crops af alle klynge-områder (top-højre, venstre-midt,
højre-midt, bund-venstre).

**Verifikation:** `npm run build` grøn, `npm run lint` ren, `npx vitest
run` 98/98 grønne, mojibake-scan ren på `src/ScannerScreen.jsx`.

---

## Appens baggrundsfarve + forsøg på illustreret ingrediens-stil (24. sept. 2026, samme dag)

Efter opfølgningsrunden ovenfor bad brugeren om et markant større skridt:
"du bliver nød til at starte forfra og bygge gentænke hele designet i
appen. bundlinje, knapper, tekst og logo skal forblive hvor de er, men
baggrundsfarven og billeder skal ændres, så det går igen hele appen
igennem." Med en tilføjelse om Scan-sidens billeder: "må gerne indeholde
'ingredienser/frugter' [...] men lad vær med at tag direkte fra billedet,
da de giver unødige og grimme beskæringer."

**Afklaring før implementering (3 spørgsmål via AskUserQuestion, givet
omfanget — CLAUDE.md afsnit 4 beder eksplicit om at spørge ved
arkitektoniske/store ændringer):**
1. Baggrundsfarve-retning → brugeren valgte "jeg foreslår 2-3 forslag".
2. Billedstil (da vi ikke kan hente nye stockfotos, og direkte udklip gav
   grimme kanter) → brugeren valgte "tegnede/vektor-illustrationer
   (anbefalet)".
3. Omfang af ingrediens-billeder → brugeren valgte "kun Scan-siden".

**Baggrundsfarve — 3 paletteforslag bygget og screenshottet** (mimic-HTML
+ `playwright-core`, samme metode som tidligere runder): "A — Varm
ivory" (cremet off-white), "B — Blød salvie" (mere mættet, men stadig
lys grøn), "C — Blød fersken" (lys blush/peach-toning) — alle med
samme topbar/kort/knap/bundnav-struktur, kun baggrunds-token-værdierne
ændret, side om side i ét screenshot. Brugeren svarede uden for de 3
givne muligheder: "hvid" (fri-tekst-svar via AskUserQuestions "Other").
Implementeret som ren `#FFFFFF` for `--paper`, en neutral (ikke længere
grøn-tonet) lysegrå `#F3F3F1` for `--paper2`, tilsvarende neutrale
`--surface2`/`--surface3`, `body`-baggrunden, og bund-navigationens
baggrund (som tidligere var hardkodet til den gamle `#F6F8F3`-hex i
stedet for at referere `var(--paper)` — rettet til at referere tokenet,
så den automatisk følger fremtidige baggrunds-ændringer). Det
eksisterende punkt-gitter-mønster + top/bund-gløder (tilføjet i den
oprindelige "appen virker livløs"-designforbedring, se afsnit 5's
hovedtekst) er bevaret som struktur, kun gradient-stoppene er omregnet
fra cremet/grøn-tonede farver til næsten umærkelige neutrale gråtoner
oven på den hvide base — for at undgå at genintroducere "flad livløs
baggrund"-problemet som punkt-gitteret oprindeligt blev tilføjet for at
løse.

**Scope bevidst afgrænset til `src/theme.jsx` — ikke `src/admin/
adminTheme.js`.** Det separate desktop admin-panel (bygget i den 10-dages
periode der landede på `main` mens denne session kørte, se PR #268's
merge-konflikt-note ovenfor) har sin egen adskilte theme-fil med de
samme gamle farve-hex-værdier. Brugerens instruktion nævnte konkret
"Scanningssiden" og bundnavigationen — klart den forbrugervendte mobil-
PWA, ikke det interne admin-værktøj. Ændrede ikke admin-panelets tema
uden at være bedt om det.

**Ingrediens-illustrationer — to stilarter afprøvet, endte tilbage ved
fotos:**

1. **Første forsøg: flad SVG-cartoon-stil.** Byggede `src/
   HomeIngredientIcons.jsx` med 5 selvtegnede komponenter (`LeafIcon`,
   `LeafRoundIcon`, `BlueberrySingleIcon`, `BlueberryClusterIcon`,
   `StrawberryIcon`) — simple flade former, viewBox 0 0 100 100 for at
   matche det eksisterende width/top/left-positioneringsmønster fra
   foto-versionen. Fordelen ved fuldt vektor: jordbærret kunne nu tegnes
   som et KOMPLET bær (ikke kun det delvise udsnit kildefotoet gav) —
   løser den tidligere strukturelle begrænsning permanent. Screenshottet
   (mimic-HTML) og sendt til brugeren sammen med de 3 baggrunds-
   paletteforslag.

2. **Andet forsøg: glansfuld/skygget "emoji-stil".** Brugeren godkendte
   ikke den flade stil ("justér illustrationerne" → "det skal være
   realistiske frugter og ikke tegnet" kom først efter en opfølgende
   afklaring om HVAD der skulle justeres). Byggede om til gradient-
   baseret rendering: `radialGradient`/`linearGradient`-fyld (mørk kant →
   lys glans-punkt), spejlhøjlys-ellipser, bløde ambient-occlusion-
   skygger under hvert element (ellipse med blur/opacity), mere
   naturalistiske stier. Brugte `React.useId()` for unikke gradient-ID'er
   pr. instans (nødvendigt fordi samme ikon-komponent bruges flere gange
   i collagen — uden unikke ID'er ville flere `<svg>`-instanser dele
   samme `id`, hvilket er ugyldig SVG/HTML og kan give uforudsigelig
   gradient-genbrug på tværs af instanser). Resultatet lignede en Apple/
   Google-emoji-stil frugtillustration — markant mere tredimensionel end
   første forsøg, men stadig en tegning, ikke et foto.

**Konklusion — brugeren ville tilbage til rigtige fotos.** Efter at have
set den glansfulde version svarede brugeren "prøv foto-udklip igen, men
forsøgt bedre". Kommunikerede eksplicit til brugeren (før dette svar)
at ægte fotorealisme ikke er opnåelig i denne sandbox, da der ikke findes
nogen vej til at hente rigtige stockfotos (bekræftet blokeret, se
opfølgningsrundens note ovenfor) — den glansfulde vektor-stil var det
tætteste opnåelige uden faktisk fotografi. I stedet for at gen-beskære
fra bunden blev den ALLEREDE verificerede foto-udklips-version fra
opfølgningsrunden (ni positioner, det feathered/genskårne
basilikum-blad, jordbær kun som kant-bløder) gendannet fra git (kun
`git rm` staged, ikke committed endnu på dette tidspunkt i sessionen) —
`git restore --staged --worktree src/assets/home/` + `git checkout HEAD
-- src/ScannerScreen.jsx` + sletning af `HomeIngredientIcons.jsx`. Denne
version var allerede blevet visuelt reverificeret uden synlige
beskærings-artefakter i opfølgningsrunden, så ingen grund til at gentage
det arbejde. Genverificerede den kun mod den NYE hvide baggrund (i
stedet for den gamle `#F6F8F3`) via mimic-HTML — så stadig rent ud, ingen
nye artefakter fra farveskiftet.

**Visuel verifikation, hele runden:** 3-palette-sammenligning (ét
screenshot, tre telefon-mockups side om side), fuld app-baggrund-mockup
(topbar+kort+felt+liste+knap+bundnav på hvid), to runder af ikon-
preview-screenshots (flad stil, glansfuld stil), og en sidste
gencheck af den genoprettede foto-collage mod hvid baggrund. Alle via
samme etablerede mimic-HTML + `playwright-core`-metode.

**Verifikation:** `npm run build` grøn, `npm run lint` ren, `npx vitest
run` 98/98 grønne, mojibake-scan ren på `src/theme.jsx` (eneste fil
med reelle indholdsændringer i denne runde — `ScannerScreen.jsx` endte
uændret fra `HEAD` efter reverteringen).

---

## Scan-forsidens nye referencedesign implementeret (24. sept. 2026, samme dag)

Efter baggrundsfarve-redesignet (se ovenfor) delte brugeren to nye
referencebilleder i hurtig rækkefølge og bad om et konkret, håndgribeligt
resultat i stedet for endnu en abstrakt diskussion:

1. Et rent baggrundsfoto (frugt/blade — mynteblad, 3 blåbær, 2 basilikum-
   lignende blade, en halv jordbær — arrangeret på hvid baggrund, med et
   stort tomt bånd i midten), leveret direkte som `images/2.webp`. Vigtig
   forskel fra tidligere runder: brugeren gav nu et FÆRDIGKOMPONERET
   billede i stedet for at jeg selv skulle udklippe enkeltelementer fra
   et UI-mockup-screenshot — løste dermed hele "beskæring giver grimme
   kanter"-problemet strukturelt, ikke kun ved forsigtigere udklipning.
2. Et layout-referencebillede (`images/3.webp`) der viste: en hilsen-stil
   overskrift ("God morgen, Bjørn"), en tynd outlinet ring-knap (grøn
   ikon/tekst på gennemsigtig/hvid baggrund, IKKE fyldt), og en "Prøv en
   demo"-pille der overlapper det nederste hjørne af frugtbilledet.
   Instruktion: "layoutet skal gerne se sådan ud".

**Iterativ mockup-udvikling (kun HTML, ingen kodeændringer før sidste
skridt) — flere runder baseret på brugerfeedback:**

1. **Første mockup:** billedet som CSS `background-image` med
   `background-size:cover` inde i en fast-højde hero — viste sig forkert:
   overskriften kolliderede med en blåbær, og billedets bund blev
   beskåret (cover-skalering matcher ikke automatisk billedets egen
   indbyggede "tomme bånd" med UI-elementernes plads). Rettet ved i
   stedet at analysere billedet direkte med `numpy` (finde rækker med
   INGEN indhold på tværs af hele bredden, `dist>threshold`) for at
   lokalisere det faktiske blanke midterbånd (unscaled rows 550-1022 af
   1849, dvs. den fulde 851-brede bredde er fri i det interval) og
   placere overskrift/knap PRÆCIST der, som et almindeligt `<img>` i
   naturlig størrelse (intet `background-size:cover`, ingen beskæring
   mulig per definition).

2. **"Sæt alle knapper/funktioner ind":** byggede topbaren (logo+BETA+
   hjælp+feedback+menu-ikon med grøn notifikations-prik), footer
   (version + Beta-information/App-guide-knapper) og bundnav (med ægte
   ikon-stier hentet direkte fra `SharedComponents.jsx`s `Icon`-
   komponent for præcis visuel troskab) ind i mockuppen, så brugeren
   kunne se hele skærmen, ikke kun hero-udsnittet.

3. **Match layoutreferencen:** skiftede overskriften fra statisk "Scan
   produkt" til en hilsen ("God morgen, Bjørn" — placeholder-navn fra
   referencebilledet), ændrede knappen fra fyldt gradient til en tynd
   outlinet ring (matcher referencen), og genindførte en "Prøv en demo"-
   pille (cube-ikon + chevron) positioneret så den delvist overlapper
   det øverste hjørne af jordbær-/blad-klyngen nederst — tunet iterativt
   via to screenshot-runder til overlappet ramte rigtigt.

4. **"få baggrundsfarven til at gå i ét med resten... man kan se farven
   blive skåret af":** opdagede ved pixel-sampling (`img.getpixel()` i
   fire hjørner) at kildefotoets egen "hvide" baggrund faktisk var en
   svag mint-tone (~246,251,247), ikke ren hvid (255,255,255) — gav en
   synlig kant mod appens faktiske `--paper`. Løst med en global
   hvidbalance-korrektion: sample baggrundsfarven fra rene hjørne-
   udsnit, beregn per-kanal skaleringsfaktor (`255/refkanal`), gang hele
   billedet med den, clip til 255. Efterfølgende sampling bekræftede
   baggrunden nu læser ~254,254,254 (visuelt identisk med ren hvid),
   uden at forvrænge frugternes egne farver mærkbart (kun en mild
   ~1-3% kanal-vis skalering). Fjernede samtidig topbarens logo-ikon
   efter brugerens ønske ("må gerne fjerne eatsafe ikonet") og forstørrede
   den resterende "EatSafe"-tekst (15px→20px, vægt 600→800) så den bar
   sin egen visuelle vægt uden ikonet ved siden af.

5. **"skaler det ind så det passer med en telefon... det hele skal kunne
   være på en side":** målte via Playwright `getBoundingClientRect()` at
   den fulde komposition (topbar 54px + hero-billede ved 100% bredde
   847px + footer 74px + bundnav 77px) blev 1072px — langt over en
   telefonskærms højde. Beregnede en skaleringsfaktor k=0.75 (target
   844px total, en almindelig iPhone-referencehøjde), skalerede
   billedets renderede bredde til 75% (centreret med hvide kanter — usynlige
   efter hvidbalance-fixet ovenfor) samt alle overlejrede elementers
   positioner/skriftstørrelser/knapdiameter med samme faktor. Verificerede
   ved at sætte `.phone`s højde til en FAST 844px med `overflow:hidden`
   og måle at alt indhold nøjagtigt udfyldte det uden at noget blev
   klippet (kun 2.4px tilbage i en fleksibel spacer).

   **Selv-korrigeret fejlantagelse undervejs:** troede først at have
   fundet en beskærings-bug (en blåbær så "afskåret" ud i skærmbilledet),
   men pixel-for-pixel-sampling af den faktiske farveovergang beviste at
   det var en korrekt, blød skygge-udtoning i selve fotoet, ikke en
   hård beskæringskant — den visuelle "afskårne" fornemmelse kom
   udelukkende af at det usynlige hvide mellemrum omkring det formindskede
   billede gjorde det svært at se hvor billedets egen kant faktisk lå.
   God påmindelse om at verificere visuelle antagelser med rå pixel-data
   frem for kun øjemål på en nedskaleret preview-thumbnail.

6. **"glem det jeg skrev. Kom med forslag til scanningsknappen":**
   brugeren droppede selv skalerings-diskussionen og bad i stedet om
   knap-stilforslag. Byggede 3 sammenlignings-varianter side om side
   (samme metode som palette-sammenligningen i forrige runde): A) fyldt
   grøn gradient (klassisk, høj kontrast), B) blødt lysegrønt fyld med
   skygge (venlig, matcher app'ens bløde kort-æstetik), C) en forfinet
   version af den outlinede ring (tykkere kant, blød glød, let
   gennemsigtigt fyld). Brugeren valgte A.

**Implementering i rigtig kode (`src/ScannerScreen.jsx`, `src/App.jsx`,
`src/theme.jsx`):**

- Erstattede de 5 gamle foto-udklips-imports med ét samlet
  `scan-hero-bg.webp` (den hvidbalance-korrigerede version af
  brugerens billede, nedskaleret fra 851×1849 til 680×1477 — @2x af den
  ca. 320px visningsbredde det faktisk vises ved på en typisk telefon,
  for at holde filstørrelsen nede uden at ofre skarphed på retina-skærme;
  40KB endeligt).
- Genopdagede at scan-knappen i den RIGTIGE kode allerede havde den
  fyldte gradient-stil (fra før outline-eksperimentet, som kun
  eksisterede i mockuppen) — så "gå med A" krævede ingen kodeændring af
  selve knappen, kun af det omgivende layout.
- **Vigtig afvigelse fra mockuppens faste pixel-værdier:** mockuppen
  brugte faste px (390px-bredde-antagelse), men rigtig kode skal virke
  på tværs af enhedsbredder (`.app` har `max-width:480px`, reelle
  telefoner spænder ~360-430px). Løst ved at gøre hilsen/knap/demo-
  pilles `top`-positionering %-baseret relativt til billedets egen boks
  (beregnet fra mockuppens k=1-referenceværdier: 230/847=27%,
  388/847≈46%, 606/847≈71.5%) i stedet for at portere de faste px
  direkte — mere robust og en reel forbedring over mockup-tilgangen,
  ikke blot en oversættelse af den.
  Selve indholds-størrelserne (skrifttyper, knap-diameter) er bevaret
  som faste px fra k=0.75-beregningen, da tekstlæsbarhed er vigtigere
  end perfekt proportional skalering på tværs af enhedsbredder.
- Fjernede `overflow`-betinget kompleksitet på scan-boksens wrapper
  (var `cameraActive ? "hidden" : "visible"` — kun nødvendigt for den
  gamle bløde-ud-over-kanten-collage) tilbage til ubetinget `"hidden"`,
  da intet i det nye design bløder ud over sin egen boks.
  Genindførte `getGreeting()` (fra `src/utils.jsx`, allerede eksisterende,
  urørt siden 14. sept.-fjernelsen af hilsenen) + `user.name?.split("
  ")[0] || "der"` — samme fallback-mønster som den oprindelige,
  præ-14.-sept. hilsen brugte (bekræftet via `git show` på en ældre
  commit).
- Fjernede `EatSafeLogo`-brugen fra `App.jsx`s topbar (kun teksten
  "EatSafe" + BETA-badge + de tre funktionsknapper står tilbage) —
  komponenten selv er urørt, da den stadig bruges i Onboarding og
  ProfileScreen. Fjernede samtidig den nu-ubrugte `.topbar-shield`-CSS-
  klasse og forstørrede `.topbar-name` (15px/600→20px/800) i
  `theme.jsx`. Da topbaren er én delt komponent i `App.jsx` (ikke
  gen-renderet pr. skærm), gælder ikon-fjernelsen hele appen, ikke kun
  Scan-siden — vurderet som den rigtige tekniske løsning, matcher
  desuden sessionens gennemgående "hele appen skal være konsekvent"-tema.

**Verifikation:** genbyggede en Playwright-mimic af den FAKTISKE DOM-
struktur (inkl. den delte topbar og scan-boks-wrapperen) for et sidste
visuelt tjek af den rigtige kode, ikke kun mockuppen — bekræftede
korrekt gengivelse. `npm run build` grøn, `npm run lint` ren, `npx
vitest run` 98/98 grønne, mojibake-scan ren på alle tre ændrede filer.

---

## Scan-forsiden gjort skærmhøjde-konstant + baggrund bag top/bund-menuer (24. sept. 2026, samme dag, opfølgning)

Efter implementeringen ovenfor bad brugeren om to yderligere ting i én
besked: "Sørg for at det nye design passer til alle telefoner som en
konstant. sørg også for at den nye baggrund vises alle steder, også bag
top og bund menuer. Hvis du er i tvivl, så spørg mig først."

**Afklaring før implementering (2 runder AskUserQuestion, jf. den
eksplicitte invitation til at spørge):**

1. Første runde, to spørgsmål på én gang:
   - "Bag top og bund menuer" — skal topbar/bundnav være gennemsigtige
     KUN på Scan-siden, eller på ALLE skærme? Brugeren valgte: alle
     skærme (for konsistens, matcher sessionens gennemgående "hele appen
     skal være ét system"-tema).
   - "Passer til alle telefoner som en konstant" — skal HELE skærmen
     (topbar+billede+knapper+bundnav) altid passe på én skærmhøjde uden
     scroll, også på iPhone SE (667px)? Brugeren valgte: ja, nul scroll
     overalt, inkl. de mindste telefoner.

2. Anden runde, ét opfølgende spørgsmål: for at billedet reelt kan ses
   "bag" menuerne (ikke bare støde op til dem) er der to niveauer —
   (A) en mindre indgribende løsning: billedet fylder scan-boksen kant-
   til-kant, og topbar/bundnav får et "frosted glass"-look så farverne
   skinner blødt igennem, UDEN at ændre topbarens `sticky`-positionering;
   eller (B) en fuld løsning: topbar ændres til `fixed`/overlay (påvirker
   ALLE skærme, da topbaren er én delt komponent) så billedet reelt kan
   ligge bag den. Brugeren valgte (A), den mindre indgribende løsning.

**Hvorfor spurgte jeg to gange i stedet for at gætte:** den fulde
"billede bag topbar"-effekt kræver at ændre en DELT komponents
positionerings-model (sticky→fixed) på tværs af HELE appen, med
potentielle afledte effekter på padding-beregninger og scroll-adfærd på
alle andre skærme — en reel arkitektonisk risiko, ikke kun en Scan-
sidespecifik detalje. CLAUDE.md afsnit 4 beder eksplicit om at spørge ved
den slags, og brugeren gjorde det samme eksplicit i sin besked.

**Teknisk analyse før implementering — hvorfor den valgte løsning
faktisk virker:**

- **Topbar** er `position:sticky` — i et NUL-SCROLL scenarie (som er
  selve målet) opfører sticky sig identisk med almindeligt flow (der er
  intet at scrolle, så "stick"-adfærden udløses aldrig). Derfor kan
  topbaren IKKE reelt vise fotoet "bagved" sig uden en positionerings-
  ændring — den får kun det kosmetiske frosted-glass-look, ærligt
  formidlet til brugeren i dokumentationen, ikke camoufleret som mere end
  det er.
- **Bottom-nav** ER allerede `position:fixed` (en overlay, uden for
  `.screen`/`.app`s normale flow) — det betyder at HVIS indholdet
  (Scan-billedet) får lov at strække sig ind i den zone bundnav dækker
  (ved at fjerne den reserverede bund-padding), vil `backdrop-filter:blur`
  på bundnav rent faktisk sample de underliggende foto-pixels, IKKE bare
  se pænt ud på ingenting. Dette blev testet og BEKRÆFTET, ikke antaget:
  en tidlig prototype havde bundnav som et almindeligt (ikke-fixed)
  flex-element, hvilket fik det til at SE ud som om fotoet skinnede
  igennem, men reelt var der intet foto bagved (kun `.app`s prikgitter-
  baggrund) — genopbyggede prototypen med `position:fixed` (matcher den
  rigtige apps struktur) og zoomede ind på bundnav-området i skærmbilledet
  for at bekræfte at jordbær-/blad-farver faktisk sivede igennem
  sløringen. Denne selv-korrektion undervejs er en god påmindelse om at
  en prototype med en FORENKLET struktur (her: ikke-fixed navbar for
  nemheds skyld) kan give et falsk-positivt visuelt resultat, der ikke
  holder når man tester mod den faktiske positionerings-model.

**Højde-beregning — hvorfor flexbox frem for `calc(100dvh - Npx)`:**
Overvejede først en hardkodet budget-tilgang (`calc(100dvh - 260px)`,
med en manuelt udregnet chrome-højde fra Playwright-målinger af topbar/
footer/bundnav) — forkastede den til fordel for en ren flexbox-baseret
"fyld resterende plads"-tilgang, fordi: (1) den kræver ingen hårdkodede
tal der skal genberegnes hvis chrome-elementernes højde nogensinde
ændres, (2) den håndterer automatisk `env(safe-area-inset-bottom)`s
variation på tværs af enheder (0 på ældre telefoner med fysisk hjemme-
knap, op til ~34px på notch-/dynamic-island-telefoner) uden manuel
kompensation i selve budget-tallet, og (3) `.app` og `.screen` var
allerede sat op som `flex`-containere (`min-height:100vh` / `flex:1`) fra
tidligere arbejde — kun scan-boksen manglede at deltage korrekt i den
kæde. Løsningen: `flex:1` + `minHeight:0` på scan-boksens wrapper (det
klassiske flexbox-"krympe under indholdets naturlige størrelse"-fix,
virker sammen med den allerede eksisterende `overflow:hidden`), og
billedet selv `height:"100%"` (resolver korrekt fordi wrapperen nu har en
DEFINITIV, flexbox-udregnet højde) + `width:"auto"` (bevarer billedets
eget højde/bredde-forhold automatisk — ingen separat bredde-loft
nødvendig, da alle realistiske telefon-højder giver en bredde godt under
skærmens bredde på grund af fotoets aflange 1:2,17-format).

**Reel bug fundet og rettet under selv-verifikation, ikke kun antaget
korrekt:** Den bund-sikrede wrapper omkring de sjældne/betingede
elementer (simuleret-scan-knap, fejlbesked, manuel-EAN-input) fik
oprindeligt en UBETINGET `paddingBottom` (matchende bundnavs højde) — men
da denne wrapper altid er i DOM'en (uanset om dens indhold rent faktisk
vises), spiste den padding stille ca. 89px af scan-boksens `flex:1`-plads
i det ALMINDELIGE tilfælde (ingen fejl, ingen manuel-EAN, etableret
konto) — hvilket forhindrede billedet i nogensinde at nå helt ned til
bundnav, og dermed underminerede hele "baggrund bag bundnav"-formålet i
netop det tilfælde de fleste brugere oplever! Fanget ved at bygge en
mimic af den PRÆCISE nuværende JSX-struktur og opdage at bundnav-området
i skærmbilledet ikke viste foto-farver alligevel efter den første
implementering. Rettet ved at gøre paddingen betinget:
`(showDemoScan || scanError || showManualEan) ? "calc(...)" : 0` — kun
til stede når der reelt er noget at beskytte mod overlap med bundnav.

**Flytning af version/Beta-info/App-guide-fodlinjen:** var tidligere en
separat sektion i normal flow EFTER scan-boksen (med en `{flex:1,
minHeight:20}`-spacer foran til at skubbe den ned) — men med scan-boksen
nu `flex:1` er der intet "resterende rum" tilbage til en separat fod-
sektion i flow. Flyttet ind i selve hero-billedets overlay-lag, bund-
forankret (`bottom:"calc(77px + env(safe-area-inset-bottom) + 8px)"`,
IKKE `top:%`) så den altid forbliver lige over bundnav uanset hvor
høj/lav billedet selv bliver på forskellige skærmstørrelser — en ren %
fra toppen ville have placeret den forskelligt i forhold til bundnav på
forskellige enheder (udregnet: 91% af et 516px-højt billede på iPhone SE
lander INDE i bundnav-zonen, mens samme 91% af et 747px-højt billede på
Pro Max ikke gør — bund-forankring med en fast px-værdi løser dette
korrekt uafhængigt af billedets endelige højde). Knapperne fik samtidig
en halvgennemsigtig hvid pille-baggrund (samme mønster som "Prøv en
demo"-pillen) for kontrast mod fotoet nedenunder.

**Visuel verifikation, udtømmende:**
- 3 Playwright-screenshots (SE/standard/Pro Max) af en fuldstændig,
  DOM-tro mimic af den faktiske `ScannerScreen.jsx`/`theme.jsx`-kode
  (ikke en forenklet tilnærmelse) — nul overflow bekræftet BÅDE visuelt
  OG programmatisk via `element.scrollHeight <= element.clientHeight`
  i browseren, ikke kun ved at antage ud fra skærmbilledet.
- Zoomet crop af bundnav-området ved standard-højden, som viste
  jordbær-rødt og blad-grønt tydeligt (om end sløret) blandet ind i den
  ellers hvide bundnav-baggrund — det konkrete, pixel-niveau-beviste svar
  på "vises den nye baggrund bag bundnav?".
- En separat mimic af en ANDEN skærm (en liste-lignende visning med
  kort, ingen Scan-foto) for at bekræfte at den app-brede gennemsigtige
  topbar/bundnav-ændring også ser fornuftig ud mod det eksisterende
  prikgitter (ikke kun mod det nye foto) — prikkerne skinner blødt
  igennem begge barer, ikonerne forbliver tydeligt læselige.

**Ærligt formidlet begrænsning (ikke skjult):** Topbaren viser IKKE
bogstaveligt fotoet bagved sig (kun et kosmetisk frosted-glass-look),
fordi det ville have krævet den mere indgribende `sticky`→`fixed`-ændring
brugeren eksplicit fravalgte. Bundnav derimod viser fotoet reelt, fordi
den allerede var `fixed` i forvejen og derfor ikke krævede den samme
arkitektoniske ændring. Denne asymmetri er bevidst og direkte en
konsekvens af brugerens eget valg i afklaringsrunden, ikke en overset
uoverensstemmelse.

**Verifikation:** `npm run build` grøn (fangede og rettede en reel
syntaksfejl undervejs — et bogstaveligt backtick-tegn i en dansk CSS-
kommentar inde i `theme.jsx`s `appCss`-template-literal brød strengen
utilsigtet, rettet ved at fjerne backticken fra kommentarteksten), `npm
run lint` ren, `npx vitest run` 98/98 grønne, mojibake-scan ren på begge
ændrede filer (`theme.jsx`, `ScannerScreen.jsx`).

---

## 24. sept. 2026 — hotfix: flex-fill-hero'en fejlede reelt i produktion (den rigtige historie)

**Bug-rapporten:** Brugeren delte et skærmbillede (`images/4.png`) af
eatsafe.dk åbnet i en almindelig, bred desktop Chrome-browser — synlig
browser-scrollbar, "Scan produkt"-knappen tydeligt afskåret nederst i
viewporten. Besked (ordret): "Det er helt forkert. der er ikke flere
elementer på forsiden, end at det skal kunne være på siden uden man skal
kunne scrolle. Sørg for at vores nye baggrundsbillede passer til skærmen.
Brug billedet som baggrund på alle sider." Umiddelbart efter, som et
afbrydende opfølgningsbesked mens undersøgelsen var i gang: "vigtigst er
det passer til telefoner." — en eksplicit prioritetsafklaring: telefon-
korrekthed vejer tungere end desktop-browser-korrekthed, selvom det var
desktop-skærmbilledet der afslørede fejlen.

Dette stod i skarp kontrast til opfølgningen umiddelbart ovenfor i denne
fil, hvor præcis samme flex-fill-tilgang lige var blevet "verificeret" med
nul overflow ved tre skærmhøjder. Bug'en var reel i produktion, ikke en
fejlrapport ved en misforståelse — hvilket betød at selve testmetoden fra
sidst havde et hul.

**Rodårsagsanalyse — hvorfor den forrige verifikation gav et falsk positivt
resultat:** Den forrige tilgang (`scanbox{flex:1, minHeight:0}` + hero-
elementet `height:"100%"`) afhænger af at HELE forældre-kæden (`body`,
`.app`, `.screen`) har en DEFINITIV højde for at procent-/flex-beregning
kan opløses pålideligt. Men `body{min-height:100vh}` og
`.app{min-height:100vh}` er kun MINIMUMSVÆRDIER, ikke definitive højder —
en fundamental CSS-mekanik-detalje der blev overset. Den forrige tests
Playwright-mimic brugte en kunstig `.device{height:844px}`-wrapper uden om
det hele, som IKKE matcher produktionens rigtige CSS (som ikke har nogen
sådan fast-højde-forælder) — denne diskrepans mellem testens scaffold og
den rigtige apps CSS var testmetodens hul, og lod en reel bug nå
produktion uopdaget.

**Fix — forladt flex-fill/procent-højde helt:** Tilføjet en ny CSS-klasse
`.home-hero-frame` i `theme.jsx`s `appCss`-streng:
```
.home-hero-frame{
  position:relative;
  height:calc(100vh - 143px - env(safe-area-inset-bottom));
  height:calc(100dvh - 143px - env(safe-area-inset-bottom));
  max-height:820px;
  container-type:size;
}
```
`calc(100vh/100dvh - Npx)` er ALTID definitiv, uanset forældre-kædens
egen definitiv/indefinitiv-status — det gør den robust på en måde
flex-fill/procent-kæden aldrig kunne være. 143px-budgettet er
topbar (54px) + bundnav (77px) + 12px buffer. `dvh`-varianten (efter
`vh`-varianten, så den vinder i browsere der understøtter den) håndterer
mobile browseres dynamiske adressebjælke-højde bedre end statisk `vh`.
`ScannerScreen.jsx`s hero-wrapper skiftede fra `<div style={{
position:"relative", height:"100%" }}>` til `<div
className="home-hero-frame">`, og `scanbox`-wrapperens `flex:1,
minHeight:0` blev fjernet igen (ikke længere nødvendig).

**Genverifikation — denne gang med rigtige enhedsprofiler, ikke antagne
mål:** Byggede en ny mimic (`real_min_height.html`) der BEVIDST UDELADER
`html,body{height:100%}`, for præcist at matche produktionens
`min-height:100vh`-eneste opsætning. Testede med Playwright-core's
RIGTIGE `devices`-register (`devices['iPhone SE']`, `devices['iPhone
13']`, `devices['iPhone 14 Pro Max']`, `devices['Pixel 5']`) via
`browser.newContext({...device})` — ikke selvvalgte viewport-tal som
tidligere. Dette afslørede en fejlagtig antagelse fra den forrige runde:
en "iPhone SE" var tidligere antaget til at være omkring 390×667, men
Playwrights rigtige profil for iPhone SE er 320×568 — markant mindre.
Med den nye `.home-hero-frame`-tilgang: nul overflow bekræftet
programmatisk (`document.documentElement.scrollHeight <=
clientHeight`) ved alle fem scenarier (iPhone SE, iPhone 13, iPhone 14
Pro Max, Pixel 5, og det oprindelige brede 1920×1000-desktop-scenarie
der udløste bug-rapporten).

**Ny bug fundet ved det rigtige, mindre iPhone SE-mål: fast-pixel-UI
skalerer ikke ned.** Med rammens højde nu korrekt beregnet (og markant
mindre på en ægte iPhone SE end tidligere antaget), afslørede skærmbilleder
et tydeligt visuelt overlap mellem "Prøv en demo"-pillen og scan-knappen —
og selv på en helt almindelig iPhone 13 (390×664 per Playwrights profil)
overlappede "Prøv en demo"-pillens tekst synligt med "v1.0.6 · beta"-
footeren. Fast-pixel-størrelser (150px-knap, 11px-skrifter osv.) skalerer
ikke ned bare fordi deres forældre-ramme bliver kortere.

**Fix — CSS Container Queries + clamp():** `container-type:size` på
`.home-hero-frame` (allerede i CSS'en ovenfor) gør rammen til et query-
container, hvilket muliggør `cqh`-enheder (procent af containerens egen
højde) i børnene. Alle overlay-størrelser (skrifter, knap-diameter, ikon-
størrelser, mellemrum) konverteret fra faste px til
`clamp(min, Ncqh, max)` — fx knappens diameter
`clamp(84px, 21.5cqh, 140px)`, hilsen-navnets skrift `clamp(15px, 3.3cqh,
23px)`. Dette lader alt skalere proportionalt med rammens FAKTISKE højde,
mens en nedre grænse sikrer læsbarhed og en øvre grænse forhindrer
overdreven vækst på store skærme. Verificerede separat (i en isoleret
`/tmp/svg_test.html`/`svg_test2.html`) at `clamp()` reelt opløses korrekt
som en RÅ SVG-attributværdi (ikke kun i CSS `style`) — relevant fordi den
delte `Icon`-komponent sætter `<svg width={size} height={size}>` fra en
`size`-prop som en rå streng, ikke via en CSS-klasse. Bekræftet med
`getBoundingClientRect()` ved to forskellige viewport-højder, som gav
forskellige, proportionalt korrekte resultater — ikke bare et fald
tilbage til en fast værdi.

**Layout-forenkling: to uafhængigt positionerede elementer slået sammen
til én flex-gruppe.** "Prøv en demo"-pillen (tidligere `top:"71.5%"`) og
version/Beta-footeren (tidligere bund-forankret separat) var to
UAFHÆNGIGT `position:absolute`-forankrede søskende — ingen af dem kendte
til den andens faktiske renderede størrelse, så de kunne overlappe
hinanden når rammen blev lavere. Slået sammen til ÉN
`.demo-footer-group`-flex-kolonne (`display:flex, flexDirection:column,
gap:clamp(4px,1cqh,8px)`) — flexboxens normale flow garanterer nu at de
aldrig kan overlappe hinanden, uanset rammens højde. Samtidig fjernet den
nu-redundante "App-guide"-knap, som kaldte PRÆCIS samme handler
(`setShowGuide(true)`) som "Prøv en demo" — en bevidst forenkling for at
frigøre lodret plads, ikke noget brugeren eksplicit bad om, men begrundet
i reel redundans.

**Den anden, sidste bug: dobbelt-fratrukket bundnav-højde.** Efter
clamp/cqh-fixet viste et NYT screenshot-check at `.demo-footer-group`s
indhold stadig blev klippet af (`overflow:hidden` afskar synligt de
nederste pille-fragmenter) — selvom overlap-bug'en var løst. Årsag:
gruppens CSS satte BÅDE `top:"71.5%"` OG
`bottom:"calc(77px + env(safe-area-inset-bottom) + 6px)"` på samme
`position:absolute`-element, UDEN en eksplicit `height`. Uden en
eksplicit højde beregner browseren elementets højde som AFSTANDEN mellem
`top` og `bottom` — på en iPhone SE-ramme på ~425px var den afstand kun
~38px, alt for lidt til både pillen og footer-rækken, så
`overflow:"hidden"` klippede indholdet.

Denne `bottom:calc(77px+...)`-værdi var et levn fra den FORRIGE (flex-
fill) opsætning, hvor hero-billedet strakte sig helt ned bag bundnav via
flex-fill, og indhold derfor skulle reservere bundnav's højde eksplicit
for at holde sig fri af den. I den NYE calc-baserede
`.home-hero-frame`-tilgang har rammens egen højde-formel (`100dvh - 143px
- env(...)`) ALLEREDE trukket bundnav's højde fra som en del af de 143px
— rammens egen bundkant (100% inde i rammen) sidder derfor allerede
præcis der hvor bundnav begynder. At reservere bundnav's højde IGEN inde
i rammen via `bottom:calc(77px+...)` var en dobbelt-fratrækning, som
kunstigt klemte det tilgængelige rum ned til en tynd strimmel.

**Fix:** ændrede `bottom`-værdien på `.demo-footer-group` fra
`"calc(77px + env(safe-area-inset-bottom) + 6px)"` til
`"clamp(4px, 1cqh, 8px)"` — en lille, skalerende bundmargin i stedet for
en genberegning af bundnav's højde. Samme fix spejlet i
`real_min_height.html`-mimic'en. Genverificerede med `shot_devices.js`
efter fixet: nul overflow OG ingen klipning på alle fem scenarier,
bekræftet ved visuel inspektion af alle fem screenshots (`dev_iphone_se.
png`, `dev_iphone_13.png`, `dev_iphone_14_pro_max.png`, `dev_pixel_5.
png`, `dev_desktop_1920x1000.png`) — det oprindelige brede desktop-
scenarie viser nu ingen scrollbar og en fuldt synlig, ikke-afskåret
"Scan produkt"-knap, præcis det bug-rapporten efterspurgte.

**Kendt, accepteret tradeoff (ikke skjult):** i modsætning til den
forrige runde, hvor billedet fortsatte bag den slørede bundnav (se
opfølgningen ovenfor), stopper billedet nu FØR bundnav — en direkte
konsekvens af at `.home-hero-frame`s beregnede højde slutter der.
Dette er en bevidst afvejning givet brugerens eksplicitte prioritering
"vigtigst er det passer til telefoner" — den robuste, altid-definitive
`calc()`-højde vejer tungere end den rene visuelle effekt af fotoet der
strækker sig bag bundnav.

**Tilbagevendende fejl denne runde (3×): bogstavelig backtick i dansk
CSS-kommentar inde i `theme.jsx`s `appCss`-template-literal.** Hver gang
en kommentar refererede til kode ved hjælp af markdown-stil backticks
(fx `` `backdrop-filter:blur` ``, `` `env(safe-area-inset-bottom)` ``,
`` `devices['iPhone SE']`/`['iPhone 13']` ``), brød den bogstavelige
backtick JS-template-literalen og gav en Vite/rolldown-byggefejl
("Expected a semicolon..."). Fundet hver gang via `grep -n '`'
src/theme.jsx` og rettet ved at omskrive kommentaren uden backticks. Et
mønster der bør huskes ved fremtidige `theme.jsx`-redigeringer: aldrig
bogstavelige backticks i kommentartekst inde i `appCss`-strengen.

**Verifikation:** `npm run build` grøn, `npm run lint` ren, `npx vitest
run` 103/103 grønne, mojibake-scan ren på begge ændrede filer
(`theme.jsx`, `ScannerScreen.jsx`).

---

## Baggrundsbilledet gjort app-bredt (24. sept. 2026, samme dag)

Brugeren (Jan) delte et nyt billede (ingredienser/frugt i en dekorativ
ramme om et blankt hvidt midterfelt) og bad om at bruge DET som appens
ene, fælles baggrund på tværs af ALLE skærme — ikke kun Scan-forsiden —
og fjerne al anden baggrunds-kode for at rydde op, efter at have vurderet
at Bjørns Scan-specifikke fotobaggrund (se de tre log-poster ovenfor)
ikke virkede med appens højde/bredde på tværs af enheder.

- **`src/assets/app-background.webp`** (nyt, 941×1672, ~215KB) — erstatter
  både det tidligere prikgitter+farve-glød-lag i `.app` (theme.jsx) OG
  Scan-forsidens dedikerede `scan-hero-bg.webp` (slettet, ingen andre
  referencer i kodebasen).
- **Ægte `position:fixed`-boks, ikke `background-attachment:fixed`:** en ny
  `.app-bg`-klasse (theme.jsx) renders som absolut første barn i `.app`
  (App.jsx) — `position:fixed;inset:0;z-index:0;pointer-events:none`.
  Bevidst IKKE `background-attachment:fixed` direkte på `.app` (afprøvet
  først, virker fint i en isoleret mimic) — det er en velkendt, langvarig
  WebKit-begrænsning at `background-attachment:fixed` ikke understøttes
  pålideligt i mobil Safari/iOS-hjemmeskærm-PWA'er, som er appens primære
  platform. En ægte `position:fixed`-boks virker konsekvent alle steder.
- **`.screen{position:relative;z-index:1}`** tilføjet (var tidligere
  upositioneret/statisk) — nødvendigt fordi CSS' egen maleorden ellers
  tegner positionerede elementer med z-index 0 (som `.app-bg`) OVEN PÅ
  almindeligt statisk indhold, ikke under det (CSS 2.1 Appendix E, trin 3
  vs. trin 6) — uden dette ville baggrundsbilledet dække alt skærmindhold.
  Verificeret harmløst for eksisterende `position:absolute`-børn af
  `.screen` (samme fysiske containing-block-rektangel som `.app` før,
  da `.screen` via flexbox-stretch allerede fyldte `.app`s fulde bredde)
  og for `position:fixed`-børn (upåvirket — `position:relative` opretter
  ikke et nyt containing block for `fixed`-elementer).
- **Scan-forsidens `<img src={scanHeroBg}>` er fjernet** (ScannerScreen.jsx)
  — hero-boksen (`.home-hero-frame`, uændret calc-højde/container-query-
  mekanik, se ovenstående log-poster) viser nu blot appens fælles
  baggrundsbillede gennem sin egen transparente baggrund, samme som alle
  andre skærme. Hilsen/scan-knap/"Prøv en demo"-pillens %-baserede
  positionering er bevaret uændret (rammer stadig en fornuftig lodret
  rytme, uafhængig af det specifikke billede).
- `.topbar`/`.bottom-nav`s eksisterende `backdrop-filter:blur`-look
  (fra opfølgningen ovenfor) er UÆNDRET — kommentarerne er opdateret til
  ikke længere at nævne "prikgitter"/"Scan-sidens fotobaggrund" specifikt,
  men selve den slørede gennemsigtighed virker nu mere konsekvent end før,
  siden baggrunden er ens overalt.

Verificeret med en Playwright-mimic af den faktiske `.app-bg`+`.screen`-
lagdeling ved to skærmhøjder (667/iPhone SE, 844/standard) samt en
scroll-test (1200px ned i lang kortliste) — baggrunden forbliver pixel-
identisk fastlåst til viewporten, kort ligger korrekt ovenpå, ingen
strækning/forvrængning.

---

## Scan-forsiden, opfølgning: større hero-elementer, "Prøv en demo" fjernet, blødere bar-kant (24. sept. 2026, samme dag)

Brugerfeedback efter forrige runde: "Alle elementer, herunder tekst er dog
for småt på scan skærmen", "Prøv en demo"-knappen skulle væk, og top/
bund-menuens sløring skulle have "mindre blur" og "fade ud, så der ikke
er den skarpe kant".

- **Scan-forsidens hero-elementer hævet ~20-25%:** hilsen/navn/undertekst,
  scan-knappens diameter+ikon+label, og version/Beta-chippen har alle
  fået hævede `clamp(min, Ncqh, max)`-værdier (fx scan-knappen
  84-140px → 104-168px). Kun størrelserne er ændret — de %-baserede
  `top`-positioner er bevidst holdt uændrede (27%/46%) efter et
  mellemliggende forsøg på at flytte dem opad (25%/45%) gav synligt
  større overlap mellem hilsenen og billedets øverste, tættere pakkede
  hjørne-elementer på korte skærme (iPhone SE) — reverteret.
- **"Prøv en demo"-knappen fjernet.** Den var, siden "App-guide"-knappen
  blev fjernet som redundant i en tidligere runde, den ENESTE indgang til
  `DemoSlider`-guiden (`setShowGuide(true)`) — `showGuide`-state og
  `DemoSlider`-komponenten i `ScannerScreen.jsx` er bevidst IKKE slettet,
  men har nu ingen synlig indgang i UI'et nogen steder. Genoptag ved
  behov (fx en indgang under Profil-menuen) eller fjern dødt-kode-resten,
  hvis brugeren bekræfter guiden reelt ikke skal bruges mere.
  Version/Beta-info-rækken er nu alene i sin flex-kolonne, bund-forankret
  (`justify-content:flex-end` i stedet for `flex-start`) i stedet for at
  sidde i toppen af sin egen sektion med tomrum under.
- **Blødere top/bund-bar-overgang:** flyttet selve tonen+sløringen fra
  `.topbar`/`.bottom-nav` til en ny `::before`-pseudo-klasse på hver
  (`z-index:-1`, inden for barens egen stakke-kontekst som
  `position:sticky`/`fixed` + eksisterende `z-index` allerede opretter)
  — nødvendigt fordi en maskeret udtoning direkte på selve baren også
  ville have tonet dens SYNLIGE indhold (logo/knapper/nav-ikoner) ud,
  ikke kun baggrundslaget. `mask-image`/`-webkit-mask-image` med en
  lineær gradient tonet ud over den sidste ~35% (topbar, mod bunden) hhv.
  ~45% (bottom-nav, mod toppen) af barens højde erstatter den tidligere
  hårde kant hvor sløringen stoppede brat. Blur reduceret samtidig
  (topbar 16px→8px, bottom-nav 20px→10px).

Verificeret med en opdateret Playwright-mimic af den fulde hero-sektion
ved to skærmhøjder.

---

## Scan-knappen gentænkt fire gange: lys/skygge → gummibold → fladt → ghost/outline → radar → dybde (24. sept. 2026, samme dag)

Efter ovenstående redesign-runde fulgte fire hurtige, brugerdrevne
iterationer på selve scan-knappen samme dag, hver shippet som sin egen
PR (#291–#295) efter build/test/mojibake-scan + visuel Playwright-mimic-
verifikation:

1. **"Kan vi tilføje lidt liv med noget lys eller skygger, samt måske
   lidt animation på skan knappen?"** — tilføjede en glossy inset-
   highlight, dybere skygge, og to asynkrone keyframe-animationer
   (`scanCtaGlow` på gløden bagved, `scanCtaBreathe` på selve knappen,
   forskellig varighed for at undgå et stift/mekanisk synkront udtryk).
   Samtidig fik et delt billede (`src/assets/profile-menu-background.webp`)
   ProfileMenu.jsx som baggrund, samme dekorative stil som app-baggrunden
   men et separat, højere-formatet billede.
2. **"Synes ikke jeg kan se det glossy. måske også med en lys effekt."**
   — den oprindelige highlight (svag inset-box-shadow) var for svag til
   at ses. Erstattet med et rigtigt, synligt lyspunkt direkte i knappens
   baggrund (`radial-gradient` øverst til venstre, "lit sphere"-teknik) +
   en lysere/større glød bagved. Brugerfeedback herefter: **"Synes ikke
   den er pæn knappen. Ligner en gummibold."**
3. **Rettelse af gummibold-feedbacken:** fjernede den store, tydelige
   radial-gradient-glossy-plet helt. Erstattede med en subtilere
   baggrunds-gradient (mindre lys/mørk-kontrast), en tynd 1px lys kant
   øverst i stedet for en stor hvid plet (flad "elevation"-skygge frem
   for en glossy sphere), og en roligere/langsommere glød-animation.
   Samtidig: bundnavigationens inaktive ikoner/labels brugte
   `opacity:.45` til at dæmpes, hvilket — kombineret med barens
   gennemsigtige/slørede baggrund — gjorde dem svære at se ("mine
   knapper forsvinder lidt i bundmenuen"). Erstattet med en solid,
   mørkere farve (`--ink2`) i stedet for opacity-dæmpning.
4. **"Gentænkt hele knappen. Den skal være mere elegant. Kom med nogle
   forslag."** — mockede tre distinkte koncepter op (minimalistisk flad
   cirkel med halo-ring, "squircle" app-ikon-stil, ghost/outline med
   hvid flade + grøn kant), screenshottede dem side om side via en
   Playwright-mimic, og sendte billedet til brugeren med en kort
   anbefaling pr. koncept. Brugeren valgte **"Nr 3 med lidt lys der
   bevæger sig rundt i kanten"** — ghost/outline + et roterende lyspunkt.
   Implementeret som to lag i ét ring-element: en svag, konstant grøn
   bundfarve (ringen altid synlig) + en roterende `conic-gradient` med et
   lysere "komethoved" ovenpå (`scanCtaRingSpin`, oprindeligt 5s lineær
   rotation), knap-fladen ovenpå dækkende det meste af ringen.
5. **"Ligner en radar. Lav det mere elegant. Skab mere dybde."** — den
   skarpe, smalle conic-gradient-bue uden blur lignede en radar-sweep.
   Rettet ved at gøre lyset bredt og kraftigt blurret (`filter:
   blur(7px)`) og rotere langsommere (9s i stedet for 5s), så det driver
   som en blød skæren i stedet for at pege som en stråle. Tilføjede
   samtidig reel dybde i tre lag: en blød, jordet ambient-glød bagved
   (en "svæve over baggrunden"-fornemmelse), en næsten umærkelig dome-
   agtig radial-gradient i selve knap-fladen (ikke glossy, kun antydning
   af krumning), og en Material-inspireret fler-lags elevation-skygge
   (nær+fjern skygge oveni hinanden) i stedet for én flad skygge.

**Metode-lektion:** når en visuel ændring ikke kan beskrives entydigt i
ord ("mere elegant"), er det mere effektivt at mocke 2-3 konkrete,
navngivne koncepter op og lade brugeren vælge/pege, end at gætte på ét
forslag ad gangen og vente på afvisning — sparede mindst én hel
iterations-runde i trin 4 ovenfor.

**Driftsnote (ikke kode-relateret):** under denne sessions mange PR'er
ramte Vercel Free-planens daglige deployment-grænse (100/dag) på PR #295
— `Resource is limited - try again in 24 hours`. Ikke en kodefejl;
verificeret ved at `npm run build`/`npx vitest run` begge var grønne
lokalt uafhængigt af Vercel-status. Brugeren valgte at merge PR #295 uden
at vente på et grønt Vercel-preview, da produktions-deploy sker separat
ved merge til `main`.

---

## Delt Artifact-preview oprettet (24. sept. 2026, samme dag)

Efter Vercel-grænsen ovenfor spurgte brugeren efter "et super simpelt
værktøj" så han og hans forretningspartner kan se appen uden at bruge af
Vercels daglige deployment-kvote. Afklarede først om det skulle være en
lokal dev-server hver, eller ét delt browser-link — brugeren valgte det
delte link, efter at have fået bekræftet at det IKKE påvirker selve
Vercel-produktionen (separat statisk kopi hostet på Anthropics egen
infrastruktur), men at det kalder samme live Supabase-database som
produktion, og at PWA-specifikke ting (service worker/installation) ikke
kan testes troværdigt derfra.

**Nuværende link (2. okt. 2026, opdatér dette, ikke opret et nyt, ved fremtidige
republiceringer):** https://claude.ai/artifact/TWF7PqgP8fUM4nYchh4AQH
(det forrige, `.../PPxytnuXXJQc6dp3RzxUTt`, kunne ikke læses længere; det før, `.../4JfwuFxTaarPEqZFSs2eQ9`, kunne ikke læses længere; `.../KYD7ZofTv9o81CgZTVQ9j3` kunne ikke opdateres fra Claude-sessioner — oprettet af en anden bruger/organisation).
**Ældre link:** https://claude.ai/artifact/KYD7ZofTv9o81CgZTVQ9j3
(det forrige link, `.../TzA4goSRfzAoSVWvoM94z1`, blev slettet eller mistede
skriveadgang inden 24. sept. 2026's opfølgnings-runde — et helt nyt link
blev oprettet i stedet. Hvis DETTE link også holder op med at virke,
opret igen et nyt og opdatér denne linje, i stedet for at antage
publicerings-fejlen betyder noget andet er galt.)

(24. sept. 2026 — en parallel session rapporterede fejlagtigt at dette
link var slettet/havde mistet skriveadgang, og dokumenterede i stedet et
nyt link, `.../KYD7ZofTv9o81CgZTVQ9j3`. Verificeret samme dag: DET nye
link kan ikke læses ("artifact not found") fra en anden session på samme
konto, mens dette oprindelige link fortsat læses og republiceres uden
problemer ("owned by you") — det nye links session havde sandsynligvis
blot mistet sin egen sessions adgang, ikke selve artifacten. Brug derfor
fortsat DETTE link. Opret først et nyt hvis en publicering til netop
dette link reelt fejler.)

Metoden er dokumenteret i CLAUDE.md's "Andre stående aftaler". Kort
opsummeret: `vite build --base=./ --mode artifact-preview`, en telefon-
ramme-wrapper (`index.html` med et `<iframe src="app.html">`, 393×852-boks,
`@media (max-width:460px)` fjerner rammen på en rigtig telefon), og en
login-bypass-knap på WELCOME-skærmen der kun findes i `artifact-preview`-
mode (login virker upålideligt fra Artifact-domænet).

Verificeret ved en lokal `python3 -m http.server`-servering af
`dist-preview/` + Playwright-screenshots ved både desktop- (1280×900,
telefon-ramme synlig) og mobil-viewport (390×844, fuld-bredde uden ramme)
— samt et klik-igennem af login-bypass-knappen, der bekræftede appen
navigerer til Hjem-skærmen uden at crashe (nogle konsol-fejl fra blokerede
Supabase-kald i selve sandbox-test-miljøet, forventet der men ikke i en
rigtig brugers browser).

**Opfølgning samme dag: rammen skal passe uden scroll.** Brugeren bad om
at telefon-rammen tilpasses siden, så man ikke skal scrolle for at se hele
den. Den faste 393×852px-boks kunne blive for stor til et lille eller
bredt-men-lavt Artifact-panel. Rettet med et lille inline-script der
beregner en `transform:scale()`-faktor ud fra `window.innerWidth`/
`innerHeight` (mindst af `1`, bredde-baseret og højde-baseret skalering),
gentaget på `resize`. `html,body` fik `overflow:hidden`, og hint-teksten
under telefonen blev `position:fixed` (ude af flex-flowet) i stedet for en
almindelig flex-søskende, så den aldrig skubber rammen ud af syne uanset
skalering. Verificeret programmatisk (`scrollWidth <= clientWidth` og
`scrollHeight <= clientHeight`, ikke kun visuelt) ved fire meget
forskellige viewport-former (bred desktop 1280×900, smalt/højt panel
480×720, bredt/lavt vindue 900×480, kvadratisk 600×600) — ingen overflow
i noget scenarie, telefonen centreret og læsbar i alle fire.

**Endnu en opfølgning samme dag: Scan-siden fremstod tom.** Brugeren
rapporterede at Scan-siden ("pointen" med preview'en) var tom efter klik
på login-bypass-knappen. Undersøgt via en minimal debug-wrapper (rå
`<iframe>`, ingen telefon-ramme) + Playwright: `document.querySelector(
'.home-hero-frame')` returnerede `null` — hele hero-blokken (hilsen,
scan-knap) manglede fra DOM'et, ikke bare usynlig via CSS. Rodårsag
fundet ved at læse `ScannerScreen.jsx` linje for linje fra `.screen`-
wrapperen og nedefter: hele kamera-boksen OG hero-blokken er nested
inde i `{!!userId && <div>...}` (linje 237) — en gate til "kun for
loggede ind", som aldrig blev opfyldt, fordi login-bypass-knappen kun
kaldte `setScreen(SCREENS.HOME)` uden nogensinde at sætte en `userId`.

**Fix:** `setUserId` (fandtes allerede i `useAuth()`s return-værdi, men
var ikke med i `authContextValue` i App.jsx — tilføjet) + preview-
bypass-knappen sætter nu en mock `userId` ("preview-demo-bruger"), et
mock brugernavn ("Mille Nielsen") og to mock-allergener (gluten,
nødder), før den navigerer til Hjem. Genverificeret med samme debug-
opsætning: `.home-hero-frame` findes nu i DOM'et, og screenshot viser
hele hero-blokken (hilsen "God dag, Mille", scan-knap, undertekst)
korrekt renderet.

**Stående lektion for denne preview-metode:** enhver skærm der viser sig
tom i preview'en skal undersøges for lignende `!!userId`/`!!user`-gates
(eller lignende "kun for loggede ind"-mønstre) og få tilsvarende mock-
data tilføjet til bypass-knappens handler i `OnboardingScreen.jsx` —
ikke antages at være en uløselig konsekvens af manglende rigtig session.

---

## 24. sept. 2026 — mergekonflikt: grøn-fyld-CTA'en mødte 14 parallelle commits på main

**Baggrund.** Efter at PR #307 (Scan-forsidens grønne CTA + nyt baggrunds-
foto) var mergeret, fortsatte brugeren samtalen i samme session med to
opfølgende beskeder: først et spørgsmål om hvorfor det viste baggrunds-
billede "ligner intet" af det uploadede referencefoto ("Det skal være så
identisk som muligt"), derefter et eksplicit designønske: "Knappen skal
være grøn, men den må gerne pulsere så man får lyst til at trykke."

**Fejl nr. 1 — mimic-bug, ikke en rigtig kode-fejl.** Da CLAUDE-koden blev
verificeret tidligere i sessionen (visuel skærmbillede-sammenligning via en
håndskrevet standalone HTML-fil + Playwright, jf. den stående metode i
afsnit 4), var den skrevne test-mimic ved en fejl bygget med en ekstra
`<div class="hero">`-wrapper omkring `<img>`, som IKKE findes i den rigtige
`ScannerScreen.jsx` (der har billedet som DIREKTE barn af `.home-hero-
frame`). Den wrapper-div manglede en `height:100%`-regel, så CSS'ens
`height:100%`-procentregel på billedet ikke kunne opløses — billedet faldt
tilbage til sin NATURLIGE pixelstørrelse (941×1672) i stedet for at skalere
ned til rammens højde, hvilket gav et stærkt indzoomet, beskåret udsnit
(kun mælkekanden synlig) i skærmbilledet der blev vist til brugeren. Roden
til fejlen var udelukkende i test-værktøjet — retning bekræftet ved at
fjerne wrapper-div'en fra mimic'en og genmåle: billedet render'er korrekt
til 293×521px (fuld, uskåret gengivelse af hele to-kolonne-billedet), nul
overflow på både iPhone SE og iPhone 13. Den RIGTIGE, allerede mergede
PR #307-kode havde aldrig denne fejl.

**Fejl nr. 2 — reel mergekonflikt med 14 parallelle commits.** Da PR #308
(den grønne-CTA-opfølgning) skulle oprettes, viste det sig at `main` var
rykket 14 commits frem siden PR #307 blev mergeret — herunder en fuld,
uafhængig gentænkning af PRÆCIS samme skærm:
- **#288**: nyt app-bredt baggrundsbillede (`app-background.webp`,
  ingredienser/krydderier-flatlay) ERSTATTEDE Scan-forsidens eget foto helt
  — et nyt `.app-bg`-lag i `theme.jsx`, brugt af ALLE skærme, ikke kun Scan.
- **#289**: "Prøv en demo"-pillen fjernet efter brugerens (daværende)
  ønske, hero-elementer gjort større.
- **#290–295**: scan-knappen redesignet 6 gange (glossy → for "gummibold"-
  agtig → roterende lyspunkt → "for radar-agtig" → endelig en hvid ghost/
  outline-knap med et bredt, blurret roterende lyslag + et "åndedræt"
  (scanCtaBreathe) + knappen gjort 50% større).
- **#299–302**: mock-data til Artifact-preview (urelateret til Scan-designet).
- **#303–305**: endnu et nyt app-bredt baggrundsbillede + hvidt slør-lag
  for tekstlæsbarhed.
- **#306**: kritisk hotfix — en backtick i en kommentar inde i `appCss`
  (samme fejlklasse som denne session selv ramte 3 gange under PR #287,
  se ovenfor) brød hele appen til en hvid skærm for alle brugere.

`git merge origin/main` gav reelle konflikter i `App.jsx` og
`ScannerScreen.jsx` (button-JSX'en, footer-JSX'en), samt en modify/delete-
konflikt på `scan-hero-bg.webp` (slettet af main i #288, ændret i denne
gren). `theme.jsx` og `CLAUDE.md` auto-mergede uden konflikt, men **den
stille, IKKE-konflikt-flaggede del af diffen fjernede `scanHeroBg`-
importen og `<img>`-tagget helt** — fordi kun `main` havde rørt de linjer
(min gren rørte kun linjer LÆNGERE NEDE i samme fil), havde git ingen grund
til at flagge en konflikt der, og anvendte bare main's sletning. Dette blev
opdaget ved en efterfølgende `npm run build`, hvor `scan-hero-bg` UDEBLEV
fra `dist/assets/`-listen — en påmindelse om at "ingen konflikt-markører"
IKKE er det samme som "hele hensigten er bevaret" ved en stor, mangecommit-
merge; et `git diff --stat` mod den gamle base + en post-merge build-
assets-optælling er værd at gøre som fast rutine efter en merge af denne
størrelse.

**Beslutninger ved reconciliering** (ingen af dem oplagte — afvejet mod
brugerens forskellige, til tider modstridende signaler fra selve denne
samtale over for hvad andre parallelle sessioner tydeligvis havde aftalt
med brugeren):
1. **App-bredt baggrundssystem (main) beholdt for resten af appen** — ikke
   rørt, urelateret til denne opgave.
2. **Scan-forsidens EGET baggrundsfoto genindført** (import + `<img>`-tag)
   på trods af at main havde fjernet konceptet helt — begrundet i at
   brugeren, i DENNE samtale, eksplicit havde bedt om at netop dette
   uploadede foto skulle bruges her, og havde netop bekræftet interesse i
   at det skulle matche "så identisk som muligt".
3. **Grøn fyld i stedet for main's hvide ghost/outline-knap** — direkte
   bedt om ("Knappen skal være grøn"), men main's STØRRELSE (50% forøget)
   og `scanCtaBreathe`-åndedræt genbrugt uændret, da knap-STØRRELSEN aldrig
   var omtvistet i denne samtale, kun farven/pulsen. Den nu-ubrugte
   `scanCtaRingSpin`-keyframe (det roterende lyslag, specifikt til ghost-
   stilen) er slettet; `scanCtaBreathe` beholdt og eksplicit genbrugt til
   den grønne knap.
4. **Halo-pulsen gjort tydeligere** (skala 1→1.12 i stedet for 1→1.08,
   opacity .8→.35 i stedet for .75→.4, 2.4s i stedet for 2.8s) — direkte
   svar på "må gerne pulsere så man får lyst til at trykke", en anden
   vægtning end den oprindelige PR #307-tekst ("meget diskret").
5. **Main's fjernelse af "Prøv en demo"-pillen OG versionsnummeret
   respekteret** — PR #307 havde bevidst bevaret "Prøv en demo"-pillen
   (med en note om at spørge brugeren hvis forkert antaget), men main's
   commit-historik viste at brugeren allerede havde bedt om den fjernet i
   en anden, parallel session (#289) — den mere specifikke, senere
   bekræftede brugerinstruks vinder over denne sessions egen tidligere,
   mere forsigtige antagelse.

**Ny bug fundet under reconciliering, IKKE en del af hverken PR #307 eller
main's arbejde:** med main's forstørrede knap (fra 6-rundes-redesignet)
kombineret med den ORIGINALE `top:"46%"`-placering, var der reelt kun et
6.75px mellemrum mellem undertekst og knap på iPhone SE — målt til et
**-1.75px OVERLAP** før fix (undersøgt grundigt: første Playwright-
skærmbillede SÅ ud som et overlap på iPhone 13 også, men det viste sig at
være en fejllæsning af skærmbilledet — et `getBoundingClientRect()`-
opslag med CSS-outlines og alle animationer deaktiveret bekræftede et
rent, 20px mellemrum på iPhone 13; kun iPhone SE havde et reelt, om end
minimalt, overlap). Roden: main's knap-forstørrelse (#290-295) blev
tilsyneladende kun genverificeret på deres daværende, mindre knap-
størrelse, ikke genkørt efter den efterfølgende 50%-forstørrelse. Rettet
ved at flytte knap-wrapperens `top` fra 46% til 48% — genskaber en positiv
margin på tværs af iPhone SE/13/14 Pro Max/Pixel 5, verificeret
programmatisk (`getBoundingClientRect()`-mellemrum > 0 på alle fire) og
visuelt (ingen synlig overlap i skærmbilleder).

**Verifikation:** `npm run build` grøn (bekræftede at `scan-hero-bg.webp`
er tilbage i `dist/assets/`), `npm run lint` ren, `npx vitest run` 103/103
grønne, mojibake-scan ren på alle ændrede filer.

---

## 24. sept. 2026 — opfølgning på mergen: "for stor", "pulserer ikke", "beskåret"

Brugeren delte et skærmbillede af den live, mergede app (fra en rigtig
telefon, status bar viste "23.21", "God nat, Bjørn") med tre klager: "Hvorfor
er knappen så stor og pulsere ikke, og hvorfor er baggrunden beskåret? Den
skal jo dække hele skærmen."

**Klage 1 — knappen for stor.** Den lige mergede kode havde genbrugt main's
`clamp(168px, 42cqh, 267px)`-størrelse (fra en tidligere, uafhængig "gør
knappen 50% større"-runde på main). Denne bruger havde ALDRIG bedt om den
forstørrelse — det var en anden sessions beslutning, arvet via merge-
reconcileringen uden at blive stillet spørgsmålstegn ved. Rettet ved at
sætte målene tilbage til de oprindelige `clamp(90px, 23cqh, 150px)` (ydre)
og tilsvarende mindre ikon/tekst/gap-mål, som var denne PR's egne,
brugerverificerede tal fra før mergen.

**Klage 2 — pulserer ikke.** Undersøgt grundigt før noget blev rettet, da
kode-gennemlæsning ikke viste noget åbenlyst galt: `.scan-cta-halo{animation:
scan-halo-pulse ...}` og knap-wrapperens `animation:"scanCtaBreathe ..."`
så begge korrekte ud, ingen dubletter eller CSS-specificitets-konflikter
fundet ved `grep` efter alle forekomster af klassenavnene. I stedet for at
gætte en kodeændring, blev det verificeret DIREKTE i den faktiske,
producerede app (ikke endnu en hånd-skrevet mimic-fil, som allerede havde
givet et falsk positivt tidligere samme dag): bygget med `npx vite build
--mode artifact-preview` (samme login-bypass-mode main's parallelle session
tilføjede til Artifact-preview-arbejdet), serveret lokalt med `npx vite
preview`, åbnet med Playwright, klikket "Se app uden login (preview)"-
knappen, og kørt `element.getAnimations()` på både halo- og knap-wrapper-
elementerne. Resultat: begge animationer rapporterede `playState:"running"`
— koden var og er korrekt. `window.matchMedia('(prefers-reduced-motion:
reduce)').matches` var også `false` i denne testomgivelse, så det er ikke
en global reduced-motion-indstilling der forklarer det HER — men kunne
stadig være årsagen på brugerens EGEN enhed, hvis de har "Reducér bevægelse"
slået til i tilgængelighedsindstillingerne (ville korrekt undertrykke
begge animationer, som designet — `@media (prefers-reduced-motion: reduce)`-
reglen i `theme.jsx` er bevidst, ikke en fejl). Anden sandsynlig forklaring:
et statisk skærmbillede kan i sagens natur ikke vise en pulserende
animation, uanset om den kører eller ej — brugerens beskrivelse kan sagtens
være en fortolkning af screenshottet snarere end en observation fra selve
den levende app. Tredje mulighed: PWA'ens service worker (se "Beta-
installation"-afsnittet i CLAUDE.md) havde ikke nået at hente den nyeste
deploy endnu på brugerens enhed. **Ingen kodeændring lavet for denne klage**
— hvis brugeren bekræfter problemet fortsætter efter en hård genindlæsning
OG bekræftet reduced-motion er slået fra, skal der graves videre.

**Klage 3 — baggrunden beskåret, skal dække hele skærmen.** Dette VAR en
reel arkitekturbegrænsning, ikke en misforståelse. Den daværende løsning
(en `<img>` direkte i `.home-hero-frame`, fra PR #307) var med vilje
begrænset til rummet MELLEM topbar og bundnav — samme `calc(100dvh -
143px)`-budget der giver hero-boksen sin robuste, definitive højde (se den
tidligere PR #287-hotfix-historik for hvorfor denne beregning eksisterer i
første omgang). Billedet kunne derfor ALDRIG nå kant-til-kant bag barerne
uden enten (a) en helt ny, uafprøvet fuldskærms-teknik, eller (b) en
tilbagevenden til den flex-fill-baserede højde-tilgang der allerede havde
forårsaget ét produktions-nedbrud tidligere denne session (se PR #287's
hotfix-historik ovenfor — indefinit-højde-kæde-fejlen). Ingen af delene var
ønskelige.

**Løsning:** genbrug main's EGEN, allerede-bevist fuldskærms-teknik i stedet
for at opfinde en ny. Main's app-brede baggrund (`.app-bg` i `theme.jsx`) er
allerede en `position:fixed;inset:0`-boks, uafhængig af `.screen`s eller
`.home-hero-frame`s højde-kæde, og topbar/bundnav har allerede frosted-
glass-`::before`-lag der lader den skinne igennem. Løsningen var derfor at
gøre `.app-bg`s BILLEDE betinget: en ny `.app-bg-scan`-modifier-klasse
(samme `background-size:cover`-teknik som `.app-bg` selv) overstyrer kun
`background-image`, slået til via en ekstra klasse i `App.jsx`
(`` `app-bg${screen === SCREENS.HOME ? " app-bg-scan" : ""}` ``) — ikke en
ny fixed-boks, ikke en ny højde-beregning, ingen af de kendte fejlklasser
denne session allerede har fundet og rettet to gange. `<img>`-tagget i
`.home-hero-frame` er fjernet helt; `.home-hero-frame` er nu en ren layout-
container for hilsen/knap/fod, uden eget visuelt indhold.

**Bevidst opgivet princip:** PR #307 havde en eksplicit designregel for
dette billede — "Vises ALTID i sin fulde helhed (height:100%, width:auto,
centreret) — aldrig beskåret, kun skaleret" — begrundet i billedets smalle
liggende format (941×1672, smallere end de fleste telefonskærme) og en
frygt for at beskære de to fødevare-kolonner i siderne. Denne regel er nu
OPGIVET til fordel for `background-size:cover` (som kan beskære sider på
ekstreme skærmforhold), fordi brugeren eksplicit prioriterede "dækker hele
skærmen" over "aldrig beskåret" i denne runde. Værd at holde øje med ved
fremtidige ændringer af dette billede — hvis beskæringen bliver for
aggressiv på bestemte enheder, er det den bevidste afvejning der viser sig,
ikke en ny bug.

**Genverificeret i den faktiske app (samme artifact-preview-opsætning som
klage 2):** `app-bg`-elementets `className` var `"app-bg app-bg-scan"` på
Scan-skærmen, dens `background-image` pegede korrekt på
`scan-hero-bg-*.webp`, og skærmbilledet viste billedet nu tydeligt
strækkende sig op bag topbaren (ingen længere synligt "to forskellige
baggrunde stødt sammen ved en kant"-effekt). Knap-størrelsen målt til
~112px bred (ned fra ~220px+), matcher den ønskede mindre størrelse.

**Verifikation:** `npm run build` grøn, `npm run lint` ren, `npx vitest run`
103/103 grønne, mojibake-scan ren på alle ændrede filer, plus den nye
artifact-preview-baserede live-verifikation beskrevet ovenfor (en mere
pålidelig metode end håndskrevne mimics, værd at genbruge fremover når en
skærm kræver visuel efterprøvning og en `--mode artifact-preview`-login-
bypass findes).

## Familie-siden gjort til en enkel husstands-oversigt, fase 2 — chips, ventende invitationer, dublet-sammenlægning (26. sept. 2026, samme dag som fase 1)

Fase 1 (samme dag, tidligere PR) fjernede madvare-baggrunden, "Aktive
profiler ved scanning" og det permanent udfoldede tilføj-/invitations-kort.
Denne opfølgende, langt mere omfattende runde byggede på et detaljeret,
16-punkts krav fra brugeren om at gøre selve familie-*funktionen* færdig,
ikke kun dens layout:

- **Scanningsrelevante chips for ALLE familiemedlemmer, ikke kun
  administrerede profiler.** Tidligere viste kun `family_members`-
  profilerne allergi-chips; rigtige husstandskonti (fra `/functions/v1/
  family/group`) viste slet ingen data ud over navn/konto-type. Rettet ved
  at udvide edge-functionens GET-handler til også at slå `user_allergens` +
  `users.diets`/`e_numbers` op for hver husstands-bruger og returnere dem i
  samme `{allergens, custom, diets, eNumbers}`-form som administrerede
  profiler allerede brugte — én fælles `buildMemberChips()`/
  `renderMemberChips()`-funktion i `ProfileScreen.jsx` bruges nu af begge
  rækketyper. Prioriteret rækkefølge (allergier/intolerancer → kost-
  præferencer → E-numre), capped ved 4 synlige chips + en klikbar "+N" der
  folder resten ud pr. række (lokal `expandedChipsFor`-liste af række-
  nøgler, ikke en ny formular eller navigation). Allergi-chips bruger den
  eksisterende `.tag`-klasse uændret; kostpræferencer fik en lysere,
  neutral grøn variant (`--green-selected-bg`/`--border`/`--ink2`) og
  E-numre en helt neutral variant (`--surface2`/`--border`/`--ink2`) — ingen
  nye farver, kun eksisterende tokens, bevidst adskilt fra allergi-farven så
  et E-nummer eller en kostpræference ikke kan forveksles med en allergi-
  advarsel.
- **Ventende invitationer vises nu direkte i familie-oversigten**, ikke kun
  inde i "Invitér med egen konto"-panelet mens man opretter den. Ny
  `pendingInvites`-state hentet fra `family_invites?invited_by=eq.<mig>&
  status=eq.pending` (tilladt af den allerede-eksisterende SELECT-policy),
  filtreret for reelt udløbne rækker client-side. Hver ventende invitation
  vises som en selvstændig række ("Invitation afventer" + udløbsdato) med
  "Kopiér invitationslink"/"Del igen"/"Annullér invitation" — den sidste
  genbruger den `family_invites_delete_own_pending`-RLS-policy, fase 1
  tilføjede. For at undgå at samme invitation vises BÅDE inde i det åbne
  opret-panel OG i hovedlisten samtidig, filtreres panelets egen
  `inviteId` fra hovedlistens visning, og panelets "Annuller"-header
  nulstiller nu panel-state og genindlæser listen i stedet for bare at
  lukke panelet.
- **"Opdater automatisk" ved accepteret invitation** — der findes ingen
  realtime-kanal for `family_invites`/husstanden (kun Indkøbslisten har en
  rå WebSocket-baseret Supabase Realtime-kanal, se `useShoppingList.js`).
  At bygge en ny kanal til en hændelse der sker sjældent (én gang pr.
  invitation) blev vurderet uforholdsmæssigt — løst i stedet med et let
  periodisk tjek (`setInterval`, 12 sek.) af husstand + ventende
  invitationer, men KUN mens man rent faktisk har Familie-fanen åben
  (ryddet op ved `screen`-skift), plus et øjeblikkeligt genhent ved hvert
  besøg på fanen (samme mønster som Historik-fanens allerede eksisterende
  auto-opdatering).
- **Undgå dubletter ved konto-tilknytning.** Ny `POST /functions/v1/
  family/link-profile`-endpoint (`supabase/functions/family/index.ts`):
  tager `{managed_member_id, target_user_id}`, verificerer at caller ejer
  den administrerede profil OG at target rent faktisk er en del af callers
  husstand (en accepteret invitation i begge retninger), overfører
  profilens allergener/kostpræferencer/E-numre til target-kontoen
  (overskriver `user_allergens` + `users.diets`/`e_numbers`) og sletter
  derefter den nu overflødige administrerede profil. Bevidst en EKSPLICIT,
  bruger-initieret handling — en lille "Kobl til en administreret profil"-
  link under hver husstandskonto man selv administrerer forbindelsen for
  (samme `canRemove`-afgrænsning som fjernelses-handlingen), der åbner en
  simpel liste af ens administrerede profiler at vælge imellem. Ingen
  automatisk navne-matching, som let kunne koble den forkerte profil sammen.
- **Ny undertekst** ("Alle i din familie — både profiler du administrerer,
  og personer med egen EatSafe-konto.") efter brugerens eksakte ordlyd.
- **Bevidst IKKE ændret:** `MemberForm`s knap bruger stadig `softDisabled`
  (dæmpet, men klikbar — viser valideringsfejl først efter forsøgt tryk) i
  stedet for et hårdt `disabled`-attribut, selvom kravspecifikationen bad
  om en decideret disabled knap. Dette er en bevidst, tidligere etableret,
  app-bred (inkl. onboarding trin 1) UX-beslutning dokumenteret direkte i
  `MemberForm.jsx`'s egne kommentarer — at ændre den ville også ændre
  onboarding, langt uden for denne opgaves egentlige scope ("genbrug
  præcis samme komponenter og logik som onboarding"). Automatisk scroll-
  til-fejl er af samme grund heller ikke tilføjet — onboarding selv har det
  ikke, kun den samme efter-forsøgt-tryk-besked som allerede findes.
  Granulær, brugeraktiveret deling af favoritter/indkøbslister (adskilt fra
  automatisk delte allergiprofiler) er heller ikke bygget — den eksisterende
  automatiske deling mellem ægte husstandskonti er allerede en bevidst,
  transparent (forklaret i `HelpModal.jsx` og Profil-fanens egen "Konti du
  deler ... med"-tekst), fungerende funktion; at gøre den til en per-
  funktion opt-in-indstilling er en selvstændig, større arkitekturændring
  uden for denne redesign-rundes scope, jf. "bevar al eksisterende
  funktionalitet, der allerede virker".

**Test:** `npm run build` grøn, `npx vitest run` 109/109 bestået, mojibake-
scan ren. Verificeret med Playwright mod realistiske mock-data: chip-
prioritering og -farver for begge rækketyper, "+N"-udfoldning, ventende
invitation med alle tre handlinger (kopiér/del igen/annullér — DELETE
bekræftet kaldt), og hele dublet-sammenlægningsflowet (vælger-liste →
korrekt `link-profile`-kald med de rigtige id'er → den administrerede
profil forsvinder fra listen). Selve `family`-edge-functionen er deployet
til produktion (version 16) — kunne ikke ende-til-ende-testes direkte (kun
via mock-data i frontend-testen), så den server-side logik hviler på
kode-gennemgang frem for en kørt integrationstest.

## Madpas redesignet og gjort reelt funktionsdygtigt (26. sept. 2026)

Et detaljeret, 12-punkts krav om at gøre Madpas "ekstremt hurtig at forstå
for restaurant- og butikspersonale" — en tjener i udlandet skal kunne
række telefonen tilbage og forstå de vigtigste kost-/allergioplysninger på
få sekunder. Dette var langt mere end en visuel opdatering; to reelle,
funktionelle huller blev fundet og rettet undervejs.

**Hovedside:**
- Madvare-baggrunden fjernet (samme `app-bg-hide`-mønster som List/
  Historik/Favoritter/Allergileksikon/Familie).
- Ny overskrift/undertekst efter brugerens eksakte ordlyd.
- Profilvælgeren ("VIS MADPAS FOR") vises nu KUN når `family.length > 0`
  — én profil (kun brugeren selv) viser sig direkte uden en vælger at
  klikke igennem.
- Den tidligere løse, fuldt udfoldede allergen-liste (med eksempelprodukter
  og -ingredienser, ret høj og tekst-tung) er erstattet af en kompakt
  "Dit madpas"-chip-oversigt — samme `.tag`-mønster som Familie-sidens
  scanningsrelevante chips (allergi=grøn, kost=lysere grøn/neutral
  `--green-selected-bg`, E-numre=helt neutral `--surface2`), ingen nye
  farver.

**Strukturerede sektioner (tjener-visning + PDF), i stedet for én generisk
"kan ikke spise"-liste:**
- `ALLERGENS[].type` ("allergi"/"intolerance", allerede i skemaet, men
  aldrig brugt til reel gruppering før) styrer opdelingen i FØDEVARE-
  ALLERGIER og INTOLERANCER. KOST og E-NUMRE er egne sektioner, kun vist
  når de reelt har indhold.
- Korte overskrifter ("Jeg er allergisk over for:"/"Jeg tåler ikke:") i
  stedet for den tidligere lange "Hej! Jeg har fødevareallergier og
  ønsker gerne din hjælp..."-intro og det lange "Tak for din hjælp — det
  betyder rigtig meget for mig"-outro på selve kortet — begge skubbede
  det egentlige budskab nedad. En kort sikkerheds-sætning
  ("Sørg venligst for, at min mad ikke indeholder nogen af disse.") er
  bevaret, men KUN under FØDEVAREALLERGIER, matcher brugerens eget
  eksempel præcist. Selve talefunktionen (Oplæs) beholder sin fulde,
  høflige formulering uændret — det er en anden modalitet (tale, ikke
  synligt scan-hastigheds-kritisk tekst), hvor en naturlig, høflig sætning
  ikke går ud over læsehastigheden.
- Tjener-visningen: stort flag (44px) + sprognavn øverst, meget stor
  fed allergen-tekst (26px), ingen dekorativ baggrund (ren `var(--paper)`),
  kun luk-knappen + den reelle Oplæs-funktion nederst — ingen anden chrome.
- Bundnavigation, hamburger-menu og Feedback-knappen er nu bogstaveligt
  fjernet fra DOM'en mens tjener-visningen er åben (`!madpasWaiterView`
  tilføjet til topbar-betingelsen i App.jsx), ikke kun visuelt dækket af
  et overlay — vigtigt for tastatur-/skærmlæser-navigation, ikke kun
  udseende.

**Reelt fund #1 — oversættelses-hul:** `ALLERGEN_T` (per-sprogs allergen-
navne) manglede `hvede` og `maelkeallergi` fuldstændigt. Uden en sprog-
nøgle faldt koden tilbage til `ALLERGENS`' egen DANSKE `a.label` — et
madpas sat til engelsk viste altså "Hvede" i stedet for "Wheat", mens
resten af UI'et var korrekt engelsk. Nøjagtig den fejlklasse opgaven
eksplicit bad om at undgå. Fundet ved at bygge en Playwright-test der
faktisk skiftede sprog og tjekkede allergen-teksten (ikke kun UI-
chrome-teksten) — ville være usynligt ved kun visuel gennemgang, samme
mønster som "feltnavne-mismatch"-lektionen fra tidligere i sessionen
(CLAUDE.md afsnit 5). Rettet ved at tilføje begge manglende nøgler (16
sprog hver) og indføre delte `madpasAllergenLabel()`/`madpasDietLabel()`-
hjælpefunktioner (useMadpas.js) der korrekt prioriterer
`lang==="da" ? a.label : ALLERGEN_T[...]` — brugt konsekvent i
MadpasScreen.jsx, useMadpas.js's tale-funktion, PDF-skabelonen og
public/madpas-view.html, i stedet for at hver kaldested gentager sin egen
faldback-kæde (den oprindelige kilde til buggen).

**Reelt fund #2 — det delte link virkede aldrig:** `shareUrl` var
`https://eatsafe.dk/madpas/[userId]` — men der var INGEN route/side der
overhovedet håndterede denne URL. `vercel.json` havde ingen rewrite for
`/madpas/*`, og App.jsx havde ingen `window.location.pathname`-baseret
routing for det (kun `?invite=`-query-parameteren er håndteret). En
tjener der scannede QR-koden eller åbnede linket landede altså bare på
EatSafes almindelige login-væg — hele "del dit madpas uden at modtageren
skal installere noget"-løftet var ikke-fungerende. Rettet med:
- Ny tabel `madpas_links` (id, user_id, profile_ref, lang, token, status,
  created_at) — RLS: kun ejeren kan SELECT/INSERT/UPDATE egen række.
- Ny SECURITY DEFINER-RPC `get_madpas_by_token(p_token)` (samme mønster
  som `get_invite_preview` for family_invites) — slår token op, tjekker
  `status='active'`, returnerer navn + allergener/kost/E-numre for enten
  brugeren selv eller den angivne administrerede profil. Verificeret
  callable af `anon`-rollen (`has_function_privilege`) og testet direkte
  via en midlertidig test-række (oprettet og slettet igen med det samme).
- Ny offentlig side `public/madpas-view.html` — samme selvstændige,
  build-fri vanilla-JS-mønster som `invite.html`. Indeholder en bevidst
  duplikeret delmængde af oversættelses-data (udtrukket programmatisk fra
  `src/constants.jsx` via et lille Node-script, ikke hånd-transskriberet,
  for at undgå kopiérings-fejl) — samme allerede-accepterede mønster som
  `src/allergenKeywords.js` vs. `supabase/functions/allergens/index.ts`.
  Siden har sin egen sprogvælger, så modtageren selv kan skifte sprog,
  uafhængigt af hvilket sprog afsenderen havde valgt (linkets `lang`-felt
  er kun en startværdi).
- `vercel.json` fik en ny rewrite: `/madpas/:token` → `/madpas-view.html`.
- App-siden opretter/henter automatisk et aktivt link pr. valgt profil
  (intet ekstra klik nødvendigt, bevarer den tidligere "virker med det
  samme"-oplevelse), og tilbyder nu reelle "Generér nyt link"/"Deaktiver
  link"-handlinger — begge sætter `status='revoked'` på den gamle række,
  hvorefter RPC'en øjeblikkeligt afviser det gamle token.
- Fjernet den dominerende rå URL-tekst fra både del-kortet og QR-popup'en
  (kun QR + Kopiér + Del tilbage), og ændret privatlivsteksten fra
  "Siden er offentlig tilgængelig via linket" til den mere præcise
  "Alle med linket kan se dette madpas. Linket er permanent, indtil du
  deaktiverer det."

**Oprydning:** fem bekræftet ubrugte `.mp-*`-CSS-klasser (`.mp-card`,
`.mp-allergen-pill`, `.mp-speak-btn`, `.mp-aa`, `.mp-family-row` — grep-
verificeret: refereret ingen steder i nogen `.jsx`-fil, kun defineret i
theme.jsx) slettet fra en tidligere Madpas-design-iteration.

**Test:** `npm run build` grøn, `npx vitest run` 109/109 bestået, mojibake-
scan ren på alle ændrede filer. Verificeret med fire separate Playwright-
gennemgange: (1) hovedskærm + sprogskift + den rettede dansk/engelsk-
allergenbug, (2) del-sektionen inkl. deaktiver/generér-nyt-link-roundtrip,
(3) tjener-visningens strukturerede sektioner + skjult navigation, (4) den
offentlige `madpas-view.html`-side selv (fundet+ikke-fundet-tilstand,
sprogskift) via en lokal `page.route`-simulering af Vercel-rewriten (Vite's
dev-server følger ikke `vercel.json`). RPC'en er desuden verificeret
direkte via SQL mod det rigtige projekt. Selve produktionsdeploy af
edge-function-ændringer var ikke nødvendigt denne gang — `madpas_links`/
`get_madpas_by_token` er ren database-side (tabel + RPC), ingen Edge
Function involveret.

## Madpas, opfølgende runde — korte fødevareeksempler, bevidst E-nummer-valg, en reel "dødt link"-bug fundet (26. sept. 2026, samme dag som Madpas-redesignet)

En ny, 20-punkts kravsliste byggede videre på Madpas-redesignet fra samme
dag — de fleste punkter var allerede opfyldt (struktur, sprog, QR-first
deling, deaktiver/generér nyt link, privatlivstekst), men tre reelle,
tidligere manglende stykker blev identificeret og bygget:

**1. Korte fødevareeksempler (afsnit 8-10 i kravet) var slet ikke med** —
den forrige redesign-runde havde bevidst fjernet den gamle
`ALLERGEN_EXAMPLES`-baserede eksempel-tekst for at forenkle, men denne
kravsliste bad eksplicit om den tilbage, blot kortere og tydeligere
mærket. Løst med en ny `madpasAllergenExamples(allergenId, lang)`-
hjælpefunktion (useMadpas.js) der kombinerer `products`+`ingredients` fra
`ALLERGEN_EXAMPLES` og capper ved 4 stk., samt et nyt, kort, oversat
"Fx:"/"Examples:"-label (`MADPAS_EXAMPLES_LABEL_T`, 17 sprog) — bevidst
generisk i stedet for en sætningsskabelon pr. allergen ("Common foods
containing X:"), så det forbliver kompakt og ensartet uanset om brugeren
har ét eller flere allergener (kravets eget eksempel viser begge former;
den generiske label dækker begge uden at skulle vedligeholde 17×16
sætningsvarianter). Vist under selve allergen-/intolerance-navnet i
tjener-visningen, PDF'en OG den offentlige `madpas-view.html`-side, altid
i en mindre, muted skriftstørrelse end selve allergenet (krav 9: "selve
allergenet skal altid være det mest fremtrædende element").

**Endnu et sprog-hul fundet i samme datasæt:** `ALLERGEN_EXAMPLES` manglede
`hvede`/`maelkeallergi` fuldstændigt — nøjagtig samme to id'er som
`ALLERGEN_T` manglede i den forrige runde. Tilføjet for alle 17 sprog
(products: Bread/Pasta/Pizza dough/Cakes for hvede osv., se
`src/constants.jsx`).

**2. E-numre skal kun vises ved bevidst valg (afsnit 2):** overvågede
E-numre er en scannings-indstilling (til at vurdere om et produkt er
sikkert), ikke automatisk noget en bruger ønsker at dele med en tjener. Ny
checkbox "Vis overvågede E-numre på madpasset" i MadpasScreen.jsx, default
FRA, persisteret i `localStorage` (samme mønster som `madpasLang`). Vigtigt
konsistens-fund undervejs: uden yderligere arbejde ville det DELTE link
stadig vise E-numre selvom appens egen visning skjulte dem — en reel
lækage. Løst ved at tilføje en `show_enumbers boolean`-kolonne til
`madpas_links` og opdatere `get_madpas_by_token()`-RPC'en til at nulstille
`eNumbers` til `[]` i sit svar når `show_enumbers=false`, uanset hvad der
faktisk står i databasen for profilen. Checkbox-tilstanden sendes nu med
til både `INSERT` (ny linkoprettelse) og `PATCH` (ved sprogskift, som i
forvejen patchede linket).

**3. Reel "dødt link vist som aktivt"-bug fundet og rettet:**
`regenerateLink()`'s oprindelige rækkefølge var: (a) revoke det gamle
token server-side, (b) opret et nyt, (c) opdatér UI-state — men UI-state
blev kun sat i `try`-blokkens success-gren. Fejlede skridt (b) (fx en
midlertidig netværksfejl), forblev `madpasLinkToken` i React-state
UÆNDRET og pegede stadig på det token, der LIGE var blevet revoked
server-side i skridt (a) — brugeren så altså en tilsyneladende "aktiv" QR-
kode/link, der reelt allerede var dødt. Fundet ved at bygge en Playwright-
test der bevidst tvang oprettelses-kaldet til at fejle (500) EFTER en
vellykket revoke, ikke kun ved at teste den lykkedes-sti — nøjagtig den
slags fejl-sti kravets eget punkt 14 ("et defekt link må ikke vises som
aktivt") advarer imod, og som ikke ville være fundet ved kun happy-path-
test. Rettet ved at nulstille `madpasLinkToken` til `null` STRAKS efter en
vellykket revoke, uafhængigt af om den efterfølgende oprettelse lykkes —
et evt. efterfølgende `catch` nulstiller det samme igen som en ekstra
sikkerhed. UI'et falder nu korrekt tilbage til den (i samme omgang
opgraderede) "Intet aktivt link"-tilstand med en tydelig fejlbesked og en
rigtig "Opret nyt link"-primærknap i stedet for den tidligere lille,
diskrete inline-tekstlink.

**Offentlig side (`public/madpas-view.html`) holdt i sync:** samme
`ALLERGEN_EXAMPLES`/`MADPAS_EXAMPLES_LABEL_T`-data (udtrukket
programmatisk via et lille Node-script, ikke hånd-transskriberet) og
samme eksempel-rendering tilføjet der — RPC'en håndterer allerede
`show_enumbers`-filtreringen server-side, så den offentlige side selv
ikke behøver kende til togglen, den viser blot hvad RPC'en returnerer.

**Test:** `npm run build` grøn, `npx vitest run` 109/109 bestået, mojibake-
scan ren. Verificeret med en udvidet Playwright-gennemgang: E-nummer-
togglens synlighed/adfærd + korrekt `PATCH`-kald med `show_enumbers`,
fødevareeksemplerne i tjener-visningen, og — vigtigst — en dedikeret test
af den fundne "dødt link"-fejlsti (tvunget oprettelses-fejl efter en
vellykket revoke), som bekræftede både buggen og rettelsen. Den offentlige
sides eksempel-visning verificeret separat med et screenshot.

## Madpas, tredje runde samme dag — "Færdiggør og polish", link/QR/PDF/E-numre fjernet igen (26. sept. 2026)

Samme dag som de to redesign-runder ovenfor gav brugeren en ny, detaljeret
spec med et modsatrettet krav i forhold til begge tidligere runder: **"Link-
og QR-funktionalitet skal være helt fjernet."** Madpas skulle "færdiggøres
og poleres" til udelukkende at være en on-device visning til at vise
allergier/intolerancer/kost for en tjener — ingen ekstern deling
overhovedet. Spec'en indeholdt desuden 13 nummererede krav (gruppering
uden E-numre, korte oversatte eksempler omdøbt fra "Fx:" til "Almindelige
eksempler:"/"Common examples:", singular/plural-sikkerhedslogik, fuld
oversættelse af ALT inkl. knaptekster, oplæsning med oversat knaptekst,
footer uden fremtrædende dato, konsistens med appens eksisterende
designsystem).

**Eneste tvetydighed, afklaret via `AskUserQuestion`:** spec'ens "behold"-
liste nævnte, i modsætning til begge tidligere runder, ikke "Gem som PDF/
Print" nogen steder, og den endelige flow-sætning endte ved "Oplæs ved
behov" uden et PDF-skridt. I stedet for at gætte blev brugeren spurgt
direkte: "Skal 'Gem som PDF/Print' også fjernes fra Madpas i denne runde?"
med to svarmuligheder (den anbefalede var "Behold PDF/Print"). **Brugeren
svarede "Fjern PDF/Print også"** — det endelige, afgørende svar, som
overstyrede min egen anbefaling.

**Fuld reversering af de to foregående runders delings-infrastruktur:**
- **Database:** `madpas_links`-tabellen og `get_madpas_by_token()`-RPC'en
  droppet helt via `mcp__Supabase__apply_migration` (migration
  `remove_madpas_link_sharing`: `drop function if exists
  public.get_madpas_by_token(text); drop table if exists
  public.madpas_links;`). Verificeret FØRST via `select count(*) from
  public.madpas_links;` → 0 rækker, altså ingen datatab ved dropet — samme
  "verificér før en destruktiv/irreversibel handling"-disciplin som
  projektet ellers følger.
- **`public/madpas-view.html`** (den selvstændige vanilla-JS offentlige
  side fra runde 1-2) slettet helt (`rm -f`).
- **`vercel.json`**: `/madpas/:token`-rewriten til den nu-slettede fil
  fjernet.
- **`MadpasScreen.jsx`**: omskrevet fuldt ud. Delings-sektion (QR/kopiér
  link/deaktiver/generér nyt link), `renderPrintDiv()`/PDF-knap, og
  E-numre-checkbox/-sektion fjernet. Ny `renderCompactPreview()` bygger en
  flad chip-liste (allergier+intolerancer+fritekst+kost) begrænset til
  `PREVIEW_LIMIT = 6` med en statisk "+N"-chip ved overløb — bevidst
  simplere end Familie-skærmens klik-til-udvid-mønster, da preview'et her
  kun er en opsummering, ikke hovedvisningen.
- **`useMadpas.js`**: `selectedENumbers`-parameteren og al E-numre-relateret
  oplæsningslogik fjernet fra `madpasSpeak()`. Ny `madpasSafetyNote(names,
  lang)`-hjælpefunktion (singular/plural-valg, se nedenfor).
- **`App.jsx`**: `mpENumbers`-beregningen og dens prop til `MadpasScreen`
  fjernet. Bekræftet via grep at den underliggende `selectedENumbers`-state
  fortsat lever og bruges uændret til selve produkt-scanningens allergen-
  matching (afsnit uden relation til Madpas) — kun Madpas-specifik
  wiring blev fjernet, ikke den app-brede E-numre-funktion.
- **Dødt-kode-oprydning fundet undervejs:** `madpasBig`/`setMadpasBig`
  var deklareret og trukket gennem props/return-værdier alle vegne, men
  aldrig faktisk læst/brugt i nogen JSX (bekræftet via
  `grep -rn "madpasBig|setMadpasBig" src/*.jsx src/*.js`) — fjernet helt
  fra useMadpas.js, App.jsx og MadpasScreen.jsx.

**Ny singular/plural-sikkerhedssætning (krav 7):** med kun ét allergen/
fritekst-emne i FOOD ALLERGIES-sektionen vises nu "Please make sure my
food does not contain wheat." (indsætter navnet direkte) i stedet for den
generiske plurale "...does not contain any of these ingredients." — aldrig
"any of these"-fraseologi ved kun én ting. `MADPAS_SAFETY_NOTE_SINGULAR_T`
(ny, 17 sprog, `{name}`-placeholder) og en omskrevet `MADPAS_SAFETY_NOTE_T`
(uændret betydning, men nu eksplicit dokumenteret som den PLURALE variant,
med "...ingredients." tilføjet i slutningen for klarhed) i constants.jsx.
Sproglig afvejning: for sprog med køns-/artikel-bøjning (tysk, fransk,
spansk, italiensk, portugisisk, polsk, samt arabisk/græsk af samme grund)
bruges en kolon-baseret "...indeholder ikke følgende: {navn}"-konstruktion
i stedet for direkte indsættelse af et vilkårligt substantiv, for at forblive
grammatisk sikker uden en fuld sætning-pr.-allergen-oversættelsesmatrix;
for sprog uden dette problem (dansk, engelsk, hollandsk, svensk, norsk,
japansk, kinesisk, thai, tyrkisk) indsættes navnet direkte, hvilket matcher
spec'ens egne eksempler ordret for dansk/engelsk.

**Øvrige krav:** `MADPAS_EXAMPLES_LABEL_T` omdøbt fra "Fx:"/"Examples:" til
fuldere "Almindelige eksempler:"/"Common examples:" (krav 6). Ny
`MADPAS_SPEAK_LABEL_T`/`MADPAS_STOP_LABEL_T` (17 sprog hver, fx
da:"Oplæs"/en:"Read aloud"/de:"Vorlesen", da:"Stop"/en:"Stop"/de:"Stopp")
— oplæsnings-knappens egen tekst følger nu også det valgte sprog (krav 8-9:
"ingen blandet-sprog madpas"). `MADPAS_SECTIONS_T`'s `enumbers`-nøgle
fjernet (ingen E-NUMBERS-sektion længere). Footeren i tjener-visningen
viser nu kun ordet "EatSafe" — ingen dato (krav 10).

**Mojibake fundet og rettet under selve editeringen (ikke i produktions-
kode, kun en ny kommentar):** en kommentarlinje kom til at indeholde et
korrupt "æ"-tegn (to Unicode replacement-tegn, U+FFFD, i stedet for "æ"
i `// Opl[U+FFFD][U+FFFD]s/Stop-knappens tekst...`) — fanget af
den rutinemæssige mojibake-scan (udvidet med et U+FFFD-tjek, ikke kun den
kyrilliske regex) umiddelbart efter
ændringen, rettet til `// Oplæs/Stop-knappens tekst...`, genscannet ren.

**Test:** `npm run build` grøn (MadpasScreen-bundlen faldt fra ~21KB til
~8.67KB, hvilket bekræfter den tilsigtede forenkling), `npx vitest run`
109/109 bestået, mojibake-scan ren. Verificeret med to Playwright-scripts:
`verify_madpas4.js` bekræftede at INTET netværkskald overhovedet rammer
`madpas_links`/RPC'en/`madpas-view` (mocket fetch faldt bevidst IKKE
gennem til disse endpoints, for at opdage det hvis appen stadig kaldte
dem), at delings-/PDF-/E-numre-UI er helt væk, at et kost-chip stadig vises
i preview'et, og at tjener-visningen med to allergier korrekt viser den
plurale sikkerhedssætning + "Common examples:"-label + den engelske
"Read aloud"-knap + en footer der udelukkende viser "EatSafe" (verificeret
via `page.evaluate` på selve span-elementets `textContent`, ikke kun en
`:visible`-check) + korrekt dansk fallback til "Hvede" efter sprogskift
tilbage til dansk. `verify_madpas_singular.js` bekræftede specifikt
singular-sagen: med kun ét allergen ("hvede"/Wheat) vises "Please make sure
my food does not contain wheat." og IKKE den plurale "any of these
ingredients"-fraseologi. Tre skærmbilleder (`mp4-main.png`,
`mp4-waiter-multi.png`, `mp4-waiter-singular.png`) inspiceret visuelt og
bekræftet rene, korrekt grupperede og letlæselige.

## Madpas, fjerde runde — finpolish af selve fremvisningen, uden at ændre strukturen (27. sept. 2026)

Dagen efter de tre foregående Madpas-runder gav brugeren en ny, meget
detaljeret 11-punkts spec med et eksplicit rammesæt: "Bevar det nuværende
visuelle design, farver, typografi og generelle stil. Lav ikke unødvendige
redesigns af resten af appen. Fokusér kun på Madpas-flowet." Kernepointen:
Madpas skal ikke kun omtales som en "tjener"-funktion — den bruges også i
butikker, hoteller, caféer og takeaway — og selve fremvisningsskærmen
skulle gøres endnu hurtigere at aflæse på 2-3 sekunder, uden at ændre den
overordnede FOOD ALLERGIES/INTOLERANCES/DIET-struktur fra runde 3.

**Forsiden:**
- Undertekst ændret fra en tjener-/butikspersonale-specifik sætning til
  den bredere "Vis dine allergier og kosthensyn på det lokale sprog."
- CTA-knappen omdøbt fra "Vis til tjener" til "Åbn madpas" (samme grønne
  styling/størrelse, uændret) — matcher den bredere brugssammenhæng.
- Ny toggle-sektion "KRYDSKONTAMINERING" tilføjet under sprogvælgeren (kun
  vist når brugeren har mindst ét hensyn registreret), genbruger nøjagtig
  samme toggle-switch-styling som `SettingsScreen.jsx`s push-tilladelse-
  toggle (grøn/grå baggrund + hvid cirkel der glider) — INGEN ny visuel
  stil opfundet, som eksplicit krævet.

**Fremvisningsskærmen (`renderStaffView()` i MadpasScreen.jsx, omdøbt fra
`renderWaiterView` — funktionen er ikke længere kun for tjenere):**
- **Hvert hensyn er nu sin egen informationsblok** (krav 6 — "må ikke blot
  blive vist som små chips ... vis hver allergi som sin egen tydelige
  informationsblok"), adskilt af whitespace (26px blok-margin) i stedet
  for de tidligere delte lister med skillelinjer mellem rækker.
- **Allergen-/emne-navnet er gjort betydeligt mere fremtrædende** (krav 3
  — "det mest visuelt fremtrædende element på siden"): fontSize øget fra
  26px til 32px, ikonet fra ca. 20px til 36px, "Common examples"- og
  sikkerhedstekst-linjerne indrykket til at flugte under navnet
  (`paddingLeft:50`) i stedet for at dele en fælles ikon-kolonne med
  navnet i en tættere række.
- **Sikkerhedsteksten genereres nu ALTID pr. enkelt emne**, aldrig som én
  kombineret sætning for flere (krav 4 — "Dette skal selvfølgelig
  genereres dynamisk for den konkrete allergi", med Milk/Egg/Wheat vist
  som tre selvstændige eksempler i specen, ikke én fælles sætning) — den
  tidligere singular/plural-logik fra runde 3 (`madpasSafetyNote(names,
  lang)` med et array) er derfor forenklet til `madpasSafetyNote(name,
  lang)` med ÉT navn, kaldt separat for hvert emne. Selve ordlyden er også
  gjort mere præcis: "...does not contain {name} or ingredients made from
  {name}." (var kun "...does not contain {name}.") — `MADPAS_SAFETY_NOTE_T`
  i constants.jsx omskrevet for alle 17 sprog, med `{name}` som kan
  forekomme flere gange i skabelonen (kolon-baseret sætningsopbygning
  brugt for sprog med køns-/artikel-bøjning: tysk/fransk/spansk/
  italiensk/portugisisk/polsk, direkte dobbelt-indsættelse for resten).
- **Ny, bevidst OPT-IN krydskontaminerings-advarsel** (krav 7): når
  brugeren selv har slået toggle'n til, vises ÉN kombineret sætning
  nederst i FOOD ALLERGIES-sektionen — singular ("...cross-contact with
  milk...") ved ét hensyn, plural ("...cross-contact with these
  allergens...") ved flere. Ny `madpasCrossContactNote(names, lang)` i
  useMadpas.js + `MADPAS_CROSS_CONTACT_SINGULAR_T`/`MADPAS_CROSS_
  CONTACT_PLURAL_T` (17 sprog hver) i constants.jsx — samme singular/
  plural-mønster som runde 3's nu-forladte gruppe-sikkerhedstekst, men
  anvendt her i stedet, da kravet eksplicit beder om præcis denne
  sondring ("ved flere allergener: 'these allergens'"). Persisteret i
  `localStorage` som `as_madpas_cross_contact`, default FRA — "Denne
  besked må ikke automatisk vises for alle brugere ... EatSafe må ikke
  automatisk antage alvorlighedsgraden af brugerens allergi" er efterlevet
  ved at gøre indstillingen 100% opt-in med en tekst der eksplicit beder
  brugeren selv vurdere relevansen ("Vurdér selv om det er relevant for
  din allergi"), i stedet for at EatSafe gætter ud fra allergenets type.
- **INTOLERANCES-sektionen fik samme prominente blok-layout** (ikon+navn+
  eksempler) som allergi-blokkene, men UDEN sikkerhedstekst/krydskontami-
  nering — matcher at kun ægte allergier er sikkerhedskritiske i denne
  forstand, ikke intolerancer.
- **Footeren viser nu INTET branding/dato længere** (krav 2 — "Fjern
  teksten EatSafe nederst til venstre. Den har ingen funktion på denne
  skærm") — kun selve oplæs-knappen er tilbage, og den er samtidig gjort
  stor og fuld-bredde (krav 8 — "den store Read aloud-knap fast nederst"),
  ikke længere en lille kompakt pille i højre side af en delt footer-række.

**Oplæsning (`madpasSpeak()` i useMadpas.js) omskrevet til at inkludere
selve sikkerhedsteksten** (krav 8: "Oplæsningen skal inkludere ... sikker-
hedsteksten ... krydskontamineringsteksten hvis aktiveret"): for hvert
ægte allergen tales navn + `madpasSafetyNote(name, lang)` (samme tekst som
vises på skærmen), efterfulgt af `madpasCrossContactNote()` hvis brugeren
har aktiveret indstillingen. Intolerancer nævnes samlet i én sætning uden
sikkerhedstekst (matcher den visuelle sondring). "Common examples" oplæses
bevidst IKKE — krav 8 tillader eksplicit at udelade dem, "hvis det gør
beskeden unødigt lang", og at fjerne dem gjorde den samlede oplæsning
mærkbart kortere og mere fokuseret.

**Ingen ændringer uden for Madpas-flowet** — krav 11 var eksplicit om ikke
at røre Scan/Historik/Indkøbsliste/Familiefunktion/Allergileksikon/
hovednavigation "medmindre det er teknisk nødvendigt for at understøtte
Madpas". Eneste fil rørt uden for `Madpas*.jsx`/`useMadpas.js`/
`constants.jsx` var `App.jsx`, og kun for den nye `madpasCrossContact`-
state (samme mønster som den eksisterende `madpasLang`-state) og dens
prop-videregivelse til `MadpasScreen` — ingen andre skærme påvirket.

**Test:** `npm run build` grøn, `npx vitest run` 109/109 bestået (ingen
eksisterende tests dækker Madpas direkte — bekræftet via grep før
ændringerne), mojibake-scan ren på alle fire ændrede filer. Verificeret
med Playwright på to viewport-størrelser: en 393×852-gennemgang med to
allergier (Wheat+Peanuts) + én intolerance (Lactose) + kost (Vegetarian)
bekræftede alle 11 krav visuelt (ingen "Vis til tjener"-tekst tilbage,
ingen "EatSafe" i footeren, ny undertekst, KRYDSKONTAMINERING-toggle,
per-emne sikkerhedstekst med "or ingredients made from X", den
kombinerede plurale krydskontamineringssætning efter aktivering af
toggle'n, stor "Read aloud"-knap, Wheat-navnets `fontSize` bekræftet
32px via `getComputedStyle`) — og en separat iPhone SE (375×667)-kontrol
med kun ét allergen bekræftede at hele blokken (navn+eksempler+
sikkerhedstekst) OG den store oplæs-knap er synlige uden scroll for det
mest almindelige tilfælde (1 hensyn), som krav 6 kræver ("uden unødvendig
scrolling, når der kun er 1-3 allergier").

## Madpas, femte runde — diæter fik samme type besked som allergier (27. sept. 2026)

Samme dag som runde 4 gav brugeren en kort, meget målrettet 8-punkts
opfølgning, eksplicit afgrænset til "kun følgende ændringer" — bevar
design og funktionalitet i øvrigt, "lav ingen andre redesigns eller
ændringer". Seks konkrete punkter (punkt 7-8 var "rør ikke oplæsning" og
"ingen andre ændringer"):

1. **Diæter må ikke kun vises som badges** — de skal have samme type
   korte, tydelige besked til personalet som allergier.
2. Eksempel givet for Vegan (engelsk): "I follow a vegan diet. Please make
   sure my food does not contain meat, fish, dairy, eggs or other
   animal-derived ingredients."
3. Overskriften "DIET" → "DIETARY REQUIREMENTS".
4. "Soy / Soya" må ikke vises samtidigt — brug det korrekte lokale navn.
5. Forkort krydskontaminerings-beskrivelsen til "Tilføj en advarsel om
   krydskontaminering til dit madpas."
6. Tilføj Whey til mælkens almindelige eksempler.

**Implementering:**
- **Diæt-beskeder (punkt 1-2):** ny `MADPAS_DIET_MESSAGE_T` i
  constants.jsx — én naturligt oversat besked pr. diæt (`vegan`,
  `vegetarian`, `pescetarian`, `gluten-free`, `keto`) × 17 sprog, ikke
  ord-for-ord-oversat. Bevidst SOFTERE ordlyd for keto ("limit"/"begræns"
  høj-kulhydrat-ingredienser) end for de øvrige ("does not contain"/
  "indeholder ikke") — keto er en præference, ikke en sikkerhedsrisiko på
  samme måde som en allergi eller et reelt kostkrav som veganisme/gluten-
  fri. Ny `madpasDietMessage(dietId, lang)`-hjælpefunktion i useMadpas.js
  (samme mønster som `madpasSafetyNote`). `renderStaffView()` i
  MadpasScreen.jsx: DIETARY REQUIREMENTS-sektionen skiftet fra en
  `.tags`-liste af pille-badges til samme blok-layout som allergi-/
  intolerance-sektionerne (navn i `itemName`-stilen, genbrugt fra
  allergi-blokkene, + beskeden i samme muted-men-fed stil som sikkerheds-
  teksten). Den kompakte forside-preview (`renderCompactPreview()`) er
  BEVIDST uændret — den viser fortsat diæter som korte chips, da brugerens
  krav eksplicit gjaldt "på fremvisningsskærmen", ikke forside-summary'et.
- **Overskrift (punkt 3):** `MADPAS_SECTIONS_T.diet` omskrevet fra
  "Diet"/"Kost"-stil til "Dietary requirements"/"Kosthensyn"-stil for
  alle 17 sprog (en naturlig oversættelse af begrebet, ikke en bogstavelig
  gengivelse i hvert sprog — fx dansk "Kosthensyn" i stedet for det mere
  akavede "Kostkrav").
- **Soja-navnet (punkt 4):** `ALLERGEN_T.soja.en.n` var "Soy / Soya" —
  to engelske varianter vist samtidig, forvirrende for personalet. Rettet
  til blot "Soya", som er den korrekte betegnelse for MADPAS_LANGUAGES'
  "en"-sprogvariant (flag 🇬🇧, `bcp:"en-GB"` — britisk engelsk bruger
  "soya", ikke "soy"). Kun selve allergen-NAVNET er rettet — eksempel-
  listerne (`ALLERGEN_EXAMPLES.soja`, fx "Soy sauce") er UÆNDREDE, da de
  ikke var en del af det rapporterede problem (et produktnavn som "soy
  sauce" er ikke det samme som allergenets eget navn optrædende i to
  varianter) og brugeren eksplicit bad om ingen andre ændringer.
- **Krydskontaminerings-tekst (punkt 5):** MadpasScreen.jsx's beskrivelses-
  linje under "KRYDSKONTAMINERING"-toggle'n forkortet fra "Tilføj en
  advarsel om krydskontaminering til madpasset. Vurdér selv om det er
  relevant for din allergi." til præcis den ordlyd brugeren gav: "Tilføj
  en advarsel om krydskontaminering til dit madpas."
- **Whey (punkt 6):** `ALLERGEN_EXAMPLES.maelkeallergi.ingredients`
  manglede "Whey"/"Valle" — men en simpel tilføjelse alene var ikke nok:
  `madpasAllergenExamples()` slicer den kombinerede products+ingredients-
  liste til de første 4 elementer, og `maelkeallergi.products` alene
  havde allerede præcis 4 elementer (Milk/Cream/Butter/Cheese), så et nyt
  5. element ville ALDRIG blive vist uden også at hæve selve grænsen.
  Løst ved at (a) tilføje "Valle"/"Whey" som FØRSTE element i
  `ingredients`-arrayet (alle 17 sprog, samme oversættelser som allerede
  fandtes for `laktose.ingredients`, genbrugt for konsistens) og (b) hæve
  slice-grænsen fra 4 til 5 i `madpasAllergenExamples()` — en lille,
  fælles ændring der også giver ét ekstra eksempel for øvrige allergener
  med mange nok produkter/ingredienser til at ramme grænsen (fx
  `laktose`s "Yoghurt", som tidligere blev skåret væk), en accepteret,
  minimal sideeffekt af den præcise rettelse punkt 6 krævede.

**Ingen andre ændringer** — verificeret ved at kun `constants.jsx`,
`useMadpas.js` og `MadpasScreen.jsx` er rørt, ingen andre skærme eller
`App.jsx` påvirket (i modsætning til runde 3-4, som begge også rørte
App.jsx for ny state).

**Test:** `npm run build` grøn, `npx vitest run` 109/109 bestået, mojibake-
scan ren på alle tre ændrede filer. Verificeret med Playwright (393×852,
profil med Milk+Soya-allergener og Vegan+Gluten-free-diæter): den
forkortede krydskontaminerings-tekst er synlig og den gamle længere
version væk, "Whey" er nu synlig i Milks eksempler, "Soy / Soya" er væk
og kun "Soya" vises, "DIETARY REQUIREMENTS" vises i stedet for "DIET",
og både Vegan- og Gluten-free-blokkene viser deres fulde, korrekte
besked-tekst (Vegan-teksten bekræftet ordret identisk med brugerens eget
eksempel). Skærmbillede inspiceret visuelt og bekræftet rent, med samme
blok-layout for diæter som allergier/intolerancer.

## Madpas, sjette runde — ren visuel/spacing-polish, IKKE shippet (27. sept. 2026)

Efter tre skærmbilleder af den live fremvisningsskærm (én af hovedsiden,
to af fremvisningsskærmen med Milk+Soya-allergener og en Vegan-diæt) gav
brugeren en meget omfattende, 15-punkts "sidste professionelle polish"-
spec — eksplicit afgrænset til "ingen redesigns, ingen nye features, kun
sidste professionelle polish", med et helt afsnit (punkt 14) der
opremsede ting der IKKE måtte tilføjes (QR-koder, links, ekstra cards,
nye indstillinger, ekstra knapper, tutorials, nye navigationselementer).

**Kritisk fund i de vedhæftede skærmbilleder (punkt 5):** to af de tre
billeder viste tekst der syntes at fortsætte ind under/bag den grønne
"Read aloud"-knap (fx "Please make sure my food does not contain meat,
fish..." klippet af lige ved knappens top, med et svagt, sløret gentaget
mønster synligt under selve knappen). Undersøgt: selve flexbox-strukturen
(overlayet er `display:flex;flex-direction:column`, med header/scroll-
område/footer som tre søskende-elementer, footeren `flexShrink:0`) burde
strukturelt set ALDRIG kunne overlappe — den slags layout kan ikke
matematisk producere overlap i en almindelig flexbox-kolonne. Mest
sandsynlige forklaring: et iOS-skærmbillede taget midt i en elastisk
scroll/"rubber-band"-bevægelse, som kan fange et bevægelsesudtværet
duplikat af indhold under en visuelt "fastholdt" bund-knap — IKKE en
reel, vedvarende layout-bug. Uanset årsag blev det behandlet som "kritisk"
per brugerens egen vurdering, og løst defensivt: scroll-områdets bund-
padding hævet fra 32px til 40px (mere luft til sidste linje), og
footerens bund-padding fik `env(safe-area-inset-bottom)` tilføjet (var
en fast 28px, kunne i teorien sidde for tæt på home indicator-området på
en notch-telefon — samme etablerede `calc(<n>px + env(safe-area-inset-
bottom))`-mønster som allerede bruges i `ProfileScreen.jsx`/`theme.jsx`s
bundnav/`ScannerScreen.jsx`/`KnowledgeScreen.jsx`, ikke en ny opfindelse).
Verificeret programmatisk (ikke kun visuelt): en Playwright-test der
scroller fremvisningsskærmens indre scroll-container HELT til
`scrollHeight` (5 allergener + 1 intolerance + 1 diæt, den tætteste
mulige indholdsmængde) og måler den værste overlap mellem ethvert
tekst-element og knappens top — resultat: `0px` overlap, i alle tilfælde.

**Spacing rundet til appens faste skala** (punkt 1) — `.claude/rules/
design-tokens.md`s skala (4/6/8/10/12/14/16/20/24/32px): `itemBlock`s
`marginBottom` 26→24px, `headline`s `marginBottom` 18→16px, krydskonta-
mineringsblokkens `marginTop` 18→20px, hjem-skærmens krydskontaminerings-
sektions `marginTop` 14→20px (mere adskillelse fra sprogvælgeren ovenfor)
og label-til-beskrivelse-afstand 2→4px.

**Typografisk hierarki finpudset** (punkt 2) — den statiske overskrifts-
sætning ("I am allergic to:"/"I am intolerant to:", tidligere 19px/700/
`--ink`) konkurrerede visuelt med både allergen-navnet (32px) OG selve
sikkerhedsteksten (15.5px/700), fordi den næsten havde samme vægt som
sidstnævnte. Nedtonet til 14px/600/`--ink2` — nu tydeligt en kontekst-
sætning, ikke indhold. Til gengæld er selve sikkerhedsteksten/diæt-
beskeden (prioritet #2 i brugerens eget hierarki) løftet fra `--ink2` til
`--ink` (mørkere), så den holder sin plads klart over "Common examples"
(uændret, fortsat tydeligt sekundær) uden at nå navnets vægt.

**Krydskontaminerings-advarslen gjort en anelse mere sekundær** (punkt 3)
— fontWeight 700→600, fontSize 15→14.5px på selve fremvisningsskærmens
advarselstekst (ikonet 18→17px for proportion) — stadig tydelig og orange,
men ikke længere lige så tungtvejende som de individuelle allergi-
sikkerhedstekster, som brugeren bad om ("gør advarslen tydelig, men lidt
mere sekundær end selve allergierne").

**Mikrointeraktioner/tryk-feedback** (punkt 9-10 og 12) — `.mp-big-btn`
("Åbn madpas") havde ingen `:active`-tryk-feedback, i modsætning til
stort set alle andre trykbare elementer i appen (den delte globale
`:active{transform:scale(.97)}`-liste i theme.jsx, se afsnit 5's egen
note om denne liste). Tilføjet til listen. Luk-knappen, oplæs-/stop-
knappen og krydskontaminerings-toggle'en var alle rene inline-styled
`<button>`-elementer uden mulighed for `:active`-pseudoklasser i React —
udtrukket til nye, minimale CSS-klasser (`.mp-close-btn`, `.mp-speak-btn`,
`.mp-cc-toggle`/`.mp-cc-toggle-knob`) UDELUKKENDE for at kunne give dem
samme tryk-feedback, ingen visuel ændring i sig selv (kun de state-
afhængige dele — farve, knap-positionen — er tilbage som inline style).
Ingen bounce-effekter eller store animationer tilføjet, som brugeren bad
om at undgå.

**Chips (punkt 4), visuel konsistens (punkt 11) og andre punkter vurderet
allerede opfyldt:** `.tag`/`.tags`-klassen (theme.jsx) er allerede én delt
klasse brugt app-bredt (ikke kun Madpas) — ensartet højde/padding/radius/
ikon-tekst-alignment er derfor automatisk givet af selve klasse-
delingen, og blev IKKE ændret, da en justering ville have påvirket alle
andre skærme der bruger samme chip (Familie, søgefiltre m.fl.) — uden for
denne rundes scope ("kun Madpas-flowet"). Radius/borders/shadows/
font-weights/farver var allerede CSS-variabel-baserede (`--r`, `--sh`,
`--border`, `--muted`, `--green` osv.) uden hardkodede afvigelser — ingen
inkonsistens fundet at rette.

**Lange oversættelser/ingen faste højder (punkt 7-8):** ingen fast
`height`/`max-height` findes noget sted i MadpasScreen.jsx's tekst-
containere (kun ikoner/toggle-knap har faste, bevidste pixel-mål) — alle
tekstblokke er allerede auto-height. Verificeret med Playwright: tysk
oversættelse (kendt for længere sætninger end engelsk) på den mindste
understøttede skærmstørrelse (iPhone SE, 375×667) viste ingen horisontal
overflow og intet ødelagt linjeskift.

**Fundet, men bevidst IKKE rettet — uden for denne rundes scope:** tyske
substantiver i sikkerhedsteksten ("milch", "erdnüsse") vises med lille
forbogstav, fordi `madpasSafetyNote()` altid kalder `.toLowerCase()` på
det indsatte navn — grammatisk ukorrekt på tysk, hvor substantiver skal
have stort forbogstav. Denne rundes spec var eksplicit afgrænset til
spacing/hierarki/scroll/safe-areas/mikrointeraktioner, ikke sprogfejl —
notér til en fremtidig oversættelses-fokuseret runde i stedet for at
rette det på eget initiativ nu.

**IKKE pushet/PR'et/merget** — dette er en ren visuel/spacing-ændring
(ingen data- eller funktionsændring), og falder derfor under den stående
Vercel-kvote-regel i afsnit 4: "push/merge til Vercel KUN ved funktions-
og dataændringer, ALDRIG ved rene design-/visuelle ændringer." Committet
lokalt på feature-branchen, verificeret via Playwright i stedet for en
rigtig deploy.

**Test:** `npm run build` grøn, `npx vitest run` 109/109 bestået, mojibake-
scan ren på begge ændrede filer (MadpasScreen.jsx, theme.jsx). Verificeret
med tre separate Playwright-scenarier: (1) 5 allergener + 1 intolerance +
1 diæt scrollet helt til `scrollHeight` — 0px overlap mellem sidste
tekstlinje og Read aloud-knappen, (2) tysk oversættelse på iPhone SE — ingen
horisontal overflow, (3) programmatisk CSS-regel-tjek der bekræftede at
alle fire nye/opdaterede knap-klasser (`.mp-big-btn`, `.mp-close-btn`,
`.mp-speak-btn`, `.mp-cc-toggle`) reelt har `:active`-tryk-feedback
registreret. Hjemmeskærmens krydskontaminerings-toggle inspiceret visuelt
efter klasse-omlægningen og bekræftet uændret funktion/udseende (kun ny
tryk-feedback tilføjet).

**Opfølgning samme dag:** brugeren bad om at pushe runde 6 alligevel med
det enkelte ord "Push", på trods af at runden var en ren design-ændring
(hvor den stående regel normalt siger "push ikke"). Behandlet som en
eksplicit override af reglen (reglen forhindrer AT Claude selv initierer
et push for design-ændringer uden at spørge, ikke at brugeren aktivt kan
bede om det) — pushet, PR #346 oprettet, mergt, branch resynket som
normalt.

## Madpas, syvende runde — fire præcise afstandsjusteringer på selve forsiden (27. sept. 2026)

Umiddelbart efter runde 6 (og dens push) gav brugeren en kort, meget
præcis opfølgning med fire konkrete afstands-klager på selve Madpas-
forsiden (ikke fremvisningsskærmen denne gang) — hver med et angivet
pixel-interval, plus et eksplicit "spred ikke hele siden ud, målet er at
den stadig føles kompakt, men ikke sammenpresset":

1. Afstand efter sprog-dropdownen før KRYDSKONTAMINERING: +8–12px.
2. Krydskontaminerings-hjælpetekstens linjehøjde: lidt mere (to linjer
   virkede klemte).
3. Afstand mellem krydskontamineringssektionen og "DIT MADPAS": +12–16px.
4. Afstand mellem "DIT MADPAS" og chipsene: +8–10px.
5. Afstand mellem chipsene og "Åbn madpas": +16–20px.
6. Bevar CTA'ens størrelse og sidens bredder.

**Fundet ved undersøgelse af den faktiske gengivne afstand (ikke kun
kildekoden) — to af de fire var reelt SLET INGEN margin, ikke bare for
lidt:** CSS-margin-collapsing mellem tilstødende block-elementer betyder
at to marginer ikke lægges sammen, men tager den STØRSTE af de to — så
en `marginBottom` på ét element og en `marginTop` på det næste "spiser"
hinanden i stedet for at adderes. Konkret:
- Sprog-dropdownens egen `margin-bottom:16px` (CSS-klassen
  `.mp-lang-dropdown`/`.mp-lang-list`) og KRYDSKONTAMINERING-sektionens
  daværende `marginTop:20` COLLAPSEDE til blot `max(16,20)=20px` — ikke
  36px, som en naiv sum ville antyde.
- KRYDSKONTAMINERING-sektionen (sidste element i `.mp-head`, som har
  `padding:20px 20px 0` — altså PRÆCIS 0 bund-padding) havde INGEN
  `marginBottom` overhovedet, og var samtidig separeret fra "Dit
  madpas"-sektionen (en sibling-div uden egen `marginTop`) — den reelle
  gengivne afstand her var derfor bekræftet 0px, ikke "for lidt", før
  denne runde. Uden `.mp-head`s bund-padding var netop 0 kunne dette
  IKKE opdages ved kun at læse kildekoden — verificeret direkte med
  `getBoundingClientRect()` i en Playwright-test.

**Rettelser (alle som lokale inline-style-overrides, IKKE i de delte
`.mp-section-lbl`/`UI.mb14`-klasser** — begge bruges bredt andre steder i
appen, fx `.mp-section-lbl` på "VÆLG SPROG"/"VIS MADPAS FOR" og
`UI.mb14` på adskillige andre skærme, så en ændring i selve klassen ville
have spredt sig uden for Madpas):
- KRYDSKONTAMINERING-sektionens `marginTop` 20→32 — det collapsede
  resultat blev dermed `max(16,32)=32px` (+12px, øvre ende af det ønskede
  interval).
- KRYDSKONTAMINERING-hjælpetekstens `lineHeight` 1.4→1.6.
- KRYDSKONTAMINERING-sektionen fik en NY `marginBottom:16` (var 0) — det
  collapsede resultat med "Dit madpas"-sektionens manglende `marginTop`
  blev `max(16,0)=16px` (øvre ende af det ønskede 12-16px-interval).
- "Dit madpas"-labellens egen `marginBottom` (var 8px fra den delte
  `.mp-section-lbl`-klasse) fik et lokalt override til 16px (+8px, nedre
  ende af det ønskede 8-10px-interval).
- Hele "Dit madpas"-sektionens wrapper-`marginBottom` (var 14px fra den
  delte `UI.mb14`) erstattet med et lokalt `marginBottom:32` (+18px,
  midt i det ønskede 16-20px-interval) — gapet til selve CTA-knappen.
- Alle nye værdier er på appens faste spacing-skala (4/6/8/10/12/14/16/
  20/24/32px).

**CTA-knappens egen størrelse og sidens bredder er 100% urørt** — kun
`marginTop`/`marginBottom`/`lineHeight`-værdier er ændret, ingen padding,
font-size eller bredde-egenskaber.

**Test:** `npm run build` grøn, `npx vitest run` 109/109 bestået,
mojibake-scan ren. Verificeret programmatisk (ikke kun visuelt) med en
Playwright-test der måler `getBoundingClientRect()` for alle fire
afstande efter ændringen: sprog→KRYDSKONTAMINERING 32px,
KRYDSKONTAMINERING→"Dit madpas" 16px, "Dit madpas"-label→chips 16px,
chips→CTA 32px — alle nøjagtigt de forventede, collapse-korrigerede
værdier. `getComputedStyle()` bekræftede hjælpetekstens `line-height:
18.4px` (11.5px × 1.6) og CTA-knappens uændrede `padding:16px`.
Skærmbillede inspiceret visuelt — hver sektion fremstår nu som en tydelig
gruppe, siden virker stadig kompakt, ikke spredt ud.

## Madpas, ottende runde — reelt venstre-alignment-fund, ét-linjes rettelse (27. sept. 2026)

Umiddelbart efter runde 7 gav brugeren en ny, meget præcis spec: "Ret kun
alignment og margins ... ingen redesign og ingen ændringer af
funktionalitet eller tekst." Brugeren havde observeret "en visuel
inkonsistens i venstrestillingen" og bad specifikt om at kontrollere at
"DIT MADPAS og chippen/chipsene under ikke står længere til venstre end
resten af indholdet" — en meget konkret, allerede-diagnosticeret
mistanke, ikke bare en generel "tjek layoutet"-anmodning.

**Fundet: brugerens mistanke var korrekt, og årsagen var en reel bug, ikke
indbildning.** `.mp-scroll` (theme.jsx) giver `padding:0 20px 120px` —
20px venstre/højre-padding til ALT sit indhold. Men `.mp-head` (kun
brugt i MadpasScreen.jsx til at wrappe titel/undertekst/"VIS MADPAS FOR"/
"VÆLG SPROG"/"KRYDSKONTAMINERING" — INGEN andre skærme bruger denne
klasse) havde SIN EGEN ekstra `padding:20px 20px 0` oveni. Da `.mp-head`
er et barn af `.mp-scroll`, blev de to venstre-paddings adderet:
20+20=40px for alt indhold INDE i `.mp-head`. Men "Dit madpas"/chips/
CTA-knappen (`renderMainContent()`) renderes SOM EN SØSKENDE-DIV til
`.mp-head`, ikke som et barn af den — den fik derfor kun `.mp-scroll`s
egne 20px. Resultat: chips/CTA-knappen sad bekræftet 20px længere til
venstre end titel/undertekst/sektionsoverskrifter — nøjagtig den
inkonsistens brugeren havde observeret og navngivet specifikt.

**Rettelse:** ét CSS-linje-skift i theme.jsx —
`.mp-head{padding:20px 20px 0;}` → `.mp-head{padding:20px 0 0;}` (kun
venstre/højre fjernet; top-paddingen, som giver luft ned fra topbaren, er
urørt, ligesom al anden spacing/farve/typografi/funktionalitet). Da
`.mp-head` udelukkende bruges i MadpasScreen.jsx, påvirker denne
rettelse ingen andre skærme i appen.

**Bivirkning, eksplicit forudset af brugerens eget krav 3** ("Bevar
dropdownens og CTA-knappens nuværende bredde, men kontrollér at deres
indre content alignment harmonerer"): sprog-dropdownen/-listen (tidligere
indsnævret af den doble padding til kun `.mp-scroll`s bredde minus 40px i
alt) er nu lige så bred som CTA-knappen (begge fylder nu den samme,
fælles 20px-indrammede indholds-kolonne) — de to elementer havde reelt
FORSKELLIG bredde før denne rettelse, hvilket var en del af den samme
underliggende bug, ikke en ekstra ændring ud over det brugeren bad om.

**Test:** `npm run build` grøn, `npx vitest run` 109/109 bestået,
mojibake-scan ren. Verificeret programmatisk med Playwright — målte
`getBoundingClientRect().left` for otte elementer (titel, undertekst,
"VÆLG SPROG"-label, sprog-dropdown, "KRYDSKONTAMINERING"-label,
krydskontaminerings-hjælpetekst, "Dit madpas"-label, første chip, CTA-
knap): ALLE otte returnerede nøjagtig `20px` fra viewportets venstre
kant, ingen undtagelser. Skærmbillede inspiceret visuelt og bekræftet en
ren, konsekvent venstreflugt på tværs af hele siden.

## Profil og redigering restruktureret — "Rediger profil" og "Rediger præferencer" adskilt (28. sept. 2026)

Brugeren gav en stor, detaljeret 10-punkts spec med et klart mål: fjerne
en reel, observérbar dublering på Profil-siden — BÅDE "Rediger" ved
navn/profilkortet OG "Rediger" ved "Mine præferencer" førte til NØJAGTIG
samme skærm (`SCREENS.EDITPROFILE`), som samtidig blandede personlige
konto-oplysninger sammen med allergi-/diæt-/E-nummer-redigering i én lang
formular. Eksplicit ramme: "Bevar EatSafes nuværende visuelle design ...
Fokusér kun på informationsarkitektur, navigation og genbrug af
eksisterende onboarding-komponenter", "Ingen feature creep. Ingen
redesigns."

**Undersøgelse først, ingen kode skrevet før hele billedet var klart:**
- `ProfileScreen.jsx`s daværende `SCREENS.EDITPROFILE`-blok (linje
  ~947-1123) viste sig ved læsning at være PRÆCIS den beskrevne dublering:
  navn/telefon/alder/køn + Diæt + "Mine allergier/intolerancer" + E-numre
  der undgås, alt sammen i én formular, med sin egen, selvstændige,
  hånd-rullede allergi-/E-nummer-UI (RØD som valgt-farve — en reel,
  pre-eksisterende inkonsistens, da appens designsystem reserverer rød
  til "produkt indeholder allergen"/fejl, ikke en valgt-tilstand).
- `AllergenPicker.jsx` viste sig allerede at indeholde PRÆCIS de delte,
  genbrugelige komponenter brugerens krav 3 og 6 bad om at genbruge:
  `AllergenChipPicker`, `DietChipPicker`, `ENumberPicker` — rene,
  præsentations-komponenter med en simpel `{selected, onChange}`-kontrakt,
  allerede brugt af BÅDE onboarding OG `MemberForm.jsx` (familiemedlem-
  redigering). `MemberForm.jsx` viste sig samtidig allerede at være et
  levende eksempel på PRÆCIS den arkitektur brugeren bad om for "Rediger
  præferencer": samme delte komponenter samlet på ÉN side uden et trin-
  for-trin-flow (kun en foldbar `Accordion` til E-numre) — ikke noget der
  skulle opfindes fra bunden, kun en variant af et allerede eksisterende,
  bevist mønster.
- Et reelt duplikerings-fund undervejs: den samme gluten↔glutenfri-auto-
  synkroniserings-effekt (vælges "Gluten", markeres "Glutenfri" automatisk)
  fandtes som to næsten-identiske kopier — én i `OnboardingScreen.jsx`
  (opererende på `user.diets`/`setUser`) og én i `MemberForm.jsx`
  (opererende på lokale `diets`/`setDiets`-props). At bygge en tredje,
  ligeledes duplikeret kopi til "Rediger præferencer" ville have været
  nøjagtig den anti-mønster brugerens krav 3 eksplicit bad om at undgå
  ("Ændres en valgmulighed ét sted i kodebasen, skal ændringen slå
  igennem både i onboarding og redigering") — udtrukket i stedet til én
  delt `useGlutenFreeSync(allergens, diets, setDiets)`-hook i
  `AllergenPicker.jsx`, og både `OnboardingScreen.jsx` og `MemberForm.jsx`
  omskrevet til at kalde den fælles hook i stedet for deres egen kopi
  (identisk logik/adfærd, kun konsolideret til ét sted). Dette er den
  eneste ændring i eksisterende, IKKE-Profil-relaterede filer denne runde
  lavede — direkte nødvendiggjort af krav 3, ikke en tilfældig ekstra
  ændring.
- `birth_year`/`gender`-felterne blev grundigt undersøgt for reel brug
  (krav 1: "Alder og køn skal kun vises, hvis EatSafe konkret bruger
  oplysningerne til en funktion") — grep på tværs af hele kodebasen viste
  at de KUN bruges til visning (familie-rækkens "34 år · Mand"-tekst,
  adminpanelets brugerdetalje-visning), aldrig til nogen reel allergen-
  matchings-, filtrerings- eller anbefalingslogik. Bekræftet fjernbare
  efter denne definition.
- Bottom-nav-overlap-bekymringen (krav 8: "aldrig dækkes af bundnavigation")
  viste sig allerede løst app-bredt: den delte `.screen`-CSS-klasse
  (theme.jsx) reserverer allerede 110px bund-padding for den faste
  bundnav, og de nye/eksisterende redigeringsskærme bruger begge samme
  `className="screen fade-in"` — ingen ekstra arbejde nødvendigt for at
  opfylde dette krav, det var allerede en etableret, app-bred garanti.

**Ny arkitektur:**
1. **`SCREENS.EDITPREFERENCES`** tilføjet til `constants.jsx`, wired ind i
   `App.jsx` de samme tre steder `SCREENS.EDITPROFILE` allerede var
   registreret (Profil-skærmgruppen der renderer `ProfileScreen`, Android-
   tilbageknap-målet, hamburger-menuens aktiv-indikator-prik).
2. **`SCREENS.EDITPROFILE`** ("Rediger profil") skåret ned til KUN Navn
   (obligatorisk, uændret validering) + Telefon (valgfri) — alder/køn/
   diæt/allergier/E-numre fjernet helt. Gem-knappen PATCHer nu kun
   `{name, phone}` til `users`-tabellen (var tidligere hele objektet
   inkl. birth_year/gender/diets/e_numbers).
3. **`SCREENS.EDITPREFERENCES`** (ny) — `AllergenChipPicker` (med samme
   "Skriv selv"-fritekstblok som MemberForm, ordret samme markup) +
   `DietChipPicker` (med `useGlutenFreeSync`s `autoNote`) + `ENumberPicker`
   i en `Accordion` (lukket som standard, samme mønster som MemberForm).
   Alle tre får den SAMME state som Profil-sidens egen oversigt allerede
   viser (`allergens`/`customAllerg`/`user.diets`/`selectedENumbers`) —
   eksisterende valg er derfor automatisk forudmarkeret, ingen ekstra
   synkroniseringskode nødvendig. Gem-knappen PATCHer `{diets, e_numbers}`
   til `users` + gør samme DELETE-og-bulk-POST til `user_allergens` som
   den gamle kombinerede formular allerede gjorde (uændret persisterings-
   mønster, blot opdelt på de to nye skærme efter hvad de hver især ejer).
4. **To "Rediger"-knapper på Profil peger nu på hver sin skærm**:
   profilkortets på `EDITPROFILE`, "Mine præferencer"s (og dens tomme-
   state "Tilføj allergener"-knap) på `EDITPREFERENCES` — aldrig længere
   samme mål.
5. **"Min husstand" erstattet af én kompakt, klikbar række** ("Husstand" +
   `family.length + household.length` medlemmer + chevron →
   `setScreen(SCREENS.FAMILY)`) — ingen medlem-chips/administration
   tilbage på Profil-siden selv, kun en genvej til den allerede
   eksisterende, fulde Familie-side.
6. Dødt-kode-oprydning som direkte konsekvens af at fjerne den gamle
   hånd-rullede E-nummer-UI: `eSearch`/`setESearch`/`eCategory`/
   `setECategory` var kun brugt af den nu-slettede blok — fjernet fra
   `ProfileScreen.jsx`s destrukturering af `useAllergenPrefsContext()`
   (selve konteksten er urørt, bruges stadig andre steder). `E_NUMBERS`/
   `E_CATEGORIES`-importen blev samtidig overflødig og fjernet.
   `allergenSubtypes`/`activeSubtypeModal` var allerede ubrugte FØR denne
   runde (ikke noget denne ændring skabte) — ladet urørt, uden for scope.

**Test:** `npm run build` grøn, `npx vitest run` 109/109 bestået, mojibake-
scan ren på alle syv ændrede filer (`ProfileScreen.jsx`, `AllergenPicker.jsx`,
`OnboardingScreen.jsx`, `MemberForm.jsx`, `constants.jsx`, `App.jsx`,
`utils.jsx`). Verificeret med en omfattende Playwright-gennemgang (mock
Supabase-respons for en bruger med eksisterende Mælk-allergi, Nikkel-
intolerance, Vegetarisk diæt og E211): Profil-siden viser den nye,
kompakte Husstand-række (ikke længere "Min husstand" med chips), "Rediger
profil" viser KUN navn/telefon (alder/køn/diæt/allergi/E-numre-sektioner
alle bekræftet fraværende), gem PATCHer korrekt kun `{name, phone}`,
"Rediger præferencer" viser AllergenChipPicker med Mælk korrekt
forudmarkeret i den RIGTIGE grønne valgt-state (ikke rød), DietChipPicker
med Vegetarisk forudmarkeret, E-numre-accordion tilstede, et testklik på
"Gluten" udløste korrekt den automatiske Glutenfri-markering + "Valgt ud
fra gluten"-noten, gem POST'ede korrekt hele den opdaterede allergen-liste
inkl. gluten og PATCHede kun `{diets, e_numbers}`, og Profil-sidens egen
oversigt viste øjeblikkeligt de nye valg efter navigation tilbage — uden
en separat genindlæsning. Husstand-rækken blev klikket og bekræftet at
åbne den eksisterende Familie-side. Ingen konsol-fejl i noget trin.

## Profil, sidste oprydningsrunde — "Din aktivitet" trimmet, Gluten/Glutenfri forklaret (28. sept. 2026)

Umiddelbart efter forrige runde bekræftede brugeren eksplicit at den nye
struktur/navigation var korrekt ("Bevar den nuværende nye struktur og
navigation præcis som nu"), og gav en kort, syv-punkts "final cleanup"-
liste — ren finpudsning, ingen nye ændringer i struktur eller
navigation.

**1-3. "Din aktivitet" (GamificationCard) trimmet til et rent 2×2-grid:**
`familyActive`-metricen (badge "Familie aktive", talte `activeProfiles`
minus "me"/"user") er fjernet — begrundelsen var eksplicit at Husstand nu
har sin egen tydelige genvej på Profil-siden (fra forrige runde), så et
separat aktivitets-tal for det samme koncept var overflødigt. Med kun 4
metrics tilbage (Dage i træk/Scanninger i alt/Advarsler fanget/Sikre
opdagelser) bliver det 2-kolonne-gridet automatisk et rent 2×2 uden
yderligere layoutarbejde. "Dages streak" omdøbt til "Dage i træk"
(krav 3). Komponentens `family`/`activeProfiles`-props er fjernet fra
funktionssignaturen OG fra selve kaldsstedet i Profil-JSX'en, da de nu var
fuldstændig ubrugte — ren, direkte konsekvens af at fjerne metricen, ikke
en selvstændig oprydning ud over scope.

**4. Redundant streak-tekst reduceret (krav 4):** header-undertekstens
"Streak · Scanninger · Opdagelser" er ændret til "Scanninger ·
Opdagelser" — "Streak" var den tredje omtale af samme koncept (efter
"X dage!"-badgen og selve "Dage i træk"-feltet), og brugeren bad
eksplicit om at undgå at kommunikere streak "unødvendigt mange steder".
Progressbaren ("Ugentlig streak", 7-dages-indikatoren) og "X dage!"-
badgen (vist ved streak ≥3) er UDTRYKKELIGT bevaret uændret, som krav 4
bad om — kun den ekstra, redundante undertekst-omtale er fjernet.

**5. Blå venstre-accentkant fjernet, ingen erstatning (krav 5):**
`borderLeft:"2px solid var(--blue)"` fjernet fra kortets container-style.
Kortet er nu lige så fladt som fx den nye Husstand-række fra forrige
runde (samme delte `UI.ubgsurface_bd1pxsolid_br14_p14px16px_mb10`-stil,
ingen per-instance override) — bekræftet programmatisk at kortets
venstre-kant nu matcher den almindelige, neutrale kant-farve
(`rgba(21,32,26,.1)`, samme som appens `--border`-token), ikke længere
den blå accent.

**6-7. Gluten vs. Glutenfri-forholdet forklaret via det eksisterende
info-ikon (krav 6):** `ALLERGENS`-listens "gluten"-post (`constants.jsx`)
havde allerede et `note`-felt og et info-ikon (ⓘ) i `AllergenChipPicker`
(viser noten som en `showToast(a.note,"info")` ved tryk) — men noten
forklarede kun forskellen mellem cøliaki/glutenfølsomhed og hvedeallergi,
IKKE forholdet til kostpræferencen "Glutenfri". Brugeren havde ret i at
dette kunne være forvirrende: appen har allerede en `useGlutenFreeSync()`-
hook (indført i forrige Profil-runde) der automatisk tilføjer "Glutenfri"
til kostpræferencerne når "Gluten" vælges som intolerance — men uden en
forklaring kunne en bruger tro de selv skulle vælge BEGGE manuelt for at
være dækket. Noten er udvidet (samme felt, samme info-ikon, ingen ny UI)
til: "Gluten (intolerance) og Glutenfri (kost) er koblet sammen — vælger
du Gluten, tilføjes Glutenfri automatisk, så du ikke skal vælge begge.
Ikke det samme som hvedeallergi." — bevarer den oprindelige hvedeallergi-
distinktion, tilføjer den nye kobling-forklaring. Ingen ændring af
`DietChipPicker`s "Glutenfri"-kort selv (ingen info-ikon-mekanisme findes
der, og opgaven bad kun om at bevare/genbruge det EKSISTERENDE ikon på
Gluten-siden).

**Test:** `npm run build` grøn, `npx vitest run` 109/109 bestået,
mojibake-scan ren på begge ændrede filer (`ProfileScreen.jsx`,
`constants.jsx`). Verificeret med Playwright: "Familie aktive" bekræftet
væk, præcis 4 metric-felter tilbage (`Dage i træk`, `Scanninger i alt`,
`Advarsler fanget`, `Sikre opdagelser`), gammel "Dages streak"-tekst væk,
undertekst korrekt forkortet til "Scanninger · Opdagelser", progressbar
("Ugentlig streak") fortsat synlig, aktivitetskortets `border-left`
programmatisk bekræftet identisk med appens neutrale kant-farve (ikke
blå). Et testklik på Gluten-chippens info-ikon i "Rediger præferencer"
bekræftede at tooltip-teksten nu nævner både "Glutenfri" og "koblet" —
den nye forklaring vises korrekt. Ingen konsol-fejl.

## Profil, sidste polish-runde — footer-overlap rettet, "Ugentlig streak" omdøbt (28. sept. 2026)

Brugeren delte et skærmbillede af den live Profil-side (efter merge af PR
#350) der viste et reelt overlap-problem: footerens mail-link
("hej@eatsafe.dk") var delvist skjult bag bundnavigationens Scan-ikon.
Bad om et præcist, scoped fix — ingen redesign, ingen nye features, kun
(1) ret bund-spacing så footeren aldrig dækkes, (2) omdøb "Ugentlig
streak" til noget mindre streak-fokuseret, (3) bevar alt andet uændret.

**Rodårsag:** den delte `.screen`-CSS-klasse (theme.jsx) reserverer en
flad `110px` bund-padding for hele appen, som en fast tilnærmelse til
bundnavigationens egen højde (ca. 77px fast + dens egen
`env(safe-area-inset-bottom)`). Footerens egen `paddingBottom:8` var for
lille en buffer oveni til pålideligt at klare enheder med større safe-area
end den faste 110px allerede antog — beskrevet præcist af brugeren selv i
kravet ("navigationens højde + safe-area inset + ekstra luft").

**Fix (kun `src/ProfileScreen.jsx`, scoped til Profil-footeren — IKKE den
delte `.screen`-klasse, for ikke at ændre layoutet på andre skærme):**
footerens `paddingBottom` ændret fra `8` til
`calc(96px + env(safe-area-inset-bottom))` — lægger navigationens
omtrentlige egen-højde + samme safe-area-formel + en håndfuld ekstra
pixels luft direkte på footer-elementet selv, som en garanti der ikke
afhænger af at det flade 110px-tal i den delte klasse rammer nøjagtigt
rigtigt på enhver enhed.

**Microcopy:** "Ugentlig streak" (progress-bar-labelen) omdøbt til
"Ugentlig aktivitet" — selve progress-baren og "3 dage!"-badgen er
uændrede, kun teksten er mindre streak-centreret, som bedt om.

**Verifikation:** `npm run build` grøn, `npx vitest run` 109/109, mojibake-
scan clean. Playwright på iPhone SE/13/14 Pro Max (artifact-preview-build,
login-bypass, hamburger-menu → `.menu-profile-card` → Profil, scroll til
`document.body.scrollHeight`): footerens sidste linje ("EatSafe Beta") har
nu **127px fri luft** til bundnavigationens topkant på alle tre profiler
(op fra et tidligere, reelt overlap) — "Ugentlig aktivitet" fundet i DOM,
den gamle "Ugentlig streak"-tekst ikke længere til stede. 2×2-grid,
profilkort, Mine præferencer og Husstand-genvej uændrede, som krævet.

## Indstillinger — fuld omstrukturering til seks sektioner (28. sept. 2026)

Brugeren gav en detaljeret, tolv-punkts "FORBEDR INDSTILLINGER I EATSAFE"-
spec: samme visuelle stil som resten af appen, ingen redesign, kun
Indstillinger. Målet var en mere logisk/rolig/komplet side uden at fylde
den med irrelevante muligheder.

**Undersøgelse før implementering** — for at undgå at bygge "fake"
toggles (antimønsteret denne sessions egen historik gentagne gange har
fundet og rettet, senest feltnavne-mismatch-lektionen i afsnit 5):
- Grep efter eksisterende sprog-/i18n-infrastruktur: EatSafe har INTET
  app-bredt i18n-system — al UI-tekst er hardkodet dansk direkte i hver
  skærms JSX. Kun Madpas har en reel sprog-mekanik (`MADPAS_LANGUAGES` +
  oversatte tekst-tabeller). Konklusion: "App-sprog" ville være en toggle
  uden nogen reel funktion bag sig — udeladt, med en tydelig begrundelse
  i `SettingsScreen.jsx`s filhoved i stedet for stiltiende at droppe det.
- Læste `runLookupProduct` (useProduct.js) grundigt: scan-flowet
  navigerer ALTID direkte til `SCREENS.RESULT` efter et opslag — der
  findes ingen alternativ, ikke-automatisk visningstilstand. "Åbn
  resultat automatisk efter scanning" ville derfor heller ikke styre
  noget reelt — udeladt af samme grund.
- Grep efter data-eksport/GDPR-endpoints: ingen findes. "Eksportér mine
  data" udeladt (spec'en selv gjorde dette punkt eksplicit betinget:
  "hvis funktionen understøttes").
- CLAUDE.md dokumenterer allerede at der ikke findes en selvstændig
  vilkårs-side (kun privacy.html) — "Vilkår" udeladt af samme grund.
- Ingen cross-browser PWA-API kan åbne browserens/systemets egne
  indstillinger fra JS — den spec'ede "Åbn Indstillinger"-knap ved afvist
  push-tilladelse er udeladt (spec'en markerede den selv som "evt.");
  den eksisterende tekstforklaring ("Aktivér push i din browsers
  indstillinger") er den ærlige erstatning.

**Reelt genbrugt, intet opfundet:**
- Sprogvælgeren for "Standard-sprog til Madpas" er en 1:1-genbrug af
  MadpasScreen.jsx's egne `.mp-lang-dropdown`/`.mp-lang-list`/`.mp-lang-
  opt`-CSS-klasser og af App.jsx's allerede lagrede `madpasLang`/
  `setMadpasLang`-state (samme `localStorage`-nøgle,
  `as_madpas_lang`) — ingen ny dropdown-UI opfundet.
- "Om EatSafe Beta" genåbner den eksisterende `BetaIntroModal` via
  præcis samme `setBetaIntroStep(0); setBetaIntroSeen(false);`-mønster
  som ProfileMenu.jsx's egen "Om EatSafe Beta"-række allerede bruger.
- "Kontakt & feedback" åbner den eksisterende `FeedbackModal` via samme
  `onOpenFeedback`-prop-navn/-mønster som `HelpModal.jsx` allerede bruger
  i App.jsx.
- "Version" viser `formatBuildTime()`/`COMMIT_SHA` fra `utils.jsx` —
  samme diagnostik-mønster `FeedbackModal.jsx` allerede viser internt,
  ikke et hardkodet versionsnummer (den slags blev netop identificeret
  og fjernet som et feltnavne-mismatch-fund tidligere i denne session,
  se afsnittet om Scan-forsidens redesign).
- "Hvilke data EatSafe gemmer"s liste er den samme kategori-liste som
  `DeleteAccountModal.jsx`s "FØLGENDE DATA SLETTES" — bevidst dupliceret
  (to små, statiske arrays), ikke ekstraheret til en fælles fil for kun
  to brugssteder.

**To reelt nye, fungerende indstillinger** (ikke fake toggles): "Vibration
ved advarsel" og "Lyd ved advarsel". Da der ikke fandtes noget eksisterende
"advarsel"-specifikt alarm-checkpoint at gøre betinget (den eksisterende
vibration i `useProduct.js` er ubetinget, fyrer ved ENHVER scanning,
ikke kun farlige), blev et nyt, minimalt `fireWarningAlert()`-checkpoint
tilføjet i `runLookupProduct` netop dér hvor koden allerede tjekker
`status === "danger" || status === "warn"` (til at hente alternativer) —
samme vibrate-array-mønster og Web Audio-oscillator-mønster som allerede
findes i `useScanner.js`s stregkode-detektions-feedback, men en tydeligt
lavere/længere tone så de to kan skelnes. State (`vibrateOnWarning`/
`soundOnWarning`) er `localStorage`-persisteret (samme mønster som
`madpasCrossContact`, men default TIL — dette er tilgængeligheds-
feedback, ikke en antagelse om allergi-alvorlighed) og løftet til
App.jsx, sendt med i `lookupProduct`s `ctx` ved siden af den øvrige
scan-afhængige state.

**Notifikationer-kortet:** "Push-tilladelse" → "Push-notifikationer".
Tre kategori-labels finpudset i `useNotificationPrefs.js` ("Dine
indsendelser"→"Indsendte produkter", "Familie"→"Familieinvitationer",
"Ugentligt opskrifts-digest"→"Ugentlig opskriftsoversigt") — kun de
synlige `label`-felter, `id`-nøglerne (bruges som databasekategori) er
UÆNDREDE, for ikke at knække eksisterende gemte præferencer. De
gentagne PUSH/MAIL-labels på hver enkelt kategori-række erstattet af én
fælles kolonneheader ("Push"/"E-mail") lige under introteksten. Den
reelle funktionelle rettelse: per-kategori Push-toggles vises nu grånede/
deaktiverede, med en kort forklarende linje ovenfor gridet, når browserens
push-tilladelse ikke er givet — før kunne en bruger tænde en Push-toggle
der reelt ikke kunne sende noget. Mail-kolonnen er bevidst UPÅVIRKET af
push-tilladelsen, da de to kanaler er helt uafhængige.

**Slet konto flyttet og omdesignet:** væk fra Konto-kortets top (hvor den
sad side om side med Log ud, "konkurrerende visuelt" som spec'en selv
kaldte det), ned i et nyt "FAREZONE"-underafsnit nederst i Privatliv &
data-kortet — en lille, uppercase, dæmpet label efterfulgt af en ren
tekst-/ikon-knap (rød tekst, ingen fyldt baggrund), ikke en ligeværdig
blok-knap blandt normale handlinger. Selve bekræftelses-flowet ("skriv
'slet'") er den eksisterende, delte `DeleteAccountModal.jsx` — uændret,
kun dens trigger-knap er flyttet.

**Verifikation:** `npm run build` grøn, `npx vitest run` 109/109, mojibake-
scan clean på alle fire ændrede filer (kun de allerede kendte, harmløse
zero-width-joiner-emoji i App.jsx, urørt af denne ændring). Playwright
(artifact-preview-build, login-bypass, hamburger-menu → Indstillinger,
iPhone 13-profil): alle seks sektionsoverskrifter fundet (Konto/Sprog/
Scanning/Notifikationer/Privatliv & data/Om EatSafe); sprogvælgeren
åbnede 17 sprog-muligheder, valgte "Dansk", og opdaterede den lukkede
dropdown-visning korrekt; "Slet konto" bekræftet FRAVÆRENDE fra
Konto-kortets tekst og TIL STEDE i Privatliv & data-kortet;
"Hvilke data EatSafe gemmer" foldede korrekt ud og viste
"Scanningshistorik"; alle tre omdøbte notifikations-labels fundet;
fælles "Push"/"E-mail"-kolonneheader til stede; "Version"/"Om EatSafe
Beta"/"Kontakt & feedback" alle til stede i Om EatSafe-sektionen.
Skærmbilleder (iPhone 13) bekræftede visuelt konsistent kort-/spacing-
design med resten af appen, ingen layout-brud.

## Scanner — "FINAL POLISH – SCANNER", 16-punkts spec (28. sept. 2026)

Brugeren gav en omfattende, 16-punkts spec for scanner-flowet: gør det
"helt intuitivt, hurtigt og robust for almindelige brugere", bevar
kamera-feed/EatSafe-stil/bundnavigation, ingen redesign, ingen feature
creep. Berørte filer: `ScannerScreen.jsx`, `useScanner.js`,
`useProduct.js`, `App.jsx` (prop-threading).

**Undersøgelse før implementering:**
- Læste hele `ScannerScreen.jsx` (719 linjer) og `useScanner.js` (335
  linjer) grundigt for at forstå den eksisterende kamera-/scan-pipeline
  før noget blev ændret.
- **Reelt dødt-state-fund:** `showPhotoHint` (useScanner.js) sættes
  allerede korrekt til `true` via en `setTimeout(..., 5000)` efter
  kameraet er klar, uden et scan — præcis den timing spec'ens punkt 3
  bad om ("efter ca. 5-7 sekunder"). Men state'en blev modtaget som prop
  i `ScannerScreen.jsx` og ALDRIG renderet noget sted i JSX'en — samme
  klasse fund som feltnavne-mismatch-lektionen i CLAUDE.md afsnit 5
  (en beregnet værdi, sendt ind, men aldrig faktisk brugt). Løsningen
  for punkt 3 var derfor ikke at bygge en ny timer, men at forbinde en
  allerede-korrekt eksisterende til UI'et.
- Grep'ede efter eksisterende lys-/genskin-detektion (ingen findes —
  ingen pixel-/canvas-baseret billedanalyse i kodebasen) før punkt 2's
  "for mørkt? tænd lygten"-eksempel blev vurderet: at bygge reel
  lysstyrke-detektion ville være en ny funktion, ikke "polish" — udeladt,
  til fordel for en tidsstyret (ikke lysstyrke-styret) hjælpetekst-rotation,
  som stadig opfylder kravets kerne ("hjælpeteksten skal kunne ændres
  dynamisk efter situationen").
- Tjekkede `isValidEanChecksum` (helpers.js) — validerer allerede
  8/12/13/14-cifrede koder med rigtig EAN/UPC-checksum, en strengere/mere
  korrekt kontrol end spec'ens egen "8 eller 13 cifre"-krav. Genbrugt
  uændret, ikke erstattet med en svagere længde-kun-kontrol.
- Bekræftede at `galleryInputRef`s skjulte fil-input (`accept="image/*"`,
  INGEN `capture`-attribut) allerede giver browserens/OS'ets fulde native
  vælger (Fotobibliotek/Tag foto/Vælg arkiv) — punkt 8 var derfor allerede
  opfyldt uden ændring.
- Genundersøgte (samme konklusion som Indstillinger-rundens push-status)
  om en "Åbn Indstillinger"-knap kan åbne kamera-tilladelser fra en PWA —
  stadig ingen cross-browser/cross-platform JS-API findes. Udeladt med
  samme begrundelse, dokumenteret i koden.

**Implementerede ændringer, punkt for punkt:**

1. **Kamera-kontrol-labels:** ny lokal `CamCtrlBtn`-komponent
   (ScannerScreen.jsx) stabler ikon + 9px tekst-label lodret i en
   `minWidth/minHeight:44`-touch-flade (den synlige cirkel er stadig kun
   34px — touch-fladen er større end det viste ikon, for at ramme
   tilgængeligheds-kravet uden at forstørre det visuelle udtryk).
   Luk-knappen forblev et separat, ikon-kun `S.camCtrlBtn` til venstre,
   uændret placering.
2. **Dynamisk hjælpetekst:** ny `scanHint`-state,
   `useEffect`-styret på `scanReady` — "Placér hele stregkoden i rammen"
   ved kamera-klar, "Hold telefonen stille" efter 3s. Ingen lang
   tip-liste, kun én besked ad gangen, som krævet.
3. **Timeout-faldback:** `showPhotoHint` (se ovenfor) renderer nu
   "Kan den ikke scannes? *Indtast EAN* eller *vælg et billede*." med
   to reelt klikbare inline-spans (samme handlinger som de eksisterende
   kontroller: `openManualEan()`/`galleryInputRef.current?.click()`).
4. **Scanneramme:** uændret — ingen nye animationer/effekter tilføjet,
   som bedt om.
5. **Zoom:** adskilt fra hjælpeteksten (viste tidligere ENTEN/ELLER,
   aldrig begge samtidig — zoom-teksten erstattede hjælpeteksten helt).
   Vurderet ikke-interaktiv (ingen tap-til-zoom findes, kun eksisterende
   auto-zoom via `useScanner.js`s timere) → holdt bevidst lille/let
   (10px, dæmpet grøn, ingen baggrunds-pille) i stedet for at gøre den
   klikbar, jf. spec'ens eget betingede "hvis... kun information...
   fjern unødvendig visuel vægt."
6. **Lygte:** label skifter til "Lygte til" når aktiv (i tillæg til den
   eksisterende gule/orange farve) — statussen kommunikeres nu IKKE kun
   via farve (tilgængeligheds-krav 14). `aria-pressed` tilføjet.
7. **Manuel EAN — den mest omfattende enkeltændring:**
   - Input skiftet fra `type="number"` til `type="text"` +
     `inputMode="numeric"` — undgår number-inputtets kendte kvirks
     (kan skrive "e"/"+"/"-", mister foranstillede nuller ved visning)
     og giver stadig et numerisk tastatur på mobil.
   - Kontrolleret state (`manualEanValue`) med `onChange` der filtrerer
     `.replace(/\D/g, "")` fortløbende — trimmer automatisk mellemrum,
     bindestreger og alt andet end cifre, som krævet.
   - **Reel bug fundet af en Playwright-test, ikke ved manuel
     inspektion:** en `maxLength={14}`-attribut på selve `<input>` talte
     RÅ tegn (inklusive bindestreger/mellemrum), ikke cifre. En test der
     indsatte "571-2873 099443" (15 rå tegn, 13 reelle cifre) og
     sammenlignede input/output character-for-character afslørede at
     browseren afskar det sidste tegn ("3") FØR JS-filteret overhovedet
     nåede at fjerne bindestregen/mellemrummet — værdien endte som
     "571287309944" (kun 12 cifre) i stedet for de fulde 13. Rettet ved
     at fjerne den native `maxLength` helt og udelukkende cifre-
     begrænse (`.slice(0,14)`) EFTER filtrering i JS. Genverificeret:
     samme input gav nu korrekt "5712873099443" (alle 13 cifre bevaret).
   - To adskilte, specifikke fejltekster i stedet for spec'ens ene
     eksempel-sætning: forkert LÆNGDE (ikke i `[8,12,13,14]`) →
     "EAN-nummeret skal være 8 eller 13 cifre." (krav 7's egen ordlyd);
     korrekt længde men ugyldig CHECKSUM (en formentlig tastefejl) →
     "Stregkoden kunne ikke læses. Prøv igen." (krav 12's "ugyldig
     stregkode"-tekst) — en naturlig, meningsfuld arbejdsdeling mellem
     de to krav i stedet for at vælge kun den ene tekst vilkårligt.
   - Søg-knappen er nu `disabled` indtil længden er gyldig (grå i stedet
     for grøn) — checksum tjekkes stadig kun ved faktisk forsøgt søgning
     (Enter/klik), ikke løbende mens brugeren taster, for ikke at vise en
     fejl for et endnu-ufuldstændigt tal.
   - `openManualEan()`-hjælpefunktion indført så ALLE fem steder der
     åbner panelet (kontrol-knap, faldback-hint, permission-denied-kort,
     fejlbanner-link) konsekvent nulstiller `manualEanValue`/
     `manualEanError` — et tidligere forladt udkast fra en tidligere
     åbning kunne ellers dukke op igen. **Selv-rekursions-bug fundet og
     rettet med det samme:** en automatiseret søg/erstat af
     `setShowManualEan(true)` → `openManualEan()` ramte ved en fejl også
     selve `openManualEan`-funktionens EGEN krop (som naturligvis
     indeholdt strengen `setShowManualEan(true)`), hvilket ville have
     givet uendelig rekursion ved første klik — opdaget ved en
     eftergrep af alle forekomster af `openManualEan` umiddelbart efter
     erstatningen, før build/test overhovedet blev kørt.
8. **Billede/upload:** kopi opdateret ("Vi kunne ikke finde en tydelig
   stregkode på billedet. Prøv et andet billede eller indtast EAN
   manuelt.") for både galleri- og foto-fallback-stien. Selve
   native-vælgeren var allerede korrekt (se undersøgelses-afsnittet).
9. **Kameraadgang nægtet:** ny `cameraPermissionDenied`-state i
   useScanner.js, sat specifikt i `NotAllowedError`/
   `PermissionDeniedError`-grenen (nulstillet ved hvert nyt
   `startCamera()`-forsøg). Erstatter den store scan-knap med et
   dedikeret kort ("Kameraadgang er slået fra" / "Tillad kameraadgang
   for at scanne stregkoder.") + to reelt fungerende knapper (Billede →
   `galleryInputRef.current?.click()`, Indtast EAN → `openManualEan()`).
   Undertekst-teksten i hero'en opdateres samtidig. Ingen "Åbn
   Indstillinger"-knap (se undersøgelses-afsnittet).
10. **Kamera-permission-primer:** ny `showCameraPrimer`-state + en
    lille, centreret, ét-sætnings modal ("EatSafe bruger kameraet til
    at læse produktets stregkode.") vist FØR `startCamera()` kaldes,
    kun hvis `localStorage`-flagget `as_camera_primer_seen` ikke er
    sat — sættes ved "Fortsæt", som derefter selv kalder `startCamera()`.
11. **Succes-feedback/debounce:** allerede korrekt implementeret —
    `stopCamera()` kaldes FØR `onScanSuccessRef.current?.(code)`, og
    `lastScannedRef` blokerer samme kode i 1500ms. Ingen ny toggle
    tilføjet for "vibration ved scan" — den eksisterende, ubetingede
    stregkode-detekterings-feedback (vibrate+beep i useScanner.js) ER
    allerede den krævede "korte visuelle feedback"; kravets "hvis
    aktiveret i Indstillinger" tolkes som den allerede eksisterende
    "Vibration ved advarsel"-indstilling fra forrige runde, ikke en ny,
    tredje separat toggle (ville være reel feature creep, krav 15).
12. **Fejltilstande:** "Ugyldig stregkode" (→ delt med krav 7's
    checksum-fejl, se ovenfor) og "Netværksfejl" ("Kunne ikke hente
    produktet. Kontrollér forbindelsen og prøv igen.", useProduct.js)
    opdateret til spec'ens ordlyd. Derudover: en `isValidEanChecksum`-
    gate tilføjet direkte i html5-qrcodes success-callback i
    useScanner.js — en ugyldig/garblet live-afkodning IGNORERES NU
    STILLE og scanningen fortsætter, i stedet for potentielt at sende et
    forkert tal videre til et produktopslag. Bevidst IKKE et synligt
    fejlbanner her (i modsætning til manuel indtastning) — et enkelt
    fejlaflæst kamera-frame er normalt/forbigående, og et afbrydende
    banner for hver mislykket frame ville være mere distraherende end
    hjælpsomt. "Produkt ikke fundet" (NotFoundScreen.jsx) er bevidst
    IKKE ændret — allerede dækket af et fuldt fungerende indsend-/
    efterspørg-flow, og eksplicit uden for scanner-scopet ("Bevar resten
    af EatSafe uændret").
13-14. **Visuel polish/tilgængelighed:** touch-targets ≥44px på alle nye
    kontrolknapper, `aria-label`/`aria-invalid`/`role="alert"` på det nye
    EAN-input, `aria-pressed` på lygte-knappen, lygte-status kommunikeret
    via BÅDE farve og tekst-label (ikke kun farve).
15. **Ingen feature creep:** ingen nye scanner-modes, ingen AR, ingen
    permanente tip-lister, ingen tutorial-slides tilføjet.

**Verifikation:** `npm run build` grøn, `npx vitest run` 109/109
(uændret — ingen eksisterende test afhang af de ændrede fejltekster),
mojibake-scan clean på alle fire ændrede filer. Playwright
(artifact-preview-build, iPhone 13-profil):
- Kamera-primer vises ved første klik på "Scan produkt", sætter
  `localStorage`-flagget korrekt, og vises IKKE igen ved efterfølgende
  klik.
- Manuel EAN: Søg-knappen bekræftet `disabled` ved 5-cifret input,
  `enabled` ved 13-cifret input; ugyldig 13-cifret checksum viste
  korrekt "Stregkoden kunne ikke læses. Prøv igen." via `role="alert"`;
  cifre-filtrering bekræftet character-for-character efter
  `maxLength`-fixet (dette var testen der fandt buggen i første omgang).
- Kamera-permission-nægtet-stien kunne ikke udløses pålideligt via
  Chromium-flag i denne sandbox (hverken det rigtige "intet kamera"-
  scenarie eller et forsøg med `--use-fake-device-for-media-stream` gav
  konsekvent `NotAllowedError` — miljøet mangler tilsyneladende reel
  kamera-hardware-emulering) — verificeret i stedet ved kode-gennemgang
  af selve grenen (`cameraPermissionDenied` sættes korrekt, kun i den
  rette catch-gren) samt ved at bekræfte at ANDRE fejlgrene (fx "Intet
  kamera fundet") korrekt IKKE udløser det nye dedikerede kort, kun den
  eksisterende generiske banner — konsistent, korrekt betinget adfærd.

## Produktresultatside — "FINAL PRODUCT RESULT PAGE", 17-punkts spec (28. sept. 2026)

Brugeren delte et Red Bull-eksempel og en omfattende, 17-punkts spec for
`ResultScreen.jsx`: EatSafe må ALDRIG kalde et produkt "sikkert" alene
fordi der ikke var et match i databasen (ingredienser kan ændre sig, data
kan være ufuldstændige, produktdata kan være bruger-indsendt) — løsningen
skal være én generisk skabelon der virker for ALLE produkter, ikke
hardkodet til eksemplet. Ingen redesign af resten af appen, ingen feature
creep.

**Undersøgelse før implementering:**
- Læste hele `ResultScreen.jsx` (648 linjer), `useProduct.js`s
  `buildScanResultFromProductData`, og de relevante dele af `helpers.js`
  (`compareAllergens`/`compareENumbers`/`checkDietCompatibility`/
  `computeProfileResults`) grundigt for at forstå hvilken data der
  allerede findes, før noget blev besluttet.
- **Nøglefund:** `ALLERGENS`-konstanten (constants.jsx) har allerede et
  `type`-felt pr. allergen ("allergi" vs. "intolerance") — præcis den
  skelnen spec'ens punkt B/C bad om (allergi ≠ intolerance/følsomhed).
  Ingen ny data nødvendig, kun en omgruppering af allerede beregnede
  matches (`scanResult.matchedDanger`/`matchedWarning`) efter dette felt.
- **Reelt datakvalitets-fund:** `IngredientsList` (SharedComponents.jsx)
  fremhævede hidtil ALLE allergener produktet indeholdt, uanset om
  brugeren selv havde det pågældende allergen aktivt — kun eksplicit
  "no"-flaggede allergener på selve PRODUKTET blev udelukket
  (`isAllergenWord` i allergenKeywords.js), ikke brugerens egne
  (ir)relevante valg. Dette var præcis spec'ens punkt 8-klage ("kun
  fremhæves hvis relevant for DEN konkrete bruger") — bekræftet ved at
  læse `isAllergenWord`s implementering, ikke antaget.
- Bekræftede at `IngredientsList` også bruges af `RecipesScreen.jsx` med
  en anden kaldskontrakt (`allergenFlags`, ikke brugerens egne valg) —
  enhver ændring skulle derfor være strengt bagudkompatibel, ikke en
  erstatning.
- Grep'ede efter alle forbrugere af `scanResult.status/headline/summary`
  (History, ListScreen, SearchScreen, `useProduct.test.js`s eksakte
  tekst-assertions) FØR beslutningen om ikke at ændre `useProduct.js`
  overhovedet — al ny logik skulle ligge som et rent ekstra lag i
  `ResultScreen.jsx` selv, ikke i den delte beregning.
- Grep'ede efter et eksisterende "enheds"-felt (100g/100ml) på
  næringsdata — findes ikke. Løst med en kategori-tekst-baseret
  heuristik (data-drevet, ikke en fast konstant) i stedet for enten at
  opfinde et nyt datafelt (ude af scope) eller fortsætte med at hardkode
  "100g" til alt.

**Nye, generiske hjælpefunktioner (`helpers.js`, ingen ændring af
eksisterende exports):**
- `categorizeProductFindings({ matchedDanger, matchedWarning,
  customAllergenMatches, matchedENumbers, dietResults })` — grupperer
  allerede-beregnede matches i allergi/intolerance/E-nummer/diæt-fejl/
  diæt-ukendt/diæt-ok, udelukkende ved opslag i `ALLERGENS`' `type`-felt.
- `computeTopStatus({ hasSufficientData, ...findings })` — beregner ÉN
  topstatus, prioriteret allergi → intolerance → E-nummer → kost →
  utilstrækkelige data → ingen fund. Returnerer aldrig "sikkert"/
  "allergifrit"/"garanteret".
- `hasSufficientData` beregnes i `ResultScreen.jsx` selv: enten mangler
  data for brugerens EGNE aktive allergener (`scanResult.hasUnknown`,
  allerede beregnet i `useProduct.js` men aldrig eksponeret som en
  selvstændig UI-tilstand før nu), eller produktet har hverken
  allergen-flags eller en ingrediensliste overhovedet.

**`ResultScreen.jsx`, sektion for sektion:**
- Produktkort-verdikt: bruger nu `topStatus` (ved én aktiv profil) i
  stedet for `scanResult.headline`. Viser konkrete navne under
  overskriften ("Mælk · Æg · Soja"-mønsteret), plus den korrekte
  sekundærtekst for grøn/grå-tilstandene, direkte i den farvede strimmel.
- Datakilde-badgen (allerede en genbrugelig `verifiedBadge()`) fik et
  tappeligt info-ikon (`showToast`) der forklarer kilden — ingen ny
  komponent, kun en interaktion tilføjet til en allerede generisk én.
- Ny "Relevant for dig"-sektion (kun ved én aktiv profil — ved flere
  profiler dækker den eksisterende per-person-liste allerede hver
  persons egne fund separat).
- "Kompatibel med dine diæter" omdøbt til "Passer til dine
  kostpræferencer", ✓/✕/?-visning for ALLE aktive diæter (ikke kun
  fejlede) via `Icon`-komponenter i stedet for tekst-symboler.
- Ingredienslisten: ny `ingredientHighlightRules`-liste bygget af de
  kategoriserede fund, sendt til `IngredientsList`s nye `highlightRules`/
  `onHighlightTap`-props. Diæt-fund var den eneste kategori der krævede
  en lille ekstra oversættelse (checkDietCompatibility returnerer kun en
  færdig sætning som "Indeholder mælkeprotein" — ordet i sætningen er
  ikke altid det ord der reelt står i ingredienslisten, fx
  "skummetmælkspulver" — løst med et lille map fra kendte
  allergen-flag-udledte sætninger til det rigtige allergens egen
  ordliste, med en generisk præfiks-afstrejning som fallback for de
  ingrediens-nøgleords-baserede diæt-brud, hvor sætningens ord ER
  garanteret det ord der udløste matchet).
- "Fremhævet = allergen"-billedteksten vises nu KUN når alt fremhævet
  reelt er en allergi — ellers en mere præcis, generisk tekst. De to
  tidligere spredte "tjek altid selv"/"dobbelttjek altid selv"-
  formuleringer er fjernet fra ingredienslisten.
- Næringsindhold: dynamisk "pr. 100 g"/"pr. 100 ml" (kategori-heuristik,
  se ovenfor), sektionen SKJULES HELT ved manglende data (var tidligere
  en "hjælp os"-prompt) — bevidst forskellig behandling fra manglende
  ingredienser, som spec'en selv bad om.
- Én samlet sikkerhedsdisclaimer, eksakt ordlyd fra spec'en, placeret
  lige før "Ret forkerte data".

**`SharedComponents.jsx` (`IngredientsList`):** nyt, valgfrit
`highlightRules`/`onHighlightTap`-prop-par. Når udeladt (RecipesScreen.jsx's
brug), er opførslen 100% uændret — bekræftet ved at de 7 eksisterende
`SharedComponents.test.jsx`-tests stadig består uændret. Når angivet
(kun ResultScreen.jsx), overtager en ny matchings-funktion
(`findMatchingHighlightRule`, genbruger `keywordMatches` fra
allergenKeywords.js for ordgrænse-/negations-korrekt matching, samme
funktion `checkDietCompatibility` selv bruger) — E-numre matches via
udtrukne/normaliserede koder, allergener/diæt via nøgleord. Farveskema:
kun to farver (rød=allergi, orange/gult=alt andet), jf. appens egen
statusfarve-konvention (krav 14) — reducerer visuel kompleksitet
fremfor fire forskellige farver.

**Verifikation:** `npm run build` grøn, `npx vitest run` 109/109 (ingen
regressioner — hverken i de generelle tests eller specifikt
`SharedComponents.test.jsx`s IngredientsList-tests), mojibake-scan clean
på alle tre ændrede filer.

Playwright (artifact-preview-build, iPhone 13, fire mock-produkter via
route-interception på `/functions/v1/products/*`): et reelt Playwright-
routing-fund undervejs — ruter matches i OMVENDT registreringsrækkefølge
(sidst registreret vinder), så en generisk catch-all-rute registreret
EFTER en specifik produkt-rute overstyrede den utilsigtet; rettet ved at
bytte rækkefølgen. Et andet miljø-fund: service worker-registrering (ægte
PWA-adfærd) forhindrede Playwrights `page.route()` i at opsnappe
netværkskald til Supabase i denne sandbox — løst med
`serviceWorkers:'block'` på browser-konteksten. Endelig: preview-
tilstanden aktiverer som standard "Alle" profiler (bruger + 2
familiemedlemmer), hvilket udløser den EKSISTERENDE multi-profil-kode-sti
i stedet for den nye enkelt-profil-logik — løst ved eksplicit at vælge
kun "Dig" via den eksisterende "Scanner for"-vælger, FØR scan-testene.

Fire scannede mock-produkter bekræftede al kernelogik korrekt:
- **Ingen problemer** (mælk/laktose "yes" men ikke brugerens aktive
  allergener, fuld ingrediens-/næringsdata): "Ingen advarsler fundet"
  (grøn), korrekt sekundærtekst, "Næringsindhold pr. 100 g" vist,
  disclaimeren vist præcis én gang.
- **Allergi** (nødder "yes", brugerens aktive allergen, ingen
  næringsdata): "Indeholder noget, du er allergisk overfor" (rød),
  "Nødder" vist som navn, "Relevant for dig"-sektionen vist,
  næringssektionen bekræftet FRAVÆRENDE (skjult korrekt),
  "HASSELNØDDER" fremhævet rødt i ingredienslisten, tryk på den
  fremhævede ingrediens viste korrekt en toast: "Nødder — Matcher din
  valgte Nødder-allergi."
- **Intolerance** (gluten "yes", brugerens aktive allergen, type
  "intolerance"): "Matcher noget, du ønsker at undgå" (orange/gult, IKKE
  rød) — bekræfter den centrale allergi/intolerance-skelnen virker
  korrekt. "Intolerancer / følsomheder"-gruppen vist separat fra
  Allergier-gruppen.
- **Utilstrækkelige data** (tomme allergen_flags, ingen ingrediensliste):
  "Ikke nok oplysninger til fuld kontrol" (neutral grå, `--neutral`-
  token) — ALDRIG grøn, som spec'ens punkt F eksplicit krævede. Korrekt
  sekundærtekst vist.

Multi-profil-visningen, kamera-permission-baserede test-scenarier (fx
brugerindsendt-badge, lang ingrediensliste, fremmedsproget tekst,
indkøbslisten-match) blev IKKE hver især eksplicit Playwright-testet
inden for denne omgangs tidsramme — disse code paths genbruger enten
allerede-eksisterende, tidligere verificerede mekanismer
(`verifiedBadge()`, `findActiveListMatch()`, `IngredientsList`s
eksisterende tekst-splitting) eller er lavrisiko, rent visningsmæssige
konsekvenser af den allerede testede kernelogik.

## Scan-forsiden, nyt referencefoto + egen CTA-farvepalet til scan-knappen, mergekonflikt løst (24. sept. 2026)

**24. sept. 2026 — samme dag, nyt referencefoto + egen CTA-farvepalet til
scan-knappen.** Brugeren delte et nyt, direkte uploadet baggrundsfoto
(allergen-fødevarer i to kolonner på ren hvid baggrund — mælk/havre/æg/
laks/rejer i venstre side, æggeskaller/mel/hvede/mandler/hasselnødder i
højre side) samt et fuldt UI-referencedesign. Vist først som et interaktivt
HTML-mockup (Artifact) til godkendelse, før den rigtige app blev ændret —
se `.claude/HISTORY.md` for mockuppets fulde indhold og screenshots.
Ændringer i `ScannerScreen.jsx`/`theme.jsx`:
- **Nyt baggrundsfoto** erstatter det forrige (`src/assets/home/
  scan-hero-bg.webp` overskrevet in-place, samme import uændret) — allerede
  tæt på ren hvid i kilden (RGB ~250-254), ingen hvidbalance-korrektion
  nødvendig denne gang.
- **Scan-knappen fik sin egen farvepalet**, adskilt fra appens generelle
  `--green`-token: primær `#0E8F5A`, mørk `#08734A`, halo `#DDF4E8` — kun
  denne ene knap, resten af appens grønne elementer (bundnav, andre
  primærknapper) er urørt.
- **To lag levende bevægelse i hvile** (brugerens eksplicitte ønske: "Knappen
  skal være grøn, men den må gerne pulsere så man får lyst til at trykke") —
  halo-gløden bag knappen pulserer i skala+opacitet (`@keyframes
  scan-halo-pulse`, 2.4s, skala 1→1.12 + opacity .8→.35), OG selve
  knap-wrapperen får et ekstra åndedræt (`scanCtaBreathe`, genbrugt fra en
  mellemliggende hvid ghost/outline-udgave af knappen — se nedenfor).
  Respekterer `prefers-reduced-motion`.
- **Knappen er nu en rigtig `<button>`** (var tidligere en `<div role=
  "button">` med manuel `tabIndex`/`onKeyDown`) — giver native tastatur-
  aktivering gratis og gør `:active{transform:scale(.95)}`-tryk-feedback
  pålideligt på touch-enheder (virker ikke troværdigt via CSS `:active` på
  en almindelig div på iOS).
- **Fjernet versionsnummeret** ("v1.0.6 · beta") fra forsiden. Fandt
  undervejs at det var et hardkodet tal, ikke den faktiske `buildLabel`-
  prop (`formatBuildTime()`) — et feltnavne-mismatch-mønster (se afsnit 5's
  stående lektion) hvor et komponent-prop var beregnet, sendt ind, men
  aldrig faktisk brugt. `buildLabel`-proppen er fjernet fra `ScannerScreen`
  (var reelt ubrugt) — OnboardingScreen's egen, separate brug er urørt.
- **"Prøv en demo-scanning"-knappen** (kun til konti <24 timer gamle) er
  fjernet fra forsiden, inkl. den nu-ubrugte `runDemoScan`-callback i
  `App.jsx` (den underliggende, testede `buildDemoScanResult`-hjælpefunktion
  i `useProduct.js` er bevaret uændret — bruges/testes uafhængigt).
  **"Prøv en demo"-pillen** (åbnede app-guiden) er også fjernet — oprindeligt
  bevidst bevaret i denne omgang, men en efterfølgende merge med `main`
  (se nedenfor) viste at brugeren allerede havde bedt om den fjernet i en
  parallel session; `DemoSlider`-guiden har nu ingen synlig indgang i UI'et,
  uændret fra `main`s tilstand.
- **Bundmenuen er UÆNDRET** (Indkøbsliste/Scan/Søg) — referencedesignets
  billede viste "Historik" som tredje punkt i stedet for "Søg", men
  brugeren bekræftede eksplicit at bundmenuen skal forblive som den er, da
  spørgsmålet blev stillet (hvor skulle Søg så bo, hvis fjernet).
- **Reel bug fundet og rettet undervejs (ikke en del af denne rundes
  oprindelige scope, men direkte i vejen):** kamerascanningens laser-linje-
  animation (`animation:"laserMove ..."`) refererede et `@keyframes
  laserMove` der aldrig var defineret i `theme.jsx` — linjen "animerede"
  aldrig, den lå bare stille. Tilføjet den manglende keyframe. Samtidig
  fundet at laser-linjen kunne nå at vises et øjeblik FØR kameraet reelt
  var i gang med at afkode (`cameraActive` sættes i `useScanner.js`s
  `startCamera` før `Html5Qrcode.start()`s promise er løst) — tilføjet et
  nyt `scanReady`-state (sandt først når `.start()` reelt er løst) og
  gatet laser-linjens rendering på det, i stedet for kun `cameraActive`.
  Matcher brugerens eksplicitte krav: "scannerlinje må først vises, når
  kameraet faktisk scanner."
- **Mergekonflikt med parallelt arbejde på `main`, løst i samme runde:**
  mens denne gren arbejdede, nåede `main` 14 uafhængige commits om NETOP
  denne skærm — en hvid ghost/outline-udgave af scan-knappen (roterende
  blurret lysring, 50% større end originalen efter brugerens tidligere
  ønske), et helt app-bredt baggrundsbillede-system der ERSTATTEDE
  Scan-forsidens eget foto, og en kritisk hvid-skærm-hotfix (samme
  backtick-i-kommentar-fejlklasse som denne fil selv advarer om andetsteds).
  Løst ved en rigtig `git merge` (ikke en overskrivning): main's app-brede
  baggrundssystem (`.app-bg`) beholdes uændret for resten af appen,
  Scan-forsidens EGET baggrundsfoto genindføres specifikt på denne skærm
  (brugeren bad eksplicit om netop dette foto her), main's forstørrede
  knap-størrelse og `scanCtaBreathe`-åndedræt genbruges men med grøn fyld
  i stedet for hvid ghost-stil, og main's fjernelse af version/demo-pil
  respekteres. Fandt undervejs et reelt, ellers usynligt 1.75px-overlap
  mellem undertekst og knap på iPhone SE (button-forstørrelsen havde
  spist main's oprindelige sikkerhedsmargin) — rettet ved at flytte
  knappens `top`-position fra 46% til 48%. Fuld liste over hvad der blev
  auto-merget vs. manuelt reconcileret i `.claude/HISTORY.md`.
- **Opfølgning, samme dag:** brugeren testede den mergede version live og
  gav tre stykker feedback: knappen var for stor (main's 50%-forstørrelse,
  som lige var genbrugt ovenfor, blev IKKE ønsket af denne bruger — sat
  tilbage til de oprindelige `clamp(90px, 23cqh, 150px)`-mål), knappen
  pulserede ikke synligt, og baggrundsbilledet var tydeligt beskåret/ikke
  fuldt skærmdækkende. Undersøgt og rettet:
  - **Puls-klagen viste sig at være korrekt kode, ikke en bug** — verificeret
    direkte i den byggede app (ikke en hånd-mimic) via Playwright + et
    `--mode artifact-preview`-build (se `import.meta.env.MODE ===
    "artifact-preview"` i `OnboardingScreen.jsx` for login-bypass'en) og
    `element.getAnimations()`: begge animationer (`scan-halo-pulse`,
    `scanCtaBreathe`) rapporterede `playState:"running"` i den rigtige,
    bygget-og-serverede app. Mest sandsynlige forklaring på brugerens
    oplevelse: et skærmbillede kan i sagens natur ikke vise bevægelse, eller
    en forsinket PWA-service-worker-opdatering (se afsnit "Beta-installation"
    nedenfor for den kendte cache-mekanik) — IKKE en kodefejl. Fjern denne
    note hvis brugeren bekræfter det stadig ikke pulserer efter en hård
    genindlæsning.
  - **Baggrunds-beskæringen var en reel arkitekturbegrænsning**, ikke en bug:
    `<img>`-i-`.home-hero-frame`-tilgangen (fra PR #307/mergen) var af design
    begrænset til rummet MELLEM topbar og bundnav (samme calc-budget som gav
    hero-boksen sin definitive højde) — den nåede aldrig kant-til-kant bag
    barerne. Løst ved at flytte Scan-forsidens baggrundsfoto fra en `<img>`
    inde i hero-frame'et til et `app-bg-scan`-modifier-lag på selve
    `.app-bg` (samme mønster som main's app-brede baggrund allerede bruger,
    kun med et andet billede, betinget på `screen===SCREENS.HOME` i
    `App.jsx`) — genbruger dermed en allerede-bevist, fuldt-skærmdækkende
    teknik i stedet for at opfinde en ny. Kendt afvejning: `background-
    size:cover` kan beskære lidt i siderne på ekstreme skærmforhold (samme
    afvejning main's eget baggrundsbillede allerede accepterer) — men dette
    var eksplicit hvad brugeren bad om ("den skal jo dække hele skærmen"),
    så prioriteret over det tidligere "aldrig beskåret"-princip fra PR #307.
- Verificeret med Playwright-device-profiler (iPhone SE, iPhone 13) — nul
  overflow, ingen overlap/klipning, farver/puls/knap-type som beskrevet.

## Scan-forside, opfølgningsrunde — seks stykker design-feedback, design-only (25. sept. 2026)

**25. sept. 2026 — endnu en opfølgningsrunde (design-only, IKKE pushet/
merget, se Vercel-kvote-reglen ovenfor).** Brugeren gav seks stykker
feedback på den delte Artifact-preview:
- **Scan-knappen ~30% større** — clamp(90px, 23cqh, 150px) →
  clamp(117px, 30cqh, 195px) (+ tilsvarende ikon/tekst/halo/gap-mål) efter
  feedback om at knappen, appens vigtigste handling, føltes for lille/
  sekundær.
- **Mindre tom luft mellem knap og bund** — knappens `top` rykket fra 46%
  til 44%, Beta-information-fodens `top` rykket fra 71.5% til 65%.
- **Bundmenuen ændret til Indkøbsliste | Scan | Historik** — "Søg" fjernet
  fra bundnavigationen (brugerens begrundelse: søgning hører nu til inde i
  Indkøbsliste-skærmen, som allerede har en fuld, allergi-filtreret
  produktsøgning indbygget til "tilføj vare"-feltet). `SCREENS.SEARCH`
  er IKKE slettet — stadig et gyldigt route, stadig nået fra
  `SubmittedScreen.jsx`s "søg i stedet"-link, bare uden en dedikeret
  bundnav-plads længere.
- **Topbar-knapperne (?, Feedback, hamburger) forstørret** (32px→38px,
  Feedback-pillens padding øget) og farven skiftet fra `var(--muted2)` til
  det mørkere `var(--ink2)` + en let skygge (`var(--sh)`) — virkede "småt
  og anonymt ... næsten disabled" ved den forrige, lysere/mindre stil.
- **Undertekst-teksten ændret** til "Scan et produkt og se straks, om det
  matcher dine allergier." (fra "Scan en vare og få hurtigt svar om den
  passer til dine allergier.") — brugerens vurdering: den stærkere
  formulering.
- **Nyt `scanframe`-ikon** (`SharedComponents.jsx`) erstatter den bare
  `barcode`-ikon på CTA-knappen — fire scanner-hjørne-vinkler (samme
  visuelle sprog som det rigtige kamera-overlays hjørne-markører) omkring
  korte stregkode-barer, mere "peg og scan"-intuitivt end en ren stregkode.

Alle seks er rene design-/tekst-ændringer — committet lokalt på
feature-branchen, IKKE pushet/PR'et/mergt (se den stående Vercel-kvote-
regel i afsnit 4), og verificeret via en delt Artifact-preview i stedet.
Genverificeret med Playwright på iPhone SE/13/14 Pro Max efter ændringerne
— nul overflow, positivt mellemrum (83–122px) mellem knap og Beta-info-
knap på alle tre (en første, naiv programmatisk måling viste et falsk
"overlap" ved fejlagtigt at sammenligne knappens bund mod fod-CONTAINERENS
egen top i stedet for den faktisk synlige, bund-forankrede Beta-info-knap
selv — rettet ved at måle mod den rigtige knap-element, ikke dens
forælder-boks).

## Scan-forside, finjusteringsrunde — fem præcise justeringer, design-only (25. sept. 2026)

**25. sept. 2026 — endnu en finjusteringsrunde (design-only, IKKE pushet/
merget).** Fem præcise justeringer oven på forrige rundes ændringer:
- **Scan-knappen yderligere ~12,5% større** (clamp(117px, 30cqh, 195px) →
  clamp(132px, 34cqh, 219px), + tilsvarende ikon/tekst/halo/gap) — en
  mindre, mere præcis finjustering end forrige rundes ~30%.
- **Hilsen, hjælpetekst og scan-området flyttet 25px op** — `calc(27% -
  25px)` og `calc(44% - 25px)` i stedet for rene %-værdier, en bevidst FAST
  pixel-forskydning (brugeren bad specifikt om px, ikke en proportional
  flytning). Beta-information-foden er UÆNDRET (top:65%) — kun de tre
  navngivne elementer skulle rykkes.
- **Pulsen er nu KUN i halo-gløden, ikke på selve knappen** — `scanCtaBreathe`
  fjernet fra knap-wrapperen (var tilføjet forrige runde efter "må gerne
  pulsere så man får lyst til at trykke", men brugeren præciserede denne
  runde at kun haloen skal pulsere). Halo-pulsen selv er dæmpet og
  langsommere: skala 1→1.06 (var 1.12), opacity .7→.5 (var .8→.35), 4s
  (var 2.4s) — "en langsom, subtil puls".
- **Scanframe-ikonet, bundnavigationen (Indkøbsliste/Scan/Historik) og
  baggrundens afdæmpede intensitet er bevidst UÆNDREDE** — brugeren bad
  eksplicit om at bevare dem denne runde.
- Genverificeret på iPhone SE/13/14 Pro Max: nul overflow, positivt
  mellemrum (91–123px) mellem knap og Beta-info-knap,
  `element.getAnimations()` bekræftede halo-animationen kører og
  knap-wrapperen ikke længere har nogen animation.

## Produktresultatside, opfølgende omstrukturering — "FORBEDR PRODUKTSIDEN", to advarselsfarver + "Dine valg" (28. sept. 2026)

**Opfølgende omstrukturering, samme skærm — "FORBEDR PRODUKTSIDEN" (28.
sept. 2026, videreudvikling, ikke redesign).** Brugeren pegede på at
konklusionen stadig blev gentaget/modsagt flere steder (resultatkort +
"Relevant for dig" + "Passer til dine kostpræferencer" kunne vise
delvist overlappende eller ligefrem modstridende information). Løst ved
at forenkle til KUN to advarselsfarver og én samlet forklaringssektion:
- **RØD forbeholdt egentlige allergi-/intoleranceadvarsler** — allergi og
  intolerance er nu slået sammen ét sted (samme røde behandling overalt:
  topstatus, ingrediens-fremhævning, "Dine valg"), da begge er sundheds-
  relevante fund brugeren ikke selv har "valgt fra". `computeTopStatus`
  (helpers.js) har kun to advarselsniveauer nu i stedet for fire.
- **GUL/ORANGE for kostpræferencer og fravalgte E-numre** — et bevidst
  valg, ikke en sundhedsadvarsel, og skal derfor ikke alarmere som en
  allergi. Ny, eksakt headline "Passer ikke til dine valg" (var fire
  forskellige headlines afhængig af fund-type).
- **Konkrete årsager vises nu som chips/tags direkte i resultatkortet**
  (var en enkelt sammenkædet tekstlinje), plus en kort, konkret
  forklaringssætning udledt af det første fund (fx "Produktet indeholder
  mælkeprotein.") — ny `topExplanation`-beregning i ResultScreen.jsx.
- **"Relevant for dig" og "Passer til dine kostpræferencer" er fjernet
  helt**, erstattet af ÉN ny sektion **"Dine valg"** (`renderDineValg()`)
  med tre skjulbare underkategorier (Allergier & intolerancer/
  Kostpræferencer/E-numre & øvrige fravalg) — hver viser ALLE brugerens
  egne valgte allergener/diæter/E-numre, ikke kun dem der matcher, med
  ✓ (matcher ikke) / ✕ (matcher, konkret grund) / ? (kan ikke afgøres).
  Aldrig en overskrift der lover et bestemt udfald (fx "PASSER TIL DINE
  KOSTPRÆFERENCER") — kun neutrale kategori-navne. En lav-datasikkerheds
  "ok:true" fra `checkDietCompatibility` (vegan/vegetarisk/pescetarisk
  returnerer aldrig `ok:null`, kun lav `confidence`) nedgraderes bevidst
  til "?" her, så sektionen aldrig modsiger et gråt "utilstrækkelige
  data"-resultatkort ovenfor.
- **"Andre allergener i produktet" omdøbt til "Andre deklarerede
  allergener"** + rettet en reel bug: sektionen inkluderede tidligere
  ALLE `ALLERGENS`-entries uanset `type`, så en intolerance som
  "Laktoseintolerance" fejlagtigt blev listet som et allergen — filtreret
  til kun `type==="allergi"` nu.
- Ingrediens-fremhævningens hjælpetekst under listen forenklet til én
  sætning ("Fremhævede ingredienser er relevante for dine valg. Tryk for
  en kort forklaring.") — droppede den tidligere betingede "Fremhævet =
  allergen/relevant for dig"-skelnen som unødig kompleksitet.
- **Sideordnet fund, samme runde:** preview-mock-dataens "Sofie"-familie-
  medlem havde diæt-id'et `"vegetar"` i stedet for det korrekte
  `"vegetarian"` (DIETS' egen id, `constants.jsx`) — et klassisk felt-
  navne-mismatch (se afsnit 5's stående lektion) der gjorde ethvert
  diæt-tjek for hende stille `ok:null` ("Ukendt diæt") i stedet for reelt
  at tjekke — kun relevant for artifact-preview-demoen, ikke rigtige
  brugere (som vælger diæt via UI'et, hvor id'erne er korrekte), men
  rettet i samme omgang da den blokerede verifikation af netop
  diæt-brud-scenariet.
- Verificeret med Playwright (fem mock-produkter + profilskift til et
  familiemedlem med egen diæt/fritekst-allergi): grøn "Ingen advarsler
  fundet" uden andre bokse, rød "Allergi-advarsel" + navn-chip + korrekt
  "Andre deklarerede allergener" (uden intolerance-fejlen), grå
  "Ikke nok oplysninger" med "?" på hver enkelt valgt allergen (ikke kun
  et globalt banner), orange "Passer ikke til dine valg" + kostpræference-
  chip + forklaring + korrekt ✕-række i "Dine valg", og en diæt-OK-
  variant der kun viser ✓-rækker uden ekstra grønne bokse. `npm run
  build`/`npx vitest run` (109/109) grønne, mojibake-scan clean.

## EatSafe-logoet låst og implementeret konsekvent overalt (28. sept. 2026)

Brugeren delte det nu **endeligt godkendte** EatSafe-logo (mørk charcoal
stregkode-mærke med en integreret grøn scanlinje/checkmark) + en fuld
master-vektorpakke (SVG/PDF/PNG i alle nødvendige formater — bekræftet at
være den ægte kildefil, ikke kun et præsentationsbillede, før noget blev
implementeret). Opgaven var **konsekvent brug af ét fast asset**, ikke et
redesign — se `public/brand/README.txt` for den fulde master-pakkes indhold.

**Låste brandfarver (fra selve master-filerne, IKKE de omtrentlige "fx"-
farver brugeren nævnte i sin besked)** — bevidst ADSKILT fra appens egen
`--green:#0E8F5A`-designtoken (design-tokens.md), som forbliver uændret til
al almindelig UI (knapper, chips osv.). Logoets egen, faste palet:
- Mørk (bars/wordmark "Eat"): `#232528`
- Grøn (checkmark/wordmark "Safe"): `#039A55`, med en gradient
  `#70DC59 → #17BF55 → #039A55` i checkmark-stregen/prikken
- Off-white baggrund (app-ikon/favicon): `#FBFAF7`

**Nye faste assets:**
- `src/assets/logo/` — de aktivt brugte SVG'er (symbol/symbol-mono/
  horizontal/horizontal-mono), importeret som almindelige Vite-assets.
- `public/brand/` — hele master-pakken (alle SVG/PDF/PNG-varianter +
  README) lagt ud som downloadbar reference på `eatsafe.dk/brand/...`,
  jf. kravet om at "SVG/vector master" og "PNG-varianter" skal findes.
- **Ny delt komponent `EatSafeLogo`** (`SharedComponents.jsx`) —
  `variant="horizontal"|"horizontal-mono"|"symbol"|"symbol-mono"` + `size`
  (højde for horizontal, bredde=højde for symbol). Erstatter BÅDE den
  tidligere live-tekst-rekonstruktion ("Eat"+grøn "Safe" i DM Sans, brugt i
  topbar/velkommen/login) OG en tidligere håndtegnet inline-SVG med samme
  navn (9 tynde bars, andre farver) — begge var reelt egne fortolkninger,
  præcis det brugeren bad om at undgå ("ingen nye variationer eller
  AI-fortolkninger"). Bruges nu i: `OnboardingScreen.jsx`
  (velkommen/login — samme markup, fjernede den nu-overflødige separate
  tekst-wordmark ved siden af; onboarding-trin-header, kompakt `symbol`).
  **Undtagelse tilføjet 27. sept. 2026** (brugerens eksplicitte
  "Opdater EatSafe-headeren"-brief): app-headeren (`AppHeader.jsx`, se
  arkitektur-afsnittet) er bevidst gået tilbage til en ren tekst-wordmark
  ("Eat"=mørk/"Safe"=grøn, IKKE `EatSafeLogo`-billedet) i netop DENNE ene,
  kompakte kontekst — scanner-/stregkodesymbolet skal her udelukkende
  signalere selve scan-funktionen (Scan-knappen, bundnav), ikke indgå i
  brandingen i en header hvor pladsen er trang. `EatSafeLogo` (med det
  fulde symbol) er UÆNDRET alle andre steder (velkommen/login/onboarding/
  admin) — kun app-headeren er undtaget fra det ellers stadig gældende
  "ét fast billedaktiv, ingen nye tekst-fortolkninger"-princip.
  Admin-bundlet (`src/admin/AdminApp.jsx`/`AdminLayout.jsx`) importerer
  samme komponent fra `../SharedComponents.jsx` (allerede en fælles
  afhængighed via `showToast`/`ToastHost`, så ingen ny bundle-kobling).
- **App-ikon/favicon/manifest gendannet fra master:** `public/favicon.svg`
  (samme squircle-klip som før, men med det nye mærkes eksakte geometri/
  farver i stedet for den gamle 9-bar-tolkning), `icon-192/512(-maskable)
  .png` + `apple-touch-icon.png` gendannet ved at nedskalere den leverede
  1024×1024-master (samme billede bruges til "any" og "maskable" — den
  leverede paddings er allerede rigelig til Androids safe-zone-krav).
  `manifest.json`s `theme_color`/`background_color` og `index.html`s
  `theme-color`-meta opdateret til de nye låste farver; tilføjet et
  `og:image` (pegende på den nye horisontale logo-PNG i `public/brand/`)
  som ikke fandtes før.
- **Statiske sider** (`public/install.html`, `invite.html`, `privacy.html`)
  havde hver sin egen, let ANDERLEDES tekst-wordmark-kopi (bl.a. en
  omvendt "Eat=grøn/Safe=ink"-farvefejl i to af dem, modsat topbarens
  "Eat=ink/Safe=grøn") — alle tre erstattet med samme `<img>`-reference til
  `/brand/EatSafe_Master_Logo_Horizontal.svg`, så der nu kun findes ÉT
  visuelt udtryk for logoet på tværs af hele produktet, ikke fire-fem
  let-forskellige tekst-rekonstruktioner. `public/install.html` brugte
  allerede `icon-192.png` (nu automatisk opdateret) + separat tekst ved
  siden af — den separate tekst er fjernet, billedet dækker nu begge dele.
- **Bevidst UDEN for scope:** `public/eatsafe-dashboard.html` (en statisk,
  ikke-refereret fil — ikke det rigtige admin-panel, som er `src/admin/` +
  `admin.html` — verificeret ubrugt før den blev ladet urørt) og
  ProfileScreen.jsx/BetaIntroModal.jsx's løse "EatSafe Beta"-omtaler i
  brødtekst (ikke en visuel logo-gengivelse, bare produktnavnet i en sætning
  — et billede-logo inline i løbende tekst ville være forkert brug af et
  ordmærke).
- Verificeret med Playwright (artifact-preview-build): velkommen-, login-
  og onboarding-trin-skærme, topbar, admin-login, samt install/invite/
  privacy-siderne (alle tre, inkl. install.html's iOS-guide via enheds-
  emulering, da ikke-iOS-brugeragenter omdirigeres til den rigtige
  produktions-URL uden for sandboxens netadgang) — alle viser nu identisk
  logo-geometri/-farver. Favicon.svg renderet standalone og bekræftet
  pixel-identisk med app-ikonets proportioner. `npm run build`/
  `npx vitest run` (109/109) grønne, mojibake-scan clean.

## Bugfix: hamburgermenuen forblev åben oven på velkomstsiden efter logout (28. sept. 2026)

Bruger-rapporteret fund: "Log ud" i hamburgermenuen (`ProfileMenu.jsx`)
sendte korrekt brugeren til velkomstsiden, men selve menu-overlayet/
draweren blev stående åbent ovenpå. Rodårsag: `handleItemClick` kaldte
`item.action()` (her `clearAuth` fra `AuthContext`) direkte uden nogensinde
at kalde `onClose()` — `showProfileMenu`-state'en i `App.jsx` (der styrer
hele overlayets rendering) var derfor helt afkoblet fra selve auth-state-
ændringen. Screen-skiftet til `SCREENS.WELCOME` virkede fint (topbar/
bundnav er allerede korrekt gatet på `isOnboard`), men menuens egen
`showProfileMenu`-boolean blev aldrig rørt.

**Rettet i to lag** (én synkron fix for selve knappen + ét sikkerhedsnet
for alle andre logout-veje, som brugeren eksplicit bad om):
1. `ProfileMenu.jsx`s `handleItemClick` kalder nu `onClose()` FØR
   `item.action()` køres for ethvert action-baseret menupunkt (ikke kun
   "Log ud") — sker synkront i samme klik-handler som `clearAuth()`, så
   React batcher dem til ét render. Intet mellemliggende frame hvor
   velkomstsiden vises bag en stadig åben menu.
2. `App.jsx`s eksisterende "ryd familie/historik/indkøb når `accessToken`
   bliver null"-effekt udvidet til også at nulstille `showProfileMenu` —
   et sikkerhedsnet for de andre steder `clearAuth()` kaldes fra
   (session-udløb/tvungen refresh-fejl i `useAuth.js`, admin-401-logout i
   `useAdmin.js`, Indstillinger-skærmens egen log ud-knap), hvor menuen i
   teorien kunne stå åben når auth-state ændres i baggrunden, ikke kun via
   et direkte klik i selve menuen.

Browser/enheds-"tilbage" efter logout er allerede korrekt (ikke rørt) —
appen bruger ikke en per-skærm browser-historik (`screen` er almindelig
React-state), kun ét fast "app"-history-anchor der genpushes ved hvert
`popstate` for at fange Android-tilbageknappen (se afsnittet om det
længere nede) — der er derfor intet reelt "tidligere autentificeret
side"-historik-punkt at navigere tilbage til.

Verificeret med Playwright: åbn menu → "Log ud" → menuen/overlayet/
bundnavigationen er alle væk med det samme, velkomstsiden vises ren; login
igen → menuen starter lukket; gentaget logout-cyklus (åbn menu → log ud →
log ind igen) to gange i træk uden at menuen nogensinde forbliver åben.
`npm run build`/`npx vitest run` (109/109) grønne, mojibake-scan clean.

## Velkomstside — "FINAL POLISH", produktionsklar finish (28. sept. 2026)

En detaljeret 12-punkts "FINAL POLISH"-spec til `SCREENS.WELCOME` —
videreudvikling af eksisterende layout/logo/baggrund/CTA-struktur, ikke et
redesign. Alle ændringer i `OnboardingScreen.jsx` (kun WELCOME-blokken,
LOGIN/ONBOARD urørt) og `theme.jsx`s `.welcome-*`-regler, plus én ny
statisk side.

- **Lodret balance (krav 1):** `.welcome-screen` brugte `justify-content:
  center`, som altid deler ledig plads 50/50 over/under indholdet —
  brugerfeedback var "en anelse for meget tom plads over hero-indholdet".
  Erstattet af to usynlige spacer-`div`er (`.welcome-vspace-top/-bottom`)
  med ULIGE flex-grow-vægt (0.62:1) i stedet for selve `justify-content`
  — fordeler ledig plads ca. 38/62 (top/bund), skalerer proportionalt på
  tværs af enhver skærmhøjde, og krymper begge til ~0 på den mindste
  iPhone (SE-klasse), hvor der ikke er ledig plads at fordele i forvejen.
  Lodret padding sat ned 48px→20px (spacers giver resten af luften).
- **Hovedbudskab (krav 2):** "...om de matcher dine allergier." → "...om
  de passer til dine allergier og kosthensyn." — `.welcome-tagline`s
  `max-width` øget 280px→300px for pænere linjebrud ved den længere tekst.
- **De tre benefits (krav 3) — reelt fund:** "Tjek allergener" og
  "Tryggere indkøb" brød begge over to linjer ved den gamle kolonnebredde
  (100px cap), mens "Hurtigt svar" stod på én — en synligt ujævn række.
  Målt præcist med Playwright (reelle DM Sans-tekstbredder, ikke gæt):
  løst med `.welcome-benefits` gap 22px→14px + `.welcome-benefit`
  max-width 100px→130px + `.welcome-benefit-label` font-size 13px→12px
  (mindste nødvendige kombination for at alle tre står på én linje ved
  standard iPhone-bredde, som kravet selv beder om at prioritere frem for
  at gøre hele rækken mindre). "Tryggere indkøb" omdøbt til "Lettere
  indkøb" — kortere tekst der reelt kan stå på én linje, og undgår et
  kategorisk sikkerhedsløfte ("Tryggere") appen ikke fuldt kan indfri.
- **CTA-polish (krav 4/5):** `.welcome-btn`/`.welcome-btn-ghost`
  border-radius 14px→16px (matcher hinanden, som krævet), `.welcome-btn`s
  skygge dæmpet (opacity/blur skåret ned — "subtil og premium, ikke
  kraftig"), `text-align:center` gjort eksplicit, indbyrdes spacing
  10px→12px. Bredde/radii var allerede identiske mellem de to knapper.
- **Juridisk tekst (krav 6/7) — ny side oprettet:** "handelsbetingelser"
  var bevidst IKKE et link før nu (ingen side fandtes) — brugeren bad
  eksplicit om at få en oprettet i denne omgang. Ny `public/terms.html`
  (samme stil/struktur som `privacy.html`) med en tydeligt markeret,
  amber "foreløbig/ikke juridisk gennemgået"-boks øverst — genuint
  generisk placeholder-indhold, IKKE juridisk godkendt tekst; skal
  erstattes af rigtigt indhold før det bruges retligt bindende. Teksten
  omformuleret til "...accepterer du vores handelsbetingelser og
  bekræfter, at du har læst privatlivspolitikken" — adskiller bevidst
  "acceptér vilkår" fra "bekræft at have læst privatliv", og er EKSPLICIT
  IKKE samtykke til behandling af allergi-/helbredsoplysninger (det sker
  separat, senere i selve onboardingen). Begge ord er nu rigtige links.
  Visuel polish: farve `--muted`→`--ink2` (bedre kontrast mod det aktive
  food-baggrundsbillede), font-size 11px→11.5px, line-height 1.6→1.65,
  ny `max-width:290px` for pænere linjebrud, margin-top 16px→22px for
  bedre rytme-adskillelse fra CTA-klyngen ovenfor.
- **Feedback-knap (krav 8) — reelt fund:** onboarding-udgaven af
  Feedback-knappen (adskilt fra den autentificerede topbar-udgave) brugte
  `top:12` uden `env(safe-area-inset-top)` (risiko for kollision med
  statuslinje/Dynamic Island på notch-enheder) og en selvstændig, hardkodet
  skygge i stedet for appens delte `var(--sh)`-token. Begge rettet.
- **Baggrund/kontrast (krav 9):** ingen ændring af selve `.app-bg`
  (baggrundens karakter skal bevares) — kontrastløftet for hovedbudskab/
  benefits/CTA'er var allerede tilstrækkeligt via eksisterende
  `--ink`/hvide kort-baggrunde; kun den juridiske teksts farve/kontrast
  var reelt utilstrækkelig (se krav 7 ovenfor).
- **Vertikal rytme (krav 10):** gennemgået hele sekvensen logo→
  hovedbudskab→benefits→primær CTA→sekundær CTA→juridisk tekst — bevidst
  AFTAGENDE mellemrum ned gennem hierarkiet (fra ~44px mellem logo og
  benefits til ~22px før juridisk tekst) i stedet for identiske
  pixel-mellemrum overalt, som ville virke mekanisk; ingen sektion
  målt/vurderet som klemt eller løsrevet.
- Verificeret med Playwright på alle fire krævede enhedsstørrelser (mindre
  iPhone/SE-klasse 320×568, standard iPhone 390×844, stor iPhone/Pro
  Max-klasse 430×932, Dynamic Island-klasse 393×852): alle tre benefits på
  én linje på standard-bredde, ingen beskårne labels/knapper/juridisk
  tekst, og — reelt fund undervejs — den i forvejen eksisterende, minimale
  overflow på SE-klassen (~12px, eksisterede allerede FØR denne omgang på
  grund af `min-height:100vh`+indhold der samlet er højere end skærmen)
  blev ikke forværret af den nu længere juridiske tekst, takket være den
  reducerede lodrette padding — tværtimod forbedret til ~6px. `npm run
  build`/`npx vitest run` (109/109) grønne, mojibake-scan clean (fangede
  undervejs en reel byggefejl: en backtick i en CSS-kommentar inde i
  `theme.jsx`s `appCss`-template-literal brød selve JS-syntaksen — samme
  fejlklasse denne fil selv advarer om andetsteds, rettet før commit).

## MASTER PROMPT — visuelt system og polering af hele EatSafe-appen, PR-for-PR-detalje (27. sept. 2026)

Bjørn gav en stor, 14-punkts "MASTER PROMPT"-brief: mål er stringens/
konsistens/10/10-polish på tværs af HELE appen — eksplicit IKKE et
redesign, EatSafe-identiteten/lys food-baggrund/afrundede kort/venlige
tone/nuværende grønne retning skal bevares. Arbejdet batches i flere PR'er
efterhånden som dele bliver færdige og godkendt til push, ikke i én stor
omgang — se punkt-for-punkt-status herunder, opdatér listen efterhånden.

**Delvis shippet (PR #359, merget):**
- **Nyt 2-grønt farvesystem** — `--green` er nu `#0F7D4F` (primær
  handlingsfarve: knapper, aktive toggles/tabs/faner, CTA'er, herunder
  Scan-knappen), superseder den tidligere ENE-grønne lås fra 25. sept.
  (`#0E8F5A`). Ny, adskilt `--green-accent:#34D06A` — KUN til små positive
  mikro-elementer (checkmarks, safe-badges/dots, kamera-scan-reticle/
  laser-linjen i ScannerScreen.jsx via `--green-logo`) — må ALDRIG bruges
  til knapper/aktive tilstande. Se `.claude/rules/design-tokens.md` for
  den fulde, opdaterede token-tabel. Logo-SVG'ernes egne, indbyggede
  farver (fast brandasset, se logo-afsnittet ovenfor) er bevidst urørt.
  Checkmark-ikonet i `.chip-check` skiftet fra hvid til `--ink`, da hvid
  på den lysere accent-grøn kun gav 2.02:1 kontrast (under WCAG's
  3:1-minimum for UI-grafik) — `--ink` giver 8.28:1.
- **Brand-slogan "Mere tryghed i hverdagen"** — ny delt `.brand-slogan`-
  CSS-klasse, bevidst lille/muted/bred letter-spacing (læses som en rolig
  signatur, ikke en overskrift). Placeret KUN to steder: under logoet på
  velkomstsiden, og i "Om EatSafe"-kortet i Indstillinger — IKKE gentaget
  på andre skærme eller i topbaren, jf. brief'ens eksplicitte "aldrig fast
  gentagelse".
- **Disclaimer-audit** — bekræftet at den foretrukne ordlyd ("EatSafe er
  vejledende. Kontrollér altid produktets aktuelle ingrediens- og
  allergenoplysninger.") allerede findes korrekt ét sted (ResultScreen.jsx,
  fra en tidligere runde) — ingen ændring nødvendig der. Fjernet den
  eksplicit frarådede formulering "ved alvorlige allergier" to andre
  steder (opskrift-indsendelsens write-only disclaimer-felt i
  useRecipes.js, terms.html). Øvrige "vejledende/tjek altid"-tekster
  (Viden-siden, BetaIntroModal, onboarding-diæt-tjek, Opskrifter) er
  bevidst urørte — hver dækker sin egen, ikke-overlappende kontekst.

**Shippet (PR #360, merget):** design-reviewer-agent-audit af typografi/
spacing/komponentkonsistens på tværs af Historik/Indkøbsliste/Madpas/
Indstillinger/Profil/Produktsider — Historik/Favoritter flyttet fra en flad
divider-række til samme bordered-card-stil som Indkøbslistens `.list-item`
("Historik skal føles som søster til Indkøbsliste"), to nye SVG-ikoner
(`door`, `building`) erstattede emoji-som-UI-chrome i RestaurantGuide-
Screen.jsx/ResultScreen.jsx/RecipesScreen.jsx, titel-typografi rettet for
"tilbageknap + titel"-mønsteret (18px→16px, matcher `.screen-title`), to
touch-target-bugs rettet i ListScreen.jsx. Fandt undervejs at
`SCREENS.RESTAURANTGUIDE` ikke har nogen navigations-indgang i den
nuværende UI (fjernet fra ProfileMenu.jsx på et tidspunkt, ikke erstattet)
— IKKE rettet (produkt-/navigationsbeslutning, ikke en styling-fix), flaget
til brugeren.

**Shippet (PR #361, #362, merget):** velkomstside-finpolish i tre runder —
lodret rytme (slogan→hovedtekst-afstand, line-height/font-weight),
Feedback-knappens skygge/kant gjort mere diskret (to omgange), og den
juridiske teksts linjebrud rettet to gange (først "handelsbetingelser"→
"brugsvilkår" + halevedhæng så selve linket aldrig ender alene på en
linje, derefter max-width/font-size finjusteret empirisk til præcis 3
jævnt fyldte linjer på SE/iPhone 13/Pro Max).

**Shippet (endnu ikke pushet — se nedenfor):** "FINAL 10/10 POLISH – OPRET
KONTO & LOG IND", se eget afsnit under "Opret konto/Log ind" nedenfor.

**Resterende (ikke startet, fortsættes i en senere PR):** navigation/
topbar/bottom-nav-gennemgang (stikprøve viste allerede konsistente,
enkeltstående komponenter — ingen fund udover RestaurantGuide-fundet
ovenfor), mikrocopy-gennemgang, tilgængelighedstjek, og en afsluttende
cross-page-visuel-konsistens-sammenligning. De fleste af brief'ens punkter
om Scan-flow/Produktside/Indstillinger-struktur er allerede dækket af
tidligere, separate runder (se de respektive afsnit ovenfor).

## Opret konto & Log ind — "FINAL 10/10 POLISH" (27. sept. 2026)

En detaljeret 10-punkts spec til `SCREENS.LOGIN` (Ny bruger + Log ind) —
konsistens/validering/sidste polish, ikke et redesign. Ændringer i
`useAuth.js`, `OnboardingScreen.jsx`, `App.jsx`.

- **Felt-specifikke fejl standardiseret** — to nye delte states
  (`emailError`, `passwordError`, useAuth.js) erstatter den tidligere
  praksis hvor `authError` (den globale error-boks) blev brugt til BÅDE
  felt-specifikke valideringsfejl (tom/ugyldig e-mail, for kort password)
  OG reelle globale fejl. Nu vises felt-fejl inline direkte under det
  relevante felt, med en diskret rød kant på selve inputtet, PÅ BEGGE
  faner (samme spacing/design). `authError` (den store boks, `ErrorMessage`
  i DesignSystem.jsx — returnerer `null` og fylder intet når tom) er nu KUN
  for fejl der ikke kan knyttes til ét felt: "E-mail eller adgangskode er
  forkert." (login), "Der opstod en fejl. Prøv igen." (alt andet uventet),
  "Bekræft din e-mail..." (email ikke bekræftet endnu), "Tjek din e-mail og
  klik på bekræftelseslinket..." (signup uden access_token).
  **Reelt fund undervejs:** de gamle catch-blokke gjorde
  `setAuthError(e.message || "...")`, hvilket i praksis kunne lække rå,
  tekniske fetch-/JS-fejltekster (fx "Failed to fetch") direkte til
  brugeren ved en ægte netværksfejl — opdaget under Playwright-verifikation
  med en mocket serverfejl. Rettet ved ALDRIG at propagere `e.message` fra
  en catch-blok; kun de eksplicit satte, venlige faste beskeder vises.
- **"Har du allerede en konto?"/"Har du ikke en konto?"-linkene fjernet**
  fra begge faner — segmenteret kontrol (`.tab-row`) øverst er nu den
  eneste sekundære navigation mellem de to auth-tilstande, som brugeren
  bad om.
- **Segmenteret kontrol** — verificeret identisk (bredde/højde/aktiv-
  farve/font-weight/radius, målt programmatisk) mellem Ny bruger og Log
  ind; skifter ikke layout ved tab-skift.
- **Legal copy på Ny bruger rettet** — "...bekræfter, at du er over 13 år"
  (intet alderskrav findes reelt nogen andre steder i appen) erstattet med
  samme ordlyd/links som velkomstsidens tilsvarende tekst ("brugsvilkår" +
  "privatlivspolitikken", begge klikbare, samme "ikke samtykke til
  helbredsoplysninger"-forbehold).
- **Ny, altid synlig adgangskode-hjælpetekst** under Ny brugers password-
  felt ("Adgangskoden skal være mindst 10 tegn.", muted grå) — erstattet
  af samme tekst i rød/fed ved et mislykket forsøg, ingen dubleret linje,
  intet layout-hop (linjen er der altid, kun farven/vægten skifter).
- **CTA'er og sociale login-knapper** — verificeret programmatisk 100%
  identiske (højde/bredde/radius/skygge/font-size/baggrund) mellem
  Opret/Log ind-knapperne og mellem Google/Facebook-knapperne; bruger
  allerede EatSafes låste primære UI-grøn (`.welcome-btn`-klassen, delt med
  velkomstsidens CTA).
- **Ikke implementeret, flaget til brugeren:** "Fortsæt med Apple" — spec'en
  bad om det, betinget på om EatSafe skal distribueres via App Store/
  TestFlight med social login som primær login-metode (Apples App Review
  Guideline 4.8). Dette blev allerede tilføjet og bevidst fjernet igen
  samme dag i en tidligere runde (25. sept. 2026, se `.claude/HISTORY.md`)
  — en reel Apple-OAuth-integration kræver et Apple Developer-konto-setup
  og Supabase-provider-konfiguration, ingen af delene tilgængelige fra
  denne session, og er under alle omstændigheder en produktdistributions-
  beslutning, ikke en ren styling-opgave. Afventer brugerens afklaring.
- **Reel bug fundet og rettet undervejs:** tab-skiftets onClick-handlers
  kaldte stadig `setForgotPwError("")` — en lokal state der blev fjernet
  som led i konsolideringen til den delte `emailError` (samme "Indtast din
  e-mail først."-besked dækkede både "Glemt adgangskode?" uden e-mail OG
  det nye tom-email-ved-login-tjek). Ville have kastet en `ReferenceError`
  i konsollen ved hvert tab-skift — fundet ved gennemlæsning af egen diff,
  ikke af Playwright (en synkron JS-fejl i en klik-handler stopper ikke
  altid synligt UI-flow, så det er let at overse uden at læse koden
  igennem). Rettet til `setEmailError("")`/`setPasswordError("")`.
- Verificeret med Playwright på tre enhedsbredder (SE/iPhone 13/Pro Max):
  alle 10 kombinationer af tom/ugyldig e-mail, tom/for kort adgangskode på
  begge faner, ingen JS-konsol-fejl ved tab-skift, ingen stale fejl der
  overlever et tab-skift. `npm run build`/`npx vitest run` (110/110, 3 nye
  tests for de nye felt-fejl-cases) grønne, mojibake-scan clean.
- **Shippet (PR #363, merget).**

## Onboarding trin 1 ("Hvem er du?") — "FINAL 10/10 POLISH" (27. sept. 2026)

10-punkts spec til onboardingens trin 1 (Navn/E-mail/Telefon/Alder/Køn) —
konsistens/validering/polish, alle felter bevaret, intet redesign.
Ændringer i `OnboardingScreen.jsx` (renderStep1), `FormFields.jsx`
(AgeStepper), `DesignSystem.jsx` (ChoiceCard) og `theme.jsx`.

- **Hjælpetekst rettet** — "bruges til din personlige allergiprofil"
  antydede fejlagtigt at ALLE felter her er nødvendige for allergi-logikken
  (kun allergier/diæter, indsamlet på senere trin, er det reelt) — ændret
  til "bruges til at opsætte din profil og kan ændres senere."
- **E-mail-feltets read-only-tilstand rettet** — brugte tidligere
  `opacity:.6`, samme visuelle "dæmpet"-signal som et disabled/fejlramt
  felt, præcis det brugeren bad om at undgå. Erstattet med en let, positiv
  grøn baggrundstone (`--green-lt`/`--green-mid`, samme par som appens
  øvrige "gemt/aktiv"-tilstande) + fuld tekstkontrast + en tydelig
  undertekst ("Allerede gemt fra din konto" / "Bekræftet via Google" for
  OAuth) — vises nu for BEGGE tilfælde (var kun OAuth før), ikke kun
  opacity-dæmpning.
- **Telefonnummer fik reel formatvalidering** — krævede tidligere kun et
  ikke-tomt felt, uanset ciffer-antal. Nu præcis 8 cifre (dansk mobilnummer-
  længde), med to adskilte fejltekster (tom vs. forkert længde). Tallene
  grupperes automatisk parvis mens man skriver ("12 34 56 78", samme format
  som placeholderen allerede lovede men det indtastede tal ikke fulgte).
- **Alder-stepperen finpudset** — minus/værdi/plus har nu alle præcis 44px
  højde (var 40px på knapperne, en upræcis, ikke-eksakt højde på inputtet)
  — matcher desuden 44×44pt-tap-måls-minimummet, som knapperne var under.
  Værdien i midten fik større/federe skrift (matcher knappernes egen
  vægt) i stedet for almindelig felt-tekst, så den ligner en aktiv værdi,
  ikke "død" input-tekst. Ny `.age-step-btn:active`-CSS-klasse giver en
  tydelig tryk-feedback, som de rå inline-stylede knapper ikke havde før.
  Deles med `MemberForm.jsx` (samme komponent), så familie-trinnet får
  samme forbedring automatisk.
- **Køn-vælgeren (ChoiceCard) fik et diskret checkmark** ved valgt-state —
  havde kun farve før; matcher nu samme "grøn baggrund/kant/tekst + lille
  check"-mønster som chip-baserede vælgere andre steder i onboardingen.
- **Felt-specifikke fejl** — hvert felt (Navn/Telefon/Alder/Køn) viser nu
  sin egen inline fejltekst direkte under sig selv efter et forsøgt
  "Fortsæt →" (samme mønster som Opret konto/Log ind-skærmens felt-fejl,
  se ovenfor), i stedet for én samlet "Mangler: ..."-sætning nederst
  (fjernet). "Vil ikke oplyse" opfylder fortsat køn-feltets krav.
- **Progress-bar (5 segmenter + "1/5")** — verificeret programmatisk
  allerede perfekt: alle segmenter samme bredde/vertikale position, aktivt
  segment bruger `--green` (den låste primære grøn), resterende bruger en
  neutral grå (`rgba(21,32,26,.16)`) — ingen ændring nødvendig, kun
  bekræftet.
- CTA'ens `softDisabled`-mønster (klikbar men dæmpet indtil alle felter er
  gyldige, så første forsøg stadig kan udløse felt-fejlene) er UÆNDRET —
  allerede korrekt implementeret fra en tidligere runde.
- Verificeret med Playwright på tre enhedsbredder (SE/iPhone 13/Pro Max):
  tomt/delvist/fuldt udfyldt skema, forkert telefonlængde, alder-steppens
  44px-højde bekræftet målt, progress-bar-alignment bekræftet målt, ingen
  JS-fejl. E-mail-feltets prefillede/read-only visning kunne ikke
  fotograferes direkte (kræver en reel post-signup/OAuth-session, som ikke
  lod sig mocke pålideligt gennem sandboxens netværksproxy denne gang) —
  verificeret ved kodegennemgang i stedet: den eksisterende, uændrede
  `loginEmail || isOAuth`-betingelse styrer stadig hvornår feltet er
  read-only, kun de resulterende stil-værdier er ændret.
  `npm run build`/`npx vitest run` (110/110) grønne, mojibake-scan clean.

## App-headeren omdøbt til fælles komponent + tekst-wordmark (27. sept. 2026)

Brugerens eksplicitte "Opdater EatSafe-headeren"-brief, 7 punkter — mål:
tydeligere, mere professionel, 100% konsekvent header på tværs af appen.

- **Scanner-/stregkodeikonet fjernet fra header-brandingen** — headeren
  viste tidligere det fulde, låste `EatSafeLogo`-billedeaktiv (stregkode-
  symbol + ordmærke). Nu udelukkende en ren tekst-wordmark ("Eat" i
  `--ink`, "Safe" i `--green`), ca. 20-25% større (24px, op fra
  billedlogoets ca. 22px visuelle højde), semibold/bold vægt. Scanner-
  ikonet er UÆNDRET alle de steder det reelt betyder "scan" (den store
  Scan-knap, bundnavigationen) — kun fjernet fra selve branding-teksten.
  `EatSafeLogo`-komponenten og dens SVG-assets er urørte og bruges
  uændret på velkommen/login/onboarding/admin (se logo-afsnittet ovenfor
  for den fulde begrundelse for denne bevidste undtagelse).
- **Ny, navngiven, genbrugelig komponent `AppHeader.jsx`** — udtrukket fra
  App.jsx's tidligere inlinede `<header className="topbar">`-blok (samme
  markup/adfærd, nu et navngivet, selvstændigt sted). Renderes ÉT sted i
  App.jsx (var allerede tilfældet før udtrækket) og vises derfor allerede
  identisk på Scan/Historik/Indkøbsliste og alle øvrige hovedfaner — verificeret
  programmatisk pixel-identisk (samme højde/positioner for logo/BETA/
  Feedback/hamburger) på tværs af de tre testede skærme.
- **BETA-badge** flyttet fra inline styles til en delt `.topbar-beta`-
  klasse — samme varme/guldbrune (`--amber`) farve, nu med `line-height:1`
  + `inline-flex`-centrering, så den centrerer sig lodret mod tekstlogoet
  uden en manuel `marginTop`-hack (den tidligere hack kompenserede
  specifikt for billedlogoets egen indre luft, unødvendig med en tekst-
  wordmark). Målt: badgens og logoets lodrette centre ligger under 1px fra
  hinanden.
- **Manglende `safe-area-inset-top`-håndtering rettet** — `.topbar` havde
  ingen som helst hensyntagen til statuslinjen/Dynamic Island (kun
  onboardingens separate, flydende Feedback-knap havde det). Tilføjet
  `calc(12px + env(safe-area-inset-top))` som topafstand.
- **Punkt 6 (undersider) bevidst IKKE ændret i denne omgang** — brief'ens
  ordlyd her var vejledende ("kan erstattes... hvis det giver bedre
  navigation"), ikke et krav. Eksisterende undersider (Allergileksikon,
  Restaurantguide, Opskrifter m.fl.) har allerede deres egen "tilbageknap +
  titel"-række UNDER den fælles header, uændret — en større omlægning af
  hvordan alle undersiders navigation fungerer er en selvstændig, større
  opgave, ikke en del af denne header-branding-runde.
- Verificeret med Playwright: header pixel-identisk på Scan/Historik/
  Indkøbsliste, ingen barcode-ikon i header-brandingen nogen steder,
  hero-billede/"God morgen"-hilsen/undertekst/grøn Scan-knap/bundnavigation
  alle bekræftet UÆNDREDE, header renderer korrekt (inkl. hamburgerens
  aktiv-prik) på en underside (Allergileksikon) uden konflikt med dens
  egen back-button-række. `npm run build`/`npx vitest run` (110/110)
  grønne, mojibake-scan clean.


---

# Arkiv fra CLAUDE.md-oprydning (2. okt. 2026)

Flyttet ordret ud af CLAUDE.md for at spare tokens ved hver sessionsstart. Nutidstilstanden står i den nye, korte CLAUDE.md.

## Gammel afsnit 0 (åbne punkter, audit-, notifikations- og mailhistorik)

## 0. Topprioritet til næste session (opdateret 30. sept. 2026)

**Start her: åbne punkter pr. 30. sept. 2026.** Nævn listen kort for Jan,
når sessionen starter, og spørg hvad der skal tages først. Detaljerne står
i afsnittene under listen. Opdatér listen, når et punkt er klaret.

*Sat på pause (Jan, 30. sept.):*
3. Testrunden på rigtige telefoner med tjeklisten
   https://claude.ai/artifact/1YwwF252KhrCAWrgSssw1X (deling med Bjørn).

*Venter på Jans beslutning:*
9. Leaked Password Protection kræver Supabase Pro (se nedenfor). Jan: vent.

**Fælles to do-liste (1. okt. 2026):** Jan og Bjørn deler en to do-liste i admin-panelet, fanen **To do** på
`eatsafe.dk/admin.html` (tabellen `admin_todos`, se `src/CONTEXT.md` afsnit 15). Den er fyldt med de åbne punkter herfra. Brug den som
den primære liste: læs den ved sessionstart (`select title, status, priority, track, due_date from admin_todos where status <> 'done'`),
afslut punkter (`status = 'done'`), og opret nye, når der opstår opgaver. Listen herunder er kun et øjebliksbillede.
**Tickets ligger også på listen (1. okt. 2026):** hver ny ticket bliver automatisk en opgave med ansvarlig og prioritet, og
status følger med begge veje (afslut det ene sted, og det er afsluttet begge steder). Se `src/CONTEXT.md` afsnit 15.

*Todo (Jan, 30. sept.):*
13. Admin-visning til tilbagekaldelser uden gyldig EAN er lavet 1. okt. 2026
    (fanen **Tilbagekald**, RPC `admin_resolve_recall`, se `src/CONTEXT.md` afsnit 14).

*Skal designes (Bjørns spor):*
11. Supabases auth-mails på dansk i EatSafes stil. **Confirm sign up er
    lavet (Bjørn, 30. sept.)**, og 1. okt. er de øvrige fem skabeloner
    (`recovery`, `invite`, `magic_link`, `email_change`, `reauthentication`)
    skrevet som udkast i samme stil i `supabase/templates/auth/` — Bjørn skal
    gennemse dem. **Send Email Hook er slået til (1. okt.):** `auth-send-email`
    sender alle auth-mails via Resends API med disse skabeloner; glemt-
    adgangskode-mailen er verificeret (afsnit 16 i `src/CONTEXT.md`).
    `deploy-auth-templates.yml` kører kun manuelt siden 2. okt. (tilbagerulning;
    nøglen mangler rettigheden til at skrive auth-konfiguration), og hook'en bruger ikke nøglen. **Skærmen
    "Vælg ny adgangskode" (`ResetPasswordScreen.jsx`, `SCREENS.RESETPASSWORD`) er
    lavet 1. okt. (kræver merge): nulstillingslinket (`#type=recovery`) åbner den,
    og først derefter kommer brugeren ind i appen. Under Security findes desuden valgfrie notifikationer
    (fx Password changed, slået fra i dag; hook'en springer dem over).

*Arkitektur-audit (30. sept. 2026):* rapport i
https://claude.ai/artifact/8sj2uZhFSYy18iVV1upuAL (16 fund + roadmap).
De tre største risici: ingen backups (Free), skemaet ikke versionsstyret i
repoet (0 migrationsfiler), intet testmiljø. Tre åbne INSERT-politikker
blev lukket under auditten (`supabase/sql/2026-09-30_drop_open_insert_policies.sql`).
**Ny stående regel:** databaseændringer køres som migration (`apply_migration`)
OG gemmes som fil i repoet i samme omgang, aldrig kun som løs SQL.

*Audit-plan, besluttet af Jan 30. sept.:* Supabase Pro = senere (backups,
testmiljø og Leaked Password Protection venter); fejlovervågning = egen
fejltabel i Supabase (ingen tredjepart); feedback uden login beholdes med
en grænse via edge-funktion; opdeling af ProfileScreen/App.jsx først når
Bjørn ikke har åbent arbejde (tjek hans PR'er/branches). Rækkefølge:
1 skema-baseline i `supabase/migrations/`, 2 tests for allergenmotoren
(fælles kode i `_shared`), 3 fejltabel + visning i admin, 4 feedback-
grænse, 5 fjern anon-rettigheder på login-tabeller, 6 edge-deploy fra
repoet via GitHub Action (Jan opretter Supabase-adgangsnøgle som secret),
7 `npm audit fix`, 8 opdeling. Detaljer i rapporten ovenfor.

**Status 30. sept.: alle 8 er lavet** (commits "A1"–"A8"). Databasedelen
er allerede live; app-delen kræver merge. Resultat, kort:
- Migrationer ligger i `supabase/migrations/` (baseline + nye), se README
  der. Nye ændringer: `apply_migration`, derefter filen med den version,
  `list_migrations` viser.
- Allergenmotoren bor i `supabase/functions/_shared/allergenEngine.js`
  (testet i `src/allergenEngine.test.js`).
- Fejl fra appen lander i tabellen `client_errors` (RPC
  `log_client_error`, `src/errorReporter.js`) og vises i admin-panelet
  under "Fejl". E-mail-triggerne logger også dertil. Undervejs rettet:
  mailen om godkendt/afvist indsendelse blev aldrig sendt.
- Feedback går via edge-funktionen `feedback` (grænser: 5/time pr.
  afsender og 60/time i alt uden login, 20/time med login).
- Anon har ingen rettigheder til login-tabellerne, og storage-upload
  kræver login (kun `recipes/`).
- `.github/workflows/deploy-edge-functions.yml` deployer ændrede
  funktioner ved merge. `supabase/config.toml` har verify_jwt for alle 20.
- ProfileScreen er delt i seks skærmfiler; App.jsx har fået
  `useAdminTools`, `useIncomingLinks`, `useLoadUserData`.

**Afsluttet 30. sept.:** merget i #411 og #412 (Node 22 i deploy-workflowet).
Secret'en `SUPABASE_ACCESS_TOKEN` virker; første deploy gav `allergens` v23
og `feedback` v2, verificeret live. Den gamle direkte INSERT i
feedback_tickets er lukket (migration `20260930100707`). Adgangsnøglen
udløber efter den periode, Jan valgte; når deploy-jobbet fejler med 401/403,
skal der laves en ny nøgle og secret'en opdateres.

*Notifikationer (Bjørn har godkendt designet):* alt er merget og deployet (#417-#426,
`notify`, `recalls-sync`, `delete-user`, `send-push`). Live testet 30. sept. mod Jans konto:
P1 og P6 (besked + mail leveret), og push til Android (Google accepterede; Jan svarede "ja, lukket",
men trykket på beskeden er ikke bekræftet). Fundet og rettet undervejs: `push_tokens.user_id` manglede
default (registrering fejlede stille, tabellen var altid tom), VAPID-privatnøglen er rå (32 bytes) og
importeres nu som JWK, og `recalls` manglede GRANT til service_role. **Go-live 1. okt. 2026 (Jans ord):** push er tændt (migration `20261001080030`) og mail er tændt
(`20261001093000`); `notifications_test_users` er tom. Rulles tilbage ved at sætte flagene til false
(beskeder i appen påvirkes ikke). Tilbage: iPhone-test af push og de øvrige varianter med to konti.
**Testdata fra livetesten er ryddet (1. okt. 2026):** testprodukt, scanning, testtilbagekaldelse, hændelser, beskeder og testlisten
(`notifications_test_users` er tom igen; Jans push-abonnement er bevaret).
Mangler: admin-visning til tilbagekaldelser uden gyldig EAN (punkt 13 ovenfor), N7 (opskrifter på pause),
app-rettelse så `usePush.js` tjekker svaret fra serveren, når abonnementet gemmes (fejl vises i dag ikke),
test på iPhone og af de øvrige varianter med to konti (`docs/notifikationer-testplan.md`), og til sidst
go-live på Jans ord (flagene til, testlisten ryddet). Detaljer i `src/CONTEXT.md` afsnit 14.

*Claude gør bagefter:*
10. Læs testrundens resultater og opret tickets for fejl (når punkt 3
    genoptages).

**Løst 30. sept. 2026** (Jans svar på listen, detaljer i commits og
`supabase/sql/2026-09-30_*.sql`): 4 alder/køn i Rediger profil; 5
QA-kontoen er admin (4 er senere erstattet: Rediger profil ændrer kun
navnet, Bjørns beslutning); 6 kJ-data rettet (4.876 produkter, backup-tabel); 7
(erstattet samme aften af Bjørns nye oprettelsesflow, se "Oprettelse og
e-mailbekræftelse" i afsnit 5); 12 tyske
ingredienslister (allergens v22 + 18 produkter genanalyseret); 13
alternativer scores på lighed (det gamle verified-filter matchede kun ét
produkt); 14 lister nævner advarsler for andre profiler; 15 189
opskriftstitler rettet; 16 profilrækker på resultatsiden. Samtidig fundet
og rettet: notification_preferences manglede GRANTs (ingen valg blev
gemt), og gender-check afviste "Vil ikke oplyse".

QA-runden 28.-29. sept.: alle fund Q1–Q14 er rettet og live (PR #372,
#373, #376), undtagen kJ-dataene i punkt 6. D2 (telefon valgfri) er live
(PR #377). Detaljer i tickets, der starter med "[QA 28/9", i
`feedback_tickets`.

Rescue-audittets fulde 4-fase-roadmap, Claude Code Setup Audit-rapportens 3
forslag, og alle "16. sept."-opfølgningspunkter (npm audit fix --force,
RLS-performance-advisories, tredjeparts audit-skills, AdminScreen.jsx/
App.jsx-opsplitningen) er nu implementeret og merget — se "Rescue-audit —
status" nedenfor for fuld detalje.

**Desktop admin-panel (24. sept. 2026) — nye funktioner 8/8 færdige.** Et
separat, desktop-optimeret admin-panel er bygget på `eatsafe.dk/admin.html`
— egen Vite-entrypoint (`src/admin/`), rører ikke den mobile PWA's bundle.
Shellet + alle oprindelige admin-funktioner (Dashboard/Brugere/Indsendelser/
Tickets/Manglende/Import/Opskrifter) samt hele "nye funktioner"-backloggen
(produkt-database, Leksikon-CRUD, ændringshistorik, brugere-redigering inkl.
allergener, bulk-handlinger, dashboard-trends, CSV-eksport, familie-overblik
+ handlingsmuligheder, global søgning) er shippet og live — se
`src/CONTEXT.md` afsnit 13 for fuld detalje pr. funktion.

**Full admin-audit gennemført 24. sept. 2026** (kode + sikkerhed + token) —
fandt og rettede ét KRITISK fund: `users`-tabellens selv-opdaterings-policy
tillod enhver bruger at sætte sin egen `role` til `admin` (ingen kolonne-
begrænsning i RLS, og en trigger synkroniserede det automatisk ind i JWT'en).
Rettet med en `BEFORE UPDATE`-trigger, se `src/CONTEXT.md` afsnit 6 for
detaljen. Øvrige fund var lav-severity/informative (rolle-scope på to
RLS-policyer, PostgREST-filter-escaping i søgefunktioner) — ingen yderligere
handling påkrævet.

**Leaked Password Protection er blokeret, ikke glemt.** Brugeren forsøgte at slå den til 17. sept. i Supabase Dashboard →
Authentication → Sign In/Providers, men fik fejlen "Configuring leaked
password protection via HaveIBeenPwned.org is available on Pro Plans and
up" — projektet kører på Free-planen. Kræver en betalt opgradering til
Supabase Pro-planen (~$25/md, medfølger også bl.a. daglige backups og
længere log-retention). **Spørg IKKE om det bare er glemt** — spørg i
stedet om brugeren ønsker at opgradere Supabase-planen, og lad det være
deres beslutning. Fjern dette afsnit når det er afklaret.

**E-mailbekræftelse (D1) er løst 30. sept. 2026.** Egen SMTP via Resend
(`smtp.resend.com:465`, bruger `resend`, afsender `noreply@eatsafe.dk`,
mailgrænse 100/time), og "Confirm email" er slået til. Velkomstmailen sendes
nu først efter onboarding (se "Oprettelse og e-mailbekræftelse" i afsnit 5).
**Der findes kun én velkomstmail (1. okt. 2026):** HTML'en i
`supabase/templates/resend/N1-velkomst.html`, sendt af `send-email` (type
`welcome_onboarded`). Skabelonen "EatSafe N1 – Velkomst" i Resend er kun en
kopi af den; den gamle "Velkomstmail - Beta" og typen `welcome` er slettet.
Bekræftelseslinket lander i onboarding, også når en anden konto var logget
ind i browseren (PR #406, `arrivedViaAuthLinkRef` i `useAuth.js`).
Verificeret live og ticket `cc121cd9` lukket.

**Adgangskode-krav (30. sept. 2026):** Supabase kræver mindst ét lille
bogstav, ét stort bogstav og ét tal; appen kræver desuden mindst 10 tegn.
Begge dele tjekkes nu i appen før oprettelse (`passwordErrorText()` i
`helpers.js`), og fejlteksten siger præcis hvad der mangler (fx "den er kun
5 tegn (mindst 10), og den mangler et tal"). Hjælpeteksten under feltet er
`PASSWORD_REQUIREMENTS_TEXT`. Ændres kravene i Supabase Dashboard, skal
`helpers.js` rettes tilsvarende. Afviser Supabase koden som lækket
(`weak_password.reasons` indeholder `pwned`), siges det direkte.

**Netværk (B1) løst 30. sept. 2026.** Cloud-miljøet "Eatsafe" har Network
access = Custom med `eatsafe.dk`, `www.eatsafe.dk`,
`jegrpcflyguadyxialkm.supabase.co` og `world.openfoodfacts.org`. Claude-
sessioner kan derfor nu nå den rigtige app, Supabase og Open Food Facts
direkte (eatsafe.dk sender videre til www). Ticket `820806b9` er lukket.
Admin-panelet kræver stadig en testkonto med admin-rolle; opret den KUN
efter Jans ja.
Det, som ingen sandbox kan teste (kamera, installation, push, deling
mellem to konti, login-udbydere, skærmlæser), står i en fælles
tjekliste: https://claude.ai/artifact/1YwwF252KhrCAWrgSssw1X. Status og
noter ligger i dens database, samlingen `results` (ét dokument pr.
punkt: `status` ok/fail/skip, `note`, `by`, `at`, `device`), og kan
læses med `ArtifactData` `list`. Opret tickets for punkter med
`status: "fail"`.

---



## Gamle stående aftaler fra afsnit 4 (Vercel-hændelser, preview-metode i detaljer)

### Andre stående aftaler

- Bruger typisk dansk i alle beskeder, commits og PR-tekster. Hold svar korte og
  konkrete — brugeren foretrækker handling over lange forklaringer.
- Ved eksplorative/åbne spørgsmål ("hvad tænker du?"): giv en kort anbefaling (2-3
  sætninger) med den vigtigste trade-off, og vent på grønt lys før du implementerer.
- Feedback-tickets og driftsspørgsmål tjekkes jævnligt i Supabase (`feedback_tickets`-
  tabellen) — marker kun som `resolved` når det faktisk er verificeret rettet, ikke
  bare for at rydde op i køen.
- Sikkerhedsfund i Supabase (fx offentligt kaldbare RPC'er der omgår edge-function-auth)
  rettes proaktivt når de opdages, også selvom det ikke var det brugeren spurgte om.
- Skærmbilleder til visuel verificering: sandboxen har ikke netadgang til eksterne
  billeder (Supabase storage, Open Food Facts), så brug en håndskrevet standalone HTML-
  fil (kopiér ægte class-navne/inline-styles fra den rigtige komponent) + `playwright-
  core` med `executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'` —
  IKKE `npx playwright screenshot` (version-mismatch med den forudinstallerede browser).
- **Postgres `REVOKE EXECUTE ... FROM <rolle>` uden også `FROM PUBLIC` er en
  no-op**, hvis PUBLIC allerede har adgangen (Postgres' standard ved funktions-
  oprettelse). Verificér altid en revoke-fix bagefter med
  `has_function_privilege(rolle, funktion, 'EXECUTE')` — antag det ikke
  virkede bare fordi kommandoen ikke fejlede (fundet under `security-check`s
  baseline-kørsel, se `.claude/HISTORY.md`).
- **Preview-deploys er slået helt fra på Vercel-projektet (25. sept. 2026,
  `previewDeploymentsDisabled:true` sat via Vercel-API'et, IKKE en
  CLAUDE.md-regel — kræver ingen session-genindlæsning, gælder øjeblikkeligt
  for alle).** Årsag: Bjørns (og enhver anden sessions) almindelige
  arbejds-pushes til en ikke-`main`-branch udløste automatisk en separat
  Vercel-preview-build PR hver eneste commit — helt uafhængigt af om nogen
  rent faktisk mergede noget, og brugte dermed kvote i baggrunden uden at
  nogen bad om det. Nu udløser KUN et push til `main` (dvs. en rigtig merge)
  et Vercel-deploy. Praktisk konsekvens: der kommer ikke længere automatiske
  preview-links per commit/branch — design gennemgås i stedet i en Artifact-
  preview (se metoden nedenfor), og et rigtigt Vercel-deploy sker kun ved en
  faktisk merge til `main`. Vil nogen undtagelsesvist se en branch direkte på
  Vercel, kræver det en manuel `vercel deploy` fra CLI'en (virker stadig —
  kun de automatiske Git-udløste preview-builds er slået fra).
- **Vercel-tidsstempler (deployments, `job_run_details` osv.) er UTC, ikke
  dansk tid — læg 2 timer til for CEST (sommertid, gælder i september).**
  Nævn altid dansk tid ved rapportering til brugeren, ikke UTC direkte.
- **Vercels Git-integration stoppede midlertidigt med at reagere på GitHub-
  pushes, 25. sept. 2026, kl. ca. 11:52–12:11 dansk tid (~19 min).** Opdaget
  da brugeren bad Bjørn om at pushe (PR #320) og konstaterede at eatsafe.dk
  ikke blev opdateret. Undersøgt: BÅDE production-deploys ved merge til
  `main` OG almindelige branch-preview-deploys (via manuel `vercel deploy`
  fra CLI'en) stoppede på nøjagtig samme tidspunkt, for begge sessioners
  branches samtidig — ingen fejlede/annullerede deployment-forsøg overhovedet
  registreret hos Vercel i intervallet, kun total stilhed. Det udelukker en
  byggefejl eller en kvote-blokering (de ville givet et synligt ERROR/BLOCKED-
  forsøg). Løst ved at udløse et deploy manuelt via `mcp__Vercel__create_deployment`
  med `gitSource:{type:"github",org,repo,ref:"main",sha:<seneste main-SHA>}`
  og `target:"production"` — gik igennem uden problemer, hvilket viser at det
  IKKE var en kvote-blokering (de bruger samme daglige kvote). Rodårsagen er
  ikke fundet (formentlig en forbigående GitHub→Vercel-webhook-fejl, uden for
  vores kontrol) — ingen tegn på at det hænger sammen med den nye push-
  godkendelses-regel (afsnit 4, trin 6), som fungerede som tilsigtet: Bjørns
  push afventede korrekt brugerens eksplicitte "ja" og gik først til `main`
  derefter. **Tjekpunkt ved en fremtidig "eatsafe.dk opdaterede sig ikke"-
  rapport:** tjek `mcp__Vercel__list_deployments` for om der overhovedet
  findes et deployment-forsøg (også fejlet) for den forventede commit-SHA —
  ingen forsøg overhovedet peger på samme webhook-hak, ikke en byggefejl at
  debugge i selve appen. Genbrug samme manuelle `create_deployment`-genvej
  til at rette det med det samme, uden at afvente at brugeren opdager det.
- **Vercel Free-planens daglige deployment-grænse (100/dag) — push kun til
  Vercel når ændringen reelt kræver produktion for at kunne testes/tjekkes**
  (fx noget der afhænger af det rigtige domæne, PWA-installation, service
  worker, eller en Supabase-integration der skal verificeres i den ægte
  browser-kontekst). Ramte grænsen 24. sept. 2026 efter mange småændringer
  i træk (se `.claude/HISTORY.md`) — en PR blev merget uden ventet grønt
  Vercel-preview som følge. Til rene UI/visuelle ændringer: byg en delt
  preview i stedet for at pushe:
  1. `npx vite build --base=./ --outDir dist-preview --mode artifact-preview`
  2. `mv dist-preview/index.html dist-preview/app.html`, og skriv en ny,
     lille `dist-preview/index.html`-wrapper der viser `app.html` i en
     telefon-ramme (`<iframe src="app.html">` i en 393×852-boks) — centreret
     på siden, med `@media (max-width:460px)` der fjerner rammen igen
     (fylder allerede skærmen, hvis linket åbnes på en rigtig telefon).
     Rammen skaleres ned via `transform:scale()` (beregnet i et lille
     inline-script ud fra `window.innerWidth/innerHeight`, gentaget på
     `resize`) i stedet for en fast pixel-størrelse — ellers kan et lille
     eller bredt-men-lavt Artifact-panel gøre siden scrollbar. `html,body`
     har `overflow:hidden`, og et hint-tekst-element er `position:fixed`
     (ikke en del af flex-flowet), så det aldrig skubber rammen ud af syne.
  3. Publicér `dist-preview/index.html` (+ `files` for `app.html`,
     `assets/*` og øvrige rod-filer) via Artifact-værktøjet — brug `url` for
     at genpublicere til det EKSISTERENDE link i stedet for at oprette et
     nyt, hvis det allerede findes (se dette links URL i `.claude/HISTORY.md`
     hvis det ikke er kendt).
  4. Ryd `dist-preview/` op bagefter (`rm -rf dist-preview`) — den skal
     ikke committes.

  **`--mode artifact-preview` bruges også til en login-bypass-knap:**
  `OnboardingScreen.jsx`s WELCOME-skærm viser en ekstra knap ("Se app uden
  login (preview)") KUN når `import.meta.env.MODE === "artifact-preview"`
  (aldrig i den rigtige produktions-build, som ikke bruger dette mode) —
  springer login over og går direkte til `SCREENS.HOME`, fordi login mod
  Supabase er upålideligt fra Artifact-previewens domæne. Data-afhængige
  dele af Hjem-skærmen kan fremstå tomme uden en rigtig session — kendt,
  accepteret begrænsning.

  **Kendte begrænsninger ved denne preview-metode generelt:** kalder samme
  LIVE Supabase-database som produktion (ikke isoleret testdata), og PWA-
  specifikke ting (service worker-registrering, "Føj til hjemmeskærm")
  virker ikke troværdigt uden det rigtige domæne — kun til at verificere
  UI/layout/funktioner visuelt.

  **Stående regel (24. sept. 2026 — brugerens eksplicitte instruks, udvidet
  25. sept. 2026): push/merge til Vercel KUN ved funktions- og
  dataændringer, ALDRIG ved rene design-/visuelle ændringer** (farver,
  layout, spacing, baggrundsbilleder, skrifttype/vægt, skygger, ikoner og
  lignende) **og ALDRIG ved rene dokument-/dokumentationsændringer**
  (`CLAUDE.md`, `src/CONTEXT.md`, `.claude/HISTORY.md`, `README.md`,
  kommentarer og lignende — de påvirker ikke den byggede app, så et
  Vercel-deploy for dem er ren spildt kvote). Rene design- eller
  dokumentations-opgaver afsluttes med byg/test/mojibake-scan/commit som
  normalt (se trin 1-5 ovenfor) — design verificeres i en Artifact-preview,
  dokumentationsændringer kræver ingen verifikation ud over selve
  commit'en — men PUSH IKKE, opret IKKE PR, og merge IKKE til `main` for
  dem. Commits bliver liggende lokalt på feature-branchen til enten (a) en
  efterfølgende funktions-/dataændring i samme arbejdsomgang bundler dem
  ind i én PR, eller (b) brugeren eksplicit beder om at få dem shippet.
  Undtagelsen i afsnit 4 for kritiske/blokerende produktionsfejl (fx et
  reelt crash) står stadig over denne regel — den slags shippes altid med
  det samme, uanset om fejlen stammer fra en design-, dokumentations- eller
  funktionsændring.

  **Fundet overtrådt i praksis samme dag (PR #307/#308):** en anden,
  parallel session mergede to rene design-PR'er (Scan-CTA-farve/-puls +
  baggrundsbillede) direkte til `main`/Vercel FØR denne regel var skrevet
  ned af den session der satte den — men opdagede først reglen (via
  `git merge`s auto-merge af CLAUDE.md) EFTER begge allerede var mergede,
  og fulgte den ikke retroaktivt. Konsekvens: Vercels daglige kvote blev
  ramt af de mange hurtige merges, og brugeren så en forældet, ufikset
  version af appen i flere minutter mens produktions-deploy ventede på
  kvote-reset. **Læren:** læs hele den mergede CLAUDE.md igennem efter en
  `git merge` med reelle konflikter — ikke kun de linjer der konfliktede —
  en stående regel kan være tilføjet i en del af filen der auto-mergede
  stille og roligt uden at kræve din opmærksomhed.

---



## Gammel afsnit 5 (designforbedring og skærm-for-skærm-detaljer)

## 5. Designforbedring (september 2026) — afsluttet

Brugeren gav feedback: "appen virker livløs, og fremstår ikke særlig pæn og
elegant" (trods tilfredshed med skiftet til hvid baggrund). Et sæt konkrete
forbedringer blev aftalt og testet først på Hjem-skærmen (ScannerScreen.jsx),
og efter godkendelse rullet ud til hele appen: en reel, distinkt `--blue`-
accentfarve (`#3A6EA5`, ikke længere aliaset til grøn), emoji→SVG-ikon-
sanering af al UI-chrome på tværs af samtlige skærme + delte overlays
(`ProfileMenu`, hjælpe-modalen i `App.jsx` m.fl. — indholds-emoji som
allergen-glyffer/sprogflag/database-drevne kategori-ikoner er bevidst IKKE
rørt), tryk-feedback (`:active{transform:scale(.97)}`) og løs-tekst-
legibilitet globalt, kort-vægt-hierarki (primær/sekundær/tertiær skygge,
`--sh2`/`--sh`/fladt+kant-accent) på Hjem og ProfileScreen, en delt `Toast`-
komponent der erstattede native `alert()` 16 steder, en spacing-skala-
retrofit (se skalaen i afsnit 3), og en fuld vurdering af en ekstern
"20 ting du kan bede Claude om"-tjekliste (de fleste punkter allerede
dækket eller vurderet irrelevante for en PWA uden marketingsider — se
afsnit 6 for antimønstre-status).

**Status: fuldført.** Kort-vægt-hierarkiet er kun relevant hvor flere ikke-
interaktive kort konkurrerer om opmærksomhed (Hjem, ProfileScreen) — andre
skærmes kort er interaktive rækker, flade by design. Hilsen-typografien
(`.greeting-main` osv.) forbliver Hjem-specifik. **Dark mode er droppet
eksplicit** (ikke udskudt) — appen er og forbliver lys-tema-only; tag det
ikke op igen medmindre brugeren selv rejser det på ny.

**Stående regel fundet undervejs (allergen-nøgleord, 15. sept. 2026 —
brugerens eksplicitte instruks: "tag det vi lærte herfra og brug det på
tværs af det hele. gør altid det"):** enhver allergen-nøgleordsliste — i
`supabase/functions/allergens/index.ts` OG i den separate frontend-kopi
`src/allergenKeywords.js` (deler ikke kode, se dens egen header-kommentar)
— skal have BÅDE ental- og flertalsform for hvert tælleligt dansk
substantiv, medmindre ordet er entals=flertal (fx "æg", "fisk", grynsorter
som "rug"/"byg"/"havre"). Ordgrænse-matchen fanger ellers aldrig den bøjede
flertalsform der reelt står i ingredienslister (fundet via en bruger-
ticket: "hasselnød" i ordlisten matchede aldrig "hasselnødder"). Tjek dette
som et fast checkpoint ved enhver ny/ændret nøgleordsliste. **Kendt
undtagelse:** dansk "snegle" er tvetydigt (bløddyr vs. bagværk
"kanelsnegle") — tilføj ikke den slags flertalsform mekanisk uden at tjekke
for reelt tvetydige ord først.

**Anden stående lektion (feltnavne-mismatch):** en kolonne/prop brugt ét
sted men aldrig matchet af resten af appen (fx `age` vs. `birth_year`,
`customAllerg` vs. `.custom`, `<Icon name="arrow-left">` mod et ikke-
eksisterende ikonnavn) giver INGEN fejl i build/runtime/tests — kun stille
forkert data. Grep efter den slags mismatch når en bruger rapporterer noget
der umiddelbart ligner "bare" en tekst-/UI-inkonsistens (dette mønster er
også indbygget i `.claude/commands/review-pr.md`).

**Fuld dag-for-dag-log** for hele designforbedringsarbejdet — de
oprindelige 14 gennemgangsbølger OG al efterfølgende runde-for-runde-detalje
for Scan-forsiden/scan-knappen, Familie, Madpas, Profil, Indstillinger,
Scanner-UX, Produktresultatsiden, EatSafe-logoet, velkomstsiden,
login/onboarding-polish og app-headeren — ligger i `.claude/HISTORY.md`.
Dette afsnit er trimmet to gange nu (15. og 28. sept. 2026, begge gange
fundet af `token-audit`-skillen efter at det var vokset til ~70% af hele
`CLAUDE.md`): behold her KUN nutids-tilstanden; slå op i HISTORY.md for
selve begrundelsen/forsøgene bag hver beslutning.

**Scan-forside og scan-knap — nuværende tilstand** (efter adskillige
redesign-runder 24.-25. sept., inkl. en mergekonflikt med 14 parallelle
commits på `main` og tre opfølgende brugerfeedback-runder): `.home-hero-
frame` (ScannerScreen.jsx) har en definitiv `calc(100dvh - 143px -
env(safe-area-inset-bottom))`-højde + CSS Container Queries for
proportional skalering. Ét app-bredt baggrundsbillede
(`app-background.webp`) ligger bag alle skærme, men Scan-forsiden har sit
eget foto lagt som et `app-bg-scan`-modifier-lag på selve `.app-bg` (fuldt
skærmdækkende, ikke begrænset til hero-rummet). Topbar/bottom-nav har et
let frostet-glas-look (`backdrop-filter:blur`). Scan-knappen er en rigtig
`<button>` med sin egen farvepalet (primær `#0E8F5A`, mørk `#08734A`, halo
`#DDF4E8` — adskilt fra appens `--green`-token), størrelse
`clamp(132px, 34cqh, 219px)`, en blødt roterende lysring (`scanCtaRingSpin`,
9s) og en puls KUN i halo-gløden (`scan-halo-pulse`, 4s, skala 1→1.06 /
opacity .7→.5 — ikke på selve knappen). Ikonet er `scanframe` (fire
scanner-hjørne-vinkler). Bundnavigationen er **Indkøbsliste | Scan |
Historik** ("Søg" er fjernet herfra, men `SCREENS.SEARCH` findes stadig som
route, nået fra `SubmittedScreen.jsx`). Version-nummeret og "Prøv en
demo"-knapperne er fjernet fra forsiden (`DemoSlider`/`showGuide` er ikke
slettet, blot uden UI-indgang). Topbar-knapperne (?, Feedback, hamburger)
bruger `--ink2` + en let skygge. Fuld dag-for-dag-detalje i
`.claude/HISTORY.md`.

### Familie-siden gjort færdig som funktion, ikke kun layout (26. sept. 2026)

Efter en første, layout-fokuseret redesign-runde (fjernet madvare-baggrund,
"Aktive profiler ved scanning" og det permanent udfoldede tilføj-/
invitationskort — samme mønster som List/Historik/Favoritter/Allergi-
leksikon, se `app-bg-hide` ovenfor) fulgte en langt mere omfattende, 16-
punkts opfølgning der gør selve familie-*funktionen* færdig: scanningsrele-
vante chips (allergier → kostpræferencer → E-numre, prioriteret rækkefølge,
capped med udfoldelig "+N") for BÅDE administrerede profiler og rigtige
husstandskonti (edge-functionen `family/index.ts`s `/group`-endpoint
returnerer nu også allergener/kost/E-numre pr. husstandsmedlem, ikke kun
navn/email); ventende invitationer vist direkte i familie-oversigten med
kopiér/del igen/annullér; et periodisk 12-sekunders-tjek mens man er på
fanen (ingen realtime-kanal findes for `family_invites`, kun Indkøbslisten
har det) så en accepteret invitation dukker op uden manuel genindlæsning;
og et nyt `POST /functions/v1/family/link-profile`-endpoint til eksplicit,
bruger-initieret sammenlægning af en administreret profil med en nyligt
tilkoblet rigtig konto (undgår dubletter uden automatisk navne-matching).
Fuld detalje i `.claude/HISTORY.md`, backend-reference i `src/CONTEXT.md`
afsnit 9.

**Husstandskonti kan vælges som profil (1. okt. 2026, Bjørns fejlrapport):**
rigtige EatSafe-konti i husstanden (Jan) kan nu scannes for, søges for og vises
i Madpas, på lige fod med selvoprettede profiler, og er med i "Hele familien"
som standard. De er SKRIVEBESKYTTEDE: kun profiler, man selv har oprettet
(`family`), kan redigeres/slettes. Husstanden hentes i `useHousehold.js`, og
`scanFamily` (ProfileContext) = egne + husstandens konti; brug `scanFamily`
til alt, der vælger/tjekker profiler, og `family` kun til redigér/slet.

### Madpas — redesignet, forenklet til kernefunktionen, herefter finpoleret otte gange (26.-27. sept. 2026)

Madpas' formål: alt relevant personale (tjener, butiks-, hotel- eller
cafémedarbejder — ikke kun restaurantpersonale) skal kunne forstå de
vigtigste kost-/allergioplysninger på 2-3 sekunder. Et fuldt delingssystem
(token-link, `madpas_links`-tabel + RPC, offentlig side, QR-kode, PDF/print,
E-numre-opt-in) blev bygget og samme dag fjernet igen efter eksplicit
brugerkrav ("Link- og QR-funktionalitet skal være helt fjernet") — Madpas
er udelukkende on-device siden da. Fremvisningsskærmen viser hvert
allergen/fritekst-emne som sin egen blok (stort, fedt navn → eksempler →
en PR.-EMNE sikkerhedstekst, "...does not contain {name} or ingredients
made from {name}."), med samme blok-behandling for diæter
(`MADPAS_DIET_MESSAGE_T`, 17 sprog, sektionsoverskrift "DIETARY
REQUIREMENTS"). En bevidst opt-in krydskontaminerings-advarsel (toggle på
Madpas-forsiden, default FRA) føjer én sætning til FOOD ALLERGIES-sektionen
når aktiveret. Oplæsningsknappen er stor/fuld-bredde og inkluderer selve
sikkerhedsteksten. To reelle sproghuller (manglende `hvede`/
`maelkeallergi`-oversættelser for alle 17 sprog, en fejlvisning "Soy /
Soya", et manglende "Whey"-eksempel) er rettet. Layoutets spacing og
venstre-alignment er finpudset til appens faste skala (inkl. et reelt fund:
`.mp-head` havde sin egen ekstra venstre/højre-padding oveni `.mp-scroll`s
allerede eksisterende — rettet med ét CSS-linje-skift). Fuld otte-runders
dag-for-dag-detalje i `.claude/HISTORY.md`, backend-/struktur-reference i
`src/CONTEXT.md` afsnit 10.

**Finpolish 1. okt. 2026 (Bjørn):** hver fødevareallergi har nu et direkte
to-sætnings-budskab ("I have a food allergy to milk." + "Please make sure my
food does not contain milk or any milk-derived ingredients.",
`MADPAS_ALLERGY_STATEMENT_T` + `MADPAS_EN_DERIVED` i constants.jsx, også i
oplæsningen); "I am allergic to:"-linjen er fjernet; krydskontaminering
står i en diskret lys orange boks; indholdet starter lige under sproglinjen
med stram spacing (lodret centrering gav for meget tom plads øverst);
knappen hedder altid "Læs højt"/"Stop" (appens sprog). Alle allergener og
intolerancer vises på kortet med appens egne stregikoner i en grøn flise
(mælk = `Icon name="milk"`, resten via `MADPAS_ALLERGEN_ICON` i
MadpasScreen.jsx, egne tilføjelser = `warning`) i stedet for de illustrerede
ikoner; resten af appen bruger fortsat 3D-sættet. Sproglinjen viser et
neutralt globusikon (`Icon name="globe"`) i stedet for landeflag; mælkens
eksempler er Madpas-specifikke ("Cream · Butter · Cheese · Whey · Milk
powder", `MADPAS_EXAMPLES_OVERRIDE`, 17 sprog); indrykninger bruger
`paddingInlineStart`, så arabisk (RTL) flugter.
Final polish (1. okt. 2026): eksempel-labelen er "May be found in:" på alle
17 sprog (`MADPAS_EXAMPLES_LABEL_T`; eksemplerne indeholder ikke nødvendigvis
allergenet); ét afstandssystem via flex-gap (28 mellem blokke, 32 mellem
sektioner, 12 under sektionsoverskrift, 24 over krydskontamineringsboksen),
ensartet linjehøjde 1,5 på al brødtekst, ingen tom ekstra plads efter sidste
blok, og Læs højt-knappen er ca. 12 % lavere (46 px).

**Info-ikon ved krydskontaminering (1. okt. 2026, Bjørn):** toggle-kortet på Madpas-forsiden har et lille info-ikon
ved "KRYDSKONTAMINERING", der åbner en delt `InfoSheet` (`SharedComponents.jsx`, bottom-sheet i portal, én "Forstået"-knap) med en kort forklaring.
Brug `InfoSheet` til fremtidige info-ikoner.

**Mails i mørk tilstand (1. okt. 2026, Bjørn):** alle 28 mailskabeloner (`supabase/templates/auth/` og `resend/`) har samme
mørke palette (`#121413`/`#1C1F1E`, overskrift `#F4F7F5`, brødtekst `#C9CFCC`, sekundær `#9FA8A3`, grøn knap `#0F7D4F`), regler til Outlook og et logo,
der skifter til `EatSafe_Logo_Email_Dark.png`. Detaljer og Gmail-begrænsning i `supabase/templates/resend/README.md`; testet i `src/mailDarkMode.test.js`.
Ændr paletten i alle skabeloner samtidig.
**Tåler automatisk inversion (1. okt.):** Outlook (web) ignorerer vores mørke CSS og vender selv farverne; derfor er al tekst nær-sort (+ opacity) eller hvid, aldrig en grå mellemtone, og det lyse logo har baggrunden bagt ind (se README i `supabase/templates/resend/`).
**"Var det ikke dig?" i glemt-adgangskode-mailen (1. okt. 2026, Bjørn):** et signeret, 7 dage gyldigt link i `recovery.html` åbner `public/uventet-nulstilling.html`; et klik på knappen kalder
`report-unrequested-reset`, som gemmer en række i `security_reports`, opretter en høj-prioritets opgave på to do-listen og mailer admins. Intet ændres ved kontoen. Se `src/CONTEXT.md` afsnit 16.

### Profil restruktureret — "Rediger profil" og "Rediger præferencer" adskilt (28. sept. 2026)

Profilsiden har to adskilte redigeringsskærme: `SCREENS.EDITPROFILE`
("Rediger profil", nås KUN fra profilkortets "Rediger") håndterer
kun Navn (30. sept. 2026, Bjørns beslutning — erstatter Jans punkt 4, der
satte alder/køn tilbage samme dag; alder og køn udfyldes i onboarding og
gemmes, men redigeres ikke bagefter, og telefon indsamles ikke længere).
`SCREENS.EDITPREFERENCES`
("Rediger præferencer", nås fra "Mine præferencer"s "Rediger" på Profil)
håndterer udelukkende allergier/intolerancer/diæter/E-numre, og genbruger
PRÆCIS de samme delte komponenter som onboarding og `MemberForm.jsx`
(`AllergenChipPicker`/`DietChipPicker`/`ENumberPicker`, `AllergenPicker.jsx`)
i stedet for en tredje UI-kopi. Gluten↔glutenfri-synkroniseringen er
udtrukket til én delt `useGlutenFreeSync()`-hook, nu brugt tre steder
(onboarding, MemberForm, Rediger præferencer). "Min husstand" på Profil er
erstattet af én kompakt, klikbar række ("Husstand" + antal medlemmer +
chevron) der blot åbner den eksisterende Familie-side — ingen
medlem-administration direkte på Profil længere. "Din aktivitet"
(Gamification) er nu et rent 2×2-grid (Dage i træk/Scanninger i alt/
Advarsler fanget/Sikre opdagelser — "Familie aktive"-tallet er fjernet,
Husstand-rækken dækker det samme). Profil-footeren har en dedikeret
`paddingBottom:calc(96px + env(safe-area-inset-bottom))` der forhindrer
overlap med bundnavigationen. Fuld detalje (tre opfølgningsrunder) i
`.claude/HISTORY.md`.

### Indstillinger omstruktureret til seks logiske sektioner (28. sept. 2026)

`SettingsScreen.jsx` har seks sektioner: **Konto** (kun Log ud),
**Madpas-sprog** (genbruger `MADPAS_LANGUAGES` + App.jsx's `madpasLang`-
state og MadpasScreen.jsx's eksisterende dropdown-CSS), **Scanning** (to
nye, localStorage-persisterede toggles — "Vibration ved advarsel"/"Lyd ved
advarsel", default TIL, fyrer via en ny `fireWarningAlert()`-hjælpefunktion
i `useProduct.js`s `runLookupProduct` specifikt når et scan-resultat er
`danger`/`warn`), **Notifikationer** (finpudsede kategori-labels, én fælles
Push/E-mail-kolonneheader, og — den reelle funktionelle rettelse —
per-kategori Push-toggles vist grånede/deaktiverede når browserens/OS'ets
push-tilladelse mangler), **Privatliv & data** (privatlivspolitik-link, en
udfoldelig "Hvilke data EatSafe gemmer"-liste, og Slet konto flyttet hertil
i en adskilt rød "FAREZONE"-underafsnit), og **Om EatSafe** (status "Beta"
+ venlig bygge-dato, git-commit-SHA som udfoldelig sekundær "Build-ID
(teknisk)"-detalje, "Om EatSafe Beta" der genåbner `BetaIntroModal`, og
"Kontakt & support"). Bevidst udeladt (begrundet i `SettingsScreen.jsx`s
eget filhoved): App-sprog (intet i18n-system), en "Åbn resultat
automatisk"-toggle (allerede ubetinget adfærd), dataeksport, en selvstændig
Vilkår-side, og en "Åbn Indstillinger"-genvej (ingen cross-platform PWA-API
findes). Privatlivspolitik-linket findes nu KUN under Indstillinger +
ProfileScreen-footeren (fjernet fra hamburgermenuen, som skal navigere
mellem funktioner, ikke huse juridiske links). Fuld detalje i
`.claude/HISTORY.md`.

### Scanner-flow finpudset — labels, dynamisk hjælpetekst, kamera-permission (28. sept. 2026)

Scanneren (`ScannerScreen.jsx`/`useScanner.js`/`useProduct.js`) har
tekst-labels under de tre svævende kamera-kontroller (Billede/Indtast/
Lygte, ≥44×44pt touch-target); en dynamisk hjælpetekst under scanneren
skifter fra "Placér hele stregkoden i rammen" til "Hold telefonen stille"
efter 3s, og en 5s-fallback (`showPhotoHint`) tilbyder klikbare Indtast-/
Billede-genveje; en ny `cameraPermissionDenied`-tilstand viser et dedikeret
"Kameraadgang er slået fra"-kort (med fungerende Billede-/Indtast
EAN-knapper) i stedet for en stadig-klikbar, men reelt ubrugelig
"Scan produkt"-knap; manuel EAN-indtastning er cifre-filtreret med to
adskilte fejltekster for forkert længde vs. checksum. **Opfølgende
bugfix, samme dag:** `stopCamera()` (useScanner.js) nulstiller nu ALT
scanner-relateret state (zoom/fejlbesked/"kan den ikke scannes?"-hint OG
det manuelle EAN-panel via en ny `closeCameraFully()`-wrapper i App.jsx)
ved ethvert kamera-luk (eksplicit luk-tryk, navigation væk, appen i
baggrunden, Android-tilbageknappen) — en tidligere bug lod "Indtast
EAN"-panelet stå åbent på Scan-forsiden efter kameraet blev lukket. Fuld
16-punkts-spec-detalje i `.claude/HISTORY.md`.

### Produktresultatside omstruktureret — dynamisk, kategoriseret status (28. sept. 2026)

`ResultScreen.jsx` bruger en generisk, data-drevet kategorisering
(`categorizeProductFindings`/`computeTopStatus` i `helpers.js`, ALLERGENS'
eget `type`-felt afgør allergi vs. intolerance, ingen specialcases pr.
produkt) der ALDRIG kalder et produkt "sikkert" alene fordi der ikke var et
match. Kun to advarselsfarver: **RØD** for egentlige allergi-/
intoleranceadvarsler (sundhedsrelevante fund, ikke brugerens eget valg) og
**GUL/ORANGE** for kostpræference-/E-nummer-fravalg (bevidste valg, ikke en
sundhedsadvarsel — headline "Passer ikke til dine valg"). En neutral grå
"Ikke nok oplysninger til fuld kontrol"-tilstand (`--neutral`-token) vises
når der reelt mangler data (aldrig grøn i det tilfælde). Konkrete årsager
vises som chips direkte i resultatkortet, plus én kort, konkret
forklaringssætning (`topExplanation`). Én samlet sektion **"Dine valg"**
(`renderDineValg()`, tre skjulbare underkategorier: Allergier &
intolerancer / Kostpræferencer / E-numre & øvrige fravalg) viser ALLE
brugerens egne valgte allergener/diæter/E-numre med ✓ (matcher ikke) / ✕
(matcher, konkret grund) / ? (kan ikke afgøres) — erstatter de tidligere,
delvist modstridende "Relevant for dig"/"Passer til dine kostpræferencer"-
sektioner. Ingredienslisten fremhæver KUN det der er relevant for DENNE
bruger (nyt, bagudkompatibelt `highlightRules`-prop på `IngredientsList`,
tryk viser en kort `showToast`-forklaring). "Andre deklarerede allergener"
(tidligere "Andre allergener i produktet") er nu korrekt filtreret til kun
`type==="allergi"`. Næringsindhold viser "pr. 100 g" ELLER "pr. 100 ml" og
skjules helt uden brugbare data. Én samlet disclaimer ("EatSafe er
vejledende...") lige før "Ret forkerte data". Fuld to-runders detalje i
`.claude/HISTORY.md`.

### EatSafe-logoet låst og implementeret konsekvent overalt (28. sept. 2026)

EatSafe-logoet (mørk charcoal stregkodemærke med en integreret grøn
scanlinje/checkmark) er låst som ét fast billedaktiv fra en godkendt
master-vektorpakke (`public/brand/`, se README der for fuldt indhold).
Låste brandfarver — mørk (bars/wordmark "Eat") `#232528`, grøn
(checkmark/wordmark "Safe") `#039A55` med en gradient `#70DC59→#17BF55→
#039A55` i checkmarket, off-white baggrund `#FBFAF7` — er bevidst ADSKILT
fra appens `--green:#0F7D4F`-designtoken, som forbliver uændret til al
almindelig UI. Ny delt komponent `EatSafeLogo` (`SharedComponents.jsx`,
varianter `horizontal(-mono)`/`symbol(-mono)`) erstatter alle tidligere
egne tekst-/SVG-fortolkninger og bruges på velkommen/login/onboarding/
admin. **Undtagelse (27. sept. 2026):** app-headeren (`AppHeader.jsx`)
bruger bevidst en ren tekst-wordmark i stedet for billedlogoet (se
App-header-afsnittet nedenfor) — scanner-ikonet skal her udelukkende
signalere selve scan-funktionen, ikke indgå i brandingen i en kompakt
header. App-ikon/favicon/manifest (`theme_color`/`background_color`) er
gendannet fra masterfilen; de statiske sider (`install.html`/`invite.html`/
`privacy.html`) refererer nu alle samme
`/brand/EatSafe_Master_Logo_Horizontal.svg` i stedet for hver sin
let-forskellige tekst-rekonstruktion. Bevidst uden for scope:
`public/eatsafe-dashboard.html` (en ubrugt, ikke-refereret fil) og løse
"EatSafe Beta"-produktnavne-omtaler i brødtekst. Fuld detalje i
`.claude/HISTORY.md`.

### Bugfix: hamburgermenuen forblev åben oven på velkomstsiden efter logout (28. sept. 2026)

**Lektion (logout-veje skal lukke egne overlays):** `ProfileMenu.jsx`s
`handleItemClick` kalder nu `onClose()` FØR ethvert menupunkts action
udføres (ikke kun "Log ud") — en tidligere bug lod menu-overlayet/
draweren stå åben oven på velkomstsiden efter logout, fordi
`showProfileMenu`-state i `App.jsx` aldrig blev rørt af selve
`clearAuth()`-kaldet. `App.jsx`s eksisterende "ryd familie/historik/
indkøb ved `accessToken===null`"-effekt er udvidet til også at nulstille
`showProfileMenu`, som sikkerhedsnet for de øvrige steder `clearAuth()`
kaldes fra (session-udløb, admin-401-logout, Indstillinger-skærmens egen
log ud-knap). Fuld detalje i `.claude/HISTORY.md`.

### Velkomstside — "FINAL POLISH", produktionsklar finish (28. sept. 2026)

Velkomstsidens (`SCREENS.WELCOME`) lodrette fordeling bruger to usynlige
spacer-`div`er (`.welcome-vspace-top/-bottom`) med ULIGE flex-grow-vægt
(0.62:1) i stedet for `justify-content:center`, så ledig plads fordeles
ca. 38/62 (top/bund) og krymper mod ~0 på små skærme i stedet for at
efterlade for meget tom plads øverst. De tre benefit-labels ("Tjek
allergener"/"Hurtigt svar"/"Lettere indkøb", sidstnævnte omdøbt fra
"Tryggere indkøb") passer nu altid på én linje (gap/max-width/font-size
finjusteret empirisk). CTA-knappernes radius/skygge er ensrettet
(`border-radius:16px` begge, dæmpet skygge). Ny statisk side
`public/terms.html` (samme stil som `privacy.html`, en tydelig
"foreløbig/ikke juridisk gennemgået"-boks — genuint placeholder-indhold)
gør "handelsbetingelser" til et rigtigt link; teksten adskiller bevidst
"acceptér vilkår" fra "bekræft at have læst privatlivspolitikken" og er
EKSPLICIT IKKE samtykke til behandling af allergi-/helbredsoplysninger
(det sker separat i selve onboardingen). Onboardingens flydende
Feedback-knap har fået `env(safe-area-inset-top)`-håndtering + appens
delte `var(--sh)`-skyggetoken. Fuld 12-punkts-detalje i
`.claude/HISTORY.md`.

### Opskrifter sat på pause (30. sept. 2026)

Bjørns beslutning: Opskrifter er ikke nødvendige lige nu, men skal kunne
komme tilbage. Menupunktet står stadig i hamburgermenuen (undertekst
"Under udvikling"), og siden viser kun "Siden er under udvikling". Koden er
bevaret bag `RECIPES_ENABLED = false` øverst i `RecipesScreen.jsx`. Alle
629 opskrifter (og 13.182 `recipe_ingredients`-rækker via cascade) er
slettet permanent fra databasen efter Bjørns valg "Slet helt" (ingen
backup). Skal funktionen genopstå, skal flaget sættes til true OG
opskrifterne importeres forfra.

### Følsomhed pr. allergen — spor (2. okt. 2026, Jans spor + Bjørn finpudser designet)

Brugeren vælger pr. valgt allergen, hvad der sker, når pakken siger "Kan indeholde spor af …": "Advar mig" (standard) eller "Kun ved
ingrediens". Ved "Kun ved ingrediens" flagges spor ikke (grå info-linje i stedet), fx for en mælkeallergiker, der ikke reagerer på spor.
Gluten og hvede vises som ét valg. Valget har eget trin 3 i onboarding ("Spor af allergener"), samt i Rediger præferencer og familieformularen. Samtidig er spor nu GULE overalt, og kun direkte indhold
er rødt. Data: `allergen_levels` (jsonb) på `users` og `family_members`. Logik: `helpers.js` (`compareAllergens`, `computeProfileResults`,
`mergeAllergenLevels`, `categorizeProductFindings`/`computeTopStatus`); notifikation P1 respekterer valget. Detaljer og filer i
`src/CONTEXT.md` afsnit 6. UI'en (`AllergenSensitivity`) er en simpel førsteversion — Bjørn har en to do om at finpudse den. Gluten/hvede
viser en advarsel om cøliaki, når spor slås fra, men det forbydes ikke.

### Kostpræferencer (diæter) sat på pause (2. okt. 2026)

Jans beslutning: kostpræferencer skal ikke være en del af appen lige nu, men koden og logikken beholdes. Alt styres af ét flag,
`DIETS_ENABLED = false` i `constants.jsx`. Mens det er slået fra: trin 3 i onboarding er i stedet valget "Spor af allergener" (`renderTraceStep`, se afsnittet om følsomhed pr. allergen),
som springes over, hvis brugeren ingen allergier har valgt; diæt-trinnet (`renderDietStep`/`saveDietStep3`) er uændret og tilbage på trin 3 med flaget;
vælgerne er skjult i "Rediger præferencer" og i familieformularen; "Mine præferencer"/familiekort/Madpas/oplæsning/resultater og
profilvurderingen ser ingen diæter (`visibleDiets()` i `helpers.js`, brugt i `buildActiveProfileList`, `householdToProfiles`, Madpas,
Profil og Familie); den automatiske "Glutenfri"-diæt ved gluten-allergi (`useGlutenFreeSync`) er slået fra; "Rediger præferencer"
sender ikke `diets` med (gemte valg røres ikke); Leksikon skjuler kategorien Diæter; teksterne på velkomstsiden, i Madpas og i
hjælpen nævner ikke kosthensyn. Databasekolonnerne (`users.diets`, `family_members.diets`), Leksikon-indholdet, admin-panelet
(Brugere kan stadig se/redigere diæter), Madpas' diæt-tekster og privatlivs-/vilkårsteksterne er bevidst uændrede. Skal funktionen
tilbage: sæt flaget til true (og gennemgå privatlivs-/vilkårsteksten og tests i `helpers.test.js`).

### Allergileksikon kvalitetssikret (30. sept. 2026)

Fagligt stringent struktur, så allergi, intolerance og andre reaktioner ikke
blandes: **Allergener** = EU's 14 mærkningspligtige allergener + Hvede, hver
med en neutral "faglig status" (`status_label`, fx "Fødevareallergi",
"Cøliaki og hvedeallergi", "Overfølsomhed – sjældent allergi"). Laktose er
flyttet til Ingredienser ("Intolerance – ikke allergi"). **Ingredienser** =
kun det, der kan stå i en ingrediensliste; færdige retter/produkter ligger
i kategorien `dish` (ikke en flise i griddet, findes via søgning).
Risikoniveauer ("Høj risiko"/"Moderat") er fjernet helt (alvor afhænger af
personen) — genindfør dem ikke uden en klart defineret faglig betydning.
`allergen_ids` bruger nu `maelkeallergi` for mælkeprotein og `hvede` for
hvede (før fejlagtigt `laktose`/kun `gluten`). Dubletter slettet, bastante
sundhedspåstande omskrevet. Migrationer:
`supabase/migrations/20260930114148_knowledge_base_quality_review.sql` (+ `_2`),
backup i `knowledge_base_backup_20260930`.

### Beta-installation (september 2026) — nuværende arkitektur

Admin-dashboardet har en "Installations-QR til beta"-knap → `public/install.html`,
som viser en enhedsspecifik guide: iPhone/iPad får en 3-trins "Del → Føj til
hjemmeskærm"-visning (Apple tillader ikke programmatisk PWA-install), alt
andet redirectes til `eatsafe.dk/?src=beta-qr`. `usePwaInstall.js` fanger
`beforeinstallprompt`, og `InstallPrompt.jsx` viser en "Installér nu"-knap
(kun ved `?src=beta-qr`), med tekst-fallback efter 4 sek. hvis eventet
udebliver. `public/sw.js` bruger `self.skipWaiting()` + `self.clients.claim()`,
og `index.html` har en `controllerchange`-lytter der genindlæser siden én
gang — nødvendigt for at en opdateret service worker rent faktisk overtager
allerede-åbne faner (ellers kører en bruger med appen allerede åben videre
på den gamle service worker). Fejlfindingshistorien bag disse tre fund er
i `.claude/HISTORY.md`.

### MASTER PROMPT — visuelt system og polering af hele EatSafe-appen (27. sept. 2026, i gang)

Bjørn gav en stor, 14-punkts "MASTER PROMPT"-brief: mål er stringens/
konsistens/10/10-polish på tværs af HELE appen — eksplicit IKKE et
redesign, EatSafe-identiteten/lys food-baggrund/afrundede kort/venlige
tone/nuværende grønne retning skal bevares. Arbejdet batches i flere
PR'er efterhånden som dele bliver færdige og godkendt til push.

**Shippet:** et nyt 2-grønt farvesystem (`--green:#0F7D4F` til primære
handlinger/CTA'er inkl. Scan-knappen; adskilt `--green-accent:#34D06A` KUN
til små positive mikro-elementer som checkmarks/safe-badges — se
`.claude/rules/design-tokens.md` for den fulde token-tabel); brand-sloganet
"Mere tryghed i hverdagen" (kun under logoet på velkomstsiden og i "Om
EatSafe"-kortet, aldrig gentaget andre steder); en disclaimer-audit
(bekræftede den foretrukne ordlyd i ResultScreen.jsx, fjernede den
frarådede "ved alvorlige allergier"-formulering to andre steder); en
design-reviewer-agent-audit af Historik/Indkøbsliste/Madpas/Indstillinger/
Profil/Produktsider (Historik/Favoritter fik samme bordered-card-stil som
Indkøbslisten, to nye SVG-ikoner `door`/`building` erstattede emoji i
RestaurantGuide/ResultScreen/RecipesScreen); og tre runder velkomstside-
finpolish (lodret rytme, Feedback-knappens skygge/kant, juridisk teksts
linjebrud). Alt ovenstående + Opret konto/Log ind- og Onboarding trin
1-rundene (se deres egne afsnit) hører under samme MASTER PROMPT-brief.

**Restaurantguide droppet (1. okt. 2026, Bjørns beslutning):** siden
(`RestaurantGuideScreen.jsx`, `SCREENS.RESTAURANTGUIDE`) havde ingen indgang i
menuen og er slettet helt, inkl. hjælpetekst og ikonerne `door`/`building`.
Madpas dækker behovet for at vise sine allergier til personale. Skal den
genopstå, kan filen hentes fra git-historikken. `SCR-20` i `PAGE_IDS` er
ikke genbrugt, da id'erne ligger i gemte feedback-tickets.

**Resterende (ikke startet):** navigation/topbar/bottom-nav-gennemgang
(stikprøve viste allerede konsistente komponenter, ingen fund udover
Restaurantguide-fundet ovenfor (siden er siden droppet)), mikrocopy-gennemgang, tilgængelighedstjek,
og en afsluttende cross-page-visuel-konsistens-sammenligning. De fleste af
brief'ens punkter om Scan-flow/Produktside/Indstillinger-struktur er
allerede dækket af de separate runder beskrevet ovenfor i dette afsnit.
Fuld PR-for-PR-detalje i `.claude/HISTORY.md`.

### Opret konto & Log ind — "FINAL 10/10 POLISH" (27. sept. 2026)

`SCREENS.LOGIN` (Ny bruger + Log ind) bruger nu felt-specifikke fejl
(`emailError`/`passwordError` i `useAuth.js`) vist inline direkte under
det relevante felt på BEGGE faner — `authError` (den globale fejlboks) er
nu KUN for fejl der ikke kan knyttes til ét felt ("E-mail eller
adgangskode er forkert.", "Der opstod en fejl. Prøv igen.", email-
bekræftelses-beskeder). Catch-blokke propagerer ALDRIG længere
`e.message` til brugeren (forhindrede en reel lækage af rå fetch-/JS-
fejltekster ved en ægte netværksfejl) — kun faste, venlige beskeder vises.
"Har du allerede en konto?"/"Har du ikke en konto?"-linkene er fjernet fra
begge faner (den segmenterede `.tab-row`-kontrol er nu eneste sekundære
navigation). Legal copy på Ny bruger er rettet til samme "brugsvilkår +
privatlivspolitikken"-ordlyd/links som velkomstsiden (ikke længere et
fiktivt "over 13 år"-alderskrav). En altid synlig adgangskode-hjælpetekst
("mindst 10 tegn") skifter kun farve/vægt ved et mislykket forsøg, ingen
dubleret linje. CTA'er og sociale login-knapper er verificeret 100%
identiske mellem de to faner. **Ikke implementeret, afventer brugerens
afklaring:** "Fortsæt med Apple" — kræver et Apple Developer-konto-setup +
er en produktdistributionsbeslutning (App Store/TestFlight-krav), ikke en
ren styling-opgave. Fuld detalje i `.claude/HISTORY.md`.

### Onboarding trin 1 ("Hvem er du?") — "FINAL 10/10 POLISH" (27. sept. 2026)

Onboardingens trin 1 (Navn/E-mail/Telefon/Alder/Køn,
`OnboardingScreen.jsx`) har felt-specifikke inline-fejl (samme mønster som
Login ovenfor) i stedet for én samlet "Mangler: ..."-sætning. Telefonnummer
kræver nu præcis 8 cifre (dansk mobilnummer-længde) med automatisk parvis
gruppering ("12 34 56 78"). Alder-stepperen (`FormFields.jsx`, delt med
`MemberForm.jsx`) har ensartet 44×44pt-højde på minus/værdi/plus + en
tydelig `:active`-tryk-feedback. Køn-vælgeren (`ChoiceCard`,
`DesignSystem.jsx`) har fået et diskret checkmark ved valgt-state, samme
mønster som chip-baserede vælgere andre steder. E-mail-feltets read-only-
visning (prefillet fra konto, eller bekræftet via Google) bruger nu en
positiv grøn baggrundstone (`--green-lt`/`--green-mid`) i stedet for
`opacity:.6`, som gav et fejlagtigt "disabled/fejlramt"-udseende. Fuld
detalje i `.claude/HISTORY.md`.

**Opdateret 29. sept. 2026 (QA-beslutning D2), 30. sept. 2026:** Telefon
er fjernet helt fra onboarding, oprettelse og Rediger profil. **Alder og Køn SKAL forblive
obligatoriske** — Jans eksplicitte beslutning: han bruger dem, selvom
appens egne funktioner ikke gør. Foreslå ikke at fjerne dem igen af
dataminimeringshensyn.

**Oprettelse og e-mailbekræftelse (30. sept. 2026, Bjørns spec — erstatter
Jans punkt 7 om trin 1 før oprettelse):** "Opret konto" kræver kun e-mail,
adgangskode og accept af vilkår (tekst under feltet), opretter kontoen med
det samme og viser `SCREENS.VERIFYEMAIL` (`VerifyEmailScreen.jsx`): "Jeg har
bekræftet min e-mail", "Send mail igen" (Supabase `/auth/v1/resend`, 60 s
nedtælling), "Skift e-mailadresse" og spam-hjælpetekst. Bekræftet →
"✓ E-mail bekræftet" + "Fortsæt opsætning" → onboarding fra gemt trin.
Tre adskilte tilstande: konto oprettet (`as_pending_verify` i localStorage →
appen åbner bekræftelsesskærmen igen), e-mail bekræftet (session, men
`onboarding_completed=false` → onboarding), onboarding færdig
(`as_onboarded` → kun da starter appen direkte på forsiden; ellers venter
den på status på `SCREENS.BOOT`). Login med ubekræftet e-mail åbner
bekræftelsesskærmen, og et udløbet link giver en forklaring. "Jeg har
bekræftet" logger ind med adgangskoden fra oprettelsen (kun i hukommelsen);
efter en genstart sendes brugeren til Log ind med e-mailen udfyldt.
Databasen (migrationer `20260930193753` og `20260930194647`):
`handle_new_user()` sætter ikke længere e-mailens lokale del som navn, og
velkomstmailen sendes KUN når `onboarding_completed` skifter false → true
(triggeren `on_onboarding_completed`) — aldrig ved oprettelse, login,
bekræftelse eller genstart; de gamle triggere på oprettelse/bekræftelse og
`send_welcome_email()` er fjernet. Én mail pr. bruger: `welcome_sent_at`
reserveres atomisk før afsendelsen. Velkomstmailens HTML ligger i repoet
(`supabase/templates/resend/N1-velkomst.html` → `_shared/welcomeMail.ts`
via `node scripts/build-welcome-mail.mjs`, testet i `src/welcomeMail.test.js`)
med overskriften "Velkommen til EatSafe" og BETA som badge. Bekræftelses-
linket lander på appens egen side "✓ Din e-mail er bekræftet" →
"Fortsæt opsætning" (næste manglende trin). Google/Facebook går uændret
direkte til onboarding.

### App-headeren omdøbt til fælles komponent + tekst-wordmark (27. sept. 2026)

App-headeren er udtrukket til en navngivet, genbrugelig komponent
`AppHeader.jsx` (samme markup/adfærd som den tidligere inlinede blok i
App.jsx, renderet ét sted, derfor allerede pixel-identisk på tværs af
Scan/Historik/Indkøbsliste og øvrige hovedfaner). Branding er nu
udelukkende en ren tekst-wordmark ("Eat" i `--ink`, "Safe" i `--green`,
~24px, semibold/bold) i stedet for det fulde `EatSafeLogo`-billedeaktiv —
scanner-/stregkodeikonet skal her udelukkende signalere selve
scan-funktionen (Scan-knappen, bundnav), ikke indgå i selve
branding-teksten. `EatSafeLogo` selv er uændret alle andre steder
(velkommen/login/onboarding/admin) — kun app-headeren er undtaget fra det
ellers gældende "ét fast billedaktiv"-princip. BETA-badgen bruger nu en
delt `.topbar-beta`-klasse med lodret centrering mod tekstlogoet (`line-
height:1` + `inline-flex`, ingen manuel `marginTop`-hack). `.topbar` har
fået `calc(12px + env(safe-area-inset-top))`-håndtering af statuslinjen/
Dynamic Island. Undersidernes egen "tilbageknap + titel"-række er bevidst
UÆNDRET i denne omgang. Fuld detalje i `.claude/HISTORY.md`.

### Velkomstsiden — finpolish af logo/spacing/CTA-hierarki/juridisk tekst (29. sept. 2026)

Endnu en detaljeret, 9-punkts spec til `SCREENS.WELCOME` — bevidst bevaret
visuel stil/baggrundsbillede/farver/logo/indhold, kun de ni beskrevne
justeringer. Alle ændringer i `OnboardingScreen.jsx` (kun WELCOME-blokken)
og `theme.jsx`s `.welcome-*`-regler. LOGIN/Ny bruger-fanen er UBERØRT (de to
CSS-klasser `.welcome-btn`/`.welcome-btn-ghost` genbruges der, se nedenfor
for hvordan det er skærmet af).

- **Logoet** (`EatSafeLogo`, komplet med scannerikon) er uændret i størrelse
  og allerede korrekt centreret (`.welcome-logo-wrap{align-items:center}`)
  — ingen kodeændring nødvendig her, kun verificeret.
- **Hovedindholdet flyttet op** — `.welcome-vspace-top`s flex-grow-vægt
  (samme spacer-mekanisme som 28. sept.) sænket 0.62→0.35, hvilket flytter
  logoet ~30px op på en standard iPhone-bredde (målt, ikke gættet).
  Feedback-knappen er en søskende-position uden for denne mekanisme og
  derfor upåvirket.
- **Brand-sloganet** ("MERE TRYGHED I HVERDAGEN") mørknet — scoped
  `.welcome-logo-wrap .brand-slogan{color:var(--ink2)}` (var `--muted`,
  virkede udvasket), IKKE den delte base-`.brand-slogan`-klasse, så
  SettingsScreen.jsx's "Om EatSafe"-brug af samme klasse er uændret.
  Letter-spacing reduceret .6px→.4px.
- **Intro-teksten fik et reelt fund:** brød over 3 linjer ved den
  daværende 300px max-width, i strid med kravet om maks. 2 linjer.
  Rettet ved at øge `.welcome-tagline`s max-width til 340px (font-size/
  vægt/centrering uændret) — giver 2 linjer på standard iPhone- og
  Pro Max-bredde; forbliver 3 linjer på den mindste SE-klasse (320px),
  hvor det ikke er opnåeligt uden at gå på kompromis med den krævede
  "behold den nuværende læsbare størrelse".
- **De tre fordele** — ikonernes lysegrønne bokse formindsket ~9%
  (44px→40px, border-radius 14→13px), fortsat præcist ens størrelse/
  centrering/afstand for alle tre (var allerede strukturelt garanteret via
  fast `width`/`height` + flex-centrering, kun selve målet er ændret).
- **CTA-hierarki** — begge knapper fik en `min-height` (62px/56px) +
  eksplicit flex-centrering af teksten, i stedet for at ramme en højde via
  padding alene (upræcist på tværs af font-rendering). Skærmet specifikt
  til `.welcome-screen .welcome-btn`/`.welcome-screen .welcome-btn-ghost`
  — de samme to klasser bruges også af Opret konto/Log ind-formularens
  submit-knapper (`.login-wrap`), som er uden for denne opgaves scope og
  derfor bevidst IKKE ændret højde (verificeret: forbliver 50px).
  Bredde/radius var allerede identiske mellem de to velkomst-knapper.
- **Juridisk tekst** — `fontSize` 11px→10.5px, farve
  `rgba(21,32,26,.85)`→`rgba(21,32,26,.6)` (mere neutral/sekundær, mindre
  visuel vægt), selve teksten og de grønne, fede links uændrede.
- **Vertikal rytme (punkt 9)** — seks mellemrum justeret til spec'ens
  målintervaller, verificeret programmatisk præcis i midten af hvert
  interval på tværs af tre enhedsbredder: logo→tagline 14px (mål 12-16),
  tagline→intro 26px (24-28), intro→fordele 34px (32-36), fordele→primær
  CTA 40px (38-44), primær→sekundær CTA 18px (16-20, opnået ved at skifte
  knap-wrapperens flex-gap fra 10 til 6px, da `.welcome-btn`s egen
  margin-bottom:12 lægger sig oveni), sekundær CTA→juridisk tekst 28px
  (26-32, beregnet fra selve elementets `margin-top`, da preview-buildets
  ekstra "Se app uden login"-genvejslink ikke findes i produktion og derfor
  ville forvride en direkte visuel måling i selve preview'en).
- Verificeret med Playwright (artifact-preview-build, `getBoundingClientRect()`
  på hvert element) på tre enhedsbredder (SE 320×568, iPhone 13 390×844,
  Pro Max 430×932): alle seks mellemrum, logo-centrering, ikon-boks-
  ligestørrelse, knap-højder og 2-linjers intro-tekst (undtagen SE, se
  ovenfor) bekræftet. `.login-wrap`s formular-knapper bekræftet upåvirkede
  (50px, uændret). `npm run build`/`npx vitest run` (110/110) grønne,
  mojibake-scan clean.

**Sidste spacing-polering, samme dag (29. sept. 2026) — fire mikro-
justeringer, intet redesign:**
- `.welcome-tagline`s max-width 340→324px (8px ekstra luft i hver side) —
  brugerens mål var 12-16px, men en probe direkte i den byggede app viste
  at alt under 324px brækker teksten i 3 linjer på standard/Pro Max-bredde,
  hvilket ville modsige en tidligere rundes eksplicitte 2-linjers-krav.
  324px er derfor den størst mulige reduktion inden for det constraint.
- `.welcome-tagline`s margin-top 26→16px (10px mindre luft til sloganet).
- `.welcome-benefit`s gap 8→4px (labels 4px tættere på deres ikoner).
- Den juridiske teksts marginTop 28→18px (10px tættere på "Jeg har
  allerede en konto"-knappen).
- Alle fire verificeret programmatisk (samme Playwright-metode som
  ovenfor) på tre enhedsbredder — 2-linjers intro-teksten bevaret på
  standard/Pro Max, uændret 3 linjer på SE-klassen (samme kendte vilkår
  som før). `npm run build`/`npx vitest run` (110/110) grønne, mojibake-
  scan clean.

### Ny bruger & Log ind — sidste UI/UX-polering, produktionsklar (29. sept. 2026)

En 10-punkts spec til `SCREENS.LOGIN` — robusthed/konsistens/tilgænge-
lighed, ikke et redesign. De to faner brugte allerede stort set 100% de
samme delte CSS-klasser (`.login-card`/`.field`/`.tab-row`/`.tab`/
`.welcome-btn`/`.social-btn`) og samme felt-fejl-mønster fra en tidligere
runde (se "Opret konto & Log ind — FINAL 10/10 POLISH" ovenfor) — verificeret
programmatisk identiske (højde/radius/border/font/farve) mellem faner i
stedet for gættet. To reelle huller fundet og rettet:

- **Autofill havde ingen styling overhovedet** — browserens kraftige gule
  standard-baggrund (Chrome/Safari) skinnede ugarderet igennem på et
  autofillet felt. Tilføjet `.field:-webkit-autofill`-overstyring (stort
  inset-`box-shadow`-spread i feltets egen `--surface2`-baggrundsfarve —
  almindelig `background`-styling ignoreres af Chromium her, en lang
  transition-delay forhindrer et kort gult glimt). Gælder alle `.field`-
  brug app-bredt (fx onboarding trin 1), ikke kun Log ind. Selve autofill-
  funktionaliteten er uændret.
- **Ingen `autocomplete`-attributter fandtes på nogen af de fire felter**
  — tilføjet `email` (begge fane-e-mail-felter), `new-password` (Opret
  konto) og `current-password` (Log ind).
- **Segmenteret kontrol** — `.tab.active`s box-shadow skiftet fra den
  delte to-lags `--sh`-token (inset hvid linje + drop-skygge, som sammen
  med `.tab-row`s egen grønne kant kunne virke som en dobbelt kant) til én
  enkelt, diskret drop-skygge (`0 1px 3px rgba(21,32,26,.10)`). Bredde/
  højde var allerede identisk mellem de to faner (flex:1), kun verificeret.
- **"Husk mig"/"Glemt adgangskode?"-rækken** fik `min-height:44` på både
  checkbox-labelen og linket (usynlig padding, ikke en visuel forstørrelse)
  — opfylder 44×44px-touch-target-minimummet uden at ændre hvordan
  checkbox/tekst/link ser ud eller er placeret.
- **Validation states, form-level vs. field-level** — begge var allerede
  korrekt implementeret fra den tidligere "FINAL 10/10 POLISH"-runde
  (felt-fejl: rød kant + rød tekst under feltet, ingen aggressiv fejl mens
  brugeren skriver, kun ved forsøgt submit; form-level: den delte
  `ErrorMessage`/`.error-box`-komponent med lys rød baggrund, diskret rød
  kant, advarselsikon og rød tekst, generisk "E-mail eller adgangskode er
  forkert." der ikke afslører hvilket felt) — verificeret ved kodegennemgang
  og Playwright (felt-fejl udløst ved tomt/for kort felt, cleared øjeblik-
  keligt ved næste tastetryk; form-level-boksens FARVER/struktur bekræftet
  via en mocket 400-fejl, om end selve fejlteksten faldt tilbage til den
  generiske besked pga. sandboxens kendte upålidelige Supabase-netværks-
  mocking, se tidligere sessions — ikke en regression i selve koden).
- **Responsive keyboard-adfærd (punkt 9)** — verificeret ved kodegennemgang
  (ingen ægte mobil-tastatur kan simuleres i sandboxen): hverken `.login-
  wrap`, `.app`, `body` eller `html` sætter `height:100vh`+`overflow:hidden`
  noget sted i kæden, kun `min-height:100vh` — dokumentets naturlige scroll
  er derfor allerede intakt, og browseren kan rulle et fokuseret felt i
  syne som normalt.
- **Uændret, som krævet:** baggrundsbillede, EatSafe-logo, layout,
  informationsarkitektur, sociale login-knappers ikon+tekst-centrering
  (allerede korrekt: `justify-content:center` på hele gruppen), CTA'ernes
  visuelle hierarki.
- `npm run build`/`npx vitest run` (110/110) grønne, mojibake-scan clean
  (fangede undervejs en reel byggefejl — en backtick i en ny CSS-kommentar
  i `theme.jsx`s `appCss`-template-literal, samme kendte fejlklasse denne
  fil advarer om andetsteds, rettet før commit).

### Onboarding-persistens — reel routing-/state-bug rettet (29. sept. 2026, backend/funktion — Jans spor)

Brugeren (Bjørn) bad om en 8-punkts backend-/routing-audit af onboarding-
flowet. Reelt, alvorligt fund bekræftet ved kodegennemgang OG live data: en
bruger med et gemt token, men `onboarding_completed=false` (aldrig
gennemført onboarding, eller lukkede appen midtvejs), blev VED HVER
APPSTART/LOGIN sendt direkte til scanner-forsiden — `screen`-useState'ens
initiale gæt (`localStorage.getItem("as_token") ? HOME : WELCOME`) og
`handleLogin` tjekkede aldrig `onboarding_completed`. Bekræftet i den LIVE
Supabase-database: 9 af 19 eksisterende brugere havde reelt
`onboarding_completed=false` (nogle med allerede gemte allergener), som
alle blev fejlagtigt lukket direkte ind i hovedappen af den daværende kode.

**Datamodel** (`users`-tabellen havde allerede `onboarding_completed`,
boolean — men intet felt til at huske PRÆCIS hvilket trin): ny
`onboarding_step`-kolonne (integer, 1-5, default 1) + et engangs-backfill-
migration for eksisterende brugere, udledt af reelle gemte signaler
(navn/allergener/diæter-E-numre/familiemedlemmer), IKKE kun "har mindst én
allergi" som eneste kriterium (brugerens eksplicitte krav). Se `src/
CONTEXT.md` afsnit 6 for den fulde kolonne-/migrations-detalje.

**Routing rettet tre steder** (`useAuth.js`, ny delt `resolveOnboardingRoute`-
funktion, genbrugt af alle tre for at undgå at de kan modsige hinanden):
app-boot (et token i storage udløser nu et tjek af reel status, ikke et
blindt HOME-gæt), e-mail/adgangskode-login (fetcher status FØR den vælger
ONBOARD/HOME, i stedet for altid HOME), og OAuth-callbacken (som allerede
delvist gjorde det rigtige, men fejlagtigt nulstillede en RETURNERENDE,
ufuldført OAuth-brugers gemte trin tilbage til 1 ved hvert login — rettet
til kun at nulstille for en reelt NY konto).

**Route guard** (`App.jsx`): `setScreen` er nu en guardet wrapper omkring
den rå `useState`-setter — ethvert forsøg på at navigere til en skærm uden
for WELCOME/LOGIN/ONBOARD, mens `user.onboarding_completed===false`, bliver
omdirigeret til ONBOARD i stedet. Wrappet ÉT sted (ikke ved hvert af de
~30+ eksisterende `setScreen`-kaldesteder), så al eksisterende kode
automatisk får beskyttelsen. `finishOnboard()` opdaterer nu eksplicit den
lokale `user.onboarding_completed` FØR den selv navigerer til Hjem — ellers
ville guarden ironisk nok blokere selve fuldførelsen af onboardingen.

**Genoptagelse midt i et trin:** `onboardStep` PATCHes til backend, hver
gang det ændrer sig (`useOnboarding.js`, gated til kun at køre mens
`screen===ONBOARD`, så det ikke nulstiller en allerede færdig brugers gemte
trin ved almindelig appstart). To reelle, pre-eksisterende huller fundet
undervejs: kostpræferencer (trin 3) og E-numre (trin 2's accordion) blev
KUN gemt til backend fra "Rediger præferencer" på Profil-siden, ALDRIG fra
selve onboardingen — valgt der gik tabt hvis brugeren lukkede appen før
trin 5. Begge nu gemt løbende (`saveDietStep3`, udvidet `saveAllergensStep2`),
samme ikke-avancér-ved-fejl-mønster som allergener allerede brugte.

**Reel bug fundet under implementeringen (produktions-kritisk, ville have
crashet appen for ALLE brugere):** `setOnboardStep` blev sendt som en almindelig
objekt-egenskab (`{ setOnboardStep }`) ind i `useAuth`-konfigurationen, FØR
variablen var deklareret længere nede i filen — modsat en closure (`() =>
setOnboardStep(1)`, som allerede fandtes og ER sikker, da den kun evalueres
ved selve KALDET, ikke ved oprettelsen). Gav en øjeblikkelig "Cannot access
'setOnboardStep' before initialization"-TDZ-krasch ved hver eneste side-
indlæsning — fanget af en Playwright-smoke-test (IKKE af build/vitest, som
begge var grønne), rettet ved at flytte `onboardStep`/`setOnboardStep`s
`useState` op i App.jsx til FØR `useAuth()`-kaldet (var tidligere ejet af
`useOnboarding.js`, som kaldes EFTER `useAuth()`).

**Verifikation:** `npm run build`/`npx vitest run` (110/110) grønne,
mojibake-scan clean, Playwright-smoke-test (artifact-preview-build)
bekræftede ingen runtime-fejl og at preview-bypass-flowet (uautentificeret,
`onboarding_completed` forbliver bevidst `undefined`/"ukendt" for denne
brugertype) samt normal bundnav-navigation er upåvirket af den nye guard.
**Kendt begrænsning:** selve login-/signup-netværksflowet mod den ægte
Supabase-auth-endpoint kunne IKKE testes end-to-end i denne sandbox — et
forsøg på at mocke `https://jegrpcflyguadyxialkm.supabase.co/auth/v1/token`
via Playwrights `page.route()` fejlede med `net::ERR_FAILED` FØR selve
mock-interceptoren nåede at reagere, dvs. sandboxens udgående netværks-
politik blokerer den rigtige Supabase-vært fra selve browser-konteksten
(samme kendte klasse af begrænsning som tidligere sessioners "kan ikke
mocke Supabase-netværk pålideligt her", se afsnit 4's note om
skærmbilleder) — verificeret i stedet ved grundig manuel kode-sporing af
alle tre routing-stier samt direkte SQL-verifikation af skema/RLS/backfill
mod den LIVE database.

---



## Gammel afsnit 7 (Claude Code Setup Audit-status)

### Claude Code Setup Audit & Rescue-audit — status

Begge er fuldført og merget. Claude Code Setup Audit-selvevalueringen
(oprindeligt 30/100) er bragt op med `.claude/rules/`, `.claude/skills/`,
`.claude/commands/`, en reelt håndhævet mojibake-hook, en
`permissions.deny`-liste, `design-reviewer`-agenten,
`security-check`-/`token-audit`-skills, `allowed-tools` på skills, en
PreToolUse-hook mod farlige bash-kommandoer, og en path-scoped
`edge-function-auth.md`-regel. Rescue-audittets fulde 4-fase-roadmap
(to omgange: artifact
https://claude.ai/artifact/NsG75NGKsGsFTugYtwxu9X og opfølgende
https://claude.ai/artifact/EvHQTrmjF1XjJEbuFzWFed) er implementeret —
kritiske ubeskyttede Edge Functions, RPC-eksponering og et
feltnavne-mismatch-mønster (`customAllerg` vs. `.custom`) er rettet,
AdminScreen.jsx-/App.jsx-opsplitningen (se afsnit 3) er gennemført, og
RLS-performance-advisories/`npm audit fix --force` er kørt.
**Supabase dev/branching-miljø er bevidst IKKE sat op** (kræver en højere
Supabase-plan end nuværende abonnement) — genoptag når abonnementet
opgraderes; indtil da går alle skema-/edge-function-ændringer fortsat
direkte til produktion, som beskrevet i `src/CONTEXT.md`. Fuld
dag-for-dag-log for begge audits er i `.claude/HISTORY.md`.

**Resterende, kun brugeren kan gøre det:** aktivér "Leaked Password
Protection" i Supabase Dashboard (Authentication → Policies) — intet
tilgængeligt værktøj kan ændre denne indstilling (se afsnit 0 for detalje).


---

# Arkiv fra CONTEXT.md-oprydning (2. okt. 2026)

Ordret flyttet ud af `src/CONTEXT.md`. Nutidstilstanden står i den trimmede CONTEXT.md.

## Gammel header, projektoverblik, tech stack, filstruktur, arkitekturregel, screens (afsnit 1-5)

# EatSafe — CONTEXT.md

> **Sidst opdateret:** 11. september 2026
> **Opdateres ved større ændringer. Deles med AI-assistenter som sessionskontekst.**
> **Se også `/CLAUDE.md`** i repo-roden — den samler projektoverblik, arkitektur og
> vores arbejdsgang ét sted, og linker hertil for fuld teknisk detalje.

---

## 1. Projekt-overblik

**EatSafe** er en dansk allergen-scanning PWA rettet mod forbrugere med fødevareallergier og -intolerancer. Brugere scanner stregkoder, og appen matcher ingredienser mod deres allergiprofil og viser klare advarsler.

| Nøgle | Værdi |
|-------|-------|
| URL | https://eatsafe.dk |
| GitHub | janfogde-sketch/Allergi-Scan |
| Branches | `main` (produktion) · `dev` (udvikling) |
| Supabase projekt-ID | jegrpcflyguadyxialkm |
| Supabase URL | https://jegrpcflyguadyxialkm.supabase.co |
| Vercel | Auto-deploy på både `main` og `dev` |
| Admin bruger | janfogde@gmail.com (`404caa7f-91b0-4bad-a2a8-bcb6a396d35f`) |
| Kontakt email | hej@eatsafe.dk (oprettes hos One.com) |

---

## 2. Tech stack

| Lag | Teknologi |
|-----|-----------|
| Frontend | React 18 + Vite 5, JSX (ikke TSX) |
| Hosting | Vercel (auto-deploy fra GitHub) |
| Backend | Supabase (PostgreSQL, Edge Functions, Auth, Storage) |
| Edge Functions | Deno/TypeScript — JWT verification DISABLED (ES256-inkompatibilitet) |
| AI | Claude Haiku 4.5 (allergen-fallback + OCR), ANTHROPIC_API_KEY som Supabase secret |
| Ekstern data | Open Food Facts API v2, TheMealDB |
| Lokal dev | Windows, `C:\Users\janfo`, `set`-syntaks for env vars |

---

## 3. Filstruktur

```
src/
├── App.jsx                   # Routing, global state, lookupProduct, alle handlers
├── constants.jsx             # ALLERGENS, SCREENS, DIETS, E_NUMBERS, SUPABASE_URL/ANON_KEY, uid
├── helpers.js                # compareAllergens, extractENumbers, compareENumbers,
│                             #   checkDietCompatibility, initials, getAllergenLabels,
│                             #   verifiedBadge, makeHeaders, apiCall, timeAgo,
│                             #   traceId, traceLog, getTraceLog, clearTraceLog
├── theme.jsx                 # CSS-variabler, injectTheme(), ThemeStyle komponent
├── SharedComponents.jsx      # Icon, IngredientsList (med onIngredientTap),
│                             #   ProfileBadges, getProductIcon, ProductImage, EatSafeLogo
│
├── — Hooks —
├── useScanner.js             # Kamera, auto-zoom, tap-to-focus, lommelygte,
│                             #   scanFromGallery, scanPhotoForEan (foto-fallback)
├── useAlternatives.js        # Sikre alternativer ved farlige produkter
│                             #   Kategori-match → overkategori fallback → filtrér allergen-profil
├── useMadpas.js              # Madpas speak-funktion + madpasSpeaking/WaiterView state
├── useSearch.js              # Søgning via Edge Function med 350ms debounce
├── useAdmin.js               # Admin CRUD (brugere, submissions, tickets)
├── useRecipes.js             # Opskrifter CRUD
├── useShoppingList.js        # Indkøbsliste + Supabase Realtime WebSocket sync
│
├── — Screens (routing via App.jsx) —
├── ScannerScreen.jsx         # Router + HOME screen
├── ResultScreen.jsx          # RESULT — scan-resultat, alternativer, allergen-match,
│                             #   ingrediens-tap→leksikon, E-nummer chips, næring
├── NotFoundScreen.jsx        # NOTFOUND — 5-trins produkt-indsend flow
├── SubmittedScreen.jsx       # SUBMITTED — tak-skærm efter indsendelse
├── SearchScreen.jsx          # SEARCH — søgning + profil/manuel allergen-filter
├── ListScreen.jsx            # LIST — indkøbsliste + favoritter
├── SuggestEditScreen.jsx     # SUGGEST_EDIT — foreslå rettelse til produkt
├── ProfileScreen.jsx         # PROFILE, EDITPROFILE (kun navn), EDITPREFERENCES
│                             #   (allergier/intolerancer/diæt/E-numre), FAMILY, HISTORY,
│                             #   FAVORITES, ADMIN
│                             #   Footer: hej@eatsafe.dk + privatlivspolitik link
├── ProfileMenu.jsx           # Slide-out menu fra højre (åbnes via hamburger-ikon i
│                             #   topbar) — profil-hero + links til Favoritter, Familie,
│                             #   Scanningshistorik, Opskrifter, Viden, Madpas,
│                             #   Admin. Portal til document.body.
├── OnboardingScreen.jsx      # WELCOME, LOGIN, ONBOARD
├── KnowledgeScreen.jsx       # KNOWLEDGE — Leksikon
├── RecipesScreen.jsx         # RECIPES — opskrifter (gradient header)
├── MadpasScreen.jsx          # MADPAS (17 sprog) — strukturerede sektioner, kun on-device (intet link/QR/PDF)
├── AdminScreen.jsx           # Mobil admin-panel (via ProfileScreen)
│                             #   Tabs: Dashboard, Brugere, Indsendelser, Tickets,
│                             #         Debug, Manglende, Import
│
├── — Delte komponenter —
├── MemberForm.jsx            # MemberForm, CategorySelect
├── AllergenPicker.jsx        # AllergenChipPicker, DietChipPicker, ENumberPicker,
│                             #   useGlutenFreeSync (delt gluten↔glutenfri-sync-hook,
│                             #   bruges af onboarding + MemberForm + Rediger præferencer)
├── FeedbackModal.jsx         # FeedbackModal med debug trace
│
├── — Desktop admin-panel (NY, 24. sept. 2026) —
├── admin/                    # Separat Vite-entrypoint på eatsafe.dk/admin.html
│   │                         #   (ikke en del af den mobile PWA's SCREENS-routing/
│   │                         #   bundle — egen React-rod, sidebar+tabel-layout til
│   │                         #   skærm/computer. Deler localStorage-session
│   │                         #   (as_token/as_refresh/as_user_id) med hovedappen.
│   │                         #   Genbruger useAdmin.js's data-lag som-is.
│   ├── main.jsx               # React-rod, injicerer adminTheme.js
│   ├── AdminApp.jsx            # Login-gate (rolle-tjek mod users.role) + router
│   ├── AdminLayout.jsx          # Sidebar-navigation + topbar
│   ├── useAdminAuth.js          # Standalone login (email+password, ingen signup/OAuth)
│   ├── adminTheme.js            # Desktop-specifik CSS (egen fra src/theme.jsx)
│   └── sections/                # DashboardSection, UsersSection, SubmissionsSection,
│                                 #   TicketsSection, MissingSection, ImportSection,
│                                 #   RecipesSection — desktop-tabel-versioner af de
│                                 #   tilsvarende Admin*Section.jsx-filer ovenfor
│
└── — Statiske sider (public/) —
    privacy.html              # Privatlivspolitik på eatsafe.dk/privacy
    invite.html               # Familie-invitation på eatsafe.dk/invite/[token]
    madpas-view.html          # Offentlig madpas-visning på eatsafe.dk/madpas/[token]
```

---

## 4. ⚡ ARKITEKTUR-REGEL — NYE SKÆRME BYGGES ALTID SOM EGNE FILER

**Alle nye skærme og større UI-sektioner skal fra starten bygges som selvstændige komponenter i egne filer.**

1. **Én screen = én fil.** Ny screen oprettes som `XxxScreen.jsx` fra dag ét
2. **Props frem for masse-state.** Lokalt state lever i screen-komponenten selv
3. **Ingen IIFE-patterns.** `{condition && (() => { ... })()}` er forbudt
4. **Ingen hooks i betinget kode.** React hooks altid øverst i komponenten
5. **Hooks til logik.** Al logik i dedikerede hooks — ikke inlined i App.jsx
6. **ScannerScreen er router.** Sub-screens er egne filer

---

## 5. Screens / Navigation

| SCREENS-konstant | Fil | Beskrivelse |
|-----------------|-----|-------------|
| HOME | ScannerScreen | Hjem |
| RESULT | ResultScreen | Scan-resultat + alternativer |
| NOTFOUND | NotFoundScreen | 5-trins indsendelse |
| SUBMITTED | SubmittedScreen | Tak-skærm |
| SEARCH | SearchScreen | Søgning |
| LIST | ListScreen | Indkøbsliste |
| SUGGEST_EDIT | SuggestEditScreen | Foreslå rettelse |
| PROFILE | ProfileScreen | Profil |
| FAMILY | ProfileScreen | Familie + invitationslink |
| KNOWLEDGE | KnowledgeScreen | Leksikon |
| RECIPES | RecipesScreen | Opskrifter |
| MADPAS | MadpasScreen | Madpas (kun on-device, intet link/QR) |

Bundmenu (opdateret sept. 2026): `Indkøbsliste (venstre) → Scan (midten, barcode-ikon)
→ Søg (højre)`. Profil, Familie, Favoritter, Historik, Opskrifter, Viden, Madpas
og Admin nås nu via et hamburger-menu-ikon i topbaren th., som åbner
`ProfileMenu.jsx` (slide-out fra højre). Se `/CLAUDE.md` afsnit 3 for detaljer og
begrundelse.

---


## Gamle noter i databaseafsnittet (afsnit 6, linje 179-321: source_method, role-escalation, onboarding, sikkerhedsfund)

**`products.allergen_source_method` (25. sept. 2026 — forslag F fra
allergen-detektions-gennemgangen):** sporer HVORDAN de nuværende
`allergen_flags` blev beregnet, adskilt fra `allergen_quality` (som er
tillids-niveauet). Værdier: `keyword` (kun nøgleords-motoren), `keyword+
claude` (keyword + Claude-fallback/`force_ai`), `off_tags` (kun Open Food
Facts' egne `allergens_tags`/`traces_tags`, ingen `ingredients_text` at
køre keyword-motoren på), `off_tags+keyword` (OFF-tags flettet med
keyword-motoren mod `ingredients_text`, se afsnittet om `products`-Edge
Function ovenfor). `NULL` = ukendt/uverificeret herkomst — typisk den
oprindelige bilka/nemlig-import-pipeline (ikke i dette repo, se punktet om
data-provenance-gab i `.claude/HISTORY.md`) eller data der aldrig er rørt
af vores egne funktioner siden. Skrives af `auto-reparse`, `allergens`
(dens interne `save`-vej) og `products`' OFF-fallback-gem — IKKE af
`useAdmin.js`s admin-godkendelsesflows' egne direkte `PATCH`-kald mod
`products`, som nu (samme dato) også er rettet til at udlede
`allergen_quality` fra det FAKTISKE `method`-svar fra `allergens`-
funktionen i stedet for at hardkode `"high"` — et `force_ai:true`-kald der
stille fejler (fx manglende `ANTHROPIC_API_KEY`) returnerer `method:
"keyword"`, og det ville tidligere fejlagtigt være blevet gemt som `"high"`
alligevel.

**`users.role`-beskyttelse (24. sept. 2026, fundet under admin-audit):**
`users_update_own_or_admin`-policyen tillader `id = auth.uid()` (selv-
opdatering af egen profil) uden kolonne-begrænsning — og `authenticated`
har kolonne-UPDATE-ret på `role`. Uden yderligere beskyttelse kunne enhver
logget ind bruger derfor sætte sin egen `role` til `admin` via en almindelig
`PATCH /rest/v1/users?id=eq.<eget-id>`, og `on_user_role_change`-triggeren
ville automatisk synkronisere det ind i deres JWT `app_metadata.role` oveni.
Rettet med en `BEFORE UPDATE`-trigger (`prevent_role_self_escalation_trigger`
→ `prevent_role_self_escalation()`) der blokerer enhver ændring af `role`,
medmindre den kaldende bruger (`auth.uid()`) allerede er admin — verificeret
med en JWT-simuleret SQL-test at både blokeringen og admins fortsatte evne
til at ændre ANDRE brugeres rolle virker. Postgres RLS kan ikke i sig selv
begrænse per-kolonne, så en tilsvarende trigger bør overvejes for andre
tabeller med et lignende "selv-ejerskab uden kolonne-begrænsning"-mønster,
hvis en ny privilegeret kolonne nogensinde tilføjes til `users` eller andre
selv-redigerbare tabeller.

**`allergen_levels` på `users` og `family_members` (2. okt. 2026, migration `20261001120049`):** følsomhed pr. allergen, fx
`{"maelkeallergi":"direct_only"}`. Mangler et allergen, er det "strict" (spor flagges som advarsel, som hidtil); `direct_only` =
brugeren reagerer kun på direkte indhold, så spor flagges ikke, men vises som en rolig info-linje. Logikken ligger i `helpers.js`
(`compareAllergens(flags, ids, levels)` → `ignoredTraces`, `computeProfileResults`, `mergeAllergenLevels` — strengeste aktive profil vinder,
`ignoresTraces`). På produktsiden er spor nu GULE ("Kan indeholde spor"); kun direkte indhold er rødt "Allergi-advarsel". Husstandskonti
får deres niveauer via `family/group` (`allergenLevels`), og `notify` (P1) sender ikke en ændring til spor til en modtager, der kun
reagerer på direkte indhold (`affectedAllergenChanges(..., tracesIgnored)`). UI: den simple `AllergenSensitivity` i `AllergenPicker.jsx`
(onboarding trin 2, Rediger præferencer, familieformularen). Admin-panelet (Brugere → rediger) kan sætte niveauet pr. valgt allergen for en bruger (`useAdmin.js`, `UsersSection.jsx`); familiemedlemmers niveauer redigeres kun i appen.

**`users.onboarding_step` (29. sept. 2026, "Onboarding-persistens"):**
integer, 1-5, default 1 — huske PRÆCIS hvilket af de 5 onboarding-trin en
bruger nåede til (`onboarding_completed`, boolean, fandtes allerede). Ét
engangs-backfill-migration (`add_onboarding_step_to_users`) udledte det
mest sandsynlige trin for eksisterende brugere ud fra reelle gemte signaler
(navn/allergener/diæter-E-numre/familiemedlemmer) — IKKE kun "har mindst
én allergi". Selv-opdateres via almindelig `PATCH /rest/v1/users?id=eq.
<eget-id>` (samme RLS-policy som resten af tabellen, ingen ny kolonne-
beskyttelse nødvendig — kun `role` har den slags trigger-guard, se ovenfor).
Se `useOnboarding.js`/`useAuth.js`/`App.jsx`'s routing-logik for hvordan
felterne bruges til at genoptage onboarding på tværs af sessioner/enheder
og forhindre en ufuldført bruger i at nå hovedappen — fuld detalje i
`CLAUDE.md`.

**Oprettelse uden profil-metadata (30. sept. 2026, migration
`20260930193753_onboarding_signup_without_profile`):** signup sender kun
e-mail og adgangskode. `handle_new_user()` lader `name` være null, når
metadata ikke har et navn (før: e-mailens lokale del).

**Velkomstmail kun efter onboarding (migration
`20260930194647_welcome_email_only_after_onboarding`):** triggerne
`on_auth_email_confirmed` (auth.users) og `on_user_created` (public.users)
og funktionen `send_welcome_email()` er fjernet. Eneste afsender er
`send_welcome_after_onboarding()` (trigger `on_onboarding_completed`, kun
false → true), som reserverer `welcome_sent_at` atomisk
(`UPDATE ... WHERE welcome_sent_at IS NULL`) og derefter kalder
`send-email` med `welcome` (flag FRA) eller `welcome_onboarded` (flag TIL).
`send-email` sender begge typer med HTML'en fra `_shared/welcomeMail.ts`
(kopi af `templates/resend/N1-velkomst.html`), emne "Velkommen til EatSafe".
Supabase Auths bekræftelsesmail ligger i `supabase/templates/auth/` og
kan sættes af workflowet `deploy-auth-templates.yml` (kun manuelt, som tilbagerulning).

**Opfølgende sikkerhedsfund og -fix (25. sept. 2026, `security-check`-gennemgang):**
`get_advisors` fandt at tre `SECURITY DEFINER`-funktioner var direkte
kaldbare som RPC'er med et vilkårligt/tredjeparts-argument, ikke kun i den
tiltænkte interne kontekst (RLS-policies/triggere):
- **`family_group(p_uid uuid)`** — accepterede et VILKÅRLIGT `p_uid` og var
  `EXECUTE`-grantet til `authenticated`. Bruges legitimt af RLS-policies
  (kalder den med RÆKKENS ejer, ikke kalderen — nødvendigt for delt
  familie-synlighed) og af 5 Edge Functions (`shopping`, `history`,
  `family`, `send-push`, `favorites`) via en `service_role`-klient (hvor
  `auth.uid()` er `null`). Problemet: enhver logget-ind bruger kunne kalde
  `/rest/v1/rpc/family_group` direkte med en VILKÅRLIG andens uid og få
  deres familiegruppe (UUID-sæt) tilbage, uden selv at være medlem.
  **Fix:** funktionen filtrerer nu resultatet til kun at blive returneret
  hvis kalderen (`auth.uid()`) selv reelt er `p_uid` eller medlem af den
  beregnede gruppe, ELLER kaldet kommer fra `service_role` (Edge Functions).
  RLS-adfærd og Edge Function-kald er verificeret uændrede (5 JWT-simulerede
  SQL-tests: legitimt familiemedlem ser stadig gruppen, service_role-kald
  virker stadig, en urelateret tredjepart der kalder direkte får nu 0 rækker).
- **`is_admin(user_id uuid)`** — samme mønster, men ALLE faktiske brug
  (samtlige RLS-policies + `prevent_role_self_escalation`) kalder den kun
  med `auth.uid()` selv, aldrig en andens id. **Fix:** returnerer nu altid
  `false` medmindre `user_id` matcher kalderens egen `auth.uid()` — lukker
  muligheden for at enhver bruger kunne tjekke om en VILKÅRLIG andens konto
  er admin. Verificeret med to JWT-simulerede tests (self-tjek uændret,
  tredjeparts-tjek nu blokeret).
- **`prevent_role_self_escalation()`** — selve trigger-funktionen ovenfor
  var `EXECUTE`-grantet til `PUBLIC` (inkl. `anon`) og dermed listet som et
  kaldbart RPC-endpoint, selvom den kun er tiltænkt at køre som `BEFORE
  UPDATE`-trigger. Et direkte kald udefra ville sandsynligvis bare fejle
  (NEW/OLD er ikke sat uden for triggerkontekst), men den hørte ikke hjemme
  i den eksponerede API-overflade. **Fix:** `REVOKE EXECUTE ... FROM PUBLIC`
  — verificeret med `has_function_privilege` at `anon`/`authenticated`/
  `service_role` alle mistede direkte kaldeadgang, og at triggeren stadig
  er tilknyttet og aktiv på `users`-tabellen (triggerudløsning er ikke
  betinget af `EXECUTE`-grants, kun selve RPC-kaldbarheden er).

**Kendt, accepteret støj i `get_advisors` herefter:** `family_group` og
`is_admin` vil BLIVE VED med at optræde i `authenticated_security_definer_
function_executable`-listen — Supabases linter tjekker kun om `EXECUTE`
er grantet, ikke hvad funktionen reelt returnerer til hvem. `EXECUTE` skal
forblive grantet til `authenticated` for at RLS-policies (som selv kører
som denne rolle) kan evaluere dem. Datalækagen er lukket på logik-niveau
i funktionerne selv, ikke via grant-fjernelse. Antag ikke dette er et
overset fund ved en fremtidig `security-check`-kørsel uden at læse dette
afsnit først.

**Fjerde punkt fra samme gennemgang, samme dag: `pg_trgm`-extensionen lå i
`public`-skemaet** (Supabase-linter-advarslen "Extension in Public").
Verificeret før flytning at kun to indekser (`products_name_trgm_idx`,
`products_brand_trgm_idx` på `products.name`/`products.brand`, bruges til
at accelerere `ILIKE '%term%'`-søgning) afhænger af dens operator-klasse,
og ingen egen SQL-/Edge-function kalder dens `similarity()`/
`word_similarity()`-funktioner direkte. **Fix:** `ALTER EXTENSION pg_trgm
SET SCHEMA extensions` (Supabases forudoprettede, dedikerede extensions-
skema). Eksisterende indeks-definitioner er bundet via OID, ikke søgesti-
opslag, så de virker uændret efter flytningen — verificeret bagefter med
en rigtig `ILIKE`-søgning mod `products` (934 træf, uændret adfærd).

**Status efter denne gennemgang:** alle fire fundne punkter (family_group-
lækage, is_admin-lækage, trigger-eksponering, pg_trgm-placering) er rettet.
Resterende `get_advisors`-punkter er enten kendt/accepteret støj (se
ovenfor) eller kræver en brugerbeslutning uden for hvad et værktøj kan
rette (Leaked Password Protection, se `CLAUDE.md` afsnit 0) — ingen
yderligere handling ventende.

## Gammel Madpas-historik (afsnit 10, runde 1-8)

## 10. Madpas (26.-27. sept. 2026 — redesignet, forenklet, herefter finpoleret)

Madpas' formål: en tjener, butiksansat, hotel- eller cafémedarbejder — IKKE
kun restaurantpersonale — skal kunne forstå de vigtigste kost-/allergi-
oplysninger på 2-3 sekunder — strukturerede sektioner (FOOD ALLERGIES/
INTOLERANCES/DIET, se `ALLERGENS[].type` for allergi/intolerance-skellet),
ikke én generisk liste, og en madpas der altid afspejler den VALGTE profils
AKTUELLE data (også kostpræferencer for et familiemedlem — fulgte tidligere
fejlagtigt altid den loggede bruger selv, rettet i App.jsx/useMadpas.js).

**To redesign-runder (26. sept. 2026), derefter en tredje forenklings-
runde samme dag** — se `.claude/HISTORY.md` for fuld dag-for-dag-detalje.
Runde 1-2 byggede et delings-link (token-baseret `madpas_links`-tabel +
`get_madpas_by_token()`-RPC + en offentlig statisk `public/madpas-view.html`-
side + QR-kode + PDF/print + en E-numre-synlighed-opt-in). **Runde 3 fjernede
al den infrastruktur igen** efter et eksplicit brugerkrav ("Link- og QR-
funktionalitet skal være helt fjernet") — `madpas_links`-tabellen og
`get_madpas_by_token()`-funktionen er droppet fra databasen (migration
`remove_madpas_link_sharing`, verificeret 0 rækker før drop), `public/
madpas-view.html` er slettet, `vercel.json`s `/madpas/:token`-rewrite er
fjernet, og PDF/print samt E-numre-visning på madpasset er også fjernet
(PDF/print var ikke eksplicit nævnt i runde 3-specifikationens
"behold"-liste — afklaret via en direkte bruger-forespørgsel, svar: fjern
den også). Madpas er nu udelukkende en on-device visning: vælg profil →
vælg sprog → se kompakt preview → "Vis til tjener" (fuldskærm) → evt. "Læs
højt"/oplæsning. Der er ingen ekstern deling, intet link, ingen offentlig
side, og ingen server-side madpas-specifik tilstand tilbage overhovedet.

**Oversættelses-hul fundet og rettet (runde 1):** `ALLERGEN_T` (per-sprogs
allergen-navne, `src/constants.jsx`) manglede `hvede`/`maelkeallergi`
helt — uden en sprog-nøgle faldt visningen tilbage til `ALLERGENS`' DANSKE
`a.label`, selv når madpasset var sat til fx engelsk. Samme hul fandtes i
`ALLERGEN_EXAMPLES` (runde 2). `madpasAllergenLabel()`/`madpasDietLabel()`/
`madpasAllergenExamples()` (useMadpas.js) er de fælles hjælpefunktioner, der
korrekt prioriterer `lang==="da" ? a.label : ALLERGEN_T[...]` — brug dem
ved fremtidige Madpas-ændringer i stedet for at genopfinde faldback-logikken.

**Hvert hensyn er sin egen informationsblok, ikke en delt liste (runde 4,
27. sept.):** `renderStaffView()` (MadpasScreen.jsx, omdøbt fra
`renderWaiterView` — funktionen er ikke kun for tjenere) viser hvert
allergen/fritekst-emne som sin EGEN blok (ikon + stort, fed navn — det
mest fremtrædende element på hele skærmen — derefter "May be found in:"
og en pr.-emne sikkerhedstekst), adskilt af whitespace i stedet for
skillelinjer i en fælles liste. Sikkerhedsteksten genereres nu ALTID pr.
enkelt emne (aldrig en kombineret "any of these ingredients"-sætning for
flere) og er samtidig gjort mere præcis: "...does not contain {name} OR
INGREDIENTS MADE FROM {name}." `madpasSafetyNote(name, lang)` i
useMadpas.js erstatter alle forekomster af `{name}` i
`MADPAS_SAFETY_NOTE_T`-skabelonen (kolon-baseret sætningsopbygning for
sprog med køns-/artikel-bøjning som tysk/fransk/spansk/italiensk/
portugisisk/polsk, direkte indsættelse for resten), alle 17 sprog.

**Ny, bevidst OPT-IN krydskontaminerings-advarsel (runde 4):** en toggle
("KRYDSKONTAMINERING") på selve Madpas-forsiden — default FRA, persisteret
i `localStorage` som `as_madpas_cross_contact` (App.jsx) — når den er
aktiveret, vises/oplæses ÉN kombineret sætning nederst i FOOD ALLERGIES-
sektionen: singular ("...cross-contact with milk...") ved ét hensyn,
plural ("...cross-contact with these allergens...") ved flere.
`madpasCrossContactNote(names, lang)` i useMadpas.js, `MADPAS_CROSS_
CONTACT_SINGULAR_T`/`MADPAS_CROSS_CONTACT_PLURAL_T` i constants.jsx.
Bevidst opt-in fordi EatSafe ikke selv må antage alvorlighedsgraden af
brugerens allergi — se toggle-beskrivelsesteksten i MadpasScreen.jsx.

**Korte fødevare-eksempler** (`ALLERGEN_EXAMPLES` i constants.jsx,
`madpasAllergenExamples()` i useMadpas.js) vises under hvert allergen/
relevant intolerance i fremvisningsskærmen — bevidst SMÅ og MUTED
sammenlignet med selve allergen-navnet, og mærket med et kort, oversat
"Kan findes i:"/"May be found in:"-label (før "Common examples:", ændret 1. okt. 2026, da eksemplerne ikke nødvendigvis indeholder allergenet) (`MADPAS_EXAMPLES_LABEL_T`)
for aldrig at kunne forveksles med en komplet/garanteret liste.

**Oplæsning** — knappens tekst er selv oversat (`MADPAS_SPEAK_LABEL_T`/
`MADPAS_STOP_LABEL_T`, 17 sprog, fx da:"Oplæs"/en:"Read aloud") og er nu en
stor, fuld-bredde knap fast i bunden (runde 4, krav 8). `madpasSpeak()`
(useMadpas.js) oplæser nu pr. allergen: navn + den samme sikkerhedstekst
som vises på skærmen, plus krydskontaminerings-sætningen hvis aktiveret —
"May be found in" oplæses bevidst IKKE (gør beskeden unødigt lang).
Intolerancer nævnes samlet uden sikkerhedstekst, matcher den visuelle
opdeling.

**Footeren i fremvisningsskærmen viser INTET branding/dato længere**
(runde 4, krav 2 — "Fjern teksten EatSafe ... den har ingen funktion på
denne skærm") — kun den store oplæs-knap. CTA-knappen på selve Madpas-
forsiden hedder nu "Åbn madpas" (var "Vis til tjener"), og undertekstens
ordlyd er "Vis dine allergier og kosthensyn på det lokale sprog." (var
tjener-/butikspersonale-specifik) for at afspejle at Madpas bruges bredt
(restaurant, café, hotel, butik, takeaway).

**Diæter har nu samme type besked som allergier, ikke kun badges (runde
5, 27. sept.):** hvert diæt-hensyn (`DIETS` i constants.jsx: vegan,
vegetarian, pescetarian, gluten-free, keto) vises i fremvisningsskærmen
som sin egen blok (navn + en naturligt oversat "jeg spiser X, sørg for at
min mad ikke indeholder Y"-besked), samme layout som allergi-/
intolerance-blokkene. `madpasDietMessage(dietId, lang)` i useMadpas.js,
`MADPAS_DIET_MESSAGE_T` i constants.jsx (5 diæter × 17 sprog). Bevidst
blødere ordlyd for keto ("limit"/"begræns") end for de øvrige ("does not
contain"/"indeholder ikke") — keto er en præference, ikke en sikkerheds-
risiko. Sektionsoverskriften er samtidig ændret fra "DIET" til "DIETARY
REQUIREMENTS" (`MADPAS_SECTIONS_T.diet`, alle 17 sprog) for præcision.
Den kompakte forside-preview (`renderCompactPreview()`) viser fortsat
diæter som korte chips — kun selve fremvisningsskærmen fik den fulde
besked, som krævet.

**To mindre, isolerede rettelser (runde 5):** `ALLERGEN_T.soja.en.n`
viste tidligere "Soy / Soya" (to varianter samtidig) — rettet til blot
"Soya", det korrekte navn for MADPAS_LANGUAGES' "en"-variant (🇬🇧, en-GB).
`ALLERGEN_EXAMPLES.maelkeallergi` manglede "Whey"/"Valle" — tilføjet som
første ingrediens (alle 17 sprog), og `madpasAllergenExamples()`s
slice-grænse hævet fra 4 til 5 i useMadpas.js, da de 4 eksisterende
`products`-eksempler alene allerede fyldte den tidligere grænse.

**Sjette runde (samme dag) — ren visuel/spacing-polish, IKKE pushet/
merget** (se Vercel-kvote-reglen i afsnit 4 — rene design-ændringer skal
ikke deployes): spacing i `renderStaffView()` rundet til appens faste
skala (`itemBlock` 26→24px, `headline` 18→16px, krydskontaminerings-
blokkens `marginTop` 18→20px), typografisk hierarki finpudset (den
statiske "I am allergic to:"-headline nedtonet fra 19px/700/`--ink` til
14px/600/`--ink2`, så den ikke konkurrerer med allergen-navnet eller
sikkerhedsteksten; sikkerhedsteksten/diæt-beskeden opgraderet fra `--ink2`
til `--ink` for at styrke dens plads som prioritet #2), krydskontamine-
rings-advarslen på fremvisningsskærmen gjort en anelse lettere (700→600,
15→14.5px) så den forbliver sekundær i forhold til selve allergierne.
**Reel bund-scroll-sikring:** fremvisningsskærmens scrollbare område fik
mere bund-padding (32→40px) og footeren (Read aloud-knappen) fik
`env(safe-area-inset-bottom)` tilføjet til sin bund-padding (samme
etablerede mønster som `ProfileScreen.jsx`/bundnav) — verificeret
programmatisk (scroll til `scrollHeight`, mål afstand mellem sidste
tekstlinje og knappens top) at INGEN indhold nogensinde overlapper
knappen, uanset antal hensyn. Luk-/oplæs-/krydskontamineringstoggle-
knapperne er udtrukket fra rene inline-styles til nye CSS-klasser
(`.mp-close-btn`, `.mp-speak-btn`, `.mp-cc-toggle`/`.mp-cc-toggle-knob` i
theme.jsx) udelukkende for at kunne give dem samme tryk-feedback
(`:active{transform:scale(.97)}`) som resten af appens knapper —
`.mp-big-btn` manglede den samme feedback og er tilføjet til den delte
liste. Verificeret med Playwright på flere scenarier (5 allergier +
intolerance + diæt scrollet helt til bunds, tysk oversættelse på mindste
understøttede skærmstørrelse iPhone SE) — ingen tekst-overlap, ingen
horisontal overflow ved længere oversættelser. **Fundet, men bevidst IKKE
rettet i denne runde (uden for scope):** tyske substantiver i sikkerheds-
teksten (`Milch`/`Erdnüsse`) vises med lille forbogstav, fordi
`madpasSafetyNote()` altid kalder `.toLowerCase()` på navnet — grammatisk
ukorrekt på tysk (substantiver skal stå med stort), men brugerens denne
runde var eksplicit afgrænset til spacing/hierarki/scroll/safe-areas/
mikrointeraktioner, ikke sprogfejl. Tag fat i det i en fremtidig
sprog-/oversættelses-fokuseret runde.

**Syvende runde (27. sept., samme dag) — præcise afstandsjusteringer på
selve Madpas-forsiden**, opfølgning på runde 6's mere generelle spacing-
oprydning: brugeren pegede på fire konkrete, for stramme afstande. Alle
fire justeret via lokale inline-style-overrides (IKKE i de delte
`.mp-section-lbl`/`UI.mb14`-klasser, som bruges bredt i resten af appen):
sprog-dropdown → KRYDSKONTAMINERING 20→32px (margin-collapse med
dropdownens egen 16px marginBottom), KRYDSKONTAMINERING-hjælpetekstens
`lineHeight` 1.4→1.6, KRYDSKONTAMINERING → "Dit madpas" 0→16px (manglede
helt margin før), "Dit madpas"-label → chips 8→16px, chips → "Åbn
madpas" 14→32px. CTA'ens egen størrelse og sidens bredder er urørt.
Verificeret programmatisk med `getBoundingClientRect()`-mål af alle fire
afstande efter ændringen (32/16/16/32px), ikke kun visuelt.

**Ottende runde (27. sept., samme dag) — reelt venstre-alignment-fund,
ét-linjes rettelse:** `.mp-scroll` (theme.jsx) giver allerede 20px
venstre/højre-padding til ALT sit indhold, men `.mp-head` (kun brugt i
MadpasScreen.jsx, ingen andre skærme påvirket) havde sin EGEN ekstra 20px
padding oveni — titel/undertekst/sektionsoverskrifter/krydskontaminering
sad derfor reelt 40px inde, mens "Dit madpas"/chips/CTA-knappen
(`renderMainContent()`, en søskende-div UDENFOR `.mp-head`) kun fik
`.mp-scroll`s 20px. Chips/CTA stod dermed bekræftet 20px længere til
venstre end resten af siden — nøjagtig den inkonsistens brugeren
rapporterede. Rettet med `.mp-head{padding:20px 20px 0}` →
`{padding:20px 0 0}` (kun venstre/højre fjernet, top-paddingen som giver
luft ned fra topbaren er urørt). Bivirkning, som var tilsigtet af
brugerens egen krav 3: sprog-dropdownen (tidligere indsnævret af den
dobbelte padding) og CTA-knappen har nu samme bredde, begge fuld bredde
af den fælles 20px-indrammede indholds-kolonne. Verificeret med
`getBoundingClientRect()` for otte elementer (titel, undertekst, "VÆLG
SPROG", dropdown, "KRYDSKONTAMINERING", hjælpetekst, "Dit madpas", første
chip, CTA) — alle nu `left:20px` fra viewportets kant, ingen undtagelser.


## Gamle afsnit 11-13 (CSS, konventioner, åbne punkter inkl. detaljerede admin-fane-beskrivelser)

## 11. CSS-konventioner

- Al CSS bor i `theme.jsx` (`appCss`-strengen), injiceret via `<style>{appCss}</style>` i `App.jsx` — ingen separate `.css`-filer
- **Ingen hardkodede farver i screen-komponenter** — kun CSS-variabler
- `paddingBottom:120` på alle screen-divs
- Grønne primærknapper: `color:#071510`
- Farvesystem: `--green`=success/CTA, `--blue`=navigation, `--amber`=advarsel, `--red`=fare

---

## 12. Konventioner

- **`// @ts-nocheck`** øverst i alle `.jsx`-filer
- **React Hooks** — aldrig i IIFE, betinget kode eller loops
- **Windows env:** `set KEY=value` (ikke `export`)
- **`submissions`** er aktiv tabel

---

## 13. Kendte åbne punkter

| Punkt | Note |
|-------|------|
| hej@eatsafe.dk | Oprettes hos One.com inden beta |
| Leksikon 1000+ entries | Planlagt — separat session (pt. ~700 entries) |
| Madspild-tilbud ("i køleskabet") | `food-waste`-Edge Function virker (verificeret live 17. sept. 2026 med `SALLING_API_TOKEN` sat), men UI-indgangen er bevidst fjernet fra `ResultScreen.jsx` igen efter brugerens ønske ("put den i køleskabet"). Genoptag ved at importere `useFoodWaste` (`src/useFoodWaste.js`) i en skærm igen og gencoble knap+resultat-visning (se git-historik for `src/ResultScreen.jsx` omkring 17. sept. 2026 for den oprindelige UI-kode) |
| Desktop admin — nye funktioner | Shellet (`src/admin/`) + alle eksisterende faner (Dashboard/Brugere/Indsendelser/Tickets/Manglende/Import/Opskrifter) er bygget og shippet 24. sept. 2026. **Produkt-database direkte** (ny "Produkter"-fane, `src/admin/sections/ProductsSection.jsx`) er også shippet 24. sept. 2026 — søg på navn/brand/EAN (eller se seneste opdaterede uden søgeord, da `products` har 20.000+ rækker), redigér navn/brand/kategori/ingredienstekst/allergen_flags/verificeringsstatus direkte, slet produkt (kan fejle med en synlig FK-fejl hvis produktet stadig er refereret fra fx en indkøbsliste/scanningshistorik/ændringslog — bevidst ikke cascade-slettet automatisk). Kun på desktop, ikke porteret til mobil-admin. **Leksikon-CRUD** (ny "Leksikon"-fane, `src/admin/sections/KnowledgeSection.jsx`) er også shippet 24. sept. 2026 — søg/filtrér på kategori (allergen/e_number/ingredient/diet/cross_reaction/faq/fun_fact — DB check-constraint), opret/redigér/slet `knowledge_base`-entries (titel, slug med auto-generering fra titel ved oprettelse, emoji, resumé, beskrivelse, sundhedsnoter, risikoniveau, sortering, tilknyttede allergener som klikbare chips, og 6 frie liste-felter som kommasepareret tekst: found_in/alternatives/diet_tags/aliases/tags/sources). RLS tillader allerede admin-skriv direkte (ingen Edge Function nødvendig). Kun på desktop. **Ændringshistorik** (ny "Historik"-fane, `src/admin/sections/HistorySection.jsx`) er også shippet 24. sept. 2026 — read-only visning af `revision_log`, filtrérbar på oprettet/opdateret, produkt- og bruger-navne slås op i to batch-kald efter hovedlisten (ingen FK-embed tilgængelig for changed_by). **Brugere-redigering** (`UsersSection.jsx`, samme dag) er udvidet til at dække ALT bundet til brugeren, inkl. allergener — krævede en RLS-migration (`admin_can_write_user_allergens`) der tilføjer `is_admin()`-OR-betingelse til `user_allergens`s INSERT/UPDATE/DELETE-policyer (SELECT tillod allerede admin-læsning, men skriv var kun ejeren/familiemedlem-ejeren); samme slet-og-bulk-indsæt-mønster som `ProfileScreen.jsx` bruger for sig selv. Familiemedlemmers allergener ligger ikke i `user_allergens` (kun brugerens egne, `family_member_id is null`) og er ikke omfattet. Kun på desktop. **Bulk-handlinger** (Indsendelser-fanen, samme dag) — afkrydsningsbokse på pending-visningen + "Godkend valgte"/"Afvis valgte". Bevidst en SLANKERE parallel-implementation, ikke et loop der genbruger `updateSubmissionAndApprove`/`rejectSubmission` (de sluger deres egne fejl internt og viser individuelle toasts/lukker modaler, hvilket ville gøre det umuligt at tælle reelle succes/fejl på tværs af en batch) — sender ikke navn/brand-override (kun ingredienstekst fra OCR; Edge Function'en patcher kun felter der rent faktisk sendes) og springer push-notifikationer over for hastighed; AI-reparse'en efter hver godkendelse sikrer stadig korrekte allergen_flags. Kun på desktop. **Rigere dashboard/analytics** (`DashboardSection.jsx`, samme dag) — to søjlediagrammer (scanninger/dag, nye brugere/dag, seneste 14 dage) under stat-gridet. Ingen graf-bibliotek — rene CSS/HTML-søjler, én sekventiel farve pr. serie (grøn/blå, appens egne tokens), native `title`-attribut som hover-tooltip. PostgREST har ingen GROUP BY-dag, så `loadAdminStats` henter de rå `scanned_at`/`created_at`-rækker for perioden (kun de to felter, billigt) og bucketter dem selv i JS (`bucketByDay`-helper) — tomme dage fyldes med 0 så grafen altid har præcis 14 punkter. Kun på desktop. **CSV-eksport** (`src/admin/csvExport.js`, samme dag) — delt `downloadCsv(filename, rows, columns)`-helper (RFC 4180-escaping, UTF-8 BOM så æ/ø/å ikke bliver mojibake i Excel), "Eksportér CSV"-knap på Brugere- og Produkter-fanerne, eksporterer den aktuelt filtrerede/hentede liste (ikke hele tabellen — konsistent med den eksisterende paginering på 50-200 rækker). Ligger bevidst under `src/admin/`, ikke i det delte `helpers.js`, så den ikke bloater den mobile PWA's bundle. Kun på desktop. **Familie-overblik** (ny "Familie"-fane, `src/admin/sections/FamilySection.jsx`, samme dag) — grupperer `family_members` pr. ejer (viser husstanden samlet, ikke en flad liste) + en tabel over `family_invites` med status. Krævede en RLS-migration (`admin_can_read_family_invites`) — `family_members` tillod allerede admin-læsning, men `family_invites` kun inviteren/den der accepterede selv. **Handlingsmuligheder tilføjet 24. sept. 2026** — "fjern medlem" (×-knap på hver medlem-pille) og "annullér" på afventende invitationer. Krævede endnu en RLS-migration (`admin_can_manage_family_data`): `family_members`s DELETE-policy manglede admin-bypass, og `family_invites` havde slet ingen DELETE-policy overhovedet (hverken for ejer eller admin — invitationer kunne kun oprettes/læses, aldrig slettes via REST). **Global søgning** (`GlobalSearchBox.jsx`, samme dag) — en søgeboks i topbaren (uafhængig af hvilken fane admin står på), søger parallelt i brugere/produkter/tickets, klik på et resultat skifter til den relevante fane og forudfylder dens søgefelt. Begge kun på desktop.

**Med dette er hele "nye funktioner"-backlogget fra 24. sept. 2026 gennemført** (8/8 punkter: produkt-database, leksikon, ændringshistorik, brugere-redigering inkl. allergener, bulk-handlinger, dashboard-trends, CSV-eksport, familie-overblik + global søgning). Debug-fanen (mobil-appens `getTraceLog()`) er bevidst IKKE porteret — den er session-lokal til den enhed der scanner, og giver ikke mening i et separat desktop-panel |

## Gammel opsætnings-/statustekst fra afsnit 14 og 16

- **Mangler (trin 3-4):**  pushvarianter + 30 mails koblet på rigtige hændelser, nye indstillingskategorier,
  P1/P3/P6 og egne ticket-visninger. Mail bruger stadig de gamle triggere/skabeloner.
- **Push-flaget må ikke tændes**, før beskedsiden er i produktion og testet.
- **Rettet undervejs:** VAPID-`aud` var fast FCM (Apple/Mozilla afviste); `/badge-72.png`
  findes ikke; N4 blev aldrig sendt (forkerte kolonnenavne); N3 uden begrundelse; push blev
  sendt fra browseren. Klient-push i `useAdmin.js`/`useIncomingLinks.js` er fjernet.

**Status 1. okt.:** hook'en er slået til og testet end-to-end med en testkonto (plus-adresser, derefter slettet): glemt adgangskode, oprettelse
("Bekræft din e-mail – EatSafe"; linket giver 303 til `eatsafe.dk` med `type=signup`, og appen viser "Din e-mail er bekræftet" → Fortsæt opsætning,
når service workeren allerede er installeret; i en helt ny browser kan SW-reloadet springe den skærm over, og brugeren lander direkte i onboarding) og
skift af e-mail med Secure email change (to danske mails, begge links virker, adressen i `auth.users` skiftes). `public.users.email`
følger med ved et e-mailskift via triggeren `on_auth_user_email_changed` (migration `20261001113232`, testet i en rullet tilbage transaktion);
appen har i øvrigt ingen skærm til at skifte e-mail. Magic link, invitation og genbekræftelse bruges ikke i appen.
