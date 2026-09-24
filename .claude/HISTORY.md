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
