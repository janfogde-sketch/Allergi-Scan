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
