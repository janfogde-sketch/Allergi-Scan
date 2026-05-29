# EatSafe — CONTEXT.md
> Upload denne fil i starten af hver Claude-session for fuldt overblik uden at uploade kildefiler.
> **Opdateres af:** Bjørn (frontend) eller Jan (backend) ved større ændringer.
> **Sidst opdateret:** 29. maj 2026

---

## 1. Hvad er EatSafe?

PWA-app der hjælper allergiramte med at scanne produkter, tjekke allergener og vise allergier til restaurantpersonale i udlandet.

**Live:** https://eatsafe.dk · **Repo:** GitHub → Vercel auto-deploy · **Status:** Åben beta  
**Branch:** `Refracktor` (aktiv arbejdsbranch)

---

## 2. Roller

| Person | Ansvar |
|--------|--------|
| Bjørn | Frontend — React/JSX, UI, komponenter, CSS |
| Jan | Backend — Supabase, API, database, auth, Vercel deploy |

---

## 3. Tech stack

| Lag | Teknologi |
|-----|-----------|
| Frontend | React 18 + JSX (`// @ts-nocheck` øverst i alle .jsx-filer) |
| Bundler | Vite 5 |
| Styling | Vanilla CSS-in-JS — CSS-streng i `theme.jsx` + inline styles |
| Backend | Supabase (PostgreSQL + Auth + Storage) — **ingen SDK, kun rå fetch() mod REST API** |
| Kamera | html5-qrcode |
| Font | Inter (Google Fonts, i theme.jsx) |
| Deploy | Vercel (auto-deploy ved push til Refracktor-branch) |

---

## 4. Filstruktur

```
src/
├── App.jsx              # Router, global state, bundnav — ~1160 linjer
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
├── SharedComponents.jsx # EatSafeLogo, Icon, IngredientsList, ProfileBadges, ProductImage
├── AllergenPicker.jsx   # ENumberPicker (SubtypeModal fjernet)
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
- `App.jsx` renderer `<FeedbackModal>` med kontekst-props
- Screen-filer importerer fra `constants.jsx`, `helpers.js`, `SharedComponents.jsx`

---

## 5. Hook-arkitektur

### Initialiserings-rækkefølge i App.jsx (KRITISK)

Hooks skal initialiseres i denne rækkefølge — en hook må ALDRIG modtage en setter der returneres af en hook der initialiseres senere:

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

### TDZ-regel (vigtigst lært)
**Hook A må ikke modtage en setter der returneres af hook B, hvis B initialiseres efter A.**  
Løsning: brug en callback-lambda i stedet:
```js
// ❌ TDZ fejl: setOnboardStep kommer fra useOnboarding der initialiseres efter useAuth
useAuth({ setOnboardStep })

// ✅ Korrekt: lambda evalueres ved kaldtidspunkt, ikke ved definition
useAuth({ onSignupSuccess: () => setOnboardStep(1) })
```

### Hook-exports oversigt

| Hook | State | Funktioner |
|------|-------|-----------|
| `useAuth` | `accessToken`, `refreshToken`, `userId`, `loginEmail`, `loginPassword`, `authError`, `authLoading`, `authTab`, `isOAuth` | `saveTokens`, `clearAuth`, `handleLogin`, `handleSignup`, `handleOAuth` |
| `useShoppingList` | `shoppingList`, `shoppingListId`, `newItemName` | `loadShoppingList`, `addToList`, `toggleItem`, `removeItem`, `clearDone` |
| `useFamily` | `family`, `newMemberName/BirthYear/Gender/Allerg/...` | `loadFamily`, `addMember`, `removeMember` |
| `useHistory` | `history`, `historyLoading`, `favorites` | `loadHistory`, `saveHistoryEntry`, `toggleFavorite`, `isFavorite` |
| `useOnboarding` | `onboardStep`, `editMode`, `tourIdx`, `customInput` | `saveProfileStep1`, `saveAllergensStep2`, `finishOnboard` |
| `useProduct` | `scanResult`, `loading`, `scanError`, `ocrText`, `proposedName/Flags`, `editStep/IngText/Note/Type`, `notFoundStep`, `submitting`, alle image-states | `handleImageCapture`, `handleProductImageCapture`, `handleEditProductCapture`, `submitProduct` |

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

## 7. Onboarding-flow (10 trin)

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
Tæller: `step===25 ? 3 : step<3 ? step : step+1`

---

## 8. Allergener (16 stk)

```
id             label               emoji
gluten         Gluten              🥖
hvede          Hvede               🌾   hvedeprotein — separat fra gluten
maelkeallergi  Mælk                🥛   mælkeprotein (kasein/valle)
laktose        Laktoseintolerance  🍬   mælkesukker
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
**ALLERGEN_SUBTYPES fjernet** — ingen undertype-UI.

---

## 9. Allergen-matching

`compareAllergens(flags, activeAllergenIds)` → `{ status, matchedDanger, matchedWarning, hasUnknown }`

`activeIds` beregnes i App.jsx efter hooks:
```js
const allActive = useCallback(() => {
  const ids = new Set(activeProfiles.includes("me") ? allergens : []);
  family.filter(m => activeProfiles.includes(m.id))
    .forEach(m => m.allergens.forEach(a => ids.add(a)));
  return { ids: [...ids], custom: [...customAllerg] };
}, [allergens, customAllerg, family, activeProfiles]);
const activeIds = allActive().ids;
```

---

## 10. Produkt-kildebadge

`verifiedBadge(verified_status, source)` → `{ label, bg, color, dot }`

| Betingelse | Label | Farve |
|---|---|---|
| `verified_status === "verified"` eller `source === "producer"` | Fra producent | Grøn |
| `source === "off"` / `"open_food_facts"` | Open Food Facts | Blå |
| Alt andet | Bruger-indsendt | Grå |

Ingen datakvalitetsbadge — kun kilde.

---

## 11. Designsystem

**CSS i `theme.jsx`:** `export const appCss` + `export const THEME` + `export const color(key)`  
App.jsx: `<style>{appCss}</style>`

```css
--ink:#1F2733  --ink2:#2d3a48  --paper:#FAFAF7  --paper2:#F2F2EE
--green:#22C55E  --green-lt:rgba(34,197,94,.1)  --green-mid:rgba(34,197,94,.18)
--red:#E63946  --red-lt:rgba(230,57,70,.08)  --red-md:rgba(230,57,70,.15)
--amber:#D97706  --amber-lt:rgba(217,119,6,.08)  --amber-md:rgba(217,119,6,.14)
--blue:#2563EB  --border:#E4E4DF  --border2:#D0D0C8
--muted:#8A9099  --muted2:#6B7280  --f:'Inter',system-ui,sans-serif
```

**CSS-klasser:** `.screen`, `.fade-in`, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-outline`, `.btn-danger`, `.btn-full`, `.btn-sm`, `.card`, `.card-lbl`, `.field`, `.field-lbl`, `.input-row`, `.tags`, `.tag`, `.tag-x`, `.chip`, `.chip-grid`, `.ap-chip`, `.product-hero`

**Komponenter:** `<EatSafeLogo size={N} variant="light"|"dark" />` · `<Icon name="..." size={N} color="..." />`

---

## 12. Supabase

**URL:** `https://jegrpcflyguadyxialkm.supabase.co` · **Anon key:** i `constants.jsx`  
**Alle kald:** rå `fetch()` via `makeHeaders(token)` + `apiCall(url, opts)` fra `helpers.js`

### Tabeller
| Tabel | Kolonner |
|-------|---------|
| `users` | id, name, email, role, birth_year, gender, allergens jsonb, custom_allerg jsonb, e_numbers jsonb, diets jsonb, onboarding_completed |
| `family_members` | id, user_id, name, birth_year, gender, color, allergens jsonb, custom_allergens jsonb, diets jsonb, e_numbers jsonb |
| `products` | ean, name, brand, allergen_flags jsonb, ingredients, nutrition jsonb, verified_status, source, image_url |
| `feedback_tickets` | id, type, description, context jsonb, image_base64, status, submitted_by |
| `product_submissions` | id, ean, proposed_name, ocr_raw_text, allergen_flags jsonb, submitted_by, status |
| `scan_history` | id, user_id, ean_scanned, result_status |
| `shopping_lists` | id, owner_id, name |
| `shopping_list_items` | id, list_id, name, checked |
| `recipes` | id, title, category, allergen_flags jsonb, ingredients_raw jsonb, instructions jsonb |

### Auth
Tokens i localStorage: `as_token`, `as_refresh`, `as_user_id`  
Auto-refresh hvert 45 min · Roller: `user`, `admin`  
Postgres trigger opretter `public.users` ved signup

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

## 15. Konventioner

- `App.jsx` = routing + global state. Navigation via `setScreen(SCREENS.X)`
- `// @ts-nocheck` øverst i alle `.jsx`-filer
- **Ingen ALLERGEN_SUBTYPES** — fjernet
- **Ingen 3-state chips** — kun 2-state toggle
- **Ingen datakvalitetsbadge** — kun kilde
- **Spor vises altid**
- CSS i `theme.jsx`, ikke App.jsx
- Supabase REST — `makeHeaders()` + `apiCall()` fra `helpers.js`

---

## 16. Kendte fejl løst

| Fejl | Løsning |
|------|---------|
| `loginEmail is not defined` | Tilføjet som prop til ProfileScreen |
| `activeIds is not defined` | Beregnes lokalt i ScannerScreen |
| `lookupProduct is not defined` | Tilføjet som prop + defineret efter hooks |
| `Cannot access X before initialization` (TDZ) | Hook-rækkefølge: A må ikke modtage setter fra B der initialiseres efter A |
| `screen` TDZ | `useState(() => localStorage.getItem("as_token") ? ...)` i stedet for `useState(accessToken ? ...)` |
| `madpasActiveProfile` TDZ | Moved fra komponent-root til efter hooks |
| `FamilyChips/StepBar/isOnboard` TDZ | Moved til efter hooks-sektionen |
| Søge-useEffect TDZ | Moved til efter hooks |
| `setScanError` cirkulær reference | useProduct bruger intern `setScanError_`, ikke param |
| `setOnboardStep` cirkulær reference | Erstattet med `onSignupSuccess: () => setOnboardStep(1)` callback |

---

## 17. Refaktor-regel

**Første gang vi arbejder på en fil ikke rørt siden refaktoren**, kør import-tjek:

Fra `helpers.js`: `verifiedBadge`, `makeHeaders`, `apiCall`, `timeAgo`, `compareAllergens`, `initials`, `getAllergenLabels`  
Fra `constants.jsx`: `uid`, `PAGE_IDS`, `SCREENS`, `ALLERGENS`  
Props: tjek at alle brugte props sendes fra App.jsx

**Allerede tjekket:** ScannerScreen, ProfileScreen, OnboardingScreen, MemberForm, AllergenPicker, SharedComponents, constants, FeedbackModal, utils, theme, alle hooks

---

## 18. Åbne opgaver

- [ ] `constants.js` udfases
- [ ] Opskrifter-backend mangler data
- [ ] Supabase allowlist til alle preview-URLer
- [ ] Mørkt mørkegrønt tema implementeres
- [ ] Fase 3 theme-refaktor: hardcodede farver i komponentfilerne

---

## 19. Prompt til Jan (backend)

```
📋 PROMPT TIL JAN (BACKEND)
Du er backend-udvikler på EatSafe (Supabase).

KONTEKST: [hvad der er bygget]
OPGAVE: [hvad der skal ændres]

DETALJER:
- Endpoint: [URL]
- Request body: [JSON]
- Response: [format]
- Tabel: [navn]
- RLS: [sikkerhedshensyn]
```
