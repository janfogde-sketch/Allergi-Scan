# EatSafe — CONTEXT.md

> **Sidst opdateret:** 4. juni 2026  
> **Opdateres ved større ændringer. Deles med AI-assistenter som sessionskontekst.**

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
│                           #   initials, getAllergenLabels, verifiedBadge, makeHeaders, apiCall, timeAgo,
│                           #   traceId, traceLog, getTraceLog, clearTraceLog
├── theme.jsx               # CSS-variabler, injectTheme(), ThemeStyle komponent
├── utils.jsx               # formatBuildTime, getGreeting, buildScreenLabel
├── SharedComponents.jsx    # Icon (inkl. "book"-ikon), IngredientsList, ProfileBadges,
│                           #   getProductIcon, ProductImage, EatSafeLogo
├── ScannerScreen.jsx       # HOME, SEARCH (m. allergen-filter), RESULT, NOTFOUND,
│                           #   SUBMITTED, SUGGEST_EDIT, LIST
├── ProfileScreen.jsx       # PROFILE, EDITPROFILE, FAMILY, ADMIN, HISTORY, FAVORITES
│                           #   (indeholder Madpas-link i profilmenu)
├── OnboardingScreen.jsx    # WELCOME, LOGIN, ONBOARD (trin 0-9)
├── MemberForm.jsx          # MemberForm (shared), CategorySelect dropdown
├── AllergenPicker.jsx      # AllergenPicker, ENumberPicker
├── FeedbackModal.jsx       # FeedbackModal (type, skærm, enhed, besked, debug trace)
├── KnowledgeScreen.jsx     # KNOWLEDGE — Viden/Leksikon med søgning, kategori-grid, detaljevisning
├── RecipesScreen.jsx       # Opskrifter, søgning, filtrering, favoritter
├── MadpasScreen.jsx        # MADPAS (17 sprog) — tilgås via Profil-menuen
├── AdminScreen.jsx         # Admin-panel (bruges via ProfileScreen ADMIN-skærm)
├── styles.css              # Globale CSS-klasser (topbar, bottom-nav, card, field, btn, osv.)
└── index.css               # Vite default
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
| SEARCH | ScannerScreen | Produktsøgning med allergen-filter (profil + manuel) |
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
| RECIPES | RecipesScreen | Opskrifter |
| KNOWLEDGE | KnowledgeScreen | Viden/Leksikon — allergener, E-numre, diæter, FAQ |
| MADPAS | MadpasScreen | Madpas (17 sprog) — tilgås via Profil-menuen |

### Bundmenu (5 punkter)
`Opskrifter → Indkøbsliste → Hjem → Viden → Profil`

**NB:** Madpas er fjernet fra bundmenuen og er nu i Profil-menuen.
KNOWLEDGE highlighter Viden-tab. MADPAS highlighter Profil-tab.

---

## 5. Database — vigtigste tabeller

| Tabel | Nøglefelter | Noter |
|-------|-------------|-------|
| `public.users` | id, name, email, role, diets (jsonb), created_at | role: "user" \| "admin" |
| `user_allergens` | user_id, allergen_id | Mange-til-mange |
| `family_members` | id, user_id, name, color, allergens (jsonb), custom_allergens, diets, e_numbers | Jsonb-felter |
| `products` | id, ean, name, brand, category, image_url, ingredients_text, allergen_flags (jsonb), nutrition (jsonb), verified_status, source, canonical_ean, variant_label | ~16.000+ produkter |
| `scan_history` | id, user_id, ean, product_id, status, scanned_at | |
| `product_submissions` | id, ean, name, status, submitted_by | status: pending/approved/rejected |
| `feedback_tickets` | id, type, status, screen, device, message, submitted_by | Ticket-system |
| `shopping_lists` | id, owner_id, items (jsonb) | |
| `recipes` | id, title, instructions, image_url, source | ~627 fra TheMealDB |
| `recipe_ingredients` | id, recipe_id, name, amount, unit | |
| `knowledge_base` | id, category, title, slug, emoji, summary, description, found_in, alternatives, health_notes, allergen_ids, diet_tags, risk_level, aliases, tags, sort_order | 292 entries: 247 E-numre, 15 allergener, 12 fun facts, 8 FAQ, 6 diæter, 4 krydsreaktioner |

### knowledge_base kategorier
`allergen` · `e_number` · `diet` · `ingredient` · `cross_reaction` · `faq` · `fun_fact`

---

## 6. Edge Functions (Supabase)

| Funktion | Metode | Beskrivelse |
|----------|--------|-------------|
| `products` | GET `/products/:ean` | Hent produkt — lokal DB → OFF fallback |
| `products` | POST | Opret produkt |
| `products` | PATCH `/products/:id` | Opdater produkt |
| `products` | DELETE `/products/:id` | Slet produkt |
| `allergens` | POST `{text}` | Hybrid allergen-detektion: keyword-engine + Claude Haiku fallback |
| `ocr` | POST `{image_base64, mode}` | OCR via Claude Haiku vision |
| `search` | GET `?q=` | Produktsøgning med scoring (allergen_flags +15, ingredients_text +10, image_url +5) |
| `send-email` | POST | Resend email (welcome, submission, ticket) |

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

---

## 8. SEARCH-skærm — allergen-filtrering

Søgning har tre filtre der kombineres:

1. **Profil-filter** — klikbare profil-chips (bruger + familie). Viser navn, allergen-emojis og antal. Filtrerer automatisk baseret på de aktive profilers allergener.

2. **Manuel allergen-filter** — fold-ud 2×8 grid af alle 16 allergener. Allergener fra aktive profiler vises nedtonet ("Fra profil"). Manuelle allergener vises med amber `✎`-markering i oversigten.

3. **Effektive IDs** — `effectiveIds = [...activeIds, ...manualAllergens]` (deduplikeret union).

**State i ScannerScreen:** `allergenFilterOpen`, `manualAllergens` — deklareres øverst i komponenten (ikke i IIFE — ville bryde Hook-regler).

**Produktkort i søgning** viser:
- Farvet kant (rød/amber) ved allergen-match
- Konkrete allergen-chips med emoji + label direkte på kortet
- Status: `✓ Sikker` / `✕ Farlig` / `⚠ Advarsel`

---

## 9. KnowledgeScreen — Viden/Leksikon

**Fil:** `KnowledgeScreen.jsx`  
**Route:** `SCREENS.KNOWLEDGE = "knowledge"`  
**Tilgås via:** Bundmenu → Viden (book-ikon)

### Funktioner
- **Startvisning:** 2×4 kategori-grid + daglig "Vidste du"-fact
- **Kategori-valg:** Klik på kategori → kompakt liste med emoji, titel, summary, risiko-dot
- **Søgning:** Filtrerer på titel, summary, aliases og tags. Viser antal resultater.
- **Detaljevisning:** Titel, risiko-niveau, beskrivelse, sundhedsnoter, "Findes i"-chips, "Alternativer"-chips, aliases, relaterede allergener (klikbare → åbner entry), diæt-tags
- **Relaterede allergener/diæter:** Mapper IDs til labels via `ALLERGENS`/`DIETS` konstanter. Skjules hvis ingen kendte matches.
- **Data:** Hentes én gang ved mount (`limit=1000`), caches lokalt. Ingen Edge Function.

### Konvention
`useState`-hooks skal altid stå øverst i komponentfunktionen — aldrig inde i IIFE eller betinget kode.

---

## 10. Debug Trace System

**I helpers.js:**
- `traceId(prefix)` → unikt ID pr. operation
- `traceLog(id, step, data)` → logger til console + in-memory array (max 200)
- `getTraceLog(id?)` → henter alle eller filtreret
- `clearTraceLog()` → rydder

**Flows der tracker:** scan, search, ocr, submit  
**FeedbackModal:** inkluderer seneste 50 trace-entries i `context.debug_trace`

---

## 11. CSS-konventioner

- CSS-variabler i `theme.jsx`, globale klasser i `styles.css`
- **Ingen `backdrop-filter:blur()`** på fixed/sticky elementer
- **Ingen dobbelt-borders** (border + box-shadow 0 -1px)
- `backface-visibility:hidden` på `.topbar` og `.bottom-nav`
- `background:#fff` → `var(--surface)` for tema-kompatibilitet
- `1px solid` (ikke 1.5px) for borders

---

## 12. Konventioner

- **`App.jsx`** = routing + global state. Navigation via `setScreen(SCREENS.X)`
- **`// @ts-nocheck`** øverst i alle `.jsx`-filer
- **Ingen `_intolerance`-suffiks** — kun 2-state allergen toggle
- **Ingen `ALLERGEN_SUBTYPES`** — fjernet helt
- **Supabase REST** via `makeHeaders()` + `apiCall()` fra `helpers.js`
- **React Hooks** — aldrig i IIFE, betinget kode eller loops. Altid øverst i komponent.
- **Branch-workflow**: develop på `dev`, merge til `main` via pull request

---

## 13. Kendte fejl — løst

| Fejl | Løsning |
|------|---------|
| Nemlig-produkter "ikke fundet" | Edge Function UUID-detection |
| Diæt vises ikke under præferencer | `user.diets` rendering tilføjet |
| Scroll-artefakter (streger) | `1.5px`→`1px`, `backdrop-filter` fjernet |
| `loginEmail is not defined` | Tilføjet som prop til ProfileScreen |
| `activeIds is not defined` | Beregnes lokalt i ScannerScreen |
| `lookupProduct is not defined` | Tilføjet som prop til ScannerScreen |
| allergen_flags boolean vs string | `normalizeAllergenFlags()` i Edge Function |
| React error #310 (Hooks i IIFE) | `allergenFilterOpen`/`manualAllergens` flyttet til komponent-top |
| Produkter uden ingredienser/flags | `enrich_products.mjs` kørt |
| Email-flow | Resend + Edge Function + DB triggers |
| delete-user Edge Function | Kaskade-sletning inkl. auth.users |
| Produkt-submissions mangler i admin | Edge Function + useAdmin.js rettet |
| Opskrift-ingredienser kvalitet | `translate_measure()` oversætter 50+ enheder |

---

## 14. Kendte fejl — åbne

| Fejl | Status |
|------|--------|
| `constants.js` skal udfases | Planlagt |
| Opskrifter-backend mangler data (recipe_ingredients tom) | Mangler SQL migrations |
| App.jsx refaktor (Context/komponenter) | Planlagt |
| Gradient baggrund på opskrifter | Skal redesignes |
| **Viden/Leksikon — links fra scan** | Klik på allergen/E-nummer i scan-resultat → åbn leksikon-entry |
| **Viden/Leksikon — mere indhold** | ~150 ingrediens-entries mangler. Kan genereres med Claude |
| **Foto-scanning fallback** | Hvis scan fejler → tag billede → Claude Vision aflæser EAN |
| Ticket 4 — Brand-navn sjældent fundet | OCR prompt opdateret — afventer test |

---

## 15. Email-flow

**Udbyder:** Resend — gratis op til 3.000 mails/måned  
**Afsender:** noreply@eatsafe.dk  
**Edge Function:** `send-email` (deployed, `--no-verify-jwt`)

| Type | Trigger |
|------|---------|
| `welcome` | DB trigger på `public.users` INSERT |
| `otp` | Supabase Auth built-in |
| `submission_approved/rejected` | DB trigger på `product_submissions` UPDATE |
| `ticket_update` | DB trigger på `feedback_tickets` UPDATE |

---

## 16. Admin-panel

7 funktioner i AdminScreen (tilgås via ProfileScreen):
1. `loadAdminUsers` — vis alle brugere
2. `updateUserRole` — ændr brugerrolle
3. `deleteUser` — slet bruger (kaskade)
4. `updateSubmissionAndApprove` — godkend indsendelse
5. `rejectSubmission` — afvis indsendelse
6. `updateTicketStatus` — opdater ticket-status
7. `cleanOcrWithAI` — rens OCR-tekst med Claude

Plus: ticket-export som .txt-fil.

---

## 17. Nøgle-URL'er

| Hvad | URL |
|------|-----|
| App (prod) | https://eatsafe.dk |
| Supabase Dashboard | https://supabase.com/dashboard/project/jegrpcflyguadyxialkm |
| Supabase REST | https://jegrpcflyguadyxialkm.supabase.co/rest/v1/ |
| Edge Functions | https://jegrpcflyguadyxialkm.supabase.co/functions/v1/ |
| GitHub repo | https://github.com/janfogde-sketch/Allergi-Scan |
| OFF API | https://world.openfoodfacts.org/api/v2/product/{ean}.json |
