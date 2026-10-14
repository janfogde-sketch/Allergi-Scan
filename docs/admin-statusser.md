# Statusværdier i admin-panelet (13. okt. 2026)

Opgaver (`admin_todos`) og tickets (`feedback_tickets`) har hver deres statusværdier, men samme betydning og samme farve (`src/admin/statusTone.js`).
En ticket, der er lagt på opgavelisten, har sin status synkroniseret begge veje i databasen (se `src/CONTEXT.md` §10).

| Betydning | Ticket | Opgave | Farve |
|---|---|---|---|
| Ikke startet | `open` (Åben) | `todo` (Skal laves) | neutral |
| I gang | `in_progress` (I gang) | `doing` (I gang) | gul |
| Venter/blokeret | – | `blocked` (Venter) | rød |
| Færdig | `resolved` (Løst) | `done` (Færdig) | grøn |

- Prioritet (`high`/`normal`/`low`), spor og ansvarlig hører kun til opgaven. En ticket får dem, når den lægges på listen.
- "Løst" på en ticket kræver en afsluttende kommentar til brugeren.
- Mobil (højst 820 px) viser kort i stedet for tabel på To do og Tickets; desktop beholder tabellen (`useIsMobile`).

## Indsendelser og To do (14. okt. 2026)

- **Indsendelse:** Afventer = gul, Godkendt = grøn, Afvist = rød (`statusPill`). Knapper: Afventer "Gennemgå", Godkendt/Afvist "Se detaljer" (skrivebeskyttet; ingen Godkend/Afvis og ingen genåbning, fordi systemet ikke understøtter det).
- **Allergenlinjen på en indsendelse** (`submissionLogic.js`): "Allergenoplysninger mangler" (ingen flag), "Ikke verificeret" (kun nogle allergener vurderet, eller alle "nej" fra indsenderen på en afventende indsendelse), "Ingen registrerede allergener" (alle "nej" på en behandlet indsendelse), ellers de fundne allergener ("Allergener: Mælk"), adskilt fra "Intolerance: Laktose" og "Spor: …". Flag læses både direkte i `ai_parsed_data` og indlejret i `ai_parsed_data.allergen_flags` (ældre indsendelser). Produktnavnet er aldrig dokumentation; nævner det et allergen, som ikke er angivet, vises en påmindelse.
- **To do, anbefalet sortering** (`urgencyTier`): 0 høj prioritet og (overskredet eller venter) · 1 overskredet frist · 2 høj prioritet · 3 kommende frist · 4 resten; derefter i gang, skal laves, venter, prioritet, frist og nyeste. Færdige nederst. Øvrige valg: Højeste prioritet, Nærmeste frist, Senest opdateret, Ældste først.
- **Tællere** på hurtigfiltrene gælder den aktive fane (Åbne/Færdige), før chippen, søgningen og øvrige filtre anvendes.

## Dashboard: scanninger og søgninger (14. okt. 2026)

- `scan_history.found_via` er enten `scan` (kamera eller indtastet kode) eller `search` (produkt valgt i søgning, åbnet fra Favoritter, alternativer eller beskeder). De to er **separate rækker**, så søgninger er ikke en del af scanningstallet. "Scanninger i alt", "Scanninger i dag" og diagrammet "Scanninger pr. dag" tæller alle `found_via=scan` (vagt: `statsDefinitions.test.js`); søgninger vises som "Søgninger i alt: N" under scanningskortet. Dage regnes i dansk tid. Ingen historiske data er ændret.
- "Opgaveoverblikket" har seks felter, der hver åbner To do (fanen Åbne) med sit filter: Åbne opgaver (intet), Høj prioritet, Venter (status), Frist overskredet, Uden ansvarlig, Uden frist. "Uden frist" tæller åbne opgaver, hvis `due_date` mangler eller ikke er en gyldig dato (`hasValidDue`), og bruger samme definition som filteret. Filteret fra Dashboard gælder kun den ene åbning.

## Dashboard-struktur (14. okt. 2026)

Fire sektioner: **Overblik** (otte nøgletal i fire rækker; åbne tickets står kun under Kræver opmærksomhed; Familiemedlemmer = profiler uden egen konto; søgninger er et eget kort), **Kræver opmærksomhed** (kun poster med tal over nul: åbne tickets, afventende indsendelser, overskredne frister, høj prioritet uden ansvarlig, høj prioritet; hver post åbner den filtrerede side; tom tilstand er neutral), **Aktivitet** (periodevælger 7/14/30 dage styrer kun graferne og huskes i `sessionStorage`; tryk eller træk viser en tooltip) og **Opgaveoverblik** (fire primære felter, "Uden ansvarlig" og "Uden frist" bag "Flere", og "Opgaver pr. ansvarlig", der summerer til de åbne opgaver). Forklaringen ligger bag infoikonerne (`StatsInfo`). Før opgaverne er indlæst vises "Henter opgaver…", aldrig nuller.

Finpudsning (14. okt. 2026): ikoner har betydning (ur + rød = overskredet frist, flag + gul = høj prioritet, `file` = indsendelser, `info` = tickets). Tooltippen på begge grafer er en lille lys boks (104 × 34 px) inde i diagrammet: over søjlen, hvis der er plads, ellers ved siden af; piletaster flytter valget. Periodevælgeren står på egen linje under 560 px. Opgaver uden frist er aldrig "forsinkede" og fremhæves ikke under Kræver opmærksomhed; "Uden frist" står kun bag "Vis flere oplysninger". Der findes ingen backlog-/planlagt-status (`admin_todos.status` er `todo`, `doing`, `blocked`, `done`); "Skal laves" uden frist fungerer som backlog, og en ny status kræver en databaseændring. Ansvarliges navne er det gemte `users.name` (fallback e-mail), aldrig gættet; "jafo" er navnet, som det er gemt.

## Adminmenuen (14. okt. 2026)

- **Navne** (kun visningen; rute-id'erne er uændrede, `navLogic.js`): To do → **Opgaver**, Frafald i start → **Onboardingfrafald**, Historik → **Ændringshistorik** (siden viser produkters oprettelser og ændringer). **Manglende EAN'er** er bevidst ikke omdøbt til "Produkter uden EAN": siden viser stregkoder, brugerne har scannet uden at finde produktet.
- **Kategorier:** ved hver åbning er kun kategorien med den aktive side udfoldet; hver kategori kan åbnes og lukkes manuelt, flere kan være åbne, og manuelle valg består, mens menuen er åben. Ny side føjer sin kategori til.
- **Tællere** (`BADGE_INFO`, `formatBadge`): skjult ved 0 eller ikke indlæst, "99+" over 99. Neutral grå = Indsendelser (afventende) og Tickets (åbne). Gul = Tilbagekald (afventer gennemgang) og Opgaver (høj prioritet eller overskredet frist, ikke Venter). Rød kun for Opgaver, når mindst én frist er overskredet. En sammenklappet kategori viser summen med den strengeste tone.
- **Opbygning:** fast top (logo, Admin, luk), selvstændigt rullende navigation og fast bund (e-mail, Send feedback, Log ud), med safe areas. Mobil: dialog med dæmpet baggrund, luk-knap, Escape, tryk udenfor, swipe mod venstre og Android-tilbage; baggrunden er låst og inert, mens menuen er åben. Desktop: uændret sidebar.
