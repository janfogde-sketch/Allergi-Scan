# 🚨 TOP PRIORITET — ubeskyttede Supabase Edge Functions

**Status:** Uløst. Fundet under en Supabase-sikkerhedsgennemgang, endnu ikke rettet
eller deployet. Skal løses i en kommende session.

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

1. Tilføj samme `auth.getUser()`-verifikation til `history`, `shopping`,
   `submissions`, `family` og `admin` — og tjek desuden at det
   verificerede bruger-ID matcher det ressource-ejer-ID der forsøges
   tilgået (eller at brugeren har `role === "admin"`, hvor det er
   relevant).
2. Ret `admin/index.ts`'s `decodeJWT()` til at bruge samme
   `auth.getUser()`-mønster i stedet for at stole på en uverificeret
   base64-decode.
3. Overvej at slå `verify_jwt` til i `supabase/config.toml` (og i
   Dashboard) for funktioner der ikke specifikt har brug for at være
   offentligt tilgængelige uden login.
4. Efter rettelse: deploy ændringerne til det live Supabase-projekt med
   `supabase functions deploy <navn>` (kræver `supabase login` + adgang
   til projektet — kunne ikke gøres fra denne session).
5. Overvej samtidig: `useAdmin.js`'s `deleteOwnAccount()` sletter kun
   rækker i `public.*`-tabeller — den kalder aldrig noget der reelt
   sletter `auth.users`-identiteten. En bruger der "sletter sin konto"
   kan formentlig stadig logge ind bagefter. Værd at rette i samme omgang
   (fx udvid `delete-user`-funktionen til at tillade selv-sletning, ikke
   kun admin-sletning af andre).

## Hvor dette blev fundet

Under en session der bad om et "Supabase-sikkerhedstjek" (2026-09-06).
Ingen kode blev rettet endnu — brugeren bad eksplicit om at gemme dette
som topprioritet til en anden session, i stedet for at rette det med det
samme.

---

# Hardcoded anon-nøgle i tre database-funktioner

**Status:** Uløst. Fundet 2026-09-07 under kortlægning af databaseskemaet
(i forbindelse med planlægning af et separat dev-miljø, se ROADMAP.md).

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
i klartekst. Bør gøres samtidig med at dev-miljøet sættes op (samme session
hvor skemaet alligevel skal gennemgås), men er ikke i sig selv blokerende
for noget andet arbejde.
