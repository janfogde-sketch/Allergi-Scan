# EatSafe — Projektkontekst

> Denne fil giver Claude (eller en ny samarbejdspartner) et komplet overblik over projektet.  
> Upload denne fil i starten af en ny chat for at komme direkte i gang.

---

## 1. Hvad er EatSafe?

En dansk allergen-scanning app bygget som en mobil-first React PWA. Brugere scanner stregkoder på madvarer og ser øjeblikkeligt om produktet er sikkert for dem og deres familie baseret på deres allergiprofil.

**Live preview:** `allergi-scan-git-refracktor-janfogde-sketchs-projects.vercel.app`  
**GitHub repo:** `github.com/janfogde-sketch/Allergi-Scan`  
**Aktiv branch:** `Refracktor`

---

## 2. Tech stack

| Del | Teknologi |
|-----|-----------|
| Frontend | React 18 + JSX (ikke TypeScript, `.jsx`-filer) |
| Build | Vite 5 |
| Hosting | Vercel (preview på Refracktor-branch) |
| Database | Supabase (PostgreSQL + REST API) |
| Auth | Supabase Auth (email/password + OAuth) |
| Sprog | Dansk UI |
| Version | v1.0.6 |

**Vigtigt:** Appen bruger IKKE Supabase SDK — alle kald er rå `fetch()` mod Supabase REST API med `apikey`-header.

---

## 3. Filstruktur (`src/`)

```
src/
├── main.tsx                  # Entry point
├── App.jsx                   # Hoved-komponent, al global state, CSS-streng
├── constants.jsx             # ALLERGENS, SCREENS, DIETS, E_NUMBERS, MADPAS_LANGUAGES m.fl.
├── helpers.js                # initials, timeAgo, compareAllergens, makeHeaders, apiCall
├── SharedComponents.jsx      # EatSafeLogo, Icon, IngredientsList, ProfileBadges, ProductImage
├── AllergenPicker.jsx        # ENumberPicker, SubtypeModal, AllergyForm
├── MemberForm.jsx            # MemberForm, CategorySelect
├── OnboardingScreen.jsx      # Welcome, Login, Signup, Onboarding trin 1-9
├── ScannerScreen.jsx         # Home, Scanner, Søgning, Produkt-resultat, Indkøbsliste
├── ProfileScreen.jsx         # Historik, Profil, Familie, Favoritter, Rediger profil
├── RecipesScreen.jsx         # Opskriftsliste + detaljevisning + indkøbsliste-integration
├── MadpasScreen.jsx          # Madpas (allergen-kort til tjenere på 17 sprog)
└── AdminScreen.jsx           # Admin-panel (kun role=admin)
```

---

## 4. Global state (App.jsx)

Al state bor i `App.jsx` og sendes ned som props. Vigtigste:

```js
// Auth
accessToken, refreshToken, userId

// Bruger
user = { name, email, phone, age, gender, diets, role }
allergens = ["gluten", "laktose", ...]   // standard allergen-IDs
customAllerg = ["fructose", "laktose_intolerance", ...]  // egne + intolerance-markering
allergenSubtypes = { laktose: ["laktose_protein"], ... }
selectedENumbers = ["E621", "E211_intolerance", ...]

// Familie
family = [{ id, name, color, allergens, custom, diets, eNumbers }]
activeProfiles = ["me", "m-abc123", ...]  // hvem scannes for

// Navigation
screen  // fra SCREENS-konstanten
```

---

## 5. Screens / navigation

```js
SCREENS = {
  WELCOME, LOGIN, ONBOARD,          // onboarding
  HOME, SEARCH, RESULT, NOTFOUND,   // scanner-flow
  SUBMITTED, SUGGEST_EDIT,          // indsend produkt
  LIST,                             // indkøbsliste
  RECIPES,                          // opskrifter
  MADPAS,                           // madpas
  PROFILE, EDITPROFILE, HISTORY,    // profil
  FAVORITES, FAMILY,                // profil-under
  ADMIN,                            // admin
}
```

Bundnavigation: **Opskrifter → Indkøbsliste → Hjem → Madpas → Profil**

---

## 6. Allergen-system

### De 14 EU-allergener

```js
ALLERGENS = [
  { id:"gluten",      label:"Gluten",         emoji:"🌾" },
  { id:"laktose",     label:"Laktose / Mælk", emoji:"🥛" },
  { id:"aeg",         label:"Æg",             emoji:"🥚" },
  { id:"noedder",     label:"Nødder",         emoji:"🌰" },
  { id:"jordnoedder", label:"Jordnødder",     emoji:"🥜" },
  { id:"soja",        label:"Soja",           emoji:"🫘" },
  { id:"fisk",        label:"Fisk",           emoji:"🐟" },
  { id:"skaldyr",     label:"Skaldyr",        emoji:"🦐" },
  { id:"selleri",     label:"Selleri",        emoji:"🥬" },
  { id:"sennep",      label:"Sennep",         emoji:"🌶️" },
  { id:"sesam",       label:"Sesam",          emoji:"🌿" },
  { id:"svovl",       label:"Sulfitter",      emoji:"🍷" },
  { id:"lupin",       label:"Lupin",          emoji:"🌸" },
  { id:"bloeddyr",    label:"Bløddyr",        emoji:"🦑" },
]
```

### Allergen-flag på produkter

| Værdi | Betydning |
|-------|-----------|
| `"yes"` / `true` | Indeholder allergenet |
| `"no"` / `false` | Indeholder ikke |
| `"traces"` | Kan indeholde spor |
| `"unknown"` / `null` | Ukendt |

Produkter bruger strings (`"yes"`), opskrifter bruger booleans (`true`).

### `compareAllergens(flags, activeAllergenIds)` → `{ status, matchedDanger, matchedWarning, hasUnknown, confidence, explanation }`

- `"danger"` hvis direkte match
- `"warn"` hvis kun spor
- `"safe"` ellers

### 3-state allergi-logik (bruger-profil)

- `allergens[]` indeholder ID'et
- `customAllerg[]` indeholder `id+"_intolerance"` ved intolerance
- Allergi = i allergens men IKKE i customAllerg som intolerance

### Undertyper (8 allergener har præcisering)
gluten, laktose, noedder, aeg, fisk, soja, skaldyr, sesam — se `ALLERGEN_SUBTYPES` i `constants.jsx`.

---

## 7. Supabase-tabeller (REST API)

Alle kald bruger `makeHeaders(accessToken)` fra `helpers.js`.

| Tabel | Bruges til |
|-------|-----------|
| `users` | Brugerprofil (id, name, email, phone, age, role, onboarding_completed) |
| `user_allergens` | Brugerens allergener (user_id, allergen, type) |
| `family_members` | Familie (user_id, name, color, allergens jsonb, custom_allergens jsonb, diets jsonb, e_numbers jsonb) |
| `products` | Produktdatabase (ean, name, brand, allergen_flags jsonb, ingredients, ...) |
| `scan_history` | Scanningshistorik (user_id, ean_scanned, ...) |
| `shopping_lists` | Indkøbslister (owner_id, name) |
| `shopping_list_items` | Varer i liste (list_id, name, checked) |
| `recipes` | Opskrifter (title, category, allergen_flags jsonb, ingredients_raw jsonb, instructions jsonb, ...) |
| `product_submissions` | Bruger-indsendte produkter |
| `feedback_tickets` | Feedback fra brugere |

**Vigtig note:** Supabase Edge Functions (`/functions/v1/...`) er IKKE deployet og bruges ikke. Al kommunikation sker via REST API direkte.

**Trigger:** `users`-tabellen har en Postgres-trigger der opretter en ny række automatisk når en auth-bruger oprettes. Authenticated brugere har ikke INSERT-rettighed på `users` — kun triggeren.

---

## 8. Auth-flow

```
Signup → Supabase auth.users + trigger opretter public.users
       → saveTokens(access, refresh, userId)
       → SCREENS.ONBOARD step 1

Login  → tokens gemmes → SCREENS.HOME

OAuth  → URL hash indeholder tokens → ny/eksisterende bruger check
```

Fejlhåndtering: Supabase v2 returnerer fejl i `data.msg` (ikke `data.message`).

---

## 9. Onboarding-flow (trin)

| Trin | Indhold | Gemmer |
|------|---------|--------|
| 1 | Feature-tour (swipeable) | — |
| 2 | Forstå data-kvalitet | — |
| 25 | Hvad kan EatSafe? | — |
| 3 | Navn, email, telefon, alder, køn | `saveProfileStep1()` → PATCH users |
| 4 | Allergier / intolerancer (3-state chips) | — |
| 5 | E-numre | `saveAllergensStep2()` → user_allergens |
| 6 | Diæt | — |
| 7 | Familie (tilføj medlemmer) | — |
| 8 | Hjælp fællesskabet | — |
| 9 | Oversigt + "Gå til appen" | `finishOnboard()` |

`StepBar` er defineret i App.jsx og sendes som prop til OnboardingScreen.

---

## 10. Opskrift-system

- Opskrifter hentes fra `recipes`-tabellen via REST
- `ingredients_raw` er JSONB der returneres som objekt (ikke string) fra Supabase
- Format: `[{ sort_order, name, name_en, amount, unit, measure }]`
- `instructions` er JSONB array af trin-strenge
- Allergen-flags er booleans (`true/false`) — ikke strings
- Portioner skaleres med `recipeServings / baseServings`
- Familie-sikkerhedsgrid vises øverst (samme design som produktresultat)
- Ingredienser kan tilføjes til indkøbsliste enkeltvis eller alle på én gang

---

## 11. Kendte begrænsninger / åbne punkter

- Allergen-undertyper (fx "kun hasselnød") filtrerer ikke finkornet endnu — kun til brugerforståelse
- `bloeddyr` og `skaldyr` overlapper (begge dækker bløddyr)
- Madpas-tekster på 17 sprog — bør fagligt gennemses af allergen-ekspert
- Admin-panel er kun tilgængeligt for brugere med `role = "admin"` i `users`-tabellen

---

## 12. CSS

Al styling er inline i en `css`-streng i App.jsx (injiceres via `<style>{css}</style>`). CSS-variabler:

```css
--ink: #1F2733    /* mørk tekst */
--paper: #FAFAF7  /* baggrund */
--green: #22C55E  /* primær accent */
--red: #E63946    /* fare/allergen */
--amber: #D97706  /* advarsel/intolerance */
--muted: #8A9099  /* grå tekst */
```

---

## 13. Typiske fejl vi har løst (reference)

| Fejl | Årsag | Løsning |
|------|-------|---------|
| `X is not defined` | Komponent extraheret til ny fil men ikke importeret | Tilføj import eller send som prop |
| `StepBar is not defined` | Defineret i App.jsx, bruges i OnboardingScreen | Sendes nu som prop |
| `FamilyChips is not defined` | Samme problem | Defineret lokalt i ProfileScreen |
| `E_CATEGORIES is not defined` | Manglende import i MemberForm.jsx | Tilføjet til import fra constants.jsx |
| 400 på Edge Functions | Edge Functions er ikke deployet | Omskrevet til direkte REST API |
| 422 på signup | Supabase v2 fejl er i `data.msg` ikke `data.message` | Fejlhåndtering opdateret |
| Raw JSON i ingredienser | `ingredients_raw` er allerede parset objekt fra Supabase JSONB | Tjek `Array.isArray()` før `JSON.parse()` |
| Dobbelt indhold på opskriftskærm | `<RecipesScreen>` renderet to gange i App.jsx | Fjernet duplikeret render |

---

*Sidst opdateret: Maj 2026 · EatSafe v1.0.6*
