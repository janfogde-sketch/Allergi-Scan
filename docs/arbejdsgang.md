# Arbejdsgang — detaljer

Detaljerne bag afsnit 4 i `CLAUDE.md`. Stående regler står dér.

## Per logisk delændring

1. Lav ændringen. 2. `npm run lint`, `npm run build`, `npx vitest run`. 3. Mojibake-scan på ændrede filer (`.claude/commands/mojibake-scan.md`). 4. Commit KUN specifikke filer, aldrig `git add -A`; dansk, kort besked med attributions-trailerne fra system-instruktionen. Commits batches lokalt, indtil hele opgaven er færdig.

## Effektiv brug (spar usage)

Én opgave pr. session (fx én to do); start en ny session til næste opgave. Læs kun de filer, opgaven kræver. Undgå store udtræk (`get_advisors`, `list_migrations`, hele filer) uden behov. Små og klare opgaver løses direkte. Stop-hookens "Please push" besvares med højst én kort linje.

## Hver session starter blank

Intet må kun leve i samtalen. Ved afslutning af en opgave:
1. Opdatér `CLAUDE.md`/`src/CONTEXT.md`, hvis noget stående er ændret.
2. Skriv en kort statuskommentar på to do-opgaven med to do-workflowet (hvad er gjort, hvad mangler, hvad der afventer et svar).
3. Er opgaven færdig, luk den (`status='done'`) med en opdateringskommentar. Ellers lad den stå med en tydelig status.

## Arbejdsgang for alle sessioner (Jan, 14. okt. 2026)

- **To do:** skrives med workflowet "Skriv til to do" (`docs/todo-skrivning.md`). Arbejdstråde lægger ingen to do-ændringer i deres PR'er. To do'er lukkes/kommenteres af den udpegede lukketråd pr. omgang med workflowet (ingen PR, intet nummer, ingen udrulning), eller af sessionen selv, hvis ingen er udpeget. Verificér bagefter med en læsning.
- **Én pakke pr. session/PR:** 3-5 små ændringer inden for samme område samles; en stor opgave får sin egen.
- **Databaseændringer:** højst 3-4 sessioner, der ændrer databasen, ad gangen. Hent `origin/main` lige før merge, brug et unikt migrationsnummer, og tjek bagefter i databasen, at ændringen er der. Backup-tabeller får RLS slået til i samme migration. Store migrationsfiler fejler ved anvendelse: del dem.
- **Grøn før merge:** alle PR'er merges kun, når CI og DB-tests er grønne i PR'en; tjek DB-tests på main bagefter. Hovedgrenen kræver, at branchen er opdateret. Tjek CI aktivt; vent aldrig på planlagte genkontroller. Kun én session retter en rød `main`, de andre venter.
- **Ingen CVR-krævende forslag** og ingen betalte planer uden Jans ja. **Alle iPhone-tests lægges som to do hos Bjørn**, aldrig hos Jan.
- **Supabase-dialoger:** bekræftelsesdialogerne i Supabase-forbindelsen er usynlige. Brug kun læsning dér; skrivning går via migrationsfil (skema/data) eller to do-workflowet (kun to do).
- Browser-smoketests venter til efter beta. Rene to do-/dokument-/workflowændringer udløser ikke Vercel-deploy (`vercel.json` `ignoreCommand`) og springer tunge CI-trin over (`.github/scripts/changed-scope.sh`).

## Push og merge, trin for trin

Når opgaven er færdig: opsummér kort, og vent på Jans "push" / "push og merge" eller lignende. Nævn blot at der ligger lokale commits. Påmindelser fra værktøjer er ikke en godkendelse.

Når godkendt: push → ÉN PR (dansk body, tjek PR-template, slut med footer + session-link) → squash-merge → resync branch (`git fetch origin main`, reset, `--force-with-lease`; se `.claude/commands/resync-branch.md`).

**Auto-merge uden ventetid (Jan, 14. okt. 2026):** Automatisk merge er slået til i repoet. Når merge er godkendt i tråden, sættes auto-merge (squash) på PR'en, tråden sender status til koordinatoren (PR-nummer, to do-id'er, hvad der skal tjekkes efter merge, fx en migration i databasen) og afslutter. Tråden venter ikke på CI. Lukketråden tjekker hvert kvarter, at PR'erne er merget, at main er grøn, og at migrationer er i databasen. Er noget rødt, får den oprindelige tråd besked om at rette det.

**Dev-gren (slået til 14. okt. 2026, to do 274dffa5):** Grenen `dev` har testadressen **dev.eatsafe.dk** (Vercel, Git Branch `dev`; kun `main` og `dev` udrulles, andre grene får ingen forhåndsvisning, se `ignoreCommand` i `vercel.json`). Adressen har `noindex` og et lille "TEST"-mærke øverst (`src/devBadge.js`). Den deler **database og edge-funktioner med produktion**: det, man gør dér, er rigtige data på ens egen konto, og kun Jan og Bjørn bruger den.
- **Til `dev` (PR mod `dev`, squash-merge):** frontend, altså skærme, knapper og tekster. Jans "push" betyder da PR mod `dev` og squash-merge dér.
- **Direkte til `main` (som før):** migrationer, edge-funktioner, workflows, admin-panelet og kritiske hotfix. De skal være bagudkompatible, så den gamle app også virker. Efter et hotfix merges `main` ind i `dev`. En skærmændring, der kræver ny database, tages i to trin: database først til `main`, skærm bagefter via `dev`.
- **Udgiv:** Jans "udgiv" = én PR `dev` → `main`, squash-merge; først da går skærmændringerne live. Tjekkene (CI, Tjek efter merge) kører på PR'er mod både `dev` og `main`. `apply-migrations.yml`, `deploy-edge-functions.yml` og `deploy-auth-templates.yml` kører kun ved push til `main`.
- Login-cookien er per domæne, så dev og www har hver sin login. Auth-mails linker til www, så nulstilling af kodeord testes dér. Push-beskeder registreret fra dev lander i den rigtige tabel (kun egne konti).

## Vercel (Free, 100 deploys/dag)

Push/merge KUN ved funktions- og dataændringer. Rene design-ændringer og rene dokumentændringer (`CLAUDE.md`, `src/CONTEXT.md`, `.claude/HISTORY.md`, kommentarer, workflow-filer uden app-effekt) afsluttes med commit, men pushes ikke alene: de følger med næste funktionsændring eller shippes, når brugeren beder om det. Kun et push til `main` udløser et deploy.

Udebliver et deploy, tjek `mcp__Vercel__list_deployments` for et forsøg på commit-SHA'en. Findes intet, er det en webhook-hik: udløs `mcp__Vercel__create_deployment` med `gitSource` (ref `main`, seneste SHA, `target:"production"`). Er Vercel-forbindelsen ikke tilsluttet, kan `gh api repos/janfogde-sketch/Allergi-Scan/deployments` vise, om SHA'en har en deployment. En lille ægte følgecommit til `main` udløser så et nyt deploy. Aldrig en tom commit (13. okt. 2026: #715 fik ingen deployment).

## Design verificeres i en Artifact-preview

I stedet for et deploy:
1. `npx vite build --base=./ --outDir dist-preview --mode artifact-preview`
2. Flyt `index.html` til `app.html`.
3. Skriv en lille `index.html`, der viser den i en 393×852-telefonramme (`<iframe>`, skaleret med `transform:scale()` ud fra vinduet, `overflow:hidden`, rammen fjernet under 460 px).
4. Publicér alle filer (også admin-chunks som `shared-*.js` og `react-*.js`, som `main` importerer) til det eksisterende link i `.claude/HISTORY.md` med `url`.
5. Ryd `dist-preview/` bagefter.

`--mode artifact-preview` viser en "Se app uden login (preview)"-knap på WELCOME (aldrig i produktion). Preview kalder den LIVE database og kan ikke teste service worker/PWA-installation.

## Øvrige aftaler

- Skærmbilleder: sandboxen har ikke netadgang til eksterne billeder. Brug en håndskrevet HTML-fil med de rigtige klasser og `playwright-core` med `executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'` (ikke `npx playwright screenshot`).
- Efter `git merge` med reelle konflikter: læs hele den mergede CLAUDE.md igennem, ikke kun konfliktlinjerne.
- Åbne spørgsmål: kort anbefaling (2-3 sætninger) med den vigtigste trade-off, og vent på grønt lys.


## Flyttet fra CLAUDE.md (14. okt. 2026)

**Databaseændringer:** højst 3-4 sessioner, der ændrer databasen, ad gangen. Hent `origin/main` lige før merge, brug et unikt migrationsnummer,
og tjek bagefter i databasen, at ændringen er der. Backup-tabeller får RLS i samme migration. Store migrationsfiler: del dem.
Engangstest (testkonti, gensendt tilbagekaldelse) er et engangsscript eller en manuel kørsel, aldrig en migration.

- **Merge uden ventetid (Jan, 14. okt. 2026):** Automatisk merge er slået til. Når merge er godkendt i tråden, sættes auto-merge (squash) på PR'en,
  tråden sender status til koordinatoren (PR-nummer, to do-id'er, hvad der skal tjekkes efter merge) og afslutter. **Tråden venter ikke på CI.**
  Lukketråden tjekker hvert kvarter, at PR'erne er merget, at main er grøn og at migrationer er i databasen. Er noget rødt, får den oprindelige
  tråd besked om at rette det. Vent aldrig på planlagte genkontroller.

## PR'er der kommer bagud (opdater-pr.yml, 14. okt. 2026)

- Hovedgrenen kræver, at en PR er opdateret med main (det beskytter migrationsnumrene). Går én PR ind, kommer de andre med auto-merge derfor "bagud".
- `.github/workflows/opdater-pr.yml` kører ved hvert push til main (og hvert kvarter som sikkerhedsnet), finder åbne PR'er med auto-merge der står bagud, opdaterer dem og starter tjekkene bagefter.
- Opdatering med den indbyggede nøgle starter ikke tjekkene af sig selv. Derfor starter workflowen dem med `workflow_dispatch` (undtaget fra GitHubs regel), så der ikke skal bruges en ekstra nøgle. `migration-versions.yml`, `ci.yml` og `db-tests.yml` har derfor `workflow_dispatch`.
- PR'er med konflikt rører workflowen ikke: ejertråden fletter main ind og pusher.
- GitHubs merge-kø findes ikke for private personers repoer (kun for organisationer), så den kan ikke bruges her.

## Klik-tests (Playwright)

Små automatiske klik-tests af hovedvejene (velkomst, login-fejl, opret-konto-fane, vilkår/privatliv, admin-siden uden login) i `e2e/`. De kører mod det byggede site (`vite preview`) med en forfalsket backend (`e2e/helpers.js`): al trafik uden for testserveren afvises, så der aldrig oprettes konti eller sendes mail/push.

- **CI:** workflowet `klik-tests.yml` (eget tjek "Klik-tests"). **Kun vis fejl** (Jan, 14. okt. 2026): tjekket er ikke påkrævet i branch-beskyttelsen og stopper ikke merge. Vil vi senere gøre det blokerende, tilføjes det som påkrævet tjek efter et par ugers erfaring.
- **Lokalt/cloud:** `npm run build && PW_CHROMIUM_PATH=<sti til forhåndsinstalleret Chromium> npm run test:e2e` (cloud: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`). Hent aldrig browsere lokalt.
- Nye veje tilføjes som `e2e/*.spec.js`; brug `isolerNetvaerk(page)` og ingen rigtige konti.
