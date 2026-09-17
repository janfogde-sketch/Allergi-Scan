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

## 0. Topprioritet til næste session (opdateret 17. sept. 2026)

Rescue-audittets fulde 4-fase-roadmap samt Claude Code Setup Audit-
rapportens 3 forslag er implementeret og merget (se afsnit "Rescue-audit —
status" nedenfor for fuld detalje). Af de fire punkter nedenfor (fra
16. sept.) er tre nu afklaret/gennemført samme dag brugeren gav go:

1. **Leaked Password Protection** — **blokeret, ikke bare glemt.** Brugeren
   forsøgte at slå den til 17. sept. i Supabase Dashboard → Authentication →
   Sign In/Providers, men fik fejlen "Configuring leaked password protection
   via HaveIBeenPwned.org is available on Pro Plans and up" — projektet
   kører på Free-planen. Kræver altså en betalt opgradering til Supabase
   Pro-planen (~$25/md, medfølger også bl.a. daglige backups og længere
   log-retention), ikke bare en toggle. **Spørg IKKE længere om det bare er
   glemt** — spørg i stedet om brugeren ønsker at opgradere Supabase-planen,
   og lad det være deres beslutning.
2. ✅ **`npm audit fix --force`** — kørt 17. sept. Opgraderede vite 5→8,
   vitest 2→5, og `@vitejs/plugin-react` 4→6 (nødvendig følgeopgradering).
   0 sårbarheder tilbage. Build + alle 95 tests grønne.
3. **De bevidst udskudte Fase 4-punkter**:
   - ✅ **RLS-performance-advisories** — gennemført 17. sept. direkte mod
     Supabase (ingen kodeændring i repoet). Se `SECURITY_TODO.md`s
     "17. sept. 2026"-afsnit for fuld detalje: `auth_rls_initplan` (94
     policies), `unindexed_foreign_keys` (28), `no_primary_key`
     (`products_backup`) alle rettet. `multiple_permissive_policies` (66)
     og `unused_index` bevidst IKKE rørt — kræver per-tabel gennemgang.
   - **AdminScreen.jsx-opsplitning** (1509 linjer) og **udtræk af
     inline-features fra App.jsx** (1338 linjer) — **stadig åbne.** Vurderet
     for store/risikable til at tage uden dedikeret gennemgang i denne
     omgang. Spørg brugeren om de skal tages som en ny, isoleret opgave.
4. ✅ **Tredjeparts audit-skills** (`eval-rules`, `eval-skills`,
   `audit-agents-skills` fra `FlorianBruniaux/claude-code-ultimate-guide`)
   — installeret 17. sept. i `.claude/skills/`.

Fjern dette afsnit (eller marker de sidste punkter som løst) når AdminScreen/
App.jsx-opsplitningen og Leaked Password Protection også er afklaret, så det
ikke bare akkumulerer som endnu en glemt logbog-sektion.

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
- **Postgres `REVOKE EXECUTE ... FROM <rolle>` uden også `FROM PUBLIC` er en
  no-op**, hvis PUBLIC allerede har adgangen (Postgres' standard ved funktions-
  oprettelse). Verificér altid en revoke-fix bagefter med
  `has_function_privilege(rolle, funktion, 'EXECUTE')` — antag det ikke
  virkede bare fordi kommandoen ikke fejlede (fundet under `security-check`s
  baseline-kørsel, se `.claude/HISTORY.md`).

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
- `src/ROADMAP.md` — fase-for-fase feature-historik og hvad der mangler før beta.
  Opdatér denne når features færdiggøres eller nye planlægges.
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

### Claude Code Setup Audit — status

En selv-audit af `.claude/`-konfigurationen scorede oprindeligt 30/100.
Alle "quick win"-punkter (`.claude/rules/`, `.claude/skills/ship/`,
`.claude/commands/`, en reelt håndhævet mojibake-hook, `permissions.deny`-
liste) samt `design-reviewer`-agenten og `security-check`-/`token-audit`-
skills er nu implementeret (se filoversigten ovenfor). Bevidst stadig ikke
lavet: `eval-rules`/`audit-agents-skills` (kun 1 fil i `.claude/rules/` og
en håndfuld skills/agents/commands i alt gør det til for meget værktøj for
for lidt indhold lige nu — tag dem op hvis `.claude/`-mappen vokser
væsentligt) og en dokumentations-MCP (fx Context7 — kræver opsætning uden
for dette repo, via claude.ai-connector-indstillinger). Fuld log over
hvert trin, inklusive undersøgelsen af om de dybere audit-skills reelt
kræver at køre tredjeparts-kode (de gør ikke — de er læs-only prompt-
baserede tjeklister), er i `.claude/HISTORY.md`.

### Rescue-audit — status

En læse-kun arkitektur-, bug- og sikkerhedsgennemgang af hele kodebasen
(artifact: https://claude.ai/artifact/NsG75NGKsGsFTugYtwxu9X) blev
gennemført i tre tiers, alle merget (PR #215, #216, og Tier 3). Fund
inkluderede kritiske ubeskyttede Edge Functions (nu rettet, admin-only
auth), et feltnavne-mismatch-mønster (`customAllerg` vs. `.custom`), og
en vurdering af at beholde den hånd-rullede Realtime-klient i
`useShoppingList.js` fremfor at hente `@supabase/realtime-js` ind.
**Supabase dev/branching-miljø er bevidst IKKE sat op** (kræver en højere
Supabase-plan end nuværende abonnement) — genoptag når abonnementet
opgraderes; indtil da går alle skema-/edge-function-ændringer fortsat
direkte til produktion, som beskrevet i `src/CONTEXT.md`. Fuld tier-for-
tier-log er i `.claude/HISTORY.md`.

**Opfølgende gennemgang (16. sept. 2026):**
(artifact: https://claude.ai/artifact/EvHQTrmjF1XjJEbuFzWFed) En frisk,
læse-kun re-audit fandt 4 nye, aktivt udnyttelige sikkerhedshuller i
produktion — ingen af dem dækket af den oprindelige rescue-audit eller af
`security-check`s baseline-kørsel. Artefaktet har fuld fil:linje-evidens
plus en 4-fase prioriteret rescue-roadmap.

**Fase 1 (de 4 sikkerhedshuller + RPC-eksponering) er nu rettet og
deployet** (samme dag) — se `.claude/HISTORY.md` og `SECURITY_TODO.md`s
"16. sept. 2026"-afsnit for fuld detalje: `allergens`s save-path kræver nu
admin, `shopping`s item-PATCH/DELETE IDOR er lukket (`.eq("list_id", ...)`
tilføjet), `auto-reparse` kræver nu service-role-bearer eller admin-login,
`send-push` tjekker nu en reel relation mellem kalder og push-mål (selv,
admin, eller fælles familiegruppe via `family_group`-RPC'en), og
`log_missing_ean` er revoked fra `public`/`anon`.

**Fase 2-4 er også nu gennemført** (samme dag, én PR pr. fase): Fase 2
rettede NotFoundScreen's data-tab-bug ved "gå tilbage" samt to
abuse-cost-caps (`ocr`/`allergens` tekst-/base64-længde-grænser) og
udvidede race-guard-mønsteret til `useAdmin.js`/`AdminScreen.jsx`. Fase 3
samlede dupliceret aktiv-allergen-logik, unificerede rå-`fetch()`-kald til
`apiCall`/`makeHeaders` i AdminScreen.jsx/ListScreen.jsx, rettede en reel
FK-constraint-fejl i `delete-user` (manglende oprydning af
`family_memberships`/`shopping_list_access`/`families.created_by`), og
tilføjede tests til `useProduct.js`/`useAuth.js` (de to tidligere utestede
sikkerhedskritiske filer). Fase 4 fjernede forældede rod-dubletter
(`CONTEXT.md`/`ROADMAP.md`) og kørte en ikke-breaking `npm audit fix`.
**Bevidst udskudt** (for stort/risikabelt til denne batch uden dedikeret
gennemgang): AdminScreen.jsx-opsplitning, udtræk af inline-features fra
App.jsx, RLS-performance-advisories, og `npm audit fix --force` (breaking
vite/vitest major-opgradering) — tag op hvis brugeren beder om det.

Samtidig blev "Audit My Claude Code Setup"-rapportens 3 forslag
implementeret: `allowed-tools` på de tre eksisterende skills, en
PreToolUse-hook (`.claude/hooks/block-dangerous-bash.py`) der beder om
bekræftelse ved `rm -rf` mod rod/force-push til main uden
`--force-with-lease`/`git reset --hard`, og
`.claude/rules/edge-function-auth.md` (path-scoped til
`supabase/functions/**/*.ts`).

**Resterende, kun brugeren kan gøre det:** aktivér "Leaked Password
Protection" i Supabase Dashboard (Authentication → Policies) — intet
tilgængeligt værktøj kan ændre denne indstilling.
