# ✅ 17. sept. 2026 — Token-enumering i family_invites lukket (fundet under "Gennemgå de 66"-performance-review)

Fundet ved en rutinemæssig gennemgang af Supabases 66
`multiple_permissive_policies`-performance-fund (bedt om af brugeren som en
ren performance-oprydning: flere PERMISSIVE-policies for samme
rolle+handling OR'es automatisk sammen af Postgres, så konsolidering til
én policy er normalt en ren, adfærdsbevarende ydelsesgevinst). Ved
`family_invites` viste de to overlappende SELECT-policies sig dog ikke
kun at være duplikeret performance-støj — de gav reelt enhver (`anon`
inkl.) ubegrænset, tabel-bred SELECT-adgang til alle rækker, inklusive
`token`-kolonnen som er ment som en delt hemmelighed for invitationslinket.

**Reel konsekvens:** en PostgREST-klient kan udelade filtre og hente alle
rækker. Et scrapet/gættet token kunne dermed bruges til at slå en vilkårlig
families invitation op og joine den — helt uden om afsenderens kontrol
over hvem invitationen reelt går til. `accept_family_invite`-flowet stoler
i forvejen udelukkende på at kende det korrekte token, så bruddet på
hemmeligholdelsen var det reelle problem, ikke selve accept-logikken.

**Rettet:** ny `get_invite_preview(p_token text)` RPC (`SECURITY DEFINER`,
`search_path` låst til `public`), der kun returnerer
`status`/`expires_at`/`invited_by` for det ene token kaldet rent faktisk
angiver — aldrig en tabel-wide liste. `EXECUTE` revoked fra `PUBLIC`,
grantet eksplicit til `anon`/`authenticated` (verificeret efterfølgende med
`has_function_privilege()`, jf. den stående REVOKE-FROM-PUBLIC-lektion
længere nede i denne fil). De 10 gamle, delvist duplikerede policies på
`family_invites` konsolideret til 2: `family_invites_insert_own` (INSERT,
kun egne som `invited_by`) og `family_invites_select_own` (SELECT, kun egne
som `invited_by` ELLER `accepted_by`) — den brede anonyme
tjek-status-adgang findes ikke længere som tabel-policy, kun via RPC'en.
Begge frontend-kaldsteder (`public/invite.html`, `App.jsx`s
`acceptInvite()`) opdateret til at kalde RPC'en i stedet for at læse
tabellen direkte. Build + 98/98 tests grønne efter ændringen.

**Lektion:** en "ren performance-konsolidering" af duplikerede RLS-policies
er ikke altid ren performance — brug lejligheden til at spørge om den
*samlede* adgang policyerne giver reelt er den tilsigtede, især på tabeller
med en token/hemmeligheds-kolonne, hvor selv en enkelt for bred SELECT-
policy er nok til at underminere hele sikkerhedsmodellen.

---

# ✅ 17. sept. 2026 — recipes' fremmednøgler mod auth.users manglede også en ON DELETE-regel

Opdaget under en manuel oprydning af 7 test-brugere direkte i Supabase (se
afsnittet nedenfor for den oprindelige `public.users`-fejl). Da brugere
slettet direkte fra `public.users` IKKE automatisk sletter den tilhørende
`auth.users`-række (det kræver Admin API'et, `auth.admin.deleteUser()`, som
kun `delete-user` Edge Function kalder), stod de 7 konti tilbage i
`auth.users` og blokerede gensignup på samme email ("Denne email er
allerede registreret"). De blev slettet manuelt fra `auth.users` — men det
afslørede at `recipes.submitted_by` og `recipes.reviewed_by` referencer
`auth.users` DIREKTE (ikke `public.users`, i modsætning til stort set alle
andre tabeller) med `NO ACTION` og ingen oprydning nogen steder.

**Reel konsekvens:** `delete-user` Edge Function'en (app'ens rigtige "Slet
konto"-flow) rører kun `public.*`-tabeller og slutter med
`supabase.auth.admin.deleteUser(uid)` — den ville fejle på PRÆCIS samme
måde for enhver bruger der nogensinde har indsendt eller fået godkendt en
opskrift, uden nogen af `delete-user`s egne oprydningstrin kunne forhindre
det (ingen af dem rører `recipes`). Kontosletning ville simpelthen fejle
uden en oplagt årsag i fejlbeskeden.

Rettet: begge sat til `ON DELETE SET NULL` (verificeret nullable først).
Ingen af de 7 slettede test-konti havde faktisk nogen `recipes`-rækker, så
selve oprydningen krævede ikke denne rettelse — men den lukker et reelt,
tidligere udækket hul i selve kontosletnings-flowet.

---

# ✅ 17. sept. 2026 — Manglende ON DELETE-regler på users-fremmednøgler rettet

Fundet ved at brugeren forsøgte at slette test-brugere direkte i Supabase
Table Editor og fik en fremmednøgle-fejl fra `shopping_list_items` (kolonnen
`added_by`, som ikke havde nogen `ON DELETE`-regel). Verificeret mod hele
skemaet (`information_schema.referential_constraints`) at to nullable
attributions-kolonner (ikke ejerskab) manglede en regel:

- `shopping_list_items.added_by` — hvem tilføjede varen
- `submissions.reviewed_by` — hvilken admin godkendte/afviste indsendelsen

Begge sat til `ON DELETE SET NULL` (samme mønster som `family_invites.
accepted_by` allerede brugte) — sletter man den refererede bruger, mister
rækken kun attributionen, den forsvinder eller blokerer ikke sletningen.
`delete-user` Edge Function'en sletter selv `shopping_list_items` eksplicit
før den når `users`-sletningen, så app-flowets adfærd er uændret — dette er
et sikkerhedsnet for direkte sletning i Supabase Table Editor (som ikke går
gennem Edge Function'en), og lukker et hul `submissions.reviewed_by` aldrig
havde dækning for (en admin med gennemgåede indsendelser kunne ikke slettes,
hverken via appen eller manuelt, uden denne rettelse).

De tre andre allerede-kendte `NO ACTION`-fremmednøgler mod `users`
(`families.created_by`, `family_memberships.user_id`,
`shopping_list_access.user_id`) er bevidst IKKE ændret på DB-niveau —
`delete-user` håndterer dem allerede eksplicit (nulstiller/sletter), og de
kræver en dedikeret vurdering af om `SET NULL` eller `CASCADE` er den
rigtige semantik, før DB-skemaet ændres til at matche.

---

# ✅ 17. sept. 2026 — RLS performance-advisories rettet (Supabase, ingen kodeændring)

Del af "Topprioritet til næste session"-punktet om RLS-performance-
advisories fra CLAUDE.md. Anvendt direkte mod det live Supabase-projekt via
migrationer (ingen filer i dette repo ændret — se `mcp__Supabase__apply_migration`-
historikken for de nøjagtige migrationer):

- **`auth_rls_initplan` (94 policies)**: hver policy der kaldte `auth.uid()`/
  `auth.jwt()` direkte i `USING`/`WITH CHECK` fik funktionskaldet pakket ind i
  `(select auth.uid())`/`(select auth.jwt())`, så Postgres evaluerer det ÉN
  gang pr. forespørgsel i stedet for én gang pr. række (Supabase-anbefalet
  mønster). Genereret automatisk fra `pg_policies` og anvendt som ét samlet
  `ALTER POLICY`-batch — verificeret ren adfærdsændring (samme autorisation,
  kun performance), alle 95 tests stadig grønne.
- **`unindexed_foreign_keys` (28 stk.)**: tilføjet dækkende index på hver
  fremmednøgle-kolonne uden ét (fx `family_memberships.user_id`,
  `shopping_list_items.list_id`).
- **`no_primary_key`**: `products_backup` (19.868 rækker, ubrugt i
  applikationskoden — ren snapshot-tabel) manglede primærnøgle på `id`.
  Verificeret ingen NULL/duplikerede `id`-værdier først, derefter tilføjet
  `PRIMARY KEY (id)`.

**Bevidst IKKE rettet** (for risikabelt til automatisk bulk-fix uden
per-tabel gennemgang):
- **`multiple_permissive_policies` (66 stk.)**: flere overlappende
  permissive policies på samme tabel/rolle/handling (fx `family_invites` har
  4 forskellige INSERT-policies for `authenticated`). At konsolidere dem
  kræver at forstå hvorfor de historisk blev duplikeret (er de reelt
  identiske, eller dækker de subtilt forskellige cases?) — tag denne op som
  en dedikeret opgave, tabel for tabel.
- **`unused_index` (37 stk. efter denne omgang — inkl. de 28 nye)**: nye
  indekser starter altid som "ubrugte" indtil de rammes af en forespørgsel,
  så tallet er ikke sammenligneligt før om et stykke tid. De oprindelige 9
  er heller ikke fjernet — kræver længere observationsvindue for at være
  sikker på de reelt aldrig bruges, fremfor blot sjældent.

---

# ✅ 16. sept. 2026 — 4 nye huller fundet ved rescue-audit, rettet samme dag

Fundet under en frisk, uafhængig re-audit (artifact:
https://claude.ai/artifact/EvHQTrmjF1XjJEbuFzWFed) — ingen af dem dækket af
den oprindelige gennemgang nedenfor eller af `security-check`s baseline.

- **`allergens`s save-path** (`save && product_id`): krævede kun login, ikke
  admin, før den overskrev et VILKÅRLIGT produkts `allergen_flags` direkte i
  produktion. Rettet: kræver nu `role === "admin"` (samme mønster som
  `submissions`), medmindre kaldet er internt (auto-reparse via
  service-role). Deployet som `allergens` v12.
- **`shopping`s IDOR på listepunkter**: PATCH/DELETE tjekkede adgang mod
  `listId`, men muterede kun på `.eq("id", itemId)` — en bruger med sin egen
  liste kunne derved ramme et punkt der reelt hørte til en ANDEN brugers
  liste. Rettet: tilføjet `.eq("list_id", listId)` til begge kald. Deployet
  som `shopping` v15.
- **`auto-reparse` manglede helt et auth-tjek** — eneste interne cron-
  funktion uden det (i modsætning til `weekly-digest`/`send-email`). Enhver
  kunne uautoriseret POST'e `{manual:true, limit:200}` og tvinge op til 200
  betalte Claude-kald + bulk-overskrive `allergen_flags`/`allergen_quality`.
  Rettet: kræver nu enten service-role-bearer (cron) eller en indlogget
  admin (AdminScreens manuelle "reparse nu"-knap). Deployet som
  `auto-reparse` v5.
- **`send-push` tjekkede kun login, ikke push-MÅLET** — enhver indlogget
  bruger kunne sende vilkårligt indhold til en vilkårlig andens `user_id`
  (phishing). Rettet med en relations-tjek: tilladt hvis kalderen sender til
  sig selv, er admin, eller deler familiegruppe med målet (via `family_group`-
  RPC'en) — dækker de tre reelle brugsflows (selv-notifikation,
  admin-godkendelse af indsendelser, familie-invitations-accept). Deployet
  som `send-push` v5.
- **`log_missing_ean(text)` RPC var `SECURITY DEFINER` og kaldbar af helt
  anonyme (`anon`) brugere** — fundet via Supabase-advisor-scan, ikke
  dækket af den tidligere RPC-eksponerings-oprydning nedenfor. Ingen
  frontend-kode kalder den direkte (kun serverside fra `products`-
  funktionen via service-role) — revoked fra `public`/`anon`, grant kun til
  `authenticated`/`service_role`. Verificeret med `has_function_privilege()`.

Roadmap'ets øvrige tre faser (bekræftede bugs, arkitektur-oprydning,
backlog) er stadig åbne — se artefaktet for fuld status.

---

# 🚨 TOP PRIORITET — ubeskyttede Supabase Edge Functions

**Status:** ✅ Løst og deployet 2026-09-08. Alle fem funktioner
(`history`, `shopping`, `submissions`, `family`, `admin`) har fået
`auth.getUser()`-verifikation plus ejerskabs-/medlemskabs-/rolletjek,
er merget via [PR #123](https://github.com/janfogde-sketch/Allergi-Scan/pull/123)
og deployet live til `jegrpcflyguadyxialkm`
(`history` v6, `shopping` v7, `submissions` v9, `family` v6, `admin` v13).
Verificeret ved at hente hver funktions kildekode direkte fra Supabase
efter deploy.

**Opdatering 2026-09-09 — resten af listen lukket:**
- ✅ `allergens` har nu samme `auth.getUser()`-verifikation som de andre
  fem — med en undtagelse for vores eget `auto-reparse`-cronjob, som
  identificerer sig med service-role-nøglen (kun kendt af vores egen
  infrastruktur) i stedet for en bruger-session.
- ✅ `deleteOwnAccount()` går nu via `delete-user`-funktionen (udvidet til
  at tillade selv-sletning, ikke kun admin-sletning af andre) i stedet for
  manuelt at slette tabel for tabel — en "slettet" konto kan derfor ikke
  længere logge ind bagefter, fordi `auth.users`-identiteten nu rent
  faktisk slettes med.
- **Bevidst IKKE gjort:** `verify_jwt` er stadig `false` på gateway-niveau
  for alle Edge Functions. Vurderet men fravalgt for nu — at slå det til
  projektbredt kræver at gennemgå hver enkelt funktions faktiske kaldere
  (inkl. interne server-til-server-kald som `auto-reparse`s kald til
  `allergens`, og eventuelle helt offentlige funktioner) for ikke at
  bryde noget live, og det er ikke undersøgt grundigt nok her til at
  gøre det trygt. Den reelle sårbarhed (data tilgængelig uden login) er
  lukket via funktionernes egen `auth.getUser()`-kode; `verify_jwt` ville
  være et ekstra forsvarslag, ikke den primære beskyttelse.

**Opdatering 2026-09-09 — relateret fund og løsning:** `auth.uid() = NULL`-bugget
(se `src/ROADMAP.md` "Kendte issues") viste sig at skyldes at projektets JWT-nøgle
brugte ES256 (P-256), som PostgREST ikke verificerer korrekt. Løst ved at
rotere til en RS256-signeringsnøgle via Dashboard (Project Settings → JWT
Keys), verificeret med en engangs-testbruger (`auth.uid()` returnerede nu
korrekt brugerens ID). De tre tabeller der havde fået midlertidige
"luk op for alt"-policies (`temp_read`/`temp_write`) som workaround for
bugget — `family_invites`, `family_members`, `user_allergens` — har nu fået
rigtige ejerskabs-baserede RLS-policies igen.

## Problemet

Flere af `supabase/functions/*` bruger `SUPABASE_SERVICE_ROLE_KEY` (fuld
database-adgang, ingen RLS) og stoler 100% på klient-leverede ID'er —
uden nogensinde at tjekke om den der ringer ind, faktisk ER den bruger
de påstår at være.

- **`history`** (bruges aktivt af appen via `useHistory.js`): hvem som helst
  kan læse eller slette **en hvilken som helst brugers** scanningshistorik
  ved blot at sende deres `user_id` som query-param. Intet login krævet.
- **`shopping`** og **`submissions`** (brugt af appen): samme mønster —
  `owner_id`/`added_by`/`submitted_by` tages direkte fra request-body uden
  verifikation.
- **Opdatering (fundet 2026-09-07, under gennemgang af
  produkt-opret/redigér-flowet):** `submissions` og `allergens` har det
  ikke bare "utjekket" — der er **intet `Authorization`-tjek overhovedet**
  i koden, ikke engang et forsøg på at læse en header. `allergens` (kaldes
  fra `useProduct.js` og `SuggestEditScreen.jsx` med rå ingrediens-tekst)
  eksponerer ikke andre brugeres data direkte, men er et helt åbent,
  ubegrænset kald ind til en betalt Vision/LLM-baseret Edge Function —
  hvem som helst kan spamme den og generere regning, uden login. Samme
  rettelse som nedenfor (tilføj `auth.getUser()`-verifikation, og for
  `allergens`: overvej minimum rate-limiting selv med login) lukker
  begge dele.
- **`family`** (ikke kaldt af nuværende klientkode, men stadig deployeret og
  offentligt tilgængelig hvis den ligger live på Supabase): **intet
  adgangstjek overhovedet** — læs/opret/redigér/slet familiedata for
  enhver bruger.
- **`admin`** (heller ikke kaldt af nuværende klientkode, men samme
  eksponering hvis deployeret): forsøger at tjekke for admin-rolle, men
  gør det forkert — den læser brugerens ID direkte ud af JWT'en
  (`decodeJWT()`, kun base64-decode af payload) uden at verificere
  signaturen. En forfalsket token med en kendt admins ID snyder sig forbi.
- Projektets `supabase/config.toml` bekræfter: *"JWT-verifikation er slået
  fra på alle funktioner"* — så end ikke Supabases eget gateway-niveau
  sikkerhedstjek er aktivt som ekstra lag.

**Hvorfor det haster:** Dette er appens **live** Supabase-projekt.
Allergidata er følsomme helbredsoplysninger. Lige nu kan de i praksis
læses/ændres/slettes af hvem som helst med et gættet/kendt bruger-ID,
uden at logge ind i appen overhovedet.

## Den korrekte løsning findes allerede i koden

`supabase/functions/delete-user/index.ts` gør det **rigtigt**: den opretter
en separat Supabase-klient med brugerens egen `Authorization`-header og
kalder `userClient.auth.getUser()`, som verificerer JWT'en kryptografisk
mod Supabase Auth — først derefter stoles der på hvem brugeren er.

## Hvad der mangler for at lukke hullet

1. ✅ Tilføjet samme `auth.getUser()`-verifikation til `history`, `shopping`,
   `submissions`, `family` og `admin` — samt tjek af at det
   verificerede bruger-ID matcher det ressource-ejer-ID der forsøges
   tilgået (eller at brugeren har `role === "admin"`, hvor det er
   relevant).
2. ✅ Rettet `admin/index.ts`'s `decodeJWT()` til at bruge samme
   `auth.getUser()`-mønster i stedet for at stole på en uverificeret
   base64-decode.
3. Overvejet at slå `verify_jwt` til i `supabase/config.toml` (og i
   Dashboard) for funktioner der ikke specifikt har brug for at være
   offentligt tilgængelige uden login. **Bevidst fravalgt for nu** — se
   opdateringsnoten øverst.
4. ✅ Deployet til det live Supabase-projekt via Supabase MCP'ens
   `deploy_edge_function` (2026-09-08 og 2026-09-09).
5. ✅ `useAdmin.js`'s `deleteOwnAccount()` går nu via `delete-user`-funktionen
   (udvidet til at tillade selv-sletning), som også sletter
   `auth.users`-identiteten — ikke længere kun rækker i `public.*`.
6. ✅ `allergens` havde intet auth-tjek overhovedet (åbent, ubegrænset kald
   ind til en betalt AI-funktion). Fået samme `auth.getUser()`-verifikation
   som de øvrige, med undtagelse for `auto-reparse`s interne kald (se
   opdateringsnoten øverst). Rate-limiting selv for indloggede brugere er
   stadig ikke bygget — overvej hvis misbrug bliver et problem i praksis.

## Hvor dette blev fundet

Under en session der bad om et "Supabase-sikkerhedstjek" (2026-09-06).
Ingen kode blev rettet endnu — brugeren bad eksplicit om at gemme dette
som topprioritet til en anden session, i stedet for at rette det med det
samme.

---

# Hardcoded anon-nøgle i tre database-funktioner

**Status:** ✅ Løst og deployet 2026-09-08. Nøglen er flyttet til en Vault-secret
(`SUPABASE_ANON_KEY`) og alle tre funktioner (`send_welcome_email`,
`send_submission_email`, `send_ticket_email`) er opdateret til at læse den
derfra via `vault.decrypted_secrets`. Verificeret: ingen af de tre
funktioner indeholder længere nøglen i klartekst
(`pg_get_functiondef()` tjekket efter ændringen).

Fundet 2026-09-07 under kortlægning af databaseskemaet (i forbindelse med
planlægning af et separat dev-miljø, se `src/ROADMAP.md`).

## Problemet

`send_welcome_email`, `send_submission_email` og `send_ticket_email` (alle
tre `SECURITY DEFINER`-funktioner i `public`-schemaet, kaldt som triggers
ved bruger-oprettelse/statusændringer) kalder appens `send-email` Edge
Function via `net.http_post(...)` — og har **Supabase anon-nøglen skrevet
direkte i funktionens kildekode** som `Authorization: Bearer ...`-header,
i stedet for at læse den fra en secret/miljøvariabel.

Da funktionens kildekode kan læses af enhver med databaseadgang (fx via
`pg_get_functiondef()` — sådan blev den fundet), er nøglen reelt synlig
for alle med et connection til projektet, ikke kun for den der oprindeligt
satte den op.

## Hvorfor det er en risiko

Anon-nøglen er i forvejen offentlig (den ligger også hardcoded klient-side
i `src/constants.jsx`, hvilket er normalt og sikkert for en anon-nøgle
beskyttet af RLS) — så denne konkrete forekomst er ikke i sig selv en
lækage af noget der ikke allerede er offentligt. Men mønstret (hemmeligheder
skrevet direkte ind i funktionskode i stedet for som secrets) er skrøbeligt:
hvis nøglen nogensinde roteres, eller hvis et lignende mønster senere bruges
med en *rigtig* hemmelighed (fx en service-role-nøgle), er den svær at finde
og opdatere, og optræder i klartekst i eventuelle backups/logs af funktionsdefinitionen.

## Anbefalet rettelse

Flyt nøglen til en Supabase Vault-secret (`vault.create_secret(...)`) eller
en projekt-secret tilgået via `current_setting('app.settings.anon_key')`,
og opdatér de tre funktioner til at læse derfra i stedet for at have værdien
i klartekst.

**Opdatering 2026-09-08:** kan nu rettes direkte via Supabase MCP'ens
`apply_migration`/`execute_sql` — kræver ikke længere at afvente
dev-miljøet. Afventer kun din accept, da det ændrer live
databasefunktioner.

---

# App viser "logget ind" uden reelt at være det

**Status:** ✅ Løst 2026-09-09.

Fundet af brugeren under den igangværende JWT-nøglerotation: appen kunne
vise Hjem-skærmen som om man var logget ind, selvom sessionen reelt ikke
var gyldig længere.

## Problemet

`App.jsx` afgjorde hvilken skærm der vises ved opstart udelukkende ud fra
om der lå en tekststreng i `localStorage` (`as_token`) — uden nogensinde
at spørge Supabase om tokenet stadig var gyldigt. Kombineret med at den
automatiske token-fornyelse i `useAuth.js` gav stille op efter 3 fejlede
forsøg (uden at logge brugeren ud), kunne en bruger med et udløbet/ugyldigt
token sidde fast på Hjem-skærmen tilsyneladende logget ind, mens alle
rigtige API-kald i baggrunden fejlede.

## Rettelsen

`useAuth.js` verificerer nu et gemt token ved opstart via et rigtigt kald
til Supabase (`GET /auth/v1/user`). Hvis det er ugyldigt, forsøges en
øjeblikkelig fornyelse; lykkes heller ikke det, ryddes sessionen og
brugeren sendes til Velkomst-skærmen — i stedet for at blive stående på en
skærm der lyver om login-status. Netværksfejl (fx offline) logger ikke
brugeren ud — kun et reelt "ugyldigt token"-svar fra Supabase gør.
