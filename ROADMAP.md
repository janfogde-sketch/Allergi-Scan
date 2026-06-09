# EatSafe — Roadmap (opdateret 4. juni 2026)

---

## Fase 0 — Kritiske fixes ✅ FULDFØRT

| # | Opgave | Status |
|---|--------|--------|
| 0.1 | Farvesystem redesign | ✅ |
| 0.2 | Permanent OFF-import | ✅ |
| 0.3 | Foto-scanning fallback | ✅ |
| 0.4 | Leksikon-links fra scan-resultat | ✅ |

---

## Fase 1 — Datavækst ✅ FULDFØRT

| # | Opgave | Status | Noter |
|---|--------|--------|-------|
| 1.1 | Log manglende EAN'er | ✅ | `missing_ean_log` tabel + `log_missing_ean()` RPC |
| 1.2 | Admin: mest efterspurgte manglende | ✅ | "❓ Manglende" tab i AdminScreen |
| 1.3 | Gem brugerbilleder permanent | ✅ | Storage bucket `product-images` + submissions Edge Fn opdateret |
| 1.4 | Batch-import af danske brands | ✅ | 330 nye produkter (Tulip, Danish Crown, Naturli', Thise, Kohberg m.fl.) |
| 1.5 | Leksikon: ingrediens-entries | ✅ | 104 ingredienser indsat (3 runder) |

---

## Fase 2 — Design-opfriskning 🔄 IGANGVÆRENDE

| # | Opgave | Status | Noter |
|---|--------|--------|-------|
| 2.1 | Farvesystem redesign | ✅ | Grøn tema lysnet ~20%. --warm, --navy tokens. Bottom-nav opaque. Borders/tekst lysere |
| 2.2 | Baggrund og gradient | ✅ | Fast gradient i `.app`, paper/paper2 justeret |
| 2.3 | Typografi-hierarki | ✅ | `--fs-xs`→`--fs-2xl`, `--fw-normal`→`--fw-black`, `--lh-tight`→`--lh-normal` |
| 2.4 | Scan-resultat redesign | ✅ | Ny rækkefølge: Produkt → Sikkerhed → Allergener → Ingredienser → Handlinger → Næring |
| 2.5 | Tomme tilstande | ✅ | 6 tilstande forbedret: scan-historik, præferencer, favoritter, familie, opskrift-favoritter, søgeresultater |

---

## Fase 3 — Arkitektur-oprydning ⏳ DELVIST

| # | Opgave | Status | Noter |
|---|--------|--------|-------|
| 3.1 | App.jsx split | 🔄 | useAdmin.js ✅, useRecipes.js ✅, useScanner for tæt koblet |
| 3.2 | Router | ✅ | useNavigation.js — browser back-knap via pushState/popstate. navigate(), goBack(), canGoBack() |
| 3.3 | Error boundaries | ✅ | ErrorBoundary.jsx — wrapper 6 screens. "Prøv igen"-knap ved crash |
| 3.4 | Loading states | ✅ | Skeleton rows (profil-historik), skeleton cards (leksikon). Opskrifter havde allerede skeleton |

---

## Fase 4 — Polish til lancering ⏳ IKKE STARTET

| # | Opgave | Status |
|---|--------|--------|
| 4.1 | Offline-basic | ✅ | useOffline.js — localStorage cache max 20 produkter, offline banner, offline fetch guard |
| 4.2 | Onboarding-forenkling | ✅ | 10→5 trin. E-numre kollapsibel. Fællesskab-card + disclaimer på trin 5 |
| 4.3 | Performance: lazy-load screens | ✅ | React.lazy + Suspense for KnowledgeScreen, RecipesScreen, AdminScreen |
| 4.4 | App Store metadata | ✅ | APP_STORE_METADATA.md — beskrivelser, søgeord, screenshots |
| 4.5 | Brugertest (5-10 brugere) | 🔲 |

---

## Viden / Leksikon — særskilt spor 🔄 IGANGVÆRENDE

| Opgave | Status | Noter |
|--------|--------|-------|
| Database oprettet | ✅ | `knowledge_base` tabel med RLS og full-text search |
| Allergener (16) | ✅ | Detaljerede profiler med symptomer, skjulte kilder, alternativer |
| E-numre (247) | ✅ | Kategori, risiko-niveau, vegansk-status, allergen-kobling |
| Diæter (6) | ✅ | Glutenfri, laktosefri, vegansk, vegetarisk, halal, kosher |
| Krydsreaktioner (4) | ✅ | Birk, latex, jordnød, skaldyr |
| FAQ (8) | ✅ | Havre/gluten, allergi vs intolerance, anafylaksi m.fl. |
| Fun facts (12) | ✅ | Engagerende viden-nuggets |
| Ingredienser (104) | ✅ | 3 runder: fedtstoffer, korn, bælgfrugter, krydderier, mejeriprodukter, fisk, vitaminer m.fl. |
| CSS-klasser (kb-*) | ✅ | Alle styles klar i styles.css |
| **KnowledgeScreen.jsx** | ✅ | Inline styles, 2-kolonne grid, søg, kategorier, detaljer, fun facts. Kun anon key |
| **Bundmenu → Leksikon** | ✅ | "Leksikon" tab aktiv i bundmenu |
| **Madpas til profil** | ✅ | Tilgængelig via profilsiden |
| **Scan → Leksikon links** | ✅ | E-numre klikbare (slug: e-{nr}). Allergen-status tekst klikbar. Andre allergener-tags klikbare |
| **Leksikon udvidelse** | 🔲 | Mål: 300+ ingredienser. Tilføj: alkohol, eksotiske ingredienser, japansk/mexicansk/indisk køkken |

---

## Åbne bugs og tickets

| # | Type | Problem | Status |
|---|------|---------|--------|
| T1 | Fejl | Godkendt-knap langsom i admin | ✅ Optimistisk UI |
| T2 | Fejl | Allergener/E-numre ikke fremhævet i admin submit | ✅ HighlightText komponent |
| T3 | Fejl | "Renskriv med AI" virker ikke | ✅ Ruter via allergens Edge Function |
| T4 | Fejl | Finder sjældent brand-navn | ✅ OCR prompt + useProduct parser opdateret |
| T5 | Fejl | Loader ikke altid submissions | ✅ Token-check + error handling |
| T6 | Forslag | Søgefunktion E-numre/ingredienser | ✅ Dækkes af Leksikon |
| T7 | Fejl | Produkt "ikke fundet" men i DB | ✅ UUID-detektion i products Edge Fn |
| T8 | Mangler | Diæt mangler under præferencer | ✅ ProfileScreen fix |
| T9 | Fejl | submitUserRecipe sendes ikke som prop til RecipesScreen | ✅ Fixet — App.jsx + RecipesScreen props |
| T10 | Fejl | Admin opskrifter forsvinder bag bundmenu | ✅ paddingBottom:120 tilføjet |
| T11 | Fejl | JWT expired fejl ved opskrift-indsendelse | ✅ Klar fejlbesked + tak-skærm ved succes |
| T9 | Design | Feedback-knap hvid | ✅ Farve-fix |
| — | Design | Gradient baggrund på opskrifter | 🔲 Utilfredsstillende løsning |

---

## Database — nuværende tilstand

| Tabel | Antal | Kilde |
|-------|-------|-------|
| products | ~20.200 | Bilka (10177) + Nemlig (6672) + OFF (3013) + brands (330) + user (6+) |
| knowledge_base | 396 | Seeded manuelt |
| submissions | 4+ | Aktiv tabel (product_submissions slettet) |
| missing_ean_log | Vokser | Logger automatisk |
| recipe_ingredients | 13.180 | Fra ingredients_raw parsing |
| recipes | 627 | TheMealDB + user |

### Storage
- Bucket: `product-images` (public, 5MB, jpeg/png/webp)
- Submissions gemmer nu URL i stedet for base64

---

## Anbefalet rækkefølge næste session

1. **KnowledgeScreen.jsx** — CSS er klar, App.jsx er uploadet
2. **Bundmenu-swap** — Madpas → Viden, Madpas til profil
3. **Fase 2.4** — Scan-resultat redesign (ScannerScreen.jsx)
4. **Leksikon udvidelse** — 104 → 300+ ingredienser

---

## Tekniske noter

- **Windows env-vars**: brug `set KEY=value` ikke `export`
- **1px borders**: aldrig 1.5px (sub-pixel artifacts på Android)
- **Mørkt tema**: aldrig `background:#fff` eller `var(--paper)` som card-baggrund i mørk kontekst — brug `var(--surface)` eller `rgba(255,255,255,.04-.06)`
- **submissions** er aktiv tabel — `product_submissions` er slettet
- **Refaktor-regel**: første gang en screen-fil åbnes, tjek for manglende imports fra `helpers.js` og `constants.jsx`
- **App.jsx hooks-rækkefølge**: useAuth → useShoppingList → useFamily → useHistory → useOnboarding → useAdmin → useRecipes

---

## Fase 5 — Refaktor og optimering ⏳ PLANLAGT

| # | Opgave | Status | Noter |
|---|--------|--------|-------|
| 5.1 | ScannerScreen refaktor | 🔲 | useScanner hook — tæt koblet til App.jsx. Mål: <800 linjer per fil |
| 5.2 | App.jsx split | 🔲 | 1483 linjer → useScanner + evt. useShoppingList udtrukket |
| 5.3 | ProfileScreen optimering | 🔲 | Historik og favoritter i egne hooks |
| 5.4 | AdminScreen optimering | 🔲 | Opdel i sub-komponenter (submissions, tickets, stats) |
| 5.5 | Billede-optimering | ✅ | lazy-load + onError fallback + fade-in animation |
| 5.6 | Search debounce audit | ✅ | Alle søgninger har debounce eller er client-side |

---

## Fase 6 — Opskrifter redesign ⏳ PLANLAGT

| # | Opgave | Status | Noter |
|---|--------|--------|-------|
| 6.1 | Fix opskrifter loader ikke | ✅ | JWT fjernet + auto-load ved mount + status=approved filter gendannet |
| 6.2 | Redesign oversigt + filtrering | ✅ | Custom dropdown, "Kun sikre" med profil-chips, client-side filter |
| 6.3 | Indsend opskrift flow | ✅ | Komplet formular: billede, ingredienser m. live allergen-detektion, trin, diæter |
| 6.4 | Admin: opskrift-godkendelse | ✅ | Ny tab i admin — pending/godkendt/afvist, redigér, godkend/afvis |

