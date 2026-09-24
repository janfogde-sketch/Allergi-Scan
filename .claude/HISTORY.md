# EatSafe — Historik (arkiv)

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

**Nuværende link (opdatér dette, ikke opret et nyt, ved fremtidige
republiceringer):** https://claude.ai/artifact/TzA4goSRfzAoSVWvoM94z1

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
