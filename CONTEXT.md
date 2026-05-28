# EatSafe — CONTEXT.md
> Upload denne fil i starten af hver Claude-session for fuldt overblik uden at uploade kildefiler.
> **Opdateres af:** Bjørn (frontend) eller Jan (backend) ved større ændringer.
> **Sidst opdateret:** 28. maj 2026

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
| Styling | Vanilla CSS-in-JS — CSS-streng i `theme.jsx` + inline styles i komponenter |
| Backend | Supabase (PostgreSQL + Auth + Storage) — **ingen SDK, kun rå fetch() mod REST API** |
| Kamera | html5-qrcode |
| Font | Inter (Google Fonts, importeret i CSS-strengen i theme.jsx) |
| Deploy | Vercel (auto-deploy ved push til Refracktor-branch) |

---

## 4. Filstruktur

```
/
├── src/
│   ├── App.jsx              # Router, global state, bundnav — ~2000 linjer
│   ├── theme.jsx            # AL CSS (appCss-streng) + THEME-tokens objekt + color() helper
│   ├── utils.jsx            # BUILD_TIME, COMMIT_SHA, formatBuildTime(), getGreeting(), buildScreenLabel()
│   ├── FeedbackModal.jsx    # Feedback-modal — selvstændig komponent med egen state og submit-logik
│   ├── constants.jsx        # ALLE konstanter: ALLERGENS, SCREENS, DIETS, E_NUMBERS, PAGE_IDS m.fl.
│   ├── constants.js         # Ældre duplikat — constants.jsx er primær, .js udfases
│   ├── helpers.js           # Pure JS: initials(), timeAgo(), compareAllergens(), makeHeaders(), apiCall(), verifiedBadge()
│   ├── SharedComponents.jsx # EatSafeLogo, Icon, IngredientsList, ProfileBadges, ProductImage, getProductIcon
│   ├── AllergenPicker.jsx   # Kun ENumberPicker — SubtypeModal og AllergyForm er fjernet
│   ├── MemberForm.jsx       # MemberForm (familie-formular), CategorySelect
│   ├── OnboardingScreen.jsx # WELCOME, LOGIN, ONBOARD (10 trin inkl. trin 25)
│   ├── ScannerScreen.jsx    # HOME, RESULT, SEARCH, LIST, NOTFOUND, SUBMITTED, SUGGEST_EDIT
│   ├── ProfileScreen.jsx    # PROFILE, FAMILY, FAVORITES, HISTORY, EDITPROFILE
│   ├── MadpasScreen.jsx     # MADPAS (17 sprog, tjenervisning)
│   ├── RecipesScreen.jsx    # RECIPES
│   ├── AdminScreen.jsx      # ADMIN (submissions, tickets, brugere)
│   ├── styles.css           # Supplerende CSS-klasser
│   ├── index.css            # Body/root reset
│   ├── main.tsx             # React root mount
│   └── vite.config.ts       # Injicerer __BUILD_TIME__ og __COMMIT_SHA__ ved deploy
├── public/
│   ├── manifest.json
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   └── privacy.html
├── index.html
└── package.json
```

### Vigtige fil-relationer
- `App.jsx` importerer `appCss` fra `theme.jsx` og renderer `<style>{appCss}</style>`
- `App.jsx` importerer `BUILD_TIME`, `COMMIT_SHA`, `formatBuildTime`, `getGreeting`, `buildScreenLabel` fra `utils.jsx`
- `App.jsx` renderer `<FeedbackModal>` og sender kun kontekst-props + `open`/`onClose`
- Alle screen-filer importerer fra `constants.jsx`, `helpers.js`, `SharedComponents.jsx`

---

## 5. Screens og navigation

| Konstant | Streng | Page ID | Komponent | Beskrivelse |
|----------|--------|---------|-----------|-------------|
| SCREENS.WELCOME | `welcome` | SCR-01 | OnboardingScreen | Splash/velkomst |
| SCREENS.LOGIN | `login` | SCR-02 | OnboardingScreen | Login + signup |
| SCREENS.ONBOARD | `onboard` | SCR-03 | OnboardingScreen | 10-trins onboarding |
| SCREENS.HOME | `home` | SCR-04 | ScannerScreen | Hjemskærm + scanner |
| SCREENS.SEARCH | `search` | SCR-06 | ScannerScreen | Søg produkter |
| SCREENS.LIST | `list` | SCR-07 | ScannerScreen | Indkøbsliste |
| SCREENS.PROFILE | `profile` | SCR-08 | ProfileScreen | Profil + genveje |
| SCREENS.FAMILY | `family` | SCR-09 | ProfileScreen | Familiemedlemmer |
| SCREENS.RESULT | `result` | SCR-10 | ScannerScreen | Produktresultat |
| SCREENS.HISTORY | `history` | SCR-11 | ProfileScreen | Scanningshistorik |
| SCREENS.NOTFOUND | `notfound` | SCR-12 | ScannerScreen | Produkt ikke fundet |
| SCREENS.SUBMITTED | `submitted` | SCR-13 | ScannerScreen | Produkt indsendt |
| SCREENS.ADMIN | `admin` | SCR-14 | AdminScreen | Admin dashboard |
| SCREENS.FAVORITES | `favorites` | SCR-15 | ProfileScreen | Favoritter |
| SCREENS.MADPAS | `madpas` | SCR-16 | MadpasScreen | Madpas/rejsekort |
| SCREENS.RECIPES | `recipes` | SCR-17 | RecipesScreen | Opskrifter |
| SCREENS.EDITPROFILE | `editprofile` | SCR-18 | ProfileScreen | Rediger profil |
| SCREENS.SUGGEST_EDIT | `suggest_edit` | — | ScannerScreen | Foreslå rettelse |

**Bundnavigation:** Opskrifter → Indkøbsliste → Hjem → Madpas → Profil (5 punkter)

---

## 6. Onboarding-flow (10 trin)

| `onboardStep` | Indhold |
|---|---|
| 1 | Feature-tour (swipeable slides) |
| 2 | Datakvalitet forklaring |
| 25 | De tre kategorier: Allergier/intolerancer · E-numre · Diæter |
| 3 | Hvem er du? (navn, email, telefon, fødselssår, køn) |
| 4 | Allergier / intolerancer (2-state chips) |
| 5 | E-numre (2-state liste via ENumberPicker) |
| 6 | Diæt |
| 7 | Familie (tilføj medlemmer) |
| 8 | Hjælp fællesskabet |
| 9 | Oversigt + "Gå til appen" |

**StepBar:** Defineret i App.jsx, sendt som prop til OnboardingScreen.  
Tæller-formel: `step===25 ? 3 : step<3 ? step : step+1`

---

## 7. Allergener (16 stk)

```
id             label               emoji   note
────────────────────────────────────────────────────────────────
gluten         Gluten              🥖
hvede          Hvede               🌾      hvedeprotein-allergi — separat fra gluten/cøliaki
maelkeallergi  Mælk                🥛      mælkeprotein (kasein/valle) — lang ingrediensliste
laktose        Laktoseintolerance  🍬      kun mælkesukker
aeg            Æg                  🥚
noedder        Nødder              🌰
jordnoedder    Jordnødder          🥜
soja           Soja                🫛      ærtebælg-emoji
fisk           Fisk                🐟
skaldyr        Skaldyr             🦐
selleri        Selleri             🥬
sennep         Sennep              🟡      gul cirkel-emoji
sesam          Sesam               🌿
svovl          Sulfitter           🍷
lupin          Lupin               🌸
bloeddyr       Bløddyr             🦑
```

**Mælkeallergi-ingrediensliste** (fra allergenekspert):
kasein, kaseinat, kaliumkaseinat, natriumkaseinat, kalciumkaseinat, valle, valleprotein, vallepulver, lactalbumin, tørmælk, skummetmælkspulver, sødmælkspulver, mælkepulver, inddampet mælk, mælkebestanddele, mælketørstof, mælkeprotein, margarine, minarine, animalsk fedtstof*, animalsk olie*, smøraroma*, smørolie*  
(*Kan indeholde spor af mælkeprotein)  
**Mælkesyre (E270) og kakaosmør tåles — ikke på listen.**

**ALLERGEN_SUBTYPES er fjernet** — ingen undertype-UI, ingen 3-state chips.  
**Chip-logik:** Simpel 2-state toggle. Ingen `_intolerance`-suffiks i arrays.

---

## 8. Allergen-matching

`compareAllergens(flags, activeAllergenIds)` i `helpers.js`:
- Returnerer `{ status, matchedDanger, matchedWarning, hasUnknown, confidence }`
- `status`: `"danger"` / `"warn"` / `"safe"`
- `flags`-værdier: `"yes"` / `"traces"` / `"no"` / `null`

**`activeIds` beregnes i ScannerScreen:**
```js
const activeIds = [
  ...(activeProfiles.includes("me") ? allergens : []),
  ...family.filter(m => activeProfiles.includes(m.id))
    .flatMap(m => Array.isArray(m.allergens)
      ? m.allergens
      : Object.keys(m.allergens||{}).filter(k => m.allergens[k])),
].filter((v,i,a) => a.indexOf(v) === i);
```

**Spor vises altid** — bruger tager selv bestik af sporadvarsler.

---

## 9. Produkt-kildebadge

`verifiedBadge(verified_status, source)` → `{ label, bg, color, dot }`

| Betingelse | Label | Farve |
|---|---|---|
| `verified_status === "verified"` eller `source === "producer"` | Fra producent | Grøn |
| `source === "off"` / `"open_food_facts"` | Open Food Facts | Blå |
| Alt andet | Bruger-indsendt | Grå |

**Ingen datakvalitetsbadge** — kun kilde. Sikkerhedsvurdering er fjernet.

---

## 10. Produktside-layout (SCREENS.RESULT)

Rækkefølge oppefra:
1. Sikkerhedsgrid (én boks per aktiv profil — grøn/amber/rød)
2. Produkt-hero med kildebadge integreret i bunden
3. Handlingsknapper: Favorit · Del · Ret data (direkte under hero)
4. Andre allergener i produktet (kun dem der ikke er på brugerens profil)
5. Ingrediensliste — altid udfoldet
6. Næringsindhold pr. 100g — altid udfoldet

---

## 11. Designsystem

### Arkitektur
- `theme.jsx` — `export const appCss` (CSS-streng) + `export const THEME` (tokens) + `export const color(key)`
- `App.jsx` injicerer: `<style>{appCss}</style>`
- Skift tema: opdater `THEME`-objektet + `:root`-blokken i `appCss`

### CSS-variabler
```css
--ink:#1F2733  --ink2:#2d3a48  --paper:#FAFAF7  --paper2:#F2F2EE
--green:#22C55E  --green-lt:rgba(34,197,94,.1)  --green-mid:rgba(34,197,94,.18)
--red:#E63946  --red-lt:rgba(230,57,70,.08)  --red-md:rgba(230,57,70,.15)
--amber:#D97706  --amber-lt:rgba(217,119,6,.08)  --amber-md:rgba(217,119,6,.14)
--blue:#2563EB  --border:#E4E4DF  --border2:#D0D0C8
--muted:#8A9099  --muted2:#6B7280  --f:'Inter',system-ui,sans-serif  --r:12px
```

### CSS-klasser
```
.screen  .screen-title  .fade-in
.btn  .btn-primary  .btn-ghost  .btn-outline  .btn-danger  .btn-full  .btn-sm
.card  .card-lbl
.field  .field-lbl  .input-row
.tags  .tag  .tag-x  .chip  .chip-grid
.ap-chip  .ap-chip.on
.product-hero  .product-hero-img  .product-hero-body  .product-hero-name  .product-hero-brand  .product-hero-meta
```

### Komponenter
- `<EatSafeLogo size={N} variant="light"|"dark" />`
- `<Icon name="..." size={N} color="..." />` — navne: `home`, `scan`, `list`, `profile`, `recipes`, `globe`, `star`, `search`, `warning`, `check`, `chevronRight`, `chevronDown`, `trash`, `heart`, `plus`, `camera`, `share`, `info`, `family`, `edit`, `cart`, `x`, `torch`, `gallery`

---

## 12. Supabase

**URL:** `https://jegrpcflyguadyxialkm.supabase.co`  
**Anon key:** `SUPABASE_ANON_KEY` i `constants.jsx`  
**Alle kald:** rå `fetch()` — `makeHeaders(token)` og `apiCall(url, opts)` fra `helpers.js`

### Tabeller
| Tabel | Vigtige kolonner |
|-------|---------|
| `users` | id, name, email, role, birth_year INTEGER, gender TEXT, allergens jsonb, custom_allerg jsonb, e_numbers jsonb, diets jsonb, onboarding_completed |
| `family_members` | id, user_id, name, birth_year INTEGER, gender TEXT, color, allergens jsonb, custom_allergens jsonb, diets jsonb, e_numbers jsonb |
| `products` | ean, name, brand, category, allergen_flags jsonb, ingredients TEXT, nutrition jsonb, tags jsonb, verified_status, source, image_url, updated_at |
| `feedback_tickets` | id, type, description, context jsonb, image_base64, status, submitted_by, created_at |
| `product_submissions` | id, ean, proposed_name, ocr_raw_text, allergen_flags jsonb, image_base64, submitted_by, status |
| `scan_history` | id, user_id, ean_scanned, product_name, result_status, created_at |
| `shopping_lists` | id, owner_id, name |
| `shopping_list_items` | id, list_id, name, checked, created_at |
| `recipes` | id, title, category, allergen_flags jsonb, ingredients_raw jsonb, instructions jsonb, cook_time, prep_time, servings, difficulty, tags |

### Auth
- Email/password + Google OAuth
- Tokens i localStorage: `as_token` (access), `as_refresh` (refresh)
- Auto-refresh hvert 45 min · Roller: `user` (standard), `admin`
- Postgres trigger opretter `public.users` ved signup — ingen INSERT-ret for authenticated brugere

### SQL-migrationer kørt
```sql
-- 2026-05-28
ALTER TABLE family_members
  DROP COLUMN IF EXISTS age,
  ADD COLUMN IF NOT EXISTS birth_year INTEGER,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Mand','Kvinde','Andet'));

ALTER TABLE users
  DROP COLUMN IF EXISTS age,
  ADD COLUMN IF NOT EXISTS birth_year INTEGER,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Mand','Kvinde','Andet'));
```

### `feedback_tickets.context` JSON
```json
{
  "screen_id": "result",
  "screen_label": "Produktresultat — Arla Letmælk [EAN: 5740000000000]",
  "page_id": "SCR-10",
  "build_time": "2026-05-28T20:00:00.000Z",
  "commit_sha": "909d6f3",
  "user_name": "Jan Fogde",
  "user_email": "janfogde@gmail.com",
  "user_role": "admin",
  "allergens": ["maelkeallergi","gluten"],
  "allergens_count": 2,
  "family_count": 1,
  "history_count": 47,
  "active_profiles": ["me"],
  "scan_result_ean": "5740000000000",
  "scan_result_name": "Arla Letmælk",
  "viewport": "390x844",
  "platform": "iPhone",
  "online": true
}
```

---

## 13. Build-system

### vite.config.ts
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __COMMIT_SHA__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA?.slice(0,7) || "local"),
  },
})
```

### utils.jsx exports
| Export | Type | Beskrivelse |
|--------|------|-------------|
| `BUILD_TIME` | string | ISO-tidsstempel fra compile-time |
| `COMMIT_SHA` | string | 7-tegns commit hash |
| `formatBuildTime()` | function | Dansk formateret dato/tid |
| `getGreeting()` | function | Tidspunktsbaseret hilsen |
| `buildScreenLabel({screen,...})` | function | Præcis skærmbeskrivelse til feedback |

---

## 14. FeedbackModal

Selvstændig komponent. App.jsx sender kun:
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

Al intern state og submit-logik bor i `FeedbackModal.jsx`.  
**Typer:** bug 🐛 · ui 🎨 · missing 💡 · content 📦 · crash 💥 · suggestion ✨

---

## 15. Ingrediensliste-editor

Delt logik i `ScannerScreen.jsx` — bruges i NOTFOUND (trin 3) og SUGGEST_EDIT:

```js
const [ingItems, setIngItems] = React.useState([]);  // array af ingredienser
const [ingInput, setIngInput] = React.useState("");

const parseIngredients = (text) => { /* parser komma/semikolon/parentes */ };
const addIngItem = () => { /* tilføjer fra input-felt */ };
const ingToText = (items) => items.join(", ");

// Auto-sync: ocrText → ingItems når OCR returnerer
React.useEffect(() => { ... }, [ocrText]);
```

Synkroniseres til `ocrText`/`editIngText` ved indsendelse.

---

## 16. Madpas (SCR-16)

17 sprog: `da, en, de, fr, es, it, nl, pt, pl, sv, no, ja, zh, ar (RTL), tr, th, el`  
Data bundled offline i `constants.jsx`: `MADPAS_LANGUAGES`, `ALLERGEN_T`, `MADPAS_INTRO`, `ALLERGEN_EXAMPLES`  
Tjener-visning: fullscreen overlay, stor tekst, Web Speech API oplæsning.

---

## 17. Konventioner

- **`App.jsx`** = routing + global state. Navigation via `setScreen(SCREENS.X)`
- **`// @ts-nocheck`** øverst i alle `.jsx`-filer
- **Ingen ALLERGEN_SUBTYPES** — fjernet helt
- **Ingen 3-state chips** — kun 2-state toggle, ingen `_intolerance`-suffiks
- **Ingen datakvalitetsbadge** — kun kilde-badge
- **Supabase REST** — `makeHeaders()` + `apiCall()` fra `helpers.js`
- **CSS i theme.jsx** — ikke i App.jsx
- **Ingredienser og næring** altid udfoldet på produktsiden
- **Spor vises altid**

---

## 18. Kendte fejl løst

| Fejl | Løsning |
|------|---------|
| `loginEmail is not defined` | Tilføjet som prop til ProfileScreen |
| `activeIds is not defined` | Beregnes lokalt i ScannerScreen |
| `lookupProduct is not defined` | Tilføjet som prop til ScannerScreen |
| `verifiedBadge/makeHeaders/apiCall/uid` not defined | Tilføjet til imports i ScannerScreen |
| `StepBar is not defined` | Sendes som prop fra App.jsx |
| `Icon is not defined` i AllergenPicker | Import tilføjet fra SharedComponents |
| `ALLERGEN_SUBTYPES` not exported | Fjernet fra constants og alle imports |
| `SubtypeModal` not exported | Fjernet fra AllergenPicker og alle imports |
| Dobbelt import i ProfileScreen | Duplikat fjernet |
| Backtick syntax fejl i theme.jsx | Python escaped forkert — rettet manuelt |

---

## 19. Refaktor-regel

**Første gang vi arbejder på en fil der ikke er rørt siden refaktoren**, køres import-tjek:

Fra `helpers.js`: `verifiedBadge`, `makeHeaders`, `apiCall`, `timeAgo`, `compareAllergens`, `initials`, `getAllergenLabels`  
Fra `constants.jsx`: `uid`, `PAGE_IDS`, `SCREENS`, `ALLERGENS`  
Props: tjek om alle brugte props sendes fra App.jsx

**Allerede tjekket:** ScannerScreen, ProfileScreen, OnboardingScreen, MemberForm, AllergenPicker, SharedComponents, constants, FeedbackModal, utils, theme

---

## 20. Åbne opgaver

- [ ] `constants.js` udfases
- [ ] Opskrifter-backend mangler data
- [ ] Supabase allowlist til alle preview-URLer
- [ ] Mørkt mørkegrønt tema implementeres (mockup lavet)
- [ ] Fase 3 af theme-refaktor: hardcodede farver i komponentfilerne

---

## 21. Prompt til Jan (backend-format)

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
