# EatSafe — CONTEXT.md

> **Sidst opdateret:** 10. juni 2026  
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
| Version | ~v1.1.0 |

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
├── App.jsx                   # Routing, global state, lookupProduct, alle handlers
├── constants.jsx             # ALLERGENS, SCREENS, DIETS, E_NUMBERS, SUPABASE_URL/ANON_KEY, uid
├── helpers.js                # compareAllergens, extractENumbers, compareENumbers,
│                             #   checkDietCompatibility, initials, getAllergenLabels,
│                             #   verifiedBadge, makeHeaders, apiCall, timeAgo,
│                             #   traceId, traceLog, getTraceLog, clearTraceLog
├── theme.jsx                 # CSS-variabler, injectTheme(), ThemeStyle komponent
├── utils.jsx                 # formatBuildTime, getGreeting, buildScreenLabel
├── SharedComponents.jsx      # Icon, IngredientsList, ProfileBadges,
│                             #   getProductIcon, ProductImage, EatSafeLogo
│
├── — Hooks —
├── useScanner.js             # Kamera, auto-zoom, tap-to-focus, lommelygte,
│                             #   scanFromGallery, scanPhotoForEan (foto-fallback)
├── useAdmin.js               # Admin CRUD (brugere, submissions, tickets)
├── useRecipes.js             # Opskrifter CRUD
│
├── — Screens (routing via App.jsx) —
├── ScannerScreen.jsx         # Router + HOME screen
├── ResultScreen.jsx          # RESULT — scan-resultat, allergen-match, næring
├── NotFoundScreen.jsx        # NOTFOUND — 5-trins produkt-indsend flow
├── SearchScreen.jsx          # SEARCH — søgning + profil/manuel allergen-filter
├── ListScreen.jsx            # LIST — indkøbsliste + favoritter
├── SuggestEditScreen.jsx     # SUGGEST_EDIT — foreslå rettelse til produkt
├── ProfileScreen.jsx         # PROFILE, EDITPROFILE, FAMILY, HISTORY, FAVORITES, ADMIN
├── OnboardingScreen.jsx      # WELCOME, LOGIN, ONBOARD
├── KnowledgeScreen.jsx       # KNOWLEDGE — Leksikon
├── RecipesScreen.jsx         # RECIPES — opskrifter
├── MadpasScreen.jsx          # MADPAS (17 sprog) — via Profil-menuen
├── AdminScreen.jsx           # Admin-panel (via ProfileScreen)
│
├── — Delte komponenter —
├── MemberForm.jsx            # MemberForm, CategorySelect
├── AllergenPicker.jsx        # AllergenPicker, ENumberPicker
├── FeedbackModal.jsx         # FeedbackModal med debug trace
│
└── styles.css                # Globale CSS-klasser
```

---

## 4. ⚡ ARKITEKTUR-REGEL — NYE SKÆRME BYGGES ALTID SOM EGNE FILER

**Alle nye skærme og større UI-sektioner skal fra starten bygges som selvstændige komponenter i egne filer.**

Principperne:

1. **Én screen = én fil.** Ny screen oprettes som `XxxScreen.jsx` fra dag ét — aldrig inde i en eksisterende fil der allerede er stor.
2. **Props frem for masse-state.** Screens modtager kun det data de har brug for som props. Lokalt state (fx `open`, `step`, `inputValue`) lever i screen-komponenten selv.
3. **Ingen IIFE-patterns.** `{condition && (() => { ... })()}` er forbudt — brug en komponent.
4. **Ingen hooks i betinget kode.** React hooks altid øverst i komponenten.
5. **Hooks til logik.** Al kamera-, scanner-, admin-, opskrift-logik er i dedikerede hooks (`useScanner.js`, `useAdmin.js` osv.) — ikke inlined i App.jsx.
6. **ScannerScreen er router.** `ScannerScreen.jsx` er en routing-wrapper. Sub-screens (`ResultScreen`, `SearchScreen` osv.) er egne filer.

Denne regel eksisterer fordi vi har brugt mange timer på at refaktorere monolitiske filer. Fremover skal det ikke være nødvendigt.

---

## 5. Screens / Navigation

Navigation via `setScreen(SCREENS.X)` i App.jsx.

| SCREENS-konstant | Fil | Beskrivelse |
|-----------------|-----|-------------|
| WELCOME | OnboardingScreen | Velkomst-splash |
| LOGIN | OnboardingScreen | Login/signup |
| ONBOARD | OnboardingScreen | 5-trins onboarding |
| HOME | ScannerScreen | Hjem — scan-boks, profil-bar, historik |
| RESULT | ResultScreen | Scan-resultat |
| NOTFOUND | NotFoundScreen | 5-trins produkt-indsendelse |
| SEARCH | SearchScreen | Søgning + allergen-filter |
| LIST | ListScreen | Indkøbsliste |
| SUGGEST_EDIT | SuggestEditScreen | Foreslå rettelse |
| PROFILE | ProfileScreen | Profil |
| EDITPROFILE | ProfileScreen | Rediger allergier/diæt |
| FAMILY | ProfileScreen | Familiemedlemmer |
| HISTORY | ProfileScreen | Scanningshistorik |
| FAVORITES | ProfileScreen | Favoritter |
| ADMIN | ProfileScreen | Admin-panel |
| RECIPES | RecipesScreen | Opskrifter |
| KNOWLEDGE | KnowledgeScreen | Viden/Leksikon |
| MADPAS | MadpasScreen | Madpas (17 sprog) |

### Bundmenu (5 punkter)
`Opskrifter → Indkøbsliste → Hjem → Viden → Profil`

Madpas er i Profil-menuen. KNOWLEDGE highlighter Viden-tab. MADPAS highlighter Profil-tab.

---

## 6. Database — vigtigste tabeller

| Tabel | Nøglefelter | Noter |
|-------|-------------|-------|
| `public.users` | id, name, email, role, diets (jsonb) | role: "user" \| "admin" |
| `user_allergens` | user_id, allergen_id | |
| `family_members` | id, user_id, name, allergens (jsonb), diets, e_numbers | |
| `products` | id, ean, name, brand, allergen_flags (jsonb), nutrition (jsonb), verified_status, source | ~20.200 produkter |
| `scan_history` | id, user_id, ean, status, scanned_at | |
| `product_submissions` | id, ean, name, status, submitted_by | |
| `feedback_tickets` | id, type, status, screen, message, submitted_by | |
| `shopping_lists` | id, owner_id, items (jsonb) | |
| `recipes` | id, title, instructions, image_url | ~627 |
| `recipe_ingredients` | id, recipe_id, name, amount, unit | |
| `knowledge_base` | id, category, title, slug, emoji, summary, description, found_in, alternatives, health_notes, allergen_ids, diet_tags, risk_level, aliases, tags, sort_order | ~700 entries |
| `missing_ean_log` | ean, count, first_seen, last_seen | Automatisk via `log_missing_ean()` RPC |

### knowledge_base kategorier
`allergen` · `e_number` · `diet` · `ingredient` · `cross_reaction` · `faq` · `fun_fact`

---

## 7. Edge Functions (Supabase)

| Funktion | Metode | Beskrivelse |
|----------|--------|-------------|
| `products` | GET `/products/:ean` | Lokal DB → OFF fallback → gem permanent |
| `products` | POST | Opret produkt |
| `products` | PATCH `/products/:id` | Opdater |
| `products` | DELETE `/products/:id` | Slet |
| `allergens` | POST `{text}` | Keyword-engine + Claude Haiku fallback |
| `ocr` | POST `{image_base64, mode}` | `ingredients` / `product_name` / `nutrition` / `ean_from_image` |
| `search` | GET `?q=` | Scoring: allergen_flags +15, ingredients_text +10, image_url +5 |
| `send-email` | POST | Resend email |

---

## 8. useScanner hook

**Fil:** `useScanner.js` — al kamera-logik udtrukket fra App.jsx (5.1 ✅)

```js
const {
  cameraActive, setCameraActive, torchOn, scanZoom,
  showPhotoHint, photoScanLoading,
  galleryInputRef, photoFallbackRef, lastScannedRef,
  startCamera, stopCamera,
  scanFromGallery, scanPhotoForEan, toggleTorch,
} = useScanner({ setScanError, setLoading, onScanSuccess, accessToken });
```

**TDZ-løsning:** `lookupProduct` defineres efter `useScanner` i App.jsx. Løst via `lookupProductRef` — ref der opdateres efter `lookupProduct` er defineret. `useScanner` kalder `onScanSuccessRef.current?.()` internt.

**Foto-fallback:** Efter 5s uden scan → "📷 Tag billede"-knap. Billede → html5-qrcode → fejler → Claude Vision (mode: `ean_from_image`) → EAN → lookupProduct.

---

## 9. SEARCH-skærm — allergen-filtrering

**Fil:** `SearchScreen.jsx` — lokalt state: `allergenFilterOpen`, `manualAllergens`

Tre filtre kombineres:
1. **Profil-filter** — profil-chips med allergen-emoji og antal
2. **Manuel allergen-filter** — fold-ud 2×8 grid af alle 16 allergener
3. **effectiveIds** = `[...activeIds, ...manualAllergens]`

Filterlogik: `effectiveIds.length > 0` → kun sikre automatisk. Ingen filter → "Kun sikre"-knap.

---

## 10. KnowledgeScreen — Leksikon

**Startvisning:** 2×4 kategori-grid + daglig fun fact  
**Kategori → liste → detalje.** Søgning på titel, summary, aliases, tags.  
**Deep-link fra scan:** `openSlug` prop → åbner entry direkte.  
Data hentes én gang ved mount, caches lokalt.

---

## 11. Off → DB import (0.2 ✅)

Når et produkt hentes fra OFF gemmes det permanent i `products` via `saveOffProductToDB()` i Edge Function. Kører via `EdgeRuntime.waitUntil()` — ikke-blokerende. Manglende EAN'er logges automatisk via `log_missing_ean()` RPC.

---

## 12. CSS-konventioner

- CSS-variabler i `theme.jsx`, globale klasser i `styles.css`
- **Ingen hardkodede farver i screen-komponenter** — kun CSS-variabler
- **Ingen `backdrop-filter:blur()`** på fixed/sticky elementer
- `1px solid` borders (aldrig 1.5px)
- Mørkt tema: `var(--surface)` til kort, `var(--paper2)` til indlejrede sektioner
- Grønne primærknapper: `color:#071510`
- `paddingBottom:120` på alle screen-divs

### Farvesystem (tema)
- `--green` = **kun** success/safe/primær CTA
- `--blue` = navigation/info/links
- `--amber` = advarsel/traces
- `--red` = fare/allergen
- `--neutral` = labels/metadata
- `--muted` = sekundær tekst

---

## 13. Konventioner

- **`// @ts-nocheck`** øverst i alle `.jsx`-filer
- **React Hooks** — aldrig i IIFE, betinget kode eller loops. Altid øverst i komponent.
- **Supabase REST** via `makeHeaders()` + `apiCall()` fra `helpers.js`
- **Branch-workflow**: develop på `dev`, merge til `main` via pull request
- **Ingen `_intolerance`-suffiks** — kun 2-state allergen toggle
- **`submissions`** er aktiv tabel — `product_submissions` er slettet
- **Windows env**: `set KEY=value` (ikke `export`)

---

## 14. Kendte fejl — løst

| Fejl | Løsning |
|------|---------|
| React error #310 (Hooks i IIFE) | Hooks løftet til komponent-top, IIFE-patterns fjernet |
| SEARCH viste farlige med profil aktiv | `effectiveIds.length > 0` → auto kun-sikre |
| Dropdown hvid tekst på hvid baggrund | `<option>` hardkodede farver |
| allergen_flags boolean vs string | `normalizeAllergenFlags()` i Edge Function |
| `lookupProduct` TDZ i useScanner | `lookupProductRef` ref-pattern |
| Mange monolitiske filer | ScannerScreen splittet i 6 sub-komponenter (5.2 ✅) |

---

## 15. Kendte fejl — åbne

| Fejl | Status |
|------|--------|
| `feedbackDone` aldrig deklareret i App.jsx | Bruges 3 steder — mangler `useState` |
| `constants.js` skal udfases | Planlagt |
| Gradient baggrund på opskrifter | Skal redesignes |
| Leksikon: links fra scan-resultat klikbare | ✅ Implementeret (openSlug prop) |

---

## 16. Email-flow

**Udbyder:** Resend — 3.000 mails/måned gratis  
**Afsender:** noreply@eatsafe.dk

| Type | Trigger |
|------|---------|
| `welcome` | DB trigger på `public.users` INSERT |
| `otp` | Supabase Auth built-in |
| `submission_approved/rejected` | DB trigger på `product_submissions` UPDATE |
| `ticket_update` | DB trigger på `feedback_tickets` UPDATE |

---

## 17. Admin-panel

7 funktioner i `useAdmin.js` + `AdminScreen.jsx`:
1. `loadAdminUsers` — vis alle brugere
2. `updateUserRole` — ændr rolle
3. `deleteUser` — kaskade-sletning
4. `updateSubmissionAndApprove` — godkend
5. `rejectSubmission` — afvis
6. `updateTicketStatus` — opdater ticket
7. `cleanOcrWithAI` — rens OCR med Claude

---

## 18. Nøgle-URL'er

| Hvad | URL |
|------|-----|
| App (prod) | https://eatsafe.dk |
| Supabase Dashboard | https://supabase.com/dashboard/project/jegrpcflyguadyxialkm |
| Supabase REST | https://jegrpcflyguadyxialkm.supabase.co/rest/v1/ |
| Edge Functions | https://jegrpcflyguadyxialkm.supabase.co/functions/v1/ |
| GitHub repo | https://github.com/janfogde-sketch/Allergi-Scan |
| OFF API | https://world.openfoodfacts.org/api/v2/product/{ean}.json |
