# EatSafe — Roadmap (opdateret 10. juni 2026)

---

## ✅ FULDFØRT — Fase 0-6

Fase 0 (kritiske fixes), 1 (datavækst), 2 (design), 3 (arkitektur),
4 (polish), 5 (refaktor), 6 (opskrifter) — alle done.

---

## Fase 7 — Teknisk gæld & beta-klar 🔄 IGANGVÆRENDE

Ryd op inden vi bygger nyt. Intet nyt feature bygges før dette er done.

| # | Opgave | Status | Note |
|---|--------|--------|------|
| 7.1 | feedbackDone bug | ✅ | `useState` tilføjet |
| 7.2 | Admin: manglende EAN visning | ✅ | OFF-link, badge, datoer |
| 7.3 | SUBMITTED som egen fil | 🔲 | SubmittedScreen.jsx fra ScannerScreen |
| 7.4 | `constants.js` udfases | 🔲 | Migrer alle imports til constants.jsx |
| 7.5 | Privatlivspolitik side | 🔲 | EU-krav — simpel tekst i app + link |
| 7.6 | Kontakt-email synlig i appen | 🔲 | EU-krav — i ProfileScreen footer |
| 7.7 | App.jsx under 1000 linjer | 🔲 | ~1300 nu — useProduct udtrækkes |
| 7.8 | Gradient baggrund på opskrifter | 🔲 | Visuelt fix |
| 7.9 | Verificer build er grøn | 🔲 | Ingen console-fejl i prod |

---

## Fase 8 — Brugerværdi: Alternativer & Leksikon 🔲

| # | Opgave | Prioritet | Beslutning |
|---|--------|-----------|------------|
| 8.1 | "Prøv dette i stedet" ved farlige produkter | 🔴 | Kategori-match mod egen DB. Top 3-5 sikre produkter samme kategori |
| 8.2 | Ingrediens-tap i scan-resultat → leksikon | 🔴 | Tryk på ingrediens i listen → åbner leksikon-entry |
| 8.3 | E-nummer hurtig-opslag fra scan-resultat | 🔴 | "Hvad er E471?" — direkte fra resultatsiden |
| 8.4 | Leksikon: 1000+ entries | 🟡 | ~700 nu, primært ingredienser mangler |
| 8.5 | Sæsonkalender — allergener i sæson | 🟢 | Birk, græs, bynke med datoer |
| 8.6 | Allergen-guide til restaurantbesøg | 🟢 | Artikel-format i leksikon |

---

## Fase 9 — Madpas 2.0 🔲

| # | Opgave | Prioritet | Beslutning |
|---|--------|-----------|------------|
| 9.1 | QR-kode til madpas | 🔴 | **Dual approach:** (A) QR med allergen-tekst kodet direkte ind — virker 100% offline og i udlandet. (B) Offentlig webside eatsafe.dk/madpas/[userId] som pæn backup. Ingen tokens. |
| 9.2 | Del madpas via link | 🟡 | Bruger webside-URL fra 9.1 |
| 9.3 | PDF-eksport af madpas | 🟡 | Print og medbring til restaurant |
| 9.4 | Billede-baserede allergen-chips | 🟢 | Visuelt klarere for personale |

---

## Fase 10 — Familiefunktioner 2.0 🔲

| # | Opgave | Prioritet | Beslutning |
|---|--------|-----------|------------|
| 10.1 | Del familie-profil via invitationslink | 🔴 | **To-vejs, begge skal have konto.** Link → modtager opretter konto → tilknyttes familien automatisk. `family_invites` tabel med token + expiry (24t) |
| 10.2 | Fælles indkøbsliste i realtid | 🟡 | Supabase Realtime — kræver 10.1 |
| 10.3 | Alder-baserede advarsler (børn under 3) | 🟡 | Særlige advarsler for småbørn |
| 10.4 | Notifikation ved farlig scanning i familie | 🟢 | Kræver push-notifikationer |

---

## Fase 11 — Databasevækst 🔲

| # | Opgave | Prioritet | Beslutning |
|---|--------|-----------|------------|
| 11.1 | Bilka/Føtex import-pipeline | 🔴 | Salling Group API eller scrape |
| 11.2 | Coop import | 🟡 | |
| 11.3 | Rema 1000 import | 🟡 | |
| 11.4 | Auto-berigelse med Claude Haiku | 🟢 | **Engangsjob. Test på 20-50 produkter FØRST** for at validere pris og kvalitet. Kun produkter med ingredients_text men tomme allergen_flags. Estimat: ~$0,15 for 500 produkter. Skalér bagefter. |

---

## Fase 12 — Engagement & retention 🔲

| # | Opgave | Prioritet | Note |
|---|--------|-----------|------|
| 12.1 | Push-notifikation ved godkendt indsendelse | 🟡 | Engagerer bidragydere |
| 12.2 | Ugentlig admin-digest email | 🟡 | "X indsendelser afventer" |
| 12.3 | Scanning-streak | 🟢 | Gamification |
| 12.4 | "Ny i dit område" | 🟢 | Kræver geolokation |

---

## Fase 13 — Monetisering (post-beta) 🔲

| # | Opgave | Note |
|---|--------|------|
| 13.1 | Freemium: gratis 1 profil, betalt familie | Mest oplagt model |
| 13.2 | EatSafe Pro: avanceret E-nummer overvågning | Power users |
| 13.3 | B2B: Madpas API til restauranter | Bygger på 9.1 |
| 13.4 | White-label til kæder | Langsigtet |

---

## Beta-checkliste

| Krav | Status |
|------|--------|
| Scanning virker iOS + Android | ✅ |
| Profil + familie gemmes | ✅ |
| Offline-banner | ✅ |
| Admin kan godkende indsendelser | ✅ |
| Ingen kendte crash-bugs | ✅ |
| Feedback-knap virker | ✅ |
| "Beta"-badge synligt | ✅ |
| SUBMITTED som egen fil | 🔲 |
| Privatlivspolitik | 🔲 |
| Kontakt-email i appen | 🔲 |
| Build grøn uden console-fejl | 🔲 |

---

## Anbefalet rækkefølge — næste sessioner

| Session | Fokus | Faser |
|---------|-------|-------|
| 1 | Teknisk gæld | 7.3–7.9 |
| 2 | Brugerværdi | 8.1–8.3 |
| 3 | Madpas QR + Familie-deling | 9.1 + 10.1 |
| 4 | Databasevækst | 11.1 + 11.4 (test) |
| 5 | Engagement | 12.1–12.2 |

---

## Arkitektur-regler

- **Nye screens → egne filer** fra dag ét
- **Ingen IIFE-patterns** i JSX
- **Hooks øverst** — aldrig i betinget kode
- **Ingen hardkodede farver** — kun CSS-variabler
- **Test før skalering** — eksempel: 11.4 testes på 20-50 produkter

---

## Database (status 10. juni 2026)

| Tabel | Antal |
|-------|-------|
| products | ~20.200 |
| knowledge_base | ~700 |
| recipes | 627 |
| missing_ean_log | vokser automatisk |
| family_invites | 🔲 skal oprettes (10.1) |
