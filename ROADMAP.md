# EatSafe — Roadmap (opdateret 11. juni 2026, session 3)

> **Kernespørgsmål ved al prioritering:**
> *Gør denne feature brugeren hurtigere, tryggere eller mere sikker i købsøjeblikket?*

---

## ✅ FULDFØRT — Fase 0-7

Fase 0 (kritiske fixes), 1 (datavækst), 2 (design), 3 (arkitektur),
4 (polish), 5 (refaktor), 6 (opskrifter), 7 (teknisk gæld) — alle done.

**Fase 7 detaljer:**
- 7.1 feedbackDone bug ✅
- 7.2 Admin: manglende EAN visning ✅
- 7.3 SubmittedScreen.jsx ✅
- 7.4 constants.js udfases ✅ (var allerede gjort)
- 7.5 Privatlivspolitik (privacy.html) ✅
- 7.6 Kontakt-email i ProfileScreen footer ✅
- 7.7 App.jsx reduceret (useMadpas + useSearch udtrukket) ✅
- 7.8 Gradient baggrund på opskrifter ✅
- 7.9 Admin: brand/kategori-aggregering fra missing_ean_log ✅

---

## ✅ FULDFØRT — Fase 8 — Kerneværdi

- 8.1 Sikre alternativer ved farlige produkter ✅ (useAlternatives.js + ResultScreen)
- 8.2 Ingrediens-tap → leksikon ✅ (onIngredientTap i IngredientsList)
- 8.3 E-nummer hurtig-opslag fra scan-resultat ✅ (klikbare chips i ResultScreen)
- 8.4 Leksikon: 1000+ entries 🔲 (husket — leksikon-udvidelse til separat session)
- 8.5 Sæsonkalender ❌ fjernet
- 8.6 Allergen-guide til restaurantbesøg 🔲

---

## ✅ FULDFØRT — Fase 9 — Madpas 2.0

- 9.1 QR-kode til madpas ✅ (dual: QR offline + eatsafe.dk/madpas/[id] link + popup forstørrelse)
- 9.2 Del madpas via link ✅ (kopiér-link + Web Share API + QR)
- 9.3 PDF-eksport 🔲

---

## ✅ FULDFØRT — Fase 10 — Familie-deling

- 10.1 Invitationslink til familie ✅ (family_invites tabel + SQL migration + invite.html)
- 10.2 Fælles indkøbsliste i realtid ✅ (Supabase Realtime WebSocket i useShoppingList)
- 10.3 Alder-baserede advarsler 🔲

---

## ✅ FULDFØRT — Fase 11 — Databasevækst

- 11.1 OFF import-pipeline ✅ (import_missing_eans.py — kør manuelt)
- 11.2 Coop import 🔲
- 11.3 Rema 1000 import 🔲
- 11.4 Auto-berigelse ✅ (auto-import-off Edge Function + pg_cron kl. 02:00 UTC dagligt)
- Admin: Import-tab i AdminScreen med "Kør nu" knap og live log ✅

---

## ✅ FULDFØRT — Fase 7b — UX-polish

- 7b.1 Onboarding: feature-tour fjernet ✅ — trin 1 er nu obligatorisk profiludfyldning (navn, email, tlf, alder, køn). Allergi-trin: spring-over kræver bekræftelse via dialog.
- 7b.2 Demo-funktion ✅ — WelcomeDemoSlider (8 slides + CTA) på WELCOME-skærm erstatter statisk feature-liste. Modal via 📖 App-guide knap på HOME (ved beta-badge). Faste "Opret konto" + "Log ind" knapper altid synlige under slideren.
- 7b.3 HOME: "Sidst opdateret"-linje fjernet ✅

**MadpasScreen fixes (samme session):**
- Hvid baggrund fixet → `var(--paper)` ✅
- QR-kode + del-link sektion tilføjet ✅ (klik på QR åbner forstørret popup med forklaring)
- userId prop tilføjet i App.jsx ✅

---

## ✅ FULDFØRT — Fase 12 — Engagement & push-notifikationer

- 12.1 Push-notifikation ved godkendt indsendelse ✅
  - `push_tokens` tabel + RLS ✅
  - `send-push` Edge Function (VAPID/Web Push) ✅
  - `sw.js` service worker ✅
  - `usePush.js` hook (subscribe/unsubscribe) ✅
  - VAPID-nøgler genereret og sat som Supabase secrets ✅
  - Push toggle i ProfileScreen ✅
  - Push-trin i onboarding (trin 5) ✅
- 12.1b NOTFOUND-push ✅ — brugere der scannede et produkt som NOTFOUND får push når det godkendes
- 12.1c Familie-push ✅ — inviter modtager push når nogen accepterer invitation (i App.jsx)
- 12.2 Ugentlig digest ✅ — `weekly-digest` Edge Function klar (kræver pg_cron setup)
- 12.3 Scanning-streak / gamification 🔲 — lav prioritet

---

## Fase 13 — Monetisering (post-beta) 🔲

| # | Opgave | Note |
|---|--------|------|
| 13.1 | Freemium: gratis 1 profil, betalt familie | Mest oplagt model |
| 13.2 | EatSafe Pro: avanceret E-nummer overvågning | Power users |
| 13.3 | B2B: Madpas API til restauranter | Bygger på 9.1 |

---

## Succeskriterier — mål adfærd, ikke features

| Metric | Baseline (mål nu) | Mål |
|--------|-------------------|-----|
| Scan-succesrate | ? | >85% |
| NOTFOUND-rate | ? | <15% |
| Aktive brugere/uge | ? | Voksende |
| Produkter tilføjet/uge | ? | Voksende |
| Familie-profiler per bruger | ? | >1.5 |
| Indsendelser godkendt/uge | ? | Voksende |

---

## Beta-klar — når HELE dette er opfyldt ✅

| Krav | Status |
|------|--------|
| Scanning virker iOS + Android | ✅ |
| Profil + familie gemmes | ✅ |
| Offline-banner | ✅ |
| Admin kan godkende indsendelser | ✅ |
| Feedback-knap virker | ✅ |
| "Beta"-badge synligt | ✅ |
| SUBMITTED som egen fil | ✅ |
| Privatlivspolitik | ✅ |
| Kontakt-email i appen | ✅ |
| Sikre alternativer (8.1) | ✅ |
| Ingrediens-tap → leksikon (8.2) | ✅ |
| E-nummer hurtig-opslag (8.3) | ✅ |
| QR-kode til madpas (9.1) | ✅ |
| Familie-deling via link (10.1) | ✅ |
| Realtime indkøbsliste (10.2) | ✅ |
| Auto-import pipeline (11.4) | ✅ |
| Onboarding obligatoriske felter (7b.1) | ✅ |
| Demo-slider på WELCOME (7b.2) | ✅ |
| Push-notifikation ved godkendelse (12.1) | ✅ |
| hej@eatsafe.dk oprettet hos One.com | ✅ |
| Build grøn uden console-fejl | ✅ (midlertidig RLS workaround) |

---

## Kendte issues

| Issue | Status | Note |
|-------|--------|------|
| auth.uid() = NULL efter JWT key rotation til ECC P-256 | ⏳ Support ticket åben | Midlertidig workaround: temp_read + temp_write policies på alle tabeller. Supabase bug: GitHub #42244, Discussion #45812 |
| sw.js 404 | ✅ | Pushet til public/ |
| weekly-digest pg_cron | 🔲 | SQL cron-job skal køres i SQL Editor |
| Admin user ID opdateret | ✅ | Ny auth UID: 6a759160-9bde-43bf-8619-e19e454323a5 |

---

## Arkitektur-regler

- Nye screens → egne filer fra dag ét
- Ingen IIFE-patterns i JSX
- Hooks øverst — aldrig i betinget kode
- Ingen hardkodede farver — kun CSS-variabler
- Test før skalering (11.4 testes på 20-50 produkter)
