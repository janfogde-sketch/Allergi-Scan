# EatSafe — CONTEXT.md
> Upload denne fil i starten af hver Claude-session. Den giver Claude det fulde overblik over projektet uden at uploade alle kildefiler.
> **Opdateres af:** Bjørn (frontend) eller Jan (backend) når der sker større ændringer.
> **Sidst opdateret:** 28. maj 2026

---

## 1. Hvad er EatSafe?

PWA-app (Progressive Web App) der hjælper allergiramte med at scanne produkter, tjekke allergener og vise deres allergier til restaurantpersonale i udlandet.

**Live:** https://eatsafe.dk  
**Repo:** Vercel-deploy fra GitHub  
**Status:** Åben beta

---

## 2. Roller

| Person | Ansvar |
|--------|--------|
| Bjørn  | Frontend — React/JSX, UI, komponenter, CSS |
| Jan    | Backend — Supabase, API, database, auth, deploy |

**Arbejdsgang:** Bjørn arbejder i Claude med kildefiler uploadet. Jan håndterer Supabase og Vercel. Kommunikation via denne fil + direkte aftaler.

---

## 3. Tech stack

| Lag | Teknologi |
|-----|-----------|
| Frontend | React 18 + JSX (ikke TypeScript i .jsx-filer — `// @ts-nocheck` øverst) |
| Bundler | Vite 5 (`vite.config.ts` definerer `__BUILD_TIME__` og `__COMMIT_SHA__` ved deploy) |
| Styling | Vanilla CSS-in-JS (inline + `const css` streng i `App.jsx` + `styles.css`) |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Kamera | html5-qrcode |
| Font | Inter (Google Fonts, loaded i CSS) |
| Deploy | Vercel (auto-deploy ved push til main) |

---

## 4. Filstruktur

```
/
├── src/
│   ├── App.jsx              # Router, global state, CSS-streng, feedback-modal, bundnav
│   ├── constants.jsx        # ALLE konstanter: ALLERGENS, SCREENS, DIETS, MADPAS_LANGUAGES, ALLERGEN_T, E_NUMBERS m.fl.
│   ├── constants.js         # (duplikat/ældre version — constants.jsx er primær)
│   ├── helpers.js           # initials(), timeAgo(), compareAllergens(), makeHeaders(), apiCall()
│   ├── SharedComponents.jsx # EatSafeLogo, Icon, IngredientsList, ProfileBadges, ProductImage, getProductIcon
│   ├── AllergenPicker.jsx   # ENumberPicker (E-numre UI)
│   ├── MemberForm.jsx       # MemberForm (familie-formular), CategorySelect
│   ├── OnboardingScreen.jsx # WELCOME, LOGIN, ONBOARD (7 trin)
│   ├── ScannerScreen.jsx    # HOME, SCAN, RESULT, SEARCH, LIST, NOTFOUND, SUBMITTED, SUGGEST_EDIT
│   ├── ProfileScreen.jsx    # PROFILE, FAMILY, FAVORITES, HISTORY, EDITPROFILE
│   ├── MadpasScreen.jsx     # MADPAS (rejsefunktion, 17 sprog, tjenervisning)
│   ├── RecipesScreen.jsx    # RECIPES (opskrifter)
│   ├── AdminScreen.jsx      # ADMIN (submissions, tickets, brugere, familie-admin)
│   ├── styles.css           # Supplerende CSS-klasser
│   ├── index.css            # Body/root reset
│   ├── main.tsx             # React root mount
│   └── vite.config.ts       # __BUILD_TIME__ + __COMMIT_SHA__ defines
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── favicon.svg          # EatSafe stregkode-logo (SVG)
│   ├── apple-touch-icon.png # iOS ikon
│   ├── icons.svg
│   └── privacy.html         # Privatlivspolitik (GDPR)
├── index.html
├── package.json
└── tsconfig*.json
```

---

## 5. Screens og Page IDs

| Screen-konstant | Streng | Page ID | Komponent | Beskrivelse |
|-----------------|--------|---------|-----------|-------------|
| SCREENS.WELCOME | `welcome` | SCR-01 | OnboardingScreen | Splash/velkomst |
| SCREENS.LOGIN | `login` | SCR-02 | OnboardingScreen | Login + signup |
| SCREENS.ONBOARD | `onboard` | SCR-03 | OnboardingScreen | 7-trins onboarding |
| SCREENS.HOME | `home` | SCR-04 | ScannerScreen | Hjemskærm |
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

---

## 6. Allergener (16 stk)

```
id             label               emoji
──────────────────────────────────────
gluten         Gluten              🥖
hvede          Hvede               🌾   ← separat fra gluten (hvedeprotein)
maelkeallergi  Mælk                🥛   ← mælkeprotein (kasein/valle)
laktose        Laktoseintolerance  🍬   ← laktose (mælkesukker)
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

**Vigtigt:** `maelkeallergi` og `laktose` er to separate allergener. Mælkeallergi matcher en lang liste af skjulte ingredienser (kaseinat, lactalbumin, valle, animalsk fedtstof, margarine osv.). Laktoseintolerance matcher primært laktose/mælkesukker.

**ALLERGEN_SUBTYPES er fjernet** — der er ingen undertype-UI mere.

---

## 7. Designsystem

### Brand-farver (CSS-variabler)
```css
--ink: #1F2733        /* Primær tekst + mørk baggrund */
--ink2: #2d3a48
--paper: #FAFAF7      /* Primær baggrund */
--paper2: #F2F2EE     /* Sekundær baggrund / input-felter */
--green: #22C55E      /* Primær accent */
--green-glow: #4ADE80
--green-lt: rgba(34,197,94,.1)
--green-mid: rgba(34,197,94,.18)
--red: #E63946
--red-lt: rgba(230,57,70,.08)
--red-md: rgba(230,57,70,.15)
--amber: #D97706
--amber-lt: rgba(217,119,6,.08)
--amber-md: rgba(217,119,6,.14)
--blue: #2563EB
--border: #E4E4DF
--border2: #D0D0C8
--muted: #8A9099
--muted2: #6B7280
--f: 'Inter', system-ui, sans-serif
```

### Logo
`<EatSafeLogo size={N} variant="light"|"dark" />` — SVG stregkode med grøn scan-linje. Brug `variant="light"` på mørk baggrund.

### Icon-komponent
`<Icon name="..." size={N} color="..." />` — SVG-ikoner. Tilgængelige navne: `home`, `scan`, `list`, `profile`, `recipes`, `globe`, `star`, `search`, `warning`, `check`, `chevronRight`, `chevronDown`, `trash`, `heart`, `plus`, `camera`, `share`, `info`, `family`, `edit`, `cart`, `x`, `torch`, `gallery`.

### CSS-konventioner
- Alle screen-komponenter har `.screen` klassen og `fade-in` animation
- Knapper: `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-outline`, `.btn-danger`, `.btn-full`, `.btn-sm`
- Kort: `.card`, `.card-lbl`
- Felter: `.field`, `.field-lbl`
- Bundnavigation: 4 punkter — Hjem / Opskrifter / Liste / Profil

---

## 8. Supabase

**URL:** `https://jegrpcflyguadyxialkm.supabase.co`  
**Anon key:** Ligger i `constants.jsx` — `SUPABASE_ANON_KEY`

### Primære tabeller
| Tabel | Indhold |
|-------|---------|
| `users` | Brugerprofiler (name, email, role, **birth_year INTEGER**, gender, allergens, custom_allerg, e_numbers, diets) |
| `family_members` | Familiemedlemmer (name, **birth_year INTEGER**, **gender TEXT**, allergens, custom_allergens, diets, e_numbers, color, user_id) |
| `products` | Produktdatabase (ean, name, brand, allergen_flags, verified_status) |
| `feedback_tickets` | Brugerfeedback (type, description, context JSON, image_base64, status) |
| `product_submissions` | Bruger-indsendte produkter (ean, ocr_raw_text, ai_parsed_data, status) |
| `recipes` | Opskrifter (name, allergen_flags, ingredients, steps, category, tags) |
| `shopping_lists` | Delte indkøbslister |

### Obligatoriske felter (validering i frontend)
| Entitet | Obligatoriske felter |
|---------|----------------------|
| Bruger | `name`, `birth_year`, `gender` (mail er krav fra Supabase Auth) |
| Familiemedlem | `name`, `birth_year`, `gender` |
Gem-knapper er deaktiveret indtil alle obligatoriske felter er udfyldt.

### SQL-migrationer kørt
```sql
-- 2026-05-28: Tilføj age + gender til family_members (siden omdøbt til birth_year)
-- 2026-05-28: Omdøb age → birth_year på både users og family_members
ALTER TABLE family_members
  DROP COLUMN IF EXISTS age,
  ADD COLUMN IF NOT EXISTS birth_year INTEGER,
  ADD COLUMN IF NOT EXISTS gender     TEXT CHECK (gender IN ('Mand', 'Kvinde', 'Andet'));

ALTER TABLE users
  DROP COLUMN IF EXISTS age,
  ADD COLUMN IF NOT EXISTS birth_year INTEGER,
  ADD COLUMN IF NOT EXISTS gender     TEXT CHECK (gender IN ('Mand', 'Kvinde', 'Andet'));
```

### Auth
- Email/password + Google OAuth
- Tokens: `accessToken` + `refreshToken` i localStorage (`as_token`, `as_refresh`)
- Auto-refresh hvert 45 min
- Roller: `user` (standard) og `admin`

### `feedback_tickets.context` (JSON-felt)
Indeholder fuld diagnostik inkl.:
- `screen_id`, `screen_label` (præcis dansk beskrivelse), `page_id`
- `build_time`, `commit_sha` (fra Vite define)
- `user_name`, `user_email`, `user_role`
- `allergens` (array), `allergens_count`, `family_count`, `history_count`
- `scan_result_name`, `scan_result_ean`, `madpas_lang`, `selected_recipe`
- `viewport`, `screen_size`, `platform`, `online`

---

## 9. Build-system

`vite.config.ts` injicerer ved hvert deploy:
```ts
define: {
  __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  __COMMIT_SHA__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA?.slice(0,7) || "local"),
}
```

Bruges i `App.jsx` via `BUILD_TIME` og `COMMIT_SHA` konstanter + `formatBuildTime()` funktion.  
Vises på: velkomstskærm, login-skærm, hjemskærm (lille grå tekst under hilsen).

---

## 10. Madpas (SCR-16)

Rejsefunktion der viser brugerens allergier til restaurantpersonale på 17 sprog:
`da, en, de, fr, es, it, nl, pt, pl, sv, no, ja, zh, ar (RTL), tr, th, el`

Data er **bundled offline** — ingen API-kald. Konstanter i `constants.jsx`:
- `MADPAS_LANGUAGES` — sprog-liste med flag, navn, BCP-kode
- `ALLERGEN_T` — oversat navn + beskrivelse pr. allergen pr. sprog
- `MADPAS_INTRO` — intro-sætning pr. sprog
- `ALLERGEN_EXAMPLES` — 5 produkter + 5 ingredienser pr. allergen pr. sprog

**Tjener-visning:** Fullscreen overlay, stor tekst, grøn oplæs-knap (Web Speech API).

---

## 11. Vigtige beslutninger / konventioner

- **Én App.jsx** er sandheden for routing og global state. Al skærmnavigation sker via `setScreen(SCREENS.X)`.
- **Ingen preview-fil** — vi arbejder kun i `App.jsx` og komponent-filerne.
- **`// @ts-nocheck`** øverst i alle `.jsx`-filer.
- **Ingen `ALLERGEN_SUBTYPES`** — fjernet. Ingen undertype-UI.
- **`maelkeallergi` ≠ `laktose`** — to separate allergener med forskellig matching-logik.
- **Hvedeallergi (`hvede`) ≠ gluten** — særskilt allergen mod hvedeprotein.
- **`sennep` emoji = 🟡** (gul cirkel), **`soja` emoji = 🫛** (ærtebælg).
- **Bundnavigation:** Hjem / Opskrifter / Liste / Profil (4 punkter). Madpas tilgås via Profil-genveje.
- **CSS:** Inline styles og CSS-klasser blandes frit. Ingen CSS-modules, ingen Tailwind.
- **Font:** Inter via Google Fonts — importeret i CSS-strengen i `App.jsx`.

---

## 12. Åbne opgaver / known issues

- [ ] `constants.js` og `constants.jsx` er delvist duplikerede — Jan: `constants.js` kan udfases når backend ikke længere refererer den
- [ ] Opskrifter-backend (Supabase) mangler data — RecipesScreen viser placeholder
- [ ] Supabase allowlist skal inkludere alle deploy-URLer (eatsafe.dk + preview-URLer)

---

## 13. Prompt til Jan (backend-format)

Når Bjørn har lavet en frontend-ændring der kræver backend-ændringer, sendes dette format til Jan:

```
📋 PROMPT TIL JAN (BACKEND)
Du er backend-udvikler på EatSafe (Supabase).

KONTEKST: [hvad Bjørn har bygget]

OPGAVE: [præcis hvad der skal ændres]

DETALJER:
- Endpoint: [URL]
- Request body: [JSON-struktur]
- Response: [forventet format]
- Tabel: [Supabase tabel-navn]
- RLS: [sikkerhedshensyn]
```
