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
| Team-adgang | `bjangst@gmail.com` (Jans forretningspartner) — GitHub-collaborator på repoet + Supabase-organisationen (rolle: Developer). **Ikke** medlem på Vercel — Hobby-planen tillader kun én bruger; ville kræve opgradering til Pro for at tilføje flere. Kode-ændringer sker derfor via GitHub, og Vercel auto-deployer som normalt uden at bjangst behøver Vercel-adgang. |

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
  info, chevronLeft, chevronRight, chevronDown, chevronUp, heart, trash, share, cart, camera, bulb,
  speaker, speakerOff, plus, edit, family, madpas, book, flame, image, flashlight, shield,
  block, link, bell, tag, package, message, chart, bug, download, eye, eyeOff, refresh,
  mail, calendar, key, file, clock, save, utensils, hash, zap`. **Ingen emoji i UI'et længere hvor det kan
  undgås** — brug/tilføj SVG-ikoner i stedet (se designsystem-noter nedenfor for kendte
  resterende emoji-steder, primært content-emoji som allergen-glyffer og kategori-ikoner).
- `showToast(message, type?)` + `<ToastHost/>` — delt, designkonsistent erstatning for
  native `alert()` til korte succes-/fejl-beskeder. `type` er `"success"` (default) eller
  `"error"`. `<ToastHost/>` er monteret én gang i `App.jsx`; kald `showToast()` fra hvor
  som helst i appen. Portal-baseret (samme mønster som `ListPickerSheet`). Brug IKKE
  native `alert()`/`confirm()` til succes-/fejl-notifikationer længere — kun til de få
  steder hvor et rigtigt browser-dialogbekræft er tilsigtet, eller til at vise rå
  tekst-indhold (fx clipboard-fallback, data-viewere).
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
--blue:#3A6EA5 (+lt/md)  reel, distinkt slate-blå sekundærfarve (IKKE længere
                         aliaset til grøn, se afsnit 5) — brugt semantisk til
                         "sekundær info/accent" (.greeting-eyebrow, .home-tip,
                         .info-box, .share-bar)
--muted / --muted2
--surface / -2 / -3
--border / -2
--r:12px (default radius), --sh / --sh2 (skygge-tokens)
--f:'DM Sans',system-ui,sans-serif
```

**Anbefalet spacing-skala** (tilføjet 14. sept. efter en grep-bekræftet gennemgang
af antimønster #15 — se afsnit 6). Eksisterende inline-styles bruger IKKE denne
skala konsekvent i dag (mindst 15 forskellige padding-varianter fundet på tværs
af `src/*.jsx`), men den er den anbefalede retning for nyt arbejde, så vi ikke
tilføjer endnu flere ad hoc-værdier:
```
4 / 6 / 8 / 10 / 12 / 14 / 16 / 20 / 24 / 32 (px)
```
Foretræk disse værdier (og kombinationer af dem, fx `10px 14px`) frem for
"næsten runde" tal som 9px/11px/13px/15px, medmindre der er en konkret visuel
grund til den præcise værdi. En fuld retrofit af eksisterende inline-styles til
denne skala er et selvstændigt, skærm-for-skærm-visuelt-QA'et projekt — ikke
noget der er gjort mekanisk i denne omgang.

Kendt mønster for "levende" interaktion: `.recipe-card:active{transform:scale(.99)}`
— identificeret som pattern der bør genbruges flere steder (tryk-feedback), se afsnit 5.

---

## 4. Sådan arbejder vi (arbejdsgang)

Dette er den stående, aftalte proces i denne session. Følg den uden at spørge om lov
først, medmindre ændringen er stor/arkitektonisk/destruktiv (så spørg).

**14. sept. 2026 — ændret til at batche pr. opgave, ikke pr. fil/delændring.**
Tidligere blev der lavet én PR (= én Vercel-deploy) pr. lille delændring, hvilket
gav unødvendigt mange deploys for ændringer der reelt hørte sammen. Brugeren bad
om at batche: lav alle lokale skridt (byg/test/commit) løbende som man plejer, men
vent med push/PR/merge til hele den samlede opgave er færdig — uanset om opgaven
består af én fil eller ti.

**Per logisk delændring** (fx én fil, én bølge i en skærm-gennemgang):
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
   **Push IKKE endnu** — flere commits kan sagtens ligge lokalt på feature-branchen
   ukommitteret til fjern-repoet, indtil hele opgaven er færdig.

**Én gang, når HELE den samlede opgave er færdig** (alle filer/bølger/punkter
brugeren har bedt om i denne omgang):
6. **Push** alle commits til den aktive feature-branch i én omgang.
7. **Opret ÉN PR** via GitHub MCP der dækker det hele — dansk PR-body der
   opsummerer alle commits/ændringer, tjek for PR-template først. Afslut med
   `🤖 Generated with [Claude Code]`-footer + session-link.
8. **Vent på grøn Vercel-status** på PR'en (poll `pull_request_read`/`get_status`).
9. **Squash-merge** PR'en.
10. **Resync branch:** hent nyeste `main`, reset feature-branchen til den, force-push
    med `--force-with-lease`, så branchen er klar til næste opgave.

**Undtagelse — kritiske/blokerende fejl:** en fejl der reelt er i produktion (fx
crashende skærm) skippes IKKE ind i batchen, men shippes for sig selv med det
samme som en isoleret hotfix-PR, uanset hvor i en større opgave man er.

**Hvornår er "opgaven" færdig?** Det brugeren bad om i den seneste sammenhængende
instruktion — fx "gennemgå disse tre skærme" er én opgave (→ én PR ved slutningen,
selvom det er tre skærme/tre commits), ikke tre. Ved tvivl: hellere for få PR'er
end for mange — brugeren siger til hvis en batch blev for stor.

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
website right now Pt.3" — samme TikTok-genre som antimønstre-listen i
afsnit 6). **Disse 20 punkter er ENDNU IKKE vurderet eller implementeret** —
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

**Den oprindelige Hjem-redesign-opgave (afsnit 5's første punkt-liste) er
dermed fuldført** — både de globalt udrullede token/klasse-ændringer og de
per-skærm-vurderede mønstre er nu implementeret hvor de giver mening.

**14. sept. 2026 — opfølgning på "nogle åbne opgaver?": #1 droppet, #2/#3
vurderet, #4/#5 gjort.** Brugeren bad om at droppe dark mode helt og tage de
resterende fire punkter fra forrige status op med det samme:

- **#1 Dark mode — droppet, ikke udskudt** (se afsnit 5's log ovenfor for
  eksakt ordlyd).
- **#2 Spacing-konsistens — bekræftet reelt, dokumenteret, IKKE retrofittet.**
  Se afsnit 3 (ny anbefalet skala) og afsnit 6 (opdateret status for
  antimønster #15).
- **#3 Copy-gennemgang — udført, ingen fund.** Se afsnit 6 (antimønster #17).
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
11, 13, 15px, som CLAUDE.md selv fremhæver som eksempel på antimønstret.
Hver af disse ligger nøjagtigt midtvejs mellem to skala-trin (fx 9 er lige
langt fra 8 og 10), så reglen blev entydig og mekanisk: rund altid op til
næste skala-trin (5→6, 7→8, 9→10, 11→12, 13→14, 15→16) — ingen skøn
nødvendige pr. forekomst, i modsætning til hvad der tidligere blev antaget.

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

**Vigtigt — kræver manuel deploy, opdaget ved denne lejlighed:** i
modsætning til frontend-koden i `src/` (som Vercel auto-deployer på hvert
push til `main`) har repoet **ingen automatiseret deploy-pipeline for
Supabase Edge Functions** — hverken via Vercel eller GitHub Actions
(`.github/workflows/ci.yml` kører kun lint/test/build af frontend'en).
Denne kodeændring træder derfor IKKE i kraft i produktion bare ved at blive
merget til `main` — nogen med Supabase-adgang (janfogde@gmail.com eller
bjangst@gmail.com, begge har adgang til Supabase-organisationen) skal
manuelt køre `supabase functions deploy search`, eller deploye via Supabase-
dashboardet, for at fixet reelt slår igennem. Sandboxen her har hverken
Supabase CLI installeret eller netadgang til Supabase (org-policy). **Dette
gælder generelt for enhver fremtidig ændring i `supabase/functions/*`** —
værd at huske på i fremtidige opgaver, og at flage eksplicit til brugeren
hver gang en edge function ændres.

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
| 3 | Emoji i overskrifter/UI-chrome | ✅ Saneret på tværs af alle skærme og delte komponenter (se afsnit 5) — kun ægte indholds-emoji (allergen-glyffer, sprogflag, kategori-ikoner) står tilbage, bevidst, ikke chrome |
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
| 15 | Inkonsistent spacing | ✅ **Retrofittet 14. sept.** — de reelt "næsten runde" element-niveau-værdier (5/7/9/11/13/15px i `padding*`/`margin*`/`gap`) rundet op til nærmeste skala-trin (4/6/8/10/12/14/16/20/24/32px) på tværs af 20 filer, inkl. `theme.jsx`s CSS-streng. Se afsnit 5's log for metode og verifikation. Bemærk: dette var en smallere, mere afgrænset retrofit end først antaget — de fleste eksisterende padding-"varianter" (`12px 14px`, `10px 12px`, `8px 10px` osv.) var faktisk allerede på skalaen; den reelle inkonsistens var kun de enkelte odde tal, ikke hele mønsteret |
| 16 | Em-dashes ("—") alle vegne | 🟢 Tjekket — langt de fleste af de ~600 forekomster i `src/*.jsx` sidder i danske kode-kommentarer (usynlige for brugeren), ikke i UI-tekst. De der ER i bruger-vendt tekst er enkeltstående, funktionelle forbindelses-streger i naturligt dansk (fx "Det ligner ikke en gyldig stregkode — tjek cifrene."), ikke AI-agtig ophobning af flere streger i samme sætning. Vurderet som ikke et reelt problem — men hold øje med nye tekster |
| 17 | Generisk buzzword-copy | ✅ **Formelt gennemgået 14. sept.** — grep for typiske AI-marketing-klichéer (da. og en. varianter: "oplev", "din rejse", "tag kontrol", "næste niveau", "revolutioner" osv.) på tværs af `src/*.jsx` gav ingen reelle træf. Stikprøve af de mest synlige tekster (velkomst-tagline "Scan. Tjek. Spis trygt.", skærm-titler) bekræfter konkret/funktionel copy uden generisk fyld. Ingen ændringer nødvendige |
| 18 | Serif-kursiv-accenter | ✅ Ikke brugt — ingen serif-skrifttype i appen overhovedet |
| 19 | Space Grotesk + Instrument Serif (typisk AI-font-parring) | ✅ Ikke brugt — DM Sans/DM Mono |
| 20 | *(ikke synlig i det delte screenshot — spørg brugeren hvis relevant)* | — |

**Konklusion:** Appen var reelt kun ramt af ét konkret punkt (glassmorphism/
backdrop-filter — nu rettet) plus det i forvejen kendte emoji-punkt (siden
gennemført, se afsnit 5). Resten var enten allerede undgået fra projektets
start (fonte, farver, ikoner) eller ikke reelle problemer ved nærmere
eftersyn (em-dashes). Punkt 15 (spacing) og 17 (copy) er nu også taget op —
se opdateringen nedenfor.

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
