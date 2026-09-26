# EatSafe (Allergi-Scan) — Samlet projektkontekst for Claude

> **Formål med denne fil:** Denne fil læses automatisk af Claude Code, hver gang en session
> startes i dette repo — uanset hvem der starter den. Den er skrevet så en anden bruger
> (f.eks. Jans forretningspartner), der åbner en helt ny Claude-session i dette repo, kan
> fortsætte arbejdet præcist som hvis samtalen fortsatte — samme viden om produktet,
> samme arkitektur-forståelse, og samme arbejdsgang/aftaler.
>
> **Hold den opdateret:** Når du (Claude) laver større ændringer — ny skærm, ændret
> navigation, ny arbejdsgang, nyt design-token — så opdatér denne fil i samme PR.
> Detaljeret database/edge-function-reference ligger i `src/CONTEXT.md` — denne fil
> linker til den og opsummerer resten.

---

## 0. Topprioritet til næste session (opdateret 24. sept. 2026)

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

**Eneste resterende punkt: Leaked Password Protection er blokeret, ikke
glemt.** Brugeren forsøgte at slå den til 17. sept. i Supabase Dashboard →
Authentication → Sign In/Providers, men fik fejlen "Configuring leaked
password protection via HaveIBeenPwned.org is available on Pro Plans and
up" — projektet kører på Free-planen. Kræver en betalt opgradering til
Supabase Pro-planen (~$25/md, medfølger også bl.a. daglige backups og
længere log-retention). **Spørg IKKE om det bare er glemt** — spørg i
stedet om brugeren ønsker at opgradere Supabase-planen, og lad det være
deres beslutning. Fjern dette afsnit når det er afklaret.

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
| Rollefordeling (25. sept. 2026) | **Bjørn ejer design/UI/UX** — farver, layout, komponenter, animationer, baggrundsbilleder og lignende. **Jan fokuserer på backend** — Supabase (skema, RLS, Edge Functions, sikkerhed), data-/funktionsændringer, integrationer. Ved en session der starter fra Jans instruktioner: forvent primært backend-/funktionsarbejde, og vær varsom med at foreslå eller lave designændringer på eget initiativ — design-beslutninger hører nu under Bjørns spor. Ved tvivl om hvis "spor" en opgave hører under: spørg, i stedet for at antage. |

Se `src/CONTEXT.md` for fuld database-skema-reference, edge-function-liste og
integrationsdetaljer (Madpas, familie-deling, auto-import-pipeline m.m.).

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

**AdminScreen.jsx-opsplitning (17. sept. 2026):** var vokset til 1509 linjer
i én fil — splittet op i `AdminScreen.jsx` (nu kun fane-bar + router, ~280
linjer) der renderer én sektions-komponent pr. admin-fane:
`AdminDashboardSection`, `AdminUsersSection` (+ `AdminUserDetailSheet`),
`AdminSubmissionsSection` (+ navngivet export `AdminSubmissionReview`),
`AdminTicketsSection` (+ `AdminTicketDetailSheet`), `AdminMissingSection`,
`AdminImportSection`, `AdminDebugSection`, `AdminRecipesSection`. Følg
samme mønster hvis en anden skærm vokser sig for stor: bryd op i
`<ScreenNavn><Sektion>Section.jsx`-filer, der modtager alt som props —
skærmens hovedfil beholder kun routing/fane-state. Samtidig blev App.jsx's
tre resterende inline-modaler udtrukket til `HelpModal.jsx`,
`BetaIntroModal.jsx`, `DeleteAccountModal.jsx` (App.jsx: 1338 → 1108
linjer — resten er hooks/contexts/effects, ikke JSX til at udtrække).

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

Fuld token-tabel + anbefalet spacing-skala er flyttet til
`.claude/rules/design-tokens.md` (path-scoped til `src/*.jsx`/`src/theme.jsx`,
så den kun indlæses ved UI-arbejde). Kort version: `--ink`/`--paper` (tekst/
baggrund), `--green` (primær), `--red`/`--amber` (fare/advarsel), `--blue`
(#3A6EA5, reel sekundærfarve — ikke aliaset til grøn), `--muted`/`--surface`/
`--border`, `--r`/`--sh`/`--sh2` (radius/skygge), `--f` (DM Sans).

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

**Når HELE den samlede opgave er færdig** (alle filer/bølger/punkter
brugeren har bedt om i denne omgang):
6. **STOP og spørg om godkendelse før push** (stående regel, ændret 25.
   sept. 2026 — se begrundelsen nedenfor). Opsummér kort hvad der er klar
   til at blive skibet (hvilke commits/filer, hvad de gør), og vent på et
   eksplicit "ja"/"push den"/lignende fra brugeren, FØR noget som helst af
   det følgende sker. Antag ikke at et tidligere "fortsæt"/"gå videre" i
   samme samtale dækker selve push-godkendelsen — den skal gives eksplicit,
   hver gang, selv når resten af arbejdsgangen (byg/test/commit) foregår
   uden at spørge som normalt.
7. Når godkendt: **Push** alle commits til den aktive feature-branch i én omgang.
8. **Opret ÉN PR** via GitHub MCP der dækker det hele — dansk PR-body der
   opsummerer alle commits/ændringer, tjek for PR-template først. Afslut med
   `🤖 Generated with [Claude Code]`-footer + session-link.
9. **Vent på grøn Vercel-status** på PR'en, hvis relevant (poll
   `pull_request_read`/`get_status` — bemærk at preview-deploys er slået
   fra projekt-bredt siden 25. sept. 2026, se afsnittet om det nedenfor, så
   der typisk ikke kommer noget statustjek at vente på; verificér i stedet
   lokalt build/test før du beder om godkendelse i trin 6).
10. **Squash-merge** PR'en.
11. **Resync branch:** hent nyeste `main`, reset feature-branchen til den, force-push
    med `--force-with-lease`, så branchen er klar til næste opgave.

**Undtagelse — kritiske/blokerende fejl:** en fejl der reelt er i produktion (fx
crashende skærm) skippes IKKE ind i batchen, men shippes for sig selv med det
samme som en isoleret hotfix-PR, uanset hvor i en større opgave man er — denne
undtagelse gælder STADIG uændret, inklusive at springe godkendelses-trinnet
(6) over, netop fordi det er en produktions-nødsituation hvor at vente på svar
er den reelle risiko.

**Hvornår er "opgaven" færdig?** Det brugeren bad om i den seneste sammenhængende
instruktion — fx "gennemgå disse tre skærme" er én opgave (→ én PR ved slutningen,
selvom det er tre skærme/tre commits), ikke tre. Ved tvivl: hellere for få PR'er
end for mange — brugeren siger til hvis en batch blev for stor.

Trin 1-5 (lave ændringen, byg, test, mojibake-scan, commit) gøres **uden at
spørge brugeren om lov undervejs** — det er en etableret, godkendt proces i
dette projekt. Brugeren giver typisk korte, uformelle instruktioner på dansk
(ofte som hurtige afbrydelser midt i en igangværende opgave) — tag dem som nye
krav der skal implementeres, ikke som spørgsmål der skal diskuteres først.
**Push (trin 6 og frem) er den ENESTE undtagelse** — det kræver altid eksplicit
godkendelse, jf. reglen ovenfor.

**Baggrund for godkendelses-kravet (25. sept. 2026):** brugeren spurgte
eksplicit hvorfor en batch af skan-funktions-rettelser blev pushet/merget uden
først at blive spurgt — den daværende regel (autonomt push når "opgaven" var
færdig, uden at spørge) var teknisk fulgt korrekt, men gav en uventet
oplevelse. Brugeren bad om at ændre selve reglen permanent, ikke bare for den
ene session, fremfor bare at få et engangs-nej. Løst ved at tilføje et
eksplicit godkendelses-stop lige før push (trin 6), som den eneste ændring —
byg/test/commit-delen af arbejdsgangen forbliver uændret autonomt, da det
kravet specifikt handlede om selve det at skibe/dele ændringer, ikke om at
lave dem lokalt.

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

**Fuld dag-for-dag-log** (alle 14 gennemgangs-bølger, hver "lektion",
20-punkts-tjeklistens fulde vurdering, søgefunktions-fix'ets fulde
undersøgelse, spacing-retrofittets metode, PWA-installationsflowets
fejlfindingshistorie) er flyttet til `.claude/HISTORY.md` — dette afsnit
udgjorde tidligere ~70% af hele `CLAUDE.md` (fundet af `token-audit`-
skillen), og `CLAUDE.md` læses ved hver eneste session-start uanset opgave.

**24. sept. 2026 — Scan-forsiden og app-baggrunden: fuld redesign-runde,
afsluttet.** Efter flere iterationer (delt referencedesign → frugt-collage
→ nyt referencefoto → app-bredt baggrundsbillede → en produktions-hotfix
af en indefinit-højde-bug) landede den nuværende, stabile tilstand:
- **`.home-hero-frame`** (ScannerScreen.jsx) har en definitiv
  `calc(100dvh - 143px - env(safe-area-inset-bottom))`-højde + CSS
  Container Queries (`clamp(min, Ncqh, max)` på alle mål) for
  proportional skalering — verificeret nul overflow programmatisk på
  Playwrights rigtige enhedsprofiler (iPhone SE 320×568, iPhone 13/14
  Pro Max, Pixel 5, bred desktop).
- **Ét app-bredt baggrundsbillede** (`src/assets/app-background.webp`,
  via `.app-bg{position:fixed;z-index:0}` + `.screen{position:relative;
  z-index:1}`) er fælles for ALLE skærme, ikke kun Scan-forsiden.
- **Topbar/bottom-nav** har et let frostet-glas-look (`backdrop-filter:
  blur` + `mask-image`-udtoning i stedet for en hård kant) app-bredt.
- **"Prøv en demo"-knappen er fjernet** — `DemoSlider`/`showGuide` er
  bevidst ikke slettet, men har ingen synlig UI-indgang længere. Genoptag
  ved behov (fx en indgang under Profil-menuen), eller fjern dødt-kode-
  resten, hvis det bekræftes at guiden reelt ikke skal bruges mere.

**Scan-knappen selv har efterfølgende været igennem flere runder samme
dag** (fyldt grøn gradient → forsøg på en synlig glans-highlight/lys-
effekt → brugerfeedback "ligner en gummibold" → fladere, mindre kontrast-
fyldt gradient → tre forslag til en ny retning, brugeren valgte "ghost/
outline" med et lyspunkt i kanten → brugerfeedback "ligner en radar" på
den første, for skarpe udgave af ringen). **Nuværende design:** en let,
hvid cirkel med grønt ikon/tekst; en bredt blurret, langsomt roterende
lyskilde i en tynd ring (`scanCtaRingSpin`, 9s — IKKE en skarp/smal bue,
det gav radar-udtrykket); en blød, jordet ambient-glød bagved; og en
fler-lags elevation-skygge (nær+fjern) for reel dybde uden glossy-look.
**Bundnavigationens inaktive ikoner** bruger nu en solid, mørkere farve
(`--ink2`) i stedet for `opacity:.45`, som gjorde dem svære at se mod
barens gennemsigtige/slørede baggrund.

Fuld dag-for-dag-detalje for hele denne redesign-runde (alle mellem-
liggende forsøg, mockup-iterationer, fejlfindingshistorik, backtick-
byggefejl-mønsteret) er i `.claude/HISTORY.md`.

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

### Madpas — redesignet, forenklet til kernefunktionen, herefter finpoleret tre gange (26.-27. sept. 2026)

Madpas' formål: en tjener, butiksansat, hotel- eller cafémedarbejder — IKKE
kun restaurantpersonale — skal kunne forstå de vigtigste kost-/allergi-
oplysninger på 2-3 sekunder. To redesign-runder 26. sept. byggede et fuldt
delings-system (token-link, `madpas_links`-tabel + RPC, offentlig side,
QR-kode, PDF/print, E-numre-opt-in), en tredje runde samme dag fjernede
al den deling igen efter eksplicit brugerkrav ("Link- og QR-funktionalitet
skal være helt fjernet") — Madpas er udelukkende on-device siden da.

**Fjerde runde (27. sept.) — finpolish af selve fremvisningsskærmen,
uden at ændre strukturen:** hvert allergen/fritekst-emne vises nu som sin
EGEN informationsblok (stort, fedt navn — det mest fremtrædende element på
skærmen — derefter eksempler, derefter en PR.-EMNE sikkerhedstekst) i
stedet for en delt liste med én kombineret sætning for hele sektionen.
Sikkerhedsteksten er samtidig gjort mere præcis: "...does not contain
{name} or ingredients made from {name}." (var kun "...does not contain
{name}."). Ny, bevidst OPT-IN krydskontaminerings-advarsel (toggle på
Madpas-forsiden, default FRA — EatSafe må ikke selv antage alvorlighedsgraden
af brugerens allergi) tilføjer én kombineret sætning nederst i FOOD
ALLERGIES-sektionen når aktiveret. Oplæsnings-knappen er nu stor og
fuld-bredde fast i bunden, og oplæsningen inkluderer nu selve
sikkerhedsteksten (og krydskontaminering hvis aktiveret), ikke kun navn +
eksempler. CTA-knappen hedder nu "Åbn madpas" (var "Vis til tjener"), og
undertekst/framing er gjort bredere ("restaurant-, café-, hotel- eller
butikspersonale", ikke kun tjener) — footeren i fremvisningsskærmen viser
nu intet branding/dato længere.

**To reelle, pre-eksisterende huller fundet og rettet i tidligere runder
(stadig gældende):** `ALLERGEN_T` og `ALLERGEN_EXAMPLES` (per-sprogs
allergen-navne/-eksempler) manglede begge `hvede`/`maelkeallergi` helt —
uden en sprog-nøgle faldt visningen tilbage til den DANSKE `a.label`/ingen
eksempler, selv når madpasset var sat til fx engelsk. Begge rettet for
alle 17 sprog.

**Femte runde (27. sept., samme dag) — diæter fik samme type besked som
allergier:** diæter (vegan/vegetarian/pescetarian/gluten-free/keto) vises
ikke længere kun som badges i fremvisningsskærmen, men som samme slags
blok som allergier (navn + en naturligt oversat "jeg spiser X, sørg for
at min mad ikke indeholder Y"-besked, `MADPAS_DIET_MESSAGE_T`, 5×17
sprog). Sektionsoverskriften er ændret fra "DIET" til "DIETARY
REQUIREMENTS". To mindre isolerede rettelser i samme runde: Soja-
allergenets engelske navn viste fejlagtigt to varianter samtidig ("Soy /
Soya") — rettet til blot "Soya" (korrekt for MADPAS_LANGUAGES' britiske
"en"-variant). "Whey" manglede i mælkeallergiens eksempler — tilføjet
(krævede samtidig at hæve `madpasAllergenExamples()`s interne
eksempel-grænse fra 4 til 5, da de 4 eksisterende eksempler alene allerede
fyldte den gamle grænse).

**Sjette runde (samme dag) — ren visuel/spacing-polish af fremvisnings-
skærmen** (design-only, se den stående Vercel-kvote-regel ovenfor):
spacing rundet til appens faste skala, typografisk hierarki finpudset
(den statiske "I am allergic to:"-headline nedtonet så den ikke
konkurrerer med allergen-navnet/sikkerhedsteksten), krydskontaminerings-
advarslen gjort en anelse lettere/mere sekundær, og — vigtigst — en reel
bund-scroll-sikring: mere bund-padding + `env(safe-area-inset-bottom)` på
fremvisningsskærmens Read aloud-footer, verificeret programmatisk at
intet indhold nogensinde kan overlappe knappen. Luk-/oplæs-/krydskonta-
mineringstoggle-knapperne fik samme tryk-feedback (`:active{scale(.97)}`)
som resten af appens knapper. Blev committet lokalt (ikke pushet, jf.
design-only-reglen), men pushet/merget alligevel efter brugerens
eksplicitte "Push" — reglen forhindrer AT vi selv initierer et push for
rene design-ændringer, ikke at brugeren aktivt kan bede om det.

**Syvende runde (samme dag) — fire præcise afstandsjusteringer på selve
Madpas-forsiden:** sprog-dropdown→KRYDSKONTAMINERING (+12px),
KRYDSKONTAMINERING-hjælpetekstens linjehøjde (1.4→1.6),
KRYDSKONTAMINERING→"Dit madpas" (0→16px, manglede helt før), "Dit
madpas"-label→chips (+8px), chips→"Åbn madpas" (+18px) — alle via lokale
style-overrides, ikke i de delte klasser (`.mp-section-lbl`/`UI.mb14`)
der bruges andre steder i appen. CTA-størrelse og sidebredder urørt.

**Ottende runde (samme dag) — reelt venstre-alignment-fund:** `.mp-head`
(kun brugt i MadpasScreen.jsx) havde sin egen ekstra 20px venstre/højre-
padding oveni `.mp-scroll`s allerede eksisterende 20px — titel/undertekst/
sektionsoverskrifter sad derfor 40px inde, mens "Dit madpas"/chips/CTA
(en søskende-div udenfor `.mp-head`) kun fik 20px, altså 20px længere til
venstre end resten af siden. Rettet med ét CSS-linje-skift
(`.mp-head`s venstre/højre-padding fjernet). Bivirkning (tilsigtet):
sprog-dropdownen og CTA-knappen har nu samme bredde. Verificeret med
`getBoundingClientRect()` for otte elementer — alle nu `left:20px`.

Fuld dag-for-dag-detalje (alle otte runder) i `.claude/HISTORY.md`,
backend-/struktur-reference i `src/CONTEXT.md` afsnit 10.

### Profil restruktureret — "Rediger profil" og "Rediger præferencer" adskilt (28. sept. 2026)

Tidligere førte BÅDE "Rediger" ved profilkortet OG "Rediger" ved "Mine
præferencer" til samme skærm (`SCREENS.EDITPROFILE`), som blandede
personlige oplysninger (navn/telefon/alder/køn) sammen med allergi-/
diæt-/E-nummer-redigering i én lang formular — uklart hvad man rent
faktisk redigerede, og en helt selvstændig, hånd-rullet kopi af allergi-/
diæt-/E-nummer-UI'et (bl.a. med RØD som valgt-farve i stedet for appens
korrekte grønne valgt-state) i stedet for at genbruge onboardingens
allerede eksisterende, delte komponenter.

**Nu to adskilte skærme:**
- **`SCREENS.EDITPROFILE`** ("Rediger profil", nås KUN fra profilkortets
  "Rediger") — udelukkende Navn (obligatorisk) + Telefon. Alder/køn er
  fjernet helt herfra — EatSafe bruger dem intetsteds til en reel
  funktion (kun til visning i familie-rækker/adminpanelet), så de ikke
  længere er obligatoriske felter på selve kontoen. Ingen allergier/
  diæter/E-numre/husstand her.
- **`SCREENS.EDITPREFERENCES`** ("Rediger præferencer", NY, nås fra "Mine
  præferencer"s "Rediger" på Profil) — udelukkende allergier/
  intolerancer/diæter/E-numre. Genbruger PRÆCIS de samme delte
  komponenter som onboarding og `MemberForm.jsx` allerede bruger
  (`AllergenChipPicker`/`DietChipPicker`/`ENumberPicker`, `AllergenPicker.jsx`)
  — samme grønne valgt-state, ikoner, labels som onboarding, ikke en
  tredje kopi af samme UI. Redigeres direkte på én side (ingen "Næste"-
  trin-flow) — `Accordion`-komponenten (samme mønster som MemberForms
  E-numre-sektion) bruges kun til at folde E-numre-listen ud/ind, ikke
  til at gate fremdrift.
- **Gluten↔glutenfri-synkroniseringen** (vælges "Gluten" markeres
  "Glutenfri" automatisk) fandtes tidligere som to næsten-identiske
  kopier af samme effekt (onboarding + MemberForm) — udtrukket til én
  delt `useGlutenFreeSync()`-hook i `AllergenPicker.jsx`, nu brugt tre
  steder (onboarding, MemberForm, Rediger præferencer) i stedet for at
  tilføje en fjerde kopi.

**"Min husstand" på Profil er stærkt forenklet** — viste tidligere hele
husstandens medlem-chips direkte på Profil-siden, en reel duplikering af
den allerede eksisterende, fulde husstands-/familiefunktion
(`SCREENS.FAMILY`). Erstattet af én kompakt, klikbar række ("Husstand" +
antal medlemmer + chevron) der blot åbner den eksisterende Familie-side —
ingen medlem-chips, ingen "tilføj medlem", ingen administration længere
på selve Profil-siden. Tæller BÅDE administrerede profiler (`family`) og
rigtige husstandskonti (`household`) — samme to grupper Familie-siden
selv viser samlet.

**Uændret:** "Mine præferencer"-oversigten på selve Profil-siden (kompakt
gruppevisning af aktive valg, kun kategorier der reelt har noget), konto-/
support-footeren, samt Scan/Historik/Indkøbsliste/Madpas/husstandslogikken
i øvrigt.

**Opfølgende oprydningsrunde, samme dag — "Din aktivitet" (Gamification)
og Gluten/Glutenfri-forklaring:** "Familie aktive"-tallet er fjernet fra
aktivitetskortet (Husstand har nu sin egen tydelige genvej, se ovenfor) —
tilbage er et rent 2×2-grid (Dage i træk/Scanninger i alt/Advarsler
fanget/Sikre opdagelser). "Dages streak" omdøbt til "Dage i træk", og
header-undertekstens redundante "Streak ·" fjernet (streak kommunikeres
allerede via "X dage!"-badgen og selve feltet) — progressbaren og "3
dage!"-badgen er UÆNDREDE, som bedt om. Den blå venstre-accentkant på
kortet er fjernet uden erstatning (kortet er nu lige så fladt som fx
Husstand-rækken). Gluten-allergenets eksisterende info-ikon (ⓘ, allerede
brugt til en cøliaki/hvedeallergi-forklaring) har fået sin note udvidet
til også at forklare koblingen til kostpræferencen "Glutenfri" (vælges
Gluten, tilføjes Glutenfri automatisk via `useGlutenFreeSync`, så
brugeren ikke skal vælge begge selv) — ingen ny UI, kun tekst i den
allerede eksisterende mekanisme.

**Sidste polish-runde, samme dag — footer-overlap og microcopy:** et reelt
fund — Profil-sidens footer ("Spørgsmål eller feedback?"/mail/privatlivs-
politik/"EatSafe Beta") kunne ende delvist dækket af den faste bundnavigation,
fordi footerens egen `paddingBottom:8` ikke pålideligt supplerede den delte
`.screen`-klasses flade 110px bundpadding på tværs af enheder med forskellig
`env(safe-area-inset-bottom)`. Rettet ved at give footeren sin egen, generøse
`paddingBottom:calc(96px + env(safe-area-inset-bottom))` — scoped til kun
denne skærms footer, ikke en ændring af den delte `.screen`-klasse. Verificeret
med Playwright (iPhone SE/13/14 Pro Max): 127px fri luft mellem footerens sidste
linje og bundnavigationens top efter scroll helt til bunds. Derudover omdøbt
"Ugentlig streak" til "Ugentlig aktivitet" (samme progress-bar/badge, kun
teksten). Ingen andre layout-/farve-/funktionsændringer.

Fuld detalje i `.claude/HISTORY.md`.

### Indstillinger omstruktureret til seks logiske sektioner (28. sept. 2026)

`SettingsScreen.jsx` var indtil videre kun to kort (Konto med Log ud/Slet
konto side om side, og Notifikationer). Omstruktureret efter en detaljeret
"FORBEDR INDSTILLINGER I EATSAFE"-spec til seks sektioner: **Konto** (kun
Log ud), **Sprog** (Standard-sprog til Madpas — genbruger `MADPAS_LANGUAGES`
+ App.jsx's allerede lagrede `madpasLang`-state og MadpasScreen.jsx's egne
`.mp-lang-dropdown`/`.mp-lang-list`-CSS-klasser 1:1, ikke en ny UI),
**Scanning** (to nye toggles, se nedenfor), **Notifikationer** (samme
funktion, forbedret layout — se nedenfor), **Privatliv & data**
(Privatlivspolitik-link, en udfoldelig "Hvilke data EatSafe gemmer"-liste,
og **Slet konto** flyttet hertil fra Konto-kortet ind i en tydeligt
adskilt "FAREZONE"-underafsnit med rød tekst-knap i stedet for en fyldt
rød blok, så den ikke konkurrerer visuelt med Log ud), og **Om EatSafe**
(Version via det allerede eksisterende `formatBuildTime()`/`COMMIT_SHA`
fra `utils.jsx`, "Om EatSafe Beta" der genåbner den eksisterende
`BetaIntroModal` via samme `setBetaIntroStep(0)/setBetaIntroSeen(false)`-
mønster som ProfileMenu.jsx, og "Kontakt & feedback" der åbner den
eksisterende `FeedbackModal` via samme `onOpenFeedback`-prop-navn som
`HelpModal.jsx` allerede bruger).

**To nye, reelle Scanning-indstillinger** (localStorage-persisteret, samme
mønster som `madpasCrossContact`, default TIL): "Vibration ved advarsel"
og "Lyd ved advarsel". Begge er koblet til et helt nyt checkpoint i
`useProduct.js`s `runLookupProduct` (en `fireWarningAlert()`-hjælpe-
funktion, genbruger `navigator.vibrate`+Web Audio-oscillator-mønsteret fra
`useScanner.js`s eksisterende "stregkode registreret"-feedback, men med
en tydeligt anderledes, lavere/længere tone) der fyrer specifikt når et
scan-resultat er `danger`/`warn` — IKKE det samme som den allerede
eksisterende, ubetingede vibration ved enhver scanning (som er urørt).
State er løftet til App.jsx (`vibrateOnWarning`/`soundOnWarning`) og
sendes med i `lookupProduct`s `ctx`, præcis som appens øvrige scan-
afhængige state.

**Notifikationer-kortets ændringer:** "Push-tilladelse" omdøbt til
"Push-notifikationer"; kategori-labels finpudset i `useNotificationPrefs.js`
("Dine indsendelser"→"Indsendte produkter", "Familie"→"Familieinvitationer",
"Ugentligt opskrifts-digest"→"Ugentlig opskriftsoversigt" — kun de
synlige labels, databasenøglerne/`id`-felterne er uændrede); de gentagne
PUSH/MAIL-labels på hver række erstattet af én fælles kolonneheader
("Push"/"E-mail") over hele gridet; og — den reelle funktionelle rettelse
— per-kategori Push-toggles vises nu grånede/deaktiverede (med en kort
forklaring ovenfor gridet) når browserens push-tilladelse ikke er givet,
så en toggle aldrig kan se aktiv ud uden reelt at kunne sende noget.
Mail-kolonnen er bevidst UPÅVIRKET af push-tilladelsen (de to kanaler er
uafhængige af hinanden).

**Bevidst udeladt** (ikke glemt — begrundelse i `SettingsScreen.jsx`s
egen filhoved-kommentar): "App-sprog" (appen har intet i18n-system, al
UI-tekst er hardkodet dansk — kun Madpas har reel sprogunderstøttelse),
"Åbn resultat automatisk efter scanning" (scan-flowet har allerede
ingen anden tilstand at slå til/fra — det er allerede ubetinget
automatisk), "Eksportér mine data" (ingen understøttende Edge Function
findes), "Vilkår" (ingen selvstændig vilkårs-side findes, samme kendte
begrænsning som OnboardingScreen.jsx's "Handelsbetingelser"-tekst
allerede dokumenterer), og en "Åbn Indstillinger"-genvej ved afvist
push (ingen cross-browser PWA-API til at åbne systemindstillinger findes
— den eksisterende tekstforklaring er den ærlige erstatning).

Verificeret med Playwright (artifact-preview-build, login-bypass,
hamburger-menu → Indstillinger): alle seks sektionsoverskrifter til
stede, sprogvælgeren åbner/vælger/persisterer korrekt, Slet konto væk
fra Konto-kortet og til stede i Privatliv & data-kortets Farezone,
"Hvilke data EatSafe gemmer" folder korrekt ud, de tre omdøbte
notifikations-labels og den fælles Push/E-mail-kolonneheader begge til
stede, Om EatSafe-sektionens tre rækker til stede. Ingen build-/test-/
mojibake-fejl (109/109 tests bestået).

**Opfølgende oprydning, samme dag — privatlivspolitik kun ét sted i
navigationen:** hamburgermenuens (`ProfileMenu.jsx`) selvstændige
"Privatliv"-punkt (linkede direkte til `https://eatsafe.dk/privacy`) er
fjernet — samme link findes nu KUN under Indstillinger → Privatliv & data
(tilføjet i denne omgang, se ovenfor). Brugerens egen begrundelse:
hamburgermenuen skal navigere mellem appens vigtigste funktioner, ikke
huse juridiske links der allerede ligger under Indstillinger.
ProfileScreen.jsx's eget footer-privacy-link (nederst på profilsiden) er
UÆNDRET, som bedt om — begge tilbageværende links peger på præcis samme
eksterne side. `handleItemClick`s nu-ubrugte `href`-gren i ProfileMenu.jsx
er fjernet som en direkte konsekvens (ingen andre menupunkter brugte den).

**Endnu en opfølgning, samme dag — "FINAL POLISH – INDSTILLINGER" (copy +
platformskorrekt adfærd + bund-overlap, ingen redesign):**
- **Bund-overlap rettet:** "Om EatSafe"-kortet (sidste element på siden)
  fik `marginBottom:"calc(96px + env(safe-area-inset-bottom))"` — samme
  rodårsag/løsning som ProfileScreen.jsx-footerens tidligere fix (den
  delte `.screen`-klasses flade 110px medregner ikke `env(safe-area-
  inset-bottom)`). Verificeret ~144px fri luft til bundnavigationen efter
  scroll til bunds (iPhone SE/13).
- **Scanningstekster udvidet:** "Vibration/Lyd ved advarsel"s hjælpetekst
  ændret fra "...matcher en allergi" til "...udløser en advarsel", da
  danger/warn-status også kan komme fra diæter/E-numre, ikke kun
  allergier — samme rettelse i en kode-kommentar i `useProduct.js`.
- **Push-status gjort platforms-ærlig:** "Blokeret i browserindstillinger"
  (antog fejlagtigt altid en browser-indstilling, ikke fx en installeret
  PWA's OS-niveau app-tilladelse) erstattet med "Push-notifikationer er
  slået fra på enheden." + en mere universel forklaringstekst. En "Åbn
  Indstillinger"-knap blev genundersøgt og stadig IKKE tilføjet — ingen
  cross-browser/cross-platform JS-API findes til at åbne push-
  indstillinger fra en PWA, uanset platform, så en sådan knap ville altid
  være fake (se `SettingsScreen.jsx`s filhoved for detaljen).
- **"Sprog" omdøbt til "Madpas-sprog":** appen har intet app-sprog-skift
  at sektionere under et generisk "Sprog" (kun Madpas har reel sprog-
  understøttelse) — samme begrundelse som da "App-sprog" oprindeligt blev
  udeladt.
- **Version gjort brugervenlig:** viste tidligere `formatBuildTime()` +
  rå `COMMIT_SHA` som primær info. Nu viser rækken "Beta" (reel status,
  matcher topbarens badge — IKKE et fabrikeret tal som "0.9.0", da appen
  ikke har et rigtigt semver-nummer) + en venlig bygge-dato, og
  git-commit-SHA'et er flyttet til en sekundær, udfoldelig
  "Build-ID (teknisk)"-detalje (samme udfolde-mønster som "Hvilke data
  EatSafe gemmer").
- **"Kontakt & feedback" omdøbt til "Kontakt & support"** — mindre
  redundant navngivning ved siden af topbarens egen "Feedback"-knap.
- Uændret, som krævet: Privatliv & data-kortets indhold, Farezone/Slet
  konto, Push/E-mail-matricens mekanik, og selve scanningstogglernes
  funktion (kun deres hjælpetekst er ændret).

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

---

## 6. Design-antimønstre — ting vi bevidst IKKE vil have i appen

Fuld tjekliste (20 punkter, "20 reasons why your app looks vibecoded") med
status pr. punkt er flyttet til `.claude/rules/design-tokens.md` (path-scoped
til `src/*.jsx`/`src/theme.jsx`). Brug den som et **checkpoint** ved
UI-arbejde, ikke kun en engangs-oprydning. Kort status: appen var reelt kun
ramt af ét konkret punkt (glassmorphism/`backdrop-filter` — rettet 14. sept.)
plus det i forvejen kendte emoji-punkt (siden gennemført, se afsnit 5).
Resten var enten allerede undgået fra projektets start, eller ikke reelle
problemer ved nærmere eftersyn.

---

## 7. Hvor finder du mere?

- `src/CONTEXT.md` — fuld teknisk reference: database-tabeller, edge functions,
  familie-deling, Madpas, auto-import-pipeline. Opdatér denne når skema/integrationer
  ændres.
- Denne fil (`CLAUDE.md`) — hold "Arkitektur"- og "Igangværende arbejde"-afsnittene
  opdaterede efter større UI/navigations-ændringer, så en frisk Claude-session altid
  har et retvisende billede.
- `.claude/rules/design-tokens.md` — designsystem-tokens + antimønstre-tjekliste,
  path-scoped til UI-filer (indlæses kun ved arbejde i `src/*.jsx`/`src/theme.jsx`).
- `.claude/skills/ship/SKILL.md` — kaldbar genvej til det fulde ændrings-workflow
  fra afsnit 4 (byg/test/mojibake/commit/push/PR/merge/resync).
- `.claude/commands/resync-branch.md`, `.claude/commands/mojibake-scan.md`,
  `.claude/commands/qa.md` (byg/test/mojibake uden commit/push),
  `.claude/commands/review-pr.md` (review mod EatSafes egne konventioner —
  arkitektur-regler, edge-function-auth-mønster, fladhed-bug, feltnavne-
  mismatch) — genveje til dele af ship-workflowet + review.
- `.claude/hooks/mojibake-check.py` — kører automatisk (via `PostToolUse`-hook,
  se `.claude/settings.json`) efter hver `Write`/`Edit` og advarer hvis
  den ændrede fil indeholder mulig kyrillisk mojibake.
- `.claude/agents/design-reviewer.md` — subagent der gennemgår én/flere
  skærme mod antimønstre-tjeklisten, fladhed-bug-mønsteret, emoji/indhold-
  skellet og spacing-skalaen. Encoder den manuelle gennemgangsproces der
  er brugt gentagne gange i designforbedrings-arbejdet (afsnit 5).
- `.claude/skills/security-check/SKILL.md` — sikkerhedsgennemgang af
  kodebasen + det live Supabase-projekt (Edge Function auth-mønster,
  service-role-eksponering, `get_advisors`). `.claude/skills/token-audit/
  SKILL.md` — måler CLAUDE.md/regel-filers faste context-overhead og
  foreslår konkrete nedskæringer. Begge er egenskrevne, ikke kopieret fra
  tredjepart.
- `.claude/HISTORY.md` — fuld dag-for-dag-historik for designforbedrings-
  arbejdet, PWA-installationens fejlfindingshistorie, og hvert trin af
  Claude Code Setup Audit + rescue-audittet. IKKE automatisk loadet ved
  session-start (kun `CLAUDE.md` er det) — læs den når du har brug for den
  fulde baggrund bag en beslutning, ikke bare konklusionen.

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
