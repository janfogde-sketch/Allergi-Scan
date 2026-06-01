# EatSafe — CONTEXT.md
> Upload denne fil i starten af hver Claude-session for fuldt overblik uden at uploade kildefiler.
> **Opdateres af:** Den der arbejder på appen ved større ændringer.
> **Sidst opdateret:** 29. maj 2026

---

## 1. Hvad er EatSafe?

PWA-app der hjælper allergiramte med at scanne produkter, tjekke allergener og vise allergier til restaurantpersonale i udlandet.

**Live:** https://eatsafe.dk · **Repo:** GitHub → Vercel auto-deploy · **Status:** Åben beta  
**Branch:** `Refracktor` (aktiv arbejdsbranch)

---

## 3. Tech stack

| Lag | Teknologi |
|-----|-----------|
| Frontend | React 18 + JSX (`// @ts-nocheck` øverst i alle .jsx-filer) |
| Bundler | Vite 5 |
| Styling | Vanilla CSS-in-JS — CSS-streng i `theme.jsx` + inline styles |
| Backend | Supabase (PostgreSQL + Auth + Storage) — **ingen SDK, kun rå fetch() mod REST API** |
| Kamera | html5-qrcode |
| Font | **DM Sans + DM Mono** (Google Fonts, i theme.jsx) — skiftet fra Inter |
| Deploy | Vercel (auto-deploy ved push til Refracktor-branch) |

---

## 4. Filstruktur

```
src/
├── App.jsx              # Router, global state, bundnav — ~1200+ linjer
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
├── helpers.js           # initials(), timeAgo(), compareAllergens(), makeHeaders(), apiCall(), verifiedBadge()
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
- `App.jsx` renderer `<FeedbackModal>` og `<AdminScreen>` i JSX-træet
- `App.jsx` renderer beta-intro overlay (zIndex:10000) før alt andet ved første besøg
- Screen-filer importerer fra `constants.jsx`, `helpers.js`, `SharedComponents.jsx`

---

## 5. Hook-arkitektur

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

## 6. Screens og navigation

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

## 7. Onboarding-flow (trin 0 = beta-info, derefter 1-9)

| `onboardStep` | Indhold |
|---|---|
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

**StepBar:** defineret i App.jsx, sendt som prop til OnboardingScreen.

**VIGTIGT:** Admin-brugere sendes ALDRIG til onboarding — tjekkes via `payload.app_metadata.role` i OAuth-callback.

**Beta-intro:** Vises én gang ved første besøg (før alt andet, zIndex:10000). Gemmes i `localStorage("as_beta_intro")`. Kan genåbnes via 🧪 Beta-information-knap på hjemskærm. 4 trin: Velkommen · Feedback · Hjælp · Advarsel om datakvalitet.

---

## 8. Allergener (16 stk)

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

## 9. Detektion og matching (KERNEN)

### Detektion sker i Supabase Edge Functions, IKKE frontend
- `/functions/v1/allergens` — keyword-engine + Claude-fallback (hybrid)
- `/functions/v1/ocr` — Claude Haiku vision læser ingredienser fra foto
- Frontend sender tekst, modtager `allergen_flags`

### allergens Edge Function (allergens.ts)
Hybrid-arkitektur:
1. **Keyword-engine kører altid** (gratis). 16 allergener korrekt opdelt: maelkeallergi=protein (kasein/valle/ost), laktose=kun mælkesukker, hvede separat fra gluten, gluten uden mel/starch.
2. `keywordMatch`: SUBSTRING_KEYWORDS (mælk/soja/kasein) bruger substring (fanger "komælk"); resten bruger `wordBoundaryMatch` (æøå-grænser).
3. `isNegated`: "laktosefri/uden mælk/under 0/free" → springer over.
4. Global laktose-override: laktosefri → laktose=no, men maelkeallergi forbliver yes.
5. ENUMBER_ALLERGENS: E322→soja(traces), E471/E472→maelkeallergi(traces), E966→laktose(yes), E220-228→svovl(yes).
6. **Claude-fallback** (`claude-haiku-4-5-20251001`): kun ved negation / >15 kommaer / mange ukendte E-numre / `force_ai:true`. Kræver ANTHROPIC_API_KEY secret. Ved konflikt vinder mest forsigtige værdi (yes>traces>no). Returnerer `method: "keyword"` eller `"keyword+claude"`.

### Allergen-matching (frontend, helpers.js)
`compareAllergens(flags, activeAllergenIds)` → `{ status, matchedDanger, matchedWarning, hasUnknown }`
- `flags[id]==="yes"` → danger, `"traces"` → warn, ukendt → hasUnknown

### E-nummer-matching (helpers.js)
- `extractENumbers(text)` — regex finder E100-E1599 i ingredienstekst
- `compareENumbers(productENumbers, userENumbers)` → `{ matched, status }`
- Vises som gul advarsel i RESULT-skærm

### Diæt-matching (helpers.js)
`checkDietCompatibility(dietId, allergenFlags, ingredientsText, nutrition)` → `{ ok, reasons, confidence }`
- Vegansk/Vegetarisk/Pescetarisk: allergen_flags + ANIMAL_KEYWORDS/MEAT_KEYWORDS ingrediens-scanning
- Glutenfri: allergen_flags (gluten+hvede)
- Keto: næringsdata (kulhydrater) eller keto-breakers
- Baseret på allergen_flags, IKKE tags (gammel tags-metode var upålidelig)
- Paleo FJERNET (for upålideligt)

### Aggregering på tværs af profiler (App.jsx)
```js
const allActive = useCallback(() => {
  const ids = new Set(activeProfiles.includes("me") ? allergens : []);
  const eNums = new Set(activeProfiles.includes("me") ? selectedENumbers : []);
  family.filter(m => activeProfiles.includes(m.id)).forEach(m => {
    (m.allergens||[]).forEach(a => ids.add(a));
    (m.eNumbers||[]).forEach(e => eNums.add(e));
  });
  return { ids:[...ids], custom:[...customAllerg], eNumbers:[...eNums] };
}, [allergens, customAllerg, selectedENumbers, family, activeProfiles]);
const activeIds = allActive().ids;
const activeENumbers = allActive().eNumbers;
```

### Database-genparsing
- `reparse_allergens.mjs` (Node ESM): henter produkter i batches af 50, sender ingredients_text til allergens Edge Function, skriver flags tilbage via PATCH.
- Flags: `DRY_RUN=1` (ingen skrivning), `FORCE_ALL=1` (genparser alt). Windows: `set DRY_RUN=1` osv.
- Kræver SERVICE_KEY. Pris-tracking: COST_PER_CLAUDE=0.00138.
- Kørt: 16.095 produkter, 15.568 opdateret, ~$1.08. Backup: products_backup.

---

## 10. Produkt-kildebadge

`verifiedBadge(verified_status, source)` → `{ label, bg, color, dot }`

| Betingelse | Label | Farve |
|---|---|---|
| `verified_status === "verified"` eller `source === "producer"` | Fra producent | Grøn |
| `source === "off"` / `"open_food_facts"` | Open Food Facts | Blå |
| Alt andet | Bruger-indsendt | Grå |

---

## 11. Designsystem — MØRKT TEMA

**CSS i `theme.jsx`:** `export const appCss` + `export const THEME` + `export const color(key)`

```css
/* Baggrunde */
--paper:#1a3012       /* primær baggrund */
--paper2:#233d18      /* sekundær baggrund */
--surface:rgba(255,255,255,.055)
--surface2:rgba(255,255,255,.09)
--surface3:rgba(255,255,255,.04)

/* Tekst */
--ink:#EDF5EE          /* primær tekst */
--ink2:rgba(237,245,238,.7)
--ink3:rgba(237,245,238,.58)
--muted:rgba(237,245,238,.62)
--muted2:rgba(237,245,238,.48)

/* Accent */
--green:#4ADE80
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

**Baggrunds-gradient:**
```css
body: linear-gradient(160deg, #253d1a 0%, #1a2e12 100%)
.app: radial-gradient(ellipse 120% 55% at 50% 0%, rgba(74,222,128,.15) 0%, transparent 65%),
      linear-gradient(175deg, #2d5220 0%, #234018 40%, #1a3012 70%, #162a10 100%)
```

**Topbar + bundmenu:** Transparente — flyder ind i gradienten. Bundmenu har fade-gradient.

**Knap-konvention:** `btn-primary` = grøn baggrund (`var(--green)`) med mørk tekst (`#071510`). ALDRIG hvid tekst på grøn knap.

**CSS-klasser (nye):** `.scan-card`, `.scan-barcode-wrap`, `.scan-barcode-svg`, `.reticle-corner`, `.reticle-line`, `.home-chip`, `.home-tip`, `.recent-list`, `.recent-dot`, `.home-mini-card`, `.section-lbl`, `.version-str`, `.greeting-eyebrow`, `.greeting-main`

**Komponenter:** `<EatSafeLogo size={N} variant="light" />` · `<Icon name="..." size={N} color="..." />`

**VIGTIGT:** Brug aldrig `var(--ink)` som baggrund — det er nu lys grøn tekst-farve. Brug `var(--surface)` eller `var(--surface2)` til kortbaggrunde.

---

## 12. Supabase

**URL:** `https://jegrpcflyguadyxialkm.supabase.co` · **Anon key:** i `constants.jsx`  
**Alle kald:** rå `fetch()` via `makeHeaders(token)` + `apiCall(url, opts)` fra `helpers.js`

### Tabeller
| Tabel | Kolonner |
|-------|---------|
| `users` | id, name, email, role, birth_year, gender, diets jsonb, onboarding_completed *(NB: allergens/custom_allerg/e_numbers er IKKE kolonner her — disse er i separate tabeller eller håndteres separat)* |
| `family_members` | id, user_id, name, birth_year, gender, color, allergens jsonb, custom_allergens jsonb, diets jsonb, e_numbers jsonb |
| `products` | id, ean, name, brand, category, allergen_flags jsonb, ingredients_text, nutrition jsonb, verified_status, source, image_url, tags array |
| `feedback_tickets` | id, type, description, context jsonb, image_base64, status, submitted_by |
| `product_submissions` | id, ean, proposed_name, ocr_raw_text, allergen_flags jsonb, submitted_by, status |
| `scan_history` | id, user_id, ean_scanned, result_status |
| `shopping_lists` | id, owner_id, name |
| `shopping_list_items` | id, list_id, name, checked |
| `recipes` | id, title, category, allergen_flags jsonb, ingredients_raw jsonb, instructions jsonb |

### Auth
Tokens i localStorage: `as_token`, `as_refresh`, `as_user_id`  
Auto-refresh hvert 45 min · Roller: `user`, `admin`  
**Admin-rolle sættes i `auth.users.raw_app_meta_data → {"role":"admin"}`**  
Læses fra `public.users.role` via `loadAll` useEffect.

### loadAll (App.jsx useEffect på accessToken+userId)
Kører automatisk ved login. Henter:
1. `public.users` → `name, email, phone, birth_year, gender, role, onboarding_completed`
2. `user_allergens` → `allergen, type` (type: `"allergen"` eller `"custom"`)
3. `loadFamily()` → familie-medlemmer
4. `loadShoppingList()` → indkøbsliste

### Search Edge Function (`/functions/v1/search`)
Returnerer: `{ success, products: [{ id, ean, name, brand, category, image_url, verified_status, allergen_flags, tags }] }`  
EAN-feltet hedder `ean` i products-tabellen.

---

## 13. Build-system

```ts
// vite.config.ts
define: {
  __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  __COMMIT_SHA__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA?.slice(0,7) || "local"),
}
```

`utils.jsx` eksporterer: `BUILD_TIME`, `COMMIT_SHA`, `formatBuildTime()`, `getGreeting()`, `buildScreenLabel()`

---

## 14. FeedbackModal

Placeret i **bunden af app-div** i App.jsx (sikrer zIndex:9999 over alt).

Åbnes via:
- Feedback-knap i topbar (synlig på alle skærme inkl. onboarding)
- Avatar i topbar → navigerer til profil (IKKE feedback længere)

```jsx
<FeedbackModal
  open={feedbackOpen} onClose={() => setFeedbackOpen(false)}
  screen={screen} authTab={authTab} onboardStep={onboardStep}
  scanResult={scanResult} madpasWaiterView={madpasWaiterView}
  madpasLang={madpasLang} selectedRecipe={selectedRecipe}
  editMode={editMode} showManualEan={showManualEan} profilePopup={profilePopup}
  user={user} userId={userId} accessToken={accessToken} loginEmail={loginEmail}
  allergens={allergens} family={family} history={history} activeProfiles={activeProfiles}
/>
```

Typer: bug 🐛 · ui 🎨 · missing 💡 · content 📦 · crash 💥 · suggestion ✨

---

## 15. AdminScreen

**Tilgås via:** Profil → Admin panel (kun synlig hvis `user.role === "admin"`)

**Funktioner defineret i App.jsx:**
- `loadAdminUsers()` — henter alle brugere
- `updateUserRole(uid, role)` — skifter rolle
- `deleteUser(uid)` — sletter bruger
- `updateSubmissionAndApprove(submission, edited)` — godkender indsendelse
- `rejectSubmission(id)` — afviser indsendelse
- `updateTicketStatus(id, status)` — opdaterer ticket
- `cleanOcrWithAI(text)` — renser OCR-tekst via Claude API

**Auto-load:** `useEffect` på `screen === SCREENS.ADMIN` kalder `loadAdminStats()` automatisk.

**Props sendt til AdminScreen:** screen, setScreen, adminSection, adminStats, adminUsers, adminUsersLoading, adminTickets, adminTicketFilter, submissions, submissionsLoading, submissionFilter, openSubmission, editingSubmission, openAdminUser, openTicket, cleanedOcrText, cleaningOcr, userId, accessToken, user, + alle ovenstående funktioner

---

## 16. Konventioner

- `App.jsx` = routing + global state. Navigation via `setScreen(SCREENS.X)`
- `// @ts-nocheck` øverst i alle `.jsx`-filer
- **Ingen ALLERGEN_SUBTYPES** — fjernet
- **Ingen 3-state chips** — kun 2-state toggle
- **Ingen datakvalitetsbadge** — kun kilde
- CSS i `theme.jsx`, ikke App.jsx
- Supabase REST — `makeHeaders()` + `apiCall()` fra `helpers.js`
- **Mørkt tema overalt** — ingen `#fff` eller `var(--paper)` baggrunde i komponenter
- **Grønne primærknapper** har altid `color:#071510` (mørk tekst)
- Kamera stoppes automatisk ved navigation væk fra HOME (useEffect på screen)
- Brugerdata loades automatisk ved login via useEffect på accessToken+userId

---

## Edge Functions (Supabase)

| Funktion | Formål |
|----------|--------|
| `allergens` | Keyword + Claude hybrid allergen-detektion. Body: `{text, force_ai?, save?, product_id?}` |
| `ocr` | Claude Haiku vision. Body: `{image_base64, mode?}`. mode: "ingredients" (default) / "product_name" |
| `search` | Produktsøgning. Query: `?q=` |
| `products/{ean}` | Produktopslag på EAN |
| `submissions` | Bruger-indsendelser |

Secret: `ANTHROPIC_API_KEY` (bruges af allergens + ocr).

---

## Debug Trace System (helpers.js)

- `traceId(prefix)` → unikt ID per operation (scan/search/ocr/submit)
- `traceLog(id, step, data)` → logger til console + in-memory array (max 200)
- `getTraceLog()` → henter alle traces
- Synlig i **Admin → Debug** faneblad med "Kopier JSON"-knap
- Flows der tracker: scan (EAN), search, ocr (foto→tekst→allergen), submit

---

## Canonical EAN (varianter)

Kolonner: `products.canonical_ean` (FK til products.ean) + `variant_label`.
- Varianter peger på master-produkt der ejer allergen-data
- `lookupProduct` henter master-data hvis canonical_ean sat, viser variantens navn+label
- **Auto-population virker IKKE** på nuværende data (Nemlig-rod, få ægte varianter). Udfyldes manuelt efter behov.

---

## 17. Kendte fejl løst

| Fejl | Løsning |
|------|---------|
| `loginEmail is not defined` | Tilføjet som prop til ProfileScreen |
| `activeIds is not defined` | Beregnes lokalt i ScannerScreen |
| `lookupProduct is not defined` | Tilføjet som prop til ScannerScreen + defineret efter hooks |
| `scanError is not defined` | `scanError, setScanError` destructureret fra useProduct i App.jsx |
| `lastScannedRef is not defined` | `const lastScannedRef = useRef(null)` tilføjet i App.jsx |
| `feedbackDone is not defined` | `const [feedbackDone, setFeedbackDone]` tilføjet i App.jsx |
| TDZ-fejl generelt | Hook-rækkefølge: A må ikke modtage setter fra B der initialiseres efter A |
| OAuth sender admin til onboarding | Admin tjekkes via JWT `app_metadata.role` — går altid til HOME |
| `column users.allergens does not exist` | Fjernet fra REST select — kun `name,email,role,diets,onboarding_completed` |
| Søgning åbner ikke produkter | `lookupProduct` manglede som prop til ScannerScreen |
| AdminScreen vises ikke | `<AdminScreen>` manglede i App.jsx render-træ |
| Admin-funktioner undefined | `loadAdminUsers`, `updateUserRole` m.fl. defineret i App.jsx |
| `scanError is not a function` | `p.ean || p.code || p.barcode` guard i søgeklik-handler |
| `column users.diets does not exist` | `diets` kolonne tilføjet via `ALTER TABLE public.users ADD COLUMN diets jsonb` |
| `family_members` 400 Bad Request | Kolonner `allergens/custom_allergens/diets/e_numbers` tilføjet via SQL migration |
| `shopping_lists` 500 fejl | `shopping_list_access`-tabel eksisterer — RLS policies er korrekte |
| `<AdminScreen>` tom | Komponent manglede i JSX-render-træet + 7 admin-funktioner gendannet |
| Admin-rolle vises ikke | `loadAll` useEffect læser nu `role` fra `public.users` via REST |
| Profil/allergener loades ikke | `useEffect` på `accessToken+userId` tilføjet i App.jsx der kalder `loadAll` |
| OAuth redirect til main | `redirect_to: window.location.origin + "/"` i `useAuth.js` |
| Hjælp-modal gennemsigtig | `backdropFilter` fjernet, `background:#1a3012` sat |
| Scan-kort lyst baggrund | `var(--surface)` + `backdrop-filter:blur` erstattet med `rgba(255,255,255,.04)` |
| maelkeallergi vs laktose sammenblandet | Ny allergens Edge Function splitter protein fra mælkesukker |
| Rismel falsk-flagget som gluten | mel/flour/starch fjernet fra gluten-ordbog |
| "æg" matcher i "lægemiddel" | wordBoundaryMatch med æøå-grænser |
| E-numre matches ikke mod produkter | extractENumbers + compareENumbers + aggregering i allActive |
| Diæt-matching upålidelig (tags) | checkDietCompatibility baseret på allergen_flags |
| Android tilbageknap logger ud | popstate-handler navigerer inden i appen |
| Scanner-animation står stille | Inline styles → className="scan-laser" CSS-klasse |
| OCR returnerer blankt | Ny ocr Edge Function (Claude vision) + trace-system til debug |
| Beta-info vises ikke konsekvent | Flyttet til onboarding trin 0 |
| Submit står længe uden feedback | Fuldskærms loading-overlay + spinner |
| Hvide elementer i NOTFOUND/SUGGEST_EDIT | var(--ink)/var(--paper)/#fff → var(--surface)/var(--green) |
| Madpas "kan ikke spise mælkeallergi" | "Jeg har allergi over for" + singular/plural |

---

## 18. Åbne opgaver

- [ ] Test OCR i appen (ny Claude vision-funktion)
- [ ] 4.061 produkter uden ingredienser → hent fra Open Food Facts
- [ ] Canonical EAN: udfyld manuelt efter behov (auto-matching virker ikke)
- [ ] `constants.js` udfases
- [ ] Verificér scanner-animation kører efter className-fix
- [ ] Submissions Edge Function: tjek at den gemmer alle felter (ingrediensliste, allergener)
