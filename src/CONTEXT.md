# EatSafe — CONTEXT.md

> **Sidst opdateret:** 11. september 2026
> **Opdateres ved større ændringer. Deles med AI-assistenter som sessionskontekst.**
> **Se også `/CLAUDE.md`** i repo-roden — den samler projektoverblik, arkitektur og
> vores arbejdsgang ét sted, og linker hertil for fuld teknisk detalje.

---

## 1. Projekt-overblik

**EatSafe** er en dansk allergen-scanning PWA rettet mod forbrugere med fødevareallergier og -intolerancer. Brugere scanner stregkoder, og appen matcher ingredienser mod deres allergiprofil og viser klare advarsler.

| Nøgle | Værdi |
|-------|-------|
| URL | https://eatsafe.dk |
| GitHub | janfogde-sketch/Allergi-Scan |
| Branches | `main` (produktion) · `dev` (udvikling) |
| Supabase projekt-ID | jegrpcflyguadyxialkm |
| Supabase URL | https://jegrpcflyguadyxialkm.supabase.co |
| Vercel | Auto-deploy på både `main` og `dev` |
| Admin bruger | janfogde@gmail.com (`404caa7f-91b0-4bad-a2a8-bcb6a396d35f`) |
| Kontakt email | hej@eatsafe.dk (oprettes hos One.com) |

---

## 2. Tech stack

| Lag | Teknologi |
|-----|-----------|
| Frontend | React 18 + Vite 5, JSX (ikke TSX) |
| Hosting | Vercel (auto-deploy fra GitHub) |
| Backend | Supabase (PostgreSQL, Edge Functions, Auth, Storage) |
| Edge Functions | Deno/TypeScript — JWT verification DISABLED (ES256-inkompatibilitet) |
| AI | Claude Haiku 4.5 (allergen-fallback + OCR), ANTHROPIC_API_KEY som Supabase secret |
| Ekstern data | Open Food Facts API v2, TheMealDB |
| Lokal dev | Windows, `C:\Users\janfo`, `set`-syntaks for env vars |

---

## 3. Filstruktur

```
src/
├── App.jsx                   # Routing, global state, lookupProduct, alle handlers
├── constants.jsx             # ALLERGENS, SCREENS, DIETS, E_NUMBERS, SUPABASE_URL/ANON_KEY, uid
├── helpers.js                # compareAllergens, extractENumbers, compareENumbers,
│                             #   checkDietCompatibility, initials, getAllergenLabels,
│                             #   verifiedBadge, makeHeaders, apiCall, timeAgo,
│                             #   traceId, traceLog, getTraceLog, clearTraceLog
├── theme.jsx                 # CSS-variabler, injectTheme(), ThemeStyle komponent
├── SharedComponents.jsx      # Icon, IngredientsList (med onIngredientTap),
│                             #   ProfileBadges, getProductIcon, ProductImage, EatSafeLogo
│
├── — Hooks —
├── useScanner.js             # Kamera, auto-zoom, tap-to-focus, lommelygte,
│                             #   scanFromGallery, scanPhotoForEan (foto-fallback)
├── useAlternatives.js        # Sikre alternativer ved farlige produkter
│                             #   Kategori-match → overkategori fallback → filtrér allergen-profil
├── useMadpas.js              # Madpas speak-funktion + madpasSpeaking/WaiterView state
├── useSearch.js              # Søgning via Edge Function med 350ms debounce
├── useAdmin.js               # Admin CRUD (brugere, submissions, tickets)
├── useRecipes.js             # Opskrifter CRUD
├── useShoppingList.js        # Indkøbsliste + Supabase Realtime WebSocket sync
│
├── — Screens (routing via App.jsx) —
├── ScannerScreen.jsx         # Router + HOME screen
├── ResultScreen.jsx          # RESULT — scan-resultat, alternativer, allergen-match,
│                             #   ingrediens-tap→leksikon, E-nummer chips, næring
├── NotFoundScreen.jsx        # NOTFOUND — 5-trins produkt-indsend flow
├── SubmittedScreen.jsx       # SUBMITTED — tak-skærm efter indsendelse
├── SearchScreen.jsx          # SEARCH — søgning + profil/manuel allergen-filter
├── ListScreen.jsx            # LIST — indkøbsliste + favoritter
├── SuggestEditScreen.jsx     # SUGGEST_EDIT — foreslå rettelse til produkt
├── ProfileScreen.jsx         # PROFILE, EDITPROFILE, FAMILY, HISTORY, FAVORITES, ADMIN
│                             #   Footer: hej@eatsafe.dk + privatlivspolitik link
├── ProfileMenu.jsx           # Slide-out menu fra højre (åbnes via hamburger-ikon i
│                             #   topbar) — profil-hero + links til Favoritter, Familie,
│                             #   Scanningshistorik, Opskrifter, Viden, Madpas,
│                             #   Restaurantguide, Admin. Portal til document.body.
├── OnboardingScreen.jsx      # WELCOME, LOGIN, ONBOARD
├── KnowledgeScreen.jsx       # KNOWLEDGE — Leksikon
├── RecipesScreen.jsx         # RECIPES — opskrifter (gradient header)
├── MadpasScreen.jsx          # MADPAS (17 sprog) — strukturerede sektioner, kun on-device (intet link/QR/PDF)
├── AdminScreen.jsx           # Mobil admin-panel (via ProfileScreen)
│                             #   Tabs: Dashboard, Brugere, Indsendelser, Tickets,
│                             #         Debug, Manglende, Import
│
├── — Delte komponenter —
├── MemberForm.jsx            # MemberForm, CategorySelect
├── AllergenPicker.jsx        # AllergenPicker, ENumberPicker
├── FeedbackModal.jsx         # FeedbackModal med debug trace
│
├── — Desktop admin-panel (NY, 24. sept. 2026) —
├── admin/                    # Separat Vite-entrypoint på eatsafe.dk/admin.html
│   │                         #   (ikke en del af den mobile PWA's SCREENS-routing/
│   │                         #   bundle — egen React-rod, sidebar+tabel-layout til
│   │                         #   skærm/computer. Deler localStorage-session
│   │                         #   (as_token/as_refresh/as_user_id) med hovedappen.
│   │                         #   Genbruger useAdmin.js's data-lag som-is.
│   ├── main.jsx               # React-rod, injicerer adminTheme.js
│   ├── AdminApp.jsx            # Login-gate (rolle-tjek mod users.role) + router
│   ├── AdminLayout.jsx          # Sidebar-navigation + topbar
│   ├── useAdminAuth.js          # Standalone login (email+password, ingen signup/OAuth)
│   ├── adminTheme.js            # Desktop-specifik CSS (egen fra src/theme.jsx)
│   └── sections/                # DashboardSection, UsersSection, SubmissionsSection,
│                                 #   TicketsSection, MissingSection, ImportSection,
│                                 #   RecipesSection — desktop-tabel-versioner af de
│                                 #   tilsvarende Admin*Section.jsx-filer ovenfor
│
└── — Statiske sider (public/) —
    privacy.html              # Privatlivspolitik på eatsafe.dk/privacy
    invite.html               # Familie-invitation på eatsafe.dk/invite/[token]
    madpas-view.html          # Offentlig madpas-visning på eatsafe.dk/madpas/[token]
```

---

## 4. ⚡ ARKITEKTUR-REGEL — NYE SKÆRME BYGGES ALTID SOM EGNE FILER

**Alle nye skærme og større UI-sektioner skal fra starten bygges som selvstændige komponenter i egne filer.**

1. **Én screen = én fil.** Ny screen oprettes som `XxxScreen.jsx` fra dag ét
2. **Props frem for masse-state.** Lokalt state lever i screen-komponenten selv
3. **Ingen IIFE-patterns.** `{condition && (() => { ... })()}` er forbudt
4. **Ingen hooks i betinget kode.** React hooks altid øverst i komponenten
5. **Hooks til logik.** Al logik i dedikerede hooks — ikke inlined i App.jsx
6. **ScannerScreen er router.** Sub-screens er egne filer

---

## 5. Screens / Navigation

| SCREENS-konstant | Fil | Beskrivelse |
|-----------------|-----|-------------|
| HOME | ScannerScreen | Hjem |
| RESULT | ResultScreen | Scan-resultat + alternativer |
| NOTFOUND | NotFoundScreen | 5-trins indsendelse |
| SUBMITTED | SubmittedScreen | Tak-skærm |
| SEARCH | SearchScreen | Søgning |
| LIST | ListScreen | Indkøbsliste |
| SUGGEST_EDIT | SuggestEditScreen | Foreslå rettelse |
| PROFILE | ProfileScreen | Profil |
| FAMILY | ProfileScreen | Familie + invitationslink |
| KNOWLEDGE | KnowledgeScreen | Leksikon |
| RECIPES | RecipesScreen | Opskrifter |
| MADPAS | MadpasScreen | Madpas (kun on-device, intet link/QR) |

Bundmenu (opdateret sept. 2026): `Indkøbsliste (venstre) → Scan (midten, barcode-ikon)
→ Søg (højre)`. Profil, Familie, Favoritter, Historik, Opskrifter, Viden, Madpas,
Restaurantguide og Admin nås nu via et hamburger-menu-ikon i topbaren th., som åbner
`ProfileMenu.jsx` (slide-out fra højre). Se `/CLAUDE.md` afsnit 3 for detaljer og
begrundelse.

---

## 6. Database — vigtigste tabeller

| Tabel | Nøglefelter | Noter |
|-------|-------------|-------|
| `products` | id, ean, name, brand, allergen_flags (jsonb), allergen_quality, allergen_source_method, nutrition (jsonb), verified_status, source, ingredients_text | ~20.200+ |
| `users` | id, name, email, role, diets (jsonb) | |
| `user_allergens` | user_id, allergen_id | |
| `family_members` | id, user_id, name, allergens (jsonb), diets, e_numbers, family_owner_id | |
| `family_invites` | id, token, invited_by, accepted_by, status, expires_at | To-vejs deling, 24t expiry |
| `scan_history` | id, user_id, ean, status, scanned_at | |
| `product_submissions` | id, ean, name, status, submitted_by | |
| `shopping_lists` | id, owner_id, name, family_id | Realtime aktiveret |
| `shopping_list_items` | id, list_id, name, checked, added_by, added_at | Realtime aktiveret |
| `knowledge_base` | id, category, slug, title, summary, description, allergen_ids, risk_level | ~700 entries |
| `missing_ean_log` | ean, count, first_seen, last_seen | Auto-logget + auto-importeret |
| `recipes` | id, title, instructions, image_url | ~627 |

**`products.allergen_source_method` (25. sept. 2026 — forslag F fra
allergen-detektions-gennemgangen):** sporer HVORDAN de nuværende
`allergen_flags` blev beregnet, adskilt fra `allergen_quality` (som er
tillids-niveauet). Værdier: `keyword` (kun nøgleords-motoren), `keyword+
claude` (keyword + Claude-fallback/`force_ai`), `off_tags` (kun Open Food
Facts' egne `allergens_tags`/`traces_tags`, ingen `ingredients_text` at
køre keyword-motoren på), `off_tags+keyword` (OFF-tags flettet med
keyword-motoren mod `ingredients_text`, se afsnittet om `products`-Edge
Function ovenfor). `NULL` = ukendt/uverificeret herkomst — typisk den
oprindelige bilka/nemlig-import-pipeline (ikke i dette repo, se punktet om
data-provenance-gab i `.claude/HISTORY.md`) eller data der aldrig er rørt
af vores egne funktioner siden. Skrives af `auto-reparse`, `allergens`
(dens interne `save`-vej) og `products`' OFF-fallback-gem — IKKE af
`useAdmin.js`s admin-godkendelsesflows' egne direkte `PATCH`-kald mod
`products`, som nu (samme dato) også er rettet til at udlede
`allergen_quality` fra det FAKTISKE `method`-svar fra `allergens`-
funktionen i stedet for at hardkode `"high"` — et `force_ai:true`-kald der
stille fejler (fx manglende `ANTHROPIC_API_KEY`) returnerer `method:
"keyword"`, og det ville tidligere fejlagtigt være blevet gemt som `"high"`
alligevel.

**`users.role`-beskyttelse (24. sept. 2026, fundet under admin-audit):**
`users_update_own_or_admin`-policyen tillader `id = auth.uid()` (selv-
opdatering af egen profil) uden kolonne-begrænsning — og `authenticated`
har kolonne-UPDATE-ret på `role`. Uden yderligere beskyttelse kunne enhver
logget ind bruger derfor sætte sin egen `role` til `admin` via en almindelig
`PATCH /rest/v1/users?id=eq.<eget-id>`, og `on_user_role_change`-triggeren
ville automatisk synkronisere det ind i deres JWT `app_metadata.role` oveni.
Rettet med en `BEFORE UPDATE`-trigger (`prevent_role_self_escalation_trigger`
→ `prevent_role_self_escalation()`) der blokerer enhver ændring af `role`,
medmindre den kaldende bruger (`auth.uid()`) allerede er admin — verificeret
med en JWT-simuleret SQL-test at både blokeringen og admins fortsatte evne
til at ændre ANDRE brugeres rolle virker. Postgres RLS kan ikke i sig selv
begrænse per-kolonne, så en tilsvarende trigger bør overvejes for andre
tabeller med et lignende "selv-ejerskab uden kolonne-begrænsning"-mønster,
hvis en ny privilegeret kolonne nogensinde tilføjes til `users` eller andre
selv-redigerbare tabeller.

**Opfølgende sikkerhedsfund og -fix (25. sept. 2026, `security-check`-gennemgang):**
`get_advisors` fandt at tre `SECURITY DEFINER`-funktioner var direkte
kaldbare som RPC'er med et vilkårligt/tredjeparts-argument, ikke kun i den
tiltænkte interne kontekst (RLS-policies/triggere):
- **`family_group(p_uid uuid)`** — accepterede et VILKÅRLIGT `p_uid` og var
  `EXECUTE`-grantet til `authenticated`. Bruges legitimt af RLS-policies
  (kalder den med RÆKKENS ejer, ikke kalderen — nødvendigt for delt
  familie-synlighed) og af 5 Edge Functions (`shopping`, `history`,
  `family`, `send-push`, `favorites`) via en `service_role`-klient (hvor
  `auth.uid()` er `null`). Problemet: enhver logget-ind bruger kunne kalde
  `/rest/v1/rpc/family_group` direkte med en VILKÅRLIG andens uid og få
  deres familiegruppe (UUID-sæt) tilbage, uden selv at være medlem.
  **Fix:** funktionen filtrerer nu resultatet til kun at blive returneret
  hvis kalderen (`auth.uid()`) selv reelt er `p_uid` eller medlem af den
  beregnede gruppe, ELLER kaldet kommer fra `service_role` (Edge Functions).
  RLS-adfærd og Edge Function-kald er verificeret uændrede (5 JWT-simulerede
  SQL-tests: legitimt familiemedlem ser stadig gruppen, service_role-kald
  virker stadig, en urelateret tredjepart der kalder direkte får nu 0 rækker).
- **`is_admin(user_id uuid)`** — samme mønster, men ALLE faktiske brug
  (samtlige RLS-policies + `prevent_role_self_escalation`) kalder den kun
  med `auth.uid()` selv, aldrig en andens id. **Fix:** returnerer nu altid
  `false` medmindre `user_id` matcher kalderens egen `auth.uid()` — lukker
  muligheden for at enhver bruger kunne tjekke om en VILKÅRLIG andens konto
  er admin. Verificeret med to JWT-simulerede tests (self-tjek uændret,
  tredjeparts-tjek nu blokeret).
- **`prevent_role_self_escalation()`** — selve trigger-funktionen ovenfor
  var `EXECUTE`-grantet til `PUBLIC` (inkl. `anon`) og dermed listet som et
  kaldbart RPC-endpoint, selvom den kun er tiltænkt at køre som `BEFORE
  UPDATE`-trigger. Et direkte kald udefra ville sandsynligvis bare fejle
  (NEW/OLD er ikke sat uden for triggerkontekst), men den hørte ikke hjemme
  i den eksponerede API-overflade. **Fix:** `REVOKE EXECUTE ... FROM PUBLIC`
  — verificeret med `has_function_privilege` at `anon`/`authenticated`/
  `service_role` alle mistede direkte kaldeadgang, og at triggeren stadig
  er tilknyttet og aktiv på `users`-tabellen (triggerudløsning er ikke
  betinget af `EXECUTE`-grants, kun selve RPC-kaldbarheden er).

**Kendt, accepteret støj i `get_advisors` herefter:** `family_group` og
`is_admin` vil BLIVE VED med at optræde i `authenticated_security_definer_
function_executable`-listen — Supabases linter tjekker kun om `EXECUTE`
er grantet, ikke hvad funktionen reelt returnerer til hvem. `EXECUTE` skal
forblive grantet til `authenticated` for at RLS-policies (som selv kører
som denne rolle) kan evaluere dem. Datalækagen er lukket på logik-niveau
i funktionerne selv, ikke via grant-fjernelse. Antag ikke dette er et
overset fund ved en fremtidig `security-check`-kørsel uden at læse dette
afsnit først.

**Fjerde punkt fra samme gennemgang, samme dag: `pg_trgm`-extensionen lå i
`public`-skemaet** (Supabase-linter-advarslen "Extension in Public").
Verificeret før flytning at kun to indekser (`products_name_trgm_idx`,
`products_brand_trgm_idx` på `products.name`/`products.brand`, bruges til
at accelerere `ILIKE '%term%'`-søgning) afhænger af dens operator-klasse,
og ingen egen SQL-/Edge-function kalder dens `similarity()`/
`word_similarity()`-funktioner direkte. **Fix:** `ALTER EXTENSION pg_trgm
SET SCHEMA extensions` (Supabases forudoprettede, dedikerede extensions-
skema). Eksisterende indeks-definitioner er bundet via OID, ikke søgesti-
opslag, så de virker uændret efter flytningen — verificeret bagefter med
en rigtig `ILIKE`-søgning mod `products` (934 træf, uændret adfærd).

**Status efter denne gennemgang:** alle fire fundne punkter (family_group-
lækage, is_admin-lækage, trigger-eksponering, pg_trgm-placering) er rettet.
Resterende `get_advisors`-punkter er enten kendt/accepteret støj (se
ovenfor) eller kræver en brugerbeslutning uden for hvad et værktøj kan
rette (Leaked Password Protection, se `CLAUDE.md` afsnit 0) — ingen
yderligere handling ventende.

---

## 7. Edge Functions (Supabase)

| Funktion | Beskrivelse |
|----------|-------------|
| `products` | GET/POST/PATCH/DELETE produkt-CRUD + OFF fallback |
| `allergens` | Keyword-engine + Claude Haiku fallback |
| `ocr` | OCR: `ingredients` / `product_name` / `nutrition` / `ean_from_image` |
| `search` | Fuldtekst-søgning med scoring |
| `send-email` | Resend email — `type` er enten en Resend-skabelon (`welcome`/`submission_approved`/`submission_rejected`/`ticket_update`) eller `"raw"` (direkte `subject`+`html` i kaldet, ingen skabelon — til interne/dynamiske emails som `admin-digest`) |
| `auto-import-off` | **NY** — importerer fra OFF dagligt kl. 02:00 UTC via pg_cron |
| `admin-digest` | **NY** (17. sept. 2026) — ugentlig email til alle admins (`role='admin'`) med antal afventende indsendelser + åbne tickets, kun sendt hvis der reelt er noget. pg_cron mandag kl. 08:00 UTC (jobid 4) |
| `food-waste` | **I KØLESKABET** (17. sept. 2026) — tjekker om et EAN er nedsat pga. udløb i en nærliggende Netto/Føtex/Bilka, via Salling Groups officielle "Anti Food Waste"-API (`geo`-baseret opslag). Kræver bruger-login. Deployet og virker (testet live med `SALLING_API_TOKEN` sat) — men UI-knappen på `ResultScreen` er bevidst fjernet igen efter brugerens ønske. `useFoodWaste.js`-hooken ligger stadig i `src/`, klar til at blive genkoblet til en skærm når featuren skal genoptages — se punkt 13 |

---

## 8. Auto-import pipeline (OFF)

- **Edge Function:** `auto-import-off` — deployed og aktiv
- **Cron:** pg_cron — kører dagligt kl. 02:00 UTC
- **Manuel kørsel:** Admin → Import-tab → "Kør import nu"
- **Lokalt script:** `import_missing_eans.py` — kør med `--limit N` eller `--test-eans "EAN1,EAN2"`
- **Flow:** missing_ean_log → OFF API → products tabel → slet fra log
- **Pris:** $0 (ingen AI, ren OFF-import)

---

## 9. Familie-deling

- **Tabel:** `family_invites` (token, 24t expiry, to-vejs). RLS: `invited_by`/`accepted_by` kan SELECT egen række, kun `invited_by` kan INSERT, admin kan DELETE, og (26. sept. 2026) `invited_by` kan selv DELETE sin egen række mens `status='pending'` — nødvendigt for at "Annullér link"/"Annullér invitation" kan virke for en almindelig bruger.
- **Flow:** Profil → Familie → "Opret invitationslink" → send link → modtager åbner `eatsafe.dk/invite/[token]` → opretter konto → tilknyttes via `accept_family_invite()` RPC
- **`GET /functions/v1/family/group`** (26. sept. 2026) returnerer nu også hvert husstandsmedlems `allergens`/`custom`/`diets`/`eNumbers` (læst fra `user_allergens` + `users.diets`/`e_numbers`) — Familie-siden viser dermed scanningsrelevante chips for BÅDE administrerede profiler og rigtige konti, ikke kun de administrerede. Kun læsning, ingen redigeringsret følger med.
- **`POST /functions/v1/family/link-profile`** (26. sept. 2026, `{managed_member_id, target_user_id}`) — undgår dubletter når en person, der tidligere havde en administreret `family_members`-profil, senere får sin egen konto via invitation: overfører profilens allergener/kostpræferencer/E-numre til kontoen (overskriver) og sletter den administrerede profil. Kræver at caller ejer profilen OG at target er en del af callers husstand (accepteret invitation i begge retninger) — en eksplicit, bruger-initieret handling, ikke automatisk navne-matching.
- **Realtime indkøbsliste:** WebSocket på `shopping_list_items` — alle familiemedlemmer ser ændringer live. Familie-siden selv har ingen realtime-kanal — et periodisk tjek (hvert 12. sek.) mens man ser på fanen dækker "opdater automatisk ved accepteret invitation"-behovet uden en ny WebSocket-kanal til en sjælden hændelse.

---

## 10. Madpas (26.-27. sept. 2026 — redesignet, forenklet, herefter finpoleret)

Madpas' formål: en tjener, butiksansat, hotel- eller cafémedarbejder — IKKE
kun restaurantpersonale — skal kunne forstå de vigtigste kost-/allergi-
oplysninger på 2-3 sekunder — strukturerede sektioner (FOOD ALLERGIES/
INTOLERANCES/DIET, se `ALLERGENS[].type` for allergi/intolerance-skellet),
ikke én generisk liste, og en madpas der altid afspejler den VALGTE profils
AKTUELLE data (også kostpræferencer for et familiemedlem — fulgte tidligere
fejlagtigt altid den loggede bruger selv, rettet i App.jsx/useMadpas.js).

**To redesign-runder (26. sept. 2026), derefter en tredje forenklings-
runde samme dag** — se `.claude/HISTORY.md` for fuld dag-for-dag-detalje.
Runde 1-2 byggede et delings-link (token-baseret `madpas_links`-tabel +
`get_madpas_by_token()`-RPC + en offentlig statisk `public/madpas-view.html`-
side + QR-kode + PDF/print + en E-numre-synlighed-opt-in). **Runde 3 fjernede
al den infrastruktur igen** efter et eksplicit brugerkrav ("Link- og QR-
funktionalitet skal være helt fjernet") — `madpas_links`-tabellen og
`get_madpas_by_token()`-funktionen er droppet fra databasen (migration
`remove_madpas_link_sharing`, verificeret 0 rækker før drop), `public/
madpas-view.html` er slettet, `vercel.json`s `/madpas/:token`-rewrite er
fjernet, og PDF/print samt E-numre-visning på madpasset er også fjernet
(PDF/print var ikke eksplicit nævnt i runde 3-specifikationens
"behold"-liste — afklaret via en direkte bruger-forespørgsel, svar: fjern
den også). Madpas er nu udelukkende en on-device visning: vælg profil →
vælg sprog → se kompakt preview → "Vis til tjener" (fuldskærm) → evt. "Læs
højt"/oplæsning. Der er ingen ekstern deling, intet link, ingen offentlig
side, og ingen server-side madpas-specifik tilstand tilbage overhovedet.

**Oversættelses-hul fundet og rettet (runde 1):** `ALLERGEN_T` (per-sprogs
allergen-navne, `src/constants.jsx`) manglede `hvede`/`maelkeallergi`
helt — uden en sprog-nøgle faldt visningen tilbage til `ALLERGENS`' DANSKE
`a.label`, selv når madpasset var sat til fx engelsk. Samme hul fandtes i
`ALLERGEN_EXAMPLES` (runde 2). `madpasAllergenLabel()`/`madpasDietLabel()`/
`madpasAllergenExamples()` (useMadpas.js) er de fælles hjælpefunktioner, der
korrekt prioriterer `lang==="da" ? a.label : ALLERGEN_T[...]` — brug dem
ved fremtidige Madpas-ændringer i stedet for at genopfinde faldback-logikken.

**Hvert hensyn er sin egen informationsblok, ikke en delt liste (runde 4,
27. sept.):** `renderStaffView()` (MadpasScreen.jsx, omdøbt fra
`renderWaiterView` — funktionen er ikke kun for tjenere) viser hvert
allergen/fritekst-emne som sin EGEN blok (ikon + stort, fed navn — det
mest fremtrædende element på hele skærmen — derefter "Common examples:"
og en pr.-emne sikkerhedstekst), adskilt af whitespace i stedet for
skillelinjer i en fælles liste. Sikkerhedsteksten genereres nu ALTID pr.
enkelt emne (aldrig en kombineret "any of these ingredients"-sætning for
flere) og er samtidig gjort mere præcis: "...does not contain {name} OR
INGREDIENTS MADE FROM {name}." `madpasSafetyNote(name, lang)` i
useMadpas.js erstatter alle forekomster af `{name}` i
`MADPAS_SAFETY_NOTE_T`-skabelonen (kolon-baseret sætningsopbygning for
sprog med køns-/artikel-bøjning som tysk/fransk/spansk/italiensk/
portugisisk/polsk, direkte indsættelse for resten), alle 17 sprog.

**Ny, bevidst OPT-IN krydskontaminerings-advarsel (runde 4):** en toggle
("KRYDSKONTAMINERING") på selve Madpas-forsiden — default FRA, persisteret
i `localStorage` som `as_madpas_cross_contact` (App.jsx) — når den er
aktiveret, vises/oplæses ÉN kombineret sætning nederst i FOOD ALLERGIES-
sektionen: singular ("...cross-contact with milk...") ved ét hensyn,
plural ("...cross-contact with these allergens...") ved flere.
`madpasCrossContactNote(names, lang)` i useMadpas.js, `MADPAS_CROSS_
CONTACT_SINGULAR_T`/`MADPAS_CROSS_CONTACT_PLURAL_T` i constants.jsx.
Bevidst opt-in fordi EatSafe ikke selv må antage alvorlighedsgraden af
brugerens allergi — se toggle-beskrivelsesteksten i MadpasScreen.jsx.

**Korte fødevare-eksempler** (`ALLERGEN_EXAMPLES` i constants.jsx,
`madpasAllergenExamples()` i useMadpas.js) vises under hvert allergen/
relevant intolerance i fremvisningsskærmen — bevidst SMÅ og MUTED
sammenlignet med selve allergen-navnet, og mærket med et kort, oversat
"Almindelige eksempler:"/"Common examples:"-label (`MADPAS_EXAMPLES_LABEL_T`)
for aldrig at kunne forveksles med en komplet/garanteret liste.

**Oplæsning** — knappens tekst er selv oversat (`MADPAS_SPEAK_LABEL_T`/
`MADPAS_STOP_LABEL_T`, 17 sprog, fx da:"Oplæs"/en:"Read aloud") og er nu en
stor, fuld-bredde knap fast i bunden (runde 4, krav 8). `madpasSpeak()`
(useMadpas.js) oplæser nu pr. allergen: navn + den samme sikkerhedstekst
som vises på skærmen, plus krydskontaminerings-sætningen hvis aktiveret —
"Common examples" oplæses bevidst IKKE (gør beskeden unødigt lang).
Intolerancer nævnes samlet uden sikkerhedstekst, matcher den visuelle
opdeling.

**Footeren i fremvisningsskærmen viser INTET branding/dato længere**
(runde 4, krav 2 — "Fjern teksten EatSafe ... den har ingen funktion på
denne skærm") — kun den store oplæs-knap. CTA-knappen på selve Madpas-
forsiden hedder nu "Åbn madpas" (var "Vis til tjener"), og undertekstens
ordlyd er "Vis dine allergier og kosthensyn på det lokale sprog." (var
tjener-/butikspersonale-specifik) for at afspejle at Madpas bruges bredt
(restaurant, café, hotel, butik, takeaway).

**Diæter har nu samme type besked som allergier, ikke kun badges (runde
5, 27. sept.):** hvert diæt-hensyn (`DIETS` i constants.jsx: vegan,
vegetarian, pescetarian, gluten-free, keto) vises i fremvisningsskærmen
som sin egen blok (navn + en naturligt oversat "jeg spiser X, sørg for at
min mad ikke indeholder Y"-besked), samme layout som allergi-/
intolerance-blokkene. `madpasDietMessage(dietId, lang)` i useMadpas.js,
`MADPAS_DIET_MESSAGE_T` i constants.jsx (5 diæter × 17 sprog). Bevidst
blødere ordlyd for keto ("limit"/"begræns") end for de øvrige ("does not
contain"/"indeholder ikke") — keto er en præference, ikke en sikkerheds-
risiko. Sektionsoverskriften er samtidig ændret fra "DIET" til "DIETARY
REQUIREMENTS" (`MADPAS_SECTIONS_T.diet`, alle 17 sprog) for præcision.
Den kompakte forside-preview (`renderCompactPreview()`) viser fortsat
diæter som korte chips — kun selve fremvisningsskærmen fik den fulde
besked, som krævet.

**To mindre, isolerede rettelser (runde 5):** `ALLERGEN_T.soja.en.n`
viste tidligere "Soy / Soya" (to varianter samtidig) — rettet til blot
"Soya", det korrekte navn for MADPAS_LANGUAGES' "en"-variant (🇬🇧, en-GB).
`ALLERGEN_EXAMPLES.maelkeallergi` manglede "Whey"/"Valle" — tilføjet som
første ingrediens (alle 17 sprog), og `madpasAllergenExamples()`s
slice-grænse hævet fra 4 til 5 i useMadpas.js, da de 4 eksisterende
`products`-eksempler alene allerede fyldte den tidligere grænse.

**Sjette runde (samme dag) — ren visuel/spacing-polish, IKKE pushet/
merget** (se Vercel-kvote-reglen i afsnit 4 — rene design-ændringer skal
ikke deployes): spacing i `renderStaffView()` rundet til appens faste
skala (`itemBlock` 26→24px, `headline` 18→16px, krydskontaminerings-
blokkens `marginTop` 18→20px), typografisk hierarki finpudset (den
statiske "I am allergic to:"-headline nedtonet fra 19px/700/`--ink` til
14px/600/`--ink2`, så den ikke konkurrerer med allergen-navnet eller
sikkerhedsteksten; sikkerhedsteksten/diæt-beskeden opgraderet fra `--ink2`
til `--ink` for at styrke dens plads som prioritet #2), krydskontamine-
rings-advarslen på fremvisningsskærmen gjort en anelse lettere (700→600,
15→14.5px) så den forbliver sekundær i forhold til selve allergierne.
**Reel bund-scroll-sikring:** fremvisningsskærmens scrollbare område fik
mere bund-padding (32→40px) og footeren (Read aloud-knappen) fik
`env(safe-area-inset-bottom)` tilføjet til sin bund-padding (samme
etablerede mønster som `ProfileScreen.jsx`/bundnav) — verificeret
programmatisk (scroll til `scrollHeight`, mål afstand mellem sidste
tekstlinje og knappens top) at INGEN indhold nogensinde overlapper
knappen, uanset antal hensyn. Luk-/oplæs-/krydskontamineringstoggle-
knapperne er udtrukket fra rene inline-styles til nye CSS-klasser
(`.mp-close-btn`, `.mp-speak-btn`, `.mp-cc-toggle`/`.mp-cc-toggle-knob` i
theme.jsx) udelukkende for at kunne give dem samme tryk-feedback
(`:active{transform:scale(.97)}`) som resten af appens knapper —
`.mp-big-btn` manglede den samme feedback og er tilføjet til den delte
liste. Verificeret med Playwright på flere scenarier (5 allergier +
intolerance + diæt scrollet helt til bunds, tysk oversættelse på mindste
understøttede skærmstørrelse iPhone SE) — ingen tekst-overlap, ingen
horisontal overflow ved længere oversættelser. **Fundet, men bevidst IKKE
rettet i denne runde (uden for scope):** tyske substantiver i sikkerheds-
teksten (`Milch`/`Erdnüsse`) vises med lille forbogstav, fordi
`madpasSafetyNote()` altid kalder `.toLowerCase()` på navnet — grammatisk
ukorrekt på tysk (substantiver skal stå med stort), men brugerens denne
runde var eksplicit afgrænset til spacing/hierarki/scroll/safe-areas/
mikrointeraktioner, ikke sprogfejl. Tag fat i det i en fremtidig
sprog-/oversættelses-fokuseret runde.

---

## 11. CSS-konventioner

- Al CSS bor i `theme.jsx` (`appCss`-strengen), injiceret via `<style>{appCss}</style>` i `App.jsx` — ingen separate `.css`-filer
- **Ingen hardkodede farver i screen-komponenter** — kun CSS-variabler
- `paddingBottom:120` på alle screen-divs
- Grønne primærknapper: `color:#071510`
- Farvesystem: `--green`=success/CTA, `--blue`=navigation, `--amber`=advarsel, `--red`=fare

---

## 12. Konventioner

- **`// @ts-nocheck`** øverst i alle `.jsx`-filer
- **React Hooks** — aldrig i IIFE, betinget kode eller loops
- **Windows env:** `set KEY=value` (ikke `export`)
- **`submissions`** er aktiv tabel

---

## 13. Kendte åbne punkter

| Punkt | Note |
|-------|------|
| hej@eatsafe.dk | Oprettes hos One.com inden beta |
| Leksikon 1000+ entries | Planlagt — separat session (pt. ~700 entries) |
| Madspild-tilbud ("i køleskabet") | `food-waste`-Edge Function virker (verificeret live 17. sept. 2026 med `SALLING_API_TOKEN` sat), men UI-indgangen er bevidst fjernet fra `ResultScreen.jsx` igen efter brugerens ønske ("put den i køleskabet"). Genoptag ved at importere `useFoodWaste` (`src/useFoodWaste.js`) i en skærm igen og gencoble knap+resultat-visning (se git-historik for `src/ResultScreen.jsx` omkring 17. sept. 2026 for den oprindelige UI-kode) |
| Desktop admin — nye funktioner | Shellet (`src/admin/`) + alle eksisterende faner (Dashboard/Brugere/Indsendelser/Tickets/Manglende/Import/Opskrifter) er bygget og shippet 24. sept. 2026. **Produkt-database direkte** (ny "Produkter"-fane, `src/admin/sections/ProductsSection.jsx`) er også shippet 24. sept. 2026 — søg på navn/brand/EAN (eller se seneste opdaterede uden søgeord, da `products` har 20.000+ rækker), redigér navn/brand/kategori/ingredienstekst/allergen_flags/verificeringsstatus direkte, slet produkt (kan fejle med en synlig FK-fejl hvis produktet stadig er refereret fra fx en indkøbsliste/scanningshistorik/ændringslog — bevidst ikke cascade-slettet automatisk). Kun på desktop, ikke porteret til mobil-admin. **Leksikon-CRUD** (ny "Leksikon"-fane, `src/admin/sections/KnowledgeSection.jsx`) er også shippet 24. sept. 2026 — søg/filtrér på kategori (allergen/e_number/ingredient/diet/cross_reaction/faq/fun_fact — DB check-constraint), opret/redigér/slet `knowledge_base`-entries (titel, slug med auto-generering fra titel ved oprettelse, emoji, resumé, beskrivelse, sundhedsnoter, risikoniveau, sortering, tilknyttede allergener som klikbare chips, og 6 frie liste-felter som kommasepareret tekst: found_in/alternatives/diet_tags/aliases/tags/sources). RLS tillader allerede admin-skriv direkte (ingen Edge Function nødvendig). Kun på desktop. **Ændringshistorik** (ny "Historik"-fane, `src/admin/sections/HistorySection.jsx`) er også shippet 24. sept. 2026 — read-only visning af `revision_log`, filtrérbar på oprettet/opdateret, produkt- og bruger-navne slås op i to batch-kald efter hovedlisten (ingen FK-embed tilgængelig for changed_by). **Brugere-redigering** (`UsersSection.jsx`, samme dag) er udvidet til at dække ALT bundet til brugeren, inkl. allergener — krævede en RLS-migration (`admin_can_write_user_allergens`) der tilføjer `is_admin()`-OR-betingelse til `user_allergens`s INSERT/UPDATE/DELETE-policyer (SELECT tillod allerede admin-læsning, men skriv var kun ejeren/familiemedlem-ejeren); samme slet-og-bulk-indsæt-mønster som `ProfileScreen.jsx` bruger for sig selv. Familiemedlemmers allergener ligger ikke i `user_allergens` (kun brugerens egne, `family_member_id is null`) og er ikke omfattet. Kun på desktop. **Bulk-handlinger** (Indsendelser-fanen, samme dag) — afkrydsningsbokse på pending-visningen + "Godkend valgte"/"Afvis valgte". Bevidst en SLANKERE parallel-implementation, ikke et loop der genbruger `updateSubmissionAndApprove`/`rejectSubmission` (de sluger deres egne fejl internt og viser individuelle toasts/lukker modaler, hvilket ville gøre det umuligt at tælle reelle succes/fejl på tværs af en batch) — sender ikke navn/brand-override (kun ingredienstekst fra OCR; Edge Function'en patcher kun felter der rent faktisk sendes) og springer push-notifikationer over for hastighed; AI-reparse'en efter hver godkendelse sikrer stadig korrekte allergen_flags. Kun på desktop. **Rigere dashboard/analytics** (`DashboardSection.jsx`, samme dag) — to søjlediagrammer (scanninger/dag, nye brugere/dag, seneste 14 dage) under stat-gridet. Ingen graf-bibliotek — rene CSS/HTML-søjler, én sekventiel farve pr. serie (grøn/blå, appens egne tokens), native `title`-attribut som hover-tooltip. PostgREST har ingen GROUP BY-dag, så `loadAdminStats` henter de rå `scanned_at`/`created_at`-rækker for perioden (kun de to felter, billigt) og bucketter dem selv i JS (`bucketByDay`-helper) — tomme dage fyldes med 0 så grafen altid har præcis 14 punkter. Kun på desktop. **CSV-eksport** (`src/admin/csvExport.js`, samme dag) — delt `downloadCsv(filename, rows, columns)`-helper (RFC 4180-escaping, UTF-8 BOM så æ/ø/å ikke bliver mojibake i Excel), "Eksportér CSV"-knap på Brugere- og Produkter-fanerne, eksporterer den aktuelt filtrerede/hentede liste (ikke hele tabellen — konsistent med den eksisterende paginering på 50-200 rækker). Ligger bevidst under `src/admin/`, ikke i det delte `helpers.js`, så den ikke bloater den mobile PWA's bundle. Kun på desktop. **Familie-overblik** (ny "Familie"-fane, `src/admin/sections/FamilySection.jsx`, samme dag) — grupperer `family_members` pr. ejer (viser husstanden samlet, ikke en flad liste) + en tabel over `family_invites` med status. Krævede en RLS-migration (`admin_can_read_family_invites`) — `family_members` tillod allerede admin-læsning, men `family_invites` kun inviteren/den der accepterede selv. **Handlingsmuligheder tilføjet 24. sept. 2026** — "fjern medlem" (×-knap på hver medlem-pille) og "annullér" på afventende invitationer. Krævede endnu en RLS-migration (`admin_can_manage_family_data`): `family_members`s DELETE-policy manglede admin-bypass, og `family_invites` havde slet ingen DELETE-policy overhovedet (hverken for ejer eller admin — invitationer kunne kun oprettes/læses, aldrig slettes via REST). **Global søgning** (`GlobalSearchBox.jsx`, samme dag) — en søgeboks i topbaren (uafhængig af hvilken fane admin står på), søger parallelt i brugere/produkter/tickets, klik på et resultat skifter til den relevante fane og forudfylder dens søgefelt. Begge kun på desktop.

**Med dette er hele "nye funktioner"-backlogget fra 24. sept. 2026 gennemført** (8/8 punkter: produkt-database, leksikon, ændringshistorik, brugere-redigering inkl. allergener, bulk-handlinger, dashboard-trends, CSV-eksport, familie-overblik + global søgning). Debug-fanen (mobil-appens `getTraceLog()`) er bevidst IKKE porteret — den er session-lokal til den enhed der scanner, og giver ikke mening i et separat desktop-panel |
