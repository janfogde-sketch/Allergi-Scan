# EatSafe — Roadmap (opdateret 10. juni 2026)

> **Kernespørgsmål ved al prioritering:**
> *Gør denne feature brugeren hurtigere, tryggere eller mere sikker i købsøjeblikket?*

---

## ✅ FULDFØRT — Fase 0-6

Fase 0 (kritiske fixes), 1 (datavækst), 2 (design), 3 (arkitektur),
4 (polish), 5 (refaktor), 6 (opskrifter) — alle done.

---

## Fase 7 — Teknisk gæld 🔄 IGANGVÆRENDE

| # | Opgave | Status | Beta-blocker? |
|---|--------|--------|---------------|
| 7.1 | feedbackDone bug | ✅ | Ja |
| 7.2 | Admin: manglende EAN visning | ✅ | Nej |
| 7.3 | SUBMITTED som egen fil | 🔲 | Ja |
| 7.4 | `constants.js` udfases | 🔲 | Nej |
| 7.5 | Privatlivspolitik i appen | 🔲 | Ja — EU-krav |
| 7.6 | Kontakt-email i appen | 🔲 | Ja — EU-krav |
| 7.7 | App.jsx under 1000 linjer | 🔲 | Nej |
| 7.8 | Gradient baggrund på opskrifter | 🔲 | Nej |
| 7.9 | Admin: brand/kategori-aggregering fra missing_ean_log | 🔲 | Nej |

**Beta-blockers i denne fase:** 7.3, 7.5, 7.6 — resten er teknisk gæld der kan laves løbende.

---

## Fase 8 — Kerneværdi: Hjælp brugeren træffe valg 🔲

| # | Opgave | Prioritet | Beslutning |
|---|--------|-----------|------------|
| 8.1 | **Sikre alternativer ved farlige produkter** | 🔴 | Kategori-match, kun egen DB, top 3-5 sikre produkter. **Fallback:** hvis ingen matches i samme kategori → udvid til nærmeste overkategori → hvis stadig ingen → vis "Ingen kendte alternativer endnu — hjælp os ved at scanne alternativer" |
| 8.2 | Ingrediens-tap → leksikon | 🔴 | Tryk på ingrediens → åbner leksikon-entry direkte |
| 8.3 | E-nummer hurtig-opslag fra scan-resultat | 🔴 | Direkte fra resultatsiden |
| 8.4 | Leksikon: 1000+ entries | 🟡 | ~700 nu — leksikon er støttefunktion til scanning, ikke et selvstændigt produkt |
| 8.5 | Sæsonkalender | 🟢 | Kun efter 8.1-8.3. Beholdes som SEO/brugerakviration (pollensæson driver downloads) |
| 8.6 | Allergen-guide til restaurantbesøg | 🟢 | Artikel-format i leksikon |

---

## Fase 9 — Familie-deling 🔲

*Stærk differentiering. Organisk vækst via invitation — en forælder der inviterer den anden er gratis markedsføring.*

| # | Opgave | Prioritet | Beslutning |
|---|--------|-----------|------------|
| 9.1 | Invitationslink til familie | 🔴 | To-vejs. Begge skal have konto. Token + 24t expiry i `family_invites` tabel |
| 9.2 | Fælles indkøbsliste i realtid | 🟡 | Supabase Realtime — kræver 9.1 |
| 9.3 | Alder-baserede advarsler (børn under 3) | 🟡 | |

---

## Fase 10 — Engagement & feedback-loops 🔲

*Push-notifikationer er kritiske for at fastholde brugere der bidrager til databasen.*

| # | Opgave | Prioritet | Note |
|---|--------|-----------|------|
| 10.1 | Push-notifikation ved godkendt indsendelse | 🟡 | Feedback-loop: bidrag → bekræftelse → mere bidrag |
| 10.2 | Ugentlig admin-digest | 🟡 | "X indsendelser afventer godkendelse" |
| 10.3 | Scanning-streak / gamification | 🟢 | Lav prioritet — ikke kerneværdi |

---

## Fase 11 — Databasevækst 🔲

*Dækning > antal. Brugeradfærd fra missing_ean_log styrer hvilke brands der prioriteres.*

| # | Opgave | Prioritet | Beslutning |
|---|--------|-----------|------------|
| 11.1 | Bilka/Føtex import | 🔴 | |
| 11.2 | Coop import | 🟡 | |
| 11.3 | Rema 1000 import | 🟡 | |
| 11.4 | Auto-berigelse med Claude Haiku | 🟡 | Engangsjob. Forbedrer kvalitet på eksisterende data → påvirker scan-succesraten direkte. Test 20-50 produkter FØRST. ~$0,15 for 500 produkter |

---

## Fase 12 — Madpas 2.0 🔲

*Madpas er unikt differentierende — strategisk vigtigere end opskrifter, men adoption-drevet vækst kommer fra fase 9-11 først.*

| # | Opgave | Prioritet | Beslutning |
|---|--------|-----------|------------|
| 12.1 | QR-kode til madpas | 🔴 | Dual approach: QR med allergen-tekst kodet direkte ind (virker offline/udland) + offentlig webside eatsafe.dk/madpas/[id] som backup |
| 12.2 | Del madpas via link | 🟡 | Bruger URL fra 12.1 |
| 12.3 | PDF-eksport | 🟡 | Print og medbring til restaurant |

---

## Fase 13 — Monetisering (post-beta) 🔲

| # | Opgave | Note |
|---|--------|------|
| 13.1 | Freemium: gratis 1 profil, betalt familie | Mest oplagt model |
| 13.2 | EatSafe Pro: avanceret E-nummer overvågning | Power users |
| 13.3 | B2B: Madpas API til restauranter | Bygger på 12.1 |

---

## Succeskriterier — mål adfærd, ikke features

> **Første skridt:** Mål baseline *nu* med en admin-query inden vi bygger mere.
> Uden baseline ved vi ikke om vi er ved 60% eller 84% scan-succesrate i dag.

| Metric | Baseline (mål nu) | Mål |
|--------|-------------------|-----|
| Scan-succesrate | ? | >85% |
| NOTFOUND-rate | ? | <15% |
| Aktive brugere/uge | ? | Voksende |
| Produkter tilføjet/uge | ? | Voksende |
| Familie-profiler per bruger | ? | >1.5 |
| Indsendelser godkendt/uge | ? | Voksende |

---

## Anbefalet session-rækkefølge

| Session | Fokus | Faser |
|---------|-------|-------|
| 1 | Teknisk gæld + baseline-måling | 7 + succeskriterier |
| 2 | Sikre alternativer | 8.1 |
| 3 | Leksikon-integration | 8.2 + 8.3 |
| 4 | Familie-deling | 9.1 |
| 5 | Push-notifikationer + import | 10.1 + 11.1 |
| 6 | Madpas QR | 12.1 |

---

## Beta-klar — når dette er opfyldt ✅

Beta er ikke kun teknisk gæld. Appen er beta-klar når brugerne oplever reel værdi.

| Krav | Status |
|------|--------|
| Scanning virker iOS + Android | ✅ |
| Profil + familie gemmes | ✅ |
| Offline-banner | ✅ |
| Admin kan godkende indsendelser | ✅ |
| Feedback-knap virker | ✅ |
| "Beta"-badge synligt | ✅ |
| SUBMITTED som egen fil (7.3) | 🔲 |
| Privatlivspolitik (7.5) | 🔲 |
| Kontakt-email i appen (7.6) | 🔲 |
| Sikre alternativer ved farlige produkter (8.1) | 🔲 |
| Ingrediens-tap → leksikon (8.2) | 🔲 |
| E-nummer hurtig-opslag (8.3) | 🔲 |
| Familie-deling via link (9.1) | 🔲 |
| Push-notifikation ved godkendelse (10.1) | 🔲 |
| Bilka/Føtex import (11.1) | 🔲 |
| QR-kode til madpas (12.1) | 🔲 |

---

## Arkitektur-regler

- Nye screens → egne filer fra dag ét
- Ingen IIFE-patterns i JSX
- Hooks øverst — aldrig i betinget kode
- Ingen hardkodede farver — kun CSS-variabler
- Test før skalering (11.4 testes på 20-50 produkter)
