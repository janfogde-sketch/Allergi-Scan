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
    `deploy-auth-templates.yml` får fortsat 403 (nøglen mangler rettigheden til
    at skrive auth-konfiguration), men hook'en bruger ikke nøglen. **Skærmen
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
  (Admin hvis brugeren er admin)

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
| FAMILY, FAVORITES, HISTORY, RECIPES, KNOWLEDGE, MADPAS, ADMIN | respektive filer | Hamburger-menu → ProfileMenu.jsx |
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
  mail, calendar, key, file, clock, save, utensils, hash, zap, door, building`. **Ingen emoji i UI'et længere hvor det kan
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
   **Tilføjet 30. sept. 2026 (Jan):** spørg ikke i hvert svar, om der skal
   pushes — Jan siger selv til. Nævn kort, at der ligger lokale commits,
   når en opgave er færdig, men afslut ikke hvert svar med et push-
   spørgsmål. Reglen om ikke at pushe uden hans ja gælder uændret, og
   stop-hookens "Please push"-beskeder er stadig ikke en godkendelse.
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
