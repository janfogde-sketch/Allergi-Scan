# EatSafe (Allergi-Scan) — projektkontekst for Claude

> Læses automatisk ved hver session i dette repo, uanset hvem der starter den (Jan eller Bjørn).
> Hold den KORT: den indlæses hver gang. Kun nutidstilstand og stående regler hører hjemme her.
> Historik, begrundelser og skærm-for-skærm-detaljer ligger i `.claude/HISTORY.md` (læses kun ved behov),
> database/edge-function-reference i `src/CONTEXT.md`. Opdatér denne fil i samme PR ved større ændringer.

---

## 0. Start her

- **To do-listen** (admin-panelet, fanen To do, tabellen `admin_todos`, se `src/CONTEXT.md` §10). Starter sessionen med en konkret
  opgave (et to do-id), så læs kun den opgave (og dens kommentarer), og gå i gang; læs ikke hele listen. Starter den uden opgave:
  `select title, status, priority, track, due_date from admin_todos where status <> 'done'`, nævn de åbne punkter kort, og spørg hvad
  der skal tages først. Afslut punkter (`status='done'`) og opret nye. **Skriv til to do-listen via en migrationsfil** (`update admin_todos ...` plus `insert into admin_todo_comments (todo_id, body) ...` i `supabase/migrations/`, Jan 8. okt. 2026), aldrig med `execute_sql`: dialogen er usynlig for Jan og kaldet hænger. Tickets ligger også på listen (status følger begge veje).
- **Databaseændringer** skrives som fil i `supabase/migrations/` (version = tidsstempel) og anvendes automatisk af workflowet `apply-migrations.yml`
  ved merge til main (Jans "push"). Brug ikke `apply_migration`/`execute_sql` til skrivning (dialogen er usynlig for Jan); læsning er fint. Se `supabase/migrations/README.md`. Edge-funktioner deployes ved merge af `.github/workflows/deploy-edge-functions.yml`
  (secret `SUPABASE_ACCESS_TOKEN`; 401/403 = ny adgangsnøgle, udløber). `supabase/config.toml` har `verify_jwt` pr. funktion.
- **Supabase Pro er sat på pause (Jans beslutning):** backups, testmiljø og Leaked Password Protection venter. Spørg ikke, om det
  er glemt, kun om han vil opgradere. **Vercel skal skifte til Pro, før vi går live** (Vercels DPA gælder kun Pro/Enterprise; to do på listen).
- **Testrunden på rigtige telefoner** (kamera, push, installation, to konti) er sat på pause; tjeklisten er
  https://claude.ai/artifact/1YwwF252KhrCAWrgSssw1X, resultater i dens database (`results`). Opret tickets for `fail`.
- **Netværk:** cloud-miljøet når eatsafe.dk, www.eatsafe.dk, Supabase og world.openfoodfacts.org. Admin-test kræver en testkonto med
  admin-rolle: opret den kun efter Jans ja. Testmail/push sendes kun til Jans/Bjørns egne konti.
- **Login/mail:** egen SMTP via Resend (`noreply@eatsafe.dk`), "Confirm email" er slået til, og Send Email Hook (`auth-send-email`)
  sender alle auth-mails med skabelonerne i `supabase/templates/auth/` (se `src/CONTEXT.md` §11). Der findes kun én velkomstmail
  (`supabase/templates/resend/N1-velkomst.html`, type `welcome_onboarded`, sendt efter onboarding). Alle 29 mailskabeloner (inkl. N9 familieinvitation, sendt direkte af `family-invite`) deler
  mørk palette (`supabase/templates/resend/README.md`, test `src/mailDarkMode.test.js`); ændr den i alle samtidig.
  `deploy-auth-templates.yml` kører kun manuelt (tilbagerulning). `RESEND_API_KEY` findes kun som edge-secret, ikke i Vault.
- **Adgangskode:** mindst 10 tegn plus lille bogstav, stort bogstav og tal (`passwordErrorText()`/`PASSWORD_REQUIREMENTS_TEXT` i
  `helpers.js`). Ændres kravene i Supabase, ret `helpers.js` tilsvarende.
- **Notifikationer** er live (push og mail slået til via `app_flags`; beskeder i appen påvirkes ikke af flagene). Detaljer, test-
  plan og rollback i `src/CONTEXT.md` §9 og `docs/notifikationer-testplan.md`.
- **Admin-panel:** `eatsafe.dk/admin.html`, eget Vite-entry (`src/admin/`), rører ikke den mobile PWA's bundle; responsivt (kort på mobil, tabel på desktop; `useIsMobile`, `statusTone.js`). Adminrettigheder håndhæves i databasen (RLS med `is_admin`) og i edge-funktionerne, `admin.html` er kun en klientport. Ny følsom admin-handling: tilføj en audit-trigger (`admin_audit_log`, 12 mdr.). Admin-udseendet er frosset til efter beta (kun fejl rettes). Alle detaljer (To do, Dashboard, Indsendelser, aktivitetslog): `docs/produktbeslutninger.md` og `docs/admin-statusser.md`; reference i `src/CONTEXT.md` §2 og §10.
---

## 0b. Politikker og opbevaring (stående regler, Jan 2. okt. 2026)

- **Tjek politikkerne mod appen i et naturligt interval.** Vilkår og privatlivspolitik skal følge appen. **Teksten bor ét sted** (`src/legalText/terms.js`/`privacy.js`); skærmene læser den, og `public/terms.html`/`privacy.html` genereres med `node scripts/build-legal-pages.mjs` (test `src/legalText.test.js` fejler ved afvigelse). Ret aldrig HTML-filerne i hånden. (a) Ved hver funktions- eller dataændring,
  der rører personoplysninger (nye felter/tabeller, leverandører, notifikationstyper, lagring, login-metoder, AI-brug, opbevaring): tjek og
  ret teksterne i samme PR, og sæt "Sidst opdateret". (b) Ved sessionstart: har den tilbagevendende to do "Gennemgå politikker mod
  appændringer" overskredet sin frist, så gennemgå `git log` siden sidste gennemgang mod teksterne, opret fund som to do, luk opgaven og
  opret en ny med frist om en måned. (c) Skriv teksterne generelt (kategorier og formål, ikke enkelte beskedtyper), så almindelige tilføjelser
  ikke kræver ny tekst. Åbne juridiske punkter står i de to tickets "[Brugsvilkår · IKKE FÆRDIGE]"/"[Privatlivspolitik · IKKE FÆRDIG]", aldrig i
  den offentlige tekst. Væsentlige ændringer skal meddeles brugerne på passende måde (Jan beslutter hvordan).
- **Opbevaringsfrister overholdes, som loven foreskriver (GDPR: ikke længere end nødvendigt).** Frister står i privatlivspolitikkens afsnit 11 og
  i `src/CONTEXT.md` §3 og skal også være det, databasen faktisk gør. Ny tabel/kolonne med personoplysninger: definér frist, sørg for sletning ved
  kontosletning (`delete-user` eller cascade) og automatisk oprydning (`cleanup_notifications()`, dagligt kl. 03:30 UTC), og opdatér politikken. **DB-testen `supabase/tests/account_deletion.sql` (workflow `db-tests.yml`) fejler, hvis en kolonne med brugerdata ikke står på dens "dækket"-liste: tilføj sletning/oprydning først, derefter listen.**
  Samtykke til helbredsdata (art. 9) gives særskilt og logges i `consent_log`; **ændres samtykketeksten eller politikken væsentligt, hæves `HEALTH_CONSENT_VERSION` (`constants.jsx`) og `policyUpdated` i `healthConsent.test.js`, og alle bliver bedt om at bekræfte på ny ved næste appåbning (`ConsentRenewalModal.jsx`, Jan 13. okt. 2026)** (RPC `give_health_consent`/`withdraw_health_consent`; se `src/CONTEXT.md` §3); tilbagetrækning sletter helbredsdata. Nuværende frister: kontodata slettes straks ved kontosletning; scanningshistorik 24 mdr.; inaktiv konto (36 mdr. uden aktivitet) slettes 30 dage efter en advarselsmail (`inactive-accounts`, dagligt 04:10 UTC, `inactive_accounts()`); beskeder 12 mdr.; notifikationshændelser og fejllogs 90 dage; sikkerhedsindberetninger 12 mdr.; invitationens `invitee_email` slettes ved svar/udløb (højst ca. 48 t).

---

## 1. Hvad er EatSafe?

Dansk PWA til mennesker med fødevareallergier/-intolerancer. Brugeren scanner en stregkode (eller søger), appen matcher
ingredienserne mod brugerens (og evt. familiens) profil og viser et klart sikkert/farligt/usikkert-signal med begrundelse,
sikre alternativer og indkøbsliste.

| Nøgle | Værdi |
|---|---|
| Live URL | https://www.eatsafe.dk (fast adresse; eatsafe.dk giver 307 hertil. Links, mails og TWA bruger altid www) |
| GitHub | `janfogde-sketch/Allergi-Scan` |
| Branches | `main` (produktion) · udviklingsgrene `claude/...` |
| Hosting | Vercel — auto-deploy på push til `main` (preview-deploys er slået fra) |
| Backend | Supabase (projekt `jegrpcflyguadyxialkm`) — Postgres, Edge Functions, Auth |
| Ejer/admin | janfogde@gmail.com |
| Team | `bjangst@gmail.com` (Bjørn) er GitHub-collaborator og Supabase-Developer, **ikke** på Vercel (Hobby = én bruger); kodeændringer sker via GitHub |
| Roller | **Bjørn ejer design/UI/UX** (farver, layout, komponenter, animation). **Jan tager backend** (Supabase, data, funktioner, integrationer). Foreslå ikke designændringer på eget initiativ ved Jans opgaver; spørg ved tvivl om hvis spor noget hører under |

## 2. Tech stack

- React 18 + Vite 5, almindelig JSX (`// @ts-nocheck` øverst i alle `.jsx`), Supabase (Postgres, Edge Functions i Deno, Auth,
  Realtime kun til indkøbslisten), Claude Haiku som allergen-fallback + OCR (`ANTHROPIC_API_KEY`), Open Food Facts, TheMealDB.
- Test: `npx vitest run` (alle skal være grønne). Lint: `npm run lint`. Typetjek: `npm run typecheck` (kører i CI; kun filerne i `tsconfig.check.json` har `// @ts-check`, resten `// @ts-nocheck`; udvid listen gradvist: ret filens header, tilføj den i `include`, ret fejlene).
- Styling: ingen CSS-filer. Al CSS er én streng i `src/theme.jsx` (`appCss`). Kun CSS-variabler i komponenter, ingen hardkodede
  farver. Backticks i CSS-kommentarer bryder template-literalen. Tokens og antimønstre: `.claude/rules/design-tokens.md`.

## 3. Arkitektur

**Bundmenu:** Indkøbsliste | Scan (midten) | Historik. Øverst til højre et hamburger-ikon (tre streger) der åbner `ProfileMenu.jsx`
(profil-hero → `SCREENS.PROFILE`, Favoritter, Familie, Scanningshistorik, Allergileksikon, Madpas, Indstillinger, Admin hvis
admin). Header: `AppHeader.jsx` med ren tekst-wordmark.

**Skærme:** se `SCREENS` i `src/constants.jsx`. Én screen = én fil (`XxxScreen.jsx`). Vigtigste: HOME (`ScannerScreen.jsx`, også en
intern router), RESULT, LIST, PROFILE/EDITPROFILE (kun navn)/EDITPREFERENCES, FAMILY, FAVORITES, HISTORY, MADPAS, KNOWLEDGE,
SETTINGS, NOTIFICATIONS/NOTIFICATION/TICKET, WELCOME/LOGIN/VERIFYEMAIL/RESETPASSWORD/ONBOARD/BOOT, NOTFOUND/SUBMITTED, SUGGEST_EDIT,
TERMS/PRIVACY.

**Arkitekturregler (håndhæves i alle PR'er):**
1. Props frem for masse-state; lokalt state lever i screen-komponenten.
2. Ingen IIFE i JSX. Ingen hooks i betinget kode eller loops.
3. Logik i dedikerede hooks (`useXxx.js`), ikke inlinet i `App.jsx`. Er en skærm for stor, del den i `<Skærm><Sektion>Section.jsx`
   (hovedfilen beholder kun routing/fane-state), som web-adminen i `src/admin/` er delt.
4. Overlays/drawers renderes via `ReactDOM.createPortal(..., document.body)`: `.screen.fade-in` efterlader en permanent
   `transform`, som fanger `position:fixed`-børn (brugt i `ListPickerSheet`, `InfoSheet`, `ProfileMenu`).
   Bundnavigationen er ca. 113 px høj på iPhones med hjemmeindikator (79 px uden), men `.screen` har kun 110 px bundpadding. Skærme med fast
   bjælke over navigationen (fx "Gem ændringer" i `EditPreferencesScreen.jsx`) måler derfor navigationen med `useMeasuredHeight` og sætter selv bundpadding.
5. Nye skærme som egne filer. `setScreen` i `App.jsx` er guardet: mens `user.onboarding_completed===false` omdirigeres alt
   uden for WELCOME/LOGIN/ONBOARD til ONBOARD.
6. En stille feltnavne-mismatch (kolonne/prop brugt ét sted, aldrig matchet andre steder: `age`/`birth_year`, `customAllerg`/
   `.custom`, ikke-eksisterende `Icon name`) giver ingen fejl i build/tests. Grep efter den slags ved "tekst-/UI-inkonsistens".
8. **Indholdsspærre (CSP, 8. okt. 2026):** `vercel.json` sætter Content-Security-Policy m.fl. på alle sider. Kun egne scripts (`script-src 'self'`): intet indlejret `<script>` i HTML (læg koden i `public/js/`), ingen `eval`. Nye eksterne adresser (billeder, API, fonte) skal tilføjes i spærren, ellers blokeres de; `src/securityHeaders.test.js` vogter den. Service workeren sender kun egne adresser igennem.
7. Postgres: `REVOKE EXECUTE ... FROM <rolle>` er en no-op, hvis PUBLIC har adgangen. Verificér med
   `has_function_privilege(rolle, funktion, 'EXECUTE')`.

**Store filer er delt op (8. okt. 2026, ren omflytning):** `SharedComponents.jsx` og `constants.jsx` er samlefiler, der genudgiver fra `Icons`/`Sheets`/`ProductParts`/`ToastAndMisc`/`EatSafeLogo`/`IngredientsList` og `src/data/`; ret i den fil, tingen bor i, import stadig fra samlefilen. App.jsx har udbydere (`AppProviders`), context-værdier (`useAppContextValues`), `BottomNav`; Onboarding-, Result- og Scanner-skærmene er delt i `OnboardingStep1-5`/`Welcome`/`Login`, `ResultSections` og `ScannerHome`/`ScannerParts`, som får skærmens lokale tilstand som `ctx`.

**Delte komponenter (`SharedComponents.jsx`):** `Icon` (ét SVG-bibliotek; ingen emoji i UI-chrome, kun indholds-emoji som
allergen-glyffer; tilføj nye ikoner her), `showToast(msg, "success"|"error")` + `<ToastHost/>` (brug ikke native `alert()` til
beskeder), `ListPickerSheet`, `InfoSheet` (bottom-sheet til info-ikoner), `EatSafeLogo` (varianter horizontal/symbol, bruges på
velkomst/login/onboarding/admin; header bruger tekst-wordmark). `productDisplayName()` i `helpers.js`.

**Allergenlogik:** motoren bor i `supabase/functions/_shared/allergenEngine.js` (test `src/allergenEngine.test.js`); frontend-
logik i `src/helpers.js` (`compareAllergens`, `computeProfileResults`, `categorizeProductFindings`, `computeTopStatus`).
**Stående regel for nøgleordslister** (én fælles liste i `supabase/functions/_shared/allergenKeywords.js`, brugt af både motoren og `src/allergenKeywords.js`):
hvert tælleligt dansk substantiv skal have både ental og flertal ("hasselnød"+"hasselnødder"), undtagen ord hvor de er ens
("æg", "fisk", "rug", "byg", "havre"). Pas på tvetydige ord (fx "snegle"). **Matchning (6. okt. 2026):** nøgleord på 5 tegn eller mere matches som
understreng (fanger "FuldkornsHVEDE", "Mandelflager"); undtagelser står i `NO_SUBSTRING`, og ord der ikke må matche (boghvede, kanelsnegl, kokosfløde) fjernes i
`normalizeIngredientText`. Ord på højst 4 tegn matcher som hele ord, med eksplicitte sammensætningsregler i `SHORT_PATTERNS`. Negation gælder kun inden for samme kommasegment,
spor-signalet ("kan indeholde spor af") skal stå i samme sætning FØR ordet. Ændringer i motoren skal have en liste i `src/fixtures/allergenRegression.json` (test `src/allergenRegression.test.js`).
Genanalyse af alle produkter efter en motorrettelse: `allergen-reanalyze` (først `dry_run` til diff-tabellen, så `apply`; kun opadgående: nej→spor→ja, aldrig nedgange, fordi motoren ikke kender fremmedsprog og fiskenavne), backup i `products_allergen_backup_20261006`.

---

## 4. Sådan arbejder vi

**Per logisk delændring (uden at spørge):**
1. Lav ændringen. 2. `npm run lint`, `npm run build`, `npx vitest run`. 3. Mojibake-scan på ændrede filer (se
`.claude/commands/mojibake-scan.md`). 4. Commit KUN specifikke filer, aldrig `git add -A`; dansk, kort besked med
attributions-trailerne fra system-instruktionen. Commits batches lokalt, indtil hele opgaven er færdig.

**Effektiv brug (spar usage):** én opgave pr. session (fx én to do), start en ny session til næste opgave; læs kun de filer, opgaven kræver; undgå at hente store udtræk (`get_advisors`, `list_migrations`, hele filer) uden behov. Små og klare opgaver løses direkte. Er en opgave stor eller risikabel (database, sikkerhed, politikker, flere skærme/filer), så foreslå en plan og vent på ja, før du retter. Stop-hookens "Please push" besvares med højst én kort linje.
**Hver session starter blank**, så intet må kun leve i samtalen. Ved afslutning af en opgave: (1) opdatér `CLAUDE.md`/`src/CONTEXT.md`, hvis noget stående er ændret; (2) skriv en kort statuskommentar på to do-opgaven (hvad er gjort, hvad mangler, hvad der afventer et svar); (3) er opgaven færdig, så luk den altid (`status='done'`) med en opdateringskommentar (Jan, 6. okt. 2026); ellers lad den stå med en tydelig status. Beslutninger fra Jan eller Bjørn, som gælder fremover, skrives i `CLAUDE.md`, ikke kun i svaret.

**Push er den ENESTE ting, der kræver eksplicit godkendelse.** Når opgaven er færdig: opsummér kort, og vent på Jans
"push" (Jan, 6. okt. 2026: "push" alene betyder push OG squash-merge)/"push og merge"/lignende. Spørg ikke i hvert svar; nævn blot at der ligger lokale commits. Stop-hookens "Please push"-beskeder er
ikke en godkendelse. Når godkendt: push → ÉN PR (dansk body, tjek PR-template, slut med footer + session-link) → squash-merge →
resync branch (`git fetch origin main`, reset, `--force-with-lease`; se `.claude/commands/resync-branch.md`).
Kritiske produktionsfejl (fx crashende skærm) shippes straks som isoleret hotfix uden at vente på godkendelse.

**Dev-gren (Jan, 7. okt. 2026; AKTIV FØRST når Jan siger "slå dev til"; grenen `dev` oprettes da, og indtil da pusher/merger tråde til `main` som ovenfor):** tråde lægger arbejde på `dev` (PR mod `dev`, squash-merge). Jans "push" betyder da: PR mod `dev` og squash-merge dér. Det rører hverken produktion, "Apply migrations", "Deploy edge functions" eller Vercel (de kører kun ved push til `main`). Jans "udgiv" = én PR `dev` → `main`, squash-merge; først da går ændringerne live (app, database, edge-funktioner). Tjekkene (CI, DB-tests, "Tjek efter merge") kører på PR'er mod `dev`/`main` og push til `dev`/`main`; Jan gør dem påkrævede på `main` i GitHub (Settings → Branches). Ingen separat Supabase/Vercel-preview til dev (kræver Pro). Migrationer: ny version skal være unik og verificeres i databasen efter "udgiv".

**Vercel (Free, 100 deploys/dag): push/merge KUN ved funktions- og dataændringer.** Rene design-ændringer og rene dokument-
ændringer (`CLAUDE.md`, `src/CONTEXT.md`, `.claude/HISTORY.md`, kommentarer, workflow-filer uden app-effekt) afsluttes med commit,
men pushes ikke alene: de følger med næste funktionsændring eller shippes, når brugeren beder om det. Kun et push til `main`
udløser et deploy. Udebliver et deploy, tjek `mcp__Vercel__list_deployments` for et forsøg på commit-SHA'en; findes intet, er det
en webhook-hik: udløs `mcp__Vercel__create_deployment` med `gitSource` (ref `main`, seneste SHA, `target:"production"`). Er Vercel-forbindelsen ikke tilsluttet, kan `gh api repos/janfogde-sketch/Allergi-Scan/deployments` vise, om SHA'en har en deployment, og en lille ægte følgecommit til `main` udløser et nyt deploy (13. okt. 2026: #715 fik ingen deployment; aldrig en tom commit).

**Design verificeres i en Artifact-preview** i stedet for et deploy: `npx vite build --base=./ --outDir dist-preview --mode
artifact-preview`; flyt `index.html` til `app.html`; skriv en lille `index.html` der viser den i en 393×852-telefonramme
(`<iframe>`, skaleret med `transform:scale()` ud fra vinduet, `overflow:hidden`, rammen fjernet under 460 px); publicér alle filer
(også admin-chunks som `shared-*.js` og `react-*.js`, som `main` importerer) til det eksisterende link i `.claude/HISTORY.md` med `url`; ryd
`dist-preview/` bagefter. `--mode artifact-preview` viser en "Se app uden login (preview)"-knap på WELCOME (aldrig i produktion).
Preview kalder den LIVE database og kan ikke teste service worker/PWA-installation.

**Øvrige aftaler**
- Dansk i beskeder, commits og PR-tekster. Korte, konkrete svar; handling frem for lange forklaringer. Ved åbne spørgsmål: kort
  anbefaling (2-3 sætninger) med den vigtigste trade-off, og vent på grønt lys.
- Tickets (`feedback_tickets`) markeres kun `resolved`, når rettelsen er verificeret. Sikkerhedsfund rettes proaktivt.
- Vercel-/Supabase-tidsstempler er UTC: læg 2 timer til (CEST) og nævn dansk tid.
- Skærmbilleder: sandboxen har ikke netadgang til eksterne billeder. Brug en håndskrevet HTML-fil med de rigtige klasser og
  `playwright-core` med `executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'` (ikke `npx playwright screenshot`).
- Efter `git merge` med reelle konflikter: læs hele den mergede CLAUDE.md igennem, ikke kun konfliktlinjerne.

---

## 5. Produkt- og designbeslutninger (kun de stående regler)

**Alle detaljer, begrundelser og skærm-for-skærm-beslutninger: `docs/produktbeslutninger.md` (læs kun det afsnit, opgaven rører).** Reglerne her gælder altid:

- **Design:** `BRAND.md` er brandguiden (app, admin, `public/*.html`, mails, butiksbilleder skal være ens). Lyst tema, dark mode er droppet. Primær `--green:#0F7D4F`, `--green-accent:#34D06A` kun til små positive mikro-elementer, `--blue:#3A6EA5`; tokens i `.claude/rules/design-tokens.md`. Madvarebilledet (`.app-bg`) kun på Scan-forsiden og velkomst/login/onboarding/bekræft e-mail; alle andre skærme har hvid baggrund (`app-bg-hide`). Delte kort-/knap-klasser uden `box-shadow` ser flade ud (brug `--sh2`/`--sh` bevidst).
- **Statussystem (Bjørn, 9. okt.):** `STATUS_TEXT`/`evaluateProductForProfiles()` i `helpers.js` bruges overalt. Grøn kun når data er tilstrækkelige til ALLE valg; orange = spor; rød = registreret konflikt (også E-numre og egne allergier); grå "Kan ikke vurderes" ved for lidt data. Manglende oplysninger er aldrig sikkerhed, og en vare uden produkt får aldrig grøn. "Allergi" bruges kun om en specifik allergi; ellers "profil", "konflikt", "spor". Spor er gule/orange, kun direkte indhold er rødt. Cøliaki er et eget valg, aldrig udledt af gluten/hvede.
- **Fjernet, tag ikke op igen uden bestilling:** dark mode, kostpræferencer (diæter), Opskrifter, Restaurantguiden, "Tilslut via invitationslink" på Familie-siden, link/QR/PDF-deling i Madpas, "Husk mig", risikoniveauer i Allergileksikon, billeder fra nemlig/Bilka (må aldrig vises).
- **Profil/familie:** "Rediger profil" ændrer kun navn. Alder og køn er obligatoriske i onboarding. Appen bruger kun ordet "Familie". Voksne har egen konto og inviteres; underprofiler uden konto er kun til børn under 18 ("Børneprofil"). Forbindelsen er ikke transitiv, og intet kobles uden eget ja. Ændr ikke modellen uden Jans ja.
- **Feedback:** det brugeren sender hedder altid "feedback"; svaret hedder "Svar fra EatSafe". Feedbackdiagnostik indeholder aldrig navn, e-mail, allergier eller andre helbredsdata.
- **Login:** felt-specifikke inline-fejl, aldrig rå `e.message`; login-fejl er altid "E-mail eller adgangskode er forkert."; den lange login-nøgle ligger kun i en HttpOnly-cookie (`api/session.js`); læs aldrig `as_token`/`as_refresh`. Onboarding har 5 trin, og kun `onboarding_completed=true` slipper ud af den.
- **Allergileksikon:** kun godkendt indhold (tips fra `knowledge_base.tips`, aldrig genereret tekst).
- **Logout:** alle logout-veje skal lukke egne overlays (`ProfileMenu`, `App.jsx` nulstiller ved `accessToken===null`).
- **Billeder:** Open Food Facts-billeder kun med kildeangivelse; `verifiedImageUrl()` kræver at stregkoden i adressen er produktets EAN; `canonical_ean` bruges ikke til billedmatch.

## 6. Hvor finder du mere?

- `BRAND.md`: brandguide (logo, farver, skrift, komponenter, tone). Læs ved alt UI-, mail- og grafikarbejde.
- `src/CONTEXT.md`: database-tabeller, edge functions, notifikationer, to do, auth-mails, Madpas-struktur.
- `.claude/HISTORY.md`: fuld historik og begrundelser (designrunder, hændelser, audits, gamle åbne punkter). Ikke auto-loadet.
- `.claude/rules/design-tokens.md` (tokens + antimønstre, kun ved UI-arbejde), `.claude/rules/edge-function-auth.md`.
- `.claude/skills/` (`ship`, `security-check`, `token-audit` m.fl.), `.claude/commands/` (`qa`, `mojibake-scan`, `resync-branch`,
  `review-pr`), `.claude/agents/design-reviewer.md`, hook `mojibake-check.py` (kører automatisk efter Write/Edit).
- Arkitektur-auditten (30. sept.) og Rescue-audits er gennemført; migrationerne i `supabase/migrations/` er skema-baseline.
