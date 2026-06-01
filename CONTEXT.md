# EatSafe — CONTEXT.md
> Upload denne fil i starten af hver Claude-session for fuldt overblik uden at uploade kildefiler.
> **Opdateres ved større ændringer.**
> **Sidst opdateret:** 1. juni 2026

---

## 1. Hvad er EatSafe?

PWA-app der hjælper allergiramte med at scanne produkter, tjekke allergener og vise allergier til restaurantpersonale i udlandet.

**Live:** https://eatsafe.dk · **Repo:** GitHub → Vercel auto-deploy · **Status:** Åben beta  
**Branch:** `Dev` (aktiv arbejdsbranch) → merges til `main`

---

## 2. Tech stack

| Lag | Teknologi |
|-----|-----------|
| Frontend | React 18 + JSX (`// @ts-nocheck` øverst i alle .jsx-filer) |
| Bundler | Vite 5 |
| Styling | Vanilla CSS-in-JS — CSS-streng i `theme.jsx` + inline styles |
| Backend | Supabase (PostgreSQL + Auth + Storage) — **ingen SDK, kun rå fetch() mod REST API** |
| Kamera | html5-qrcode |
| Font | **DM Sans + DM Mono** (Google Fonts, i theme.jsx) |
| Deploy | Vercel (auto-deploy ved push til Dev-branch) |

---

## 3. Filstruktur

```
src/
├── App.jsx              # Router, global state, bundnav — ~1400+ linjer
├── theme.jsx            # appCss (CSS-streng) + THEME-tokens + color() helper
├── utils.jsx            # BUILD_TIME, COMMIT_SHA, formatBuildTime(), getGreeting(), buildScreenLabel()
├── FeedbackModal.jsx    # Feedback-modal — selvstændig komponent med egen state + submit
│
├── useAuth.js           # Tokens, login, signup, OAuth, clearAuth
├── useShoppingList.js   # Indkøbsliste: load, add, toggle, remove, clear
├── useFamily.js         # Familie: load, addMember, removeMember + nyt-medlem form-state
├── useHistory.js        # Historik + favoritter (localStorage)
├── useOnboarding.js     # onboardStep, editMode, tourIdx + saveProfileStep1/2, finishOnboard
├── useProduct.js        # scanResult, OCR-state, suggest-edit + handleImageCapture, submitProduct
│
├── constants.jsx        # ALLERGENS, SCREENS, DIETS, E_NUMBERS, PAGE_IDS, uid m.fl.
├── constants.js         # Ældre duplikat — udfases
├── helpers.js           # initials(), timeAgo(), compareAllergens(), makeHeaders(), apiCall(), verifiedBadge(), traceId(), traceLog(), getTraceLog(), clearTraceLog()
├── SharedComponents.jsx # EatSafeLogo, Icon, IngredientsList, ProfileBadges, ProductImage, getProductIcon
├── AllergenPicker.jsx   # ENumberPicker
├── MemberForm.jsx       # MemberForm, CategorySelect
├── OnboardingScreen.jsx # WELCOME, LOGIN, ONBOARD (10 trin)
├── ScannerScreen.jsx    # HOME, RESULT, SEARCH, LIST, NOTFOUND, SUBMITTED, SUGGEST_EDIT
├── ProfileScreen.jsx    # PROFILE, FAMILY, FAVORITES, HISTORY, EDITPROFILE
├── MadpasScreen.jsx     # MADPAS (17 sprog)
├── RecipesScreen.jsx    # RECIPES
├── AdminScreen.jsx      # ADMIN
├── styles.css           # Supplerende CSS
├── index.css            # Reset
├── main.tsx             # React root
└── vite.config.ts       # __BUILD_TIME__ + __COMMIT_SHA__
```

### Fil-relationer
- `App.jsx` importerer `appCss` fra `theme.jsx` → `<style>{appCss}</style>`
- `App.jsx` importerer alle hooks og screen-komponenter
- `App.jsx` renderer `<FeedbackModal>` i bunden af app-div (zIndex:9999)
- `App.jsx` renderer beta-intro overlay (zIndex:10000) ved første besøg
- Screen-filer importerer fra `constants.jsx`, `helpers.js`, `SharedComponents.jsx`

---

## 4. Hook-arkitektur

### Initialiserings-rækkefølge i App.jsx (KRITISK)

```
1. useState (screen, user, allergens, activeProfiles osv.) — lokale
2. useAuth       → accessToken, userId, loginEmail, handleLogin/Signup/OAuth, saveTokens, clearAuth
3. useShoppingList { accessToken, userId }
4. useFamily     { accessToken, userId, setActiveProfiles }
5. useHistory    { accessToken, userId }
6. useOnboarding { accessToken, userId, user, loginEmail, allergens, customAllerg, setUser, setScreen, setIsOAuth, onSignupSuccess: () => setOnboardStep(1) }
7. useProduct    { accessToken, userId, activeProfiles, notFoundEan, setNotFoundEan, setScreen }
8. [Computed]    allActive, activeIds, lookupProduct (useCallback)
9. [Effects]     cleanup useEffect, søge-useEffect
```

### TDZ-regel
**Hook A må ikke modtage en setter der returneres af hook B, hvis B initialiseres efter A.**

### Hook-exports oversigt

| Hook | State | Funktioner |
|------|-------|-----------|
| `useAuth` | `accessToken`, `refreshToken`, `userId`, `loginEmail`, `loginPassword`, `authError`, `authLoading`, `authTab`, `isOAuth` | `saveTokens`, `clearAuth`, `handleLogin`, `handleSignup`, `handleOAuth` |
| `useShoppingList` | `shoppingList`, `shoppingListId`, `newItemName` | `loadShoppingList`, `addToList`, `toggleItem`, `removeItem`, `clearDone` |
| `useFamily` | `family`, `newMemberName/BirthYear/Gender/Allerg/...` | `loadFamily`, `addMember`, `removeMember` |
| `useHistory` | `history`, `historyLoading`, `favorites` | `loadHistory`, `saveHistoryEntry`, `toggleFavorite`, `isFavorite` |
| `useOnboarding` | `onboardStep`, `editMode`, `tourIdx`, `customInput` | `saveProfileStep1`, `saveAllergensStep2`, `finishOnboard` |
| `useProduct` | `scanResult`, `loading`, `scanError`, `setScanError`, `ocrText`, `proposedName/Flags`, `editStep/IngText/Note/Type`, `notFoundStep`, `submitting`, alle image-states | `handleImageCapture`, `handleProductImageCapture`, `handleEditProductCapture`, `submitProduct` |

---

## 5. Screens og navigation

| Konstant | Streng | Page ID | Komponent |
|----------|--------|---------|-----------|
| SCREENS.WELCOME | `welcome` | SCR-01 | OnboardingScreen |
| SCREENS.LOGIN | `login` | SCR-02 | OnboardingScreen |
| SCREENS.ONBOARD | `onboard` | SCR-03 | OnboardingScreen |
| SCREENS.HOME | `home` | SCR-04 | ScannerScreen |
| SCREENS.SEARCH | `search` | SCR-06 | ScannerScreen |
| SCREENS.LIST | `list` | SCR-07 | ScannerScreen |
| SCREENS.PROFILE | `profile` | SCR-08 | ProfileScreen |
| SCREENS.FAMILY | `family` | SCR-09 | ProfileScreen |
| SCREENS.RESULT | `result` | SCR-10 | ScannerScreen |
| SCREENS.HISTORY | `history` | SCR-11 | ProfileScreen |
| SCREENS.NOTFOUND | `notfound` | SCR-12 | ScannerScreen |
| SCREENS.SUBMITTED | `submitted` | SCR-13 | ScannerScreen |
| SCREENS.ADMIN | `admin` | SCR-14 | AdminScreen |
| SCREENS.FAVORITES | `favorites` | SCR-15 | ProfileScreen |
| SCREENS.MADPAS | `madpas` | SCR-16 | MadpasScreen |
| SCREENS.RECIPES | `recipes` | SCR-17 | RecipesScreen |
| SCREENS.EDITPROFILE | `editprofile` | SCR-18 | ProfileScreen |
| SCREENS.SUGGEST_EDIT | `suggest_edit` | — | ScannerScreen |

**Bundnavigation:** Opskrifter → Indkøbsliste → Hjem → Madpas → Profil (5 punkter)

---

## 6. Onboarding-flow

| `onboardStep` | Indhold |
|---|---|
| 0 | Beta-intro (vises én gang, localStorage `as_beta_intro`) |
| 1 | Feature-tour (swipeable) |
| 2 | Datakvalitet |
| 25 | Tre kategorier: Allergier/intolerancer · E-numre · Diæter |
| 3 | Hvem er du? (navn, email, fødselssår, køn) |
| 4 | Allergier / intolerancer (2-state chips) |
| 5 | E-numre (2-state liste) |
| 6 | Diæt |
| 7 | Familie |
| 8 | Hjælp fællesskabet |
| 9 | Oversigt + "Gå til appen" |

**VIGTIGT:** Admin-brugere sendes ALDRIG til onboarding — tjekkes via `payload.app_metadata.role` i OAuth-callback.

---

## 7. Allergener (16 stk)

```
id             label               emoji
gluten         Gluten              🥖
hvede          Hvede               🌾
maelkeallergi  Mælk                🥛
laktose        Laktoseintolerance  🍬
aeg            Æg                  🥚
noedder        Nødder              🌰
jordnoedder    Jordnødder          🥜
soja           Soja                🫛
fisk           Fisk                🐟
skaldyr        Skaldyr             🦐
selleri        Selleri             🥬
sennep         Sennep              🟡
sesam          Sesam               🌿
svovl          Sulfitter           🍷
lupin          Lupin               🌸
bloeddyr       Bløddyr             🦑
```

**Chip-logik:** 2-state toggle — ingen `_intolerance`-suffiks, ingen 3-state.

---

## 8. Allergen-matching

`compareAllergens(flags, activeAllergenIds)` → `{ status, matchedDanger, matchedWarning, hasUnknown }`

---

## 9. Produkt-kildebadge

`verifiedBadge(verified_status, source)` → `{ label, bg, color, dot }`

| Betingelse | Label | Farve |
|---|---|---|
| `verified_status === "verified"` eller `source === "producer"` | Fra producent | Grøn |
| `source === "off"` / `"open_food_facts"` | Open Food Facts | Blå |
| Alt andet | Bruger-indsendt | Grå |

---

## 10. Designsystem — MØRKT TEMA

**CSS i `theme.jsx`:** `export const appCss` + `export const THEME` + `export const color(key)`

```css
/* Baggrunde */
--paper:#1a3012       /* primær baggrund */
--paper2:#233d18      /* sekundær baggrund */
--surface:rgba(255,255,255,.055)
--surface2:rgba(255,255,255,.09)
--surface3:rgba(255,255,255,.04)

/* Tekst */
--ink:#EDF5EE
--ink2:rgba(237,245,238,.7)
--ink3:rgba(237,245,238,.58)
--muted:rgba(237,245,238,.62)
--muted2:rgba(237,245,238,.48)

/* Accent */
--green:#4ADE80
--green-logo:#3DCC6E   /* logoets grønne — bruges til scan-animation */
--green-lt:rgba(74,222,128,.13)
--green-mid:rgba(74,222,128,.22)
--green-text:#2FB865

/* Fare/advarsel */
--red:#FF5252   --red-lt:rgba(255,82,82,.1)   --red-md:rgba(255,82,82,.18)
--amber:#FFBA3B --amber-lt:rgba(255,186,59,.1) --amber-md:rgba(255,186,59,.18)
--blue:#60A5FA  --blue-lt:rgba(96,165,250,.1)

/* Borders */
--border:rgba(255,255,255,.08)
--border2:rgba(255,255,255,.14)

/* Font */
--f:'DM Sans',system-ui,sans-serif
--mono:'DM Mono',monospace
```

**Topbar + bundmenu:** Transparente — flyder ind i gradienten. Bundmenu har fade-gradient.

**Knap-konvention:** `btn-primary` = grøn baggrund (`var(--green)`) med mørk tekst (`#071510`). ALDRIG hvid tekst på grøn knap.

**VIGTIGT:** Brug aldrig `var(--ink)` som baggrund — det er lys grøn tekst-farve. Brug `var(--surface)` eller `var(--surface2)` til kortbaggrunde.

**CSS-klasser (nye):** `.scan-card`, `.scan-barcode-wrap`, `.scan-barcode-svg`, `.reticle-corner`, `.reticle-line`, `.home-chip`, `.home-tip`, `.recent-list`, `.recent-dot`, `.home-mini-card`, `.section-lbl`, `.version-str`, `.greeting-eyebrow`, `.greeting-main`

**Komponenter:** `<EatSafeLogo size={N} variant="light" />` · `<Icon name="..." size={N} color="..." />`

---

## 11. Supabase

**URL:** `https://jegrpcflyguadyxialkm.supabase.co` · **Anon key:** i `constants.jsx`  
**Alle kald:** rå `fetch()` via `makeHeaders(token)` + `apiCall(url, opts)` fra `helpers.js`

### Tabeller
| Tabel | Kolonner |
|-------|---------|
| `users` | id, name, email, role, birth_year, gender, diets jsonb, onboarding_completed |
| `family_members` | id, user_id, name, birth_year, gender, color, allergens jsonb, custom_allergens jsonb, diets jsonb, e_numbers jsonb |
| `products` | id, ean, name, brand, category, allergen_flags jsonb, ingredients_text, nutrition jsonb, verified_status, source, image_url, tags array, canonical_ean, variant_label |
| `feedback_tickets` | id, type, description, context jsonb, image_base64, status, submitted_by |
| `product_submissions` | id, ean, proposed_name, ocr_raw_text, allergen_flags jsonb, submitted_by, status |
| `scan_history` | id, user_id, ean_scanned, result_status |
| `shopping_lists` | id, owner_id, name |
| `shopping_list_items` | id, list_id, name, checked |
| `recipes` | id, title, category, allergen_flags jsonb, ingredients_raw jsonb, instructions jsonb |

**NB:** `users`-tabellen har IKKE allergens/custom_allerg/e_numbers kolonner — disse håndteres separat.

### Auth
Tokens i localStorage: `as_token`, `as_refresh`, `as_user_id`  
Auto-refresh hvert 45 min · Roller: `user`, `admin`  
**Admin-rolle:** `auth.users.raw_app_meta_data → {"role":"admin"}` — læses fra JWT `payload.app_metadata.role`  
Trigger synkroniserer `public.users.role` → `auth.users.raw_app_meta_data`

### loadAll (App.jsx useEffect på accessToken+userId)
Kører automatisk ved login:
1. `public.users` → `name, email, phone, birth_year, gender, role, onboarding_completed`
2. `user_allergens` → `allergen, type`
3. `loadFamily()`, `loadShoppingList()`, `loadHistory()`

### Search Edge Function (`/functions/v1/search`)
Returnerer: `{ success, products: [{ id, ean, name, brand, category, image_url, verified_status, allergen_flags, tags }] }`

### Edge Functions
| Funktion | Formål |
|----------|--------|
| `allergens` | Keyword + Claude hybrid allergen-detektion |
| `ocr` | Claude Haiku vision. mode: "ingredients" / "product_name" |
| `search` | Produktsøgning. Query: `?q=` |
| `products/{ean}` | Produktopslag på EAN |
| `submissions` | Bruger-indsendelser |

---

## 12. Debug Trace System (helpers.js)

- `traceId(prefix)` → unikt ID per operation (scan/search/ocr/submit)
- `traceLog(id, step, data)` → logger til console + in-memory array (max 200)
- `getTraceLog(id?)` → henter alle eller filtreret på ét ID
- `clearTraceLog()` → rydder alle traces
- Synlig i **Admin → Debug** faneblad
- Flows der tracker: scan (EAN), search, ocr (foto→tekst→allergen), submit
- Inkluderes i FeedbackModal context (`debug_trace`: seneste 50 entries)

---

## 13. Build-system

```ts
// vite.config.ts
define: {
  __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  __COMMIT_SHA__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA?.slice(0,7) || "local"),
}
```

---

## 14. FeedbackModal

Placeret i **bunden af app-div** i App.jsx (zIndex:9999 over alt).  
Åbnes via Feedback-knap i topbar (synlig overalt inkl. onboarding).

Inkluderer automatisk: skærm, bruger, enhed, build, allergener, familie, debug trace (seneste 50 entries).

---

## 15. AdminScreen

**Tilgås via:** Profil → Admin panel (kun `user.role === "admin"`)

**Sektioner:** Dashboard · Brugere · Indsendelser · Tickets · Debug

**Funktioner i App.jsx:**
- `loadAdminUsers()`, `updateUserRole(uid, role)`, `deleteUser(uid)`
- `updateSubmissionAndApprove(submission, edited)`, `rejectSubmission(id)`
- `updateTicketStatus(id, status)`, `cleanOcrWithAI(text)`

**Auto-load:** `useEffect` på `screen === SCREENS.ADMIN` kalder `loadAdminStats()`.

---

## 16. Canonical EAN (varianter)

Kolonner: `products.canonical_ean` + `variant_label`.  
Varianter peger på master-produkt der ejer allergen-data.  
`lookupProduct` henter master-data hvis `canonical_ean` sat.

---

## 17. Konventioner

- `App.jsx` = routing + global state. Navigation via `setScreen(SCREENS.X)`
- `// @ts-nocheck` øverst i alle `.jsx`-filer
- **Ingen ALLERGEN_SUBTYPES**, ingen 3-state chips, ingen datakvalitetsbadge
- CSS i `theme.jsx`, ikke i komponentfiler
- Supabase REST — `makeHeaders()` + `apiCall()` fra `helpers.js`
- **Mørkt tema overalt** — ingen `#fff`, `var(--paper)`, `var(--ink)` som baggrund
- **Grønne primærknapper** har altid `color:#071510`
- Kamera stoppes automatisk ved navigation væk fra HOME
- Brugerdata loades automatisk ved login (useEffect på accessToken+userId)
- `paddingBottom:120` på alle `.screen` divs i AdminScreen

---

## 18. Kendte fejl løst

| Fejl | Løsning |
|------|---------|
| `loginEmail is not defined` | Tilføjet som prop til ProfileScreen |
| `lookupProduct is not defined` | Tilføjet som prop til ScannerScreen |
| `scanError is not defined` | Destructureret fra useProduct i App.jsx |
| `lastScannedRef is not defined` | `useRef(null)` tilføjet i App.jsx |
| `feedbackDone is not defined` | `useState` tilføjet i App.jsx |
| TDZ-fejl | Hook-rækkefølge overholdes strengt |
| OAuth sender admin til onboarding | JWT `app_metadata.role` tjekkes — admin → HOME altid |
| `column users.allergens does not exist` | Fjernet fra REST select |
| Søgning åbner ikke produkter | `lookupProduct` manglede som prop |
| AdminScreen tom | Manglede i JSX-render-træet |
| Admin-rolle vises ikke | JWT `app_metadata.role` sættes via SQL på `auth.users` |
| `_traceLog` duplicate declaration | Trace-system eksisterede allerede i main — ikke tilføje igen |
| Profil hero hvid | `var(--ink)` → `var(--surface2)` som baggrund |
| Scanner animation forkert farve | Bruger nu `--green-logo:#3DCC6E` = logoets grønne |
| Debug trace bag bundmenu | `paddingBottom:120` på debug-sektionens container |

---

## 19. Åbne opgaver

- [ ] `constants.js` udfases
- [ ] Opskrifter-backend mangler data
- [ ] Supabase allowlist til alle preview-URLer
- [ ] Debug role-visning i ProfileScreen fjernes
- [ ] Search Edge Function: prioritér produkter med komplet data (allergen_flags, ingredients_text, image_url giver bonus-point)
- [ ] Allergener på familiemedlemmer: data-flow mangler
- [ ] Canonical EAN: udfyld manuelt efter behov
