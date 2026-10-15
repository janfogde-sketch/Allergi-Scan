# EatSafe (Allergi-Scan) — projektkontekst for Claude

> Læses ved hver session. **Regel:** tilføjelser kort; detaljer i `docs/` med henvisning. Afsnit-numre ændres ikke.
> Detaljer i `docs/` (linket under hvert afsnit), historik i `.claude/HISTORY.md`, database i `src/CONTEXT.md`.

---

## 0. Start her

- **To do-listen** (admin-panelet, tabellen `admin_todos`, `src/CONTEXT.md` §10). Starter sessionen med et to do-id, læs kun den opgave
  og dens kommentarer, og gå i gang. Starter den uden opgave: læs åbne punkter med
  `select title, status, priority, track, due_date from admin_todos where status <> 'done'`, nævn dem kort, og spørg hvad der tages først.
  Tickets ligger også på listen (status følger begge veje).
- **Skriv til to do-listen kun med workflowet "Skriv til to do"** (`todo-write.yml`). Aldrig som migrationsfil og aldrig med `execute_sql`.
  Format og trin: `docs/todo-skrivning.md`.
- **Overskrifter på to do'er (Jan, 15. okt.):** simple og på almindeligt dansk, så Jan forstår dem med det samme: ingen koder (S5, G18), ingen
  "[Før beta]" først og ingen fagord eller filnavne i overskriften. Detaljer og koder står i beskrivelsen. Gælder også nye to do'er.
- **Databaseændringer** er en fil i `supabase/migrations/` (version = unikt tidsstempel), anvendt af `apply-migrations.yml` ved merge til main.
  Ikke `apply_migration`/`execute_sql` til skrivning; læsning er fint. Edge-funktioner deployes ved merge af `deploy-edge-functions.yml`.
  Detaljer: `docs/drift.md`.
- **Pauser (Jan):** Supabase Pro er på pause (spørg kun, om han vil opgradere). Vercel er på Pro. Telefontestrunden er på pause (tjekliste: https://claude.ai/artifact/1YwwF252KhrCAWrgSssw1X); opret tickets for `fail`.
- **Netværk:** cloud-miljøet når eatsafe.dk, Supabase og world.openfoodfacts.org. Testkonto med admin-rolle: kun efter Jans ja.
  Test-mail/-push kun til Jans og Bjørns egne konti.
- **Login og mail:** egen SMTP via Resend; auth-mails sendes af `auth-send-email` (`supabase/templates/`). De 24 mailskabeloner deler
  mørk palette (test `src/mailDarkMode.test.js`); ændr alle samtidig. `docs/drift.md`.
- **Adgangskode:** mindst 10 tegn, småt bogstav, stort bogstav og tal (`passwordErrorText()`/`PASSWORD_REQUIREMENTS_TEXT` i `helpers.js`).
  Ændres kravene i Supabase, ret `helpers.js` tilsvarende.
- **Notifikationer er live** (push og mail slået til via `app_flags`). Detaljer: `src/CONTEXT.md` §9, `docs/notifikationer-testplan.md`.
- **Admin-panel:** `eatsafe.dk/admin.html` (`src/admin/`). Rettigheder håndhæves i databasen (RLS) og edge-funktionerne. Ny følsom admin-handling
  får en audit-trigger. Udseendet er IKKE frosset. `docs/drift.md`, `docs/admin-statusser.md`.

## 0b. Politikker og opbevaring

Detaljer: `docs/politik-og-opbevaring.md`.

- **Vilkår og privatlivspolitik skal følge appen.** Teksten bor ét sted (`src/legalText/`); HTML-siderne genereres med
  `node scripts/build-legal-pages.mjs` (test `src/legalText.test.js`). Ret aldrig HTML-filerne i hånden.
- **Ændring der rører personoplysninger** (felter, tabeller, leverandører, notifikationstyper, lagring, login, AI-brug, opbevaring): ret
  teksterne i samme PR og sæt "Sidst opdateret". Skriv teksterne generelt, så almindelige tilføjelser ikke kræver ny tekst.
- **Sessionstart:** er to do'en "Gennemgå politikker mod appændringer" forfalden, gennemgå `git log` siden sidste gennemgang, opret fund som to do,
  luk opgaven og opret en ny med frist om en måned.
- Åbne juridiske punkter står i tickets "[Brugsvilkår · IKKE FÆRDIGE]"/"[Privatlivspolitik · IKKE FÆRDIG]", aldrig i den offentlige tekst.
- **Opbevaring (GDPR):** ny tabel/kolonne med personoplysninger kræver frist, sletning ved kontosletning og automatisk oprydning, og en opdateret
  politik. **DB-testen `supabase/tests/account_deletion.sql` fejler, hvis en kolonne med brugerdata ikke står på "dækket"-listen: tilføj
  sletning/oprydning først, derefter listen.**
- Frister står i privatlivspolitikkens afsnit 11 og `src/CONTEXT.md` §3; databasen skal gøre det samme.
- **Helbredsdata (art. 9):** særskilt samtykke logget i `consent_log` (`src/CONTEXT.md` §3). Ændres samtykketeksten eller politikken væsentligt,
  hæves `HEALTH_CONSENT_VERSION` (`constants.jsx`) og `policyUpdated` i `healthConsent.test.js`, så alle bekræfter på ny (`ConsentRenewalModal.jsx`).
  Tilbagetrækning sletter helbredsdata.

---

## 1. Hvad er EatSafe?

Dansk PWA til mennesker med fødevareallergier/-intolerancer. Brugeren scanner en stregkode (eller søger). Appen matcher ingredienserne
mod brugerens (og familiens) profil og viser sikkert/farligt/usikkert med begrundelse, sikre alternativer og indkøbsliste.

| Nøgle | Værdi |
|---|---|
| Live URL | https://www.eatsafe.dk (eatsafe.dk giver 307 hertil; links, mails og TWA bruger www) |
| GitHub / hosting | `janfogde-sketch/Allergi-Scan` (`main` = produktion). Vercel, auto-deploy ved push til `main` |
| Backend | Supabase, projekt `jegrpcflyguadyxialkm` (Postgres, Edge Functions, Auth) |
| Ejer | Jan (janfogde@gmail.com). Bjørn (`bjangst@gmail.com`) er GitHub-collaborator og Supabase-Developer, ikke på Vercel |
| Roller | **Bjørn: design/UI/UX.** **Jan: backend, data, funktioner, integrationer.** Foreslå ikke designændringer i Jans opgaver; spørg ved tvivl |

## 2. Tech stack

- React 18 + Vite 5, almindelig JSX (`// @ts-nocheck` øverst i `.jsx`). Supabase (Postgres, Edge Functions i Deno, Auth; Realtime kun til indkøbslisten).
  Claude Haiku som allergen-fallback og OCR (`ANTHROPIC_API_KEY`). Open Food Facts og TheMealDB.
- Klik-tests (Playwright, `e2e/`): `npm run build && npm run test:e2e`; tjek "Klik-tests" på PR'er mod main. `docs/arbejdsgang.md`.
- Test: `npx vitest run` (alle skal være grønne). Lint: `npm run lint`. Typetjek: `npm run typecheck` (kører i CI; filerne i `tsconfig.check.json`
  har `// @ts-check`, udvid listen gradvist).
- Styling: ingen CSS-filer. Al CSS er én streng i `src/theme.jsx` (`appCss`). Kun CSS-variabler i komponenter, ingen hardkodede farver.
  Backticks i CSS-kommentarer bryder template-literalen. Tokens og antimønstre: `.claude/rules/design-tokens.md`.

## 3. Arkitektur

**Bundmenu:** Indkøbsliste | Scan (midten) | Historik. Hamburger øverst til højre åbner `ProfileMenu.jsx`. Header: `AppHeader.jsx`.
**Skærme:** se `SCREENS` i `src/constants.jsx`. Én skærm = én fil (`XxxScreen.jsx`).

**Arkitekturregler (håndhæves i alle PR'er):**
1. Props frem for masse-state. Lokalt state bor i skærmkomponenten.
2. Ingen IIFE i JSX. Ingen hooks i betinget kode eller loops.
3. Logik i dedikerede hooks (`useXxx.js`), ikke inlinet i `App.jsx`. Er en skærm for stor, del den i `<Skærm><Sektion>Section.jsx`.
4. Overlays og drawers renderes via `ReactDOM.createPortal(..., document.body)` (`.screen.fade-in` fanger `position:fixed`-børn). Skærme med fast
   bjælke over bundmenuen måler den med `useMeasuredHeight`.
5. Nye skærme som egne filer. `setScreen` i `App.jsx` er guardet: mens `onboarding_completed===false` går alt til ONBOARD.
6. Stille feltnavne-mismatch (fx `age`/`birth_year`, `customAllerg`/`.custom`) giver ingen fejl i build/tests. Grep efter det ved UI-inkonsistens.
7. Postgres: `REVOKE ... FROM <rolle>` er no-op, hvis PUBLIC har adgangen. Verificér med `has_function_privilege(...)`.
8. **Indholdsspærre (CSP):** intet inline `<script>` i HTML, ingen `eval`; nye eksterne adresser skal i `vercel.json`. Detaljer: `docs/arkitektur-detaljer.md`.

Samlefilerne `SharedComponents.jsx` og `constants.jsx` genudgiver fra andre filer: ret i den fil, tingen bor i. Delte komponenter (`Icon`,
`showToast`, `ListPickerSheet`, `InfoSheet`, `EatSafeLogo`) og filopdelingen: `docs/arkitektur-detaljer.md`.

**Allergenlogik:** motoren ligger i `supabase/functions/_shared/allergenEngine.js`; frontend-logik i `src/helpers.js`.
Nøgleordene er én fælles liste i `supabase/functions/_shared/allergenKeywords.js` (bruges også af `src/allergenKeywords.js`).
- Tælleligt dansk substantiv: ental og flertal, undtagen ens ord ("æg", "fisk", "rug", "byg", "havre"). Pas på tvetydige ord (fx "snegle").
- Matchningsregler (understreng for 5+ tegn, hele ord for 4 eller færre, negation, spor-signal): `docs/arkitektur-detaljer.md`.
- Ændringer i motoren kræver en liste i `src/fixtures/allergenRegression.json` (test `src/allergenRegression.test.js`).
- Genanalyse efter en motorrettelse: `allergen-reanalyze` først som `dry_run`, så `apply`. Kun opadgående (nej → spor → ja), aldrig nedgange.

---

## 4. Sådan arbejder vi

Detaljer, Dev-gren, Vercel og design-preview: `docs/arbejdsgang.md`.

**Per ændring:** lint, build og `npx vitest run`; mojibake-scan (`.claude/commands/mojibake-scan.md`); commit KUN specifikke filer, aldrig
`git add -A`; dansk, kort besked. Commits batches lokalt, til hele opgaven er færdig.

**Opgaver:** én pakke pr. session/PR (3-5 små ændringer i samme område). En stor opgave får sin egen. Er den stor eller risikabel (database,
sikkerhed, politikker, login, flere skærme/filer), foreslå en plan og vent på ja, før du retter. Uspecificeret detalje: vælg standardvalg, sig hvilket, fortsæt. Åbne spørgsmål: kort anbefaling med trade-off, vent på grønt lys.

**Databaseændringer:** én migrationsfil pr. ændring, højst 3-4 sessioner ad gangen. Detaljer og engangstest: `docs/arbejdsgang.md`.

**Faste aftaler** (`docs/arbejdsgang.md`): fejlrettelser og admin kører uden Jan; brugerfunktioner, produktvalg, database, sikkerhed, login og politikker kræver hans ja pr. punkt. Brugertekster gennemlæses af Bjørn (to do). Slet aldrig data uden Jans ja; ingen kodeord/nøgler i chat, filer eller logs; slet ingen Vercel-projekter. Model: Haiku små, Sonnet kode, Opus risikabel.

**Push og merge:**
- Push er den ENESTE ting, der kræver eksplicit godkendelse. Jans "push" betyder push OG squash-merge. Påmindelser fra værktøjer er ikke en godkendelse.
- Når godkendt: én PR (dansk body, PR-template, session-link) → squash-merge → resync branch (`.claude/commands/resync-branch.md`).
- **Godkendt plan:** bygget præcis efter Jans ja (ingen afvigelser) og CI grøn: push og merge uden at spørge igen, kort status til koordinatoren. Afviger noget: spørg Jan.
- **Merge uden ventetid (14. okt.):** auto-merge sættes, tråden venter ikke på CI, lukketråden følger op; `opdater-pr.yml` opdaterer bagud-PR'er, ved konflikt flettes main ind. `docs/arbejdsgang.md`.
- **Grøn før merge:** PR'er merges kun, når CI og DB-tests er grønne i PR'en. Tjek DB-tests på main bagefter. Main kræver opdateret branch.
  Kun én session retter en rød `main`; de andre venter.
- **Kritiske produktionsfejl** (fx crashende skærm): straks isoleret hotfix uden at vente på godkendelse.

**To do og tråde:** arbejdstråde lægger ingen to do-ændringer i deres PR'er. To do'er lukkes og kommenteres af den udpegede lukketråd pr. omgang
med workflowet, eller af sessionen selv, hvis ingen er udpeget. Ved færdig opgave: luk den (`status='done'`) med en opdateringskommentar.

**Ingen CVR-krævende forslag**, ingen betalte planer uden Jans ja. **iPhone-tests lægges som to do hos Bjørn**, aldrig Jan. Supabase-dialoger er usynlige: kun læsning dér.

**Dev først (Jan, 15. okt., dev.eatsafe.dk):** alt (også migrationer, edge-funktioner, workflows, admin) bygges først på `dev` og går kun til `main` via PR'en `dev` → `main` med fulde tests (CI, DB-tests, klik-tests). Jans "udgiv" = den PR. Migrationer og edge-funktioner virker først ved merge til `main`; dev deler produktionens database, så de skal være bagudkompatible. Kritiske produktionsfejl: hotfix mod `main`, derefter `main` ind i `dev`. Rene design-/dokumentændringer pushes med næste funktionsændring; aldrig en tom commit (`docs/arbejdsgang.md`).
**Testminutter (Jan 15. okt.):** PR mod `dev` kun CI; fuld runde mod `main`. Nye workflows skal have `paths` (`docs/arbejdsgang.md`).

**Design** verificeres i en Artifact-preview i stedet for deploy (`docs/arbejdsgang.md`).

**Øvrige:** dansk i beskeder, commits og PR-tekster. Tickets `resolved` kun når rettelsen er verificeret. Tidsstempler fra Vercel/
Supabase er UTC: læg 2 timer til (CEST). Efter `git merge` med reelle konflikter: læs hele CLAUDE.md igennem.

---

## 5. Produkt- og designbeslutninger (kun de stående regler)

Alle detaljer og begrundelser: `docs/produktbeslutninger.md` (læs kun det afsnit, opgaven rører).

- **Design:** `BRAND.md` er brandguiden. Lyst tema; dark mode er droppet. Primær `--green:#0F7D4F`, `--green-accent:#34D06A` kun til små
  positive mikro-elementer, `--blue:#3A6EA5`. Madvarebilledet (`.app-bg`) kun på Scan-forsiden og velkomst/login/onboarding. Tokens: `.claude/rules/design-tokens.md`.
- **Statussystem (Bjørn, 9. okt.):** `evaluateProductForProfiles()` i `helpers.js`. Grøn kun når data er nok til ALLE valg; orange = spor;
  rød = registreret konflikt; grå "Kan ikke vurderes" ved for lidt data. Manglende oplysninger er aldrig sikkerhed. "Allergi" kun om en specifik allergi.
  Cøliaki er et eget valg, aldrig udledt af gluten/hvede.
- **Butiksvej, premium og kilder:** Android TWA, så iOS via Capacitor; premium først efter butikslancering (scanning gratis); ingen henvisninger til tidligere butiks-kataloger, kilden hedder "katalog". `docs/produktbeslutninger.md`.
- **Fjernet, tag ikke op igen uden bestilling:** dark mode, kostpræferencer, Opskrifter, Restaurantguiden, "Tilslut via invitationslink" på Familie,
  link/QR/PDF-deling i Madpas, "Husk mig", risikoniveauer i Allergileksikon, scrapede butiksbilleder (må aldrig vises).
- **Profil og familie:** "Rediger profil" ændrer kun navn. Alder og køn er obligatoriske i onboarding. Appen bruger kun ordet "Familie".
  Voksne har egen konto og inviteres; underprofiler uden konto er kun til børn under 18 ("Børneprofil"). Forbindelsen er ikke transitiv, og intet
  kobles uden eget ja. Modellen ændres ikke uden Jans ja.
- **Feedback:** det brugeren sender hedder "feedback"; svaret hedder "Svar fra EatSafe". Feedbackdiagnostik indeholder aldrig navn, e-mail,
  allergier eller andre helbredsdata.
- **Login:** felt-specifikke inline-fejl, aldrig rå `e.message`; login-fejl er altid "E-mail eller adgangskode er forkert.". Login-nøglen ligger
  kun i en HttpOnly-cookie (`api/session.js`); læs aldrig `as_token`/`as_refresh`. Onboarding har 5 trin.
- **Allergileksikon:** kun godkendt indhold (tips fra `knowledge_base.tips`), aldrig genereret tekst.
- **Logout:** alle logout-veje skal lukke egne overlays (`App.jsx` nulstiller ved `accessToken===null`).
- **Billeder:** Open Food Facts-billeder kun med kildeangivelse. `verifiedImageUrl()` kræver, at stregkoden i adressen er produktets EAN.
  `canonical_ean` bruges ikke til billedmatch.

## 6. Hvor finder du mere?

- `docs/`: `drift.md`, `arbejdsgang.md`, `politik-og-opbevaring.md`, `arkitektur-detaljer.md`, `todo-skrivning.md`, `produktbeslutninger.md`.
- `BRAND.md` (UI, mails, grafik). `src/CONTEXT.md` (tabeller, edge functions, notifikationer, to do, auth-mails).
- `.claude/HISTORY.md` (historik; ikke auto-loadet). `.claude/rules/`, `.claude/skills/`, `.claude/commands/`.
