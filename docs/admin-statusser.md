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
