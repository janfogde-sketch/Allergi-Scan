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
├── useMadpas.js              # Madpas speak-funktion + madpasSpeaking/Big/WaiterView state
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
├── MadpasScreen.jsx          # MADPAS (17 sprog) — QR-kode + del-link
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
| MADPAS | MadpasScreen | Madpas + QR |

Bundmenu (opdateret sept. 2026): `Indkøbsliste (venstre) → Scan (midten, barcode-ikon)
→ Søg (højre)`. Profil, Familie, Favoritter, Historik, Opskrifter, Viden, Madpas,
Restaurantguide og Admin nås nu via et hamburger-menu-ikon i topbaren th., som åbner
`ProfileMenu.jsx` (slide-out fra højre). Se `/CLAUDE.md` afsnit 3 for detaljer og
begrundelse.

---

## 6. Database — vigtigste tabeller

| Tabel | Nøglefelter | Noter |
|-------|-------------|-------|
| `products` | id, ean, name, brand, allergen_flags (jsonb), nutrition (jsonb), verified_status, source, ingredients_text | ~20.200+ |
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

- **Tabel:** `family_invites` (token, 24t expiry, to-vejs)
- **Flow:** Profil → Familie → "Opret invitationslink" → send link → modtager åbner `eatsafe.dk/invite/[token]` → opretter konto → tilknyttes via `accept_family_invite()` RPC
- **Realtime indkøbsliste:** WebSocket på `shopping_list_items` — alle familiemedlemmer ser ændringer live

---

## 10. Madpas QR-kode

- **QR:** Allergen-tekst kodet direkte ind via `api.qrserver.com` — virker offline og i udlandet
- **Link:** `eatsafe.dk/madpas/[userId]` — offentlig webside som backup
- **Offline fallback:** Tekst-boks med allergennavne vises hvis QR API er utilgængeligt

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
| Desktop admin — nye funktioner | Shellet (`src/admin/`) + alle eksisterende faner (Dashboard/Brugere/Indsendelser/Tickets/Manglende/Import/Opskrifter) er bygget og shippet 24. sept. 2026. **Produkt-database direkte** (ny "Produkter"-fane, `src/admin/sections/ProductsSection.jsx`) er også shippet 24. sept. 2026 — søg på navn/brand/EAN (eller se seneste opdaterede uden søgeord, da `products` har 20.000+ rækker), redigér navn/brand/kategori/ingredienstekst/allergen_flags/verificeringsstatus direkte, slet produkt (kan fejle med en synlig FK-fejl hvis produktet stadig er refereret fra fx en indkøbsliste/scanningshistorik/ændringslog — bevidst ikke cascade-slettet automatisk). Kun på desktop, ikke porteret til mobil-admin. **Leksikon-CRUD** (ny "Leksikon"-fane, `src/admin/sections/KnowledgeSection.jsx`) er også shippet 24. sept. 2026 — søg/filtrér på kategori (allergen/e_number/ingredient/diet/cross_reaction/faq/fun_fact — DB check-constraint), opret/redigér/slet `knowledge_base`-entries (titel, slug med auto-generering fra titel ved oprettelse, emoji, resumé, beskrivelse, sundhedsnoter, risikoniveau, sortering, tilknyttede allergener som klikbare chips, og 6 frie liste-felter som kommasepareret tekst: found_in/alternatives/diet_tags/aliases/tags/sources). RLS tillader allerede admin-skriv direkte (ingen Edge Function nødvendig). Kun på desktop. **Ændringshistorik** (ny "Historik"-fane, `src/admin/sections/HistorySection.jsx`) er også shippet 24. sept. 2026 — read-only visning af `revision_log`, filtrérbar på oprettet/opdateret, produkt- og bruger-navne slås op i to batch-kald efter hovedlisten (ingen FK-embed tilgængelig for changed_by). **Brugere-redigering** (`UsersSection.jsx`, samme dag) er udvidet til at dække ALT bundet til brugeren, inkl. allergener — krævede en RLS-migration (`admin_can_write_user_allergens`) der tilføjer `is_admin()`-OR-betingelse til `user_allergens`s INSERT/UPDATE/DELETE-policyer (SELECT tillod allerede admin-læsning, men skriv var kun ejeren/familiemedlem-ejeren); samme slet-og-bulk-indsæt-mønster som `ProfileScreen.jsx` bruger for sig selv. Familiemedlemmers allergener ligger ikke i `user_allergens` (kun brugerens egne, `family_member_id is null`) og er ikke omfattet. Kun på desktop. **Bulk-handlinger** (Indsendelser-fanen, samme dag) — afkrydsningsbokse på pending-visningen + "Godkend valgte"/"Afvis valgte". Bevidst en SLANKERE parallel-implementation, ikke et loop der genbruger `updateSubmissionAndApprove`/`rejectSubmission` (de sluger deres egne fejl internt og viser individuelle toasts/lukker modaler, hvilket ville gøre det umuligt at tælle reelle succes/fejl på tværs af en batch) — sender ikke navn/brand-override (kun ingredienstekst fra OCR; Edge Function'en patcher kun felter der rent faktisk sendes) og springer push-notifikationer over for hastighed; AI-reparse'en efter hver godkendelse sikrer stadig korrekte allergen_flags. Kun på desktop. Resterende, bevidst udskudt til senere, én ad gangen efter aftale med brugeren: **rigere dashboard/analytics** (trends over tid, ikke kun dags-snapshot), **CSV-eksport**, **familie-overblik** (support-værktøj til at se `family_invites`/`family_members`-koblinger), **global søgning** på tværs af brugere/produkter/tickets. Debug-fanen (mobil-appens `getTraceLog()`) er bevidst IKKE porteret — den er session-lokal til den enhed der scanner, og giver ikke mening i et separat desktop-panel |
