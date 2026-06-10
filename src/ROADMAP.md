# EatSafe — Roadmap (opdateret 10. juni 2026)

---

## Fase 0 — Kritiske fixes ✅ FULDFØRT

| # | Opgave | Status |
|---|--------|--------|
| 0.1 | Farvesystem redesign | ✅ |
| 0.2 | Permanent OFF-import + missing EAN log | ✅ |
| 0.3 | Foto-scanning fallback (Claude Vision) | ✅ |
| 0.4 | Leksikon-links fra scan-resultat | ✅ |

---

## Fase 1 — Datavækst ✅ FULDFØRT

| # | Opgave | Status |
|---|--------|--------|
| 1.1 | Log manglende EAN'er (`missing_ean_log`) | ✅ |
| 1.2 | Admin: mest efterspurgte manglende | ✅ |
| 1.3 | Gem brugerbilleder permanent | ✅ |
| 1.4 | Batch-import af danske brands | ✅ |
| 1.5 | Leksikon: ~700 entries inkl. ingredienser | ✅ |

---

## Fase 2 — Design-opfriskning ✅ FULDFØRT

| # | Opgave | Status |
|---|--------|--------|
| 2.1 | Farvesystem redesign (neutral mørk, grøn kun success/CTA) | ✅ |
| 2.2 | Baggrund og gradient | ✅ |
| 2.3 | Typografi-hierarki (`--fs-*` tokens) | ✅ |
| 2.4 | Scan-resultat redesign | ✅ |
| 2.5 | Tomme tilstande | ✅ |

---

## Fase 3 — Arkitektur ✅ FULDFØRT

| # | Opgave | Status |
|---|--------|--------|
| 3.1 | useAdmin.js + useRecipes.js | ✅ |
| 3.2 | useNavigation.js — browser back-knap | ✅ |
| 3.3 | ErrorBoundary.jsx | ✅ |
| 3.4 | Skeleton loading states | ✅ |

---

## Fase 4 — Polish ✅ FULDFØRT

| # | Opgave | Status |
|---|--------|--------|
| 4.1 | Offline-basic (useOffline.js, cache 20 produkter) | ✅ |
| 4.2 | Onboarding 10 → 5 trin | ✅ |
| 4.3 | Lazy-load screens (React.lazy) | ✅ |
| 4.4 | App Store metadata | ✅ |
| 4.5 | Brugertest | 🔲 |

---

## Fase 5 — Refaktor ✅ FULDFØRT

| # | Opgave | Status | Resultat |
|---|--------|--------|---------|
| 5.1 | useScanner.js | ✅ | App.jsx: 1486→1266 linjer |
| 5.2 | ScannerScreen.jsx split | ✅ | 2329→1085 linjer. 6 sub-screens: ResultScreen, NotFoundScreen, SearchScreen, ListScreen, SuggestEditScreen |
| 5.3 | feedbackDone bug i App.jsx | 🔲 | `feedbackDone` bruges 3 steder, aldrig deklareret |
| 5.4 | ProfileScreen optimering | 🔲 | Historik og favoritter i egne hooks |
| 5.5 | AdminScreen sub-komponenter | 🔲 | Opdel i submissions, tickets, stats |

---

## Fase 6 — Opskrifter redesign ✅ FULDFØRT

| # | Opgave | Status |
|---|--------|--------|
| 6.1 | Fix opskrifter loader ikke | ✅ |
| 6.2 | Redesign oversigt + filtrering | ✅ |
| 6.3 | Indsend opskrift flow | ✅ |
| 6.4 | Admin: opskrift-godkendelse | ✅ |

---

## Næste op: Beta-lancering 🎯

### Vigtigste åbne punkter

| Prioritet | Opgave |
|-----------|--------|
| 🔴 Høj | Fix `feedbackDone` bug i App.jsx |
| 🔴 Høj | 4.5 Brugertest — 5-10 rigtige brugere |
| 🟡 Medium | 5.4 ProfileScreen hooks |
| 🟡 Medium | 5.5 AdminScreen sub-komponenter |
| 🟢 Lav | Gradient baggrund på opskrifter |
| 🟢 Lav | `constants.js` udfases |

---

## Arkitektur-regler (husk ved fremtidig udvikling)

> Se CONTEXT.md sektion 4 for fuld beskrivelse.

- **Nye screens → egne filer** fra dag ét (aldrig inline i eksisterende fil)
- **Ingen IIFE-patterns** i JSX
- **Hooks øverst** i komponenten — aldrig i betinget kode
- **Hardkodede farver forbudt** i screen-komponenter — kun CSS-variabler

---

## Fil-størrelser (status 10. juni 2026)

| Fil | Linjer | Note |
|-----|--------|------|
| App.jsx | ~1266 | Routing + global state |
| ScannerScreen.jsx | 1085 | Router + HOME |
| ResultScreen.jsx | 334 | ✅ ny |
| NotFoundScreen.jsx | 537 | ✅ ny |
| SearchScreen.jsx | 300 | ✅ ny |
| ListScreen.jsx | 147 | ✅ ny |
| SuggestEditScreen.jsx | 365 | ✅ ny |
| useScanner.js | ~200 | ✅ ny |
| KnowledgeScreen.jsx | ~400 | |
| ProfileScreen.jsx | ~486 | |

---

## Database (status 10. juni 2026)

| Tabel | Antal |
|-------|-------|
| products | ~20.200 |
| knowledge_base | ~700 |
| recipes | 627 |
| recipe_ingredients | 13.180 |
| missing_ean_log | vokser automatisk |
