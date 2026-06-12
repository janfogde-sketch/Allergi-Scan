# EatSafe — Roadmap (opdateret 12. juni 2026, session 4)

> **Kernespørgsmål ved al prioritering:**
> *Gør denne feature brugeren hurtigere, tryggere eller mere sikker i købsøjeblikket?*

---

## ✅ FULDFØRT — Fase 0-13 (undtagen monetisering)

### Fase 0-7 — Fundament
Farvesystem, OFF-import, fotoscanning, leksikon, search-overhaul, useScanner-refaktor, KnowledgeScreen, opskrifter, teknisk gæld, privatlivspolitik, onboarding, demo-slider.

### Fase 8 — Kerneværdi
- 8.1 Sikre alternativer ved farlige produkter ✅
- 8.2 Ingrediens-tap → leksikon ✅
- 8.3 E-nummer hurtig-opslag fra scan-resultat ✅
- 8.4 Leksikon ~800+ entries ✅ (seed SQL kørt session 4)
- 8.6 Allergen-guide til restaurantbesøg ✅ (RestaurantGuideScreen, session 4)

### Fase 9 — Madpas 2.0
- 9.1 QR-kode til madpas ✅
- 9.2 Del madpas via link ✅
- 9.3 PDF-eksport ✅

### Fase 10 — Familie-deling
- 10.1 Invitationslink ✅
- 10.2 Realtime indkøbsliste ✅
- 10.3 Alder-baserede advarsler ✅

### Fase 11 — Databasevækst
- 11.1 OFF import-pipeline ✅
- 11.4 Auto-berigelse dagligt ✅

### Fase 12 — Engagement
- 12.1 Push ved godkendt indsendelse ✅
- 12.1b NOTFOUND-push ✅
- 12.1c Familie-push ✅
- 12.3 Gamification/streak ✅ (GamificationCard + HOME streak-badge, session 4)

---

## Fase 13 — Monetisering (post-beta) 🔲

| # | Opgave | Note |
|---|--------|------|
| 13.1 | Freemium: gratis 1 profil, betalt familie | Mest oplagt model |
| 13.2 | EatSafe Pro: avanceret E-nummer overvågning | Power users |
| 13.3 | B2B: Madpas API til restauranter | Bygger på 9.1 |

---

## Kendte issues

| Issue | Status | Note |
|-------|--------|------|
| auth.uid() = NULL (ECC P-256) | ⏳ | Support ticket åben. Workaround: temp_read/write policies. GitHub #42244 |
| weekly-digest pg_cron | 🔲 | Kør SQL cron-job i SQL Editor (2 min) |

---

## Beta-klar ✅

Alle beta-krav er opfyldt. Appen er klar til rigtige brugere.

---

## Succeskriterier — næste mål

| Metric | Status |
|--------|--------|
| Scan-succesrate | Mål >85% |
| NOTFOUND-rate | Mål <15% |
| Aktive brugere/uge | Voksende |
| Familie-profiler per bruger | Mål >1.5 |

---

## Arkitektur-regler

- Nye screens → egne filer fra dag ét
- Ingen IIFE-patterns i JSX
- Hooks øverst — aldrig i betinget kode
- Ingen hardkodede farver — kun CSS-variabler
