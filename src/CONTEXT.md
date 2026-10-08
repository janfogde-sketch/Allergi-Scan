# EatSafe — CONTEXT.md

> Teknisk reference: database, edge functions, notifikationer, to do og auth-mails. Projektoverblik, arbejdsgang, arkitekturregler
> og produktbeslutninger står i `/CLAUDE.md`; historik og begrundelser i `.claude/HISTORY.md`. Opdatér ved skema-/integrationsændringer.
> Sidst gennemgået og trimmet 2. okt. 2026.

---

## 1. Nøgleoplysninger

Supabase-projekt `jegrpcflyguadyxialkm` (`https://jegrpcflyguadyxialkm.supabase.co`), live `https://www.eatsafe.dk`, admin `janfogde@gmail.com`
(`404caa7f-91b0-4bad-a2a8-bcb6a396d35f`), kontaktadresse `hej@eatsafe.dk`. Edge Functions er Deno/TypeScript og deployes ved merge; `verify_jwt`
pr. funktion står i `supabase/config.toml` (funktioner uden JWT validerer selv, se `.claude/rules/edge-function-auth.md`).

## 2. Filstruktur (overblik)

- `src/App.jsx` routing/global state; `constants.jsx` (ALLERGENS, SCREENS, DIETS, E_NUMBERS, tekster); `helpers.js` (allergenlogik, API-hjælpere);
  `theme.jsx` (al CSS); `SharedComponents.jsx` (Icon, EatSafeLogo, InfoSheet, toasts m.fl.).
- Skærme `src/*Screen.jsx` (én pr. SCREENS-konstant; `ScannerScreen` er HOME + intern router). `ProfileScreen`, `EditProfileScreen`,
  `EditPreferencesScreen`, `FamilyScreen`, `HistoryScreen`, `FavoritesScreen`, `SettingsScreen` er hver sin fil. Mobil-admin: `AdminScreen.jsx` +
  `Admin*Section.jsx`.
- Hooks `src/use*.js` (scanner, søgning, alternativer, madpas, admin, indkøbsliste, auth, onboarding, household, push, notifikationer m.fl.),
  contexts `src/*Context.jsx`.
- Desktop-admin: `src/admin/` (eget Vite-entry `admin.html`, egen React-rod, egen CSS i `adminTheme.js`; deler localStorage-session
  (`as_token`/`as_refresh`/`as_user_id`) med appen og genbruger `useAdmin.js`). Faner i `src/admin/sections/`: Dashboard, Brugere, Indsendelser,
  Tickets, Manglende, Import, Opskrifter, Produkter, Leksikon, Historik, Familie, Fejl, Tilbagekald, Notifikationer, To do. Global søgning i topbaren.
- Edge-funktioner `supabase/functions/<navn>/index.ts`, delt kode i `supabase/functions/_shared/`. Migrationer `supabase/migrations/`
  (baseline + nye), mailskabeloner `supabase/templates/{auth,resend}/`, statiske sider `public/` (`install`, `invite`, `privacy`, `terms`,
  `uventet-nulstilling`).

## 3. Database — vigtigste tabeller

| Tabel | Nøglefelter | Noter |
|-------|-------------|-------|
| `products` | id, ean, name, brand, allergen_flags (jsonb), allergen_quality, allergen_source_method, nutrition (jsonb), verified_status, source, ingredients_text | ~20.200+ |
| `users` | id, name, email, role, diets (jsonb), allergen_levels (jsonb), onboarding_completed, onboarding_step | Se note nedenfor |
| `user_allergens` | user_id, allergen_id | |
| `family_members` | id, user_id, name, allergens (jsonb), diets, e_numbers, family_owner_id | |
| `family_invites` | id, token, invited_by, accepted_by, status, expires_at, invitee_email, mail_sent_at | To-vejs deling, 24t expiry; `invitee_email` slettes ved svar/udløb |
| `scan_history` | id, user_id, ean, status, scanned_at | |
| `product_submissions` | id, ean, name, status, submitted_by | |
| `shopping_lists` | id, owner_id, name, family_id | Realtime aktiveret |
| `shopping_list_items` | id, list_id, name, checked, added_by, added_at | Realtime aktiveret |
| `knowledge_base` | id, category, slug, title, summary, description, allergen_ids, status_label (faglig status, fx "Fødevareallergi"), risk_level (ikke længere brugt, alle null siden 30. sept. 2026), tips (text[], godkendte korte fakta til "Vidste du, at …"-kortet på scanner-forsiden, migration `20261004180850`; 25 tips på 23 opslag; hvert tip skal kunne findes i opslagets egen tekst) | 768 opslag. Kategorier: allergen (EU's 14 + hvede), ingredient (kun ting der kan stå i en ingrediensliste), dish (retter/produkter, kun via søgning), e_number, diet, cross_reaction, faq, fun_fact. |
| `missing_ean_log` | ean, count, first_seen, last_seen | Auto-logget + auto-importeret |
| `recipes` | id, title, instructions, image_url | tom (opskrifter på pause, slettet 30. sept. 2026) |
| `client_errors` | id, fingerprint, source, message, stack, screen, occurrences, first_seen, last_seen, status | Fejl fra appen/edge/DB-triggere (30. sept. 2026, A3). Skrives kun via RPC `log_client_error` (også anon; samme fejl inden for 1 time lægges sammen, loft 300 nye rækker/10 min). Kun admin kan læse (RLS). Vises i admin-panelet under "Fejl" |

**Test af sletning/opbevaring:** `supabase/tests/account_deletion.sql` kører i CI (`.github/workflows/db-tests.yml`, lokal database bygget af migrationerne): liste-vagt over kolonner med brugerdata, sletning med nul rester, oprydningsfrister. `src/accountDeletionGuard.test.js` holder trinene ens med `delete-user`.

**Tjek efter merge (7. okt. 2026):** `.github/workflows/post-merge-checks.yml` kører efter hvert push til main og holder intet tilbage (`ci.yml` er uændret og hurtig). Fire spor: `npm audit` (fejler på alvorlige huller i produktionspakker; byggeværktøj kun advarsel), kyrillisk mojibake-scan, `deno check` af edge-funktioner (fejler kun på manglende import/syntaks; ca. 79 kendte typeadvarsler er et efterslæb, ikke rød) og dækningsrapport (ca. 69 % linjer, kun information). Påkrævede checks/branch protection venter på dev-grenen.

**Opbevaringsfrister (privatlivspolitik afsnit 11):** kontosletning (`delete-user`) fjerner straks profil, allergener, familieprofiler, lister, scanninger,
favoritter, beskeder, push-tilmeldinger, tickets, indsendelser og login (cascade/eksplicit); `client_errors` mister bruger-id. Automatisk oprydning i `cleanup_notifications()` (inkl. scanningshistorik efter 24 mdr. og søgehistorik `search_selections` efter 12 mdr. og anonyme feedback-tickets (uden login) efter 12 mdr. fra oprettelsen; skærmbilleder uden ticket fjernes af `cleanup-orphan-images`; inaktive konti: edge-funktionen `inactive-accounts` advarer efter 35 mdr. uden aktivitet via mail P7 og sletter via `delete-user` efter 36 mdr. og 30 dages frist; aktivitet = login, aktiv session eller scanning; admins undtaget; `users.inactivity_warned_at`)
(cron `notify-cleanup`, 03:30 UTC): beskeder 12 mdr., hændelser 90 dage, `client_errors` 90 dage (på `last_seen`), `security_reports` 12 mdr. (migration `20261001132038`), `family_invites.invitee_email` nulstilles ved svar/udløb af `cleanup_family_invite_emails()` (cron `family-invite-email-cleanup` 03:40 UTC, migration `20261003180000`). Ingen automatiske backups (Free).

**Samtykke til helbredsoplysninger (2. okt. 2026, migrationerne `20261001133358` og `20261001133411`, GDPR art. 9, stk. 2, litra a):** tabellen `consent_log` (bruger, `kind='health'`, `given`/`withdrawn`, version, serverens tidspunkt;
kun læsning for egen bruger/admin, slettes sammen med kontoen). Skrives kun via RPC'erne `give_health_consent(p_version)` og `withdraw_health_consent()` (sidstnævnte sletter i én transaktion `user_allergens`, familieprofilers allergener/følsomhed/E-numre,
`users.allergen_levels`/`e_numbers`, `scan_history` og P1-beskeder). Databasen kræver samtykke: RLS på `user_allergens` (insert/update; admin undtaget), triggere på `users.allergen_levels` og `family_members`. Funktionen `has_health_consent(uid)`
læser den nyeste række. App: `HEALTH_CONSENT_VERSION` (`constants.jsx`, hæves ved væsentlig tekstændring), `useHealthConsent.js`, ren logik i `healthConsent.js` (test), afkrydsningen `HealthConsentBox.jsx` (onboarding trin 2, Rediger præferencer, `MemberForm`;
Bjørn finpudser designet) og Indstillinger → Privatliv & data (status og tilbagetrækning). Eksisterende brugere uden samtykke bliver bedt om det, første gang de gemmer allergier.

**Backup-tabeller:** `*_backup_20260930` i `public` og skemaet `qa_backup` er rester fra datarettelser (ingen kode bruger dem, Free-planen har
ingen automatiske backups). De slettes samlet tæt på 1. nov. 2026 (to do `c188223c`), derefter skal denne note fjernes.

**`products.allergen_source_method`:** hvordan `allergen_flags` blev beregnet (adskilt fra `allergen_quality`, som er tillidsniveauet): `keyword`,
`keyword+claude`, `off_tags`, `off_tags+keyword`; `NULL` = ukendt herkomst (den oprindelige import-pipeline, ikke i dette repo). Skrives af `auto-reparse`,
`allergens` (`save`) og `products`' OFF-fallback; admin-godkendelsesflows i `useAdmin.js` udleder `allergen_quality` af det FAKTISKE `method`-svar.

**Negation og reserve-tjek (8. okt. 2026, E3/E4):** `isNegatedAt` i `allergenEngine.js` er den ENESTE negationsregel; `src/allergenKeywords.js` (fremhævning, egne allergier) importerer den. `shouldUseClaudeFallback(text, flags)` sender også lister på mindst 200 tegn, hvor nøgleordene ikke finder noget, til Claude (kun opadgående fletning; loft 100/døgn pr. bruger, 300 globalt for interne kald).

**Motorregler efter 100-produkters gennemgang (2. okt. 2026):** `normalizeIngredientText()` i `allergenEngine.js` fjerner falske ord før matchning (mælkesyre/E270, plantedrikke som kokosmælk, "solsikke lecithin", "ris mel"). Lecithin uden kilde giver soja-SPOR; tilsat laktase giver laktose-SPOR; "free from …"-opremsninger negerer; "sulfit" matcher som understreng. `looksNonDanish` (delt med frontend, `helpers.js` importerer den) kender også fransk/italiensk/spansk/hollandsk/polsk. Frontend: `hasRealIngredients(text, navn)` behandler en ingrediensliste, der er produktnavnet, som "ingen liste" (flag `no` bliver `unknown`), og "laktosefri" i navnet nulstiller laktose-flaget. Bestående rækker genberegnes med `scripts/reprocess-allergen-flags.mjs` (tørkørsel som standard; `--apply` udløser P1-beskeder, se P1 nedenfor, så kun efter aftale). **Kørt stille 2. okt. 2026** (Jans valg A): 715 produkter opdateret via staging-/backuptabellen `allergen_flags_fix_20261002` (`old_flags` = tidligere flag; droppes senest 1. nov., to do), med `on_products_allergen_change` slået fra og tændt igen i samme transaktion, så ingen P1-beskeder blev sendt.

**`users.role`-beskyttelse:** `users_update_own_or_admin` tillader selv-opdatering uden kolonne-begrænsning, og `authenticated` har UPDATE på `role`.
Triggeren `prevent_role_self_escalation` blokerer ændring af `role`, medmindre kalderen allerede er admin. Overvej samme slags trigger, hvis en ny
privilegeret kolonne tilføjes til en selv-redigerbar tabel.
**`users.plan_id`/`plan_expires_at`/`email`-beskyttelse (6. okt. 2026):** triggeren `prevent_plan_email_self_edit` afviser selv-ændring af planfelterne; `email` må kun sættes til kontoens login-adresse (`auth.users.email`, uden forskel på store/små bogstaver). Admin og service-nøglen (`auth.uid()` er null) er undtaget. Test: `docs/users-laas-test.sql` (rulles tilbage).

**`allergen_levels` (jsonb) på `users`/`family_members`** (migration `20261001120049`): følsomhed pr. allergen, fx `{"maelkeallergi":"direct_only"}`. Manglende
allergen = "strict" (spor flagges). `direct_only` = kun direkte indhold flagges; spor vises som rolig info. Logik i `helpers.js` (`compareAllergens(flags, ids,
levels)` → `ignoredTraces`, `computeProfileResults`, `mergeAllergenLevels` — strengeste aktive profil vinder). Husstandskonti får niveauer via `family/group`
(`allergenLevels`); `notify` P1 sender ikke spor-ændringer til en modtager, der kun reagerer på direkte indhold (`affectedAllergenChanges(..., tracesIgnored)`).
**Cøliaki** (`coeliaki`, `profileOnly` i `ALLERGENS`; ingen DB-ændring, ids er fri tekst): kun et profilvalg uden egne produktflag (`PRODUCT_ALLERGENS` bruges i admin, indberetning og
"produkt ikke fundet"). `effectiveAllergenFlag(flags,"coeliaki")` = højeste af gluten/hvede; `notify` P1 behandler gluten-/hvede-ændringer som berørende en cøliaki-profil. Madpas: navn + to-sætnings-budskab ("Jeg har cøliaki." + strengt glutenfrit, også spor) på 17 sprog i `MADPAS_COELIAC_T`
(konstanter, ikke `{name}`-skabelonerne); vises i allergi-sektionen, indgår ikke i krydskontaminerings-sætningen, oplæses; gluten-eksempler. Leksikon: `coeliaki` tilføjet til `allergen_ids` på `gluten`, `faq-coeliaki`, `faq-hvede-vs-gluten` (migration `20261002063606`).
UI: `AllergenSensitivity` i `AllergenPicker.jsx`. Admin → Brugere kan sætte niveauet; familiemedlemmers niveauer redigeres kun i appen.

**`users.onboarding_step`** (integer 1-5, default 1) husker onboarding-trinnet sammen med `onboarding_completed`; selv-opdateres via PATCH. Signup sender kun
e-mail+adgangskode, og `handle_new_user()` lader `name` være null. Velkomstmailen sendes kun af `send_welcome_after_onboarding()` (trigger
`on_onboarding_completed`, kun false → true; `welcome_sent_at` reserveres atomisk) via `send-email` (`welcome_onboarded`, HTML fra `_shared/welcomeMail.ts`, bygget af
`node scripts/build-welcome-mail.mjs` fra `supabase/templates/resend/N1-velkomst.html`).

**Sikkerhedsfunktioner (security-check 25. sept.):** `family_group(p_uid)` og `is_admin(user_id)` er `SECURITY DEFINER` og skal forblive `EXECUTE`-grantet til
`authenticated` (RLS bruger dem), men filtrerer på logik-niveau: `family_group` returnerer kun for kalderen selv/gruppens medlemmer eller `service_role`;
`is_admin` er kun sand for kalderens egen `auth.uid()`. De BLIVER derfor ved med at stå som "executable" i `get_advisors` (accepteret støj; antag ikke et overset
fund). `prevent_role_self_escalation()` er revoked fra PUBLIC. `pg_trgm` ligger i skemaet `extensions`. Leaked Password Protection kræver Supabase Pro.

---

## 4. Edge Functions (Supabase)

| Funktion | Beskrivelse |
|----------|-------------|
| `products` | GET/POST/PATCH/DELETE produkt-CRUD + OFF fallback |
| `allergens` | Keyword-engine + Claude Haiku fallback |
| `ocr` | OCR: `ingredients` / `product_name` / `nutrition` / `ean_from_image` |
| _Døgnlofter_ | `_shared/apiUsage.ts` (`LIMITS`): ocr 60, claude_analysis 100, off_lookup 300, list_code 30, **submission 30** (rammer en bruger det (også ocr og claude_analysis), får admin en høj to do "Døgnloft ramt", `reportLimitHit`), search_selection 200. Tællere i `api_usage`, ryddes efter 30 dage af `cleanup_notifications()`. |
| `search` | Fuldtekst-søgning. Matchning, scoring og sideinddeling sker i RPC'en `search_products` (kun `service_role`; verificeret bruger sendes som `p_user_id`). Trigram-indekser på `products.name/brand/category/subcategory`. Rangeringen i SQL skal følge `normalize()` i funktionen. Klienten (`ListScreen.jsx`) har 70 ms debounce og en 5 min cache pr. søgetekst POST (søgevalg): højst 100 tegn søgeord, loft 200 pr. bruger pr. døgn (`search_selection`), over loftet ignoreres kaldet stille. |
| `send-email` | Resend-mail; `type` er `welcome_onboarded`, en servicemail fra `TRANSACTIONAL_TEMPLATES` (`_shared/mailSend.ts`) eller `"raw"` (direkte `subject`+`html`, til interne mails som `admin-digest`). Mails om indsendelser/tickets sendes af `notify` (N2a, N3, N6) |
| `feedback` | **NY** (30. sept. 2026, A4) — modtager feedback-tickets fra appen og admin-panelet. Uden login: 5/time pr. afsender (saltet IP-hash i `feedback_tickets.client_hash`) og 60/time i alt. Med login: 20/time. `submitted_by` sættes kun fra login-tokenet. Validering i `feedback/validate.js` (testet i `src/feedbackValidate.test.js`) |
| `auto-import-off` | **NY** — importerer fra OFF dagligt kl. 02:00 UTC via pg_cron |
| `admin-digest` | **NY** (17. sept. 2026) — ugentlig email til alle admins (`role='admin'`) med antal afventende indsendelser + åbne tickets + tilbagekaldelser uden stregkode (`needs_review`), kun sendt hvis der reelt er noget. pg_cron mandag kl. 08:00 UTC (jobid 4) |
| `food-waste` | **I KØLESKABET** (17. sept. 2026) — tjekker om et EAN er nedsat pga. udløb i en nærliggende Netto/Føtex/Bilka, via Salling Groups officielle "Anti Food Waste"-API (`geo`-baseret opslag). Kræver bruger-login. Deployet og virker (testet live med `SALLING_API_TOKEN` sat) — men UI-knappen på `ResultScreen` er bevidst fjernet igen efter brugerens ønske. `useFoodWaste.js`-hooken ligger stadig i `src/`, klar til at blive genkoblet til en skærm når featuren skal genoptages — se punkt 13 |

### Test af edge-funktionernes handlere (8. okt. 2026)

`src/testing/edgeHarness.js` indlæser en `supabase/functions/<navn>/index.ts` uden Deno, netværk eller database: `Deno.serve` og `createClient` er stubbet (aliasser i `vite.config.ts`), og testen giver en `resolver`, der svarer på hvert databasekald (`c.table`, `c.kind`, `c.rpc`, `c.has("eq", kolonne, værdi)`). `h.call(metode, sti, { token, body, headers })` sender en rigtig `Request`; `h.writes()` viser alle skrivninger, så en test kan bevise, at et afvist kald intet skrev. Tests: `src/edge*.test.js` (family, shopping, delete-user, allergens/ocr, products/submissions, family-invite, notify, og `edgeAuthCategories` med loginkrav på alle beskyttede funktioner, signerede kald og en vagt der fejler, hvis en ny funktion ikke står i `config.toml` eller mangler adgangstjek). Stub `fetch` med `vi.stubGlobal`, så intet kan sende mail/push; ny funktion med adgangstjek = tilføj den til `PROTECTED` i `edgeAuthCategories.test.js`.

**Fastlåste versioner (8. okt. 2026):** workflows bruger handlinger med SHA, og Supabase-CLI kører en fast version; alle edge-funktioner importerer `supabase-js` i en fast version (nu 2.117.2, via esm.sh og jsr). Opdatér dem bevidst, og ret aliasserne i `vite.config.ts` kun hvis formatet ændres. `family-invite` tillader højst 3 invitationer pr. modtageradresse pr. døgn (`MAX_INVITES_PER_RECIPIENT_PER_DAY`).

## 5. Auto-import (OFF) og Familie-deling

- **Auto-import:** edge-funktionen `auto-import-off`, pg_cron dagligt kl. 02:00 UTC (manuelt: Admin → Import → "Kør import nu"). Flow: `missing_ean_log` → OFF API →
  `products` → slet fra loggen. Ingen AI, pris $0. Lokalt script `import_missing_eans.py` (`--limit N` eller `--test-eans`).

**Familie-deling**

- **Ordforråd (2. okt. 2026, Jans beslutning):** "Familie" er det eneste ord i appen (ikke "husstand"). *Voksne med egen konto* = forbundet via invitation; *Profiler uden konto* = administrerede børneprofiler (kun under 18; alder 0-17 i `MemberForm`, overgangsnote ved 18); *Invitation* = en mail til en bestemt e-mailadresse (`/invite/<token>` i mailen, 24 t, én person; kan bruges via e-mail-match eller mailens link); *Link til listen* = indkøbslistens `?join-list=KODE` (permanent, kun til personer uden for familien). Kodenavne (`household`, `useHousehold`, `family_group`) er uændrede.
- **Tabel:** `family_invites` (token, `invitee_email`, `mail_sent_at`, 24t expiry, to-vejs). RLS: `invited_by`/`accepted_by` kan SELECT egen række, admin kan DELETE, og `invited_by` kan selv DELETE sin egen række mens `status='pending'` ("Annullér invitation"). Klienten kan IKKE længere INSERT (politikken `family_invites_insert_own` er låst med `with check (false)` 3. okt., fordi værktøjet blokerede `drop policy`; kan fjernes helt): kun edge-funktionen `family-invite` (service role) opretter rækker.
- **Flow:** Menu → Familie → "+ Tilføj til familien" → valgkort "Tilføj til familien" med "Invitér til familien" (`FamilyInvite.jsx`: forklaring af hvad der deles → skriv modtagerens e-mail → "Send invitation") eller "Opret profil" (`MemberForm`). Se **E-mail-bundne invitationer** nedenfor. Familie-sidens sektioner: Familiemedlemmer med egen konto (+ afventende invitationer) og Profiler du administrerer. `family_group` er IKKE transitiv: har A inviteret både B og C, er B og C ikke i familie med hinanden (bevidst, helbredsdata; Jan 2. okt.).
- **E-mail-bundne invitationer (3. okt. 2026, ticket 51698c51):** et token i `localStorage` gik tabt, når linket blev åbnet i én browser (Messenger) og login skete i en anden. Nu: (1) `POST /functions/v1/family-invite` (`{email}` eller `{resend_id}`, auth-kategori 1, `verify_jwt=false`) normaliserer og validerer adressen (`_shared/familyInvite.ts`), afviser egen adresse, allerede forbundne (`invitee_already_connected`, kun service role) og dublet-ventende (409 `already_pending`), begrænser til 10 nye pr. døgn (429 `rate_limited`), opretter rækken og sender mailen N9 (`_shared/inviteMail.ts`, genereret fra `supabase/templates/resend/N9-familieinvitation.html` med `node scripts/build-invite-mail.mjs`); fejler mailen, slettes rækken (502 `mail_failed`). "Send igen" har 30 min. pause (429 `too_soon`). Tokenet returneres aldrig til klienten. (2) Modtageren bekræfter i appen, via to veje der samles i samme sheet (`mergeInvites()` i `familyInviteInbox.js`): (a) e-mail-match: `get_my_pending_family_invites()` / `accept_my_family_invite(id)` / `decline_my_family_invite(id)` matcher kontoens BEKRÆFTEDE e-mail (`_caller_verified_email()`, intern) mod `invitee_email`; (b) mailens link: `?invite=<token>` gemmes i `localStorage` (`as_pending_invite`, `useIncomingLinks`) og følger brugeren gennem oprettelse/login/onboarding; `get_family_invite_by_link(token)` / `accept_family_invite_by_link(token)` / `decline_family_invite_by_link(token)` (migration `20261003230000`) kræver kun et gyldigt token og et login, så det virker også for Facebook-brugere og andre med en anden adresse; tokenet ryddes ved svar, udløb eller brug; `useFamilyInviteInbox` + `FamilyInviteSheet` (ListSheets.jsx) viser sheetet efter onboarding, "Nej tak" afviser (`status='revoked'`), luk-knappen udsætter til næste app-åbning. Ingen automatisk kobling (helbredsdata, forkert indtastet adresse): begge veje kræver brugerens eget ja. Afvejning: linket kan bruges af alle, der har mailen (som ved enhver invitationsmail), men er enkelt-brug og virker højst 24 t. `accept_family_invite(token)` findes stadig, men kræver e-mail-match (`email_mismatch`) og bruges ikke af appen. Har adressen allerede en konto (`invitee_has_account`, kun service role), sender `family-invite` en variant af mailen ("log ind, så vises invitationen i appen; ingenting sker, før du har sagt ja"); afsenderen får samme svar uanset, så det afslører ikke, hvem der har en konto. Appen henter invitationerne igen, når den kommer i forgrunden (`useFamilyInviteInbox`). (3) `invite.html` viser en maskeret adresse (`invitee_email_hint` i `get_invite_preview`) og beder om at bruge den. `?invite=<token>` i URL'en dirigerer en ny bruger til oprettelse/login og gemmer tokenet. (4) Opbevaring: `invitee_email` nulstilles ved svar og af `cleanup_family_invite_emails()` (cron `family-invite-email-cleanup`, 03:40 UTC) for udløbne; slettes med afsenderens konto (cascade). Privatlivspolitik afsnit 4, 7 (Resend) og 11 samt vilkår er opdateret 3. okt.
- **Delt link med godkendelse (3. okt. 2026):** `family-invite` med `{kind:"link"}` opretter en række uden e-mail (`kind='link'`, 24 t, højst 10 invitationer pr. døgn i alt) og returnerer URL'en til afsenderen (`family_invites.token` kan afsenderen læse via RLS og vises som Del/Kopiér i `PendingInviteCard`). Modtageren følger linket → samme sheet som mail-invitationer, men knappen er "Ja, send anmodning": `accept_family_invite_by_link(token)` låser linket til den første (`requested_by`, `requested_at`; udløb forlænges til mindst 24 t fra anmodningen; en anden får "Invitationen er allerede brugt") og forbinder IKKE. Afsenderen får `FamilyRequestSheet` (hook `useFamilyLinkRequests`, henter ved åbning/forgrund og hvert 30. sek.): `get_family_link_requests()` / `approve_family_link_request(id)` (sætter `accepted_by=requested_by`) / `decline_family_link_request(id)` (`status='revoked'`). `decline_family_invite_by_link` virker kun for mail-invitationer, så en tilfældig, der har linket, ikke kan ødelægge afsenderens invitation. Migration `20261003233000`. Beskeder (4. okt. 2026, push og besked i appen, ingen mail; definitioner i `notificationContent.js` med `mail: null`): **N10** til afsenderen, første gang nogen beder om forbindelse (hændelsen `family_link_requested`, lagt i køen af `accept_family_invite_by_link`; ingen dublet ved gentagen anmodning); **N11:approved** til den, der bad, når afsenderen godkender (`family_invite_accepted` med `kind=link` sendes til `accepted_by`, ikke som N5 til afsenderen); **N11:declined** til den, der bad, når afsenderen afviser eller annullerer (`family_link_declined`, lagt i køen af udløberne `notify_link_declined_update`/`_delete` på `family_invites`; id'erne ligger i hændelsen, fordi rækken kan være slettet; sendes ikke, hvis afsenderens konto er slettet). **P2** (udløber snart) har fælles tekst for mail og delt link. `get_family_invite_link_status(token)` forklarer, hvorfor et gemt link ikke kan bruges (unknown/own/mine/used/revoked/expired/awaiting/locked/ok; teksterne står i `linkStatusMessage()`); `get_invite_preview` har `kind` og `locked`, så `invite.html` kan sige "Linket er allerede brugt". "Tilslut via invitationslink" (indsæt et link under Familie) blev fjernet 6. okt. 2026 (Bjørn: skabte forvirring); `parseInviteToken()` og begivenheden `eatsafe:invite-token` er bevaret. "Opret og del link" i `InvitePanel` åbner Web Share med det samme (fallback: Del linket/Kopiér link). Første besøg på et invitationslink genindlæses af service workeren (index.html), og `?invite=` er så væk: `recentInviteLinkFollowed()` (token + tidsstempel `as_pending_invite_ts`, 30 min.) får `initialScreen()` til at starte på login/oprettelse i stedet for velkomstsiden. Migration `20261004000000`. Test: `docs/familie-invitationer-testplan.md`, `docs/familie-invitationer-test.sql`, `scripts/e2e/` (browser, Chromium med emulerede browserstrenge).
- **Testplan for invitationer:** `docs/familie-invitationer-testplan.md` (manuelle test og kendte huller) og `docs/familie-invitationer-test.sql` (33 databasekontroller, rulles altid tilbage). Kør dem efter ændringer i invitationsflowet.
- **Fjern fra familien** (`DELETE /family/group/<id>`): begge sider kan afslutte forbindelsen (2. okt.: også den inviterede); funktionen fjerner også udvalgt/link-adgang til hinandens lister. `GET /group` returnerer `canRemove` (altid true) og `invitedByMe`.
- **Link til en liste (2. okt. 2026):** linket er `https://www.eatsafe.dk/list/KODE` (Vercel-rewrite til `public/list.html`, statisk forklaring + OG-meta; gamle `?join-list=KODE`-links virker stadig). Deletekst og link sendes sammen (`listShareText`/`listLinkUrl` i `listShare.js`). Linket tilslutter ALDRIG af sig selv: `useIncomingLinks` henter `GET /shopping/preview?code=` (kun indloggede; listenavn, ejerens fornavn, `already_member`) og viser `JoinListSheet` ("hvad sker der"), først når oprettelse og onboarding er færdige. "Ikke nu" rydder koden. Ugyldig kode (404) giver en tydelig besked, netværksfejl beholder koden til næste åbning.
- **Indkøbslistens deling** (`ListSheets.jsx` → `ShareListSheet`, edge-funktionen `shopping`): tre valg, "Kun mig" / "Hele familien" (`type='family'`) / "Bestemte personer" (`shopping_list_access`, kun personer i ejerens `family_group`). "Har adgang nu" viser alle med adgang, også dem tilsluttet via link, med Fjern. "Send til en uden for familien" = listelinket (`POST /<id>/rotate-code` laver nyt link; kun ejeren). Ikke-ejere ser "Delt af <fornavn>" og kan "Forlad listen" (`DELETE /<id>/access/<egetId>`) hvis adgangen er via række; en liste delt med "Hele familien" forlades ved at skjule den (`POST /<id>/hide`, tabellen `shopping_list_hidden`, kun service-role, cascade ved liste-/kontosletning; `GET /shopping` udelader skjulte lister, medmindre man ejer dem eller siden har fået en adgangsrække). `GET /shopping` beriger lister med `owner_name`, `shared_with` (fornavne) og `via_access`; `share_link` udleveres kun til ejeren. `PATCH /<id>` accepterer kun `name` (alle med adgang) og `type` (kun ejeren), aldrig `owner_id`/`share_link`. Listekoden er 10 tegn (`crypto.getRandomValues`; ældre lister har 6 tegn, til ejeren laver nyt link); forhåndsvisning og tilslutning tælles pr. konto (`list_code`, 30/døgn, `_shared/apiUsage.ts`). `products` kræver login og tæller opslag af ukendte stregkoder hos Open Food Facts (`off_lookup`, 300/døgn); allerede kendte produkter kan slås op uden login. Statuslinjen ("Delt af Anna", "Delt med hele familien", "Delt med Anna og Ben", "Kun dig") bygges i `listShare.js`.
- **`GET /functions/v1/family/group`** (26. sept. 2026) returnerer nu også hvert husstandsmedlems `allergens`/`custom`/`diets`/`eNumbers` (læst fra `user_allergens` + `users.diets`/`e_numbers`) — Familie-siden viser dermed scanningsrelevante chips for BÅDE administrerede profiler og rigtige konti, ikke kun de administrerede. Kun læsning, ingen redigeringsret følger med.
- **Husstandskonti som skrivebeskyttede scan-profiler** (1. okt. 2026): `useHousehold.js` (App.jsx) henter `/group` ved appstart, når appen kommer i forgrunden og når Familie åbnes. `householdToProfiles()` (helpers.js) mapper kontiene til profiler med id `acct:<bruger-id>`, `linked`/`readOnly`. `ProfileContext.scanFamily` = `family` (egne, redigerbare profiler) + disse, og bruges af alt, der vælger/tjekker profiler (scanning, søgning, lister, historik, favoritter, Madpas, resultatside). `family` bruges stadig kun til redigér/slet. Nye husstandskonti vælges som standard i scanner-valget (`syncLinkedActiveProfiles`, kendte id'er huskes pr. bruger i `as_known_household_<uid>`), og valg af konti, der forlader husstanden, ryddes. En scanning bruger de sidst hentede data for kontoen.
- **Realtime indkøbsliste:** WebSocket på `shopping_list_items` — alle familiemedlemmer ser ændringer live. Familie-siden selv har ingen realtime-kanal — et periodisk tjek (hvert 12. sek.) mens man ser på fanen dækker "opdater automatisk ved accepteret invitation"-behovet uden en ny WebSocket-kanal til en sjælden hændelse.

---

## 6. Madpas

On-device visning (profil → sprog → kompakt preview → "Åbn madpas" → fuldskærm → evt. "Læs højt"); ingen deling/link/QR/PDF (infrastrukturen, `madpas_links` og
`get_madpas_by_token()`, er fjernet). Filer: `MadpasScreen.jsx` (`renderStaffView()`, `renderCompactPreview()`), `useMadpas.js`, tekster i `constants.jsx`.

- Følger altid den VALGTE profils aktuelle data. Strukturerede sektioner FOOD ALLERGIES / INTOLERANCES / DIETARY REQUIREMENTS (`ALLERGENS[].type` afgør
  allergi vs. intolerance); hvert emne er sin egen blok (ikon + stort navn, "May be found in:" med korte eksempler, sikkerhedstekst pr. emne).
- Hjælpefunktioner i `useMadpas.js`: `madpasAllergenLabel()`, `madpasDietLabel()`, `madpasAllergenExamples()`, `madpasSafetyNote(name, lang)`,
  `madpasCrossContactNote(names, lang)`, `madpasDietMessage(dietId, lang)`, `madpasSpeak()`. Brug dem (korrekt sprog-fallback) frem for at genopfinde logikken.
  Tekstkonstanter (17 sprog): `ALLERGEN_T`, `ALLERGEN_EXAMPLES`, `MADPAS_ALLERGY_STATEMENT_T`, `MADPAS_SAFETY_NOTE_T`, `MADPAS_COELIAC_T`, `MADPAS_DIET_MESSAGE_T`,
  `MADPAS_SECTIONS_T`, `MADPAS_EXAMPLES_LABEL_T`, `MADPAS_EXAMPLES_OVERRIDE`, `MADPAS_SPEAK_LABEL_T`/`MADPAS_STOP_LABEL_T`.
- Sikkerhedsteksten genereres altid pr. emne ("...does not contain {name} or ingredients made from {name}."), aldrig som kombineret sætning.
- Krydskontaminering er bevidst OPT-IN (toggle, default FRA, `localStorage` `as_madpas_cross_contact`): én sætning nederst i FOOD ALLERGIES (singular/plural,
  `MADPAS_CROSS_CONTACT_*_T`), fordi EatSafe ikke selv må antage allergiens alvor.
- Oplæsning: navn + sikkerhedstekst pr. allergen (+ krydskontaminering hvis aktiv); "May be found in" oplæses ikke; intolerancer nævnes samlet. Knappen er stor og
  fuld-bredde, fast i bunden (`env(safe-area-inset-bottom)`), og fremvisningsskærmen viser intet branding.
- Diæter har blød ordlyd for keto ("limit") og "does not contain" for resten. `.mp-head` har kun top-padding (`.mp-scroll` giver 20 px i siden).
- **Kendt, uløst sprogfejl:** tyske substantiver i sikkerhedsteksten står med lille forbogstav (`madpasSafetyNote()` kalder `.toLowerCase()`).

---

## 7. Konventioner (supplement til CLAUDE.md)

- `paddingBottom:120` på screen-divs (plads til bundnav); grønne primærknapper `color:#071510`; farver: `--green` CTA/succes, `--blue` navigation, `--amber`
  advarsel, `--red` fare.
- `submissions`/`product_submissions` er den aktive indsendelsestabel. Næringsindhold fra en indsendelse (`ai_parsed_data.nutrition`: energy, fat, saturated, carbs, sugars, protein, salt som tekst) vises og redigeres i admins gennemsyn og omsættes ved godkendelse af `_shared/nutrition.js` (`normalizeNutrition`) til `products.nutrition` i resultatsidens format (`energy_kcal`, `saturated_fat`, `carbohydrates` m.fl. som tal). Produkter godkendt før 5. okt. 2026 kan have det gamle tekstformat.

---

## 8. Kendte åbne punkter

| Punkt | Note |
|---|---|
| Madspild-tilbud ("i køleskabet") | `food-waste`-funktionen virker (Salling API, `SALLING_API_TOKEN`), men UI-knappen er fjernet fra `ResultScreen.jsx`. Genoptag ved at koble `useFoodWaste` (`src/useFoodWaste.js`) på en skærm igen (se git-historik omkring 17. sept. 2026 for den gamle UI) |
| Leksikon 1000+ entries | Planlagt; i dag ca. 770 |
| Desktop-admin | Alle faner er bygget (se §2). Mobil-adminens Debug-fane (`getTraceLog()`) er bevidst ikke porteret. Detaljer om hver fane og de tilhørende RLS-migrationer (`admin_can_write_user_allergens`, `admin_can_read_family_invites`, `admin_can_manage_family_data`) står i `.claude/HISTORY.md` |

## 9. Notifikationer (live siden 1. okt. 2026)

Kravet: push er kun den
korte tekst og åbner den fulde, beskyttede besked i appen via
`https://www.eatsafe.dk/?notification={id}`. Én fælles indholdskilde til push, app og mail.

**Princip (Jan, 1. okt. 2026):** ændringer i en notifikation laves som udgangspunkt i **mailen**. Beskeden i appen skal være
ens med mailen, og push følger med som en afkortet version af samme tekst, der fører til selve beskeden. Ret derfor
indholdet ét sted (`_shared/notificationContent.js`, skabelonerne), og lad push og besked afspejle det.

- **Tabeller** (`20260930135031_notifications_foundation.sql`): `notification_events`
  (outbox, unik `event_key`), `notifications` (modtagerens snapshot, dedup på
  event_key+user+type+variant, klienten kan kun SELECT egne, markere læst via
  `mark_notification_read` og slette egne via `delete_notification` (1. okt. 2026,
  `20261001081923_notifications_delete_own.sql`; sletter også afsendelsesregistret via
  cascade; sletning er permanent, og en slettet besked vises i appen som "ikke længere
  tilgængelig", hvis et gammelt push-link åbnes), `notification_deliveries` (afsendelsesregister, endpoint
  som hash), `app_flags` (`notifications_push_enabled`, `notifications_email_enabled`; begge TIL siden 1. okt. 2026, sættes de til false, er det en rollback — beskeder i appen påvirkes ikke).
- **Triggere** (`20260930135839_..._triggers_and_dispatch.sql`): indsendelse godkendt/afvist
  (N2a/N2b/N3, plus N4 "produkt nu tilgængeligt" ved ny godkendt produktindsendelse),
  invitation accepteret (N5), delt invitationslink: anmodning (N10) og godkendt/afvist (N11, kun push og besked i appen), feedback statusskift eller nyt svar (N6, fire varianter).
  De skriver kun en hændelse og kan aldrig blokere ændringen (fejl → `client_errors`).
- **Afvikling:** pg_cron `notify-dispatch` hvert minut kalder edge-funktionen `notify`
  (kategori 4, kun service-role) for hændelser ældre end 15 sek. `notify` opretter beskeden
  FØR push, sender push kun hvis flaget er tændt og brugeren ikke har slået kategorien fra,
  og genforsøger op til 5 gange med stigende ventetid via `available_at` (1, 5, 15, 60, 240 min.; `retryDelayMinutes()` i
  `notifyHelpers.js`). Opgivne afsendelser logges i `client_errors`. Afvisning uden `review_note` afvises som `failed` og logges.
  Oprydning: beskeder 12 mdr., hændelser 90 dage (`cleanup_notifications`).
- **Delt kode i `supabase/functions/_shared/`:** `notificationContent.js` (definitioner,
  `renderNotification`, testet i `src/notificationContent.test.js`) og `webpush.ts` (VAPID
  med `aud` pr. push-tjeneste, aes128gcm, `sendWebPush`; testet i `src/webpush.test.js`).
  `send-push` bruger nu den delte afsender.
- **Regel:** er både push og mail fravalgt for en kategori, oprettes ingen besked (udviklerpakken).
- **App-visning:** `SCREENS.NOTIFICATIONS` (oversigt, tid, læst/ulæst) og `SCREENS.NOTIFICATION`
  (den fulde besked, tegnet af `NotificationBlocks.jsx` fra de gemte blokke). Ruten `?notification={id}`
  læses i `useNotifications.js`, gemmes i localStorage (`as_pending_notification`) gennem login og åbnes
  efter onboarding; ugyldigt id ignoreres. Anden konto/slettet/udløbet giver samme neutrale side (RLS) med
  "Log ind med en anden konto". Læst sættes først efter visning (`mark_notification_read`). `open_ticket`-
  knappen vises først i trin 4. Menupunkt "Beskeder" med ulæst-tæller i `ProfileMenu.jsx`.
- **Mail:** `notify` sender også mail via Resend-skabelonerne
  (`supabase/templates/resend/`, id'er i `_shared/mailSend.ts`) for N2a/N2b/N3/N4/N5/N6a-d, når
  `app_flags.notifications_email_enabled` er tændt (starter FRA) og brugeren ikke har slået mail fra
  for kategorien. Er flaget tændt, springer de gamle triggere `send_submission_email` og
  `send_ticket_email` over (ingen dobbelt-mails). Værdier HTML-escapes i `buildMailVariables`; mailens
  variabler er de samme rensede værdier som appens besked (`renderNotification().mailVars`).
  `src/mailSend.test.js` sikrer, at hver skabeloneks tekst indeholder alle blokke fra appens besked.
  `notification_deliveries.endpoint` er nu NOT NULL ('' for mail) med almindeligt UNIQUE (det gamle
  udtryks-indeks kunne ikke bruges til upsert).
- **Kategorier, P2, P3:** fire nye kategorier i `notification_preferences`
  (`product_changes`, `shared_lists`, `recalls`, `onboarding_reminder`). Standard pr. kategori ligger i
  `notification_enabled()`: **fra** for `shared_lists` og `onboarding_reminder`, **til** for resten;
  `notify` bruger funktionen (ikke længere egne tjek), og `useNotificationPrefs.js` skal matche
  (`defaultOn`). Kun kategorier med `live !== false` vises i Indstillinger (nu: `shared_lists`; de andre
  tre vises, når P1/P6/P5 sendes). **P2** (invitation udløber): cron `notify-expiring-invites` hvert 10. min
  finder ventende invitationer med højst 4 timer tilbage (én hændelse pr. invitation); `notify` tjekker
  status igen, sætter TTL = min(3600, resterende) og `expiresAt` på pushen; beskedsiden skjuler knappen,
  når invitationen ikke længere er aktiv; mail kun til dem uden push (`MAIL_ONLY_WITHOUT_PUSH`).
  **P3** (delt liste): trigger på `shopping_list_items` (kun lister delt med nogen andre) giver én hændelse
  pr. liste pr. 30-min-vindue, udskudt 5 min (`notification_events.available_at`); `notify` tæller pr.
  modtager varer tilføjet af *andre* (ejer + nuværende adgangsbrugere). Beskeden siger HVEM (fornavne fra `users.name`:
  "Jan", "Jan og Bjørn", "Jan, Bjørn og Maria", derefter "N andre") og hvor mange: "Jan har tilføjet 2 varer til Weekend"
  (overskrift i app og mail; push er titel "Jan har tilføjet 2 varer" + tekst "til Weekend. Se listen i EatSafe."). Varerne står som
  punktliste (højst 8, derefter "og N flere") kun i app og mail (`itemList` er `noPush`, kan heller ikke bruges i admins push-tekst).
  P3-mailen sendes som direkte HTML (`_shared/listMail.ts`, bygget af `P3-delt-indkoebsliste.html` med
  `node scripts/build-list-mail.mjs`, testet i `src/listMail.test.js`), ikke via Resend-skabelonen.
  Varer tilføjet efter afsendelsen i samme vindue får først en besked, hvis der kommer en ny tilføjelse i
  næste vindue (bevidst grænse: højst én besked pr. modtager pr. liste pr. 30 min).
- **Ticket-visning, N1, P4:** *Se din feedback*: `SCREENS.TICKET` (`TicketScreen.jsx`) viser egen ticket
  (tilbagemelding, status, teamets svar) og åbnes fra `open_ticket` på beskedsiden (RLS: kun ejeren).
  **N1** (velkomstmail efter onboarding): `users.welcome_sent_at`; trigger `on_onboarding_completed` sender
  én gang, når `onboarding_completed` bliver true og e-mailen er bekræftet (adressen hentes fra `auth.users`);
  brugeren kan ikke nulstille kolonnen. **P4** (slettekvittering): `delete-user` henter e-mail/navn FØR
  sletningen og sender kvitteringen EFTER en gennemført sletning (3 forsøg; fejl logges i `client_errors`,
  adressen gemmes ikke — der er bevidst ingen udgående kø). Begge servicemails bruger
  `TRANSACTIONAL_TEMPLATES` i `_shared/mailSend.ts` via `send-email`/`delete-user`, og er styret af
  `notifications_email_enabled` (FRA): er flaget fra, virker de gamle triggere som før; er det til, springer de
  gamle velkomsttriggere over.

- **Testbrugerliste (30. sept. 2026):** `app_flags.notifications_test_users` (jsonb-liste af bruger-id'er).
  `notification_flag(key, user)` er sand, hvis det globale flag er tændt ELLER brugeren står på listen; push, mail,
  `notify`, de fire mailtriggere og `delete-user` bruger den. Listen er tom efter go-live; bruges ved nye varianter. Testplan: `docs/notifikationer-testplan.md`.
- **P1 (30. sept. 2026):** trigger `on_products_allergen_change` (migration `20260930152251`) lægger hændelsen
  `product_allergen_changed` i outboxen, når et allergenflag får HØJERE risiko (`allergen_risk_rank`: nej 0, uoplyst 1,
  spor 2, ja 3); faldende risiko giver ingen besked. Hændelsen udskydes 10 min. `notify` genvurderer mod produktets
  aktuelle flag og finder modtagere via favoritter, aktuelle lister (ejer + adgang) og scanninger de sidste 90 dage,
  kun hvis egne eller administrerede profilers allergener berøres (`affectedAllergenChanges` i `notifyHelpers.js`).
  Kategori `product_changes` (standard TIL) er nu synlig i Indstillinger. **P5 er droppet** (Jan, 30. sept.).

- **P6 (30. sept. 2026):** tabel `recalls` (kun admin kan læse) + edge-funktionen `recalls-sync` (service-role, cron
  `notify-recalls-sync` dagligt kl. 17:00 UTC, Jans beslutning 6. okt. 2026; afløser kvarter-planen samme dag) henter Fødevarestyrelsens RSS-feed
  (`foedevarestyrelsen.dk/handlers/DynamicRss.ashx?id=8c2cdc12-...`), læser hver ny side (`_shared/recallParser.js`) og
  udleder EAN, parti og årsag. Kun EAN'er med gyldigt GTIN-kontrolciffer tæller. Status: `ready` (gyldig EAN, sendes),
  `needs_review` (ingen gyldig EAN; kun admin ser den, `unverified_eans` viser rå tal), `cancelled` (titel starter med
  ANNULLERET), `archived` (første kørsel og alt ældre end 14 dage sendes aldrig). `notify` (`recall_published`) matcher på
  favoritter, scanninger (90 dage) og indkøbslister via EAN, aldrig på navn, og sender P6 til alle matchede uanset
  allergiprofil. P6 og P1 oprettes altid som besked i appen, også når push og mail er fravalgt (6. okt.). Resultatsiden slår EAN op via
  RPC `active_recalls_for_ean` (security definer, kun offentlige felter, sidste 60 dage) og viser `RecallNotice` + rød status "Tilbagekaldt".
  En ny `needs_review` opretter en høj-prioritets to do til admin med link til kilden. Linket i beskeden (blokken `link`) tillader kun https på foedevarestyrelsen.dk. Cirka 28 af 50 sider i feedet
  havde gyldig EAN (juni-sept. 2026). Admin-fanen **Tilbagekald** (1. okt. 2026, `RecallsSection.jsx`, `useAdminRecalls.js`, `recallLogic.js`)
  viser rækkerne med tekst, link og rå tal; admin søger produkter frem og knytter dem. RPC'erne
  `admin_resolve_recall(id, 'link'|'archive'|'cancel', eans)` (kun `needs_review`; EAN'er valideres som GTIN og skal
  findes i `products`; `link` sætter `ready` og lægger `p6:<id>` i outboxen) og `admin_recall_affected_count(eans)`
  (brugere via favorit, scan de seneste 90 dage eller indkøbsliste, vist før afsendelse) er kun for admin. Hjælpefunktionerne
  `ean_variants()` og `is_valid_gtin()` spejler `recallParser.js`. Migration `20261001081752`.

**Push er per enhed, ikke per konto (1. okt. 2026):** telefonens tilladelse gælder for enheden. Tidligere blev abonnementet
(`push_tokens`, unik på `user_id` + `token`) kun gemt, når tilladelsen blev givet; en konto, der loggede ind på en enhed med
eksisterende tilladelse (fx jafo efter janfogde), fik aldrig sin række og så push som "til", men intet kom. Nu gemmer
`syncPushToken` (`usePush.js`, kaldt i `App.jsx` når en konto er logget ind) enhedens abonnement for den indloggede konto
uden at spørge om tilladelse, og `forgetPushTokenForDevice` (kaldt i `clearAuth`) sletter kun den udloggede kontos række, så
den forrige kontos beskeder ikke vises på enheden. Serverens svar tjekkes nu (`SAVE_FAILED_REASON`; Indstillinger viser en fejl).
**Delt telefon (7. okt. 2026):** `saveTokenToSupabase` kalder RPC `claim_push_token(p_token)` (security definer, kun `authenticated`), som sletter samme abonnement fra alle andre konti og gemmer det for den indloggede; falder tilbage til almindelig indsættelse ved 404. Dækker, når ryd-op ved logout fejler (udløbet nøgle, offline). DB-test: `supabase/tests/claim_push_token.sql`.

**Admin → Notifikationer (1. okt. 2026):** fanen vælger en notifikation, viser pushens titel/tekst med
eksempeldata (`_shared/notificationMock.js`) og sender en testversion ("[TEST]") til en valgt admin via edge-funktionen
`notify-test` (kræver admin-login, modtageren skal være admin, ingen besked i appen oprettes). Push-tekster kan rettes
og gemmes i `notification_push_overrides` (key, title, body; tom = standard i koden; kun admin har adgang); `notify`
bruger dem ved afsendelse via `renderNotification(key, data, { pushOverride })` (`pushTitle`/`pushBody`), kun
`{{variabler}}` fra notifikationens egne vars er tilladt (`validatePushOverride`). Mail rettes stadig kun i Resend, og
beskeden i appen er uændret.

## 10. Fælles to do-liste i admin-panelet (1. okt. 2026)

Fanen **To do** i `eatsafe.dk/admin.html` (`src/admin/sections/TodoSection.jsx`, data-hook `useAdminTodos.js`,
ren logik `todoLogic.js` med tests). Tabeller (migration `20261001062300_admin_todos.sql`), begge kun for admins (RLS via `is_admin`):

- `admin_todos`: `title`, `description`, `status` (todo/doing/blocked/done), `priority` (low/normal/high), `track`
  (backend/design/test/drift), `assignee_id`, `due_date`, `link`, `created_by`, `created_at`, `updated_at`, `completed_at`,
  `completed_by`. En trigger sætter `updated_at` og `completed_at/by` automatisk, og nulstiller dem, når en opgave genåbnes.
  `created_by` kan ikke forfalskes (RLS-tjek mod `auth.uid()`).
- `admin_todo_comments`: kommentarer pr. opgave (slettes sammen med opgaven; kun forfatteren kan slette sin egen).

Funktioner: hurtig tilføjelse (titel + Enter, spor, prioritet, ansvarlig), visninger Åbne/Mine/Uden ansvarlig/Færdige/Alle med
tællere, filtre på spor og ansvarlig, fritekstsøgning, afkrydsning direkte i listen, redigering og kommentarer i et vindue,
"Kopiér som prompt" til en Claude Code-session, og automatisk genindlæsning hvert 30. sekund, mens fanen er åben.
Menupunktet viser et rødt tal for åbne opgaver med høj prioritet (ikke ventende) eller overskredet frist. **Claude kan læse og skrive den med SQL** (`admin_todos`); hold den opdateret,
når et punkt klares, eller et nyt opstår. Dokumentér ikke åbne punkter to steder.

**Tickets og to do er flettet sammen (1. okt. 2026, migration `20261001092359_tickets_todos_sync.sql`).** `admin_todos.ticket_id`
(unik, sletter opgaven, hvis tickets slettes) peger på `feedback_tickets`. Triggere: en ny ticket giver en opgave
(`trg_ticket_to_todo_insert`, må aldrig blokere indsendelsen; fejl logges i `client_errors`); `classify_ticket(type, tekst)` vælger
spor (indhold → drift, `test` i teksten → test, design-ord eller type `ui` → design, ellers backend), prioritet (crash/"kan ikke"/
"virker ikke" m.fl. → høj, forslag → lav, ellers normal) og ansvarlig (design → bho, resten → jafo). Nøgleordene er enkle og kan
rettes i To do bagefter. Status følger med begge veje (`ticket_todo_status`/`todo_ticket_status`): done ↔ resolved, doing ↔
in_progress, todo/blocked ↔ open; en opgave, der er "blocked", forbliver blokeret, mens tickets står som åben. En genåbnet gammel
ticket får en ny opgave. **Et løst ticket sender som før en besked til indsenderen** (`notify`), også når det sker ved at
afslutte opgaven. Løste og lukkede tickets blev ikke lagt på listen ved oprettelsen (kun de 5 åbne). Både To do og Tickets
henter som standard kun åbne/aktive; de færdige hentes først, når Færdige/Alle (To do) eller Løst/Alle (Tickets) åbnes
(`useAdminTodos.loadDone`, `useAdmin.loadTickets({ includeDone })`), og antallet af færdige opgaver kommer fra serveren.

**Link fra opgave til ticket (2. okt. 2026):** en opgave, der stammer fra en ticket (`admin_todos.ticket_id`), har knappen "Åbn ticket" i listen og i opgavens vindue. Den skifter til fanen Tickets og åbner ticketten via `openTicketById(id)` i `useAdmin.js`, som henter ticketten direkte (virker også for løste tickets, som ikke står i den indlæste liste).

## 11. Auth-mails fra Resend via Send Email Hook (slået til 1. okt. 2026)

Supabase Auth kan sende sine mails på to måder, og begge går gennem Resend:

1. **SMTP (tilbagerulning):** Auth bygger selv mailen ud fra skabelonerne i Supabase (emne + HTML) og afleverer den til Resends SMTP
   (`smtp.resend.com`, `noreply@eatsafe.dk`). Skabelonerne kan sættes af `.github/workflows/deploy-auth-templates.yml`, som siden 2. okt. 2026 kun kører manuelt
   (tilbagerulning, hvis hook'en slås fra) og kræver, at `SUPABASE_ACCESS_TOKEN` har rettigheden til at skrive auth-konfiguration
   (i dag giver den 403, så Supabases egne skabeloner er ikke ajour).
2. **Send Email Hook (i dag):** Auth kalder edge-funktionen `auth-send-email`, som sender mailen via Resends API.
   Hook'en erstatter SMTP, mens den er slået til; slås den fra, bruges SMTP + skabelonerne igen (nem tilbagerulning).

**Kilden til tekst og design er den samme:** `supabase/templates/auth/` (`templates.json` + én HTML-fil pr. skabelon, i Supabases
Go-skabelonsyntaks med `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .Email }}`, `{{ .NewEmail }}`). Seks skabeloner: `confirmation`
(Bjørns), `recovery`, `invite`, `magic_link`, `email_change`, `reauthentication` (udkast i samme stil, afventer Bjørns gennemsyn).
`node scripts/build-auth-mails.mjs` bygger dem ind i `supabase/functions/_shared/authMailTemplates.ts` (genereret; `src/authMail.test.js`
fejler, hvis den ikke er ajour).

**Funktionen** (`supabase/functions/auth-send-email/index.ts`, `_shared/authMail.ts`, `_shared/standardWebhook.ts`):
signeret webhook (Standard Webhooks; 401 uden gyldig signatur, tolerance 5 min). Bygger verify-linket
`{SUPABASE_URL}/auth/v1/verify?token={token_hash}&type={email_action_type}&redirect_to=…`. Ved skift af e-mail med "Secure email
change" sendes to mails (nuværende adresse: `token_hash_new`; ny adresse: `token_hash` — Supabases felter er byttet om). Typer uden skabelon
(fx `password_changed_notification`) svares 200 uden afsendelse. Resend-fejl (429/5xx) gentages op til tre gange, derefter svares 500, så
Auth viser en fejl; samme `Idempotency-Key` (`auth-{webhook-id}-{n}`) hindrer dobbeltafsendelse. Fejl logges i `client_errors`
(kilde `edge:auth-send-email`, aldrig tokens).

**"Var det ikke dig?" i glemt-adgangskode-mailen (1. okt. 2026, to do 1a1e600b):** `recovery.html` har et diskret tekstlink "Giv EatSafe besked"
mellem markørerne `<!--report:start-->`/`<!--report:end-->` (`{{ .ReportURL }}`). `auth-send-email` signerer en token (bruger-id + 7 dages udløb, HMAC-SHA256,
nøgle `SEND_EMAIL_HOOK_SECRET`, `_shared/reportLink.ts`) og lægger linket `https://www.eatsafe.dk/uventet-nulstilling.html?t=…` i mailen; uden token (eller i
Supabase Auths egne skabeloner, hvor `deploy-auth-templates.yml` fjerner blokken) udelades linket. Siden `public/uventet-nulstilling.html` sender først ved et klik på
knappen (så mailscannere ikke giver falske alarmer) til edge-funktionen `report-unrequested-reset` (signeret token-link, `verify_jwt=false`; 400 `invalid`/`expired`
uden gyldig token). Den gemmer en række i `security_reports` (migration `20261001120838`, kun admins kan læse, ingen IP-adresser, højst én pr. bruger pr. time),
opretter en høj-prioritets opgave (spor drift) på to do-listen og mailer alle admins; over 30 indberetninger i timen gemmes de, men der sendes ikke flere mails/opgaver.
Kontoen låses ikke, og intet ændres ved den. Kun recovery-mailen har linket (magic link og skift af e-mail kan få det senere).

**Mørk tilstand (1. okt. 2026, Bjørn):** alle 28 mails (6 auth + 22 Resend) har samme mørke palette, Outlook-regler (`data-ogsc`/`data-ogsb`) og et logo, der skifter til en mørk version; se afsnittet "Mørk tilstand" i `supabase/templates/resend/README.md` og testen `src/mailDarkMode.test.js`.

**Opsætning (Supabase Dashboard; samme trin ved en ny opsætning):**
1. Authentication → Auth Hooks → Send Email → HTTPS, URL `https://jegrpcflyguadyxialkm.supabase.co/functions/v1/auth-send-email`,
   opret hemmeligheden (`v1,whsec_…`), men lad hook'en være slået fra.
2. Edge Functions → Secrets: tilføj `SEND_EMAIL_HOOK_SECRET` med hemmeligheden. (`RESEND_API_KEY` findes allerede.)
3. Slå hook'en TIL, og test straks: opret en testkonto med en plus-adresse (bekræftelse) og brug "Glemt adgangskode" (recovery); tjek
   mailen i Resend. Går noget galt: slå hook'en fra igen.


### Billedkilde (Open Food Facts, CC BY-SA, 5. okt. 2026)
OFF-billeder skal krediteres. Kilden aflæses af `image_url` (`images.openfoodfacts.org`) via `imageAttribution()` i `helpers.js`, ingen kolonne. Resultatsiden viser "Billede: Open Food Facts, CC BY-SA" under billedet (link til OFF-produktet); miniaturer (`ProductImage`) har et lille "OFF"-mærke, og Indstillinger → Om EatSafe har en samlet kildelinje. Vilkårene nævner licensen allerede.

### Android-app (TWA) og fast vært (6. okt. 2026)
Appens faste adresse er `https://www.eatsafe.dk` (`eatsafe.dk` videresender dertil med 307). Android-appen (TWA, Bubblewrap) skal bygges mod `www`, ellers fejler verifikationen. `public/.well-known/assetlinks.json` kobler appen til siden (pakkenavn `dk.eatsafe.app`, foreløbigt); `sha256_cert_fingerprints` er TOM, til Play Console har oprettet appen (Play App Signing-fingeraftrykket, evt. også uploadnøglens). Indsæt dem, når Jan har dem. `vercel.json` sætter `Content-Type: application/json` på filen (test `src/assetlinks.test.js`). Efter deploy: `curl -sI https://www.eatsafe.dk/.well-known/assetlinks.json` skal give 200 og `application/json`.
