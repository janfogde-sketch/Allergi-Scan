# EatSafe — CONTEXT.md

> **Sidst opdateret:** 3. juni 2026  
> **Opdateres af:** Jan ved større ændringer. Deles med AI-assistenter som sessionskontekst.

---

## 1. Projekt-overblik

**EatSafe** er en dansk allergen-scanning PWA (Progressive Web App) rettet mod forbrugere med fødevareallergier og -intolerancer. Brugere scanner stregkoder, og appen matcher ingredienser mod deres allergiprofil og viser klare advarsler.

| Nøgle | Værdi |
|-------|-------|
| URL | https://eatsafe.dk |
| GitHub | janfogde-sketch/Allergi-Scan |
| Branches | `main` (produktion) · `dev` (udvikling) |
| Supabase projekt-ID | jegrpcflyguadyxialkm |
| Supabase URL | https://jegrpcflyguadyxialkm.supabase.co |
| Vercel | Auto-deploy på både `main` og `dev` |
| Admin bruger | janfogde@gmail.com (`404caa7f-91b0-4bad-a2a8-bcb6a396d35f`) |
| Collaborator | Bjørn (GitHub: bjangst) |
| Version | ~v1.0.6+ |

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
| Lokal dev | Windows, `C:\Users\janfo`, GitHub Desktop, `set`-syntaks for env vars |

---

## 3. Filstruktur

```
src/
├── App.jsx                 # Routing, global state, lookupProduct, saveHistory, alle handlers
├── constants.jsx           # ALLERGENS, SCREENS, DIETS, E_NUMBERS, SUPABASE_URL, SUPABASE_ANON_KEY, uid
├── helpers.js              # compareAllergens, extractENumbers, compareENumbers, checkDietCompatibility,
│                           #   initials, getAllergenLabels, verifiedBadge, makeHeaders, apiCall, timeAgo
├── theme.jsx               # CSS-variabler, injectTheme(), ThemeStyle komponent
├── utils.jsx               # traceId, traceLog (debug trace system)
├── SharedComponents.jsx    # Icon, IngredientsList, ProfileBadges, getProductIcon, ProductImage, EatSafeLogo
├── ScannerScreen.jsx       # HOME, SEARCH, RESULT, NOTFOUND, SUBMITTED, SUGGEST_EDIT, LIST
├── ProfileScreen.jsx       # PROFILE, EDITPROFILE, FAMILY, ADMIN, HISTORY, FAVORITES
├── OnboardingScreen.jsx    # WELCOME, LOGIN, ONBOARD (trin 0-9) — LOGIN/SIGNUP er HER
├── MemberForm.jsx          # MemberForm (shared), CategorySelect dropdown
├── AllergenPicker.jsx      # AllergenPicker, ENumberPicker
├── FeedbackModal.jsx       # FeedbackModal (type, skærm, enhed, besked)
├── RecipeScreen.jsx        # Opskrifter, søgning, filtrering, favoritter
├── styles.css              # Globale CSS-klasser (topbar, bottom-nav, card, field, btn, osv.)
└── index.css               # Vite default (ikke relevant)

scripts/ (lokale)
├── reparse_allergens.mjs   # Batch-reparse af allergen_flags via Edge Function
├── csv_import.js           # Bilka/Nemlig CSV-import
├── nemlig_scraper.js       # Playwright-scraper til Nemlig API
├── mealdb_import.js        # TheMealDB recipe-import med oversættelse
└── off_import.py           # Open Food Facts bulk-import (GitHub Action)
```

---

## 4. Screens / Navigation

Navigation via `setScreen(SCREENS.X)` i App.jsx.

| SCREENS-konstant | Fil | Beskrivelse |
|-----------------|-----|-------------|
| WELCOME | OnboardingScreen | Velkomst-splash |
| LOGIN | OnboardingScreen | Login/signup med email OTP + Google OAuth |
| ONBOARD | OnboardingScreen | 10-trins onboarding (0-9) |
| HOME | ScannerScreen | Hjem — profil-bar, scan-boks, historik, tips |
| SEARCH | ScannerScreen | Produktsøgning (Enter-trigger, parallel Supabase + OFF) |
| RESULT | ScannerScreen | Scan-resultat med allergen-match |
| NOTFOUND | ScannerScreen | 5-trins produkt-indsendelse |
| SUBMITTED | ScannerScreen | Bekræftelse efter indsendelse |
| SUGGEST_EDIT | ScannerScreen | Foreslå rettelser til eksisterende produkt |
| LIST | ScannerScreen | Indkøbsliste |
| PROFILE | ProfileScreen | Min profil med præferencer |
| EDITPROFILE | ProfileScreen | Rediger allergier/diæt/E-numre |
| FAMILY | ProfileScreen | Familiemedlemmer |
| HISTORY | ProfileScreen | Scanningshistorik |
| FAVORITES | ProfileScreen | Favoritprodukter |
| ADMIN | ProfileScreen | Admin-panel (7 funktioner + ticket-export) |
| RECIPES | RecipeScreen | Opskrifter |

---

## 5. Database — vigtigste tabeller

| Tabel | Nøglefelter | Noter |
|-------|-------------|-------|
| `public.users` | id, name, email, role, diets (jsonb), created_at | role: "user" \| "admin" |
| `user_allergens` | user_id, allergen_id | Mange-til-mange |
| `family_members` | id, user_id, name, color, allergens (jsonb), custom_allergens, diets, e_numbers | Jsonb-felter |
| `products` | id, ean, name, brand, category, image_url, ingredients_text, allergen_flags (jsonb), nutrition (jsonb), verified_status, source, canonical_ean, variant_label | ~16.000+ produkter |
| `products_backup` | Kopi af products | Taget før FORCE_ALL reparse |
| `scan_history` | id, user_id, ean, product_id, status, scanned_at | |
| `product_submissions` | id, ean, name, status, submitted_by | status: pending/approved/rejected |
| `feedback_tickets` | id, type, status, screen, device, message, submitted_by | Ticket-system |
| `shopping_lists` | id, owner_id, items (jsonb) | |
| `recipes` | id, title, instructions, image_url, source | ~627 fra TheMealDB |
| `recipe_ingredients` | id, recipe_id, name, amount, unit | |
| `ingredients` | product_id, raw_text | Legacy fallback |
| `allergen_flags` | product_id, gluten, laktose, ... | Legacy fallback |
| `missing_ean_log` | ean (PK), count, first_seen, last_seen | Logger manglende EAN-opslag. log_missing_ean() RPC funktion |
| `knowledge_base` | id, category, title, slug, emoji, summary, description, found_in, alternatives, health_notes, allergen_ids, diet_tags, risk_level, aliases, tags | 292 entries: 247 E-numre, 15 allergener, 12 fun facts, 8 FAQ, 6 diæter, 4 krydsreaktioner |

---

## 6. Edge Functions (Supabase)

| Funktion | Metode | Beskrivelse |
|----------|--------|-------------|
| `products` | GET `/products/:ean` | Hent produkt — lokal DB → OFF fallback. UUID = id-opslag, alt andet = ean-opslag |
| `products` | POST | Opret produkt |
| `products` | PATCH `/products/:id` | Opdater produkt |
| `products` | DELETE `/products/:id` | Slet produkt |
| `allergens` | POST `{text}` | Hybrid allergen-detektion: keyword-engine + Claude Haiku fallback |
| `ocr` | POST `{image_base64, mode}` | OCR via Claude Haiku vision |

### Allergen-detection (allergens.ts)
- Keyword-engine (gratis, kører altid): 16 allergener, word-boundary med æøå, negation-detektion, substring-matching, E-nummer→allergen mapping
- Claude Haiku fallback: trigges ved negation, lange ingredienslister, ukendte E-numre, eller `force_ai:true`
- Maelkeallergi (protein) og laktose (mælkesukker) er korrekt splittet
- Hvede er separat fra gluten; gluten matcher ikke mel/stivelse
- Global laktose-override for "laktosefri"-produkter

### Products Edge Function (products/index.ts)
- Field-detection: `UUID-format → id`, `alt andet → ean` (understøtter Nemlig-prefixede EAN som "Nemlig-5056172")
- OFF-fallback kun for rene numeriske EAN'er
- `normalizeAllergenFlags()` håndterer boolean→string konvertering

---

## 7. Frontend — allergen-matching flow

```
1. Scanner/søgning → lookupProduct(ean) i App.jsx
2. Edge Function /products/:ean → produkt + allergen_flags
3. Canonical-opslag hvis product.canonical_ean findes
4. compareAllergens(flags, activeIds) → status: safe/danger/warn
5. extractENumbers() + compareENumbers() → E-nummer advarsler
6. checkDietCompatibility() → diæt-advarsler
7. familyImpact[] → berørte familiemedlemmer
8. setScanResult() → RESULT-skærm
```

### Aktive profiler
- `activeProfiles[]` indeholder "user" og/eller familiemedlems-id'er
- `activeIds[]` = deduplikeret union af alle aktives allergen-id'er
- `activeENumbers[]` = union af alle aktives E-numre
- `allActive()` aggregerer på tværs af alle aktive profiler

---

## 8. Onboarding (10 trin)

| Trin | Indhold |
|------|---------|
| 0 | Beta-information |
| 1 | Datadisklaimer |
| 2 | Profil (navn, fødselsår, køn) |
| 3 | Allergier (AllergenPicker) |
| 4 | E-numre (ENumberPicker) |
| 5 | Diæt |
| 6 | Familiemedlemmer |
| 7 | Community/bidrag |
| 8 | Opsummeringsskærm (profil + familie med redigeringslinks) |
| 9 | Færdig |

---

## 9. Dataimport — kilder og scripts

| Kilde | Antal | Script | Format |
|-------|-------|--------|--------|
| Open Food Facts | ~77 GB JSONL (dansk dump) | `off_import.py` + GitHub Action (månedlig) | Bulk JSONL |
| Bilka | ~10.271 produkter | `csv_import.js` | CSV |
| Nemlig | ~8.543 produkter | `csv_import.js` + `nemlig_scraper.js` | CSV / Playwright |
| TheMealDB | ~627 opskrifter | `mealdb_import.js` + `mealdb_save.js` | API → oversæt → Supabase |

### Batch reparse (reparse_allergens.mjs)
- Kører lokalt på Windows: `set SUPABASE_URL=... && set SERVICE_KEY=... && node reparse_allergens.mjs`
- Batch 50, pause 250ms, viser løbende pris per batch
- `FORCE_ALL=1` genparser alle, ellers kun dem med tomme/dårlige flags
- `DRY_RUN=1` for test uden skrivning
- Første kørsel: 16.095 produkter → 4.976 opdateret (~$1,08)
- FORCE_ALL kørsel: 16.095 → 15.568 opdateret (~$6,63)
- Pris per Claude-kald: ~$0,00138–0,00225

---

## 10. Designsystem

### CSS-variabler (theme.jsx)
```
--paper: #FAFAF7          --ink: #1F2733
--paper2: #F2F2EE         --ink2: #3D4654
--green: #22C55E          --green-lt: rgba(34,197,94,.08)
--red: #E63946            --red-lt: rgba(230,57,70,.08)
--amber: #F59E0B          --amber-lt: rgba(245,158,11,.08)
--border: #E8E8E4         --border2: #D4D4CE
--muted: #8B8F96          --muted2: #6B7280
--surface: rgba(255,255,255,.6)  --surface2: rgba(31,39,51,.6)
--r: 14px (border-radius)  --f: 'Inter', system-ui, sans-serif
```

### CSS-regler
- **Ingen `1.5px` borders** — bruger `1px` for at undgå sub-pixel renderingsartefakter på mobil
- **Ingen `backdrop-filter:blur()`** på fixed/sticky elementer
- **Ingen dobbelt-borders** (border + box-shadow 0 -1px)
- `backface-visibility:hidden` på `.topbar` og `.bottom-nav` for GPU-compositing
- `background:#fff` i klasser bør være `var(--surface)` for tema-kompatibilitet

---

## 11. Konventioner

- **`App.jsx`** = routing + global state. Navigation via `setScreen(SCREENS.X)`
- **`// @ts-nocheck`** øverst i alle `.jsx`-filer
- **Ingen `_intolerance`-suffiks** — kun 2-state allergen toggle
- **Ingen `ALLERGEN_SUBTYPES`** — fjernet helt
- **Supabase REST** via `makeHeaders()` + `apiCall()` fra `helpers.js`
- **CSS-variabler** defineres i `theme.jsx`, globale klasser i `styles.css`
- **Ingredienser og næring** altid udfoldet på produktsiden
- **Spor vises altid** (traces)
- **Windows-syntaks** for miljøvariabler: `set KEY=value && node script.mjs`
- **Branch-workflow**: develop på `dev`, merge til `main` via pull request

---

## 12. Refaktor-regel

**Første gang der arbejdes på en fil ikke rørt siden refaktoren**, køres import-tjek:

**Fra `helpers.js`:** `verifiedBadge`, `makeHeaders`, `apiCall`, `timeAgo`, `compareAllergens`, `initials`, `getAllergenLabels`  
**Fra `constants.jsx`:** `uid`, `PAGE_IDS`, `SCREENS`, `ALLERGENS`, `DIETS`, `E_NUMBERS`  
**Props:** tjek om alle brugte props faktisk sendes fra App.jsx

**Allerede tjekket:** ScannerScreen, ProfileScreen, OnboardingScreen, MemberForm, AllergenPicker, SharedComponents, constants, FeedbackModal, utils, theme

---

## 13. Planlagt refaktor (næste session)

Planen er at splitte `App.jsx` op:
- `constants.js` — alle konstanter ud af App.jsx
- `AppContext.jsx` — React Context for global state
- Individuelle komponent-filer for genbrugte UI-dele
- Screens som selvstændige filer (allerede delvist gjort)
- GitHub Desktop setup + Vercel environment variables
- Supabase migrations-mappe
- Central error logger
- Test efter hvert trin

---

## 14. Kendte fejl — løst

| Fejl | Løsning |
|------|---------|
| Nemlig-produkter "ikke fundet" | Edge Function brugte `isEan = /^\d+$/` → ændret til UUID-detection |
| Diæt vises ikke under præferencer | Tilføjet `user.diets` rendering i ProfileScreen |
| Feedback-knap hvid/ulæselig på login | `rgba(255,255,255,.85)` → `var(--paper2)`, `color:var(--ink2)` |
| Scroll-artefakter (streger) | `1.5px solid` → `1px solid` (31 steder), `backdrop-filter` fjernet fra topbar |
| `loginEmail is not defined` | Tilføjet som prop til ProfileScreen |
| `activeIds is not defined` | Beregnes lokalt i ScannerScreen |
| `lookupProduct is not defined` | Tilføjet som prop til ScannerScreen |
| `verifiedBadge/makeHeaders/apiCall/uid` not defined | Tilføjet til imports |
| Google-knap hvid i dark theme | `background:"#fff"` → `var(--surface)` |
| Onboarding "Næste"-knap hvid | `var(--ink)` → `var(--green)` |
| E-numre mangler i præferencer | Tilføjet `selectedENumbers`-sektion |
| Login-skærm lokation ukendt | Dokumenteret: ligger i OnboardingScreen.jsx |
| reparse_allergens URL-fejl | Mellemrum i URL-strengbygning → sat på én linje |
| allergen_flags boolean vs string | `normalizeAllergenFlags()` i Edge Function + SQL migration |
| OFF API CORS | Går via Edge Function, ikke direkte fra frontend |
| Streger i UI (Android) | `1.5px`→`1px` (13 steder CSS) + `-webkit-backface-visibility:hidden` på 18 boks-elementer |
| Scanner-animation stå stille | Løst |
| Produkter uden ingredienser/flags | `enrich_products.mjs` kørt — trin 1-3 |
| Email-flow | Resend + Edge Function + DB triggers. Templates redigeres på resend.com |
| delete-user Edge Function | Kaskade-sletning inkl. auth.users, admin-verificeret |
| Supabase CLI | Installeret, linked til projekt, bruges til Edge Function deploy |
| DB triggers (net.http_post) | `send_welcome_email`, `send_submission_email`, `send_ticket_email` med EXCEPTION handler |

---

## 15. Kendte fejl — åbne

| Fejl | Status |
|------|--------|
| `constants.js` skal udfases (erstattet af `constants.jsx`) | Planlagt |
| Opskrifter-backend mangler data (recipe_ingredients tom) | Mangler SQL migrations |
| Hardcodede farver i komponentfiler | ✅ Løst — 23× background:#fff→var(--paper), 16× 1.5px→1px, 1× #22C55E→var(--green) |
| App.jsx refaktor (Context/komponenter) | Planlagt |
| **Leksikon udvidelse** | 396 entries i alt (104 ingredienser, 247 E-numre, 15 allergener, 12 fun facts, 8 FAQ, 6 diæter, 4 krydsreaktioner). Mål: 300 ingredienser. Tilføj: alkohol og gærprodukter, krydderiblandinger, eksotiske ingredienser, flerestærke madkulturer (japansk, mexikansk, indisk nøgle-ingredienser) |
| **Fase 2.1 — Farver** | ✅ --warm (#E8A87C), --warm-lt/md, font-weight tokens (--fw-*), line-height tokens (--lh-*) tilføjet til theme.jsx. home-tip → warm accent |
| **Fase 2.2 — Baggrund** | ✅ Gradient baggrund i .app og body |
| **Fase 2.4 — Scan-resultat redesign** | Afventer — behov: ScannerScreen.jsx |
| **Fase 2.5 — Tomme tilstande** | Afventer — behov: screen-filer |
| Gradient baggrund på opskrifter | Ikke tilfredsstillende — skal redesignes så gradient fungerer konsistent på lange sider |
| **Viden/Leksikon — frontend** | Database klar (396 entries). **CSS-klasser klar (kb-*)** — Mangler: KnowledgeScreen.jsx, søgning, kategori-filtrering, detaljevisning |
| **Viden/Leksikon — navigation** | Erstat Madpas i bundmenu med Viden-tab. Flyt Madpas til profilsiden — AFVENTER KnowledgeScreen |
| **Viden/Leksikon — links fra scan** | Klik på allergen/E-nummer i scan-resultat → åbn leksikon-entry |
| **Viden/Leksikon — mere indhold** | ~150 ingrediens-entries, flere krydsreaktioner, flere FAQ/fun facts. Kan genereres med Claude |
| Ticket 4 — Brand-navn sjældent fundet | ✅ OCR prompt opdateret (BRAND/NAME format) + useProduct.js parser opdateret |
| Ticket 6 — Søg E-numre/ingredienser | Dækkes af Viden/Leksikon-feature |
| Produkt-submissions mangler i admin | ✅ Løst — Edge Function gemte i `submissions`, admin læste fra `product_submissions`. useAdmin.js rettet |
| Opskrift-ingredienser kvalitet | ✅ Løst — translate_measure() oversatte 50+ engelske enheder til dansk, RecipesScreen fix for duplikerede mængder |

---

## 16. Email-flow

**Udbyder:** Resend (resend.com) — gratis op til 3.000 mails/måned  
**Afsender:** noreply@eatsafe.dk  
**DNS:** Verificeret via one.com (DKIM, SPF, MX på send.eatsafe.dk)  
**API-key:** Gemt som Supabase Edge Function secret `RESEND_API_KEY`  
**Edge Function:** `send-email` (deployed, `--no-verify-jwt`)

### Email-typer

| Type | Trigger | Template |
|------|---------|---------|
| `welcome` | DB trigger `on_user_created` på `public.users` INSERT | `welcomeTemplate()` i send-email/index.ts |
| `otp` | Supabase Auth built-in | Authentication → Emails → Magic link or OTP |
| `submission_approved` | DB trigger `on_submission_status_changed` på `product_submissions` UPDATE | `submissionApprovedTemplate()` |
| `submission_rejected` | DB trigger `on_submission_status_changed` på `product_submissions` UPDATE | `submissionRejectedTemplate()` |
| `ticket_update` | DB trigger `on_ticket_status_changed` på `feedback_tickets` UPDATE | `ticketUpdateTemplate()` |

### Redigér mails

| Mail | Placering |
|------|-----------|
| OTP login-kode | Supabase Dashboard → Authentication → Emails → Magic link or OTP |
| Alle andre | `supabase/functions/send-email/index.ts` → rediger template → `supabase functions deploy send-email` |
| DB triggers | Supabase Dashboard → Database → Functions: `send_welcome_email`, `send_submission_email`, `send_ticket_email` |
| Logs/statistik | resend.com → Emails |

### Kald manuelt (test)
```bash
curl -X POST https://jegrpcflyguadyxialkm.supabase.co/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ANON_KEY" \
  -d '{"type":"welcome","to":"email@example.com","data":{"name":"Jan"}}'
```

---

## 17. Admin-panel

7 funktioner i ProfileScreen (ADMIN-skærm):
1. `loadAdminUsers` — vis alle brugere
2. `updateUserRole` — ændr brugerrolle
3. `deleteUser` — slet bruger
4. `updateSubmissionAndApprove` — godkend produkt-indsendelse
5. `rejectSubmission` — afvis indsendelse
6. `updateTicketStatus` — opdater ticket-status
7. `cleanOcrWithAI` — rens OCR-tekst med Claude

Plus: ticket-export knap (download åbne tickets som .txt).

---

## 18. Nøgle-URL'er

| Hvad | URL |
|------|-----|
| App (prod) | https://eatsafe.dk |
| Supabase Dashboard | https://supabase.com/dashboard/project/jegrpcflyguadyxialkm |
| Supabase REST | https://jegrpcflyguadyxialkm.supabase.co/rest/v1/ |
| Edge Functions | https://jegrpcflyguadyxialkm.supabase.co/functions/v1/ |
| GitHub repo | https://github.com/janfogde-sketch/Allergi-Scan |
| Vercel | Auto-deploy fra GitHub |
| OFF API | https://world.openfoodfacts.org/api/v2/product/{ean}.json |
