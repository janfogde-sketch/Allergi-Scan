# EatSafe (Allergi-Scan) — Samlet projektkontekst for Claude

> **Formål med denne fil:** Denne fil læses automatisk af Claude Code, hver gang en session
> startes i dette repo — uanset hvem der starter den. Den er skrevet så en anden bruger
> (f.eks. Jans forretningspartner), der åbner en helt ny Claude-session i dette repo, kan
> fortsætte arbejdet præcist som hvis samtalen fortsatte — samme viden om produktet,
> samme arkitektur-forståelse, og samme arbejdsgang/aftaler.
>
> **Hold den opdateret:** Når du (Claude) laver større ændringer — ny skærm, ændret
> navigation, ny arbejdsgang, nyt design-token — så opdatér denne fil i samme PR.
> Detaljeret database/edge-function-reference ligger i `src/CONTEXT.md`, og
> fase-for-fase feature-status ligger i `src/ROADMAP.md` — denne fil linker til dem
> og opsummerer resten.

---

## 1. Hvad er EatSafe?

EatSafe er en dansk PWA (progressive web app) til mennesker med fødevareallergier og
-intolerancer. Brugeren scanner en stregkode (eller søger), appen matcher produktets
ingredienser mod brugerens (og evt. familiens) allergiprofil, og viser et klart
sikkert/farligt/usikkert-signal — med begrundelse, sikre alternativer, og mulighed for
at tilføje til indkøbsliste.

| Nøgle | Værdi |
|---|---|
| Live URL | https://eatsafe.dk |
| GitHub | `janfogde-sketch/Allergi-Scan` |
| Branches | `main` (produktion) · udviklingsgrene navngives af Claude Code (`claude/...`) |
| Hosting | Vercel — auto-deploy på push |
| Backend | Supabase (projekt-id `jegrpcflyguadyxialkm`) — Postgres, Edge Functions, Auth |
| Ejer/admin | janfogde@gmail.com |

Se `src/CONTEXT.md` for fuld database-skema-reference, edge-function-liste og
integrationsdetaljer (Madpas, familie-deling, auto-import-pipeline m.m.).
Se `src/ROADMAP.md` for hvad der er bygget, og hvad der mangler.

---

## 2. Tech stack

- **Frontend:** React 18 + Vite 5, almindelig JSX (ikke TypeScript — `// @ts-nocheck` øverst i alle `.jsx`-filer)
- **Backend:** Supabase — Postgres, Edge Functions (Deno), Auth, Realtime (indkøbsliste)
- **AI:** Claude Haiku som fallback til allergen-matching + OCR (Supabase secret `ANTHROPIC_API_KEY`)
- **Ekstern data:** Open Food Facts API, TheMealDB
- **Test:** Vitest (`npx vitest run` — pt. 72 tests, alle skal være grønne)
- **Styling:** Ingen CSS-filer — al CSS ligger som én streng i `src/theme.jsx` (`appCss`), injiceret via `<style>`. Kun CSS-variabler i komponenter, ingen hardkodede farver.

---

## 3. Arkitektur — hvordan appen er struktureret lige nu

### Navigation (opdateret september 2026)

Bundmenuen har **tre** punkter (ændret fra tidligere fem — Profil, Opskrifter og Viden
er flyttet ind i en menu):

```
[Indkøbsliste (cart)]   [Scan (barcode) — midten]   [Søg (search)]
```

Øverst til højre er et **klassisk hamburger-menu-ikon** (tre streger, IKKE app-logoet —
det er bevidst fravalgt). Det åbner `ProfileMenu.jsx`, en slide-out-menu fra højre side,
som indeholder:
- En profil-hero (initialer + navn) øverst → navigerer til selve `SCREENS.PROFILE`-siden
- Menupunkter: Favoritter, Familie, Scanningshistorik, Opskrifter, Viden, Madpas,
  Restaurantguide, (Admin hvis brugeren er admin)

`ProfileScreen.jsx` selv indeholder nu kun profil-hero + allergioversigt + konto
(log ud/slet konto) — den gamle liste af menu-links er flyttet til `ProfileMenu.jsx`.

**Vigtigt CSS-fælde-mønster, hvis du bygger flere overlays/drawers:**
`.screen.fade-in`'s CSS-animation (`animation-fill-mode:both`) efterlader en
permanent `transform` på elementet selv efter animationen er færdig — det gør
elementet til et CSS "containing block" for `position:fixed`-børn. Det betyder at
et `position:fixed`-ark/drawer, der renderes som almindeligt barn af en
`.screen.fade-in`, bliver fanget og scroller MED skærmen i stedet for at blive
siddende fast på viewporten. **Løsning:** render den slags overlays via
`ReactDOM.createPortal(..., document.body)`. Brugt i `ListPickerSheet`
(SharedComponents.jsx) og `ProfileMenu.jsx`.

### Skærme (SCREENS-konstanter, se `src/constants.jsx`)

| SCREENS | Fil | Nås fra |
|---|---|---|
| HOME | ScannerScreen.jsx | Bundmenu (midten, barcode-ikon) |
| RESULT | ResultScreen.jsx | Efter scan/søg |
| SEARCH | SearchScreen.jsx | Bundmenu (højre) — autofokus på søgefelt ved åbning |
| LIST | ListScreen.jsx | Bundmenu (venstre) |
| PROFILE / EDITPROFILE | ProfileScreen.jsx | Hamburger-menu → profil-hero |
| FAMILY, FAVORITES, HISTORY, RECIPES, KNOWLEDGE, MADPAS, RESTAURANTGUIDE, ADMIN | respektive filer | Hamburger-menu → ProfileMenu.jsx |
| NOTFOUND, SUBMITTED | NotFoundScreen.jsx, SubmittedScreen.jsx | Efter mislykket scan → 5-trins indsendelse |
| SUGGEST_EDIT | SuggestEditScreen.jsx | Fra ResultScreen ("Ret forkerte data") |
| WELCOME, LOGIN, ONBOARD | OnboardingScreen.jsx | Første besøg |

**Arkitektur-regel (stående, håndhæves i alle PR'er):**
1. Én screen = én fil (`XxxScreen.jsx`)
2. Props frem for masse-state; lokalt state lever i screen-komponenten
3. Ingen IIFE-patterns i JSX (`{cond && (() => {...})()}` forbudt)
4. Ingen React hooks i betinget kode eller loops — altid øverst i komponenten
5. Logik hører til i dedikerede hooks (`useXxx.js`), ikke inlinet i App.jsx
6. `ScannerScreen.jsx` er både HOME-skærmen og en lille intern router

### Delte komponenter (`SharedComponents.jsx`)

- `Icon` — ét SVG-ikon-bibliotek for hele appen (map fra navn → path). Aktuelle navne:
  `home, scan, barcode, search, list, profile, recipes, star, globe, check, x, warning,
  info, chevronRight, chevronDown, chevronUp, heart, trash, share, cart, camera, bulb,
  speaker, speakerOff, plus, edit, family, madpas, book`. **Ingen emoji i UI'et længere
  hvor det kan undgås** — brug/tilføj SVG-ikoner i stedet (se designsystem-noter nedenfor
  for kendte resterende emoji-steder).
- `ListPickerSheet({ lists, onChoose, onCancel })` — delt bottom-sheet til at vælge
  indkøbsliste, portal-baseret, bruges af både SearchScreen og ResultScreen.
- `productDisplayName(product)` (i `helpers.js`) — sætter mærke foran generisk produktnavn.

### Designsystem-tokens (`src/theme.jsx`, `:root` CSS-variabler)

```
--ink:#15201A            tekst
--paper:#F6F8F3          baggrund (hvid/lys — IKKE længere grøn baggrund, se afsnit 5)
--green:#178A50 (+lt/mid/glow/text/logo)   succes / primær CTA / navigation
--on-green:#FFFFFF
--red:#C8402E (+lt/md)   fare
--amber:#B5791A (+lt/md) advarsel
--blue:#178A50 (+lt/md)  ⚠️ pt. aliaset 1:1 til grøn — brugt semantisk til
                         "sekundær info/accent" (.greeting-eyebrow, .home-tip,
                         .info-box, .share-bar) men ser visuelt identisk ud med
                         grøn lige nu. Identificeret som forbedringspunkt, se afsnit 5.
--muted / --muted2
--surface / -2 / -3
--border / -2
--r:12px (default radius), --sh / --sh2 (skygge-tokens)
--f:'DM Sans',system-ui,sans-serif
```

Kendt mønster for "levende" interaktion: `.recipe-card:active{transform:scale(.99)}`
— identificeret som pattern der bør genbruges flere steder (tryk-feedback), se afsnit 5.

---

## 4. Sådan arbejder vi (arbejdsgang — følges for HVER ændring)

Dette er den stående, aftalte proces i denne session. Følg den uden at spørge om lov
først, medmindre ændringen er stor/arkitektonisk/destruktiv (så spørg).

1. **Lav ændringen** i de relevante filer.
2. **Byg:** `npm run build` — skal være grøn.
3. **Test:** `npx vitest run` — alle tests skal bestå (pt. 72 stk).
4. **Mojibake-scan:** kør en Cyrillic-mojibake-scan på hver ændret fil, fx:
   ```python
   import re
   print(re.findall(r'[Ѐ-ӿ]+', open(path, encoding='utf-8').read()))
   ```
   (fanger tegn-encoding-fejl der kan snige sig ind ved copy/paste af danske tegn).
5. **Commit specifikke filer** — ALDRIG `git add -A`. Commit-besked på dansk, kort og
   beskrivende. Afslut altid med attributions-trailere (se system-instruktion for
   nøjagtig ordlyd — de inkluderer `Co-Authored-By` + en `Claude-Session`-linje).
6. **Push** til den aktive feature-branch.
7. **Opret PR** via GitHub MCP — dansk PR-body, tjek for PR-template først. Afslut med
   `🤖 Generated with [Claude Code]`-footer + session-link.
8. **Vent på grøn Vercel-status** på PR'en (poll `pull_request_read`/`get_status`).
9. **Squash-merge** PR'en.
10. **Resync branch:** hent nyeste `main`, reset feature-branchen til den, force-push
    med `--force-with-lease`, så branchen er klar til næste opgave.

Alt dette gøres **uden at spørge brugeren om lov undervejs** — det er en etableret,
godkendt proces i dette projekt. Brugeren giver typisk korte, uformelle instruktioner
på dansk (ofte som hurtige afbrydelser midt i en igangværende opgave) — tag dem som
nye krav der skal implementeres, ikke som spørgsmål der skal diskuteres først.

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

---

## 5. Igangværende arbejde — designforbedring (startet september 2026)

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
(afsnit 6 nedenfor) + fladhed-bug-tjek, skærm for skærm, uden ophold. Sporet
via TaskCreate/TaskUpdate i denne session. **Femte bølge: `RecipesScreen.jsx`**
(stort set alle emoji-forekomster i UI-chrome erstattet): verdikt-ikoner
(kort + detalje-hero, samme check/warning-mønster som Resultat-skærmen),
favorit-hjerter, "tilføj/tilføjet"-ikoner, `flame` (tilberedningstid, 2
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

**Tidligere flagget, stadig kun delvist gjort:** en fuld emoji→SVG-ikon-sanering af
hele appen.

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

---

### Beta-installation (september 2026)

Admin-dashboardet (Hurtige handlinger) har en "Installations-QR til beta"-knap, der
viser en QR-kode til `public/install.html`. Den side tjekker selv enheden:
iPhone/iPad (Apple tillader ikke programmatisk installation af PWA'er) får en
3-trins visuel guide til "Del → Føj til hjemmeskærm", i samme lyse designsprog som
resten af appen. Alt andet (Android/Chrome/desktop) sendes videre til
`eatsafe.dk/?src=beta-qr`. `install.html` er en statisk fil i `public/` — samme
mønster som `privacy.html`/`invite.html`, men bemærk at de to ældre sider stadig
er i det gamle mørke tema og IKKE er opdateret til det nye lyse designsprog.

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

## 6. Design-antimønstre — ting vi bevidst IKKE vil have i appen

> Tilføjet 14. sept. 2026 efter brugeren delte en liste over "20 reasons why your
> app looks vibecoded" (et velkendt tjekliste-format der cirkulerer om at
> genkende generisk AI-genereret UI). Brug denne liste som et **checkpoint**, ikke
> kun en engangs-oprydning — tjek nye skærme/komponenter mod den, før du
> markerer design-arbejde som færdigt.

| # | Mønster | Status i EatSafe |
|---|---|---|
| 1 | Lilla-til-blå gradient | ✅ Ikke brugt — appens paletter er grøn (primær) + en bevidst valgt slate-blå (`#3A6EA5`, sekundær) |
| 2 | Gradient-tekst i overskrifter | ✅ Ikke brugt — ingen `background-clip:text` i kodebasen |
| 3 | Emoji i overskrifter/UI-chrome | 🟡 Var udbredt, saneres løbende skærm for skærm (se afsnit 5 ovenfor — sat på pause for denne gennemgang, genoptages) |
| 4 | Inter-font overalt | ✅ Ikke brugt — DM Sans + DM Mono, bevidst valgt tidligt i projektet |
| 5 | Farvede kant-kort ("colored border cards") som ren pynt | ✅ Ikke fundet — farvede kanter i appen er funktionelle signaler (fx `product-hero`'s grøn/gul/rød kant = sikkerhedsverdikt), ikke dekorative |
| 6 | Glassmorphism-kort (`backdrop-filter:blur`) | 🔴 **Fundet og rettet 14. sept.** — 17 forekomster i `theme.jsx` + 2 i `App.jsx`/`FeedbackModal.jsx`, ALLE på fuldt uigennemsigtige baggrunde (`var(--surface)` m.fl.) så blur'en var visuelt virkningsløs — ren død kode der tilfældigvis også ramte antimønstret. Fjernet alle 19. De to resterende forekomster i `ScannerScreen.jsx` (kamera-kontrolknapper + zoom-pille) er bevidst bevaret — de sidder på reelt gennemsigtig sort baggrund oven på det levende kamerabillede, så blur'en har en ægte funktionel grund (læsbarhed oven på video) |
| 7 | Lavkontrast dark mode | N/A — appen er lys-tema-only |
| 8 | 3 ikon-bokse på række (generisk feature-grid) | ✅ Ikke fundet — `.stat3` er en 3-kolonne-grid, men viser rigtige tal (scanninger/farer/sikre), ikke generiske feature-claims |
| 9 | Badge over overskrift (hero-mønster) | ✅ Ikke fundet — BETA-badgen i topbaren er et permanent status-chip, ikke et hero-badge over en marketing-overskrift |
| 10 | "Lucide-ikoner overalt" (upersonligt standardbibliotek) | ✅ Ikke brugt — `Icon`-komponenten er et selv-tegnet, konsistent SVG-ikonbibliotek specifikt til EatSafe |
| 11 | Urørt shadcn UI | N/A — bruger ikke shadcn |
| 12 | Fade-in ved scroll | ✅ Ikke fundet — ingen `IntersectionObserver` i kodebasen. `.fade-in`-klassen er en mount-animation (skærmskift), ikke scroll-baseret |
| 13 | Cursor-følgende lysstråle | ✅ Ikke fundet |
| 14 | Knapper der toner ved hover (ren opacity-fade) | ✅ Ikke fundet — `.btn-primary:hover` skifter farve + løfter sig (`translateY`), en bevidst hover-tilstand, ikke en doven opacity-fade |
| 15 | Inkonsistent spacing | 🟡 Ikke systematisk revideret — kræver en visuel gennemgang skærm for skærm, ikke noget der er grep'et frem |
| 16 | Em-dashes ("—") alle vegne | 🟢 Tjekket — langt de fleste af de ~600 forekomster i `src/*.jsx` sidder i danske kode-kommentarer (usynlige for brugeren), ikke i UI-tekst. De der ER i bruger-vendt tekst er enkeltstående, funktionelle forbindelses-streger i naturligt dansk (fx "Det ligner ikke en gyldig stregkode — tjek cifrene."), ikke AI-agtig ophobning af flere streger i samme sætning. Vurderet som ikke et reelt problem — men hold øje med nye tekster |
| 17 | Generisk buzzword-copy | 🟡 Ikke systematisk revideret — dansk UI-tekst er stort set skrevet konkret/funktionelt (fx "Scan produkt", "Sikker søgning for dig"), men ingen formel gennemgang er lavet |
| 18 | Serif-kursiv-accenter | ✅ Ikke brugt — ingen serif-skrifttype i appen overhovedet |
| 19 | Space Grotesk + Instrument Serif (typisk AI-font-parring) | ✅ Ikke brugt — DM Sans/DM Mono |
| 20 | *(ikke synlig i det delte screenshot — spørg brugeren hvis relevant)* | — |

**Konklusion:** Appen var reelt kun ramt af ét konkret punkt (glassmorphism/
backdrop-filter — nu rettet) plus det i forvejen kendte emoji-punkt (i gang,
sat på pause). Resten var enten allerede undgået fra projektets start (fonte,
farver, ikoner) eller ikke reelle problemer ved nærmere eftersyn (em-dashes).
Punkt 15 (spacing) og 17 (copy) kræver en mere subjektiv, visuel gennemgang og
er ikke afkrydset — tag dem op hvis brugeren beder om en decideret spacing-
eller copy-revision.

---

## 7. Hvor finder du mere?

- `src/CONTEXT.md` — fuld teknisk reference: database-tabeller, edge functions,
  familie-deling, Madpas, auto-import-pipeline. Opdatér denne når skema/integrationer
  ændres.
- `src/ROADMAP.md` — fase-for-fase feature-historik og hvad der mangler før beta.
  Opdatér denne når features færdiggøres eller nye planlægges.
- Denne fil (`CLAUDE.md`) — hold "Arkitektur"- og "Igangværende arbejde"-afsnittene
  opdaterede efter større UI/navigations-ændringer, så en frisk Claude-session altid
  har et retvisende billede.
