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
  der skal tages først. Afslut punkter (`status='done'`) og opret nye. Tickets ligger også på listen (status følger begge veje).
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
- **Admin-panel:** `eatsafe.dk/admin.html`, eget Vite-entry (`src/admin/`), rører ikke den mobile PWA's bundle. Reference i
  `src/CONTEXT.md` §2 og §10.

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
  Samtykke til helbredsdata (art. 9) gives særskilt og logges i `consent_log` (RPC `give_health_consent`/`withdraw_health_consent`; se `src/CONTEXT.md` §3); tilbagetrækning sletter helbredsdata. Nuværende frister: kontodata slettes straks ved kontosletning; beskeder 12 mdr.; notifikationshændelser og fejllogs 90 dage; sikkerhedsindberetninger 12 mdr.; invitationens `invitee_email` slettes ved svar/udløb (højst ca. 48 t).

---

## 1. Hvad er EatSafe?

Dansk PWA til mennesker med fødevareallergier/-intolerancer. Brugeren scanner en stregkode (eller søger), appen matcher
ingredienserne mod brugerens (og evt. familiens) profil og viser et klart sikkert/farligt/usikkert-signal med begrundelse,
sikre alternativer og indkøbsliste.

| Nøgle | Værdi |
|---|---|
| Live URL | https://eatsafe.dk |
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
- Test: `npx vitest run` (alle skal være grønne). Lint: `npm run lint`.
- Styling: ingen CSS-filer. Al CSS er én streng i `src/theme.jsx` (`appCss`). Kun CSS-variabler i komponenter, ingen hardkodede
  farver. Backticks i CSS-kommentarer bryder template-literalen. Tokens og antimønstre: `.claude/rules/design-tokens.md`.

## 3. Arkitektur

**Bundmenu:** Indkøbsliste | Scan (midten) | Historik. Øverst til højre et hamburger-ikon (tre streger) der åbner `ProfileMenu.jsx`
(profil-hero → `SCREENS.PROFILE`, Favoritter, Familie, Scanningshistorik, Opskrifter, Viden, Madpas, Indstillinger, Admin hvis
admin). Header: `AppHeader.jsx` med ren tekst-wordmark.

**Skærme:** se `SCREENS` i `src/constants.jsx`. Én screen = én fil (`XxxScreen.jsx`). Vigtigste: HOME (`ScannerScreen.jsx`, også en
intern router), RESULT, LIST, PROFILE/EDITPROFILE (kun navn)/EDITPREFERENCES, FAMILY, FAVORITES, HISTORY, MADPAS, KNOWLEDGE,
SETTINGS, NOTIFICATIONS/NOTIFICATION/TICKET, WELCOME/LOGIN/VERIFYEMAIL/RESETPASSWORD/ONBOARD/BOOT, NOTFOUND/SUBMITTED, SUGGEST_EDIT,
TERMS/PRIVACY, ADMIN (mobil), RECIPES (på pause).

**Arkitekturregler (håndhæves i alle PR'er):**
1. Props frem for masse-state; lokalt state lever i screen-komponenten.
2. Ingen IIFE i JSX. Ingen hooks i betinget kode eller loops.
3. Logik i dedikerede hooks (`useXxx.js`), ikke inlinet i `App.jsx`. Er en skærm for stor, del den i `<Skærm><Sektion>Section.jsx`
   (hovedfilen beholder kun routing/fane-state), som AdminScreen er delt.
4. Overlays/drawers renderes via `ReactDOM.createPortal(..., document.body)`: `.screen.fade-in` efterlader en permanent
   `transform`, som fanger `position:fixed`-børn (brugt i `ListPickerSheet`, `InfoSheet`, `ProfileMenu`).
   Bundnavigationen er ca. 113 px høj på iPhones med hjemmeindikator (79 px uden), men `.screen` har kun 110 px bundpadding. Skærme med fast
   bjælke over navigationen (fx "Gem ændringer" i `EditPreferencesScreen.jsx`) måler derfor navigationen med `useMeasuredHeight` og sætter selv bundpadding.
5. Nye skærme som egne filer. `setScreen` i `App.jsx` er guardet: mens `user.onboarding_completed===false` omdirigeres alt
   uden for WELCOME/LOGIN/ONBOARD til ONBOARD.
6. En stille feltnavne-mismatch (kolonne/prop brugt ét sted, aldrig matchet andre steder: `age`/`birth_year`, `customAllerg`/
   `.custom`, ikke-eksisterende `Icon name`) giver ingen fejl i build/tests. Grep efter den slags ved "tekst-/UI-inkonsistens".
7. Postgres: `REVOKE EXECUTE ... FROM <rolle>` er en no-op, hvis PUBLIC har adgangen. Verificér med
   `has_function_privilege(rolle, funktion, 'EXECUTE')`.

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
en webhook-hik: udløs `mcp__Vercel__create_deployment` med `gitSource` (ref `main`, seneste SHA, `target:"production"`).

**Design verificeres i en Artifact-preview** i stedet for et deploy: `npx vite build --base=./ --outDir dist-preview --mode
artifact-preview`; flyt `index.html` til `app.html`; skriv en lille `index.html` der viser den i en 393×852-telefonramme
(`<iframe>`, skaleret med `transform:scale()` ud fra vinduet, `overflow:hidden`, rammen fjernet under 460 px); publicér alle filer
(også admin-chunks som `useAdmin-*.js`, som `main` importerer) til det eksisterende link i `.claude/HISTORY.md` med `url`; ryd
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

## 5. Produkt- og designbeslutninger (nutid)

**Designsystem:** lyst tema (dark mode er droppet, tag det ikke op igen). Primær `--green:#0F7D4F`; `--green-accent:#34D06A` kun
til små positive mikro-elementer; `--blue:#3A6EA5`; spacing-skala og tokens i `.claude/rules/design-tokens.md`. **Logo (Bjørn, 7. okt. 2026):** logo A
(7 streger, flueben med lige meget luft i begge sider, centreret) uden gradient: `#232528` ("Eat"/streger), `--green` `#0F7D4F` ("Safe"/flueben), `#FBFAF7`.
Mail i mørk tilstand bruger hvid + `#79D5A7`. Master-SVG'er i `src/assets/logo/` og `public/brand/`; PNG'er gengives fra dem (se `public/brand/README.txt`). Brand-slogan "Mere tryghed i hverdagen" kun
under logoet på velkomstsiden og i "Om EatSafe". Fast disclaimer i `ResultScreen.jsx` ("EatSafe er vejledende...", ikke "ved
alvorlige allergier"). Tryk-feedback `:active{transform:scale(.97)}`. Scan-knappen har egen palette (`#0E8F5A`/`#08734A`/`#DDF4E8`).

**Fladhed-bug:** delte kort-/knap-klasser uden `box-shadow` ser flade ud; brug `--sh2`/`--sh`/flad+kant-hierarki bevidst.

**Feature-flag og pauser**
- `DIETS_ENABLED=false` (`constants.jsx`): kostpræferencer er skjult i hele appen (kode, kolonner `users.diets`/`family_members.diets`,
  Leksikon-indhold, admin og Madpas' diæt-tekster er bevaret). Tilbage: flaget til true, gennemgå privatlivs-/vilkårstekst og
  `helpers.test.js`. `visibleDiets()` i `helpers.js` er filteret.
- `RECIPES_ENABLED=false` (`RecipesScreen.jsx`): Opskrifter på pause; alle 629 opskrifter er slettet permanent. Skal funktionen
  tilbage, sættes flaget til true OG opskrifter importeres forfra.
- Restaurantguiden er slettet (Madpas dækker behovet); kan hentes fra git. `SCR-20` i `PAGE_IDS` genbruges ikke.
- "Fortsæt med Apple" er ikke implementeret (kræver Apple Developer-setup og er en distributionsbeslutning).

**Følsomhed pr. allergen (spor):** pr. valgt allergen vælger brugeren "Advar mig" (standard) eller "Kun ved ingrediens" for "Kan
indeholde spor af". Data `allergen_levels` (jsonb, `direct_only`) på `users`/`family_members`. Spor er GULE overalt, kun direkte
indhold er rødt. Eget trin 3 i onboarding, plus Rediger præferencer og familieformularen. Hvert valgt allergen har sin egen række (også Glutenfølsomhed
[`pickerLabel` for id `gluten`] og Hvede), og sporvalget fjernes sammen med allergenet (`pruneAllergenLevels`). Laktose (`traceOk:false`) og egne valg har ingen
sporvalg (`traceEligible()`); trin 3 springes over, hvis intet valgt allergen har det. Ingen medicinske antagelser: **Cøliaki er et eget, eksplicit valg** (id `coeliaki`, `profileOnly`, 2. okt.),
aldrig udledt af Gluten/Hvede. Cøliaki-vejledningen under sporvalget ("Har du cøliaki, bør du vælge Advar mig …") vises KUN for rækken Cøliaki; Gluten/Hvede får kun
generel sporinfo. Cøliaki matches mod produktets gluten-/hvedeflag (`effectiveAllergenFlag`) og har ingen egne produktflag (`PRODUCT_ALLERGENS` udelader det). Logik: `helpers.js` (`mergeAllergenLevels` m.fl.), notifikation P1 (`tracesIgnored`), UI
`AllergenSensitivity` (finpudset 2. okt.: segmenteret kontrol `.trace-seg`, kort linje under valget; ignorerede spor er en neutral info-strimmel under banneret). Detaljer: `src/CONTEXT.md` §3.

**Resultatsiden:** data-drevet kategorisering; kaldes aldrig "sikker" blot fordi der ikke var match. RØD = allergi/intolerance,
GUL/ORANGE = kostpræference/E-nummer-fravalg og spor, neutral grå (`--neutral`) = for lidt data, med statussen **"Kan ikke vurderes"**: kortet "Ingrediensliste mangler" med primær "Indsend ingrediensliste" kommer lige under status, "Tilføj til indkøbsliste" er sekundær nederst, og ukontrollerede valg samles i én foldbar linje i "Dine valg". Bidragsflowet (foto/indtastning) skjuler bundnavigationen. Sektionen "Dine valg" viser alle
brugerens valg med ✓/✕/?. Ingredienslisten fremhæver kun det, der er relevant for brugeren (`highlightRules`).

**Profil/familie:** "Rediger profil" ændrer kun navn (Bjørns beslutning). **Alder og køn er obligatoriske i onboarding** (Jans
eksplicitte beslutning; foreslå ikke at fjerne dem). Telefon indsamles ikke. "Rediger præferencer" bruger de delte pickers og
`useGlutenFreeSync()`. Husstandskonti (rigtige EatSafe-konti i husstanden) kan vælges som profil, men er skrivebeskyttede:
`scanFamily` (ProfileContext) til alt, der vælger/tjekker profiler, `family` kun til redigér/slet. Familie-backend: `src/CONTEXT.md` §5.
**Familiemodel (Bjørns krav, 2. okt. 2026): voksne inviteres og accepterer selv (egen konto, eget samtykke); administrerede underprofiler er især til børn.** Opretter kontoejeren en profil til en voksen, skal personen have givet samtykke (note i `MemberForm`, privatlivspolitik afsnit 4). En ny underprofil med allergier kræver en bekræftelse med personens navn (`memberConsentTexts()` i `healthConsent.js`: forælder/værge for børn, eget samtykke for voksne), aldrig "mine". Bekræftelsen er kun et UI-krav; den logges ikke pr. profil (kun kontoens helbredssamtykke i `consent_log`). **Profiler uden egen konto er kun til børn under 18 (Jan, 2. okt.):** alderen i `MemberForm` er begrænset til 0-17 (`AgeStepper` `max`/`onOverMax`, også ved indtastning); et forsøg på 18+ viser "Personer på 18 år eller derover skal have deres egen EatSafe-konto." med knappen "Invitér til familien" (Familie-siden; i onboarding kun en hjælpetekst). Alder udledes af `birth_year`, så en profil, der fylder 18 (eller en ældre voksenprofil), får en overgangsnote "Denne profil skal nu overgå til en personlig EatSafe-konto." med "Invitér til egen konto" på Familie-siden; ingen datamigrering er bygget. Samtykket kræver alder under 18 og har link til privatlivspolitikken. Bland ikke modellerne, og tilføj ikke tekster om invitationslink på underprofiler.

**Familie og deling (Jan, 2. okt. 2026):** appen bruger kun ordet "Familie" (ikke "husstand"). *Voksne med egen konto* forbindes via invitation (`family_invites`, 24 t, én person). **Invitationer (Jan, 3. okt.): enten en mail til en adresse eller et delt link.** Edge-funktionen `family-invite` opretter dem (højst 10 pr. døgn, "Send igen" med 30 min. pause for mail). *Mail:* modtageren ser den i `FamilyInviteSheet` (`useFamilyInviteInbox`), når kontoens bekræftede e-mail matcher, ELLER når brugeren følger mailens link (token i `as_pending_invite`; virker også med Facebook/anden adresse). *Delt link* (`kind='link'`, ingen e-mail): den første, der bruger det og siger ja, låses til invitationen (`requested_by`), og AFSENDEREN skal godkende i `FamilyRequestSheet` (`useFamilyLinkRequests`), før I forbindes. Intet kobles uden eget ja fra alle involverede. **Invitationskortet (Bjørn, 6. okt.):** valget "Send på mail"/"Del et link" (valgt = lys grøn med grøn kant); mail-knappen er slået fra uden gyldig adresse, "Opret og del link" åbner telefonens delingsmenu. Der er ingen "Tilslut via invitationslink" på Familie-siden (fjernet, skabte forvirring); tilføj den ikke igen. **Børneprofilen (Bjørn, 6. okt.):** rækkefølgen Navn, Alder, Køn, Allergier (inkl. egne valg og "Ingen"), Spor, E-numre, knap; alder vælges i en vælger 0-17 år (`AgeSelect`, sidste valg "18 år eller derover" viser invitationsnoten); "Ingen allergier eller intolerancer" er neutral, til den er valgt, og udelukker allergivalg. Egne valg er en ordsøgning og beskrives sådan; ikke fundet vises som "?" i Dine valg, aldrig ✓. "Annuller" i Familie-kortene er grøn tekst uden understregning. **Terminologi (Bjørn, 4. okt.):** voksne med egen konto = familiemedlemmer; under 18 uden egen konto = "Børneprofil" (ikke "Ingen egen konto"). "Slet profil" for en børneprofil ligger kun i Rediger-flowet bag bekræftelse, ikke som skraldespand på kortet. Afsender og modtager får push/besked ved anmodning og svar (N10/N11, ingen mail). Testplan: `docs/familie-invitationer-testplan.md`. Modtagerens e-mail slettes ved svar/udløb (`cleanup_family_invite_emails()`, cron `family-invite-email-cleanup` 03:40 UTC); *profiler uden konto* er til børn. Forbindelsen er IKKE transitiv (A's to inviterede er ikke forbundet med hinanden; bevidst, helbredsdata) og kan afsluttes af begge sider. En indkøbsliste deles som Kun mig / Hele familien / Bestemte personer; "link til listen" er kun til personer uden for familien. Del-knappen sidder som Del-ikon i højre side af den samlede liste-knap (deler den aktive liste direkte; ingen anden Del-knap, andre lister deles ved først at skifte til dem). Ændr ikke modellen uden Jans ja. Detaljer: `src/CONTEXT.md` §5.

**Madpas:** kun on-device (link/QR/PDF-deling blev bygget og fjernet igen, tilføj det ikke uden bestilling). Hver allergi har et
to-sætnings-budskab på 17 sprog, krydskontaminering er opt-in (toggle, info-ikon via `InfoSheet`), oplæsning "Læs højt"/"Stop".
Struktur og tekster: `src/CONTEXT.md` §6.

**Indstillinger:** seks sektioner (Konto, Madpas-sprog, Scanning, Notifikationer, Privatliv & data, Om EatSafe). Privatlivspolitik-
link kun her og i Profil-footeren. Bevidst udeladt: app-sprog, dataeksport, selvstændig vilkårs-side.

**Scanner-forsiden (Bjørn, 4. okt.):** forklaringen følger valget ("passer til" dig/navn/de valgte personer, `scanTargetCopy()`), profilvælgeren hedder "Tjekker for: …", teksten står fast 28 px over Scan-knappen. Nederst et "Vidste du, at …"-kort (`useDailyTip.js`, `pickDailyTip()`): KUN godkendte tips fra `knowledge_base.tips`, aldrig genereret tekst; ét tip pr. dag, relevante allergener 2 ud af 3 dage, link til den præcise artikel, samme indholdsbredde som øvrige kort med ens margin i begge sider (5. okt.; afløser bredde efter indhold), skjult under 500 px hero-højde. Nye tips godkendes af Bjørn/Jan og skal stå i artiklen.

**Historik (Bjørn, 5. okt.):** gentagne scanninger vises som én post med "Scannet N gange, senest …" (`groupHistoryDuplicates()` i `helpers.js`, kun visning; databasen beholder hver række). Fundne produkter samles kun ved samme EAN/produkt-ID (aldrig kun navn), bruger, valgte personer, resultat og allergen-flag, lige efter hinanden med højst 30 min. mellem; "ikke fundet" pr. stregkode. "Ryd" er neutral og skjult uden egen historik; kun bekræftelsen er rød. Ingen søgning/filtre ud over det eksisterende filter ved 10+ poster.

**Fejltilstande (Bjørn, 6. okt.):** ét system i `theme.jsx` (`.state-box`, `.state-page`, `.offline-bar`) og `StateBox`/`LoadErrorBox` i `SharedComponents.jsx`. Rød kun ved egentlig fejl; offline/gemte data er neutral grå med `wifiOff`-ikonet og den globale bjælke siger status ("Du er offline · Viser gemte data"), mens boksen ved indholdet siger konsekvensen ("Gemte produktdata" + dato); genopretning er EatSafe-grøn. Ingen tekniske ord som "cachede data".

**Scanner:** `stopCamera()` nulstiller al scanner-state (også det manuelle EAN-panel via `closeCameraFully()` i `App.jsx`) ved
ethvert kamera-luk. `cameraPermissionDenied` viser et dedikeret kort. Advarselsvibration/-lyd via `fireWarningAlert()`.

**Feedback-modal** (`FeedbackModal.jsx`): fast header og Send-knap, scrollende midte, følger `visualViewport` (tastatur) og safe-area. Typerne står i `feedbackTypes.js` (line-ikoner; id'et `crash` hedder "Appen lukker ned"). Diagnostikken er sammenfoldet og bygges ét sted (`feedbackDiagnostics.js`), så oversigten viser præcis det, der sendes; den indeholder kun tekniske felter (ingen navn, e-mail, allergier, familie eller andre helbredsdata; kun internt bruger-ID, trace-linjer hvidlistes, URL uden query/hash). Ved "Appen lukker ned" sendes kun den seneste registrerede fejl (`getRecentErrors()` i `errorReporter.js`, lokalt på enheden), og hjælpeteksten lover det kun, hvis der findes en. Admin viser nye tickets som "Konto <id>" (`ticketReporter.js`).

**Login, oprettelse, onboarding**
- Felt-specifikke inline-fejl (`emailError`/`passwordError` i `useAuth.js`); `authError` kun til fejl, der ikke kan knyttes til ét
  felt. Catch-blokke viser aldrig rå `e.message`.
- Velkomstsiden har ingen juridisk tekst (brugeren accepterer intet dér); "Ved at oprette en konto accepterer du vores brugsvilkår. Læs i privatlivspolitikken, hvordan vi behandler dine oplysninger." står først på Ny bruger. "Husk mig" findes ikke: appen holder brugeren logget ind, til de logger ud. Login-fejl er altid "E-mail eller adgangskode er forkert." Adgangskodefejl er korte: "Indtast en adgangskode." eller "Brug mindst 10 tegn med store og små bogstaver og mindst ét tal."
- Oprettelse kræver kun e-mail, adgangskode og vilkår, opretter kontoen straks og viser `VerifyEmailScreen`. Tre tilstande:
  konto oprettet (`as_pending_verify`), e-mail bekræftet (`onboarding_completed=false` → onboarding fra gemt `onboarding_step`),
  færdig (`as_onboarded`). Appstart venter på status på `SCREENS.BOOT`. Routing deles af `resolveOnboardingRoute` i `useAuth.js`.
  Velkomstmailen sendes kun når `onboarding_completed` skifter false → true (trigger `on_onboarding_completed`).
- Glemt adgangskode: linket åbner `ResetPasswordScreen` (`#type=recovery`), først derefter kommer brugeren ind. Mailen har et
  signeret "Var det ikke dig?"-link (`report-unrequested-reset`, `src/CONTEXT.md` §11).
- Onboarding har 5 trin (profil, allergier + samtykke + E-numre, spor, familie [valgfrit], notifikationer [valgfrit]) og ingen skjulte trin
  bagefter: "Slå notifikationer til"/"Ikke nu" åbner `SafetyInfoModal` ("Vigtig sikkerhedsinformation"), og først "Jeg forstår – kom i gang"
  sætter `onboarding_completed` (luk appen før da, genoptages trin 5). Ingen Beta-popup (BETA er kun et badge). "Jeg har ingen allergier" kræver bekræftelse, hvis noget er valgt, og rydder
  alt (også spor); familiemedlemmer kræver navn, aktivt valgt alder (ingen forudfyldt), køn og et allergivalg eller et eksplicit "ingen". E-nummer-rækker
  har en eksplicit afkrydsningsboks; chevron er kun info. Routing sender alt andet end `onboarding_completed=true` til onboarding.
  Bekræftelseslinket registrerer e-mailen af sig selv og går direkte videre til onboarding (ingen mellemskærm). `VerifyEmailScreen` tjekker stille, når
  brugeren vender tilbage til appen (og viser så "bekræftet" med "Fortsæt →"); knappen hedder "Tjek bekræftelse", og "ikke bekræftet endnu" er en neutral besked, ikke en fejl. Et PWA kan ikke åbne linket
  i den installerede app på iOS (kræver native Universal Links); manifestet har `handle_links`/`launch_handler` til Chromium. Linket lander i browseren, og `resolveOnboardingRoute` genoptager.
- Google/Facebook går direkte til onboarding. `onboardStep` ligger i `App.jsx` FØR `useAuth()` (ellers TDZ-krasch).

**Allergileksikon:** `knowledge_base` har EU's 14 allergener + hvede med neutral `status_label`; laktose ligger under Ingredienser;
retter (`dish`) kun via søgning. Risikoniveauer er fjernet og må ikke genindføres uden klar faglig definition. `allergen_ids`
bruger `maelkeallergi` (mælkeprotein) og `hvede`.

**Beta-installation:** admin-knap → `public/install.html` (iPhone: 3-trins guide, andet redirecter til `eatsafe.dk/?src=beta-qr`).
`usePwaInstall.js` + `InstallPrompt.jsx`. `public/sw.js` bruger `skipWaiting()`+`clients.claim()`, og `index.html` genindlæser én gang
ved `controllerchange` (nødvendigt for at opdateringen overtager åbne faner).

**Logout:** `ProfileMenu.handleItemClick` kalder `onClose()` før action, og `App.jsx` nulstiller `showProfileMenu` ved
`accessToken===null`. Alle logout-veje skal lukke egne overlays.

---

## 6. Hvor finder du mere?

- `src/CONTEXT.md`: database-tabeller, edge functions, notifikationer, to do, auth-mails, Madpas-struktur.
- `.claude/HISTORY.md`: fuld historik og begrundelser (designrunder, hændelser, audits, gamle åbne punkter). Ikke auto-loadet.
- `.claude/rules/design-tokens.md` (tokens + antimønstre, kun ved UI-arbejde), `.claude/rules/edge-function-auth.md`.
- `.claude/skills/` (`ship`, `security-check`, `token-audit` m.fl.), `.claude/commands/` (`qa`, `mojibake-scan`, `resync-branch`,
  `review-pr`), `.claude/agents/design-reviewer.md`, hook `mojibake-check.py` (kører automatisk efter Write/Edit).
- Arkitektur-auditten (30. sept.) og Rescue-audits er gennemført; migrationerne i `supabase/migrations/` er skema-baseline.
